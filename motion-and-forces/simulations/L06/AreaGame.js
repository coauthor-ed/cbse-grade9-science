/**
 * AreaGame - mini-game blk-l06-game. A velocity-time graph with the area under the line shaded
 * from t = 0 to a right edge the learner drags (snap: whole seconds, 1 to 6 s; arrow keys too).
 * A live readout writes the area as the sum the student would write, and a car on a road strip
 * under it moves to the area's metres (area = displacement, felt), with a flag at the target.
 * Rounds from a fixed list:
 *   1  flat line at 8 m/s, target 40 m (edge 5 s)
 *   2  flat line at 12 m/s, target 36 m (edge 3 s)
 *   3  from rest, a = 2 m/s2 (v = 2t), target 25 m (edge 5 s: 1/2 x 5 s x 10 m/s)
 * No hint at landing; a wrong Check gives one line. Won after round 3 (finishGame).
 * Canvas drawing depends only on the round, the edge and the car's eased position. ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, clamp01 } from 'simulations/base/kit/SimLook.js';
import { areaUnder } from 'simulations/base/kit/SimPlot.js';
import { trackSpec, drawTrack, drawScale } from 'simulations/base/kit/SimTrack.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { graphFrame, drawGraphPaper, drawAxes, drawTag } from '../shared/MotionGraph.js';

const T_MAX = 6, SUP2 = '\u00b2';
const ROUNDS = [
  { kind: 'flat', v: 8, target: 40, start: 2, road: 50 },
  { kind: 'flat', v: 12, target: 36, start: 5, road: 80 },
  { kind: 'ramp', a: 2, target: 25, start: 2, road: 40 },
];
const GW = 400, GH = 380, SIZE = 24, RW = 600, RH = 190;
const vAt = (r, t) => (r.kind === 'flat' ? r.v : r.a * t);
const areaOf = (r, e) => (r.kind === 'flat' ? r.v * e : 0.5 * e * r.a * e);
const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(1)));

const CSS = `
.gm.ag { gap: 6px; }
.ag .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.ag .play { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 18px; align-items: start; flex: 1; min-height: 0; }
.ag .graph { position: relative; width: 100%; }
.ag canvas { display: block; width: 100%; height: auto; }
.ag .road canvas { max-width: 380px; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; }
.ag .hdl { position: absolute; width: 48px; height: 56px; margin: -28px 0 0 -24px; touch-action: none; cursor: ew-resize;
           background: transparent; border: 0; box-shadow: none; padding: 0; border-radius: 12px; }
.ag .hdl:active { transform: none; box-shadow: none; }
.ag .hdl:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: -2px; }
.ag .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; max-width: 540px; margin-top: 8px; padding: 12px 14px;
             background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); }
.ag .goal { align-self: flex-start; font: 800 20px/1.2 var(--sim-font-display); padding: 0; }
.ag .goal b { color: var(--sim-series-4-ink); }
.ag .sum { margin: 0; font-size: 19px; font-weight: 800; line-height: 1.3; }
.ag .acts { display: flex; gap: 12px; align-items: center; }
.ag .acts .why { flex: 1 1 0; min-width: 0; }
.ag .acts .tap { flex: 0 0 auto; min-width: 170px; display: flex; align-items: center; justify-content: center; }
.ag .why { margin: 0; min-height: 44px; font-size: 16px; line-height: 1.3; font-weight: 700; }
.ag .why[data-k="bad"] { color: var(--sim-bad); }
.ag[data-done="1"] .acts .ag-go { display: none; }
.ag .acts .ag-again { display: none; }
.ag[data-done="1"] .acts .ag-again { display: flex; }
.sim-dom-root--portrait .ag .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .ag .side { margin-top: 0; padding: 10px; max-width: none; }
.sim-dom-root--portrait .ag .goal { font-size: 18px; }
.sim-dom-root--portrait .ag .sum { font-size: 17px; }
.sim-dom-root--portrait .ag .acts { flex-direction: column; align-items: stretch; }
.sim-dom-root--portrait .ag .acts .tap { flex: 1 1 auto; min-width: 0; }
.sim-dom-root--portrait .ag .road canvas { max-width: none; }
.sim-dom-root--portrait .ag .why { font-size: 15px; }
`;

export class AreaGame extends GameBoard {
  static HEIGHT = 370;
  static OBJECTIVE = { prompt: { en: 'Drag the edge of the shaded area under the velocity-time graph until the area equals the displacement asked for.' } };
  static ARIA_LABEL = 'A velocity-time graph with the area under the line shaded from 0 seconds to an edge you can drag, or move with the arrow keys, in steps of 1 second. The area is written as a sum, and a car on a road below moves the same number of metres. Make the area equal the displacement asked for, then check. Three rounds.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm ag"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="graph"><canvas class="g" aria-hidden="true"></canvas>
        <div class="hdl" role="slider" tabindex="0" aria-label="Right edge of the area" aria-valuemin="1" aria-valuemax="${T_MAX}"></div></div>
        <div class="side"><div class="goal"></div><p class="sum" aria-live="polite"></p>
        <div class="road"><canvas class="r" aria-hidden="true"></canvas></div>
        <div class="acts"><div class="tap btn gm-check ag-go" role="button" tabindex="0">Check</div>
        <div class="tap btn ag-again" role="button" tabindex="0">Play again</div>
        <p class="why" aria-live="polite"></p></div></div></div></div>`,
    });
    this._wire(this.root.querySelector('.hdl'));
    const go = this.root.querySelector('.ag-go'), again = this.root.querySelector('.ag-again');
    if (go) onTap(go, () => this._go());
    if (again) onTap(again, () => { this._reset(); this._render(); });
    this._render();
  }

  _reset() { this._round = 0; this._load(); }

  _load() {
    const r = ROUNDS[Math.min(this._round, ROUNDS.length - 1)];
    this._e = r.start; this._car = areaOf(r, r.start);
    this._ok = false; this._line = ''; this._bad = false; this._drag = false;
  }

  _rd() { return ROUNDS[Math.min(this._round, ROUNDS.length - 1)]; }

  _frame() {
    return graphFrame({ x: 0, y: 0, w: GW, h: GH }, { size: SIZE, x: { max: T_MAX, step: 1, minor: 2, title: 'time (s)' }, y: { max: 12, step: 2, minor: 2, title: 'velocity (m/s)' } });
  }

  _set(e) {
    if (this._ok || this._round >= ROUNDS.length) return;
    const v = Math.max(1, Math.min(T_MAX, Math.round(e)));
    if (v === this._e) return;
    this._e = v; this._line = ''; this._bad = false;
    this._render(); this._animate();
  }

  _wire(el) {
    if (!el) return;
    el.addEventListener('pointerdown', (e) => {
      if (this._ok) return;
      e.preventDefault(); el.focus?.({ preventScroll: true }); el.setPointerCapture?.(e.pointerId); this._drag = true; this._paint();
    });
    el.addEventListener('pointermove', (e) => {
      if (!this._drag) return;
      const cv = this.root.querySelector('canvas.g'), b = cv.getBoundingClientRect();
      this._set(this._frame().vx((e.clientX - b.left) / b.width * GW));
    });
    const up = (e) => { if (this._drag) { this._drag = false; el.releasePointerCapture?.(e.pointerId); this._paint(); } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('keydown', (e) => {
      const d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
      if (!d) return;
      e.preventDefault(); this._set(this._e + d);
    });
    el.addEventListener('focus', () => this._paint());
    el.addEventListener('blur', () => this._paint());
  }

  /** The area written as a sum, for edge e. */
  _sum(r, e) {
    const A = areaOf(r, e);
    return r.kind === 'flat'
      ? `area = ${r.v} m/s x ${e} s = ${fmt(A)} m`
      : `area = 1/2 x ${e} s x ${fmt(vAt(r, e))} m/s = ${fmt(A)} m`;
  }

  _go() {
    if (this._round >= ROUNDS.length) return;
    if (this._ok) { this._round += 1; this._load(); this._render(); this._animate(); return; }
    const r = this._rd(), A = areaOf(r, this._e);
    if (Math.abs(A - r.target) < 1e-9) {
      this._ok = true; this._bad = false;
      this._line = `Right: the area is ${r.target} m, so the car moves ${r.target} m.`;
      if (this._round === ROUNDS.length - 1) { this._round = ROUNDS.length; finishGame(this); }
    } else {
      this._bad = true;
      const way = A < r.target ? 'Make it larger: drag the edge to the right.' : 'Make it smaller: drag the edge to the left.';
      this._line = r.kind === 'flat' ? `The area is ${fmt(A)} m. ${way}` : `The area is a triangle, ${fmt(A)} m. ${way}`;
    }
    this._render();
  }

  _render() {
    const root = this.root, g = root?.querySelector('.gm');
    if (!g) return;
    const done = this._round >= ROUNDS.length, r = this._rd();
    g.dataset.done = done ? '1' : '0';
    const what = r.kind === 'flat' ? `a car moves at a steady ${r.v} m/s` : `a car starts from rest, a = ${r.a} m/s${SUP2}`;
    root.querySelector('.sub').textContent = done ? 'All three areas found.' : `Graph ${this._round + 1} of 3: ${what}.`;
    root.querySelector('.goal').innerHTML = `Make the displacement <b>${r.target} m</b>`;
    root.querySelector('.sum').textContent = this._sum(r, this._e);
    const go = root.querySelector('.ag-go');
    if (go) go.textContent = this._ok ? 'Next graph' : 'Check';
    const w = root.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    const f = this._frame(), el = root.querySelector('.hdl'), [x] = f.at([this._e, 0]);
    const yMid = (f.base + f.py(Math.max(vAt(r, this._e), 2))) / 2;
    Object.assign(el.style, { left: (x / GW * 100) + '%', top: (yMid / GH * 100) + '%' });
    el.setAttribute('aria-valuenow', String(this._e));
    el.setAttribute('aria-valuetext', `edge at ${this._e} s, area ${fmt(areaOf(r, this._e))} m`);
    el.setAttribute('aria-disabled', this._ok || done ? 'true' : 'false');
    this._paint();
    this.relayout?.();
  }

  /** The car eases to the area's metres over about 0.6 s. */
  _animate() {
    cancelAnimationFrame(this._raf);
    let last = performance.now();
    const step = (now) => {
      const goal = areaOf(this._rd(), this._e), dt = Math.min(0.05, (now - last) / 1000); last = now;
      this._car += (goal - this._car) * Math.min(1, dt * 7);
      if (Math.abs(goal - this._car) < 0.05) this._car = goal;
      this._paint();
      if (this._car !== goal) this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
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
    const gc = this.root?.querySelector('canvas.g'), rc = this.root?.querySelector('canvas.r');
    if (!gc || !rc) return;
    const c = loadColors(this.root), r = this._rd(), e = this._e, good = this._ok || this._round >= ROUNDS.length;
    let ctx = this._ctx(gc, GW, GH);
    const f = this._frame(), p = f.plot;
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, 99);
    // The shaded area from 0 to the edge (displacement tone), then the line on top.
    const col = good ? c.good : c.s4;
    areaUnder(ctx, c, f, r.kind === 'flat' ? [[0, r.v], [e, r.v]] : [[0, 0], [e, vAt(r, e)]], { col, alpha: 0.3 });
    ctx.save(); ctx.beginPath(); ctx.rect(p.x, p.y - 4, p.w, p.h + 8); ctx.clip();
    const [x0, y0] = f.at([0, vAt(r, 0)]), [x1, y1] = f.at([T_MAX, vAt(r, T_MAX)]);
    ctx.strokeStyle = c.s1; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.restore();
    // The edge: a solid bar from the axis to the line, with a grip in the middle.
    const [ex, ey] = f.at([e, vAt(r, e)]), hot = this._drag || this.root.querySelector('.hdl:focus-visible');
    ctx.save();
    ctx.strokeStyle = c.annot; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ex, f.base); ctx.lineTo(ex, Math.min(ey, f.base - 20)); ctx.stroke();
    const gy = (f.base + f.py(Math.max(vAt(r, e), 2))) / 2;
    if (hot) { ctx.globalAlpha = 0.18; ctx.fillStyle = c.annot; ctx.beginPath(); ctx.arc(ex, gy, 26, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.fillStyle = c.bgSurface; ctx.strokeStyle = c.annot; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(ex - 11, gy - 20, 22, 40, 8); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = c.annot; ctx.lineWidth = 2.5;
    for (const dx of [-4, 4]) { ctx.beginPath(); ctx.moveTo(ex + dx, gy - 9); ctx.lineTo(ex + dx, gy + 9); ctx.stroke(); }
    ctx.restore();
    if (r.kind === 'ramp') drawTag(ctx, c, `v = ${fmt(vAt(r, e))} m/s`, ex - 14, ey - 30, { col: c.s1, size: 22, align: 'right' });

    // The road: the car's nose at the area's metres; a flag at the target.
    ctx = this._ctx(rc, RW, RH);
    const spec = trackSpec({ from: -(r.road * 0.2 + 4), to: r.road, x0: 14, x1: RW - 30, y: 92 });   // room behind 0 m for the whole car
    const tr = drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 40 });
    drawScale(ctx, c, { vertical: false, at: tr.bottom + 12, p0: spec.toPx(0), p1: spec.toPx(r.road), from: 0, to: r.road, every: r.road >= 80 ? 20 : 10, side: 1, size: 28, arrow: false });
    const tx = spec.toPx(r.target);
    ctx.save();
    ctx.strokeStyle = c.s4; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.setLineDash([7, 6]);
    ctx.beginPath(); ctx.moveTo(tx, 18); ctx.lineTo(tx, 112); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    drawTag(ctx, c, `${r.target} m`, tx + 8, 26, { col: c.s4ink ?? c.s4, size: 26, align: 'left' });
    const CAR = 92, nose = spec.toPx(this._car);
    drawCar(ctx, c, { x: nose - CAR / 2, y: 92, length: CAR, roll: this._car, tone: 3 });
    void clamp01;
  }

  checkObjective() { return this._round >= ROUNDS.length ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
