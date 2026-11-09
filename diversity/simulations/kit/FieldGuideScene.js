import { GameScene } from 'simulations/base/kit/GameScene.js';
import { FieldGuide } from './FieldGuide.js';
import { BIO_COLOR_MAP } from '../shared/BioArt.js';
import { bioAv } from '../shared/BoardArt.js';
import { noFaces } from '../shared/NoFaces.js';
import { wideBoard, wideFit } from '../shared/WideBoard.js';

// A course-local extension of the shared GameScene: this course's games are
// all built on the richer classify-by-evidence model (organisms/traits/groups,
// see FieldGuide.js), not the generic base's minimal id lookup. That model,
// and the six game scenes built on it (GuessWho, Conveyor, Expedition, Museum,
// CardPacks, plus this file), live here rather than in the shared engine kit
// because they are specific to this course's field-guide.json, not a general
// capability every course gets - see FieldGuide.js's own header for why.
export class FieldGuideScene extends GameScene {
  static NEEDS_FIELD_GUIDE = true;
  static COLOR_MAP = BIO_COLOR_MAP;
  // Wide design: the slide gives it the full page width at 1280, so a narrow design would be scaled up twofold.
  static WIDTH = 1100;
  static HEIGHT = 300;
  static FILL_HEIGHT = false;
  async setup() {
    await super.setup();
    noFaces(this.root);
    this.injectStyle?.('.bio-ic { overflow: visible; }');
    wideBoard(this);
  }
  // The frame follows the view at 1280: a menu is as tall as a menu, and a blank band never sits under it.
  paint() {
    super.paint();
    wideFit(this);
    // A timed game must not be played with its bins under the action bar: Start brings the whole board into view.
    if (this._shownStage === 'menu' && this.stage === 'play' && this.root) {
      this.root.style.scrollMarginTop = '96px';
      this.root.scrollIntoView({ block: 'start' });
    }
    this._shownStage = this.stage;
  }
  _reconcileOrientation(hostWidth) { super._reconcileOrientation(hostWidth); wideFit(this); }
  _loadFieldGuide(raw) { return FieldGuide.from(raw); }
  av(o, size) { return bioAv(o, size ?? 44) ?? super.av(o, size); }

  /** Human words for the group an organism is in ("Mammalia - mammals"). */
  groupName(gid) { const g = this.fg.group(gid); return g ? g.label : gid; }
}
