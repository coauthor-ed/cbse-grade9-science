import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, font, inOutSine, clamp01,
  mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawStairs } from 'simulations/base/kit/SimApparatus.js';

// HeightOnlyScene - blk-l04-s09, Lift or Stairs (book Revise Q5).
// b0: one building, two ways up from the same student: a straight lift path
//     and a zig-zag stair path, traced together so the stair path is seen to
//     be much longer for the same top.
// b1: the lift ride. The U bar beside the shaft rises with the car, to
//     mgh = 50 x 10 x 72.5 = 36 250 J. The stair slot stays empty with a "?":
//     the next question asks it.

const G = 10, MASS = 50, HEIGHT_M = 72.5;
const U_TOP = MASS * G * HEIGHT_M;            // 36 250 J
const GROUND = 452;
const STOREY = 56, N_ST = 6;
const TOP_Y = GROUND - N_ST * STOREY;          // 116, the top floor
const ROOF_Y = TOP_Y - 70;                     // 46, the machine room roof
const BX0 = 128, BX1 = 468, WALL = 10;
const SHAFT_X0 = 140, SHAFT_X1 = 228;
const LIFT_X = (SHAFT_X0 + SHAFT_X1) / 2;      // 184
const PARTY_X1 = 238;
const STAIR_L = 306, STAIR_N = 7, STAIR_RUN = 19;
const STAIR_R = STAIR_L + STAIR_N * STAIR_RUN; // 439
const STUDENT_X = 250;
const CAR_W = 74, CAR_H = 66;
const FIG_H = 56;
const BRACKET_X = 600;
// Bar panels: the fill top meets the top floor line when full, and the fill
// foot sits on the ground line (kit geometry: fill top = y + 27, foot = y + 21 + h).
const BAR_H = GROUND + 3 - 24 - 89;            // 342
const BAR_Y = 89;
const LIFT_BAR_X = 20, STAIR_BAR_X = 484, BAR_PANEL_W = 78;

const TRACE_S = 1.6;   // b0: both paths drawn in together
const RIDE_S = 2.4;    // b1: the lift ride

const STAIR_PATH = (() => {
  const pts = [[STUDENT_X, GROUND], [STAIR_L, GROUND]];
  for (let i = 0; i < N_ST; i++) pts.push([i % 2 === 0 ? STAIR_R : STAIR_L, GROUND - (i + 1) * STOREY]);
  return pts;
})();
const LIFT_PATH = [[STUDENT_X, GROUND], [LIFT_X, GROUND], [LIFT_X, TOP_Y]];

