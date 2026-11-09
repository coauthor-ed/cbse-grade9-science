/**
 * MixItRightScene - blk-l02-s07, "make the jar on the card" (mini-game@1, beat-less), on shared/GameFrame.js.
 *
 * Four cards, one at a time. The learner works out the amounts, types them, picks a flask where the card
 * needs one and presses Make it. No percentage shows before that press, so the jar is a prediction and its
 * printed label is the observation. A wrong jar names what went wrong and can be changed and made again.
 *   1  250 mL of 4 % m/v saline: 10 g in a 250 mL flask (the slip: 4 g, which is for 100 mL)
 *   2  100 g of 10 % m/m: 10 g salt + 90 g water (the slip: 100 g water, which makes 110 g)
 *   3  200 mL of 5 % m/v from a 10 % m/v stock: 100 mL stock in a 200 mL flask
 *   4  ORS, 1 litre: the WHO low-osmolarity amounts, which pass only exactly
 * The old last card (20 g glucose, 6.5 g salt, 2.5 g citrate) was not any published ORS, and the old slide
 * said Mahalanabis used it. Typed amounts replace the scoop chips: 44 px steppers cannot reach 13.5 g on a phone.
 * The old unit-picking step went with them: the card already prints the letters. Self-checking, no timer. CSS only.
 * GameBoard extends withChallenge(DomSimulation).
 */
import { GameBoard, mountGame } from '../shared/GameFrame.js';
import { esc } from 'simulations/base/SimUi.js';
import { burst } from 'simulations/base/kit/SimLookDom.js';

/* ------------------------------------------------------------------ data */

const STUFF = {
  nacl: { label: 'Salt', tone: '--sim-salt' },
  glucose: { label: 'Glucose', tone: '--sim-glucose' },
  kcl: { label: 'Potassium chloride', tone: '--sim-series-3' },
  citrate: { label: 'Sodium citrate', tone: '--sim-series-5' },
};
const ROUNDS = [
  { card: '250 mL of 4 % m/v saline', kind: 'wv', inputs: [{ id: 'nacl', unit: 'g', want: 10 }], flask: 250, pct: 4 },
  { card: '100 g of 10 % m/m salt solution', kind: 'mm', inputs: [{ id: 'nacl', unit: 'g', want: 10 }, { id: 'water', label: 'Water', unit: 'g', want: 90 }], pct: 10 },
  { card: '200 mL of 5 % m/v glucose, from a 10 % m/v stock', kind: 'stock', inputs: [{ id: 'stock', label: '10 % stock', unit: 'mL', want: 100 }], flask: 200, pct: 5 },
  { card: '1 L of ORS: 13.5 g glucose, 2.6 g salt, 1.5 g potassium chloride, 2.9 g sodium citrate', kind: 'ors',
    inputs: [{ id: 'glucose', unit: 'g', want: 13.5 }, { id: 'nacl', unit: 'g', want: 2.6 }, { id: 'kcl', unit: 'g', want: 1.5 }, { id: 'citrate', unit: 'g', want: 2.9 }], flask: 1000 },
];
const FLASKS = [100, 200, 250, 500, 1000];
const MARK = { yes: '\u2713', no: '\u2717' };
const near = (a, b) => Math.abs(a - b) < 0.0501;
const num = (v) => String(Math.round(v * 100) / 100);
const one = (v) => (Math.round(v * 10) / 10).toFixed(1);

/* ------------------------------------------------------------- drawings */

/** A top-pan balance; the heaps on the pan grow with the grams (one heap per solid). */
function balanceSvg(heaps) {
  const total = heaps.reduce((a, h) => a + h.g, 0);
  const w = 92 / Math.max(1, heaps.length);
  const hp = heaps.map((h, i) => {
    const r = h.g > 0 ? Math.min(w / 2 - 2, 6 + Math.sqrt(h.g) * 4.2) : 0;
    const ht = h.g > 0 ? Math.min(30, 4 + Math.sqrt(h.g) * 5) : 0;
    const cx = 34 + w * i + w / 2;
    return r ? `<path d="M${cx - r} 52 Q${cx} ${52 - ht * 2} ${cx + r} 52 Z" fill="var(${h.tone})" stroke="var(--sim-stroke)" stroke-width="2"/>` : '';
  }).join('');
  return `<svg class="mir-draw" viewBox="0 0 160 112" aria-hidden="true">
    <ellipse cx="80" cy="106" rx="66" ry="5" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>
    <path d="M22 70 h116 l10 34 H12 Z" fill="var(--sim-surface-raised)" stroke="var(--sim-stroke)" stroke-width="2" stroke-linejoin="round"/>
    <rect x="50" y="78" width="60" height="18" rx="4" fill="var(--sim-bg-deep)" stroke="var(--sim-stroke)" stroke-width="2"/>
    <rect x="72" y="56" width="16" height="14" fill="var(--sim-label-muted)"/>
    <rect x="28" y="52" width="104" height="7" rx="3.5" fill="var(--sim-label-muted)" stroke="var(--sim-stroke)" stroke-width="2"/>
    ${hp}
    <text x="80" y="91.5" text-anchor="middle" class="mir-lcd">${esc(one(total))} g</text>
  </svg>`;
}

