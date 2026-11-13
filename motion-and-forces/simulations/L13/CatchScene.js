/**
 * CatchScene - slide blk-l14-s4 "Catching a fast ball" (2 beats; Fig 6.18).
 *   b0 'stiff' a fast cricket ball comes from the LEFT (v arrow); the fielder (she) stands at the right
 *              facing left, hands together in front. The hands stay almost still: the ball stops in a very
 *              short time. "time to stop" bar short; F arrow on the ball from the hands (left) LONG,
 *              "large force". Rest: ball in the hands, short bar, long arrow.
 *   b1 'give'  the same ball; the hands move back with it about a forearm length (eased): the ball takes
 *              5 times longer to stop. Bar long; F arrow short, "smaller force". Under the bar the b0
 *              result stays as a faint row (bar and arrow, "stiff hands"). Rest: both rows.
 * Physics: same arrival speed V in both beats; uniform slowing over the stop time T, so the stop distance
 * is V T / 2 and the force arrow is inverse in T on one scale (stop times 1 : 5 give arrows 5 : 1).
 * Slow motion: the flight and the stop are slowed down alike. Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, font } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawField } from '../shared/ForceCast.js';
import { drawStopBar, drawStopRow, stopForceLen, stopTone } from '../shared/StopTime.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const GY = 470, FX = 566, FH = 330;             // ground, fielder feet x, fielder height
const H0 = { x: 470, y: 290 }, BR = 15;          // catch point (palms), ball radius
const V = 320, X_START = -30, T0 = 0.5;          // ball speed (px/s, slow motion), start x, launch age
const D1 = 66, T_GIVE = 2 * D1 / V, T_STIFF = T_GIVE / 5;   // give: a forearm length; stiff: 5 x quicker
const F_GIVE = 44, BAR = { x: 30, y: 62, w: 200 }, ROW_Y = 150;
const XC = H0.x - 10 - BR * 0.3, T_HIT = T0 + (XC - X_START) / V;   // contact age

export class CatchScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A fielder catches a fast cricket ball coming from the left. With stiff hands the ball stops in a very short time: the time-to-stop bar is short and the force on the ball from her hands is a long arrow, a large force. When she pulls her hands back with the ball, it takes five times longer to stop: the bar is long and the force arrow is five times shorter, a smaller force.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < T_HIT + T_GIVE + 1.2; }

  /** Ball x and speed at age a for a stop of time T: flight at V, then uniform slowing to rest. */
  ball(a, T) {
    if (a < T_HIT) return { x: X_START + V * Math.max(0, a - T0), v: a < T0 ? V : V, s: -1 };
    const s = Math.min(a - T_HIT, T);
    return { x: XC + V * s - V * s * s / (2 * T), v: V * (1 - s / T), s };
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawField(ctx, c, { x0: 0, x1: 680, y: GY, h: 520 - GY, seed: 7 });
    const give = this.cur === 1, T = give ? T_GIVE : T_STIFF, a = this.age;
    const b = this.ball(a, T), moved = b.s < 0 ? 0 : b.x - XC;
    const H = { x: H0.x + moved, y: H0.y + moved * 0.08 };
    const by = H.y;
    // The fielder: hands cupped together in front, the ball between the palms once caught.
    const look = figureLook(c, { skin: 2, hairStyle: 'ponytail', hair: 0, top: 'white', bottom: 'cream', shoeStyle: 'sneaker', mood: 'smile' });
    const spec = { x: FX, y: GY, height: FH, facing: -1, pose: { name: 'stand', crouch: 0.12, lean: 8 },
      hands: [{ x: H.x + 2, y: H.y + 13 }, { x: H.x + 4, y: H.y - 11 }] };
    const caught = b.s >= 0;
    drawFigure(ctx, c, spec, look, { between: caught ? (cx) => this.cricketBall(cx, c, b.x, by) : null });
    if (!caught) this.cricketBall(ctx, c, b.x, by);
    // v arrow on the ball, length with its speed.
    const kv = b.v / V;
    if (kv > 0.05 && a > 0.1) drawMotionArrow(ctx, c, 'v', b.x - 30, by - 40, { length: 84 * kv, label: 'v', side: 1, alpha: Math.min(1, kv * 1.6) });
    // F arrow on the ball from the hands, pointing left; length inverse in the stop time.
    const kf = ease(a, T_HIT, 0.2), len = stopForceLen(T, { tRef: T_GIVE, lenRef: F_GIVE });
    if (kf > 0) {
      const tx = b.x - BR + 2;
      if (give) {
        drawMotionArrow(ctx, c, 'F', tx, by, { length: len * kf, angle: Math.PI, label: '', alpha: kf });
        this.text(ctx, c, 'smaller force', tx - len - 14, by + 2, kf, 'right');
      } else {
        drawMotionArrow(ctx, c, 'F', tx, by, { length: len * kf, angle: Math.PI, label: 'large force', side: -1, alpha: kf });
      }
    }
    // The time-to-stop bar fills while the ball is stopping (full bar = the give time).
    const fill = caught ? Math.min(b.s, T) / T_GIVE : 0;
    drawStopBar(ctx, c, { ...BAR, t01: fill, label: 'time to stop' });
    // b1: the stiff-hands result stays as a faint row under the bar.
    if (give) drawStopRow(ctx, c, { x: BAR.x, y: ROW_Y, w: BAR.w, t01: T_STIFF / T_GIVE, label: 'stiff hands',
      force: stopForceLen(T_STIFF, { tRef: T_GIVE, lenRef: F_GIVE }), angle: Math.PI, alpha: 0.42, gap: 24 });
  }

  text(ctx, c, s, x, y, k, align) {
    ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 800, 26, true); ctx.fillStyle = c.s3ink ?? darken(c.s3, 0.3);
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); ctx.restore();
  }

  /** A red leather cricket ball with a raised seam (side view). */
  cricketBall(ctx, c, x, y) {
    const red = c.s6, rim = darken(red, 0.5);
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, BR, 0, Math.PI * 2); ctx.fillStyle = red; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.arc(x + BR * 0.45, y + BR * 0.45, BR * 1.05, 0, Math.PI * 2); ctx.fillStyle = alpha(darken(red, 0.3), 0.65); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(x - BR * 0.38, y - BR * 0.42, BR * 0.36, BR * 0.2, -0.6, 0, Math.PI * 2); ctx.fillStyle = alpha(lighten(red, 0.6), 0.85); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, BR, 0, Math.PI * 2); ctx.strokeStyle = rim; ctx.lineWidth = 2; ctx.stroke();
    // Seam: two stitched lines across the ball.
    ctx.strokeStyle = alpha(lighten(red, 0.75), 0.95); ctx.lineWidth = 1.6;
    for (const o of [-2.2, 2.2]) { ctx.beginPath(); ctx.ellipse(x + o, y, BR * 0.32, BR * 0.98, 0.25, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
}