function pathLen(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}
// Stroke the first u (0..1) of a polyline; returns the tip and its heading.
function strokePart(ctx, pts, u) {
  const total = pathLen(pts);
  let left = total * clamp01(u);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  let tip = { x: pts[0][0], y: pts[0][1], ang: 0 };
  for (let i = 1; i < pts.length && left > 0; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const seg = Math.hypot(bx - ax, by - ay);
    const k = Math.min(1, left / seg);
    tip = { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, ang: Math.atan2(by - ay, bx - ax) };
    ctx.lineTo(tip.x, tip.y);
    left -= seg;
  }
  ctx.stroke();
  return tip;
}
function fmtJ(v) {
  const n = Math.round(v / 50) * 50;
  const s = String(n);
  return (s.length > 3 ? s.slice(0, -3) + ' ' + s.slice(-3) : s) + ' J';
}

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class HeightOnlyScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A building 72.5 m tall, cut open: a lift shaft on the left and a zig-zag staircase on the right. A student of mass 50 kg stands at the bottom. The lift path is one straight line up; the stair path zig-zags and is much longer. Then the student rides the lift to the top and a potential energy bar beside the shaft rises to 36 250 J; the bar beside the stairs is empty, with a question mark.';

  enter() {
    this.motionT = 0;   // seconds into this beat's one animation
  }

  get rideBeat() { return this.stage >= 1; }

  pointerDown() {
    this.motionT = 0;   // tap: play the beat again
    this.animateFor(800);
  }

  get motionEnd() { return (this.rideBeat ? RIDE_S : TRACE_S) + 0.1; }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  get traceU() { return this.rideBeat ? 1 : inOutSine(clamp01((this.motionT ?? 0) / TRACE_S)); }
  get rideU() { return this.rideBeat ? inOutSine(clamp01((this.motionT ?? 0) / RIDE_S)) : 0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'sky');
    drawFloor(ctx, c, GROUND, { seams: true });
    this.building(ctx, c);
    this.shaft(ctx, c);
    this.stairBay(ctx, c);
    this.paths(ctx, c);
    this.people(ctx, c);
    this.bracket(ctx, c);
    if (this.rideBeat) this.bars(ctx, c);
    this.names(ctx, c);
  }

  building(ctx, c) {
    const body = mix(c.bgSurface, c.label, 0.1);
    const cut = darken(mix(c.bgSurface, c.label, 0.06), 0.22);
    ctx.save();
    drawShadow(ctx, c, (BX0 + BX1) / 2, GROUND + 2, (BX1 - BX0) * 0.56, 9, 0.8);
    rr(ctx, BX0, ROOF_Y, BX1 - BX0, GROUND - ROOF_Y, 6);
    ctx.fillStyle = body;
    ctx.fill();
    // light side (left strip) and shade side (right strip) of the outer wall
    ctx.fillStyle = lighten(body, 0.22);
    ctx.fillRect(BX0 + 2, ROOF_Y + 4, 4, GROUND - ROOF_Y - 6);
    ctx.fillStyle = darken(body, 0.2);
    ctx.fillRect(BX1 - WALL + 2, ROOF_Y + 4, WALL - 4, GROUND - ROOF_Y - 6);
    // the cut interior
    ctx.fillStyle = cut;
    ctx.fillRect(BX0 + WALL, ROOF_Y + 8, BX1 - BX0 - 2 * WALL, GROUND - ROOF_Y - 8);
    // machine room band under the roof
    ctx.fillStyle = darken(body, 0.12);
    ctx.fillRect(BX0 + WALL, ROOF_Y + 8, BX1 - BX0 - 2 * WALL, TOP_Y - ROOF_Y - 14);
    // roof lip, parapet and a water tank: a real roofline
    ctx.fillStyle = lighten(body, 0.16);
    ctx.fillRect(BX0 - 4, ROOF_Y - 2, BX1 - BX0 + 8, 8);
    ctx.fillStyle = darken(body, 0.28);
    ctx.fillRect(BX0 - 4, ROOF_Y + 5, BX1 - BX0 + 8, 2);
    const tx = 360, tw = 64, ty = ROOF_Y - 26;
    ctx.fillStyle = darken(body, 0.1);
    ctx.fillRect(tx + 8, ty + 18, 4, 8);
    ctx.fillRect(tx + tw - 12, ty + 18, 4, 8);
    rr(ctx, tx, ty, tw, 20, 5);
    ctx.fillStyle = mix(c.s6, c.bgSurface, 0.35);
    ctx.fill();
    ctx.fillStyle = darken(mix(c.s6, c.bgSurface, 0.35), 0.18);
    ctx.fillRect(tx + tw * 0.66, ty + 2, tw * 0.3, 16);
    ctx.fillStyle = lighten(mix(c.s6, c.bgSurface, 0.35), 0.3);
    ctx.fillRect(tx + 4, ty + 4, tw * 0.5, 3);
    // the party wall between shaft and stairs, open at the ground floor
    ctx.fillStyle = lighten(body, 0.06);
    ctx.fillRect(SHAFT_X1, ROOF_Y + 8, PARTY_X1 - SHAFT_X1, GROUND - STOREY - ROOF_Y - 8);
    ctx.fillStyle = darken(body, 0.16);
    ctx.fillRect(PARTY_X1 - 3, ROOF_Y + 8, 3, GROUND - STOREY - ROOF_Y - 8);
    // floor slab ends at each storey on both walls of the stair bay
    for (let i = 1; i <= N_ST; i++) {
      const y = GROUND - i * STOREY;
      ctx.fillStyle = lighten(body, 0.12);
      ctx.fillRect(PARTY_X1, y - 2, 22, 6);
      ctx.fillRect(BX1 - WALL - 14, y - 2, 14, 6);
      ctx.fillStyle = darken(body, 0.22);
      ctx.fillRect(PARTY_X1, y + 4, 22, 2);
      ctx.fillRect(BX1 - WALL - 14, y + 4, 14, 2);
    }
    // the top floor line, carried out to the height bracket
    ctx.strokeStyle = c.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(BX0 + WALL, TOP_Y);
    ctx.lineTo(BX1 - WALL, TOP_Y);
    ctx.stroke();
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = alpha(c.gold, 0.7);
    ctx.beginPath();
    ctx.moveTo(BX1, TOP_Y);
    ctx.lineTo(BRACKET_X + 10, TOP_Y);
    ctx.stroke();
    ctx.restore();
  }

  shaft(ctx, c) {
    const y = GROUND - this.rideU * (GROUND - TOP_Y);
    const sx = SHAFT_X0 + 2, sw = SHAFT_X1 - SHAFT_X0 - 4;
    ctx.save();
    ctx.fillStyle = darken(mix(c.bgDeep, c.label, 0.08), 0.28);
    ctx.fillRect(sx, ROOF_Y + 10, sw, GROUND - ROOF_Y - 10);
    // guide rails
    ctx.strokeStyle = alpha(c.stroke, 0.9);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx + 5, ROOF_Y + 10); ctx.lineTo(sx + 5, GROUND);
    ctx.moveTo(sx + sw - 5, ROOF_Y + 10); ctx.lineTo(sx + sw - 5, GROUND);
    ctx.stroke();
    // landing doors, one per storey
    for (let i = 1; i <= N_ST; i++) {
      const fy = GROUND - i * STOREY;
      ctx.fillStyle = alpha(c.s1, 0.2);
      ctx.fillRect(sx + 14, fy - 40, sw - 28, 38);
      ctx.fillStyle = alpha(c.s1, 0.4);
      ctx.fillRect(sx + sw / 2 - 1, fy - 40, 2, 38);
      ctx.fillStyle = lighten(mix(c.bgSurface, c.label, 0.1), 0.12);
      ctx.fillRect(sx, fy - 2, sw, 4);
    }
    // the winding machine and cable
    ctx.fillStyle = darken(c.bgSurface, 0.3);
    rr(ctx, LIFT_X - 26, ROOF_Y + 12, 52, 20, 5);
    ctx.fill();
    ctx.fillStyle = lighten(darken(c.bgSurface, 0.3), 0.2);
    ctx.fillRect(LIFT_X - 22, ROOF_Y + 15, 30, 4);
    ctx.strokeStyle = alpha(c.labelMuted, 0.85);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(LIFT_X, ROOF_Y + 32);
    ctx.lineTo(LIFT_X, y - CAR_H);
    ctx.stroke();
    // the car: light side, shade side, an inner line
    const x0 = LIFT_X - CAR_W / 2, y0 = y - CAR_H;
    rr(ctx, x0, y0, CAR_W, CAR_H, 8);
    ctx.fillStyle = c.s1;
    ctx.fill();
    ctx.fillStyle = mix(c.s1, c.bgDeep, 0.55);
    ctx.fillRect(x0 + 8, y0 + 8, CAR_W - 16, CAR_H - 14);
    ctx.fillStyle = darken(c.s1, 0.24);
    ctx.fillRect(x0 + CAR_W - 14, y0 + 4, 10, CAR_H - 8);
    ctx.fillStyle = lighten(c.s1, 0.35);
    ctx.fillRect(x0 + 4, y0 + 3, CAR_W - 18, 4);
    ctx.strokeStyle = darken(c.s1, 0.4);
    ctx.lineWidth = 2;
    rr(ctx, x0, y0, CAR_W, CAR_H, 8);
    ctx.stroke();
    ctx.restore();
  }

  stairBay(ctx, c) {
    for (let i = 0; i < N_ST; i++) {
      const up = i % 2 === 0;
      drawStairs(ctx, c, {
        x: up ? STAIR_L : STAIR_R, y: GROUND - i * STOREY, n: STAIR_N,
        rise: STOREY / STAIR_N, run: STAIR_RUN, dir: up ? 1 : -1, rail: false,
      });
    }
  }

  paths(ctx, c) {
    const u = this.traceU;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    // stair path first, under; dimmed once the beat is about the lift
    ctx.globalAlpha = this.rideBeat ? 0.4 : 0.95;
    ctx.strokeStyle = c.s4;
    const lift = (pts) => pts.map(([x, y]) => [x, y - 10]);
    const ts = strokePart(ctx, lift(STAIR_PATH), u);
    this.head(ctx, ts, c.s4);
    ctx.globalAlpha = this.rideBeat ? 0.55 : 0.95;
    ctx.strokeStyle = c.s1;
    const tl = strokePart(ctx, [[STUDENT_X, GROUND - 10], [LIFT_X, GROUND - 10], [LIFT_X, TOP_Y - 10]], u);
    this.head(ctx, tl, c.s1);
    ctx.restore();
  }

  head(ctx, tip, col) {
    const a = tip.ang, s = 14;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(tip.x + Math.cos(a) * 6, tip.y + Math.sin(a) * 6);
    ctx.lineTo(tip.x - Math.cos(a - 0.55) * s, tip.y - Math.sin(a - 0.55) * s);
    ctx.lineTo(tip.x - Math.cos(a + 0.55) * s, tip.y - Math.sin(a + 0.55) * s);
    ctx.closePath();
    ctx.fill();
  }

  people(ctx, c) {
    const inCar = this.rideBeat;
    const y = inCar ? GROUND - this.rideU * (GROUND - TOP_Y) : GROUND;
    const x = inCar ? LIFT_X : STUDENT_X;
    const spec = figureFor(this, { role: 'student', pose: 'stand', x, y: y - (inCar ? 4 : 0), height: FIG_H, facing: 0 });
    drawFigure(ctx, c, spec, spec.look);
    // the mass, once, with the student
    const py = inCar ? Math.min(y - CAR_H - 18, ROOF_Y - 20) : y - FIG_H - 22;
    pill(ctx, c, `${MASS} kg`, inCar ? x : x - 6, inCar ? ROOF_Y - 22 : py, { bg: c.s2, size: 24 });
  }

  bracket(ctx, c) {
    const x = BRACKET_X;
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, GROUND); ctx.lineTo(x, TOP_Y);
    ctx.moveTo(x - 10, GROUND); ctx.lineTo(x + 10, GROUND);
    ctx.moveTo(x - 10, TOP_Y); ctx.lineTo(x + 10, TOP_Y);
    ctx.stroke();
    for (const [yy, dir] of [[TOP_Y, 1], [GROUND, -1]]) {
      ctx.fillStyle = c.label;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x - 7, yy + dir * 13);
      ctx.lineTo(x + 7, yy + dir * 13);
      ctx.closePath();
      ctx.fill();
    }
    ctx.translate(x + 30, (GROUND + TOP_Y) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = font(c, 800, 26, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.label;
    ctx.fillText(`${HEIGHT_M} m`, 0, 0);
    ctx.restore();
  }

  bars(ctx, c) {
    const u = this.rideU;
    const fade = clamp01((this.motionT ?? 0) / 0.4);
    const one = (id) => [{ id, label: 'U', tone: 3 }];
    drawEnergyBars(ctx, c, { x: LIFT_BAR_X, y: BAR_Y, h: BAR_H, max: U_TOP, bars: one('lift'), values: { lift: U_TOP * u }, alpha: fade, size: 24 });
    drawEnergyBars(ctx, c, { x: STAIR_BAR_X, y: BAR_Y, h: BAR_H, max: U_TOP, bars: one('stairs'), values: { stairs: 0 }, alpha: fade, size: 24 });
    ctx.save();
    ctx.globalAlpha = fade;
    // the bar top and the car floor are at one level: a dashed tie between them
    const fy = GROUND - u * (GROUND - TOP_Y);
    ctx.strokeStyle = alpha(c.s3, 0.9);
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(LIFT_BAR_X + BAR_PANEL_W, fy);
    ctx.lineTo(SHAFT_X0, fy);
    ctx.stroke();
    ctx.setLineDash([]);
    // the empty stair slot asks the question
    ctx.font = font(c, 800, 54, true);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.s4;
    ctx.fillText('?', STAIR_BAR_X + BAR_PANEL_W / 2, (GROUND + TOP_Y) / 2);
    ctx.restore();
    pill(ctx, c, fmtJ(U_TOP * u), LIFT_BAR_X + BAR_PANEL_W / 2 + 6, BAR_Y - 20, { bg: c.s3, size: 24, alpha: fade });
  }

  names(ctx, c) {
    pill(ctx, c, 'lift', LIFT_X, GROUND + 34, { bg: c.s1, size: 24 });
    pill(ctx, c, 'stairs', (STAIR_L + STAIR_R) / 2 + 10, GROUND + 34, { bg: c.s4, size: 24 });
  }
}
