/**
 * PoolLapsGame - mini-game blk-l03-game. Sarang swims some lengths of the 25 m pool (one fixed list):
 *   round 1: 1 length in 25 s -> average speed 1 m/s,    average velocity +1 m/s
 *   round 2: 2 lengths in 40 s -> average speed 1.25 m/s, average velocity 0 m/s
 *   round 3: 3 lengths in 60 s -> average speed 1.25 m/s, average velocity +0.42 m/s (0.4 accepted)
 * The pool (L03 PoolLapScene's documented parts: drawPool, drawPoolScale, swimmerX, drawSwimmer) shows
 * his swim once per round at one steady pace, with a stopwatch running to the round's time.
 * The learner types the two averages and taps Check. A wrong Check gives a one-line hint (distance
 * vs displacement); none at landing. A right answer draws his displacement from the start wall
 * (dashed s arrow, or a dot "s = 0 m"). Won after round 3 (finishGame).
 * Canvas frames depend on the round and elapsed time only.
 * ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { PoolLapScene } from './PoolLapScene.js';

const ROUNDS = [{ n: 1, T: 25 }, { n: 2, T: 40 }, { n: 3, T: 60 }];
const L = 25, PER = 1.4, START = 0.4;                 // m per length; screen s per length; s before he starts
const LAYOUT = {
  wide: { GW: 680, GH: 366, clock: { x: 590, y: 50, r: 34 }, sY: 106,
    POOL: { wx0: 40, wx1: 640, top: 122, laneH: 82, lanes: 2, scaleY: 322, swimH: 122 } },
  narrow: { GW: 440, GH: 388, clock: { x: 380, y: 52, r: 34 }, sY: 107,
    POOL: { wx0: 30, wx1: 410, top: 124, laneH: 80, lanes: 2, scaleY: 338, swimH: 108 } },
};

const fmt = (v) => String(Math.round(v * 100) / 100);
const signed = (v) => (v > 0 ? '+' : '') + fmt(v);

const CSS = `
.gm.pl { gap: 6px; }
.pl .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.pl .play { display: grid; grid-template-columns: 480px minmax(0, 1fr); gap: 16px; align-items: start; flex: 1; min-height: 0; }
.pl .board canvas { display: block; width: 100%; height: auto; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; }
.pl .side { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding-top: 30px; }
.pl .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pl .lab { flex: 1 1 0; min-width: 0; font-size: 17px; font-weight: 800; }
.pl .lab small { display: block; font-size: 14px; font-weight: 600; color: var(--sim-label-muted); }
.pl .in { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 700; }
.pl .num { width: 96px; font-size: 19px; font-weight: 800; }
.sim-dom-root:not(.sim-dom-root--portrait) .pl .lab small { font-size: 17px; }
.sim-dom-root:not(.sim-dom-root--portrait) .pl .acts .tap { font-size: 17px; }
.pl .num[data-st="good"] { border-color: var(--sim-good); }
.pl .num[data-st="bad"] { border-color: var(--sim-bad); }
.pl .acts { display: flex; gap: 8px; }
.pl .acts .tap { flex: 1 1 0; display: flex; align-items: center; justify-content: center; }
.pl .why { margin: 0; min-height: 44px; font-size: 16px; line-height: 1.3; font-weight: 700; }
.pl .why[data-k="bad"] { color: var(--sim-bad); }
.pl[data-done="1"] .pl-go { display: none; }
.sim-dom-root--portrait .pl .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .pl .side { padding-top: 0; }
.sim-dom-root--portrait .pl .why { font-size: 15px; }
.sim-dom-root--portrait .pl .lab { font-size: 16px; }
`;

export class PoolLapsGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'Sarang swims some lengths of the 25 m pool. Find his average speed and his average velocity.' } };
  static ARIA_LABEL = 'A 25 m pool seen from above with a number line from 0 m at the start wall to 25 m at the far wall. In each round Sarang swims some lengths while a stopwatch runs. Type his average speed and his average velocity in m/s, with a sign for velocity, then check. Three rounds.';

  async setup() {
    await super.setup();
    this._reset();
    const field = (k, name, hint) => `<label class="row"><span class="lab">${name}<small>${hint}</small></span>
      <span class="in"><input class="num" type="text" inputmode="decimal" autocomplete="off" data-k="${k}" aria-label="${name} in m/s">m/s</span></label>`;
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm pl"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="board"><canvas class="g" aria-hidden="true"></canvas></div>
        <div class="side">${field('s', 'Average speed', 'distance / time')}${field('v', 'Average velocity', 'with sign, + away from the start')}
        <div class="acts"><div class="tap btn pl-again" role="button" tabindex="0">Watch again</div>
        <div class="tap btn gm-check pl-go" role="button" tabindex="0">Check</div></div>
        <p class="why" aria-live="polite"></p></div></div></div>`,
    });
    this.root.querySelectorAll('input.num').forEach((el) => el.addEventListener('input', () => {
      this._val[el.dataset.k] = el.value; this._st = {}; this._bad = false; this._line = ''; this._render();
    }));
    const go = this.root.querySelector('.pl-go'), again = this.root.querySelector('.pl-again');
    if (go) onTap(go, () => this._go());
    if (again) onTap(again, () => { this._t0 = performance.now(); this._animate(); });
    this._render();
    this._animate();
  }

  _reset() {
    this._round = 0; this._val = { s: '', v: '' }; this._solved = false; this._line = ''; this._bad = false; this._st = {};
    this._t0 = performance.now();
  }

  _answer(r = ROUNDS[this._round]) {
    const disp = r.n % 2 ? L : 0;
    return { dist: L * r.n, disp, s: L * r.n / r.T, v: disp / r.T };
  }

  _num(text) {
    const t = String(text ?? '').replace(/\s|m\/s/g, '');
    return t === '' || isNaN(Number(t)) ? null : Number(t);
  }

  _go() {
    if (this._round >= ROUNDS.length) return;
    if (this._solved) {                                    // next round
      this._round += 1; this._val = { s: '', v: '' }; this._solved = false; this._line = ''; this._st = {};
      this.root.querySelectorAll('input.num').forEach((el) => { el.value = ''; });
      this._t0 = performance.now();
      this._render(); this._animate();
      return;
    }
    const a = this._answer(), r = ROUNDS[this._round], s = this._num(this._val.s), v = this._num(this._val.v);
    if (s === null || v === null) {
      this._bad = true; this._line = 'Type a number in each box.'; this._render(); return;
    }
    const okS = Math.abs(s - a.s) < 0.011, okV = Math.abs(v - a.v) < (a.v > 0 && a.v < 1 ? 0.025 : 0.011);
    this._st = { s: okS ? 'good' : 'bad', v: okV ? 'good' : 'bad' };
    if (okS && okV) {
      this._solved = true; this._bad = false;
      this._line = `Right: ${a.dist} m / ${r.T} s = ${fmt(a.s)} m/s. He ends ${a.disp} m from the start, so ${a.disp} m / ${r.T} s = ${a.v ? signed(a.v) : '0'} m/s.`;
      if (this._round === ROUNDS.length - 1) { this._round = ROUNDS.length; finishGame(this); }
    } else {
      this._bad = true;
      if (!okS) this._line = 'Speed uses the distance travelled: every length counts, 25 m each.';
      else if (Math.abs(Math.abs(v) - a.v) < 0.025 && a.v > 0) this._line = 'Right size, wrong sign: he ends on the far side, away from the start.';
      else this._line = 'Velocity uses the displacement: where he ends, measured from the start wall.';
    }
    this._render();
  }

  _render() {
    const r = this.root, g = r?.querySelector('.gm');
    if (!g) return;
    const done = this._round >= ROUNDS.length, rd = ROUNDS[Math.min(this._round, ROUNDS.length - 1)];
    g.dataset.done = done ? '1' : '0';
    r.querySelector('.sub').textContent = done ? 'All three swims solved.'
      : `Swim ${this._round + 1} of 3: Sarang swims ${rd.n} length${rd.n > 1 ? 's' : ''} in ${rd.T} s.`;
    r.querySelectorAll('input.num').forEach((el) => { el.dataset.st = this._st[el.dataset.k] ?? ''; el.disabled = done || this._solved; });
    const go = r.querySelector('.pl-go');
    if (go) go.textContent = this._solved ? 'Next swim' : 'Check';
    const w = r.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    this._paint();
    this.relayout?.();
  }

  _animate() {
    cancelAnimationFrame(this._raf);
    const rd = ROUNDS[Math.min(this._round, ROUNDS.length - 1)], total = START + PER * rd.n + 0.3;
    const step = () => {
      this._paint();
      if ((performance.now() - this._t0) / 1000 < total) this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  /** His swim at screen time t: book time, position (m from the start wall), direction, metres swum. */
  _swim(rd, t) {
    const u = Math.max(0, Math.min(1, (t - START) / (PER * rd.n))), dist = u * L * rd.n;
    const k = Math.min(rd.n - 1, Math.floor(dist / L)), within = dist - k * L;
    return { tb: u * rd.T, p: k % 2 ? L - within : within, dir: k % 2 ? -1 : 1, dist };
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
    const narrow = !!this.root.matches?.('.sim-dom-root--portrait, .sim-dom-root--portrait *'), Lo = narrow ? LAYOUT.narrow : LAYOUT.wide;
    const c = loadColors(this.root), ctx = this._ctx(cv, Lo.GW, Lo.GH);
    // The approved pool parts, borrowed from PoolLapScene with this board's layout (no scene instance).
    const pool = Object.create(PoolLapScene.prototype, { constructor: { value: { POOL: Lo.POOL, SARANG: PoolLapScene.SARANG } } });
    const ri = Math.min(this._round, ROUNDS.length - 1), rd = ROUNDS[ri], sw = this._swim(rd, (performance.now() - this._t0) / 1000);
    pool.drawPool(ctx, c, { scroll: sw.dist * 0.3 });
    pool.drawPoolScale(ctx, c);
    const y = pool.laneY(1);
    pool.drawSwimmer(ctx, c, { x: pool.swimmerX(sw.p, sw.dir), y, dir: sw.dir, dist: sw.dist });
    drawStopwatch(ctx, c, { ...Lo.clock, seconds: sw.tb, text: Math.round(sw.tb) + ' s', readout: 'inside' });
    // After a right answer: his displacement from the start wall, along the deck (label above it).
    if (this._solved || this._round >= ROUNDS.length) {
      const sp = pool.poolSpec(), disp = this._answer(rd).disp, len = sp.toPx(disp) - sp.toPx(0);
      drawMotionArrow(ctx, c, 's', sp.toPx(0), Lo.sY, disp
        ? { length: len, label: 's = +' + disp + ' m', side: 1, at: 0.5, width: 7, head: 20, size: 26 }
        : { magnitude: 0, label: 's = 0 m', side: 1, size: 26 });
    }
  }

  checkObjective() { return this._round >= ROUNDS.length ? { ok: true } : null; }
  resetChallenge() {
    super.resetChallenge(); this._reset();
    this.root?.querySelectorAll('input.num').forEach((el) => { el.value = ''; });
    this._render(); this._animate();
  }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
