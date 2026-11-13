/**
 * BusRideGame - mini-game blk-l04-game. A bus trip of five 5 s parts on a velocity-time
 * graph (made-up readings, straight segments). Three rounds in order: tap the part with the
 * largest acceleration, then the part with zero acceleration, then a part where the
 * acceleration is opposite to the velocity (two parts slow down: either is right).
 * Every tap replays that part under the graph: the bus moves by d = v0 t + a t2 / 2, the
 * speedometer reads v0 + a t, and the v and a arrows sit on the bus; the graph shows the
 * part's rise over 5 s and the feedback line gives a = change / 5 s.
 * Three trips, dealt in a seeded order (a new one on Play again); each has a unique
 * largest and a unique zero part. Canvas drawing depends only on the part and replay time.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { plotFrame, axesOn, plotLine, slopeTriangle } from 'simulations/base/kit/SimPlot.js';
import { trackSpec, drawTrack, drawSpeedometer, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawBus } from 'simulations/base/kit/SimVehicles.js';

const SUP2 = '\u00b2';
const LET = ['A', 'B', 'C', 'D', 'E'];
const PART_S = 5, REPLAY_S = 2.5;
// Velocities (m/s) at 0, 5, 10, 15, 20, 25 s.
const TRIPS = [
  [0, 5, 15, 15, 10, 2],     // a: 1, 2, 0, -1, -1.6
  [2, 12, 12, 8, 11, 4],     // a: 2, 0, -0.8, 0.6, -1.4
  [4, 4, 9, 19, 15, 10],     // a: 0, 1, 2, -0.8, -1
];
const GW = 680, GH = 320, BW = 640, BH = 262;
const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(1)));
const accOf = (trip, i) => (trip[i + 1] - trip[i]) / PART_S;

const CSS = `
.gm.br { gap: 6px; }
.br .play { display: grid; grid-template-columns: 500px minmax(0, 1fr); gap: 14px; align-items: start; flex: 1; min-height: 0; }
.br .graph { position: relative; width: 100%; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; overflow: hidden; }
.br .side canvas { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; }
.br canvas { display: block; width: 100%; height: auto; }
.br .bands { position: absolute; inset: 0; }
.br .part { position: absolute; display: flex; align-items: flex-start; justify-content: center; padding: 4px 0 0;
            background: transparent; box-shadow: none; border: 2px dashed transparent; border-radius: 10px;
            font: 800 20px/1 var(--sim-font-display); color: var(--sim-label); min-width: 44px; min-height: 44px; }
.br .part span { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 8px; padding: 4px 9px; }
@media (hover: hover) { .br .part:hover { border-color: var(--sim-accent); } }
.br .part[data-st="sel"] { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 10%, transparent); }
.br .part[data-st="good"] { border-color: var(--sim-good); border-style: solid; background: color-mix(in oklab, var(--sim-good) 12%, transparent); }
.br .part[data-st="bad"] { border-color: var(--sim-bad); border-style: solid; }
.br .side { display: flex; flex-direction: column; gap: 6px; padding-top: 30px; min-width: 0; }
.br .side canvas { max-width: 410px; }
.br .gm-head h2 { font-size: 22px; margin: 0; }
.br .why { margin: 0; min-height: 48px; font-size: 17px; line-height: 1.3; font-weight: 700; }
.br .why[data-k="bad"] { color: var(--sim-bad); }
.br .br-again { display: none; min-height: 48px; align-items: center; justify-content: center; width: 200px; }
.br[data-done="1"] .br-again { display: flex; }
.sim-dom-root--portrait .br .play { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .br .part { font-size: 16px; }
.sim-dom-root--portrait .br .part span { padding: 3px 6px; }
.sim-dom-root--portrait .br .why { font-size: 15px; }
.sim-dom-root--portrait .br .sub { padding-right: 58px; }
.sim-dom-root--portrait .br .side { padding-top: 0; }
.sim-dom-root--portrait .br .side canvas { max-width: none; }
.sim-dom-root--portrait .br .br-again { width: 100%; }
`;

const PROMPTS = [
  'Round 1 of 3: tap the part with the largest acceleration.',
  'Round 2 of 3: tap the part with zero acceleration.',
  'Round 3 of 3: tap a part where the acceleration is opposite to the velocity.',
];

export class BusRideGame extends GameBoard {
  static HEIGHT = 345;
  static OBJECTIVE = { prompt: { en: 'A bus trip has five parts of 5 s each. Find the part with the largest acceleration, then the part with zero acceleration, then the part where the acceleration is opposite to the velocity. The readings are made up for this game.' } };
  static ARIA_LABEL = 'A velocity-time graph of a bus trip in five parts, A to E, of 5 seconds each. Tap a part to replay it: the bus moves, the speedometer shows its velocity, and the acceleration of that part is shown. Three rounds: the largest acceleration, zero acceleration, and acceleration opposite to the velocity.';

  async setup() {
    await super.setup();
    this._plays = 0;
    this._reset();
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm br"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="graph"><canvas class="g" aria-hidden="true"></canvas><div class="bands">${LET.map((l, i) => `<div class="tap btn part" role="button" tabindex="0" data-i="${i}" aria-label="Part ${l}"><span>${l}</span></div>`).join('')}</div></div>
        <div class="side"><canvas class="b" aria-hidden="true"></canvas><p class="why" aria-live="polite"></p><div class="tap btn br-again" role="button" tabindex="0">Play again</div></div></div></div>`,
    });
    this.root.querySelectorAll('.part').forEach((el) => onTap(el, () => this._tap(+el.dataset.i)));
    const again = this.root.querySelector('.br-again');
    if (again) onTap(again, () => { this._plays += 1; this._reset(); this._render(); });
    this._render();
  }

  /** Seeded deal: the same first trip every mount, a different one on each Play again. */
  _reset() {
    const order = [0, 1, 2], rnd = mulberry32(4407);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    this._trip = TRIPS[order[this._plays % 3]];
    this._round = 0; this._sel = -1; this._st = {}; this._line = ''; this._bad = false; this._t0 = 0;
  }

  _answers(round) {
    const a = [0, 1, 2, 3, 4].map((i) => accOf(this._trip, i));
    if (round === 0) { const m = Math.max(...a); return a.map((x, i) => (x === m ? i : -1)).filter((i) => i >= 0); }
    if (round === 1) return a.map((x, i) => (x === 0 ? i : -1)).filter((i) => i >= 0);
    return a.map((x, i) => (x < 0 ? i : -1)).filter((i) => i >= 0);
  }

  _tap(i) {
    if (this._round >= 3) return;
    const tr = this._trip, a = accOf(tr, i), L = LET[i];
    const calc = `Part ${L}: a = (${tr[i + 1]} - ${tr[i]}) / 5 s = ${fmt(a)} m/s${SUP2}.`;
    this._sel = i; this._t0 = performance.now();
    const ok = this._answers(this._round).includes(i);
    if (ok) {
      this._st = { [i]: 'good' }; this._bad = false;
      if (this._round === 0) this._line = `${calc} Right: the largest acceleration, the steepest rise.`;
      else if (this._round === 1) this._line = `${calc} Right: the velocity stays the same.`;
      else {
        const both = this._answers(2).map((k) => LET[k]).join(' and ');
        this._line = `${calc} Right. ${both} both slow down: the acceleration points opposite to the velocity.`;
      }
      this._round += 1;
    } else {
      this._st = { [i]: 'bad' }; this._bad = true;
      const why = this._round === 0 ? 'Not the largest.' : this._round === 1 ? 'Not zero.' : (a > 0 ? 'It speeds up: a is along v.' : 'a = 0 here.');
      this._line = `${calc} ${why} Try again.`;
      if (!this._hinted) { this._hinted = true; this.quill?.speak('Compare how much v changes in each 5 s part.', 5200); }
    }
    this._render();
    this._animate();
    if (this._round >= 3) finishGame(this);
  }

  _animate() {
    cancelAnimationFrame(this._raf);
    const step = () => {
      this._paint();
      if (performance.now() - this._t0 < REPLAY_S * 1000 + 50) this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  _render() {
    const r = this.root, g = r?.querySelector('.gm');
    if (!g) return;
    const done = this._round >= 3;
    g.dataset.done = done ? '1' : '0';
    r.querySelector('.sub').textContent = done ? 'All three found.' : PROMPTS[this._round];
    r.querySelectorAll('.part').forEach((el, i) => { el.dataset.st = this._st[i] ?? (i === this._sel ? 'sel' : ''); });
    const w = r.querySelector('.why'); w.textContent = this._line || 'Tap a part to replay it.'; w.dataset.k = this._bad ? 'bad' : 'good';
    this._placeBands();
    this._paint();
    this.relayout?.();
  }

  _frame() {
    return plotFrame({ x: 0, y: 0, w: GW, h: GH }, { x: { min: 0, max: 25, ticks: [0, 5, 10, 15, 20, 25], label: 't (s)' }, y: { min: 0, max: 20, ticks: [0, 5, 10, 15, 20], label: 'v (m/s)' } });
  }

  _placeBands() {
    const f = this._frame(), p = f.plot;
    this.root.querySelectorAll('.part').forEach((el, i) => {
      const x0 = f.px(i * PART_S), x1 = f.px((i + 1) * PART_S);
      Object.assign(el.style, { left: (x0 / GW * 100) + '%', width: ((x1 - x0) / GW * 100) + '%', top: (p.y / GH * 100) + '%', height: (p.h / GH * 100) + '%' });
    });
  }

  /** Size a canvas to its box at the device pixel ratio and map design px onto it. */
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
    const gc = this.root?.querySelector('canvas.g'), bc = this.root?.querySelector('canvas.b');
    if (!gc || !bc) return;
    const c = loadColors(this.root), tr = this._trip, sel = this._sel;
    const u = sel < 0 ? 0 : Math.min(1, (performance.now() - this._t0) / (REPLAY_S * 1000));

    // Graph: axes, the trip line, the selected part's rise over 5 s.
    let ctx = this._ctx(gc, GW, GH);
    const f = this._frame();
    axesOn(ctx, c, f, 99, { size: 22, titleSize: 22 });
    const pts = tr.map((v, i) => [f.px(i * PART_S), f.py(v)]);
    plotLine(ctx, c, pts, 99, { col: c.s1, width: 5, head: false });
    if (sel >= 0) {
      const A = [sel * PART_S, tr[sel]], B = [(sel + 1) * PART_S, tr[sel + 1]], dv = tr[sel + 1] - tr[sel];
      if (dv !== 0) slopeTriangle(ctx, c, f, A, B, { letters: false, rise: (dv > 0 ? '+' : '') + dv + ' m/s', run: '5 s', size: 22 });
      plotLine(ctx, c, [[f.px(A[0]), f.py(A[1])], [f.px(A[0] + PART_S * u), f.py(A[1] + dv * u)]], 99, { col: c.s2, width: 7, head: true });
    }

    // The bus panel: the selected part replayed.
    ctx = this._ctx(bc, BW, BH);
    const i = sel < 0 ? 0 : sel, a = accOf(tr, i), t = u * PART_S, v = tr[i] + a * t, d = tr[i] * t + 0.5 * a * t * t;
    const spec = trackSpec({ from: 0.5, to: 100, x0: 6, x1: 440, y: 222 });
    drawTrack(ctx, c, spec, { kind: 'road', every: 1000, origin: null, depth: 50 });
    const LEN = 270, xc = 146 + d * (160 / 90);
    drawBus(ctx, c, { x: xc, y: 222, length: LEN, roll: d, pxPerM: 160 / 90 });
    if (sel >= 0) {
      drawMotionArrow(ctx, c, 'v', xc - 40, 40, { length: v * 7, label: 'v = ' + fmt(+v.toFixed(1)) + ' m/s', side: 1 });
      drawMotionArrow(ctx, c, 'a', xc - 40, 98, { length: Math.abs(a) * 50, angle: a < 0 ? Math.PI : 0, label: a === 0 ? 'a = 0' : 'a = ' + fmt(Math.abs(a)) + ' m/s' + SUP2, side: a < 0 ? -1 : 1 });
    }
    drawSpeedometer(ctx, c, { x: 548, y: 110, r: 86, max: 20, major: 5, minor: 1, value: v, unit: 'm/s', digital: fmt(+v.toFixed(1)) + ' m/s' });
  }

  checkObjective() { return this._round >= 3 ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
