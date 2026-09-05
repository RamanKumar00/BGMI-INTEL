import React, { useEffect, useState } from 'react';
import { Trophy, X, Activity, Target } from 'lucide-react';
import { getMatch } from '../services/api';

export default function MatchDetailModal({ matchId, onClose }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getMatch(matchId);
      if (data) {
        // Sort players by finishes, then damage
        if (data.statistics) {
          data.statistics.sort((a, b) => (b.finishes || 0) - (a.finishes || 0) || (b.damage || 0) - (a.damage || 0));
        }
        setMatchData(data);
      }
      setLoading(false);
    }
    load();
  }, [matchId]);

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-content" style={{ maxWidth: '600px' }}>
        <button type="button" className="db-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading match details...</div>
        ) : matchData ? (
          <div>
            <div className="db-modal-header mb-6">
              <h2 className="text-2xl font-black italic tracking-wide text-white uppercase" style={{ fontFamily: 'var(--font-heading)' }}>
                Match #{matchData.match_number || 1} <span style={{ color: 'var(--color-orange-primary)' }}>{matchData.map || 'Erangel'}</span>
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {matchData.stage} • {matchData.date} • Winner: {matchData.winner_team_id || 'Unknown'}
              </p>
            </div>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-orange-500" /> Top Performers (MVP)
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {matchData.statistics && matchData.statistics.length > 0 ? (
                matchData.statistics.slice(0, 10).map((stat, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between items-center hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-black italic text-orange-500" style={{ fontFamily: 'var(--font-heading)' }}>#{idx + 1}</div>
                      <div>
                        <div className="font-bold text-white uppercase tracking-wider">{stat.ign}</div>
                        <div className="text-xs text-gray-400">Player ID: {stat.player_id.substring(0, 8)}...</div>
                      </div>
                    </div>
                    <div className="flex gap-6 text-sm font-semibold">
                      <div className="flex flex-col items-end">
                        <span className="text-gray-400 flex items-center gap-1"><Target size={12}/> Finishes</span>
                        <span className="text-white text-lg">{stat.finishes || 0}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-gray-400 flex items-center gap-1"><Activity size={12}/> Damage</span>
                        <span className="text-white text-lg">{Math.round(stat.damage || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">No player statistics available for this match.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-red-400">Failed to load match details.</div>
        )}
      </div>
    </div>
  );
}
