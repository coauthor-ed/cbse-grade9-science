// SlideMount - Activity 2.3 on a white tiled lab table lit from a window: a glass slide seen from above at a slant, a stain bottle and tools.
//   b0 also shows a cut red onion with a thin peel lifted from one scale by forceps
//   b0 peel on the slide, safranin drop, cover slip lowered
//   b1 cotton swab spreads cheek cells on a clean slide
//   b2 water first, then methylene blue, then the cover slip (the order in the book)
// Each beat plays its action once and rests on the finished slide. No controls.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwFrame, n1, rnd, T, mx, stroke } from '../shared/CellWorld.js';
import { label, anim } from '../shared/PlantArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const sm = (u) => { const v = Math.max(0, Math.min(1, u)); return v * v * (3 - 2 * v); };
const seg = (t, a, b) => sm((t - a) / (b - a));
const WOOD = 'strata-2', GLASS = mx('series-1', 'elev-peak', 16), EDGE = mx('sea-shallow', 'sea-deep', 64), INK = T('strata-6');

const TILE = mx('elev-peak', 'sea-shallow', 88), TILE2 = mx('elev-peak', 'strata-5', 78), GROUT = mx('strata-5', 'elev-peak', 46), METAL = mx('strata-5', 'elev-peak', 56);
const DEFS = `<linearGradient id="sm-bench" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${T('elev-peak')}"/><stop offset=".45" style="stop-color:${TILE}"/><stop offset="1" style="stop-color:${TILE2}"/></linearGradient>
<linearGradient id="sm-win" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${T('elev-peak')};stop-opacity:.9"/><stop offset="1" style="stop-color:${T('elev-peak')};stop-opacity:0"/></linearGradient>
<linearGradient id="sm-amber" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${mx('strata-3', 'series-2', 40)}"/><stop offset=".4" style="stop-color:${mx('strata-3', 'strata-6', 64)}"/><stop offset="1" style="stop-color:${mx('strata-3', 'strata-6', 30)}"/></linearGradient>
<linearGradient id="sm-rubber" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${mx('strata-6', 'elev-peak', 60)}"/><stop offset="1" style="stop-color:${INK}"/></linearGradient>
<linearGradient id="sm-skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:${mx('series-5', 'series-6', 54)}"/><stop offset=".5" style="stop-color:${mx(mx('series-5', 'series-6', 60), 'strata-6', 74)}"/><stop offset="1" style="stop-color:${mx('series-5', 'strata-6', 46)}"/></linearGradient>
<radialGradient id="sm-flesh" cx=".42" cy=".38" r=".7"><stop offset="0" style="stop-color:${T('elev-peak')}"/><stop offset=".7" style="stop-color:${mx('series-5', 'elev-peak', 10)}"/><stop offset="1" style="stop-color:${mx('series-5', 'elev-peak', 22)}"/></radialGradient>
<linearGradient id="sm-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${T('elev-peak')}"/><stop offset=".5" style="stop-color:${METAL}"/><stop offset="1" style="stop-color:${mx('strata-5', 'strata-6', 60)}"/></linearGradient>
<linearGradient id="sm-edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${T('elev-peak')}"/><stop offset=".4" style="stop-color:${mx('sea-shallow', 'elev-peak', 70)}"/><stop offset="1" style="stop-color:${mx('sea-shallow', 'sea-deep', 60)}"/></linearGradient>`;

/** Slide plane to screen: u along, v across (0 near, 1 far), z up. */
const mapper = (g) => (u, v, z = 0) => [g.x + u * g.L + v * g.sk, g.y - v * g.D - z];
const poly = (m, pts, z) => pts.map(([u, v, zz]) => m(u, v, zz ?? z ?? 0)).map(([x, y], i) => `${i ? 'L' : 'M'}${n1(x)} ${n1(y)}`).join('') + 'Z';

