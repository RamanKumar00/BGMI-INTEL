/**
 * BGMI INTEL — TACTICAL AUDIO SYSTEM
 * Singleton audio manager handling cinematic boot music (/pubg.mp3),
 * procedural Web Audio API tactical telemetry beeps, and browser autoplay unlocking.
 */

class TacticalAudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgAudio = null;
    this.isMuted = false;
    this.isUnlocked = false;

    // Load persisted mute preference (default: sound enabled)
    try {
      const savedMute = localStorage.getItem('bgmi_sound_muted');
      this.isMuted = savedMute === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  // Initialize Web Audio context and Audio element
  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.connect(this.ctx.destination);
          this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
        }
      } catch (err) {
        console.warn('[Audio] Failed to initialize AudioContext:', err);
      }
    }

    if (!this.bgAudio && typeof window !== 'undefined') {
      try {
        this.bgAudio = new Audio('/pubg.mp3');
        this.bgAudio.preload = 'auto';
        this.bgAudio.loop = false;
        this.bgAudio.volume = this.isMuted ? 0 : 0.85;
      } catch (err) {
        console.warn('[Audio] Failed to initialize Audio element:', err);
      }
    }
  }

  // Pre-unlock audio within user gesture (Login / Submit click)
  unlock() {
    this.initContext();
    this.isUnlocked = true;

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => console.warn('[Audio] Resume error:', e));
    }

    if (this.bgAudio) {
      // Play and pause immediately to establish permission
      const playPromise = this.bgAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Unlocked successfully
          })
          .catch((err) => {
            console.warn('[Audio] User unlock error (will retry on boot):', err);
          });
      }
    }
  }

  // Play the cinematic PUBG boot theme
  playLoginTheme() {
    this.initContext();

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (!this.bgAudio) return Promise.resolve();

    this.bgAudio.currentTime = 0;
    this.bgAudio.volume = this.isMuted ? 0 : 0.85;

    const promise = this.bgAudio.play();
    if (promise !== undefined) {
      return promise.catch((err) => {
        console.warn('[Audio] Autoplay blocked or deferred:', err);
        return Promise.reject(err);
      });
    }
    return Promise.resolve();
  }

  // Smoothly stop and rewind the theme song
  stopLoginTheme(fadeMs = 800) {
    if (!this.bgAudio) return;

    if (fadeMs <= 0) {
      this.bgAudio.pause();
      this.bgAudio.currentTime = 0;
      return;
    }

    const startVol = this.bgAudio.volume;
    const steps = 16;
    const stepTime = fadeMs / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const ratio = 1 - currentStep / steps;
      if (this.bgAudio && !this.isMuted) {
        this.bgAudio.volume = Math.max(0, startVol * ratio);
      }
      if (currentStep >= steps) {
        clearInterval(interval);
        if (this.bgAudio) {
          this.bgAudio.pause();
          this.bgAudio.currentTime = 0;
          this.bgAudio.volume = this.isMuted ? 0 : 0.85;
        }
      }
    }, stepTime);
  }

  // Generate procedural tactical sound effects via Web Audio API
  playBeep(type = 'progress') {
    if (this.isMuted) return;
    this.initContext();

    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;

    if (type === 'progress') {
      // High-tech terminal chirp (800Hz -> 1400Hz)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'deploy') {
      // Epic deep cinematic sub-bass drop & lock
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.45);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.45);

      // Low end boom
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(120, now);
      boom.frequency.exponentialRampToValueAtTime(25, now + 0.5);

      boomGain.gain.setValueAtTime(0.4, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      boom.connect(boomGain);
      boomGain.connect(this.masterGain);
      boom.start(now);
      boom.stop(now + 0.5);
    } else if (type === 'click') {
      // Tactile button click chirp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  }

  // Toggle Mute On/Off
  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('bgmi_sound_muted', this.isMuted ? 'true' : 'false');
    } catch {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    if (this.bgAudio) {
      this.bgAudio.volume = this.isMuted ? 0 : 0.85;
    }
    return this.isMuted;
  }
}

export const audioManager = new TacticalAudioManager();
export default audioManager;
