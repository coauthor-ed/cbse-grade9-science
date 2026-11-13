/**
 * PositionScene - slide "Choose a reference point" (blk-l01-s5, 2 beats; Fig 4.2-4.3).
 * b0: the athlete stands at her start on a long straight track (no metre marks). A
 *     flag rises at her start, marked "O", with the tag "reference point".
 * b1: a number line 0 to 100 m appears under the track (ticks every 10 m, O at 0);
 *     the athlete runs to 60 m (legs cycle with the metres run) and stops. A dashed
 *     position arrow from O to her on the line reads "60 m"; her tag reads "60 m from O".
 * Right of O is positive. The run plays once in about 2.4 s, then rests on the point.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, rr, darken, lighten, alpha, font, outBack } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawFigure, figureLook, walkPhase } from 'simulations/base/kit/SimFigure.js';
import { LOOKS, drawRunTrack } from '../shared/MotionCast.js';

const TRACK_Y = 300, LINE_Y = 458, ARROW_Y = 414, H = 150;
const LOOK = { ...LOOKS.athlete, hairStyle: 'bun' };       // she (the preset's short crop reads as a boy)
const GO = 0.5, RUN = 2.4, END = 60;

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

/** The reference flag: a pole standing at x on ground y, a pennant marked O; k 0..1 raises it. */
function drawFlagO(ctx, c, x, y, k = 1, poleH = 200) {
  const ph = poleH * clamp01(k), top = y - ph, col = c.s5;
  ctx.save();
  ctx.fillStyle = alpha(darken(c.bgDeep, 0.5), 0.25); ctx.beginPath(); ctx.ellipse(x, y + 2, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
  rr(ctx, x - 4, top, 8, ph, 3); ctx.fillStyle = lighten(c.label, 0.35); ctx.fill();
  ctx.fillStyle = darken(c.label, 0.1); ctx.fillRect(x + 1, top + 4, 3, Math.max(0, ph - 8));
  ctx.strokeStyle = darken(c.label, 0.3); ctx.lineWidth = 2; rr(ctx, x - 4, top, 8, ph, 3); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, top, 7, 0, Math.PI * 2); ctx.fillStyle = c.gold; ctx.fill(); ctx.strokeStyle = darken(c.gold, 0.4); ctx.stroke();
  const u = clamp01((k - 0.6) / 0.4), fw = 74 * u, fh = 56;
  if (fw > 2) {
    const py = top + 8;
    ctx.beginPath(); ctx.moveTo(x + 3, py); ctx.quadraticCurveTo(x + fw * 0.5, py - 8, x + fw, py + 4);
    ctx.lineTo(x + fw - 4, py + fh - 4); ctx.quadraticCurveTo(x + fw * 0.5, py + fh - 12, x + 3, py + fh); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = darken(col, 0.18); ctx.fillRect(x, py + fh * 0.62, fw + 4, fh);
    ctx.fillStyle = alpha(lighten(col, 0.5), 0.6); ctx.fillRect(x, py + 2, fw, 3); ctx.restore();
    ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    if (u > 0.8) { ctx.font = font(c, 900, 36, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.bgSurface; ctx.fillText('O', x + fw * 0.48, py + fh * 0.5 - 2); }
  }
  ctx.restore();
  return { top, pennant: { x0: x, y0: top + 8, w: 74, h: fh } };
}

export class PositionScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'An athlete at her start on a straight track; a flag marked O at the start is the reference point. Then a number line from 0 to 100 m appears under the track, she runs to 60 m and stops, and a dashed arrow from O shows her position: 60 m from O, to the right.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.age < (this.cur === 0 ? 1.6 : GO + RUN + 1.0); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const spec = trackSpec({ from: 0, to: 100, x0: 60, x1: 630, y: TRACK_Y });
    drawRunTrack(ctx, c, spec, { ticks: false });
    const ox = spec.toPx(0);
    if (this.cur === 0) {
      const k = clamp01((this.age - 0.2) / 0.7);
      const flag = drawFlagO(ctx, c, ox - 6, TRACK_Y - 25, k);
      this.stander(ctx, c, ox + 18);
      const p = clamp01((this.age - 1.0) / 0.4);
      if (p > 0) {
        ctx.save(); ctx.globalAlpha = p;
        const tb = tagAt(ctx, c, 'reference point', ox + 210, flag.pennant.y0 + 28, c.s5);
        ctx.strokeStyle = c.s5; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tb.x0, flag.pennant.y0 + 28); ctx.lineTo(ox + 74, flag.pennant.y0 + 28); ctx.stroke();
        ctx.restore();
      }
      return;
    }
    // b1: the number line under the track, the run to 60 m, the position arrow and tag.
    const line = trackSpec({ from: 0, to: 100, x0: 60, x1: 630, y: LINE_Y });
    const lk = clamp01(this.age / 0.4);
    ctx.save(); ctx.globalAlpha = lk; drawTrack(ctx, c, line, { kind: 'line', every: 10 }); ctx.restore();
    drawFlagO(ctx, c, ox - 6, TRACK_Y - 25, 1);
    const u = clamp01((this.age - GO) / RUN), e = 1 - (1 - u) * (1 - u);   // eases to a stop
    const m = END * e;
    if (u < 1) {
      drawFigure(ctx, c, { x: spec.toPx(m) + 18, y: TRACK_Y, height: H, build: 'teen', facing: 1, pose: { name: 'run', phase: walkPhase(m * spec.scale, H, 'run') } }, figureLook(c, LOOK));
    } else this.stander(ctx, c, spec.toPx(END) + 18);
    // Her position on the line: a guide down from her feet to 60 m.
    const px = line.toPx(m), done = clamp01((this.age - GO - RUN - 0.05) / 0.5);
    ctx.save(); ctx.strokeStyle = alpha(c.label, 0.45); ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(spec.toPx(m), TRACK_Y + 32); ctx.lineTo(px, LINE_Y - 10); ctx.stroke(); ctx.restore();
    ctx.beginPath(); ctx.arc(px, LINE_Y, 9, 0, Math.PI * 2); ctx.fillStyle = c.s4; ctx.fill(); ctx.strokeStyle = darken(c.s4, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    if (done > 0) {
      drawMotionArrow(ctx, c, 's', line.toPx(0), ARROW_Y, { length: (line.toPx(END) - line.toPx(0)) * done, label: done > 0.9 ? '60 m' : '', side: 1 });
      ctx.save(); ctx.globalAlpha = clamp01(done * 2);
      tagAt(ctx, c, '60 m from O', spec.toPx(END) + 18, TRACK_Y - H - 34 + 10 * (1 - outBack(done)), c.s4);
      ctx.restore();
    }
  }

  stander(ctx, c, x) {
    return drawFigure(ctx, c, { x, y: TRACK_Y, height: H, build: 'teen', facing: 1, pose: 'stand' }, figureLook(c, LOOK));
  }
}
