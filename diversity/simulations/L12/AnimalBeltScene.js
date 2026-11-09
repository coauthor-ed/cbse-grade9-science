import { ArcadeMatchScene } from 'simulations/base/kit/ArcadeMatchScene.js';
import { PHYLA } from '../shared/DiversityDeck.js';

// Animal range: an animal waits on the card; tap the target that shows its phylum.
// (Was a nine-bin conveyor; the kit's Sort takes at most six groups, so phyla are a Match.)
export class AnimalBeltScene extends ArcadeMatchScene {
  static ARIA_LABEL = 'Animal range: an animal waits at the bottom; phylum names pop up on targets; tap its phylum.';
  static CONFIG = { ...PHYLA, title: 'Animal range', skin: 'range', rounds: 12 };
}
