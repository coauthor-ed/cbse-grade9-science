// DefensibleConservationRecordScene - L11 blk-l11-s08, 4 beats, the module's close. The whole tree. Beat 0: the five kingdoms
// lit. Beat 1: Plantae and Animalia lit, the branches the text lists. Beat 2: at rest, for the ideas to try. Beat 3: all lit.
import { LifeTreeCloseScene } from '../shared/LifeTreeCloseScene.js';

const one = (idx) => [{ idx, dwellMs: null }];
export class DefensibleConservationRecordScene extends LifeTreeCloseScene {
  static STAGE = 11;
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static ARIA_LABEL = 'The finished tree of life: Monera, Protista, Fungi, Plantae and Animalia with their groups on the boughs, and viruses outside it.';
  treeOptions(n) { return n === 1 ? { stage: 11, lit: ['Plantae', 'Animalia'] } : n === 2 ? { stage: 11, lit: [] } : { stage: 11 }; }
}
