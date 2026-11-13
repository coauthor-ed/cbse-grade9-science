/**
 * PTGraphsQuestionScene - question q-l11-n04 (Revise Q6, book Fig 6.37), hostRole 'setup'.
 * Four small position-time graphs in a 2 x 2 grid, titled Object A .. Object D, axes
 * "position" and "time" with no numbers (as the book), origin O. All four lines in the
 * same tone, so colour gives no hint. Every beat draws the same complete graph: the axes
 * build, then the four lines draw on together (under 1.5 s), then rest.
 *   A  straight line rising from O
 *   B  flat line at about two thirds height
 *   C  curve from O, getting steeper (x = k t squared)
 *   D  straight line falling from the top of the Y axis to the X axis
 * No answer is shown: no slopes, no velocity words, no force marks.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, font } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { graphFrame, drawGraphPaper, drawAxes, drawThrough, curveData } from '../shared/MotionGraph.js';

const PAD = 8, GAP = 10, TXT = 26;
const PW = (680 - 2 * PAD - GAP) / 2, PH = (520 - 2 * PAD - GAP) / 2;
const LINES = [
  { name: 'Object A', data: [[0, 0], [9.4, 5.4]] },
  { name: 'Object B', data: [[0, 4], [9.4, 4]] },
  { name: 'Object C', data: curveData((t) => 0.062 * t * t, 0, 9.4, 40) },
  { name: 'Object D', data: [[0, 5.4], [8.6, 0]] },
];

export class PTGraphsQuestionScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: 0, dwellMs: null }]] };
  static ARIA_LABEL = 'Four position-time graphs, for objects A, B, C and D, with position up the side and time along the bottom, starting at the origin O. Object A: a straight line rising from O. Object B: a flat line at about two thirds of the height. Object C: a curve that starts at O and gets steeper and steeper. Object D: a straight line falling from the top of the position axis down to the time axis.';

  constructor(container, config) {
    super(container, config);
    // graphFrame keeps 82 px under the plot for numbers and a title; these graphs have no
    // numbers, so the rect runs 36 px past the panel and the sheet is set to the panel.
    this.panels = LINES.map((L, i) => {
      const r = { x: PAD + (i % 2) * (PW + GAP), y: PAD + Math.floor(i / 2) * (PH + GAP), w: PW, h: PH };
      const f = graphFrame({ x: r.x, y: r.y, w: r.w, h: r.h + 36 }, {
        x: { max: 10, step: 10, minor: 10, fmt: () => '' },
        y: { max: 6, step: 6, minor: 6, title: 'position', fmt: () => '' },
      });
      f.sheet = r;
      return { ...L, r, f };
    });
  }

  busy() { return this.age < 1.7; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const still = reducedMotion();
    const ta = still ? 99 : this.age * 1.4;
    const k = still ? 1 : clamp01((this.age - 0.45) / 0.9);
    this.panels.forEach((P) => this.panel(ctx, c, P, ta, k));
  }

  /** One graph: paper, axes (Y title by the kit), "time" under the X arrow, name top right, line. */
  panel(ctx, c, P, ta, k) {
    const { f, r } = P, p = f.plot;
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, ta);
    const kt = clamp01((ta - 0.9) / 0.4);
    ctx.save();
    ctx.globalAlpha = kt;
    ctx.fillStyle = c.label;
    ctx.font = font(c, 800, TXT);
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText('time', p.x + p.w + 26, f.base + 10);
    ctx.textBaseline = 'middle';
    ctx.fillText(P.name, r.x + r.w - 14, p.y - 26);
    ctx.restore();
    if (k > 0) drawThrough(ctx, c, f, P.data, k, { width: 5, col: c.s1 });
  }
}
