import { ArcadeSortScene } from 'simulations/base/kit/ArcadeSortScene.js';
import { KINGDOMS } from '../shared/DiversityDeck.js';

// Kingdom belt: specimens ride a belt; tap the crate of their kingdom before the belt drops them.
export class KingdomBeltScene extends ArcadeSortScene {
  static ARIA_LABEL = 'Kingdom belt: specimens ride a conveyor belt; tap the crate of the kingdom each one belongs in.';
  static CONFIG = { ...KINGDOMS, title: 'Kingdom belt', skin: 'belt', rounds: 12 };
}
