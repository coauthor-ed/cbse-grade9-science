// ThreeDishesScene - Fig 2.6: three petri dishes, before and after. The name on each row belongs to the outside solution.
// Cells are drawn at a size from the rule in ROWS, the dots outside show how much solute the liquid holds. Each beat lights a row.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { cwDefs, soluteDot, blobPath, n1, T, mx, rnd } from '../shared/CellWorld.js';
import { PLANT_COLOR_MAP, label, frame, fill, stroke } from '../shared/PlantArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const ROWS = [{ id: 'iso', name: 'isotonic', out: 'same solute', k: 1, dots: 9, say: 'no change in size' }, { id: 'hypo', name: 'hypotonic', out: 'less solute', k: 1.28, dots: 3, say: 'cells swell' }, { id: 'hyper', name: 'hypertonic', out: 'more solute', k: 0.66, dots: 20, say: 'cells shrink' }];
const CHIPS = ROWS.map((r, i) => ({ id: r.id, label: r.name, targets: [r.id], tone: [3, 1, 6][i] }));
const defs = `<radialGradient id="td-c" cx=".36" cy=".3" r=".8"><stop offset="0" style="stop-color:${mx('series-6', 'elev-peak', 44)}"/><stop offset=".62" style="stop-color:${T('series-6')}"/><stop offset="1" style="stop-color:${mx('series-6', 'strata-6', 60)}"/></radialGradient>`
  + `<radialGradient id="td-g" cx=".42" cy=".36" r=".72"><stop offset="0" style="stop-color:${T('elev-peak')}"/><stop offset=".8" style="stop-color:${mx('sky-day', 'elev-peak', 46)}"/><stop offset="1" style="stop-color:${mx('sky-day', 'strata-5', 62)}"/></radialGradient>`;
