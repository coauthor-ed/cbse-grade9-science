/**
 * DistillToOrderScene - blk-l04-s08, the mini-game. Layout: shared/GameFrame.js.
 *
 * Four cards, each a pair of liquids that mix, with their boiling points. On each card the learner:
 *   1. (card 1 only) labels the flask, the condenser and the receiver: tap a name, tap a number;
 *   2. says first if simple distillation will separate the pair;
 *   3. heats one minute at a time. The graph moves, drops run into the receiver, and the learner
 *      changes to receiver 2 in the climb between the two flat stretches. A close pair never goes flat.
 * A card is won when each receiver holds what the thermometer said, or, for a close pair, when the
 * learner said it would not separate. Every miss names what happened. No timer.
 *
 * Pairs: the book's Table 5.5, plus its A (60 C) and B (90 C). Chloroform and benzene are not paired
 * with water here: they do not mix with it, so distillation is not the question for them.
 * Check is this scene's own: the host's check runs by itself after the last card (requestCheck), so
 * GameFrame's button stays hidden.
 */
import { GameBoard, mountGame } from '../shared/GameFrame.js';
import { esc } from 'simulations/base/SimUi.js';

const DEG = '\u00b0';
const TICK = '\u2713';
const CROSS = '\u2717';
const ROOM = 24;
const GAP = 25;
const ROUNDS = [
  { low: { name: 'Acetone', bp: 56, tone: '--sim-series-2' }, high: { name: 'water', bp: 100, tone: '--sim-series-1' }, label: true },
  { low: { name: 'Acetone', bp: 56, tone: '--sim-series-2' }, high: { name: 'chloroform', bp: 61, tone: '--sim-series-5' } },
  { low: { name: 'Liquid A', bp: 60, tone: '--sim-series-4' }, high: { name: 'liquid B', bp: 90, tone: '--sim-series-7' } },
  { low: { name: 'Alcohol', bp: 78, tone: '--sim-series-3' }, high: { name: 'benzene', bp: 80, tone: '--sim-series-6' } },
];
const PARTS = [{ id: 'flask', n: 1 }, { id: 'condenser', n: 2 }, { id: 'receiver', n: 3 }];
const NAMES = ['condenser', 'receiver', 'flask'];
const separates = (r) => r.high.bp - r.low.bp >= GAP;

/** The run, minute by minute. Each entry: the reading and what drips that minute. */
function runOf(r) {
  const out = [{ t: ROOM, drip: null }];
  const L = r.low.bp, H = r.high.bp;
  if (separates(r)) {
    out.push({ t: Math.round((ROOM + L) / 2), drip: null }, { t: L, drip: 'low' }, { t: L, drip: 'low' }, { t: L, drip: 'low' }, { t: L, drip: 'low' });
    out.push({ t: Math.round(L + (H - L) * 0.45), drip: null }, { t: Math.round(L + (H - L) * 0.8), drip: null });
    out.push({ t: H, drip: 'high' }, { t: H, drip: 'high' }, { t: H, drip: 'high' }, { t: H, drip: null });
  } else {
    out.push({ t: Math.round((ROOM + L) / 2), drip: null });
    const n = 8;
    for (let i = 0; i < n; i += 1) out.push({ t: Math.round((L + ((H - L) * i) / (n - 1)) * 10) / 10, drip: 'mix' });
    out.push({ t: H, drip: null });
  }
  return out;
}

const MAX_MIN = 12;
const GW = 300, GH = 170;
const GP = { l: 36, r: 8, t: 8, b: 22 };

