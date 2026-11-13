/**
 * SpeedometerScene - slide "Velocity at an instant" (blk-l03-n04, 2 beats).
 * A girl on a scooter rides a straight highway. Her velocity follows one fixed smooth curve:
 *   v(t) = 10 - 4 cos(3 pi t / 20) m/s for 0 <= t <= 20 s (6 -> 14 -> 6 -> 14 m/s),
 *   x(t) = 10 t - (80 / (3 pi)) sin(3 pi t / 20) m, so x(20) = 200 m: average velocity 10 m/s.
 * Playback is compressed; tags and gauges show the curve's values.
 * b0: the highway, marked 0..250 m (she rides 0..200 m). She speeds up, slows for a moment, speeds up. Equal-time dots (every 2 s,
 *     from x(t)) drop on the road behind her: wide gaps fast, close gaps slow. A fixed tag
 *     "average velocity 10 m/s" for the whole trip; a changing tag "velocity now .. m/s".
 *     Rests at t = 20 s: now 14 m/s, average 10 m/s.
 * b1: the same ride from t = 0 to 10 s, the road sliding under her. A large speedometer (km/h) reads
 *     v(t) x 3.6; the v arrow on the scooter points along the road, its length from v.
 *     Rests at t = 10 s: needle 36 km/h, arrow "10 m/s".
 * Frames depend on the beat and its age only.
 * ASCII only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, popAt, font, alpha } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawStrobe, drawSpeedometer } from 'simulations/base/kit/SimTrack.js';
import { drawHighway, drawScooterGirl, drawMotionArrow } from '../shared/MotionCast.js';

const TT = 20, K3 = 3 * Math.PI / TT;
const vAt = (t) => 10 - 4 * Math.cos(K3 * t);
const xAt = (t) => 10 * t - (4 / K3) * Math.sin(K3 * t);
const GO = 0.6;
const PACE0 = 0.18, PACE1 = 0.26;      // screen s per book s
const END1 = 10;                       // b1 rests here: v = 10 m/s
const ROAD_Y = 404, LEN = 176;

export class SpeedometerScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A girl rides a scooter 200 m along a straight highway in 20 s, so her average velocity is 10 m/s. On the way she speeds up, slows down for a moment and speeds up again: her velocity at an instant goes from 6 m/s to 14 m/s and back. Then a speedometer follows her velocity; at the end it reads 36 km/h and her velocity arrow along the road reads 10 m/s.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  b1() { return this.cur === 1; }
  busy() { return this.age < GO + (this.b1() ? END1 * PACE1 : TT * PACE0) + 1.2; }
  bookT() {
    const u = Math.max(0, this.age - GO);
    return this.b1() ? Math.min(END1, u / PACE1) : Math.min(TT, u / PACE0);
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.b1()) this.drawGauge(ctx, c); else this.drawTrip(ctx, c);
  }

  // b0: the trip on the marked highway.
  drawTrip(ctx, c) {
    const t = this.bookT(), xm = xAt(t), v = vAt(t);
    const spec = trackSpec({ from: 0, to: 250, x0: 110, x1: 630, y: ROAD_Y });   // runs past 200 m so she ends on the road
    drawHighway(ctx, c, spec, { every: 50 });
    const at = [];
    for (let k = 0; k * 2 <= t + 1e-6; k++) at.push(xAt(k * 2));
    drawStrobe(ctx, c, spec, { at, marks: 'dots', markTone: 's1' });
    drawScooterGirl(ctx, c, { x: spec.toPx(xm), y: ROAD_Y, length: LEN, roll: xm });
    pill(ctx, c, 'average velocity 10 m/s', 340, 62, { size: 30, bg: c.s4, display: true });
    this.say(ctx, c, '200 m in 20 s', 340, 108);
    const pp = popAt(this.age, GO);
    if (pp) pill(ctx, c, 'velocity now ' + Math.round(v) + ' m/s', 340, 168, { size: 30, bg: c.s1, display: true, scale: pp.scale, alpha: pp.alpha });
  }

  // b1: the road slides under her; speedometer and velocity arrow agree.
  drawGauge(ctx, c) {
    const t = this.bookT(), xm = xAt(t), v = vAt(t), X = 470;
    const spec = trackSpec({ from: 0, to: 200, x0: 20, x1: 660, y: ROAD_Y });
    drawHighway(ctx, c, spec, { ticks: false, scroll: xm });
    drawSpeedometer(ctx, c, { x: 168, y: 176, r: 118, max: 60, major: 10, minor: 5, value: v * 3.6, unit: 'km/h', digital: Math.round(v * 3.6) + ' km/h' });
    drawScooterGirl(ctx, c, { x: X, y: ROAD_Y, length: LEN, roll: xm });
    drawMotionArrow(ctx, c, 'v', X - 36, ROAD_Y - 196, { length: v * 12, label: Math.round(v) + ' m/s', side: 1 });
  }

  say(ctx, c, text, x, y, o = {}) {
    ctx.save();
    ctx.font = font(c, o.weight ?? 700, o.size ?? 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = alpha(c.bgSurface, 0.9); ctx.lineWidth = 7; ctx.strokeText(text, x, y);
    ctx.fillStyle = o.col ?? c.labelMuted; ctx.fillText(text, x, y);
    ctx.restore();
  }
}
