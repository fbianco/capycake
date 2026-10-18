// ---------------------------------------------------------------------------
// scene.js - the cute factory: back wall (cached once), gears, conveyor belt,
// hopper machine, oven with its bake gauge, counter.
// ---------------------------------------------------------------------------
import { W, H, LAYOUT } from '../config.js';
import { INK, rr, heart } from './art.js';

let wallCache = null;

function circle(g, x, y, r) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
}

function fs(g, fill, stroke = INK, lw = 3) {
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = lw;
    g.strokeStyle = stroke;
    g.stroke();
  }
}

/** the static back wall, drawn once into an offscreen canvas */
export function drawWall(g) {
  if (!wallCache) {
    wallCache = document.createElement('canvas');
    wallCache.width = W;
    wallCache.height = H;
    paintWall(wallCache.getContext('2d'));
  }
  g.drawImage(wallCache, 0, 0);
}

function paintWall(g) {
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#ffe3ee');
  grd.addColorStop(0.6, '#ffd3e3');
  grd.addColorStop(1, '#f9c3d6');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  // wallpaper: little hearts and dots
  g.fillStyle = 'rgba(255,255,255,0.45)';
  for (let y = 80; y < 500; y += 46) {
    for (let x = (y / 46) % 2 ? 0 : 23; x < W; x += 46) {
      if ((x + y) % 92 === 0) {
        heart(g, x, y, 5);
        g.fill();
      } else {
        circle(g, x, y, 2.5);
        g.fill();
      }
    }
  }
  // round windows with sky and clouds
  for (const wx of [380, 700]) {
    const wy = 112;
    circle(g, wx, wy, 48);
    fs(g, '#bfe9ff', INK, 5);
    g.save();
    circle(g, wx, wy, 46);
    g.clip();
    g.fillStyle = '#ffffff';
    for (const [cx, cy, r] of [[-20, 10, 16], [0, 4, 20], [22, 12, 14], [30, -24, 9], [14, -26, 11]]) {
      circle(g, wx + cx, wy + cy, r);
      g.fill();
    }
    g.restore();
    g.strokeStyle = '#ffffff';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(wx - 46, wy);
    g.lineTo(wx + 46, wy);
    g.moveTo(wx, wy - 46);
    g.lineTo(wx, wy + 46);
    g.stroke();
    circle(g, wx, wy, 48);
    fs(g, null, '#ff9cc0', 8);
    circle(g, wx, wy, 52);
    fs(g, null, INK, 3);
  }
  // pipes
  g.lineCap = 'butt';
  const pipe = (pts, col = '#8fdcc4') => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.lineJoin = 'round';
    g.lineWidth = 22;
    g.strokeStyle = INK;
    g.stroke();
    g.lineWidth = 16;
    g.strokeStyle = col;
    g.stroke();
    g.lineWidth = 4;
    g.strokeStyle = 'rgba(255,255,255,0.5)';
    g.stroke();
  };
  pipe([[0, 82], [250, 82], [250, 150], [300, 150]]);
  pipe([[480, 70], [560, 70], [560, 160], [640, 160]], '#c4b1ff');
  pipe([[800, 66], [900, 66], [900, 140], [1060, 140]], '#ffd27a');
  for (const [x, y] of [[250, 82], [560, 70], [560, 160], [900, 66], [900, 140]]) {
    circle(g, x, y, 13);
    fs(g, '#ffffff', INK, 3);
  }
  // bunting
  const cols = ['#ff8fbf', '#8fd3ff', '#ffe066', '#7ce0b0', '#c4a6ff'];
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 8);
  g.quadraticCurveTo(320, 40, 640, 8);
  g.quadraticCurveTo(960, 40, W, 8);
  g.stroke();
  for (let i = 0; i < 26; i++) {
    const x = 12 + i * 49.5;
    const half = x < 640 ? x / 640 : (x - 640) / 640;
    const y = 8 + Math.sin(half * Math.PI) * 16;
    g.beginPath();
    g.moveTo(x - 12, y);
    g.lineTo(x + 12, y);
    g.lineTo(x, y + 22);
    g.closePath();
    fs(g, cols[i % cols.length], INK, 2);
  }
  // factory sign
  rr(g, 735, 258, 230, 34, 17);
  fs(g, '#ffffff', INK, 3);
  g.fillStyle = '#ff5fa2';
  g.font = '600 20px Fredoka, "Comic Sans MS", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('CAPYCAKE FACTORY', 850, 276);
  g.textBaseline = 'alphabetic';
  // wainscoting behind the counter
  g.fillStyle = '#ffc0d6';
  g.fillRect(0, 300, W, 200);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  for (let x = 0; x < W; x += 40) g.fillRect(x, 300, 20, 200);
  g.fillStyle = INK;
  g.fillRect(0, 298, W, 3);
}

