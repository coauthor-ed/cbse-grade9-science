import { SlotBoardScene } from 'simulations/base/kit/SlotBoardScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { gameInk } from '../L03/BioStage.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l11-s07: need -> threat -> action for two cases: Pakke hornbills, where the tree loss is a made-up case, and the
// Sangai deer, where phumdis are degenerating (book). The learner chooses the actions that answer each threat, then one
// open question to keep asking. Any of the questions is accepted: it is an opinion. No score, budget or timer.
// Rules:
//   nesting / phumdi - restoring fruiting trees does not answer this threat; protecting,
//                      renewing or working with communities and specialists does
//   fruiting trees   - protecting what still stands is not enough; the lost trees must
//                      be restored or the habitat renewed (actions may be combined)
const ACTIONS = [
  ['protect', 'Protect the habitat that remains'],
  ['renew', 'Help the habitat grow back'],
  ['restore', 'Plant fruit trees again'],
  ['community', 'Work with local people and experts'],
];

const actionSlot = (extra) => ({
  ask: 'Choose the actions', multi: true, options: ACTIONS,
  prompt: 'Tap every action that answers this threat. You may combine them.', ...extra,
});
const question = (id, prompts) => ({
  id: 'watch', label: 'Question to keep asking', slots: [{
    id: 'watch', ask: 'Pick one', options: prompts.map((p, n) => [`q${n}`, p]),
    answer: prompts.map((_, n) => `q${n}`), prompt: 'Which question would you keep asking once the plan is running?',
  }],
});

const pakke = {
  id: 'pakke', name: 'Pakke hornbills', sub: 'Suppose old trees are being lost', art: 'hornbill', tone: 3,
  facts: ['Four hornbill species', 'Nest in old cavity trees', 'Feed on specific fruits'],
  rows: [
    { id: 'nest', label: 'Nesting sites', lead: [{ text: 'Old cavity trees' }, { text: 'Being lost', kind: 'threat' }], slots: [
      actionSlot({ id: 'nest', forbidden: ['restore'],
        needAny: 'Pick an action that keeps the old cavity trees or helps them grow back.',
        why: { restore: 'Young fruit trees give no nest holes. Hornbills nest in large, old trees with cavities.' } }),
    ] },
    { id: 'food', label: 'Food', lead: [{ text: 'Fruit trees' }, { text: 'Being lost', kind: 'threat' }], slots: [
      actionSlot({ id: 'food', anyOf: ['restore', 'renew'],
        needAny: 'Protecting what still stands does not bring back lost fruit trees. Add an action that does.' }),
    ] },
    question('pakke', ['Are hornbills nesting in the old trees?', 'Are fruit trees growing back?']),
  ],
};
const sangai = {
  id: 'sangai', name: 'Sangai', sub: 'Deer on floating phumdis', art: 'deer', tone: 2,
  facts: ['Spends much time on phumdis', 'Phumdis are degenerating'],
  rows: [
    { id: 'phumdi', label: 'Habitat', lead: [{ text: 'Phumdis' }, { text: 'Degenerating', kind: 'threat' }], slots: [
      actionSlot({ id: 'phumdi', forbidden: ['restore'], anyOf: ['protect', 'renew', 'community'],
        needAny: 'Pick an action that protects the phumdi or helps it grow back.',
        why: { restore: 'Fruit trees do not answer this threat. Look at what the deer depends on.' } }),
    ] },
    question('sangai', ['Are the phumdis staying thick enough?', 'Are deer numbers changing over the years?']),
  ],
};

const TWO_UP = '.sb-sect { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); align-items: start; }';

export class ConservationChainChallengeScene extends SlotBoardScene {
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1595;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1200; static HEIGHT = 420; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS + TWO_UP); gameInk(this.root); wideBoard(this); }
  static CONFIG = {
    ariaLabel: 'Two cases: match an action to each threat',
    titles: ['Match the action to the need'],
    sections: [{ id: 'cases', cards: [pakke, sangai] }],
    text: {
      ready: 'All chosen? Press Check.',
      solvedHead: 'Both plans fit!',
      solved: 'Every threat has an action that answers it, and each case keeps one question open.',
    },
  };
}
