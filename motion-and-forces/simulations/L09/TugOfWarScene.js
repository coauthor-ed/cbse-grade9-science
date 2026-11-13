/**
 * TugOfWarScene - slide blk-l10-s2 "Balanced forces" (2 beats; Figs 6.3, 6.4a). MODE 'balanced'.
 *   b0 'many'  two panels. Left: you push a box on a tiled floor; the push arrow grows on the box,
 *              then the friction arrow at its bottom, equal and opposite; the box stays put.
 *              Right: a ball drops into a tank of water and bobs to rest; then the pull of the
 *              Earth (down) and the push of water (up), equal, both from the ball. Rest: both.
 *   b1 'tug'   two teams of three on a field, the rope with its ribbon over the chalk centre line.
 *              Both teams lean in; two equal pull arrows on the rope, opposite; the ribbon strains
 *              a few px and settles on the line; net force dot "net force = 0"; tag "balanced
 *              forces" (the hero). Rest: still.
 * NetForceScene (MODE 'net', slide blk-l09-n01) subclasses this file; its beats are drawn here:
 *   b0 'unbalanced' the right team pulls harder: its arrow grows; the net arrow (the difference)
 *              appears below the rope; rope and teams speed up to the right (x = a t^2 / 2), the
 *              left team skids, the ribbon passes the line. Rest: ribbon right of the line.
 *   b1 'same'  a stalled car, two people push from behind (two push arrows on the car); copies of
 *              the arrows slide down below the car and join head to tail: the net force (sum); the
 *              car starts to roll forward. Rest: car moved a little, arrows shown.
 * Every frame is a function of the beat and its age only. One px-per-unit arrow scale per beat.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, font } from 'simulations/base/kit/SimLook.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack } from 'simulations/base/kit/SimTrack.js';
import { drawSheet, drawTag } from '../shared/MotionGraph.js';
import { drawForce, drawNet, drawBoxOn, drawTank, drawField, drawPusher, drawTeam, drawRope } from '../shared/ForceCast.js';

const GROUND = 410, H = 116, GAP = 60, MID = 340, ROPE_Y = GROUND - 70, PULL = 92, STRIP = { x: 150, y: 444, w: 380, h: 68 }, NY = 492;
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));

export class TugOfWarScene extends SimScene {
  static MODE = 'balanced';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two pictures of more than one force on an object. You push a box on a tiled floor: a push arrow forward on the box and a friction arrow backward at its bottom. A ball floats in a tank of water: the pull of the Earth down and the push of water up, equal arrows from the ball. Then a tug of war: two teams of three pull a rope with equal arrows in opposite directions; the ribbon on the rope stays over the centre line on the ground; net force is zero; these are balanced forces.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < 4.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.constructor.MODE === 'net') { if (this.cur === 0) this.unbalanced(ctx, c); else this.car(ctx, c); }
    else if (this.cur === 0) this.many(ctx, c); else this.tug(ctx, c);
  }

  /** The strip's words, left-aligned beside the net arrow (dark ink on the paper strip). */
  netText(ctx, c, text, x, y, k = 1) {
    ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 800, 28, true); ctx.fillStyle = c.s3ink ?? darken(c.s3, 0.3);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1); ctx.restore();
  }

  // -- b0 balanced: push + friction; ball on water ------------------------------------------------
  many(ctx, c) {
    const a = this.age;
    drawSheet(ctx, c, { x: 14, y: 96, w: 298, h: 384 });
    drawSheet(ctx, c, { x: 324, y: 96, w: 342, h: 384 });
    // Left: you and the box.
    const fy = 418, step = ease(a, 0.1, 0.5);
    const box = drawBoxOn(ctx, c, { x: 226, y: fy, w: 118, h: 128, surface: 'tiles', x0: 28, x1: 298 });
    drawPusher(ctx, c, { at: { x: box.back.x + 2, y: box.top.y + 26 }, y: fy, height: 196, effort: 0.3 + 0.5 * step, facing: 1, x: box.back.x - 84 - 10 * (1 - step) });
    const kp = ease(a, 0.6, 0.5), kf = ease(a, 1.1, 0.5);
    if (kp > 0) drawForce(ctx, c, box.centre.x, box.top.y + 14, { length: PULL * kp, at: 0.7, label: 'push', alpha: kp, fit: false });
    if (kf > 0) drawForce(ctx, c, box.bottom.x, box.bottom.y + 2, { length: PULL * kf, angle: Math.PI, label: 'friction', side: 1, alpha: kf, fit: false });
    // Right: the ball drops in and bobs to rest (damped), then the two forces.
    const T = { x: 420, y: 446, w: 160, h: 220, level: 0.6 };
    const tank = drawTank(ctx, c, { ...T, part: 'back' });
    const td = a - 1.4, drop = clamp01(td / 0.45);
    let by = tank.surface;
    if (td < 0) by = 150; else if (drop < 1) by = 150 + (tank.surface - 150) * drop * drop;
    else by = tank.surface + 16 * Math.exp(-3.2 * (td - 0.45)) * Math.sin(9 * (td - 0.45));
    drawBall(ctx, c, { x: T.x, y: by, r: 38, tone: 6 });
    drawTank(ctx, c, { ...T, part: 'front' });
    const ka = ease(a, 2.7, 0.5), kb = ease(a, 3.1, 0.5);
    if (ka > 0) drawForce(ctx, c, T.x, by, { length: 110 * ka, angle: Math.PI / 2, label: 'pull of the Earth', alpha: ka });
    if (kb > 0) drawForce(ctx, c, T.x, by, { length: 110 * kb, angle: -Math.PI / 2, label: 'push of water', side: -1, alpha: kb });
  }

  // -- the tug-of-war rig, shared by 'tug' and 'unbalanced' -----------------------------------------
  rig(ctx, c, o) {
    const s = o.shift ?? 0, lx = MID - 104 + s, rx = MID + 104 + s, mark = MID + s + (o.wob ?? 0);
    drawField(ctx, c, { y: GROUND, h: 520 - GROUND });
    drawSheet(ctx, c, STRIP);
    drawRope(ctx, c, { x0: lx - 2 * GAP - 70, x1: rx + 2 * GAP + 70, y: ROPE_Y, markX: mark, lineX: MID + (o.lineDx ?? 0), groundY: GROUND, lineLen: 30 });
    drawTeam(ctx, c, { ropeX: lx, ropeY: ROPE_Y, y: GROUND, n: 3, facing: 1, effort: o.effL, height: H, gap: GAP, seed: 0, skid: o.skidL ?? 0 });
    drawTeam(ctx, c, { ropeX: rx, ropeY: ROPE_Y, y: GROUND, n: 3, facing: -1, effort: o.effR, height: H, gap: GAP, seed: 3 });
    return { mark };
  }

  tug(ctx, c) {
    const a = this.age, lean = ease(a, 0.1, 0.6), k = ease(a, 0.6, 0.5);
    const wob = a > 1.0 && a < 2.4 ? 3 * Math.exp(-2.5 * (a - 1.0)) * Math.sin(14 * (a - 1.0)) : 0;
    const { mark } = this.rig(ctx, c, { effL: 0.3 + 0.5 * lean, effR: 0.3 + 0.5 * lean, wob });
    if (k > 0) {
      drawForce(ctx, c, mark - 8, ROPE_Y, { length: PULL * k, angle: Math.PI, label: 'pull', alpha: k, fit: false });
      drawForce(ctx, c, mark + 8, ROPE_Y, { length: PULL * k, label: 'pull', alpha: k, fit: false });
    }
    const kn = ease(a, 2.0, 0.4), kt = ease(a, 2.5, 0.4);
    if (kn > 0) drawNet(ctx, c, MID - 90, NY - 2, [{ newtons: 1, dir: -1 }, { newtons: 1, dir: 1 }], { alpha: kn, side: 1, label: '' }), this.netText(ctx, c, 'net force = 0', MID - 66, NY - 2, kn);
    if (kt > 0) drawTag(ctx, c, 'balanced forces', MID, 150, { size: 34, col: darken(c.s3, 0.1), alpha: kt });
  }

  // -- b0 net: the right team pulls harder; everything speeds up to the right -------------------------
  unbalanced(ctx, c) {
    const a = this.age, grow = ease(a, 0.5, 0.6), net = ease(a, 1.3, 0.4);
    const t = clamp01((a - 1.6) / 1.8) * 1.8, shift = 0.5 * 34 * t * t;           // a = 34 px/s^2 for 1.8 s: 55 px
    const { mark } = this.rig(ctx, c, { shift: shift - 30, lineDx: -30, effL: 0.75, effR: 0.75 + 0.25 * grow, skidL: clamp01((a - 1.7) / 0.6) });
    const L = PULL, R = PULL + 46 * grow;
    drawForce(ctx, c, mark - 8, ROPE_Y, { length: L, angle: Math.PI, label: 'pull', fit: false });
    drawForce(ctx, c, mark + 8, ROPE_Y, { length: R, label: 'pull', fit: false });
    if (net > 0) {
      drawNet(ctx, c, STRIP.x + 30, NY, [{ newtons: L, dir: -1 }, { newtons: R, dir: 1 }], { scale: 1, label: '', alpha: net, fit: false });
      this.netText(ctx, c, 'net force', STRIP.x + 30 + (R - L) + 22, NY, net);
    }
  }

  // -- b1 net: two pushers on a stalled car; their arrows add head to tail ---------------------------
  car(ctx, c) {
    const a = this.age, P1 = 92, P2 = 64, Y = 404;
    const t = clamp01((a - 2.8) / 1.4) * 1.4, dx = 0.5 * 28 * t * t;              // starts to roll: about 27 px
    const spec = trackSpec({ from: 0, to: 100, x0: 0, x1: 680, y: Y });
    drawTrack(ctx, c, spec, { kind: 'road', ticks: false, scroll: 0 });
    drawSheet(ctx, c, STRIP);
    const cx = 420 + dx, L = 360, roll = dx / (L / 4.2);
    const car = drawCar(ctx, c, { x: cx, y: Y, length: L, tone: c.gold, roll });
    const rear = car.rear, top = car.y0 ?? car.box?.y0 ?? Y - 110, hh = car.h ?? car.box?.h ?? 110;
    const step = ease(a, 0.1, 0.5);
    drawPusher(ctx, c, { at: { x: rear + 4, y: top + hh * 0.42 }, y: Y - 4, height: 160, effort: 0.4 + 0.5 * step, x: rear - 84 - 12 * (1 - step), look: figureLook(c, { skin: 3, hairStyle: 'long', hair: 1, top: 2, bottom: 5 }) });
    drawPusher(ctx, c, { at: { x: rear + 2, y: top + hh * 0.5 }, y: Y + 6, height: 170, effort: 0.4 + 0.5 * step, x: rear - 66 - 12 * (1 - step) });
    const k1 = ease(a, 0.6, 0.4), k2 = ease(a, 1.0, 0.4), j = ease(a, 1.6, 0.8), kn = ease(a, 2.4, 0.4);
    const y1 = top + hh * 0.24, y2 = y1 + 64;
    if (k1 > 0) drawForce(ctx, c, rear + 16, y1, { length: P1 * k1, label: 'push', alpha: k1, fit: false });
    if (k2 > 0) drawForce(ctx, c, rear + 16, y2, { length: P2 * k2, label: 'push', alpha: k2, fit: false });
    const ny = NY, x0 = STRIP.x + 30;
    if (j > 0 && kn < 1) {
      ctx.save(); ctx.globalAlpha = 1 - kn;
      drawForce(ctx, c, rear + 16 + (x0 - rear - 16) * j, y1 + (ny - y1) * j, { length: P1, alpha: 0.75, fit: false });
      drawForce(ctx, c, rear + 16 + (x0 + P1 - rear - 16) * j, y2 + (ny - y2) * j, { length: P2, alpha: 0.75, fit: false });
      ctx.restore();
    }
    if (kn > 0) {
      drawNet(ctx, c, x0, ny, [{ newtons: P1, dir: 1 }, { newtons: P2, dir: 1 }], { scale: 1, label: '', alpha: kn, fit: false });
      this.netText(ctx, c, 'net force', x0 + P1 + P2 + 22, ny, kn);
      ctx.save(); ctx.globalAlpha = 0.6 * kn; ctx.strokeStyle = alpha(c.label, 0.7); ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
      const xj = x0 + P1;
      ctx.beginPath(); ctx.moveTo(xj, ny - 14); ctx.lineTo(xj, ny + 14); ctx.stroke(); ctx.restore();
    }
  }
}
