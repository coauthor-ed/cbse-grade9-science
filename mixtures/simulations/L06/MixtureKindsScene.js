/**
 * MixtureKindsScene - blk-l06-s04, mixtures with a gas and mixtures of solids. Three tabs, one per beat, each a small
 * bench with one guess and one action:
 *   b0 Gases          two gases behind a divider. Guess layers or mix, lift the divider, the dots spread evenly.
 *   b1 Smoke and fog  five samples. Look closer at each, then sort it: homogeneous or heterogeneous.
 *   b2 Magnet         iron nails in sawdust. Guess what comes up, then lower the magnet.
 * Beats pick the tab; what the learner has done stays done. No frame loop: CSS transitions only.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, burst } from 'simulations/base/kit/SimLookDom.js';
import { flowTabsHtml, flowStageHtml, flowDeckHtml, showFlowPanel, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { rng } from 'simulations/base/kit/shuffle.js';

const TABS = [
  { key: 'gas', label: 'Gases' },
  { key: 'sort', label: 'Smoke and fog' },
  { key: 'mag', label: 'Magnet' },
];
const MAP = TABS.map((_, i) => [{ idx: i, dwellMs: null }]);
const MARK = { yes: '\u2713', no: '\u2717' };

/** The five samples to sort. `same`: homogeneous; `bits`: what the lens shows. */
const SAMPLES = [
  { id: 'air', name: 'Air', same: true, bits: null, why: 'Up close, air is only gas particles, spread evenly' },
  { id: 'rocket', name: 'Hydrogen and oxygen', same: true, bits: null, why: 'Two gases mixed evenly: no bits in it at all' },
  { id: 'smoke', name: 'Smoke', same: false, bits: '--sim-waste', why: 'Up close: solid particles, not spread evenly' },
  { id: 'fog', name: 'Fog', same: false, bits: '--sim-ice', why: 'Up close: tiny water droplets, not spread evenly' },
  { id: 'dust', name: 'Dust in air', same: false, bits: '--sim-strata-2', why: 'Up close: solid specks, not spread evenly' },
];

/** A box of dots; `mixed` spreads both kinds through it, otherwise kind A left and B right. */
function gasSvg(mixed, divider) {
  const r = rng(11);
  let dots = '';
  for (let i = 0; i < 44; i++) {
    const a = i % 2 === 0;
    const lx = 14 + r() * 116;
    const ly = 14 + r() * 112;
    const x = mixed ? 14 + r() * 252 : (a ? lx : 150 + lx * 0.98);
    const y = mixed ? 14 + r() * 112 : ly;
    if (!mixed) r();
    dots += `<circle class="mk-gasdot" style="--i:${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${a ? 5 : 7}" fill="var(${a ? '--sim-series-1' : '--sim-series-6'})" stroke="var(--sim-stroke)" stroke-width="1.5"/>`;
  }
  const wall = divider ? '<rect x="136" y="4" width="8" height="132" rx="3" fill="var(--sim-label-muted)" stroke="var(--sim-stroke)" stroke-width="2"/>' : '';
  return `<svg class="mk-box" viewBox="0 0 280 140" role="img" aria-label="${mixed ? 'Both gases spread evenly through the box' : 'Hydrogen on the left, oxygen on the right of a divider'}">`
    + `<rect x="2" y="2" width="276" height="136" rx="12" fill="color-mix(in oklab, var(--sim-glass) 10%, var(--sim-bg-cell))" stroke="var(--sim-stroke)" stroke-width="3"/>${dots}${wall}</svg>`;
}

