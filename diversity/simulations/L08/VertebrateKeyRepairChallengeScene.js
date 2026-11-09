import { KeyBuilderScene, yesNo } from 'simulations/base/kit/KeyBuilderScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { gameInk } from '../L03/BioStage.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// The wide card joins its facts with a spaced hyphen: commas read better here. A word in a fact never splits. The undo
// glyphs are missing from the phone font, so the round buttons carry words.
const MORE = `.ek-wide .ek-facts li:not(:last-child)::after { content: ', '; }
.ek-wide .ek-facts { overflow-wrap: normal; word-break: normal; }
.ek-mini { width: auto; min-width: 44px; height: 38px; padding: 0 10px; border-radius: var(--look-pill, 19px); font-size: 0 !important; }
.ek-mini::before { content: 'Undo'; font: 800 14px/1 var(--sim-font); color: var(--sim-label); }
.ek-mini[aria-label^="Back"]::before, .ek-mini[aria-label^="Start"]::before { content: 'Start again'; }
.ek-evtoggle { font-size: 0 !important; }
.ek-evtoggle::before { content: 'Evidence cards'; font: 800 14px/1 var(--sim-font); color: var(--sim-label); }
` + NO_FACES_CSS;

// blk-l08-s07: "Repair the shortcuts". A draft key sends every water-dweller to
// Fish and uses flight as the whole test for Birds. The learner repairs it for
// seven animals with tests of the body: habitat and flight stay available as
// observations but cannot stand in for a group's defining evidence. All
// behaviour lives in simulations/base/kit/KeyBuilderScene.js.
const YES = {
  water: ['carp', 'frog', 'dolphin'], flight: ['sparrow'], milk: ['tiger', 'dolphin'],
  lungs: ['frog', 'lizard', 'sparrow', 'ostrich', 'tiger', 'dolphin'],
  feathers: ['sparrow', 'ostrich'], shell: ['sparrow', 'ostrich'], scales: ['lizard'], stages: ['frog'], fins: ['carp'],
};
const facts = id => Object.fromEntries(Object.keys(YES).map(t => [t, YES[t].includes(id) ? 'yes' : 'no']));

const CONFIG = {
  ariaLabel: 'Repair a draft key so seven vertebrates reach their groups by tests of the body.',
  noun: 'group',
  groups: ['Fish', 'Amphibia', 'Reptilia', 'Aves', 'Mammalia'],
  nameMixed: true,
  lockFirstBeat: true,
  titles: ['The draft key', 'Repair the key'],
  text: { draftLead: 'Next: repair it with tests of the body.', ready: 'Ready? Send all seven animals down your key.' },
  tests: {
    water: yesNo('Lives in water?'),
    flight: yesNo('Can it fly?'),
    milk: yesNo('Mammary glands?'),
    lungs: yesNo('Lungs as an adult?'),
    feathers: yesNo('Feathers?'),
    shell: yesNo('Hard-shelled eggs?'),
    scales: yesNo('Dry scales?'),
    stages: yesNo('Gills, then lungs?'),
    fins: yesNo('Fins + gills?'),
  },
  requires: {
    Fish: [[['fins', 'yes']]],
    Amphibia: [[['stages', 'yes']]],
    Reptilia: [[['scales', 'yes'], ['lungs', 'yes']]],
    Aves: [[['feathers', 'yes'], ['shell', 'yes']]],
    Mammalia: [[['milk', 'yes'], ['lungs', 'yes']]],
  },
  // The starting key: 0 of 7 routes work.
  draft: () => ({
    members: [0, 1, 2, 3, 4, 5, 6], test: 'water',
    kids: [
      { ans: 'yes', members: [0, 1, 6], stamp: 'Fish' },
      { ans: 'no', members: [2, 3, 4, 5], test: 'flight', kids: [
        { ans: 'yes', members: [3], stamp: 'Aves' },
        { ans: 'no', members: [2, 4, 5], stamp: 'Reptilia' },
      ] },
    ],
  }),
  items: [
    { name: 'Carp', group: 'Fish', tone: 2, art: 'carp', facts: facts('carp'),
      card: ['Water', 'Fins and gills', 'Scales'] },
    { name: 'Frog', group: 'Amphibia', tone: 3, art: 'frog', facts: facts('frog'),
      card: ['Land, water', 'Young: gills', 'Adult: lungs', 'Moist skin'] },
    { name: 'Lizard', group: 'Reptilia', tone: 1, art: 'lizard', facts: facts('lizard'),
      card: ['Land', 'Lungs', 'Dry scales'] },
    { name: 'Sparrow', group: 'Aves', tone: 2, art: 'sparrow', facts: facts('sparrow'),
      card: ['Flies', 'Lungs', 'Feathers', 'Hard eggshell'] },
    { name: 'Ostrich', group: 'Aves', tone: 6, art: 'ostrich', facts: facts('ostrich'),
      card: ['Cannot fly', 'Lungs', 'Feathers', 'Hard eggshell'] },
    { name: 'Tiger', group: 'Mammalia', tone: 8, art: 'tiger', facts: facts('tiger'),
      card: ['Land', 'Lungs', 'Fur', 'Milk'] },
    { name: 'Dolphin', group: 'Mammalia', tone: 7, art: 'dolphin', facts: facts('dolphin'),
      card: ['Water', 'Lungs', 'No gills', 'Milk'] },
  ],
  cardStyle: 'wide', cols: 4, portraitCols: 2,
};

export class VertebrateKeyRepairChallengeScene extends KeyBuilderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1500;
  static WIDTH = 1200; static HEIGHT = 400; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(MORE); gameInk(this.root); wideBoard(this); }
}
