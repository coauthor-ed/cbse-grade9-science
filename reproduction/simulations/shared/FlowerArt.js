// FlowerArt.js - flowers, pollinators and fruit for L04 to L06 of the reproduction module. Not a scene. SVG strings only,
// no faces, no colour literals, no words. Every function returns one closed <g> at (x, y) scaled by s.
//   flowerSection(x, y, s, o)   origin base of the flower. Longitudinal section as in a textbook. About 300 wide, 230 tall.
//                               o.part(name) -> css extra for that part; names sepal petal stamen pistil ovary ovule
//   flowerBud(x, y, s, o)       origin foot of the bud; green sepals wrap it, o.open 0..1 shows colour at the tip
//   peaFlower(x, y, s, o)       origin where the flower meets its stalk. o.stage 'bud' | 'open'; o.stamens (bool); o.bag (bool); o.pod (bool); o.tint
//   peaPlant(x, y, s, o)        origin foot; climbing pea stem with leaves and tendrils, 240 tall
//   simpleFlower(x, y, s, o)    origin centre of a face-on flower; o.tint, o.r
//   mustardPlant(x, y, s, o)    origin foot; a stem carrying o.n yellow flowers, returns markup only; heads via mustardHeads
//   maizePlant(x, y, s, o)      origin foot; strap leaves, top tassel, side cob with silks; 300 tall
//   wheatEar(x, y, s, o)        origin foot; stalk and bearded ear
//   sunflower(x, y, s, o)       origin foot; 220 tall. Big head
//   hibiscus(x, y, s, o)        origin centre, red with long stamen column, o.rot
//   coralSpray(x, y, s, o)      origin foot; a bare branch with red claw flowers
//   tomatoFlower(x, y, s, o)    origin ovary; yellow reflexed petals, stamen cone covering the stigma
//   tomatoFruit(x, y, s, o)     origin centre; o.cut true: cut section with seeds in the walls; o.r radius
//   papayaTree(x, y, s, o)      origin foot; bare stem, big lobed leaves on long stalks at the top only, o.fruit, o.flowers, o.extra
//   appleTree(x, y, s, o)       origin foot; o.fruit number, o.seed
//   beeHive(x, y, s)            origin foot; a wooden box hive on legs
//   bee(x, y, s, o)             origin centre, side view, faces right; o.flip
//   butterfly(x, y, s, o)       origin centre, top view
//   sunbird(x, y, s, o)         origin centre, side view with a long curved bill, faces right; o.flip
//   whiteEye(x, y, s, o)        origin centre, small bird with white ring, faces right; o.flip
//   tuft(x, y, s, o)            origin foot; madar seed: a brown seed with a fan of silk hairs
//   dandelion(x, y, s, o)       origin foot; a clock of hairs on a stalk
//   dandelionSeed(x, y, s, o)   origin seed; a single parachute
//   pollenGrain(x, y, s, o)     origin centre; o.spiny; o.light
//   seedling(x, y, s, o)        origin foot at soil; o.grow 0..1
//   caterpillar, pupa, leafFlat, lizard, chick, frogSide, fishSide, eggYolk, tadpole for L06
import { svgPlantColour as P, blend as B, ART_INK as INK, ART_PALE as PALE, stroke, fill, pathEllipse, pathCircle } from './PlantArt.js';

