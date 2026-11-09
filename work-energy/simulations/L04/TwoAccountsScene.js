import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS, noteCardHtml } from 'simulations/base/kit/SimLookDom.js';
import { esc } from 'simulations/base/SimUi.js';

const W = 700;

// The bundle's own convention (OUTLINE.md). Neither is ever a dial: the stub
// forbids a mass dial and a height dial, so both are tags on the panel and the
// numbers they produce are checkable by hand.
const G = 10;      // N per kg
const MASS = 0.5;  // kg - the same ball in all three cards
const J_MAX = 10;  // J - the one scale every meter shares

// One viewBox, one ground line, one ball, one shelf. The three cards call this
// once each, so "the same panel at different heights" is one function called
// three times rather than three drawings kept in step by hand.
const VB_W = 220;
const VB_H = 170;
const GROUND_Y = 150;
const PXM = 44;    // px per metre
const BALL_R = 16;
const BALL_X = 118;
const SHELF_X0 = 52;
const SHELF_X1 = 196;
const SHELF_T = 9;
const DIM_X = 24;
const STAGE_H = 170;  // the stage box's height, identical in all three cards
const METER_W = 168;  // the meters block's width, identical in all three cards

const CARDS = [
  { id: 'shelf', key: 'h', h: 2.0, shelf: true, state: 'at rest', note: 'on a shelf' },
  { id: 'ground', key: 'h', h: 0.0, shelf: false, state: 'at rest', note: 'on the ground' },
  { id: 'mid', key: 'h', h: 1.0, shelf: false, state: 'held still', note: 'in mid-air' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // the arrangement it opened on
  [{ idx: 1, dwellMs: null }], // the two lower cards invited
  [{ idx: 2, dwellMs: null }], // exactly the arrangement of beat 0
];

const NOTE_ROWS = [
  { text: 'The two meters are the two accounts this chapter has built. Nothing on this panel is adding them together.' },
];

const CSS = `
.ta-row { display: flex; align-items: flex-start; gap: var(--sim-space-3); }
.ta-card { flex: 1 1 0; min-width: 0; gap: var(--sim-space-2); }
.ta-card--wide { flex: 1.35 1 0; }

.ta-head { display: flex; align-items: center; gap: var(--sim-space-2); min-width: 0; }
.ta-head .sim-tag { border-radius: var(--sim-radius-sm); letter-spacing: 0.06em; white-space: nowrap; }

/* the stage: a floor, a ball, and a height dimension. Flat fills, no strokes
   to keep on scale, and no text in here - a 14px label inside a 220-unit
   viewBox lands under the floor once the card is scaled down. The stage box is
   a fixed 170px tall in all three cards and never wider than one viewBox, so
   every card is the same height and the wide card's extra width goes to the
   meters rather than to slack beside the drawing. */
.ta-pick { display: block; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
.ta-stage { display: block; width: 100%; max-width: ${VB_W}px; height: ${STAGE_H}px; margin: 0 auto; }
.ta-floor { fill: var(--sim-track); }
.ta-floorlip { stroke: var(--sim-stroke); stroke-width: 3; }
.ta-shelf { fill: var(--sim-stroke); }
.ta-ball { fill: var(--sim-series-5); }
.ta-dim { stroke: var(--sim-accent); stroke-width: 3; stroke-linecap: round; }
.ta-tick { stroke: var(--sim-accent); stroke-width: 3; stroke-linecap: round; }
.ta-guide { stroke: var(--sim-accent); stroke-width: 2; stroke-dasharray: 4 6; opacity: 0.55; }
.ta-pick:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 3px; border-radius: var(--sim-radius-sm); }

/* the two meters. A labelled track and its number; the number is the readout,
   the bar is the picture, and an empty track is still a track. The block is
   capped at the narrow card's own width so all three cards' bars are the same
   length - which is what makes the U bars comparable by eye. */
.ta-meters { display: flex; flex-direction: column; gap: var(--sim-space-2); width: 100%; max-width: ${METER_W}px; margin: 0 auto; }
.ta-meter { display: grid; grid-template-columns: 16px minmax(0, 1fr) 52px; align-items: center; gap: var(--sim-space-2); }
.ta-mkey { font-size: var(--sim-text-sm); font-weight: 800; color: var(--sim-label-muted); }
.ta-track { height: 16px; border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-pill); background: var(--sim-bg-deep); overflow: hidden; }
.ta-fill { display: block; height: 100%; width: 0; border-radius: var(--sim-radius-pill); }
.ta-meter[data-key="K"] .ta-fill { background: var(--sim-series-1); }
.ta-meter[data-key="U"] .ta-fill { background: var(--sim-series-2); }
.ta-mval { font-size: var(--sim-text-sm); font-weight: 800; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }

/* The hint row carries the arrangement's own state word on the left and the
   beat-1 invitation on the right, so it is never an empty strip and a beat
   never changes the card's height. */
.ta-hintrow { display: flex; align-items: center; gap: var(--sim-space-2); min-height: 26px; }
.ta-state { font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ta-invite { margin-left: auto; visibility: hidden; white-space: nowrap; }
/* the card being read, and the invitation on beat 1 - the whole visual
   difference between reading one height and being offered the other two. */
.ta-card[data-sel="1"] { border-color: var(--sim-accent); box-shadow: 0 var(--sim-lift) 0 var(--sim-accent); }
[data-step="1"] .ta-card:not([data-sel="1"]) { border-style: dashed; }
[data-step="1"] .ta-card:not([data-sel="1"]) .ta-invite { visibility: visible; }

/* the two controls that are never live. A native disabled button with no
   listener and no title: there is no code path from a tap to a combined
   reading, so "stays greyed" is the markup rather than a promise. */
.ta-off { display: flex; align-items: center; justify-content: center; gap: var(--sim-space-2); width: 100%; min-height: 42px; padding: var(--sim-space-1) var(--sim-space-3); border: 2px dashed var(--sim-stroke); border-radius: var(--sim-radius-md); background: var(--sim-bg-deep); color: var(--sim-label-muted); font: 700 var(--sim-text-md)/1.2 var(--sim-font); cursor: not-allowed; }
/* The add control is a compact centred pill with a big sign on it, not a wide
   empty box: at full width the sign read as a stray mark. */
.ta-add { width: auto; min-width: 96px; align-self: center; }
.ta-plus { font-size: 30px; font-weight: 800; line-height: 1; }
.ta-foot { display: flex; align-items: center; gap: var(--sim-space-3); }
.ta-foot .sim-meta { margin: 0; text-align: left; flex: 1 1 auto; min-width: 0; }

/* the note card, in flow at the foot rather than as an overlay: an overlay
   dims the arrangement this slide is about. */
.ta-note { display: block; }
.ta-note .sl-note { position: static; display: block; padding: 0; background: none; animation: none; }
.ta-note .sl-note__card { width: 100%; margin: 0; padding: var(--sim-space-2) var(--sim-space-3); border-width: 2px; gap: 0; box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-accent) 45%, var(--sim-bg-deep)); animation: none; }
.ta-note .sl-note__row { grid-template-columns: minmax(0, 1fr); animation: none; }
.ta-note .sl-note__text { font-size: var(--sim-text-sm); font-weight: 700; line-height: 1.3; }

.sim-dom-root--portrait .ta-row { flex-direction: column; }
.sim-dom-root--portrait .ta-card, .sim-dom-root--portrait .ta-card--wide { flex: 1 1 auto; width: 100%; }
.sim-dom-root--portrait .ta-foot { flex-direction: column; align-items: stretch; }
`;

function fmt1(v) {
  return v.toFixed(1);
}

function shelfSvg(h) {
  const top = GROUND_Y - h * PXM;
  const legH = GROUND_Y - (top + SHELF_T);
  return `<rect class="ta-shelf" x="${SHELF_X0}" y="${top}" width="${SHELF_X1 - SHELF_X0}" height="${SHELF_T}" rx="3"/>`
    + `<rect class="ta-shelf" x="${SHELF_X0 + 10}" y="${top + SHELF_T}" width="8" height="${legH.toFixed(1)}" rx="2"/>`
    + `<rect class="ta-shelf" x="${SHELF_X1 - 18}" y="${top + SHELF_T}" width="8" height="${legH.toFixed(1)}" rx="2"/>`;
}

// The whole stage for one arrangement: the floor, the ball at its height, the
// height dimension from the floor to the ball's underside, and a shelf only
// where there is a shelf.
function stageSvg(card) {
  const under = GROUND_Y - card.h * PXM;
  const cy = under - BALL_R;
  let dim = `<line class="ta-tick" x1="${DIM_X - 6}" y1="${GROUND_Y}" x2="${DIM_X + 6}" y2="${GROUND_Y}"/>`;
  if (card.h > 0) {
    dim += `<line class="ta-dim" x1="${DIM_X}" y1="${GROUND_Y}" x2="${DIM_X}" y2="${under}"/>`
      + `<line class="ta-tick" x1="${DIM_X - 6}" y1="${under}" x2="${DIM_X + 6}" y2="${under}"/>`
      + `<line class="ta-guide" x1="${DIM_X + 6}" y1="${under}" x2="${BALL_X - BALL_R - 4}" y2="${under}"/>`;
  }
  return `<svg class="ta-stage" viewBox="0 0 ${VB_W} ${VB_H}" aria-hidden="true" focusable="false">`
    + dim
    + (card.shelf ? shelfSvg(card.h) : '')
    + `<circle class="ta-ball" cx="${BALL_X}" cy="${cy}" r="${BALL_R}"/>`
    + `<rect class="ta-floor" x="0" y="${GROUND_Y}" width="${VB_W}" height="${VB_H - GROUND_Y}"/>`
    + `<line class="ta-floorlip" x1="0" y1="${GROUND_Y}" x2="${VB_W}" y2="${GROUND_Y}"/>`
    + '</svg>';
}

function meterHtml(key, joules) {
  const pct = Math.max(0, Math.min(100, (joules / J_MAX) * 100));
  return `<div class="ta-meter" data-key="${key}">`
    + `<span class="ta-mkey">${key}</span>`
    + `<span class="ta-track"><span class="ta-fill" style="width:${pct.toFixed(2)}%"></span></span>`
    + `<span class="ta-mval">${fmt1(joules)} J</span>`
    + '</div>';
}

function cardHtml(card, selected) {
  const u = MASS * G * card.h; // J - the only computed value on the panel
  return `<section class="sim-card ta-card${selected ? ' ta-card--wide' : ''}" data-card="${card.id}"${selected ? ' data-sel="1"' : ''}>`
    + `<div class="ta-head"><span class="sim-tag sim-tag--accent">${esc(`h = ${fmt1(card.h)} m`)}</span></div>`
    + `<button type="button" class="ta-pick" data-pick="${card.id}" aria-pressed="${selected ? 'true' : 'false'}" aria-label="${esc(`Read the two meters with the ball ${card.note}, at h = ${fmt1(card.h)} m`)}">`
    + stageSvg(card)
    + '</button>'
    + `<div class="ta-hintrow"><span class="ta-state">${esc(card.state)}</span>`
    + '<span class="sim-tag ta-invite">read</span></div>'
    + '<div class="ta-meters">'
    + meterHtml('K', 0)
    + meterHtml('U', u)
    + '</div>'
    + '<button type="button" class="ta-off ta-add" disabled aria-label="Add"><span class="ta-plus" aria-hidden="true">+</span></button>'
    + '</section>';
}

export class TwoAccountsScene extends DomSimulation {
  static WIDTH = W;
  static HEIGHT = 602; // sim-layout tallest beat 590 + padding
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1445; // sim-layout tallest portrait beat 1431 + padding
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  // A side panel cannot hold a three-card row at a readable scale, so ask for
  // the full width below the slide's text instead.
  static MIN_SCALE = 1.15;
  static ARIA_LABEL = 'Three small panels of the same panel at three heights. Each has a ball at rest on a floor, a K meter reading zero joules and a U meter reading its height, and a greyed-out plus button. The first is the ball on a shelf two metres up with its U meter full; the second is the ball on the ground; the third is the ball held still in mid-air. One greyed-out Release control sits below the three.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.render({
      css: SIM_LOOK_DOM_CSS + CSS,
      html: `<div class="sim-card ta-wrap">`
        + '<div class="ta-row">'
        + CARDS.map((c, i) => cardHtml(c, i === 0)).join('')
        + '</div>'
        + '<div class="ta-foot">'
        + '<button type="button" class="ta-off" disabled aria-label="Release" style="width:auto;flex:none">Release</button>'
        + `<p class="sim-meta">${esc(`ball ${fmt1(MASS)} kg, g = ${G} N/kg, every meter reads 0 to ${J_MAX} J`)}</p>`
        + '</div>'
        + `<div class="ta-note">${noteCardHtml(NOTE_ROWS, 'NOTE')}</div>`
        + '</div>',
    });

    this._cards = Array.from(this.root?.querySelectorAll?.('[data-card]') ?? []);
    this._picks = Array.from(this.root?.querySelectorAll?.('[data-pick]') ?? []);

    // The learner chooses which of the three heights is being read. Nothing
    // else on the panel is live: the two + buttons and the Release button are
    // native disabled elements with no listener, so no tap can reach a
    // combined reading.
    for (const el of this._picks) {
      el.addEventListener('click', () => this._select(el.dataset.pick));
    }

    this._select('shelf');
    this.onStep(0, 3);
  }

  // The only state change in the scene. It moves an accent border and a flex
  // ratio and nothing else: no card is rewritten, no ball moves inside its
  // card, no meter animates.
  _select(id) {
    for (const card of this._cards) {
      const on = card.dataset.card === id;
      card.dataset.sel = on ? '1' : '0';
      card.classList.toggle('ta-card--wide', on);
    }
    for (const pick of this._picks) {
      pick.setAttribute('aria-pressed', pick.dataset.pick === id ? 'true' : 'false');
    }
  }

  onStep() {
    // Every beat opens on the arrangement it opened on, so a lesson resumed
    // straight onto beat 2 lands exactly where beat 0 lands - and the closing
    // question's last frame is the first frame.
    this._select('shelf');
  }

  destroy() {
    this._cards = null;
    this._picks = null;
    super.destroy();
  }
}
