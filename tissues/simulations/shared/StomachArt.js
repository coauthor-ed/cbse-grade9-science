// StomachArt - a J-shaped stomach for the tissues module (fix round F1). Not a scene. SVG strings, tokens only, no words.
// Needs taDefs() (TissueArt) and cwDefs() (CellWorld) in the same svg. Light from the top left.
// Drawn in its own space, about 0..350 wide and -80..260 tall: the food pipe curves in from above to the fundus, the
// body sweeps down in a J, the pylorus narrows at a ring muscle into the duodenum, which turns down at the right.
// A window is cut in the front wall: at its cut edge the outer muscle band (fibres lengthwise), then the circular
// muscle band (fibres across), and inside them the lining, folded into rugae. Blood vessels run along both curves; a
// fine nerve net lies on the outer wall.
//   stomachJ(x, y, k, o)    (x, y) the origin of the stomach's space, k its scale. o.part(name) -> opacity,
//                           o.lit(name) -> true draws a light rim round that part. Parts: muscle lining nerve blood.
//                           o.window false: no window (a whole stomach).
//   STOMACH_AT              where each part is, in stomach space: muscle lining nerve blood pipe duodenum pylorus
//   stomachJOutline(x, y, k) the outer outline as an absolute path (for clips and drop targets)
import { taDefs, MUSC, MUSC_D, MUSC_L, LINE, LINE_D, LINE_L, NERVE, NERVE_D, BLOOD, BLOOD_D } from './TissueArt.js';
import { T, mx, n1, rnd } from './CellWorld.js';

const W_ = T('elev-peak'), INK = T('strata-6');
const LIN = mx(mx(LINE, 'series-6', 50), W_, 70), LIN_D = mx(LIN, INK, 62);
let U = 0;
const uid = (p) => `${p}${(U = (U + 1) % 100000)}`;
const OUT = 'M120 14C86 -22 26 -10 22 52C18 124 52 214 128 238C196 258 256 228 280 178C286 166 292 160 300 160L300 134C290 134 278 140 266 148C236 168 186 172 164 140C150 118 148 70 152 16Z';
const WIN = 'M76 136C112 124 166 160 196 182C220 196 224 206 208 216C172 230 112 228 84 206C62 188 58 150 76 136Z';
const PIPE = 'M136 22C134 -12 124 -42 100 -78';
const DUO = 'M292 147C326 147 344 168 340 206C338 226 330 244 322 260';
export const STOMACH_AT = { muscle: [40, 96], lining: [24, 214], nerve: [92, 40], blood: [236, 222], pipe: [112, -50], duodenum: [338, 214], pylorus: [296, 147] };

export function stomachJOutline(x, y, k = 1) {
  let i = 0;
  return OUT.replace(/-?\d+(\.\d+)?/g, (v) => String(n1((i++ % 2 ? y : x) + Number(v) * k)));
}

function tubeArt(d, w, col, colD, colL) {
  return `<path d="${d}" style="fill:none;stroke:${INK};stroke-width:${w + 6};stroke-linecap:round;opacity:.18;filter:url(#cw-blur3)"/>`
    + `<path d="${d}" style="fill:none;stroke:${colD};stroke-width:${w}"/><path d="${d}" style="fill:none;stroke:${col};stroke-width:${w - 5}"/>`
    + `<path d="${d}" transform="translate(-${n1(w * 0.18)} -${n1(w * 0.08)})" style="fill:none;stroke:${colL};stroke-width:${n1(w * 0.22)};opacity:.7"/>`;
}

