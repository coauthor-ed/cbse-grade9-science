import { ArcadeMatchScene } from 'simulations/base/kit/ArcadeMatchScene.js';

// Every method in the module against the difference it uses, plus one mixture no physical method parts.
// The pairs live here, because they follow the words of lesson 9.
const PAIRS = [
  { prompt: 'Crystallization', answer: 'Solubility', group: 'heat', why: 'the solution holds less as it cools, so the solid comes out' },
  { prompt: 'Dissolving salt out of sand', answer: 'Solubility', group: 'solid', why: 'salt dissolves in water and sand does not' },
  { prompt: 'Distillation', answer: 'Boiling point', group: 'heat', why: 'the liquid with the lower boiling point comes over first' },
  { prompt: 'Sublimation', answer: 'Only one part sublimes', group: 'solid', why: 'camphor turns to vapour, and sand stays in the dish' },
  { prompt: 'A separating funnel', answer: 'Density', group: 'spin', why: 'the denser liquid forms the lower layer and leaves first' },
  { prompt: 'Centrifugation', answer: 'Density', group: 'spin', why: 'spinning makes the denser part move outwards much faster' },
  { prompt: 'Settling', answer: 'Density', group: 'spin', why: 'parts denser than water sink, given time' },
  { prompt: 'Filtration', answer: 'Size', group: 'solid', why: 'the paper stops what is larger than its gaps' },
  { prompt: 'Paper chromatography', answer: 'How far it travels on paper', group: 'heat', why: 'each dye travels its own distance up the strip' },
  { prompt: 'A magnet', answer: 'Magnetism', group: 'solid', why: 'iron comes up and the rest stays behind' },
  { prompt: 'Brass, an alloy', answer: 'No physical method works', group: 'spin', myth: true, why: 'its metals are mixed evenly, with no separate parts' },
];

export class LeverMatchScene extends ArcadeMatchScene {
  static ARIA_LABEL = 'What goes with what: a method drifts past. Tap the bubble that names the difference it uses. One card is brass, which no physical method can separate.';
  static CONFIG = {
    pairs: PAIRS,
    title: 'What goes with what',
    ask: 'Tap the difference it uses',
    skin: 'bubbles',
    rounds: 11,
  };
}
