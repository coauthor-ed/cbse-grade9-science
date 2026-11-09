/**
 * ChromatoLabScene - blk-l05-s05, five samples and four bottles.
 *
 * What the learner leaves with: a solvent carries only what it dissolves. Water (and the 2 % salt solution,
 * which is mostly water) dissolves the ink, the food colour and the fennel dye. It does not dissolve the green of
 * spinach or the colour of marigold petals: those need alcohol or a mixture of solvents. In water those two spots
 * stay on the line while the water climbs past them.
 *
 * One run: spot a sample, pour a bottle, say what you expect (separate colours, or one spot stays), watch the climb.
 * Finished strips hang on the drying line to compare. The learner does it all; each beat only picks a sensible start.
 *   b0  nothing chosen    b1  ink and water    b2  spinach in water    b3  spinach, no bottle: the learner picks it
 * The find is reaching for a bottle that moves a sample water would not. No frame loop: CSS transitions and one timer.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, burst } from 'simulations/base/kit/SimLookDom.js';
import { luma } from 'simulations/base/kit/SimLook.js';
import { bindFlow } from 'simulations/base/kit/SimFlowDom.js';

/** `water`: does water dissolve it? `rf`: how far up the run each colour ends (0 = line, 1 = wet edge). */
const SAMPLES = [
  { id: 'ink', name: 'black sketch-pen ink', water: true, swatch: '--cl-ink',
    bands: [['--sim-series-1', 0.26], ['--sim-series-4', 0.52], ['--sim-series-2', 0.82]] },
  { id: 'food', name: 'green food colour', water: true, swatch: '--sim-series-3',
    bands: [['--sim-series-1', 0.42], ['--sim-series-2', 0.8]] },
  { id: 'spinach', name: 'spinach extract', water: false, swatch: '--sim-chloro',
    bands: [['--sim-elev-low', 0.3], ['--sim-chloro', 0.56], ['--sim-series-2', 0.84]] },
  { id: 'petal', name: 'marigold petal colour', water: false, swatch: '--sim-series-8',
    bands: [['--sim-series-8', 0.42], ['--sim-series-2', 0.8]] },
  { id: 'fennel', name: 'coloured fennel seeds', water: true, swatch: '--sim-series-5',
    bands: [['--sim-series-4', 0.38], ['--sim-series-1', 0.72]] },
];

/** Four bottles in the slide's table. `aqueous` is the whole model. */
const SOLVENTS = [
  { id: 'water', name: 'water', short: 'water', aqueous: true, tone: '--sim-water' },
  { id: 'alcohol', name: 'alcohol', short: 'alcohol', aqueous: false, tone: '--sim-series-2' },
  { id: 'mix', name: 'mixture of solvents', short: 'mixture', aqueous: false, tone: '--sim-series-5' },
  { id: 'salt', name: '2 % m/v salt solution', short: '2 % salt', aqueous: true, tone: '--sim-salt' },
];

/** What each beat puts on the bench: [sample, solvent] picked, and strips already on the line. */
const BEATS = [
  { pick: [null, null], line: [] },
  { pick: ['ink', 'water'], line: [] },
  { pick: ['spinach', 'water'], line: [['ink', 'water'], ['food', 'salt']] },
  { pick: ['spinach', null], line: [['ink', 'water'], ['food', 'salt'], ['spinach', 'water']] },
];
const MAP = BEATS.map((_, i) => [{ idx: i, dwellMs: null }]);

const RUN_MS = 2400;     // the climb; a tap on the jar skips it
const LINE_MAX = 6;      // strips on the drying line
const MARK = { yes: '\u2713', no: '\u2717' };

