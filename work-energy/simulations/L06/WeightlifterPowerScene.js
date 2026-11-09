import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, inOutSine, clamp01, mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { figureFor, solveFigure, paintFigure, figureLook, ik2 } from 'simulations/base/kit/SimFigure.js';
import { drawWorkCounter } from 'simulations/base/kit/SimEnergy.js';

// WeightlifterPowerScene - blk-l06-s05, The Weightlifter (book Ex 7.10), one beat.
// A weightlifter (front view) lifts a 75 kg barbell from the floor to straight
// arms overhead: the bar rises 2 m in 5 s, timed by a clock pill that runs in
// real seconds. A dashed h arrow grows beside the bar to the 2 m mark; the work
// pill counts up with the height to W = 1500 J, and at 5 s P = 300 W appears.
// Tap plays the lift again.

const MASS = 75, G = 10, LIFT_M = 2, LIFT_S = 5;
const WORK = MASS * G * LIFT_M;              // 1500 J
const POWER = WORK / LIFT_S;                 // 300 W

const GROUND = 468;
// One scale for the person and the lift: PX_M px per metre. The lifter is a
// 1.87 m adult on it. The bar starts on the floor at a plate's radius
// (0.225 m) and is pressed 2 m up to straight arms overhead (about 1.19 of
// the lifter's height). SimFigure's arms are cartoon-short (hands overhead at
// the crown), so this scene re-solves the two arms itself with adult length
// (half the height, shoulder to grip) and paints the kit body round them.
const PX_M = 176;
const CX = 250;
const FIG_H = Math.round(1.87 * PX_M);
const FEET_Y = GROUND - 4;
const PLATE_R = Math.round(0.225 * PX_M);           // the plates stand on the platform
const BAR_Y0 = GROUND - PLATE_R;                    // bar centre on the floor
const BAR_Y1 = BAR_Y0 - LIFT_M * PX_M;              // straight arms overhead
const RACK_Y = FEET_Y - Math.round(0.69 * FIG_H);   // bar on the top of the chest, below the chin
const ARM_L = 0.25 * FIG_H;                         // upper arm = forearm to the grip
const BAR_HALF = Math.round(1.1 * PX_M), GRIP = 64;
const ARROW_X = 476;
const DELAY = 0.5;

// Lift phases on u = lift time / 5 s: grip, pull to the shoulders, hold, press, hold.
function barAt(u) {
  if (u <= 0.06) return BAR_Y0;
  if (u <= 0.44) return BAR_Y0 + (RACK_Y - BAR_Y0) * inOutSine((u - 0.06) / 0.38);
  if (u <= 0.54) return RACK_Y;
  if (u <= 0.9) return RACK_Y + (BAR_Y1 - RACK_Y) * inOutSine((u - 0.54) / 0.36);
  return BAR_Y1;
}

const BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];

