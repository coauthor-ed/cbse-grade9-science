/**
 * CrystallizeItScene - blk-l03-s09, the mini-game. Layout: shared/GameFrame.js.
 *
 * Three rounds, one at a time. Each gives a hot saturated solution and a mass to make. The learner
 * reads the curve, picks the temperature to cool to (nothing shows the grams until the beaker has
 * cooled, so the pick is a prediction), taps the steps in the order they choose, and weighs the
 * crystals. Three checks: pure, dry, right mass. Each miss names its cause. Round 2's salt curve is
 * nearly flat, so a cool of 70 degrees gives only 1 g.
 *
 * Solubility from the book: Fig. 5.6 for compound B, Table 5.4 for common salt.
 * Weighing is this scene's own button, so GameFrame's Check button stays hidden: the host's check
 * runs by itself once the last round is won (requestCheck).
 */
import { GameBoard, mountGame } from '../shared/GameFrame.js';

const DEG = '\u00b0';
const TICK = '\u2713';
const CROSS = '\u2717';
const COMPOUND_B = [[10, 190], [20, 205], [30, 220], [40, 241], [50, 260], [60, 287], [70, 320], [80, 360]];
const SALT = [[10, 36], [20, 36], [30, 36.3], [40, 36.5], [50, 36.8], [60, 37], [70, 37], [80, 37]];
const solAt = (curve, t) => (curve.find((p) => p[0] === t) || curve[curve.length - 1])[1];

const ROUNDS = [
  { name: 'Compound B', curve: COMPOUND_B, start: 80, sand: false, target: 155, tol: 2, yTicks: [150, 250, 350] },
  { name: 'Common salt', curve: SALT, start: 80, sand: true, target: 1, tol: 0.05, yTicks: [0, 20, 40] },
  { name: 'Compound B', curve: COMPOUND_B, start: 60, sand: true, target: 82, tol: 2, yTicks: [150, 250, 350] },
];
const TEMPS = [10, 20, 30, 40, 50, 60, 70, 80];
const STEPS = [
  { id: 'hot', label: 'Filter hot' },
  { id: 'cool', label: 'Cool' },
  { id: 'catch', label: 'Filter off crystals' },
  { id: 'rinse', label: 'Rinse and dry' },
];
const WET = 1.15;          // solution left on undried crystals: the balance reads 15 % more
const SAND_G = 1.5;
const g1 = (v) => (Math.abs(v) < 10 ? (Math.round(v * 10) / 10).toFixed(1) : String(Math.round(v)));

const PW = 320, PH = 150;
const PAD = { l: 42, r: 10, t: 10, b: 14 };

function curveSvg(r, s) {
  const y0 = r.yTicks[0], y1 = r.yTicks[r.yTicks.length - 1];
  const X = (t) => PAD.l + ((t - 10) / 70) * (PW - PAD.l - PAD.r);
  const Y = (v) => PAD.t + (1 - (v - y0) / (y1 - y0)) * (PH - PAD.t - PAD.b);
  const yy = (v) => Y(Math.max(y0, Math.min(y1, v))).toFixed(1);
  const grid = r.yTicks.map((v) => `<path d="M${PAD.l} ${yy(v)} H${PW - PAD.r}" class="cz-grid"/>`
    + `<text x="${PAD.l - 6}" y="${(Number(yy(v)) + 5).toFixed(1)}" text-anchor="end">${v}</text>`).join('');
  const line = r.curve.map(([t, v], i) => `${i ? 'L' : 'M'}${X(t).toFixed(1)} ${yy(v)}`).join(' ');
  const dot = (t, cls) => `<circle cx="${X(t).toFixed(1)}" cy="${yy(solAt(r.curve, t))}" r="7" class="${cls}"/>`;
  const cooled = s.done.includes('cool');
  let drop = '';
  if (s.to != null && cooled) {
    const bx = X(r.start);
    drop = `<path d="M${X(s.to).toFixed(1)} ${yy(solAt(r.curve, s.to))} H${bx.toFixed(1)} V${yy(solAt(r.curve, r.start))}" class="cz-brace"/>`;
  }
  return `<svg class="cz-plot" viewBox="0 0 ${PW} ${PH}" role="img" aria-label="${r.name} solubility curve from 10 to 80 degrees">${grid}`
    + `<path d="${line}" class="cz-line"/>${drop}${dot(r.start, 'cz-start')}${s.to != null ? dot(s.to, 'cz-to') : ''}</svg>`;
}

