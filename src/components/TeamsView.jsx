import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { getTeams } from '../services/api';
import TeamProfileModal from './TeamProfileModal';
import TeamLogo from './TeamLogo';

export default function TeamsView({ season }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getTeams();
      setTeams(data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredTeams = teams.filter(t => 
    t.team_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="db-subview-container">
      {/* View Header */}
      <div className="db-subview-header">
        <div>
          <h1 className="db-subview-title">
            TEAMS <span>DATABASE</span>
          </h1>
          <p className="db-subview-subtitle">
            Tracking {teams.length} official esports teams across BGMI & PUBG Mobile
          </p>
        </div>
        <div className="db-subview-badge">
          ● REAL DATA ACTIVE ({filteredTeams.length} TEAMS)
        </div>
      </div>

      {/* Filter Bar */}
      <div className="db-filter-bar">
        <div className="db-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search team name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="db-custom-input"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="db-state-box">
          <RefreshCw className="animate-spin" size={20} />
          <span>Fetching real team records...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="db-state-box">
          No teams match your search criteria.
        </div>
      ) : (
        /* Team Grid */
        <div className="db-subview-grid">
          {filteredTeams.map((team, idx) => {
            // Determine verification state based on data completeness
            let verifyStatus = team.status?.toUpperCase() || 'UNVERIFIED';
            let StatusIcon = HelpCircle;
            let statusClass = 'db-status-unverified';

            if (verifyStatus === 'VERIFIED' || (team.logo_url && team.organization_id && team.source)) {
              verifyStatus = 'VERIFIED';
              StatusIcon = CheckCircle;
              statusClass = 'db-status-verified';
            } else if (team.logo_url || team.organization_id || team.source) {
              verifyStatus = 'PARTIALLY VERIFIED';
              StatusIcon = AlertCircle;
              statusClass = 'db-status-partial';
            }

            return (
              <div key={team.team_id} className="db-entity-card db-clickable" onClick={() => setSelectedTeam(team)}>
                <div className="db-entity-card-top">
                  <TeamLogo team={team} size="medium" />
                  <div className="db-entity-info">
                    <h3 className="db-entity-name">{team.team_name}</h3>
                    <p className="db-entity-sub">{team.organization_name || 'Independent Team'}</p>
                    <span className="db-tag db-tag-role">
                      {team.rank ? `Rank #${team.rank}` : 'UNRANKED'}
                    </span>
                  </div>
                </div>

                <div className="db-entity-footer flex items-center justify-between mt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Source: {team.source || 'Unknown'}</span>
                    {team.logo_source && <span className="text-xs text-gray-500">Logo: {team.logo_source}</span>}
                  </div>
                  <div className={`db-verify-badge ${statusClass} flex items-center gap-1 text-xs font-bold px-2 py-1 rounded`}>
                    <StatusIcon size={12} />
                    {verifyStatus}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTeam && (
        <TeamProfileModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}
    </div>
  );
}
