/**
 * SafeDistanceScene - slide blk-l07-n01 "Keep a safe distance" (2 beats; Bridging Science and
 * Society, Fig 4.20).
 *   b0  two lanes, 54 km/h (15 m/s) and 108 km/h (30 m/s), one metre scale for both (3.7 px per m,
 *       nose = position). Each stop is laid on the road as two bands: a reaction band (the car
 *       still at full speed for a fixed reaction time, TR = 0.75 s, never shown) and a braking
 *       band (a = -4 m/s2: 28.1 m and 112.5 m). Real seconds run 0.4 x on screen, both lanes on one
 *       clock. Then a wet-road sheen spreads on lane 1 and its braking band stretches (a = -2.5
 *       m/s2, 45 m, unlabelled); car 1 rolls on to the new end.
 *   b1  the truck-ahead picture of the L01 opener (its truck, car and brake lights): the camera
 *       rides with your car; the speedometer rises 54 -> 108 km/h and the safe gap bracket grows
 *       with it, gap = 1.2 x (u TR + u2 / 8), on 1.5 px per m. Then the truck's brake lights come
 *       on and a V2V signal (two short arcs) travels once from the truck to the car; the car's
 *       brake lights follow. No numbers on the gap.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, outBack, rr, darken, lighten, alpha, mix, ellipse } from 'simulations/base/kit/SimLook.js';
import { drawCar, drawTruck } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawSpeedometer, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { drawTag } from '../shared/MotionGraph.js';
import { MotionAroundScene } from '../L01/MotionAroundScene.js';

const TR = 0.75, A = 4, A_WET = 2.5, SQ = 0.4, LEAD = 0.4;
const K = 3.7, NX = 150, CAR = 140, CAR_M = 4.2;
const LANES = [{ u: 15, kmh: 54, g: 196, tone: 1 }, { u: 30, kmh: 108, g: 380, tone: 5 }];
const RUN_END = LEAD + (TR + 30 / A) * SQ;                       // car 2 stops last
const WET0 = RUN_END + 0.4, WET_SPREAD = 0.6, STRETCH0 = WET0 + 0.5, STRETCH = 0.8;
// b1
const B_GO = 0.4, B_RISE = 2.6, B_BRAKE = B_GO + B_RISE + 0.4, PULSE = 0.7;
const KB = 1.49, MARGIN = 1.2, CAR_X = 110, CAR_L = 160, TRUCK_L = 240, ROAD_Y = 362, LANE_Y = 400;
const gapM = (u) => MARGIN * (u * TR + (u * u) / (2 * A));
const fmt1 = (m) => (Math.round(m * 10) / 10).toFixed(1);

/** Metres past the start after t real seconds: reaction at full speed, then braking at a. */
function stopX(u, a, t) {
  if (t <= TR) return u * t;
  const tb = Math.min(t - TR, u / a);
  return u * TR + u * tb - 0.5 * a * tb * tb;
}

