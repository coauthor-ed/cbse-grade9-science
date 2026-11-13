/**
 * SystemScene - two boxes on a string on the ideal floor (Fig 6.34). Slides: predict setup of blk-l16-s2
 * "Two boxes on a string", and blk-l16-s3 "Two boxes as one system" (2 beats).
 * SystemExternalScene (thin subclass, MODE 'external') draws blk-l16-s4 "The whole, not the parts".
 * One world: the ideal (frictionless) floor, the L11 glass look with a dashed edge. Box 2 at the left (m2,
 * series-2), Box 1 at the right (m1, series-1), equal masses drawn, a taut string between them. F pulls
 * Box 1 to the right. Motion: both boxes move together from rest, x = 1/2 a t squared on a compressed clock
 * (2.4 s); equal-time dots (every 0.6 s), under the floor strip, mark where Box 2's back edge was, so the gaps grow.
 *   setup  boxes, string, F; they start to move together, dots. No a, no formula, no T.
 *   b0 'tension'  F on Box 1 (right); T on Box 1 (left, tail at its knot, above the string); T on Box 2
 *                 (right, tail at its knot, below the string); the two T equal, each half of F (m1 = m2).
 *   b1 'system'   a dashed outline round both boxes and the string, "system"; the T arrows fade to 20 per
 *                 cent, "internal"; F "external"; a chip "a = F / (m1 + m2)" under the floor.
 * Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, rr, luma, font, inkOn } from 'simulations/base/kit/SimLook.js';
import { drawBlock, propRig } from 'simulations/base/kit/SimProps.js';
import { trackSpec, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawForce } from '../shared/ForceCast.js';
import { drawSurface, drawMotionArrow } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const SETUP = 9;
// the world
const FLOOR = 360, FH = 44, BW = 150, BH = 124, GAP = 84, X2 = 104, SY = FLOOR - 62;
const F_LEN = 128, T_LEN = 64;                      // m1 = m2 drawn, so T = F / 2
// the motion: D px in TM s from rest (constant acceleration), dots every DT s
const T0 = 0.5, TM = 2.4, D = 110, DT = 0.6, ACC = 2 * D / (TM * TM);
const W_LEN = 108;                                  // weight and normal force: one scale, equal
// the walker (external b1): steady speed, rests mid-stride (walk phase 0.25: feet widest apart)
const WH = 272, WX0 = 170, WALK = 2.8, WD = 1.25 * 0.68 * WH;

export class SystemScene extends SimScene {
  static MODE = 'boxes';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: SETUP, dwellMs: null }]] };
  static ARIA_LABEL = 'Two boxes on a smooth floor with no friction, tied by a string: Box 2 on the left with mass m2, Box 1 on the right with mass m1. A force F pulls Box 1 to the right and both boxes speed up together; dots left at equal times spread out. Then the tension T: on Box 1 it acts to the left, on Box 2 to the right, equal. Then a dashed outline round both boxes and the string marks one system: T is an internal force and fades; F is the external force, and a = F / (m1 + m2).';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.age < (this.constructor.MODE === 'external' && this.cur >= 1 ? 0.3 + WALK + 0.6 : T0 + TM + 0.8); }

  /** How far both boxes have moved at age a: d = 1/2 a t^2, then held. */
  shift(a) { const t = Math.min(TM, Math.max(0, a - T0)); return 0.5 * ACC * t * t; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.constructor.MODE === 'external') { this.drawExternal(ctx, c); return; }
    const a = this.age, setup = this.isSetup(), beat = setup ? -1 : this.cur;
    const w = this.world(ctx, c, a);
    const kF = ease(a, 0.1, 0.35);
    drawForce(ctx, c, w.b1.x0 + BW, SY, { length: F_LEN * kF, angle: 0, label: 'F', alpha: kF, fit: false });
    if (beat < 0) return;
    const kT = ease(a, 0.25, 0.4), fade = beat >= 1 ? 1 - 0.8 * ease(a, 0.3, 0.5) : 1;
    this.tensions(ctx, c, w, kT * fade);
    if (beat < 1) return;
    const kO = ease(a, 0.2, 0.5), kc = ease(a, 0.9, 0.4);
    const o = this.outline(ctx, c, w, kO);
    this.tag(ctx, c, 'system', o.x0, o.y0 - 24, c.label, kO, 'left');
    this.tag(ctx, c, 'internal', (w.k2.x + w.k1.x) / 2, o.y0 - 24, c.labelMuted, kO);
    this.tag(ctx, c, 'external', w.b1.x0 + BW + F_LEN * 0.6, SY - 72, c.s3ink, kO);
    this.tag(ctx, c, 'a = F / (m1 + m2)', (o.x0 + o.x1) / 2, FLOOR + FH + 42, c.accent, kc);
  }

  tag(ctx, c, s, x, y, col, k, align = 'center') {
    if (k > 0) drawTag(ctx, c, s, x, y, { size: 26, col, alpha: k, align, prefer: [[0, 0]] });
  }

  /** Floor, dots, the two boxes and the string at age a; returns where things are. */
  world(ctx, c, a) {
    this.idealFloor(ctx, c, 0, 680, FLOOR, FH);
    const d = this.shift(a), back0 = X2 - BW / 2;
    // equal-time dots: where Box 2's back edge was at t = 0, DT, 2 DT ... so far; on a line just under the
    // floor strip, clear of the boxes, so the growing gaps (speeding up) read on their own
    const t = Math.min(TM, Math.max(0, a - T0)), xs = [];
    for (let k = 0; k * DT <= t + 1e-6; k++) xs.push(back0 + 0.5 * ACC * (k * DT) * (k * DT));
    if (a > T0) drawStrobe(ctx, c, trackSpec({ from: 0, to: 680, x0: 0, x1: 680, y: FLOOR + FH + 16 }), { at: xs, marks: 'dots' });
    const rig = propRig({ x0: 0, groundY: FLOOR, scale: 1 });
    const x2 = X2 + d, x1 = x2 + BW + GAP;
    const b2 = drawBlock(ctx, c, rig, x2, { w: BW, h: BH, tone: 2 });
    const b1 = drawBlock(ctx, c, rig, x1, { w: BW, h: BH, tone: 1 });
    this.boxText(ctx, c, b2, 'Box 2', 'm2', c.s2);
    this.boxText(ctx, c, b1, 'Box 1', 'm1', c.s1);
    const k2 = { x: b2.x0 + BW, y: SY }, k1 = { x: b1.x0, y: SY };
    this.string(ctx, c, k2, k1);
    return { b1, b2, k1, k2, d };
  }

  boxText(ctx, c, b, name, m, col) {
    ctx.save(); ctx.font = font(c, 800, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = inkOn(c, col);
    ctx.fillText(name, b.x0 + b.w / 2, b.y0 + b.h * 0.34);
    ctx.font = font(c, 700, 26, true); ctx.fillText(m, b.x0 + b.w / 2, b.y0 + b.h * 0.7);
    ctx.restore();
  }

  /** A taut string between two knots (a small ring screwed into each box face). */
  string(ctx, c, p, q) {
    const col = mix(c.gold, c.label, 0.45);
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = darken(col, 0.35); ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
    for (const k of [p, q]) { ctx.beginPath(); ctx.arc(k.x, k.y, 5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = darken(col, 0.45); ctx.stroke(); }
    ctx.restore();
  }

  /** The pair through the string: T on Box 1 (left, above the string), T on Box 2 (right, below it). */
  tensions(ctx, c, w, k) {
    if (k <= 0) return;
    drawForce(ctx, c, w.k1.x - 2, SY - 13, { length: T_LEN, angle: Math.PI, label: 'T', side: -1, alpha: k, fit: false });
    drawForce(ctx, c, w.k2.x + 2, SY + 13, { length: T_LEN, angle: 0, label: 'T', side: -1, alpha: k, fit: false });
  }

  /** The dashed system outline round both boxes and the string; returns its rect. */
  outline(ctx, c, w, k) {
    const x0 = w.b2.x0 - 14, x1 = w.b1.x0 + BW + 14, y0 = FLOOR - BH - 18, y1 = FLOOR + 8;
    if (k > 0) {
      ctx.save(); ctx.globalAlpha *= k;
      rr(ctx, x0, y0, x1 - x0, y1 - y0, 18); ctx.fillStyle = alpha(c.accent, 0.06); ctx.fill();
      ctx.setLineDash([12, 9]); ctx.lineWidth = 3.5; ctx.strokeStyle = c.accent; ctx.stroke();
      ctx.restore();
    }
    return { x0, x1, y0, y1 };
  }

  // -- the ideal floor (the L10/L11 glass surface with a dashed outline edge) ---------------------------
  idealFloor(ctx, c, x0, x1, y, h) {
    const p = darken(luma(c.label) > luma(c.bgSurface) ? c.label : c.bgSurface, 0.04);
    const base = mix(p, c.glass, 0.5), w = x1 - x0, R = 8;
    const path = () => rr(ctx, x0, y, w, h, R);
    ctx.save();
    ctx.save(); ctx.translate(0, 6); path(); ctx.fillStyle = alpha(darken(base, 0.5), 0.55); ctx.fill(); ctx.restore();
    path(); ctx.fillStyle = base; ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.fillStyle = darken(base, 0.1); ctx.fillRect(x0, y + h * 0.78, w, h);
    const g = ctx.createLinearGradient(x0, y, x0, y + h); g.addColorStop(0, lighten(base, 0.5)); g.addColorStop(1, darken(base, 0.05));
    ctx.fillStyle = g; ctx.fillRect(x0, y, w, h);
    for (const [sx, sw] of [[0.1, 160], [0.5, 60], [0.72, 120]]) {
      const gx = x0 + w * sx; ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + sw, y); ctx.lineTo(gx + sw - h * 0.7, y + h); ctx.lineTo(gx - h * 0.7, y + h); ctx.closePath();
      ctx.fillStyle = alpha(lighten(base, 0.95), 0.5); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = alpha(lighten(base, 0.5), 0.6); ctx.lineWidth = 1.5; rr(ctx, x0 + 4, y + 4, w - 8, h - 8, R - 3); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(c.glass, 0.7), 0.9); ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0 + 10, y + 4); ctx.lineTo(x1 - 10, y + 4); ctx.stroke();
    ctx.setLineDash([10, 9]); ctx.lineWidth = 3.5; ctx.strokeStyle = darken(c.glass, 0.35);
    rr(ctx, x0, y, w, h, R); ctx.stroke();
    ctx.restore();
  }

  // -- SystemExternalScene (MODE 'external') ------------------------------------------------------------
  drawExternal(ctx, c) {
    const a = this.age;
    if (this.cur >= 1) { this.walker(ctx, c, a); return; }
    // b0 'vertical': the system, F, and the two vertical external forces, equal and opposite
    const w = this.world(ctx, c, a);
    const o = this.outline(ctx, c, w, 1);
    this.tag(ctx, c, 'system', o.x0, o.y0 - 24, c.label, 1, 'left');
    drawForce(ctx, c, w.b1.x0 + BW, SY, { length: F_LEN, angle: 0, label: 'F', fit: false });
    const k = ease(a, 0.3, 0.45), cx = (w.k1.x + w.k2.x) / 2, cy = SY;
    if (k <= 0) return;
    drawForce(ctx, c, cx, cy - 4, { length: W_LEN * k, angle: -Math.PI / 2, label: '', alpha: k, fit: false });
    drawForce(ctx, c, cx, cy + 4, { length: W_LEN * k, angle: Math.PI / 2, label: '', alpha: k, fit: false });
    ctx.save(); ctx.globalAlpha *= k; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fillStyle = c.label; ctx.fill(); ctx.restore();
    this.tag(ctx, c, 'normal force N1 + N2', cx + 14, cy - W_LEN - 10, c.s3ink, k, 'left');
    this.tag(ctx, c, 'weight (m1 + m2) g', cx + 14, FLOOR + FH + 40, c.s3ink, k, 'left');
    this.tag(ctx, c, 'balance', cx - 16, FLOOR + FH + 40, c.accent, ease(a, 0.9, 0.4), 'right');
  }

  /** b1 'body': a walker at steady speed inside one dashed outline, a dot at the body's centre with v. */
  walker(ctx, c, a) {
    const FY = 440;
    drawSurface(ctx, c, 'tiles', 0, 680, FY, { h: 32, seed: 3 });
    const u = clamp01((a - 0.3) / WALK), dist = WD * u, x = WX0 + dist;
    const look = figureLook(c, { skin: 2, hairStyle: 'short', hair: 0, top: 's5', bottom: 'navy', shoeStyle: 'sneaker' });
    // the outline first (behind), then the walker, then the dot and v on top
    const ox0 = x - 0.27 * WH, ox1 = x + 0.3 * WH, oy0 = FY - WH - 22, oy1 = FY + 6;
    ctx.save(); rr(ctx, ox0, oy0, ox1 - ox0, oy1 - oy0, 22); ctx.fillStyle = alpha(c.accent, 0.06); ctx.fill();
    ctx.setLineDash([12, 9]); ctx.lineWidth = 3.5; ctx.strokeStyle = c.accent; ctx.stroke(); ctx.restore();
    drawFigure(ctx, c, { x, y: FY, height: WH, facing: 1, pose: { name: 'walk', phase: (dist / (0.68 * WH)) % 1 } }, look);
    const cy = FY - 0.55 * WH;
    drawMotionArrow(ctx, c, 'v', x + 10, cy, { length: 96, angle: 0, label: 'v', side: 1, at: 1.25 });
    ctx.save(); ctx.beginPath(); ctx.arc(x, cy, 9, 0, Math.PI * 2); ctx.fillStyle = c.accent; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = c.bgSurface; ctx.stroke(); ctx.restore();
    this.tag(ctx, c, 'one object', (ox0 + ox1) / 2, oy0 - 26, c.accent, 1);
  }
}
