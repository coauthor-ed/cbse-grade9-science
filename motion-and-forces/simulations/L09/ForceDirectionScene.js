/**
 * ForceDirectionScene - slide blk-l09-s3 "Magnitude and direction" (2 beats).
 * Thin file: WhatForceDoesScene with MODE 'direction' (b0 three forces and their directions, then
 * the magnitude pair; b1 the newton: three pushes on a ball). Beats are described and drawn in
 * WhatForceDoesScene.js.
 */
import { WhatForceDoesScene } from './WhatForceDoesScene.js';

export class ForceDirectionScene extends WhatForceDoesScene {
  static MODE = 'direction';
  static ARIA_LABEL = 'Three forces, each with its direction: a box sliding to the right slows down, with friction at its bottom pointing to the left; an apple falls, with the pull of the Earth pointing down; a ball floats on water, with the push of water pointing up. Then one box is pushed with a short arrow and with a long arrow: a longer arrow means a larger force. Then a ball on a floor seen from above: a push of 5 newtons rolls it a short way, a push of 10 newtons the same way rolls it much farther, and a push of 10 newtons in another direction sends it that way. The newton, N, is the unit of force.';
  draw(ctx, c) { super.draw(ctx, c); }
}
