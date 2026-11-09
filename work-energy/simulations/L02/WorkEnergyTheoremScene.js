import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, pill, clamp01, mix, alpha, rr, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor, walkPhase } from 'simulations/base/kit/SimFigure.js';
import { drawEnergyBars, drawWorkCounter } from 'simulations/base/kit/SimEnergy.js';
import { displacementArrow, drawCrate } from 'simulations/base/kit/SimApparatus.js';
import { propRig, drawGround, drawCart } from 'simulations/base/kit/SimProps.js';

// WorkEnergyTheoremScene - blk-l02-s04 (replaces WorkEnergyLedgerScene, kept on disk).
// b0: a student pushes a cart with a steady 10 N over 2 m on a smooth floor. The
//     work counter W and the cart's K bar climb together, step for step, to 20 J.
// b1: the same push on the cart with a box on it, and the force now changes as it
//     pushes (the F arrow grows and shrinks): F(x) = 10 + 5 sin(pi x) N, whose work
//     over 2 m is still 20 J. One K bar for cart + box (the system), still equal to W
//     at every moment.

const GROUND = 420;
const SCALE = 140;                           // px per metre
const rig = propRig({ x0: 20, x1: 660, groundY: GROUND, scale: SCALE });
const START_M = 1.15, DIST_M = 2;
const PUSH_S = 2.4;
const CART_W = 150, CART_H = 50;
const FIG_H = 196;
const BAR = { x: 520, y: 30, h: 116 };

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

// Force and work along the push, x in metres from the start.
const force = (x, varying) => (varying ? 10 + 5 * Math.sin(Math.PI * x) : 10);
const work = (x, varying) => (varying ? 10 * x + (5 / Math.PI) * (1 - Math.cos(Math.PI * x)) : 10 * x);

