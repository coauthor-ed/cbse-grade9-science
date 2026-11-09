// PlantBits.js - plant drawings the shared art does not hold, for L04 and L05: a fern stem cross section (after the book's description, drawn afresh),
// swimming male cells, a film of water, a cut seed. Strings of SVG. Colours are tokens. Not a scene.
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgBioColour as lc } from '../shared/BioArt.js';
import { INK, move } from '../L03/BioStage.js';

/** A fern stem cut across. lit: 'xylem', 'phloem' or null. Round-celled ground tissue, phloem around a core of xylem. */
export function stemSection(cx, cy, r, lit = null) {
  const o = (t) => (lit && lit !== t ? 'opacity:0.35' : '');
  let s = `<circle cx="${cx}" cy="${cy}" r="${r}" ${fill(lc('leafLit'), `stroke:${lc('leafDeep')};stroke-width:7`)}/>`;
  for (let ring = 1; ring < 3; ring++) {
    const n = 10 + ring * 8, q = r * (0.5 + ring * 0.16);
    for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + ring; s += `<circle cx="${cx + q * Math.cos(a)}" cy="${cy + q * Math.sin(a)}" r="${r * 0.07}" ${fill(lc('leaf'), `stroke:${lc('leafDark')};stroke-width:1.5`)}/>`; }
  }
  const xr = r * 0.34, yr = r * 0.2;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.56}" ry="${r * 0.42}" ${fill(lc('capLit'), `stroke:${lc('capDark')};stroke-width:3;${o('phloem')}`)}/>`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${xr}" ry="${yr}" ${fill(lc('water'), `stroke:${lc('waterDeep')};stroke-width:3;${o('xylem')}`)}/>`;
  for (let i = -2; i <= 2; i++) s += `<circle cx="${cx + i * xr * 0.36}" cy="${cy}" r="${r * 0.055}" ${fill(lc('white'), `stroke:${lc('waterDeep')};stroke-width:1.5;${o('xylem')}`)}/>`;
  return s;
}

/** A male cell with a tail, heading right. */
const swimmer = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-8 0q-8 -6 -14 0t-12 0" ${stroke(INK, 2.5)}/><ellipse cx="0" cy="0" rx="9" ry="6" ${fill(lc('capLit'), `stroke:${INK};stroke-width:2`)}/></g>`;
export function swimmers(x0, x1, y, k = 1, go = true) {
  let s = '';
  [0, 0.34, 0.68].forEach((u, i) => { const x = x0 + (x1 - x0) * u, b = swimmer(x, y + (i % 2 ? 5 : -5), k); s += go ? move('drift', i * 0.3, b, `--dx:${(x1 - x0) * 0.28}px;--dy:0px`) : b; });
  return s;
}
/** The female cell in its small flask, opening to the left. */
export const femaleCell = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-30 -8q18 -2 26 -14q26 -14 44 8q8 24 -14 34q-24 6 -32 -14q-8 -6 -24 -6Z" ${fill(lc('leaf'), `stroke:${lc('leafDark')};stroke-width:3`)}/><circle cx="16" cy="4" r="12" ${fill(lc('bloomLit'), `stroke:${INK};stroke-width:2`)}/></g>`;
/** A thin film of water on a surface. */
export const film = (x, y, w) => `<path d="M${x} ${y}q${w * 0.25} -9 ${w * 0.5} 0t${w * 0.5} 0v9h${-w}Z" ${fill(lc('water'), 'opacity:0.82')}/>`;

/** A seed cut open: coat, stored food, embryo. parts true dims nothing, 'closed' draws only the coat. */
export function seedCut(cx, cy, k, o = {}) {
  const c = `<path d="M0 -62C44 -62 66 -20 60 24C54 62 20 76 0 76C-20 76 -54 62 -60 24C-66 -20 -44 -62 0 -62Z" ${fill(lc('cone'), `stroke:${INK};stroke-width:4`)}/>`;
  if (o.closed) return `<g transform="translate(${cx} ${cy}) scale(${k})">${c}<path d="M-30 -30q-10 30 0 60" ${stroke(lc('coneLit'), 7)}/></g>`;
  return `<g transform="translate(${cx} ${cy}) scale(${k})">${c}<path d="M0 -50C34 -50 52 -18 48 22C44 54 18 64 0 64C-18 64 -44 54 -48 22C-52 -18 -34 -50 0 -50Z" ${fill(lc('stem'))}/><path d="M6 44C-16 34 -14 2 0 -8C10 -18 22 -14 20 -2C18 8 6 6 10 20C14 30 16 40 6 44Z" ${fill(lc('leaf'), `stroke:${lc('leafDark')};stroke-width:3`)}/></g>`;
}