function slide(m, g) {
  const c = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const [ax, ay] = m(0, 0), [bx, by] = m(1, 0), [cx, cy] = m(1, 1);
  return `<path d="${poly(m, c)}" transform="translate(8 14)" style="fill:${INK};opacity:.16;filter:url(#cw-blur3)"/>`
    + `<path d="M${n1(ax)} ${n1(ay)}L${n1(bx)} ${n1(by)}L${n1(cx)} ${n1(cy)}V${n1(cy + 7)}L${n1(bx)} ${n1(by + 7)}H${n1(ax)}Z" style="fill:url(#sm-edge) ${EDGE};opacity:.9"/>`
    + `<path d="${poly(m, c)}" style="fill:${GLASS};opacity:.42"/>`
    + `<path d="${poly(m, [[0, 0], [0.15, 0], [0.15, 1], [0, 1]])}" style="fill:${T('elev-peak')};opacity:.62"/>`
    + `<path d="${poly(m, c)}" style="fill:none;stroke:${EDGE};stroke-width:1.6;opacity:.8"/>`
    + `<path d="M${n1(ax + 2)} ${n1(ay - 1.5)}L${n1(bx - 2)} ${n1(by - 1.5)}" ${stroke(T('elev-peak'), 2)} opacity=".95"/>`
    + `<path d="${poly(m, [[0.2, 0.92], [0.4, 0.92], [0.3, 0.08], [0.22, 0.08]])}" style="fill:${T('elev-peak')};opacity:.32"/>`
    + `<path d="${poly(m, [[0.72, 0.92], [0.76, 0.92], [0.7, 0.08], [0.67, 0.08]])}" style="fill:${T('elev-peak')};opacity:.4"/>`;
}
/** A cover slip that hinges on its left edge. tilt 0 lies flat, 1 is raised. */
function coverSlip(m, tilt) {
  const u0 = 0.33, u1 = 0.67, v0 = 0.12, v1 = 0.88, up = tilt * 84, pts = [[u0, v0, 2], [u1, v0, 2 + up], [u1, v1, 2 + up], [u0, v1, 2]];
  const [nx, ny] = m(u1, 0.5, 2 + up), [ax, ay] = m(u0, v0, 2), [bx, by] = m(u1, v0, 2 + up);
  return `<path d="${poly(m, pts)}" style="fill:${mx('sea-shallow', 'elev-peak', 24)};opacity:.42;stroke:${EDGE};stroke-width:1.4"/>`
    + `<path d="M${n1(ax)} ${n1(ay)}L${n1(bx)} ${n1(by)}" ${stroke(T('elev-peak'), 2.4)}/>`
    + `<path d="${poly(m, [[u0 + 0.05, v1 - 0.06, 2 + up * 0.15], [u0 + 0.1, v1 - 0.06, 2 + up * 0.3], [u1 - 0.08, v0 + 0.08, 2 + up * 0.92], [u1 - 0.12, v0 + 0.08, 2 + up * 0.8]])}" style="fill:${T('elev-peak')};opacity:.45"/>`
    + (tilt > 0.01 ? `<path d="M${n1(nx)} ${n1(ny)}l58 -58" ${stroke(METAL, 4)}/><path d="M${n1(nx)} ${n1(ny)}l58 -58" ${stroke(T('elev-peak'), 1.2)} opacity=".8"/><path d="M${n1(nx + 58)} ${n1(ny - 58)}l34 -34" ${stroke(WOODC, 10)}/>` : '');
}
const WOODC = mx(WOOD, 'strata-6', 70);
function peel(m, op) {
  const q = rnd(3); let d = ''; const p = []; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, k = 0.88 + q() * 0.24; p.push([0.5 + Math.cos(a) * 0.13 * k, 0.5 + Math.sin(a) * 0.33 * k]); }
  p.forEach(([u, v], i) => { const [x, y] = m(u, v); d += `${i ? 'L' : 'M'}${n1(x)} ${n1(y)}`; });
  const cl = `sm-pc${Math.round(op * 100)}`, line = mx('series-5', 'strata-6', 52);
  let cells = '';
  for (let r = 0; r < 9; r++) {
    const v = 0.15 + r * 0.08, [x0, y0] = m(0.34, v), [x1, y1] = m(0.66, v); cells += `<path d="M${n1(x0)} ${n1(y0)}L${n1(x1)} ${n1(y1)}"/>`;
    for (let c = 0; c < 6; c++) { const u = 0.35 + c * 0.055 + (r % 2 ? 0.027 : 0), [xa, ya] = m(u, v), [xb, yb] = m(u, v + 0.08); cells += `<path d="M${n1(xa)} ${n1(ya)}L${n1(xb)} ${n1(yb)}"/>`; }
  }
  return `<clipPath id="${cl}"><path d="${d}Z"/></clipPath><g opacity="${op}"><path d="${d}Z" style="fill:${mx('series-5', 'elev-peak', 22)};opacity:.7"/>`
    + `<g clip-path="url(#${cl})" style="fill:none;stroke:${line};stroke-width:1;opacity:.55">${cells}</g>`
    + `<path d="${d}Z" style="fill:none;stroke:${mx('series-5', 'elev-peak', 60)};stroke-width:1.2;stroke-linejoin:round"/></g>`;
}
/** A liquid patch on the slide. k grows it from nothing. */
function pool(m, col, k, a = 0.72, seed = 4) {
  const q = rnd(seed), p = []; for (let i = 0; i < 12; i++) { const t = i / 12 * 6.283, w = (0.92 + q() * 0.16) * k; p.push(m(0.5 + Math.cos(t) * 0.155 * w, 0.5 + Math.sin(t) * 0.37 * w)); }
  let d = `M${n1((p[0][0] + p[11][0]) / 2)} ${n1((p[0][1] + p[11][1]) / 2)}`;
  for (let i = 0; i < 12; i++) { const b = p[(i + 1) % 12]; d += `Q${n1(p[i][0])} ${n1(p[i][1])} ${n1((p[i][0] + b[0]) / 2)} ${n1((p[i][1] + b[1]) / 2)}`; }
  const [x, y] = m(0.45, 0.68);
  return `<path d="${d}Z" style="fill:${col};opacity:${a}"/><ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(16 * k)}" ry="${n1(4 * k)}" style="fill:${T('elev-peak')};opacity:.6"/>`;
}
/** A red onion cut across, seen from above at a slant: papery skin below, fleshy scales on the cut face, and a thin
 *  peel lifted off one inner scale by forceps that reach out to the right. */
