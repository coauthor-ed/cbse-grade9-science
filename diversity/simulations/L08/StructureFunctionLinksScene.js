// StructureFunctionLinksScene - L08 blk-l08-s06, 6 beats, one hero each. 0 fish: fins and gills. 1 a bird's wing and a
// hollow bone cut open. 2 a camel with its hump cut open. 3 a polar bear and its fur enlarged, air held in it, heat held
// back. 4 a young mammal at its mother. 5 three generations of a made-up bear group: thick fur becomes more common.
import { BioStage, beats, pill, panel, move, INK } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { seaSetting, tag } from '../L06/BodyKit.js';
import { words } from '../shared/SeaBits.js';
import { fishBig, dolphinBig, bearBig, camelBig, tigerBig, feather, mx } from './VertArt.js';

const HEAT = lc('red');
function wing(cx, cy, k) {
  // A spread wing: long feathers fanned from the wrist, coverts over their roots.
  let g = '';
  const col = lc('brown');
  for (let i = 0; i < 9; i++) { const a = 92 + i * 11, r = (168 - i * 4) * k; g += `<g transform="translate(${cx} ${cy}) rotate(${a}) translate(${r * 0.55} 0)">${feather(0, 0, r / 150, { col: i % 2 ? col : mx(col, lc('white'), 0.18) })}</g>`; }
  for (let i = 0; i < 7; i++) { const a = 96 + i * 13, r = 84 * k; g += `<g transform="translate(${cx} ${cy}) rotate(${a}) translate(${r * 0.5} 0)">${feather(0, 0, r / 150, { col: mx(col, lc('sand'), 0.5) })}</g>`; }
  return g;
}
function bone(x, y, w, h) {
  const b = mx(lc('white'), lc('sand'), 0.34), rim = mx(lc('sandDark'), INK, 0.3);
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" ${fill(b, `stroke:${rim};stroke-width:4`)}/>`;
  g += `<rect x="${x + 14}" y="${y + 9}" width="${w - 28}" height="${h - 18}" rx="${(h - 18) / 2}" ${fill(mx(lc('skyDay'), lc('white'), 0.5), `stroke:${rim};stroke-width:2.5`)}/>`;
  let d = '', n = Math.floor((w - 40) / 26);
  for (let i = 0; i < n; i++) { const px = x + 22 + i * 26; d += `M${px} ${y + 10}L${px + 14} ${y + h - 10}L${px + 26} ${y + 10}`; }
  return g + `<path d="${d}" ${stroke(rim, 3, 'stroke-linejoin:round')}/>`;
}
function herd(x, y, k, thick) {
  const ring = thick ? `<ellipse cx="${x}" cy="${y}" rx="${64 * k + 5}" ry="7" ${fill(lc('yellow'), `stroke:${INK};stroke-width:2`)}/>` : '';
  return ring + `<g opacity="${thick ? 1 : 0.72}">${bearBig(x, y, k * 0.36)}</g>`;
}

export class StructureFunctionLinksScene extends BioStage {
  static BEAT_STEP_MAP = beats(6);
  static ARIA_LABEL = 'Six animal bodies, one at a time. A fish with fins and gills. A bird wing and a hollow bone. A camel with fat stored in its hump. A polar bear with air held in its fur. A cub drinking milk. Three rows of bears, where thick fur grows more common over generations.';
  heights = [[280, 340], [440, 400], [380, 390], [470, 400], [340, 370], [430, 430]];

