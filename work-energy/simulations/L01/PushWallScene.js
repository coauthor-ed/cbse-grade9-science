import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, rr, drawBackdrop, drawFloor, drawShadow, pill, alpha, darken, lighten, mix,
  clamp01, inOutSine, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { drawWorkCounter } from 'simulations/base/kit/SimEnergy.js';

// PushWallScene - two slides.
// blk-l01-s02 (predict setup, hostRole 'setup', beat MAX_SAFE_INTEGER): a
//   student pushes a brick wall hard; one force arrow F. No displacement, no
//   work number: the answer ("none") belongs to the next slide.
// blk-l01-s03 (3 beats):
//   b0 the push: big F, the wall still against a floor mark, "displacement 0 m",
//      "W = 0 J".
//   b1 the wall and the student leave; a puck slides across smooth ice with
//      no force arrow on it, only a dashed displacement s: "F = 0, W = 0".
//   b2 back to the push: the student's upper arm glows warm and pulses (the
//      muscles using energy inside the body); the wall unchanged, W still 0 J.

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

const FLOOR_Y = 420;
const WALL_X = 432;
const WALL_R = 664;
const WALL_TOP = 92;
const BRICK_H = 33;
const BRICK_W = 74;
const FIG_H = 236;
const FEET_X = WALL_X - 99;
const HANDS = [{ x: WALL_X - 2, y: FLOOR_Y - 158 }, { x: WALL_X - 2, y: FLOOR_Y - 138 }];
const PUSH_S = 0.7;        // lean in, arrow grows
const SLIDE_S = 2.6;       // the puck's pass over the ice
const PULSE_S = 4.0;       // the arm glow pulses this long, then holds
const ICE = { x0: 40, x1: 640, top: 250, bot: 452 };
const PUCK_Y = 360;
const PUCK_X0 = 120;
const PUCK_X1 = 555;
const S_Y = 424;          // the dashed s arrow runs along the ice under the pucks

