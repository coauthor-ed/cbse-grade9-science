/**
 * StoppingScene - predict blk-l07-s2 (setup) and slide blk-l07-s3 (2 beats; Example 4.8).
 * Two lanes of one highway, a shared brake line (0 m) and one metre scale under both lanes
 * (4 px per m). The car's position marker is its nose; a dashed drop joins the nose to the scale.
 * Braking: x(t) = u t - 2 t2 (a = -4 m/s2) until v = 0. Real seconds run 0.4267 x on screen, so
 * car 1 (15 m/s, 3.75 s) brakes in 1.6 s and car 2 (30 m/s, 7.5 s) in 3.2 s: the same clock.
 *   setup  both cars drive in to the brake line, car 2 covering twice the ground in the same time;
 *          gauges read 54 and 108 km/h. No braking, no scale, no strips.
 *   b0     car 1 brakes from the line and stops with its nose at 28.1 m; its needle falls to 0 in
 *          step; a strip grows under it to "28.1 m". Car 2 waits dimmed at the line.
 *   b1     car 2 brakes and stops at 112.5 m with its strip; then four copies of car 1's strip drop
 *          into lane 2 end to end and fill it ("x 4"); "112.5 m" is the hero.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, outBack, rr, darken, lighten, alpha } from 'simulations/base/kit/SimLook.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawSpeedometer, drawScale } from 'simulations/base/kit/SimTrack.js';
import { drawTag, DIM } from '../shared/MotionGraph.js';

const SETUP = 9;
const BL = 150, K = 4, CAR = 140, CAR_M = 4.2;      // brake line px, px per metre, car length px
const G = [286, 404];                               // lane ground y (wheels)
const SCALE_Y = 468;
const A = 4, SQUEEZE = 0.4267, LEAD = 0.4;          // braking m/s2; screen s per real s
const CARS = [{ u: 15, kmh: 54, tone: 1 }, { u: 30, kmh: 108, tone: 5 }];
CARS.forEach((k) => { k.T = k.u / A; k.S = (k.u * k.u) / (2 * A); k.dur = k.T * SQUEEZE; });
const DROP0 = LEAD + CARS[1].dur + 0.4, DROP_STEP = 0.3, DROP_RUN = 0.55;
const fmt1 = (m) => (Math.round(m * 10) / 10).toFixed(1);
const ROLL = (px) => px / (CAR / CAR_M);

export class StoppingScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  /** The predict mount (beat and count Number.MAX_SAFE_INTEGER) gets its own stage, SETUP. */
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: SETUP, dwellMs: null }]] };
  static ARIA_LABEL = 'Two cars on a highway reach a brake line, one at 54 kilometres per hour and one at 108, twice as fast. Both brake at minus 4 metres per second squared. The slower car stops 28.1 metres past the line. The faster car stops 112.5 metres past the line, and four copies of the 28.1 metre strip fill its stopping distance: double the speed, four times the braking distance.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER; }
  /** -1 the predict setup, else the beat 0..1. */
  get key() { return this.isSetup() ? -1 : Math.max(0, Math.min(1, this.cur | 0)); }
  busy() { return this.age < [2.2, LEAD + CARS[0].dur + 0.8, DROP0 + DROP_STEP * 3 + DROP_RUN + 0.6][this.key + 1]; }

  /** Real seconds of braking for car i in this beat (0 before its run). */
  tReal(i) { return clamp01((this.age - LEAD) / CARS[i].dur) * CARS[i].T; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const k = this.key, set = k === -1;
    // State from the beat: car 1 brakes in b0 and rests stopped in b1; car 2 waits in b0, brakes in b1.
    const st = CARS.map((car, i) => {
      if (set) return { x: -(1 - inOutSine(clamp01(this.age / 1.8))) * car.u * 6 / K, v: car.u };
      const t = (i === 0 && k === 1) ? car.T : (i === 1 && k === 0) ? 0 : this.tReal(i);
      return { x: car.u * t - 0.5 * A * t * t, v: Math.max(0, car.u - A * t) };
    });
    const focus = set ? [1, 1] : k === 0 ? [1, DIM] : [0.6, 1];

    this.roads(ctx, c, set ? (this.age < 1.8 ? this.age * 30 : 54) : 0);
    if (!set) this.scale(ctx, c);
    this.brakeLine(ctx, c);
    if (!set) {
      if (k >= 0) this.strip(ctx, c, 0, st[0].x, 1);
      if (k === 1) this.strip(ctx, c, 1, st[1].x, 1);
      if (k === 1) this.blocks(ctx, c);
    }
    CARS.forEach((car, i) => {
      ctx.save(); ctx.globalAlpha = focus[i];
      const nose = BL + st[i].x * K;
      if (set) this.streaks(ctx, c, nose - CAR, G[i], car.u);
      drawCar(ctx, c, { x: nose - CAR / 2, y: G[i], length: CAR, roll: ROLL(nose), tone: car.tone });
      ctx.restore();
      if (!set && (k === i || (k === 1 && i === 0))) this.drop(ctx, c, nose, G[i], focus[i]);
    });
    this.gauges(ctx, c, st, focus);
    this.tags(ctx, c, k, st);
  }

  /** Two lanes: each a kit road strip; the near half of each holds the distance strip. */
  roads(ctx, c, scroll) {
    G.forEach((g) => drawTrack(ctx, c, trackSpec({ from: 0, to: 680 / K, x0: 16, x1: 664, y: g + 10 }), { kind: 'road', ticks: false, depth: 56, scroll: scroll / K }));
  }

  /** The shared metre scale: 0 m at the brake line, 4 px per m. */
  scale(ctx, c) {
    drawScale(ctx, c, { vertical: false, at: SCALE_Y, p0: BL, p1: BL + 120 * K, from: 0, to: 120, every: 20, side: 1, size: 26, origin: null });
  }

  /** The brake line: a painted bar across both lanes and a dashed line, tag "brakes on" above. */
  brakeLine(ctx, c) {
    ctx.save();
    ctx.strokeStyle = alpha(c.bad, 0.85); ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
    ctx.beginPath(); ctx.moveTo(BL, 62); ctx.lineTo(BL, this.key === -1 ? G[1] + 40 : SCALE_Y); ctx.stroke();
    ctx.setLineDash([]);
    for (const g of G) {
      rr(ctx, BL - 4, g - 16, 8, 52, 3); ctx.fillStyle = lighten(c.bad, 0.25); ctx.fill();
      ctx.strokeStyle = darken(c.bad, 0.4); ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    drawTag(ctx, c, 'brakes on', BL, 38, { col: c.bad });
  }

  /** A distance strip on the near half of lane i, from the brake line to the nose. */
  strip(ctx, c, i, m, a) {
    if (m < 0.05) return;
    this.bar(ctx, c, BL, BL + m * K, G[i] + 6, 15, c['s' + CARS[i].tone], a);
  }

  /** A raised bar: light top line, shade foot, darker rim (the Quill treatment). */
  bar(ctx, c, x0, x1, y, h, col, a = 1) {
    ctx.save(); ctx.globalAlpha *= a;
    rr(ctx, x0, y, x1 - x0, h, 5); ctx.fillStyle = col; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = darken(col, 0.22); ctx.fillRect(x0, y + h * 0.62, x1 - x0, h);
    ctx.fillStyle = alpha(lighten(col, 0.55), 0.8); ctx.fillRect(x0 + 3, y + 2, x1 - x0 - 6, 3);
    ctx.restore();
    rr(ctx, x0, y, x1 - x0, h, 5); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  /** b1: four copies of car 1's 28.1 m strip lift off lane 1 and land end to end in lane 2. */
  blocks(ctx, c) {
    const L = CARS[0].S * K, y0 = G[0] + 6, y1 = G[1] + 23, col = c['s' + CARS[0].tone];
    for (let j = 0; j < 4; j++) {
      const u = clamp01((this.age - DROP0 - j * DROP_STEP) / DROP_RUN);
      if (u <= 0) continue;
      const e = inOutSine(u), x = BL + j * L * e, y = y0 + (y1 - y0) * e - Math.sin(Math.PI * e) * 40;
      this.bar(ctx, c, x + 1, x + L - 1, y, 13, col, 1);
    }
  }

  /** The nose marker: a dashed drop from the car's nose to the metre scale. */
  drop(ctx, c, nose, g, a) {
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = c.annot; ctx.lineWidth = 2.5; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(nose, g - 30); ctx.lineTo(nose, SCALE_Y - 8); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(nose, g - 30, 5, 0, Math.PI * 2); ctx.fillStyle = c.annot; ctx.fill();
    ctx.restore();
  }

  /** Setup only: short speed streaks behind the car, twice as long for twice the speed. */
  streaks(ctx, c, tail, g, u) {
    ctx.save(); ctx.strokeStyle = alpha(c.label, 0.45); ctx.lineWidth = 3; ctx.lineCap = 'round';
    [[-50, 1.6], [-34, 1], [-20, 1.3]].forEach(([dy, f]) => {
      const len = u * 1.6 * f;
      ctx.beginPath(); ctx.moveTo(tail - 8, g + dy); ctx.lineTo(tail - 8 - len, g + dy); ctx.stroke();
    });
    ctx.restore();
  }

  /** Two gauges (unit in the readout tag: the kit dial prints its unit over the last number). */
  gauges(ctx, c, st, focus) {
    [[300, 0], [540, 1]].forEach(([x, i]) => {
      const kmh = st[i].v * 3.6, col = c['s' + CARS[i].tone];
      ctx.save(); ctx.globalAlpha = focus[i];
      drawSpeedometer(ctx, c, { x, y: 92, r: 80, max: 120, major: 60, minor: 10, value: kmh, unit: '', size: 26, tone: CARS[i].tone });
      ctx.restore();
      drawTag(ctx, c, Math.round(kmh) + ' km/h', x, 196, { col, alpha: focus[i] });
    });
  }

  tags(ctx, c, k, st) {
    if (k < 0) return;
    const n1 = BL + st[0].x * K;
    if (k === 0 ? this.age > LEAD + CARS[0].dur + 0.1 : true) {
      const pop = k === 0 ? outBack(clamp01((this.age - LEAD - CARS[0].dur - 0.1) / 0.4)) : 1;
      ctx.save(); ctx.globalAlpha = k === 1 ? 0.8 : 1;
      drawTag(ctx, c, fmt1(CARS[0].S) + ' m', n1 + 16, G[0] - 36, { col: c['s' + CARS[0].tone], align: 'left', size: 26 * Math.max(0.2, pop) });
      ctx.restore();
    }
    if (k !== 1) return;
    const done = this.age > LEAD + CARS[1].dur + 0.1;
    if (done) {
      const pop = outBack(clamp01((this.age - LEAD - CARS[1].dur - 0.1) / 0.4));
      drawTag(ctx, c, fmt1(CARS[1].S) + ' m', 300, G[1] - 44, { col: c['s' + CARS[1].tone], size: 34 * Math.max(0.2, pop) });
    }
    const last = DROP0 + DROP_STEP * 3 + DROP_RUN;
    if (this.age > last) {
      const pop = outBack(clamp01((this.age - last) / 0.4));
      drawTag(ctx, c, '\u00d7 4', 82, G[1] + 28, { col: c['s' + CARS[0].tone], size: 30 * Math.max(0.2, pop) });
    }
  }
}
