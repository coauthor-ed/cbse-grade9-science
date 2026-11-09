import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS, burst, applyToneInks } from 'simulations/base/kit/SimLookDom.js';
import { esc, simField, simTag } from 'simulations/base/SimUi.js';

/**
 * BuildAMachineScene - the chapter's Journey Beyond, built rather than restated.
 *
 * One job, three machines. A tray of parts on a bench, three frames that fill as
 * parts are dropped in, and a panel that measures whatever stands in a frame. The
 * panel is the claim the slide makes: the work OUT is 60 J in every build, and only
 * the numbers around it move. The shortfall - the joules a build does not hand back -
 * is measured, never explained: naming where it went is the slide's third question,
 * so nothing here names it.
 *
 * Ungraded by contract (the stub forbids a score, a timer and a win state), so there
 * is no verdict anywhere: a number posts, and the learner is left to be suspicious
 * of it.
 */

// The one job. 60 N lifted 1.0 m, so the work out is 60 J in every build - the
// quantity the slide says does not change.
const LOAD_N = 60;
const RISE_M = 1.0;
const WORK_OUT = LOAD_N * RISE_M;

// The drawing's own scale. The lever's arms and the ramp's slope are laid out at
// this many px per metre, so the ratio in the picture is the ratio in the numbers.
const PX_M = 32;
const FIG_W = 200;
const FIG_H = 124;

// The seats an arrangement handle snaps to. These are the only three numbers the
// learner can reach, and they are positions in a drawing, never typed values.
const SEATS = [2, 3, 4];

