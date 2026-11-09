import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, clamp01, outBack, inOutSine,
  mix, alpha, lighten, darken, rr, vectorArrow, ellipse,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawPulley } from 'simulations/base/kit/SimProps.js';
import { drawCrate, displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// PulleySystemScene - blk-l07-s05, Movable Pulleys (book Fig 7.25).
// One rope: tied to the ceiling, down and under a movable pulley that carries
// the load, up and over a fixed pulley, down to the student's hands.
// b0: the student pulls in two strokes; the load and its pulley rise. The
//     three parts are named: fixed end, movable pulley, fixed pulley.
// b1: the result at rest, measured: a tape mark on the free rope has come
//     down 2 m while the load went up 1 m (1 m = 80 px, so the arrows are 2:1).
//     Forces: the load arrow down; two equal arrows up, one in each rope part
//     holding the movable pulley; the effort arrow at the hands is half the
//     load arrow.

const GROUND = 452;
const CEIL_Y = 40;
const MP = { x: 246, r: 34 };                       // movable pulley
const FP = { r: 40, y: CEIL_Y + 54 };               // fixed pulley (kit bracket r + 14 above)
FP.x = MP.x + MP.r + FP.r;                          // 320: the rope between them hangs straight
const END_X = MP.x - MP.r;                          // 212: the fixed end and the left rope part
const MID_X = MP.x + MP.r;                          // 280: the right rope part
const FREE_X = FP.x + FP.r;                         // 360: the free end she pulls
const PX_M = 80;                                    // 1 m of rope or of lift
const PULL = 2 * PX_M, RISE = PX_M;
const CRATE_W = 76, CRATE_H = 66, HANG = 42;        // hanger from pulley centre to crate top
const MP_Y0 = GROUND - CRATE_H - HANG;              // 344: crate on the ground
const FIG_H = 160;
const HAND_Y0 = GROUND - 172, STROKE = PULL / 2;    // one stroke brings the hands down 80 px
const MARK_Y0 = FP.y + FP.r + 8;                    // the tape mark on the free rope, at the start
const LOAD_LEN = 104, PART_LEN = LOAD_LEN / 2;

// two strokes: down, hands back up, down
const S_DOWN = 0.75, S_BACK = 0.4;
const T_END = 0.2 + 2 * S_DOWN + S_BACK;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class PulleySystemScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'One rope is tied to the ceiling, runs down and under a movable pulley that carries a load, then up and over a pulley fixed to the ceiling, and down to a student\'s hands. The student pulls the rope in two strokes and the load rises with its pulley. Then the result is measured: a mark on the rope has come down 2 m while the load went up 1 m. Two rope parts hold the movable pulley, each with an equal upward arrow, and the effort arrow at the hands is half as long as the load arrow.';

  enter() {
    this.motionT = 0;
  }

  get measureBeat() { return this.stage >= 1; }
  get motionEnd() { return (this.measureBeat ? 2.2 : T_END + 0.4) + 0.1; }

  pointerDown() {
    this.motionT = 0;   // tap: play the beat again
    this.animateFor(600);
  }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }
  prog(t0, dt) { return clamp01(((this.motionT ?? 0) - t0) / dt); }

  // rope pulled in (px) and the hands' drop below HAND_Y0 (px)
  get pullState() {
    if (this.measureBeat) return { pulled: PULL, hand: STROKE };
    const a = inOutSine(this.prog(0.2, S_DOWN));
    const back = inOutSine(this.prog(0.2 + S_DOWN, S_BACK));
    const b = inOutSine(this.prog(0.2 + S_DOWN + S_BACK, S_DOWN));
    return { pulled: STROKE * (a + b), hand: STROKE * (a - back + b) };
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'grid');
    drawFloor(ctx, c, GROUND, { seams: true });
    const { pulled, hand } = this.pullState;
    const rise = pulled / 2;
    const my = MP_Y0 - rise;
    const spec = this.studentSpec(HAND_Y0 + hand);
    const grip = solveFigure(spec).anchors.hand[0];
    this.ceiling(ctx, c);
    if (this.measureBeat) this.ghosts(ctx, c);
    this.rope(ctx, c, my, grip, pulled);
    this.load(ctx, c, my, rise);
    drawFigure(ctx, c, spec, spec.look);
    this.freeTail(ctx, c, grip, pulled);
    if (this.measureBeat) this.measures(ctx, c, my, grip);
    else this.names(ctx, c, my);
  }

  ceiling(ctx, c) {
    const slab = mix(c.bgSurface, c.label, 0.2);
    ctx.save();
    ctx.fillStyle = slab;
    ctx.fillRect(0, 0, W, CEIL_Y);
    ctx.fillStyle = darken(slab, 0.22);
    ctx.fillRect(0, CEIL_Y - 7, W, 7);
    ctx.fillStyle = lighten(slab, 0.2);
    ctx.fillRect(0, 4, W, 3);
    // a steel beam under the slab: the rigid support
    const steel = mix(c.bgSurface, c.label, 0.34);
    rr(ctx, 120, CEIL_Y - 4, 360, 14, 3);
    ctx.fillStyle = steel;
    ctx.fill();
    ctx.fillStyle = lighten(steel, 0.25);
    ctx.fillRect(124, CEIL_Y - 2, 352, 3);
    ctx.fillStyle = darken(steel, 0.3);
    ctx.fillRect(124, CEIL_Y + 6, 352, 3);
    ctx.fillStyle = darken(steel, 0.42);
    for (const x of [134, 466]) { ctx.beginPath(); ctx.arc(x, CEIL_Y + 3, 3, 0, Math.PI * 2); ctx.fill(); }
    // the eye bolt that holds the fixed end
    ctx.strokeStyle = darken(steel, 0.2);
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(END_X, CEIL_Y + 18, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = darken(steel, 0.2);
    ctx.fillRect(END_X - 2, CEIL_Y + 8, 4, 5);
    ctx.restore();
  }

  ropeLine(ctx, c, x1, y1, x2, y2) {
    const rope = mix(c.gold, c.labelMuted, 0.35);
    ctx.strokeStyle = darken(rope, 0.35); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = rope; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  rope(ctx, c, my, grip, pulled) {
    const rope = mix(c.gold, c.labelMuted, 0.35);
    ctx.save();
    ctx.lineCap = 'round';
    // the two parts that hold the movable pulley, glowing in b1
    if (this.measureBeat) {
      const g = this.prog(0.9, 0.4);
      ctx.strokeStyle = alpha(c.s3, 0.45 * g);
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(END_X, CEIL_Y + 24); ctx.lineTo(END_X, my);
      ctx.moveTo(MID_X, FP.y + 6); ctx.lineTo(MID_X, my);
      ctx.stroke();
    }
    this.ropeLine(ctx, c, END_X, CEIL_Y + 24, END_X, my);
    this.ropeLine(ctx, c, MID_X, my, MID_X, FP.y);
    this.ropeLine(ctx, c, FREE_X, FP.y, grip.x, grip.y);
    ctx.strokeStyle = darken(rope, 0.35); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(MP.x, my, MP.r, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(FP.x, FP.y, FP.r, Math.PI, 0); ctx.stroke();
    // the tape mark on the free rope: it travels down with the rope
    const ym = MARK_Y0 + pulled * ((grip.y - FP.y) > 0 ? 1 : 0);
    const mx = FREE_X + (grip.x - FREE_X) * ((ym - FP.y) / Math.max(1, grip.y - FP.y));
    rr(ctx, mx - 6, ym - 6, 12, 12, 3);
    ctx.fillStyle = c.s2;
    ctx.fill();
    ctx.strokeStyle = darken(c.s2, 0.35); ctx.lineWidth = 2;
    rr(ctx, mx - 6, ym - 6, 12, 12, 3);
    ctx.stroke();
    ctx.restore();
    drawPulley(ctx, c, FP.x, FP.y, FP.r);
    this.spokes(ctx, c, FP.x, FP.y, FP.r, pulled / FP.r);
  }

  spokes(ctx, c, x, y, r, ang) {
    ctx.save();
    ctx.strokeStyle = darken(mix(c.bgSurface, c.label, 0.22), 0.3);
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = ang + (i * Math.PI * 2) / 3 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3);
      ctx.lineTo(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62);
      ctx.stroke();
    }
    ctx.restore();
  }

  load(ctx, c, my, rise) {
    const steel = mix(c.bgSurface, c.label, 0.3);
    const top = my + HANG, bottom = top + CRATE_H;
    // the movable pulley: kit pulley turned over, so its strap points down to the load
    ctx.save();
    ctx.translate(MP.x, my);
    ctx.rotate(Math.PI);
    drawPulley(ctx, c, 0, 0, MP.r);
    ctx.restore();
    // the light still comes from the top left: a highlight bean on the turned wheel
    ctx.save();
    ctx.fillStyle = alpha(lighten(steel, 0.45), 0.8);
    ellipse(ctx, MP.x - MP.r * 0.35, my - MP.r * 0.42, MP.r * 0.28, MP.r * 0.12, -0.7);
    ctx.fill();
    ctx.restore();
    this.spokes(ctx, c, MP.x, my, MP.r, -rise / MP.r);
    // hook and sling down to the crate
    ctx.save();
    ctx.strokeStyle = darken(steel, 0.25); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(MP.x, top - 12, 6, -Math.PI * 0.1, Math.PI * 1.1); ctx.stroke();
    ctx.strokeStyle = darken(mix(c.gold, c.labelMuted, 0.35), 0.3); ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(MP.x - CRATE_W / 2 + 8, top); ctx.lineTo(MP.x, top - 8); ctx.lineTo(MP.x + CRATE_W / 2 - 8, top);
    ctx.stroke();
    ctx.restore();
    if (rise > 2) drawShadow(ctx, c, MP.x, GROUND + 2, CRATE_W * 0.4, 4, 0.5);
    drawCrate(ctx, c, { x: MP.x, y: bottom, w: CRATE_W, h: CRATE_H, held: rise > 2 });
  }

  studentSpec(handY) {
    const hands = [{ x: FREE_X, y: handY }, { x: FREE_X + 1, y: handY + 18 }];
    return figureFor(this, {
      role: 'student', pose: { name: 'pull', lean: -10, crouch: 0 }, x: FREE_X + 34, y: GROUND, height: FIG_H, facing: -1,
      hands, look: { mood: 'effort' }, i: 1,
    });
  }

  // the pulled-in rope falls past her hands into a coil on the floor
  freeTail(ctx, c, grip, pulled) {
    const rope = mix(c.gold, c.labelMuted, 0.35);
    const px = FREE_X - 28;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = darken(rope, 0.35); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(grip.x, grip.y + 18); ctx.quadraticCurveTo(grip.x - 4, GROUND - 20, px, GROUND - 6); ctx.stroke();
    ctx.strokeStyle = rope; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(grip.x, grip.y + 18); ctx.quadraticCurveTo(grip.x - 4, GROUND - 20, px, GROUND - 6); ctx.stroke();
    const n = 1 + Math.round(pulled / 40);
    for (let i = 0; i < n; i++) {
      const rx = 16 + i * 2.5, yy = GROUND - 4 - i * 2.2;
      ctx.strokeStyle = darken(rope, 0.35); ctx.lineWidth = 4;
      ellipse(ctx, px, yy, rx, 5, 0); ctx.stroke();
      ctx.strokeStyle = rope; ctx.lineWidth = 2.2;
      ellipse(ctx, px, yy, rx, 5, 0); ctx.stroke();
    }
    ctx.restore();
  }

  names(ctx, c, my) {
    const k = this.prog(0.1, 0.4);
    if (k <= 0) return;
    const s = outBack(k);
    pill(ctx, c, 'fixed end', END_X - 92, CEIL_Y + 34, { bg: c.raised, ink: c.label, size: 22, scale: s });
    pill(ctx, c, 'movable pulley', MP.x - MP.r - 104, my, { bg: c.raised, ink: c.label, size: 22, scale: s });
    pill(ctx, c, 'fixed pulley', FP.x + FP.r + 86, FP.y, { bg: c.raised, ink: c.label, size: 22, scale: s });
  }

  // b1: where the mark and the load started, as outlines
  ghosts(ctx, c) {
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = alpha(c.labelMuted, 0.8);
    rr(ctx, MP.x - CRATE_W / 2, GROUND - CRATE_H, CRATE_W, CRATE_H, 6);
    ctx.stroke();
    rr(ctx, FREE_X - 6, MARK_Y0 - 6, 12, 12, 3);
    ctx.strokeStyle = c.s2;
    ctx.stroke();
    ctx.restore();
  }

  measures(ctx, c, my, grip) {
    // distances first (dashed): 2 m of rope down, 1 m of lift up
    const d = outBack(this.prog(0.1, 0.6));
    const ax = FP.x;
    const yEnd = MARK_Y0 + PULL;
    displacementArrow(ctx, c, ax, MARK_Y0, ax, MARK_Y0 + PULL * d, { tone: 2, width: 5, head: 14 });
    ctx.save();
    ctx.strokeStyle = alpha(c.s2, 0.8); ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax - 8, MARK_Y0); ctx.lineTo(FREE_X - 8, MARK_Y0);
    if (d > 0.95) { ctx.moveTo(ax - 8, yEnd); ctx.lineTo(FREE_X - 8, yEnd); }
    ctx.stroke();
    ctx.restore();
    const lx = MP.x - CRATE_W / 2 - 26;
    displacementArrow(ctx, c, lx, GROUND, lx, GROUND - RISE * d, { tone: 6, width: 5, head: 14 });
    const pk = this.prog(0.5, 0.35);
    if (pk > 0) {
      pill(ctx, c, '2 m', ax, MARK_Y0 + PULL / 2, { bg: c.s2, size: 26, scale: outBack(pk) });
      pill(ctx, c, '1 m', lx - 46, GROUND - RISE / 2, { bg: c.s6, size: 26, scale: outBack(pk) });
    }
    // forces (solid): load down, two equal parts up, effort half the load
    const f = (t0) => outBack(this.prog(t0, 0.45));
    const cy = my + HANG + CRATE_H / 2;
    const fl = f(0.9);
    if (fl > 0.01) {
      vectorArrow(ctx, c, MP.x, cy, { angle: Math.PI / 2, length: LOAD_LEN * fl, col: c.s6, width: 7, head: 16 });
      ctx.save(); ctx.beginPath(); ctx.arc(MP.x, cy, 6, 0, Math.PI * 2); ctx.fillStyle = c.s6; ctx.fill(); ctx.restore();
    }
    const fp = f(1.25);
    if (fp > 0.01) {
      for (const x of [END_X, MID_X]) {
        vectorArrow(ctx, c, x, my - MP.r - 14, { angle: -Math.PI / 2, length: PART_LEN * fp, col: c.s5, width: 7, head: 16 });
      }
    }
    const fe = f(1.6);
    if (fe > 0.01) vectorArrow(ctx, c, grip.x - 24, grip.y + 6, { angle: Math.PI / 2, length: PART_LEN * fe, col: c.s5, width: 7, head: 16 });
    const lk = this.prog(1.8, 0.35);
    if (lk > 0) {
      pill(ctx, c, 'load', MP.x - 70, GROUND + 34, { bg: c.s6, size: 24, scale: outBack(lk) });
      pill(ctx, c, 'effort', grip.x + 40, GROUND + 34, { bg: c.s5, size: 24, scale: outBack(lk) });
    }
  }
}
