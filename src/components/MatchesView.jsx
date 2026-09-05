import React, { useEffect, useState } from 'react';
import { MapPin, RefreshCw, Trophy, Calendar } from 'lucide-react';
import { getMatches } from '../services/api';
import MatchDetailModal from './MatchDetailModal';

export default function MatchesView({ season }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getMatches();
      setMatches(data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredMatches = React.useMemo(() => {
    if (!season || season === 'All') return matches;
    return matches.filter(m => {
      // Matches may not have a year directly, but they have a date (YYYY-MM-DD)
      if (m.date) {
        return m.date.startsWith(season.toString());
      }
      return false; // exclude matches without dates when filtering by season
    });
  }, [matches, season]);

  return (
    <div className="db-subview-container">
      {/* View Header */}
      <div className="db-subview-header">
        <div>
          <h1 className="db-subview-title">
            MATCH <span>EXPLORER</span>
          </h1>
          <p className="db-subview-subtitle">
            Real match results parsed directly from tournament wikitext
          </p>
        </div>
        <div className="db-subview-badge">
          ● REAL DATA ACTIVE ({filteredMatches.length} MATCHES)
        </div>
      </div>

      {loading ? (
        <div className="db-state-box">
          <RefreshCw className="animate-spin" size={20} />
          <span>Fetching match results...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="db-state-box">
          No match records loaded in database for {season !== 'All' ? `season ${season}` : 'this selection'}.
        </div>
      ) : (
        <div className="db-subview-grid">
          {filteredMatches.map((m) => (
            <div 
              key={m.match_id} 
              className="db-entity-card" 
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedMatchId(m.match_id)}
            >
              <div>
                <div className="db-tourney-header">
                  <span className="db-tier-badge">
                    Match #{m.match_number || 1}
                  </span>
                  <span className="db-year-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} style={{ color: 'var(--color-orange-primary)' }} />
                    {m.map || 'Erangel'}
                  </span>
                </div>

                <div className="db-tourney-details" style={{ marginTop: '0.5rem' }}>
                  <div className="db-tourney-detail-item">
                    <span>Stage: <strong style={{ color: '#fff' }}>{m.stage || 'Group Stage'}</strong></span>
                  </div>
                  {m.date && (
                    <div className="db-tourney-detail-item">
                      <Calendar size={13} />
                      <span>{m.date}</span>
                    </div>
                  )}
                  {m.winner_team_id && (
                    <div className="db-tourney-detail-item db-tourney-winner">
                      <Trophy size={13} />
                      <span>Winner: Team {m.winner_team_id}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="db-entity-footer">
                <span>Tournament #{m.tournament_id}</span>
                <span className="db-source-text">{m.source}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMatchId && (
        <MatchDetailModal 
          matchId={selectedMatchId} 
          onClose={() => setSelectedMatchId(null)} 
        />
      )}
    </div>
  );
}
