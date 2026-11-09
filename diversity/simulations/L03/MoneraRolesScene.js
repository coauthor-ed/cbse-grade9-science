// MoneraRolesScene - blk-l03-s04. Beat 0: a lens on four bacteria shapes among the places they live. Beat 1: four tiles: harmful
// and useful. Beat 2: a chain of cyanobacteria in sunlight. Beat 3: dung to biogas, bacteria inside the dome, with the book's date and place.
import { BioStage, beats, pill, panel, waterBack, flow, move, INK } from './BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBio, svgBioColour as lc, BOX } from '../shared/BioArt.js';
import { svgSun } from '../shared/SeaArt.js';
import { words } from '../shared/SeaBits.js';

const rod = (x, y, r, col = lc('flat')) => `<rect x="${x - 13}" y="${y - 5}" width="26" height="10" rx="5" transform="rotate(${r} ${x} ${y})" ${fill(col, `stroke:${INK};stroke-width:1.5`)}/>`;
const FORMS = (cx, cy, k) => {
  let s = '';
  // round cluster, comma, rods, spiral: drawn as four quarters of the lens
  const q = 58 * k, ball = (x, y) => `<circle cx="${x}" cy="${y}" r="${11 * k}" ${fill(lc('octo'), `stroke:${INK};stroke-width:1.5`)}/>`;
  [[-8, -6], [8, -6], [0, 8], [-16, 8], [16, 8], [0, -18]].forEach(([a, b]) => { s += ball(cx - q + a * k, cy - q + b * k); });
  s += `<path d="M${cx + q - 22 * k} ${cy - q - 12 * k}q${30 * k} ${-6 * k} ${36 * k} ${16 * k}q${2 * k} ${14 * k} ${-14 * k} ${18 * k}q${10 * k} ${-16 * k} ${-22 * k} ${-34 * k}Z" ${fill(lc('flat'), `stroke:${INK};stroke-width:2`)}/>`;
  [[-14, -8, 30], [10, 2, -30], [-10, 14, 60]].forEach(([a, b, r]) => { s += `<rect x="${cx - q + (a - 17) * k}" y="${cy + q + (b - 7) * k}" width="${34 * k}" height="${14 * k}" rx="${7 * k}" transform="rotate(${r} ${cx - q + a * k} ${cy + q + b * k})" ${fill(lc('octoLit'), `stroke:${INK};stroke-width:1.5`)}/>`; });
  [-12, 8].forEach((a) => { s += `<path d="M${cx + q + a * k} ${cy + q - 24 * k}q${14 * k} ${8 * k} 0 ${16 * k}q${-14 * k} ${8 * k} 0 ${16 * k}q${14 * k} ${8 * k} 0 ${16 * k}" ${stroke(lc('flat'), 6 * k)}/>`; });
  return s;
};
const cow = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})">`
  + `<path d="M-46 -74h70q16 0 18 16l4 30h-96l-6 -30q-2 -16 10 -16Z" ${fill(lc('whiteShade'), `stroke:${INK};stroke-width:3`)}/>`
  + `<path d="M-24 -74q16 8 8 24q-14 8 -24 -6Z M12 -46q14 -8 24 6l-6 12h-22Z" ${fill(lc('barkDark'))}/>`
  + `<path d="M-42 -30v30h12v-30ZM-16 -30v30h12v-30ZM6 -30v30h12v-30ZM28 -30v30h12v-30Z" ${fill(lc('whiteShade'), `stroke:${INK};stroke-width:3`)}/>`
  + `<path d="M36 -68l14 -14q8 -6 18 -2l10 12q6 14 -2 22l-10 4q-14 4 -24 -6Z" ${fill(lc('whiteShade'), `stroke:${INK};stroke-width:3`)}/>`
  + `<path d="M52 -84l-8 -14M68 -84l8 -14" ${stroke(lc('ink'), 4)}/><circle cx="64" cy="-68" r="3" ${fill(INK)}/>`
  + `<path d="M-52 -66q-12 12 -8 34" ${stroke(INK, 3.5)}/></g>`;

export class MoneraRolesScene extends BioStage {
  static BEAT_STEP_MAP = beats(4);
  static ARIA_LABEL = 'Bacteria in four shapes, in soil, water, air and hot springs. Some cause disease and many are useful. Cyanobacteria make food in sunlight. Bacteria in a biogas plant turn dung into gas.';
  heights = [[330, 380], [340, 390], [270, 340], [300, 370]];

