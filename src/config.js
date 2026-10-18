// ---------------------------------------------------------------------------
// config.js - every tuning constant of CapyCake in one place.
// Bianco's Labs.
// ---------------------------------------------------------------------------

// The game is drawn on a fixed 1280 x 720 "logical" screen, scaled to the window.
export const W = 1280;
export const H = 720;

// Webcam picture and the part of it that maps to the whole game screen.
// A smaller box = less arm movement needed to reach the corners.
export const CAM = {
  width: 960,
  height: 540,
  x0: 0.14, x1: 0.86,   // horizontal part of the (mirrored) picture used
  y0: 0.08, y1: 0.80,   // vertical part
};

// Hand gesture thresholds (see src/input/HandGestures.js and Motion.js)
export const GESTURE = {
  // finger reach = (fingertip -> wrist) / (knuckle -> wrist), averaged over
  // the four long fingers. Open hand ~1.9, fist ~1.0.
  fistClose: 1.32,      // below this the paw closes (grab)
  fistOpen: 1.55,       // above this it opens again (drop)
  stableFrames: 2,      // camera frames a new open/closed state must last
  lostMs: 350,          // a hand missing for longer than this is gone
  dropLostMs: 700,      // a paw that holds something drops it after this
  smoothMinCutoff: 1.6, // One-Euro filter (paw position smoothing)
  smoothBeta: 0.012,
  clapDist: 150,        // px between both paws = a clap
  clapApart: 250,       // ... after having been at least this far apart
  clapWindow: 1000,     // ms
  clapCooldown: 700,
  tapWindow: 900,       // two closings of the paw on the egg = crack
  whiskAmp: 38,         // px of swing between two direction changes
  stirMinR: 22,         // stirring counts between these distances (px)
  stirMaxR: 175,        //   from the middle of the bowl / cake
  dwell: 1.0,           // s a paw must hover over a menu button to press it
};

// Where things are in the factory (logical pixels)
export const LAYOUT = {
  hudH: 64,
  belt: { y: 214, itemY: 178, x0: -70, x1: W + 70 },
  hopper: { x: 1190, y: 40 },
  capy: { x: 178, y: 410 },
  counterY: 500,
  bowl: { x: 560, y: 452, r: 110 },
  tin: { x: 800, y: 470, r: 105 },
  oven: { x: 960, y: 278, w: 260, h: 222 },
  binX: -40,
  bar: { y: 606, h: 114 },
};

// Difficulty levels
export const DIFFICULTY = {
  easy: {
    id: 'easy', name: 'Baby Capy', stars: 1,
    blurb: ['Slow belt', 'Short recipes', 'No penalties', 'Lots of hints'],
    beltSpeed: 80, spawnEvery: 1.75, needChance: 0.55, otherRecipeChance: 0.2, guaranteeGap: 3.2,
    grabRadius: 95, sticky: true, penalty: 0, orders: 3, maxTier: 1, secPerStep: 16,
    whisk: 7, stir: 1.5, shake: 6, frost: 1.2, bakeTime: 6, window: [0.55, 0.97], hints: 2,
  },
  normal: {
    id: 'normal', name: 'Chef Capy', stars: 2,
    blurb: ['Normal belt', 'More recipes', 'Small penalties', 'Some hints'],
    beltSpeed: 125, spawnEvery: 1.35, needChance: 0.42, otherRecipeChance: 0.25, guaranteeGap: 5,
    grabRadius: 82, sticky: true, penalty: 25, orders: 4, maxTier: 2, secPerStep: 11,
    whisk: 9, stir: 2.5, shake: 8, frost: 1.8, bakeTime: 5, window: [0.66, 0.92], hints: 1,
  },
  hard: {
    id: 'hard', name: 'Master Capy', stars: 3,
    blurb: ['Fast belt', 'All recipes', 'Big penalties', 'No hints'],
    beltSpeed: 180, spawnEvery: 1.0, needChance: 0.32, otherRecipeChance: 0.3, guaranteeGap: 6.5,
    grabRadius: 72, sticky: false, penalty: 50, orders: 5, maxTier: 3, secPerStep: 8,
    whisk: 11, stir: 3, shake: 10, frost: 2, bakeTime: 4.5, window: [0.72, 0.88], hints: 0,
  },
};

export const SCORE = {
  add: 100,          // right ingredient, right moment
  move: 100,         // a move (crack, whisk, stir, ...) done
  bakePerfect: 300,
  bakeRaw: 100,
  bakeDark: 150,
  bakeBurnt: 40,
  order: 250,        // cake finished
  perSecondLeft: 8,  // time bonus
  orange: 50,        // secret: a mandarin on the capybara's head
  comboEvery: 3,     // +0.5 multiplier every 3 good steps in a row
  comboMax: 3,
};

// Bake gauge: past this fraction of the bake time the cake burns by itself
export const BAKE_AUTO_OUT = 1.3;
