/**
 * BusJoltScene - slide "The jolt" (blk-l04-s1, 2 beats).
 * b0: a cut-away bus with a standing passenger. It starts suddenly from rest
 *     (the passenger leans back), runs, brakes suddenly (leans forward) and
 *     stops; the road scrolls under it so the motion shows. Short jolt lines at
 *     each lurch. One cycle, then it rests on the braking lurch.
 * b1: the same bus with a large speedometer. The start replays from rest to
 *     36 km/h; two frozen readings appear: t1: 0 km/h and t2: 36 km/h.
 * Every pose and reading is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, alpha, inOutSine, clamp01, pill, popAt } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawSpeedometer } from 'simulations/base/kit/SimTrack.js';
import { drawBusPassenger } from '../shared/MotionCast.js';

const T_GO = 0.5, T_RUN = 1.6, T_BRAKE = 2.8, T_STOP = 4.0;
const REST = 3.3;          // b0 rests here: braking, leaning forward
const A_JOLT = 6;          // m/s2, sudden start and sudden stop (b0)
const LEAN = 0.28;         // rad at the lurch
const DASH = 46;           // kit road dash period, px
const B1_GO = 0.6, B1_T = 2.4, B1_V = 10;   // b1: 0 to 10 m/s (36 km/h) in 2.4 s on screen

// b0 velocity and position, m/s and m, over one loop.
const VMAX = A_JOLT * (T_RUN - T_GO);
function v0(t) {
  if (t < T_GO) return 0;
  if (t < T_RUN) return A_JOLT * (t - T_GO);
  if (t < T_BRAKE) return VMAX;
  if (t < T_STOP) return VMAX - A_JOLT * (t - T_BRAKE);
  return 0;
}
function x0(t) {
  const xr = 0.5 * A_JOLT * (T_RUN - T_GO) ** 2, xc = xr + VMAX * (T_BRAKE - T_RUN);
  if (t < T_GO) return 0;
  if (t < T_RUN) return 0.5 * A_JOLT * (t - T_GO) ** 2;
  if (t < T_BRAKE) return xr + VMAX * (t - T_RUN);
  if (t < T_STOP) { const u = t - T_BRAKE; return xc + VMAX * u - 0.5 * A_JOLT * u * u; }
  return xc + 0.5 * VMAX * (T_STOP - T_BRAKE);
}
// An eased lurch: rises over 0.35 s when the change in velocity starts, falls over 0.5 s after it ends.
function lurch(t, a, b) { return inOutSine(clamp01((t - a) / 0.35)) - inOutSine(clamp01((t - b) / 0.5)); }

export class BusJoltScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A standing passenger holds a strap inside a bus. The bus starts suddenly and she sways back; it brakes suddenly and she sways forward. Then a speedometer reads 0 km/h at the start and 36 km/h a few seconds later.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.cur === 0 ? this.age < REST : this.age < B1_GO + B1_T + 0.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.b0(ctx, c); else this.b1(ctx, c);
  }

  // The road under the bus: the kit road, shifted by the distance travelled so the dashes stream past.
  road(ctx, c, ground, metres, pxPerM) {
    const off = (metres * pxPerM) % DASH, d = 64;
    const spec = trackSpec({ from: 1, to: 2, x0: -60, x1: 760, y: ground + d / 2 - 10 });
    ctx.save();
    ctx.beginPath(); ctx.rect(0, ground - 40, 680, d + 30); ctx.clip();
    ctx.translate(-off, 0);
    drawTrack(ctx, c, spec, { kind: 'road', depth: d, origin: null, every: 1e6 });
    ctx.restore();
  }

  jolt(ctx, c, sk, dir, k) {
    if (k <= 0) return;
    const head = sk?.head ?? sk?.anchors?.head;
    const hx = head?.x ?? 340, hy = head?.y ?? 200;
    ctx.save();
    ctx.strokeStyle = alpha(c.annot, k); ctx.lineWidth = 5.5; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const x = hx - dir * (34 + Math.abs(i) * 6), y = hy + i * 18;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dir * 30, y); ctx.stroke();
    }
    ctx.restore();
  }

  b0(ctx, c) {
    const t = Math.min(this.age, REST);
    const lean = -LEAN * lurch(t, T_GO, T_RUN) + LEAN * lurch(t, T_BRAKE, T_STOP);
    const ground = 440, length = 640, m = x0(t);
    this.road(ctx, c, ground, m, length / 12);
    const { sk } = drawBusPassenger(ctx, c, { x: 340, y: ground, length, lean, roll: m });
    // Jolt lines for 0.6 s from the start of each sudden change, on the side she sways toward.
    const kGo = 1 - clamp01((t - T_GO - 0.1) / 0.6), kStop = 1 - clamp01((t - T_BRAKE - 0.1) / 0.6);
    if (t >= T_GO && t < T_GO + 0.7) this.jolt(ctx, c, sk, -1, kGo);
    if (t >= T_BRAKE && t < T_BRAKE + 0.7) this.jolt(ctx, c, sk, 1, Math.max(kStop, t >= REST ? 1 : 0));
  }

  b1(ctx, c) {
    const age = Math.min(this.age, B1_GO + B1_T + 0.6), u = clamp01((age - B1_GO) / B1_T);
    const v = B1_V * u, m = 0.5 * (B1_V / B1_T) * (u * B1_T) ** 2 + Math.max(0, age - B1_GO - B1_T) * B1_V;
    const lean = -LEAN * (inOutSine(clamp01((age - B1_GO) / 0.35)) - inOutSine(clamp01((age - B1_GO - 0.5) / 0.6))) * 0.8;
    const ground = 508, length = 600;
    this.road(ctx, c, ground, m, length / 12);
    drawBusPassenger(ctx, c, { x: 340, y: ground, length, lean, roll: m });
    const kmh = v * 3.6;
    drawSpeedometer(ctx, c, { x: 140, y: 122, r: 108, max: 60, major: 20, minor: 5, value: kmh });
    const p1 = popAt(age, 0.3), p2 = popAt(age, B1_GO + B1_T);
    if (p1) pill(ctx, c, 't1: 0 km/h', 300, 74, { size: 30, align: 'left', bg: c.s1, scale: p1.scale, alpha: p1.alpha, display: true });
    if (p2) pill(ctx, c, 't2: 36 km/h', 300, 160, { size: 30, align: 'left', bg: c.s1, scale: p2.scale, alpha: p2.alpha, display: true });
  }
}
