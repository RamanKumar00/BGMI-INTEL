import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// --- Web Audio API Procedural Tactical Sound System ---
class TacticalAudioSystem {
  constructor() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.ctx = null;
    }
    this.isMuted = false;
    this.bgMusic = null;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playAmbient() {
    return Promise.resolve();
  }

  stopAmbient() {}

  playBeep() {}
}

// --- Component ---
export default function IntelLoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("INITIALIZING INTELLIGENCE...");
  const [deployed, setDeployed] = useState(false);
  
  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setProgress(100);
        setStatus("DEPLOYING INTELLIGENCE...");
        setDeployed(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
      } else {
        setProgress(currentProgress);
        if (currentProgress < 30) {
          setStatus("CONNECTING TO INTEL SERVER...");
        } else if (currentProgress < 60) {
          setStatus("LOADING TOURNAMENT DATA...");
        } else if (currentProgress < 90) {
          setStatus("LOADING MAP INTELLIGENCE...");
        } else {
          setStatus("SYSTEM READY");
        }
      }
    }, 60);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`cinematic-loader-container ${deployed ? 'deployed' : ''}`}>
      <div className="scanlines"></div>
      <div className="map-grid-overlay"></div>
      <div className="orange-glow"></div>

      {/* Main HUD */}
      <div className="hud-wrapper">
        <div className="hud-brackets">
          <div className="bracket bracket-top-left"></div>
          <div className="bracket bracket-top-right"></div>
          <div className="bracket bracket-bottom-left"></div>
          <div className="bracket bracket-bottom-right"></div>
          
          <div className="hud-content">
            <img src="/helmet_logo.png" alt="Logo" className="loader-logo" />
            <div className="loader-title">BGMI <span>INTEL</span></div>
            
            <div className="loader-status-container">
              <div className="loader-status-text glitch-text" data-text={status}>
                {status}
              </div>
              <div className="loader-progress-bar" style={{ position: 'relative', overflow: 'hidden' }}>
                <div 
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, height: '100%',
                    width: `${progress}%`,
                    background: 'rgba(249, 115, 22, 0.4)',
                    borderRight: '2px solid #f97316',
                    boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)',
                    transition: 'width 0.05s linear'
                  }}
                />
                <span className="loader-progress-pct" style={{ position: 'relative', zIndex: 1, width: '100%', textAlign: 'right' }}>{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hud-corner hud-top-left">
        <div>BGMI INTEL SYSTEM v2.4.1</div>
        <div>DATA NODE: <span className="text-emerald-400">ONLINE</span></div>
      </div>
      
      <div className="hud-corner hud-top-right text-right">
        <div>SYS_MEM: OK</div>
        <div>ENC_KEY: VERIFIED</div>
      </div>
    </div>
  );
}
