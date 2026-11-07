import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Combatant } from '../game/types';
import { HEROES } from '../game/heroes';
import { Zap, Shield, Flame, RotateCcw, Crosshair, ArrowUp, Sparkles, Swords } from 'lucide-react';

interface TouchControlsProps {
  player: Combatant;
  onMoveChange: (vector: { x: number; y: number }) => void;
  onAimDelta: (delta: { x: number; y: number }) => void;
  onFireStart: () => void;
  onFireEnd: () => void;
  onJump: () => void;
  onAbility1: () => void;
  onAbility2: () => void;
  onUltimate: () => void;
  onReload: () => void;
  onMelee: () => void;
  onToggleHeroSwitch: () => void;
  aimAssist: boolean;
  onToggleAimAssist: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  player,
  onMoveChange,
  onAimDelta,
  onFireStart,
  onFireEnd,
  onJump,
  onAbility1,
  onAbility2,
  onUltimate,
  onReload,
  onMelee,
  onToggleHeroSwitch,
  aimAssist,
  onToggleAimAssist,
}) => {
  const hero = HEROES[player.heroId];

  // Virtual Joystick State
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState<boolean>(false);
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Aim Drag State
  const aimTouchIdRef = useRef<number | null>(null);
  const lastAimPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Joystick touch handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    setIsJoystickActive(true);

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      joystickCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  };

  const handleJoystickTouchMove = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        const dx = touch.clientX - joystickCenterRef.current.x;
        const dy = touch.clientY - joystickCenterRef.current.y;
        const maxRadius = 45;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let clampedX = dx;
        let clampedY = dy;
        if (dist > maxRadius) {
          clampedX = (dx / dist) * maxRadius;
          clampedY = (dy / dist) * maxRadius;
        }

        setJoystickPos({ x: clampedX, y: clampedY });

        // Normalize to [-1, 1], with Y inverted so up is positive Z
        const normX = clampedX / maxRadius;
        const normY = -clampedY / maxRadius;
        onMoveChange({ x: normX, y: normY });
        break;
      }
    }
  }, [onMoveChange]);

  const handleJoystickTouchEnd = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setIsJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        onMoveChange({ x: 0, y: 0 });
        break;
      }
    }
  }, [onMoveChange]);

  // Aim Drag Touch Handlers
  const handleAimTouchStart = (e: React.TouchEvent) => {
    if (aimTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    aimTouchIdRef.current = touch.identifier;
    lastAimPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleAimTouchMove = useCallback((e: TouchEvent) => {
    if (aimTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === aimTouchIdRef.current) {
        const dx = touch.clientX - lastAimPosRef.current.x;
        const dy = touch.clientY - lastAimPosRef.current.y;
        lastAimPosRef.current = { x: touch.clientX, y: touch.clientY };

        onAimDelta({ x: dx, y: dy });
        break;
      }
    }
  }, [onAimDelta]);

  const handleAimTouchEnd = useCallback((e: TouchEvent) => {
    if (aimTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === aimTouchIdRef.current) {
        aimTouchIdRef.current = null;
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('touchmove', handleJoystickTouchMove, { passive: false });
    window.addEventListener('touchend', handleJoystickTouchEnd);
    window.addEventListener('touchcancel', handleJoystickTouchEnd);

    window.addEventListener('touchmove', handleAimTouchMove, { passive: false });
    window.addEventListener('touchend', handleAimTouchEnd);
    window.addEventListener('touchcancel', handleAimTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleJoystickTouchMove);
      window.removeEventListener('touchend', handleJoystickTouchEnd);
      window.removeEventListener('touchcancel', handleJoystickTouchEnd);

      window.removeEventListener('touchmove', handleAimTouchMove);
      window.removeEventListener('touchend', handleAimTouchEnd);
      window.removeEventListener('touchcancel', handleAimTouchEnd);
    };
  }, [handleJoystickTouchMove, handleJoystickTouchEnd, handleAimTouchMove, handleAimTouchEnd]);

  const isUltReady = player.ultimateCharge >= 100;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      {/* LEFT ZONE: Virtual Joystick Container */}
      <div
        className="absolute bottom-6 left-6 w-36 h-36 flex items-center justify-center pointer-events-auto touch-none"
        onTouchStart={handleJoystickTouchStart}
      >
        <div
          ref={joystickBaseRef}
          className={`relative w-28 h-28 rounded-full border-2 border-cyan-400/40 bg-slate-900/40 flex items-center justify-center transition-colors ${
            isJoystickActive ? 'border-cyan-400 bg-cyan-950/40' : ''
          }`}
        >
          {/* Inner stick knob */}
          <div
            className="w-12 h-12 rounded-full bg-cyan-500/80 border-2 border-white shadow-lg flex items-center justify-center"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
        </div>
      </div>

      {/* RIGHT ZONE: Aim Drag Touch Surface (Transparent right half of screen) */}
      <div
        className="absolute top-16 right-0 bottom-44 left-1/3 pointer-events-auto touch-none"
        onTouchStart={handleAimTouchStart}
      />

      {/* TACTICAL MOBILE ACTION BUTTONS (Bottom-Right Cluster) */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex items-end gap-3 touch-none">
        {/* Left column of tactical actions: Melee, Reload, Switch Hero */}
        <div className="flex flex-col gap-2 items-center">
          {/* Hero Switch Button */}
          <button
            onClick={onToggleHeroSwitch}
            className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-600 text-xs font-bold text-slate-300 flex flex-col items-center justify-center active:scale-95 shadow-md"
            title="Switch Hero (H)"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-[9px] uppercase tracking-wider">HERO</span>
          </button>

          {/* Quick Melee Strike */}
          <button
            onClick={onMelee}
            className="w-12 h-12 rounded-full bg-slate-800/85 border-2 border-amber-500/60 text-amber-400 flex flex-col items-center justify-center active:scale-90 shadow-md"
            title="Melee Attack (V / F)"
          >
            <Swords className="w-5 h-5" />
            <span className="text-[8px] font-bold">MELEE</span>
          </button>

          {/* Reload Button with Ammo */}
          <button
            onClick={onReload}
            disabled={player.isReloading}
            className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center active:scale-90 shadow-md ${
              player.ammo <= 5
                ? 'bg-red-900/80 border-red-500 text-red-300 animate-pulse'
                : 'bg-slate-800/85 border-slate-600 text-slate-300'
            }`}
            title="Reload (R)"
          >
            <RotateCcw className={`w-4 h-4 ${player.isReloading ? 'animate-spin' : ''}`} />
            <span className="text-[9px] font-bold tabular-nums">
              {player.isReloading ? '...' : `${player.ammo}`}
            </span>
          </button>
        </div>

        {/* Ability 1, Ability 2, and Jump Ring */}
        <div className="flex flex-col gap-2.5 items-center">
          {/* Ability 1 */}
          <div className="relative">
            <button
              onClick={onAbility1}
              disabled={player.ability1Cooldown > 0}
              className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center active:scale-90 shadow-lg ${
                player.ability1Cooldown > 0
                  ? 'bg-slate-900/80 border-slate-700 text-slate-500'
                  : 'bg-blue-600/90 border-cyan-400 text-white'
              }`}
              title={`${hero.ability1.name} (Shift)`}
            >
              <Zap className="w-5 h-5" />
              <span className="text-[9px] font-bold">AB 1</span>
            </button>
            {player.ability1Cooldown > 0 && (
              <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center text-cyan-300 font-bold text-sm tabular-nums">
                {player.ability1Cooldown.toFixed(1)}s
              </div>
            )}
          </div>

          {/* Ability 2 */}
          <div className="relative">
            <button
              onClick={onAbility2}
              disabled={player.ability2Cooldown > 0}
              className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center active:scale-90 shadow-lg ${
                player.ability2Cooldown > 0
                  ? 'bg-slate-900/80 border-slate-700 text-slate-500'
                  : 'bg-indigo-600/90 border-indigo-400 text-white'
              }`}
              title={`${hero.ability2.name} (E)`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-[9px] font-bold">AB 2</span>
            </button>
            {player.ability2Cooldown > 0 && (
              <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center text-cyan-300 font-bold text-sm tabular-nums">
                {player.ability2Cooldown.toFixed(1)}s
              </div>
            )}
          </div>

          {/* Jump / Thruster */}
          <button
            onClick={onJump}
            className="w-14 h-14 rounded-full bg-cyan-600/85 border-2 border-cyan-300 text-white flex flex-col items-center justify-center active:scale-90 shadow-lg"
            title="Jump (Space)"
          >
            <ArrowUp className="w-6 h-6" />
            <span className="text-[9px] font-bold">JUMP</span>
          </button>
        </div>

        {/* PRIMARY FIRE & ULTIMATE COLUMN */}
        <div className="flex flex-col gap-3 items-center ml-1">
          {/* Glowing Comic Marvel Rivals Ultimate Button */}
          <button
            onClick={onUltimate}
            disabled={!isUltReady}
            className={`relative w-16 h-16 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-xl overflow-hidden ${
              isUltReady
                ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 border-2 border-yellow-200 text-slate-950 font-black ring-4 ring-yellow-400/50'
                : 'bg-slate-900/80 border-2 border-slate-700 text-slate-400'
            }`}
            title={`${hero.ultimate.name} (Q)`}
          >
            <Flame className={`w-6 h-6 ${isUltReady ? 'text-slate-950' : 'text-amber-500'}`} />
            <span className="text-[9px] font-black uppercase tracking-tight">
              {isUltReady ? 'ULT READY' : `${Math.floor(player.ultimateCharge)}%`}
            </span>
          </button>

          {/* Giant Primary Fire Button */}
          <button
            onTouchStart={onFireStart}
            onTouchEnd={onFireEnd}
            onMouseDown={onFireStart}
            onMouseUp={onFireEnd}
            className="w-20 h-20 rounded-full bg-red-600/90 border-4 border-amber-400 text-white flex flex-col items-center justify-center active:scale-90 shadow-2xl transition-transform"
            title="Primary Fire (L-Click / Tap)"
          >
            <Crosshair className="w-8 h-8 text-amber-200" />
            <span className="text-[10px] font-black tracking-wider uppercase">FIRE</span>
          </button>
        </div>
      </div>

      {/* Quick Settings Pill on Top Right */}
      <div className="absolute top-3 right-4 pointer-events-auto flex items-center gap-2">
        <button
          onClick={onToggleAimAssist}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border transition-colors ${
            aimAssist
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>AIM ASSIST: {aimAssist ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};
