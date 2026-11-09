import { SlotBoardScene } from 'simulations/base/kit/SlotBoardScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { gameInk } from '../L03/BioStage.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l10-s07: three hasty ideas. Each panel starts with the wrong answers filled in, and the learner changes them
// to what the printed facts support. Rules:
//   frog    - 2003 is when people described it; the record does not give the age of the family
//   P and Q - similar shape does not decide the domain; the genetic findings do
//   virus V - DNA does not give a kingdom; no cell and needing a host cell keep it outside
const frog = {
  id: 'frog', name: 'Purple frog', sub: 'Described in 2003', art: 'frog', tone: 3,
  claim: 'It was described in 2003, so its family began in 2003.',
  facts: ['Described in 2003', 'The date does not give the age of its family'],
  rows: [
    { id: 'concl', label: 'So 2003 is', slots: [
      { id: 'concl', ask: 'Meaning', initial: 'origin', answer: 'people',
        prompt: 'What does the year 2003 tell you?',
        options: [['origin', 'When its family began'], ['people', 'When people described it'], ['both', 'Both of these']],
        why: { origin: 'A date of description is not the age of a family. The frog lived long before 2003.', both: 'Only one of these is on the panel. Which one?' } },
    ] },
    { id: 'limit', label: 'The age of its family is', slots: [
      { id: 'limit', ask: 'Age', initial: 'y2003', answer: 'unknown',
        prompt: 'What do the printed facts say about the age of its family?',
        options: [['y2003', '2003'], ['unknown', 'Not given by this date'], ['ancient', 'An exact old date']],
        why: { y2003: 'That reads the date of description as the age of the family.', ancient: 'The panel gives no such date, so do not invent one.' } },
    ] },
  ],
};
const microbes = {
  id: 'pq', name: 'Microbes P and Q', sub: 'They look alike', arts: [{ art: 'bacterium', tone: 5 }, { art: 'bacterium', tone: 5 }], tone: 5,
  claim: 'They look alike, so they must be in the same domain.',
  facts: ['Same outline', 'No true nucleus', 'DNA shows P is Bacteria', 'DNA shows Q is Archaea'],
  rows: [
    { id: 'concl', label: 'So P and Q are in', slots: [
      { id: 'concl', ask: 'Domains', initial: 'one', answer: 'two',
        prompt: 'How many domains do P and Q belong to?',
        options: [['one', 'One domain'], ['two', 'Two domains'], ['none', 'No domains']],
        why: { one: 'The DNA places P in Bacteria and Q in Archaea, and that is two.', none: 'The DNA places both of them in a domain.' } },
    ] },
    { id: 'limit', label: 'Shape alone can', slots: [
      { id: 'limit', ask: 'Shape', initial: 'decisive', answer: 'unresolved',
        prompt: 'What can the outline alone tell you about the domain?',
        options: [['decisive', 'Decide the domain'], ['unresolved', 'Not decide it']],
        why: { decisive: 'Two microbes can share an outline and still sit in different domains. Shape alone cannot settle it.' } },
    ] },
  ],
};
const virus = {
  id: 'virus', name: 'Virus V', sub: 'Has DNA, no cell', art: 'virus', tone: 1,
  claim: 'It has DNA, so it must fit in one of the five kingdoms.',
  facts: ['Has DNA', 'No cellular organisation', 'Inactive outside a host cell'],
  rows: [
    { id: 'concl', label: 'So V is', slots: [
      { id: 'concl', ask: 'Place', initial: 'existing', answer: 'outside',
        prompt: 'Where does V stand in the five kingdom system?',
        options: [['existing', 'In one of the kingdoms'], ['outside', 'Outside the five kingdoms'], ['sixth', 'Sure to be in a sixth kingdom']],
        why: { existing: 'The five kingdoms sort cells. V has no cellular organisation, so it cannot enter them.', sixth: 'The facts do not show that. They show only that V is outside the five kingdoms.' } },
    ] },
    { id: 'limit', label: 'A kingdom for V is', slots: [
      { id: 'limit', ask: 'Kingdom', initial: 'guaranteed', answer: 'none',
        prompt: 'Is a kingdom certain for V?',
        options: [['guaranteed', 'Certain'], ['none', 'Not given']],
        why: { guaranteed: 'DNA alone does not give a kingdom. The kingdoms sort cells.' } },
    ] },
  ],
};

const THREE_UP = '.sb-slot .sb-sub2 { display: none; } .sb-sect { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); align-items: start; } .sb-claim b { display: none; }';

export class EvidenceMapRepairChallengeScene extends SlotBoardScene {
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 2265;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1200; static HEIGHT = 420; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS + THREE_UP); gameInk(this.root); wideBoard(this); }
  static CONFIG = {
    ariaLabel: 'Three hasty ideas to change, using the printed facts',
    titles: ['Fix three hasty ideas'],
    noPips: true,
    sections: [{ id: 'claims', cards: [frog, microbes, virus] }],
    text: {
      ready: 'Changed what needs changing? Press Check.',
      solvedHead: 'All three ideas are fixed!',
      solved: 'Each answer says what the facts show, and no more.',
    },
  };
}
