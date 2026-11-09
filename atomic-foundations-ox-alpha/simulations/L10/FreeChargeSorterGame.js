import { SortBoard } from '../shared/GameFrame.js';

/**
 * FreeChargeSorterGame - mini-game for les-10, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). The lesson's claim is the three-state rule: ions held
 * in a solid leave the bulb dark, ions free to move light it, and a substance
 * with no ions leaves it dark too.
 *
 * The wrong attractor is "if it dissolves, it conducts", which would put sugar
 * water with salt water. Sugar dissolves into molecules, not ions.
 */

const SAMPLES = [
  { id: 'salt-water',  name: 'Salt water',              bin: 'lit'   },
  { id: 'molten-salt', name: 'Molten salt',             bin: 'lit'   },
  { id: 'cuso4-water', name: 'Copper sulfate in water', bin: 'lit'   },
  { id: 'dry-salt',    name: 'Dry salt crystal',        bin: 'dark'  },
  { id: 'cuso4-solid', name: 'Solid copper sulfate',    bin: 'dark'  },
  { id: 'sugar-water', name: 'Sugar water',             bin: 'never' },
  { id: 'sugar-solid', name: 'Solid sugar',             bin: 'never' },
  { id: 'naphthalene', name: 'Naphthalene',             bin: 'never' },
  { id: 'camphor',     name: 'Camphor',                 bin: 'never' },
];

const CSS = `
.fc { --cols: 3; --cols-p: 3; }
.fc .card { min-height: 84px; font-size: 15px; font-weight: 800; line-height: 1.2; }
.sim-dom-root--portrait .fc .card { min-height: 66px; font-size: 14px; }
`;

export class FreeChargeSorterGame extends SortBoard {
  static simId = 'free-charge-sorter-game';
  static label = { en: 'Three States of the Bulb' };
  static category = 'science.electricity';
  static ARIA_LABEL =
    'Nine sample cards. Tap a card, then a bin: ions free to move, ions held in place, or no ions at all.';
  static OBJECTIVE = {
    prompt: { en: 'Sort each sample: ions free to move, ions held in place, or no ions at all.' },
  };
  static KEY = 'fc';
  static HEAD = {
    kicker: 'Three states of the bulb',
    title: 'Sort by <b>whether ions can move</b>.',
    sub: 'Tap a sample, then a bin. Does it have ions, and can they move?',
  };
  static CARDS = SAMPLES.map((s) => ({ id: s.id, chip: s.name, aria: s.name, answer: s.bin, html: s.name }));
  static BINS = [
    { id: 'lit',   label: 'Ions free to move: bulb lights' },
    { id: 'dark',  label: 'Ions held in place: bulb dark' },
    { id: 'never', label: 'No ions at all: bulb dark' },
  ];
  static LINE = 'Ask two things: are there ions, and can they move?';
  static CSS = CSS;

  wrongHint(card) {
    return `Check "${card.chip}" again. First ask if it has ions at all. Then ask if they are free to move.`;
  }
}
