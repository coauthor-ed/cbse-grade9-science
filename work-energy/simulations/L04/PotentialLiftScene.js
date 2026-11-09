import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, drawShelf, pill, font, alpha, lighten, darken, mix, rr, mulberry32,
  clamp01, lerp, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars, barsAt } from 'simulations/base/kit/SimEnergy.js';
import { drawBall, displacementArrow } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

// Two slides share this scene (by beat count):
//   blk-l04-s06 (2 beats): stage 0 the lift and W = mgh, stage 1 U = mgh and the
//   book's ball example (200 g, about 10 m, 20 J).
//   blk-l04-n02 (3 beats): stage 2 near the Earth, stage 3 only height counts,
//   stage 4 friction stores nothing.
const MAP2 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
const MAP3 = [[{ idx: 2, dwellMs: null }], [{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }]];

const GROUND = 462;
const P = 110; // px per metre (lift stages)
const MASS = 4; // the bar scale only: no mass is shown (the slide says m)
const G = 10;
const HMAX = 1.0; // m
const BX = 300; // block centre x
const BW = 70;
const BH = 50;
const FIG_X = 236; // close in to the block, so the hands reach it upright
const STAFF_X = 404;

// stage timelines (s)
const L0 = 0.5;
const L1 = 3.2; // the slow lift
const U0 = 0.4;
const U1 = 1.3; // U bar fills
const E0 = 1.9; // the ball example fades in
const E1 = 2.5;

const EARTH = { x: 340, y: 930, r: 540 };
const STARS = (() => {
  const r = mulberry32(3);
  return Array.from({ length: 40 }, () => ({ x: r() * W, y: r() * 320, s: 1 + r() * 1.6 }));
})();
const SCUFF = (() => {
  const r = mulberry32(9);
  return Array.from({ length: 26 }, () => ({ u: r(), dy: r() * 10, l: 10 + r() * 22 }));
})();

const smooth = (u) => u * u * (3 - 2 * u);

// a dashed displacement arrow with an optional label pill
function dashArrow(ctx, c, x1, y1, x2, y2, label, o = {}) {
  // the kit's one-world dashed displacement arrow; the label goes to the side
  // the old offsets asked for (left of / above the shaft: side -1)
  const side = (o.dx ?? 0) < 0 || (o.dy ?? 0) < 0 ? -1 : 1;
  displacementArrow(ctx, c, x1, y1, x2, y2, { label: label ?? undefined, side, size: 26, alpha: o.alpha ?? 1, at: o.at ?? 0.5 });
}

function crate(ctx, c, cx, bottom, w, h, o = {}) {
  const x = cx - w / 2;
  const y = bottom - h;
  const wood = o.col ?? mix(c.gold, c.flame, 0.3);
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  if (o.ghost) {
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = alpha(c.label, 0.5);
    ctx.lineWidth = 2;
    rr(ctx, x, y, w, h, 5);
    ctx.stroke();
    ctx.restore();
    return;
  }
  rr(ctx, x - 1.5, y - 1.5, w + 3, h + 3, 6);
  ctx.fillStyle = darken(wood, 0.45);
  ctx.fill();
  rr(ctx, x, y, w, h, 5);
  ctx.fillStyle = wood;
  ctx.fill();
  ctx.save();
  rr(ctx, x, y, w, h, 5);
  ctx.clip();
  ctx.fillStyle = darken(wood, 0.18);
  ctx.fillRect(x + w * 0.66, y, w * 0.34, h);
  ctx.fillStyle = lighten(wood, 0.3);
  ctx.fillRect(x, y, w * 0.14, h);
  ctx.strokeStyle = alpha(darken(wood, 0.4), 0.7);
  ctx.lineWidth = 1.5;
  const n = Math.max(2, Math.round(h / 20));
  for (let i = 1; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h * i) / n);
    ctx.lineTo(x + w, y + (h * i) / n);
    ctx.stroke();
  }
  ctx.restore();
  // corner battens
  ctx.fillStyle = darken(wood, 0.25);
  ctx.fillRect(x + 3, y + 3, 7, h - 6);
  ctx.fillRect(x + w - 10, y + 3, 7, h - 6);
  ctx.fillStyle = lighten(wood, 0.4);
  ctx.fillRect(x + 3, y + 3, 2, h - 6);
  if (o.text) {
    ctx.font = font(c, 700, 26, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = darken(wood, 0.65);
    ctx.fillText(o.text, cx, y + h / 2 + 1);
  }
  ctx.restore();
}

