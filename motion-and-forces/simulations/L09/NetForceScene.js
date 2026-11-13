/**
 * NetForceScene - slide blk-l09-n01 "The net force" (2 beats; Figs 6.4b, 6.5).
 * Thin file: TugOfWarScene with MODE 'net' (b0 unbalanced tug of war, b1 two people pushing a car).
 * The beats are described and drawn in TugOfWarScene.js.
 */
import { TugOfWarScene } from './TugOfWarScene.js';

export class NetForceScene extends TugOfWarScene {
  static MODE = 'net';
  draw(ctx, c) { super.draw(ctx, c); }
  static ARIA_LABEL = 'The same tug of war, but the right team pulls harder: its pull arrow is longer. The net force is the difference of the two pulls, an arrow pointing right below the rope. The rope and both teams start to move to the right; the left team skids and the ribbon passes the centre line. Then two people push a stalled car from behind; their two push arrows are laid head to tail below the car to make the net force, their sum; the car starts to roll forward.';
}
