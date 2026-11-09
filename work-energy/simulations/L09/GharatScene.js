import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, font, inOutSine, clamp01,
  mix, alpha, lighten, darken, rr, ellipse,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';

// GharatScene - blk-l09-n01, The Gharat (book Fig 7.36).
// b0: a stone water mill on a Himalayan slope, cut open; the stream comes down
//     the hill into the wooden chute A; the mill is running.
// b1: one parcel of water rides down the chute A: its U bar drains into K as
//     it drops; it strikes the wheel B under the floor, whose shaft turns the
//     grinding stone C above; flour falls into the tray. A, B, C labelled.
// b2: a dam: stored water drops down a pipe to a turbine; the same U to K bars;
//     the turbine turns a generator and the line carries electricity away.
// Tap: play the beat again.

const GROUND = 440;
const HUT_X0 = 66, HUT_X1 = 334, EAVE_Y = 128, APEX_Y = 34, FLOOR_Y = 300, WALL = 22;
const WHEEL = { x: 196, y: 404, r: 78 };
const STONE = { x: 196, y: 288, r: 66 };
// the chute A: from the stream on the slope down into the wheel room
const CHUTE = [[586, 150], [470, 268], [340, 392], [276, 404]];
const STREAM = [[690, 92], [640, 116], [586, 150]];
const MILL_S = 3.0;     // b0: the mill runs, then rests
const DROP_S = 2.4;     // b1, b2: one parcel down the pipe
const AFTER_S = 1.2;    // b1, b2: the wheel and stone (or turbine) run on
// dam (b2)
const DAM = { top: 150, x0: 232, x1: 286, bx0: 196, bx1: 360 };
const RES_Y = 176;
const PEN = [[262, 300], [330, 360], [430, 420], [474, 430]];
const PH = { x0: 430, x1: 588, y0: 362, y1: GROUND };
const TURB = { x: 498, y: 420, r: 26 };

function polyLen(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}
function polyAt(pts, u) {
  let left = polyLen(pts) * clamp01(u);
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const seg = Math.hypot(bx - ax, by - ay);
    if (left <= seg || i === pts.length - 1) {
      const k = Math.min(1, left / seg);
      return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, ang: Math.atan2(by - ay, bx - ax) };
    }
    left -= seg;
  }
  return { x: pts[0][0], y: pts[0][1], ang: 0 };
}
function strokePoly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}
// slope surface y at x (the hill behind the mill)
function hillY(x) {
  if (x <= 330) return GROUND;
  const u = (x - 330) / (W - 330);
  return GROUND - (GROUND - 80) * Math.sin(u * Math.PI / 2) ** 0.9;
}

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

