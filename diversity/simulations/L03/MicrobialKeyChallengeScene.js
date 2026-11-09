import { KeyBuilderScene, UNKNOWN } from 'simulations/base/kit/KeyBuilderScene.js';
import { noFaces } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';
import { gameInk } from './BioStage.js';

// blk-l03-s08: repair a key. It starts from a draft with two bad rules, "makes food = Plantae" and "one cell = Protista",
// and five organisms. A question an organism does not answer is refused, never read as no. Behaviour lives in the kit.
const U = UNKNOWN;
const CONFIG = {
  ariaLabel: 'Repair a draft key so five organisms reach their kingdoms.',
  noun: 'kingdom',
  groups: ['Monera', 'Protista', 'Fungi'],
  nameMixed: true,
  lockFirstBeat: true,
  titles: ['The draft key', 'Repair the key'],
  text: { draftLead: 'Next step: repair it.', ready: 'Ready? Send all five down your key.', solved: 'All five reached the right kingdom by the right checks.' },
  tests: {
    nucleus: { ask: 'Nucleus?', answers: [['absent', 'No nucleus'], ['present', 'Has nucleus']] },
    cells: { ask: 'Cell count?', answers: [['one', 'One cell'], ['many', 'Many cells']] },
    photo: { ask: 'Makes food?', answers: [['yes', 'Makes food'], ['no', 'Makes no food']] },
    chitin: { ask: 'Chitin wall?', answers: [['yes', 'Chitin wall'], ['no', 'No chitin']] },
    absorb: { ask: 'Absorbs food?', answers: [['yes', 'Absorbs'], ['no', 'Does not']] },
    fungal: { ask: 'Chitin and absorbs?', answers: [['yes', 'Both'], ['no', 'Not both']] },
    flagellum: { ask: 'Flagellum?', answers: [['yes', 'Has one'], ['no', 'None']] },
  },
  // A route only counts if it asked the checks that place the group.
  requires: {
    Monera: [[['nucleus', 'absent']]],
    Fungi: [[['chitin', 'yes'], ['absorb', 'yes']], [['fungal', 'yes']]],
    Protista: [[['nucleus', 'present'], ['chitin', 'no']], [['nucleus', 'present'], ['fungal', 'no']]],
  },
  // The flawed starting key: 0 of 5 routes work.
  draft: () => ({
    members: [0, 1, 2, 3, 4], test: 'photo',
    kids: [
      { ans: 'yes', members: [0, 4], stamp: 'Plantae' },
      { ans: 'no', members: [1, 2, 3], test: 'cells', kids: [
        { ans: 'one', members: [1, 2], stamp: 'Protista' },
        { ans: 'many', members: [3], stamp: 'Fungi' },
      ] },
    ],
  }),
  items: [
    { name: 'Cyanobacterium', group: 'Monera', tone: 3, art: 'cyano',
      facts: { nucleus: 'absent', cells: 'one', photo: 'yes', chitin: U, absorb: U, fungal: U, flagellum: U },
      card: ['One cell', 'No nucleus', 'Makes food'] },
    { name: 'Decomposer bacterium', group: 'Monera', tone: 5, art: 'bacterium',
      facts: { nucleus: 'absent', cells: 'one', photo: U, chitin: U, absorb: U, fungal: U, flagellum: U },
      card: ['One cell', 'No nucleus', 'Feeds on dead matter'] },
    { name: 'Yeast', group: 'Fungi', tone: 2, art: 'yeast',
      facts: { nucleus: 'present', cells: 'one', photo: U, chitin: 'yes', absorb: 'yes', fungal: 'yes', flagellum: U },
      card: ['One cell', 'Has nucleus', 'Chitin wall', 'Absorbs food'] },
    { name: 'Mould', group: 'Fungi', tone: 8, art: 'hypha',
      facts: { nucleus: 'present', cells: 'many', photo: U, chitin: 'yes', absorb: 'yes', fungal: 'yes', flagellum: U },
      card: ['Many cells', 'Has nuclei', 'Chitin walls', 'Absorbs food'] },
    { name: 'Euglena', group: 'Protista', tone: 7, art: 'protist',
      facts: { nucleus: 'present', cells: 'one', photo: 'yes', chitin: 'no', absorb: 'yes', fungal: 'no', flagellum: 'yes' },
      card: ['One cell', 'Has nucleus', 'No chitin wall', 'Flagellum', 'Makes food in light', 'Absorbs in the dark'] },
  ],
  cardStyle: 'wide', cols: 3, portraitCols: 2,
};

export class MicrobialKeyChallengeScene extends KeyBuilderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1500;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1200; static HEIGHT = 400; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); noFaces(this.root); gameInk(this.root); wideBoard(this); }
}
