/**
 * InclineTrackScene - slide "A ball down a slope" (blk-l02-n03, 2 beats; Fig 4.6).
 * A straight inclined track (a wooden wedge whose top face carries the marked line) runs down
 * from O on the left to D on the right; marks O, A, B, C, D at 0, 40, 50, 70, 100 cm along it.
 * The ball rolls from rest, speeding up: s(t) = 100 (t / ROLL)^2 cm (constant acceleration).
 * b0: the gaps 40, 10, 20, 30 cm are bracketed along the slope; the ball rolls O -> D once; then the
 *     wedge fades and the marked line turns about O until it lies flat: a number line from O.
 * b1: the flat line; the ball rolls O -> D again, and at each mark it passes a pair pops,
 *     distance | displacement from O: 40 | 40, 50 | 50, 70 | 70, 100 | 100 (header once).
 * The line is drawn in a frame rotated about O, so the slope and the flat line are the same line.
 * Frames depend on beat and age only. ASCII only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, alpha, font, popAt, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { drawRamp, propRig } from 'simulations/base/kit/SimProps.js';

const GO = 0.6, ROLL = 1.7, HOLD = 0.5, TURN = 0.9;
const LEN = 500;                     // px for 100 cm along the track
const XO = 80, YO = 236;             // O, the pivot (flat line height)
const THETA = 0.29;                  // slope angle (rad, about 17 deg)
const R = 16;
const MARKS = [{ m: 0, L: 'O' }, { m: 40, L: 'A' }, { m: 50, L: 'B' }, { m: 70, L: 'C' }, { m: 100, L: 'D' }];

export class InclineTrackScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A ball rolls from rest down a straight inclined track, speeding up, from O through A, B and C to D. The gaps are 40 cm, 10 cm, 20 cm and 30 cm. The track then turns about O until it lies flat as a straight number line starting at O. Rolling along it again, at A, B, C and D the distance travelled and the displacement from O are equal: 40, 50, 70 and 100 cm.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.age < GO + ROLL + HOLD + TURN + 0.8; }

  /** Line frame: spec along x from 0 at O, y = 0 on the line. */
  spec() { return trackSpec({ from: 0, to: 100, x0: 0, x1: LEN, y: 0 }); }
  /** cm rolled at age (from rest, speeding up). */
  sAt(age) { const u = clamp01((age - GO) / ROLL); return 100 * u * u; }
  /** Slope angle now: b0 turns flat after the roll; b1 is flat. */
  angle() {
    if (this.cur === 1) return 0;
    const u = clamp01((this.age - GO - ROLL - HOLD) / TURN);
    return THETA * (1 - inOutSine(u));
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const th = this.angle(), b1 = this.cur === 1, s = this.sAt(this.age);
    const wedgeA = b1 ? 0 : clamp01(th / THETA * 1.4 - 0.4);

    // The wedge under the slope, faded out as the line turns flat.
    if (wedgeA > 0) {
      const dx = LEN * Math.cos(THETA), rise = LEN * Math.sin(THETA), G = YO + rise, XD = XO + dx;
      ctx.save(); ctx.globalAlpha *= wedgeA;
      ctx.translate(XO + XD, 4); ctx.scale(-1, 1);       // drawRamp rises to the right; mirror it
      drawRamp(ctx, c, propRig({ x0: 0, x1: 680, groundY: G, scale: 1 }), { from: XO, to: XD, rise, tone: 8 });
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= wedgeA;
      ctx.fillStyle = alpha(c.label, 0.25); ctx.fillRect(XO - 30, G + 4, dx + 70, 5);
      ctx.restore();
    }

    // The marked line, in the frame turned about O.
    const spec = this.spec();
    ctx.save();
    ctx.translate(XO, YO); ctx.rotate(th);
    drawTrack(ctx, c, spec, { kind: 'line', every: 100, unit: 'cm', origin: 0,
      points: MARKS.slice(1).map((k) => ({ m: k.m, label: k.L, tone: 8 })) });
    if (!b1) {
      drawStrobe(ctx, c, spec, { at: MARKS.map((k) => k.m), draw: () => {}, gaps: true, bracketY: -132,
        gapLabels: ['40 cm', '10 cm', '20 cm', '30 cm'], tone: 4 });
    }
    // On the slope the ball sits on the surface; once the line is flat it rides on the line, a point on it.
    drawBall(ctx, c, { x: spec.toPx(s), y: -(R + 2) * (th / THETA), r: R, tone: 6 });
    ctx.restore();

    if (b1) this.pairs(ctx, c, spec, s);
  }

  /** distance | displacement at each mark, popping as the ball passes; two staggered rows. */
  pairs(ctx, c, spec, s) {
    const hy = YO + 96;
    this.say(ctx, c, 'distance', 300, hy, { col: c.s7ink, align: 'right' });
    this.say(ctx, c, '|', 318, hy, { col: c.labelMuted });
    this.say(ctx, c, 'displacement', 336, hy, { col: c.s4ink, align: 'left' });
    MARKS.slice(1).forEach((k, i) => {
      const tPass = GO + ROLL * Math.sqrt(k.m / 100), pop = popAt(this.age, tPass);
      if (pop === null) return;
      const x = XO + spec.toPx(k.m), y = YO + 150 + (i % 2) * 56, a = pop?.alpha ?? 1;
      this.say(ctx, c, String(k.m), x - 10, y, { col: c.s7ink, align: 'right', alpha: a, size: 30 });
      this.say(ctx, c, '|', x, y, { col: c.labelMuted, alpha: a, size: 30 });
      this.say(ctx, c, String(k.m), x + 10, y, { col: c.s4ink, align: 'left', alpha: a, size: 30 });
    });
  }

  say(ctx, c, text, x, y, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(c, o.weight ?? 800, o.size ?? 26, true); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = alpha(c.bgSurface, 0.9); ctx.lineWidth = 7; ctx.strokeText(text, x, y);
    ctx.fillStyle = o.col ?? c.label; ctx.fillText(text, x, y);
    ctx.restore();
  }
}
