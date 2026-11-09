// TimbreWaveScene-timbre.js - slide "Timbre" (blk-l05-n02, 3 beats). New 2026-11-03.
// Its own file because blk-l05-a01 also has three beats (one exported class per scene file).
// b0 a flute (bansuri), an ektara and a tabla on one low bench, each above a graph of its sound (density against time,
//    computed in TimbreArt.js). All three have the SAME repeat length (same fundamental: same note) and the
//    SAME largest swing (equally loud); only the shape differs, set by each one's overtones: timbre.
// b1 a sitar with its extra strings lit and shimmering; a tabla with its black syaahi, its skin vibrating
//    in rings.
// b2 the tabla resting on a cloth, calm, soft sound arcs. No portrait, no person.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawBench, pill, alpha, mix, darken, lighten } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawBansuri, drawEktara, drawTabla, drawSitar } from '../shared/SoundArt.js';
import { plotSound, repeatBrackets } from './TimbreArt.js';

const REST = 3.4;
const ramp = (a, t0, dur) => Math.max(0, Math.min(1, (a - t0) / dur));
const COLS = [
  { x: 118, kind: 'flute', name: 'flute' },
  { x: 340, kind: 'ektara', name: 'ektara' },
  { x: 562, kind: 'tabla', name: 'tabla' },
];
const GW = 196, GY = 262, GH = 132, CYCLES = 2;

