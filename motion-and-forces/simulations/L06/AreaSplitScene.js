/**
 * AreaSplitScene - slide blk-l06-n01 (1 beat; Fig 4.18 b): AreaUnderScene in 'split' mode.
 * The 10-20 s strip under car 2's rising line splits into the rectangle ACDE (50 m) and the
 * triangle ABC (25 m); 50 m + 25 m = 75 m.
 */
import { AreaUnderScene } from './AreaUnderScene.js';

export class AreaSplitScene extends AreaUnderScene {
  static MODE = 'split';

  /** Same picture as the parent; MODE picks the split. */
  draw(ctx, c) { super.draw(ctx, c); }
  static ARIA_LABEL = 'A velocity-time graph of a car whose velocity rises steadily. Between 10 and 20 seconds the area under the line splits into a rectangle ACDE, 5 metres per second times 10 seconds, which is 50 metres, and a triangle ABC, one half times 10 seconds times 5 metres per second, which is 25 metres. The displacement is 50 metres plus 25 metres, which is 75 metres.';
}
