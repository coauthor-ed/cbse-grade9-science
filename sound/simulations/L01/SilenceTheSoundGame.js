/**
 * SilenceTheSoundGame - blk-l01-s06, "Challenge: Silence the Band" (beat-less mini-game).
 *
 * A shelf of four sounding instruments - tabla, bansuri, guitar, bell. Each is an untitled drawing
 * with three (round 1) or four (round 2) grabbable parts, and each carries one small `sounding` chip
 * that is lit while it makes a noise. The learner presses and holds ONE part.
 *
 * ---------------------------------------------------------------------------
 * THE ONLY THING THAT STOPS A SOUND HERE
 * ---------------------------------------------------------------------------
 * `_hold()` runs the damping exactly once, on pointerdown, and it reads one thing: was the held part
 * the one that was moving? If yes, that instrument stops - the sweep ends, the chip flips to
 * `silent` in the same transition and the round records the hit. If no, `_hold()` returns having
 * changed nothing at all: no chip, no dimming, no shake, no line of text, no hint about how close
 * the guess was. There is no second code path that can stop a sound, so the game cannot be won by
 * pressing everything. Ties L2: the win condition IS the slide's rule - sound lives exactly as long
 * as the movement, so only holding the moving part can end it.
 *
 * Silence is PERSISTENT, and that is forced by the slide: "once you have silenced all four, the same
 * four instruments come back with a decoy part each" cannot happen if a finger's release brings the
 * noise back, and one finger may hold only one part, so four simultaneous holds are impossible. It
 * is also what the physics says - nothing is driving the part any more, so nothing sets it moving
 * again. An already-silenced instrument accepts further holds for free and changes nothing (see the
 * design note's Requests for the stub sentence that says otherwise).
 *
 * NOTHING IN ART OR COLOUR CAN GIVE THE ANSWER AWAY: every part of an instrument shares one colour
 * family, every part has the same affordance and the same pressed look, and the parts carry no
 * labels. The only difference the learner can see is which one was moving. The word "vibration" is
 * never printed on the panel - the win is the mechanic, not a label - and neither the round banner
 * nor the note names a part.
 *
 * The drawing is one SVG per instrument; the grab areas are transparent HTML buttons over it, sized
 * in PERCENT of that drawing's own box, so they land exactly on the shape they belong to at any
 * scale (an SVG at `width:100%; height:auto` maps linearly onto its container). That keeps the
 * parts real buttons - focusable, `Enter`-able and announced as buttons - which a `<g role="button">`
 * inside the drawing cannot be.
 *
 * No timer, no score, no hearts, no attempt counter, no buttons to press. Retries are unlimited and
 * free, the only progress shown is the round record, and `checkObjective()` looks at what was held
 * and never at how long it took or how many tries it took to get there.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { esc, simRecord } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, noteLineHtml, burst } from 'simulations/base/kit/SimLookDom.js';

const MID = '\u00b7';
const SWEEP_MS = 360;      // one half-sweep of a moving part: visible shuttling, not a blur
const ROUND_GAP_MS = 2000; // the beat between a cleared round and the decoy round
const DEDUPE_MS = 400;     // a pointer tap also fires a click; damp once, not twice
const INSTRUMENT_COUNT = 4;
const ROUND_COUNT = 2;

/* -- the shelf ------------------------------------------------------------------------------------- */

/** Each part: `hold` is 'always' (grabbable in both rounds) or 'decoy' (grabbable only from round 2).
 *  `axis` is the direction the moving part shuttles in. `hits` are the grab areas in the drawing's own
 *  viewBox units, kept disjoint from the next part's so a tap can never land on two of them. `v`
 *  marks the one part that was vibrating - data, not advice: it is the whole game, and nothing else
 *  in this file may read it. */
