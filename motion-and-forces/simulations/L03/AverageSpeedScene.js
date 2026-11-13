/**
 * AverageSpeedScene - slide "Average speed" (blk-l03-s1, 2 beats). Thin file over L02 AthleteRunScene.
 * The book run: O (0 s) -> A at 100 m (10 s) -> back to B at 40 m (16 s), 10 m/s on every leg,
 * so she travels 160 m in 16 s.
 * b0: the run replays once, compressed (PACE screen s per book s). The stopwatch runs to 16 s and a
 *     distance counter follows the path ribbon to 160 m. Then the equation builds under the track:
 *     "160 m" flies down from the counter, "16 s" from the stopwatch, then "= 10 m/s".
 *     The ribbon and the result carry no arrow: average speed has no direction. Rests at B.
 * b1: the run dims (clock and counter go); the equation stays; two big unit chips "m/s" and "km/h" pop above it.
 * Every frame comes from the beat and its age only (cold start safe).
 * ASCII only.
 */
import { AthleteRunScene } from '../L02/AthleteRunScene.js';
import { drawBackdrop, clamp01, popAt, font, pill, chipSize, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';

const { GO } = AthleteRunScene.L;
const PACE = 0.2;                       // screen s per book s (16 s run in 3.2 s)
const RUN_END = GO + 16 * PACE;
const CLOCK = { x: 118, y: 222, r: 46 };
const COUNT = { x: 548, y: 222 };
const EQ_Y = 482, EQ_SIZE = 34, FLY = 0.55;

export class AverageSpeedScene extends AthleteRunScene {
  static MODE = 'speed';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'The athlete runs from O to A at 100 m and back to B at 40 m. A stopwatch runs to 16 s and a counter shows the distance travelled, 160 m. Average speed = 160 m / 16 s = 10 m/s, with no direction. Then the units m/s and km/h are shown.';

  busy() { return this.cur === 1 ? this.age < 1.6 : this.age < RUN_END + 2.4; }

  /** Book time 0..16 s of the replay (b1 and later: the run is over). */
  speedT() { return this.cur === 1 ? 16 : Math.min(16, Math.max(0, this.age - GO) / PACE); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const b1 = this.cur === 1, t = this.speedT(), p = this.runAt(t), moving = !b1 && this.age > GO && t < 16;
    ctx.save();
    if (b1) ctx.globalAlpha *= 0.28;
    this.drawTrack(ctx, c, { letters: ['B', 'A'] });
    this.drawRibbon(ctx, c, { end: 40, d: p.dist });
    if (!b1) {
      drawStopwatch(ctx, c, { ...CLOCK, seconds: t, dialSeconds: 20, text: Math.round(t) + ' s', readout: 'inside' });
      this.say(ctx, c, 'distance', COUNT.x, COUNT.y - 30, { size: 26, weight: 700, col: c.labelMuted });
      this.say(ctx, c, Math.round(p.dist) + ' m', COUNT.x, COUNT.y + 10, { size: 40, col: c.s7ink });
    }
    this.drawAthlete(ctx, c, p.m, { facing: t > 10 || b1 ? -1 : 1, dist: p.dist, moving });
    ctx.restore();
    this.equation(ctx, c, b1);
    if (b1) this.units(ctx, c);
  }

  /** "160 m / 16 s = 10 m/s" under the track; the two numbers fly in from the counter and the clock. */
  equation(ctx, c, b1) {
    const t0 = b1 ? -10 : RUN_END + 0.3;
    const parts = [
      { text: '160 m', col: c.s7ink, at: t0, from: { x: COUNT.x, y: COUNT.y + 10 } },
      { text: '/', col: c.label, at: t0 + 0.6 },
      { text: '16 s', col: c.label, at: t0 + 0.6, from: { x: CLOCK.x, y: CLOCK.y } },
      { text: '=', col: c.label, at: t0 + 1.3 },
      { text: '10 m/s', at: t0 + 1.3, chip: true },
    ];
    ctx.save(); ctx.font = font(c, 800, EQ_SIZE, true);
    const gap = 14, ws = parts.map((q) => q.chip ? chipSize(ctx, c, q.text, EQ_SIZE, true).w : ctx.measureText(q.text).width);
    ctx.restore();
    let x = 340 - (ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1)) / 2;
    parts.forEach((q, i) => {
      const cx = x + ws[i] / 2; x += ws[i] + gap;
      if (this.age < q.at) return;
      if (q.chip) {
        const pp = popAt(this.age, q.at);
        if (pp) pill(ctx, c, q.text, cx, EQ_Y, { size: EQ_SIZE, bg: c.s4, display: true, scale: pp.scale, alpha: pp.alpha });
        return;
      }
      let px = cx, py = EQ_Y;
      if (q.from) {
        const e = inOutSine(clamp01((this.age - q.at) / FLY));
        px = q.from.x + (cx - q.from.x) * e; py = q.from.y + (EQ_Y - q.from.y) * e;
      }
      this.say(ctx, c, q.text, px, py, { size: EQ_SIZE, col: q.col, alpha: q.from ? 1 : (popAt(this.age, q.at)?.alpha ?? 1) });
    });
  }

  /** b1: the two units, big, with their names. */
  units(ctx, c) {
    const chips = [['m/s', 'metre per second', 140, 0.3], ['km/h', 'kilometre per hour', 500, 0.8]];
    for (const [u, name, x, at] of chips) {
      const pp = popAt(this.age, at);
      if (!pp) continue;
      pill(ctx, c, u, x, 178, { size: 60, bg: c.s4, display: true, scale: pp.scale, alpha: pp.alpha });
      this.say(ctx, c, name, x, 246, { size: 26, weight: 700, alpha: pp.alpha });
    }
  }
}
