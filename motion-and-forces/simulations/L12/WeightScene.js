/**
 * WeightScene - slide blk-l12-n02 "Weight" (2 beats).
 *   b0 'g'   a cricket ball and a heavy iron ball (different size, different shade) are let go together
 *            from a ledge beside a vertical metre scale. They fall side by side: y = g t^2 / 2 for both,
 *            with g = 9.8 m/s2 on the scale's own px per metre; equal-time dots (every 0.3 s) at the
 *            same heights for both, joined by faint level lines; an a arrow of the same length on each;
 *            tags "g = 9.8 m/s2" and "same g for both". Compressed clock (the 1.3 s fall plays in about
 *            2.9 s). Rest: both near the floor, dots shown.
 *   b1 'mg'  a 1 kg mass hangs from a spring balance on a stand; the pointer settles at 9.8 on a 0-20 N
 *            scale (every 5), tag "9.8 N"; the F arrow "weight 9.8 N" points down, tail on the mass;
 *            then "F = mg = 1 kg x 9.8 m/s2 = 9.8 N" writes on, line by line. Rest: all shown.
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, font, rr } from 'simulations/base/kit/SimLook.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { drawLedge } from 'simulations/base/kit/SimVehicles.js';
import { drawScale, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawSurface } from '../shared/MotionCast.js';
import { drawSheet, drawTag } from '../shared/MotionGraph.js';
import { drawForce, drawSpringBalance } from '../shared/ForceCast.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const G = 9.8, FLOOR = 472, TOP = 72, PXM = (FLOOR - TOP) / 10;           // 10 m scale, 40 px per metre
const BALLS = [{ x: 246, r: 16, kind: 'cricket' }, { x: 318, r: 30, kind: 'iron' }];
const T_GO = 0.5, SLOW = 2.3, T_END = 1.22, DT = 0.3;                      // real fall time shown, slowed SLOW x
const SCALE_X = 432, A_LEN = 60;
const SB = { x: 236, y: 34, len: 200 }, PX_N = 6, MASS = { w: 100, h: 56 };

export class WeightScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A small cricket ball and a big heavy iron ball are let go together from the top of a building, beside a ten metre scale. They fall side by side and are at the same height at every instant: both speed up with the same acceleration, g = 9.8 metres per second squared. Then a 1 kilogram mass hangs from a spring balance, which reads 9.8 newtons: its weight, F = mg = 1 kg times 9.8 metres per second squared = 9.8 N.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.cur === 0 ? this.age < T_GO + T_END * SLOW + 0.6 : this.age < 3.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.fall(ctx, c); else this.weigh(ctx, c);
  }

  // -- b0: both balls fall with the same g ------------------------------------------------------------------------
  fall(ctx, c) {
    const a = this.age, t = Math.min(T_END, Math.max(0, (a - T_GO) / SLOW));
    const drop = (tt) => 0.5 * G * tt * tt * PXM;                                // px fallen at time tt (s)
    drawSurface(ctx, c, 'rough', 0, 680, FLOOR, { h: 34 });
    drawLedge(ctx, c, { x: 206, y: TOP, ground: FLOOR, w: 176, facing: 1, kind: 'building' });
    drawScale(ctx, c, { vertical: true, at: SCALE_X, p0: FLOOR, p1: TOP, from: 0, to: 10, every: 2, unit: 'm', side: -1 });
    // Equal-time marks: one level line and a dot on each path every DT seconds, once the balls pass it.
    for (let i = 0; i * DT <= t + 1e-6; i++) {
      const dy = drop(i * DT);
      ctx.save(); ctx.strokeStyle = alpha(c.labelMuted, 0.6); ctx.lineWidth = 2; ctx.setLineDash([6, 7]);
      ctx.beginPath(); ctx.moveTo(BALLS[0].x - 30, TOP + dy); ctx.lineTo(SCALE_X - 84, TOP + dy); ctx.stroke(); ctx.restore();
      for (const b of BALLS) dot(ctx, c, b.x, TOP + dy);
    }
    // The balls: their centres level (the same drop for both), level with the roof (10 m) at the start.
    const yc = TOP + drop(t);
    for (const b of BALLS) {
      if (b.kind === 'cricket') cricketBall(ctx, c, b.x, yc, b.r); else ironBall(ctx, c, b.x, yc, b.r);
    }
    const ka = ease(a, T_GO + 0.1, 0.3);
    if (ka > 0) for (const b of BALLS) drawMotionArrow(ctx, c, 'a', b.x, yc + b.r + 2, { length: A_LEN, angle: Math.PI / 2, label: 'g', side: -1, alpha: ka });
    const k1 = ease(a, T_GO + 0.8, 0.4), k2 = ease(a, T_GO + 1.8, 0.4);
    if (k1 > 0) drawTag(ctx, c, 'g = 9.8 m/s\u00b2', 556, 150, { size: 28, col: c.s2ink ?? darken(c.s2, 0.2), alpha: k1 });
    if (k2 > 0) drawTag(ctx, c, 'same g for both', 556, 214, { size: 28, col: c.s2ink ?? darken(c.s2, 0.2), alpha: k2 });
  }

  // -- b1: the weight of 1 kg on a spring balance ------------------------------------------------------------------
  weigh(ctx, c) {
    const a = this.age, read = 9.8 * ease(a, 0.4, 0.9), kf = ease(a, 1.3, 0.4), kp = ease(a, 1.1, 0.3);
    stand(ctx, c, SB.x, SB.y);
    const sb = drawSpringBalance(ctx, c, { x: SB.x, y: SB.y, reading: read, max: 20, every: 5, minor: 1, len: SB.len, w: 124, rod: 18 });
    const m = hangMass(ctx, c, sb.hook.x, sb.hook.y);
    if (kp > 0) drawTag(ctx, c, '9.8 N', sb.pointer.x + 92, sb.pointer.y, { size: 28, align: 'left', col: c.s3ink ?? darken(c.s3, 0.2), alpha: kp });
    if (kf > 0) drawForce(ctx, c, m.x, m.bottom - 2, { newtons: 9.8 * kf, scale: { pxPerN: PX_N, len: (n) => n * PX_N }, angle: Math.PI / 2, label: 'weight 9.8 N', alpha: kf, fit: false });
    // F = mg, written on line by line.
    const S = { x: 392, y: 214, w: 276, h: 196 };
    const ks = ease(a, 1.7, 0.3);
    if (ks > 0) drawSheet(ctx, c, S, { alpha: ks });
    const lines = ['F = mg', '= 1 kg \u00d7 9.8 m/s\u00b2', '= 9.8 N'];
    lines.forEach((l, i) => {
      const k = ease(a, 1.9 + i * 0.5, 0.45);
      if (k <= 0) return;
      ctx.save(); ctx.font = font(c, 800, i === 0 ? 34 : 28, true); ctx.fillStyle = i === 2 ? (c.s3ink ?? darken(c.s3, 0.2)) : c.label;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(l).width, x = S.x + 22, y = S.y + 44 + i * 56;
      ctx.beginPath(); ctx.rect(x - 4, y - 24, (w + 8) * k, 48); ctx.clip();      // the write-on wipe
      ctx.fillText(l, x, y + 1); ctx.restore();
    });
  }
}

// ---- scene-local drawing (the kit has no lab stand, no hanging slotted mass, no cricket ball) --------------

function dot(ctx, c, x, y) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = c.annot; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = darken(c.annot, 0.4); ctx.stroke(); ctx.restore();
}

/** A red leather ball with its stitched seam (kit ball for the body). */
function cricketBall(ctx, c, x, y, r) {
  drawBall(ctx, c, { x, y, r, tone: 'bad' });
  ctx.save(); ctx.strokeStyle = alpha(lighten(c.bad, 0.55), 0.95); ctx.lineWidth = 1.8;
  for (const s of [-1, 1]) { const a0 = s < 0 ? 0 : Math.PI; ctx.beginPath(); ctx.arc(x + s * r * 1.5, y, r * 1.22, a0 - 0.6, a0 + 0.6); ctx.stroke(); }
  ctx.restore();
}

