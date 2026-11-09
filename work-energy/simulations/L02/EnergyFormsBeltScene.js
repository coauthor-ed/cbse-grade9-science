import { ArcadeSortScene } from 'simulations/base/kit/ArcadeSortScene.js';
import { ENERGY_FORMS_BELT } from '../L01/WorkEnergyDeck.js';

// The six forms of energy, catch-and-sort, conveyor-belt skin.
export class EnergyFormsBeltScene extends ArcadeSortScene {
  static ARIA_LABEL = 'Belt sort: everyday items ride a conveyor belt one at a time; tap the crate for the form of energy each one mostly carries - mechanical, thermal, light, sound, electrical or chemical.';
  static CONFIG = { ...ENERGY_FORMS_BELT, title: 'Belt sort: which form of energy?', skin: 'belt', rounds: 8 };

  menuSample() {
    return [{ name: 'A ringing school bell', art: false }, { name: 'A moving cyclist', art: false }, { name: 'A hot cup of tea', art: false }];
  }
}
