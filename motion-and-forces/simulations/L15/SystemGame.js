/**
 * SystemGame - mini-game blk-l16-game (a system of objects). The L15 SystemScene world: the glassy ideal
 * floor (no friction), objects joined by strings or touching, a dashed "system" outline round them. The
 * thing that pulls or pushes (your hand on a thread, or you) stays OUTSIDE the outline.
 *   step 1  the horizontal forces are drawn (F, T, T, ... or F, P, P); tap an arrow (or its chip), then
 *           "internal" or "external". Right: external stays solid, internal fades; the chip shows its tag.
 *           Wrong: "Is the object that exerts this force inside the outline?" (Try again clears the line.)
 *           Vertical forces are left out (they balance).
 *   step 2  three accelerations. Right: Quill hops once; the whole system runs from rest, x = 1/2 a t^2 on a
 *           compressed clock (2 s of motion in 1.6 s), with an a arrow and equal-time dots (every 0.5 s) at
 *           the back of the system, so the gaps grow. Wrong: "Use only the external force and the total mass."
 * Rounds (fixed; _check() verifies the arithmetic): two boxes 3 kg + 2 kg on a string, F = 10 N (a = 2);
 * three 1 kg carts on two strings, F = 6 N (a = 2; the tensions 4 N and 2 N); you push two touching blocks
 * 4 kg + 1 kg, F = 10 N (a = 2; the contact pair 2 N). Never all choices right. No hint at landing.
 * Won after round 3 (finishGame). Keys: I / E sort the picked force, 1 2 3 pick an acceleration, Enter = action.
 *
 * Test notes (real controls: chips .sg-chip[data-i] in order, bins .sg-bin[data-b="int"|"ext"], choices .sg-acc[data-i]):
 *   R1: chip 0 + ext, chip 1 + int, chip 2 + int; then "2 m/s2" (choice 1); Next round (.sg-go).
 *   R2: chip 0 + ext, chips 1 2 3 4 + int each; then choice 2.  R3: chip 0 + ext, chips 1 2 + int; then choice 0: won.
 * Hooks: _sel(i), _sort('int'|'ext'), _acc(i), _go() (Try again / Next round / Play again), _state(), _check().
 * ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, clamp01, alpha, rr } from 'simulations/base/kit/SimLook.js';
import { drawBlock, propRig } from 'simulations/base/kit/SimProps.js';
import { trackSpec, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { drawForce, drawPusher } from '../shared/ForceCast.js';
import { drawMotionArrow } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';
import { SystemScene } from './SystemScene.js';
import { CartLabScene } from '../L12/CartLabScene.js';

const SYS = SystemScene.prototype, LAB = CartLabScene.prototype;
const W = 680, H = 300, FLOOR = 222, FH = 34, PXN = 16, PXM = 14, T_RUN = 1.6, T_BOOK = 2, SQ = '\u00b2';
const WRONG_SORT = 'Is the object that exerts this force inside the outline?';
const WRONG_ACC = 'Use only the external force and the total mass.';

// bodies left to right; forces: { on (body index), at ('front' | 'back' | 'contact'), dir (+1 right), n (newtons), label, chip, ext, lane (-1 above, +1 below) }
const ROUNDS = [
  { kind: 'string', F: 10, pull: 'hand',
    bodies: [{ name: 'Box 2', m: 2, w: 130, h: 108, tone: 2 }, { name: 'Box 1', m: 3, w: 150, h: 124, tone: 1 }],
    x0: 30, gap: 80,
    forces: [
      { on: 1, at: 'front', dir: 1, n: 10, label: 'F = 10 N', chip: 'F on Box 1', ext: true },
      { on: 1, at: 'back', dir: -1, n: 4, label: 'T', chip: 'T on Box 1', ext: false, lane: -1 },
      { on: 0, at: 'front', dir: 1, n: 4, label: 'T', chip: 'T on Box 2', ext: false, lane: 1 },
    ],
    acc: [10 / 3, 2, 5] },
  { kind: 'carts', F: 6, pull: 'hand',
    bodies: [{ name: 'cart 3', m: 1 }, { name: 'cart 2', m: 1 }, { name: 'cart 1', m: 1 }],
    x0: 10, gap: 60,
    forces: [
      { on: 2, at: 'front', dir: 1, n: 6, label: 'F = 6 N', chip: 'F on cart 1', ext: true },
      { on: 2, at: 'back', dir: -1, n: 4, label: 'T', chip: 'T on cart 1', ext: false, lane: -1 },
      { on: 1, at: 'front', dir: 1, n: 4, label: 'T', chip: 'T on cart 2 (right)', ext: false, lane: 1 },
      { on: 1, at: 'back', dir: -1, n: 2, label: 'T', chip: 'T on cart 2 (left)', ext: false, lane: -1 },
      { on: 0, at: 'front', dir: 1, n: 2, label: 'T', chip: 'T on cart 3', ext: false, lane: 1 },
    ],
    acc: [6, 3, 2] },
  { kind: 'push', F: 10, pull: 'you',
    bodies: [{ name: '4 kg', m: 4, w: 184, h: 124, tone: 5 }, { name: '1 kg', m: 1, w: 112, h: 86, tone: 2 }],
    x0: 196, gap: 0,
    forces: [
      { on: 0, at: 'back', dir: 1, n: 10, label: 'F = 10 N', chip: 'F on the 4 kg block', ext: true },
      { on: 0, at: 'contact', dir: -1, n: 2, label: 'P', chip: 'P on the 4 kg block', ext: false, lane: -1 },
      { on: 1, at: 'contact', dir: 1, n: 2, label: 'P', chip: 'P on the 1 kg block', ext: false, lane: 1 },
    ],
    acc: [2, 10, 2.5] },
];
const accText = (v) => `${Number.isInteger(v) ? v : (Math.round(v * 10) / 10).toFixed(1)} m/s${SQ}`;
const mass = (r) => r.bodies.reduce((s, b) => s + b.m, 0);
const aOf = (r) => r.F / mass(r);
const rightAcc = (r) => r.acc.findIndex((v) => Math.abs(v - aOf(r)) < 1e-9);

const CSS = `
.gm.sg { gap: 6px; }
.sg .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.sg .play { display: grid; grid-template-columns: 610px minmax(0, 1fr); gap: 14px; align-items: start; flex: 1; min-height: 0; }
.sg canvas { display: block; width: 100%; height: auto; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; touch-action: manipulation; }
.sg .side { display: flex; flex-direction: column; gap: 9px; min-width: 0; max-width: 460px; padding: 12px 14px;
            background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); }
.sg .ask { margin: 0; font: 800 18px/1.3 var(--sim-font-display); }
.sg .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.sg .row .tap { min-height: 48px; padding: 4px 12px; display: flex; align-items: center; justify-content: center; gap: 6px; font: 800 16px/1.15 var(--sim-font); text-align: center; }
.sg .row .tap[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 2px; background: var(--sim-bg-deep); }
.sg .sg-chip .tg { font-size: 14px; font-weight: 800; padding: 2px 6px; border-radius: var(--sim-radius-sm); background: var(--sim-bg-deep); color: var(--sim-label-muted); }
.sg .sg-chip[data-s="ext"] { border-color: var(--sim-series-3); }
.sg .sg-chip[data-s="int"] { opacity: 0.7; border-style: dashed; }
.sg .sg-chip[data-s]:not([data-s=""]) { pointer-events: none; }
.sg .sg-bin, .sg .sg-acc { min-width: 110px; }
.sg .sg-go { min-width: 140px; margin-left: auto; }
.sg .row[hidden], .sg .row .tap[hidden] { display: none; }
.sg .why { margin: 0; font-size: 16px; line-height: 1.3; font-weight: 700; }
.sg .why:empty { display: none; }
.sg .why[data-k="bad"] { color: var(--sim-bad); }
.sim-dom-root--portrait .sg .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .sg .side { padding: 10px; max-width: none; }
.sim-dom-root--portrait .sg .ask { font-size: 17px; }
.sim-dom-root--portrait .sg .row .tap { flex: 1 1 40%; min-width: 0; padding: 4px 6px; }
.sim-dom-root--portrait .sg .sg-go { flex-basis: 100%; margin-left: 0; }
.sim-dom-root--portrait .sg .why { font-size: 15px; }
`;

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

export class SystemGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'Tap each force and sort it: internal or external to the system. Then choose the acceleration of the whole system.' } };
  static ARIA_LABEL = 'Objects on a smooth floor with no friction, inside a dashed outline that marks the system: two boxes on a string pulled by your hand, three carts on two strings pulled by your hand, and two touching blocks that you push. Sort each horizontal force as internal (exerted by an object inside the outline) or external. Then pick the acceleration of the whole system: the external force divided by the total mass. When you are right, the whole system speeds up together.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm sg"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><canvas aria-hidden="true"></canvas>
        <div class="side"><p class="ask" aria-live="polite"></p>
        <div class="row chips"></div>
        <div class="row acts">
          <div class="tap btn sg-bin" role="button" tabindex="0" data-b="int">internal</div>
          <div class="tap btn sg-bin" role="button" tabindex="0" data-b="ext">external</div>
          ${[0, 1, 2].map((i) => `<div class="tap btn sg-acc" role="button" tabindex="0" aria-pressed="false" data-i="${i}"></div>`).join('')}
          <div class="tap btn sg-go" role="button" tabindex="0" hidden>Try again</div></div>
        <p class="why" aria-live="polite"></p></div></div></div>`,
    });
    this._chips();
    for (const el of this.root.querySelectorAll('.sg-bin')) onTap(el, () => this._sort(el.dataset.b));
    for (const el of this.root.querySelectorAll('.sg-acc')) onTap(el, () => this._acc(Number(el.dataset.i)));
    const go = this.root.querySelector('.sg-go');
    if (go) onTap(go, () => this._go());
    const cv = this.root.querySelector('canvas');
    cv?.addEventListener('click', (e) => this._canvasTap(e, cv));
    this.root.querySelector('.sg')?.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'i' || k === 'e') { e.preventDefault(); this._sort(k === 'i' ? 'int' : 'ext'); }
      else if (k === '1' || k === '2' || k === '3') { e.preventDefault(); this._acc(Number(k) - 1); }
      else if (e.key === 'Enter' && !e.target.closest?.('.tap')) { e.preventDefault(); this._go(); }
    });
    this._render();
  }

  _reset() { this._round = 0; this._load(); }
  _load() {
    cancelAnimationFrame(this._raf);
    this._step = 'sort'; this._pick = null; this._sorted = this._rd().forces.map(() => ''); this._accBad = null;
    this._line = ''; this._bad = false; this._t0 = null; this._age = 0; this._geo = [];
    this._chips();
  }
  _rd() { return ROUNDS[Math.min(this._round, ROUNDS.length - 1)]; }
  _done() { return this._round >= ROUNDS.length; }

  /** The arithmetic of every round: a = F / total mass is one of the choices, the only one, and tensions fit. */
  _check() {
    return ROUNDS.map((r) => {
      const a = aOf(r), ok = r.acc.filter((v) => Math.abs(v - a) < 1e-9).length === 1;
      // each internal force = (mass it accelerates) x a: the force on body i from the side away from F
      const fit = r.forces.every((f) => f.ext || Math.abs(f.n - this._expect(r, f)) < 1e-9);
      return `${r.kind} a=${a} choiceOk=${ok} forcesOk=${fit}`;
    }).join('; ');
  }
  _expect(r, f) {
    const m = r.bodies.map((b) => b.m), a = aOf(r);
    if (r.kind === 'push') return m[1] * a;                          // the contact pair accelerates the 1 kg block
    const behind = (i) => m.slice(0, i + 1).reduce((s, v) => s + v, 0);  // the string ahead of body i pulls bodies 0..i
    return f.at === 'front' ? behind(f.on) * a : behind(f.on - 1) * a;
  }

  _chips() {
    const box = this.root?.querySelector('.chips');
    if (!box) return;
    box.innerHTML = this._rd().forces.map((f, i) => `<div class="tap btn sg-chip" role="button" tabindex="0" aria-pressed="false" data-i="${i}" data-s=""><span class="nm">${f.chip}</span><span class="tg" hidden></span></div>`).join('');
    for (const el of box.querySelectorAll('.sg-chip')) onTap(el, () => this._sel(Number(el.dataset.i)));
  }

  _sel(i) {
    if (this._done() || this._step !== 'sort' || !(i >= 0 && i < this._sorted.length) || this._sorted[i]) return;
    this._pick = i; this._bad = false; this._line = '';
    this._render();
  }

  _sort(b) {
    if (this._done() || this._step !== 'sort') return;
    if (this._pick == null) { this._line = 'Tap a force first.'; this._bad = false; this._render(); return; }
    const f = this._rd().forces[this._pick];
    if ((b === 'ext') === f.ext) {
      this._sorted[this._pick] = b; this._pick = null; this._bad = false; this._line = '';
      if (this._sorted.every((s) => s)) this._step = 'acc';
    } else {
      this._bad = true; this._line = WRONG_SORT;
    }
    this._render();
  }

  _acc(i) {
    if (this._done() || this._step !== 'acc' || !(i >= 0 && i < 3)) return;
    const r = this._rd();
    if (i === rightAcc(r)) {
      this._step = 'won'; this._accBad = null; this._bad = false;
      this._line = `Right: a = ${r.F} N / ${mass(r)} kg = ${accText(aOf(r))}. The whole system speeds up together.`;
      this._cheer();
      if (this._round === ROUNDS.length - 1) { this._round = ROUNDS.length; finishGame(this); }
      this._t0 = performance.now(); this._animate();
    } else {
      this._accBad = i; this._bad = true; this._line = WRONG_ACC;
    }
    this._render();
  }

  /** Try again (clears the wrong try, keeps the board), Next round, Play again. */
  _go() {
    if (this._done()) { this._reset(); this._render(); return; }
    if (this._step === 'won') { this._round += 1; this._load(); this._render(); return; }
    if (this._bad) { this._bad = false; this._line = ''; this._accBad = null; this._render(); }
  }

  /** The find: once per round, from the right-answer branch only. */
  _cheer() { this.quill?.perform('hop'); }

  _state() {
    const done = this._done(), r = this._rd();
    return `round ${Math.min(this._round + 1, ROUNDS.length)}/${ROUNDS.length} ${r.kind} step ${done ? 'won' : this._step} sorted ${this._sorted.map((s) => s || '-').join(',')} pick ${this._pick ?? '-'} line ${this._line || '-'}${done ? ' won' : ''}`;
  }

  _canvasTap(e, cv) {
    if (this._step !== 'sort' || this._done()) return;
    const b = cv.getBoundingClientRect(), px = (e.clientX - b.left) / b.width * W, py = (e.clientY - b.top) / b.height * H;
    let best = -1, bd = 30;
    this._geo.forEach((g, i) => {
      if (this._sorted[i]) return;
      const d = segDist(px, py, g.x, g.y, g.x2, g.y2);
      if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0) this._sel(best);
  }

  _animate() {
    cancelAnimationFrame(this._raf);
    const step = (now) => {
      this._age = Math.min(T_RUN + 0.5, (now - this._t0) / 1000);
      this._paint();
      if (this._age < T_RUN + 0.5) this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  _render() {
    const root = this.root, g = root?.querySelector('.gm');
    if (!g) return;
    const done = this._done(), r = this._rd(), st = done ? 'won' : this._step;
    root.querySelector('.sub').textContent = done ? 'All three rounds done.' : `Round ${this._round + 1} of ${ROUNDS.length}`;
    const left = this._sorted.filter((s) => !s).length;
    root.querySelector('.ask').textContent = st === 'sort'
      ? (this._pick == null ? `Tap a force, then sort it. ${left} to sort.` : `${r.forces[this._pick].chip}: internal or external?`)
      : st === 'acc' ? 'What is the acceleration of the whole system?' : `The whole system: a = ${accText(aOf(r))}.`;
    for (const el of root.querySelectorAll('.sg-chip')) {
      const i = Number(el.dataset.i), s = this._sorted[i] ?? '', tg = el.querySelector('.tg');
      el.setAttribute('aria-pressed', i === this._pick ? 'true' : 'false');
      el.dataset.s = s;
      tg.hidden = !s; tg.textContent = s === 'ext' ? 'external' : s === 'int' ? 'internal' : '';
    }
    for (const el of root.querySelectorAll('.sg-bin')) el.hidden = st !== 'sort';
    for (const el of root.querySelectorAll('.sg-acc')) {
      const i = Number(el.dataset.i);
      el.hidden = st === 'sort';
      el.textContent = accText(r.acc[i]);
      el.setAttribute('aria-pressed', (st === 'won' && i === rightAcc(r)) || i === this._accBad ? 'true' : 'false');
      el.style.pointerEvents = st === 'acc' ? '' : 'none';
    }
    const go = root.querySelector('.sg-go');
    if (go) {
      go.hidden = !(done || st === 'won' || this._bad);
      go.textContent = done ? 'Play again' : st === 'won' ? 'Next round' : 'Try again';
    }
    const w = root.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    if (st !== 'won') this._age = 0;
    this._paint();
    this.relayout?.();
  }

  _ctx(cv) {
    const css = cv.clientWidth || W, dpr = Math.min(2, window.devicePixelRatio || 1), k = css / W * dpr;
    const bw = Math.round(W * k), bh = Math.round(H * k);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    cv.style.aspectRatio = `${W} / ${H}`;
    const ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, W, H);
    return ctx;
  }

  /** Book time shown so far (0..T_BOOK) and the shift in px: x = 1/2 a t^2. */
  _run() {
    const st = this._done() ? 'won' : this._step;
    if (st !== 'won') return { t: 0, d: 0 };
    const t = T_BOOK * Math.min(1, this._age / T_RUN);
    return { t, d: PXM * 0.5 * aOf(this._rd()) * t * t };
  }

  /** Draw the bodies at shift d; returns [{ x0, x1, top, ty }] (ty = string height). */
  bodies(ctx, c, r, d) {
    const out = [], rig = propRig({ x0: 0, groundY: FLOOR, scale: 1 });
    let x = r.x0 + d;
    for (const b of r.bodies) {
      if (r.kind === 'carts') {
        const ct = LAB.labCart.call(LAB, ctx, c, x, FLOOR, { k: 0.84, s: d });
        out.push({ x0: ct.back, x1: ct.front, top: ct.top, ty: ct.ty, cx: ct.cx });
        drawTag(ctx, c, `${b.name}: ${b.m} kg`, ct.cx, FLOOR + FH + 22, { size: 22, prefer: [[0, 0]] });
        x = ct.front + r.gap;
      } else {
        const bl = drawBlock(ctx, c, rig, x + b.w / 2, { w: b.w, h: b.h, tone: b.tone });
        if (r.kind === 'push') SYS.boxText.call(SYS, ctx, c, bl, b.m === 1 ? b.name : '', b.m === 1 ? '' : b.name, c['s' + b.tone]);
        else SYS.boxText.call(SYS, ctx, c, bl, b.name, `${b.m} kg`, c['s' + b.tone]);
        out.push({ x0: bl.x0, x1: bl.x0 + b.w, top: bl.y0, ty: FLOOR - 48, cx: bl.x0 + b.w / 2 });
        x = bl.x0 + b.w + r.gap;
      }
    }
    return out;
  }

  /** Where each force arrow sits: tail on its object. */
  arrows(r, B) {
    return r.forces.map((f) => {
      const b = B[f.on], len = f.n * PXN, ang = f.dir > 0 ? 0 : Math.PI;
      let x, y;
      if (r.kind === 'push') {
        if (f.at === 'back') { x = b.x0 + 4; y = b.top + 42; }
        else { x = f.dir > 0 ? b.x0 + 2 : b.x1 - 2; y = f.lane < 0 ? FLOOR - 56 : FLOOR - 22; }
      } else if (f.ext) { x = b.x1; y = b.ty; }
      else { x = f.at === 'front' ? b.x1 + 2 : b.x0 - 2; y = b.ty + (f.lane < 0 ? -13 : 13); }
      return { f, x, y, len, ang, x2: x + Math.cos(ang) * len, y2: y };
    });
  }

  _paint() {
    const cv = this.root?.querySelector('canvas');
    if (!cv) return;
    const c = loadColors(this.root), ctx = this._ctx(cv), r = this._rd(), st = this._done() ? 'won' : this._step;
    const { t, d } = this._run(), a = aOf(r);
    SYS.idealFloor.call(SYS, ctx, c, 0, W, FLOOR, FH);
    // equal-time dots at the back of the system, after the run (every 0.5 s of book time)
    if (st === 'won' && t >= T_BOOK - 1e-6) {
      const xs = [0, 0.5, 1, 1.5, 2].map((k) => r.x0 + PXM * 0.5 * a * k * k);
      drawStrobe(ctx, c, trackSpec({ from: 0, to: W, x0: 0, x1: W, y: FLOOR }), { at: xs, marks: 'dots' });
    }
    if (r.pull === 'you') {
      const b0x = r.x0 + d;
      drawPusher(ctx, c, { at: { x: b0x, y: FLOOR - 92 }, y: FLOOR, height: 176, effort: 0.6 });
    }
    const B = this.bodies(ctx, c, r, d);
    for (let i = 0; i + 1 < B.length; i++) if (r.kind !== 'push') SYS.string.call(SYS, ctx, c, { x: B[i].x1, y: B[i].ty }, { x: B[i + 1].x0, y: B[i + 1].ty });
    const last = B[B.length - 1];
    if (r.pull === 'hand') this.hand(ctx, c, last, r);
    // the system outline: round the bodies only (the hand or you stay outside)
    const o = { x0: B[0].x0 - 14, x1: last.x1 + 14, y0: Math.min(...B.map((b) => b.top)) - 20, y1: FLOOR + 8 };
    ctx.save(); rr(ctx, o.x0, o.y0, o.x1 - o.x0, o.y1 - o.y0, 18); ctx.fillStyle = alpha(c.accent, 0.06); ctx.fill();
    ctx.setLineDash([12, 9]); ctx.lineWidth = 3.5; ctx.strokeStyle = c.accent; ctx.stroke(); ctx.restore();
    drawTag(ctx, c, 'system', o.x0, o.y0 - 20, { size: 24, col: c.accent, align: 'left', prefer: [[0, 0]] });
    // the forces
    const ar = this.arrows(r, B);
    this._geo = ar;
    ar.forEach((g, i) => {
      const s = this._sorted[i], k = s === 'int' ? 0.25 : 1;
      if (i === this._pick) {
        const x0 = Math.min(g.x, g.x2) - 10, w = Math.abs(g.x2 - g.x) + 20;
        ctx.save(); rr(ctx, x0, g.y - 17, w, 34, 12); ctx.fillStyle = alpha(c.accent, 0.16); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = this._bad ? c.bad : c.accent; ctx.stroke(); ctx.restore();
      }
      const side = g.f.lane > 0 ? -1 : 1;
      drawForce(ctx, c, g.x, g.y, { length: g.len, angle: g.ang, label: g.f.label, side: g.ang ? -side : side, alpha: k, fit: false, size: 24 });
    });
    if (this._sorted.some((s) => s === 'int') && this._sorted.every((s) => s)) {
      const top = r.kind === 'carts';
      drawTag(ctx, c, 'internal', top ? o.x0 + 170 : (o.x0 + o.x1) / 2 + (r.kind === 'push' ? 60 : 0), top ? o.y0 - 20 : FLOOR + FH + 24, { size: 22, col: c.labelMuted, prefer: [[0, 0]] });
    }
    if (st === 'won') {
      drawMotionArrow(ctx, c, 'a', (o.x0 + o.x1) / 2 + 20, o.y0 - 30, { length: a * 30, label: `a = ${accText(a)}`, side: 1, size: 24 });
    }
  }

  /** Your hand on a thread from the front body (the CartLab hand and sleeve, as in ForceMassGame). */
  hand(ctx, c, b, r) {
    // the thread runs from the front hook under the F arrow and shows for about 40 px past its head (hand inside the canvas in the carts round)
    const ty = b.ty, hx = b.x1 + r.F * PXN + 62;
    SYS.string.call(SYS, ctx, c, { x: b.x1, y: ty }, { x: hx + 6, y: ty });
    const HL = 56, P = { x: hx + 14, y: ty }, E = { x: P.x + 90, y: ty + 28 }, S = { x: P.x + 140, y: -40 };
    LAB.limb.call(LAB, ctx, S.x, S.y, E.x, E.y, 0.44 * HL, c.s4);
    LAB.hand.call(LAB, ctx, c, P, { len: HL, view: 'back', dir: Math.PI, palm: 1, arm: E });
  }

  checkObjective() { return this._done() ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
