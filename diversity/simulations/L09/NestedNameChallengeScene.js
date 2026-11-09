import { SlotBoardScene, escapeHtml } from 'simulations/base/kit/SlotBoardScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { gameInk } from '../L03/BioStage.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l09-s07: beat 1 builds ONE nested address for the tiger and the lion (each
// level sits inside the one above it; both species hang from the single genus
// Panthera, so the genus can only have one family parent). Beat 2 adds the two
// full species names and how to write them (print: italic; handwriting: underline
// each word separately; genus capital, species name lower case).
// The undo glyphs are missing from the phone font, so the two round buttons carry words.
const MORE = `.ek-mini { width: auto; min-width: 44px; height: 38px; padding: 0 10px; border-radius: var(--look-pill, 19px); font-size: 0 !important; }
.ek-mini::before { content: 'Undo'; font: 800 14px/1 var(--sim-font); color: var(--sim-label); }
.ek-mini[aria-label^="Back"]::before { content: 'Start again'; }
.sb-rlabel { width: auto; min-width: 60px; flex: none; }
/* The ladder reads as one object: levels in a column, each indented inside the one above, the chips beside them at 1280. */
.sb-card:has([aria-label^="Level"]) .sb-row.sb-inline .sb-rlabel { min-width: 24px; width: 24px; padding-top: 10px; text-align: right; }
.sb-row.sb-inline .sb-chain { flex-wrap: nowrap; }
.sb-row.sb-inline .sb-step { flex: 1 1 0; min-width: 0; }
.sb-row.sb-inline .sb-slot { width: 100%; justify-content: center; }
.wb-auto .sb-sect:has([aria-label^="Level"]) { display: block; }
.wb-auto .sb-sect:has(.sb-preview) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.wb-auto .sb-card:has([aria-label^="Level"]) { padding-right: calc(50% + 16px); gap: 0; }
.wb-auto .sb-card:has([aria-label^="Level"]) .sb-row.sb-inline { padding-top: 4px; margin-left: calc(var(--d, 0) * 14px); }
.wb-auto .sb-card:has([aria-label^="Level"]) .sb-slot { min-height: 40px; }
.wb-auto .sb-card:has([aria-label^="Level"]) .sb-picker { display: flex; position: absolute; top: 58px; right: 14px; width: calc(50% - 12px); margin: 0; padding: 0; border: none; }
.wb-auto .sb-card:has([aria-label^="Level"]) .sb-chips { grid-template-columns: repeat(2, minmax(0, 1fr)); }
` + NO_FACES_CSS;
const GROUPS = [
  ['kingdom', 'Kingdom: Animalia', 1], ['phylum', 'Phylum: Chordata', 2], ['subphylum', 'Sub-phylum: Vertebrata', 3],
  ['class', 'Class: Mammalia', 4], ['order', 'Order: Carnivora', 5], ['family', 'Family: Felidae', 6],
  ['genus', 'Genus: Panthera', 7], ['sp-tiger', 'Species: Panthera tigris', 8], ['sp-lion', 'Species: Panthera leo', 8],
];
// Shuffled for display: the order of the chips must not give the answer away.
const OPTIONS = ['family', 'kingdom', 'sp-tiger', 'class', 'order', 'phylum', 'sp-lion', 'subphylum', 'genus']
  .map(id => GROUPS.find(g => g[0] === id).slice(0, 2));
const DEPTH = Object.fromEntries(GROUPS.map(g => [g[0], g[2]]));

const level = (id, depth) => ({
  id: `r${depth}`, ask: '?', aria: `Level ${depth}`, options: OPTIONS, answer: id, bank: 'groups',
  prompt: depth === 1 ? 'Which group is the biggest, the one that holds all the others?' : 'Which group sits directly inside the level above?',
  why: (pick) => {
    const d = DEPTH[pick];
    if (d < depth) return 'That group is bigger than this level needs. It belongs higher up.';
    return 'That group is smaller. Each level sits inside the one above it, so it belongs lower down.';
  },
});
const speciesWhy = (mine) => (pick) => {
  if (DEPTH[pick] === 8) return `That is the ${mine === 'sp-tiger' ? 'lion' : 'tiger'}'s species name. Check whose slot this is.`;
  return 'A species is the smallest level. Its slot needs a species name.';
};
const ladder = {
  id: 'address', name: 'One address for both', tone: 6, arts: [{ art: 'tiger', tone: 8 }, { art: 'lion', tone: 2 }],
  hint: 'Level 1 is the biggest group. Each level sits inside the one above it.',
  rows: [
    ...['kingdom', 'phylum', 'subphylum', 'class', 'order', 'family', 'genus'].map((id, n) => ({
      id: `row${n + 1}`, label: `${n + 1}`, inline: true, depth: n, slots: [level(id, n + 1)],
    })),
    { id: 'row8', label: '8', inline: true, depth: 7, slots: [
      { id: 'tiger', ask: 'Tiger', art: 'tiger', tone: 8, options: OPTIONS, answer: 'sp-tiger', bank: 'groups',
        prompt: 'Which species name belongs to the tiger?', why: speciesWhy('sp-tiger') },
      { id: 'lion', ask: 'Lion', art: 'lion', tone: 2, options: OPTIONS, answer: 'sp-lion', bank: 'groups',
        prompt: 'Which species name belongs to the lion?', why: speciesWhy('sp-lion') },
    ] },
  ],
};

const words = (get, key, a, b) => [get(`${key}/${a}`), get(`${key}/${b}`)].map(w => escapeHtml(w || '…'));
const preview = (key, a, b) => (get) => {
  const [g, e] = words(get, key, a, b);
  const mode = get('fmt/mode');
  if (mode === 'hand') {
    return get('fmt/under') === 'joined'
      ? `<span class="sb-ul-join">${g} ${e}</span>`
      : `<span class="sb-ul">${g}</span> <span class="sb-ul">${e}</span>`;
  }
  return `<span class="sb-it">${g} ${e}</span>`;
};
const format = {
  id: 'fmt', name: 'How will you write it?', tone: 6, minBeat: 1,
  hint: 'In print, italicise both words. In handwriting, underline each word separately.',
  rows: [
    { id: 'mode', label: 'Writing', inline: true, slots: [
      { id: 'mode', ask: 'Print or handwriting?', options: [['print', 'Print'], ['hand', 'Handwriting']],
        answer: ['print', 'hand'], initial: 'print', prompt: 'Are you typing or writing by hand?' },
    ] },
    { id: 'under', label: 'Line', inline: true, showIf: (get) => get('fmt/mode') === 'hand', slots: [
      { id: 'under', ask: 'Underline', options: [['separate', 'Each word on its own'], ['joined', 'One line under both']],
        answer: 'separate', initial: 'separate', prompt: 'How do you underline a handwritten species name?',
        why: { joined: 'Underline each word on its own. One long line would blur the two words into one.' } },
    ] },
  ],
};
const named = (id, name, art, tone, genusWord, epithet, wrongEpithet) => ({
  id, name: `${name}: full name`, art, tone, minBeat: 1, preview: preview(id, 'genus', 'epithet'),
  rows: [{ id: 'name', label: 'Name', inline: true, slots: [
    { id: 'genus', ask: 'Genus word', options: [['panthera', 'panthera'], ['Panthera', 'Panthera']], answer: 'Panthera',
      prompt: 'The genus word starts with a capital letter.', why: { panthera: 'The genus word starts with a capital letter.' } },
    { id: 'epithet', ask: 'Species name', options: [[wrongEpithet, wrongEpithet], [epithet, epithet]], answer: epithet,
      prompt: 'The second word stays in small letters.', why: { [wrongEpithet]: 'The species name is written in small letters, even at the start of a name.' } },
  ] }],
});

const RUNG_KEYS = [1, 2, 3, 4, 5, 6, 7].map((n) => `address/r${n}`).concat('address/tiger', 'address/lion');

export class NestedNameChallengeScene extends SlotBoardScene {
  static ARIA_LABEL = 'Build one nested address for the tiger and the lion, then write both scientific names.';
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1800;
  static WIDTH = 1200; static HEIGHT = 420; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(MORE); gameInk(this.root); wideBoard(this); }
  // At 1280 the chips stay open beside the ladder, on the first empty level, so ladder and chips are read together.
  _render() {
    if (!this._isPortrait && !this.active && !this.result && !this._locked?.()) {
      const k = RUNG_KEYS.find((key) => this.vals?.[key] == null);
      if (k) this.active = k;
    }
    super._render();
  }
  static CONFIG = {
    ariaLabel: 'Build one nested address for the tiger and the lion, then write both species names',
    titles: ['Build the address', 'Address and names'],
    noPips: true,
    sections: [
      { id: 'address', cards: [ladder] },
      { id: 'names', title: 'Now the names', cards: [format, named('tiger', 'Tiger', 'tiger', 8, 'Panthera', 'tigris', 'Tigris'), named('lion', 'Lion', 'lion', 2, 'Panthera', 'leo', 'Leo')] },
    ],
    text: {
      ready: ['Every level filled? Check the address.', 'Address and names ready? Check them together.'],
      solvedHead: ['The address holds!', 'Address and names all hold!'],
      solved: ['Both species hang from one genus, inside one family, and every level sits inside the one above.', 'Both species share one address, and both names follow every rule.'],
    },
  };
}
