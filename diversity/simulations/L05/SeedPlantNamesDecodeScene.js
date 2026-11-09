import { NameDecoderScene } from 'simulations/base/kit/NameDecoderScene.js';
import { noFaces } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l05-d01: read the pieces of a name, then pick the body it describes.
// All behaviour lives in simulations/base/kit/NameDecoderScene.js; the word
// pieces, plain names and pictures come from the course glossary.json, so a
// change there shows up here and in every tap-to-gloss card.
const CONFIG = {
  ariaLabel: 'Read the pieces of the names gymnosperm and angiosperm and pick the plant each describes.',
  mode: 'decode',
  noun: 'plant',
  terms: ['gymnosperm', 'angiosperm'],
  pool: ['pteridophyta', 'bryophyta', 'thallophyta'],
};

export class SeedPlantNamesDecodeScene extends NameDecoderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1100; static HEIGHT = 300; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); noFaces(this.root); wideBoard(this); }
}
