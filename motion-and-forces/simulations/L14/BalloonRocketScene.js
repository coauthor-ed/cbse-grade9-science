/**
 * BalloonRocketScene - slide blk-l15-s4 "A balloon and a rocket" (3 beats; Figs 6.29, 6.30).
 *   b0 'balloon'  two walls with nails, a taut thread; a balloon taped to a straw on the thread, neck to the
 *                 left. Air jets out left and the balloon runs RIGHT, shrinking (air 1 -> 0.2 over the whole run).
 *                 It plays once and rests at 70 per cent of the run with a little air still coming out, with the
 *                 pair: "balloon pushes the air" (tail in the jet, left, below the jet) and "air pushes the
 *                 balloon" (tail on the balloon, right), equal.
 *   b1 'rocket'   a rocket upright on its launch pad, thrust on. One px scale: "gas pushes the rocket" up (left of
 *                 the body, tail on it), "weight" down (right of the body, tail on it, shorter), "rocket pushes the
 *                 gas" down in the plume (same length as the up push). Net force up: the rocket lifts off with
 *                 constant acceleration (rise ~ t squared) and rests a little above the pad; a "net force" arrow
 *                 (drawNet, the same scale) beside it.
 *   b2 'lander'   the Moon's surface (grey, craters), a dark sky in the card. The lander comes in moving right and
 *                 down, engine first: the plume points in the direction of motion. "gas pushes the lander" points
 *                 the other way (tail on the lander); the v arrow shrinks as it slows (constant deceleration along a
 *                 curved path that ends vertical). It settles on the surface, engine off, v gone; equal-time dots
 *                 along the path, closer and closer, keep the slowing visible at rest.
 * Frames depend on beat and age only (age is capped at each beat's end, so the rest frame is fixed).
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, rr, luma, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { drawRocket, drawBalloonOnThread } from 'simulations/base/kit/SimVehicles.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawForce, drawNet } from '../shared/ForceCast.js';
import { drawSurface } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const END = [2.6, 3.2, 3.6];
// b0 balloon
const THY = 150, TX0 = 44, TX1 = 636, A0 = 140, A1 = 580, BR = 72, RUN_T = 2.1, PAIR = 104;
// b1 rocket
const GY = 466, PAD_H = 22, RL = 236, RX = 372, LIFT = 92, T_ON = 0.3, T_LIFT = 0.9, D_LIFT = 1.7;
const UP = 100, WT = 60;                              // up push = push on the gas; weight shorter (same px scale)
// b2 lander
const MY = 446, LL = 150, P0 = { x: 70, y: 96 }, P1 = { x: 452, y: 112 }, P2 = { x: 452, y: MY - LL / 2 }, T_IN = 0.3, D_IN = 2.6;

export class BalloonRocketScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'Beat 1: a balloon is taped to a straw on a thread tied tight between two walls. Air rushes out of its neck to the left and the balloon runs to the right along the thread, getting smaller. Two equal arrows: the balloon pushes the air to the left, and the air pushes the balloon to the right. Beat 2: a rocket on its launch pad. The engine pushes gas down; the gas pushes the rocket up with an equal force. The upward push is larger than the weight, so the net force is upwards and the rocket lifts off. Beat 3: a lander moving towards the Moon fires its engine in the direction of motion. The gas pushes the lander backwards, its velocity gets smaller, and it settles gently on the surface.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = Math.max(0, Math.min(2, stage)); }
  busy() { return this.age < END[this.cur] + 0.2; }

  draw(ctx, c) {
    const a = Math.min(this.age, END[this.cur]);
    if (this.cur === 2) { this.lander(ctx, c, a); return; }
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.balloon(ctx, c, a); else this.rocket(ctx, c, a);
  }

  // -- b0: the balloon on a thread ---------------------------------------------------------------------------
  balloon(ctx, c, a) {
    const FL = 470;
    drawSurface(ctx, c, 'tiles', 0, 680, FL, { h: 50, seed: 4 });
    this.wall(ctx, c, 0, 30, FL); this.wall(ctx, c, 650, 680, FL);
    this.nail(ctx, c, 30, THY, 1); this.nail(ctx, c, 650, THY, -1);
    const u = 0.7 * ease(a, 0.3, RUN_T), air = 1 - 0.8 * (u / 1), at = A0 + (A1 - A0) * u;
    const bb = drawBalloonOnThread(ctx, c, { x0: TX0, x1: TX1, y: THY, at, r: BR, air, t: a, jet: a > 0.25, tone: 4 });
    const b = { ...bb.anchors, r: bb.anchors.r ?? BR }, k = ease(a, 0.4, 0.35);
    if (k <= 0) return;
    const ny = b.neck.y, upY = ny - 22, dnY = ny + 26;
    drawForce(ctx, c, b.neck.x + 14, upY, { length: PAIR, angle: 0, label: '', alpha: k, fit: false });
    drawForce(ctx, c, b.neck.x - 10, dnY, { length: PAIR, angle: Math.PI, label: '', alpha: k, fit: false });
    const ux = Math.min(470, b.neck.x + 14 + PAIR / 2), lx = Math.max(176, b.neck.x - 10 - PAIR / 2);
    drawTag(ctx, c, 'air pushes the balloon', ux, THY - 52, { size: 26, col: c.s1ink, alpha: k, prefer: [[0, 0]] });
    drawTag(ctx, c, 'balloon pushes the air', lx, dnY + 96, { size: 26, col: c.s2ink, alpha: k, prefer: [[0, 0]] });
    this.leader(ctx, c.s1ink, b.neck.x + 14 + PAIR * 0.5, upY - 6, ux, THY - 32, k);
    this.leader(ctx, c.s2ink, b.neck.x - 10 - PAIR * 0.5, dnY + 6, lx, dnY + 76, k);
  }

  wall(ctx, c, x0, x1, fl) {
    const col = mix(c.bgSurface, c.label, 0.14);
    ctx.save();
    ctx.fillStyle = col; ctx.fillRect(x0, 40, x1 - x0, fl - 40);
    ctx.fillStyle = darken(col, 0.12); ctx.fillRect(x0 < 340 ? x1 - 8 : x0, 40, 8, fl - 40);
    ctx.fillStyle = alpha(lighten(col, 0.5), 0.6); ctx.fillRect(x0 < 340 ? x0 : x1 - 5, 40, 5, fl - 40);
    ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 2.5; ctx.strokeRect(x0, 40, x1 - x0, fl - 40);
    ctx.restore();
  }

  nail(ctx, c, x, y, dir) {
    const metal = mix(c.bgSurface, c.label, 0.45);
    ctx.save(); ctx.lineCap = 'round';
    for (const [col, w] of [[darken(metal, 0.4), 7], [metal, 4]]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dir * 16, y); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(x + dir * 17, y, 3, 7, 0, 0, Math.PI * 2); ctx.fillStyle = metal; ctx.fill(); ctx.strokeStyle = darken(metal, 0.4); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  leader(ctx, col, x1, y1, x2, y2, k) {
    ctx.save(); ctx.globalAlpha = 0.7 * k; ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }

  // -- b1: the rocket lifts off ------------------------------------------------------------------------------
  rocket(ctx, c, a) {
    drawSurface(ctx, c, 'rough', 0, 680, GY, { h: 54, seed: 7 });
    this.pad(ctx, c);
    const thrust = ease(a, T_ON, 0.4), r = clamp01((a - T_LIFT) / D_LIFT), h = LIFT * r * r;     // constant net force: rise ~ t squared
    const cy = GY - PAD_H - RL / 2 - h;
    const rk = drawRocket(ctx, c, { x: RX, y: cy, length: RL, angle: -Math.PI / 2, thrust, t: a });
    const k = ease(a, T_ON + 0.2, 0.4);
    if (k <= 0) return;
    const R = 0.12 * RL, bodyX = RX - R - 14;
    drawForce(ctx, c, bodyX, cy + 40, { length: UP, angle: -Math.PI / 2, label: '', alpha: k, fit: false });
    drawTag(ctx, c, 'gas pushes the rocket', bodyX - 22, cy - 30, { size: 26, col: c.label, align: 'right', alpha: k, prefer: [[0, 0]] });
    drawForce(ctx, c, RX + R + 14, cy - 40, { length: WT, angle: Math.PI / 2, label: '', alpha: k, fit: false });
    drawTag(ctx, c, 'weight', RX + R + 32, cy - 8, { size: 26, col: c.label, align: 'left', alpha: k, prefer: [[0, 0]] });
    const nz = rk.anchors.nozzle;
    drawForce(ctx, c, nz.x, nz.y + 8, { length: UP, angle: Math.PI / 2, label: '', alpha: k, fit: false });
    drawTag(ctx, c, 'rocket pushes the gas', 672, nz.y + 66, { size: 26, col: c.label, align: 'right', alpha: k, prefer: [[0, 0]] });
    const nk = ease(a, T_LIFT, 0.4);
    if (nk > 0) {
      drawNet(ctx, c, RX + 150, cy - 80, [{ newtons: UP, dir: 1 }, { newtons: WT, dir: -1 }], { scale: 1, angle: -Math.PI / 2, label: 'net force', alpha: nk, fit: false });
    }
  }

  /** Launch pad: a concrete slab with a flame trench and two small towers' feet. */
  pad(ctx, c) {
    const con = mix(c.bgSurface, c.label, 0.22), x0 = RX - 120, w = 240;
    ctx.save();
    rr(ctx, x0, GY - PAD_H, w, PAD_H + 6, 5); ctx.fillStyle = con; ctx.fill();
    ctx.fillStyle = alpha(lighten(con, 0.45), 0.7); ctx.fillRect(x0 + 4, GY - PAD_H + 3, w - 8, 4);
    ctx.fillStyle = darken(con, 0.15); ctx.fillRect(x0 + 4, GY - 6, w - 8, 8);
    rr(ctx, x0, GY - PAD_H, w, PAD_H + 6, 5); ctx.strokeStyle = darken(con, 0.42); ctx.lineWidth = 2.5; ctx.stroke();
    rr(ctx, RX - 30, GY - PAD_H, 60, 9, 3); ctx.fillStyle = darken(con, 0.35); ctx.fill();          // flame trench
    ctx.restore();
  }

  // -- b2: the lander -----------------------------------------------------------------------------------------
  posAt(u) {
    const q = 1 - u;
    return { x: q * q * P0.x + 2 * q * u * P1.x + u * u * P2.x, y: q * q * P0.y + 2 * q * u * P1.y + u * u * P2.y,
      dx: 2 * q * (P1.x - P0.x) + 2 * u * (P2.x - P1.x), dy: 2 * q * (P1.y - P0.y) + 2 * u * (P2.y - P1.y) };
  }

  lander(ctx, c, a) {
    // Dark sky, inside the card only (tokens: the darker of label / bgDeep).
    const sky = luma(c.label) < luma(c.bgDeep) ? c.label : c.bgDeep, star = luma(c.label) < luma(c.bgDeep) ? c.bgSurface : c.label;
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, MY); g.addColorStop(0, darken(sky, 0.2)); g.addColorStop(1, mix(sky, c.s5, 0.18));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, 520);
    const rnd = mulberry32(31);
    for (let i = 0; i < 70; i++) { const x = rnd() * 680, y = rnd() * (MY - 30), s = 0.8 + rnd() * 1.6; ctx.fillStyle = alpha(star, 0.35 + 0.5 * rnd()); ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    this.moon(ctx, c);
    // Motion: constant deceleration along the path, u = 1 - (1 - tau)^2, speed falls to zero at touchdown.
    const tau = clamp01((a - T_IN) / D_IN), u = 1 - (1 - tau) ** 2, p = this.posAt(u);
    const sp = Math.hypot(p.dx, p.dy) * 2 * (1 - tau) / D_IN, dir = Math.atan2(p.dy, p.dx);
    // Equal-time dots along the path so far: the gaps shrink as it slows.
    ctx.save();
    for (let i = 0; i <= 10; i++) {
      const ti = i / 10; if (ti > tau + 1e-6) break;
      const pi = this.posAt(1 - (1 - ti) ** 2);
      ctx.beginPath(); ctx.arc(pi.x, pi.y, 5, 0, Math.PI * 2); ctx.fillStyle = alpha(lighten(c.s1, 0.3), 0.85); ctx.fill();
    }
    ctx.restore();
    const landed = tau >= 1, thrust = landed ? 0 : 0.35 + 0.65 * (1 - tau * 0.5);
    const ang = landed ? -Math.PI / 2 : dir + Math.PI;                   // engine (tail) first, nose behind
    const cx = p.x, cy = landed ? P2.y : p.y;
    drawRocket(ctx, c, { x: cx, y: cy, length: LL, angle: ang, thrust, t: a, tone: 2 });
    if (!landed) {
      const k = clamp01((a - T_IN) / 0.3) * clamp01((1 - tau) / 0.08);
      this.pushes(ctx, c, cx, cy, dir, sp, k, 0);
    } else {
      // At rest: one faint copy where it was slowing (dot 4), with the push and v it had there.
      const tg = 0.3, ug = 1 - (1 - tg) ** 2, g = this.posAt(ug), gd = Math.atan2(g.dy, g.dx), gs = Math.hypot(g.dx, g.dy) * 2 * (1 - tg) / D_IN;
      const k = ease(this.age, END[2] - 0.5, 0.4);
      ctx.save(); ctx.globalAlpha = 0.4 * k; drawRocket(ctx, c, { x: g.x, y: g.y, length: LL, angle: gd + Math.PI, thrust: 0.8, t: 1, tone: 2 }); ctx.restore();
      this.pushes(ctx, c, g.x, g.y, gd, gs, k, 1);
    }
    drawTag(ctx, c, 'near the south pole', 664, MY + 40, { size: 26, col: c.labelMuted, align: 'right', alpha: ease(a, END[2] - 0.5, 0.4), prefer: [[0, 0]] });
  }

  /** The push from the gas (backwards, F) and the velocity (forwards, v), either side of the lander's path. */
  pushes(ctx, c, x, y, dir, sp, k, ghost) {
    if (k <= 0) return;
    const nx = -Math.sin(dir), ny = Math.cos(dir), off = 40;
    const v = drawMotionArrow(ctx, c, 'v', x - nx * off, y - ny * off, { length: Math.max(0.01, sp * 0.55), angle: dir, label: '', alpha: k });
    drawTag(ctx, c, 'v', v.x2 + 18, v.y2 - 22, { size: 26, col: c.s1ink, alpha: k, prefer: [[0, 0]] });
    drawForce(ctx, c, x + nx * off, y + ny * off, { length: 96, angle: dir + Math.PI, label: '', alpha: k, fit: false });
    drawTag(ctx, c, 'gas pushes the lander', Math.max(170, x - 150), y + (ghost ? 84 : 100), { size: 26, col: c.label, alpha: k, prefer: [[0, 0]] });
  }

  /** The Moon's surface: grey regolith with rimmed craters, a light lip and a shaded front. */
  moon(ctx, c) {
    const grey = mix(c.bgSurface, c.label, 0.42);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(0, MY + 6);
    for (let x = 0; x <= 680; x += 40) ctx.lineTo(x, MY + 4 * Math.sin(x * 0.03) + 2 * Math.sin(x * 0.11));
    ctx.lineTo(680, 520); ctx.lineTo(0, 520); ctx.closePath();
    ctx.fillStyle = grey; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = darken(grey, 0.18); ctx.fillRect(0, MY + 40, 680, 80);
    ctx.fillStyle = alpha(lighten(grey, 0.4), 0.7); ctx.fillRect(0, MY - 4, 680, 8);
    for (const [x, y, rx] of [[90, MY + 30, 40], [250, MY + 56, 26], [600, MY + 26, 34], [360, MY + 30, 16], [520, MY + 60, 22]]) {
      ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.3, 0, 0, Math.PI * 2); ctx.fillStyle = darken(grey, 0.22); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y + rx * 0.06, rx * 0.86, rx * 0.22, 0, 0, Math.PI); ctx.strokeStyle = alpha(lighten(grey, 0.45), 0.8); ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = darken(grey, 0.4); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, MY + 6);
    for (let x = 0; x <= 680; x += 40) ctx.lineTo(x, MY + 4 * Math.sin(x * 0.03) + 2 * Math.sin(x * 0.11));
    ctx.stroke();
    ctx.restore();
  }
}
