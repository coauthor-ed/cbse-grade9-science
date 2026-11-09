// StomaOpen - blk-l06-s4. Beat 0 (pores): a peel of the lower epidermis under the microscope, jigsaw cells with
// several stomata. Beat 1 (guard): one stoma close up; Water in / Water out swells or shrinks the guard cells and the
// pore opens or closes. Beat 2 (gases): a section through the stoma: carbon dioxide in, oxygen and water vapour out.
// Beat 3 (close): hot, dry air: the guard cells go limp, the pore shuts, the vapour stays inside.
// Controls in the scene: Water in / Water out (beat 1), Cool, damp / Hot, dry (beat 3).
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { flowChoiceHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { PLANT_COLOR_MAP, label } from '../shared/PlantArt.js';
import { cwFrame, eyepiece, T, mx, n1, rnd, blobPath, vacuole, chloroplast, nucleus } from '../shared/CellWorld.js';
import { smooth } from '../shared/TissueArt.js';
import { BODY_CSS, travel } from '../shared/BodyArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const W_ = T('elev-peak'), INK = T('strata-6');
const EPI = mx('sea-shallow', 'elev-peak', 18), EPI_W = mx('elev-low', 'strata-3', 44), EPI_WD = mx(EPI_W, INK, 60);
const GRD = mx('elev-low', 'chloro', 44), GRD_L = mx(GRD, W_, 50), GRD_D = mx(GRD, INK, 56);
const CO2 = mx('strata-6', 'series-7', 62), O2 = T('series-6'), VAP = T('series-1');

// Open smooth path through points (quadratic through midpoints).
const openPath = (pts) => { let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`; for (let i = 1; i < pts.length - 1; i++) { const q = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; d += `Q${n1(pts[i][0])} ${n1(pts[i][1])} ${n1(q[0])} ${n1(q[1])}`; } const z = pts[pts.length - 1]; return d + `L${n1(z[0])} ${n1(z[1])}`; };
// One guard cell (sx -1 left, 1 right): a kidney from pole to pole, joined to its partner only near the poles.
// The pore edge (inner wall) is thick; the outer wall is thin, so a swollen cell bows outward and the pore opens.
function guardGeom(cx, cy, L, open, sx) {
  const p = L * (0.012 + open * 0.1), g = L * (0.2 + open * 0.05), top = cy - L / 2, N = 18, out = [], inn = [], mid = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, s = Math.sin(Math.PI * t), h = g * (0.27 + 0.23 * s), po = p * Math.max(0, (s - 0.32) / 0.68), y = top + t * L;
    inn.push([cx + sx * po, y]); out.push([cx + sx * (po + 2 * h), y]); mid.push([cx + sx * (po + h), y, h]);
  }
  const h0 = g * 0.27, capT = [cx + sx * h0, top - h0 * 0.9], capB = [cx + sx * h0, top + L + h0 * 0.9];
  const ring = [capT, ...out, capB, ...inn.slice().reverse()];
  return { p, g, out, inn, mid, d: smooth(ring) };
}
function guardPair(cx, cy, L, open, o = {}) {
  const k = o.k ?? 1, big = k >= 1, r = rnd(o.seed ?? 3), Ls = guardGeom(cx, cy, L, open, -1), Rs = guardGeom(cx, cy, L, open, 1), g = Rs.g;
  const pore = smooth([...Rs.inn, ...Ls.inn.slice().reverse()]);
  // the subsidiary ring of epidermis round the pair, a little darker, then the dark pore (air below the skin)
  let s = `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(g * 1.35 + Rs.p + 8 * k)}" ry="${n1(L * 0.6)}" style="fill:${mx(EPI, GRD, 80)};opacity:.75"/>`;
  s += `<path d="${pore}" style="fill:${mx('strata-6', 'sea-deep', 56)}"/><path d="${pore}" style="fill:${INK};opacity:.3;filter:url(#cw-grain)"/>`;
  [[-1, Ls], [1, Rs]].forEach(([sx, G]) => {
    const cls = o.anim ? ` class="${o.anim}" style="transform-box:fill-box;transform-origin:${sx < 0 ? 'right' : 'left'} center"` : '';
    s += `<g${cls}>`;
    s += `<path d="${G.d}" transform="translate(${n1(3 * k)} ${n1(5 * k)})" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/>`;
    s += `<path d="${G.d}" style="fill:url(#so-gc) ${GRD};stroke:${GRD_D};stroke-width:${n1(1.6 * k)}"/>`;
    s += `<path d="${G.d}" style="fill:${INK};opacity:.16;filter:url(#cw-grain)"/>`;
    // the sap vacuole down the middle of the cell, bigger when the cell is full of water
    const vm = G.mid.slice(5, 14), vx = vm.reduce((a, q) => a + q[0], 0) / vm.length;
    s += vacuole(vx - sx * g * 0.04, cy - L * 0.08, g * (0.08 + 0.06 * open), L * (0.16 + 0.04 * open), { seed: 7 + sx, a: 0.8 });
    // lens-shaped chloroplasts lining the cell
    for (let i = 2; i <= 16; i += 2) {
      if (i === 8 || i === 10) continue;
      const [mxp, my, h] = G.mid[i], side = (i / 2) % 2 ? 1 : -1, xx = mxp + side * h * 0.52 + (r() - 0.5) * 2 * k, rot = 90 + sx * (i - 9) * 4;
      if (big) s += chloroplast(xx, my, g * 0.003, { rot });
      else s += `<ellipse cx="${n1(xx)}" cy="${n1(my)}" rx="${n1(g * 0.07)}" ry="${n1(g * 0.12)}" style="fill:url(#cw-chl) ${T('chloro')};stroke:${mx('chloro', INK, 50)};stroke-width:.8"/>`;
    }
    // the nucleus pressed to the outer side, a little below the middle
    const [nx, ny, nh] = G.mid[10];
    s += big ? nucleus(nx + sx * nh * 0.3, ny, g * 0.19, { seed: 4 + sx, pores: false }) : `<circle cx="${n1(nx + sx * nh * 0.3)}" cy="${n1(ny)}" r="${n1(g * 0.13)}" style="fill:url(#cw-nuc) ${T('series-5')}"/>`;
    // thin outer wall with a light rim on the lit (left) cell, shade on the right one
    s += `<path d="${openPath(G.out.slice(2, 17))}" style="fill:none;stroke:${sx < 0 ? W_ : INK};stroke-width:${n1(Math.max(1.5, g * (sx < 0 ? 0.05 : 0.09)))};opacity:${sx < 0 ? 0.55 : 0.2};stroke-linecap:round;transform:translate(${n1(-sx * 2 * k)}px,0)"/>`;
    // thick inner wall on the pore side: a heavy pale band with a dark edge
    const iw = Math.max(3, g * 0.15), band = G.inn.slice(2, 17).map(([x, y]) => [x + sx * iw * 0.5, y]);
    s += `<path d="${openPath(band)}" style="fill:none;stroke:${EPI_WD};stroke-width:${n1(iw + 2 * k)};stroke-linecap:round"/><path d="${openPath(band)}" style="fill:none;stroke:${mx(EPI_W, W_, 70)};stroke-width:${n1(iw * 0.62)};stroke-linecap:round"/>`;
    s += `<path d="${G.d}" style="fill:none;stroke:${GRD_D};stroke-width:${n1(1.4 * k)}"/></g>`;
  });
  return s;
}