function beakerSvg(r, s) {
  const cooled = s.done.includes('cool');
  const caught = s.done.includes('catch');
  const sandIn = r.sand && !s.done.includes('hot') && !caught;
  let crystals = '';
  if (cooled && !caught) {
    const n = r.curve === SALT ? 2 : 10;
    for (let i = 0; i < n; i += 1) {
      const x = 42 + (i * 47) % 66, y = 112 - (i % 3) * 8;
      crystals += `<path class="cz-xtal" d="M${x} ${y - 9} l9 9 -9 9 -9 -9 Z"/>`;
    }
  }
  const sand = sandIn ? [34, 48, 62, 76, 90, 104, 54, 80].map((x, i) => `<circle cx="${x}" cy="${118 - (i > 5 ? 5 : 0)}" r="3.6" fill="var(--sim-strata-2)" stroke="var(--sim-stroke)" stroke-width="1"/>`).join('') : '';
  const flame = cooled ? '' : '<path class="cz-flame" d="M50 152 q10 -18 10 -24 q8 10 0 24 Z M66 152 q10 -20 8 -28 q10 12 2 28 Z M82 152 q8 -16 8 -22 q8 10 0 22 Z"/>';
  return `<svg class="cz-beaker" viewBox="0 0 140 156" aria-hidden="true">${flame}`
    + `${caught ? '' : '<path class="cz-liq" d="M28 44 V118 a8 8 0 0 0 8 8 H104 a8 8 0 0 0 8 -8 V44 Z"/>'}${sand}${crystals}`
    + '<path d="M22 24 h6 V118 a8 8 0 0 0 8 8 H104 a8 8 0 0 0 8 -8 V24 h6" fill="none" stroke="var(--sim-stroke)" stroke-width="3.5" stroke-linejoin="round"/></svg>';
}

