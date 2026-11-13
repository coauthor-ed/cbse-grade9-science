/**
 * AccelerationDefScene - slide "Average acceleration" (blk-l04-n01, 2 beats).
 * b0: one car on a straight road at two instants. At t1 it has velocity u (short
 *     v-kind arrow); it speeds up (x = u t + a t2 / 2 on the scene scale) and at
 *     t2 it has velocity v (longer arrow). A bracket marks the time interval
 *     t2 - t1, and the formula a = (v - u) / (t2 - t1) is built from the picture,
 *     u and v in the velocity tone.
 * b1: the picture dims and the formula collapses to its units:
 *     (m/s) / s = m/s2 as three chips.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, pill, popAt, font } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';

const SQ = String.fromCharCode(178);
const X1 = 150, X2 = 486, RUN = 2.0, GO = 0.5;          // car centres at t1 and t2 (px), run time (s)
const U = 112, V = 2 * (X2 - X1) / RUN - U;              // px/s at t1 and t2 (V = 224)
const ACC = (V - U) / RUN;
const K_ARROW = 0.62;                                    // arrow px per (px/s): u -> 69 px, v -> 139 px
const ROAD_Y = 226, CAR_L = 190;

// One line of maths: parts [{ t, col, sub }] centred on x; sub draws a small subscript digit.
function mathLine(ctx, c, parts, x, y, size, paint = true) {
  ctx.save();
  ctx.textBaseline = 'middle';
  const widths = parts.map((p) => {
    ctx.font = font(c, 800, size, true); let w = ctx.measureText(p.t).width;
    if (p.sub) { ctx.font = font(c, 800, Math.round(size * 0.62), true); w += ctx.measureText(p.sub).width + 2; }
    return w;
  });
  if (!paint) { ctx.restore(); return widths.reduce((s, w) => s + w, 0); }
  let cx = x - widths.reduce((s, w) => s + w, 0) / 2;
  parts.forEach((p, i) => {
    ctx.fillStyle = p.col ?? c.label; ctx.textAlign = 'left';
    ctx.font = font(c, 800, size, true); ctx.fillText(p.t, cx, y);
    if (p.sub) {
      const w0 = ctx.measureText(p.t).width;
      ctx.font = font(c, 800, Math.round(size * 0.62), true); ctx.fillText(p.sub, cx + w0 + 2, y + size * 0.3);
    }
    cx += widths[i];
  });
  ctx.restore();
  return widths.reduce((s, w) => s + w, 0);
}

export class AccelerationDefScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A car on a straight road at two instants: at time t1 its velocity is u, a short arrow; at time t2, further on, its velocity is v, a longer arrow. Average acceleration equals v minus u divided by t2 minus t1. Then the units: metre per second divided by second gives metre per second squared.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.cur === 0 ? this.age < GO + RUN + 1.8 : this.age < 2.4; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) { this.picture(ctx, c, this.age, 1); this.formula(ctx, c, 432, this.age, 1); return; }
    ctx.save(); ctx.globalAlpha = 0.22; this.picture(ctx, c, 99, 0.22); ctx.restore();
    this.formula(ctx, c, 432, 99, 1 - clamp01(this.age / 0.4));
    this.units(ctx, c);
  }

  picture(ctx, c, age, k) {
    const spec = trackSpec({ from: 1, to: 2, x0: 24, x1: 656, y: ROAD_Y });
    drawTrack(ctx, c, spec, { kind: 'road', depth: 64, origin: null, every: 1e6 });
    const ground = ROAD_Y - 22;
    const tt = clamp01((age - GO) / RUN) * RUN, x = X1 + U * tt + 0.5 * ACC * tt * tt, sp = U + ACC * tt;
    const arrived = age >= GO + RUN;
    // t1: the car as it was (a ghost once it has moved on).
    if (tt > 0.05) {
      ctx.save(); ctx.globalAlpha *= 0.42; drawCar(ctx, c, { x: X1, y: ground, length: CAR_L, tone: 4 }); ctx.restore();
    }
    const car1Top = ground - CAR_L * 0.56;
    drawMotionArrow(ctx, c, 'v', X1 - 30, car1Top - 22, { length: U * K_ARROW, label: 'u' });
    // The car itself; wheels turn with the distance it covers (scene scale: CAR_L px is 4.2 m).
    const car = drawCar(ctx, c, { x, y: ground, length: CAR_L, tone: 4, roll: (x - X1) / (CAR_L / 4.2) });
    if (tt > 0.05) drawMotionArrow(ctx, c, 'v', x - 30, car1Top - 22, { length: sp * K_ARROW, label: 'v' });
    // The instants under the road and the interval between them.
    const ty = ROAD_Y + 64;
    this.tag(ctx, c, 't', '1', X1, ty);
    const p2 = popAt(age, GO + RUN);
    if (p2) {
      ctx.save(); ctx.globalAlpha *= p2.alpha; this.tag(ctx, c, 't', '2', X2, ty); ctx.restore();
      ctx.save(); ctx.globalAlpha *= clamp01((age - GO - RUN - 0.2) / 0.4);
      ctx.strokeStyle = c.annot; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      const by = ty + 30, mid = (X1 + X2) / 2;
      ctx.beginPath(); ctx.moveTo(X1, by - 10); ctx.lineTo(X1, by); ctx.lineTo(X2, by); ctx.lineTo(X2, by - 10); ctx.stroke();
      mathLine(ctx, c, [{ t: 't', sub: '2' }, { t: ' - ' }, { t: 't', sub: '1' }], mid, ty - 2, 30);
      ctx.restore();
    }
    return { car, arrived };
  }

  tag(ctx, c, t, sub, x, y) {
    ctx.save();
    ctx.strokeStyle = c.label; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x, y - 18); ctx.stroke();
    mathLine(ctx, c, [{ t, sub }], x, y, 30);
    ctx.restore();
  }

  formula(ctx, c, y, age, k) {
    const p = popAt(age, GO + RUN + 0.7);
    if (!p || k <= 0) return;
    ctx.save(); ctx.globalAlpha *= p.alpha * k;
    const size = 46, V1 = c.s1ink;
    const left = mathLine(ctx, c, [{ t: 'a = ' }], 0, 0, size, false);
    const num = [{ t: 'v', col: V1 }, { t: ' - ' }, { t: 'u', col: V1 }], den = [{ t: 't', sub: '2' }, { t: ' - ' }, { t: 't', sub: '1' }];
    const wNum = mathLine(ctx, c, num, 0, 0, size, false), wDen = mathLine(ctx, c, den, 0, 0, size, false), wBar = Math.max(wNum, wDen) + 24;
    const x0 = 340 - (left + wBar) / 2, fx = x0 + left + wBar / 2;
    mathLine(ctx, c, [{ t: 'a = ' }], x0 + left / 2, y, size);
    mathLine(ctx, c, num, fx, y - 36, size);
    mathLine(ctx, c, den, fx, y + 40, size);
    ctx.fillStyle = c.label; ctx.fillRect(fx - wBar / 2, y - 2.5, wBar, 5);
    ctx.restore();
  }

  units(ctx, c) {
    const y = 432, items = [
      { at: 0.3, text: 'm/s', bg: c.s1, x: 150 },
      { at: 0.9, text: 's', bg: c.raised, x: 330 },
      { at: 1.5, text: 'm/s' + SQ, bg: c.s2, x: 540 },
    ];
    ctx.save();
    ctx.font = font(c, 800, 52, true); ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (this.age >= 0.9) ctx.fillText('/', 245, y);
    if (this.age >= 1.5) ctx.fillText('=', 430, y);
    ctx.restore();
    for (const it of items) {
      const p = popAt(this.age, it.at);
      if (p) pill(ctx, c, it.text, it.x, y, { size: 48, bg: it.bg, scale: p.scale, alpha: p.alpha, display: true });
    }
  }
}
