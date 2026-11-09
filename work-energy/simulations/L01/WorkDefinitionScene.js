// WorkDefinitionScene.js - the joule (blk-l01-s07, 3 beats), rebuilt on canvas.
//   stage 0: a 1 N force pushes a block 1 m along the floor; "1 J" when it arrives.
//   stage 1: a student lifts the 5 kg wheat bag 1 m with 50 N (= mg); "50 J".
//   stage 2: which force, on what: "by: your hands" at the hands, "on: the bag" at the bag.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, chipSize, font, alpha, lighten, darken, mix, rr,
  clamp01, lerp, popAt,
} from 'simulations/base/kit/SimLook.js';
import { drawSack } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

const MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];

// stage 0: the block on the floor
const G0 = 420;
const P0 = 330; // px per metre
const X0 = 170; // block centre at the start
const BW = 104, BH = 84;
// stage 1-2: the lift
const G1 = 462;
const P1 = 150;
const FIG_X = 274;
const BX = 344;
const SW = 62, SH = 72;
const S_X = BX + 104; // the dashed s, clear of the mg arrow
const J_AT = { x: 548, y: 236 }; // the 50 J result, beside the 50 N / 1 m pair
const smooth = (u) => u * u * (3 - 2 * u);

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

function dashArrow(ctx, c, x1, y1, x2, y2, o = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 8) return;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const col = o.col ?? c.label;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
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

// a wooden block: planks, lit top and left, shade right
function block(ctx, c, cx, bottom, w, h, a = 1) {
  const x = cx - w / 2, y = bottom - h;
  const wood = mix(c.gold, c.flame, 0.25);
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = darken(wood, 0.35); rr(ctx, x - 2, y - 2, w + 4, h + 4, 6); ctx.fill();
  ctx.fillStyle = wood; rr(ctx, x, y, w, h, 5); ctx.fill();
  ctx.fillStyle = darken(wood, 0.15); ctx.fillRect(x + w * 0.68, y + 3, w * 0.32 - 3, h - 6);
  ctx.fillStyle = lighten(wood, 0.3); ctx.fillRect(x + 3, y + 3, 5, h - 6); ctx.fillRect(x + 3, y + 3, w - 6, 4);
  ctx.strokeStyle = darken(wood, 0.3); ctx.lineWidth = 2;
  for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + 4, y + (h * k) / 3); ctx.lineTo(x + w - 4, y + (h * k) / 3); ctx.stroke(); }
  ctx.restore();
}

