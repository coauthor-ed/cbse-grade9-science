// SpreadScene.js - slide "Sound Goes Every Way" (blk-l03-s01), 2 beats.
// b0: a struck tuning fork at the centre of a field of air particles; compressions spread out
//     as rings in every direction and three listeners (above-left, right, below-left) hear as a ring
//     reaches each one - all three at the same moment, because they are the same distance away.
// b1: every direction but one fades; the fork moves to the left end and the one strip that is
//     left becomes a straight tube of particles with compressions travelling right.
// Every dot is placed by the SimWave field s(d, t); nothing is painted on by hand.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, lerp, alpha, lighten, darken, drawShadow } from 'simulations/base/kit/SimLook.js';
import { sineSource, waveField, drawRings, drawParticleStrip, drawPropagationArrow } from 'simulations/base/kit/SimWave.js';
import { drawTuningFork } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';

const TAU = Math.PI * 2;
const FREQ = 0.6, V = 66;                 // wave on screen: 0.6 Hz, wavelength 110 px
const LAM = V / FREQ;
const CX = 340, CY = 250;                 // the source: middle of the fork prongs
const FORK_H = 262;
const DE = 236;                            // the three listeners all sit this far from the source
const RING = waveField({ source: sineSource({ amp: 16, freq: FREQ }), v: V, falloff: 520 });
const EARS = [
  { a: -Math.PI * 0.79, facing: 1, role: 'student', i: 1 },   // above and to the left, facing the fork
  { a: 0, facing: -1, role: 'child', i: 2 },                 // beside, on the right
  { a: Math.PI * 0.79, facing: 1, role: 'student', i: 3 },    // below and to the left
];
const HEAD_R = 30;                          // listener head radius: a readable face (figure about 250 px tall)
const FX = 58;                              // b1: where the fork ends up, at the tube's left end
const TUBE_H = 160;
const STAND_Y = CY + FORK_H * 0.72;         // the top of the wooden stand under the fork stem

