// TwoDebtsScene.js
//
// The chapter's payoff opener: the two accounts L04 left on a shelf, now on one
// live object with a Release between them. The whole slide is one press, so
// there is one beat and nothing to rebuild - the panel opens with the ball on
// the ledge, HEIGHT lit and reading, MOTION lit and reading nothing, and the
// fall it triggers is the content.
//
// The stub names the sum as a fixed-width bar and names the panels as the
// evidence, so the bar is one flex track whose two segments always sum to its
// full width and no figure is ever printed on it. Nothing here says why the
// trade happens: that is blk-l05-s04's beat, and naming it here would spend a
// lesson's worth of vocabulary one slide early.

import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS, noteCardHtml } from 'simulations/base/kit/SimLookDom.js';
import { esc } from 'simulations/base/SimUi.js';

// The ball and g are L04's own (TwoAccountsScene parks its meters at
// MASS 0.5 kg, G 10 N/kg, and this slide is what pays that off), so the
// default here reads the same 10.0 J that lesson's panel did.
const MASS_KG = 0.5;
const G = 10; // N per kg
const PER_M = MASS_KG * G; // J per metre of height: 5

// The one dial: how high the ledge is. It is dragged on the marker, not read
// off a control bar, because the stub makes the drag the dial. 0.5 m to 2.5 m
// in 0.1 m steps; the start is the height that makes the figure 10.0 J.
const H_MIN = 0.5;
const H_MAX = 2.5;
const H_STEP = 0.1;
const H_START = 2.0;

// The hero's own drawing space. One viewBox, one ground line, one shelf, one
// ball, so "the same object at two heights" is one function called twice
// rather than two drawings kept in step by hand. No text inside: a 14px label
// in a 150-unit box lands under the ground once the card is scaled down.
const VB_W = 150;
const VB_H = 204;
const GROUND_Y = 172;
const PX_PER_M = 56;
const BALL_R = 13;
const BALL_CX = 58;
const WALL_X0 = 8;
const WALL_X1 = 24;
const WALL_TOP = 18;
const SHELF_X0 = 24;
const SHELF_X1 = 104;
const SHELF_T = 9;
const MARK_X = 122;

// The fall: 30 ticks of a quadratic, so the ball leaves the shelf slowly and
// arrives fast - constant acceleration from rest, drawn about five times
// slower than life so the trade is legible. Every figure on the panel is a
// function of the ball's HEIGHT, never of this clock, so slowing the fall
// changes nothing a learner can read.
const TICK_MS = 50;
const FALL_MS = 1500;

const DOT = '\u00b7'; // middle dot, kept as an escape per the repo's ASCII rule

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // the arrangement the slide opens on
];

const NOTE_ROWS = [
  { text: 'The wide bar is the two panels added together.', sub: 'its ends never move - only the line between the two colours does' },
  { text: 'MOTION reads nothing until the ball is let go.', sub: 'a ball on a ledge is holding one account, not two' },
  { text: 'The fall is slowed so the trade can be seen.', sub: 'both figures follow the height, not a clock' },
];