function graphSvg(r, s) {
  const run = runOf(r);
  const X = (m) => GP.l + (m / MAX_MIN) * (GW - GP.l - GP.r);
  const Y = (t) => GP.t + (1 - (t - 20) / 90) * (GH - GP.t - GP.b);
  const ticks = [20, 60, 100].map((t) => `<path d="M${GP.l} ${Y(t).toFixed(1)} H${GW - GP.r}" class="dt-grid"/><text x="${GP.l - 5}" y="${(Y(t) + 5).toFixed(1)}" text-anchor="end">${t}</text>`).join('');
  const marks = [r.low, r.high].map((p) => `<path d="M${GP.l} ${Y(p.bp).toFixed(1)} H${GW - GP.r}" stroke="var(${p.tone})" stroke-width="2.5" stroke-dasharray="6 5"/>`).join('');
  const pts = run.slice(0, s.min + 1);
  const line = pts.map((p, m) => `${m ? 'L' : 'M'}${X(m).toFixed(1)} ${Y(p.t).toFixed(1)}`).join(' ');
  const swap = s.swapAt != null ? `<path d="M${X(s.swapAt).toFixed(1)} ${GP.t} V${GH - GP.b}" stroke="var(--sim-label-muted)" stroke-width="2.5"/>` : '';
  const dot = `<circle cx="${X(s.min).toFixed(1)}" cy="${Y(pts[pts.length - 1].t).toFixed(1)}" r="6" fill="var(--sim-bad)" stroke="var(--sim-stroke)" stroke-width="2"/>`;
  return `<svg class="dt-graph" viewBox="0 0 ${GW} ${GH}" role="img" aria-label="Thermometer reading against minutes of heating">${ticks}${marks}`
    + `<text x="${GW - GP.r}" y="${GH - 4}" text-anchor="end">minutes</text>${swap}<path d="${line}" class="dt-line"/>${dot}</svg>`;
}

function receiverSvg(drops, r, x, on) {
  const tone = (d) => (d === 'low' ? `var(${r.low.tone})` : d === 'high' ? `var(${r.high.tone})` : `color-mix(in oklab, var(${r.low.tone}) 50%, var(${r.high.tone}))`);
  const layers = drops.map((d, i) => `<rect x="${x + 4}" y="${(150 - (i + 1) * 5).toFixed(1)}" width="34" height="5.4" fill="${tone(d)}"/>`).join('');
  return `${layers}<path d="M${x} 108 h42 v38 a6 6 0 0 1 -6 6 h-30 a6 6 0 0 1 -6 -6 Z" fill="none" stroke="${on ? 'var(--sim-accent)' : 'var(--sim-stroke)'}" stroke-width="3.5"/>`;
}

