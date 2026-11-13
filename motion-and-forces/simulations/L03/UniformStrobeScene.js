/**
 * UniformStrobeScene - slide "Uniform and non-uniform motion" (blk-l03-n01, 2 beats).
 * b0: one car on a straight highway at a constant 10 m/s (x = 10 t). It drives once;
 *     every 1 s (stopwatch) a dot drops on the road under its nose. Gap brackets all
 *     read "10 m": equal distances in equal intervals of time. Rests with the car at
 *     50 m and six dots.
 * b1: the uniform road dims into a thin strip at the top. Two roads below, 1 s marks:
 *     speeding up x = 2 t^2 (gaps 2, 6, 10, 14 m) and slowing down x = 32 - 2 (4 - t)^2
 *     (gaps 14, 10, 6, 2 m). Every gap is computed from x(t), never placed by hand.
 * Each run plays in about 3 s on screen; the stopwatch shows the slide's seconds.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, font, alpha } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';

const GO = 0.5, PLAY = 3.2;
const CAR_L = 150;

// Positions (m) of each car at slide time t (s).
const X_UNI = (t) => 10 * t;
const X_UP = (t) => 2 * t * t;
const X_DOWN = (t) => 32 - 2 * (4 - t) * (4 - t);

export class UniformStrobeScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A car drives along a straight highway at a constant speed. Every second a dot drops on the road, and every gap is 10 m: equal distances in equal times. Then two more cars: one speeding up, whose gaps grow 2, 6, 10, 14 m, and one slowing down, whose gaps shrink 14, 10, 6, 2 m.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.age < GO + PLAY + 0.3; }

  // Slide seconds since the run began (0 .. dur).
  simT(dur) { return clamp01((this.age - GO) / PLAY) * dur; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.uniform(ctx, c); else this.nonUniform(ctx, c);
  }

  /** One road with a car whose nose sits at x(t), the 1 s marks dropped so far and their gap brackets. */
  lane(ctx, c, { from, to, y, depth, xOf, t, tone, len, bracketY, size = 26, gaps = true, unit = 'm' }) {
    const spec = trackSpec({ from, to, x0: 34, x1: 646, y });
    drawTrack(ctx, c, spec, { kind: 'road', depth, ticks: false, origin: null });
    const marks = [];
    for (let k = 0; k <= Math.floor(t + 1e-6); k++) marks.push(xOf(k));
    // Marks ride on the near lane, below the wheels, so the car never hides them.
    const markSpec = trackSpec({ from, to, x0: 34, x1: 646, y: y + depth * 0.28 });
    // Gap labels: plain numbers, the unit on the widest one, so even a 2 m gap keeps its label on one row.
    const d = marks.slice(1).map((x, i) => Math.abs(x - marks[i]));
    const big = d.indexOf(Math.max(...d));
    const gapLabels = d.map((g, i) => String(Math.round(g)) + (i === big || g === d[big] ? ' ' + unit : ''));
    drawStrobe(ctx, c, markSpec, { at: marks, marks: 'dots', markTone: 'annot', gaps: gaps && marks.length > 1, gapLabels, bracketY, size });
    const m = xOf(t), nose = spec.toPx(m), pxPerM = len / 4.2;
    drawCar(ctx, c, { x: nose - len / 2, y, length: len, tone, roll: (m * spec.scale) / pxPerM });
    return spec;
  }

  uniform(ctx, c) {
    const t = this.simT(5);
    this.lane(ctx, c, { from: -16, to: 54, y: 330, depth: 64, xOf: X_UNI, t, tone: 4, len: CAR_L, bracketY: 430 });
    // The instants under the brackets: 0 s, 1 s, ... one per dot (equal intervals of time).
    const spec = trackSpec({ from: -16, to: 54, x0: 34, x1: 646, y: 330 });
    for (let k = 0; k <= Math.floor(t + 1e-6); k++) this.name(ctx, c, k + ' s', spec.toPx(X_UNI(k)), 470, 1, 'center', c.annot);
    drawStopwatch(ctx, c, { x: 590, y: 104, r: 62, seconds: t, dialSeconds: 10, text: Math.floor(t + 1e-6) + ' s', readout: 'below' });
  }

  nonUniform(ctx, c) {
    const t = this.simT(4);
    // The uniform road, dimmed to a thin strip: its finished state, no labels.
    ctx.save(); ctx.globalAlpha *= 0.35;
    this.lane(ctx, c, { from: -16, to: 54, y: 66, depth: 30, xOf: X_UNI, t: 5, tone: 4, len: 112, gaps: false });
    ctx.restore();
    this.lane(ctx, c, { from: -11, to: 36, y: 214, depth: 52, xOf: X_UP, t, tone: 2, len: CAR_L, bracketY: 284 });
    this.name(ctx, c, 'speeding up', 300, 148, 1, 'center');
    this.lane(ctx, c, { from: -11, to: 36, y: 418, depth: 52, xOf: X_DOWN, t, tone: 6, len: CAR_L, bracketY: 488 });
    this.name(ctx, c, 'slowing down', 300, 352, 1, 'center');
  }

  name(ctx, c, text, x, y, k, align = 'left', col = c.label) {
    ctx.save(); ctx.globalAlpha *= k;
    ctx.font = font(c, 800, 26, true); ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = alpha(c.bgDeep, 0.9); ctx.lineJoin = 'round'; ctx.strokeText(text, x, y);
    ctx.fillStyle = col; ctx.fillText(text, x, y);
    ctx.restore();
  }
}
