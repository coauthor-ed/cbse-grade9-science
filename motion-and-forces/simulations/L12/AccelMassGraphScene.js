/**
 * AccelMassGraphScene - question q-l12-n04 (Revise Q10, book Fig 6.40), hostRole 'setup'.
 * One acceleration-mass graph: mass 0 to 5 kg (step 1), acceleration 0 to 10 m/s2
 * (step 2.5, numbers 2.5 .. 10.0). The curve a = 10 / m from 1 kg to 5 kg, from its formula.
 * Two ringed points with small tags, (1 kg, 10 m/s2) and (5 kg, 2 m/s2), each with dashed
 * guides to both axes. Every beat draws the same graph: axes build, the curve draws on,
 * then the points, guides and tags (under 1.5 s), then rest.
 * No answer is shown: no force values, no force-mass line, no products.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01 } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { graphFrame, drawGraphPaper, drawAxes, drawPoint, drawGuides, drawThrough, curveData, drawTag } from '../shared/MotionGraph.js';

const SQ = '\u00b2';
const CURVE = curveData((m) => 10 / m, 1, 5, 60);
const PTS = [
  { d: [1, 10], text: '1 kg, 10 m/s' + SQ, prefer: [[128, 34], [128, 0], [150, 50]] },
  { d: [5, 2], text: '5 kg, 2 m/s' + SQ, prefer: [[-70, -46], [0, -48], [-110, -40]] },
];

export class AccelMassGraphScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: 0, dwellMs: null }]] };
  static ARIA_LABEL = 'An acceleration-mass graph. Mass in kilograms runs from 0 to 5 along the bottom; acceleration in metres per second squared runs from 0 to 10 up the side, marked 2.5, 5.0, 7.5 and 10.0. A curve falls from 10 metres per second squared at 1 kilogram to 2 metres per second squared at 5 kilograms. These two points are marked, with dashed lines to both axes.';

  constructor(container, config) {
    super(container, config);
    this.f = graphFrame({ x: 8, y: 6, w: 664, h: 508 }, {
      x: { max: 5, step: 1, minor: 5, title: 'mass (kg)' },
      y: { max: 10, step: 2.5, minor: 5, title: 'acceleration (m/s' + SQ + ')', fmt: (v) => v.toFixed(1) },
    });
    // The Y numbers ("10.0") are wider than the frame's two-digit margin: widen the sheet left.
    const s = this.f.sheet, p = this.f.plot;
    const x0 = p.x - 88;
    this.f.sheet = { x: x0, y: s.y, w: s.x + s.w - x0 + 6, h: s.h };
  }

  busy() { return this.age < 1.8; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const f = this.f, still = reducedMotion(), a = still ? 9 : this.age;
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, still ? 99 : a * 1.4);
    const k = clamp01((a - 0.45) / 0.65);
    if (k > 0) drawThrough(ctx, c, f, CURVE, k, { width: 5, col: c.s1 });
    const g = clamp01((a - 1.0) / 0.4);
    PTS.forEach((P) => drawGuides(ctx, c, f, P.d, g));
    PTS.forEach((P) => drawPoint(ctx, c, f, P.d, a - 1.05));
    const ta = clamp01((a - 1.2) / 0.3);
    if (ta <= 0) return;
    const segs = CURVE.map(f.at);
    let avoid = [];
    PTS.forEach((P) => {
      const [x, y] = f.at(P.d);
      const box = drawTag(ctx, c, P.text, x, y, { avoid: avoid.concat([{ x: x - 14, y: y - 14, w: 28, h: 28 }]), segs, prefer: P.prefer, alpha: ta });
      avoid = avoid.concat([box]);
    });
  }
}
