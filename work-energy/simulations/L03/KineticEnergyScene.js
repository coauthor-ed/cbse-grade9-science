import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, font, inOutSine, clamp01, outBack,
  mix, alpha, lighten, darken, rr, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { drawEnergyBars, drawWorkCounter, barsAt } from 'simulations/base/kit/SimEnergy.js';
import { displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// KineticEnergyScene - two slides (BEAT_MAPS):
//  blk-l03-s03 (2 beats, stages 0-1), Work Becomes Kinetic Energy:
//   0: a student pushes a 2 kg trolley from rest with F = 9 N for s = 1 m on a
//      smooth floor; the work counter climbs to W = 9 J with the distance.
//   1: the student lets go; the 9 J goes into the trolley's K bar (9 J) and it
//      rolls on at a steady 3 m/s (no friction, so no change of speed).
//  blk-l03-s04 (3 beats, stages 2-4), K = 1/2 m v^2:
//   2: the three lines of the derivation write on; the a in ma and the a in 2a
//      are struck out, then 1/2 m(v^2 - u^2) appears. Below, the general object:
//      mass m, speed u at the start, v at the end, force F, displacement s.
//   3: the K = 1/2 m v^2 card, the trolley check 1/2 x 2 x 3^2 = 9 J, the trolley
//      at 3 m/s and its K bar at 9 J.
//   4: three rows: a push along the motion (positive work) speeds the trolley up
//      and its K bar rises; a push against it (negative work) slows it and the
//      bar falls; no force: steady speed, the bar stays level. Faded trolleys
//      mark where it was after equal times, so their spacing shows the speed.

const TAU = Math.PI * 2;
const SUP2 = String.fromCharCode(178);
const MINUS = String.fromCharCode(0x2212);
const TIMES = String.fromCharCode(0xd7);

// s03 geometry: 1 m = 220 px
const GROUND = 432;
const XS = 256, XE = 476;            // trolley centre at 0 m and at 1 m
const TROLLEY_W = 190;
const FIG_H = 244;
const PUSH_S = 1.8, GLIDE_S = 1.6, GLIDE_PX = 46;
const COUNTER = { x: 170, y: 58 };
const KBAR = { x: 562, y: 20, h: 150 };

const MAP2 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
const MAP3 = [[{ idx: 2, dwellMs: null }], [{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }]];

// A lab trolley, side view, front to the right: a tray on four wheels (two
// show), a push handle at the back. Light side, shade side, inner lip.
function drawTrolley(ctx, c, x, gy, o = {}) {
  const w = o.w ?? TROLLEY_W, r = Math.round(w * 0.1), col = o.col ?? c.s4;
  const x0 = x - w / 2, x1 = x + w / 2;
  const bodyBot = gy - 2 * r + 4, bodyH = Math.round(w * 0.24), top = bodyBot - bodyH;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  drawShadow(ctx, c, x, gy + 2, w * 0.54, 6, 0.8);
  let grip = null;
  if (o.handle) {
    const hx0 = x0 + 10, hx1 = x0 - w * 0.12, hy1 = top - w * 0.36;
    ctx.lineCap = 'round';
    ctx.strokeStyle = darken(c.stroke, 0.3);
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(hx0, top + 4); ctx.lineTo(hx1, hy1); ctx.lineTo(hx1 - 14, hy1); ctx.stroke();
    ctx.strokeStyle = lighten(c.stroke, 0.15);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(hx0 - 1, top + 2); ctx.lineTo(hx1 - 1, hy1 - 1); ctx.stroke();
    grip = { x: hx1 - 6, y: hy1 };
  }
  // tray
  rr(ctx, x0, top, w, bodyH, 8);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.fillStyle = darken(col, 0.3);
  ctx.fillRect(x0 + 8, top + 4, w - 16, 6);                 // the inside of the tray, seen over the lip
  ctx.fillStyle = lighten(col, 0.3);
  ctx.fillRect(x0 + 6, top + 12, w - 12, 3);
  ctx.fillStyle = darken(col, 0.2);
  ctx.fillRect(x0 + 4, bodyBot - 10, w - 8, 7);
  ctx.fillRect(x1 - 16, top + 12, 10, bodyH - 20);
  ctx.strokeStyle = darken(col, 0.45);
  ctx.lineWidth = 2.5;
  rr(ctx, x0, top, w, bodyH, 8);
  ctx.stroke();
  // axle bracket and wheels
  const ang = o.wheelAngle ?? 0;
  for (const wx of [x0 + w * 0.2, x1 - w * 0.2]) {
    ctx.fillStyle = darken(col, 0.4);
    ctx.fillRect(wx - 5, bodyBot - 4, 10, r - 2);
    ctx.fillStyle = darken(c.stroke, 0.55);
    ctx.beginPath(); ctx.arc(wx, gy - r, r, 0, TAU); ctx.fill();
    ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.35);
    ctx.beginPath(); ctx.arc(wx, gy - r, r * 0.58, 0, TAU); ctx.fill();
    ctx.strokeStyle = darken(c.stroke, 0.25);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = ang + (k * TAU) / 4;
      ctx.moveTo(wx - Math.cos(a) * r * 0.56, gy - r - Math.sin(a) * r * 0.56);
      ctx.lineTo(wx + Math.cos(a) * r * 0.56, gy - r + Math.sin(a) * r * 0.56);
    }
    ctx.stroke();
  }
  ctx.restore();
  if (o.tag) pill(ctx, c, o.tag, x - 6, top + bodyH / 2 - 2, { bg: darken(col, 0.25), size: o.tagSize ?? 24, alpha: o.alpha ?? 1 });
  return { top, front: x1, back: x0, cy: top + bodyH / 2, grip, r };
}

