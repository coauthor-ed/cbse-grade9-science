/**
 * SignedLineScene - slide "Plus and minus" (blk-l01-s6, 2 beats; Fig 4.3).
 * b0: a straight line from -40 m to +100 m with O; the right side tints in with a big
 *     plus, the left side with a big minus; the arrowheads at both ends are the two ways.
 * b1: point A drops in at +80 m, then point P at -20 m; each gets a tag with its signed
 *     position and a bracket from O with the plain distance (80 m, 20 m): the number is
 *     the distance, the sign is the direction.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, rr, darken, lighten, alpha, font, outBack } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawStrobe } from 'simulations/base/kit/SimTrack.js';

const LINE_Y = 360, TINT_TOP = 140, BR_Y = 215;

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

/** A chunky plus or minus sign built from bars: light top, shaded lower half, dark rim. */
function signGlyph(ctx, c, x, y, plus, col, s = 1) {
  const L = 84 * s, T = 22 * s;
  const bar = (bx, by, bw, bh) => {
    rr(ctx, bx, by, bw, bh, T * 0.4); ctx.fillStyle = col; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = darken(col, 0.18); ctx.fillRect(bx, by + bh * 0.58, bw, bh);
    ctx.fillStyle = alpha(lighten(col, 0.55), 0.6); ctx.fillRect(bx + 3, by + 3, bw - 6, 3); ctx.restore();
    rr(ctx, bx, by, bw, bh, T * 0.4); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 3; ctx.stroke();
  };
  ctx.save();
  if (plus) { bar(x - T / 2, y - L / 2, T, L); }
  bar(x - L / 2, y - T / 2, L, T);
  if (plus) {                                                       // repaint the crossing so it reads as one piece
    rr(ctx, x - T / 2 + 1.5, y - T / 2 + 1.5, T - 3, T - 3, 2); ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = darken(col, 0.18); ctx.fillRect(x - T / 2 + 1.5, y - T / 2 + T * 0.58, T - 3, T * 0.42 - 1.5);
  }
  ctx.restore();
}

export class SignedLineScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A straight line from minus 40 m to plus 100 m with the origin O. Right of O is positive, shown with a plus; left of O is negative, shown with a minus. Point A is at plus 80 m, 80 m to the right of O; point P is at minus 20 m, 20 m to the left of O.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.age < (this.cur === 0 ? 1.6 : 2.4); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const spec = trackSpec({ from: -40, to: 100, x0: 60, x1: 620, y: LINE_Y });
    const ox = spec.toPx(0), b0 = this.cur === 0;
    // Sides: tints sweep out from O (b0), faint in b1.
    const sw = b0 ? clamp01((this.age - 0.2) / 0.6) : 1, tk = b0 ? 0.16 : 0.08;
    ctx.save();
    ctx.globalAlpha = tk; ctx.fillStyle = c.s1; rr(ctx, ox, TINT_TOP, (spec.x1 + 30 - ox) * sw, LINE_Y - TINT_TOP, 12); ctx.fill();
    ctx.fillStyle = c.s5; rr(ctx, ox - (ox - spec.x0 + 30) * sw, TINT_TOP, (ox - spec.x0 + 30) * sw, LINE_Y - TINT_TOP, 12); ctx.fill();
    ctx.restore();
    drawTrack(ctx, c, spec, { kind: 'line', every: 10, signs: true });
    if (b0) {
      const p = clamp01((this.age - 0.7) / 0.5), s = outBack(p);
      if (p > 0) {
        ctx.save(); ctx.globalAlpha = Math.min(1, p * 2);
        signGlyph(ctx, c, (ox + spec.x1) / 2, (TINT_TOP + LINE_Y) / 2, true, c.s1, s);
        signGlyph(ctx, c, (ox + spec.x0) / 2 - 8, (TINT_TOP + LINE_Y) / 2, false, c.s5, s * 0.9);
        ctx.restore();
      }
      return;
    }
    // b1: A at +80 m, then P at -20 m.
    const pts = [{ m: 80, text: 'A: +80 m', dist: '80 m', col: c.s1, t0: 0.3 }, { m: -20, text: 'P: -20 m', dist: '20 m', col: c.s5, t0: 1.2 }];
    for (const q of pts) {
      const k = clamp01((this.age - q.t0) / 0.5);
      if (k <= 0) continue;
      const x = spec.toPx(q.m), drop = (1 - outBack(k)) * -60;
      ctx.save(); ctx.globalAlpha = Math.min(1, k * 2);
      ctx.strokeStyle = darken(q.col, 0.2); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, LINE_Y + drop); ctx.lineTo(x, LINE_Y - 50 + drop); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, LINE_Y + drop, 10, 0, Math.PI * 2); ctx.fillStyle = q.col; ctx.fill();
      ctx.strokeStyle = darken(q.col, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
      tagAt(ctx, c, q.text, x, LINE_Y - 70 + drop, q.col);
      const bk = clamp01((this.age - q.t0 - 0.4) / 0.4);
      if (bk > 0) {
        ctx.globalAlpha = bk;
        const a = Math.min(0, q.m), b = Math.max(0, q.m);
        drawStrobe(ctx, c, spec, { at: [a, b], gaps: true, gapLabels: [q.dist], bracketY: BR_Y, tone: q.m > 0 ? 's1ink' : 's5ink' });
        ctx.strokeStyle = alpha(c.label, 0.4); ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.moveTo(ox, BR_Y + 14); ctx.lineTo(ox, LINE_Y - 12); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
    }
  }
}
