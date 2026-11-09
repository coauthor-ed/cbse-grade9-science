import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  drawBackdrop, drawFloor, drawShadow, drawShelf, pill, clamp01, alpha, mix, lighten, darken, outBack,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawBall, displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// MechanicalEnergyScene - blk-l02-s12, Motion and Position (2 beats).
// b0: two reasons. A ball rolls across the floor: its own energy bar fills as
//     it moves. A second ball sits still on a high wall shelf: its own energy
//     bar fills as the height arrow h is drawn. Each ball has its own panel.
// b1: two names. The floor ball's bar becomes K, "kinetic energy". The shelf
//     ball starts to roll along the shelf, so this ONE ball now moves and is
//     high: its panel shows its own K and U, "potential energy" names its
//     height, and a bracket over that one ball's two bars reads
//     "mechanical energy = K + U". Energies of two balls are never added.

const GROUND = 444;
const R = 50;
const ROLL_X = 170, ROLL_FROM = -70, ROLL_S = 1.2;
const WALL_X = 620, SHELF_X0 = 424, SHELF_Y = 210;
const HIGH_X0 = 498, HIGH_X1 = 560;
const ARROW_X = 404;
const FLOOR_CARD = { x: 40, y: 70 }, SHELF_CARD = { x: 230, y: 74 };
const BAR = { h: 150, size: 24, barW: 54, gap: 26 };
const VAL = { floorK: 0.72, highU: 0.82, highK: 0.45 };

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class MechanicalEnergyScene extends SimScene {
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Two balls. One rolls along the floor and its own energy bar fills because it moves. The other sits still on a high wall shelf, at height h, and its own energy bar fills because of its position. Then the names: the rolling ball has K, kinetic energy. The ball on the shelf starts to roll along the shelf, so this one ball both moves and is high: it has its own K and its own U, potential energy, and a bracket over that one ball\'s two bars reads mechanical energy = K + U.';

  enter() { this.motionT = 0; }

  get named() { return this.stage >= 1; }
  get motionEnd() { return this.named ? 1.6 : ROLL_S + 0.5; }

  pointerDown() {
    this.motionT = 0;
    this.animateFor(800);
  }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  draw(ctx, c) {
    const t = this.motionT ?? 0;
    // b0: the roll and the height arrow play; b1 starts from b0's end state
    const roll = this.named ? 1 : clamp01(t / ROLL_S);
    const hU = this.named ? 1 : clamp01((t - 0.3) / 0.7);
    const kU = this.named ? 1 : clamp01(t / 0.7);
    // b1: the shelf ball rolls along the shelf (eased, 0.8 s)
    const sRoll = this.named ? clamp01(t / 0.8) : 0;
    const sEase = 1 - Math.pow(1 - sRoll, 2);
    drawBackdrop(ctx, c);
    drawFloor(ctx, c, GROUND, { seams: true });
    this.wall(ctx, c);
    this.heightArrow(ctx, c, hU);
    this.rolling(ctx, c, roll);
    this.shelfBall(ctx, c, HIGH_X0 + (HIGH_X1 - HIGH_X0) * sEase, sRoll);
    this.cards(ctx, c, kU, hU, sEase);
    if (this.named) this.names(ctx, c, t);
  }

  wall(ctx, c) {
    const body = mix(c.bgSurface, c.label, 0.1);
    ctx.save();
    ctx.fillStyle = body;
    ctx.fillRect(WALL_X, 24, 680 - WALL_X, GROUND - 24);
    ctx.fillStyle = lighten(body, 0.2);
    ctx.fillRect(WALL_X, 24, 6, GROUND - 24);
    ctx.fillStyle = darken(body, 0.1);
    ctx.fillRect(WALL_X + 6, 24, 4, GROUND - 24);
    // plaster courses
    ctx.strokeStyle = alpha(darken(body, 0.25), 0.6);
    ctx.lineWidth = 2;
    for (let y = 60, i = 0; y < GROUND; y += 36, i++) {
      ctx.beginPath();
      ctx.moveTo(WALL_X + 10, y); ctx.lineTo(680, y);
      const vx = WALL_X + (i % 2 ? 22 : 42);
      ctx.moveTo(vx, y); ctx.lineTo(vx, y + 36);
      ctx.stroke();
    }
    // skirting
    ctx.fillStyle = darken(body, 0.2);
    ctx.fillRect(WALL_X, GROUND - 14, 680 - WALL_X, 14);
    ctx.restore();
    // the shelf and its bracket, fixed to the wall
    const wood = darken(c.gold, 0.3);
    ctx.save();
    ctx.fillStyle = darken(wood, 0.25);
    ctx.beginPath();
    ctx.moveTo(WALL_X, SHELF_Y + 12);
    ctx.lineTo(WALL_X, SHELF_Y + 70);
    ctx.lineTo(WALL_X - 8, SHELF_Y + 70);
    ctx.lineTo(WALL_X - 62, SHELF_Y + 16);
    ctx.lineTo(WALL_X - 62, SHELF_Y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = lighten(wood, 0.1);
    ctx.beginPath();
    ctx.moveTo(WALL_X - 6, SHELF_Y + 16);
    ctx.lineTo(WALL_X - 6, SHELF_Y + 58);
    ctx.lineTo(WALL_X - 48, SHELF_Y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    drawShelf(ctx, c, SHELF_X0, WALL_X + 4, SHELF_Y);
  }

  ballFace(ctx, c, x, y, spin) {
    drawBall(ctx, c, { x, y, r: R, tone: 6 });
    // a seam band that turns with the roll: the ball is seen to spin
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, R - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.strokeStyle = alpha(lighten(c.s6, 0.55), 0.95);
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    for (const d of [-10, 10]) {
      ctx.beginPath();
      ctx.moveTo(d, -R); ctx.quadraticCurveTo(d * 2.4, 0, d, R);
      ctx.stroke();
    }
    ctx.restore();
  }

  speedLines(ctx, c, x, y, a) {
    if (a <= 0) return;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.35 * a);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const [dy, len] of [[-20, 46], [2, 64], [24, 42]]) {
      ctx.beginPath();
      ctx.moveTo(x - R - 10, y + dy); ctx.lineTo(x - R - 10 - len, y + dy);
      ctx.stroke();
    }
    ctx.restore();
  }

  rolling(ctx, c, u) {
    const x = ROLL_FROM + (ROLL_X - ROLL_FROM) * u;
    const y = GROUND - R;
    // ghosts behind: where it was a moment ago
    ctx.save();
    for (const [k, a] of [[3, 0.12], [2, 0.2], [1, 0.3]]) {
      const gx = x - k * 52;
      if (gx < -R) continue;
      ctx.globalAlpha = a;
      drawBall(ctx, c, { x: gx, y, r: R, tone: 6 });
    }
    ctx.restore();
    this.speedLines(ctx, c, x, y, 1);
    drawShadow(ctx, c, x, GROUND + 2, R * 1.1, 8);
    this.ballFace(ctx, c, x, y, x / R);
    this.rollAt = { x, y };
  }

  heightArrow(ctx, c, hU) {
    if (hU <= 0) return;
    // height of the shelf top above the floor: dashed, up, just left of the shelf
    const ax = ARROW_X;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.4 * hU);
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(ax - 12, SHELF_Y); ctx.lineTo(SHELF_X0, SHELF_Y); ctx.stroke();
    ctx.restore();
    displacementArrow(ctx, c, ax, GROUND, ax, GROUND - (GROUND - SHELF_Y) * hU, { tone: 3 });
    // the h tag sits clear of the shaft, to its right, under the shelf
    if (hU > 0.6) pill(ctx, c, 'h', ax + 34, (GROUND + SHELF_Y) / 2 + 20, { bg: c.s3, size: 25, alpha: clamp01((hU - 0.6) / 0.3) });
  }

  shelfBall(ctx, c, x, sRoll) {
    const y = SHELF_Y - R;
    if (sRoll > 0) {
      ctx.save();
      for (const [k, a] of [[2, 0.15], [1, 0.28]]) {
        const gx = x - k * 30 * sRoll;
        if (gx - R < SHELF_X0 - 6) continue;
        ctx.globalAlpha = a * sRoll;
        drawBall(ctx, c, { x: gx, y, r: R, tone: 6 });
      }
      ctx.restore();
      this.speedLines(ctx, c, x, y, clamp01(sRoll * 2));
    }
    drawShadow(ctx, c, x, SHELF_Y + 1, R, 6);
    this.ballFace(ctx, c, x, y, 0.4 + (x - HIGH_X0) / R);
    this.highAt = { x, y };
  }

  cards(ctx, c, kU, hU, sEase) {
    const named = this.named;
    const common = { h: BAR.h, max: 1, size: BAR.size, barW: BAR.barW, gap: BAR.gap };
    // the floor ball: its own panel, one bar
    const r = this.rollAt;
    drawEnergyBars(ctx, c, {
      ...common, x: FLOOR_CARD.x, y: FLOOR_CARD.y,
      bars: [{ id: 'K', label: named ? 'K' : 'energy', tone: 1 }],
      values: { K: VAL.floorK * kU },
      anchor: r && r.x > FLOOR_CARD.x ? { x: r.x - R * 0.55, y: r.y - R * 0.75 } : undefined,
    });
    // the shelf ball: its own panel; one bar before the names, then its own K and U
    const s = this.highAt;
    const bars = named
      ? [{ id: 'K', label: 'K', tone: 1 }, { id: 'U', label: 'U', tone: 3 }]
      : [{ id: 'U', label: 'energy', tone: 3 }];
    this.shelfBox = drawEnergyBars(ctx, c, {
      ...common, x: SHELF_CARD.x, y: SHELF_CARD.y, bars,
      values: { K: VAL.highK * sEase, U: VAL.highU * hU },
      anchor: s ? { x: s.x - R * 0.7, y: s.y - R * 0.45 } : undefined,
    });
  }

  names(ctx, c, t) {
    const pop = (at) => {
      const u = clamp01((t - at) / 0.45);
      return { a: clamp01(u * 2), s: 0.6 + 0.4 * outBack(u) };
    };
    const a = pop(0), b = pop(0.4), m = pop(0.9);
    if (a.a > 0) pill(ctx, c, 'kinetic energy', ROLL_X, GROUND + 38, { bg: c.s1, size: Math.round(25 * a.s), alpha: a.a });
    if (b.a > 0) pill(ctx, c, 'potential energy', 546, SHELF_Y - 2 * R - 30, { bg: c.s3, size: Math.round(25 * b.s), alpha: b.a });
    const box = this.shelfBox;
    if (m.a > 0 && box && box.bars.length === 2) {
      // a bracket over this one ball's K and U
      const x0 = box.bars[0].x - 4, x1 = box.bars[1].x + box.bars[1].w + 4, y = box.y0 - 10;
      ctx.save();
      ctx.globalAlpha = m.a;
      ctx.strokeStyle = c.label;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y + 8); ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, y + 8);
      ctx.moveTo((x0 + x1) / 2, y); ctx.lineTo((x0 + x1) / 2, y - 8);
      ctx.stroke();
      ctx.restore();
      pill(ctx, c, 'mechanical energy = K + U', (x0 + x1) / 2, y - 28, { bg: c.raised ?? c.bgSurface, size: Math.round(24 * m.s), alpha: m.a });
    }
  }
}
