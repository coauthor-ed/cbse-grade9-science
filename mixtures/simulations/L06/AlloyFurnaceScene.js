/**
 * AlloyFurnaceScene - blk-l06-s06, brass, a mixture that looks like one metal. One picture runs the whole scene: a window
 * onto the atoms of a metal bar (60 atoms, one colour per element). Four tabs, one per beat:
 *   b0  Look inside   tap a bar, then its top, middle or bottom: every spot shows the same mix
 *   b1  Melt and mix  say what a cooled melt will look like, heat a copper and a zinc block, cool them: one even bar
 *   b2  Try a method  guess which method separates brass, then run filter, magnet and funnel on each bar: nothing separates
 *   b3  Why           brass beside salt water: both evenly mixed solutions, nothing to strain, no layers
 * Beats pick the tab; what the learner has done stays done. No frame loop: CSS transitions and one short timer per run.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, burst } from 'simulations/base/kit/SimLookDom.js';
import { flowTabsHtml, flowStageHtml, flowDeckHtml, showFlowPanel, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { rng, shuffle } from 'simulations/base/kit/shuffle.js';

/* ------------------------------------------------------------------ data */

/** Elements, one colour each for the whole scene. */
const EL = {
  Cu: { name: 'copper', tone: '--sim-strata-3' },
  Zn: { name: 'zinc', tone: '--sim-strata-5' },
  Sn: { name: 'tin', tone: '--sim-muted' },
  Fe: { name: 'iron', tone: '--sim-waste' },
  Cr: { name: 'chromium', tone: '--sim-series-7' },
  Ni: { name: 'nickel', tone: '--sim-series-3' },
  Mo: { name: 'molybdenum', tone: '--sim-series-5' },
};

/** Three bars; `atoms` is how many of the window's 60 each element takes (the slide's percentages). */
const ALLOYS = [
  { id: 'brass', name: 'Brass', metal: '--sim-gold', atoms: { Cu: 48, Zn: 12 }, mix: 'about 80 % copper, 20 % zinc' },
  { id: 'bronze', name: 'Bronze', metal: '--sim-strata-2', atoms: { Cu: 48, Sn: 12 }, mix: 'about 80 % copper, 20 % tin' },
  { id: 'steel', name: 'Stainless steel', metal: '--sim-muted', atoms: { Fe: 41, Cr: 10, Ni: 7, Mo: 2 }, mix: 'iron with chromium, nickel, molybdenum, a little carbon' },
];
const SPOTS = [{ id: 'top', label: 'Top' }, { id: 'mid', label: 'Middle' }, { id: 'bot', label: 'Bottom' }];
const METHODS = [
  { id: 'filter', name: 'Filter' },
  { id: 'magnet', name: 'Magnet' },
  { id: 'funnel', name: 'Separating funnel' },
];
const TABS = [
  { key: 'look', label: 'Look inside' },
  { key: 'melt', label: 'Melt and mix' },
  { key: 'method', label: 'Try a method' },
  { key: 'same', label: 'Why nothing works' },
];
const MAP = TABS.map((_, i) => [{ idx: i, dwellMs: null }]);
const COLS = 10;
const ROWS = 6;
const RUN_MS = 900;
const MARK = { yes: '\u2713', no: '\u2717' };
const reduced = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** The atoms of one window, in a seeded order so a spot always repaints the same. */
function atomList(counts, seed) {
  const list = [];
  for (const [k, n] of Object.entries(counts)) for (let i = 0; i < n; i++) list.push(k);
  return shuffle(list, rng(seed));
}

/**
 * A window of atoms in a 10 x 6 lattice. `mode`: 'lattice' (a solid), 'melt' (jumbled, a liquid),
 * 'split' (copper left, zinc right: two blocks pressed together cold).
 */
