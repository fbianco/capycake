// ---------------------------------------------------------------------------
// Tutorial: a short guided practice cupcake.
//   1. show both paws and touch the two stars
//   2. one of every move, slowly, with a coach explaining it
// No timer, no penalties; SKIP (or Enter) at any time.
// ---------------------------------------------------------------------------
import { DIFFICULTY } from '../config.js';
import { TUTORIAL_RECIPE } from '../data/recipes.js';
import { Kitchen } from './Kitchen.js';

export const COACH = {
  paws: ['Hi chef! Show your paws to the camera.', 'Touch both stars with your paws.'],
  add: ['Make a FIST on the {item} to grab it.', 'Move it over the bowl and OPEN your paw to drop it.'],
  crack: ['CLAP your paws together to crack the egg!', 'Or close your paw on the egg twice (mouse: SPACE).'],
  whisk: ['Whisk! Shake your paw quickly', 'LEFT and RIGHT over the bowl.'],
  stir: ['Stir! Draw big CIRCLES', 'over the bowl.'],
  pour: ['Make a fist on the BOWL, carry it', 'to the cupcake tray and open your paw.'],
  bake: ['Carry the tray into the OVEN.', 'When the gauge is GREEN, make a fist on the oven!'],
  baking: ['Wait for GREEN...', 'then make a FIST on the oven to take it out!'],
  frost: ['Frost it! Draw circles', 'over the cupcakes.'],
  done: ['Yay! You are a CapyCake chef!', 'Now bake the real orders.'],
};

export class Tutorial {
  constructor({ sound, fx }) {
    this.sound = sound;
    this.fx = fx;
    this.kitchen = new Kitchen({ sound, fx });
    this.stage = 'paws';
    this.t = 0;
    this.stars = [];
  }

  start(diffId = 'easy') {
    this.stage = 'paws';
    this.t = 0;
    this.stars = [
      { x: 420, y: 360, hit: false, pop: 0 },
      { x: 860, y: 360, hit: false, pop: 0 },
    ];
    this.kitchen.start({ diff: DIFFICULTY[diffId] ?? DIFFICULTY.easy, orders: [TUTORIAL_RECIPE], mode: 'tutorial' });
    this.kitchen.phase = 'wait'; // the kitchen waits until the paws step is done
  }

  get done() {
    return this.stage === 'done' && this.t > 1.5;
  }

  update(dt, paws, clapped) {
    this.t += dt;
    const k = this.kitchen;
    if (this.stage === 'paws') {
      for (const s of this.stars) {
        s.pop = Math.max(0, s.pop - dt * 2);
        if (s.hit) continue;
        for (const p of paws) {
          if (p.present && Math.hypot(p.x - s.x, p.y - s.y) < 70) {
            s.hit = true;
            s.pop = 1;
            this.sound?.play('star');
            this.fx?.burst(s.x, s.y, { color: '#ffe14d', n: 20, speed: 260, size: 6, star: true });
          }
        }
      }
      // the kitchen scene keeps moving in the background
      k.update(dt, paws.map((p) => ({ ...p, pressed: false, released: false, fist: false })), false);
      if (this.stars.every((s) => s.hit) && this.stars.every((s) => s.pop < 0.4)) {
        this.stage = 'cook';
        this.t = 0;
        k.phase = 'cook';
        k.phaseT = 0;
      }
      return;
    }
    k.update(dt, paws, clapped);
    if (this.stage === 'cook' && (k.phase === 'served' || k.phase === 'done')) {
      this.stage = 'done';
      this.t = 0;
      this.sound?.play('fanfare');
    }
  }

  /** two lines of coach text for the current moment */
  coach() {
    if (this.stage === 'paws') return COACH.paws;
    if (this.stage === 'done') return COACH.done;
    const k = this.kitchen;
    const s = k.current;
    if (!s) return COACH.done;
    if (s.type === 'add' || s.type === 'top') {
      const holding = k.hold.some((h) => h?.type === 'item' && h.item.kind === s.kind);
      const name = s.kind.toUpperCase();
      return holding ? ['Great! Now move it over the bowl', 'and OPEN your paw to drop it.'] : [COACH.add[0].replace('{item}', name), COACH.add[1]];
    }
    if (s.type === 'bake' && k.oven.baking) return COACH.baking;
    return COACH[s.type] ?? ['', ''];
  }
}
