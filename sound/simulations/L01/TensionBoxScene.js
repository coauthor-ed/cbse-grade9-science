/**
 * TensionBoxScene - slide "Tight, Loose, and the Box" (L01, blk-l01-s04), 2 beats. New 2026-11-03.
 *
 * b0 the same box twice, side by side. Left "tight" (tension 1): the band swings faster and the
 *    sound arcs leave closer together. Right "loose" (tension 0.3): slower swing, arcs further
 *    apart. Arc spacing = V_ARC / band frequency (the same arc speed on both).
 * b1 left: a student holds the band off the box, stretched between two fingers near the ear;
 *    small faint arcs, tag "softer". Right: the band on the box, the box faces shimmer, bigger
 *    stronger arcs, tag "louder". Same band, same frequency, so the same arc spacing.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, drawBench, pill, alpha, lighten } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { figureFor, solveFigure, paintFigure } from 'simulations/base/kit/SimFigure.js';
import { drawBoxAndBand } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const V_ARC = 100;                         // arc speed (px/s), the same everywhere
const REACH = 190;                         // how far the arcs run (px)
// faster, not louder: the same swing size and the same arc strength and count on both; only the
// band's rate and so the arc spacing (V_ARC / f) differ
const BANDS = {
  tight: { tension: 1, f: 3.0, amp: 16 },
  loose: { tension: 0.3, f: 1.7, amp: 16 },
};
const N_ARCS = 3;
const F1 = 2.2;                            // b1: one band, one frequency
const TEND = 3.4;

// b0 layout: two boxes, opening 230 wide (with depth about 300 each)
const W0 = 230, Y0C = 352, TABLE0 = 352 + W0 * 0.43;
const BOX0 = [{ key: 'tight', x: 30 + W0 / 2 }, { key: 'loose', x: 30 + W0 * 1.3 + 34 + W0 / 2 }];
// b1 layout
const W1 = 212, BOX1 = { x: 468, y: 336 }, TABLE1 = 336 + W1 * 0.43;
const ST = { x: 130, y: 610, height: 420 };

export class TensionBoxScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two boxes with rubber bands. The tight band swings fast and its sound arcs leave close together; the loose band swings slowly and its arcs are further apart. Next, a student holds the band between two fingers near the ear: small faint arcs, softer. The same band on the box: the box shimmers and the arcs are bigger and stronger, louder.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.geo = null;
  }

  enter(stage) { this.cur = Math.max(0, Math.min(1, stage | 0)); }

  busy() { return this.age < TEND; }

  t() { return Math.min(this.age, TEND); }

  draw(ctx, c) {
    const t = this.t();
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 500, {});
    if (this.cur === 0) this._tension(ctx, c, t); else this._noBox(ctx, c, t);
  }

  _arcs(ctx, c, x, y, f, t, o = {}) {
    const lam = V_ARC / f;
    const n = o.n ?? Math.max(2, Math.floor((o.reach ?? REACH) / lam));
    drawSoundArcs(ctx, c, { x, y, dir: o.dir ?? -Math.PI / 2, spread: o.spread ?? 1.15, n, wavelength: lam, speed: V_ARC, r0: o.r0 ?? 16, t, strength: o.strength ?? 1 });
  }

  // ---- b0 -------------------------------------------------------------------------
  _tension(ctx, c, t) {
    drawBench(ctx, c, 14, 666, TABLE0, { h: 520 - TABLE0 });
    for (const b of BOX0) {
      const B = BANDS[b.key];
      const swing = B.amp * Math.sin(TAU * B.f * t);
      const g = drawBoxAndBand(ctx, c, { x: b.x, y: Y0C, w: W0, swing, tension: B.tension, ghost: 0.5, amp: B.amp });
      this._arcs(ctx, c, b.x + W0 * 0.12, g.mouth.y - W0 * 0.24, B.f, t, { n: N_ARCS });
      pill(ctx, c, b.key, b.x + W0 * 0.15, TABLE0 + 32, { ...LBL, bg: c.raised, ink: c.label });
    }
  }

  // ---- b1 -------------------------------------------------------------------------
  _geom() {
    if (this.geo) return this.geo;
    // she faces the band, which is held up beside her head at ear height
    const base = figureFor(this, { role: 'student', x: ST.x, y: ST.y, height: ST.height, facing: 1, i: 3, pose: 'stand', autoReach: false, mood: 'smile' });
    const sk = solveFigure(base);
    const hd = sk.anchors.head;
    const band = { x: hd.x + hd.r * 1.62, y: hd.y + hd.r * 0.5 };
    this.geo = { base, hd, band };
    return this.geo;
  }

  _noBox(ctx, c, t) {
    const G = this._geom();
    const swing = 10 * Math.sin(TAU * F1 * t);
    // left: off the box, between two fingers, near the ear. Solve the hands to the finger bases.
    const wOff = 112, ten = 0.5, sep = wOff * (0.55 + 0.45 * ten), fw = Math.max(14, wOff * 0.11);
    const base = (sx) => ({ x: G.band.x + sx * sep / 2 + sx * 4, y: G.band.y + fw * 3.4 });
    const spec = { ...G.base, hands: [base(1), base(-1)] };
    const sk = solveFigure(spec);
    paintFigure(ctx, c, sk, G.base.look, { layer: 'back' });
    paintFigure(ctx, c, sk, G.base.look, { layer: 'mid' });
    const off = drawBoxAndBand(ctx, c, { x: G.band.x, y: G.band.y, w: wOff, off: true, tension: ten, swing, ghost: 0.5, amp: 10 });
    paintFigure(ctx, c, sk, G.base.look, { layer: 'front', noShadow: true });
    this._arcs(ctx, c, off.band.mid.x, G.band.y - 14, F1, t, { reach: 90, r0: 12, strength: 0.38, spread: 0.9 });
    pill(ctx, c, 'softer', G.band.x + 10, G.band.y - 132, { ...LBL, bg: c.raised, ink: c.label });

    // right: on the box; the box shivers a little with the band
    drawBench(ctx, c, 330, 672, TABLE1, { h: 520 - TABLE1 });
    const sh = Math.sin(TAU * F1 * t);
    ctx.save(); ctx.translate(0.9 * sh, 0);
    const g = drawBoxAndBand(ctx, c, { x: BOX1.x, y: BOX1.y, w: W1, swing: 1.8 * swing, ghost: 0.5, amp: 18 });
    // the faces shimmer: a light pulse on the rim and the inner walls, in time with the band
    const k = 0.25 + 0.25 * Math.abs(sh);
    ctx.strokeStyle = alpha(lighten(c.warning, 0.5), k); ctx.lineWidth = 3;
    ctx.strokeRect(BOX1.x - W1 / 2 + 2, g.mouth.y - W1 * 0.045 + 2, W1 - 4, W1 * 0.86 - 4);
    ctx.fillStyle = alpha(lighten(c.warning, 0.4), 0.12 * Math.abs(sh));
    ctx.fillRect(g.mouth.x, g.mouth.y, g.mouth.w, g.mouth.h);
    ctx.restore();
    this._arcs(ctx, c, BOX1.x + W1 * 0.12, g.mouth.y - W1 * 0.24, F1, t, { reach: 170, strength: 1, spread: 1.3, r0: 20 });
    pill(ctx, c, 'louder', 618, g.mouth.y - 64,{ ...LBL, bg: c.raised, ink: c.label });
  }
}
