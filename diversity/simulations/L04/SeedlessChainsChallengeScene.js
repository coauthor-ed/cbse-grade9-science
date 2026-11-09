import { SlotBoardScene } from 'simulations/base/kit/SlotBoardScene.js';
import { noFaces } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';
import { gameInk } from '../L03/BioStage.js';

// blk-l04-s07: three seedless plants, each with a chain feature -> what it does,
// the limit it still has, and (for the fern) one tempting claim to keep or reject.
// Moss and fern keep the need for water to reproduce; transport tissue never ends it.
const FEATURE = [['thallus', 'Thallus in water'], ['rhizoids', 'Rhizoids'], ['vascular', 'Xylem and phloem']];
const FUNCTION = [
  ['exchange', 'Exchange at the surface'], ['attachment', 'Holds it to a surface'],
  ['supply', 'Carries water and food'], ['independent', 'Reproduces without water'],
];
const LIMIT = [
  ['no-vascular', 'Cannot live on land'], ['water', 'Needs water to reproduce'],
  ['no-water', 'Needs no water to reproduce'],
];
const WHY_FUNCTION = { independent: 'None of these three reproduces without water. Read its plant again.' };
const WHY_LIMIT = { 'no-water': 'Read the plant again: moss and fern need water to reproduce.' };

const plant = (id, name, art, tone, facts, answers, cites) => ({
  id, name, art, tone, facts,
  rows: [
    { id: 'chain', label: 'What its feature does', join: '→', slots: [
      { id: 'feature', ask: 'Feature', options: FEATURE, answer: answers.feature, cite: [cites.feature],
        prompt: 'Which feature does this plant show?' },
      { id: 'function', ask: 'Job', options: FUNCTION, answer: answers.function, cite: [cites.function],
        prompt: 'What does that feature do?', why: WHY_FUNCTION },
    ] },
    { id: 'limit', label: 'The problem that remains', slots: [
      { id: 'limit', ask: 'Problem', options: LIMIT, answer: answers.limit, cite: [cites.limit],
        prompt: 'What problem remains for this plant?', why: WHY_LIMIT },
    ] },
  ],
});

const spirogyra = plant('spirogyra', 'Spirogyra', 'spirogyra', 3,
  ['Thallus in water', 'Exchange at the surface', 'Cannot live on land'],
  { feature: 'thallus', function: 'exchange', limit: 'no-vascular' }, { feature: 0, function: 1, limit: 2 });
const moss = plant('moss', 'Moss', 'moss', 8,
  ['Rhizoids', 'Holds it to a surface', 'Needs water to reproduce'],
  { feature: 'rhizoids', function: 'attachment', limit: 'water' }, { feature: 0, function: 1, limit: 2 });
const fern = plant('fern', 'Fern', 'fern', 1,
  ['Xylem and phloem', 'Carries water and food', 'Needs water to reproduce'],
  { feature: 'vascular', function: 'supply', limit: 'water' }, { feature: 0, function: 1, limit: 2 });
fern.rows.push({ id: 'claim', label: 'Keep this line or reject it?', slots: [
  { id: 'claim', ask: 'Line', prompt: 'Xylem and phloem let the fern reproduce without water. Keep or reject?',
    options: [['keep', 'Keep it'], ['reject', 'Reject it']], answer: 'reject', cite: [2],
    why: { keep: 'Xylem and phloem carry water inside the body. The fern still needs water to reproduce.' } },
] });

export class SeedlessChainsChallengeScene extends SlotBoardScene {
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1500;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1200; static HEIGHT = 420; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); noFaces(this.root); gameInk(this.root); wideBoard(this); }
  static CONFIG = {
    ariaLabel: 'Three plants: link each feature to its job and to the problem that remains',
    titles: ['Three seedless plants', 'Build the chains'],
    lockFirstBeat: true,
    sections: [{ id: 'plants', cards: [spirogyra, moss, fern] }],
    text: {
      locked: 'Read the three plants. Next, you fill in the slots.',
      ready: 'Every slot filled? Press Check.',
      solvedHead: 'All three chains are right.',
      solved: 'Each feature matches its job, each problem remains, and the line about the fern is rejected.',
    },
  };
}
