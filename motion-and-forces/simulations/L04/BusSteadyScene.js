/**
 * BusSteadyScene - predict blk-l04-s2 (setup) and explain blk-l04-s3 (1 beat).
 * Setup (hostRole 'setup'): a bus on a straight highway at a steady 54 km/h; the
 *   road streams past, the speedometer needle stays on 54, the velocity arrow keeps
 *   its length. Nothing about how the velocity changes is shown.
 * b0 (explain): the same dial; one bus drives along the road and leaves a mark on
 *   the road every 1 s. Positions come from x = v t with v = 15 m/s (54 km/h), so
 *   the gaps are equal (15 m each); the v arrow keeps its length, and the
 *   acceleration is the zero dot, a = 0.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01 } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawStrobe, drawSpeedometer, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawBus } from 'simulations/base/kit/SimVehicles.js';

const KMH = 54, V = 15;              // m/s
const DASH = 46;                     // kit road dash period, px
const RUN = 3;                       // s of the strobe run (ghosts at 0, 1, 2, 3 s)
const SCROLL_S = 8;                  // setup: s of streaming road before the frame rests

export class BusSteadyScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A bus moves along a straight highway. Its speedometer stays at 54 km/h and its velocity arrow keeps the same length. Pictures of the bus taken every second are equal distances apart, 15 m each, and its acceleration is zero.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.isSetup() ? this.age < SCROLL_S : this.age < RUN + 1.4; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawSpeedometer(ctx, c, { x: 138, y: 122, r: 108, max: 80, major: 20, minor: 5, value: KMH });
    if (this.isSetup()) this.cruise(ctx, c); else this.strobe(ctx, c);
  }

  // Setup: the camera rides with the bus; the road streams past at 15 m/s on the bus's own scale.
  cruise(ctx, c) {
    const length = 360, ground = 440, pxPerM = length / 12, m = V * Math.min(this.age, SCROLL_S);
    const off = (m * pxPerM) % DASH;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 680, 520); ctx.clip();
    ctx.translate(-off, 0);
    drawTrack(ctx, c, trackSpec({ from: 1, to: 2, x0: -60, x1: 760, y: ground }), { kind: 'road', depth: 72, origin: null, every: 1e6 });
    ctx.restore();
    const bus = drawBus(ctx, c, { x: 400, y: ground, length, roll: m, tone: 6 });
    drawMotionArrow(ctx, c, 'v', bus.x0 + 70, bus.y0 - 30, { length: 180, label: 'v = ' + KMH + ' km/h' });
  }

  // Explain: one run along a fixed road, a ghost left every 1 s, equal gaps, a = 0.
  strobe(ctx, c) {
    const spec = trackSpec({ from: 97, to: 148, x0: 30, x1: 650, y: 372 });
    drawTrack(ctx, c, spec, { kind: 'road', depth: 72, origin: null, every: 1e6 });
    const L = 270, t = clamp01(this.age / RUN) * RUN, now = 100 + V * t;
    // Equal-time marks: a dot on the road where the nose was at 0, 1, 2 and 3 s; brackets once two have landed.
    const dropped = [0, 1, 2, 3].filter((k) => k <= t + 1e-6).map((k) => 100 + V * k);
    drawStrobe(ctx, c, spec, { at: dropped, fade: 1, gaps: dropped.length > 1, bracketY: spec.y + 84, tone: 4,
      gapLabels: dropped.map(() => '15 m in 1 s'),
      draw: (g, x, y) => {
        g.beginPath(); g.arc(x, y + 18, 9, 0, Math.PI * 2); g.fillStyle = c.s4; g.fill();
        g.strokeStyle = c.s4ink; g.lineWidth = 2.5; g.stroke();
      } });
    // The one bus, nose on the current position (the bus is drawn larger than the road scale so it reads at 390).
    const nose = spec.toPx(now), bus = drawBus(ctx, c, { x: nose - L / 2, y: spec.y, length: L, roll: V * t, tone: 6 });
    drawMotionArrow(ctx, c, 'v', bus.x0 + 40, bus.y0 - 26, { length: 160, label: 'v = ' + KMH + ' km/h' });
    if (this.age >= RUN) drawMotionArrow(ctx, c, 'a', bus.x0 + L / 2, bus.y0 - 112, { magnitude: 0, label: 'a = 0' });
  }
}
