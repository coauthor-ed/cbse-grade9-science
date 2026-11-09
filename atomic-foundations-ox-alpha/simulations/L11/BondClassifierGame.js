import { SortBoard, formula } from '../shared/GameFrame.js';

/**
 * BondClassifierGame - mini-game for les-11, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). The lesson's claim is the share or transfer
 * distinction: a metal with a non-metal forms ions, and non-metals alone share
 * electrons. The student classifies eight substances as ionic or covalent.
 *
 * The wrong attractor is judging by how a formula looks. The deciding question
 * is whether one of the elements is a metal.
 */

const ITEMS = [
  { id: 'NaCl', name: 'sodium chloride',   bond: 'ionic'    },
  { id: 'MgO',  name: 'magnesium oxide',   bond: 'ionic'    },
  { id: 'CaF2', name: 'calcium fluoride',  bond: 'ionic'    },
  { id: 'KBr',  name: 'potassium bromide', bond: 'ionic'    },
  { id: 'H2O',  name: 'water',             bond: 'covalent' },
  { id: 'CH4',  name: 'methane',           bond: 'covalent' },
  { id: 'CO2',  name: 'carbon dioxide',    bond: 'covalent' },
  { id: 'NH3',  name: 'ammonia',           bond: 'covalent' },
];

const CSS = `
.bc2 { --cols: 4; --cols-p: 4; }
.bc2 .card { min-height: 100px; }
.sim-dom-root--portrait .bc2 .card { min-height: 92px; padding: 6px 2px; }
.sim-dom-root--portrait .bc2 .big { font-size: 19px; }
.bc2 .bin { min-height: 100px; }
.sim-dom-root--portrait .bc2 .bin { min-height: 62px; }
`;

export class BondClassifierGame extends SortBoard {
  static simId = 'bond-classifier-game';
  static label = { en: 'Give or Share?' };
  static category = 'science.chemistry';
  static ARIA_LABEL =
    'Eight chemical formulae. Tap a card, then a bin: ionic (electrons move) or covalent (electrons are shared).';
  static OBJECTIVE = {
    prompt: { en: 'For each formula, decide: ionic or covalent? Look for a metal.' },
  };
  static KEY = 'bc2';
  static HEAD = {
    kicker: 'Ionic or covalent',
    title: 'Did electrons <b>move</b>, or are they <b>shared</b>?',
    sub: 'Tap a formula, then a bin. A metal with a non-metal forms ions. Non-metals alone share electrons.',
  };
  static CARDS = ITEMS.map((it) => ({
    id: it.id,
    chip: formula(it.id),
    aria: `${it.id}, ${it.name}`,
    answer: it.bond,
    html: `<div class="big">${formula(it.id)}</div><div class="small">${it.name}</div>`,
  }));
  static BINS = [
    { id: 'ionic',    label: 'Ionic: electrons move from one atom to another' },
    { id: 'covalent', label: 'Covalent: the atoms share electrons' },
  ];
  static LINE = 'A metal with a non-metal: ions. Only non-metals: shared pairs.';
  static CSS = CSS;

  wrongHint(card) {
    return `Check ${card.id} again. Is one of its elements a metal? Look at the elements, not the length of the formula.`;
  }
}