function glassSvg(r, s) {
  const has = s.done.includes('catch');
  const wet = has && !s.done.includes('rinse');
  const sandOn = has && r.sand && !s.done.includes('hot');
  let pile = '';
  if (has) {
    const n = r.curve === SALT ? 2 : 7;
    for (let i = 0; i < n; i += 1) pile += `<path class="cz-xtal" d="M${54 + i * 8} ${40 - (i % 2) * 6} l7 8 -7 8 -7 -8 Z"/>`;
    if (sandOn) pile += [58, 70, 82, 94].map((x) => `<circle cx="${x}" cy="48" r="3.4" fill="var(--sim-strata-2)" stroke="var(--sim-stroke)" stroke-width="1"/>`).join('');
    if (wet) pile += '<path d="M44 52 q36 12 72 0" stroke="var(--sim-water)" stroke-width="5" fill="none" stroke-linecap="round"/>';
  }
  return `<svg class="cz-beaker" viewBox="0 0 160 96" aria-hidden="true">`
    + '<path d="M36 52 q44 18 88 0" fill="color-mix(in oklab, var(--sim-glass) 26%, transparent)" stroke="var(--sim-stroke)" stroke-width="3"/>'
    + `${pile}<path d="M20 64 h120 l8 26 H12 Z" fill="var(--sim-surface-raised)" stroke="var(--sim-stroke)" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}

const CSS = `
.cz { background: var(--sim-bg-deep); border-radius: 14px; }
.cz .gm-check { display: none; }
.cz .board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 370px 240px minmax(0, 1fr); gap: 14px; align-items: start; }
.cz .col { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.cz .panel { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 14px; padding: 8px; }
.cz-plot { display: block; width: 100%; height: auto; }
.cz-plot text { fill: var(--sim-label-muted); font-size: 16px; font-weight: 700; }
.cz-grid { stroke: color-mix(in oklab, var(--sim-stroke) 60%, transparent); stroke-width: 1; }
.cz-line { fill: none; stroke: var(--sim-accent); stroke-width: 4; stroke-linejoin: round; stroke-linecap: round; }
.cz-start { fill: var(--sim-flame); stroke: var(--sim-stroke); stroke-width: 2; }
.cz-to { fill: var(--sim-ice); stroke: var(--sim-stroke); stroke-width: 2; }
.cz-brace { fill: none; stroke: var(--sim-warning); stroke-width: 4; stroke-linejoin: round; stroke-dasharray: 6 5; }
.cz .temps { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 4px; }
.cz .t { min-height: 46px; padding: 0; font-size: 15px; font-weight: 800; border-radius: 10px; font-variant-numeric: tabular-nums; }
.cz .t[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 1px; }
.cz .t:disabled, .cz .st:disabled, .cz .go:disabled { opacity: 0.45; cursor: default; box-shadow: none; }
.cz .k { font-size: 15px; font-weight: 700; color: var(--sim-label-muted); margin: 0; }
.cz .k b { color: var(--sim-label); }
.cz .bench { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: end; gap: 6px; padding: 8px; background: var(--sim-bg-cell);
  border-radius: 14px; border-bottom: 7px solid color-mix(in oklab, var(--sim-strata-2) 60%, var(--sim-stroke)); }
.cz .v { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; }
.cz-beaker { display: block; width: 100%; max-width: 112px; height: auto; }
.cz-liq { fill: color-mix(in oklab, var(--sim-gold) 26%, color-mix(in oklab, var(--sim-glass) 40%, transparent)); }
.cz-xtal { fill: color-mix(in oklab, var(--sim-ice) 75%, white); stroke: var(--sim-stroke); stroke-width: 1.6; }
.cz-flame { fill: var(--sim-flame); }
.cz .lcd { font-family: var(--sim-font-display); font-size: 22px; font-weight: 700; color: var(--sim-label); font-variant-numeric: tabular-nums; }
.cz .steps { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.cz .st { display: flex; align-items: center; gap: 8px; padding: 4px 8px; font-size: 15px; font-weight: 800; line-height: 1.15; text-align: left; border-radius: 12px; }
.cz .st i { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--sim-track); font-style: normal; font-weight: 800; }
.cz .st[data-on="1"] { border-color: var(--sim-good); }
.cz .st[data-on="1"] i { background: var(--sim-good); color: var(--sim-bg-deep); }
.cz .go { width: 100%; min-height: 50px; border: 0; border-radius: 12px; background: var(--sim-accent); color: var(--sim-bg-deep); font-size: 16px; font-weight: 800;
  box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.cz .say { min-height: 22px; font-size: 15px; line-height: 1.3; margin: 0; font-weight: 700; }
.cz .say.bad { color: var(--sim-label); }
.cz .say.good { color: var(--sim-good); font-weight: 800; }
.cz .chk { display: flex; gap: 6px; flex-wrap: wrap; }
.cz .chk span { padding: 3px 10px; border-radius: 999px; border: 2px solid var(--sim-stroke); font-size: 15px; font-weight: 800; background: var(--sim-bg-surface); }
.cz .chk .y { border-color: var(--sim-good); }
.cz .chk .n { border-color: var(--sim-warning); }

.sim-dom-root--portrait .cz .board { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .cz .col { width: 100%; }
.sim-dom-root--portrait .cz .temps { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.sim-dom-root--portrait .cz .t { min-height: 48px; }
`;

export class CrystallizeItScene extends GameBoard {
  static simId = 'crystallize-it';
  static label = { en: 'Make the Crystals' };
  static category = 'science.chemistry';
  static ARIA_LABEL = 'A crystal-making bench with a solubility curve. Pick the temperature to cool to by reading the curve, then tap the steps in order: filter hot, cool, filter off the crystals, rinse and dry. The crystals are weighed and checked for purity, dryness and mass.';
  static OBJECTIVE = { prompt: { en: 'Read the curve, pick how far to cool, and do the steps in the right order. The crystals must be pure, dry and the right mass.' } };
  static SCORING = { mode: 'accuracy', tolerance: 0 };

  constructor(container, config) {
    super(container, config);
    this._i = 0;
    this._st = this._fresh();
    this._won = ROUNDS.map(() => false);
    this._reported = false;
  }

  _fresh() { return { to: null, done: [], fail: null, weighed: null }; }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `<div class="gm cz"><div class="gm-head"><p class="kicker" id="cz-kick"></p><h2 id="cz-title"></h2><p class="sub" id="cz-sub"></p></div><div class="board" id="cz-board"></div></div>`,
    });
    this.root?.addEventListener?.('click', (e) => {
      const b = e.target instanceof Element ? e.target.closest('[data-act]') : null;
      if (b && !b.disabled) this._act(b.dataset.act, b.dataset.v);
    });
    this._paint();
    this.quill?.speak('Read the curve before you cool.', 5200);
  }

  _act(name, v) {
    const r = ROUNDS[this._i], s = this._st;
    if (name === 'next') {
      this._i = Math.min(ROUNDS.length - 1, this._i + 1);
      this._st = this._fresh();
      return this._paint();
    }
    if (name === 'again') { this._st = this._fresh(); return this._paint(); }
    if (s.weighed) return undefined;
    if (name === 'to') { s.to = Number(v); return this._paint(); }
    if (name === 'step') return this._step(v);
    if (name === 'weigh') return this._weigh(r, s);
    return undefined;
  }

  _step(id) {
    const s = this._st;
    s.fail = null;
    if (id === 'hot') {
      if (s.done.includes('cool')) s.fail = 'Crystals have formed, so a filter now keeps them with the sand.';
      else s.done.push('hot');
    } else if (id === 'cool') {
      if (s.to == null) s.fail = 'Tap a temperature first.';
      else s.done.push('cool');
    } else if (id === 'catch') {
      if (!s.done.includes('cool')) s.fail = 'No crystals yet: cool it first.';
      else s.done.push('catch');
    } else if (id === 'rinse') {
      if (!s.done.includes('catch')) s.fail = 'There are no crystals to rinse yet.';
      else s.done.push('rinse');
    }
    return this._paint();
  }

  _weigh(r, s) {
    const out = solAt(r.curve, r.start) - solAt(r.curve, s.to);
    const sand = r.sand && !s.done.includes('hot') ? SAND_G : 0;
    const dry = s.done.includes('rinse');
    const weighed = (out + sand) * (dry ? 1 : WET);
    const massOk = Math.abs(weighed - r.target) <= r.tol + 1e-9;
    const checks = [
      { k: 'Pure', ok: !sand, why: 'Sand came along: filter while it is hot.' },
      { k: 'Dry', ok: dry, why: 'Still wet: the solution on the crystals adds mass.' },
      { k: 'Mass', ok: massOk, why: Math.abs(out - r.target) > r.tol ? `${r.start}${DEG} to ${s.to}${DEG} gives ${g1(out)} g, not ${g1(r.target)} g.` : 'The extra mass is sand or solution.' },
    ];
    s.weighed = { g: weighed, checks };
    const won = checks.every((c) => c.ok);
    if (won) {
      this._won[this._i] = true;
      this.quill?.perform('hop');
    } else this.quill?.setExpression('surprised');
    this._paint();
    if (won && this._won.every(Boolean) && !this._reported) { this._reported = true; this.requestCheck?.(); }
    return undefined;
  }

  checkObjective() {
    if (!this._won.every(Boolean)) return null;
    return { ok: true };
  }

  _paint() {
    const r = ROUNDS[this._i], s = this._st;
    const q = (id) => this.root?.querySelector?.(id);
    const put = (id, html) => { const el = q(id); if (el) el.innerHTML = html; };
    put('#cz-kick', `Round ${this._i + 1} of ${ROUNDS.length}`);
    put('#cz-title', `Make <b>${g1(r.target)} g</b> of pure dry crystals`);
    put('#cz-sub', `${r.name}, saturated at ${r.start} ${DEG}C in 100 g of water${r.sand ? ', with sand mixed in' : ''}.`);
    const cooled = s.done.includes('cool');
    const temps = TEMPS.filter((t) => t < r.start).map((t) => `<button type="button" class="tap btn t" data-act="to" data-v="${t}" aria-pressed="${s.to === t}" aria-label="Cool to ${t} degrees"${cooled || s.weighed ? ' disabled' : ''}>${t}${DEG}</button>`).join('');
    const steps = STEPS.filter((x) => r.sand || x.id !== 'hot').map((x) => {
      const n = s.done.indexOf(x.id);
      return `<button type="button" class="tap btn st" data-act="step" data-v="${x.id}" data-on="${n >= 0 ? 1 : 0}"${n >= 0 || s.weighed ? ' disabled' : ''}><i>${n >= 0 ? n + 1 : ''}</i>${x.label}</button>`;
    }).join('');
    const caught = s.done.includes('catch');
    let tail;
    if (s.weighed) {
      const won = s.weighed.checks.every((c) => c.ok);
      const last = this._i === ROUNDS.length - 1;
      tail = `<div class="chk">${s.weighed.checks.map((c) => `<span class="${c.ok ? 'y' : 'n'}">${c.ok ? TICK : CROSS} ${c.k}</span>`).join('')}</div>`
        + (won ? '' : s.weighed.checks.filter((c) => !c.ok).map((c) => `<p class="say bad">${c.why}</p>`).join(''))
        + (won ? (last ? '<p class="say good">All three rounds done.</p>' : '<button type="button" class="tap go" data-act="next">Next round</button>')
          : '<button type="button" class="tap go" data-act="again">Try this round again</button>');
    } else {
      tail = `<p class="say bad" aria-live="polite">${s.fail ?? ''}</p><button type="button" class="tap go" data-act="weigh"${caught ? '' : ' disabled'}>Weigh the crystals</button>`;
    }
    const outLine = cooled ? `<p class="k">Came out: <b>${g1(solAt(r.curve, r.start) - solAt(r.curve, s.to))} g</b></p>` : '<p class="k">Solubility, g in 100 g of water. Tap where to cool to.</p>';
    put('#cz-board', `
      <div class="col"><div class="panel">${curveSvg(r, s)}</div><div class="temps">${temps}</div>${outLine}</div>
      <div class="col"><div class="bench">
        <div class="v">${beakerSvg(r, s)}<span class="k">${cooled ? `${s.to} ${DEG}C` : `${r.start} ${DEG}C`}</span></div>
        <div class="v">${glassSvg(r, s)}<span class="lcd">${s.weighed ? `${g1(s.weighed.g)} g` : '0 g'}</span></div>
      </div></div>
      <div class="col"><p class="k">Tap the steps in order</p><div class="steps">${steps}</div>${tail}</div>`);
  }
}
