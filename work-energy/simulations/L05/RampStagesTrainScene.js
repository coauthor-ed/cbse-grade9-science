import { ArcadeOrderScene } from 'simulations/base/kit/ArcadeOrderScene.js';
import { RAMP_STAGES_TRAIN } from '../L01/WorkEnergyDeck.js';

// The stages of one mechanical-energy run, in the order they happen: a ball
// down a smooth ramp onto a rough floor, a half-swing, and a rippled track
// whose crests each come back lower than the last. Train skin, so a carriage
// couples behind the engine as each stage is tapped in order.
export class RampStagesTrainScene extends ArcadeOrderScene {
  static ARIA_LABEL = 'Energy train: the stages of a run float across the yard; tap them in order from release to rest to couple the carriages before the fuse burns out.';
  static CONFIG = { ...RAMP_STAGES_TRAIN, title: 'Energy train', skin: 'train', rounds: 3 };

  menuSample() {
    return [{ name: 'Stopped: heat and sound', art: false }, { name: 'On the ramp top: still', art: false }, { name: 'Ramp bottom: fastest', art: false }];
  }
}
