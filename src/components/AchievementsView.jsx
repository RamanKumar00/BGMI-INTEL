import React, { useEffect, useState } from 'react';
import { Award, RefreshCw, Calendar, User, Shield } from 'lucide-react';
import { getAchievements } from '../services/api';

export default function AchievementsView({ season }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getAchievements();
      setAchievements(data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="db-subview-container">
      {/* View Header */}
      <div className="db-subview-header">
        <div>
          <h1 className="db-subview-title">
            GLOBAL <span>ACHIEVEMENTS</span>
          </h1>
          <p className="db-subview-subtitle">
            Tracking historical accolades for players and teams
          </p>
        </div>
        <div className="db-subview-badge">
          ● REAL DATA ACTIVE ({achievements.length} RECORDS)
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="db-state-box">
          <RefreshCw className="animate-spin" size={20} />
          <span>Syncing achievement records...</span>
        </div>
      ) : achievements.length === 0 ? (
        <div className="db-state-box">
          No achievements available at this time.
        </div>
      ) : (
        /* Achievements Grid */
        <div className="db-subview-grid">
          {achievements.map((ach) => (
            <div key={ach.achievement_id} className="db-entity-card db-glass-panel">
              <div className="db-entity-card-top" style={{ alignItems: 'flex-start' }}>
                <div className="db-avatar-placeholder" style={{ background: 'var(--color-orange-glow)', width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={24} color="#000" />
                </div>
                <div className="db-entity-info" style={{ marginLeft: 16 }}>
                  <h3 className="db-entity-name" style={{ fontSize: '1.1rem', marginBottom: 4 }}>{ach.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                    {ach.tournament_name && (
                      <span className="db-tag" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.75rem', alignSelf: 'flex-start' }}>
                        {ach.tournament_name}
                      </span>
                    )}
                    {(ach.ign || ach.team_name) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-gray-300)', fontSize: '0.85rem', marginTop: 4 }}>
                        {ach.ign ? <User size={14} /> : <Shield size={14} />}
                        <span>{ach.ign || ach.team_name}</span>
                      </div>
                    )}
                    {ach.date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-gray-400)', fontSize: '0.8rem', marginTop: 2 }}>
                        <Calendar size={12} />
                        <span>{ach.date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
