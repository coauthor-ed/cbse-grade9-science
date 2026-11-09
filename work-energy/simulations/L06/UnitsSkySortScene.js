import { ArcadeSortScene } from 'simulations/base/kit/ArcadeSortScene.js';
import { UNITS_SKY_SORT } from '../L01/WorkEnergyDeck.js';

// Work or energy, power or force, catch-and-sort with the falling sky skin.
export class UnitsSkySortScene extends ArcadeSortScene {
  static ARIA_LABEL = 'Unit catcher: units, compound units and defining phrases fall one at a time; tap the bin for what each one measures - work or energy in joules, power in watts, or force in newtons.';
  static CONFIG = { ...UNITS_SKY_SORT, title: 'Sort the units', skin: 'sky', rounds: 8 };

  menuSample() {
    return [{ name: 'Watt (W)', art: false }, { name: 'Newton (N)', art: false }, { name: 'Joule (J)', art: false }];
  }
}
