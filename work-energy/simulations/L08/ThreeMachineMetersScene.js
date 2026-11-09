import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS, noteCardHtml, burst } from 'simulations/base/kit/SimLookDom.js';
import { esc } from 'simulations/base/SimUi.js';

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // six tracks empty and dashed, RUN live, nothing posted
  [{ idx: 1, dwellMs: null }], // six readings posted, three trades named, three shortfalls
  [{ idx: 2, dwellMs: null }], // as 1, plus the closing question asked and unanswered
];

// ---------------------------------------------------------------- the model
// One job, three ways of paying for it. g = 10 N/kg is the value every lesson in this
// bundle uses, so these numbers are the ones the prose can be checked against, and the
// SAME 200 N load rises the SAME 2.0 m in all three rows. That is the slide's "one
// product", and it is arithmetic here rather than a stored answer: every figure on the
// panel is `effortN * effortM` or `LOAD_N * RISE_M`, and the shortfall is their
// difference, so no row can be made to come out ahead by moving anything.
const LOAD_N = 200; // a 20 kg crate
const RISE_M = 2.0;
const JOB_J = LOAD_N * RISE_M; // 400 J - the number on all three output meters
const TRACK_J = 500; // ONE track for all six meters, so the three gaps are comparable

const ROWS = [
  // 220 N over the same 2.0 m the load rises: a fixed wheel changes the direction and
  // nothing else, and 20 N of it is lost in the bearings.
  { key: 'wheel', name: 'WHEEL', trade: 'direction', effortN: 220, effortM: 2.0 },
  // 4.0 m of plank for a 2.0 m rise is a 2:1 slope, so an ideal effort is 100 N; the
  // 115 N is the plank and the crate taking their share.
  { key: 'ramp', name: 'RAMP', trade: 'force for distance', effortN: 115, effortM: 4.0 },
  // A bar with a 1.0 m load arm and a 0.5 m effort arm is 2:1 the other way, so the
  // effort is 400 N over half the distance; 435 N is the pin and the bar.
  { key: 'bar', name: 'BAR', trade: 'distance for force', effortN: 435, effortM: 1.0 },
];

// The run, in three phases. Each phase ends the one before it and posts its own numbers,
// so a value is never on the panel before the bar that earned it, and the run always
// ends in its last phase - nothing is left moving and nothing has to be stopped.
const T_IN = 700; // the three input meters fill, and the tick on each output track appears
const T_OUT = 800; // the three output meters fill, and each gap opens
const T_SHORT = 700; // the three shortfalls post
const T_AUTO = 380; // a resumed lesson waits this long, so no beat mounts empty
const T_DRAIN = 260; // a second press empties the six tracks before it refills them

const NOTE_ROWS = [
  { text: 'drawn small and schematic', sub: 'the panel compares the ledgers, not the geometry' },
  { text: 'the same 200 N load, 2.0 m up, in all three rows', sub: 'the machines differ in the numbers that trade, not in the job' },
];

// ---------------------------------------------------------------- the figures
// viewBox 0 0 200 120, and not one word drawn inside any of them: at 200 user units wide
// a 14 px word lands under the 14 px floor once the figure is scaled down, so every word
// on the panel lives in the card's own DOM. The moving parts are four groups whose two
// poses are ONE function of the numbers above, applied by `poses()` - no timer writes a
// position, and nothing on the panel can be moved by hand.

// A shaft with a head at the far end: the push and the pull, drawn not written.
function shaft(x1, y1, x2, y2, cls) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const r = 7;
  const p = (n) => `${n[0].toFixed(1)},${n[1].toFixed(1)}`;
  const b1 = [x2 - r * Math.cos(a - 0.46), y2 - r * Math.sin(a - 0.46)];
  const b2 = [x2 - r * Math.cos(a + 0.46), y2 - r * Math.sin(a + 0.46)];
  return `<g class="${cls}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`
    + `<polygon points="${p([x2, y2])} ${p(b1)} ${p(b2)}"/></g>`;
}

// All three figures share one 200 x 124 box and one ground line, so three very
// different machines sit on the same shelf and the cards stay the same height.

// --- the wheel. At rest the load hangs LOW and the pull is HIGH; one pull of 2.0 m
// swaps them, and the rope is 26 px long on either side of the wheel's centre, so each
// end travels 26 px and the wheel turns 26/20 rad - the turn is the rope's arithmetic.
const W_CX = 100;
const W_CY = 44;
const W_R = 20;
const W_SPAN = 60; // the drawn rope length, so scaleY() is a length and not a number
const W_PULL = 26; // 2.0 m of travel at this figure's own 13 px/m
const W_DEG = (W_PULL / W_R) * (180 / Math.PI); // 74.5 deg
// rope end y, in metres of travel: 0 is the rest pose, 2.0 the end of the pull
const ropeY = (metres) => W_CY + 26 + metres * (W_PULL / 2.0);

