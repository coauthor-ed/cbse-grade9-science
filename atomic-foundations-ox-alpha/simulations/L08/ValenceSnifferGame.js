import { SortBoard } from '../shared/GameFrame.js';

/**
 * ValenceSnifferGame - mini-game for les-08, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). The lesson's claim is that the OUTER shell decides:
 * few electrons in it makes a metal, nearly full makes a non-metal, and exactly
 * full makes a noble gas. The student sorts nine atoms into those three bins.
 *
 * The wrong attractor is "count the TOTAL number of electrons", which would say
 * O (8) is like Ne (10). The card shows the outer shell, not the total.
 */

const ATOMS = [
  { name: 'Magnesium', symbol: 'Mg', Z: 12 },
  { name: 'Helium',    symbol: 'He', Z: 2  },
  { name: 'Lithium',   symbol: 'Li', Z: 3  },
  { name: 'Oxygen',    symbol: 'O',  Z: 8  },
  { name: 'Fluorine',  symbol: 'F',  Z: 9  },
  { name: 'Neon',      symbol: 'Ne', Z: 10 },
  { name: 'Sodium',    symbol: 'Na', Z: 11 },
  { name: 'Chlorine',  symbol: 'Cl', Z: 17 },
  { name: 'Argon',     symbol: 'Ar', Z: 18 },
];

/** Outer-shell electron count using the lesson's 2, 8, 8 limit. */
function outerElectrons(Z) {
  if (Z <= 2)  return { n: 1, cap: 2, count: Z };
  if (Z <= 10) return { n: 2, cap: 8, count: Z - 2 };
  if (Z <= 18) return { n: 3, cap: 8, count: Z - 10 };
  return { n: 4, cap: 8, count: Z - 18 };
}

function categoryFor(Z) {
  const o = outerElectrons(Z);
  if (o.count === o.cap) return 'noble';
  if (o.count < 4) return 'metal';
  return 'nonmetal';
}

const CSS = `
.vs { --cols: 3; --cols-p: 3; }
.vs .card { min-height: 88px; }
.vs .outer { font-size: 14px; color: var(--sim-label-muted); line-height: 1.2; }
.vs .outer b { color: var(--sim-label); }
.sim-dom-root--portrait .vs .bins { flex-direction: row; gap: 6px; }
.sim-dom-root--portrait .vs .bin { flex: 1 1 0; min-width: 0; padding: 6px 8px; min-height: 70px; }
.sim-dom-root--portrait .vs .bin-top { flex-wrap: wrap; gap: 0 6px; }
`;

export class ValenceSnifferGame extends SortBoard {
  static simId = 'valence-sniffer-game';
  static label = { en: 'Sniff the Valence' };
  static category = 'science.chemistry';
  static ARIA_LABEL =
    'Nine atom cards. Tap a card, then the bin that matches its outer shell: metal, non-metal or noble gas.';
  static OBJECTIVE = {
    prompt: { en: 'Few electrons in the outer shell: a metal. Nearly full: a non-metal. Exactly full: a noble gas. Sort the nine atoms.' },
  };
  static KEY = 'vs';
  static HEAD = {
    kicker: 'How salt forms',
    title: 'Sort by the <b>outer shell</b>, not the total.',
    sub: 'Tap a card, then tap a bin. Tap a placed card to take it back.',
  };
  static CARDS = ATOMS.map((a) => {
    const o = outerElectrons(a.Z);
    return {
      id: a.symbol,
      chip: a.symbol,
      aria: `${a.name}: ${o.count} of ${o.cap} in the outer shell`,
      answer: categoryFor(a.Z),
      html: `<div class="big">${a.symbol}</div><div class="small">${a.name}</div><div class="outer">outer <b>${o.count}</b> of ${o.cap}</div>`,
    };
  });
  static BINS = [
    { id: 'metal',    label: 'Metal' },
    { id: 'nonmetal', label: 'Non-metal' },
    { id: 'noble',    label: 'Noble gas' },
  ];
  static LINE = 'Look at the outer number, not the size of the atom.';
  static CSS = CSS;

  wrongHint(_, wrong) {
    const syms = wrong.map((c) => c.chip).slice(0, 3).join(', ');
    return `Check the outer number for ${syms}. A full shell means a noble gas, nearly full means a non-metal, and only a few electrons means a metal.`;
  }
}
