// WaveMotionScene.js - slide "Longitudinal and Mechanical" (blk-l03-s06, 2 beats). Rebuilt 2026-11-03.
// Book Fig 10.12: a SimWave strip of air dots carrying a longitudinal wave, s(d, t) = f(t - d / v).
// b0 the red particle's own short double arrow ("particle vibration") lies along the same line as
// the long "direction of propagation" arrow: parallel, by construction (both at angle 0).
// b1 the strip runs into an empty dashed box, a vacuum: the field simply has no particles there,
// so the wave stops at its edge while the last particles before it still vibrate.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, alpha } from 'simulations/base/kit/SimLook.js';
import { sineSource, waveField, drawParticleStrip, drawPropagationArrow, drawVibrationArrow } from 'simulations/base/kit/SimWave.js';
import { drawTuningFork } from 'simulations/base/kit/SimApparatus.js';

const AMP = 20;                         // about 0.085 x wavelength: R readable without its tag
const STRIP = { x: 100, y: 188, h: 156 };
const FORK = { x: 50, y: 492, h: 296 };   // its right prong sits at the tube's open left end, prongs level with the air
const FIELD = waveField({ v: 120, origin: STRIP.x, source: sineSource({ amp: AMP, freq: 0.5 }) });   // wavelength 240 px
const T_FILL = 30;
const MARK = 300;                       // the red particle (b0), mean distance from the left end
const VAC = { x: 450, w: 200 };         // b1: the empty region, right third
const MARK1 = 200;

export class WaveMotionScene extends SimScene {
  static CONTINUOUS = true; // the wave keeps travelling while the beat is on screen
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A vibrating tuning fork at the left end of a tube of air particles sends a sound wave from left to right. A red particle moves back and forth '
    + 'along a red double arrow, labelled particle vibration from above, which lies parallel to the long arrow labelled direction '
    + 'of propagation. Then the strip runs into an empty dashed box labelled vacuum: the wave reaches its edge and stops, '
    + 'and nothing moves inside.';

  constructor(container, config) {
    super(container, config);
    this.waveProbe = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const t = this.t() + T_FILL;
    // The source: a tuning fork vibrating at the wave's own frequency (slow enough to follow), right prong at the air.
    drawTuningFork(ctx, c, { ...FORK, vib: 1, t, freq: 0.5 });
    if (this.stage >= 1) this.vacuum(ctx, c, t);
    else this.longitudinal(ctx, c, t);
  }

  longitudinal(ctx, c, t) {
    const s = drawParticleStrip(ctx, c, { ...STRIP, w: 548, field: FIELD, t, tube: true, spacing: 14, r: 4.4,
      densityShade: true, mark: MARK });
    const mean = STRIP.x + MARK, my = STRIP.y + STRIP.h / 2;
    // The red particle's own back-and-forth: a double arrow on its mean place, along the travel line.
    drawVibrationArrow(ctx, c, { x: mean, y: my, len: 74 });
    pill(ctx, c, 'particle vibration', mean, STRIP.y - 40, { bg: c.s6, size: 28, display: true });
    drawPropagationArrow(ctx, c, { x: STRIP.x + 20, y: STRIP.y + STRIP.h + 40, len: 500, label: 'direction of propagation', side: 'below' });
    this.waveProbe = { t, marked: s.marked && { x: +s.marked.x.toFixed(1), mean: s.marked.mean, amp: s.marked.amp } };
  }

  vacuum(ctx, c, t) {
    const y0 = STRIP.y - 14, h = STRIP.h + 28, end = VAC.x - AMP - 12;
    // The empty region: a faint wash and a dashed edge; no particles, so nothing in it moves.
    ctx.save();
    ctx.fillStyle = alpha(c.bgDeep, 0.07); ctx.fillRect(VAC.x, y0, VAC.w, h);
    ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
    ctx.strokeRect(VAC.x, y0, VAC.w, h);
    ctx.restore();
    // The air ends AMP + 12 px before the box: the last particles still vibrate (clip off, none cut), none enter it.
    const s = drawParticleStrip(ctx, c, { ...STRIP, w: end - STRIP.x, field: FIELD, t, tube: true, spacing: 14, r: 4.4,
      densityShade: true, mark: MARK1, clip: false });
    pill(ctx, c, 'vacuum', VAC.x + VAC.w / 2, y0 + h / 2, { bg: c.raised, size: 28, display: true });
    drawPropagationArrow(ctx, c, { x: STRIP.x + 20, y: STRIP.y + STRIP.h + 40, len: VAC.x - 44 - STRIP.x });
    this.waveProbe = { t, marked: s.marked && { x: +s.marked.x.toFixed(1), mean: s.marked.mean } };
  }
}
