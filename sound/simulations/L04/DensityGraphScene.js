// DensityGraphScene.js - slide "From Dots to a Graph" (blk-l04-s01, 2 beats). Rebuilt 2026-11-03 (whole file).
// Book Fig 10.16: a strip of air particles over a graph of density against distance.
// ONE model: a SimWave field s(d, t) = f(t - d / v). The strip places the dots by that field and the
// green graph plots that same field's density at the same instant, on the same x scale, so every
// crest lands under a C and every trough under an R by construction, not by drawing.
// b0 the wave runs for a moment and freezes; C and R tags sit on the computed regions; the graph waits empty
// (axes, average line, faint columns under each C and R, a pulsing pen point where the curve will start).
// b1 the curve draws itself left to right; faint dashed guides drop from each C to its crest and
// from each R to its trough; one crest and one trough are tagged.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, font, alpha } from 'simulations/base/kit/SimLook.js';
import { sineSource, waveField, drawParticleStrip, drawDensityGraph } from 'simulations/base/kit/SimWave.js';

const X0 = 126, WIDTH = 534;                      // strip and graph share x and width (80 per cent of 680)
const STRIP = { x: X0, y: 72, w: WIDTH, h: 96 };
const GRAPH = { x: X0, y: 236, w: WIDTH, h: 220 };
const LAMBDA = 182, V = 120, FREQ = V / LAMBDA;   // three C and three R in the strip
const ORIGIN = X0 - 3 * LAMBDA;                   // the source is off to the left: the strip is all inside the wave
const FIELD = waveField({ v: V, origin: ORIGIN, source: sineSource({ wavelength: LAMBDA, freq: FREQ }) });
// Crests where t - d / v = k / f: the first C 46 px into the strip (an R sits at each end, so every C is inside).
const T0 = (X0 - ORIGIN + 46) / V + 24 / FREQ;
// The graph reads the SAME field's density, plotted at each particle's mean place (the book's smooth curve).
// A C's centre is where the displacement is zero, so the crest still sits exactly under it.
const GRAPH_FIELD = { origin: FIELD.origin, dir: 1, xAt: (d) => FIELD.origin + d, rhoLin: FIELD.rhoLin, rhoRangeLin: FIELD.rhoRangeLin };
const RUN = 1.4;                                  // b0: the wave moves for 1.4 s, then freezes at T0
const DRAW = 2.0;                                 // b1: the curve draws on over 2 s
const RANGE = [0.1, 1.9];                         // headroom above crests and below troughs for the tags

