// PineSeedPuzzleScene - blk-l05-s01. Beat 0: a pine on a cold hill, a cone enlarged. Beat 1: one scale, seeds lying open, with the Greek pieces of gymnosperm.
import { BioStage, beats, pill, INK } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc } from '../shared/BioArt.js';

import { coneScale } from '../L04/PlantBits.js';

export class PineSeedPuzzleScene extends BioStage {
  static BEAT_STEP_MAP = beats(2);
  static ARIA_LABEL = 'A pine on a cold hill with a cone among its needles. Then a cone scale with two seeds lying on it and no fruit around them.';
  heights = [[300, 360], [290, 350]];
  _hill(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.86, k = (H * 0.8) / 190, tx = W * 0.3;
    let s = `<rect width="${W}" height="${H}" ${fill(`color-mix(in oklab, ${lc('skyDay')} 62%, ${lc('white')})`)}/>`;
    s += `<path d="M0 ${gy - 60}L${W * 0.3} ${H * 0.28}L${W * 0.56} ${gy - 80}L${W * 0.82} ${H * 0.2}L${W} ${gy - 70}V${H}H0Z" ${fill(lc('strata5'))}/>`;
    s += `<path d="M${W * 0.25} ${H * 0.37}L${W * 0.3} ${H * 0.28}L${W * 0.36} ${H * 0.38}ZM${W * 0.76} ${H * 0.32}L${W * 0.82} ${H * 0.2}L${W * 0.88} ${H * 0.31}Z" ${fill(lc('white'))}/>`;
    s += `<rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('whiteShade'))}/>` + svgBio('PineTree', tx, gy + 4, k);
    const c = P ? 86 : 110, cx = W * 0.72, cy = H * 0.5;
    s += `<circle cx="${cx}" cy="${cy}" r="${c}" ${fill(lc('white'), `stroke:${INK};stroke-width:6`)}/>` + svgBio('Cone', cx, cy, (c * 1.6) / 68);
    return s + pill(cx, cy + c + 2, 'Cone', { on: true });
  }
  _scale(st) {
    const W = st.W, H = st.H, P = st.portrait, k = P ? 1.2 : 1.5, cx = P ? W * 0.5 : W * 0.32, cy = P ? H * 0.38 : H * 0.5;
    let s = `<rect width="${W}" height="${H}" ${fill(`color-mix(in oklab, ${lc('skyDay')} 62%, ${lc('white')})`)}/>` + coneScale(cx, cy, k);
    const lx = P ? W * 0.5 : W * 0.74, y0 = P ? H - 58 : H * 0.4;
    if (P) return s + pill(lx - 86, y0, 'gymnos: naked', { size: 15 }) + pill(lx + 86, y0, 'spermos: seed', { size: 15 }) + pill(lx, y0 + 38, 'No fruit around the seeds', { on: true, size: 15 });
    return s + pill(lx, y0, 'gymnos: naked', { size: 17 }) + pill(lx, y0 + 46, 'spermos: seed', { size: 17 }) + pill(lx, y0 + 96, 'No fruit around the seeds', { on: true, size: 15 });
  }
  draw(st, step) { return step === 0 ? this._hill(st) : this._scale(st); }
}
