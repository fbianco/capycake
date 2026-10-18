// ---------------------------------------------------------------------------
// Renderer: draws every screen of CapyCake on one canvas.
//   title -> outfit -> difficulty -> (tutorial) -> game -> results
// The canvas has a fixed logical size (1280 x 720) and is scaled to the window.
// ---------------------------------------------------------------------------
import { W, H, LAYOUT, BAKE_AUTO_OUT } from '../config.js';
import { RECIPES, INGREDIENTS, stepLabel } from '../data/recipes.js';
import { HATS, APRONS, apronById } from '../data/outfits.js';
import {
  INK, rr, drawItem, drawCapy, drawPaw, drawBowlBack, drawBowlContents, drawBowlFront, drawEggOnRim,
  drawTin, drawWhisk, drawSpoon, drawShaker, drawPipingBag, drawMoveIcon, drawHat, heart,
} from './art.js';
import { drawWall, drawBelt, drawHopper, drawOven, drawCounter } from './scene.js';
import { star } from './Particles.js';

const FONT = 'Fredoka, "Comic Sans MS", "Trebuchet MS", sans-serif';
const PINK = '#ff5fa2';
const PAW_COLORS = ['#ff5fa2', '#3fa9ff'];

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    this.canvas.style.width = `${Math.floor(W * scale)}px`;
    this.canvas.style.height = `${Math.floor(H * scale)}px`;
    this.canvas.width = Math.floor(W * scale * dpr);
    this.canvas.height = Math.floor(H * scale * dpr);
    this.k = scale * dpr;
  }

  render(app) {
    const g = this.g;
    g.setTransform(this.k, 0, 0, this.k, 0, 0);
    g.textBaseline = 'alphabetic';
    switch (app.screen) {
      case 'title': this.title(app); break;
      case 'outfit': this.outfit(app); break;
      case 'difficulty': this.difficulty(app); break;
      case 'tutorial': this.tutorial(app); break;
      case 'game': this.game(app); break;
      case 'results': this.results(app); break;
      default: this.title(app); break;
    }
    this.buttons(app);
    if (app.paused) this.pause(app);
    this.paws(app);
    if (app.toast && app.toast.t > 0) this.toast(app.toast);
  }

  // ---- text helpers ---------------------------------------------------------------
  text(str, x, y, { size = 24, color = INK, align = 'center', weight = 600, stroke = null, lw = 6, base = 'alphabetic' } = {}) {
    const g = this.g;
    g.font = `${weight} ${size}px ${FONT}`;
    g.textAlign = align;
    g.textBaseline = base;
    if (stroke) {
      g.lineJoin = 'round';
      g.lineWidth = lw;
      g.strokeStyle = stroke;
      g.strokeText(str, x, y);
    }
    g.fillStyle = color;
    g.fillText(str, x, y);
    g.textBaseline = 'alphabetic';
  }

  panel(x, y, w, h, fill = '#ffffff', r = 18, lw = 4) {
    const g = this.g;
    g.fillStyle = 'rgba(91,58,58,0.18)';
    rr(g, x + 4, y + 6, w, h, r);
    g.fill();
    rr(g, x, y, w, h, r);
    g.fillStyle = fill;
    g.fill();
    g.lineWidth = lw;
    g.strokeStyle = INK;
    g.stroke();
  }

  logo(x, y, size, t) {
    const word = 'CapyCake';
    const g = this.g;
    g.font = `700 ${size}px ${FONT}`;
    const widths = [...word].map((c) => g.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0);
    let cx = x - total / 2;
    const cols = ['#ff5fa2', '#ff7bb3', '#ff9a3d', '#ffc93d', '#7ccf6a', '#3fb5ff', '#8a6cff', '#ff5fa2'];
    [...word].forEach((c, i) => {
      const yy = y + Math.sin(t * 3 + i * 0.7) * 6;
      this.text(c, cx + widths[i] / 2, yy, { size, weight: 700, color: cols[i], stroke: INK, lw: 14 });
      g.font = `700 ${size}px ${FONT}`;
      g.lineWidth = 6;
      g.strokeStyle = '#ffffff';
      g.strokeText(c, cx + widths[i] / 2, yy);
      g.fillStyle = cols[i];
      g.fillText(c, cx + widths[i] / 2, yy);
      cx += widths[i];
    });
  }

  // ---- screens ----------------------------------------------------------------------
  title(app) {
    const g = this.g;
    const t = app.time;
    drawWall(g);
    this.decoBelt(t);
    drawHopper(g, t, 0);
    drawCounter(g);
    this.logo(W / 2, 118, 104, t);
    this.text('a cute baking game you play with your paws', W / 2, 628, { size: 28, color: INK, weight: 600, stroke: '#ffffff', lw: 8 });
    const apron = apronById(app.outfit.apron);
    drawCapy(g, W / 2, 378, 0.8, { hat: app.outfit.hat, apron, mood: 'happy', t, arms: true, wave: 1 });
    // a few cupcakes on the counter
    for (const [x, kind] of [[180, 'strawberry'], [1100, 'cherry']]) {
      drawTin(g, x, 486, { type: 'cupcake', filled: 1, baked: 'perfect', frost: 1, sprinkles: [], toppings: [kind] }, '#ffb3d1', t);
    }
    this.statusLine(app, 690);
    if (app.best > 0) this.text(`Best: ${app.best}`, W - 16, 708, { size: 18, align: 'right', color: '#ffffff', stroke: INK, lw: 4 });
    this.camInset(app, 1088, 588, 176, 99);
    this.text("Bianco's Labs", 16, 708, { size: 16, align: 'left', color: '#ffffff', stroke: INK, lw: 4 });
  }

  decoBelt(t) {
    const g = this.g;
    const off = (t * 90) % 40;
    drawBelt(g, off, t);
    const kinds = ['flour', 'egg', 'strawberry', 'sugar', 'butter', 'duck', 'milk', 'chocolate', 'lemon', 'cherry', 'honey', 'carrot'];
    const span = W + 200;
    kinds.forEach((k, i) => {
      const x = W + 100 - (((t * 90) + i * (span / kinds.length)) % span);
      drawItem(g, k, x, LAYOUT.belt.itemY, 1, 0);
    });
  }

  statusLine(app, y) {
    const msg = app.camMessage;
    const ok = app.camReady;
    const g = this.g;
    g.font = `600 18px ${FONT}`;
    const w = g.measureText(msg).width + 50;
    this.panel(W / 2 - w / 2, y - 24, w, 32, ok ? '#c9f5dc' : '#fff1c9', 16, 3);
    g.fillStyle = ok ? '#2fbf71' : '#ffb02e';
    g.beginPath();
    g.arc(W / 2 - w / 2 + 18, y - 8, 6, 0, Math.PI * 2);
    g.fill();
    this.text(msg, W / 2 + 10, y, { size: 18 });
  }

  outfit(app) {
    const g = this.g;
    const t = app.time;
    drawWall(g);
    drawCounter(g);
    this.text('Dress up your chef!', W / 2, 70, { size: 52, weight: 700, color: PINK, stroke: '#ffffff', lw: 10 });
    const apron = apronById(app.outfit.apron);
    this.panel(70, 110, 420, 420, '#fff8fb', 30);
    g.save();
    rr(g, 72, 112, 416, 416, 28);
    g.clip();
    drawCapy(g, 280, 330, 0.95, { hat: app.outfit.hat, apron, mood: 'happy', t, arms: true, wave: 0.4, orange: false });
    g.restore();
    rr(g, 70, 110, 420, 420, 30);
    g.lineWidth = 4;
    g.strokeStyle = INK;
    g.stroke();
    const hat = HATS.find((h) => h.id === app.outfit.hat);
    this.text(hat?.name ?? '', 280, 575, { size: 30, color: '#ffffff', stroke: INK, lw: 8 });
    this.text('Hat', 870, 128, { size: 28, color: INK, stroke: '#ffffff', lw: 6 });
    this.text('Apron', 870, 468, { size: 28, color: INK, stroke: '#ffffff', lw: 6 });
    this.hint(app, 'Hold a paw over a choice (or click it)', 690);
  }

  difficulty(app) {
    drawWall(this.g);
    drawCounter(this.g);
    this.text('How hard should it be?', W / 2, 74, { size: 52, weight: 700, color: PINK, stroke: '#ffffff', lw: 10 });
    this.hint(app, 'Hold a paw over a card (or click it)', 690);
  }

  hint(app, str, y) {
    this.text(str, W / 2, y, { size: 22, color: '#ffffff', stroke: INK, lw: 6 });
  }

  tutorial(app) {
    const tut = app.tutorial;
    const k = tut.kitchen;
    this.kitchen(app, k);
    const g = this.g;
    const t = app.time;
    // stars to touch
    if (tut.stage === 'paws') {
      for (const s of tut.stars) {
        const sc = s.hit ? 1 + s.pop * 0.6 : 1 + Math.sin(t * 5) * 0.08;
        g.globalAlpha = s.hit ? Math.max(0, s.pop) : 1;
        g.fillStyle = '#ffe14d';
        g.strokeStyle = INK;
        g.lineWidth = 4;
        star(g, s.x, s.y, 46 * sc, Math.sin(t) * 0.2);
        g.stroke();
        g.globalAlpha = 1;
      }
    }
    // coach panel
    const lines = tut.coach();
    this.panel(300, 70, 680, 96, '#ffffff', 22);
    const step = k.current;
    if (tut.stage === 'cook' && step) {
      if (step.type === 'add' || step.type === 'top') drawMoveIcon(g, 'grab', 360, 118, 1, t);
      else drawMoveIcon(g, step.type, 360, 118, 1.15, t);
    } else {
      drawCapy(g, 360, 116, 0.32, { hat: app.outfit.hat, apron: apronById(app.outfit.apron), mood: 'happy', t, noBody: true });
    }
    this.text(lines[0], 660, 108, { size: 26, weight: 600, color: INK });
    this.text(lines[1], 660, 144, { size: 22, weight: 500, color: '#8a5a6a' });
    this.camInset(app, 10, 76, 150, 84);
    if (tut.stage === 'done') {
      g.fillStyle = 'rgba(255,240,246,0.5)';
      g.fillRect(0, 0, W, H);
      this.text('Training done!', W / 2, 330, { size: 72, weight: 700, color: PINK, stroke: '#ffffff', lw: 14 });
    }
  }

  game(app) {
    const k = app.kitchen;
    this.kitchen(app, k);
    this.hud(app, k);
    const g = this.g;
    if (k.phase === 'intro') {
      const a = Math.min(1, k.phaseT * 3) * Math.min(1, (1.8 - k.phaseT) * 3);
      g.globalAlpha = Math.max(0, a);
      this.panel(W / 2 - 300, 270, 600, 150, '#ffffff', 30);
      this.text(`Order ${k.orderIndex + 1} of ${k.orders.length}`, W / 2, 320, { size: 30, color: '#8a5a6a' });
      this.text(k.recipe.name, W / 2, 380, { size: 50, weight: 700, color: PINK });
      g.globalAlpha = 1;
    }
    if (k.phase === 'served' || k.phase === 'failed') this.orderCard(app, k);
    if (app.noPawsFor > 2.5 && k.phase === 'cook' && app.camReady) {
      this.panel(W / 2 - 260, 300, 520, 80, '#fff1c9', 24);
      this.text('Show your paws to the camera!', W / 2, 352, { size: 30 });
    }
  }

  orderCard(app, k) {
    const g = this.g;
    const res = k.results[k.results.length - 1];
    if (!res) return;
    const a = Math.min(1, k.phaseT * 3);
    g.globalAlpha = a;
    g.fillStyle = 'rgba(255,240,246,0.55)';
    g.fillRect(0, 0, W, H);
    this.panel(W / 2 - 320, 140, 640, 330, '#ffffff', 34);
    if (res.failed) {
      this.text('Oh no, too slow!', W / 2, 220, { size: 52, weight: 700, color: '#ff7a3d' });
      this.text('The customer could not wait...', W / 2, 270, { size: 26, color: '#8a5a6a' });
      drawCapy(g, W / 2, 380, 0.55, { hat: app.outfit.hat, apron: apronById(app.outfit.apron), mood: 'oops', t: app.time, noBody: true, orange: k.capy.orange });
    } else {
      this.text(`${res.recipe.name} done!`, W / 2, 210, { size: 44, weight: 700, color: PINK });
      for (let i = 0; i < 3; i++) {
        const on = i < res.stars && k.phaseT > 0.3 + i * 0.25;
        g.fillStyle = on ? '#ffd23d' : '#eee3e8';
        g.strokeStyle = INK;
        g.lineWidth = 4;
        const sc = on ? 1 + Math.max(0, 0.5 - (k.phaseT - 0.3 - i * 0.25)) : 1;
        star(g, W / 2 - 90 + i * 90, 270, 34 * sc, 0);
        g.stroke();
      }
      drawTin(g, W / 2, 400, k.tin, k.recipe.frosting ?? '#ffb3d1', app.time);
      this.text(`+${res.points}`, W / 2 + 220, 400, { size: 36, weight: 700, color: '#2fbf71' });
      if (res.bonus) this.text(`time bonus ${res.bonus}`, W / 2 + 220, 430, { size: 18, color: '#8a5a6a' });
    }
    g.globalAlpha = 1;
  }

  results(app) {
    const g = this.g;
    const k = app.kitchen;
    const t = app.time;
    drawWall(g);
    drawCounter(g);
    this.text('Shift complete!', W / 2, 78, { size: 58, weight: 700, color: PINK, stroke: '#ffffff', lw: 12 });
    this.panel(90, 110, 560, 470, '#ffffff', 30);
    this.text('Score', 370, 160, { size: 26, color: '#8a5a6a' });
    this.text(String(k.score), 370, 228, { size: 72, weight: 700, color: PINK });
    if (app.newBest) this.text('NEW BEST!', 370, 262, { size: 26, weight: 700, color: '#2fbf71' });
    else this.text(`Best: ${app.best}`, 370, 262, { size: 22, color: '#8a5a6a' });
    k.results.forEach((r, i) => {
      const y = 310 + i * 52;
      g.fillStyle = i % 2 ? '#fff5f9' : '#ffeaf3';
      rr(g, 120, y - 22, 500, 46, 12);
      g.fill();
      this.text(r.recipe.name, 140, y + 8, { size: 22, align: 'left' });
      if (r.failed) this.text('missed', 600, y + 8, { size: 20, align: 'right', color: '#ff7a3d' });
      for (let s = 0; s < 3; s++) {
        g.fillStyle = s < r.stars ? '#ffd23d' : '#eee3e8';
        g.strokeStyle = INK;
        g.lineWidth = 2.5;
        star(g, 430 + s * 32, y, 13, 0);
        g.stroke();
      }
      if (!r.failed) this.text(`${r.points}`, 600, y + 8, { size: 20, align: 'right', color: '#2fbf71' });
    });
    this.text(`Best combo: x${Math.min(3, 1 + 0.5 * Math.floor(k.bestCombo / 3))} (${k.bestCombo} in a row)`, 370, 560, { size: 20, color: '#8a5a6a' });
    const totalStars = k.results.reduce((a, r) => a + r.stars, 0);
    const mood = totalStars >= k.results.length * 2 ? 'wow' : totalStars > 0 ? 'happy' : 'oops';
    drawCapy(g, 960, 300, 0.9, { hat: app.outfit.hat, apron: apronById(app.outfit.apron), mood, t, arms: true, wave: mood === 'oops' ? 0 : 1, orange: k.capy.orange });
  }

  pause() {
    const g = this.g;
    g.fillStyle = 'rgba(80,40,60,0.45)';
    g.fillRect(0, 0, W, H);
    this.text('Paused', W / 2, 250, { size: 80, weight: 700, color: '#ffffff', stroke: INK, lw: 12 });
    this.text('P to continue  -  Esc for the menu', W / 2, 310, { size: 26, color: '#ffffff', stroke: INK, lw: 6 });
  }

  toast(m) {
    const g = this.g;
    g.globalAlpha = Math.min(1, m.t * 3);
    g.font = `600 22px ${FONT}`;
    const w = g.measureText(m.text).width + 40;
    this.panel(W / 2 - w / 2, H - 170, w, 44, '#ffffff', 22, 3);
    this.text(m.text, W / 2, H - 140, { size: 22 });
    g.globalAlpha = 1;
  }

  // ---- the kitchen ---------------------------------------------------------------------
  kitchen(app, k) {
    const g = this.g;
    const t = app.time;
    drawWall(g);
    this.gears(t);
    drawHopper(g, t, k.items.some((i) => i.state === 'spawn') ? 1 : 0);
    drawBelt(g, k.beltOffset ?? 0, t);
    const hintsOn = (app.screen === 'tutorial' ? 2 : k.diff?.hints ?? 0);
    const target = hintsOn ? k.target() : null;
    // items on the belt (behind the capybara)
    for (const it of k.items) {
      if (it.state !== 'belt' && it.state !== 'spawn') continue;
      if (target?.item === it) this.glow(it.x, it.y, 46, t);
      const sq = it.squash ?? 0;
      g.save();
      g.translate(it.x, it.y + 30);
      g.scale(1 + sq * 0.2, 1 - sq * 0.2);
      drawItem(g, it.kind, 0, -30, 1, it.state === 'spawn' ? it.rot : 0);
      g.restore();
    }
    // capybara chef
    const c = LAYOUT.capy;
    const apron = apronById(app.outfit.apron);
    const bounce = Math.sin(k.capy.bounce * Math.PI) * 10;
    drawCapy(g, c.x, c.y - bounce, 0.78, { hat: app.outfit.hat, apron, mood: k.capy.mood, t, orange: k.capy.orange });
    drawCounter(g);
    // oven (+ tin inside)
    drawOven(g, k.oven, k.bakeProgress, k.bakeWindow, t, BAKE_AUTO_OUT);
    if (k.tin.inOven) {
      const o = LAYOUT.oven;
      g.save();
      rr(g, o.x + 38, o.y + 86, o.w - 76, o.h - 126, 14);
      g.clip();
      drawTin(g, o.x + o.w / 2, o.y + o.h - 52, { ...k.tin, baked: k.bakeProgress > 0.5 ? (k.bakeProgress > 1.12 ? 'burnt' : k.bakeProgress > k.bakeWindow[1] ? 'dark' : k.bakeProgress > k.bakeWindow[0] ? 'perfect' : 'raw') : null }, '#fff', t);
      g.fillStyle = `rgba(255,140,60,${0.25 + Math.sin(t * 6) * 0.08})`;
      g.fillRect(o.x, o.y, o.w, o.h);
      g.restore();
    }
    // tin (on the counter or carried)
    const recipe = k.recipe;
    if (!k.tin.inOven && k.tin.held < 0) drawTin(g, k.tin.x, k.tin.y, k.tin, recipe?.frosting ?? '#ffb3d1', t);
    // bowl
    const b = k.bowl;
    const tilt = b.pourT > 0 ? -Math.min(1.1, b.pourT * 3) : b.held >= 0 ? -0.1 : 0;
    if (b.held < 0) {
      this.bowl(k, b, tilt, t);
    }
    if (b.pourT > 0) {
      // batter stream
      g.fillStyle = k.tin.batter;
      g.strokeStyle = INK;
      g.lineWidth = 3;
      rr(g, k.tin.x - 8, b.y - 30, 16, k.tin.y - b.y + 10, 8);
      g.fill();
      g.stroke();
    }
    // hint glow on the target
    if (target && target.what !== 'item') this.glow(target.x, target.y, target.what === 'oven' ? 90 : 80, t);
    // tools under the active paw during moves
    const step = k.current;
    if (k.activePaw >= 0 && step && app.pawsShown) {
      const p = app.paws[k.activePaw];
      if (p?.present && !k.hold[p.index]) {
        if (step.type === 'whisk') drawWhisk(g, p.x, p.y + 10, t, 0, 1.35);
        if (step.type === 'stir') drawSpoon(g, p.x, p.y + 10, 1.35);
        if (step.type === 'sprinkle' && k.tin.baked) drawShaker(g, p.x, p.y);
        if (step.type === 'frost' && k.tin.baked) drawPipingBag(g, p.x, p.y, recipe?.frosting ?? '#ffb3d1');
      }
    }
    // falling items
    for (const it of k.items) {
      if (it.state === 'fall' || it.state === 'drop') drawItem(g, it.kind, it.x, it.y, 1, it.rot);
    }
    // carried things
    for (const p of app.paws) {
      const h = k.hold[p.index];
      if (!h) continue;
      if (h.type === 'item') drawItem(g, h.item.kind, h.item.x, h.item.y, 1.1, 0);
      if (h.type === 'bowl') this.bowl(k, b, -0.15, t);
      if (h.type === 'tin') drawTin(g, k.tin.x, k.tin.y, k.tin, recipe?.frosting ?? '#ffb3d1', t);
    }
    // move progress ring
    if (step && ['whisk', 'stir', 'frost', 'sprinkle'].includes(step.type) && k.phase === 'cook') {
      const over = step.type === 'frost' || step.type === 'sprinkle';
      if (!over || k.tin.baked) {
        const cx = over ? k.tin.x : b.x;
        const cy = (over ? k.tin.y : b.y) - 150;
        this.progressRing(cx, cy, k.moveProgress, step.type, t);
      }
    }
    // hint arrow (easy mode / tutorial)
    if (target && hintsOn >= 2) this.hintArrow(app, target, t);
    app.fx.draw(g);
    // floating messages
    for (const m of k.msgs) {
      const a = m.t < 1.2 ? 1 : 1 - (m.t - 1.2) / 0.4;
      g.globalAlpha = Math.max(0, a);
      const sc = m.t < 0.15 ? 0.6 + m.t / 0.15 * 0.4 : 1;
      this.text(m.text, m.x, m.y - m.t * 40, { size: (m.big ? 34 : 26) * sc, weight: 700, color: m.color, stroke: '#ffffff', lw: 8 });
      g.globalAlpha = 1;
    }
    this.banner(app, k);
    this.recipeBar(app, k);
  }

  bowl(k, b, tilt, t) {
    const g = this.g;
    drawBowlBack(g, b.x, b.y, tilt);
    drawBowlContents(g, b.x, b.y, b.contents, b.mixed, k.batterColor(), t, tilt);
    drawBowlFront(g, b.x, b.y, tilt, b.wobble);
    if (b.egg) drawEggOnRim(g, b.x, b.y, b.wobble);
    if (b.splash > 0) {
      g.fillStyle = k.batterColor();
      for (let i = 0; i < 5; i++) {
        const a = Math.PI + (i / 4) * Math.PI;
        g.beginPath();
        g.arc(b.x + Math.cos(a) * 50 * (1.4 - b.splash * 0.4), b.y - 50 + Math.sin(a) * 30 * b.splash, 6 * b.splash, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  gears(t) {
    const g = this.g;
    for (const [x, y, r, n, sp, col] of [[468, 262, 26, 9, 0.8, '#ffd27a'], [514, 246, 16, 7, -1.3, '#8fdcc4'], [1240, 262, 22, 8, 1, '#c4b1ff']]) {
      g.save();
      g.translate(x, y);
      g.rotate(t * sp);
      g.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2;
        const rad = i % 2 ? r : r + 7;
        g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      g.closePath();
      g.fillStyle = col;
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = INK;
      g.stroke();
      g.beginPath();
      g.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      g.fillStyle = '#ffffff';
      g.fill();
      g.stroke();
      g.restore();
    }
  }

  glow(x, y, r, t) {
    const g = this.g;
    const a = 0.45 + Math.sin(t * 6) * 0.2;
    const grd = g.createRadialGradient(x, y, r * 0.3, x, y, r * 1.2);
    grd.addColorStop(0, `rgba(255,255,170,${a})`);
    grd.addColorStop(1, 'rgba(255,255,170,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r * 1.2, 0, Math.PI * 2);
    g.fill();
    g.setLineDash([10, 8]);
    g.lineDashOffset = -t * 30;
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
  }

  hintArrow(app, target, t) {
    // from the nearest present paw to the target
    const p = app.paws.filter((q) => q.present).sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y))[0];
    if (!p) return;
    const d = Math.hypot(p.x - target.x, p.y - target.y);
    if (d < 120) return;
    const g = this.g;
    const ux = (target.x - p.x) / d;
    const uy = (target.y - p.y) / d;
    const k = (t * 1.5) % 1;
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.strokeStyle = INK;
    g.lineWidth = 2;
    for (let s = 60; s < d - 70; s += 36) {
      const ss = s + k * 36;
      if (ss > d - 70) continue;
      g.beginPath();
      g.arc(p.x + ux * ss, p.y + uy * ss, 6, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  }

  progressRing(x, y, p, type, t) {
    const g = this.g;
    g.beginPath();
    g.arc(x, y, 34, 0, Math.PI * 2);
    g.fillStyle = '#ffffff';
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = INK;
    g.stroke();
    g.beginPath();
    g.arc(x, y, 34, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    g.lineWidth = 10;
    g.strokeStyle = '#5fd38a';
    g.lineCap = 'round';
    g.stroke();
    g.lineCap = 'butt';
    drawMoveIcon(g, type, x, y + 2, 0.55, t);
  }

  /** big instruction on the front of the counter */
  banner(app, k) {
    const g = this.g;
    const y = LAYOUT.counterY + 30;
    const step = k.current;
    if (!step || k.phase === 'served' || k.phase === 'done' || k.phase === 'failed') return;
    if (app.screen === 'tutorial' && app.tutorial.stage === 'paws') return;
    const text = k.hint();
    g.font = `600 26px ${FONT}`;
    const w = Math.min(1000, g.measureText(text).width + 120);
    this.panel(W / 2 - w / 2 + 60, y, w, 58, '#ffffff', 29, 4);
    const ix = W / 2 - w / 2 + 60 + 34;
    if (step.type === 'add' || step.type === 'top') drawItem(g, step.kind, ix, y + 30, 0.62, 0);
    else drawMoveIcon(g, step.type, ix, y + 30, 0.72, app.time);
    this.text(text, W / 2 + 60 + 30, y + 39, { size: 26 });
  }

  /** recipe strip at the bottom: every step, done ones ticked */
  recipeBar(app, k) {
    const g = this.g;
    const { y, h } = LAYOUT.bar;
    const r = k.recipe;
    if (!r) return;
    g.fillStyle = '#fff8fb';
    g.fillRect(0, y, W, h);
    g.fillStyle = INK;
    g.fillRect(0, y, W, 4);
    // recipe name tag
    this.panel(12, y + 14, 200, h - 28, '#ffe3ef', 16, 3);
    this.text('RECIPE', 112, y + 42, { size: 16, color: '#b0708a', weight: 700 });
    const name = r.name;
    const words = name.split(' ');
    if (words.length > 1 && name.length > 13) {
      const half = Math.ceil(words.length / 2);
      this.text(words.slice(0, half).join(' '), 112, y + 68, { size: 20, weight: 700, color: PINK });
      this.text(words.slice(half).join(' '), 112, y + 91, { size: 20, weight: 700, color: PINK });
    } else this.text(name, 112, y + 76, { size: 22, weight: 700, color: PINK });
    const n = r.steps.length;
    const x0 = 226;
    const avail = W - x0 - 10;
    const cw = Math.min(96, avail / n);
    r.steps.forEach((s, i) => {
      const cx = x0 + i * cw + cw / 2;
      const done = i < k.step;
      const cur = i === k.step && k.phase !== 'served';
      const cy = y + 16;
      const ch = h - 26;
      const pulse = cur ? Math.sin(app.time * 6) * 3 : 0;
      g.lineWidth = cur ? 4 : 2.5;
      rr(g, cx - cw / 2 + 4, cy - pulse / 2, cw - 8, ch + pulse, 14);
      g.fillStyle = done ? '#d8f7e6' : cur ? '#fff3b0' : '#ffffff';
      g.fill();
      g.strokeStyle = cur ? PINK : INK;
      g.stroke();
      // step number
      this.text(String(i + 1), cx - cw / 2 + 16, cy + 18, { size: 14, color: '#b0708a', weight: 700 });
      const iconS = Math.min(1, cw / 90);
      if (s.type === 'add' || s.type === 'top') {
        drawItem(g, s.kind, cx, cy + 34, 0.55 * iconS + 0.05, 0);
        if (s.type === 'top') {
          g.save();
          g.translate(cx + 18, cy + 18);
          g.fillStyle = '#ffd23d';
          star(g, 0, 0, 9);
          g.lineWidth = 2;
          g.strokeStyle = INK;
          g.stroke();
          g.restore();
        }
      } else {
        drawMoveIcon(g, s.type, cx, cy + 34, 0.62 * iconS + 0.05, cur ? app.time : 0);
      }
      this.text(stepLabel(s), cx, cy + ch - 10, { size: cw < 80 ? 13 : 15, weight: 600, color: done ? '#2f9f61' : INK });
      if (done) {
        g.fillStyle = '#2fbf71';
        g.beginPath();
        g.arc(cx + cw / 2 - 16, cy + 14, 11, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = '#ffffff';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(cx + cw / 2 - 21, cy + 14);
        g.lineTo(cx + cw / 2 - 17, cy + 18);
        g.lineTo(cx + cw / 2 - 10, cy + 9);
        g.stroke();
      }
    });
  }

  hud(app, k) {
    const g = this.g;
    // score
    this.panel(10, 8, 220, 52, '#ffffff', 20, 3);
    this.text('SCORE', 30, 30, { size: 14, align: 'left', color: '#b0708a', weight: 700 });
    this.text(String(k.score), 30, 54, { size: 26, align: 'left', weight: 700, color: PINK });
    if (k.multiplier > 1) {
      rr(g, 150, 18, 70, 32, 16);
      g.fillStyle = '#8a6cff';
      g.fill();
      this.text(`x${k.multiplier}`, 185, 42, { size: 22, weight: 700, color: '#ffffff' });
    }
    // order ticket with the timer
    const tw = 420;
    const tx = W / 2 - tw / 2;
    this.panel(tx, 8, tw, 52, '#ffffff', 20, 3);
    this.text(`Order ${k.orderIndex + 1}/${k.orders.length}`, tx + 18, 30, { size: 14, align: 'left', color: '#b0708a', weight: 700 });
    this.text(k.recipe?.name ?? '', tx + 18, 52, { size: 20, align: 'left', weight: 700 });
    if (k.mode === 'game' && k.timeTotal) {
      const f = Math.max(0, k.timeLeft / k.timeTotal);
      const bx = tx + 240;
      rr(g, bx, 22, 160, 22, 11);
      g.fillStyle = '#f3e6ec';
      g.fill();
      g.save();
      rr(g, bx, 22, 160, 22, 11);
      g.clip();
      g.fillStyle = f > 0.5 ? '#5fd38a' : f > 0.25 ? '#ffc93d' : (Math.sin(app.time * 10) > 0 ? '#ff5d5d' : '#ff9a9a');
      g.fillRect(bx, 22, 160 * f, 22);
      g.restore();
      rr(g, bx, 22, 160, 22, 11);
      g.lineWidth = 3;
      g.strokeStyle = INK;
      g.stroke();
      this.text(`${Math.ceil(k.timeLeft)}s`, bx + 80, 39, { size: 15, weight: 700 });
    }
    // level badge
    this.panel(W / 2 + tw / 2 + 14, 8, 180, 52, '#ffffff', 20, 3);
    this.text(k.diff.name, W / 2 + tw / 2 + 104, 32, { size: 18, weight: 700 });
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i < k.diff.stars ? '#ffd23d' : '#eee3e8';
      g.strokeStyle = INK;
      g.lineWidth = 2;
      star(g, W / 2 + tw / 2 + 80 + i * 24, 46, 9);
      g.stroke();
    }
    this.camInset(app, 10, 70, 150, 84);
  }

  camInset(app, x, y, w, h) {
    if (!app.showCam || !app.tracker) return;
    const g = this.g;
    if (app.tracker.status === 'idle' || app.tracker.status === 'error') return;
    app.tracker.drawInset(g, x, y, w, h, app.handPaws ?? [], PAW_COLORS);
    rr(g, x, y, w, h, 14);
    g.lineWidth = 3;
    g.strokeStyle = INK;
    g.stroke();
  }

  // ---- menu buttons ------------------------------------------------------------------
  buttons(app) {
    const g = this.g;
    for (const b of app.buttons) {
      const hov = b.hover;
      const lift = hov ? -3 : 0;
      if (b.kind === 'tile') {
        this.panel(b.x, b.y + lift, b.w, b.h, b.selected ? '#fff3b0' : '#ffffff', 20, b.selected ? 5 : 3);
        g.save();
        g.beginPath();
        g.roundRect(b.x, b.y + lift, b.w, b.h, 20);
        g.clip();
        if (b.data.hat) {
          drawCapy(g, b.x + b.w / 2, b.y + b.h * 0.78 + lift, 0.36, { hat: b.data.hat, apron: apronById(app.outfit.apron), mood: 'idle', t: app.time, noBody: true });
        }
        g.restore();
      } else if (b.kind === 'swatch') {
        this.panel(b.x, b.y + lift, b.w, b.h, '#ffffff', 20, b.selected ? 5 : 3);
        rr(g, b.x + 12, b.y + 12 + lift, b.w - 24, b.h - 24, 14);
        g.fillStyle = b.data.color;
        g.fill();
        heart(g, b.x + b.w / 2, b.y + b.h / 2 + 2 + lift, 12);
        g.fillStyle = '#ffffff';
        g.fill();
        if (b.selected) {
          g.lineWidth = 3;
          g.strokeStyle = INK;
          g.stroke();
        }
      } else if (b.kind === 'card') {
        const d = b.data;
        this.panel(b.x, b.y + lift, b.w, b.h, b.selected ? '#fff3b0' : '#ffffff', 28, 4);
        drawCapy(g, b.x + b.w / 2, b.y + 105 + lift, 0.42, { hat: d.id === 'easy' ? 'bow' : d.id === 'normal' ? 'chef' : 'crown', apron: apronById(app.outfit.apron), mood: d.id === 'hard' ? 'wow' : 'happy', t: app.time + b.x, noBody: true });
        this.text(d.name, b.x + b.w / 2, b.y + 205 + lift, { size: 34, weight: 700, color: PINK });
        for (let i = 0; i < 3; i++) {
          g.fillStyle = i < d.stars ? '#ffd23d' : '#eee3e8';
          g.strokeStyle = INK;
          g.lineWidth = 3;
          star(g, b.x + b.w / 2 - 40 + i * 40, b.y + 238 + lift, 15);
          g.stroke();
        }
        d.blurb.forEach((s, i) => this.text(s, b.x + b.w / 2, b.y + 284 + i * 28 + lift, { size: 21, weight: 500, color: '#7a5060' }));
      } else {
        // normal pill button
        const fill = b.color ?? '#ff7bb3';
        this.panel(b.x, b.y + lift, b.w, b.h, fill, b.h / 2, 4);
        g.fillStyle = 'rgba(255,255,255,0.3)';
        rr(g, b.x + 10, b.y + 6 + lift, b.w - 20, b.h * 0.35, b.h * 0.2);
        g.fill();
        this.text(b.label, b.x + b.w / 2, b.y + b.h / 2 + lift, { size: b.size ?? 30, weight: 700, color: '#ffffff', stroke: INK, lw: 6, base: 'middle' });
      }
      // dwell ring
      if (b.dwell > 0) {
        const cx = b.x + b.w - 16;
        const cy = b.y + 16 + lift;
        g.beginPath();
        g.arc(cx, cy, 16, 0, Math.PI * 2);
        g.fillStyle = '#ffffff';
        g.fill();
        g.lineWidth = 3;
        g.strokeStyle = INK;
        g.stroke();
        g.beginPath();
        g.moveTo(cx, cy);
        g.arc(cx, cy, 13, -Math.PI / 2, -Math.PI / 2 + b.dwell * Math.PI * 2);
        g.closePath();
        g.fillStyle = '#5fd38a';
        g.fill();
      }
    }
  }

  // ---- paws (cursors) ------------------------------------------------------------------
  paws(app) {
    if (!app.pawsShown) return;
    const g = this.g;
    const apron = apronById(app.outfit.apron);
    for (const p of app.paws) {
      if (!p.present) continue;
      drawPaw(g, p.x, p.y, p.fist, apron.color, 0.95, p.index === 0);
      if (p.src === 'mouse') continue;
      // small colored dot: which hand is which
      g.beginPath();
      g.arc(p.x, p.y + 46, 5, 0, Math.PI * 2);
      g.fillStyle = PAW_COLORS[p.index];
      g.fill();
    }
  }
}

export { HATS, APRONS, RECIPES, INGREDIENTS, drawHat };