// Jigsaw pavement cells: wavy walls on a staggered grid. Walls have thickness and a light rim.
function jigsaw(x0, y0, w, h, cs, seed, holes = []) {
  const r = rnd(seed); let d = '';
  const rh = cs * 0.78, rows = Math.ceil(h / rh) + 1, cols = Math.ceil(w / cs) + 2, amp = cs * 0.075;
  // row boundary j: a gently waving line; its height at x
  const ph = [], jit = [];
  for (let j = 0; j <= rows; j++) { ph.push(r() * 6.28); jit.push((r() - 0.5) * rh * 0.16); }
  const yAt = (j, x) => y0 + j * rh + jit[j] + Math.sin(x / cs * 6.28 * 1.5 + ph[j]) * amp;
  for (let j = 0; j <= rows; j++) { let q = `M${n1(x0 - 4)} ${n1(yAt(j, x0 - 4))}`; for (let x = x0; x <= x0 + w + 6; x += cs / 8) q += `L${n1(x)} ${n1(yAt(j, x))}`; d += q; }
  // side walls inside each row: lobed, from one boundary to the next, staggered row to row
  const xs = [];
  for (let j = 0; j < rows; j++) {
    xs.push([]);
    for (let i = -1; i < cols; i++) {
      const xa = x0 + (i + (j % 2) * 0.5) * cs + (r() - 0.5) * cs * 0.3, xb = xa + (r() - 0.5) * cs * 0.3, ya = yAt(j, xa), yb = yAt(j + 1, xb), sg = r() < 0.5 ? 1 : -1;
      xs[j].push((xa + xb) / 2);
      d += `M${n1(xa)} ${n1(ya)}C${n1(xa + sg * amp * 3)} ${n1(ya + (yb - ya) * 0.3)} ${n1(xb - sg * amp * 3)} ${n1(ya + (yb - ya) * 0.66)} ${n1(xb)} ${n1(yb)}`;
    }
  }
  let mask = '';
  if (holes.length) mask = `<mask id="so-m${seed}"><rect x="${n1(x0 - 20)}" y="${n1(y0 - 20)}" width="${n1(w + 40)}" height="${n1(h + 40)}" style="fill:white"/>${holes.map(([hx, hy, rx, ry]) => `<ellipse cx="${n1(hx)}" cy="${n1(hy)}" rx="${n1(rx)}" ry="${n1(ry)}" style="fill:black"/>`).join('')}</mask>`;
  const m = holes.length ? ` mask="url(#so-m${seed})"` : '';
  let s = `${mask}<rect x="${n1(x0)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(h)}" style="fill:${EPI}"/><rect x="${n1(x0)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(h)}" style="fill:${INK};opacity:.1;filter:url(#cw-grain)"/>`;
  // a faint nucleus in some cells
  for (let j = 0; j < rows; j++) for (let i = 0; i < xs[j].length - 1; i++) if (r() < 0.4) s += `<ellipse cx="${n1((xs[j][i] + xs[j][i + 1]) / 2 + (r() - 0.5) * cs * 0.2)}" cy="${n1(y0 + (j + 0.5) * rh)}" rx="${n1(cs * 0.08)}" ry="${n1(cs * 0.065)}" style="fill:${mx('series-5', EPI, 40)};opacity:.55"/>`;
  s += `<g${m}><path d="${d}" style="fill:none;stroke:${EPI_WD};stroke-width:${n1(Math.max(3, cs * 0.06))};stroke-linecap:round;opacity:.5"/><path d="${d}" style="fill:none;stroke:${EPI_W};stroke-width:${n1(Math.max(1.6, cs * 0.032))};stroke-linecap:round"/><path d="${d}" style="fill:none;stroke:${W_};stroke-width:1;opacity:.55;transform:translate(-1px,-1px)"/></g>`;
  return s;
}

