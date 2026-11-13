/**
 * PlotPointsScene - slide blk-l05-n01 "Plot it point by point" (2 beats). A thin subclass of
 * PlotPositionScene (MODE 'points'): b0 the 1 s point by its guides, then the other six rows;
 * b1 the line through the 7 points and the in-between point (2.5 s, 50 m).
 */
import { PlotPositionScene } from './PlotPositionScene.js';

export class PlotPointsScene extends PlotPositionScene {
  static MODE = 'points';

  /** Same picture as the parent; MODE picks its beats. */
  draw(ctx, c) { super.draw(ctx, c); }
  static ARIA_LABEL = 'On the position-time graph, a dashed guide rises from 1 second on the X-axis and turns at 20 metres to the Y-axis, and a point is marked there. The other six rows of the table are plotted one by one. Then a straight line joins the seven points, and an in-between point on the line reads 50 metres at 2.5 seconds.';
}
