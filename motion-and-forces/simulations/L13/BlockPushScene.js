/**
 * BlockPushScene - slide blk-l13-n04 "Pushing a heavy block" (2 beats; Ex 6.5).
 *   b0 'balanced'  Rahul pushes a 25 kg wooden block on a tiled floor with 50 N; friction at the bottom
 *                  of the block is 50 N the other way (equal arrows, one scale). net force = 0 (kit dot);
 *                  the block stays still while he strains a little. Rest: that.
 *   b1 'moves'     the push grows to 55 N (5 N longer), friction stays 50 N; the net 5 N arrow shows at
 *                  the bottom. A stopwatch counts 0 to 2 s (compressed) while the block slides by
 *                  x = 0.1 t^2 m along a ruler (0 to 0.4 m); equal-time dots every 0.5 s with growing gaps.
 *                  Tags write on: the acceleration sum, then the displacement s = 0.4 m.
 *                  Rest: block at 0.4 m, everything shown.
 * One force scale for the scene: 3 px per newton (50 N = 150 px). Ruler: 600 px per metre.
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { trackSpec, drawStrobe, drawScale } from 'simulations/base/kit/SimTrack.js';
import { drawMotionArrow } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';
import { drawForce, drawNet, drawBoxOn, drawPusher, forceScale } from '../shared/ForceCast.js';

const SUP2 = '\u00b2';
const FLOOR = 318, BW = 156, BH = 142, X0 = 262, PXN = 3, PXM = 600, SC = forceScale(PXN);
const FRONT0 = X0 + BW / 2, RULER_Y = 382, DOT_Y = 364, S_Y = 470, NX = 110, NY = 494, PH = 212;
const RUN0 = 1.2, RUN = 3.0;                       // the 2 s of the book run in 3 s
const DOTS = [0, 0.5, 1, 1.5, 2];
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const xOf = (t) => 0.1 * t * t;                   // metres: a = 0.2 m/s^2 from rest

export class BlockPushScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Rahul pushes a 25 kilogram wooden block on a level floor. First he pushes with 50 newtons and friction at the bottom of the block is 50 newtons the other way: the net force is zero and the block stays still. Then he pushes with 55 newtons while friction stays at 50 newtons: a net force of 5 newtons acts forward. A stopwatch runs for 2 seconds while the block speeds up along a ruler, with dots at equal times spreading apart; its acceleration is 0.2 metres per second squared and it moves 0.4 metres.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < (this.cur === 0 ? 2.8 : RUN0 + RUN + 1.2); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.balanced(ctx, c); else this.moves(ctx, c);
  }

  rahul(c) { return figureLook(c, { skin: 3, hairStyle: 'short', hair: 0, top: 's1', bottom: 'denim' }); }

  /** The ruler under the floor (0 at the block's front face at the start). */
  ruler(ctx, c, k) {
    ctx.save(); ctx.globalAlpha *= k;
    drawScale(ctx, c, { vertical: false, at: RULER_Y, p0: FRONT0, p1: FRONT0 + 0.4 * PXM, from: 0, to: 0.4, every: 0.1, minor: 0.05, origin: null, side: 1 });   // kit: side 1 puts a horizontal scale's labels below the bar
    ctx.restore();
  }

  /** The floor, the block with its front face at FRONT0 + x px, and Rahul pushing its back face. */
  rig(ctx, c, dx, effort, named = false) {
    const box = drawBoxOn(ctx, c, { x: X0 + dx, y: FLOOR, w: BW, h: BH, kind: 'block', surface: 'tiles', x0: 0, x1: 680, surfaceH: 32 });
    const sk = drawPusher(ctx, c, { at: { x: box.back.x + 2, y: FLOOR - 0.6 * PH }, y: FLOOR, height: PH, effort, facing: 1, x: box.back.x - 80 - 10 * effort, look: this.rahul(c) });
    drawTag(ctx, c, '25 kg', box.centre.x, box.centre.y + 4, { size: 26 });
    if (named) drawTag(ctx, c, 'Rahul', box.back.x - 92, FLOOR - PH - 18, { size: 26 });
    return { box, sk };
  }

  push(ctx, c, box, n, k = 1) {
    return drawForce(ctx, c, box.centre.x, box.top.y + 40, { newtons: n, scale: SC, at: 0.74, label: Math.round(n) + ' N', alpha: k, fit: false });
  }
  friction(ctx, c, box, k = 1) {
    // The label sits on a chip: bare green text over the wood or the tiles is too faint. It sits below the
    // floor, left of the arrow head, so the block face stays clear (and clear of the dots and the ruler).
    const r = drawForce(ctx, c, box.bottom.x, box.bottom.y + 2, { newtons: 50, scale: SC, angle: Math.PI, label: '', alpha: k, fit: false });
    drawTag(ctx, c, '50 N', r.x2 - 26, FLOOR + 50, { col: c.s3, alpha: k, align: 'right', prefer: [[0, 0]] });
    return r;
  }

  // -- b0: 50 N against 50 N; nothing moves ------------------------------------------------------------
  balanced(ctx, c) {
    const a = this.age, k1 = ease(a, 0.3, 0.5), k2 = ease(a, 0.7, 0.5), kn = ease(a, 1.5, 0.5);
    const strain = 0.55 + 0.08 * Math.sin(a * 6) * (1 - clamp01((a - 1.6) / 0.6));
    this.ruler(ctx, c, 0.35);
    const { box } = this.rig(ctx, c, 0, strain, true);
    if (k1 > 0) this.push(ctx, c, box, 50 * k1, k1);
    if (k2 > 0) this.friction(ctx, c, box, k2);
    if (kn > 0) drawNet(ctx, c, NX + 10, NY, [{ newtons: 50, dir: 1 }, { newtons: 50, dir: -1 }], { scale: PXN, alpha: kn, label: 'net force = 0', side: 1 });
  }

  // -- b1: 55 N against 50 N; the block speeds up for 2 s ----------------------------------------------
  moves(ctx, c) {
    const a = this.age, g = ease(a, 0.2, 0.7), push = 50 + 5 * g, kn = ease(a, 0.7, 0.4);
    const t = 2 * clamp01((a - RUN0) / RUN), xm = xOf(t), done = a >= RUN0 + RUN;
    const kA = ease(a, RUN0 + 0.2, 0.5), kS = ease(a, RUN0 + RUN + 0.1, 0.5);
    this.ruler(ctx, c, 1);
    // Equal-time dots (every 0.5 s of the book clock) at the front face, from x(t).
    const spec = trackSpec({ from: 0, to: 0.4, x0: FRONT0, x1: FRONT0 + 0.4 * PXM, y: DOT_Y });
    const at = DOTS.filter((ti) => ti <= t + 1e-6).map(xOf);
    if (at.length) drawStrobe(ctx, c, spec, { at, marks: 'dots', markTone: 'annot' });
    const { box } = this.rig(ctx, c, xm * PXM, 0.8);
    this.push(ctx, c, box, push);
    this.friction(ctx, c, box);
    // The net force: its own arrow on the block, just above it (the floor, dots and ruler fill the band
    // below), same px scale; 15 px is honest, so the label sits beside the head.
    if (kn > 0) {
      const nt = drawNet(ctx, c, box.centre.x - 6, box.top.y - 26, [{ newtons: push, dir: 1 }, { newtons: 50, dir: -1 }], { scale: PXN, alpha: kn, label: '', fit: false });
      drawTag(ctx, c, 'net ' + Math.round(push - 50) + ' N', nt.arrow.x2 + 14, box.top.y - 26, { col: c.s3, alpha: kn, align: 'left', prefer: [[0, 0]] });
    }
    drawStopwatch(ctx, c, { x: 78, y: 96, r: 46, seconds: t, dialSeconds: 4, text: done ? '2 s' : t.toFixed(1) + ' s' });
    if (kA > 0) drawTag(ctx, c, 'a = 5 N / 25 kg = 0.2 m/s' + SUP2, 466, 34, { alpha: kA });
    if (kS > 0) drawMotionArrow(ctx, c, 's', FRONT0, S_Y, { length: 0.4 * PXM * kS, label: 's = 0.4 m', side: -1, alpha: kS });
  }
}
