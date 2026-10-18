// ---------------------------------------------------------------------------
// main.js - wires everything together and runs the loop.
//
//   camera -> HandTracker -> HandGestures --\
//                                            +-> InputManager -> 2 paws -> Kitchen / Tutorial / menus -> Renderer
//   mouse / touch / keyboard ---------------/                                  |
//                                                                            Sound + Particles
//
// Screens: boot (click: sound + camera) -> title -> outfit -> difficulty
//          -> tutorial (first time, or "How to play") -> game -> results.
// Bianco's Labs.
// ---------------------------------------------------------------------------
import { W, H, DIFFICULTY, GESTURE } from './config.js';
import { pickOrders } from './data/recipes.js';
import { HATS, APRONS, DEFAULT_OUTFIT } from './data/outfits.js';
import { Kitchen } from './game/Kitchen.js';
import { Tutorial } from './game/Tutorial.js';
import { Bot } from './game/Bot.js';
import { Renderer } from './render/Renderer.js';
import { Particles } from './render/Particles.js';
import { Sound } from './audio/Sound.js';
import { HandTracker } from './input/HandTracker.js';
import { HandGestures } from './input/HandGestures.js';
import { InputManager } from './input/InputManager.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);

const canvas = $('game');
const sound = new Sound();
const fx = new Particles();
const kitchen = new Kitchen({ sound, fx });
const tutorial = new Tutorial({ sound, fx });
const renderer = new Renderer(canvas);
const tracker = new HandTracker($('cam'));
const gestures = new HandGestures();
const input = new InputManager(canvas);
let bot = null;

const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem('capycake.' + k);
      return v === null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('capycake.' + k, JSON.stringify(v));
    } catch { /* private window */ }
  },
};

const app = {
  screen: 'boot',
  time: 0,
  kitchen,
  tutorial,
  fx,
  paws: input.paws,
  handPaws: gestures.paws,
  tracker,
  outfit: { ...DEFAULT_OUTFIT, ...store.get('outfit', {}) },
  diffId: store.get('difficulty', 'easy'),
  best: 0,
  newBest: false,
  buttons: [],
  paused: false,
  showCam: true,
  pawsShown: true,
  noPawsFor: 0,
  toast: null,
  afterTutorial: 'outfit',
  get camReady() { return tracker.ready; },
  get camMessage() {
    if (tracker.ready) return input.usingMouse ? 'Paw control ON (mouse in use)' : 'Paw control ON - show your hands!';
    return tracker.message === 'Camera off' ? 'Mouse mode' : tracker.message;
  },
};
app.best = bestFor(app.diffId);

function bestFor(id) {
  return store.get('best.' + id, 0);
}

// ---- screens & buttons ---------------------------------------------------------------
let screenLock = 0;

function go(screen) {
  app.screen = screen;
  app.paused = false;
  screenLock = 0.6;
  for (const b of app.buttons) b.dwell = 0;
  app.buttons = [];
  if (screen === 'title' || screen === 'outfit' || screen === 'difficulty') fx.clear();
}

