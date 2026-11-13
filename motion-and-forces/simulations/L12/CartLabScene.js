/**
 * CartLabScene - slide blk-l14-s1 "Push harder, speed up faster" (2 beats; Activity 6.3, Fig 6.17). MODE 'lab'.
 * The cart lab, side view: a table top, a start line, a pipe clamped at the right edge, a cart made from a
 * cardboard box (flaps, two pencil axles, four ball-bearing wheels), a thread from the cart's front over the
 * pipe down to a paper cup with coins. Thread length is fixed: the cup falls by the distance the cart runs.
 *   b0 'hypothesis' two lanes, a ball on each; your hand gives the top ball a gentle push (short F arrow) and
 *                   the bottom ball a hard push (long F arrow), same contact time; then the top ball moves
 *                   slowly (small dot gaps), the bottom fast (large gaps). Rest: both lanes with their dots.
 *   b1 'cart'       the apparatus builds in (0.4 s steps), then the cup falls and the cart runs toward the pipe,
 *                   pulled by the thread (constant F arrow); equal-time dots with growing gaps. The picture stops
 *                   about half way (BIG_CAP), so at rest the F arrow "pull of the thread" still shows.
 * MODE 'double' (CartDoubleScene, blk-l12-n01, 2 beats):
 *   d0 'time'   two runs stacked, same distance: "cup" and "double the coins" (a2 = 1.8 a1, T2 = T1 / sqrt 1.8);
 *               stopwatches T1 and T2; the lower cart arrives first; tag a1 / a2 = T2 sq / T1 sq writes on.
 *   d1 'larger' acceleration bars a1 and a2 = 1.8 a1, a dashed outline at 2 a1; "friction on the wheels".
 * MODE 'load' (CartLoadScene, predict blk-l14-s2 setup + explain blk-l14-s3, 3 beats):
 *   setup       the loaded cart at the start line, the same cup; nothing runs. "same cup, double the mass of the cart".
 *   l0 'heavier' two runs stacked, same cup: "cart" and "cart, double mass" (a = 0.55 x); bars a and the smaller one.
 *   l1 'law'     a law card a = F / m, F = ma; a cart with "net force" and "acceleration" arrows the same way.
 *   l2 'newton'  a 1 kg block, F 1 N, a 1 m/s sq; an open palm holding a 100 g mass, about 1 N up into it.
 * Physics: from rest under a constant pull, x = 1/2 a t sq; a run of D px takes T = sqrt(2 D / a). Every frame is
 * a function of the beat and its age only. PushLetGoScene subclasses this file for its floor and hand.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, luma, font, rr, drawShadow } from 'simulations/base/kit/SimLook.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawBall, drawCrate, drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { propRig, drawGround, drawBlock } from 'simulations/base/kit/SimProps.js';
import { trackSpec, drawStrobe } from 'simulations/base/kit/SimTrack.js';
import { drawMotionArrow, drawSurface } from '../shared/MotionCast.js';
import { drawTag, drawSheet, DIM } from '../shared/MotionGraph.js';
import { drawForce, drawBoxOn } from '../shared/ForceCast.js';

const TAU = Math.PI * 2;
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const SQ = '\u00b2';
// b1 (one big lab): table top Y, floor, run D; cart back starts at the start line
const BIG = { x0: 24, x1: 600, Y: 236, floor: 505, k: 1.6 };
// the run is timed over BIG_D (cart to the pipe) but the picture stops at BIG_CAP px, before the pipe,
// so the constant pull of the thread can stay on at rest
const BIG_D = 260, BIG_T = 2.6, BIG_T0 = 2.6, BIG_DT = 0.52, BIG_CAP = 128, BIG_TC = BIG_T * Math.sqrt(BIG_CAP / BIG_D);
// stacked lanes
const LANE = (top) => ({ x0: 190, x1: 600, Y: top + 82, floor: top + 252, k: 0.78, top });
const LANES = [LANE(0), LANE(262)];
const LT0 = 0.6;
const T1 = 3.0, T2D = T1 / Math.sqrt(1.8);                   // double the coins: a2 = 1.8 a1
const TL1 = 2.2, TL2 = TL1 / Math.sqrt(0.55);                // double the cart mass: a = 0.55 a1
// b0 balls
const B0 = { floors: [214, 454], x0: 128, r: 30, tc: 0.45, tg: 2.4, t0: 0.6, v: [70, 200], dt: 0.4 };

export class CartLabScene extends SimScene {
  static MODE = 'lab';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static BEAT_MAPS = {};
  static ARIA_LABEL = 'Push harder, speed up faster. A hand gives one ball a gentle push and another ball a hard push for the same short time: the gently pushed ball then moves slowly, leaving closely spaced dots at equal times, and the hard pushed ball moves fast, with widely spaced dots. Then the cart lab: a cart made from a cardboard box on four wheels stands at a start line on a table. A thread tied to its front passes over a pipe at the edge of the table and holds a paper cup with coins. As the cup falls, the thread pulls the cart with a constant force, and the cart speeds up: the dots it leaves at equal times get farther apart until it reaches the pipe.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return false; }
  busy() {
    const m = this.constructor.MODE;
    if (m === 'double') return this.age < (this.cur === 0 ? LT0 + T1 + 1.4 : 3.2);
    if (m === 'load') return this.isSetup() ? this.age < 1.4 : this.age < [LT0 + TL2 + 1.4, 2.4, 2.8][Math.min(this.cur, 2)];
    return this.age < (this.cur === 0 ? B0.t0 + B0.tc + B0.tg + 0.8 : BIG_T0 + BIG_TC + 0.8);
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const m = this.constructor.MODE;
    if (m === 'double') return this.cur === 0 ? this.doubleTime(ctx, c) : this.doubleLarger(ctx, c);
    if (m === 'load') {
      if (this.isSetup()) return this.loadSetup(ctx, c);
      return [this.loadHeavier, this.loadLaw, this.loadNewton][Math.min(this.cur, 2)].call(this, ctx, c);
    }
    if (this.cur === 0) this.hypothesis(ctx, c); else this.cartRun(ctx, c);
  }

  // -- shared drawing parts ------------------------------------------------------------------------------
  /** The lighter of label and surface: paper, a cup, tape. */
  pale(c) { return darken(luma(c.label) > luma(c.bgSurface) ? c.label : c.bgSurface, 0.04); }
  skin(c) { return figureLook(c, { skin: 2 }).skin; }

  /** The ideal floor (zero friction): the L10/L11 glass surface with a sheen line and a dashed outline edge. */
  idealFloor(ctx, c, x0, x1, y, h, o = {}) {
    const base = mix(this.pale(c), c.glass, 0.5), w = x1 - x0, R = 8;
    const path = () => rr(ctx, x0, y, w, h, R);
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.save(); ctx.translate(0, 6); path(); ctx.fillStyle = alpha(darken(base, 0.5), 0.55); ctx.fill(); ctx.restore();
    path(); ctx.fillStyle = base; ctx.fill();
    ctx.save(); path(); ctx.clip();
    const g = ctx.createLinearGradient(x0, y, x0, y + h); g.addColorStop(0, lighten(base, 0.5)); g.addColorStop(1, darken(base, 0.05));
    ctx.fillStyle = g; ctx.fillRect(x0, y, w, h);
    for (const [sx, sw] of [[0.1, 160], [0.5, 60], [0.72, 120]]) {
      const gx = x0 + w * sx; ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + sw, y); ctx.lineTo(gx + sw - h * 0.7, y + h); ctx.lineTo(gx - h * 0.7, y + h); ctx.closePath();
      ctx.fillStyle = alpha(lighten(base, 0.95), 0.5); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = alpha(lighten(base, 0.5), 0.6); ctx.lineWidth = 1.5; rr(ctx, x0 + 4, y + 4, w - 8, h - 8, R - 3); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(c.glass, 0.7), 0.9); ctx.lineWidth = 2; ctx.lineCap = 'round';          // sheen line
    ctx.beginPath(); ctx.moveTo(x0 + 10, y + 4); ctx.lineTo(x1 - 10, y + 4); ctx.stroke();
    ctx.setLineDash([10, 9]); ctx.lineWidth = 3.5; ctx.strokeStyle = darken(c.glass, 0.35);
    path(); ctx.stroke();
    ctx.restore();
  }

  /** Equal-time dots on a surface line y at px positions xs. */
  dots(ctx, c, xs, y, o = {}) {
    if (!xs.length) return;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    drawStrobe(ctx, c, trackSpec({ from: 0, to: 680, x0: 0, x1: 680, y }), { at: xs, marks: 'dots' });
    ctx.restore();
  }

  /** Bold text. */
  word(ctx, c, text, x, y, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(c, o.weight ?? 800, o.size ?? 26, true); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = o.col ?? c.label; ctx.fillText(text, x, y);
    ctx.restore();
  }

  /** A tag with a thin leader line from its box to (tx, ty). */
  leader(ctx, c, box, tx, ty, o = {}) {
    if (!box) return;
    const bx = Math.max(box.x, Math.min(tx, box.x + box.w)), by = ty > box.y + box.h ? box.y + box.h : ty < box.y ? box.y : box.y + box.h / 2;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.strokeStyle = o.col ?? c.annot; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.beginPath(); ctx.arc(tx, ty, 4, 0, TAU); ctx.fillStyle = o.col ?? c.annot; ctx.fill();
    ctx.restore();
  }

  /** A thick round-capped limb: rim, fill, a lit line along the top. */
  limb(ctx, x0, y0, x1, y1, w, col) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = w + 5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = (y1 - y0) / L, ny = -(x1 - x0) / L, s = ny > 0 ? -1 : 1, off = w * 0.28 * s;
    ctx.strokeStyle = darken(col, 0.16); ctx.lineWidth = w * 0.3;
    ctx.beginPath(); ctx.moveTo(x0 - nx * off, y0 - ny * off); ctx.lineTo(x1 - nx * off, y1 - ny * off); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(col, 0.45), 0.7); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0 + nx * off * 1.2, y0 + ny * off * 1.2); ctx.lineTo(x1 + nx * off * 1.2, y1 + ny * off * 1.2); ctx.stroke();
    ctx.restore();
  }

  /**
   * Your hand, side view (a kit gap: the kit has no standalone hand). P = middle of the palm face (the contact).
   * o.dir = the way the fingers point (radians; -PI/2 up), o.palm = +1 palm on the left of the fingers' travel
   * turned clockwise (dir -PI/2, palm 1: palm faces right), o.arm = where the sleeve leaves the frame, o.len.
   */
  hand(ctx, c, P, o = {}) {
    const L = o.len ?? 80, th = o.dir ?? -Math.PI / 2, face = o.palm ?? 1, back = o.view === 'back', pv = back ? 0.23 : 0.17;
    const ux = Math.cos(th), uy = Math.sin(th), vx = -uy * face, vy = ux * face;
    const W = { x: P.x - ux * 0.27 * L - vx * pv * L, y: P.y - uy * 0.27 * L - vy * pv * L };
    const A = o.arm ?? { x: W.x - 220, y: W.y + 10 }, skin = this.skin(c), sleeve = c.s4, rim = darken(skin, 0.4);
    const fl = Math.hypot(W.x - A.x, W.y - A.y) || 1, fx = (W.x - A.x) / fl, fy = (W.y - A.y) / fl;
    const C = { x: W.x - fx * 0.32 * L, y: W.y - fy * 0.32 * L };
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    this.limb(ctx, C.x, C.y, W.x - fx * 0.02 * L, W.y - fy * 0.02 * L, 0.28 * L, skin);              // wrist
    this.limb(ctx, A.x, A.y, C.x, C.y, 0.44 * L, sleeve);                                            // sleeve
    ctx.save(); ctx.lineCap = 'butt'; ctx.strokeStyle = darken(sleeve, 0.22); ctx.lineWidth = 0.46 * L;  // cuff band
    ctx.beginPath(); ctx.moveTo(C.x - fx * 0.12 * L, C.y - fy * 0.12 * L); ctx.lineTo(C.x, C.y); ctx.stroke(); ctx.restore();
    ctx.translate(W.x, W.y); ctx.transform(ux, uy, vx, vy, 0, 0);                                    // local: u along the fingers, v to the palm
    const fill = (path, col, shade) => {
      path(); ctx.fillStyle = col; ctx.fill();
      if (shade) { ctx.save(); path(); ctx.clip(); ctx.fillStyle = darken(col, 0.13); ctx.fillRect(-L, shade * L, 3 * L, L); ctx.restore(); }
      path(); ctx.strokeStyle = rim; ctx.lineWidth = 2.2; ctx.stroke();
    };
    if (back) {                                                                                       // back of the hand: four fingers side by side
      const F = [[-0.165, 0.84], [-0.055, 0.98], [0.055, 0.95], [0.165, 0.84]];
      for (const [v, len] of F) {
        fill(() => rr(ctx, 0.3 * L, (v - 0.055) * L, (len - 0.3) * L, 0.11 * L, 0.055 * L), skin, null);
        ctx.strokeStyle = alpha(rim, 0.55); ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        for (const u of [0.62, 0.76]) { if (u < len - 0.06) { ctx.beginPath(); ctx.moveTo(u * L, (v - 0.03) * L); ctx.lineTo(u * L, (v + 0.03) * L); ctx.stroke(); } }
        ctx.beginPath(); ctx.ellipse((len - 0.07) * L, v * L, 0.045 * L, 0.035 * L, 0, 0, TAU); ctx.fillStyle = lighten(skin, 0.35); ctx.fill(); ctx.strokeStyle = alpha(rim, 0.7); ctx.lineWidth = 1.3; ctx.stroke();
      }
      ctx.save(); ctx.translate(0.14 * L, -0.2 * L); ctx.rotate(-0.55);                              // thumb, off the far edge
      fill(() => rr(ctx, 0, -0.06 * L, 0.36 * L, 0.12 * L, 0.06 * L), skin, null);
      ctx.beginPath(); ctx.ellipse(0.29 * L, -0.005 * L, 0.045 * L, 0.035 * L, 0, 0, TAU); ctx.fillStyle = lighten(skin, 0.35); ctx.fill();
      ctx.restore();
      fill(() => rr(ctx, -0.05 * L, -0.24 * L, 0.5 * L, 0.47 * L, 0.16 * L), skin, null);             // back of the hand
      ctx.save(); rr(ctx, -0.05 * L, -0.24 * L, 0.5 * L, 0.47 * L, 0.16 * L); ctx.clip();
      ctx.fillStyle = darken(skin, 0.12); ctx.fillRect(-L, 0.1 * L, 3 * L, L);                      // shade on the lower side
      ctx.restore();
      ctx.strokeStyle = alpha(rim, 0.5); ctx.lineWidth = 1.6;
      for (const v of [-0.165, -0.055, 0.055, 0.165]) { ctx.beginPath(); ctx.arc(0.4 * L, v * L, 0.04 * L, Math.PI * 0.6, Math.PI * 1.4, true); ctx.stroke(); }   // knuckles
      ctx.fillStyle = alpha(lighten(skin, 0.45), 0.65); ctx.fillRect(0.02 * L, -0.2 * L, 0.34 * L, 2.5);
      ctx.restore();
      return;
    }
    fill(() => rr(ctx, 0.42 * L, -0.17 * L, 0.46 * L, 0.18 * L, 0.09 * L), darken(skin, 0.12));       // fingers behind
    fill(() => rr(ctx, -0.05 * L, -0.18 * L, 0.56 * L, 0.36 * L, 0.15 * L), skin, 0.07);             // palm
    fill(() => rr(ctx, 0.4 * L, -0.08 * L, 0.6 * L, 0.24 * L, 0.12 * L), skin, 0.1);                // near finger
    ctx.strokeStyle = alpha(rim, 0.6); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (const u of [0.64, 0.82]) { ctx.beginPath(); ctx.moveTo(u * L, -0.06 * L); ctx.lineTo(u * L, 0.04 * L); ctx.stroke(); }   // finger creases
    ctx.beginPath(); ctx.ellipse(0.9 * L, -0.045 * L, 0.06 * L, 0.028 * L, 0, 0, TAU); ctx.fillStyle = lighten(skin, 0.35); ctx.fill();   // nail
    ctx.strokeStyle = alpha(rim, 0.7); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = alpha(lighten(skin, 0.45), 0.65); ctx.fillRect(0.05 * L, -0.15 * L, 0.42 * L, 2.5);   // lit back of the hand
    ctx.save(); ctx.translate(0.06 * L, 0.06 * L); ctx.rotate(0.3);                                  // thumb, along the palm
    fill(() => rr(ctx, 0, -0.065 * L, 0.34 * L, 0.13 * L, 0.065 * L), skin, 0.03);
    ctx.restore();
    ctx.restore();
  }

  /** A table: two legs to the floor, the kit table-top slab (things stand on Y). */
  table(ctx, c, L, o = {}) {
    const wood = darken(c.gold, 0.28), k = L.k;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    for (const lx of [L.x0 + 22 * k, L.x1 - 34 * k]) {
      drawShadow(ctx, c, lx + 6 * k, L.floor, 16 * k, 4, 0.8);
      rr(ctx, lx, L.Y + 20, 12 * k, L.floor - L.Y - 20, 3); ctx.fillStyle = darken(wood, 0.18); ctx.fill();
      ctx.fillStyle = alpha(lighten(wood, 0.3), 0.7); ctx.fillRect(lx + 2, L.Y + 24, 3, L.floor - L.Y - 30);
      rr(ctx, lx, L.Y + 20, 12 * k, L.floor - L.Y - 20, 3); ctx.strokeStyle = darken(wood, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    }
    drawGround(ctx, c, propRig({ x0: L.x0, x1: L.x1, groundY: L.Y }), { kind: 'table' });
    ctx.restore();
  }

  /** The start line: a strip of tape across the table top and down its front edge. */
  startLine(ctx, c, x, Y, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    rr(ctx, x - 4, Y - 3, 8, 31, 2); ctx.fillStyle = this.pale(c); ctx.fill(); ctx.strokeStyle = c.annot; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  /** The pipe, end on (hollow), on a clamp at the table edge x1. Returns { x, y, r }. */
  pipe(ctx, c, L, ty, o = {}) {
    const k = L.k, r = 10 * k, x = L.x1 + 22 * k, y = ty + r, steel = mix(c.bgSurface, c.label, 0.35);
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    const part = (px, py, w, h) => { rr(ctx, px, py, w, h, 3); ctx.fillStyle = steel; ctx.fill(); ctx.fillStyle = alpha(lighten(steel, 0.4), 0.8); ctx.fillRect(px + 2, py + 2, 3, h - 4); rr(ctx, px, py, w, h, 3); ctx.strokeStyle = darken(steel, 0.42); ctx.lineWidth = 2.2; ctx.stroke(); };
    part(L.x1 - 2, y - 3, 7 * k, L.Y + 34 * k - y + 3);                       // upright of the clamp, on the table edge
    part(L.x1, y - 3.5 * k, x - L.x1, 7 * k);                                  // arm out to the pipe
    part(L.x1 - 32 * k, L.Y + 26, 38 * k, 9 * k);                             // jaw under the slab
    part(L.x1 - 24 * k, L.Y + 35 * k, 6 * k, 16 * k);                         // screw
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = steel; ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, TAU); ctx.fillStyle = alpha(lighten(steel, 0.5), 0.7); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, TAU); ctx.fillStyle = darken(steel, 0.55); ctx.fill();   // the bore
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.strokeStyle = darken(steel, 0.45); ctx.lineWidth = 2.2; ctx.stroke();
    ctx.restore();
    return { x, y, r };
  }

  /** The paper cup, rim centre (cx, top), with n coins heaped above the rim and a bridle to a knot. */
  cup(ctx, c, cx, top, n, k = 1, o = {}) {
    const wt = 25 * k, wb = 18 * k, h = 50 * k, paper = this.pale(c), band = c.s1;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    const knot = { x: cx, y: top - 18 * k };
    ctx.strokeStyle = mix(c.label, c.bgSurface, 0.35); ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(cx - wt + 2, top); ctx.lineTo(knot.x, knot.y); ctx.lineTo(cx + wt - 2, top); ctx.stroke();
    const COINS = [[-9, 0], [9, 0], [0, -5], [-12, -7], [11, -9], [-3, -12], [6, -16], [-6, -19]];
    for (let i = 0; i < Math.min(n, COINS.length); i++) {                       // coins heaped in the mouth
      const [dx, dy] = COINS[i], x = cx + dx * k, y = top + 2 * k + dy * k, g = c.gold;
      rr(ctx, x - 11 * k, y - 1, 22 * k, 5 * k, 2); ctx.fillStyle = darken(g, 0.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y - 1, 11 * k, 4 * k, 0, 0, TAU); ctx.fillStyle = lighten(g, 0.1); ctx.fill();
      ctx.strokeStyle = darken(g, 0.45); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x - 3 * k, y - 2, 4 * k, 1.4 * k, 0, 0, TAU); ctx.fillStyle = alpha(lighten(g, 0.6), 0.9); ctx.fill();
    }
    const path = () => { ctx.beginPath(); ctx.moveTo(cx - wt, top + 3 * k); ctx.lineTo(cx + wt, top + 3 * k); ctx.lineTo(cx + wb, top + h); ctx.lineTo(cx - wb, top + h); ctx.closePath(); };
    path(); ctx.fillStyle = paper; ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.fillStyle = darken(paper, 0.12); ctx.fillRect(cx + wb * 0.35, top, wt * 2, h + 4);            // shade side
    ctx.fillStyle = alpha(band, 0.85); ctx.fillRect(cx - wt, top + h * 0.42, wt * 2, h * 0.2);       // printed band
    ctx.fillStyle = alpha(lighten(paper, 0.6), 0.8); ctx.fillRect(cx - wt * 0.7, top + 8 * k, 3, h * 0.7);
    ctx.restore();
    path(); ctx.strokeStyle = darken(paper, 0.42); ctx.lineWidth = 2.2; ctx.stroke();
    rr(ctx, cx - wt - 2, top + 1, 2 * wt + 4, 5 * k, 2.5); ctx.fillStyle = lighten(paper, 0.2); ctx.fill(); ctx.stroke();   // rolled rim
    ctx.restore();
    return { knot, top, bottom: top + h, x0: cx - wt, x1: cx + wt };
  }

  /** One ball-bearing wheel on a pencil axle (end on), turned by ang. */
  bearing(ctx, c, x, y, r, ang) {
    const steel = mix(c.bgSurface, c.label, 0.4), dark = darken(steel, 0.5);
    ctx.beginPath(); ctx.arc(x, y + 1.5, r, 0, TAU); ctx.fillStyle = dark; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = steel; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, TAU); ctx.fillStyle = darken(steel, 0.3); ctx.fill();   // race gap
    for (let i = 0; i < 7; i++) {                                                // the balls
      const a = ang + (i * TAU) / 7, bx = x + Math.cos(a) * r * 0.6, by = y + Math.sin(a) * r * 0.6;
      ctx.beginPath(); ctx.arc(bx, by, r * 0.15, 0, TAU); ctx.fillStyle = lighten(steel, 0.35); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, TAU); ctx.fillStyle = steel; ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.4, r * 0.22, 0, TAU); ctx.fillStyle = alpha(lighten(steel, 0.6), 0.8); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();                                                             // pencil end: yellow hexagon, graphite core
    for (let i = 0; i < 6; i++) { const a = (i * TAU) / 6; const px = x + Math.cos(a) * r * 0.3, py = y + Math.sin(a) * r * 0.3; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fillStyle = c.gold; ctx.fill(); ctx.strokeStyle = darken(c.gold, 0.45); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.11, 0, TAU); ctx.fillStyle = mix(c.bgDeep ?? c.bgSurface, c.labelMuted, 0.2); ctx.fill();
  }

  /** The cardboard-box cart, back at bx, standing on Y. o: { k, load, s (px run, turns the wheels), alpha }. */
  labCart(ctx, c, bx, Y, o = {}) {
    const k = o.k ?? 1, w = 140 * k, h = 58 * k, wr = 12 * k, cx = bx + w / 2;
    const bottom = Y - 6 * k, top = bottom - h, axY = Y - wr, card = mix(mix(c.gold, c.flame ?? c.s8, 0.32), c.labelMuted, 0.3);
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    drawShadow(ctx, c, cx, Y + 2, w * 0.52, 5, 0.9);
    const flap = (x, dir) => {                                                    // an end flap folded outward
      const fl = 26 * k, a = dir < 0 ? Math.PI + 0.75 : -0.75, ex = x + Math.cos(a) * fl, ey = top + Math.sin(a) * fl;
      ctx.beginPath(); ctx.moveTo(x, top + 1); ctx.lineTo(ex, ey); ctx.lineTo(ex + dir * 1, ey + 6 * k); ctx.lineTo(x + dir * 2, top + 6 * k); ctx.closePath();
      ctx.fillStyle = lighten(card, 0.12); ctx.fill(); ctx.strokeStyle = darken(card, 0.45); ctx.lineWidth = 2; ctx.stroke();
    };
    flap(bx + 2, -1); flap(bx + w - 2, 1);
    if (o.load) {                                                                 // extra load: two blocks in the box
      const rig = propRig({ x0: 0, scale: 1, groundY: top + h * 0.55 });
      drawBlock(ctx, c, rig, bx + w * 0.33, { w: 48 * k, h: 62 * k, tone: 5 });
      drawBlock(ctx, c, rig, bx + w * 0.67, { w: 44 * k, h: 52 * k, tone: 7 });
    }
    drawCrate(ctx, c, { x: cx, y: bottom, w, h, kind: 'carton', held: true });
    const ang = (o.s ?? 0) / wr;
    for (const f of [0.2, 0.8]) this.bearing(ctx, c, bx + w * f, axY, wr, ang);
    ctx.restore();
    return { back: bx, front: bx + w, cx, top, bottom, ty: top + h * 0.45, wheels: [0.2, 0.8].map((f) => ({ x: bx + w * f, y: axY, r: wr })) };
  }

  /**
   * The whole lab on L at run s (px from the start line). o: { load, coins, D (run), built: [table, start, pipe,
   * cart, thread, cup] alphas, alpha }. Returns { cart, pipe, cup, start }.
   */
  lab(ctx, c, L, s, o = {}) {
    const k = L.k, D = o.D, w = 140 * k, b = o.built ?? [1, 1, 1, 1, 1, 1];
    const frontEnd = L.x1 - 6 * k, start = frontEnd - D - w;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    if (b[0] > 0) this.table(ctx, c, L, { alpha: b[0] });
    if (b[1] > 0) this.startLine(ctx, c, start, L.Y, { alpha: b[1] });
    const ty = L.Y - 6 * k - 58 * k * 0.55;
    let pipe = null;
    if (b[2] > 0) pipe = this.pipe(ctx, c, L, ty, { alpha: b[2] });
    else pipe = { x: L.x1 + 22 * k, y: ty + 10 * k, r: 10 * k };
    if (o.under) o.under(start);
    const cupTop = L.Y + 22 * k + s;
    if (b[4] > 0) {                                                               // the thread: cart front, over the pipe, down to the cup
      ctx.save(); ctx.globalAlpha *= b[4]; ctx.strokeStyle = mix(c.label, c.bgSurface, 0.3); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(start + w + s, ty); ctx.lineTo(pipe.x, ty); ctx.arc(pipe.x, pipe.y, pipe.r, -Math.PI / 2, 0); ctx.lineTo(pipe.x + pipe.r, cupTop - 18 * k); ctx.stroke();
      ctx.restore();
    }
    let cup = null;
    if (b[5] > 0) cup = this.cup(ctx, c, pipe.x + pipe.r, cupTop, o.coins ?? 4, k, { alpha: b[5] });
    let cart = null;
    if (b[3] > 0) cart = this.labCart(ctx, c, start + s, L.Y, { k, load: o.load, s, alpha: b[3] });
    ctx.restore();
    return { cart, pipe, cup, start, ty, cupTop };
  }

  /** Run s(t) for a lane: x = 1/2 a t sq over D px in T s. */
  runS(D, T, t) { const u = clamp01(t / T); return D * u * u; }

  /** A horizontal acceleration bar in the a colour (Quill body), label left. */
  bar(ctx, c, x, y, len, label, o = {}) {
    const h = o.h ?? 34, col = c.s2;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    if (len > 2) {
      ctx.save(); ctx.translate(0, 4); rr(ctx, x, y - h / 2, len, h, 8); ctx.fillStyle = darken(col, 0.45); ctx.fill(); ctx.restore();
      rr(ctx, x, y - h / 2, len, h, 8); ctx.fillStyle = col; ctx.fill();
      ctx.save(); rr(ctx, x, y - h / 2, len, h, 8); ctx.clip();
      ctx.fillStyle = darken(col, 0.16); ctx.fillRect(x, y + h * 0.12, len, h);
      ctx.fillStyle = alpha(lighten(col, 0.5), 0.8); ctx.fillRect(x + 6, y - h / 2 + 4, len - 12, 3);
      ctx.restore();
      rr(ctx, x, y - h / 2, len, h, 8); ctx.strokeStyle = darken(col, 0.42); ctx.lineWidth = 2.5; ctx.stroke();
    }
    if (label) this.word(ctx, c, label, x - 14, y, { align: 'right', size: o.size ?? 28 });
    ctx.restore();
  }

  // -- b0: gentle and hard push --------------------------------------------------------------------------
  ballAt(i, t) {
    const v = B0.v[i], tc = B0.tc;
    if (t <= 0) return { x: B0.x0, v: 0, push: false };
    if (t < tc) return { x: B0.x0 + 0.5 * (v / tc) * t * t, v: v * t / tc, push: true };
    const tt = Math.min(t - tc, B0.tg);
    return { x: B0.x0 + 0.5 * v * tc + v * tt, v, push: false };
  }
  hypothesis(ctx, c) {
    const a = this.age, t = a - B0.t0, r = B0.r;
    ['gentle push', 'hard push'].forEach((name, i) => {
      const fy = B0.floors[i], by = fy - r, p = this.ballAt(i, t);
      drawSurface(ctx, c, 'tiles', 16, 664, fy, { h: 30, seed: 3 + i });
      drawTag(ctx, c, name, 20, fy - 150, { align: 'left', prefer: [[0, 0]], size: 28, col: c.accent });
      const xs = [];
      const rel = B0.x0 + 0.5 * B0.v[i] * B0.tc;
      for (let k = 0; t >= B0.tc && k * B0.dt <= Math.min(t - B0.tc, B0.tg) + 1e-6; k++) xs.push(rel + B0.v[i] * B0.dt * k);
      this.dots(ctx, c, xs, fy);
      // the hand: reaches in, pushes for tc, stops and draws back
      const reach = ease(a, 0, B0.t0), back = ease(t, B0.tc, 0.45);
      const contact = t < B0.tc ? p.x - r : rel - r;
      const P = { x: contact - 40 * (1 - reach) - 26 * back, y: by };
      this.hand(ctx, c, P, { len: 88, view: 'back', dir: -Math.PI / 2, palm: 1, arm: { x: P.x - 240, y: by - 50 }, alpha: 1 - 0.3 * back });
      drawBall(ctx, c, { x: p.x, y: by, r, tone: 6, shadowY: fy + 2 });
      if (p.push) {
        const kf = ease(t, 0, 0.08);
        drawForce(ctx, c, p.x + r, by, { length: i ? 130 : 50, label: 'F', fit: false, alpha: kf });
      }
      if (!p.push && t > B0.tc) drawMotionArrow(ctx, c, 'v', p.x - 4 - B0.v[i] * 0.42, by - r - 26, { length: 26 + B0.v[i] * 0.42, label: 'v', side: 1, alpha: ease(t, B0.tc, 0.3) });
    });
  }

  // -- b1: the cart lab ----------------------------------------------------------------------------------
  cartRun(ctx, c) {
    const a = this.age, L = { ...BIG, x1: 584 }, t = Math.min(a - BIG_T0, BIG_TC), s = this.runS(BIG_D, BIG_T, t);
    const built = [0, 1, 2, 3, 4, 5].map((i) => ease(a, i * 0.4, 0.35));
    const accel = 2 * BIG_D / (BIG_T * BIG_T), xs = [];
    const R = this.lab(ctx, c, L, s, {
      D: BIG_D, coins: 4, built,
      under: (start) => { for (let k = 0; t >= 0 && k * BIG_DT <= t + 1e-6; k++) xs.push(start + 0.5 * accel * (k * BIG_DT) ** 2); this.dots(ctx, c, xs, L.Y); },
    });
    const kF = t > 0 ? ease(t, 0, 0.15) : 0;
    if (kF > 0 && R.cart) drawForce(ctx, c, R.cart.front, R.ty, { length: 110, label: 'pull of the thread', fit: false, alpha: kF });
    const boxes = [];
    if (built[1] > 0) boxes.push(drawTag(ctx, c, 'start line', R.start, L.Y + 70, { alpha: built[1], prefer: [[0, 0]] }));
    if (built[2] > 0) boxes.push(drawTag(ctx, c, 'pipe', 664, L.Y - 150, { align: 'right', alpha: built[2], prefer: [[0, 0]] }));
    if (built[3] > 0 && R.cart) boxes.push(drawTag(ctx, c, 'cart', R.cart.cx, R.cart.top - 50, { alpha: built[3], avoid: boxes, prefer: [[0, 0], [0, -40]] }));
    if (built[5] > 0 && R.cup) boxes.push(drawTag(ctx, c, 'cup with coins', R.cup.x0 - 14, (R.cup.top + R.cup.bottom) / 2, { align: 'right', alpha: built[5], prefer: [[0, 0]] }));
  }

  // -- stacked runs (double, load) -----------------------------------------------------------------------
  laneRun(ctx, c, L, T, t, o = {}) {
    const D = L.floor - L.Y - 22 * L.k - 50 * L.k, s = this.runS(D, T, t);
    return this.lab(ctx, c, L, s, { D, coins: o.coins, load: o.load, alpha: o.alpha });
  }

  doubleTime(ctx, c) {
    const a = this.age, t = a - LT0, Ts = [T1, T2D];
    LANES.forEach((L, i) => {
      this.laneRun(ctx, c, L, Ts[i], t, { coins: i ? 8 : 4 });
      drawTag(ctx, c, i ? 'double the coins' : 'cup', L.x0 + 4, L.top + 30, { align: 'left', prefer: [[0, 0]], size: 28, col: c.accent });
      const tt = clamp01(Math.max(0, t) / Ts[i]) * Ts[i], done = t >= Ts[i];
      drawStopwatch(ctx, c, { x: 92, y: L.top + 132, r: 46, seconds: tt, dialSeconds: 4, text: i ? 'T2' : 'T1' });
      if (done) {
        const k = ease(t, Ts[i], 0.3);
        ctx.save(); ctx.globalAlpha *= k; ctx.strokeStyle = c.annot; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(92, L.top + 132, 54, 0, TAU); ctx.stroke(); ctx.restore();
      }
    });
    const kq = ease(t, T1 + 0.3, 0.6);
    if (kq > 0) drawTag(ctx, c, 'a1 / a2 = T2' + SQ + ' / T1' + SQ, 395, LANES[1].top + 198, { alpha: kq, size: 30, col: c.accent, prefer: [[0, 0]] });
  }

  doubleLarger(ctx, c) {
    const a = this.age, L = LANES[1];
    const sheet = { x: 16, y: 14, w: 648, h: 228 };
    drawSheet(ctx, c, sheet);
    const X = 110, A1 = 230, k1 = ease(a, 0.3, 0.6), k2 = ease(a, 0.9, 0.8), kd = ease(a, 1.8, 0.4);
    this.bar(ctx, c, X, 78, A1 * k1, 'a1');
    if (kd > 0) {
      ctx.save(); ctx.globalAlpha *= kd; ctx.setLineDash([9, 7]); ctx.strokeStyle = c.annot; ctx.lineWidth = 3;
      rr(ctx, X, 170 - 17, 2 * A1, 34, 8); ctx.stroke(); ctx.restore();
      drawTag(ctx, c, '2 x a1', X + 2 * A1 - 4, 124, { alpha: kd, align: 'center', prefer: [[0, 0]] });
    }
    this.bar(ctx, c, X, 170, 1.8 * A1 * k2, 'a2');
    // the lower run at rest, dimmed but for its cart; friction on the wheels
    this.laneRun(ctx, c, L, T2D, 99, { coins: 8, alpha: DIM });
    ctx.save(); ctx.globalAlpha *= DIM; drawStopwatch(ctx, c, { x: 92, y: L.top + 132, r: 46, seconds: T2D, dialSeconds: 4, text: 'T2' }); ctx.restore();
    const cart = this.labCart(ctx, c, L.x1 - 146 * L.k, L.Y, { k: L.k, s: L.floor - L.Y - 72 * L.k });
    const kf = ease(a, 2.4, 0.4);
    if (kf > 0) {
      ctx.save(); ctx.globalAlpha *= kf; ctx.strokeStyle = c.annot; ctx.lineWidth = 3;
      for (const wl of cart.wheels) { ctx.beginPath(); ctx.arc(wl.x, wl.y, wl.r + 6, 0, TAU); ctx.stroke(); }
      ctx.restore();
      const box = drawTag(ctx, c, 'friction on the wheels', 330, L.top + 196, { alpha: kf, prefer: [[0, 0]], col: c.accent });
      this.leader(ctx, c, box, cart.wheels[0].x - 4, cart.wheels[0].y + 18, { alpha: kf });
    }
  }

  // -- load: same pull, heavier cart -------------------------------------------------------------------------
  loadSetup(ctx, c) {
    const k = ease(this.age, 0, 0.6);
    this.lab(ctx, c, { ...BIG, Y: 262, k: 1.3 }, 0, { D: BIG_D, coins: 4, load: true, alpha: k });
    drawTag(ctx, c, 'same cup, double the mass of the cart', 340, 44, { alpha: ease(this.age, 0.5, 0.5), size: 28, col: c.accent, prefer: [[0, 0]] });
  }

  loadHeavier(ctx, c) {
    const a = this.age, t = a - LT0, Ts = [TL1, TL2], A = 132;
    LANES.forEach((L, i) => {
      this.laneRun(ctx, c, L, Ts[i], t, { coins: 4, load: i === 1 });
      drawTag(ctx, c, i ? 'cart, double mass' : 'cart', L.x0 + 4, L.top + 30, { align: 'left', prefer: [[0, 0]], size: 28, col: c.accent });
      const kb = ease(t, Ts[i], 0.5);
      if (kb > 0) this.bar(ctx, c, 52, L.top + 140, A * (i ? 0.55 : 1) * kb, 'a');
    });
  }

  loadLaw(ctx, c) {
    const a = this.age, kc = ease(a, 0.1, 0.5), card = { x: 90, y: 16, w: 500, h: 210 };
    ctx.save(); ctx.globalAlpha *= kc; drawSheet(ctx, c, card); ctx.restore();
    this.word(ctx, c, 'a = F / m', 340, 96, { size: 78, alpha: kc });
    this.word(ctx, c, 'F = ma', 340, 182, { size: 46, alpha: ease(a, 0.5, 0.5), col: c.accent });
    const L = { x0: 24, x1: 600, Y: 440, floor: 520, k: 1 };
    drawGround(ctx, c, propRig({ x0: L.x0, x1: L.x1, groundY: L.Y }), { kind: 'table' });
    const ty = L.Y - 6 - 58 * 0.55, p = this.pipe(ctx, c, L, ty);
    const cart = this.labCart(ctx, c, 150, L.Y, {});
    ctx.save(); ctx.strokeStyle = mix(c.label, c.bgSurface, 0.3); ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(cart.front, ty); ctx.lineTo(p.x, ty); ctx.arc(p.x, p.y, p.r, -Math.PI / 2, 0); ctx.lineTo(p.x + p.r, 452); ctx.stroke(); ctx.restore();
    this.cup(ctx, c, p.x + p.r, 470, 4, 1);
    const ka = ease(a, 1.0, 0.5);
    drawForce(ctx, c, cart.front, ty, { length: 170, label: 'net force', fit: false, alpha: ka });
    drawMotionArrow(ctx, c, 'a', cart.cx - 20, cart.top - 44, { length: 150, label: 'acceleration', side: 1, alpha: ease(a, 1.4, 0.5) });
  }

  loadNewton(ctx, c) {
    const a = this.age, kl = ease(a, 0.1, 0.5), kr = ease(a, 1.0, 0.5), N = 120;
    const left = { x: 12, y: 60, w: 322, h: 430 }, right = { x: 346, y: 60, w: 322, h: 430 };
    drawSheet(ctx, c, left); drawSheet(ctx, c, right);
    const clip = (r) => { ctx.save(); rr(ctx, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 14); ctx.clip(); };
    // left: 1 kg block on the ideal floor, pushed by your hand: 1 N gives 1 m/s sq
    const FL = 390;
    clip(left); ctx.globalAlpha *= kl;
    this.idealFloor(ctx, c, 26, 320, FL, 30);
    const blk = drawBoxOn(ctx, c, { x: 168, y: FL, w: 120, h: 96, kind: 'block' });
    this.hand(ctx, c, { x: blk.back.x, y: blk.back.y }, { len: 84, view: 'back', dir: -Math.PI / 2, palm: 1, arm: { x: blk.back.x - 200, y: blk.back.y - 60 } });
    drawTag(ctx, c, '1 kg', blk.centre.x, blk.centre.y + 6, { size: 28, prefer: [[0, 0]] });
    ctx.restore();
    drawForce(ctx, c, blk.front.x, blk.front.y, { length: N, label: '1 N', fit: false, alpha: ease(a, 0.5, 0.4) });
    drawMotionArrow(ctx, c, 'a', blk.centre.x - 30, blk.top.y - 46, { length: N, label: '1 m/s' + SQ, side: 1, alpha: ease(a, 0.7, 0.4) });
    // right: an open palm holding a 100 g mass, about 1 N up into it
    clip(right); ctx.globalAlpha *= kr;
    const P = { x: 500, y: 392 };
    this.hand(ctx, c, P, { len: 136, dir: 0, palm: -1, arm: { x: 360, y: 520 } });
    const m = this.mass(ctx, c, P.x + 10, P.y + 2);
    ctx.restore();
    drawForce(ctx, c, m.x, m.top, { length: N, angle: -Math.PI / 2, label: 'about 1 N', fit: false, alpha: ease(a, 1.5, 0.4) });
  }

  /** A 100 g slotted brass mass standing on (x, y), side view. */
  mass(ctx, c, x, y) {
    const w = 84, h = 46, brass = mix(c.gold, c.labelMuted, 0.15), top = y - h;
    rr(ctx, x - w / 2, top, w, h, 6); ctx.fillStyle = brass; ctx.fill();
    ctx.save(); rr(ctx, x - w / 2, top, w, h, 6); ctx.clip();
    ctx.fillStyle = darken(brass, 0.18); ctx.fillRect(x + w * 0.18, top, w, h);
    ctx.fillStyle = alpha(lighten(brass, 0.5), 0.8); ctx.fillRect(x - w / 2 + 8, top + 5, 4, h - 10);
    ctx.restore();
    rr(ctx, x - w / 2, top, w, h, 6); ctx.strokeStyle = darken(brass, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    rr(ctx, x - 7, top - 16, 14, 18, 4); ctx.fillStyle = brass; ctx.fill(); ctx.stroke();       // the hook stem
    this.word(ctx, c, '100 g', x, top + h / 2 + 1, { size: 26, col: darken(brass, 0.7) });
    return { x, top: top - 16, bottom: y };
  }
}
