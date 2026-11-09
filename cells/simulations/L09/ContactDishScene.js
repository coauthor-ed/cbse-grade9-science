// ContactDishScene - blk-l07-s10b. A culture dish from above on a lab mat. Cells are drawn as cells: each is the part of
// the dish nearer its own centre than any neighbour's (so touching cells meet along shared edges), capped by how far one
// cell can spread, with a lit cytoplasm, a nucleus and a nucleolus, and sizes that vary.
// Beat 0: a full sheet; three old cells shrink, round up and go, and new cells (green) fill their places.
// Beat 1: a few spread cells divide until the sheet touches on all sides, then the count stops.
// Beat 2: the same full sheet; one patch has lost the control and keeps dividing, piling up on top. Some cells in the
//         pile are caught mid-division (two nuclei, pinched waist). Calm colours: no alarm, no monster, no score.
// Beat 3: plant tissue: walled cells in rows, each with a large vacuole and a nucleus at the side.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, labelWhite, anim, stroke } from '../shared/PlantArt.js';
import { cwFrame, blobPath, T, mx, n1, rnd } from '../shared/CellWorld.js';

const one = (idx) => [{ idx, dwellMs: null }];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Seeds on a jittered hex grid inside the dish, sizes varied.
function seeds(cx, cy, R, r, seed) {
  const q = rnd(seed), out = [], dy = r * 1.5, dx = r * 1.732;
  for (let j = -14; j <= 14; j++) for (let i = -14; i <= 14; i++) {
    const x = cx + (i + (j % 2 ? 0.5 : 0)) * dx + (q() - 0.5) * dx * 0.42, y = cy + j * dy + (q() - 0.5) * dy * 0.42;
    if (Math.hypot(x - cx, y - cy) < R - r * 0.4) out.push({ x, y, k: 0.86 + q() * 0.32, s: Math.floor(q() * 90), rot: q() * 180 });
  }
  return out;
}
// The cell of p among others, inside a wobbly disc of radius rm round p. gap: half the space between two neighbours.
function vcell(p, others, rm, gap) {
  const n = 16, w = rnd(p.s + 3);
  let poly = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = rm * (0.9 + w() * 0.18); poly.push([p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr]); }
  for (const o of others) {
    if (o === p) continue;
    const dx = o.x - p.x, dy = o.y - p.y, d2 = dx * dx + dy * dy;
    if (d2 > 4 * rm * rm) continue;
    const d = Math.sqrt(d2), lim = d2 / 2 - gap * d, inside = (v) => (v[0] - p.x) * dx + (v[1] - p.y) * dy <= lim, out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ia = inside(a), ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) { const fa = (a[0] - p.x) * dx + (a[1] - p.y) * dy - lim, fb = (b[0] - p.x) * dx + (b[1] - p.y) * dy - lim, u = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
    }
    poly = out;
    if (poly.length < 3) return null;
  }
  return poly;
}
// Rounded closed path: through edge midpoints, corners as control points.
function smooth(poly) {
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = poly.length, m0 = m(poly[n - 1], poly[0]);
  let d = `M${n1(m0[0])} ${n1(m0[1])}`;
  for (let i = 0; i < n; i++) { const c = poly[i], e = m(c, poly[(i + 1) % n]); d += `Q${n1(c[0])} ${n1(c[1])} ${n1(e[0])} ${n1(e[1])}`; }
  return `${d}Z`;
}
const centre = (poly) => { let x = 0, y = 0; for (const v of poly) { x += v[0]; y += v[1]; } return [x / poly.length, y / poly.length]; };
const inset = (poly, c, k) => poly.map((v) => [c[0] + (v[0] - c[0]) * k, c[1] + (v[1] - c[1]) * k]);

