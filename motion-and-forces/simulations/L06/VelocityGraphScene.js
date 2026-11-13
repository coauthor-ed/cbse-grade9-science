/**
 * VelocityGraphScene - slide blk-l06-s1 "Velocity against time" (3 beats) and the setup of
 * predict blk-l06-s2 (BEAT_MAPS MAX_SAFE_INTEGER -> stage 9, or hostRole 'setup').
 * A road strip on top (the car's nose is its position), a velocity-time graph (0-30 s,
 * 0-25 m/s) below left, a speedometer (km/h) right. Each beat runs the book's 30 s in 3 s:
 * the car moves by x = integral of v(t), the needle reads v(t), the line draws on in step.
 *   b0     car 1, steady 20 m/s (72 km/h): v arrow constant, "a = 0" dot; flat line at 20.
 *   b1     car 2 (Table 4.5) v = 0.5 t from rest: points every 5 s, rising line; v arrow
 *          grows, a arrow forward with a fixed length. Car 1's line dims.
 *   b2     car 3 (Table 4.6) v = 15 - 0.5 t: falling line with points; v arrow shrinks, a
 *          arrow backward. The other two lines dim.
 *   setup  car 2's run and rising line only: no a arrow, no triangle, no acceleration words.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawSpeedometer, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { graphFrame, drawGraphPaper, drawAxes, drawPoint, drawThrough, curveData, drawTag, DIM } from '../shared/MotionGraph.js';

const T_END = 30, RUN = 3.0, LEAD = 0.3, CAR = 140, CAR_M = 4.2, V_PX = 5, A_LEN = 74;
const SETUP = 9;
const CARS = [
  { v: () => 20, x: (t) => 20 * t, tone: 1, pts: false },
  { v: (t) => 0.5 * t, x: (t) => 0.25 * t * t, tone: 5, pts: true, a: 1 },
  { v: (t) => 15 - 0.5 * t, x: (t) => 15 * t - 0.25 * t * t, tone: 4, pts: true, a: -1 },
];
const LINES = CARS.map((k) => curveData(k.v, 0, T_END, 12));
const TIMES = [0, 5, 10, 15, 20, 25, 30];
const fmt = (v) => String(Math.round(v * 10) / 10);

export class VelocityGraphScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  /** The predict mount (beat and count Number.MAX_SAFE_INTEGER) gets its own stage, SETUP. */
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: SETUP, dwellMs: null }]] };
  static ARIA_LABEL = 'A road, a speedometer and a velocity-time graph from 0 to 30 seconds. The first car moves at a steady 20 metres per second, 72 kilometres per hour: its graph is a flat line and its acceleration is zero. The second car starts from rest and gains 2.5 metres per second every 5 seconds: its graph is a rising straight line, and its acceleration points forward. The third car starts at 15 metres per second and loses 2.5 metres per second every 5 seconds: its graph is a falling straight line, and its acceleration points backward.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.f = graphFrame({ x: 4, y: 216, w: 468, h: 304 }, { x: { max: T_END, step: 5, title: 'time (s)' }, y: { max: 25, step: 5, minor: 4, title: 'velocity (m/s)' } });
    // The road spans the frame; the car's nose runs from 156 px (0 m) to 540 px (600 m).
    const sc = (540 - 156) / 600;
    this.spec = trackSpec({ from: -(156 - 16) / sc, to: 600 + (664 - 540) / sc, x0: 16, x1: 664, y: 186 });
  }

  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER; }
  /** -1 the predict setup (car 2 without acceleration), else the beat 0..2. */
  get key() { return this.isSetup() ? -1 : Math.max(0, Math.min(2, this.cur | 0)); }

  busy() { return this.age < LEAD + RUN + 0.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const k = this.key, ci = k === -1 ? 1 : k, car = CARS[ci];
    const t = T_END * clamp01((this.age - LEAD) / RUN), v = car.v(t), x = car.x(t);
    this.road(ctx, c, car, x, v, k !== -1);
    this.graph(ctx, c, k, ci, t);
    // The kit dial's own unit text sits on its last number at r 100: the unit goes in the readout.
    drawSpeedometer(ctx, c, { x: 576, y: 342, r: 100, max: 100, value: v * 3.6, unit: '' });
    drawTag(ctx, c, Math.round(v * 3.6) + ' km/h', 576, 464, { col: c['s' + car.tone] });
    drawTag(ctx, c, 't = ' + Math.round(t) + ' s', 576, 501);
  }

  /** The road, the car with its nose at x metres, its v arrow (and a arrow unless setup). */
  road(ctx, c, car, x, v, showA) {
    const spec = this.spec;
    drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 30 });
    const nose = spec.toPx(x), cx = nose - CAR / 2;
    const roll = (x * spec.scale) / (CAR / CAR_M);          // wheels turn by the px the car moves
    const body = drawCar(ctx, c, { x: cx, y: spec.y, length: CAR, roll, tone: car.tone });
    const roof = body.box ? body.box.y0 : spec.y - 64;
    const vy = roof - 16, ay = vy - 52;      // the a label stays 26 px clear of the frame top
    if (v > 0.05) drawMotionArrow(ctx, c, 'v', cx, vy, { length: V_PX * v, label: fmt(v) + ' m/s', side: 1 });
    else drawMotionArrow(ctx, c, 'v', cx, vy, { length: 0, label: 'v = 0' });
    if (!showA) return;
    if (!car.a) drawMotionArrow(ctx, c, 'a', cx, ay, { magnitude: 0, label: 'a = 0' });
    else drawMotionArrow(ctx, c, 'a', cx, ay, { length: A_LEN, angle: car.a > 0 ? 0 : Math.PI, label: 'a', side: car.a > 0 ? 1 : -1 });
  }

  /** Earlier cars' lines dim; this car's line and its 5 s points draw on with the clock. */
  graph(ctx, c, k, ci, t) {
    const f = this.f;
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, 99);
    const tone = (i) => c['s' + CARS[i].tone];
    const shown = k === -1 ? [1] : [0, 1, 2].slice(0, k + 1);
    const segs = [];
    shown.forEach((i) => {
      const hero = i === ci, kk = hero ? t / T_END : 1, al = hero ? 1 : DIM;
      drawThrough(ctx, c, f, LINES[i], kk, { width: 6, col: tone(i), alpha: al });
      if (CARS[i].pts) TIMES.forEach((ti) => drawPoint(ctx, c, f, [ti, CARS[i].v(ti)], hero ? ((t - ti) * RUN) / T_END : 9, { r: 7, col: tone(i), alpha: al }));
      segs.push(LINES[i].map(f.at));
    });
    // Car names beside the finished lines, clear of every line and of each other.
    const at = [[26, 20], [26, 13], [6, 12]];
    const pref = [[[0, -30], [0, 30]], [[0, -30], [0, 30], [-30, -34]], [[44, -36], [64, -30], [30, 34]]];
    let avoid = [];
    shown.forEach((i) => {
      if (i === ci && t < T_END) return;
      const [px, py] = f.at(at[i]);
      const box = drawTag(ctx, c, 'car ' + (i + 1), px, py, { col: tone(i), alpha: i === ci ? 1 : 0.6, avoid, segs: segs[shown.indexOf(i)], prefer: pref[i] });
      avoid = avoid.concat([box]);
    });
  }
}
