// SizeLadderScene - Fig 2.1 redrawn: a log scale from 1 km to 0.1 nm. Positions come from the sizes in ITEMS (metres), read off the book's figure.
// Each main tick is ten times the next. Three bars show the reach of the eye, the light microscope and the electron microscope.
//   beat 0 the whole scale  1 eye  2 light  3 electron. Chips light one bar and the things only it reaches.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { cwDefs, animalCell, plantCell, bacterium, T, mx, n1 } from '../shared/CellWorld.js';
import { PLANT_COLOR_MAP, frame, stroke, fill, words } from '../shared/PlantArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const TICKS = [[1e3, '1 km'], [1e2, '100 m'], [1e1, '10 m'], [1, '1 m'], [1e-1, '0.1 m'], [1e-2, '1 cm'], [1e-3, '1 mm'], [1e-4, '100 \u00b5m'], [1e-5, '10 \u00b5m'], [1e-6, '1 \u00b5m'], [1e-7, '100 nm'], [1e-8, '10 nm'], [1e-9, '1 nm'], [1e-10, '0.1 nm']];
const BARS = { eye: { top: 1e3, end: 1e-4, tone: 3, name: 'unaided eye' }, light: { top: 3.5e-3, end: 2e-7, tone: 8, name: 'light microscope' }, electron: { top: 1e-4, end: 1e-10, tone: 1, name: 'electron microscope' } };
// [name, metres, who first shows it, column]
const ITEMS = [['rocket', 35, 'eye'], ['neem tree', 12, 'eye'], ['human', 1.7, 'eye'], ['Great Indian Bustard', 1, 'eye'], ['chicken egg', 0.05, 'eye'], ['fish egg', 2e-3, 'eye'], ['amoeba', 4e-4, 'eye'],
  ['most plant and animal cells', 3e-5, 'light'], ['nucleus', 7e-6, 'light'], ['most bacteria', 3e-6, 'light'], ['mitochondrion', 1.3e-6, 'light'],
  ['smallest bacteria', 3e-7, 'electron'], ['viruses', 8e-8, 'electron'], ['ribosomes', 2.5e-8, 'electron'], ['proteins', 6e-9, 'electron'], ['lipids', 2e-9, 'electron'], ['small molecules', 5e-10, 'electron'], ['atoms', 1e-10, 'electron']];
const CHIPS = [{ id: 'eye', label: 'eye', say: 'unaided eye', targets: ['eye'], tone: 3 }, { id: 'light', label: 'light', say: 'light microscope', targets: ['light'], tone: 8 }, { id: 'electron', label: 'electron', say: 'electron microscope', targets: ['electron'], tone: 1 }];
const LIT = [null, 'eye', 'light', 'electron'];

