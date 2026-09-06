import React, { useEffect, useState, useMemo } from 'react';
import { 
  MapPin, 
  RefreshCw, 
  Trophy, 
  Calendar, 
  Search, 
  Filter, 
  Layers, 
  Grid, 
  List, 
  ArrowUpRight, 
  Target, 
  Crosshair, 
  Swords, 
  CheckSquare, 
  Square,
  Sparkles
} from 'lucide-react';
import { getMatches, getTournaments } from '../services/api';
import MatchDetailModal from './MatchDetailModal';
import MatchComparisonModal from './MatchComparisonModal';

export default function MatchesView({ season }) {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  
  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTournament, setSelectedTournament] = useState('All');
  const [selectedMap, setSelectedMap] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState('GRID'); // GRID or TABLE

  // Multi-Match Comparison
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Listen for open-match-explorer event from DropAnalysis or other views
  useEffect(() => {
    const handleOpenMatch = (e) => {
      if (e.detail?.matchId) {
        setSelectedMatchId(e.detail.matchId);
      }
    };
    window.addEventListener('open-match-explorer', handleOpenMatch);
    return () => window.removeEventListener('open-match-explorer', handleOpenMatch);
  }, []);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [mData, tData] = await Promise.all([getMatches(), getTournaments()]);
        setMatches(mData || []);
        setTournaments(tData || []);
      } catch (err) {
        console.error('Error loading matches data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter & Sort Logic
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // Season filter
      if (season && season !== 'All') {
        if (!m.date || !m.date.startsWith(season.toString())) return false;
      }
      // Tournament filter
      if (selectedTournament !== 'All' && m.tournament_id !== selectedTournament) {
        return false;
      }
      // Map filter
      if (selectedMap !== 'All' && m.map !== selectedMap) {
        return false;
      }
      // Stage filter
      if (selectedStage !== 'All' && m.stage !== selectedStage) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (m.match_id || '').toLowerCase();
        const tourName = (m.tournament_name || '').toLowerCase();
        const stage = (m.stage || '').toLowerCase();
        const map = (m.map || '').toLowerCase();
        const winner = (m.winner_team_name || '').toLowerCase();
        if (!matchId.includes(q) && !tourName.includes(q) && !stage.includes(q) && !map.includes(q) && !winner.includes(q)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return (b.date || '').localeCompare(a.date || '') || (b.match_number || 0) - (a.match_number || 0);
      }
      if (sortBy === 'date_asc') {
        return (a.date || '').localeCompare(b.date || '') || (a.match_number || 0) - (b.match_number || 0);
      }
      if (sortBy === 'finishes_desc') {
        return (b.total_finishes || 0) - (a.total_finishes || 0);
      }
      if (sortBy === 'match_num_desc') {
        return (b.match_number || 0) - (a.match_number || 0);
      }
      return 0;
    });
  }, [matches, season, selectedTournament, selectedMap, selectedStage, searchQuery, sortBy]);

  // Toggle match comparison selection
  const toggleCompare = (e, matchId) => {
    e.stopPropagation();
    setSelectedForCompare(prev => {
      if (prev.includes(matchId)) {
        return prev.filter(id => id !== matchId);
      } else {
        if (prev.length >= 4) {
          alert('You can compare a maximum of 4 matches at once.');
          return prev;
        }
        return [...prev, matchId];
      }
    });
  };

  const clearCompare = () => setSelectedForCompare([]);

  return (
    <div className="db-subview-container" style={{ paddingBottom: '5rem' }}>
      {/* ── View Header ────────────────────────────────────────── */}
      <div className="db-subview-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="db-subview-title flex items-center gap-2.5">
            <Crosshair className="text-orange-500" size={32} />
            MATCH <span>EXPLORER</span>
          </h1>
          <p className="db-subview-subtitle">
            Comprehensive match intelligence, full 16-team scorecards, and tactical zone progressions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="db-subview-badge flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            TELEMETRY ARCHIVE ({filteredMatches.length} MATCHES)
          </div>
        </div>
      </div>

      {/* ── Search & Filter Suite ──────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 my-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Tournament, Stage, Map (e.g. Erangel), or Winner..."
              className="w-full bg-[#12141a] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#12141a] border border-white/10 rounded-xl p-1 self-end md:self-auto">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                viewMode === 'GRID' ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
              title="Grid Cards"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 ${
                viewMode === 'TABLE' ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
              title="Dense Table"
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">Tournament</label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full bg-[#12141a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="All">All Tournaments</option>
              {tournaments.map(t => (
                <option key={t.tournament_id} value={t.tournament_id}>{t.tournament_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">Map</label>
            <select
              value={selectedMap}
              onChange={(e) => setSelectedMap(e.target.value)}
              className="w-full bg-[#12141a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="All">All Maps</option>
              <option value="Erangel">Erangel (8x8)</option>
              <option value="Miramar">Miramar (8x8)</option>
              <option value="Rondo">Rondo (8x8)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">Stage</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full bg-[#12141a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="All">All Stages</option>
              <option value="Grand Finals">Grand Finals</option>
              <option value="Semi Finals">Semi Finals</option>
              <option value="Survival Stage">Survival Stage</option>
              <option value="Group Stage">Group Stage</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#12141a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="date_desc">Date (Newest First)</option>
              <option value="date_asc">Date (Oldest First)</option>
              <option value="finishes_desc">Total Finishes (Highest First)</option>
              <option value="match_num_desc">Match Number (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Persistent Match Compare Bar ───────────────────────── */}
      {selectedForCompare.length > 0 && (
        <div className="sticky top-4 z-40 my-3 p-3 bg-orange-600/90 backdrop-blur-md border border-orange-400/50 rounded-2xl shadow-2xl flex items-center justify-between text-white animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Layers size={18} />
            <span>{selectedForCompare.length} Matches Selected for Comparison</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearCompare}
              className="px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-xs font-bold transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={selectedForCompare.length < 2}
              onClick={() => setShowCompareModal(true)}
              className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-amber-300 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              Compare {selectedForCompare.length} Matches Side-by-Side
            </button>
          </div>
        </div>
      )}

      {/* ── Content Presentation: Grid vs Table ────────────────── */}
      {loading ? (
        <div className="db-state-box">
          <RefreshCw className="animate-spin text-orange-500" size={24} />
          <span>Synchronizing verified match telemetry...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="db-state-box">
          No matches found matching your filters. Try resetting the criteria above.
        </div>
      ) : viewMode === 'GRID' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((m) => {
            const isSelected = selectedForCompare.includes(m.match_id);
            return (
              <div 
                key={m.match_id} 
                className={`bg-[#0d0f15] border rounded-2xl p-4 flex flex-col justify-between hover:border-orange-500/50 transition-all cursor-pointer group shadow-lg ${
                  isSelected ? 'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500' : 'border-white/10'
                }`}
                onClick={() => setSelectedMatchId(m.match_id)}
              >
                <div>
                  {/* Card Top Row */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded uppercase">
                        MATCH #{m.match_number || 1}
                      </span>
                      <span className="text-xs text-gray-300 font-bold flex items-center gap-1">
                        <MapPin size={12} className="text-orange-500" />
                        {m.map || 'Erangel'}
                      </span>
                    </div>

                    {/* Compare Select Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => toggleCompare(e, m.match_id)}
                      className="text-gray-400 hover:text-orange-400 transition-colors p-1"
                      title={isSelected ? 'Deselect from comparison' : 'Select to compare'}
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-orange-500" />
                      ) : (
                        <Square size={18} className="text-gray-500 group-hover:text-gray-300" />
                      )}
                    </button>
                  </div>

                  {/* Tournament & Stage */}
                  <h3 className="text-base font-black text-white group-hover:text-orange-400 transition-colors truncate" title={m.tournament_name}>
                    {m.tournament_name}
                  </h3>
                  <span className="text-xs text-gray-400 block mb-3 font-medium">
                    {m.stage} • {m.date}
                  </span>

                  {/* Winner Banner */}
                  <div className="bg-amber-400/10 border border-amber-400/25 rounded-xl p-2.5 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-black font-black text-xs">
                        <Trophy size={13} />
                      </div>
                      <div>
                        <span className="text-[9px] text-amber-400 uppercase font-black block tracking-wider">CHICKEN DINNER</span>
                        <strong className="text-xs text-white font-black">{m.winner_team_name}</strong>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-300/80 font-mono font-bold">10 Place Pts</span>
                  </div>

                  {/* Match Stats Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs mb-2">
                    <div className="bg-white/5 rounded-lg p-2">
                      <span className="text-[10px] text-gray-400 block uppercase">Squads</span>
                      <span className="font-mono font-black text-white">{m.total_teams || 16} Teams</span>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <span className="text-[10px] text-gray-400 block uppercase">Total Kills</span>
                      <span className="font-mono font-black text-orange-400">{m.total_finishes || 0} Finishes</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="border-t border-white/5 pt-3 mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span className="font-mono text-[10px] text-gray-500">Source: {m.source}</span>
                  <button
                    type="button"
                    className="text-orange-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1"
                  >
                    Inspect Intel <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DENSE TABLE VIEW */
        <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">Compare</th>
                  <th className="py-3 px-3">Tournament / Stage</th>
                  <th className="py-3 px-3">Match</th>
                  <th className="py-3 px-3">Map</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Winner (1st)</th>
                  <th className="py-3 px-3 text-right">Finishes</th>
                  <th className="py-3 px-3 text-right">Teams</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMatches.map((m) => {
                  const isSelected = selectedForCompare.includes(m.match_id);
                  return (
                    <tr 
                      key={m.match_id} 
                      className={`hover:bg-white/5 transition-colors cursor-pointer ${
                        isSelected ? 'bg-orange-500/10' : ''
                      }`}
                      onClick={() => setSelectedMatchId(m.match_id)}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => toggleCompare(e, m.match_id)}>
                        {isSelected ? (
                          <CheckSquare size={16} className="text-orange-500 inline" />
                        ) : (
                          <Square size={16} className="text-gray-500 hover:text-gray-300 inline" />
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{m.tournament_name}</div>
                        <div className="text-[10px] text-gray-400">{m.stage}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-orange-400">#{m.match_number}</td>
                      <td className="py-3 px-3 font-medium text-gray-300">{m.map}</td>
                      <td className="py-3 px-3 font-mono text-gray-400">{m.date}</td>
                      <td className="py-3 px-3 font-bold text-amber-400 flex items-center gap-1.5">
                        <Trophy size={12} /> {m.winner_team_name}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-orange-400">{m.total_finishes}</td>
                      <td className="py-3 px-3 text-right font-mono text-gray-300">{m.total_teams}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded bg-white/5 hover:bg-orange-500 hover:text-white transition-all font-bold text-[11px]"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Match Detail Modal / Match Analysis Center ─────────── */}
      {selectedMatchId && (
        <MatchDetailModal
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
        />
      )}

      {/* ── Match Comparison Modal ─────────────────────────────── */}
      {showCompareModal && (
        <MatchComparisonModal
          matchIds={selectedForCompare}
          onClose={() => setShowCompareModal(false)}
          onSelectMatch={(mid) => {
            setShowCompareModal(false);
            setSelectedMatchId(mid);
          }}
        />
      )}
    </div>
  );
}
