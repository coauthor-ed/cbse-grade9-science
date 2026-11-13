/**
 * SteadyBoxScene - slide blk-l11-n01 "Balanced forces, steady motion" (2 beats; Ex 6.2, P&P 5).
 *   b0 'box'  a person pushes a moving crate on a tiled floor. The push and the friction at the
 *             bottom of the box are equal and opposite; "net force = 0" below. The box and the person
 *             move right at a steady speed: equal-time dots on the floor with equal gap brackets, the
 *             v arrow on the box keeps one length, tag "constant velocity". Rest: a moment of that
 *             steady motion, everything shown.
 *   b1 'add'  two panels (side by side; stacked in portrait), each "net force = 0": the weightlifter
 *             (she) holds a barbell steady (pull of the Earth at the plates, push of hands at the
 *             hands, equal totals), and the same box with its two equal arrows. Tags "steady barbell"
 *             and "push balances friction". Rest: both.
 * Every frame is a function of the beat and its age only. One px scale for the force arrows of a beat.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, font, rr } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { trackSpec, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { drawMotionArrow, drawSurface } from '../shared/MotionCast.js';
import { drawSheet, drawTag } from '../shared/MotionGraph.js';
import { drawForce, drawNet, drawBoxOn, drawPusher } from '../shared/ForceCast.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const FLOOR = 352, BW = 150, BH = 140, PH = 212, FORCE = 104;      // floor top, box size, pusher height, push = friction (px)
const XA = 236, XB = 476, T_RUN = 3.0, T0 = 0.3, DT = 0.75;          // box centre moves XA -> XB in T_RUN s: steady speed
const STRIP = { x: 120, y: 448, w: 440, h: 60 }, NY = 478;
// b1: the lifter (L09 drawing) and the box, each drawn in its own local frame and fitted into a panel.
const LIFT = { x: 340, y: 486, h: 262, grip: 62, from: 292, to: 210 }, BAR_HALF = 232, HALF = 56;
const LIFT_BOX = { x: 96, y: 126, w: 488, h: 396 };                  // local bounds of the lifter, its arrows and floor
const BOXL = { floor: 360, x: 420 };                                 // the small box rig, local frame
const BOX_BOX = { x: 118, y: 140, w: 452, h: 258 };

export class SteadyBoxScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A person pushes a moving box across a tiled floor. The push forward and the friction backward at the bottom of the box are equal, so the net force is zero, and the box moves at a constant velocity: dots marked at equal times on the floor are equally spaced. Then two examples of a net force of zero: a weightlifter holds a barbell steady, the pull of the Earth on it balanced by the push of her hands, and a push that balances friction on a box.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.cur === 0 ? this.age < T0 + T_RUN + 0.6 : this.age < 3.4; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.box(ctx, c); else this.add(ctx, c);
  }

  netText(ctx, c, text, x, y, k = 1, align = 'left') {
    ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 800, 28, true); ctx.fillStyle = c.s3ink ?? darken(c.s3, 0.3);
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1); ctx.restore();
  }

  /** The crate on the tiled floor and the person pushing its back face (local frame; floor top at fy). */
  rig(ctx, c, x, fy, x0, x1) {
    const box = drawBoxOn(ctx, c, { x, y: fy, w: BW, h: BH, surface: 'tiles', x0, x1, surfaceH: 34 });
    drawPusher(ctx, c, { at: { x: box.back.x + 2, y: box.top.y + 34 }, y: fy, height: PH, effort: 0.55, facing: 1 });
    return box;
  }

  // -- b0: push = friction, the box moves at a steady speed ---------------------------------------------------
  box(ctx, c) {
    const a = this.age, t = clamp01((a - T0) / T_RUN) * T_RUN, x = XA + (XB - XA) * t / T_RUN;
    const k = ease(a, 0.1, 0.4), kn = ease(a, 0.9, 0.4), kv = ease(a, 0.5, 0.4), kt = ease(a, 1.6, 0.4);
    const box = this.rig(ctx, c, x, FLOOR, 0, 680);
    // Equal-time dots (just below the floor edge) under the centre of the box, one every DT seconds of the run, with gap brackets.
    const spec = trackSpec({ from: XA, to: XB, x0: XA, x1: XB, y: FLOOR + 56 });
    const at = [];
    for (let i = 0; i * DT <= t + 1e-6; i++) at.push(XA + (XB - XA) * (i * DT) / T_RUN);
    drawStrobe(ctx, c, spec, { at, marks: 'dots', gaps: true, gapLabels: at.map(() => ''), bracketY: FLOOR + 74, markTone: 1 });
    if (k > 0) {
      drawForce(ctx, c, box.centre.x, box.top.y + 30, { length: FORCE * k, at: 0.7, label: 'push', alpha: k, fit: false });
      drawForce(ctx, c, box.bottom.x, box.bottom.y + 2, { length: FORCE * k, angle: Math.PI, label: 'friction', side: 1, at: 0.6, alpha: k, fit: false });
    }
    if (kv > 0) drawMotionArrow(ctx, c, 'v', box.top.x - 46, box.top.y - 30, { length: 96, label: 'v', side: 1, alpha: kv });
    drawSheet(ctx, c, STRIP);
    if (kn > 0) drawNet(ctx, c, STRIP.x + 40, NY, [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }], { alpha: kn, side: -1, label: '' }), this.netText(ctx, c, 'net force = 0', STRIP.x + 64, NY, kn);
    if (kt > 0) drawTag(ctx, c, 'constant velocity', 340, 60, { size: 30, col: c.s1ink ?? darken(c.s1, 0.2), alpha: kt });
  }

  // -- b1: two ways to make the net force zero ----------------------------------------------------------------
  layout() {
    if (this.portrait) return {
      lift: { x: 16, y: 24, w: 410, h: 252 }, box: { x: 16, y: 326, w: 410, h: 150 },
      liftTag: [548, 100, 'center'], liftNet: [454, 172], boxTag: [340, 302, 'center'], boxNet: [454, 412],
    };
    return {
      lift: { x: 8, y: 92, w: 396, h: 360 }, box: { x: 410, y: 150, w: 262, h: 220 },
      liftTag: [18, 40, 'left'], liftNet: [40, 486], boxTag: [664, 40, 'right'], boxNet: [432, 486],
    };
  }

  /** Fit a local box into a panel rect: { s, map(x, y) }. */
  fit(L, R) {
    const s = Math.min(R.w / L.w, R.h / L.h), ox = R.x + (R.w - L.w * s) / 2 - L.x * s, oy = R.y + (R.h - L.h * s) / 2 - L.y * s;
    return { s, ox, oy, map: (x, y) => ({ x: ox + x * s, y: oy + y * s }) };
  }

  label(ctx, c, lines, x, y, k, align = 'center') {
    ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 800, 26, true); ctx.fillStyle = c.s3ink ?? darken(c.s3, 0.3);
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * 30));
    ctx.restore();
  }

  add(ctx, c) {
    const a = this.age, Lo = this.layout();
    const up = ease(a, 0.2, 0.9), barY = LIFT.from + (LIFT.to - LIFT.from) * up;
    const ku = ease(a, 1.2, 0.4), kd = ease(a, 1.5, 0.4), kb = ease(a, 1.0, 0.4), kn = ease(a, 2.0, 0.4), kt = ease(a, 2.4, 0.4);
    // Left (top): the weightlifter.
    const F1 = this.fit(LIFT_BOX, Lo.lift);
    ctx.save(); ctx.translate(F1.ox, F1.oy); ctx.scale(F1.s, F1.s);
    drawSurface(ctx, c, 'rough', LIFT_BOX.x + 6, LIFT_BOX.x + LIFT_BOX.w - 6, LIFT.y, { h: 34 });
    const look = figureLook(c, { skin: 2, hairStyle: 'buns', hair: 0, top: 's6', bottom: 's6', bottomStyle: 'shorts', shoeStyle: 'sneaker', mood: up < 1 ? 'effort' : 'smile' });
    drawFigure(ctx, c, { x: LIFT.x, y: LIFT.y, height: LIFT.h, facing: 0, pose: 'reach-up',
      hands: [{ x: LIFT.x + LIFT.grip, y: barY + 2 }, { x: LIFT.x - LIFT.grip, y: barY + 2 }] }, look,
      { between: (cx) => barbell(cx, c, LIFT.x, barY) });
    // Two equal down arrows (the plates) and two equal up arrows (the hands): equal totals.
    if (kd > 0) for (const s of [-1, 1]) drawForce(ctx, c, LIFT.x + s * 196, barY + 58, { length: HALF * kd, angle: Math.PI / 2, label: '', alpha: kd, fit: false });
    if (ku > 0) for (const s of [-1, 1]) drawForce(ctx, c, LIFT.x + s * LIFT.grip, barY - 8, { length: HALF * ku, angle: -Math.PI / 2, label: '', alpha: ku, fit: false });
    ctx.restore();
    const ph = F1.map(LIFT.x, barY - 8 - HALF - 24), pe = F1.map(LIFT.x - 196, barY + 58 + HALF + 26);
    if (ku > 0) this.label(ctx, c, ['push of hands'], ph.x, ph.y, ku);
    if (kd > 0) this.label(ctx, c, ['pull of', 'the Earth'], Math.max(pe.x, Lo.lift.x + 62), pe.y, kd);
    // Right (bottom): the box, push = friction (same px length; the panel scale shrinks both alike).
    const F2 = this.fit(BOX_BOX, Lo.box);
    ctx.save(); ctx.translate(F2.ox, F2.oy); ctx.scale(F2.s, F2.s);
    const box = this.rig(ctx, c, BOXL.x, BOXL.floor, BOX_BOX.x + 4, BOX_BOX.x + BOX_BOX.w - 4);
    if (kb > 0) {
      drawForce(ctx, c, box.centre.x, box.top.y + 30, { length: FORCE * kb, label: '', alpha: kb, fit: false });
      drawForce(ctx, c, box.bottom.x, box.bottom.y + 2, { length: FORCE * kb, angle: Math.PI, label: '', alpha: kb, fit: false });
    }
    ctx.restore();
    const pp = F2.map(box.centre.x + FORCE * 0.62, box.top.y - 4), pf = F2.map(box.bottom.x - FORCE * 0.62, BOXL.floor + 34);
    if (kb > 0) { this.label(ctx, c, ['push'], pp.x, pp.y - 14, kb); this.label(ctx, c, ['friction'], pf.x, pf.y + 20, kb); }
    // Net force = 0 for each, and the two tags.
    for (const [x, y] of [Lo.liftNet, Lo.boxNet]) {
      if (kn > 0) drawNet(ctx, c, x, y, [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }], { alpha: kn, side: -1, label: '' }), this.netText(ctx, c, 'net force = 0', x + 24, y, kn);
    }
    if (kt > 0) {
      drawTag(ctx, c, 'steady barbell', Lo.liftTag[0], Lo.liftTag[1], { size: 28, align: Lo.liftTag[2], col: darken(c.s3, 0.1), alpha: kt });
      drawTag(ctx, c, 'push balances friction', Lo.boxTag[0], Lo.boxTag[1], { size: 28, align: Lo.boxTag[2], col: darken(c.s3, 0.1), alpha: kt });
    }
  }
}

/** A barbell (front view): the bar, sleeves, collars and two plates each side (as in L09). */
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