function atomsSvg(list, { mode = 'lattice', seed = 1, cls = '', label = '' } = {}) {
  const r = rng(seed + 99);
  const cell = 22;
  const w = COLS * cell + 8;
  const h = ROWS * cell + 8;
  let dots = '';
  list.forEach((k, i) => {
    if (!k) return;
    const c = i % COLS;
    const rw = Math.floor(i / COLS);
    let x = 4 + c * cell + cell / 2;
    let y = 4 + rw * cell + cell / 2;
    if (mode === 'melt') { x += (r() - 0.5) * 9; y += (r() - 0.5) * 9; }
    if (mode === 'split' && c === 4) x -= 2;
    if (mode === 'split' && c === 5) x += 2;
    dots += `<circle class="af-atom" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="var(${EL[k].tone})" style="--d:${(i % 7) * 40}ms"/>`;
  });
  const seam = mode === 'split' ? `<path d="M${4 + 5 * cell} 2 V${h - 2}" stroke="var(--sim-label)" stroke-width="2" stroke-dasharray="4 4"/>` : '';
  return `<svg class="af-win ${cls} af-win--${mode}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">`
    + `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="10" class="af-win__bg"/>${dots}${seam}</svg>`;
}

function legendHtml(counts) {
  return `<span class="af-legend">${Object.entries(counts).map(([k, n]) =>
    `<span class="af-key"><span class="af-key__dot" style="--t:var(${EL[k].tone})"></span>${esc(EL[k].name)} ${n}</span>`).join('')}</span>`;
}

/** A metal bar seen from the side, with a sheen; `spots` puts three tap points on it. */
function barHtml(a, { on = false, spots = null, hot = false, cls = '' } = {}) {
  const pts = spots ? `<span class="af-spots">${SPOTS.map((s) => `<button type="button" class="af-spot${spots.cur === s.id ? ' is-on' : ''}${spots.seen.includes(s.id) ? ' is-seen' : ''}"`
    + ` data-sflow-action="spot" data-sflow-value="${s.id}" aria-label="Look inside the ${esc(s.label.toLowerCase())}" aria-pressed="${spots.cur === s.id}"></button>`).join('')}</span>` : '';
  return `<span class="af-bar${on ? ' is-on' : ''}${hot ? ' is-hot' : ''}${cls ? ` ${cls}` : ''}" style="--m:var(${a.metal})">`
    + `<span class="af-bar__face"></span><span class="af-bar__sheen"></span>${pts}</span>`;
}

/* ------------------------------------------------------------- the scene */

