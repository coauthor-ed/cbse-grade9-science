/**
 * WhichSideScene - predict blk-l01-s7 (setup) and explain blk-l01-s8 (1 beat).
 * Setup (hostRole 'setup' or beat MAX_SAFE_INTEGER): the track from -40 m to +100 m with
 *   O; the athlete stands 30 m left of O; a bracket from O to her reads "30 m" with no
 *   sign. Nothing on screen writes her position.
 * Explain b0: her tag "-30 m" pops in; a dimmed copy of her appears at +30 m, tagged
 *   "+30 m"; a bracket between the two reads "60 m". Same distance, other side, 60 m apart.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, rr, darken, alpha, font, outBack, vectorArrow } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { LOOKS, drawRunTrack } from '../shared/MotionCast.js';

const TRACK_Y = 370, H = 150, TAG_Y = TRACK_Y - H - 34, BR_Y = TAG_Y - 62;
const LOOK = { ...LOOKS.athlete, hairStyle: 'bun' };       // she (the preset's short crop reads as a boy)

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

export class WhichSideScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  // The predict setup mount sends beat and count Number.MAX_SAFE_INTEGER: map it to stage 1 (setup).
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: 1, dwellMs: null }]] };
  static ARIA_LABEL = 'A straight track with O and metre marks from minus 40 m to plus 100 m. The athlete stands 30 m to the left of O. In the explanation her position is written minus 30 m, a faded copy of her at plus 30 m is the other side, and the two places are 60 m apart.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === 1 || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.age < (this.isSetup() ? 1.0 : 2.2); }

  athlete(ctx, c, x) {
    return drawFigure(ctx, c, { x, y: TRACK_Y, height: H, build: 'teen', facing: 1, pose: 'stand' }, figureLook(c, LOOK));
  }

  // Setup ruler: ticks on both sides, labels only at O and right of it (20..100 m) and the
  // "+" cue; the left side stays unlabelled so nothing on screen answers the prompt.
  setupRuler(ctx, c, spec) {
    const r = drawRunTrack(ctx, c, spec, { ticks: false });
    const tickY = r.bottom + 10, labelY = tickY + 12 + 26 * 0.6;
    ctx.save();
    ctx.strokeStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.font = font(c, 800, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const say = (t, x, y, col) => { ctx.lineWidth = 6; ctx.strokeStyle = c.bgSurface; ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y); };
    for (let m = -40; m <= 100; m += 10) {
      const x = spec.toPx(m), major = m >= 0 && m % 20 === 0;
      ctx.strokeStyle = c.label; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, tickY); ctx.lineTo(x, tickY + (major ? 12 : 7)); ctx.stroke();
      if (major) say(m === 0 ? 'O' : m === 100 ? '100 m' : String(m), x, labelY, m === 0 ? c.annot : c.label);
    }
    const ox = spec.toPx(0), ay = labelY + 26 * 1.15;
    vectorArrow(ctx, c, ox + 30, ay, { length: 160, col: c.s1ink, width: 4, head: 13 });
    say('+', ox + 16, ay, c.s1ink);
    ctx.restore();
  }

  drops(ctx, c, xs, y1) {
    ctx.save(); ctx.strokeStyle = alpha(c.label, 0.4); ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    for (const x of xs) { ctx.beginPath(); ctx.moveTo(x, BR_Y + 14); ctx.lineTo(x, y1); ctx.stroke(); }
    ctx.restore();
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const spec = trackSpec({ from: -40, to: 100, x0: 60, x1: 620, y: TRACK_Y });
    if (this.isSetup()) this.setupRuler(ctx, c, spec);
    else drawRunTrack(ctx, c, spec, { every: 10, signs: true });
    const ox = spec.toPx(0), her = spec.toPx(-30), twin = spec.toPx(30);
    // O on the track: a mark across the lanes.
    ctx.save(); ctx.fillStyle = c.annot; rr(ctx, ox - 3, TRACK_Y - 25, 6, 50, 3); ctx.fill(); ctx.restore();
    if (this.isSetup()) {
      this.athlete(ctx, c, her);
      const k = clamp01((this.age - 0.3) / 0.5);
      ctx.save(); ctx.globalAlpha = k;
      this.drops(ctx, c, [ox], TRACK_Y - 28);
      drawStrobe(ctx, c, spec, { at: [-30, 0], gaps: true, gapLabels: ['30 m'], bracketY: BR_Y, tone: 'label' });
      ctx.restore();
      return;
    }
    // Explain: the sign, the other side, the 60 m between.
    const g = clamp01((this.age - 0.8) / 0.5);
    if (g > 0) {
      ctx.save(); ctx.globalAlpha = 0.3 * g; this.athlete(ctx, c, twin); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.6 * g; tagAt(ctx, c, '+30 m', twin, TAG_Y, c.s1); ctx.restore();
    }
    this.athlete(ctx, c, her);
    const p = clamp01((this.age - 0.2) / 0.4);
    if (p > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, p * 2); tagAt(ctx, c, '-30 m', her, TAG_Y + 10 * (1 - outBack(p)), c.s5); ctx.restore(); }
    const b = clamp01((this.age - 1.4) / 0.5);
    if (b > 0) {
      ctx.save(); ctx.globalAlpha = b;
      drawStrobe(ctx, c, spec, { at: [-30, 30], gaps: true, gapLabels: ['60 m'], bracketY: BR_Y, tone: 'label' });
      ctx.restore();
    }
  }
}
