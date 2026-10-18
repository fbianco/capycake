// The kitchen rules, played by the robot chef and by hand-made paw moves.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Kitchen } from '../src/game/Kitchen.js';
import { Tutorial } from '../src/game/Tutorial.js';
import { Bot } from '../src/game/Bot.js';
import { DIFFICULTY, LAYOUT } from '../src/config.js';
import { RECIPES, pickOrders } from '../src/data/recipes.js';
import { makePaws, applyPaws, rng } from './helpers.mjs';

const DT = 1 / 60;

function playWithBot(k, maxSec = 600) {
  const bot = new Bot();
  const paws = makePaws();
  let t = 0;
  while (!k.finished && t < maxSec) {
    applyPaws(paws, bot.update(DT, k));
    k.update(DT, paws, false);
    t += DT;
  }
  return t;
}

for (const id of Object.keys(DIFFICULTY)) {
  test(`the robot chef bakes every order on ${id}`, () => {
    const d = DIFFICULTY[id];
    const k = new Kitchen({ rnd: rng(7) });
    k.start({ diff: d, orders: pickOrders(d.orders, d.maxTier, rng(3)) });
    const t = playWithBot(k);
    assert.equal(k.finished, true, `stuck at order ${k.orderIndex} step ${k.step} (${k.current?.type})`);
    assert.equal(k.results.length, d.orders);
    assert.ok(k.results.every((r) => !r.failed), 'no order missed');
    assert.ok(k.results.every((r) => r.stars === 3), 'perfect play = 3 stars');
    assert.ok(k.score > 1000 * d.orders);
    assert.ok(t < 90 * d.orders, `took ${t.toFixed(0)} s`);
  });
}

test('every recipe can be baked (hard, all tiers)', () => {
  for (const r of RECIPES) {
    const k = new Kitchen({ rnd: rng(11) });
    k.start({ diff: DIFFICULTY.hard, orders: [r] });
    playWithBot(k, 200);
    assert.equal(k.finished, true, `${r.id} stuck at step ${k.step}`);
    assert.equal(k.results[0].failed, false, `${r.id} too slow`);
  }
});

test('first order is always an easy recipe, no recipe twice in a row', () => {
  for (let s = 1; s < 30; s++) {
    const o = pickOrders(5, 3, rng(s));
    assert.equal(o[0].tier, 1);
    for (let i = 1; i < o.length; i++) assert.notEqual(o[i].id, o[i - 1].id);
  }
});

function setup(diff = DIFFICULTY.normal, recipe = RECIPES[0]) {
  const k = new Kitchen({ rnd: rng(5) });
  k.start({ diff, orders: [recipe] });
  k.phase = 'cook';
  const paws = makePaws();
  const raw = [{ present: false, x: 0, y: 0, fist: false }, { present: true, x: 640, y: 300, fist: false }];
  const step = (n = 1, clap = false) => {
    for (let i = 0; i < n; i++) {
      applyPaws(paws, raw);
      k.update(DT, paws, clap);
    }
  };
  const put = (kind) => {
    // place an item right under the paw and grab it
    k.items.push({ id: 999 + k.items.length, kind, x: 640, y: LAYOUT.belt.itemY, vy: 0, vx: 0, state: 'belt', t: 0, rot: 0 });
    raw[1].x = 640; raw[1].y = LAYOUT.belt.itemY; raw[1].fist = false;
    k.beltSpeed = 0;
    step(1);
    raw[1].fist = true;
    step(2);
  };
  const dropIn = (x, y) => {
    raw[1].x = x; raw[1].y = y;
    step(2);
    raw[1].fist = false;
    step(2);
  };
  return { k, paws, raw, step, put, dropIn };
}

test('wrong ingredient: Oops, penalty, combo lost, bounces out', () => {
  const { k, put, dropIn } = setup();
  put('flour');
  dropIn(k.bowl.x, k.bowl.y - 30);
  assert.equal(k.step, 1);
  assert.equal(k.score, 100);
  put('fish');
  dropIn(k.bowl.x, k.bowl.y - 30);
  assert.equal(k.step, 1, 'still waiting for sugar');
  assert.equal(k.score, 100 - DIFFICULTY.normal.penalty);
  assert.equal(k.combo, 0);
  assert.equal(k.mistakes, 1);
  assert.ok(!k.bowl.contents.includes('fish'));
});

