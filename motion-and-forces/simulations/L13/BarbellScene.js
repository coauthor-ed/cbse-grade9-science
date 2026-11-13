/**
 * BarbellScene - slide blk-l13-n03 "Holding a barbell" (1 beat; Ex 6.4, Fig 6.8).
 *   b0 'barbell' left: the weightlifter (she) holds the barbell steady above her head (as in L09); each
 *                plate side labelled "10 kg", the bar "bar 10 kg". Right: a zoom card of the barbell alone,
 *                drawn larger, with two F arrows from its centre (offset so they do not overlap): "weight
 *                294 N" down and "push of hands 294 N" up, equal length; kit dot "net force = 0". The sums
 *                write on in order: "10 + 10 + 10 = 30 kg", then "F = mg = 30 x 9.8", "= 294 N" (three lines in all).
 *                Portrait: the lifter above (sums beside her), the zoom card below. No arrow on the lifter.
 *                Rest: all shown.
 * Frames depend on age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, font, rr } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawSurface } from '../shared/MotionCast.js';
import { drawSheet } from '../shared/MotionGraph.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const LIFT = { x: 340, y: 486, h: 262, grip: 62 }, BAR_Y = 226, BAR_HALF = 232;
const LIFT_BOX = { x: 96, y: 136, w: 488, h: 386 };   // the lifter's local frame (L09 coordinates)
const F_LEN = 118;                                    // 294 N, both arrows (one scale)
const SUMS = ['10 + 10 + 10 = 30 kg', 'F = mg = 30 x 9.8', '= 294 N'];   // three lines (text bar: about 12 items)
const T_SUM = [0.4, 1.1, 1.8], T_ARROW = 2.4, T_NET = 2.9;

export class BarbellScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A weightlifter holds a barbell steady above her head. Each side has 10 kilograms and the bar is 10 kilograms, 30 kilograms in all. A larger picture of the barbell shows its weight, 294 newtons, pointing down, and the push of her hands, 294 newtons, pointing up: equal arrows, so the net force is zero. The working: 10 plus 10 plus 10 is 30 kilograms, and F equals m g equals 30 kilograms times 9.8 metres per second squared, which is 294 newtons.';

  busy() { return this.age < T_NET + 0.5; }

  layout() {
    if (this.portrait) return {
      lift: { x: 4, y: 8, w: 330, h: 236 }, sums: { x: 346, y: 52, gap: 40 },
      card: { x: 16, y: 252, w: 648, h: 260 }, bar: { x: 340, y: 386, s: 0.74 },
      upLab: { dx: -22, dy: -F_LEN * 0.62, align: 'right' }, dnLab: { dx: 22, dy: F_LEN * 0.62, align: 'left' }, net: [44, 286], len: 92,
    };
    return {
      lift: { x: 6, y: 14, w: 296, h: 280 }, sums: { x: 24, y: 330, gap: 40 },
      card: { x: 312, y: 16, w: 358, h: 492 }, bar: { x: 491, y: 262, s: 0.72 },
      upLab: { dx: 0, dy: -F_LEN - 30, align: 'center' }, dnLab: { dx: 0, dy: F_LEN + 30, align: 'center' }, net: [400, 470], len: F_LEN,
    };
  }

  fit(L, R) {
    const s = Math.min(R.w / L.w, R.h / L.h), ox = R.x + (R.w - L.w * s) / 2 - L.x * s, oy = R.y + (R.h - L.h * s) / 2 - L.y * s;
    return { s, ox, oy, map: (x, y) => ({ x: ox + x * s, y: oy + y * s }) };
  }

  text(ctx, c, s, x, y, k, align = 'center', col = c.label, size = 26) {
    ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 800, size, true); ctx.fillStyle = col;
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); ctx.restore();
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const a = this.age, Lo = this.layout();
    // The weightlifter, fitted into her panel.
    const F = this.fit(LIFT_BOX, Lo.lift);
    ctx.save(); ctx.translate(F.ox, F.oy); ctx.scale(F.s, F.s);
    drawSurface(ctx, c, 'rough', LIFT_BOX.x + 6, LIFT_BOX.x + LIFT_BOX.w - 6, LIFT.y, { h: 34 });
    const look = figureLook(c, { skin: 2, hairStyle: 'buns', hair: 0, top: 's6', bottom: 's6', bottomStyle: 'shorts', shoeStyle: 'sneaker', mood: 'effort' });
    drawFigure(ctx, c, { x: LIFT.x, y: LIFT.y, height: LIFT.h, facing: 0, pose: 'reach-up',
      hands: [{ x: LIFT.x + LIFT.grip, y: BAR_Y + 2 }, { x: LIFT.x - LIFT.grip, y: BAR_Y + 2 }] }, look,
      { between: (cx) => barbell(cx, c, LIFT.x, BAR_Y) });
    ctx.restore();
    // Mass labels on her barbell: each plate side and the bar.
    const kl = ease(a, 0.1, 0.4);
    for (const s of [-1, 1]) { const p = F.map(LIFT.x + s * 197, BAR_Y + 58); this.text(ctx, c, '10 kg', p.x, p.y + 20, kl); }
    const pb = F.map(LIFT.x, BAR_Y - 22); this.text(ctx, c, 'bar 10 kg', pb.x, pb.y - 18, kl);
    // The sums write on in order.
    SUMS.forEach((s, i) => this.text(ctx, c, s, Lo.sums.x, Lo.sums.y + i * Lo.sums.gap, ease(a, T_SUM[i], 0.4), 'left', i === SUMS.length - 1 ? (c.s3ink ?? darken(c.s3, 0.3)) : c.label));
    // Zoom card: the barbell alone, larger, with its two equal forces from the centre.
    drawSheet(ctx, c, Lo.card);
    const B = Lo.bar;
    ctx.save(); ctx.translate(B.x, B.y); ctx.scale(B.s, B.s); barbell(ctx, c, 0, 0); ctx.restore();
    const kA = ease(a, T_ARROW, 0.5), ink = c.s3ink ?? darken(c.s3, 0.3), len = Lo.len;
    if (kA > 0) {
      drawMotionArrow(ctx, c, 'F', B.x - 14, B.y - 4, { length: len * kA, angle: -Math.PI / 2, label: '', alpha: kA });
      drawMotionArrow(ctx, c, 'F', B.x + 14, B.y + 4, { length: len * kA, angle: Math.PI / 2, label: '', alpha: kA });
      const U = Lo.upLab, D = Lo.dnLab;
      this.text(ctx, c, 'push of hands 294 N', B.x - 14 + U.dx, B.y + U.dy, kA, U.align, ink);
      this.text(ctx, c, 'weight 294 N', B.x + 14 + D.dx, B.y + D.dy, kA, D.align, ink);
    }
    const kN = ease(a, T_NET, 0.4);
    if (kN > 0) {
      drawMotionArrow(ctx, c, 'F', Lo.net[0], Lo.net[1], { length: 0, label: '', alpha: kN });
      this.text(ctx, c, 'net force = 0', Lo.net[0] + 22, Lo.net[1] + 1, kN, 'left', ink);
    }
  }
}

/** A barbell (front view, centred on x, y): the bar, sleeves, collars and two plates each side (L09 look). */
function barbell(ctx, c, x, y) {
  const steel = lighten(c.stroke, 0.35), rim = darken(steel, 0.45);
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = rim; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x - BAR_HALF, y); ctx.lineTo(x + BAR_HALF, y); ctx.stroke();
  ctx.strokeStyle = steel; ctx.lineWidth = 8; ctx.stroke();
  ctx.strokeStyle = alpha(lighten(steel, 0.6), 0.9); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - BAR_HALF, y - 2); ctx.lineTo(x + BAR_HALF, y - 2); ctx.stroke();
  for (const s of [-1, 1]) {
    const plate = (px, w, h, col) => {
      rr(ctx, px - w / 2, y - h / 2, w, h, 6); ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = alpha(lighten(col, 0.35), 0.8); ctx.fillRect(px - w / 2 + 3, y - h / 2 + 6, 5, h - 12);
      ctx.fillStyle = alpha(darken(col, 0.25), 0.8); ctx.fillRect(px + w / 2 - 7, y - h / 2 + 6, 4, h - 12);
      rr(ctx, px - w / 2, y - h / 2, w, h, 6); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    };
    plate(x + s * 168, 14, 30, steel);
    plate(x + s * 186, 22, 116, c.s6);
    plate(x + s * 208, 18, 92, c.s1);
  }
  ctx.restore();
}
