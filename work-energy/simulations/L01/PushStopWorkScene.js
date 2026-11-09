import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, rr, drawBackdrop, drawFloor, drawShadow, pill, alpha, darken, lighten, mix,
  clamp01, inOutSine, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';

// PushStopWorkScene - two slides (book Fig 7.7).
// blk-l01-s09 (3 beats), two pictures side by side:
//   b0 a boy pushes a wheelchair forward (an elderly woman sits in it): F right,
//      s right, chip "+". The goalkeeper picture is dimmed.
//   b1 a goalkeeper stops a ball: her force on the ball points back (left), the
//      ball still moves forward (right) while she stops it: chip "-".
//   b2 the pictures dim; three big chips "+", "0", "-" in a row.
// blk-l01-s10 (2 beats), the goalkeeper alone and close:
//   b0 ball and hands in contact: two equal and opposite force arrows, one on
//      the ball (from her hands, pointing back) and one on her hands (from the
//      ball, pointing the way the ball moves).
//   b1 hands and ball move back together; tags "+ on hands" and "- on ball".

const MAP_S09 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
const MAP_S10 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];

const FLOOR_Y = 430;
const ROLL_S = 1.6;
const CATCH_S = 1.6;           // ball flies in (first 45%), then she stops it
const BACK_S = 1.0;            // s10 b1: hands and ball move back together