function wheelFigure() {
  return `<svg class="tm-fig tm-fig--wheel" viewBox="0 0 200 124" role="img" aria-label="A wheel on a ceiling strap with a rope over it: the rope is pulled down on the left and the load hangs on the right.">
    <rect class="tm-wood" x="12" y="8" width="176" height="8" rx="3"/>
    <rect class="tm-hook" x="${W_CX - 5}" y="16" width="10" height="6" rx="2"/>
    <line class="tm-strap" x1="${W_CX}" y1="22" x2="${W_CX}" y2="${W_CY - W_R}"/>
    <g class="tm-wheelg">
      <circle class="tm-rim" cx="${W_CX}" cy="${W_CY}" r="${W_R}"/>
      <line class="tm-spoke" x1="${W_CX - W_R + 4}" y1="${W_CY}" x2="${W_CX + W_R - 4}" y2="${W_CY}"/>
      <line class="tm-spoke" x1="${W_CX}" y1="${W_CY - W_R + 4}" x2="${W_CX}" y2="${W_CY + W_R - 4}"/>
      <circle class="tm-hub" cx="${W_CX}" cy="${W_CY}" r="5"/>
    </g>
    <path class="tm-rope" d="M${W_CX - W_R} ${W_CY} A${W_R} ${W_R} 0 0 1 ${W_CX + W_R} ${W_CY}"/>
    <g class="tm-ropearm" data-arm="l"><line class="tm-rope" x1="${W_CX - W_R}" y1="${W_CY}" x2="${W_CX - W_R}" y2="${W_CY + W_SPAN}"/></g>
    <g class="tm-ropearm" data-arm="r"><line class="tm-rope" x1="${W_CX + W_R}" y1="${W_CY}" x2="${W_CX + W_R}" y2="${W_CY + W_SPAN}"/></g>
    <g class="tm-crate">
      <line class="tm-cord" x1="${W_CX + W_R}" y1="0" x2="${W_CX + W_R}" y2="5"/>
      <rect class="tm-box" x="${W_CX + 3}" y="5" width="26" height="20" rx="2"/>
      <rect class="tm-boxl" x="${W_CX + 7}" y="9" width="18" height="5" rx="1"/>
    </g>
    ${shaft(66, 68, 66, 100, 'tm-arrow tm-arrow--in')}
    ${shaft(140, 102, 140, 76, 'tm-arrow tm-arrow--out')}
  </svg>`;
}

// --- the ramp. A 2:1 slope drawn as a 2:1 slope: 144 px of run for 72 px of rise, which
// at this figure's 36 px/m is the 4.0 m plank for the 2.0 m rise, and the crate travels
// most of the way along it. The rise is dimensioned at the top, not labelled.
const RP_X0 = 26;
const RP_Y0 = 116;
const RP_RUN = 144;
const RP_RISE = 72;
const RP_PX_M = RP_RUN / 4.0; // 36 px per metre of plank
const RP_DEG = (Math.atan2(-RP_RISE, RP_RUN) * 180) / Math.PI;
const rampAt = (m) => [RP_X0 + m * RP_PX_M, RP_Y0 - m * RP_PX_M * 0.5];

function rampFigure() {
  const top = [RP_X0 + RP_RUN, RP_Y0 - RP_RISE];
  return `<svg class="tm-fig tm-fig--ramp" viewBox="0 0 200 124" role="img" aria-label="A plank at a two-to-one slope with a crate on it, a push arrow up the slope, and the rise dimensioned beside the top of the plank.">
    <line class="tm-floor" x1="8" y1="${RP_Y0}" x2="192" y2="${RP_Y0}"/>
    <polygon class="tm-wedge" points="${RP_X0},${RP_Y0} ${top[0]},${top[1]} ${top[0]},${RP_Y0}"/>
    <line class="tm-plank" x1="${RP_X0}" y1="${RP_Y0}" x2="${top[0]}" y2="${top[1]}"/>
    <g class="tm-dim">
      <line class="tm-dimv" x1="186" y1="${RP_Y0 - 4}" x2="186" y2="${top[1] + 4}"/>
      <line class="tm-dimh" x1="177" y1="${RP_Y0 - 4}" x2="195" y2="${RP_Y0 - 4}"/>
      <line class="tm-dimh" x1="177" y1="${top[1] + 4}" x2="195" y2="${top[1] + 4}"/>
    </g>
    <g class="tm-rampcrate">
      <rect class="tm-box" x="-14" y="-23" width="28" height="23" rx="2"/>
      <rect class="tm-boxl" x="-10" y="-19" width="20" height="5" rx="1"/>
    </g>
    ${shaft(72, 78, 104, 62, 'tm-arrow tm-arrow--in')}
  </svg>`;
}

// --- the bar. A 1.0 m load arm and a 0.5 m effort arm, drawn 100 px and 50 px, so this
// figure is at 100 px/m. A pull of 12 deg drops the short end 10.4 px and lifts the long
// end 20.8 px: the ends move exactly twice as far as each other because the arms are
// twice as long, and that ratio is the drawing rather than a caption.
const BR_PX = 130;
const BR_PY = 62;
const BR_LOAD_X = 30;
const BR_EFF_X = 180;
const BR_DEG = 12;
const BR_R = Math.sin((BR_DEG * Math.PI) / 180);
const BR_UP = (BR_PX - BR_LOAD_X) * BR_R; // 20.8 px
const BR_SIDE = (BR_LOAD_X - BR_PX) * (1 - Math.cos((BR_DEG * Math.PI) / 180));

