import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, noteLineHtml, burst } from 'simulations/base/kit/SimLookDom.js';
import {
  flowTabsHtml, flowStageHtml, flowDeckHtml, flowChoiceHtml, setFlowChoice, flowCompareHtml,
  showFlowPanel, bindFlow,
} from 'simulations/base/kit/SimFlowDom.js';

/**
 * ProductLabelScene - blk-l02-s05, "Three Labels, Three Answers".
 *
 * One idea runs the whole scene: a label's percentage is about ONE 100-portion of the
 * solution (100 g or 100 mL of the whole thing), and the letters say how each side is
 * measured. Every tab makes that portion something you can see and change:
 *
 *   Milk powder    tap a line of the pouch's table and its grams fill a 100-square grid
 *                  (one square = 1 g of powder), so "per 100 g" is the grid itself
 *   Two 5 % labels guess what the 5 is in 100 mL of each bottle (grams on a balance, or
 *                  millilitres in a cylinder); the letters on the label decide, and a right
 *                  guess opens the 100 mL to show it
 *   Bottle size    guess the label of a 1000 mL bottle, then change the size: the bottle is
 *                  drawn as 100 mL slices with 5 g of glucose in each, so the grams grow
 *                  and the printed 5 % stays the same
 *   All three      the three decoded labels as recap rows (a row reopens its tab)
 *
 * Beats pick the tab; what the learner has done stays done. The scene labels and never
 * explains: the slide prose carries every sentence. No frame loop: CSS only.
 */

const W = 680;
const H = 528;   // sim-layout --interact 40: tallest state 518px (Bottle size at 1000 mL)

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // the shelf: the milk powder's 100 g
  [{ idx: 1, dwellMs: null }], // the two 5 % labels
  [{ idx: 2, dwellMs: null }], // the bottle size
  [{ idx: 3, dwellMs: null }], // all three, side by side
];
const BEAT_TAB = ['pouch', 'five', 'size', 'all'];

const TABS = [
  { key: 'pouch', label: 'Milk powder', sub: 'w/w' },
  { key: 'five', label: 'Two 5 % labels', sub: 'w/v and v/v' },
  { key: 'size', label: 'Bottle size', sub: 'w/v' },
  { key: 'all', label: 'All three' },
];

/** The pouch's printed lines (FIGURES.md Fig. 5.4), grams per 100 g. One series tone each. */
const NUTRIENTS = [
  { id: 'fat', name: 'Fat', g: 26, tone: 2 },
  { id: 'sugars', name: 'Sugars', g: 49, tone: 5 },
  { id: 'fibre', name: 'Fibre', g: 0, tone: 3 },
  { id: 'protein', name: 'Protein', g: 15.5, tone: 1 },
  { id: 'sodium', name: 'Sodium', g: 0.8, tone: 6 },
];
const LISTED = NUTRIENTS.reduce((s, n) => s + n.g, 0);   // 91.3

/** The two 5 % bottles. `top` is the unit the first letter asks for. */
const FIVES = [
  { id: 'glucose', name: 'Glucose infusion', letters: ['w', 'v'], top: 'g', solute: 'glucose', stamp: '500 mL', tone: 1 },
  { id: 'vinegar', name: 'White vinegar', letters: ['v', 'v'], top: 'mL', solute: 'acetic acid', stamp: '100 mL', tone: 6 },
];

const PER_100ML_G = 5;
const SIZES = [250, 500, 1000];
const gramsFor = (ml) => (PER_100ML_G * ml) / 100;
const fmt = (n) => String(Math.round(n * 10) / 10);

// Small unit glyphs: a balance pan (grams) and a measuring cylinder (millilitres).
const ICON = {
  g: `<svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16v2H4z" fill="currentColor"/><path d="M11 9h2v10h-2z" fill="currentColor"/><path d="M3 9h18a7 3 0 0 1-18 0z" fill="currentColor"/></svg>`,
  mL: `<svg class="pl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10v2h-1v16a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V4H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 14h4v5h-4z" fill="currentColor"/><path d="M12 7h2M12 10h2" stroke="currentColor" stroke-width="2"/></svg>`,
};
// Mini package glyphs for the recap rows: a pouch, an infusion bottle, a capped bottle.
const GLYPH = {
  pouch: `<svg class="pl-glyph" viewBox="0 0 48 48" aria-hidden="true" style="--c:var(--sim-series-3)"><path d="M11 6h26v5H11z" fill="color-mix(in oklab, var(--c) 60%, var(--sim-stroke))"/><path d="M13 12h22a3 3 0 0 1 3 3v27a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3z" fill="var(--c)"/><path d="M15 22h18v10H15z" fill="var(--sim-bg-surface)"/></svg>`,
  glucose: `<svg class="pl-glyph" viewBox="0 0 48 48" aria-hidden="true" style="--c:var(--sim-series-1)"><path d="M19 3h10v6H19z" fill="color-mix(in oklab, var(--c) 60%, var(--sim-stroke))"/><path d="M21 9h6v4h-6z" fill="var(--sim-stroke)"/><path d="M14 13h20a3 3 0 0 1 3 3v26a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3z" fill="var(--c)"/><path d="M15 23h18v10H15z" fill="var(--sim-bg-surface)"/></svg>`,
  vinegar: `<svg class="pl-glyph" viewBox="0 0 48 48" aria-hidden="true" style="--c:var(--sim-series-6)"><path d="M19 3h10v7H19z" fill="color-mix(in oklab, var(--c) 60%, var(--sim-stroke))"/><path d="M16 10h16a3 3 0 0 1 3 3v29a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z" fill="var(--c)"/><path d="M16 22h16v10H16z" fill="var(--sim-bg-surface)"/></svg>`,
};
const MARK = { yes: '\u2713', no: '\u2717' };