export class WorkEnergyTheoremScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A student pushes a cart with a steady force of 10 N over 2 m on a smooth floor. A work counter and the cart\'s kinetic energy bar rise together, from 0 to 20 J. Next, a box rides on the cart and the push changes as it goes; one bar for the cart and box together, the system, still rises with the work to 20 J.';

  enter() { this.mt = 0; }

  get sysBeat() { return this.stage >= 1; }

  pointerDown() { this.mt = 0; this.animateFor(600); }

  update(d) { this.mt = Math.min(PUSH_S + 0.15, (this.mt ?? 0) + d); }

  busy() { return (this.mt ?? 0) < PUSH_S + 0.15; }

  // Distance pushed, metres: from rest under a push, x grows as t squared.
  get x() { const k = clamp01((this.mt ?? 0) / PUSH_S); return DIST_M * k * k; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND + 18);
    drawGround(ctx, c, rig, { kind: 'solid' });
    const varying = this.sysBeat;
    const x = this.x;
    const done = (this.mt ?? 0) >= PUSH_S;

    // start and end marks on the floor, and s under the path
    const xs = rig.x(START_M) - CART_W / 2, xe = rig.x(START_M + DIST_M) - CART_W / 2;
    this.mark(ctx, c, xs);
    this.mark(ctx, c, xe);
    displacementArrow(ctx, c, xs, GROUND + 44, xs + (xe - xs) * (x / DIST_M) + 0.01, GROUND + 44);
    pill(ctx, c, 's = 2 m', (xs + xe) / 2, GROUND + 76, { bg: c.s2, size: 26 });

    // the cart (and the box), then the student behind it
    const m = START_M + x;
    const cart = drawCart(ctx, c, rig, m, { w: CART_W, h: CART_H, tone: 6, wheelAngle: (x * SCALE) / 11 });
    this.wheels(ctx, c, cart, x);
    this.handle(ctx, c, cart);
    let top = cart.y0;
    if (varying) {
      const box = drawCrate(ctx, c, { x: cart.top.x + 8, y: cart.y0, w: 92, h: 74, kind: 'carton', held: true });
      top = box.y0 ?? cart.y0 - 74;
    }
    const gx = cart.x0 - 20, gy = GROUND - 112;   // the handle grip
    const figX = gx - 62;
    const phase = (walkPhase(x * SCALE, FIG_H, 'walk') + 0.1) % 1;
    const spec = figureFor(this, {
      role: 'student', x: figX, y: GROUND, height: FIG_H, facing: 1,
      pose: { name: 'walk', phase: done ? 0.1 : phase, lean: 14, crouch: 0.03 },
      hands: [{ x: gx + 2, y: gy }, { x: gx + 4, y: gy - 8 }],
    });
    drawFigure(ctx, c, spec, spec.look);

    // the system outline: cart and box together
    if (varying) {
      ctx.save();
      ctx.strokeStyle = alpha(c.s1, 0.9);
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 7]);
      const bx0 = cart.x0 - 10, by0 = top - 14, bw = CART_W + 20, bh = GROUND + 6 - by0;
      rr(ctx, bx0, by0, bw, bh, 14);
      ctx.stroke();
      ctx.restore();
      pill(ctx, c, 'system', cart.top.x, by0 - 24, { bg: c.s1, size: 26 });
    }

    // F on the cart, along the motion; its length follows the force
    const F = force(Math.min(x, DIST_M), varying);
    const fy = cart.y0 + CART_H / 2;
    const fx = cart.x0 + CART_W + 8;
    vectorArrow(ctx, c, fx, fy, { angle: 0, length: F * 6.4, col: c.accent, width: 6, head: 16 });
    pill(ctx, c, varying ? 'F' : 'F = 10 N', fx + (varying ? 32 : 56), fy - 38, { bg: c.accent, size: 26 });

    // W and K, side by side, the same number at every moment
    const Wj = work(Math.min(x, DIST_M), varying);
    const shown = done ? 20 : Math.round(Wj);
    drawWorkCounter(ctx, c, { x: BAR.x - 24, y: BAR.y + 74, text: `W = ${shown} J`, align: 'right', size: 26 });
    drawEnergyBars(ctx, c, {
      x: BAR.x, y: BAR.y, h: BAR.h, max: 20, barW: 62, showValues: true, units: 'J', size: 26, minSize: 26,
      bars: [{ id: 'K', label: varying ? 'K of system' : 'K of cart', tone: 1 }],
      values: { K: shown },
    });
  }

  // Own wheels over the kit cart's: a tyre, a rim and four spokes that turn (the kit
  // hub reads as a face at this size).
  wheels(ctx, c, cart, x) {
    const r = 11, wy = GROUND - r;
    for (const f of [0.24, 0.76]) {
      const wx = cart.x0 + CART_W * f;
      ctx.fillStyle = mix(c.label, c.bgDeep, 0.25);
      ctx.beginPath(); ctx.arc(wx, wy, r + 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = mix(c.bgSurface, c.label, 0.3);
      ctx.beginPath(); ctx.arc(wx, wy, r * 0.62, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = mix(c.label, c.bgDeep, 0.25);
      ctx.lineWidth = 2;
      const a0 = (x * SCALE) / r;
      for (let k = 0; k < 4; k++) {
        const a = a0 + (k * Math.PI) / 2;
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * r * 0.62, wy + Math.sin(a) * r * 0.62); ctx.stroke();
      }
    }
  }

  // A push handle at the back of the cart, at the student's hand height.
  handle(ctx, c, cart) {
    const metal = mix(c.bgSurface, c.label, 0.45);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = mix(metal, c.bgDeep, 0.3);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cart.x0 + 8, cart.y0 + 8); ctx.lineTo(cart.x0 - 20, GROUND - 112);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = mix(c.label, c.bgDeep, 0.2);
    ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(cart.x0 - 22, GROUND - 116); ctx.lineTo(cart.x0 - 18, GROUND - 106); ctx.stroke();
    ctx.restore();
  }

  mark(ctx, c, x) {
    ctx.save();
    ctx.strokeStyle = mix(c.label, c.bgSurface, 0.35);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, GROUND + 28); ctx.lineTo(x, GROUND + 58); ctx.stroke();
    ctx.restore();
  }
}