const CYTO = mx('membrane', 'elev-peak', 40), RIM = mx('membrane', 'strata-6', 62), NEWC = mx('elev-low', 'elev-peak', 30), NEWR = mx('elev-low', 'strata-6', 58);
const OLD = mx('strata-1', 'strata-3', 70), OLDR = mx('strata-3', 'strata-5', 60);
const PILE = mx('series-5', 'elev-peak', 52), PILER = mx('series-5', 'strata-6', 60);
function nucleus(x, y, r, rot, o = {}) {
  return `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(r)}" ry="${n1(r * 0.82)}" transform="rotate(${n1(rot)} ${n1(x)} ${n1(y)})" style="fill:url(#cw-nucIn) ${mx('series-5', 'elev-peak', 40)};stroke:${o.ring ?? mx('series-5', 'strata-6', 70)};stroke-width:1.3;stroke-opacity:.8"/>`
    + `<circle cx="${n1(x + r * 0.22)}" cy="${n1(y + r * 0.12)}" r="${n1(r * 0.3)}" style="fill:url(#cw-nucleolus) ${T('series-5')}"/><ellipse cx="${n1(x - r * 0.3)}" cy="${n1(y - r * 0.36)}" rx="${n1(r * 0.34)}" ry="${n1(r * 0.16)}" style="fill:${T('elev-peak')};opacity:.6"/>`;
}
// One animal cell from its outline. o.fill, o.rim, o.a, o.nk nucleus scale.
function animalCell(poly, p, r, o = {}) {
  const c = centre(poly), d = smooth(poly), nr = r * 0.36 * (o.nk ?? 1) * p.k;
  let s = `<path d="${d}" style="fill:${o.fill ?? CYTO};stroke:${o.rim ?? RIM};stroke-width:1.6"/>`;
  s += `<path d="${smooth(inset(poly, [c[0] - r * 0.12, c[1] - r * 0.14], 0.7))}" style="fill:${T('elev-peak')};opacity:.32"/>`;
  const q = rnd(p.s + 11);
  for (let i = 0; i < 4; i++) { const a = q() * 6.28, k = 0.45 + q() * 0.3; s += `<circle cx="${n1(c[0] + Math.cos(a) * r * k)}" cy="${n1(c[1] + Math.sin(a) * r * k * 0.8)}" r="${n1(0.9 + q() * 1.1)}" style="fill:${T('sea-deep')};opacity:.28"/>`; }
  s += nucleus(c[0], c[1], nr, p.rot);
  return o.a !== undefined ? `<g opacity="${o.a}">${s}</g>` : s;
}
// A rounded cell that sits on top of the sheet (piled up); o.split 0..1 draws it pinching into two.
function piledCell(x, y, r, seed, o = {}) {
  const sp = o.split ?? 0;
  const sh = `<ellipse cx="${n1(x + 3)}" cy="${n1(y + 5)}" rx="${n1(r * (1 + 0.3 * sp))}" ry="${n1(r * 0.9)}" style="fill:${T('strata-6')};opacity:.22;filter:url(#cw-blur1)"/>`;
  if (sp <= 0) return sh + `<path d="${blobPath(x, y, r, r * 0.94, seed, 0.05, 9)}" style="fill:url(#cw-cyto) ${PILE};stroke:${PILER};stroke-width:1.6"/>` + nucleus(x, y, r * 0.42, seed * 20, { ring: PILER });
  const a = r * 0.52, w = r * (0.78 - 0.18 * sp);
  const d = `M${n1(x - a - r * 0.8)} ${n1(y)}C${n1(x - a - r * 0.8)} ${n1(y - r)} ${n1(x - r * 0.2)} ${n1(y - r)} ${n1(x)} ${n1(y - w)}C${n1(x + r * 0.2)} ${n1(y - r)} ${n1(x + a + r * 0.8)} ${n1(y - r)} ${n1(x + a + r * 0.8)} ${n1(y)}C${n1(x + a + r * 0.8)} ${n1(y + r)} ${n1(x + r * 0.2)} ${n1(y + r)} ${n1(x)} ${n1(y + w)}C${n1(x - r * 0.2)} ${n1(y + r)} ${n1(x - a - r * 0.8)} ${n1(y + r)} ${n1(x - a - r * 0.8)} ${n1(y)}Z`;
  return sh + `<path d="${d}" style="fill:url(#cw-cyto) ${PILE};stroke:${PILER};stroke-width:1.6"/>` + nucleus(x - a, y, r * 0.36, 10, { ring: PILER }) + nucleus(x + a, y, r * 0.36, 170, { ring: PILER });
}