function onionHalf(x, y, s, lift = true) {
  const q = rnd(21); let rings = '';
  for (let i = 0; i < 7; i++) {
    const k = 1 - i * 0.135, rx = 54 * k, ry = 33 * k, ox = -i * 1.6, oy = -i * 1.1;
    rings += `<ellipse cx="${n1(ox)}" cy="${n1(oy)}" rx="${n1(rx)}" ry="${n1(ry)}" style="fill:url(#sm-flesh) ${T('elev-peak')};stroke:${mx('series-5', 'series-6', 60)};stroke-width:${n1(2.2 - i * 0.18)}"/>`
      + `<ellipse cx="${n1(ox)}" cy="${n1(oy + 1)}" rx="${n1(rx - 2.4)}" ry="${n1(ry - 2)}" style="fill:none;stroke:${mx('series-5', 'elev-peak', 28)};stroke-width:1.4;opacity:.8"/>`;
  }
  rings += `<path d="M-10 -9C-6 -14 6 -14 9 -8C6 -4 -6 -4 -10 -9Z" style="fill:${mx('elev-low', 'elev-peak', 40)};stroke:${mx('elev-low', 'strata-6', 70)};stroke-width:1"/>`;
  let skin = '';
  for (let i = 0; i < 9; i++) { const xx = -48 + i * 12 + q() * 4; skin += `<path d="M${n1(xx)} ${n1(4 + Math.abs(xx) * 0.1)}C${n1(xx * 0.9)} 26 ${n1(xx * 0.5)} 44 ${n1(xx * 0.2)} 52" ${stroke(mx('series-6', 'elev-peak', 50), 1)} opacity="${n1(0.25 + q() * 0.3)}"/>`; }
  let body = `<ellipse cx="10" cy="44" rx="66" ry="18" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/>`
    + `<path d="M-58 2C-60 30 -26 56 0 56S60 30 58 2Z" style="fill:url(#sm-skin) ${T('series-5')};stroke:${mx('series-5', 'strata-6', 50)};stroke-width:1.6"/>${skin}`
    + `<path d="M-46 18C-36 36 -18 46 -2 48" ${stroke(T('elev-peak'), 3)} opacity=".35"/>`
    + `<path d="M0 54C-2 60 2 64 -1 70M4 54C8 60 6 66 10 68M-4 54C-10 58 -12 64 -10 68" ${stroke(mx('strata-3', 'elev-peak', 50), 1.2)} opacity=".8"/>`
    + `<ellipse cx="0" cy="1" rx="58" ry="35" style="fill:${mx('series-5', 'series-6', 70)}"/>${rings}`
    + `<ellipse cx="-20" cy="-14" rx="22" ry="7" transform="rotate(-12 -20 -14)" style="fill:${T('elev-peak')};opacity:.5"/>`;
  if (lift) {
    // forceps: two thin arms joined at the far end; their tips hold the corner of a lifted peel
    const tx = 30, ty = -6, hx = 172, hy = -66;
    body += `<path d="M${tx - 6} ${ty + 2}C${tx + 2} ${ty - 26} ${tx + 26} ${ty - 40} ${tx + 42} ${ty - 42}C${tx + 34} ${ty - 30} ${tx + 30} ${ty - 22} ${tx + 34} ${ty - 12}C${tx + 22} ${ty - 6} ${tx + 6} ${ty + 2} ${tx - 6} ${ty + 2}Z" style="fill:${mx('series-5', 'elev-peak', 26)};opacity:.85;stroke:${mx('series-5', 'strata-6', 46)};stroke-width:1.2"/>`
      + `<path d="M${tx + 2} ${ty - 6}L${tx + 32} ${ty - 34}M${tx + 10} ${ty - 2}L${tx + 34} ${ty - 22}M${tx + 12} ${ty - 22}L${tx + 22} ${ty - 10}M${tx + 22} ${ty - 30}L${tx + 30} ${ty - 18}" ${stroke(mx('series-5', 'strata-6', 50), 0.8)} opacity=".5"/>`
      + `<path d="M${tx + 4} ${ty - 14}C${tx + 14} ${ty - 28} ${tx + 26} ${ty - 36} ${tx + 36} ${ty - 38}" ${stroke(T('elev-peak'), 1.6)} opacity=".7"/>`
      + `<path d="M${tx + 40} ${ty - 42}L${hx} ${hy - 6}" ${stroke(mx('strata-5', 'strata-6', 50), 5.4)}/><path d="M${tx + 40} ${ty - 42}L${hx} ${hy - 6}" ${stroke('url(#sm-metal)', 3.6)}/>`
      + `<path d="M${tx + 44} ${ty - 38}L${hx} ${hy + 8}" ${stroke(mx('strata-5', 'strata-6', 50), 5.4)}/><path d="M${tx + 44} ${ty - 38}L${hx} ${hy + 8}" ${stroke(METAL, 3.6)}/><path d="M${tx + 48} ${ty - 40}L${hx - 4} ${hy + 5}" ${stroke(T('elev-peak'), 1)} opacity=".8"/>`
      + `<path d="M${hx} ${hy - 7}Q${hx + 14} ${hy + 1} ${hx} ${hy + 9}" ${stroke(METAL, 4)}/>`;
  }
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${s})">${body}</g>`;
}
function bottle(x, y, s, col) {
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${s})"><ellipse cx="4" cy="4" rx="44" ry="11" style="fill:${INK};opacity:.24;filter:url(#cw-blur3)"/><path d="M-36 0V-74C-36 -88 -20 -92 -16 -102H16C20 -92 36 -88 36 -74V0C36 8 -36 8 -36 0Z" style="fill:url(#sm-amber) ${T('strata-3')};stroke:${INK};stroke-width:2.4"/>`
    + `<rect x="-28" y="-62" width="56" height="34" rx="4" style="fill:${T('elev-peak')};stroke:${mx('strata-5', 'elev-peak', 60)};stroke-width:1.4"/><rect x="-22" y="-54" width="44" height="6" rx="3" style="fill:${col}"/><rect x="-22" y="-42" width="30" height="4" rx="2" style="fill:${mx('strata-5', 'elev-peak', 60)}"/>`
    + `<path d="M-30 -74C-30 -82 -24 -86 -22 -90" ${stroke(T('elev-peak'), 3)} opacity=".6"/><rect x="-18" y="-112" width="36" height="12" rx="3" style="fill:url(#sm-rubber) ${INK}"/></g>`;
}
function dropper(x, y, liquid) {
  return `<g transform="translate(${n1(x)} ${n1(y)})"><path d="M-3 0L-5 -46H5L3 0Z" style="fill:${GLASS};stroke:${EDGE};stroke-width:1.8"/><path d="M-4 -12L-5 -44H5L4 -12Z" style="fill:${liquid};opacity:.8"/><rect x="-9" y="-52" width="18" height="8" rx="2" style="fill:${INK}"/><path d="M-10 -52C-16 -66 -12 -86 0 -86S16 -66 10 -52Z" style="fill:url(#sm-rubber) ${INK}"/><ellipse cx="-4" cy="-72" rx="2.4" ry="7" style="fill:${T('elev-peak')};opacity:.4"/></g>`;
}
function swab(x, y, ang) {
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(ang)})"><path d="M0 -12L0 -190" ${stroke(mx(WOOD, 'elev-peak', 44), 6)}/><path d="M-2 -12L-2 -190" ${stroke(T('elev-peak'), 1.4)} opacity=".6"/><ellipse cy="-8" rx="10" ry="17" style="fill:${T('elev-peak')};stroke:${mx('strata-5', 'elev-peak', 60)};stroke-width:1.6"/><circle cx="-3" cy="-6" r="2" style="fill:${mx('series-1', 'elev-peak', 60)}"/></g>`;
}

