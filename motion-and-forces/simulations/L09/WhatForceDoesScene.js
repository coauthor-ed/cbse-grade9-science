/**
 * WhatForceDoesScene - slide blk-l09-s1 "What a force can do" (2 beats; Fig 6.1). MODE 'does'.
 *   b0 'canoe'   the canoeist on a lake takes a stroke: an F arrow "push on water" on the water behind
 *                the blade, pointing back; the canoe moves forward (v arrow). A harder stroke: a longer
 *                push arrow, and the canoe goes faster (longer v). A "?" rides with the canoe (the
 *                answer comes in a later lesson; the force of the water on the paddle is never drawn).
 *                Rest: after the hard stroke, both arrows and the "?".
 *   b1 'effects' four panels, one-shot each, F arrow on the object where the force acted (a faint copy
 *                of the object marks that spot): a kick starts a ball ("start"); a bat turns a moving
 *                ball ("turn"); a hand speeds up a rolling ball, equal-time dots spread ("speed up");
 *                a hand presses a lemon flat ("change shape"). Rest: end states.
 * ForceDirectionScene (MODE 'direction', slide blk-l09-s3) subclasses this file; its beats are drawn here:
 *   b0 'direction' three objects, one force each: a box sliding right slows, "friction" at its bottom
 *                pointing back; an apple falls, "pull of the Earth" down; a ball floats, "push of water"
 *                up. Then they dim and the magnitude line shows one box with a short push, then a long
 *                push: "longer arrow, larger force".
 *   b1 'newton'  top view of a floor; one ball. Push 5 N: it rolls a short way. Push 10 N the same way
 *                (same contact time, twice the speed, so with the same rolling friction four times the
 *                distance). Push 10 N another way: it goes that way. Hero tag "newton (N)". Rest: three
 *                faint paths labelled by their pushes.
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01, inOutSine, alpha, darken, lighten, mix, rr, drawShadow } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawSheet, drawTag } from '../shared/MotionGraph.js';
import { drawCanoeist, drawSurface } from '../shared/MotionCast.js';
import { drawForce, drawBoxOn, drawTank, drawField } from '../shared/ForceCast.js';

const TAU = Math.PI * 2;
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const WL = 330;                                                   // canoe water line
const PANELS = [{ x: 12, y: 12, w: 322, h: 242 }, { x: 346, y: 12, w: 322, h: 242 }, { x: 12, y: 266, w: 322, h: 242 }, { x: 346, y: 266, w: 322, h: 242 }];

/** Canoe speed (px/s) at time t: stroke 1 (0.4-1.2) to 40, coast, stroke 2 (2.2-3.0) to 80. */
const canoeV = (t) => (t < 0.4 ? 0 : t < 1.2 ? 40 * inOutSine((t - 0.4) / 0.8) : t < 2.2 ? 40 : t < 3.0 ? 40 + 40 * inOutSine((t - 2.2) / 0.8) : 80);
const T_END = 3.6;