function barFigure() {
  return `<svg class="tm-fig tm-fig--bar" viewBox="0 0 200 124" role="img" aria-label="A bar resting on a triangular fulcrum, a load hung from the long arm on the left and a push arrow over the short arm on the right.">
    <line class="tm-floor" x1="8" y1="118" x2="192" y2="118"/>
    <polygon class="tm-fulcrum" points="${BR_PX},${BR_PY + 4} ${BR_PX - 20},118 ${BR_PX + 20},118"/>
    <g class="tm-bar">
      <rect class="tm-beambar" x="${BR_LOAD_X}" y="${BR_PY - 5}" width="${BR_EFF_X - BR_LOAD_X}" height="10" rx="5"/>
      <circle class="tm-pin" cx="${BR_PX}" cy="${BR_PY}" r="4"/>
    </g>
    <g class="tm-barload">
      <line class="tm-cord" x1="${BR_LOAD_X}" y1="${BR_PY + 5}" x2="${BR_LOAD_X}" y2="92"/>
      <rect class="tm-box" x="${BR_LOAD_X - 13}" y="92" width="26" height="21" rx="2"/>
      <rect class="tm-boxl" x="${BR_LOAD_X - 9}" y="96" width="18" height="5" rx="1"/>
    </g>
    ${shaft(BR_EFF_X, 22, BR_EFF_X, 50, 'tm-arrow tm-arrow--in')}
    ${shaft(BR_LOAD_X + 24, 112, BR_LOAD_X + 24, 82, 'tm-arrow tm-arrow--out')}
  </svg>`;
}

const FIGURES = { wheel: wheelFigure, ramp: rampFigure, bar: barFigure };

// ---------------------------------------------------------------- the card
function qmark() {
  return '<span class="sim-q" aria-hidden="true">?</span>';
}

function meterHtml(side, row) {
  const n = side === 'in' ? row.effortN : LOAD_N;
  const m = side === 'in' ? row.effortM : RISE_M;
  return `<div class="tm-meter" data-side="${side}">
    <div class="tm-mhead"><span class="tm-mlabel">${side === 'in' ? 'in' : 'out'}</span>`
    + `<span class="tm-mval" data-mval data-unknown>${qmark()}</span></div>`
    + `<div class="tm-track"><i class="tm-fill" data-fill></i><i class="tm-gap" data-gap></i>`
    + `<i class="tm-tick" data-tick></i></div>`
    + `<p class="tm-rule">${n} N x ${m.toFixed(1)} m</p>
  </div>`;
}

function cardHtml(row) {
  return `<section class="sim-card tm-card" data-card="${row.key}">
    <header class="sim-row tm-cardhead"><span class="sim-tag sim-tag--accent">${esc(row.name)}</span></header>
    <div class="tm-figbox">${FIGURES[row.key]()}</div>
    ${meterHtml('in', row)}${meterHtml('out', row)}
    <div class="tm-trade"><span class="tm-tlabel">trades</span><span class="tm-tval">${esc(row.trade)}</span></div>
  </section>`;
}

// ---------------------------------------------------------------- the scene
export class ThreeMachineMetersScene extends DomSimulation {
  static WIDTH = 680;
  static HEIGHT = 905; // sim-layout natural on the tallest beat (b2: 891); FIT sizes the rest
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1620; // sim-layout portrait natural (b2: 1608)
  static MIN_SCALE = 1;
  static FIT = true;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'A pulley, a ramp and a lever drawn side by side, each with an input meter and an output meter on one shared 0-500 joule scale and a tick on the output meter at that row\'s own input. One run fills all six meters, every output lands below its input, and the three shortfalls post in a row underneath. A closing card asks where the missing part goes and leaves it unanswered.';
  static CONTROLS = []; // the stub's one run control is the in-panel button; there is no dial

  constructor(container, config) {
    super(container, config);
    this.run = null; // { step, phase, timers[] } - the run in flight, if any
    this.posted = { in: false, out: false, short: false };
    this.runCount = 0;
    this.celebrated = false;
    this.cards = new Map();
    this.parts = {};
  }

