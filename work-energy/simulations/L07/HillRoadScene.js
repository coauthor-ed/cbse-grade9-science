import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, inOutSine, clamp01,
  mix, alpha, lighten, darken, rr, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// HillRoadScene - blk-l07-s10, Hill Roads and Ladders (book P&P 9, 10; Fig 7.30).
// b0: one hill, two roads to the same top: a straight road up the steep face
//     and a winding road of long, gentle legs. A vehicle climbs each; the push
//     along the road (F, solid) is long on the steep road, short on the gentle one.
// b1: two ladders to the same roof: one straight up the wall, one leaning. A
//     student climbs the leaning one. Dashed paths show the trade: the leaning
//     path is longer.

const HILL_BASE = 478;
const TOP = { x: 352, y: 104 };
const WIND = [[86, 462], [318, 420], [132, 356], [318, 300], [176, 244], [330, 194], [236, 148], [TOP.x, TOP.y]];
const STRAIGHT = [[600, 462], [TOP.x + 6, TOP.y]];
const DRIVE_S = 1.6, REST_U = 0.46;

// b1 ladders
const GY = 462, ROOF = 150;
const BX0 = 330, BX1 = 452;                  // the building
const LEAN_FOOT = { x: 52, y: GY }, LEAN_TOP = { x: BX0 - 10, y: ROOF + 4 };
const VERT_X = BX1 + 12;                     // vertical ladder rail (wall side)
const CLIMB_S = 1.8, CLIMB_REST = 0.42;
const RUNG = 30;                             // rung spacing along a ladder (px)
const F_UP = 92;                             // the straight climb's F, the steep road's length

