/**
 * SlopeCompareScene - predict blk-l05-s2 (setup) and explain blk-l05-s3 (3 beats).
 *   setup  two straight lines from the origin, A (10 m/s) and B (20 m/s, steeper), tagged at
 *          their ends; axes and titles only. No triangle, no speeds, no comparison words.
 *   b0     the vehicle's line x = 20 t alone; points A (2 s, 40 m) and B (4 s, 80 m) pop; the
 *          kit slope triangle draws CA first, then BC; tags "CA = 2 s" and "BC = 40 m".
 *   b1     the triangle stays; beside it slope = BC / CA, = 40 m / 2 s, = 20 m/s build line by
 *          line, the newest line the hero.
 *   b2     back to lines A and B; one shared time interval (3 s to 5 s) shades on the time axis;
 *          each line's rise over it grows as a bracket in the line's tone: A's short, B's long.
 * Corner letters (b0, b1) and object names (setup, b2) are never on screen together.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01 } from 'simulations/base/kit/SimLook.js';
import { slopeTriangle } from 'simulations/base/kit/SimPlot.js';
import { graphFrame, drawGraphPaper, drawAxes, drawPoint, drawThrough, curveData, drawBracket, drawTag, drawSheet } from '../shared/MotionGraph.js';

const VA = 10, VB = 20;                      // m/s: object A, object B (the vehicle's line is B's)
const LINE_A = curveData((t) => VA * t, 0, 6, 12), LINE_B = curveData((t) => VB * t, 0, 6, 12);
const PA = [2, 40], PB = [4, 80];            // Fig 4.14 points
const T1 = 3, T2 = 5;                        // the shared time interval in b2
const SETUP = 9;                             // the predict mount's stage
const RECT = { x: 14, y: 10, w: 380, h: 496 };
const PANEL = { x: 448, y: 120, w: 218, h: 280 };

export class SlopeCompareScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  /** The predict mount (beat and count Number.MAX_SAFE_INTEGER) gets its own stage, SETUP. */
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: 9, dwellMs: null }]] };
  static ARIA_LABEL = 'A position-time graph. On the vehicle line, point A is at 2 seconds and 40 metres and point B at 4 seconds and 80 metres. The triangle ABC has CA, the change in time, 2 seconds, and BC, the change in position, 40 metres. Velocity is BC divided by CA, 40 metres over 2 seconds, which is 20 metres per second: the slope of the line. Then two lines A and B: over the same time interval, B rises more than A, so B is steeper and has the higher velocity.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.f = graphFrame(RECT, { x: { max: 6, step: 1, title: 'time (s)' }, y: { max: 120, step: 20, title: 'position (m)' } });
  }

  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER; }
  get key() { return this.isSetup() ? -1 : Math.max(0, Math.min(2, this.cur | 0)); }

  busy() { return this.age < [2.0, 3.6, 2.6, 3.0][this.key + 1]; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const f = this.f;
    drawGraphPaper(ctx, c, f);
    drawAxes(ctx, c, f, 99);
    const k = this.key;
    if (k === -1 || k === 2) this.twoLines(ctx, c, f, k === 2);
    else this.triangle(ctx, c, f, k);
  }

  // -- setup and b2: the two objects ------------------------------------------------------------
  twoLines(ctx, c, f, compare) {
    const a = this.age, cols = [c.s1, c.s2], lines = [LINE_A, LINE_B], names = ['A', 'B'], v = [VA, VB];
    const draw = compare ? 1 : clamp01(a / 1.1);
    if (compare) {                            // the shared time interval shades on the time axis
      const s = clamp01(a / 0.4), x1 = f.px(T1), x2 = f.px(T2), P = f.plot;
      ctx.save();
      ctx.fillStyle = c.annot;
      ctx.globalAlpha = 0.12 * s; ctx.fillRect(x1, P.y, x2 - x1, P.h);
      ctx.globalAlpha = 0.6 * s; ctx.fillRect(x1, f.base - 9, x2 - x1, 9);
      ctx.restore();
      if (s > 0.5) drawTag(ctx, c, 't', (x1 + x2) / 2, f.base - 30, { col: c.annot, alpha: clamp01((s - 0.5) * 2) });
    }
    lines.forEach((d, i) => drawThrough(ctx, c, f, d, draw, { width: 6, col: cols[i] }));
    if (compare) {
      [0, 1].forEach((i) => {
        const g = clamp01((a - 0.6 - 0.7 * i) / 0.6);
        if (g <= 0) return;
        const y1 = v[i] * T1, y2 = v[i] * T2, [r0x, r0y] = f.at([T1, y1]), [r1x] = f.at([T2, y1]);
        ctx.save();
        ctx.globalAlpha = Math.min(1, g * 2); ctx.strokeStyle = cols[i]; ctx.lineWidth = 2.5; ctx.setLineDash([7, 6]);
        ctx.beginPath(); ctx.moveTo(r0x, r0y); ctx.lineTo(r1x, r0y); ctx.stroke();
        ctx.restore();
        drawPoint(ctx, c, f, [T1, y1], a - 0.6 - 0.7 * i, { r: 7, col: cols[i] });
        drawPoint(ctx, c, f, [T2, y2], a - 0.6 - 0.7 * i, { r: 7, col: cols[i] });
        drawBracket(ctx, c, f, [T2, y1], [T2, y1 + (y2 - y1) * g], '', { side: 1, gap: 14, col: cols[i] });
      });
    }
    // Object names at the line ends only.
    const tg = compare ? 1 : clamp01((a - 1.1) / 0.3);
    if (tg > 0) {
      let avoid = [];
      lines.forEach((d, i) => {
        const [x, y] = f.at(d[d.length - 1]);
        const box = drawTag(ctx, c, names[i], x + 14, y, { col: cols[i], align: 'left', alpha: tg, avoid, prefer: [[0, 0], [0, -24], [0, 24]] });
        avoid = avoid.concat([box]);
      });
    }
  }

  // -- b0 and b1: the triangle ABC on the vehicle's line ----------------------------------------
  triangle(ctx, c, f, k) {
    const a = k === 0 ? this.age : 99, col = c.annot;
    drawThrough(ctx, c, f, LINE_B, k === 0 ? clamp01(a / 0.7) : 1, { width: 6 });
    const popA = a - 0.8, popB = a - 1.15, ca = clamp01((a - 1.6) / 0.6), bc = clamp01((a - 2.4) / 0.6);
    if (ca > 0 && bc <= 0) slopeTriangle(ctx, c, f, PA, [PA[0] + (PB[0] - PA[0]) * ca, PA[1]], { letters: false, col });
    if (bc > 0 && bc < 1) slopeTriangle(ctx, c, f, PA, [PB[0], PA[1] + (PB[1] - PA[1]) * bc], { letters: false, col });
    const tri = bc >= 1 ? slopeTriangle(ctx, c, f, PA, PB, { col }) : null;
    drawPoint(ctx, c, f, PA, popA, { col: c.s1 });
    drawPoint(ctx, c, f, PB, popB, { col: c.s1 });
    if (!tri) this.letters(ctx, c, f, [popA, popB]);
    // Tags: CA under its leg once drawn, BC beside its leg once drawn.
    const [ax, ay] = f.at(PA), [bx, by] = f.at(PB), hb = k === 1 ? 0.75 : 1;
    let run = null;
    if (ca >= 1) run = drawTag(ctx, c, 'CA = 2 s', (ax + bx) / 2, ay + 48, { col, alpha: hb });
    if (bc >= 1) drawTag(ctx, c, 'BC = 40 m', bx + 14, (ay + by) / 2, { col, align: 'left', alpha: hb, avoid: run ? [run] : [] });
    if (k === 1) this.equation(ctx, c);
  }

  /** A and B beside the points while the triangle builds, where the kit puts them once whole. */
  letters(ctx, c, f, ages) {
    const [ax, ay] = f.at(PA), [bx, by] = f.at(PB), L = Math.hypot(bx - ax, by - ay) || 1, off = 26 * 0.8;
    let nx = -(by - ay) / L, ny = (bx - ax) / L;
    if (nx * (bx - ax) > 0) { nx = -nx; ny = -ny; }
    ctx.save();
    ctx.font = font(c, 800, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    [['A', ax, ay, ages[0]], ['B', bx, by, ages[1]]].forEach(([s, x, y, age]) => {
      if (age < 0.15) return;
      ctx.globalAlpha = clamp01((age - 0.15) / 0.2);
      ctx.lineWidth = 6; ctx.strokeStyle = c.bgSurface; ctx.strokeText(s, x + nx * off, y + ny * off);
      ctx.fillStyle = c.annot; ctx.fillText(s, x + nx * off, y + ny * off);
    });
    ctx.restore();
  }

  /** slope = BC / CA, = 40 m / 2 s, = 20 m/s: line by line, the newest the hero. */
  equation(ctx, c) {
    const a = this.age, P = PANEL, l1 = clamp01((a - 0.2) / 0.4), l2 = clamp01((a - 1.0) / 0.4), l3 = clamp01((a - 1.9) / 0.5);
    drawSheet(ctx, c, P);
    const cx = P.x + P.w / 2, ink = c.label;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const frac = (x, y, top, bot, size, al) => {
      ctx.globalAlpha = al; ctx.font = font(c, 800, size, true); ctx.fillStyle = ink;
      const w = Math.max(ctx.measureText(top).width, ctx.measureText(bot).width) + 12;
      ctx.fillText(top, x, y - size * 0.62); ctx.fillText(bot, x, y + size * 0.66);
      ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.stroke();
      return w;
    };
    const dimOld = (later) => 1 - 0.45 * later;
    if (l1 > 0) {
      const al = l1 * dimOld(l2), y = P.y + 52;
      ctx.globalAlpha = al; ctx.font = font(c, 800, 26, true); ctx.fillStyle = ink; ctx.textAlign = 'right';
      ctx.fillText('slope =', cx + 4, y);
      ctx.textAlign = 'center';
      frac(cx + 50, y, 'BC', 'CA', 26, al);
    }
    if (l2 > 0) {
      const al = l2 * dimOld(l3), y = P.y + 140;
      ctx.globalAlpha = al; ctx.font = font(c, 800, 28, true); ctx.fillStyle = ink; ctx.textAlign = 'right';
      ctx.fillText('=', cx - 34, y);
      ctx.textAlign = 'center';
      frac(cx + 18, y, '40 m', '2 s', 28, al);
    }
    if (l3 > 0) {
      const y = P.y + 228, s = 0.85 + 0.15 * l3;
      ctx.globalAlpha = l3;
      ctx.translate(cx, y); ctx.scale(s, s);
      ctx.font = font(c, 900, 48, true); ctx.fillStyle = c.annot;
      ctx.fillText('= 20 m/s', 0, 0);
    }
    ctx.restore();
  }
}
