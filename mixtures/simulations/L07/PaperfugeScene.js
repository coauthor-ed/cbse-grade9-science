// PaperfugeScene - blk-l07-s04. A cardboard disc on a loop of string, spun by pulling two handles.
//   stage 0  the machine at rest, named
//   stage 1  the learner pulls: the disc spins, and the big copy of the thin tube below shows the cells moving outward
//   stage 2  slow pull against fast pull: the same layers, four times the wait
//   stage 3  two samples: a short red layer can mean anaemia
// Disc seen at an angle: its axis is the string. Sizes and times are sped up and not to scale; the red shares (44 %, 28 %) are
// model numbers. In the big tube the left end is nearest the centre of the disc and the right end is the outward end.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, clamp01, darken, drawBackdrop, drawCard, drawFloor, drawVignette, font, leader, lighten, mix, mulberry32, pill, rr, inkOn,
} from 'simulations/base/kit/SimLook.js';
import { BLOOD_TONES } from './CentrifugeBenchKit.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const TAU = Math.PI * 2;

const DISC = { x: 340, y: 186, rx: 126, ry: 166 };
const TRAVEL = 18;
const CAP = { r0: 30, r1: 152, w: 26 };
const BIG = { x: 58, y: 392, w: 564, h: 54 };
const T_RUN = { fast: 3, slow: 12 };
const STRAIN = { healthy: 0.44, anaemia: 0.28 };
const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const GRAIN = (() => {
  const rnd = mulberry32(11);
  return Array.from({ length: 150 }, () => ({ u: rnd(), v: rnd() }));
})();

