import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// --- Web Audio API Procedural Tactical Sound System ---
class TacticalAudioSystem {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.isMuted = false;
    localStorage.setItem('bgmi_intel_sound_muted', 'false');
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = this.isMuted ? 0 : 0.6;

    this.bgMusic = document.getElementById('intel-bg-music');
    if (!this.bgMusic) {
      this.bgMusic = new Audio('/pubg.mp3');
    }
    this.bgMusic.loop = false;
    this.bgMusic.volume = 1.0;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('bgmi_intel_sound_muted', this.isMuted);
    const targetVolume = this.isMuted ? 0 : 1.0;
    this.masterGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.1);
    if (this.bgMusic) {
      this.bgMusic.volume = targetVolume;
    }
    return this.isMuted;
  }

  resume() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playAmbient() {
    if (this.bgMusic && this.bgMusic.paused) {
      return this.bgMusic.play().catch(e => {
        console.warn('Audio play failed:', e);
        throw e;
      });
    }
    return Promise.resolve();
  }

  stopAmbient() {
    if (this.bgMusic) {
      let vol = this.bgMusic.volume;
      const fadeInterval = setInterval(() => {
        if (vol >= 0.05) {
          vol = Math.max(0, vol - 0.05);
          this.bgMusic.volume = vol;
        } else {
          clearInterval(fadeInterval);
          this.bgMusic.pause();
          this.bgMusic.currentTime = 0;
          this.bgMusic.volume = this.isMuted ? 0 : 1.0;
        }
      }, 50);
    }
  }

  playBeep(type = 'progress') {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    if (type === 'progress') {
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } else if (type === 'deploy') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      
      // Add a low boom
      const boom = this.ctx.createOscillator();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(100, this.ctx.currentTime);
      boom.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.5);
      const boomGain = this.ctx.createGain();
      boomGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      boomGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      boom.connect(boomGain).connect(this.masterGain);
      boom.start();
      boom.stop(this.ctx.currentTime + 0.5);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    }
    
    osc.connect(gain);
    gain.connect(this.masterGain);
  }
}

// --- Component ---
export default function IntelLoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("INITIALIZING INTELLIGENCE...");
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  
  const interactedRef = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize Audio
    if (!audioRef.current) {
      audioRef.current = new TacticalAudioSystem();
      
      // Attempt autoplay
      audioRef.current.playAmbient().then(() => {
        interactedRef.current = true;
        setHasInteracted(true);
      }).catch(() => {
        console.log("Autoplay blocked, waiting for interaction");
        setAutoplayBlocked(true);
      });
    }
    
    // Animation Timeline
    let currentProgress = 0;
    let isActive = true;
    
    const updateProgress = () => {
      if (!isActive) return;
      
      if (autoplayBlocked && !interactedRef.current) {
        // Pause progress until user clicks so they don't miss the sound
        setStatus("SYSTEM PAUSED - CLICK ANYWHERE TO INITIATE BOOT");
        setTimeout(updateProgress, 100);
        return;
      }
      
      const bgMusic = audioRef.current?.bgMusic;
      
      if (bgMusic && bgMusic.duration > 0) {
        currentProgress = (bgMusic.currentTime / bgMusic.duration) * 100;
      } else {
        currentProgress += 0.5;
        if (currentProgress > 5) currentProgress = 5;
      }
      
      if (currentProgress >= 100) currentProgress = 100;
      
      setProgress(Math.floor(currentProgress));

      // Update Status String based on Stages
      if (currentProgress < 20) {
        setStatus("CONNECTING TO INTEL SERVER...");
      } else if (currentProgress < 40) {
        setStatus("LOADING PLAYER DATABASE...");
      } else if (currentProgress < 60) {
        setStatus("LOADING TOURNAMENT DATA...");
      } else if (currentProgress < 80) {
        setStatus("LOADING MATCH STATISTICS...");
      } else if (currentProgress < 95) {
        setStatus("LOADING MAP INTELLIGENCE...");
      } else if (currentProgress < 100) {
        setStatus("SYSTEM READY");
      }

      // Play beep occasionally
      if (interactedRef.current && currentProgress < 100 && Math.random() > 0.95) {
        audioRef.current.playBeep('progress');
      }

      if (currentProgress < 99.5 && (!bgMusic || !bgMusic.ended)) {
        setTimeout(updateProgress, 100);
      } else {
        // Complete
        setProgress(100);
        if (interactedRef.current) audioRef.current.playBeep('deploy');
        setStatus("DEPLOYING INTELLIGENCE...");
        setDeployed(true);
        setTimeout(() => {
          if (audioRef.current) audioRef.current.stopAmbient();
          if (onComplete) onComplete();
        }, 1200); // Wait for transition fade
      }
    };

    updateProgress();

    return () => {
      isActive = false;
      if (audioRef.current) audioRef.current.stopAmbient();
    };
  }, [autoplayBlocked, onComplete]);

  // Handle first interaction to unlock audio
  const handleInteraction = () => {
    if (!interactedRef.current) {
      interactedRef.current = true;
      setHasInteracted(true);
      if (audioRef.current) {
        audioRef.current.resume();
        audioRef.current.playAmbient();
      }
    }
  };

  const handleToggleMute = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      const muted = audioRef.current.toggleMute();
      setIsMuted(muted);
    }
    handleInteraction();
  };

  return (
    <div 
      className={`cinematic-loader-container ${deployed ? 'deployed' : ''} ${autoplayBlocked && !hasInteracted ? 'cursor-pointer pulse-bg' : ''}`}
      onClick={handleInteraction}
    >
      <audio id="intel-bg-music" src="/pubg.mp3" preload="auto" />
      <div className="scanlines"></div>
      
      {/* Background Decor */}
      <div className="map-grid-overlay"></div>
      <div className="orange-glow"></div>
      <div className="particles-layer"></div>

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
                    background: 'rgba(249, 115, 22, 0.2)',
                    borderRight: '2px solid #f97316',
                    boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)',
                    transition: 'width 0.1s linear'
                  }}
                />
                <span className="loader-progress-pct" style={{ position: 'relative', zIndex: 1, width: '100%', textAlign: 'right' }}>{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minor HUD Elements */}
      <div className="hud-corner hud-top-left">
        <div>BGMI INTEL SYSTEM v2.4.1</div>
        <div>DATA NODE: <span className="text-emerald-400">ONLINE</span></div>
      </div>
      
      <div className="hud-corner hud-top-right text-right">
        <div>SYS_MEM: OK</div>
        <div>ENC_KEY: VERIFIED</div>
      </div>
      
      <div className="hud-corner hud-bottom-left">
        <div>LAT: 45.1239</div>
        <div>LNG: 32.8911</div>
      </div>

      {/* Audio Controls */}
      <div className="hud-corner hud-bottom-right">
        {!hasInteracted ? (
          <div className="animate-pulse text-orange-400 font-bold cursor-pointer flex items-center gap-2">
            CLICK ANYWHERE TO ENABLE SYSTEM
          </div>
        ) : (
          <button onClick={handleToggleMute} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="text-xs font-bold">{isMuted ? 'SOUND OFF' : 'SOUND ON'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
