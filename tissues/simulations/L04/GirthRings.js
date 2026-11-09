// GirthRings - blk-l04-s10. The cut end of a teak log on a sawmill floor. A thin ring of dividing cells (lateral meristem)
// runs round the trunk just inside the bark. A years slider: each year the ring adds a layer of wood on its inside and new
// cells towards the bark on its outside, so the trunk grows wider and the rings stay circles with the same centre. Ring
// widths vary from year to year (made-up widths). A zoom strip shows the cells: wood, the dividing ring, the bark side.
// Beats: ring (light the ring), inside-outside (new cells both sides), answer (the trunk gets thicker; rings = age).
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, ctlBar, textureRect } from '../shared/PlantArt.js';
import { cwFrame, T, mx, n1, rnd, blobPath } from '../shared/CellWorld.js';
import { stDefs, STAIN } from '../shared/StemArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const INK = T('strata-6'), W_ = T('elev-peak');
const WIDTHS = [9, 11, 6, 12, 10, 5, 4, 11, 13, 7, 10, 8];   // made-up ring widths: wide in good years, narrow in poor ones
const PITH = 12, YEAR0 = [8, 8, 12];
const WOOD = mx('strata-2', 'strata-1', 60), WOOD_D = mx('strata-3', 'strata-2', 60), WOOD_L = mx('strata-1', W_, 60);
const BARK = mx('strata-3', INK, 58), BARK_D = mx('strata-3', INK, 30), CAMB = T('series-5');

function geom(y) {
  let r = PITH; const rings = [];
  for (let i = 0; i < y; i++) { rings.push([r, r + WIDTHS[i]]); r += WIDTHS[i]; }
  return { rings, camb: r, phl: r + 3 + y * 0.4, bark: r + 3 + y * 0.4 + 7 + y * 1.3 };
}
const MAXR = geom(12).bark;

