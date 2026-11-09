/**
 * PlanTheSeparationScene - the closing mini-game of lesson 9 (blk-l09-s05), the book's Q11, on shared/GameFrame.js.
 * Each round is one dish and one question at a time, so it fits a 320 px phone:
 *   1. Name   one solid at a time: what is different about it? A wrong pick says why.
 *   2. Plan   tap the steps into an order (tap a planned step to take it out).
 *   3. Run    the plan runs one step per tap. A step that cannot work in that order stops the run with its
 *             mess named: wet naphthalene, a filter on a dry powder, boiling before filtering.
 * Round 2 adds iron filings and a magnet. Self-checking, no timer, no penalty. CSS only.
 * GameBoard extends withChallenge(DomSimulation).
 */
import { GameBoard, mountGame } from '../shared/GameFrame.js';
import { esc } from 'simulations/base/SimUi.js';
import { burst } from 'simulations/base/kit/SimLookDom.js';
import { rng } from 'simulations/base/kit/shuffle.js';

/* ------------------------------------------------------------------ data */

const SOLIDS = {
  sand: { name: 'Sand', prop: 'none', tone: '--sim-strata-2' },
  salt: { name: 'Common salt', prop: 'dissolves', tone: '--sim-ice' },
  naph: { name: 'Naphthalene', prop: 'sublimes', tone: '--sim-series-5' },
  iron: { name: 'Iron filings', prop: 'magnet', tone: '--sim-waste' },
};
const PROPS = [
  { id: 'sublimes', label: 'It sublimes' },
  { id: 'dissolves', label: 'It dissolves in water' },
  { id: 'magnet', label: 'It is magnetic' },
  { id: 'none', label: 'None of these' },
];
const PROP_WHY = {
  sand: 'Sand does not sublime, dissolve or stick to a magnet, so it is what stays behind',
  salt: 'Salt dissolves in water. It does not sublime and it is not magnetic',
  naph: 'Naphthalene sublimes: it turns straight to vapour when warmed',
  iron: 'Iron is the only one here that a magnet pulls',
};
const LEVERS = {
  magnet: { label: 'Magnet' },
  sublime: { label: 'Heat under a funnel' },
  water: { label: 'Add water, stir' },
  filter: { label: 'Filter' },
  evap: { label: 'Boil it dry' },
};
const ROUNDS = [
  { key: 'r1', tab: 'Three solids', solids: ['sand', 'salt', 'naph'], levers: ['sublime', 'water', 'filter', 'evap'] },
  { key: 'r2', tab: 'Four solids', solids: ['iron', 'sand', 'salt', 'naph'], levers: ['magnet', 'sublime', 'water', 'filter', 'evap'] },
];
const MARK = { yes: '\u2713', no: '\u2717' };

/**
 * Run one lever on the dish. `d` is the dish: { dry: [solids], wet: bool, dissolved: [], paper: bool }.
 * Returns { ok, jar, why }: a lever that cannot work in this order stops the run with its mess named.
 */
function step(d, lever) {
  if (lever === 'magnet') {
    if (d.filtered) return { ok: false, why: 'The iron went onto the filter paper with the wet sand' };
    if (!d.solids.includes('iron')) return { ok: false, why: 'Nothing in the dish is pulled by the magnet' };
    d.solids = d.solids.filter((s) => s !== 'iron');
    return { ok: true, jar: 'iron' };
  }
  if (lever === 'sublime') {
    if (d.wet && d.solids.includes('naph')) return { ok: false, why: 'The naphthalene is wet, so it cannot sublime cleanly' };
    if (!d.solids.includes('naph')) return { ok: false, why: 'Nothing left in the dish turns to vapour' };
    d.solids = d.solids.filter((s) => s !== 'naph');
    return { ok: true, jar: 'naph' };
  }
  if (lever === 'water') {
    if (d.wet) return { ok: false, why: 'There is water in it already' };
    if (d.solids.includes('naph')) d.ruined = true;
    d.wet = true;
    if (d.solids.includes('salt')) { d.solids = d.solids.filter((s) => s !== 'salt'); d.dissolved = ['salt']; }
    if (d.ruined) return { ok: false, why: 'Water went in first, so the naphthalene is wet and mixed with the sand' };
    return { ok: true };
  }
  if (lever === 'filter') {
    if (!d.wet) return { ok: false, why: 'A filter does nothing to a dry powder' };
    if (d.filtered) return { ok: false, why: 'It has been filtered already' };
    d.filtered = true;
    const jar = d.solids.includes('sand') && d.solids.length === 1 ? 'sand' : null;
    d.solids = [];
    if (!jar) return { ok: false, why: 'Two solids were caught on the paper together' };
    return { ok: true, jar };
  }
  if (lever === 'evap') {
    if (!d.wet) return { ok: false, why: 'The dish is dry: there is nothing to boil' };
    if (!d.filtered) return { ok: false, why: 'Boiled before filtering: the salt is back in the sand' };
    if (!d.dissolved.includes('salt')) return { ok: false, why: 'There was no salt in the water' };
    d.dissolved = [];
    d.wet = false;
    return { ok: true, jar: 'salt' };
  }
  return { ok: false, why: '' };
}

