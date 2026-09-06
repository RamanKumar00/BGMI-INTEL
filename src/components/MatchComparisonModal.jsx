import React, { useEffect, useState } from 'react';
import { X, Layers, Trophy, MapPin, Calendar, Crosshair, Swords } from 'lucide-react';
import { compareMatchesApi } from '../services/api';

export default function MatchComparisonModal({ matchIds, onClose, onSelectMatch }) {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComp() {
      setLoading(true);
      try {
        const res = await compareMatchesApi(matchIds);
        setComparisons(res || []);
      } catch (e) {
        console.error('Error comparing matches:', e);
      } finally {
        setLoading(false);
      }
    }
    if (matchIds && matchIds.length >= 2) {
      loadComp();
    }
  }, [matchIds]);

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-content" style={{ maxWidth: '1100px', width: '95%' }}>
        <button type="button" className="db-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="db-modal-header mb-4">
          <h2 className="text-xl font-black italic tracking-wide text-white uppercase flex items-center gap-2">
            <Layers className="text-orange-500" size={24} />
            MATCH COMPARISON MATRIX <span className="text-orange-400">({comparisons.length} MATCHES)</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Side-by-side comparative analysis of match pace, map terrain, winning performances, and team scores.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Comparing match telemetries...</div>
        ) : comparisons.length === 0 ? (
          <div className="p-8 text-center text-red-400 text-sm">Failed to load comparison data.</div>
        ) : (
          <div className="space-y-6">
            {/* Top Match Summaries Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(comparisons.length, 4)} gap-4`}>
              {comparisons.map((m, idx) => {
                const winner = m.standings?.find(s => s.placement === 1);
                const totalFinishes = m.standings?.reduce((sum, s) => sum + (s.finishes || 0), 0) || 0;
                return (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-mono uppercase">
                          MATCH #{m.match_number || idx + 1}
                        </span>
                        <span className="text-xs text-gray-400 font-semibold">{m.map}</span>
                      </div>
                      <h4 className="text-sm font-black text-white truncate" title={m.tournament_name}>
                        {m.tournament_name}
                      </h4>
                      <span className="text-[11px] text-gray-400 block mb-3">{m.stage} • {m.date}</span>

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 mb-3">
                        <span className="text-[10px] text-amber-400 font-bold uppercase block flex items-center gap-1">
                          <Trophy size={11} /> Match Winner
                        </span>
                        <span className="text-sm font-black text-white">{winner?.team_name || 'TBD'}</span>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          {winner?.finishes || 0} Finishes • {winner?.total_points || 0} Pts
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="bg-white/5 rounded p-1.5">
                          <span className="text-[10px] text-gray-400 block">Total Finishes</span>
                          <span className="font-mono font-bold text-orange-400">{totalFinishes}</span>
                        </div>
                        <div className="bg-white/5 rounded p-1.5">
                          <span className="text-[10px] text-gray-400 block">Teams</span>
                          <span className="font-mono font-bold text-white">{m.total_teams || 16}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectMatch) onSelectMatch(m.match_id);
                      }}
                      className="mt-4 w-full py-1.5 rounded bg-white/10 hover:bg-orange-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Inspect Match Intel
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Side-by-side Standings Matrix */}
            <div className="bg-[#0d0f15] border border-white/10 rounded-xl p-4 overflow-hidden">
              <h3 className="text-sm font-black text-white mb-3 uppercase tracking-wider">
                Top 8 Leaderboard Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Rank</th>
                      {comparisons.map((m, idx) => (
                        <th key={idx} className="py-2.5 px-3">
                          Match #{m.match_number} ({m.map})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
                      <tr key={rank} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-orange-400">#{rank}</td>
                        {comparisons.map((m, idx) => {
                          const team = m.standings?.find(s => s.placement === rank);
                          return (
                            <td key={idx} className="py-2 px-3">
                              {team ? (
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-white truncate max-w-[140px]" title={team.team_name}>
                                    {team.team_name}
                                  </span>
                                  <span className="font-mono text-gray-400 text-[11px]">
                                    <strong className="text-orange-400">{team.finishes}f</strong> / {team.total_points}pts
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
