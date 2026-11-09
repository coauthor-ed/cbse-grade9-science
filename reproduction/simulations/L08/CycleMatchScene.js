import { ArcadeJudgeScene } from 'simulations/base/kit/ArcadeJudgeScene.js';
import { CYCLE_CLAIMS } from '../L01/ReproductionDeck.js';

// True or false about the monthly cycle. Words only. A wrong call shows the reason.
export class CycleMatchScene extends ArcadeJudgeScene {
  static ARIA_LABEL = 'True or false about the monthly cycle: one claim at a time; swipe or tap TRUE or FALSE, and a wrong call shows the reason.';
  static CONFIG = {
    ...CYCLE_CLAIMS,
    title: 'True or false about the cycle?',
    skin: 'cards',
    rounds: 8,
  };
  // The card stays between the two answers: the kit's demo swings it across TRUE.
  menuDemo(ctx, c, t) { super.menuDemo(ctx, c, t, 1); }
}
