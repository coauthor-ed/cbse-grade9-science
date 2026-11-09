import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, rr, drawBackdrop, drawFloor, drawShadow, pill, alpha, darken, lighten, mix,
  clamp01, inOutSine, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor, walkPhase } from 'simulations/base/kit/SimFigure.js';
import { drawWorkCounter } from 'simulations/base/kit/SimEnergy.js';

// CarryBoxScene - blk-l01-s05, Carrying a Box (book Fig 7.6).
// b0: a girl walks right across a room carrying a cardboard box in front of
//     her. Her force on the box: a solid arrow F straight up. The box's
//     displacement: a dashed arrow s to the right. Both ride with the box.
// b1: the same walk; a right-angle mark sits between F and s, and a work
//     counter beside her stays at "W = 0 J" the whole way.

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

const FLOOR_Y = 446;
const FIG_H = 250;
const X_START = 70;           // her feet, start of the walk
const X_END = 262;            // her feet, end of the walk
const WALK_S = 3.0;
const BOX_W = 122;
const BOX_H = 86;
const BOX_DX = 72;            // box centre ahead of her feet
const BOX_BOT = FLOOR_Y - 100; // box bottom above the floor (held at the waist)
const TOP_D = 14;             // depth of the box top in the 3/4 view
const F_LEN = 132;
const S_LEN = 150;

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