export class PotentialLiftScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP2;
  static BEAT_MAPS = { 2: MAP2, 3: MAP3 };
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A student lifts a block of mass m slowly to a height h, pushing up with F = mg against its weight mg; that work is stored as potential energy, its U bar filling, with U = 0 on the ground. A cricket ball of 200 g about 10 m up has U = 20 J. Further stages show the Earth with g getting smaller far away, a box moved sideways and then up with its U bar, and a box dragged across a rough floor turning work into heat and sound.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Play again' }];

  enter() {
    this.liftT0 = 0;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') {
      this.liftT0 = this.age;
      this.animateFor?.(200);
    }
  }

  t() {
    return reducedMotion() ? 99 : this.age - (this.liftT0 || 0);
  }

  busy() {
    const end = [L1 + 0.4, E1 + 0.4, 3.6, 3.6, 3.4][this.stage] ?? 0;
    return this.t() < end;
  }

  draw(ctx, c) {
    const t = this.t();
    const s = this.stage;
    if (s === 2) { this.earth(ctx, c, t); return; }
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, {});
    if (s === 0 || s === 1) this.lift(ctx, c, t, s);
    else if (s === 3) this.sideways(ctx, c, t);
    else this.drag(ctx, c, t);
  }

  // -- stages 0 and 1: lift slowly, W = mgh, stored as U ---------------------

  lift(ctx, c, t, s) {
    const u = s === 0 ? smooth(clamp01((t - L0) / (L1 - L0))) : 1;
    const hm = HMAX * u;
    const bottom = GROUND - hm * P;
    const dim = s === 1 ? 1 - 0.3 * clamp01((t - E0) / (E1 - E0)) : 1;
    ctx.save();
    ctx.globalAlpha *= dim;
    this.staffDraw(ctx, c);
    // the student, hands on the block's sides
    const by = bottom - BH / 2;
    const spec = figureFor(this, {
      // an upright lift: knees bent with the back straight while the block is low,
      // standing tall as it rises; hands on the block's near face
      role: 'student', pose: { name: 'stand', crouch: lerp(0.42, 0, clamp01(hm / 0.55)), lean: lerp(8, 0, clamp01(hm / 0.55)) }, x: FIG_X, y: GROUND, scale: P, facing: 1,
      hands: [{ x: BX - BW / 2 + 2, y: bottom - 14 }, { x: BX - BW / 2 + 6, y: bottom - BH + 12 }],
    });
    if (hm < 0.02) drawShadow(ctx, c, BX, GROUND + 2, BW * 0.6, 5, 0.8);
    else drawShadow(ctx, c, BX, GROUND + 2, BW * 0.5, 4, 0.4);
    drawFigure(ctx, c, spec, { mood: 'effort' }, {
      between: () => crate(ctx, c, BX, bottom, BW, BH, { text: 'm' }),
    });
    // h, dashed, from the ground to the block's bottom
    if (hm > 0.05) dashArrow(ctx, c, STAFF_X - 24, GROUND, STAFF_X - 24, bottom, 'h', { dx: -28, at: 0.75 });
    // the forces: F = mg up, the weight mg down (equal: the lift is slow)
    const fa = s === 0 ? clamp01(hm / 0.3) : 0; // b1 is about U: the forces stay on b0
    if (fa > 0) {
      vectorArrow(ctx, c, BX + 14, bottom - BH, { angle: -Math.PI / 2, length: 66, col: c.accent, width: 5, alpha: fa });
      vectorArrow(ctx, c, BX + 14, bottom, { angle: Math.PI / 2, length: 66, col: c.bad, width: 5, alpha: fa });
      pill(ctx, c, 'F = mg', BX + 14, bottom - BH - 92, { size: 26, bg: c.accent, alpha: fa });
      pill(ctx, c, 'mg', BX + 14, Math.min(bottom + 88, GROUND + 28), { size: 26, bg: c.bad, alpha: fa });
    }
    // no worked numbers here: the slide lifts a general mass m to a height h
    ctx.restore();
    if (s === 1) {
      const k = clamp01((t - U0) / (U1 - U0));
      drawEnergyBars(ctx, c, {
        x: 424, y: 120, h: 170, size: 24, max: MASS * G * HMAX, units: 'J', showValues: false,
        bars: [{ id: 'U', label: 'U', tone: 3 }], values: barsAt({ U: 0 }, { U: MASS * G * HMAX }, k),
      });
      pill(ctx, c, 'U = 0', BX - 4, GROUND + 28, { size: 24, alpha: clamp01((t - U1) / 0.4) });
    }
    if (s === 1) this.ballCase(ctx, c, clamp01((t - E0) / (E1 - E0)));
  }

  staffDraw(ctx, c) {
    const top = GROUND - 2 * P;
    const wood = mix(c.gold, c.bgDeep, 0.15);
    ctx.fillStyle = darken(wood, 0.35);
    ctx.fillRect(STAFF_X - 8, top - 2, 16, GROUND - top + 2);
    ctx.fillStyle = wood;
    ctx.fillRect(STAFF_X - 6, top, 12, GROUND - top);
    ctx.fillStyle = lighten(wood, 0.3);
    ctx.fillRect(STAFF_X - 6, top, 3, GROUND - top);
    for (let i = 0; i <= 20; i++) {
      const y = GROUND - (i * P) / 10;
      ctx.fillStyle = alpha(c.bgDeep, i % 5 === 0 ? 0.9 : 0.5);
      ctx.fillRect(STAFF_X - 6, y - 1, i % 5 === 0 ? 12 : 6, 2);
    }
    // no numbers on the staff: the slide's height is the symbol h
  }

  // the book's example, not to scale: a 200 g ball about 10 m up
  ballCase(ctx, c, a) {
    if (a <= 0) return;
    const x = 568;
    const top = 116;
    ctx.save();
    ctx.globalAlpha *= a;
    // a divider: a different case
    ctx.strokeStyle = alpha(c.stroke, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(524, 96);
    ctx.lineTo(524, GROUND - 6);
    ctx.stroke();
    dashArrow(ctx, c, x, GROUND - 4, x, top + 18, null);
    // break marks: the height is not drawn to scale
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    for (const dy of [0, 9]) {
      ctx.beginPath();
      ctx.moveTo(x - 10, 300 + dy + 4);
      ctx.lineTo(x + 10, 300 + dy - 4);
      ctx.stroke();
    }
    pill(ctx, c, '10 m', x - 6, 380, { size: 24 });
    // a cricket ball: red, a seam, a lit side
    const b = drawBall(ctx, c, { x, y: top, r: 15, tone: 6 });
    ctx.strokeStyle = alpha(lighten(c.s6, 0.6), 0.9);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(b.x - 6, b.y, 13, -0.9, 0.9);
    ctx.stroke();
    pill(ctx, c, '200 g', x, top - 44, { size: 24 });
    // its U, the slide's one number: 20 J (a full bar on its own scale)
    drawEnergyBars(ctx, c, {
      x: 614, y: 150, h: 200, size: 24, barW: 32, gap: 8, max: 20, units: 'J', showValues: true, panel: false,
      bars: [{ id: 'U', label: 'U', tone: 3 }], values: { U: 20 },
    });
    ctx.restore();
  }

  // -- stage 2: near the Earth, g is about the same; far away it is smaller --

  earth(ctx, c, t) {
    drawBackdrop(ctx, c, 'dots');
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, alpha(c.setSkyTop, 0.85));
    sky.addColorStop(1, alpha(c.setSkyLow, 0.6));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    for (const s of STARS) {
      ctx.fillStyle = alpha(c.setStar, 0.7);
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    const E = EARTH;
    // atmosphere glow
    ctx.beginPath();
    ctx.arc(E.x, E.y, E.r + 26, 0, Math.PI * 2);
    ctx.fillStyle = alpha(c.glass, 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(E.x, E.y, E.r + 10, 0, Math.PI * 2);
    ctx.fillStyle = alpha(c.glass, 0.35);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(E.x, E.y, E.r, 0, Math.PI * 2);
    const gr = ctx.createLinearGradient(E.x - E.r * 0.7, 0, E.x + E.r * 0.7, 0);
    gr.addColorStop(0, lighten(c.water, 0.2));
    gr.addColorStop(1, darken(c.water, 0.35));
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.clip();
    // land masses, made up (not a map)
    const land = mix(c.s3, c.gold, 0.25);
    const blobs = [[150, 430, 120, 40], [430, 420, 150, 34], [610, 470, 90, 50], [300, 480, 80, 30]];
    for (const [x, y, rx, ry] of blobs) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0.15, 0, Math.PI * 2);
      ctx.fillStyle = x > 380 ? darken(land, 0.2) : land;
      ctx.fill();
    }
    const sh = ctx.createLinearGradient(E.x, 0, W, 0);
    sh.addColorStop(0, alpha(c.bgDeep, 0));
    sh.addColorStop(1, alpha(c.bgDeep, 0.35));
    ctx.fillStyle = sh;
    ctx.fillRect(E.x, 0, W - E.x, H);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(E.x, E.y, E.r, Math.PI * 1.1, Math.PI * 1.9);
    ctx.strokeStyle = alpha(lighten(c.water, 0.6), 0.8);
    ctx.lineWidth = 3;
    ctx.stroke();

    // g along a line out from the Earth: the arrow and the letter shrink with distance
    const surf = E.y - E.r; // 390
    const pts = [370, 265, 160, 62];
    const gx = 178;
    pts.forEach((y, i) => {
      const a = clamp01((t - 0.3 - i * 0.45) / 0.4);
      if (a <= 0) return;
      const d = E.y - y;
      const k = (E.r / d) * (E.r / d);
      const gxi = gx + (E.x - gx) * 0; // same column
      const ang = Math.atan2(E.y - y, E.x - gxi);
      vectorArrow(ctx, c, gxi, y - 6, { angle: ang, length: 82 * k, col: c.accent, width: 3 + 3 * k, alpha: a });
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.font = font(c, 700, Math.round(26 + 25 * clamp01((k - 0.35) / 0.6)), true);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = c.label;
      ctx.fillText('g', gxi - 16, y + 18);
      ctx.restore();
    });
    void surf;
    // the object, carried from near the surface far out
    const u = smooth(clamp01((t - 2.1) / 1.2));
    const oy = lerp(362, 74, u);
    const d = E.y - oy;
    const k = (E.r / d) * (E.r / d);
    const ox = 460;
    vectorArrow(ctx, c, ox, oy + 14, { angle: Math.atan2(E.y - oy, E.x - ox), length: 82 * k, col: c.accent, width: 3 + 3 * k });
    drawBall(ctx, c, { x: ox, y: oy, r: 15, tone: 5 });
    // where the formula holds: a band just above the surface
    const nearA = 1;
    ctx.save();
    ctx.globalAlpha *= nearA;
    pill(ctx, c, 'U = mgh', 330, 336, { size: 26, bg: c.good });
    if (u > 0.85) {
      const fa = clamp01((u - 0.85) / 0.15);
      const p = pill(ctx, c, 'U = mgh', 560, 74, { size: 26, bg: c.stroke, alpha: fa });
      if (p) {
        ctx.strokeStyle = alpha(c.bad, fa);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p.x0 - 4, p.y0 + p.h / 2 + 6);
        ctx.lineTo(p.x0 + p.w + 4, p.y0 + p.h / 2 - 6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // -- stage 3: sideways at one height, then up ------------------------------

  sideways(ctx, c, t) {
    const LOW = 330;
    const HIGH = 196;
    const xA = 140;
    const xB = 360;
    const us = smooth(clamp01((t - 0.5) / 1.2));
    const ul = smooth(clamp01((t - 2.1) / 0.9));
    const x = lerp(xA, xB, us);
    const y = lerp(LOW, HIGH, ul);
    // a back wall with two shelves
    drawShelf(ctx, c, 70, 440, LOW);
    drawShelf(ctx, c, 290, 440, HIGH);
    for (const sx of [100, 410]) {
      ctx.fillStyle = darken(c.stroke, 0.1);
      ctx.fillRect(sx, LOW + 14, 6, GROUND - LOW - 14);
      ctx.fillStyle = lighten(c.stroke, 0.3);
      ctx.fillRect(sx, LOW + 14, 2, GROUND - LOW - 14);
    }
    ctx.fillStyle = darken(c.stroke, 0.1);
    ctx.fillRect(410, HIGH + 14, 6, LOW - HIGH - 14);
    // the level line at the box's first height
    ctx.save();
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = alpha(c.labelMuted, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, LOW);
    ctx.lineTo(530, LOW);
    ctx.stroke();
    ctx.restore();
    if (us > 0.05) crate(ctx, c, xA, LOW, 78, 60, { ghost: true });
    if (us > 0.15) dashArrow(ctx, c, xA + 44, LOW - 76, x - 44 * (us < 1 ? 0 : 1), LOW - 76, 'sideways', { dy: -28 });
    if (ul > 0.05) {
      crate(ctx, c, xB, LOW, 78, 60, { ghost: true });
      dashArrow(ctx, c, xB + 60, LOW, xB + 60, y, 'up', { dx: 34 });
    }
    crate(ctx, c, x, y, 78, 60, {});
    // U from the floor: low shelf 1.2 m, high shelf 2.4 m on this drawing's scale
    const hLow = GROUND - LOW;
    const hHigh = GROUND - HIGH;
    const U = lerp(hLow, hHigh, ul);
    const eb = drawEnergyBars(ctx, c, {
      x: 548, y: 60, h: 200, max: hHigh,
      bars: [{ id: 'U', label: 'U', tone: 3 }], values: { U },
    });
    // where U was on the low shelf: a dashed mark across the bar
    if (ul > 0.05 && eb?.bars?.[0]) {
      const b = eb.bars[0];
      const ym = eb.baseY - 3 - (200 - 6) * (hLow / hHigh);
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = c.label;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(b.x - 8, ym);
      ctx.lineTo(b.x + b.w + 8, ym);
      ctx.stroke();
      ctx.restore();
    }
    pill(ctx, c, us < 1 || ul > 0 ? (ul > 0.5 ? 'U rises' : 'U the same') : 'U the same', 590, 340, { size: 24, alpha: us > 0.1 ? 1 : 0 });
  }

  // -- stage 4: drag a heavy box over a rough floor ---------------------------

  drag(ctx, c, t) {
    const FLOOR = GROUND;
    const u = smooth(clamp01((t - 0.4) / 2.4));
    const moving = t > 0.4 && t < 2.8;
    const x0 = 150;
    const x1 = 330;
    const bx = lerp(x0, x1, u);
    const bw = 104;
    const bh = 80;
    // rough floor: a band of grit
    const r = mulberry32(31);
    ctx.fillStyle = darken(mix(c.stroke, c.gold, 0.25), 0.05);
    ctx.fillRect(0, FLOOR, W, 10);
    for (let i = 0; i < 130; i++) {
      const gx = r() * W;
      ctx.fillStyle = alpha(r() < 0.5 ? darken(c.stroke, 0.4) : lighten(c.stroke, 0.3), 0.8);
      ctx.fillRect(gx, FLOOR - 1 + r() * 9, 2 + r() * 3, 2);
    }
    // rubbing marks left behind
    ctx.strokeStyle = alpha(darken(c.stroke, 0.35), 0.7);
    ctx.lineWidth = 2;
    for (const s of SCUFF) {
      const sx = x0 - bw / 2 + 8 + s.u * (bx - x0);
      ctx.beginPath();
      ctx.moveTo(sx, FLOOR + 2 + s.dy * 0.6);
      ctx.lineTo(sx + s.l, FLOOR + 2 + s.dy * 0.6);
      ctx.stroke();
    }
    // warmth in the rubbed strip (stays: the energy went there)
    if (u > 0) {
      ctx.fillStyle = alpha(c.flame, 0.22 * Math.min(1, u * 3));
      ctx.fillRect(x0 - bw / 2, FLOOR, bx - x0 + bw, 8);
    }
    // the rope and the person, pulling (facing the box, stepping back)
    const ropeY = FLOOR - bh + 12;
    const px = bx + bw / 2 + 150;
    const spec = figureFor(this, {
      role: 'adult', pose: 'pull', x: px, y: FLOOR, scale: 112, facing: -1,
      hands: [{ x: px - 46, y: FLOOR - 104 }, { x: px - 40, y: FLOOR - 108 }],
    });
    const sk = drawFigure(ctx, c, spec, { mood: 'effort' }, {
      behind: () => {
        ctx.strokeStyle = mix(c.gold, c.bgDeep, 0.35);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2, ropeY);
        ctx.lineTo(px - 46, FLOOR - 104);
        ctx.stroke();
      },
    });
    void sk;
    crate(ctx, c, bx, FLOOR, bw, bh, { col: mix(c.flame, c.gold, 0.45) });
    // heat (wavy lines) and sound (arcs) at the rubbing contact, while it moves
    if (u > 0.05) {
      const ph = moving && !reducedMotion() ? t * 6 : 0;
      ctx.strokeStyle = alpha(c.flame, moving ? 0.85 : 0.5);
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        const hx = lerp(x0 - bw / 2 + 30, bx - bw / 2 + 10, (i + 0.5) / 4);
        if (hx > bx - bw / 2 + 12) continue;
        ctx.beginPath();
        for (let k = 0; k <= 12; k++) {
          const yy = FLOOR + 2 - k * 3 - ((ph * 8 + i * 7) % 12);
          const xx = hx + Math.sin(k * 0.8 + ph + i) * 4 - 26 * 0;
          if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = alpha(c.label, 0.6);
      ctx.lineWidth = 2;
      for (let i = 1; i <= (moving ? 2 : 0); i++) {
        ctx.beginPath();
        ctx.arc(bx - bw / 2 - 4, FLOOR - 6, 8 + i * 9, Math.PI * 0.9, Math.PI * 1.35);
        ctx.stroke();
      }
    }
    // the work went to heat and sound; U stays 0
    dashArrow(ctx, c, x0, FLOOR + 34, bx, FLOOR + 34, null, { alpha: u > 0.1 ? 1 : 0 });
    drawEnergyBars(ctx, c, {
      size: 26, minSize: 26, gap: 48, x: 24, y: 24, h: 150, max: 1,
      bars: [{ id: 'U', label: 'U', tone: 3 }, { id: 'heat', label: 'heat and sound', tone: 8 }],
      values: { U: 0, heat: u },
    });
  }
}