export class AlloyFurnaceScene extends DomSimulation {
  static WIDTH = 680;
  static HEIGHT = 556;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1000;
  static BEAT_STEP_MAP = MAP;
  // Metal sheen, a glowing melt and lit glass carry this scene; still no frame loop.
  static VISUAL_PROFILE = 'rich';
  static ARIA_LABEL =
    'A window onto the atoms of three alloys. Look inside brass, bronze and stainless steel at three spots, melt copper and zinc '
    + 'together and cool them, try a filter, a magnet and a separating funnel on each bar, and compare brass with salt water.';
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this._tab = 'look';
    this._look = { alloy: 'brass', spot: null, seen: {} };
    this._melt = { guess: null, phase: 'apart' };        // apart | melt | cool
    this._method = { guess: null, alloy: 'brass', res: {}, last: null, busy: null };
    this._timer = 0;
    this._celebrated = {};
  }

  async setup() {
    await super.setup();
    this.render({ css: CSS, rootClass: 'af-root', html: this._frameHtml() });
    bindFlow(this.root, {
      tab: (key) => this._go(key),
      action: (name, value) => this._act(name, value),
    });
  }

  onStep(step) {
    this._go(TABS[step]?.key ?? 'look');
  }

  _go(key) {
    if (!TABS.some((t) => t.key === key)) return;
    this._tab = key;
    showFlowPanel(this.root, key);
  }

  _act(name, value) {
    const L = this._look;
    const M = this._melt;
    const V = this._method;
    if (name === 'alloy') {
      if (!ALLOYS.some((a) => a.id === value)) return;
      L.alloy = value;
      L.spot = null;
      return this._paint('look');
    }
    if (name === 'spot') {
      L.spot = value;
      const seen = L.seen[L.alloy] || (L.seen[L.alloy] = []);
      if (!seen.includes(value)) seen.push(value);
      this._paint('look');
      if (seen.length === SPOTS.length && !this._celebrated[`look-${L.alloy}`]) {
        this._celebrated[`look-${L.alloy}`] = true;
        burst(this.root.querySelector?.('[data-pane="look"] .af-winbox'));
      }
      return undefined;
    }
    if (name === 'mguess') { if (!M.guess) M.guess = value; return this._paint('melt'); }
    if (name === 'heat') { if (M.guess && M.phase === 'apart') M.phase = 'melt'; return this._paint('melt'); }
    if (name === 'cool') {
      if (M.phase !== 'melt') return undefined;
      M.phase = 'cool';
      this._paint('melt');
      if (M.guess === 'one') burst(this.root.querySelector?.('[data-pane="melt"] .af-winbox'));
      return undefined;
    }
    if (name === 'mreset') { M.phase = 'apart'; return this._paint('melt'); }
    if (name === 'lguess') { if (!V.guess) V.guess = value; return this._paint('method'); }
    if (name === 'lalloy') { if (ALLOYS.some((a) => a.id === value)) V.alloy = value; return this._paint('method'); }
    if (name === 'pull') return this._pull(value);
    return undefined;
  }

  _pull(method) {
    const V = this._method;
    if (!V.guess || V.busy || !METHODS.some((l) => l.id === method)) return;
    V.busy = method;
    this._paint('method');
    this._after(() => {
      V.busy = null;
      V.res[`${V.alloy}:${method}`] = true;
      V.last = `${V.alloy}:${method}`;
      this._paint('method');
      const n = Object.keys(V.res).length;
      if (n === ALLOYS.length * METHODS.length && !this._celebrated.grid) {
        this._celebrated.grid = true;
        burst(this.root.querySelector?.('[data-pane="method"] .af-grid'));
      }
    });
  }

  _after(fn, ms = RUN_MS) {
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => { this._timer = 0; fn(); }, reduced() ? 0 : ms);
  }

  destroy() {
    if (this._timer) clearTimeout(this._timer);
    this._timer = 0;
    super.destroy();
  }

  /* ---------------------------------------------------------------- paint */

  _frameHtml() {
    const stages = TABS.map((t) => flowStageHtml({ panel: t.key, cls: t.key === this._tab ? '' : 'is-off',
      body: `<div class="af-pane" data-pane="${t.key}">${this._body(t.key)}</div>` }));
    return `<div class="sflow">${flowTabsHtml(TABS, this._tab, 'Alloys')}${flowDeckHtml(stages)}</div>`;
  }

  _paint(key) {
    const pane = this.root?.querySelector?.(`[data-pane="${key}"]`);
    if (pane) pane.innerHTML = this._body(key);
  }

  _body(key) {
    if (key === 'look') return this._lookHtml();
    if (key === 'melt') return this._meltHtml();
    if (key === 'method') return this._methodHtml();
    return this._sameHtml();
  }

  _chip(label, action, value, { on = false, cls = '', dis = false } = {}) {
    return `<button type="button" class="af-chip${on ? ' is-on' : ''}${cls ? ` ${cls}` : ''}" data-sflow-action="${action}"`
      + ` data-sflow-value="${esc(value)}" aria-pressed="${on}"${dis ? ' disabled' : ''}>${label}</button>`;
  }

  /** A guess row: once picked, the pick is marked right or wrong only after the run has shown it. */
  _guessRow(q, action, opts, guess, right, shown) {
    const chips = opts.map((o) => {
      const mine = guess === o.v;
      const verdict = shown && mine ? (o.v === right ? ' is-yes' : ' is-no') : mine ? ' is-on' : '';
      const mark = shown && mine ? ` <span aria-hidden="true">${o.v === right ? MARK.yes : MARK.no}</span>` : '';
      return this._chip(`${esc(o.l)}${mark}`, action, o.v, { cls: verdict, dis: !!guess && !mine });
    }).join('');
    return `<div class="af-ask"><span class="af-k">${esc(q)}</span><span class="af-chips">${chips}</span></div>`;
  }

  _lookHtml() {
    const L = this._look;
    const a = ALLOYS.find((x) => x.id === L.alloy);
    const seen = L.seen[a.id] || [];
    const bars = ALLOYS.map((x) => `<button type="button" class="af-pick${x.id === a.id ? ' is-on' : ''}" data-sflow-action="alloy" data-sflow-value="${x.id}" aria-pressed="${x.id === a.id}">`
      + `${barHtml(x, { cls: 'af-bar--mini' })}<span class="af-pick__n">${esc(x.name)}</span></button>`).join('');
    const spot = SPOTS.find((s) => s.id === L.spot);
    const win = spot
      ? `${atomsSvg(atomList(a.atoms, a.id.length * 7 + SPOTS.indexOf(spot) * 13), { seed: SPOTS.indexOf(spot) + 3, label: `${a.name}, ${spot.label.toLowerCase()}: ${a.mix}` })}`
        + `<span class="af-wincap">${esc(a.name)}, ${esc(spot.label.toLowerCase())}</span>${legendHtml(a.atoms)}`
      : '<span class="af-wait">Tap a spot on the bar</span>';
    const done = seen.length === SPOTS.length
      ? `<span class="af-tag is-yes">${MARK.yes} The same mix at all three spots</span>`
      : `<span class="af-k">Spots looked at: ${seen.length} of 3</span>`;
    return `<div class="af-picks">${bars}</div>`
      + `<div class="af-split"><div class="af-hero">${barHtml(a, { on: true, spots: { cur: L.spot, seen } })}`
      + `<span class="af-k">${esc(a.mix)}</span></div>`
      + `<div class="af-winbox">${win}${done}</div></div>`;
  }

  _meltHtml() {
    const M = this._melt;
    const phase = M.phase;
    const counts = { Cu: 48, Zn: 12 };
    let list;
    if (phase === 'apart') {
      list = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) list.push(c < 8 ? 'Cu' : 'Zn');
    } else list = atomList(counts, 41);
    const mode = phase === 'apart' ? 'split' : phase === 'melt' ? 'melt' : 'lattice';
    const cap = phase === 'apart' ? 'Copper block and zinc block, pressed together cold'
      : phase === 'melt' ? 'Melted together: the atoms move and mix' : 'Cooled: one solid bar';
    const guess = this._guessRow('After it cools, you will see', 'mguess',
      [{ v: 'two', l: 'Two metals side by side' }, { v: 'one', l: 'One even metal' }], M.guess, 'one', phase === 'cool');
    const crucible = `<span class="af-crucible is-${phase}">`
      + (phase === 'apart'
        ? `<span class="af-blocks"><span class="af-block" style="--m:var(--sim-strata-3)"></span><span class="af-block af-block--zn" style="--m:var(--sim-strata-5)"></span></span>`
        : phase === 'melt' ? '<span class="af-melt"></span>' : `${barHtml(ALLOYS[0], { cls: 'af-bar--cast' })}`)
      + `<span class="af-pot"></span><span class="af-fire" aria-hidden="true"><span></span><span></span><span></span></span></span>`;
    const btns = phase === 'apart'
      ? `<button type="button" class="af-go" data-sflow-action="heat"${M.guess ? '' : ' disabled'}>Heat it</button>`
      : phase === 'melt' ? '<button type="button" class="af-go" data-sflow-action="cool">Let it cool</button>'
        : '<button type="button" class="af-quiet" data-sflow-action="mreset">Start again</button>';
    const hint = !M.guess ? '<span class="af-k">Guess first, then heat</span>' : '';
    return `${guess}<div class="af-split"><div class="af-hero">${crucible}<span class="af-acts">${btns}${hint}</span></div>`
      + `<div class="af-winbox">${atomsSvg(list, { mode, seed: 5, label: cap })}<span class="af-wincap">${esc(cap)}</span>${legendHtml(counts)}</div></div>`;
  }

  _methodHtml() {
    const V = this._method;
    const tried = Object.keys(V.res).length;
    const guess = this._guessRow('Which method will separate brass?', 'lguess',
      [...METHODS.map((l) => ({ v: l.id, l: l.name })), { v: 'none', l: 'None of them' }], V.guess, 'none', tried > 0);
    const a = ALLOYS.find((x) => x.id === V.alloy);
    const lock = !V.guess;
    const picks = ALLOYS.map((x) => this._chip(esc(x.name), 'lalloy', x.id, { on: x.id === a.id, dis: lock })).join('');
    const methods = METHODS.map((l) => this._chip(`${methodIcon(l.id)}${esc(l.name)}`, 'pull', l.id,
      { cls: 'af-method', dis: lock || !!V.busy })).join('');
    const busy = V.busy ? ` is-${V.busy}` : '';
    const last = V.last && V.last.startsWith(`${a.id}:`) ? V.last.split(':')[1] : null;
    let out = `<span class="af-wait">${lock ? 'Guess first' : 'Pick a method'}</span>`;
    if (V.busy) out = `<span class="af-wait">${esc(METHODS.find((l) => l.id === V.busy).name)}...</span>`;
    else if (last) {
      const tag = a.id === 'steel' && last === 'magnet' ? 'The iron does not come away alone' : 'Nothing separated';
      out = `<span class="af-tag is-no">${MARK.no} ${esc(tag)}</span>`;
    }
    const grid = `<table class="af-grid"><thead><tr><th></th>${METHODS.map((l) => `<th scope="col">${esc(l.name)}</th>`).join('')}</tr></thead><tbody>`
      + ALLOYS.map((x) => `<tr><th scope="row">${esc(x.name)}</th>${METHODS.map((l) => {
        const k = `${x.id}:${l.id}`;
        const fresh = V.last === k ? ' is-new' : '';
        return `<td>${V.res[k] ? `<span class="af-cell${fresh}">nothing</span>` : '<span class="af-cell af-cell--q">?</span>'}</td>`;
      }).join('')}</tr>`).join('') + '</tbody></table>';
    return `${guess}<div class="af-split af-split--method"><div class="af-rig${busy}">`
      + `<span class="af-chips">${picks}</span><span class="af-stage">${barHtml(a, { on: true, cls: 'af-bar--rig' })}<span class="af-tool" aria-hidden="true"></span></span>`
      + `<span class="af-chips">${methods}</span><span class="af-out" aria-live="polite">${out}</span></div>${grid}</div>`;
  }

  _sameHtml() {
    const brass = atomsSvg(atomList(ALLOYS[0].atoms, 77), { seed: 9, label: 'Brass: zinc atoms spread evenly among copper atoms' });
    const waterSvg = waterSvgOf(atomList({ W: 50, S: 10 }, 23), 0);
    const tags = ['Evenly mixed', 'No layers', 'No pieces to filter'].map((t) => `<span class="af-tag">${esc(t)}</span>`).join('');
    return `<div class="af-pair"><div class="af-winbox">${waterSvg}<span class="af-wincap">Salt in water</span><span class="af-k">a liquid solution</span></div>`
      + `<div class="af-winbox">${brass}<span class="af-wincap">Zinc in copper</span><span class="af-k">a solid solution</span></div></div>`
      + `<div class="af-tags">${tags}</div>`;
  }
}