export class WeightlifterPowerScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static CONTINUOUS = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A weightlifter lifts a 75 kg barbell from the floor to straight arms above her head. A clock counts 5 seconds while the bar rises 2 m, shown by a dashed arrow beside it. The work counts up to 1500 J, and at 5 s the power, 300 W, appears.';

  enter() { this.liftT = 0; }

  get endT() { return DELAY + LIFT_S + 0.2; }

  pointerDown() { this.liftT = 0; this.animateFor(this.endT * 1000 + 300); }

  update(d) { this.liftT = Math.min(this.endT, (this.liftT ?? 0) + d); }

  busy() { return (this.liftT ?? 0) < this.endT; }

  get secs() { return clamp01(((this.liftT ?? 0) - DELAY) / LIFT_S) * LIFT_S; }

  draw(ctx, c) {
    const u = this.secs / LIFT_S;
    const barY = barAt(u);
    drawBackdrop(ctx, c, 'plain');
    this.gym(ctx, c);
    this.lifter(ctx, c, barY, u);
    this.height(ctx, c, barY);
    this.readouts(ctx, c, barY);
  }

  gym(ctx, c) {
    const wallCol = mix(c.bgSurface, c.label, 0.06);
    ctx.save();
    ctx.fillStyle = wallCol;
    ctx.fillRect(0, 0, W, GROUND);
    // wall panels with a shade edge each
    for (let x = 0; x < W; x += 120) {
      ctx.fillStyle = darken(wallCol, 0.05);
      ctx.fillRect(x + 112, 0, 8, GROUND - 90);
      ctx.fillStyle = lighten(wallCol, 0.18);
      ctx.fillRect(x + 2, 0, 3, GROUND - 90);
    }
    ctx.fillStyle = mix(c.bgSurface, c.s5, 0.14);
    ctx.fillRect(0, GROUND - 90, W, 90);
    ctx.fillStyle = darken(wallCol, 0.14);
    ctx.fillRect(0, GROUND - 92, W, 3);
    ctx.restore();
    drawFloor(ctx, c, GROUND, { seams: true });
    // the lifting platform: wood centre, rubber sides, a lit front edge
    const px0 = CX - 230, pw = 460;
    drawShadow(ctx, c, CX, GROUND + 8, pw * 0.52, 8, 0.6);
    const rub = darken(mix(c.bgDeep, c.label, 0.2), 0.2);
    rr(ctx, px0, GROUND - 4, pw, 14, 4);
    ctx.fillStyle = rub;
    ctx.fill();
    ctx.fillStyle = mix(c.gold, c.bgSurface, 0.25);
    ctx.fillRect(CX - 110, GROUND - 4, 220, 14);
    ctx.fillStyle = lighten(mix(c.gold, c.bgSurface, 0.25), 0.25);
    ctx.fillRect(CX - 110, GROUND - 4, 220, 3);
    ctx.fillStyle = darken(mix(c.gold, c.bgSurface, 0.25), 0.2);
    for (let x = CX - 110 + 44; x < CX + 110; x += 44) ctx.fillRect(x, GROUND - 1, 2, 11);
  }

  lifter(ctx, c, barY, u) {
    const working = u > 0.02 && u < 0.98;
    const low = clamp01((barY - RACK_Y) / (BAR_Y0 - RACK_Y));    // 1 at the floor, 0 at the shoulders
    // Floor: hips back and down so the arms hang straight to the bar; a short dip before the press.
    const dip = u > 0.5 && u < 0.62 ? 0.12 * Math.sin(Math.PI * (u - 0.5) / 0.12) : 0;
    const pose = { name: 'stand', crouch: 0.55 * low + dip, toe: 0 };
    const hands = [{ x: CX + GRIP, y: barY }, { x: CX - GRIP, y: barY }];
    const spec = figureFor(this, {
      role: 'adult', pose, x: CX, y: FEET_Y, height: FIG_H, facing: 0, i: 1,
      look: { hairStyle: 'bun', outfit: 'tee', bottomStyle: 'trousers', mood: working ? 'effort' : 'smile' },
    });
    const sk = solveFigure(spec);   // solved without grips (the kit's short arms would miss the bar)
    sk.grip = [true, true];
    sk.joints.arms = sk.joints.arms.map((a, i) => this.arm(a.shoulder, hands[i], i ? -1 : 1));
    sk.anchors.hand = sk.joints.arms.map((a) => a.hand);
    sk.anchors.elbow = sk.joints.arms.map((a) => a.elbow);
    const L = figureLook(c, spec.look);
    paintFigure(ctx, c, sk, L, { layer: 'back' });
    paintFigure(ctx, c, sk, L, { layer: 'mid' });
    this.barbell(ctx, c, barY);
    paintFigure(ctx, c, sk, L, { layer: 'front' });
  }

  // An adult-length arm from the kit shoulder to the grip, elbow out from the body.
  // A grip close to the shoulder (the rack) means the elbows point at the viewer:
  // both bones are foreshortened, as the kit does head-on.
  arm(s, g, out) {
    const d = Math.hypot(g.x - s.x, g.y - s.y);
    const sc = g.y > s.y - 4 ? Math.min(1, Math.max(0.32, d / (1.9 * ARM_L))) : 1;
    const l = ARM_L * sc;
    const a = ik2(s.x, s.y, g.x, g.y, l, l, 1, { maxK: 0.995, minK: 0.2 });
    const b = ik2(s.x, s.y, g.x, g.y, l, l, -1, { maxK: 0.995, minK: 0.2 });
    const score = (j) => out * (j.jx - s.x) + 0.5 * (j.jy - s.y);
    const r = score(b) > score(a) ? b : a;
    return { shoulder: s, elbow: { x: r.jx, y: r.jy }, hand: { x: r.ex, y: r.ey } };
  }

  barbell(ctx, c, y) {
    const steel = mix(c.stroke, c.label, 0.35);
    ctx.save();
    // the bar: a light top line and a shade underside
    rr(ctx, CX - BAR_HALF, y - 5, BAR_HALF * 2, 10, 5);
    ctx.fillStyle = steel;
    ctx.fill();
    ctx.fillStyle = lighten(steel, 0.35);
    ctx.fillRect(CX - BAR_HALF + 4, y - 4, BAR_HALF * 2 - 8, 2);
    ctx.fillStyle = darken(steel, 0.25);
    ctx.fillRect(CX - BAR_HALF + 4, y + 2, BAR_HALF * 2 - 8, 2);
    // knurled grip marks
    ctx.fillStyle = alpha(darken(steel, 0.4), 0.6);
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) ctx.fillRect(CX + s * (GRIP - 14 + k * 5), y - 4, 1.5, 8);
    // plates, edge-on: one big, one middle, one small, then the collar
    for (const s of [-1, 1]) {
      let x = CX + s * 132;
      ctx.fillStyle = darken(steel, 0.1);
      rr(ctx, x - 5, y - 11, 10, 22, 3);
      ctx.fill();
      x += s * 10;
      for (const [w, r, tone] of [[18, PLATE_R, c.s1], [14, PLATE_R * 0.8, c.s6], [10, PLATE_R * 0.58, c.s3]]) {
        const x0 = s > 0 ? x : x - w;
        rr(ctx, x0, y - r, w, 2 * r, 4);
        ctx.fillStyle = tone;
        ctx.fill();
        ctx.fillStyle = lighten(tone, 0.3);
        ctx.fillRect(x0 + 2, y - r + 4, 4, 2 * r - 8);
        ctx.fillStyle = darken(tone, 0.25);
        ctx.fillRect(x0 + w - 5, y - r + 4, 3, 2 * r - 8);
        ctx.strokeStyle = darken(tone, 0.4);
        ctx.lineWidth = 1.5;
        rr(ctx, x0, y - r, w, 2 * r, 4);
        ctx.stroke();
        x += s * (w + 1);
      }
    }
    ctx.restore();
  }

  height(ctx, c, barY) {
    ctx.save();
    // the start level and the 2 m level, carried out from the bar to the arrow
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = alpha(c.label, 0.45);
    ctx.beginPath();
    ctx.moveTo(CX + BAR_HALF + 4, BAR_Y0); ctx.lineTo(ARROW_X + 14, BAR_Y0);
    ctx.stroke();
    ctx.strokeStyle = alpha(c.gold, 0.85);
    ctx.beginPath();
    ctx.moveTo(CX + BAR_HALF + 4, BAR_Y1); ctx.lineTo(ARROW_X + 14, BAR_Y1);
    ctx.stroke();
    // h: dashed, from the start level up to the bar now
    const len = BAR_Y0 - barY;
    if (len > 8) {
      ctx.strokeStyle = c.s2;
      ctx.fillStyle = c.s2;
      ctx.lineWidth = 4;
      ctx.setLineDash([9, 7]);
      ctx.beginPath();
      ctx.moveTo(ARROW_X, BAR_Y0); ctx.lineTo(ARROW_X, barY + 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(ARROW_X, barY); ctx.lineTo(ARROW_X - 8, barY + 14); ctx.lineTo(ARROW_X + 8, barY + 14);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    const m = Math.round((len / PX_M) * 10) / 10;
    pill(ctx, c, `h = ${m >= LIFT_M ? LIFT_M : m.toFixed(1)} m`, ARROW_X + 74, (BAR_Y0 + barY) / 2, { bg: c.s2, size: 24, alpha: clamp01(len / 30) });
    // the mass rides with the bar, off the left plates
    pill(ctx, c, `${MASS} kg`, CX - BAR_HALF + 14, barY + PLATE_R + 26, { bg: c.s1, size: 24 });
  }

  readouts(ctx, c, barY) {
    const s = this.secs;
    const done = s >= LIFT_S - 1e-6;
    pill(ctx, c, `t = ${done ? LIFT_S : s.toFixed(1)} s`, 582, 40, { bg: done ? c.s5 : c.bgSurface, ink: done ? undefined : c.label, size: 28 });
    const w = Math.round((MASS * G * ((BAR_Y0 - barY) / PX_M)) / 10) * 10;
    drawWorkCounter(ctx, c, { x: 582, y: 104, text: `W = ${done ? WORK : w} J`, size: 24 });
    if (done) {
      const k = clamp01(((this.liftT ?? 0) - DELAY - LIFT_S) / 0.2);
      drawWorkCounter(ctx, c, { x: 582, y: 168, text: `P = ${POWER} W`, tone: 'good', size: 28, alpha: k });
    }
  }
}
