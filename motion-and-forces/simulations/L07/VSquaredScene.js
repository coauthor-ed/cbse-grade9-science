/**
 * VSquaredScene - slide blk-l07-s22 "The third equation: no time" (2 beats; Eq 4.4c).
 * Card 3, full width: the algebra is the whole picture here (no graph: nothing on it is named).
 *   b0  top left, from the first equation, the small card t = (v - u) / a; top right
 *       s = ut + 1/2 at^2 writes on; its two t's light in the t tone; two copies of (v - u) / a
 *       fly from the small card into the line below, where the t's were, while those t's are
 *       struck out (each copy stops in its t place first): s = u (v - u)/a + 1/2 a ((v - u)/a)^2 is the hero, its new parts ringed in t.
 *   b1  three lines, the newest the hero: 2as = 2u (v - u) + (v - u)^2; 2as = v^2 - u^2;
 *       v^2 = u^2 + 2as boxed. Below, the five chips u v a t s: the t chip fades and is struck
 *       out ("no t in it").
 */
import { KinematicsSetupScene } from './KinematicsSetupScene.js';
import { drawBackdrop, clamp01, inOutSine, lerp, rr } from 'simulations/base/kit/SimLook.js';
import { drawSheet } from '../shared/MotionGraph.js';

const M = '\u2212', SQ = '\u00b2';
const P = { x: 16, y: 14, w: 648, h: 492 };
const HALF = { f: ['1', '2'] };
const VUA = ['v ' + M + ' u', 'a'];
const TC = { x: 40, y: 70, w: 236, h: 120 };            // the small card t = (v - u) / a
const YB = 130, YC = 320;

export class VSquaredScene extends KinematicsSetupScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'From the first equation, t equals v minus u over a. In s equals u t plus one half a t squared, both t\'s light up and are replaced by v minus u over a, giving s equals u times v minus u over a, plus one half a times the square of v minus u over a. Simplifying: 2 a s equals 2 u times v minus u, plus v minus u squared; 2 a s equals v squared minus u squared; so v squared equals u squared plus 2 a s, boxed. Of the five quantities u, v, a, t and s, the t fades out: this equation has no t in it.';

  busy() { return this.age < (this.key === 0 ? 3.8 : 4.6); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawSheet(ctx, c, P);
    this.badge(ctx, c, '3', P.x + 30, P.y + 30);
    if (this.key === 0) this.substitute(ctx, c, this.age);
    else this.simplify(ctx, c, this.age);
  }

  /** b0: t = (v - u)/a goes into both t places. */
  substitute(ctx, c, a) {
    const kA = clamp01(a / 0.4), kB = clamp01((a - 0.3) / 0.7), glow = clamp01((a - 1.0) / 0.4);
    const fly = [0, 1].map((i) => clamp01((a - 1.4 - i * 0.2) / 1.2));
    const strike = clamp01((a - 2.0) / 0.4), kC = clamp01((a - 2.2) / 0.6), rest = clamp01((a - 3.0) / 0.4);
    // The small card, t tone rim.
    ctx.save(); ctx.globalAlpha = kA * (1 - 0.35 * rest);
    drawSheet(ctx, c, TC);
    ctx.strokeStyle = this.symCol(c, 't'); ctx.lineWidth = 3; rr(ctx, TC.x + 6, TC.y + 6, TC.w - 12, TC.h - 12, 12); ctx.stroke();
    ctx.restore();
    const rA = this.eq(ctx, c, ['t = ', { f: VUA }], TC.x + TC.w / 2, TC.y + TC.h / 2, 34, { alpha: kA * (1 - 0.35 * rest) });
    // s = ut + 1/2 at^2 with its t's lit, then struck.
    const tB = { s: 't', glow, strike }, tB2 = { s: 't', glow, strike };
    const rB = this.eq(ctx, c, ['s = u', tB, ' + ', HALF, ' a', tB2, SQ], 470, YB, 38, { k: kB, alpha: 1 - 0.25 * rest });
    // The substituted line: its fractions appear where the copies land.
    const items = ['s = u ', { f: VUA, glow: 1, hide: fly[0] < 1 }, ' + ', HALF, ' a ', { f: VUA, paren: true, sup: SQ, glow: 1, hide: fly[1] < 1 }];
    const lay = this.eq(ctx, c, items, P.x + P.w / 2, YC, 38, { k: 0 });   // layout only
    this.eq(ctx, c, items, P.x + P.w / 2, YC, 38, { alpha: kC });
    // The flying copies.
    const from = [rA.boxes[1].x + rA.boxes[1].w / 2, TC.y + TC.h / 2];
    [1, 5].forEach((idx, i) => {
      const k = fly[i];
      if (k <= 0 || k >= 1) return;
      const b = lay.boxes[idx], to = [b.x + b.w / 2, YC], wb = rB.boxes[i ? 5 : 1], via = [wb.x + wb.w / 2, YB];
      // into the t place in the line above first, then down into the new line
      const k1 = inOutSine(clamp01(k / 0.4)), k2 = inOutSine(clamp01((k - 0.6) / 0.4));
      const x = k < 0.5 ? lerp(from[0], via[0], k1) : lerp(via[0], to[0], k2);
      const y = k < 0.5 ? lerp(from[1], via[1], k1) - Math.sin(Math.PI * k1) * 40 : lerp(via[1], to[1], k2);
      this.eq(ctx, c, [{ f: VUA, glow: 1 }], x, y, 38);
    });
  }

  /** b1: simplify to v^2 = u^2 + 2as; the t chip fades out. */
  simplify(ctx, c, a) {
    const cx = P.x + P.w / 2;
    const k1 = clamp01((a - 0.3) / 0.8), k2 = clamp01((a - 1.3) / 0.8), k3 = clamp01((a - 2.3) / 0.8), bx = clamp01((a - 3.1) / 0.4);
    this.eq(ctx, c, ['2as = 2u (v ' + M + ' u) + (v ' + M + ' u)' + SQ], cx, 100, 36, { k: k1, alpha: 1 - 0.25 * k2 });
    this.eq(ctx, c, ['2as = v' + SQ + ' ' + M + ' u' + SQ], cx, 200, 36, { k: k2, alpha: 1 - 0.25 * k3 });
    if (k3 > 0) {
      const r = this.eq(ctx, c, ['v' + SQ + ' = u' + SQ + ' + 2as'], cx, 318, 54, { k: k3 });
      this.heroBox(ctx, c, r, bx);
    }
    const kc = clamp01((a - 0.2) / 0.5), gone = clamp01((a - 3.4) / 0.8);
    ['u', 'v', 'a', 't', 's'].forEach((ch, i) => {
      const x = cx + (i - 2) * 92, y = 448;
      if (ch !== 't') { this.chip(ctx, c, ch, x, y, { r: 30, alpha: kc }); return; }
      this.chip(ctx, c, ch, x, y, { r: 30, alpha: kc * (1 - 0.8 * gone) });
      if (gone > 0) this.chip(ctx, c, ch, x, y, { r: 30, ghost: true, strike: gone, alpha: gone });
    });
  }
}