  async setup() {
    await super.setup();
    this.render({ css: SIM_LOOK_DOM_CSS + CSS, html: HTML });
    let sumIn = 0;
    let sumOut = 0;
    for (const row of ROWS) {
      const v = this.numbers(row);
      sumIn += v.inJ;
      sumOut += v.outJ;
      const card = this.root?.querySelector?.(`[data-card="${row.key}"]`);
      if (!card) continue;
      this.cards.set(row.key, {
        row,
        inFill: card.querySelector('[data-side="in"] [data-fill]'),
        inVal: card.querySelector('[data-side="in"] [data-mval]'),
        outFill: card.querySelector('[data-side="out"] [data-fill]'),
        outVal: card.querySelector('[data-side="out"] [data-mval]'),
        gap: card.querySelector('[data-side="out"] [data-gap]'),
        tick: card.querySelector('[data-side="out"] [data-tick]'),
        short: this.root?.querySelector?.(`[data-short="${row.key}"] [data-sval]`),
      });
    }
    this.btn = this.root?.querySelector?.('[data-runbtn]');
    this.hint = this.root?.querySelector?.('[data-hint]');
    this.strip = this.root?.querySelector?.('[data-strip]');
    const total = this.root?.querySelector?.('[data-total]');
    if (total) total.textContent = `${sumIn} J in - ${sumOut} J out`;
    this.parts = {
      armL: this.root?.querySelector?.('[data-arm="l"]'),
      armR: this.root?.querySelector?.('[data-arm="r"]'),
      wheel: this.root?.querySelector?.('.tm-wheelg'),
      crate: this.root?.querySelector?.('.tm-crate'),
      rampCrate: this.root?.querySelector?.('.tm-rampcrate'),
      bar: this.root?.querySelector?.('.tm-bar'),
      barLoad: this.root?.querySelector?.('.tm-barload'),
    };
    this.btn?.addEventListener?.('click', () => this.startRun());
    // The pose is set AFTER the phase, so the root already reads data-phase="0" and the
    // CSS holds the four groups still: a load that slid down into place on the first
    // paint would be a move the learner never asked for.
    this._syncStep();
    this._paint();
    this.poses(false);
  }

  destroy() {
    this.stopRun();
    this.cards = new Map();
    this.parts = {};
    this.btn = null;
    this.hint = null;
    this.strip = null;
    super.destroy();
  }

  // ---- the one rule -------------------------------------------------------

  // Every figure on the panel is this, for every row, at every moment of the run: the
  // input is the effort times its own distance, the output is the shared job, and the
  // shortfall is the difference. There is no dial, so nothing here can be improved.
  numbers(row) {
    const inJ = row.effortN * row.effortM;
    const outJ = JOB_J;
    return { inJ, outJ, shortJ: inJ - outJ, balanced: outJ < inJ };
  }