// A section through a leaf at one stoma: upper skin, palisade, spongy layer with a big air space over the stoma,
// lower skin with the guard cells, outside air below. Gases go as labelled arrows through the pore.
function section(W, H, P, open, gas) {
  const ey = H * (P ? 0.6 : 0.58), cx = W * (P ? 0.5 : 0.44), ch = P ? 24 : 26, r = rnd(9), air = mx('sea-shallow', 'elev-peak', 22);
  let cid = 0;
  const uy = P ? 12 : 10, ue = P ? 22 : 24, py0 = uy + ue, py1 = py0 + (P ? 78 : 70), cw = P ? 22 : 25;
  let s = `<rect width="${W}" height="${H}" style="fill:${mx('sea-shallow', 'elev-peak', 34)}"/>`;
  s += `<rect y="${n1(uy)}" width="${W}" height="${n1(ey - uy)}" style="fill:${air}"/>`;
  const cellG = (d, x0, y0, w, h) => `<path d="${d}" style="fill:url(#so-gc) ${GRD_L};stroke:${GRD_D};stroke-width:2"/><clipPath id="so-c${++cid}"><path d="${d}"/></clipPath><rect x="${n1(x0)}" y="${n1(y0)}" width="${n1(w)}" height="${n1(h)}" clip-path="url(#so-c${cid})" style="fill:${INK};opacity:.14;filter:url(#cw-grain)"/>`;
  const lensC = (x, y, a, sc = 1) => `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(4.6 * sc)}" ry="${n1(2.6 * sc)}" transform="rotate(${n1(a)} ${n1(x)} ${n1(y)})" style="fill:url(#cw-chl) ${T('chloro')};stroke:${mx('chloro', INK, 48)};stroke-width:.8"/>`;
  // palisade: tall columns packed side by side, chloroplasts lining their walls
  for (let x = -6; x < W + 10; x += cw) {
    const w = cw - 2, top = py0 + 1, bot = py1 - r() * 12, d = `M${n1(x + 6)} ${n1(top)}H${n1(x + w - 6)}Q${n1(x + w)} ${n1(top)} ${n1(x + w)} ${n1(top + 6)}V${n1(bot - w / 2)}Q${n1(x + w)} ${n1(bot)} ${n1(x + w / 2)} ${n1(bot)}Q${n1(x)} ${n1(bot)} ${n1(x)} ${n1(bot - w / 2)}V${n1(top + 6)}Q${n1(x)} ${n1(top)} ${n1(x + 6)} ${n1(top)}Z`;
    s += cellG(d, x, top, w, bot - top);
    s += `<ellipse cx="${n1(x + w / 2)}" cy="${n1((top + bot) / 2)}" rx="${n1(w * 0.22)}" ry="${n1((bot - top) * 0.3)}" style="fill:url(#cw-vac) ${W_};opacity:.6"/>`;
    for (let yy = top + 8; yy < bot - 8; yy += 9) s += lensC(x + 4.4, yy + r() * 3, 90) + lensC(x + w - 4.4, yy + 4 + r() * 3, 90);
  }
  // spongy layer: rounded irregular cells with air spaces between, a big air space over the stoma
  const chx = cx, chy = ey - (P ? 34 : 36), chr = P ? 56 : 66;
  for (let j = 0; j < 4; j++) for (let i = -1; i < W / (P ? 46 : 52) + 1; i++) {
    const x = (i + (j % 2) * 0.5) * (P ? 46 : 52) + (r() - 0.5) * 12, y = py1 + 20 + j * ((ey - py1 - 20) / 3.6) + (r() - 0.5) * 8;
    if (Math.hypot((x - chx) / 1.45, y - chy) < chr) continue;
    const rx = (P ? 17 : 20) + r() * 5, ry = (P ? 13 : 15) + r() * 4, d = blobPath(x, y, rx, ry, 3 + i * 7 + j, 0.14, 8);
    s += cellG(d, x - rx, y - ry, 2 * rx, 2 * ry);
    for (let k2 = 0; k2 < 6; k2++) { const t = (k2 + r() * 0.4) / 6 * 6.283; s += lensC(x + Math.cos(t) * rx * 0.72, y + Math.sin(t) * ry * 0.66, t * 57.3 + 90, 0.9); }
  }
  // upper skin: brick cells under a waxy cuticle
  for (let x = -14; x < W + 20; x += P ? 38 : 44) s += `<rect x="${n1(x)}" y="${n1(uy)}" width="${P ? 36 : 42}" height="${ue}" rx="5" style="fill:${EPI};stroke:${EPI_WD};stroke-width:2"/><rect x="${n1(x + 4)}" y="${n1(uy + 3)}" width="${P ? 28 : 34}" height="4" rx="2" style="fill:${W_};opacity:.5"/>`;
  s += `<rect x="-4" y="${n1(uy - 4)}" width="${W + 8}" height="5" style="fill:${mx('gold', 'strata-2', 50)};opacity:.85"/>`;
  // lower skin: flatter bricks, broken by the stoma, cuticle under them
  const gap = P ? 40 : 46;
  for (let x = -20; x < W + 40; x += P ? 44 : 50) {
    const w = P ? 42 : 48; if (x + w > cx - gap && x < cx + gap) continue;
    s += `<rect x="${n1(x)}" y="${n1(ey)}" width="${w}" height="${ch}" rx="5" style="fill:${EPI};stroke:${EPI_WD};stroke-width:2.2"/><rect x="${n1(x + 4)}" y="${n1(ey + 3)}" width="${w - 8}" height="4" rx="2" style="fill:${W_};opacity:.5"/><ellipse cx="${n1(x + w * 0.55)}" cy="${n1(ey + ch * 0.55)}" rx="6" ry="4" style="fill:${mx('series-5', EPI, 44)}"/>`;
  }
  // the pieces of wall that close the gap either side of the guard cells
  s += `<path d="M-10 ${n1(ey + ch + 2)}H${n1(cx - gap + 2)}M${n1(cx + gap - 2)} ${n1(ey + ch + 2)}H${W + 10}" style="fill:none;stroke:${mx('gold', 'strata-2', 50)};stroke-width:4;opacity:.85"/>`;
  // guard cells in section: two rounded cells with thick lips facing the pore
  const g = P ? 20 : 22, pw = 2 + open * (P ? 8 : 9);
  for (const sx of [-1, 1]) {
    const gx = cx + sx * (pw + g * 0.95), gy = ey + ch * 0.5, rx = g * (0.9 + open * 0.12), ry = g * (0.78 + open * 0.14);
    const d = blobPath(gx, gy, rx, ry, sx > 0 ? 4 : 5, 0.05, 9);
    s += `<path d="${d}" style="fill:url(#so-gc) ${GRD};stroke:${GRD_D};stroke-width:2"/>`;
    s += `<path d="M${n1(gx - sx * rx * 0.86)} ${n1(gy - ry * 0.7)}Q${n1(gx - sx * rx * 1.14)} ${n1(gy)} ${n1(gx - sx * rx * 0.86)} ${n1(gy + ry * 0.7)}" style="fill:none;stroke:${EPI_WD};stroke-width:7;stroke-linecap:round"/><path d="M${n1(gx - sx * rx * 0.86)} ${n1(gy - ry * 0.6)}Q${n1(gx - sx * rx * 1.08)} ${n1(gy)} ${n1(gx - sx * rx * 0.86)} ${n1(gy + ry * 0.6)}" style="fill:none;stroke:${mx(EPI_W, W_, 70)};stroke-width:3.4;stroke-linecap:round"/>`;
    for (const [a, b] of [[0.3, -0.42], [0.42, 0.3], [-0.05, 0.5], [0.1, -0.6]]) s += lensC(gx + sx * a * rx, gy + b * ry, 30 + a * 90);
    s += `<circle cx="${n1(gx + sx * rx * 0.36)}" cy="${n1(gy)}" r="4.4" style="fill:url(#cw-nuc) ${T('series-5')}"/>`;
  }
  // gases: thick labelled arrows through the pore, small molecules riding them
  const by = ey + ch + (P ? 70 : 66), iy = chy - 6, po = ey + ch * 0.5;
  const arrow = (d, col, id) => `<path d="${d}" style="fill:none;stroke:${W_};stroke-width:9;stroke-linecap:round;opacity:.7"/><path d="${d}" marker-end="url(#${id})" style="fill:none;stroke:${col};stroke-width:5;stroke-linecap:round"/>`;
  const dot = (col, rr = 5) => `<circle r="${rr}" style="fill:${col};stroke:${mx(col, INK, 50)};stroke-width:1.4"/><circle cx="-1.6" cy="-1.8" r="${n1(rr * 0.32)}" style="fill:${W_};opacity:.7"/>`;
  if (gas === 'flow') {
    const dC = `M${n1(cx - (P ? 128 : 190))} ${n1(by)}Q${n1(cx - 8)} ${n1(by - 4)} ${n1(cx - 3)} ${n1(po)}T${n1(cx - (P ? 40 : 54))} ${n1(iy - 18)}`;
    const dO = `M${n1(cx + (P ? 24 : 30))} ${n1(iy - 22)}Q${n1(cx + 4)} ${n1(ey - 6)} ${n1(cx + 3)} ${n1(po)}T${n1(cx + (P ? 120 : 186))} ${n1(by - 18)}`;
    const dV = `M${n1(cx - 4)} ${n1(iy + 2)}Q${n1(cx)} ${n1(ey - 2)} ${n1(cx)} ${n1(po)}T${n1(cx + (P ? 44 : 70))} ${n1(by + 34)}`;
    s += arrow(dC, CO2, 'so-ahC') + arrow(dO, O2, 'so-ahO') + arrow(dV, VAP, 'so-ahV');
    for (let i = 0; i < 3; i++) s += travel(dot(CO2), dC, { t: 2.6, d: 0.2 + i * 0.85 }) + travel(dot(O2, 4.6), dO, { t: 2.6, d: 0.5 + i * 0.85 }) + travel(dot(VAP, 4.4), dV, { t: 2.6, d: 0.8 + i * 0.85 });
  } else {
    // shut: the vapour stays inside the air space
    for (let i = 0; i < 7; i++) s += `<g transform="translate(${n1(cx - 40 + (i % 4) * 26 + (i > 3 ? 12 : 0))} ${n1(iy + 4 - (i > 3 ? 22 : 0))})">${dot(VAP, 5)}</g>`;
  }
  return { s, ey, ch, cx, by, py0, py1 };
}

