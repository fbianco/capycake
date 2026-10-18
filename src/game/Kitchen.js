// ---------------------------------------------------------------------------
// Kitchen: the rules of CapyCake.
//
// One game = a list of orders (recipes). For each order the player follows
// the recipe steps in order: grab ingredients from the conveyor belt and drop
// them in the bowl, crack eggs, whisk, stir, pour the batter in the tin, bake
// it in the oven (take it out on GREEN), then decorate.
// Right step = points (and a growing combo), wrong ingredient = "Oops!".
//
// Pure game logic: it gets two paws per update and tells Sound / Particles
// what happened. The Renderer only reads this object. Tested in
// tests/kitchen.test.mjs with simulated paws.
// ---------------------------------------------------------------------------
import { LAYOUT, SCORE, BAKE_AUTO_OUT, GESTURE } from '../config.js';
import { INGREDIENTS, DISTRACTORS, isIngredient, itemName, stepHint } from '../data/recipes.js';
import { WhiskDetector, StirDetector, TapDetector } from '../input/Motion.js';

const GRAB_BUFFER = 0.25;   // s: a paw that closed just before reaching an item still grabs it
const MOVE_TYPES = new Set(['crack', 'whisk', 'stir', 'pour', 'bake', 'frost', 'sprinkle']);
const CAPY_HEAD = { dx: 0, dy: -10, r: 85 };

let nextId = 1;

export class Kitchen {
  constructor({ sound = null, fx = null, rnd = Math.random } = {}) {
    this.sound = sound;
    this.fx = fx;
    this.rnd = rnd;
    this.time = 0;
    this.diff = null;
    this.mode = 'game';
    this.orders = [];
    this.reset();
  }

  reset() {
    this.items = [];
    this.hold = [null, null];          // what each paw holds: {type:'item', item} | {type:'bowl'} | {type:'tin'}
    this.pressAt = [-99, -99];
    this.goneFor = [0, 0];
    this.msgs = [];
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.orderIndex = 0;
    this.results = [];                 // one per order: {recipe, stars, points, rating, failed}
    this.capy = { mood: 'idle', moodT: 0, orange: false, bounce: 0, spicy: 0 };
    this.orangeBonusGiven = false;
    this.phase = 'idle';
    this.phaseT = 0;
    this.newOrderState();
  }

  newOrderState() {
    const B = LAYOUT.bowl;
    const T = LAYOUT.tin;
    this.step = 0;
    this.mistakes = 0;
    this.orderPoints = 0;
    this.bowl = { x: B.x, y: B.y, homeX: B.x, homeY: B.y, contents: [], egg: false, crackT: 0, mixed: 0, splash: 0, pourT: 0, wobble: 0, held: -1 };
    this.tin = { x: T.x, y: T.y, homeX: T.x, homeY: T.y, type: 'cupcake', filled: 0, held: -1, inOven: false, baked: null, frost: 0, sprinkles: [], toppings: [], batter: '#fbf1dc' };
    this.oven = { baking: false, t: 0, dur: 5, door: 0, dinged: false, glow: 0 };
    this.whisk = new WhiskDetector();
    this.stir = new StirDetector();
    this.taps = new TapDetector();
    this.moveProgress = 0;
    this.lastCount = 0;
    this.spawnT = 0.4;
    this.sinceNeed = 99;
    this.rating = null;
    this.timeLeft = 0;
    this.timeTotal = 0;
  }

  /**
   * diff: a DIFFICULTY entry, orders: list of recipes,
   * mode: 'game' | 'tutorial' (no timer, no penalties, only useful items)
   */
  start({ diff, orders, mode = 'game' }) {
    this.diff = diff;
    this.orders = orders;
    this.mode = mode;
    this.reset();
    this.beginOrder(0);
  }

  beginOrder(i) {
    this.orderIndex = i;
    this.newOrderState();
    const r = this.recipe;
    this.tin.type = r.tin;
    this.timeTotal = this.mode === 'game' ? Math.round(r.steps.length * this.diff.secPerStep) : 0;
    this.timeLeft = this.timeTotal;
    this.phase = 'intro';
    this.phaseT = 0;
    // keep the belt items, but free the paws
    this.hold = [null, null];
    this.sound?.play('order');
  }

