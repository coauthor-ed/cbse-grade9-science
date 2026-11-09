import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, drawShelf, pill, alpha, lighten, darken, mix,
  rr, clamp01,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';

// ConstantSpeedScene - blk-l03-s11, Steady Speed, Steady Energy (P&P 5).
// b0: a car drives at a steady speed along a level road. As it passes the tree
//     a K bar is left there at the car's K; as it passes the petrol pump a second
//     one, the same height (a dashed level line joins the tops).
// b1: a ball on a high shelf in the roadside shop: it does not move, its K bar
//     is empty. No U bar here: the next lesson names that energy.

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

const ROAD_Y = 424;           // the road surface where the wheels sit
const KERB_Y = 404;           // the far kerb (things stand on the pavement behind)
const TREE_X = 92, PUMP_X = 330;
const CAR_W = 196;
const CAR_X0 = -140, CAR_X1 = 548;   // car centre: start and rest (rests past the pump, not at it)
const DRIVE_S = 2.6;                 // steady speed: linear in time
const SNAP_H = 112, SNAP_Y = 128;
const K_LEVEL = 0.8;
const SHOP = { x0: 516, x1: 676, top: 132 };
const SHELF_Y = 196;
const BALL = { x: 600, r: 24 };

export class ConstantSpeedScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A car drives at a steady speed along a level road, past a tree and then a petrol pump. A kinetic energy bar is marked at the tree and another at the pump: they are the same height. Then a ball on a high shelf in a roadside shop: it does not move, and its kinetic energy bar is empty.';

  enter() { this.motionT = 0; }

  pointerDown() { this.motionT = 0; this.animateFor(800); }

  get ballBeat() { return this.stage >= 1; }

  get motionEnd() { return this.ballBeat ? 0.9 : DRIVE_S + 0.5; }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  get carX() {
    if (this.ballBeat) return CAR_X1;
    return CAR_X0 + (CAR_X1 - CAR_X0) * clamp01((this.motionT ?? 0) / DRIVE_S);
  }

  // when the car's front passes x in b0 (seconds); the snapshot pops then
  passT(x) { return ((x - CAR_W / 2) - CAR_X0) / (CAR_X1 - CAR_X0) * DRIVE_S; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'sky');
    this.ground(ctx, c);
    // Whatever the beat does not name sits under a veil (one veil, so
    // overlapping parts never show through each other).
    this.shop(ctx, c, 1);
    if (!this.ballBeat) this.veil(ctx, c, SHOP.x0 - 12, SHOP.top - 20, W - SHOP.x0 + 12, KERB_Y - SHOP.top + 14);
    this.tree(ctx, c, 1);
    this.pump(ctx, c, 1);
    this.car(ctx, c, this.carX, 1);
    if (this.ballBeat) {
      this.veil(ctx, c, 0, 0, W, H);
      ctx.save();
      ctx.beginPath();
      ctx.rect(SHOP.x0 - 12, 0, W, 318);
      ctx.clip();
      this.shop(ctx, c, 1);
      ctx.restore();
      this.ballBar(ctx, c);
    } else this.snaps(ctx, c);
  }

  veil(ctx, c, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = alpha(c.bgSurface, 0.55);
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  ground(ctx, c) {
    const pave = mix(c.bgSurface, c.label, 0.12);
    const road = mix(c.bgDeep, c.label, 0.3);
    ctx.save();
    ctx.fillStyle = pave;
    ctx.fillRect(0, KERB_Y - 14, W, 22);
    ctx.fillStyle = lighten(pave, 0.2);
    ctx.fillRect(0, KERB_Y - 14, W, 3);
    for (let x = 0; x < W; x += 38) {
      ctx.fillStyle = darken(pave, 0.12);
      ctx.fillRect(x, KERB_Y - 11, 2, 19);
    }
    ctx.fillStyle = darken(pave, 0.25);
    ctx.fillRect(0, KERB_Y + 6, W, 6);
    ctx.fillStyle = road;
    ctx.fillRect(0, KERB_Y + 12, W, H - KERB_Y - 12);
    ctx.fillStyle = darken(road, 0.18);
    ctx.fillRect(0, H - 30, W, 30);
    ctx.fillStyle = alpha(c.gold, 0.85);
    for (let x = 10; x < W; x += 70) ctx.fillRect(x, 470, 38, 5);
    ctx.restore();
  }

  tree(ctx, c, a) {
    const x = TREE_X, base = KERB_Y - 6;
    const bark = mix(c.s2, c.label, 0.45);
    const leaf = mix(c.s3, c.bgDeep, 0.25);
    ctx.save();
    ctx.globalAlpha *= a;
    drawShadow(ctx, c, x, base + 2, 40, 6, 0.8);
    // trunk splitting into two branches
    ctx.fillStyle = bark;
    ctx.beginPath();
    ctx.moveTo(x - 13, base);
    ctx.lineTo(x - 8, base - 120);
    ctx.lineTo(x - 46, base - 176);
    ctx.lineTo(x - 36, base - 182);
    ctx.lineTo(x, base - 138);
    ctx.lineTo(x + 34, base - 192);
    ctx.lineTo(x + 44, base - 186);
    ctx.lineTo(x + 9, base - 120);
    ctx.lineTo(x + 13, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = darken(bark, 0.25);
    ctx.fillRect(x + 4, base - 118, 7, 118);
    ctx.strokeStyle = alpha(darken(bark, 0.35), 0.7);
    ctx.lineWidth = 1.5;
    for (const yy of [30, 58, 90]) {
      ctx.beginPath();
      ctx.moveTo(x - 9, base - yy);
      ctx.quadraticCurveTo(x - 2, base - yy - 5, x + 4, base - yy);
      ctx.stroke();
    }
    // the crown: one lobed silhouette (no circles), a shaded underside, a lit
    // upper left, and short leaf marks for texture, all clipped to the crown
    const cx = x - 2, cy = base - 194, rx = 84, ry = 62, n = 13;
    const hash = (i) => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
    const crownPath = (ox, oy) => {
      const P = (k) => { const q = (k / n) * Math.PI * 2; return { x: cx + ox + Math.cos(q) * rx, y: cy + oy + Math.sin(q) * ry }; };
      ctx.beginPath();
      const p0 = P(0);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 0; i < n; i++) {
        const q = ((i + 0.5) / n) * Math.PI * 2;
        const under = Math.sin(q) > 0.55; // the underside: flatter, smaller lobes
        const out = (under ? 1.1 : 1.24) + 0.08 * hash(i);
        const p1 = P(i + 1);
        ctx.quadraticCurveTo(cx + ox + Math.cos(q) * rx * out, cy + oy + Math.sin(q) * ry * out, p1.x, p1.y);
      }
      ctx.closePath();
    };
    crownPath(5, 7);
    ctx.fillStyle = alpha(darken(leaf, 0.35), 0.6);
    ctx.fill();
    crownPath(0, 0);
    ctx.fillStyle = leaf;
    ctx.fill();
    ctx.save();
    crownPath(0, 0);
    ctx.clip();
    ctx.fillStyle = darken(leaf, 0.24);
    ctx.beginPath();
    ctx.ellipse(cx + 12, cy + ry * 0.95, rx * 1.25, ry * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = alpha(lighten(leaf, 0.22), 0.85);
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.32, cy - ry * 0.42, rx * 0.6, ry * 0.42, -0.25, 0, Math.PI * 2);
    ctx.fill();
    // leaf marks: small pointed leaves, darker low, lighter high
    for (let i = 0; i < 54; i++) {
      const lx = cx + (hash(i + 50) * 2 - 1) * rx * 1.05;
      const ly = cy + (hash(i + 90) * 2 - 1) * ry * 1.05;
      const hi = ly < cy - ry * 0.1;
      ctx.fillStyle = hi ? alpha(lighten(leaf, 0.42), 0.75) : alpha(darken(leaf, 0.38), 0.6);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(-0.9 + 1.8 * hash(i + 130));
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.quadraticCurveTo(0, -4.5, 7, 0);
      ctx.quadraticCurveTo(0, 4.5, -7, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    crownPath(0, 0);
    ctx.strokeStyle = darken(leaf, 0.38);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  pump(ctx, c, a) {
    const x = PUMP_X, base = KERB_Y - 6;
    const body = mix(c.s6, c.bgSurface, 0.15);
    ctx.save();
    ctx.globalAlpha *= a;
    drawShadow(ctx, c, x, base + 2, 40, 6, 0.8);
    // plinth
    rr(ctx, x - 40, base - 14, 80, 14, 3);
    ctx.fillStyle = mix(c.bgSurface, c.label, 0.3);
    ctx.fill();
    // the dispenser body: light side, shade side, inner line
    rr(ctx, x - 32, base - 150, 64, 138, 8);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.fillStyle = lighten(body, 0.25);
    ctx.fillRect(x - 28, base - 146, 6, 130);
    ctx.fillStyle = darken(body, 0.22);
    ctx.fillRect(x + 16, base - 146, 12, 130);
    ctx.strokeStyle = darken(body, 0.4);
    ctx.lineWidth = 2;
    rr(ctx, x - 32, base - 150, 64, 138, 8);
    ctx.stroke();
    // the top sign band and the display window
    rr(ctx, x - 36, base - 162, 72, 20, 5);
    ctx.fillStyle = mix(c.s2, c.bgSurface, 0.1);
    ctx.fill();
    rr(ctx, x - 22, base - 130, 44, 30, 4);
    ctx.fillStyle = mix(c.bgDeep, c.label, 0.15);
    ctx.fill();
    ctx.fillStyle = alpha(c.s3, 0.8);
    ctx.fillRect(x - 16, base - 124, 32, 5);
    ctx.fillRect(x - 16, base - 113, 22, 5);
    // the nozzle hung in its holster on the pump's side, the hose looping
    // down beside the plinth: parked, not reaching out
    ctx.strokeStyle = mix(c.bgDeep, c.label, 0.2);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 30, base - 34);
    ctx.bezierCurveTo(x + 44, base - 6, x + 52, base - 20, x + 46, base - 72);
    ctx.stroke();
    rr(ctx, x + 32, base - 112, 16, 34, 3); // the holster
    ctx.fillStyle = darken(body, 0.35);
    ctx.fill();
    rr(ctx, x + 38, base - 106, 12, 30, 4); // the handle, hanging
    ctx.fillStyle = mix(c.bgDeep, c.label, 0.35);
    ctx.fill();
    ctx.fillStyle = alpha(lighten(mix(c.bgDeep, c.label, 0.35), 0.4), 0.8);
    ctx.fillRect(x + 40, base - 103, 3, 24);
    ctx.strokeStyle = mix(c.bgDeep, c.label, 0.45);
    ctx.lineWidth = 4;
    ctx.beginPath(); // the spout, tucked into the holster
    ctx.moveTo(x + 40, base - 104);
    ctx.lineTo(x + 34, base - 98);
    ctx.stroke();
    ctx.restore();
  }

  shop(ctx, c, a) {
    const { x0, x1, top } = SHOP;
    const base = KERB_Y - 6;
    const wall = mix(c.s2, c.bgSurface, 0.55);
    ctx.save();
    ctx.globalAlpha *= a;
    // back wall and the two side walls of an open-fronted shop
    ctx.fillStyle = darken(wall, 0.12);
    ctx.fillRect(x0, top, x1 - x0, base - top);
    ctx.fillStyle = wall;
    ctx.fillRect(x0, top, 14, base - top);
    ctx.fillRect(x1 - 14, top, 14, base - top);
    ctx.fillStyle = lighten(wall, 0.2);
    ctx.fillRect(x0, top, 4, base - top);
    ctx.fillStyle = darken(wall, 0.3);
    ctx.fillRect(x1 - 5, top, 5, base - top);
    // roof slab with an awning
    ctx.fillStyle = mix(c.s6, c.bgSurface, 0.2);
    ctx.fillRect(x0 - 10, top - 18, x1 - x0 + 20, 18);
    ctx.fillStyle = darken(mix(c.s6, c.bgSurface, 0.2), 0.25);
    for (let x = x0 - 10; x < x1 + 10; x += 24) ctx.fillRect(x, top - 18, 12, 18);
    ctx.fillStyle = lighten(mix(c.s6, c.bgSurface, 0.2), 0.3);
    ctx.fillRect(x0 - 10, top - 18, x1 - x0 + 20, 3);
    // a low counter and a lower shelf with jars
    ctx.fillStyle = mix(c.gold, c.label, 0.3);
    ctx.fillRect(x0 + 14, base - 64, x1 - x0 - 28, 64);
    ctx.fillStyle = lighten(mix(c.gold, c.label, 0.3), 0.25);
    ctx.fillRect(x0 + 14, base - 64, x1 - x0 - 28, 5);
    ctx.restore();
    // the high shelf and the ball on it
    ctx.save();
    ctx.globalAlpha *= a;
    drawShelf(ctx, c, x0 + 14, x1 - 14, SHELF_Y);
    for (let i = 0; i < 3; i++) {
      const jx = x0 + 34 + i * 22;
      rr(ctx, jx, SHELF_Y - 26, 16, 26, 4);
      ctx.fillStyle = alpha(mix(c.glass, c.s3, 0.3 * i), 0.85);
      ctx.fill();
      ctx.fillStyle = darken(c.glass, 0.3);
      ctx.fillRect(jx + 2, SHELF_Y - 30, 12, 5);
    }
    // b0 does not name the ball: it sits dimmed until b1
    ctx.globalAlpha *= this.ballBeat ? 1 : 0.3;
    drawBall(ctx, c, { x: BALL.x, y: SHELF_Y - BALL.r, r: BALL.r, tone: 6 });
    ctx.restore();
  }

  car(ctx, c, cx, a) {
    const base = ROAD_Y;
    const x0 = cx - CAR_W / 2, x1 = cx + CAR_W / 2;
    const paint = c.s1;
    ctx.save();
    ctx.globalAlpha *= a;
    drawShadow(ctx, c, cx, base + 2, CAR_W * 0.52, 7, 0.9);
    // speed streaks: a steady speed in b0, gone when the car is not the subject
    if (!this.ballBeat) {
      ctx.strokeStyle = alpha(c.labelMuted, 0.6);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (const [dy, l] of [[-56, 40], [-36, 56], [-18, 34]]) {
        ctx.beginPath();
        ctx.moveTo(x0 - 10, base + dy);
        ctx.lineTo(x0 - 10 - l, base + dy);
        ctx.stroke();
      }
    }
    // the body: a hatchback, nose to the right
    ctx.beginPath();
    ctx.moveTo(x0 + 6, base - 18);
    ctx.lineTo(x0 + 4, base - 52);
    ctx.quadraticCurveTo(x0 + 8, base - 62, x0 + 30, base - 64);
    ctx.lineTo(x0 + 52, base - 98);
    ctx.quadraticCurveTo(x0 + 60, base - 104, x0 + 76, base - 104);
    ctx.lineTo(x0 + 128, base - 104);
    ctx.quadraticCurveTo(x0 + 140, base - 102, x0 + 150, base - 92);
    ctx.lineTo(x0 + 168, base - 66);
    ctx.quadraticCurveTo(x1 - 4, base - 62, x1 - 2, base - 44);
    ctx.lineTo(x1 - 2, base - 18);
    ctx.closePath();
    ctx.fillStyle = paint;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = darken(paint, 0.22);
    ctx.fillRect(x0, base - 34, CAR_W, 20);
    ctx.fillStyle = lighten(paint, 0.3);
    ctx.fillRect(x0, base - 66, CAR_W, 4);
    ctx.restore();
    ctx.strokeStyle = darken(paint, 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();
    // windows
    const glass = mix(c.glass, c.bgDeep, 0.2);
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(x0 + 40, base - 66);
    ctx.lineTo(x0 + 58, base - 94);
    ctx.lineTo(x0 + 92, base - 94);
    ctx.lineTo(x0 + 92, base - 66);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x0 + 100, base - 66);
    ctx.lineTo(x0 + 100, base - 94);
    ctx.lineTo(x0 + 130, base - 94);
    ctx.quadraticCurveTo(x0 + 138, base - 92, x0 + 144, base - 84);
    ctx.lineTo(x0 + 156, base - 66);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = alpha(lighten(c.glass, 0.5), 0.7);
    ctx.fillRect(x0 + 62, base - 90, 18, 3);
    ctx.fillRect(x0 + 106, base - 90, 18, 3);
    // door line, handle, headlight, tail light, bumpers
    ctx.strokeStyle = alpha(darken(paint, 0.4), 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0 + 96, base - 66);
    ctx.lineTo(x0 + 96, base - 20);
    ctx.stroke();
    ctx.fillStyle = darken(paint, 0.45);
    ctx.fillRect(x0 + 104, base - 56, 14, 3);
    ctx.fillRect(x0 + 62, base - 56, 14, 3);
    ctx.fillStyle = lighten(c.gold, 0.3);
    rr(ctx, x1 - 14, base - 54, 12, 9, 3);
    ctx.fill();
    ctx.fillStyle = c.bad;
    rr(ctx, x0 + 3, base - 52, 7, 12, 2);
    ctx.fill();
    ctx.fillStyle = mix(c.bgDeep, c.label, 0.25);
    rr(ctx, x0 - 2, base - 24, 26, 10, 4);
    ctx.fill();
    rr(ctx, x1 - 24, base - 24, 26, 10, 4);
    ctx.fill();
    // wheels: tyre, rim, hub, a spoke mark
    for (const wx of [x0 + 44, x1 - 44]) {
      ctx.beginPath();
      ctx.arc(wx, base - 18, 20, 0, Math.PI * 2);
      ctx.fillStyle = mix(c.bgDeep, c.label, 0.12);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx, base - 18, 11, 0, Math.PI * 2);
      ctx.fillStyle = mix(c.bgSurface, c.label, 0.35);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx - 2, base - 20, 4, 0, Math.PI * 2);
      ctx.fillStyle = lighten(mix(c.bgSurface, c.label, 0.35), 0.4);
      ctx.fill();
    }
    ctx.restore();
  }

  // b0: a K bar left at the tree and at the pump as the car passes each; same height.
  snaps(ctx, c) {
    const t = this.motionT ?? 0;
    const spots = [204, 398];
    const tops = [];
    spots.forEach((x, i) => {
      const at = this.passT(i === 0 ? TREE_X : PUMP_X);
      const a = clamp01((t - at) / 0.35);
      if (a <= 0) return;
      const r = drawEnergyBars(ctx, c, {
        x, y: SNAP_Y, h: SNAP_H, max: 1, size: 26, minSize: 26, alpha: a,
        bars: [{ id: 'K', label: 'K', tone: 1 }], values: { K: K_LEVEL * a },
        anchor: i === 0 ? { x: TREE_X + 12, y: KERB_Y - 70 } : { x: PUMP_X + 32, y: KERB_Y - 110 },
      });
      if (r && r.bars && r.bars[0]) tops.push(r.bars[0]);
    });
    if (tops.length === 2 && clamp01((t - DRIVE_S) / 0.4) > 0) {
      const a = clamp01((t - DRIVE_S) / 0.4);
      const y = tops[0].top.y;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.strokeStyle = c.s1;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.moveTo(tops[0].x + tops[0].w + 4, y);
      ctx.lineTo(tops[1].x - 4, y);
      ctx.stroke();
      ctx.restore();
      // above the two cards, never touching either
      pill(ctx, c, 'same K', (tops[0].x + tops[1].x + tops[1].w) / 2, SNAP_Y - 58, { bg: c.s1, size: 26, alpha: a });
    }
  }

  // b1: the ball's K bar, empty, with a leader to the ball.
  ballBar(ctx, c) {
    const a = clamp01((this.motionT ?? 0) / 0.5);
    drawEnergyBars(ctx, c, {
      x: 398, y: 40, h: 150, max: 1, size: 26, minSize: 26, alpha: a,
      bars: [{ id: 'K', label: 'K', tone: 1 }], values: { K: 0 },
      anchor: { x: BALL.x - BALL.r, y: SHELF_Y - BALL.r },
    });
    pill(ctx, c, 'K = 0', 340, 120, { bg: c.s1, size: 26, display: true, alpha: a });
  }
}
