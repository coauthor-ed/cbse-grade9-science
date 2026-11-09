// CellTimelineSetupScene - predict setup, blk-l09-s00. The rail up to 1839 and one dashed card with a question mark. Later dates stay hidden.
import { CellTimelineScene } from './CellTimelineScene.js';

export class CellTimelineSetupScene extends CellTimelineScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'A rail of years with cards for 1665 Robert Hooke, 1838 Schleiden and 1839 Schwann, and one empty dashed card with a question mark after them.';
  static HEIGHT = 348;
  stageHeight(st) { return st.portrait ? 430 : 346; }
  shown() { return 1; }
  mystery() { return true; }
}
