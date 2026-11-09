// NameBits.js - local drawings and text for L09. Not a scene. Tokens only.
//   peaPlant(x, y, s)     a pea vine with a flower and an open pod, 150 by 190, origin at the foot
//   mangoSprig(x, y, s)   a mango hanging from a leafy twig, 150 by 170, origin at the top of the twig
//   houseCat(x, y, s)     a small cat, 110 long, origin at the feet, nose right
//   it(x, y, s, o)        italic text with words() options, for printed scientific names
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';
import { blob, mx } from '../L08/VertArt.js';

const wrap = (x, y, s, body) => `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
const INK = lc('ink');
const leaf = (x, y, r, l, col, rim) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0Q${l * 0.5} ${-l * 0.42} ${l} 0Q${l * 0.5} ${l * 0.42} 0 0Z" ${fill(col, `stroke:${rim};stroke-width:2.5;stroke-linejoin:round`)}/><path d="M4 0H${l - 8}" ${stroke(rim, 1.8)}/></g>`;

export function peaPlant(x, y, s = 1) {
  const c = lc('leaf'), d = lc('leafDark'), lit = lc('leafLit'), pod = mx(lc('leaf'), lc('yellow'), 0.3);
  let g = `<path d="M0 0C-16 -40 18 -80 0 -118C-10 -140 6 -160 16 -176" ${stroke(d, 8, 'stroke-linecap:round')}/><path d="M0 0C-16 -40 18 -80 0 -118C-10 -140 6 -160 16 -176" ${stroke(c, 4.5, 'stroke-linecap:round')}/>`;
  g += leaf(-3, -28, 195, 56, c, d) + leaf(2, -60, -16, 62, c, d) + leaf(4, -86, 196, 58, lit, d) + leaf(0, -122, -24, 52, c, d) + leaf(2, -146, 200, 44, lit, d);
  g += `<path d="M16 -176q18 -4 18 8q0 8 -8 6q-6 -4 0 -8" ${stroke(d, 3, 'stroke-linecap:round')}/>`;
  g += `<g transform="translate(-54 -124)"><path d="M28 0Q8 -4 0 -22Q-14 -26 -22 -14Q-30 2 -10 12Q14 18 28 0Z" ${fill(lc('white'), `stroke:${lc('whiteDeep')};stroke-width:3`)}/><path d="M-6 -12Q-16 0 -4 8Q14 8 20 0Z" ${fill(mx(lc('white'), lc('red'), 0.16))}/></g>`;
  g += `<g transform="translate(58 -46) rotate(14)"><path d="M-50 0Q0 -30 54 -4Q6 26 -50 0Z" ${fill(pod, `stroke:${d};stroke-width:3`)}/><path d="M-42 0Q0 -12 46 -3Q2 10 -42 0Z" ${fill(mx(pod, lc('white'), 0.5))}/>`;
  for (const [a, r] of [[-26, 7], [-9, 8.6], [9, 8.6], [26, 7]]) g += `<circle cx="${a}" cy="-1" r="${r}" ${fill(lit, `stroke:${d};stroke-width:2`)}/>`;
  g += '</g>';
  return wrap(x, y, s, g);
}
export function mangoSprig(x, y, s = 1) {
  const c = lc('leaf'), d = lc('leafDark'), fr = mx(lc('yellow'), lc('red'), 0.3), fd = mx(lc('red'), lc('wood'), 0.4), lit = mx(lc('yellow'), lc('white'), 0.3);
  let g = `<path d="M0 0Q-6 34 8 62" ${stroke(lc('woodDark'), 7, 'stroke-linecap:round')}/>`;
  g += leaf(-2, 22, 160, 92, c, d) + leaf(0, 26, 24, 96, lc('leafLit'), d) + leaf(-4, 8, 196, 84, d, lc('ink')) + leaf(0, 12, -12, 88, c, d);
  g += `<path d="M8 60C-26 66 -40 108 -22 138C-6 164 34 164 46 128C54 100 40 66 8 60Z" ${fill(fr, `stroke:${fd};stroke-width:3.5`)}/>`;
  g += `<path d="M-14 86Q-26 108 -14 130" ${stroke(lit, 8, 'stroke-linecap:round')}/>`;
  return wrap(x, y, s, g);
}
export function houseCat(x, y, s = 1) {
  const c = mx(lc('inkSoft'), lc('white'), 0.3), d = mx(lc('inkSoft'), lc('ink'), 0.34);
  let g = `<path d="M-40 -28Q-68 -34 -62 -62" ${stroke(d, 10, 'stroke-linecap:round')}/><path d="M-40 -28Q-68 -34 -62 -62" ${stroke(c, 6, 'stroke-linecap:round')}/>`;
  g += `<path d="${blob([[-46, -20], [-38, -46], [10, -48], [32, -40], [36, -16], [-8, -14]])}" ${fill(c, `stroke:${d};stroke-width:2.5`)}/>`;
  g += `<path d="M-32 -24V0M-18 -20V0M14 -20V0M26 -22V0" ${stroke(d, 8, 'stroke-linecap:round')}/><path d="M-32 -24V-2M-18 -20V-2M14 -20V-2M26 -22V-2" ${stroke(c, 4.5, 'stroke-linecap:round')}/>`;
  g += `<path d="M-24 -45l4 16M-8 -47l4 16M8 -47l2 14" ${stroke(d, 3.4, 'stroke-linecap:round')}/>`;
  g += `<path d="${blob([[22, -40], [30, -62], [54, -62], [60, -42], [44, -30], [28, -30]])}" ${fill(c, `stroke:${d};stroke-width:2.5`)}/><path d="M28 -56l2 -18l12 12ZM46 -60l10 -12l2 18Z" ${fill(c, `stroke:${d};stroke-width:2.5;stroke-linejoin:round`)}/>`;
  g += `<circle cx="48" cy="-48" r="2.6" ${fill(INK)}/><circle cx="59" cy="-42" r="1.8" ${fill(INK)}/>`;
  return wrap(x, y, s, g);
}
export function it(x, y, s, o = {}) {
  const st = [`font-family:${o.display === false ? 'var(--sim-font)' : 'var(--sim-font-display)'}`, `font-size:${o.size ?? 16}px`, 'font-style:italic', `font-weight:${o.weight ?? 600}`, `fill:${o.ink ?? INK}`];
  if (o.halo) st.push('paint-order:stroke', `stroke:${o.halo}`, `stroke-width:${o.haloW ?? 4}px`, 'stroke-linejoin:round');
  return `<text x="${x}" y="${y}" text-anchor="${o.anchor ?? 'middle'}" style="${st.join(';')}">${s}</text>`;
}
