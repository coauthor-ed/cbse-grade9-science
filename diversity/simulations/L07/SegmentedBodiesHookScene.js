// SegmentedBodiesHookScene - L07 blk-l07-s01, 1 beat. An earthworm in soil and a beetle on a leaf, each with its
// segments named. Nothing here says what group either belongs to: the next slide asks that.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { one, lc, mx, LIFE_COLOR_MAP, fill, tag } from '../L06/BodyKit.js';
import { pair, frame, seaLabel } from './SegmentBits.js';

export class SegmentedBodiesHookScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 380; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'An earthworm in soil and a beetle on a leaf. Both bodies are made of repeated segments.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 350 : 380; }
  paint(st) {
    const { W, H, portrait: P } = st, top = P ? 40 : 46, p = pair(st, top, { ring: true, h1: 104 });
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.6))}/>` + p.svg;
    g += seaLabel(p.a.x + p.a.w / 2, 32, 'Earthworm', { size: 19, display: true });
    g += P ? seaLabel(W - 60, p.b.y + 28, 'Beetle', { size: 19, display: true }) : seaLabel(p.b.x + p.b.w / 2, 32, 'Beetle', { size: 19, display: true });
    g += tag(p.a.x + p.a.w * 0.5, p.a.y + 26, p.a.x + p.a.w * 0.5, p.a.y + p.a.h * 0.42, 'Segments', { line: lc('white') });
    g += tag(p.b.x + (P ? 70 : 62), p.b.y + p.b.h * (P ? 0.2 : 0.14), p.b.x + p.b.w / 2 - (P ? 16 : 10), p.b.y + p.b.h * 0.62, 'Segments', { line: lc('ink') });
    return { svg: frame(st, 'sh', g) };
  }
}