/** A lens view of a sample: background gas dots, and clumps of its specks if it has any. */
function lensSvg(s) {
  const r = rng(s.id.length * 17);
  let dots = '';
  for (let i = 0; i < 26; i++) dots += `<circle cx="${(12 + r() * 76).toFixed(1)}" cy="${(12 + r() * 76).toFixed(1)}" r="2.4" fill="color-mix(in oklab, var(--sim-series-1) 70%, var(--sim-bg-surface))"/>`;
  if (s.bits) {
    for (let i = 0; i < 9; i++) {
      const x = 22 + (i % 3) * 9 + r() * 4;
      const y = 26 + Math.floor(i / 3) * 9 + r() * 4;
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="var(${s.bits})" stroke="var(--sim-stroke)" stroke-width="1.2"/>`;
    }
  }
  return `<svg class="mk-lens" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="var(--sim-bg-cell)"/>${dots}`
    + '<circle cx="50" cy="50" r="46" fill="none" stroke="var(--sim-stroke)" stroke-width="4"/></svg>';
}

function jarSvg(s) {
  const fill = s.bits ? `color-mix(in oklab, var(${s.bits}) 35%, var(--sim-bg-cell))` : 'color-mix(in oklab, var(--sim-glass) 10%, var(--sim-bg-cell))';
  return `<svg class="mk-jar" viewBox="0 0 60 64" aria-hidden="true"><rect x="16" y="2" width="28" height="8" rx="2" fill="var(--sim-label-muted)"/>`
    + `<rect x="8" y="10" width="44" height="50" rx="9" fill="${fill}" stroke="var(--sim-stroke)" stroke-width="2.5"/></svg>`;
}

/** The nail tray; `lifted` raises the nails up to the magnet. */
function traySvg(state) {
  const lifted = state === 'lifted';
  const r = rng(5);
  let dust = '';
  for (let i = 0; i < 70; i++) dust += `<circle cx="${(30 + r() * 220).toFixed(1)}" cy="${(112 + r() * 18).toFixed(1)}" r="2.2" fill="var(--sim-strata-1)"/>`;
  let nails = '';
  for (let i = 0; i < 7; i++) {
    const x = 50 + i * 30;
    const y = lifted ? 46 : 116;
    const rot = lifted ? 90 : (i % 2 ? 12 : -14);
    nails += `<g class="mk-nail" style="--i:${i}" transform="translate(${x} ${y}) rotate(${rot})"><rect x="-14" y="-2.5" width="28" height="5" rx="1.5" fill="var(--sim-waste)" stroke="var(--sim-stroke)" stroke-width="1.5"/>`
      + '<rect x="-16" y="-5" width="4" height="10" rx="1" fill="var(--sim-waste)" stroke="var(--sim-stroke)" stroke-width="1.5"/></g>';
  }
  const mag = state === 'idle' ? 2 : 14;
  const magnet = `<g class="mk-magnet" transform="translate(0 ${mag})"><rect x="40" y="8" width="200" height="22" rx="6" fill="var(--sim-error)" stroke="var(--sim-stroke)" stroke-width="2.5"/>`
    + '<rect x="40" y="8" width="60" height="22" rx="6" fill="var(--sim-series-1)" stroke="var(--sim-stroke)" stroke-width="2.5"/><path d="M140 0 v8" stroke="var(--sim-stroke)" stroke-width="3"/></g>';
  return `<svg class="mk-box" viewBox="0 0 280 146" role="img" aria-label="${lifted ? 'The magnet has lifted the nails; the sawdust stayed in the tray' : 'Iron nails mixed into sawdust in a tray, a magnet above'}">`
    + `${magnet}<path d="M20 104 h240 l-10 34 H30 Z" fill="color-mix(in oklab, var(--sim-strata-2) 35%, var(--sim-bg-cell))" stroke="var(--sim-stroke)" stroke-width="2.5" stroke-linejoin="round"/>${dust}${nails}</svg>`;
}

export class MixtureKindsScene extends DomSimulation {
  static WIDTH = 680;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 970;
  static BEAT_STEP_MAP = MAP;
  static ARIA_LABEL =
    'Three small benches: two gases behind a divider, five samples to look at closely and sort as homogeneous or heterogeneous, '
    + 'and a magnet over nails in sawdust.';
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this._tab = 'gas';
    this._gas = { guess: null, open: false };
    this._sort = { looked: {}, posted: {}, miss: null };
    this._mag = { guess: null, state: 'idle' };
    this._celebrated = {};
  }

  async setup() {
    await super.setup();
    this.render({ css: CSS, rootClass: 'mk-root', html: this._frameHtml() });
    bindFlow(this.root, { tab: (key) => this._go(key), action: (name, value) => this._act(name, value) });
  }

  onStep(step) { this._go(TABS[step]?.key ?? 'gas'); }

  _go(key) {
    if (!TABS.some((t) => t.key === key)) return;
    this._tab = key;
    showFlowPanel(this.root, key);
  }

  _act(name, value) {
    const G = this._gas;
    const S = this._sort;
    const M = this._mag;
    if (name === 'gguess') { if (!G.guess) G.guess = value; return this._paint('gas'); }
    if (name === 'lift') { if (G.guess) G.open = true; this._paint('gas'); return this._cheer('gas', G.guess === 'mix' && G.open); }
    if (name === 'look') { S.looked[value] = true; S.miss = null; return this._paint('sort'); }
    if (name === 'post') {
      const [id, v] = String(value).split(':');
      const s = SAMPLES.find((x) => x.id === id);
      if (!s || !S.looked[id] || S.posted[id]) return undefined;
      if ((v === 'same') === s.same) { S.posted[id] = v; S.miss = null; } else S.miss = id;
      this._paint('sort');
      return this._cheer('sort', SAMPLES.every((x) => S.posted[x.id]));
    }
    if (name === 'mguess') { if (!M.guess) M.guess = value; return this._paint('mag'); }
    if (name === 'lower') {
      if (!M.guess || M.state !== 'idle') return undefined;
      M.state = 'lifted';
      this._paint('mag');
      return this._cheer('mag', M.guess === 'nails');
    }
    return undefined;
  }

  _cheer(key, ok) {
    if (!ok || this._celebrated[key]) return undefined;
    this._celebrated[key] = true;
    burst(this.root.querySelector?.(`[data-pane="${key}"] .mk-hero`) || this.root);
    return undefined;
  }

  _frameHtml() {
    const stages = TABS.map((t) => flowStageHtml({ panel: t.key, cls: t.key === this._tab ? '' : 'is-off',
      body: `<div class="mk-pane" data-pane="${t.key}">${this._body(t.key)}</div>` }));
    return `<div class="sflow">${flowTabsHtml(TABS, this._tab, 'Benches')}${flowDeckHtml(stages)}</div>`;
  }

  _paint(key) {
    const pane = this.root?.querySelector?.(`[data-pane="${key}"]`);
    if (pane) pane.innerHTML = this._body(key);
  }

  _body(key) {
    if (key === 'gas') return this._gasHtml();
    if (key === 'sort') return this._sortHtml();
    return this._magHtml();
  }

  /** A guess row: marked right or wrong once `shown`. */
  _ask(q, action, opts, guess, right, shown) {
    const chips = opts.map(([v, l]) => {
      const mine = guess === v;
      const cls = shown && mine ? (v === right ? ' is-yes' : ' is-no') : mine ? ' is-on' : '';
      const mark = shown && mine ? ` <span aria-hidden="true">${v === right ? MARK.yes : MARK.no}</span>` : '';
      return `<button type="button" class="mk-chip${cls}" data-sflow-action="${action}" data-sflow-value="${v}"${guess ? ' disabled' : ''}>${esc(l)}${mark}</button>`;
    }).join('');
    return `<div class="mk-ask"><span class="mk-k">${esc(q)}</span><span class="mk-chips">${chips}</span></div>`;
  }

  _result(ok, text, slip) {
    return `<span class="mk-tag ${ok ? 'is-yes' : 'is-no'}">${ok ? MARK.yes : MARK.no} ${esc(ok ? text : slip)}</span>`;
  }

  _gasHtml() {
    const G = this._gas;
    const ask = this._ask('Lift the divider. The two gases will', 'gguess', [['layer', 'stay in two layers'], ['mix', 'mix evenly']], G.guess, 'mix', G.open);
    const act = G.open ? this._result(G.guess === 'mix', 'They mixed evenly: homogeneous', 'They mixed evenly: gas particles move in all directions')
      : `<button type="button" class="mk-go" data-sflow-action="lift"${G.guess ? '' : ' disabled'}>Lift the divider</button>`;
    const legend = '<span class="mk-legend"><span class="mk-key" style="--t:var(--sim-series-1)">hydrogen</span><span class="mk-key" style="--t:var(--sim-series-6)">oxygen</span></span>';
    return `${ask}<div class="mk-hero${G.open ? ' is-open' : ''}">${gasSvg(G.open, !G.open)}${legend}</div><div class="mk-act">${act}</div>`;
  }

  _sortHtml() {
    const S = this._sort;
    const card = (s) => {
      const looked = S.looked[s.id];
      const posted = S.posted[s.id];
      const miss = S.miss === s.id;
      let foot;
      if (posted) foot = `<span class="mk-pin">${MARK.yes} sorted</span>`;
      else if (!looked) foot = `<button type="button" class="mk-chip" data-sflow-action="look" data-sflow-value="${s.id}">Look closer</button>`;
      else {
        foot = `<span class="mk-chips"><button type="button" class="mk-chip mk-chip--sm" data-sflow-action="post" data-sflow-value="${s.id}:same">Even</button>`
          + `<button type="button" class="mk-chip mk-chip--sm" data-sflow-action="post" data-sflow-value="${s.id}:not">Not even</button></span>`;
      }
      return `<div class="mk-card${miss ? ' is-miss' : ''}"><span class="mk-card__pic">${looked ? lensSvg(s) : jarSvg(s)}</span>`
        + `<span class="mk-card__n">${esc(s.name)}</span>${foot}</div>`;
    };
    const left = SAMPLES.filter((s) => !S.posted[s.id]);
    const col = (v, title) => `<div class="mk-col mk-hero"><span class="mk-col__t">${esc(title)}</span><span class="mk-col__list">${SAMPLES.filter((s) => S.posted[s.id] === v)
      .map((s) => `<span class="mk-posted">${esc(s.name)}</span>`).join('') || '<span class="mk-k">nothing yet</span>'}</span></div>`;
    const miss = S.miss ? `<span class="mk-tag is-no">${MARK.no} ${esc(SAMPLES.find((s) => s.id === S.miss).why)}</span>` : '';
    return `<div class="mk-banner">${col('same', 'Homogeneous: even')}${col('not', 'Heterogeneous: not even')}</div>`
      + `<div class="mk-cards">${left.map(card).join('') || '<span class="mk-tag is-yes">All five sorted</span>'}</div><div class="mk-act">${miss}</div>`;
  }

  _magHtml() {
    const M = this._mag;
    const done = M.state === 'lifted';
    const ask = this._ask('Lower a magnet over the tray. What comes up?', 'mguess',
      [['nails', 'only the nails'], ['both', 'nails and sawdust'], ['none', 'nothing']], M.guess, 'nails', done);
    const act = done ? this._result(M.guess === 'nails', 'Only the iron: sawdust is not pulled by a magnet', 'Only the nails came up: only iron is pulled by a magnet')
      : `<button type="button" class="mk-go" data-sflow-action="lower"${M.guess ? '' : ' disabled'}>Lower the magnet</button>`;
    return `${ask}<div class="mk-hero mk-hero--${M.state}">${traySvg(M.state)}</div><div class="mk-act">${act}</div>`;
  }
}

const CSS = SIM_LOOK_DOM_CSS + `
.mk-root { padding: var(--sim-space-3);
  background: radial-gradient(110% 70% at 50% 0%, color-mix(in oklab, var(--sim-series-1) 10%, transparent), transparent 60%), var(--sim-bg-deep); }
.mk-root .sflow { gap: var(--sim-space-2); }
.mk-root .sflow-stage { padding: var(--sim-space-3); gap: var(--sim-space-2); }
.mk-pane { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.mk-k { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); text-align: center; }
.mk-ask { display: flex; flex-direction: column; align-items: center; gap: var(--sim-space-1); }
.mk-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--sim-space-1); }
.mk-chip { display: inline-flex; align-items: center; gap: 5px; min-height: 44px; padding: 2px var(--sim-space-3); border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-pill);
  background: var(--sim-bg-surface); color: var(--sim-label); font: inherit; font-weight: 800; font-size: var(--sim-text-sm); cursor: pointer;
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); }
.mk-chip--sm { min-height: 44px; padding: 2px var(--sim-space-2); }
.mk-chip:disabled { opacity: 0.4; cursor: default; }
.mk-chip.is-on { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); opacity: 1; }
.mk-chip.is-yes { opacity: 1; border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); }
.mk-chip.is-no { opacity: 1; border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 16%, var(--sim-bg-surface)); }
.mk-go, .mk-quiet { min-height: 44px; padding: 2px var(--sim-space-4); border-radius: var(--sim-radius-md); font: inherit; font-weight: 800; font-size: var(--sim-text-md); cursor: pointer; }
.mk-go { border: 2px solid var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke))); background: var(--primary-color, var(--sim-accent));
  box-shadow: 0 4px 0 var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke))); }