export class StomaOpen extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 480;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 500;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A peel of the lower skin of a leaf under a microscope: jigsaw-shaped cells with several stomata, each a pore between two bean-shaped guard cells. Close up, the guard cells take in water and swell and the pore opens; they lose water and it closes. In a section, carbon dioxide goes in through the open pore while oxygen and water vapour come out. In hot, dry air the pore closes and the vapour stays inside.';
  static CONTROLS = [];

  open = 1; air = 'dry'; _moved = '';

  async setup() {
    await super.setup();
    bindFlow(this.root, { action: (a, v) => this._act(a, v) });
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs-head { min-height: 50px; }' + BODY_CSS
    + ' svg .so-swell { animation: so-swell .9s var(--look-spring-soft, ease-out) both; } @keyframes so-swell { from { transform: scaleX(.82); } }'
    + ' svg .so-shrink { animation: so-shrink .9s ease-out both; } @keyframes so-shrink { from { transform: scaleX(1.16); } }'; }
  stageHeight(st) { return st.portrait ? 430 : 400; }
  enter(step) { this.open = 1; this.air = 'dry'; this._moved = ''; }
  _act(a, v) {
    if (a === 'water' && this.stepIndex === 1) {
      const was = this.open; this.open = v === 'in' ? 1 : 0; this._moved = this.open > was ? 'so-swell' : this.open < was ? 'so-shrink' : '';
      this.repaint();
      if (this.open === 1 && was === 0 && !this._found) { this._found = true; this.celebrate(this.sv.W / 2, this.sv.H / 2); }
    } else if (a === 'air' && this.stepIndex === 3) { this.air = v; this.repaint(); }
  }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    const mk = (id, col) => `<marker id="${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M0 0L10 5L0 10Z" style="fill:${col}"/></marker>`;
    const defs = `<defs><radialGradient id="so-gc" cx=".34" cy=".28" r=".85"><stop offset="0" style="stop-color:${GRD_L}"/><stop offset=".55" style="stop-color:${GRD}"/><stop offset="1" style="stop-color:${GRD_D}"/></radialGradient>${mk('so-ahC', CO2)}${mk('so-ahO', O2)}${mk('so-ahV', VAP)}</defs>`;
    let s = defs, head = '';
    const fs = P ? 15 : 17;
    if (step === 0 || step === 1) {
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - (P ? 14 : 12);
      let body = '';
      if (step === 0) {
        const st0 = [[-0.42, -0.3, 0.8], [0.22, -0.46, 0.4], [0.5, 0.12, 0.9], [-0.1, 0.36, 0.6], [-0.6, 0.38, 0.2], [0.14, -0.04, 1]];
        const L = R * 0.34, holes = st0.map(([a, b]) => [cx + a * R, cy + b * R, L * 0.42, L * 0.58]);
        body += jigsaw(cx - R, cy - R, 2 * R, 2 * R, R * 0.3, 4, holes);
        st0.forEach(([a, b, op], i) => { body += guardPair(cx + a * R, cy + b * R, L, op, { seed: i + 2, k: 0.7 }); });
        s += eyepiece(W, H, cx, cy, R, body, { id: 'so-e0' });
        s += `<path d="M${n1(cx + R * 0.14 + L * 0.34)} ${n1(cy - R * 0.04)}L${n1(cx + R * 0.36)} ${n1(cy - R * 0.2)}" style="fill:none;stroke:${INK};stroke-width:2.4"/>` + label(cx + R * 0.38, cy - R * 0.22, 'stoma', { size: fs + 2, display: true, anchor: 'start' });
        s += label(cx - R * 0.36, cy + R * 0.12, 'epidermis cell', { size: fs });
      } else {
        const L = R * 1.3, holes = [[cx, cy, L * 0.36, L * 0.56]];
        body += jigsaw(cx - R, cy - R, 2 * R, 2 * R, R * 0.62, 7, holes);
        body += guardPair(cx, cy, L, this.open, { seed: 5, k: 1.4, anim: this._moved });
        if (this._moved === 'so-swell') for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1, yy = cy + (Math.floor(i / 2) - 1) * L * 0.22; body += travel(`<circle r="6" style="fill:url(#cw-wat) ${VAP};stroke:${mx('series-1', INK, 50)};stroke-width:1.4"/>`, `M${n1(cx + sx * R * 0.9)} ${n1(yy)}L${n1(cx + sx * L * 0.3)} ${n1(yy)}`, { t: 1, d: i * 0.1 }); }
        if (this._moved === 'so-shrink') for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1, yy = cy + (Math.floor(i / 2) - 1) * L * 0.22; body += travel(`<circle r="6" style="fill:url(#cw-wat) ${VAP};stroke:${mx('series-1', INK, 50)};stroke-width:1.4"/>`, `M${n1(cx + sx * L * 0.3)} ${n1(yy)}L${n1(cx + sx * R * 0.95)} ${n1(yy)}`, { t: 1, d: i * 0.1 }); }
        s += eyepiece(W, H, cx, cy, R, body, { id: 'so-e1' });
        const gx = cx - L * 0.24, lx = P ? 70 : cx - R - 6, ly = P ? H - 26 : cy - L * 0.32, px = P ? W - 74 : cx + R + 6, py = P ? H - 26 : cy + L * 0.3;
        s += `<path d="M${n1(lx + (P ? 0 : 30))} ${n1(ly + (P ? -16 : 6))}L${n1(gx)} ${n1(cy - L * 0.1)}" style="fill:none;stroke:${INK};stroke-width:2.4"/><circle cx="${n1(gx)}" cy="${n1(cy - L * 0.1)}" r="4" style="fill:${INK}"/>`;
        s += `<path d="M${n1(px - (P ? 0 : 30))} ${n1(py + (P ? -16 : -6))}L${n1(cx)} ${n1(cy + L * 0.06)}" style="fill:none;stroke:${INK};stroke-width:2.4"/><circle cx="${n1(cx)}" cy="${n1(cy + L * 0.06)}" r="4" style="fill:${INK}"/>`;
        s += label(lx, ly, 'guard cell', { size: fs + 1, display: true }) + label(px, py, this.open ? 'pore open' : 'pore closed', { size: fs + 1, display: true });
        head = flowChoiceHtml({ action: 'water', label: 'Guard cells', value: this.open ? 'in' : 'out', options: [{ value: 'in', label: 'Water in' }, { value: 'out', label: 'Water out' }] });
      }
      return { svg: cwFrame(st, 'so', s), head };
    }
    const shut = step === 3 && this.air === 'dry';
    const sec = section(W, H, P, shut ? 0 : 1, shut ? 'stop' : 'flow');
    s += sec.s;
    const oy = sec.ey + sec.ch + 22;
    s += label(P ? 10 : 14, sec.py1 + 16, 'inside the leaf', { size: fs, anchor: 'start' }) + label(P ? 10 : 14, oy, 'outside air', { size: fs, anchor: 'start' });
    s += label(sec.cx + (P ? 40 : 58), sec.ey - 12, 'air space', { size: P ? 14 : 15, anchor: 'start' });
    if (!shut) {
      s += label(sec.cx - (P ? 128 : 190), sec.by - 16, 'CO\u2082 in', { size: fs + 2, display: true, ink: mx(CO2, INK, 60) });
      s += label(sec.cx + (P ? 120 : 186), sec.by + 12, 'O\u2082 out', { size: fs + 2, display: true, ink: mx(O2, INK, 60) });
      s += P ? label(sec.cx + 10, H - 10, 'water vapour out', { size: fs, display: true, ink: mx(VAP, INK, 50) }) : label(sec.cx + 84, sec.by + 44, 'water vapour out', { size: fs, display: true, ink: mx(VAP, INK, 50), anchor: 'start' });
    } else {
      s += label(sec.cx + (P ? 0 : 60), sec.ey + sec.ch + (P ? 44 : 52), 'pore closed: less water lost', { size: fs, display: true });
    }
    if (step === 3) {
      // the weather outside: a hot sun or a soft damp haze
      const sx = W - (P ? 44 : 64), sy = H - (P ? 70 : 80);
      if (this.air === 'dry') {
        s += `<circle cx="${sx}" cy="${sy}" r="${P ? 22 : 28}" style="fill:${T('gold')};stroke:${mx('gold', 'flame', 40)};stroke-width:3"/>`;
        for (let i = 0; i < 8; i++) { const a = i * 0.785; s += `<path d="M${n1(sx + Math.cos(a) * (P ? 28 : 36))} ${n1(sy + Math.sin(a) * (P ? 28 : 36))}L${n1(sx + Math.cos(a) * (P ? 36 : 46))} ${n1(sy + Math.sin(a) * (P ? 36 : 46))}" style="fill:none;stroke:${T('gold')};stroke-width:4;stroke-linecap:round"/>`; }
      } else {
        for (let i = 0; i < 3; i++) s += `<ellipse cx="${n1(sx - i * 30)}" cy="${n1(sy + i * 8)}" rx="34" ry="12" style="fill:${W_};opacity:.65"/>`;
      }
      head = flowChoiceHtml({ action: 'air', label: 'Outside air', value: this.air, options: [{ value: 'damp', label: 'Cool, damp' }, { value: 'dry', label: 'Hot, dry' }] });
    }
    return { svg: cwFrame(st, 'so', s), head };
  }
}
