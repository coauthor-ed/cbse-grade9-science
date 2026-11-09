// BagLiftScene.js - lifting wheat bags (book Fig 7.2, 7.3). Two slides:
//   blk-l01-s06 (2 beats): stage 0 one bag lifted 1 m (F up, s up, 1 W);
//                          stage 1 three bags, one after the other, onto a cart (1, 2, 3 W).
//   blk-l01-n01 (3 beats): stage 2 three bags tied together, 3F, 3 W;
//                          stage 3 one bag to 3 m with a rope over a pulley, F, 3 W;
//                          stage 4 the rule for a sideways push and a lift: W = F x s.
// "W" here is the work for one bag lifted 1 m (the book's unit for this page),
// so no joules appear on these two slides.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, font, alpha, lighten, darken, mix, rr,
  clamp01, lerp,
} from 'simulations/base/kit/SimLook.js';
import { drawWorkCounter } from 'simulations/base/kit/SimEnergy.js';
import { drawSack } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

const MAP2 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
const MAP3 = [[{ idx: 2, dwellMs: null }], [{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }]];

const GROUND = 462;
// px per metre: 130 for the 1 m lifts (a big figure and bags), 100 for the 3 m pulley beat.
// setScale() is called at the top of every draw, from the stage alone.
let P = 130;
let FIG_X = 200;
let BX = 291; // the bag's centre x
let SW = 62, SH = 73; // one sack (a 5 kg bag)
const F_LEN = 40; // one F (and one mg): the same length on every beat
let S_X = BX + 87; // the dashed displacement arrow
function setScale(p) {
  P = p;
  FIG_X = p === 130 ? 200 : 230;
  BX = FIG_X + Math.round((p === 130 ? 0.55 : 0.6) * p);
  SW = Math.round(0.42 * p); SH = Math.round(0.5 * p);
  S_X = BX + SW / 2 + 56;
}
const SCALE_X = 50;
const CART = { x0: 404, x1: 652 };
const SLOTS = [612, 538, 464];
const CNT = { x: 560, y: 40 };
const LINE_X1 = 440; // the 3 m level line stops short of the work counter

// stage 1: one bag every T1 seconds
const T1 = 1.2;
const B0 = 0.2;
const smooth = (u) => u * u * (3 - 2 * u);

function dashArrow(ctx, c, x1, y1, x2, y2, o = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 8) return;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const col = o.col ?? c.label;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.lineCap = 'round';
  if (o.glow) {
    ctx.strokeStyle = alpha(c.gold, 0.45 * o.glow);
    ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4;
  ctx.setLineDash([9, 7]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * 12, y2 - uy * 12); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * 15 - uy * 8, y2 - uy * 15 + ux * 8);
  ctx.lineTo(x2 - ux * 15 + uy * 8, y2 - uy * 15 - ux * 8);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function forceArrow(ctx, c, x1, y1, x2, y2, o = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 8) return;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const col = o.col ?? c.accent;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.lineCap = 'round';
  ctx.strokeStyle = darken(col, 0.3); ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * 14, y2 - uy * 14); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * 14, y2 - uy * 14); ctx.stroke();
  ctx.fillStyle = col; ctx.strokeStyle = darken(col, 0.3); ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * 20 - uy * 11, y2 - uy * 20 + ux * 11);
  ctx.lineTo(x2 - ux * 20 + uy * 11, y2 - uy * 20 - ux * 11);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

// a wooden block for the Fig 7.3 pair: planks, lit top and left, shade right
function crate(ctx, c, cx, bottom, w, h) {
  const x = cx - w / 2, y = bottom - h;
  const wood = mix(c.gold, c.flame, 0.25);
  ctx.save();
  ctx.fillStyle = darken(wood, 0.35); rr(ctx, x - 2, y - 2, w + 4, h + 4, 6); ctx.fill();
  ctx.fillStyle = wood; rr(ctx, x, y, w, h, 5); ctx.fill();
  ctx.fillStyle = darken(wood, 0.15); ctx.fillRect(x + w * 0.68, y + 3, w * 0.32 - 3, h - 6);
  ctx.fillStyle = lighten(wood, 0.3); ctx.fillRect(x + 3, y + 3, 5, h - 6); ctx.fillRect(x + 3, y + 3, w - 6, 4);
  ctx.strokeStyle = darken(wood, 0.3); ctx.lineWidth = 2;
  for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + 4, y + (h * k) / 3); ctx.lineTo(x + w - 4, y + (h * k) / 3); ctx.stroke(); }
  ctx.restore();
}

