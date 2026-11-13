/**
 * CarGraphForceScene - slide blk-l13-n05 "Force from a graph" (2 beats; Ex 6.6, Fig 6.21).
 * Top: a road strip, the 1500 kg sports car (nose = its position) and a small "east" compass tag.
 * Bottom: the velocity-time graph of Fig 6.21 (0-15 s, 0-10 m/s): up 0 to 10 m/s in 5 s, flat to 10 s,
 * down to 0 at 15 s. The whole line shows faint; the parts light up as the car runs them (compressed
 * clock: 5 s of the book in about 2.5 s). The car moves by x(t), the area under the graph.
 *   b0 'speedup'  part 1 draws while the car speeds up from rest; F arrow "3000 N" east, tail on the car;
 *                 tag "a = 2 m/s2" beside the part. Rest: car at 25 m, part 1 lit, tags.
 *   b1 'steady'   part 2 draws while the car moves steadily: kit dot "net force = 0" on the car; then
 *                 part 3 while it slows to a stop: F arrow "3000 N" west (tail on the car), tag
 *                 "a = -2 m/s2". Rest: car stopped at 100 m, all three parts lit, part 1's tag faint.
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, vectorArrow } from 'simulations/base/kit/SimLook.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack } from 'simulations/base/kit/SimTrack.js';
import { graphFrame, drawGraphPaper, drawAxes, drawThrough, drawTag, DIM } from '../shared/MotionGraph.js';
import { drawForce, drawNet } from '../shared/ForceCast.js';

const SUP2 = '\u00b2', CAR = 150, CAR_M = 4.2, F_LEN = 128, ROAD_Y = 124;
const NOSE0 = 190, NOSE1 = 652;                  // the nose at 0 m and at 100 m
const LEAD = 0.3, PART = 2.5, GAP = 0;            // 5 s of the book in 2.5 s; part 3 follows part 2 at once
const PARTS = [[[0, 0], [5, 10]], [[5, 10], [10, 10]], [[10, 10], [15, 0]]];
const LINE = [[0, 0], [5, 10], [10, 10], [15, 0]];
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));

/** Velocity (m/s) and position (m) at book time t (s). */
function vOf(t) { return t < 5 ? 2 * t : t < 10 ? 10 : Math.max(0, 10 - 2 * (t - 10)); }
function xOf(t) {
  if (t < 5) return t * t;
  if (t < 10) return 25 + 10 * (t - 5);
  const u = Math.min(t, 15) - 10; return 75 + 10 * u - u * u;
}

export class CarGraphForceScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A 1500 kilogram sports car on a road going east, and its velocity-time graph from 0 to 15 seconds. From 0 to 5 seconds the line rises from 0 to 10 metres per second while the car speeds up: the acceleration is 2 metres per second squared, and a force of 3000 newtons acts on the car towards the east. From 5 to 10 seconds the line is flat: the car moves at a steady speed and the net force is zero. From 10 to 15 seconds the line falls to 0 while the car slows to a stop: the acceleration is minus 2 metres per second squared, and a force of 3000 newtons acts towards the west, opposite to the motion.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    const sc = (NOSE1 - NOSE0) / 100;
    this.spec = trackSpec({ from: -(NOSE0 - 12) / sc, to: 100 + (668 - NOSE1) / sc, x0: 12, x1: 668, y: ROAD_Y });
    this.f = graphFrame({ x: 6, y: 160, w: 668, h: 356 }, { x: { max: 15, step: 5, minor: 5, title: 'time (s)' }, y: { max: 10, step: 2.5, minor: 2, title: 'velocity (m/s)' } });
  }

  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < (this.cur === 0 ? LEAD + PART + 0.9 : LEAD + 2 * PART + GAP + 0.9); }

  /** Book time (s) for this beat and age. */
  bookTime() {
    const a = this.age;
    if (this.cur === 0) return 5 * clamp01((a - LEAD) / PART);
    const t2 = 5 + 5 * clamp01((a - LEAD) / PART), t3 = 5 * clamp01((a - LEAD - PART - GAP) / PART);
    return t3 > 0 ? 10 + t3 : t2;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const t = this.bookTime();
    this.road(ctx, c, t);
    this.graph(ctx, c, t);
  }

  /** The road, the compass, the car with its nose at x(t), and the force on it. */
  road(ctx, c, t) {
    const spec = this.spec, x = xOf(t), nose = spec.toPx(x), cx = nose - CAR / 2;
    drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 30 });
    const car = drawCar(ctx, c, { x: cx, y: spec.y, length: CAR, roll: x * spec.scale / (CAR / CAR_M), tone: 4 });
    const roof = car.box ? car.box.y0 : spec.y - 56, my = spec.y - 24;
    drawTag(ctx, c, '1500 kg', cx, roof - 26);
    // The force on the car (one scale: 3000 N = F_LEN px).
    const a = this.age;
    if (this.cur === 0) {
      const k = ease(a, LEAD, 0.4);
      if (k > 0) drawForce(ctx, c, nose - 8, my, { length: F_LEN, label: '3000 N', alpha: k, fit: false });
      return;
    }
    if (t < 10 - 1e-6) {
      const k = ease(a, LEAD + 0.3, 0.4);
      if (k > 0) drawNet(ctx, c, nose + 14, my, [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }], { alpha: k, label: 'net force = 0' });
      return;
    }
    const rear = cx - CAR / 2;
    drawForce(ctx, c, rear + 10, my, { length: F_LEN, angle: Math.PI, label: '3000 N', side: -1, fit: false });
  }

  /** Fig 6.21: the whole line faint, the parts this beat runs lit. */
  graph(ctx, c, t) {
    const f = this.f, a = this.age;
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, 99);
    // Compass in the paper's top-right corner, clear of the plot and of the car: east is to the right.
    drawTag(ctx, c, 'east', 626, 196);
    vectorArrow(ctx, c, 604, 234, { length: 46, col: c.label, width: 4, head: 12 });
    drawThrough(ctx, c, f, LINE, 1, { width: 5, alpha: 0.22 });
    const segs = LINE.map(f.at);
    const kOf = (i) => clamp01((t - 5 * i) / 5);
    const lit = this.cur === 0 ? [0] : [0, 1, 2];
    lit.forEach((i) => {
      const k = kOf(i);
      if (k > 0) drawThrough(ctx, c, f, PARTS[i], k, { width: 6, alpha: this.cur === 1 && i === 0 ? 0.6 : 1 });
    });
    const p1 = f.at([2.5, 5]), p3 = f.at([12.5, 5]);
    const k1 = this.cur === 0 ? ease(a, LEAD + 0.6 * PART, 0.5) : 1;
    let avoid = [];
    if (k1 > 0) avoid.push(drawTag(ctx, c, 'a = 2 m/s' + SUP2, p1[0], p1[1], { col: c.annot, segs, prefer: [[96, 44], [110, 70]], alpha: k1 * (this.cur === 1 ? DIM : 1) }));
    if (this.cur === 1) {
      const k3 = ease(a, LEAD + PART + GAP + 0.6 * PART, 0.5);
      if (k3 > 0) drawTag(ctx, c, 'a = -2 m/s' + SUP2, p3[0], p3[1], { col: c.annot, segs, avoid, prefer: [[-100, 44], [-110, 70]], alpha: k3 });
    }
  }
}
