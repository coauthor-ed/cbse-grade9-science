// ResolutionDotsSetupScene - the predict's setup: dots and the eye view, no gap value, no slider.
import { ResolutionDotsScene } from './ResolutionDotsScene.js';

export class ResolutionDotsSetupScene extends ResolutionDotsScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static HIDE_VALUE = true;
  static ARIA_LABEL = 'Two tiny dots on a sheet of paper, and a round view of the dots as seen from 25 cm.';
}