function dashArrow(ctx, c, x1, y1, x2, y2, o = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 6) return;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const col = o.col ?? c.label;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 3.5;
  ctx.setLineDash([9, 7]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * 10, y2 - uy * 10);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * 14 - uy * 8, y2 - uy * 14 + ux * 8);
  ctx.lineTo(x2 - ux * 14 + uy * 8, y2 - uy * 14 - ux * 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export class PushWallScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A student pushes hard on a brick wall with both palms; a force arrow points into the wall. The wall does not move from its floor mark: displacement 0 m, so the work is 0 J. Then a puck slides a distance s across smooth ice with no force on it: F = 0, W = 0. Then the student pushes again and the muscles of the upper arm glow warm: energy is used inside the body, but the work on the wall is still 0 J.';

  enter() {
    this.motionT = 0;
  }

  get ask() { return this.hostRole === 'setup' || !(this.stage <= 2); }
  get beat() { return this.ask ? -1 : this.stage; }

  pointerDown() {
    this.motionT = 0; // tap: play the beat again
    this.animateFor(600);
  }

  get motionEnd() {
    if (this.beat === 1) return SLIDE_S + 0.1;
    if (this.beat === 2) return PULSE_S;
    return PUSH_S + 0.1;
  }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  draw(ctx, c) {
    const b = this.beat;
    const m = this.motionT ?? 0;
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, FLOOR_Y, { seams: true });

    // b1: the wall and the student leave the stage entirely; the ice takes it
    let sk = null;
    if (b !== 1) {
      this.wall(ctx, c);
      if (b === 0) this.floorMark(ctx, c);
      const push = inOutSine(clamp01(m / PUSH_S));
      sk = this.student(ctx, c, push);
      this.force(ctx, c, push);
      if (b === 2) this.muscle(ctx, c, sk, m);
    }

    if (b === 0) {
      pill(ctx, c, 'displacement 0 m', WALL_X + 10, FLOOR_Y + 44, { bg: c.s2, size: 26 });
      drawWorkCounter(ctx, c, { x: 210, y: 52, text: 'W = 0 J', size: 30 });
    }
    if (b === 1) this.ice(ctx, c, m);
    if (b === 2) {
      drawWorkCounter(ctx, c, { x: 210, y: 52, text: 'W = 0 J', size: 30 });
      const sh = sk.joints.arms[0].shoulder;
      pill(ctx, c, 'muscles', sh.x - 160, sh.y - 40, { bg: c.flame, size: 26 });
      ctx.save();
      ctx.strokeStyle = alpha(c.flame, 0.9);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sh.x - 104, sh.y - 30);
      ctx.lineTo(sh.x - 14, sh.y + 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Bricks in running bond, each with a lit top edge and a shaded underside, a
  // coping course on top and a plinth at the foot. Nothing here ever moves.
  wall(ctx, c) {
    const brick = c.s6;
    const mortar = mix(c.bgSurface, c.label, 0.18);
    const h = FLOOR_Y - WALL_TOP;
    ctx.save();
    drawShadow(ctx, c, (WALL_X + WALL_R) / 2, FLOOR_Y + 2, (WALL_R - WALL_X) * 0.6, 10, 0.8);
    rr(ctx, WALL_X, WALL_TOP, WALL_R - WALL_X, h, 3);
    ctx.fillStyle = mortar;
    ctx.fill();
    ctx.save();
    rr(ctx, WALL_X, WALL_TOP, WALL_R - WALL_X, h, 3);
    ctx.clip();
    let row = 0;
    for (let y = WALL_TOP; y < FLOOR_Y; y += BRICK_H, row++) {
      const off = row % 2 ? -BRICK_W / 2 : 0;
      for (let x = WALL_X + off; x < WALL_R; x += BRICK_W) {
        const k = ((row * 7 + Math.round((x - WALL_X) / BRICK_W) * 3) % 5) / 5; // fixed, gentle variety
        const col = mix(brick, darken(brick, 0.25), k * 0.5);
        const bx = x + 2, by = y + 2, bw = BRICK_W - 4, bh = BRICK_H - 4;
        rr(ctx, bx, by, bw, bh, 3);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.fillStyle = darken(col, 0.18);          // shade side, below
        ctx.fillRect(bx + 1, by + bh * 0.62, bw - 2, bh * 0.38 - 1);
        ctx.fillStyle = alpha(lighten(col, 0.4), 0.75); // lit top edge
        ctx.fillRect(bx + 4, by + 2, bw - 8, 2.5);
      }
    }
    // the wall's shaded far end
    ctx.fillStyle = alpha(darken(brick, 0.5), 0.25);
    ctx.fillRect(WALL_R - 26, WALL_TOP, 26, h);
    ctx.restore();
    ctx.strokeStyle = darken(brick, 0.45);
    ctx.lineWidth = 3;
    rr(ctx, WALL_X, WALL_TOP, WALL_R - WALL_X, h, 3);
    ctx.stroke();
    // coping
    rr(ctx, WALL_X - 8, WALL_TOP - 16, WALL_R - WALL_X + 16, 18, 4);
    ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.35);
    ctx.fill();
    ctx.fillStyle = alpha(lighten(c.stroke, 0.5), 0.6);
    ctx.fillRect(WALL_X - 4, WALL_TOP - 14, WALL_R - WALL_X + 8, 3);
    ctx.strokeStyle = darken(c.stroke, 0.3);
    ctx.lineWidth = 2;
    rr(ctx, WALL_X - 8, WALL_TOP - 16, WALL_R - WALL_X + 16, 18, 4);
    ctx.stroke();
    ctx.restore();
  }

  // A dashed chalk line on the floor at the wall's face: where the wall was,
  // where it still is.
  floorMark(ctx, c) {
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(WALL_X, WALL_TOP - 26);
    ctx.lineTo(WALL_X, FLOOR_Y + 22);
    ctx.stroke();
    ctx.restore();
  }

  student(ctx, c, push) {
    const t = this.clock;
    const amp = 1.4 * push;
    const hands = HANDS.map((p, i) => ({ x: p.x, y: p.y + Math.sin(t * (21 + i * 6) + i) * amp }));
    drawShadow(ctx, c, FEET_X + 40, FLOOR_Y + 2, 70, 10);
    const spec = figureFor(this, {
      role: 'student', pose: { name: 'push', lean: 4 + push * 8 }, x: FEET_X, y: FLOOR_Y, height: FIG_H, facing: 1,
      hands, mood: push > 0.5 ? 'effort' : 'smile',
    });
    return drawFigure(ctx, c, spec, { ...spec.look, t: this.ask || this.beat !== 1 ? t : 0 });
  }

  // The push: drawn on the wall, from the palms into the bricks (the force
  // acts on the wall). Its length grows with the lean.
  force(ctx, c, push) {
    const len = 40 + 90 * push;
    const y = (HANDS[0].y + HANDS[1].y) / 2;
    vectorArrow(ctx, c, WALL_X + 6, y, { angle: 0, length: len, col: c.accent, width: 8, head: 22 });
    pill(ctx, c, 'F', WALL_X + 6 + len / 2, y - 36, { bg: c.accent, size: 28 });
  }

  // The upper arm (shoulder to elbow of the near arm) tinted warm, pulsing for
  // a few seconds, then holding a steady glow.
  muscle(ctx, c, sk, m) {
    const arm = sk.joints.arms[0];
    const s = arm.shoulder, e = arm.elbow;
    const pulse = m < PULSE_S ? 0.5 + 0.5 * Math.sin(m * 7) : 0.7;
    const len = Math.hypot(e.x - s.x, e.y - s.y);
    ctx.save();
    ctx.translate((s.x + e.x) / 2, (s.y + e.y) / 2);
    ctx.rotate(Math.atan2(e.y - s.y, e.x - s.x));
    for (let i = 2; i >= 1; i--) {
      ctx.beginPath();
      ctx.ellipse(0, 0, len * 0.5 + i * 4 + pulse * 3, 8 + i * 4 + pulse * 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = alpha(c.flame, 0.12 + 0.08 * pulse);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.42, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = alpha(c.flame, 0.45 + 0.3 * pulse);
    ctx.fill();
    ctx.restore();
  }

  // b1: smooth ice. A rink slab in gentle perspective, shine streaks, and a
  // rubber puck sliding at a steady speed with no arrow on it. Faint ghost
  // pucks at equal spacing show the steady slide.
  ice(ctx, c, m) {
    const { x0, x1, top, bot } = ICE;
    const iceCol = mix(c.water, c.bgSurface, 0.55);
    ctx.save();
    // slab
    ctx.beginPath();
    ctx.moveTo(x0 + 40, top);
    ctx.lineTo(x1 - 40, top);
    ctx.lineTo(x1, bot);
    ctx.lineTo(x0, bot);
    ctx.closePath();
    ctx.fillStyle = iceCol;
    ctx.fill();
    // lit far half, shaded near edge
    ctx.save();
    ctx.clip();
    ctx.fillStyle = alpha(lighten(iceCol, 0.5), 0.55);
    ctx.fillRect(x0, top, x1 - x0, (bot - top) * 0.35);
    ctx.fillStyle = alpha(darken(iceCol, 0.2), 0.5);
    ctx.fillRect(x0, bot - 18, x1 - x0, 18);
    // shine streaks
    ctx.strokeStyle = alpha(lighten(iceCol, 0.8), 0.8);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const [sx, sy, l] of [[120, 280, 70], [300, 300, 46], [470, 276, 80], [200, 292, 40], [560, 300, 50]]) {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + l, sy - l * 0.16);
      ctx.stroke();
    }
    ctx.restore();
    // rim (the slab's thickness)
    ctx.beginPath();
    ctx.moveTo(x0, bot);
    ctx.lineTo(x1, bot);
    ctx.lineTo(x1, bot + 12);
    ctx.lineTo(x0, bot + 12);
    ctx.closePath();
    ctx.fillStyle = darken(iceCol, 0.3);
    ctx.fill();
    ctx.strokeStyle = darken(iceCol, 0.42);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x0 + 40, top);
    ctx.lineTo(x1 - 40, top);
    ctx.lineTo(x1, bot);
    ctx.lineTo(x1, bot + 12);
    ctx.lineTo(x0, bot + 12);
    ctx.lineTo(x0, bot);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    const u = clamp01(m / SLIDE_S);       // steady speed: linear, no easing
    const px = PUCK_X0 + (PUCK_X1 - PUCK_X0) * u;
    const step = (PUCK_X1 - PUCK_X0) / 3;
    for (let gx = PUCK_X0; gx < px - step * 0.5; gx += step) this.puck(ctx, c, gx, 0.22);
    // the displacement s: dashed, from the start to where the puck is now
    dashArrow(ctx, c, PUCK_X0, S_Y, px, S_Y, { col: c.label });
    pill(ctx, c, 's', PUCK_X0 - 12, S_Y, { bg: c.s2, size: 26, align: 'right' });
    // speed streaks behind the moving puck
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.35);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const [dy, l] of [[-10, 56], [2, 80], [14, 48]]) {
      ctx.beginPath();
      ctx.moveTo(px - 66, PUCK_Y + 8 + dy);
      ctx.lineTo(px - 66 - l * 0.7, PUCK_Y + 8 + dy);
      ctx.stroke();
    }
    ctx.restore();
    this.puck(ctx, c, px, 1);
    drawWorkCounter(ctx, c, { x: 340, y: 190, text: 'F = 0, W = 0', size: 30 });
  }

  // A rubber puck: dark side band, a lit top face with a rim highlight.
  puck(ctx, c, x, a) {
    const rx = 56, ry = 19, th = 20;
    const rub = mix(c.label, c.bgDeep, 0.25);
    ctx.save();
    ctx.globalAlpha *= a;
    if (a === 1) drawShadow(ctx, c, x, PUCK_Y + th + 4, rx + 4, 8);
    ctx.beginPath();
    ctx.ellipse(x, PUCK_Y + th, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(x - rx, PUCK_Y);
    ctx.ellipse(x, PUCK_Y, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = darken(rub, 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, PUCK_Y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = rub;
    ctx.fill();
    ctx.strokeStyle = alpha(lighten(rub, 0.5), 0.7);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x, PUCK_Y, rx - 6, ry - 4, 0, Math.PI * 1.05, Math.PI * 1.7);
    ctx.stroke();
    ctx.restore();
  }
}