/** A bottle: cap, neck, a glass body with liquid, and the printed sticker in front. */
function bottleHtml({ tone, sticker, stamp = '', tall = 0, slices = '', cls = '' }) {
  const body = tall ? ` style="--tall:${tall}px"` : '';
  return `<div class="pl-bottle ${cls}" style="--c:var(--sim-series-${tone})">
    <span class="pl-bottle__cap"></span><span class="pl-bottle__neck"></span>
    <div class="pl-bottle__body"${body}>${slices || '<span class="pl-bottle__liquid"></span>'}
      <span class="pl-bottle__shine"></span>
      ${sticker ? `<div class="pl-sticker">${sticker}</div>` : ''}
    </div>
    ${stamp ? `<span class="pl-stamp">${esc(stamp)}</span>` : ''}
  </div>`;
}

/** "5 % w/v" with each letter its own span, so the scene can point at the one that decides. */
function pctHtml(n, letters, lit = -1) {
  return `<span class="pl-pct">${esc(n)} %<span class="pl-pct__u">${letters.map((l, i) =>
    `<span class="pl-pct__l${i === lit ? ' is-lit' : ''}">${esc(l)}</span>`).join('/')}</span></span>`;
}

/** A plain stacked fraction at a readable size (sim-frac shrinks to 0.82em, under the floor here). */
function fracHtml(top, bottom, topUnit, botUnit) {
  return `<span class="pl-frac"><span class="pl-frac__n">${ICON[topUnit]}${esc(top)}</span>`
    + `<span class="pl-frac__d">${ICON[botUnit]}${esc(bottom)}</span></span>`;
}

/** The solute of one 100 mL portion, taken out where you can see it. */
function soluteHtml(unit, solute, tone) {
  if (unit === 'g') {
    return `<div class="pl-scale" style="--c:var(--sim-series-${tone})">
      <span class="pl-scale__heap"></span><span class="pl-scale__pan"></span>
      <span class="pl-scale__base"><span class="pl-scale__read">5 g</span></span>
      <span class="pl-scale__cap">${esc(solute)}</span></div>`;
  }
  return `<div class="pl-cyl" style="--c:var(--sim-series-${tone})">
    <span class="pl-cyl__tube"><span class="pl-cyl__liq"></span></span>
    <span class="pl-cyl__read">5 mL</span>
    <span class="pl-scale__cap">${esc(solute)}</span></div>`;
}

