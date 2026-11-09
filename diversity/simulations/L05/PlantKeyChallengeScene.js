import { KeyBuilderScene, yesNo } from 'simulations/base/kit/KeyBuilderScene.js';
import { noFaces } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';
import { gameInk } from '../L03/BioStage.js';

// blk-l05-s07: build a plant key. The learner picks the questions and names the groups; the board splits by each plant's features. Behaviour lives in the kit.
const CONFIG = {
  ariaLabel: 'Build a branching key that sorts five plants into their groups.',
  noun: 'group',
  groups: ['Thallophyta', 'Bryophyta', 'Pteridophyta', 'Gymnosperms', 'Angiosperms'],
  titles: ['Build your key', 'Test your key'],
  text: { solved: 'Every plant reached its own group by its own features.' },
  tests: {
    parts: yesNo('True roots?'),
    vascular: yesNo('Xylem and phloem?'),
    seeds: yesNo('Seeds?'),
    fruit: yesNo('Seeds in fruit?'),
    rhizoids: yesNo('Rhizoids?'),
  },
  items: [
    { name: 'Spirogyra', group: 'Thallophyta', tone: 3, art: 'spirogyra',
      facts: { parts: 'no', vascular: 'no', seeds: 'no', fruit: 'no', rhizoids: 'no' },
      card: ['Thallus', 'No true roots', 'No xylem', 'No seeds'] },
    { name: 'Moss', group: 'Bryophyta', tone: 7, art: 'moss',
      facts: { parts: 'no', vascular: 'no', seeds: 'no', fruit: 'no', rhizoids: 'yes' },
      card: ['Rhizoids', 'No true roots', 'No xylem', 'No seeds'] },
    { name: 'Fern', group: 'Pteridophyta', tone: 1, art: 'fern',
      facts: { parts: 'yes', vascular: 'yes', seeds: 'no', fruit: 'no', rhizoids: 'no' },
      card: ['True roots', 'Xylem and phloem', 'No seeds'] },
    { name: 'Pine', group: 'Gymnosperms', tone: 8, art: 'pine',
      facts: { parts: 'yes', vascular: 'yes', seeds: 'yes', fruit: 'no', rhizoids: 'no' },
      card: ['True roots', 'Xylem and phloem', 'Bare seeds, no fruit'] },
    { name: 'Flowering plant', group: 'Angiosperms', tone: 4, art: 'flower',
      facts: { parts: 'yes', vascular: 'yes', seeds: 'yes', fruit: 'yes', rhizoids: 'no' },
      card: ['True roots', 'Xylem and phloem', 'Seeds inside fruit'] },
  ],
  cardStyle: 'wide', cols: 3, portraitCols: 2,
};

export class PlantKeyChallengeScene extends KeyBuilderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1250;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1200; static HEIGHT = 400; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); noFaces(this.root); gameInk(this.root); wideBoard(this); }
}
