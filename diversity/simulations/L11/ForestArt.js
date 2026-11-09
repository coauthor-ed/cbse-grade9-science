// ForestArt.js - local drawings for L11: an old tree with a cavity, a stump, a hornbill, a bee, a tick, crop plants and two
// farm insects. Not a scene. SVG strings, tokens only. Each function returns closed markup. Origin at the foot.
//   oldTree(x, y, s, o)      about 300 wide, 400 tall. o.cavity, o.fruit, o.flowers
//   stump(x, y, s)           a cut stump with rings
//   hornbill(x, y, s, o)     Great Hornbill, about 260 long, on a branch. o.flip, o.fruit
//   bee(x, y, s)             no face; about 60 long      tick(x, y, s)   an eight-legged tick, about 90 wide
//   crop(x, y, s, kind, w)   kind 'A' broad leaves, 'B' narrow leaves. w 0 to 1: how far it has wilted
//   ladybird, caterpillar, aphid: on a leaf
//   seedling(x, y, s), fruitAt(x, y, r), leafFall(x, y, r)
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc } from '../shared/LifeArt.js';

export const mx = (a, b, t) => `color-mix(in oklab, ${a} ${Math.round((1 - t) * 100)}%, ${b})`;
export const n1 = (v) => Math.round(v * 10) / 10;
export const INK = lc('ink');
const wrap = (x, y, s, o, body) => `<g transform="translate(${n1(x)} ${n1(y)}) scale(${o?.flip ? -s : s} ${s})${o?.rot ? ` rotate(${o.rot})` : ''}">${body}</g>`;
const P = (d, f, r, w = 3, more = '') => `<path d="${d}" ${fill(f, r ? `stroke:${r};stroke-width:${w};stroke-linejoin:round;${more}` : more)}/>`;
const L = (d, c, w = 3, more = '') => `<path d="${d}" ${stroke(c, w, `stroke-linecap:round;stroke-linejoin:round;${more}`)}/>`;
const lobes = (pts) => pts.map(([x, y, r]) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`).join('');

export const CANOPY = [[-96, -300, 66], [-30, -352, 76], [50, -340, 72], [110, -282, 60], [-130, -236, 50], [0, -270, 80], [84, -226, 54], [-60, -226, 56]];
export function oldTree(x, y, s = 1, o = {}) {
  const bark = lc('bark'), dark = lc('barkDark'), lit = lc('barkLit');
  let g = P('M-42 0C-30 -60 -30 -130 -28 -200L-80 -262L-68 -272L-16 -226L-10 -280L8 -280L12 -226L70 -258L78 -246L28 -196C30 -130 32 -60 46 0C60 8 72 8 84 12H-82C-68 8 -54 8 -42 0Z', bark, dark, 4);
  g += L('M-18 -24C-12 -80 -14 -130 -12 -188', lit, 7, 'opacity:0.7') + L('M16 -30C14 -70 16 -110 14 -150', dark, 4, 'opacity:0.6');
  if (o.cavity) g += `<ellipse cx="4" cy="-132" rx="19" ry="27" ${fill(mx(dark, INK, 0.6), `stroke:${lit};stroke-width:5`)}/>`;
  const d = lobes(CANOPY);
  g += `<path d="${d}" ${fill(lc('leafDark'), `stroke:${lc('leafDark')};stroke-width:8`)}/><path d="${d}" ${fill(lc('leaf'))}/>`;
  g += `<path d="${lobes([[-58, -340, 34], [34, -360, 30], [-104, -290, 26], [100, -296, 24]])}" ${fill(lc('leafLit'), 'opacity:0.8')}/>`;
  if (o.fruit) for (const [cx, cy] of [[-86, -252], [-34, -240], [26, -258], [74, -238], [-124, -228]]) g += fruitAt(cx, cy, 11);
  if (o.flowers) for (const [cx, cy] of [[112, -252], [132, -282], [60, -372], [-14, -388]]) g += flower(cx, cy, 13);
  return wrap(x, y, s, o, g);
}
export const fruitAt = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" ${fill(lc('red'), `stroke:${mx(lc('red'), INK, 0.5)};stroke-width:2.5`)}/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.28}" ${fill(lc('white'), 'opacity:0.8')}/>`;
export function flower(x, y, r) {
  let g = '';
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - 1.57; g += `<circle cx="${n1(x + Math.cos(a) * r * 0.7)}" cy="${n1(y + Math.sin(a) * r * 0.7)}" r="${n1(r * 0.56)}" ${fill(mx(lc('white'), lc('red'), 0.16), `stroke:${mx(lc('red'), INK, 0.2)};stroke-width:1.6`)}/>`; }
  return g + `<circle cx="${x}" cy="${y}" r="${n1(r * 0.36)}" ${fill(lc('yellow'))}/>`;
}
export function stump(x, y, s = 1) {
  const bark = lc('bark'), dark = lc('barkDark'), top = mx(lc('sand'), lc('white'), 0.3);
  let g = P('M-58 0C-46 -14 -44 -44 -44 -66H44C44 -44 46 -14 60 0Z', bark, dark, 4);
  g += `<ellipse cx="0" cy="-66" rx="44" ry="14" ${fill(top, `stroke:${dark};stroke-width:3.5`)}/><ellipse cx="0" cy="-66" rx="27" ry="8" ${fill('none', `stroke:${lc('sandDark')};stroke-width:2.5`)}/><ellipse cx="0" cy="-66" rx="12" ry="3.6" ${fill('none', `stroke:${lc('sandDark')};stroke-width:2.5`)}/>`;
  return wrap(x, y, s, {}, g);
}
const BLK = mx(INK, lc('strata6'), 0.2), PALE = mx(lc('white'), lc('yellow'), 0.14), BILL = lc('yellow'), BILLD = mx(lc('yellow'), lc('red'), 0.5);
/** A Great Hornbill perched, facing right: black body, white wing bar, pale neck, long white tail with one black band, huge bill and casque. */
export function hornbill(x, y, s = 1, o = {}) {
  let g = '';
  // long tail
  g += P('M-46 -34L-142 66L-114 84L-22 -8Z', PALE, BLK, 3);
  g += P('M-96 18L-124 47L-96 66L-70 34Z', BLK);
  // body
  g += P('M-58 -30C-62 -76 -18 -112 26 -104C50 -98 56 -70 44 -44C30 -16 -28 2 -50 -8C-58 -14 -58 -22 -58 -30Z', BLK, BLK, 3);
  // wing with a white bar
  g += P('M-54 -34C-44 -72 -6 -88 20 -76C14 -44 -24 -14 -68 8C-66 -10 -60 -22 -54 -34Z', mx(BLK, lc('white'), 0.12), BLK, 3);
  g += L('M-48 -14C-28 -30 -10 -48 4 -72', PALE, 9);
  // neck, pale
  g += P('M10 -100C22 -120 38 -140 52 -146C70 -142 72 -120 58 -102C52 -80 48 -64 38 -56C30 -74 18 -88 10 -100Z', PALE, mx(PALE, INK, 0.4), 2.5);
  // head
  g += P('M34 -142C42 -158 66 -162 78 -150C84 -140 80 -128 70 -126C56 -122 40 -128 34 -142Z', BLK, BLK, 2);
  // casque on top of the bill
  g += P('M64 -160C84 -176 124 -168 138 -144C118 -152 92 -150 72 -142C66 -146 62 -152 64 -160Z', BILL, BILLD, 3);
  g += L('M72 -163C92 -172 116 -164 130 -150', BILLD, 3);
  // huge down-curved bill
  g += P('M72 -146C104 -152 146 -130 160 -82C136 -108 104 -120 70 -124C74 -132 74 -140 72 -146Z', BILL, BILLD, 3);
  g += L('M74 -132C104 -130 134 -116 156 -88', BILLD, 2.4);
  // red eye
  g += `<circle cx="64" cy="-141" r="6.4" ${fill(lc('red'), `stroke:${INK};stroke-width:2`)}/><circle cx="65" cy="-141" r="2.8" ${fill(INK)}/>`;
  if (o.fruit) g += fruitAt(158, -74, 12);
  // feet on the branch
  g += L('M-8 -6l-2 16M4 -8l2 18', mx(lc('sand'), INK, 0.3), 5);
  return wrap(x, y, s, o, g);
}
export function bee(x, y, s = 1, o = {}) {
  const b = lc('yellow'), d = INK;
  let g = `<ellipse cx="-8" cy="-22" rx="22" ry="11" transform="rotate(-24 -8 -22)" ${fill(mx(lc('water'), lc('white'), 0.5), `stroke:${d};stroke-width:2`)}/><ellipse cx="12" cy="-22" rx="17" ry="9" transform="rotate(-50 12 -22)" ${fill(mx(lc('water'), lc('white'), 0.5), `stroke:${d};stroke-width:2`)}/>`;
  g += `<ellipse cx="-4" cy="0" rx="28" ry="17" ${fill(b, `stroke:${d};stroke-width:3`)}/>`;
  g += L('M-16 -15V15M-3 -17V17M10 -15V15', d, 6);
  g += `<circle cx="28" cy="0" r="12" ${fill(d)}/>` + L('M34 -9L44 -20M28 -11L34 -24', d, 2.6);
  for (let i = 0; i < 3; i++) g += L(`M${-8 + i * 12} 16l-2 10`, d, 2.4);
  return wrap(x, y, s, o, g);
}
/** A tick, swollen oval body with eight legs. No face. */
export function tick(x, y, s = 1) {
  const c = mx(lc('red'), lc('barkDark'), 0.5), d = mx(c, INK, 0.5);
  let g = '';
  for (const k of [-1, 1]) for (const [a, b, e, f] of [[20, -18, 50, -44], [26, -4, 62, -14], [26, 10, 60, 28], [18, 22, 44, 54]]) g += L(`M${k * a * 0.8} ${b}L${k * e} ${f - 10}L${k * (e + 8)} ${f + 8}`, d, 4.5);
  g += `<ellipse cx="0" cy="8" rx="30" ry="40" ${fill(c, `stroke:${d};stroke-width:4`)}/><ellipse cx="0" cy="-16" rx="20" ry="16" ${fill(mx(c, INK, 0.3))}/>`;
  g += `<path d="M-8 -30L0 -48L8 -30Z" ${fill(d)}/>` + L('M-14 14Q-10 30 -2 36', mx(c, lc('white'), 0.4), 5, 'opacity:0.8');
  return wrap(x, y, s, {}, g);
}
/** A cereal crop plant. kind 'A' broad pale leaves and no head yet; kind 'B' narrow dark leaves and a grain head. */
export function crop(x, y, s, kind, w = 0) {
  const base = kind === 'A' ? mx(lc('leaf'), lc('yellow'), 0.3) : lc('leafDark'), c = mx(base, lc('sand'), w * 0.8), d = mx(c, INK, 0.4);
  const bend = w * (kind === 'A' ? 34 : 22), tx = bend, ty = -120 + w * 30;
  let g = L(`M0 0Q2 -60 ${n1(tx)} ${n1(ty)}`, d, kind === 'A' ? 7 : 5);
  const W = kind === 'A' ? 13 : 6;
  for (let i = 0; i < 4; i++) {
    const t = 0.25 + i * 0.22, sx = tx * t * t, sy = ty * t, k = i % 2 ? 1 : -1, L0 = kind === 'A' ? 66 - i * 6 : 62 - i * 4, drop = w * 56;
    const ex = sx + k * L0 * (1 - w * 0.34), ey = sy - 26 + drop + i * 2;
    g += `<path d="M${n1(sx)} ${n1(sy)}Q${n1(sx + k * L0 * 0.5)} ${n1(sy - 34 - W + drop * 0.2)} ${n1(ex)} ${n1(ey)}Q${n1(sx + k * L0 * 0.5)} ${n1(sy - 18 + W + drop * 0.5)} ${n1(sx)} ${n1(sy)}Z" ${fill(c, `stroke:${d};stroke-width:2.5`)}/>`;
  }
  if (kind === 'B') for (let i = 0; i < 6; i++) g += `<ellipse cx="${n1(tx + (i % 2 ? 5 : -5))}" cy="${n1(ty - 6 - i * 7)}" rx="5" ry="7" ${fill(mx(lc('yellow'), lc('sand'), 0.3), `stroke:${d};stroke-width:1.6`)}/>`;
  return wrap(x, y, s, {}, g);
}
export function ladybird(x, y, s = 1, o = {}) {
  const r = lc('red'), d = INK;
  let g = '';
  for (const k of [-16, 0, 16]) g += L(`M${k} 16l-5 14M${k} -16l-5 -14`, d, 4);
  g += `<circle cx="34" cy="0" r="15" ${fill(d)}/>` + `<ellipse cx="0" cy="0" rx="36" ry="28" ${fill(r, `stroke:${d};stroke-width:3.5`)}/>` + L('M-34 0H34', d, 3.5);
  for (const [a, b, q] of [[-14, -13, 6.5], [10, -14, 6], [-14, 13, 6.5], [10, 14, 6]]) g += `<circle cx="${a}" cy="${b}" r="${q}" ${fill(d)}/>`;
  g += L('M-20 -18Q-4 -24 16 -20', lc('white'), 3.5, 'opacity:0.6');
  return wrap(x, y, s, o, g);
}
export function caterpillar(x, y, s = 1, o = {}) {
  const c = mx(lc('leafLit'), lc('yellow'), 0.3), d = mx(lc('leafDark'), INK, 0.3);
  let g = '';
  for (let i = 0; i < 7; i++) { const cx = -66 + i * 21, cy = -Math.sin(i * 0.9) * 6; g += L(`M${cx} ${n1(cy + 14)}v10`, d, 4) + `<circle cx="${cx}" cy="${n1(cy)}" r="15" ${fill(i % 2 ? c : mx(c, lc('leafDark'), 0.3), `stroke:${d};stroke-width:3`)}/>`; }
  g += `<circle cx="66" cy="-4" r="13" ${fill(mx(lc('red'), lc('sand'), 0.4), `stroke:${d};stroke-width:3`)}/>`;
  return wrap(x, y, s, o, g);
}
export const aphid = (x, y, s = 1) => wrap(x, y, s, {}, `<ellipse rx="11" ry="7.5" ${fill(mx(lc('leafLit'), lc('white'), 0.3), `stroke:${lc('leafDark')};stroke-width:2.4`)}/>` + L('M-6 6l-4 6M2 7v6M8 5l4 6', lc('leafDark'), 2));
/** A tulsi plant: a woody stem, paired oval leaves and purple-tinged flower spikes, about 150 tall. */
export function tulsi(x, y, s = 1) {
  const d = lc('leafDark'), c = lc('leaf'), sp = mx(lc('red'), lc('waterDeep'), 0.5);
  let g = L('M0 0C-2 -40 2 -80 0 -120M0 -56C-18 -76 -30 -88 -38 -108M0 -70C16 -88 28 -96 36 -116', mx(lc('bark'), sp, 0.3), 5);
  for (const [cx, cy, r] of [[-22, -30, 200], [22, -36, -20], [-30, -64, 215], [28, -74, -35], [-14, -96, 235], [16, -104, -55]]) g += `<ellipse cx="${cx}" cy="${cy}" rx="21" ry="12" transform="rotate(${r + 180} ${cx} ${cy})" ${fill(c, `stroke:${d};stroke-width:2.5`)}/>`;
  for (const [cx, cy] of [[0, -136], [-40, -122], [38, -130]]) for (let i = 0; i < 5; i++) g += `<ellipse cx="${cx}" cy="${cy + i * 7 - 12}" rx="${6 - i * 0.4 + i}" ry="3.2" ${fill(sp)}/>`;
  return wrap(x, y, s, {}, g);
}
export const seedling = (x, y, s = 1) => wrap(x, y, s, {}, L('M0 0Q-4 -26 2 -50', lc('leafDark'), 5) + P('M2 -48Q-34 -68 -44 -44Q-16 -30 2 -48Z', lc('leaf'), lc('leafDark'), 2.5) + P('M2 -50Q34 -76 46 -50Q18 -32 2 -50Z', lc('leafLit'), lc('leafDark'), 2.5));
export const leafFall = (x, y, r = 0, c) => `<path d="M${x - 16} ${y}Q${x} ${y - 13} ${x + 16} ${y}Q${x} ${y + 9} ${x - 16} ${y}Z" transform="rotate(${r} ${x} ${y})" ${fill(c ?? lc('autumn'), `stroke:${lc('autumnDark')};stroke-width:2`)}/>`;