  _world(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.74, r = Math.min(H * 0.37, P ? 112 : 136);
    let s = `<rect width="${W}" height="${gy}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('soil'))}/>`;
    s += `<path d="M0 ${gy}q${W * 0.14} -22 ${W * 0.3} 0v30h${-W * 0.3}Z" ${fill(lc('water'))}/>`;
    s += `<ellipse cx="${W * 0.84}" cy="${gy + 8}" rx="${W * 0.14}" ry="16" ${fill(lc('water'), `stroke:${lc('strata3')};stroke-width:6`)}/>`;
    [0.8, 0.84, 0.88].forEach((u, i) => { s += move('rise', i * 0.4, `<path d="M${W * u} ${gy - 8}q10 -16 0 -30q-10 -14 0 -30" ${stroke(lc('white'), 5)}/>`); });
    const q = P ? 44 : 54, lb = (x, y, t) => words(x, y, t, { size: 14, ink: INK });
    s += `<circle cx="${W / 2}" cy="${H / 2}" r="${r}" ${fill(lc('white'), `stroke:${INK};stroke-width:6`)}/>` + FORMS(W / 2, H / 2 - 8, P ? 0.72 : 0.9);
    s += lb(W / 2 - q * 1.05, H / 2 - 6, 'Round') + lb(W / 2 + q * 1.05, H / 2 - 6, 'Comma') + lb(W / 2 - q * 1.05, H / 2 + q + 40, 'Rod') + lb(W / 2 + q * 1.05, H / 2 + q + 40, 'Spiral');
    const big = W * 0.5;
    s += pill(10, 26, 'Air', { anchor: 'start' }) + pill(10, gy + 4, 'Water', { anchor: 'start' }) + pill(10, H - 20, 'Soil', { anchor: 'start' });
    s += pill(W - 10, gy + 34, 'Hot spring', { anchor: 'end' }) + pill(W - 10, 26, 'Inside you', { anchor: 'end' });
    return s;
  }

  _tiles(st) {
    const W = st.W, H = st.H, P = st.portrait, g = 8, pw = (W - 3 * g) / 2, ph = (H - 3 * g) / 2, x = [g, 2 * g + pw], y = [g, 2 * g + ph];
    const cap = (i, j, t) => words(x[i] + pw / 2, y[j] + ph - 11, t, { size: P ? 15 : 18, display: true, ink: INK });
    const c = (i) => x[i] + pw / 2, m = (j) => y[j] + (ph - 26) / 2;
    let s = `<rect width="${W}" height="${H}" ${fill(lc('waterPale'))}/>`;
    for (const i of [0, 1]) for (const j of [0, 1]) s += panel(x[i], y[j], pw, ph);
    // curd
    s += `<path d="M${c(0) - 60} ${m(0) - 16}h120q-6 56 -60 56t-60 -56Z" ${fill(lc('capDark'))}/><ellipse cx="${c(0)}" cy="${m(0) - 16}" rx="60" ry="14" ${fill(lc('whiteShade'), `stroke:${INK};stroke-width:2.5`)}/>` + rod(c(0) - 22, m(0) - 16, 20) + rod(c(0) + 18, m(0) - 14, -30);
    s += cap(0, 0, 'Lactobacillus: curd');
    // root nodules
    s += `<path d="M${c(1)} ${m(0) - 42}C${c(1) - 8} ${m(0) - 10} ${c(1) + 12} ${m(0) + 6} ${c(1) + 4} ${m(0) + 42}M${c(1) + 1} ${m(0) - 8}q-30 8 -44 34M${c(1) + 3} ${m(0) + 2}q26 8 40 28" ${stroke(lc('stem'), 7)}/>`;
    [[-22, 8], [-36, 18], [24, 16], [34, 24], [4, 26]].forEach(([a, b]) => { s += `<circle cx="${c(1) + a}" cy="${m(0) + b}" r="8" ${fill(lc('bloomLit'), `stroke:${INK};stroke-width:2`)}/>`; });
    s += cap(1, 0, 'Rhizobium: roots');
    // pollutant
    s += `<ellipse cx="${c(0)}" cy="${m(1) + 8}" rx="${pw * 0.36}" ry="24" ${fill(lc('water'))}/><path d="M${c(0) - 40} ${m(1) + 6}q20 -18 40 -6q26 -10 34 8q-30 16 -40 6q-20 10 -34 -8Z" ${fill(lc('barkDark'))}/>` + rod(c(0) - 18, m(1) - 2, 10, lc('leaf')) + rod(c(0) + 22, m(1) + 6, -20, lc('leaf'));
    s += cap(0, 1, 'Break down oil');
    // pathogen
    [[-26, -10, 20], [10, -18, -30], [26, 12, 60], [-14, 14, -10]].forEach(([a, b, r]) => { s += rod(c(1) + a, m(1) + b, r, lc('bloom')); });
    s += cap(1, 1, 'Pathogens: disease');
    return s;
  }

