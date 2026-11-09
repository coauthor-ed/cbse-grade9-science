import { ArcadeJudgeScene } from 'simulations/base/kit/ArcadeJudgeScene.js';
import { DECIDES } from '../shared/DiversityDeck.js';

// Does it decide? Each claim pairs a true fact with a group: open TRUE only when the fact decides that group.
export class EvidenceOrLureScene extends ArcadeJudgeScene {
  static ARIA_LABEL = 'Does it decide? Claims appear one at a time; call each true if the fact decides the group, false if it is a lure.';
  static CONFIG = { ...DECIDES, title: 'Does it decide?', skin: 'doors', rounds: 14 };
}
