import React, { useState } from 'react';
import { HeroId, Platform } from '../game/types';
import { HEROES } from '../game/heroes';
import { Play, Settings, Shield, Zap, Sparkles, ChevronRight, Swords } from 'lucide-react';

interface TitleScreenProps {
  selectedHeroId: HeroId;
  onSelectHero: (id: HeroId) => void;
  selectedPlatform: Platform;
  onSelectPlatform: (platform: Platform) => void;
  onStartGame: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedHeroId,
  onSelectHero,
  selectedPlatform,
  onSelectPlatform,
  onStartGame,
  onOpenSettings,
}) => {
  const [selectedTab, setSelectedTab] = useState<'heroes' | 'synergies'>('heroes');
  const currentHero = HEROES[selectedHeroId];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden bg-gradient-to-b from-[#080d22] via-[#050814] to-[#02040a]">
      {/* Background comic dot pattern */}
      <div className="absolute inset-0 comic-dots opacity-40 pointer-events-none" />

      {/* Atmospheric lighting glows */}
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ backgroundColor: currentHero.color }}
      />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 bg-blue-600 pointer-events-none" />

      {/* 1. TOP HEADER: Cross-Platform Live Status & Quick Settings */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-xs font-semibold text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>CROSSPLAY LOBBY: PS5 · PC · MOBILE ACTIVE</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300">
            <span>REGION:</span>
            <span className="font-bold text-white">GLOBAL MATCH (18ms)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* User Platform Selector */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onSelectPlatform('mobile')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                selectedPlatform === 'mobile' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              📱 Mobile Touch
            </button>
            <button
              onClick={() => onSelectPlatform('ps5')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                selectedPlatform === 'ps5' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🎮 PS5
            </button>
            <button
              onClick={() => onSelectPlatform('pc')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                selectedPlatform === 'pc' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🖥️ PC
            </button>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. CENTER: BESPOKE INLINE SVG TITLE LOCKUP & HERO CENTERPIECE */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-2">
        {/* Bespoke Comic SVG Title Lockup */}
        <div className="max-w-xl w-full mb-3">
          <svg viewBox="0 0 620 115" className="w-full h-auto drop-shadow-2xl">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
            </defs>

            {/* Comic Background Shadow text */}
            <text
              x="310"
              y="68"
              textAnchor="middle"
              className="font-comic font-black"
              fontSize="68"
              fill="#020617"
              stroke="#0f172a"
              strokeWidth="12"
              letterSpacing="4"
            >
              HERO RIVALS
            </text>

            {/* Main Title Text */}
            <text
              x="310"
              y="68"
              textAnchor="middle"
              className="font-comic font-black"
              fontSize="68"
              fill="url(#titleGrad)"
              stroke="#ffffff"
              strokeWidth="2.5"
              letterSpacing="4"
            >
              HERO RIVALS
            </text>

            {/* Sub-badge: CROSSFIRE MOBILE EDITION */}
            <rect x="170" y="82" width="280" height="24" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <text
              x="310"
              y="99"
              textAnchor="middle"
              className="font-comic font-bold"
              fontSize="16"
              fill="url(#goldGrad)"
              letterSpacing="2.5"
            >
              CROSSFIRE · MOBILE RELEASE
            </text>
          </svg>
        </div>

        <p className="text-slate-300 text-xs sm:text-sm max-w-lg mb-6 leading-relaxed">
          High-octane 3D superhero team shooter. Team up, trigger devastating dynamic synergies, and dominate the arena across PS5, PC, and Mobile!
        </p>

        {/* HERO ROSTER CAROUSEL */}
        <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 shadow-2xl mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              SELECT COMBAT HERO ({Object.keys(HEROES).length})
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">ROLE:</span>
              <span className="font-bold text-amber-400">{currentHero.role}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {Object.values(HEROES).map((h) => {
              const isSelected = h.id === selectedHeroId;
              return (
                <button
                  key={h.id}
                  onClick={() => onSelectHero(h.id)}
                  className={`relative p-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-2 border-cyan-400 shadow-lg scale-105'
                      : 'bg-slate-950/60 border border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="text-3xl mb-1">{h.emoji}</span>
                  <span className="font-comic font-bold text-sm tracking-wide text-white">
                    {h.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {h.role}
                  </span>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Hero Showcase Pill */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base">{currentHero.name}</span>
                <span className="text-xs text-slate-400 font-medium">— {currentHero.title}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                {currentHero.lore}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs">
                <span className="text-slate-400 text-[10px] block">PRIMARY</span>
                <span className="font-bold text-cyan-300">{currentHero.primaryWeapon.name}</span>
              </div>
              <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs">
                <span className="text-slate-400 text-[10px] block">ULTIMATE</span>
                <span className="font-bold text-amber-300">{currentHero.ultimate.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY START CTA BUTTON */}
        <button
          onClick={onStartGame}
          className="group relative px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-amber-500 hover:from-blue-500 hover:to-amber-400 text-slate-950 font-black text-xl font-comic tracking-widest shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 border-2 border-white/60"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>ENTER THE ARENA (SPACE / TAP)</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 3. BOTTOM: SINGLE FLAT CONTROL-HINT LINE (Mandatory game craft guideline) */}
      <div className="relative z-10 text-center border-t border-slate-800/60 pt-3">
        <p className="text-xs text-slate-400 font-mono">
          WASD Move · Left Stick · Space / Tap Jump · Left Click / Fire · Shift / E Abilities · Q Ultimate · Esc Pause
        </p>
      </div>
    </div>
  );
};
