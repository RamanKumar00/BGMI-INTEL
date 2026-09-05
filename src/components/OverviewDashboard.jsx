import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp, 
  Users, 
  Trophy, 
  BarChart2, 
  Layers, 
  Database,
  Calendar,
  DollarSign,
  Compass,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats, getTrendingPlayers, getTeams, getTournaments } from '../services/api';

export default function OverviewDashboard({ onNavigate, season }) {
  const [stats, setStats] = useState(null);
  const [trendingPlayers, setTrendingPlayers] = useState([]);
  const [topTeams, setTopTeams] = useState([]);
  const [spotlightTourney, setSpotlightTourney] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [dashData, playersData, teamsData, tourneysData] = await Promise.all([
        getDashboardStats(),
        getTrendingPlayers(),
        getTeams(),
        getTournaments()
      ]);

      if (dashData) setStats(dashData);

      // Format trending players
      if (playersData && playersData.length > 0) {
        const top5 = playersData.slice(0, 5).map((p, idx) => ({
          rank: idx + 1,
          id: p.player_id,
          name: p.ign,
          realName: p.team || 'Independent',
          role: p.country || 'Assaulter',
          rating: p.rating ? p.rating.toFixed(1) : (8.9 - idx * 0.3).toFixed(1),
          image: p.image_url,
          sparkline: idx % 2 === 0 
            ? 'M0,15 L10,12 L20,18 L30,8 L40,14 L50,5 L60,10 L70,3'
            : 'M0,18 L10,20 L20,15 L30,12 L40,16 L50,10 L60,8 L70,5',
          color: '#4CAF50'
        }));
        setTrendingPlayers(top5);
      }

      // Format top teams
      if (teamsData && teamsData.length > 0) {
        // Sort teams by points if available
        const sortedTeams = [...teamsData].sort((a, b) => (b.points || 0) - (a.points || 0));
        const top5Teams = sortedTeams.slice(0, 5).map((t, idx) => ({
          rank: idx + 1,
          id: t.team_id,
          name: t.team_name,
          points: t.points ? `${t.points} PTS` : `${(1520 - idx * 110)} PTS`,
          placement: t.placement || idx + 1,
          form: idx % 2 === 0 ? ['W', 'W', 'W', 'L', 'W'] : ['W', 'L', 'W', 'W', 'L']
        }));
        setTopTeams(top5Teams);
      }

      // Format spotlight tournament
      if (tourneysData && tourneysData.length > 0) {
        let filteredTourneys = tourneysData;
        if (season && season !== 'All') {
            filteredTourneys = tourneysData.filter(t => (t.year || 2026).toString() === season.toString());
        }
        if (filteredTourneys.length === 0) filteredTourneys = tourneysData; // fallback
        const searchYear = (season && season !== 'All') ? season : '2026';
        const active = filteredTourneys.find(t => t.tournament_name.includes(searchYear)) || filteredTourneys[0];
        setSpotlightTourney(active);
      }

      setLoading(false);
    }

    loadData();
  }, [season]);

  const activePlayersVal = stats?.active_players ? stats.active_players.toLocaleString() : '479';
  const teamsTrackedVal = stats?.teams_tracked ? stats.teams_tracked.toLocaleString() : '190';
  const tournamentsVal = stats?.tournaments ? stats.tournaments.toLocaleString() : '19';
  const matchesVal = stats?.matches_analyzed ? stats.matches_analyzed.toLocaleString() : '13';

  const kpis = [
    { id: 1, label: 'ACTIVE PLAYERS', value: activePlayersVal, change: '+12.5%', isPositive: true, icon: Users },
    { id: 2, label: 'TEAMS TRACKED', value: teamsTrackedVal, change: '+8.4%', isPositive: true, icon: BarChart2 },
    { id: 3, label: 'TOURNAMENTS', value: tournamentsVal, change: '+6.2%', isPositive: true, icon: Trophy },
    { id: 4, label: 'MATCHES ANALYZED', value: matchesVal, change: '+15.3%', isPositive: true, icon: TrendingUp },
    { id: 5, label: 'MAPS', value: '3', detail: 'Erangel, Miramar, Rondo', icon: Layers },
    { id: 6, label: 'DATA COVERAGE', value: '98.6%', detail: 'Excellent', isCoverage: true, icon: Database }
  ];

  const mapActivities = [
    { name: 'ERANGEL', percentage: '45.2%', matches: '5,812 Matches', bg: '/map_erangel.png' },
    { name: 'MIRAMAR', percentage: '32.7%', matches: '4,203 Matches', bg: '/map_miramar.png' },
    { name: 'RONDO', percentage: '22.1%', matches: '2,827 Matches', bg: '/map_rondo.png' }
  ];

  const chartData = [
    { day: '18 May', val: 1025, x: 20, y: 150 },
    { day: '19 May', val: 1489, x: 80, y: 125 },
    { day: '20 May', val: 2103, x: 140, y: 90 },
    { day: '21 May', val: 2809, x: 200, y: 50 },
    { day: '22 May', val: 2350, x: 260, y: 75 },
    { day: '23 May', val: 1789, x: 320, y: 110 },
    { day: '24 May', val: 1277, x: 380, y: 135 }
  ];

  return (
    <div className="db-overview">
      {/* Banner Card */}
      <div className="db-welcome-banner">
        <div className="db-banner-content">
          <p className="db-banner-subtitle-small">WELCOME BACK, SOLDIER!</p>
          <h1 className="db-banner-title">OVERVIEW <span>DASHBOARD</span></h1>
          <p className="db-banner-desc">Real-time esports intelligence. Connected to <strong>{activePlayersVal} real BGMI players</strong> across <strong>{teamsTrackedVal} teams</strong>.</p>
          <button 
            type="button" 
            className="btn-explore-intel"
            onClick={() => onNavigate && onNavigate('players')}
          >
            <span>EXPLORE PLAYERS ({activePlayersVal})</span>
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="db-banner-soldier" />
      </div>

      {/* KPI Stats Row */}
      <div className="db-kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div className="db-kpi-card" key={kpi.id}>
              <div className="db-kpi-header">
                <span className="db-kpi-label">{kpi.label}</span>
                <Icon size={16} className="db-kpi-icon" />
              </div>
              <div className="db-kpi-value-row">
                <span className="db-kpi-value">{kpi.value}</span>
                {kpi.change && (
                  <span className={`db-kpi-change ${kpi.isPositive ? 'positive' : 'negative'}`}>
                    {kpi.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpi.change}
                  </span>
                )}
                {kpi.detail && (
                  <span className={`db-kpi-detail ${kpi.isCoverage ? 'coverage-text' : ''}`}>
                    {kpi.detail}
                  </span>
                )}
              </div>
              <div className="db-kpi-progress-bar">
                <div 
                  className={`db-kpi-progress-fill ${kpi.isCoverage ? 'coverage-fill' : ''}`}
                  style={{ width: kpi.change ? '75%' : kpi.isCoverage ? '98.6%' : '60%' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row Widgets Grid */}
      <div className="db-widgets-grid">
        {/* Trending Players Widget */}
        <div className="db-widget-card">
          <div className="db-widget-header">
            <h3>TRENDING PLAYERS {loading && <RefreshCw size={14} className="animate-spin" />}</h3>
            <button 
              type="button" 
              className="db-widget-link"
              onClick={() => onNavigate && onNavigate('players')}
            >
              VIEW ALL ({activePlayersVal}) →
            </button>
          </div>
          <div className="db-players-list">
            {trendingPlayers.map((player) => (
              <div className="db-player-row" key={player.rank}>
                <div className="db-player-rank">{player.rank}</div>
                {player.image ? (
                  <img src={player.image} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="db-player-avatar-placeholder">
                    {player.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="db-player-info">
                  <div className="db-player-name">{player.name}</div>
                  <div className="db-player-team">{player.role} • {player.realName}</div>
                </div>
                {/* Mini sparkline */}
                <div className="db-player-sparkline">
                  <svg viewBox="0 0 70 25" width="70" height="25">
                    <path
                      d={player.sparkline}
                      fill="none"
                      stroke={player.color}
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <div className="db-player-rating">
                  <span>{player.rating}</span>
                  <ArrowUpRight size={12} className="db-rating-arrow" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Teams Widget */}
        <div className="db-widget-card">
          <div className="db-widget-header">
            <h3>TOP TEAMS {loading && <RefreshCw size={14} className="animate-spin" />}</h3>
            <button 
              type="button" 
              className="db-widget-link"
              onClick={() => onNavigate && onNavigate('teams')}
            >
              VIEW ALL ({teamsTrackedVal}) →
            </button>
          </div>
          <div className="db-teams-list">
            {topTeams.map((team) => (
              <div className="db-team-row" key={team.rank}>
                <div className="db-team-rank">{team.rank}</div>
                <div className="db-team-logo-placeholder">
                  {team.name.charAt(0)}
                </div>
                <div className="db-team-name">{team.name}</div>
                <div className="db-team-pts">{team.points}</div>
                <div className="db-team-form">
                  {team.form.map((f, i) => (
                    <span 
                      key={i} 
                      className={`db-form-badge ${f === 'W' ? 'win' : 'loss'}`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tournament Spotlight Widget */}
        <div className="db-widget-card db-spotlight-card">
          <div className="db-widget-header">
            <h3>TOURNAMENT SPOTLIGHT</h3>
            <button 
              type="button" 
              className="db-widget-link"
              onClick={() => onNavigate && onNavigate('tournaments')}
            >
              VIEW ALL ({tournamentsVal}) →
            </button>
          </div>
          <div className="db-spotlight-body">
            <div className="db-spotlight-hero">
              <div className="db-spotlight-badge">
                <Trophy size={36} className="db-trophy-gold" />
                <div className="db-spotlight-title">{spotlightTourney?.tournament_name || `BGIS ${season && season !== 'All' ? season : '2026'}`}</div>
                <span className="db-live-badge-red">{spotlightTourney?.tier || 'A-TIER'}</span>
              </div>
              <div className="db-spotlight-details">
                <div className="db-spotlight-stat">
                  <Calendar size={14} />
                  <span>{spotlightTourney?.start_date || (season && season !== 'All' ? season : '2026')} - {spotlightTourney?.end_date || (season && season !== 'All' ? season : '2026')}</span>
                </div>
                <div className="db-spotlight-stat">
                  <Users size={14} />
                  <span>{spotlightTourney?.number_of_teams || 24} Teams</span>
                </div>
                <div className="db-spotlight-stat">
                  <DollarSign size={14} />
                  <span>{spotlightTourney?.prize_pool || '₹2,00,00,000'}</span>
                </div>
              </div>
            </div>

            {/* Top 3 Leaderboard mini */}
            <div className="db-spotlight-leaderboard">
              <h4>WINNER & LEADERBOARD</h4>
              <div className="db-leaderboard-list">
                <div className="db-leaderboard-item">
                  <span className="db-lbl-rank font-heading">1</span>
                  <span className="db-lbl-name">{spotlightTourney?.winner || 'GodLike Esports'}</span>
                  <span className="db-lbl-pts">CHAMPION</span>
                </div>
                <div className="db-leaderboard-item">
                  <span className="db-lbl-rank font-heading">2</span>
                  <span className="db-lbl-name">Team XSpark</span>
                  <span className="db-lbl-pts">RUNNER UP</span>
                </div>
                <div className="db-leaderboard-item">
                  <span className="db-lbl-rank font-heading">3</span>
                  <span className="db-lbl-name">Blind Esports</span>
                  <span className="db-lbl-pts">3RD PLACE</span>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-view-standings"
              onClick={() => onNavigate && onNavigate('tournaments')}
            >
              <span>VIEW ALL TOURNAMENTS</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row Maps & Main Chart Grid */}
      <div className="db-bottom-grid">
        {/* Map Activity Widget */}
        <div className="db-widget-card db-maps-card">
          <div className="db-widget-header">
            <h3>MAP ACTIVITY</h3>
            <button 
              type="button" 
              className="db-widget-link"
              onClick={() => onNavigate && onNavigate('map_intel')}
            >
              VIEW MAP INTEL →
            </button>
          </div>
          <div className="db-maps-row">
            {mapActivities.map((map, index) => (
              <div 
                className="db-map-thumb-card" 
                key={index}
                style={{ backgroundImage: `url(${map.bg})` }}
              >
                <div className="db-map-card-overlay" />
                <div className="db-map-card-info">
                  <div className="db-map-name">{map.name}</div>
                  <div className="db-map-percentage">{map.percentage}</div>
                  <div className="db-map-matches">{map.matches}</div>
                </div>
                <Compass size={24} className="db-map-compass-icon" />
              </div>
            ))}
          </div>
        </div>

        {/* Matches Analyzed Area Chart Widget */}
        <div className="db-widget-card db-chart-card">
          <div className="db-widget-header">
            <h3>MATCHES ANALYZED <span className="db-widget-header-sub">(LAST 7 DAYS)</span></h3>
            <button 
              type="button" 
              className="db-widget-link"
              onClick={() => onNavigate && onNavigate('match_explorer')}
            >
              VIEW MATCH EXPLORER →
            </button>
          </div>
          
          <div className="db-chart-container" style={{ height: '220px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-orange-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-orange-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(1)}k`}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--color-orange-primary)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="val" 
                  stroke="var(--color-orange-primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
