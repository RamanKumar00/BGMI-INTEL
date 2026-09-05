import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings, LogOut, User, Sliders, X } from 'lucide-react';
import { searchPlayers, getTournaments } from '../services/api';
import UserSettingsModal from './UserSettingsModal';

export default function Header({ user, onLogout, onNavigate, season, onSeasonChange }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [settingsModalTab, setSettingsModalTab] = useState(null);

  useEffect(() => {
    async function fetchSeasons() {
      const data = await getTournaments();
      if (data && data.length > 0) {
        const years = data.map(t => t.year).filter(y => y);
        const uniqueYears = [...new Set(years)].sort((a, b) => b - a);
        if (uniqueYears.length > 0) {
          setAvailableSeasons(uniqueYears.map(String));
        }
      }
    }
    fetchSeasons();
  }, []);


  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 1) {
      return;
    }

    const timer = setTimeout(async () => {
      const results = await searchPlayers(searchQuery.trim());
      setSearchResults(results || []);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val || val.trim().length < 1) {
      setSearchResults([]);
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  };

  return (
    <header className="db-header">
      {/* Search Container */}
      <div className="db-header-search-container relative">
        <Search className="db-search-icon" size={18} />
        <input 
          type="text" 
          placeholder="Search 479+ real players, teams, tournaments..." 
          value={searchQuery}
          onChange={handleSearchChange}
          className="db-search-input"
        />
        {searchQuery ? (
          <button 
            type="button" 
            onClick={() => setSearchQuery('')}
            className="text-gray-400 hover:text-white mr-2"
          >
            <X size={14} />
          </button>
        ) : (
          <div className="db-search-shortcut">Ctrl /</div>
        )}

        {/* Live Search Autocomplete Dropdown */}
        {searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-orange-500/30 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto p-2">
            {isSearching ? (
              <div className="p-3 text-xs text-orange-400 text-center">Searching real database...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 text-center">No matching players found in database</div>
            ) : (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Real Player Results ({searchResults.length})
                </div>
                {searchResults.slice(0, 8).map((p) => (
                  <div
                    key={p.player_id}
                    onClick={() => {
                      setSearchQuery('');
                      if (onNavigate) onNavigate('players');
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.ign} className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {p.ign.substring(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white truncate">{p.ign}</div>
                      <div className="text-xs text-gray-400 truncate">{p.real_name || p.country || 'India'} • {p.role || 'Player'}</div>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {p.status || 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div className="db-header-actions">
        {/* Season Filter Dropdown */}
        <div className="db-season-dropdown">
          <label htmlFor="season-select" className="db-season-label">Season</label>
          <select 
            id="season-select"
            value={season} 
            onChange={(e) => onSeasonChange && onSeasonChange(e.target.value)}
            className="db-season-select"
          >
            <option value="All">All Time</option>
            {availableSeasons.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

        {/* Notifications */}
        <button type="button" className="db-action-btn db-notify-btn" aria-label="Notifications" onClick={() => setNotifications(0)}>
          <Bell size={20} />
          {notifications > 0 && <span className="db-notify-badge">{notifications}</span>}
        </button>

        {/* Settings */}
        <button type="button" className="db-action-btn" aria-label="Settings" onClick={() => setSettingsModalTab('preferences')}>
          <Settings size={20} />
        </button>

        {/* Divider */}
        <div className="db-header-divider" />

        {/* User Profile */}
        <div className="db-profile-container">
          <button 
            type="button" 
            className="db-profile-badge" 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
            aria-haspopup="true"
          >
            <div className="db-profile-text">
              <span className="db-profile-name">{user?.username || localStorage.getItem('username') || 'Soldier'}</span>
            </div>
            <img 
              src="/avatar_soldier.png" 
              alt="Soldier Avatar" 
              className="db-profile-avatar" 
            />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="db-profile-menu">
              <div className="db-profile-menu-header">
                <p className="db-menu-user">{user?.email || 'soldier@bgmi-intel.com'}</p>
                <p className="db-menu-role">Level 3 tactical analyst</p>
              </div>
              <div className="db-profile-menu-divider" />
              <button type="button" className="db-menu-item" onClick={() => { setShowProfileMenu(false); setSettingsModalTab('profile'); }}>
                <User size={16} />
                <span>My Profile</span>
              </button>
              <button type="button" className="db-menu-item" onClick={() => { setShowProfileMenu(false); setSettingsModalTab('preferences'); }}>
                <Sliders size={16} />
                <span>Preferences</span>
              </button>
              <div className="db-profile-menu-divider" />
              <button type="button" className="db-menu-item db-logout-item" onClick={onLogout}>
                <LogOut size={16} />
                <span>Logout Session</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {settingsModalTab && (
        <UserSettingsModal 
          user={user} 
          initialTab={settingsModalTab} 
          onClose={() => setSettingsModalTab(null)} 
        />
      )}
    </header>
  );
}
