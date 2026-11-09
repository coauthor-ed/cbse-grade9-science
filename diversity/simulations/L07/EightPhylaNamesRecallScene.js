import { NameDecoderScene } from 'simulations/base/kit/NameDecoderScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l07-r01: spaced name check: picture to name and name to picture.
// All behaviour lives in simulations/base/kit/NameDecoderScene.js; the word
// pieces, plain names and pictures come from the course glossary.json, so a
// change there shows up here and in every tap-to-gloss card.
const CONFIG = {
  ariaLabel: 'Match the eight non-chordate phylum names with their animals. Pieces of each name are available as hints.',
  mode: 'recall',
  noun: 'animal',
  terms: ['porifera', 'annelida', 'cnidaria', 'arthropoda', 'platyhelminthes', 'mollusca', 'nematoda', 'echinodermata'],
  pool: ['chordata'],
};

export class EightPhylaNamesRecallScene extends NameDecoderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1100; static HEIGHT = 300; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS); wideBoard(this); }
}
