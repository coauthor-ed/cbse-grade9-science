// SpeedFormulaScene.js - slide "The Speed of Sound" (blk-l04-s06, 2 beats). New 2026-11-03.
// ONE model: a SimWave field s(d, t) = f(t - d / v). The strip places the dots by that field and the green
// graph plots the same field's density at each particle's mean place (the DensityGraphScene pattern).
// b0 one crest is marked (red point on the curve, its C above the strip). Its x is FOUND each frame as the
// density maximum of the field near where it should be, so the marker rides the real crest. A stopwatch
// runs while the wave moves for exactly one period T; in that time the crest moves exactly one wavelength,
// the length of the ruler under the graph. Then it holds; it plays once and rests on the stopped watch.
// b1 the same picture at rest, small, at the top; the two formula lines large under it.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, font, alpha, lighten, darken, mix, rr } from 'simulations/base/kit/SimLook.js';
import { sineSource, waveField, drawParticleStrip, drawDensityGraph } from 'simulations/base/kit/SimWave.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';

const LAM = 180, V = 90, FREQ = V / LAM, PERIOD = 1 / FREQ;   // T = 2 s on screen, 0.5 Hz
const X0 = 60, WIDTH = 570;
const ORIGIN = X0 - 3 * LAM;                     // the source is off to the left: the strip is all inside the wave
const FIELD = waveField({ v: V, origin: ORIGIN, source: sineSource({ wavelength: LAM, freq: FREQ }) });
const GRAPH_FIELD = { origin: FIELD.origin, dir: 1, xAt: (d) => FIELD.origin + d, rhoLin: FIELD.rhoLin, rhoRangeLin: FIELD.rhoRangeLin };
const CX0 = 150;                                 // the marked crest starts here and ends at CX0 + LAM
const T0 = (CX0 - ORIGIN) / V + 12 * PERIOD;     // crests sit where t - d / v is a whole number of periods
const PRE = 0.7, HOLD = 1.6, CYCLE = PRE + PERIOD + HOLD, PLAYS = 1;   // plays once, then rests on the stopped watch
const SERIF_V = (px) => `italic 700 ${px}px "DejaVu Serif", "Noto Serif", Georgia, "Times New Roman", serif`;
const RANGE = [0.15, 1.85];
const LAM_S = '\u03bb', NU_S = '\u03bd';

const ramp = (a, t0, dur) => Math.max(0, Math.min(1, (a - t0) / dur));

/** The density crest nearest xGuess, found in the field itself (1 px scan over half a wavelength each side). */
function crestNear(xGuess, t) {
  let best = xGuess, top = -Infinity;
  for (let x = xGuess - LAM / 2; x <= xGuess + LAM / 2; x += 1) {
    const r = FIELD.rhoLin(x - ORIGIN, t);
    if (r > top) { top = r; best = x; }
  }
  return best;
}