const INSTRUMENTS = [
  {
    id: 'tabla',
    series: 1,
    name: 'the tabla drum',
    v: 'skin',
    layers: [
      {
        id: 'shell', hold: 'decoy', aria: 'the wooden body of the drum',
        art: '<path class="sg-t1-a" d="M34,50 L38,114 Q60,124 82,114 L86,50 Z"/>'
          + '<rect class="sg-t1-b" x="32" y="46" width="56" height="11" rx="5"/>'
          + '<path class="sg-t1-b" d="M36,96 L38,114 Q60,124 82,114 L84,96 Z"/>',
        hits: [[44, 46, 32, 70]],
      },
      {
        id: 'strap', hold: 'always', aria: 'the lacing running down the side of the drum',
        art: '<rect class="sg-t1-e" x="30" y="58" width="12" height="58" rx="5"/>'
          + '<rect class="sg-t1-e" x="78" y="58" width="12" height="58" rx="5"/>',
        hits: [[28, 58, 16, 58], [76, 58, 16, 58]],
      },
      {
        id: 'skin', hold: 'always', aria: 'the stretched head across the top of the drum',
        axis: 'y', ghost: true,
        art: '<ellipse class="sg-t1-c" cx="60" cy="42" rx="27" ry="10"/>'
          + '<ellipse class="sg-t1-s" cx="60" cy="42" rx="27" ry="10" stroke-width="2.5"/>',
        hits: [[35, 30, 50, 24]],
      },
      {
        id: 'blocks', hold: 'always', aria: 'the small blocks at the two ends of the head',
        art: '<rect class="sg-t1-b" x="13" y="34" width="20" height="20" rx="5"/>'
          + '<rect class="sg-t1-b" x="87" y="34" width="20" height="20" rx="5"/>',
        hits: [[12, 32, 22, 22], [86, 32, 22, 22]],
      },
    ],
  },
  {
    id: 'bansuri',
    series: 3,
    name: 'the bansuri',
    v: 'bore',
    layers: [
      {
        id: 'pipe', fx: true,
        art: '<rect class="sg-t3-b" x="24" y="74" width="92" height="44" rx="22"/>'
          + '<rect class="sg-t3-c" x="30" y="78" width="80" height="8" rx="4"/>',
      },
      {
        id: 'bore', hold: 'always', aria: 'the air inside the pipe', axis: 'x', ghost: true,
        art: '<rect class="sg-t3-c" x="28" y="88" width="64" height="16" rx="8"/>'
          + '<rect class="sg-t3-s" x="28" y="88" width="64" height="16" rx="8" stroke-width="2"/>',
        hits: [[26, 88, 66, 16]],
      },
      {
        id: 'holes', hold: 'always', aria: 'the finger holes',
        art: '<circle class="sg-t3-hole" cx="38" cy="112" r="4.5"/>'
          + '<circle class="sg-t3-hole" cx="54" cy="112" r="4.5"/>'
          + '<circle class="sg-t3-hole" cx="70" cy="112" r="4.5"/>'
          + '<circle class="sg-t3-hole" cx="86" cy="112" r="4.5"/>',
        hits: [[32, 106, 60, 12]],
      },
      {
        id: 'stopper', hold: 'always', aria: 'the block closing the far end of the pipe',
        art: '<rect class="sg-t3-a" x="94" y="80" width="22" height="36" rx="8"/>',
        hits: [[92, 78, 26, 42]],
      },
      {
        id: 'mouth', hold: 'decoy', aria: 'the mouthpiece at the near end',
        art: '<rect class="sg-t3-a" x="4" y="70" width="22" height="52" rx="10"/>',
        hits: [[2, 68, 24, 56]],
      },
    ],
  },
  {
    id: 'guitar',
    series: 5,
    name: 'the guitar',
    v: 'string',
    layers: [
      {
        id: 'face', hold: 'always', aria: 'the wooden top of the body',
        art: '<circle class="sg-t5-a" cx="34" cy="80" r="33"/>'
          + '<rect class="sg-t5-a" x="34" y="68" width="32" height="24"/>'
          + '<circle class="sg-t5-a" cx="66" cy="80" r="26"/>',
        hits: [[6, 49, 32, 64], [42, 55, 44, 50]],
      },
      {
        id: 'hole', fx: true,
        art: '<circle class="sg-t5-b" cx="65" cy="80" r="16"/>'
          + '<circle class="sg-t5-hole" cx="65" cy="80" r="13"/>',
      },
      {
        id: 'neck', hold: 'always', aria: 'the neck running off to one side',
        art: '<path class="sg-t5-b" d="M82,68 L108,60 L112,80 L86,88 Z"/>'
          + '<rect class="sg-t5-b" x="104" y="52" width="13" height="30" rx="5"/>',
        hits: [[86, 50, 32, 32]],
      },
      {
        id: 'string', hold: 'always', aria: 'the string across the sound hole', axis: 'y', ghost: true,
        art: '<rect class="sg-t5-s" x="14" y="77" width="98" height="6" rx="3"/>',
        hits: [[14, 73, 98, 14]],
      },
      {
        id: 'bridge', hold: 'decoy', aria: 'the block at the edge of the body',
        art: '<rect class="sg-t5-b" x="38" y="70" width="18" height="20" rx="4"/>'
          + '<circle class="sg-t5-hole" cx="47" cy="76" r="2.4"/>'
          + '<circle class="sg-t5-hole" cx="47" cy="84" r="2.4"/>',
        hits: [[38, 70, 18, 20]],
      },
    ],
  },
  {
    id: 'bell',
    series: 7,
    name: 'the bell',
    v: 'shell',
    layers: [
      {
        id: 'shell', hold: 'always', aria: 'the bell itself', axis: 'x', ghost: true,
        art: '<path class="sg-t7-a" d="M28,118 Q26,52 60,48 Q94,52 92,118 Z"/>'
          + '<rect class="sg-t7-a" x="20" y="112" width="80" height="14" rx="6"/>',
        hits: [[22, 58, 76, 68]],
      },
      {
        id: 'collar', hold: 'always', aria: 'the collar under the grip',
        art: '<rect class="sg-t7-b" x="44" y="42" width="32" height="16" rx="6"/>',
        hits: [[42, 40, 36, 18]],
      },
      {
        id: 'handle', hold: 'always', aria: 'the grip on top',
        art: '<rect class="sg-t7-b" x="50" y="20" width="20" height="24" rx="7"/>',
        hits: [[48, 18, 24, 22]],
      },
      {
        id: 'loop', hold: 'decoy', aria: 'the ring on top of the grip',
        art: '<circle class="sg-t7-s" cx="60" cy="10" r="7" stroke-width="5"/>',
        hits: [[48, 0, 24, 18]],
      },
    ],
  },
];