function rigSvg(r, s, numbered) {
  const run = runOf(r);
  const now = run[s.min];
  const hot = s.min > 0 && s.min < run.length - 1;
  const left = Math.max(0, 1 - s.drops.flat().length / 8);
  const top = 118 - 26 * left;
  const recvX = s.recv === 0 ? 196 : 252;
  const dripCol = now.drip === 'low' ? `var(${r.low.tone})` : now.drip === 'high' ? `var(${r.high.tone})` : `color-mix(in oklab, var(${r.low.tone}) 50%, var(${r.high.tone}))`;
  const drip = hot && now.drip ? `<circle cx="${recvX + 21}" cy="100" r="4.5" fill="${dripCol}"/>` : '';
  const badge = (x, y, n) => `<circle cx="${x}" cy="${y}" r="13" fill="var(--sim-accent)" stroke="var(--sim-stroke)" stroke-width="2"/><text x="${x}" y="${y + 6}" text-anchor="middle" class="dt-n">${n}</text>`;
  return `<svg class="dt-rig" viewBox="0 0 310 168" role="img" aria-label="A distillation set-up: flask over a burner, a sloping condenser, and two receivers">
    <path d="M12 160 h290" stroke="color-mix(in oklab, var(--sim-strata-2) 60%, var(--sim-stroke))" stroke-width="5"/>
    ${hot ? '<path d="M44 158 q6 -14 6 -20 q6 8 0 20 Z M56 158 q6 -16 5 -24 q8 10 1 24 Z" fill="var(--sim-flame)"/>' : ''}
    <path d="M36 158 l-6 -14 h60 l-6 14" fill="none" stroke="var(--sim-stroke)" stroke-width="2.5"/>
    <clipPath id="dt-bulb"><circle cx="55" cy="116" r="26"/></clipPath>
    <rect x="25" y="${top.toFixed(1)}" width="60" height="60" clip-path="url(#dt-bulb)" fill="color-mix(in oklab, var(${r.low.tone}) 50%, var(${r.high.tone}))" opacity="0.8"/>
    <circle cx="55" cy="116" r="26" fill="color-mix(in oklab, var(--sim-glass) 12%, transparent)" stroke="var(--sim-stroke)" stroke-width="3"/>
    <path d="M49 92 V58 h12 V92" fill="none" stroke="var(--sim-stroke)" stroke-width="3"/>
    <path d="M55 30 V66" stroke="var(--sim-stroke)" stroke-width="4"/><circle cx="55" cy="68" r="4.5" fill="var(--sim-bad)"/>
    <path d="M92 69 L208 88" stroke="var(--sim-stroke)" stroke-width="26" stroke-linecap="round"/>
    <path d="M92 69 L208 88" stroke="color-mix(in oklab, var(--sim-water) 50%, var(--sim-bg-cell))" stroke-width="21" stroke-linecap="round"/>
    <path d="M61 64 L232 92" stroke="var(--sim-stroke)" stroke-width="9" stroke-linecap="round"/>
    <path d="M61 64 L232 92" stroke="color-mix(in oklab, var(--sim-glass) 28%, var(--sim-bg-cell))" stroke-width="4" stroke-linecap="round"/>
    <path d="M232 92 L${recvX + 21} 100" stroke="var(--sim-stroke)" stroke-width="4" stroke-linecap="round"/>
    ${drip}${receiverSvg(s.drops[0], r, 196, s.recv === 0)}${receiverSvg(s.drops[1], r, 252, s.recv === 1)}
    ${numbered ? badge(22, 92, 1) + badge(150, 50, 2) + badge(217, 130, 3) : ''}
  </svg>`;
}

const CSS = `
.dt { background: var(--sim-bg-deep); border-radius: 14px; }
.dt .gm-check { display: none; }
.dt .board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 360px 290px minmax(0, 1fr); gap: 14px; align-items: start; }
.dt .col { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.dt .panel { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 14px; padding: 6px; }
.dt-rig, .dt-graph { display: block; width: 100%; height: auto; }
.dt-graph text { fill: var(--sim-label-muted); font-size: 14px; font-weight: 700; }
.dt-grid { stroke: color-mix(in oklab, var(--sim-stroke) 60%, transparent); stroke-width: 1; }
.dt-line { fill: none; stroke: var(--sim-bad); stroke-width: 4; stroke-linejoin: round; stroke-linecap: round; }
.dt-n { fill: var(--sim-bg-deep); font-size: 16px; font-weight: 800; }
.dt .k { font-size: 15px; font-weight: 700; color: var(--sim-label-muted); margin: 0; }
.dt .read { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0; font-variant-numeric: tabular-nums; }
.dt .row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.dt .row3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.dt .b { font-size: 15px; font-weight: 800; line-height: 1.15; padding: 4px 6px; border-radius: 12px; }
.dt .b[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 1px; }
.dt .b[data-state="y"] { border-color: var(--sim-good); }
.dt .b[data-state="n"] { border-color: var(--sim-warning); }
.dt .b:disabled, .dt .go:disabled { opacity: 0.45; cursor: default; box-shadow: none; }
.dt .go { width: 100%; min-height: 50px; border: 0; border-radius: 12px; background: var(--sim-accent); color: var(--sim-bg-deep); font-size: 16px; font-weight: 800;
  box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.dt .say { min-height: 20px; font-size: 15px; line-height: 1.3; margin: 0; font-weight: 700; }
.dt .say.good { color: var(--sim-good); font-weight: 800; }

.sim-dom-root--portrait .dt .board { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .dt .col { width: 100%; }
`;

