import { NameDecoderScene } from 'simulations/base/kit/NameDecoderScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l06-d01: read the pieces of a name, then pick the body it describes.
// All behaviour lives in simulations/base/kit/NameDecoderScene.js; the word
// pieces, plain names and pictures come from the course glossary.json, so a
// change there shows up here and in every tap-to-gloss card.
const CONFIG = {
  ariaLabel: 'Read the pieces of four animal phylum names and pick the animal each name describes.',
  mode: 'decode',
  noun: 'animal',
  terms: ['porifera', 'cnidaria', 'platyhelminthes', 'nematoda'],
  pool: [],
};

export class FourPhylaNamesDecodeScene extends NameDecoderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1100; static HEIGHT = 300; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS); wideBoard(this); }
}