export class WhatForceDoesScene extends SimScene {
  static MODE = 'does';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A canoeist on a lake pushes the water backwards with her paddle, shown by a force arrow on the water pointing back. The canoe moves forwards. She pushes harder: a longer push arrow, and the canoe goes faster, with a longer velocity arrow. A question mark rides with the canoe. Then four small pictures of what a force can do: a kick starts a ball moving; a bat turns a moving ball in a new direction; a push speeds up a rolling ball; a hand presses a lemon flat.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < (this.constructor.MODE === 'direction' ? (this.cur ? 6.2 : 4.4) : (this.cur ? 3.0 : 4.0)); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.constructor.MODE === 'direction') { if (this.cur === 0) this.direction(ctx, c); else this.newton(ctx, c); }
    else if (this.cur === 0) this.canoe(ctx, c); else this.effects(ctx, c);
  }

  /** Halo text (bg stroke under the ink), centred unless align is given. */
  say(ctx, c, text, x, y, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.font = font(c, 800, o.size ?? 26, true); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 7; ctx.strokeStyle = alpha(c.bgSurface, 0.9); ctx.strokeText(text, x, y); ctx.fillStyle = o.col ?? c.label; ctx.fillText(text, x, y); ctx.restore();
  }

  // -- b0 does: the canoe ---------------------------------------------------------------------------
  lake(ctx, c, x0 = 0, x1 = 680, top = 236) {
    const bank = mix(c.good, c.setGround ?? c.gold, 0.45);
    ctx.save();
    ctx.fillStyle = darken(bank, 0.1); ctx.beginPath(); ctx.moveTo(x0, top + 4);
    for (let x = x0; x <= x1; x += 34) ctx.quadraticCurveTo(x + 17, top - 22 - 8 * Math.sin(x * 0.05), x + 34, top + 2);
    ctx.lineTo(x1, top + 12); ctx.lineTo(x0, top + 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = darken(bank, 0.4); ctx.lineWidth = 2; ctx.stroke();
    const g = ctx.createLinearGradient(0, top, 0, 520);
    g.addColorStop(0, lighten(c.water, 0.25)); g.addColorStop(1, darken(c.water, 0.15));
    ctx.fillStyle = g; ctx.fillRect(x0, top + 8, x1 - x0, 520 - top);
    ctx.strokeStyle = alpha(lighten(c.water, 0.7), 0.7); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) { const yy = top + 30 + ((i * 53) % 230), xx = x0 + ((i * 137) % (x1 - x0 - 60)); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 24 + (i % 3) * 10, yy); ctx.stroke(); }
    ctx.restore();
  }

  canoe(ctx, c) {
    const a = Math.min(this.age, T_END);
    let x = 236;
    for (let t = 0; t < a; t += 0.01) x += canoeV(t) * Math.min(0.01, a - t);
    // stroke param: power 0.4-1.2 (0 to 1), recover 1.2-1.7, power 2.2-3.0, then held at the finish
    const st = a < 0.4 ? 0 : a < 1.2 ? (a - 0.4) / 0.8 : a < 1.7 ? 1 - (a - 1.2) / 0.5 : a < 2.2 ? 0 : Math.min(1, (a - 2.2) / 0.8);
    this.lake(ctx, c, 0, 680, 150);
    const { canoe } = drawCanoeist(ctx, c, { x, y: WL, length: 420, stroke: st, look: { hairStyle: 'braid', hair: 0 } });
    const blade = canoe.anchors?.paddle?.blade ?? { x: x - 60, y: WL + 30 };
    // push on the water: during each power stroke (and held after the hard one)
    const p1 = a >= 0.4 && a < 1.2 ? 1 : a >= 1.2 && a < 1.6 ? 1 - (a - 1.2) / 0.4 : 0;
    const p2 = a >= 2.2 ? 1 : 0;
    const by = Math.max(blade.y, WL + 26);
    if (p1 > 0) drawForce(ctx, c, blade.x - 8, by, { length: 64 * clamp01((a - 0.4) / 0.3), angle: Math.PI, label: '', alpha: p1, fit: false });
    if (p2 > 0) drawForce(ctx, c, blade.x - 8, by, { length: 128 * clamp01((a - 2.2) / 0.3), angle: Math.PI, label: '', fit: false });
    if (p1 > 0 || p2 > 0) drawTag(ctx, c, 'push on water', blade.x - 8, by + 42, { align: 'right', size: 26, col: c.s3, alpha: Math.max(p1, p2) });
    const v = canoeV(a);
    if (v > 1) {
      // above the bow, clear of the hull and the paddle: tail behind the bow, growing forward
      const vy = WL - 112, vx = x + 70;
      drawMotionArrow(ctx, c, 'v', vx, vy, { length: v * 1.6, label: '', width: 8, head: 20 });
      drawTag(ctx, c, 'velocity', vx, vy - 40, { align: 'left', size: 26, col: c.s1 });
    }
    drawTag(ctx, c, '?', x - 20, WL - 200, { size: 40, col: c.s4 });
  }

  // -- b1 does: four effects -------------------------------------------------------------------------
  panel(ctx, c, i, tag, fn) {
    const P = PANELS[i];
    drawSheet(ctx, c, P);
    ctx.save(); ctx.translate(P.x, P.y);
    rr(ctx, 4, 4, P.w - 8, P.h - 8, 12); ctx.clip();
    fn(P);
    ctx.restore();
    drawTag(ctx, c, tag, P.x + 14, P.y + 30, { align: 'left', size: 26, col: c.s3 });
  }

  effects(ctx, c) {
    const a = this.age;
    const kid = (o) => figureLook(c, { skin: o.skin ?? 2, hairStyle: o.hair ?? 'ponytail', hair: 1, top: o.top ?? 3, bottom: 5 });
    // start: a kick
    this.panel(ctx, c, 0, 'start', () => {
      const G = 214; drawField(ctx, c, { x0: 0, x1: 322, y: G, h: 40 });
      const sw = ease(a, 0.2, 0.5), hit = 0.7, bx0 = 176, r = 17;
      const bx = a < hit ? bx0 : bx0 + 118 * (1 - Math.exp(-2.4 * (a - hit)));
      const foot = { x: 70 + (bx0 - r - 70) * sw, y: G - 34 + (34 - r + 4) * sw };
      drawFigure(ctx, c, { x: 112, y: G, height: 150, build: 'teen', facing: 1, pose: 'stand', feet: [foot, { x: 118, y: G }] }, kid({}));
      if (a >= hit) { ctx.save(); ctx.globalAlpha = 0.35; drawBall(ctx, c, { x: bx0, y: G - r, r, tone: 8 }); ctx.restore(); }
      drawBall(ctx, c, { x: bx, y: G - r, r, tone: 8, shadowY: G });
      const k = ease(a, hit, 0.25);
      if (k > 0) drawForce(ctx, c, bx0, G - r, { length: 70 * k, label: 'force', alpha: k });
    });
    // turn: a bat
    this.panel(ctx, c, 1, 'turn', () => {
      const G = 226, hand = { x: 112, y: 128 }, hit = 0.7, r = 15;
      drawField(ctx, c, { x0: 0, x1: 322, y: G, h: 30 });
      const th = a < hit ? -2.1 + (2.1 + 0.45) * ease(a, 0.15, hit - 0.15) : 0.45 + 0.7 * ease(a, hit, 0.3);
      drawFigure(ctx, c, { x: 66, y: G, height: 168, build: 'teen', facing: 1, pose: 'stand', hands: [hand, { x: hand.x - 4, y: hand.y + 10 }] }, kid({ hair: 'short', top: 6, skin: 1 }));
      this.bat(ctx, c, hand.x, hand.y, th);
      const C = { x: hand.x + 84 * Math.cos(0.45) + r, y: hand.y + 84 * Math.sin(0.45) - 4 };
      const inU = clamp01((a - 0.1) / (hit - 0.1)), outU = clamp01((a - hit) / 0.8);
      const IN = { x: 330, y: C.y - 30 }, dir = -0.75;
      ctx.save(); ctx.setLineDash([6, 7]); ctx.lineWidth = 2.5; ctx.strokeStyle = alpha(c.labelMuted, 0.7);
      ctx.beginPath(); ctx.moveTo(IN.x, IN.y); ctx.lineTo(C.x + (IN.x - C.x) * (1 - inU), C.y + (IN.y - C.y) * (1 - inU)); ctx.stroke();
      if (outU > 0) { ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(C.x + 130 * outU * Math.cos(dir), C.y + 130 * outU * Math.sin(dir)); ctx.stroke(); }
      ctx.restore();
      const ball = a < hit ? { x: IN.x + (C.x - IN.x) * inU, y: IN.y + (C.y - IN.y) * inU } : { x: C.x + 130 * outU * Math.cos(dir), y: C.y + 130 * outU * Math.sin(dir) };
      if (a >= hit) { ctx.save(); ctx.globalAlpha = 0.35; drawBall(ctx, c, { x: C.x, y: C.y, r, tone: 6 }); ctx.restore(); }
      drawBall(ctx, c, { x: ball.x, y: ball.y, r, tone: 6 });
      const k = ease(a, hit, 0.25);
      if (k > 0) drawForce(ctx, c, C.x, C.y, { length: 72 * k, angle: -0.45, label: 'force', side: -1, alpha: k, fit: false });
    });
    // speed up: a hand pushes a rolling ball; equal-time dots spread out
    this.panel(ctx, c, 2, 'speed up', () => {
      const G = 196, r = 19, xc = 150, v1 = 70, v2 = 190, tc = 0.2 + (xc - 40) / v1;
      const xAt = (t) => (t < 0.2 ? 40 : t < tc ? 40 + v1 * (t - 0.2) : Math.min(300, xc + v2 * (t - tc)));
      drawSurface(ctx, c, 'tiles', 0, 322, G, { h: 30 });
      const hp = ease(a, tc - 0.35, 0.35), handTo = { x: xc - r + 2, y: G - r - 2 };
      const hand = { x: 92 + (handTo.x - 92) * hp, y: G - 70 + (handTo.y - G + 70) * hp };
      drawFigure(ctx, c, { x: 66, y: G, height: 140, build: 'teen', facing: 1, pose: { name: 'push', crouch: 0.3 }, hands: [hand, { x: hand.x - 4, y: hand.y + 4 }] }, kid({ top: 2, hair: 'short', skin: 3 }));
      ctx.save(); ctx.fillStyle = c.s5;
      for (let t = 0.2; t <= Math.min(a, 3); t += 0.3) { const xx = xAt(t); if (xx < 298) { ctx.beginPath(); ctx.arc(xx, G + 14, 4.5, 0, TAU); ctx.fill(); } }
      ctx.restore();
      if (a >= tc) { ctx.save(); ctx.globalAlpha = 0.35; drawBall(ctx, c, { x: xc, y: G - r, r, tone: 3 }); ctx.restore(); }
      drawBall(ctx, c, { x: xAt(a), y: G - r, r, tone: 3, shadowY: G });
      const k = ease(a, tc, 0.25);
      if (k > 0) drawForce(ctx, c, xc, G - r, { length: 66 * k, label: 'force', alpha: k });
    });
    // change shape: a hand presses a lemon flat on a marble slab (no figure: the hand is the doer)
    this.panel(ctx, c, 3, 'change shape', () => {
      const T = 208, lx = 168, sq = ease(a, 0.5, 0.7), ry = 36 - 12 * sq, rx = 52 + 14 * sq;
      drawSurface(ctx, c, 'marble', 0, 322, T, { h: 50 });
      this.lemon(ctx, c, lx, T, rx, ry, sq);
      ctx.save(); ctx.translate(lx + 40, T - 2 * ry + 4); ctx.scale(0.72, 0.72); this.palm(ctx, c, 0, 0); ctx.restore();
      const k = ease(a, 0.6, 0.3);
      // the force on the lemon: tail on its left shoulder, pointing down; its label on a chip over the
      // plain panel (a bare label over the white marble fails contrast in the dark theme)
      if (k > 0) {
        drawForce(ctx, c, lx - rx * 0.66, T - 1.6 * ry, { length: 46 * k, angle: Math.PI / 2, label: '', alpha: k, fit: false });
        drawTag(ctx, c, 'force', lx - rx * 0.66 - 16, T - 1.6 * ry - 24, { align: 'right', size: 26, col: c.s3, alpha: k });
      }
    });
  }

  /** A right hand seen from the side, palm down, its flat palm bottom at (x, y): sleeve up to the right,
   *  fingers pointing left, thumb tucked under. Light side up, shade below, darker rim. */
  palm(ctx, c, x, y) {
    const skin = figureLook(c, { skin: 2 }).skin, sleeve = c.s7, rim = (col) => darken(col, 0.4);
    const body = (path, col) => {
      path(); ctx.fillStyle = col; ctx.fill();
      ctx.save(); path(); ctx.clip(); ctx.fillStyle = darken(col, 0.14); ctx.fillRect(x - 200, y - 12, 500, 60); ctx.restore();
      path(); ctx.strokeStyle = rim(col); ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    };
    ctx.save();
    // sleeve: a wide band from the wrist up and off the panel to the top right
    body(() => { ctx.beginPath(); ctx.moveTo(x + 40, y - 30); ctx.lineTo(x + 150, y - 150); ctx.lineTo(x + 212, y - 110); ctx.lineTo(x + 92, y - 6); ctx.closePath(); }, sleeve);
    ctx.strokeStyle = alpha(lighten(sleeve, 0.5), 0.6); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 56, y - 34); ctx.lineTo(x + 150, y - 136); ctx.stroke();
    // back of the hand and the palm: a cushion whose flat bottom presses on the lemon
    body(() => { ctx.beginPath(); ctx.moveTo(x - 46, y); ctx.lineTo(x + 70, y); ctx.quadraticCurveTo(x + 98, y - 2, x + 90, y - 24); ctx.quadraticCurveTo(x + 66, y - 50, x + 10, y - 44); ctx.quadraticCurveTo(x - 40, y - 38, x - 50, y - 22); ctx.closePath(); }, skin);
    // four fingers, side on: one rounded slab with knuckle creases, tips curling down
    body(() => { ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x - 104, y + 2); ctx.quadraticCurveTo(x - 122, y - 2, x - 116, y - 16); ctx.quadraticCurveTo(x - 108, y - 26, x - 90, y - 26); ctx.lineTo(x - 44, y - 34); ctx.closePath(); }, skin);
    ctx.strokeStyle = alpha(rim(skin), 0.6); ctx.lineWidth = 2;
    for (const dx of [-62, -88]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 27 - (dx + 62) * 0.05); ctx.quadraticCurveTo(x + dx + 4, y - 18, x + dx, y - 10); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(x - 108, y - 9, 6, 5, 0, 0, TAU); ctx.fillStyle = lighten(skin, 0.35); ctx.fill(); ctx.strokeStyle = alpha(rim(skin), 0.6); ctx.lineWidth = 1.5; ctx.stroke();   // nail
    // thumb along the near side
    body(() => { ctx.beginPath(); ctx.ellipse(x - 6, y - 14, 30, 11, 0.08, 0, TAU); }, skin);
    ctx.restore();
  }

  /** A cricket bat from the grip at (x, y), turned by th (0 = pointing right): handle, then the blade. */
  bat(ctx, c, x, y, th) {
    const wood = mix(c.gold, c.bgSurface, 0.25), grip = c.s7;
    ctx.save(); ctx.translate(x, y); ctx.rotate(th);
    rr(ctx, -10, -5, 36, 10, 5); ctx.fillStyle = grip; ctx.fill(); ctx.strokeStyle = darken(grip, 0.4); ctx.lineWidth = 2; ctx.stroke();
    const blade = () => { ctx.beginPath(); ctx.moveTo(24, -7); ctx.lineTo(100, -11); ctx.quadraticCurveTo(108, 0, 100, 11); ctx.lineTo(24, 7); ctx.closePath(); };
    blade(); ctx.fillStyle = wood; ctx.fill();
    ctx.save(); blade(); ctx.clip(); ctx.fillStyle = darken(wood, 0.16); ctx.fillRect(20, 2, 100, 12); ctx.fillStyle = alpha(lighten(wood, 0.5), 0.8); ctx.fillRect(30, -7, 60, 3); ctx.restore();
    blade(); ctx.strokeStyle = darken(wood, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  /** A lemon resting on a slab top at y (bottom): an oval with a pointed tip at each end, peel shine and
   *  pores; squashed by sq (0..1) it gets wider and lower and a drop of juice runs out. */
  lemon(ctx, c, x, y, rx, ry, sq) {
    const col = c.gold, cy = y - ry, tip = 12 - 4 * sq;
    drawShadow(ctx, c, x, y + 1, rx + 6, 5);
    const path = () => {
      ctx.beginPath(); ctx.moveTo(x - rx - tip, cy);
      ctx.bezierCurveTo(x - rx - 2, cy - ry * 0.55, x - rx * 0.6, cy - ry, x, cy - ry);
      ctx.bezierCurveTo(x + rx * 0.6, cy - ry, x + rx + 2, cy - ry * 0.55, x + rx + tip, cy);
      ctx.bezierCurveTo(x + rx + 2, cy + ry * 0.55, x + rx * 0.6, cy + ry, x, cy + ry);
      ctx.bezierCurveTo(x - rx * 0.6, cy + ry, x - rx - 2, cy + ry * 0.55, x - rx - tip, cy); ctx.closePath();
    };
    path(); ctx.fillStyle = col; ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.fillStyle = darken(col, 0.1); ctx.beginPath(); ctx.ellipse(x + rx * 0.15, cy + ry * 1.05, rx * 1.1, ry * 0.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = alpha(darken(col, 0.3), 0.3);
    for (let i = 0; i < 12; i++) { const px = x - rx * 0.8 + ((i * 37) % 100) / 100 * rx * 1.6, py = cy - ry * 0.6 + ((i * 53) % 100) / 100 * ry * 1.3; ctx.beginPath(); ctx.arc(px, py, 1.4, 0, TAU); ctx.fill(); }
    ctx.restore();
    // peel shine: a soft crescent top left and a bright fleck
    ctx.strokeStyle = alpha(lighten(col, 0.7), 0.85); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(x - rx * 0.1, cy - ry * 0.05, rx * 0.7, ry * 0.62, 0, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
    ctx.fillStyle = alpha(lighten(col, 0.8), 0.9); ctx.beginPath(); ctx.ellipse(x - rx * 0.62, cy - ry * 0.18, 4, 3, -0.5, 0, TAU); ctx.fill();
    path(); ctx.strokeStyle = darken(col, 0.42); ctx.lineWidth = 2.5; ctx.stroke();
    if (sq > 0.5) {
      const k = (sq - 0.5) / 0.5;
      ctx.fillStyle = alpha(lighten(col, 0.35), 0.85 * k); ctx.strokeStyle = alpha(darken(col, 0.3), 0.7 * k); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x + rx + tip + 6 + 8 * k, y - 2, 6 + 8 * k, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    }
  }

  // -- ForceDirection b0: three forces, then magnitude -----------------------------------------------
  direction(ctx, c) {
    const a = this.age, dim = 1 - 0.6 * ease(a, 1.9, 0.4), G = 280;
    ctx.save(); ctx.globalAlpha = dim;
    // 1. box sliding right, slowing: x = x0 + v t - f t^2 / 2 until it stops
    const t1 = clamp01((a - 0.2) / 1.1) * 1.1, bx = 56 + 90 * t1 - 0.5 * (90 / 1.6) * t1 * t1;     // frozen while still sliding
    const box = drawBoxOn(ctx, c, { x: bx, y: G, w: 92, h: 74, surface: 'tiles', x0: 8, x1: 226 });
    const k1 = ease(a, 0.4, 0.4);
    this.streaks(ctx, c, box.back.x - 8, box.centre.y, k1);
    if (k1 > 0) drawForce(ctx, c, box.bottom.x, box.bottom.y + 2, { length: 76 * k1, angle: Math.PI, label: 'friction', side: 1, alpha: k1, fit: false, frame: { x: 0, y: 0, w: 680, h: 520 } });
    // 2. apple falling (x = g t^2 / 2), from the twig to the ground
    const t2 = clamp01((a - 0.6) / 0.6) * 0.6, ay = 84 + 0.5 * 300 * t2 * t2;                        // frozen mid-fall (y 138)
    this.twig(ctx, c, 340, 52);
    drawField(ctx, c, { x0: 238, x1: 442, y: G, h: 22 });
    for (const tg of [0.2, 0.4]) if (t2 > tg + 0.05) { ctx.save(); ctx.globalAlpha *= 0.25; this.apple(ctx, c, 340, 84 + 150 * tg * tg); ctx.restore(); }
    this.apple(ctx, c, 340, ay);
    const k2 = ease(a, 0.8, 0.4);
    if (k2 > 0) {
      drawForce(ctx, c, 340, ay, { length: 70 * k2, angle: Math.PI / 2, label: '', alpha: k2 });
      this.say(ctx, c, 'pull of', 354, ay + 44, { align: 'left', col: c.s3ink ?? darken(c.s3, 0.3), alpha: k2 });
      this.say(ctx, c, 'the Earth', 354, ay + 74, { align: 'left', col: c.s3ink ?? darken(c.s3, 0.3), alpha: k2 });
    }
    // 3. ball floating on water
    const T = { x: 580, y: G + 8, w: 150, h: 150, level: 0.58 };
    const tank = drawTank(ctx, c, { ...T, part: 'back' });
    drawBall(ctx, c, { x: T.x, y: tank.surface, r: 30, tone: 6 });
    drawTank(ctx, c, { ...T, part: 'front' });
    const k3 = ease(a, 1.4, 0.4);
    if (k3 > 0) {
      drawForce(ctx, c, T.x, tank.surface, { length: 80 * k3, angle: -Math.PI / 2, label: '', alpha: k3 });
      this.say(ctx, c, 'push of', T.x - 14, 104, { align: 'right', col: c.s3ink ?? darken(c.s3, 0.3), alpha: k3 });
      this.say(ctx, c, 'water', T.x - 14, 134, { align: 'right', col: c.s3ink ?? darken(c.s3, 0.3), alpha: k3 });
    }
    ctx.restore();
    // magnitude: one box, a short push, then a long push
    const m = ease(a, 1.9, 0.4);
    if (m <= 0) return;
    ctx.save(); ctx.globalAlpha = m;
    const S = { x: 30, y: 326, w: 620, h: 184 };
    drawSheet(ctx, c, S);
    const F = S.y + S.h - 22;
    const bA = drawBoxOn(ctx, c, { x: 150, y: F, w: 84, h: 66 });
    const bB = drawBoxOn(ctx, c, { x: 404, y: F, w: 84, h: 66 });
    ctx.strokeStyle = darken(c.stroke, 0.2); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(S.x + 20, F); ctx.lineTo(S.x + S.w - 20, F); ctx.stroke();
    ctx.restore();
    const kA = ease(a, 2.2, 0.4), kB = ease(a, 2.6, 0.5);
    if (kA > 0) drawForce(ctx, c, bA.centre.x, bA.centre.y, { length: 60 * kA, label: 'push', alpha: kA * m, at: 0.75 });
    if (kB > 0) drawForce(ctx, c, bB.centre.x, bB.centre.y, { length: 150 * kB, label: 'push', alpha: kB * m, fit: false });
    const kt = ease(a, 3.0, 0.4);
    if (kt > 0) drawTag(ctx, c, 'longer arrow, larger force', 340, S.y + 34, { size: 28, col: darken(c.s3, 0.1), alpha: kt });
  }

  /** Speed lines behind a moving thing (left of x), k 0..1. */
  streaks(ctx, c, x, y, k) {
    ctx.save(); ctx.globalAlpha *= 0.7 * k; ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const [dy, l] of [[-18, 26], [0, 38], [18, 22]]) { ctx.beginPath(); ctx.moveTo(x - 6, y + dy); ctx.lineTo(x - 6 - l, y + dy); ctx.stroke(); }
    ctx.restore();
  }

  twig(ctx, c, x, y) {
    const bark = mix(c.gold, c.label, 0.45), leaf = mix(c.good, c.gold, 0.15);
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = darken(bark, 0.3); ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(x - 110, y - 22); ctx.quadraticCurveTo(x - 30, y - 6, x + 70, y - 30); ctx.stroke();
    ctx.strokeStyle = bark; ctx.lineWidth = 7; ctx.stroke();
    ctx.strokeStyle = darken(bark, 0.3); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 6); ctx.stroke();
    for (const [lx, ly, rot] of [[x - 64, y - 30, -0.6], [x + 36, y - 40, 0.5], [x - 20, y - 22, -0.2]]) {
      ctx.beginPath(); ctx.ellipse(lx, ly, 22, 10, rot, 0, TAU); ctx.fillStyle = leaf; ctx.fill(); ctx.strokeStyle = darken(leaf, 0.4); ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = alpha(lighten(leaf, 0.5), 0.7); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx - 16 * Math.cos(rot), ly - 16 * Math.sin(rot)); ctx.lineTo(lx + 16 * Math.cos(rot), ly + 16 * Math.sin(rot)); ctx.stroke();
    }
    ctx.restore();
  }

  apple(ctx, c, x, y) {
    const r = 22, col = c.bad;
    drawBall(ctx, c, { x, y, r, tone: col });
    ctx.save(); ctx.strokeStyle = mix(c.gold, c.label, 0.5); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - r + 3); ctx.lineTo(x + 3, y - r - 9); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + 11, y - r - 6, 8, 4, -0.5, 0, TAU); ctx.fillStyle = mix(c.good, c.gold, 0.15); ctx.fill(); ctx.restore();
  }

  // -- ForceDirection b1: newton, three pushes on a floor seen from above ----------------------------
  newton(ctx, c) {
    const a = this.age, S = { x: 120, y: 348 }, PX = 10;    // 10 px per newton
    // floor from above: tiles
    const F = { x: 24, y: 120, w: 632, h: 380 }, tile = mix(darken(c.bgSurface, 0.04), c.gold, 0.22);
    ctx.save();
    rr(ctx, F.x, F.y + 5, F.w, F.h, 16); ctx.fillStyle = darken(tile, 0.4); ctx.fill();
    rr(ctx, F.x, F.y, F.w, F.h, 16); ctx.fillStyle = tile; ctx.fill();
    ctx.save(); rr(ctx, F.x, F.y, F.w, F.h, 16); ctx.clip();
    ctx.fillStyle = darken(tile, 0.18);
    for (let x = F.x + 79; x < F.x + F.w; x += 79) ctx.fillRect(x - 1.5, F.y, 3, F.h);
    for (let y = F.y + 76; y < F.y + F.h; y += 76) ctx.fillRect(F.x, y - 1.5, F.w, 3);
    ctx.fillStyle = alpha(lighten(tile, 0.6), 0.6);
    for (let x = F.x + 6; x < F.x + F.w; x += 79) for (let y = F.y + 6; y < F.y + F.h; y += 76) ctx.fillRect(x, y, 40, 3);
    ctx.restore();
    rr(ctx, F.x, F.y, F.w, F.h, 16); ctx.strokeStyle = darken(tile, 0.45); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    drawTag(ctx, c, 'newton (N)', 340, 58, { size: 40, col: darken(c.s3, 0.1) });
    // pushes: same contact time, so v is in proportion to F; same rolling friction, so d = v^2 / (2 a)
    const P = [
      { n: 5, ang: 0, t0: 0.5, label: '5 N' },
      { n: 10, ang: 0, t0: 2.0, label: '10 N' },
      { n: 10, ang: -0.62, t0: 4.0, label: '10 N' },
    ];
    const D5 = 72, roll = (p) => {                       // distance and time of the roll
      const d = D5 * (p.n / 5) ** 2, T = 0.7 * (p.n / 5);
      return { d, T };
    };
    let live = null;
    P.forEach((p, i) => {
      if (a < p.t0) return;
      const { d, T } = roll(p), u = clamp01((a - p.t0 - 0.35) / T), s = d * (1 - (1 - u) ** 2);
      const ex = S.x + d * Math.cos(p.ang), ey = S.y + d * Math.sin(p.ang);
      const done = i < P.length - 1 ? a >= P[i + 1].t0 : false;
      const faint = done ? 0.5 : 1;
      ctx.save(); ctx.globalAlpha = faint * 0.8; ctx.setLineDash([7, 7]); ctx.lineWidth = 3; ctx.strokeStyle = c.labelMuted;
      ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(S.x + s * Math.cos(p.ang), S.y + s * Math.sin(p.ang)); ctx.stroke(); ctx.restore();
      if (done || u >= 1) {
        ctx.save(); ctx.globalAlpha = done ? 0.45 : 1; drawBall(ctx, c, { x: ex, y: ey, r: 20, tone: 6 }); ctx.restore();
        drawTag(ctx, c, p.label, ex + (p.ang === 0 ? 0 : 18), ey + (p.ang === 0 ? 46 : -42), { size: 26, col: c.s3, alpha: done ? 0.7 : 1 });
      } else live = { x: S.x + s * Math.cos(p.ang), y: S.y + s * Math.sin(p.ang) };
      const ka = a < p.t0 + 0.35 ? ease(a, p.t0, 0.3) : 1 - ease(a, p.t0 + 0.35 + T * 0.5, 0.4);
      if (ka > 0) drawForce(ctx, c, S.x, S.y, { length: p.n * PX * Math.min(1, ease(a, p.t0, 0.3) + 0.0001), angle: p.ang, label: p.label, alpha: ka, fit: false, side: p.ang === 0 ? 1 : -1 });
    });
    const next = P.find((p) => a < p.t0 + 0.35);
    if (live) drawBall(ctx, c, { x: live.x, y: live.y, r: 20, tone: 6 });
    else if (next || a < P[0].t0 + 0.35) drawBall(ctx, c, { x: S.x, y: S.y, r: 20, tone: 6 });
    // start mark
    ctx.save(); ctx.strokeStyle = alpha(c.label, 0.5); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(S.x, S.y, 27, 0, TAU); ctx.stroke(); ctx.restore();
  }
}
