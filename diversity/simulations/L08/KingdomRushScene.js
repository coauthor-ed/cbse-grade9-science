import { ArcadeSortScene } from 'simulations/base/kit/ArcadeSortScene.js';
import { KINGDOMS } from '../shared/DiversityDeck.js';

// Kingdom rush: specimens fall; tap the kingdom each belongs in before it lands.
export class KingdomRushScene extends ArcadeSortScene {
  static ARIA_LABEL = 'Kingdom rush: specimens fall one at a time; tap the kingdom each one belongs in before it lands.';
  static CONFIG = { ...KINGDOMS, title: 'Kingdom rush', skin: 'sky', rounds: 12 };
}
