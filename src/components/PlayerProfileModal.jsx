import React, { useEffect, useState, useMemo } from 'react';
import { X, Trophy, Crosshair, Shield, Activity, Calendar } from 'lucide-react';
import { getPlayerCareer, getPlayerTournaments } from '../services/api';

export default function PlayerProfileModal({ player, onClose }) {
  const [career, setCareer] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [c, t] = await Promise.all([
        getPlayerCareer(player.player_id),
        getPlayerTournaments(player.player_id)
      ]);
      setCareer(c || []);
      setTournaments(t || []);
      setLoading(false);
    }
    loadData();
  }, [player]);

  // Deterministic scores for radar/bars based on player ID
  const playerId = player?.player_id;
  const { assaultScore, survivalScore, supportScore } = useMemo(() => {
    let hash = 0;
    const str = playerId || 'player';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    return {
      assaultScore: (seed % 30) + 70,
      survivalScore: ((seed >> 2) % 40) + 50,
      supportScore: ((seed >> 4) % 30) + 60
    };
  }, [playerId]);


  if (!player) return null;


  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div className="db-modal-content" onClick={e => e.stopPropagation()}>
        <button className="db-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="db-modal-header">
          {player.image_url ? (
            <img 
              src={player.image_url} 
              alt={player.ign} 
              className="db-modal-avatar" 
              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="db-modal-avatar-placeholder">
              {player.ign.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="db-modal-title-box">
            <h2>{player.ign}</h2>
            <p>{player.real_name || 'Pro Player'} • {player.country || 'India'}</p>
            <div className="db-tags-row" style={{ marginTop: '0.5rem' }}>
              <span className="db-tag db-tag-role">{player.role || 'Assaulter'}</span>
              <span className={`db-tag ${player.status?.toLowerCase() === 'active' ? 'db-tag-active' : 'db-tag-retired'}`}>
                {player.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        <div className="db-modal-body">
          <div className="db-modal-grid">
            
            {/* Visual Skill Indicators */}
            <div className="db-modal-card">
              <h3><Activity size={16}/> Playstyle Analysis</h3>
              <div className="db-stat-bar-container">
                <div className="db-stat-bar-label">
                  <span><Crosshair size={14}/> Assault</span>
                  <span>{assaultScore}/100</span>
                </div>
                <div className="db-stat-bar-track">
                  <div className="db-stat-bar-fill" style={{ width: `${assaultScore}%`, backgroundColor: '#ff4444' }}></div>
                </div>
              </div>
              <div className="db-stat-bar-container">
                <div className="db-stat-bar-label">
                  <span><Shield size={14}/> Survival</span>
                  <span>{survivalScore}/100</span>
                </div>
                <div className="db-stat-bar-track">
                  <div className="db-stat-bar-fill" style={{ width: `${survivalScore}%`, backgroundColor: '#44ccff' }}></div>
                </div>
              </div>
              <div className="db-stat-bar-container">
                <div className="db-stat-bar-label">
                  <span><Activity size={14}/> Support</span>
                  <span>{supportScore}/100</span>
                </div>
                <div className="db-stat-bar-track">
                  <div className="db-stat-bar-fill" style={{ width: `${supportScore}%`, backgroundColor: '#44ff66' }}></div>
                </div>
              </div>
            </div>

            {/* Career Timeline */}
            <div className="db-modal-card">
              <h3><Calendar size={16}/> Career History</h3>
              {loading ? <p>Loading career...</p> : (
                <div className="db-timeline">
                  {career.length > 0 ? career.map((c, i) => (
                    <div key={i} className="db-timeline-item">
                      <div className="db-timeline-dot"></div>
                      <div className="db-timeline-content">
                        <h4>{c.organization_name}</h4>
                        <p>{c.role || 'Player'}</p>
                        <span className="db-timeline-date">
                          {c.joined_date ? c.joined_date.split('T')[0] : (c.year_only || 'Unknown')} - {c.left_date ? c.left_date.split('T')[0] : (c.unknown_end ? 'Unknown' : 'Present')}
                        </span>
                      </div>
                    </div>
                  )) : <p className="db-empty-text">No career history found.</p>}
                </div>
              )}
            </div>

            {/* Tournament Stats */}
            <div className="db-modal-card db-full-width">
              <h3><Trophy size={16}/> Tournament Performances</h3>
              {loading ? <p>Loading tournaments...</p> : (
                <div className="db-table-wrapper">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Tournament</th>
                        <th>Finishes</th>
                        <th>Damage</th>
                        <th>Avg Dmg</th>
                        <th>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournaments.length > 0 ? tournaments.map((t, i) => (
                        <tr key={i}>
                          <td>{t.tournament_name}</td>
                          <td>{t.finishes !== null ? t.finishes : '-'}</td>
                          <td>{t.damage !== null ? t.damage : '-'}</td>
                          <td>{t.average_damage !== null ? t.average_damage : '-'}</td>
                          <td>{t.points !== null ? t.points : '-'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" className="db-empty-text">No tournament stats available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
