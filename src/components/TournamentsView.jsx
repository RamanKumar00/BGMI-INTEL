import React, { useEffect, useState } from 'react';
import { Calendar, DollarSign, RefreshCw, Award, MapPin } from 'lucide-react';
import { getTournaments } from '../services/api';

export default function TournamentsView({ season }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getTournaments();
      setTournaments(data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredTournaments = React.useMemo(() => {
    if (!season || season === 'All') return tournaments;
    return tournaments.filter(t => (t.year || 2026).toString() === season.toString());
  }, [tournaments, season]);

  return (
    <div className="db-subview-container">
      {/* View Header */}
      <div className="db-subview-header">
        <div>
          <h1 className="db-subview-title">
            TOURNAMENTS <span>INTEL</span>
          </h1>
          <p className="db-subview-subtitle">
            Tracking {tournaments.length} official BGMI & PUBG Mobile tournaments
          </p>
        </div>
        <div className="db-subview-badge">
          ● REAL DATA ACTIVE ({filteredTournaments.length} TOURNAMENTS)
        </div>
      </div>

      {loading ? (
        <div className="db-state-box">
          <RefreshCw className="animate-spin" size={20} />
          <span>Fetching real tournament data...</span>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="db-state-box">
          No tournaments currently loaded in DB for {season !== 'All' ? `season ${season}` : 'this selection'}.
        </div>
      ) : (
        <div className="db-subview-grid">
          {filteredTournaments.map((t) => (
            <div key={t.tournament_id} className="db-entity-card db-tourney-card">
              <div>
                <div className="db-tourney-header">
                  <span className="db-tier-badge">
                    {t.tier || 'S-TIER'}
                  </span>
                  <span className="db-year-badge">
                    {t.year || '2026'}
                  </span>
                </div>

                <h3 className="db-tourney-title">
                  {t.tournament_name}
                </h3>

                <div className="db-tourney-details">
                  {t.prize_pool && (
                    <div className="db-tourney-detail-item">
                      <DollarSign size={13} style={{ color: 'var(--color-orange-light)' }} />
                      <span>Prize Pool: <strong style={{ color: '#fff' }}>{t.prize_pool}</strong></span>
                    </div>
                  )}
                  {t.winner && (
                    <div className="db-tourney-detail-item db-tourney-winner">
                      <Award size={13} />
                      <span>Winner: {t.winner}</span>
                    </div>
                  )}
                  {(t.start_date || t.end_date) && (
                    <div className="db-tourney-detail-item">
                      <Calendar size={13} />
                      <span>{t.start_date || 'TBD'} — {t.end_date || 'TBD'}</span>
                    </div>
                  )}
                  <div className="db-tourney-detail-item">
                    <MapPin size={13} />
                    <span>Region: {t.region || 'India'}</span>
                  </div>
                </div>
              </div>

              <div className="db-entity-footer">
                <span>Source: {t.source}</span>
                <span style={{ color: 'var(--color-orange-light)', fontWeight: 600 }}>View Intel →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
