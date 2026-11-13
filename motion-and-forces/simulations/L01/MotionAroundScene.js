/**
 * MotionAroundScene - slide "Motion in a straight line" (blk-l01-s1, 2 beats; Fig 4.1).
 * b0: four panels (Fig 4.1): a ball falling straight down past a building, a car on a
 *     straight highway, a swimmer in a pool lane, a train on a straight track. Each moves once along
 *     its own dashed straight path (arrowhead at the end), then rests at the end.
 * b1: one wide highway. A truck ahead and a car behind move at the same speed (the
 *     camera rides with the car, so the road streams past). The truck's brake lights
 *     come on and it slows; the car reacts 0.8 s later and brakes as hard. The gap
 *     shrinks by v x reaction time and both stop; a bracket "?" marks the gap. No numbers.
 * Kit gaps: no swim pose in SimFigure (the swimmer is the reach-up figure laid flat
 * under a water veil) and no train in SimVehicles (drawn here from rounded rects).
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, rr, darken, lighten, alpha, mix, inOutSine, drawShadow, ellipse } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { drawCar, drawTruck, drawLedge } from 'simulations/base/kit/SimVehicles.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { LOOKS } from '../shared/MotionCast.js';

const PAD = 16, PW = (680 - PAD * 3) / 2, PH = (520 - PAD * 3) / 2;
const RUN = 2.4, GO = 0.4, STAGGER = 0.18;
// b1 physics (m, s): both at V; the truck brakes at TB with A; the car brakes REACT later with A.
const V = 15, A = 7.5, TB = 0.4, REACT = 0.8, GAP0 = 26, K = 7.5;
const CAR_X = 150, CAR_L = 160, TRUCK_L = 240, ROAD_Y = 330, LANE_Y = 368;

function decel(t, t0) {                    // distance (m) after braking at t0 from V with A
  if (t <= t0) return V * t;
  const tb = Math.min(t - t0, V / A);
  return V * t0 + V * tb - 0.5 * A * tb * tb;
}

export class MotionAroundScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Four straight-line motions: a swimmer along a pool lane, a ball falling straight down, a car along a straight highway and a train along a straight track. Then a truck ahead of a car brakes suddenly; the car brakes too, and a bracket with a question mark marks the gap between them.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.age < (this.cur === 0 ? GO + RUN + STAGGER * 3 + 0.2 : GO + TB + REACT + V / A + 0.2); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.panels(ctx, c); else this.highway(ctx, c);
  }

  // ---- b0 ---------------------------------------------------------------------------------
  prog(i) { return inOutSine(clamp01((this.age - GO - i * STAGGER) / RUN)); }

  panels(ctx, c) {
    const rects = [[PAD, PAD], [PAD * 2 + PW, PAD], [PAD, PAD * 2 + PH], [PAD * 2 + PW, PAD * 2 + PH]].map(([x, y]) => ({ x, y, w: PW, h: PH }));
    const paint = [this.fall, this.road, this.pool, this.train];
    rects.forEach((r, i) => {
      ctx.save();
      ctx.save(); ctx.translate(0, 4); rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.fillStyle = alpha(darken(c.bgDeep, 0.4), 0.35); ctx.fill(); ctx.restore();
      rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.fillStyle = c.bgSurface; ctx.fill();
      ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.clip();
      paint[i].call(this, ctx, c, r, this.prog(i));
      ctx.restore();
      rr(ctx, r.x, r.y, r.w, r.h, 16); ctx.strokeStyle = darken(c.bgSurface, 0.35); ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    });
  }

  // A dashed straight path with an arrowhead at its end; the part already covered is solid.
  path(ctx, c, x0, y0, x1, y1, u) {
    const col = c.annot, ang = Math.atan2(y1 - y0, x1 - x0);
    ctx.save(); ctx.strokeStyle = alpha(col, 0.85); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = col; ctx.translate(x1, y1); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-12, -10); ctx.lineTo(-12, 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  pool(ctx, c, r, u) {
    ctx.fillStyle = mix(c.water, c.bgSurface, 0.55); ctx.fillRect(r.x, r.y, r.w, r.h);
    const spec = trackSpec({ from: 0, to: 25, x0: r.x + 24, x1: r.x + r.w - 24, y: r.y + r.h / 2 });
    drawTrack(ctx, c, spec, { kind: 'pool', ticks: false, depth: 150, scroll: u * 6 });
    const y = spec.y - 18, xa = r.x + 40, xb = r.x + r.w - 52;
    this.path(ctx, c, xa, y, xb + 34, y, u);
    const hx = xa + 100 + (xb - xa - 100) * u;            // head position
    // Wake behind the swimmer.
    ctx.fillStyle = alpha(lighten(c.water, 0.8), 0.7);
    for (let j = 1; j <= 4; j++) { ellipse(ctx, hx - 70 - j * 16, y + (j % 2 ? -8 : 8), 12 - j * 2, 4); ctx.fill(); }
    // The swimmer: the reach-up figure laid flat (head to the right), arms forward.
    const fx = hx - 112;
    ctx.save(); ctx.translate(fx, y); ctx.rotate(Math.PI / 2); ctx.translate(-fx, -y);
    drawFigure(ctx, c, { x: fx, y, height: 120, facing: 1, build: 'teen', pose: 'reach-up' }, figureLook(c, { ...LOOKS.canoeist, hairStyle: 'crop' }), { });
    ctx.restore();
    // Water veil over the body (head and hands stay clear).
    ctx.save(); ctx.globalAlpha = 0.42; ctx.fillStyle = mix(c.water, c.bgSurface, 0.3);
    rr(ctx, hx - 100, y - 18, 70, 36, 14); ctx.fill(); ctx.restore();
  }

  fall(ctx, c, r, u) {
    ctx.fillStyle = mix(c.setGround ?? c.bgSurface, c.good, 0.3); ctx.fillRect(r.x, r.y, r.w, r.h);
    const floorY = r.y + r.h - 34, R = 24, x = r.x + r.w / 2 + 40, ledgeY = r.y + 70, top = ledgeY - R;
    ctx.fillStyle = mix(c.setGround ?? c.bgSurface, c.label, 0.18); ctx.fillRect(r.x, floorY, r.w, r.h);
    ctx.fillStyle = alpha(lighten(c.bgSurface, 0.5), 0.7); ctx.fillRect(r.x, floorY, r.w, 3);
    ctx.strokeStyle = darken(c.bgSurface, 0.3); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x, floorY); ctx.lineTo(r.x + r.w, floorY); ctx.stroke();
    drawLedge(ctx, c, { x: x - R - 10, y: ledgeY, ground: floorY, w: 130, facing: 1, kind: 'building' });
    this.path(ctx, c, x, top, x, floorY - 14, u);
    const fallU = clamp01((this.age - GO - STAGGER) / RUN), yb = top + (floorY - R - top) * fallU * fallU;   // y grows as t squared
    drawShadow(ctx, c, x, floorY + 2, R * (0.6 + 0.5 * fallU));
    drawBall(ctx, c, { x, y: yb, r: R, tone: 2 });
  }

  road(ctx, c, r, u) {
    ctx.fillStyle = mix(c.setGround ?? c.bgSurface, c.good, 0.3); ctx.fillRect(r.x, r.y, r.w, r.h);
    const spec = trackSpec({ from: 0, to: 40, x0: r.x - 20, x1: r.x + r.w + 20, y: r.y + r.h / 2 + 10 });
    drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 120 });
    const gy = spec.y + 46, xa = r.x + 40, xb = r.x + r.w - 116, y = gy - 22;
    this.path(ctx, c, r.x + 20, y, r.x + r.w - 18, y, u);
    const cx = xa + (xb - xa) * u;
    drawCar(ctx, c, { x: cx, y: gy, length: 130, roll: (xb - xa) * u / 31, tone: 1 });
  }

  train(ctx, c, r, u) {
    ctx.fillStyle = mix(c.setGround ?? c.bgSurface, c.good, 0.25); ctx.fillRect(r.x, r.y, r.w, r.h);
    const gy = r.y + r.h - 62;
    // Ballast, sleepers and two rails.
    ctx.fillStyle = mix(c.label, c.bgSurface, 0.65); ctx.fillRect(r.x, gy + 6, r.w, 22);
    ctx.fillStyle = darken(mix(c.s8, c.bad, 0.3), 0.2);
    for (let x = r.x + 4; x < r.x + r.w; x += 16) ctx.fillRect(x, gy + 6, 8, 14);
    ctx.fillStyle = mix(c.label, c.bgSurface, 0.3); ctx.fillRect(r.x, gy + 2, r.w, 5);
    ctx.fillStyle = alpha(lighten(c.bgSurface, 0.6), 0.6); ctx.fillRect(r.x, gy + 2, r.w, 1.5);
    const front0 = r.x + 60, front1 = r.x + r.w - 46, front = front0 + (front1 - front0) * u, y = gy - 52;
    this.path(ctx, c, r.x + 16, y, r.x + r.w - 18, y, u);
    this.coach(ctx, c, front - 216, gy, 104, false, u);
    this.coach(ctx, c, front - 104, gy, 104, true, u);
  }

  // One rail car: body with a lit top and a shaded skirt, window row, roof, bogies.
  coach(ctx, c, x, gy, L, engine, u) {
    const h = 54, top = gy - 12 - h, body = engine ? c.s1 : c.s6;
    drawShadow(ctx, c, x + L / 2, gy + 4, L * 0.5);
    rr(ctx, x + 4, top - 6, L - 8, 12, 6); ctx.fillStyle = darken(body, 0.35); ctx.fill();           // roof
    ctx.beginPath();
    if (engine) { ctx.moveTo(x, top); ctx.lineTo(x + L - 22, top); ctx.quadraticCurveTo(x + L, top + 6, x + L, top + 30); ctx.lineTo(x + L, gy - 12); ctx.lineTo(x, gy - 12); ctx.closePath(); }
    else rr(ctx, x, top, L, h, 6);
    ctx.fillStyle = body; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = darken(body, 0.2); ctx.fillRect(x, top + h * 0.66, L, h);                       // shade side
    ctx.fillStyle = alpha(lighten(body, 0.5), 0.6); ctx.fillRect(x, top + 3, L, 3);                 // inner line
    ctx.fillStyle = c.gold; ctx.fillRect(x, top + h * 0.6, L, 4);                                     // stripe
    ctx.restore();
    ctx.strokeStyle = darken(body, 0.45); ctx.lineWidth = 2.5; ctx.stroke();                           // rim
    const win = mix(c.water, c.bgSurface, 0.35);
    const n = engine ? 1 : 4, ww = engine ? 24 : 18;
    for (let i = 0; i < n; i++) {
      const wx = engine ? x + L - 40 : x + 12 + i * ((L - 24 - ww) / (n - 1));
      rr(ctx, wx, top + 9, ww, 18, 4); ctx.fillStyle = win; ctx.fill(); ctx.strokeStyle = darken(body, 0.5); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = alpha(lighten(win, 0.7), 0.7); ctx.fillRect(wx + 3, top + 11, 4, 12);
    }
    if (engine) {                                                                                         // headlamp and grille
      ctx.beginPath(); ctx.arc(x + L - 7, top + 40, 5, 0, Math.PI * 2); ctx.fillStyle = c.gold; ctx.fill();
      ctx.strokeStyle = darken(c.gold, 0.4); ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i < 3; i++) { ctx.fillStyle = alpha(darken(body, 0.5), 0.6); ctx.fillRect(x + 14 + i * 14, top + 12, 8, 14); }
    }
    for (const bx of [x + 22, x + L - 22]) {                                                              // bogies
      rr(ctx, bx - 20, gy - 16, 40, 8, 3); ctx.fillStyle = darken(c.label, 0.1); ctx.fill();
      for (const wx of [bx - 11, bx + 11]) {
        ctx.beginPath(); ctx.arc(wx, gy - 4, 8, 0, Math.PI * 2); ctx.fillStyle = mix(c.label, c.bgDeep, 0.3); ctx.fill();
        ctx.strokeStyle = darken(c.label, 0.3); ctx.lineWidth = 2; ctx.stroke();
        const a = u * 22; ctx.strokeStyle = alpha(c.bgSurface, 0.7); ctx.beginPath(); ctx.moveTo(wx, gy - 4); ctx.lineTo(wx + Math.cos(a) * 6, gy - 4 + Math.sin(a) * 6); ctx.stroke();
      }
    }
    if (!engine) { ctx.fillStyle = darken(c.label, 0.1); ctx.fillRect(x + L - 2, gy - 26, 10, 6); }    // coupling
  }

  // ---- b1 ---------------------------------------------------------------------------------
  brakeLight(ctx, c, x, y, on) {
    ctx.save();
    if (on) { ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fillStyle = alpha(c.bad, 0.28); ctx.fill(); }
    rr(ctx, x - 5, y - 8, 10, 16, 3); ctx.fillStyle = on ? lighten(c.bad, 0.15) : darken(c.bad, 0.45); ctx.fill();
    ctx.strokeStyle = darken(c.bad, 0.6); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  highway(ctx, c) {
    const t = this.age - GO, xc = decel(Math.max(0, t), TB + REACT), xt = GAP0 + decel(Math.max(0, t), TB);
    const gap = xt - xc;                                     // nose-to-tail gap (m)
    const spec = trackSpec({ from: 0, to: 680 / K, x0: -20, x1: 700, y: ROAD_Y });
    ctx.fillStyle = mix(c.setGround ?? c.bgSurface, c.good, 0.3); ctx.fillRect(0, ROAD_Y - 100, 680, 300);
    drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 150, scroll: xc });
    const carNose = CAR_X + CAR_L / 2, truckRearX = carNose + gap * K;
    const tr = drawTruck(ctx, c, { x: truckRearX + TRUCK_L / 2, y: LANE_Y, length: TRUCK_L, roll: (xt * K) / (TRUCK_L / 7.5), tone: 3 });
    const car = drawCar(ctx, c, { x: CAR_X, y: LANE_Y, length: CAR_L, roll: (xc * K) / (CAR_L / 4.2), tone: 1 });
    this.brakeLight(ctx, c, tr.rear + 4, LANE_Y - 52, t > TB);
    this.brakeLight(ctx, c, car.rear + 4, LANE_Y - 38, t > TB + REACT);
    // The gap: a bracket with "?" above the two, with thin drops to the car's nose and the truck's tail.
    const k = clamp01((this.age - 0.2) / 0.5), by = tr.y0 - 40;
    ctx.save(); ctx.globalAlpha = k;
    ctx.strokeStyle = alpha(c.label, 0.5); ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    for (const [x, y] of [[carNose, car.y0 + 12], [truckRearX, tr.y0 + 12]]) { ctx.beginPath(); ctx.moveTo(x, by + 12); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.setLineDash([]);
    const px = trackSpec({ from: 0, to: 680, x0: 0, x1: 680, y: LANE_Y });
    drawStrobe(ctx, c, px, { at: [carNose, truckRearX], gaps: true, gapLabels: ['?'], bracketY: by, size: 48, tone: 'annot' });
    ctx.restore();
  }
}
