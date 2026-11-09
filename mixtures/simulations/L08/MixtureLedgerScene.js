/**
 * MixtureLedgerScene - blk-l08-s04, the book's Table 5.1 filled in by testing.
 *
 * Three beakers stand side by side - A salt solution, B chalk in water, C milk - over the
 * book's six-row table. The learner picks one of six probes, first says what the MILK will
 * do (C is the column that looks like one thing and behaves like another), then runs the
 * probe on all three beakers at once: a filter funnel drips, a day passes, a laser crosses,
 * a lens zooms in. The probe's row of the table then fills from what the beakers showed.
 * A wrong guess about the milk names the slip (white is not big; looking smooth is not
 * homogeneous; small particles still scatter light).
 *
 *   beat 0  the empty table; any probe can be run
 *   beat 1  row by row: the Nature probe is picked
 *   beat 2  the filter probe is picked; rows the learner has not run yet for nature, size
 *           and visibility are filled in for them (marked "given")
 *   beat 3  every row filled; the particle-size row is lit and a ladder arrow runs across
 *
 * No frame loop: one-shot CSS only.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, noteLineHtml, burst } from 'simulations/base/kit/SimLookDom.js';
import { bindFlow } from 'simulations/base/kit/SimFlowDom.js';

/* ------------------------------------------------------------------ data */

const SAMPLES = [
  { id: 'A', name: 'salt solution', col: 'Solution' },
  { id: 'B', name: 'chalk in water', col: 'Suspension' },
  { id: 'C', name: 'packet milk', col: 'Colloid' },   // homogenised: fresh dairy milk would cream in hours
];

/**
 * The six rows in the slide's order. `obs`: what each beaker shows; `guess`: the choices for the
 * milk, with the right one first in `milk`; `slip`: the line a wrong milk guess earns.
 */
const ROWS = [
  { id: 'nature', label: 'Nature', probe: 'Zoom in', obs: { A: 'homo\u00adgeneous', B: 'hetero\u00adgeneous', C: 'hetero\u00adgeneous' },
    ask: 'Milk looks the same all through. Up close it is', guess: [['heterogeneous', 'not uniform'], ['homogeneous', 'uniform']],
    slip: 'Looking uniform is not the same as being uniform: drops of fat float in the water' },
  { id: 'size', label: 'Particle size', probe: 'Measure', obs: { A: 'under 1 nm', B: 'over 1000 nm', C: '1 to 1000 nm' },
    ask: 'Milk particles are', guess: [['mid', 'between the two'], ['big', 'as big as chalk'], ['small', 'as small as salt']],
    slip: 'White does not mean big: the drops are far smaller than chalk grains' },
  { id: 'vis', label: 'Visibility', probe: 'Look', obs: { A: 'cannot be seen', B: 'seen by eye', C: 'not seen by eye' },
    ask: 'With your eyes, milk particles', guess: [['no', 'cannot be seen'], ['eye', 'can be seen']],
    slip: 'You see the whiteness, not the drops: they are too small for your eyes' },
  { id: 'fil', label: 'Filtration', probe: 'Filter', obs: { A: 'passes through', B: 'caught on paper', C: 'passes through' },
    ask: 'Through filter paper, milk', guess: [['pass', 'passes through'], ['caught', 'is caught']],
    slip: 'The drops are smaller than the gaps in the paper, so the milk comes through white' },
  { id: 'set', label: 'Settling', probe: 'Wait a day', obs: { A: 'does not settle', B: 'settles', C: 'does not settle' },
    ask: 'Left for a day, packet milk', guess: [['no', 'stays mixed'], ['yes', 'settles']],
    slip: 'Chalk grains sink, but the drops in packet milk are too small to rise or sink' },
  { id: 'tyn', label: 'Tyndall effect', probe: 'Shine a beam', obs: { A: 'no beam seen', B: 'beam seen', C: 'beam seen' },
    ask: 'A laser through milk', guess: [['seen', 'shows its path'], ['not', 'cannot be seen']],
    slip: 'Small drops still scatter light, and there are very many of them' },
];
const GIVEN = [[], [], ['nature', 'size', 'vis'], ROWS.map((r) => r.id)];
const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const BEAT_PROBE = ['nature', 'nature', 'fil', 'size'];
const MARK = { yes: '\u2713', no: '\u2717' };
const NOTE = 'A real colloid has particles of many sizes.';