/** One woody cone scale, broad at the top and narrow at the foot, with two winged seeds lying open near the foot. */
export const coneScale = (cx, cy, k) => {
  const seed = (d) => `<g transform="rotate(${d * 24} 0 50)"><path d="M-9 44C-22 10 -18 -34 0 -46C18 -34 22 10 9 44Z" ${fill(lc('coneLit'), `stroke:${lc('coneDark')};stroke-width:2.5`)}/><path d="M-10 40C-12 54 -6 64 0 66C6 64 12 54 10 40C6 32 -6 32 -10 40Z" ${fill(lc('capDark'), `stroke:${INK};stroke-width:2.5`)}/></g>`;
  return `<g transform="translate(${cx} ${cy}) scale(${k})"><path d="M-84 -40C-66 -76 66 -76 84 -40C88 -8 44 62 20 80H-20C-44 62 -88 -8 -84 -40Z" ${fill(lc('cone'), `stroke:${INK};stroke-width:4`)}/><path d="M-70 -46C-30 -66 30 -66 70 -46" ${stroke(lc('coneDark'), 5)}/>${seed(-1)}${seed(1)}</g>`;
};
/** A mango. cut true shows the big stone seed inside the flesh. */
export const mango = (cx, cy, k, cut = false) => `<g transform="translate(${cx} ${cy}) scale(${k})"><path d="M-10 -68C40 -76 70 -34 66 14C62 58 22 78 -14 70C-54 60 -70 18 -60 -22C-54 -48 -36 -64 -10 -68Z" ${fill(cut ? `color-mix(in oklab, ${lc('gold')} 46%, ${lc('white')})` : lc('bloomLit'), `stroke:${lc('bloomLit')};stroke-width:7`)}/>`
  + (cut ? `<path d="M-2 -40C26 -42 38 -10 32 18C26 42 2 48 -14 40C-34 30 -34 -30 -2 -40Z" ${fill(lc('cone'), `stroke:${INK};stroke-width:3`)}/>` : '') + '</g>';
