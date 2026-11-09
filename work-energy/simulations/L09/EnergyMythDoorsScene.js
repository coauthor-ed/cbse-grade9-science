import { ArcadeJudgeScene } from 'simulations/base/kit/ArcadeJudgeScene.js';
import { ENERGY_MYTHS } from '../L01/WorkEnergyDeck.js';

// The chapter's six myths against six true facts, one statement at a time.
// Two-doors skin: open the true door or the false door before the candle burns down.
export class EnergyMythDoorsScene extends ArcadeJudgeScene {
  static ARIA_LABEL = 'Two doors: one statement about work, energy, power or machines at a time; open the true door or the false door before the candle burns down.';
  static CONFIG = { ...ENERGY_MYTHS, title: 'Energy myths: true or false?', skin: 'doors', rounds: 10 };
}