/* ------------------------------------------------------------- drawings */

function dishSvg(r, d, last) {
  const rr = rng(r.solids.length * 13);
  let grains = '';
  d.solids.forEach((id, k) => {
    for (let i = 0; i < 16; i++) {
      const x = 60 + rr() * 180;
      const y = 104 + rr() * 22 - (d.wet ? 4 : 0);
      grains += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${id === 'iron' ? 3 : 4.2}" fill="var(${SOLIDS[id].tone})" stroke="var(--sim-stroke)" stroke-width="1.2" style="--k:${k}"/>`;
    }
  });
  const water = d.wet ? `<path d="M44 92 q106 62 212 0 Z" fill="color-mix(in oklab, var(--sim-water) ${d.dissolved.length ? 46 : 36}%, transparent)" class="pt-water"/>` : '';
  const funnel = last === 'sublime' ? '<g class="pt-fx"><path d="M70 92 L138 26 V8 h24 V26 L230 92" fill="color-mix(in oklab, var(--sim-glass) 16%, transparent)" stroke="var(--sim-glass)" stroke-width="4" stroke-linejoin="round"/>'
    + '<path d="M120 84 q-8 -16 2 -30 M150 84 q8 -18 -2 -34 M180 84 q-8 -16 2 -30" fill="none" stroke="var(--sim-label-muted)" stroke-width="3.5" stroke-linecap="round"/></g>' : '';
  const magnet = last === 'magnet' ? '<g class="pt-fx"><path d="M124 6 v34 a26 26 0 0 0 52 0 v-34 h-15 v34 a11 11 0 0 1 -22 0 v-34 Z" fill="var(--sim-error)" stroke="var(--sim-stroke)" stroke-width="2.5"/>'
    + '<rect x="124" y="6" width="15" height="10" fill="var(--sim-series-1)"/><rect x="161" y="6" width="15" height="10" fill="var(--sim-series-1)"/></g>' : '';
  const flame = last === 'sublime' || last === 'evap' ? '<path class="pt-flame" d="M138 168 q8 -18 8 -26 q8 10 0 26 Z M156 168 q9 -20 7 -30 q10 12 1 30 Z" fill="var(--sim-flame)"/>' : '';
  return `<svg class="pt-dish" viewBox="0 0 300 176" aria-hidden="true">
    <ellipse cx="150" cy="170" rx="120" ry="5" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>${flame}
    <path d="M94 170 l-8 -28 h128 l-8 28" fill="none" stroke="var(--sim-stroke)" stroke-width="4" stroke-linejoin="round"/>
    <path d="M34 90 q116 72 232 0 Z" fill="var(--sim-surface-raised)" stroke="var(--sim-stroke)" stroke-width="3.5" stroke-linejoin="round"/>
    ${water}${grains}<path d="M34 90 q116 72 232 0" fill="none" stroke="var(--sim-stroke)" stroke-width="3.5"/>${funnel}${magnet}</svg>`;
}

function jarHtml(id, full, fresh) {
  const s = SOLIDS[id];
  return `<span class="pt-jar${full ? ' is-full' : ''}${fresh ? ' is-new' : ''}" style="--t:var(${s.tone})"><span class="pt-jar__lid"></span>`
    + `<span class="pt-jar__glass"><span class="pt-jar__fill"></span></span><span class="pt-jar__n">${esc(s.name)}</span></span>`;
}

/* ------------------------------------------------------------- the scene */

export class PlanTheSeparationScene extends GameBoard {
  static PORTRAIT_HEIGHT = 820;   // sim-layout --interact: the tallest state
  static ARIA_LABEL =
    'A china dish holding a mix of dry solids. First name what is different about each solid, then tap the steps into a plan, '
    + 'then run the plan one step at a time. A step in the wrong order stops with its mess named. Pure dry samples fill their jars.';
  static OBJECTIVE = {
    prompt: { en: 'Name the difference that takes out each solid, plan the order, then run it. Every solid must come back dry and on its own.' },
  };
  static SCORING = { mode: 'accuracy', tolerance: 0, maxAttempts: Infinity };