/** gears turning on the wall */
export function drawGears(g, t) {
  gear(g, 60, 150, 34, 10, t * 0.8, '#ffd27a');
  gear(g, 112, 124, 22, 8, -t * 1.2, '#8fdcc4');
}

function gear(g, x, y, r, teeth, a, col) {
  if (!col) return;
  g.save();
  g.translate(x, y);
  g.rotate(a);
  g.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const ang = (i / (teeth * 2)) * Math.PI * 2;
    const rr2 = i % 2 ? r : r + 8;
    g.lineTo(Math.cos(ang) * rr2, Math.sin(ang) * rr2);
  }
  g.closePath();
  fs(g, col, INK, 3);
  circle(g, 0, 0, r * 0.35);
  fs(g, '#ffffff', INK, 3);
  g.restore();
}

/** conveyor belt, moving left. `offset` slides the stripes. */
export function drawBelt(g, offset, t) {
  const y = LAYOUT.belt.y;
  // legs
  g.fillStyle = '#b7b0cc';
  for (const lx of [330, 700, 1000]) {
    rr(g, lx - 8, y + 20, 16, 70, 4);
    fs(g, '#b7b0cc', INK, 3);
  }
  // belt body
  rr(g, -10, y - 6, W + 20, 34, 16);
  fs(g, '#6a6380', INK, 4);
  // moving stripes
  g.save();
  rr(g, -10, y - 6, W + 20, 16, 8);
  g.clip();
  g.fillStyle = '#857d9e';
  for (let x = -40 - offset; x < W + 40; x += 40) {
    g.beginPath();
    g.moveTo(x, y - 6);
    g.lineTo(x + 18, y - 6);
    g.lineTo(x + 8, y + 10);
    g.lineTo(x - 10, y + 10);
    g.closePath();
    g.fill();
  }
  g.restore();
  // rollers
  for (let x = 20; x < W; x += 64) {
    g.save();
    g.translate(x, y + 18);
    g.rotate(-t * 4);
    circle(g, 0, 0, 9);
    fs(g, '#d9d4e8', INK, 2.5);
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-6, 0);
    g.lineTo(6, 0);
    g.stroke();
    g.restore();
  }
  // left chute (items fall off here)
  g.beginPath();
  g.moveTo(-10, y - 8);
  g.lineTo(26, y - 8);
  g.lineTo(14, y + 40);
  g.lineTo(-10, y + 40);
  fs(g, '#ffb3d1', INK, 3);
}

/** hopper machine top-right that drops the ingredients on the belt */
export function drawHopper(g, t, blink) {
  const { x, y } = LAYOUT.hopper;
  g.save();
  g.translate(x, y);
  // funnel
  g.beginPath();
  g.moveTo(-60, 70);
  g.lineTo(60, 70);
  g.lineTo(30, 120);
  g.lineTo(-30, 120);
  g.closePath();
  fs(g, '#c4b1ff', INK, 4);
  rr(g, -32, 116, 64, 18, 6);
  fs(g, '#a28ae8', INK, 3);
  // body
  rr(g, -80, -32, 160, 104, 22);
  fs(g, '#a9e4ff', INK, 4);
  // window with tumbling stuff
  rr(g, -54, -14, 108, 52, 14);
  fs(g, '#ffffff', INK, 3);
  g.save();
  rr(g, -54, -14, 108, 52, 14);
  g.clip();
  const cols = ['#ff8fbf', '#ffe066', '#7ce0b0', '#ffffff', '#c4a6ff'];
  for (let i = 0; i < 9; i++) {
    const a = t * 2 + i * 1.3;
    circle(g, Math.cos(a) * 34, 12 + Math.sin(a * 1.3) * 16, 8);
    fs(g, cols[i % cols.length], INK, 2);
  }
  g.restore();
  // lights
  for (let i = 0; i < 4; i++) {
    circle(g, -45 + i * 30, -42, 7);
    const on = Math.floor(t * 4 + i) % 4 === 0 || blink > 0;
    fs(g, on ? ['#ff5d73', '#ffe066', '#7ce08a', '#58c7ff'][i] : '#e6e0ee', INK, 2.5);
  }
  g.restore();
}

