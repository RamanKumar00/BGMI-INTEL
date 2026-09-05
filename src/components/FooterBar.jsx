import React from 'react';
import { BarChart2, User, Crosshair, Shield } from 'lucide-react';

export default function FooterBar() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="portal-footer">
      <div className="footer-nav">
        <div className="footer-nav-item">
          <BarChart2 size={16} />
          <span>Esports Analytics</span>
        </div>
        <div className="footer-nav-item">
          <User size={16} />
          <span>Player Stats</span>
        </div>
        <div className="footer-nav-item">
          <Crosshair size={16} />
          <span>Map Intelligence</span>
        </div>
        <div className="footer-nav-item">
          <Shield size={16} />
          <span>Team Performance</span>
        </div>
      </div>
      <div className="footer-copyright">
        © {currentYear} BGMI Intel. All rights reserved.
      </div>
    </footer>
  );
}
