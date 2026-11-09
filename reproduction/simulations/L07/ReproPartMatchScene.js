import { ArcadeMatchScene } from 'simulations/base/kit/ArcadeMatchScene.js';
import { REPRO_ORGAN_JOBS } from '../L01/ReproductionDeck.js';

// Which part does which job? Words only, no art and no faces: a pair has no art key, and the menu sample says art: false.
export class ReproPartMatchScene extends ArcadeMatchScene {
  static ARIA_LABEL = 'Which part does which job: a part of the human reproductive system waits at the counter; hit the target showing its job before it drops.';
  static CONFIG = {
    ...REPRO_ORGAN_JOBS,
    title: 'Which part does which job?',
    how: 'Hit the target showing the job of each part.',
    ask: 'What does this part do?',
    skin: 'range',
    rounds: 8,
    drift: 6,
  };

  menuSample() { return (this.cfg.pairs || []).slice(0, 3).map((x) => ({ name: x.prompt, art: false })); }

  // The range skin starts on the two leftmost stalls; starting the lane counter at 2 opens on the middle of the field.
  beginRun(run) {
    super.beginRun(run);
    this.play.n = 2;
  }
}
