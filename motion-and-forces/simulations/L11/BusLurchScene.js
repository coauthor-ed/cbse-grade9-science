/**
 * BusLurchScene - slide blk-l13-s4 "The lurch in a bus" (2 beats). The passenger is "you".
 *   b0 'brake'  inside a bus moving right at a steady speed; the road streams past. You stand upright,
 *               holding nothing. The driver brakes: the bus v arrow shrinks, an a arrow points backward
 *               on the bus; you tip forward (eased 0.4 s) while a v arrow on your body stays long a
 *               moment longer (the body keeps its velocity), tag "body keeps moving".
 *               Rest: mid-braking, tipped forward, all arrows shown.
 *   b1 'start'  the bus at rest starts suddenly: a arrow forward on the bus; you tip backward; then your
 *               hand goes to the handle: F arrow "pull of the handle" forward, tail on the hand; you come
 *               upright and move with the bus. Rest: holding the handle, F arrow shown, bus moving.
 * Kit gap worked around here: drawBusStander always puts the near hand on the strap, so this file tilts
 * the kit figure about the feet itself (same maths) and moves the near hand from the side to the handle.
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack } from 'simulations/base/kit/SimTrack.js';
import { drawBus } from 'simulations/base/kit/SimVehicles.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { LOOKS, drawMotionArrow } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';
import { drawForce } from '../shared/ForceCast.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const GROUND = 452, LENGTH = 620, PXM = LENGTH / 12, DASH = 46, LEAN = 0.24, VPX = 26;   // VPX: arrow px per m/s
// b0: steady V, brakes at T_B, slows to rest over D s; rests mid-braking.
const V = 6, T_B = 0.8, D = 1.8, REST0 = 2.0, LAG = 0.8;
// b1: at rest, starts at T_S with acceleration A; grabs the handle at T_H; rests at REST1 (still speeding up).
const A = 2.4, T_S = 0.5, T_H = 1.3, REST1 = 3.1;
const ARROW_Y = 160;

function vBrake(t) { return t < T_B ? V : Math.max(0, V * (1 - (t - T_B) / D)); }
function xBrake(t) {
  if (t < T_B) return V * t;
  const u = Math.min(t - T_B, D);
  return V * T_B + V * u - 0.5 * (V / D) * u * u;
}

export class BusLurchScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Inside a bus you stand without holding anything while the bus moves at a steady speed. The driver brakes: the bus slows down and its acceleration points backward, but your body keeps its old velocity a moment longer, so you lurch forward. Then a bus at rest starts suddenly: you lurch backward, until your hand takes the handle; the pull of the handle on your hand points forward and you move along with the bus.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < (this.cur === 0 ? REST0 : REST1) + 0.4; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.braking(ctx, c); else this.starting(ctx, c);
  }

  /** The kit road, shifted by the distance travelled so its dashes stream past under the bus. */
  road(ctx, c, metres) {
    const off = (metres * PXM) % DASH, d = 64;
    const spec = trackSpec({ from: 1, to: 2, x0: -60, x1: 760, y: GROUND + d / 2 - 10 });
    ctx.save();
    ctx.beginPath(); ctx.rect(0, GROUND - 40, 680, d + 40); ctx.clip();
    ctx.translate(-off, 0);
    drawTrack(ctx, c, spec, { kind: 'road', depth: d, origin: null, every: 1e6 });
    ctx.restore();
  }

  /** The bus (inside view) and you, tilted about the feet; hold 0..1 moves the near hand to the handle. */
  rig(ctx, c, metres, lean, hold) {
    this.road(ctx, c, metres);
    const bus = drawBus(ctx, c, { x: 340, y: GROUND, length: LENGTH, roll: metres, inside: true, lean, ground: true });
    const Q = bus.anchors, f = bus.f, tilt = Math.max(-0.26, Math.min(0.26, lean));
    const fx = Q.standing.x, fy = Q.standing.y, H = Q.figureHeight, ang = f * tilt, back = -ang;
    // The handle in the figure's own (untilted) frame, and a hand-at-the-side point.
    const hx = Q.handle.x - fx, hy = Q.handle.y - fy;
    const grip = { x: fx + hx * Math.cos(back) - hy * Math.sin(back), y: fy + hx * Math.sin(back) + hy * Math.cos(back) };
    const side = { x: fx + f * 0.1 * H, y: fy - 0.46 * H };
    const hand = hold > 0 ? { x: side.x + (grip.x - side.x) * hold, y: side.y + (grip.y - side.y) * hold } : null;
    ctx.save();
    ctx.translate(fx, fy); ctx.rotate(ang); ctx.translate(-fx, -fy);
    drawFigure(ctx, c, { x: fx, y: fy, height: H, build: 'adult', facing: f, pose: 'stand', hands: [hand, null] }, figureLook(c, { ...LOOKS.passenger }));
    ctx.restore();
    // World points on the tilted body: the chest, and the hand.
    const rot = (p) => ({ x: fx + (p.x - fx) * Math.cos(ang) - (p.y - fy) * Math.sin(ang), y: fy + (p.x - fx) * Math.sin(ang) + (p.y - fy) * Math.cos(ang) });
    return { bus, f, chest: rot({ x: fx + f * 0.08 * H, y: fy - 0.66 * H }), hand: hand ? rot(hand) : null, head: rot({ x: fx, y: fy - 0.9 * H }) };
  }

  busArrows(ctx, c, v, aDir, ka = 1) {
    drawMotionArrow(ctx, c, 'v', 120, ARROW_Y, { length: v * VPX, label: v > 0.05 ? 'v' : 'v = 0', side: 1 });
    if (aDir && ka > 0) {
      const x = aDir > 0 ? 420 : 560;
      drawMotionArrow(ctx, c, 'a', x, ARROW_Y, { length: 96, angle: aDir > 0 ? 0 : Math.PI, label: 'a', side: aDir > 0 ? 1 : -1, alpha: ka });
    }
  }

  // -- b0: the bus brakes; your body keeps moving --------------------------------------------------------------
  braking(ctx, c) {
    const t = Math.min(this.age, REST0), v = vBrake(t), vb = vBrake(t - LAG);
    const lean = LEAN * ease(t, T_B, 0.4);
    const R = this.rig(ctx, c, xBrake(t), lean, 0);
    this.busArrows(ctx, c, v, t >= T_B ? -1 : 0, ease(t, T_B, 0.25));
    const kb = ease(t, T_B + 0.15, 0.3);
    if (kb > 0) {
      // Labels inside the bus sit on chips: the light cabin wall stays light in the dark theme.
      const ar = drawMotionArrow(ctx, c, 'v', R.chest.x + 10, R.chest.y, { length: vb * VPX, label: '', side: 1, alpha: kb });
      drawTag(ctx, c, 'v', (R.chest.x + 10 + ar.x2) / 2 + 20, R.chest.y - 30, { size: 26, col: c.s1, alpha: kb });
      drawTag(ctx, c, 'body keeps moving', 400, 72, { size: 28, col: c.s1ink ?? c.s1, alpha: ease(t, T_B + 0.5, 0.4) });
    }
  }

  // -- b1: the bus starts; you tip back, then hold the handle ---------------------------------------------------
  starting(ctx, c) {
    const t = Math.min(this.age, REST1), u = Math.max(0, t - T_S), v = A * u, x = 0.5 * A * u * u;
    const hold = ease(t, T_H, 0.4);
    const lean = -LEAN * ease(t, T_S, 0.4) * (1 - ease(t, T_H + 0.4, 0.6));
    const R = this.rig(ctx, c, x, lean, hold);
    this.busArrows(ctx, c, v, t >= T_S ? 1 : 0, ease(t, T_S, 0.25));
    const kf = ease(t, T_H + 0.35, 0.3);
    if (kf > 0 && R.hand) {
      drawForce(ctx, c, R.hand.x + 6, R.hand.y, { length: 120, label: '', alpha: kf, fit: false });
      drawTag(ctx, c, 'pull of the handle', R.hand.x + 30, R.hand.y + 36, { size: 26, align: 'left', col: c.s3, alpha: kf });
    }
  }
}
