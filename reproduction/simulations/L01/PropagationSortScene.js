import { ArcadeSortScene } from 'simulations/base/kit/ArcadeSortScene.js';
import { PROPAGATION_ROUTES } from './ReproductionDeck.js';
import { plainBin } from '../shared/ArcadeBits.js';

// Which part grows? Eight new plants ride a belt into four crates: underground stem, stem above ground, leaf, seed.
export class PropagationSortScene extends ArcadeSortScene {
  static ARIA_LABEL = 'Which part grows? New plants ride a conveyor belt; tap the crate each one comes from: an underground stem, a stem above ground, a leaf or a seed.';
  static CONFIG = { ...PROPAGATION_ROUTES, title: 'Which part grows?', how: 'Tap the crate that shows where each new plant comes from.', skin: 'belt', rounds: 8, fall: 10 };
  _drawBin(ctx, c, b, i, t, lit = false) { plainBin(this, ctx, c, b, i, t, lit); }
}
