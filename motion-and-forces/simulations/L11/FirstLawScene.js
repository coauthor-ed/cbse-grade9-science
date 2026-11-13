/**
 * FirstLawScene - predict blk-l13-s2 "No net force" (setup) and explain blk-l13-s3 "Newton's first law"
 * (3 beats). Side views on the ideal floor (GalileoScene.idealFloor, the L10 imagined glass surface).
 *   setup        a wooden block slides right on the ideal floor, v arrow, "net force = 0"; it glides for
 *                1 s, then the frame freezes mid-floor. No dots, no answer.
 *   b0 'law'     two rows. Top: the block at rest, "v = 0", "net force = 0", it stays still. Bottom: the
 *                same block gliding at constant velocity, equal-time dots with equal gap brackets,
 *                "net force = 0". Tags "at rest: stays at rest", "moving: same velocity".
 *   b1 'zero'    the gliding row only, larger: a dashed straight path ahead, equal gap brackets, the v arrow
 *                the same length now and (faint) at two earlier dots, "a = 0". Tag "same speed, same direction".
 *   b2 'inertia' the word "inertia" on a card (the hero); under it "Isaac Newton, three laws of motion, 1687"
 *                and "unit of force: newton (N)". The gliding block faint behind. No portrait.
 * MODE 'graphs' (NoForceGraphsScene, slide blk-l11-n02, 2 beats) is drawn here too: a floor strip on top,
 * position-time and velocity-time graphs below (Figs 6.15, 6.16; no numbers on the axes, only O).
 *   g0 'rest'    the block at rest at a marked position; position-time a flat line at that position;
 *                velocity-time a flat line on the time axis ("v = 0").
 *   g1 'moving'  the block glides with equal dots; position-time a straight rising line whose head follows
 *                the block; velocity-time a flat line above the time axis.
 * Constant velocity: x = x0 + V t, dots every DT from x(t). Every frame is a function of the beat and its age only.
 */
import { GalileoScene } from './GalileoScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from '../shared/MotionCast.js';
import { drawTag, drawSheet, graphFrame, drawGraphPaper, drawAxes, drawThrough } from '../shared/MotionGraph.js';
import { drawNet, drawBoxOn } from '../shared/ForceCast.js';

const SETUP = 9;
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const NET0 = [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }];
const NOX = () => '';

