/**
 * PushGroundScene - slide blk-l14-n01 "Pushing the ground" (2 beats; Figs 6.24, 6.25).
 *   b0 'bicycle' a road strip. "You" sit on a bicycle, not pedalling, feet down. Two pushes: each foot is
 *                planted on the road (it does not slide) while the bicycle rolls forward past it, so the
 *                foot ends behind the hip; between pushes the feet swing forward and the bicycle glides.
 *                Rest at the end of the second push: "foot pushes the ground" (tail on the road at the
 *                contact, left, inside the road strip) and "ground pushes the rider" (tail on the foot,
 *                right, just above the road line), equal.
 *   b1 'walk'    the same road; a walker takes 3 steps (phase from distance, no foot slip) and rests
 *                mid-stride with the REAR foot pushing: "foot pushes the ground" (left, below the line)
 *                and "friction on your foot" (right, above the line), equal.
 * Tags: the ground's in series-1 ink, the person's in series-2 ink (the person wears series-2).
 * Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook, walkPhase } from 'simulations/base/kit/SimFigure.js';
import { bicycleRig, drawBicycle } from 'simulations/base/kit/SimProps.js';
import { trackSpec, drawTrack } from 'simulations/base/kit/SimTrack.js';
import { drawForce } from '../shared/ForceCast.js';
import { drawTag } from '../shared/MotionGraph.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const GY = 372, PAIR = 96;
// Bicycle: rider height, bike size, the foot's reach on the road relative to the hip.
const RH = 262, BH = 222, F_FWD = 16, F_BACK = -52, PUSH = F_FWD - F_BACK;
const X_END = 470;
// Timeline (s): push 1 from rest, glide, push 2 (shorter: the bicycle is already moving).
const T1 = 0.3, D1 = 0.62, DG = 0.55, D2 = 0.34, V1 = 2 * PUSH / D1, VG = V1 * 0.82;
const GLIDE = (V1 + VG) / 2 * DG, TRAVEL = PUSH + GLIDE + PUSH, X_START = X_END - TRAVEL;
const T2 = T1 + D1 + DG, T_END = T2 + D2;
// Walk: rest at phase 0.72 (near foot back and planted) after one and a half cycles (3 steps).
const WH = 280, W_DIST = (1 + 0.72) * 0.68 * WH, WX_END = 430, D_WALK = 2.4, TW = 0.3;

export class PushGroundScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Beat 1: you sit on a bicycle without pedalling and push the road backwards with your feet, twice. Each time the foot stays on the road while the bicycle rolls forward. Two equal arrows at the foot: the foot pushes the ground backwards, and the ground pushes the rider forwards. Beat 2: a walker takes three steps and stops mid-stride. At the rear foot, the foot pushes the ground backwards and friction from the ground pushes the foot forwards, with an equal force.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < (this.cur === 0 ? T_END : TW + D_WALK) + 0.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawTrack(ctx, c, trackSpec({ from: 0, to: 100, x0: 0, x1: 680, y: GY }), { kind: 'road', ticks: false });
    if (this.cur === 0) this.drawBike(ctx, c); else this.drawWalk(ctx, c);
  }

  tag(ctx, c, s, x, y, ink, k, align) {
    if (k > 0) drawTag(ctx, c, s, x, y, { col: ink, size: 26, alpha: k, align, prefer: [[0, 0]] });
  }

  /** The bicycle's travel (px from the start) and the near foot's ground point at age a. */
  bikeState(a) {
    if (a < T1) return { d: 0, foot: null, k: 0 };
    if (a < T1 + D1) { const s = (a - T1) / D1; return { d: PUSH * s * s, foot: 0, k: Math.min(1, s * 4) }; }
    if (a < T2) { const s = (a - T1 - D1); return { d: PUSH + V1 * s - (V1 - VG) * s * s / (2 * DG), swing: s / DG, k: Math.max(0, 1 - s * 6) }; }
    const s = Math.min(1, (a - T2) / D2);
    return { d: PUSH + GLIDE + PUSH * s, foot: 1, k: Math.min(1, s * 4) };
  }

  drawBike(ctx, c) {
    const st = this.bikeState(this.age), x = X_START + st.d;
    const bike = bicycleRig({ x, y: GY, forHeight: BH, facing: 1, dist: st.d, tone: 5 });
    const hip = bike.hip.x;
    // Planted foot: fixed on the road from the start of its push; swinging: lifted and carried forward.
    let fx;
    if (st.foot === 0) fx = X_START + (bicycleRig({ x: X_START, y: GY, forHeight: BH }).hip.x - X_START) + F_FWD;
    else if (st.foot === 1) fx = X_START + PUSH + GLIDE + (bike.hip.x - x) + F_FWD;
    else if (st.swing != null) fx = hip + F_BACK + PUSH * inOutSine(st.swing);
    else fx = hip + F_FWD;
    const lift = st.swing != null ? 26 * Math.sin(Math.PI * st.swing) : 0;
    const look = figureLook(c, { skin: 1, hairStyle: 'short', hair: 0, top: 's2', bottom: 'navy', shoeStyle: 'sneaker', mood: 'effort' });
    const near = { x: fx, y: GY - lift }, far = { x: fx - 10, y: GY - lift * 0.8 };
    drawFigure(ctx, c, { ...bike.rider, height: RH, pose: 'cycle', feet: [near, far] }, look,
      { behind: () => drawBicycle(ctx, c, bike, { part: 'back' }), between: () => drawBicycle(ctx, c, bike, { part: 'front' }) });
    if (st.foot != null) this.pair(ctx, c, fx, st.k, 'ground pushes the rider', st.foot === 1);
  }

  drawWalk(ctx, c) {
    const u = ease(this.age, TW, D_WALK), d = W_DIST * u, x = WX_END - W_DIST + d;
    const look = figureLook(c, { skin: 3, hairStyle: 'ponytail', hair: 1, top: 's2', bottom: 'navy', shoeStyle: 'sneaker', mood: 'smile' });
    const sk = drawFigure(ctx, c, { x, y: GY, height: WH, facing: 1, pose: { name: 'walk', phase: walkPhase(d, WH, 'walk') } }, look);
    const k = ease(this.age, TW + D_WALK - 0.1, 0.3);
    if (k > 0) this.pair(ctx, c, sk.anchors.foot[0].x - 6, k, 'friction on your foot');
  }

  /** The pair at a foot on the road: the foot's push on the ground below the line, the ground's push on the foot above it. */
  pair(ctx, c, fx, k, upText, tags = true) {
    if (k <= 0) return;
    const yD = GY + 20, yU = GY - 14, L = PAIR * k;
    drawForce(ctx, c, fx, yD, { length: L, angle: Math.PI, label: '', alpha: k, fit: false });
    drawForce(ctx, c, fx + 2, yU, { length: L, angle: 0, label: '', alpha: k, fit: false });
    if (!tags) return;
    this.tag(ctx, c, upText, fx - 12, yU - 30, c.s2ink, k, 'right');
    this.tag(ctx, c, 'foot pushes the ground', fx + 36, GY + 92, c.s1ink, k, 'right');
  }
}
