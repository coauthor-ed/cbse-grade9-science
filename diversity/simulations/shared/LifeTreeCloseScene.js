// LifeTreeCloseScene - base for each lesson's closing tree. Not a scene by itself. A close file is:
//   import { LifeTreeCloseScene } from '../shared/LifeTreeCloseScene.js';
//   export class FooCloseScene extends LifeTreeCloseScene { static STAGE = 4; static ARIA_LABEL = '...'; static BEAT_STEP_MAP = [...]; }
// Step n of BEAT_STEP_MAP shows treeOptions(n), default { stage: STAGE }. Override it for a slide that grows in beats:
// return { stage, lit, grown, forks }. The stage height follows the tree.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { lifeTree, LIFE_TREE_CSS } from './LifeTree.js';
import { LIFE_COLOR_MAP } from './LifeArt.js';

export class LifeTreeCloseScene extends SvgScene {
  static STAGE = 2;
  static WIDTH = 640; static HEIGHT = 450; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 560;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static MIN_SCALE = 1;
  static CONTROLS = [];
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];

  css() { return LIFE_TREE_CSS; }
  treeOptions() { return { stage: this.constructor.STAGE }; }
  _tree(st) { const { stage, ...o } = this.treeOptions(this.stepIndex ?? 0, st); return lifeTree(stage, { W: st.W, portrait: st.portrait, ...o }); }
  stageHeight(st) { return this._tree(st).h; }
  paint(st) { return { svg: this._tree(st).svg }; }
}
