/**
 * MomentumScene - slide blk-l12-n03 "Momentum, for later" (1 beat).
 * The highway, two lanes seen from the side: a loaded truck drives in slowly (short v arrow) and a small
 * car drives in fast (long v arrow). Under each, a momentum bar whose length is mass x velocity
 * (truck: mass 8, speed 1; car: mass 1, speed 3, in the scene's own units: no numbers on screen),
 * so the slow heavy truck has the longer bar. Tag "momentum = mass x velocity"; a small "higher grades"
 * tag in a corner. Rest: both vehicles shown moving (v arrows), bars full.
 * Every frame is a function of the age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, rr, lighten, darken, alpha, font } from 'simulations/base/kit/SimLook.js';
import { drawTruck, drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack } from 'simulations/base/kit/SimTrack.js';
import { drawMotionArrow } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';

const NOSE = 332, RUN = 3.0, LEAD = 0.2, PX_V = 50, PX_P = 45, SCREEN = 40, BAR_X = 40, BAR_H = 30;
const LANES = [
  { kind: 'truck', m: 8, v: 1, y: 206, len: 250, real: 7.5, tone: 8, bar: 256 },
  { kind: 'car', m: 1, v: 3, y: 396, len: 150, real: 4.2, tone: 1, bar: 446 },
];
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));

export class MomentumScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A highway with a heavily loaded truck moving slowly and a small car moving fast. Each has a velocity arrow: short for the truck, long for the car. Under each is a momentum bar, mass multiplied by velocity. The slow but heavy truck has the longer momentum bar; the fast but light car has the shorter one. Momentum points the same way as the velocity. A note in the corner says this is for higher grades.';

  constructor(container, config) { super(container, config); }
  enter() {}
  busy() { return this.age < LEAD + RUN + 1.2; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const a = this.age, tt = Math.min(RUN, Math.max(0, a - LEAD)), kb = ease(a, LEAD + RUN + 0.1, 0.7);
    drawTag(ctx, c, 'momentum = mass x velocity', 340, 34, { col: c.s6, alpha: ease(a, 0.2, 0.5) });
    LANES.forEach((L) => this.lane(ctx, c, L, tt, kb));
    drawTag(ctx, c, 'higher grades', 580, 496, { alpha: 0.85 });
  }

  /** One lane: road, vehicle driving in at its own speed, v arrow, momentum bar. */
  lane(ctx, c, L, tt, kb) {
    const spec = trackSpec({ from: 0, to: 680, x0: 0, x1: 680, y: L.y });
    drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 30 });
    const nose = NOSE - SCREEN * L.v * (RUN - tt), cx = nose - L.len / 2, roll = (nose * L.real) / L.len;
    const o = { x: cx, y: L.y, length: L.len, roll, tone: L.tone };
    const body = L.kind === 'truck' ? drawTruck(ctx, c, { ...o, kind: 'box' }) : drawCar(ctx, c, o);
    const my = body.box ? body.box.y0 + body.box.h * 0.42 : L.y - 40;
    drawMotionArrow(ctx, c, 'v', nose + 8, my, { length: PX_V * L.v, label: 'v', side: 1 });
    if (kb > 0) this.bar(ctx, c, L.bar, PX_P * L.m * L.v * kb, kb);
  }

  /** A momentum bar: a slab with a pointed front (it points along the velocity), a lit top, a shaded
   *  foot and a rim (Quill), its name beside it. */
  bar(ctx, c, y, w, k) {
    const col = c.s6, x = BAR_X, h = BAR_H, top = y - h / 2, tip = Math.min(18, w / 2), r = 9;
    const shape = () => {
      ctx.beginPath();
      ctx.moveTo(x + r, top); ctx.lineTo(x + w - tip, top); ctx.lineTo(x + w, y); ctx.lineTo(x + w - tip, top + h);
      ctx.lineTo(x + r, top + h); ctx.arcTo(x, top + h, x, top, r); ctx.arcTo(x, top, x + r, top, r); ctx.closePath();
    };
    ctx.save();
    ctx.translate(0, 4); shape(); ctx.fillStyle = darken(col, 0.35); ctx.fill(); ctx.translate(0, -4);
    shape(); ctx.fillStyle = col; ctx.fill();
    ctx.save(); shape(); ctx.clip();
    ctx.fillStyle = darken(col, 0.12); ctx.fillRect(x, top + h * 0.62, w, h);
    ctx.fillStyle = alpha(lighten(col, 0.5), 0.7); rr(ctx, x + 8, top + 5, Math.max(0, w - 16 - tip), 5, 3); ctx.fill();
    ctx.restore();
    shape(); ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.globalAlpha *= k; ctx.font = font(c, 800, 26, true); ctx.fillStyle = c.label; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('momentum', x + w + 12, y + 1);
    ctx.restore();
  }
}