export function stomachJ(x, y, k = 1, o = {}) {
  const P = (n) => o.part?.(n) ?? 1, L = (n) => !!o.lit?.(n), id = uid('sj');
  const rim = (d, n, w = 3) => (L(n) ? `<path d="${d}" style="fill:none;stroke:${T('gold')};stroke-width:${w + 5};opacity:.55;filter:url(#cw-blur1)"/><path d="${d}" style="fill:none;stroke:${T('gold')};stroke-width:${w}"/>` : '');
  let s = `<defs>${taDefs()}<clipPath id="${id}o"><path d="${OUT}"/></clipPath><clipPath id="${id}w"><path d="${WIN}"/></clipPath>`
    + `<radialGradient id="${id}g" cx=".3" cy=".22" r=".95"><stop offset="0" style="stop-color:${MUSC_L}"/><stop offset=".5" style="stop-color:${MUSC}"/><stop offset="1" style="stop-color:${MUSC_D}"/></radialGradient></defs>`;
  // the duodenum and the food pipe go behind the stomach's edge, so their joins are hidden
  let m = `<path d="${OUT}" transform="translate(7 12)" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/>`;
  m += tubeArt(DUO, 26, mx(MUSC, W_, 18), MUSC_D, MUSC_L) + tubeArt(PIPE, 32, mx(MUSC, W_, 18), MUSC_D, MUSC_L);
  // the pipe's own ring texture, faint
  let rings = ''; for (let i = 0; i < 6; i++) { const t = i / 6, px = 136 - t * 30 - t * t * 6, py = 18 - t * 92; rings += `M${n1(px - 12)} ${n1(py - 2)}q12 5 24 0`; }
  m += `<path d="${rings}" style="fill:none;stroke:${MUSC_D};stroke-width:1.4;opacity:.45"/>`;
  m += `<path d="${OUT}" style="fill:url(#${id}g) ${MUSC}"/>`;
  // the wall's own form: fibres follow the curve, a deeper shade on the inner curve and the underside
  let fib = '';
  for (let i = 0; i < 9; i++) { const e = i * 9; fib += `M${n1(124 - e * 0.1)} ${n1(20 + e)}C${n1(80 + e * 0.6)} ${n1(-4 + e)} ${n1(34 + e)} ${n1(10 + e * 0.6)} ${n1(32 + e)} ${n1(60 + e * 0.4)}C${n1(30 + e)} ${n1(126 - e * 0.3)} ${n1(60 + e * 0.9)} ${n1(204 - e)} ${n1(130 + e * 0.2)} ${n1(226 - e)}C${n1(196)} ${n1(242 - e)} ${n1(250 - e * 0.4)} ${n1(212 - e * 0.6)} ${n1(276)} ${n1(170 - e * 0.3)}`; }
  m += `<g clip-path="url(#${id}o)"><path d="${fib}" style="fill:none;stroke:${MUSC_D};stroke-width:1.3;opacity:.26"/><path d="${fib}" transform="translate(-1.5 -1.5)" style="fill:none;stroke:${MUSC_L};stroke-width:.9;opacity:.3"/>`
    + `<path d="M150 20C150 80 156 130 176 156C206 180 250 160 300 140" style="fill:none;stroke:${MUSC_D};stroke-width:26;opacity:.32;filter:url(#cw-blur3)"/>`
    + `<path d="M30 140C40 210 100 250 180 246C230 240 266 210 290 170" style="fill:none;stroke:${MUSC_D};stroke-width:30;opacity:.3;filter:url(#cw-blur3)"/>`
    + `<path d="${OUT}" style="fill:none;stroke:${MUSC_D};stroke-width:14;opacity:.3;filter:url(#cw-blur3)"/></g>`;
  // the pyloric ring: a thick band of muscle where the stomach narrows
  m += `<path d="M296 130C302 140 302 158 296 166" style="fill:none;stroke:${MUSC_D};stroke-width:9;stroke-linecap:round"/><path d="M296 132C300 142 300 154 296 162" style="fill:none;stroke:${MUSC_L};stroke-width:2.4;stroke-linecap:round;opacity:.8"/>`;
  m += `<path d="${OUT}" style="fill:none;stroke:${MUSC_D};stroke-width:2.6;stroke-linejoin:round"/>`;
  m += `<path d="M40 50C40 26 64 6 92 8" style="fill:none;stroke:${W_};stroke-width:7;stroke-linecap:round;opacity:.45"/><path d="M34 90C32 120 40 150 54 172" style="fill:none;stroke:${W_};stroke-width:4;stroke-linecap:round;opacity:.28"/>`;
  s += `<g opacity="${P('muscle')}">${m}${rim(OUT, 'muscle')}</g>`;
  if (o.window !== false) {
    // the window. Its cut edge shows the wall's layers: outer muscle (lengthwise fibres), circular muscle (fibres
    // across), then the lining with its folds, lying inside the muscle wall.
    const band = (sc, cxy = [142, 180]) => `translate(${n1(cxy[0] * (1 - sc))} ${n1(cxy[1] * (1 - sc))}) scale(${sc})`;
    let w = `<path d="${WIN}" style="fill:${MUSC_L}"/>`;
    let lon = ''; for (let i = 0; i < 12; i++) lon += `M${60 + i * 3} ${130 + i * 8}C${110 + i * 2} ${120 + i * 8} ${170} ${156 + i * 6} ${226} ${196 + i * 3}`;
    w += `<path d="${lon}" style="fill:none;stroke:${MUSC_D};stroke-width:1.2;opacity:.55"/>`;
    w += `<path d="${WIN}" transform="${band(0.86)}" style="fill:${MUSC};stroke:${MUSC_D};stroke-width:1.4"/>`;
    let cir = ''; for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283, cx = 142 + Math.cos(a) * 66, cy = 180 + Math.sin(a) * 36; cir += `M${n1(cx)} ${n1(cy)}L${n1(142 + Math.cos(a) * 56)} ${n1(180 + Math.sin(a) * 28)}`; }
    w += `<path d="${cir}" style="fill:none;stroke:${MUSC_D};stroke-width:1.6;opacity:.5"/>`;
    s += `<g clip-path="url(#${id}w)" opacity="${P('muscle')}">${w}</g>`;
    // the lining: deep pink, folded into rugae that run along the stomach
    let ln = `<path d="${WIN}" transform="${band(0.7)}" style="fill:${LIN};stroke:${LIN_D};stroke-width:1.6"/>`;
    let ru = '', q = rnd(7);
    for (let i = 0; i < 7; i++) { const y0 = 150 + i * 10; ru += `M${n1(78 + i * 2)} ${n1(y0 - 6)}C${n1(100)} ${n1(y0 - 14 + q() * 8)} ${n1(124)} ${n1(y0 + 2 + q() * 8)} ${n1(146)} ${n1(y0 + 6)}S${n1(184)} ${n1(y0 + 10 + q() * 8)} ${n1(212)} ${n1(y0 + 22)}`; }
    ln += `<g clip-path="url(#${id}l)"><path d="${ru}" transform="translate(1.6 2.4)" style="fill:none;stroke:${LIN_D};stroke-width:6;stroke-linecap:round;opacity:.7"/><path d="${ru}" style="fill:none;stroke:${LIN};stroke-width:4.4;stroke-linecap:round"/><path d="${ru}" transform="translate(-1 -1.4)" style="fill:none;stroke:${W_};stroke-width:1.4;stroke-linecap:round;opacity:.7"/></g>`;
    s += `<defs><clipPath id="${id}l"><path d="${WIN}" transform="${band(0.7)}"/></clipPath></defs><g opacity="${P('lining')}">${ln}${L('lining') ? rim(WIN, 'lining').replace(/<path d="/g, `<path transform="${band(0.7)}" d="`) : ''}</g>`;
    s += `<path d="${WIN}" style="fill:none;stroke:${mx(MUSC_D, INK, 60)};stroke-width:2.4;opacity:${P('muscle')}"/><path d="M80 140C112 130 160 160 192 182" style="fill:none;stroke:${W_};stroke-width:2;opacity:${0.6 * P('muscle')}"/>`;
  }
  // blood vessels along the lesser and greater curves, branches reaching over the wall
  const bv = 'M150 26C150 90 160 140 184 158C214 176 252 160 288 138M28 40C14 120 46 220 128 244C200 262 258 230 284 176';
  let tw = ''; const qb = rnd(4);
  for (let i = 0; i < 5; i++) { const a = 2.4 - i * 0.36, bx = 160 + Math.cos(a) * 138, by = 120 + Math.sin(a) * 124; tw += `M${n1(bx)} ${n1(by)}q${n1(-Math.cos(a) * 6 + (qb() - 0.5) * 10)} ${n1(-Math.sin(a) * 4)} ${n1(-Math.cos(a) * 14 + (qb() - 0.5) * 8)} ${n1(-Math.sin(a) * 14)}`; }
  for (let i = 0; i < 3; i++) { const bx = 170 + i * 30, by = 157 + i * 4; tw += `M${bx} ${by}q-6 6 -10 14`; }
  s += `<g opacity="${P('blood')}"><path d="${bv}${tw}" style="fill:none;stroke:${BLOOD_D};stroke-width:${L('blood') ? 6.4 : 5};stroke-linecap:round"/><path d="${bv}${tw}" style="fill:none;stroke:${BLOOD};stroke-width:3.2;stroke-linecap:round"/><path d="${bv}" transform="translate(-1 -1)" style="fill:none;stroke:${mx(BLOOD, W_, 50)};stroke-width:1.1"/></g>`;
  // a fine nerve net on the outer wall, upper body only: thin threads, a few small knots
  let nv = '', kn = ''; const qn = rnd(12);
  const nodes = [[62, 28], [96, 38], [128, 58], [74, 66], [108, 84], [56, 104], [92, 118], [130, 104]];
  const links = [[0, 1], [1, 2], [1, 4], [3, 4], [3, 5], [4, 6], [4, 7]];
  for (const [a, b] of links) { const [x0, y0] = nodes[a], [x1, y1] = nodes[b]; nv += `M${x0} ${y0}Q${n1((x0 + x1) / 2 + (qn() - 0.5) * 12)} ${n1((y0 + y1) / 2 + (qn() - 0.5) * 12)} ${x1} ${y1}`; }
  for (const [x0, y0] of nodes) { { const a = qn() * 6.28; nv += `M${x0} ${y0}q${n1(Math.cos(a) * 4)} ${n1(Math.sin(a) * 6)} ${n1(Math.cos(a) * 8)} ${n1(Math.sin(a) * 8)}`; } kn += `<ellipse cx="${x0}" cy="${y0}" rx="2.2" ry="1.6" style="fill:${NERVE};stroke:${NERVE_D};stroke-width:.9"/>`; }
  s += `<g opacity="${P('nerve')}"><path d="${nv}" style="fill:none;stroke:${NERVE_D};stroke-width:${L('nerve') ? 2.2 : 1.3};stroke-linecap:round;opacity:.8"/><path d="${nv}" style="fill:none;stroke:${NERVE};stroke-width:.6;stroke-linecap:round"/>${kn}</g>`;
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${n1(k * 1000) / 1000})">${s}</g>`;
}
