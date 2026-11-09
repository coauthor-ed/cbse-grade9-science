import { KeyBuilderScene, yesNo } from 'simulations/base/kit/KeyBuilderScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l07-s08: "Build a key that survives". Six animal cards, five destination
// groups; snail and octopus must share Mollusca. Every route must ask the real
// distinguishing evidence for its group ("it was the only card left" is not a
// reason). All behaviour lives in simulations/base/kit/KeyBuilderScene.js.
// The wide card joins its facts with a spaced hyphen: commas read better here.
const COMMAS = ".ek-wide .ek-facts li:not(:last-child)::after { content: ', '; white-space: pre-wrap; }";
const F = (notochord, backbone, segments, joints, outer, calcium, cavity, foot) => {
  const yn = v => (v ? 'yes' : 'no');
  return { notochord: yn(notochord), backbone: yn(backbone), segments: yn(segments), joints: yn(joints), outer: yn(outer), calcium: yn(calcium), cavity: yn(cavity), foot: yn(foot) };
};
const CONFIG = {
  ariaLabel: 'Build a branching key that sorts six animals into five groups by real evidence.',
  noun: 'group',
  groups: ['Annelida', 'Arthropoda', 'Mollusca', 'Echinodermata', 'Protochordates'],
  nameMixed: true,
  titles: ['Build your key', 'Test your key'],
  text: { ready: 'Ready? Run all six animals through your key.' },
  tests: {
    notochord: yesNo('Notochord?'),
    backbone: yesNo('Backbone?'),
    segments: yesNo('Segmented body?'),
    joints: yesNo('Jointed limbs?'),
    outer: yesNo('Hard outer covering?'),
    calcium: yesNo('Calcium carbonate inside?'),
    cavity: yesNo('Segments and body cavity?'),
    foot: yesNo('Foot or reshaped foot?'),
  },
  // The route to a group must include these answers.
  requires: {
    Annelida: [[['notochord', 'no'], ['cavity', 'yes']]],
    Arthropoda: [[['notochord', 'no'], ['joints', 'yes'], ['outer', 'yes']]],
    Mollusca: [[['notochord', 'no'], ['foot', 'yes'], ['joints', 'no']]],
    Echinodermata: [[['notochord', 'no'], ['calcium', 'yes']]],
    Protochordates: [[['notochord', 'yes'], ['backbone', 'no']]],
  },
  items: [
    { name: 'Earthworm', group: 'Annelida', tone: 4, art: 'earthworm', facts: F(0, 0, 1, 0, 0, 0, 1, 0),
      card: ['No notochord', 'Segments', 'Body cavity', 'No jointed limbs'] },
    { name: 'Beetle', group: 'Arthropoda', tone: 1, art: 'beetle', facts: F(0, 0, 1, 1, 1, 0, 0, 0),
      card: ['No notochord', 'Segments', 'Jointed limbs', 'Hard outer covering'] },
    { name: 'Snail', group: 'Mollusca', tone: 6, art: 'snail', facts: F(0, 0, 0, 0, 1, 0, 0, 1),
      card: ['No notochord', 'Muscular foot', 'Shell outside', 'No jointed limbs'] },
    { name: 'Octopus', group: 'Mollusca', tone: 6, art: 'octopus', facts: F(0, 0, 0, 0, 0, 0, 0, 1),
      card: ['No notochord', 'Foot became arms', 'No shell', 'No jointed limbs'] },
    { name: 'Starfish', group: 'Echinodermata', tone: 5, art: 'starfish', facts: F(0, 0, 0, 0, 0, 1, 0, 0),
      card: ['No notochord', 'Calcium carbonate inside', 'No segments'] },
    { name: 'Amphioxus', group: 'Protochordates', tone: 5, art: 'amphioxus', facts: F(1, 0, 1, 0, 0, 0, 1, 0),
      card: ['Has a notochord', 'No backbone', 'Segments', 'Body cavity'] },
  ],
  cardStyle: 'wide', cols: 6, portraitCols: 2,
};

export class SupportMovementKeyChallengeScene extends KeyBuilderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1200; static HEIGHT = 400; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS + COMMAS); wideBoard(this); }
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1975;
}