const CSS = `
/* The frame is narrower than the viewport on a phone, so the layout below
   asks about this card, not about the window. */
.td-root { container-type: inline-size; container-name: td; }
.td-card { gap: var(--sim-space-3); }
.td-head { gap: var(--sim-space-2); }
.td-sq { border-radius: var(--sim-radius-sm); letter-spacing: 0.06em; white-space: nowrap; }
.td-sq--lit { border-color: var(--sim-accent); color: var(--sim-accent); }

.td-main { display: grid; grid-template-columns: 206px minmax(0, 1fr); gap: var(--sim-space-3); align-items: start; }
.td-hero { display: flex; flex-direction: column; gap: var(--sim-space-2); min-width: 0; }
.td-svg { width: 100%; height: auto; display: block; }
/* The apparatus stands in a room, not in a void: a back panel behind the wall
   and the shelf, and a floor band under the ground line. Both are derived from
   tokens so they hold in either theme. */
.td-back { fill: var(--sim-bg-deep); }
.td-room { fill: var(--sim-track); }
.td-ground { fill: color-mix(in oklab, var(--sim-stroke) 26%, var(--sim-bg-deep)); }
.td-groundlip { stroke: var(--sim-stroke); stroke-width: 3; }
.td-wall { fill: var(--sim-stroke); }
.td-tick { stroke: var(--sim-label-muted); stroke-width: 2; stroke-linecap: round; opacity: 0.45; }
.td-shelf { fill: var(--sim-wedge); }
.td-brace { fill: var(--sim-stroke); }
.td-mark-line { stroke: var(--sim-label-muted); stroke-width: 3; stroke-linecap: round; }
.td-mark-cap { stroke: var(--sim-label-muted); stroke-width: 3; stroke-linecap: round; }
.td-hint { fill: var(--sim-label-muted); opacity: 0.75; }
.td-ball-c { fill: var(--sim-series-2); stroke: var(--sim-border); stroke-width: 2; }
.td-ball-hi { fill: var(--sim-bg-surface); opacity: 0.5; }
.td-shadow { fill: var(--sim-label); opacity: 0.2; }
/* The ball is the hero and the only thing in the panel that moves on its own,
   so it is given a face: a calm smile on the ledge, wide eyes and an open
   mouth once it is falling, which is the acceleration read on the object
   itself rather than on any printed number. */
.td-squash { transition: transform 140ms cubic-bezier(0.34, 1.5, 0.5, 1); }
.td-eye, .td-mouth { fill: var(--sim-bg-deep); }
.td-mouth-line { fill: none; stroke: var(--sim-bg-deep); stroke-width: 2; stroke-linecap: round; }
.td-face--run { display: none; }
[data-running="1"] .td-face { display: none; }
[data-running="1"] .td-face--run { display: block; }
@media (prefers-reduced-motion: reduce) {
  .td-squash { transition: none; }
}
.td-grip { fill: none; pointer-events: all; cursor: ns-resize; }
.td-grip:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: -3px; }

.td-side { display: flex; flex-direction: column; gap: var(--sim-space-3); min-width: 0; }
.td-panels { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: var(--sim-space-3); align-items: stretch; }

/* Both panels are lit from the first frame and stay lit: the slide says so
   twice, and a panel that dims is the one thing that would make the reading
   look like a state rather than a fact. */
.td-panel { gap: var(--sim-space-2); }
.td-panel .sim-card { border-color: var(--sim-accent); box-shadow: 0 var(--sim-lift) 0 var(--sim-accent); }
.td-head2 { margin: 0; font-size: var(--sim-text-lg); font-weight: 800; letter-spacing: 0.12em; text-align: center; color: var(--sim-accent); }
/* The colour chip in each heading is the key to the shared track below: the
   learner can see which half of the bar is the panel they are looking at. */
.td-dot { display: inline-block; width: 11px; height: 11px; margin-right: 7px; border-radius: 3px; background: var(--td-c); vertical-align: 0; }
.td-lit { align-self: center; border-radius: var(--sim-radius-pill); border-color: var(--sim-accent); color: var(--sim-accent); }
.td-field { flex-direction: column; align-items: stretch; gap: 2px; }
.td-field .sim-field__label { font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.td-fig { text-align: center; font-size: var(--sim-text-lg); font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
.td-unit { font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); margin-left: 4px; }

/* A control, not a column: the button takes its own height and sits centred
   between the two panels. Stretched to the panels' height it read as a blue
   lozenge the width of a third of the scene, and the eye went to the shape
   rather than to the two figures the slide is about. */
.td-release { align-self: center; justify-content: center; cursor: pointer; font: inherit; font-size: var(--sim-text-md); font-weight: 800; letter-spacing: 0.04em; padding: var(--sim-space-2) var(--sim-space-4); border: var(--sim-border); border-radius: var(--sim-radius-pill); background: var(--sim-accent); color: var(--sim-bg-deep); box-shadow: 0 4px 0 color-mix(in oklab, var(--sim-accent) 55%, var(--sim-bg-deep)); }
.td-release:hover { background: var(--sim-accent-hover); }
.td-release[disabled] { opacity: 0.5; cursor: progress; box-shadow: none; }

/* The sum. One track, fixed total width, two segments whose widths always add
   to it: the second segment is whatever is left, so no rounding can make the
   bar grow or shrink. The line between them IS the divider. Sky for HEIGHT
   and emerald for MOTION - a warm-to-cool handover, deliberately NOT a
   red/green pair, which would read as "one of these is wrong" when the two
   are the same joules changing hands. */
.td-sum { display: flex; flex-direction: column; gap: var(--sim-space-1); }
.td-track { display: flex; width: 100%; height: 26px; border: var(--sim-border); border-radius: var(--sim-radius-sm); overflow: hidden; background: var(--sim-bg-deep); }
.td-seg { height: 100%; }
/* box-sizing keeps the 3px divider INSIDE the height segment, so at full
   height the divider sits flush on the right-hand end instead of pushing a
   sliver of the other colour past the track. */
.td-seg--h { box-sizing: border-box; flex: none; width: 100%; border-right: 3px solid var(--sim-bg-surface); background: var(--sim-series-1); }
/* MOTION's half of the track is zero wide until Release. Sizing it as
   "whatever is left" at every moment made the bar show three quarters of
   MOTION while MOTION still read "?" and the ball was still on the ledge -
   the one thing the bar must never do is claim joules nobody has measured. */
.td-seg--m { flex: 0 0 0; background: var(--sim-series-3); }
[data-running="1"] .td-seg--m,
[data-done="1"] .td-seg--m { flex: 1 1 auto; }
.td-sumcap { text-align: left; }

.td-meta { text-align: left; }
.td-note:empty { display: none; }
/* The note is permanent background here, not a modal the learner opens: stock
   .sl-note is position:absolute inset:0 - a dimming overlay that would hide
   the ball and the two figures, which are the whole scene. Flow it inline. */
.td-note .sl-note { position: static; inset: auto; z-index: auto; display: block; padding: 0; background: none; animation: none; }
.td-note .sl-note__card { width: 100%; margin: 0; padding: var(--sim-space-2) var(--sim-space-3); border-width: 2px; gap: var(--sim-space-2); animation: none; box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-accent) 45%, var(--sim-bg-deep)); }
.td-note .sl-note__badge { position: static; inset: auto; transform: none; align-self: flex-start; font-size: var(--sim-text-sm); padding: 1px 9px; }
.td-note .sl-note__row { grid-template-columns: 22px minmax(0, 1fr); column-gap: var(--sim-space-2); animation: none; }
.td-note .sl-note__icon { width: 22px; height: 22px; }
.td-note .sl-note__text { font-size: var(--sim-text-sm); font-weight: 700; line-height: 1.3; }
.td-note .sl-note__sub { font-size: var(--sim-text-sm); font-weight: 600; }

/* The celebration is MOTION holding everything, not Release being pressed:
   the pop and the colour land on the MOTION figure alone, when the divider has
   reached the right-hand end and HEIGHT has drained to nothing. The tag is
   scoped to the MOTION panel for the same reason - an "all of it" chip over
   an emptied HEIGHT panel says the opposite of what happened. */
.td-all { display: none; }
[data-done="1"] .td-panel--m .td-all { display: inline-flex; }
[data-done="1"] .td-panel--m { border-color: var(--sim-good); box-shadow: 0 var(--sim-lift) 0 var(--sim-good); }
[data-done="1"] .td-panel--m .td-head2 { color: var(--sim-good); }
[data-done="1"] .td-fig--m { color: var(--sim-good); animation: td-pop 620ms ease-out; }
@keyframes td-pop {
  0% { transform: scale(1); }
  35% { transform: scale(1.16); }
  100% { transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  [data-done="1"] .td-fig--m { animation: none; }
}

/* Narrow frame (portrait phone). Three columns - panel, control, panel - do
   not fit a phone: the headings burst their boxes and the MOTION "?" walks off
   the right edge. So the hero takes the full width on top, the two panels sit
   side by side under it, and Release becomes the full-width button between
   their two rows - the stub's other reading of "one control between them". */
@container td (max-width: 470px) {
  .td-main { grid-template-columns: minmax(0, 1fr); }
  .td-hero { align-items: center; }
  .td-hero .td-svg { max-width: 288px; }
  .td-hero .sim-meta { text-align: center; }
  .td-panels { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .td-panel--h { grid-column: 1; grid-row: 1; }
  .td-panel--m { grid-column: 2; grid-row: 1; }
  .td-head2 { font-size: var(--sim-text-md); letter-spacing: 0.06em; }
  .td-release { grid-column: 1 / -1; grid-row: 2; justify-self: center; }
  .td-meta { text-align: center; }
}
`;