function disc(cx, cy, k, years, o) {
  const g = geom(years), R = g.bark * k, q = rnd(3);
  const dimW = 1, dimC = o.dim('camb'), dimB = 1, veilW = o.dim('wood') < 1, veilB = o.dim('bark') < 1;
  let s = '';
  // the log behind the face: a cylinder going back to the upper right, its bark side shaded into depth and split by
  // long fissures that run along the log
  const ox = R * 0.5, oy = -R * 0.16, ol = Math.hypot(ox, oy), nx = -oy / ol, ny = ox / ol;
  const P1 = [cx + nx * R, cy + ny * R], P2 = [cx - nx * R, cy - ny * R];
  const side = `M${n1(P1[0])} ${n1(P1[1])}L${n1(P1[0] + ox)} ${n1(P1[1] + oy)}L${n1(P2[0] + ox)} ${n1(P2[1] + oy)}L${n1(P2[0])} ${n1(P2[1])}Z`;
  const back = `M${n1(cx + ox + R)} ${n1(cy + oy)}A${n1(R)} ${n1(R)} 0 1 0 ${n1(cx + ox - R)} ${n1(cy + oy)}A${n1(R)} ${n1(R)} 0 1 0 ${n1(cx + ox + R)} ${n1(cy + oy)}Z`;
  s += `<ellipse cx="${n1(cx + R * 0.36)}" cy="${n1(cy + R * 0.98)}" rx="${n1(R * 1.3)}" ry="${n1(R * 0.14)}" style="fill:${INK};opacity:.32;filter:url(#pa-soft)"/>`;
  s += `<defs><linearGradient id="gr-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('strata-3', W_, 60)}"/><stop offset=".4" style="stop-color:${mx('strata-3', 'strata-2', 70)}"/><stop offset="1" style="stop-color:${mx('strata-3', INK, 22)}"/></linearGradient><clipPath id="gr-sc"><path d="${side}"/><path d="${back}"/></clipPath></defs>`;
  s += `<path d="${back}" style="fill:url(#gr-side) ${BARK}"/><path d="${side}" style="fill:url(#gr-side) ${BARK}"/>`;
  let fis = '', rid = '';
  for (let i = 0; i < 34; i++) {
    const t = -1 + (i + 0.5) / 17 + (q() - 0.5) * 0.04, sx = cx + nx * R * t * 1.02, sy = cy + ny * R * t * 1.02, w1 = (q() - 0.5) * R * 0.06, w2 = (q() - 0.5) * R * 0.06;
    const d = `M${n1(sx - ox * 0.1)} ${n1(sy - oy * 0.1)}C${n1(sx + ox * 0.5 + nx * w1)} ${n1(sy + oy * 0.5 + ny * w1)} ${n1(sx + ox * 1.1 + nx * w2)} ${n1(sy + oy * 1.1 + ny * w2)} ${n1(sx + ox * 2.2)} ${n1(sy + oy * 2.2)}`;
    if (i % 2) fis += d; else rid += d;
  }
  s += `<g clip-path="url(#gr-sc)"><path d="${fis}" style="fill:none;stroke:${INK};stroke-width:${n1(Math.max(2.4, R * 0.04))};stroke-linecap:round;opacity:.55"/><path d="${rid}" style="fill:none;stroke:${mx('strata-3', W_, 55)};stroke-width:${n1(Math.max(1.6, R * 0.022))};stroke-linecap:round;opacity:.55"/>`
    + `<path d="M${n1(P2[0])} ${n1(P2[1])}L${n1(P2[0] + ox)} ${n1(P2[1] + oy)}" style="stroke:${W_};stroke-width:${n1(R * 0.05)};opacity:.22;filter:url(#cw-blur3)"/></g>`;
  s += `<path d="${back}" style="fill:none;stroke:${mx('strata-3', INK, 30)};stroke-width:2;clip-path:none"/>`;
  // bark: a ridged ring
  const barkD = blobPath(cx, cy, R, R, 11, 0.025, 40);
  s += `<g opacity="${dimB}"><path d="${barkD}" style="fill:${BARK};stroke:${mx('strata-3', INK, 20)};stroke-width:2.4"/>`;
  for (let i = 0; i < 64; i++) { const a = (i / 64) * 6.283 + q() * 0.05, r0 = g.phl * k + 2, r1 = R - 1; s += `<path d="M${n1(cx + Math.cos(a) * r0)} ${n1(cy + Math.sin(a) * r0)}L${n1(cx + Math.cos(a) * r1)} ${n1(cy + Math.sin(a) * r1)}" style="stroke:${q() < 0.5 ? BARK_D : mx('strata-3', W_, 70)};stroke-width:${n1(1 + q() * 1.6)};opacity:.6"/>`; }
  s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(g.phl * k)}" style="fill:${mx('strata-1', 'elev-low', 70)};stroke:${mx('strata-3', INK, 40)};stroke-width:1.2"/></g>`;
  // wood: one ring per year, early wood pale, late wood dark at its outer edge; rays across
  let w = `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(g.camb * k)}" style="fill:${WOOD}"/>`;
  for (let i = g.rings.length - 1; i >= 0; i--) {
    const [r0, r1] = g.rings[i], ro = r1 * k, ri = r0 * k, late = Math.max(1.6, (r1 - r0) * k * 0.28);
    w += `<path d="${blobPath(cx, cy, ro, ro, 20 + i, 0.012, 24)}" style="fill:${i === o.newRing ? mx(WOOD_L, 'gold', 70) : WOOD_L};stroke:${WOOD_D};stroke-width:${n1(late)}"/>`;
    w += `<path d="${blobPath(cx, cy, ri + (ro - ri) * 0.5, ri + (ro - ri) * 0.5, 20 + i, 0.012, 24)}" style="fill:none;stroke:${WOOD};stroke-width:${n1((ro - ri) * 0.5)};opacity:.5"/>`;
  }
  w += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(PITH * k)}" style="fill:${mx('strata-3', 'strata-2', 50)};stroke:${WOOD_D};stroke-width:1.4"/>`;
  for (let i = 0; i < 40; i++) { const a = (i / 40) * 6.283 + q() * 0.1, r0 = PITH * k + (i % 3) * 8, r1 = g.camb * k - 1; if (r1 > r0) w += `<path d="M${n1(cx + Math.cos(a) * r0)} ${n1(cy + Math.sin(a) * r0)}L${n1(cx + Math.cos(a) * r1)} ${n1(cy + Math.sin(a) * r1)}" style="stroke:${WOOD_L};stroke-width:1;opacity:.7"/>`; }
  w += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(g.camb * k)}" style="fill:${T('strata-6')};opacity:.18;filter:url(#pa-grain)"/>`;
  w += `<path d="M${n1(cx - g.camb * k * 0.8)} ${n1(cy - g.camb * k * 0.3)}A${n1(g.camb * k * 0.86)} ${n1(g.camb * k * 0.86)} 0 0 1 ${n1(cx - g.camb * k * 0.3)} ${n1(cy - g.camb * k * 0.8)}" style="fill:none;stroke:${W_};stroke-width:3;opacity:.35"/>`;
  s += `<g opacity="${dimW}">${w}</g>`;
  const vc = mx('strata-1', W_, 40);
  if (veilW) s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(g.camb * k - 1)}" style="fill:${vc};opacity:.55"/>`;
  if (veilB) s += `<path d="${barkD}M${n1(cx + g.camb * k + 3)} ${n1(cy)}A${n1(g.camb * k + 3)} ${n1(g.camb * k + 3)} 0 1 0 ${n1(cx - g.camb * k - 3)} ${n1(cy)}A${n1(g.camb * k + 3)} ${n1(g.camb * k + 3)} 0 1 0 ${n1(cx + g.camb * k + 3)} ${n1(cy)}Z" style="fill:${vc};opacity:.55;fill-rule:evenodd"/>`;
  // cambium: the ring of dividing cells
  s += `<g opacity="${dimC}">${o.lit === 'camb' ? `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(g.camb * k + 1.5)}" style="fill:none;stroke:${T('gold')};stroke-width:10;opacity:.5;filter:url(#cw-blur3)"/>` : ''}<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(g.camb * k + 1.5)}" style="fill:none;stroke:${CAMB};stroke-width:3.6"/></g>`;
  return { svg: s, R, camb: g.camb * k, phl: g.phl * k };
}

