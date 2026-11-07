import React from 'react';
import { HeroId } from '../game/types';
import { HEROES } from '../game/heroes';
import { X, Check } from 'lucide-react';

interface HeroSelectModalProps {
  currentHeroId: HeroId;
  onSelectHero: (heroId: HeroId) => void;
  onClose: () => void;
}

export const HeroSelectModal: React.FC<HeroSelectModalProps> = ({
  currentHeroId,
  onSelectHero,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none">
      <div className="relative w-full max-w-xl bg-slate-950 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-comic font-black text-2xl tracking-wider text-white">
              CHANGE HERO
            </h2>
            <p className="text-xs text-slate-400">
              Adapt your team composition to counter enemy heroes and trigger team-up synergies!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.values(HEROES).map((h) => {
            const isSelected = h.id === currentHeroId;
            return (
              <button
                key={h.id}
                onClick={() => {
                  onSelectHero(h.id);
                  onClose();
                }}
                className={`relative p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                  isSelected
                    ? 'bg-blue-950/80 border-cyan-400 ring-2 ring-cyan-400/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                }`}
              >
                <span className="text-4xl mb-1">{h.emoji}</span>
                <span className="font-comic font-black text-base text-white tracking-wide">
                  {h.name}
                </span>
                <span className="text-[10px] text-amber-400 font-bold mb-1">
                  {h.role}
                </span>
                <span className="text-[10px] text-slate-400 line-clamp-1">
                  {h.primaryWeapon.name}
                </span>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-800 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
          >
            CANCEL (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
