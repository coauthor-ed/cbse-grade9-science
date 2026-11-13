/**
 * AthleteDisplacementScene - slide "Displacement" (blk-l02-n01, 2 beats). Thin file over AthleteRunScene.
 * b0: she stands at B (end of the run, t = 16 s). The dashed displacement arrow grows from O to B,
 *     labelled "40 m"; the ruler shows the + direction (kit signs, below the numbers). Tags
 *     "t = 0 s" at O and "t = 16 s" at B.
 * b1: the 160 m path ribbon traces above the arrow; "distance 160 m" beside the ribbon and
 *     "displacement 40 m" on the arrow: every metre counted against start joined to end.
 * ASCII only.
 */
import { AthleteRunScene } from './AthleteRunScene.js';

const { GO } = AthleteRunScene.L;
import { drawBackdrop, clamp01, popAt, inOutSine } from 'simulations/base/kit/SimLook.js';

const GROW = 0.8, TRACE = 1.8;
const RIB_LABEL_Y = 66;

export class AthleteDisplacementScene extends AthleteRunScene {
  static MODE = 'displacement';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'The athlete stands at B, 40 m from O, at t = 16 s. A dashed displacement arrow runs from O to B: 40 m in the positive direction. Above it, a ribbon of her whole path shows the distance travelled, 160 m, while the displacement is 40 m.';

  busy() { return this.age < GO + (this.cur === 1 ? TRACE : GROW) + 0.8; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    this.drawTrack(ctx, c, { letters: ['B', 'A'], signs: true });
    if (this.cur === 1) {
      const d = clamp01((this.age - GO) / TRACE) * 160;
      this.drawRibbon(ctx, c, { end: 40, d });
      this.ribbonLabel(ctx, c, 'distance 160 m', 52, RIB_LABEL_Y, popAt(this.age, GO + TRACE), { align: 'left' });
      this.sArrow(ctx, c, 40, 'displacement 40 m');
    } else {
      const u = inOutSine(clamp01((this.age - GO) / GROW));
      this.sArrow(ctx, c, 40 * u, u >= 1 ? '40 m' : '');
      this.timeTag(ctx, c, 0, 't = 0 s', 1, popAt(this.age, 0.2));
      this.timeTag(ctx, c, 40, 't = 16 s', 1, popAt(this.age, 0.4));
    }
    this.drawAthlete(ctx, c, 40, { facing: -1 });
  }
}
