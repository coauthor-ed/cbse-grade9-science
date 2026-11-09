import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, pill, alpha, lighten, darken, mix,
  rr, clamp01, inOutSine, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawCrate } from 'simulations/base/kit/SimApparatus.js';

// EqualKTwoMassesScene - blk-l03-s08, Same Energy, Different Speeds (P&P 4).
// b0: block A (mass m) and block B (mass 4m, four times the face area) glide
//     in on two tracks; two K bars beside them fill to the same height.
// b1: both glide again from the same start line for the same time. Floor dots
//     mark where each block is at equal steps of time: A's dots are twice as
//     far apart as B's. Speed arrows v and v/2, ratio 2 : 1. Bars stay equal.

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

const LANE_A = 236, LANE_B = 446;      // track tops
const A = { w: 72, h: 58 };
const B = { w: 144, h: 116 };          // 4 x the face area of A
const START_A = 236, START_B = 272;    // block centres at the start (back edges on one line)
const RUN_B = 112;                     // B's run in b1; A runs twice as far
const IN_S = 0.8;                      // b0 glide in
const RUN_S = 1.8;                     // b1 run
const N_STEP = 4;                      // equal time steps marked on the floor
const BAR = { x: 16, y: 128, h: 220 };

export class EqualKTwoMassesScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Two blocks glide on two tracks: block A of mass m, and block B of mass 4m, much bigger. Two kinetic energy bars beside them are the same height. Then both glide for the same time from one start line: marks on the floor show A goes twice as far as B in each step. A speed arrow v on A and v/2 on B: the speeds are in the ratio 2 : 1.';

  enter() { this.motionT = 0; }

  pointerDown() { this.motionT = 0; this.animateFor(800); }

  get speedBeat() { return this.stage >= 1; }

  get motionEnd() { return (this.speedBeat ? RUN_S + 0.5 : IN_S + 0.4); }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  // Block centres now. b0: both slide in from off the left to the start line
  // in the same time (no speed shown). b1: constant speeds 2 : 1 from the start line.
  pos() {
    const t = this.motionT ?? 0;
    if (!this.speedBeat) {
      const u = inOutSine(clamp01(t / IN_S));
      return { a: START_A - 120 * (1 - u), b: START_B - 120 * (1 - u), u: 0 };
    }
    const u = clamp01(t / RUN_S);
    return { a: START_A + 2 * RUN_B * u, b: START_B + RUN_B * u, u };
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const p = this.pos();
    this.track(ctx, c, LANE_A, 'upper');
    drawFloor(ctx, c, LANE_B, { seams: true });
    this.startLine(ctx, c);
    if (this.speedBeat) this.marks(ctx, c, p);
    this.block(ctx, c, p.a, LANE_A, A, 'A: m', c.s5);
    this.block(ctx, c, p.b, LANE_B, B, 'B: 4m', c.s5);
    if (this.speedBeat) this.speeds(ctx, c, p);
    this.bars(ctx, c);
  }

  // A raised track for A: a slab with a lit top lip and a shaded front, on legs.
  track(ctx, c, y) {
    const x0 = 168, x1 = W - 12;
    const top = mix(c.bgSurface, c.label, 0.14);
    ctx.save();
    for (const lx of [x0 + 30, (x0 + x1) / 2, x1 - 30]) {
      ctx.fillStyle = darken(top, 0.25);
      ctx.fillRect(lx - 6, y + 18, 12, 70);
      ctx.fillStyle = lighten(top, 0.12);
      ctx.fillRect(lx - 6, y + 18, 3, 70);
      drawShadow(ctx, c, lx, y + 90, 16, 4, 0.7);
    }
    rr(ctx, x0, y, x1 - x0, 20, 4);
    ctx.fillStyle = top;
    ctx.fill();
    ctx.fillStyle = lighten(top, 0.3);
    ctx.fillRect(x0 + 3, y + 1, x1 - x0 - 6, 4);
    ctx.fillStyle = darken(top, 0.2);
    ctx.fillRect(x0 + 3, y + 13, x1 - x0 - 6, 6);
    ctx.restore();
  }

  startLine(ctx, c) {
    ctx.save();
    ctx.strokeStyle = alpha(c.labelMuted, 0.8);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    const x = START_A - A.w / 2;
    ctx.beginPath();
    ctx.moveTo(x, LANE_A - A.h - 22);
    ctx.lineTo(x, LANE_B + 16);
    ctx.stroke();
    ctx.restore();
  }

  // Equal steps of time: where each block's back edge was. A's are 2x as far apart.
  marks(ctx, c, p) {
    const lanes = [
      { y: LANE_A, front: START_A - A.w / 2, step: (2 * RUN_B) / N_STEP, col: c.s1 },
      { y: LANE_B, front: START_B - B.w / 2, step: RUN_B / N_STEP, col: c.s1 },
    ];
    for (const L of lanes) {
      for (let i = 0; i <= N_STEP; i++) {
        if (p.u * N_STEP < i - 0.001) continue;
        const x = L.front + i * L.step;
        ctx.save();
        ctx.fillStyle = darken(L.col, 0.2);
        ctx.beginPath();
        ctx.arc(x, L.y + 7, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = lighten(L.col, 0.35);
        ctx.beginPath();
        ctx.arc(x - 1.5, L.y + 5.5, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  block(ctx, c, x, y, size, label, tone) {
    drawShadow(ctx, c, x, y + 1, size.w * 0.55, 5, 0.9);
    if (!this.speedBeat) {
      // b0: the same short glide streaks behind both (they move; no speed shown yet)
      ctx.save();
      ctx.strokeStyle = alpha(c.labelMuted, 0.6);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (const k of [0.3, 0.55, 0.8]) {
        const sy = y - size.h * k, sx = x - size.w / 2 - 8;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 26, sy);
        ctx.stroke();
      }
      ctx.restore();
    }
    drawCrate(ctx, c, { x, y, w: size.w, h: size.h, tone });
    pill(ctx, c, label, x, y - size.h - 22, { bg: c.s2, size: 24 });
  }

  speeds(ctx, c, p) {
    const a = clamp01(((this.motionT ?? 0) - 0.15) / 0.4);
    const len = 128;
    const ay = LANE_A - A.h / 2, by = LANE_B - B.h / 2;
    vectorArrow(ctx, c, p.a + A.w / 2 + 6, ay, { angle: 0, length: len, width: 8, head: 20, col: c.s1, alpha: a });
    vectorArrow(ctx, c, p.b + B.w / 2 + 6, by, { angle: 0, length: len / 2, width: 8, head: 20, col: c.s1, alpha: a });
    pill(ctx, c, 'v', p.a + A.w / 2 + 6 + len / 2, ay - 30, { bg: c.s1, size: 26, display: true, alpha: a });
    pill(ctx, c, 'v/2', p.b + B.w / 2 + 6 + len / 4, by - 30, { bg: c.s1, size: 26, display: true, alpha: a });
    const ea = clamp01(((this.motionT ?? 0) - RUN_S) / 0.4);
    pill(ctx, c, 'A : B = 2 : 1', 440, 70, { bg: c.s4, size: 30, display: true, alpha: ea, scale: 0.85 + 0.15 * ea });
  }

  bars(ctx, c) {
    const fill = this.speedBeat ? 1 : clamp01(((this.motionT ?? 0) - 0.2) / 0.6);
    drawEnergyBars(ctx, c, {
      x: BAR.x, y: BAR.y, h: BAR.h, max: 1.15, size: 24, title: 'K',
      bars: [{ id: 'A', label: 'A', tone: 1 }, { id: 'B', label: 'B', tone: 1 }],
      values: { A: fill, B: fill }, total: fill > 0.99 ? 1 : null,
    });
  }
}
