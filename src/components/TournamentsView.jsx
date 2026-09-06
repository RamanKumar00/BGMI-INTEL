import React, { useEffect, useState } from 'react';
import { 
  Trophy, Flame, Calendar, DollarSign, RefreshCw, Award, MapPin, 
  Tv, ExternalLink, Shield, Crosshair, Users, CheckCircle2, XCircle, 
  Activity, Star, Layers, ChevronRight, Filter
} from 'lucide-react';
import { getTournaments, getTournamentIntel } from '../services/api';

export default function TournamentsView({ season }) {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTourneyId, setSelectedTourneyId] = useState(null);
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [intelLoading, setIntelLoading] = useState(false);
  const [viewFilter, setViewFilter] = useState('all'); // 'all', 'live', 'previous'
  const [activeStageId, setActiveStageId] = useState('playoffs');
  const [standingsFilter, setStandingsFilter] = useState('all'); // 'all', 'qualified', 'eliminated'

  // 1. Initial load of all tournaments
  useEffect(() => {
    async function loadTournaments() {
      setLoading(true);
      const data = await getTournaments();
      setTournaments(data || []);
      
      // Auto-select BGMS 2026 or first tournament
      if (data && data.length > 0) {
        const bgms = data.find(t => 
          (t.tournament_name && t.tournament_name.includes('Masters Series 2026')) ||
          t.is_ongoing || 
          t.status === 'LIVE'
        );
        const defaultId = bgms ? bgms.tournament_id : data[0].tournament_id;
        setSelectedTourneyId(defaultId);
      }
      setLoading(false);
    }
    loadTournaments();
  }, []);

  // 2. Fetch detailed intel whenever selected tournament changes
  useEffect(() => {
    if (!selectedTourneyId) return;

    async function loadIntel() {
      setIntelLoading(true);
      const data = await getTournamentIntel(selectedTourneyId);
      if (data) {
        setIntel(data);
        // Default stage to live stage or first stage
        const liveStage = data.stages?.find(s => s.status === 'LIVE');
        if (liveStage) {
          setActiveStageId(liveStage.id);
        } else if (data.stages?.length > 0) {
          setActiveStageId(data.stages[0].id);
        }
      }
      setIntelLoading(false);
    }
    loadIntel();
  }, [selectedTourneyId]);

  // Filtered tournament directory
  const filteredTournaments = React.useMemo(() => {
    return tournaments.filter(t => {
      // Season filter
      if (season && season !== 'All' && (t.year || 2026).toString() !== season.toString()) {
        return false;
      }
      // Status filter
      if (viewFilter === 'live') {
        return t.is_ongoing || t.status === 'LIVE';
      }
      if (viewFilter === 'previous') {
        return t.status === 'COMPLETED' || t.winner;
      }
      return true;
    });
  }, [tournaments, season, viewFilter]);

  // Filtered standings
  const displayedStandings = React.useMemo(() => {
    if (!intel?.standings) return [];
    if (standingsFilter === 'qualified') {
      return intel.standings.filter(s => s.status && s.status.includes('Qualified'));
    }
    if (standingsFilter === 'eliminated') {
      return intel.standings.filter(s => s.status && s.status.includes('Eliminated'));
    }
    return intel.standings;
  }, [intel, standingsFilter]);

  if (loading) {
    return (
      <div className="db-subview-container">
        <div className="db-state-box">
          <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--color-orange-primary)' }} />
          <span>Synchronizing Liquipedia & EsportStats tournament intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tourney-hub-wrapper">
      {/* Top Filter & Directory Navigation Bar */}
      <div className="tourney-nav-bar">
        <div>
          <h1 className="db-subview-title">
            TOURNAMENTS <span>INTEL HUB</span>
          </h1>
          <p className="db-subview-subtitle">
            Official BGMI tournament telemetry, stage scorecards, elimination reports & top fraggers
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="tourney-tabs-group">
          <button
            onClick={() => setViewFilter('all')}
            className={`tourney-tab-btn ${viewFilter === 'all' ? 'active' : ''}`}
          >
            <Layers size={14} />
            <span>All Tournaments ({tournaments.length})</span>
          </button>

          <button
            onClick={() => setViewFilter('live')}
            className={`tourney-tab-btn ${viewFilter === 'live' ? 'active' : ''}`}
          >
            <span className="tourney-pulse-dot" />
            <span>Ongoing / Live (BGMS 2026)</span>
          </button>

          <button
            onClick={() => setViewFilter('previous')}
            className={`tourney-tab-btn ${viewFilter === 'previous' ? 'active' : ''}`}
          >
            <Trophy size={14} />
            <span>Previous Archive</span>
          </button>
        </div>
      </div>

      {/* Featured / Active Tournament Intel Card */}
      {intel && (
        <div className="tourney-hero-card">
          <div className="tourney-hero-glow" />

          {/* Hero Header */}
          <div className="tourney-hero-header">
            <div>
              <div className="tourney-hero-badges">
                {intel.is_ongoing && (
                  <span className="tourney-badge-live">
                    <span className="tourney-pulse-dot" />
                    LIVE STAGE: {intel.current_stage || 'PLAYOFFS'}
                  </span>
                )}
                <span className="tourney-badge-tier">{intel.tier || 'S-TIER LAN'}</span>
                <span className="tourney-badge-tier">SEASON {intel.year}</span>

                {/* References */}
                {intel.citations?.liquipedia_url && (
                  <a 
                    href={intel.citations.liquipedia_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="tourney-badge-ref"
                  >
                    <ExternalLink size={12} />
                    <span>Liquipedia Verified</span>
                  </a>
                )}
                {intel.citations?.esportsstats_url && (
                  <a 
                    href={intel.citations.esportsstats_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="tourney-badge-ref"
                  >
                    <Activity size={12} />
                    <span>EsportStats (99.4%)</span>
                  </a>
                )}
              </div>

              <h2 className="tourney-hero-title">
                {intel.tournament_name.toUpperCase()}
              </h2>
              <p className="tourney-hero-subtitle">
                Official NODWIN Gaming & Star Sports premier LAN event featuring 24 elite BGMI franchise teams.
              </p>
            </div>

            {/* Quick Venue / Broadcast Pill */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                OFFICIAL BROADCASTER
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem' }}>
                <Tv size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--color-orange-primary)' }} />
                {intel.broadcast}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-orange-light)', marginTop: '0.2rem' }}>
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {intel.venue}
              </div>
            </div>
          </div>

          {/* Hero Stats Ribbon */}
          <div className="tourney-ribbon-grid">
            <div className="tourney-ribbon-item">
              <div className="tourney-ribbon-label">
                <DollarSign size={13} style={{ color: 'var(--color-orange-light)' }} />
                Prize Pool
              </div>
              <div className="tourney-ribbon-val highlight">{intel.prize_pool}</div>
            </div>

            <div className="tourney-ribbon-item">
              <div className="tourney-ribbon-label">
                <Users size={13} />
                Total Teams
              </div>
              <div className="tourney-ribbon-val">{intel.standings?.length || 24} Teams</div>
            </div>

            <div className="tourney-ribbon-item">
              <div className="tourney-ribbon-label">
                <Calendar size={13} />
                Timeline
              </div>
              <div className="tourney-ribbon-val" style={{ fontSize: '0.95rem' }}>
                {intel.start_date} → {intel.end_date}
              </div>
            </div>

            <div className="tourney-ribbon-item">
              <div className="tourney-ribbon-label">
                <Award size={13} />
                Current Winner / Status
              </div>
              <div className="tourney-ribbon-val" style={{ fontSize: '0.92rem', color: '#10B981' }}>
                {intel.winner || 'TBD (Playoffs Live)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Progression Selector */}
      {intel?.stages && intel.stages.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.05em' }}>
              TOURNAMENT STAGES & FORMAT ROADMAP
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Click stage to view detailed scorecards
            </span>
          </div>

          <div className="tourney-stage-selector">
            {intel.stages.map((stage) => {
              const isActive = activeStageId === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  className={`tourney-stage-btn ${isActive ? 'active' : ''}`}
                >
                  <div className="tourney-stage-top">
                    <span className={`tourney-stage-tag ${stage.status}`}>
                      {stage.status === 'LIVE' ? '🔴 LIVE' : stage.status}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                      {stage.completed_matches}/{stage.total_matches} Matches
                    </span>
                  </div>
                  <div className="tourney-stage-name">{stage.name}</div>
                  <div className="tourney-stage-info">{stage.dates}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard & Scorecards Section */}
      {intel && (
        <div className="tourney-section-card">
          <div className="tourney-section-header">
            <div className="tourney-section-title">
              <Trophy size={20} />
              <span>TOURNAMENT STANDINGS & SCORECARDS</span>
            </div>

            {/* Sub-filters for Teams */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => setStandingsFilter('all')}
                className={`tourney-tab-btn ${standingsFilter === 'all' ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                All Teams ({intel.standings?.length || 24})
              </button>
              <button
                onClick={() => setStandingsFilter('qualified')}
                className={`tourney-tab-btn ${standingsFilter === 'qualified' ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                <CheckCircle2 size={13} style={{ color: '#34D399' }} />
                <span>Qualified / In Contention (16)</span>
              </button>
              <button
                onClick={() => setStandingsFilter('eliminated')}
                className={`tourney-tab-btn ${standingsFilter === 'eliminated' ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                <XCircle size={13} style={{ color: '#F87171' }} />
                <span>Eliminated ({intel.eliminated_teams?.length || 8})</span>
              </button>
            </div>
          </div>

          {/* Standings Table */}
          <div className="tourney-table-wrapper">
            <table className="tourney-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>#</th>
                  <th>TEAM</th>
                  <th style={{ textAlign: 'center' }}>MATCHES</th>
                  <th style={{ textAlign: 'center' }}>WWCD 🍗</th>
                  <th style={{ textAlign: 'right' }}>FINISH PTS</th>
                  <th style={{ textAlign: 'right' }}>PLACE PTS</th>
                  <th style={{ textAlign: 'right' }}>TOTAL PTS</th>
                  <th style={{ textAlign: 'center' }}>FORM</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {displayedStandings.map((team, idx) => {
                  const isEliminated = team.status && team.status.includes('Eliminated');
                  const isQualified = team.status && team.status.includes('Qualified');

                  return (
                    <tr key={team.team_name} style={{ opacity: isEliminated ? 0.75 : 1 }}>
                      <td className="tourney-rank-cell">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${team.rank}`}
                      </td>
                      <td>
                        <div className="tourney-team-cell">
                          <img 
                            src={team.logo_url || '/helmet_logo.png'} 
                            alt={team.team_name} 
                            className="tourney-team-logo" 
                          />
                          <div>
                            <div className="tourney-team-name">{team.team_name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                              TAG: {team.team_tag}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{team.matches_played}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: team.wwcd > 0 ? '#FBBF24' : 'var(--color-text-muted)' }}>
                        {team.wwcd}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{team.finish_points}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{team.placement_points}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="tourney-pts-highlight">{team.total_points}</span>
                      </td>
                      <td>
                        <div className="tourney-form-chips" style={{ justifyContent: 'center' }}>
                          {team.form?.map((f, fi) => (
                            <span 
                              key={fi} 
                              className={`tourney-form-chip ${f === '#1' ? 'win' : ''}`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span 
                          className={`tourney-status-pill ${
                            isQualified ? 'qualified' : isEliminated ? 'eliminated' : 'contender'
                          }`}
                        >
                          {isQualified ? <CheckCircle2 size={11} /> : isEliminated ? <XCircle size={11} /> : <Activity size={11} />}
                          <span>{team.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Eliminated Teams Report (Clear Callout of Who is Eliminated) */}
      {intel?.eliminated_teams && intel.eliminated_teams.length > 0 && (
        <div className="tourney-section-card">
          <div className="tourney-section-header">
            <div className="tourney-section-title">
              <XCircle size={20} style={{ color: '#EF4444' }} />
              <span>ELIMINATED TEAMS REPORT ({intel.eliminated_teams.length} TEAMS OUT)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#F87171', fontWeight: 700 }}>
              ● CUTOFF: TOP 16 ADVANCED TO PLAYOFFS
            </span>
          </div>

          <div className="tourney-eliminated-grid">
            {intel.eliminated_teams.map((elim) => (
              <div key={elim.team_name} className="tourney-eliminated-card">
                <div className="tourney-eliminated-top">
                  <span className="tourney-elim-badge">ELIMINATED</span>
                  <span className="tourney-elim-rank">FINAL RANK #{elim.final_rank}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <img 
                    src={elim.logo_url || '/helmet_logo.png'} 
                    alt={elim.team_name} 
                    style={{ width: '26px', height: '26px', borderRadius: '4px' }} 
                  />
                  <div>
                    <div className="tourney-elim-team-name">{elim.team_name}</div>
                    <div className="tourney-elim-stage">Exit Stage: {elim.elimination_stage}</div>
                  </div>
                </div>

                <div className="tourney-elim-stats">
                  <div>Matches: <strong style={{ color: '#fff' }}>{elim.matches_played}</strong></div>
                  <div>Finishes: <strong style={{ color: '#fff' }}>{elim.finish_points}</strong></div>
                  <div>Total Points: <strong style={{ color: '#F87171' }}>{elim.total_points}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dominant Players & Top Fraggers Leaderboard */}
      {intel?.dominant_players && intel.dominant_players.length > 0 && (
        <div className="tourney-section-card">
          <div className="tourney-section-header">
            <div className="tourney-section-title">
              <Crosshair size={20} />
              <span>DOMINANT PLAYERS & TOP FRAGGERS LEADERBOARD</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Tracking highest finishes, damage and MVP ratings
            </span>
          </div>

          <div className="tourney-dominant-grid">
            {/* MVP Spotlight Card */}
            {intel.mvp_spotlight && (
              <div className="tourney-mvp-card">
                <div>
                  <div className="tourney-mvp-header">
                    <span className="tourney-mvp-badge">
                      <Star size={12} />
                      TOURNAMENT MVP FRONTRUNNER
                    </span>
                    <div className="tourney-mvp-rating">
                      {intel.mvp_spotlight.rating} <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>/ 10</span>
                    </div>
                  </div>

                  <div className="tourney-mvp-player-info">
                    <img 
                      src={intel.mvp_spotlight.image_url || '/avatar_soldier.png'} 
                      alt={intel.mvp_spotlight.ign} 
                      className="tourney-mvp-avatar" 
                    />
                    <div>
                      <div className="tourney-mvp-ign">{intel.mvp_spotlight.ign}</div>
                      <div className="tourney-mvp-team">{intel.mvp_spotlight.team}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        {intel.mvp_spotlight.real_name} • {intel.mvp_spotlight.role}
                      </div>
                    </div>
                  </div>

                  <div className="tourney-mvp-stats-grid">
                    <div className="tourney-mvp-stat-cell">
                      <span className="tourney-mvp-stat-label">Total Finishes</span>
                      <span className="tourney-mvp-stat-val" style={{ color: 'var(--color-orange-light)' }}>
                        {intel.mvp_spotlight.finishes}
                      </span>
                    </div>
                    <div className="tourney-mvp-stat-cell">
                      <span className="tourney-mvp-stat-label">Total Damage</span>
                      <span className="tourney-mvp-stat-val">
                        {intel.mvp_spotlight.damage?.toLocaleString()}
                      </span>
                    </div>
                    <div className="tourney-mvp-stat-cell">
                      <span className="tourney-mvp-stat-label">K/D Ratio</span>
                      <span className="tourney-mvp-stat-val" style={{ color: '#10B981' }}>
                        {intel.mvp_spotlight.kd_ratio}
                      </span>
                    </div>
                    <div className="tourney-mvp-stat-cell">
                      <span className="tourney-mvp-stat-label">MVP Awards</span>
                      <span className="tourney-mvp-stat-val" style={{ color: '#FBBF24' }}>
                        {intel.mvp_spotlight.mvp_count} MVPs
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                  Dominant Weapon: <strong style={{ color: '#fff' }}>{intel.mvp_spotlight.fav_weapon}</strong> • Headshot Accuracy: <strong style={{ color: '#10B981' }}>{intel.mvp_spotlight.headshot_pct}</strong>
                </div>
              </div>
            )}

            {/* Top 8 Fraggers Table */}
            <div className="tourney-table-wrapper">
              <table className="tourney-table">
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>PLAYER</th>
                    <th>TEAM</th>
                    <th style={{ textAlign: 'right' }}>FINISHES</th>
                    <th style={{ textAlign: 'right' }}>DAMAGE</th>
                    <th style={{ textAlign: 'center' }}>K/D</th>
                    <th style={{ textAlign: 'center' }}>MVPs</th>
                    <th>FAV WEAPON</th>
                  </tr>
                </thead>
                <tbody>
                  {intel.dominant_players.map((player) => (
                    <tr key={player.ign}>
                      <td className="tourney-rank-cell">
                        {player.rank === 1 ? '👑 #1' : `#${player.rank}`}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <img 
                            src={player.image_url || '/avatar_soldier.png'} 
                            alt={player.ign} 
                            style={{ width: '26px', height: '26px', borderRadius: '50%' }} 
                          />
                          <div>
                            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#fff' }}>
                              {player.ign}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                              {player.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-orange-light)', fontWeight: 700 }}>
                        {player.team}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="tourney-pts-highlight">{player.finishes}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {player.damage?.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#10B981' }}>
                        {player.kd_ratio}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#FBBF24' }}>
                        {player.mvp_count}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {player.fav_weapon}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Match Scorecards by Stage */}
      {intel?.match_scorecards && intel.match_scorecards.length > 0 && (
        <div className="tourney-section-card">
          <div className="tourney-section-header">
            <div className="tourney-section-title">
              <Flame size={20} />
              <span>RECENT STAGE MATCH SCORECARDS</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Stage: {intel.current_stage || 'Playoffs'}
            </span>
          </div>

          <div className="tourney-matches-grid">
            {intel.match_scorecards.map((m) => (
              <div key={m.match_id} className="tourney-match-card">
                <div className="tourney-match-header">
                  <span className="tourney-match-num">MATCH #{m.match_num}</span>
                  <span className="tourney-match-map">{m.map}</span>
                </div>

                <div className="tourney-match-winner">
                  <Trophy size={14} style={{ color: '#FBBF24' }} />
                  <span>{m.winner_team}</span>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--color-orange-light)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  🍗 WWCD • {m.winner_wwcd_finishes} Match Finishes
                </div>

                <div className="tourney-match-desc">
                  Top Fragger: <strong style={{ color: '#fff' }}>{m.top_fragger}</strong>
                </div>
                <div className="tourney-match-desc" style={{ marginTop: '0.2rem', fontStyle: 'italic' }}>
                  {m.highlights}
                </div>

                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                  {m.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tournament Directory / Archive Cards Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.05em' }}>
              ALL BGMI TOURNAMENTS DIRECTORY ({filteredTournaments.length})
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Click any tournament to load its full historical telemetry and scorecards
            </p>
          </div>
        </div>

        <div className="tourney-archive-grid">
          {filteredTournaments.map((t) => {
            const isSelected = selectedTourneyId === t.tournament_id;
            const isOngoing = t.is_ongoing || t.status === 'LIVE';

            return (
              <div
                key={t.tournament_id}
                onClick={() => setSelectedTourneyId(t.tournament_id)}
                className={`tourney-archive-card ${isSelected ? 'active-selection' : ''}`}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="db-tier-badge">
                      {t.tier || 'A-TIER'}
                    </span>
                    {isOngoing ? (
                      <span className="tourney-badge-live" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                        <span className="tourney-pulse-dot" /> LIVE NOW
                      </span>
                    ) : (
                      <span className="db-year-badge">{t.year || '2026'}</span>
                    )}
                  </div>

                  <h4 className="tourney-archive-name">
                    {t.tournament_name}
                  </h4>

                  {t.winner && (
                    <div className="tourney-archive-winner">
                      <Award size={14} />
                      <span>Champion: {t.winner}</span>
                    </div>
                  )}

                  {t.prize_pool && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                      Prize Pool: <strong style={{ color: '#fff' }}>{t.prize_pool}</strong>
                    </div>
                  )}

                  {(t.start_date || t.end_date) && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {t.start_date} → {t.end_date}
                    </div>
                  )}
                </div>

                <div className="tourney-archive-meta">
                  <span>Source: {t.source}</span>
                  <span style={{ color: 'var(--color-orange-light)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {isSelected ? '● ACTIVE INTEL' : 'View Full Scorecards →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
