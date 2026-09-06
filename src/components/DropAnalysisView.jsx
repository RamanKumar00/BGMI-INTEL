import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Flame, 
  Shield, 
  Trophy, 
  Crosshair, 
  RefreshCw, 
  Layers, 
  Eye, 
  Zap, 
  Search, 
  BarChart3, 
  TrendingUp, 
  ChevronRight, 
  Clock, 
  Swords, 
  ArrowUpRight,
  Filter,
  Activity,
  AlertCircle
} from 'lucide-react';
import { 
  getDropsSummary, 
  getDropsHeatmap, 
  getDropsLocations, 
  getTeamDropProfile, 
  getDropsContests, 
  getDropsClashMatrix, 
  getDropsHistory,
  getTournaments,
  getTeams
} from '../services/api';

const MAP_ASSETS = {
  Erangel: '/maps/erangel.png',
  Miramar: '/maps/miramar.png',
  Rondo: '/maps/rondo.png'
};

export default function DropAnalysisView({ season, onNavigateToMatch }) {
  // Filter States
  const [selectedMap, setSelectedMap] = useState('All');
  const [selectedTournament, setSelectedTournament] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [selectedTeamId, setSelectedTeamId] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  
  // Data States
  const [tournamentsList, setTournamentsList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [locationsTable, setLocationsTable] = useState([]);
  const [teamProfile, setTeamProfile] = useState(null);
  const [contests, setContests] = useState([]);
  const [clashMatrix, setClashMatrix] = useState([]);
  const [history, setHistory] = useState({ total: 0, page: 1, records: [] });
  const [historyPage, setHistoryPage] = useState(1);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [mapMode, setMapMode] = useState('HEATMAP'); // HEATMAP, TEAM_DROPS, CONTESTS
  const [locationSearch, setLocationSearch] = useState('');
  const [locSortField, setLocSortField] = useState('drops');
  const [locSortAsc, setLocSortAsc] = useState(false);
  const [activeTab, setActiveTab] = useState('performance'); // performance, team_profiles, contests, clash_matrix, history
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Active Map for visual rendering (fallback to Erangel if 'All' selected)
  const activeMapName = selectedMap === 'All' ? 'Erangel' : selectedMap;

  // Load Tournaments & Teams for filter dropdowns
  useEffect(() => {
    async function loadMeta() {
      try {
        const [tData, tmData] = await Promise.all([getTournaments(), getTeams()]);
        setTournamentsList(tData || []);
        setTeamsList(tmData || []);
      } catch (e) {
        console.error('Error loading filter options:', e);
      }
    }
    loadMeta();
  }, []);

  // Fetch all Drop Analytics data when filters change
  useEffect(() => {
    let isMounted = true;
    async function loadAnalytics() {
      setLoading(true);
      try {
        const filterParams = {
          map: selectedMap,
          tournament_id: selectedTournament,
          stage: selectedStage,
          team_id: selectedTeamId,
          location: selectedLocation
        };

        const [sumRes, heatRes, locRes, contRes, clashRes, histRes] = await Promise.all([
          getDropsSummary(filterParams),
          getDropsHeatmap(filterParams),
          getDropsLocations(filterParams),
          getDropsContests(filterParams),
          getDropsClashMatrix(filterParams),
          getDropsHistory({ ...filterParams, page: historyPage, page_size: 15 })
        ]);

        if (isMounted) {
          setSummary(sumRes);
          setHeatmapPoints(heatRes || []);
          setLocationsTable(locRes || []);
          setContests(contRes || []);
          setClashMatrix(clashRes || []);
          setHistory(histRes || { total: 0, page: 1, records: [] });
        }

        // If a specific team is selected or we default to the top team
        if (selectedTeamId && selectedTeamId !== 'All') {
          const prof = await getTeamDropProfile(selectedTeamId, filterParams);
          if (isMounted) setTeamProfile(prof);
        } else if (teamsList.length > 0 && !teamProfile) {
          const prof = await getTeamDropProfile(teamsList[0].team_id, filterParams);
          if (isMounted) setTeamProfile(prof);
        }
      } catch (err) {
        console.error('Error fetching drop analytics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAnalytics();
    return () => { isMounted = false; };
  }, [selectedMap, selectedTournament, selectedStage, selectedTeamId, selectedLocation, historyPage]);

  // Load team profile on team select
  const handleSelectTeamProfile = async (tId) => {
    setSelectedTeamId(tId);
    try {
      const prof = await getTeamDropProfile(tId, { map: selectedMap, tournament_id: selectedTournament });
      setTeamProfile(prof);
    } catch (e) {
      console.error(e);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedMap('All');
    setSelectedTournament('All');
    setSelectedStage('All');
    setSelectedTeamId('All');
    setSelectedLocation('All');
    setLocationSearch('');
    setHistoryPage(1);
  };

  // Sorted and filtered location list
  const filteredLocations = useMemo(() => {
    return locationsTable
      .filter(l => !locationSearch || l.location.toLowerCase().includes(locationSearch.toLowerCase()))
      .sort((a, b) => {
        let aVal = a[locSortField];
        let bVal = b[locSortField];
        if (typeof aVal === 'string') {
          return locSortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return locSortAsc ? (aVal - bVal) : (bVal - aVal);
      });
  }, [locationsTable, locationSearch, locSortField, locSortAsc]);

  const handleSortLocations = (field) => {
    if (locSortField === field) {
      setLocSortAsc(!locSortAsc);
    } else {
      setLocSortField(field);
      setLocSortAsc(false);
    }
  };

  return (
    <div className="db-subview-container drop-analysis-container" style={{ paddingBottom: '4rem' }}>
      {/* ── View Header ────────────────────────────────────────── */}
      <div className="db-subview-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="db-subview-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Crosshair className="text-orange-500" size={32} />
            DROP <span>ANALYSIS</span>
          </h1>
          <p className="db-subview-subtitle">
            Tactical landing telemetry, drop consistency, and spawn clash intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="db-subview-badge flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            TELEMETRY PIPELINE ACTIVE ({summary?.total_drops || 0} DROPS ANALYZED)
          </div>
        </div>
      </div>

      {/* ── Macro KPI Summary Cards ────────────────────────────── */}
      <div className="analytics-kpi-deck">
        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">ANALYZED MATCHES</span>
          <div className="analytics-kpi-value">{summary?.total_matches || 0}</div>
          <span className="analytics-kpi-sub text-emerald-400">100% Verified</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">TEAMS ANALYZED</span>
          <div className="analytics-kpi-value text-orange-400">{summary?.total_teams || 0}</div>
          <span className="analytics-kpi-sub text-orange-400">Pro Rosters</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">MAPS MONITORED</span>
          <div className="analytics-kpi-value text-blue-400">{summary?.total_maps || 3}</div>
          <span className="analytics-kpi-sub text-blue-400">Erangel • Miramar • Rondo</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">RECORDED DROPS</span>
          <div className="analytics-kpi-value text-amber-400">{summary?.total_drops || 0}</div>
          <span className="analytics-kpi-sub text-amber-400">Tactical Coordinates</span>
        </div>
        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">MOST POPULAR DROP</span>
          <div className="analytics-kpi-value text-orange-400 truncate text-lg" title={summary?.most_popular_drop?.location}>
            {summary?.most_popular_drop?.location || 'N/A'}
          </div>
          <span className="analytics-kpi-sub text-gray-300">
            {summary?.most_popular_drop?.count || 0} drops ({summary?.most_popular_drop?.percentage || 0}%)
          </span>
        </div>
        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">MOST CONTESTED</span>
          <div className="analytics-kpi-value text-red-400 truncate text-lg" title={summary?.most_contested_drop?.location}>
            {summary?.most_contested_drop?.location || 'N/A'}
          </div>
          <span className="analytics-kpi-sub text-red-300">
            {summary?.most_contested_drop?.contest_rate || 0}% Contest Rate
          </span>
        </div>
        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">BEST SUCCESS DROP</span>
          <div className="analytics-kpi-value text-emerald-400 truncate text-lg" title={summary?.best_performing_drop?.location}>
            {summary?.best_performing_drop?.location || 'N/A'}
          </div>
          <span className="analytics-kpi-sub text-emerald-300">
            Avg #{summary?.best_performing_drop?.avg_placement || 0} ({summary?.best_performing_drop?.win_rate || 0}% Win)
          </span>
        </div>
        <div className="analytics-kpi-card">
          <span className="analytics-kpi-label">TOP CONSISTENCY</span>
          <div className="analytics-kpi-value text-purple-300 truncate text-base" title={summary?.most_consistent_team_drop?.team_name}>
            {summary?.most_consistent_team_drop?.team_name || 'N/A'}
          </div>
          <span className="analytics-kpi-sub text-purple-200 truncate">
            {summary?.most_consistent_team_drop?.location} ({summary?.most_consistent_team_drop?.consistency_pct}%)
          </span>
        </div>
      </div>

      {/* ── Global Filter Bar ──────────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 my-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
            <Filter size={14} /> FILTER INTEL STREAM
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} /> Reset Filters
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Map Select */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">Map</label>
            <select
              value={selectedMap}
              onChange={(e) => setSelectedMap(e.target.value)}
              className="w-full bg-[#12141a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="All">All Maps (Erangel, Miramar, Rondo)</option>
              <option value="Erangel">Erangel (8x8)</option>
              <option value="Miramar">Miramar (8x8)</option>
              <option value="Rondo">Rondo (8x8)</option>
            </select>
          </div>

          {/* Tournament Select */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">Tournament</label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full bg-[#12141a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="All">All Tournaments</option>
              {tournamentsList.map(t => (
                <option key={t.tournament_id} value={t.tournament_id}>{t.tournament_name}</option>
              ))}
            </select>
          </div>

          {/* Stage Select */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">Stage</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full bg-[#12141a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="All">All Stages</option>
              <option value="Grand Finals">Grand Finals</option>
              <option value="Semi Finals">Semi Finals</option>
              <option value="Survival Stage">Survival Stage</option>
              <option value="Group Stage">Group Stage</option>
            </select>
          </div>

          {/* Team Select */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">Team Focus</label>
            <select
              value={selectedTeamId}
              onChange={(e) => handleSelectTeamProfile(e.target.value)}
              className="w-full bg-[#12141a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="All">All Teams</option>
              {teamsList.map(tm => (
                <option key={tm.team_id} value={tm.team_id}>{tm.team_name}</option>
              ))}
            </select>
          </div>

          {/* Location Select */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">Location POI</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-[#12141a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="All">All Drop Locations</option>
              {locationsTable.map(loc => (
                <option key={loc.location} value={loc.location}>{loc.location} ({loc.drops} drops)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Main Tactical Map & Interactive Canvas ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-4">
        {/* Map Canvas Column */}
        <div className="lg:col-span-8 bg-[#0d0f15] border border-white/10 rounded-2xl p-4 flex flex-col relative overflow-hidden">
          {/* Map Toolbar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
                TACTICAL RADAR — {activeMapName.toUpperCase()}
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 font-mono">
                {heatmapPoints.length} LANDINGS
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setMapMode('HEATMAP')}
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  mapMode === 'HEATMAP' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Flame size={12} className="inline mr-1" /> Heatmap
              </button>
              <button
                onClick={() => setMapMode('TEAM_DROPS')}
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  mapMode === 'TEAM_DROPS' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Crosshair size={12} className="inline mr-1" /> Team Pins
              </button>
              <button
                onClick={() => setMapMode('CONTESTS')}
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                  mapMode === 'CONTESTS' ? 'bg-red-600 text-white shadow-lg animate-pulse' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Swords size={12} className="inline mr-1" /> Contests
              </button>
            </div>
          </div>

          {/* Interactive Map Visual Port */}
          <div 
            className="relative w-full aspect-square bg-[#0b0c10] rounded-xl overflow-hidden border border-white/10 select-none cursor-crosshair shadow-2xl"
            style={{ maxHeight: '640px' }}
          >
            {/* Map Background Layer */}
            <img 
              src={MAP_ASSETS[activeMapName] || MAP_ASSETS.Erangel} 
              alt={activeMapName} 
              className="w-full h-full object-cover pointer-events-none opacity-85 brightness-95"
            />

            {/* Tactical Grid Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '12.5% 12.5%'
              }}
            />

            {/* SVG Interactive Markers & Heat Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
              <defs>
                <radialGradient id="heatGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff5500" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#ff9900" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ff9900" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="contestGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ff0044" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#ff0000" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ff0000" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Render Heatmap Circles */}
              {mapMode === 'HEATMAP' && heatmapPoints.map((pt, idx) => (
                <circle
                  key={`heat_${pt.id || idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={pt.is_contested ? 3.5 : 2.5}
                  fill={pt.is_contested ? 'url(#contestGlow)' : 'url(#heatGlow)'}
                  opacity={0.7}
                />
              ))}

              {/* Render Contest Hotspots */}
              {mapMode === 'CONTESTS' && contests.map((c, idx) => {
                const locObj = locationsTable.find(l => l.location === c.location);
                const cx = locObj?.x || 50;
                const cy = locObj?.y || 50;
                return (
                  <g key={`contest_${idx}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4.5}
                      fill="url(#contestGlow)"
                      className="animate-ping"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3.0}
                      fill="#ff1133"
                      stroke="#fff"
                      strokeWidth="0.5"
                    />
                    <text
                      x={cx}
                      y={cy - 3.8}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="2.4"
                      fontWeight="bold"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                    >
                      {c.location} ({c.contests}⚔)
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Render Team Drop Interactive HTML Markers */}
            {mapMode !== 'HEATMAP' && heatmapPoints.map((pt, idx) => (
              <div
                key={`pin_${pt.id || idx}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-150 z-20 group"
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => {
                  if (pt.match_id && onNavigateToMatch) {
                    onNavigateToMatch(pt.match_id);
                  }
                }}
              >
                <div 
                  className={`w-3 h-3 rounded-full flex items-center justify-center border text-[8px] font-black ${
                    pt.is_contested 
                      ? 'bg-red-600 border-white text-white animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.8)]' 
                      : pt.placement === 1 
                        ? 'bg-amber-400 border-black text-black shadow-[0_0_8px_rgba(255,190,0,0.8)]'
                        : 'bg-orange-500 border-white text-white'
                  }`}
                >
                  {pt.placement === 1 ? '★' : pt.placement || '•'}
                </div>

                {/* Drop Pin Hover Tooltip */}
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900/95 border border-white/20 rounded-lg p-2.5 shadow-2xl z-50 pointer-events-none text-left backdrop-blur-md">
                  <div className="text-[10px] font-bold text-orange-400 uppercase">{pt.location}</div>
                  <div className="text-xs font-black text-white">{pt.team_name}</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-300">
                    <span>Placement: <strong className="text-white">#{pt.placement}</strong></span>
                    <span>Finishes: <strong className="text-orange-400">{pt.finishes}</strong></span>
                  </div>
                  {pt.is_contested && (
                    <div className="mt-1 text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Swords size={10} /> Contested Drop
                    </div>
                  )}
                  <div className="mt-1 text-[9px] text-gray-400 border-t border-white/10 pt-1">
                    Click to explore match intel
                  </div>
                </div>
              </div>
            ))}

            {/* Pinned Info Box in Corner */}
            <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2.5 text-[11px] text-gray-300 z-10 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-black" />
                <span>Winner (Rank #1)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white animate-pulse" />
                <span>Contested Spawn Clash</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white" />
                <span>Standard Landing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Intel Side Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Quick Team Profile Highlight */}
          <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-orange-400">TEAM DROP PROFILE</span>
                <h3 className="text-lg font-black text-white">{teamProfile?.team_name || 'Select Team'}</h3>
              </div>
              <Shield size={22} className="text-orange-500" />
            </div>

            {teamProfile ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2.5">
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold">Primary Drop</span>
                    <span className="text-sm font-black text-orange-400">{teamProfile.primary_drop}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">{teamProfile.drop_consistency}% Frequency</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2.5">
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold">Secondary Drop</span>
                    <span className="text-sm font-black text-white">{teamProfile.secondary_drop}</span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">Alt Strategy</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2">
                    <span className="text-[10px] text-gray-400 block">Avg Placement</span>
                    <span className="text-base font-black text-white">#{teamProfile.avg_placement}</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2">
                    <span className="text-[10px] text-gray-400 block">Avg Finishes</span>
                    <span className="text-base font-black text-orange-400">{teamProfile.avg_finishes}</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-lg p-2">
                    <span className="text-[10px] text-gray-400 block">15m Survival</span>
                    <span className="text-base font-black text-emerald-400">{teamProfile.survival_rate}%</span>
                  </div>
                </div>

                {/* Top Drops Breakdown */}
                <div>
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                    Strategic Drops Breakdown
                  </span>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                    {teamProfile.drops_breakdown?.map((db, idx) => (
                      <div key={idx} className="bg-white/5 rounded p-2 flex items-center justify-between text-xs hover:bg-white/10 transition-colors">
                        <div>
                          <strong className="text-white font-bold">{db.location}</strong>
                          <span className="text-gray-400 text-[11px] ml-1.5">({db.map})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300">Avg #{db.avg_placement}</span>
                          <span className="text-orange-400 font-bold">{db.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">Select a team above to view drop profile.</div>
            )}
          </div>

          {/* Early Game Outcomes & Drop Lifecycle */}
          <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">EARLY GAME LIFECYCLE</span>
              <Activity size={18} className="text-emerald-500" />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Phase 0: Landing to Flight</span>
                <span className="text-white font-mono font-bold">00:45 avg</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full w-[25%]" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Phase 1: Initial Loot & Scavenge</span>
                <span className="text-white font-mono font-bold">03:30 avg</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-orange-500 h-full w-[55%]" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Phase 2: First Rotation to Circle</span>
                <span className="text-white font-mono font-bold">06:00 avg</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[85%]" />
              </div>
            </div>

            <div className="mt-4 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-emerald-400 flex-shrink-0" />
              <span className="text-[11px] text-emerald-200">
                Teams surviving beyond 05:00 have an <strong>82.4%</strong> higher rate of finishing in Top 5.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Sections Navigation Tabs ────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-white/10 my-6 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'performance' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <BarChart3 size={14} /> Location Performance
        </button>
        <button
          onClick={() => setActiveTab('contests')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'contests' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <Swords size={14} /> Contest Hotspots ({contests.length})
        </button>
        <button
          onClick={() => setActiveTab('clash_matrix')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'clash_matrix' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <Layers size={14} /> Team Clash Matrix
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'history' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          <Clock size={14} /> Recorded Drop History
        </button>
      </div>

      {/* ── Tab Content: Location Performance Table ─────────────── */}
      {activeTab === 'performance' && (
        <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-black text-white">DROP LOCATION PERFORMANCE INDEX</h3>
              <p className="text-xs text-gray-400">
                Composite esports scoring based on placement (35%), survival (25%), finishes (20%), and consistency.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="Search POI (e.g. Pochinki)..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-3 cursor-pointer" onClick={() => handleSortLocations('location')}>Location POI</th>
                  <th className="py-3 px-3 cursor-pointer" onClick={() => handleSortLocations('map')}>Map</th>
                  <th className="py-3 px-3 cursor-pointer text-right" onClick={() => handleSortLocations('drops')}>Total Drops</th>
                  <th className="py-3 px-3 cursor-pointer text-right" onClick={() => handleSortLocations('teams')}>Teams</th>
                  <th className="py-3 px-3 cursor-pointer text-right" onClick={() => handleSortLocations('avg_placement')}>Avg Placement</th>
                  <th className="py-3 px-3 cursor-pointer text-right" onClick={() => handleSortLocations('avg_finishes')}>Avg Finishes</th>
                  <th className="py-3 px-3 cursor-pointer text-right" onClick={() => handleSortLocations('contest_rate')}>Contest Rate</th>
                  <th className="py-3 px-3 cursor-pointer text-right" onClick={() => handleSortLocations('success_score')}>Success Score</th>
                  <th className="py-3 px-3">Top Performing Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedLocation(loc.location)}
                    >
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                        <MapPin size={13} className="text-orange-500 flex-shrink-0" />
                        <span>{loc.location}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-400">{loc.map}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">{loc.drops}</td>
                      <td className="py-3 px-3 text-right text-gray-300">{loc.teams}</td>
                      <td className="py-3 px-3 text-right font-bold text-white">#{loc.avg_placement}</td>
                      <td className="py-3 px-3 text-right font-bold text-orange-400">{loc.avg_finishes}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          loc.contest_rate > 30 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-300'
                        }`}>
                          {loc.contest_rate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-black ${
                          loc.success_score >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                          loc.success_score >= 50 ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {loc.success_score}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-300 truncate max-w-[150px]">
                        {loc.best_team}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-gray-400">
                      No drop locations match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab Content: Contest Hotspots ───────────────────────── */}
      {activeTab === 'contests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.length > 0 ? (
            contests.map((c, idx) => (
              <div key={idx} className="bg-[#0d0f15] border border-red-500/20 rounded-2xl p-4 flex flex-col justify-between hover:border-red-500/50 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-red-400 uppercase flex items-center gap-1.5">
                      <Swords size={14} /> CONTEST CLASH HOTSPOT
                    </span>
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono font-bold">
                      {c.contests} MATCHES
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-white mb-1">{c.location}</h4>
                  <span className="text-xs text-gray-400">{c.map} Sector</span>

                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className="bg-white/5 rounded-lg p-2">
                      <span className="text-[10px] text-gray-400 block uppercase">Teams Engaged</span>
                      <span className="text-base font-black text-white">{c.teams_involved} Teams</span>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <span className="text-[10px] text-gray-400 block uppercase">Dominant Team</span>
                      <span className="text-base font-black text-orange-400 truncate block">{c.dominant_team}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>Early Wipes: <strong className="text-red-400">{c.early_eliminations}</strong></span>
                  <span>Avg Finishes: <strong className="text-white">{c.avg_finishes}</strong></span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-400 bg-white/5 rounded-2xl">
              No contested spawn clashes recorded for this selection.
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Clash Matrix ───────────────────────────── */}
      {activeTab === 'clash_matrix' && (
        <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-4">
          <div className="mb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Layers size={18} className="text-orange-500" /> TEAM-VS-TEAM DROP CLASH MATRIX
            </h3>
            <p className="text-xs text-gray-400">
              Head-to-head drop encounters between rival BGMI squads at contested landmarks.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-3">Team A</th>
                  <th className="py-3 px-3 text-center">Score / Head-to-Head</th>
                  <th className="py-3 px-3">Team B</th>
                  <th className="py-3 px-3">Clash Location</th>
                  <th className="py-3 px-3">Map</th>
                  <th className="py-3 px-3 text-right">Encounters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clashMatrix.length > 0 ? (
                  clashMatrix.map((cm, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-bold text-white">{cm.team_a}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-black text-sm bg-white/10 px-2.5 py-1 rounded">
                          <span className="text-emerald-400">{cm.team_a_wins}</span>
                          <span className="text-gray-500 mx-1.5">-</span>
                          <span className="text-orange-400">{cm.team_b_wins}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{cm.team_b}</td>
                      <td className="py-3 px-3 text-orange-400 font-semibold">{cm.location}</td>
                      <td className="py-3 px-3 text-gray-400">{cm.map}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">{cm.encounters}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">
                      No head-to-head team drop clashes recorded for current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab Content: Recorded Drop History ───────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-[#0d0f15] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-white">RECORDED DROP EVENT LOG</h3>
              <p className="text-xs text-gray-400">
                Individual team drops parsed from verified match telemetries.
              </p>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              Showing page {history.page} of {Math.ceil((history.total || 1) / 15)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-3">Tournament / Stage</th>
                  <th className="py-3 px-3">Match</th>
                  <th className="py-3 px-3">Map</th>
                  <th className="py-3 px-3">Team</th>
                  <th className="py-3 px-3">Drop POI</th>
                  <th className="py-3 px-3 text-right">Placement</th>
                  <th className="py-3 px-3 text-right">Finishes</th>
                  <th className="py-3 px-3 text-right">Contested</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.records?.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{rec.tournament_name}</div>
                      <div className="text-[10px] text-gray-400">{rec.stage} • {rec.date}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">#{rec.match_number}</td>
                    <td className="py-3 px-3 text-gray-300">{rec.map}</td>
                    <td className="py-3 px-3 font-bold text-orange-400">{rec.team_name}</td>
                    <td className="py-3 px-3 font-semibold text-white">{rec.location}</td>
                    <td className="py-3 px-3 text-right font-bold text-white">#{rec.placement}</td>
                    <td className="py-3 px-3 text-right font-bold text-orange-400">{rec.finishes}</td>
                    <td className="py-3 px-3 text-right">
                      {rec.is_contested ? (
                        <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">YES</span>
                      ) : (
                        <span className="text-gray-500 text-[10px]">NO</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          if (onNavigateToMatch) {
                            onNavigateToMatch(rec.match_id);
                          } else {
                            window.dispatchEvent(new CustomEvent('open-match-explorer', { detail: { matchId: rec.match_id } }));
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        Inspect <ArrowUpRight size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <button
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              Previous Page
            </button>
            <span className="text-xs text-gray-400">Page {historyPage}</span>
            <button
              disabled={historyPage >= Math.ceil((history.total || 1) / 15)}
              onClick={() => setHistoryPage(p => p + 1)}
              className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              Next Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
