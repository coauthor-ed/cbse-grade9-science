import { ArcadeRouteScene } from 'simulations/base/kit/ArcadeRouteScene.js';
import { KINGDOM_KEY } from '../shared/DiversityDeck.js';

// Key race: run each organism down the five-kingdom key, taking the yes or no gate each question asks for.
export class KeyRaceScene extends ArcadeRouteScene {
  static ARIA_LABEL = 'Key race: one organism at a time runs down the kingdom key; take the yes or no gate for each question.';
  static CONFIG = { ...KINGDOM_KEY, title: 'Key race', skin: 'road', rounds: 10 };
}
