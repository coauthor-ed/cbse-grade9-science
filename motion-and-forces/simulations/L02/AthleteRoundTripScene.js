/**
 * AthleteRoundTripScene - predict blk-l02-s3 (setup) and explain blk-l02-s4 (1 beat). Thin file over AthleteRunScene.
 * Setup (hostRole 'setup' or beat MAX_SAFE_INTEGER): she runs O to A (100 m) and back to O once,
 *   then rests at O facing back. Ruler shows only O and 100 m; no arrow, ribbon or answer.
 * b0 (explain): the same run; the ribbon traces her path out and back (200 m) while the dashed
 *   displacement arrow always joins O to where she is: it grows to 100 m at A, then shrinks as
 *   she returns and ends as a dot at O labelled "0 m". Ribbon label "200 m".
 * ASCII only.
 */
import { AthleteRunScene } from './AthleteRunScene.js';

const { GO, RIB_BACK } = AthleteRunScene.L;
import { drawBackdrop, clamp01, popAt } from 'simulations/base/kit/SimLook.js';

const RUN = 3.6;                     // s of screen time for the 200 m run

export class AthleteRoundTripScene extends AthleteRunScene {
  static MODE = 'roundtrip';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'The athlete runs from O to A, 100 m away, and back to O. Her path traced out and back is 200 m long, but the displacement arrow from O to her shrinks to a dot at O: her displacement is 0 m.';

  busy() { return this.age < GO + RUN + 0.9; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const setup = this.isSetup();
    const d = clamp01((this.age - GO) / RUN) * 200, moving = this.age > GO && d < 200;
    const m = d <= 100 ? d : 200 - d, facing = d > 100 ? -1 : 1;
    this.drawTrack(ctx, c, { letters: ['A'], every: setup ? 100 : 10 });
    if (!setup) {
      this.drawRibbon(ctx, c, { end: 0, d });
      this.ribbonLabel(ctx, c, '200 m', 340, RIB_BACK - 34, popAt(this.age, GO + RUN), { size: 30 });
      this.sArrow(ctx, c, m, d >= 200 ? '0 m' : Math.round(m) + ' m', { size: d >= 200 ? 32 : 28 });
    }
    this.drawAthlete(ctx, c, m, { facing, dist: d, moving });
  }
}