.mk-root .mk-go { color: var(--on-primary, var(--sim-bg-deep)); }
.mk-quiet { border: 2px solid var(--sim-stroke); background: var(--sim-bg-surface); color: var(--sim-label); box-shadow: 0 4px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); }
.mk-go:active, .mk-quiet:active { transform: translateY(4px); box-shadow: none; }
.mk-go:disabled { opacity: 0.4; cursor: default; transform: none; box-shadow: none; }
.mk-chip:focus-visible, .mk-go:focus-visible, .mk-quiet:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.mk-act { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--sim-space-2); min-height: 48px; }
.mk-tag { padding: 3px var(--sim-space-3); border-radius: var(--sim-radius-md); border: 2px solid var(--sim-stroke); font-weight: 800; font-size: var(--sim-text-sm); line-height: 1.3;
  color: var(--sim-label); text-align: center; animation: mk-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both; }
.mk-tag.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); }
.mk-tag.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface)); }
.mk-hero { position: relative; display: flex; flex-direction: column; align-items: center; gap: var(--sim-space-1); padding: var(--sim-space-2); border-radius: var(--sim-radius-md);
  background: var(--sim-bg-cell); border-bottom: 6px solid color-mix(in oklab, var(--sim-strata-2) 55%, var(--sim-stroke)); }