  constructor(container, config) {
    super(container, config);
    this._i = 0;
    this._st = ROUNDS.map((r) => this._fresh(r));
    this._won = ROUNDS.map(() => false);
    this._reported = false;
  }

  _fresh(r, named = {}) {
    return { named: { ...named }, miss: null, plan: [], ran: 0, dish: { solids: r.solids.slice(), wet: false, dissolved: [], filtered: false },
      jars: [], fail: null, last: null, fresh: null };
  }

  async setup() {
    await super.setup();
    mountGame(this, { css: CSS, html: `<div class="gm pt"><div class="pt-top"><div class="gm-head"><p class="kicker">Three solids, one dish</p><h2 id="pt-title"></h2></div>
      <div class="pt-dots" id="pt-dots" role="group" aria-label="Rounds"></div></div><div class="pt-board" id="pt-board"></div></div>` });
    this._board = this.root.querySelector('#pt-board');
    this.root.addEventListener('click', this._onClick = (e) => {
      const b = e.target instanceof Element ? e.target.closest('[data-act]') : null;
      if (b && !b.disabled) this._act(b.dataset.act, b.dataset.val);
    });
    this._paint();
    this.quill.speak('Name the difference first.', 5200);
  }

  destroy() {
    this.root?.removeEventListener('click', this._onClick);
    super.destroy();
  }

  _allNamed(r, s) { return r.solids.every((id) => s.named[id] === SOLIDS[id].prop); }

  _act(name, value) {
    const i = this._i;
    const r = ROUNDS[i];
    const s = this._st[i];
    if (name === 'round') {
      const n = Number(value);
      if (n === 0 || this._won[n - 1]) this._i = n;
      return this._paint();
    }
    if (name === 'next') { this._i = Math.min(ROUNDS.length - 1, i + 1); return this._paint(); }
    if (this._won[i]) return undefined;
    if (name === 'name') {
      const [id, p] = String(value).split(':');
      if (!r.solids.includes(id) || s.named[id] === SOLIDS[id].prop) return undefined;
      if (p === SOLIDS[id].prop) { s.named[id] = p; s.miss = null; } else { s.miss = id; this.quill?.setExpression('surprised'); }
      return this._paint();
    }
    if (!this._allNamed(r, s)) return undefined;
    if (name === 'again') { this._st[i] = this._fresh(r, s.named); return this._paint(); }
    if (name === 'plan') {
      if (s.ran || !r.levers.includes(value) || s.plan.includes(value)) return undefined;
      s.plan.push(value);
      return this._paint();
    }
    if (name === 'unplan') {
      if (s.ran) return undefined;
      s.plan = s.plan.filter((x) => x !== value);
      return this._paint();
    }
    if (name === 'run') {
      if (s.fail || s.plan.length !== r.levers.length || s.ran >= s.plan.length) return undefined;
      const lever = s.plan[s.ran];
      const out = step(s.dish, lever);
      s.ran += 1;
      s.last = lever;
      s.fresh = null;
      if (!out.ok) { s.fail = out.why; this.quill?.setExpression('surprised'); }
      if (out.jar) { s.jars.push(out.jar); s.fresh = out.jar; }
      if (out.ok && s.ran === s.plan.length && r.solids.every((id) => s.jars.includes(id))) this._won[i] = true;
      this._paint();
      if (this._won[i]) {
        burst(this.root.querySelector('.pt-jars') || this.root);
        this.quill?.perform('hop');
        if (this._won.every(Boolean) && !this._reported) { this._reported = true; this.requestCheck?.(); }
      }
    }
    return undefined;
  }

  checkObjective() {
    if (!this._st.some((s) => s.ran)) return null;
    return { ok: this._won.every(Boolean) };
  }

  /* ---------------------------------------------------------------- paint */