/* -------------------------------------------------------------- drawings */

const GR = [[0.12, 0.2], [0.3, 0.55], [0.5, 0.3], [0.7, 0.62], [0.85, 0.25], [0.2, 0.8], [0.45, 0.75], [0.62, 0.12], [0.78, 0.85], [0.38, 0.4], [0.9, 0.55], [0.06, 0.5]];

/** One beaker under the current probe. `run`: the probe has been run here; `fresh`: play its move. */
function beakerSvg(s, probe, run, fresh) {
  const f = fresh ? ' is-fresh' : '';
  const liquid = s.id === 'C' ? 'color-mix(in oklab, var(--sim-ice) 80%, var(--sim-bg-surface))' : 'color-mix(in oklab, var(--sim-water) 40%, transparent)';
  let body = '';
  let over = '';
  const settled = probe === 'set' && run && s.id === 'B';
  const filtered = probe === 'fil' && run;
  // the liquid, and chalk grains in B
  const top = filtered ? 96 : 40;
  body += `<path d="M24 ${top} V124 a8 8 0 0 0 8 8 H88 a8 8 0 0 0 8 -8 V${top} Z" fill="${liquid}"/>`;
  if (s.id === 'B' && !filtered) {
    body += `<g class="${settled ? `ml-sink${f}` : ''}">${GR.map(([u, v], i) =>
      `<circle style="--i:${i}" cx="${(30 + u * 60).toFixed(1)}" cy="${settled ? (124 + (i % 3) * 3).toFixed(1) : (46 + v * 76).toFixed(1)}" r="4" fill="var(--sim-ice)" stroke="var(--sim-stroke)" stroke-width="1.5"/>`).join('')}</g>`;
  }
  if (filtered) {
    // the funnel over the beaker, with what stayed on the paper, and the filtrate below
    over += '<path d="M14 6 h92 l-38 40 v16 h-16 v-16 Z" fill="color-mix(in oklab, var(--sim-label) 10%, var(--sim-bg-surface))" stroke="var(--sim-stroke)" stroke-width="2.5" stroke-linejoin="round"/>';
    if (s.id === 'B') over += GR.slice(0, 9).map(([u], i) => `<circle cx="${(36 + u * 48).toFixed(1)}" cy="${(16 + (i % 3) * 7).toFixed(1)}" r="4" fill="var(--sim-ice)" stroke="var(--sim-stroke)" stroke-width="1.5"/>`).join('');
    body = `<path class="ml-fill${f}" d="M24 96 V124 a8 8 0 0 0 8 8 H88 a8 8 0 0 0 8 -8 V96 Z" fill="${liquid}"/>`;
  }
  if (probe === 'tyn' && run) {
    const seen = s.id !== 'A';
    over += `<path d="M0 84 H22" stroke="var(--sim-error)" stroke-width="4" stroke-linecap="round"/>`;
    if (seen) over += `<path class="ml-beam${f}" d="M24 84 H96" stroke="var(--sim-error)" stroke-width="5" stroke-linecap="round" opacity="0.9"/>`
      + `<path class="ml-beam${f}" d="M24 84 H96" stroke="var(--sim-error)" stroke-width="12" stroke-linecap="round" opacity="0.25"/>`;
    over += `<path d="M98 84 H118" stroke="var(--sim-error)" stroke-width="4" stroke-linecap="round"/>`;
  }
  if (probe === 'set' && run) over += `<g class="ml-clock${f}"><circle cx="100" cy="20" r="13" fill="var(--sim-bg-surface)" stroke="var(--sim-stroke)" stroke-width="2"/><path d="M100 12 V20 l6 4" stroke="var(--sim-label)" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;
  const glass = `<path d="M18 ${filtered ? 60 : 24} h6 V124 a8 8 0 0 0 8 8 H88 a8 8 0 0 0 8 -8 V${filtered ? 60 : 24} h6" fill="none" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>`
    + `<path d="M30 ${filtered ? 100 : 46} v70" stroke="color-mix(in oklab, var(--sim-label) 25%, transparent)" stroke-width="4" stroke-linecap="round"/>`;
  return `<svg class="ml-beaker" viewBox="0 0 120 144" aria-hidden="true">`
    + '<ellipse cx="60" cy="139" rx="44" ry="4" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>'
    + `${body}${glass}${over}</svg>`;
}

/** A round zoom window: what the lens shows for nature / size / visibility. */
function zoomSvg(s, probe, fresh) {
  const f = fresh ? ' is-fresh' : '';
  let dots = '';
  if (s.id === 'A') {
    dots = [[30, 30], [50, 24], [70, 34], [24, 52], [44, 48], [64, 54], [80, 50], [34, 70], [56, 72], [74, 70]]
      .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 3 : 2}" fill="${i % 3 === 0 ? 'var(--sim-salt)' : 'color-mix(in oklab, var(--sim-water) 70%, var(--sim-bg-surface))'}"/>`).join('');
  } else if (s.id === 'B') {
    dots = '<circle cx="50" cy="50" r="30" fill="var(--sim-ice)" stroke="var(--sim-stroke)" stroke-width="3"/>';
  } else {
    dots = [[30, 34, 9], [62, 28, 7], [48, 58, 10], [74, 60, 8], [28, 68, 6]]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="color-mix(in oklab, var(--sim-ice) 85%, var(--sim-bg-surface))" stroke="var(--sim-stroke)" stroke-width="1.5"/>`).join('');
  }
  const cap = probe === 'vis' ? { A: 'nothing to see', B: 'by eye', C: 'not by eye' }[s.id]
    : probe === 'size' ? { A: '< 1 nm', B: '> 1000 nm', C: '1-1000 nm' }[s.id]
      : { A: 'uniform', B: 'not uniform', C: 'not uniform' }[s.id];
  return `<span class="ml-zoom${f}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" class="ml-zoom__bg"/>${dots}`
    + '<circle cx="50" cy="50" r="46" fill="none" stroke="var(--sim-stroke)" stroke-width="4"/></svg>'
    + `<span class="sflow-sr">${esc(cap)}</span></span>`;
}

/* ------------------------------------------------------------- the scene */

export class MixtureLedgerScene extends DomSimulation {
  static WIDTH = 680;
  static HEIGHT = 624;   // sim-layout --interact: 612px (ladder beat with a slip line)
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 900;
  static BEAT_STEP_MAP = MAP;
  static ARIA_LABEL =
    'Three beakers, A salt solution, B chalk in water and C milk, over a six-row table of solution, suspension and colloid. '
    + 'Pick a test, say first what the milk will do, then run it on all three beakers. The row fills from what they show.';
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this._probe = 'nature';
    this._ran = {};        // row id -> 'run' (learner) | 'given'
    this._guess = {};      // row id -> guess key
    this._fresh = null;
    this._ladder = false;
    this._celebrated = false;
  }

  async setup() {
    await super.setup();
    this.render({ css: CSS, rootClass: 'ml-root', html: '<div class="ml-wrap" data-wrap></div>' });
    bindFlow(this.root, { action: (name, value) => this._act(name, value) });
    this._paint();
  }

  onStep(step) {
    for (const id of GIVEN[step] || []) if (!this._ran[id]) this._ran[id] = 'given';
    this._ladder = step === 3;
    this._probe = BEAT_PROBE[step] ?? 'nature';
    this._paint();
  }

  _act(name, value) {
    if (name === 'probe') {
      if (!ROWS.some((r) => r.id === value)) return;
      this._probe = value;
      return this._paint();
    }
    const r = ROWS.find((x) => x.id === this._probe);
    if (name === 'guess') {
      if (this._ran[r.id] || this._guess[r.id] || !r.guess.some((g) => g[0] === value)) return;
      this._guess[r.id] = value;
      return this._paint();
    }
    if (name === 'run') {
      if (this._ran[r.id] || !this._guess[r.id]) return;
      this._ran[r.id] = 'run';
      this._fresh = r.id;
      this._paint();
      if (!this._celebrated && ROWS.every((x) => this._ran[x.id] === 'run')) {
        this._celebrated = true;
        burst(this.root.querySelector?.('.ml-table'));
      }
    }
    return undefined;
  }

  _paint() {
    const host = this.root?.querySelector?.('[data-wrap]');
    if (!host) return;
    host.innerHTML = this._html();
    this._fresh = null;
  }

  _html() {
    const r = ROWS.find((x) => x.id === this._probe);
    const ran = !!this._ran[r.id];
    const fresh = this._fresh === r.id;
    const zoom = ['nature', 'size', 'vis'].includes(r.id);
    const beakers = SAMPLES.map((s) => `<figure class="ml-sample${ran ? ' is-ran' : ''}${s.id === 'C' ? ' is-milk' : ''}">`
      + `<span class="ml-badge">${s.id}</span>`
      + (zoom && ran ? zoomSvg(s, r.id, fresh) : beakerSvg(s, r.id, ran, fresh))
      + `<figcaption>${esc(s.name)}</figcaption>`
      + (ran ? `<span class="ml-obs${fresh ? ' is-new' : ''}" style="--k:${SAMPLES.indexOf(s)}">${esc(r.obs[s.id])}</span>` : '')
      + '</figure>').join('');

    const probes = ROWS.map((x) => `<button type="button" class="ml-probe${x.id === r.id ? ' is-on' : ''}${this._ran[x.id] ? ' is-done' : ''}"`
      + ` data-sflow-action="probe" data-sflow-value="${x.id}" aria-pressed="${x.id === r.id}">`
      + `${this._ran[x.id] ? `<span class="ml-tick" aria-hidden="true">${MARK.yes}</span>` : ''}${esc(x.probe)}</button>`).join('');

    // predict for the milk, then run
    const g = this._guess[r.id];
    const right = r.guess[0][0];
    let ask;
    if (this._ran[r.id] === 'given') {
      ask = `<span class="ml-k">Filled in for you. ${esc(r.ask)} <b>${esc(r.guess[0][1])}</b>.</span>`;
    } else {
      const chips = r.guess.map(([k, l]) => {
        const mine = g === k;
        const cls = ran && mine ? (k === right ? ' is-yes' : ' is-no') : mine ? ' is-on' : '';
        const mark = ran && mine ? ` <span aria-hidden="true">${k === right ? MARK.yes : MARK.no}</span>` : '';
        return `<button type="button" class="ml-chip${cls}" data-sflow-action="guess" data-sflow-value="${k}"${g ? ' disabled' : ''}>${esc(l)}${mark}</button>`;
      }).join('');
      const go = ran ? '' : `<button type="button" class="ml-go" data-sflow-action="run"${g ? '' : ' disabled'}>${esc(r.probe)}: all three</button>`;
      const slip = ran && g !== right ? `<span class="ml-tag">${esc(r.slip)}</span>` : '';
      ask = `<span class="ml-k">${esc(r.ask)}</span><span class="ml-chips">${chips}</span>${go}${slip}`;
    }

    const body = ROWS.map((x) => {
      const st = this._ran[x.id];
      const lit = this._ladder && x.id === 'size';
      return `<tr class="${x.id === r.id ? 'is-cur' : ''}${lit ? ' is-lit' : ''}"><th scope="row">${esc(x.label)}</th>${SAMPLES.map((s, i) =>
        `<td class="ml-c${st ? ` is-${st}` : ''}${st && this._fresh === x.id ? ' is-new' : ''}" style="--k:${i}">${st ? esc(x.obs[s.id]) : ''}</td>`).join('')}</tr>`;
    }).join('');
    const ladder = this._ladder ? '<span class="ml-ladder" aria-hidden="true"><span>particle size grows</span></span>' : '';
    const table = `<div class="ml-tablebox">${ladder}<table class="ml-table"><thead><tr><th></th>${SAMPLES.map((s) =>
      `<th scope="col">${esc(s.id)}: ${esc(s.col)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;

    return `<div class="ml-bench">${beakers}</div><div class="ml-probes">${probes}</div>`
      + `<div class="ml-ask" aria-live="polite">${ask}</div>${table}${noteLineHtml([{ text: NOTE }])}`;
  }
}

const CSS = SIM_LOOK_DOM_CSS + `
.ml-root { padding: var(--sim-space-3);
  background: radial-gradient(110% 60% at 50% 0%, color-mix(in oklab, var(--sim-water) 10%, transparent), transparent 60%), var(--sim-bg-deep); }
.ml-root button { font-family: inherit; }
.ml-wrap { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.ml-k { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); text-align: center; }
.ml-k b { color: var(--sim-label); }
.ml-bench { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sim-space-2); padding: var(--sim-space-2) var(--sim-space-2) 0;
  border-radius: var(--sim-radius-md); background: var(--sim-bg-cell); border-bottom: 6px solid color-mix(in oklab, var(--sim-strata-2) 55%, var(--sim-stroke)); }
.ml-sample { position: relative; margin: 0; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; padding-bottom: var(--sim-space-1); }
.ml-badge { position: absolute; inset: 0 auto auto 4px; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%;
  background: var(--sim-bg-surface); border: 2px solid var(--sim-stroke); font-weight: 900; font-size: var(--sim-text-sm); color: var(--sim-label); z-index: 1; }
.ml-sample.is-milk .ml-badge { border-color: var(--sim-warning); }
.ml-beaker { display: block; width: 100%; max-width: 104px; height: auto; }
.ml-sample figcaption { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label); text-align: center; }
.ml-obs { padding: 1px var(--sim-space-2); border-radius: var(--sim-radius-pill); border: 2px solid var(--sim-stroke); background: var(--sim-bg-surface);
  font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label); text-align: center; }
