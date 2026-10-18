// ---------------------------------------------------------------------------
// Particles: flour puffs, sparkles, egg shells, sprinkles, smoke, confetti.
// ---------------------------------------------------------------------------
import { W } from '../config.js';

export class Particles {
  constructor() {
    this.list = [];
  }

  clear() {
    this.list = [];
  }

  burst(x, y, { color = '#fff', n = 10, speed = 200, size = 5, gravity = 500, star = false, life = 0.8 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.list.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.3, g: gravity,
        size: size * (0.6 + Math.random() * 0.6), color, life: life * (0.7 + Math.random() * 0.5), t: 0, star, rot: Math.random() * 6,
      });
    }
  }

  smoke(x, y, n = 6) {
    for (let i = 0; i < n; i++) {
      this.list.push({
        x: x + (Math.random() - 0.5) * 40, y, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 50, g: -20,
        size: 12 + Math.random() * 14, color: 'rgba(90,80,90,0.5)', life: 1.6, t: 0, smoke: true,
      });
    }
  }

  sprinkle(x, y, colors) {
    for (let i = 0; i < 6; i++) {
      this.list.push({
        x: x + (Math.random() - 0.5) * 40, y, vx: (Math.random() - 0.5) * 80, vy: 60 + Math.random() * 80, g: 900,
        size: 3, color: colors[Math.floor(Math.random() * colors.length)], life: 0.45, t: 0, rod: true, rot: Math.random() * 6,
      });
    }
  }

  confetti(n = 50) {
    const cols = ['#ff5fa2', '#58c7ff', '#ffe14d', '#7ce08a', '#b48cff', '#ff9a3d'];
    for (let i = 0; i < n; i++) {
      this.list.push({
        x: Math.random() * W, y: -20 - Math.random() * 100, vx: (Math.random() - 0.5) * 80, vy: 80 + Math.random() * 120, g: 120,
        size: 5 + Math.random() * 4, color: cols[i % cols.length], life: 3, t: 0, conf: true, rot: Math.random() * 6,
      });
    }
  }

  update(dt) {
    for (const p of this.list) {
      p.t += dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot = (p.rot ?? 0) + dt * 6;
      if (p.smoke) p.size += dt * 18;
    }
    this.list = this.list.filter((p) => p.t < p.life);
    if (this.list.length > 600) this.list.splice(0, this.list.length - 600);
  }

  draw(g) {
    for (const p of this.list) {
      const k = 1 - p.t / p.life;
      g.globalAlpha = p.smoke ? k * 0.8 : Math.min(1, k * 1.5);
      g.fillStyle = p.color;
      if (p.star) {
        star(g, p.x, p.y, p.size * 1.4, p.rot);
      } else if (p.rod || p.conf) {
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        if (p.conf) g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2 * Math.abs(Math.cos(p.rot * 1.3)) + 1);
        else g.fillRect(-p.size * 1.5, -p.size / 2, p.size * 3, p.size);
        g.restore();
      } else {
        g.beginPath();
        g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }
}

export function star(g, x, y, r, rot = 0) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}
