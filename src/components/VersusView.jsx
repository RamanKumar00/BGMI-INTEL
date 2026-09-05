import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, Swords } from 'lucide-react';
import { getTeams, compareTeams } from '../services/api';

export default function VersusView({ season }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getTeams();
      setTeams(data || []);
      if (data && data.length >= 2) {
        setTeamAId(data[0].team_id);
        setTeamBId(data[1].team_id);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCompare = async () => {
    if (!teamAId || !teamBId || teamAId === teamBId) return;
    setComparing(true);
    const data = await compareTeams(teamAId, teamBId);
    setComparisonData(data);
    setComparing(false);
  };

  return (
    <div className="db-subview-container">
      {/* View Header */}
      <div className="db-subview-header">
        <div>
          <h1 className="db-subview-title">
            VERSUS <span>ANALYTICS</span>
          </h1>
          <p className="db-subview-subtitle">
            Head-to-head performance tracking for official esports teams
          </p>
        </div>
      </div>

      {/* Versus Selection Bar */}
      <div className="db-filter-bar db-versus-bar">
        <div className="db-versus-select-container">
          <select
            value={teamAId}
            onChange={(e) => setTeamAId(e.target.value)}
            className="db-custom-select db-versus-select"
          >
            {teams.map(t => (
              <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
            ))}
          </select>
        </div>

        <div className="db-versus-icon">
          <Swords size={24} color="#F55A05" />
        </div>

        <div className="db-versus-select-container">
          <select
            value={teamBId}
            onChange={(e) => setTeamBId(e.target.value)}
            className="db-custom-select db-versus-select"
          >
            {teams.map(t => (
              <option key={t.team_id} value={t.team_id}>{t.team_name}</option>
            ))}
          </select>
        </div>
        
        <button className="db-btn-compare" onClick={handleCompare} disabled={comparing || teamAId === teamBId}>
          {comparing ? <RefreshCw className="animate-spin" size={16} /> : 'ANALYZE'}
        </button>
      </div>

      {loading ? (
        <div className="db-state-box">
          <RefreshCw className="animate-spin" size={20} />
          <span>Fetching team rosters...</span>
        </div>
      ) : comparisonData ? (
        <div className="db-versus-results">
          
          <div className="db-versus-summary">
            <div className="db-versus-team db-versus-left">
              <h2>{comparisonData.teamA.name}</h2>
              <div className="db-win-circle">
                {comparisonData.encounters > 0 ? `${comparisonData.teamA.win_rate}%` : 'N/A'}
                <span>WIN PROBABILITY</span>
              </div>
            </div>
            
            <div className="db-versus-center">
              <span className="db-encounters-badge">{comparisonData.encounters} MATCH ENCOUNTERS</span>
            </div>

            <div className="db-versus-team db-versus-right">
              <h2>{comparisonData.teamB.name}</h2>
              <div className="db-win-circle">
                {comparisonData.encounters > 0 ? `${comparisonData.teamB.win_rate}%` : 'N/A'}
                <span>WIN PROBABILITY</span>
              </div>
            </div>
          </div>
          
          {comparisonData.encounters === 0 && (
            <div className="text-center text-gray-400 text-sm mt-4 italic mb-4">
              These two teams have never played in the same match. Win probability cannot be calculated.
            </div>
          )}

          <div className="db-versus-stats-grid">
            <div className="db-versus-stat-row">
              <div className="db-stat-side db-stat-left">{comparisonData.teamA.avg_placement}</div>
              <div className="db-stat-center">Avg Placement (Global)</div>
              <div className="db-stat-side db-stat-right">{comparisonData.teamB.avg_placement}</div>
            </div>
            <div className="db-versus-stat-row">
              <div className="db-stat-side db-stat-left">{comparisonData.teamA.total_points}</div>
              <div className="db-stat-center">Total Points (Global)</div>
              <div className="db-stat-side db-stat-right">{comparisonData.teamB.total_points}</div>
            </div>
            <div className="db-versus-stat-row">
              <div className="db-stat-side db-stat-left">{comparisonData.t1_wins}</div>
              <div className="db-stat-center">Head-to-Head Wins</div>
              <div className="db-stat-side db-stat-right">{comparisonData.t2_wins}</div>
            </div>
          </div>

        </div>
      ) : (
        <div className="db-state-box">
          Select two different teams and click Analyze.
        </div>
      )}
    </div>
  );
}
