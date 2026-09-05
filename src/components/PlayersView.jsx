import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, Globe } from 'lucide-react';
import { getPlayers } from '../services/api';
import PlayerProfileModal from './PlayerProfileModal';

export default function PlayersView({ season }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getPlayers();
      setPlayers(data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const roles = ['ALL', 'Assaulter', 'IGL', 'Support', 'Entry Fragger', 'Sniper'];

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.ign?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.real_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || (p.role && p.role.toLowerCase().includes(roleFilter.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || (p.status && p.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="db-subview-container">
      {/* View Header */}
      <div className="db-subview-header">
        <div>
          <h1 className="db-subview-title">
            PLAYER <span>DATABASE</span>
          </h1>
          <p className="db-subview-subtitle">
            Tracking {players.length} real esports players from Liquipedia & EsportStats
          </p>
        </div>
        <div className="db-subview-badge">
          ● REAL DATA ACTIVE ({filteredPlayers.length} MATCHES)
        </div>
      </div>

      {/* Filter Bar */}
      <div className="db-filter-bar">
        {/* Search */}
        <div className="db-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by IGN, Real Name, Country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="db-custom-input"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="db-custom-select"
        >
          {roles.map(r => <option key={r} value={r}>Role: {r}</option>)}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="db-custom-select"
        >
          <option value="ALL">Status: All</option>
          <option value="Active">Status: Active</option>
          <option value="Retired">Status: Retired</option>
        </select>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="db-state-box">
          <RefreshCw className="animate-spin" size={20} />
          <span>Fetching real player records from database...</span>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="db-state-box">
          No players match your search criteria.
        </div>
      ) : (
        /* Player Cards Grid */
        <div className="db-subview-grid">
          {filteredPlayers.slice(0, 48).map((p) => (
            <div key={p.player_id} className="db-entity-card db-clickable" onClick={() => setSelectedPlayer(p)}>
              <div>
                <div className="db-entity-card-top">
                  {p.image_url ? (
                    <img 
                      src={p.image_url} 
                      alt={p.ign} 
                      className="db-avatar-img" 
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="db-avatar-placeholder">
                      {p.ign.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="db-entity-info">
                    <h3 className="db-entity-name">{p.ign}</h3>
                    <p className="db-entity-sub">{p.real_name || ''}</p>
                    <div className="db-tags-row">
                      <span className="db-tag db-tag-role">
                        {p.role || 'Assaulter'}
                      </span>
                      <span className={`db-tag ${p.status?.toLowerCase() === 'active' ? 'db-tag-active' : 'db-tag-retired'}`}>
                        {p.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="db-entity-footer">
                <span className="db-tourney-detail-item">
                  <Globe size={12} />
                  {p.country || 'India'}
                </span>
                <span className="db-source-text">{p.source}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPlayer && (
        <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
}
