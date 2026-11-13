/**
 * LifterAndWrestlersScene - slide blk-l09-n02 "Balanced or not?" (2 beats; Figs 6.8, 6.9).
 *   b0 'lifter'  the weightlifter (she) lifts a barbell above her head and holds it still. On the
 *                barbell: the pull of the Earth (two equal down arrows, one from each set of plates)
 *                and the push of her hands (two up arrows, one from each hand), equal totals; net force = 0; tag "balanced". Rest: still.
 *   b1 'wrestle' two forearms (players R and S) on a table, hands clasped, side view. R's push on the
 *                hands points right, S's points left; R's grows longer, and the hands tilt toward S's
 *                side (about R's elbow). The net force arrow (the difference) below, toward S;
 *                tag "R pushes harder". Rest: tilted.
 * One px-per-unit arrow scale per beat. Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, font, rr } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawSurface } from '../shared/MotionCast.js';
import { drawSheet, drawTag } from '../shared/MotionGraph.js';
import { drawForce, drawNet } from '../shared/ForceCast.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const LIFT = { x: 340, y: 486, h: 262, grip: 62, from: 292, to: 210 }, BAR_HALF = 232, LF = 100;
const TY = 368, ER = { x: 206, y: TY - 22 }, ES = { x: 474, y: TY - 22 }, FA = 192, STRIP = { x: 140, y: 438, w: 400, h: 70 }, NY = 474;
const PS = 76, PR = 124;   // the two pushes (px); the net is their difference

export class LifterAndWrestlersScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two pictures of forces. A weightlifter holds a barbell steady above her head: the pull of the Earth on the barbell points down and the push of her hands points up, equal in size, so the net force is zero and the forces are balanced. Then two players, R and S, arm-wrestle on a table: R pushes the clasped hands to the right harder than S pushes them to the left, so the hands tilt towards S and the net force points towards S.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < 3.4; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.lifter(ctx, c); else this.wrestle(ctx, c);
  }

  netText(ctx, c, text, x, y, k = 1) {
    ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 800, 28, true); ctx.fillStyle = c.s3ink ?? darken(c.s3, 0.3);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1); ctx.restore();
  }

  // -- b0: the weightlifter holds the barbell steady -------------------------------------------------------
  lifter(ctx, c) {
    const a = this.age, up = ease(a, 0.2, 0.9), barY = LIFT.from + (LIFT.to - LIFT.from) * up;
    drawSurface(ctx, c, 'rough', 20, 660, LIFT.y, { h: 34 });
    const look = figureLook(c, { skin: 2, hairStyle: 'buns', hair: 0, top: 's6', bottom: 's6', bottomStyle: 'shorts', shoeStyle: 'sneaker', mood: up < 1 ? 'effort' : 'smile' });
    drawFigure(ctx, c, { x: LIFT.x, y: LIFT.y, height: LIFT.h, facing: 0, pose: 'reach-up',
      hands: [{ x: LIFT.x + LIFT.grip, y: barY + 2 }, { x: LIFT.x - LIFT.grip, y: barY + 2 }] }, look,
      { between: (cx) => barbell(cx, c, LIFT.x, barY) });
    const ku = ease(a, 1.4, 0.4), kd = ease(a, 1.8, 0.4), kn = ease(a, 2.3, 0.4), kt = ease(a, 2.7, 0.4);
    // Split forces, so no arrow crosses her face: the pull of the Earth as two equal down arrows, one from
    // the plates at each end of the bar; the push of hands as two equal up arrows, one from each hand.
    // Same px scale for all four: the two downs add up to the two ups (balanced).
    const HALF = LF / 2 + 6;
    if (kd > 0) {
      for (const s of [-1, 1]) drawForce(ctx, c, LIFT.x + s * 196, barY + 58, { length: HALF * kd, angle: Math.PI / 2, label: '', alpha: kd, fit: false });
      this.netText(ctx, c, 'pull of the Earth', 40, barY + 58 + HALF + 34, kd);
    }
    if (ku > 0) {
      for (const s of [-1, 1]) drawForce(ctx, c, LIFT.x + s * LIFT.grip, barY - 8, { length: HALF * ku, angle: -Math.PI / 2, label: '', alpha: ku, fit: false });
      ctx.save(); ctx.globalAlpha *= ku; ctx.font = font(c, 800, 28, true); ctx.fillStyle = c.s3ink ?? darken(c.s3, 0.3);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('push of hands', LIFT.x, barY - 8 - HALF - 30); ctx.restore();
    }
    if (kn > 0) drawNet(ctx, c, 40, 70, [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }], { alpha: kn, side: -1, label: '' }), this.netText(ctx, c, 'net force = 0', 62, 70, kn);
    if (kt > 0) drawTag(ctx, c, 'balanced', 556, 70, { size: 32, col: darken(c.s3, 0.1), alpha: kt });
  }

  // -- b1: arm wrestling; R pushes harder and the hands tilt toward S ------------------------------------
  wrestle(ctx, c) {
    const a = this.age, kp = ease(a, 0.3, 0.4), grow = ease(a, 0.8, 0.6), tilt = ease(a, 1.0, 1.3), kn = ease(a, 1.2, 0.4), kt = ease(a, 2.5, 0.4);
    const phi0 = Math.asin((ES.x - ER.x) / 2 / FA), phi = phi0 + 0.36 * tilt;
    const H = { x: ER.x + FA * Math.sin(phi), y: ER.y - FA * Math.cos(phi) };
    // Table: a top and two legs.
    const wood = darken(c.gold, 0.32);
    for (const lx of [90, 566]) {
      ctx.fillStyle = wood; ctx.fillRect(lx, TY + 24, 26, 520 - TY);
      ctx.fillStyle = alpha(lighten(wood, 0.3), 0.8); ctx.fillRect(lx + 3, TY + 24, 7, 520 - TY);
      ctx.strokeStyle = darken(wood, 0.45); ctx.lineWidth = 2; ctx.strokeRect(lx, TY + 24, 26, 520 - TY);
    }
    drawSurface(ctx, c, 'marble', 20, 660, TY, { h: 30 });
    drawSheet(ctx, c, STRIP);
    const lr = figureLook(c, { skin: 1, top: 's1' }), ls = figureLook(c, { skin: 3, top: 's5' });
    arm(ctx, { x: -30, y: TY - 120 }, ER, H, lr.skin, lr.top, 1);
    arm(ctx, { x: 710, y: TY - 120 }, ES, H, ls.skin, ls.top, -1);
    clasp(ctx, H, phi, lr.skin, ls.skin);
    ctx.save(); ctx.font = font(c, 800, 34, true); ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('R', 70, TY - 190); ctx.fillText('S', 610, TY - 190); ctx.restore();
    const R = PS + (PR - PS) * grow, fy = H.y - 50;
    if (kp > 0) {
      drawForce(ctx, c, H.x + 4, fy, { length: R * kp, label: 'push by R', at: 0.92, alpha: kp, fit: false });
      drawForce(ctx, c, H.x - 4, fy, { length: PS * kp, angle: Math.PI, label: 'push by S', side: -1, at: 0.92, alpha: kp, fit: false });
    }
    if (kn > 0 && grow > 0.05) {
      drawNet(ctx, c, STRIP.x + 40, NY, [{ newtons: R, dir: 1 }, { newtons: PS, dir: -1 }], { scale: 1, label: '', alpha: kn, fit: false });
      this.netText(ctx, c, 'net force', STRIP.x + 40 + (PR - PS) + 24, NY, kn);
    }
    if (kt > 0) drawTag(ctx, c, 'R pushes harder', 340, 50, { size: 32, col: darken(c.s3, 0.1), alpha: kt });
  }
}

// ---- scene-local drawing (the kit has no barbell and no standalone arm or hand) ----------------------------

/** A round limb segment with a lit edge, core shade and rim. */
function limb(ctx, x0, y0, x1, y1, w, col) {
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = darken(col, 0.32); ctx.lineWidth = w + 5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  const nx = -(y1 - y0), ny = x1 - x0, n = Math.hypot(nx, ny) || 1, o = w * 0.24, s = ny / n < 0 ? 1 : -1;
  ctx.strokeStyle = alpha(darken(col, 0.16), 0.75); ctx.lineWidth = w * 0.3;
  ctx.beginPath(); ctx.moveTo(x0 + s * nx / n * o, y0 + s * ny / n * o); ctx.lineTo(x1 + s * nx / n * o, y1 + s * ny / n * o); ctx.stroke();
  ctx.strokeStyle = alpha(lighten(col, 0.35), 0.7); ctx.lineWidth = w * 0.16;
  ctx.beginPath(); ctx.moveTo(x0 - s * nx / n * o, y0 - s * ny / n * o); ctx.lineTo(x1 - s * nx / n * o, y1 - s * ny / n * o); ctx.stroke();
  ctx.restore();
}

