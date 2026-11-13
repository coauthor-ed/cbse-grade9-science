/**
 * BusHighwayScene - slide "The bus on the highway" (blk-l04-n03, 2 beats; Example 4.3).
 * b0: the driver presses the accelerator for 10 s: v(t) = 10 + 0.5 t m/s, so the
 *     needle goes 36 to 54 km/h while the stopwatch counts 0 to 10 s. The camera
 *     rides with the bus (the road streams past at v on the bus's own scale). The v
 *     arrow grows; the a arrow points forward with a fixed length, 0.5 m/s2.
 * b1: an obstacle ahead; the bus brakes: v(t) = 15 - 3 t, stops at t = 5 s after
 *     x = 15 t - 1.5 t2 = 37.5 m (fixed camera; the run is drawn at 7 px per m).
 *     The v arrow shrinks to the zero dot; the a arrow points backward, 6 times the
 *     0.5 arrow (lengths proportional to a), labelled -3 m/s2.
 * Each run plays in about 3 s on screen; the stopwatch and needle show the slide's seconds and values.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, rr, darken, lighten, alpha } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawSpeedometer, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawBus } from 'simulations/base/kit/SimVehicles.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';

const SQ = String.fromCharCode(178);
const PLAY = 3;                      // s of screen time per run; the gauges show the slide's seconds
const GO = 0.6;                      // s of stillness before the run
const V_PX = 12, A_PX = 72;          // arrow px per m/s and per m/s2 (0.5 -> 36 px, 3 -> 216 px)
const DASH = 46;
const ROAD_Y = 444, BUS_L = 300;
const B1_X0 = 160, B1_K = 7;         // b1: bus centre at the start (px), px per metre of the run

export class BusHighwayScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A bus on a highway. In 10 s its speedometer rises from 36 to 54 km/h, that is from 10 to 15 m/s, with a short forward acceleration arrow of 0.5 m/s squared. Then it brakes for an obstacle and stops in 5 s, with a long backward acceleration arrow of minus 3 m/s squared.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.age < GO + PLAY + 0.2; }

  // Slide seconds since the run began (0 .. dur).
  simT(dur) { return clamp01((this.age - GO) / PLAY) * dur; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.speedUp(ctx, c); else this.brake(ctx, c);
  }

  gauges(ctx, c, t, v) {
    drawSpeedometer(ctx, c, { x: 122, y: 112, r: 104, max: 80, major: 20, minor: 5, value: v * 3.6 });
    drawStopwatch(ctx, c, { x: 336, y: 112, r: 72, seconds: t, text: (Math.round(t * 10) / 10).toFixed(1) + ' s', readout: 'inside' });
  }

  road(ctx, c, scrollPx) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 680, 520); ctx.clip();
    ctx.translate(-(scrollPx % DASH), 0);
    drawTrack(ctx, c, trackSpec({ from: 1, to: 2, x0: -60, x1: 760, y: ROAD_Y }), { kind: 'road', depth: 72, origin: null, every: 1e6 });
    ctx.restore();
  }

  arrows(ctx, c, bus, v, a, aTail) {
    const vy = bus.y0 - 30, ay = bus.y0 - 92;
    if (v < 0.25) drawMotionArrow(ctx, c, 'v', bus.x0 + BUS_L * 0.5, vy, { magnitude: 0, label: 'v = 0' });
    else drawMotionArrow(ctx, c, 'v', bus.x0 + 24, vy, { length: v * V_PX, label: 'v = ' + Math.round(v) + ' m/s' });
    const lab = 'a = ' + (a < 0 ? '-3' : '0.5') + ' m/s' + SQ;
    drawMotionArrow(ctx, c, 'a', aTail, ay, { length: Math.abs(a) * A_PX, angle: a < 0 ? Math.PI : 0, label: lab, side: a < 0 ? -1 : 1 });
  }

  speedUp(ctx, c) {
    const t = this.simT(10), v = 10 + 0.5 * t, m = 10 * t + 0.25 * t * t, pxPerM = BUS_L / 12;
    this.road(ctx, c, m * pxPerM);
    const bus = drawBus(ctx, c, { x: 400, y: ROAD_Y, length: BUS_L, roll: m, tone: 6 });
    this.gauges(ctx, c, t, v);
    this.arrows(ctx, c, bus, v, 0.5, bus.x0 + 24);
  }

  brake(ctx, c) {
    const t = this.simT(5), v = Math.max(0, 15 - 3 * t), m = 15 * t - 1.5 * t * t;
    this.road(ctx, c, 0);
    const x = B1_X0 + m * B1_K, nose = x + BUS_L / 2;
    this.barrier(ctx, c, B1_X0 + 37.5 * B1_K + BUS_L / 2 + 42, ROAD_Y);
    const bus = drawBus(ctx, c, { x, y: ROAD_Y, length: BUS_L, roll: (m * B1_K) / (BUS_L / 12), tone: 6 });
    this.gauges(ctx, c, t, v);
    this.arrows(ctx, c, bus, v, -3, nose);
  }

  // A road barrier: two striped posts and a striped board with a lamp; real shading, tokens only.
  barrier(ctx, c, x, y) {
    const w = 46, h = 92, top = y - h, red = c.bad, pale = c.raised;
    ctx.save();
    ctx.fillStyle = alpha(c.label, 0.18); ctx.beginPath(); ctx.ellipse(x, y + 4, w * 0.8, 7, 0, 0, Math.PI * 2); ctx.fill();
    for (const px of [x - w / 2 + 6, x + w / 2 - 6]) {           // posts
      rr(ctx, px - 4, top + 18, 8, h - 18, 3); ctx.fillStyle = darken(pale, 0.25); ctx.fill();
      ctx.strokeStyle = darken(pale, 0.5); ctx.lineWidth = 2; ctx.stroke();
      rr(ctx, px - 10, y - 6, 20, 8, 3); ctx.fillStyle = darken(red, 0.25); ctx.fill();
    }
    for (const [by, bh] of [[top + 14, 24], [top + 50, 20]]) {    // boards
      ctx.save();
      rr(ctx, x - w / 2 - 14, by, w + 28, bh, 4); ctx.fillStyle = pale; ctx.fill(); ctx.clip();
      ctx.fillStyle = red;
      for (let sx = x - w / 2 - 40; sx < x + w / 2 + 30; sx += 18) {
        ctx.beginPath(); ctx.moveTo(sx, by + bh); ctx.lineTo(sx + 9, by + bh); ctx.lineTo(sx + 9 + bh, by); ctx.lineTo(sx + bh, by); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = alpha(lighten(pale, 0.6), 0.55); ctx.fillRect(x - w / 2 - 14, by + 2, w + 28, 4);
      ctx.fillStyle = alpha(darken(red, 0.5), 0.25); ctx.fillRect(x - w / 2 - 14, by + bh * 0.62, w + 28, bh);
      ctx.restore();
      rr(ctx, x - w / 2 - 14, by, w + 28, bh, 4); ctx.strokeStyle = darken(red, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x, top + 6, 8, 0, Math.PI * 2); ctx.fillStyle = c.warning; ctx.fill();
    ctx.strokeStyle = darken(c.warning, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = alpha(lighten(c.warning, 0.7), 0.9); ctx.beginPath(); ctx.arc(x - 2.5, top + 3.5, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