/* -- one drawing ----------------------------------------------------------------------------------- */

const VB_W = 120;
const VB_H = 132;
const pc = (v, span) => `${((v / span) * 100).toFixed(3)}%`;

/** Everything visible but untouchable: the contact shadow each instrument stands on. */
function scenerySvg() {
  return '<ellipse class="sg-shadow" cx="60" cy="127" rx="42" ry="5"/>';
}

/**
 * One layer of one drawing. A moving part gets a ghost copy of itself drawn immediately underneath,
 * which is what reads as the blur of the s01 band; a `fx` layer is scenery, never grabbable. A decoy
 * is drawn in every round but only GRABBABLE from round 2, so the two rounds are the same four
 * drawings and round 2's trap is one more part a finger can reach.
 */
function layerSvg(ins, layer, round, moving) {
  if (layer.fx || (layer.hold === 'decoy' && round === 0)) {
    return `<g class="sg-fx" aria-hidden="true">${layer.art}</g>`;
  }
  const isMoving = Boolean(moving) && ins.v === layer.id;
  if (!isMoving) return `<g class="sg-fx">${layer.art}</g>`;
  return `<g class="sg-ghost sg-gmove sg-gmove--${layer.axis}" aria-hidden="true">${layer.art}</g>`
    + `<g class="sg-art sg-move sg-move--${layer.axis}">${layer.art}</g>`;
}

function instrumentSvg(ins, round, silent) {
  const layers = ins.layers.map((l) => layerSvg(ins, l, round, !silent)).join('');
  return `<svg class="sg-svg" viewBox="0 0 ${VB_W} ${VB_H}" role="img"`
    + ` aria-label="${esc(ins.name)}, untitled parts">` + scenerySvg() + layers + '</svg>';
}

/** One grab area per part: a real button over the drawing, in per cent of that drawing's box. A part
 *  drawn as two separate lobes (the drum's two lacing cords) gets one button per lobe, and says which
 *  lobe it is, so a screen reader does not hear the same label twice. */
function partButtons(ins, round) {
  return ins.layers
    .filter((l) => l.hits && (l.hold === 'always' || round > 0))
    .map((l) => l.hits.map(([x, y, w, h], j) => {
      const lobe = l.hits.length > 1 ? ` (${j === 0 ? 'one side' : 'the other'})` : '';
      return `<button type="button" class="sg-part" data-inst="${ins.id}" data-part="${l.id}"`
        + ` style="left:${pc(x, VB_W)};top:${pc(y, VB_H)};width:${pc(w, VB_W)};height:${pc(h, VB_H)}"`
        + ` aria-label="${esc(`${ins.name}: ${l.aria}${lobe}`)}"></button>`;
    }).join(''))
    .join('');
}