/** Salt water: water molecules as pale dots, salt as the salt colour, the same 10 x 6 window. */
function waterSvgOf(list, day = 0) {
  const cell = 22;
  const r = rng(31 + day);
  const w = COLS * cell + 8;
  const h = ROWS * cell + 8;
  const dots = list.map((k, i) => {
    const x = 4 + (i % COLS) * cell + cell / 2 + (r() - 0.5) * 6;
    const y = 4 + Math.floor(i / COLS) * cell + cell / 2 + (r() - 0.5) * 6;
    return k === 'W'
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="color-mix(in oklab, var(--sim-water) 55%, var(--sim-bg-surface))"/>`
      : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="var(--sim-salt)" stroke="var(--sim-stroke)" stroke-width="1.5"/>`;
  }).join('');
  return `<svg class="af-win" viewBox="0 0 ${w} ${h}" role="img" aria-label="Salt water: salt spread evenly through water">`
    + `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="10" class="af-win__bg"/>${dots}</svg>`;
}

/** Small method glyphs: a filter funnel with paper, a horseshoe magnet, a separating funnel. */
function methodIcon(id) {
  const p = {
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    magnet: '<path d="M6 3v9a6 6 0 0 0 12 0V3h-4v9a2 2 0 0 1-4 0V3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    funnel: '<path d="M9 2h6M10 2v3l-5 9a5 5 0 0 0 4 7h6a5 5 0 0 0 4-7l-5-9V2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  }[id];
  return `<svg class="af-ico" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
}

const CSS = SIM_LOOK_DOM_CSS + `
.af-root { padding: var(--sim-space-3);
  background: radial-gradient(110% 70% at 15% 0%, color-mix(in oklab, var(--sim-flame) 10%, transparent), transparent 60%), var(--sim-bg-deep); }
.af-root .sflow { gap: var(--sim-space-2); }
.af-root .sflow-stage { padding: var(--sim-space-3); gap: var(--sim-space-2); }
.af-pane { display: flex; flex-direction: column; gap: var(--sim-space-3); }
.af-k { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); text-align: center; }
.af-wait { font-weight: 800; font-size: var(--sim-text-md); color: var(--sim-label-muted); text-align: center; }
.af-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--sim-space-1); }
.af-ask { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--sim-space-1) var(--sim-space-2); }
.af-chip { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 2px var(--sim-space-3);
  border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-pill); background: var(--sim-bg-surface); color: var(--sim-label);
  font: inherit; font-weight: 800; font-size: var(--sim-text-sm); cursor: pointer;
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); transition: transform 0.1s ease, box-shadow 0.1s ease; }
.af-chip:active { transform: translateY(3px); box-shadow: none; }
.af-chip:disabled { opacity: 0.4; cursor: default; transform: none; }
.af-chip.is-on { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); opacity: 1; }
.af-chip.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); opacity: 1; }
.af-chip.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 16%, var(--sim-bg-surface)); opacity: 1; animation: af-shake 0.36s ease; }
.af-chip:focus-visible, .af-go:focus-visible, .af-quiet:focus-visible, .af-pick:focus-visible, .af-spot:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.af-ico { width: 18px; height: 18px; flex: none; }
.af-go, .af-quiet { min-height: 44px; padding: var(--sim-space-1) var(--sim-space-4); border-radius: var(--sim-radius-md); font: inherit; font-weight: 800; font-size: var(--sim-text-md); cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease; }
.af-go { border: 2px solid var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke))); background: var(--primary-color, var(--sim-accent));
  box-shadow: 0 4px 0 var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke))); }
