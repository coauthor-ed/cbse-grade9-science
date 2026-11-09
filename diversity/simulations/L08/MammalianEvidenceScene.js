// MammalianEvidenceScene - L08 blk-l08-s03, 3 beats. Beat 0: a dolphin mother with her calf, mammary glands cut open,
// milk reaching the calf, and a tigress with her cub. Beat 1: a dolphin at the surface, lungs cut open, air through the
// blowhole. Beat 2: the five groups, each drawn, under the three things that sort them.
import { BioStage, beats, pill, panel, flow, move, INK } from '../L03/BioStage.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { seaSetting, tag } from '../L06/BodyKit.js';
import { words } from '../shared/SeaBits.js';
import { dolphinBig, fishBig, frogBig, lizardBig, sparrowBig, tigerBig, mx } from './VertArt.js';

const GROUPS = [
  ['Fish', (x, y, k) => fishBig(x, y - 26 * k, 0.3 * k)],
  ['Amphibians', (x, y, k) => frogBig(x, y, 0.34 * k)],
  ['Reptiles', (x, y, k) => lizardBig(x + 8, y - 18 * k, 0.4 * k)],
  ['Birds', (x, y, k) => sparrowBig(x - 6, y, 0.42 * k)],
  ['Mammals', (x, y, k) => tigerBig(x - 42 * k, y, 0.25 * k) + dolphinBig(x + 54 * k, y - 26 * k, 0.21 * k)],
];

export class MammalianEvidenceScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'A dolphin mother feeds her calf on milk from mammary glands, and a tigress stands with her cub. A dolphin at the surface breathes air with lungs through a blowhole. The five vertebrate groups: fish, amphibians, reptiles, birds and mammals.';
  heights = [[410, 420], [300, 370], [440, 400]];

  _milk(st) {
    const { W, H, portrait: P } = st, fy = P ? 262 : H - 30, mxx = P ? W * 0.56 : W * 0.4, my = P ? 92 : 124, s = P ? 0.78 : 0.94;
    let g = seaSetting(st, fy);
    g += dolphinBig(mxx, my, s, { glands: true });
    const k = s * 0.46, gx = mxx - 76 * s, gy = my + 26 * s, cx = gx - 8 - 158 * k + (P ? 44 : 40), cy = gy + 74;
    g += move('drift', 0, dolphinBig(cx, cy, k), '--dx:3px;--dy:-3px');
    g += flow(`M${gx} ${gy + 4}Q${gx + 2} ${gy + 34} ${cx + 156 * k} ${cy - 8}`, lc('white'), 6);
    g += tag(P ? 90 : 104, 28, gx, gy - 8, 'Mammary glands', { size: 16 });
    g += pill(cx + 158 * k + (P ? 84 : 60), cy + (P ? 10 : 46), 'Milk for the calf', { size: 15 });
    if (P) {
      const ty = fy + 22;
      g += `<rect y="${ty}" width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.5))}/><rect y="${ty}" width="${W}" height="3" ${fill(INK)}/>`;
      g += tigerBig(100, H - 14, 0.44) + tigerBig(214, H - 14, 0.2);
      g += words(W - 58, ty + 34, 'A tigress', { size: 15, display: true, ink: INK }) + words(W - 58, ty + 54, 'and her cub', { size: 15, display: true, ink: INK });
    } else {
      const bx = W - 232, by = H - 186;
      g += panel(bx, by, 216, 160, mx(lc('sand'), lc('white'), 0.5));
      g += tigerBig(bx + 84, by + 142, 0.4) + tigerBig(bx + 176, by + 142, 0.17) + words(bx + 108, by + 26, 'A tigress and her cub', { size: 16, display: true, ink: INK });
    }
    return g;
  }
  _lungs(st) {
    const { W, H, portrait: P } = st, sea = 86, s = P ? 0.92 : 1.16, dx = W / 2 - (P ? 16 : 20), dy = sea + 64 * s;
    let g = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/>`;
    g += `<g transform="translate(0 ${sea})">${seaSetting({ W, H: H - sea }, H - sea - 24)}</g><rect y="${sea - 3}" width="${W}" height="6" ${fill(lc('white'), 'opacity:0.7')}/>`;
    g += dolphinBig(dx, dy, s, { lungs: true });
    const bx = dx + 66 * s, by = dy - 66 * s;
    g += flow(`M${bx} ${by - 52}L${bx} ${by - 4}`, lc('white'), 6);
    g += pill(bx + (P ? 30 : 42), 28, 'Air', { size: 16 });
    g += tag(P ? 76 : dx - 170, 40, bx - 4, by, 'Blowhole', { size: 16 });
    g += tag(P ? 74 : dx - 150, H - (P ? 34 : 50), dx + 14 * s, dy - 18 * s, 'Lungs', { size: 17 });
    g += pill(W - (P ? 74 : 110), H - (P ? 40 : 56), 'No gills', { size: 17 });
    return g;
  }
  _five(st) {
    const { W, H, portrait: P } = st;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.56))}/>`;
    g += words(W / 2, 30, P ? 'Sorted by habitat use,' : 'Sorted by habitat use, body covering and reproduction', { size: P ? 15.5 : 17, display: true, ink: INK });
    if (P) g += words(W / 2, 50, 'body covering and reproduction', { size: 15.5, display: true, ink: INK });
    const top = P ? 62 : 46, cols = P ? 2 : 3, gap = 10, cw = (W - 20 - gap * (cols - 1)) / cols, rows = P ? 3 : 2, ch = (H - top - 12 - gap * (rows - 1)) / rows;
    GROUPS.forEach(([name, art], i) => {
      const r = Math.floor(i / cols), n = r === rows - 1 ? GROUPS.length - cols * (rows - 1) : cols;
      const off = (W - 20 - n * cw - (n - 1) * gap) / 2;
      const x = 10 + off + (i % cols) * (cw + gap), y = top + r * (ch + gap);
      g += `<g class="bs-pop" style="--d:${(i * 0.08).toFixed(2)}s">` + panel(x, y, cw, ch, lc('white'));
      const k = P ? 1 : 1.22;
      g += art(x + cw / 2, y + ch - 34, k) + words(x + cw / 2, y + ch - 10, name, { size: 16, display: true, ink: INK }) + '</g>';
    });
    return g;
  }
  draw(st, step) { return [this._milk, this._lungs, this._five][step].call(this, st); }
}