test('an ingredient from later in the recipe says "Not yet!"', () => {
  const { k, put, dropIn } = setup();
  put('butter');
  dropIn(k.bowl.x, k.bowl.y - 30);
  assert.ok(k.msgs.some((m) => m.text.startsWith('Not yet!')));
});

test('egg goes on the rim, a clap cracks it', () => {
  const { k, put, dropIn, step } = setup();
  for (const kind of ['flour', 'sugar', 'egg']) {
    put(kind);
    dropIn(k.bowl.x, k.bowl.y - 30);
  }
  assert.equal(k.bowl.egg, true);
  assert.equal(k.current.type, 'crack');
  step(1, true);
  assert.equal(k.bowl.egg, false);
  assert.ok(k.bowl.contents.includes('egg'));
  assert.equal(k.current.kind, 'butter');
});

test('easy mode has no penalty; the mandarin on the capybara head gives a bonus once', () => {
  const { k, put, dropIn } = setup(DIFFICULTY.easy);
  put('sock');
  dropIn(k.bowl.x, k.bowl.y - 30);
  assert.equal(k.score, 0);
  put('orange');
  dropIn(LAYOUT.capy.x, LAYOUT.capy.y - 10);
  assert.equal(k.capy.orange, true);
  assert.equal(k.score, 50);
});

test('baking: early = pale, on green = perfect, too late = burnt (by itself)', () => {
  for (const [frac, want] of [[0.2, 'raw'], [0.8, 'perfect'], [null, 'burnt']]) {
    const { k, raw, step } = setup();
    k.step = k.recipe.steps.findIndex((s) => s.type === 'bake');
    k.tin.filled = 1;
    // carry the tin into the oven
    raw[1].x = k.tin.x; raw[1].y = k.tin.y - 30; raw[1].fist = false;
    step(1);
    raw[1].fist = true;
    step(2);
    assert.equal(k.tin.held, 1);
    const o = LAYOUT.oven;
    raw[1].x = o.x + o.w / 2; raw[1].y = o.y + 120;
    step(2);
    raw[1].fist = false;
    step(2);
    assert.equal(k.oven.baking, true);
    const target = frac ?? 2;
    while (k.oven.baking && k.bakeProgress < target) step(1);
    if (frac !== null) {
      raw[1].fist = true;
      step(2);
    }
    assert.equal(k.tin.baked, want);
  }
});

test('running out of time loses the order but the game goes on', () => {
  const k = new Kitchen({ rnd: rng(2) });
  k.start({ diff: DIFFICULTY.hard, orders: [RECIPES[0], RECIPES[1]] });
  const paws = makePaws();
  for (let t = 0; t < 200 && k.orderIndex === 0; t += DT) k.update(DT, paws, false);
  assert.equal(k.results[0].failed, true);
  assert.equal(k.orderIndex, 1);
});

test('the tutorial: stars, then the practice cupcake, then done', () => {
  const tut = new Tutorial({});
  tut.start('easy');
  const paws = makePaws();
  const bot = new Bot();
  // touch both stars
  for (const s of tut.stars) {
    applyPaws(paws, [{ present: false, x: 0, y: 0, fist: false }, { present: true, x: s.x, y: s.y, fist: false }]);
    tut.update(DT, paws, false);
  }
  for (let i = 0; i < 120; i++) tut.update(DT, paws, false);
  assert.equal(tut.stage, 'cook');
  for (let t = 0; t < 300 && tut.stage !== 'done'; t += DT) {
    applyPaws(paws, bot.update(DT, tut.kitchen));
    tut.update(DT, paws, false);
  }
  assert.equal(tut.stage, 'done');
  assert.equal(tut.kitchen.score > 0, true);
});