.af-root .af-go { color: var(--on-primary, var(--sim-bg-deep)); }
.af-quiet { border: 2px solid var(--sim-stroke); background: var(--sim-bg-surface); color: var(--sim-label); box-shadow: 0 4px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); }
.af-go:active, .af-quiet:active { transform: translateY(4px); box-shadow: none; }
.af-go:disabled { opacity: 0.4; cursor: default; transform: none; box-shadow: none; }
.af-tag { display: inline-flex; align-items: center; gap: 6px; padding: 3px var(--sim-space-3); border-radius: var(--sim-radius-pill); border: 2px solid var(--sim-stroke);
  background: var(--sim-bg-surface); font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label); text-align: center; }
.af-tag.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); animation: af-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.af-tag.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface)); animation: af-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.af-tag.is-warn { border-color: var(--sim-warning); }

.af-split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: var(--sim-space-4); align-items: center; }
.sim-dom-root--portrait .af-split { grid-template-columns: minmax(0, 1fr); gap: var(--sim-space-3); }
.af-hero { display: flex; flex-direction: column; align-items: center; gap: var(--sim-space-2); min-width: 0; }
.af-winbox { position: relative; display: flex; flex-direction: column; align-items: center; gap: var(--sim-space-1); min-width: 0; min-height: 200px; justify-content: center; }
.af-win { display: block; width: 100%; max-width: 260px; height: auto; filter: drop-shadow(0 4px 0 color-mix(in oklab, var(--sim-stroke) 60%, transparent)); }
.af-win__bg { fill: var(--sim-bg-cell); stroke: var(--sim-stroke); stroke-width: 2; }
.af-atom { stroke: color-mix(in oklab, var(--sim-stroke) 80%, transparent); stroke-width: 1.5; }
.af-win--melt .af-atom { animation: af-jig 0.5s ease-in-out 3 alternate both; animation-delay: var(--d); }
.af-win--melt .af-win__bg { fill: color-mix(in oklab, var(--sim-flame) 22%, var(--sim-bg-cell)); }
.af-wincap { font-weight: 900; font-size: var(--sim-text-md); color: var(--sim-label); text-align: center; }
.af-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px var(--sim-space-3); }
.af-key { display: inline-flex; align-items: center; gap: 5px; font-weight: 700; font-size: var(--sim-text-sm); color: var(--sim-label); }
.af-key__dot { flex: none; width: 13px; height: 13px; border-radius: 50%; background: var(--t); border: 2px solid var(--sim-stroke); }

