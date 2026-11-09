// PeriodScene.js - slide "Time Period" (blk-l04-s05, 2 beats). New 2026-11-03.
// A SimWave strip with one fixed marker. The density AT the marker is read from the field; its maxima
// are found by sampling it, never by formula, and the stopwatch runs between them.
// b0 a 0.5 Hz wave (slow enough to follow at real speed): the stopwatch starts when one density
//    maximum reaches the marker and stops at the next: it reads T = 2.00 s. The strip freezes there.
// b0 is tagged "slow motion" too (no real sound is 0.5 Hz).
// b1 a 5 Hz wave shown in slow motion (one wave second = SLOW clock seconds): a counter at the marker
//    counts maxima while the stopwatch runs to 2.0 s; it reaches 10, then the two results appear,
//    computed from the count: frequency = 10 / 2 s = 5 Hz, time period = 2 s / 10 = 0.2 s.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, alpha } from 'simulations/base/kit/SimLook.js';
import { sineSource, waveField, drawParticleStrip } from 'simulations/base/kit/SimWave.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';

const X0 = 60, WIDTH = 560, MX = 340, SY = 70, SH = 90;
const NU = '\u03bd';

/** A wave of frequency f; at tau = 0 the marker's density is at phase `phase` of a cycle (0 = maximum). */
function wave(freq, v, phase) {
  const lam = v / freq, origin = X0 - 3 * lam, dM = MX - origin;
  const F = waveField({ v, origin, source: sineSource({ wavelength: lam, freq }) });
  const T0 = dM / v + (20 + phase) / freq;
  return { F, T0, freq, rhoAt: (tau) => F.rhoLin(dM, T0 + tau) };
}
const SLOWW = wave(0.5, 120, 0.75);   // b0: average and rising at tau 0, first maximum at 0.5 s
const FAST = wave(5, 500, 0.5);       // b1: maxima at 0.1, 0.3, ... s of wave time
const SLOW = 1.5;                     // b1 slow motion: 5 Hz is seen at 3.3 per second (the run fits in 3.3 s)
const B1_DELAY = 0.3, B1_TAU = 2.0;

/** Density maxima at the marker in wave time [0, tau], found by sampling the field. */
function maxima(w, tau) {
  const out = [], dt = 1 / 600;
  for (let s = dt; s <= tau + 1e-9; s += dt) {
    const p = w.rhoAt(s - dt), q = w.rhoAt(s), r = w.rhoAt(s + dt);
    if (q > p && q >= r && q > 1.05) out.push(s);
  }
  return out;
}
const B0_MAX = maxima(SLOWW, 4);      // [0.5, 2.5, ...]: the stopwatch runs from the first to the second

export class PeriodScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A strip of air particles carries a sound wave past a fixed marker. A stopwatch starts when the '
    + 'density at the marker is at a maximum and stops at the next maximum: it reads 2 seconds, the time period T. '
    + 'Then a faster wave in slow motion: a counter at the marker counts 10 oscillations while the stopwatch runs to '
    + '2 seconds, giving a frequency of 5 hertz and a time period of 0.2 seconds.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.stage >= 1 ? this.t() < B1_DELAY + B1_TAU * SLOW + 0.8 : this.t() < B0_MAX[1] + 0.3; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    if (this.stage >= 1) this.example(ctx, c);
    else this.period(ctx, c);
  }

  strip(ctx, c, w, tau) {
    // The tube is capped at both ends of the strip (the field's origin is far off to the left).
    ctx.save(); ctx.beginPath(); ctx.rect(X0 - 8, -10, WIDTH + 16, 2000); ctx.clip();
    drawParticleStrip(ctx, c, { x: X0, y: SY, w: WIDTH, h: SH, field: w.F, t: w.T0 + tau, spacing: 10, r: 3.6, densityShade: true });
    ctx.restore();
    // The fixed place: a post through the strip, with a pin head on top.
    const y0 = SY - 22, y1 = SY + SH + 22;
    ctx.save();
    ctx.fillStyle = alpha(c.accent, 0.12); ctx.fillRect(MX - 9, y0, 18, y1 - y0);
    ctx.strokeStyle = c.accent; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(MX, y0); ctx.lineTo(MX, y1); ctx.stroke();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.moveTo(MX, y0 + 2); ctx.lineTo(MX - 10, y0 - 14); ctx.lineTo(MX + 10, y0 - 14); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  period(ctx, c) {
    const [m1, m2] = B0_MAX, tau = Math.min(this.t(), m2);
    this.strip(ctx, c, SLOWW, tau);
    // The marker's density at a maximum (within a hair of its peak): say so under the marker.
    const peak = SLOWW.rhoAt(m1), atMax = SLOWW.rhoAt(tau) > peak - 0.004;
    if (atMax) pill(ctx, c, 'maximum', MX, SY + SH + 44, { bg: c.s5, size: 28, display: true });
    // This wave is far slower than any real sound: say so, as b1 does.
    pill(ctx, c, 'slow motion', X0 + WIDTH - 70, SY - 34, { bg: c.raised, size: 28, display: true });
    const sec = Math.max(0, Math.min(m2, tau) - m1);
    const sw = drawStopwatch(ctx, c, { x: 250, y: 340, r: 76, seconds: sec, dialSeconds: 4, size: 30 });
    if (tau >= m2 && sw.readout) pill(ctx, c, 'T', sw.readout.x + sw.readout.w + 34, sw.readout.y + sw.readout.h / 2,
      { bg: c.accent, size: 30, display: true });
    this.probeOut = { tau, m1, m2, T: +sec.toFixed(3) };
  }

  example(ctx, c) {
    const tau = Math.max(0, Math.min(B1_TAU, (this.t() - B1_DELAY) / SLOW)), done = tau >= B1_TAU;
    this.strip(ctx, c, FAST, tau);
    const n = maxima(FAST, tau).length;
    pill(ctx, c, n === 1 ? '1 oscillation' : `${n} oscillations`, MX, SY + SH + 44, { bg: done ? c.good : c.raised, size: 30, display: true });
    drawStopwatch(ctx, c, { x: 200, y: 340, r: 76, seconds: tau, dialSeconds: 4, text: tau.toFixed(1) + ' s', size: 30 });
    pill(ctx, c, 'slow motion', X0 + WIDTH - 70, SY - 34, { bg: c.raised, size: 28, display: true });
    if (done && this.t() > B1_DELAY + B1_TAU * SLOW + 0.2) {
      const nu = n / B1_TAU, T = B1_TAU / n;
      // In words, as the slide prints them (a display-font nu reads as a v). They fade in over 0.3 s.
      ctx.save(); ctx.globalAlpha = Math.min(1, (this.t() - B1_DELAY - B1_TAU * SLOW - 0.2) / 0.3);
      pill(ctx, c, `frequency = ${nu} Hz`, 480, 320, { bg: c.raised, size: 32, display: true });
      pill(ctx, c, `time period = ${T.toFixed(1)} s`, 480, 400, { bg: c.raised, size: 32, display: true });
      ctx.restore();
    }
    this.probeOut = { tau, n };
  }
}
