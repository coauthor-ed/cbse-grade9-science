// SameSpeedScene.js - slide "Same Air, Same Speed" (blk-l04-s08, 2 beats). New 2026-11-03.
// b0 three speakers, three frequencies (low, higher, highest), three strips of the same air. Each strip is a
// SimWave field with the SAME v; only the source frequency differs. All three start at the same instant, so
// every front is at x = origin + v (t - start): one dashed front line runs down through all three rows and
// carries the one speed tag. The crests crowd closer as the frequency rises; every front reaches the right
// end at the same moment. At rest each row shows its lambda bracket, found from the field's own C regions.
// b1 the two ends of hearing: a long lambda ruler (20 Hz, 17.2 m, one tick per metre, a person drawn larger, not to
// scale) and a tiny one (20 000 Hz, 1.72 cm); "not to scale" once.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, font, alpha, lighten, darken, rr } from 'simulations/base/kit/SimLook.js';
import { sineSource, swingAmp, waveField, drawParticleStrip } from 'simulations/base/kit/SimWave.js';
import { drawSpeaker } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';

const V = 160, START = 0.4;
const SX = 100, SW = 548, SEND = SX + SW;          // strips: mouth of the speaker to the right end
const ARRIVE = START + SW / V;                      // the moment every front reaches the right end
const ROWS = [
  { name: 'low', freq: 0.5 },
  { name: 'higher', freq: 1.0 },
  { name: 'highest', freq: 1.5 },
].map((r, i) => ({ ...r, y0: 84 + i * 156, lam: V / r.freq,
  F: waveField({ v: V, origin: SX, source: sineSource({ amp: swingAmp(V / r.freq, 0.42), freq: r.freq, start: START }) }) }));
const LAM_S = '\u03bb';
const TAU = Math.PI * 2;
/** A still wave of wavelength lam with a crest (C) at x = 70 at its frame time t (WavelengthScene pattern). */
function stillWave(lam, swing) {
  const freq = V / lam, origin = 40 - 3 * lam;
  const F = waveField({ v: V, origin, source: sineSource({ amp: swingAmp(lam, swing), freq }) });
  return { F, t: (70 - origin) / V + 20 / freq, lam };
}
const LONG_W = stillWave(460, 0.42);
const SHORT_W = stillWave(30, 0.3);

const ramp = (a, t0, dur) => Math.max(0, Math.min(1, (a - t0) / dur));