/* bars: a cast ingot with a bright band of reflected light */
.af-bar { position: relative; display: block; width: 210px; height: 74px; border-radius: 10px 10px 14px 14px;
  border: 2px solid color-mix(in oklab, var(--m) 40%, var(--sim-stroke)); overflow: visible;
  box-shadow: 0 6px 0 color-mix(in oklab, var(--m) 45%, var(--sim-stroke)), 0 12px 14px -6px color-mix(in oklab, var(--sim-stroke) 80%, transparent); }
.af-bar__face { position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(to bottom, color-mix(in oklab, var(--m) 55%, var(--sim-ice) 45%), var(--m) 35%, color-mix(in oklab, var(--m) 70%, var(--sim-stroke)) 100%); }
.af-bar__sheen { position: absolute; inset: 9px 18px auto; height: 9px; border-radius: 6px; background: color-mix(in oklab, var(--sim-ice) 70%, transparent); }
.af-bar--mini { width: 74px; height: 26px; border-radius: 5px 5px 7px 7px; box-shadow: 0 3px 0 color-mix(in oklab, var(--m) 45%, var(--sim-stroke)); }
.af-bar--mini .af-bar__sheen { inset: 4px 8px auto; height: 4px; }
.af-spots { position: absolute; inset: -6px -46px -6px auto; display: flex; flex-direction: column; justify-content: space-between; }
.af-spot { position: relative; width: 44px; height: 44px; border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-pill);
  background: var(--sim-bg-surface); cursor: pointer; box-shadow: 0 2px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); }