  // ---- the two poses of the four moving groups ----------------------------
  // One function of the model's own numbers. The wheel's rope ends swap by the load's
  // 2.0 m of travel at 13 px/m and the wheel turns by that arc, the crate is the plank's
  // 4.0 m at 36 px/m, and the bar is 12 deg on arms of 100 px and 50 px, so its load
  // rises exactly twice what its effort falls.
  poses(going) {
    const p = this.parts || {};
    // px, not bare user units: `translate(0 96)` is not valid CSS and the whole
    // declaration is dropped, which is how a figure ends up drawn with no pose at all.
    const arm = (el, cx, metres) => {
      if (!el) return;
      const y = ropeY(metres);
      el.style.transform = `translate(${cx}px, ${W_CY}px) scale(1, ${((y - W_CY) / W_SPAN).toFixed(4)}) translate(${-cx}px, ${-W_CY}px)`;
    };
    // the pull goes down as the load goes up: the two ends of one rope, in opposite senses
    arm(p.armL, W_CX - W_R, going ? 2.0 : 0);
    arm(p.armR, W_CX + W_R, going ? 0 : 2.0);
    if (p.crate) p.crate.style.transform = `translate(0px, ${ropeY(going ? 0 : 2.0).toFixed(1)}px)`;
    if (p.wheel) p.wheel.style.transform = `translate(${W_CX}px, ${W_CY}px) rotate(${going ? -W_DEG.toFixed(1) : 0}deg) translate(${-W_CX}px, ${-W_CY}px)`;
    // 0.8 m and 3.5 m of the 4.0 m plank, not 0.5 and 3.5: a 28 px crate centred at
    // 0.5 m hangs its top-left corner off the plank's low end, so it reads as falling.
    const [cx, cy] = rampAt(going ? 3.5 : 0.8);
    if (p.rampCrate) p.rampCrate.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px) rotate(${RP_DEG.toFixed(1)}deg)`;
    if (p.bar) p.bar.style.transform = `translate(${BR_PX}px, ${BR_PY}px) rotate(${going ? BR_DEG : 0}deg) translate(${-BR_PX}px, ${-BR_PY}px)`;
    if (p.barLoad) p.barLoad.style.transform = going ? `translate(${BR_SIDE.toFixed(1)}px, ${(-BR_UP).toFixed(1)}px)` : 'translate(0px, 0px)';
  }

  // ---- the run ------------------------------------------------------------

  startRun() {
    if (this.run) return false;
    this._launch();
    return true;
  }

  // The run itself. `startRun` is the guard on the learner's press; this is also what a
  // resumed lesson calls, because the auto-arm has already taken the scene's own slot.
  _launch() {
    // A run belongs to the beat that launched it, and the panel it posts into is
    // wanted on every later beat, so a beat change never drops a run in flight.
    this.run = { step: this.stepIndex, phase: -1, timers: [] };
    this.runCount += 1;
    this.posted = { in: false, out: false, short: false };
    this.celebrated = false;
    this._paint();
    this.poses(true);
    this._arm(T_DRAIN, () => this.root?.classList?.remove?.('tm-draining'));
    this.root?.classList?.add?.('tm-draining');
    this._phase(0);
  }

  // One phase at a time, each arming the next, and the last one ending the run. A
  // phase that arrives late (a throttled tab, a beat change) is dropped rather than
  // replayed, so the chain can never run past its own end.
  _phase(n) {
    const r = this.run;
    if (!r || r.phase >= n) return;
    r.phase = n;
    this._paint();
    if (n === 0) this._arm(T_IN, () => this._phase(1));
    else if (n === 1) this._arm(T_OUT, () => this._phase(2));
    else if (n === 2) this._arm(T_SHORT, () => this._phase(3));
    else {
      this.posted = { in: true, out: true, short: true };
      this.run = null;
      this._paint();
    }
  }

  stopRun() {
    for (const t of this.run?.timers ?? []) clearTimeout(t);
    this.run = null;
  }

  _arm(ms, fn) {
    const r = this.run;
    if (!r) return;
    const id = setTimeout(() => {
      if (r.timers) r.timers = r.timers.filter((t) => t !== id);
      fn();
    }, ms);
    r.timers.push(id);
  }

  // ---- beats --------------------------------------------------------------

  onStep() {
    // The postings are never reset by a beat change: every beat of this slide is
    // talking about the six numbers the run put on the panel, and a posting that
    // vanished on the next beat would be a number this beat never earned. A beat that
    // arrives with nothing posted is a resumed lesson, and it arms the run itself, so
    // beat 1 and beat 2 never mount empty.
    this._syncStep();
    if ((this.stepIndex ?? 0) >= 1 && !this.posted.short && !this.run) {
      this.run = { step: this.stepIndex, phase: -1, timers: [] };
      this._arm(T_AUTO, () => {
        this.run = null;
        this._launch();
      });
    }
    this._paint();
  }

  _syncStep() {
    if (this.root) this.root.dataset.step = String(this.stepIndex ?? 0);
  }

  // ---- paint --------------------------------------------------------------

  _paint() {
    const n = this.run && this.run.phase >= 0 ? this.run.phase : (this.posted.short ? 3 : 0);
    for (const c of this.cards?.values?.() ?? []) {
      const v = this.numbers(c.row);
      // Each meter's width IS its own number on the shared track, and the gap is the
      // difference between the two - so the drawn sliver between the output bar and the
      // tick is the shortfall the strip posts, at the same scale as the bars.
      const inPct = n >= 1 ? (v.inJ / TRACK_J) * 100 : 0;
      const outPct = n >= 2 ? (v.outJ / TRACK_J) * 100 : 0;
      this._post(c.inFill, 'width', inPct);
      this._post(c.outFill, 'width', outPct);
      this._post(c.tick, 'left', inPct);
      this._post(c.gap, 'left', outPct);
      this._post(c.gap, 'width', Math.max(0, inPct - outPct));
      this._read(c.inVal, n >= 1 ? v.inJ : null);
      this._read(c.outVal, n >= 2 ? v.outJ : null);
      this._read(c.short, n >= 3 ? -v.shortJ : null);
    }
    if (this.root) {
      this.root.dataset.phase = String(n);
      this.root.dataset.ran = this.runCount > 0 ? 'yes' : 'no';
    }
    if (this.btn) {
      this.btn.textContent = this.runCount > 0 ? 'run again' : 'run all three';
      if (this.run) this.btn.setAttribute('aria-disabled', 'true');
      else this.btn.removeAttribute('aria-disabled');
    }
    this._maybeCelebrate();
  }

  _post(el, prop, pct) {
    const s = `${pct.toFixed(2)}%`;
    if (el?.style?.[prop] !== s) el?.style?.setProperty?.(prop, s);
  }

  // A reading is a number or the kit's dashed "?", never both and never a blank.
  _read(el, joules) {
    if (!el) return;
    if (joules == null) {
      if (el.dataset.unknown !== 'yes') {
        el.innerHTML = qmark();
        el.dataset.unknown = 'yes';
      }
      return;
    }
    const text = `${joules} J`;
    if (el.textContent !== text) el.textContent = text;
    if (el.dataset.unknown) delete el.dataset.unknown;
  }

  // The concept is three gaps the learner can compare, not the press: celebrate when
  // every shortfall is on the panel, every row is a losing row, and the strip that shows
  // them is actually on screen. Once per mount.
  _maybeCelebrate() {
    if (this.celebrated || !this.posted.short) return;
    if ((this.stepIndex ?? 0) < 1) return;
    if (!this.cards || this.cards.size !== ROWS.length) return;
    for (const c of this.cards.values()) {
      if (!this.numbers(c.row).balanced) return;
    }
    this.celebrated = true;
    burst?.(this.strip);
  }
}

// The styles. Nothing here re-invents a card, a tag or a field - those are the kit's
// classes. This is one scene's own geometry: the six tracks, the figures, the gaps, and
// the run's three phases.
const CSS = `
.sim-dom-root .tm-board { display: flex; flex-direction: column; gap: var(--sim-space-3); }
.sim-dom-root .tm-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sim-space-2); }
.sim-dom-root .tm-run {
  font: inherit; font-size: var(--sim-text-sm); font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; padding: 7px var(--sim-space-3); border: var(--sim-border);
  border-radius: var(--sim-radius-sm); background: var(--sim-accent); color: var(--sim-bg-deep);
  cursor: pointer;
}
.sim-dom-root .tm-run:focus-visible { outline: 3px solid var(--sim-label); outline-offset: 2px; }
.sim-dom-root .tm-run[aria-disabled="true"] { background: var(--sim-bg-deep); color: var(--sim-label-muted); cursor: default; }
.sim-dom-root .tm-hint, .sim-dom-root .tm-cap { font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); }
.sim-dom-root[data-ran="no"] .tm-hint { animation: tm-pulse 1.6s ease-in-out infinite; }
@keyframes tm-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