export class CarryBoxScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A girl walks to the right across a room, holding a cardboard box in front of her. Her force on the box is an arrow F pointing straight up; the box moves to the right, shown by a dashed arrow s. Then a right-angle mark appears between F and s, and the work counter stays at W = 0 J as she walks.';

  enter() {
    this.motionT = 0;
  }

  pointerDown() {
    this.motionT = 0; // tap: walk again
    this.animateFor(600);
  }

  update(d) { this.motionT = Math.min(WALK_S + 0.1, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < WALK_S + 0.1; }

  draw(ctx, c) {
    const m = this.motionT ?? 0;
    const u = inOutSine(clamp01(m / WALK_S));
    const fx = X_START + (X_END - X_START) * u;
    drawBackdrop(ctx, c, 'plain');
    this.room(ctx, c);
    drawFloor(ctx, c, FLOOR_Y, { seams: true });

    const box = { cx: fx + BOX_DX, bot: BOX_BOT - Math.abs(Math.sin(u * Math.PI * 6)) * 2 };
    const bx0 = box.cx - BOX_W / 2, by0 = box.bot - BOX_H;
    drawShadow(ctx, c, fx + 20, FLOOR_Y + 2, 70, 10);
    const walking = m > 0 && m < WALK_S;
    const dist = (X_END - X_START) * u;
    const spec = figureFor(this, {
      role: 'student', x: fx, y: FLOOR_Y, height: FIG_H, facing: 1,
      pose: walking ? { name: 'walk', phase: walkPhase(dist, FIG_H, 'walk') } : 'carry',
      hands: [{ x: bx0 + 10, y: by0 + BOX_H * 0.55 }, { x: bx0 + 14, y: by0 + BOX_H * 0.42 }],
      look: { hairStyle: 'braid', outfit: 'kurti', bottomStyle: 'trousers', top: c.s5 },
    });
    drawFigure(ctx, c, spec, { ...spec.look, t: this.clock }, { between: () => this.cardboard(ctx, c, bx0, by0) });

    // the two arrows share a tail at the box's top far corner
    const ox = bx0 + BOX_W + TOP_D * 0.6, oy = by0 - TOP_D * 0.5;
    if (this.stage >= 1) this.rightAngle(ctx, c, ox, oy);
    vectorArrow(ctx, c, ox, oy, { angle: -Math.PI / 2, length: F_LEN, col: c.accent, width: 7, head: 20 });
    pill(ctx, c, 'F', ox - 30, oy - F_LEN + 16, { bg: c.accent, size: 26 });
    dashArrow(ctx, c, ox, oy, ox + S_LEN, oy, { col: c.label });
    pill(ctx, c, 's', ox + S_LEN - 20, oy - 30, { bg: c.s2, size: 26 });

    if (this.stage >= 1) drawWorkCounter(ctx, c, { x: 170, y: 70, text: 'W = 0 J', size: 30 });
  }

  // A plain room: a wall with a skirting board and a door on the far right,
  // the place she is walking to.
  room(ctx, c) {
    const wall = mix(c.bgSurface, c.s4, 0.1);
    ctx.save();
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, FLOOR_Y);
    ctx.fillStyle = alpha(lighten(wall, 0.4), 0.5);
    ctx.fillRect(0, 0, W, 60);
    // skirting
    ctx.fillStyle = darken(wall, 0.18);
    ctx.fillRect(0, FLOOR_Y - 16, W, 16);
    ctx.fillStyle = alpha(lighten(wall, 0.5), 0.8);
    ctx.fillRect(0, FLOOR_Y - 16, W, 2.5);
    // door: frame, panel, two inset panels, a handle
    const dx = 566, dw = 90, dtop = FLOOR_Y - 250;
    const wood = mix(c.gold, c.flame, 0.35);
    rr(ctx, dx - 8, dtop - 8, dw + 16, FLOOR_Y - dtop + 8, 4);
    ctx.fillStyle = darken(wall, 0.28);
    ctx.fill();
    rr(ctx, dx, dtop, dw, FLOOR_Y - dtop, 2);
    ctx.fillStyle = wood;
    ctx.fill();
    ctx.fillStyle = darken(wood, 0.16);
    ctx.fillRect(dx + dw * 0.68, dtop, dw * 0.32, FLOOR_Y - dtop);
    ctx.strokeStyle = darken(wood, 0.3);
    ctx.lineWidth = 2.5;
    for (const [py, ph] of [[dtop + 18, 92], [dtop + 128, 100]]) {
      rr(ctx, dx + 14, py, dw - 28, ph, 4);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(dx + dw - 16, dtop + 130, 6, 0, Math.PI * 2);
    ctx.fillStyle = darken(c.gold, 0.2);
    ctx.fill();
    ctx.restore();
  }

  // A closed cardboard box in a 3/4 view: front face, a lit top, a shaded end,
  // a tape strip over the top seam and down the front. No face.
  cardboard(ctx, c, x, y) {
    const card = mix(c.gold, c.flame, 0.22);
    const d = TOP_D;
    ctx.save();
    ctx.lineJoin = 'round';
    // end (shade side)
    ctx.beginPath();
    ctx.moveTo(x + BOX_W, y);
    ctx.lineTo(x + BOX_W + d * 0.6, y - d * 0.5);
    ctx.lineTo(x + BOX_W + d * 0.6, y + BOX_H - d * 0.5);
    ctx.lineTo(x + BOX_W, y + BOX_H);
    ctx.closePath();
    ctx.fillStyle = darken(card, 0.26);
    ctx.fill();
    // top (light side)
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + d * 0.6, y - d * 0.5);
    ctx.lineTo(x + BOX_W + d * 0.6, y - d * 0.5);
    ctx.lineTo(x + BOX_W, y);
    ctx.closePath();
    ctx.fillStyle = lighten(card, 0.22);
    ctx.fill();
    // front
    ctx.fillStyle = card;
    ctx.fillRect(x, y, BOX_W, BOX_H);
    ctx.fillStyle = alpha(darken(card, 0.12), 0.8);
    ctx.fillRect(x, y + BOX_H * 0.7, BOX_W, BOX_H * 0.3);
    // corrugation hint: a flap line just under the top
    ctx.strokeStyle = alpha(darken(card, 0.3), 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 13);
    ctx.lineTo(x + BOX_W - 4, y + 13);
    ctx.stroke();
    // tape over the top seam and down the front
    const tape = mix(lighten(card, 0.5), c.bgSurface, 0.3);
    ctx.fillStyle = tape;
    ctx.beginPath();
    ctx.moveTo(x + BOX_W * 0.5 - 8, y);
    ctx.lineTo(x + BOX_W * 0.5 - 8 + d * 0.6, y - d * 0.5);
    ctx.lineTo(x + BOX_W * 0.5 + 8 + d * 0.6, y - d * 0.5);
    ctx.lineTo(x + BOX_W * 0.5 + 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x + BOX_W * 0.5 - 8, y, 16, 26);
    // rim
    ctx.strokeStyle = darken(card, 0.45);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y + BOX_H);
    ctx.lineTo(x, y);
    ctx.lineTo(x + d * 0.6, y - d * 0.5);
    ctx.lineTo(x + BOX_W + d * 0.6, y - d * 0.5);
    ctx.lineTo(x + BOX_W + d * 0.6, y + BOX_H - d * 0.5);
    ctx.lineTo(x + BOX_W, y + BOX_H);
    ctx.closePath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + BOX_W, y);
    ctx.lineTo(x + BOX_W + d * 0.6, y - d * 0.5);
    ctx.moveTo(x + BOX_W, y);
    ctx.lineTo(x + BOX_W, y + BOX_H);
    ctx.stroke();
    ctx.restore();
  }

  rightAngle(ctx, c, x, y) {
    const k = clamp01((this.age ?? 0) / 0.5);
    const s = 26;
    ctx.save();
    ctx.globalAlpha *= k;
    ctx.fillStyle = alpha(c.gold, 0.35);
    ctx.fillRect(x, y - s, s, s);
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s, y - s);
    ctx.lineTo(x + s, y);
    ctx.stroke();
    ctx.restore();
  }
}