  _cyano(st) {
    const W = st.W, H = st.H, P = st.portrait, b = BOX.Cyanobacterium, k = (W * 0.86) / b[2];
    let s = waterBack(W, H) + svgSun(W * 0.2, 44, 0.32);
    [0.34, 0.5, 0.66, 0.82].forEach((u, i) => { s += `<path class="bs-flow" d="M${W * 0.2 + 26} ${60}L${W * u} ${H * 0.5 - 16}" ${stroke(lc('gold'), 4)}/>`; });
    s += svgBio('Cyanobacterium', W * 0.5, H * 0.56, k);
    return s + pill(W - 12, 28, 'Makes its own food', { anchor: 'end', on: true }) + pill(W * 0.5, H - 26, 'Each bead is one cell, no nucleus', { size: P ? 14 : 15 });
  }

  _biogas(st) {
    const W = st.W, H = st.H, P = st.portrait, gy = H * 0.5, dx = W * 0.56, dy = H * 0.76, r = P ? 86 : 110, k = P ? 0.72 : 1;
    let s = `<rect width="${W}" height="${gy}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H - gy}" ${fill(lc('soil'))}/>`;
    s += cow(W * 0.16, gy + 2, k);
    s += `<path d="M${W * 0.04} ${gy + 2}q${28} -24 56 0Z" ${fill(lc('barkDark'))}/>`;
    s += flow(`M${W * 0.2} ${gy + 10}C${W * 0.3} ${gy + 50} ${dx - r} ${dy - 20} ${dx - r + 8} ${dy - 10}`, lc('barkDark'), 8);
    s += `<path d="M${dx - r} ${dy + 26}C${dx - r} ${dy - r} ${dx + r} ${dy - r} ${dx + r} ${dy + 26}Z" ${fill(lc('whiteShade'), `stroke:${INK};stroke-width:4`)}/>`;
    [[-40, 8, 20], [-6, -14, -30], [30, 6, 60], [8, 16, 0]].forEach(([a, b, t]) => { s += rod(dx + a, dy + b, t, lc('leaf')); });
    [-22, 16, 40].forEach((a, i) => { s += move('rise', i * 0.5, `<circle cx="${dx + a}" cy="${dy - 34}" r="6" ${fill(lc('water'), `stroke:${INK};stroke-width:1.5`)}/>`); });
    const fx = W * 0.9, fy = gy - 26;
    s += flow(`M${dx} ${dy - r * 0.76}V${gy - 8}H${fx}V${fy}`, lc('water'), 6);
    s += `<path d="M${fx - 20} ${fy}h40" ${stroke(INK, 5)}/>` + move('pop', 0, `<path d="M${fx} ${fy - 44}q22 24 13 37q-4 7 -13 7t-13 -7q-9 -13 13 -37Z" ${fill(lc('bloom'), `stroke:${INK};stroke-width:2.5`)}/><path d="M${fx} ${fy - 24}q9 10 5 15q-5 4 -10 0q-4 -5 5 -15Z" ${fill(lc('gold'))}/>`);
    s += pill(W * 0.5, 24, P ? 'Ramnagar, Sitapur, 1957' : 'Biogas plant at Ramnagar, Sitapur, 1957', { on: true, size: P ? 14 : 15 });
    s += pill(W * 0.86, gy + 34, 'Biogas', {}) + pill(dx, H - 18, 'Bacteria at work', {}) + pill(14, H - 18, 'Dung', { anchor: 'start' });
    return s;
  }

  draw(st, step) { return [this._world, this._tiles, this._cyano, this._biogas][step].call(this, st); }
}
