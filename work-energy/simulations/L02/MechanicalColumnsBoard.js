// MechanicalColumnsBoard.js
//
// Shared board for the two-column sort. A general-purpose, self-contained
// component: it knows about two labelled columns and a lit/dim state, and
// about nothing else. No lesson, no slide, no scene and no mount appears in
// this file; a scene supplies the entry state and whatever chrome it needs
// around the board.
//
// The board is deliberately equal-sided. Both columns are the same grid track
// and both figures are the same viewBox, so neither column can read as the
// larger one - the "same amount, sorted two ways" reading is geometry here,
// not a caption.

import { simField, simTag } from 'simulations/base/SimUi.js';

// Figure box, in the SVG's own user units. Both columns use it unchanged.
export const BOARD_FIG_W = 200;
export const BOARD_FIG_H = 150;

// One ball radius, used by every drawing on the board. There is no second
// ball-drawing constant, so "the same ball" cannot drift between columns.
const BALL_R = 17;

export const BOARD_CSS = `
.mcb-board { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sim-space-3); align-items: stretch; }
.mcb-col { display: flex; flex-direction: column; gap: var(--sim-space-2); cursor: pointer; text-align: left; font: inherit; color: inherit; transition: border-color 240ms ease, box-shadow 240ms ease, background-color 240ms ease; }
.mcb-head { margin: 0; text-align: center; font-size: var(--sim-text-lg); font-weight: 800; letter-spacing: 0.14em; }
.mcb-fig { width: 100%; height: auto; display: block; }
.mcb-ball { fill: var(--sim-series-2); stroke: var(--sim-border); stroke-width: 2; }
.mcb-ball-hi { fill: var(--sim-bg-surface); opacity: 0.5; }
.mcb-grass { fill: var(--sim-series-3); }
.mcb-grass-lip { stroke: var(--sim-series-3); stroke-width: 3; }
/* POSITION gets a floor and a shelf back panel of its own, so the column
   carries the same amount of drawn matter as MOTION's grass. Without these
   the resting ball floats in a void and the column reads as the emptier of
   the two - the exact reading the board must not give. */
.mcb-floor { fill: var(--sim-track); }
.mcb-floor-lip { stroke: var(--sim-stroke); stroke-width: 3; }
.mcb-back { fill: var(--sim-bg-deep); stroke: var(--sim-stroke); stroke-width: 2; }
.mcb-shelf { fill: var(--sim-wedge); }
.mcb-shelf-edge { fill: var(--sim-border); }
.mcb-shadow { fill: var(--sim-label); opacity: 0.22; }
.mcb-arc { fill: none; stroke: var(--sim-series-1); stroke-width: 3; stroke-dasharray: 6 7; stroke-linecap: round; }
.mcb-speed { fill: none; stroke: var(--sim-label-muted); stroke-width: 3; stroke-linecap: round; }
.mcb-state { display: flex; flex-wrap: wrap; gap: var(--sim-space-1); }
.mcb-num { margin-top: auto; }
/* lit: the column's own edge colour. dim: quieter, never emptied. */
.mcb-col[data-lit="1"] { border-color: var(--sim-accent); box-shadow: 0 var(--sim-lift) 0 var(--sim-accent); }
.mcb-col[data-lit="1"] .mcb-head { color: var(--sim-accent); }
.mcb-col[data-lit="0"] { border-style: dashed; box-shadow: none; background: var(--sim-bg-deep); }
.mcb-col[data-lit="0"] .mcb-head { color: var(--sim-label-muted); }
.mcb-col[data-lit="0"] .mcb-fig { opacity: 0.42; filter: saturate(0.3); }
.mcb-col[data-lit="0"] .mcb-state { opacity: 0.6; }
.mcb-col:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.sim-dom-root--portrait .mcb-board { grid-template-columns: minmax(0, 1fr); }
`;

// The one ball. Every drawing on the board is this function called at a
// different place, which is what makes the two columns one object.
function ball(cx, cy, r = BALL_R) {
  return `<circle class="mcb-ball" cx="${cx}" cy="${cy}" r="${r}"/>`
    + `<circle class="mcb-ball-hi" cx="${(cx - r * 0.32).toFixed(1)}" cy="${(cy - r * 0.34).toFixed(1)}" r="${(r * 0.3).toFixed(1)}"/>`;
}

function svgOpen(label) {
  return `<svg class="mcb-fig" viewBox="0 0 ${BOARD_FIG_W} ${BOARD_FIG_H}" role="img" aria-label="${label}">`;
}

