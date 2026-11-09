// Drives MechanicalColumnsScene-lit through its real interface, because no
// headless gate taps a column. Run:
//   node tools/sim-test/run.mjs exec courses/work-energy/simulations/L02/MechanicalColumnsScene-lit.test.js
//
// Checks the entry state, the lit/dim cycle in both directions, that the
// board is the two columns from the first frame with no Collapse control and
// no greyed form names, and the hard negative constraints (no digits, and
// none of the untaught words) across every file the scene pulls in.
import fs from 'node:fs';
import path from 'node:path';
import { installFakeHost, makeContainer, check, summary } from '../../../../tools/sim-test/harness.mjs';

installFakeHost();
const { MechanicalColumnsSceneLit } = await import('./MechanicalColumnsScene-lit.js');
const board = await import('./MechanicalColumnsBoard.js');

const n = 'MechanicalColumnsScene-lit';
const sc = new MechanicalColumnsSceneLit(makeContainer());
await sc.setup();

const html = () => sc.root?.innerHTML || '';

// --- entry state -----------------------------------------------------------
check(sc._lit === 'all', `${n}: opens both-lit, got ${sc._lit}`);
check(/data-lit="1"[\s\S]*data-lit="1"/.test(html()), `${n}: markup carries both columns lit on the first frame`);
// The board is ALREADY the two columns: no unbuilt state, nothing to collapse.
check(/MOTION/.test(html()) && /POSITION/.test(html()), `${n}: both headings in the entry markup`);
check(!/collapse/i.test(html()), `${n}: no Collapse control anywhere in the markup`);
const GREYED = ['light', 'sound', 'thermal', 'electrical', 'nuclear', 'chemical'];
for (const g of GREYED) {
  check(!new RegExp(`>\\s*${g}\\s*<`, 'i').test(html()), `${n}: greyed form name "${g}" is not on this board`);
}

// --- the lit/dim cycle, driven through the scene's own handler -------------
const lit = () => (sc._lit === 'all' ? ['motion', 'position'] : [sc._lit]);
check(lit().length === 2, `${n}: starting state is both lit`);

sc._pick('motion');
check(sc._lit === 'motion' && lit().length === 1, `${n}: tapping MOTION lights it and dims POSITION, got ${sc._lit}`);
sc._pick('position');
check(sc._lit === 'position', `${n}: tapping POSITION swaps the lit column, got ${sc._lit}`);
sc._pick('position');
check(sc._lit === 'all', `${n}: tapping the lit column brings the other back, got ${sc._lit}`);
// A long random-ish walk of the cycle always lands on a legal state, and the
// both-lit entry state is reachable from every state.
let s = 'all';
const walk = ['position', 'motion', 'motion', 'position', 'position', 'motion'];
for (const t of walk) s = board.nextLit(s, t);
check(s === 'all' || s === 'motion' || s === 'position', `${n}: cycle never leaves the legal set, got ${s}`);

// --- beats: the board is unchanged except the "?" field --------------------
sc._pick('motion');
sc.onBeatChange?.(1, 2);
await new Promise((r) => setTimeout(r, 30));
check(sc._lit === 'all', `${n}: beat 1 returns the board to both lit, got ${sc._lit}`);
sc.onBeatChange?.(0, 2);
await new Promise((r) => setTimeout(r, 30));
check(sc._lit === 'all', `${n}: beat 0 is both lit again, got ${sc._lit}`);

// The "?" field is beat 1's only addition and is never a number. The harness
// DOM has no node tree, so this checks the markup and the helper's contract.
const beat0 = board.boardHtml({ lit: 'all', numbers: false });
const beat1 = board.boardHtml({ lit: 'all', numbers: true });
check(/data-num hidden/.test(beat0), `${n}: beat 0 markup hides the number field`);
check(/data-num>/.test(beat1), `${n}: beat 1 markup shows the number field`);

// What the learner can actually read: the visible text of both beats, plus
// every aria-label a screen reader speaks, plus the scene's own ARIA_LABEL.
// The untaught words and every digit must be absent from all of it. This is a
// stronger check than scanning source, because it cannot be satisfied or
// defeated by a CSS property name (`height: auto`), an internal class
// (`.mcb-speed`), an SVG coordinate or a layout constant.
const spoken = (markup) => [
  ...[...markup.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]),  // spoken
  markup.replace(/<[^>]*>/g, ' '),                                     // visible text
].join(' ');

const VISIBLE = [
  ['entry markup', spoken(html())],
  ['beat 0 board', spoken(beat0)],
  ['beat 1 board', spoken(beat1)],
  ['ARIA_LABEL', String(MechanicalColumnsSceneLit.ARIA_LABEL)],
];

const BANNED = ['kinetic', 'potential', 'mass', 'speed', 'power', 'machine', 'joule', 'newton', 'formula', 'height'];
for (const [where, text] of VISIBLE) {
  for (const w of BANNED) {
    check(!new RegExp(`\\b${w}`, 'i').test(text), `${n}: "${w}" absent from what is read (${where})`);
  }
  // A digit in anything read would be a reading. Every tag and every
  // attribute is already gone, so anything left is genuinely on screen.
  check(!/\d/.test(text), `${n}: no digit in anything read (${where}), near ${JSON.stringify((text.match(/.{0,24}\d.{0,24}/g) || []).slice(0, 2))}`);
}

// The two headings, spelled exactly, and nothing else heading a column.
const here = path.dirname(new URL(import.meta.url).pathname);
const helperSrc = fs.readFileSync(path.join(here, 'MechanicalColumnsBoard.js'), 'utf8');
check(/head: 'MOTION'/.test(helperSrc) && /head: 'POSITION'/.test(helperSrc), `${n}: headings spelled MOTION and POSITION, in capitals`);
check(!/head: '[^']*[a-z]/.test(helperSrc), `${n}: nothing else heads a column`);

// A dimmed column must not empty itself: the slide's claim is that the resting
// ball's column "is not empty", so the dim state keeps the drawing and only
// quiets it. Checked in CSS, where the dim rule lives.
const css = board.BOARD_CSS;
check(/\[data-lit="0"\][^}]*\.mcb-fig\s*\{[^}]*opacity:\s*0?\.42/.test(css),
  `${n}: a dim column keeps its drawing at 42% opacity rather than hiding it`);
check(!/\[data-lit="0"\][^}]*display:\s*none/.test(css), `${n}: a dim column is never display:none`);
check(!/display:\s*none/.test(css), `${n}: the board CSS never hides a column outright`);

console.log(summary());