.ml-obs.is-new { animation: ml-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; animation-delay: calc(0.5s + var(--k) * 0.12s); }
.ml-zoom { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 100%; max-width: 128px; padding-top: 6px; }
.ml-zoom svg { display: block; width: 84px; height: 84px; }
.ml-zoom.is-fresh svg { animation: ml-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.ml-zoom__bg { fill: color-mix(in oklab, var(--sim-water) 22%, var(--sim-bg-surface)); }
.ml-zoom__cap { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }

.ml-probes { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: var(--sim-space-1); }
.sim-dom-root--portrait .ml-probes { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.sim-dom-root--portrait .ml-probe, .sim-dom-root--portrait .ml-chip, .sim-dom-root--portrait .ml-go { min-height: 48px; }
.ml-probe { display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 42px; padding: 2px 4px; border: 2px solid var(--sim-stroke);
  border-radius: var(--sim-radius-md); background: var(--sim-bg-surface); color: var(--sim-label); font-weight: 800; font-size: var(--sim-text-sm); line-height: 1.15;
  cursor: pointer; box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); }
.ml-probe.is-on { border-color: var(--primary-color, var(--sim-accent)); background: color-mix(in oklab, var(--primary-color, var(--sim-accent)) 18%, var(--sim-bg-surface)); }
.ml-tick { color: var(--sim-good); font-weight: 900; }
.ml-ask { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--sim-space-1) var(--sim-space-2); min-height: 48px; }
.ml-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--sim-space-1); }
.ml-chip { display: inline-flex; align-items: center; gap: 5px; min-height: 36px; padding: 2px var(--sim-space-3); border: 2px solid var(--sim-stroke);
  border-radius: var(--sim-radius-pill); background: var(--sim-bg-surface); color: var(--sim-label); font-weight: 800; font-size: var(--sim-text-sm); cursor: pointer;
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); }
.ml-chip:disabled { opacity: 0.4; cursor: default; }
.ml-chip.is-on { opacity: 1; border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); }
.ml-chip.is-yes { opacity: 1; border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); }
.ml-chip.is-no { opacity: 1; border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 16%, var(--sim-bg-surface)); }
.ml-probe:focus-visible, .ml-chip:focus-visible, .ml-go:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.ml-go { min-height: 40px; padding: 2px var(--sim-space-3); border: 2px solid var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke)));
  border-radius: var(--sim-radius-md); background: var(--primary-color, var(--sim-accent)); font-weight: 800; font-size: var(--sim-text-sm); cursor: pointer;
  box-shadow: 0 4px 0 var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke))); }
