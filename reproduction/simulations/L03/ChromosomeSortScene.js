import { ArcadeSortScene } from 'simulations/base/kit/ArcadeSortScene.js';
import { GAMETE_DEAL } from '../L01/ReproductionDeck.js';
import { plainBin } from '../shared/ArcadeBits.js';

// Gamete, body cell, mitosis or meiosis? Eight cases fall into four bins.
export class ChromosomeSortScene extends ArcadeSortScene {
  static ARIA_LABEL = 'Which bin? Cases fall one at a time; tap the bin each belongs in: a gamete, a body cell, mitosis or meiosis.';
  static CONFIG = { ...GAMETE_DEAL, title: 'Gamete or body cell?', how: 'Tap the bin that each one belongs to.', skin: 'sky', rounds: 8, fall: 10 };
  _drawBin(ctx, c, b, i, t, lit = false) { plainBin(this, ctx, c, b, i, t, lit); }
}