/** A dark cast-iron ball (kit ball, iron grey), with a dull band highlight. */
function ironBall(ctx, c, x, y, r) {
  drawBall(ctx, c, { x, y, r, tone: 'labelMuted' });
  ctx.save(); ctx.strokeStyle = alpha(darken(c.labelMuted, 0.4), 0.5); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y + 2, r * 0.92, r * 0.3, 0, 0.1, Math.PI - 0.1); ctx.stroke();
  ctx.restore();
}

/** A lab stand: heavy base, upright rod, and an arm over the balance with a hook. */
function stand(ctx, c, x, y) {
  const steel = lighten(c.stroke, 0.35), rim = darken(steel, 0.45), rodX = x - 150, base = 500;
  const bar = (x0, y0, w, h) => {
    rr(ctx, x0, y0, w, h, Math.min(w, h) / 2); ctx.fillStyle = steel; ctx.fill();
    ctx.fillStyle = alpha(lighten(steel, 0.5), 0.8); rr(ctx, x0 + 2, y0 + 2, w > h ? w - 4 : Math.max(3, w * 0.3), w > h ? Math.max(3, h * 0.3) : h - 4, 2); ctx.fill();
    rr(ctx, x0, y0, w, h, Math.min(w, h) / 2); ctx.strokeStyle = rim; ctx.lineWidth = 2.5; ctx.stroke();
  };
  ctx.save();
  ctx.fillStyle = alpha(darken(c.stroke, 0.3), 0.25); ctx.beginPath(); ctx.ellipse(rodX + 10, base + 6, 90, 8, 0, 0, Math.PI * 2); ctx.fill();
  bar(rodX - 70, base - 20, 160, 22);
  bar(rodX - 7, y - 30, 14, base - y + 12);
  bar(rodX - 10, y - 26, x - rodX + 26, 14);
  bar(rodX - 14, y - 32, 26, 24);                 // the clamp boss
  ctx.strokeStyle = rim; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x, y - 4); ctx.stroke();
  ctx.restore();
}

