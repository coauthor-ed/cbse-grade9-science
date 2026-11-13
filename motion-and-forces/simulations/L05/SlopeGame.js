/**
 * SlopeGame - mini-game blk-l05-game. A position-time graph (0-6 s, 0-120 m) with two points
 * A and B that the learner drags (snap: whole seconds, 10 m). The line runs through them and
 * the kit slope triangle shows BC and CA live, with BC / CA beside the board.
 * Three rounds from a fixed list: make 20 m/s, then 10 m/s, then 15 m/s. Many answers are right:
 * Check accepts any A, B with B later than A and BC / CA equal to the target.
 * No hint at landing; a wrong Check gives one line. Won after round 3 (finishGame).
 * Points also move by keyboard: arrow keys on a focused point (left/right 1 s, up/down 10 m).
 * Canvas drawing depends only on the round and the two points. ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors } from 'simulations/base/kit/SimLook.js';
import { slopeTriangle } from 'simulations/base/kit/SimPlot.js';
import { graphFrame, drawGraphPaper, drawAxes, drawPoint } from '../shared/MotionGraph.js';

const T_MAX = 6, X_MAX = 120;
const ROUNDS = [
  { v: 20, A: [1, 20], B: [4, 50] },     // starts at 10 m/s
  { v: 10, A: [1, 20], B: [3, 80] },     // starts at 30 m/s
  { v: 15, A: [0, 10], B: [2, 50] },     // starts at 20 m/s
];
const GW = 400, GH = 380, SIZE = 24;
const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(1)));

const CSS = `
.gm.sg { gap: 6px; }
.sg .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.sg .play { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 18px; align-items: start; flex: 1; min-height: 0; }
.sg .graph { position: relative; width: 100%; }
.sg canvas { display: block; width: 100%; height: auto; }
.sg .hdl { position: absolute; width: 48px; height: 48px; margin: -24px 0 0 -24px; border-radius: 50%;
           touch-action: none; cursor: grab; background: transparent; border: 0; box-shadow: none; padding: 0; }
.sg .hdl:active { transform: none; box-shadow: none; cursor: grabbing; }
.sg .hdl:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: -4px; }
.sg .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; max-width: 540px; margin-top: 8px; padding: 12px 14px;
             background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); }
.sg .goal { align-self: flex-start; font: 800 20px/1.2 var(--sim-font-display); padding: 0; }
.sg .goal b { color: var(--sim-series-1-ink); }
.sg .reads { display: grid; grid-template-columns: auto auto; justify-content: start; column-gap: 14px; row-gap: 2px; font-size: 18px; font-weight: 700; }
.sg .reads .k { color: var(--sim-label-muted); }
.sg .reads .big { font-size: 22px; font-weight: 800; color: var(--sim-label); }
.sg .acts { display: flex; gap: 8px; }
.sg .acts .tap { flex: 0 0 auto; min-width: 170px; display: flex; align-items: center; justify-content: center; }
.sg .why { margin: 0; min-height: 44px; font-size: 16px; line-height: 1.3; font-weight: 700; }
.sg .why[data-k="bad"] { color: var(--sim-bad); }
.sg[data-done="1"] .acts .sg-go { display: none; }
.sg .acts .sg-again { display: none; }
.sg[data-done="1"] .acts .sg-again { display: flex; }
.sim-dom-root--portrait .sg .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .sg .side { margin-top: 0; padding: 10px; max-width: none; }
.sim-dom-root--portrait .sg .goal { font-size: 18px; }
.sim-dom-root--portrait .sg .reads { font-size: 16px; }
.sim-dom-root--portrait .sg .reads .big { font-size: 19px; }
.sim-dom-root--portrait .sg .acts .tap { flex: 1 1 0; min-width: 0; }
.sim-dom-root--portrait .sg .why { font-size: 15px; }
`;

export class SlopeGame extends GameBoard {
  static HEIGHT = 370;
  static OBJECTIVE = { prompt: { en: 'Drag the two points on the position-time graph so that the line shows the velocity asked for. The triangle shows BC / CA as you drag.' } };
  static ARIA_LABEL = 'A position-time graph from 0 to 6 seconds and 0 to 120 metres with two points, A and B, joined by a line. Drag the points, or move them with the arrow keys, so that the slope BC / CA equals the velocity asked for, then check. Three rounds: 20, 10 and 15 metres per second.';

  async setup() {
    await super.setup();
    this._reset();
    const hdl = (k) => `<div class="hdl" role="slider" tabindex="0" data-k="${k}" aria-label="Point ${k}"></div>`;
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm sg"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="graph"><canvas class="g" aria-hidden="true"></canvas>${hdl('A')}${hdl('B')}</div>
        <div class="side"><div class="goal"></div>
        <div class="reads" aria-live="polite"><span class="k">BC</span><span class="bc"></span><span class="k">CA</span><span class="ca"></span><span class="k">BC / CA</span><span class="big sl"></span></div>
        <div class="acts"><div class="tap btn gm-check sg-go" role="button" tabindex="0">Check</div>
        <div class="tap btn sg-again" role="button" tabindex="0">Play again</div></div>
        <p class="why" aria-live="polite"></p></div></div></div>`,
    });
    this.root.querySelectorAll('.hdl').forEach((el) => this._wire(el));
    const go = this.root.querySelector('.sg-go'), again = this.root.querySelector('.sg-again');
    if (go) onTap(go, () => this._go());
    if (again) onTap(again, () => { this._reset(); this._render(); });
    this._render();
  }

  _reset() { this._round = 0; this._load(); }

  _load() {
    const r = ROUNDS[Math.min(this._round, ROUNDS.length - 1)];
    this._P = { A: [...r.A], B: [...r.B] };
    this._ok = false; this._line = ''; this._bad = false; this._drag = null;
  }

  _frame() {
    return graphFrame({ x: 0, y: 0, w: GW, h: GH }, { size: SIZE, x: { max: T_MAX, step: 1, minor: 2, title: 'time (s)' }, y: { max: X_MAX, step: 20, minor: 2, title: 'position (m)' } });
  }

  /** Move point k to data d (snapped, clamped); clears the verdict line. */
  _set(k, d) {
    if (this._ok || this._round >= ROUNDS.length) return;
    const t = Math.max(0, Math.min(T_MAX, Math.round(d[0]))), x = Math.max(0, Math.min(X_MAX, Math.round(d[1] / 10) * 10));
    const p = this._P[k];
    if (p[0] === t && p[1] === x) return;
    this._P[k] = [t, x]; this._line = ''; this._bad = false;
    this._render();
  }

  _wire(el) {
    const k = el.dataset.k;
    el.addEventListener('pointerdown', (e) => {
      if (this._ok) return;
      e.preventDefault(); el.focus?.({ preventScroll: true }); el.setPointerCapture?.(e.pointerId); this._drag = k; this._paint();
    });
    el.addEventListener('pointermove', (e) => {
      if (this._drag !== k) return;
      const cv = this.root.querySelector('canvas.g'), b = cv.getBoundingClientRect(), f = this._frame();
      const x = (e.clientX - b.left) / b.width * GW, y = (e.clientY - b.top) / b.height * GH;
      this._set(k, [f.vx(x), f.vy(y)]);
    });
    const up = (e) => { if (this._drag === k) { this._drag = null; el.releasePointerCapture?.(e.pointerId); this._paint(); } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key];
      if (!step) return;
      e.preventDefault();
      const p = this._P[k]; this._set(k, [p[0] + step[0], p[1] + step[1]]);
    });
    el.addEventListener('focus', () => this._paint());
    el.addEventListener('blur', () => this._paint());
  }

  _go() {
    if (this._round >= ROUNDS.length) return;
    if (this._ok) {                                        // next round
      this._round += 1; this._load(); this._render(); return;
    }
    const r = ROUNDS[this._round], { A, B } = this._P, ca = B[0] - A[0], bc = B[1] - A[1];
    if (ca <= 0) { this._bad = true; this._line = 'Put B later in time than A.'; this._render(); return; }
    const v = bc / ca;
    if (Math.abs(v - r.v) < 1e-9) {
      this._ok = true; this._bad = false;
      this._line = `Right: BC / CA = ${bc} m / ${ca} s = ${r.v} m/s.`;
      if (this._round === ROUNDS.length - 1) { this._round = ROUNDS.length; finishGame(this); }
    } else {
      this._bad = true;
      this._line = `BC / CA = ${fmt(v)} m/s. ${v < r.v ? 'Make the line steeper' : 'Make the line less steep'}: change BC or CA.`;
    }
    this._render();
  }

  _render() {
    const r = this.root, g = r?.querySelector('.gm');
    if (!g) return;
    const done = this._round >= ROUNDS.length, rd = ROUNDS[Math.min(this._round, ROUNDS.length - 1)];
    g.dataset.done = done ? '1' : '0';
    r.querySelector('.sub').textContent = done ? 'All three lines made.' : `Line ${this._round + 1} of 3: drag A and B.`;
    r.querySelector('.goal').innerHTML = `Make the velocity <b>${rd.v} m/s</b>`;
    const { A, B } = this._P, ca = B[0] - A[0], bc = B[1] - A[1];
    r.querySelector('.bc').textContent = `${bc} m`;
    r.querySelector('.ca').textContent = `${ca} s`;
    r.querySelector('.sl').textContent = ca > 0 ? `${fmt(bc / ca)} m/s` : '-';
    const go = r.querySelector('.sg-go');
    if (go) go.textContent = this._ok ? 'Next line' : 'Check';
    const w = r.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    const f = this._frame();
    r.querySelectorAll('.hdl').forEach((el) => {
      const d = this._P[el.dataset.k], [x, y] = f.at(d);
      Object.assign(el.style, { left: (x / GW * 100) + '%', top: (y / GH * 100) + '%' });
      el.setAttribute('aria-valuetext', `${el.dataset.k} at ${d[0]} s, ${d[1]} m`);
      el.setAttribute('aria-disabled', this._ok || done ? 'true' : 'false');
    });
    this._paint();
    this.relayout?.();
  }

  _ctx(cv, w, h) {
    const css = cv.clientWidth || w, dpr = Math.min(2, window.devicePixelRatio || 1), k = css / w * dpr;
    const bw = Math.round(w * k), bh = Math.round(h * k);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    cv.style.aspectRatio = `${w} / ${h}`;
    const ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, w, h);
    return ctx;
  }

  _paint() {
    const cv = this.root?.querySelector('canvas.g');
    if (!cv) return;
    const c = loadColors(this.root), ctx = this._ctx(cv, GW, GH), f = this._frame(), p = f.plot;
    const { A, B } = this._P, good = this._ok || this._round >= ROUNDS.length;
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, 99);
    // The line through A and B, across the plot (clipped to it).
    ctx.save();
    ctx.beginPath(); ctx.rect(p.x, p.y, p.w, p.h); ctx.clip();
    if (A[0] !== B[0] || A[1] !== B[1]) {
      const [ax, ay] = f.at(A), [bx, by] = f.at(B), dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, e = 2000 / L;
      ctx.strokeStyle = good ? c.good : c.s1; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ax - dx * e, ay - dy * e); ctx.lineTo(bx + dx * e, by + dy * e); ctx.stroke();
    }
    ctx.restore();
    if (B[0] > A[0] && B[1] !== A[1]) slopeTriangle(ctx, c, f, A, B, { size: SIZE, letters: false, col: c.annot });
    // Corner letters by hand so they sit beside the dots: A, B on the far side of the line, C at the corner.
    const lab = (t, x, y, col) => {
      ctx.save(); ctx.font = `800 ${SIZE}px ${c.fontDisplay || c.fontBody || 'sans-serif'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 6; ctx.strokeStyle = c.bgSurface; ctx.lineJoin = 'round'; ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y); ctx.restore();
    };
    const focus = this.root.querySelector('.hdl:focus-visible')?.dataset.k;
    for (const k of ['A', 'B']) {
      const d = this._P[k], hot = this._drag === k || focus === k;
      if (hot) { const [x, y] = f.at(d); ctx.save(); ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fillStyle = c.annot; ctx.globalAlpha = 0.18; ctx.fill(); ctx.restore(); }
      drawPoint(ctx, c, f, d, 9, { r: 11, col: c.s1 });
    }
    const [ax, ay] = f.at(A), [bx, by] = f.at(B);
    const left = ax <= bx;
    lab('A', ax + (left ? -24 : 24), ay - 22, c.label);
    lab('B', bx + (left ? -24 : 24), by - 22, c.label);
    if (B[0] > A[0] && B[1] !== A[1]) lab('C', bx + 20, ay + (by < ay ? 22 : -22), c.annot);
  }

  checkObjective() { return this._round >= ROUNDS.length ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
}
