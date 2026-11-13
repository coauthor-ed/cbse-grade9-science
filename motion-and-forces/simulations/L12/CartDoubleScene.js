/**
 * CartDoubleScene - slide blk-l12-n01 "Double the pull" (2 beats). Thin: CartLabScene MODE 'double'.
 *   b0 'time'   two runs stacked over the same distance, "cup" and "double the coins"; stopwatches T1, T2;
 *               a2 = 1.8 a1, so T2 = T1 / sqrt 1.8 and the lower cart arrives first; tag a1 / a2 = T2 sq / T1 sq.
 *   b1 'larger' bars a1 and a2 = 1.8 a1 with a dashed outline at 2 a1; "friction on the wheels" on the lower cart.
 */
import { CartLabScene } from './CartLabScene.js';

export class CartDoubleScene extends CartLabScene {
  static MODE = 'double';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  draw(ctx, c) { super.draw(ctx, c); }
  static ARIA_LABEL = 'Double the pull. Two identical carts are released together from the start line and run the same distance to the pipe. The top one is pulled by a cup with some coins and is timed with a stopwatch, T1. The bottom one is pulled by a cup with double the coins and is timed, T2. The bottom cart arrives first, so T2 is shorter. Since the distance is the same, a1 divided by a2 equals T2 squared divided by T1 squared. Then two acceleration bars: a2 is larger than a1, but a little less than double it, because friction acts on the wheels of the cart.';
}
