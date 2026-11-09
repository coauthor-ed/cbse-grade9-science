import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, rr, drawBackdrop, drawFloor, drawShadow, pill, alpha, darken, lighten, mix,
  clamp01, inOutSine, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor, solveFigure } from 'simulations/base/kit/SimFigure.js';

// DumbbellScene - blk-l01-n02, Lifting and Lowering a Dumbbell (book Example 7.1).
// b0: a girl curls a dumbbell up to her chest. Her force F on it points up
//     (solid), its displacement s points up (dashed): chip "+".
// b1: she lowers it slowly. F still points up; s now points down: chip "-".
// A front raise: the hand is a world grip moved along the arc of her straight
// arm about the shoulder, so the dumbbell, drawn in the grip, travels with the
// hand and stays clear of her body and face, side-on in both beats.

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

const FLOOR_Y = 470;
const FIG_H = 410;
const FIG_X = 250;
const LIFT_S = 1.4;
const LOWER_S = 2.6;          // slowly
const A_LOW = 0.95;           // arm angle at the bottom (radians, y down): down and forward, in front of her hips
const A_HIGH = 0.2;           // at the top: arm forward, the dumbbell at chest height, clear of her face

function dashArrow(ctx, c, x1, y1, x2, y2, o = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 8) return;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const col = o.col ?? c.label;
  ctx.save();
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

