/**
 * PoolVelocityScene - slide "Average velocity" (blk-l03-s3, 2 beats). Reuses PoolLapScene's pool,
 * number line and swimmer.
 * b0: Sarang (top lane) swims one length, 0 to 25 m: a dashed displacement arrow grows over the
 *     pool, "s = +25 m", and his velocity arrow points the same way, "v = +1 m/s". Then, once, a
 *     swimmer in the bottom lane swims 25 to 0 m: the displacement arrow under the number line and
 *     the velocity arrow both point left, with "-". Rests on both. 1 m/s: 25 s per length.
 * b1: Sarang alone (middle lane) swims 0 to 25 m in 25 s (about 4 s on screen); a pin drops from
 *     him to the number line and a large tag under it reads his position, ticking 0 to 25 m in
 *     step with the stopwatch: the position changes by 1 m every second.
 */
import { drawBackdrop, clamp01, alpha, pill } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { PoolLapScene } from './PoolLapScene.js';

const LEN_S = 2.4;          // screen seconds per length in b0
const RUN_S = 4.2;          // screen seconds for b1's 25 s
const OTHER = { skin: 3, hairStyle: 'bun', hair: 0, outfit: 'tee', top: 's7', bottomStyle: 'shorts', bottom: 'charcoal' };

export class PoolVelocityScene extends PoolLapScene {
  // Lower pool than the lap: room for the s and v arrows above it, and below it before the scale.
  static POOL = { ...PoolLapScene.POOL, top: 150, scaleY: 408 };
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A 25 m pool seen from above with a number line from 0 to 25 m. Sarang swims one length to the right: his displacement arrow is plus 25 m and his velocity arrow points the same way, plus 1 m/s. A second swimmer swims to the left: displacement minus 25 m and velocity minus 1 m/s, both arrows pointing left. Then Sarang swims again while a tag under him reads his position, 0 to 25 m, as the stopwatch runs to 25 s.';

  isSetup() { return false; }
  busy() { const G = this.constructor.GO; return this.cur === 0 ? this.age < G + 2 * LEN_S + 0.6 : this.age < G + RUN_S + 0.3; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this.twoWays(ctx, c); else this.ticking(ctx, c);
  }

  twoWays(ctx, c) {
    const G = this.constructor.GO, P = this.constructor.POOL, s = this.poolSpec();
    const u1 = clamp01((this.age - G) / LEN_S), u2 = clamp01((this.age - G - LEN_S - 0.3) / LEN_S);
    const p1 = 25 * u1, p2 = 25 - 25 * u2, y1 = this.laneY(0), y2 = this.laneY(1);
    this.drawPool(ctx, c, { scroll: this.age * 3 });
    this.drawPoolScale(ctx, c);
    const bot = P.top + P.laneH * P.lanes;
    // Sarang, left to right.
    this.drawSwimmer(ctx, c, { x: this.swimmerX(p1, 1), y: y1, dir: 1, dist: p1 });
    if (p1 > 0.3) {
      drawMotionArrow(ctx, c, 's', s.toPx(0), P.top - 82, { length: s.toPx(p1) - s.toPx(0), label: u1 >= 1 ? 's = +25 m' : null });
      // v rides on the deck beside him, its head level with his head.
      drawMotionArrow(ctx, c, 'v', s.toPx(p1) - 104, P.top - 15, { length: 90, label: 'v = +1 m/s', side: 1 });
    }
    // The second swimmer, right to left, once Sarang has arrived.
    this.drawSwimmer(ctx, c, { x: this.swimmerX(p2, -1), y: y2, dir: -1, dist: 25 - p2, look: OTHER });
    if (u2 > 0.01) {
      drawMotionArrow(ctx, c, 's', s.toPx(25), P.scaleY + 66, { length: s.toPx(25) - s.toPx(p2), angle: Math.PI, label: u2 >= 1 ? 's = -25 m' : null, side: 1 });
      drawMotionArrow(ctx, c, 'v', s.toPx(p2) + 104, bot + 15, { length: 90, angle: Math.PI, label: 'v = -1 m/s', side: 1 });
    }
  }

  ticking(ctx, c) {
    const G = this.constructor.GO, P = this.constructor.POOL, s = this.poolSpec();
    const t = clamp01((this.age - G) / RUN_S) * 25, p = t, y = this.laneY(1), x = s.toPx(p);
    this.drawPool(ctx, c, { scroll: t * 0.5 });
    this.drawPoolScale(ctx, c);
    this.drawSwimmer(ctx, c, { x: this.swimmerX(p, 1), y, dir: 1, dist: p });
    // Pin from Sarang to the number line, then the position tag: the biggest thing on screen.
    ctx.save();
    ctx.strokeStyle = alpha(c.annot, 0.9); ctx.lineWidth = 3; ctx.setLineDash([6, 7]);
    ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(x, P.scaleY - 6); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = c.annot; ctx.beginPath(); ctx.arc(x, P.scaleY, 8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const tx = Math.max(100, Math.min(580, x));
    pill(ctx, c, Math.round(p) + ' m', tx, 482, { size: 48, bg: c.annot, display: true });
    drawStopwatch(ctx, c, { x: 600, y: 64, r: 50, seconds: t, text: Math.round(t) + ' s', readout: 'inside' });
  }
}
