// LevelsZoomScene - one breath, four levels. Each beat lights one level on a row of four linked discs and fills the stage with it:
//   0 tissue: a sheet of similar cells  1 organ: a lung  2 organ system: the book's nasal pores to lungs  3 back to a cell in the lung
// TapLight chips jump between levels; a beat preset wins on landing.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { cwDefs, depthField, animalCell, blobPath, n1, T, mx, rnd } from '../shared/CellWorld.js';
import { PLANT_COLOR_MAP, label, frame, stroke } from '../shared/PlantArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const CHIPS = [{ id: 'cell', label: 'cell', targets: ['cell'], tone: 1 }, { id: 'tissue', label: 'tissue', targets: ['tissue'], tone: 3 }, { id: 'organ', label: 'organ', targets: ['organ'], tone: 4 }, { id: 'system', label: 'organ system', targets: ['system'], tone: 5 }];
const BEAT = ['tissue', 'organ', 'system', 'cell'];

// Lung pair and airway in a 300 x 330 box, origin top-centre of the trachea.
function lungs(o = {}) {
  const lung = (sg) => {
    // the person faces us: their right lung (on our left) has three lobes, their left lung two and a notch for the heart
    const notch = sg > 0 ? `C${sg * 34} 288 ${sg * 26} 274 ${sg * 34} 256C${sg * 46} 236 ${sg * 24} 222 ${sg * 20} 200` : `C${sg * 34} 288 ${sg * 20} 274 ${sg * 18} 250C${sg * 16} 224 ${sg * 16} 210 ${sg * 18} 200`;
    const d = `M${sg * 22} 96C${sg * 30} 62 ${sg * 70} 50 ${sg * 96} 84C${sg * 124} 120 ${sg * 138} 200 ${sg * 132} 262C${sg * 128} 292 ${sg * 92} 302 ${sg * 60} 294${notch}C${sg * 16} 160 ${sg * 16} 128 ${sg * 22} 96Z`;
    const q = rnd(sg > 0 ? 3 : 8); let b = '';
    for (let i = 0; i < 70; i++) b += `<circle cx="${n1(sg * (20 + q() * 115))}" cy="${n1(60 + q() * 240)}" r="${n1(2 + q() * 4)}" style="fill:${T('elev-peak')};opacity:${n1(0.08 + q() * 0.12)}"/>`;
    const tw = (x0, y0, a, l, w, k) => { if (k === 0) return; const x1 = x0 + Math.sin(a) * l * sg, y1 = y0 + Math.cos(a) * l; b += `<path d="M${n1(x0)} ${n1(y0)}L${n1(x1)} ${n1(y1)}" ${stroke(mx('elev-peak', 'series-4', 50), w)} opacity=".85"/>`; tw(x1, y1, a + 0.55, l * 0.72, w * 0.68, k - 1); tw(x1, y1, a - 0.4, l * 0.74, w * 0.68, k - 1); };
    tw(sg * 34, 132, 1.0, 34, 10, 5); tw(sg * 30, 128, 2.6, 30, 6, 3);
    const fis = sg < 0 ? `M${sg * 30} 150C${sg * 60} 190 ${sg * 92} 236 ${sg * 112} 280M${sg * 125} 178C${sg * 110} 182 ${sg * 82} 182 ${sg * 64} 196` : `M${sg * 28} 136C${sg * 60} 176 ${sg * 92} 226 ${sg * 114} 280`;
    const clip = `lz-c${sg < 0 ? 'l' : 'r'}${o.id ?? ''}`;
    return `<path d="${d}" transform="translate(4 8)" style="fill:${T('strata-6')};opacity:.18;filter:url(#cw-blur3)"/><clipPath id="${clip}"><path d="${d}"/></clipPath><path d="${d}" style="fill:url(#lz-lung) ${T('series-4')};stroke:${mx('series-4', 'strata-6', 56)};stroke-width:3"/><g clip-path="url(#${clip})">${b}<path d="${d}" transform="translate(${sg * -8} 6) scale(1)" style="fill:none;stroke:${mx('series-4', 'strata-6', 50)};stroke-width:14;opacity:.18"/></g>`
      + `<path d="${fis}" ${stroke(mx('series-4', 'strata-6', 66), 2.4)}/><path d="M${sg * 40} 90C${sg * 66} 82 ${sg * 92} 110 ${sg * 104} 150" ${stroke(T('elev-peak'), 5)} opacity=".45"/>`;
  };
  return lung(-1) + lung(1) + `<path d="M0 0V112M0 112L-34 132M0 112L34 132" ${stroke(mx('series-1', 'strata-6', 56), 19)}/><path d="M0 0V112M0 112L-34 132M0 112L34 132" ${stroke(mx('series-1', 'elev-peak', 56), 13)}/>${(() => { let r = ''; for (let y = 8; y < 104; y += 9) r += `<path d="M-8 ${y}Q0 ${y + 4} 8 ${y}" ${stroke(mx('series-1', 'strata-6', 62), 2.6)}/>`; return r; })()}`;
}
const defs = `<radialGradient id="lz-cell" cx=".36" cy=".3" r=".8"><stop offset="0" style="stop-color:${T('elev-peak')}"/><stop offset=".6" style="stop-color:${mx('series-4', 'elev-peak', 24)}"/><stop offset="1" style="stop-color:${mx('series-4', 'elev-peak', 56)}"/></radialGradient><radialGradient id="lz-lung" cx=".35" cy=".28" r=".85"><stop offset="0" style="stop-color:${mx('series-4', 'elev-peak', 34)}"/><stop offset=".6" style="stop-color:${mx('series-4', 'magma', 80)}"/><stop offset="1" style="stop-color:${mx('series-4', 'strata-6', 66)}"/></radialGradient>`;

