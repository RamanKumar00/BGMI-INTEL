import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  X, 
  Activity, 
  Target, 
  Map, 
  Crosshair, 
  Clock, 
  Swords, 
  Radio, 
  AlertTriangle, 
  ChevronRight, 
  Users, 
  Skull,
  Shield,
  Zap
} from 'lucide-react';
import { getMatch } from '../services/api';

const MAP_ASSETS = {
  Erangel: '/maps/erangel.png',
  Miramar: '/maps/miramar.png',
  Rondo: '/maps/rondo.png'
};

export default function MatchDetailModal({ matchId, onClose }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('standings'); // standings, players, map, zones, eliminations
  const [selectedPhase, setSelectedPhase] = useState(1);
  const [playerFilter, setPlayerFilter] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getMatch(matchId);
        setMatchData(data);
      } catch (err) {
        console.error('Error loading match details:', err);
      } finally {
        setLoading(false);
      }
    }
    if (matchId) load();
  }, [matchId]);

  const handleOpenMap = () => {
    const targetMap = matchData?.overview?.map || 'Erangel';
    window.dispatchEvent(new CustomEvent('open-interactive-map', { detail: { map: targetMap } }));
    if (onClose) onClose();
  };

  const formatSeconds = (sec) => {
    if (!sec) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const overview = matchData?.overview || {};
  const standings = matchData?.standings || [];
  const players = matchData?.players || [];
  const zones = matchData?.zones || [];
  const eliminations = matchData?.eliminations || [];
  const drops = matchData?.drops || [];

  // MVP fraggers
  const topFragger = players.length > 0 ? players[0] : null;
  const topDamage = players.length > 0 ? [...players].sort((a, b) => b.damage - a.damage)[0] : null;

  return (
    <div className="db-modal-overlay">
      <div className="db-modal-content" style={{ maxWidth: '1080px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <button type="button" className="db-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {loading ? (
          <div className="p-16 text-center text-gray-400">Loading match intelligence telemetry...</div>
        ) : matchData ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* ── Modal Header & Match Hero ───────────────────────── */}
            <div className="border-b border-white/10 pb-4 mb-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                      MATCH #{overview.match_number || 1}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">
                      {overview.tournament_name}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black italic tracking-wide text-white uppercase" style={{ fontFamily: 'var(--font-heading)' }}>
                    {overview.stage} • <span className="text-orange-500">{overview.map}</span>
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    <span>Date: <strong className="text-white">{overview.date}</strong></span>
                    <span>Winner: <strong className="text-amber-400 flex-inline items-center gap-1"><Trophy size={11} className="inline mr-1" />{overview.winner_team_name}</strong></span>
                    <span>Total Finishes: <strong className="text-orange-400">{overview.total_finishes}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleOpenMap}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-all"
                  >
                    <Map size={14} /> Open Tactical Map
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('standings')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    activeTab === 'standings' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white bg-white/5'
                  }`}
                >
                  <Trophy size={13} /> Standings ({standings.length})
                </button>
                <button
                  onClick={() => setActiveTab('players')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    activeTab === 'players' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white bg-white/5'
                  }`}
                >
                  <Target size={13} /> Player Stats ({players.length})
                </button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    activeTab === 'map' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white bg-white/5'
                  }`}
                >
                  <Crosshair size={13} /> Drop Telemetry ({drops.length})
                </button>
                <button
                  onClick={() => setActiveTab('zones')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    activeTab === 'zones' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white bg-white/5'
                  }`}
                >
                  <Radio size={13} /> Zone Timeline ({zones.length})
                </button>
                <button
                  onClick={() => setActiveTab('eliminations')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    activeTab === 'eliminations' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white bg-white/5'
                  }`}
                >
                  <Swords size={13} /> Elimination Feed ({eliminations.length})
                </button>
              </div>
            </div>

            {/* ── Tab Panels (Scrollable Body) ─────────────────────── */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {/* TAB 1: STANDINGS */}
              {activeTab === 'standings' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto bg-[#0d0f15] border border-white/10 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider border-b border-white/10">
                        <tr>
                          <th className="py-2.5 px-3">Rank</th>
                          <th className="py-2.5 px-3">Team</th>
                          <th className="py-2.5 px-3">Drop Spot</th>
                          <th className="py-2.5 px-3 text-right">Finishes</th>
                          <th className="py-2.5 px-3 text-right">Place Pts</th>
                          <th className="py-2.5 px-3 text-right">Total Pts</th>
                          <th className="py-2.5 px-3 text-right">Survival</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {standings.map((t, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${
                                t.placement === 1 ? 'bg-amber-400 text-black font-black' :
                                t.placement <= 3 ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400'
                              }`}>
                                #{t.placement}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                              {t.placement === 1 && <Trophy size={13} className="text-amber-400" />}
                              <span>{t.team_name}</span>
                            </td>
                            <td className="py-2.5 px-3 text-gray-400 font-medium">
                              {t.drop_location || 'Mid-Map'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-orange-400">{t.finishes}</td>
                            <td className="py-2.5 px-3 text-right text-gray-300 font-mono">{t.placement_points}</td>
                            <td className="py-2.5 px-3 text-right font-black text-white font-mono text-sm">{t.total_points}</td>
                            <td className="py-2.5 px-3 text-right text-gray-400 font-mono">{formatSeconds(t.survival_time)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                t.placement === 1 ? 'bg-amber-400/20 text-amber-300' :
                                t.placement <= 3 ? 'bg-emerald-500/20 text-emerald-400' :
                                t.placement <= 5 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'
                              }`}>
                                {t.status || (t.placement === 1 ? 'Winner' : 'Eliminated')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: PLAYERS & MVP */}
              {activeTab === 'players' && (
                <div className="space-y-4">
                  {/* MVP Top Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {topFragger && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">
                            MATCH MVP / TOP FRAGGER
                          </span>
                          <h4 className="text-lg font-black text-white">{topFragger.ign}</h4>
                          <span className="text-xs text-gray-400">{topFragger.team_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-orange-400 font-mono">{topFragger.finishes}</span>
                          <span className="text-[10px] text-gray-400 block uppercase">Finishes</span>
                        </div>
                      </div>
                    )}
                    {topDamage && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
                            HIGHEST DAMAGE DEALT
                          </span>
                          <h4 className="text-lg font-black text-white">{topDamage.ign}</h4>
                          <span className="text-xs text-gray-400">{topDamage.team_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-blue-400 font-mono">{topDamage.damage}</span>
                          <span className="text-[10px] text-gray-400 block uppercase">Damage</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player Stats Table */}
                  <div className="overflow-x-auto bg-[#0d0f15] border border-white/10 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider border-b border-white/10">
                        <tr>
                          <th className="py-2.5 px-3">Rank</th>
                          <th className="py-2.5 px-3">Player IGN</th>
                          <th className="py-2.5 px-3">Team</th>
                          <th className="py-2.5 px-3 text-right">Finishes</th>
                          <th className="py-2.5 px-3 text-right">Damage</th>
                          <th className="py-2.5 px-3 text-right">Knocks</th>
                          <th className="py-2.5 px-3 text-right">Assists</th>
                          <th className="py-2.5 px-3 text-right">Headshots</th>
                          <th className="py-2.5 px-3 text-right">Survival</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {players.map((p, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-gray-400">#{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-white">{p.ign}</td>
                            <td className="py-2.5 px-3 text-gray-400">{p.team_name}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-orange-400">{p.finishes}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-white">{p.damage}</td>
                            <td className="py-2.5 px-3 text-right text-gray-300">{p.knocks}</td>
                            <td className="py-2.5 px-3 text-right text-gray-400">{p.assists}</td>
                            <td className="py-2.5 px-3 text-right text-gray-400">{p.headshots}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-gray-400">{formatSeconds(p.survival_time)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: TACTICAL MAP & DROPS */}
              {activeTab === 'map' && (
                <div className="space-y-4">
                  {/* Verified Data Transparency Banner */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200">
                      <strong>POSITIONAL TELEMETRY NOT AVAILABLE:</strong> Broadcast wikitext records do not provide continuous second-by-second player movement paths for this match. Verified team drop coordinates, zone circles, and elimination events are displayed.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Visual Map Canvas */}
                    <div className="md:col-span-8 bg-[#0b0c10] border border-white/10 rounded-xl overflow-hidden aspect-square relative shadow-2xl">
                      <img 
                        src={MAP_ASSETS[overview.map] || MAP_ASSETS.Erangel} 
                        alt={overview.map} 
                        className="w-full h-full object-cover pointer-events-none opacity-85"
                      />

                      {/* Drop Pins Overlay */}
                      {drops.map((d, idx) => (
                        <div
                          key={idx}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                          style={{ left: `${d.x}%`, top: `${d.y}%` }}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black border ${
                            d.placement === 1 ? 'bg-amber-400 text-black border-black shadow-[0_0_8px_rgba(255,190,0,0.9)]' :
                            d.is_contested ? 'bg-red-600 text-white border-white animate-pulse' :
                            'bg-orange-500 text-white border-white'
                          }`}>
                            {d.placement === 1 ? '★' : d.placement}
                          </div>
                          
                          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-black/90 border border-white/20 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap z-30 pointer-events-none">
                            <strong>{d.team_name}</strong> • {d.drop_location} (#{d.placement})
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Drops List */}
                    <div className="md:col-span-4 bg-[#0d0f15] border border-white/10 rounded-xl p-3 flex flex-col">
                      <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">
                        Squad Drop Sites ({drops.length})
                      </h4>
                      <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
                        {drops.map((d, idx) => (
                          <div key={idx} className="bg-white/5 rounded p-2 flex items-center justify-between text-xs hover:bg-white/10 transition-colors">
                            <div>
                              <div className="font-bold text-white truncate max-w-[130px]">{d.team_name}</div>
                              <span className="text-[10px] text-gray-400">{d.drop_location}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-orange-400">#{d.placement}</span>
                              <span className="text-[10px] text-gray-400 block">{d.finishes} kills</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ZONE TIMELINE */}
              {activeTab === 'zones' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {zones.map((z) => (
                      <button
                        key={z.phase}
                        onClick={() => setSelectedPhase(z.phase)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          selectedPhase === z.phase 
                            ? 'bg-orange-500/20 border-orange-500 text-white' 
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] font-bold block uppercase">PHASE {z.phase}</span>
                        <span className="text-base font-black font-mono text-white mt-1 block">{z.radius_m}m</span>
                        <span className="text-[10px] text-gray-400 block">{formatSeconds(z.time_seconds)}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Zone Detail Card */}
                  {zones.find(z => z.phase === selectedPhase) && (
                    <div className="bg-[#0d0f15] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                          ZONE PHASE {selectedPhase} ACTIVE STATUS
                        </span>
                        <h4 className="text-xl font-black text-white mt-0.5">
                          Radius: {zones.find(z => z.phase === selectedPhase)?.radius_m} Meters
                        </h4>
                        <span className="text-xs text-gray-400">
                          Elapsed Match Time: {formatSeconds(zones.find(z => z.phase === selectedPhase)?.time_seconds)}
                        </span>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 uppercase block">Teams Alive</span>
                          <span className="text-2xl font-black text-white font-mono">
                            {zones.find(z => z.phase === selectedPhase)?.teams_alive} / 16
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-gray-400 uppercase block">Players Alive</span>
                          <span className="text-2xl font-black text-orange-400 font-mono">
                            {zones.find(z => z.phase === selectedPhase)?.players_alive} / 64
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ELIMINATIONS */}
              {activeTab === 'eliminations' && (
                <div className="space-y-2">
                  {eliminations.map((e, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-2.5 flex items-center justify-between text-xs hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-gray-400 text-[11px]">
                          {formatSeconds(e.timestamp_seconds)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-orange-400">{e.attacker_team_name}</strong>
                          <span className="text-gray-500">eliminated</span>
                          <strong className="text-white">{e.victim_team_name}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono font-bold text-gray-300">
                          {e.weapon}
                        </span>
                        {e.is_team_wipe && (
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold uppercase flex items-center gap-1">
                            <Skull size={10} /> Squad Wipe
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-16 text-center text-red-400">Failed to load match intelligence.</div>
        )}
      </div>
    </div>
  );
}