.af-spot::before { content: ''; position: absolute; inset: 50% 100% auto auto; width: 20px; border-top: 2px dashed var(--sim-label-muted); }
.af-spot::after { content: ''; position: absolute; inset: 6px 9px; border-radius: 50%; border: 2px solid var(--sim-label-muted); }
.af-spot.is-seen { border-color: var(--sim-good); }
.af-spot.is-seen::after { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 40%, transparent); }
.af-spot.is-on { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 24%, var(--sim-bg-surface)); transform: scale(1.1); }
.af-hero > .af-bar { margin-right: 46px; margin-block: var(--sim-space-2); }
.af-picks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sim-space-2); }
.af-pick { display: flex; align-items: center; justify-content: center; gap: var(--sim-space-2); min-height: 48px; padding: var(--sim-space-1) var(--sim-space-2);
  border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-md); background: var(--sim-bg-surface); color: var(--sim-label); font: inherit; cursor: pointer;
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); }
.af-pick.is-on { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 14%, var(--sim-bg-surface)); }
.af-pick__n { font-weight: 800; font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .af-pick { flex-direction: column; gap: 4px; }
.sim-dom-root--portrait .af-bar--mini { width: 56px; }

/* the crucible over a burner */
.af-crucible { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; width: 220px; height: 170px; }
.af-pot { width: 200px; height: 30px; margin-top: -4px; border-radius: 0 0 40px 40px; border: 2px solid var(--sim-stroke);
  background: linear-gradient(to bottom, var(--sim-surface-raised), color-mix(in oklab, var(--sim-surface-raised) 60%, var(--sim-stroke))); }
.af-blocks { display: flex; gap: 0; }
.af-block { width: 120px; height: 66px; border-radius: 8px 0 0 8px; border: 2px solid color-mix(in oklab, var(--m) 40%, var(--sim-stroke));
  background: linear-gradient(to bottom, color-mix(in oklab, var(--m) 55%, var(--sim-ice) 45%), var(--m) 40%, color-mix(in oklab, var(--m) 70%, var(--sim-stroke))); }
.af-block--zn { width: 40px; border-radius: 0 8px 8px 0; border-left-style: dashed; }
.af-melt { width: 180px; height: 44px; border-radius: 50% 50% 8px 8px / 30% 30% 8px 8px;
  background: linear-gradient(to bottom, color-mix(in oklab, var(--sim-gold) 60%, var(--sim-label) 40%), var(--sim-flame) 55%, var(--sim-magma));
  box-shadow: 0 0 22px 4px color-mix(in oklab, var(--sim-flame) 55%, transparent); animation: af-glow 1.2s ease-in-out 2 alternate both; }
.af-bar--cast { width: 180px; height: 56px; }
.af-fire { display: flex; gap: 12px; height: 26px; margin-top: 4px; opacity: 0; transition: opacity 0.3s ease; }
.af-fire span { width: 16px; height: 24px; border-radius: 50% 50% 40% 40% / 70% 70% 30% 30%; background: linear-gradient(to top, var(--sim-flame), var(--sim-gold)); }
.af-crucible.is-melt .af-fire { opacity: 1; }
.af-acts { display: flex; flex-direction: column; align-items: center; gap: 4px; }

/* the method rig */
.af-split--method { grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); align-items: start; }
.af-rig { display: flex; flex-direction: column; align-items: center; gap: var(--sim-space-2); min-width: 0; }
.af-stage { position: relative; display: grid; place-items: center; width: 100%; height: 104px; }
.af-bar--rig { width: 170px; height: 60px; }
.af-tool { position: absolute; inset: 0 auto auto 50%; width: 44px; height: 36px; margin-left: -22px; opacity: 0; border-radius: 6px;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.3, 1), opacity 0.2s ease; transform: translateY(-14px); }
.af-rig.is-magnet .af-tool { opacity: 1; transform: translateY(4px); border: 8px solid var(--sim-error); border-top: 0; border-radius: 0 0 22px 22px; }
.af-rig.is-filter .af-tool { opacity: 1; transform: translateY(4px); border-top: 4px dashed var(--sim-label-muted); border-radius: 0; width: 120px; margin-left: -60px; inset-block-start: auto; bottom: 0; }
.af-rig.is-funnel .af-tool { opacity: 1; transform: translateY(4px); border: 3px solid var(--sim-glass); border-top: 0; border-radius: 0 0 30px 30px; height: 60px; width: 70px; margin-left: -35px; }
.af-out { min-height: 44px; display: flex; align-items: center; justify-content: center; }
.af-grid { width: 100%; border-collapse: separate; border-spacing: 4px; }
.af-grid th { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); text-align: center; line-height: 1.15; }
.af-grid th[scope="row"] { text-align: right; color: var(--sim-label); }
.af-grid td { text-align: center; }
.af-cell { display: inline-flex; align-items: center; justify-content: center; width: 100%; min-height: 40px; border-radius: var(--sim-radius-sm);
  border: 2px solid var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface));
  font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label); }
