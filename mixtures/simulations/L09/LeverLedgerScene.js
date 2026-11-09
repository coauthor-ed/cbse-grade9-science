/**
 * LeverLedgerScene - blk-l09-s03, "Seven Mixtures, Seven Reasons". The book's Table 5.3, reason first.
 * For each of the seven mixtures the learner first says what is DIFFERENT about its two parts (a wrong
 * chip says why not), the method then fills in, and the learner runs it on a small bench. Only a run
 * fills the row.
 *
 *   beat 0  Table          the empty table: mixture | reason | method
 *   beat 1  Table          the same table, the reason column lit
 *   beat 2  Four mixtures  mud (settle, alum, pour off), blood, naphthalene and sand, oil and water
 *   beat 3  Three steps    chalk and salt: three steps in order; a wrong order names what went wrong
 *   beat 4  Last two       flower pigments (they do separate, in tiny amounts) and salt water
 *                          (two right answers: which part do you need?)
 *
 * Beats pick the tab; what the learner has done stays done. No frame loop: one-shot CSS only.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, burst } from 'simulations/base/kit/SimLookDom.js';
import { flowTabsHtml, flowStageHtml, flowDeckHtml, showFlowPanel, bindFlow } from 'simulations/base/kit/SimFlowDom.js';

/* ------------------------------------------------------------------ data */

/** The differences of s02, with "sublimes" as its own row. */
const PROPS = [
  { id: 'size', label: 'size' },
  { id: 'density', label: 'density' },
  { id: 'solub', label: 'solubility' },
  { id: 'bp', label: 'boiling point' },
  { id: 'sub', label: 'only one sublimes' },
  { id: 'mag', label: 'magnetism' },
  { id: 'paper', label: 'how far it travels on paper' },
];

/**
 * The seven rows of the book's Table 5.3. `ok`: the differences that part this row; `why`: why another chip does
 * not (default DEFAULT_WHY); `method`: what fills in once the reason is right.
 */
const ROWS = [
  { id: 'mud', tab: 'one', name: 'Mud from muddy water', ok: ['density'], reason: 'mud is denser; alum clumps the finest grains',
    method: 'settle, coagulate, pour off or filter', parts: [['--sim-water', 'clear water'], ['--sim-strata-3', 'mud at the bottom']],
    why: { size: 'Filter paper alone lets the finest grains through', solub: 'Mud does not dissolve, but that does not lift it out', bp: 'Boiling would leave the mud behind and lose the water' } },
  { id: 'blood', tab: 'one', name: 'Plasma from a blood sample', ok: ['density'], reason: 'blood cells are denser than plasma',
    method: 'centrifugation', parts: [['--sim-glucose', 'plasma on top'], ['--sim-error', 'cells at the bottom']], run: 'Spin the tube',
    why: { size: 'Blood cells pass through filter paper', solub: 'The cells do not dissolve, but that does not lift the plasma off' } },
  { id: 'naph', tab: 'one', name: 'Naphthalene and sand', ok: ['sub'], reason: 'naphthalene sublimes, sand does not',
    method: 'sublimation', parts: [['--sim-ice', 'crystals on the funnel'], ['--sim-strata-1', 'sand in the dish']], run: 'Warm the dish',
    why: { bp: 'Naphthalene goes straight from solid to vapour', size: 'The grains are much the same size', solub: 'Neither dissolves in water' } },
  { id: 'oil', tab: 'one', name: 'Oil from water', ok: ['density'], reason: 'they do not mix, and oil is less dense',
    method: 'separating funnel', parts: [['--sim-glucose', 'oil stays in'], ['--sim-water', 'water drained']], run: 'Open the stopcock',
    why: { solub: 'They do not dissolve in each other. Now, which one floats?', bp: 'You could boil off the water, but then you lose it' } },
  { id: 'chalk', tab: 'three', name: 'Chalk powder and common salt', ok: ['solub'], reason: 'salt dissolves, chalk does not',
    method: 'dissolve, filter, evaporate', run: '',
    why: { size: 'Both are fine white powders', density: 'Both sink in water, so density does not part them' } },
  { id: 'flower', tab: 'last', name: 'The pigments of a flower', ok: ['paper'], reason: 'each colour travels its own distance',
    method: 'paper chromatography', parts: [['--sim-series-2', 'colours apart'], ['--sim-series-4', 'tiny amounts']], run: 'Run the strip',
    why: { solub: 'They all dissolve in alcohol, so that does not part them', size: 'The pigments are dissolved: there are no grains to catch' } },
  { id: 'salt', tab: 'last', name: 'Common salt and water', ok: ['bp'], reason: 'water boils off, salt stays',
    method: 'evaporation or distillation', run: '',
    why: { solub: 'The salt is dissolved, so this alone does not take it out', size: 'Dissolved salt has no grains to catch' } },
];
const DEFAULT_WHY = 'That does not tell these two parts apart';
const MAG_WHY = 'Nothing in this row is magnetic';