  _fish(st) {
    const { W, H, portrait: P } = st, s = P ? 0.8 : 1;
    let g = seaSetting(st, H - 26) + move('drift', 0, fishBig(W / 2, H * 0.48, s, { gills: true }), '--dx:8px;--dy:0px');
    g += tag(P ? 70 : 96, 28, W / 2 - 14 * s, H * 0.48 - 92 * s, 'Fins', { size: 17 }) + tag(W - (P ? 72 : 120), 28, W / 2 + 80 * s, H * 0.48 - 20 * s, 'Gills', { size: 17 });
    return g;
  }
  _flight(st) {
    const { W, H, portrait: P } = st;
    let g = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/>`;
    const wx = P ? W - 40 : W * 0.5, wy = P ? 26 : 34;
    g += wing(wx, wy, P ? 1.34 : 1.56);
    if (P) {
      g += pill(90, 30, 'Broad surface', { size: 16 });
      const by = H - 112;
      g += `<rect y="${by - 26}" width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.56))}/><rect y="${by - 26}" width="${W}" height="3" ${fill(INK)}/>`;
      g += bone(26, by + 14, W - 52, 60) + words(W / 2, by + 2, 'Hollow bone, cut open', { size: 16, display: true, ink: INK });
    } else {
      const bx = W * 0.54, bw = W - bx - 24;
      g += panel(bx, 196, bw, 170, mx(lc('sand'), lc('white'), 0.56));
      g += bone(bx + 18, 256, bw - 36, 64) + words(bx + bw / 2, 232, 'Hollow bone, cut open', { size: 16, display: true, ink: INK });
      g += pill(bx + bw / 2, 90, 'Broad surface', { size: 17 });
    }
    return g;
  }
  _camel(st) {
    const { W, H, portrait: P } = st, gy = H - 34, k = P ? 1.86 : 2.3, x = W / 2 - (P ? 40 : 60);
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('skyDay'), lc('sand'), 0.2))}/>`;
    g += `<circle cx="${W - 54}" cy="52" r="26" ${fill(lc('yellow'))}/>`;
    g += `<path d="M0 ${gy - 44}Q${W * 0.26} ${gy - 86} ${W * 0.56} ${gy - 44}T${W} ${gy - 60}V${H}H0Z" ${fill(mx(lc('sand'), lc('sandDark'), 0.3))}/><path d="M0 ${gy - 6}Q${W * 0.4} ${gy - 24} ${W} ${gy}V${H}H0Z" ${fill(lc('sand'))}/>`;
    g += camelBig(x, gy + 6, k * 0.42, { cut: true });
    const hx = x - 2 * k * 0.42, hy = gy + 6 - 244 * k * 0.42;
    g += tag(P ? 78 : hx - 150, 34, hx - 8, hy, 'Fat, not water', { size: 17 });
    return g;
  }
  _bear(st) {
    const { W, H, portrait: P } = st, ice = P ? 168 : H - 60;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('skyDay'), lc('white'), 0.3))}/>`;
    g += `<path d="M0 ${ice}Q${W * 0.3} ${ice - 16} ${W * 0.6} ${ice - 2}T${W} ${ice - 8}V${H}H0Z" ${fill(lc('white'), `stroke:${lc('snowDeep')};stroke-width:3`)}/>`;
    const bx = P ? W * 0.46 : W * 0.25, k = P ? 1.8 : 2;
    g += bearBig(bx, ice + 6, k * 0.36);
    const fx = P ? 16 : W * 0.5, fy = P ? ice + 22 : 26, fw = P ? W - 32 : W - fx - 18, fh = P ? H - fy - 14 : H - 52;
    g += panel(fx, fy, fw, fh, mx(lc('skyDay'), lc('white'), 0.5));
    const sk = fy + fh - 54, air = sk - 98;
    g += `<rect x="${fx + 3}" y="${sk}" width="${fw - 6}" height="51" rx="10" ${fill(mx(lc('red'), lc('white'), 0.56))}/>`;
    g += `<rect x="${fx + 3}" y="${air}" width="${fw - 6}" height="${sk - air}" ${fill(mx(lc('yellow'), lc('white'), 0.6))}/>`;
    let hair = ''; const n = Math.floor((fw - 16) / 15);
    for (let i = 0; i < n; i++) { const hx = fx + 12 + i * 15; hair += `M${hx} ${sk}Q${hx + 12} ${sk - 50} ${hx + 2 + (i % 3) * 6} ${air - 26 - (i % 2) * 8}`; }
    g += `<path d="${hair}" ${stroke(lc('snowDeep'), 8, 'stroke-linecap:round')}/><path d="${hair}" ${stroke(lc('white'), 5, 'stroke-linecap:round')}/>`;
    [0.16, 0.5, 0.84].forEach((u, i) => { const ax = fx + fw * u; g += move('rise', i * 0.3, `<path d="M${ax} ${sk + 22}V${sk - 38}" ${stroke(HEAT, 7, 'stroke-linecap:round')}/><path d="M${ax - 11} ${sk - 28}L${ax} ${sk - 46}L${ax + 11} ${sk - 28}Z" ${fill(HEAT)}/>`); });
    g += pill(fx + fw / 2, sk + 26, 'Skin: warm', { size: 15 }) + pill(fx + fw / 2, air + 22, 'Air held in the fur', { size: 15 });
    g += words(fx + fw / 2, fy + 28, 'Fur, enlarged: cold outside', { size: 16, display: true, ink: INK });
    return g;
  }
  _milk(st) {
    const { W, H, portrait: P } = st, gy = H - 34, k = P ? 1.76 : 2.5, x = W / 2 + (P ? 22 : -70);
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('skyDay'), lc('white'), 0.2))}/><rect y="${gy}" width="${W}" height="${H}" ${fill(lc('grass'))}/><rect y="${gy}" width="${W}" height="4" ${fill(mx(lc('grass'), INK, 0.3))}/>`;
    const T = k * 0.42, cubS = P ? 0.36 : 0.44, gx = x - 38 * T, gyy = gy + 4 - 68 * T;
    g += tigerBig(x, gy + 4, T, { glands: true });
    g += tigerBig(gx - 176 * cubS, gy + 4, cubS);
    g += tag(P ? 86 : 120, 34, gx, gyy - 12, 'Mammary glands', { size: 16 });
    if (!P) g += panel(W - 196, 40, 176, 150, mx(lc('sea'), lc('white'), 0.2)) + dolphinBig(W - 108, 100, 0.42) + dolphinBig(W - 142, 150, 0.2) + words(W - 108, 180, 'In the sea too', { size: 15, ink: INK, display: true });
    else g += pill(W - 80, 34, 'Land or sea', { size: 15 });
    return g;
  }
  _gens(st) {
    const { W, H, portrait: P } = st, SEQ = [[1, 0, 0, 0, 1, 0], [1, 0, 1, 1, 0, 1], [1, 1, 1, 1, 1, 1]];
    let g = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/>`;
    const top = 12, rh = (H - top - (P ? 50 : 50)) / 3, k = P ? 0.44 : 0.62, x0 = 16, cw = (W - 32) / 6;
    SEQ.forEach((row, r) => {
      const y = top + r * rh, n = row.reduce((a, b) => a + b, 0);
      g += panel(8, y, W - 16, rh - 8, mx(lc('sea'), lc('skyDay'), 0.5));
      row.forEach((t, i) => { g += herd(x0 + cw * (i + 0.5) - 3, y + rh - 22, k, !!t); });
      g += words(22, y + 24, ['A group of bears', 'A later generation', 'Many generations later'][r], { size: 15, display: true, ink: INK, anchor: 'start' });
      g += words(W - 22, y + 24, `${n} of 6`, { size: 18, display: true, ink: INK, anchor: 'end' });
    });
    g += pill(W / 2, H - 22, 'Gold: thick fur. A made-up group.', { size: 14 });
    return g;
  }
  draw(st, step) { return [this._fish, this._flight, this._camel, this._bear, this._milk, this._gens][step].call(this, st); }
}