export class TimbreWaveSceneTimbre extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A flute, an ektara and a tabla, each above a graph of its sound. The three curves repeat '
    + 'after the same time and swing equally high: the same note, equally loud. Their shapes differ: that is '
    + 'timbre. Then a sitar with its extra strings lit and shimmering, and a tabla whose skin, with its black '
    + 'patch called the syaahi, vibrates in rings. Then the tabla rests on a cloth, giving out soft sound.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.t() < REST; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    if (this.stage === 0) this.three(ctx, c);
    else if (this.stage === 1) this.rich(ctx, c);
    else this.rest(ctx, c);
  }

  three(ctx, c) {
    const a = this.t(), tt = Math.min(a, REST), vib = Math.max(0.3, Math.exp(-tt / 2.4)), out = [];
    // one long low wooden bench: all three stand (or lie) on its top at TOP
    const TOP = 206;
    drawBench(ctx, c, 8, 672, TOP, { h: 30 });
    drawBansuri(ctx, c, { x: COLS[0].x, y: TOP - 15, len: 214, wd: 28, vib, t: tt });
    drawEktara(ctx, c, { x: COLS[1].x, y: TOP, h: 172, vib, t: tt });
    drawTabla(ctx, c, { x: COLS[2].x, y: TOP, r: 58, vib, t: tt });
    for (const col of COLS) {
      pill(ctx, c, col.name, col.x, 236, { bg: c.raised, size: 26, display: true });
      const gx = col.x - GW / 2;
      const g = plotSound(ctx, c, { x: gx, y: GY, w: GW, h: GH, kind: col.kind, cycles: CYCLES, progress: ramp(a, 0.4, 1.4), cell: 8 });
      repeatBrackets(ctx, c, { x: gx, w: GW, period: g.period, by: GY + GH + 24, u: ramp(a, 1.9, 0.6) });
      out.push(Math.round(g.period));
    }
    // four labels at most: the three names and one word; the equal repeat brackets carry "same note"
    const k = ramp(a, 2.4, 0.4);
    pill(ctx, c, 'timbre', 340, 474, { bg: c.s5, size: 30, display: true, alpha: k });
    this.probeOut = { periods: out };
  }

  rich(ctx, c) {
    const a = this.t(), tt = Math.min(a, REST) + (a >= REST ? 0.37 : 0), vib = Math.max(0.45, Math.exp(-tt / 3));
    this.cloth(ctx, c, 345, 472, 318);   // both instruments rest on one cloth on the floor
    const s = drawSitar(ctx, c, { x: 128, y: 380, len: 530, ang: -0.5, litExtra: true, vib, t: tt });
    // the extra strings ring along with the played ones: a soft glow that swells and fades on them
    const e = s.extra, pulse = 0.5 + 0.5 * Math.sin(tt * 9);
    ctx.save(); ctx.lineCap = 'round';
    for (const [w, k] of [[18, 0.22], [8, 0.42]]) {
      ctx.strokeStyle = alpha(c.warning, k * (0.55 + 0.45 * pulse)); ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    }
    ctx.restore();
    const ex = { x: (e.a.x + e.b.x) / 2 + 24, y: (e.a.y + e.b.y) / 2 + 70 };
    pill(ctx, c, 'extra strings', ex.x, ex.y, { bg: c.s3, size: 26, display: true });
    const tb = drawTabla(ctx, c, { x: 568, y: 468, r: 74, vib: 1, t: tt });
    pill(ctx, c, 'syaahi', 560, tb.skin.cy - tb.skin.ry - 40, { bg: c.s5, size: 28, display: true });
    this.probeOut = { extra: ex, skin: { x: Math.round(tb.skin.cx), y: Math.round(tb.skin.cy) } };
  }

  rest(ctx, c) {
    const a = this.t(), tt = Math.min(a, REST);
    this.cloth(ctx, c, 340, 452);
    const tb = drawTabla(ctx, c, { x: 340, y: 452, r: 112, vib: 0.35 * Math.exp(-tt / 2), t: tt });
    drawSoundArcs(ctx, c, { x: tb.skin.cx, y: tb.skin.cy - 24, dir: -Math.PI / 2, spread: 1.3, n: 3, wavelength: 30, r0: 24,
      t: tt, strength: 0.42 });
    this.probeOut = { skin: { x: Math.round(tb.skin.cx), y: Math.round(tb.skin.cy) } };
  }

  /** A cotton cloth spread on the floor: rounded top face with weave lines, a shaded front edge, border stripe, fringe. */
  cloth(ctx, c, x, y, rx = 250) {
    const base = mix(c.s4, c.bgSurface, 0.35), ry = 46, cy = y - 6, th = 16;
    ctx.save();
    ctx.fillStyle = alpha(darken(base, 0.5), 0.18);
    ctx.beginPath(); ctx.ellipse(x + 10, cy + th + 8, rx + 6, ry + 4, 0, 0, Math.PI * 2); ctx.fill();
    // the thickness of the cloth's front edge, in shade
    ctx.beginPath(); ctx.ellipse(x, cy + th, rx, ry, 0, 0, Math.PI); ctx.lineTo(x - rx, cy); ctx.ellipse(x, cy, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath(); ctx.fillStyle = darken(base, 0.2); ctx.fill();
    const top = () => { ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2); };
    top(); ctx.fillStyle = base; ctx.fill();
    ctx.save(); top(); ctx.clip();
    ctx.strokeStyle = alpha(darken(base, 0.25), 0.3); ctx.lineWidth = 1.2;
    for (let i = -20; i <= 20; i++) { ctx.beginPath(); ctx.moveTo(x + i * 14, cy - ry); ctx.lineTo(x + i * 14 + 26, cy + ry); ctx.stroke(); }
    ctx.strokeStyle = alpha(lighten(base, 0.45), 0.6); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(x - 20, cy - 6, rx * 0.62, ry * 0.5, 0, Math.PI * 1.08, Math.PI * 1.7); ctx.stroke();
    ctx.restore();
    // border stripe just inside the rim
    ctx.strokeStyle = alpha(c.s6, 0.85); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(x, cy, rx - 14, ry - 8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = darken(base, 0.35); ctx.lineWidth = 2; top(); ctx.stroke();
    // fringe along the front edge
    ctx.strokeStyle = darken(base, 0.3); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let a = 0.12; a < Math.PI - 0.1; a += 0.07) {
      const X = x + rx * Math.cos(a), Y = cy + th + ry * Math.sin(a);
      ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(a) * 2, Y + 8); ctx.stroke();
    }
    ctx.restore();
  }
}