const STEPS = [
  { id: 'water', label: 'Add water' },
  { id: 'filter', label: 'Filter' },
  { id: 'evap', label: 'Evaporate' },
];
/** What a wrong step does, named. */
const STEP_FAIL = {
  filter: 'A filter does nothing to a dry powder',
  evap: 'Heating a dry powder: still mixed',
  evapW: 'Evaporated too soon: salt back in the chalk',
};
/** Mud takes three taps: each one leaves the next problem in the jar. */
const MUD_STEPS = ['Let it stand', 'Add alum', 'Pour off the clear water'];
const MUD_SAY = ['', 'Heavy grains settled. Still cloudy', 'Clumps sink. The water clears', ''];

const TABS = [
  { key: 'ledger', label: 'Table' },
  { key: 'one', label: 'Four mixtures' },
  { key: 'three', label: 'Three steps' },
  { key: 'last', label: 'Last two' },
];
const BEAT_TAB = ['ledger', 'ledger', 'one', 'three', 'last'];
const MARK = { yes: '\u2713', no: '\u2717' };

/* ---------------------------------------------------------- the benches */

const glass = 'fill="color-mix(in oklab, var(--sim-glass) 12%, transparent)" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"';
const shadow = (cx, rx) => `<ellipse cx="${cx}" cy="146" rx="${rx}" ry="4" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>`;

/** Fixed grain positions (no random in paint): [x, y] in a 0..1 box. */
const GRAINS = [[0.1, 0.3], [0.25, 0.7], [0.4, 0.2], [0.55, 0.55], [0.7, 0.35], [0.85, 0.75], [0.15, 0.85], [0.6, 0.85],
  [0.35, 0.5], [0.8, 0.15], [0.48, 0.9], [0.92, 0.5], [0.05, 0.6], [0.3, 0.05], [0.68, 0.65], [0.2, 0.45]];

function grains(x0, y0, w, h, tone, r = 3.4, n = GRAINS.length, cls = '') {
  return GRAINS.slice(0, n).map(([u, v], i) =>
    `<circle class="${cls}" style="--i:${i}" cx="${(x0 + u * w).toFixed(1)}" cy="${(y0 + v * h).toFixed(1)}" r="${r}" fill="var(${tone})" stroke="var(--sim-stroke)" stroke-width="0.8"/>`).join('');
}