export class GharatScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A stone water mill on a Himalayan hill slope, cut open. A stream comes down the hill into a wooden chute, A, which drops steeply into a room under the floor, where the water strikes a flat paddle wheel, B. The wheel turns an upright shaft that turns the grinding stone, C, on the floor above; flour falls into a tray. A parcel of water is followed down the chute while two energy bars show its potential energy U changing into kinetic energy K. Then a dam: water stored high behind the wall drops down a pipe to a turbine, the same bars show U becoming K, and the turbine turns a generator that sends electricity along a power line.';

  enter() {
    this.runT = 0;
  }

  pointerDown() {
    this.runT = 0;
    this.animateFor(600);
  }

  get runEnd() { return this.stage === 0 ? MILL_S : DROP_S + AFTER_S; }

  update(d) { this.runT = Math.min(this.runEnd, (this.runT ?? 0) + d); }

  busy() { return (this.runT ?? 0) < this.runEnd; }

  // the parcel's fall fraction: it speeds up as it drops (u squared)
  get fallU() {
    if (this.stage === 0) return 0;
    const u = clamp01((this.runT ?? 0) / DROP_S);
    return u * u;
  }

  // the wheel's turn angle: runs while water strikes it; at rest a fixed angle
  get spin() {
    const t = this.runT ?? 0;
    if (this.stage === 0) return t * 3.2;
    const hit = Math.max(0, t - DROP_S * 0.92);
    return 0.4 + hit * 4.2;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'sky');
    if (this.stage >= 2) { this.dam(ctx, c); return; }
    this.peaks(ctx, c);
    this.hill(ctx, c);
    this.stream(ctx, c);
    this.hut(ctx, c);
    this.wheel(ctx, c);
    this.stones(ctx, c);
    this.chute(ctx, c);
    if (this.stage === 1) {
      this.parcel(ctx, c, CHUTE);
      this.labels(ctx, c);
    }
  }

  // far snowy peaks: the Himalaya behind
  peaks(ctx, c) {
    const rock = mix(c.bgSurface, c.label, 0.18);
    ctx.save();
    for (const [x, top, w, k] of [[120, 120, 230, 0.55], [330, 96, 260, 0.75], [520, 130, 220, 0.6]]) {
      ctx.globalAlpha = k;
      ctx.fillStyle = rock;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, 260); ctx.lineTo(x, top); ctx.lineTo(x + w / 2, 260); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = darken(rock, 0.12);
      ctx.beginPath();
      ctx.moveTo(x, top); ctx.lineTo(x + w / 2, 260); ctx.lineTo(x + w * 0.12, 260); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = mix(c.label, c.bgSurface, 0.15);
      ctx.beginPath();
      ctx.moveTo(x, top); ctx.lineTo(x + w * 0.12, top + 34); ctx.lineTo(x + w * 0.03, top + 28);
      ctx.lineTo(x - w * 0.04, top + 38); ctx.lineTo(x - w * 0.11, top + 32); ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  hill(ctx, c) {
    const earth = darken(mix(c.s8, c.gold, 0.3), 0.42);
    const grass = mix(c.s3, c.bgSurface, 0.35);
    ctx.save();
    // the slope
    ctx.beginPath();
    ctx.moveTo(300, H);
    ctx.lineTo(300, GROUND);
    for (let x = 300; x <= W; x += 8) ctx.lineTo(x, hillY(x));
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = earth;
    ctx.fill();
    // light on the upper face, shade toward the foot
    const sh = ctx.createLinearGradient(330, 100, 600, H);
    sh.addColorStop(0, alpha(lighten(earth, 0.3), 0.55));
    sh.addColorStop(0.5, alpha(earth, 0));
    sh.addColorStop(1, alpha(darken(earth, 0.3), 0.6));
    ctx.fillStyle = sh;
    ctx.fill();
    // strata: shade bands that follow the slope
    ctx.strokeStyle = darken(earth, 0.14);
    ctx.lineWidth = 3;
    for (const dy of [40, 92, 150]) {
      ctx.beginPath();
      for (let x = 360; x <= W; x += 8) {
        const y = hillY(x) + dy;
        if (x === 360) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // rocks on the face, each lit top-left
    for (const [x, dy, r] of [[420, 70, 13], [520, 120, 17], [610, 60, 12], [640, 190, 16], [470, 170, 11]]) {
      const y = hillY(x) + dy;
      ellipse(ctx, x, y, r * 1.3, r);
      ctx.fillStyle = mix(c.bgSurface, c.label, 0.32);
      ctx.fill();
      ellipse(ctx, x + r * 0.35, y + r * 0.25, r * 0.85, r * 0.6);
      ctx.fillStyle = darken(mix(c.bgSurface, c.label, 0.32), 0.18);
      ctx.fill();
    }
    // grass lip along the top of the slope, with tufts
    ctx.strokeStyle = grass;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = 330; x <= W; x += 8) { if (x === 330) ctx.moveTo(x, hillY(x)); else ctx.lineTo(x, hillY(x)); }
    ctx.stroke();
    ctx.strokeStyle = lighten(grass, 0.2);
    ctx.lineWidth = 3;
    for (let x = 350; x < W; x += 26) {
      const y = hillY(x);
      ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x - 4, y - 12); ctx.moveTo(x, y - 2); ctx.lineTo(x + 5, y - 11); ctx.stroke();
    }
    // two pines on the slope
    for (const [x, s] of [[452, 1], [628, 0.8]]) {
      const y = hillY(x) + 4;
      ctx.fillStyle = darken(earth, 0.3);
      ctx.fillRect(x - 3, y - 18 * s, 6, 18 * s);
      for (let i = 0; i < 3; i++) {
        const ty = y - 16 * s - i * 20 * s, w = (30 - i * 7) * s;
        ctx.fillStyle = i % 2 ? mix(c.s3, c.bgDeep, 0.45) : mix(c.s3, c.bgDeep, 0.35);
        ctx.beginPath(); ctx.moveTo(x - w, ty); ctx.lineTo(x, ty - 30 * s); ctx.lineTo(x + w, ty); ctx.closePath(); ctx.fill();
        ctx.fillStyle = mix(c.s3, c.bgDeep, 0.55);
        ctx.beginPath(); ctx.moveTo(x, ty - 30 * s); ctx.lineTo(x + w, ty); ctx.lineTo(x + 2, ty); ctx.closePath(); ctx.fill();
      }
    }
    // terrace ground in front, with the tail race leaving the wheel room
    ctx.fillStyle = earth;
    ctx.fillRect(0, GROUND, 330, H - GROUND);
    ctx.fillStyle = lighten(earth, 0.12);
    ctx.fillRect(0, GROUND, 330, 5);
    ctx.fillStyle = grass;
    ctx.fillRect(0, GROUND - 4, HUT_X0 - 4, 7);
    ctx.restore();
  }

  stream(ctx, c) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = darken(c.water, 0.2);
    ctx.lineWidth = 16;
    strokePoly(ctx, STREAM);
    ctx.strokeStyle = c.water;
    ctx.lineWidth = 11;
    strokePoly(ctx, STREAM);
    // tail race: the spent water leaves under the hut, out to the left
    const ty = GROUND + 18;
    ctx.fillStyle = darken(c.water, 0.15);
    rr(ctx, 0, ty - 9, HUT_X0 + 40, 18, 8);
    ctx.fill();
    ctx.fillStyle = lighten(c.water, 0.25);
    const off = ((this.runT ?? 0) * 40) % 36;
    for (let x = HUT_X0 + 20 - off; x > 4; x -= 36) ctx.fillRect(x - 10, ty - 3, 14, 3);
    ctx.restore();
  }

  hut(ctx, c) {
    const stone = mix(c.bgSurface, c.label, 0.24);
    const mortar = darken(stone, 0.25);
    const inside = darken(mix(c.bgDeep, c.label, 0.06), 0.25);
    ctx.save();
    drawShadow(ctx, c, (HUT_X0 + HUT_X1) / 2, GROUND + 2, (HUT_X1 - HUT_X0) * 0.55, 8, 0.7);
    // the cut interior: upper room and wheel room
    ctx.fillStyle = mix(inside, stone, 0.25);
    ctx.fillRect(HUT_X0 + WALL, EAVE_Y, HUT_X1 - HUT_X0 - 2 * WALL, FLOOR_Y - EAVE_Y);
    ctx.fillStyle = inside;
    ctx.fillRect(HUT_X0 + WALL, FLOOR_Y + 14, HUT_X1 - HUT_X0 - 2 * WALL, GROUND - FLOOR_Y - 14);
    // gable end inside the roof
    ctx.fillStyle = mix(inside, stone, 0.35);
    ctx.beginPath();
    ctx.moveTo(HUT_X0 + WALL, EAVE_Y); ctx.lineTo((HUT_X0 + HUT_X1) / 2, APEX_Y + 22); ctx.lineTo(HUT_X1 - WALL, EAVE_Y);
    ctx.closePath(); ctx.fill();
    // the two cut walls, coursed stone: blocks with light top edge and dark joints
    for (const x0 of [HUT_X0, HUT_X1 - WALL]) {
      ctx.fillStyle = mortar;
      ctx.fillRect(x0, EAVE_Y, WALL, GROUND - EAVE_Y);
      for (let y = EAVE_Y + 2, row = 0; y < GROUND; y += 17, row++) {
        const h = Math.min(15, GROUND - y - 1);
        const split = row % 2 ? 9 : 13;
        for (const [bx, bw] of [[x0 + 1, split - 2], [x0 + split, WALL - split - 1]]) {
          ctx.fillStyle = (row + bx) % 3 ? stone : lighten(stone, 0.08);
          ctx.fillRect(bx, y, bw, h);
          ctx.fillStyle = lighten(stone, 0.22);
          ctx.fillRect(bx, y, bw, 2);
          ctx.fillStyle = darken(stone, 0.16);
          ctx.fillRect(bx + bw - 2, y + 2, 2, h - 2);
        }
      }
    }
    // the inlet hole in the right wall where the chute enters
    ctx.fillStyle = inside;
    rr(ctx, HUT_X1 - WALL - 2, 380, WALL + 4, 34, 6);
    ctx.fill();
    // wooden floor: planks over a beam
    const wood = darken(mix(c.s8, c.gold, 0.5), 0.2);
    ctx.fillStyle = wood;
    ctx.fillRect(HUT_X0 + WALL, FLOOR_Y, HUT_X1 - HUT_X0 - 2 * WALL, 14);
    ctx.fillStyle = lighten(wood, 0.25);
    ctx.fillRect(HUT_X0 + WALL, FLOOR_Y, HUT_X1 - HUT_X0 - 2 * WALL, 3);
    ctx.fillStyle = darken(wood, 0.3);
    for (let x = HUT_X0 + WALL + 34; x < HUT_X1 - WALL; x += 34) ctx.fillRect(x, FLOOR_Y + 3, 2, 11);
    // roof: slate, eaves overhang, light and shade slopes, ridge
    const slate = mix(c.bgSurface, c.label, 0.4);
    const cx = (HUT_X0 + HUT_X1) / 2;
    ctx.fillStyle = slate;
    ctx.beginPath();
    ctx.moveTo(HUT_X0 - 26, EAVE_Y + 6); ctx.lineTo(cx, APEX_Y); ctx.lineTo(cx, APEX_Y + 22); ctx.lineTo(HUT_X0 - 4, EAVE_Y + 18);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(slate, 0.2);
    ctx.beginPath();
    ctx.moveTo(HUT_X1 + 26, EAVE_Y + 6); ctx.lineTo(cx, APEX_Y); ctx.lineTo(cx, APEX_Y + 22); ctx.lineTo(HUT_X1 + 4, EAVE_Y + 18);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = darken(slate, 0.32);
    ctx.lineWidth = 2;
    for (let k = 1; k < 5; k++) {
      const u = k / 5;
      ctx.beginPath();
      ctx.moveTo(HUT_X0 - 26 + (cx - HUT_X0 + 26) * u, EAVE_Y + 6 - (EAVE_Y + 6 - APEX_Y) * u);
      ctx.lineTo(HUT_X0 - 26 + (cx - HUT_X0 + 26) * u + 8, EAVE_Y + 6 - (EAVE_Y + 6 - APEX_Y) * u + 10);
      ctx.moveTo(HUT_X1 + 26 - (HUT_X1 + 26 - cx) * u, EAVE_Y + 6 - (EAVE_Y + 6 - APEX_Y) * u);
      ctx.lineTo(HUT_X1 + 26 - (HUT_X1 + 26 - cx) * u - 8, EAVE_Y + 6 - (EAVE_Y + 6 - APEX_Y) * u + 10);
      ctx.stroke();
    }
    ctx.fillStyle = lighten(slate, 0.3);
    ctx.beginPath();
    ctx.moveTo(HUT_X0 - 26, EAVE_Y + 6); ctx.lineTo(cx, APEX_Y); ctx.lineTo(cx, APEX_Y + 5); ctx.lineTo(HUT_X0 - 22, EAVE_Y + 9);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  wheel(ctx, c) {
    const { x, y, r } = WHEEL;
    const wood = mix(c.s8, c.gold, 0.45);
    const a0 = this.spin;
    ctx.save();
    // back vanes, then the rim disc, then the front vanes
    const vanes = [];
    for (let i = 0; i < 14; i++) {
      const a = a0 + i * Math.PI * 2 / 14;
      vanes.push({ vx: x + Math.cos(a) * r, front: Math.sin(a) > 0, w: 4 + 9 * Math.abs(Math.sin(a)) });
    }
    const vane = (v) => {
      const top = y - 22, h = 30;
      ctx.fillStyle = v.front ? wood : darken(wood, 0.35);
      ctx.fillRect(v.vx - v.w / 2, top + (v.front ? 6 : 0), v.w, h - (v.front ? 0 : 6));
      ctx.fillStyle = v.front ? lighten(wood, 0.3) : darken(wood, 0.45);
      ctx.fillRect(v.vx - v.w / 2, top + (v.front ? 6 : 0), 2, h - (v.front ? 0 : 6));
    };
    for (const v of vanes) if (!v.front) vane(v);
    ellipse(ctx, x, y + 4, r * 0.62, 10);
    ctx.fillStyle = darken(wood, 0.25);
    ctx.fill();
    ellipse(ctx, x, y + 1, r * 0.62, 9);
    ctx.fillStyle = wood;
    ctx.fill();
    for (const v of vanes) if (v.front) vane(v);
    // the upright shaft, up through the floor to the stone
    ctx.fillStyle = darken(wood, 0.1);
    ctx.fillRect(x - 6, STONE.y - 4, 12, y - STONE.y + 6);
    ctx.fillStyle = lighten(wood, 0.3);
    ctx.fillRect(x - 6, STONE.y - 4, 3, y - STONE.y + 6);
    ctx.fillStyle = darken(wood, 0.35);
    ctx.fillRect(x + 3, STONE.y - 4, 3, y - STONE.y + 6);
    // a turn mark on the shaft (moves with the wheel)
    const mx = x + Math.sin(a0 * 1) * 5;
    ctx.fillStyle = c.s6;
    ctx.fillRect(mx - 1.5, y - 60, 3, 16);
    // the bearing stone it stands on
    rr(ctx, x - 24, y + 18, 48, 14, 4);
    ctx.fillStyle = mix(c.bgSurface, c.label, 0.3);
    ctx.fill();
    ctx.restore();
  }

  stones(ctx, c) {
    const { x, y, r } = STONE;
    const st = mix(c.bgSurface, c.label, 0.5);
    ctx.save();
    // bed stone (fixed), runner stone (turns) above it
    const disc = (cy, h, rad, col) => {
      ctx.fillStyle = darken(col, 0.22);
      rr(ctx, x - rad, cy - h, rad * 2, h, 6);
      ctx.fill();
      ctx.fillStyle = col;
      rr(ctx, x - rad, cy - h, rad * 1.3, h, 6);
      ctx.fill();
      ellipse(ctx, x, cy - h, rad, 7);
      ctx.fillStyle = lighten(col, 0.2);
      ctx.fill();
    };
    disc(FLOOR_Y, 14, r + 6, darken(st, 0.08));
    disc(y - 0, 16, r - 4, st);
    // the runner's turn: dressing grooves that slide round
    const a0 = this.spin;
    ctx.strokeStyle = darken(st, 0.35);
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const a = a0 + i * Math.PI / 3;
      if (Math.sin(a) <= 0) continue;
      const gx = x + Math.cos(a) * (r - 6);
      ctx.beginPath(); ctx.moveTo(gx, y - 14); ctx.lineTo(gx, y - 2); ctx.stroke();
    }
    // the hopper hanging above, full of grain, a spout to the eye of the stone
    const hy = 176;
    const wood = mix(c.s8, c.gold, 0.45);
    ctx.strokeStyle = darken(wood, 0.3);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 30, EAVE_Y + 2); ctx.lineTo(x - 30, hy); ctx.moveTo(x + 30, EAVE_Y + 2); ctx.lineTo(x + 30, hy); ctx.stroke();
    ctx.fillStyle = wood;
    ctx.beginPath(); ctx.moveTo(x - 40, hy); ctx.lineTo(x + 40, hy); ctx.lineTo(x + 8, hy + 46); ctx.lineTo(x - 8, hy + 46); ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(wood, 0.25);
    ctx.beginPath(); ctx.moveTo(x + 14, hy); ctx.lineTo(x + 40, hy); ctx.lineTo(x + 8, hy + 46); ctx.lineTo(x + 3, hy + 46); ctx.closePath(); ctx.fill();
    ctx.fillStyle = mix(c.gold, c.bgSurface, 0.2);
    ellipse(ctx, x, hy, 38, 7);
    ctx.fill();
    ctx.fillStyle = darken(wood, 0.1);
    ctx.fillRect(x - 4, hy + 46, 8, y - 16 - hy - 46);
    // the flour tray at the stone's edge, and flour falling into it
    const tx = x + r + 14, ty = FLOOR_Y;
    const pile = this.stage === 0 ? 0.5 : 0.5 + 0.5 * clamp01(((this.runT ?? 0) - DROP_S * 0.9) / AFTER_S);
    ctx.fillStyle = darken(wood, 0.15);
    rr(ctx, tx - 26, ty - 22, 52, 22, 4);
    ctx.fill();
    ctx.fillStyle = lighten(wood, 0.15);
    ctx.fillRect(tx - 26, ty - 22, 52, 3);
    const flour = lighten(c.gold, 0.8);
    ctx.fillStyle = flour;
    ellipse(ctx, tx, ty - 22, 22, 6 + 8 * pile);
    ctx.fill();
    ctx.fillStyle = lighten(c.gold, 0.6);
    ctx.fillRect(x + r - 10, y - 8, 22, 5);
    ctx.fillStyle = flour;
    for (let i = 0; i < 4; i++) {
      const fy = y - 2 + ((i * 9 + (this.runT ?? 0) * 30) % 30);
      ctx.fillRect(tx - 12 + (i % 2) * 6, fy, 3, 3);
    }
    ctx.restore();
  }

  chute(ctx, c) {
    const wood = mix(c.s8, c.gold, 0.45);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // trestle legs under the chute, standing on the slope
    ctx.strokeStyle = darken(wood, 0.3);
    ctx.lineWidth = 5;
    for (const u of [0.25, 0.55]) {
      const p = polyAt(CHUTE, u);
      ctx.beginPath(); ctx.moveTo(p.x, p.y + 10); ctx.lineTo(p.x, hillY(p.x) + 6); ctx.stroke();
    }
    // the trough: dark underside, wood body, lit top edge, water inside
    ctx.strokeStyle = darken(wood, 0.35);
    ctx.lineWidth = 22;
    strokePoly(ctx, CHUTE.map(([x, y]) => [x, y + 3]));
    ctx.strokeStyle = wood;
    ctx.lineWidth = 17;
    strokePoly(ctx, CHUTE);
    ctx.strokeStyle = c.water;
    ctx.lineWidth = 8;
    strokePoly(ctx, CHUTE.map(([x, y]) => [x, y - 3]));
    ctx.strokeStyle = lighten(wood, 0.35);
    ctx.lineWidth = 2;
    strokePoly(ctx, CHUTE.map(([x, y]) => [x, y - 9]));
    // flow marks moving down (faster lower down)
    const t = this.runT ?? 0;
    ctx.strokeStyle = lighten(c.water, 0.45);
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      const u0 = ((i / 9) + t * 0.22) % 1;
      const u = Math.sqrt(u0);
      const p = polyAt(CHUTE, u);
      ctx.beginPath();
      ctx.moveTo(p.x - Math.cos(p.ang) * 7, p.y - 3 - Math.sin(p.ang) * 7);
      ctx.lineTo(p.x + Math.cos(p.ang) * 7, p.y - 3 + Math.sin(p.ang) * 7);
      ctx.stroke();
    }
    // the jet onto the vanes
    const end = CHUTE[CHUTE.length - 1];
    ctx.strokeStyle = c.water;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(end[0], end[1] - 2); ctx.lineTo(WHEEL.x + WHEEL.r - 4, WHEEL.y - 4); ctx.stroke();
    ctx.fillStyle = lighten(c.water, 0.4);
    for (const [dx, dy] of [[-4, -14], [6, -18], [-10, -8]]) ctx.fillRect(WHEEL.x + WHEEL.r + dx, WHEEL.y + dy, 4, 4);
    ctx.restore();
  }

  // one parcel of water followed down the pipe, with its U and K bars
  parcel(ctx, c, path) {
    const u = this.fallU;
    const p = polyAt(path, u * 0.97);
    const y0 = path[0][1], y1 = path[path.length - 1][1];
    const f = clamp01((p.y - y0) / (y1 - y0));
    ctx.save();
    ctx.strokeStyle = c.label;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y - 4, 15, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = lighten(c.water, 0.15);
    ctx.beginPath(); ctx.arc(p.x, p.y - 4, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lighten(c.water, 0.6);
    ctx.beginPath(); ctx.arc(p.x - 3, p.y - 7, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const bx = this.stage >= 2 ? 384 : 498, by = this.stage >= 2 ? 22 : 300;
    drawEnergyBars(ctx, c, {
      x: bx, y: by, h: 110, max: 1, total: 1, size: 24,
      bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'U', label: 'U', tone: 3 }],
      values: { K: f, U: 1 - f },
      anchor: { x: p.x, y: p.y - 4 },
    });
  }

  labels(ctx, c) {
    const fade = clamp01(((this.runT ?? 0) - 0.1) / 0.4);
    pill(ctx, c, 'A', 600, 196, { bg: c.s2, size: 26, alpha: fade });
    pill(ctx, c, 'B', HUT_X0 + WALL + 22, WHEEL.y - 2, { bg: c.s2, size: 26, alpha: fade });
    pill(ctx, c, 'C', HUT_X0 + WALL + 22, STONE.y - 14, { bg: c.s2, size: 26, alpha: fade });
  }

  // b2: a dam, a pipe down to a turbine, a generator and a power line
  dam(ctx, c) {
    const rock = mix(c.bgSurface, c.label, 0.2);
    const concrete = mix(c.bgSurface, c.label, 0.42);
    const earth = darken(mix(c.s8, c.gold, 0.3), 0.42);
    ctx.save();
    // valley sides
    ctx.fillStyle = rock;
    ctx.beginPath();
    ctx.moveTo(0, 120); ctx.lineTo(90, 96); ctx.lineTo(200, 128); ctx.lineTo(DAM.x0, DAM.top); ctx.lineTo(DAM.x0, H); ctx.lineTo(0, H);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = mix(c.label, c.bgSurface, 0.15);
    ctx.beginPath(); ctx.moveTo(60, 104); ctx.lineTo(90, 96); ctx.lineTo(126, 106); ctx.lineTo(96, 112); ctx.closePath(); ctx.fill();
    // the reservoir: water held high behind the wall
    const g = ctx.createLinearGradient(0, RES_Y, 0, GROUND);
    g.addColorStop(0, c.water);
    g.addColorStop(1, darken(c.water, 0.45));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, RES_Y); ctx.lineTo(DAM.x0 + 4, RES_Y); ctx.lineTo(DAM.bx0 + 8, GROUND); ctx.lineTo(0, GROUND);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = lighten(c.water, 0.45);
    ctx.lineWidth = 3;
    for (const [x, y] of [[40, RES_Y + 14], [120, RES_Y + 26], [70, RES_Y + 44], [170, RES_Y + 12]]) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 26, y); ctx.stroke();
    }
    // the ground and the river below the dam
    ctx.fillStyle = earth;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = lighten(earth, 0.12);
    ctx.fillRect(0, GROUND, W, 5);
    ctx.fillStyle = darken(c.water, 0.1);
    rr(ctx, PH.x1 - 20, GROUND + 10, W - PH.x1 + 30, 18, 8);
    ctx.fill();
    ctx.fillStyle = lighten(c.water, 0.3);
    const off = ((this.runT ?? 0) * 40) % 40;
    for (let x = PH.x1 + off; x < W; x += 40) ctx.fillRect(x, GROUND + 16, 16, 3);
    // the dam wall: a wedge, wide at the foot; light face, shade face, lift lines
    ctx.fillStyle = concrete;
    ctx.beginPath();
    ctx.moveTo(DAM.x0, DAM.top); ctx.lineTo(DAM.x1, DAM.top); ctx.lineTo(DAM.bx1, GROUND); ctx.lineTo(DAM.bx0, GROUND);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(concrete, 0.2);
    ctx.beginPath();
    ctx.moveTo(DAM.x1 - 8, DAM.top); ctx.lineTo(DAM.x1, DAM.top); ctx.lineTo(DAM.bx1, GROUND); ctx.lineTo(DAM.bx1 - 34, GROUND);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = lighten(concrete, 0.25);
    ctx.fillRect(DAM.x0 - 6, DAM.top - 10, DAM.x1 - DAM.x0 + 12, 10);
    ctx.strokeStyle = darken(concrete, 0.12);
    ctx.lineWidth = 2;
    for (let y = DAM.top + 40; y < GROUND; y += 40) {
      const u = (y - DAM.top) / (GROUND - DAM.top);
      ctx.beginPath(); ctx.moveTo(DAM.x0 + (DAM.bx0 - DAM.x0) * u + 4, y); ctx.lineTo(DAM.x1 + (DAM.bx1 - DAM.x1) * u - 4, y); ctx.stroke();
    }
    // the pipe (penstock) from low in the reservoir down to the turbine
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = darken(c.stroke, 0.2);
    ctx.lineWidth = 24;
    strokePoly(ctx, PEN);
    ctx.strokeStyle = mix(c.stroke, c.label, 0.25);
    ctx.lineWidth = 18;
    strokePoly(ctx, PEN);
    ctx.strokeStyle = c.water;
    ctx.lineWidth = 9;
    strokePoly(ctx, PEN);
    ctx.strokeStyle = lighten(c.water, 0.45);
    ctx.lineWidth = 3;
    const t = this.runT ?? 0;
    for (let i = 0; i < 7; i++) {
      const p = polyAt(PEN, Math.sqrt(((i / 7) + t * 0.25) % 1));
      ctx.beginPath(); ctx.moveTo(p.x - Math.cos(p.ang) * 6, p.y - Math.sin(p.ang) * 6); ctx.lineTo(p.x + Math.cos(p.ang) * 6, p.y + Math.sin(p.ang) * 6); ctx.stroke();
    }
    // the power house, cut open: turbine below, generator on top
    const wall = mix(c.bgSurface, c.label, 0.3);
    ctx.fillStyle = wall;
    ctx.fillRect(PH.x0, PH.y0, PH.x1 - PH.x0, PH.y1 - PH.y0);
    ctx.fillStyle = darken(wall, 0.18);
    ctx.fillRect(PH.x1 - 16, PH.y0, 16, PH.y1 - PH.y0);
    ctx.fillStyle = darken(mix(c.bgDeep, c.label, 0.06), 0.2);
    ctx.fillRect(PH.x0 + 10, PH.y0 + 12, PH.x1 - PH.x0 - 30, PH.y1 - PH.y0 - 12);
    ctx.fillStyle = darken(wall, 0.3);
    ctx.fillRect(PH.x0 - 6, PH.y0 - 8, PH.x1 - PH.x0 + 12, 10);
    // turbine runner: blades turning
    const spin = this.spin;
    ctx.fillStyle = mix(c.s5, c.bgSurface, 0.2);
    ctx.beginPath(); ctx.arc(TURB.x, TURB.y, TURB.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = darken(c.s5, 0.15);
    for (let i = 0; i < 6; i++) {
      const a = spin + i * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(TURB.x, TURB.y);
      ctx.arc(TURB.x, TURB.y, TURB.r - 3, a, a + 0.5);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = lighten(c.s5, 0.35);
    ctx.beginPath(); ctx.arc(TURB.x, TURB.y, 7, 0, Math.PI * 2); ctx.fill();
    // shaft up to the generator
    ctx.fillStyle = c.stroke;
    ctx.fillRect(TURB.x - 4, PH.y0 - 30, 8, TURB.y - PH.y0 + 30);
    const gx = TURB.x, gy = PH.y0 - 32;
    rr(ctx, gx - 34, gy - 30, 68, 34, 8);
    ctx.fillStyle = c.s2;
    ctx.fill();
    ctx.fillStyle = darken(c.s2, 0.22);
    ctx.fillRect(gx + 14, gy - 26, 14, 26);
    ctx.fillStyle = lighten(c.s2, 0.35);
    ctx.fillRect(gx - 30, gy - 27, 36, 4);
    // power line: generator to pylon to off-stage
    const live = clamp01((t - DROP_S) / 0.5);
    const px = 628, py = 210;
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px - 26, GROUND); ctx.lineTo(px - 6, py); ctx.lineTo(px + 6, py); ctx.lineTo(px + 26, GROUND);
    ctx.moveTo(px - 30, py + 12); ctx.lineTo(px + 30, py + 12);
    ctx.moveTo(px - 20, py + 80); ctx.lineTo(px + 20, py + 80);
    ctx.moveTo(px - 16, py + 12); ctx.lineTo(px + 18, py + 80); ctx.moveTo(px + 16, py + 12); ctx.lineTo(px - 18, py + 80);
    ctx.moveTo(px - 18, py + 80); ctx.lineTo(px + 24, GROUND); ctx.moveTo(px + 18, py + 80); ctx.lineTo(px - 24, GROUND);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = darken(c.stroke, 0.1);
    ctx.beginPath();
    ctx.moveTo(gx + 34, gy - 14); ctx.quadraticCurveTo(560, py + 30, px - 30, py + 12);
    ctx.moveTo(px + 30, py + 12); ctx.quadraticCurveTo(660, py + 30, W, py + 4);
    ctx.stroke();
    if (live > 0) {
      ctx.globalAlpha = live;
      ctx.strokeStyle = c.gold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(gx + 34, gy - 14); ctx.quadraticCurveTo(560, py + 30, px - 30, py + 12);
      ctx.moveTo(px + 30, py + 12); ctx.quadraticCurveTo(660, py + 30, W, py + 4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    this.parcel(ctx, c, [[150, RES_Y + 8], ...PEN]);
    pill(ctx, c, 'dam', (DAM.x0 + DAM.x1) / 2, DAM.top - 32, { bg: c.s7, size: 24 });
    pill(ctx, c, 'turbine', (PH.x0 + PH.x1) / 2 - 8, GROUND + 50, { bg: c.s5, size: 24 });
    pill(ctx, c, 'electricity', 604, 166, { bg: c.gold, size: 24, alpha: live });
  }
}