export class WorkDefinitionScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP;
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A force of 1 N pushes a block 1 m along the floor: 1 J of work. Then a person lifts a 5 kg wheat bag 1 m with an upward force of 50 N: 50 J. Last, two tags: the force is by your hands, and the work is done on the bag.';
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
    return this.stage >= 0 && this.stage <= 2 ? this.stage : 0;
  }

  busy() {
    return this.t() < [2.3, 2.2, 1.6][this.st()];
  }

  draw(ctx, c) {
    const s = this.st();
    const t = this.t();
    drawBackdrop(ctx, c, 'dots');
    if (s === 0) this.push(ctx, c, t);
    else this.lift(ctx, c, t, s);
  }

  // stage 0: 1 N over 1 m along the floor
  push(ctx, c, t) {
    drawFloor(ctx, c, G0, {});
    const X1 = X0 + P0;
    // a metre rule laid on the floor
    ctx.save();
    const wood = mix(c.gold, c.bgDeep, 0.2);
    ctx.fillStyle = darken(wood, 0.3); ctx.fillRect(X0 - 4, G0 + 10, P0 + 8, 18);
    ctx.fillStyle = wood; ctx.fillRect(X0 - 2, G0 + 12, P0 + 4, 14);
    ctx.fillStyle = lighten(wood, 0.3); ctx.fillRect(X0 - 2, G0 + 12, P0 + 4, 3);
    for (let i = 0; i <= 10; i++) {
      ctx.fillStyle = alpha(c.bgDeep, 0.8);
      ctx.fillRect(X0 + (i * P0) / 10 - 1, G0 + 12, 2, i % 5 === 0 ? 14 : 7);
    }
    ctx.font = font(c, 700, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = c.labelMuted;
    ctx.fillText('0 m', X0, G0 + 34);
    ctx.fillText('1 m', X1, G0 + 34);
    ctx.restore();
    const u = smooth(clamp01((t - 0.4) / 1.2));
    const x = lerp(X0, X1, u);
    if (u > 0.1) {
      ctx.save(); ctx.globalAlpha *= 0.5; ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      rr(ctx, X0 - BW / 2, G0 - BH, BW, BH, 5); ctx.stroke(); ctx.restore();
    }
    drawShadow(ctx, c, x, G0 + 2, BW * 0.6, 5, 0.7);
    block(ctx, c, x, G0, BW, BH);
    // the 1 N push, at the block's back face
    const ay = G0 - BH / 2;
    forceArrow(ctx, c, x - BW / 2 - 104, ay, x - BW / 2 - 4, ay);
    pill(ctx, c, '1 N', x - BW / 2 - 56, ay - 40, { size: 26, bg: c.accent });
    // s, dashed above the path
    const sy = G0 - BH - 46;
    dashArrow(ctx, c, X0, sy, x, sy, { alpha: clamp01(u / 0.15) });
    if (u > 0.25) pill(ctx, c, '1 m', (X0 + x) / 2, sy - 32, { size: 26, bg: c.label });
    // 1 J when it arrives
    const p = popAt(t - 1.7, 0);
    if (p) pill(ctx, c, '1 J', X1, sy - 84, { size: 40, bg: c.gold, scale: p.scale, alpha: p.alpha, pop: p.u });
  }

  // stages 1-2: the wheat bag
  lift(ctx, c, t, s) {
    drawFloor(ctx, c, G1, {});
    const u = s === 1 ? smooth(clamp01((t - 0.4) / 1.0)) : 1;
    const bottom = G1 - u * P1;
    // a height mark: the floor and 1 m
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.3); ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(BX - 120, G1 - P1); ctx.lineTo(S_X + 30, G1 - P1); ctx.stroke();
    ctx.restore();
    const spec = figureFor(this, {
      role: 'adult', scale: P1, facing: 1, y: G1,
      x: lerp(FIG_X + 22, FIG_X, u),
      pose: { name: 'carry', crouch: lerp(0.75, 0.06, u), lean: lerp(40, 0, u) },
      hands: [{ x: BX - SW * 0.3, y: bottom + 1 }, { x: BX + SW * 0.02, y: bottom + 2 }],
    });
    const sk = drawFigure(ctx, c, spec, { mood: 'effort' }, {
      between: () => drawSack(ctx, c, { x: BX, y: bottom, w: SW, h: SH, kind: 'sack', tone: 6, held: bottom < G1 - 1 }),
    });
    // the bag's mass, beside the bag, from the slide's numbers
    if (s === 1) pill(ctx, c, '5 kg', BX + SW / 2 + 42, bottom - SH * 0.5, { size: 24, bg: c.bgSurface });
    const dim = s === 2 ? 0.25 : 1;
    const a = clamp01(u / 0.25) * dim;
    const top = bottom - SH;
    forceArrow(ctx, c, BX, top - 10, BX, top - 10 - 76, { alpha: a });
    if (s === 1) pill(ctx, c, '50 N', BX + 56, top - 10 - 60, { size: 24, bg: c.accent, alpha: a });
    // its weight mg, down, the same length as the 50 N up: they balance in a slow lift
    if (s === 1 && u > 0.2) {
      const mx = BX + SW / 2 - 12;
      forceArrow(ctx, c, mx, bottom + 4, mx, bottom + 4 + 76, { col: c.bad, alpha: a });
      pill(ctx, c, 'mg', mx + 36, bottom + 64, { size: 24, bg: c.bad, alpha: a });
    }
    dashArrow(ctx, c, S_X, G1, S_X, bottom, { alpha: a });
    if (s === 1 && u > 0.3) pill(ctx, c, '1 m', S_X + 40, (G1 + bottom) / 2, { size: 24, bg: c.label, alpha: a });
    if (s === 1) {
      const p = popAt(t - 1.5, 0);
      if (p) {
        // a thin leader from the 50 N to the result, so the J reads as force x displacement
        ctx.save(); ctx.globalAlpha *= p.alpha * 0.6; ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
        ctx.beginPath(); ctx.moveTo(BX + 92, top - 70); ctx.lineTo(J_AT.x - 40, J_AT.y - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(S_X + 40, (G1 + bottom) / 2 - 18); ctx.lineTo(J_AT.x - 10, J_AT.y + 24); ctx.stroke();
        ctx.restore();
        pill(ctx, c, '50 J', J_AT.x, J_AT.y, { size: 40, bg: c.gold, scale: p.scale, alpha: p.alpha, pop: p.u });
      }
      return;
    }
    // stage 2: by what, on what
    const hand = sk?.anchors?.hand?.[0] ?? { x: BX - SW / 2 + 9, y: bottom };
    this.tag(ctx, c, t - 0.3, 'by: your hands', 510, 412, hand.x + 4, hand.y + 4, c.s2);
    this.tag(ctx, c, t - 0.9, 'on: the bag', 540, 250, BX + SW / 2 + 2, bottom - SH / 2, c.s4);
  }

  // a tag with a leader to the thing it names, and a ring round that thing
  tag(ctx, c, age, text, x, y, tx, ty, col) {
    const p = popAt(age, 0);
    if (!p) return;
    const sz = chipSize(ctx, c, text, 24);
    const ex = x - sz.w / 2;
    ctx.save();
    ctx.globalAlpha *= p.alpha;
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ex, y); ctx.lineTo(tx + 14 * Math.sign(ex - tx), ty); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(tx, ty, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    pill(ctx, c, text, x, y, { size: 24, bg: col, scale: p.scale, alpha: p.alpha, pop: p.u });
  }
}