/** A gulmohar flower: five spoon-shaped petals on narrow claws, the top one pale and streaked, sepals behind, long curved stamens. */
export function flower(cx, cy, r) {
  const spoon = `M0 0C${-r * 0.04} ${-r * 0.2} ${-r * 0.07} ${-r * 0.3} ${-r * 0.13} ${-r * 0.4}C${-r * 0.44} ${-r * 0.5} ${-r * 0.5} ${-r * 0.96} ${-r * 0.16} ${-r * 1.02}Q${-r * 0.08} ${-r * 0.97} 0 ${-r * 1.03}Q${r * 0.08} ${-r * 0.97} ${r * 0.16} ${-r * 1.02}C${r * 0.5} ${-r * 0.96} ${r * 0.44} ${-r * 0.5} ${r * 0.13} ${-r * 0.4}C${r * 0.07} ${-r * 0.3} ${r * 0.04} ${-r * 0.2} 0 0Z`;
  let s = '';
  [36, 108, 180, 252, 324].forEach((a) => { s += `<path transform="translate(${cx} ${cy}) rotate(${a})" d="M0 0Q${-r * 0.1} ${-r * 0.24} 0 ${-r * 0.42}Q${r * 0.1} ${-r * 0.24} 0 0Z" ${fill(lc('leaf'), `stroke:${lc('leafDark')};stroke-width:2`)}/>`; });
  [0, 72, 144, 216, 288].forEach((a, i) => {
    const pale = i === 0;
    s += `<g transform="translate(${cx} ${cy}) rotate(${a})"><path d="${spoon}" ${fill(pale ? lc('whiteShade') : lc('bloom'), `stroke:${lc('bloomDark')};stroke-width:2.5`)}/>`;
    s += pale
      ? `<path d="M0 ${-r * 0.42}V${-r * 0.92}M${-r * 0.1} ${-r * 0.46}Q${-r * 0.2} ${-r * 0.66} ${-r * 0.2} ${-r * 0.86}M${r * 0.1} ${-r * 0.46}Q${r * 0.2} ${-r * 0.66} ${r * 0.2} ${-r * 0.86}" ${stroke(lc('bloom'), 3)}/>`
      : `<path d="M0 ${-r * 0.36}V${-r * 0.86}M${-r * 0.08} ${-r * 0.46}Q${-r * 0.16} ${-r * 0.66} ${-r * 0.16} ${-r * 0.84}M${r * 0.08} ${-r * 0.46}Q${r * 0.16} ${-r * 0.66} ${r * 0.16} ${-r * 0.84}" ${stroke(lc('bloomDark'), 1.6)}/>`;
    s += '</g>';
  });
  [-46, -30, -15, 0, 15, 30, 46].forEach((a, i) => {
    const t = a * 0.0174, len = r * (i % 2 ? 0.92 : 1.06), x = cx + Math.sin(t) * len, y = cy + Math.cos(t) * len, qx = cx + Math.sin(t * 0.3) * len * 0.6, qy = cy + Math.cos(t * 0.3) * len * 0.6;
    s += `<path d="M${cx} ${cy}Q${qx} ${qy} ${x} ${y}" ${stroke(lc('bloomDark'), 2.5)}/><ellipse cx="${x}" cy="${y}" rx="${r * 0.07}" ry="${r * 0.045}" ${fill(lc('gold'), `stroke:${lc('bloomDark')};stroke-width:1.5`)}/>`;
  });
  return s + `<circle cx="${cx}" cy="${cy}" r="${r * 0.07}" ${fill(lc('bloomDark'))}/>`;
}
/** A long flat pod, split to show its seeds. */
export const pod = (cx, cy, k, rot = -8) => `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${k})"><path d="M-120 0C-90 -26 90 -30 124 -8C100 26 -90 26 -120 0Z" ${fill(lc('coneDark'), `stroke:${INK};stroke-width:4`)}/><path d="M-100 -2C-60 -14 70 -16 104 -6C70 8 -60 10 -100 -2Z" ${fill(lc('stem'))}/>${[-66, -30, 6, 42, 76].map((x) => `<ellipse cx="${x}" cy="-3" rx="12" ry="7" ${fill(lc('cone'), `stroke:${INK};stroke-width:2`)}/>`).join('')}</g>`;
/** Seed cut for one or two cotyledons. n: 1 (monocot) or 2 (dicot). */
export function cotyledons(cx, cy, k, n) {
  const c1 = `color-mix(in oklab, ${lc('gold')} 42%, ${lc('white')})`;
  const body = n === 2
    ? `<path d="M0 -58C-46 -58 -58 -14 -52 18C-46 50 -20 62 -3 62V-58Z" ${fill(c1, `stroke:${lc('capDark')};stroke-width:3`)}/><path d="M0 -58C46 -58 58 -14 52 18C46 50 20 62 3 62V-58Z" ${fill(c1, `stroke:${lc('capDark')};stroke-width:3`)}/>`
    : `<path d="M-44 -46C-10 -66 40 -50 46 -6C50 36 20 64 -8 62C-34 58 -52 8 -44 -46Z" ${fill(c1, `stroke:${lc('capDark')};stroke-width:3`)}/>`;
  const em = n === 2 ? `<path d="M-2 44C-8 22 -8 2 0 -14C8 2 8 22 2 44Z" ${fill(lc('leaf'), `stroke:${lc('leafDark')};stroke-width:2.5`)}/>` : `<path d="M-38 30C-30 6 -28 -10 -16 -26C-6 -16 -8 16 -22 42Z" ${fill(lc('leaf'), `stroke:${lc('leafDark')};stroke-width:2.5`)}/>`;
  return `<g transform="translate(${cx} ${cy}) scale(${k})"><path d="M0 -68C60 -68 72 -20 66 20C60 62 24 74 0 74C-24 74 -60 62 -66 20C-72 -20 -60 -68 0 -68Z" ${fill(lc('cone'), `stroke:${INK};stroke-width:4`)}/>${body}${em}</g>`;
}
