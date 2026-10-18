// ---------------------------------------------------------------------------
// Bot: a robot chef that plays the kitchen with one virtual paw.
// Used for the demo mode (/?demo) and by the automated tests, so the whole
// game can be checked without a webcam.
// ---------------------------------------------------------------------------
import { LAYOUT } from '../config.js';

const SPEED = 1500; // px per second

export class Bot {
  constructor() {
    this.paw = { present: true, x: 640, y: 420, fist: false };
    this.t = 0;
    this.phaseT = 0;
    this.lastStep = -1;
    this.mistake = false; // set true to make it drop a wrong item once (tests)
  }

  /** returns two paws: paw 0 unused, paw 1 driven by the bot */
  update(dt, k) {
    this.t += dt;
    const p = this.paw;
    const step = k.current;
    if (k.step !== this.lastStep) {
      this.lastStep = k.step;
      this.phaseT = 0;
    }
    this.phaseT += dt;
    const held = k.hold[1];
    let goal = { x: 640, y: 420 };
    let fist = p.fist;
    const at = (q, r = 22) => Math.hypot(p.x - q.x, p.y - q.y) < r;

    if (!step || k.phase !== 'cook') {
      fist = false;
      goal = { x: 640, y: 400 };
    } else if (step.type === 'add' || step.type === 'top') {
      const dest = step.type === 'add' ? { x: k.bowl.x, y: k.bowl.y - 40 } : { x: k.tin.x, y: k.tin.y - 40 };
      if (held?.type === 'item') {
        goal = dest;
        fist = !at(dest, 25);
      } else {
        let best = null;
        for (const it of k.items) {
          if (it.kind !== step.kind || it.state !== 'belt' || it.x < 160) continue;
          if (!best || it.x < best.x) best = it;
        }
        if (best) {
          goal = { x: best.x - 30, y: best.y };
          fist = at(best, 40);
        } else {
          goal = { x: 900, y: 300 };
          fist = false;
        }
      }
    } else if (step.type === 'crack') {
      goal = { x: k.bowl.x + 60, y: k.bowl.y - 60 };
      fist = at(goal, 30) && Math.floor(this.t * 6) % 2 === 0;
    } else if (step.type === 'whisk' || step.type === 'sprinkle') {
      const c = step.type === 'whisk' ? k.bowl : k.tin;
      goal = { x: c.x + Math.sin(this.t * 22) * 75, y: c.y - 40 };
      fist = false;
      p.x = goal.x;
      p.y = goal.y;
    } else if (step.type === 'stir' || step.type === 'frost') {
      const c = step.type === 'stir' ? k.bowl : k.tin;
      const a = this.t * 7;
      goal = { x: c.x + Math.cos(a) * 80, y: c.y - 30 + Math.sin(a) * 80 };
      fist = false;
      p.x = goal.x;
      p.y = goal.y;
    } else if (step.type === 'pour') {
      if (held?.type === 'bowl') {
        goal = { x: k.tin.x, y: k.tin.y - 60 };
        fist = !at(goal, 20);
      } else {
        goal = { x: k.bowl.x, y: k.bowl.y - 30 };
        fist = at(goal, 25) && k.bowl.pourT === 0;
      }
    } else if (step.type === 'bake') {
      const o = LAYOUT.oven;
      const oc = { x: o.x + o.w / 2, y: o.y + 130 };
      if (k.oven.baking) {
        goal = oc;
        const [a, b] = k.bakeWindow;
        fist = k.bakeProgress > (a + b) / 2;
      } else if (held?.type === 'tin') {
        goal = oc;
        fist = !at(oc, 25);
      } else {
        goal = { x: k.tin.x, y: k.tin.y - 30 };
        fist = at(goal, 25) && k.tin.filled >= 1;
      }
    }
    // move towards the goal
    const dx = goal.x - p.x;
    const dy = goal.y - p.y;
    const d = Math.hypot(dx, dy);
    const s = Math.min(d, SPEED * dt);
    if (d > 0.01) {
      p.x += (dx / d) * s;
      p.y += (dy / d) * s;
    }
    p.fist = fist;
    return [{ present: false, x: 300, y: 400, fist: false }, { ...p }];
  }
}