/** One bench drawing per row. `done` draws the end state; `fresh` plays the move into it once. */
function benchSvg(id, { done = false, fresh = false, step = 0, want = null } = {}) {
  const f = fresh ? ' is-fresh' : '';
  let art = '';
  if (id === 'mud') {
    // step 0 cloudy | 1 stood: a layer, still cloudy | 2 alum: clumps on the floor, clear | 3 poured off
    const cloudy = step < 2 ? (step ? 34 : 52) : 0;
    const water = `color-mix(in oklab, var(--sim-strata-3) ${cloudy}%, color-mix(in oklab, var(--sim-water) 42%, transparent))`;
    art = shadow(100, 52)
      + `<path d="M58 ${step === 3 ? 100 : 54} V132 a8 8 0 0 0 8 8 H134 a8 8 0 0 0 8 -8 V${step === 3 ? 100 : 54} Z" fill="${water}" class="ll-fade${f}"/>`
      + `<g class="${step ? `ll-sink${f}` : ''}">${step ? grains(62, 124, 76, 12, '--sim-strata-3', step > 1 ? 4.6 : 3.6) : grains(62, 60, 76, 74, '--sim-strata-3', 3)}</g>`
      + `<path d="M52 30 h6 V132 a8 8 0 0 0 8 8 H134 a8 8 0 0 0 8 -8 V30 h6" fill="none" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>`;
  } else if (id === 'blood') {
    const tube = (x) => `<g class="${fresh ? 'll-spin' : ''}" style="transform-origin: 100px 84px">`
      + `<rect x="${x}" y="22" width="26" height="110" rx="13" ${glass}/>`
      + (done
        ? `<rect x="${x + 3}" y="44" width="20" height="44" fill="color-mix(in oklab, var(--sim-glucose) 55%, transparent)"/>`
          + `<path d="M${x + 3} 88 h20 v32 a10 10 0 0 1 -20 0 Z" fill="var(--sim-error)"/>`
        : `<path d="M${x + 3} 44 h20 v76 a10 10 0 0 1 -20 0 Z" fill="color-mix(in oklab, var(--sim-error) 80%, var(--sim-glucose))"/>`)
      + '</g>';
    art = shadow(100, 40) + `<rect x="46" y="126" width="108" height="16" rx="6" fill="var(--sim-surface-raised)" stroke="var(--sim-stroke)" stroke-width="2"/>`
      + tube(87) + (done ? '<path d="M120 50 h22 M120 104 h22" stroke="var(--sim-label-muted)" stroke-width="2"/>' : '');
  } else if (id === 'naph') {
    art = shadow(100, 62)
      + `<path d="M40 120 q60 34 120 0 Z" fill="var(--sim-surface-raised)" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>`
      + grains(56, 112, 88, 10, '--sim-strata-1', 3.4, 12)
      + (done ? '' : grains(60, 108, 80, 10, '--sim-ice', 3, 8))
      + `<path d="M52 112 L92 44 V18 h16 V44 L148 112" fill="color-mix(in oklab, var(--sim-glass) 10%, transparent)" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>`
      + (done ? `<g class="ll-pop${f}">${[[66, 92], [74, 78], [82, 64], [118, 64], [126, 78], [134, 92], [96, 50], [104, 50]].map(([x, y]) =>
        `<path d="M${x} ${y - 5} l4 5 -4 5 -4 -5 Z" fill="var(--sim-ice)" stroke="var(--sim-stroke)" stroke-width="1"/>`).join('')}</g>` : '')
      + (fresh ? '<g class="ll-vapour"><path d="M86 104 q-6 -14 2 -26 M100 104 q6 -16 -2 -30 M114 104 q-6 -14 2 -26" fill="none" stroke="var(--sim-label-muted)" stroke-width="3" stroke-linecap="round"/></g>' : '')
      + '<path d="M60 138 h80" stroke="var(--sim-flame)" stroke-width="4" stroke-linecap="round" opacity="0.8"/>';
  } else if (id === 'oil') {
    const lower = done ? 0 : 1;
    art = shadow(100, 46)
      + `<path d="M70 26 h60 l-10 50 -12 14 V104 h-16 V90 l-12 -14 Z" fill="none" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>`
      + `<path d="M${done ? 76 : 72} ${done ? 56 : 32} h${done ? 48 : 56} l${done ? -6 : -3} ${done ? 22 : 18} H${done ? 82 : 75} Z" fill="color-mix(in oklab, var(--sim-glucose) 60%, transparent)" class="ll-drop${f}"/>`
      + (lower ? '<path d="M75 50 h50 l-5 26 -12 14 V100 h-16 V90 l-12 -14 Z" fill="color-mix(in oklab, var(--sim-water) 55%, transparent)"/>' : '')
      + '<rect x="90" y="100" width="20" height="8" rx="2" fill="var(--sim-label-muted)"/>'
      + `<path d="M68 112 h64 v24 a6 6 0 0 1 -6 6 H74 a6 6 0 0 1 -6 -6 Z" fill="none" stroke="var(--sim-stroke)" stroke-width="3"/>`
      + (done ? `<path d="M71 122 h58 v14 a4 4 0 0 1 -4 4 H75 a4 4 0 0 1 -4 -4 Z" fill="color-mix(in oklab, var(--sim-water) 55%, transparent)" class="ll-fill${f}"/>` : '');
  } else if (id === 'flower') {
    art = shadow(100, 40) + `<rect x="66" y="18" width="68" height="122" rx="6" ${glass}/>`
      + '<path d="M70 120 h60 v14 a4 4 0 0 1 -4 4 H74 a4 4 0 0 1 -4 -4 Z" fill="color-mix(in oklab, var(--sim-series-2) 30%, transparent)"/>'
      + `<rect x="88" y="14" width="24" height="122" rx="2" fill="color-mix(in oklab, var(--sim-label) 10%, var(--sim-bg-surface))" stroke="var(--sim-stroke)" stroke-width="2"/>`
      + '<path d="M90 112 h20" stroke="var(--sim-label-muted)" stroke-width="2"/>'
      + (done
        ? `<g class="ll-climb${f}"><ellipse cx="100" cy="92" rx="8" ry="4" fill="var(--sim-series-4)"/><ellipse cx="100" cy="66" rx="8" ry="4" fill="var(--sim-series-5)"/><ellipse cx="100" cy="40" rx="8" ry="4" fill="var(--sim-series-2)"/></g>`
        : '<circle cx="100" cy="112" r="6" fill="var(--sim-series-4)"/>');
  } else if (id === 'salt') {
    if (want === 'water') {
      art = shadow(100, 80) + '<circle cx="44" cy="104" r="26" ' + glass + '/>'
        + '<path d="M26 112 a26 26 0 0 0 36 0 Z" fill="color-mix(in oklab, var(--sim-water) 50%, transparent)"/>'
        + '<path d="M58 86 L150 106" stroke="var(--sim-stroke)" stroke-width="10" stroke-linecap="round"/><path d="M58 86 L150 106" stroke="color-mix(in oklab, var(--sim-water) 40%, var(--sim-bg-cell))" stroke-width="5" stroke-linecap="round"/>'
        + `<path d="M140 112 h36 v24 a4 4 0 0 1 -4 4 h-28 a4 4 0 0 1 -4 -4 Z" fill="none" stroke="var(--sim-stroke)" stroke-width="3"/>`
        + `<path d="M143 124 h30 v12 a3 3 0 0 1 -3 3 h-24 a3 3 0 0 1 -3 -3 Z" fill="color-mix(in oklab, var(--sim-water) 55%, transparent)" class="ll-fill is-fresh"/>`
        + '<path d="M30 140 h28" stroke="var(--sim-flame)" stroke-width="4" stroke-linecap="round"/>';
    } else {
      const dry = want === 'salt';
      art = shadow(100, 62)
        + `<path d="M40 104 q60 40 120 0 Z" fill="var(--sim-surface-raised)" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>`
        + (dry ? `<g class="ll-pop is-fresh">${grains(62, 106, 76, 8, '--sim-ice', 3, 10)}</g>`
          : '<path d="M48 108 q52 28 104 0 Z" fill="color-mix(in oklab, var(--sim-water) 50%, transparent)"/>')
        + (dry ? '<g class="ll-vapour"><path d="M84 96 q-6 -14 2 -26 M100 96 q6 -16 -2 -30 M116 96 q-6 -14 2 -26" fill="none" stroke="var(--sim-label-muted)" stroke-width="3" stroke-linecap="round"/></g>' : '')
        + '<path d="M60 138 h80" stroke="var(--sim-flame)" stroke-width="4" stroke-linecap="round" opacity="0.8"/>';
    }
  } else if (id === 'chalk') {
    // step 0 dry mix | 1 water added | 2 filtered | 3 evaporated
    const salt = '--sim-ice';
    const chalk = '--sim-ice';
    if (step === 0) {
      art = shadow(100, 46) + `<path d="M58 70 V132 a8 8 0 0 0 8 8 H134 a8 8 0 0 0 8 -8 V70" fill="none" stroke="var(--sim-stroke)" stroke-width="3"/>`
        + grains(62, 124, 76, 12, chalk, 3.4, 10) + grains(66, 126, 70, 10, salt, 2.6, 8);
    } else if (step === 1) {
      art = shadow(100, 46) + `<path d="M58 70 V132 a8 8 0 0 0 8 8 H134 a8 8 0 0 0 8 -8 V70" fill="none" stroke="var(--sim-stroke)" stroke-width="3"/>`
        + `<path d="M61 82 V132 a6 6 0 0 0 6 6 H133 a6 6 0 0 0 6 -6 V82 Z" fill="color-mix(in oklab, var(--sim-water) 45%, transparent)" class="ll-fill${f}"/>`
        + `<g class="ll-sink${f}">${grains(62, 90, 76, 46, chalk, 3.4, 14)}</g>`;
    } else {
      art = shadow(100, 56) + '<path d="M60 22 h80 l-34 40 v14 h-12 v-14 Z" fill="none" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>'
        + `<path d="M66 26 h68 l-30 34 h-8 Z" fill="color-mix(in oklab, var(--sim-label) 14%, var(--sim-bg-surface))"/>`
        + grains(78, 28, 44, 14, chalk, 3.4, 12)
        + (step === 2
          ? `<path d="M64 96 V132 a8 8 0 0 0 8 8 H128 a8 8 0 0 0 8 -8 V96" fill="none" stroke="var(--sim-stroke)" stroke-width="3"/>`
            + `<path d="M67 110 V132 a6 6 0 0 0 6 6 H127 a6 6 0 0 0 6 -6 V110 Z" fill="color-mix(in oklab, var(--sim-water) 45%, transparent)" class="ll-fill${f}"/>`
          : `<path d="M50 118 q50 34 100 0 Z" fill="var(--sim-surface-raised)" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>`
            + `<g class="ll-pop${f}">${grains(66, 120, 68, 8, salt, 3, 10)}</g>`
            + '<path d="M66 144 h68" stroke="var(--sim-flame)" stroke-width="4" stroke-linecap="round" opacity="0.8"/>');
    }
  }
  return `<svg class="ll-bench" viewBox="0 0 200 150" aria-hidden="true">${art}</svg>`;
}