export class SameSpeedScene extends SimScene {
  static HEIGHT = 560;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Three speakers send sound into the same air at a low, a higher and the highest frequency. The '
    + 'three wave fronts move right together along one dashed line tagged 344 metres per second, and all reach the '
    + 'right end at the same moment. The higher the frequency, the closer the compressions and the shorter the '
    + 'wavelength lambda. Then two rulers: at 20 hertz the wavelength is 17.2 metres, a ruler with a person beside '
    + 'it for size; at 20 000 hertz it is 1.72 centimetres, a tiny ruler; not to scale.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.stage === 0 ? this.t() < ARRIVE + 1.2 : this.t() < 2.0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    if (this.stage >= 1) this.ends(ctx, c);
    else this.race(ctx, c);
  }

  race(ctx, c) {
    const a = this.t(), t = Math.min(a, ARRIVE);
    const front = SX + V * Math.max(0, t - START);    // the same for every row: same air, same v
    const out = { front: Math.round(front), rows: [] };
    for (const r of ROWS) {
      const on = t > START ? Math.sin(TAU * r.freq * (t - START)) : 0;
      drawSpeaker(ctx, c, { x: SX - 6, y: r.y0 + 44, r: 30, cutaway: true, cone: on, facing: 1 });
      drawParticleStrip(ctx, c, { x: SX, y: r.y0 + 12, w: SW, h: 64, field: r.F, t, spacing: 11, r: 3.6,
        densityShade: true });
      pill(ctx, c, r.name, SX, r.y0 - 22, { bg: c.raised, size: 26, display: true, align: 'left' });
      const k = ramp(a, ARRIVE + 0.15, 0.5);
      // Crest to crest if two C fit in the strip, else trough to trough (the low row): both are one wavelength.
      const reg = r.F.regions(t, 0, SW).filter((g) => g.x > SX + 20 && g.x < SEND - 8);
      const cs = reg.filter((g) => g.kind === 'C'), rs = reg.filter((g) => g.kind === 'R');
      const [p, q] = cs.length > 1 ? cs : rs;
      if (k > 0 && p && q) this.bracket(ctx, c, p.x, q.x, r.y0 + 104, k);
      out.rows.push({ name: r.name, lam: p && q ? Math.round(q.x - p.x) : null, front: Math.round(r.F.front(t)) });
    }
    // The one front line through all three rows, and the one speed tag riding it.
    if (t > START) {
      ctx.save(); ctx.strokeStyle = alpha(c.s6, 0.7); ctx.lineWidth = 2.5; ctx.setLineDash([6, 7]);
      ctx.beginPath(); ctx.moveTo(front, 56); ctx.lineTo(front, ROWS[2].y0 + 86); ctx.stroke(); ctx.restore();
    }
    const tagX = Math.max(SX + 60, Math.min(SEND - 60, front));
    pill(ctx, c, '344 m/s', tagX, 34, { bg: c.s6, size: 26, display: true });
    this.probeOut = out;
  }

  /** A dimension line from x1 to x2 at height y, the lambda tag in a gap at its middle. */
  bracket(ctx, c, x1, x2, y, u) {
    const mid = (x1 + x2) / 2, gap = 20;
    ctx.save(); ctx.globalAlpha = u;
    ctx.strokeStyle = alpha(c.label, 0.7); ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(x1, y - 22); ctx.lineTo(x1, y + 8); ctx.moveTo(x2, y - 22); ctx.lineTo(x2, y + 8); ctx.stroke();
    ctx.setLineDash([]); ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1 + 3, y); ctx.lineTo(mid - gap, y); ctx.moveTo(mid + gap, y); ctx.lineTo(x2 - 3, y); ctx.stroke();
    for (const [x, s] of [[x1, -1], [x2, 1]]) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * 11, y - 6); ctx.lineTo(x - s * 11, y + 6); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    if (u > 0.3) pill(ctx, c, LAM_S, mid, y, { bg: c.raised, size: 26, display: true });
  }

  ends(ctx, c) {
    const a = this.t();
    pill(ctx, c, 'air: 344 m/s', 340, 36, { bg: c.s6, size: 26, display: true });
    // 20 Hz: one wavelength of air spans the ruler, 17.2 m, a tick per metre; a person beside it, drawn larger (not to scale).
    const RX = 70, LEN = 460, PXM = LEN / 17.2, PERSON_H = 150;   // the person is drawn larger: not to scale
    pill(ctx, c, '20 Hz', 40, 90, { bg: c.raised, size: 26, display: true, align: 'left' });
    this.strip(ctx, c, LONG_W, 118);
    const g1 = ramp(a, 0.2, 0.8);
    if (g1 > 0) this.ruler(ctx, c, RX, RX + LEN * g1, 200, PXM);
    if (g1 >= 1) pill(ctx, c, LAM_S + ' = 17.2 m', RX + LEN / 2, 256, { bg: c.s5, size: 30, display: true });
    const fig = figureFor(this, { role: 'student', pose: 'stand', x: RX + LEN + 82, y: 240, height: PERSON_H, facing: -1, i: 2, autoReach: false });
    drawFigure(ctx, c, fig, fig.look);
    // 20 000 Hz: crests packed close (drawn far longer than the real 1.72 cm, so: not to scale).
    pill(ctx, c, '20 000 Hz', 40, 310, { bg: c.raised, size: 26, display: true, align: 'left' });
    this.strip(ctx, c, SHORT_W, 336);
    const g2 = ramp(a, 1.2, 0.4);
    if (g2 > 0) {
      ctx.save(); ctx.globalAlpha = g2; this.ruler(ctx, c, RX, RX + SHORT_W.lam, 418, 0); ctx.restore();
      pill(ctx, c, LAM_S + ' = 1.72 cm', RX + SHORT_W.lam + 18, 431, { bg: c.s5, size: 30, display: true, align: 'left' });
    }
    {
      ctx.save(); ctx.font = font(c, 700, 26, true); ctx.fillStyle = c.labelMuted; ctx.textAlign = 'center';
      ctx.fillText('not to scale', 340, 506); ctx.restore();
    }
    this.probeOut = { pxPerMetre: +PXM.toFixed(2), personPx: PERSON_H };
  }

  /** A still strip of air holding a wave whose crests sit at RX and every lam after it. */
  strip(ctx, c, w, y) {
    drawParticleStrip(ctx, c, { x: 40, y, w: w === LONG_W ? 520 : 600, h: 62, field: w.F, t: w.t, spacing: 10, r: 3.4, densityShade: true });
  }

  /** A wooden-yellow ruler: lit top edge, shaded body, a tick per metre (longer every 5 m) when pxm > 0. */
  ruler(ctx, c, x1, x2, y, pxm) {
    const h = 26, base = c.gold, w = Math.max(4, x2 - x1);
    ctx.save();
    ctx.fillStyle = alpha(darken(base, 0.5), 0.18); rr(ctx, x1 + 3, y + 5, w, h, 4); ctx.fill();
    const gr = ctx.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, lighten(base, 0.45)); gr.addColorStop(0.45, lighten(base, 0.15)); gr.addColorStop(1, darken(base, 0.12));
    ctx.fillStyle = gr; rr(ctx, x1, y, w, h, Math.min(4, w / 2)); ctx.fill();
    if (w > 12) {
      ctx.strokeStyle = alpha(lighten(base, 0.8), 0.9); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1 + 4, y + 2.5); ctx.lineTo(x1 + w - 4, y + 2.5); ctx.stroke();
    }
    if (pxm > 0) {
      ctx.strokeStyle = darken(base, 0.45); ctx.lineWidth = 1.6;
      for (let m = 1; x1 + m * pxm < x1 + w - 2; m++) {
        const X = x1 + m * pxm, l = m % 5 === 0 ? 15 : 8;
        ctx.beginPath(); ctx.moveTo(X, y + h); ctx.lineTo(X, y + h - l); ctx.stroke();
      }
    }
    ctx.strokeStyle = darken(base, 0.35); ctx.lineWidth = 2; rr(ctx, x1, y, w, h, Math.min(4, w / 2)); ctx.stroke();
    ctx.restore();
  }
}
