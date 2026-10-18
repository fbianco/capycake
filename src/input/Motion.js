// ---------------------------------------------------------------------------
// Motion.js - small detectors that turn paw movements into kitchen moves.
// They only use screen positions (x, y in logical pixels) and times in
// seconds, so they work the same for webcam hands, the mouse and the tests.
// ---------------------------------------------------------------------------
import { GESTURE } from '../config.js';

/** One-Euro filter: smooths jitter when still, follows fast moves quickly. */
export class OneEuro {
  constructor(minCutoff = GESTURE.smoothMinCutoff, beta = GESTURE.smoothBeta, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.x = null;
    this.dx = 0;
    this.t = null;
  }

  reset() {
    this.x = null;
    this.t = null;
    this.dx = 0;
  }

  filter(value, tSec) {
    if (this.x === null || this.t === null || tSec <= this.t) {
      this.x = value;
      this.t = tSec;
      return value;
    }
    const dt = Math.min(0.2, tSec - this.t);
    this.t = tSec;
    const a = (cutoff) => {
      const r = 2 * Math.PI * cutoff * dt;
      return r / (r + 1);
    };
    const dxNow = (value - this.x) / dt;
    this.dx += a(this.dCutoff) * (dxNow - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += a(cutoff) * (value - this.x);
    return this.x;
  }
}

/**
 * Whisk / shake: counts quick left-right direction changes. Each change
 * counts only if the paw travelled at least `amp` pixels since the last one.
 */
export class WhiskDetector {
  constructor(amp = GESTURE.whiskAmp) {
    this.amp = amp;
    this.reset();
  }

  reset() {
    this.count = 0;
    this.dir = 0;          // current direction: -1 left, +1 right
    this.anchor = null;    // x where the current swing started
    this.extreme = null;   // furthest x reached in the current swing
  }

  /** Feed a paw position. Returns true when a new swing was counted. */
  update(x) {
    if (this.extreme === null) {
      this.anchor = x;
      this.extreme = x;
      return false;
    }
    if (this.dir === 0) {
      if (Math.abs(x - this.anchor) > 8) {
        this.dir = Math.sign(x - this.anchor);
        this.extreme = x;
      }
      return false;
    }
    if ((x - this.extreme) * this.dir > 0) {
      this.extreme = x;            // still going the same way
      return false;
    }
    if (Math.abs(x - this.extreme) < 10) return false; // jitter
    // the paw turned around
    const swing = Math.abs(this.extreme - this.anchor);
    this.anchor = this.extreme;
    this.dir = -this.dir;
    this.extreme = x;
    if (swing >= this.amp) {
      this.count++;
      return true;
    }
    return false;
  }

  /** lost the paw: keep the count, forget the last position */
  pause() {
    this.extreme = null;
    this.dir = 0;
  }
}

/**
 * Stir / frost: adds up how far the paw turned around a centre point.
 * Signed sum, so random shaking cancels out and only real circles count.
 */
export class StirDetector {
  constructor(minR = GESTURE.stirMinR, maxR = GESTURE.stirMaxR) {
    this.minR = minR;
    this.maxR = maxR;
    this.reset();
  }

  reset() {
    this.angle = 0;     // signed, radians
    this.lastA = null;
  }

  get turns() {
    return Math.abs(this.angle) / (Math.PI * 2);
  }

  update(x, y, cx, cy) {
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.hypot(dx, dy);
    if (r < this.minR || r > this.maxR) {
      this.lastA = null;
      return 0;
    }
    const a = Math.atan2(dy, dx);
    if (this.lastA === null) {
      this.lastA = a;
      return 0;
    }
    let d = a - this.lastA;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    this.lastA = a;
    d = Math.max(-0.7, Math.min(0.7, d));
    // keep turning the same way as before (reversing un-stirs a bit)
    this.angle += d;
    return d;
  }

  pause() {
    this.lastA = null;
  }
}

/**
 * Clap: both paws far apart, then close together within a short time.
 * When the camera merges two hands that touch, one hand vanishes: a paw
 * that disappears right next to the other one also counts.
 */
export class ClapDetector {
  constructor() {
    this.lastApartAt = -99;
    this.lastClapAt = -99;
    this.prevDist = null;
  }

  update(a, b, t) {
    if (t - this.lastClapAt < GESTURE.clapCooldown / 1000) {
      if (a.present && b.present) this.prevDist = Math.hypot(a.x - b.x, a.y - b.y);
      return false;
    }
    if (a.present && b.present) {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      this.prevDist = d;
      if (d > GESTURE.clapApart) this.lastApartAt = t;
      if (d < GESTURE.clapDist && t - this.lastApartAt < GESTURE.clapWindow / 1000) {
        this.lastClapAt = t;
        this.lastApartAt = -99;
        return true;
      }
      return false;
    }
    // one paw vanished right next to the other
    if ((a.present !== b.present) && this.prevDist !== null && this.prevDist < GESTURE.clapDist * 1.5
      && t - this.lastApartAt < GESTURE.clapWindow / 1000) {
      this.prevDist = null;
      this.lastClapAt = t;
      this.lastApartAt = -99;
      return true;
    }
    this.prevDist = null;
    return false;
  }
}

/** Two closings of a paw on the same spot in a short time (tap-tap). */
export class TapDetector {
  constructor() {
    this.taps = [];
  }

  reset() {
    this.taps = [];
  }

  /** call when a paw closes over the target; returns the tap count (1, 2...) */
  tap(t) {
    this.taps = this.taps.filter((x) => t - x < GESTURE.tapWindow / 1000);
    this.taps.push(t);
    return this.taps.length;
  }
}