.mk-box { display: block; width: 100%; max-width: 420px; height: auto; }
.mk-gasdot { transition: cx 0.8s cubic-bezier(0.3, 0.7, 0.3, 1), cy 0.8s cubic-bezier(0.3, 0.7, 0.3, 1); }
.mk-legend { display: flex; gap: var(--sim-space-3); }
.mk-key { display: inline-flex; align-items: center; gap: 5px; font-weight: 700; font-size: var(--sim-text-sm); color: var(--sim-label); }
.mk-key::before { content: ''; width: 12px; height: 12px; border-radius: 50%; background: var(--t); border: 2px solid var(--sim-stroke); }
.mk-nail { transition: transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1); transition-delay: calc(var(--i) * 40ms); }
.mk-hero--lifted .mk-nail { animation: mk-up 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) both; animation-delay: calc(var(--i) * 50ms); }

/* the banner and the sample cards */
.mk-banner { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sim-space-2); }
.mk-col { align-items: stretch; min-height: 86px; }
.mk-col__t { font-weight: 900; font-size: var(--sim-text-sm); color: var(--sim-label); text-align: center; }
.mk-col__list { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
.mk-posted { padding: 1px var(--sim-space-2); border-radius: var(--sim-radius-pill); border: 2px solid var(--sim-good); background: color-mix(in oklab, var(--sim-good) 14%, var(--sim-bg-surface));
  font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label); animation: mk-pop 0.35s ease both; }