.sim-dom-root .tm-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sim-space-3); }
.sim-dom-root--portrait .tm-grid { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root .tm-card { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.sim-dom-root .tm-cardhead .sim-tag { border-radius: var(--sim-radius-sm); letter-spacing: 0.1em; }
.sim-dom-root .tm-figbox { line-height: 0; }
.sim-dom-root .tm-fig { display: block; width: 100%; height: auto; }

/* ---- portrait: each card lies down, so the figure sits beside its own two meters
   instead of three 350 px cards stacking into a 2000 px column. */
.sim-dom-root--portrait .tm-card {
  display: grid; grid-template-columns: 148px minmax(0, 1fr);
  column-gap: var(--sim-space-3); row-gap: var(--sim-space-1);
}
.sim-dom-root--portrait .tm-cardhead { grid-column: 1 / -1; }
.sim-dom-root--portrait .tm-figbox { grid-column: 1; grid-row: 2 / span 3; align-self: center; }
.sim-dom-root--portrait .tm-fig { max-width: 148px; margin: 0; }
.sim-dom-root--portrait .tm-meter:nth-of-type(1) { grid-column: 2; grid-row: 2; }
.sim-dom-root--portrait .tm-meter:nth-of-type(2) { grid-column: 2; grid-row: 3; }
.sim-dom-root--portrait .tm-trade { grid-column: 2; grid-row: 4; }

/* ---- the two meters. One grid, so both tracks in a card are the same width. */
.sim-dom-root .tm-meter { display: flex; flex-direction: column; gap: 2px; }
.sim-dom-root .tm-mhead { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sim-space-1); }
.sim-dom-root .tm-mlabel { font-size: var(--sim-text-sm); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sim-label-muted); }
.sim-dom-root .tm-mval { font-size: var(--sim-text-lg); font-weight: 800; font-variant-numeric: tabular-nums; color: var(--sim-label); }
.sim-dom-root .tm-sval { font-size: var(--sim-text-lg); font-weight: 800; font-variant-numeric: tabular-nums; color: var(--sim-accent); }
.sim-dom-root .tm-mval[data-unknown], .sim-dom-root .tm-sval[data-unknown] { border-bottom: 2px dashed color-mix(in oklab, var(--sim-stroke) 80%, transparent); }
.sim-dom-root .tm-rule { margin: 0; font-size: var(--sim-text-sm); font-weight: 600; font-variant-numeric: tabular-nums; color: var(--sim-label-muted); }
.sim-dom-root .tm-track {
  position: relative; height: 16px; border-radius: var(--sim-radius-pill);
  background: color-mix(in oklab, var(--sim-stroke) 22%, var(--sim-bg-deep));
  border: 2px solid color-mix(in oklab, var(--sim-stroke) 75%, transparent);
}
.sim-dom-root .tm-fill, .sim-dom-root .tm-gap {
  position: absolute; top: 0; bottom: 0; width: 0; left: 0;
  border-radius: var(--sim-radius-pill);
  transition-property: width, left; transition-timing-function: cubic-bezier(0.2, 0.7, 0.4, 1);
}
.sim-dom-root [data-side="in"] .tm-fill { background: var(--sim-series-1); }
.sim-dom-root [data-side="out"] .tm-fill { background: var(--sim-series-3); }
.sim-dom-root .tm-gap {
  opacity: 0; border-radius: 0 var(--sim-radius-pill) var(--sim-radius-pill) 0;
  background: repeating-linear-gradient(135deg, color-mix(in oklab, var(--sim-series-1) 55%, transparent) 0 4px, transparent 4px 9px);
}
.sim-dom-root .tm-tick {
  position: absolute; top: 0; bottom: 0; width: 0; left: 0; opacity: 0;
  border-left: 3px solid var(--sim-accent);
  transform: scaleY(1.45);
  transition-property: left, opacity; transition-duration: 220ms; transition-timing-function: ease-out;
}
.sim-dom-root[data-phase="0"] .tm-ropearm, .sim-dom-root[data-phase="0"] .tm-wheelg,
.sim-dom-root[data-phase="0"] .tm-bar, .sim-dom-root[data-phase="0"] .tm-crate,
.sim-dom-root[data-phase="0"] .tm-rampcrate, .sim-dom-root[data-phase="0"] .tm-barload { transition: none; }
.sim-dom-root[data-phase="1"] .tm-fill { transition-duration: 700ms; }
.sim-dom-root[data-phase="2"] .tm-fill { transition-duration: 800ms; }
.sim-dom-root[data-phase="1"] .tm-tick, .sim-dom-root[data-phase="2"] .tm-tick, .sim-dom-root[data-phase="3"] .tm-tick { opacity: 1; }
.sim-dom-root[data-phase="2"] .tm-gap, .sim-dom-root[data-phase="3"] .tm-gap { opacity: 1; }
.sim-dom-root.tm-draining .tm-fill, .sim-dom-root.tm-draining .tm-gap,
.sim-dom-root.tm-draining .tm-tick { transition-duration: 200ms; }
/* Two fixed rows, label above value, so all three cards keep the same height and the
   six meters stay on one line across the board - a comparison read across rows cannot
   have two of its rows at different heights. */
