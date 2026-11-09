// StationarySpongePuzzleScene - L06 blk-l06-s01, 1 beat. A sponge fixed to a rock while the sea moves past. The water
// goes by on both sides and does not enter: the next slide asks the question and the slide after it answers.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { svgBio, BOX } from '../shared/BioArt.js';
import { one, lc, mx, LIFE_COLOR_MAP, frame, anim, seaLabel, tag, seaSetting, flowArrow, fill, n1 } from './BodyKit.js';

export class StationarySpongePuzzleScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 430; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'A large yellow sponge fixed to a rock on the sea floor, with the sea water moving past it.';
  static CONTROLS = [];
  enter() { this.play?.(10); }
  stageHeight(st) { return st.portrait ? 320 : 430; }
  animate(st, t) {
    const { W, H } = st, n = 16; let d = '';
    for (let i = 0; i < n; i++) {
      const u = (i / n + (t || 0) * 0.05 + (i % 3) * 0.11) % 1, y = 40 + ((i * 37) % 100) / 100 * (H - 110);
      d += `<circle cx="${n1(u * (W + 40) - 20)}" cy="${n1(y + Math.sin(u * 9 + i) * 8)}" r="${2 + i % 3}" ${fill(mx(lc('white'), lc('sea'), 0.2), 'opacity:0.7')}/>`;
    }
    anim(this, 'w', d);
  }
  paint(st) {
    const { W, H, portrait: P } = st, fy = H - 44, cx = W * 0.5, k = (fy - 40) / BOX.Sponge[3];
    let g = seaSetting(st, fy);
    g += `<g data-anim="w"></g>`;
    g += svgBio('Sponge', cx, fy + 8, k);
    g += flowArrow([14, 74], [W * 0.13, 58], [W * 0.26, 76], lc('seaDeep'), 6);
    g += flowArrow([W - W * 0.26, 96], [W * 0.87, 80], [W - 16, 96], lc('seaDeep'), 6);
    g += seaLabel(P ? 60 : 92, 44, 'Sea water', { size: 17 });
    g += tag(P ? 72 : 130, fy - 24, cx - BOX.Sponge[2] * k * 0.4, fy, 'Fixed to the rock');
    return { svg: frame(st, 'sp', g) };
  }
}
