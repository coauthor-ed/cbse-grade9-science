// SegmentRuleResolutionScene - L07 blk-l07-s03, 2 beats. Beat 0: a feature table for earthworm and beetle: both
// segmented, only the beetle has jointed legs and a hard outer covering. Beat 1: the two phyla named, and a tiger added
// so that jointed legs alone are seen not to make an arthropod.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { one, lc, mx, ink, n1, LIFE_COLOR_MAP, frame, fill, words, tick, cross, svgBio, BOX } from '../L06/BodyKit.js';
import { fitBig } from '../L08/VertArt.js';

const ROWS = [['Segments', [1, 1, 0]], ['Jointed legs', [0, 1, 1]], ['Hard outer skeleton', [0, 1, 0]]];
const COLS = [['Earthworm', 'Earthworm', 'Annelida'], ['Beetle', 'Beetle', 'Arthropoda'], ['Tiger', 'Tiger', 'Chordata']];

export class SegmentRuleResolutionScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 420; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'A table comparing earthworm, beetle and tiger for segments, jointed legs and a hard outer skeleton. The tiger has jointed legs, but its skeleton is inside.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 400 : 398; }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex, n = step ? 3 : 2;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.6))}/>`;
    const lw = P ? 0 : 170, m = P ? 6 : 12, cw = (W - lw - 2 * m) / n, artH = P ? (step ? 118 : 100) : 138, top = P ? 6 : 10;
    // On a phone the cards stop under the art and each row is a band across the page, so a row name crosses no column.
    const bandTop = top + artH + 6, rh = P ? (H - bandTop - 8) / 3 : (H - artH - top - (step ? 36 : 12) - 12) / 3;
    COLS.slice(0, n).forEach(([t, a, phy], c) => {
      const x = m + lw + c * cw, [bx, by, bw, bh] = BOX[a], nameY = top + (P ? (step ? 76 : 88) : artH - 6), artRoom = P ? (step ? 52 : 62) : artH - 38, k = Math.min((cw - 24) / bw, artRoom / bh);
      g += `<rect x="${n1(x + 4)}" y="${top}" width="${n1(cw - 8)}" height="${P ? artH : H - top - 12}" rx="16" ${fill(lc('white'), `stroke:${ink};stroke-width:3.5`)}/>`;
      g += a === 'Tiger' ? fitBig('Tiger', x + 12, top + (P ? 6 : 10), cw - 24, artRoom) : svgBio(a, x + cw / 2 - (bx + bw / 2) * k, top + (P ? 6 : 10) + artRoom / 2 - (by + bh / 2) * k, k);
      g += words(n1(x + cw / 2), nameY, t, { size: P ? (n === 3 ? 15 : 18) : 18, display: true, ink });
      if (step) g += words(n1(x + cw / 2), P ? nameY + 22 : H - 24, phy, { size: P ? 14 : 17, ink, display: true });
    });
    ROWS.forEach(([t, v], r) => {
      const y = P ? bandTop + r * rh : top + artH + 14 + r * rh;
      if (P) g += `<rect x="${m + 4}" y="${n1(y)}" width="${n1(W - 2 * m - 8)}" height="${n1(rh - 6)}" rx="12" ${fill(lc('white'), `stroke:${ink};stroke-width:2.5`)}/>` + words(m + 16, n1(y + 20), t, { size: 15, ink, anchor: 'start' });
      else g += words(m + lw - 10, y + rh / 2 + 5, t, { size: 16, ink, anchor: 'end' });
      for (let c = 0; c < n; c++) { const x = n1(m + lw + (c + 0.5) * cw), yy = n1(P ? y + rh - 24 : y + rh / 2); g += v[c] ? tick(x, yy, P ? 12 : 14) : cross(x, yy, P ? 12 : 14); if (r === 2 && c === 2) g += words(x + (P ? -16 : 20), yy + 5, 'Inside', { size: 15, ink, anchor: P ? 'end' : 'start' }); }
    });
    return { svg: frame(st, 'rr', g) };
  }
}
