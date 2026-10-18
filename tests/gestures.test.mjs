// Hand landmarks -> paws: open / fist detection, screen mapping, which hand is which.
import test from 'node:test';
import assert from 'node:assert/strict';
import { HandGestures, fingerReach, camToScreen } from '../src/input/HandGestures.js';
import { GESTURE, W, H } from '../src/config.js';
import { syntheticHand } from './helpers.mjs';

test('finger reach: open hand is high, fist is low', () => {
  const open = fingerReach(syntheticHand(0.5, 0.5, false), 1);
  const fist = fingerReach(syntheticHand(0.5, 0.5, true), 1);
  assert.ok(open > GESTURE.fistOpen, `open ${open}`);
  assert.ok(fist < GESTURE.fistClose, `fist ${fist}`);
});

test('the camera picture is mirrored and stretched to the screen', () => {
  const left = camToScreen({ x: 0.8, y: 0.5 });  // right side of the raw picture = left of the mirror
  const right = camToScreen({ x: 0.2, y: 0.5 });
  assert.ok(left.x < W / 2 && right.x > W / 2);
  assert.equal(camToScreen({ x: 0.0, y: 0.0 }).x, W);
  assert.equal(camToScreen({ x: 1, y: 1 }).y, H);
});

test('a fist must last a couple of frames (no flicker)', () => {
  const hg = new HandGestures();
  hg.aspect = 1;
  let t = 0;
  for (let i = 0; i < 5; i++) hg.update([syntheticHand(0.7, 0.5, false)], (t += 0.033));
  assert.equal(hg.paws[0].present, true);
  assert.equal(hg.paws[0].fist, false);
  hg.update([syntheticHand(0.7, 0.5, true)], (t += 0.033));
  assert.equal(hg.paws[0].fist, false, 'one frame is not enough');
  hg.update([syntheticHand(0.7, 0.5, true)], (t += 0.033));
  assert.equal(hg.paws[0].fist, true);
});

test('two hands: left one on screen is paw 0, and they keep their paw when crossing a bit', () => {
  const hg = new HandGestures();
  let t = 0;
  // raw x 0.7 = left on screen (mirror)
  for (let i = 0; i < 3; i++) hg.update([syntheticHand(0.3, 0.5), syntheticHand(0.7, 0.5)], (t += 0.033));
  assert.ok(hg.paws[0].x < hg.paws[1].x);
  const before0 = hg.paws[0].x;
  // order of detections swapped by MediaPipe: still the same paws
  hg.update([syntheticHand(0.7, 0.5), syntheticHand(0.3, 0.5)], (t += 0.033));
  assert.ok(Math.abs(hg.paws[0].x - before0) < 30);
});

test('a lost hand disappears after a short time', () => {
  const hg = new HandGestures();
  let t = 0;
  hg.update([syntheticHand(0.5, 0.5)], (t += 0.033));
  const i = hg.paws.findIndex((p) => p.present);
  hg.update([], (t += 0.1));
  assert.equal(hg.paws[i].present, true);
  hg.update([], (t += GESTURE.lostMs / 1000 + 0.05));
  assert.equal(hg.paws[i].present, false);
});
