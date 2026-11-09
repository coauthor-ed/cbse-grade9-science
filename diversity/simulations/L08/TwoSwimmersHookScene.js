// TwoSwimmersHookScene - L08 blk-l08-s01, 2 beats. Beat 0: a tiger with its backbone, spinal cord and brain shown through
// the body, and the bones enlarged. Beat 1: a dolphin and a fish swimming side by side.
import { BioStage, beats, pill, INK } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { seaSetting, tag } from '../L06/BodyKit.js';
import { dolphinBig, fishBig, tigerBig, spine, mx } from './VertArt.js';

export class TwoSwimmersHookScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static ARIA_LABEL = 'A tiger drawn with its backbone, the spinal cord inside the backbone and the brain inside the skull. Then a dolphin and a fish swimming side by side.';
  heights = [[410, 450], [360, 400]];

  _spine(st) {
    const { W, H, portrait: P } = st, s = P ? 0.86 : 1.14, ox = W / 2 - (P ? 6 : 10), oy = P ? 232 : 280, X = (x) => ox + x * s, Y = (y) => oy + y * s;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.62))}/>`;
    g += `<rect y="${oy - 4}" width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.2))}/>`;
    g += tigerBig(ox, oy, s, { alpha: 0.46 });
    const pts = [[-166, -62], [-178, -92], [-150, -118], [-118, -124], [-60, -134], [0, -126], [48, -136], [84, -146], [100, -148]].map(([x, y]) => [X(x), Y(y)]);
    g += spine(pts, { size: P ? 13 : 16, cordW: P ? 5 : 6 });
    const bx = X(126), by = Y(-150);
    g += `<ellipse cx="${bx}" cy="${by}" rx="${s * 38}" ry="${s * 30}" ${fill(mx(lc('white'), lc('sand'), 0.34), `stroke:${mx(lc('sandDark'), INK, 0.3)};stroke-width:4`)}/>`;
    g += `<ellipse cx="${bx}" cy="${by}" rx="${s * 28}" ry="${s * 21}" ${fill(mx(lc('red'), lc('white'), 0.44), `stroke:${mx(lc('red'), INK, 0.3)};stroke-width:2.5`)}/>`;
    g += `<path d="M${bx - s * 20} ${by - 2}q6 -8 12 0q6 8 12 0q6 -8 12 0" ${stroke(mx(lc('red'), INK, 0.3), 2.4)}/>`;
    g += tag(P ? 72 : 130, 30, X(-60), Y(-134), 'Backbone', { size: 16 });
    g += tag(P ? 188 : 320, 30, X(20), Y(-130), 'Spinal cord', { size: 16 });
    g += tag(W - (P ? 58 : 110), 30, bx - s * 4, by - s * 6, 'Brain', { size: 16 });
    g += tag(W - (P ? 44 : 60), by + (P ? 66 : 80), bx + s * 34, by + s * 12, 'Skull', { size: 16 });
    // the bones, enlarged
    const zy = H - (P ? 70 : 66), zx0 = P ? 34 : 110, zx1 = W - (P ? 34 : 110);
    g += `<rect x="${zx0 - 18}" y="${zy - 46}" width="${zx1 - zx0 + 36}" height="${92}" rx="18" ${fill(lc('white'), `stroke:${INK};stroke-width:3`)}/>`;
    g += spine([[zx0 + 8, zy + 10], [zx1 - 8, zy + 10]], { size: 40, h: 46, cordW: 13 }) + pill(W / 2, zy - 46, 'Bones, enlarged', { size: 14 });
    return g;
  }
  _swim(st) {
    const { W, H, portrait: P } = st, fy = H - (P ? 34 : 40);
    let g = seaSetting(st, fy);
    g += `<g class="bs-drift" style="--dx:7px;--dy:-5px">${dolphinBig(P ? W * 0.53 : W * 0.61, P ? 118 : 128, P ? 0.82 : 1.02)}</g>`;
    g += `<g class="bs-drift" style="--dx:-6px;--dy:4px;--d:0.5s">${fishBig(P ? W * 0.5 : W * 0.28, P ? 262 : 268, P ? 0.62 : 0.72)}</g>`;
    g += pill(P ? 66 : W - 94, P ? 42 : 42, 'Dolphin', { size: 17 }) + pill(P ? W - 62 : 72, P ? 200 : 186, 'Fish', { size: 17 });
    return g;
  }
  draw(st, step) { return step === 0 ? this._spine(st) : this._swim(st); }
}