export class ContactDishScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 424;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A culture dish seen from above. A sheet of cells in which old cells are replaced by new ones. Then a few cells divide across the dish until they touch on all sides, and division stops. Then a patch of cells keeps dividing and piles up on the sheet. Last, plant cells with walls in neat rows.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 410; }
  enter(step) { if (step === 0 || step === 1 || step === 2) this.play(step === 1 ? 4 : 3); }
  _geo(st) {
    const P = st.portrait, key = `${st.W}x${st.H}`;
    if (this._geoKey === key) return this._geoVal;
    const R = P ? 146 : 180, cx = st.W / 2, cy = st.H / 2 - (P ? 20 : 14), r = P ? 17 : 19;
    const all = seeds(cx, cy, R, r, 5);
    const sd = [[-0.4, -0.3], [0.45, -0.1], [-0.1, 0.5], [0.3, 0.5], [-0.5, 0.25]].map(([a, b]) => [cx + a * R * 0.8, cy + b * R * 0.8]);
    const order = all.map((c, i) => ({ i, d: Math.min(...sd.map((s) => Math.hypot(c.x - s[0], c.y - s[1]))) })).sort((a, b) => a.d - b.d).map((o) => o.i);
    const old = [Math.floor(all.length * 0.22), Math.floor(all.length * 0.55), Math.floor(all.length * 0.8)];
    this._geoKey = key;
    this._geoVal = { P, R, cx, cy, r, all, order, old };
    return this._geoVal;
  }
  paint(st) {
    const W = st.W, H = st.H, g = this._geo(st), { R, cx, cy } = g;
    let s = `<defs><radialGradient id="cd-mat" cx=".3" cy=".2" r=".95"><stop offset="0" style="stop-color:${mx('strata-4', 'sea-deep', 50)}"/><stop offset="1" style="stop-color:${mx('strata-6', 'sea-deep', 60)}"/></radialGradient></defs>`;
    s += `<rect width="${W}" height="${H}" style="fill:url(#cd-mat) ${mx('strata-5', 'sea-deep', 56)}"/><rect width="${W}" height="${H}" style="fill:${T('strata-6')};opacity:.1;filter:url(#pa-grain)"/>`;
    s += `<circle cx="${n1(cx + 8)}" cy="${n1(cy + 12)}" r="${R + 14}" style="fill:${T('strata-6')};opacity:.45;filter:url(#pa-soft)"/>`;
    s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R + 12}" style="fill:${mx('sea-shallow', 'elev-peak', 30)};opacity:.45;stroke:${mx('sea-shallow', 'elev-peak', 60)};stroke-width:3"/>`;
    s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R + 1}" style="fill:${mx('series-6', 'elev-peak', 14)}"/><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R + 1}" style="fill:${T('strata-6')};opacity:.08;filter:url(#cw-mott)"/>`;
    s += `<clipPath id="cd-c"><circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R}"/></clipPath><g clip-path="url(#cd-c)" data-anim="cells">${this._cells(g, this.clock ?? 0)}</g>`;
    s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${R + 6}" style="fill:none;stroke:${mx('sea-shallow', 'strata-6', 40)};stroke-width:2;opacity:.5"/>`;
    s += `<path d="M${n1(cx - R * 0.74)} ${n1(cy - R * 0.7)}A${R + 6} ${R + 6} 0 0 1 ${n1(cx + R * 0.12)} ${n1(cy - R - 5)}" ${stroke(T('elev-peak'), 5, 'opacity:.75')}/>`;
    s += `<path d="M${n1(cx + R * 0.82)} ${n1(cy + R * 0.5)}A${R + 6} ${R + 6} 0 0 1 ${n1(cx + R * 0.5)} ${n1(cy + R * 0.84)}" ${stroke(T('elev-peak'), 3, 'opacity:.45')}/>`;
    s += `<g data-anim="line">${this._line(st, g, this.clock ?? 0)}</g>`;
    return { svg: cwFrame(st, 'cd', s) };
  }
  _line(st, g, t) {
    const step = this.stepIndex, d = (step === 1 && t >= 3.9) ? 'All touching: division stops' : ['Green: new cells in place of old', 'Cells divide and spread until they touch', 'One patch keeps dividing', 'Plant cells in their walls'][step];
    return labelWhite(st.W / 2, st.H - (g.P ? 12 : 14), d, { size: g.P ? 17 : 21, display: true });
  }
  _cells(g, t) {
    const step = this.stepIndex, { r, all, order, old, cx, cy, R } = g, rm = r * 1.3;
    let s = '';
    if (step === 3) return this._plant(g);
    if (step === 1) {
      const nf = 5 + (all.length - 5) * clamp(t / 3.8, 0, 1), n = Math.min(all.length, Math.ceil(nf));
      const here = order.slice(0, n).map((i) => all[i]);
      here.forEach((p, k) => {
        const grow = clamp((nf - k) / 6, 0.45, 1), poly = vcell(p, here, rm * 1.25 * grow, 1.2);
        if (poly) s += animalCell(poly, p, r * (0.8 + 0.2 * grow));
      });
      return s;
    }
    const u = step === 0 ? clamp(t / 3, 0, 1) : 1;
    all.forEach((p, i) => {
      const isOld = old.includes(i);
      if (step === 0 && isOld) {
        if (u < 0.55) {
          const poly = vcell(p, all, rm * (1 - u * 1.1), 1.2 + u * 6);
          if (poly) s += animalCell(poly, p, r * 0.9, { fill: OLD, rim: OLDR, a: n1(1 - u * 1.4), nk: 0.8 });
        }
        if (u > 0.3) {
          const k = clamp((u - 0.3) / 0.7, 0, 1), poly = vcell(p, all, rm * (0.45 + 0.55 * k), 1.2);
          if (poly) s += animalCell(poly, p, r * (0.6 + 0.4 * k), { fill: NEWC, rim: NEWR });
        }
        return;
      }
      const poly = vcell(p, all, rm, 1.2);
      if (poly) s += animalCell(poly, p, r);
    });
    if (step === 2) {
      const px = cx + R * 0.3, py = cy - R * 0.16, q = rnd(8), n = Math.round(5 + 33 * clamp(t / 3, 0, 1));
      for (let k = 0; k < n; k++) {
        const a = k * 2.4, d = Math.sqrt(k / 38) * r * 3.8, x = px + Math.cos(a) * d + (q() - 0.5) * 4, y = py + Math.sin(a) * d * 0.9;
        s += piledCell(x, y, r * (0.62 + q() * 0.18), 3 + (k % 9), { split: k % 7 === 3 ? 0.6 : 0 });
      }
    }
    return s;
  }
  _plant(g) {
    const { cx, cy, R, r } = g, q = rnd(17), w = r * 3.1, h = r * 2.0, pts = [];
    for (let j = -8; j <= 8; j++) for (let i = -6; i <= 6; i++) {
      const x = cx + i * w + (j % 2 ? w / 2 : 0) + (q() - 0.5) * w * 0.12, y = cy + j * h + (q() - 0.5) * h * 0.1;
      if (Math.hypot(x - cx, y - cy) < R + w) pts.push({ x, y, s: Math.floor(q() * 90), k: 1, rot: 0, side: q() < 0.5 ? -1 : 1 });
    }
    const WALL = mx('elev-low', 'strata-6', 70), WALLL = mx('elev-low', 'elev-peak', 30);
    const straight = (poly) => `M${poly.map((v) => `${n1(v[0])} ${n1(v[1])}`).join('L')}Z`;
    let s = `<rect x="${n1(cx - R)}" y="${n1(cy - R)}" width="${n1(2 * R)}" height="${n1(2 * R)}" style="fill:${WALL}"/>`;
    // stretch so the cells come out as bricks: squash x before, unsquash after
    const sq = pts.map((o) => ({ x: o.x / 1.55, y: o.y, s: o.s }));
    pts.forEach((p, pi) => {
      const me = sq[pi];
      let poly = vcell(me, sq.filter((o) => Math.abs(o.x - me.x) < w && Math.abs(o.y - me.y) < h * 2), w, 1.2);
      if (!poly) return;
      poly = poly.map((v) => [v[0] * 1.55, v[1]]);
      const c = centre(poly);
      s += `<path d="${straight(poly)}" style="fill:${WALLL};stroke:${WALL};stroke-width:1.6;stroke-linejoin:round"/>`;
      s += `<path d="${straight(inset(poly, c, 0.9))}" style="fill:url(#cw-cytoG) ${mx('chloro', 'elev-peak', 40)};stroke:${mx('chloro', 'strata-6', 50)};stroke-width:1;stroke-linejoin:round"/>`;
      s += `<path d="${smooth(inset(poly, [c[0] - p.side * w * 0.1, c[1]], 0.62))}" style="fill:url(#cw-vac) ${mx('sea-shallow', 'elev-peak', 50)};opacity:.85"/>`;
      s += nucleus(c[0] + p.side * w * 0.33, c[1] + (q() - 0.5) * h * 0.3, h * 0.17, 90);
      for (let i = 0; i < 3; i++) s += `<ellipse cx="${n1(c[0] - p.side * w * 0.33 + (q() - 0.5) * 6)}" cy="${n1(c[1] + (i - 1) * h * 0.24)}" rx="${n1(h * 0.1)}" ry="${n1(h * 0.06)}" style="fill:url(#cw-chl) ${T('chloro')}"/>`;
    });
    return s;
  }
  animate(st, t) {
    if (this.stepIndex === 3) return;
    const g = this._geo(st);
    anim(this, 'cells', this._cells(g, t));
    anim(this, 'line', this._line(st, g, t));
  }
}