.sim-dom-root .tm-trade {
  display: none; flex-direction: column; align-items: flex-start; gap: 0;
  border-top: 1px dashed color-mix(in oklab, var(--sim-stroke) 70%, transparent); padding-top: 5px;
}
.sim-dom-root .tm-tlabel { font-size: var(--sim-text-sm); font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sim-label-muted); }
.sim-dom-root .tm-tval { font-size: var(--sim-text-sm); font-weight: 800; color: var(--sim-accent); }

/* ---- the shortfall strip: three names and three numbers, and no bar. On a 0-500 J
   track a 40 J shortfall is a 7 px sliver, and the gap is already drawn on the meter
   above it, so a second bar would only be a smaller, vaguer copy of the same fact. */
.sim-dom-root .tm-strip { display: none; position: relative; }
.sim-dom-root .tm-striprow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sim-space-2); }
.sim-dom-root--portrait .tm-striprow { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root .tm-short { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sim-space-2); padding: 4px var(--sim-space-2); border-radius: var(--sim-radius-sm); background: var(--sim-bg-deep); }
.sim-dom-root .tm-sname { font-size: var(--sim-text-sm); font-weight: 800; letter-spacing: 0.08em; color: var(--sim-label-muted); }

/* ---- beat 2: the question, asked three times and answered nowhere */
.sim-dom-root .tm-q { display: none; }
.sim-dom-root .tm-qrow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sim-space-2); }
.sim-dom-root .tm-ask { display: flex; align-items: center; justify-content: space-between; gap: var(--sim-space-2); flex-wrap: wrap; }
.sim-dom-root .tm-asktag { border-radius: var(--sim-radius-sm); letter-spacing: 0.05em; }
.sim-dom-root .tm-zero { font-variant-numeric: tabular-nums; }
.sim-dom-root .tm-askbox { border: 2px dashed color-mix(in oklab, var(--sim-stroke) 85%, transparent); background: transparent; }
.sim-dom-root .tm-askq {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 22px; height: 22px; border: 2px dashed var(--sim-accent); border-radius: 50%;
  font-size: var(--sim-text-sm); font-weight: 800; color: var(--sim-accent);
}

/* ---- the figures: strokes and fills only, not one word drawn inside one */
.sim-dom-root .tm-wood { fill: color-mix(in oklab, var(--sim-series-8) 62%, var(--sim-bg-deep)); }
.sim-dom-root .tm-hook { fill: color-mix(in oklab, var(--sim-series-8) 45%, var(--sim-bg-deep)); }
.sim-dom-root .tm-wedge { fill: color-mix(in oklab, var(--sim-series-3) 16%, var(--sim-bg-deep)); }
.sim-dom-root .tm-strap, .sim-dom-root .tm-cord, .sim-dom-root .tm-spoke { stroke: color-mix(in oklab, var(--sim-label) 55%, var(--sim-bg-deep)); stroke-width: 2.5; stroke-linecap: round; }
.sim-dom-root .tm-rim { fill: color-mix(in oklab, var(--sim-bg-deep) 72%, var(--sim-series-1)); stroke: var(--sim-series-1); stroke-width: 3.5; }
.sim-dom-root .tm-hub { fill: var(--sim-label); }
.sim-dom-root .tm-rope { fill: none; stroke: color-mix(in oklab, var(--sim-label) 70%, var(--sim-bg-deep)); stroke-width: 3; stroke-linecap: round; }
.sim-dom-root .tm-ropearm line { vector-effect: non-scaling-stroke; }
.sim-dom-root .tm-floor { stroke: color-mix(in oklab, var(--sim-label) 32%, var(--sim-bg-deep)); stroke-width: 3; stroke-linecap: round; }
.sim-dom-root .tm-plank { stroke: var(--sim-series-3); stroke-width: 8; stroke-linecap: round; }
.sim-dom-root .tm-box { fill: var(--sim-series-2); stroke: color-mix(in oklab, var(--sim-series-2) 48%, var(--sim-bg-deep)); stroke-width: 2; }
.sim-dom-root .tm-boxl { fill: color-mix(in oklab, var(--sim-series-2) 28%, var(--sim-bg-surface)); }
.sim-dom-root .tm-fulcrum { fill: color-mix(in oklab, var(--sim-series-8) 55%, var(--sim-bg-deep)); stroke: color-mix(in oklab, var(--sim-series-8) 85%, var(--sim-bg-deep)); stroke-width: 2; stroke-linejoin: round; }
.sim-dom-root .tm-beambar { fill: var(--sim-series-8); stroke: color-mix(in oklab, var(--sim-series-8) 50%, var(--sim-bg-deep)); stroke-width: 2; }
.sim-dom-root .tm-pin { fill: var(--sim-bg-deep); stroke: var(--sim-label); stroke-width: 2.5; }
.sim-dom-root .tm-dimv, .sim-dom-root .tm-dimh { stroke: color-mix(in oklab, var(--sim-label) 50%, var(--sim-bg-deep)); stroke-width: 2.5; stroke-linecap: round; }
.sim-dom-root .tm-dimv { stroke-dasharray: 5 4; }
.sim-dom-root .tm-arrow line { stroke: var(--sim-accent); stroke-width: 3; stroke-linecap: round; }
.sim-dom-root .tm-arrow polygon { fill: var(--sim-accent); }
.sim-dom-root .tm-arrow--out line { stroke: var(--sim-series-3); }
.sim-dom-root .tm-arrow--out polygon { fill: var(--sim-series-3); }

