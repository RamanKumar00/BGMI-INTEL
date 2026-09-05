import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Shield, 
  Trophy, 
  Map, 
  MapPin, 
  Search, 
  BarChart2, 
  Award,
  Swords,
  Image as ImageIcon
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange }) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'teams', label: 'Teams', icon: Shield },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'media_hub', label: 'Media Hub', icon: ImageIcon },
    { id: 'map_intel', label: 'Map Intel', icon: Map },
    { id: 'drop_analysis', label: 'Drop Analysis', icon: MapPin },
    { id: 'match_explorer', label: 'Match Explorer', icon: Search },
    { id: 'versus', label: 'Versus', icon: Swords },
    { id: 'achievements', label: 'Achievements', icon: Award }
  ];


  return (
    <aside className="db-sidebar">
      {/* Sidebar Logo */}
      <div className="db-sidebar-logo">
        <img 
          src="/helmet_logo.png" 
          alt="BGMI Helmet Logo" 
          className="db-logo-img" 
        />
        <div className="db-logo-text">
          <h2>BGMI <span>INTEL</span></h2>
          <p>Your Esports. Your Intelligence.</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="db-sidebar-nav">
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`db-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={18} className="db-nav-icon" />
                  <span>{item.label}</span>
                  {isActive && <div className="db-nav-active-glow" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Live Data Status Widget */}
      <div className="db-live-widget">
        <div className="db-live-header">
          <div className="db-live-status">
            <span className="db-live-dot" />
            <span className="db-live-text">LIVE DATA STATUS</span>
          </div>
          <span className="db-live-badge">LIVE</span>
        </div>
        
        <div className="db-live-stat-num">12,842</div>
        <div className="db-live-stat-label">Matches Analyzed</div>
        <div className="db-live-updated">Last updated: 2 min ago</div>

        {/* Micro Area/Line Chart */}
        <div className="db-micro-chart">
          <svg viewBox="0 0 100 30" width="100%" height="30" preserveAspectRatio="none">
            <defs>
              <linearGradient id="micro-glow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-orange-primary)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-orange-primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0,25 Q15,10 30,22 T60,8 T90,20 L100,15 L100,30 L0,30 Z"
              fill="url(#micro-glow)"
            />
            <path
              d="M0,25 Q15,10 30,22 T60,8 T90,20 L100,15"
              fill="none"
              stroke="var(--color-orange-primary)"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* Sidebar Social Links */}
      <div className="db-sidebar-socials">
        <a href="#discord" className="db-social-btn" aria-label="Discord" onClick={e => e.preventDefault()}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
          </svg>
        </a>
        <a href="#twitter" className="db-social-btn" aria-label="Twitter" onClick={e => e.preventDefault()}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        <a href="#instagram" className="db-social-btn" aria-label="Instagram" onClick={e => e.preventDefault()}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        </a>
        <a href="#youtube" className="db-social-btn" aria-label="YouTube" onClick={e => e.preventDefault()}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.528 3.545 12 3.545 12 3.545s-7.528 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.022 0 12 0 12s0 3.978.502 5.837a3.003 3.003 0 002.11 2.11c1.86.508 9.388.508 9.388.508s7.528 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.978 24 12 24 12s0-3.978-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </a>
      </div>
    </aside>
  );
}