// A tiny maths typesetter: strings, { sup }, { cancel } (struck later) and
// { frac: [num, den] }. Returns the width; draws when draw is true.
function mathFont(c, px) { return font(c, 700, px, false); }
function typeset(ctx, c, items, x, y, size, draw, marks) {
  let cx = x;
  for (const it of items) {
    if (typeof it === 'string') {
      ctx.font = mathFont(c, size);
      if (draw) ctx.fillText(it, cx, y);
      cx += ctx.measureText(it).width;
    } else if (it.sup) {
      ctx.font = mathFont(c, Math.max(26, Math.round(size * 0.64)));   // 26: 11 px on a 296-wide phone canvas
      if (draw) ctx.fillText(it.sup, cx + 1, y - size * 0.4);
      cx += ctx.measureText(it.sup).width + 3;
    } else if (it.cancel) {
      ctx.font = mathFont(c, size);
      const w = ctx.measureText(it.cancel).width;
      if (draw) ctx.fillText(it.cancel, cx, y);
      if (draw && marks) marks.push({ x: cx, y, w, s: size });
      cx += w;
    } else if (it.frac) {
      const s2 = Math.round(size * 0.84);
      const wn = typeset(ctx, c, it.frac[0], 0, 0, s2, false);
      const wd = typeset(ctx, c, it.frac[1], 0, 0, s2, false);
      const w = Math.max(wn, wd) + 12;
      const bar = y - size * 0.32;
      if (draw) {
        typeset(ctx, c, it.frac[0], cx + 4 + (w - wn) / 2, bar - 8, s2, true, marks);
        typeset(ctx, c, it.frac[1], cx + 4 + (w - wd) / 2, bar + s2 * 0.82 + 6, s2, true, marks);
        ctx.fillRect(cx + 4, bar - 1.5, w, 3);
      }
      cx += w + 8;
    }
  }
  return cx - x;
}

const V2 = ['v', { sup: '2' }];
const U2 = ['u', { sup: '2' }];
const DIFF = [...V2, ` ${MINUS} `, ...U2];
const HALF = { frac: [['1'], ['2']] };

