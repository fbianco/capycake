// ---------------------------------------------------------------------------
// outfits.js - what the capybara chef can wear (chosen at the start).
// ---------------------------------------------------------------------------

export const HATS = [
  { id: 'chef', name: 'Chef hat' },
  { id: 'bow', name: 'Pink bow' },
  { id: 'flowers', name: 'Flower crown' },
  { id: 'strawberry', name: 'Berry beanie' },
  { id: 'party', name: 'Party hat' },
  { id: 'yuzu', name: 'Yuzu' },
  { id: 'crown', name: 'Crown' },
  { id: 'none', name: 'Just me' },
];

export const APRONS = [
  { id: 'pink', name: 'Pink', color: '#ff8fbf', dark: '#e2669f' },
  { id: 'mint', name: 'Mint', color: '#7fe0c0', dark: '#4fbf9c' },
  { id: 'sky', name: 'Sky', color: '#8fc8ff', dark: '#5f9fe0' },
  { id: 'lemon', name: 'Lemon', color: '#ffe27a', dark: '#e8bf3f' },
  { id: 'lilac', name: 'Lilac', color: '#c4a6ff', dark: '#9b7be0' },
];

export const DEFAULT_OUTFIT = { hat: 'chef', apron: 'pink' };

export function apronById(id) {
  return APRONS.find((a) => a.id === id) ?? APRONS[0];
}
