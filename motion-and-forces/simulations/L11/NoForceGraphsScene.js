/**
 * NoForceGraphsScene - slide blk-l11-n02 "Graphs with no net force" (2 beats; Figs 6.15, 6.16).
 * MODE 'graphs' of FirstLawScene, drawn there: a floor strip with the block on top, position-time and
 * velocity-time graphs below.
 *   b0 'rest'    at rest: flat position line, velocity on the time axis ("v = 0").
 *   b1 'moving'  constant velocity: a straight rising position line in step with the block, a flat velocity
 *                line above the time axis.
 */
import { FirstLawScene } from './FirstLawScene.js';

export class NoForceGraphsScene extends FirstLawScene {
  static MODE = 'graphs';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static BEAT_MAPS = {};
  draw(ctx, c) { super.draw(ctx, c); }
  static ARIA_LABEL = 'Graphs with no net force. A block on a smooth floor and two graphs: position against time and velocity against time. When the block is at rest at a marked position, its position-time graph is a flat line at that position and its velocity-time graph lies on the time axis: the velocity is zero. When the block moves with a constant velocity, leaving equally spaced dots, its position-time graph is a straight line that rises steadily, drawn in step with the block, and its velocity-time graph is a flat line above the time axis.';
}