export class DistillToOrderScene extends GameBoard {
  static simId = 'distill-to-order';
  static label = { en: 'Distil to Order' };
  static category = 'science.chemistry';
  static ARIA_LABEL = 'A distillation set-up beside a graph of temperature against time. Each card gives two liquids and their boiling points. Say if simple distillation will separate them, then heat one minute at a time and change to the second receiver when the reading climbs. A wide pair makes two flat stretches on the graph. A close pair makes none.';
  static OBJECTIVE = { prompt: { en: 'Read the two boiling points, say if they will separate, then run the set-up: each receiver must hold what the thermometer said.' } };
  static SCORING = { mode: 'accuracy', tolerance: 0 };

  constructor(container, config) {
    super(container, config);
    this._i = 0;
    this._st = this._fresh();
    this._labels = {};
    this._chip = null;
    this._won = ROUNDS.map(() => false);
    this._reported = false;
  }

  _fresh() { return { guess: null, min: 0, recv: 0, swapAt: null, drops: [[], []], verdict: null }; }
  _labelled() { return PARTS.every((p) => this._labels[p.id] === p.id); }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `<div class="gm dt"><div class="gm-head"><p class="kicker" id="dt-kick"></p><h2 id="dt-title"></h2><p class="sub" id="dt-sub"></p></div><div class="board" id="dt-board"></div></div>`,
    });
    this.root?.addEventListener?.('click', (e) => {
      const b = e.target instanceof Element ? e.target.closest('[data-act]') : null;
      if (b && !b.disabled) this._act(b.dataset.act, b.dataset.v);
    });
    this._paint();
    this.quill?.speak('Decide first, then heat.', 5200);
  }

  _act(name, v) {
    const r = ROUNDS[this._i], s = this._st;
    if (name === 'next') { this._i += 1; this._st = this._fresh(); return this._paint(); }
    if (name === 'chip') { this._chip = this._chip === v ? null : v; return this._paint(); }
    if (name === 'part') {
      if (!this._chip) return undefined;
      this._labels[v] = this._chip;
      this._chip = null;
      return this._paint();
    }
    if (r.label && !this._labelled()) return undefined;
    if (name === 'guess') { if (!s.guess) s.guess = v; return this._paint(); }
    if (!s.guess) return undefined;
    if (name === 'again') { this._st = this._fresh(); return this._paint(); }
    if (s.verdict) return undefined;
    if (name === 'heat') return this._heat(r, s);
    if (name === 'swap') {
      if (s.recv === 1 || s.min === 0) return undefined;
      s.recv = 1;
      s.swapAt = s.min;
      return this._paint();
    }
    return undefined;
  }

  _heat(r, s) {
    const run = runOf(r);
    if (s.min >= run.length - 1) return;
    s.min += 1;
    const d = run[s.min].drip;
    if (d) s.drops[s.recv].push(d);
    if (s.min >= run.length - 1) this._judge(r, s);
    this._paint();
    if (s.verdict?.ok && this._won.every(Boolean) && !this._reported) { this._reported = true; this.requestCheck?.(); }
  }

  _judge(r, s) {
    const [a, b] = s.drops;
    let ok, why = '';
    if (separates(r)) {
      ok = a.length > 0 && b.length > 0 && a.every((d) => d === 'low') && b.every((d) => d === 'high');
      if (!ok) {
        if (s.swapAt == null) why = `You did not change the receiver, so receiver 1 holds both liquids.`;
        else if (b.includes('low')) why = `You changed too early: the reading was still flat at ${r.low.bp} ${DEG}C.`;
        else why = `You changed too late: the second liquid was already in receiver 1.`;
      }
      if (s.guess === 'no') { ok = false; why = `Two flat stretches: they did separate. ${r.high.bp - r.low.bp} ${DEG}C apart is enough.`; }
    } else {
      ok = s.guess === 'no';
      why = ok ? '' : `The graph never went flat: both liquids came over together. ${r.high.bp - r.low.bp} ${DEG}C apart is too close.`;
    }
    s.verdict = { ok, why };
    if (ok) { this._won[this._i] = true; this.quill?.perform('hop'); } else this.quill?.setExpression('surprised');
  }

  checkObjective() {
    if (!this._won.every(Boolean)) return null;
    return { ok: true };
  }

  _paint() {
    const r = ROUNDS[this._i], s = this._st;
    const run = runOf(r);
    const q = (id) => this.root?.querySelector?.(id);
    const put = (id, html) => { const el = q(id); if (el) el.innerHTML = html; };
    put('#dt-kick', `Card ${this._i + 1} of ${ROUNDS.length}`);
    put('#dt-title', `<b>${esc(r.low.name)} ${r.low.bp} ${DEG}C</b> and <b>${esc(r.high.name)} ${r.high.bp} ${DEG}C</b>`);
    const needLabels = r.label && !this._labelled();
    put('#dt-sub', needLabels ? 'First label the set-up: tap a name, then tap its number.' : 'Say first if they will separate, then run it.');

    let side;
    if (needLabels) {
      const names = NAMES.map((n) => {
        const used = this._labels[n] === n;
        return `<button type="button" class="tap btn b" data-act="chip" data-v="${n}" aria-pressed="${this._chip === n}"${used ? ' disabled' : ''}>${n}</button>`;
      }).join('');
      const nums = PARTS.map((p) => {
        const got = this._labels[p.id];
        const st = got ? (got === p.id ? 'y' : 'n') : '';
        return `<button type="button" class="tap btn b" data-act="part" data-v="${p.id}" data-state="${st}" aria-label="Part ${p.n}">${p.n}${got ? `: ${got}` : ''}</button>`;
      }).join('');
      side = `<p class="k">Names</p><div class="row3">${names}</div><p class="k">Parts on the drawing</p><div class="row3">${nums}</div>`;
    } else {
      const g = (v, l) => {
        const mine = s.guess === v;
        return `<button type="button" class="tap btn b" data-act="guess" data-v="${v}" aria-pressed="${mine}"${s.guess && !mine ? ' disabled' : ''}>${l}</button>`;
      };
      const lock = !s.guess || !!s.verdict;
      const done = s.min >= run.length - 1;
      let end = '';
      if (s.verdict) {
        const last = this._i === ROUNDS.length - 1;
        end = s.verdict.ok
          ? `<p class="say good">${TICK} ${separates(r) ? `Receiver 1: ${esc(r.low.name)}. Receiver 2: ${esc(r.high.name)}.` : 'Right: no flat stretch, so no clean liquid.'}</p>`
            + (last ? '<p class="say good">All four cards done.</p>' : '<button type="button" class="tap go" data-act="next">Next card</button>')
          : `<p class="say">${CROSS} ${esc(s.verdict.why)}</p><button type="button" class="tap go" data-act="again">Run it again</button>`;
      }
      side = `<p class="k">Will simple distillation separate them?</p><div class="row">${g('yes', 'Yes')}${g('no', 'No, too close')}</div>`
        + `<div class="row"><button type="button" class="tap btn b" data-act="heat"${lock || done ? ' disabled' : ''}>Heat 1 minute</button>`
        + `<button type="button" class="tap btn b" data-act="swap"${lock || s.recv === 1 || s.min === 0 ? ' disabled' : ''}>Change to receiver 2</button></div>${end}`;
    }
    put('#dt-board', `
      <div class="col"><div class="panel">${rigSvg(r, s, needLabels)}</div></div>
      <div class="col"><div class="panel">${graphSvg(r, s)}</div><p class="read">${run[s.min].t} ${DEG}C <span class="k">after ${s.min} min</span></p></div>
      <div class="col">${side}</div>`);
  }
}