const sample = (id) => SAMPLES.find((s) => s.id === id);
const solvent = (id) => SOLVENTS.find((v) => v.id === id);
const carried = (s, v) => (v.aqueous ? s.water : true);
const reduced = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** The strip: pencil line, wet paper up to the front, and either bands or one spot. */
function stripHtml({ s, v, phase, ok, mini = false }) {
  const wet = v ? `<span class="cl-wet" style="--v:var(${v.tone})"></span>` : '';
  const front = v ? '<span class="cl-front"></span>' : '';
  let marks = '';
  if (s && phase !== 'idle' && ok) {
    marks = s.bands.map(([c, rf]) => `<span class="cl-band" style="--c:var(${c});--rf:${rf}"></span>`).join('')
      + `<span class="cl-spot cl-spot--fade" style="--c:var(${s.swatch})"></span>`;
  } else if (s) {
    marks = `<span class="cl-spot${phase !== 'idle' ? ' cl-spot--stuck' : ''}" style="--c:var(${s.swatch})"></span>`;
  }
  const cls = ['cl-strip'];
  if (mini) cls.push('cl-strip--mini');
  // A run is painted at its start (bands on the line) and _run() adds is-run after a reflow, so it climbs.
  if (phase === 'done' || mini) cls.push('is-run', 'is-done');
  return `<span class="${cls.join(' ')}">${wet}<span class="cl-pencil"></span>${front}${marks}</span>`;
}

/** A bottle on the shelf: cap, glass, the liquid, and its own printed name under it. */
function bottleHtml(v, on) {
  return `<button type="button" class="cl-bottle${on ? ' is-on' : ''}" data-sflow-action="solvent" data-sflow-value="${v.id}"`
    + ` aria-pressed="${on}" style="--v:var(${v.tone})">`
    + '<span class="cl-bottle__cap" aria-hidden="true"></span><span class="cl-bottle__glass" aria-hidden="true">'
    + '<span class="cl-bottle__liq"></span><span class="cl-bottle__shine"></span></span>'
    + `<span class="cl-bottle__name">${esc(v.name)}</span></button>`;
}

