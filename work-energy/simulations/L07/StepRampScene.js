import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, font, inOutSine, clamp01,
  mix, alpha, lighten, darken, drawCard, outBack, lerp,
} from 'simulations/base/kit/SimLook.js';
import { drawCrate } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';

// StepRampScene - blk-l07-n01, Over a Step (book Ex 7.12, Fig 7.29).
// A student pushes a box up a plank ramp onto the step of a house. One scale
// for everything (CM px per cm, the student 1.58 m tall): the step face AB is
// 30 cm, the floor under the ramp BC is 40 cm, the ramp AC is 50 cm.
// b0: the box is pushed half way up the ramp; the three sides of the
//     right-angled triangle light up one by one, the ramp side last with 50 cm.
// b1: 50 and 30 fly off their sides into MA = L / h = 50 / 30, then = 1.67
//     pops. The student holds the box half way up.

const CM = 2.5;
const GY = 452;
const B = { x: 420, y: GY };
const C = { x: B.x - 40 * CM, y: GY };          // 320
const A = { x: B.x, y: GY - 30 * CM };          // 377
const LEN = 50 * CM;                            // 125
const UX = (A.x - C.x) / LEN, UY = (A.y - C.y) / LEN;   // 0.8, -0.6
const NX = -UY, NY = UX;                        // into the triangle (towards B)
const ANG = Math.atan2(UY, UX);
const CRW = 32 * CM, CRH = 28 * CM;             // a 32 x 28 cm carton
const REST_S = LEN * 0.5;
const FIG_H = 158 * CM;
const EDGE_S = 0.5;
const CARD = { x: 20, y: 26, w: 364, h: 78 };
const WALL = { x0: 470, top: -10 };

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class StepRampScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A student pushes a box up a short plank ramp onto the step of a house. The step is 30 cm high, the ramp covers 40 cm of floor, and the ramp itself is 50 cm long: the three sides of a right-angled triangle A B C. Then 50 and 30 move into MA = L / h = 50 / 30 = 1.67.';

  enter() { this.motionT = 0; }
  pointerDown() { this.motionT = 0; this.animateFor(800); }

  get maBeat() { return this.stage >= 1; }
  get motionEnd() { return this.maBeat ? 1.8 : 3 * EDGE_S + 0.9; }
  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  edgeU(i) {
    if (this.maBeat) return 1;
    return inOutSine(clamp01(((this.motionT ?? 0) - 0.2 - i * EDGE_S) / EDGE_S));
  }

  // the box's centre along the ramp: pushed from the foot to half way on b0
  crateS() {
    if (this.maBeat) return REST_S;
    const s0 = CRW / 2 + 2;
    return lerp(s0, REST_S, inOutSine(clamp01(((this.motionT ?? 0) - 0.3) / 1.2)));
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    this.house(ctx, c);
    drawFloor(ctx, c, GY, { seams: true });
    this.stepBlock(ctx, c);
    this.plank(ctx, c);
    this.pusher(ctx, c);
    this.triangle(ctx, c);
    this.labels(ctx, c);
    if (this.maBeat) this.card(ctx, c);
  }

  // the front wall of the house the step leads into, with its doorway
  house(ctx, c) {
    const wall = mix(c.s8, c.bgSurface, 0.55), x0 = WALL.x0, y1 = A.y;
    ctx.save();
    ctx.fillStyle = wall;
    ctx.fillRect(x0, WALL.top, W - x0, y1 - WALL.top);
    ctx.fillStyle = lighten(wall, 0.15);
    ctx.fillRect(x0, WALL.top, 8, y1 - WALL.top);
    ctx.fillStyle = darken(wall, 0.1);
    ctx.fillRect(x0, y1 - 26, W - x0, 26);
    // doorway: frame, dark inside, an open door leaf
    const dx = 548, dw = 92, dt = -10;
    ctx.fillStyle = darken(c.gold, 0.35);
    ctx.fillRect(dx - 8, dt - 8, dw + 16, y1 - dt + 8);
    ctx.fillStyle = darken(wall, 0.6);
    ctx.fillRect(dx, dt, dw, y1 - dt);
    ctx.fillStyle = mix(c.gold, c.flame, 0.3);
    ctx.beginPath();
    ctx.moveTo(dx + dw, dt); ctx.lineTo(dx + dw + 26, dt + 12); ctx.lineTo(dx + dw + 26, y1 - 6); ctx.lineTo(dx + dw, y1);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = darken(c.gold, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  stepBlock(ctx, c) {
    const body = mix(c.bgSurface, c.label, 0.18);
    const x0 = A.x, x1 = W + 4, y0 = A.y;
    ctx.save();
    drawShadow(ctx, c, (x0 + x1) / 2, GY + 2, (x1 - x0) * 0.5, 8, 0.7);
    ctx.fillStyle = body;
    ctx.fillRect(x0, y0, x1 - x0, GY - y0);
    ctx.fillStyle = lighten(body, 0.18);
    ctx.fillRect(x0, y0 + 10, 6, GY - y0 - 10);
    ctx.fillStyle = darken(body, 0.12);
    ctx.fillRect(x0, GY - 22, x1 - x0, 22);
    ctx.fillStyle = alpha(darken(body, 0.35), 0.5);
    for (let i = 0; i < 40; i++) {
      const px = x0 + 14 + ((i * 53) % (x1 - x0 - 20)), py = y0 + 18 + ((i * 37) % (GY - y0 - 24));
      ctx.fillRect(px, py, 3, 3);
    }
    ctx.fillStyle = lighten(body, 0.12);
    ctx.fillRect(x0 - 6, y0 - 4, x1 - x0 + 6, 12);
    ctx.fillStyle = lighten(body, 0.34);
    ctx.fillRect(x0 - 6, y0 - 4, x1 - x0 + 6, 3);
    ctx.fillStyle = darken(body, 0.3);
    ctx.fillRect(x0 - 6, y0 + 8, x1 - x0 + 6, 3);
    ctx.strokeStyle = darken(body, 0.38);
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, y0 + 10, x1 - x0, GY - y0 - 10);
    ctx.restore();
  }

  plank(ctx, c) {
    const wood = mix(c.gold, c.flame, 0.25);
    const T = 10;
    ctx.save();
    ctx.translate(C.x, C.y);
    ctx.rotate(ANG);
    ctx.fillStyle = darken(wood, 0.42);
    ctx.fillRect(-5, -1, LEN + 17, T + 2);
    ctx.fillStyle = wood;
    ctx.fillRect(-4, 0, LEN + 14, T);
    ctx.fillStyle = lighten(wood, 0.3);
    ctx.fillRect(-4, 0, LEN + 14, 3);
    ctx.fillStyle = darken(wood, 0.22);
    ctx.fillRect(-4, T - 3, LEN + 14, 3);
    ctx.restore();
  }

  // the box on the ramp and the student pushing it from behind
  pusher(ctx, c) {
    const s = this.crateS();
    const bc = { x: C.x + UX * s, y: C.y + UY * s };
    const ca = Math.cos(ANG), sa = Math.sin(ANG);
    const loc = (dx, dy) => ({ x: bc.x + ca * dx + sa * dy, y: bc.y + sa * dx - ca * dy });
    const ground = (x) => (x <= C.x ? GY : x >= A.x ? A.y : GY + (x - C.x) * (UY / UX));
    const hb = loc(-CRW / 2 - 1, CRH * 0.4), ht = loc(-CRW / 2 + 4, CRH * 0.88);
    const fx = Math.min(hb.x - 118, C.x - 60);
    const spec = figureFor(this, {
      role: 'student', pose: { name: 'push', lean: 48, crouch: 0.3 }, x: fx, y: ground(fx), height: FIG_H, facing: 1, ground,
      hands: [hb, ht],
    });
    drawFigure(ctx, c, spec, { ...spec.look, mood: 'effort' }, {
      between: () => {
        ctx.save();
        ctx.translate(bc.x, bc.y);
        ctx.rotate(ANG);
        drawCrate(ctx, c, { x: 0, y: 0, w: CRW, h: CRH, kind: 'carton', tone: 6, held: true });
        ctx.restore();
      },
    });
  }

  triangle(ctx, c) {
    const dimBC = this.maBeat ? 0.3 : 1;
    const seg = (p, q, u, col, a = 1) => {
      if (u <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = col;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(lerp(p.x, q.x, u), lerp(p.y, q.y, u));
      ctx.stroke();
      ctx.restore();
    };
    seg(A, B, this.edgeU(0), c.s3);
    seg(B, C, this.edgeU(1), c.s4, dimBC);
    seg(C, A, this.edgeU(2), c.s1);
    if (this.edgeU(1) > 0.9) {
      ctx.save();
      ctx.globalAlpha = dimBC;
      ctx.strokeStyle = c.label;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(B.x - 18, B.y - 18, 18, 18);
      ctx.restore();
    }
    for (const p of [A, B, C]) {
      ctx.fillStyle = c.label;
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // where each side's length sits: 30 on the step face, 40 under the floor,
  // 50 above the top of the ramp (the triangle is too small to hold it)
  get at30() { return { x: B.x + 52, y: (A.y + B.y) / 2 + 4 }; }
  get at50() { return { x: A.x + 74, y: A.y - 52 }; }

  labels(ctx, c) {
    const t = this.motionT ?? 0;
    const ma = this.maBeat;
    const lab = (txt, x, y, col, k, a = 1) => pill(ctx, c, txt, x, y, { bg: col, size: 24, scale: outBack(k), alpha: Math.min(1, k * 2) * a });
    const kOf = (i) => ma ? 1 : clamp01((t - 0.2 - (i + 0.8) * EDGE_S) / 0.4);
    lab('30 cm', this.at30.x, this.at30.y, c.s3, kOf(0));
    lab('40 cm', (B.x + C.x) / 2, GY + 34, c.s4, kOf(1), ma ? 0.6 : 1);
    // 50 cm: above the top of the ramp, a short leader to the ramp side
    const k = kOf(2);
    if (k > 0) {
      const m = { x: C.x + UX * LEN * 0.86, y: C.y + UY * LEN * 0.86 };
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.strokeStyle = c.s1; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(m.x + 4, m.y - 4); ctx.lineTo(this.at50.x - 30, this.at50.y + 10); ctx.stroke();
      ctx.restore();
    }
    lab('50 cm', this.at50.x, this.at50.y, c.s1, k);
    const letter = (s, x, y) => {
      ctx.save();
      ctx.font = font(c, 800, 24, true);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = c.label;
      ctx.fillText(s, x, y);
      ctx.restore();
    };
    letter('A', A.x + 16, A.y - 22);
    letter('B', B.x + 16, GY + 34);
    letter('C', C.x - 4, GY + 34);
  }

  card(ctx, c) {
    const t = this.motionT ?? 0;
    const a = clamp01(t / 0.35);
    drawCard(ctx, c, CARD.x, CARD.y, CARD.w, CARD.h, a);
    const cy = CARD.y + CARD.h / 2 + 2;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = font(c, 800, 28, true);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = c.label;
    const parts = ['MA = L / h = ', '50', ' / ', '30', ' = 1.67'];
    const ws = parts.map((p) => ctx.measureText(p).width);
    const pw = ws.map((v, i) => (i === 1 || i === 3 ? v + 28 : v));
    let x = CARD.x + (CARD.w - pw.reduce((s, v) => s + v, 0)) / 2;
    const slot = [];
    parts.forEach((p, i) => { slot.push(x); x += pw[i]; });
    ctx.fillText(parts[0], slot[0], cy);
    const fly = clamp01((t - 0.3) / 0.7);
    if (fly >= 1) ctx.fillText(parts[2], slot[2], cy);
    const res = clamp01((t - 1.1) / 0.4);
    if (res > 0) { ctx.globalAlpha = a * res; ctx.fillText(parts[4], slot[4], cy); }
    ctx.restore();
    const fu = inOutSine(fly);
    const to50 = { x: slot[1] + pw[1] / 2, y: cy };
    const to30 = { x: slot[3] + pw[3] / 2, y: cy };
    if (fly > 0) {
      pill(ctx, c, '50', lerp(this.at50.x, to50.x, fu), lerp(this.at50.y, to50.y, fu), { bg: c.s1, size: 26 });
      pill(ctx, c, '30', lerp(this.at30.x, to30.x, fu), lerp(this.at30.y, to30.y, fu), { bg: c.s3, size: 26 });
    }
  }
}