  _paint() {
    if (!this._board) return;
    const i = this._i;
    const r = ROUNDS[i];
    const s = this._st[i];
    const fresh = s.fresh;
    s.fresh = null;
    const left = `<div class="pt-bench"><div class="pt-dishbox">${dishSvg(r, s.dish, s.last)}</div>
      <div class="pt-jars">${r.solids.map((id) => jarHtml(id, s.jars.includes(id), fresh === id)).join('')}</div></div>`;
    const panel = !this._allNamed(r, s) ? this._nameHtml(r, s) : !s.ran && s.plan.length < r.levers.length ? this._planHtml(r, s) : this._runHtml(i, r, s);
    this._board.innerHTML = `${left}<div class="pt-panel">${panel}</div>`;
    this.root.querySelector('#pt-title').textContent = !this._allNamed(r, s) ? 'What is different about each solid?' : s.ran || s.plan.length === r.levers.length ? 'Run your plan' : 'Put the steps in order';
    this.root.querySelector('.kicker').textContent = r.solids.length === 3 ? 'Three solids, one dish' : 'Four solids, one dish';
    this.root.querySelector('#pt-dots').innerHTML = ROUNDS.map((x, n) => {
      const open = n === 0 || this._won[n - 1];
      return `<button type="button" class="tap btn pt-dot" data-act="round" data-val="${n}"${open ? '' : ' disabled'} aria-pressed="${n === i}" aria-label="Round ${n + 1}">${this._won[n] ? MARK.yes : n + 1}</button>`;
    }).join('');
    this.relayout?.();
  }

  _nameHtml(r, s) {
    const id = r.solids.find((x) => s.named[x] !== SOLIDS[x].prop);
    const done = r.solids.filter((x) => s.named[x] === SOLIDS[x].prop);
    const opts = PROPS.filter((p) => r.solids.some((x) => SOLIDS[x].prop === p.id) || p.id === 'magnet');
    return `${done.length ? `<div class="pt-done">${done.map((x) => `<span class="pt-chip">${MARK.yes} ${esc(SOLIDS[x].name)}</span>`).join('')}</div>` : ''}
      <div class="pt-ask"><span class="pt-swatch" style="--t:var(${SOLIDS[id].tone})"></span>${esc(SOLIDS[id].name)}</div>
      <div class="pt-grid">${opts.map((p) => `<button type="button" class="tap btn" data-act="name" data-val="${id}:${p.id}">${esc(p.label)}</button>`).join('')}</div>
      ${s.miss === id ? `<div class="pt-tag">${MARK.no} ${esc(PROP_WHY[id])}</div>` : ''}`;
  }

  _slots(r, s) {
    return `<ol class="pt-plan">${r.levers.map((_, k) => {
      const lv = s.plan[k];
      const state = k < s.ran ? (s.fail && k === s.ran - 1 ? ' is-bad' : ' is-ran') : k === s.ran && lv ? ' is-cur' : '';
      return `<li>${lv
        ? `<button type="button" class="tap btn pt-slot${state}" data-act="unplan" data-val="${lv}"${s.ran ? ' disabled' : ''}><span class="pt-n">${k + 1}</span>${esc(LEVERS[lv].label)}</button>`
        : `<span class="pt-slot pt-slot--empty"><span class="pt-n">${k + 1}</span></span>`}</li>`;
    }).join('')}</ol>`;
  }

  _planHtml(r, s) {
    return `<div class="pt-grid">${r.levers.filter((lv) => !s.plan.includes(lv)).map((lv) => `<button type="button" class="tap btn" data-act="plan" data-val="${lv}">${esc(LEVERS[lv].label)}</button>`).join('')}</div>${this._slots(r, s)}`;
  }

  _runHtml(i, r, s) {
    let act;
    if (this._won[i]) {
      act = `<div class="pt-tag is-yes">${MARK.yes} Every solid is back, dry and on its own</div>${i < ROUNDS.length - 1 ? '<button type="button" class="tap btn pt-go" data-act="next">Next round</button>' : ''}`;
    } else if (s.fail) {
      act = `<div class="pt-tag">${MARK.no} ${esc(s.fail)}</div><button type="button" class="tap btn" data-act="again">Put the solids back and plan again</button>`;
    } else {
      act = `<button type="button" class="tap btn pt-go" data-act="run">Run step ${s.ran + 1}</button>`;
    }
    return `${this._slots(r, s)}<div class="pt-act" aria-live="polite">${act}</div>`;
  }
}

