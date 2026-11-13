/**
 * TrackWalkGame - mini-game blk-l02-game. A walker makes three moves along a straight track
 * marked -100..+100 m with O in the middle. Each move stays drawn as a dashed displacement
 * arrow above the track (one row per move, labelled with its sign). The learner sets two
 * steppers, total distance travelled (m) and displacement from O (m, with sign), and taps Check.
 * Three walks in a fixed order; a wrong Check gives a one-line hint (none at landing).
 * A right answer draws the total displacement arrow from O to where she stopped; the game is
 * won after the third walk (finishGame). Canvas frames depend on the walk and elapsed time only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { LOOKS } from '../shared/MotionCast.js';

const WALKS = [[60, -80, 30], [-40, 90, -20], [70, -30, -90]];
const GH = 372;
const SPEED = 70, PAUSE = 0.35, START = 0.4;      // screen m/s, s between moves, s before the first
const ROWS = [36, 82, 128], TOTAL_Y = 174, TRACK_Y = 284, FIG_H = 78;
const signed = (v) => (v > 0 ? '+' + v : String(v)) + ' m';

const CSS = `
.gm.tw { gap: 6px; }
.tw .play { display: grid; grid-template-columns: 470px minmax(0, 1fr); gap: 16px; align-items: start; flex: 1; min-height: 0; }
.tw .board canvas { display: block; width: 100%; height: auto; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; }
.tw .side { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding-top: 46px; }
.sim-dom-root--portrait .tw .side { padding-top: 0; }
.tw .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.tw .lab { flex: 1 1 0; min-width: 0; font-size: 17px; font-weight: 800; }
.tw .gm-head h2 { font-size: 22px; margin: 0; }
.tw .row { flex-wrap: wrap; }
.tw .step { display: flex; align-items: center; gap: 6px; }
.tw .st { width: 52px; min-height: 48px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; padding: 0; }
.tw .st.big { background: var(--sim-bg-deep); }
.tw .val { min-width: 86px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: var(--sim-radius-md);
           background: var(--sim-bg-deep); border: var(--sim-border); font: 800 19px/1 var(--sim-font); font-variant-numeric: tabular-nums; }
.tw .val[data-st="good"] { border-color: var(--sim-good); }
.tw .val[data-st="bad"] { border-color: var(--sim-bad); }
.tw .tw-go { width: 100%; display: flex; align-items: center; justify-content: center; }
.tw .why { margin: 0; min-height: 44px; font-size: 16px; line-height: 1.3; font-weight: 700; }
.tw .why[data-k="bad"] { color: var(--sim-bad); }
.tw[data-done="1"] .tw-go { display: none; }
.sim-dom-root--portrait .tw .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .tw .why { font-size: 15px; }
.sim-dom-root--portrait .tw .val { min-width: 76px; }
.sim-dom-root--portrait .tw .st { width: 48px; }
.sim-dom-root--portrait .tw .lab { flex-basis: 100%; }
.sim-dom-root--portrait .tw .gm-head h2 { font-size: 20px; }
.sim-dom-root--portrait .tw .lab { font-size: 16px; }
`;

export class TrackWalkGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'A walker makes three moves along the straight track. Find the total distance travelled and the displacement from O, with its sign.' } };
  static ARIA_LABEL = 'A straight track marked from -100 m to +100 m with O in the middle. A walker starts at O and makes three moves; each move is shown as an arrow labelled with its displacement. Set the total distance travelled and the displacement from O with its sign, then check. Three walks.';

  async setup() {
    await super.setup();
    this._reset();
    const btn = (k, name, d) => `<div class="tap btn st${Math.abs(d) > 10 ? ' big' : ''}" role="button" tabindex="0" data-k="${k}" data-s="${d}" aria-label="${name} ${d > 0 ? 'up' : 'down'} ${Math.abs(d)} m">${d > 0 ? '+' : '-'}${Math.abs(d)}</div>`;
    const stepper = (k, name) => `<div class="row"><span class="lab">${name}</span><div class="step">
      ${btn(k, name, -50)}${btn(k, name, -10)}<output class="val" data-k="${k}" aria-live="polite"></output>${btn(k, name, 10)}${btn(k, name, 50)}</div></div>`;
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm tw"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="board"><canvas class="g" aria-hidden="true"></canvas></div>
        <div class="side">${stepper('d', 'Distance travelled')}${stepper('s', 'Displacement from O')}
        <div class="tap btn gm-check tw-go" role="button" tabindex="0">Check</div><p class="why" aria-live="polite"></p></div></div></div>`,
    });
    this.root.querySelectorAll('.st').forEach((el) => onTap(el, () => this._step(el.dataset.k, +el.dataset.s)));
    const go = this.root.querySelector('.tw-go');
    if (go) onTap(go, () => this._go());
    this._render();
    this._animate();
  }

  _reset() {
    this._walk = 0; this._val = { d: 0, s: 0 }; this._solved = false; this._line = ''; this._bad = false; this._st = {};
    this._t0 = performance.now();
  }

  _answer() {
    const w = WALKS[this._walk];
    return { d: w.reduce((a, m) => a + Math.abs(m), 0), s: w.reduce((a, m) => a + m, 0) };
  }

  _step(k, s) {
    if (this._walk >= WALKS.length || this._solved) return;
    const lo = k === 'd' ? 0 : -100, hi = k === 'd' ? 300 : 100;
    this._val[k] = Math.max(lo, Math.min(hi, this._val[k] + s));
    this._st = {}; this._bad = false; this._line = '';
    this._render();
  }

  _go() {
    if (this._walk >= WALKS.length) return;
    if (this._solved) {                       // Next walk
      this._walk += 1; this._val = { d: 0, s: 0 }; this._solved = false; this._line = ''; this._st = {};
      this._t0 = performance.now();
      this._render(); this._animate();
      return;
    }
    const ans = this._answer(), w = WALKS[this._walk], okD = this._val.d === ans.d, okS = this._val.s === ans.s;
    this._st = { d: okD ? 'good' : 'bad', s: okS ? 'good' : 'bad' };
    if (okD && okS) {
      this._solved = true; this._bad = false;
      this._line = `Right: ${w.map(Math.abs).join(' + ')} = ${ans.d} m travelled; she stops at ${signed(ans.s)} from O.`;
      if (this._walk === WALKS.length - 1) { this._walk = WALKS.length; finishGame(this); }
    } else {
      this._bad = true;
      if (!okD) this._line = 'Distance: add the lengths of the three moves, each as a positive number.';
      else if (Math.abs(this._val.s) === Math.abs(ans.s) && ans.s !== 0) this._line = 'Right size, wrong sign: which side of O does she stop on?';
      else this._line = 'Displacement: where she stops, measured from O, with its sign.';
    }
    this._render(); this._paint();
  }

  _render() {
    const r = this.root, g = r?.querySelector('.gm');
    if (!g) return;
    const done = this._walk >= WALKS.length;
    g.dataset.done = done ? '1' : '0';
    r.querySelector('.sub').textContent = done ? 'All three walks solved.' : `Walk ${this._walk + 1} of 3: find the distance travelled and the displacement from O.`;
    r.querySelectorAll('.val').forEach((el) => {
      const k = el.dataset.k, v = this._val[k];
      el.textContent = k === 's' ? signed(v) : v + ' m';
      el.dataset.st = this._st[k] ?? '';
    });
    const go = r.querySelector('.tw-go');
    if (go) go.textContent = this._solved ? 'Next walk' : 'Check';
    const w = r.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    this._paint();
    this.relayout?.();
  }

  _animate() {
    cancelAnimationFrame(this._raf);
    const total = START + WALKS[Math.min(this._walk, WALKS.length - 1)].reduce((a, m) => a + Math.abs(m) / SPEED + PAUSE, 0) + 0.2;
    const step = () => {
      this._paint();
      if ((performance.now() - this._t0) / 1000 < total) this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  /** Where the walker is at elapsed time t: { m, k (move index or -1), u (0..1 in that move), moving, facing }. */
  _pose(walk, t) {
    let m = 0, at = START, facing = Math.sign(walk[0]);
    for (let k = 0; k < walk.length; k++) {
      const dur = Math.abs(walk[k]) / SPEED;
      facing = Math.sign(walk[k]);
      if (t < at) return { m, k: k - 1, u: 1, moving: false, facing, done: k };
      if (t < at + dur) return { m: m + walk[k] * (t - at) / dur, k, u: (t - at) / dur, moving: true, facing, done: k, dist: Math.abs(m) + (t - at) * SPEED };
      m += walk[k]; at += dur + PAUSE;
    }
    return { m, k: walk.length - 1, u: 1, moving: false, facing, done: walk.length };
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
    // Phone: a narrower design frame, so the same 26 px labels come out larger on screen.
    const narrow = !!this.root.matches?.('.sim-dom-root--portrait, .sim-dom-root--portrait *'), GW = narrow ? 440 : 680;
    const c = loadColors(this.root), ctx = this._ctx(cv, GW, GH);
    const wi = Math.min(this._walk, WALKS.length - 1), walk = WALKS[wi];
    const t = (performance.now() - this._t0) / 1000, p = this._pose(walk, t);
    const spec = trackSpec({ from: -100, to: 100, x0: 40, x1: GW - 44, y: TRACK_Y });
    drawTrack(ctx, c, spec, { kind: 'track', lanes: 1, every: 50, unit: 'm', depth: 30 });

    // Move arrows: each from where the move began to where it ended (or to her, while moving).
    let m0 = 0;
    for (let k = 0; k < walk.length; k++) {
      if (k > p.k) break;
      const end = k < p.k || !p.moving ? m0 + walk[k] : p.m, len = spec.toPx(end) - spec.toPx(m0);
      const full = k < p.k || !p.moving;
      drawMotionArrow(ctx, c, 's', spec.toPx(m0), ROWS[k], { length: Math.abs(len), angle: len < 0 ? Math.PI : 0,
        label: signed(full ? walk[k] : Math.round((end - m0) / 10) * 10), side: len < 0 ? -1 : 1, at: 0.5, width: 6, head: 18, size: 26, minLen: 0 });
      m0 += walk[k];
    }
    // After a right answer: the total displacement from O to where she stopped.
    if (this._solved || this._walk >= WALKS.length) {
      const s = walk.reduce((a, v) => a + v, 0), len = spec.toPx(s) - spec.toPx(0);
      drawMotionArrow(ctx, c, 's', spec.toPx(0), TOTAL_Y, { length: Math.abs(len), angle: len < 0 ? Math.PI : 0,
        label: 'from O: ' + signed(s), side: len < 0 ? -1 : 1, at: 0.5, width: 8, head: 22, size: 26 });
    }
    // The walker.
    const look = figureLook(c, LOOKS.athlete), fig = { x: spec.toPx(p.m), y: TRACK_Y - 6, height: FIG_H, build: 'teen', facing: p.facing || 1 };
    if (p.moving) drawFigure(ctx, c, { ...fig, pose: { name: 'walk', phase: ((p.dist ?? 0) / 14) % 1 } }, look);
    else drawFigure(ctx, c, { ...fig, pose: 'stand' }, look);
  }

  checkObjective() { return this._walk >= WALKS.length ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); this._animate(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