/* ---- the run's two poses, applied by poses() and eased by the compositor */
.sim-dom-root .tm-ropearm, .sim-dom-root .tm-wheelg, .sim-dom-root .tm-bar,
.sim-dom-root .tm-crate, .sim-dom-root .tm-rampcrate, .sim-dom-root .tm-barload {
  transform-box: view-box;
  transition-property: transform;
  transition-duration: 2300ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* ---- which beat shows what. display, never a reserved void. */
.sim-dom-root[data-step="1"] .tm-trade, .sim-dom-root[data-step="2"] .tm-trade { display: flex; }
.sim-dom-root[data-step="1"] .tm-strip, .sim-dom-root[data-step="2"] .tm-strip { display: block; }
.sim-dom-root[data-step="2"] .tm-q { display: block; }

/* ---- the note card, laid out as a strip at the foot of the board rather than the
   kit's modal overlay: it dims a scene the learner is meant to be reading. */
.sim-dom-root .tm-note { display: block; }
.sim-dom-root .tm-note .sl-note { position: static; display: block; padding: 0; background: none; animation: none; }
.sim-dom-root .tm-note .sl-note__card {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: var(--sim-space-3);
  width: 100%; margin-top: 0; padding: var(--sim-space-2) var(--sim-space-3); border-width: 2px;
  gap: 5px; box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-accent) 45%, var(--sim-bg-deep)); animation: none;
}
.sim-dom-root .tm-note .sl-note__badge { font-size: var(--sim-text-sm); padding: 1px 9px; }
.sim-dom-root .tm-note .sl-note__row { grid-template-columns: minmax(0, 1fr); animation: none; }
.sim-dom-root .tm-note .sl-note__text { font-size: var(--sim-text-sm); font-weight: 700; line-height: 1.3; }
.sim-dom-root .tm-note .sl-note__sub { font-size: var(--sim-text-sm); font-weight: 600; line-height: 1.2; }
.sim-dom-root--portrait .tm-note .sl-note__card { grid-template-columns: minmax(0, 1fr); }
`;

// The board: the run control, the three machines, the shortfall strip, the closing
// question, and the note. Everything a beat does not show is `display: none` above, so
// FIT sizes each beat to what is really on it.
const HTML = `<div class="sim-card sl-backdrop tm-board">
  <div class="tm-head">
    <button class="tm-run" type="button" data-runbtn>run all three</button>
    <span class="tm-hint" data-hint>all three start together, and every one of them loses a little</span>
  </div>
  <div class="tm-grid">${ROWS.map(cardHtml).join('')}</div>
  <div class="sim-card tm-strip" data-strip>
    <div class="sim-row"><span class="sim-tag">SHORTFALL</span><span class="tm-cap">in - out, on every row</span></div>
    <div class="tm-striprow">${ROWS.map((r) => `<div class="tm-short" data-short="${r.key}">`
      + `<span class="tm-sname">${esc(r.name)}</span>`
      + `<span class="tm-sval" data-sval data-unknown>${qmark()}</span></div>`).join('')}</div>
  </div>
  <div class="sim-card tm-q">
    <div class="tm-ask">
      <span class="sim-tag sim-tag--accent tm-asktag">WHERE DOES THE MISSING PART GO?</span>
      <span class="sim-tag tm-zero">0 J created</span>
    </div>
    <div class="tm-qrow">${ROWS.map((r) => `<div class="tm-short tm-askbox">`
      + `<span class="tm-sname">${esc(r.name)}</span><span class="tm-askq" aria-label="not yet said">?</span></div>`).join('')}</div>
    <p class="sim-meta" data-total></p>
  </div>
  <div class="tm-note">${noteCardHtml(NOTE_ROWS, 'NOTE')}</div>
</div>`;
