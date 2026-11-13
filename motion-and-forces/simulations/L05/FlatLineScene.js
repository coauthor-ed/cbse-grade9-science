/**
 * FlatLineScene - slide blk-l05-n04 "A flat line" (1 beat; Example 4.6, Fig 4.15).
 * A straight road with metre marks from the origin O and a car parked with its centre on the
 * 40 m mark (wheels still, no motion marks). A stopwatch runs 0 to 3 s while a dot traces the
 * position-time graph (0-3 s, 0-60 m): the line stays flat at 40 m because the car does not
 * move. One position tag in one tone, "40 m", on the car's mark and at the line's height.
 * Rest: the whole flat line, the car where it was, the stopwatch at 3 s.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, alpha, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawScale } from 'simulations/base/kit/SimTrack.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { graphFrame, drawGraphPaper, drawAxes, drawPoint, drawThrough, drawTag } from '../shared/MotionGraph.js';

const X = 40, T_END = 3, CAR = 150, RUN = 3.0;   // m, book s, px, s on screen
const DATA = [[0, X], [T_END, X]];

export class FlatLineScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A car is parked on a straight road with its middle at the 40 metre mark from the origin O. A stopwatch runs from 0 to 3 seconds while a dot traces the position-time graph. The car does not move, so the graph is a flat line at 40 metres: a flat position-time graph means the object is at rest.';

  constructor(container, config) {
    super(container, config);
    this.f = graphFrame({ x: 110, y: 214, w: 400, h: 292 }, { x: { max: T_END, step: 1, title: 'time (s)' }, y: { max: 60, step: 20, title: 'position (m)' } });
  }

  busy() { return this.age < RUN + 0.8; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const t = T_END * clamp01((this.age - 0.3) / RUN), tone = c.s2, f = this.f;
    // The road, its scale from O, the parked car (roll fixed: the wheels never turn).
    const spec = trackSpec({ from: -4, to: 64, x0: 16, x1: 664, y: 114 });
    const tr = drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 40 });
    drawScale(ctx, c, { vertical: false, at: tr.bottom + 12, p0: spec.toPx(0), p1: spec.toPx(60), from: 0, to: 60, every: 10, side: 1 });
    const nx = spec.toPx(X);
    drawCar(ctx, c, { x: nx, y: spec.y, length: CAR, roll: 0, tone: 1 });
    // The graph: the dot traces the flat line as the clock runs.
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, 99);
    drawThrough(ctx, c, f, DATA, t / T_END, { width: 6 });
    const [dx, dy] = f.at([t, X]);
    // One position, one tone: the mark under the car's centre and the line's height on the Y-axis.
    ctx.save();
    ctx.strokeStyle = tone; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(nx, spec.y + 2); ctx.lineTo(nx, tr.bottom - 2); ctx.stroke();
    ctx.fillStyle = alpha(tone, 0.9); ctx.beginPath(); ctx.arc(f.plot.x, dy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    drawPoint(ctx, c, f, [t, X], 9, { r: 11, col: tone });
    drawTag(ctx, c, X + ' m', nx + CAR / 2 + 10, spec.y - 38, { align: 'left', col: tone });   // beside the car, off the road strip
    drawTag(ctx, c, X + ' m', f.plot.x + 12, dy - 30, { align: 'left', col: tone, segs: DATA.map(f.at), prefer: [[0, 0], [0, -8], [40, 0]] });
    drawStopwatch(ctx, c, { x: 584, y: 340, r: 58, seconds: t, text: t.toFixed(1) + ' s' });
  }
}
