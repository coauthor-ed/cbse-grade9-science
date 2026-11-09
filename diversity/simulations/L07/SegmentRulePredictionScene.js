// SegmentRulePredictionScene - L07 blk-l07-s02, 1 beat, setup of the predict. The one rule, and the two animals that
// pass it. It shows no phylum and no other feature.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { one, lc, mx, ink, n1, LIFE_COLOR_MAP, fill, words, tick } from '../L06/BodyKit.js';
import { pair, frame } from './SegmentBits.js';

export class SegmentRulePredictionScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 380; static PORTRAIT_WIDTH = 360; static PORTRAIT_HEIGHT = 300;
  static ARIA_LABEL = 'A rule card that says segmented body, with an earthworm and a beetle both passing it.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 270 : 380; }
  paint(st) {
    const { W, H } = st, top = 72, p = pair(st, top, { h1: 92 });
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.6))}/>`;
    g += `<rect x="${n1(W / 2 - 128)}" y="12" width="256" height="48" rx="14" ${fill(lc('white'), `stroke:${ink};stroke-width:3.5`)}/>` + words(W / 2, 43, 'Rule: segmented body', { size: 19, display: true, ink });
    g += p.svg + tick(n1(p.a.x + p.a.w - 26), n1(p.a.y + 26)) + tick(n1(p.b.x + p.b.w - 26), n1(p.b.y + 26));
    return { svg: frame(st, 'sr', g) };
  }
}
