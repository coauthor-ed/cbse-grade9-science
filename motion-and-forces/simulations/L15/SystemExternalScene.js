/**
 * SystemExternalScene - slide blk-l16-s4 "The whole, not the parts" (2 beats; Fig 6.35). Thin: all drawing
 * is SystemScene's MODE 'external' branch (drawExternal, walker).
 *   b0 'vertical'  the two boxes as one system (dashed outline), F to the right; from the system's centre
 *                  "weight (m1 + m2) g" down and "normal force N1 + N2" up, one scale, equal; chip "balance".
 *                  The boxes still speed up to the right (dots), so only F changes the motion.
 *   b1 'body'      a walker (arms and legs moving) inside one dashed outline "one object"; one dot at the
 *                  body's centre with a v arrow; the outline moves with the walker. Rest mid-stride.
 */
import { SystemScene } from './SystemScene.js';

export class SystemExternalScene extends SystemScene {
  static MODE = 'external';
  static BEAT_MAPS = {};
  static ARIA_LABEL = 'Two boxes tied by a string, drawn as one system with a dashed outline. The force F pulls the system to the right. The Earth pulls the system down with its weight, (m1 + m2) g, and the ground pushes it up with the normal forces N1 + N2. The two arrows are equal and opposite, so they balance and only F changes the motion. Then a person walks inside one dashed outline: arms and legs swing, but one dot at the centre of the body moves steadily forward, so the body can be studied as one object.';

  draw(ctx, c) { super.draw(ctx, c); }
}