export class TwoDebtsScene extends DomSimulation {
  static WIDTH = 640;
  // Measured, not guessed: the host budgets the panel from these two, and
  // sim-layout pokes the dial and the button to find the tallest state a
  // learner can reach. That is 649px wide and 1184px portrait (the note card
  // is most of it); the values below cover those with a little headroom.
  static HEIGHT = 660;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1190; // the hero takes the full width and the panels stack under it
  // One beat, one arrangement: sizing to what is showing beats a hand-guessed
  // worst case, and nothing the learner does changes the frame's height.
  static FIT = true;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A ball resting on a shelf above the ground, with a height marker running from the ground up to the ball. Beside it two lit panels, HEIGHT and MOTION, with a Release button between them. HEIGHT reads the worth of the ball sitting on the ledge and MOTION reads a question mark until Release is pressed; the fall then trades one figure for the other, and MOTION ends holding everything.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.render({ css: SIM_LOOK_DOM_CSS + CSS, rootClass: 'td-root', html: this._html() });

    this._timers = [];
    this._h = H_START;
    this._h0 = H_START;
    this._run = null;
    this._posted = false;
    this._celebrated = false;

    this._svg = this.root?.querySelector?.('[data-svg]') ?? null;
    this._ball = this.root?.querySelector?.('[data-ball]') ?? null;
    this._squash = this.root?.querySelector?.('[data-squash]') ?? null;
    this._shadow = this.root?.querySelector?.('[data-shadow]') ?? null;
    this._hint = this.root?.querySelector?.('[data-hint]') ?? null;
    this._shelf = this.root?.querySelector?.('[data-shelf]') ?? null;
    this._markLine = this.root?.querySelector?.('[data-mark-line]') ?? null;
    this._markTop = this.root?.querySelector?.('[data-mark-top]') ?? null;
    this._grip = this.root?.querySelector?.('[data-grip]') ?? null;
    this._segH = this.root?.querySelector?.('[data-seg-h]') ?? null;
    this._segM = this.root?.querySelector?.('[data-seg-m]') ?? null;
    this._track = this.root?.querySelector?.('[data-track]') ?? null;
    this._ledgeTag = this.root?.querySelector?.('[data-ledge]') ?? null;
    this._figH = this.root?.querySelector?.('[data-fig-h]') ?? null;
    this._figM = this.root?.querySelector?.('[data-fig-m]') ?? null;
    this._fieldM = this.root?.querySelector?.('[data-field-m]') ?? null;
    this._release = this.root?.querySelector?.('[data-release]') ?? null;
    this._note = this.root?.querySelector?.('[data-note]') ?? null;
    if (this._note) this._note.innerHTML = noteCardHtml(NOTE_ROWS, 'What this panel leaves out');

