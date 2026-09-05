import React from 'react';
import { Radio, Zap, Target, Shield, RefreshCw } from 'lucide-react';

export default function LiveFeedMarquee() {
  const feedItems = [
    {
      id: 1,
      icon: Shield,
      text: 'GodLike Esports eliminated Team Soul in Match 3',
      time: '2 min ago',
      color: '#FF782E'
    },
    {
      id: 2,
      icon: Target,
      text: 'Jonathan achieved 12 finishes in Miramar',
      time: '5 min ago',
      color: '#4CAF50'
    },
    {
      id: 3,
      icon: Zap,
      text: 'Team XSpark is now #2 in BMPS 2024',
      time: '8 min ago',
      color: '#2196F3'
    },
    {
      id: 4,
      icon: RefreshCw,
      text: 'New data synced for Erangel',
      time: '10 min ago',
      color: '#E91E63'
    }
  ];

  // Duplicate items to ensure smooth continuous marquee effect
  const doubleFeedItems = [...feedItems, ...feedItems, ...feedItems];

  return (
    <footer className="db-marquee-footer">
      <div className="db-marquee-label">
        <Radio size={14} className="db-marquee-pulse-icon" />
        <span>LIVE FEED</span>
        <div className="db-marquee-pulse-dot" />
      </div>

      <div className="db-marquee-container">
        <div className="db-marquee-track">
          {doubleFeedItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div className="db-marquee-item" key={`${item.id}-${index}`}>
                <IconComponent size={14} style={{ color: item.color }} className="db-marquee-item-icon" />
                <span className="db-marquee-item-text">{item.text}</span>
                <span className="db-marquee-item-bullet">•</span>
                <span className="db-marquee-item-time">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </footer>
  );
}
