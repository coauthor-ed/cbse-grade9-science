import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  drawBackdrop, drawShadow, pill, clamp01, mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { bicycleRig, drawBicycle } from 'simulations/base/kit/SimProps.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';

// CyclistEnergyScene - blk-l02-n04, Pedalling a Bicycle (2 beats).
// b0: a student rides off from rest on a flat road. The muscles give energy at
//     one steady rate P; part goes into the bicycle's motion (K grows with v
//     squared) and the rest into heat and sound (shimmer off the body, the tyres
//     and the chain; small sound arcs at the chain).
// b1: steady speed. v stops growing, so K holds level (a dashed hold line);
//     the same P now all goes to heat and sound, so that bar rises faster.
// The numbers are a made-up model, so no values are shown, only the bars.

const TAU = Math.PI * 2;
const GROUND = 446;              // where the tyres touch the road
const ROAD_TOP = 414, ROAD_BOT = 488;
const BIKE_X = 214, RIDER_H = 236;
const RAMP_S = 2.6;              // b0: from rest to the steady speed
const STEADY_S = 3.0;            // b1: riding on at that speed
const VMAX = 190;                // road px per second at the steady speed
const P = 2;                     // muscle energy per second (model units)
const KMAX = P * RAMP_S / 2;     // 2.6: K at the steady speed
const HEAT0 = P * RAMP_S - KMAX; // 2.6: heat and sound when b0 ends
const BAR_MAX = 9;
const BARS_X = 452, BARS_Y = 52, BARS_H = 288;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class CyclistEnergyScene extends SimScene {
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A student pedals a bicycle along a flat road. Two energy bars: K for the bicycle motion, and heat and sound. First the bicycle speeds up from rest: the K bar grows and the heat and sound bar grows too, with heat shimmering off the body, the tyres and the chain. Then at a steady speed the K bar stops growing while the heat and sound bar keeps rising.';

  enter() {
    this.motionT = 0;
  }

  get steady() { return this.stage >= 1; }
  get motionEnd() { return (this.steady ? STEADY_S : RAMP_S) + 0.1; }

  pointerDown() {
    this.motionT = 0;   // tap: ride the beat again
    this.animateFor(800);
  }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  // The whole state from the beat and the beat's own clock: never from history.
  model() {
    const t = this.motionT ?? 0;
    if (!this.steady) {
      const u = Math.min(t, RAMP_S);
      const k = u / RAMP_S;
      const K = KMAX * k * k;
      return { v: k, K, heat: P * u - K, dist: VMAX * u * u / (2 * RAMP_S), heatRate: P - 2 * KMAX * u / (RAMP_S * RAMP_S) };
    }
    const u = Math.min(t, STEADY_S);
    return { v: 1, K: KMAX, heat: HEAT0 + P * u, dist: VMAX * RAMP_S / 2 + VMAX * u, heatRate: P };
  }

  draw(ctx, c) {
    const m = this.model();
    drawBackdrop(ctx, c);
    this.scenery(ctx, c, m.dist);
    this.road(ctx, c, m.dist);
    this.speedLines(ctx, c, m);
    const bike = bicycleRig({ x: BIKE_X, y: GROUND, forHeight: RIDER_H, facing: 1, dist: m.dist, tone: 1, build: 'teen' });
    const base = figureFor(this, { role: 'student', pose: 'cycle', x: BIKE_X, y: GROUND, height: RIDER_H, facing: 1 });
    const spec = { ...base, ...bike.rider, pose: 'cycle', build: base.build ?? bike.rider.build };
    drawShadow(ctx, c, BIKE_X, GROUND + 4, bike.box.w * 0.55, 8, 0.9);
    const sk = drawFigure(ctx, c, spec, base.look, {
      behind: () => drawBicycle(ctx, c, bike, { part: 'back' }),
      between: () => drawBicycle(ctx, c, bike, { part: 'front' }),
    });
    this.heat(ctx, c, m, bike, sk);
    this.bars(ctx, c, m);
    if (this.steady) pill(ctx, c, 'steady speed', BIKE_X, 70, { bg: c.s1, size: 24 });
  }

  // Far hedge and trees (slow) and kerb posts (road speed): the scroll is the speed.
  scenery(ctx, c, dist) {
    const far = mix(c.good, c.bgSurface, 0.5);
    const trunk = mix(c.stroke, c.bgSurface, 0.3);
    ctx.save();
    // a low hill line behind
    ctx.fillStyle = mix(c.good, c.bgSurface, 0.72);
    ctx.beginPath();
    ctx.moveTo(0, ROAD_TOP);
    for (let x = 0; x <= 680; x += 20) {
      const xx = x + dist * 0.12;
      ctx.lineTo(x, ROAD_TOP - 60 - 18 * Math.sin(xx / 110) - 10 * Math.sin(xx / 47));
    }
    ctx.lineTo(680, ROAD_TOP);
    ctx.closePath();
    ctx.fill();
    // trees on a middle scroll
    const step = 118, off = ((-(dist * 0.45)) % step + step) % step;
    for (let x = -step; x < 680 + step; x += step) {
      const bx = x + off, n = Math.floor((x - off + dist * 0.45) / step);
      const s = 0.8 + 0.25 * ((n * 7919) % 3) / 2;
      ctx.fillStyle = trunk;
      rr(ctx, bx - 4, ROAD_TOP - 46 * s, 8, 46 * s, 3);
      ctx.fill();
      for (const [dx, dy, r, k] of [[-14, -56, 22, 0.1], [14, -58, 20, 0.0], [0, -76, 24, -0.08]]) {
        const col = k > 0 ? darken(far, 0.12) : k < 0 ? lighten(far, 0.12) : far;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(bx + dx * s, ROAD_TOP + dy * s, r * s, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = alpha(lighten(far, 0.35), 0.7);
      ctx.beginPath();
      ctx.arc(bx - 6 * s, ROAD_TOP - 84 * s, 8 * s, 0, TAU);
      ctx.fill();
    }
    // the verge
    ctx.fillStyle = mix(c.good, c.bgSurface, 0.6);
    ctx.fillRect(0, ROAD_TOP - 8, 680, 10);
    ctx.restore();
  }

  road(ctx, c, dist) {
    const tar = mix(c.bgSurface, c.label, 0.2);
    ctx.save();
    ctx.fillStyle = tar;
    ctx.fillRect(0, ROAD_TOP, 680, ROAD_BOT - ROAD_TOP);
    // light far edge, shade near edge, a kerb face below
    ctx.fillStyle = lighten(tar, 0.18);
    ctx.fillRect(0, ROAD_TOP, 680, 5);
    ctx.fillStyle = darken(tar, 0.12);
    ctx.fillRect(0, ROAD_BOT - 16, 680, 16);
    ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.2);
    ctx.fillRect(0, ROAD_BOT, 680, 520 - ROAD_BOT);
    ctx.fillStyle = darken(mix(c.stroke, c.bgSurface, 0.2), 0.2);
    ctx.fillRect(0, ROAD_BOT, 680, 4);
    // grit flecks and lane dashes on the road's own scroll
    const g = ((-dist) % 60 + 60) % 60;
    ctx.fillStyle = alpha(darken(tar, 0.3), 0.6);
    for (let x = -60; x < 740; x += 60) {
      ctx.fillRect(x + g, ROAD_TOP + 14, 3, 2);
      ctx.fillRect(x + g + 31, ROAD_TOP + 52, 4, 2);
    }
    const D = 92, o = ((-dist) % D + D) % D;
    ctx.fillStyle = alpha(lighten(c.label, 0.2), 0.75);
    for (let x = -D; x < 680 + D; x += D) {
      rr(ctx, x + o, ROAD_BOT - 28, 44, 6, 3);
      ctx.fill();
    }
    // kerb posts at road speed
    const PS = 210, po = ((-dist) % PS + PS) % PS;
    for (let x = -PS; x < 680 + PS; x += PS) {
      const px = x + po;
      ctx.fillStyle = mix(c.label, c.bgSurface, 0.15);
      rr(ctx, px, ROAD_TOP - 40, 9, 40, 3);
      ctx.fill();
      ctx.fillStyle = c.bad;
      ctx.fillRect(px, ROAD_TOP - 34, 9, 7);
      ctx.fillStyle = darken(mix(c.label, c.bgSurface, 0.15), 0.25);
      ctx.fillRect(px + 6, ROAD_TOP - 40, 3, 40);
    }
    ctx.restore();
  }

  speedLines(ctx, c, m) {
    if (m.v < 0.15) return;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.28 * m.v);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const len = 40 + 50 * m.v;
    for (const [y, dx] of [[250, 0], [300, 22], [350, 6], [395, 30]]) {
      const x0 = BIKE_X - 150 - dx;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 - len, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Heat shimmer off the body, the tyres and the chain; sound arcs at the chain.
  // Its strength follows how fast heat and sound are being made right now.
  heat(ctx, c, m, bike, sk) {
    const rate = clamp01(m.heatRate / P);
    const run = clamp01((this.motionT ?? 0) / 0.4);
    const k = run * (0.35 + 0.65 * rate);
    if (k <= 0.02) return;
    const t = this.motionT ?? 0;
    const col = c.s8;
    const back = sk?.anchors?.shoulder ?? { x: bike.hip.x, y: bike.hip.y - 60 };
    const spots = [
      { x: back.x - 30, y: back.y + 58, h: 40 },
      { x: bike.wheels[0].x, y: GROUND - 4, h: 26 },
      { x: bike.wheels[1].x, y: GROUND - 4, h: 26 },
      { x: bike.bb.x + 4, y: bike.bb.y - 6, h: 26 },
    ];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 3.5;
    for (const [i, s] of spots.entries()) {
      for (let j = 0; j < 2; j++) {
        const ph = (t * 0.9 + i * 0.37 + j * 0.5) % 1;
        const x0 = s.x + (j ? 9 : -9);
        ctx.strokeStyle = alpha(col, k * (1 - ph) * 0.9);
        ctx.beginPath();
        for (let q = 0; q <= 10; q++) {
          const yy = s.y - ph * 18 - q * (s.h / 10);
          const xx = x0 + Math.sin(q * 0.9 + t * 6 + i) * 4;
          if (q === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }
    }
    // sound: two small arcs out from the chain, pulsing
    const sx = bike.bb.x - 34, sy = bike.bb.y + 20;
    for (let j = 0; j < 2; j++) {
      const ph = (t * 1.4 + j * 0.5) % 1;
      ctx.strokeStyle = alpha(darken(col, 0.15), k * (1 - ph) * 0.9);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, 10 + ph * 16, Math.PI * 0.7, Math.PI * 1.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  bars(ctx, c, m) {
    const box = drawEnergyBars(ctx, c, {
      x: BARS_X, y: BARS_Y, h: BARS_H, max: BAR_MAX, size: 24, minSize: 24, barW: 58, gap: 34,
      bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'heat', label: 'heat and sound', tone: 8 }],
      values: { K: m.K, heat: m.heat },
    });
    if (!this.steady || !box?.bars?.length) return;
    // K holds: a dashed level line at its top, carried across the heat bar
    const kb = box.bars.find((b) => b.id === 'K'), hb = box.bars.find((b) => b.id === 'heat');
    if (!kb || !hb) return;
    const y = kb.top.y;
    ctx.save();
    ctx.strokeStyle = alpha(c.s1, 0.95);
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(kb.x - 6, y);
    ctx.lineTo(hb.x + hb.w + 6, y);
    ctx.stroke();
    ctx.restore();
    // the rise of the heat bar since steady speed began, as a bracket
    const ht = hb.top.y;
    if (y - ht > 30) {
      const bx = hb.x + hb.w + 14;
      ctx.save();
      ctx.strokeStyle = c.s8;
      ctx.fillStyle = c.s8;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx, y);
      ctx.lineTo(bx, ht + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx, ht);
      ctx.lineTo(bx - 7, ht + 13);
      ctx.lineTo(bx + 7, ht + 13);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