export class PaperfugeScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A cardboard disc on a loop of string with a handle at each end, and a thin glass tube of blood taped to the disc. Pulling the handles spins the disc. A big copy of the tube shows the red cells moving outward and packing at the far end, with pale plasma left near the centre. A slower pull gives the same layers in four times as long. A short red layer can mean anaemia.';
  static CONTROLS = [
    { type: 'segmented', id: 'rate', label: 'Pull', value: 'fast', options: [{ value: 'slow', label: 'Slow' }, { value: 'fast', label: 'Fast' }] },
    { type: 'segmented', id: 'strain', label: 'Sample', value: 'healthy', options: [{ value: 'healthy', label: 'Person A' }, { value: 'anaemia', label: 'Person B' }] },
    { type: 'button', id: 'pull', label: 'Pull the handles' },
    { type: 'button', id: 'compare', label: 'Compare the two tubes' },
    { type: 'button', id: 'reset', label: 'Fresh tube' },
  ];

  constructor(container, config) {
    super(container, config);
    this._fresh();
  }

  _fresh() {
    this._rate = 'fast'; this._strain = 'healthy';
    this._p = 0; this._going = false; this._spin = 0; this._ang = 0.7; this._pullT = 0;
    this._t = 0; this._times = {}; this._compared = false; this._seen = new Set();
  }

  enter() { this._fresh(); this.requestUiUpdate?.(); }

  isControlHidden(id) {
    if (id === 'rate') return this.stage !== 2;
    if (id === 'strain') return this.stage !== 3;
    if (id === 'compare') return this.stage !== 2 || !(this._times.fast && this._times.slow);
    return this.stage === 0;
  }
  isControlDisabled(id) {
    if (id === 'pull') return this._going || this._p >= 1;
    if (id === 'compare') return this._compared;
    if (id === 'rate' || id === 'strain') return this._going;
    return false;
  }
  getControlValue(id) {
    if (id === 'rate') return this._rate;
    if (id === 'strain') return this._strain;
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'rate') { this._rate = v; this._new(); } else if (id === 'strain') { this._strain = v; this._new(); } else if (id === 'pull') { this._going = true; this._t = 0; } else if (id === 'compare') { this._compared = true; this._find(); } else if (id === 'reset') this._new();
    this.animateFor(600);
    this.requestUiUpdate?.();
  }

  _new() { this._p = 0; this._going = false; }

  update(d) {
    const rate = this.stage === 2 ? this._rate : 'fast';
    const top = this._going ? (rate === 'fast' ? 1 : 0.5) : 0;
    this._spin += (top - this._spin) * (1 - Math.exp(-d / 0.5));
    if (!this._going && this._spin < 0.02) this._spin = 0;
    this._ang += this._spin * 9 * d;
    if (this._going) {
      this._pullT += d * (rate === 'fast' ? 11 : 5.5);
      this._t += d;
      this._p = Math.min(1, this._p + d / T_RUN[rate]);
      if (this._p >= 1) {
        this._going = false;
        this._times[rate] = true;
        // both pulls done: the Compare button appears, and pressing it is the find
        this.requestUiUpdate?.();
      }
    }
  }

  _find() {
    if (this._seen.has('same-layers')) return;
    this._seen.add('same-layers');
    this.celebrate(BIG.x + BIG.w * 0.8, BIG.y + 20, 18, { key: 'same-layers', small: true });
  }

  busy() { return this._going || this._spin > 0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 500);
    this._string(ctx, c);
    this._disc(ctx, c);
    this._big(ctx, c);
    this._tags(ctx, c);
    drawVignette(ctx, c, 0.35);
  }

  _string(ctx, c) {
    const off = this._going ? Math.sin(this._pullT) * TRAVEL : 0;
    const L = 70 - off, R = 610 + off, y = DISC.y;
    const wood = mix(darken(c.gold, 0.35), c.flame, 0.12);
    ctx.strokeStyle = mix(c.label, c.gold, 0.25); ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(L, y - 12); ctx.quadraticCurveTo(190, y + s * 8, DISC.x - 2, y + s * 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(R, y - 12); ctx.quadraticCurveTo(490, y + s * 8, DISC.x + 2, y + s * 6); ctx.stroke();
    }
    for (const x of [L, R]) {
      rr(ctx, x - 16, y - 58, 32, 116, 14);
      ctx.fillStyle = wood; ctx.fill();
      ctx.strokeStyle = darken(wood, 0.35); ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = alpha(lighten(wood, 0.35), 0.7);
      rr(ctx, x - 9, y - 50, 7, 100, 3); ctx.fill();
    }
  }

  _disc(ctx, c) {
    const D = DISC, board = mix(lighten(c.gold, 0.15), c.waste, 0.42);
    ctx.save();
    ctx.translate(D.x, D.y);
    // thickness
    ctx.beginPath(); ctx.ellipse(7, 3, D.rx, D.ry, 0, 0, TAU); ctx.fillStyle = darken(board, 0.32); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, D.rx, D.ry, 0, 0, TAU); ctx.fillStyle = board; ctx.fill();
    ctx.strokeStyle = darken(board, 0.28); ctx.lineWidth = 3; ctx.stroke();
    ctx.scale(D.rx / D.ry, 1);
    ctx.strokeStyle = alpha(darken(board, 0.18), 0.7); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, D.ry * 0.82, 0, TAU); ctx.stroke();
    // the holes
    ctx.fillStyle = darken(board, 0.55);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 9, 0, 5, 0, TAU); ctx.fill(); }
    // the tube turns with the disc; two tubes would balance it, one is drawn so the eye can follow it
    const blur = this._spin > 0.35;
    ctx.rotate(this._ang);
    if (blur) {
      ctx.strokeStyle = alpha(BLOOD_TONES.mixed, 0.32 * this._spin); ctx.lineWidth = CAP.w + 4;
      ctx.beginPath(); ctx.arc(0, 0, (CAP.r0 + CAP.r1) / 2, 0, TAU); ctx.stroke();
    }
    const L = CAP.r1 - CAP.r0;
    ctx.save();
    rr(ctx, CAP.r0, -CAP.w / 2, L, CAP.w, CAP.w / 2); ctx.clip();
    this._column(ctx, c, CAP.r0, -CAP.w / 2, L, CAP.w, false);
    ctx.restore();
    rr(ctx, CAP.r0, -CAP.w / 2, L, CAP.w, CAP.w / 2);
    ctx.strokeStyle = lighten(c.glass, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    // tape
    ctx.fillStyle = alpha(lighten(c.gold, 0.5), 0.8);
    rr(ctx, CAP.r0 + L * 0.5 - 9, -CAP.w / 2 - 6, 18, CAP.w + 12, 2); ctx.fill();
    ctx.restore();
  }

  /** The blood column, inner end at the left. Cells leave the left and pack at the right. */
  _column(ctx, c, x, y, w, h, grain) {
    const red = STRAIN[this.stage === 3 ? this._strain : 'healthy'];
    const p = this._p, e = p * p * (3 - 2 * p);
    const clear = (1 - red - 0.03) * e;       // pale plasma grows from the inner end
    const pack = red * e;                     // packed cells grow from the outer end
    ctx.fillStyle = mix(BLOOD_TONES.mixed, BLOOD_TONES.plasma, this.stage === 3 ? (0.44 - red) * 0.9 : 0);
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = BLOOD_TONES.plasma; ctx.fillRect(x, y, w * clear, h);
    ctx.fillStyle = BLOOD_TONES.cells; ctx.fillRect(x + w * (1 - pack), y, w * pack, h);
    const coat = w * 0.018 * clamp01((e - 0.5) * 2);
    if (coat > 0) { ctx.fillStyle = BLOOD_TONES.coat; ctx.fillRect(x + w * (1 - pack) - coat, y, coat, h); }
    if (grain) {
      ctx.fillStyle = alpha(darken(BLOOD_TONES.cells, 0.2), 0.75);
      for (const g of GRAIN) {
        const u = clear + (1 - clear - pack - 0.02) * g.u;
        if (e > 0.97) break;
        ctx.beginPath(); ctx.arc(x + w * u, y + 7 + (h - 14) * g.v, 2.4, 0, TAU); ctx.fill();
      }
    }
  }

  _big(ctx, c) {
    const B = BIG;
    ctx.save();
    rr(ctx, B.x, B.y, B.w, B.h, 26); ctx.clip();
    this._column(ctx, c, B.x, B.y, B.w, B.h, true);
    ctx.restore();
    rr(ctx, B.x, B.y, B.w, B.h, 26);
    ctx.strokeStyle = mix(c.glass, c.stroke, 0.35); ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = alpha(lighten(c.glass, 0.8), 0.6); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(B.x + 26, B.y + 10); ctx.lineTo(B.x + B.w - 26, B.y + 10); ctx.stroke();
    const y = B.y + B.h + 24;
    const tag = { bg: c.raised, ink: c.label, size: PHONE ? 22 : 16, display: true };
    pill(ctx, c, 'centre side', B.x + 76, y, tag);
    pill(ctx, c, 'outer end', B.x + B.w - 70, y, tag);
  }

  _tags(ctx, c) {
    const st = this.stage;
    const tag = { bg: c.raised, ink: c.label, size: fs(17), display: true };
    if (st === 0) {
      const lc = alpha(c.labelMuted, 0.9);
      leader(ctx, 136, 66, 268, 118, lc, 1, 0);
      pill(ctx, c, 'cardboard disc', 120, 50, tag);
      leader(ctx, 546, 66, 392, 232, lc, 1, 0);
      pill(ctx, c, 'thin tube of blood', 540, 50, tag);
      pill(ctx, c, 'handle', 70, 272, tag);
      pill(ctx, c, 'string', 192, 216, tag);
      pill(ctx, c, 'no motor', 590, 272, { ...tag, bg: c.good, ink: inkOn(c, c.good) });
      return;
    }
    if (st === 1 && this._p >= 1) pill(ctx, c, 'red cells went outward', 340, 28, { bg: c.good, size: fs(18), display: true });
    if (st === 2) {
      const R = this._rate;
      pill(ctx, c, R === 'fast' ? 'fast pull' : 'slow pull', 620, 300, { bg: c.raised, ink: c.label, size: PHONE ? 19 : 16, display: true });
      drawCard(ctx, c, 14, 16, 170, 76, 1, {});
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(16)); ctx.fillText('time', 99, 36);
      ctx.fillStyle = c.label; ctx.font = font(c, 700, fs(30), true);
      const shown = this._p >= 1 ? T_RUN[R] : Math.round(this._p * T_RUN[R]);
      ctx.fillText(`${shown} min`, 99, 66);
      if (this._compared) pill(ctx, c, 'same layers, four times the wait', 450, 28, { bg: c.good, size: fs(18), display: true });
    }
    if (st === 3) pill(ctx, c, this._strain === 'healthy' ? 'Person A' : 'Person B', 610, 300, { bg: c.raised, ink: c.label, size: PHONE ? 19 : 16, display: true });
    if (st === 3 && this._p >= 1) {
      const a = this._strain === 'anaemia';
      drawCard(ctx, c, 14, 16, 186, 76, 1, {});
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(16)); ctx.fillText('red layer', 107, 36);
      ctx.fillStyle = c.label; ctx.font = font(c, 700, fs(30), true); ctx.fillText(`${Math.round(STRAIN[this._strain] * 100)} %`, 107, 66);
      if (a) pill(ctx, c, 'short: can mean anaemia', 490, 28, { bg: c.warning, size: fs(17), display: true });
    }
    if (st >= 1 && this._p === 0 && !this._going && !this._compared) pill(ctx, c, 'press Pull the handles', 340, 28, { bg: c.accent, size: fs(16), display: true });
  }
}