const n1 = (v) => Math.round(v * 10) / 10;
const G = (x, y, s, o, body) => `<g transform="translate(${n1(x)} ${n1(y)})${o?.rot ? ` rotate(${o.rot})` : ''} scale(${o?.flip ? -s : s} ${s})"${o?.alpha != null ? ` style="opacity:${o.alpha}"` : ''}>${body}</g>`;
const PK = 'var(--sim-elev-peak)', DK = 'var(--sim-strata-6)';
const hash = (t) => { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h.toString(36); };
/** A top-left lit gradient over a colour: light side, body, shade side. Tokens only. */
export function grad(col, o = {}) {
  const li = o.li ?? 74, sh = o.sh ?? 66, an = o.an ?? 50, id = `fa${hash(col + li + sh + an)}`;
  return { id, def: `<linearGradient id="${id}" gradientTransform="rotate(${an} 0.5 0.5)"><stop offset="0" style="stop-color:color-mix(in oklab, ${col} ${li}%, ${PK})"/><stop offset="0.48" style="stop-color:${col}"/><stop offset="1" style="stop-color:color-mix(in oklab, ${col} ${sh}%, ${DK})"/></linearGradient>` };
}
const rimOf = (col) => `color-mix(in oklab, ${col} 52%, ${DK})`;
export const shape = (d, col, w = 3, extra = '') => { const g = grad(col); return `${g.def}<path d="${d}" style="fill:url(#${g.id});stroke:${rimOf(col)};stroke-width:${n1(w * 0.55)};stroke-linejoin:round;stroke-linecap:round${extra ? ';' + extra : ''}"/>`; };
const flat = (d, col, extra = '') => `<path d="${d}" ${fill(col, extra)}/>`;
const line = (d, col, w, extra = '') => `<path d="${d}" ${stroke(col, w, extra)}/>`;
const dot = (x, y, r, col, w = 2.5) => { const g = grad(col); return `${g.def}<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" style="fill:url(#${g.id});stroke:${rimOf(col)};stroke-width:${n1(w * 0.55)}"/>`; };
const dotF = (x, y, r, col) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" ${fill(col)}/>`;
const mirror = (b) => `<g transform="scale(-1 1)">${b}</g>`;
const rnd = (seed) => { let s = (seed * 2654435761 + 1) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

const C = {
  red: P('red'), redD: P('redDark'), redL: P('redLit'), pink: P('pink'), pinkL: P('pinkLit'), pinkD: P('pinkDark'),
  yel: 'color-mix(in oklab, var(--sim-strata-1) 72%, var(--sim-series-2))', yelD: 'var(--sim-series-2)', yelL: 'color-mix(in oklab, var(--sim-strata-1) 70%, var(--sim-elev-peak))', leaf: P('leaf'), leafD: P('leafDark'), leafL: P('leafLit'),
  stem: P('stem'), stemL: P('stemLit'), pale: PALE, wood: P('wood'), woodD: P('woodDark'), bark: P('bark'), barkD: P('barkDark'), barkL: P('barkLit'),
  ink: INK, tuber: P('tuber'), water: P('water'), metal: P('metal'), lemon: P('lemon'),
  ovary: P(B('leafLit', 'cloud', 0.45)), ovaryIn: P(B('gold', 'cloud', 0.62)), ovule: P('gold'), purple: P('budPurple'), lilac: P(B('budPurple', 'cloud', 0.55)), lilacL: P(B('budPurple', 'cloud', 0.78)),
  cloth: P(B('strata1', 'cloud', 0.62)), clothD: P(B('strata1', 'strata3', 0.3)), bee: P('gold'), silk: P(B('cloud', 'gold', 0.22)), tomato: P(B('magma', 'gold', 0.14)), tomatoD: P('redDark'), tomatoIn: P(B('magma', 'cloud', 0.22)), jelly: P(B('magma', 'gold', 0.36)), seed: P(B('gold', 'cloud', 0.5)),
};
export { n1 };
/** static get MIN_SCALE() { return phoneMin(); } : full size on a phone, the host's own fit elsewhere. */
export const phoneMin = () => (typeof innerWidth === 'number' && innerWidth <= 600 ? 1 : undefined);
export const FLOWER_COLOURS = C;

const blur = (id, v) => `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${v}"/></filter>`;
const vgrad = (id, stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" style="stop-color:${c}"/>`).join('')}</linearGradient>`;
const SKY = P('skyPale'), HZ = 'color-mix(in oklab, var(--sim-strata-1) 26%, var(--sim-elev-peak))';
/** Each scene's own quiet place. kind: bokeh (garden blur), trellis (pea rows), meadow, farm, orchard (hill slope), desk (notebook on wood), bench (lab), kitchen, pond, pasture, gold (ripe field), soil. */
export function backdrop(kind, W, H, o = {}) {
  const k = kind, fy = o.floor ?? H * 0.8, id = `bk${k}`, r = rnd(o.seed ?? 5);
  const skyFill = (c0, c1) => `<defs>${vgrad(id, [[0, c0], [1, c1]])}${blur(id + 'b', 16)}${blur(id + 's', 5)}</defs><rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" style="fill:url(#${id})"/>`;
  const sun = (x, y, R) => `<circle cx="${x}" cy="${y}" r="${R}" filter="url(#${id}b)" ${fill(HZ, 'opacity:0.9')}/>`;
  const hills = (y, col, amp, seed, op = 1) => { const q = rnd(seed); let d = `M-4 ${H + 4}L-4 ${y}`; for (let i = 0; i <= 8; i++) { const px = i * W / 8; d += `Q${n1(px - W / 16)} ${n1(y - amp * q())} ${n1(px)} ${n1(y - amp * 0.4 * q())}`; } return `<path d="${d}L${W + 4} ${H + 4}Z" ${fill(col, `opacity:${op}`)}/>`; };
  const trees = (y, n, col, seed, sz = 26) => { const q = rnd(seed); let g = ''; for (let i = 0; i < n; i++) { const px = (i + q() * 0.7) * W / n, R = sz * (0.7 + q() * 0.6); g += `<path d="M${n1(px - R)} ${n1(y)}C${n1(px - R * 1.2)} ${n1(y - R)} ${n1(px - R * 0.4)} ${n1(y - R * 1.7)} ${n1(px)} ${n1(y - R * 1.6)}C${n1(px + R * 0.6)} ${n1(y - R * 1.8)} ${n1(px + R * 1.2)} ${n1(y - R)} ${n1(px + R)} ${n1(y)}Z" ${fill(col)}/>`; } return g; };
  const grass = (y, n, col, h = 12, seed = 9) => { const q = rnd(seed); let g = ''; for (let i = 0; i < n; i++) { const px = q() * W, py = y + q() * (H - y), l = h * (0.6 + q() * 0.8), b2 = (q() - 0.5) * 8; g += `M${n1(px)} ${n1(py)}q${n1(b2 * 0.3)} ${n1(-l * 0.6)} ${n1(b2)} ${n1(-l)}`; } return `<path d="${g}" ${stroke(col, 1.5, 'opacity:0.55')}/>`; };
  const far = P(B('hedgeLit', 'skyPale', 0.5)), mid = P('hedgeLit'), near = P('hedge'), turf = P(B('leafLit', 'cloud', 0.16));
  if (k === 'bokeh') {
    let b = skyFill(P(B('skyPale', 'cloud', 0.4)), P(B('leafLit', 'cloud', 0.56)));
    for (let i = 0; i < 14; i++) b += `<circle cx="${n1(r() * W)}" cy="${n1(r() * H)}" r="${n1(26 + r() * 44)}" filter="url(#${id}b)" ${fill(i % 3 ? P('leafLit') : i % 2 ? C.pinkL : C.yelL, 'opacity:0.34')}/>`;
    return b;
  }
  if (k === 'trellis') {
    let b = skyFill(SKY, HZ) + sun(W * 0.82, 40, 70) + hills(H * 0.5, far, 30, 3) + trees(H * 0.54, 9, mid, 6, 20) + hills(H * 0.62, P(B('leafLit', 'cloud', 0.3)), 16, 4);
    return b + grass(H * 0.66, 90, P('leafDark'), 10);
  }
  if (k === 'meadow') {
    let b = skyFill(SKY, HZ) + sun(W * 0.16, 46, 80) + hills(fy - 60, far, 40, 8) + hills(fy - 26, mid, 24, 12);
    b += `<path d="M-4 ${fy}C${W * 0.3} ${fy - 16} ${W * 0.66} ${fy + 12} ${W + 4} ${fy - 10}L${W + 4} ${H + 4}L-4 ${H + 4}Z" ${fill(turf)}/>` + grass(fy, 150, P('leafDark'), 14);
    for (let i = 0; i < 26; i++) b += dotF(r() * W, fy + 8 + r() * (H - fy), 1.8, i % 2 ? C.yelL : C.pinkL);
    return b;
  }
  if (k === 'farm') {
    let b = skyFill(P(B('skyDay', 'cloud', 0.34)), HZ) + sun(W * 0.72, fy - 90, 90) + hills(fy - 44, far, 30, 21) + trees(fy - 18, 12, mid, 8, 16);
    b += `<rect x="-4" y="${fy - 22}" width="${W + 8}" height="${H}" ${fill(P('soil'))}/>`;
    for (let i = -6; i < 8; i++) { const u = i / 6; b += `<path d="M${n1(W / 2 + u * W * 0.12)} ${fy - 22}L${n1(W / 2 + u * W * 1.1)} ${H + 4}" ${stroke(P('soilDeep'), 2 + Math.abs(u) * 3, 'opacity:0.55')}/>`; }
    return b;
  }
  if (k === 'orchard') {
    let b = skyFill(P(B('skyDay', 'cloud', 0.3)), HZ);
    const ridge = (y, col, seed, amp) => { const q = rnd(seed); let d = `M-4 ${y}`; for (let i = 0; i <= 12; i++) d += `L${n1(i * W / 12)} ${n1(y - amp * q())}`; return `<path d="${d}L${W + 4} ${H + 4}L-4 ${H + 4}Z" ${fill(col)}/>`; };
    b += ridge(fy - 40, P(B('strata5', 'skyPale', 0.68)), 31, 70) + ridge(fy - 22, P(B('hedge', 'skyPale', 0.5)), 33, 42) + trees(fy - 12, 16, mid, 5, 13);
    b += `<path d="M-4 ${fy - 8}C${W * 0.4} ${fy - 30} ${W * 0.7} ${fy + 2} ${W + 4} ${fy - 16}L${W + 4} ${H + 4}L-4 ${H + 4}Z" ${fill(turf)}/>` + grass(fy, 80, P('leafDark'), 10);
    return b;
  }
  if (k === 'desk' || k === 'bench' || k === 'kitchen') {
    const wall = k === 'desk' ? P(B('strata1', 'cloud', 0.62)) : k === 'bench' ? P(B('ice', 'cloud', 0.5)) : P(B('strata1', 'cloud', 0.76));
    const top = k === 'bench' ? P(B('metal', 'cloud', 0.3)) : P('wood');
    let b = skyFill(wall, `color-mix(in oklab, ${wall} 88%, ${DK})`);
    if (k === 'kitchen') for (let y = 0; y < fy; y += 34) for (let x = (y / 34) % 2 ? -22 : 0; x < W; x += 44) b += `<rect x="${x}" y="${y}" width="42" height="32" rx="3" ${fill(PALE, 'opacity:0.34')}/>`;
    if (k === 'bench' && o.shelf !== false) b += `<rect x="${W * 0.06}" y="${fy * 0.26}" width="${W * 0.88}" height="8" rx="4" ${fill(P('wood'), 'opacity:0.6')}/>`;
    const g = grad(top, { an: 90 });
    b += `<defs>${g.def}</defs><rect x="-4" y="${fy}" width="${W + 8}" height="${H - fy + 8}" style="fill:url(#${g.id})"/><rect x="-4" y="${fy}" width="${W + 8}" height="4" ${fill(PALE, 'opacity:0.5')}/>`;
    if (k !== 'bench') for (let i = 0; i < 5; i++) { const yy = fy + 10 + i * (H - fy) / 5; b += `<path d="M-4 ${yy}C${W * 0.3} ${yy - 4} ${W * 0.6} ${yy + 5} ${W + 4} ${yy}" ${stroke(P('woodDark'), 1.2, 'opacity:0.4')}/>`; }
    return b;
  }
  if (k === 'pond') {
    let b = skyFill(P(B('seaShallow', 'cloud', 0.3)), P('seaDeep'));
    b += `<rect x="-4" y="-4" width="${W + 8}" height="${fy * 0.16}" ${fill(P('skyPale'))}/><path d="M-4 ${fy * 0.16}c${W / 8} -6 ${W / 4} 6 ${W / 2} 0s${W / 3} 6 ${W / 2 + 8} 0" ${stroke(PALE, 2.5)}/>`;
    for (let i = 0; i < 5; i++) { const x0 = W * (0.08 + i * 0.2); b += `<path d="M${n1(x0)} ${fy * 0.16}L${n1(x0 + 40)} ${fy * 0.16}L${n1(x0 + 130)} ${fy}L${n1(x0 + 60)} ${fy}Z" ${fill(PALE, 'opacity:0.09')}/>`; }
    b += `<path d="M-4 ${fy}C${W * 0.2} ${fy - 10} ${W * 0.5} ${fy + 8} ${W + 4} ${fy - 6}L${W + 4} ${H + 4}L-4 ${H + 4}Z" ${fill(P(B('strata1', 'strata3', 0.3)))}/>`;
    for (let i = 0; i < 18; i++) b += `<ellipse cx="${n1(r() * W)}" cy="${n1(fy + 8 + r() * (H - fy - 8))}" rx="${n1(4 + r() * 7)}" ry="3" ${fill(P('metal'), 'opacity:0.6')}/>`;
    return b;
  }
  if (k === 'gold') {
    let b = skyFill(SKY, HZ) + sun(W * 0.84, 56, 80) + hills(fy - 40, far, 24, 7);
    b += `<rect x="-4" y="${fy - 34}" width="${W + 8}" height="${H}" ${fill(C.yelL)}/>`;
    for (let i = 0; i < 220; i++) { const px = r() * W, py = fy - 30 + r() * (H - fy + 30), l = 10 + (py - fy + 30) * 0.2; b += `<path d="M${n1(px)} ${n1(py)}l${n1(r() * 4 - 2)} ${n1(-l)}" ${stroke(i % 3 ? C.yel : C.yelD, 1.3, 'opacity:0.6')}/>`; }
    return b;
  }
  if (k === 'soil') {
    let b = skyFill(SKY, HZ) + sun(W * 0.2, 44, 70) + hills(fy - 30, mid, 20, 17);
    b += `<rect x="-4" y="${fy}" width="${W + 8}" height="${H}" ${fill(P('soil'))}/><path d="M-4 ${fy}c${W / 6} -6 ${W / 3} 6 ${W / 2} 0s${W / 3} -6 ${W / 2 + 8} 0" ${stroke(P('leafDark'), 4)}/>`;
    for (let i = 0; i < 60; i++) b += `<ellipse cx="${n1(r() * W)}" cy="${n1(fy + 8 + r() * (H - fy))}" rx="${n1(1.5 + r() * 4)}" ry="${n1(1 + r() * 2)}" ${fill(i % 3 ? P('soilDeep') : P('crumb'), 'opacity:0.7')}/>`;
    return b;
  }
  return gardenBack(W, H, o);
}
/** The scene's frame: clipped art, a soft rim. */
export function frame(st, id, body) {
  const r = 18, q = 2;
  return `<defs><clipPath id="${id}-clip"><rect x="${q}" y="${q}" width="${st.W - 2 * q}" height="${st.H - 2 * q}" rx="${r}"/></clipPath></defs><g clip-path="url(#${id}-clip)">${body}</g><rect x="${q}" y="${q}" width="${st.W - 2 * q}" height="${st.H - 2 * q}" rx="${r}" ${stroke('var(--sim-stroke)', 2.5)}/>`;
}
/** A thin dotted leader, ending on a small dot, as in a textbook figure. */
export const leader = (x0, y0, x1, y1) => `<path d="M${n1(x0)} ${n1(y0)}L${n1(x1)} ${n1(y1)}" ${stroke(INK, 1.6, 'stroke-dasharray:1 5')}/><circle cx="${n1(x1)}" cy="${n1(y1)}" r="3" ${fill(INK)}/>`;
/** A soft shadow under something standing on the ground. */
export const contact = (x, y, rx, ry = 9) => `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(ry)}" ${fill(DK, 'opacity:0.2')}/>`;
/** A quiet garden behind a hero: day sky, a soft far hedge, a grass floor. Both themes: the art keeps its own daylight. */
export function gardenBack(W, H, o = {}) {
  const fy = o.floor ?? H - 60, hy = fy - (o.hedge ?? 50);
  return `<rect x="-4" y="-4" width="${W + 8}" height="${H + 8}" ${fill(P('skyPale'))}/>`
    + flat(`M-4 ${hy + 16}C${W * 0.14} ${hy - 14} ${W * 0.28} ${hy + 10} ${W * 0.42} ${hy}C${W * 0.6} ${hy - 16} ${W * 0.74} ${hy + 10} ${W + 4} ${hy - 4}L${W + 4} ${fy + 4}L-4 ${fy + 4}Z`, P('hedgeLit'))
    + `<rect x="-4" y="${fy}" width="${W + 8}" height="${H - fy + 8}" ${fill(P(B('leafLit', 'cloud', 0.2)))}/>`
    + flat(`M-4 ${fy}C${W * 0.3} ${fy + 8} ${W * 0.7} ${fy - 6} ${W + 4} ${fy + 4}L${W + 4} ${fy + 14}C${W * 0.7} ${fy + 4} ${W * 0.3} ${fy + 18} -4 ${fy + 10}Z`, P('leaf'), 'opacity:0.5');
}
// -- flower in section ----------------------------------------------------
function sectionPetal() {
  let v = '';
  for (let i = 0; i < 9; i++) { const t = i / 8; v += line(`M${16 + t * 16} ${-20 + t * 12}C${40 + t * 26} ${-84 + t * 44} ${92 - t * 4} ${-134 + t * 46} ${150 - t * 10} ${-112 + t * 12}`, C.redD, 1.1, 'opacity:0.42'); }
  return shape('M10 -22C30 -92 92 -158 156 -122C176 -110 166 -84 146 -92C108 -108 72 -66 34 -6Z', C.red) + v
    + flat('M36 -60C60 -104 104 -136 146 -118C116 -120 84 -96 58 -62Z', C.redL, 'opacity:0.45');
}
export function flowerSection(x, y, s, o = {}) {
  const part = (n) => (o.part ? o.part(n) : '');
  const sepal = shape('M6 -6C44 -12 92 -2 104 36C84 30 40 34 8 12Z', C.leaf) + line('M16 2C46 2 76 12 92 26', C.leafD, 1.6) + line('M34 3L42 16M52 7L58 20M68 13L72 24M34 3L46 -3M52 7L66 2', C.leafD, 1, 'opacity:0.6');
  const stamen = (x0, x1, h, a) => line(`M${x0} -24C${x0 + 4} ${-h * 0.5} ${x1 - 8} ${-h * 0.8} ${x1} ${-h}`, C.pale, 7) + line(`M${x0} -24C${x0 + 4} ${-h * 0.5} ${x1 - 8} ${-h * 0.8} ${x1} ${-h}`, C.yelD, 4)
    + `<g transform="translate(${x1} ${-h}) rotate(${a})">${shape('M-17 0C-17 -13 -4 -13 0 -6C4 -13 17 -13 17 0C17 13 4 13 0 6C-4 13 -17 13 -17 0Z', C.yel)}${line('M-11 0L11 0', C.yelD, 1.6)}${[[-9,-5],[-4,6],[7,-6],[10,4],[3,7]].map(([p,q]) => dotF(p, q, 1.5, C.yelL)).join('')}</g>`;
  const stamens = stamen(22, 54, 118, 24) + stamen(26, 84, 92, 40) + stamen(18, 36, 142, 12);
  const ovary = shape('M0 -2C-40 -2 -46 -44 -30 -66C-20 -80 -10 -86 -7 -92L7 -92C10 -86 20 -80 30 -66C46 -44 40 -2 0 -2Z', C.ovary)
    + flat('M0 -14C-28 -14 -34 -44 -22 -62C-16 -70 -8 -74 0 -76C8 -74 16 -70 22 -62C34 -44 28 -14 0 -14Z', C.ovaryIn);
  const ovuleAt = [[-13, -30], [13, -30], [-15, -46], [15, -46], [-9, -61], [9, -61]];
  const ovule = ovuleAt.map(([a, b]) => line(`M0 ${b}L${a} ${b}`, C.leafD, 1.4) + dot(a, b, 7.5, C.ovule, 2.2) + dotF(a - 2, b - 2, 2, C.yelL)).join('') + line('M0 -14L0 -74', C.leafD, 2);
  const style = shape('M-7 -90C-6 -130 -6 -170 -8 -196L8 -196C6 -170 6 -130 7 -90Z', C.leafL) + line('M-2 -96L-2 -190M2 -96L2 -190', C.leafD, 1, 'opacity:0.5') + shape('M-20 -196C-24 -214 -6 -216 0 -206C6 -216 24 -214 20 -196C10 -188 -10 -188 -20 -196Z', C.pink, 3) + [[-12, -204], [-6, -207], [6, -207], [12, -204], [0, -199]].map(([a, b]) => dotF(a, b, 1.6, C.redD)).join('');
  const back = shape('M-44 -30C-72 -128 -30 -176 0 -186C30 -176 72 -128 44 -30C20 -14 -20 -14 -44 -30Z', C.redD) + line('M0 -176L0 -60M-20 -150L-10 -60M20 -150L10 -60M-34 -120L-20 -50M34 -120L20 -50', C.red, 1.4, 'opacity:0.7');
  const stem = shape('M-11 0C-9 26 -9 60 -10 90L10 90C9 60 9 26 11 0Z', C.stem);
  return G(x, y, s, o, stem
    + `<g style="${part('petal')}">${back}</g>`
    + `<g style="${part('sepal')}">${sepal}${mirror(sepal)}</g>`
    + `<g style="${part('petal')}">${sectionPetal()}${mirror(sectionPetal())}</g>`
    + `<g style="${part('stamen')}">${stamens}${mirror(stamens)}</g>`
    + `<g style="${part('pistil')}">${style}</g>`
    + `<g style="${part('ovary')}">${ovary}</g>`
    + `<g style="${part('ovule')}">${ovule}</g>`
    + shape('M-30 -2C-16 12 16 12 30 -2C20 -8 -20 -8 -30 -2Z', C.leafD, 2.5));
}
/** Stage points of the parts of flowerSection, for labels. */
export const SECTION_PTS = { stigma: [0, -204], style: [0, -150], ovary: [-26, -40], ovule: [15, -46], sepal: [78, 20], petal: [120, -110], anther: [84, -92], filament: [46, -62], antherTop: [36, -142] };
export function ovuleZoom(x, y, s, o = {}) {
  return G(x, y, s, o, shape(pathEllipse(0, 0, 66, 78), C.ovule) + shape(pathEllipse(0, -2, 48, 60), C.ovaryIn, 2.5)
    + `<g style="${o.egg ?? ''}">${dot(0, 22, 19, C.pink, 3)}${dotF(-1, 21, 7, C.redD)}</g>`);
}
export function flowerBud(x, y, s, o = {}) {
  const t = o.open ?? 0;
  return G(x, y, s, o, shape('M-6 0C-5 20 -5 34 -6 50L6 50C5 34 5 20 6 0Z', C.stem)
    + shape(`M-26 -46C-20 -${88 + 26 * t} 20 -${88 + 26 * t} 26 -46C20 -30 -20 -30 -26 -46Z`, C.red)
    + shape('M0 -8C-34 -14 -38 -56 -14 -90C-8 -60 -2 -30 0 -8Z', C.leaf) + shape('M0 -8C34 -14 38 -56 14 -90C8 -60 2 -30 0 -8Z', C.leaf)
    + shape('M0 -6C-16 -30 -12 -74 0 -104C12 -74 16 -30 0 -6Z', C.leafL)
    + shape('M-16 -8C-8 6 8 6 16 -8C8 -14 -8 -14 -16 -8Z', C.leafD, 2.5));
}
/** A flower with sepals and petals joined into tubes: fused parts. Origin base. Same size as flowerSection. */
export function fusedFlower(x, y, s, o = {}) {
  return G(x, y, s, o, shape('M-11 0C-9 26 -9 60 -10 90L10 90C9 60 9 26 11 0Z', C.stem)
    + shape('M-34 -4C-60 -60 -64 -130 -110 -176C-60 -184 -30 -160 0 -176C30 -160 60 -184 110 -176C64 -130 60 -60 34 -4Z', C.pink) + flat('M-24 -16C-44 -70 -48 -130 -84 -168C-50 -168 -30 -150 -8 -160C-20 -110 -20 -60 -8 -16Z', C.pinkL, 'opacity:0.75')
    + shape('M-40 4C-58 -26 -62 -52 -58 -70C-44 -58 -32 -62 -20 -74C-10 -62 10 -62 20 -74C32 -62 44 -58 58 -70C62 -52 58 -26 40 4C20 14 -20 14 -40 4Z', C.leaf));
}
/** A close view of the inside of a pea flower. Origin foot of the pistil. 200 tall. o.stamens, o.grains 0..n on the stigma, o.outline 'bud' | 'open', o.bag */
export function peaCloseUp(x, y, s, o = {}) {
  // A pea flower opened along its keel, so the pistil and stamens show: the notched standard behind, two wings folded back,
  // the keel as a pale boat, a slim ovary with its ovules, a curved style and a brushy stigma, the calyx at the foot.
  const tall = o.young ? 0.72 : 1, sw = (o.outline === 'open' ? 1 : 0.74), col = o.col ?? C.lilacL, tone = o.col ? C.pale : C.lilac, deep = o.col ?? C.purple;
  const gid = `pc${hash(col + sw)}`;
  let b = `<defs><radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="0" cy="-10" r="${n1(205 * Math.max(sw, 0.8))}"><stop offset="0" style="stop-color:color-mix(in oklab, ${deep} 78%, ${col})"/><stop offset="0.42" style="stop-color:${tone}"/><stop offset="0.8" style="stop-color:${col}"/><stop offset="1" style="stop-color:color-mix(in oklab, ${col} 70%, ${PK})"/></radialGradient></defs>`;
  const std = `M0 22C${-92 * sw} 14 ${-130 * sw} -70 ${-100 * sw} -146C${-84 * sw} -186 ${-34 * sw} -210 ${-8 * sw} -192C${-3 * sw} -188 -2 -178 0 -170C2 -178 ${3 * sw} -188 ${8 * sw} -192C${34 * sw} -210 ${84 * sw} -186 ${100 * sw} -146C${130 * sw} -70 ${92 * sw} 14 0 22Z`;
  b += `<path d="${std}" style="fill:${DK};opacity:0.2;filter:url(#pa-soft)" transform="translate(5 8)"/>`;
  b += `<path d="${std}" style="fill:url(#${gid});stroke:${rimOf(tone)};stroke-width:1.8;stroke-linejoin:round"/>`;
  // veins fan out from the throat and fork near the edge; the crease runs up to the notch
  for (const v of [-1, -0.82, -0.62, -0.44, -0.27, -0.12, 0.12, 0.27, 0.44, 0.62, 0.82, 1]) {
    const ex = v * 96 * sw, ey = -176 + Math.abs(v) * 60, mx = v * 70 * sw, my = -60 - (1 - Math.abs(v)) * 40;
    b += line(`M${n1(v * 10)} 4Q${n1(mx)} ${n1(my)} ${n1(ex)} ${n1(ey)}M${n1(ex * 0.8)} ${n1(ey * 0.82 + 2)}L${n1(ex * 0.98 + v * 12)} ${n1(ey * 0.86)}`, deep, 1.1, 'opacity:0.3');
  }
  b += line('M0 -168C-2 -130 2 -100 0 -60', deep, 2.4, 'opacity:0.34');
  b += line(`M${-92 * sw} -150C${-74 * sw} -188 ${-34 * sw} -204 ${-10 * sw} -190`, PK, 3, 'opacity:0.5') + line(`M${10 * sw} -190C${34 * sw} -204 ${74 * sw} -188 ${92 * sw} -150`, PK, 3, 'opacity:0.5');
  for (const d of [-1, 1]) {
    const wing = `M${d * 8} 24C${d * 60 * sw} 26 ${d * 112 * sw} -14 ${d * 100 * sw} -86C${d * 92 * sw} -104 ${d * 62 * sw} -96 ${d * 40 * sw} -62C${d * 26} -36 ${d * 16} -8 ${d * 8} 24Z`;
    b += `<path d="${wing}" style="fill:${DK};opacity:0.18;filter:url(#pa-soft)" transform="translate(${d * 3} 5)"/>` + shape(wing, tone, 2.2);
    for (const q of [0.34, 0.56, 0.78]) b += line(`M${d * 12} 18Q${n1(d * 62 * sw * q)} ${n1(-6 - 34 * q)} ${n1(d * 98 * sw * q)} ${n1(-88 * q)}`, deep, 1, 'opacity:0.28');
  }
  // the keel, a pale boat holding the pistil and stamens
  const keel = `M-28 22C-40 -24 -30 ${-96 * tall} 4 ${-136 * tall}C34 ${-108 * tall} 42 -24 30 22Z`;
  b += `<path d="${keel}" style="fill:${DK};opacity:0.2;filter:url(#pa-soft)" transform="translate(2 4)"/>` + shape(keel, C.lilacL, 2.2) + `<path d="M-20 18C-30 -24 -22 ${-90 * tall} 4 ${-122 * tall}C26 ${-98 * tall} 32 -24 22 18Z" style="fill:color-mix(in oklab, ${C.lilac} 42%, ${DK});opacity:0.3"/>`;
  // stamens: a sheath of joined filaments round the ovary, parting near the top
  const antherTop = (a, hh) => { const q = a * 0.96; return line(`M${n1(a * 0.34)} 2C${n1(a * 0.5)} ${n1(-hh * 0.5)} ${n1(a * 1.02)} ${n1(-hh * 0.78)} ${n1(q)} ${n1(-hh)}`, C.yelL, 3.2) + line(`M${n1(a * 0.34)} 2C${n1(a * 0.5)} ${n1(-hh * 0.5)} ${n1(a * 1.02)} ${n1(-hh * 0.78)} ${n1(q)} ${n1(-hh)}`, C.yelD, 1, 'opacity:0.5') + shape(`M${n1(q - 7)} ${n1(-hh - 4)}C${n1(q - 9)} ${n1(-hh - 15)} ${n1(q - 1)} ${n1(-hh - 15)} ${n1(q)} ${n1(-hh - 9)}C${n1(q + 1)} ${n1(-hh - 15)} ${n1(q + 9)} ${n1(-hh - 15)} ${n1(q + 7)} ${n1(-hh - 4)}C${n1(q + 4)} ${n1(-hh + 2)} ${n1(q - 4)} ${n1(-hh + 2)} ${n1(q - 7)} ${n1(-hh - 4)}Z`, C.yel, 1.8); };
  const ST = [[-27, 0.8], [26, 0.8], [-17, 0.93], [16, 0.93]];
  if (o.stamens) for (const [a, h] of ST) b += antherTop(a, 118 * tall * h);
  // the pistil: slim ovary with ovules showing, then a curved style
  const ty = -118 * tall, oT = -62 * tall;
  b += shape(`M-9 18C-14 -8 -13 ${n1(oT * 0.7)} -7 ${n1(oT)}L7 ${n1(oT)}C13 ${n1(oT * 0.7)} 15 -8 10 18Z`, C.ovary, 2.2);
  for (let i = 0; i < 4; i++) { const v = 6 + (oT + 12) * (i + 0.5) / 4; b += dot(0.6, v, 3.3, C.leafL, 1.2); }
  b += shape(`M-6 ${n1(oT + 2)}C-5 ${n1(oT * 1.4)} -4 ${n1(ty * 0.92)} -2 ${n1(ty + 4)}L4 ${n1(ty + 4)}C5 ${n1(ty * 0.92)} 6 ${n1(oT * 1.4)} 6 ${n1(oT + 2)}Z`, C.ovary, 1.8);
  const stig = `M-11 ${ty}C-14 ${ty - 20} 15 ${ty - 20} 12 ${ty}C7 ${ty + 6} -6 ${ty + 6} -11 ${ty}Z`;
  b += shape(stig, C.pink, 2.2);
  for (let i = 0; i < 9; i++) { const u = -9 + i * 2.3; b += line(`M${n1(u)} ${ty - 12 + Math.abs(u) * 0.5}l${n1(u * 0.12)} -5`, C.pinkD, 1, 'opacity:0.7'); }
  if (!o.stamens && o.stubs !== false) for (const [a, h] of ST) { const hh = 34 * h; b += line(`M${n1(a * 0.34)} 2L${n1(a * 0.56)} ${n1(-hh)}`, C.yelL, 3.2) + line(`M${n1(a * 0.56 - 3)} ${n1(-hh - 1)}L${n1(a * 0.56 + 3)} ${n1(-hh + 1)}`, C.woodD, 2.2); }
  const g = o.grains ?? 0, gr = rnd(7);
  for (let i = 0; i < g; i++) { const u = (i + 0.5) / g * 6.28 * 1.6, q = 3 + i * 1.1; b += dot(1 + Math.cos(u) * q, ty - 14 - Math.abs(Math.sin(u)) * q * 0.6 - gr() * 5, 3.6, C.yel, 1.3); }
  // calyx, with a short stalk behind it
  b += line('M0 30C-2 42 -8 50 -14 58', C.stem, 8) + line('M0 30C-2 42 -8 50 -14 58', C.stemL, 2.4, 'opacity:0.6');
  b += shape('M-38 8L-29 -22L-15 4L0 -28L15 4L29 -22L38 8C32 38 -32 38 -38 8Z', C.leaf, 2.2) + line('M-29 -14C-24 6 -18 16 -14 24M0 -20C0 0 0 14 0 28M29 -14C24 6 18 16 14 24', C.leafD, 1.3, 'opacity:0.55') + line('M-26 22C-10 32 10 32 26 22', C.leafD, 2, 'opacity:0.35');
  return G(x, y, s, o, b);
}
/** One wheat flower, still shut, cut open to show inside: no petals, two green husks, three anthers and a feathery stigma. Origin foot. o.grains */
export function wheatFloret(x, y, s, o = {}) {
  const husk = 'M-4 26C-70 10 -92 -70 -66 -130C-50 -168 -24 -190 2 -214C26 -188 50 -166 64 -130C88 -70 66 12 4 26Z';
  let b = `<path d="${husk}" style="fill:${DK};opacity:0.2;filter:url(#pa-soft)" transform="translate(5 8)"/>` + shape(husk, C.leaf, 2.4);
  for (const q of [-0.82, -0.6, 0.6, 0.82]) b += line(`M${n1(q * 22)} 18C${n1(q * 84)} -40 ${n1(q * 74)} -120 ${n1(q * 14)} -196`, C.leafD, 1.3, 'opacity:0.5');
  b += line('M2 -214L4 -236', C.leafD, 2.4);
  // the window into the closed flower
  const win = 'M-2 12C-46 2 -58 -60 -42 -112C-32 -142 -16 -160 2 -176C20 -158 34 -142 42 -112C58 -60 46 4 2 12Z';
  b += `<path d="${win}" style="fill:color-mix(in oklab, ${C.leafL} 40%, ${PK});stroke:${C.leafD};stroke-width:1.6"/><path d="${win}" transform="translate(0 -4) scale(0.92)" style="fill:none;stroke:${DK};stroke-width:7;opacity:0.1"/>`;
  b += shape('M-16 4C-24 -22 -18 -50 0 -58C18 -50 24 -22 16 4C8 12 -8 12 -16 4Z', C.ovary, 2);
  for (const d of [-1, 1]) {
    b += line(`M${d * 4} -56C${d * 8} -76 ${d * 18} -92 ${d * 22} -116`, C.silk, 3);
    for (let i = 0; i < 9; i++) { const v = i / 8, px = d * (6 + v * 16), py = -66 - v * 50; b += line(`M${n1(px)} ${n1(py)}l${d * 10} -5M${n1(px)} ${n1(py)}l${d * -7} -8`, C.silk, 1.6); }
  }
  for (const [a, h] of [[-32, 66], [31, 70], [-4, 94]]) { b += line(`M${a * 0.3} -2C${a * 0.6} ${-h * 0.4} ${a} ${-h * 0.7} ${a} ${-h}`, C.yelL, 2.4) + shape(`M${a - 6} ${-h + 2}C${a - 9} ${-h - 14} ${a - 6} ${-h - 26} ${a} ${-h - 30}C${a + 6} ${-h - 26} ${a + 9} ${-h - 14} ${a + 6} ${-h + 2}C${a + 3} ${-h + 6} ${a - 3} ${-h + 6} ${a - 6} ${-h + 2}Z`, C.yel, 1.8) + line(`M${a} ${-h - 26}V${-h + 2}`, C.yelD, 1.2, 'opacity:0.6'); }
  const g = o.grains ?? 0, gr = rnd(5);
  for (let i = 0; i < g; i++) { const d = i % 2 ? 1 : -1, v = 0.2 + gr() * 0.75; b += dot(d * (8 + v * 18), -70 - v * 48, 3.4, C.yel, 1.2); }
  return G(x, y, s, o, b);
}
// -- pea ---------------------------------------------------------------
export function peaFlower(x, y, s, o = {}) {
  const lil = o.tint ?? C.lilac;
  let b = '';
  if (o.pod) {
    b += shape('M-4 -2C14 -22 58 -26 98 -6C104 2 96 8 86 8C50 14 14 12 -4 -2Z', C.leaf)
      + [18, 40, 62, 82].map((a) => flat(pathEllipse(a, -5, 9, 8), C.leafL)).join('') + line('M-2 -2C24 -10 58 -10 96 -4', C.leafD, 2.5);
  } else if (o.stage === 'bud') {
    b += shape('M0 -4C-14 -18 -16 -48 2 -74C18 -56 20 -22 0 -4Z', lil) + line('M1 -8C-3 -30 -2 -50 2 -68', C.purple, 1, 'opacity:0.5')
      + shape('M0 4C-22 -2 -26 -30 -14 -50C-8 -32 -2 -14 0 4Z', C.leaf, 2.2) + shape('M0 4C16 -4 20 -26 12 -44C6 -28 2 -12 0 4Z', C.leafL, 2.2) + shape('M0 6C-8 -8 -6 -26 0 -38C6 -26 8 -8 0 6Z', C.leaf, 2);
  } else {
    let vein = ''; for (let i = 0; i < 9; i++) { const a = -72 + i * 18; vein += `<g transform="translate(-2 -6) rotate(${a})">${line('M0 -14C2 -34 0 -52 -2 -64', C.purple, 0.9, 'opacity:0.42')}</g>`; }
    b += shape('M2 2C-30 -2 -64 -28 -60 -62C-54 -84 -18 -90 -3 -74C6 -90 42 -86 50 -64C58 -32 30 -4 2 2Z', lil, 2.4) + vein
      + flat('M-8 -24C-34 -32 -50 -48 -48 -64C-38 -76 -18 -72 -8 -60Z', C.lilacL, 'opacity:0.6')
      + shape('M0 6C-26 4 -44 -12 -38 -30C-26 -42 -6 -34 2 -18C6 -8 4 2 0 6Z', P(B('budPurple', 'magma', 0.26)), 2.2) + line('M-4 0C-16 -6 -26 -14 -32 -26M-2 -6C-10 -14 -18 -24 -22 -32', C.purple, 0.9, 'opacity:0.5')
      + shape('M0 6C22 8 42 -2 44 -18C34 -30 12 -26 2 -14C-2 -6 -2 2 0 6Z', P(B('budPurple', 'cloud', 0.34)), 2.2);
    if (o.stamens !== false) b += line('M6 2C22 0 40 -6 52 -12', C.yelD, 2.6) + line('M6 4C24 6 42 4 56 0', C.yelD, 2.6) + dot(54, -13, 5, C.yel, 1.6) + dot(58, 0, 5, C.yel, 1.6);
    b += shape('M-10 10C-8 -4 10 -6 14 8C8 16 -4 16 -10 10Z', C.leaf, 2) + shape('M-8 8L-16 -4L-3 2Z', C.leaf, 1.6) + shape('M10 6L20 -6L3 2Z', C.leaf, 1.6) + line('M2 14C2 20 0 26 0 32', C.stem, 3.5);
  }
  let bag = '';
  if (o.bag) bag = shape('M-48 -82C-22 -94 30 -92 50 -74C64 -50 60 -4 38 16C16 26 -18 24 -38 10C-60 -14 -62 -58 -48 -82Z', C.cloth, 3, 'fill-opacity:0.42')
    + line('M-30 -82L-28 12M-8 -88L-6 20M14 -88L14 20M34 -80L32 14', C.clothD, 2, 'opacity:0.4') + line('M-52 -46L58 -40M-54 -18L60 -14M-40 6L44 8', C.clothD, 2, 'opacity:0.4') + line('M-42 -80C-20 -76 26 -76 46 -76', C.woodD, 4);
  return G(x, y, s, o, b + bag);
}
export function tendril(x, y, s, o = {}) {
  return G(x, y, s, o, line('M0 0C10 -14 30 -14 36 0C40 12 26 18 20 8C16 2 24 -4 28 2', C.stemL, 2.2));
}
export function peaLeaf(x, y, s, o = {}) {
  return G(x, y, s, o, shape('M0 0C10 -26 46 -34 64 -14C48 8 14 14 0 0Z', C.leaf) + line('M4 -2C22 -10 40 -14 56 -14', C.leafD, 1.5) + line('M18 -7L24 -19M30 -10L38 -20M18 -7L26 3M30 -10L40 -2', C.leafD, 0.9, 'opacity:0.6'));
}
// -- field plants -----------------------------------------------------
export function maizePlant(x, y, s, o = {}) {
  const lf = (y0, dir, len, up, droop = 0.2) => {
    const tip = [dir * len, y0 - up * droop], m1 = [dir * len * 0.34, y0 - up * 1.05], m2 = [dir * len * 0.78, y0 - up * 0.96];
    const d = `M0 ${y0}C${m1[0]} ${m1[1]} ${m2[0]} ${m2[1]} ${tip[0]} ${tip[1]}C${m2[0] * 0.94} ${m2[1] + 13} ${m1[0] * 0.92} ${m1[1] + 26} 0 ${y0 + 12}Z`;
    let v = line(`M3 ${y0 + 3}C${m1[0]} ${m1[1] + 10} ${m2[0]} ${m2[1] + 5} ${tip[0] * 0.97} ${tip[1]}`, C.leafL, 1.8);
    for (const k of [-4, 4, 8]) v += line(`M6 ${y0 + 4}C${m1[0]} ${m1[1] + 10 + k} ${m2[0]} ${m2[1] + 5 + k * 0.6} ${tip[0] * 0.9} ${tip[1] + 2}`, C.leafD, 0.8, 'opacity:0.45');
    return shape(d, C.leaf, 2.5) + v;
  };
  const b = lf(-208, 1, 86, 58, 0.1) + lf(-164, -1, 118, 76, 0.05) + lf(-120, 1, 134, 84, 0) + lf(-70, -1, 142, 78, -0.1) + lf(-30, 1, 140, 60, -0.3);
  const stem = shape('M-9 2C-8 -80 -6 -180 -4 -262L4 -262C6 -180 8 -80 9 2Z', C.stem) + line('M-3 0L-1 -258', C.stemL, 2, 'opacity:0.7') + [-46, -100, -154, -206].map((yy) => line(`M${-8 + yy / -60} ${yy}C-3 ${yy + 4} 3 ${yy + 4} ${8 - yy / -60} ${yy}`, C.leafD, 2.2)).join('');
  const branch = (dy, a, len, bend) => { let g = line(`M0 0C${bend * 0.2} ${-len * 0.5} ${bend * 0.5} ${-len * 0.8} ${bend} ${-len}`, C.yelD, 3); for (let i = 1; i < 11; i++) { const u = i / 10, px = bend * u * u, py = -len * u; g += `<g transform="translate(${n1(px)} ${n1(py)}) rotate(${i % 2 ? 44 : -44})">${shape('M0 0C-3 -3 -3 -9 0 -12C3 -9 3 -3 0 0Z', i % 3 ? C.yel : C.yelL, 1.4)}</g>`; } return `<g transform="translate(0 ${-258 + dy}) rotate(${a})">${g}</g>`; };
  const tassel = branch(0, 0, 66, 4) + branch(4, -16, 62, -8) + branch(4, 16, 62, 8) + branch(9, -34, 58, -14) + branch(9, 34, 58, 14) + branch(15, -56, 50, -18) + branch(15, 56, 50, 18);
  let silks = '';
  for (let i = 0; i < 16; i++) { const e = -46 - i * 3.4, f = -108 + i * 5; silks += line(`M-13 -124C${-22 - i} ${-150 + i} ${e + 12} ${-130 + i * 2} ${e} ${f}`, i % 3 ? C.yel : C.tuber, 1.7); }
  let kern = ''; for (let r = 0; r < 9; r++) for (let c = 0; c < 3; c++) kern += dot(-12 + c * 5.5 + r * 0.3, -70 - r * 6, 2.9, C.yel, 1.1);
  const cob = silks + shape('M-1 -56C-26 -68 -32 -106 -14 -126C-2 -112 8 -82 -1 -56Z', C.leafL, 2.5) + kern
    + shape('M0 -54C-8 -64 -12 -84 -4 -112C8 -98 12 -72 0 -54Z', C.leaf, 2.2) + line('M-2 -60C-5 -74 -5 -90 -3 -102', C.leafD, 1, 'opacity:0.6') + shape('M4 -52C-14 -56 -26 -74 -24 -96C-14 -82 -6 -68 4 -52Z', C.leaf, 2.2);
  return G(x, y, s, o, `<g style="${o.leafPart ?? ''}">${b}</g>` + stem + `<g style="${o.tasselPart ?? ''}">${tassel}</g><g style="${o.cobPart ?? ''}">${cob}</g>`);
}
export function wheatEar(x, y, s, o = {}) {
  let e = line('M0 0C2 -60 2 -110 0 -150', C.stemL, 5);
  for (let i = 0; i < 7; i++) {
    const yy = -112 - i * 12;
    for (const d of [-1, 1]) e += shape(`M0 ${yy}C${d * 12} ${yy - 2} ${d * 16} ${yy - 14} ${d * 8} ${yy - 22}C${d * 2} ${yy - 16} 0 ${yy - 8} 0 ${yy}Z`, C.yel, 2) + line(`M${d * 9} ${yy - 20}L${d * 22} ${yy - 52}`, C.yelD, 2);
  }
  return G(x, y, s, o, e);
}
export function sunflower(x, y, s, o = {}) {
  let p = '';
  for (let i = 0; i < 22; i++) { const a = i * 16.4; p += `<g transform="rotate(${a})">${shape('M-9 -36C-15 -56 -7 -74 0 -82C7 -74 15 -56 9 -36Z', i % 2 ? C.yel : C.yelD, 1.6)}${line('M0 -40L0 -72', C.yelD, 0.8, 'opacity:0.6')}</g>`; }
  let d = dot(0, 0, 40, C.woodD, 3);
  for (let i = 0; i < 210; i++) { const r = 2.1 * Math.sqrt(i), a = i * 2.4; d += dotF(r * Math.cos(a), r * Math.sin(a), 1.25, i < 30 ? C.leafL : i % 3 ? C.bark : C.yel); }
  const lf = (yy, dir) => { let e = `M0 ${yy}C${dir * 10} ${yy - 34} ${dir * 34} ${yy - 46} ${dir * 50} ${yy - 40}`; for (let i = 1; i <= 6; i++) e += `L${dir * (50 + i * 8)} ${yy - 40 + i * 5 - (i % 2 ? 4 : 0)}`; e += `C${dir * 74} ${yy + 12} ${dir * 30} ${yy + 22} 0 ${yy}Z`; let v = line(`M${dir * 4} ${yy - 1}C${dir * 34} ${yy - 12} ${dir * 62} ${yy - 12} ${dir * 94} ${yy - 12}`, C.leafD, 1.8); for (let i = 1; i < 6; i++) { const u = i * 15; v += line(`M${dir * u} ${yy - 6 - i}L${dir * (u + 12)} ${yy - 34 + i * 2}M${dir * u} ${yy - 6 - i}L${dir * (u + 10)} ${yy + 12 - i * 2}`, C.leafD, 0.9, 'opacity:0.55'); } return shape(e, C.leaf, 2.5) + v; };
  return G(x, y, s, o, shape('M-7 0C-6 -80 -6 -150 -5 -200L5 -200C6 -150 6 -80 7 0Z', C.stem) + lf(-50, 1) + lf(-96, -1) + `<g transform="translate(0 -208)">${p}${d}</g>`);
}
export function hibiscus(x, y, s, o = {}) {
  let p = '';
  for (let i = 0; i < 5; i++) p += `<g transform="rotate(${i * 72})">${shape('M0 0C-34 -14 -42 -58 -16 -72C-4 -80 14 -78 22 -66C38 -46 20 -12 0 0Z', i % 2 ? C.red : P(B('magma', 'strata3', 0.04)), 2.5)}${line('M0 -8C-6 -28 -6 -48 -2 -66', C.redD, 2.5, 'opacity:0.7')}</g>`;
  const col = line('M0 0C10 -12 28 -30 56 -44', C.yelL, 6) + [[26, -30], [36, -36], [44, -40], [50, -36], [40, -42], [32, -28]].map(([a, b]) => dot(a, b, 3.6, C.yel, 1.6)).join('') + [[58, -46], [62, -38], [54, -52]].map(([a, b]) => dot(a, b, 3.8, C.pink, 1.6)).join('');
  return G(x, y, s, o, p + dotF(0, 0, 11, C.redD) + col);
}
export function coralSpray(x, y, s, o = {}) {
  const claw = (a, b, r) => `<g transform="translate(${a} ${b}) rotate(${r})">${shape('M0 0C-12 -14 -14 -44 0 -64C14 -44 12 -14 0 0Z', C.red, 2.5)}${shape('M0 0C-22 -8 -30 -28 -26 -42C-12 -36 -4 -18 0 0Z', P(B('magma', 'strata3', 0.04)), 2.5)}</g>`;
  return G(x, y, s, o, shape('M-9 0C-12 -60 -7 -110 17 -160L27 -154C11 -110 10 -60 10 0Z', C.bark) + line('M-2 -6C-6 -60 0 -110 20 -150M4 -10C2 -60 6 -100 22 -140', C.barkD, 1.2, 'opacity:0.6') + shape('M-3 -64C-30 -86 -50 -110 -66 -142L-58 -146C-44 -118 -22 -96 2 -80Z', C.bark, 2) + shape('M3 -94C30 -106 54 -122 74 -150L80 -144C60 -112 34 -94 6 -84Z', C.bark, 2)
    + claw(-62, -142, -12) + claw(-46, -122, -38) + claw(72, -148, 12) + claw(52, -126, 40) + claw(24, -158, 4) + claw(10, -146, -24) + claw(36, -176, 20));
}
export function vallisneria(x, y, s, o = {}) {
  let b = '';
  for (const [dx, h, c] of [[-42, 190, 22], [-22, 240, -18], [0, 262, 14], [24, 222, -22], [46, 176, 18]]) b += shape(`M${dx - 5} 0C${dx + c - 5} ${-h * 0.4} ${dx - c - 3} ${-h * 0.7} ${dx + c * 0.6} ${-h}C${dx - c + 5} ${-h * 0.7} ${dx + c + 5} ${-h * 0.4} ${dx + 5} 0Z`, C.leaf, 2.5);
  return G(x, y, s, o, b);
}
export function tomatoFlower(x, y, s, o = {}) {
  let sep = '', p = '';
  for (const r of [-146, -74, 0 + 2, 74, 146]) sep += `<g transform="rotate(${r + 36})">${shape('M0 -6C-6 -24 -5 -46 0 -60C5 -46 6 -24 0 -6Z', C.leaf, 2)}</g>`;
  for (const r of [-146, -74, 2, 74, 146]) { let v = line('M0 -14L0 -70', C.yelD, 1.2, 'opacity:0.7'); for (const k of [-1, 1]) v += line(`M0 -22C${k * 6} -34 ${k * 7} -48 ${k * 3} -60`, C.yelD, 0.8, 'opacity:0.5'); p += `<g transform="rotate(${r})">${shape('M0 -6C-16 -22 -15 -58 0 -80C15 -58 16 -22 0 -6Z', C.yel, 2)}${v}</g>`; }
  let cone = '';
  if (o.coneCol !== 'none') { for (const [dx, k] of [[-12, 0], [12, 0], [-7, 1], [7, 1], [0, 2]]) cone += shape(`M${dx - 7} 0C${dx - 7} -30 ${dx * 0.3 - 3} -62 ${dx * 0.2} -86C${dx * 0.3 + 3} -62 ${dx + 7} -30 ${dx + 7} 0Z`, k === 2 ? C.yelL : C.yelD, 1.6); cone += line('M-3 -6L-1 -70M3 -6L1 -70', C.ink, 0.8, 'opacity:0.4') + flat(pathEllipse(0, -92, 3.4, 3), P('leafLit')); }
  return G(x, y, s, o, shape('M-6 0C-5 22 -5 44 -7 70L7 70C5 44 5 22 6 0Z', C.stem, 2) + sep + p + `<g style="${o.conePart ?? ''}">${cone}</g>`
    + shape(pathEllipse(0, 2, 17, 13), o.ovaryCol ?? C.leafL, 2) + flat(pathEllipse(-5, -2, 5, 3), PALE, 'opacity:0.5'));
}
/** Tomato leaf: toothed lobes on a midrib, base at origin, points right. */
export function tomatoLeaf(x, y, s, o = {}) {
  const lob = (cx, cy, r, a) => `<g transform="translate(${cx} ${cy}) rotate(${a})">${shape(`M0 0C${-r * 0.5} ${-r * 0.3} ${-r * 0.5} ${-r * 0.8} 0 ${-r}L${r * 0.12} ${-r * 0.74}L${r * 0.36} ${-r * 0.8}L${r * 0.3} ${-r * 0.46}L${r * 0.46} ${-r * 0.3}Z`, C.leaf, 1.8)}</g>`;
  return G(x, y, s, o, line('M0 0C30 -4 70 -6 112 -2', C.stem, 3.5) + lob(30, -3, 40, -24) + lob(30, -3, 40, 148) + lob(66, -4, 36, -14) + lob(66, -4, 36, 158) + lob(106, -2, 34, 74));
}
export function tomatoFruit(x, y, s, o = {}) {
  const r = o.r ?? 70;
  if (!o.cut) return G(x, y, s, o, shape(pathEllipse(0, 0, r * 1.08, r * 0.94), C.tomato) + flat(pathEllipse(-r * 0.36, -r * 0.38, r * 0.2, r * 0.13), PALE, 'opacity:0.6')
    + shape(`M0 ${-r * 0.92}C-12 ${-r * 1.0} -22 ${-r * 1.0} -30 ${-r * 0.94}C-20 ${-r * 1.14} 20 ${-r * 1.14} 30 ${-r * 0.94}C22 ${-r} 12 ${-r} 0 ${-r * 0.92}Z`, C.leaf, 2.5));
  let b = shape(pathEllipse(0, 0, r * 1.08, r * 0.94), C.tomatoD, 3) + flat(pathEllipse(0, 0, r * 1.0, r * 0.86), C.tomatoIn);
  const lob = (sx) => flat(`M${sx * r * 0.09} ${-r * 0.56}C${sx * r * 0.74} ${-r * 0.66} ${sx * r * 0.88} ${r * 0.56} ${sx * r * 0.09} ${r * 0.58}C${sx * r * 0.22} ${r * 0.2} ${sx * r * 0.22} ${-r * 0.2} ${sx * r * 0.09} ${-r * 0.56}Z`, C.jelly);
  b += `<g style="${o.wall ?? ''}">${lob(-1)}${lob(1)}</g>` + line(`M0 ${-r * 0.56}L0 ${r * 0.58}`, PALE, 3, 'opacity:0.4') + [[-0.7, -0.4], [0.7, -0.4], [-0.78, 0.2], [0.78, 0.2]].map(([u, v]) => line(`M${u * r} ${v * r}L${u * 0.86 * r} ${v * 1.1 * r}`, PALE, 1.4, 'opacity:0.5')).join('');
  const seeds = [[-0.26, -0.3], [-0.46, -0.1], [-0.5, 0.14], [-0.3, 0.32], [0.26, -0.3], [0.46, -0.1], [0.5, 0.14], [0.3, 0.32]];
  b += `<g style="${o.seedPart ?? ''}">` + seeds.map(([a, c], i) => `<g transform="translate(${n1(a * r)} ${n1(c * r)}) rotate(${(i * 57) % 80 - 40})">${shape(pathEllipse(0, 0, 8.5, 5), C.seed, 2)}</g>`).join('') + '</g>';
  return G(x, y, s, o, b);
}
export function papayaTree(x, y, s, o = {}) {
  // Big round leaves cut into seven blunt lobes, each lobe notched again, only at the top of a bare stem. Each hangs on a long
  // pale hollow stalk that leaves the stem top and arches out, so sky shows between the leaves. Older leaves sit low and droop.
  const smooth = (p) => { const m = p.length; let d = `M${n1(p[0][0])} ${n1(p[0][1])}`; for (let i = 0; i < m; i++) { const [a, b, c, e] = [p[(i + m - 1) % m], p[i], p[(i + 1) % m], p[(i + 2) % m]]; d += `C${n1(b[0] + (c[0] - a[0]) / 6)} ${n1(b[1] + (c[1] - a[1]) / 6)} ${n1(c[0] - (e[0] - b[0]) / 6)} ${n1(c[1] - (e[1] - b[1]) / 6)} ${n1(c[0])} ${n1(c[1])}`; } return `${d}Z`; };
  const blade = (l, col, rib) => {
    const ang = [-120, -80, -40, 0, 40, 80, 120], len = [0.76, 0.9, 0.98, 1, 0.98, 0.9, 0.76], at = (dg, q) => { const t = (dg * Math.PI) / 180; return [Math.sin(t) * q, -Math.cos(t) * q]; }, pts = [[0, l * 0.16]];
    ang.forEach((d, i) => { const r = l * len[i]; pts.push(at(d - 19, l * 0.4), at(d - 17, r * 0.72), at(d - 11, r * 0.88), at(d - 6, r * 0.8), at(d, r), at(d + 6, r * 0.8), at(d + 11, r * 0.88), at(d + 17, r * 0.72), at(d + 19, l * 0.4)); });
    let v = '';
    ang.forEach((q, i) => { const e = l * len[i] * 0.9, [a, b] = at(q, e); v += line(`M0 0L${n1(a)} ${n1(b)}`, rib, 1.5, 'opacity:0.85'); for (const u of [-11, 11]) { const [c, d] = at(q, e * 0.46), [g, h] = at(q + u, e * 0.76); v += line(`M${n1(c)} ${n1(d)}L${n1(g)} ${n1(h)}`, rib, 0.9, 'opacity:0.6'); } });
    return shape(smooth(pts), col, 1.6) + v;
  };
  const leaf = (y0, a, st, l, col, rib, squash) => {
    const r = (a * Math.PI) / 180, ex = Math.sin(r) * st, ey = y0 - Math.cos(r) * st * 0.92, c = `M${Math.sign(a || 1) * 3} ${y0}Q${n1(ex * 0.34)} ${n1(ey - Math.abs(ex) * 0.14 - 8)} ${n1(ex)} ${n1(ey)}`;
    return line(c, C.stem, 5.6) + line(c, C.stemL, 3) + `<g transform="translate(${n1(ex)} ${n1(ey)}) rotate(${n1(a * 1.08)}) scale(1 ${squash})">${blade(l, col, rib)}</g>`;
  };
  let c = '';
  const old = C.leafD, mid = C.leaf, young = C.leafL;
  for (const a of [-114, 114]) c += leaf(-190, a, 60, 54, old, mid, 0.8);
  for (const a of [-74, 74]) c += leaf(-198, a, 66, 60, old, mid, 0.86);
  for (const a of [-36, 36]) c += leaf(-204, a, 72, 58, mid, young, 0.9);
  c += leaf(-208, 0, 52, 42, young, C.pale, 0.9);
  const trunk = P(B('barkLit', 'cloud', 0.42));
  let scars = '';
  for (let r = 0, rows = 13 + Math.round((o.extra ?? 0) / 13.6); r < rows; r++) { const v = -14 - r * 13.6, w = 9 - r * 0.2; for (const u of r % 2 ? [-0.5, 0.5] : [-0.8, 0, 0.8]) scars += line(`M${n1(u * w - 3)} ${n1(v)}q3 4 6 0`, C.barkD, 1.5, 'opacity:0.5'); }
  const up = o.extra ?? 0, top = -206 - up;
  const stem = shape(`M-13 2C-10 ${n1(top * 0.34)} -8 ${n1(top * 0.68)} -6 ${top}L6 ${top}C8 ${n1(top * 0.68)} 10 ${n1(top * 0.34)} 13 2Z`, trunk, 2.4) + scars + line(`M-5 -6C-4 ${n1(top * 0.34)} -3 ${n1(top * 0.68)} -2 ${top + 6}`, C.pale, 2.2, 'opacity:0.4');
  const fruit = (a, b, q = 1) => shape(`M${a} ${b}C${a - 6 * q} ${b + 2} ${a - 15 * q} ${b + 18 * q} ${a - 12 * q} ${b + 34 * q}C${a - 9 * q} ${b + 46 * q} ${a + 9 * q} ${b + 46 * q} ${a + 12 * q} ${b + 34 * q}C${a + 15 * q} ${b + 18 * q} ${a + 6 * q} ${b + 2} ${a} ${b}Z`, C.leafL, 2) + line(`M${n1(a - 5 * q)} ${n1(b + 12 * q)}C${n1(a - 8 * q)} ${n1(b + 20 * q)} ${n1(a - 7 * q)} ${n1(b + 30 * q)} ${n1(a - 5 * q)} ${n1(b + 36 * q)}`, C.pale, 1.8, 'opacity:0.5');
  const star = (a, b, r) => [0, 72, 144, 216, 288].map((d) => { const t = (d * Math.PI) / 180; return shape(pathEllipse(a + Math.cos(t) * r * 0.7, b + Math.sin(t) * r * 0.7, r * 0.56, r * 0.56), C.silk, 1); }).join('') + dot(a, b, r * 0.34, C.yel, 1);
  const panicle = (d) => { let m = line(`M${d * 6} -182C${d * 22} -176 ${d * 30} -150 ${d * 32} -92`, C.stemL, 2.2); for (let i = 0; i < 8; i++) { const v = i / 7, py = -170 + v * 80, px = d * (16 + v * 16) + (i % 2 ? d * 7 : -d * 6); m += line(`M${n1(d * (17 + v * 15))} ${n1(py)}L${n1(px)} ${n1(py + 5)}`, C.stemL, 1.3) + star(px, py + 7, 4.2); } return m; };
  const male = o.flowers === 'male' ? panicle(-1) + panicle(1) : '';
  const female = o.flowers === 'female' ? star(-13, -166, 8.5) + star(14, -160, 8) : '';
  return G(x, y, s, o, stem + `<g transform="translate(0 ${-up})">${c + (o.fruit ? fruit(-13, -190, 0.92) + fruit(14, -188, 0.92) + fruit(0, -174, 1.04) : '') + male + female}</g>`);
}
export function appleTree(x, y, s, o = {}) {
  const r = rnd(o.seed ?? 3), crown = [];
  // many leaf clusters on spreading boughs, an open uneven crown
  const boughs = [[-74, -112], [-52, -146], [-20, -170], [18, -176], [52, -150], [78, -116], [-92, -128], [92, -134], [-36, -124], [36, -130], [0, -146]];
  const trunk = shape('M-11 0C-9 -22 -12 -44 -16 -62C-30 -82 -48 -98 -66 -110L-60 -116C-44 -106 -28 -92 -12 -78C-10 -100 -14 -128 -18 -152L-10 -154C-6 -130 -2 -106 0 -86C8 -112 22 -136 40 -152L46 -146C30 -128 16 -104 12 -80C30 -92 48 -102 70 -110L74 -103C48 -92 26 -78 12 -58C8 -40 10 -20 12 0Z', C.bark, 2.5)
    + line('M-5 -2C-4 -26 -6 -46 -8 -60M3 -4C2 -28 4 -46 6 -62', C.barkD, 1.1, 'opacity:0.6');
  const cluster = (cx, cy, R, tone) => { let g = shape(`M${n1(cx - R)} ${n1(cy + R * 0.3)}C${n1(cx - R * 1.2)} ${n1(cy - R * 0.5)} ${n1(cx - R * 0.5)} ${n1(cy - R * 1.1)} ${n1(cx)} ${n1(cy - R * 0.9)}C${n1(cx + R * 0.7)} ${n1(cy - R * 1.2)} ${n1(cx + R * 1.3)} ${n1(cy - R * 0.3)} ${n1(cx + R)} ${n1(cy + R * 0.4)}C${n1(cx + R * 0.5)} ${n1(cy + R * 0.9)} ${n1(cx - R * 0.6)} ${n1(cy + R * 0.9)} ${n1(cx - R)} ${n1(cy + R * 0.3)}Z`, tone, 1.6); for (let i = 0; i < 9; i++) { const a = r() * 6.28, q = r() * R * 0.8, px = cx + Math.cos(a) * q, py = cy + Math.sin(a) * q * 0.8; g += `<path d="M${n1(px)} ${n1(py)}q3 -4 7 -3q-1 4 -7 3Z" ${fill(i % 2 ? C.leafL : C.leafD, 'opacity:0.75')}/>`; } return g; };
  const order = boughs.map((b, i) => [b, i]).sort((p, q) => p[0][1] - q[0][1]);
  for (const [[cx, cy], i] of order) crown.push(cluster(cx + (r() - 0.5) * 8, cy + (r() - 0.5) * 8, 22 + r() * 10, i % 3 === 0 ? C.leafD : C.leaf));
  const pts = [];
  for (let i = 0; i < (o.fruit ?? 0); i++) { const c = boughs[i % boughs.length]; pts.push([c[0] + (r() - 0.5) * 34, c[1] + 10 + r() * 16]); }
  const f = pts.map(([a, b]) => line(`M${n1(a)} ${n1(b - 7)}l1 -4`, C.bark, 1.4) + dot(a, b, 7, C.tomato, 2) + dotF(a - 2.4, b - 2.6, 1.8, PALE)).join('');
  return G(x, y, s, o, trunk + crown.join('') + f);
}
export function beeHive(x, y, s, o = {}) {
  return G(x, y, s, o, line('M-26 0L-22 -18M26 0L22 -18', C.woodD, 6) + shape('M-42 -18L42 -18L42 -52L-42 -52Z', C.wood) + shape('M-40 -52L40 -52L40 -82L-40 -82Z', C.wood) + shape('M-48 -82L48 -82L52 -92L-52 -92Z', C.woodD) + line('M-42 -52L42 -52', C.woodD, 3) + flat('M-14 -24L14 -24L14 -19L-14 -19Z', C.ink));
}
export function bee(x, y, s, o = {}) {
  const wing = (d, veins) => `<path d="${d}" style="fill:${C.silk};fill-opacity:0.5;stroke:${rimOf(C.bark)};stroke-width:0.9"/>` + line(veins, C.bark, 0.7, 'opacity:0.55');
  const wings = wing('M6 -12C0 -32 -14 -42 -30 -38C-34 -28 -18 -14 6 -12Z', 'M4 -14C-6 -26 -16 -34 -28 -36M-4 -22L-18 -24') + wing('M10 -12C10 -26 2 -34 -8 -32C-12 -24 -4 -14 10 -12Z', 'M8 -14C4 -22 0 -28 -6 -31');
  let hair = ''; for (let i = 0; i < 70; i++) { const a2 = i * 2.4, r = 2 + Math.sqrt(i) * 1.65, px = 12 + Math.cos(a2) * r * 1.1, py = -1 + Math.sin(a2) * r; hair += line(`M${n1(px)} ${n1(py)}l${n1(-1.6)} ${n1(2.4)}`, i % 3 ? C.yelL : C.yelD, 0.8); }
  const legs = line('M18 8C20 16 26 20 22 28M10 9C8 18 12 24 6 32M2 8C-4 16 -8 18 -10 30', C.ink, 1.9) + `<ellipse cx="-7" cy="24" rx="4.6" ry="6" style="fill:${C.yel};stroke:${rimOf(C.yel)};stroke-width:1"/>`;
  const abd = shape('M2 -12C-14 -18 -32 -13 -36 0C-32 13 -14 18 2 12Z', C.bee, 2) + [[-7, 15], [-17, 15], [-27, 11]].map(([u, h]) => `<path d="M${u} ${-h}C${u - 3} ${-h * 0.4} ${u - 3} ${h * 0.4} ${u} ${h}L${u - 5} ${h - 1}C${u - 8} ${h * 0.4} ${u - 8} ${-h * 0.4} ${u - 5} ${-h + 1}Z" ${fill(C.ink, 'opacity:0.85')}/>`).join('');
  const thorax = shape(pathEllipse(12, -1, 15, 13.5), C.yelD, 2) + hair;
  const head = shape(pathEllipse(31, 0, 9.5, 10.5), C.ink, 1.6) + shape(pathEllipse(33, -3, 4.2, 6), C.bark, 1) + line('M33 -9C38 -18 43 -20 48 -19M36 -8C42 -14 46 -14 50 -12', C.ink, 1.3) + line('M38 6C41 10 41 13 39 15', C.ink, 1.3);
  return G(x, y, s, o, legs + abd + thorax + head + wings);
}
export function butterfly(x, y, s, o = {}) {
  const hw = o.tint ?? C.yelD;
  const wing = shape('M2 -2C14 -38 50 -48 62 -30C68 -10 40 8 2 6Z', hw) + shape('M2 6C26 8 48 18 42 36C32 50 8 36 2 12Z', o.tint2 ?? C.red) + dotF(42, -24, 4.5, PALE) + dotF(50, -14, 3.5, PALE) + dotF(28, 28, 3.5, PALE);
  return G(x, y, s, o, wing + mirror(wing) + shape(pathEllipse(0, 2, 4, 20), C.ink, 1.5) + line('M-1 -16C-4 -26 -8 -30 -13 -32M1 -16C4 -26 8 -30 13 -32', C.ink, 2));
}
const feathers = (pts, col, w = 1) => pts.map(([a, b, c, d]) => line(`M${a} ${b}Q${(a + c) / 2 + 2} ${(b + d) / 2 + 3} ${c} ${d}`, col, w, 'opacity:0.6')).join('');
export function sunbird(x, y, s, o = {}) {
  const sheen = P(B('budPurple', 'seaDeep', 0.42)), teal = P(B('seaShallow', 'budPurple', 0.35));
  const tail = shape('M-34 6L-92 34L-86 22L-100 26L-82 12L-96 10L-38 -6Z', sheen, 2);
  const belly = shape('M-40 4C-30 -18 4 -24 24 -12C30 6 14 28 -10 28C-26 28 -36 18 -40 4Z', C.yel, 2) + feathers([[-24, 12, -8, 22], [-14, 8, 2, 18], [-4, 4, 12, 12]], C.yelD);
  const wing = shape('M-38 2C-26 -18 -2 -22 12 -14C4 2 -18 16 -44 14Z', sheen, 2) + feathers([[-30, 6, -8, -10], [-30, 10, -2, -4], [-34, 12, 2, 0]], teal, 1.5) ;
  const head = shape('M12 -16C14 -32 34 -38 42 -24C44 -14 36 -6 24 -4C16 -4 12 -8 12 -16Z', sheen, 2) + flat('M18 -26C24 -32 34 -32 38 -26C30 -28 24 -26 20 -22Z', teal, 'opacity:0.9') + flat('M16 -10C22 -14 30 -14 36 -12C32 -6 22 -4 16 -10Z', C.red, 'opacity:0.85');
  const bill = shape('M40 -26C58 -30 78 -18 90 4C74 -12 58 -20 40 -20Z', C.ink, 1.2);
  return G(x, y, s, o, tail + belly + wing + head + bill + dotF(32, -24, 2.8, PALE) + dotF(32.5, -24, 1.6, INK) + line('M-10 28L-14 42L-20 44M-10 42L-8 46M2 26L0 40L-6 42', C.ink, 1.8));
}
export function whiteEye(x, y, s, o = {}) {
  const ol = P(B('leafLit', 'gold', 0.3));
  return G(x, y, s, o, shape('M-26 6L-66 20L-60 10L-70 8L-30 -6Z', C.leafD, 2) + shape('M-32 4C-24 -18 10 -24 24 -14C28 6 10 22 -8 22C-22 22 -30 14 -32 4Z', C.yel, 2) + shape('M-32 2C-22 -16 2 -20 14 -14C6 0 -14 12 -34 10Z', ol, 2) + feathers([[-26, 6, -6, -8], [-22, 8, 0, -4]], C.leafD, 1.3)
    + shape(pathCircle(24, -14, 13), ol, 2) + `<circle cx="27" cy="-15" r="6.4" ${fill(PALE)}/>` + dotF(27, -15, 3.6, INK) + dotF(26, -16, 1, PALE) + shape('M36 -17L48 -13L36 -9Z', C.ink, 1) + line('M-6 22L-8 34L-14 36M6 20L4 34L-2 36', C.ink, 1.8));
}
export function tuft(x, y, s, o = {}) {
  let h = '';
  for (let i = 0; i < 15; i++) { const a = -70 + i * 10, l = 54 + (i % 3) * 8; h += `<g transform="rotate(${a})">${line(`M0 0C${(i % 2 ? 3 : -3)} ${-l * 0.5} ${(i % 2 ? -3 : 3)} ${-l * 0.8} 0 ${-l}`, C.silk, 2.5)}</g>`; }
  return G(x, y, s, o, h + shape('M-6 2C-8 12 -4 24 0 28C4 24 8 12 6 2C2 -2 -2 -2 -6 2Z', C.bark, 2.5));
}
export function dandelionSeed(x, y, s, o = {}) {
  let h = '';
  for (let i = 0; i < 9; i++) { const a = -60 + i * 15; h += `<g transform="translate(0 -40) rotate(${a})">${line('M0 0L0 -16', C.silk, 2.2)}</g>`; }
  return G(x, y, s, o, line('M0 0L0 -40', C.woodD, 2.5) + h + shape('M-3 0C-4 8 -2 14 0 16C2 14 4 8 3 0Z', C.bark, 2));
}
export function dandelion(x, y, s, o = {}) {
  let h = '';
  for (let i = 0; i < 26; i++) { const a = i * 360 / 26; h += `<g transform="rotate(${a})">${line('M0 -8L0 -50', C.silk, 2)}${dotF(0, -52, 2.6, PALE)}</g>`; }
  return G(x, y, s, o, line('M0 0C3 -40 -2 -80 0 -116', C.stem, 6) + `<g transform="translate(0 -122)">${h}${dot(0, 0, 8, C.woodD, 2)}</g>`);
}
/** A grain that travels along path d once and rests at its end. Motion is SMIL, so a repaint replays it and it always ends in the same place. */
export function travel(d, s = 0.8, dur = 1.3) {
  return `<g>${pollenGrain(0, 0, s, {})}<animateMotion dur="${dur}s" path="${d}" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.3 1"/></g>`;
}
export function pollenGrain(x, y, s, o = {}) {
  let sp = '';
  if (o.spiny) for (let i = 0; i < 12; i++) sp += `<g transform="rotate(${i * 30})">${line('M0 -10L0 -15', C.yelD, 2.5)}</g>`;
  return G(x, y, s, o, sp + dot(0, 0, 10, o.col ?? C.yel, 2.2));
}
export function seedling(x, y, s, o = {}) {
  const g = Math.max(0, Math.min(1, o.grow ?? 1)), h = 70 * g;
  let b = shape(pathEllipse(0, 6, 13, 8), C.seed, 2.5) + line(`M0 8C-4 18 2 26 -2 ${10 + 26 * g}M0 8C6 16 6 20 10 ${10 + 18 * g}`, C.pale, 3);
  if (g > 0.05) b += line(`M0 2C-2 ${-h * 0.4} 2 ${-h * 0.7} 0 ${-h}`, C.stem, 5);
  if (g > 0.3) b += `<g transform="translate(0 ${-h})">${shape('M0 0C-8 -18 -34 -24 -46 -10C-34 6 -12 8 0 0Z', C.leaf, 2.5)}${shape('M0 0C8 -18 34 -24 46 -10C34 6 12 8 0 0Z', C.leafL, 2.5)}</g>`;
  return G(x, y, s, o, b);
}
export function caterpillar(x, y, s, o = {}) {
  let b = '';
  const n = 11;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), cx = -62 + u * 118, cy = Math.sin(u * 7) * 4, R = 9 + Math.sin(u * 3.14) * 4.5;
    if (i > 2 && i < 9 && i % 1 === 0) b += line(`M${n1(cx)} ${n1(cy + R - 1)}l0 ${i % 3 === 0 ? 6 : 4}`, C.leafD, i % 3 === 0 ? 3 : 2.2);
    b += shape(pathEllipse(cx, cy, R * 0.86, R), i % 2 ? C.leafL : C.yel, 1.5) + flat(pathEllipse(cx, cy - R * 0.5, R * 0.5, R * 0.16), C.ink, 'opacity:0.75') + dotF(cx, cy + R * 0.2, 1.5, C.yelL);
  }
  return G(x, y, s, o, b + shape(pathEllipse(64, Math.sin(7) * 4 - 2, 9, 10), C.yelD, 1.6) + line('M66 -10L70 -20M60 -10L60 -20', C.ink, 1.6) + line('M-64 -8L-72 -18', C.ink, 1.6));
}
export function pupa(x, y, s, o = {}) {
  return G(x, y, s, o, line('M0 -40L0 -22', C.woodD, 3) + shape('M0 -24C-18 -18 -18 14 -6 32L0 42L6 32C18 14 18 -18 0 -24Z', C.leafL) + line('M-12 -4C-4 0 4 0 12 -4M-11 10C-4 14 4 14 11 10M-6 24C-2 26 2 26 6 24', C.leafD, 2.5));
}
export function lizard(x, y, s, o = {}) {
  const col = P('leaf'), d = P('leafDark');
  return G(x, y, s, o, shape('M-34 6C-70 12 -96 6 -118 -10C-94 -2 -66 -8 -36 -10Z', col, 2.5) + shape('M-40 -8C-20 -24 26 -26 46 -14C62 -18 76 -12 80 -4C76 6 60 8 46 6C24 16 -22 16 -40 -8Z', col) + flat(pathEllipse(-4, -4, 26, 6), P('leafLit'), 'opacity:0.8')
    + line('M-20 8C-26 18 -36 20 -42 20M22 8C28 18 38 20 46 22M-16 -14C-24 -24 -34 -24 -40 -26M26 -18C32 -28 42 -28 48 -30', d, 5) + dotF(66, -8, 2.6, INK));
}
export function chick(x, y, s, o = {}) {
  let down = ''; for (let i = 0; i < 40; i++) { const a = i * 2.4, r = 3 + Math.sqrt(i) * 3.4; down += line(`M${n1(-2 + Math.cos(a) * r * 1.1)} ${n1(6 + Math.sin(a) * r)}l${n1(-3)} ${n1(4)}`, i % 3 ? C.yelL : C.yelD, 1, 'opacity:0.8'); }
  const foot = (u) => line(`M${u} 26L${u} 40M${u} 40L${u + 9} 44M${u} 40L${u - 7} 44M${u} 40L${u + 2} 46`, C.yelD, 2.6);
  return G(x, y, s, o, foot(-8) + foot(9) + shape('M-30 6C-32 -18 -12 -28 8 -26C28 -22 34 2 22 18C10 32 -24 30 -30 6Z', C.yel, 2) + down
    + shape('M-20 2C-34 -2 -40 10 -36 20C-26 22 -14 16 -10 8Z', C.yelD, 1.8) + line('M-32 12L-20 8M-30 17L-18 12', C.bark, 0.9, 'opacity:0.5')
    + shape('M2 -22C4 -44 34 -48 40 -28C42 -14 30 -8 18 -8C8 -8 2 -14 2 -22Z', C.yel, 2) + line('M12 -44L8 -52M18 -46L18 -54M24 -44L28 -52', C.yelD, 1.6)
    + shape('M38 -32L54 -28L38 -22Z', P('tuber'), 1.2) + dotF(29, -32, 3, INK) + dotF(28, -33, 1, PALE));
}
export function frogSide(x, y, s, o = {}) {
  const col = P('leaf'), d = P('leafDark'), l = P('leafLit');
  const toes = (u, v) => line(`M${u} ${v}l-10 3M${u} ${v}l-11 -2M${u} ${v}l-7 7`, d, 2.2);
  let sp = ''; for (const [u, v, r] of [[-20, -8, 4], [-6, -14, 3], [-30, 4, 3], [4, -4, 2.6]]) sp += flat(pathEllipse(u, v, r * 1.3, r), d, 'opacity:0.7');
  return G(x, y, s, o, toes(-46, 34) + shape('M-40 18C-66 8 -76 26 -62 34L-20 36C-30 32 -36 26 -40 18Z', d, 2)
    + shape('M-44 20C-58 -6 -36 -28 -6 -30C10 -46 38 -42 46 -24C56 -14 52 2 40 8C26 26 -24 34 -44 20Z', col, 2.4) + sp
    + flat('M-30 18C-10 24 18 20 36 6C42 14 20 26 -6 28C-18 28 -26 24 -30 18Z', C.yelL, 'opacity:0.85')
    + shape('M-34 2C-46 16 -40 30 -22 30C-10 28 -8 18 -14 8Z', col, 2) + shape('M18 8C24 18 26 26 22 34L12 34C14 24 12 16 10 12Z', col, 2) + toes(16, 34)
    + shape(pathCircle(22, -30, 9), l, 2) + dotF(23, -30, 5.4, C.yelL) + dotF(24, -30, 3.2, INK) + line('M30 -8C38 -8 46 -12 50 -16', d, 1.6));
}
export function fishSide(x, y, s, o = {}) {
  const col = o.tint ?? C.yelD;
  let sc = ''; for (let c = 0; c < 7; c++) for (let r = 0; r < 4; r++) sc += line(`M${-34 + c * 12 + (r % 2) * 6} ${-15 + r * 8}a5 5 0 0 1 0 8`, C.ink, 0.7, 'opacity:0.3');
  return G(x, y, s, o, shape('M-54 -2C-68 -12 -80 -24 -88 -24C-84 -10 -84 8 -88 22C-78 22 -66 10 -54 2Z', col, 2) + line('M-58 0L-80 -14M-58 0L-80 0M-58 0L-80 12', C.ink, 0.9, 'opacity:0.4')
    + shape('M-14 -24C-4 -42 22 -40 32 -24Z', col, 2) + shape('M-6 22C0 34 14 34 18 22Z', col, 1.8)
    + shape('M-62 0C-36 -32 34 -36 70 -2C36 30 -34 30 -62 0Z', col, 2.2) + flat('M-44 12C-16 26 28 24 58 6C34 16 -12 18 -44 12Z', C.yelL, 'opacity:0.7') + sc
    + line('M34 -22C42 -10 42 8 34 20', C.ink, 1.2, 'opacity:0.55') + shape('M16 2C8 -6 8 8 14 14C20 12 22 8 16 2Z', col, 1.4) + dotF(50, -8, 4.4, PALE) + dotF(51, -8, 2.6, INK));
}
export function tadpole(x, y, s, o = {}) {
  return G(x, y, s, o, shape('M-10 0C-34 -8 -56 -6 -72 2C-54 8 -34 10 -10 6Z', P('leafDark'), 2.2) + shape(pathEllipse(6, 2, 20, 15), P('leafDark'), 2.5) + dotF(16, -3, 2.6, PALE));
}
export function eggYolk(x, y, s, o = {}) {
  // An egg in section: shell, a clear rim of white, and a rounded yolk that shades to its low side with a small highlight.
  const r = o.r ?? 40, y0 = o.yolk ?? 0.5, q = r * Math.sqrt(y0) * 0.8, w = Math.max(1.6, Math.min(3, r / 10)), cy = n1(r * 0.3 - q * 0.2);
  const shell = `M0 ${n1(-r * 1.16)}C${n1(r * 0.62)} ${n1(-r * 1.1)} ${n1(r * 0.96)} ${n1(-r * 0.1)} ${n1(r * 0.88)} ${n1(r * 0.4)}C${n1(r * 0.76)} ${n1(r * 1.02)} ${n1(-r * 0.76)} ${n1(r * 1.02)} ${n1(-r * 0.88)} ${n1(r * 0.4)}C${n1(-r * 0.96)} ${n1(-r * 0.1)} ${n1(-r * 0.62)} ${n1(-r * 1.1)} 0 ${n1(-r * 1.16)}Z`;
  const g = grad(C.yel, { li: 58, sh: 74, an: 56 });
  return G(x, y, s, o, shape(shell, P(B('cloud', 'gold', 0.22)), w) + `<path d="${shell}" transform="scale(0.86 0.88) translate(0 ${n1(r * 0.03)})" style="fill:color-mix(in oklab, var(--sim-elev-peak) 76%, ${C.yelL});opacity:0.85"/>`
    + `${g.def}<circle cx="${n1(-r * 0.04)}" cy="${cy}" r="${n1(q)}" style="fill:url(#${g.id});stroke:${C.yelD};stroke-width:${n1(Math.max(0.8, r / 28))}"/><ellipse cx="${n1(-r * 0.04 - q * 0.32)}" cy="${n1(+cy - q * 0.38)}" rx="${n1(q * 0.26)}" ry="${n1(q * 0.16)}" style="fill:var(--sim-elev-peak);opacity:0.7"/>`);
}
export function leafFlat(x, y, s, o = {}) {
  return G(x, y, s, o, shape('M-70 0C-44 -36 34 -40 74 -4C36 26 -40 30 -70 0Z', C.leaf) + line('M-66 0C-20 -8 30 -8 68 -4M-20 -6L-4 -26M10 -6L24 -24M-20 -5L-2 16M10 -6L26 12', C.leafD, 2.5));
}