export class BagLiftScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP2;
  static BEAT_MAPS = { 2: MAP2, 3: MAP3 };
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A student lifts red wheat bags beside a height scale from 0 to 3 m. The force arrow F points up and the dashed displacement arrow s points up. One bag lifted 1 m is 1 W of work; three bags one after the other give 3 W; three bags tied together need 3F over 1 m, 3 W; one bag lifted 3 m with force F is also 3 W. Last, a block pushed sideways and a block lifted, each with W = F x s.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Play again' }];

  enter() {
    this.runT0 = 0;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') {
      this.runT0 = this.age;
      this.animateFor?.(200);
    }
  }

  t() {
    return reducedMotion() ? 99 : this.age - (this.runT0 || 0);
  }

  st() {
    return this.stage >= 0 && this.stage <= 4 ? this.stage : 0;
  }

  busy() {
    return this.t() < [2.4, B0 + 3 * T1 + 0.1, 1.8, 3.4, 1.6][this.st()];
  }

  draw(ctx, c) {
    const s = this.st();
    const t = this.t();
    setScale(s === 3 ? 100 : 130);
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, {});
    if (s === 4) { this.pair(ctx, c, t); return; }
    this.grid(ctx, c);
    if (s === 0) this.one(ctx, c, t);
    else if (s === 1) this.three(ctx, c, t);
    else if (s === 2) this.tied(ctx, c, t);
    else this.high(ctx, c, t);
  }

  // the 0-3 m scale and its dashed levels, as in Fig 7.2
  grid(ctx, c) {
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.28); ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    for (let m = 1; m <= 3; m++) {
      const y = GROUND - m * P;
      ctx.beginPath(); ctx.moveTo(SCALE_X + 18, y); ctx.lineTo(y < 120 ? LINE_X1 : W - 20, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    const wood = mix(c.gold, c.bgDeep, 0.2);
    ctx.fillStyle = darken(wood, 0.35); ctx.fillRect(SCALE_X + 4, GROUND - 3 * P - 6, 14, 3 * P + 6);
    ctx.fillStyle = wood; ctx.fillRect(SCALE_X + 6, GROUND - 3 * P - 4, 10, 3 * P + 4);
    ctx.fillStyle = lighten(wood, 0.3); ctx.fillRect(SCALE_X + 6, GROUND - 3 * P - 4, 3, 3 * P + 4);
    for (let i = 0; i <= 30; i++) {
      const y = GROUND - (i * P) / 10;
      ctx.fillStyle = alpha(c.bgDeep, i % 10 === 0 ? 0.95 : 0.5);
      ctx.fillRect(SCALE_X + 6, y - 1, i % 10 === 0 ? 10 : 5, 2);
    }
    ctx.font = font(c, 700, 26, true); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillStyle = c.labelMuted;
    for (let m = 0; m <= 3; m++) ctx.fillText(`${m} m`, SCALE_X, GROUND - m * P - (m === 0 ? 10 : 0));
    ctx.restore();
  }

  // the work so far: "work x n" (W reads as watts) and three cells that fill one by one
  counter(ctx, c, n, pulse = 0) {
    drawWorkCounter(ctx, c, { x: CNT.x, y: CNT.y, text: n > 0 ? `work \u00d7 ${n}` : 'work = 0', size: 26 });
    const cw = 44, ch = 22, gap = 8, x0 = CNT.x - (3 * cw + 2 * gap) / 2, y0 = CNT.y + 30;
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * (cw + gap);
      ctx.save();
      ctx.fillStyle = darken(c.bgSurface, 0.1); rr(ctx, x - 2, y0 - 2, cw + 4, ch + 4, 7); ctx.fill();
      ctx.fillStyle = c.bgSurface; rr(ctx, x, y0, cw, ch, 6); ctx.fill();
      if (i < n) {
        const k = i === n - 1 ? 1 + 0.12 * pulse : 1;
        ctx.translate(x + cw / 2, y0 + ch / 2); ctx.scale(k, k); ctx.translate(-(x + cw / 2), -(y0 + ch / 2));
        ctx.fillStyle = c.accent; rr(ctx, x, y0, cw, ch, 6); ctx.fill();
        ctx.fillStyle = darken(c.accent, 0.2); ctx.fillRect(x + cw * 0.66, y0 + 3, cw * 0.34 - 4, ch - 6);
        ctx.fillStyle = alpha(lighten(c.accent, 0.5), 0.8); ctx.fillRect(x + 4, y0 + 3, cw - 8, 3);
      }
      ctx.restore();
    }
  }

  // the student, hands under the sack's bottom; k = 0 crouched at the floor, 1 standing at 1 m
  lifter(ctx, c, bx, bottom, w, k, between, dx = 0) {
    const spec = figureFor(this, {
      role: 'adult', scale: P, facing: 1, y: GROUND,
      x: lerp(FIG_X + 16, FIG_X, k) + dx,
      pose: { name: 'carry', crouch: lerp(0.75, 0.06, k), lean: lerp(40, 0, k) },
      hands: [{ x: bx - w * 0.3, y: bottom + 1 }, { x: bx + w * 0.02, y: bottom + 2 }],
    });
    drawFigure(ctx, c, spec, { mood: 'effort' }, { between });
  }

  sack(ctx, c, x, bottom, o = {}) {
    drawSack(ctx, c, { x, y: bottom, w: o.w ?? SW, h: SH, kind: 'sack', tone: 6, held: bottom < GROUND - 1 });
  }

  forceLabel(ctx, c, text, x, y, a = 1) {
    pill(ctx, c, text, x, y, { size: 26, bg: c.accent, alpha: a });
  }

  // the bag's weight: a short solid arrow down from its bottom, clear of the hands
  // side 0: the pill sits under the arrow head (one-bag beats: the s arrow leaves no room beside it)
  weight(ctx, c, x, bottom, n, a = 1, side = 1) {
    const end = bottom + 4 + n * F_LEN;
    forceArrow(ctx, c, x, bottom + 4, x, end, { col: c.bad, alpha: a });
    const label = n > 1 ? `${n}mg` : 'mg';
    if (side === 0) pill(ctx, c, label, x, end + 22, { size: 26, bg: c.bad, alpha: a });
    else pill(ctx, c, label, x + side * 34, end - 12, { size: 26, bg: c.bad, alpha: a });
  }

  // a standing figure at rest, arms down (stage 1 once the last bag is on the cart)
  rest(ctx, c) {
    const spec = figureFor(this, { role: 'adult', scale: P, facing: 1, y: GROUND, x: FIG_X, pose: 'stand' });
    drawFigure(ctx, c, spec, { mood: 'smile' });
  }

  // stage 0: one bag up 1 m
  one(ctx, c, t) {
    const u = smooth(clamp01((t - 0.4) / 1.0));
    const bottom = GROUND - u * P;
    this.lifter(ctx, c, BX, bottom, SW, u, () => this.sack(ctx, c, BX, bottom));
    const a = clamp01(u / 0.25);
    const top = bottom - SH;
    forceArrow(ctx, c, BX, top - 8, BX, top - 8 - F_LEN, { alpha: a });
    this.forceLabel(ctx, c, 'F', BX + 34, top - 8 - F_LEN + 12, a);
    if (u > 0.2) this.weight(ctx, c, BX + SW / 2 - 12, bottom, 1, a, 0);
    const glow = clamp01((t - 1.5) / 0.4);
    if (u > 0.15) {
      dashArrow(ctx, c, S_X, GROUND, S_X, bottom, { alpha: a, glow: glow * (0.75 + 0.25 * Math.sin(this.clock * 4)) });
      // the s chip becomes the displacement chip in place, so the two never stack
      if (glow < 1) pill(ctx, c, 's', S_X + 26, (GROUND + bottom) / 2, { size: 26, bg: c.label, alpha: a * (1 - glow) });
      if (glow > 0) pill(ctx, c, 'displacement: 1 m up', S_X + 14, (GROUND + bottom) / 2, { size: 26, bg: c.gold, alpha: glow, align: 'left' });
    }
    const done = t >= 1.4;
    this.counter(ctx, c, done ? 1 : 0, done ? Math.max(0, 1 - (t - 1.4) / 0.3) : 0);
  }

  cart(ctx, c) {
    const top = GROUND - P;
    const wood = mix(c.gold, c.flame, 0.2);
    const { x0, x1 } = CART;
    ctx.save();
    // wheel
    const wx = (x0 + x1) / 2 + 30, wy = GROUND - 40, r = 40;
    ctx.fillStyle = darken(wood, 0.45); ctx.beginPath(); ctx.arc(wx, wy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.bgDeep; ctx.beginPath(); ctx.arc(wx, wy, r - 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = darken(wood, 0.3); ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a) * (r - 6), wy + Math.sin(a) * (r - 6)); ctx.stroke();
    }
    ctx.fillStyle = darken(wood, 0.4); ctx.beginPath(); ctx.arc(wx, wy, 9, 0, Math.PI * 2); ctx.fill();
    // frame posts from the bed to the axle line and a prop at the front
    ctx.fillStyle = darken(wood, 0.25);
    ctx.fillRect(x0 + 10, top + 18, 12, GROUND - top - 18);
    ctx.fillRect(wx - 6, top + 18, 12, wy - top - 18);
    // the shaft going off to the right
    ctx.fillRect(x1 - 10, top + 6, W - x1 + 10, 9);
    // bed: top face, front board, shade, planks
    ctx.fillStyle = lighten(wood, 0.25); ctx.fillRect(x0, top - 4, x1 - x0, 6);
    ctx.fillStyle = wood; ctx.fillRect(x0, top + 2, x1 - x0, 18);
    ctx.fillStyle = darken(wood, 0.2); ctx.fillRect(x0, top + 14, x1 - x0, 6);
    ctx.strokeStyle = darken(wood, 0.35); ctx.lineWidth = 2;
    ctx.strokeRect(x0, top - 4, x1 - x0, 24);
    for (let x = x0 + 44; x < x1; x += 44) { ctx.beginPath(); ctx.moveTo(x, top + 2); ctx.lineTo(x, top + 20); ctx.stroke(); }
    ctx.restore();
  }

  // stage 1: three bags, one after the other, each lifted 1 m and slid onto the cart
  three(ctx, c, t) {
    this.cart(ctx, c);
    let n = 0;
    let pulse = 0;
    // where each bag is now
    const bags = [];
    let active = null;
    for (let i = 0; i < 3; i++) {
      const tl = t - B0 - i * T1;
      if (tl < 0) { bags.push({ i, pile: true }); continue; }
      const lift = smooth(clamp01((tl - 0.1) / 0.5));
      if (tl >= 0.6) { n = i + 1; pulse = Math.max(0, 1 - (tl - 0.6) / 0.3); }
      const slide = smooth(clamp01((tl - 0.65) / 0.3));
      const ret = i < 2 ? smooth(clamp01((tl - 0.95) / 0.2)) : 0;
      const x = lerp(BX, SLOTS[i], slide);
      const bottom = GROUND - lift * P;
      const appear = clamp01(tl / 0.25);
      bags.push({ i, x, bottom, appear });
      if (tl < (i < 2 ? T1 : 0.95)) active = { i, x, bottom, lift, slide, ret, tl };
    }
    // waiting bags, a small pile behind the student
    const pile = bags.filter((b) => b.pile);
    pile.forEach((b, k) => this.sack(ctx, c, 112 + k * 56, GROUND, { w: 52 }));
    // bags already on the cart
    for (const b of bags) if (!b.pile && (!active || b.i < active.i)) this.sack(ctx, c, b.x, b.bottom);
    if (active) {
      const k = active.slide > 0 ? 1 - active.ret : active.lift;
      const dx = 0;
      const handsAt = active.slide > 0 && active.ret > 0 ? { x: BX, bottom: GROUND } : { x: Math.min(active.x, BX + 24), bottom: active.bottom };
      const drawBag = () => {
        ctx.save(); ctx.globalAlpha *= clamp01(active.tl / 0.25);
        this.sack(ctx, c, active.x, active.bottom);
        ctx.restore();
      };
      if (active.ret > 0) {
        drawBag();
        this.lifter(ctx, c, handsAt.x, lerp(GROUND - P, GROUND, active.ret), SW, k, null, 0);
      } else {
        this.lifter(ctx, c, handsAt.x - dx * 0, handsAt.bottom, SW, k, drawBag, dx);
      }
      // arrows while the bag goes up
      if (active.slide === 0 && active.lift > 0.15) {
        const a = clamp01(active.lift / 0.3);
        const top = active.bottom - SH;
        forceArrow(ctx, c, BX, top - 8, BX, top - 8 - F_LEN, { alpha: a });
        this.forceLabel(ctx, c, 'F', BX + 34, top - 8 - F_LEN + 12, a);
        this.weight(ctx, c, BX + SW / 2 - 12, active.bottom, 1, a, 0);
        dashArrow(ctx, c, S_X, GROUND, S_X, active.bottom, { alpha: a });
        pill(ctx, c, 's', S_X + 26, (GROUND + active.bottom) / 2, { size: 26, bg: c.label, alpha: a });
      }
    } else if (t < B0) {
      this.lifter(ctx, c, BX, GROUND, SW, 0, null);
    } else {
      this.rest(ctx, c);
    }
    this.counter(ctx, c, n, pulse);
  }

  // stage 2: three bags tied together, lifted 1 m: 3F. Seen from the front: the
  // three bags lie side by side in one long bundle, held with both hands under
  // its middle, in front of his chest and below his face.
  tied(ctx, c, t) {
    const u = smooth(clamp01((t - 0.4) / 1.0));
    const bottom = GROUND - u * P;
    const fx = 300;                        // the figure (front view) and the bundle's centre
    const L = Math.round(0.45 * P);        // one bag lying down: its length
    const T = Math.round(0.26 * P);        // and its thickness
    const w3 = 3 * L;
    const draw3 = () => {
      for (let k = 0; k < 3; k++) {
        const cx = fx - L + k * L;
        ctx.save();
        ctx.translate(cx, bottom - T / 2);
        ctx.rotate(k === 2 ? -Math.PI / 2 : Math.PI / 2);
        drawSack(ctx, c, { x: 0, y: L / 2, w: T / 1.2, h: L, kind: 'sack', tone: 6, held: true });
        ctx.restore();
      }
      // the cords that tie them: one along the bundle, one round each join
      ctx.save();
      ctx.lineCap = 'round';
      const cord = darken(c.gold, 0.2);
      const cy = bottom - T / 2;
      ctx.strokeStyle = cord; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(fx - w3 / 2 + 6, cy); ctx.lineTo(fx + w3 / 2 - 6, cy); ctx.stroke();
      for (const jx of [fx - L / 2, fx + L / 2]) {
        ctx.beginPath(); ctx.moveTo(jx, bottom - T - 3); ctx.lineTo(jx, bottom + 2); ctx.stroke();
      }
      ctx.strokeStyle = alpha(lighten(c.gold, 0.4), 0.8); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(fx - w3 / 2 + 6, cy - 1.5); ctx.lineTo(fx + w3 / 2 - 6, cy - 1.5); ctx.stroke();
      ctx.restore();
    };
    if (u <= 0.02) drawShadow(ctx, c, fx, GROUND + 2, w3 * 0.5, 6);
    const spec = figureFor(this, {
      role: 'adult', scale: P, facing: 0, y: GROUND, x: fx,
      pose: { name: 'stand', crouch: lerp(0.7, 0, u) },
      hands: [{ x: fx + 0.24 * P, y: bottom + 2 }, { x: fx - 0.24 * P, y: bottom + 2 }],
    });
    drawFigure(ctx, c, spec, { mood: 'effort' }, { between: draw3 });
    const a = clamp01(u / 0.25);
    const ax = fx + w3 / 2 - 22;           // the force pair at the bundle's right end, clear of his face
    forceArrow(ctx, c, ax, bottom - T - 8, ax, bottom - T - 8 - 3 * F_LEN, { alpha: a });
    this.forceLabel(ctx, c, '3F', ax + 40, bottom - T - 8 - 3 * F_LEN + 14, a);
    if (u > 0.2) this.weight(ctx, c, ax, bottom, 3, a);
    const sx = fx + w3 / 2 + 70;
    if (u > 0.15) {
      dashArrow(ctx, c, sx, GROUND, sx, bottom, { alpha: a });
      pill(ctx, c, 's = 1 m', sx + 58, (GROUND + bottom) / 2, { size: 26, bg: c.label, alpha: a });
    }
    const done = t >= 1.4;
    this.counter(ctx, c, done ? 3 : 0, done ? Math.max(0, 1 - (t - 1.4) / 0.3) : 0);
  }

  // stage 3: one bag to 3 m, pulled up by a rope over a pulley; the force on the bag is still F
  high(ctx, c, t) {
    const u = smooth(clamp01((t - 0.4) / 2.4));
    const bottom = GROUND - u * 3 * P;
    const top = bottom - SH;
    const wx = BX + 22, wy = GROUND - 3 * P - SH - 40, r = 22;
    const metal = mix(c.bgSurface, c.label, 0.45);
    // the gantry: two posts and a beam
    ctx.save();
    for (const x of [196, 432]) {
      ctx.fillStyle = darken(metal, 0.2); ctx.fillRect(x - 7, wy - 26, 14, GROUND - wy + 26);
      ctx.fillStyle = lighten(metal, 0.25); ctx.fillRect(x - 7, wy - 26, 4, GROUND - wy + 26);
    }
    ctx.fillStyle = darken(metal, 0.2); ctx.fillRect(184, wy - 40, 260, 16);
    ctx.fillStyle = lighten(metal, 0.25); ctx.fillRect(184, wy - 40, 260, 4);
    ctx.fillStyle = metal; ctx.fillRect(wx - 4, wy - 26, 8, 26);
    // the pulley wheel
    ctx.fillStyle = darken(metal, 0.3); ctx.beginPath(); ctx.arc(wx, wy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = metal; ctx.beginPath(); ctx.arc(wx, wy, r - 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = darken(metal, 0.4); ctx.beginPath(); ctx.arc(wx, wy, 5, 0, Math.PI * 2); ctx.fill();
    // the rope: bag neck up the left, over the wheel, down the right to the hands
    const rope = mix(c.gold, c.bgDeep, 0.15);
    ctx.strokeStyle = darken(rope, 0.2); ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(BX, top + 10); ctx.lineTo(wx - r + 2, wy);
    ctx.arc(wx, wy, r - 2, Math.PI, 0);
    ctx.lineTo(wx + r - 2, GROUND - 0.95 * P);
    // the free end, below his hands, hangs slack to the floor and lies in a loose coil
    ctx.quadraticCurveTo(wx + r - 6, GROUND - 0.3 * P, wx + r - 30, GROUND - 4);
    ctx.quadraticCurveTo(wx + r - 60, GROUND + 2, wx + r - 44, GROUND - 6);
    ctx.quadraticCurveTo(wx + r - 24, GROUND - 12, wx + r - 52, GROUND - 2);
    ctx.stroke();
    ctx.restore();
    // the student pulls the rope down, hand over hand
    const bob = Math.sin(t * 9) * 6 * (u > 0 && u < 1 ? 1 : 0);
    const hx = wx + r - 2;
    const spec = figureFor(this, {
      role: 'adult', scale: P, facing: -1, y: GROUND, x: hx + 46,
      pose: { name: 'pull', lean: -6 },
      hands: [{ x: hx, y: GROUND - 1.0 * P + bob }, { x: hx, y: GROUND - 1.18 * P - bob }],
    });
    this.sack(ctx, c, BX, bottom);
    drawFigure(ctx, c, spec, { mood: 'effort' });
    // F on the bag, the same length as for one bag before; s from the floor
    const a = clamp01(u / 0.08);
    forceArrow(ctx, c, BX - SW / 2 - 18, bottom - 20, BX - SW / 2 - 18, bottom - 20 - F_LEN, { alpha: a });
    this.forceLabel(ctx, c, 'F', BX - SW / 2 - 50, bottom - 20 - F_LEN + 10, a);
    if (u > 0.2) this.weight(ctx, c, BX - 4, bottom, 1, a, -1);   // pill to the left, off the rope
    const sx = 132;
    dashArrow(ctx, c, sx, GROUND, sx, bottom, { alpha: a });
    if (u > 0.15) pill(ctx, c, `s = ${u >= 1 ? 3 : Math.max(0, Math.floor(u * 3 + 1e-6))} m`, sx + 66, Math.min(GROUND - 22, (GROUND + bottom) / 2), { size: 26, bg: c.label, alpha: a });
    const n = Math.min(3, Math.floor(u * 3 + 1e-6));
    const step = u * 3 - Math.floor(u * 3);
    this.counter(ctx, c, n, n > 0 && u < 1 ? Math.max(0, 1 - step / 0.25) : 0);
  }

  // stage 4: Fig 7.3 - a sideways push and a lift, the same rule
  pair(ctx, c, t) {
    const u = smooth(clamp01((t - 0.3) / 1.0));
    // divider
    ctx.save();
    ctx.strokeStyle = alpha(c.stroke, 0.6); ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(352, 120); ctx.lineTo(352, GROUND - 6); ctx.stroke();
    ctx.restore();
    // left: pushed sideways
    const x0 = 140, x1 = 268, cw = 96, ch = 82;
    const x = lerp(x0, x1, u);
    drawShadow(ctx, c, x, GROUND + 2, cw * 0.6, 5, 0.7);
    ghost(ctx, c, x0, GROUND, cw, ch, u);
    crate(ctx, c, x, GROUND, cw, ch);
    forceArrow(ctx, c, x - cw / 2 - 70, GROUND - ch / 2, x - cw / 2 - 6, GROUND - ch / 2);
    this.forceLabel(ctx, c, 'F', x - cw / 2 - 52, GROUND - ch / 2 - 34);
    dashArrow(ctx, c, x0, GROUND - ch - 34, x, GROUND - ch - 34, { alpha: clamp01(u / 0.2) });
    if (u > 0.3) pill(ctx, c, 's', (x0 + x) / 2, GROUND - ch - 64, { size: 26, bg: c.label });
    // right: lifted
    const lx = 520, lh = 190;
    const lb = GROUND - u * lh;
    drawShadow(ctx, c, lx, GROUND + 2, cw * 0.6 * (1 - 0.5 * u), 5, 0.7 * (1 - 0.5 * u));
    ghost(ctx, c, lx, GROUND, cw, ch, u);
    crate(ctx, c, lx, lb, cw, ch);
    forceArrow(ctx, c, lx, lb - ch - 6, lx, lb - ch - 6 - 64);
    this.forceLabel(ctx, c, 'F', lx + 34, lb - ch - 6 - 52);
    const sx = lx + cw / 2 + 34;
    dashArrow(ctx, c, sx, GROUND, sx, lb, { alpha: clamp01(u / 0.2) });
    if (u > 0.3) pill(ctx, c, 's', sx + 28, (GROUND + lb) / 2, { size: 26, bg: c.label });
    // the same rule under both
    const ra = clamp01((t - 1.3) / 0.4);
    pill(ctx, c, 'W = F x s', 190, 250, { size: 26, bg: c.accent, alpha: ra });
    pill(ctx, c, 'W = F x s', 520, 62, { size: 26, bg: c.accent, alpha: ra });
  }
}

// where a block started: a dashed outline once it has moved off
function ghost(ctx, c, cx, bottom, w, h, u) {
  if (u < 0.15) return;
  ctx.save();
  ctx.globalAlpha *= 0.55 * clamp01((u - 0.15) / 0.3);
  ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
  rr(ctx, cx - w / 2, bottom - h, w, h, 5); ctx.stroke();
  ctx.restore();
}
