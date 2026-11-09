import { NameDecoderScene } from 'simulations/base/kit/NameDecoderScene.js';
import { NO_FACES_CSS } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// blk-l08-r01: name check: picture to name and name to picture.
// All behaviour lives in simulations/base/kit/NameDecoderScene.js; the word
// pieces, plain names and pictures come from the course glossary.json, so a
// change there shows up here and in every tap-to-gloss card.
const CONFIG = {
  ariaLabel: 'Match vertebrate group names and earlier phylum names with their animals. Pieces of each name are available as hints.',
  mode: 'recall',
  plainCue: false,
  noun: 'animal',
  terms: ['pisces', 'arthropoda', 'amphibia', 'annelida', 'reptilia', 'mollusca', 'aves', 'mammalia'],
  pool: ['echinodermata', 'cnidaria'],
};

export class VertebrateAndPhylaNamesRecallScene extends NameDecoderScene {
  static CONFIG = CONFIG;
  static ARIA_LABEL = CONFIG.ariaLabel;
  static WIDTH = 1100; static HEIGHT = 300; static FILL_HEIGHT = false;
  _fit() { wideFit(this); }
  async setup() { await super.setup(); this.injectStyle?.(NO_FACES_CSS); wideBoard(this); }
}