export class KineticEnergyScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP2;
  static BEAT_MAPS = { 2: MAP2, 3: MAP3 };
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A student pushes a 2 kg trolley from rest with a force of 9 N for 1 m on a smooth floor; the work done counts up to 9 J. Let go, the trolley rolls on at 3 m/s and its kinetic energy bar reads 9 J. Then the derivation W = ma times (v squared minus u squared) over 2a = one half m (v squared minus u squared), with the a cancelled; the card K = one half m v squared with the check one half times 2 times 3 squared = 9 J; and three rows: positive work raises the K bar, negative work lowers it, no work keeps it level.';

  enter() { this.motionT = 0; }
  pointerDown() { this.motionT = 0; this.animateFor(800); }

  get motionEnd() { return [PUSH_S, GLIDE_S, 2.2, 1.8, 2.0][this.stage] ?? 0; }
  update(d) { this.motionT = Math.min(this.motionEnd + 0.1, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd + 0.1; }
  get t() { return this.motionT ?? 0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    const s = this.stage;
    if (s <= 1) this.pushStages(ctx, c);
    else if (s === 2) this.derivation(ctx, c);
    else if (s === 3) this.formula(ctx, c);
    else this.threeRows(ctx, c);
  }

  // -- s03 ----------------------------------------------------------------------
  labFloor(ctx, c, gy) {
    drawFloor(ctx, c, gy, { seams: false });
    ctx.save();
    ctx.fillStyle = alpha(c.bgSurface, 0.55);           // a polished sheen: a smooth floor
    ctx.fillRect(0, gy + 3, W, 3);
    ctx.restore();
  }

  pushStages(ctx, c) {
    const t = this.t;
    const pushing = this.stage === 0;
    const u = pushing ? inOutSine(clamp01(t / PUSH_S)) : 1;
    const g = pushing ? 0 : clamp01(t / GLIDE_S);
    const x = XS + (XE - XS) * u + GLIDE_PX * g;
    this.labFloor(ctx, c, GROUND);
    // the two marks, 0 m and 1 m, under the trolley's centre
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    for (const mx of [XS, XE]) {
      ctx.beginPath(); ctx.moveTo(mx, GROUND + 8); ctx.lineTo(mx, GROUND + 30); ctx.stroke();
    }
    ctx.restore();
    displacementArrow(ctx, c, XS, GROUND + 19, XS + (XE - XS) * u, GROUND + 19, {
      label: u > 0.6 ? 's = 1 m' : undefined, side: 1, size: 24, alpha: pushing ? 1 : 0.45,
    });
    const dist = (x - XS);
    const tr = drawTrolley(ctx, c, x, GROUND, { handle: true, tag: '2 kg', wheelAngle: dist / 15 });
    // the student: pushes with the trolley in b0, stands at the 1 m mark in b1
    const handX = XS + (XE - XS) * u - TROLLEY_W / 2 - TROLLEY_W * 0.12 - 6;
    if (pushing) {
      const spec = figureFor(this, {
        role: 'student', pose: { name: 'push', lean: 12 }, x: handX - 88, y: GROUND, height: FIG_H, facing: 1,
        hands: [{ x: tr.grip.x, y: tr.grip.y + 2 }, { x: tr.grip.x + 4, y: tr.grip.y - 2 }],
      });
      drawFigure(ctx, c, spec, spec.look);
      vectorArrow(ctx, c, tr.front + 6, tr.cy, { angle: 0, length: 96, col: c.accent, width: 6, head: 16 });
      pill(ctx, c, 'F = 9 N', tr.front + 50, tr.cy - 38, { bg: c.accent, size: 24 });
    } else {
      const spec = figureFor(this, { role: 'student', pose: 'stand', x: handX - 88, y: GROUND, height: FIG_H, facing: 1 });
      drawFigure(ctx, c, spec, spec.look);
      this.streaks(ctx, c, tr.back - 30, tr.cy - 10, 1);
      pill(ctx, c, '3 m/s', x + 30, GROUND + 44, { bg: c.s1, size: 26, alpha: clamp01(t / 0.4) });
    }
    const w = pushing ? Math.round(9 * u) : 9;
    drawWorkCounter(ctx, c, { ...COUNTER, text: `W = ${w} J`, size: 28, alpha: pushing ? 1 : 0.85 });
    if (!pushing) {
      // the 9 J of work goes into the trolley: a chip travels to the bar, then it fills
      const k = clamp01((t - 0.15) / 0.5);
      const fill = clamp01((t - 0.6) / 0.6);
      drawEnergyBars(ctx, c, {
        x: KBAR.x, y: KBAR.y, h: KBAR.h, max: 9, units: 'J', showValues: fill > 0.05, size: 24,
        bars: [{ id: 'K', label: 'K', tone: 1 }], values: barsAt({ K: 0 }, { K: 9 }, fill),
        anchor: { x: x + 20, y: tr.top - 2 },
      });
      if (k > 0 && k < 1) {
        const bx = KBAR.x + 46, by = KBAR.y + KBAR.h - 10;
        pill(ctx, c, '9 J', COUNTER.x + (bx - COUNTER.x) * inOutSine(k), COUNTER.y + (by - COUNTER.y) * inOutSine(k), { bg: c.accent, size: 24 });
      }
    }
  }

  streaks(ctx, c, x, y, k) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = alpha(c.s1, 0.5);
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const len = (16 + 20 * k) - i * 6;
      ctx.beginPath();
      ctx.moveTo(x - len, y + i * 13);
      ctx.lineTo(x, y + i * 13);
      ctx.stroke();
    }
    ctx.restore();
  }

  // -- s04 b0 -------------------------------------------------------------------
  writeOn(ctx, at, fn) {
    const k = clamp01((this.t - at) / 0.5);
    if (k <= 0) return;
    ctx.save();
    ctx.globalAlpha *= k;
    ctx.translate((1 - inOutSine(k)) * 14, 0);
    fn();
    ctx.restore();
  }

  derivation(ctx, c) {
    const t = this.t, X = 44, S = 34;
    ctx.save();
    ctx.fillStyle = c.label;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    this.writeOn(ctx, 0.1, () => typeset(ctx, c, ['F = ma', '      ', ...V2, ' = ', ...U2, ' + 2as'], X, 58, S, true));
    this.writeOn(ctx, 0.35, () => typeset(ctx, c, ['s = ', { frac: [DIFF, ['2a']] }], X, 132, S, true));
    this.writeOn(ctx, 0.7, () => typeset(ctx, c, [`W = F ${TIMES} s`], X, 206, S, true));
    const marks = [];
    let w4 = 0;
    this.writeOn(ctx, 1.05, () => {
      w4 = typeset(ctx, c, ['= m', { cancel: 'a' }, ` ${TIMES} `, { frac: [DIFF, ['2', { cancel: 'a' }]] }], X + 70, 282, S, true, marks);
    });
    if (!w4) w4 = (() => { ctx.save(); const r = typeset(ctx, c, ['= m', { cancel: 'a' }, ` ${TIMES} `, { frac: [DIFF, ['2', { cancel: 'a' }]] }], 0, 0, S, false); ctx.restore(); return r; })();
    // strike the two a's
    const sk = clamp01((t - 1.3) / 0.35);
    if (sk > 0) {
      ctx.strokeStyle = c.bad;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (const m of marks) {
        const ax = m.x - 3, ay = m.y + 3, bx = m.x + m.w + 3, by = m.y - m.s * 0.72;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * sk, ay + (by - ay) * sk); ctx.stroke();
      }
    }
    // the result, with a soft highlight behind it
    this.writeOn(ctx, 1.65, () => {
      const rx = X + 70 + w4 + 6;
      ctx.save();
      const wr = typeset(ctx, c, ['= ', HALF, 'm(', ...DIFF, ')'], 0, 0, S, false);
      rr(ctx, rx - 8, 282 - 46, wr + 16, 70, 12);
      ctx.fillStyle = alpha(c.gold, 0.22);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = c.label;
      typeset(ctx, c, ['= ', HALF, 'm(', ...DIFF, ')'], rx, 282, S, true);
    });
    ctx.restore();
    this.generalObject(ctx, c);
  }

  // The object of the derivation, in symbols: mass m, u at the start, v at the end.
  generalObject(ctx, c) {
    const gy = 468, xa = 150, xb = 410, w = 140;
    this.labFloor(ctx, c, gy);
    const ghost = drawTrolley(ctx, c, xa, gy, { w, alpha: 0.35 });
    const tr = drawTrolley(ctx, c, xb, gy, { w, tag: 'm', tagSize: 26, wheelAngle: (xb - xa) / 12 });
    pill(ctx, c, 'u', xa, ghost.top - 46, { bg: c.s1, size: 26, alpha: 0.8 });
    pill(ctx, c, 'v', xb, tr.top - 46, { bg: c.s1, size: 26 });
    vectorArrow(ctx, c, tr.front + 6, tr.cy, { angle: 0, length: 70, col: c.accent, width: 6, head: 16 });
    pill(ctx, c, 'F', tr.front + 98, tr.cy, { bg: c.accent, size: 26 });
    displacementArrow(ctx, c, xa, gy + 22, xb, gy + 22, {});
    pill(ctx, c, 's', xb + 34, gy + 22, { bg: c.s2, size: 26 });
  }

  // -- s04 b1 -------------------------------------------------------------------
  formula(ctx, c) {
    const t = this.t;
    const pop = outBack(clamp01(t / 0.45));
    // the card
    ctx.save();
    ctx.translate(250, 84);
    ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
    ctx.globalAlpha = clamp01(t / 0.3);
    rr(ctx, -200, -56, 400, 112, 18);
    ctx.fillStyle = c.bgSurface;
    ctx.fill();
    ctx.fillStyle = alpha(c.s1, 0.12);
    ctx.fillRect(-196, 30, 392, 22);
    ctx.strokeStyle = c.s1;
    ctx.lineWidth = 4;
    rr(ctx, -200, -56, 400, 112, 18);
    ctx.stroke();
    ctx.fillStyle = c.label;
    ctx.textBaseline = 'alphabetic';
    const items = ['K = ', HALF, 'm', ...V2];
    const wk = typeset(ctx, c, items, 0, 0, 52, false);
    typeset(ctx, c, items, -wk / 2, 22, 52, true);
    ctx.restore();
    // the check with the trolley
    ctx.save();
    ctx.fillStyle = c.label;
    this.writeOn(ctx, 0.5, () => {
      const items2 = [HALF, ` ${TIMES} 2 ${TIMES} 3`, { sup: '2' }, ' = 9 J'];
      const w2 = typeset(ctx, c, items2, 0, 0, 34, false);
      typeset(ctx, c, items2, 250 - w2 / 2, 222, 34, true);
    });
    ctx.restore();
    const gy = 452, x = 210 + 120 * clamp01(t / 1.8);
    this.labFloor(ctx, c, gy);
    const tr = drawTrolley(ctx, c, x, gy, { tag: '2 kg', wheelAngle: x / 15 });
    this.streaks(ctx, c, tr.back - 14, tr.cy - 8, 1);
    pill(ctx, c, '3 m/s', x, tr.top - 40, { bg: c.s1, size: 26 });
    const fill = clamp01((t - 0.9) / 0.6);
    drawEnergyBars(ctx, c, {
      x: 566, y: 150, h: 200, max: 9, units: 'J', showValues: fill > 0.05, size: 24,
      bars: [{ id: 'K', label: 'K', tone: 1 }], values: barsAt({ K: 0 }, { K: 9 }, fill),
      anchor: { x: x + 40, y: tr.top - 4 },
    });
  }

  // -- s04 b2 -------------------------------------------------------------------
  // an offscreen layer the size of the stage canvas, with the stage's transform
  ghostLayer(ctx) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (!this._ghost || this._ghost.width !== cw || this._ghost.height !== ch) {
      this._ghost = document.createElement('canvas');
      this._ghost.width = cw; this._ghost.height = ch;
    }
    const g = this._ghost.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cw, ch);
    g.setTransform(ctx.getTransform());
    return g;
  }

  threeRows(ctx, c) {
    const u = clamp01(this.t / 1.8);
    // 1.4x trolleys; each run is centred in x 120-480, clear of the K cards at 566
    const w = 156, X0 = 124, D = 278, TRACK_END = 524;
    // position (fraction of D) and speed (1..2) at time fraction q
    const rows = [
      { label: '+ work', pos: (q) => (q + q * q / 2) / 1.5, v: (q) => 1 + q, push: 1 },
      { label: `${MINUS} work`, pos: (q) => (2 * q - q * q / 2) / 1.5, v: (q) => 2 - q, push: -1 },
      { label: 'no work', pos: (q) => q, v: () => 1.5, push: 0 },
    ];
    // one key for the faded trolleys: they show where it was after equal times
    pill(ctx, c, 'faded: equal time gaps', 300, 28, { bg: mix(c.label, c.bgSurface, 0.45), size: 23 });
    rows.forEach((r, i) => {
      const gy = 172 + i * 162;
      const tar = mix(c.label, c.bgSurface, 0.8);
      ctx.fillStyle = tar;
      rr(ctx, 6, gy, TRACK_END - 6, 7, 3);
      ctx.fill();
      ctx.fillStyle = darken(tar, 0.12);
      ctx.fillRect(10, gy + 7, TRACK_END - 14, 4);
      // end stops at both ends of the track
      ctx.fillStyle = darken(tar, 0.35);
      for (const ex of [6, TRACK_END - 8]) { rr(ctx, ex, gy - 12, 8, 19, 3); ctx.fill(); }
      // faded trolleys at equal time steps: the gaps grow, shrink or stay equal
      // drawn solid into one layer, each over the last, then laid down faded once,
      // so the overlaps read as clean steps instead of stacked tints
      const lay = this.ghostLayer(ctx);
      for (let k = 0; k < 3; k++) {
        const q = k / 3;
        if (u < q + 1 / 3 - 0.001) break;
        drawTrolley(lay, c, X0 + D * r.pos(q), gy, { w, wheelAngle: (D * r.pos(q)) / 15 });
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha *= 0.3;
      ctx.drawImage(lay.canvas, 0, 0);
      ctx.restore();
      const x = X0 + D * r.pos(u);
      const tr = drawTrolley(ctx, c, x, gy, { w, wheelAngle: (D * r.pos(u)) / 15 });
      this.streaks(ctx, c, tr.back - 8, tr.cy - 8, r.v(u) - 1);
      // the force rides above the trolley, so its pill never meets the card
      const ay = tr.top - 22;
      if (r.push > 0) {
        vectorArrow(ctx, c, x - 34, ay, { angle: 0, length: 76, col: c.accent, width: 6, head: 16 });
        pill(ctx, c, 'F', x - 60, ay, { bg: c.accent, size: 24 });
      } else if (r.push < 0) {
        vectorArrow(ctx, c, x + 42, ay, { angle: Math.PI, length: 76, col: c.accent, width: 6, head: 16 });
        pill(ctx, c, 'F', x + 68, ay, { bg: c.accent, size: 24 });
      }
      pill(ctx, c, r.label, 64, gy - 128, { bg: c.s2, size: 24 });
      const K = (q) => 1.5 * r.v(q) * r.v(q);
      const bx = drawEnergyBars(ctx, c, {
        x: 566, y: gy - 132, h: 62, max: 6.4, size: 22, minSize: 21,
        bars: [{ id: 'K', label: 'K', tone: 1 }], values: { K: K(u) },
      });
      // where the bar started: a short dashed mark, so up / down / level reads at rest
      ctx.save();
      ctx.strokeStyle = alpha(c.label, 0.7);
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      const b0 = bx.bars[0], y0 = bx.baseY - (bx.baseY - b0.top.y) * K(0) / K(u);
      ctx.beginPath(); ctx.moveTo(b0.x - 8, y0); ctx.lineTo(b0.x + b0.w + 8, y0); ctx.stroke();
      ctx.restore();
    });
  }
}
