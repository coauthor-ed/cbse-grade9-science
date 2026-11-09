import { ArcadeMatchScene } from 'simulations/base/kit/ArcadeMatchScene.js';
import { POLLINATION_VECTORS } from '../L01/ReproductionDeck.js';

// Eight plants against four targets. No art and no colour, so nothing gives the answer away.
export class PollinatorMatchScene extends ArcadeMatchScene {
  menuSample() { return this.cfg.pairs.slice(0, 3).map((x) => ({ name: x.prompt.split(':')[0], art: false })); }

  static ARIA_LABEL = 'Which pollinator: a plant waits at the counter with a clue; hit the target showing wind, water, insects or birds.';
  static CONFIG = {
    ...POLLINATION_VECTORS,
    title: 'What carries its pollen?',
    how: 'Hit the target that shows what carries the pollen of each plant.',
    ask: 'Its pollen is carried by',
    skin: 'range',
    rounds: 8,
    drift: 7,
  };
}