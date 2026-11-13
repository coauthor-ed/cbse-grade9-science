/**
 * NotARouteScene - slide blk-l05-n03 "A graph is not a route map" (1 beat). A thin subclass of
 * CurvedGraphScene (MODE 'route'): the same vehicle and data, x = t2 / 4 m. The car drives the
 * straight road while a dot climbs the curve in step; one position tag in one tone sits on the
 * road at the car's mark and at the dot's height on the Y-axis. Rest: car at 36 m, both "36 m".
 */
import { CurvedGraphScene } from './CurvedGraphScene.js';

export class NotARouteScene extends CurvedGraphScene {
  static MODE = 'route';

  /** Same picture as the parent; MODE picks its beats. */
  draw(ctx, c) { super.draw(ctx, c); }
  static ARIA_LABEL = 'A car drives along a straight road from 0 to 36 metres, speeding up. Below it, a dot climbs the curved position-time graph in step with the car. The same position tag sits on the road at the car and on the graph at the height of the dot, ending at 36 metres. The road is straight; the curve shows how the position changes with time.';
}
