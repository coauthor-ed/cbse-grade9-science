import { KeyBuilderScene, UNKNOWN, NOT_APPLICABLE } from 'simulations/base/kit/KeyBuilderScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l02-s08: "Sort the crowd". The learner grows a branching key by asking
// questions of five creatures; the board splits the group by their REAL evidence
// and the learner names the kingdom at the end of each branch. All behaviour
// lives in simulations/base/kit/KeyBuilderScene.js - this file is only the content.
//
const CONFIG = {
  ariaLabel: 'Build a branching evidence key that sorts five creatures into their kingdoms.',
  noun: 'kingdom',
  groups: ['Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia'],
  titles: ['Build your key', 'Test your key'],
  bonus: { depth: 3, textOn: 'Bonus! Every creature named in 3 questions or fewer.', textOff: 'Bonus: can you name every creature in 3 questions or fewer?' },
  tests: {
    nucleus: { ask: 'Nucleus?', answers: [['absent', 'No nucleus'], ['present', 'Has nucleus']] },
    cells: { ask: 'How many cells?', answers: [['one', 'One cell'], ['many', 'Many cells']] },
    wall: { ask: 'Cell wall?', answers: [['absent', 'No wall'], ['present', 'Has wall']] },
    material: { ask: 'Wall material?', answers: [['chitin', 'Chitin'], ['cellulose', 'Cellulose']], na: 'has no cell wall to ask about' },
    food: { ask: 'Where is food from?', answers: [['organic', 'From others'], ['photo', 'Makes its own']] },
    uptake: { ask: 'Food uptake?', answers: [['absorb', 'Absorbs it'], ['ingest', 'Takes it in']], na: 'makes its own food instead of taking it in' },
  },
  items: [
    { name: 'Bacterium', group: 'Monera', tone: 5, art: 'bacterium',
      facts: { nucleus: 'absent', cells: 'one', wall: 'present', material: UNKNOWN, food: 'organic', uptake: UNKNOWN },
      card: ['No nucleus', 'One cell', 'Wall type not given', 'Food from others'] },
    { name: 'Amoeba', group: 'Protista', tone: 7, art: 'protist',
      facts: { nucleus: 'present', cells: 'one', wall: 'absent', material: NOT_APPLICABLE, food: 'organic', uptake: 'ingest' },
      card: ['Has nucleus', 'One cell', 'No cell wall', 'Takes food in'] },
    { name: 'Mushroom', group: 'Fungi', tone: 8, art: 'mushroom',
      facts: { nucleus: 'present', cells: 'many', wall: 'present', material: 'chitin', food: 'organic', uptake: 'absorb' },
      card: ['Has nucleus', 'Many cells', 'Chitin wall', 'Absorbs food'] },
    { name: 'Mango tree', group: 'Plantae', tone: 3, art: 'sprout',
      facts: { nucleus: 'present', cells: 'many', wall: 'present', material: 'cellulose', food: 'photo', uptake: NOT_APPLICABLE },
      card: ['Has nucleus', 'Many cells', 'Cellulose wall', 'Makes its own food'] },
    { name: 'Deer', group: 'Animalia', tone: 4, art: 'deer',
      facts: { nucleus: 'present', cells: 'many', wall: 'absent', material: NOT_APPLICABLE, food: 'organic', uptake: 'ingest' },
      card: ['Has nucleus', 'Many cells', 'No cell wall', 'Takes food in'] },
  ],
};

export class EvidenceKeyChallengeScene extends KeyBuilderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1520;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1200; static HEIGHT = 400; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS); wideBoard(this); }
}
