/**
 * BoxForcesScene - slide blk-l10-n01 "Other forces on the box" (1 beat; Fig 6.11).
 * Thin file: BoxPushScene draws it (MODE 'four'): the box sliding steadily, you faded; push,
 * friction, weight and normal force appear in that order, the normal force last.
 */
import { BoxPushScene } from './BoxPushScene.js';

export class BoxForcesScene extends BoxPushScene {
  static MODE = 'four';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  draw(ctx, c) { super.draw(ctx, c); }   // MODE 'four': BoxPushScene.four draws the beat
  static ARIA_LABEL = 'A box slides slowly along a floor. Four forces act on it: your push forward, friction backward at its bottom, its weight pulling it down, and the normal force from the floor pushing it up at right angles to the floor. The weight and the normal force are equal, so they balance. A faint streak of air behind the box.';
}