/** Shoulder (off the frame) to elbow on the table to the clasped hand; a short sleeve on the upper arm. */
function arm(ctx, S, E, H, skin, sleeve, side) {
  limb(ctx, S.x, S.y, E.x, E.y, 54, skin);
  const k = 0.42, sx = S.x + (E.x - S.x) * k, sy = S.y + (E.y - S.y) * k;
  limb(ctx, S.x, S.y, sx, sy, 64, sleeve);
  const wx = E.x + (H.x - E.x) * 0.84, wy = E.y + (H.y - E.y) * 0.84;
  limb(ctx, E.x, E.y, wx, wy, 42, skin);
  ctx.save(); ctx.fillStyle = alpha(darken(skin, 0.3), 0.5);
  ctx.beginPath(); ctx.ellipse(E.x - side * 4, E.y + 16, 30, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

/** Two fists clasped at H, R's from the left, S's wrapping over it from the right. */
function clasp(ctx, H, phi, skinR, skinS) {
  const one = (dx, ang, skin, w) => {
    ctx.save(); ctx.translate(H.x + dx, H.y); ctx.rotate(ang);
    rr(ctx, -w / 2, -32, w, 64, 24); ctx.fillStyle = skin; ctx.fill();
    ctx.fillStyle = alpha(lighten(skin, 0.3), 0.7); rr(ctx, -w / 2 + 5, -25, 12, 48, 6); ctx.fill();
    ctx.fillStyle = alpha(darken(skin, 0.2), 0.7); rr(ctx, w / 2 - 15, -25, 10, 48, 5); ctx.fill();
    rr(ctx, -w / 2, -32, w, 64, 24); ctx.strokeStyle = darken(skin, 0.32); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.strokeStyle = alpha(darken(skin, 0.35), 0.8); ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) { const ky = -30 + i * 15; ctx.beginPath(); ctx.moveTo(w / 2 - 14, ky); ctx.lineTo(w / 2, ky); ctx.stroke(); }
    ctx.restore();
  };
  one(-10, phi - 0.5, skinR, 58);
  one(16, phi - 0.2, skinS, 54);
  // R's thumb curls over the top of the grip.
  ctx.save(); ctx.translate(H.x - 4, H.y - 26); ctx.rotate(phi - 0.9);
  rr(ctx, -9, -16, 18, 32, 9); ctx.fillStyle = skinR; ctx.fill(); ctx.strokeStyle = darken(skinR, 0.32); ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();
}

/** A barbell (front view): the bar, sleeves, collars and two plates each side. */
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