// the zoom strip: radial files of cells across the ring, inside on the left, bark side on the right.
// Wood: xylem with thick lignified walls, empty, pits through the walls, one wide vessel. Then the dividing ring: thin
// flat cells in their radial files, one splitting. Phloem: sieve tubes with sieve plates, small companion cells. Bark:
// flattened cork cells in tight stacks, dark walls.
function zoom(x, y, w, h, years, o) {
  const q = rnd(4), kinds = [['wood', 1.25], ['wood', 1.25], ['wood', 1.25], ['wood', 1.1], ['camb', 0.42], ['camb', 0.42], ['camb', 0.42], ['phl', 1], ['phl', 1], ['bark', 0.55], ['bark', 0.55], ['bark', 0.55]];
  const tot = kinds.reduce((a, b) => a + b[1], 0), u = w / tot, xs = [x];
  for (const [, f] of kinds) xs.push(xs[xs.length - 1] + f * u);
  const rows = 5, rh = h / rows;
  let s = `<rect x="${n1(x + 4)}" y="${n1(y + 6)}" width="${n1(w)}" height="${n1(h)}" rx="16" style="fill:${INK};opacity:.22"/><clipPath id="gr-z"><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="16"/></clipPath><g clip-path="url(#gr-z)"><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" style="fill:${mx('strata-1', W_, 30)}"/>`;
  const groups = { wood: '', camb: '', bark: '' };
  kinds.forEach(([kind], j) => {
    const x0 = xs[j], cw = xs[j + 1] - x0;
    let g = '';
    for (let i = 0; i < rows; i++) {
      const jit = (q() - 0.5) * rh * 0.16, y0 = y + i * rh + (i ? jit : 0) - 2, ch = rh + 2;
      if (kind === 'wood') {
        if (j === 1 && i === 2) continue;   // the vessel sits here
        const ww = Math.max(3, cw * 0.17);
        g += `<rect x="${n1(x0 + 1)}" y="${n1(y0 + 1)}" width="${n1(cw - 2)}" height="${n1(ch - 2)}" rx="5" style="fill:url(#st-hollow) ${W_};stroke:${STAIN.lig};stroke-width:${n1(ww)}"/>`
          + `<rect x="${n1(x0 + 1 + ww / 2)}" y="${n1(y0 + 1 + ww / 2)}" width="${n1(cw - 2 - ww)}" height="${n1(ch - 2 - ww)}" rx="3" style="fill:none;stroke:${STAIN.ligL};stroke-width:1;opacity:.8"/>`;
        // pits: small gaps right through the thick wall, paired with the next cell
        for (const py of [0.32, 0.68]) g += `<rect x="${n1(x0 + cw - ww / 2 - 2)}" y="${n1(y0 + ch * py - 2.4)}" width="${n1(ww + 2)}" height="4.8" rx="2" style="fill:${W_}"/>`;
        g += `<rect x="${n1(x0 + cw * 0.3)}" y="${n1(y0 + ch - ww / 2 - 2)}" width="5" height="${n1(ww + 2)}" rx="2" style="fill:${W_}"/>`;
      } else if (kind === 'camb') {
        g += `<rect x="${n1(x0 + 0.8)}" y="${n1(y0 + 1)}" width="${n1(cw - 1.6)}" height="${n1(ch - 2)}" rx="2" style="fill:url(#st-camb) ${STAIN.camb};stroke:${STAIN.cellD};stroke-width:1.1"/><ellipse cx="${n1(x0 + cw / 2)}" cy="${n1(y0 + ch / 2)}" rx="${n1(cw * 0.26)}" ry="${n1(ch * 0.2)}" style="fill:url(#st-nuc) ${STAIN.nuc}"/>`;
        if ((i * 3 + j) % 4 === 0) g += `<path d="M${n1(x0 + 2)} ${n1(y0 + ch / 2)}H${n1(x0 + cw - 2)}" style="stroke:${STAIN.cellD};stroke-width:1.4;stroke-dasharray:2 2"/>`;
      } else if (kind === 'phl') {
        const sw = cw * 0.72;
        g += `<rect x="${n1(x0 + 1)}" y="${n1(y0 + 1)}" width="${n1(sw - 1)}" height="${n1(ch - 2)}" rx="4" style="fill:${mx(STAIN.lumenG, 'sea-shallow', 86)};stroke:${STAIN.cellD};stroke-width:1.6"/>`;
        // the sieve plate: a cross wall with pores
        g += `<path d="M${n1(x0 + 3)} ${n1(y0 + ch * 0.5)}H${n1(x0 + sw - 2)}" style="stroke:${STAIN.cellD};stroke-width:2.6"/>`;
        for (let p = 0; p < 4; p++) g += `<circle cx="${n1(x0 + 5 + p * (sw - 8) / 3.4)}" cy="${n1(y0 + ch * 0.5)}" r="1.3" style="fill:${W_}"/>`;
        g += `<rect x="${n1(x0 + sw + 0.5)}" y="${n1(y0 + ch * 0.18)}" width="${n1(cw - sw - 1.5)}" height="${n1(ch * 0.64)}" rx="3" style="fill:url(#st-camb) ${STAIN.camb};stroke:${STAIN.cellD};stroke-width:1"/><circle cx="${n1(x0 + sw + (cw - sw) / 2)}" cy="${n1(y0 + ch * 0.5)}" r="${n1(Math.max(1.5, (cw - sw) * 0.22))}" style="fill:${STAIN.nuc}"/>`;
      } else {
        // cork: flattened cells stacked, two to a file height, thick dark walls, empty
        for (let k2 = 0; k2 < 2; k2++) g += `<rect x="${n1(x0 + 0.8)}" y="${n1(y0 + 1 + k2 * ch / 2)}" width="${n1(cw - 1.6)}" height="${n1(ch / 2 - 2)}" rx="2" style="fill:${mx('strata-3', 'strata-2', 46)};stroke:${BARK_D};stroke-width:2"/><path d="M${n1(x0 + 3)} ${n1(y0 + 4 + k2 * ch / 2)}H${n1(x0 + cw - 3)}" style="stroke:${mx('strata-2', W_, 50)};stroke-width:1;opacity:.6"/>`;
      }
    }
    groups[kind === 'phl' ? 'bark' : kind] += g;
  });
  // one wide vessel in the wood: hollow, its wall thickened in rings
  const vx = (xs[1] + xs[2]) / 2, vy = y + rh * 2.5, vr = Math.min(xs[2] - xs[1], rh) * 0.62;
  groups.wood += `<circle cx="${n1(vx)}" cy="${n1(vy)}" r="${n1(vr)}" style="fill:url(#st-hollow) ${W_};stroke:${STAIN.lig};stroke-width:${n1(vr * 0.22)}"/><circle cx="${n1(vx)}" cy="${n1(vy)}" r="${n1(vr * 0.74)}" style="fill:none;stroke:${STAIN.lig};stroke-width:1.4;stroke-dasharray:2 3;opacity:.8"/>`;
  s += `<g opacity="${o.dim('wood')}">${groups.wood}</g><g opacity="${o.dim('camb')}">${groups.camb}</g><g opacity="${o.dim('bark')}">${groups.bark}</g>`;
  s += `${textureRect(x, y, w, h, 'grain', 0.08)}</g><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="16" style="fill:none;stroke:${mx('strata-5', INK, 40)};stroke-width:2.6"/>`;
  return { svg: s, cx: (xs[4] + xs[7]) / 2, cw: u, wood: (xs[0] + xs[4]) / 2, bark: (xs[7] + xs[12]) / 2, campL: xs[4], campR: xs[7] };
}
const arrowH = (x0, x1, y, col) => { const d = x1 > x0 ? 1 : -1; return `<path d="M${n1(x0)} ${n1(y)}H${n1(x1 - d * 10)}" style="stroke:${col};stroke-width:5;stroke-linecap:round"/><path d="M${n1(x1)} ${n1(y)}l${-d * 14} -9v18Z" style="fill:${col};stroke:${INK};stroke-width:1.4"/>`; };