.ml-root .ml-go { color: var(--on-primary, var(--sim-bg-deep)); }
.ml-go:active { transform: translateY(4px); box-shadow: none; }
.ml-go:disabled { opacity: 0.4; cursor: default; transform: none; box-shadow: none; }
.ml-tag { flex-basis: 100%; padding: 3px var(--sim-space-3); border-radius: var(--sim-radius-md); border: 2px solid var(--sim-warning);
  background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface)); font-weight: 700; font-size: var(--sim-text-sm); line-height: 1.3; color: var(--sim-label); text-align: center;
  animation: ml-pop 0.35s ease 0.4s both; }

.ml-tablebox { display: flex; flex-direction: column; gap: 2px; }
.ml-table { width: 100%; border-collapse: separate; border-spacing: 3px; table-layout: fixed; }
.ml-table th { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); text-align: left; line-height: 1.15; }
.ml-table thead th { text-align: center; }
.ml-table th[scope="row"] { width: 24%; color: var(--sim-label); }
.ml-table tr.is-cur th[scope="row"] { color: var(--primary-color, var(--sim-accent)); }
.ml-c { height: 28px; padding: 1px 4px; border-radius: var(--sim-radius-sm); border: 2px dashed color-mix(in oklab, var(--sim-stroke) 80%, transparent);
  font-weight: 700; font-size: var(--sim-text-sm); line-height: 1.15; color: var(--sim-label); text-align: center; }
