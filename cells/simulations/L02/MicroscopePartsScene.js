// MicroscopePartsScene - a school microscope on a lab bench.
//   Three-beat block: 0 path of light, 1 the two lenses, 2 knobs, handle, base. Chips light any part.
//   Two-beat block: 3 10X x 10X, 4 10X x 40X with the objective turned. The product is computed here.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { cwDefs, T, mx, n1 } from '../shared/CellWorld.js';
import { PLANT_COLOR_MAP, label, frame, stroke, fill } from '../shared/PlantArt.js';
import { microscope, ANCHOR } from './ScopeArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const NAME = { eyepiece: 'eyepiece', tube: 'body tube', objective: 'objective lens', stage: 'stage', mirror: 'mirror', coarse: 'coarse adjustment knob', fine: 'fine adjustment knob', handle: 'handle', base: 'base' };
const SHORT = { objective: 'objective', tube: 'tube', coarse: 'coarse knob', fine: 'fine knob' };
const CHIPS = Object.keys(NAME).map((id) => ({ id, label: SHORT[id] ?? NAME[id], say: NAME[id], targets: [id] }));
const SETS = [['mirror', 'stage', 'objective', 'tube', 'eyepiece'], ['objective', 'eyepiece'], ['coarse', 'fine', 'handle', 'base'], ['eyepiece', 'objective'], ['eyepiece', 'objective']];
const CELL_UM = 200;

export class MicroscopePartsScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static BEAT_MAPS = { 2: [one(3), one(4)], 3: [one(0), one(1), one(2)] };
  static WIDTH = 640;
  static HEIGHT = 560;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 560;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A school light microscope in side view on a lab bench, with its parts labelled: eyepiece, body tube, objective lens, stage, mirror, coarse adjustment knob, fine adjustment knob, handle and base. Chips light each part. On some beats a line of light runs from the mirror up to the eyepiece, or a working shows total magnification.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Parts of the microscope', chips: CHIPS, onChange: () => this.repaint() });
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 370 : 380; }
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.repaint(); }
  enter() { this.tl.reset?.(); }
  destroy() { this.tl.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, k = (H - 24 - (st.portrait && this.stepIndex >= 3 && !this.tl.any() ? 74 : 0)) / 450, gy = H - 16, x0 = W * (P ? 0.47 : 0.48);
    const lit = this.tl.any() ? this.tl.lit() : SETS[step], on = (p) => lit.includes(p), obj = step === 4 ? 1 : 0;
    // back wall of a school lab: tiles, a shelf, one quiet window of light
    let s = `<defs>${cwDefs()}</defs><rect width="${W}" height="${H}" ${fill(mx('sea-shallow', 'elev-peak', 16))}/>`;
    for (let y = 0; y < H - 40; y += 40) s += `<path d="M0 ${y}H${W}" ${stroke(mx('sea-shallow', 'elev-peak', 30), 1.4)}/>`;
    for (let x = 20; x < W; x += 64) s += `<path d="M${x} 0V${H - 44}" ${stroke(mx('sea-shallow', 'elev-peak', 26), 1.4)}/>`;
    s += `<rect y="${n1(H - 44)}" width="${W}" height="44" style="fill:url(#pa-wood) ${T('strata-3')}"/><rect y="${n1(H - 44)}" width="${W}" height="4" ${fill(mx('strata-1', 'elev-peak', 60))}/>`;
    s += microscope(x0, gy, k, { a: (p) => (on(p) ? 1 : 0.28), ray: step === 0 && !this.tl.any(), obj });
    if (step <= 2 || this.tl.any()) {
      const side = { eyepiece: -1, tube: -1, objective: -1, stage: -1, mirror: -1, coarse: 1, fine: 1, handle: 1, base: P ? 1 : -1 };
      const shown = Object.keys(NAME).filter(on), LX = P ? 12 : W * 0.03, RX = W - (P ? 12 : W * 0.03);
      const lastY = { '-1': -99, 1: -99 }, gapY = P ? 20 : 25;
      for (const p of shown.sort((u, v) => ANCHOR[u][1] - ANCHOR[v][1])) {
        const [ax, ay] = ANCHOR[p], px = x0 + ax * k, ay0 = gy + ay * k, sd = side[p], py = Math.max(ay0, lastY[sd] + gapY), tx = sd < 0 ? LX : RX;
        lastY[sd] = py; const name = P && p === 'coarse' ? 'coarse knob' : P && p === 'fine' ? 'fine knob' : P && p === 'objective' ? 'objective' : NAME[p].replace(' adjustment knob', ' knob');
        const tw = name.length * (P ? 8 : 10.6), end = sd < 0 ? tx + tw + 6 : tx - tw - 6;
        s += `<path d="M${n1(end)} ${n1(py)}L${n1(px + (end - px) * 0.2)} ${n1(py)}L${n1(px)} ${n1(ay0)}" ${stroke(mx('strata-6', 'sea-deep', 70), 2.4)}/><circle cx="${n1(px)}" cy="${n1(ay0)}" r="3.6" ${fill(mx('strata-6', 'sea-deep', 70))}/>`;
        s += label(tx, py + 6, name, { size: P ? 14 : 19, anchor: sd < 0 ? 'start' : 'end' });
      }
    }
    if (step >= 3 && !this.tl.any()) {
      const o = step === 4 ? 40 : 10, tot = 10 * o, mm = (CELL_UM * tot) / 1000, tx = P ? W * 0.5 : W * 0.78;
      s += label(tx, P ? 30 : H * 0.1, `10X x ${o}X = ${tot}X`, { size: P ? 22 : 26, display: true });
      s += label(tx, P ? 56 : H * 0.1 + 26, `a ${CELL_UM} \u00b5m cell looks ${mm} mm`, { size: P ? 14 : 19 });
      const ax = x0 + ANCHOR.eyepiece[0] * k, ay = gy + ANCHOR.eyepiece[1] * k, bx = x0 + ANCHOR.objective[0] * k, by = gy + ANCHOR.objective[1] * k;
      s += label(ax - 30, ay + 8, '10X', { size: P ? 16 : 21, anchor: 'end', display: true }) + label(bx - 30, by + 8, `${o}X`, { size: P ? 16 : 21, anchor: 'end', display: true });
    }
    return { svg: frame(st, 'mp', s) };
  }
}
