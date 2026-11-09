// WavelengthScene.js - slide "Wavelength" (blk-l04-s03, 2 beats). New 2026-11-03.
// Book Fig 10.18: a strip of air particles over its density graph; lambda brackets crest to crest
// and trough to trough. Every bracket end is a crest or trough the graph FOUND in the field's own
// density (drawDensityGraph returns them), so the two brackets are the same length by the maths.
// b0 one wave, big: lambda crest to crest above the curve, lambda trough to trough below it.
// b1 two waves, same speed and same density swing: (a) long wavelength, (b) short wavelength,
// each with its lambda bracket; then on (a) a half-wavelength bracket from a crest to the next trough.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, alpha } from 'simulations/base/kit/SimLook.js';
import { sineSource, waveField, drawParticleStrip, drawDensityGraph } from 'simulations/base/kit/SimWave.js';

const X0 = 70, WIDTH = 560, V = 120;
const RANGE = [0, 2];                              // headroom above crests and below troughs for brackets
const LAM = '\u03bb';

/** A wave of wavelength lam whose first crest sits `first` px into the strip at its frame time. */
function wave(lam, first) {
  const freq = V / lam, origin = X0 - 3 * lam;
  const F = waveField({ v: V, origin, source: sineSource({ wavelength: lam, freq }) });
  const t = (X0 - origin + first) / V + 20 / freq;
  // The graph reads the same field's density at each particle's mean place (the book's smooth curve).
  const G = { origin, dir: 1, xAt: (d) => origin + d, rhoLin: F.rhoLin, rhoRangeLin: F.rhoRangeLin };
  return { F, G, t, lam };
}
const LONG = wave(280, 70);                        // crests 70 and 350 px in, troughs 210 and 490
const SHORT = wave(140, 35);                       // crests every 140 px, from 35 px in

const ramp = (a, t0, dur) => Math.max(0, Math.min(1, (a - t0) / dur));

export class WavelengthScene extends SimScene {
  static HEIGHT = 560;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A strip of air particles over a graph of its density against distance. A bracket labelled lambda '
    + 'joins one crest to the next above the curve, and an equal bracket joins one trough to the next below it. Then '
    + 'two waves with the same density swing are compared: a long wavelength with crests far apart and a short '
    + 'wavelength with crests close together, each with its lambda bracket; on the long wave a bracket labelled '
    + 'lambda over 2 joins a crest to the next trough.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.t() < 1.8; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.stage >= 1) this.compare(ctx, c);
    else this.one(ctx, c);
  }

  one(ctx, c) {
    const a = this.t(), w = LONG;
    drawParticleStrip(ctx, c, { x: X0, y: 58, w: WIDTH, h: 62, field: w.F, t: w.t, spacing: 11, r: 3.8,
      densityShade: true, tags: true });
    const g = drawDensityGraph(ctx, c, { x: X0, y: 180, w: WIDTH, h: 326, field: w.G, t: w.t, linear: true,
      range: RANGE, axes: { y: 'density', x: 'distance' } });
    const [c1, c2] = g.crests, [t1, t2] = g.troughs;
    if (c1 && c2) this.bracket(ctx, c, c1.x, c2.x, c1.y, c1.y - 42, LAM, ramp(a, 0.2, 0.6), 30);
    if (t1 && t2) this.bracket(ctx, c, t1.x, t2.x, t1.y, t1.y + 42, LAM, ramp(a, 1.0, 0.6), 30);
    this.probeOut = { crest: c1 && c2 && Math.round(c2.x - c1.x), trough: t1 && t2 && Math.round(t2.x - t1.x) };
  }

  compare(ctx, c) {
    const a = this.t(), out = {};
    const rows = [
      { w: LONG, top: 0, name: 'long wavelength', pick: [0, 1] },
      { w: SHORT, top: 280, name: 'short wavelength', pick: [1, 2] },
    ];
    for (const r of rows) {
      const y = r.top;
      pill(ctx, c, r.name, X0, y + 22, { bg: c.raised, size: 26, display: true, align: 'left' });
      drawParticleStrip(ctx, c, { x: X0, y: y + 56, w: WIDTH, h: 46, field: r.w.F, t: r.w.t, spacing: 10, r: 3.4,
        densityShade: true });
      const g = drawDensityGraph(ctx, c, { x: X0, y: y + 116, w: WIDTH, h: 152, field: r.w.G, t: r.w.t, linear: true,
        range: RANGE });
      const p = g.crests[r.pick[0]], q = g.crests[r.pick[1]];
      if (p && q) this.bracket(ctx, c, p.x, q.x, p.y, p.y - 24, LAM, ramp(a, 0.2, 0.6), 26);
      out[r.name] = p && q && Math.round(q.x - p.x);
      if (r.w === LONG) {
        const k = g.crests[0], tr = g.troughs.find((u) => k && u.x > k.x);
        if (k && tr) this.bracket(ctx, c, k.x, tr.x, tr.y, tr.y + 26, LAM + '/2', ramp(a, 1.0, 0.6), 26, k.y);
        out.half = k && tr && Math.round(tr.x - k.x);
      }
    }
    this.probeOut = out;
  }

  /**
   * A dimension bracket from x1 to x2 at height by: dashed end ticks from the two points (y0 at x1, y1 at x2)
   * to the bracket, a double arrow that grows out from x1 with u, and its label in a gap at the middle.
   */
  bracket(ctx, c, x1, x2, yEnd, by, label, u, size, yStart = yEnd) {
    if (u <= 0) return;
    const xe = x1 + (x2 - x1) * u, dir = by < yEnd ? -1 : 1;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.7); ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(x1, yStart + dir * 9); ctx.lineTo(x1, by + dir * 8);
    if (u >= 1) { ctx.moveTo(x2, yEnd + dir * 9); ctx.lineTo(x2, by + dir * 8); }
    ctx.stroke(); ctx.setLineDash([]);
    const mid = (x1 + x2) / 2, gap = u >= 1 ? (label.length > 1 ? 34 : 22) : 0;
    ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    if (gap) { ctx.moveTo(x1 + 3, by); ctx.lineTo(mid - gap, by); ctx.moveTo(mid + gap, by); ctx.lineTo(x2 - 3, by); }
    else { ctx.moveTo(x1 + 3, by); ctx.lineTo(xe, by); }
    ctx.stroke();
    const head = (x, s) => { ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x - s * 11, by - 6); ctx.lineTo(x - s * 11, by + 6); ctx.closePath(); ctx.fill(); };
    head(x1, -1); head(xe, 1);
    ctx.restore();
    if (gap) pill(ctx, c, label, mid, by, { bg: c.raised, size, display: true });
  }
}
