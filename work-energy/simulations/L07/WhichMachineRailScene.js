import { ArcadeRouteScene } from 'simulations/base/kit/ArcadeRouteScene.js';
import { WHICH_MACHINE } from '../L01/WorkEnergyDeck.js';

// Which simple machine is it? The key as a railway: one signal asks whether the
// tool turns on a fixed pivot, the next whether a rope runs over a grooved
// wheel, and the track it ends on is the machine. Rail skin.
export class WhichMachineRailScene extends ArcadeRouteScene {
  static ARIA_LABEL = 'Machine line: each everyday tool rides a railway of yes/no signals - does it turn about a fixed pivot, does it use a rope over a grooved wheel - to the lever, pulley or inclined plane it is.';
  static CONFIG = { ...WHICH_MACHINE, title: 'Which machine line', skin: 'rail', rounds: 8 };

  menuSample() {
    return [{ name: 'A well bucket', art: false }, { name: 'Scissors', art: false }, { name: 'A truck ramp', art: false }];
  }
}