/** A 1 kg slotted brass mass on a short hanger, hung from the hook. Returns { x, top, centre, bottom }. */
function hangMass(ctx, c, hx, hy) {
  const brass = c.gold, w = MASS.w, h = MASS.h, top = hy + 22, x0 = hx - w / 2;
  ctx.save();
  ctx.strokeStyle = darken(c.stroke, 0.1); ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(hx, hy + 6, 7, Math.PI * 1.1, Math.PI * 2.1); ctx.moveTo(hx, hy + 12); ctx.lineTo(hx, top + 2); ctx.stroke();
  // body: lit left side, shaded right side, a top face, inner line and darker rim
  const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
  g.addColorStop(0, lighten(brass, 0.35)); g.addColorStop(0.45, brass); g.addColorStop(1, darken(brass, 0.3));
  rr(ctx, x0, top, w, h, 10); ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx, top + 6, w / 2 - 4, 7, 0, 0, Math.PI * 2); ctx.fillStyle = alpha(lighten(brass, 0.5), 0.7); ctx.fill();
  ctx.strokeStyle = alpha(darken(brass, 0.25), 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 6, top + h - 12); ctx.lineTo(x0 + w - 6, top + h - 12); ctx.stroke();
  rr(ctx, x0, top, w, h, 10); ctx.strokeStyle = darken(brass, 0.5); ctx.lineWidth = 2.5; ctx.stroke();
  ctx.font = font(c, 800, 28, true); ctx.fillStyle = darken(brass, 0.62); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('1 kg', hx, top + h / 2 + 2);
  ctx.restore();
  return { x: hx, top, centre: top + h / 2, bottom: top + h };
}