export class FirstLawScene extends GalileoScene {
  static MODE = 'law';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  /** The predict mount (beat and count Number.MAX_SAFE_INTEGER) gets its own stage, SETUP. */
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: SETUP, dwellMs: null }]] };
  static ARIA_LABEL = 'Newton\'s first law. A wooden block on a perfectly smooth floor with no net force on it. A block at rest stays at rest: its velocity is zero. A block that is moving keeps the same velocity: the dots it leaves at equal times are equally spaced, its velocity arrow keeps the same length and direction, and its acceleration is zero. Newton called this tendency to resist a change in the state of rest or of uniform motion inertia; he gave three laws of motion in 1687, and the unit of force, the newton (N), is named after him.';

  isSetup() { return this.constructor.MODE !== 'graphs' && (this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER); }
  busy() {
    if (this.constructor.MODE === 'graphs') return this.age < 4.0;
    if (this.isSetup()) return this.age < 1.6;
    return this.age < [3.8, 3.8, 4.6][Math.min(this.cur, 2)];
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.constructor.MODE === 'graphs') return this.graphs(ctx, c);
    if (this.isSetup()) return this.setupFrame(ctx, c);
    if (this.cur === 0) this.law(ctx, c);
    else if (this.cur === 1) this.zero(ctx, c);
    else this.inertia(ctx, c);
  }

  /** The block on the ideal floor (floor drawn by the caller), centre x, floor top y. */
  block(ctx, c, x, y, w, h, o = {}) { return drawBoxOn(ctx, c, { x, y, w, h, kind: 'block', alpha: o.alpha }); }
  vArrow(ctx, c, x, y, len, o = {}) { return drawMotionArrow(ctx, c, 'v', x - len / 2, y, { length: len, label: 'v', side: 1, alpha: o.alpha }); }

  // -- setup: glide 1 s, then freeze ---------------------------------------------------------------------
  setupFrame(ctx, c) {
    const FL = 352, t = clamp01((this.age - 0.3) / 1.0), x = 200 + 150 * t;
    this.idealFloor(ctx, c, -12, 720, FL, 44);
    const b = this.block(ctx, c, x, FL, 150, 92);
    this.vArrow(ctx, c, x, b.top.y - 30, 110);
    drawNet(ctx, c, 250, FL + 92, NET0, { label: 'net force = 0' });
  }

  // -- b0: at rest stays at rest; moving keeps its velocity ------------------------------------------------
  law(ctx, c) {
    const a = this.age, BW = 124, BH = 74;
    // top row: at rest
    const F1 = 190, k1 = ease(a, 0, 0.4);
    this.idealFloor(ctx, c, 16, 664, F1, 30);
    const b1 = this.block(ctx, c, 300, F1, BW, BH);
    drawMotionArrow(ctx, c, 'v', 300, b1.top.y - 26, { length: 0, label: 'v = 0', side: 1, alpha: k1 });
    drawTag(ctx, c, 'at rest: stays at rest', 20, 36, { align: 'left', prefer: [[0, 0]] });
    drawNet(ctx, c, 560, 236, NET0, { label: 'net force = 0', side: -1, alpha: k1 });
    // bottom row: gliding at constant velocity
    const F2 = 422, V = 120, DTb = 0.5, t = clamp01((a - 0.4) / 3.0) * 3.0, x0 = 100, x = x0 + V * t;
    this.idealFloor(ctx, c, 16, 720, F2, 30);
    const xs = []; for (let k = 0; k * DTb <= t + 1e-6; k++) xs.push(x0 + V * DTb * k);
    this.dots(ctx, c, xs, F2, { by: F2 + 30 + 18 });
    const b2 = this.block(ctx, c, x, F2, BW, BH);
    this.vArrow(ctx, c, x, b2.top.y - 26, 96);
    drawTag(ctx, c, 'moving: same velocity', 20, 272, { align: 'left', prefer: [[0, 0]] });
    drawNet(ctx, c, 560, 470, NET0, { label: 'net force = 0', side: -1, alpha: k1 });
  }

  // -- b1: zero acceleration -----------------------------------------------------------------------------
  zero(ctx, c) {
    const a = this.age, FL = 388, BW = 176, BH = 104, V = 100, DTz = 0.75, x0 = 130;
    const t = clamp01((a - 0.4) / 3.0) * 3.0, x = x0 + V * t, cy = FL - BH / 2, ay = FL - BH - 30;
    this.idealFloor(ctx, c, -12, 720, FL, 36);
    const xs = []; for (let k = 0; k * DTz <= t + 1e-6; k++) xs.push(x0 + V * DTz * k);
    // the straight path ahead
    ctx.save(); ctx.setLineDash([12, 10]); ctx.lineWidth = 3; ctx.strokeStyle = alpha(c.labelMuted ?? c.label, 0.7); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + BW / 2 + 10, cy); ctx.lineTo(676, cy); ctx.stroke(); ctx.restore();
    this.dots(ctx, c, xs, FL, { by: FL + 36 + 18 });
    const kc = ease(a, 0.6, 0.5);
    for (const k of [0, 2]) if (xs.length > k + 2 && kc > 0) this.vArrow(ctx, c, xs[k], ay, 110, { alpha: 0.32 * kc });
    this.block(ctx, c, x, FL, BW, BH);
    this.vArrow(ctx, c, x, ay, 110);
    drawMotionArrow(ctx, c, 'a', 90, FL + 100, { length: 0, label: 'a = 0', side: 1 });
    drawTag(ctx, c, 'same speed, same direction', 340, 70, { size: 30, col: c.accent, alpha: ease(a, 0.2, 0.5) });
  }

  // -- b2: inertia ---------------------------------------------------------------------------------------
  inertia(ctx, c) {
    const a = this.age, FL = 462, t = Math.min(a, 4.2), x = 110 + 70 * t;
    this.idealFloor(ctx, c, -12, 720, FL, 34, { alpha: 0.35 });
    this.block(ctx, c, x, FL, 112, 66, { alpha: 0.3 });
    const k1 = ease(a, 0.2, 0.5), k2 = ease(a, 0.9, 0.5);
    const big = { x: 150, y: 36, w: 380, h: 150 };
    drawSheet(ctx, c, big, { alpha: k1 });
    this.word(ctx, c, 'inertia', 340, big.y + 76, { size: 84, col: c.accent, alpha: k1 });
    const sm = { x: 110, y: 214, w: 460, h: 150 };
    drawSheet(ctx, c, sm, { alpha: k2 });
    this.word(ctx, c, 'Isaac Newton', 340, sm.y + 36, { size: 30, alpha: k2 });
    this.word(ctx, c, 'three laws of motion, 1687', 340, sm.y + 76, { weight: 700, alpha: k2 });
    this.word(ctx, c, 'unit of force: newton (N)', 340, sm.y + 114, { weight: 700, alpha: k2 });
  }

  // -- MODE 'graphs' (NoForceGraphsScene) ----------------------------------------------------------------
  graphs(ctx, c) {
    const a = this.age, moving = this.cur >= 1, k = clamp01((a - 0.4) / 3.0), T = 6 * k;
    const FL = 104, X = (p) => 70 + 104 * p, BW = 78, BH = 48;
    const pos = (t) => (moving ? 0.8 * t : 2), P = pos(T);
    this.idealFloor(ctx, c, 16, 664, FL, 30);
    this.word(ctx, c, 'O', X(0), FL + 52, { size: 26 });
    ctx.save(); ctx.strokeStyle = c.label; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(0), FL + 30); ctx.lineTo(X(0), FL + 38); ctx.stroke(); ctx.restore();
    if (!moving) {                                                   // the marked position
      ctx.save(); ctx.setLineDash([7, 6]); ctx.strokeStyle = c.annot; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(X(2), FL - BH - 14); ctx.lineTo(X(2), FL + 40); ctx.stroke(); ctx.restore();
    } else {
      const xs = []; for (let s = 0; s <= T + 1e-6; s += 1) xs.push(X(pos(s)));
      this.dots(ctx, c, xs, FL);
    }
    const b = this.block(ctx, c, X(P), FL, BW, BH);
    if (moving) drawMotionArrow(ctx, c, 'v', X(P) + BW / 2 + 8, FL - BH / 2, { length: 58, label: 'v', side: 1 });
    const ax = (title) => ({ x: { max: 6, step: 6, minor: 6, title: 'time (s)', fmt: NOX }, y: { max: 5, step: 5, minor: 5, title, fmt: NOX } });
    const fp = graphFrame({ x: 6, y: 160, w: 334, h: 358 }, ax('position (m)'));
    const fv = graphFrame({ x: 340, y: 160, w: 334, h: 358 }, ax('velocity (m/s)'));
    for (const f of [fp, fv]) { drawGraphPaper(ctx, c, f); drawAxes(ctx, c, f, 99); }
    const vv = moving ? 3 : 0;
    drawThrough(ctx, c, fp, [[0, pos(0)], [6, pos(6)]], k);
    drawThrough(ctx, c, fv, [[0, vv], [6, vv]], k);
    if (!moving && k > 0.3) drawTag(ctx, c, 'v = 0', fv.px(4.2), fv.py(0) - 34, { col: c.accent, alpha: ease(k, 0.3, 0.3), prefer: [[0, 0]] });
  }
}
