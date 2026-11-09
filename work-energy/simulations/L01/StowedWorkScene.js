import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  drawBackdrop, drawFloor, drawShadow, drawShelf, clamp01, inOutSine, mix, alpha, lighten, darken, outBack, pill, luma,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { drawSack, displacementArrow } from 'simulations/base/kit/SimApparatus.js';
import { drawWorkCounter } from 'simulations/base/kit/SimEnergy.js';

// StowedWorkScene - blk-l01-s13, Work Leaves Something Behind (2 beats).
// b0: the 5 kg wheat bag has just been set on a wall shelf 1 m up. The
//     student's hands let go and the student steps back: nobody touches it.
//     The tag "50 J done" (5 kg x 10 m/s^2 x 1 m) pops above the bag.
// b1: a 15 cm paper cup appears on the floor right below the shelf's front
//     edge, and a dashed fall path drops straight down onto it: if it falls, it can crush the cup. The bag
//     itself stays where it is; the thing it has gained is not named here.

const PX_M = 190;                       // 1 m on screen
const GROUND = 452;
const SHELF_Y = GROUND - PX_M;          // 262: the shelf top, 1 m up
const WALL_X1 = 58, SHELF_X1 = 300;
const BAG_X = 226, BAG_W = 100, BAG_H = 118;
const FIG_H = 285;                      // a 1.5 m student
const NEAR_X = 352, FAR_X = 486;        // hands on the bag, then stepped back
// a 15 cm paper cup at the drawn scale (1 m = 190 px), right under the shelf's front edge
const CUP_X = SHELF_X1 - 12, CUP_H = 29, CUP_TOP = 24, CUP_BOT = 17;
const HOLD_S = 0.35, RELEASE_S = 0.5, STEP_S = 0.8;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

const lerp = (a, b, u) => a + (b - a) * u;

export class StowedWorkScene extends SimScene {
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A 5 kg wheat bag on a wall shelf 1 m above the floor. A student lets go of it and steps back, so nobody touches it; a tag above the bag reads 50 J done. Then a small paper cup stands on the floor right below the front edge of the shelf, and a dashed path drops straight down from the shelf edge onto it: where the bag would fall.';

  enter() { this.motionT = 0; }

  get fallBeat() { return this.stage >= 1; }
  get motionEnd() { return this.fallBeat ? 1.3 : HOLD_S + RELEASE_S + STEP_S + 0.5; }

  pointerDown() {
    this.motionT = 0;
    this.animateFor(800);
  }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  draw(ctx, c) {
    const t = this.motionT ?? 0;
    const rel = this.fallBeat ? 1 : inOutSine(clamp01((t - HOLD_S) / RELEASE_S));
    const step = this.fallBeat ? 1 : inOutSine(clamp01((t - HOLD_S - RELEASE_S) / STEP_S));
    const tag = this.fallBeat ? 1 : clamp01((t - HOLD_S - RELEASE_S - STEP_S + 0.2) / 0.45);
    drawBackdrop(ctx, c);
    drawFloor(ctx, c, GROUND, { seams: true });
    this.wall(ctx, c);
    this.height(ctx, c);
    if (this.fallBeat) this.cup(ctx, c, clamp01(t / 0.35));
    this.studentAndBag(ctx, c, rel, step);
    if (tag > 0) {
      const s = 0.7 + 0.3 * outBack(tag);
      drawWorkCounter(ctx, c, { x: BAG_X, y: SHELF_Y - BAG_H - 54, text: '50 J done', size: Math.round(26 * s), alpha: clamp01(tag * 2) });
    }
    if (this.fallBeat) this.fallPath(ctx, c, clamp01((t - 0.3) / 0.8));
    if (this.fallBeat) pill(ctx, c, 'cup', CUP_X + 26, GROUND - 16, { bg: c.raised ?? c.bgSurface, size: 21, align: 'left', alpha: clamp01(t / 0.35) });
  }

