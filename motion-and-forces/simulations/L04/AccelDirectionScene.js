/**
 * AccelDirectionScene - slide blk-l04-n02 "Which way does acceleration point?" (Fig 4.8).
 * b0: a car speeds up on a straight road (u = 2 m/s, a = 2 m/s2, x = ut + at2/2 for 4 s):
 *     velocity arrow grows, acceleration arrow (fixed length) points the same way, ghosts at
 *     every second with growing gaps.
 * b1: the first road moves up and dims; a second car slows down (u = 10 m/s, a = -2 m/s2):
 *     velocity arrow shrinks, acceleration arrow points back. Both a arrows stay in view.
 * Everything drawn comes from the beat and the stage age.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, alpha, font, clamp01, lerp, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawStrobe, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';

const RUN = 4;           // seconds of motion, shown in real time
const MOVE = 0.6;        // b1: the first road slides up
const CAR = 150;         // car length in px
const NOSE0 = 13;        // metres: the nose at t = 0
const V_SCALE = 12;      // px per m/s
const A_LEN = 120;       // px for |a| = 2 m/s2
const SUP2 = '\u00b2';

const ROWS = {
  up:   { u: 2, a: 2, tag: 'speeding up' },
  down: { u: 10, a: -2, tag: 'slowing down' },
};
const xAt = (r, t) => r.u * t + 0.5 * r.a * t * t;
const vAt = (r, t) => r.u + r.a * t;
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

export class AccelDirectionScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A car on a straight road speeds up: its velocity arrow grows and its acceleration arrow points forward, the same way. Then a second car slows down: its velocity arrow shrinks and its acceleration arrow points backward, opposite to the velocity.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.age < (this.cur === 1 ? MOVE : 0) + RUN + 0.2; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const age = this.age;
    if (this.cur === 0) {
      this.row(ctx, c, ROWS.up, 320, clamp01(age / RUN) * RUN, { brackets: true });
      return;
    }
    const k = inOutSine(clamp01(age / MOVE));
    const yTop = lerp(320, 200, k);
    ctx.save(); ctx.globalAlpha = lerp(1, 0.38, k);
    this.row(ctx, c, ROWS.up, yTop, RUN, { brackets: false });
    ctx.restore();
    if (k < 1) return;
    const t = clamp01((age - MOVE) / RUN) * RUN;
    ctx.save(); ctx.globalAlpha = clamp01((age - MOVE) / 0.3);
    this.row(ctx, c, ROWS.down, 420, t, { brackets: true });
    ctx.restore();
  }

  /** One road with its car at time t (s), ghosts at the whole seconds already passed. */
  row(ctx, c, r, y, t, o) {
    const spec = trackSpec({ from: 0.5, to: 44, x0: 30, x1: 650, y });
    drawTrack(ctx, c, spec, { kind: 'road', every: 1000, origin: null, depth: 56 });
    const marks = [];
    for (let i = 0; i <= 4 && i <= t + 1e-6; i++) marks.push(NOSE0 + xAt(r, i));
    const tone = r.a > 0 ? 1 : 5, ink = c['s' + tone + 'ink'] ?? c.label;
    ctx.save(); ctx.font = font(c, 800, 26, true); ctx.fillStyle = alpha(c.label, 0.8); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(r.tag, 36, y + 2);
    ctx.restore();
    if (marks.length) {
      const gaps = marks.slice(1).map((m, i) => fmt(m - marks[i]) + ' m');
      drawStrobe(ctx, c, spec, {
        at: marks, gaps: o.brackets && marks.length > 1, gapLabels: gaps, bracketY: y + 72, fade: 0.9, tone,
        draw: (cx, x, yy) => {
          cx.beginPath(); cx.arc(x, y, 8, 0, Math.PI * 2); cx.fillStyle = c['s' + tone]; cx.fill();
          cx.lineWidth = 3; cx.strokeStyle = ink; cx.stroke();
        },
      });
    }
    const m = NOSE0 + xAt(r, t), x = spec.toPx(m) - CAR / 2, top = y - 84;
    drawCar(ctx, c, { x, y, length: CAR, tone, roll: xAt(r, t), pxPerM: spec.scale });
    const v = vAt(r, t);
    drawMotionArrow(ctx, c, 'v', x, top - 62, { length: v * V_SCALE, label: 'v = ' + fmt(v) + ' m/s', side: 1 });
    drawMotionArrow(ctx, c, 'a', x, top - 14, { length: A_LEN, angle: r.a > 0 ? 0 : Math.PI, label: 'a = ' + fmt(Math.abs(r.a)) + ' m/s' + SUP2, side: r.a > 0 ? 1 : -1 });
  }
}