/** oven + bake gauge. kitchen gives oven state and bake progress */
export function drawOven(g, oven, progress, win, t, autoOut) {
  const o = LAYOUT.oven;
  const { x, y, w, h } = o;
  // chimney
  rr(g, x + w - 70, y - 50, 34, 56, 6);
  fs(g, '#d9d4e8', INK, 3);
  // body
  rr(g, x, y, w, h, 26);
  fs(g, '#ff9eb8', INK, 4);
  // top panel with knobs
  rr(g, x + 14, y + 12, w - 28, 36, 14);
  fs(g, '#ffd3e0', INK, 3);
  for (let i = 0; i < 3; i++) {
    const kx = x + 50 + i * 40;
    g.save();
    g.translate(kx, y + 30);
    g.rotate(oven.baking ? t * 2 + i : i);
    circle(g, 0, 0, 11);
    fs(g, '#ffffff', INK, 3);
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -8);
    g.stroke();
    g.restore();
  }
  // little light
  circle(g, x + w - 44, y + 30, 9);
  fs(g, oven.baking ? (Math.sin(t * 8) > 0 ? '#ff5d73' : '#ffb0bc') : '#e6e0ee', INK, 3);
  // door
  const doorOpen = oven.door;
  const dx = x + 22;
  const dy = y + 62;
  const dw = w - 44;
  const dh = h - 82;
  g.save();
  if (doorOpen > 0) {
    // door swings down a bit
    g.translate(0, doorOpen * 18);
  }
  rr(g, dx, dy, dw, dh, 18);
  fs(g, '#ffc4d4', INK, 4);
  rr(g, dx + 16, dy + 24, dw - 32, dh - 44, 14);
  const glow = oven.glow;
  const gg = g.createRadialGradient(dx + dw / 2, dy + dh / 2, 10, dx + dw / 2, dy + dh / 2, dw / 2);
  gg.addColorStop(0, `rgba(255,${170 - glow * 40},${80 - glow * 40},${0.25 + glow * 0.75})`);
  gg.addColorStop(1, '#5a3a4a');
  fs(g, gg, INK, 3);
  // handle
  rr(g, dx + 30, dy + 6, dw - 60, 12, 6);
  fs(g, '#ffffff', INK, 3);
  g.restore();
  // bake gauge above the oven
  if (oven.baking || progress > 0) {
    const gx = x + 10;
    const gy = y - 30;
    const gw = w - 20;
    const gh = 22;
    const max = autoOut;
    const px = (p) => gx + (Math.min(max, p) / max) * gw;
    rr(g, gx, gy, gw, gh, 11);
    fs(g, '#fff3d6', INK, 3);
    g.save();
    rr(g, gx, gy, gw, gh, 11);
    g.clip();
    g.fillStyle = '#f3dfa8';
    g.fillRect(gx, gy, px(win[0]) - gx, gh);
    g.fillStyle = '#5fd38a';
    g.fillRect(px(win[0]), gy, px(win[1]) - px(win[0]), gh);
    g.fillStyle = '#ffae5a';
    g.fillRect(px(win[1]), gy, px(1.12) - px(win[1]), gh);
    g.fillStyle = '#7a4a3a';
    g.fillRect(px(1.12), gy, gx + gw - px(1.12), gh);
    g.restore();
    rr(g, gx, gy, gw, gh, 11);
    fs(g, null, INK, 3);
    // needle
    const nx = px(progress);
    g.beginPath();
    g.moveTo(nx, gy - 8);
    g.lineTo(nx - 8, gy - 20);
    g.lineTo(nx + 8, gy - 20);
    g.closePath();
    fs(g, '#ffffff', INK, 3);
    g.fillStyle = INK;
    g.fillRect(nx - 2, gy - 6, 4, gh + 12);
  }
}

/** counter top + front. The front carries the instruction banner. */
export function drawCounter(g) {
  const y = LAYOUT.counterY;
  rr(g, -10, y - 6, W + 20, 26, 10);
  fs(g, '#fff4e4', INK, 4);
  g.fillStyle = '#9fe3d0';
  g.fillRect(0, y + 20, W, LAYOUT.bar.y - y - 20);
  // tiles
  g.strokeStyle = 'rgba(255,255,255,0.6)';
  g.lineWidth = 2;
  for (let x = 0; x < W; x += 48) {
    g.beginPath();
    g.moveTo(x, y + 20);
    g.lineTo(x, LAYOUT.bar.y);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(0, y + 54);
  g.lineTo(W, y + 54);
  g.stroke();
  g.fillStyle = INK;
  g.fillRect(0, y + 19, W, 3);
}