function chipHtml(silent) {
  const tag = silent ? 'sim-tag' : 'sim-tag sim-tag--accent';
  return `<span class="${tag} sg-chip${silent ? ' is-off' : ''}">`
    + '<i class="sg-dot" aria-hidden="true"></i>' + (silent ? 'silent' : 'sounding') + '</span>';
}

/** Flip one instrument's chip in place, in the same transition that stops its sweep. */
function setChip(card, silent) {
  const top = card?.querySelector?.('.sg-top');
  if (top) top.innerHTML = chipHtml(silent);
}

/* -- the look -------------------------------------------------------------------------------------- */

/** One colour family per instrument, shared by every one of its parts: the moving part is never the
 *  one that is coloured differently, only the one that moves. */
const TONE_CSS = INSTRUMENTS.map((ins) => {
  const s = `var(--sim-series-${ins.series})`;
  return `.sg-t${ins.series}-a { fill: ${s}; }
.sg-t${ins.series}-b { fill: color-mix(in oklab, ${s} 74%, var(--sim-bg-deep)); }
.sg-t${ins.series}-e { fill: color-mix(in oklab, ${s} 90%, var(--sim-bg-deep)); }
.sg-t${ins.series}-c { fill: color-mix(in oklab, ${s} 24%, var(--sim-bg-surface)); }
.sg-t${ins.series}-s { stroke: color-mix(in oklab, ${s} 52%, var(--sim-bg-deep)); fill: none; }
.sg-t${ins.series}-hole { fill: var(--sim-bg-deep); }`;
}).join('\n');

const CSS = `
.sg { display: grid; gap: var(--sim-space-3); }
.sg-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--sim-space-2) var(--sim-space-3); }
.sg-status { margin: 0; font: 700 var(--sim-text-sm)/1.3 var(--sim-font); color: var(--sim-label-muted); }
.sg-shelf { display: grid; gap: var(--sim-space-2); padding: var(--sim-space-3); border-radius: var(--sim-radius-lg); }
.sg-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--sim-space-2); }
.sg-inst { display: grid; gap: var(--sim-space-2); align-content: start; padding: var(--sim-space-2); }
.sg-top { display: flex; justify-content: center; }
.sg-art { position: relative; line-height: 0; }
.sg-svg { display: block; width: 100%; height: auto; }
.sg-chip { display: inline-flex; align-items: center; gap: 6px; font-size: var(--sim-text-sm);
  transition: background-color 260ms ease-out, color 260ms ease-out, border-color 260ms ease-out; }
.sg-dot { width: 10px; height: 10px; border-radius: var(--sim-radius-pill); background: currentColor; }
.sg-chip.is-off { color: var(--sim-label-muted); }
.sg-chip.is-off .sg-dot { background: transparent; box-shadow: inset 0 0 0 2px currentColor; }
.sg-plank { height: 10px; border-radius: var(--sim-radius-sm);
  background: color-mix(in oklab, var(--sim-bg-surface) 60%, var(--sim-gold));
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-bg-deep) 58%, var(--sim-gold)); }
.sg-shadow { fill: var(--sim-bg-deep); opacity: 0.4; }
.sg-fx { pointer-events: none; }
.sg-ghost { pointer-events: none; opacity: 0.5; }
.sg-part { position: absolute; margin: 0; padding: 0; border: 0; border-radius: var(--sim-radius-sm);
  background: transparent; cursor: pointer; touch-action: none; }
.sg-part:focus { outline: none; }
.sg-part:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 1px; }
.sg-part.is-held { outline: 2px dashed var(--sim-label-muted); outline-offset: 0; }
@keyframes sg-move-x { from { transform: translateX(-1.6px); } to { transform: translateX(1.6px); } }
@keyframes sg-move-y { from { transform: translateY(-1.5px); } to { transform: translateY(1.5px); } }
@keyframes sg-ghost-x { from { transform: translateX(-3.4px); } to { transform: translateX(3.4px); } }
@keyframes sg-ghost-y { from { transform: translateY(-3.2px); } to { transform: translateY(3.2px); } }
.sg-move--x { animation: sg-move-x ${SWEEP_MS / 1000}s ease-in-out infinite alternate; }
.sg-move--y { animation: sg-move-y ${SWEEP_MS / 1000}s ease-in-out infinite alternate; }
.sg-gmove--x { animation: sg-ghost-x ${SWEEP_MS / 1000}s ease-in-out infinite alternate; }
.sg-gmove--y { animation: sg-ghost-y ${SWEEP_MS / 1000}s ease-in-out infinite alternate; }
.sg-inst.is-silent .sg-move, .sg-inst.is-silent .sg-gmove { animation: none; }
@media (prefers-reduced-motion: reduce) {
  .sg-move--x, .sg-move--y { animation: none; }
  .sg-gmove--x { animation: none; transform: translateX(3.4px); }
  .sg-gmove--y { animation: none; transform: translateY(3.2px); }
}
.sim-dom-root--portrait .sg-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.sim-dom-root--portrait .sg-status { font-size: var(--sim-text-md); }
`;

