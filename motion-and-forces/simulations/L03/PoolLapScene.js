/**
 * PoolLapScene - Sarang's lap of a 25 m pool (Example 4.2; Fig. 4.7).
 * Predict setup (blk-l03-s2, hostRole 'setup' or beat MAX_SAFE_INTEGER): he swims to the far end
 *   and back once (50 s, compressed to about 4 s), the stopwatch runs to 50 s, he rests at the
 *   start. No result, no displacement mark.
 * Explain b0 (blk-l03-n03): the lap replays once; two trails along his lane show the two
 *   25 m lengths (distance travelled 50 m); then the chips "average speed 1 m/s" and
 *   "average velocity 0 m/s" and a zero-displacement dot "s = 0 m" at the start.
 * Kinematics: 1 m/s throughout, position p(t) = t for t <= 25 s, 50 - t after (metres).
 *
 * Reusable pool parts (PoolVelocityScene and the L03 game import this class):
 *   static POOL                    layout: deck, water, lanes, the 0..25 m scale (0 = start wall, 25 = far wall)
 *   poolSpec()                     trackSpec mapping metres to px along the lane (hip of the swimmer)
 *   laneY(i)                       centre y of lane i (0 = top)
 *   drawPool(ctx, c, { scroll })   deck tiles, coping, water with lit and shaded sides, floor lines,
 *                                  lane ropes, ripples (scroll in metres slides them)
 *   drawPoolScale(ctx, c)          the 0..25 m number line under the pool
 *   swimmerX(p, dir)               hip x for a head at p m (head = position; feet stay on a wall at push-off)
 *   drawSwimmer(ctx, c, { x, y, dir, dist, look, height })   SimFigure on his back (top view of a
 *                                  backstroke: head leads, arms windmill from dist), water over the legs
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, darken, lighten, alpha, mix, rr, ellipse, pill, popAt } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawScale, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';

const TAU = Math.PI * 2;
const SARANG = { skin: 1, hairStyle: 'short', hair: 0, outfit: 'tee', top: 's5', bottomStyle: 'shorts', bottom: 'navy' };

export class PoolLapScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A 25 m swimming pool seen from above, with a number line from 0 to 25 m. Sarang swims to the far end and back while a stopwatch runs to 50 s. He swims 50 m in 50 s, so his average speed is 1 m/s, but he ends where he started, so his displacement is 0 m and his average velocity is 0 m/s.';
  /** Pool layout (design px). Water spans wx0..wx1; the scale's 0 and 25 m sit half a body in from the walls. */
  static POOL = { wx0: 40, wx1: 640, top: 130, laneH: 96, lanes: 2, scaleY: 364, swimH: 144 };
  static SARANG = SARANG;        // his figureLook options
  static LAP_S = 4.2;            // screen seconds for the 50 s lap
  static GO = 0.5;

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { const K = this.constructor; return this.age < K.GO + K.LAP_S + (this.isSetup() ? 0.3 : 2.2); }

  // -- reusable pool parts ------------------------------------------------------------------

  poolSpec() {
    const P = this.constructor.POOL;
    return trackSpec({ from: 0, to: 25, x0: P.wx0, x1: P.wx1, y: P.top });
  }

  /**
   * Hip x for a swimmer whose head is at position p (m) swimming dir (1 right, -1 left): the head is
   * the position, so it touches the far wall at 25 m and the start wall at 0 m. Just after a push-off
   * the body cannot pass through the wall, so the feet stay on it until the head is a body clear.
   */
  swimmerX(p, dir, H = this.constructor.POOL.swimH) {
    const P = this.constructor.POOL, hip = this.poolSpec().toPx(p) - dir * 0.5 * H;
    return Math.max(P.wx0 + 0.5 * H, Math.min(P.wx1 - 0.5 * H, hip));
  }

  laneY(i) { const P = this.constructor.POOL; return P.top + P.laneH * (i + 0.5); }

  drawPool(ctx, c, o = {}) {
    const P = this.constructor.POOL, { wx0, wx1, top, laneH, lanes } = P, bot = top + laneH * lanes, w = wx1 - wx0;
    const deck = mix(c.raised, c.gold, 0.2), water = mix(c.water, c.bgSurface, 0.18);
    ctx.save();
    // Deck: tiles round the pool, a lip under it, joints and a gloss stroke per tile.
    const dx0 = wx0 - 26, dx1 = wx1 + 26, dy0 = top - 26, dy1 = bot + 26;
    ctx.save(); ctx.translate(0, 5); rr(ctx, dx0, dy0, dx1 - dx0, dy1 - dy0, 14); ctx.fillStyle = darken(deck, 0.4); ctx.fill(); ctx.restore();
    rr(ctx, dx0, dy0, dx1 - dx0, dy1 - dy0, 14); ctx.fillStyle = deck; ctx.fill();
    ctx.save(); rr(ctx, dx0, dy0, dx1 - dx0, dy1 - dy0, 14); ctx.clip();
    ctx.fillStyle = darken(deck, 0.18);
    for (let x = dx0 + 26; x < dx1; x += 26) ctx.fillRect(x - 1, dy0, 2, dy1 - dy0);
    for (let y = dy0 + 13; y < dy1; y += 13) ctx.fillRect(dx0, y - 1, dx1 - dx0, 2);
    ctx.fillStyle = alpha(lighten(deck, 0.7), 0.7);
    for (let x = dx0 + 4; x < dx1; x += 26) for (let y = dy0 + 3; y < dy1; y += 13) ctx.fillRect(x, y, 10, 2);
    ctx.restore();
    rr(ctx, dx0, dy0, dx1 - dx0, dy1 - dy0, 14); ctx.strokeStyle = darken(deck, 0.42); ctx.lineWidth = 2.5; ctx.stroke();
    // Coping: a pale rim round the water.
    rr(ctx, wx0 - 9, top - 9, w + 18, bot - top + 18, 9); ctx.fillStyle = lighten(deck, 0.35); ctx.fill();
    ctx.strokeStyle = darken(deck, 0.3); ctx.lineWidth = 2; ctx.stroke();
    // Water: lit far side (top), shaded near side (bottom), an inner line under the coping.
    rr(ctx, wx0, top, w, bot - top, 5); ctx.fillStyle = water; ctx.fill();
    ctx.save(); rr(ctx, wx0, top, w, bot - top, 5); ctx.clip();
    ctx.fillStyle = darken(water, 0.14); ctx.fillRect(wx0, top + (bot - top) * 0.62, w, bot - top);
    ctx.fillStyle = alpha(darken(water, 0.35), 0.6); ctx.fillRect(wx0, top, w, 5); ctx.fillRect(wx0, top, 5, bot - top);
    // Floor lines: a dark stripe down each lane with a T near each wall.
    ctx.fillStyle = alpha(darken(water, 0.45), 0.55);
    for (let i = 0; i < lanes; i++) {
      const ly = this.laneY(i);
      ctx.fillRect(wx0 + 36, ly - 3, w - 72, 6);
      ctx.fillRect(wx0 + 36, ly - 12, 6, 24); ctx.fillRect(wx1 - 42, ly - 12, 6, 24);
    }
    // Ripples (fixed places; o.scroll in metres slides them).
    const sp = ((((o.scroll ?? 0) * 21) % 44) + 44) % 44;
    ctx.fillStyle = alpha(lighten(water, 0.6), 0.5);
    for (let i = 0; i < lanes; i++) for (let x = wx0 + 10, j = 0; x < wx1 + 40; x += 44, j++) {
      ellipse(ctx, x - sp + (j % 2) * 16, this.laneY(i) - laneH * 0.28 + ((j + i) % 3) * 7, 11, 2.2); ctx.fill();
    }
    ctx.restore();
    // Lane ropes between lanes: floats in two series tones, a shade under each.
    for (let i = 1; i < lanes; i++) {
      const ry = top + laneH * i;
      for (let x = wx0 + 6, k = 0; x < wx1 - 2; x += 13, k++) {
        const col = k % 8 < 4 ? c.s1 : c.s6;
        ctx.beginPath(); ctx.arc(x, ry, 5, 0, TAU); ctx.fillStyle = col; ctx.fill();
        ctx.beginPath(); ctx.arc(x + 1, ry + 1.5, 3.2, 0, Math.PI); ctx.fillStyle = darken(col, 0.3); ctx.fill();
        ctx.beginPath(); ctx.arc(x - 1.5, ry - 1.5, 1.6, 0, TAU); ctx.fillStyle = alpha(lighten(col, 0.7), 0.9); ctx.fill();
      }
    }
    rr(ctx, wx0, top, w, bot - top, 5); ctx.strokeStyle = darken(water, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
    return { top, bot, wx0, wx1 };
  }

  drawPoolScale(ctx, c) {
    const P = this.constructor.POOL, s = this.poolSpec();
    return drawScale(ctx, c, { vertical: false, at: P.scaleY, p0: s.x0, p1: s.x1, from: 0, to: 25, every: 5, side: 1 });
  }

  /**
   * Sarang from above, on his back: a front-view SimFigure turned so his head leads (dir 1 right,
   * -1 left), hip at (x, y). Arms windmill in turn from dist (metres swum); feet flutter.
   */
  drawSwimmer(ctx, c, o) {
    const H = o.height ?? this.constructor.POOL.swimH, dir = o.dir ?? 1, ph = ((o.dist ?? 0) / 2.4) % 1;
    const shY = -0.8 * H, L = 0.3 * H, hand = (side, th) => ({ x: side * H * (0.15 + 0.05 * Math.abs(Math.sin(th))), y: shY - L * Math.cos(th) });
    const th = TAU * ph, kick = Math.sin(TAU * ph * 3) * 3;
    ctx.save();
    ctx.translate(o.x, o.y); ctx.scale(dir, 1); ctx.rotate(Math.PI / 2); ctx.translate(0, 0.5 * H);
    // wake behind the feet
    ctx.fillStyle = alpha(lighten(c.water, 0.8), 0.55);
    for (let k = 0; k < 3; k++) { ellipse(ctx, (k - 1) * 7, 8 + k * 9, 6 - k, 3); ctx.fill(); }
    // The solver works in a frame-centred copy of this local space (FX, FY), so its logged bounds stay in the frame.
    const FX = 340, FY = 300, at = (q) => ({ x: q.x + FX, y: q.y + FY });
    ctx.save(); ctx.translate(-FX, -FY);
    drawFigure(ctx, c, { x: FX, y: FY, height: H, facing: 0, pose: 'stand', autoReach: false,
      hands: [at(hand(1, th)), at(hand(-1, th + Math.PI))], feet: [at({ x: H * 0.07, y: kick }), at({ x: -H * 0.07, y: -kick })] },
    figureLook(c, o.look ?? SARANG), { noShadow: true });
    ctx.restore();
    // water over the legs and hips, splash at the hand entering the water
    ctx.fillStyle = alpha(mix(c.water, c.bgSurface, 0.3), 0.55);
    ellipse(ctx, 0, -0.18 * H, 0.2 * H, 0.26 * H); ctx.fill();
    const hn = hand(1, th), hf = hand(-1, th + Math.PI), lead = Math.cos(th) > 0.85 ? hn : Math.cos(th + Math.PI) > 0.85 ? hf : null;
    if (lead) { ctx.strokeStyle = alpha(lighten(c.water, 0.9), 0.85); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(lead.x, lead.y, 9, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }

  // -- this scene ---------------------------------------------------------------------------

  /** Slide seconds of the lap since the run began (0 .. 50). */
  lapT() { const K = this.constructor; return clamp01((this.age - K.GO) / K.LAP_S) * 50; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const t = this.lapT(), p = t <= 25 ? t : 50 - t, dir = t < 25 ? 1 : -1, s = this.poolSpec(), y = this.laneY(1);
    this.drawPool(ctx, c, { scroll: t * 0.3 });
    this.drawPoolScale(ctx, c);
    // The two lengths he swims, as trails along his lane (out above the floor line, back below it).
    const tr = (from, to, yy) => {
      if (Math.abs(to - from) < 0.05) return;
      ctx.save(); ctx.strokeStyle = alpha(c.s5ink, 0.75); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.setLineDash([2, 9]);
      ctx.beginPath(); ctx.moveTo(s.toPx(from), yy); ctx.lineTo(s.toPx(to), yy); ctx.stroke(); ctx.restore();
    };
    tr(0, Math.min(t, 25), y - 34);
    if (t > 25) tr(25, 50 - t, y + 34);
    this.drawSwimmer(ctx, c, { x: this.swimmerX(p, dir), y, dir, dist: t });
    drawStopwatch(ctx, c, { x: 600, y: 56, r: 44, seconds: t, text: Math.round(t) + ' s', readout: 'inside' });
    if (!this.isSetup()) this.results(ctx, c, s, y);
  }

  results(ctx, c, s, y) {
    const K = this.constructor, end = K.GO + K.LAP_S;
    if (this.age >= end) {
      const lab = popAt(this.age, end);
      ctx.save(); ctx.globalAlpha *= lab ? lab.alpha : 1;
      for (const [yy, m] of [[y - 34, 8], [y + 34, 17]]) pill(ctx, c, '25 m', s.toPx(m), yy, { size: 26, bg: c.raised });
      ctx.restore();
    }
    const p0 = popAt(this.age, end + 0.5), p1 = popAt(this.age, end + 1.1), pz = popAt(this.age, end + 1.6);
    if (p0) pill(ctx, c, 'average speed 1 m/s', 340, 446, { size: 28, bg: c.s4, scale: p0.scale, alpha: p0.alpha, display: true });
    if (p1) pill(ctx, c, 'average velocity 0 m/s', 340, 494, { size: 28, bg: c.s1, scale: p1.scale, alpha: p1.alpha, display: true });
    if (pz) { ctx.save(); ctx.globalAlpha *= pz.alpha; drawMotionArrow(ctx, c, 's', s.toPx(0), K.POOL.top - 17, { magnitude: 0, label: 's = 0 m' }); ctx.restore(); }
  }
}
