/**
 * BoxPushScene - slide blk-l11-s1 "Why will the box not move?" (2 beats; Fig 6.10). MODE 'push'.
 *   b0 'stuck'  you push a heavy box on a tiled floor. The push arrow grows a little; the friction
 *               arrow at the bottom of the box grows with it and stays equal; the box stays put;
 *               net force = 0. Rest: equal arrows, box still.
 *   b1 'moves'  you push harder. Friction grows with the push up to its largest value, then stops;
 *               the push keeps growing past it; the net force arrow (push minus friction) appears;
 *               the box and you start to move forward (x = a t^2 / 2, a in proportion to the net
 *               force), velocity arrow on the box. Rest: moved a little, arrows shown.
 * BoxForcesScene (MODE 'four', slide blk-l10-n01) subclasses this file; its beat is drawn here:
 *   b0 'four'   the box alone (you faded), sliding slowly at a steady speed (push = friction); four
 *               force arrows on the box in order: push, friction, weight (down, from the centre),
 *               normal force (up, tail on the bottom face, at right angles to the floor), weight and
 *               normal equal. A faint air streak behind the box. Rest: four arrows.
 * Every frame is a function of the beat and its age only. One px scale for all arrows of a beat.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, font } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from '../shared/MotionCast.js';
import { drawSheet } from '../shared/MotionGraph.js';
import { drawForce, drawNet, drawBoxOn, drawPusher } from '../shared/ForceCast.js';

const FLOOR = 402, BW = 172, BH = 168, X0 = 360, STRIP = { x: 110, y: 450, w: 460, h: 62 }, NY = 480;
const P0 = 74, P1 = 112, FMAX = 124, P2 = 164;   // push and friction (px): stuck 74 -> 112; largest friction 124; push 164
const KA = 1.0;                                      // px/s^2 of motion per px of net force
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));

export class BoxPushScene extends SimScene {
  static MODE = 'push';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'You push a heavy box on a floor. At first it does not move: friction at the bottom of the box acts backward and grows with your push, staying just as large, so the net force is zero. Then you push harder, past the largest friction the floor can give. Friction stops growing, a net force acts forward, and the box starts to move forward.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < (this.constructor.MODE === 'four' ? 3.6 : this.cur === 0 ? 2.6 : 4.6); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.constructor.MODE === 'four') this.four(ctx, c);
    else if (this.cur === 0) this.stuck(ctx, c); else this.moves(ctx, c);
  }

  netText(ctx, c, text, x, y, k = 1) {
    ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 800, 28, true); ctx.fillStyle = c.s3ink ?? darken(c.s3, 0.3);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1); ctx.restore();
  }

  /** The floor, the box at x and you pushing its back face. */
  rig(ctx, c, x, effort, o = {}) {
    const box = drawBoxOn(ctx, c, { x, y: FLOOR, w: BW, h: BH, surface: 'tiles', x0: 0, x1: 680, surfaceH: 34 });
    ctx.save(); ctx.globalAlpha *= o.youAlpha ?? 1;
    drawPusher(ctx, c, { at: { x: box.back.x + 2, y: box.top.y + 36 }, y: FLOOR, height: 238, effort, facing: 1, x: box.back.x - 90 - 14 * effort });
    ctx.restore();
    return box;
  }

  push(ctx, c, box, len, k = 1, dy = 24) {
    return drawForce(ctx, c, box.centre.x, box.top.y + dy, { length: len, at: 0.72, label: 'push', alpha: k, fit: false });
  }
  friction(ctx, c, box, len, k = 1) {
    return drawForce(ctx, c, box.bottom.x, box.bottom.y + 2, { length: len, angle: Math.PI, label: 'friction', side: 1, alpha: k, fit: false });
  }

  // -- b0: the push grows; friction grows with it; nothing moves -----------------------------------------
  stuck(ctx, c) {
    const a = this.age, k = ease(a, 0.3, 0.4), g = ease(a, 0.8, 1.2), kn = ease(a, 2.0, 0.4);
    const box = this.rig(ctx, c, X0, 0.35 + 0.4 * g);
    drawSheet(ctx, c, STRIP);
    const L = (P0 + (P1 - P0) * g) * k;
    if (k > 0) { this.push(ctx, c, box, L, k); this.friction(ctx, c, box, L, k); }
    if (kn > 0) drawNet(ctx, c, STRIP.x + 40, NY, [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }], { alpha: kn, side: -1, label: '' }), this.netText(ctx, c, 'net force = 0', STRIP.x + 64, NY, kn);
  }

  // -- b1: push past the largest friction; the box starts to move ------------------------------------------
  moves(ctx, c) {
    const a = this.age, g = ease(a, 0.3, 1.4), push = P1 + (P2 - P1) * g, fr = Math.min(push, FMAX);
    const net = push - fr, tStart = 0.3 + 1.4 * 0.42;                         // net > 0 from about here
    const t = Math.max(0, a - tStart - 0.2), T = Math.min(t, 2.0), dx = 0.5 * KA * (P2 - FMAX) * T * T;   // 40 px/s^2 for 2 s: 80 px
    const v = KA * (P2 - FMAX) * T;
    const box = this.rig(ctx, c, X0 - 30 + dx, 0.75 + 0.25 * g);
    drawSheet(ctx, c, STRIP);
    this.push(ctx, c, box, push);
    this.friction(ctx, c, box, fr);
    if (v > 1) drawMotionArrow(ctx, c, 'v', box.top.x - 40, box.top.y - 26, { length: 26 + v * 0.6, label: 'moving', side: 1 });
    if (net > 1) {
      drawNet(ctx, c, STRIP.x + 40, NY, [{ newtons: push, dir: 1 }, { newtons: fr, dir: -1 }], { scale: 1, label: '', fit: false });
      this.netText(ctx, c, 'net force', STRIP.x + 40 + net + 24, NY);
    } else {
      drawNet(ctx, c, STRIP.x + 40, NY, [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }], { side: -1, label: '' });
      this.netText(ctx, c, 'net force = 0', STRIP.x + 64, NY);
    }
  }

  // -- BoxForcesScene: four forces on a box sliding steadily ------------------------------------------------
  four(ctx, c) {
    const a = this.age, L = 118, N = 112, t = Math.min(a, 3.2), x = X0 - 36 + 14 * t;   // steady 14 px/s
    // Faint air streak behind the box (no label).
    ctx.save(); ctx.strokeStyle = alpha(c.labelMuted ?? c.stroke, 0.35); ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const [dy, w] of [[-110, 70], [-74, 96], [-40, 58]]) { const xx = x - BW / 2 - 18; ctx.beginPath(); ctx.moveTo(xx - w, FLOOR + dy); ctx.lineTo(xx, FLOOR + dy); ctx.stroke(); }
    ctx.restore();
    const box = this.rig(ctx, c, x, 0.55, { youAlpha: 0.35 });
    const k1 = ease(a, 0.3, 0.4), k2 = ease(a, 0.8, 0.4), k3 = ease(a, 1.4, 0.4), k4 = ease(a, 2.0, 0.5);
    if (k1 > 0) this.push(ctx, c, box, L * k1, k1, 12);
    if (k2 > 0) this.friction(ctx, c, box, L * k2, k2);
    if (k3 > 0) drawForce(ctx, c, box.centre.x + 44, box.centre.y, { length: N * k3, angle: Math.PI / 2, label: 'weight', at: 0.8, alpha: k3, fit: false });
    if (k4 > 0) drawForce(ctx, c, box.bottom.x, box.bottom.y - 2, { length: N * k4, angle: -Math.PI / 2, label: 'normal force', at: 0.6, alpha: k4, fit: false });
  }
}