  get recipe() {
    return this.orders[this.orderIndex];
  }

  get current() {
    return this.recipe?.steps[this.step] ?? null;
  }

  get isTutorial() {
    return this.mode === 'tutorial';
  }

  get finished() {
    return this.phase === 'done';
  }

  /** the next ingredient the recipe will ask for (also during moves) */
  neededKind() {
    const steps = this.recipe?.steps ?? [];
    for (let i = this.step; i < steps.length; i++) {
      const s = steps[i];
      if (s.type === 'add' || s.type === 'top') return s.kind;
    }
    return null;
  }

  get multiplier() {
    return Math.min(SCORE.comboMax, 1 + 0.5 * Math.floor(this.combo / SCORE.comboEvery));
  }

  // -------------------------------------------------------------------------
  update(dt, paws, clapped = false) {
    this.time += dt;
    this.phaseT += dt;
    this.updateMsgs(dt);
    this.updateCapy(dt);
    this.updateBelt(dt);
    this.updateBowl(dt);
    this.updateOven(dt);

    if (this.phase === 'intro' && this.phaseT > 1.8) {
      this.phase = 'cook';
      this.phaseT = 0;
    }
    if (this.phase === 'cook' && this.mode === 'game') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.failOrder();
      }
    }
    if ((this.phase === 'served' || this.phase === 'failed') && this.phaseT > 3.2) {
      if (this.orderIndex + 1 < this.orders.length) this.beginOrder(this.orderIndex + 1);
      else {
        this.phase = 'done';
        this.phaseT = 0;
      }
    }

    const cooking = this.phase === 'cook' || this.phase === 'intro';
    for (const paw of paws) this.updatePaw(paw, dt, cooking);
    if (cooking) {
      this.updateMoves(paws, clapped);
    }
  }

  // ---- paws -----------------------------------------------------------------
  updatePaw(paw, dt, cooking) {
    const i = paw.index;
    const h = this.hold[i];
    if (paw.pressed) this.pressAt[i] = this.time;
    if (!paw.present) {
      this.goneFor[i] += dt;
      if (h && this.goneFor[i] > GESTURE.dropLostMs / 1000) this.drop(paw, true);
      return;
    }
    this.goneFor[i] = 0;
    if (h) {
      if (h.type === 'item') {
        h.item.x = paw.x;
        h.item.y = paw.y + 8;
      } else if (h.type === 'bowl') {
        this.bowl.x = paw.x;
        this.bowl.y = paw.y + 30;
      } else if (h.type === 'tin') {
        this.tin.x = paw.x;
        this.tin.y = paw.y + 25;
      }
      if (!paw.fist) this.drop(paw, false);
      return;
    }
    if (!cooking || !paw.fist) return;
    const fresh = this.time - this.pressAt[i] < GRAB_BUFFER;
    const sticky = this.diff.sticky || this.isTutorial;
    const step = this.current;

    // take the cake out of the oven (needs a fresh closing of the paw)
    if (fresh && this.oven.baking && this.inOven(paw.x, paw.y, 30)) {
      this.takeOut();
      this.pressAt[i] = -99;
      return;
    }
    // tap the egg twice
    if (paw.pressed && step?.type === 'crack' && this.bowl.egg && this.nearBowl(paw)) {
      if (this.taps.tap(this.time) >= 2) this.crackEgg();
      else {
        this.sound?.play('tap');
        this.bowl.wobble = 1;
      }
      return;
    }
    if (!(fresh || sticky)) return;
    if (step?.type === 'pour' && this.bowl.pourT === 0 && this.nearBowl(paw)) {
      this.hold[i] = { type: 'bowl' };
      this.bowl.held = i;
      this.sound?.play('grab');
      return;
    }
    if (step?.type === 'bake' && this.tin.filled >= 1 && !this.tin.inOven && !this.oven.baking && this.nearTin(paw)) {
      this.hold[i] = { type: 'tin' };
      this.tin.held = i;
      this.sound?.play('grab');
      return;
    }
    // ingredients on the belt (or falling)
    const R = this.diff.grabRadius * (this.isTutorial ? 1.2 : 1);
    let best = null;
    let bestD = R;
    for (const it of this.items) {
      if (it.state !== 'belt' && it.state !== 'fall' && it.state !== 'drop') continue;
      const d = Math.hypot(it.x - paw.x, it.y - paw.y);
      if (d < bestD) {
        best = it;
        bestD = d;
      }
    }
    if (best) {
      best.state = 'held';
      best.rot = 0;
      this.hold[i] = { type: 'item', item: best };
      this.sound?.play('grab');
      this.fx?.burst(best.x, best.y, { color: '#ffffff', n: 6, speed: 120, size: 4 });
    }
  }

  drop(paw, lost) {
    const i = paw.index;
    const h = this.hold[i];
    if (!h) return;
    this.hold[i] = null;
    if (h.type === 'bowl') {
      this.bowl.held = -1;
      if (!lost && this.current?.type === 'pour' && this.nearTin(this.bowl, 40)) this.pour();
      else this.bowl.wobble = 1;
      return;
    }
    if (h.type === 'tin') {
      this.tin.held = -1;
      if (!lost && this.current?.type === 'bake' && this.inOven(this.tin.x, this.tin.y, 60)) this.startBake();
      else this.sound?.play('plop');
      return;
    }
    const it = h.item;
    it.state = 'fall';
    it.vy = 0;
    it.vx = paw.vx * 30;
    if (lost) return;
    const kind = it.kind;
    // on the capybara's head?
    const c = LAYOUT.capy;
    if (Math.hypot(it.x - (c.x + CAPY_HEAD.dx), it.y - (c.y + CAPY_HEAD.dy)) < CAPY_HEAD.r) {
      this.feedCapy(it);
      return;
    }
    if (this.nearBowl(it) && this.bowl.pourT === 0) {
      this.addToBowl(it);
      return;
    }
    if (this.tin.baked && this.nearTin(it)) {
      this.addTopping(it);
      return;
    }
    // back on the belt
    if (Math.abs(it.y - LAYOUT.belt.itemY) < 55) {
      it.state = 'belt';
      it.y = LAYOUT.belt.itemY;
      this.sound?.play('plop');
      return;
    }
    it.state = 'drop';
  }

  nearBowl(p, extra = 0) {
    return Math.hypot(p.x - this.bowl.x, p.y - (this.bowl.y - 20)) < LAYOUT.bowl.r + extra + (this.diff?.id === 'easy' ? 20 : 0);
  }

  nearTin(p, extra = 0) {
    return Math.hypot(p.x - this.tin.x, p.y - (this.tin.y - 20)) < LAYOUT.tin.r + extra + (this.diff?.id === 'easy' ? 20 : 0);
  }

  inOven(x, y, pad = 0) {
    const o = LAYOUT.oven;
    return x > o.x - pad && x < o.x + o.w + pad && y > o.y - pad && y < o.y + o.h + pad;
  }

  // ---- steps ----------------------------------------------------------------
  addToBowl(it) {
    const step = this.current;
    const kind = it.kind;
    if (step?.type === 'add' && step.kind === kind) {
      this.removeItem(it);
      if (kind === 'egg') {
        this.bowl.egg = true;
        this.taps.reset();
        this.sound?.play('plop');
      } else {
        this.bowl.contents.push(kind);
        this.bowl.splash = 1;
        this.bowl.mixed = Math.max(0, this.bowl.mixed - 0.5);
        this.sound?.play('plop');
        this.fx?.burst(this.bowl.x, this.bowl.y - 40, { color: INGREDIENTS[kind].color, n: 14, speed: 200, size: 6 });
      }
      this.good(SCORE.add, this.bowl.x, this.bowl.y - 90, itemName(kind));
      return;
    }
    // wrong: bounce it out of the bowl
    it.state = 'fall';
    it.vy = -520;
    it.vx = (this.rnd() < 0.5 ? -1 : 1) * 220;
    const later = isIngredient(kind) && this.recipe.steps.slice(this.step).some((s) => (s.type === 'add' || s.type === 'top') && s.kind === kind);
    this.wrong(this.bowl.x, this.bowl.y - 90, later ? 'Not yet!' : isIngredient(kind) ? 'Not in this recipe!' : 'Yuck! Not in a cake!');
  }

  addTopping(it) {
    const step = this.current;
    if (step?.type === 'top' && step.kind === it.kind) {
      this.removeItem(it);
      this.tin.toppings.push(it.kind);
      this.sound?.play('plop');
      this.fx?.burst(this.tin.x, this.tin.y - 50, { color: '#fff59a', n: 16, speed: 220, size: 5, star: true });
      this.good(SCORE.add, this.tin.x, this.tin.y - 100, itemName(it.kind));
      return;
    }
    it.state = 'fall';
    it.vy = -480;
    it.vx = 200;
    this.wrong(this.tin.x, this.tin.y - 100, step?.type === 'top' ? 'Wrong topping!' : 'Not yet!');
  }

  feedCapy(it) {
    const kind = it.kind;
    this.removeItem(it);
    const c = LAYOUT.capy;
    if (kind === 'orange' && !this.capy.orange) {
      this.capy.orange = true;
      this.capy.mood = 'wow';
      this.capy.moodT = 1.5;
      this.sound?.play('zen');
      this.fx?.burst(c.x, c.y - 90, { color: '#ffa53d', n: 18, speed: 200, size: 5, star: true });
      if (!this.orangeBonusGiven) {
        this.orangeBonusGiven = true;
        this.addScore(SCORE.orange);
        this.msg('Capy zen! +' + SCORE.orange, c.x, c.y - 150, '#ff9a2e', true);
      } else this.msg('Capy zen!', c.x, c.y - 150, '#ff9a2e', true);
      return;
    }
    if (kind === 'carrot' || kind === 'broccoli' || kind === 'orange' || kind === 'strawberry' || kind === 'cherry' || kind === 'lemon') {
      this.capy.mood = 'nom';
      this.capy.moodT = 1.2;
      this.sound?.play('nom');
      this.msg('Nom nom!', c.x, c.y - 140, '#7ccf6a');
      return;
    }
    if (kind === 'chili') {
      this.capy.mood = 'spicy';
      this.capy.moodT = 1.6;
      this.capy.spicy = 1.6;
      this.sound?.play('wrong');
      this.msg('SPICY!', c.x, c.y - 140, '#ff4d3d', true);
      return;
    }
    this.capy.mood = 'oops';
    this.capy.moodT = 1;
    this.sound?.play('boing');
    this.msg('?!', c.x, c.y - 140, '#8a6cff');
  }

  crackEgg() {
    this.bowl.egg = false;
    this.bowl.crackT = 1;
    this.bowl.contents.push('egg');
    this.bowl.splash = 1;
    this.sound?.play('crack');
    this.fx?.burst(this.bowl.x, this.bowl.y - 60, { color: '#fffaf0', n: 12, speed: 260, size: 5, gravity: 900 });
    this.fx?.burst(this.bowl.x, this.bowl.y - 40, { color: '#ffd23d', n: 8, speed: 120, size: 6 });
    this.good(SCORE.move, this.bowl.x, this.bowl.y - 100, 'Crack!');
  }

  pour() {
    this.bowl.pourT = 0.001;
    this.bowl.x = this.tin.x - 30;
    this.bowl.y = this.tin.y - 110;
    this.tin.batter = this.batterColor();
    this.sound?.play('pour');
  }

  startBake() {
    this.tin.inOven = true;
    const o = LAYOUT.oven;
    this.tin.x = o.x + o.w / 2;
    this.tin.y = o.y + o.h - 55;
    this.oven.baking = true;
    this.oven.t = 0;
    this.oven.dur = this.diff.bakeTime * (this.isTutorial ? 1.3 : 1);
    this.oven.dinged = false;
    this.sound?.play('oven');
  }

  get bakeProgress() {
    return this.oven.baking ? this.oven.t / this.oven.dur : 0;
  }

  get bakeWindow() {
    return this.isTutorial ? [0.5, 1.0] : this.diff.window;
  }

  takeOut() {
    const p = this.bakeProgress;
    const [a, b] = this.bakeWindow;
    let rating;
    let pts;
    if (p < a) { rating = 'raw'; pts = SCORE.bakeRaw; } else if (p <= b) { rating = 'perfect'; pts = SCORE.bakePerfect; } else if (p < 1.12) { rating = 'dark'; pts = SCORE.bakeDark; } else { rating = 'burnt'; pts = SCORE.bakeBurnt; }
    this.oven.baking = false;
    this.oven.door = 1;
    this.tin.inOven = false;
    this.tin.baked = rating;
    this.tin.x = this.tin.homeX;
    this.tin.y = this.tin.homeY;
    this.rating = rating;
    const label = { raw: 'A bit pale...', perfect: 'PERFECT BAKE!', dark: 'A bit dark!', burnt: 'Burnt! Oh no!' }[rating];
    if (rating === 'perfect') {
      this.sound?.play('perfect');
      this.capy.mood = 'wow';
      this.capy.moodT = 1.4;
      this.fx?.burst(this.tin.x, this.tin.y - 50, { color: '#fff17a', n: 26, speed: 300, size: 6, star: true });
    } else if (rating === 'burnt') {
      this.sound?.play('burnt');
      this.fx?.smoke(this.tin.x, this.tin.y - 40, 14);
    } else this.sound?.play('ding');
    this.good(pts, this.tin.x, this.tin.y - 120, label, rating === 'perfect');
  }

  /** a step went right: points x combo, next step */
  good(base, x, y, label, big = false) {
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const pts = Math.round(base * this.multiplier);
    this.addScore(pts);
    this.msg(`${label} +${pts}`, x, y, '#ff5fa2', big);
    if (this.combo > 0 && this.combo % SCORE.comboEvery === 0 && this.multiplier > 1) {
      this.msg(`Combo x${this.multiplier}!`, x, y - 40, '#7a5cff', true);
      this.sound?.play('combo');
    }
    if (this.capy.mood !== 'wow') {
      this.capy.mood = 'happy';
      this.capy.moodT = 0.9;
    }
    this.capy.bounce = 1;
    this.advance();
  }

  wrong(x, y, label) {
    this.mistakes++;
    this.combo = 0;
    const pen = this.isTutorial ? 0 : this.diff.penalty;
    if (pen) this.addScore(-pen);
    this.msg(pen ? `${label} -${pen}` : label, x, y, '#ff6b3d', true);
    this.capy.mood = 'oops';
    this.capy.moodT = 1.1;
    this.sound?.play('wrong');
  }

  addScore(n) {
    this.score = Math.max(0, this.score + n);
    this.orderPoints += n;
  }

  advance() {
    this.step++;
    this.whisk.reset();
    this.stir.reset();
    this.taps.reset();
    this.moveProgress = 0;
    this.lastCount = 0;
    if (this.step >= this.recipe.steps.length) this.serve();
  }

  serve() {
    const bonus = this.mode === 'game' ? Math.round(this.timeLeft * SCORE.perSecondLeft) : 0;
    const pts = Math.round(SCORE.order * this.multiplier);
    this.addScore(pts + bonus);
    let stars = 3;
    if (this.mistakes > 0) stars--;
    if (this.rating && this.rating !== 'perfect') stars--;
    stars = Math.max(1, stars);
    this.results.push({ recipe: this.recipe, stars, points: this.orderPoints, rating: this.rating, failed: false, bonus });
    this.phase = 'served';
    this.phaseT = 0;
    this.capy.mood = 'wow';
    this.capy.moodT = 2.5;
    this.sound?.play('served');
    this.fx?.burst(this.tin.x, this.tin.y - 60, { color: '#ff8fc8', n: 40, speed: 380, size: 7, star: true });
    this.fx?.confetti?.(60);
  }

  failOrder() {
    this.results.push({ recipe: this.recipe, stars: 0, points: this.orderPoints, rating: null, failed: true, bonus: 0 });
    this.phase = 'failed';
    this.phaseT = 0;
    this.combo = 0;
    this.capy.mood = 'oops';
    this.capy.moodT = 2.5;
    this.sound?.play('fail');
    for (let i = 0; i < 2; i++) {
      const h = this.hold[i];
      if (h?.type === 'item') h.item.state = 'drop';
      this.hold[i] = null;
    }
    this.bowl.held = -1;
    this.tin.held = -1;
  }

  // ---- the moves --------------------------------------------------------------
  updateMoves(paws, clapped) {
    const step = this.current;
    if (!step || !MOVE_TYPES.has(step.type)) return;
    if (step.type === 'crack') {
      if (clapped && this.bowl.egg) this.crackEgg();
      return;
    }
    const overCake = step.type === 'frost' || step.type === 'sprinkle';
    if (overCake && !this.tin.baked) return;
    const cx = overCake ? this.tin.x : this.bowl.x;
    const cy = (overCake ? this.tin.y : this.bowl.y) - 30;
    // the paw doing the move: free (or holding an ingredient) and over the target
    let paw = null;
    let best = 1e9;
    for (const p of paws) {
      if (!p.present) continue;
      const h = this.hold[p.index];
      if (h && h.type !== 'item') continue;
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d < best) {
        best = d;
        paw = p;
      }
    }
    const reach = GESTURE.stirMaxR + (this.diff.id === 'easy' ? 30 : 0);
    if (!paw || best > reach) {
      this.whisk.pause();
      this.stir.pause();
      this.activePaw = -1;
      return;
    }
    this.activePaw = paw.index;
    if (step.type === 'whisk' || step.type === 'sprinkle') {
      const need = step.type === 'whisk' ? this.diff.whisk : this.diff.shake;
      if (this.whisk.update(paw.x)) {
        this.sound?.play(step.type === 'whisk' ? 'whisk' : 'shake');
        if (step.type === 'whisk') {
          this.bowl.mixed = Math.min(1, this.bowl.mixed + 1 / need);
          this.fx?.burst(paw.x, cy, { color: this.batterColor(), n: 3, speed: 150, size: 4 });
        } else {
          this.addSprinkles(paw.x, 6);
        }
      }
      this.moveProgress = Math.min(1, this.whisk.count / need);
    } else if (step.type === 'stir' || step.type === 'frost') {
      const need = step.type === 'stir' ? this.diff.stir : this.diff.frost;
      const d = this.stir.update(paw.x, paw.y, cx, cy);
      if (d) {
        if (step.type === 'stir') this.bowl.mixed = Math.min(1, this.bowl.mixed + Math.abs(d) / (Math.PI * 2 * need));
        else this.tin.frost = Math.min(1, this.stir.turns / need);
      }
      const q = Math.floor(this.stir.turns * 4);
      if (q > this.lastCount) {
        this.lastCount = q;
        this.sound?.play(step.type === 'stir' ? 'stir' : 'frost');
      }
      this.moveProgress = Math.min(1, this.stir.turns / need);
    } else {
      return;
    }
    if (this.moveProgress >= 1) {
      if (step.type === 'stir' || step.type === 'whisk') this.bowl.mixed = 1;
      if (step.type === 'frost') this.tin.frost = 1;
      const label = { whisk: 'Whisked!', stir: 'Stirred!', frost: 'Frosted!', sprinkle: 'Sprinkled!' }[step.type];
      this.fx?.burst(cx, cy - 20, { color: '#fff59a', n: 16, speed: 220, size: 5, star: true });
      this.good(SCORE.move, cx, cy - 80, label);
    }
  }

  addSprinkles(x, n) {
    const cols = ['#ff5fa2', '#58c7ff', '#ffe14d', '#7ce08a', '#b48cff', '#ffffff'];
    for (let k = 0; k < n; k++) {
      this.tin.sprinkles.push({
        dx: (this.rnd() - 0.5) * 120, dy: (this.rnd() - 0.5) * 30, a: this.rnd() * Math.PI, c: cols[Math.floor(this.rnd() * cols.length)],
      });
    }
    if (this.tin.sprinkles.length > 120) this.tin.sprinkles.splice(0, this.tin.sprinkles.length - 120);
    this.fx?.sprinkle?.(x, this.tin.y - 90, cols);
  }

  batterColor() {
    const c = this.bowl.contents;
    if (c.includes('chocolate')) return INGREDIENTS.chocolate.batter;
    if (c.includes('strawberry')) return INGREDIENTS.strawberry.batter;
    if (c.includes('honey')) return INGREDIENTS.honey.batter;
    if (c.includes('lemon')) return INGREDIENTS.lemon.batter;
    if (c.includes('egg') || c.includes('butter')) return '#fbe7a8';
    return '#fbf1dc';
  }

  // ---- belt, bowl, oven -------------------------------------------------------
  updateBelt(dt) {
    const B = LAYOUT.belt;
    const running = this.phase !== 'done';
    const speed = this.diff ? this.diff.beltSpeed * (this.isTutorial ? 0.7 : 1) : 80;
    this.beltSpeed = running ? speed : 0;
    this.beltOffset = ((this.beltOffset ?? 0) + this.beltSpeed * dt) % 40;
    if (running && this.diff && (this.phase === 'cook' || this.phase === 'intro')) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = this.diff.spawnEvery * (this.isTutorial ? 1.4 : 1) * (0.85 + this.rnd() * 0.3);
        this.spawn();
      }
    }
    for (const it of this.items) {
      it.t += dt;
      if (it.state === 'spawn') {
        it.vy += 1400 * dt;
        it.y += it.vy * dt;
        it.x -= this.beltSpeed * dt * 0.3;
        if (it.y >= B.itemY) {
          it.y = B.itemY;
          it.state = 'belt';
          it.squash = 1;
        }
      } else if (it.state === 'belt') {
        it.x -= this.beltSpeed * dt;
        it.y = B.itemY;
        if (it.x < B.x0) it.state = 'gone';
      } else if (it.state === 'fall' || it.state === 'drop') {
        it.vy += 1600 * dt;
        it.y += it.vy * dt;
        it.x += (it.vx ?? 0) * dt;
        it.rot += (it.vr ?? 4) * dt;
        if (it.y > 800) it.state = 'gone';
      }
      if (it.squash) it.squash = Math.max(0, it.squash - dt * 4);
    }
    this.items = this.items.filter((it) => it.state !== 'gone');
  }

  spawn() {
    const need = this.neededKind();
    const reachable = (k) => this.items.some((i) => (i.state === 'belt' || i.state === 'spawn') && i.kind === k && i.x > 120);
    this.sinceNeed += this.diff.spawnEvery;
    let kind = null;
    if (this.isTutorial) {
      if (need && !reachable(need)) kind = need;
      else if (this.rnd() < 0.3) kind = this.randomDistractor();
      else return;
    } else if (need && ((!reachable(need) && this.sinceNeed >= this.diff.guaranteeGap) || this.rnd() < this.diff.needChance)) {
      kind = need;
    } else if (this.rnd() < this.diff.otherRecipeChance / (1 - this.diff.needChance)) {
      const ks = Object.keys(INGREDIENTS).filter((k) => k !== need);
      kind = ks[Math.floor(this.rnd() * ks.length)];
    } else {
      kind = this.randomDistractor();
    }
    if (kind === need) this.sinceNeed = 0;
    const H = LAYOUT.hopper;
    this.items.push({
      id: nextId++, kind, x: H.x, y: H.y + 70, vy: 0, vx: 0, state: 'spawn', t: 0, rot: 0, vr: (this.rnd() - 0.5) * 10, squash: 0,
    });
    this.sound?.play('spawn');
  }

  randomDistractor() {
    const ks = Object.keys(DISTRACTORS);
    // the mandarin is rarer
    let k = ks[Math.floor(this.rnd() * ks.length)];
    if (k === 'orange' && this.rnd() < 0.5) k = 'carrot';
    return k;
  }

  removeItem(it) {
    it.state = 'gone';
    this.items = this.items.filter((x) => x !== it);
  }

  updateBowl(dt) {
    const b = this.bowl;
    b.splash = Math.max(0, b.splash - dt * 2.5);
    b.wobble = Math.max(0, b.wobble - dt * 2);
    b.crackT = Math.max(0, b.crackT - dt * 1.5);
    if (b.held < 0 && b.pourT === 0) {
      b.x += (b.homeX - b.x) * Math.min(1, dt * 10);
      b.y += (b.homeY - b.y) * Math.min(1, dt * 10);
    }
    if (b.pourT > 0) {
      b.pourT += dt;
      this.tin.filled = Math.min(1, b.pourT / 1.1);
      if (b.pourT > 1.2) {
        b.pourT = 0;
        b.contents = [];
        b.mixed = 0;
        this.tin.filled = 1;
        this.good(SCORE.move, this.tin.x, this.tin.y - 110, 'Poured!');
      }
    }
    const t = this.tin;
    if (t.held < 0 && !t.inOven) {
      t.x += (t.homeX - t.x) * Math.min(1, dt * 10);
      t.y += (t.homeY - t.y) * Math.min(1, dt * 10);
    }
  }

  updateOven(dt) {
    const o = this.oven;
    o.door = Math.max(0, o.door - dt * 1.5);
    if (!o.baking) {
      o.glow = Math.max(0, o.glow - dt * 2);
      return;
    }
    o.t += dt;
    o.glow = Math.min(1, o.glow + dt * 2);
    const p = o.t / o.dur;
    if (!o.dinged && p >= this.bakeWindow[0]) {
      o.dinged = true;
      this.sound?.play('ding');
      this.msg('NOW! Take it out!', LAYOUT.oven.x + LAYOUT.oven.w / 2, LAYOUT.oven.y - 40, '#2fbf71', true);
    }
    if (Math.floor(o.t * 2) !== Math.floor((o.t - dt) * 2)) this.sound?.play('tick');
    if (p > 1.05 && this.rnd() < dt * 8) this.fx?.smoke(LAYOUT.oven.x + LAYOUT.oven.w / 2 + (this.rnd() - 0.5) * 60, LAYOUT.oven.y + 10, 1);
    if (p >= BAKE_AUTO_OUT) this.takeOut();
  }

  // ---- capybara and messages ------------------------------------------------
  updateCapy(dt) {
    const c = this.capy;
    c.moodT -= dt;
    if (c.moodT <= 0 && c.mood !== 'idle') c.mood = 'idle';
    c.bounce = Math.max(0, c.bounce - dt * 3);
    c.spicy = Math.max(0, c.spicy - dt);
  }

  msg(text, x, y, color = '#ff5fa2', big = false) {
    this.msgs.push({ text, x, y, color, big, t: 0 });
    if (this.msgs.length > 8) this.msgs.shift();
  }

  updateMsgs(dt) {
    for (const m of this.msgs) m.t += dt;
    this.msgs = this.msgs.filter((m) => m.t < 1.6);
  }

  /** where the player should act now (for hint arrows), or null */
  target() {
    const s = this.current;
    if (!s || this.phase !== 'cook') return null;
    const anyHold = this.hold.find((h) => h);
    if (s.type === 'add' || s.type === 'top') {
      const holding = this.hold.find((h) => h?.type === 'item' && h.item.kind === s.kind);
      if (holding) return s.type === 'add' ? { x: this.bowl.x, y: this.bowl.y - 40, what: 'bowl' } : { x: this.tin.x, y: this.tin.y - 40, what: 'cake' };
      let best = null;
      for (const it of this.items) {
        if (it.kind === s.kind && (it.state === 'belt' || it.state === 'spawn') && it.x > 60 && (!best || it.x < best.x)) best = it;
      }
      return best ? { x: best.x, y: best.y, what: 'item', item: best } : null;
    }
    if (s.type === 'pour') return this.bowl.held >= 0 ? { x: this.tin.x, y: this.tin.y - 40, what: 'tin' } : { x: this.bowl.x, y: this.bowl.y - 30, what: 'bowl' };
    if (s.type === 'bake') {
      if (this.oven.baking) return { x: LAYOUT.oven.x + LAYOUT.oven.w / 2, y: LAYOUT.oven.y + 110, what: 'oven' };
      if (this.tin.held >= 0) return { x: LAYOUT.oven.x + LAYOUT.oven.w / 2, y: LAYOUT.oven.y + 120, what: 'oven' };
      return { x: this.tin.x, y: this.tin.y - 30, what: 'tin' };
    }
    if (s.type === 'frost' || s.type === 'sprinkle') return { x: this.tin.x, y: this.tin.y - 30, what: 'cake' };
    if (anyHold && anyHold.type !== 'item') return null;
    return { x: this.bowl.x, y: this.bowl.y - 30, what: 'bowl' };
  }

  hint() {
    const s = this.current;
    if (!s) return '';
    if (s.type === 'bake' && this.oven.baking) {
      return this.bakeProgress >= this.bakeWindow[0] ? 'GREEN! Close your paw on the oven to take it out!' : 'Baking... get ready to take it out on GREEN!';
    }
    if (s.type === 'crack') return 'Clap your paws (or tap the egg twice) to crack it!';
    return stepHint(s);
  }
}
