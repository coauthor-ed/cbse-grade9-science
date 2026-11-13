/**
 * ThoughtExperimentScene - slide blk-l10-n03 "A thought experiment" (2 beats). MODE 'thought' of CoinStackScene.
 *   b0 'imagine'  the coin-stack lane drawn as an imagined one: a cloud edge round it, a cool glassy
 *                 surface with a soft glow; the band at A and B, the stack pushed back to C;
 *                 tag "friction = 0" (the hero). Rest: still.
 *   b1 'release'  the stack is released, leaves the band and slides off the right edge of the lane,
 *                 which runs on past the frame; a large "?" at the end. No dots, no speed readout
 *                 (the answer comes in the next lesson). Rest: stack gone, "?".
 */
import { CoinStackScene } from './CoinStackScene.js';

export class ThoughtExperimentScene extends CoinStackScene {
  static MODE = 'thought';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  draw(ctx, c) { super.draw(ctx, c); }
  static ARIA_LABEL = 'A thought experiment. An imagined table lane, glassy and smooth, with no friction at all between the floor and a coin stack. A rubber band is held at marks A and B and the stack is pushed back to mark C. Then the stack is released: it leaves the band and slides off the end of the lane. A large question mark asks: will its velocity decrease, and will it ever stop?';
}