export class DensityGraphScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A strip of air particles frozen at one instant, with crowded regions tagged C for compression and '
    + 'spread regions tagged R for rarefaction. Below it, a green graph of density against distance with a dashed '
    + 'average density line. Then the density curve draws itself: it is highest, a crest, under each C and lowest, '
    + 'a trough, under each R, with faint dashed guides joining each C and R to its point on the curve.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.stage === 0 ? this.t() < RUN + 0.1 : this.t() < DRAW + 0.1; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    const a = this.t();
    let t = T0;
    if (this.stage === 0 && a < RUN) { const u = a / RUN; t = T0 - RUN * 0.5 * (1 - u) * (1 - u); }
    const frozen = this.stage >= 1 || a >= RUN;
    // The tube is capped at the strip's ends (the field's origin is far off to the left).
    ctx.save(); ctx.beginPath(); ctx.rect(X0 - 8, -10, WIDTH + 16, 2000); ctx.clip();
    const s = drawParticleStrip(ctx, c, { ...STRIP, field: FIELD, t, spacing: 12, r: 4.2, densityShade: true, tags: frozen });
    ctx.restore();
    const progress = this.stage >= 1 ? Math.min(1, a / DRAW) : 0;
    const g = drawDensityGraph(ctx, c, { ...GRAPH, field: GRAPH_FIELD, t: T0, linear: true, range: RANGE, progress,
      axes: {} });
    this.axisWords(ctx, c, GRAPH, 'density', 'distance');
    this.avgWords(ctx, c, g.avgY);
    if (this.stage >= 1) this.guides(ctx, c, s, g);
    else if (frozen) this.waiting(ctx, c, s, g);
    this.probeOut = { t, regions: s.regions.map((r) => ({ kind: r.kind, x: Math.round(r.x) })),
      crests: g.crests.map((p) => Math.round(p.x)), troughs: g.troughs.map((p) => Math.round(p.x)) };
  }

  /** Axis words at 30 px (the kit's are 26 px: too small at 390). */
  axisWords(ctx, c, b, yWord, xWord) {
    ctx.save(); ctx.font = font(c, 700, 30, true); ctx.fillStyle = c.label; ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; ctx.fillText(yWord, b.x + 10, b.y - 22);
    ctx.textAlign = 'right'; ctx.fillText(xWord, b.x + b.w, b.y + b.h + 26);
    ctx.restore();
  }

  /** b0: the graph waits for its curve. Faint columns drop from each C and R through the empty graph (the
   *  curve will land in them), and a pen point at the left end of the graph, at the first particle's density,
   *  pulses where the curve will start. No curve, no crest or trough. */
  waiting(ctx, c, s, g) {
    const top = STRIP.y + STRIP.h + 8, bot = GRAPH.y + GRAPH.h;
    ctx.save(); ctx.lineWidth = 2; ctx.setLineDash([4, 8]);
    for (const r of s.regions) {
      if (r.x < X0 + 6 || r.x > X0 + WIDTH - 6) continue;
      ctx.strokeStyle = alpha(r.kind === 'C' ? c.s5 : c.s2, 0.45);
      ctx.beginPath(); ctx.moveTo(r.x, top); ctx.lineTo(r.x, bot); ctx.stroke();
    }
    ctx.setLineDash([]);
    const y0 = g.yOf(FIELD.rhoLin(X0 - ORIGIN, T0)), k = 0.5 + 0.5 * Math.sin(this.t() * 3.2);
    ctx.fillStyle = alpha(c.good, 0.22 + 0.2 * k); ctx.beginPath(); ctx.arc(X0, y0, 10 + 2 * k, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.bgSurface; ctx.beginPath(); ctx.arc(X0, y0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.good; ctx.beginPath(); ctx.arc(X0, y0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /** "average density" as two lines of text at the left end of the dashed line, as the book prints it. */
  avgWords(ctx, c, y) {
    ctx.save();
    ctx.font = font(c, 700, 28, true); ctx.fillStyle = c.label; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('average', X0 - 12, y - 15); ctx.fillText('density', X0 - 12, y + 15);
    ctx.restore();
  }

  /** Each C drops a faint dashed guide to the crest below it, each R to its trough, as the curve reaches it. */
  guides(ctx, c, s, g) {
    const top = STRIP.y + STRIP.h + 6;
    const near = (list, x) => list.find((p) => Math.abs(p.x - x) < 14);
    const crestT = g.crests[1] ?? null, troughT = g.troughs[1] ?? null;   // the middle ones, stable while drawing
    ctx.save(); ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 2; ctx.setLineDash([5, 7]); ctx.globalAlpha = 0.75;
    for (const r of s.regions) {
      const p = near(r.kind === 'C' ? g.crests : g.troughs, r.x);
      if (!p) continue;
      // A tagged crest's guide ends at the top of its tag, which sits just above the crest.
      const end = p === crestT ? p.y - 70 : p.y - 10;
      ctx.beginPath(); ctx.moveTo(p.x, top); ctx.lineTo(p.x, end); ctx.stroke();
    }
    ctx.restore();
    if (crestT) pill(ctx, c, 'crest', crestT.x, crestT.y - 46, { bg: c.s5, size: 28, display: true });
    if (troughT) pill(ctx, c, 'trough', troughT.x, troughT.y + 46, { bg: c.s2, size: 28, display: true });
  }
}