/** A beaker of water standing on the bench (the m/m card weighs it). */
function beakerSvg(g) {
  const f = Math.min(1, g / 150);
  const top = 100 - f * 70;
  return `<svg class="mir-draw" viewBox="0 0 160 112" aria-hidden="true">
    <ellipse cx="80" cy="106" rx="40" ry="4" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>
    <path d="M52 ${top} H108 V96 a6 6 0 0 1 -6 6 H58 a6 6 0 0 1 -6 -6 Z" fill="color-mix(in oklab, var(--sim-water) 55%, transparent)"/>
    <path d="M46 22 h4 v74 a6 6 0 0 0 6 6 h48 a6 6 0 0 0 6 -6 V22 h4" fill="none" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M110 40 h-8 M110 58 h-8 M110 76 h-8" stroke="var(--sim-label-muted)" stroke-width="2"/>
  </svg>`;
}

/** A measuring cylinder drawn from the stock bottle. */
function cylinderSvg(ml) {
  const f = Math.min(1, ml / 250);
  const top = 98 - f * 82;
  let ticks = '';
  for (let i = 1; i <= 5; i++) ticks += `<path d="M86 ${98 - i * 16.4} h-8" stroke="var(--sim-label-muted)" stroke-width="2"/>`;
  return `<svg class="mir-draw" viewBox="0 0 160 112" aria-hidden="true">
    <ellipse cx="80" cy="106" rx="30" ry="4" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>
    <path d="M58 102 h44 v-4 h-44 Z" fill="var(--sim-surface-raised)" stroke="var(--sim-stroke)" stroke-width="2"/>
    <path d="M68 ${top} H92 V98 H68 Z" fill="color-mix(in oklab, var(--sim-glucose) 60%, transparent)"/>
    <path d="M66 12 V98 M94 12 V98" stroke="var(--sim-stroke)" stroke-width="3"/>
    ${ticks}
    <path d="M71 18 v74" stroke="color-mix(in oklab, var(--sim-label) 30%, transparent)" stroke-width="3" stroke-linecap="round"/>
    <g transform="translate(116 46)"><rect x="0" y="10" width="30" height="46" rx="6" fill="color-mix(in oklab, var(--sim-glucose) 45%, var(--sim-bg-surface))" stroke="var(--sim-stroke)" stroke-width="2"/>
      <rect x="8" y="0" width="14" height="10" rx="2" fill="var(--sim-label-muted)" stroke="var(--sim-stroke)" stroke-width="2"/>
      <rect x="4" y="24" width="22" height="14" rx="2" fill="var(--sim-bg-surface)"/></g>
  </svg>`;
}

