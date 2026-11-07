import React from 'react';
import { GameSettings } from '../game/types';
import { X, Sliders, Volume2, Gamepad2, Smartphone, Monitor } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none">
      <div className="relative w-full max-w-lg bg-slate-950 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="font-comic font-black text-2xl tracking-wider text-white">
              GAME & CONTROL SETTINGS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs font-mono">
          {/* Touch Aim Sensitivity */}
          <div className="flex flex-col gap-1.5 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">TOUCH / MOUSE SENSITIVITY</span>
              <span className="text-cyan-400 font-bold tabular-nums">
                {settings.touchSensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="3.0"
              step="0.1"
              value={settings.touchSensitivity}
              onChange={(e) => onUpdateSettings({ touchSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Aim Assist Toggle */}
          <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="font-bold text-slate-200 block">MOBILE AIM ASSIST</span>
              <span className="text-[10px] text-slate-400">
                Helps track dynamic superhero dashes on mobile touch screens
              </span>
            </div>
            <button
              onClick={() => onUpdateSettings({ aimAssist: !settings.aimAssist })}
              className={`px-3 py-1.5 rounded-lg font-bold ${
                settings.aimAssist ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.aimAssist ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Auto-Fire Toggle */}
          <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="font-bold text-slate-200 block">AUTO-FIRE ON TARGET</span>
              <span className="text-[10px] text-slate-400">
                Automatically discharge primary weapons when crosshair is locked onto foes
              </span>
            </div>
            <button
              onClick={() => onUpdateSettings({ autoFire: !settings.autoFire })}
              className={`px-3 py-1.5 rounded-lg font-bold ${
                settings.autoFire ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.autoFire ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Crossplay Toggle */}
          <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="font-bold text-slate-200 block">CROSS-PLATFORM MATCHMAKING</span>
              <span className="text-[10px] text-slate-400">
                Pool with PS5, PC, and Mobile players across global servers
              </span>
            </div>
            <button
              onClick={() => onUpdateSettings({ crossplayEnabled: !settings.crossplayEnabled })}
              className={`px-3 py-1.5 rounded-lg font-bold ${
                settings.crossplayEnabled ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.crossplayEnabled ? 'ON (PS5/PC/MOBILE)' : 'MOBILE ONLY'}
            </button>
          </div>

          {/* Sound Controls */}
          <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-200">PROCEDURAL GAME AUDIO</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ sfxMuted: !settings.sfxMuted })}
              className={`px-3 py-1.5 rounded-lg font-bold ${
                !settings.sfxMuted ? 'bg-emerald-600 text-white' : 'bg-red-900 text-red-200'
              }`}
            >
              {!settings.sfxMuted ? 'UNMUTED' : 'MUTED'}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