/* ------------------------------------------------------------- the scene */

export class LeverLedgerScene extends DomSimulation {
  static WIDTH = 680;
  static HEIGHT = 512;   // sim-layout --interact 40: 504px
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 900;
  static BEAT_STEP_MAP = [0, 1, 2, 3, 4].map((i) => [{ idx: i, dwellMs: null }]);
  static ARIA_LABEL =
    'A table of seven mixtures, with a reason column and a method column. For each mixture, pick what is '
    + 'different about its two parts. The method then fills in, and you run it on a small bench to see the parts '
    + 'come apart. Chalk and salt needs three steps in the right order, and salt water has two right answers.';
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this._tab = 'ledger';
    this._lit = false;
    this._mud = 0;
    this._sel = { one: 'mud', last: 'flower' };
    // per row: { prop, miss, ran, fresh, order: [], fail, want }
    this._row = Object.fromEntries(ROWS.map((r) => [r.id, { prop: null, miss: null, ran: false, fresh: false, order: [], fail: null, want: null, wants: [] }]));
    this._celebrated = false;
  }

  async setup() {
    await super.setup();
    this.render({ css: CSS, rootClass: 'll-root', html: this._frameHtml() });
    bindFlow(this.root, {
      tab: (key) => this._go(key),
      action: (name, value) => this._act(name, value),
    });
    // A full-width slide has no theatre to catch a swipe: on the table it must not turn the beat.
    this.root.addEventListener('touchend', (e) => e.stopPropagation());
  }

  onStep(step) {
    this._lit = step === 1;
    this._go(BEAT_TAB[step] ?? 'ledger');
  }

  _go(key) {
    if (!TABS.some((t) => t.key === key)) return;
    this._tab = key;
    if (key === 'ledger') this._paint('ledger');
    showFlowPanel(this.root, key);
  }

  _cur() {
    if (this._tab === 'three') return ROWS.find((r) => r.id === 'chalk');
    return ROWS.find((r) => r.id === this._sel[this._tab]);
  }

  _act(name, value) {
    if (name === 'open') {
      const r = ROWS.find((x) => x.id === value);
      if (!r) return undefined;
      if (r.tab !== 'three') this._sel[r.tab] = r.id;
      this._paint(r.tab);
      return this._go(r.tab);
    }
    if (name === 'row') {
      const r = ROWS.find((x) => x.id === value);
      if (!r || r.tab !== this._tab) return undefined;
      this._sel[r.tab] = r.id;
      return this._paint(this._tab);
    }
    const r = this._cur();
    if (!r) return undefined;
    const s = this._row[r.id];
    if (name === 'prop') {
      if (s.prop) return undefined;
      if (r.ok.includes(value)) { s.prop = value; s.miss = null; } else s.miss = value;
      return this._paint(this._tab);
    }
    if (!s.prop) return undefined;
    if (name === 'run' && !s.ran && r.id === 'mud') {
      this._mud += 1;
      s.fresh = true;
      if (this._mud === MUD_STEPS.length) { s.ran = true; return this._rowComplete(r); }
      return this._paint(this._tab);
    }
    if (name === 'run' && !s.ran) {
      s.ran = true;
      s.fresh = true;
      return this._rowComplete(r);
    }
    if (name === 'step' && r.id === 'chalk' && !s.ran) {
      s.fail = null;
      const want = STEPS[s.order.length]?.id;
      if (value === want) {
        s.order.push(value);
        s.fresh = true;
        if (s.order.length === STEPS.length) { s.ran = true; return this._rowComplete(r); }
      } else {
        // A wrong step plays out as a named failure, and the learner starts the order again.
        s.fail = value === 'evap' && s.order.length === 1 ? 'evapW' : value;
        s.order = [];
      }
      return this._paint('three');
    }
    if (name === 'want' && r.id === 'salt') {
      if (value !== 'salt' && value !== 'water') return undefined;
      s.want = value;
      if (!s.wants.includes(value)) s.wants.push(value);
      s.ran = true;
      s.fresh = true;
      return this._rowComplete(r);
    }
    return undefined;
  }

  _rowComplete(r) {
    this._paint(this._tab);
    // The find: the learner's own run fills the seventh row.
    if (!this._celebrated && ROWS.every((x) => this._row[x.id].ran)) {
      this._celebrated = true;
      burst(this.root.querySelector?.(`[data-pane="${this._tab}"]`) || this.root);
    }
    return undefined;
  }

  /* ---------------------------------------------------------------- paint */

  _frameHtml() {
    const stages = TABS.map((t) => flowStageHtml({ panel: t.key, cls: t.key === this._tab ? '' : 'is-off',
      body: `<div class="ll-pane" data-pane="${t.key}">${this._body(t.key)}</div>` }));
    return `<div class="sflow">${flowTabsHtml(TABS, this._tab, 'Table')}${flowDeckHtml(stages)}</div>`;
  }

  _paint(key) {
    const pane = this.root?.querySelector?.(`[data-pane="${key}"]`);
    if (pane) pane.innerHTML = this._body(key);
    if (key === 'ledger') pane?.classList?.toggle?.('is-lit', this._lit);
  }

  _body(key) {
    if (key === 'ledger') return this._ledgerHtml();
    if (key === 'three') return this._rowHtml(ROWS.find((r) => r.id === 'chalk'));
    const picks = ROWS.filter((r) => r.tab === key).map((r) => {
      const on = this._sel[key] === r.id;
      const done = this._row[r.id].ran;
      return `<button type="button" class="ll-rowpick${on ? ' is-on' : ''}${done ? ' is-done' : ''}" data-sflow-action="row" data-sflow-value="${r.id}" aria-pressed="${on}">`
        + `${done ? `<span class="ll-tick" aria-hidden="true">${MARK.yes}</span>` : ''}${esc(r.name)}</button>`;
    }).join('');
    return `<div class="ll-picks">${picks}</div>${this._rowHtml(ROWS.find((r) => r.id === this._sel[key]))}`;
  }

  _ledgerHtml() {
    const n = ROWS.filter((r) => this._row[r.id].ran).length;
    const rows = ROWS.map((r) => {
      const s = this._row[r.id];
      const reason = s.ran ? esc(r.reason) : '';
      let method = s.ran ? esc(r.method) : '';
      if (s.ran && r.id === 'salt') method = esc([s.wants.includes('salt') ? 'evaporate (salt)' : '', s.wants.includes('water') ? 'distil (water)' : ''].filter(Boolean).join(' or '));
      return `<tr><th scope="row"><button type="button" class="ll-open" data-sflow-action="open" data-sflow-value="${r.id}">${esc(r.name)}</button></th>`
        + `<td class="ll-c ll-c--reason${s.ran ? ' is-full' : ''}">${reason}</td><td class="ll-c${s.ran ? ' is-full' : ''}">${method}</td></tr>`;
    }).join('');
    return `<table class="ll-table${this._lit ? ' is-lit' : ''}"><thead><tr><th scope="col">Mixture</th><th scope="col" class="ll-h--reason">What is different</th>`
      + `<th scope="col">Method</th></tr></thead><tbody>${rows}</tbody></table>`
      + `<span class="ll-k">${n} of 7 done. Tap a mixture to open it.</span>`;
  }

  _rowHtml(r) {
    const s = this._row[r.id];
    const fresh = s.fresh;
    s.fresh = false;
    // the reason question
    const chips = PROPS.map((p) => {
      const right = s.prop === p.id;
      const miss = !s.prop && s.miss === p.id;
      const cls = right ? ' is-yes' : miss ? ' is-no' : '';
      const mark = right ? ` <span aria-hidden="true">${MARK.yes}</span>` : miss ? ` <span aria-hidden="true">${MARK.no}</span>` : '';
      return `<button type="button" class="ll-chip${cls}" data-sflow-action="prop" data-sflow-value="${p.id}" aria-pressed="${right}"${s.prop && !right ? ' disabled' : ''}>${esc(p.label)}${mark}</button>`;
    }).join('');
    const why = !s.prop && s.miss ? `<span class="ll-tag is-no">${esc(s.miss === 'mag' ? MAG_WHY : (r.why[s.miss] || DEFAULT_WHY))}</span>` : '';
    const ask = `<div class="ll-ask"><span class="ll-k">What is different about the two parts?</span><span class="ll-chips">${chips}</span>${why}</div>`;

    // the method and the bench
    let act = '';
    let res = '';
    let art;
    if (r.id === 'chalk') {
      const step = s.ran ? 3 : s.order.length;
      art = benchSvg('chalk', { step, fresh });
      const order = STEPS.map((st, i) => {
        const done = s.order.includes(st.id);
        return `<button type="button" class="ll-step${done ? ' is-done' : ''}" data-sflow-action="step" data-sflow-value="${st.id}"${!s.prop || s.ran || done ? ' disabled' : ''}>`
          + `<span class="ll-step__n">${done ? i + 1 : '?'}</span>${esc(st.label)}</button>`;
      }).join('');
      act = `<span class="ll-k">${s.prop ? 'Tap the steps in the order you would do them' : 'Pick the difference first'}</span><span class="ll-steps">${order}</span>`;
      if (s.fail) res = `<span class="ll-tag is-no">${MARK.no} ${esc(STEP_FAIL[s.fail])}. Start again.</span>`;
      if (s.ran) res = `<span class="ll-tag is-yes">${MARK.yes} Chalk on the paper, salt in the dish</span>`;
    } else if (r.id === 'salt') {
      art = benchSvg('salt', { want: s.want });
      const w = (v, l) => `<button type="button" class="ll-chip${s.want === v ? ' is-on' : ''}" data-sflow-action="want" data-sflow-value="${v}"${s.prop ? '' : ' disabled'}>${esc(l)}</button>`;
      act = `<span class="ll-k">${s.prop ? 'Which part do you need?' : 'Pick the difference first'}</span><span class="ll-chips">${w('salt', 'The salt')}${w('water', 'The water')}</span>`;
      if (s.want === 'salt') res = `<span class="ll-tag is-yes">${MARK.yes} Evaporation: salt back, the water is lost</span>`;
      if (s.want === 'water') res = `<span class="ll-tag is-yes">${MARK.yes} Distillation: water back, salt left in the flask</span>`;
    } else {
      art = benchSvg(r.id, { done: s.ran, fresh, step: this._mud });
      const go = r.id === 'mud' ? MUD_STEPS[this._mud] : r.run;
      act = s.prop
        ? `<span class="ll-method">Method: <b>${esc(r.method)}</b></span>`
          + (s.ran ? '' : `<button type="button" class="ll-go" data-sflow-action="run">${esc(go)}</button>`)
        : '<span class="ll-k">Pick the difference, and the method fills in</span>';
      if (r.id === 'mud' && !s.ran && MUD_SAY[this._mud]) res = `<span class="ll-tag">${esc(MUD_SAY[this._mud])}</span>`;
      if (s.ran) {
        res = r.id === 'flower'
          ? `<span class="ll-tag is-yes">${MARK.yes} Colours apart, in tiny amounts</span>`
          : `<span class="ll-tag is-yes">${MARK.yes} Row filled</span>`;
      }
    }
    const method = r.id === 'chalk' || r.id === 'salt'
      ? (s.prop ? `<span class="ll-method">Method: <b>${esc(r.method)}</b></span>` : '') : '';
    const parts = s.ran && r.parts
      ? `<span class="ll-parts">${r.parts.map(([t, l]) => `<span class="ll-part"><span class="ll-dot" style="--t:var(${t})"></span>${esc(l)}</span>`).join('')}</span>` : '';
    const all = ROWS.every((x) => this._row[x.id].ran) ? '<span class="ll-k">All seven done. Open the Table.</span>' : '';
    return `<div class="ll-row"><div class="ll-benchbox">${art}<span class="ll-name">${esc(r.name)}</span>${parts}</div>`
      + `<div class="ll-side">${ask}<div class="ll-act">${method}${act}<span class="ll-res" aria-live="polite">${res}${all}</span></div></div></div>`;
  }
}