function buildButtons() {
  const s = app.screen;
  const B = [];
  if (app.paused) {
    B.push({ id: 'resume', label: 'RESUME', x: 430, y: 380, w: 200, h: 76, color: '#5fd38a' });
    B.push({ id: 'menu', label: 'MENU', x: 650, y: 380, w: 200, h: 76, color: '#8a6cff' });
    return B;
  }
  if (s === 'title') {
    B.push({ id: 'play', label: 'PLAY', x: 130, y: 300, w: 300, h: 96, size: 44, color: '#ff7bb3' });
    B.push({ id: 'learn', label: 'HOW TO PLAY', x: 850, y: 300, w: 300, h: 96, size: 32, color: '#58c7ff' });
  } else if (s === 'outfit') {
    HATS.forEach((h, i) => {
      B.push({ id: 'hat', kind: 'tile', data: { hat: h.id }, x: 560 + (i % 4) * 166, y: 148 + Math.floor(i / 4) * 146, w: 150, h: 132, selected: app.outfit.hat === h.id });
    });
    APRONS.forEach((a, i) => {
      B.push({ id: 'apron', kind: 'swatch', data: a, x: 590 + i * 124, y: 488, w: 108, h: 86, selected: app.outfit.apron === a.id });
    });
    B.push({ id: 'back', label: 'BACK', x: 40, y: 610, w: 190, h: 72, color: '#b9a3d6' });
    B.push({ id: 'next', label: 'NEXT', x: 1030, y: 610, w: 210, h: 72, color: '#5fd38a' });
  } else if (s === 'difficulty') {
    Object.values(DIFFICULTY).forEach((d, i) => {
      B.push({ id: 'diff', kind: 'card', data: d, x: 80 + i * 390, y: 112, w: 340, h: 430, selected: app.diffId === d.id });
    });
    B.push({ id: 'back', label: 'BACK', x: 40, y: 610, w: 190, h: 72, color: '#b9a3d6' });
  } else if (s === 'tutorial') {
    if (tutorial.stage === 'done') B.push({ id: 'tutdone', label: "LET'S BAKE!", x: 470, y: 400, w: 340, h: 96, size: 40, color: '#5fd38a' });
    else B.push({ id: 'skip', label: 'SKIP', x: 12, y: 10, w: 140, h: 56, size: 26, color: '#b9a3d6' });
  } else if (s === 'results') {
    B.push({ id: 'again', label: 'PLAY AGAIN', x: 700, y: 600, w: 300, h: 84, size: 34, color: '#ff7bb3' });
    B.push({ id: 'menu', label: 'MENU', x: 1020, y: 600, w: 220, h: 84, color: '#8a6cff' });
  }
  // keep hover / dwell state of buttons that stay the same
  for (const b of B) {
    const old = app.buttons.find((o) => o.id === b.id && o.x === b.x && o.y === b.y);
    b.dwell = old?.dwell ?? 0;
    b.hover = old?.hover ?? false;
  }
  return B;
}

function updateButtons(dt) {
  app.buttons = buildButtons();
  if (screenLock > 0) {
    screenLock -= dt;
    return;
  }
  for (const b of app.buttons) {
    const inside = (p) => p.present && p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;
    const ps = app.paws.filter(inside);
    const wasHover = b.hover;
    b.hover = ps.length > 0;
    if (b.hover && !wasHover) sound.play('hover');
    if (ps.some((p) => p.pressed)) return press(b);
    // camera paws (and the demo robot) press a button by hovering over it
    if (ps.some((p) => p.src === 'cam' || p.src === 'bot')) {
      b.dwell += dt / GESTURE.dwell;
      if (b.dwell >= 1) return press(b);
    } else b.dwell = Math.max(0, b.dwell - dt * 2);
  }
}

function press(b) {
  sound.play('click');
  for (const o of app.buttons) o.dwell = 0;
  screenLock = 0.5;
  switch (b.id) {
    case 'play': go('outfit'); break;
    case 'learn':
      app.afterTutorial = 'outfit';
      startTutorial();
      break;
    case 'hat':
      app.outfit.hat = b.data.hat;
      store.set('outfit', app.outfit);
      screenLock = 0.3;
      break;
    case 'apron':
      app.outfit.apron = b.data.id;
      store.set('outfit', app.outfit);
      screenLock = 0.3;
      break;
    case 'next': go('difficulty'); break;
    case 'back': go(app.screen === 'difficulty' ? 'outfit' : 'title'); break;
    case 'diff':
      app.diffId = b.data.id;
      store.set('difficulty', app.diffId);
      if (!store.get('tutorialDone', false)) {
        app.afterTutorial = 'game';
        startTutorial();
      } else startGame();
      break;
    case 'skip':
    case 'tutdone':
      finishTutorial();
      break;
    case 'again': startGame(); break;
    case 'resume': app.paused = false; break;
    case 'menu': go('title'); break;
    default: break;
  }
}

function startTutorial() {
  fx.clear();
  tutorial.start('easy');
  go('tutorial');
}

function finishTutorial() {
  store.set('tutorialDone', true);
  if (app.afterTutorial === 'game') startGame();
  else go('outfit');
}

function startGame() {
  const d = DIFFICULTY[app.diffId] ?? DIFFICULTY.easy;
  fx.clear();
  kitchen.start({ diff: d, orders: pickOrders(d.orders, d.maxTier) });
  app.best = bestFor(d.id);
  app.newBest = false;
  go('game');
  sound.play('start');
}

