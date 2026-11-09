import { NameDecoderScene } from 'simulations/base/kit/NameDecoderScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l06-r01: spaced name check: picture to name and name to picture.
// All behaviour lives in simulations/base/kit/NameDecoderScene.js; the word
// pieces, plain names and pictures come from the course glossary.json, so a
// change there shows up here and in every tap-to-gloss card.
const CONFIG = {
  ariaLabel: 'Match plant-group and microbe-kingdom names with their pictures. Pieces of each name are available as hints.',
  mode: 'recall',
  noun: 'living thing',
  terms: ['thallophyta', 'gymnosperm', 'bryophyta', 'angiosperm', 'pteridophyta', 'monera', 'protista'],
  pool: ['fungi', 'plantae', 'animalia'],
};

export class PlantAndMicrobeNamesRecallScene extends NameDecoderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1100; static HEIGHT = 300; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS); wideBoard(this); }
}