const PARTS = {
  bar: { name: 'bar', d: '<rect x="2.5" y="7" width="15" height="6" rx="2.5"/>' },
  rope: { name: 'rope', d: '<path d="M4 3 C 10 8, 10 12, 4 17"/><path d="M16 3 C 10 8, 10 12, 16 17"/>' },
  wheel: { name: 'wheel', d: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="1.8"/>' },
  wedge: { name: 'wedge', d: '<path d="M2.5 16.5 L17.5 16.5 L17.5 5 Z"/>' },
  load: { name: 'load', d: '<rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 9 h14"/><path d="M7.5 4 v13"/>' },
};
const PART_IDS = Object.keys(PARTS);

// The three frames. `wants` is the set of parts that makes the frame a machine;
// `handle` is the part the learner drags once it does. The pulley has no handle:
// one wheel and one rope is the only pulley this bench can build, so it reads 2x
// and stays there.
const FRAMES = [
  { id: 'lever', name: 'LEVER', wants: ['bar', 'wedge', 'load'], adv: 3, handle: 'effort' },
  { id: 'pulley', name: 'PULLEY', wants: ['wheel', 'rope', 'load'], adv: 2, handle: null },
  { id: 'ramp', name: 'RAMP', wants: ['wedge', 'rope', 'load'], adv: 4, handle: 'crest' },
];

// The three reflections, each a prompt with room to answer on paper. These are the
// slide's own questions in six words each - not the textbook's Journey Beyond prompt
// restated - and the scene never answers one of them.
const PROMPTS = [
  { tag: 'HELD, NOT LIFTED', q: 'which would you choose to hold it steady?' },
  { tag: 'FLATTERING ERROR', q: 'what measurement flatters this build?' },
  { tag: 'THE REST', q: 'where did the shortfall go?' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // the bench, the three empty frames, the panel at zero
  [{ idx: 1, dwellMs: null }], // the three questions; the friction dial goes live
  [{ idx: 2, dwellMs: null }], // the questions fold; the open question takes the room
];

// --- the model -----------------------------------------------------------------
// Every number on the panel is computed from the seat in the drawing, so the panel
// measures the picture. `effortN` is the force the hand must actually add: the
// force that lifts the load, plus whatever the machine rubs away on the way.
function measure(adv, frictionN) {
  const effortN = LOAD_N / adv + frictionN;
  const pullM = adv * RISE_M;
  const workIn = effortN * pullM;
  return { adv, effortN, pullM, workIn, shortJ: workIn - WORK_OUT, shown: LOAD_N / effortN };
}

// Static, so nothing is rubbing: a free pivot and a free-running rope have no latch
// and need a hand for ever. A ramp's downhill pull is the same force, and the
// friction dial is the grip against it - so a shallow ramp on a rough bearing holds
// by itself, which is the whole answer to the held-versus-lifted question.
function holdOf(frame, adv, frictionN) {
  const pull = LOAD_N / adv;
  if (frame.handle === 'crest') return frictionN >= pull ? { self: true, forceN: 0 } : { self: false, forceN: pull - frictionN };
  return { self: false, forceN: pull };
}

const n1 = (v) => v.toFixed(1);
const n0 = (v) => String(Math.round(v));

// simField escapes and lays out the field; the lead class only marks the two
// numbers the stub names as the measured ones.
const field = (label, value, lead) => simField(label, value).replace('class="sim-field"', `class="sim-field${lead ? ' bm-lead' : ''}"`);

// --- the three drawings --------------------------------------------------------
function partSvg(id, inner, placed) {
  return `<g class="bm-part bm-part--${id}${placed ? '' : ' bm-part--off'}" data-part="${id}">${inner}</g>`;
}

// The lever. The load arm is one rise (1.0 m) and the effort arm is the seat, both
// at PX_M, so the bar really is longer when the advantage is bigger.
function leverFig(placed, adv) {
  const px = 44;
  const x0 = px - PX_M;
  const x1 = px + adv * PX_M;
  const barY = 56;
  return `
    <line class="bm-floor" x1="4" y1="112" x2="196" y2="112"/>
    ${partSvg('wedge', `<path class="bm-fill" d="M30 80 L58 80 L44 63 Z"/>`, placed.wedge)}
    ${partSvg('bar', `<rect class="bm-fill" x="${x0}" y="${barY}" width="${x1 - x0}" height="7" rx="3.5"/>`, placed.bar)}
    ${partSvg('load', `<line class="bm-line" x1="${x0}" y1="${barY + 7}" x2="${x0}" y2="74"/>
      <rect class="bm-fill" x="${x0 - 11}" y="74" width="22" height="19" rx="2"/>`, placed.load)}
    <line class="bm-dim" x1="${x0}" y1="99" x2="${px}" y2="99"/>
    <line class="bm-dim" x1="${px}" y1="99" x2="${x1}" y2="99"/>
    <line class="bm-dim" x1="${x0}" y1="95" x2="${x0}" y2="103"/>
    <line class="bm-dim" x1="${px}" y1="95" x2="${px}" y2="103"/>
    <line class="bm-dim" x1="${x1}" y1="95" x2="${x1}" y2="103"/>
    <circle class="bm-ring" cx="${x1}" cy="46" r="12"/>
    <path class="bm-force" d="M${x1} 14 L${x1} 26"/><path class="bm-force" d="M${x1 - 5.5} 21 L${x1} 27 L${x1 + 5.5} 21"/>`;
}

// The pulley. Rope tied off at the ceiling, round the wheel the load hangs from, up
// over the fixed eye and down to the hand: two parts on the load, and the only
// reeving this bench can make. The rope is not to scale.
function pulleyFig(placed) {
  return `
    <rect class="bm-ceil" x="14" y="8" width="172" height="9" rx="2"/>
    <circle class="bm-eye" cx="36" cy="21" r="3.2"/>
    <circle class="bm-eye" cx="84" cy="21" r="3.2"/>
    ${partSvg('rope', `<path class="bm-rope" d="M36 21 L45 66 A15 15 0 0 0 75 66 L84 21 M87.4 22.6 L92 82"/>`, placed.rope)}
    ${partSvg('wheel', `<circle class="bm-whl" cx="60" cy="66" r="15"/>
      <line class="bm-line" x1="60" y1="54" x2="60" y2="78"/><line class="bm-line" x1="48" y1="66" x2="72" y2="66"/>
      <line class="bm-line" x1="60" y1="81" x2="60" y2="88"/>`, placed.wheel)}
    ${partSvg('load', `<rect class="bm-fill" x="42" y="88" width="36" height="20" rx="2"/>
      <line class="bm-line" x1="50" y1="88" x2="50" y2="108"/><line class="bm-line" x1="70" y1="88" x2="70" y2="108"/>`, placed.load)}
    <line class="bm-floor" x1="4" y1="112" x2="196" y2="112"/>
    <path class="bm-force" d="M92 90 L92 102"/><path class="bm-force" d="M86.5 97 L92 103 L97.5 97"/>`;
}

// The ramp. The height is the rise and the length is the seat, so a bigger
// advantage is a visibly shallower slope for the same 1.0 m of lift.
function rampFig(placed, adv) {
  const x0 = 20;
  const x1 = x0 + adv * PX_M;
  const yTop = 112 - PX_M;
  const cx = x0 + 0.62 * (x1 - x0);
  const cy = 112 - 0.62 * PX_M;
  const deg = -(Math.atan2(PX_M, x1 - x0) * 180) / Math.PI;
  return `
    <line class="bm-floor" x1="4" y1="112" x2="196" y2="112"/>
    ${partSvg('wedge', `<path class="bm-fill" d="M${x0} 112 L${x1} 112 L${x1} ${yTop} Z"/>`, placed.wedge)}
    ${partSvg('load', `<g transform="rotate(${deg.toFixed(2)} ${cx} ${cy})">
      <rect class="bm-fill" x="${cx - 11}" y="${cy - 18}" width="22" height="18" rx="2"/>
      <line class="bm-line" x1="${cx}" y1="${cy - 18}" x2="${cx}" y2="${cy - 26}"/></g>`, placed.load)}
    <line class="bm-post" x1="${x1 + 12}" y1="112" x2="${x1 + 12}" y2="42"/>
    <circle class="bm-eye" cx="${x1 + 12}" cy="42" r="3.2"/>
    ${partSvg('rope', `<path class="bm-rope" d="M${cx} ${cy - 26} L${x1 + 12} 42 M${x1 + 15.4} 44.6 L${x1 + 24} 96"/>`, placed.rope)}
    <path class="bm-force" d="M${x1 + 24} 100 L${x1 + 24} 110"/><path class="bm-force" d="M${x1 + 18.5} 105 L${x1 + 24} 111 L${x1 + 29.5} 105"/>`;
}

function figureHtml(frame) {
  if (frame.id === 'lever') return leverFig(frame.placed, frame.adv);
  if (frame.id === 'pulley') return pulleyFig(frame.placed);
  return rampFig(frame.placed, frame.adv);
}

// Where the draggable handle sits in the drawing, in figure units. One rule for
// both frames: the seat the learner is holding.
function handleAt(frame, adv) {
  if (frame.id === 'lever') return { x: 44 + adv * PX_M, y: 46 };
  if (frame.id === 'ramp') return { x: 20 + adv * PX_M, y: 112 - PX_M };
  return null;
}

const SVG = (inner) => `<svg class="bm-svg" viewBox="0 0 ${FIG_W} ${FIG_H}" aria-hidden="true" focusable="false">${inner}</svg>`;
const CHIP_SVG = (id) => `<svg class="bm-chipgl" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PARTS[id].d}</svg>`;

const CSS = SIM_LOOK_DOM_CSS + `
/* applyToneInks() sets the real per-theme value on the root at mount; this is the
   pre-mount default so the chip is legible for the frame before that runs. */
.sim-dom-root { --sim-ink-on-good: var(--sim-bg-deep); }
.bm-card { gap: 10px; }
/* The tray. One of each part, and it never empties: dropping the bar into the lever
   does not take the bar off the bench, because a bench has more than one. */
.bm-bench { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sim-space-2); }
.bm-chip { display: inline-flex; align-items: center; gap: 6px; padding: var(--sim-space-1) var(--sim-space-3); border: var(--sim-border); border-radius: var(--sim-radius-pill); background: var(--sim-bg-deep); color: var(--sim-label); font: inherit; font-size: var(--sim-text-sm); font-weight: 700; cursor: grab; touch-action: none; transition: transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1), border-color 160ms ease, background-color 160ms ease; }
.bm-chip:hover { transform: translateY(-2px); }
.bm-chip:focus-visible { outline: 2px solid var(--sim-accent); outline-offset: 2px; }
.bm-chipgl { width: 20px; height: 20px; flex: none; }
.bm-chip--bar { color: var(--sim-series-2-ink); }
.bm-chip--rope { color: var(--sim-series-1-ink); }
.bm-chip--wheel { color: var(--sim-series-5-ink); }
.bm-chip--wedge { color: var(--sim-series-8-ink); }
.bm-chip--load { color: var(--sim-series-6-ink); }
.bm-hint { font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.bm-chip.is-held { background: var(--sim-surface-raised); border-color: currentColor; transform: translateY(-2px) scale(1.04); }

/* Three builds, side by side, because the claim is a comparison. */
.bm-frames { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sim-space-2); align-items: start; }
.bm-frame { position: relative; display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: var(--sim-space-2); border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-md); background: var(--sim-bg-deep); transition: border-color 200ms ease, background-color 200ms ease; }
.bm-frame.is-over { border-color: var(--sim-accent); background: var(--sim-surface-raised); }
.bm-frame.is-full { border-color: color-mix(in oklab, var(--sim-success) 70%, var(--sim-stroke)); }
/* A frame that is waiting for the part in your hand says so before you drop it. */
.bm-frame.is-wants { border-color: var(--sim-accent); border-style: dashed; }
.bm-framename { align-self: flex-start; }

.bm-fig { position: relative; width: 100%; max-width: 180px; margin: 0 auto; }
.bm-svg { display: block; width: 100%; height: auto; }
.bm-floor { stroke: color-mix(in oklab, var(--sim-label) 34%, transparent); stroke-width: 3; stroke-linecap: round; }
.bm-ceil, .bm-post { fill: none; stroke: color-mix(in oklab, var(--sim-label) 40%, transparent); stroke-width: 3; }
.bm-eye { fill: var(--sim-bg-surface); stroke: color-mix(in oklab, var(--sim-label) 45%, transparent); stroke-width: 2; }
.bm-dim { stroke: color-mix(in oklab, var(--sim-label) 30%, transparent); stroke-width: 1.6; stroke-dasharray: 3 3; }
.bm-ring { fill: none; stroke: var(--sim-accent); stroke-width: 2; stroke-dasharray: 4 4; opacity: 0.85; }
.bm-force { fill: none; stroke: var(--sim-accent); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
.bm-line { stroke: currentColor; stroke-width: 2; }
.bm-fill { fill: color-mix(in oklab, currentColor 30%, var(--sim-bg-surface)); stroke: currentColor; stroke-width: 2.2; stroke-linejoin: round; }
.bm-rope { fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }
.bm-whl { fill: color-mix(in oklab, currentColor 22%, var(--sim-bg-surface)); stroke: currentColor; stroke-width: 2.6; }
.bm-part--bar { color: var(--sim-series-2-ink); }
.bm-part--rope { color: var(--sim-series-1-ink); }
.bm-part--wheel { color: var(--sim-series-5-ink); }
.bm-part--wedge { color: var(--sim-series-8-ink); }
.bm-part--load { color: var(--sim-series-6-ink); }
/* A part that has not been placed is a dashed outline: the frame says what it is
   still missing instead of hiding the seat. */
.bm-part--off { color: color-mix(in oklab, var(--sim-label) 46%, transparent); }
.bm-part--off .bm-fill, .bm-part--off .bm-whl { fill: none; stroke-dasharray: 4 3; }
.bm-part--off .bm-rope { stroke-dasharray: 4 3; }

.bm-handle { position: absolute; width: 26px; height: 26px; margin: -13px 0 0 -13px; padding: 0; border: 3px solid var(--sim-accent); border-radius: 50%; background: color-mix(in oklab, var(--sim-accent) 34%, var(--sim-bg-surface)); cursor: ew-resize; touch-action: none; transition: left 260ms cubic-bezier(0.34, 1.56, 0.64, 1), top 260ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 160ms ease; }
.bm-handle:hover { background: var(--sim-accent); }
.bm-handle:focus-visible { outline: 2px solid var(--sim-label); outline-offset: 2px; }
.bm-handle[disabled] { display: none; }
.bm-handle.is-set { background: var(--sim-accent); }

.bm-fields { display: flex; flex-direction: column; gap: 3px; }
.bm-frame .sim-field { min-height: 24px; padding: 1px var(--sim-space-1); font-size: var(--sim-text-sm); border-radius: 6px; gap: var(--sim-space-1); }
/* The unit stays on the number's line: the shared sim-field wraps anywhere, which
   is right for prose but splits "25 N" across two lines in a two-up row and grows
   the frame for nothing. */
.bm-frame .sim-field__value { overflow-wrap: normal; white-space: nowrap; }
/* Every measured number gets a line of its own. A two-up row was tried and does not
   fit: at this column width "effort" plus "40 N" needs about 100 px of the 85 px a
   half-column gets, so the unit either wrapped to its own line or overflowed. */
.bm-frame .sim-field__label { font-size: var(--sim-text-sm); }
.bm-lead { border-color: var(--sim-accent); }

.bm-hold { display: flex; align-items: center; gap: var(--sim-space-2); }
.bm-holdbtn { flex: none; padding: 3px var(--sim-space-3); border: 2px solid var(--sim-accent); border-radius: var(--sim-radius-pill); background: var(--sim-bg-surface); color: var(--sim-label); font: inherit; font-size: var(--sim-text-sm); font-weight: 800; letter-spacing: 0.06em; cursor: pointer; }
.bm-holdbtn:hover { background: var(--sim-surface-raised); }
.bm-holdbtn:focus-visible { outline: 2px solid var(--sim-label); outline-offset: 2px; }
.bm-holdbtn[disabled] { opacity: 0.4; cursor: default; }
.bm-holdout { font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); }
.bm-holdout.is-self { color: var(--sim-success); }

/* The panel: the job, the one number that never moves, the learner's friction, and
   the chip that lights only when all three builds have been measured. */
.bm-panel { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: var(--sim-space-2); }
.bm-panel .sim-field { flex: 1 1 132px; font-size: var(--sim-text-sm); min-height: 32px; padding: 1px var(--sim-space-2); }
.bm-scale { flex: 1 1 100%; margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.sim-dom-root[data-step="2"] .bm-line-blank { display: none; }
.bm-claim { margin-left: auto; border-color: var(--sim-stroke); color: var(--sim-label-muted); transition: background-color 260ms ease, color 260ms ease, border-color 260ms ease; }
/* The lit chip is the one celebration in the panel and the whole point of the
   comparison, so it gets a solid success fill with the ink that tone wants in this
   theme - never --sim-bg-deep, which is near-white on the light theme's mid green
   and lands under 3:1. --sim-ink-on-good is set by applyToneInks below. */
.bm-claim.is-lit { background: var(--sim-success); border-color: var(--sim-success); color: var(--sim-ink-on-good, var(--sim-label)); font-weight: 800; }

/* The three questions, one card, each on one ruled line: the question, then the
   space to answer it on. They are prompts, not a test - nothing here is scored. The
   closing beat adds a fourth line and drops the rules, the answering being done. */
.bm-prompts { gap: var(--sim-space-1); }
.bm-prompt { display: flex; align-items: center; gap: var(--sim-space-2); }
.bm-prompt .sim-tag { flex: none; padding: 1px var(--sim-space-2); border-radius: var(--sim-radius-sm); font-size: var(--sim-text-sm); letter-spacing: 0.05em; }
.bm-q { margin: 0; font-size: var(--sim-text-sm); font-weight: 700; line-height: 1.3; }
.bm-prompt .bm-q { flex: 0 1 auto; }
.bm-line-blank { flex: 1 1 90px; min-width: 40px; height: 0; align-self: center; border-top: 2px dashed color-mix(in oklab, var(--sim-label) 30%, transparent); }
.bm-open { border-top: 2px solid var(--sim-stroke); padding-top: var(--sim-space-1); }
.bm-open .bm-q { flex: 1 1 auto; }
.sim-dom-root--portrait .bm-frames { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .bm-prompt { flex-wrap: wrap; }
.sim-dom-root--portrait .bm-line-blank { flex: 1 1 100%; }
.sim-dom-root--portrait .bm-claim { margin-left: 0; }
`;

function frameHtml(f) {
  return `<section class="bm-frame" data-frame="${f.id}" data-full="0" tabindex="0" role="group" aria-label="${esc(f.name)} build frame">
    <span class="sim-tag bm-framename" data-name>${esc(f.name)}</span>
    <div class="bm-fig" data-fig>${SVG(figureHtml(f))}
      <button type="button" class="bm-handle" data-handle aria-label="Slide the effort along the bar. Left and right arrows move it between the three seats."></button>
    </div>
    <div class="bm-fields" data-fields></div>
    <div class="bm-hold"><button type="button" class="bm-holdbtn" data-hold disabled>HOLD</button><span class="bm-holdout" data-holdout>not tested</span></div>
  </section>`;
}

export class BuildAMachineScene extends DomSimulation {
  static WIDTH = 680;
  // sim-layout naturals: landscape 484 / 652 / 716, portrait 1156 / 1454 / 1726 by
  // beat. FIT sizes the frame to whichever of those is showing; these are the
  // tallest (beat 2, prompts and the open row on), and the pre-mount hint. The
  // frames grew a row when the two-up effort/pull pair became two stacked lines.
  static HEIGHT = 716;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1726;
  static MIN_SCALE = 1.15;  // a 680x716 frame: full width below the text
  static FIT = true;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A bench of five parts - bar, rope, wheel, wedge and a load - and three empty build frames for a lever, a pulley and a ramp. Drag a part onto a frame to fill it, and the panel measures what you built: the effort and the distance you moved it multiply out to more than the 60 joules of useful work, and the difference posts as a shortfall. A friction dial raises the shortfall. Each build has a Hold button that shows how much force a hand must keep on it to stop it moving.';
  static CONTROLS = [
    { type: 'slider', id: 'friction', label: 'Friction in the machine:', min: 0, max: 20, step: 5, value: 5, suffix: ' N' },
  ];

  async setup() {
    await super.setup();
    this._friction = 5;
    this._held = null;
    this._drag = null;
    this._seatDrag = null;
    this._claimed = false;
    this._els = [];
    this._frames = FRAMES.map((f) => ({ id: f.id, name: f.name, wants: f.wants, handle: f.handle, adv: f.adv, placed: {}, full: false, held: false, celebrated: false }));
    this._onMove = (e) => this._move(e);
    this._onUp = (e) => this._up(e);
    this._onCancel = () => this._unbind();
    this._onKey = (e) => { if (e.key === 'Escape' && this._held) { this._held = null; this._paintBench(); } };

    this.render({
      css: CSS,
      html: `<div class="sim-card sl-backdrop bm-card">
        <div class="bm-bench" data-bench role="group" aria-label="Parts on the bench">
          ${PART_IDS.map((id) => `<button type="button" class="bm-chip bm-chip--${id}" data-chip="${id}" aria-pressed="false">${CHIP_SVG(id)}<span>${esc(PARTS[id].name)}</span></button>`).join('')}
          <span class="bm-hint">drag one onto a frame</span>
        </div>
        <div class="bm-frames">${this._frames.map(frameHtml).join('')}</div>
        <div class="bm-panel">
          ${simField('the job', `${LOAD_N} N x ${n1(RISE_M)} m`)}
          ${simField('work out', `${WORK_OUT} J`)}
          ${simField('friction', `${this._friction} N`)}
          <span class="sim-tag bm-claim" data-claim>0 of 3 measured</span>
          <p class="bm-scale">the lever and the ramp are drawn to scale</p>
        </div>
        <article class="sim-card bm-prompts" data-prompts hidden>${PROMPTS.map((p) => `<div class="bm-prompt">
          ${simTag(p.tag, { accent: true })}<p class="bm-q">${esc(p.q)}</p>
          <i class="bm-line-blank"></i></div>`).join('')}
          <div class="bm-prompt bm-open" data-open hidden>
            ${simTag('STILL OPEN')}<p class="bm-q">a form of energy that exchanges with no other form at all</p>
            <span class="sim-q" aria-hidden="true">?</span>
          </div>
        </article>
      </div>`,
    });

    for (const id of PART_IDS) {
      const chip = this.root?.querySelector?.(`[data-chip="${id}"]`);
      if (!chip) continue;
      chip.addEventListener('pointerdown', (e) => this._pdown(e));
      chip.addEventListener('click', () => this._pick(chip));
    }
    for (let i = 0; i < this._frames.length; i++) this._wire(i);
    this._rootKey = (e) => this._onKey(e);
    this.root?.addEventListener?.('keydown', this._rootKey);
    // The lit claim chip and the part chips colour their text by tone, so the ink
    // on those fills has to be recomputed whenever the theme changes.
    applyToneInks(this.root);
    this._paintAll();
    this.onStep();
  }

  refreshTheme() { if (this.root) applyToneInks(this.root); }

  // ---- wiring -----------------------------------------------------------------

  _wire(i) {
    const f = this._frames[i];
    const el = this.root?.querySelector?.(`[data-frame="${f.id}"]`);
    if (!el) return;
    const fig = el.querySelector('[data-fig]');
    const handle = el.querySelector('[data-handle]');
    // The pulley has no handle: one wheel and one rope is the only pulley this
    // bench can build, so it reads 2x and stays there.
    if (!f.handle) handle.remove();
    else {
      handle.addEventListener('pointerdown', (e) => this._hdown(e, f, handle));
      handle.addEventListener('keydown', (e) => this._hkey(e, f));
    }
    el.addEventListener('click', () => this._place(f));
    el.addEventListener('keydown', (e) => this._frameKey(e, f));
    el.querySelector('[data-hold]')?.addEventListener('click', () => this._holdTest(f));
    this._els.push({
      f, el, fig, handle: f.handle ? handle : null,
      fields: el.querySelector('[data-fields]'),
      hold: el.querySelector('[data-hold]'),
      holdOut: el.querySelector('[data-holdout]'),
    });
  }

  // ---- parts ------------------------------------------------------------------

  _pick(chip) {
    const id = chip.dataset.chip;
    this._held = this._held === id ? null : id;
    this._paintBench();
  }

  // A press is not yet a pick-up: the part is picked up when the pointer actually
  // moves (a drag) or by the click that follows it (a tap, and Enter on a focused
  // chip). Doing both would cancel each other out on a plain click.
  _pdown(e) {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault?.();
    this._drag = { id: e.currentTarget?.dataset?.chip || null, x: e.clientX, y: e.clientY, pid: e.pointerId };
    this.root?.addEventListener?.('pointermove', this._onMove);
    this.root?.addEventListener?.('pointerup', this._onUp);
    this.root?.addEventListener?.('pointercancel', this._onCancel);
  }

  _unbind() {
    this.root?.removeEventListener?.('pointermove', this._onMove);
    this.root?.removeEventListener?.('pointerup', this._onUp);
    this.root?.removeEventListener?.('pointercancel', this._onCancel);
  }

  _over(e) {
    const x = e.clientX;
    const y = e.clientY;
    for (const h of this._els) {
      const r = h.el?.getBoundingClientRect?.();
      if (r && r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return h.f;
    }
    return null;
  }

  _move(e) {
    if (this._seatDrag) {
      this._seatAt(e, this._seatDrag.f);
      return;
    }
    const g = this._drag;
    if (!g) return;
    if (!this._held && (Math.abs((e.clientX ?? g.x) - g.x) > 4 || Math.abs((e.clientY ?? g.y) - g.y) > 4)) {
      this._held = g.id;
      this._paintBench();
    }
    if (!this._held) return;
    const over = this._over(e);
    for (const h of this._els) h.el?.classList?.toggle?.('is-over', !!over && over.id === h.f.id);
  }

  _up(e) {
    this._unbind();
    this._drag = null;
    this._seatDrag = null;
    if (!this._held) return;
    const over = this._over(e);
    for (const h of this._els) h.el?.classList?.remove?.('is-over');
    // _place reads _held and is what clears it, so the drop must not clear it
    // first - doing so made the drag place nothing at all, and the drag is the
    // interaction the bench caption tells the learner to use.
    if (over) this._place(over);
  }

  _frameKey(e, f) {
    // Only the frame itself; the handle and the HOLD button carry their own keys.
    if (e.target !== e.currentTarget) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault?.();
    this._place(f);
  }

  // A part goes into a frame only if that frame is waiting for it. The tray keeps
  // its parts: a bench has more than one bar.
  _place(f) {
    const part = this._held;
    if (!part || !f.wants.includes(part) || f.placed[part]) return false;
    // The part is in the frame now, so it is out of hand. Clearing here and not
    // only in the drop path is what stops a tapped build from leaving the chip lit
    // and one frame stuck in the dashed "waiting for this" state for ever.
    this._held = null;
    f.placed[part] = true;
    const full = f.wants.every((p) => f.placed[p]);
    const first = full && !f.full;
    f.full = full;
    this._paint(f);
    this._paintPanel();
    this._paintBench();
    if (first) {
      f.celebrated = true;
      burst(this._els.find((h) => h.f.id === f.id)?.el);
      if (this._frames.every((x) => x.full) && !this._claimed) {
        this._claimed = true;
        burst(this.root?.querySelector?.('.bm-panel'));
      }
    }
    return true;
  }

  // ---- the arrangement handle ---------------------------------------------------

  _hdown(e, f, handle) {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault?.();
    e.stopPropagation?.();
    try { handle.setPointerCapture?.(e.pointerId); } catch { /* synthetic event */ }
    this._seatDrag = { f, handle, pid: e.pointerId };
    this._drag = null;
    handle.classList.add('is-set');
    this.root?.addEventListener?.('pointermove', this._onMove);
    this.root?.addEventListener?.('pointerup', this._onUp);
    this.root?.addEventListener?.('pointercancel', this._onCancel);
    this._seatAt(e, f);
  }

  _seatAt(e, f) {
    const h = this._els.find((x) => x.f.id === f.id);
    const r = h?.fig?.getBoundingClientRect?.();
    if (!r || !r.width) return;
    const fx = ((e.clientX - r.left) / r.width) * FIG_W;
    let best = f.adv;
    let bd = Infinity;
    for (const a of SEATS) {
      const d = Math.abs(handleAt(f, a).x - fx);
      if (d < bd) { bd = d; best = a; }
    }
    if (best === f.adv) return;
    f.adv = best;
    this._paint(f);
    this._paintPanel();
  }

  _hkey(e, f) {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (!dir) return;
    const i = SEATS.indexOf(f.adv);
    const j = i + dir;
    // At a seat end the key is left alone so it still moves the slide.
    if (j < 0 || j >= SEATS.length) return;
    e.preventDefault?.();
    f.adv = SEATS[j];
    this._paint(f);
    this._paintPanel();
  }

  // ---- the hold test ------------------------------------------------------------

  _holdTest(f) {
    if (!f.full || f.held) return;
    f.held = true;
    this._paint(f);
  }

  // ---- controls -----------------------------------------------------------------

  isControlHidden(id) {
    // The dial is the learner's, and it only exists once there is something to put
    // friction into: beat 0 is the bench and the empty frames.
    return id === 'friction' && this.stepIndex === 0;
  }

  onControlChange(id, v) {
    if (id !== 'friction' || this.isControlHidden(id)) return;
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    this._friction = Math.max(0, Math.min(20, n));
    this._paintAll();
    this._paintPanel();
  }

  // ---- painting -----------------------------------------------------------------

  onStep() {
    const step = this.stepIndex;
    const prompts = this.root?.querySelector?.('[data-prompts]');
    const open = this.root?.querySelector?.('[data-open]');
    if (prompts) prompts.hidden = step < 1;
    if (open) open.hidden = step < 2;
    this.requestUiUpdate?.();
    this._paintAll();
  }

  _paintAll() {
    for (const f of this._frames) this._paint(f);
    this._paintPanel();
    this._paintBench();
  }

  _paintBench() {
    for (const id of PART_IDS) {
      const chip = this.root?.querySelector?.(`[data-chip="${id}"]`);
      if (!chip) continue;
      const on = this._held === id;
      chip.classList?.toggle?.('is-held', on);
      chip.setAttribute?.('aria-pressed', on ? 'true' : 'false');
    }
    for (const h of this._els) {
      h.el?.classList?.toggle?.('is-wants', !!this._held && h.f.wants.includes(this._held) && !h.f.placed[this._held]);
    }
  }

  _paint(f) {
    const h = this._els.find((x) => x.f.id === f.id);
    if (!h) return;
    const m = measure(f.adv, this._friction);
    // The drawing is rebuilt from the frame's own state, so a placed part stops
    // being a ghost and a moved seat re-lays the bar or the slope. Cached on the
    // string, because a re-paint with nothing new must not restart the CSS
    // transitions on the part that just landed.
    const svg = h.fig?.querySelector?.('.bm-svg');
    if (svg) {
      const next = figureHtml(f);
      if (h.figHtml !== next) { svg.innerHTML = next; h.figHtml = next; }
    }
    if (h.handle) {
      const at = handleAt(f, f.adv);
      h.handle.style.left = `${((at.x / FIG_W) * 100).toFixed(2)}%`;
      h.handle.style.top = `${((at.y / FIG_H) * 100).toFixed(2)}%`;
      h.handle.disabled = !f.full;
      h.handle.classList?.toggle?.('is-set', f.full);
      h.handle.setAttribute?.('aria-label', f.id === 'lever'
        ? `The effort, slid out to ${f.adv} times the load's arm. Left and right arrows move it.`
        : `The top of the ramp, ${n1(f.adv * RISE_M)} metres long for a 1.0 metre rise. Left and right arrows move it.`);
    }
    if (h.fields) {
      // The effort force is always a whole number here (60 over 2, 3 or 4, plus a
      // friction stop of 5), so it is shown as one.
      h.fields.innerHTML = f.full
        ? field('advantage', `${n1(m.shown)}\u00D7`, true)
        + field('effort', `${n0(m.effortN)} N`)
        + field('pull', `${n1(m.pullM)} m`)
        + field('work in', `${n0(m.workIn)} J`)
        + field('shortfall', `${n0(m.shortJ)} J`, true)
        : field('advantage', '0.0\u00D7', true)
        + simField('effort', null)
        + simField('pull', null)
        + simField('work in', null) + field('shortfall', '0 J', true);
    }
    h.el?.classList?.toggle?.('is-full', f.full);
    h.el?.setAttribute?.('data-full', f.full ? '1' : '0');
    if (h.hold) h.hold.disabled = !f.full;
    if (h.holdOut) {
      const held = holdOf(f, f.adv, this._friction);
      if (!f.full || !f.held) {
        h.holdOut.textContent = f.full ? 'not tested' : 'not built';
        h.holdOut.classList?.remove?.('is-self');
      } else {
        h.holdOut.textContent = held.self ? 'holds itself, 0 N' : `needs ${n0(held.forceN)} N, always`;
        h.holdOut.classList?.toggle?.('is-self', held.self);
      }
    }
  }

  _paintPanel() {
    const panel = this.root?.querySelector?.('.bm-panel');
    if (!panel) return;
    const f = panel.querySelectorAll?.('.sim-field');
    if (f && f.length >= 3) {
      const v = f[2]?.querySelector?.('.sim-field__value');
      if (v && v.textContent !== `${this._friction} N`) v.textContent = `${this._friction} N`;
    }
    const claim = panel.querySelector?.('[data-claim]');
    if (!claim) return;
    const n = this._frames.filter((x) => x.full).length;
    const text = n === 3 ? `${WORK_OUT} J out in all three` : `${n} of 3 measured`;
    if (claim.textContent !== text) claim.textContent = text;
    claim.classList?.toggle?.('is-lit', n === 3);
  }

  destroy() {
    this._unbind();
    this._frames = null;
    this._els = null;
    this._held = null;
    this._drag = null;
    this._seatDrag = null;
    this._onMove = null;
    this._onUp = null;
    this._onCancel = null;
    this._onKey = null;
    super.destroy();
  }
}
