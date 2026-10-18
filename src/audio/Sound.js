// ---------------------------------------------------------------------------
// Sound: every effect and the music are synthesised live with the Web Audio
// API (oscillators + noise), like in Unicorn Run. No audio files needed.
// The little factory tune is original.
// ---------------------------------------------------------------------------

const NOTE = (n) => 440 * 2 ** ((n - 69) / 12); // MIDI note -> Hz

// C - Am - F - G, a bouncy "oom-pah" bass, one eighth note per entry
const BASS = [
  48, 55, 52, 55, 48, 55, 52, 55, 45, 52, 48, 52, 45, 52, 48, 52,
  41, 48, 45, 48, 41, 48, 45, 48, 43, 50, 47, 50, 43, 50, 47, 50,
];
// marimba-like melody (0 = rest)
const LEAD = [
  76, 0, 79, 76, 72, 0, 74, 76, 77, 0, 76, 72, 69, 0, 72, 0,
  77, 0, 81, 77, 72, 0, 76, 77, 79, 77, 76, 74, 71, 0, 74, 0,
  76, 0, 79, 76, 72, 0, 74, 76, 81, 0, 79, 76, 72, 0, 69, 0,
  77, 76, 74, 72, 69, 0, 72, 74, 76, 0, 74, 71, 72, 0, 0, 0,
];

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicOn = false;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
  }

  init() {
    if (this.ctx) {
      this.ctx.resume?.();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 0.85;
      this.sfx.connect(this.master);
      this.music = this.ctx.createGain();
      this.music.gain.value = 0.16;
      this.music.connect(this.master);
      const len = this.ctx.sampleRate * 0.6;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) {
      console.warn('No Web Audio', e);
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone(freq, dur, { type = 'triangle', vol = 0.2, slide = 0, delay = 0, out } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out ?? this.sfx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur, { vol = 0.3, freq = 1800, delay = 0, out, sweep = 0, q = 1 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(out ?? this.sfx);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  play(name) {
    if (!this.ctx) return;
    const arp = (notes, gap, opt = {}) => notes.forEach((f, i) => this.tone(f, opt.dur ?? 0.1, { delay: i * gap, vol: 0.14, ...opt }));
    switch (name) {
      case 'grab': this.tone(600, 0.08, { slide: 500, type: 'sine', vol: 0.22 }); break;
      case 'plop': this.tone(300, 0.12, { slide: -180, type: 'sine', vol: 0.3 }); this.noise(0.06, { freq: 700, vol: 0.12 }); break;
      case 'spawn': this.tone(900, 0.04, { type: 'sine', vol: 0.05 }); break;
      case 'tap': this.noise(0.04, { freq: 2500, vol: 0.25, q: 4 }); break;
      case 'crack':
        this.noise(0.05, { freq: 3000, vol: 0.4, q: 3 });
        this.noise(0.08, { freq: 1800, vol: 0.3, q: 3, delay: 0.05 });
        this.tone(220, 0.15, { slide: -120, type: 'sine', vol: 0.2, delay: 0.08 });
        break;
      case 'whisk': this.noise(0.05, { freq: 4500 + Math.random() * 1500, vol: 0.12, q: 2 }); break;
      case 'shake': this.noise(0.06, { freq: 7000, vol: 0.1, q: 2 }); break;
      case 'stir': this.noise(0.18, { freq: 900, sweep: 600, vol: 0.12 }); break;
      case 'frost': this.noise(0.18, { freq: 1500, sweep: -600, vol: 0.1 }); break;
      case 'pour':
        for (let i = 0; i < 6; i++) this.tone(220 + i * 30, 0.12, { slide: 120, type: 'sine', vol: 0.12, delay: i * 0.15 });
        break;
      case 'oven': this.noise(0.6, { freq: 300, sweep: 900, vol: 0.2 }); this.tone(110, 0.4, { type: 'sine', vol: 0.15 }); break;
      case 'tick': this.tone(1800, 0.02, { type: 'square', vol: 0.03 }); break;
      case 'ding': this.tone(1568, 0.6, { type: 'sine', vol: 0.22 }); this.tone(2093, 0.5, { type: 'sine', vol: 0.12, delay: 0.02 }); break;
      case 'perfect': arp([1047, 1319, 1568, 2093, 2637], 0.05, { type: 'triangle', dur: 0.18, vol: 0.15 }); break;
      case 'burnt': this.tone(160, 0.5, { slide: -60, type: 'sawtooth', vol: 0.12 }); this.noise(0.5, { freq: 400, vol: 0.15 }); break;
      case 'combo': arp([784, 988, 1175, 1568], 0.05, { type: 'square', dur: 0.08, vol: 0.08 }); break;
      case 'wrong':
        this.tone(420, 0.14, { slide: -120, type: 'square', vol: 0.1 });
        this.tone(300, 0.22, { slide: -140, type: 'square', vol: 0.1, delay: 0.13 });
        break;
      case 'boing': this.tone(200, 0.3, { slide: 400, type: 'sine', vol: 0.25 }); break;
      case 'nom': [0, 0.14, 0.28].forEach((d) => this.noise(0.07, { freq: 900, vol: 0.25, delay: d, q: 2 })); break;
      case 'zen': arp([523, 659, 784, 1047, 784, 1047, 1319], 0.08, { type: 'sine', dur: 0.3, vol: 0.14 }); break;
      case 'order': arp([659, 784, 1047], 0.09, { type: 'triangle', dur: 0.15 }); break;
      case 'served':
        [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, { delay: [0, 0.1, 0.2, 0.3, 0.5, 0.6, 0.7][i], vol: 0.15, type: 'square' }));
        break;
      case 'fail': arp([523, 466, 415, 349], 0.16, { type: 'triangle', dur: 0.25, vol: 0.18 }); break;
      case 'fanfare':
        [523, 523, 523, 698, 880, 784, 880, 1047].forEach((f, i) => this.tone(f, 0.22, { delay: [0, 0.15, 0.3, 0.45, 0.75, 1.05, 1.2, 1.4][i], vol: 0.16, type: 'square' }));
        break;
      case 'click': this.tone(880, 0.06, { type: 'square', vol: 0.12 }); this.tone(1320, 0.08, { type: 'square', vol: 0.1, delay: 0.05 }); break;
      case 'hover': this.tone(1200, 0.03, { type: 'sine', vol: 0.06 }); break;
      case 'start': arp([523, 659, 784, 1047], 0.07, { type: 'square', vol: 0.12 }); break;
      case 'star': this.tone(1760, 0.2, { type: 'triangle', vol: 0.18 }); this.tone(2637, 0.25, { type: 'sine', vol: 0.1, delay: 0.05 }); break;
      default: break;
    }
  }

  // ---- music: a tiny look-ahead sequencer -----------------------------------
  startMusic() {
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), 50);
  }

  stopMusic() {
    this.musicOn = false;
    clearInterval(this.timer);
  }

  schedule() {
    const stepDur = 60 / 132 / 2; // eighth notes at 132 bpm
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      const delay = this.nextTime - this.ctx.currentTime;
      const b = BASS[this.step % BASS.length];
      this.tone(NOTE(b), stepDur * (this.step % 2 ? 0.5 : 0.9), { type: 'sine', vol: this.step % 2 ? 0.35 : 0.55, delay, out: this.music });
      const l = LEAD[this.step % LEAD.length];
      if (l) {
        this.tone(NOTE(l), stepDur * 0.9, { type: 'triangle', vol: 0.5, delay, out: this.music });
        this.tone(NOTE(l + 12), stepDur * 0.3, { type: 'sine', vol: 0.12, delay, out: this.music });
      }
      if (this.step % 2 === 1) this.noise(0.025, { freq: 9000, vol: 0.05, delay, out: this.music });
      this.step++;
      this.nextTime += stepDur;
    }
  }
}
