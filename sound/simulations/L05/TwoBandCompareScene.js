/**
 * TwoBandCompareScene - L05, two mounts. Rebuilt 2026-11-03 (whole file).
 *   blk-l05-s01 (predict, hostRole 'setup')  two boxes, a thin band and a thick band, both still.
 *   blk-l05-s02 (3 beats)
 *     b0  both bands plucked the same way at t = 0: the thin band swings 3 times in 1 s on screen,
 *         the thick band once (slow motion, ratio 3:1); a stopwatch runs 1 s and two counters count
 *         whole swings (floor(F t)); arcs from each box with wavelength V / F; tags higher / lower pitch.
 *     b1  a pitch line low -> high; thunder cloud and aircraft near low, whistle and siren near high;
 *         each with a wave sample above it (low = wide spacing, high = tight).
 *     b2  two heads in section, younger and older, cords lit, each with a round view of its cords
 *         (length 1 and 1.25): the younger cords shiver and their sample and arcs run twice as fast.
 * Everything is a pure function of the beat and this.t(); nothing depends on history.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawBench, pill, alpha, mix, lighten, darken, rr, font } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { drawBoxAndBand, drawStormCloud, drawJet, drawWhistle, drawSiren, drawVocalCords, drawHeadCutaway } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 28, display: true };
const BOX_Y = 252, BOX_W = 180;
const BANDS = [
  { x: 150, F: 3, tension: 1, thick: 0, name: 'thin band', tag: 'higher pitch' },
  { x: 530, F: 1, tension: 0, thick: 1, name: 'thick band', tag: 'lower pitch' },
];
const A = 15;                 // swing at release (px), the same pluck for both
const V = 90;                 // arc speed (px/s): wavelength = V / F (30 and 90 px)
const BENCH_Y = BOX_Y + 92;

export class TwoBandCompareScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'Two cardboard boxes, each with a rubber band across its opening: the left band is thin, the right band is thick. Plucked the same way, the thin band swings three times while the thick band swings once in the same second, and the sound arcs from the thin band are closer together: higher pitch, lower pitch. Then a pitch line from low to high: thunder and an aircraft near low with widely spaced wave samples, a whistle and a siren near high with tightly spaced ones. Then two views of the vocal cords: the younger cords vibrate faster, the older, longer and thicker cords vibrate slower.';

  constructor(container, config) {
    super(container, config);
    this.mode = 'b0';
  }

  enter(stage) {
    if (this.hostRole === 'setup' || stage === Number.MAX_SAFE_INTEGER || stage > 100) { this.mode = 'setup'; return; }
    this.mode = ['b0', 'b1', 'b2'][Math.max(0, Math.min(2, stage | 0))];
  }

  _tend() { return this.mode === 'setup' ? 0 : this.mode === 'b0' ? 3.4 : 4.2; }
  busy() { return this.age < this._tend(); }
  t() { return Math.min(this.age, this._tend()); }

  draw(ctx, c) {
    const t = this.t();
    drawBackdrop(ctx, c, 'dots');
    if (this.mode === 'setup' || this.mode === 'b0') this._bands(ctx, c, t, this.mode === 'b0');
    else if (this.mode === 'b1') this._pitchLine(ctx, c, t);
    else this._cords(ctx, c, t);
  }

  // ---- setup and b0: the two boxes --------------------------------------------------------
  _bands(ctx, c, t, run) {
    drawBench(ctx, c, 24, 656, BENCH_Y, { h: 64 });
    const T = Math.min(t, 1);
    BANDS.forEach((b) => {
      const swing = run ? A * Math.cos(TAU * b.F * t) : 0;
      const box = drawBoxAndBand(ctx, c, { x: b.x, y: BOX_Y, w: BOX_W, swing, tension: b.tension, bandAt: 0, ghost: run ? 0.55 : 0, amp: A });
      if (b.thick) this._thickBand(ctx, c, box.band);
      if (run) {
        const m = box.mouth || { x: b.x - BOX_W / 2, y: BOX_Y - BOX_W * 0.43, w: BOX_W };
        drawSoundArcs(ctx, c, { x: b.x, y: (m.y ?? BOX_Y - 84) - 34, dir: -Math.PI / 2, spread: 0.85, n: b.F, wavelength: V / b.F, speed: V, r0: 16, t, strength: 0.9 });
        const n = Math.floor(b.F * T + 1e-6);
        pill(ctx, c, `${n} ${n === 1 ? 'swing' : 'swings'}`, b.x, 482, { ...LBL, bg: c.warning, ink: darken(c.warning, 0.78) });
        pill(ctx, c, b.tag, b.x, 30, { ...LBL, bg: b.F > 1 ? c.s6 : c.s1, ink: c.bgDeep });
      }
      pill(ctx, c, b.name, b.x, run ? 434 : 460, { ...LBL, bg: c.raised, ink: c.label });
    });
    if (run) drawStopwatch(ctx, c, { x: 340, y: 214, r: 52, seconds: T, dialSeconds: 1, text: T.toFixed(2) + ' s' });
  }

  // SoundArt's band is at most 7 px wide (tension 0): the thick band is drawn over it, same shading
  _thickBand(ctx, c, band) {
    if (!band) return;
    const { a, b, mid } = band, bw = 13, col = c.s6;
    const path = () => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(2 * mid.x - (a.x + b.x) / 2, 2 * mid.y - (a.y + b.y) / 2, b.x, b.y); };
    ctx.save(); ctx.lineCap = 'round';
    path(); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = bw + 3; ctx.stroke();
    path(); ctx.strokeStyle = col; ctx.lineWidth = bw; ctx.stroke();
    ctx.translate(bw * 0.22, 0); path(); ctx.strokeStyle = alpha(darken(col, 0.22), 0.8); ctx.lineWidth = bw * 0.4; ctx.stroke();
    ctx.translate(-bw * 0.46, 0); path(); ctx.strokeStyle = alpha(lighten(col, 0.55), 0.85); ctx.lineWidth = bw * 0.24; ctx.stroke();
    ctx.restore();
  }

  // a small framed trace: `cycles` across the window, drifting with t at `hz`
  _sample(ctx, c, x, y, w, h, cycles, t, hz, tone) {
    ctx.save();
    rr(ctx, x - w / 2, y - h / 2, w, h, 10);
    ctx.fillStyle = alpha(c.raised, 0.92); ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.7); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 8, y); ctx.lineTo(x + w / 2 - 8, y);
    ctx.strokeStyle = alpha(c.labelMuted, 0.35); ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath();
    const x0 = x - w / 2 + 8, ww = w - 16, amp = h * 0.32;
    for (let i = 0; i <= 120; i++) {
      const u = i / 120, yy = y - amp * Math.sin(TAU * (cycles * u - hz * t));
      if (i) ctx.lineTo(x0 + u * ww, yy); else ctx.moveTo(x0, yy);
    }
    ctx.strokeStyle = tone; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }

  // ---- b1: the pitch line -----------------------------------------------------------------
  _pitchLine(ctx, c, t) {
    const LY = 432;
    // the line: a bar shading from the low tone to the high tone, arrow at the high end
    ctx.save();
    const g = ctx.createLinearGradient(50, 0, 630, 0);
    g.addColorStop(0, c.s1); g.addColorStop(1, c.s6);
    rr(ctx, 50, LY - 7, 560, 14, 7); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.moveTo(606, LY - 18); ctx.lineTo(640, LY); ctx.lineTo(606, LY + 18); ctx.closePath();
    ctx.fillStyle = c.s6; ctx.fill();
    ctx.restore();
    const cols = [
      { x: 96, name: 'thunder', cyc: 0.8, tone: c.s1 },
      { x: 262, name: 'aircraft', cyc: 1.4, tone: mix(c.s1, c.s6, 0.25) },
      { x: 432, name: 'whistle', cyc: 3.6, tone: mix(c.s1, c.s6, 0.8) },
      { x: 584, name: 'siren', cyc: 6, tone: c.s6 },
    ];
    // icons
    drawStormCloud(ctx, c, { x: 92, y: 296, w: 128, rain: 0.5, t, anvil: false });
    drawJet(ctx, c, { x: 262, y: 270, len: 140 });
    drawWhistle(ctx, c, { x: 432, y: 274, s: 2.3 });
    drawSiren(ctx, c, { x: 584, y: 304, s: 1.75, on: 0.6 + 0.4 * Math.sin(TAU * 1.2 * t) });
    cols.forEach((k) => {
      this._sample(ctx, c, k.x, 130, 140, 76, k.cyc, t, 0.6, k.tone);
      ctx.save(); ctx.font = font(c, 600, 28, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = c.label; ctx.fillText(k.name, k.x, 350); ctx.restore();
      // its place on the line
      ctx.save(); ctx.beginPath(); ctx.arc(k.x, LY, 11, 0, TAU); ctx.fillStyle = c.bgSurface; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = k.tone; ctx.stroke(); ctx.restore();
    });
  }

  // ---- b2: younger and older vocal cords ---------------------------------------------------
  _cords(ctx, c, t) {
    // each voice: a head in section (larynx, cords lit and shivering) and, beside the throat,
    // the round view down onto those cords; the older cords are longer and thicker (length 1.25)
    const sets = [
      { col: 170, F: 2, length: 1, h: 168, label: 'younger', cyc: 6, tone: mix(c.s1, c.s6, 0.7) },
      { col: 510, F: 1, length: 1.25, h: 184, label: 'older', cyc: 3, tone: c.s1 },
    ];
    sets.forEach((s) => {
      const hx = s.col - 34, hy = 66 + s.h / 2;
      const head = drawHeadCutaway(ctx, c, { x: hx, y: hy, h: s.h, facing: 1, labels: false, lit: true, vib: 1, t: t * s.F * 0.05 });
      const L = head.larynx || head.cords || { x: hx, y: hy + 0.7 * s.h };
      drawVocalCords(ctx, c, { x: s.col + 92, y: Math.max(L.y + 20, 300), r: 54, state: 'closed', vib: 1, t: t * s.F * 0.05, length: s.length, label: s.label });
      const m = head.mouth || { x: hx + 0.5 * s.h, y: hy + 0.12 * s.h };
      drawSoundArcs(ctx, c, { x: m.x + 4, y: m.y, dir: 0, spread: 0.7, n: 2 * s.F, wavelength: 44 / s.F, speed: 44, r0: 10, t, strength: 0.9 });
      this._sample(ctx, c, s.col, 470, 230, 64, s.cyc, t, 0.5 * s.F, s.tone);
    });
  }
}
