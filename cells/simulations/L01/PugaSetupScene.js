// PugaSetupScene - the predict's setup: PugaSpringScene at its first beat. Steam and rock, no organisms.
import { PugaSpringScene } from './PugaSpringScene.js';

export class PugaSetupScene extends PugaSpringScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static BEAT_MAPS = {};
  static ARIA_LABEL = 'A drawing of a hot spring in a cold, bare mountain valley. Steam rises from a blue pool with a mineral rim.';
  _step() { return 0; }
}