const CSS = SIM_LOOK_DOM_CSS + `
.ll-root { padding: var(--sim-space-3);
  background: radial-gradient(110% 70% at 85% 0%, color-mix(in oklab, var(--sim-series-5) 10%, transparent), transparent 60%), var(--sim-bg-deep); }
.ll-root .sflow { gap: var(--sim-space-2); }
.ll-root .sflow-stage { padding: var(--sim-space-3); gap: var(--sim-space-2); }
.ll-pane { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.ll-k { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); text-align: center; }
.ll-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--sim-space-1); }
.ll-chip { display: inline-flex; align-items: center; gap: 5px; min-height: 36px; padding: 2px var(--sim-space-2);
  border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-pill); background: var(--sim-bg-surface); color: var(--sim-label);
  font: inherit; font-weight: 800; font-size: var(--sim-text-sm); cursor: pointer;
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); transition: transform 0.1s ease, box-shadow 0.1s ease; }
.ll-chip:active { transform: translateY(3px); box-shadow: none; }
.ll-chip:disabled { opacity: 0.35; cursor: default; transform: none; }
.ll-chip.is-on { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); }
.ll-chip.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); opacity: 1; }
.ll-chip.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 16%, var(--sim-bg-surface)); animation: ll-shake 0.36s ease; }
.ll-chip:focus-visible, .ll-go:focus-visible, .ll-step:focus-visible, .ll-rowpick:focus-visible, .ll-open:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.ll-tag { display: inline-flex; align-self: center; padding: 3px var(--sim-space-3); border-radius: var(--sim-radius-md); border: 2px solid var(--sim-stroke);
  background: var(--sim-bg-surface); font-weight: 800; font-size: var(--sim-text-sm); line-height: 1.3; color: var(--sim-label); text-align: center;
  animation: ll-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.ll-tag.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); }
.ll-tag.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface)); }

/* the ledger */
.ll-table { width: 100%; border-collapse: separate; border-spacing: 0 4px; }
.ll-table th, .ll-table td { font-size: var(--sim-text-sm); text-align: left; vertical-align: middle; }
.ll-table thead th { font-weight: 800; color: var(--sim-label-muted); padding: 0 var(--sim-space-2); }
.ll-table thead th.ll-h--reason { color: var(--sim-label); }
.ll-table.is-lit thead th.ll-h--reason { color: var(--sim-warning); }
.ll-table th[scope="row"] { width: 34%; }
.ll-open { width: 100%; min-height: 36px; padding: 2px var(--sim-space-2); border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-sm);
  background: var(--sim-bg-surface); color: var(--sim-label); font: inherit; font-weight: 800; font-size: var(--sim-text-sm); text-align: left; cursor: pointer; line-height: 1.2; }
.ll-c { height: 36px; padding: 2px var(--sim-space-2); border: 2px dashed color-mix(in oklab, var(--sim-stroke) 80%, transparent); border-left-width: 0;
  font-weight: 700; color: var(--sim-label); line-height: 1.3; }
.ll-c--reason { border-left-width: 2px; border-radius: var(--sim-radius-sm) 0 0 var(--sim-radius-sm); }
.ll-c:last-child { border-radius: 0 var(--sim-radius-sm) var(--sim-radius-sm) 0; }
.ll-c.is-full { border-style: solid; border-color: color-mix(in oklab, var(--sim-good) 60%, var(--sim-stroke)); background: color-mix(in oklab, var(--sim-good) 10%, var(--sim-bg-surface));
  animation: ll-pop 0.35s ease both; }
.ll-table.is-lit .ll-c--reason { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 12%, transparent); }
.sim-dom-root--portrait .ll-table th[scope="row"] { width: 30%; }
.sim-dom-root--portrait .ll-chip, .sim-dom-root--portrait .ll-go, .sim-dom-root--portrait .ll-step, .sim-dom-root--portrait .ll-rowpick, .ll-root.sim-dom-root--portrait .sflow-tab { min-height: 48px; }
.sim-dom-root--portrait .ll-chip { min-width: 48px; justify-content: center; }

/* a row's bench */
.ll-picks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--sim-space-1); }
.ll-picks:has(> :nth-child(2):last-child) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.sim-dom-root--portrait .ll-picks { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.ll-rowpick { display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 44px; padding: 2px var(--sim-space-1);
  border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-md); background: var(--sim-bg-surface); color: var(--sim-label);
  font: inherit; font-weight: 800; font-size: var(--sim-text-sm); line-height: 1.15; cursor: pointer; text-align: center;
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); }
.ll-rowpick.is-on { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 16%, var(--sim-bg-surface)); }
.ll-rowpick.is-done .ll-tick { color: var(--sim-good); font-weight: 900; }
.ll-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: var(--sim-space-3); align-items: start; }
.sim-dom-root--portrait .ll-row { grid-template-columns: minmax(0, 1fr); }
.ll-benchbox { position: relative; display: flex; flex-direction: column; align-items: center; gap: var(--sim-space-1); padding: var(--sim-space-2);
  border-radius: var(--sim-radius-md); background: var(--sim-bg-cell); border-bottom: 6px solid color-mix(in oklab, var(--sim-strata-2) 55%, var(--sim-stroke)); }
.ll-bench { display: block; width: 100%; max-width: 300px; height: auto; }
.ll-name { font-weight: 900; font-size: var(--sim-text-md); color: var(--sim-label); text-align: center; }
.ll-parts { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px var(--sim-space-2); animation: ll-pop 0.35s ease 0.6s both; }
.ll-part { display: inline-flex; align-items: center; gap: 5px; font-weight: 700; font-size: var(--sim-text-sm); color: var(--sim-label); }
.ll-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--t); border: 2px solid var(--sim-stroke); flex: none; }
.ll-side { display: flex; flex-direction: column; gap: var(--sim-space-2); min-width: 0; }
.ll-ask { display: flex; flex-direction: column; gap: var(--sim-space-1); }
.ll-act { display: flex; flex-direction: column; align-items: center; gap: var(--sim-space-1); padding-top: var(--sim-space-2);
  border-top: 2px dashed color-mix(in oklab, var(--sim-stroke) 80%, transparent); min-height: 110px; }
.ll-method { display: block; text-align: center; font-weight: 700; font-size: var(--sim-text-md); color: var(--sim-label); animation: ll-pop 0.35s ease both; }
.ll-res { display: flex; justify-content: center; min-height: 32px; }
.ll-go { min-height: 44px; padding: var(--sim-space-1) var(--sim-space-4); border: 2px solid var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke)));
  border-radius: var(--sim-radius-md); background: var(--primary-color, var(--sim-accent)); font: inherit; font-weight: 800; font-size: var(--sim-text-md); cursor: pointer;
  box-shadow: 0 4px 0 var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke))); }
.ll-root .ll-go { color: var(--on-primary, var(--sim-bg-deep)); }
.ll-go:active { transform: translateY(4px); box-shadow: none; }
.ll-steps { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--sim-space-2); }
.ll-step { display: inline-flex; align-items: center; gap: var(--sim-space-1); min-height: 40px; padding: 2px var(--sim-space-3) 2px 4px;
  border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-pill); background: var(--sim-bg-surface); color: var(--sim-label);
  font: inherit; font-weight: 800; font-size: var(--sim-text-sm); cursor: pointer; box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); }
.ll-step:disabled { cursor: default; opacity: 0.45; }
.ll-step.is-done { opacity: 1; border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); }
.ll-step__n { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--sim-track); font-weight: 900; }
.ll-step.is-done .ll-step__n { background: var(--sim-good); color: var(--sim-bg-deep); }

/* one-shot bench moves */
.ll-bench .is-fresh, .ll-bench .ll-spin, .ll-bench .ll-vapour { transform-box: fill-box; }
.ll-sink.is-fresh circle { animation: ll-sinkdot 0.8s cubic-bezier(0.5, 0, 0.7, 1) both; animation-delay: calc(var(--i) * 30ms); }
.ll-fade.is-fresh { animation: ll-clear 1.2s ease both; }
.ll-spin { animation: ll-spin 0.9s cubic-bezier(0.4, 0, 0.3, 1) both; }
.ll-pop.is-fresh { animation: ll-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both; transform-origin: 50% 50%; }
.ll-vapour { animation: ll-up 1.2s ease-out both; }
.ll-drop.is-fresh { animation: ll-down 0.8s ease both; }
.ll-fill.is-fresh { animation: ll-rise 0.7s ease both; transform-origin: 50% 100%; }
.ll-climb.is-fresh { animation: ll-rise 1s cubic-bezier(0.2, 0.8, 0.3, 1) both; transform-origin: 50% 100%; }

@keyframes ll-shake { 0%, 100% { transform: none; } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@keyframes ll-pop { from { transform: scale(0.6); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes ll-sinkdot { from { transform: translateY(-48px); } to { transform: none; } }
@keyframes ll-clear { from { opacity: 0.3; } to { opacity: 1; } }
@keyframes ll-spin { from { transform: rotate(0deg); } to { transform: rotate(720deg); } }
@keyframes ll-up { from { transform: translateY(16px); opacity: 0; } 50% { opacity: 1; } to { transform: translateY(-14px); opacity: 0; } }
@keyframes ll-down { from { transform: translateY(-24px); } to { transform: none; } }
@keyframes ll-rise { from { transform: scaleY(0); } to { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .ll-chip.is-no, .ll-tag, .ll-c.is-full, .ll-method, .ll-sink.is-fresh circle, .ll-fade.is-fresh, .ll-spin, .ll-pop.is-fresh, .ll-vapour,
  .ll-drop.is-fresh, .ll-fill.is-fresh, .ll-climb.is-fresh { animation: none; }
}
`;
