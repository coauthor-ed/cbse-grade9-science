/**
 * ConstantAccelScene - slide blk-l04-n04 "Constant acceleration" (1 beat).
 * A girl on a scooter starts from rest with a = 2 m/s2 for 4 s: she moves by x = t2 (m),
 * the speedometer needle and readout show v = 2t (m/s), and a step strip adds one row
 * per second: the bar for v at t = 0, 1, 2, 3, 4 s, each one the last plus one equal
 * "+2" piece. At rest: the full strip with four equal "+2" pieces.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, alpha, darken, lighten, font, rr, clamp01, outBack, inkOn } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawSpeedometer } from 'simulations/base/kit/SimTrack.js';
import { drawScooterGirl } from '../shared/MotionCast.js';

const RUN = 4;          // seconds, real time
const A = 2;            // m/s2
const LEN = 170;        // scooter length, px
const NOSE0 = 8;        // metres
const ROW0 = 266, ROW_H = 52, BAR_X = 368, PX_PER_V = 26, BAR_H = 36;
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

export class ConstantAccelScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A girl on a scooter starts from rest and speeds up for 4 seconds. The speedometer reads 0, 2, 4, 6 and 8 metres per second at 0, 1, 2, 3 and 4 seconds. Each bar in the strip is the one before plus an equal piece of 2 metres per second, so the acceleration is constant.';

  busy() { return this.age < RUN + 0.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const t = clamp01(this.age / RUN) * RUN, v = A * t;
    const spec = trackSpec({ from: 0.5, to: 26, x0: 20, x1: 660, y: 196 });
    drawTrack(ctx, c, spec, { kind: 'road', every: 1000, origin: null, depth: 52 });
    const nose = NOSE0 + 0.5 * A * t * t;
    drawScooterGirl(ctx, c, { x: spec.toPx(nose) - LEN / 2, y: spec.y, length: LEN, roll: 0.5 * A * t * t });

    drawSpeedometer(ctx, c, { x: 140, y: 362, r: 100, max: 10, major: 2, minor: 1, value: v, unit: 'm/s', digital: fmt(+v.toFixed(1)) + ' m/s' });

    // The step strip: one row per whole second reached.
    for (let i = 0; i <= 4; i++) {
      const age = this.age - i * (RUN / 4);
      if (age < 0) break;
      this.stepRow(ctx, c, i, ROW0 + i * ROW_H, clamp01(age / 0.45));
    }
  }

  stepRow(ctx, c, i, y, k) {
    const vi = A * i, kk = outBack(k);
    ctx.save();
    ctx.globalAlpha = clamp01(k * 2.5);
    ctx.font = font(c, 800, 26, true); ctx.textBaseline = 'middle';
    ctx.textAlign = 'right'; ctx.fillStyle = c.labelMuted ?? c.label;
    ctx.fillText(i + ' s', BAR_X - 14, y);
    // Bar: earlier pieces in the plain tone, the newest piece (+2) in the accent tone, growing in.
    const base = (vi - (i > 0 ? A : 0)) * PX_PER_V, add = i > 0 ? A * PX_PER_V * Math.max(0, kk) : 0;
    if (base > 0) this.piece(ctx, c, BAR_X, y, base, c.s1);
    if (add > 0) {
      this.piece(ctx, c, BAR_X + base, y, add, c.s2);
      if (k > 0.6) {
        ctx.textAlign = 'center'; ctx.fillStyle = inkOn(c, c.s2);
        ctx.fillText('+2', BAR_X + base + add / 2, y + 1);
      }
    }
    ctx.textAlign = 'left'; ctx.fillStyle = c.label;
    ctx.fillText(vi + ' m/s', BAR_X + base + add + 12, y);
    ctx.restore();
  }

  /** One piece of a velocity bar: a lit top, a shaded underside, a darker rim. */
  piece(ctx, c, x, y, w, col) {
    const y0 = y - BAR_H / 2;
    rr(ctx, x, y0, w, BAR_H, 6); ctx.fillStyle = col; ctx.fill();
    ctx.save(); rr(ctx, x, y0, w, BAR_H, 6); ctx.clip();
    ctx.fillStyle = darken(col, 0.18); ctx.fillRect(x, y0 + BAR_H * 0.62, w, BAR_H);
    ctx.fillStyle = alpha(lighten(col, 0.5), 0.8); ctx.fillRect(x + 4, y0 + 3, Math.max(0, w - 8), 3);
    ctx.restore();
    rr(ctx, x, y0, w, BAR_H, 6); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(col, 0.35); ctx.stroke();
  }
}
