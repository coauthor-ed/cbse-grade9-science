// CoveringNotFlightScene - L08 blk-l08-s05, 3 beats. Beat 0: a lizard and a sparrow with their coverings enlarged.
// Beat 1: their eggs, leathery in the soil and hard in a nest. Beat 2: an ostrich beside a sparrow, drawn to rough scale.
import { BioStage, beats, pill, move, INK } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { tag } from '../L06/BodyKit.js';
import { lizardBig, sparrowBig, ostrichBig, eggAt, feather, scales, mx } from './VertArt.js';

export class CoveringNotFlightScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'A lizard with dry scales and a sparrow with feathers. Leathery lizard eggs in soil and hard bird eggs in a nest. An ostrich with feathers and a hard-shelled egg, standing beside a small sparrow.';
  heights = [[480, 380], [420, 340], [440, 430]];

  _covers(st) {
    const { W, H, portrait: P } = st, half = P ? H / 2 : W / 2;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.5))}/>`;
    const rw = P ? W : half;
    if (P) g += `<rect y="${half}" width="${W}" height="${half}" ${fill(lc('skyDay'))}/><rect y="${half}" width="${W}" height="3" ${fill(INK)}/>`;
    else g += `<rect x="${half}" width="${half}" height="${H}" ${fill(lc('skyDay'))}/><rect x="${half}" width="3" height="${H}" ${fill(INK)}/>`;
    // lizard side
    const ly = P ? 186 : 250;
    g += `<path d="M0 ${ly + 12}Q${rw * 0.5} ${ly - 14} ${rw} ${ly + 16}V${P ? half : H}H0Z" ${fill(lc('rockMid'), `stroke:${lc('rockDark')};stroke-width:4`)}/>`;
    g += lizardBig(rw * 0.53, ly - 24, P ? 0.72 : 0.72);
    g += scales(P ? 12 : 16, 14, P ? 132 : 150, 96) + pill(P ? 246 : 242, 60, P ? 'Dry scales' : 'Dry scales', { size: 17 });
    // sparrow side
    const ox = P ? 0 : half, oy = P ? half : 0, bw = P ? W : half, by = oy + (P ? half - 46 : H - 90);
    g += `<path d="M${ox + 6} ${by + 8}Q${ox + bw * 0.5} ${by + 16} ${ox + bw - 4} ${by - 2}" ${stroke(mx(lc('wood'), INK, 0.2), 14, 'stroke-linecap:round')}/>`;
    g += sparrowBig(ox + bw * 0.46, by + 2, P ? 0.92 : 1);
    g += `<g transform="translate(${ox + (P ? 12 : 16)} ${oy + 14})"><rect width="${P ? 132 : 150}" height="96" rx="14" ${fill(lc('white'), `stroke:${INK};stroke-width:3`)}/></g>`;
    g += feather(ox + (P ? 80 : 92), oy + 50, P ? 0.72 : 0.8, { col: lc('brown') }) + feather(ox + (P ? 72 : 84), oy + 76, 0.56, { col: mx(lc('brown'), lc('white'), 0.3) });
    g += pill(ox + (P ? 246 : 242), oy + 60, 'Feathers', { size: 17 });
    return g;
  }
  _eggs(st) {
    const { W, H, portrait: P } = st, half = P ? H / 2 : W / 2;
    let g = `<rect width="${W}" height="${H}" ${fill(lc('soil'))}/>`;
    if (P) g += `<rect y="${half}" width="${W}" height="${half}" ${fill(lc('skyDay'))}/><rect y="${half}" width="${W}" height="3" ${fill(INK)}/>`;
    else g += `<rect x="${half}" width="${half}" height="${H}" ${fill(lc('skyDay'))}/><rect x="${half}" width="3" height="${H}" ${fill(INK)}/>`;
    for (let i = 0; i < 22; i++) { const x = (i * 83) % (P ? W : half), y = 14 + (i * 47) % ((P ? half : H) - 28); g += `<circle cx="${x}" cy="${y}" r="${3 + i % 4}" ${fill(lc('soilDark'), 'opacity:0.5')}/>`; }
    const cx = (P ? W : half) / 2, cy = (P ? half : H) * 0.56, k = P ? 1 : 1.2;
    g += `<ellipse cx="${cx}" cy="${cy + 8}" rx="${118 * k}" ry="${58 * k}" ${fill(mx(lc('soilDark'), INK, 0.3))}/>`;
    [[-74, 8, -16], [-22, -8, 8], [34, 6, -8], [80, -8, 14]].forEach(([dx, dy, r], i) => { g += move('pop', i * 0.08, eggAt(cx + dx * k, cy + dy * k, 0.94 * k, { kind: 'leathery', rot: r + 76 })); });
    g += pill(cx, P ? 28 : 38, 'Lizard: leathery shell', { size: 16 });
    const ox = P ? 0 : half, oy = P ? half : 0, nx = ox + cx, ny = oy + (P ? half : H) * 0.62;
    g += `<path d="M${nx - 126 * k} ${ny - 12}Q${nx} ${ny + 96 * k} ${nx + 126 * k} ${ny - 12}Q${nx} ${ny + 18} ${nx - 126 * k} ${ny - 12}Z" ${fill(lc('wood'), `stroke:${lc('woodDark')};stroke-width:4`)}/>`;
    let tw = ''; for (let i = 0; i < 16; i++) { const u = i / 15, a = nx - 118 * k + 236 * k * u, b = ny + 8 + 44 * k * Math.sin(u * Math.PI); tw += `M${a} ${b}l${(i % 3 - 1) * 16} ${10 + (i % 2) * 6}M${a} ${b}l${(1 - i % 3) * 20} ${-7}`; }
    g += `<path d="${tw}" ${stroke(lc('woodDark'), 3, 'stroke-linecap:round')}/>`;
    [[-56, -16, -12], [0, -24, 4], [56, -16, 14]].forEach(([dx, dy, r], i) => { g += move('pop', 0.1 + i * 0.08, eggAt(nx + dx * k, ny + dy * k, 0.82 * k, { kind: 'hard', rot: r })); });
    g += pill(nx, oy + (P ? 28 : 38), 'Sparrow: hard shell', { size: 16 });
    return g;
  }
  _ostrich(st) {
    const { W, H, portrait: P } = st, gy = H - (P ? 44 : 50);
    let g = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/>`;
    g += `<path d="M0 ${gy - 34}Q${W * 0.3} ${gy - 66} ${W * 0.56} ${gy - 40}T${W} ${gy - 46}V${H}H0Z" ${fill(mx(lc('dryGrass'), lc('sand'), 0.5))}/><rect y="${gy}" width="${W}" height="${H}" ${fill(lc('sand'))}/><rect y="${gy}" width="${W}" height="3" ${fill(lc('sandDark'))}/>`;
    const k = P ? 1.02 : 0.98, x = P ? W * 0.42 : W * 0.46;
    g += ostrichBig(x, gy + 4, k);
    g += sparrowBig(x + (P ? 104 : 148), gy + 1, 0.24);
    g += eggAt(x - (P ? 102 : 150), gy - 28, 0.72, { kind: 'hard' });
    g += tag(P ? 72 : x - 180, P ? 80 : 90, x - 30 * k, gy - 240 * k, 'Feathers', { size: 17 });
    g += tag(x + (P ? 118 : 196), gy - 196 * k, x + 2 * k, gy - 190 * k, 'Wings too small', { size: 16 });
    g += pill(P ? 72 : x - 136, gy + 24, 'Hard-shelled egg', { size: 14 });
    g += pill(x + (P ? 118 : 150), gy + 24, 'Sparrow', { size: 14 });
    return g;
  }
  draw(st, step) { return [this._covers, this._eggs, this._ostrich][step].call(this, st); }
}
