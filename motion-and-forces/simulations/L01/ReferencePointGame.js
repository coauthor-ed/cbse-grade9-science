/**
 * ReferencePointGame - mini-game blk-l01-game. A child sits in a parked car at the side of a
 * road; a bus with a passenger at a window drives past again and again (calm, one pass every
 * 7 s). Four rounds, one reference point each, named in a big chip and outlined in the picture:
 * the car (rest), the road (rest), the bus (motion), the passenger on the bus (motion). The
 * learner taps "at rest" or "in motion" for the child. A wrong tap shows a one-line hint, then
 * retry; a right tap says why and moves on. finishGame after the fourth round.
 * The picture depends only on the round and the clock. No hint at landing.
 * ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, rr, darken, lighten, mix, alpha } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack } from 'simulations/base/kit/SimTrack.js';
import { drawBus, drawCar } from 'simulations/base/kit/SimVehicles.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { LOOKS } from '../shared/MotionCast.js';

const PW = 680, PH = 262, ROAD_Y = 150, ROAD_D = 60, BAY_Y = 202, NEAR_Y = 246;
const CAR_X = 470, CAR_L = 190, BUS_L = 300, PASS_S = 7;
const ROUNDS = [
  { ref: 'the car', key: 'car', ans: 'rest',
    yes: 'Right. The child stays in the same seat, so her distance from the car does not change: at rest.',
    hint: 'Does the child\'s distance from the car change?' },
  { ref: 'the road', key: 'road', ans: 'rest',
    yes: 'Right. The car is parked, so the child\'s distance from any mark on the road stays the same: at rest.',
    hint: 'The car is parked. Does the child\'s distance from a mark on the road change?' },
  { ref: 'the bus', key: 'bus', ans: 'motion',
    yes: 'Right. The bus drives on, so the child\'s distance from the bus keeps changing: in motion.',
    hint: 'Does the child\'s distance from the bus change?' },
  { ref: 'a passenger on the bus', key: 'pass', ans: 'motion',
    yes: 'Right. The passenger moves with the bus, so the child\'s distance from her keeps changing: in motion.',
    hint: 'The passenger moves with the bus. Does the child\'s distance from her change?' },
];

const CSS = `
.gm.rp { gap: 8px; }
.rp .play { display: grid; grid-template-columns: 640px minmax(0, 1fr); gap: 16px; align-items: start; flex: 1; min-height: 0; }
.rp canvas { display: block; width: 100%; height: auto; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; }
.rp .side { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding-top: 40px; }
.rp .gm-head h2 { font-size: 20px; margin: 0; }
.rp .chip { border: 3px solid var(--sim-accent); border-radius: var(--sim-radius-md); background: var(--sim-bg-surface);
            padding: 8px 12px; font: 800 22px/1.2 var(--sim-font-display); color: var(--sim-label); }
.rp .chip small { display: block; font: 700 14px/1.2 var(--sim-font); color: var(--sim-label-muted); margin-bottom: 2px; }
.rp .answers { display: flex; gap: 10px; }
.rp .answers .tap { flex: 1; font-size: 18px; min-height: 52px; display: flex; align-items: center; justify-content: center; white-space: nowrap; }
.rp .tap[data-st="good"] { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 14%, var(--sim-bg-surface)); }
.rp .tap[data-st="bad"] { border-color: var(--sim-bad); }
.rp .why { margin: 0; min-height: 44px; font-size: 16px; line-height: 1.3; font-weight: 700; }
.rp .why[data-k="bad"] { color: var(--sim-bad); }
.rp .rp-next, .rp .rp-again { display: none; min-height: 48px; align-items: center; justify-content: center; }
.rp[data-wait="1"] .rp-next { display: flex; }
.rp[data-done="1"] .rp-again { display: flex; }
.rp[data-done="1"] .answers, .rp[data-wait="1"] .answers { display: none; }
.sim-dom-root--portrait .rp .play { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .rp .chip { font-size: 19px; }
.sim-dom-root--portrait .rp .side { padding-top: 0; }
.sim-dom-root--portrait .rp .why { font-size: 15px; }
.sim-dom-root--portrait .rp .sub { padding-right: 58px; }
`;

export class ReferencePointGame extends GameBoard {
  static HEIGHT = 345;
  static OBJECTIVE = { prompt: { en: 'A child sits in a parked car. A bus drives past. For each reference point, tap whether the child is at rest or in motion.' } };
  static ARIA_LABEL = 'A road. A child sits in a car parked at the side. A bus with a passenger at a window drives past. Four rounds, each naming a reference point: the car, the road, the bus, a passenger on the bus. For each, tap whether the child is at rest or in motion.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm rp"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><canvas class="pic" aria-hidden="true"></canvas>
        <div class="side"><div class="chip"><small>Reference point</small><span class="ref"></span></div>
        <div class="answers"><div class="tap btn ans" role="button" tabindex="0" data-a="rest">at rest</div><div class="tap btn ans" role="button" tabindex="0" data-a="motion">in motion</div></div>
        <p class="why" aria-live="polite"></p>
        <div class="tap btn rp-next" role="button" tabindex="0">Next</div>
        <div class="tap btn rp-again" role="button" tabindex="0">Play again</div></div></div></div>`,
    });
    this.root.querySelectorAll('.ans').forEach((el) => onTap(el, () => this._answer(el.dataset.a)));
    const next = this.root.querySelector('.rp-next');
    if (next) onTap(next, () => { this._round += 1; this._wait = false; this._line = ''; this._bad = false; this._st = {}; this._render(); });
    const again = this.root.querySelector('.rp-again');
    if (again) onTap(again, () => { this._reset(); this._render(); });
    this._render();
    this._t0 = performance.now();
    const loop = () => { this._paint(); this._raf = requestAnimationFrame(loop); };
    this._raf = requestAnimationFrame(loop);
  }

  _reset() { this._round = 0; this._wait = false; this._done = false; this._line = ''; this._bad = false; this._st = {}; }

  _answer(a) {
    if (this._done || this._wait) return;
    const R = ROUNDS[this._round];
    if (a === R.ans) {
      this._st = { [a]: 'good' }; this._bad = false; this._line = R.yes;
      if (this._round === ROUNDS.length - 1) { this._done = true; this._line = R.yes + ' All four done.'; finishGame(this); }
      else this._wait = true;
    } else {
      this._st = { [a]: 'bad' }; this._bad = true; this._line = R.hint;
    }
    this._render();
  }

  _render() {
    const r = this.root, g = r?.querySelector('.gm');
    if (!g) return;
    const R = ROUNDS[Math.min(this._round, ROUNDS.length - 1)];
    g.dataset.done = this._done ? '1' : '0';
    g.dataset.wait = this._wait ? '1' : '0';
    r.querySelector('.sub').textContent = this._done ? 'All four reference points done.' : `Round ${this._round + 1} of 4: is the child at rest or in motion?`;
    r.querySelector('.ref').textContent = R.ref;
    r.querySelectorAll('.ans').forEach((el) => { el.dataset.st = this._st[el.dataset.a] ?? ''; });
    const w = r.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
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
    const cv = this.root?.querySelector('canvas.pic');
    if (!cv) return;
    const c = loadColors(this.root), ctx = this._ctx(cv, PW, PH);
    const t = (performance.now() - (this._t0 ?? performance.now())) / 1000;
    const key = this._done ? '' : ROUNDS[this._round].key, pulse = 0.75 + 0.25 * Math.sin(t * 3);
    // Sky-free plain panel: a roadside verge, the road (two lanes), then a paved parking strip
    // below the kerb, off the road, so the bus drives past the parked car, not through it.
    ctx.fillStyle = alpha(c.s3, 0.16); ctx.fillRect(0, 0, PW, ROAD_Y - 30);
    const spec = trackSpec({ from: 0, to: 40, x0: 0, x1: PW, y: ROAD_Y });
    drawTrack(ctx, c, spec, { kind: 'road', ticks: false, origin: null, depth: ROAD_D });
    this._bay(ctx, c);
    if (key === 'road') this._ring(ctx, c, 4, ROAD_Y - ROAD_D / 2 - 4, PW - 8, ROAD_D + 8, pulse);

    // The bus on the far lane, left to right, one calm pass every PASS_S s (off screen between passes).
    const u = (t % PASS_S) / PASS_S, bx = -BUS_L / 2 - 20 + u * (PW + BUS_L + 40), busY = ROAD_Y - 6;
    const bus = drawBus(ctx, c, { x: bx, y: busY, length: BUS_L, roll: (u * (PW + BUS_L)) / (BUS_L / 12) });
    // The passenger at a front window (head and shoulders, clipped to the window band).
    const L = BUS_L, wx0 = bx + 0.03 * L, wx1 = bx + 0.3 * L, wy0 = busY - 0.3 * L, wy1 = busY - 0.19 * L;
    const px = bx + 0.17 * L;
    ctx.save(); ctx.beginPath(); ctx.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); ctx.clip();
    drawFigure(ctx, c, { x: px, y: busY - 0.02 * L, height: 0.32 * L, build: 'adult', facing: 1, pose: 'sit', seat: { x: px, y: busY - 0.12 * L } }, figureLook(c, { ...LOOKS.passenger, hairStyle: 'braid' }));
    ctx.restore();
    if (key === 'bus') this._ring(ctx, c, bus.x0 - 8, bus.y0 - 8, bus.w + 16, bus.h + 14, pulse);
    if (key === 'pass') this._ring(ctx, c, px - 30, wy0 - 10, 60, wy1 - wy0 + 18, pulse);

    // The parked car in its bay on the parking strip, the child in its rear window.
    const car = drawCar(ctx, c, { x: CAR_X, y: NEAR_Y, length: CAR_L, tone: 5 });
    const C = CAR_L, cx0 = CAR_X - 0.27 * C, cy0 = NEAR_Y - 0.48 * C, cx1 = CAR_X - 0.065 * C, cy1 = NEAR_Y - 0.34 * C;
    ctx.save(); ctx.beginPath(); ctx.moveTo(cx0, cy1); ctx.lineTo(CAR_X - 0.2 * C, cy0); ctx.lineTo(cx1, cy0); ctx.lineTo(cx1, cy1); ctx.closePath(); ctx.clip();
    drawFigure(ctx, c, { x: CAR_X - 0.15 * C, y: NEAR_Y - 0.1 * C, height: 0.6 * C, build: 'kid', facing: 1, pose: 'sit', seat: { x: CAR_X - 0.15 * C, y: NEAR_Y - 0.2 * C } }, figureLook(c, LOOKS.girl));
    ctx.restore();
    if (key === 'car') this._ring(ctx, c, car.x0 - 8, car.y0 - 8, car.w + 16, car.h + 14, pulse);
  }

  /** The parking strip under the kerb: paved slab (lit lip, body, shade, rim), joints, two bay lines. */
  _bay(ctx, c) {
    const y = BAY_Y, h = PH - BAY_Y + 12, base = mix(c.bgSurface, c.label, 0.2);
    ctx.save();
    rr(ctx, -10, y, PW + 20, h, 6); ctx.fillStyle = base; ctx.fill();
    ctx.save(); rr(ctx, -10, y, PW + 20, h, 6); ctx.clip();
    ctx.fillStyle = darken(base, 0.14); ctx.fillRect(0, y + 34, PW, h);
    ctx.fillStyle = alpha(lighten(base, 0.45), 0.9); ctx.fillRect(0, y + 2, PW, 3);
    ctx.fillStyle = alpha(darken(base, 0.3), 0.5);
    for (let x = 30; x < PW; x += 56) ctx.fillRect(x, y + 8, 2.5, h);
    ctx.fillStyle = alpha(lighten(base, 0.75), 0.95);
    for (const x of [CAR_X - CAR_L * 0.62, CAR_X + CAR_L * 0.62]) rr(ctx, x - 3, y + 8, 6, h, 3), ctx.fill();
    ctx.restore();
    rr(ctx, -10, y, PW + 20, h, 6); ctx.strokeStyle = darken(base, 0.35); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  /** The reference point's outline: a rounded ring in the accent, gently pulsing. */
  _ring(ctx, c, x, y, w, h, k) {
    ctx.save();
    rr(ctx, x, y, w, h, 14); ctx.strokeStyle = alpha(darken(c.accent, 0.3), 0.5 * k); ctx.lineWidth = 9; ctx.stroke();
    rr(ctx, x, y, w, h, 14); ctx.strokeStyle = alpha(c.accent, k); ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
  }

  checkObjective() { return this._done ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