export class SafeDistanceScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two cars stop, one from 54 and one from 108 kilometres per hour. Each stopping distance is a reaction band, where the car still moves at full speed, then a braking band: 28.1 metres and 112.5 metres. On a wet road the braking band of the slower car grows longer. Then a car follows a truck: as its speed rises from 54 to 108 kilometres per hour, the safe gap between them grows. When the truck brakes, a vehicle-to-vehicle signal warns the car.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  get key() { return Math.max(0, Math.min(1, this.cur | 0)); }
  busy() { return this.age < (this.key === 0 ? STRETCH0 + STRETCH + 0.4 : B_BRAKE + PULSE + 1.0); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.key === 0) this.stops(ctx, c); else this.follow(ctx, c);
  }

  // ---- b0 ---------------------------------------------------------------------------------
  stops(ctx, c) {
    const tR = Math.max(0, (this.age - LEAD) / SQ);
    const wet = clamp01((this.age - WET0) / WET_SPREAD), str = inOutSine(clamp01((this.age - STRETCH0) / STRETCH));
    const toneA = c.s7, toneB = c.s2;
    LANES.forEach((L, i) => {
      drawTrack(ctx, c, trackSpec({ from: 0, to: 680 / K, x0: 16, x1: 664, y: L.g + 10 }), { kind: 'road', ticks: false, depth: 56 });
      if (i === 0 && wet > 0) this.sheen(ctx, c, L.g, wet);
      const reactM = L.u * TR, dryM = L.u * L.u / (2 * A), wetM = L.u * L.u / (2 * A_WET);
      const brakeM = i === 0 ? dryM + (wetM - dryM) * str : dryM;
      let x = stopX(L.u, A, tR);
      if (i === 0 && str > 0) x = reactM + brakeM;
      const by = L.g + 8, bh = 22;
      this.band(ctx, c, NX, NX + Math.min(x, reactM) * K, by, bh, toneA);
      if (x > reactM) this.band(ctx, c, NX + reactM * K, NX + x * K, by, bh, toneB);
      const nose = NX + x * K;
      drawCar(ctx, c, { x: nose - CAR / 2, y: L.g, length: CAR, roll: (x * K) / (CAR / CAR_M), tone: L.tone });
      drawTag(ctx, c, L.kmh + ' km/h', 18, L.g - 92, { align: 'left', col: c['s' + L.tone] });
      // Tags under the road once this car has stopped.
      const stopped = this.age > LEAD + (TR + L.u / A) * SQ + 0.1;
      if (!stopped) return;
      const ty = L.g + 70, mid = (a, b) => NX + ((a + b) / 2) * K;
      if (i === 1) {
        drawTag(ctx, c, 'reaction', mid(0, reactM), ty, { col: darken(toneA, 0.2) });
        drawTag(ctx, c, 'braking ' + fmt1(dryM) + ' m', mid(reactM, x) + 20, ty, { col: darken(toneB, 0.2) });
      } else if (str <= 0) {
        drawTag(ctx, c, fmt1(dryM) + ' m', mid(reactM, x), ty, { col: darken(toneB, 0.2), alpha: 1 - wet });
      }
      if (i === 0 && str > 0) this.dryMark(ctx, c, NX + (reactM + dryM) * K, L.g, ty, str);
      if (i === 0 && wet > 0) drawTag(ctx, c, 'wet road', 520, ty, { col: c.water ?? c.s1, alpha: wet });
    });
  }

  /** Where the dry stop ended: a dashed mark across the lane and a small "dry" tag under it. */
  dryMark(ctx, c, x, g, ty, k) {
    ctx.save(); ctx.globalAlpha = k;
    ctx.strokeStyle = c.label; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(x, g + 4); ctx.lineTo(x, g + 44); ctx.stroke();
    ctx.restore();
    drawTag(ctx, c, 'dry', x, ty, { alpha: k });
  }

  /** A band painted on the near half of a lane: light top line, shade foot, darker rim. */
  band(ctx, c, x0, x1, y, h, col) {
    if (x1 - x0 < 1) return;
    ctx.save();
    rr(ctx, x0, y, x1 - x0, h, 5); ctx.fillStyle = alpha(col, 0.92); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = darken(col, 0.2); ctx.fillRect(x0, y + h * 0.62, x1 - x0, h);
    ctx.fillStyle = alpha(lighten(col, 0.55), 0.8); ctx.fillRect(x0 + 3, y + 2, x1 - x0 - 6, 3);
    ctx.restore();
    rr(ctx, x0, y, x1 - x0, h, 5); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  /** The wet-road sheen: a water film with light streaks, spreading left to right over lane 1. */
  sheen(ctx, c, g, k) {
    const x0 = 6, top = g - 18, h = 56, w = (674 - x0) * inOutSine(k), water = c.water ?? c.s1;
    ctx.save();
    rr(ctx, x0, top, w, h, 6); ctx.clip();
    ctx.fillStyle = alpha(mix(water, c.bgSurface, 0.2), 0.42); ctx.fillRect(x0, top, w, h);
    ctx.fillStyle = alpha(lighten(water, 0.75), 0.75);
    for (let j = 0; j < 18; j++) { ellipse(ctx, x0 + 20 + j * 37 + (j % 3) * 7, top + 10 + ((j * 7) % 4) * 11, 13 - (j % 3) * 3, 2.2); ctx.fill(); }
    ctx.restore();
  }

  // ---- b1 ---------------------------------------------------------------------------------
  follow(ctx, c) {
    const u = inOutSine(clamp01((this.age - B_GO) / B_RISE)), kmh = 54 + 54 * u, v = kmh / 3.6;
    // Distance travelled (m, on the scene's own compressed clock): the integral of v, for the dashes and wheels.
    let s = 0;
    const tEnd = Math.min(this.age, B_BRAKE), n = 48;
    for (let j = 0; j < n; j++) s += (54 + 54 * inOutSine(clamp01(((j + 0.5) * tEnd / n - B_GO) / B_RISE))) / 3.6 * (tEnd / n) * 1.4;
    const gap = gapM(v);
    ctx.fillStyle = mix(c.setGround ?? c.bgSurface, c.good, 0.3); ctx.fillRect(0, ROAD_Y - 100, 680, 300);
    drawTrack(ctx, c, trackSpec({ from: 0, to: 680 / 7.5, x0: -20, x1: 700, y: ROAD_Y }), { kind: 'road', ticks: false, depth: 150, scroll: s });
    const carNose = CAR_X + CAR_L / 2, truckRear = carNose + gap * KB;
    const tr = drawTruck(ctx, c, { x: truckRear + TRUCK_L / 2, y: LANE_Y, length: TRUCK_L, roll: s * 2, tone: 3 });
    const car = drawCar(ctx, c, { x: CAR_X, y: LANE_Y, length: CAR_L, roll: s * 2, tone: 1 });
    const brake = this.age > B_BRAKE, pulse = clamp01((this.age - B_BRAKE) / PULSE);
    const light = MotionAroundScene.prototype.brakeLight;
    light.call(this, ctx, c, tr.rear + 4, LANE_Y - 52, brake);
    light.call(this, ctx, c, car.rear + 4, LANE_Y - 38, pulse >= 1);
    // The safe gap: a bracket above the two with thin drops to the car's nose and the truck's tail.
    const by = tr.y0 - 36;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.5); ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    for (const [x, y] of [[carNose, car.y0 + 12], [truckRear, tr.y0 + 12]]) { ctx.beginPath(); ctx.moveTo(x, by + 12); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.setLineDash([]);
    drawStrobe(ctx, c, trackSpec({ from: 0, to: 680, x0: 0, x1: 680, y: LANE_Y }), { at: [carNose, truckRear], gaps: true, gapLabels: ['safe gap'], bracketY: by, size: 26, tone: 'annot' });
    ctx.restore();
    if (brake) this.v2v(ctx, c, { x: tr.rear - 6, y: tr.y0 + 18 }, { x: car.front - 30, y: car.y0 + 4 }, pulse);
    drawSpeedometer(ctx, c, { x: 112, y: 116, r: 96, max: 120, major: 40, minor: 10, value: kmh, unit: '', size: 26 });
    drawTag(ctx, c, Math.round(kmh) + ' km/h', 222, 116, { align: 'left', col: c.s1 });
  }

  /** V2V: two short arcs leave the truck, travel to the car once, and rest soft at both ends. */
  v2v(ctx, c, from, to, k) {
    const col = c.s1, arcs = (x, y, dir, a) => {
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineCap = 'round';
      [14, 26].forEach((r, j) => {
        ctx.lineWidth = 5 - j;
        ctx.beginPath(); ctx.arc(x, y, r, dir - 0.6, dir + 0.6); ctx.stroke();
      });
      ctx.restore();
    };
    const e = inOutSine(k), x = from.x + (to.x - from.x) * e, y = from.y + (to.y - from.y) * e - Math.sin(Math.PI * e) * 46;
    arcs(from.x, from.y, Math.PI, 0.55 + 0.45 * (1 - k));                 // emitted at the truck (opening toward the car)
    if (k < 1) arcs(x, y, Math.PI, 1);                                       // the travelling pulse
    if (k > 0.85) arcs(to.x, to.y, 0, 0.55 + 0.45 * outBack(clamp01((k - 0.85) / 0.15)));
    if (k > 0.3) drawTag(ctx, c, 'V2V', (from.x + to.x) / 2, from.y + 4, { col, alpha: clamp01((k - 0.3) * 3) });
  }
}
