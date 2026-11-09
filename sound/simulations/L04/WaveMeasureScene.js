// WaveMeasureScene.js - predict "Two Waves, One Place" (blk-l04-s02, hostRole 'setup') and explain
// "Frequency" (blk-l04-s04, 2 beats). Rebuilt 2026-11-03 (whole file).
// Two SimWave fields with the SAME speed: (a) crests far apart, (b) crests close together. One fixed
// marker line crosses both strips at the same x. Everything at the marker is read from the field:
// the density there, its maxima (crests passing), the trace, the counts. Nothing is scripted.
// Wave time runs SLOW times slower than the clock (tag "slow motion" where numbers are shown):
// (a) 2 Hz and (b) 6 Hz in wave time, seen at 0.5 and 1.5 per second.
// setup: both strips move, the marker, "a" and "b". No counters, no numbers, no trace (that is the answer).
// b0: strip (a) and the marker; below, the density AT the marker against time grows as a trace; the
//     first full oscillation (maximum to maximum) is bracketed. No counter (counting is b1).
// b1: both strips run for exactly one second of wave time (stopwatch); counters at the marker count
//     real crest passages, 2 and 6; then "2 Hz" and "6 Hz", and the (b) counter lights.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, alpha, font } from 'simulations/base/kit/SimLook.js';
import { sineSource, waveField, drawParticleStrip, drawDensityGraph } from 'simulations/base/kit/SimWave.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';

const X0 = 84, WIDTH = 572, MX = 370;              // strips and the fixed marker
const V = 540, SLOW = 2.8;                          // wave px per wave-second; wave time = clock / SLOW
// Strip boxes per view: the predict setup fills the stage with two tall strips; b1 leaves room for the watch.
const SETUP_STRIPS = [{ y: 70, h: 160, name: 'a' }, { y: 310, h: 160, name: 'b' }];
const COUNT_STRIPS = [{ y: 62, h: 110, name: 'a' }, { y: 232, h: 110, name: 'b' }];
const TRACE_STRIP = { y: 56, h: 120 };

/** A wave of frequency f (wave time) whose density maxima reach the marker at tau = phase / f + k / f. */
function wave(freq, phase) {
  const lam = V / freq, origin = X0 - 3 * lam, dM = MX - origin;
  const F = waveField({ v: V, origin, source: sineSource({ wavelength: lam, freq }) });
  const T0 = dM / V + (20 + phase) / freq;          // maxima at t - dM / v = k / f
  const rhoAt = (tau) => F.rhoLin(dM, T0 + tau);
  return { F, T0, freq, lam, dM, rhoAt };
}
// b1 and setup: the first maximum half a period in, so whole counts land inside one second (2 and 6).
const A = wave(2, 0.5), B = wave(6, 0.5);
// b0: start a quarter period before a maximum (density at average and rising).
const A0 = wave(2, 0.75);

/** Density maxima at the marker in wave time [0, tau], found by sampling the field (not by formula). */
function maxima(w, tau) {
  const out = [], dt = 1 / 720;
  for (let s = dt; s <= tau - dt + 1e-9; s += dt) {
    const p = w.rhoAt(s - dt), q = w.rhoAt(s), r = w.rhoAt(s + dt);
    if (q > p && q >= r && q > 1.05) out.push(s);
  }
  return out;
}

const B0_TAU = 1.0;                                 // b0: two periods of (a)
const B1_DELAY = 0.4, B1_TAU = 1.0;                 // b1: one second of wave time