/** A volumetric flask with one mark on its neck; its size follows the volume. */
function flaskSvg(ml, { full = false, tone = '--sim-water' } = {}) {
  const k = ml ? Math.cbrt(ml / 1000) : 0.7;
  const r = 14 + 30 * k;
  const cy = 106 - r;
  const neckTop = Math.max(6, cy - r - 30 * k - 14);
  const nw = 5 + 3 * k;
  const mark = neckTop + 12;
  const body = `M${80 - nw} ${neckTop} V${cy - r * 0.86} A${r} ${r} 0 1 0 ${80 + nw} ${cy - r * 0.86} V${neckTop}`;
  const liq = full
    ? `<path d="M${80 - nw} ${mark} V${cy - r * 0.86} A${r} ${r} 0 1 0 ${80 + nw} ${cy - r * 0.86} V${mark} Z" fill="color-mix(in oklab, var(${tone}) 55%, transparent)"/>`
    : '';
  return `<svg class="mir-draw" viewBox="0 0 160 112" aria-hidden="true">
    <ellipse cx="80" cy="107" rx="${r * 0.8}" ry="4" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>
    <path d="${body} Z" fill="color-mix(in oklab, var(--sim-glass) 14%, transparent)"/>
    ${liq}
    <path d="${body}" fill="none" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M${80 - nw - 4} ${mark} h${2 * nw + 8}" stroke="var(--sim-warning)" stroke-width="2.5"/>
    <rect x="${80 - nw - 2}" y="${neckTop - 6}" width="${2 * nw + 4}" height="7" rx="2" fill="var(--sim-label-muted)"/>
    <path d="M${80 - r * 0.55} ${cy - r * 0.2} q-4 18 6 ${r * 0.6}" fill="none" stroke="color-mix(in oklab, var(--sim-label) 35%, transparent)" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

/* ------------------------------------------------------------- the scene */

export class MixItRightScene extends GameBoard {
  static PORTRAIT_HEIGHT = 900;   // sim-layout --interact: the tallest state
  static ARIA_LABEL =
    'A bench for making a solution to a target card. Work out the amounts, type them in, pick a flask where the card needs one, '
    + 'then make the jar and read the label it prints. A jar that misses says what went wrong.';
  static OBJECTIVE = {
    prompt: { en: 'Make each jar to its card. Work out the amounts, make it, and read the label the jar prints.' },
  };
  static SCORING = { mode: 'accuracy', tolerance: 0.001, maxAttempts: Infinity };

  constructor(container, config) {
    super(container, config);
    this._i = 0;
    this._st = ROUNDS.map(() => ({ v: {}, flask: null, made: null, fresh: false }));
    this._won = ROUNDS.map(() => false);
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `<div class="gm mr">
        <div class="mr-top">
          <div class="gm-head"><p class="kicker">Make the jar on the card</p><h2 id="mr-card"></h2></div>
          <div class="mr-dots" id="mr-dots" role="group" aria-label="Cards"></div>
        </div>
        <div class="mr-board" id="mr-board"></div>
      </div>`,
    });
    this._board = this.root.querySelector('#mr-board');
    this.root.addEventListener('click', this._onClick = (e) => {
      const b = e.target instanceof Element ? e.target.closest('[data-act]') : null;
      if (b && !b.disabled) this._act(b.dataset.act, b.dataset.val);
    });
    this.root.addEventListener('input', this._onInput = (e) => {
      const id = e.target?.dataset?.input;
      if (!id) return;
      const st = this._st[this._i];
      st.v[id] = Number.parseFloat(e.target.value);
      if (st.made && !st.made.ok) st.made = null;
      this._paintDraw();
    });
    this._paint();
    this.quill.speak('Work out the amounts first.', 5200);
  }

  destroy() {
    this.root?.removeEventListener('click', this._onClick);
    this.root?.removeEventListener('input', this._onInput);
    super.destroy();
  }

  _act(name, value) {
    const st = this._st[this._i];
    if (name === 'card') { const n = Number(value); if (n === 0 || this._won[n - 1] || this._won[n]) this._i = n; }
    else if (name === 'next') this._i = Math.min(ROUNDS.length - 1, this._i + 1);
    else if (st.made?.ok) return;
    else if (name === 'flask') { st.flask = Number(value); if (st.made) st.made = null; }
    else if (name === 'make') this._make();
    this._paint();
  }

  _vals(r, st) { return r.inputs.map((x) => (Number.isFinite(st.v[x.id]) ? st.v[x.id] : 0)); }

  _missing(r, st) {
    if (this._vals(r, st).some((v) => v <= 0)) return 'Type every amount first';
    if (r.flask && !st.flask) return 'Pick a flask';
    const [stock] = this._vals(r, st);
    if (r.kind === 'stock' && stock > st.flask) return 'That is too much stock for this flask';
    return '';
  }

  /** Works out what the jar really is, prints its label, and judges it against the card. */
  _make() {
    const i = this._i;
    const r = ROUNDS[i];
    const st = this._st[i];
    if (this._missing(r, st)) return;
    const vals = this._vals(r, st);
    let lines, tag = '';
    let ok = r.inputs.every((x, k) => near(vals[k], x.want)) && (!r.flask || st.flask === r.flask);
    if (r.kind === 'mm') {
      const [g, w] = vals;
      const total = g + w, pct = (100 * g) / total;
      lines = [`${one(pct)} % m/m`, `${num(g)} g salt in ${num(total)} g`];
      if (!ok && near(g, 10) && near(w, 100)) tag = '100 g of water plus 10 g of salt makes 110 g of solution.';
      else if (!ok && near(pct, r.pct)) tag = `Right strength, but ${num(total)} g. The card asks for 100 g.`;
      else if (!ok) tag = 'Salt and water together must be 100 g, and 10 of those grams are salt.';
    } else if (r.kind === 'stock') {
      const [mL] = vals;
      const pct = ((10 / 100) * mL * 100) / st.flask;
      lines = [`${one(pct)} % m/v`, `${num(mL)} mL stock in ${st.flask} mL`];
      if (!ok && mL === st.flask) tag = 'That is only stock, with no water, so it is still 10 %.';
      else if (!ok && near(pct, r.pct)) tag = `Right strength, but ${st.flask} mL. The card asks for 200 mL.`;
      else if (!ok) tag = '200 mL of 5 % holds 10 g. How much 10 % stock holds 10 g?';
    } else if (r.kind === 'wv') {
      const [g] = vals;
      const pct = (100 * g) / st.flask;
      lines = [`${one(pct)} % m/v`, `${num(g)} g salt in ${st.flask} mL`];
      if (!ok && near(g, 4) && st.flask === 250) tag = '4 g is for 100 mL. This flask holds 250 mL.';
      else if (!ok && near(pct, r.pct)) tag = `Right strength, but ${st.flask} mL. The card asks for 250 mL.`;
      else if (!ok) tag = '4 % m/v means 4 g in every 100 mL.';
    } else {
      const total = vals.reduce((a, b) => a + b, 0);
      lines = [ok ? 'ORS' : 'Not ORS', `${num(total)} g solids in ${st.flask} mL`];
      if (!ok) {
        const off = r.inputs.findIndex((x, k) => !near(vals[k], x.want));
        tag = off >= 0 ? `The card asks for ${num(r.inputs[off].want)} g of ${(STUFF[r.inputs[off].id].label).toLowerCase()}.` : 'The card asks for 1 L of water.';
      }
    }
    st.made = { ok, lines, tag };
    st.fresh = true;
    if (ok) {
      this._won[i] = true;
      this.quill?.perform('hop');
    } else this.quill?.setExpression('surprised');
    this._paint();
    // On a phone the verdict lands under the bottom bar: bring it up, or a wrong jar looks like no reply.
    if (this.root?.classList?.contains('sim-dom-root--portrait')) this._board.querySelector('.mr-tag')?.scrollIntoView({ block: 'center' });
    if (ok) burst(this._board, 18, this._board.querySelector('.mr-jarcol'));
  }

  checkObjective() {
    if (!this._st.some((s) => s.made)) return null;
    const open = this._won.findIndex((w) => !w);
    if (open < 0) { this.quill?.perform('hop'); return { ok: true }; }
    return { ok: false, hint: `Card ${open + 1} is not made yet.` };
  }

  /* ---------------------------------------------------------------- paint */

  _drawHtml(r, st) {
    const vals = this._vals(r, st);
    if (r.kind === 'stock') return `${cylinderSvg(vals[0])}${flaskSvg(st.flask, { full: !!st.made, tone: '--sim-glucose' })}`;
    const heaps = r.inputs.filter((x) => STUFF[x.id]).map((x) => ({ g: Number.isFinite(st.v[x.id]) ? st.v[x.id] : 0, tone: STUFF[x.id].tone }));
    const second = r.kind === 'mm' ? beakerSvg(vals[1]) : flaskSvg(st.flask, { full: !!st.made, tone: r.kind === 'ors' ? '--sim-glucose' : '--sim-water' });
    return `${balanceSvg(heaps)}${second}`;
  }

  _paintDraw() {
    const r = ROUNDS[this._i];
    const st = this._st[this._i];
    const d = this._board.querySelector('#mr-draw');
    if (d) d.innerHTML = this._drawHtml(r, st);
    const hint = this._board.querySelector('#mr-hint');
    if (hint) hint.textContent = this._missing(r, st) || 'The label prints when you make the jar';
    const go = this._board.querySelector('[data-act="make"]');
    if (go) go.disabled = !!this._missing(r, st);
  }

  _paint() {
    const i = this._i;
    const r = ROUNDS[i];
    const st = this._st[i];
    const done = !!st.made?.ok;
    if (!this._board) return;                   // the headless check has no parser
    this.root.querySelector('#mr-card').textContent = r.card;
    this.root.querySelector('#mr-dots').innerHTML = ROUNDS.map((_, n) => {
      const open = n === 0 || this._won[n - 1] || this._won[n];
      return `<button type="button" class="tap btn mr-dot${n === i ? ' is-on' : ''}${this._won[n] ? ' is-yes' : ''}" data-act="card" data-val="${n}"${open ? '' : ' disabled'} aria-label="Card ${n + 1}">${n + 1}</button>`;
    }).join('');

    const rows = r.inputs.map((x) => {
      const label = x.label ?? STUFF[x.id].label;
      const v = st.v[x.id];
      return `<label class="mr-row"><span class="mr-k">${esc(label)}</span><span class="mr-in"><input class="num mr-num" type="number" inputmode="decimal" min="0" step="any" data-input="${x.id}" aria-label="${esc(label)} in ${x.unit}" value="${Number.isFinite(v) ? v : ''}"${done ? ' disabled' : ''}/><span class="mr-u">${x.unit}</span></span></label>`;
    }).join('');
    const flasks = r.flask ? `<div class="mr-flasks"><span class="mr-k">Flask, mL</span><div class="mr-chips">${FLASKS.map((v) =>
      `<button type="button" class="tap btn mr-chip${st.flask === v ? ' is-on' : ''}" data-act="flask" data-val="${v}" aria-pressed="${st.flask === v}"${done ? ' disabled' : ''}>${v}</button>`).join('')}</div></div>` : '';
    const why = this._missing(r, st);
    const make = done ? '' : `<button type="button" class="tap btn mr-make" data-act="make" data-val=""${why ? ' disabled' : ''}>Make it</button>`;
    const left = `<div class="mr-col"><div class="mr-rows mr-rows--${r.inputs.length}">${rows}</div>${flasks}${make}<span class="mr-hint" id="mr-hint">${esc(done ? '' : why || 'The label prints when you make the jar')}</span></div>`;

    const made = st.made;
    const fresh = st.fresh ? ' is-fresh' : '';
    st.fresh = false;
    const label = made
      ? `<span class="mr-label${made.ok ? ' is-yes' : ' is-no'}"><b>${esc(made.lines[0])}</b><span>${esc(made.lines[1])}</span></span>`
      : '<span class="mr-label mr-label--blank">no label yet</span>';
    let foot = '';
    if (made?.ok) {
      foot = `<span class="mr-tag is-yes">${MARK.yes} Matches the card</span>`
        + (i < ROUNDS.length - 1 ? '<button type="button" class="tap btn mr-next" data-act="next" data-val="">Next card</button>' : '');
    } else if (made) foot = `<span class="mr-tag is-no">${MARK.no} ${esc(made.tag || 'This is not the card.')}</span>`;
    const jarCol = `<div class="mr-col mr-jarcol${fresh}"><span class="mr-jar${made ? ' is-made' : ''}"><span class="mr-lid"></span><span class="mr-glass"><span class="mr-liq"></span>${label}</span></span><div class="mr-foot" aria-live="polite">${foot}</div></div>`;

    this._board.innerHTML = `${left}<div class="mr-draw" id="mr-draw">${this._drawHtml(r, st)}</div>${jarCol}`;
    this.relayout?.();
  }
}

const CSS = `
.sim-dom-root--portrait .q-sparks, .sim-dom-root--portrait .q-dots { display: none; }
.gm.mr { background: var(--sim-bg-deep); border-radius: 14px; }
.mr .mr-top { display: flex; align-items: flex-start; gap: 16px; }
.mr .gm-head { flex: 0 1 540px; min-width: 0; }
.mr h2 { font-size: 22px; }
.mr .mr-dots { display: flex; gap: 6px; flex: none; }
.mr .mr-dot { width: 46px; padding: 0; font-family: var(--sim-font-display); font-size: 18px; }
.mr .mr-dot.is-on { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); }
.mr .mr-dot.is-yes { border-color: var(--sim-good); }
.mr .btn:disabled { opacity: 0.5; cursor: default; box-shadow: none; }
.mr .mr-board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 420px minmax(0, 1fr) 280px; gap: 14px; align-items: start; }
.mr .mr-col { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.mr .mr-k { font-weight: 800; font-size: 15px; color: var(--sim-label-muted); }
.mr .mr-rows { display: grid; grid-template-columns: repeat(var(--n, 1), minmax(0, 1fr)); gap: 8px 12px; }
.mr .mr-rows--2, .mr .mr-rows--4 { --n: 2; }
.mr .mr-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.mr .mr-in { display: inline-flex; align-items: center; gap: 4px; flex: none; }
.mr .mr-num { width: 76px; }
.mr .mr-u { font-weight: 800; font-size: 15px; min-width: 22px; }
.mr .mr-flasks { display: flex; flex-direction: column; gap: 4px; }
.mr .mr-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.mr .mr-chip { min-width: 58px; padding: 4px 6px; }
.mr .mr-chip.is-on { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); opacity: 1; }
.mr .mr-make { background: var(--sim-accent); color: var(--sim-bg-deep); border-color: var(--sim-accent); font-size: 16px; font-weight: 800; }
.mr .mr-hint { font-weight: 700; font-size: 15px; color: var(--sim-label-muted); }
.mr .mr-draw { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; align-items: end; padding: 8px; border-radius: 14px;
  background: var(--sim-bg-surface); border: var(--sim-border); }