// The MOTION column: the ball rolling across grass, and the same ball already
// in the air. The arc is the only claim of sequence here, and the slide
// supplies it. Its states are passed in so a caller can label them.
export function motionFigure() {
  return svgOpen('A ball rolling across grass, and the same ball up in the air.')
    + ball(62, 99)
    + `<path class="mcb-arc" d="M100 112 Q126 100 140 74"/>`
    + ball(148, 52)
    + `<path class="mcb-speed" d="M28 92 H44"/><path class="mcb-speed" d="M22 106 H40"/>`
    + `<rect class="mcb-grass" x="0" y="116" width="${BOARD_FIG_W}" height="${BOARD_FIG_H - 116}"/>`
    + `<line class="mcb-grass-lip" x1="0" y1="116" x2="${BOARD_FIG_W}" y2="116"/>`
    + '</svg>';
}

// The POSITION column: the same ball sitting still on a shelf, with nothing
// touching it. Same ground line and same figure box as the MOTION column, so
// the two read as one board with the ball in a different place rather than as
// a full column beside an empty one.
export function positionFigure() {
  return svgOpen('The same ball sitting still on a shelf, with nothing touching it.')
    + `<rect class="mcb-back" x="30" y="30" width="140" height="86" rx="6"/>`
    + `<ellipse class="mcb-shadow" cx="100" cy="106" rx="26" ry="4"/>`
    + `<rect class="mcb-shelf" x="26" y="104" width="148" height="9" rx="3"/>`
    + `<rect class="mcb-shelf-edge" x="26" y="113" width="10" height="26" rx="2"/>`
    + `<rect class="mcb-shelf-edge" x="164" y="113" width="10" height="26" rx="2"/>`
    + ball(100, 87)
    + `<rect class="mcb-floor" x="0" y="116" width="${BOARD_FIG_W}" height="${BOARD_FIG_H - 116}"/>`
    + `<line class="mcb-floor-lip" x1="0" y1="116" x2="${BOARD_FIG_W}" y2="116"/>`
    + '</svg>';
}

/**
 * The whole board as one markup string.
 *
 * `lit` is the entry lit state: `'all'` (both columns lit) or a column id.
 * `numbers` adds the dashed "?" field to each column - the board's way of
 * saying a column has no number on it, and never a number itself.
 */
export function boardHtml({ lit = 'all', numbers = false } = {}) {
  const cols = [
    { id: 'motion', head: 'MOTION', fig: motionFigure, states: ['rolling', 'in the air'] },
    { id: 'position', head: 'POSITION', fig: positionFigure, states: ['at rest'] },
  ];
  const bothLit = lit === 'all';
  return `<div class="mcb-board" data-board>
${cols.map((c) => `    <button type="button" class="sim-card mcb-col" data-col="${c.id}" data-lit="${bothLit || lit === c.id ? 1 : 0}" aria-pressed="${bothLit || lit === c.id ? 'true' : 'false'}">
      <h3 class="mcb-head">${c.head}</h3>
      <div data-fig>${c.fig()}</div>
      <div class="mcb-state">${c.states.map((s) => simTag(s)).join('')}</div>
      <div class="mcb-num" data-num${numbers ? '' : ' hidden'}>${simField('how much', null)}</div>
    </button>`).join('\n')}
  </div>`;
}

/** The lit column ids for a state, in board order. */
export function litColumns(lit) {
  return lit === 'all' ? ['motion', 'position'] : [lit];
}

/**
 * The board's lit-state cycle. Tapping the lit column brings the other one
 * back, so the both-lit state is always reachable from the board itself and a
 * scene needs no extra control for it. Pure: no DOM, no scene.
 */
export function nextLit(current, tapped) {
  if (current === tapped) return 'all';
  return tapped;
}

/**
 * Paint a mounted board. `board` is the `[data-board]` element; `lit` is
 * `'all'` or a column id. Every lookup is optional-chained, so this is a
 * no-op in a DOM without a node tree rather than a throw.
 */
export function paintBoard(board, lit) {
  if (!board) return;
  const on = litColumns(lit);
  for (const el of board.querySelectorAll?.('.mcb-col') || []) {
    const isLit = on.includes(el.dataset.col);
    el.dataset.lit = isLit ? '1' : '0';
    el.setAttribute?.('aria-pressed', isLit ? 'true' : 'false');
  }
}

/**
 * Wire the two columns to a callback. `onPick(colId)` fires on click and on
 * Enter/Space, so the board is reachable by keyboard as well as by tap.
 */
export function bindBoard(board, onPick) {
  for (const el of board?.querySelectorAll?.('.mcb-col') || []) {
    const id = el.dataset.col;
    el.addEventListener?.('click', () => onPick?.(id));
    el.addEventListener?.('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault?.();
        onPick?.(id);
      }
    });
  }
}

/** Show or hide the dashed "?" field in every column. */
export function setNumbers(board, on) {
  for (const el of board?.querySelectorAll?.('[data-num]') || []) el.hidden = !on;
}
