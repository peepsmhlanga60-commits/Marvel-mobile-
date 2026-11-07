import React from 'react';
import { Combatant } from '../game/types';
import { HEROES } from '../game/heroes';
import { getPlatformBadge } from '../game/crossplay';
import { MatchState } from '../game/GameEngine';
import { X, Trophy, Swords } from 'lucide-react';

interface ScoreboardModalProps {
  roster: Combatant[];
  matchState: MatchState;
  onClose: () => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({ roster, matchState, onClose }) => {
  const blueTeam = roster.filter((c) => c.team === 'blue');
  const redTeam = roster.filter((c) => c.team === 'red');

  const renderTeamTable = (team: Combatant[], teamColor: 'blue' | 'red') => (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center justify-between pb-1 border-b ${teamColor === 'blue' ? 'border-blue-500/40 text-blue-400' : 'border-red-500/40 text-red-400'}`}>
        <span className="font-comic font-black text-lg tracking-wider">
          {teamColor === 'blue' ? 'BLUE SQUAD (ALLIES)' : 'RED SQUAD (RIVALS)'}
        </span>
        <span className="text-xs font-mono font-bold text-slate-300">
          Capture: {teamColor === 'blue' ? Math.floor(matchState.blueCapturePercent) : Math.floor(matchState.redCapturePercent)}%
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {team.map((c) => {
          const hero = HEROES[c.heroId];
          const badge = getPlatformBadge(c.platform);

          return (
            <div
              key={c.id}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-mono ${
                c.isLocalPlayer
                  ? 'bg-blue-950/70 border-cyan-400 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              {/* Player identity */}
              <div className="flex items-center gap-2">
                <span className="text-xl">{hero.emoji}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${badge.bg} ${badge.text}`}>
                  {badge.icon} {badge.label}
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-white flex items-center gap-1">
                    {c.name}
                    {c.isLocalPlayer && <span className="text-[10px] text-cyan-300 font-normal">(YOU)</span>}
                  </span>
                  <span className="text-[10px] text-slate-400">{hero.name} · {hero.role}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 tabular-nums">
                <div className="text-center">
                  <span className="text-[9px] text-slate-500 block">K / D / A</span>
                  <span className="font-bold text-white">
                    {c.stats.kills} / {c.stats.deaths} / {c.stats.assists}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-slate-500 block">DAMAGE</span>
                  <span className="font-bold text-amber-400">{Math.round(c.stats.damageDealt)}</span>
                </div>
                <div className="text-center w-12">
                  <span className="text-[9px] text-slate-500 block">PING</span>
                  <span className="text-slate-400">{c.ping}ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none">
      <div className="relative w-full max-w-2xl bg-slate-950 border-2 border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-comic font-black text-2xl tracking-wider text-white">
              MATCH SCOREBOARD · CROSSPLAY 3v3
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Both Teams */}
        <div className="flex flex-col gap-6">
          {renderTeamTable(blueTeam, 'blue')}
          {renderTeamTable(redTeam, 'red')}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800 pt-3">
          <span>Crossplay Engine v1.0.4 · Ranked Conquest</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            CLOSE (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
