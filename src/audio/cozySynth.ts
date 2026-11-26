// Procedural soft Web Audio synth engine — zero external audio dependencies.

class CozySynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientNodes: { oscs: OscillatorNode[]; gain: GainNode } | null = null;
  private muted = false;
  private ambientEnabled = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.28;
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : 0.28,
        this.ctx.currentTime,
        0.06,
      );
    }
    if (muted && this.ambientNodes && this.ctx) {
      this.ambientNodes.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    } else if (!muted && this.ambientEnabled && this.ambientNodes && this.ctx) {
      this.ambientNodes.gain.gain.setTargetAtTime(
        0.045,
        this.ctx.currentTime,
        0.3,
      );
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleAmbient(enable: boolean) {
    this.ambientEnabled = enable;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    if (enable && !this.ambientNodes) {
      const ambGain = ctx.createGain();
      ambGain.gain.value = 0.0001;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;

      ambGain.connect(filter);
      filter.connect(this.masterGain);

      // Warm Cmaj9 soft drone pad (C3, G3, D4)
      const freqs = [130.81, 196.0, 293.66];
      const oscs = freqs.map((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = (idx - 1) * 4;
        osc.connect(ambGain);
        osc.start();
        return osc;
      });

      this.ambientNodes = { oscs, gain: ambGain };
      ambGain.gain.setTargetAtTime(0.045, ctx.currentTime, 0.8);
    } else if (this.ambientNodes) {
      this.ambientNodes.gain.gain.setTargetAtTime(
        enable && !this.muted ? 0.045 : 0.0001,
        ctx.currentTime,
        0.35,
      );
    }
  }

  private playTone(
    freq: number,
    duration: number,
    delay = 0,
    type: OscillatorType = 'sine',
    volume = 0.16,
  ) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  public playClick() {
    this.playTone(587.33, 0.11, 0, 'sine', 0.1);
  }

  public playHop() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.11);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playCrystalPickup() {
    // Soft celesta pentatonic chime
    this.playTone(783.99, 0.25, 0, 'sine', 0.14);
    this.playTone(1046.5, 0.32, 0.06, 'triangle', 0.11);
  }

  public playHint() {
    this.playTone(659.25, 0.25, 0, 'sine', 0.12);
    this.playTone(880.0, 0.35, 0.07, 'sine', 0.12);
  }

  public playCorrect(comboTier = 1) {
    // Warm ascending pentatonic arpeggio shifted subtly up with combo
    const base = [523.25, 659.25, 783.99, 1046.5];
    const ratio = comboTier >= 2.0 ? 1.122 : comboTier >= 1.5 ? 1.059 : 1;
    base.forEach((f, idx) => {
      this.playTone(
        f * ratio,
        0.38,
        idx * 0.065,
        idx % 2 === 0 ? 'sine' : 'triangle',
        0.15,
      );
    });
  }

  public playWrongGentle() {
    // Cozy muffled wooden marimba — reassuring, never harsh
    this.playTone(349.23, 0.22, 0, 'triangle', 0.11);
    this.playTone(293.66, 0.32, 0.09, 'sine', 0.1);
  }

  public playEvolve() {
    // Radiant celestial chord progression
    const notes = [392.0, 493.88, 587.33, 783.99, 987.77, 1174.66];
    notes.forEach((f, i) => {
      this.playTone(f, 0.65, i * 0.085, 'sine', 0.15);
    });
  }

  public playTreat() {
    this.playTone(587.33, 0.2, 0, 'triangle', 0.12);
    this.playTone(739.99, 0.24, 0.07, 'sine', 0.13);
    this.playTone(880.0, 0.34, 0.14, 'sine', 0.13);
  }

  public playUpgrade() {
    this.playTone(440, 0.22, 0, 'sine', 0.13);
    this.playTone(554.37, 0.24, 0.06, 'sine', 0.13);
    this.playTone(659.25, 0.35, 0.12, 'triangle', 0.14);
  }
}

export const cozySynth = new CozySynthEngine();