export class GirthRings extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 680;
  static HEIGHT = 482;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 600;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'The cut end of a teak log. A thin violet ring of dividing cells, the lateral meristem, runs round the trunk just inside the bark. Move the years slider: each year a new ring of wood forms inside the ring and new cells form towards the bark outside, so the log grows wider. The number of rings equals the age.';
  static CONTROLS = [];

  async setup() {
    this._y = YEAR0[0]; this._new = -1;
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'range', id: 'years', label: 'Years', min: 1, max: 12, step: 1, value: this._y, read: (v) => `${v}`, say: (v) => `${v} years` }], (id, v) => { this._new = v > this._y ? v - 1 : -1; this._y = v; this.repaint(); });
  }
  enter(step) { this._y = YEAR0[step] ?? 6; this._new = -1; this.ctl?.set('years', this._y); }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 496 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, y = this._y, fs = P ? 15 : 16;
    const lit = step === 0 ? 'camb' : null, dim = (p) => (lit && p !== lit ? 0.42 : 1);
    // a sawmill floor: planks under sawdust, light from the left
    let s = `<defs>${stDefs()}<radialGradient id="gr-floor" cx=".3" cy=".3" r=".9"><stop offset="0" style="stop-color:${mx('strata-1', W_, 40)}"/><stop offset="1" style="stop-color:${mx('strata-2', 'strata-1', 50)}"/></radialGradient></defs>`;
    s += `<rect width="${W}" height="${H}" style="fill:url(#gr-floor) ${T('strata-1')}"/>`;
    for (let i = 1; i < 6; i++) s += `<path d="M0 ${n1((H * i) / 6)}H${W}" style="stroke:${mx('strata-3', 'strata-1', 40)};stroke-width:2;opacity:.35"/>`;
    s += textureRect(0, 0, W, H, 'fibre', 0.18);
    const q = rnd(9); for (let i = 0; i < 70; i++) s += `<circle cx="${n1(q() * W)}" cy="${n1(q() * H)}" r="${n1(1 + q() * 2)}" style="fill:${mx('strata-1', W_, 50)};opacity:.7"/>`;
    const k = (P ? 122 : 180) / MAXR, cx = P ? W * 0.46 : W * 0.3, cy = P ? 150 : H * 0.48;
    const d = disc(cx, cy, k, y, { dim, lit, newRing: this._new });
    s += d.svg;
    // the zoom strip and where it comes from
    const zx = P ? 16 : W * 0.6, zy = P ? 330 : 70, zw = P ? W - 32 : W * 0.37, zh = P ? 96 : 170;
    const z = zoom(zx, zy, zw, zh, y, { dim });
    const mxp = cx + d.camb * 0.71, myp = cy - d.camb * 0.71;
    s += `<rect x="${n1(mxp - 9)}" y="${n1(myp - 9)}" width="18" height="18" rx="3" style="fill:none;stroke:${INK};stroke-width:2.4"/><path d="M${n1(mxp + 9)} ${n1(myp - 9)}L${n1(zx)} ${n1(zy)}M${n1(mxp + 9)} ${n1(myp + 9)}L${n1(zx)} ${n1(zy + zh)}" style="stroke:${INK};stroke-width:1.6;stroke-dasharray:5 5;opacity:.6"/>`;
    s += z.svg;
    s += label(z.wood, zy - 10, 'wood', { size: fs }) + label(z.bark, zy - 10, 'bark side', { size: fs });
    s += label(z.cx, zy + zh + (P ? 22 : 26), 'dividing cells', { size: fs, ink: T('series-5') });
    if (step >= 1) {
      const ay = zy + zh * 0.5, hi = z.wood - z.cw * 0.6, ho = z.bark + z.cw * 0.3;
      s += arrowH(z.campL + 4, hi, ay, T('series-2')) + arrowH(z.campR - 4, ho, ay, T('series-3'));
      s += label(Math.max(zx + 64, hi + 6), ay - 18, 'new cells inside', { size: fs - 1 }) + label(Math.min(zx + zw - 46, ho - 4), ay - 18, 'and outside', { size: fs - 1 });
    }
    // labels on the log
    if (step === 0) {
      const a = -2.2, ax = cx + Math.cos(a) * d.camb, ay = cy + Math.sin(a) * d.camb, lx = Math.max(80, cx - d.R * 0.75), ly = Math.max(24, cy - d.R - 14);
      s += `<path d="M${n1(lx)} ${n1(ly + 6)}L${n1(ax)} ${n1(ay)}" style="stroke:${INK};stroke-width:2.4"/><circle cx="${n1(ax)}" cy="${n1(ay)}" r="4" style="fill:${INK};stroke:${W_};stroke-width:1.4"/>` + label(lx, ly, 'lateral meristem', { size: fs + 1, display: true });
    }
    const ctr = `${y} ${y === 1 ? 'ring' : 'rings'}`;
    s += label(cx, cy + d.R + (P ? 26 : 34), step === 2 ? `${ctr}: ${y} ${y === 1 ? 'year' : 'years'} old` : ctr, { size: P ? 17 : 19, display: true });
    s += label(P ? W - 12 : W - 14, P ? 22 : H - 12, 'made-up ring widths', { size: 14, anchor: 'end', ink: T('strata-5') });
    return { svg: cwFrame(st, 'gr', s) };
  }
  destroy() { this.ctl?.destroy(); super.destroy(); }
}