export class ChromatoLabScene extends DomSimulation {
  static WIDTH = 680;
  static HEIGHT = 616;   // sim-layout --interact 40: 605px (six strips on the line)
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 980;   // sim-layout --interact 40: 963px
  static BEAT_STEP_MAP = MAP;
  // The run is the payoff and is longer than a lite tap motion; the bench is lit glass.
  static VISUAL_PROFILE = 'rich';
  static ARIA_LABEL =
    'A chromatography bench: pick one of five samples to spot on a paper strip, pour one of four solvents into the jar, '
    + 'say whether you expect separate colours or one spot, and watch the solvent climb. Finished strips hang on a drying line to compare.';
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this._s = null;
    this._v = null;
    this._phase = 'idle';      // idle | run | done
    this._expect = null;       // what the learner said before this run
    this._line = [];           // finished strips: { s, v, ok, expect, key }
    this._runTimer = 0;
    this._celebrated = false;
  }

  async setup() {
    await super.setup();
    this.render({ css: CSS, rootClass: 'cl-root', html: this._frameHtml() });
    this._paperTones();
    bindFlow(this.root, { action: (name, value) => this._act(name, value) });
  }

  // Paper is pale in both themes: the pale end of the palette is a different token in each.
  _paperTones() {
    const deep = getComputedStyle(this.root).getPropertyValue('--sim-bg-deep').trim();
    const dark = !deep || luma(deep) < 0.5;
    const set = (k, v) => this.root.style.setProperty(k, v);
    set('--cl-paper', dark ? 'color-mix(in oklab, var(--sim-label) 90%, var(--sim-bg-surface))' : 'var(--sim-bg-surface)');
    set('--cl-ink', dark ? 'var(--sim-bg-deep)' : 'var(--sim-label)');
  }

  refreshTheme() { this._paperTones(); }

  onStep(step) {
    this._land(false);
    const b = BEATS[step] ?? BEATS[0];
    // Strips the learner already made stay; a beat only adds the ones its prose assumes.
    for (const [s, v] of b.line) {
      if (!this._line.some((r) => r.s === s && r.v === v)) this._line.push(this._rec(s, v, null));
    }
    this._s = b.pick[0];
    this._v = b.pick[1];
    this._phase = 'idle';
    this._expect = null;
    this._paintAll();
  }

  _rec(s, v, expect) {
    return { s, v, ok: carried(sample(s), solvent(v)), expect };
  }

  // ---- input ------------------------------------------------------------------------------------

  _act(name, value) {
    if (name === 'skip') return this._land(true);
    if (name === 'sample' || name === 'solvent') {
      this._land(true);
      if (name === 'sample' && sample(value)) this._s = value;
      if (name === 'solvent' && solvent(value)) this._v = value;
      this._phase = 'idle';
      this._expect = null;
      return this._paintAll();
    }
    if (name === 'run') return this._run(value === 'bands' ? 'bands' : 'spot');
    return undefined;
  }

  _run(expect) {
    if (!this._s || !this._v || this._phase === 'run') return;
    this._expect = expect;
    this._phase = 'run';
    this._paintJar();
    this._paintRun();
    const strip = this.root.querySelector?.('[data-jar] .cl-strip');
    if (strip) {
      void strip.offsetWidth;          // commit the start state so the climb transitions
      strip.classList.add('is-run');
    }
    this._runTimer = setTimeout(() => this._land(true), reduced() ? 0 : RUN_MS + 60);
  }

  /** End a run (on its timer or a tap): the strip settles and is pegged on the drying line. */
  _land(paint) {
    if (this._runTimer) { clearTimeout(this._runTimer); this._runTimer = 0; }
    if (this._phase !== 'run') return;
    this._phase = 'done';
    const rec = this._rec(this._s, this._v, this._expect);
    const failedBefore = rec.ok && this._line.some((r) => r.s === rec.s && !r.ok);
    this._line = this._line.filter((r) => !(r.s === rec.s && r.v === rec.v));
    this._line.push({ ...rec, fresh: true });
    if (this._line.length > LINE_MAX) this._line = this._line.slice(-LINE_MAX);
    if (!paint) return;
    const strip = this.root.querySelector?.('[data-jar] .cl-strip');
    strip?.classList.add('is-done');
    this._paintRun();
    this._paintLine();
    // The skill the slide asks for: reaching for the bottle that moves a sample water would not.
    if (failedBefore && !this._celebrated) {
      this._celebrated = true;
      burst(this.root.querySelector?.('[data-jar]'));
    }
  }

  // ---- paint ------------------------------------------------------------------------------------

  _frameHtml() {
    return '<div class="cl-samples" data-samples></div>'
      + '<div class="cl-bench"><div class="cl-jarcol"><div class="cl-jar" data-jar></div><div class="cl-shadow" aria-hidden="true"></div></div>'
      + '<div class="cl-side"><div class="cl-shelf" data-bottles></div><div class="cl-run" data-run></div></div></div>'
      + '<div class="cl-line" data-line></div>';
  }

  _paintAll() {
    this._paintSamples();
    this._paintBottles();
    this._paintJar();
    this._paintRun();
    this._paintLine();
  }

  _host(name) {
    return this.root?.querySelector?.(`[data-${name}]`);
  }

  _paintSamples() {
    const host = this._host('samples');
    if (!host) return;
    host.innerHTML = '<span class="cl-k">Spot a sample</span><div class="cl-chips">' + SAMPLES.map((s) => {
      const on = this._s === s.id;
      return `<button type="button" class="cl-chip${on ? ' is-on' : ''}" data-sflow-action="sample" data-sflow-value="${s.id}"`
        + ` aria-pressed="${on}" style="--c:var(${s.swatch})"><span class="cl-chip__dot" aria-hidden="true"></span>`
        + `<span class="cl-chip__name">${esc(s.name)}</span></button>`;
    }).join('') + '</div>';
  }

  _paintBottles() {
    const host = this._host('bottles');
    if (!host) return;
    host.innerHTML = '<span class="cl-k">Pour a solvent</span><div class="cl-bottles">'
      + SOLVENTS.map((v) => bottleHtml(v, this._v === v.id)).join('') + '</div>';
  }

  _paintJar() {
    const host = this._host('jar');
    if (!host) return;
    const s = this._s ? sample(this._s) : null;
    const v = this._v ? solvent(this._v) : null;
    const ok = s && v ? carried(s, v) : false;
    const pool = v ? `<span class="cl-pool" style="--v:var(${v.tone})"></span>` : '';
    const label = s || v ? `Jar: ${s ? s.name : 'no sample'}, ${v ? v.name : 'no solvent'}` : 'Empty jar';
    const skip = this._phase === 'run'
      ? '<button type="button" class="cl-skip" data-sflow-action="skip" aria-label="Skip to the end of the run"></button>' : '';
    host.innerHTML = '<span class="cl-rod" aria-hidden="true"></span>'
      + `<span class="cl-glass" role="img" aria-label="${esc(label)}">${pool}${stripHtml({ s, v, phase: this._phase, ok })}`
      + '<span class="cl-glass__shine"></span></span>' + skip;
  }

  _paintRun() {
    const host = this._host('run');
    if (!host) return;
    const ready = !!(this._s && this._v);
    const s = this._s ? sample(this._s) : null;
    const v = this._v ? solvent(this._v) : null;
    const result = this._phase === 'done' && s && v ? (carried(s, v) ? 'bands' : 'spot') : null;
    const chip = (key, label) => {
      const mine = this._expect === key;
      const cls = result && mine ? (result === key ? ' is-yes' : ' is-no') : mine ? ' is-mine' : '';
      const mark = result && mine ? `<span class="cl-mark" aria-hidden="true">${result === key ? MARK.yes : MARK.no}</span>` : '';
      const dis = !ready || this._phase === 'run' ? ' disabled' : '';
      return `<button type="button" class="cl-go${cls}" data-sflow-action="run" data-sflow-value="${key}"${dis}>`
        + `<span class="cl-go__ico cl-go__ico--${key}" aria-hidden="true"></span>${esc(label)}${mark}</button>`;
    };
    const k = this._phase === 'run' ? 'Running... tap the jar to skip'
      : this._phase === 'done' ? 'Run it again. You expect' : 'Run it. You expect';
    host.innerHTML = `<span class="cl-k" aria-live="polite">${esc(k)}</span>`
      + `<div class="cl-gos">${chip('bands', 'Separate colours')}${chip('spot', 'One spot stays')}</div>`;
  }

  _paintLine() {
    const host = this._host('line');
    if (!host) return;
    const pegs = this._line.map((r) => {
      const s = sample(r.s);
      const v = solvent(r.v);
      const fresh = r.fresh ? ' is-new' : '';
      r.fresh = false;
      return `<figure class="cl-peg${fresh}" aria-label="${esc(`${s.name} in ${v.name}: ${r.ok ? `${s.bands.length} colours` : 'the spot stayed on the line'}`)}">`
        + '<span class="cl-peg__clip" aria-hidden="true"></span>'
        + stripHtml({ s, v, phase: 'done', ok: r.ok, mini: true })
        + `<figcaption class="cl-peg__cap"><span class="cl-peg__dot" style="--c:var(${s.swatch})"></span>`
        + `<span>${esc(v.short)}</span></figcaption></figure>`;
    }).join('');
    host.innerHTML = '<span class="cl-k">Drying line</span><div class="cl-string">'
      + (pegs || '<span class="cl-empty">finished strips hang here</span>') + '</div>';
  }

  destroy() {
    if (this._runTimer) clearTimeout(this._runTimer);
    this._runTimer = 0;
    super.destroy();
  }
}