/* -------------------------------------------------------------------------------------------------- */

export class SilenceTheSoundGame extends withChallenge(DomSimulation) {
  static WIDTH = 680;
  static HEIGHT = 426;           // sim-layout measured the mounted shelf
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 751;
  static MIN_SCALE = 1;           // sits beside the slide text rather than being narrowed into a column
  static FIT = true;
  static ARIA_LABEL =
    'A shelf of four sounding instruments: a tabla drum, a bansuri, a guitar and a bell. Each has three '
    + 'or four untitled parts you can press and hold. Holding the part that is moving stops that '
    + 'instrument at once and flips its sounding chip to silent; holding any other part does nothing at '
    + 'all, and the instrument keeps sounding. Silence one of each, then do it again with a decoy part '
    + 'added to every instrument. There is no clock and no score.';
  static OBJECTIVE = {
    prompt: {
      en: 'Silence all four at once: hold the part that is moving on each instrument, and see that '
        + 'holding any other part does nothing at all.',
    },
  };
  // `maxAttempts: Infinity` is the honest one: retries are free and unpenalised, and the { ok }
  // branch below scores nothing per attempt anyway.
  static SCORING = { mode: 'accuracy', tolerance: 0, maxAttempts: Infinity };
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this._round = 0;
    this._hits = Array.from({ length: ROUND_COUNT }, () => new Array(INSTRUMENT_COUNT).fill(false));
    this._held = null;
    this._quiet = false;
    this._gapId = 0;
    this._status = '';
    this._lastHold = null;
    this._el = null;
    this._onDown = null;
    this._onUp = null;
    this._onKey = null;
  }

  /* ---- mount -------------------------------------------------------------------------------------- */

  async setup() {
    await super.setup();
    this.render({
      css: SIM_LOOK_DOM_CSS + TONE_CSS + CSS,
      html: `<div class="sg">
        <div class="sg-head">
          <div data-fx="record"></div>
          <p class="sg-status" data-fx="status" aria-live="polite"></p>
        </div>
        <div class="sg-shelf sl-backdrop">
          <div class="sg-row" data-fx="row" role="group" aria-label="four sounding instruments"></div>
          <div class="sg-plank" aria-hidden="true"></div>
        </div>
      </div>`,
    });

    this.root.insertAdjacentHTML('beforeend', noteLineHtml([
      { text: `the parts are drawn out for grabbing ${MID} nothing here is to scale` },
      { text: 'a moving part is shown slower than it really moves, so that you can watch it' },
    ]));

    // Every query guarded: the headless sanity run has no HTML parser, so all of these are null
    // there and the scene must still mount, mount again and tear down.
    this._el = {
      record: this.root.querySelector('[data-fx="record"]'),
      status: this.root.querySelector('[data-fx="status"]'),
      row: this.root.querySelector('[data-fx="row"]'),
    };

    // One delegated listener per input kind, and delegation is what lets a round re-render the row.
    // The damping runs on pointerdown so a tap counts (that is how a fingertip damps a real head);
    // keydown covers Enter and Space on a focused part; click covers everything else, including a
    // headless tap, and the dedupe keeps a pointer tap from damping twice.
    this._onDown = (e) => {
      const part = e.target?.closest?.('.sg-part');
      if (part) this._hold(part);
    };
    this._onUp = (e) => this._release(e?.target?.closest?.('.sg-part') || null);
    this._onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') this._onDown(e);
    };
    const row = this._el.row;
    if (row) {
      for (const [type, fn] of [
        ['pointerdown', this._onDown], ['click', this._onDown],
        ['pointerup', this._onUp], ['pointercancel', this._onUp],
        ['keydown', this._onKey], ['keyup', this._onUp], ['focusout', this._onUp],
      ]) row.addEventListener(type, fn);
    }

    this._startRound(0);
  }

  destroy() {
    this._clearGap();
    const row = this._el?.row;
    if (row) {
      for (const [type, fn] of [
        ['pointerdown', this._onDown], ['click', this._onDown],
        ['pointerup', this._onUp], ['pointercancel', this._onUp],
        ['keydown', this._onKey], ['keyup', this._onUp], ['focusout', this._onUp],
      ]) row.removeEventListener(type, fn);
    }
    this._onDown = null;
    this._onUp = null;
    this._onKey = null;
    this._el = null;
    super.destroy();
  }

  /* ---- rounds ------------------------------------------------------------------------------------- */

  /** Deal a round: fresh drawing, every instrument sounding again, nothing of the last round left. */
  _startRound(i) {
    this._clearGap();
    this._round = Math.max(0, Math.min(ROUND_COUNT - 1, i | 0));
    this._held = null;
    this._quiet = false;
    this._status = this._round === 0
      ? `press and hold one part ${MID} only the part that is moving will stop anything`
      : `every instrument has one decoy part now ${MID} press and hold one part`;
    if (this._el?.row) {
      this._el.row.innerHTML = INSTRUMENTS
        .map((ins) => `<article class="sim-card sg-inst" data-card="${ins.id}">`
          + `<div class="sg-top">${chipHtml(false)}</div>`
          + `<div class="sg-art">${instrumentSvg(ins, this._round, false)}${partButtons(ins, this._round)}</div>`
          + '</article>')
        .join('');
    }
    this._sync();
  }

  cleared(i) {
    return (this._hits[i] || []).filter(Boolean).length;
  }

  roundDone(i) {
    return this.cleared(i) === INSTRUMENT_COUNT;
  }

  /* ---- the one move ------------------------------------------------------------------------------ */

  /**
   * A hold runs the damping once. Everything this game can do to a sound happens in the `if` below,
   * and the only question asked is whether the held part is the one that was moving.
   */
  _hold(part) {
    if (this._quiet) return;
    const inst = part.dataset.inst;
    const partId = part.dataset.part;
    const k = INSTRUMENTS.findIndex((ins) => ins.id === inst);
    if (k < 0) return;
    // A pointer tap fires pointerdown and then a click on the same part; damp once, not twice.
    const key = `${inst}:${partId}`;
    const now = Date.now();
    if (this._lastHold?.key === key && now - this._lastHold.at < DEDUPE_MS) return;
    this._lastHold = { key, at: now };

    this._release(null);
    this._held = part;
    part.classList.add('is-held');

    // A part that was not moving changes nothing at all: no chip, no state, no hint.
    if (INSTRUMENTS[k].v !== partId) return;

    this._hits[this._round][k] = true;
    const card = this._el?.row?.querySelector(`[data-card="${inst}"]`);
    if (card) {
      card.classList.add('is-silent');
      setChip(card, true);
      burst(card);
    }
    this._sync();
    if (this.roundDone(this._round)) this._finishRound();
  }

  _release(part) {
    const target = part || this._held;
    if (target?.classList) target.classList.remove('is-held');
    if (!part || part === this._held) this._held = null;
  }

  _clearGap() {
    if (this._gapId) { clearTimeout(this._gapId); this._gapId = 0; }
  }

  /** A cleared round: hand the XP question to the wrapper, then bring the same four back. */
  _finishRound() {
    this._quiet = true;
    this._release(null);
    this.evaluate();
    if (this._round + 1 >= ROUND_COUNT) {
      this._status = `all four stilled in both rounds ${MID} nothing else in the game was ever going to work`;
      this._sync();
      return;
    }
    this._status = `all four stilled ${MID} the same four come back, each with one decoy part`;
    this._sync();
    this._gapId = setTimeout(() => {
      this._gapId = 0;
      this._startRound(this._round + 1);
    }, ROUND_GAP_MS);
  }

  /* ---- the panel ---------------------------------------------------------------------------------- */

  _sync() {
    if (!this._el) return;
    if (this._el.record) {
      this._el.record.innerHTML = simRecord(['no decoy', 'with decoy'], this._round, 'round');
    }
    if (this._el.status && this._status) this._el.status.textContent = this._status;
  }

  /* ---- checkObjective ----------------------------------------------------------------------------- */

  /**
   * The stub's own form: `{ ok }`, true only when every instrument of BOTH rounds was silenced by
   * holding its own moving part. `_hits` is written in exactly one place - inside the `if` that
   * compares the held part with the moving one - so an instrument can never be banked by any other
   * route, however many times a wrong part is held, and nothing here looks at attempts or time.
   */
  checkObjective() {
    const ok = Array.from({ length: ROUND_COUNT }, (_, i) => this.roundDone(i)).every(Boolean);
    return { ok };
  }
}