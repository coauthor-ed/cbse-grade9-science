// KingdomMapScene - blk-l02-s06, 4 beats. The five kingdom concept map as the module's tree, grown one test per beat. No control.
import { LifeTreeCloseScene } from '../shared/LifeTreeCloseScene.js';

const one = (idx) => [{ idx, dwellMs: null }];
const NEW = [['Monera'], ['Protista'], ['Animalia'], ['Fungi', 'Plantae']];

export class KingdomMapScene extends LifeTreeCloseScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static STAGE = 2;
  static WIDTH = 520; static HEIGHT = 440; static PORTRAIT_HEIGHT = 560;
  static ARIA_LABEL = 'A drawn tree that grows one test at a time. Cell type puts prokaryotes in Monera. Level of organisation puts unicellular eukaryotes in Protista. Cell structure puts those with no cell wall in Animalia. Mode of nutrition separates Fungi, with chitin walls, from Plantae, with cellulose walls.';
  treeOptions(step, st) { return { stage: 2, forks: true, grown: step + 1, lit: NEW[step], ghost: true, compact: !st.portrait, fillH: st.portrait ? 0 : 402 }; }
}