const CSS = `
.gm.pt { background: var(--sim-bg-deep); border-radius: 14px; }
.pt .pt-top { display: flex; align-items: flex-start; gap: 14px; padding-right: 56px; }
.pt .gm-head { flex: 1 1 auto; }
.pt-dots { display: flex; gap: 6px; }
.pt .pt-dot { width: 48px; padding: 0; text-align: center; }
.pt .pt-dot[aria-pressed="true"] { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); }
.pt .pt-dot:disabled { opacity: 0.45; cursor: default; }
.pt-board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: 14px; }
.pt-bench { display: flex; flex-direction: column; justify-content: flex-end; gap: 4px; padding: 6px 10px 4px; border-radius: 14px; background: var(--sim-bg-surface); border: var(--sim-border);
  border-bottom-width: 7px; border-bottom-color: color-mix(in oklab, var(--sim-strata-2) 55%, var(--sim-stroke)); }
.pt-dishbox { min-height: 0; }
.pt-dish { display: block; width: 100%; max-height: 196px; }
.pt-jars { display: flex; justify-content: space-around; gap: 6px; }
.pt-jar { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; }
.pt-jar__lid { width: 36px; height: 7px; border-radius: 3px; background: var(--sim-label-muted); }
.pt-jar__glass { position: relative; display: block; width: 46px; height: 44px; overflow: hidden; border: 2px solid var(--sim-stroke); border-top-width: 1px; border-radius: 6px 6px 12px 12px;
  background: color-mix(in oklab, var(--sim-glass) 10%, var(--sim-bg-surface)); }
.pt-jar__fill { position: absolute; inset: auto 0 0; height: 0; background: var(--t); }
.pt-jar.is-full .pt-jar__fill { height: 60%; }
.pt-jar.is-new .pt-jar__fill { animation: pt-fill 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) both; }
.pt-jar__n { font-weight: 800; font-size: 14px; line-height: 1.1; color: var(--sim-label); text-align: center; }
.pt-panel { display: flex; flex-direction: column; gap: 8px; min-width: 0; padding-bottom: 60px; }
.pt-done { display: flex; flex-wrap: wrap; gap: 4px; }
.pt-chip { padding: 2px 10px; border-radius: 999px; border: 2px solid var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); font-weight: 800; font-size: 14px; }
.pt-ask { display: flex; align-items: center; gap: 10px; font-family: var(--sim-font-display); font-weight: 700; font-size: 24px; }
.pt-swatch { width: 20px; height: 20px; border-radius: 50%; background: var(--t); border: 2px solid var(--sim-stroke); }
.pt-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.pt-plan { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.pt .pt-slot { display: flex; align-items: center; gap: 6px; width: 100%; min-height: 48px; padding: 2px 8px 2px 4px; text-align: left; line-height: 1.15; box-sizing: border-box; font-size: 15px; font-weight: 700; }
.pt-slot--empty { border: 2px dashed var(--sim-stroke); border-radius: 12px; }
.pt-n { flex: none; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--sim-track); color: var(--sim-label); font-weight: 900; }
.pt .pt-slot.is-ran { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 14%, var(--sim-bg-surface)); }
.pt .pt-slot.is-bad { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 16%, var(--sim-bg-surface)); }
.pt .pt-slot.is-cur { border-color: var(--sim-accent); }
.pt .pt-slot:disabled { cursor: default; opacity: 1; }
.pt-act { display: flex; flex-direction: column; gap: 8px; }
.pt .pt-go { background: var(--sim-accent); color: var(--sim-bg-deep); border-color: var(--sim-accent); font-size: 16px; font-weight: 800; }
.pt-tag { padding: 6px 10px; border-radius: 12px; border: 2px solid var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface));
  font-weight: 700; font-size: 15px; line-height: 1.3; animation: pt-pop 0.35s ease both; }
.pt-tag.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); font-weight: 800; }
.pt-fx { animation: pt-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; transform-box: fill-box; transform-origin: 50% 0; }
.pt-water { animation: pt-fade 0.5s ease both; }
@keyframes pt-pop { from { transform: scale(0.7); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes pt-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pt-fill { from { height: 0; } }
.sim-dom-root--portrait .q-sparks, .sim-dom-root--portrait .q-dots { display: none; }
.sim-dom-root--portrait .pt .pt-top { display: block; padding-right: 0; }
.sim-dom-root--portrait .pt h2 { font-size: 19px; }
.sim-dom-root--portrait .pt-dots { margin-top: 6px; }
.sim-dom-root--portrait .pt-board { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .pt-panel { padding-bottom: 0; }
.sim-dom-root--portrait .pt-grid { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .pt-plan { grid-template-columns: minmax(0, 1fr); }
@media (prefers-reduced-motion: reduce) { .pt-jar.is-new .pt-jar__fill, .pt-tag, .pt-fx, .pt-water { animation: none; } }
`;
