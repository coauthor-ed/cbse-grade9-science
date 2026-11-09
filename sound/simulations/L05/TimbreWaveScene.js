// TimbreWaveScene.js - slide "Tone and Note" (blk-l05-a01, 3 beats). Rebuilt 2026-11-03 (whole file; the
// old six-beat picker panel is gone, its timbre beats live in TimbreWaveScene-timbre.js).
// Book Fig 10.25: (a) a tuning fork beside a smooth repeating curve, (b) a child singing beside a jagged one.
// Every curve is computed in TimbreArt.js: a sum of sines (fundamental + overtones at 2x, 3x, ...),
// plotted as density against time on the kit green paper.
// b0 a struck tuning fork sends sound arcs into a graph that draws a pure sine; tag "tone"; one bracket
//    per repeat, so "repeats" is measured, not claimed.
// b1 a child sings; the graph draws the jagged sum; the fundamental alone is a faint dashed sine under it
//    (a key names it); the same repeat brackets show the jagged curve still repeats; tag "note".
// b2 the same note at 200 Hz and at 400 Hz on two graphs of the same width: dashed guides at each 200 Hz
//    repeat hold exactly two 400 Hz repeats; "octave" joins the two frequency tags.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawTuningFork } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { plotSound, overlayCurve, repeatBrackets, repeatGuides, keyLine, fundamental } from './TimbreArt.js';

const GX = 240, GY = 104, GW = 400, GH = 312;        // b0 and b1 graph: 59 per cent of the width, the subject
const RANGE = [-0.62, 1.88];                            // room in the paper's bottom band for the repeat brackets
const CYC = { tone: 4, note: 3 };
const REST = 3.4;                                      // seconds until the beat is at rest
const ramp = (a, t0, dur) => Math.max(0, Math.min(1, (a - t0) / dur));

export class TimbreWaveScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A struck tuning fork sends sound to a graph of density against time: a smooth curve that '
    + 'repeats, tagged tone, with a bracket under each repeat. Then a child sings: the curve is jagged, with the '
    + 'fundamental drawn as a faint dashed smooth curve under it, and the same brackets show it still repeats; '
    + 'it is tagged note. Then the note at 200 Hz and at 400 Hz on two graphs of the same width: each 200 Hz '
    + 'repeat holds exactly two 400 Hz repeats, and the two are an octave apart.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.t() < REST; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    if (this.stage >= 2) this.octave(ctx, c);
    else this.one(ctx, c, this.stage === 1);
  }

  one(ctx, c, note) {
    const a = this.t(), tt = Math.min(a, REST), kind = note ? 'voice' : 'tone', cycles = note ? CYC.note : CYC.tone;
    const fade = Math.max(0.35, Math.exp(-tt / 2.6));   // the sound dies down a little, never to nothing
    let src;
    if (note) {
      const kid = figureFor(this, { role: 'child', x: 112, y: 470, height: 250, facing: 1, i: 2, mood: 'happy', autoReach: false });
      const sk = drawFigure(ctx, c, kid, kid.look);
      const h = sk.anchors.head;
      src = { x: h.x + h.r * 0.98, y: h.y + h.r * 0.42 };
      pill(ctx, c, 'note', 112, h.y - h.r - 44, { bg: c.s5, size: 28, display: true });
    } else {
      const f = drawTuningFork(ctx, c, { x: 112, y: 470, h: 250, vib: fade, t: tt });
      src = { x: f.tips[1].x + 6, y: f.tips[1].y + 40 };
      pill(ctx, c, 'tone', 112, f.tips[1].y - 50, { bg: c.s5, size: 28, display: true });
    }
    drawSoundArcs(ctx, c, { x: src.x, y: src.y, dir: 0.12, spread: 0.8, n: 3, wavelength: 24, r0: 14, t: tt, strength: fade });
    const g = plotSound(ctx, c, { x: GX, y: GY, w: GW, h: GH, kind, cycles, range: RANGE, progress: ramp(a, 0.3, 1.6),
      axes: { y: 'density', x: 'time' } });
    if (note) {
      overlayCurve(ctx, c, g, { x: GX, w: GW, fn: (u) => fundamental('voice', u), col: c.s5, dash: [10, 7], width: 3.5,
        alpha: 0.85 * ramp(a, 1.9, 0.5) });
      if (a > 1.9) keyLine(ctx, c, { x: GX + 170, y: GY - 24, col: c.s5, dash: [10, 7], word: 'fundamental' });
    }
    repeatBrackets(ctx, c, { x: GX, w: GW, period: g.period, by: GY + GH - 70, label: 'one repeat', labelAt: 1,
      u: ramp(a, 2.0, 0.8) });
    this.probeOut = { kind, period: Math.round(g.period), cycles };
  }

  octave(ctx, c) {
    const a = this.t(), x = 200, w = 440, h = 160, top = 70, bot = 300;
    const g1 = plotSound(ctx, c, { x, y: top, w, h, kind: 'voice', cycles: 2, progress: ramp(a, 0.2, 1.1) });
    const g2 = plotSound(ctx, c, { x, y: bot, w, h, kind: 'voice', cycles: 4, progress: ramp(a, 1.1, 1.1), axes: { x: 'time' } });
    repeatGuides(ctx, c, { x, w, period: g1.period, y0: top - 6, y1: bot + h + 6, k: ramp(a, 2.3, 0.5) });
    const ly1 = top + h / 2, ly2 = bot + h / 2;
    pill(ctx, c, '200 Hz', 100, ly1, { bg: c.raised, size: 28, display: true });
    if (a > 1.1) pill(ctx, c, '400 Hz', 100, ly2, { bg: c.raised, size: 28, display: true });
    const k = ramp(a, 2.6, 0.5);
    if (k > 0) {
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const y0 = ly1 + 30, y1 = ly2 - 30;
      ctx.beginPath(); ctx.moveTo(100, y0 + 4); ctx.lineTo(100, y1 - 4); ctx.stroke();
      for (const [y, s] of [[y0, -1], [y1, 1]]) { ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(93, y - s * 11); ctx.lineTo(107, y - s * 11); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      pill(ctx, c, 'octave', 100, (ly1 + ly2) / 2, { bg: c.s5, size: 28, display: true, alpha: k });
    }
    this.probeOut = { p200: Math.round(g1.period), p400: Math.round(g2.period), ratio: +(g1.period / g2.period).toFixed(3) };
  }
}
