// ---------------------------------------------------------------------------
// InputManager: webcam paws + mouse/touch + keyboard -> two game paws.
//
//   paw = { index, present, x, y, fist, pressed, released, src }
//   pressed / released are true for exactly one update when the paw closes
//   or opens. The mouse (or a finger on a touch screen) drives paw 1 while
//   it is being used: button down = closed paw.
//   Space = clap (cracks an egg) for mouse players.
// ---------------------------------------------------------------------------
import { W, H } from '../config.js';
import { ClapDetector } from './Motion.js';

const MOUSE_IDLE = 2.5; // s without mouse movement before the camera takes paw 1 back

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.paws = [0, 1].map((i) => ({
      index: i, present: false, x: i ? W * 0.7 : W * 0.3, y: H * 0.6,
      fist: false, pressed: false, released: false, src: 'none', vx: 0, vy: 0,
    }));
    this.mouse = { x: W / 2, y: H / 2, down: false, lastMove: -99, inside: false, clicks: 0 };
    this.clap = new ClapDetector();
    this.clapped = false;
    this.spaceClap = false;
    this.camPaws = null;
    this.keyHandlers = [];
    this.time = 0;
    this.bindPointer();
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.spaceClap = true;
        e.preventDefault();
      }
      for (const h of this.keyHandlers) h(e);
    });
  }

  onKey(fn) {
    this.keyHandlers.push(fn);
  }

  toLogical(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }

  bindPointer() {
    const c = this.canvas;
    const move = (e) => {
      const p = this.toLogical(e);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
      this.mouse.lastMove = performance.now() / 1000;
      this.mouse.inside = true;
    };
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerdown', (e) => {
      move(e);
      this.mouse.down = true;
      this.mouse.clicks++;
      c.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
    const up = (e) => {
      move(e);
      this.mouse.down = false;
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('pointerleave', () => { this.mouse.inside = false; });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  get mouseActive() {
    return performance.now() / 1000 - this.mouse.lastMove < MOUSE_IDLE || this.mouse.down;
  }

  /**
   * camPaws: paws from HandGestures (or null when there is no camera),
   * botPaws: optional paws from the demo robot (override everything).
   */
  update(t, camPaws, botPaws = null) {
    this.time = t;
    const src = botPaws ?? null;
    for (const paw of this.paws) {
      const wasFist = paw.fist;
      const px = paw.x;
      const py = paw.y;
      let next = null;
      if (src) next = { ...src[paw.index], src: 'bot' };
      else if (paw.index === 1 && this.mouseActive) {
        next = { present: true, x: this.mouse.x, y: this.mouse.y, fist: this.mouse.down, src: 'mouse' };
      } else if (camPaws) {
        const c = camPaws[paw.index];
        next = { present: c.present, x: c.x, y: c.y, fist: c.present && c.fist, src: 'cam' };
      }
      if (!next) next = { present: false, x: paw.x, y: paw.y, fist: false, src: 'none' };
      paw.present = next.present;
      paw.x = next.x;
      paw.y = next.y;
      paw.fist = next.fist;
      paw.src = next.src;
      paw.pressed = paw.fist && !wasFist;
      paw.released = !paw.fist && wasFist;
      paw.vx = paw.vx * 0.7 + (paw.x - px) * 0.3;
      paw.vy = paw.vy * 0.7 + (paw.y - py) * 0.3;
    }
    // claps need two real hands; Space is the keyboard clap
    const camBoth = this.paws[0].src !== 'mouse' && this.paws[1].src !== 'mouse';
    this.clapped = this.spaceClap || (camBoth && this.clap.update(this.paws[0], this.paws[1], t));
    this.spaceClap = false;
    return this.paws;
  }

  /** the mouse is the only thing playing (no camera hands) */
  get usingMouse() {
    return this.paws[1].src === 'mouse';
  }
}
