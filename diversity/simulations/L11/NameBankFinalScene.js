import { NameDecoderScene } from 'simulations/base/kit/NameDecoderScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { gameInk } from '../L03/BioStage.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l11-r01: spaced name check: picture to name and name to picture.
// All behaviour lives in simulations/base/kit/NameDecoderScene.js; the word
// pieces, plain names and pictures come from the course glossary.json, so a
// change there shows up here and in every tap-to-gloss card.
const CONFIG = {
  ariaLabel: 'Match names from across the course with their pictures. Pieces of each name are available as hints.',
  mode: 'recall',
  plainCue: false,
  noun: 'living thing',
  terms: ['archaea', 'nematoda', 'angiosperm', 'cnidaria', 'mammalia', 'bacteria', 'annelida', 'arthropoda'],
  pool: ['monera', 'protista', 'fungi', 'pisces'],
};

export class NameBankFinalScene extends NameDecoderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1100; static HEIGHT = 300; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS); gameInk(this.root); wideBoard(this); }
}
