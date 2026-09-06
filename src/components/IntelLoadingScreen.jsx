import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '../services/audioManager';

export default function IntelLoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("INITIALIZING INTELLIGENCE...");
  const [deployed, setDeployed] = useState(false);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    // Attempt playback of the PUBG tactical theme
    audioManager.playLoginTheme().then(() => {
      setAutoplayBlocked(false);
    }).catch(() => {
      setAutoplayBlocked(true);
    });

    let currentProgress = 0;
    const totalDurationMs = 2800;
    const intervalMs = 50;
    const stepIncrement = (100 / (totalDurationMs / intervalMs));

    let lastBeepMilestone = 0;

    const interval = setInterval(() => {
      currentProgress += stepIncrement;

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setProgress(100);
        setStatus("DEPLOYING INTELLIGENCE...");
        setDeployed(true);

        // Play deploy boom sound
        audioManager.playBeep('deploy');

        if (!hasFinishedRef.current) {
          hasFinishedRef.current = true;
          setTimeout(() => {
            audioManager.stopLoginTheme(600);
            if (onComplete) onComplete();
          }, 500);
        }
      } else {
        const intProgress = Math.floor(currentProgress);
        setProgress(intProgress);

        // Play high-tech terminal chirp at telemetry milestones
        if (intProgress >= 25 && lastBeepMilestone < 25) {
          lastBeepMilestone = 25;
          audioManager.playBeep('progress');
        } else if (intProgress >= 50 && lastBeepMilestone < 50) {
          lastBeepMilestone = 50;
          audioManager.playBeep('progress');
        } else if (intProgress >= 75 && lastBeepMilestone < 75) {
          lastBeepMilestone = 75;
          audioManager.playBeep('progress');
        } else if (intProgress >= 90 && lastBeepMilestone < 90) {
          lastBeepMilestone = 90;
          audioManager.playBeep('progress');
        }

        // Status text progression
        if (currentProgress < 25) {
          setStatus("CONNECTING TO INTEL SERVER...");
        } else if (currentProgress < 50) {
          setStatus("SYNCING PRO TOURNAMENTS & BGMS...");
        } else if (currentProgress < 75) {
          setStatus("LOADING DROP TELEMETRY & HEATMAPS...");
        } else if (currentProgress < 95) {
          setStatus("INITIALIZING MATCH EXPLORER...");
        } else {
          setStatus("SYSTEM READY");
        }
      }
    }, intervalMs);

    return () => {
      clearInterval(interval);
      audioManager.stopLoginTheme(300);
    };
  }, [onComplete]);

  // Click anywhere to engage audio if blocked by browser policy
  const handleScreenClick = () => {
    audioManager.unlock();
    audioManager.playLoginTheme().then(() => {
      setAutoplayBlocked(false);
    }).catch(() => {});
  };

  const handleToggleMute = (e) => {
    e.stopPropagation();
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      audioManager.playLoginTheme().catch(() => {});
    }
  };

  return (
    <div 
      className={`cinematic-loader-container ${deployed ? 'deployed' : ''}`}
      onClick={handleScreenClick}
      style={{ cursor: autoplayBlocked ? 'pointer' : 'default' }}
    >
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
                    background: 'linear-gradient(90deg, rgba(245, 90, 5, 0.4), rgba(245, 90, 5, 0.8))',
                    borderRight: '2px solid #F55A05',
                    boxShadow: '0 0 15px rgba(245, 90, 5, 0.7)',
                    transition: 'width 0.05s linear'
                  }}
                />
                <span className="loader-progress-pct" style={{ position: 'relative', zIndex: 1, width: '100%', textAlign: 'right' }}>
                  {progress}%
                </span>
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

      {/* Bottom HUD Audio Controls & Autoplay Banner */}
      <div className="hud-corner hud-bottom-right" style={{ pointerEvents: 'auto' }}>
        {autoplayBlocked ? (
          <div className="animate-pulse flex items-center gap-2 text-xs font-bold text-orange-400 cursor-pointer">
            <Volume2 size={16} />
            <span>CLICK ANYWHERE TO ENGAGE TACTICAL AUDIO</span>
          </div>
        ) : (
          <button 
            type="button"
            onClick={handleToggleMute}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} className="text-orange-400" />}
            <span className="text-[11px] font-bold uppercase font-mono">
              {isMuted ? 'SOUND OFF' : 'SOUND ON'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