.af-cell--q { border: 2px dashed var(--sim-stroke); background: transparent; color: var(--sim-label-muted); }
.af-cell.is-new { animation: af-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.sim-dom-root--portrait .af-split--method { grid-template-columns: minmax(0, 1fr); }

/* a solution, two ways */
.af-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: center; gap: var(--sim-space-3); }
.sim-dom-root--portrait .af-pair { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .af-chip, .sim-dom-root--portrait .af-go, .sim-dom-root--portrait .af-quiet, .sim-dom-root--portrait .sflow-tab { min-height: 48px; }
.sim-dom-root--portrait .af-bar:has(.af-spots) { margin-bottom: 62px; }
.sim-dom-root--portrait .af-spots { inset: auto 0 -60px 0; flex-direction: row; justify-content: center; gap: var(--sim-space-4); }
.sim-dom-root--portrait .af-spot { flex: none; width: 48px; height: 48px; }
.sim-dom-root--portrait .af-spot::before { display: none; }
.af-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--sim-space-2); }

@keyframes af-shake { 0%, 100% { transform: none; } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@keyframes af-pop { from { transform: scale(0.5); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes af-rise { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes af-jig { from { transform: translate(0, 0); } to { transform: translate(2px, -2px); } }
@keyframes af-glow { to { box-shadow: 0 0 30px 8px color-mix(in oklab, var(--sim-flame) 65%, transparent); } }
@media (prefers-reduced-motion: reduce) {
  .af-chip.is-no, .af-tag.is-yes, .af-tag.is-no, .af-cell.is-new, .af-win--melt .af-atom, .af-melt { animation: none; }
  .af-tool, .af-fire { transition: none; }
}
`;
