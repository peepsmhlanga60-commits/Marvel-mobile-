import React from 'react';
import { Combatant } from '../game/types';
import { MatchState } from '../game/GameEngine';
import { HEROES } from '../game/heroes';
import { Trophy, RotateCcw, Home, Skull, Target } from 'lucide-react';

interface EndGameModalProps {
  matchState: MatchState;
  player: Combatant;
  onRematch: () => void;
  onReturnToTitle: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  matchState,
  player,
  onRematch,
  onReturnToTitle,
}) => {
  const isVictory = matchState.status === 'victory';
  const hero = HEROES[player.heroId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none">
      <div className="relative w-full max-w-lg bg-slate-950 border-4 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 w-72 h-72 rounded-full blur-3xl opacity-30 ${
            isVictory ? 'bg-amber-400' : 'bg-red-600'
          }`}
        />

        {/* Comic Winner / Defeat Title */}
        <div className="relative z-10 flex flex-col items-center mb-6">
          <span className="text-6xl mb-2">{isVictory ? '🏆' : '💀'}</span>
          <h1
            className={`font-comic font-black text-6xl tracking-wider ${
              isVictory
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]'
                : 'text-red-500 drop-shadow-[0_4px_12px_rgba(239,68,68,0.5)]'
            }`}
          >
            {isVictory ? 'VICTORY!' : 'DEFEAT'}
          </h1>
          <p className="text-sm font-mono text-slate-300 mt-1">
            {isVictory
              ? 'Blue squad secured the objective point!'
              : 'Red squad captured the objective arena.'}
          </p>
        </div>

        {/* Player Match Performance Card */}
        <div className="relative z-10 w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{hero.emoji}</span>
              <div className="text-left">
                <span className="font-comic font-black text-lg text-white block">
                  {hero.name}
                </span>
                <span className="text-xs text-amber-400 font-bold">{hero.role}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">MVP SCORE</span>
              <span className="font-black text-xl text-cyan-300 font-mono">
                {Math.round(player.stats.damageDealt + player.stats.kills * 150)}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-3 text-center font-mono">
            <div className="bg-slate-950/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block">ELIMINATIONS</span>
              <span className="font-black text-xl text-emerald-400">{player.stats.kills}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block">DAMAGE DEALT</span>
              <span className="font-black text-xl text-amber-400">
                {Math.round(player.stats.damageDealt)}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl">
              <span className="text-[10px] text-slate-400 block">DEATHS</span>
              <span className="font-black text-xl text-red-400">{player.stats.deaths}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex items-center gap-3 w-full">
          <button
            onClick={onReturnToTitle}
            className="flex-1 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>TITLE MENU</span>
          </button>

          <button
            onClick={onRematch}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base font-comic tracking-wider flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