.mk-cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--sim-space-2); }
.sim-dom-root--portrait .mk-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.sim-dom-root--portrait .mk-chip, .sim-dom-root--portrait .mk-go, .sim-dom-root--portrait .sflow-tab { min-height: 48px; }
.mk-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: var(--sim-space-2) 4px; border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-md);
  background: var(--sim-bg-surface); min-width: 0; }
.mk-card.is-miss { border-color: var(--sim-warning); animation: mk-shake 0.36s ease; }
.mk-card .mk-chips { flex-direction: column; align-items: stretch; }
.mk-card__pic { width: 64px; height: 64px; }
.mk-jar, .mk-lens { display: block; width: 64px; height: 64px; }
.mk-card__n { font-weight: 800; font-size: var(--sim-text-sm); line-height: 1.15; color: var(--sim-label); text-align: center; min-height: 34px; }
.mk-pin { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-good); }
@keyframes mk-pop { from { transform: scale(0.6); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes mk-up { from { translate: 0 70px; } to { translate: 0 0; } }
@keyframes mk-shake { 0%, 100% { transform: none; } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@media (prefers-reduced-motion: reduce) {
  .mk-tag, .mk-posted, .mk-hero--lifted .mk-nail, .mk-card.is-miss { animation: none; }
  .mk-gasdot, .mk-nail, }
`;
