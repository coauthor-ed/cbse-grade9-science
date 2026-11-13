/**
 * InstantIntervalScene - slide "An instant and a time interval" (blk-l01-n02, 1 beat; Fig 4.4).
 * The book run on the straight track: O at 0 s, B (40 m) at t = 4 s, A (100 m) at t = 10 s,
 * x = 10 t (the book's 10 m/s), compressed (PACE screen s per book s).
 * She runs O to B; the stopwatch stops at 4 s and holds while the word "instant" and the
 * tag "t = 4 s" pop at B; she runs on to A, the watch holds at 10 s and "t = 10 s" pops at A.
 * Below, a time strip 0..16 s: a marker slides with the watch, a pin stays at each reading,
 * and at the end a bracket from 4 s to 10 s grows, "6 s", labelled "time interval".
 * Rests at A, watch 10 s, both pins, the bracket.
 * Reuses AthleteRunScene (L02): spec, drawTrack (letters B and A, no ruler), drawAthlete, say.
 * ASCII only.
 */
import { AthleteRunScene } from '../L02/AthleteRunScene.js';
import { drawBackdrop, clamp01, rr, darken, lighten, alpha, font, outBack } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';

const P = 0.3, G0 = 0.6, HOLD = 0.8, V1 = 10;
const T1 = G0 + 4 * P, T2 = T1 + HOLD, T3 = T2 + 6 * P, T4 = T3 + 0.45, END = T4 + 0.6;
const STRIP_Y = 448, BRACKET_Y = 404, TAG_Y = 160, WORD_Y = 118;

/** A light tag with a coloured rim (never a dark pill); returns its box. */
function tagAt(ctx, c, text, x, y, col, size = 26) {
  ctx.save();
  ctx.font = font(c, 800, size, true);
  const w = ctx.measureText(text).width + 26, h = size * 1.3;
  x = Math.max(w / 2 + 8, Math.min(680 - w / 2 - 8, x));
  ctx.save(); ctx.translate(0, 3); rr(ctx, x - w / 2, y - h / 2, w, h, 10); ctx.fillStyle = darken(col, 0.35); ctx.fill(); ctx.restore();
  rr(ctx, x - w / 2, y - h / 2, w, h, 10); ctx.fillStyle = c.bgSurface; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
  return { x0: x - w / 2, y0: y - h / 2, w, h };
}

export class InstantIntervalScene extends AthleteRunScene {
  static MODE = 'instant';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'The athlete runs on a straight track from O. A stopwatch stops at 4 s when she is at B, 40 m from O: one reading, the instant t = 4 s. She runs on and the watch reads 10 s when she reaches A at 100 m. On a time strip from 0 s to 16 s, a bracket from 4 s to 10 s shows the time interval between the two readings: 6 s.';

  enter(stage) { this.cur = 0; }
  busy() { return this.age < END + 0.2; }

  /** Book time on the watch: runs to 4, holds, runs to 10, holds. */
  bookT() {
    const a = this.age;
    if (a < G0) return 0;
    if (a < T1) return (a - G0) / P;
    if (a < T2) return 4;
    if (a < T3) return 4 + (a - T2) / P;
    return 10;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const t = this.bookT(), m = V1 * t, spec = this.spec();
    const moving = (this.age > G0 && this.age < T1) || (this.age > T2 && this.age < T3);
    this.drawTrack(ctx, c, { letters: ['B', 'A'], ticks: false });

    // The time strip and its readings.
    const strip = trackSpec({ from: 0, to: 16, x0: 60, x1: 620, y: STRIP_Y });
    drawTrack(ctx, c, strip, { kind: 'line', every: 2, unit: 's', origin: null });
    const pins = [[4, T1], [10, T3]];
    for (const [s, at] of pins) {
      const k = clamp01((this.age - at) / 0.35);
      if (k > 0) this.pin(ctx, c, strip.toPx(s), STRIP_Y, outBack(k));
      // While the watch holds, a ring spreads from the reading (the frame keeps moving through the hold).
      const h = (this.age - at) / HOLD;
      if (h > 0 && h < 1) {
        ctx.save(); ctx.strokeStyle = alpha(c.s4, 0.7 * (1 - h)); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(strip.toPx(s), STRIP_Y - 22, 12 + 26 * h, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }
    // The watch's marker on the strip (a small notch that slides with the watch).
    if (this.age < T1 || (this.age > T2 && this.age < T3)) this.nowMark(ctx, c, strip.toPx(t), STRIP_Y);
    // The interval: a bracket from 4 s to 10 s, then its words.
    const b = clamp01((this.age - T4) / 0.5);
    if (b > 0) {
      ctx.save(); ctx.globalAlpha = b;
      drawStrobe(ctx, c, strip, { at: [4, 4 + 6 * outBack(b)], gaps: true, gapLabels: [b > 0.8 ? '6 s' : ''], bracketY: BRACKET_Y, tone: 5 });
      this.say(ctx, c, 'time interval', strip.toPx(10) + 18, BRACKET_Y - 2, { col: c.s5ink ?? c.label, size: 28, align: 'left' });
      ctx.restore();
    }

    // The watch.
    drawStopwatch(ctx, c, { x: 452, y: 100, r: 54, seconds: t, dialSeconds: 20, text: Math.round(t) + ' s', readout: 'below' });

    // Her, then the instant tags at B and A.
    this.drawAthlete(ctx, c, m, { facing: 1, dist: m, moving });
    const p1 = clamp01((this.age - T1) / 0.35), p2 = clamp01((this.age - T3) / 0.35);
    if (p1 > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, p1 * 2);
      this.say(ctx, c, 'instant', spec.toPx(40), WORD_Y, { col: c.s4ink ?? c.label, size: 28 });
      tagAt(ctx, c, 't = 4 s', spec.toPx(40), TAG_Y + 8 * (1 - outBack(p1)), c.s4);
      ctx.restore();
    }
    if (p2 > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, p2 * 2);
      tagAt(ctx, c, 't = 10 s', spec.toPx(100), TAG_Y + 8 * (1 - outBack(p2)), c.s4);
      ctx.restore();
    }
  }

  /** A reading pinned on the time strip: a round head on a short stem above the line. */
  pin(ctx, c, x, y, k) {
    const col = c.s4, r = 10 * k;
    ctx.save();
    ctx.strokeStyle = darken(col, 0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 22 * k); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - 22 * k, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = alpha(lighten(col, 0.5), 0.8); ctx.beginPath(); ctx.arc(x - r * 0.3, y - 22 * k - r * 0.3, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 22 * k, r, 0, Math.PI * 2); ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  /** The watch's place on the strip: a small down-pointing notch on the line. */
  nowMark(ctx, c, x, y) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x - 9, y - 16); ctx.lineTo(x + 9, y - 16); ctx.closePath();
    ctx.fillStyle = c.annot; ctx.fill(); ctx.strokeStyle = darken(c.annot, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
}
