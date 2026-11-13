/**
 * CoinStackScene - slide blk-l11-s5 "Coins on different surfaces" (3 beats; Figs 6.12, 6.13). MODE 'coins'.
 * Top view of a table lane. Your forefinger and thumb hold a rubber band at marks A and B; mark C behind.
 * The coin stack is seen from above: a coin with its rim, a tape band round its side, no face.
 *   b0 'wood'      a finger of your other hand pushes the stack back to C (the band stretches into a V),
 *                  lifts, the band snaps forward, the stack slides on the wooden table top and stops;
 *                  stop mark and a bracket from C "distance". Rest: stopped at about 1/3 of the lane.
 *   b1 'surfaces'  three lanes (wood, laminate, marble), the same stretch, released together; equal-time
 *                  dots behind each stack; stops at 20 : 35 : 60; the marble lane is the hero.
 *   b2 'forces'    laminate, two stages (Fig 6.13): (a) in the band, push of band (long) forward and
 *                  friction (short) backward, net force forward, the stack speeds up; (b) after the band,
 *                  only friction, backward, the stack slows; rest while it is still slowing, friction shown.
 * Physics: one launch speed V0 on every surface (the band does the same work); each surface has its own
 * constant deceleration a = V0^2 / (2 s), so x = V0 t - a t^2 / 2 until rest. Distances from C.
 * ThoughtExperimentScene (MODE 'thought') and SpringPullScene (MODE 'pull') subclass this file and use its
 * surfaces, stack, hand and band. Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, luma, font, rr, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawTag, drawSheet } from '../shared/MotionGraph.js';
import { drawForce, drawNet } from '../shared/ForceCast.js';

const V0 = 300;                 // launch speed, px/s (compressed clock)
const PB = 50;                         // C to the band line (px)
const DM = 500;                        // marble distance from C (px); the others by 20 : 35 : 60
const RATIO = { wood: 20 / 60, laminate: 35 / 60, marble: 1 };
const NAME = { wood: 'wood', laminate: 'laminate', marble: 'marble' };
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));

export class CoinStackScene extends SimScene {
  static MODE = 'coins';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A coin stack seen from above on a table. A rubber band is held between a finger and a thumb at marks A and B. A finger pushes the stack back to mark C and lets go: the band pushes the stack forward, it slides and stops. On a wooden table top it stops soonest, on a laminated table top it goes farther, and on polished marble farthest of all; equal-time dots behind each stack show its velocity falling more slowly on the smoother surfaces. Then the forces: while the band pushes, the push is larger than friction and a net force acts forward, so the stack speeds up; after it leaves the band only friction acts, backward, and the stack slows to rest.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() {
    const m = this.constructor.MODE;
    if (m === 'thought') return this.cur === 1 ? this.age < 3.2 : this.age < 0.6;
    return this.age < [3.8, 4.6, 5.0][Math.min(this.cur, 2)];
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.constructor.MODE === 'thought') return this.thought(ctx, c);
    if (this.cur === 0) this.wood(ctx, c);
    else if (this.cur === 1) this.surfaces(ctx, c);
    else this.forces(ctx, c);
  }

  // -- physics: the slide on one surface, t seconds after release ---------------------------------------
  /** p = back edge of the stack from C (px), v (px/s). s = distance after the band (Infinity: no friction). */
  slide(t, kind, slow = 1) {
    const s = kind === 'none' ? Infinity : DM * RATIO[kind] - PB, TB = 2 * PB / V0;
    t = Math.max(0, t) * slow;
    if (t < TB) return { p: 0.5 * (V0 / TB) * t * t, v: V0 * t / TB, inBand: true, done: false };
    const a = V0 * V0 / (2 * s), T = V0 / a, tau = Math.min(t - TB, T);
    return { p: PB + V0 * tau - 0.5 * a * tau * tau, v: V0 - a * tau, inBand: false, done: t - TB >= T };
  }
  stopTime(kind) { return 2 * PB / V0 + 2 * (DM * RATIO[kind] - PB) / V0; }

  // -- drawing parts -------------------------------------------------------------------------------------
  pale(c) { return darken(luma(c.label) > luma(c.bgSurface) ? c.label : c.bgSurface, 0.04); }
  baseOf(c, kind) {
    const p = this.pale(c);
    return kind === 'wood' ? mix(darken(c.gold, 0.32), c.flame, 0.12) : kind === 'laminate' ? mix(p, c.gold, 0.2)
      : kind === 'marble' ? mix(p, c.labelMuted, 0.1) : mix(p, c.glass, 0.5);
  }

  /** A table top seen from above, x0..x1, top y, height h: wood grain, laminate sheen, marble veins, glass glow. */
  surf(ctx, c, kind, x0, x1, y, h, o = {}) {
    const base = this.baseOf(c, kind), w = x1 - x0, rnd = mulberry32(o.seed ?? kind.length * 31 + 7), R = o.r ?? 14;
    const path = () => rr(ctx, x0, y, w, h, R);
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.save(); ctx.translate(0, 6); path(); ctx.fillStyle = alpha(darken(base, 0.5), 0.55); ctx.fill(); ctx.restore();
    path(); ctx.fillStyle = base; ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.fillStyle = alpha(darken(base, 0.1), 1); ctx.fillRect(x0, y + h * 0.78, w, h);          // shade side
    ctx.fillStyle = alpha(lighten(base, 0.35), 0.7); ctx.fillRect(x0, y, w, 5);                 // light side
    if (kind === 'wood') {
      const planks = Math.max(2, Math.round(h / 44)), ph = h / planks;
      for (let i = 0; i < planks; i++) {
        const py = y + i * ph;
        ctx.fillStyle = alpha(i % 2 ? darken(base, 0.08) : lighten(base, 0.06), 1); ctx.fillRect(x0, py, w, ph);
        ctx.strokeStyle = alpha(darken(base, 0.4), 0.55); ctx.lineWidth = 1.6;
        for (let g = 0; g < 4; g++) {
          const gy = py + ph * (0.18 + 0.2 * g + 0.05 * rnd()), amp = 1.5 + 2.5 * rnd(), ph0 = rnd() * 6;
          ctx.beginPath();
          for (let x = x0; x <= x1; x += 12) { const yy = gy + amp * Math.sin(x / (38 + 20 * rnd()) + ph0); x === x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
          ctx.stroke();
        }
        for (let k = 0; k < 2; k++) {                                                             // a knot
          const kx = x0 + w * (0.15 + 0.7 * rnd()), ky = py + ph * (0.35 + 0.3 * rnd());
          ctx.beginPath(); ctx.ellipse(kx, ky, 9, 3.5, 0, 0, Math.PI * 2); ctx.strokeStyle = alpha(darken(base, 0.45), 0.6); ctx.stroke();
        }
        ctx.fillStyle = alpha(darken(base, 0.5), 0.7); ctx.fillRect(x0, py + ph - 1.5, w, 3);    // plank joint
      }
    } else if (kind === 'laminate') {
      ctx.strokeStyle = alpha(darken(base, 0.18), 0.35); ctx.lineWidth = 1.2;
      for (let g = 0; g < h / 9; g++) { const gy = y + 6 + g * 9 + rnd() * 3; ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x1, gy + rnd() * 2); ctx.stroke(); }
      for (const [sx, sw] of [[0.16, 70], [0.55, 110]]) {                                         // sheen bands
        const gx = x0 + w * sx; ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + sw, y); ctx.lineTo(gx + sw - h * 0.5, y + h); ctx.lineTo(gx - h * 0.5, y + h); ctx.closePath();
        ctx.fillStyle = alpha(lighten(base, 0.8), 0.4); ctx.fill();
      }
    } else if (kind === 'marble') {
      ctx.lineCap = 'round';
      for (let v = 0; v < w / 70; v++) {
        let vx = x0 + rnd() * w, vy = y + rnd() * h * 0.3;
        ctx.beginPath(); ctx.moveTo(vx, vy);
        for (let s = 0; s < 6; s++) { vx += 10 + rnd() * 30; vy += h * 0.14 * (rnd() - 0.2); ctx.lineTo(vx, vy); }
        ctx.strokeStyle = alpha(mix(base, c.labelMuted, 0.7), 0.55); ctx.lineWidth = 1.3 + rnd() * 1.6; ctx.stroke();
      }
      for (const [sx, sw] of [[0.22, 120], [0.68, 70]]) {
        const gx = x0 + w * sx; ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + sw, y); ctx.lineTo(gx + sw - h * 0.6, y + h); ctx.lineTo(gx - h * 0.6, y + h); ctx.closePath();
        ctx.fillStyle = alpha(lighten(base, 0.9), 0.45); ctx.fill();
      }
    } else {                                                                                        // glass: frictionless, imagined
      const g = ctx.createLinearGradient(x0, y, x0, y + h); g.addColorStop(0, lighten(base, 0.5)); g.addColorStop(1, darken(base, 0.05));
      ctx.fillStyle = g; ctx.fillRect(x0, y, w, h);
      for (const [sx, sw] of [[0.1, 160], [0.5, 60], [0.72, 120]]) {
        const gx = x0 + w * sx; ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + sw, y); ctx.lineTo(gx + sw - h * 0.7, y + h); ctx.lineTo(gx - h * 0.7, y + h); ctx.closePath();
        ctx.fillStyle = alpha(lighten(base, 0.95), 0.5); ctx.fill();
      }
    }
    ctx.restore();
    ctx.strokeStyle = alpha(lighten(base, 0.5), 0.6); ctx.lineWidth = 1.5; rr(ctx, x0 + 4, y + 4, w - 8, h - 8, R - 3); ctx.stroke();   // inner line
    path(); ctx.strokeStyle = o.rim ?? darken(base, 0.45); ctx.lineWidth = o.rimW ?? 3; ctx.stroke();
    ctx.restore();
  }

  /** The coin stack from above: a ten-rupee coin (gold ring, silver centre), tape round its side, a shadow. */
  stack(ctx, c, x, y, R, k = 1) {
    if (k <= 0) return;
    const gold = mix(c.gold, c.flame, 0.1), silver = mix(this.pale(c), c.labelMuted, 0.32);
    ctx.save(); ctx.globalAlpha *= k;
    ctx.beginPath(); ctx.ellipse(x + 4, y + 6, R + 3, R + 2, 0, 0, Math.PI * 2); ctx.fillStyle = alpha(darken(c.stroke, 0.4), 0.3); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, R + 3, 0, Math.PI * 2); ctx.fillStyle = alpha(mix(c.glass, this.pale(c), 0.4), 0.85); ctx.fill();   // tape
    ctx.strokeStyle = darken(c.glass, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fillStyle = gold; ctx.fill();
    ctx.save(); ctx.clip(); ctx.beginPath(); ctx.arc(x + R * 0.35, y + R * 0.35, R, 0, Math.PI * 2); ctx.fillStyle = darken(gold, 0.16); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, R * 0.62, 0, Math.PI * 2); ctx.fillStyle = silver; ctx.fill();
    ctx.strokeStyle = darken(gold, 0.42); ctx.lineWidth = 1.8; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R * 0.86, 0, Math.PI * 2); ctx.strokeStyle = alpha(darken(gold, 0.3), 0.7); ctx.lineWidth = 1.2; ctx.stroke();   // milled edge line
    ctx.beginPath(); ctx.arc(x - R * 0.12, y - R * 0.12, R * 0.42, Math.PI * 1.05, Math.PI * 1.6); ctx.strokeStyle = alpha(lighten(silver, 0.8), 0.9); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.strokeStyle = darken(gold, 0.5); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  fInk(c) { return c.s3ink ?? darken(c.s3, 0.3); }
  skin(c) { return figureLook(c, { skin: 2 }).skin; }
  /** A finger seen from above: a capsule from (x0, y0) to the tip (x1, y1), nail at the tip. */
  finger(ctx, c, x0, y0, x1, y1, w, o = {}) {
    const skin = o.col ?? this.skin(c), ang = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(ang);
    rr(ctx, 4, -w / 2 + 6, L, w, w / 2); ctx.fillStyle = alpha(darken(c.stroke, 0.4), 0.25); ctx.fill();
    const body = () => rr(ctx, 0, -w / 2, L, w, w / 2);
    body(); ctx.fillStyle = skin; ctx.fill();
    ctx.save(); body(); ctx.clip(); ctx.fillStyle = darken(skin, 0.13); ctx.fillRect(0, w * 0.12, L, w); ctx.fillStyle = alpha(lighten(skin, 0.4), 0.6); ctx.fillRect(w * 0.4, -w * 0.32, L - w, 3); ctx.restore();
    if (o.nail !== false) { ctx.beginPath(); ctx.ellipse(L - w * 0.42, -w * 0.04, w * 0.28, w * 0.22, 0, 0, Math.PI * 2); ctx.fillStyle = lighten(skin, 0.38); ctx.fill(); ctx.strokeStyle = alpha(darken(skin, 0.38), 0.7); ctx.lineWidth = 1.4; ctx.stroke(); }
    ctx.strokeStyle = alpha(darken(skin, 0.35), 0.55); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(L * 0.55, -w * 0.3); ctx.lineTo(L * 0.55, w * 0.3); ctx.stroke();   // knuckle crease
    body(); ctx.strokeStyle = darken(skin, 0.4); ctx.lineWidth = 2.2; ctx.stroke();
    ctx.restore();
  }

  /** Your hand at the left of a lane: the forefinger tip on A, the thumb tip on B, palm and sleeve off the edge. */
  hand(ctx, c, L) {
    const s = L.R / 26, pX = L.C.x - 92 * s, pY = L.cy, skin = this.skin(c), sleeve = c.s4;
    ctx.save();
    rr(ctx, pX - 220 * s, pY - 40 * s, 200 * s, 80 * s, 20 * s); ctx.fillStyle = sleeve; ctx.fill();
    ctx.strokeStyle = darken(sleeve, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = alpha(lighten(sleeve, 0.45), 0.6); ctx.fillRect(pX - 210 * s, pY - 32 * s, 180 * s, 5);
    ctx.beginPath(); ctx.ellipse(pX - 10 * s, pY, 44 * s, 48 * s, 0, 0, Math.PI * 2); ctx.fillStyle = skin; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = darken(skin, 0.12); ctx.fillRect(pX - 60 * s, pY + 14 * s, 120 * s, 80 * s); ctx.restore();
    ctx.strokeStyle = darken(skin, 0.4); ctx.lineWidth = 2.2; ctx.stroke();
    this.finger(ctx, c, pX + 10 * s, pY - 26 * s, L.A.x, L.A.y, 26 * s);
    this.finger(ctx, c, pX + 10 * s, pY + 28 * s, L.B.x, L.B.y, 30 * s);
    ctx.restore();
  }

  /** The band from A to B: a V through (vx, cy) while the stack is behind the band line, else straight. */
  band(ctx, c, L, vx) {
    const red = mix(c.bad, c.flame, 0.2), pts = vx < L.BX - 0.5 ? [L.A, { x: vx, y: L.cy }, L.B] : [L.A, L.B];
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const line = () => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); };
    line(); ctx.strokeStyle = darken(red, 0.4); ctx.lineWidth = 7; ctx.stroke();
    line(); ctx.strokeStyle = red; ctx.lineWidth = 4.5; ctx.stroke();
    line(); ctx.strokeStyle = alpha(lighten(red, 0.5), 0.6); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  /** Text with a paper halo, readable on any surface. */
  say(ctx, c, text, x, y, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(c, 800, o.size ?? 26, true); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = c.bgSurface; ctx.lineWidth = 7; ctx.strokeText(text, x, y);
    ctx.fillStyle = o.col ?? c.label; ctx.fillText(text, x, y);
    ctx.restore();
  }
  /** A single letter on a small paper disc (marks A, B, C). */
  badge(ctx, c, text, x, y) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fillStyle = c.bgSurface; ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.55); ctx.lineWidth = 2; ctx.stroke();
    ctx.font = font(c, 800, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.label; ctx.fillText(text, x, y + 1);
    ctx.restore();
  }
  dot(ctx, c, x, y, r = 5, col = c.label) {
    ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2); ctx.fillStyle = c.bgSurface; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  }

  /** A lane: top y, height h, stack radius R. C at x 100; the band line PB further on. */
  lane(y, h, R, o = {}) {
    const cx = o.cx ?? 100, cy = y + h / 2, BX = cx + PB, half = o.half ?? h * 0.36;
    return { y, h, R, cy, C: { x: cx, y: cy }, BX, A: { x: BX, y: cy - half }, B: { x: BX, y: cy + half }, x0: o.x0 ?? 24, x1: o.x1 ?? 656 };
  }
  /** Lane with hand, band, marks and the stack whose back edge sits p px past C. */
  rig(ctx, c, L, kind, p, o = {}) {
    this.surf(ctx, c, kind, L.x0, L.x1, L.y, L.h, { rim: o.rim, rimW: o.rimW, seed: o.seed });
    if (o.marks !== false) {
      this.dot(ctx, c, L.C.x, L.cy, 5);
      if (o.letters !== false) {
        this.badge(ctx, c, 'C', L.C.x - 28, L.cy);
        this.badge(ctx, c, 'A', L.A.x + 26, L.A.y - 8); this.badge(ctx, c, 'B', L.B.x + 26, L.B.y + 8);
      }
    }
    if (o.before) o.before(L);
    const back = L.C.x + p;
    this.band(ctx, c, L, Math.min(back, L.BX));
    if (o.hand === 'tips') {
      this.finger(ctx, c, -10, L.A.y - 44, L.A.x, L.A.y, 24);                 // forefinger and thumb, hand off the left edge
      this.finger(ctx, c, -10, L.B.y + 44, L.B.x, L.B.y, 28);
    } else this.hand(ctx, c, L);
    if (o.stack !== false) this.stack(ctx, c, back + L.R, L.cy, L.R, o.stackAlpha ?? 1);
    return { back, cx: back + L.R };
  }
  /** Stop mark: a short dashed line across the lane at x. */
  stopMark(ctx, c, L, x, k = 1) {
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha *= k; ctx.setLineDash([7, 6]); ctx.strokeStyle = c.annot; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(x, L.cy - L.R - 16); ctx.lineTo(x, L.cy + L.R + 16); ctx.stroke(); ctx.restore();
  }
  bracket(ctx, c, xa, xb, y, label, k = 1) {
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha *= k; ctx.strokeStyle = c.annot; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(xa, y - 10); ctx.lineTo(xa, y); ctx.lineTo(xb, y); ctx.lineTo(xb, y - 10); ctx.stroke(); ctx.restore();
    if (label) this.say(ctx, c, label, (xa + xb) / 2, y + 24, { alpha: k, col: c.annot });
  }

  // -- b0: one lane, wood --------------------------------------------------------------------------------
  wood(ctx, c) {
    const a = this.age, L = this.lane(120, 210, 28, { cx: 150 }), TR = 1.75;
    const back = ease(a, 0.3, 0.9), lift = ease(a, 1.35, 0.35);
    const m = this.slide(a - TR, 'wood'), p = a < TR ? PB * (1 - back) : m.p;
    const done = a >= TR + this.stopTime('wood'), kd = ease(a, TR + this.stopTime('wood') + 0.1, 0.4);
    const r = this.rig(ctx, c, L, 'wood', p);
    if (lift < 1) this.pusher(ctx, c, r.back + 2 * L.R + 2 + 30 * lift, L.cy - 40 * lift, 1 - lift);
    if (done) { this.stopMark(ctx, c, L, r.back, kd); this.bracket(ctx, c, L.C.x, r.back, L.y + L.h + 26, 'distance', kd); }
    drawTag(ctx, c, 'wooden table top', 470, L.y - 34, { size: 26 });
  }

  /** Your other hand's forefinger pointing in from the right, tip at (x, y). */
  pusher(ctx, c, x, y, k = 1) {
    ctx.save(); ctx.globalAlpha *= k;
    const skin = this.skin(c), sleeve = c.s4;
    rr(ctx, x + 150, y - 66, 400, 84, 22); ctx.fillStyle = sleeve; ctx.fill(); ctx.strokeStyle = darken(sleeve, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + 132, y - 22, 52, 40, -0.25, 0, Math.PI * 2); ctx.fillStyle = skin; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = darken(skin, 0.12); ctx.fillRect(x + 60, y - 4, 150, 80); ctx.restore();
    ctx.strokeStyle = darken(skin, 0.4); ctx.lineWidth = 2.2; ctx.stroke();
    this.finger(ctx, c, x + 112, y - 16, x, y, 26);
    ctx.restore();
  }

  // -- b1: three lanes, released together -------------------------------------------------------------------
  surfaces(ctx, c) {
    const a = this.age, TR = 0.6, kinds = ['wood', 'laminate', 'marble'];
    kinds.forEach((kind, i) => {
      const L = this.lane(34 + i * 156, 120, 19, { half: 46 }), hero = kind === 'marble';
      const t = a - TR, m = this.slide(t, kind), ts = this.stopTime(kind), kd = ease(a, TR + ts, 0.3);
      const dots = [];
      for (let k = 1; k * 0.25 < Math.min(t, ts); k++) dots.push(L.C.x + this.slide(k * 0.25, kind).p + L.R);
      this.rig(ctx, c, L, kind, m.p, {
        letters: i === 0, rim: hero ? c.accent : undefined, rimW: hero ? 5 : 3,
        before: () => dots.forEach((x) => this.dot(ctx, c, x, L.cy, 4.5, c.annot)),
      });
      this.stopMark(ctx, c, L, L.C.x + m.p, kd);
      drawTag(ctx, c, NAME[kind], hero ? 560 : 590, L.y - 2, { size: 26, col: hero ? c.accent : c.label });
    });
  }

  // -- b2: forces on the stack, in the band and after it (laminate) --------------------------------------------
  forces(ctx, c) {
    const a = this.age, PUSH = 170, FR = 60;
    // (a) in the band: speeding up, push of band > friction
    const La = this.lane(30, 156, 26, { half: 56 }), u = clamp01((a - 0.3) / 1.8), pa = (PB - 34) * u * u, ka = ease(a, 0.2, 0.4);
    const ra = this.rig(ctx, c, La, 'laminate', pa, { letters: false, hand: 'tips' });
    drawTag(ctx, c, '(a)', 58, La.y + 28, { size: 26 });
    if (ka > 0) {
      drawForce(ctx, c, ra.cx, La.cy - 10, { length: PUSH, label: '', alpha: ka, fit: false });
      drawForce(ctx, c, ra.cx, La.cy + 8, { length: FR, angle: Math.PI, label: '', alpha: ka, fit: false });
      drawTag(ctx, c, 'push of band', ra.cx + PUSH * 0.62, La.cy - 40, { size: 26, col: this.fInk(c), alpha: ka });
      drawTag(ctx, c, 'friction', ra.cx - FR * 0.4, La.cy + 46, { size: 26, col: this.fInk(c), alpha: ka });
    }
    const S = { x: 200, y: 196, w: 420, h: 50 };
    drawSheet(ctx, c, S, { alpha: ka });
    if (ka > 0) {
      drawNet(ctx, c, S.x + 24, S.y + 25, [{ newtons: PUSH, dir: 1 }, { newtons: FR, dir: -1 }], { scale: 1, label: '', fit: false, alpha: ka });
      this.say(ctx, c, 'net force', S.x + 24 + PUSH - FR + 70, S.y + 26, { alpha: ka, col: c.s3ink ?? darken(c.s3, 0.3) });
    }
    // (b) after the band: only friction, slowing to rest
    // The beat's point is the friction arrow, so the stage rests while the stack is still slowing (dots
    // closing up, friction shown), at 85 per cent of its slide; at rest friction would be gone.
    const Lb = this.lane(286, 156, 26, { half: 56 }), t0 = 2.4, slow = 0.62;
    const ts = (this.stopTime('laminate') - 2 * PB / V0) / slow, t = Math.min(a - t0, 0.85 * ts);
    const m = this.slide(t <= 0 ? 2 * PB / V0 / slow : t + 2 * PB / V0 / slow, 'laminate', slow);
    const dots = [];
    for (let k = 0; k * 0.3 < Math.min(Math.max(t, 0), ts); k++) dots.push(Lb.C.x + this.slide(k * 0.3 + 2 * PB / V0 / slow, 'laminate', slow).p + Lb.R);
    const kb = ease(a, 2.2, 0.3);
    const rb = this.rig(ctx, c, Lb, 'laminate', m.p, { letters: false, hand: 'tips', stackAlpha: Math.max(0.25, kb), before: () => dots.forEach((x) => this.dot(ctx, c, x, Lb.cy, 4.5, c.annot)) });
    drawTag(ctx, c, '(b)', 58, Lb.y + 28, { size: 26 });
    const kf = kb;
    if (kf > 0) {
      drawForce(ctx, c, rb.cx, Lb.cy, { length: FR, angle: Math.PI, label: '', alpha: kf, fit: false });
      drawTag(ctx, c, 'friction', rb.cx - FR * 0.4, Lb.cy + 40, { size: 26, col: this.fInk(c), alpha: kf });
    }
    drawTag(ctx, c, 'laminate', 590, La.y - 2, { size: 26 });
  }

  // -- ThoughtExperimentScene: the frictionless lane -------------------------------------------------------------
  thought(ctx, c) {
    const a = this.age, L = this.lane(170, 200, 28, { x1: 720 }), TR = 0.5;
    // the imagine frame: a cloud edge round the lane, open past the right edge
    ctx.save();
    const glow = ctx.createRadialGradient(340, L.cy * 2, 40, 340, L.cy * 2, 420); glow.addColorStop(0, alpha(c.glass, 0.35)); glow.addColorStop(1, alpha(c.glass, 0));
    ctx.save(); ctx.scale(1, 0.5); ctx.beginPath(); ctx.arc(340, L.cy * 2, 420, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill(); ctx.restore();
    ctx.setLineDash([10, 9]); ctx.lineWidth = 3.5; ctx.strokeStyle = darken(c.glass, 0.35);
    const top = L.y - 44, bot = L.y + L.h + 44;
    rr(ctx, 12, top, 720, bot - top, 44); ctx.stroke(); ctx.setLineDash([]);
    for (const [x, y, r] of [[34, top - 24, 12], [56, top - 46, 7]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = alpha(lighten(c.glass, 0.6), 0.9); ctx.fill(); ctx.stroke(); }
    ctx.stroke(); ctx.restore();
    const go = this.cur === 1, m = go ? this.slide(a - TR, 'none') : { p: 0 };
    this.rig(ctx, c, L, 'glass', m.p, { stack: L.C.x + m.p + L.R < 720 });
    const kq = go ? ease(a, 2.4, 0.5) : 0;
    drawTag(ctx, c, 'friction = 0', 340, 92, { size: 34, col: c.accent, alpha: 1 - 0.55 * kq });
    if (kq > 0) drawTag(ctx, c, '?', 560, L.cy, { size: 96, col: c.accent, alpha: kq });
  }
}
