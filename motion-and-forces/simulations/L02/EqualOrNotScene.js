/**
 * EqualOrNotScene - slide "Can they be equal?" (blk-l02-n02, 1 beat).
 * Two straight tracks, stacked, the same scale (0..60 m from O).
 * Top: the athlete runs O -> 60 m and never turns back. Her path ribbon (distance) and the dashed
 *   displacement arrow end level: 60 m and 60 m, "displacement = distance".
 * Bottom: she runs O -> 60 m, turns, and comes back to 20 m. The ribbon runs out and back (100 m);
 *   the arrow from O ends at her: 20 m, "displacement < distance".
 * Both run once at the same pace (the bottom one runs longer), then rest on the answer.
 * The ribbon is traced from the distance run so far; the arrow always joins O to where she is.
 * Frames depend on age only. ASCII only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, alpha, darken, lighten, font, popAt } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawAthlete, LOOKS } from '../shared/MotionCast.js';

const GO = 0.6;           // s before anyone moves
const PACE = 30;          // screen m/s (same for both runs)
const FIG_H = 80;
const RIB_W = 16;
const PANELS = [
  { Y: 0, turn: 60, end: 60, total: 60, sign: '=' },
  { Y: 256, turn: 60, end: 20, total: 100, sign: '<' },
];
const ROW = { say: 22, out: 56, back: 78, arrow: 102, feet: 196 };

export class EqualOrNotScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'Two athletes on straight tracks marked from O to 60 m. The top one runs from O to 60 m without turning back: her distance travelled is 60 m and her displacement is 60 m, so they are equal. The bottom one runs to 60 m, turns and comes back to 20 m: her distance travelled is 100 m but her displacement is only 20 m, so the displacement is smaller.';

  constructor(container, config) { super(container, config); }
  busy() { return this.age < GO + 100 / PACE + 1; }

  spec(P) { return trackSpec({ from: -4, to: 64, x0: 30, x1: 592, y: P.Y + ROW.feet }); }

  /** Metres run so far in panel P, and where she is. */
  runOf(P) {
    const d = Math.min(P.total, Math.max(0, this.age - GO) * PACE);
    const m = d <= P.turn ? d : P.turn - (d - P.turn);
    return { d, m, facing: d > P.turn ? -1 : 1, moving: d > 0 && d < P.total, done: d >= P.total };
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    for (const P of PANELS) this.panel(ctx, c, P);
  }

  panel(ctx, c, P) {
    const spec = this.spec(P), r = this.runOf(P);
    drawTrack(ctx, c, spec, { kind: 'track', lanes: 1, every: 20, unit: 'm', depth: 28 });
    this.ribbon(ctx, c, spec, P, r.d);
    const len = spec.toPx(r.m) - spec.toPx(0);
    drawMotionArrow(ctx, c, 's', spec.toPx(0), P.Y + ROW.arrow, { length: len < 1 ? 0 : len, label: Math.round(r.m) + ' m', side: 1, at: 0.5, width: 7, head: 20, size: 26 });
    // Ribbon value at its far end (the end of the straight run, or the turn).
    const pop = popAt(this.age, GO + P.total / PACE);
    if (pop !== null) {
      const a = pop?.alpha ?? 1;
      const lx = spec.toPx(P.turn) + RIB_W + 14, ly = P.end === P.turn ? P.Y + ROW.out : (P.Y + ROW.out + P.Y + ROW.back) / 2;
      this.say(ctx, c, P.total + ' m', lx, ly, { col: c.s7ink, align: 'left', alpha: a });
      this.statement(ctx, c, P, a, pop?.scale ?? 1);
    }
    // The athlete.
    const lane = { ...spec, y: spec.y - 6 };
    if (r.moving) drawAthlete(ctx, c, lane, { m: r.m, dist: r.d, height: FIG_H, facing: r.facing });
    else drawFigure(ctx, c, { x: spec.toPx(r.m), y: spec.y - 6, height: FIG_H, build: 'teen', facing: r.done && P.end !== P.turn ? -1 : 1, pose: 'stand' }, figureLook(c, LOOKS.athlete));
  }

  /** "displacement = distance" in the two inks, the sign between them, top right of the panel. */
  statement(ctx, c, P, a, s) {
    const y = P.Y + ROW.say, size = 26;
    ctx.save(); ctx.font = font(c, 800, size, true);
    const w1 = ctx.measureText('displacement').width, w2 = ctx.measureText('distance').width;
    ctx.restore();
    const signW = 44, x1 = 664, x0 = x1 - (w1 + signW + w2);
    this.say(ctx, c, 'displacement', x0, y, { col: c.s4ink, align: 'left', alpha: a });
    this.say(ctx, c, P.sign, x0 + w1 + signW / 2, y, { size: Math.round(40 * Math.max(0.4, s)), alpha: a });
    this.say(ctx, c, 'distance', x1, y, { col: c.s7ink, align: 'right', alpha: a });
  }

  /** The path ribbon: out lane O -> turn, a half turn, back lane turn -> end; d metres traced. */
  ribbon(ctx, c, spec, P, d) {
    if (d <= 0) return;
    const yo = P.Y + ROW.out, yb = P.Y + ROW.back, xT = spec.toPx(P.turn), rad = (yb - yo) / 2, col = c.s7;
    const path = (g) => {
      g.beginPath();
      g.moveTo(spec.toPx(0), yo);
      g.lineTo(spec.toPx(Math.min(d, P.turn)), yo);
      if (d > P.turn) {
        g.arc(xT, yo + rad, rad, -Math.PI / 2, Math.PI / 2, false);
        g.lineTo(spec.toPx(Math.max(P.end, P.turn - (d - P.turn))), yb);
      }
    };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.save(); ctx.translate(0, 3); path(ctx); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = RIB_W + 4; ctx.stroke(); ctx.restore();
    path(ctx); ctx.strokeStyle = darken(col, 0.38); ctx.lineWidth = RIB_W + 4; ctx.stroke();
    path(ctx); ctx.strokeStyle = col; ctx.lineWidth = RIB_W; ctx.stroke();
    ctx.save(); ctx.translate(0, 3); path(ctx); ctx.strokeStyle = alpha(darken(col, 0.2), 0.8); ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(0, -3); path(ctx); ctx.strokeStyle = alpha(lighten(col, 0.5), 0.75); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  say(ctx, c, text, x, y, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(c, o.weight ?? 800, o.size ?? 26, true); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = alpha(c.bgSurface, 0.9); ctx.lineWidth = 7; ctx.strokeText(text, x, y);
    ctx.fillStyle = o.col ?? c.label; ctx.fillText(text, x, y);
    ctx.restore();
  }
}
