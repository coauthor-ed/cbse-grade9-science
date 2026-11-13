/**
 * AthleteDistanceScene - slide "Distance travelled" (blk-l02-s2, 1 beat). Thin file over AthleteRunScene.
 * b0: she reruns the whole path (O -> A -> B, 160 m at one pace) and a ribbon traces it behind her:
 *     the out leg O to A on the lower lane (100 m), a turn at A, the back leg A to B on the upper
 *     lane (60 m). Each leg's length pops as it ends; then "100 m + 60 m = 160 m".
 *     The ribbon has no arrow heads: distance has no direction. Rests at B.
 * ASCII only.
 */
import { AthleteRunScene } from './AthleteRunScene.js';

const { GO, RIB_OUT, RIB_BACK } = AthleteRunScene.L;
import { drawBackdrop, clamp01, popAt, font } from 'simulations/base/kit/SimLook.js';

const RUN = 2.4;                     // s of screen time for the 160 m trace

export class AthleteDistanceScene extends AthleteRunScene {
  static MODE = 'distance';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'The athlete runs from O to A, 100 m, and back to B, 60 m. A ribbon traces her path in two lanes, with no arrow heads. The total distance travelled is 100 m + 60 m = 160 m.';

  busy() { return this.age < GO + RUN + 1.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const spec = this.spec(), d = clamp01((this.age - GO) / RUN) * 160, moving = this.age > GO && d < 160;
    const m = d <= 100 ? d : 100 - (d - 100);
    this.drawTrack(ctx, c, { letters: ['B', 'A'] });
    this.drawRibbon(ctx, c, { end: 40, d });
    const t100 = GO + RUN * 100 / 160, t160 = GO + RUN;
    this.ribbonLabel(ctx, c, '100 m', spec.toPx(20), RIB_OUT - 32, popAt(this.age, t100));
    this.ribbonLabel(ctx, c, '60 m', spec.toPx(70), RIB_BACK - 34, popAt(this.age, t160));
    this.counter(ctx, c, [['100 m', t160 + 0.2], [' + ', t160 + 0.2], ['60 m', t160 + 0.45], [' = ', t160 + 0.7], ['160 m', t160 + 0.7]]);
    this.drawAthlete(ctx, c, m, { facing: d > 100 ? -1 : 1, dist: d, moving });
  }

  // "100 m + 60 m = 160 m", parts appearing in turn; the total is the biggest.
  counter(ctx, c, parts) {
    const y = 150, size = 30;
    ctx.save(); ctx.font = font(c, 800, size, true);
    const ws = parts.map(([t]) => ctx.measureText(t).width), total = ws.reduce((a, b) => a + b, 0);
    ctx.restore();
    let x = 340 - total / 2;
    parts.forEach(([t, at], i) => {
      const p = popAt(this.age, at);
      if (p) this.say(ctx, c, t, x + ws[i] / 2, y, { size, col: i === 4 ? c.s7ink : c.label, alpha: p.alpha });
      x += ws[i];
    });
  }
}
