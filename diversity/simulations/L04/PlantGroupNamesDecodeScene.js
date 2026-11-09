import { NameDecoderScene } from 'simulations/base/kit/NameDecoderScene.js';
import { noFaces } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l04-d01: read the pieces of a name, then pick the plant it describes. Behaviour lives in the kit; the word pieces and pictures come from glossary.json.
const CONFIG = {
  ariaLabel: 'Read the pieces of three plant-group names and pick the plant each name describes.',
  mode: 'decode',
  noun: 'plant',
  terms: ['thallophyta', 'bryophyta', 'pteridophyta'],
  pool: ['gymnosperm', 'angiosperm'],
};

export class PlantGroupNamesDecodeScene extends NameDecoderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1100; static HEIGHT = 300; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); noFaces(this.root); wideBoard(this); }
}
