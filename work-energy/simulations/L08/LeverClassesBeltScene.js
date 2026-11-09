import { ArcadeSortScene } from 'simulations/base/kit/ArcadeSortScene.js';
import { LEVER_CLASSES_BELT } from '../L01/WorkEnergyDeck.js';

// The three classes of levers, catch-and-sort, conveyor-belt skin.
export class LeverClassesBeltScene extends ArcadeSortScene {
  static ARIA_LABEL = 'Belt sort: everyday tools functioning as levers arrive on a conveyor belt one at a time; tap the crate for the class the tool belongs to - Class I, fulcrum in between; Class II, load in between; Class III, effort in between.';
  static CONFIG = { ...LEVER_CLASSES_BELT, title: 'Belt sort: which class of lever?', skin: 'belt', rounds: 8 };

  menuSample() {
    return [{ name: 'A broom sweeping dust', art: false }, { name: 'Scissors cutting paper', art: false }, { name: 'A wheelbarrow of soil', art: false }];
  }
}