.ml-c.is-run { border-style: solid; border-color: color-mix(in oklab, var(--sim-good) 60%, var(--sim-stroke)); background: color-mix(in oklab, var(--sim-good) 10%, var(--sim-bg-surface)); }
.ml-c.is-given { border-style: solid; background: var(--sim-bg-surface); color: var(--sim-label-muted); }
.ml-c.is-new { animation: ml-pop 0.35s ease both; animation-delay: calc(0.6s + var(--k) * 0.12s); }
.ml-table tr.is-lit .ml-c { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 16%, var(--sim-bg-surface)); color: var(--sim-label); }
.ml-ladder { display: flex; align-items: center; gap: var(--sim-space-2); margin-left: 25%; }
.ml-ladder::before, .ml-ladder::after { content: ''; flex: 1 1 auto; border-top: 3px solid var(--sim-warning); }
.ml-ladder::after { border-top-width: 0; height: 0; border-left: 10px solid var(--sim-warning); border-block: 7px solid transparent; flex: 0 0 auto; margin-left: calc(-1 * var(--sim-space-2)); }
.ml-ladder span { padding: 0 var(--sim-space-2); border-radius: var(--sim-radius-pill); border: 2px solid var(--sim-warning);
  background: color-mix(in oklab, var(--sim-warning) 30%, var(--sim-bg-surface)); font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label); animation: ml-pop 0.4s ease both; }