export class SizeLadderScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 820;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 630;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A scale from 1 kilometre at the top to 0.1 nanometre at the bottom, each main step ten times smaller than the last. Rocket, neem tree, human, bustard, eggs, amoeba, cells, nucleus, bacteria, mitochondrion, viruses, ribosomes, proteins, lipids, molecules and atoms sit on it. Bars show the unaided eye reaching to about 0.1 millimetre, the light microscope from about 3 millimetres to about 200 nanometres, and the electron microscope from about 100 micrometres to about 0.1 nanometre.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Tools', chips: CHIPS, onChange: () => this.repaint() });
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 500 : 416; }
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.enter(this.stepIndex); this.repaint(); }
  enter(step) { this.tl.set({ lit: LIT[step] }); }
  destroy() { this.tl.destroy(); super.destroy(); }

  // small drawings in the free column, landscape only: each sits at its own height on the scale
  _icons(Y, off, x) {
    const k = 1.5, g = (who, c, yy) => `<g opacity="${off(who) ? 0.36 : 1}"><g transform="translate(${x} ${n1(yy)}) scale(${k}) translate(${-x} ${n1(-yy)})">${c}</g></g>`, oval = (cx, cy, rx, ry, col, ink) => `<ellipse cx="${cx}" cy="${n1(cy)}" rx="${rx}" ry="${ry}" style="fill:${col};stroke:${ink};stroke-width:1.6"/>`;
    let y = Y(22), c = `<path d="M${x - 2} ${n1(y + 15)}V${n1(y)}M${x + 2} ${n1(y + 15)}V${n1(y)}" ${stroke(T('strata-3'), 3)}/>`;
    for (const [dx, dy, r] of [[-11, -2, 10], [11, -3, 10], [0, -11, 11], [0, 1, 10]]) c += `<circle cx="${x + dx}" cy="${n1(y + dy)}" r="${r}" style="fill:${mx('elev-low', 'strata-6', 84)}"/>`;
    let s = g('eye', c, y);
    // bustard: a tall ground bird, long neck, long legs
    const by = Y(1); s += g('eye', `<path d="M${x - 10} ${n1(by - 2)}C${x - 10} ${n1(by - 10)} ${x + 4} ${n1(by - 12)} ${x + 9} ${n1(by - 6)}L${x + 6} ${n1(by - 20)}C${x + 6} ${n1(by - 24)} ${x + 11} ${n1(by - 24)} ${x + 12} ${n1(by - 21)}L${x + 15} ${n1(by - 20)}L${x + 11} ${n1(by - 18)}L${x + 12} ${n1(by - 4)}C${x + 10} ${n1(by + 3)} ${x - 6} ${n1(by + 4)} ${x - 10} ${n1(by - 2)}Z" style="fill:${mx('strata-2', 'elev-peak', 70)};stroke:${T('strata-3')};stroke-width:1.2"/><path d="M${x - 8} ${n1(by - 4)}C${x - 4} ${n1(by - 8)} ${x + 4} ${n1(by - 8)} ${x + 7} ${n1(by - 4)}" ${stroke(T('strata-3'), 1.4)}/><path d="M${x - 1} ${n1(by + 2)}V${n1(by + 13)}M${x + 3} ${n1(by + 2)}V${n1(by + 13)}" ${stroke(T('strata-3'), 1.3)}/>`, by);
    s += g('eye', oval(x, Y(0.05), 9, 12, mx('strata-1', 'elev-peak', 50), T('strata-2')), Y(0.05));
    const fy = Y(2e-3); s += g('eye', oval(x, fy, 10, 10, mx('gold', 'elev-peak', 40), T('strata-2')) + `<circle cx="${x + 1}" cy="${n1(fy + 1)}" r="4" style="fill:${T('strata-3')}"/>`, fy);
    const ay = Y(4e-4); s += g('eye', `<path d="M${x - 13} ${n1(ay)}q5 -11 11 -7t13 -2q5 7 -2 10t-3 8q-8 3 -11 -3t-8 -6Z" style="fill:${mx('series-1', 'elev-peak', 44)};stroke:${mx('series-1', 'strata-6', 60)};stroke-width:1.6"/><circle cx="${x}" cy="${n1(ay)}" r="3" style="fill:${T('series-5')}"/>`, ay);
    const cy = Y(3e-5); s += g('light', `<g transform="translate(-16 0)">${plantCell(x, cy, 26, 22, { parts: ['wall', 'cytoplasm', 'vacuole', 'membrane'] })}</g>${animalCell(x + 16, cy, 12, { parts: ['nucleus'] })}`, cy);
    s += g('light', bacterium(x, Y(3e-6), 0.13, {}), Y(3e-6));
    const vy = Y(8e-8); let sp = ''; for (let i = 0; i < 10; i++) { const a = i * 0.628; sp += `<path d="M${n1(x + Math.cos(a) * 7)} ${n1(vy + Math.sin(a) * 7)}L${n1(x + Math.cos(a) * 11)} ${n1(vy + Math.sin(a) * 11)}" ${stroke(mx('series-3', 'strata-6', 70), 1.8)}/>`; }
    s += g('electron', `${sp}<circle cx="${x}" cy="${n1(vy)}" r="7.4" style="fill:${mx('series-3', 'sea-deep', 76)}"/>`, vy);
    return s;
  }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, top = 16, bot = H - 14, Y = (m) => top + ((3 - Math.log10(m)) / 13) * (bot - top), lit = this.tl.lit()[0] ?? null;
    const axis = P ? 68 : 84, barX = W - (P ? 64 : 104), bw = P ? 17 : 26, fs = P ? 13.5 : 19, gap = P ? 4 : 8;
    let s = `<defs>${cwDefs()}</defs><rect width="${W}" height="${H}" ${fill(mx('strata-1', 'elev-peak', 30))}/>`;
    TICKS.forEach(([m, t], i) => {
      const y = Y(m);
      if (i % 2 === 0 && i < 13) s += `<rect x="${axis}" y="${n1(y)}" width="${W - axis}" height="${n1(Y(m / 10) - y)}" ${fill(mx('strata-1', 'elev-peak', 44))}/>`;
      s += `<path d="M${axis - 6} ${n1(y)}H${W}" ${stroke(mx('strata-2', 'elev-peak', 40), 1.4)}/>` + words(axis - (P ? 7 : 9), y + 5, t, { size: fs, anchor: 'end', ink: T('strata-6'), weight: 800 });
    });
    const off = (who) => lit && who !== lit;
    if (lit) { const b = BARS[lit], y = Y(b.end); s += `<path d="M${axis} ${n1(y)}H${barX - 6}" ${stroke(`var(--sim-series-${b.tone})`, 2.2)} stroke-dasharray="8 6"/>`; }
    let last = [-99, -99];
    ITEMS.forEach(([name, m, who], i) => {
      const y = Y(m), col = i % 2, x = axis + 12 + col * (P ? 106 : 214), tone = BARS[who].tone;
      const yy = Math.max(y, last[col] + (P ? 15.5 : 27)); last[col] = yy;
      const nm = name.replace('most plant and animal cells', 'most cells').replace('Great Indian Bustard', 'bustard').replace('smallest bacteria', 'tiny bacteria').replace('small molecules', 'molecules');
      s += `<g opacity="${off(who) ? 0.36 : 1}"><path d="M${axis} ${n1(y)}L${n1(x - 6)} ${n1(yy)}" ${stroke(`var(--sim-series-${tone})`, 1.6)}/><circle cx="${n1(x - 5)}" cy="${n1(yy)}" r="3.2" ${fill(`var(--sim-series-${tone})`)}/>${words(x + 2, yy + 5, nm, { size: fs, anchor: 'start', ink: T('strata-6'), weight: 800 })}</g>`;
    });
    if (!P) s += this._icons(Y, off, axis + 12 + 2 * 214 + 30);
    Object.entries(BARS).forEach(([k, b], i) => {
      const x = barX + i * (bw + gap), y0 = Y(b.top), y1 = Y(b.end), c = `var(--sim-series-${b.tone})`, id = `sl-${k}`, fade = k === 'eye';
      s += `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${c}"/><stop offset="${fade ? 0.85 : 0.92}" style="stop-color:${c}"/><stop offset="1" style="stop-color:${c};stop-opacity:.25"/></linearGradient></defs>`;
      s += `<g opacity="${off(k) ? 0.3 : 1}"><rect x="${x}" y="${n1(y0)}" width="${bw}" height="${n1(y1 - y0)}" rx="6" style="fill:url(#${id}) ${c}"/><text transform="translate(${x + bw / 2 + 5} ${n1((y0 + y1) / 2)}) rotate(-90)" text-anchor="middle" style="font:800 ${P ? 15 : fs}px var(--sim-font);fill:${T('strata-6')}">${b.name}</text></g>`;
    });
    return { svg: frame(st, 'sl', s) };
  }
}
