// shared test helpers: synthetic hands and a paw driver with press/release edges
export function makePaws() {
  return [0, 1].map((i) => ({ index: i, present: false, x: 300 + i * 600, y: 400, fist: false, pressed: false, released: false, src: 'test', vx: 0, vy: 0 }));
}

/** copy raw paw states (present, x, y, fist) into game paws, computing edges */
export function applyPaws(paws, raw) {
  for (const p of paws) {
    const r = raw[p.index];
    const was = p.fist;
    p.present = r.present;
    p.vx = r.x - p.x;
    p.vy = r.y - p.y;
    p.x = r.x;
    p.y = r.y;
    p.fist = r.present && r.fist;
    p.pressed = p.fist && !was;
    p.released = !p.fist && was;
  }
  return paws;
}

/** seeded random numbers, so the tests always play the same game */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * A synthetic MediaPipe hand (21 points) centred at (cx, cy) in camera
 * coordinates (0..1), open or closed.
 */
export function syntheticHand(cx, cy, closed = false, size = 0.08) {
  const lm = [];
  const P = (x, y) => ({ x: cx + x * size, y: cy + y * size, z: 0 });
  lm[0] = P(0, 0.9);                       // wrist
  // thumb
  lm[1] = P(-0.35, 0.65); lm[2] = P(-0.55, 0.4); lm[3] = P(-0.7, 0.2); lm[4] = P(-0.8, 0.05);
  const bases = [-0.3, -0.1, 0.1, 0.3];
  bases.forEach((bx, f) => {
    const mcp = 5 + f * 4;
    lm[mcp] = P(bx, 0);
    if (closed) {
      // fingers folded back towards the palm
      lm[mcp + 1] = P(bx, -0.25);
      lm[mcp + 2] = P(bx * 0.9, 0.05);
      lm[mcp + 3] = P(bx * 0.8, 0.35);
    } else {
      lm[mcp + 1] = P(bx * 1.1, -0.45);
      lm[mcp + 2] = P(bx * 1.15, -0.75);
      lm[mcp + 3] = P(bx * 1.2, -1.0);
    }
  });
  return lm;
}
