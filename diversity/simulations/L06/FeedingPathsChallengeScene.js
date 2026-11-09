import { SlotBoardScene } from 'simulations/base/kit/SlotBoardScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l06-s07: four body plans, each needing a route for food IN and waste OUT,
// then the level of organisation. The route is filled in stop
// by stop: the two ends are given, the stops in between come from the animal's own
// parts. Decoy parts (an anus the hydra does not have, a mouth the sponge does not
// have) are there to be refused: no invented opening, no invented organ.
// Four animals side by side when the frame is wide, one above the other on a phone.
const TWO_UP = '.sb-sect { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }';
const MODELS = [['cellular', 'Cellular'], ['tissue', 'Tissue'], ['organ', 'Organ'], ['system', 'Organ system']];
const SAME_PART = 'Right part, wrong place. Follow the route one stop at a time.';

function animal({ id, name, art, tone, facts, parts, decoys, food, waste, wasteLabel, foodEnds, wasteEnds, model }) {
  const options = [...parts, ...decoys.map(d => [d[0], d[1]])];
  const why = (pick) => decoys.find(d => d[0] === pick)?.[2] || SAME_PART;
  const stops = (ids, ends, kind) => [
    { id: `${kind}-a`, fixed: ends[0] },
    ...ids.map((answer, n) => ({ id: `${kind}${n}`, ask: '?', aria: `Stop ${n + 1}`, options, answer, why, cite: [1], prompt: `Which part comes next on the ${kind === 'f' ? 'food' : 'waste'} route?` })),
    { id: `${kind}-z`, fixed: ends[1] },
  ];
  return {
    id, name, art, tone, facts,
    rows: [
      { id: 'food', label: 'Food in', inline: true, join: '→', slots: stops(food, foodEnds, 'f') },
      { id: 'waste', label: 'Waste out', inline: true, join: '→', slots: stops(waste, wasteEnds, 'w') },
      { id: 'model', label: 'Level', inline: true, slots: [
        { id: 'model', ask: 'Level?', options: MODELS, answer: model, cite: [0],
          prompt: 'Which level of organisation fits this animal?',
          why: (pick, label) => `This animal is not at the ${label.toLowerCase()} level. Read the first line of its list again.` },
      ] },
    ],
  };
}

const sponge = animal({
  id: 'sponge', name: 'Sponge', art: 'sponge', tone: 2,
  facts: ['Cellular level', 'Pores', 'Water channels', 'Cells', 'Larger opening'],
  parts: [['pores', 'Pores'], ['channels', 'Water channels'], ['outflow', 'Larger opening']],
  decoys: [['mouth', 'Mouth', 'A sponge has no mouth. Water comes in through its pores.']],
  food: ['pores', 'channels'], foodEnds: ['Outside', 'Cells'],
  waste: ['channels', 'outflow'], wasteEnds: ['Cells', 'Outside'],
  model: 'cellular',
});
const hydra = animal({
  id: 'hydra', name: 'Hydra', art: 'hydra', tone: 7,
  facts: ['Tissue level', 'One opening', 'Cavity'],
  parts: [['opening', 'The one opening']],
  decoys: [
    ['anus', 'Anus', 'Hydra has one opening only, so it has no anus.'],
    ['pharynx', 'Pharynx', 'Hydra has no pharynx on its list.'],
  ],
  food: ['opening'], foodEnds: ['Outside', 'Cavity'],
  waste: ['opening'], wasteEnds: ['Cavity', 'Outside'],
  model: 'tissue',
});
const flatworm = animal({
  id: 'flatworm', name: 'Flatworm', art: 'flatworm', tone: 8,
  facts: ['Organ level', 'One opening', 'Pharynx', 'Gut'],
  parts: [['opening', 'The one opening'], ['pharynx', 'Pharynx']],
  decoys: [['anus', 'Anus', 'A flatworm has one opening, so it has no anus.']],
  food: ['opening', 'pharynx'], foodEnds: ['Outside', 'Gut'],
  waste: ['pharynx', 'opening'], wasteEnds: ['Gut', 'Outside'],
  model: 'organ',
});
const roundworm = animal({
  id: 'roundworm', name: 'Roundworm', art: 'roundworm', tone: 3,
  facts: ['Organ system level', 'Mouth', 'Pharynx', 'Intestine', 'Anus'],
  parts: [['mouth', 'Mouth'], ['pharynx', 'Pharynx'], ['intestine', 'Intestine'], ['anus', 'Anus']],
  decoys: [],
  food: ['mouth', 'pharynx'], foodEnds: ['Outside', 'Intestine'],
  waste: ['anus'], wasteEnds: ['Intestine', 'Outside'],
  model: 'system',
});

export class FeedingPathsChallengeScene extends SlotBoardScene {
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 2375;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1200; static HEIGHT = 420; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS + TWO_UP); wideBoard(this); }
  static CONFIG = {
    ariaLabel: 'Four body plans: food route, waste route and organisation challenge',
    titles: ['Build each route'],
    sections: [{ id: 'animals', cards: [sponge, hydra, flatworm, roundworm] }],
    text: {
      ready: 'All filled in? Press Check.',
      solvedHead: 'All four routes fit!',
      solved: 'Every route uses only parts that animal has, and each level is right.',
    },
  };
}