.sim-dom-root--portrait .ml-table th[scope="row"] { width: 28%; }

/* one-shot moves */
.ml-sink.is-fresh circle { animation: ml-sinkdot 0.9s cubic-bezier(0.5, 0, 0.7, 1) both; animation-delay: calc(var(--i) * 35ms); }
.ml-fill.is-fresh { animation: ml-rise 0.8s ease 0.2s both; transform-box: fill-box; transform-origin: 50% 100%; }
.ml-beam.is-fresh { animation: ml-draw 0.5s ease both; stroke-dasharray: 80; }
.ml-clock.is-fresh path { animation: ml-turn 0.8s ease both; transform-box: view-box; transform-origin: 100px 20px; }
@keyframes ml-pop { from { transform: scale(0.6); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes ml-sinkdot { from { transform: translateY(-60px); } to { transform: none; } }
@keyframes ml-rise { from { transform: scaleY(0); } to { transform: none; } }
@keyframes ml-draw { from { stroke-dashoffset: 80; } to { stroke-dashoffset: 0; } }
@keyframes ml-turn { from { transform: rotate(-360deg); } to { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .ml-obs.is-new, .ml-zoom.is-fresh svg, .ml-tag, .ml-c.is-new, .ml-ladder span, .ml-sink.is-fresh circle, .ml-fill.is-fresh, .ml-beam.is-fresh, .ml-clock.is-fresh path { animation: none; }
}
`;