function dashArrow(ctx, c, x1, y1, x2, y2, o = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 8) return;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const col = o.col ?? c.label;
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * 12, y2 - uy * 12);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * 18 - uy * 10, y2 - uy * 18 + ux * 10);
  ctx.lineTo(x2 - ux * 18 + uy * 10, y2 - uy * 18 - ux * 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export class PushStopWorkScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_MAPS = { 3: MAP_S09, 2: MAP_S10 };
  static BEAT_STEP_MAP = MAP_S09;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Two pictures. A boy pushes a wheelchair with an elderly woman in it: his force and the displacement both point forward, so the work is positive. A goalkeeper stops a ball: her force on the ball points back while the ball still moves forward, so the work is negative. Then three signs: plus, zero, minus. On the next slide, the goalkeeper and the ball push each other with equal and opposite forces: the ball does positive work on her hands, she does negative work on the ball.';

  enter() {
    this.motionT = 0;
  }

  get pair() { return this.beatCount === 2; }

  pointerDown() {
    this.motionT = 0; // tap: play the beat again
    this.animateFor(600);
  }

  get motionEnd() {
    if (this.pair) return (this.stage >= 1 ? BACK_S : 0.6) + 0.1;
    if (this.stage === 0) return ROLL_S + 0.1;
    if (this.stage === 1) return CATCH_S + 0.1;
    return 0.8;
  }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    if (this.pair) this.drawPair(ctx, c);
    else this.drawSigns(ctx, c);
  }

  // ---- s09: two pictures, then three signs ----

  drawSigns(ctx, c) {
    const b = this.stage;
    const m = this.motionT ?? 0;
    drawFloor(ctx, c, FLOOR_Y, { seams: true });

    const dimL = b === 0 ? 1 : 0.22;
    const dimR = b === 1 ? 1 : 0.22;

    // left: the wheelchair rolls forward in b0; it rests at the end elsewhere
    const roll = b === 0 ? inOutSine(clamp01(m / ROLL_S)) : 1;
    const chairX = 150 + roll * 60;
    ctx.save();
    ctx.globalAlpha *= dimL;
    this.wheelchairGroup(ctx, c, chairX, 190);
    if (b === 0) {
      const gy = FLOOR_Y - 74 - 60 - 52;   // just above the handles
      vectorArrow(ctx, c, chairX - 56, gy, { angle: 0, length: 120, col: c.accent, width: 7, head: 20 });
      pill(ctx, c, 'F', chairX + 4, gy - 32, { bg: c.accent, size: 24 });
      dashArrow(ctx, c, 150 - 40, FLOOR_Y + 30, chairX + 70, FLOOR_Y + 30);
      pill(ctx, c, 's', (150 + chairX) / 2 + 20, FLOOR_Y + 62, { bg: c.s2, size: 24 });
    }
    ctx.restore();

    // right: the ball flies in, she meets it and stops it
    const contactX = 470, stopX = 512, ballY = FLOOR_Y - 118;
    let ballX = stopX, hold = 1;
    if (b === 1) {
      const u = clamp01(m / CATCH_S);
      if (u < 0.45) { ballX = 368 + (contactX - 368) * (u / 0.45); hold = 0; }
      else { const v = 1 - (1 - (u - 0.45) / 0.55) ** 3; ballX = contactX + (stopX - contactX) * v; hold = 1; }
    }
    ctx.save();
    ctx.globalAlpha *= dimR;
    this.goal(ctx, c, 596, 668, FLOOR_Y - 230);
    this.keeper(ctx, c, { feetX: 572, height: 196, ballX, ballY, ballR: 21, hold });
    if (b === 1 && hold) {
      vectorArrow(ctx, c, ballX, ballY - 46, { angle: Math.PI, length: 90, col: c.accent, width: 7, head: 20 });
      pill(ctx, c, 'F', ballX - 46, ballY - 78, { bg: c.accent, size: 24 });
      dashArrow(ctx, c, contactX - 20, FLOOR_Y + 30, stopX + 40, FLOOR_Y + 30);
      pill(ctx, c, 's', contactX + 10, FLOOR_Y + 62, { bg: c.s2, size: 24 });
    }
    ctx.restore();

    // the signs
    if (b === 0) pill(ctx, c, '+', 170, 70, { bg: c.good, size: 60 });
    if (b === 1 && hold) pill(ctx, c, '\u2212', 500, 70, { bg: c.bad, size: 60 });
    if (b === 2) {
      const k = clamp01(m / 0.5);
      const items = [['+', c.good], ['0', c.s2], ['\u2212', c.bad]];
      items.forEach(([t, bg], i) => {
        const ki = clamp01(k * 3 - i);
        pill(ctx, c, t, 190 + i * 150, 230, { bg, size: 92, alpha: ki });
      });
    }
  }

  // A wheelchair facing right with its wheel centre at x, an elderly woman
  // seated in it, and a boy behind pushing the handles. h = the boy's height.
  wheelchairGroup(ctx, c, x, h) {
    const R = 46;
    const wy = FLOOR_Y - R;
    const seatY = FLOOR_Y - 74;
    const backX = x - 30;
    const handle = { x: backX - 22, y: seatY - 60 };
    const frame = mix(c.stroke, c.bgSurface, 0.15);
    const deep = darken(frame, 0.4);
    const tyre = mix(c.label, c.bgDeep, 0.35);

    drawShadow(ctx, c, x + 6, FLOOR_Y + 2, 74, 10);
    // the boy, behind: drawn first
    const boy = figureFor(this, {
      role: 'student', pose: { name: 'push', lean: 10 }, x: backX - 96, y: FLOOR_Y, height: h, facing: 1,
      hands: [{ x: handle.x, y: handle.y + 3 }, { x: handle.x + 4, y: handle.y - 2 }],
      look: { hairStyle: 'short', outfit: 'shirt', top: c.s4 }, mood: 'smile',
    });
    drawFigure(ctx, c, boy, { ...boy.look, t: this.clock });

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // far wheel peeking behind
    ctx.strokeStyle = alpha(tyre, 0.6);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(x + 10, wy - 2, R - 2, 0, Math.PI * 2);
    ctx.stroke();
    // frame: backrest post + handle, seat rails, leg down to the footrest, caster fork
    ctx.strokeStyle = deep;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(handle.x, handle.y);
    ctx.lineTo(backX, handle.y);
    ctx.lineTo(backX, seatY);
    ctx.lineTo(x + 36, seatY);
    ctx.lineTo(x + 58, FLOOR_Y - 18);
    ctx.lineTo(x + 76, FLOOR_Y - 18);
    ctx.moveTo(x + 36, seatY);
    ctx.lineTo(x + 46, FLOOR_Y - 14);
    ctx.stroke();
    ctx.strokeStyle = frame;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(handle.x + 2, handle.y - 1);
    ctx.lineTo(backX - 1, handle.y - 1);
    ctx.lineTo(backX - 1, seatY);
    ctx.stroke();
    // handle grip
    rr(ctx, handle.x - 10, handle.y - 5, 16, 10, 5);
    ctx.fillStyle = tyre;
    ctx.fill();
    // backrest sling and seat cushion
    rr(ctx, backX - 6, handle.y + 8, 12, seatY - handle.y - 10, 4);
    ctx.fillStyle = mix(c.s1, c.label, 0.3);
    ctx.fill();
    rr(ctx, backX, seatY - 10, 68, 12, 5);
    ctx.fillStyle = mix(c.s1, c.label, 0.3);
    ctx.fill();
    ctx.fillStyle = alpha(lighten(c.s1, 0.3), 0.6);
    ctx.fillRect(backX + 4, seatY - 9, 60, 3);
    ctx.restore();

    // the woman, seated
    const seat = { x: x + 4, y: seatY - 8 };
    const her = figureFor(this, {
      role: 'elder', pose: 'sit', x: seat.x, y: FLOOR_Y, height: h * 0.95, facing: 1, seat,
      feet: [{ x: x + 70, y: FLOOR_Y - 22 }, { x: x + 64, y: FLOOR_Y - 22 }],
      look: { hairStyle: 'bun', outfit: 'kurti', top: c.s3, dupatta: true }, mood: 'smile',
    });
    drawFigure(ctx, c, her, { ...her.look, t: this.clock });

    // near wheel over her: tyre, rim, spokes, hand rim, hub; then the caster
    ctx.save();
    ctx.strokeStyle = tyre;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(x, wy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = alpha(lighten(tyre, 0.4), 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, wy, R + 2, Math.PI * 1.05, Math.PI * 1.45);
    ctx.stroke();
    ctx.strokeStyle = frame;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, wy, R - 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = alpha(frame, 0.75);
    ctx.lineWidth = 1.8;
    const spin = (x - 150) / R;     // the wheel turns as it rolls
    for (let i = 0; i < 8; i++) {
      const a = spin + (i / 8) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * (R - 6), wy - Math.sin(a) * (R - 6));
      ctx.lineTo(x + Math.cos(a) * (R - 6), wy + Math.sin(a) * (R - 6));
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, wy, 6, 0, Math.PI * 2);
    ctx.fillStyle = deep;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 46, FLOOR_Y - 9, 9, 0, Math.PI * 2);
    ctx.fillStyle = tyre;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 46, FLOOR_Y - 9, 3, 0, Math.PI * 2);
    ctx.fillStyle = frame;
    ctx.fill();
    ctx.restore();
  }

  // A goal: white posts with a shaded side and a net hatched behind.
  goal(ctx, c, x0, x1, top) {
    const post = mix(c.bgSurface, c.label, 0.06);
    ctx.save();
    ctx.strokeStyle = alpha(c.labelMuted, 0.45);
    ctx.lineWidth = 1.5;
    for (let x = x0 + 8; x < x1; x += 14) {
      ctx.beginPath(); ctx.moveTo(x, top + 8); ctx.lineTo(x + 10, FLOOR_Y); ctx.stroke();
    }
    for (let y = top + 18; y < FLOOR_Y; y += 14) {
      ctx.beginPath(); ctx.moveTo(x0 + 4, y); ctx.lineTo(x1, y + 4); ctx.stroke();
    }
    rr(ctx, x0 - 6, top - 6, 12, FLOOR_Y - top + 6, 4);
    ctx.fillStyle = post;
    ctx.fill();
    ctx.fillStyle = darken(post, 0.18);
    ctx.fillRect(x0 + 1, top - 2, 4, FLOOR_Y - top);
    rr(ctx, x0 - 6, top - 6, x1 - x0 + 12, 12, 4);
    ctx.fillStyle = post;
    ctx.fill();
    ctx.strokeStyle = darken(post, 0.35);
    ctx.lineWidth = 2;
    rr(ctx, x0 - 6, top - 6, 12, FLOOR_Y - top + 6, 4);
    ctx.stroke();
    rr(ctx, x0 - 6, top - 6, x1 - x0 + 12, 12, 4);
    ctx.stroke();
    ctx.restore();
  }

  // The goalkeeper faces left, gloved hands on the ball (or waiting for it).
  keeper(ctx, c, o) {
    const { feetX, height, ballX, ballY, ballR } = o;
    const contact = { x: ballX + ballR - 2, y: ballY };
    const hands = o.hold
      ? [{ x: contact.x - 2, y: ballY + ballR * 0.55 }, { x: contact.x - 4, y: ballY - ballR * 0.55 }]
      : [{ x: feetX - height * 0.36, y: ballY + 6 }, { x: feetX - height * 0.36, y: ballY - 10 }];
    drawShadow(ctx, c, feetX - 10, FLOOR_Y + 2, height * 0.28, 9);
    if (!o.hold) this.ball(ctx, c, ballX, ballY, ballR);
    const spec = figureFor(this, {
      role: 'student', pose: { name: 'push', lean: o.lean ?? (o.hold ? 14 : 18) }, x: feetX, y: FLOOR_Y, height, facing: -1,
      hands, look: { hairStyle: 'ponytail', outfit: 'tee', top: c.s3, bottomStyle: 'shorts', shoeStyle: 'sneaker' },
      mood: 'effort',
    });
    return drawFigure(ctx, c, spec, { ...spec.look, t: this.clock },
      { between: o.hold ? () => this.ball(ctx, c, ballX, ballY, ballR) : null });
  }

  // A football: white ball, a shade side, dark patches, a rim. No face.
  ball(ctx, c, x, y, r) {
    const white = mix(c.bgSurface, c.label, 0.03);
    const patch = mix(c.label, c.bgDeep, 0.2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = white;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = alpha(darken(white, 0.22), 0.9);
    ctx.beginPath();
    ctx.arc(x + r * 0.45, y + r * 0.45, r * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = patch;
    const pent = (px, py, pr) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
        ctx[i ? 'lineTo' : 'moveTo'](px + Math.cos(a) * pr, py + Math.sin(a) * pr);
      }
      ctx.closePath();
      ctx.fill();
    };
    pent(x, y, r * 0.32);
    pent(x - r * 0.8, y - r * 0.5, r * 0.28);
    pent(x + r * 0.75, y - r * 0.6, r * 0.28);
    pent(x - r * 0.2, y + r * 0.95, r * 0.28);
    ctx.restore();
    ctx.strokeStyle = darken(white, 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ---- s10: the goalkeeper and the ball, close ----

  drawPair(ctx, c) {
    const b = this.stage;
    const m = this.motionT ?? 0;
    drawFloor(ctx, c, FLOOR_Y + 40, { seams: true, col: c.good });
    const back = b >= 1 ? inOutSine(clamp01(m / BACK_S)) * 56 : 0;
    const ballR = 30;
    const ballX = 250 + back, by = FLOOR_Y - 140;   // ball centre on screen, held low in front of her
    const k = b === 0 ? clamp01(m / 0.5) : 1;

    // where the ball came from: a faded dashed path and ghost balls from the left
    ctx.save();
    ctx.globalAlpha *= 0.32;
    ctx.strokeStyle = c.labelMuted;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(24, by - 176);
    ctx.quadraticCurveTo(150, by - 90, 250 - ballR - 4, by - 12);
    ctx.stroke();
    ctx.setLineDash([]);
    [[60, by - 150], [146, by - 96]].forEach(([gx, gy], i) => {
      ctx.globalAlpha = 0.18 + i * 0.1;
      this.ball(ctx, c, gx, gy, ballR);
    });
    ctx.restore();

    // the keeper, larger, on the near grass line (her own coordinates sit 40 px higher)
    ctx.save();
    ctx.translate(0, 40);
    this.goal(ctx, c, 540, 690, FLOOR_Y - 330);
    this.keeper(ctx, c, { feetX: 386 + back * 0.6, height: 290, lean: 4, ballX, ballY: by - 40, ballR, hold: 1 });
    ctx.restore();

    const L = 96;
    // on the ball, from her hands: points back (left), from the ball's left edge
    const ax = ballX - ballR - 6;
    vectorArrow(ctx, c, ax, by, { angle: Math.PI, length: L, col: c.accent, width: 7, head: 20, alpha: k });
    // on her hands, from the ball: points the way the ball moves (right), just under her forearms
    const hy = by + ballR + 16;
    const hx = ballX + ballR - 8;
    vectorArrow(ctx, c, hx - 3, hy, { angle: 0, length: L, col: c.bgSurface, width: 13, head: 28, alpha: k * 0.9 });
    vectorArrow(ctx, c, hx, hy, { angle: 0, length: L - 6, col: c.s5, width: 7, head: 20, alpha: k });
    // each arrow names its force; in b1 the sign of the work that force does
    const tb = pill(ctx, c, 'F on ball', ax - L / 2, by - 38, { bg: c.accent, size: 24, alpha: k });
    const th = pill(ctx, c, 'F on hands', hx + 10, hy + 42, { bg: c.s5, size: 24, alpha: k, align: 'right' });
    if (b >= 1) {
      pill(ctx, c, '\u2212', tb.x0 - 30, by - 38, { bg: c.bad, size: 30 });
      pill(ctx, c, '+', th.x0 - 30, hy + 42, { bg: c.good, size: 30 });
      // the hands and the ball moved back together: dashed s along the floor
      dashArrow(ctx, c, 250 - 10, FLOOR_Y + 70, 250 + back + 60, FLOOR_Y + 70);
      pill(ctx, c, 's', 250 + back + 84, FLOOR_Y + 70, { bg: c.s2, size: 22 });
    }
  }
}
