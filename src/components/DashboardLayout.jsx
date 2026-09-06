import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import OverviewDashboard from './OverviewDashboard';
import PlayersView from './PlayersView';
import TeamsView from './TeamsView';
import TournamentsView from './TournamentsView';
import MatchesView from './MatchesView';
import VersusView from './VersusView';
import MapIntelView from './MapIntelView';
import AchievementsView from './AchievementsView';
import MediaHubView from './MediaHubView';
import LiveFeedMarquee from './LiveFeedMarquee';
import { ShieldAlert } from 'lucide-react';

export default function DashboardLayout({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [season, setSeason] = useState('2026');
  const [mapIntelInitialMap, setMapIntelInitialMap] = useState(null);

  React.useEffect(() => {
    const handleOpenMap = (e) => {
      if (e.detail?.map) {
        setMapIntelInitialMap(e.detail.map);
      }
      setActiveTab('map_intel');
    };
    window.addEventListener('open-interactive-map', handleOpenMap);
    return () => window.removeEventListener('open-interactive-map', handleOpenMap);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard onNavigate={(tab) => setActiveTab(tab)} season={season} />;
      case 'players':
        return <PlayersView season={season} />;
      case 'teams':
        return <TeamsView season={season} />;
      case 'tournaments':
        return <TournamentsView season={season} />;
      case 'media_hub':
      case 'media':
        return <MediaHubView />;
      case 'matches':
      case 'match_explorer':
        return <MatchesView season={season} />;
      case 'versus':
        return <VersusView season={season} />;
      case 'map_intel':
      case 'drop_analysis':
        return <MapIntelView initialMap={mapIntelInitialMap} user={user} />;
      case 'achievements':
        return <AchievementsView season={season} />;

      default:
        // Sector Locked Placeholder View for experimental tabs
        return (
          <div className="db-locked-view">
            <div className="db-locked-card">
              <ShieldAlert className="db-locked-icon animate-pulse" size={64} />
              <h2>SECTOR LOCKED</h2>
              <div className="db-locked-divider" />
              <h3>{activeTab.replace('_', ' ').toUpperCase()}</h3>
              <p>Tactical satellite data stream is currently offline. Encryption key required for access.</p>
              <div className="db-locked-grid-decor">
                <span>INTEL_ERR_CODE: 0x7A9B</span>
                <span>SECURE_LINK: INACTIVE</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout-container">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Grid: Header + Content + Footer */}
      <div className="dashboard-main-area">
        <Header 
          user={user} 
          onLogout={onLogout} 
          onNavigate={(tab) => setActiveTab(tab)} 
          season={season}
          onSeasonChange={setSeason}
        />
        
        <main className="dashboard-content-viewport">
          {renderTabContent()}
        </main>

        {/* Live Feed Ticker Marquee */}
        <LiveFeedMarquee />
      </div>
    </div>
  );
}
