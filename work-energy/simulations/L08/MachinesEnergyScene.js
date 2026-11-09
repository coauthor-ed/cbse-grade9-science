import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, inOutSine, clamp01, mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawLeverPlank, drawCrate } from 'simulations/base/kit/SimApparatus.js';

// MachinesEnergyScene - blk-l08-n01, Machines Do Not Create Energy.
// b0: a bicycle, side on. The pedals turn the chainring and the wheels turn;
//     the simple machines inside it light up in turn: the pedal crank on its
//     chainring and the back wheel on its hub (wheel and axle), and the brake
//     lever on the handlebar (lever).
// b1: a fixed pulley, a ramp and a lever, each lifting a crate. Under each, a
//     "W in" bar and a "W out" bar rise together as the machine works, and stop
//     at the same height (one dashed line across both tops): with no friction,
//     the work put in equals the work done on the load. Bar heights are
//     illustrative and equal in all three; no numbers are claimed.

const GROUND = 452;
const SPIN_S = 2.2, LIT_AT = [0.3, 0.9, 1.5], LIT_S = 0.5;
const WORK_S = 1.4;

// bicycle geometry
const RW = { x: 168, y: 352 }, FW = { x: 520, y: 352 }, WR = 96;
const BB = { x: 318, y: 366 };
const SEAT = { x: 290, y: 206 }, HEAD_T = { x: 462, y: 200 }, HEAD_B = { x: 476, y: 252 };
const CR = 36, SPR = 15, CRANK = 58;
const BRAKE = { x: 488, y: 160 };

// b1 columns
const COLS = [113, 340, 567];
const SHELF = 252;
const LIFT = 56;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

function metal(c) { return mix(c.bgSurface, c.label, 0.6); }

function tube(ctx, c, a, b, w, color) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = darken(color, 0.4); ctx.lineWidth = w + 3;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  const ang = Math.atan2(b.y - a.y, b.x - a.x), nx = -Math.sin(ang) * w * 0.22, ny = Math.cos(ang) * w * 0.22;
  ctx.strokeStyle = alpha(lighten(color, 0.45), 0.85); ctx.lineWidth = Math.max(1.5, w * 0.25);
  ctx.beginPath(); ctx.moveTo(a.x - nx, a.y - ny); ctx.lineTo(b.x - nx, b.y - ny); ctx.stroke();
  ctx.restore();
}

function glow(ctx, color, x, y, r, k) {
  if (k <= 0) return;
  ctx.save();
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, alpha(color, 0.55 * k));
  g.addColorStop(1, alpha(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function ringMark(ctx, color, x, y, r, k) {
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha *= k;
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = color; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function leaderLine(ctx, color, x1, y1, x2, y2, k) {
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha *= k;
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}

function arrow(ctx, color, x1, y1, x2, y2, w = 6) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 4) return;
  const a = Math.atan2(y2 - y1, x2 - x1), head = Math.min(15, len * 0.6);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(a) * head * 0.7, y2 - Math.sin(a) * head * 0.7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - 0.5), y2 - head * Math.sin(a - 0.5));
  ctx.lineTo(x2 - head * Math.cos(a + 0.5), y2 - head * Math.sin(a + 0.5));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

