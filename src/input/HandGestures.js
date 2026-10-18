// ---------------------------------------------------------------------------
// HandGestures: MediaPipe hand landmarks -> two capybara paws on screen.
//
//   21 points per hand (0 = wrist, 5/9/13/17 = knuckles, 8/12/16/20 = tips)
//   palm centre  = average of wrist + knuckles      -> paw position
//   finger reach = tip->wrist / knuckle->wrist      -> open paw or fist
//
// The picture is mirrored (like a mirror, your right hand is on the right).
// Paw 0 is the one on the left of the screen, paw 1 the one on the right;
// hands keep their paw while they move around (nearest match).
// Pure logic, no browser needed: tested in tests/gestures.test.mjs.
// ---------------------------------------------------------------------------
import { CAM, GESTURE, W, H } from '../config.js';
import { OneEuro } from './Motion.js';

export const HL = { WRIST: 0, THUMB_TIP: 4, INDEX_MCP: 5, INDEX_PIP: 6, INDEX_TIP: 8, MIDDLE_MCP: 9, MIDDLE_TIP: 12, RING_MCP: 13, RING_TIP: 16, PINKY_MCP: 17, PINKY_TIP: 20 };
const FINGERS = [[5, 8], [9, 12], [13, 16], [17, 20]]; // knuckle, tip
const PALM = [0, 5, 9, 13, 17];

/** average finger reach (open hand ~1.9, fist ~1.0). `aspect` = video w/h */
export function fingerReach(lm, aspect = 16 / 9) {
  const d = (a, b) => Math.hypot((a.x - b.x) * aspect, a.y - b.y, ((a.z ?? 0) - (b.z ?? 0)) * aspect);
  const wrist = lm[0];
  let sum = 0;
  for (const [mcp, tip] of FINGERS) {
    const base = d(lm[mcp], wrist);
    sum += base > 1e-6 ? d(lm[tip], wrist) / base : 2;
  }
  return sum / FINGERS.length;
}

/** palm centre in camera coordinates (0..1, not mirrored) */
export function palmCenter(lm) {
  let x = 0;
  let y = 0;
  for (const i of PALM) {
    x += lm[i].x;
    y += lm[i].y;
  }
  return { x: x / PALM.length, y: y / PALM.length };
}

/** camera point (0..1, raw) -> logical screen pixels, mirrored */
export function camToScreen(p) {
  const mx = 1 - p.x;
  const u = (mx - CAM.x0) / (CAM.x1 - CAM.x0);
  const v = (p.y - CAM.y0) / (CAM.y1 - CAM.y0);
  return {
    x: Math.max(0, Math.min(W, u * W)),
    y: Math.max(0, Math.min(H, v * H)),
  };
}

function newPaw(i) {
  return {
    index: i,
    present: false,
    x: i === 0 ? W * 0.3 : W * 0.7,
    y: H * 0.6,
    rawX: 0,
    rawY: 0,
    fist: false,
    reach: 2,
    pending: null,   // open/closed state waiting to be confirmed
    pendingN: 0,
    lastSeen: -1,
    fx: new OneEuro(),
    fy: new OneEuro(),
    lm: null,
  };
}

export class HandGestures {
  constructor() {
    this.paws = [newPaw(0), newPaw(1)];
    this.aspect = 16 / 9;
  }

  reset() {
    this.paws = [newPaw(0), newPaw(1)];
  }

  /**
   * hands: array of landmark lists (MediaPipe result.landmarks), t in seconds.
   * Updates and returns the two paws.
   */
  update(hands, t) {
    const det = (hands ?? []).slice(0, 2).map((lm) => {
      const s = camToScreen(palmCenter(lm));
      return { lm, x: s.x, y: s.y, reach: fingerReach(lm, this.aspect) };
    });
    const assign = this.match(det, t);
    for (const paw of this.paws) {
      const d = assign[paw.index];
      if (d) {
        if (!paw.present || t - paw.lastSeen > GESTURE.lostMs / 1000) {
          paw.fx.reset();
          paw.fy.reset();
          paw.fist = d.reach < GESTURE.fistClose;
          paw.pending = null;
        }
        paw.present = true;
        paw.lastSeen = t;
        paw.rawX = d.x;
        paw.rawY = d.y;
        paw.x = paw.fx.filter(d.x, t);
        paw.y = paw.fy.filter(d.y, t);
        paw.reach = d.reach;
        paw.lm = d.lm;
        this.updateFist(paw, d.reach);
      } else if (paw.present && t - paw.lastSeen > GESTURE.lostMs / 1000) {
        paw.present = false;
        paw.lm = null;
      }
    }
    return this.paws;
  }

  updateFist(paw, reach) {
    let want = paw.fist;
    if (!paw.fist && reach < GESTURE.fistClose) want = true;
    if (paw.fist && reach > GESTURE.fistOpen) want = false;
    if (want === paw.fist) {
      paw.pending = null;
      paw.pendingN = 0;
      return;
    }
    if (paw.pending === want) paw.pendingN++;
    else {
      paw.pending = want;
      paw.pendingN = 1;
    }
    if (paw.pendingN >= GESTURE.stableFrames) {
      paw.fist = want;
      paw.pending = null;
      paw.pendingN = 0;
    }
  }

  /** which detection goes to which paw: returns [det|null, det|null] */
  match(det, t) {
    const out = [null, null];
    if (det.length === 0) return out;
    const recent = this.paws.map((p) => p.present && t - p.lastSeen < 0.6);
    const dist = (p, d) => Math.hypot(p.x - d.x, p.y - d.y);
    if (det.length === 2) {
      const [a, b] = det;
      if (recent[0] && recent[1]) {
        const straight = dist(this.paws[0], a) + dist(this.paws[1], b);
        const swapped = dist(this.paws[0], b) + dist(this.paws[1], a);
        if (straight <= swapped) { out[0] = a; out[1] = b; } else { out[0] = b; out[1] = a; }
      } else {
        // left-most hand on screen is paw 0
        if (a.x <= b.x) { out[0] = a; out[1] = b; } else { out[0] = b; out[1] = a; }
      }
      return out;
    }
    const d = det[0];
    if (recent[0] && recent[1]) {
      out[dist(this.paws[0], d) <= dist(this.paws[1], d) ? 0 : 1] = d;
    } else if (recent[0] && dist(this.paws[0], d) < 320) out[0] = d;
    else if (recent[1] && dist(this.paws[1], d) < 320) out[1] = d;
    else out[d.x < W / 2 ? 0 : 1] = d;
    return out;
  }
}