function endGame() {
  const id = kitchen.diff.id;
  const best = bestFor(id);
  app.newBest = kitchen.score > best;
  if (app.newBest) store.set('best.' + id, kitchen.score);
  app.best = Math.max(best, kitchen.score);
  go('results');
  sound.play('fanfare');
  fx.confetti(80);
}

function toast(text) {
  app.toast = { text, t: 2 };
}

// ---- keyboard ---------------------------------------------------------------------
input.onKey((e) => {
  if (app.screen === 'boot') return;
  switch (e.code) {
    case 'KeyP':
      if (app.screen === 'game' || app.screen === 'tutorial') app.paused = !app.paused;
      break;
    case 'Escape':
      if (app.screen === 'title') break;
      go('title');
      break;
    case 'KeyM':
      toast(sound.toggleMute() ? 'Sound off' : 'Sound on');
      break;
    case 'KeyV':
      app.showCam = !app.showCam;
      break;
    case 'KeyR':
      startCamera();
      break;
    case 'Enter':
      if (app.screen === 'tutorial') finishTutorial();
      else if (app.screen === 'title') go('outfit');
      else if (app.screen === 'outfit') go('difficulty');
      else if (app.screen === 'difficulty') press({ id: 'diff', data: DIFFICULTY[app.diffId] });
      else if (app.screen === 'results') startGame();
      break;
    default:
      break;
  }
});

// ---- boot: one click is needed by browsers to allow sound -----------------------------
$('boot-btn').addEventListener('click', () => {
  $('boot').classList.add('hidden');
  sound.init();
  sound.play('start');
  sound.startMusic();
  go('title');
  if (params.has('demo')) startDemo();
  startCamera();
});

async function startCamera() {
  if (params.has('nocam')) return;
  await tracker.start();
  if (tracker.ready) toast('Paw control ON - make a fist to grab!');
}

function startDemo() {
  bot = new Bot();
  app.diffId = params.get('level') ?? 'normal';
  startGame();
}

// debug: /?auto&screen=game&level=easy skips the boot card (no camera)
if (params.has('auto')) {
  $('boot').classList.add('hidden');
  const scr = params.get('screen') ?? 'title';
  if (params.has('demo')) startDemo();
  else if (scr === 'game') {
    app.diffId = params.get('level') ?? 'easy';
    startGame();
  } else if (scr === 'tutorial') startTutorial();
  else go(scr);
}

// ---- main loop ----------------------------------------------------------------------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  app.time += dt;
  const t = now / 1000;

  // camera hands
  if (tracker.ready) {
    gestures.aspect = tracker.aspect;
    const hands = tracker.detect(now);
    if (hands !== undefined) gestures.update(hands, t);
    else gestures.update(null, t); // only ages lost hands
  }
  let botPaws = null;
  if (bot && (app.screen === 'game' || app.screen === 'results')) {
    botPaws = bot.update(dt, kitchen);
    if (app.screen === 'results' && app.time > (app.resultsAt ?? 0) + 6) startGame();
  }
  input.update(t, tracker.ready ? gestures.paws : null, botPaws);
  app.noPawsFor = app.paws.some((p) => p.present) ? 0 : app.noPawsFor + dt;

  if (app.screen !== 'boot') updateButtons(dt);

  if (!app.paused) {
    if (app.screen === 'tutorial') {
      tutorial.update(dt, app.paws, input.clapped);
    } else if (app.screen === 'game') {
      kitchen.update(dt, app.paws, input.clapped);
      if (kitchen.finished && kitchen.phaseT > 0.3) {
        endGame();
        app.resultsAt = app.time;
      }
    } else if (app.screen === 'results') {
      kitchen.updateMsgs(dt);
    }
    fx.update(dt);
  }
  if (app.toast) app.toast.t -= dt;

  if (app.screen !== 'boot') renderer.render(app);
  requestAnimationFrame(frame);
}

// wait for the cute font before drawing text on the canvas
Promise.all(['400', '500', '600', '700'].map((w) => document.fonts?.load?.(`${w} 24px Fredoka`))).finally?.(() => requestAnimationFrame(frame)) ?? requestAnimationFrame(frame);

// for the tests / debugging in the browser console
window.capycake = { app, kitchen, tutorial, input, gestures, tracker, W, H };
