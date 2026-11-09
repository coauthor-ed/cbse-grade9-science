// AnimaliaMapScene - L06 blk-l06-s00, 3 beats. Beat 0: what animals share, on a tiger and a deer in a forest. Beat 1:
// the notochord splits the kingdom into non-chordata and chordata. Beat 2: the eight phyla in the book's order, with
// the first four lit.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { svgLife } from '../shared/LifeArt.js';
import { tigerBig } from '../L08/VertArt.js';
import { one, lc, mx, ink, n1, LIFE_COLOR_MAP, frame, fill, stroke, words, svgBio, BOX } from './BodyKit.js';

const EIGHT = [['Porifera', 'Sponge'], ['Cnidaria', 'Hydra'], ['Platyhelminthes', 'Flatworm'], ['Nematoda', 'Roundworm'], ['Annelida', 'Earthworm'], ['Arthropoda', 'Beetle'], ['Mollusca', 'Snail'], ['Echinodermata', 'Starfish']];
const pill = (x, y, t, col) => { const w = t.length * 9 + 26; return `<rect x="${n1(x - w / 2)}" y="${y - 17}" width="${n1(w)}" height="34" rx="17" ${fill(col, `stroke:${ink};stroke-width:3`)}/>` + words(x, y + 6, t, { size: 16, ink }); };
const fit = (name, x, y, w, h) => { const [bx, by, bw, bh] = BOX[name], k = Math.min(w / bw, h / bh); return svgBio(name, x - (bx + bw / 2) * k, y - (by + bh / 2) * k, k); };

export class AnimaliaMapScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 420; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'A tiger and a deer in a forest; then the animal kingdom forking at the notochord into non-chordata and chordata; then the eight phyla in order with the first four lit.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? [300, 400, 430][this.stepIndex] ?? 300 : (this.stepIndex === 0 ? 330 : 420); }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex;
    let g = '';
    if (step === 0) {
      const fy = H - 44;
      g += `<rect width="${W}" height="${H}" ${fill(mx(lc('sky'), lc('white'), 0.3))}/>`;
      g += `<rect y="${fy - 6}" width="${W}" height="60" ${fill(lc('grass'))}/>`;
      for (let i = 0; i < 6; i++) g += svgLife('UnderTree', W * (0.08 + i * 0.18), fy, P ? 0.8 : 1.15, { seed: i + 2, alpha: 0.55 });
      const kt = (P ? 145 : 250) / 380, kd = (P ? 92 : 150) / BOX.Deer[2];
      g += tigerBig(P ? W * 0.3 : W * 0.3, fy + 2, kt) + svgBio('Deer', P ? W * 0.76 : W * 0.76, fy + 2, kd);
      const a = lc('white');
      if (P) { g += pill(W / 2 - 62, 30, 'Many cells', a) + pill(W / 2 + 78, 30, 'Moves', a) + pill(W / 2, 74, 'Food from other organisms', a); }
      else { g += pill(W * 0.2, 34, 'Many cells', a) + pill(W * 0.56, 34, 'Food from other organisms', a) + pill(W * 0.87, 34, 'Moves', a); }
    }
    if (step === 1) {
      g += `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.6))}/>`;
      const cx = W / 2, top = 46, fy = P ? 132 : 150, lx = W * 0.25, rx = W * 0.75, trunk = lc('bark');
      g += `<path d="M${cx} ${top + 18}V${fy - 30}" ${stroke(trunk, 16, 'stroke-linecap:round')}/>`;
      g += `<path d="M${cx} ${fy - 34}C${cx} ${fy + 20} ${lx} ${fy - 10} ${lx} ${fy + 62}" ${stroke(trunk, 12, 'stroke-linecap:round')}/><path d="M${cx} ${fy - 34}C${cx} ${fy + 20} ${rx} ${fy - 10} ${rx} ${fy + 62}" ${stroke(trunk, 12, 'stroke-linecap:round')}/>`;
      g += words(cx, top + 2, 'Kingdom Animalia', { size: P ? 20 : 22, display: true, ink, halo: lc('white'), haloW: 5 });
      g += pill(cx, fy - 22, 'Notochord?', lc('white'));
      g += words(lx - 6, fy + 16, 'No', { size: 18, ink, halo: lc('white'), haloW: 5 }) + words(rx + 6, fy + 16, 'Yes', { size: 18, ink, halo: lc('white'), haloW: 5 });
      const yb = fy + 66, bw = W * 0.47, bh = H - yb - 12;
      [[lx, 'Non-chordata', ['Beetle', 'Snail', 'Starfish']], [rx, 'Chordata', ['Amphi', 'Frog', 'Tiger']]].forEach(([x, t, list]) => {
        g += `<rect x="${n1(x - bw / 2)}" y="${yb}" width="${n1(bw)}" height="${n1(bh)}" rx="16" ${fill(lc('white'), `stroke:${ink};stroke-width:3.5`)}/>`;
        g += words(x, yb + 26, t, { size: P ? 18 : 19, display: true, ink });
        const n = P ? 1 : 3, cellW = (bw - 16) / n, rows = P ? 3 : 1, cellH = (bh - 40) / rows;
        list.forEach((a, i) => {
          const c = P ? 0 : i, r = P ? i : 0, px = x - bw / 2 + 8 + (c + 0.5) * cellW, py = yb + 36 + (r + 0.5) * cellH;
          if (a === 'Amphi') g += svgBio('Amphioxus', px, py, Math.min(cellW * 0.86 / BOX.Amphioxus[2], 1.4));
          else if (a === 'Frog') { const k = Math.min(cellH * 0.8 / 25, cellW * 0.8 / 38); g += svgLife('Frog', px, py + 12 * k, k); }
          else g += fit(a, px, py, cellW * 0.8, cellH * 0.84);
        });
      });
    }
    if (step === 2) {
      g += `<rect width="${W}" height="${H}" ${fill(mx(lc('sea'), lc('white'), 0.6))}/>`;
      const cols = P ? 2 : 4, top = 44, gap = 8, cw = (W - 24 - gap * (cols - 1)) / cols, rows = 8 / cols, ch = (H - top - 12 - gap * (rows - 1)) / rows;
      g += words(W / 2, 30, 'Eight phyla, in your book\'s order', { size: P ? 18 : 20, display: true, ink });
      EIGHT.forEach(([n, a], i) => {
        const x = 12 + (i % cols) * (cw + gap), y = top + Math.floor(i / cols) * (ch + gap), on = i < 4;
        g += `<g style="${on ? '' : 'opacity:0.42'}"><rect x="${n1(x)}" y="${n1(y)}" width="${n1(cw)}" height="${n1(ch)}" rx="14" ${fill(lc('white'), `stroke:${on ? lc('seaDeep') : lc('metal')};stroke-width:${on ? 4 : 3}`)}/>`;
        g += fit(a, x + cw / 2, y + (ch - 22) / 2 + 2, cw * 0.72, ch - 34) + words(x + cw / 2, y + ch - 10, n, { size: 15, ink }) + '</g>';
      });
    }
    return { svg: frame(st, 'am', g) };
  }
}