    // Bound once so add/removeEventListener pair up exactly.
    this._onMove = (e) => this._move(e);
    this._onUp = () => this._unbindDrag();

    this._release?.addEventListener?.('click', () => this._releaseRun());
    this._grip?.addEventListener?.('pointerdown', (e) => this._down(e));
    this._grip?.addEventListener?.('keydown', (e) => this._key(e));
    this.onStep();
  }

  destroy() {
    this._clearTimers();
    this._unbindDrag();
    this._svg = null;
    this._ball = null;
    this._squash = null;
    this._shadow = null;
    this._hint = null;
    this._shelf = null;
    this._markLine = null;
    this._markTop = null;
    this._grip = null;
    this._segH = null;
    this._segM = null;
    this._track = null;
    this._ledgeTag = null;
    this._figH = null;
    this._figM = null;
    this._fieldM = null;
    this._release = null;
    this._note = null;
    super.destroy();
  }

  // ------------------------------------------------------------------ beats

  onStep() {
    this._clearTimers();
    this._run = null;
    this._posted = false;
    this._celebrated = false;
    this._h = H_START;
    this._h0 = H_START;
    this.root?.removeAttribute?.('data-running');
    this.root?.removeAttribute?.('data-done');
    if (this._release) this._release.disabled = false;
    this._shelfTo(H_START);
    this._postMotion(null);
    this._paint(H_START);
  }

  // ------------------------------------------------------------------ drag

  _down(e) {
    // The dial locks while the fall plays: the release height is a fact about
    // this run, and moving the ball mid-fall would put two heights on one bar.
    if (this._run) return;
    if (e.button != null && e.button !== 0) return;
    e.preventDefault?.();
    this._grip?.setPointerCapture?.(e.pointerId);
    this.root?.addEventListener?.('pointermove', this._onMove);
    this.root?.addEventListener?.('pointerup', this._onUp);
    this.root?.addEventListener?.('pointercancel', this._onUp);
    this._setHeight(this._hFromEvent(e));
  }

  _move(e) {
    if (this._run) return;
    this._setHeight(this._hFromEvent(e));
  }

  _unbindDrag() {
    this.root?.removeEventListener?.('pointermove', this._onMove);
    this.root?.removeEventListener?.('pointerup', this._onUp);
    this.root?.removeEventListener?.('pointercancel', this._onUp);
  }

  // Pointer y, in the SVG's OWN units. The viewBox ratio comes from the live
  // bounding rect, so this is correct at any host scale and in either
  // orientation - no design-space constant is baked in here.
  _hFromEvent(e) {
    const rect = this._svg?.getBoundingClientRect?.();
    if (!rect || !rect.height) return this._h;
    const y = ((e.clientY - rect.top) / rect.height) * VB_H;
    return clamp(Math.round(((GROUND_Y - y) / PX_PER_M) / H_STEP) * H_STEP, H_MIN, H_MAX);
  }

  _key(e) {
    if (this._run) return;
    const big = e.shiftKey ? 5 : 1;
    let next = this._h;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next += H_STEP * big;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next -= H_STEP * big;
    else if (e.key === 'Home') next = H_MIN;
    else if (e.key === 'End') next = H_MAX;
    else return;
    e.preventDefault?.();
    this._setHeight(clamp(Math.round(next / H_STEP) * H_STEP, H_MIN, H_MAX));
  }

  // Any move of the ledge re-arms the panel: the two figures on it were about
  // a fall from the old height, and the height they are standing on has just
  // changed, so MOTION goes back to reading nothing rather than keeping a
  // number that belongs to a drop that is no longer on the table.
  _setHeight(h) {
    if (h === this._h) return;
    this._h = h;
    this._celebrated = false;
    this.root?.removeAttribute?.('data-done');
    this._shelfTo(h);
    this._postMotion(null);
    this._paint(h);
  }

  // ------------------------------------------------------------------- run

  _releaseRun() {
    if (this._run) return; // a fall is already going; it always ends
    this._clearTimers();
    this._celebrated = false;
    this.root?.removeAttribute?.('data-done');
    // The shelf keeps the height the ball left from, so the panel shows where
    // it came from as well as where it is.
    this._h0 = this._h;
    this._run = {
      t: 0,
      // Credit the launching stage, not whatever stage is current when the
      // ball lands: a run started on one beat can still be going on the next.
      stage: this.stepIndex ?? 0,
    };
    this.root?.setAttribute?.('data-running', '1');
    if (this._release) this._release.disabled = true;
    this._paint(this._h0);
    this._arm(TICK_MS, () => this._advance());
  }

  // One tick of the fall. NOT named _tick: DomSimulation starts a real rAF
  // loop for any subclass that defines _tick, and would call this once a frame
  // as well as once per timer - the fall would run at twice its stated pace.
  _advance() {
    const run = this._run;
    if (!run) return;
    run.t += TICK_MS;
    const u = Math.min(1, run.t / FALL_MS);
    const dropped = u * u; // constant acceleration from rest
    this._paint(this._h0 * (1 - dropped));
    if (u >= 1) {
      this._finish();
      return;
    }
    this._arm(TICK_MS, () => this._advance());
  }

  _finish() {
    this._run = null;
    this.root?.removeAttribute?.('data-running');
    if (this._release) this._release.disabled = false;
    // The concept, not the button: MOTION holds everything and the divider has
    // reached the right-hand end. Set before the last paint so the pop and the
    // figure it celebrates land in the same frame.
    this._celebrated = true;
    this.root?.setAttribute?.('data-done', '1');
    this._paint(0);
  }

  _clearTimers() {
    for (const id of this._timers) clearTimeout(id);
    this._timers = [];
  }

  _arm(ms, fn) {
    const id = setTimeout(() => {
      this._timers = this._timers.filter((t) => t !== id);
      fn();
    }, ms);
    this._timers.push(id);
  }

  // ------------------------------------------------------------------ paint

  // hNow is the ball's own height right now, in metres. MOTION is computed as
  // the remainder of the release height's worth rather than as its own sum,
  // so the two figures and the two segments cannot drift apart or both reach
  // zero: at every instant they add to exactly m g h0.
  _paint(hNow) {
    const total = Math.max(PER_M * (this._h0 ?? H_START), 1e-6);
    const hv = Math.max(0, PER_M * hNow);
    const mv = Math.max(0, total - hv);

    if (this._segH?.style) this._segH.style.width = `${((100 * hv) / total).toFixed(2)}%`;
    if (this._figH) this._figH.innerHTML = this._figHtml(hv);
    // MOTION is posted through _postMotion, never by writing the digits
    // straight into the figure: posting a number is what takes the dashed
    // "nothing observed yet" styling off the field. Writing the innerHTML
    // left a measured reading sitting inside a box that still said there
    // was none, for the whole fall and in the celebration.
    if (this._run !== null || this._celebrated) this._postMotion(mv);
    this._place(hNow);
    this._grip?.setAttribute?.('aria-valuenow', hNow.toFixed(1));
    this._grip?.setAttribute?.('aria-valuetext', `${hNow.toFixed(1)} m above the ground`);
    // Said the same way the bar is drawn: before the release there is no
    // MOTION half to report, and reading the leftover out loud would credit
    // the track with joules the MOTION panel is still showing a "?" for.
    const measured = this._run !== null || this._celebrated;
    this._track?.setAttribute?.('aria-label', measured
      ? `The two panels added together: height ${hv.toFixed(1)} joules, motion ${mv.toFixed(1)} joules.`
      : `The two panels added together, all of it height: ${hv.toFixed(1)} joules. MOTION has not started.`);
  }

  _place(hNow) {
    const y = GROUND_Y - hNow * PX_PER_M;
    // The ball stretches along the direction of travel while the fall plays and
    // relaxes when it lands. It is the only motion in the panel that is not a
    // number moving, so it is the one that has to carry some character.
    const k = this._run ? 1 - clamp(hNow / (this._h0 || H_START), 0, 1) : 0;
    const sx = 1 - 0.09 * k;
    const sy = 1 + 0.13 * k;
    this._ball?.setAttribute?.('transform', `translate(${BALL_CX} ${(y - BALL_R).toFixed(1)})`);
    this._squash?.setAttribute?.('transform', `scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);
    this._markLine?.setAttribute?.('y2', y.toFixed(1));
    this._markTop?.setAttribute?.('y1', y.toFixed(1));
    this._markTop?.setAttribute?.('y2', y.toFixed(1));
    // The drag affordance rides the middle of the marker, so it is always
    // beside the ruler and never on the evidence.
    this._hint?.setAttribute?.('transform', `translate(0 ${((GROUND_Y + y) / 2).toFixed(1)})`);
    // The landing mark tightens as the ball nears the floor, so the ground
    // reads as where the ball is going rather than as a stray smudge.
    const near = clamp(1 - hNow / H_MAX, 0, 1);
    this._shadow?.setAttribute?.('rx', ((BALL_R + 3) * (0.5 + 0.5 * near)).toFixed(1));
    this._shadow?.setAttribute?.('ry', (1.4 + 2.6 * near).toFixed(1));
  }

  // The shelf is the ball's resting place, so it follows the drag but not the
  // fall - once released, the ledge stays where it was left.
  _shelfTo(h) {
    this._shelf?.setAttribute?.('transform', `translate(0 ${(GROUND_Y - h * PX_PER_M).toFixed(1)})`);
    if (this._ledgeTag) this._ledgeTag.innerHTML = `LEDGE ${h.toFixed(1)} m`;
  }

  // value === null posts the dashed "?" unknown state, the kit's own way of
  // saying a panel has nothing to read.
  _postMotion(value) {
    if (!this._fieldM || !this._figM) return;
    if (value === null) {
      this._fieldM.classList?.add?.('sim-field--missing');
      this._figM.innerHTML = '<span class="sim-q" aria-hidden="true">?</span>';
      this._figM.setAttribute?.('aria-label', 'Not yet observed');
    } else {
      this._fieldM.classList?.remove?.('sim-field--missing');
      this._figM.removeAttribute?.('aria-label');
      this._figM.innerHTML = this._figHtml(value);
    }
  }

  // ---------------------------------------------------------------- markup

  _html() {
    return `<div class="sim-card td-card">
  <div class="sim-row td-head">
    <span class="sim-tag td-sq">BALL ${MASS_KG.toFixed(1)} kg</span>
    <span class="sim-tag td-sq">g ${G} N/kg</span>
    <span class="sim-tag td-sq" data-ledge>LEDGE ${H_START.toFixed(1)} m</span>
    <span class="sim-tag td-sq td-sq--lit">both lit</span>
  </div>
  <div class="td-main">
    <div class="td-hero">
      ${this._svgHtml()}
      <p class="sim-meta">drag the ball up or down its marker</p>
    </div>
    <div class="td-side">
      <div class="td-panels">
        ${this._panelHtml('h', 'HEIGHT', 1)}
        <button type="button" class="td-release" data-release>Release</button>
        ${this._panelHtml('m', 'MOTION', 3)}
      </div>
      <div class="td-sum">
        <div class="td-track" data-track role="img" aria-label="The two panels added together.">
          <div class="td-seg td-seg--h" data-seg-h></div>
          <div class="td-seg td-seg--m" data-seg-m></div>
        </div>
        <p class="sim-meta td-sumcap">${esc(`both figures added together`)}</p>
      </div>
    </div>
  </div>
  <p class="sim-meta td-meta">${esc(`Release drops the ball ${DOT} the two figures trade, one for the other`)}</p>
  <div class="td-note" data-note></div>
</div>`;
  }

  _panelHtml(key, name, series) {
    const value = key === 'h'
      ? this._figHtml(PER_M * H_START)
      : '<span class="sim-q" aria-hidden="true">?</span>';
    return `<section class="sim-card td-panel td-panel--${key}" style="--td-c: var(--sim-series-${series})" aria-label="${esc(`${name} panel`)}">
      <h3 class="td-head2"><span class="td-dot" aria-hidden="true"></span>${name}</h3>
      <span class="sim-tag td-lit">lit</span>
      <div class="sim-field td-field${key === 'm' ? ' sim-field--missing' : ''}"${key === 'm' ? ' data-field-m' : ''}>
        <span class="sim-field__label">worth</span>
        <span class="sim-field__value td-fig td-fig--${key}" data-fig-${key}>${value}</span>
      </div>
      <span class="sim-tag td-all">all of it</span>
    </section>`;
  }

  // The unit rides beside the number in its own muted weight rather than as
  // part of the figure, so "10.0 J" never wraps onto two lines in a panel
  // this narrow - a two-line reading is the one thing that stops the pair
  // being comparable at a glance.
  _figHtml(joules) {
    return `<b>${joules.toFixed(1)}</b><span class="td-unit">J</span>`;
  }

  _svgHtml() {
    const ticks = [];
    for (let h = 0.5; h <= H_MAX + 1e-9; h += 0.5) {
      const y = GROUND_Y - h * PX_PER_M;
      ticks.push(`<line class="td-tick" x1="${WALL_X1}" y1="${y.toFixed(1)}" x2="${WALL_X1 + 11}" y2="${y.toFixed(1)}" />`);
    }
    const y0 = GROUND_Y - H_START * PX_PER_M;
    return `<svg class="td-svg" data-svg viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="A ball resting on a shelf above the ground, with a height marker running from the ground up to the ball.">
      <rect class="td-back" x="0" y="0" width="${VB_W}" height="${VB_H}" rx="10" />
      <rect class="td-room" x="6" y="10" width="${VB_W - 12}" height="${GROUND_Y - 10}" rx="8" />
      <rect class="td-ground" x="0" y="${GROUND_Y}" width="${VB_W}" height="${VB_H - GROUND_Y}" />
      <line class="td-groundlip" x1="0" y1="${GROUND_Y}" x2="${VB_W}" y2="${GROUND_Y}" />
      <rect class="td-wall" x="${WALL_X0}" y="${WALL_TOP}" width="${WALL_X1 - WALL_X0}" height="${GROUND_Y - WALL_TOP}" rx="2" />
      ${ticks.join('\n      ')}
      <g data-shelf transform="translate(0 ${y0.toFixed(1)})">
        <rect class="td-shelf" x="${SHELF_X0}" y="0" width="${SHELF_X1 - SHELF_X0}" height="${SHELF_T}" rx="2" />
        <rect class="td-brace" x="${SHELF_X0}" y="${SHELF_T}" width="8" height="26" rx="2" />
      </g>
      <g class="td-mark">
        <line class="td-mark-line" data-mark-line x1="${MARK_X}" y1="${GROUND_Y}" x2="${MARK_X}" y2="${y0.toFixed(1)}" />
        <line class="td-mark-cap" x1="${MARK_X - 7}" y1="${GROUND_Y}" x2="${MARK_X + 7}" y2="${GROUND_Y}" />
        <line class="td-mark-cap" data-mark-top x1="${MARK_X - 7}" y1="${y0.toFixed(1)}" x2="${MARK_X + 7}" y2="${y0.toFixed(1)}" />
      </g>
      <g class="td-hint" data-hint transform="translate(0 ${((GROUND_Y + y0) / 2).toFixed(1)})" aria-hidden="true">
        <path d="M ${MARK_X} -11 l -4.6 7 h 9.2 z" />
        <path d="M ${MARK_X} 11 l -4.6 -7 h 9.2 z" />
      </g>
      <ellipse class="td-shadow" data-shadow cx="${BALL_CX}" cy="${GROUND_Y + 5}" rx="${BALL_R + 3}" ry="4" />
      <g data-ball transform="translate(${BALL_CX} ${(y0 - BALL_R).toFixed(1)})">
        <g class="td-squash" data-squash>
        <circle class="td-ball-c" cx="0" cy="0" r="${BALL_R}" />
        <circle class="td-ball-hi" cx="-4.5" cy="-5" r="3.6" />
        <g class="td-face" aria-hidden="true">
          <circle class="td-eye" cx="-5" cy="0.5" r="2.9" />
          <circle class="td-eye" cx="5" cy="0.5" r="2.9" />
          <path class="td-mouth-line" d="M -3.6 5.6 Q 0 8.6 3.6 5.6" />
        </g>
        <g class="td-face td-face--run" aria-hidden="true">
          <circle class="td-eye" cx="-5.4" cy="-0.4" r="3.6" />
          <circle class="td-eye" cx="5.4" cy="-0.4" r="3.6" />
          <ellipse class="td-mouth" cx="0" cy="6.2" rx="2.5" ry="2.9" />
        </g>
        </g>
      </g>
      <rect class="td-grip" data-grip x="${SHELF_X0}" y="0" width="${VB_W - SHELF_X0}" height="${GROUND_Y}" role="slider" tabindex="0" aria-label="Ledge height" aria-orientation="vertical" aria-valuemin="${H_MIN.toFixed(1)}" aria-valuemax="${H_MAX.toFixed(1)}" aria-valuenow="${H_START.toFixed(1)}" aria-valuetext="${H_START.toFixed(1)} m above the ground" />
    </svg>`;
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