.mr .mir-draw { display: block; width: 100%; height: auto; }
.mr .mir-lcd { font-family: var(--sim-font-display, var(--sim-font)); font-weight: 800; font-size: 16px; fill: var(--sim-good); }
.mr .mr-jarcol { align-items: center; }
.mr .mr-jar { display: flex; flex-direction: column; align-items: center; }
.mr .mr-lid { width: 104px; height: 12px; border-radius: 5px 5px 2px 2px; border: 2px solid var(--sim-stroke); background: color-mix(in oklab, var(--sim-water) 45%, var(--sim-stroke)); }
.mr .mr-glass { position: relative; display: flex; align-items: center; justify-content: center; width: 150px; height: 112px; overflow: hidden;
  border: 3px solid var(--sim-glass); border-top-width: 2px; border-radius: 10px 10px 20px 20px; background: color-mix(in oklab, var(--sim-glass) 12%, var(--sim-bg-surface)); }
.mr .mr-liq { position: absolute; inset: auto 0 0; height: 0; background: color-mix(in oklab, var(--sim-water) 45%, var(--sim-bg-surface)); transition: height 0.6s cubic-bezier(0.2, 0.8, 0.3, 1); }
.mr .mr-jar.is-made .mr-liq { height: 78%; }
.mr .mr-label { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; max-width: 140px; padding: 4px 6px; border-radius: 6px;
  background: var(--sim-bg-surface); border: 2px solid var(--sim-stroke); text-align: center; font-size: 14px; font-weight: 700; line-height: 1.15; }