export class MachinesEnergyScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'First, a bicycle side on: the pedals turn and the wheels turn, and the simple machines in it light up one by one: the pedal crank and chainring and the back wheel on its hub are wheels and axles, the brake lever is a lever. Then a fixed pulley, a ramp and a lever each lift a crate; under each a work-in bar and a work-out bar rise together and stop at the same height.';

  enter() { this.motionT = 0; }

  get work() { return this.stage === 1; }

  pointerDown() {
    this.motionT = 0;
    this.animateFor(800);
  }

  get motionEnd() { return (this.work ? WORK_S + 0.4 : SPIN_S) + 0.1; }
  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    this.road(ctx, c);
    if (this.work) this.drawMachines(ctx, c);
    else this.drawBike(ctx, c);
  }

  road(ctx, c) {
    const top = mix(c.stroke, c.bgSurface, 0.55);
    ctx.save();
    ctx.fillStyle = top; ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = lighten(top, 0.25); ctx.fillRect(0, GROUND, W, 4);
    ctx.fillStyle = darken(top, 0.15); ctx.fillRect(0, GROUND + 30, W, H - GROUND - 30);
    ctx.restore();
  }

  // -- b0: the bicycle -----------------------------------------------------------

  drawBike(ctx, c) {
    const t = this.motionT ?? 0;
    const spin = inOutSine(clamp01(t / SPIN_S));
    const crankA = -0.6 + spin * Math.PI * 2;
    const wheelA = crankA * (CR / SPR) * 0.5;
    const lit = LIT_AT.map((a) => inOutSine(clamp01((t - a) / LIT_S)));
    const wa = c.s7, lev = c.s8;
    drawShadow(ctx, c, (RW.x + FW.x) / 2, GROUND + 2, 280, 10, 0.8);
    glow(ctx, wa, BB.x, BB.y, 90, lit[0]);
    glow(ctx, wa, RW.x, RW.y, 70, lit[1]);
    glow(ctx, lev, BRAKE.x + 10, BRAKE.y + 6, 60, lit[2]);
    this.wheel(ctx, c, RW, wheelA);
    this.wheel(ctx, c, FW, wheelA);
    this.frame(ctx, c);
    this.drive(ctx, c, crankA, wheelA, lit[0]);
    this.front(ctx, c, lit[2]);
    // the marks and names of the simple machines
    ringMark(ctx, wa, BB.x, BB.y, CRANK + 18, lit[0]);
    ringMark(ctx, wa, RW.x, RW.y, 30, lit[1]);
    ringMark(ctx, lev, BRAKE.x + 12, BRAKE.y + 8, 30, lit[2]);
    const tagY = 64;
    const kWA = Math.max(lit[0], lit[1]);
    leaderLine(ctx, wa, 250, tagY + 18, BB.x - 30, BB.y - CRANK - 10, lit[0]);
    leaderLine(ctx, wa, 210, tagY + 18, RW.x + 10, RW.y - 30, lit[1]);
    pill(ctx, c, 'wheel and axle', 230, tagY, { bg: wa, size: 23, alpha: kWA });
    leaderLine(ctx, lev, 560, tagY + 18, BRAKE.x + 22, BRAKE.y - 16, lit[2]);
    pill(ctx, c, 'lever', 570, tagY, { bg: lev, size: 23, alpha: lit[2] });
  }

  wheel(ctx, c, o, a) {
    const tyre = mix(c.label, c.bgDeep, 0.72);
    const steel = metal(c);
    ctx.save();
    ctx.beginPath(); ctx.arc(o.x, o.y, WR, 0, Math.PI * 2);
    ctx.strokeStyle = darken(tyre, 0.35); ctx.lineWidth = 17; ctx.stroke();
    ctx.strokeStyle = tyre; ctx.lineWidth = 13; ctx.stroke();
    ctx.beginPath(); ctx.arc(o.x, o.y, WR + 3, Math.PI * 1.05, Math.PI * 1.5);
    ctx.strokeStyle = alpha(lighten(tyre, 0.5), 0.5); ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(o.x, o.y, WR - 9, 0, Math.PI * 2);
    ctx.strokeStyle = steel; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = alpha(steel, 0.85); ctx.lineWidth = 1.6;
    for (let i = 0; i < 16; i++) {
      const s = a + i * Math.PI / 8;
      const h = (i % 2 ? 1 : -1) * 0.25;
      ctx.beginPath();
      ctx.moveTo(o.x + Math.cos(s + h) * 7, o.y + Math.sin(s + h) * 7);
      ctx.lineTo(o.x + Math.cos(s) * (WR - 10), o.y + Math.sin(s) * (WR - 10));
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(o.x, o.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = darken(steel, 0.1); ctx.fill();
    ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  frame(ctx, c) {
    const paint = c.s1;
    tube(ctx, c, BB, RW, 9, darken(paint, 0.05));
    tube(ctx, c, SEAT, RW, 8, darken(paint, 0.05));
    tube(ctx, c, BB, SEAT, 12, paint);
    tube(ctx, c, BB, HEAD_B, 13, paint);
    tube(ctx, c, SEAT, HEAD_T, 11, paint);
    tube(ctx, c, HEAD_T, HEAD_B, 15, lighten(paint, 0.05));
    tube(ctx, c, HEAD_B, FW, 9, metal(c));
    // seat post and saddle
    tube(ctx, c, SEAT, { x: SEAT.x - 8, y: SEAT.y - 28 }, 7, metal(c));
    const sd = mix(c.label, c.bgDeep, 0.7);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(SEAT.x - 44, SEAT.y - 36);
    ctx.quadraticCurveTo(SEAT.x - 10, SEAT.y - 48, SEAT.x + 24, SEAT.y - 36);
    ctx.quadraticCurveTo(SEAT.x - 6, SEAT.y - 24, SEAT.x - 44, SEAT.y - 30);
    ctx.closePath();
    ctx.fillStyle = sd; ctx.fill();
    ctx.strokeStyle = darken(sd, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = alpha(lighten(sd, 0.5), 0.6); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(SEAT.x - 36, SEAT.y - 38); ctx.quadraticCurveTo(SEAT.x - 10, SEAT.y - 45, SEAT.x + 14, SEAT.y - 38); ctx.stroke();
    ctx.restore();
  }

  drive(ctx, c, crankA, wheelA, k) {
    const steel = metal(c);
    // chain: two straight runs from chainring to the rear sprocket
    ctx.save();
    ctx.strokeStyle = darken(steel, 0.35); ctx.lineWidth = 4; ctx.setLineDash([5, 3]);
    ctx.lineDashOffset = -wheelA * SPR;
    ctx.beginPath();
    ctx.moveTo(BB.x, BB.y - CR); ctx.lineTo(RW.x, RW.y - SPR);
    ctx.moveTo(BB.x, BB.y + CR); ctx.lineTo(RW.x, RW.y + SPR);
    ctx.stroke();
    ctx.restore();
    // rear sprocket
    this.cog(ctx, c, RW, SPR, wheelA, 9);
    // chainring
    this.cog(ctx, c, BB, CR, crankA, 18);
    // crank arms and pedals
    for (const s of [0, Math.PI]) {
      const a = crankA + s;
      const p = { x: BB.x + Math.cos(a) * CRANK, y: BB.y + Math.sin(a) * CRANK };
      tube(ctx, c, BB, p, 10, s ? darken(steel, 0.2) : steel);
      ctx.save();
      rr(ctx, p.x - 18, p.y - 6, 36, 12, 3);
      ctx.fillStyle = mix(c.label, c.bgDeep, 0.65); ctx.fill();
      ctx.strokeStyle = darken(mix(c.label, c.bgDeep, 0.65), 0.4); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = alpha(lighten(c.label, 0.2), 0.3); ctx.fillRect(p.x - 15, p.y - 4, 30, 3);
      ctx.restore();
    }
    ctx.save();
    ctx.beginPath(); ctx.arc(BB.x, BB.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = darken(steel, 0.2); ctx.fill();
    ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  cog(ctx, c, o, r, a, n) {
    const steel = lighten(metal(c), 0.05);
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const s = a + i * Math.PI / n;
      const rr2 = i % 2 ? r - 4 : r + 2;
      const x = o.x + Math.cos(s) * rr2, y = o.y + Math.sin(s) * rr2;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = steel; ctx.fill();
    ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(o.x, o.y, r * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = darken(steel, 0.15); ctx.fill();
    ctx.beginPath(); ctx.arc(o.x, o.y, r * 0.62, Math.PI * 1.1, Math.PI * 1.6);
    ctx.strokeStyle = alpha(lighten(steel, 0.5), 0.8); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  // stem, handlebar, brake lever and its cable
  front(ctx, c, k) {
    const steel = metal(c);
    const stemTop = { x: HEAD_T.x - 6, y: HEAD_T.y - 34 };
    tube(ctx, c, HEAD_T, stemTop, 9, steel);
    const barEnd = { x: BRAKE.x + 26, y: BRAKE.y - 2 };
    tube(ctx, c, { x: stemTop.x - 12, y: stemTop.y + 2 }, barEnd, 9, steel);
    // grip
    tube(ctx, c, { x: barEnd.x - 18, y: barEnd.y - 1 }, { x: barEnd.x + 14, y: barEnd.y + 1 }, 13, mix(c.label, c.bgDeep, 0.65));
    // the brake lever: pivot on the bar, blade reaching forward under the grip; it squeezes in once lit
    const piv = { x: BRAKE.x - 4, y: BRAKE.y + 2 };
    const ang = 0.62 - 0.22 * k;
    const tip = { x: piv.x + Math.cos(ang) * 48, y: piv.y + Math.sin(ang) * 48 };
    tube(ctx, c, piv, tip, 7, lighten(steel, 0.1));
    ctx.save();
    ctx.beginPath(); ctx.arc(piv.x, piv.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = darken(steel, 0.2); ctx.fill();
    ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
    // cable down to the front brake
    ctx.strokeStyle = darken(steel, 0.45); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(piv.x - 4, piv.y + 4);
    ctx.bezierCurveTo(piv.x - 40, piv.y + 60, HEAD_B.x + 20, HEAD_B.y - 10, FW.x - 30, FW.y - WR + 10);
    ctx.stroke();
    ctx.restore();
  }

  // -- b1: three machines, equal work in and out ---------------------------------

  drawMachines(ctx, c) {
    const t = this.motionT ?? 0;
    const u = inOutSine(clamp01((t - 0.2) / WORK_S));
    const names = ['pulley', 'ramp', 'lever'];
    for (let i = 0; i < 3; i++) {
      const cx = COLS[i];
      if (i === 0) this.pulley(ctx, c, cx, u);
      else if (i === 1) this.ramp(ctx, c, cx, u);
      else this.lever(ctx, c, cx, u);
      pill(ctx, c, names[i], cx, SHELF + 26, { bg: c.stroke, size: 22 });
      const v = u;
      drawEnergyBars(ctx, c, {
        x: cx - 66, y: SHELF + 50, h: 92, max: 1, total: u > 0.98 ? 1 : null,
        bars: [{ id: 'in', label: 'W in', tone: 2 }, { id: 'out', label: 'W out', tone: 3 }],
        values: { in: v, out: v }, size: 21, minSize: 21,
      });
    }
  }

  shelf(ctx, c, x0, x1) {
    const wood = mix(c.gold, c.bgSurface, 0.3);
    ctx.save();
    rr(ctx, x0, SHELF, x1 - x0, 10, 3);
    ctx.fillStyle = wood; ctx.fill();
    ctx.fillStyle = lighten(wood, 0.3); ctx.fillRect(x0 + 2, SHELF + 1, x1 - x0 - 4, 2);
    ctx.strokeStyle = darken(wood, 0.45); ctx.lineWidth = 2; rr(ctx, x0, SHELF, x1 - x0, 10, 3); ctx.stroke();
    ctx.restore();
  }

  pulley(ctx, c, cx, u) {
    const steel = metal(c);
    const P = { x: cx, y: 64 }, R = 28;
    this.shelf(ctx, c, cx - 96, cx + 96);
    // beam and hook
    ctx.save();
    rr(ctx, cx - 70, 22, 140, 14, 4);
    ctx.fillStyle = mix(c.gold, c.bgSurface, 0.2); ctx.fill();
    ctx.strokeStyle = darken(c.gold, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    tube(ctx, c, { x: cx, y: 36 }, P, 6, steel);
    const lift = LIFT * u;
    const crateTop = SHELF - 52 - lift;
    const pullY = 150 + lift;
    // rope
    ctx.save();
    ctx.strokeStyle = darken(c.s2, 0.25); ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - R, crateTop - 6); ctx.lineTo(cx - R, P.y);
    ctx.arc(P.x, P.y, R, Math.PI, 0);
    ctx.lineTo(cx + R, pullY);
    ctx.stroke();
    ctx.restore();
    // the wheel
    ctx.save();
    ctx.beginPath(); ctx.arc(P.x, P.y, R - 2, 0, Math.PI * 2);
    ctx.fillStyle = steel; ctx.fill();
    ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(P.x, P.y, R - 9, 0, Math.PI * 2);
    ctx.fillStyle = darken(steel, 0.15); ctx.fill();
    ctx.beginPath(); ctx.arc(P.x, P.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = darken(steel, 0.4); ctx.fill();
    ctx.restore();
    drawCrate(ctx, c, { x: cx - R, y: crateTop + 52, w: 56, h: 46, held: lift > 1 });
    tube(ctx, c, { x: cx - R, y: crateTop - 6 }, { x: cx - R, y: crateTop + 6 }, 4, darken(c.s2, 0.25));
    // the pull: effort down on the free end
    arrow(ctx, c.s1, cx + R, pullY + 4, cx + R, pullY + 48, 6);
    pill(ctx, c, 'F', cx + R + 30, pullY + 30, { bg: c.s1, size: 21 });
  }

  ramp(ctx, c, cx, u) {
    const x0 = cx - 100, x1 = cx + 96, top = SHELF - 92;
    this.shelf(ctx, c, cx - 106, cx + 106);
    const wood = mix(c.gold, c.bgSurface, 0.15);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x0, SHELF); ctx.lineTo(x1, top); ctx.lineTo(x1, SHELF); ctx.closePath();
    ctx.fillStyle = wood; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1 - 26, top + 24); ctx.lineTo(x1, top); ctx.lineTo(x1, SHELF); ctx.lineTo(x1 - 26, SHELF); ctx.closePath();
    ctx.fillStyle = darken(wood, 0.18); ctx.fill();
    ctx.strokeStyle = lighten(wood, 0.35); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0 + 8, SHELF - 4); ctx.lineTo(x1 - 4, top + 5); ctx.stroke();
    ctx.strokeStyle = darken(wood, 0.45); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, SHELF); ctx.lineTo(x1, top); ctx.lineTo(x1, SHELF); ctx.closePath(); ctx.stroke();
    ctx.restore();
    // the crate slides up the slope, turned to it
    const ang = Math.atan2(top - SHELF, x1 - x0);
    const s0 = 30, s1 = Math.hypot(x1 - x0, SHELF - top) - 40;
    const s = s0 + (s1 - s0) * u;
    const bx = x0 + Math.cos(ang) * s, by = SHELF + Math.sin(ang) * s;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(ang);
    drawCrate(ctx, c, { x: 0, y: 0, w: 48, h: 40, held: true });
    ctx.restore();
    // push along the slope, behind the crate
    const bk = { x: bx - Math.cos(ang) * 28 - Math.sin(ang) * -20, y: by - Math.sin(ang) * 28 + Math.cos(ang) * -20 };
    arrow(ctx, c.s1, bk.x - Math.cos(ang) * 46, bk.y - Math.sin(ang) * 46, bk.x, bk.y, 6);
    pill(ctx, c, 'F', bk.x - Math.cos(ang) * 14, bk.y - Math.sin(ang) * 14 + 34, { bg: c.s1, size: 21 });
  }

  lever(ctx, c, cx, u) {
    this.shelf(ctx, c, cx - 106, cx + 106);
    const fx = cx - 30, fy = SHELF - 40;
    const a0 = -0.2, a1 = 0.24;
    const angle = a0 + (a1 - a0) * u;
    const lv = drawLeverPlank(ctx, c, { x: fx, y: fy, angle, left: 64, right: 126, thick: 14, groundY: SHELF });
    const lp = lv.at(-46);
    ctx.save();
    ctx.translate(lp.x, lp.y);
    ctx.rotate(angle);
    drawCrate(ctx, c, { x: 0, y: 0, w: 46, h: 40, held: true });
    ctx.restore();
    const ep = lv.at(116);
    arrow(ctx, c.s1, ep.x, ep.y - 54, ep.x, ep.y - 8, 6);
    pill(ctx, c, 'F', ep.x - 28, ep.y - 40, { bg: c.s1, size: 21 });
  }
}