// A sheet of lining cells: a paved surface of similar cells, each with a nucleus.
function sheet(cx, cy, w, h, n, lit) {
  const c = Math.ceil(Math.sqrt(n * w / h)), r = Math.ceil(n / c), cw = w / c, ch = h / r, q = rnd(6); let s = '';
  for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) {
    const x = cx - w / 2 + (i + 0.5 + (j % 2 ? 0.25 : -0.25)) * cw, y = cy - h / 2 + (j + 0.5) * ch, d = blobPath(x, y, cw * 0.56, ch * 0.56, i * 3 + j + 1, 0.05, 7);
    s += `<path d="${d}" style="fill:url(#lz-cell) ${mx('series-4', 'elev-peak', 24)};stroke:${mx('series-4', 'strata-6', 66)};stroke-width:2"/><path d="M${n1(x - cw * 0.34)} ${n1(y - ch * 0.12)}Q${n1(x - cw * 0.26)} ${n1(y - ch * 0.34)} ${n1(x - cw * 0.04)} ${n1(y - ch * 0.38)}" ${stroke(T('elev-peak'), 2.6)} opacity=".8"/>`;
    const nx = x + q() * 8 - 4, ny = y + q() * 8 - 4, nr = Math.min(cw, ch) * 0.17;
    s += `<path d="${blobPath(x, y, cw * 0.47, ch * 0.47, i * 3 + j + 1, 0.05, 7)}" style="fill:none;stroke:${mx('series-4', 'elev-peak', 40)};stroke-width:3;opacity:.5"/>`;
    for (let g = 0; g < 9; g++) s += `<circle cx="${n1(x + (q() - 0.5) * cw * 0.7)}" cy="${n1(y + (q() - 0.5) * ch * 0.7)}" r="${n1(0.9 + q() * 1.3)}" style="fill:${mx('series-4', 'strata-6', 60)};opacity:.35"/>`;
    s += `<circle cx="${n1(nx + 2)}" cy="${n1(ny + 3)}" r="${n1(nr)}" style="fill:${T('strata-6')};opacity:.15"/><circle cx="${n1(nx)}" cy="${n1(ny)}" r="${n1(nr)}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', 'strata-6', 60)};stroke-width:1.2"/><circle cx="${n1(nx + nr * 0.2)}" cy="${n1(ny + nr * 0.15)}" r="${n1(nr * 0.32)}" style="fill:url(#cw-nucleolus) ${T('series-5')}"/><circle cx="${n1(nx - nr * 0.35)}" cy="${n1(ny - nr * 0.35)}" r="${n1(nr * 0.22)}" style="fill:${T('elev-peak')};opacity:.55"/>`;
  }
  return s;
}

