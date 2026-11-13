/**
 * VTGraphQuestionScene - question q-l13-n06 (Revise Q11, book Fig 6.41), hostRole 'setup'.
 * One velocity-time graph: time 0 to 8 s (step 2), velocity 0 to 30 m/s (step 10).
 * A straight line from (0 s, 10 m/s) to (8 s, 30 m/s), ringed points at both ends, dashed
 * guides from (8 s, 30 m/s) to both axes, and a small "mass 10 kg" tag in the empty top
 * left corner. Every beat draws the same graph: axes build, the line draws on, then the
 * points and guides (under 1.5 s), then rest.
 * No answer is shown: no slope triangle, no acceleration, no force.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01 } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { graphFrame, drawGraphPaper, drawAxes, drawPoint, drawGuides, drawThrough, drawTag } from '../shared/MotionGraph.js';

const LINE = [[0, 10], [8, 30]];

export class VTGraphQuestionScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: 0, dwellMs: null }]] };
  static ARIA_LABEL = 'A velocity-time graph for an object of mass 10 kilograms. Time in seconds runs from 0 to 8 along the bottom, marked 2, 4, 6 and 8; velocity in metres per second runs from 0 to 30 up the side, marked 10, 20 and 30. A straight line rises from 10 metres per second at 0 seconds to 30 metres per second at 8 seconds. Dashed lines join the end point to both axes.';

  constructor(container, config) {
    super(container, config);
    this.f = graphFrame({ x: 8, y: 6, w: 664, h: 508 }, {
      x: { max: 8, step: 2, minor: 5, title: 'time (s)' },
      y: { max: 30, step: 10, minor: 5, title: 'velocity (m/s)' },
    });
  }

  busy() { return this.age < 1.8; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const f = this.f, still = reducedMotion(), a = still ? 9 : this.age;
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, still ? 99 : a * 1.4);
    const k = clamp01((a - 0.45) / 0.6);
    if (k > 0) drawThrough(ctx, c, f, LINE, k, { width: 5, col: c.s1 });
    drawGuides(ctx, c, f, LINE[1], clamp01((a - 1.0) / 0.4));
    // The start point sits on the Y axis beside the number 10: a smaller ring keeps it clear.
    LINE.forEach((d, i) => drawPoint(ctx, c, f, d, a - 1.05, { r: i ? 9 : 6 }));
    const ta = clamp01((a - 1.2) / 0.3);
    if (ta <= 0) return;
    const [x, y] = f.at([0.25, 27]);
    drawTag(ctx, c, 'mass 10 kg', x, y, { align: 'left', prefer: [[0, 0]], alpha: ta });
  }
}
