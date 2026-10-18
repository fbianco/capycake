// Whisk, stir and clap detectors.
import test from 'node:test';
import assert from 'node:assert/strict';
import { WhiskDetector, StirDetector, ClapDetector } from '../src/input/Motion.js';

test('whisk counts big left-right swings, not jitter', () => {
  const w = new WhiskDetector(38);
  for (let i = 0; i < 300; i++) w.update(500 + Math.sin(i * 0.4) * 5);
  assert.equal(w.count, 0, 'tiny jitter');
  for (let i = 0; i < 160; i++) w.update(500 + Math.sin(i * 0.4) * 70);
  assert.ok(w.count >= 15, `count ${w.count}`);
});

test('stir counts full circles; shaking through the middle does not', () => {
  const s = new StirDetector(22, 175);
  for (let i = 0; i <= 200; i++) {
    const a = (i / 100) * Math.PI * 2;
    s.update(500 + Math.cos(a) * 80, 400 + Math.sin(a) * 80, 500, 400);
  }
  assert.ok(Math.abs(s.turns - 2) < 0.05, `turns ${s.turns}`);
  const s2 = new StirDetector(22, 175);
  for (let i = 0; i < 400; i++) s2.update(500 + Math.sin(i * 0.5) * 90, 400 + (i % 2), 500, 400);
  assert.ok(s2.turns < 0.5, `shake gave ${s2.turns} turns`);
});

test('clap: paws apart then together', () => {
  const c = new ClapDetector();
  const a = { present: true, x: 300, y: 400 };
  const b = { present: true, x: 900, y: 400 };
  assert.equal(c.update(a, b, 0), false);
  a.x = 580; b.x = 660;
  assert.equal(c.update(a, b, 0.3), true);
  // holding them together does not clap again
  assert.equal(c.update(a, b, 0.5), false);
});

test('clap: a slow approach (too long) is not a clap', () => {
  const c = new ClapDetector();
  const a = { present: true, x: 300, y: 400 };
  const b = { present: true, x: 900, y: 400 };
  c.update(a, b, 0);
  a.x = 500; b.x = 700;
  c.update(a, b, 1.5);
  a.x = 580; b.x = 660;
  assert.equal(c.update(a, b, 2.5), false);
});