const CSS = `
${SIM_LOOK_DOM_CSS}
.cl-root { padding: var(--sim-space-3); gap: var(--sim-space-2);
  background:
    radial-gradient(120% 70% at 20% 0%, color-mix(in oklab, var(--sim-glass) 12%, transparent), transparent 60%),
    var(--sim-bg-deep); }
.cl-root button { font: inherit; color: inherit; }
.cl-k { font-weight: 800; font-size: var(--sim-text-sm); letter-spacing: 0.04em; color: var(--sim-label-muted); }

/* ---- samples: five spots to choose from ---- */
.cl-samples { display: flex; flex-direction: column; gap: var(--sim-space-1); }
.cl-chips { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--sim-space-2); }
.sim-dom-root--portrait .cl-chips { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.cl-chip { display: flex; align-items: center; gap: var(--sim-space-2); min-height: 52px; padding: var(--sim-space-1) var(--sim-space-2);
  border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-md); background: var(--sim-bg-surface); cursor: pointer; text-align: left;
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); transition: transform 0.1s ease, box-shadow 0.1s ease; }
.cl-chip:active { transform: translateY(3px); box-shadow: none; }
.cl-chip:focus-visible, .cl-bottle:focus-visible, .cl-go:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.cl-chip.is-on { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 16%, var(--sim-bg-surface));
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-accent) 60%, var(--sim-stroke)); }
.cl-chip__dot { flex: none; width: 20px; height: 20px; border-radius: 50%; background: var(--c);
  box-shadow: inset -3px -3px 0 color-mix(in oklab, var(--c) 60%, var(--sim-stroke)); }
.cl-chip__name { font-weight: 700; font-size: var(--sim-text-sm); line-height: 1.2; color: var(--sim-label); min-width: 0; overflow-wrap: anywhere; }

/* ---- the bench: jar on the left, the bottle shelf and the run chips on the right ---- */
.cl-bench { position: relative; display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: var(--sim-space-4); align-items: end;
  padding: var(--sim-space-2) var(--sim-space-3) 0; }
.cl-bench::after { content: ''; position: absolute; inset: auto 0 -10px; height: 18px; border-radius: 6px; z-index: 0;
  background: linear-gradient(to bottom, color-mix(in oklab, var(--sim-surface-raised) 80%, var(--sim-label) 10%), var(--sim-bg-cell));
  border-top: 2px solid var(--sim-stroke); }
.sim-dom-root--portrait .cl-bench { grid-template-columns: 128px minmax(0, 1fr); gap: var(--sim-space-2); padding: var(--sim-space-1) 0 0; align-items: start; }
.sim-dom-root--portrait .cl-glass { width: 118px; height: 236px; }
.sim-dom-root--portrait .cl-rod { width: 118px; }
.sim-dom-root--portrait .cl-shadow { width: 130px; }
.sim-dom-root--portrait .cl-strip { width: 40px; }
.sim-dom-root--portrait .cl-gos { flex-direction: column; align-items: stretch; }
.sim-dom-root--portrait .cl-go { justify-content: center; padding: var(--sim-space-2) var(--sim-space-3); }
.sim-dom-root--portrait .cl-go { min-height: 48px; }
.sim-dom-root--portrait .cl-string { gap: var(--sim-space-2); padding: 0 var(--sim-space-1); }
.sim-dom-root--portrait .cl-peg { width: 52px; }
.sim-dom-root--portrait .cl-peg__cap { flex-wrap: wrap; justify-content: center; white-space: normal; text-align: center; line-height: 1.15; }
.sim-dom-root--portrait .cl-bench::after { display: none; }
.cl-jarcol { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
.cl-shadow { width: 170px; height: 14px; margin-top: -8px;
  background: radial-gradient(closest-side, color-mix(in oklab, var(--sim-stroke) 70%, transparent), transparent); }
.cl-jar { position: relative; display: flex; flex-direction: column; align-items: center; }
.cl-rod { display: block; width: 150px; height: 8px; border-radius: 4px; margin-bottom: -4px; z-index: 2;
  background: linear-gradient(to bottom, var(--sim-label-muted), color-mix(in oklab, var(--sim-label-muted) 50%, var(--sim-stroke))); }
.cl-glass { position: relative; display: block; width: 150px; height: 270px; overflow: hidden;
  border: 3px solid color-mix(in oklab, var(--sim-glass) 55%, var(--sim-stroke)); border-top-width: 2px; border-radius: 10px 10px 22px 22px;
  background: linear-gradient(90deg, color-mix(in oklab, var(--sim-glass) 22%, transparent), color-mix(in oklab, var(--sim-glass) 6%, transparent) 40%,
    color-mix(in oklab, var(--sim-glass) 20%, transparent)); }
.cl-glass__shine { position: absolute; inset: 14px auto 26px 9px; width: 9px; border-radius: 5px; pointer-events: none;
  background: linear-gradient(to bottom, color-mix(in oklab, var(--sim-label) 40%, transparent), color-mix(in oklab, var(--sim-label) 6%, transparent)); }
.cl-pool { position: absolute; inset: auto 0 0; height: 15%;
  background: linear-gradient(to bottom, color-mix(in oklab, var(--v) 55%, transparent), color-mix(in oklab, var(--v) 35%, transparent));
  border-top: 3px solid color-mix(in oklab, var(--v) 70%, var(--sim-label) 10%); }
.cl-skip { position: absolute; inset: 0; border: 0; background: transparent; cursor: pointer; z-index: 3; }

/* the paper strip hanging from the rod, its foot in the pool; heights are % of the strip */
.cl-strip { position: absolute; inset: 0 auto 4% 50%; width: 48px; transform: translateX(-50%); overflow: hidden;
  background: var(--cl-paper); border: 2px solid color-mix(in oklab, var(--cl-paper) 70%, var(--sim-stroke));
  border-top: 0; border-radius: 0 0 3px 3px; }
.cl-wet { position: absolute; inset: auto 0 0; height: 11%; background: color-mix(in oklab, var(--v) 34%, transparent);
  transition: height ${RUN_MS}ms cubic-bezier(0.45, 0.15, 0.55, 1); }
.cl-front { position: absolute; inset: auto 0 11%; height: 0; border-top: 3px solid color-mix(in oklab, var(--v) 75%, var(--sim-label));
  opacity: 0; transition: bottom ${RUN_MS}ms cubic-bezier(0.45, 0.15, 0.55, 1), opacity 0.3s ease; }
.cl-pencil { position: absolute; inset: auto 3px 20%; height: 0; border-top: 2px solid color-mix(in oklab, var(--cl-ink) 65%, var(--cl-paper)); }
.cl-spot { position: absolute; inset: auto auto calc(20% - 7px) 50%; width: 16px; height: 14px; border-radius: 50%; transform: translateX(-50%);
  background: var(--c); box-shadow: 0 0 0 2px color-mix(in oklab, var(--c) 50%, transparent);
  transition: width ${RUN_MS}ms ease, height ${RUN_MS}ms ease, bottom ${RUN_MS}ms ease, filter ${RUN_MS}ms ease, opacity 0.5s ease; }
.cl-band { position: absolute; inset: auto 4px calc(20% - 5px); height: 10px; border-radius: 50%; opacity: 0;
  background: var(--c); box-shadow: 0 0 4px 1px color-mix(in oklab, var(--c) 50%, transparent);
  transition: bottom ${RUN_MS}ms cubic-bezier(0.45, 0.15, 0.55, 1), opacity 0.5s ease; }
.cl-strip.is-run .cl-wet { height: 92%; }
.cl-strip.is-run .cl-front { bottom: 92%; opacity: 1; }
.cl-strip.is-run .cl-band { opacity: 1; bottom: calc(20% - 5px + var(--rf) * 70%); }
.cl-strip.is-run .cl-spot--fade { opacity: 0; }
/* water passes the green by: the wet edge climbs, and the spot stays where it was put */
.cl-strip.is-run .cl-spot--stuck { width: 30px; height: 22px; bottom: calc(20% - 11px); filter: saturate(1.2); }
.cl-strip.is-done *, .cl-strip.is-done { transition: none; }

/* ---- the shelf of four bottles ---- */
.cl-side { position: relative; z-index: 1; display: flex; flex-direction: column; gap: var(--sim-space-3); min-width: 0; padding-bottom: var(--sim-space-3); }
.sim-dom-root--portrait .cl-side { gap: var(--sim-space-2); padding-bottom: 0; }
.cl-shelf { position: relative; display: flex; flex-direction: column; gap: var(--sim-space-1); }
.cl-bottles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--sim-space-2); align-items: start; }
.sim-dom-root--portrait .cl-bottles { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: var(--sim-space-2); gap: var(--sim-space-1); }
.sim-dom-root--portrait .cl-bottle__glass { width: 44px; height: 54px; }
.cl-bottle { display: flex; flex-direction: column; align-items: center; gap: 0; padding: var(--sim-space-1) 2px var(--sim-space-2); min-width: 0;
  border: 2px solid transparent; border-radius: var(--sim-radius-md); background: transparent; cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease, border-color 0.15s ease; }
.cl-bottle:hover { background: color-mix(in oklab, var(--sim-bg-surface) 70%, transparent); }
.cl-bottle.is-on { transform: translateY(-6px); border-color: var(--v); background: color-mix(in oklab, var(--v) 14%, var(--sim-bg-surface)); }
.cl-bottle__cap { width: 22px; height: 12px; border-radius: 4px 4px 1px 1px; border: 2px solid var(--sim-stroke);
  background: linear-gradient(to right, color-mix(in oklab, var(--v) 75%, var(--sim-stroke)), color-mix(in oklab, var(--v) 45%, var(--sim-stroke))); }
.cl-bottle__glass { position: relative; display: block; width: 52px; height: 70px; overflow: hidden; border-radius: 12px 12px 10px 10px;
  border: 2px solid color-mix(in oklab, var(--sim-glass) 55%, var(--sim-stroke));
  background: color-mix(in oklab, var(--sim-glass) 12%, var(--sim-bg-surface));
  box-shadow: 0 5px 0 -1px color-mix(in oklab, var(--v) 35%, var(--sim-stroke)); }
.cl-bottle__liq { position: absolute; inset: auto 0 0; height: 70%;
  background: linear-gradient(to right, color-mix(in oklab, var(--v) 70%, var(--sim-bg-surface)), color-mix(in oklab, var(--v) 45%, var(--sim-bg-surface)));
  border-top: 3px solid color-mix(in oklab, var(--v) 85%, var(--sim-label) 15%); }
.cl-bottle__shine { position: absolute; inset: 8px auto 8px 6px; width: 6px; border-radius: 3px;
  background: linear-gradient(to bottom, color-mix(in oklab, var(--sim-label) 45%, transparent), transparent); }
.cl-bottle__name { margin-top: var(--sim-space-1); font-weight: 800; font-size: var(--sim-text-sm); line-height: 1.2; text-align: center; color: var(--sim-label); overflow-wrap: anywhere; }

/* ---- predict, which is also the run button ---- */
.cl-run { display: flex; flex-direction: column; gap: var(--sim-space-1); }
.cl-gos { display: flex; flex-wrap: wrap; gap: var(--sim-space-2); }
.cl-go { display: inline-flex; align-items: center; gap: var(--sim-space-2); min-height: 46px; padding: var(--sim-space-2) var(--sim-space-4);
  border: 2px solid var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke)));
  border-radius: var(--sim-radius-md); background: var(--primary-color, var(--sim-accent)); color: var(--on-primary, var(--sim-bg-deep));
  font-weight: 800; font-size: var(--sim-text-md); cursor: pointer;
  box-shadow: 0 4px 0 var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke))); transition: transform 0.1s ease, box-shadow 0.1s ease; }
.cl-root .cl-go { color: var(--on-primary, var(--sim-bg-deep)); }
.cl-go:active { transform: translateY(4px); box-shadow: none; }
.cl-go:disabled { opacity: 0.4; cursor: default; transform: none; box-shadow: none; }
.cl-go.is-mine:disabled { opacity: 0.85; }
.cl-root .cl-go.is-yes, .cl-root .cl-go.is-no { color: var(--sim-label); }
.cl-go.is-yes { background: color-mix(in oklab, var(--sim-good) 24%, var(--sim-bg-surface)); border-color: var(--sim-good); box-shadow: 0 4px 0 color-mix(in oklab, var(--sim-good) 60%, var(--sim-stroke)); }
.cl-go.is-no { background: color-mix(in oklab, var(--sim-warning) 20%, var(--sim-bg-surface)); border-color: var(--sim-warning); box-shadow: 0 4px 0 color-mix(in oklab, var(--sim-warning) 60%, var(--sim-stroke)); }
.cl-go__ico { position: relative; flex: none; width: 14px; height: 22px; border-radius: 2px; background: color-mix(in oklab, currentColor 25%, transparent); }
.cl-go__ico--bands { background:
  linear-gradient(to top, transparent 15%, currentColor 15% 27%, transparent 27% 45%, currentColor 45% 57%, transparent 57% 75%, currentColor 75% 87%, transparent 87%),
  color-mix(in oklab, currentColor 20%, transparent); }
.cl-go__ico--spot::after { content: ''; position: absolute; inset: auto 2px 3px; height: 9px; border-radius: 50%; background: currentColor; }
.cl-mark { font-weight: 900; }

/* ---- the drying line: every finished strip, pegged, to compare ---- */
.cl-line { display: flex; flex-direction: column; gap: var(--sim-space-1); margin-top: var(--sim-space-3); }
.cl-string { position: relative; display: flex; gap: var(--sim-space-3); align-items: flex-start; min-height: 128px; padding: 0 var(--sim-space-3);
  border-top: 2px solid var(--sim-label-muted); flex-wrap: wrap; }
.cl-peg { margin: 0; display: flex; flex-direction: column; align-items: center; width: 64px; transform-origin: 50% 0; }
.cl-peg.is-new { animation: cl-hang 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.cl-peg__clip { width: 10px; height: 14px; margin-top: -8px; border-radius: 3px; background: var(--sim-surface-raised); border: 2px solid var(--sim-stroke); z-index: 1; }
.cl-strip--mini { position: relative; inset: auto; transform: none; display: block; width: 26px; height: 80px; margin-top: -4px; border-top: 2px solid color-mix(in oklab, var(--cl-paper) 70%, var(--sim-stroke)); }
.cl-strip--mini .cl-band { inset-inline: 2px; height: 6px; bottom: calc(20% - 3px + var(--rf) * 70%); }
.cl-strip--mini .cl-spot { width: 10px; height: 8px; bottom: calc(20% - 4px); }
.cl-strip--mini .cl-spot--stuck { width: 18px; height: 13px; bottom: calc(20% - 6px); }
.cl-peg__cap { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-weight: 700; font-size: var(--sim-text-sm); color: var(--sim-label); white-space: nowrap; }
.cl-peg__dot { flex: none; width: 12px; height: 12px; border-radius: 50%; background: var(--c); }
.cl-empty { margin-top: var(--sim-space-3); font-weight: 700; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }

@keyframes cl-hang { 0% { transform: rotate(-14deg) translateY(-10px); opacity: 0; } 60% { transform: rotate(5deg); opacity: 1; } 100% { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .cl-strip *, .cl-bottle, .cl-chip, .cl-go { transition: none; }
  .cl-peg.is-new { animation: none; }
}
`;
