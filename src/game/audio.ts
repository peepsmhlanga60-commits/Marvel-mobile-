/**
 * Procedural Web Audio Synth for Hero Rivals Mobile
 * Zero external asset dependencies. High-impact arcade superhero game audio.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playPrimaryFire(heroId: string) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    switch (heroId) {
      case 'volt':
        // Electric zap
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.1);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.1);
        break;

      case 'titan':
        // Heavy kinetic thud
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.22);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.22);
        break;

      case 'shadow':
        // High speed blade / shuriken whoosh
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.08);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.08);
        break;

      case 'frost':
        // Crystalline ice ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(450, t + 0.14);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.14);
        break;

      case 'nova':
        // Dual laser pulse blaster
        osc.type = 'square';
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.09);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.09);
        break;

      case 'phantom':
      default:
        // Deep astral void pulse
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.18);
        break;
    }
  }

  public playHit(isHeadshot: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = isHeadshot ? 1760 : 880;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, t + 0.06);

    gain.gain.setValueAtTime(isHeadshot ? 0.35 : 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playAbility(abilityNum: 1 | 2) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = abilityNum === 1 ? 'sawtooth' : 'triangle';
    const baseFreq = abilityNum === 1 ? 300 : 450;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * 2.2, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playUltimate() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // Sub-bass impact
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.6);
    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 0.6);

    // Heroic brass synth chord
    const freqs = [330, 415, 495, 660];
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.linearRampToValueAtTime(f * 1.25, t + 0.45);

      gain.gain.setValueAtTime(0.12 / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  public playElimination() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = t + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.16);
    });
  }

  public playCaptureBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const fanfare = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.2 },
      { f: 1046.5, d: 0.5 },
    ];
    let offset = 0;
    fanfare.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, t + offset);
      gain.gain.setValueAtTime(0.2, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + n.d);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + offset);
      osc.stop(t + offset + n.d);
      offset += n.d * 0.9;
    });
  }

  public playDefeat() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const chords = [
      { f: 330, d: 0.3 },
      { f: 311, d: 0.3 },
      { f: 293, d: 0.6 },
    ];
    let offset = 0;
    chords.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, t + offset);
      gain.gain.setValueAtTime(0.25, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + n.d);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + offset);
      osc.stop(t + offset + n.d);
      offset += n.d * 0.85;
    });
  }
}

export const sound = new SoundSystem();