const CSS = SIM_LOOK_DOM_CSS + `
.pl-root { padding: var(--sim-space-3); }
.pl-root .sflow { gap: var(--sim-space-2); }
.pl-root .sflow-stage { padding: var(--sim-space-3) var(--sim-space-4); gap: var(--sim-space-2); }
.pl-root .sflow-title { font-size: var(--sim-text-lg); }
.pl-ico { width: 18px; height: 18px; flex: none; }
.pl-split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: var(--sim-space-4); align-items: center; }

/* ---- the pouch: a foil packet with its table printed on the front; each line is a button ---- */
.pl-pouch { position: relative; display: flex; flex-direction: column; gap: var(--sim-space-2); padding: var(--sim-space-4) var(--sim-space-3) var(--sim-space-3);
  border: var(--sim-border); border-radius: 10px 10px 22px 22px;
  background: color-mix(in oklab, var(--sim-series-3) 34%, var(--sim-bg-surface));
  box-shadow: 0 4px 0 color-mix(in oklab, var(--sim-series-3) 45%, var(--sim-stroke)); }
.pl-pouch::before { content: ''; position: absolute; inset: 0 0 auto; height: 12px; border-radius: 8px 8px 0 0;
  background: repeating-linear-gradient(90deg, color-mix(in oklab, var(--sim-series-3) 60%, var(--sim-stroke)) 0 6px, transparent 6px 10px); }
.pl-pouch__brand { font-weight: 900; font-size: var(--sim-text-lg); letter-spacing: 0.04em; color: var(--sim-label); text-align: center; }
.pl-pouch__label { display: flex; flex-direction: column; gap: 3px; padding: var(--sim-space-2); border-radius: var(--sim-radius-sm);
  background: var(--sim-bg-surface); border: 2px solid var(--sim-stroke); }
.pl-per { display: flex; justify-content: space-between; font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted);
  padding: 0 var(--sim-space-2) 2px; border-bottom: 2px solid var(--sim-stroke); }
.pl-nrow { display: flex; align-items: center; gap: var(--sim-space-2); width: 100%; min-height: 36px; padding: 2px var(--sim-space-2);
  border: 2px solid transparent; border-radius: var(--sim-radius-sm); background: transparent; cursor: pointer;
  font-size: var(--sim-text-md); font-weight: 700; color: var(--sim-label); text-align: left;
  transition: background-color 0.15s ease, border-color 0.15s ease; }
.pl-nrow:hover { border-color: color-mix(in oklab, var(--c) 60%, var(--sim-stroke)); }
.pl-nrow:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 1px; }
.pl-nrow[aria-pressed="true"] { background: color-mix(in oklab, var(--c) 22%, var(--sim-bg-surface)); border-color: var(--c); }
.pl-nrow__pip { flex: none; width: 16px; height: 16px; border-radius: 4px; border: 2px solid var(--c); background: transparent; }
.pl-nrow[aria-pressed="true"] .pl-nrow__pip { background: var(--c); }
.pl-nrow__name { flex: 1 1 auto; }
.pl-nrow__g { font-variant-numeric: tabular-nums; }

/* ---- the 100 g grid: one square is one gram of powder ---- */
.pl-gridwrap { display: flex; flex-direction: column; align-items: center; gap: var(--sim-space-2); min-width: 0; }
.pl-gridhead { display: flex; align-items: center; gap: var(--sim-space-2); font-weight: 800; font-size: var(--sim-text-md); color: var(--sim-label); }
.pl-grid { display: grid; grid-template-columns: repeat(10, 22px); grid-auto-rows: 22px; gap: 3px; padding: 6px;
  border: var(--sim-border); border-radius: var(--sim-radius-md); background: var(--sim-bg-cell); }
.pl-cell { border-radius: 4px; background: color-mix(in oklab, var(--sim-stroke) 26%, var(--sim-bg-surface)); position: relative; overflow: hidden; }
.pl-cell[data-n] { background: linear-gradient(to top, var(--c) calc(var(--part, 1) * 100%), color-mix(in oklab, var(--sim-stroke) 26%, var(--sim-bg-surface)) 0); }
.pl-cell.is-new { animation: pl-pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both; animation-delay: calc(var(--k, 0) * 9ms); }
.pl-cell.is-rest { background: repeating-linear-gradient(45deg, color-mix(in oklab, var(--sim-label-muted) 45%, transparent) 0 3px, transparent 3px 7px); }
.pl-read { display: flex; flex-direction: column; align-items: center; gap: 2px; min-height: 56px; text-align: center; }
.pl-read__big { font-weight: 900; font-size: var(--sim-text-xl); color: var(--sim-label); font-variant-numeric: tabular-nums; }
.pl-read__big b { color: var(--c, var(--sim-label)); }
.pl-read__sub { font-weight: 700; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.pl-read__tag { display: inline-flex; padding: 2px var(--sim-space-2); border-radius: var(--sim-radius-pill);
  background: color-mix(in oklab, var(--c, var(--sim-accent)) 22%, var(--sim-bg-surface)); border: 2px solid var(--c, var(--sim-accent));
  font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label); }

/* ---- bottles ---- */
.pl-bottle { display: flex; flex-direction: column; align-items: center; }
.pl-bottle__cap { width: 34px; height: 14px; border-radius: 5px 5px 2px 2px; background: color-mix(in oklab, var(--c) 70%, var(--sim-stroke));
  border: 2px solid var(--sim-stroke); }
.pl-bottle__neck { width: 26px; height: 14px; border: 2px solid var(--sim-stroke); border-top: 0; border-bottom: 0;
  background: color-mix(in oklab, var(--sim-glass) 22%, var(--sim-bg-surface)); }
.pl-bottle__body { position: relative; display: flex; flex-direction: column-reverse; width: 120px; height: var(--tall, 150px); overflow: hidden;
  border: var(--sim-border); border-radius: 22px 22px 14px 14px; background: color-mix(in oklab, var(--sim-glass) 16%, var(--sim-bg-surface));
  box-shadow: 0 4px 0 color-mix(in oklab, var(--sim-stroke) 60%, transparent); transition: height 0.45s cubic-bezier(0.2, 0.8, 0.3, 1); }
.pl-bottle__liquid { display: block; height: 82%; background: color-mix(in oklab, var(--c) 30%, var(--sim-bg-surface));
  border-top: 3px solid color-mix(in oklab, var(--c) 55%, var(--sim-bg-surface)); }
.pl-bottle__shine { position: absolute; inset: 14px auto 14px 10px; width: 8px; border-radius: 4px; background: color-mix(in oklab, var(--sim-label) 14%, transparent); }
.pl-sticker { position: absolute; inset: 50% 8px auto; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: var(--sim-space-1) var(--sim-space-1) 6px; border-radius: var(--sim-radius-sm); background: var(--sim-bg-surface); border: 2px solid var(--sim-stroke); text-align: center; }
.pl-sticker__name { font-weight: 800; font-size: var(--sim-text-sm); line-height: 1.15; color: var(--sim-label-muted); }
.pl-stamp { margin-top: var(--sim-space-1); padding: 0 var(--sim-space-2); border-radius: var(--sim-radius-pill); border: 2px solid var(--sim-stroke);
  font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); background: var(--sim-bg-surface); }
.pl-pct { display: inline-flex; align-items: baseline; gap: 6px; font-weight: 900; font-size: var(--sim-text-xl); color: var(--sim-label); white-space: nowrap; }
.pl-pct__u { font-size: var(--sim-text-lg); }
.pl-pct__l { display: inline-block; padding: 0 2px; border-radius: 4px; }
.pl-pct__l.is-lit { background: color-mix(in oklab, var(--sim-warning) 35%, var(--sim-bg-surface)); box-shadow: 0 0 0 2px var(--sim-warning);
  animation: pl-pulse 0.7s ease 2; }

/* ---- the two 5 % labels ---- */
.pl-fives { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sim-space-3); }
.pl-bcard { display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "b a" "o o"; gap: var(--sim-space-3); align-items: center;
  padding: var(--sim-space-3); border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-md);
  background: color-mix(in oklab, var(--c) 8%, var(--sim-bg-surface)); }
.pl-bcard .pl-bottle { grid-area: b; }
.pl-bcard .pl-bottle__body { width: 108px; }
.pl-bcard .pl-out { grid-area: o; }
.pl-ask { display: flex; flex-direction: column; gap: var(--sim-space-2); min-width: 0; }
.pl-ask__q { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.pl-guess { display: flex; flex-wrap: wrap; gap: var(--sim-space-2); }
.pl-chip { display: inline-flex; align-items: center; gap: var(--sim-space-1); min-height: 40px; padding: var(--sim-space-1) var(--sim-space-3);
  border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-pill); background: var(--sim-bg-surface); color: var(--sim-label);
  font-weight: 800; font-size: var(--sim-text-md); cursor: pointer; box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent);
  transition: transform 0.1s ease, box-shadow 0.1s ease; }
.pl-chip:active { transform: translateY(3px); box-shadow: none; }
.pl-chip:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.pl-chip.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-good) 55%, var(--sim-stroke)); }
.pl-chip.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 16%, var(--sim-bg-surface)); animation: pl-shake 0.36s ease; }
.pl-chip__mark { font-weight: 900; }
.pl-chip:disabled { cursor: default; }
.pl-out { display: flex; align-items: flex-end; justify-content: center; gap: var(--sim-space-4); min-height: 118px; padding-top: var(--sim-space-1);
  border-top: 2px dashed color-mix(in oklab, var(--c) 40%, var(--sim-stroke)); }
.pl-out--wait { align-items: center; border: 2px dashed var(--sim-stroke); border-radius: var(--sim-radius-md); color: var(--sim-label-muted);
  font-weight: 800; font-size: var(--sim-text-xl); }
.pl-out.is-in > * { animation: pl-rise 0.35s cubic-bezier(0.2, 0.8, 0.3, 1) both; }
.pl-out.is-in > :nth-child(2) { animation-delay: 0.12s; }
.pl-out .pl-frac { align-self: center; }
.pl-frac { display: inline-flex; flex-direction: column; align-items: stretch; font-weight: 800; font-size: var(--sim-text-md); color: var(--sim-label); }
.pl-frac__n, .pl-frac__d { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 2px 4px; white-space: nowrap; }
.pl-frac__n { border-bottom: 3px solid currentColor; }

/* the 5 g on a balance pan, and the 5 mL in a measuring cylinder */
.pl-scale { display: grid; justify-items: center; grid-template-rows: auto auto auto auto; }
.pl-scale__heap { width: 46px; height: 20px; border-radius: 50% 50% 4px 4px / 100% 100% 4px 4px;
  background: color-mix(in oklab, var(--c) 30%, var(--sim-bg-surface)); border: 2px solid var(--sim-stroke); border-bottom: 0; }
.pl-scale__pan { width: 76px; height: 9px; border-radius: 0 0 40px 40px; background: var(--sim-surface-raised); border: 2px solid var(--sim-stroke); }
.pl-scale__base { display: grid; place-items: center; width: 92px; height: 34px; margin-top: 3px; border-radius: 8px;
  background: var(--sim-surface-raised); border: 2px solid var(--sim-stroke); box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 60%, transparent); }
.pl-scale__read { padding: 0 var(--sim-space-2); border-radius: 4px; background: var(--sim-bg-deep); color: var(--sim-good);
  font-weight: 900; font-size: var(--sim-text-md); font-variant-numeric: tabular-nums; }
.pl-scale__cap { margin-top: 4px; font-weight: 700; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.pl-cyl { display: grid; justify-items: center; }
.pl-cyl__tube { position: relative; display: flex; flex-direction: column-reverse; width: 30px; height: 66px; overflow: visible;
  border: var(--sim-border); border-top: 0; border-radius: 0 0 8px 8px; background: color-mix(in oklab, var(--sim-glass) 16%, var(--sim-bg-surface)); }
.pl-cyl__liq { display: block; height: 30%; border-radius: 0 0 6px 6px; background: color-mix(in oklab, var(--c) 55%, var(--sim-bg-surface)); }
.pl-cyl__tube::before { content: ''; position: absolute; inset: auto -6px 30% auto; width: 12px; border-top: 2px solid var(--sim-label); }
.pl-cyl__read { margin-top: 4px; padding: 0 var(--sim-space-2); border-radius: 4px; background: var(--sim-bg-deep); color: var(--sim-good);
  font-weight: 900; font-size: var(--sim-text-md); border: 2px solid var(--sim-stroke); }

/* ---- bottle size: the bottle drawn as 100 mL slices, 5 g of glucose in each ---- */
.pl-size { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--sim-space-5); align-items: end; }
.pl-size .pl-bottle__body { width: 150px; justify-content: flex-start; }
.pl-slice { flex: none; display: flex; align-items: center; justify-content: flex-end; gap: 6px; height: 22px; padding-right: 10px;
  background: color-mix(in oklab, var(--c) 26%, var(--sim-bg-surface)); border-top: 2px dashed color-mix(in oklab, var(--c) 60%, var(--sim-stroke)); }
.pl-slice:first-child { border-radius: 0 0 12px 12px; }
.pl-slice--half { height: 11px; }
.pl-slice.is-new { animation: pl-rise 0.3s ease both; animation-delay: calc(var(--k, 0) * 40ms); }
.pl-cube { display: inline-grid; place-items: center; min-width: 34px; height: 18px; padding: 0 4px; border-radius: 5px;
  background: color-mix(in oklab, var(--sim-glucose) 34%, var(--sim-bg-surface)); border: 2px solid var(--sim-glucose);
  font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label); line-height: 1; }
.pl-slice--half .pl-cube { height: 9px; min-width: 0; padding: 0; width: 18px; font-size: 0; }
.pl-size .pl-sticker { inset: 10px 12px auto; transform: none; }
.pl-sizeside { display: flex; flex-direction: column; gap: var(--sim-space-3); min-width: 0; padding-bottom: var(--sim-space-3); }
.pl-meters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sim-space-2); }
.pl-meter { display: flex; flex-direction: column; gap: 2px; padding: var(--sim-space-2) var(--sim-space-3); border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-md); background: var(--sim-bg-surface); }
.pl-meter__k { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.pl-meter__v { font-weight: 900; font-size: var(--sim-text-xl); color: var(--sim-label); font-variant-numeric: tabular-nums; white-space: nowrap; }
.pl-meter--moves { border-color: var(--sim-glucose); background: color-mix(in oklab, var(--sim-glucose) 12%, var(--sim-bg-surface)); }
.pl-meter__v.is-new { animation: pl-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.pl-sizeside .sflow-choice { align-self: flex-start; }

/* ---- all three ---- */
.pl-root .sflow-row { grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr); padding: var(--sim-space-3) var(--sim-space-4); }
.pl-root .sflow-compare { gap: var(--sim-space-2); }
.pl-rowbody { display: flex; align-items: center; justify-content: flex-end; gap: var(--sim-space-3); }
.pl-glyph { width: 44px; height: 44px; flex: none; margin-right: auto; }
.pl-rowq { font-weight: 800; font-size: var(--sim-text-md); color: var(--sim-label-muted); }

/* ---- phone: the host gives a scene about 350 x 225, so each beat is one wide panel. The beats step the tabs. ---- */
.pl-root.sim-dom-root--portrait { padding: 4px; }
.sim-dom-root--portrait .sflow-deck > .sflow-stage.is-off { display: none; }
.sim-dom-root--portrait .sflow-tabs, .sim-dom-root--portrait .sl-note-line, .sim-dom-root--portrait .pl-pouch__brand { display: none; }
.pl-root.sim-dom-root--portrait .sflow-stage { padding: 6px; }
.sim-dom-root--portrait .pl-split { grid-template-columns: minmax(0, 1.08fr) minmax(0, 1fr); gap: 6px; align-items: start; }
.sim-dom-root--portrait .pl-pouch { padding: 14px 4px 4px; gap: 0; }
.sim-dom-root--portrait .pl-pouch__label { padding: 3px; gap: 1px; }
.sim-dom-root--portrait .pl-nrow { min-height: 36px; padding: 0 4px; gap: 5px; font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .pl-gridwrap { gap: 3px; }
.sim-dom-root--portrait .pl-gridhead { font-size: var(--sim-text-sm); gap: 4px; }
.sim-dom-root--portrait .pl-gridhead .pl-read__sub, .sim-dom-root--portrait .pl-gridhead .pl-ico { display: none; }
.sim-dom-root--portrait .pl-grid { grid-template-columns: repeat(10, 11px); grid-auto-rows: 11px; gap: 2px; padding: 3px; }
.sim-dom-root--portrait .pl-read { min-height: 40px; }
.sim-dom-root--portrait .pl-read__big { font-size: var(--sim-text-sm); line-height: 1.2; }
.sim-dom-root--portrait .pl-fives { gap: 6px; }
.sim-dom-root--portrait .pl-bcard { grid-template-columns: minmax(0, 1fr); grid-template-areas: "b" "a" "o"; gap: 4px; padding: 5px; }
.sim-dom-root--portrait .pl-bottle__cap, .sim-dom-root--portrait .pl-bottle__neck, .sim-dom-root--portrait .pl-stamp, .sim-dom-root--portrait .pl-bottle__shine { display: none; }
.sim-dom-root--portrait .pl-bcard .pl-bottle__body { width: 100%; height: 52px; border-radius: 8px; box-shadow: none; }
.sim-dom-root--portrait .pl-sticker { inset: 3px; transform: none; padding: 0; gap: 0; justify-content: center; }
.sim-dom-root--portrait .pl-pct { font-size: var(--sim-text-md); }
.sim-dom-root--portrait .pl-pct__u { font-size: var(--sim-text-md); }
.sim-dom-root--portrait .pl-ask { gap: 3px; }
.sim-dom-root--portrait .pl-guess { gap: 4px; flex-wrap: nowrap; }
.sim-dom-root--portrait .pl-chip { padding: 2px 8px; font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .pl-chip .pl-ico { display: none; }
.sim-dom-root--portrait .pl-out { min-height: 54px; gap: 0; padding-top: 0; }
.sim-dom-root--portrait .pl-out .pl-scale, .sim-dom-root--portrait .pl-out .pl-cyl { display: none; }
.sim-dom-root--portrait .pl-out .pl-ico { display: none; }
.sim-dom-root--portrait .pl-out .pl-frac { font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .pl-size { gap: 8px; align-items: start; }
.sim-dom-root--portrait .pl-size .pl-bottle__body { width: 92px; height: var(--tall, 150px); border-radius: 12px 12px 8px 8px; }
.sim-dom-root--portrait .pl-size .pl-sticker { display: none; }
.sim-dom-root--portrait .pl-slice { height: 14px; padding-right: 0; justify-content: center; border-top-width: 1px; }
.sim-dom-root--portrait .pl-slice--half { height: 7px; }
.sim-dom-root--portrait .pl-cube { height: 13px; min-width: 0; padding: 0 3px; font-size: 12px; border-width: 1px; }
.sim-dom-root--portrait .pl-slice--half .pl-cube { height: 5px; }
.sim-dom-root--portrait .pl-sizeside { gap: 6px; padding-bottom: 0; }
.sim-dom-root--portrait .pl-meter { padding: 3px 6px; }
.sim-dom-root--portrait .pl-meter__v { font-size: var(--sim-text-lg); }
.pl-root.sim-dom-root--portrait .sflow-row { grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); padding: 5px 8px; min-height: 58px; }
.sim-dom-root--portrait .pl-rowbody { justify-content: flex-start; gap: 6px; min-width: 0; }
.sim-dom-root--portrait .pl-glyph { width: 30px; height: 30px; margin-right: 0; }
.sim-dom-root--portrait .pl-rowbody .pl-frac { font-size: var(--sim-text-sm); min-width: 0; }
.sim-dom-root--portrait .pl-rowbody .pl-ico { display: none; }

@keyframes pl-pop { from { transform: scale(0.3); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes pl-rise { from { transform: translateY(10px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes pl-shake { 0%, 100% { transform: none; } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@keyframes pl-pulse { 50% { transform: scale(1.18); } }
@media (prefers-reduced-motion: reduce) {
  .pl-cell.is-new, .pl-chip.is-no, .pl-pct__l.is-lit, .pl-out.is-in > *, .pl-slice.is-new, .pl-meter__v.is-new { animation: none; }
  .pl-bottle__body, .pl-nrow { transition: none; }
}
`;