  wall(ctx, c) {
    const body = mix(c.bgSurface, c.label, 0.1);
    ctx.save();
    ctx.fillStyle = body;
    ctx.fillRect(0, 20, WALL_X1, GROUND - 20);
    ctx.fillStyle = darken(body, 0.18);
    ctx.fillRect(WALL_X1 - 7, 20, 7, GROUND - 20);
    ctx.fillStyle = lighten(body, 0.16);
    ctx.fillRect(0, 20, 5, GROUND - 20);
    ctx.strokeStyle = alpha(darken(body, 0.25), 0.6);
    ctx.lineWidth = 2;
    for (let y = 56, i = 0; y < GROUND; y += 34, i++) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(WALL_X1 - 7, y);
      const vx = i % 2 ? 18 : 36;
      ctx.moveTo(vx, y); ctx.lineTo(vx, y + 34);
      ctx.stroke();
    }
    ctx.fillStyle = darken(body, 0.2);
    ctx.fillRect(0, GROUND - 14, WALL_X1, 14);
    // two wall brackets under the board
    const wood = darken(c.gold, 0.3);
    for (const bx of [WALL_X1, 150]) {
      const isWall = bx === WALL_X1;
      ctx.fillStyle = darken(wood, 0.25);
      ctx.beginPath();
      if (isWall) {
        ctx.moveTo(bx, SHELF_Y + 12); ctx.lineTo(bx + 64, SHELF_Y + 12); ctx.lineTo(bx, SHELF_Y + 76);
      } else {
        ctx.rect(bx - 5, SHELF_Y + 12, 10, 18);
      }
      ctx.closePath();
      ctx.fill();
      if (isWall) {
        ctx.fillStyle = lighten(wood, 0.1);
        ctx.beginPath();
        ctx.moveTo(bx + 4, SHELF_Y + 16); ctx.lineTo(bx + 46, SHELF_Y + 16); ctx.lineTo(bx + 4, SHELF_Y + 58);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
    drawShelf(ctx, c, WALL_X1 - 4, SHELF_X1, SHELF_Y);
  }

  height(ctx, c) {
    displacementArrow(ctx, c, 112, GROUND, 112, SHELF_Y + 20, { label: '1 m', side: -1, size: 24 });
  }

  studentAndBag(ctx, c, rel, step) {
    const x = lerp(NEAR_X, FAR_X, step);
    const H = FIG_H;
    const drawBag = () => {
      drawSack(ctx, c, { x: BAG_X, y: SHELF_Y, w: BAG_W, h: BAG_H, kind: 'sack' });
      pill(ctx, c, '5 kg', BAG_X - 8, SHELF_Y - BAG_H * 0.38, { bg: c.raised ?? c.bgSurface, size: 22 });
    };
    // the grips are known before the bag is drawn (same o as drawSack's)
    const grips = [{ x: BAG_X + BAG_W / 2 - 12, y: SHELF_Y - 26 }, { x: BAG_X + BAG_W / 2 - 18, y: SHELF_Y - 64 }];
    const side = (k) => ({ x: x - 0.04 * H + k * 0.06 * H, y: GROUND - 0.47 * H });
    const rest = [side(0), side(1)];
    const hands = [0, 1].map((i) => ({ x: lerp(grips[i].x, rest[i].x, rel), y: lerp(grips[i].y, rest[i].y, rel) }));
    const walking = step > 0 && step < 1;
    const pose = walking
      ? { name: 'walk', phase: step % 1 }
      : (rel < 1 ? { name: 'stand', lean: 14 * (1 - rel) } : 'stand');
    const base = figureFor(this, { role: 'student', pose: 'stand', x, y: GROUND, height: H, facing: -1 });
    const spec = { ...base, pose, hands, autoReach: rel < 1 };
    drawBag();
    drawFigure(ctx, c, spec, base.look);
  }

  // A paper cup: tapered body, rolled rim, a printed band, light and shade sides.
  cup(ctx, c, u) {
    const a = clamp01(u * 2), s = 0.6 + 0.4 * outBack(u);
    const h = CUP_H * s, tw = CUP_TOP * s, bw = CUP_BOT * s;
    const x = CUP_X, y1 = GROUND, y0 = GROUND - h;
    const paper = mix(c.bgSurface, c.gold, 0.12);
    // paper is white in both themes: off the light ink in dark, off the surface in light
    const body = luma(c.bgSurface) > 0.5 ? lighten(paper, 0.5) : mix(c.label, c.gold, 0.06);
    ctx.save();
    ctx.globalAlpha = a;
    drawShadow(ctx, c, x, GROUND + 2, tw * 0.6, 5);
    const side = (k, yy) => { const w = lerp(tw, bw, (yy - y0) / h) / 2; return x + k * w; };
    ctx.beginPath();
    ctx.moveTo(side(-1, y0), y0); ctx.lineTo(side(1, y0), y0); ctx.lineTo(side(1, y1), y1); ctx.lineTo(side(-1, y1), y1);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();
    // shade side (right third), light strip (left)
    ctx.beginPath();
    ctx.moveTo(x + tw * 0.18, y0); ctx.lineTo(side(1, y0), y0); ctx.lineTo(side(1, y1), y1); ctx.lineTo(x + bw * 0.18, y1);
    ctx.closePath();
    ctx.fillStyle = darken(body, 0.14);
    ctx.fill();
    ctx.strokeStyle = alpha(lighten(body, 0.6), 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(side(-1, y0) + 3, y0 + 4); ctx.lineTo(side(-1, y1) + 3, y1 - 3);
    ctx.stroke();
    // printed band
    const b0 = y0 + h * 0.36, b1 = y0 + h * 0.6;
    ctx.beginPath();
    ctx.moveTo(side(-1, b0), b0); ctx.lineTo(side(1, b0), b0); ctx.lineTo(side(1, b1), b1); ctx.lineTo(side(-1, b1), b1);
    ctx.closePath();
    ctx.fillStyle = c.s1;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + tw * 0.18 * 0.9, b0); ctx.lineTo(side(1, b0), b0); ctx.lineTo(side(1, b1), b1); ctx.lineTo(x + bw * 0.2, b1);
    ctx.closePath();
    ctx.fillStyle = darken(c.s1, 0.2);
    ctx.fill();
    // outline and the rolled rim
    ctx.strokeStyle = darken(paper, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(side(-1, y0), y0); ctx.lineTo(side(-1, y1), y1); ctx.lineTo(side(1, y1), y1); ctx.lineTo(side(1, y0), y0);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y0, tw / 2 + 1.5, 3.5 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = darken(body, 0.25);
    ctx.fill();
    ctx.strokeStyle = lighten(body, 0.2);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  // The fall path: straight down from under the shelf's front edge onto the
  // cup (dashed, drawn in from the top). A fall, not a throw: no sideways arc.
  fallPath(ctx, c, u) {
    if (u <= 0) return;
    const x = CUP_X, y0 = SHELF_Y + 22, y1 = GROUND - CUP_H - 12;
    const tipY = y0 + (y1 - y0) * u;
    const col = c.label;
    ctx.save();
    ctx.strokeStyle = alpha(col, 0.85);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.setLineDash([10, 9]);
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, Math.max(y0, tipY - 10));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = alpha(col, 0.9);
    ctx.beginPath();
    ctx.moveTo(x, tipY + 6);
    ctx.lineTo(x - 9, tipY - 12);
    ctx.lineTo(x + 9, tipY - 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
