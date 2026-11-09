import { ArcadeMatchScene } from 'simulations/base/kit/ArcadeMatchScene.js';
import { ASEXUAL_TERMS } from '../L01/ReproductionDeck.js';

// Name the part: terms from the asexual lessons, each popped against its meaning. Pairs have no art key, so no face.
export class AsexualMatchScene extends ArcadeMatchScene {
  static ARIA_LABEL = 'Name the part: a term waits at the bottom; pop the bubble that says what it means.';
  static CONFIG = { ...ASEXUAL_TERMS, title: 'Name the part', how: 'Pop the meaning of each term.', skin: 'bubbles', rounds: 8 };
  menuSample() { return (this.cfg.pairs || []).slice(0, 3).map((x) => ({ name: x.prompt, art: false })); }
}