export class WaveMeasureScene extends SimScene {
  static HEIGHT = 540;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static BEAT_MAPS = { 1: [[{ idx: 0, dwellMs: null }]], 2: [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]] };
  static ARIA_LABEL = 'Two strips of air particles, a and b, carry sound waves at the same speed: a has compressions far '
    + 'apart, b has them close together. A fixed vertical marker crosses both strips at the same place. A trace below '
    + 'shows the density at the marker going up and down with time, with one oscillation from maximum to maximum '
    + 'bracketed. Then both waves run for one second on a stopwatch while counters at the marker count the crests '
    + 'that pass: 2 for a and 6 for b, so a is 2 hertz and b is 6 hertz.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  isSetup() { return this.hostRole === 'setup' || this.beatCount > 1000; }   // the predict mount sends beat count MAX_SAFE_INTEGER

  busy() {
    if (this.isSetup()) return true;               // the predict picture keeps both waves travelling
    return this.stage >= 1 ? this.t() < B1_DELAY + B1_TAU * SLOW + 0.8 : this.t() < B0_TAU * SLOW + 0.3;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'diamond');
    if (this.isSetup()) this.setupView(ctx, c);
    else if (this.stage >= 1) this.countView(ctx, c);
    else this.traceView(ctx, c);
  }

  strip(ctx, c, w, y, h, tau, name) {
    // The tube is capped at both ends of the strip (the field's origin is far off to the left).
    ctx.save(); ctx.beginPath(); ctx.rect(X0 - 8, -10, WIDTH + 16, 2000); ctx.clip();
    drawParticleStrip(ctx, c, { x: X0, y, w: WIDTH, h, field: w.F, t: w.T0 + tau, spacing: 10, r: 3.8, densityShade: true });
    ctx.restore();
    if (name) pill(ctx, c, name, X0 - 46, y + h / 2, { bg: c.raised, size: 32, display: true });
  }

  /** The fixed place: a post through the strips, with a pin head on top. */
  marker(ctx, c, y0, y1) {
    ctx.save();
    ctx.fillStyle = alpha(c.accent, 0.12); ctx.fillRect(MX - 9, y0, 18, y1 - y0);
    ctx.strokeStyle = c.accent; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(MX, y0); ctx.lineTo(MX, y1); ctx.stroke();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.moveTo(MX, y0 + 2); ctx.lineTo(MX - 10, y0 - 14); ctx.lineTo(MX + 10, y0 - 14); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  setupView(ctx, c) {
    const tau = this.t() / SLOW;
    const [sa, sb] = SETUP_STRIPS;
    this.strip(ctx, c, A, sa.y, sa.h, tau, 'a');
    this.strip(ctx, c, B, sb.y, sb.h, tau, 'b');
    this.marker(ctx, c, sa.y - 22, sb.y + sb.h + 22);
    this.probeOut = { tau };
  }

  traceView(ctx, c) {
    const tau = Math.min(B0_TAU, this.t() / SLOW), w = A0;
    // b0 is about ONE oscillation: no counter here (counting is b1).
    this.strip(ctx, c, w, TRACE_STRIP.y, TRACE_STRIP.h, tau, null);
    this.marker(ctx, c, TRACE_STRIP.y - 22, TRACE_STRIP.y + TRACE_STRIP.h + 22);
    const n = maxima(w, tau).length;
    // The density AT the marker against time, drawn by the kit graph from the same field.
    const GX = 100, GW = 520, PX = GW / B0_TAU;
    const TF = { origin: GX, dir: 1, xAt: (d) => GX + d, rhoLin: (d) => w.rhoAt(d / PX), rhoRangeLin: w.F.rhoRangeLin };
    const g = drawDensityGraph(ctx, c, { x: GX, y: 256, w: GW, h: 220, field: TF, t: 0, linear: true, range: [-0.4, 2.4],
      progress: tau / B0_TAU, axes: {} });
    this.axisWords(ctx, c, { x: GX, y: 256, w: GW, h: 220 }, 'density at the marker', 'time');
    const [p, q] = g.crests;
    if (p && q) this.bracket(ctx, c, p.x, q.x, p.y - 30, p.y, 'one oscillation');
    this.probeOut = { tau, count: n, crests: g.crests.map((k) => Math.round(k.x)) };
  }

  countView(ctx, c) {
    const tau = Math.max(0, Math.min(B1_TAU, (this.t() - B1_DELAY) / SLOW)), done = tau >= B1_TAU;
    const out = {};
    [A, B].forEach((w, i) => {
      const st = COUNT_STRIPS[i], y = st.y;
      this.strip(ctx, c, w, y, st.h, tau, st.name);
      const n = maxima(w, tau).length;
      out[st.name] = n;
      const win = done && w === B;
      pill(ctx, c, String(n), MX + 46, y - 30, { bg: win ? c.good : c.raised, size: 30, display: true });
      if (done) pill(ctx, c, `${w.freq} Hz`, X0 + WIDTH - 60, y - 30, { bg: win ? c.good : c.raised, size: 30, display: true });
    });
    const [ca, cb] = COUNT_STRIPS;
    this.marker(ctx, c, ca.y - 22, cb.y + cb.h + 22);
    drawStopwatch(ctx, c, { x: 230, y: 458, r: 54, seconds: tau, dialSeconds: 1, readout: 'inside', size: 28 });
    pill(ctx, c, 'slow motion', 470, 458, { bg: c.raised, size: 28, display: true });
    this.probeOut = { tau, ...out };
  }

  /** A bracket over the trace from one maximum to the next, its label just above it. */
  bracket(ctx, c, x1, x2, by, yTip, label) {
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.7); ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(x1, yTip - 9); ctx.lineTo(x1, by - 8); ctx.moveTo(x2, yTip - 9); ctx.lineTo(x2, by - 8); ctx.stroke();
    ctx.setLineDash([]);
    const mid = (x1 + x2) / 2;
    ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1 + 3, by); ctx.lineTo(x2 - 3, by); ctx.stroke();
    const head = (x, s) => { ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x - s * 11, by - 6); ctx.lineTo(x - s * 11, by + 6); ctx.closePath(); ctx.fill(); };
    head(x1, -1); head(x2, 1);
    ctx.restore();
    pill(ctx, c, label, mid, by - 32, { bg: c.raised, size: 28, display: true });
  }

  /** Axis words at 30 px (the kit's are 26 px: too small at 390). */
  axisWords(ctx, c, b, yWord, xWord) {
    ctx.save(); ctx.font = font(c, 700, 30, true); ctx.fillStyle = c.label; ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; ctx.fillText(yWord, b.x + 10, b.y - 22);
    ctx.textAlign = 'right'; ctx.fillText(xWord, b.x + b.w, b.y + b.h + 26);
    ctx.restore();
  }
}
