// ---------------------------------------------------------------------------
// recipes.js - ingredients, things that do NOT belong in a cake, and recipes.
//
// A recipe is an ordered list of steps:
//   add <ingredient>   grab it on the belt and drop it in the bowl
//   crack              crack the egg on the bowl (clap, or tap it twice)
//   whisk              shake your paw left-right fast over the bowl
//   stir               draw circles over the bowl
//   pour               grab the bowl and drop it on the baking tin
//   bake               grab the tin, drop it in the oven, take it out on green
//   frost              draw circles over the baked cake (icing swirl)
//   sprinkle           shake your paw over the baked cake
//   top <ingredient>   grab it on the belt and drop it on the cake
// ---------------------------------------------------------------------------

export const INGREDIENTS = {
  flour:      { name: 'Flour',      color: '#fff7ea', batter: '#fbf1dc' },
  sugar:      { name: 'Sugar',      color: '#ffd1e6', batter: '#fff3f7' },
  egg:        { name: 'Egg',        color: '#ffe680', batter: '#ffe680' },
  butter:     { name: 'Butter',     color: '#ffe48a', batter: '#ffeaa0' },
  milk:       { name: 'Milk',       color: '#ffffff', batter: '#fffdf6' },
  chocolate:  { name: 'Chocolate',  color: '#7b4a2e', batter: '#8a5636' },
  strawberry: { name: 'Strawberry', color: '#ff5d73', batter: '#ff9fb0' },
  cherry:     { name: 'Cherry',     color: '#e8233f', batter: '#f06a7c' },
  lemon:      { name: 'Yuzu',       color: '#ffd83d', batter: '#fff08a' },
  honey:      { name: 'Honey',      color: '#ffb320', batter: '#ffcf63' },
};

// things that come down the belt but must never go in a cake
export const DISTRACTORS = {
  carrot:   { name: 'Carrot' },
  broccoli: { name: 'Broccoli' },
  fish:     { name: 'Fish' },
  sock:     { name: 'Sock' },
  chili:    { name: 'Chili' },
  duck:     { name: 'Rubber duck' },
  orange:   { name: 'Mandarin' },   // ...unless it goes on the capybara's head
};

export const MOVES = {
  crack:    { label: 'Crack',    hint: 'Clap your paws to crack the egg!' },
  whisk:    { label: 'Whisk',    hint: 'Shake your paw left-right over the bowl!' },
  stir:     { label: 'Stir',     hint: 'Draw big circles over the bowl!' },
  pour:     { label: 'Pour',     hint: 'Grab the bowl and drop it on the tin!' },
  bake:     { label: 'Bake',     hint: 'Put the tin in the oven, take it out on GREEN!' },
  frost:    { label: 'Frost',    hint: 'Draw circles over the cake to frost it!' },
  sprinkle: { label: 'Sprinkle', hint: 'Shake your paw over the cake!' },
};

const add = (kind) => ({ type: 'add', kind });
const top = (kind) => ({ type: 'top', kind });
const mv = (type) => ({ type });

export const RECIPES = [
  {
    id: 'cupcakes', name: 'Vanilla Cupcakes', tier: 1, tin: 'cupcake', frosting: '#ffb3d1',
    steps: [add('flour'), add('sugar'), add('egg'), mv('crack'), add('butter'), mv('stir'), mv('pour'), mv('bake'), mv('frost')],
  },
  {
    id: 'cookies', name: 'Choco Chip Biscuits', tier: 1, tin: 'cookie',
    steps: [add('butter'), add('sugar'), mv('stir'), add('egg'), mv('crack'), add('flour'), add('chocolate'), mv('stir'), mv('pour'), mv('bake')],
  },
  {
    id: 'muffins', name: 'Yuzu Muffins', tier: 1, tin: 'cupcake', frosting: '#fff2a8',
    steps: [add('flour'), add('milk'), add('egg'), mv('crack'), add('lemon'), mv('whisk'), mv('pour'), mv('bake'), mv('sprinkle')],
  },
  {
    id: 'strawberry', name: 'Strawberry Cake', tier: 2, tin: 'cake', frosting: '#ffd6e4',
    steps: [add('egg'), mv('crack'), add('egg'), mv('crack'), add('sugar'), mv('whisk'), add('flour'), add('butter'), mv('stir'), mv('pour'), mv('bake'), mv('frost'), top('strawberry')],
  },
  {
    id: 'chocolate', name: 'Chocolate Cake', tier: 2, tin: 'cake', frosting: '#6b3b22',
    steps: [add('flour'), add('chocolate'), add('sugar'), add('egg'), mv('crack'), add('milk'), mv('whisk'), mv('stir'), mv('pour'), mv('bake'), mv('frost'), top('cherry')],
  },
  {
    id: 'honey', name: 'Capy Honey Cake', tier: 3, tin: 'cake', frosting: '#ffe0a3',
    steps: [add('butter'), add('honey'), mv('stir'), add('egg'), mv('crack'), add('egg'), mv('crack'), add('flour'), add('milk'), mv('whisk'), mv('pour'), mv('bake'), mv('sprinkle'), top('cherry')],
  },
];

// The training recipe: one of every move, slow and without penalties
export const TUTORIAL_RECIPE = {
  id: 'tutorial', name: 'Practice Cupcake', tier: 0, tin: 'cupcake', frosting: '#c9b6ff',
  steps: [add('flour'), add('egg'), mv('crack'), mv('whisk'), mv('stir'), mv('pour'), mv('bake'), mv('frost')],
};

export function isIngredient(kind) {
  return kind in INGREDIENTS;
}

export function itemName(kind) {
  return (INGREDIENTS[kind] ?? DISTRACTORS[kind])?.name ?? kind;
}

export function stepLabel(step) {
  if (step.type === 'add') return itemName(step.kind);
  if (step.type === 'top') return itemName(step.kind);
  return MOVES[step.type]?.label ?? step.type;
}

export function stepHint(step) {
  if (step.type === 'add') return `Grab the ${itemName(step.kind).toUpperCase()} and drop it in the bowl!`;
  if (step.type === 'top') return `Grab a ${itemName(step.kind).toUpperCase()} and put it on the cake!`;
  return MOVES[step.type]?.hint ?? '';
}

/**
 * Pick the orders for one game: `count` recipes up to `maxTier`, harder
 * ones later, no recipe twice in a row. `rnd` is a 0..1 random function.
 */
export function pickOrders(count, maxTier, rnd = Math.random) {
  const pool = RECIPES.filter((r) => r.tier <= maxTier);
  const out = [];
  let last = null;
  for (let i = 0; i < count; i++) {
    // the first order of a game is always an easy one
    const choices = pool.filter((r) => r !== last && (i > 0 || r.tier === 1));
    const pick = choices[Math.floor(rnd() * choices.length)] ?? pool[0];
    out.push(pick);
    last = pick;
  }
  return out;
}