.mr .mr-label b { display: block; font-family: var(--sim-font-display); font-size: 18px; font-weight: 700; line-height: 1.3; }
.mr .mr-label--blank { color: var(--sim-label-muted); border-style: dashed; }
.mr .mr-label.is-yes { border-color: var(--sim-good); }
.mr .mr-label.is-no { border-color: var(--sim-warning); }
.mr .mr-jarcol.is-fresh .mr-label { animation: mr-stamp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both; }
.mr .mr-foot { display: flex; flex-direction: column; align-items: stretch; gap: 6px; width: 100%; }
.mr .mr-tag { padding: 4px 8px; border-radius: 10px; border: 2px solid var(--sim-stroke); font-weight: 800; font-size: 15px; line-height: 1.25; text-align: center; }
.mr .mr-tag.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); }
.mr .mr-tag.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface)); }
.mr .mr-next { border-color: var(--sim-accent); padding: 6px 14px; }
@keyframes mr-stamp { from { transform: scale(1.6) rotate(-8deg); opacity: 0; } to { transform: none; opacity: 1; } }
.sim-dom-root--portrait .mr h2 { font-size: 19px; padding-right: 46px; }
.sim-dom-root--portrait .mr .mr-top { display: block; }
.sim-dom-root--portrait .mr .gm-head { flex: none; }
.sim-dom-root--portrait .mr .mr-dots { margin-top: 6px; }
.sim-dom-root--portrait .mr .mr-board { display: flex; flex-direction: column; gap: 10px; align-items: stretch; }
.sim-dom-root--portrait .mr .mr-rows { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .mr .mr-chip { min-width: 0; flex: 1 1 28%; }
.sim-dom-root--portrait .mr .mr-draw { padding: 4px; }
@media (prefers-reduced-motion: reduce) {
  .mr .mr-jarcol.is-fresh .mr-label { animation: none; }
  .mr .mr-liq { transition: none; }
}
`;