// A glass petri dish seen from above at a slant: a glass base with a short wall, liquid filling it with a bright
// meniscus line, cells lying on the bottom (seen through the liquid, a touch paler), glints on the rim.
function dish(x, y, r, k, dots, seed) {
  const q = rnd(seed), ry = r * 0.62, wall = r * 0.16, gl = mx('sky-day', 'elev-peak', 30), rim = mx('sea-shallow', 'sea-deep', 56);
  let s = `<ellipse cx="${n1(x + 4)}" cy="${n1(y + wall + 6)}" rx="${n1(r * 1.04)}" ry="${n1(ry * 1.02)}" style="fill:${T('strata-6')};opacity:.2;filter:url(#cw-blur3)"/>`;
  // wall seen from the front: a band between the base ellipse and the rim ellipse
  s += `<path d="M${n1(x - r)} ${n1(y)}V${n1(y + wall)}A${r} ${n1(ry)} 0 0 0 ${n1(x + r)} ${n1(y + wall)}V${n1(y)}Z" style="fill:${mx('sky-day', 'sea-shallow', 60)};opacity:.75;stroke:${rim};stroke-width:1.6"/>`;
  s += `<path d="M${n1(x - r * 0.8)} ${n1(y + ry * 0.62)}A${r} ${n1(ry)} 0 0 0 ${n1(x + r * 0.2)} ${n1(y + ry + wall * 0.9)}" ${stroke(T('elev-peak'), 2.4)} opacity=".7"/>`;
  // liquid
  s += `<ellipse cx="${n1(x)}" cy="${n1(y + wall * 0.35)}" rx="${n1(r - 2)}" ry="${n1(ry - 2)}" style="fill:url(#td-g) ${T('elev-peak')}"/>`;
  for (let i = 0; i < dots; i++) { const a = q() * 6.28, R = 0.3 + Math.sqrt(q()) * 0.6; s += soluteDot(x + Math.cos(a) * R * r, y + wall * 0.35 + Math.sin(a) * R * ry, 2.8); }
  for (const [u, v] of [[-0.46, -0.1], [0.1, -0.28], [0.34, 0.28]]) {
    const cr = r * 0.2 * k, cx = x + u * r, cy = y + wall * 0.35 + v * r, wob = k < 1 ? 0.16 : 0.04;
    const d = blobPath(cx, cy, cr, cr * 0.84, Math.round(cx), wob, k < 1 ? 14 : 10);
    s += `<path d="${d}" transform="translate(1.5 3)" style="fill:${T('strata-6')};opacity:.14"/><path d="${d}" style="fill:url(#td-c) ${T('series-6')};stroke:${mx('series-6', 'strata-6', 60)};stroke-width:1.6;opacity:.92"/><ellipse cx="${n1(cx)}" cy="${n1(cy + cr * 0.05)}" rx="${n1(cr * 0.42)}" ry="${n1(cr * 0.3)}" style="fill:${mx('series-6', 'elev-peak', 30)};opacity:.5"/><ellipse cx="${n1(cx - cr * 0.34)}" cy="${n1(cy - cr * 0.34)}" rx="${n1(cr * 0.26)}" ry="${n1(cr * 0.14)}" style="fill:${T('elev-peak')};opacity:.7"/>`;
  }
  // surface: a faint sheen across the liquid and a bright meniscus line inside the rim
  s += `<path d="M${n1(x - r * 0.7)} ${n1(y - ry * 0.25)}Q${n1(x - r * 0.1)} ${n1(y - ry * 0.75)} ${n1(x + r * 0.55)} ${n1(y - ry * 0.45)}" ${stroke(T('elev-peak'), 5)} opacity=".45"/>`;
  s += `<ellipse cx="${n1(x)}" cy="${n1(y + wall * 0.35)}" rx="${n1(r - 3)}" ry="${n1(ry - 3)}" style="fill:none;stroke:${T('elev-peak')};stroke-width:1.6;opacity:.8"/>`;
  s += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${r}" ry="${n1(ry)}" style="fill:none;stroke:${rim};stroke-width:2.2"/><path d="M${n1(x - r * 0.9)} ${n1(y - ry * 0.3)}A${r} ${n1(ry)} 0 0 1 ${n1(x - r * 0.2)} ${n1(y - ry * 0.98)}" ${stroke(T('elev-peak'), 3)}/>`;
  return s;
}
export class ThreeDishesScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 530;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Three rows of petri dishes, each showing cells before and after. In an isotonic solution the cells stay the same size. In a hypotonic solution, with less solute than the cells, they swell. In a hypertonic solution, with more solute than the cells, they shrink.';
  static CONTROLS = [];
  tl = tapLight({ label: 'Outside solution', chips: CHIPS, onChange: () => this.repaint() });
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 440 : 420; }
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.enter(this.stepIndex); this.repaint(); }
  enter(step) { this.tl.set({ lit: ROWS[step].id }); }
  destroy() { this.tl.destroy(); super.destroy(); }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, lit = this.tl.lit()[0];
    let s = `<defs>${cwDefs()}${defs}</defs><rect width="${W}" height="${H}" ${fill(mx('strata-5', 'elev-peak', 18))}/>`;
    const rh = (H - 12) / 3, r = Math.min(rh * 0.5, P ? 56 : 62), dx0 = P ? W * 0.3 : W * 0.46, dx1 = P ? W * 0.76 : W * 0.8;
    ROWS.forEach((row, i) => {
      const y = 6 + rh * (i + 0.5) + (P ? 12 : 0), on = row.id === lit;
      s += `<g opacity="${lit && !on ? 0.34 : 1}">`;
      if (on) s += `<rect x="6" y="${n1(y - rh / 2 + 3 - (P ? 12 : 0))}" width="${W - 12}" height="${n1(rh - 6)}" rx="12" ${fill(mx('elev-peak', 'sky-day', 84))}/>`;
      s += dish(dx0, y, r, 1, row.dots, i + 3) + dish(dx1, y, r, row.k, row.dots, i + 3);
      const a0 = dx0 + r + 8, a1 = dx1 - r - 8;
      s += `<path d="M${n1(a0)} ${n1(y)}H${n1(a1 - 10)}" ${stroke(T('strata-6'), 3)}/><path d="M${n1(a1)} ${n1(y)}l-13 -7v14Z" ${fill(T('strata-6'))}/>`;
      if (P) s += label(W / 2, y - rh / 2 + 6, `${row.name}: ${row.out}, ${row.say}`, { size: 15, display: true });
      else s += label(16, y - 12, row.name, { size: 21, display: true, anchor: 'start' }) + label(16, y + 13, row.out, { size: 18, anchor: 'start' }) + label(16, y + 36, row.say, { size: 18, anchor: 'start' });
      s += '</g>';
    });
    return { svg: frame(st, 'td', s) };
  }
}
