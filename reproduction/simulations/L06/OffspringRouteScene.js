import { ArcadeRouteScene } from 'simulations/base/kit/ArcadeRouteScene.js';
import { ANIMAL_STRATEGY_ROUTES } from '../L01/ReproductionDeck.js';

// Two questions in order: do the gametes meet inside the body, then does a feeding larva hatch? Three roads are used.
export class OffspringRouteScene extends ArcadeRouteScene {
  menuSample() { return this.cfg.items.slice(0, 3).map((x) => ({ name: x.name, art: false })); }
  static ARIA_LABEL = 'Which way did it go? Each animal runs a road of two yes or no gates: do the gametes meet inside the body, then does a feeding larva hatch?';
  static CONFIG = {
    ...ANIMAL_STRATEGY_ROUTES,
    title: 'Which way did it go?',
    how: 'Two questions in order. Do the gametes meet inside the body? Does a feeding larva hatch?',
    skin: 'road',
    rounds: 8,
  };
}