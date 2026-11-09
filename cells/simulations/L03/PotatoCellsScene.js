// PotatoCellsScene - the three close views of PotatoWeighScene: A's surface cells, B's surface cells, a root hair in soil.
import { PotatoWeighScene } from './PotatoWeighScene.js';

const one = (idx) => [{ idx, dwellMs: null }];
export class PotatoCellsScene extends PotatoWeighScene {
  static BEAT_STEP_MAP = [one(3), one(4), one(5)];
  static ARIA_LABEL = 'Close views. Potato cells under plain water, with more water arrows going in than out. Potato cells under salt solution, with more arrows going out and the salt staying outside. A root hair in soil, with water entering it.';
}
