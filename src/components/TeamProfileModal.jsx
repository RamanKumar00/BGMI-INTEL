import React, { useEffect, useState } from 'react';
import { X, Users, Trophy, TrendingUp } from 'lucide-react';
import { getTeamDetails, getTeamRoster, getTeamStatistics } from '../services/api';
import TeamLogo from './TeamLogo';

export default function TeamProfileModal({ team, onClose }) {
  const [details, setDetails] = useState(null);
  const [roster, setRoster] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [data, rosterData, statsData] = await Promise.all([
        getTeamDetails(team.team_id),
        getTeamRoster(team.team_id),
        getTeamStatistics(team.team_id)
      ]);
      setDetails(data);
      setRoster(rosterData || []);
      setStats(statsData || null);
      setLoading(false);
    }
    loadData();
  }, [team]);

  if (!team) return null;

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div className="db-modal-content" onClick={e => e.stopPropagation()}>
        <button className="db-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="db-modal-header">
          <TeamLogo team={details || team} size="large" className="mr-4" />
          <div className="db-modal-title-box">
            <h2>{team.team_name}</h2>
            <p>{details?.organization?.organization_name || 'Independent Team'} • Global Rank: {team.rank ? `#${team.rank}` : 'UNRANKED'}</p>
            <div className="db-tags-row" style={{ marginTop: '0.5rem' }}>
              <span className="db-tag db-tag-role">Competitive</span>
              <span className={`db-tag ${team.status?.toUpperCase() === 'ACTIVE' ? 'db-tag-active' : 'db-tag-role'}`}>
                {team.status || 'Status Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="db-modal-body">
          <div className="db-modal-grid">
            
            {/* Quick Stats */}
            <div className="db-modal-card">
              <h3><TrendingUp size={16}/> Performance Metrics</h3>
              {loading ? <p className="text-gray-500 mt-2">Loading stats...</p> : (
                <div className="db-metrics-grid">
                  <div className="db-metric-box">
                    <span className="db-metric-value">{stats?.matches_played || 0}</span>
                    <span className="db-metric-label">Matches Played</span>
                  </div>
                  <div className="db-metric-box">
                    <span className="db-metric-value">{stats?.avg_placement || 'N/A'}</span>
                    <span className="db-metric-label">Avg Placement</span>
                  </div>
                  <div className="db-metric-box">
                    <span className="db-metric-value">{stats?.total_points || 0}</span>
                    <span className="db-metric-label">Total Points</span>
                  </div>
                  <div className="db-metric-box">
                    <span className="db-metric-value">{stats?.total_finishes || 0}</span>
                    <span className="db-metric-label">Total Finishes</span>
                  </div>
                </div>
              )}
            </div>

            {/* Active Roster */}
            <div className="db-modal-card">
              <h3><Users size={16}/> Active Roster</h3>
              {loading ? <p className="text-gray-500 mt-2">Loading roster...</p> : (
                <div className="db-roster-list">
                  {roster.length === 0 ? (
                    <div className="text-gray-500 italic mt-2">Roster UNVERIFIED / NULL</div>
                  ) : (
                    roster.map((player, i) => (
                      <div key={i} className="db-roster-item">
                        {player.image_url ? (
                          <img src={player.image_url} alt={player.ign} className="db-roster-avatar" />
                        ) : (
                          <div className="db-roster-avatar">{player.ign.substring(0, 2).toUpperCase()}</div>
                        )}
                        <div className="db-roster-info">
                          <h4>{player.ign}</h4>
                          <p className={player.role?.toLowerCase() === 'coach' ? 'text-orange-400' : ''}>
                            {player.role || 'Role Unknown'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