function pathLen(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}
function pointAt(pts, u) {
  let left = pathLen(pts) * clamp01(u);
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

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class HillRoadScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A hill with two roads to the same top: a straight road up the steep face and a winding road made of long, gentle slopes. A truck climbs each; the push arrow F on the steep road is long, on the winding road short. Then two ladders reach the same roof: one straight up the wall and one leaning. A student climbs the leaning one; its dashed path is longer than the straight one.';

  enter() { this.motionT = 0; }
  pointerDown() { this.motionT = 0; this.animateFor(800); }

  get ladderBeat() { return this.stage >= 1; }
  get motionEnd() { return (this.ladderBeat ? CLIMB_S : DRIVE_S) + 0.1; }
  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }
  get moveU() { return inOutSine(clamp01((this.motionT ?? 0) / (this.ladderBeat ? CLIMB_S : DRIVE_S))); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.ladderBeat) this.ladders(ctx, c);
    else this.hill(ctx, c);
  }

  // ---- b0: the hill -------------------------------------------------------------

  hillPath(ctx, x0, x1, base, top, w) {
    ctx.beginPath();
    ctx.moveTo(x0, base);
    ctx.bezierCurveTo(x0 + w * 0.3, base - 40, top.x - w * 0.42, top.y + 30, top.x - 30, top.y - 4);
    ctx.quadraticCurveTo(top.x, top.y - 16, top.x + 34, top.y - 2);
    ctx.bezierCurveTo(top.x + w * 0.36, top.y + 40, x1 - w * 0.22, base - 60, x1, base);
    ctx.closePath();
  }

  hill(ctx, c) {
    const far = mix(c.setGroundFar ?? c.good, c.bgSurface, 0.25);
    const g = c.setGround ?? c.good;
    ctx.save();
    // a far ridge for depth
    this.hillPath(ctx, -60, 300, HILL_BASE, { x: 110, y: 230 }, 300);
    ctx.fillStyle = far; ctx.fill();
    this.hillPath(ctx, 420, 760, HILL_BASE, { x: 640, y: 210 }, 300);
    ctx.fillStyle = far; ctx.fill();
    // the hill: base, lit left flank, shade right flank
    this.hillPath(ctx, -10, 690, HILL_BASE, TOP, 620);
    ctx.fillStyle = g; ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = lighten(g, 0.14);
    ctx.beginPath(); ctx.moveTo(-10, HILL_BASE); ctx.lineTo(TOP.x - 20, TOP.y - 20); ctx.lineTo(TOP.x - 120, HILL_BASE); ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(g, 0.14);
    ctx.beginPath(); ctx.moveTo(TOP.x + 20, TOP.y - 20); ctx.lineTo(700, HILL_BASE); ctx.lineTo(TOP.x + 90, HILL_BASE); ctx.closePath(); ctx.fill();
    // grass strokes
    ctx.strokeStyle = alpha(darken(g, 0.25), 0.55);
    ctx.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
      const x = 20 + ((i * 97) % 640), y = 150 + ((i * 61) % 320);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 7); ctx.moveTo(x + 5, y); ctx.lineTo(x + 7, y - 6); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = darken(g, 0.32);
    ctx.lineWidth = 2.5;
    this.hillPath(ctx, -10, 690, HILL_BASE, TOP, 620);
    ctx.stroke();
    ctx.restore();
    // trees
    for (const [x, y, s] of [[60, 410, 1], [420, 250, 0.8], [470, 380, 1], [250, 400, 0.9], [560, 330, 0.85], [400, 440, 0.9], [210, 300, 0.7]]) this.tree(ctx, c, x, y, s);
    this.road(ctx, c, WIND);
    this.road(ctx, c, STRAIGHT);
    // vehicles and pushes
    const u = this.moveU * REST_U;
    const pw = pointAt(WIND, u * 1.0);
    const ps = pointAt(STRAIGHT, u);
    this.vehicle(ctx, c, pw, c.s1);
    this.vehicle(ctx, c, ps, c.s4);
    this.push(ctx, c, pw, 34);
    this.push(ctx, c, ps, 92);
    pill(ctx, c, 'winding road', 150, 496, { bg: c.s1, size: 22 });
    pill(ctx, c, 'straight road', 560, 496, { bg: c.s4, size: 22 });
  }

  tree(ctx, c, x, y, s) {
    const g = darken(c.good, 0.15);
    ctx.save();
    drawShadow(ctx, c, x + 4, y + 2, 16 * s, 4 * s, 0.6);
    ctx.fillStyle = darken(c.gold, 0.35);
    ctx.fillRect(x - 3 * s, y - 12 * s, 6 * s, 14 * s);
    for (let k = 0; k < 3; k++) {
      const ty = y - 10 * s - k * 14 * s, hw = (20 - k * 4) * s;
      ctx.beginPath(); ctx.moveTo(x - hw, ty); ctx.lineTo(x, ty - 24 * s); ctx.lineTo(x + hw, ty); ctx.closePath();
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, ty - 24 * s); ctx.lineTo(x + hw, ty); ctx.lineTo(x + hw * 0.2, ty); ctx.closePath();
      ctx.fillStyle = darken(g, 0.2); ctx.fill();
    }
    ctx.restore();
  }

  road(ctx, c, pts) {
    const tar = mix(c.label, c.bgSurface, 0.5);
    const stroke = (w, col, dash) => {
      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.lineWidth = w; ctx.strokeStyle = col;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      ctx.restore();
    };
    stroke(26, darken(tar, 0.3));
    stroke(21, tar);
    ctx.save(); ctx.translate(-2, -3); stroke(4, alpha(lighten(tar, 0.3), 0.6)); ctx.restore();
    stroke(2.5, alpha(c.bgSurface, 0.85), [10, 10]);
  }

  vehicle(ctx, c, p, col) {
    // a small truck seen from above, nose along the road
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.ang);
    ctx.fillStyle = darken(c.label, 0.1);
    for (const [wx, wy] of [[-14, -12], [-14, 8], [12, -12], [12, 8]]) { rr(ctx, wx - 5, wy, 10, 4, 2); ctx.fill(); }
    rr(ctx, -22, -11, 44, 22, 5);
    ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = darken(col, 0.22);
    ctx.fillRect(-20, 3, 26, 7);
    ctx.fillStyle = lighten(col, 0.3);
    ctx.fillRect(-20, -9, 26, 4);
    // cab and windscreen at the nose
    rr(ctx, 8, -10, 13, 20, 4);
    ctx.fillStyle = darken(col, 0.12); ctx.fill();
    ctx.fillStyle = mix(c.s6, c.bgSurface, 0.4);
    ctx.fillRect(16, -8, 4, 16);
    ctx.strokeStyle = darken(col, 0.45);
    ctx.lineWidth = 1.5;
    rr(ctx, -22, -11, 44, 22, 5); ctx.stroke();
    ctx.restore();
  }

  push(ctx, c, p, len) {
    const ca = Math.cos(p.ang), sa = Math.sin(p.ang);
    const x0 = p.x + ca * 26, y0 = p.y + sa * 26;
    vectorArrow(ctx, c, x0, y0, { angle: p.ang, length: len, col: c.accent, width: 6, head: 16 });
    // label beside the arrow, off the road
    const mx = x0 + ca * len * 0.5, my = y0 + sa * len * 0.5;
    const nx = -sa, ny = ca;
    const side = nx > 0 ? 1 : -1;
    pill(ctx, c, 'F', mx + nx * 38 * side, my + ny * 38 * side, { bg: c.accent, size: 24 });
  }

  // ---- b1: the ladders ------------------------------------------------------------

  ladders(ctx, c) {
    const ground = mix(c.setGround ?? c.good, c.bgSurface, 0.1);
    ctx.save();
    ctx.fillStyle = ground;
    ctx.fillRect(0, GY, W, H - GY);
    ctx.fillStyle = lighten(ground, 0.2);
    ctx.fillRect(0, GY, W, 3);
    ctx.restore();
    this.building(ctx, c);
    const vx = VERT_X + 16;
    this.ladder(ctx, c, { x: vx, y: GY }, { x: vx, y: ROOF - 14 });
    this.ladder(ctx, c, LEAN_FOOT, LEAN_TOP);
    // the two paths, drawn on the ladders themselves, foot to the same roof height
    const a1 = this.moveU > 0.2 ? 1 : this.moveU / 0.2;
    displacementArrow(ctx, c, LEAN_FOOT.x, GY - 6, LEAN_TOP.x, ROOF + 4, { tone: 5, width: 6, head: 18, alpha: a1 });
    displacementArrow(ctx, c, vx, GY - 6, vx, ROOF + 4, { tone: 5, width: 6, head: 18, alpha: a1 });
    this.climber(ctx, c);
    // the force each climb needs: the leaning ladder's is the smaller, as on the roads
    const L = Math.hypot(LEAN_TOP.x - LEAN_FOOT.x, LEAN_TOP.y - LEAN_FOOT.y);
    const sinA = (LEAN_FOOT.y - LEAN_TOP.y) / L;
    const ang = Math.atan2(LEAN_TOP.y - LEAN_FOOT.y, LEAN_TOP.x - LEAN_FOOT.x);
    const nx = Math.sin(ang), ny = -Math.cos(ang);   // outward normal, up-left of the ladder
    const g = this.grip;
    if (g) {
      const t0 = { x: g.x + nx * 48, y: g.y + ny * 48 };
      vectorArrow(ctx, c, t0.x, t0.y, { angle: ang, length: F_UP * sinA, col: c.accent, width: 6, head: 16 });
      pill(ctx, c, 'F', t0.x + nx * 30 + Math.cos(ang) * F_UP * sinA * 0.5, t0.y + ny * 30 + Math.sin(ang) * F_UP * sinA * 0.5, { bg: c.accent, size: 24 });
    }
    const fy = GY - 150;
    vectorArrow(ctx, c, vx + 40, fy, { angle: -Math.PI / 2, length: F_UP, col: c.accent, width: 6, head: 16 });
    pill(ctx, c, 'F', vx + 76, fy - F_UP / 2, { bg: c.accent, size: 24 });
    // path names beside their arrows, low down, clear of the climber
    if (a1 > 0) {
      pill(ctx, c, 'longer path', 214, GY - 34, { bg: c.s5, size: 22, alpha: a1 });
      pill(ctx, c, 'short path', vx + 82, GY - 40, { bg: c.s5, size: 22, alpha: a1 });
    }
  }

  building(ctx, c) {
    const body = mix(c.bgSurface, c.flame ?? c.s8, 0.22);
    ctx.save();
    drawShadow(ctx, c, (BX0 + BX1) / 2, GY + 2, (BX1 - BX0) * 0.7, 9, 0.7);
    ctx.fillStyle = body;
    ctx.fillRect(BX0, ROOF, BX1 - BX0, GY - ROOF);
    ctx.fillStyle = lighten(body, 0.18);
    ctx.fillRect(BX0, ROOF, 6, GY - ROOF);
    ctx.fillStyle = darken(body, 0.18);
    ctx.fillRect(BX1 - 14, ROOF, 14, GY - ROOF);
    ctx.strokeStyle = alpha(darken(body, 0.3), 0.45);
    ctx.lineWidth = 1.5;
    for (let y = ROOF + 18, r = 0; y < GY; y += 18, r++) {
      ctx.beginPath(); ctx.moveTo(BX0 + 1, y); ctx.lineTo(BX1 - 1, y); ctx.stroke();
      for (let x = BX0 + (r % 2 ? 20 : 40); x < BX1; x += 40) { ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x, y); ctx.stroke(); }
    }
    // a window and the roof parapet
    const wx = BX0 + 34, wy = ROOF + 60;
    ctx.fillStyle = darken(body, 0.35);
    ctx.fillRect(wx - 3, wy - 3, 58, 66);
    ctx.fillStyle = mix(c.s6, c.bgSurface, 0.45);
    ctx.fillRect(wx, wy, 52, 60);
    ctx.fillStyle = lighten(mix(c.s6, c.bgSurface, 0.45), 0.3);
    ctx.fillRect(wx + 4, wy + 4, 14, 52);
    ctx.fillStyle = darken(body, 0.35);
    ctx.fillRect(wx + 24, wy, 4, 60);
    ctx.fillStyle = lighten(body, 0.1);
    ctx.fillRect(BX0 - 6, ROOF - 12, BX1 - BX0 + 12, 14);
    ctx.fillStyle = lighten(body, 0.34);
    ctx.fillRect(BX0 - 6, ROOF - 12, BX1 - BX0 + 12, 3);
    ctx.strokeStyle = darken(body, 0.4);
    ctx.lineWidth = 2;
    ctx.strokeRect(BX0 - 6, ROOF - 12, BX1 - BX0 + 12, GY - ROOF + 12);
    ctx.restore();
  }

  ladder(ctx, c, a, b) {
    const wood = mix(c.gold, c.flame ?? c.s8, 0.2);
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(Math.atan2(dy, dx));
    const half = 12;
    // rungs
    for (let s = 26; s < L - 6; s += RUNG) {
      ctx.fillStyle = darken(wood, 0.12);
      ctx.fillRect(s - 3, -half, 6, half * 2);
      ctx.fillStyle = lighten(wood, 0.2);
      ctx.fillRect(s - 3, -half, 2, half * 2);
    }
    // rails
    for (const r of [-half, half]) {
      ctx.fillStyle = wood;
      ctx.fillRect(0, r - 4, L, 8);
      ctx.fillStyle = lighten(wood, 0.3);
      ctx.fillRect(0, r - 4, L, 2);
      ctx.fillStyle = darken(wood, 0.25);
      ctx.fillRect(0, r + 2, L, 2);
      ctx.strokeStyle = darken(wood, 0.45);
      ctx.lineWidth = 1.3;
      ctx.strokeRect(0, r - 4, L, 8);
    }
    ctx.restore();
  }

  ladderPt(s) {
    const dx = LEAN_TOP.x - LEAN_FOOT.x, dy = LEAN_TOP.y - LEAN_FOOT.y, L = Math.hypot(dx, dy);
    return { x: LEAN_FOOT.x + dx * s / L, y: LEAN_FOOT.y + dy * s / L };
  }

  // feet on two rungs, hands on the rails three and four rungs up: real ladder grips
  climber(ctx, c) {
    const dx = LEAN_TOP.x - LEAN_FOOT.x, dy = LEAN_TOP.y - LEAN_FOOT.y, L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L, nx = uy, ny = -ux;   // along the ladder; outward normal (up-left)
    const top = Math.floor((L - 160 - 26) / RUNG);
    const k = Math.round(this.moveU * CLIMB_REST * top);   // the rung under the lower foot
    const rung = (i) => this.ladderPt(26 + RUNG * (k + i));
    const rail = (i, side) => { const p = rung(i); return { x: p.x + nx * 12 * side, y: p.y + ny * 12 * side }; };
    const feet = [rung(1), rung(0)];
    const hands = [rail(3, -1), rail(4, 1)];
    this.grip = rail(4, 1);
    const spec = figureFor(this, {
      role: 'student', pose: { name: 'climb', lean: 26, crouch: 0.08 },
      x: (feet[0].x + feet[1].x) / 2 + 4, y: feet[1].y, height: 136, facing: 1, feet, hands,
    });
    drawFigure(ctx, c, spec, spec.look, { noShadow: true });
  }
}
