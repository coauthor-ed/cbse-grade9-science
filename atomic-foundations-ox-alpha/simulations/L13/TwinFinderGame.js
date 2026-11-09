import { SortBoard } from '../shared/GameFrame.js';

/**
 * TwinFinderGame - mini-game for les-13, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). The lesson's distinction is two-fold:
 *   ISOTOPES : same Z, different A   (one element)
 *   ISOBARS  : same A, different Z   (different elements at the same mass)
 *
 * Five atoms: C-12 and C-14 are isotopes, O-16 and O-18 are isotopes, and N-14
 * is an isobar of C-14. C-14 already sits with carbon, so the third group holds
 * one card, and its label says what that card is.
 *
 * The wrong attractor is "same A means isotopes". C-14 and N-14 have the same A
 * but they are different elements.
 */

const ATOMS = [
  { id: 'C12', label: 'C-12', Z: 6, A: 12, family: 'C' },
  { id: 'C14', label: 'C-14', Z: 6, A: 14, family: 'C' },
  { id: 'N14', label: 'N-14', Z: 7, A: 14, family: 'isobar' },
  { id: 'O16', label: 'O-16', Z: 8, A: 16, family: 'O' },
  { id: 'O18', label: 'O-18', Z: 8, A: 18, family: 'O' },
];

const CSS = `
.tf { --cols: 5; --cols-p: 5; }
.tf .board { display: flex; flex-direction: column; gap: 12px; }
.tf .tray, .tf .bins { width: 100%; }
.tf .card { min-height: 92px; }
.tf .bins { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; overflow: visible; }
.tf .bin { min-height: 104px; }
.tf .rule { font-size: 15px; color: var(--sim-label-muted); margin: 0; }
.tf .rule b { color: var(--sim-label); }
.sim-dom-root--portrait .tf .card { padding: 6px 2px; min-height: 84px; }
.sim-dom-root--portrait .tf .big { font-size: 18px; }
.sim-dom-root--portrait .tf .bins { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .tf .bin { min-height: 56px; }
`;

export class TwinFinderGame extends SortBoard {
  static simId = 'twin-finder-game';
  static label = { en: 'Isotopes and Isobars' };
  static category = 'science.chemistry';
  static ARIA_LABEL =
    'Five atom cards. Sort them: isotopes of carbon, isotopes of oxygen, or the isobar of carbon-14.';
  static OBJECTIVE = {
    prompt: { en: 'Five atoms. Group the isotopes of carbon and of oxygen, and find the isobar of C-14.' },
  };
  static KEY = 'tf';
  static HEAD = {
    kicker: 'Count the protons',
    title: 'Find the <b>isotopes and the isobar</b>.',
    sub: 'Tap a card, then a bin. Isotopes have the same Z. Isobars have the same A.',
  };
  static CARDS = ATOMS.map((a) => ({
    id: a.id,
    chip: a.label,
    aria: `${a.label}, Z=${a.Z}, A=${a.A}`,
    answer: a.family,
    html: `<div class="big">${a.label}</div><div class="small">Z=${a.Z}</div><div class="small">A=${a.A}</div>`,
  }));
  static BINS = [
    { id: 'C',      label: 'Isotopes of carbon' },
    { id: 'O',      label: 'Isotopes of oxygen' },
    { id: 'isobar', label: 'Isobar of C-14: same A, different element' },
  ];
  static LINE = 'Same Z means isotopes. Same A means isobars.';
  static CSS = CSS;

  wrongHint(card) {
    return `Check ${card.chip} again. Same Z means isotopes. Same A with a different Z means isobars.`;
  }
}