export class SpreadScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static CONTINUOUS = true;                 // a sound wave from a vibrating fork never stops while the beat is on
  static ARIA_LABEL = 'A struck tuning fork in the middle of the air. Rings of crowded air particles spread out from it in every direction and reach ears placed above, beside and behind it at the same moment. Then all directions but one fade, and the sound is followed along one straight tube of air particles.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) { this.cur = stage; }

  /** Glow 0..1 at distance d: how strongly a compression is passing that point now. */
  _listen(d, tt) {
    const peak = RING.ampAt(d) * TAU / LAM;
    if (!(peak > 0)) return 0;
    const k = clamp01((RING.rhoLin(d, tt) - 1) / peak);
    return k * k;
  }

  /** A heavy wooden stand with a clamp block: the fork stands in it, struck and ringing. */
  _stand(ctx, c, x) {
    const y = STAND_Y, w = 104, h = 30, d = 12;
    const wood = darken(c.gold, 0.22);
    drawShadow(ctx, c, x, y + h + 2, w * 0.56, 8);
    ctx.fillStyle = lighten(wood, 0.18);                       // lit top face
    ctx.beginPath(); ctx.moveTo(x - w / 2 + d, y - d); ctx.lineTo(x + w / 2 + d, y - d); ctx.lineTo(x + w / 2, y); ctx.lineTo(x - w / 2, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(wood, 0.28);                        // shaded right side
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2 + d, y - d); ctx.lineTo(x + w / 2 + d, y + h - d); ctx.lineTo(x + w / 2, y + h); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(0, y, 0, y + h);        // front face
    g.addColorStop(0, wood); g.addColorStop(1, darken(wood, 0.16));
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, y, w, h);
    ctx.strokeStyle = alpha(darken(wood, 0.4), 0.35); ctx.lineWidth = 2;  // grain
    for (const gy of [0.3, 0.55, 0.8]) { ctx.beginPath(); ctx.moveTo(x - w / 2 + 6, y + h * gy); ctx.bezierCurveTo(x - 10, y + h * gy - 3, x + 20, y + h * gy + 3, x + w / 2 - 6, y + h * gy); ctx.stroke(); }
    ctx.strokeStyle = alpha(darken(wood, 0.5), 0.6); ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y, w, h);
    const bw = 26, bh = 18;                                     // the clamp block that holds the stem
    ctx.fillStyle = darken(wood, 0.12); ctx.fillRect(x - bw / 2, y - d / 2 - bh, bw, bh);
    ctx.fillStyle = lighten(wood, 0.25); ctx.fillRect(x - bw / 2, y - d / 2 - bh, bw, 4);
    ctx.fillStyle = darken(wood, 0.35); ctx.fillRect(x + bw / 2 - 5, y - d / 2 - bh, 5, bh);
  }

  _fork(ctx, c, x, t) {
    this._stand(ctx, c, x);
    return drawTuningFork(ctx, c, { x, y: STAND_Y - 6, h: FORK_H, vib: 0.85, t, freq: 6 });
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    const u = this.age;
    if (this.cur === 0) this._every(ctx, c, u);
    else this._one(ctx, c, u);
  }

  _every(ctx, c, u) {
    const tt = u + 2.0;                       // the first ring is already part way out on landing
    // the listeners: where each head sits (measured with an invisible pass) so the air keeps clear of it
    const ears = EARS.map((e) => this._place({ ...e, x: CX + Math.cos(e.a) * DE, y: CY + Math.sin(e.a) * DE }));
    // the air fills the frame, every particle vibrating about its own place; holes keep the fork and people clear
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 680, 520);
    for (const e of ears) { ctx.moveTo(e.mx + e.mr + 4, e.my); ctx.arc(e.mx, e.my, e.mr + 4, 0, TAU); }
    ctx.rect(CX - 44, STAND_Y - FORK_H - 10, 88, FORK_H + 4);
    ctx.rect(CX - 58, STAND_Y - 24, 132, 60);
    ctx.clip('evenodd');
    drawRings(ctx, c, { cx: CX, cy: CY, R: 460, field: RING, t: tt, spacing: 12, r: 3.2, source: false, guides: true });
    ctx.restore();
    // a compression keeps arriving at every listener at the same moment: the ears always show it
    const listen = 0.3 + 0.7 * this._listen(DE, tt);
    for (const e of ears) this._listener(ctx, c, e, listen, u);
    this._fork(ctx, c, CX, u);
  }

  /** Where a listener goes: a SimFigure, side view facing the fork, sized so its head radius is HEAD_R,
   *  moved so its ear sits on the ring point (e.x, e.y); a round window frames head and shoulders. */
  _place(e) {
    // Solved standing in the frame (feet on the bottom edge), then drawn shifted by (dx, dy) so the ear lands on
    // the ring point; the round window hides the body below the shoulders.
    const role = e.role, r100 = solveFigure(figureFor(this, { role, i: e.i, x: 340, y: 510, height: 100, facing: e.facing })).anchors.head.r;
    const H = 100 * HEAD_R / r100;
    const spec = figureFor(this, { role, i: e.i, x: e.x, y: 516, height: H, facing: e.facing, pose: 'relax' });
    const h = solveFigure(spec).anchors.head;
    const ex = h.x - e.facing * h.r * 0.22, ey = h.y + h.r * 0.12;          // the ear on a side-view head
    const dx = e.x - ex, dy = e.y - ey, hx = h.x + dx, hy = h.y + dy;
    return { ...e, spec, dx, dy, hx, hy, mx: hx + e.facing * h.r * 0.15, my: hy + h.r * 0.95, mr: h.r * 2.05 };
  }

  /** A listener in a round window (backdrop disc, rim), with a soft glow at the ear as each compression arrives. */
  _listener(ctx, c, e, listen, t) {
    const { mx, my, mr } = e;
    ctx.save();
    const bg = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.4, mr * 0.1, mx, my, mr);
    bg.addColorStop(0, lighten(c.bgSurface, 0.06)); bg.addColorStop(1, darken(c.bgSurface, 0.08));
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
    ctx.clip();
    ctx.translate(e.dx, e.dy);
    drawFigure(ctx, c, e.spec, { ...e.spec.look, t });
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.28); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.stroke();
    const gr = ctx.createRadialGradient(e.x, e.y, 2, e.x, e.y, HEAD_R * 1.1);
    gr.addColorStop(0, alpha(c.s5, 0.75 * listen)); gr.addColorStop(1, alpha(c.s5, 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y, HEAD_R * 1.1, 0, TAU); ctx.fill();
    ctx.restore();
  }

  _one(ctx, c, u) {
    const k = inOutSine(clamp01((u - 0.3) / 1.2));     // every direction but one fades
    const m = inOutSine(clamp01((u - 1.9) / 1.3));     // the strip becomes the tube, the fork moves left
    const fx = lerp(CX, FX, m);
    const tt = u + 6;
    if (m < 1) {
      ctx.save(); ctx.globalAlpha *= 1 - m;
      drawRings(ctx, c, { cx: fx, cy: CY, R: 340 + 260 * m, field: RING, t: tt, spacing: 11, r: 3.2, source: false,
        strip: { angle: 0, width: TUBE_H - 20, k } });
      ctx.restore();
    }
    if (m > 0) {
      const x0 = fx + 34, w = 676 - x0;
      const F = waveField({ source: sineSource({ amp: 11, freq: FREQ }), v: V, origin: x0 });
      ctx.save(); ctx.globalAlpha *= m;
      drawParticleStrip(ctx, c, { x: x0, y: CY - TUBE_H / 2, w, h: TUBE_H, field: F, t: tt, spacing: 11, r: 3.4, tube: true });
      ctx.restore();
      const a = clamp01((u - 3.3) / 0.6);
      if (a > 0) {
        ctx.save(); ctx.globalAlpha *= a;
        drawPropagationArrow(ctx, c, { x: x0 + 150, y: CY + TUBE_H / 2 + 40, len: 300, label: 'one direction', side: 'below' });
        ctx.restore();
      }
    }
    this._fork(ctx, c, fx, u);
  }
}