export class SlideMount extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 680; static HEIGHT = 450; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 470;
  static ARIA_LABEL = 'A glass slide on a lab bench. A plant peel is stained with red safranin under a cover slip. Cheek cells are spread on a second slide with a cotton swab, then a drop of water and blue methylene blue stain are added and a cover slip is lowered.';
  static CONTROLS = [];
  enter() { this.play?.(3.4); }
  stageHeight(st) { return st.portrait ? 380 : 430; }
  _g(st) {
    const { W, H, portrait: P } = st;
    return P ? { x: 14, y: H - 70, L: 226, D: 150, sk: 36 } : { x: 92, y: H - 72, L: 440, D: 204, sk: 64 };
  }
  animate(st, t = 0) {
    const step = this.stepIndex, G = this._g(st), m = mapper(G), P = st.portrait, kk = P ? 0.72 : 1; let d = '';
    const [cx, cy] = m(0.5, 0.5);
    const dropAt = (a, b, col) => {
      const u = (t - a) / (b - a); if (u <= 0 || u >= 1) return '';
      return `<ellipse cx="${n1(cx)}" cy="${n1(lerp(cy - 110 * kk, cy - 6, u * u))}" rx="5" ry="7" style="fill:${col}"/>`;
    };
    if (step === 0) {
      const red = T('series-6'), g = seg(t, 1, 1.5);
      d += peel(m, 1);
      if (g > 0) d += pool(m, mx('series-6', 'series-4', 76), g, 0.62);
      if (t < 1.8) d += dropper(cx, cy - 118 * kk, red) + dropAt(0.4, 1, red);
      d += coverSlip(m, 1 - seg(t, 1.8, 3.2));
    } else if (step === 1) {
      const u = seg(t, 0.2, 2.8), a = 0.34 + 0.16 * Math.sin(u * 16);
      d += `<g opacity="${n1(u * 0.9 * 100) / 100}">${pool(m, mx('series-1', 'elev-peak', 34), 1, 0.8, 7)}</g>`;
      const q = rnd(6); for (let i = 0; i < 26; i++) { const uu = 0.28 + q() * 0.44, vv = 0.22 + q() * 0.56, [x, y] = m(uu, vv); if (q() < u) d += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(1.4 + q() * 1.6)}" style="fill:${mx('series-1', 'elev-peak', 50)}"/>`; }
      const [sx, sy] = m(a + 0.1, 0.5, 8); d += swab(sx, sy, 24);
    } else {
      const blue = T('series-1'), w = seg(t, 0.8, 1.1), b = seg(t, 1.7, 2.1);
      const q = rnd(6); for (let i = 0; i < 26; i++) { const uu = 0.28 + q() * 0.44, vv = 0.22 + q() * 0.56, [x, y] = m(uu, vv); d += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(1.4 + q() * 1.6)}" style="fill:${mx('series-1', 'elev-peak', 50)}"/>`; q(); }
      if (w > 0) d += pool(m, mx('series-1', 'elev-peak', 18), 0.8 * w, 0.9, 5);
      if (b > 0) d += pool(m, blue, b, 0.62, 9);
      if (t < 2.3) d += dropper(cx, cy - 118 * kk, t < 1.2 ? mx('series-1', 'elev-peak', 18) : blue) + dropAt(0.3, 0.8, mx('series-1', 'elev-peak', 18)) + dropAt(1.2, 1.7, blue);
      d += coverSlip(m, 1 - seg(t, 2.3, 3.3));
    }
    anim(this, 'w', d);
  }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex, G = this._g(st), m = mapper(G);
    let g = `<defs>${DEFS}</defs><rect width="${W}" height="${H}" style="fill:url(#sm-bench) ${T('elev-peak')}"/>`;
    // white tiles in perspective: rows widen towards the viewer, joints run to a point above the table
    const vx = W * 0.5, vy = -H * 1.6, rows = [0, 0.13, 0.28, 0.45, 0.65, 0.88, 1.15];
    rows.forEach((r) => { const y = n1(r * H); g += `<path d="M0 ${y}H${W}" ${stroke(GROUT, 1.6)} opacity=".55"/>`; });
    for (let i = -6; i <= 12; i++) { const xb = i * (W / 6); g += `<path d="M${n1(vx + (xb - vx) * 0.38)} 0L${n1(xb)} ${H}" ${stroke(GROUT, 1.4)} opacity=".5"/>`; }
    // window light falling across the table from the upper left: four panes, soft
    const pane = (x0, y0, w, h) => `<path d="M${n1(x0)} ${n1(y0)}l${n1(w)} ${n1(h * 0.18)}l${n1(-w * 0.32)} ${n1(h)}l${n1(-w)} ${n1(-h * 0.18)}Z" style="fill:url(#sm-win)"/>`;
    const pw = P ? 70 : 120, ph = P ? 90 : 120;
    g += `<g opacity=".7">${pane(-pw * 0.2, -ph * 0.3, pw, ph)}${pane(pw * 0.95, -ph * 0.1, pw, ph)}${pane(-pw * 0.55, ph * 0.95, pw, ph)}${pane(pw * 0.6, ph * 1.15, pw, ph)}</g>`;
    const size = P ? 14 : 16, ks = P ? 0.62 : 1;
    const bx = P ? W - 44 : W - 70, by = P ? 96 : 134;
    if (step === 0) g += onionHalf(P ? 58 : 96, P ? 62 : 84, ks) + label(P ? 58 : 96, P ? 116 : 162, 'Red onion', { size }) + label(P ? 172 : 280, P ? 26 : 22, 'Thin peel', { size, anchor: 'start' }) + bottle(bx, by, ks, T('series-6')) + label(bx - (P ? 34 : 50), by - 30, 'Safranin', { size, anchor: 'end' });
    if (step === 1) g += `<ellipse cx="${n1(bx - 10)}" cy="${n1(by - 40)}" rx="${n1(58 * ks)}" ry="${n1(22 * ks)}" style="fill:${T('elev-peak')};opacity:.5;stroke:${mx('strata-5', 'elev-peak', 50)};stroke-width:2"/><path d="M${n1(bx - 54 * ks)} ${n1(by - 36)}l${n1(90 * ks)} -9" ${stroke(mx(WOOD, 'elev-peak', 44), 5)}/>` + label(bx - 12, by - (P ? 8 : 0), 'Toothpick', { size });
    if (step === 2) g += bottle(bx, by, ks, T('series-1')) + label(bx - (P ? 34 : 50), by - 30, 'Methylene blue', { size, anchor: 'end' });
    g += slide(m, G) + '<g data-anim="w"></g>';
    const [lx, ly] = m(0.5, 0, 0);
    g += label(lx, ly + 36, ['Peel, red stain, cover slip', 'Cheek cells on a clean slide', 'Water, blue stain, cover slip'][step], { size });
    return { svg: cwFrame(st, 'sm', g) };
  }
}
const lerp = (a, b, u) => a + (b - a) * u;