export class DumbbellScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A girl holds a dumbbell. First she lifts it to her shoulder: her force F points up and the dumbbell moves up, so the chip shows plus. Then she lowers it slowly: her force F still points up, but the dumbbell moves down, so the chip shows minus.';

  enter() {
    this.motionT = 0;
  }

  pointerDown() {
    this.motionT = 0; // tap: play the move again
    this.animateFor(600);
  }

  get dur() { return this.stage >= 1 ? LOWER_S : LIFT_S; }

  update(d) { this.motionT = Math.min(this.dur + 0.1, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.dur + 0.1; }

  // The curl geometry, from the kit's own solve of her standing arm.
  rig() {
    if (this.rigCache) return this.rigCache;
    const sk = solveFigure({ x: FIG_X, y: FLOOR_Y, height: FIG_H, facing: 1, build: 'teen', pose: 'stand' });
    const arm = sk.joints.arms[0];
    const upper = Math.hypot(arm.elbow.x - arm.shoulder.x, arm.elbow.y - arm.shoulder.y);
    const fore = Math.hypot(arm.hand.x - arm.elbow.x, arm.hand.y - arm.elbow.y);
    this.rigCache = { elbow: { x: arm.shoulder.x, y: arm.shoulder.y }, r: (upper + fore) * 0.96 };
    return this.rigCache;
  }

  handAt(a) {
    const { elbow, r } = this.rig();
    return { x: elbow.x + Math.cos(a) * r, y: elbow.y + Math.sin(a) * r };
  }

  draw(ctx, c) {
    const lowering = this.stage >= 1;
    const m = this.motionT ?? 0;
    const u = lowering ? clamp01(m / LOWER_S) : inOutSine(clamp01(m / LIFT_S));
    const a0 = lowering ? A_HIGH : A_LOW;
    const a1 = lowering ? A_LOW : A_HIGH;
    const a = a0 + (a1 - a0) * u;
    const hand = this.handAt(a);
    const start = this.handAt(a0);

    drawBackdrop(ctx, c, 'plain');
    this.gymWall(ctx, c);
    drawFloor(ctx, c, FLOOR_Y, { seams: true });
    this.mat(ctx, c);

    drawShadow(ctx, c, FIG_X + 10, FLOOR_Y + 2, 64, 10);
    const spec = figureFor(this, {
      role: 'student', pose: 'stand', x: FIG_X, y: FLOOR_Y, height: FIG_H, facing: 1,
      hands: [hand, null], autoReach: false,
      mood: lowering ? 'think' : 'effort',
      look: { hairStyle: 'ponytail', outfit: 'tee', bottomStyle: 'trousers', top: c.s3, shoeStyle: 'sneaker' },
    });
    drawFigure(ctx, c, spec, { ...spec.look, t: this.clock }, { between: () => this.dumbbell(ctx, c, hand.x, hand.y) });

    // where the dumbbell started: a faded ghost (over her, so it reads)
    if (Math.abs(hand.y - start.y) > 30) {
      ctx.save();
      ctx.globalAlpha *= 0.25;
      this.dumbbell(ctx, c, start.x, start.y);
      ctx.restore();
    }

    // F: always up, straight above the grip, riding with the dumbbell
    vectorArrow(ctx, c, hand.x, hand.y - 36, { angle: -Math.PI / 2, length: 96, col: c.accent, width: 7, head: 20 });
    pill(ctx, c, 'F', hand.x + 34, hand.y - 112, { bg: c.accent, size: 26 });
    // s: start height to now, dashed, just beside the near plates
    const sx = hand.x + 84;
    dashArrow(ctx, c, sx, start.y, sx, hand.y, { col: c.label });
    if (Math.abs(hand.y - start.y) > 30) pill(ctx, c, 's', sx + 34, (start.y + hand.y) / 2, { bg: c.s2, size: 26 });

    // the sign of the work, once the move is under way, beside the arrows
    const k = clamp01((m - 0.3) / 0.4);
    if (k > 0) {
      const sign = lowering ? '\u2212' : '+';
      pill(ctx, c, sign, sx + 110, (start.y + hand.y) / 2, { bg: lowering ? c.bad : c.good, size: 50, alpha: k });
    }
  }

  // A gym wall: two broad horizontal stripes on painted plaster.
  gymWall(ctx, c) {
    ctx.save();
    const wall = mix(c.bgSurface, c.s3, 0.08);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, FLOOR_Y);
    ctx.fillStyle = darken(wall, 0.16);
    ctx.fillRect(0, FLOOR_Y - 14, W, 14);
    const band = mix(c.bgSurface, c.s3, 0.18);
    ctx.fillStyle = band;
    ctx.fillRect(0, FLOOR_Y - 150, W, 54);
    ctx.fillStyle = alpha(darken(band, 0.15), 0.9);
    ctx.fillRect(0, FLOOR_Y - 104, W, 8);
    ctx.fillStyle = alpha(lighten(band, 0.45), 0.8);
    ctx.fillRect(0, FLOOR_Y - 150, W, 3);
    ctx.restore();
  }

  // A rubber floor mat under her feet: top face, a thick shaded front edge.
  mat(ctx, c) {
    const col = mix(c.s1, c.label, 0.35);
    ctx.save();
    rr(ctx, FIG_X - 120, FLOOR_Y - 6, 250, 14, 5);
    ctx.fillStyle = darken(col, 0.25);
    ctx.fill();
    rr(ctx, FIG_X - 120, FLOOR_Y - 10, 250, 10, 5);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.fillStyle = alpha(lighten(col, 0.4), 0.7);
    ctx.fillRect(FIG_X - 112, FLOOR_Y - 9, 234, 2);
    ctx.restore();
  }

  // A dumbbell in a 3/4 view: a knurled handle through the grip, and at each
  // end two iron plates (a big one inside, a smaller one outside), each with a
  // lit face, a shaded rim band and a hub.
  dumbbell(ctx, c, x, y) {
    const iron = mix(c.label, c.bgDeep, 0.3);
    const steel = mix(c.stroke, c.bgSurface, 0.25);
    const half = 36;
    ctx.save();
    // handle
    rr(ctx, x - half, y - 5, half * 2, 10, 5);
    ctx.fillStyle = steel;
    ctx.fill();
    ctx.fillStyle = alpha(lighten(steel, 0.5), 0.8);
    ctx.fillRect(x - half + 4, y - 4, half * 2 - 8, 2.5);
    ctx.strokeStyle = darken(steel, 0.35);
    ctx.lineWidth = 2;
    rr(ctx, x - half, y - 5, half * 2, 10, 5);
    ctx.stroke();
    // plates: far end first, then near end
    for (const side of [-1, 1]) {
      for (let [off, ry, rx] of [[half - 16, 30, 9], [half - 4, 23, 8]]) {
        const k = side < 0 ? 0.84 : 1;      // the far end recedes: smaller, a touch higher
        const px = x + side * off * k;
        ry *= k; rx *= k;
        const y0 = y;
        y = y0 - (side < 0 ? 3 : 0);
        // rim band (the plate's thickness)
        ctx.beginPath();
        ctx.ellipse(px + 5 * side, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = darken(iron, 0.3);
        ctx.fill();
        ctx.fillRect(px - 0.5 + Math.min(0, 5 * side), y - ry, 5, ry * 2);
        // face
        ctx.beginPath();
        ctx.ellipse(px, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = iron;
        ctx.fill();
        ctx.strokeStyle = alpha(lighten(iron, 0.55), 0.8);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(px, y, rx - 2.5, ry - 3, 0, Math.PI * 0.95, Math.PI * 1.55);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(px, y, 3, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = steel;
        ctx.fill();
        ctx.strokeStyle = darken(iron, 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(px, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        y = y0;
      }
    }
    ctx.restore();
  }
}