export class SpeedFormulaScene extends SimScene {
  static HEIGHT = 580;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A strip of air particles over a green graph of density against distance, the wave moving right. '
    + 'One crest is marked in red with its compression C above it. A stopwatch runs while the marked crest moves '
    + 'forward; when the watch reaches one time period T the crest has moved exactly one wavelength, the length of '
    + 'a ruler marked lambda under the graph. Then the picture rests small at the top and two large lines read: '
    + 'v equals lambda divided by T, and v equals lambda times nu.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.stage === 0 ? this.t() < PLAYS * CYCLE + 0.1 : this.t() < 1.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    if (this.stage >= 1) this.formula(ctx, c);
    else this.run(ctx, c);
  }

  run(ctx, c) {
    const a = this.t();
    const done = a >= PLAYS * CYCLE;
    const u = done ? PRE + PERIOD : a % CYCLE;
    const el = Math.max(0, Math.min(PERIOD, u - PRE));       // stopwatch time = time the wave has moved
    const ft = T0 + el;
    const strip = { x: X0, y: 66, w: WIDTH, h: 76 };
    const graph = { x: X0, y: 196, w: WIDTH, h: 150 };
    this.capped(ctx, () => drawParticleStrip(ctx, c, { ...strip, field: FIELD, t: ft, spacing: 12, r: 4.2, densityShade: true }));
    const g = drawDensityGraph(ctx, c, { ...graph, field: GRAPH_FIELD, t: ft, linear: true, range: RANGE, axes: {} });
    this.axisWords(ctx, c, graph, 'density', 'distance');
    const cx = crestNear(CX0 + V * el, ft);
    const cy = g.yOf(FIELD.rhoLin(cx - ORIGIN, ft));
    const rulerY = 420;
    // The red guide: the marked C, its crest, its place on the ruler, all on one moving vertical.
    ctx.save(); ctx.strokeStyle = alpha(c.s6, 0.55); ctx.lineWidth = 2.5; ctx.setLineDash([5, 6]);
    ctx.beginPath(); ctx.moveTo(cx, strip.y + strip.h + 10); ctx.lineTo(cx, cy - 12);
    ctx.moveTo(cx, cy + 12); ctx.lineTo(cx, rulerY - 16); ctx.stroke(); ctx.restore();
    this.ruler(ctx, c, CX0, CX0 + LAM, rulerY);
    this.pointer(ctx, c, CX0, rulerY - 4, true);
    this.pointer(ctx, c, cx, rulerY - 4);
    this.marker(ctx, c, cx, cy);
    pill(ctx, c, 'C', cx, strip.y - 26, { bg: c.s5, size: 30, display: true });
    const stopped = el >= PERIOD - 1e-6;
    // The reading sits UNDER the watch, clear of the dial and hand.
    drawStopwatch(ctx, c, { x: 476, y: 452, r: 56, seconds: el, dialSeconds: PERIOD, readout: 'below', size: 30,
      text: el.toFixed(1) + ' s' });
    if (stopped) pill(ctx, c, 'T', 580, 452, { bg: c.s2, size: 32, display: true });
    this.probeOut = { el: +el.toFixed(3), crestX: cx, moved: Math.round(cx - CX0), lam: LAM,
      graphCrests: g.crests.map((p) => Math.round(p.x)) };
  }

  /** Draw the strip with its tube capped at the strip's ends (the field's origin is far off to the left). */
  capped(ctx, fn) {
    ctx.save(); ctx.beginPath(); ctx.rect(X0 - 8, -10, WIDTH + 16, 2000); ctx.clip();
    fn(); ctx.restore();
  }

  /** Axis words at 30 px (the kit's are 26 px: too small at 390). */
  axisWords(ctx, c, b, yWord, xWord) {
    ctx.save(); ctx.font = font(c, 700, 30, true); ctx.fillStyle = c.label; ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; ctx.fillText(yWord, b.x + 10, b.y - 22);
    ctx.textAlign = 'right'; ctx.fillText(xWord, b.x + b.w, b.y + b.h + 26);
    ctx.restore();
  }

  /** A plastic ruler exactly one wavelength long: lit top edge, shaded body, tick marks, lambda tag under it. */
  ruler(ctx, c, x1, x2, y, side = 'below') {
    const h = 26, base = c.gold;
    ctx.save();
    ctx.fillStyle = alpha(darken(base, 0.5), 0.18); rr(ctx, x1 + 3, y + 5, x2 - x1, h, 5); ctx.fill();
    const gr = ctx.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, lighten(base, 0.45)); gr.addColorStop(0.45, lighten(base, 0.15)); gr.addColorStop(1, darken(base, 0.12));
    ctx.fillStyle = gr; rr(ctx, x1, y, x2 - x1, h, 5); ctx.fill();
    ctx.strokeStyle = alpha(lighten(base, 0.8), 0.9); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1 + 5, y + 2.5); ctx.lineTo(x2 - 5, y + 2.5); ctx.stroke();
    ctx.strokeStyle = darken(base, 0.45); ctx.lineWidth = 1.6;
    for (let k = 0; k <= 20; k++) {
      const X = x1 + (k * (x2 - x1)) / 20, l = k % 10 === 0 ? 16 : k % 5 === 0 ? 11 : 6;
      ctx.beginPath(); ctx.moveTo(X, y + h); ctx.lineTo(X, y + h - l); ctx.stroke();
    }
    ctx.strokeStyle = darken(base, 0.35); ctx.lineWidth = 2; rr(ctx, x1, y, x2 - x1, h, 5); ctx.stroke();
    ctx.restore();
    if (side === 'below') pill(ctx, c, LAM_S, (x1 + x2) / 2, y + h + 26, { bg: c.raised, size: 30, display: true });
    else pill(ctx, c, LAM_S, x2 + 30, y + h / 2, { bg: c.raised, size: 30, display: true });
  }

  /** A small red pointer resting on the ruler at the marked crest's x. */
  pointer(ctx, c, x, y, hollow = false) {
    ctx.save(); ctx.fillStyle = hollow ? c.bgSurface : c.s6; ctx.strokeStyle = hollow ? alpha(c.s6, 0.7) : darken(c.s6, 0.35);
    ctx.lineWidth = hollow ? 2.2 : 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 9, y - 14); ctx.lineTo(x + 9, y - 14); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
  }

  /** The marked crest: a red point with a light rim, lit on its upper left. */
  marker(ctx, c, x, y) {
    ctx.save();
    ctx.fillStyle = c.bgSurface; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
    const gr = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 8.5);
    gr.addColorStop(0, lighten(c.s6, 0.45)); gr.addColorStop(1, darken(c.s6, 0.1));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = darken(c.s6, 0.4); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  formula(ctx, c) {
    const a = this.t(), ft = T0;
    this.capped(ctx, () => drawParticleStrip(ctx, c, { x: X0, y: 34, w: WIDTH, h: 48, field: FIELD, t: ft, spacing: 11, r: 3.6, densityShade: true }));
    const g = drawDensityGraph(ctx, c, { x: X0, y: 116, w: WIDTH, h: 120, field: GRAPH_FIELD, t: ft, linear: true,
      range: [0.1, 1.9] });
    const k = g.crests.find((p) => Math.abs(p.x - CX0) < 20);
    if (k) {
      ctx.save(); ctx.strokeStyle = alpha(c.s6, 0.55); ctx.lineWidth = 2.5; ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.moveTo(k.x, k.y + 12); ctx.lineTo(k.x, 252); ctx.moveTo(k.x + LAM, k.y + 12); ctx.lineTo(k.x + LAM, 252);
      ctx.stroke(); ctx.restore();
      this.ruler(ctx, c, k.x, k.x + LAM, 254, 'right');
      this.marker(ctx, c, k.x, k.y);
    }
    // The two lines are the subject: a raised card, big type, the second line arriving after the first.
    const card = { x: 110, y: 318, w: 460, h: 226 };
    ctx.save();
    ctx.fillStyle = alpha(darken(c.raised, 0.5), 0.25); rr(ctx, card.x + 4, card.y + 7, card.w, card.h, 22); ctx.fill();
    const gr = ctx.createLinearGradient(0, card.y, 0, card.y + card.h);
    gr.addColorStop(0, lighten(c.raised, 0.08)); gr.addColorStop(1, mix(c.raised, c.bgSurface, 0.35));
    ctx.fillStyle = gr; rr(ctx, card.x, card.y, card.w, card.h, 22); ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.7); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    // v (speed) is an italic serif v with straight arms; nu is a drawn Greek nu (hooked left stem, curled right
    // arm), so the two never read as the same letter. "nu" is named once under it.
    this.line(ctx, c, [['v', c.s6ink, 'v'], [' = ', c.label], [LAM_S, c.s5ink], [' \u00f7 ', c.label], ['T', c.s2ink]],
      card.y + 62, ramp(a, 0.2, 0.5));
    this.line(ctx, c, [['v', c.s6ink, 'v'], [' = ', c.label], [LAM_S, c.s5ink], [' \u00d7 ', c.label], [NU_S, c.s2ink, 'nu']],
      card.y + 146, ramp(a, 0.9, 0.5));
    this.probeOut = { crests: g.crests.map((p) => Math.round(p.x)) };
  }

  /** One formula line, centred on the card, in coloured runs: v red, lambda violet, T and nu amber. */
  line(ctx, c, runs, y, u) {
    if (u <= 0) return;
    const S = 60, base = font(c, 700, S, true);
    ctx.save(); ctx.globalAlpha = u; ctx.textBaseline = 'middle';
    const widthOf = ([txt, , kind]) => {
      if (kind === 'nu') return S * 0.66;
      ctx.font = kind === 'v' ? SERIF_V(S + 6) : base; return ctx.measureText(txt).width + (kind === 'v' ? 4 : 0);
    };
    const total = runs.reduce((s, r) => s + widthOf(r), 0);
    let x = 340 - total / 2;
    const dy = (1 - u) * 10;
    for (const r of runs) {
      const [txt, col, kind] = r, w = widthOf(r);
      if (kind === 'nu') {
        this.nuGlyph(ctx, x + S * 0.04, y + dy, S, col);
        ctx.font = font(c, 700, 28, true); ctx.fillStyle = c.labelMuted; ctx.textAlign = 'center';
        ctx.fillText('nu', x + S * 0.33, y + dy + S * 0.3 + 26); ctx.textAlign = 'left';
      } else {
        ctx.font = kind === 'v' ? SERIF_V(S + 6) : base; ctx.fillStyle = col; ctx.fillText(txt, x, y + dy);
      }
      x += w;
    }
    ctx.restore();
  }

  /** The Greek letter nu, drawn as a path: a left stem with a hooked top running down to a pointed foot, and a
   *  right arm that bows up from the foot and curls back at its top. About one x-height tall, centred on y. */
  nuGlyph(ctx, x, y, S, col) {
    const top = y - S * 0.27, bot = y + S * 0.27;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = S * 0.09; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, top + S * 0.08);
    ctx.quadraticCurveTo(x + S * 0.09, top - S * 0.03, x + S * 0.15, top + S * 0.07);
    ctx.lineTo(x + S * 0.29, bot);
    ctx.quadraticCurveTo(x + S * 0.52, top + S * 0.3, x + S * 0.54, top + S * 0.1);
    ctx.quadraticCurveTo(x + S * 0.55, top - S * 0.02, x + S * 0.46, top + S * 0.02);
    ctx.stroke(); ctx.restore();
  }
}