export class ProductLabelScene extends DomSimulation {
  static WIDTH = W;
  static HEIGHT = H;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 264;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'Three product labels to decode. Fill a 100-square grid from the milk powder table, guess whether the 5 on two 5 % bottles is grams or millilitres, and change a glucose bottle from 250 to 1000 mL while its 5 % label stays the same.';
  // Every control is in the scene, beside what it changes.
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this._tab = 'pouch';
    this._order = [];            // nutrient ids in the order they were tapped
    this._fresh = '';            // the nutrient whose squares pop in on this paint
    this._guess = { glucose: null, vinegar: null };   // { unit, ok }
    this._sizeGuess = null;      // '5' | '10'
    this._ml = 500;
    this._celebrated = { pouch: false, five: false };
    this.render({ css: CSS, rootClass: 'sl-backdrop sl-backdrop--plain pl-root', html: this._frameHtml() });
    bindFlow(this.root, {
      tab: (key) => this._go(key),
      action: (name, value, el) => this._act(name, value, el),
    });
    this.onStep(this.stepIndex ?? 0);
  }

  onStep(step) {
    this._go(BEAT_TAB[step] ?? 'pouch');
  }

  _go(key) {
    if (!TABS.some((t) => t.key === key)) return;
    this._tab = key;
    if (key === 'all') this._paintPane('all');
    showFlowPanel(this.root, key);
  }

  _act(name, value) {
    if (name === 'fill') return this._fill(value);
    if (name === 'five') return this._five(value);
    if (name === 'sizeguess') return this._guessSize(value);
    if (name === 'size') return this.onControlChange('size', value);
    return undefined;
  }

  // ---- milk powder ---------------------------------------------------------------------------

  _fill(id) {
    if (!NUTRIENTS.some((n) => n.id === id)) return;
    if (this._order.includes(id)) {
      this._order = this._order.filter((k) => k !== id);
      this._fresh = '';
      this._last = this._order[this._order.length - 1] || '';
    } else {
      this._order.push(id);
      this._fresh = id;
      this._last = id;
    }
    this._paintPane('pouch');
    if (!this._celebrated.pouch && this._order.length === NUTRIENTS.length) {
      this._celebrated.pouch = true;
      burst(this.root.querySelector?.('.pl-gridwrap'));
    }
  }

  _pouchHtml() {
    const rows = NUTRIENTS.map((n) => `<button type="button" class="pl-nrow" style="--c:var(--sim-series-${n.tone})"`
      + ` data-sflow-action="fill" data-sflow-value="${n.id}" aria-pressed="${this._order.includes(n.id)}">`
      + `<span class="pl-nrow__pip" aria-hidden="true"></span><span class="pl-nrow__name">${esc(n.name)}</span>`
      + `<span class="pl-nrow__g">${esc(fmt(n.g))} g</span></button>`).join('');
    const pouch = `<div class="pl-pouch"><div class="pl-pouch__brand">MILK POWDER</div>`
      + `<div class="pl-pouch__label"><div class="pl-per"><span>Nutrition</span><span>per 100 g</span></div>${rows}</div></div>`;

    // Lay the tapped nutrients into 100 squares, in the order they were tapped.
    const cells = [];
    for (const id of this._order) {
      const n = NUTRIENTS.find((x) => x.id === id);
      let left = n.g;
      let k = 0;
      while (left > 0.001 && cells.length < 100) {
        const part = Math.min(1, left);
        cells.push({ tone: n.tone, part, fresh: id === this._fresh, k: k++ });
        left -= part;
      }
    }
    const all = this._order.length === NUTRIENTS.length;
    let grid = '';
    for (let i = 0; i < 100; i++) {
      const c = cells[i];
      if (c) {
        grid += `<span class="pl-cell${c.fresh ? ' is-new' : ''}" data-n style="--c:var(--sim-series-${c.tone});--part:${c.part};--k:${c.k}"></span>`;
      } else {
        grid += `<span class="pl-cell${all ? ' is-rest' : ''}"></span>`;
      }
    }
    this._fresh = '';

    const last = NUTRIENTS.find((x) => x.id === this._last);
    const used = this._order.reduce((s, id) => s + NUTRIENTS.find((x) => x.id === id).g, 0);
    let read;
    if (all) {
      read = `<span class="pl-read__big">${esc(fmt(LISTED))} g <span class="pl-read__sub">listed</span> + ${esc(fmt(100 - LISTED))} g <span class="pl-read__sub">rest</span></span>`
        + `<span class="pl-read__tag">= 100 g of powder</span>`;
    } else if (last) {
      read = `<span class="pl-read__big" style="--c:var(--sim-series-${last.tone})"><b>${esc(fmt(last.g))} g</b> ${esc(last.name.toLowerCase())} in 100 g</span>`
        + `<span class="pl-read__tag" style="--c:var(--sim-series-${last.tone})">${esc(fmt(last.g))} % w/w</span>`;
    } else {
      read = `<span class="pl-read__sub">Tap a line on the pouch</span>`;
    }
    const meta = this._order.length ? `${fmt(used)} of 100 squares` : '1 square = 1 g';
    return `<div class="pl-split">${pouch}<div class="pl-gridwrap">`
      + `<div class="pl-gridhead">${ICON.g}<span>100 g of powder</span><span class="pl-read__sub">${esc(meta)}</span></div>`
      + `<div class="pl-grid" role="img" aria-label="${esc(`${fmt(used)} of 100 grams filled`)}">${grid}</div>`
      + `<div class="pl-read" aria-live="polite">${read}</div></div></div>`;
  }

  // ---- the two 5 % labels ----------------------------------------------------------------------

  _five(value) {
    const [id, unit] = String(value).split(':');
    const b = FIVES.find((x) => x.id === id);
    if (!b || this._guess[id]?.ok) return;
    const ok = unit === b.top;
    this._guess[id] = { unit, ok, fresh: true };
    this._paintPane('five');
    if (ok && !this._celebrated.five && FIVES.every((x) => this._guess[x.id]?.ok)) {
      this._celebrated.five = true;
      burst(this.root.querySelector?.('.pl-fives'));
    }
  }

  _fiveCard(b) {
    const g = this._guess[b.id];
    const lit = g && !g.ok ? 0 : -1;
    const sticker = `${pctHtml('5', b.letters, lit)}<span class="pl-sticker__name">${esc(b.name)}</span>`;
    const chip = (unit) => {
      const mine = g && g.unit === unit;
      const cls = mine ? (g.ok ? ' is-yes' : ' is-no') : '';
      const mark = mine ? `<span class="pl-chip__mark" aria-hidden="true">${g.ok ? MARK.yes : MARK.no}</span>` : '';
      return `<button type="button" class="pl-chip${cls}" data-sflow-action="five" data-sflow-value="${b.id}:${unit}"`
        + `${g?.ok ? ' disabled' : ''} aria-pressed="${!!mine}">${ICON[unit]}5 ${esc(unit)}${mark}</button>`;
    };
    let out;
    if (g?.ok) {
      out = `<div class="pl-out${g.fresh ? ' is-in' : ''}">${soluteHtml(b.top, b.solute, b.tone)}`
        + `${fracHtml(`5 ${b.top} ${b.solute}`, '100 mL solution', b.top, 'mL')}</div>`;
    } else {
      out = '<div class="pl-out pl-out--wait" aria-hidden="true">?</div>';
    }
    if (g) g.fresh = false;
    return `<div class="pl-bcard" style="--c:var(--sim-series-${b.tone})">`
      + bottleHtml({ tone: b.tone, sticker, stamp: b.stamp })
      + `<div class="pl-ask"><span class="pl-ask__q">In 100 mL of it, the 5 is</span>`
      + `<div class="pl-guess">${chip('g')}${chip('mL')}</div></div>${out}</div>`;
  }

  _fivesHtml() {
    return `<div class="pl-fives">${FIVES.map((b) => this._fiveCard(b)).join('')}</div>`;
  }

  // ---- bottle size -------------------------------------------------------------------------------

  _guessSize(v) {
    if (this._sizeGuess) return;
    this._sizeGuess = v === '10' ? '10' : '5';
    this._ml = 1000;
    this._freshSize = true;
    this._paintPane('size');
  }

  onControlChange(id, v) {
    if (id !== 'size') return;
    const ml = Number(v);
    if (!SIZES.includes(ml) || ml === this._ml) return;
    this._ml = ml;
    this._freshSize = true;
    this._paintPane('size');
    setFlowChoice(this.root, 'size', String(ml));
  }

  getControlValue(id) {
    return id === 'size' ? String(this._ml) : undefined;
  }

  _sizeHtml() {
    const ml = this._ml;
    const full = Math.floor(ml / 100);
    const half = ml % 100 !== 0;
    const fresh = this._freshSize;
    this._freshSize = false;
    let slices = '';
    for (let i = 0; i < full; i++) {
      slices += `<span class="pl-slice${fresh ? ' is-new' : ''}" style="--k:${i}"><span class="pl-cube">5 g</span></span>`;
    }
    if (half) slices += `<span class="pl-slice pl-slice--half${fresh ? ' is-new' : ''}" style="--k:${full}"><span class="pl-cube"></span></span>`;
    // Body height follows the volume: 22 px per 100 mL slice, plus headroom that holds the sticker.
    const phone = this.root?.classList.contains('sim-dom-root--portrait');
    const tall = phone ? Math.round((ml / 100) * 14 + 4) : Math.round((ml / 100) * 22 + 78);
    const sticker = `${pctHtml('5', ['w', 'v'])}<span class="pl-sticker__name">Glucose</span>`;
    const bottle = bottleHtml({ tone: 1, sticker, tall, slices, stamp: `${ml} mL` });

    let side;
    if (!this._sizeGuess) {
      const chip = (v) => `<button type="button" class="pl-chip" data-sflow-action="sizeguess" data-sflow-value="${v}">${esc(v)} % w/v</button>`;
      side = `<div class="pl-ask"><span class="pl-ask__q">A 1000 mL bottle of the same infusion. Its label will read</span>`
        + `<div class="pl-guess">${chip('5')}${chip('10')}</div></div>`;
    } else {
      const ok = this._sizeGuess === '5';
      const mark = `<span class="pl-chip__mark" aria-hidden="true">${ok ? MARK.yes : MARK.no}</span>`;
      side = `<div class="pl-ask"><span class="pl-ask__q">You said</span><div class="pl-guess">`
        + `<span class="pl-chip ${ok ? 'is-yes' : 'is-no'}">${esc(this._sizeGuess)} % w/v${mark}</span></div></div>`
        + `<div class="pl-meters"><div class="pl-meter"><span class="pl-meter__k">label</span><span class="pl-meter__v">5 % w/v</span></div>`
        + `<div class="pl-meter pl-meter--moves"><span class="pl-meter__k">glucose in the bottle</span>`
        + `<span class="pl-meter__v${fresh ? ' is-new' : ''}">${esc(fmt(gramsFor(ml)))} g</span></div></div>`
        + `<div class="pl-ask"><span class="pl-ask__q">Bottle size, mL</span>${flowChoiceHtml({
          action: 'size', value: String(ml), label: 'Bottle size, mL',
          options: SIZES.map((s) => ({ value: String(s), label: String(s) })),
        })}</div>`;
    }
    return `<div class="pl-size">${bottle}<div class="pl-sizeside">${side}</div></div>`;
  }

  // ---- all three ---------------------------------------------------------------------------------

  _allHtml() {
    const q = '<span class="pl-rowq" aria-label="not decoded yet">?</span>';
    const fatDone = this._order.length > 0;
    return flowCompareHtml([
      { key: 'pouch', title: 'Milk powder', sub: 'per 100 g, w/w',
        body: `<span class="pl-rowbody">${GLYPH.pouch}${fatDone ? fracHtml('26 g fat', '100 g powder', 'g', 'g') : q}</span>` },
      { key: 'five', title: 'Glucose infusion', sub: '5 % w/v',
        body: `<span class="pl-rowbody">${GLYPH.glucose}${this._guess.glucose?.ok ? fracHtml('5 g glucose', '100 mL solution', 'g', 'mL') : q}</span>` },
      { key: 'five', title: 'White vinegar', sub: '5 % v/v',
        body: `<span class="pl-rowbody">${GLYPH.vinegar}${this._guess.vinegar?.ok ? fracHtml('5 mL acetic acid', '100 mL solution', 'mL', 'mL') : q}</span>` },
    ]);
  }

  // ---- paint -------------------------------------------------------------------------------------

  _paneBody(key) {
    if (key === 'pouch') return this._pouchHtml();
    if (key === 'five') return this._fivesHtml();
    if (key === 'size') return this._sizeHtml();
    return this._allHtml();
  }

  _frameHtml() {
    const stages = TABS.map((t) => flowStageHtml({ panel: t.key, cls: t.key === this._tab ? '' : 'is-off',
      body: `<div class="pl-pane" data-pane="${t.key}">${this._paneBody(t.key)}</div>` }));
    return `<div class="sflow">${flowTabsHtml(TABS, this._tab, 'Labels')}${flowDeckHtml(stages)}`
      + `${noteLineHtml([{ text: 'Packages redrawn from the textbook figure, not real products.' }])}</div>`;
  }

  _paintPane(key) {
    const pane = this.root?.querySelector?.(`[data-pane="${key}"]`);
    if (pane) pane.innerHTML = this._paneBody(key);
  }
}
