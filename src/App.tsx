/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GameEngine, MatchState } from './game/GameEngine';
import { Combatant, GameSettings, HeroId, KillfeedEvent, Platform } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { ScoreboardModal } from './components/ScoreboardModal';
import { HeroSelectModal } from './components/HeroSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { EndGameModal } from './components/EndGameModal';
import { sound } from './game/audio';

const DEFAULT_SETTINGS: GameSettings = {
  touchSensitivity: 1.0,
  aimAssist: true,
  autoFire: false,
  soundVolume: 0.8,
  musicMuted: false,
  sfxMuted: false,
  crossplayEnabled: true,
  showFps: true,
  controlLayout: 'default',
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level App Screen State
  const [gameState, setGameState] = useState<'title' | 'playing'>('title');

  // Selected Options
  const [selectedHeroId, setSelectedHeroId] = useState<HeroId>('volt');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('mobile');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  // In-Game Live State
  const [playerState, setPlayerState] = useState<Combatant | null>(null);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [killfeed, setKillfeed] = useState<KillfeedEvent[]>([]);
  const [lastHitCrit, setLastHitCrit] = useState<boolean | null>(null);
  const [lastElimination, setLastElimination] = useState<Combatant | null>(null);

  // Modals
  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);
  const [showHeroSelect, setShowHeroSelect] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Clean up previous engine instance
  const destroyEngine = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
  }, []);

  // Initialize or start match
  const startMatch = useCallback(() => {
    destroyEngine();

    if (!canvasMountRef.current) return;

    const engine = new GameEngine(
      canvasMountRef.current,
      selectedHeroId,
      selectedPlatform,
      'You',
      settings
    );

    engine.onStateUpdate = (player, match) => {
      setPlayerState({ ...player });
      setMatchState({ ...match });
    };

    engine.onKillfeedEvent = (event) => {
      setKillfeed((prev) => [...prev.slice(-8), event]);
    };

    engine.onHitEvent = (isCrit) => {
      setLastHitCrit(isCrit);
    };

    engine.onEliminationEvent = (victim) => {
      setLastElimination({ ...victim });
    };

    engineRef.current = engine;
    setGameState('playing');
  }, [destroyEngine, selectedHeroId, selectedPlatform, settings]);

  // Restart match (Rematch)
  const handleRematch = useCallback(() => {
    startMatch();
  }, [startMatch]);

  // Return to title screen
  const handleReturnToTitle = useCallback(() => {
    destroyEngine();
    setGameState('title');
    setPlayerState(null);
    setMatchState(null);
  }, [destroyEngine]);

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (updated.sfxMuted !== undefined) {
      sound.setMuted(updated.sfxMuted);
    }
    if (engineRef.current) {
      engineRef.current.settings = updated;
    }
  };

  // Switch Hero mid-match
  const handleSelectHeroInMatch = (heroId: HeroId) => {
    setSelectedHeroId(heroId);
    if (engineRef.current) {
      engineRef.current.switchPlayerHero(heroId);
    }
  };

  // Keyboard shortcut listener for modals
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        if (e.code === 'Tab') {
          e.preventDefault();
          setShowScoreboard((prev) => !prev);
        } else if (e.code === 'KeyH') {
          setShowHeroSelect((prev) => !prev);
        } else if (e.code === 'Escape') {
          setShowSettings((prev) => !prev);
        }
      } else if (gameState === 'title') {
        if (e.code === 'Space' || e.code === 'Enter') {
          startMatch();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState, startMatch]);

  // Teardown engine on unmount
  useEffect(() => {
    return () => {
      destroyEngine();
    };
  }, [destroyEngine]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060814] select-none text-white">
      {/* 1. ISOLATED WEBGL CANVAS MOUNT (Never unmounted by React state changes during game) */}
      <div
        ref={canvasMountRef}
        className={`absolute inset-0 z-0 ${gameState === 'playing' ? 'block' : 'hidden'}`}
      />

      {/* 2. TITLE SCREEN VIEW */}
      {gameState === 'title' && (
        <TitleScreen
          selectedHeroId={selectedHeroId}
          onSelectHero={setSelectedHeroId}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
          onStartGame={startMatch}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* 3. ACTIVE MATCH OVERLAYS (HUD & Touch Controls) */}
      {gameState === 'playing' && playerState && matchState && (
        <>
          {/* Comic World-Matched HUD */}
          <HUD
            player={playerState}
            matchState={matchState}
            killfeed={killfeed}
            lastHitCrit={lastHitCrit}
            lastElimination={lastElimination}
            isMuted={settings.sfxMuted}
            onToggleMute={() => handleUpdateSettings({ sfxMuted: !settings.sfxMuted })}
            onOpenSettings={() => setShowSettings(true)}
            onOpenScoreboard={() => setShowScoreboard(true)}
          />

          {/* Virtual Mobile Touch Controls */}
          <TouchControls
            player={playerState}
            onMoveChange={(vec) => {
              if (engineRef.current) engineRef.current.moveVector = vec;
            }}
            onAimDelta={(delta) => {
              if (engineRef.current) {
                engineRef.current.aimDelta.x += delta.x;
                engineRef.current.aimDelta.y += delta.y;
              }
            }}
            onFireStart={() => {
              if (engineRef.current) engineRef.current.isFiring = true;
            }}
            onFireEnd={() => {
              if (engineRef.current) engineRef.current.isFiring = false;
            }}
            onJump={() => engineRef.current?.triggerJump()}
            onAbility1={() => engineRef.current?.triggerAbility1()}
            onAbility2={() => engineRef.current?.triggerAbility2()}
            onUltimate={() => engineRef.current?.triggerUltimate()}
            onReload={() => engineRef.current?.triggerReload()}
            onMelee={() => engineRef.current?.triggerMelee()}
            onToggleHeroSwitch={() => setShowHeroSelect(true)}
            aimAssist={settings.aimAssist}
            onToggleAimAssist={() => handleUpdateSettings({ aimAssist: !settings.aimAssist })}
          />

          {/* End Game Modal (Victory / Defeat) */}
          {matchState.status !== 'playing' && (
            <EndGameModal
              matchState={matchState}
              player={playerState}
              onRematch={handleRematch}
              onReturnToTitle={handleReturnToTitle}
            />
          )}
        </>
      )}

      {/* 4. MODALS & DRAWERS */}
      {showScoreboard && engineRef.current && matchState && (
        <ScoreboardModal
          roster={engineRef.current.roster}
          matchState={matchState}
          onClose={() => setShowScoreboard(false)}
        />
      )}

      {showHeroSelect && (
        <HeroSelectModal
          currentHeroId={selectedHeroId}
          onSelectHero={handleSelectHeroInMatch}
          onClose={() => setShowHeroSelect(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