export class LevelsZoomScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 490;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 530;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Four levels of one body. A sheet of similar cells is a tissue. A lung is an organ. The nasal pores, nasal cavity, trachea and lungs form the respiratory system. One cell from the lung stands for the unit in every level. Chips light each level.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Levels', chips: CHIPS, onChange: () => this.repaint() });

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 400; }
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.enter(this.stepIndex); this.repaint(); }
  enter(step) { this._beat = BEAT[step]; this.tl.set?.({ lit: BEAT[step] }); }
  destroy() { this.tl.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, lit = this.tl.lit()[0] ?? this._beat ?? 'tissue';
    let s = `<defs>${cwDefs()}${defs}</defs>` + depthField(W, H, { tone: 'rose', seed: 4 });
    const cx = W / 2, cy = H * 0.5, size = P ? 16 : 18;
    if (lit === 'cell') {
      s += animalCell(cx, cy - 4, Math.min(W, H) * 0.4, { seed: 9 }) + label(cx, H - 18, 'the cell: still the unit', { size, display: true });
    } else if (lit === 'tissue') {
      s += sheet(cx, cy - 4, W * 0.86, H * 0.74, 20, lit) + label(cx, H - 18, 'tissue: similar cells, similar work', { size, display: true });
    } else if (lit === 'organ') {
      const k = H / 372;
      s += `<g transform="translate(${n1(cx)} ${n1(H * 0.06)}) scale(${n1(k)})">${lungs()}</g>` + label(cx, H - 14, 'organ: the lungs hold several tissues', { size, display: true });
    } else {
      const k = H / 460, x0 = P ? W * 0.38 : cx;
      // head in profile, only the airway drawn: nasal pores, nasal cavity, then the trachea into the lungs
      const hd = `M-58 -96C-58 -130 -24 -150 8 -146C40 -142 58 -116 54 -88C54 -78 66 -60 68 -54C70 -48 60 -46 56 -44C56 -36 58 -26 52 -22C46 -18 36 -18 30 -20C24 -6 20 6 18 22H-32C-30 0 -40 -14 -48 -32C-54 -46 -58 -72 -58 -96Z`;
      s += `<g transform="translate(${n1(x0)} ${n1(H * 0.33)}) scale(${n1(k)})"><path d="${hd}" style="fill:${mx('strata-1', 'elev-peak', 56)};stroke:${mx('strata-3', 'strata-6', 60)};stroke-width:3"/><path d="M58 -56C40 -72 12 -76 -4 -62C-14 -52 -4 -30 -4 -6V30" ${stroke(mx('series-1', 'strata-6', 56), 19)}/><path d="M58 -56C40 -72 12 -76 -4 -62C-14 -52 -4 -30 -4 -6V30" ${stroke(mx('series-1', 'elev-peak', 56), 13)}/><g transform="translate(-4 30) scale(.86)">${lungs({ id: 's' })}</g></g>`;
      const lx = P ? W * 0.62 : W * 0.72, m = (t, yy, tx, ty) => `<path d="M${n1(lx - 8)} ${n1(yy)}L${n1(tx)} ${n1(ty)}" ${stroke(mx('strata-6', 'sea-deep', 70), 2.2)}/>` + label(lx, yy + 5, t, { size: P ? 14 : 16, anchor: 'start' });
      const hx = x0, hy = H * 0.33;
      s += m('nasal pores', H * 0.1, hx + 54 * k, hy - 54 * k) + m('nasal cavity', H * 0.2, hx + 22 * k, hy - 68 * k) + m('trachea', H * 0.44, hx - 2 * k, hy + 70 * k) + m('lungs', H * 0.7, hx + 76 * k, hy + 210 * k);
      s += label(cx, H - 14, 'organ system: the respiratory system', { size, display: true });
    }
    return { svg: frame(st, 'lz', s) };
  }
}
