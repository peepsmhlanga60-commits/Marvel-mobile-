import React, { useState, useEffect } from 'react';
import { Combatant, KillfeedEvent } from '../game/types';
import { HEROES } from '../game/heroes';
import { MatchState } from '../game/GameEngine';
import { getPlatformBadge } from '../game/crossplay';
import { Shield, Heart, Zap, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';

interface HUDProps {
  player: Combatant;
  matchState: MatchState;
  killfeed: KillfeedEvent[];
  lastHitCrit: boolean | null;
  lastElimination: Combatant | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenScoreboard: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  matchState,
  killfeed,
  lastHitCrit,
  lastElimination,
  isMuted,
  onToggleMute,
  onOpenSettings,
  onOpenScoreboard,
}) => {
  const hero = HEROES[player.heroId];
  const [hitFeedback, setHitFeedback] = useState<boolean>(false);
  const [elimBanner, setElimBanner] = useState<Combatant | null>(null);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);

  // Platform badge
  const platBadge = getPlatformBadge(player.platform);

  // Trigger hit marker on hit
  useEffect(() => {
    if (lastHitCrit !== null) {
      setHitFeedback(true);
      const timer = setTimeout(() => setHitFeedback(false), 140);
      return () => clearTimeout(timer);
    }
  }, [lastHitCrit]);

  // Trigger elimination banner
  useEffect(() => {
    if (lastElimination) {
      setElimBanner(lastElimination);
      const timer = setTimeout(() => setElimBanner(null), 2400);
      return () => clearTimeout(timer);
    }
  }, [lastElimination]);

  const healthPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
  const shieldPercent = player.maxShield > 0 ? Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100)) : 0;

  // Format timer
  const minutes = Math.floor(matchState.matchTimer / 60);
  const seconds = Math.floor(matchState.matchTimer % 60);
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 font-hud">
      {/* 1. TOP HEADER: Capture Point Contest Bar & Timer */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-950/85 border border-slate-700/80 rounded-xl px-4 py-1.5 shadow-xl">
          {/* Blue Team Score & Capture % */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400">BLUE</span>
            <div className="w-24 h-3 rounded-full bg-slate-800 overflow-hidden border border-blue-900">
              <div
                className="h-full bg-blue-500 transition-all duration-150"
                style={{ width: `${matchState.blueCapturePercent}%` }}
              />
            </div>
            <span className="text-sm font-black text-blue-300 tabular-nums">
              {Math.floor(matchState.blueCapturePercent)}%
            </span>
          </div>

          {/* Center Match Clock & Contest Warning */}
          <div className="mx-2 flex flex-col items-center">
            <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
              {formattedTime}
            </span>
            {matchState.isContested && (
              <span className="text-[10px] font-black text-amber-400 tracking-wider">
                CONTESTED!
              </span>
            )}
          </div>

          {/* Red Team Score & Capture % */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-red-400 tabular-nums">
              {Math.floor(matchState.redCapturePercent)}%
            </span>
            <div className="w-24 h-3 rounded-full bg-slate-800 overflow-hidden border border-red-900">
              <div
                className="h-full bg-red-500 transition-all duration-150"
                style={{ width: `${matchState.redCapturePercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-red-400">RED</span>
          </div>
        </div>
      </div>

      {/* 2. TOP-LEFT: Player Identity Cluster (Health, Shield, Hero, Platform) */}
      <div className="absolute top-3 left-4 flex items-center gap-3 pointer-events-auto">
        {/* Hero Portrait with comic border */}
        <div
          className="relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg border-2"
          style={{ borderColor: hero.color, backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
        >
          <span>{hero.emoji}</span>
          {/* Platform badge */}
          <span
            className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${platBadge.bg} ${platBadge.text}`}
          >
            {platBadge.icon} {platBadge.label}
          </span>
        </div>

        {/* Health & Shield Bar */}
        <div className="flex flex-col gap-1 w-36">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-white tracking-wide">{hero.name}</span>
            <span className="text-slate-400 text-[10px] tabular-nums">
              {player.ping}ms · {hero.role}
            </span>
          </div>

          {/* Health Bar */}
          <div className="relative w-full h-3 rounded bg-slate-900/90 border border-slate-700 overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                healthPercent < 30 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>

          {/* Shield Bar (if hero has shield) */}
          {player.maxShield > 0 && (
            <div className="relative w-full h-1.5 rounded bg-slate-900/80 border border-cyan-800/60 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-100"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 tabular-nums">
            <div className="flex items-center gap-1">
              <Heart className="w-2.5 h-2.5 text-emerald-400" />
              <span>{Math.round(player.health)}</span>
            </div>
            {player.shield > 0 && (
              <div className="flex items-center gap-1 text-cyan-300">
                <Shield className="w-2.5 h-2.5" />
                <span>{Math.round(player.shield)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. TOP-RIGHT: Cross-Platform Killfeed */}
      <div className="absolute top-12 right-4 flex flex-col gap-1.5 items-end max-w-xs pointer-events-none">
        {killfeed.slice(-4).map((kf) => {
          const killerHero = HEROES[kf.killerHero];
          const victimHero = HEROES[kf.victimHero];
          const killerBadge = getPlatformBadge(kf.killerPlatform);
          const victimBadge = getPlatformBadge(kf.victimPlatform);

          return (
            <div
              key={kf.id}
              className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded px-2.5 py-1 text-[11px] shadow-md"
            >
              <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${killerBadge.bg} ${killerBadge.text}`}>
                {killerBadge.icon}
              </span>
              <span className="font-bold text-blue-300 truncate max-w-[70px]">
                {kf.killerName}
              </span>
              <span className="text-xs">{killerHero.emoji}</span>
              <span className="text-amber-400 font-bold px-1">
                {kf.isHeadshot ? '💥 CRIT' : '➔'}
              </span>
              <span className="text-xs">{victimHero.emoji}</span>
              <span className="font-bold text-red-300 truncate max-w-[70px]">
                {kf.victimName}
              </span>
              <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${victimBadge.bg} ${victimBadge.text}`}>
                {victimBadge.icon}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. MARVEL RIVALS TEAM-UP SYNERGY BANNER (Top Center Sub-bar) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-gradient-to-r from-blue-950/90 via-cyan-950/90 to-blue-950/90 border border-cyan-400/50 rounded-lg px-3 py-1 flex items-center gap-2 shadow-lg">
          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-black text-cyan-200 uppercase tracking-wider">
            TEAM-UP ACTIVE: {hero.synergyName} ({HEROES[hero.synergyHeroId].name})
          </span>
        </div>
      </div>

      {/* 5. CENTER DYNAMIC CROSSHAIR & HIT FEEDBACK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-8 h-8 flex items-center justify-center">
          {/* Subtle center ring */}
          <div className="w-2 h-2 rounded-full border border-cyan-300/60" />
          {/* Tick lines */}
          <div className="absolute -top-3 w-0.5 h-2 bg-cyan-400/80" />
          <div className="absolute -bottom-3 w-0.5 h-2 bg-cyan-400/80" />
          <div className="absolute -left-3 h-0.5 w-2 bg-cyan-400/80" />
          <div className="absolute -right-3 h-0.5 w-2 bg-cyan-400/80" />

          {/* Hit Flash Cross */}
          {hitFeedback && (
            <div
              className={`absolute inset-0 flex items-center justify-center font-black text-lg ${
                lastHitCrit ? 'text-red-500 scale-125' : 'text-amber-400'
              }`}
            >
              ✕
            </div>
          )}
        </div>
      </div>

      {/* 6. CENTER ELIMINATION BANNER */}
      {elimBanner && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
          <div className="bg-gradient-to-r from-transparent via-red-950/90 to-transparent px-8 py-2 border-y-2 border-red-500 flex flex-col items-center">
            <span className="text-xl font-black font-comic tracking-widest text-red-400">
              ELIMINATED
            </span>
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <span>{HEROES[elimBanner.heroId].emoji}</span>
              <span>{elimBanner.name}</span>
              <span className="text-amber-400 font-mono text-xs">+100</span>
            </div>
          </div>
        </div>
      )}

      {/* 7. MINIMAL UTILITY PERIMETER CONTROLS */}
      <div className="absolute top-3 left-48 pointer-events-auto flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 active:scale-95"
          title="Toggle Audio"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        <button
          onClick={onOpenScoreboard}
          className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-xs font-bold text-slate-200 active:scale-95"
          title="View Scoreboard (TAB)"
        >
          SCORE
        </button>

        <button
          onClick={onOpenSettings}
          className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-xs font-bold text-slate-200 active:scale-95"
          title="Settings / Controls"
        >
          SETTINGS
        </button>
      </div>

      {/* 8. COLLAPSIBLE BOTTOM STATUS CLUSTER */}
      <div
        className={`absolute bottom-2 left-1/2 -translate-x-1/2 transition-transform duration-200 pointer-events-auto flex flex-col items-center ${
          hudCollapsed ? 'translate-y-12' : 'translate-y-0'
        }`}
      >
        <button
          onClick={() => setHudCollapsed(!hudCollapsed)}
          className="px-3 py-0.5 rounded-t bg-slate-900/90 border-t border-x border-slate-700 text-[10px] text-slate-400 hover:text-white"
        >
          {hudCollapsed ? '▴ SHOW AMMO' : '▾ HIDE'}
        </button>

        <div className="bg-slate-950/85 border border-slate-800 rounded-lg px-4 py-1.5 flex items-center gap-4 text-xs font-mono shadow-xl">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px]">WEAPON:</span>
            <span className="font-bold text-white">{hero.primaryWeapon.name}</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[10px]">AMMO:</span>
            <span className="font-black text-amber-300 tabular-nums">
              {player.ammo} / {hero.primaryWeapon.maxAmmo}
            </span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[10px]">CROSSPLAY:</span>
            <span className="font-bold text-cyan-400">PS5 · PC · MOBILE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
