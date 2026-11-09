// CellPartsScene - blk-l10-n01. A plant cell with seven lettered parts. Beat 0: a job at the top, tap its letter; right
// names the part and moves on; wrong says what that part is and the job stays. Seven jobs; once at the end, then every part stays named.
// Letters are 46 px discs on the picture. Answers: from the Revise question; the letters are this drawing's own.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, leader } from '../shared/PlantArt.js';
import { cwFrame, depthField, plantCell, T, mx, n1 } from '../shared/CellWorld.js';

const one = (idx) => [{ idx, dwellMs: null }];
// id, name, point on the cell as share of half-width and half-height, disc position in land and in portrait
const PARTS = [
  { id: 'wall', n: 'Cell wall', p: [-0.97, 0.02], l: [-1.32, -0.2], q: [-1.06, -1.13], job: 'Provides structural rigidity to the cell.' },
  { id: 'mem', n: 'Cell membrane', p: [-0.86, 0.62], l: [-1.32, 0.6], q: [-1.0, 1.12], job: 'Separates the cell contents from its surroundings.' },
  { id: 'nuc', n: 'Nucleus', p: [0.55, 0.34], l: [1.3, 0.56], q: [0.8, 1.12], job: 'Controls all the activities of a cell.' },
  { id: 'vac', n: 'Vacuole', p: [-0.14, -0.03], l: [-0.1, -1.24], q: [0.3, -1.13], job: 'Stores materials, and also provides rigidity to the cell.' },
  { id: 'mito', n: 'Mitochondrion', p: [0.7, -0.24], l: [1.3, -0.3], q: [1.0, -1.13], job: 'Is the site of cellular respiration.' },
  { id: 'gol', n: 'Golgi apparatus', p: [0.24, 0.42], l: [0.72, 1.2], q: [-0.1, 1.12], job: 'Packs and stores materials received from the ER.' },
  { id: 'chl', n: 'Chloroplast', p: [-0.52, -0.67], l: [-0.74, -1.24], q: [-0.38, -1.13], job: 'Helps in making food.' },
];
const LETTER = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const ORDER = ['nuc', 'mito', 'vac', 'mem', 'wall', 'gol', 'chl']; // the question's own order

export class CellPartsScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0)];
  static WIDTH = 640;
  static HEIGHT = 490;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 530;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A plant cell with seven parts lettered a to g. A line above it names a job. Tap the letter of the part that does that job. A right answer names the part and shows the next job.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 420 : 400; }
  enter() { this._i = 0; this._done = new Set(); this._say = ''; }
  async setup() { this.enter(); await super.setup(); }

  _g(st) {
    const P = st.portrait, W = st.W, H = st.H, w = P ? 246 : 380, h = P ? 240 : 262, x = W / 2, y = P ? H / 2 + 12 : H / 2 + 4;
    return { P, W, H, w, h, x, y, disc: PARTS.map((p) => { const t = P ? p.q : p.l; return [x + t[0] * w * 0.5, y + t[1] * h * 0.5 * (P ? 1.04 : 1)]; }) };
  }
  pointerDown(p) {
    if (this.stepIndex !== 0 || this._i >= ORDER.length) return false;
    const g = this._g(this.sv), want = ORDER[this._i];
    let hit = -1;
    g.disc.forEach(([x, y], i) => { if (Math.hypot(p.x - x, p.y - y) < 26) hit = i; });
    if (hit < 0) return false;
    const P0 = PARTS[hit];
    if (P0.id === want) {
      this._done.add(hit); this._i += 1; this._say = `${LETTER[hit]} is the ${P0.n.toLowerCase()}.`;
      this.repaint();
      if (this._i >= ORDER.length) this.celebrate();
    } else if (this._done.has(hit)) { this._say = `${LETTER[hit]} is already named. Try another letter.`; this.repaint(); }
    else { this._say = `Not ${LETTER[hit]}. Try another letter.`; this.repaint(); }
    return false;
  }
  paint(st) {
    const g = this._g(st), { W, P, w, h, x, y } = g, step = this.stepIndex, all = step === 1;
    let s = depthField(W, g.H, { tone: 'green', seed: 91 });
    s += plantCell(x, y, w, h, { seed: 4 });
    PARTS.forEach((p, i) => {
      const [dx, dy] = g.disc[i], px = x + p.p[0] * w * 0.5, py = y + p.p[1] * h * 0.5, on = all || this._done.has(i);
      s += leader(dx, dy, px, py, mx('strata-6', 'strata-3', 80), 2.2);
      s += `<circle cx="${n1(px)}" cy="${n1(py)}" r="4" style="fill:${T('strata-6')}"/><circle cx="${n1(dx)}" cy="${n1(dy + 3)}" r="23" style="fill:${mx('strata-5', 'strata-6', 70)}"/><circle cx="${n1(dx)}" cy="${n1(dy)}" r="23" style="fill:${on ? mx('gold', 'elev-peak', 44) : T('elev-peak')};stroke:${mx('strata-5', 'strata-6', 70)};stroke-width:2.6"/><text x="${n1(dx)}" y="${n1(dy + 8)}" text-anchor="middle" style="font-family:var(--sim-font-display);font-weight:700;font-size:23px;fill:${T('strata-6')}">${LETTER[i]}</text>`;
    });
    PARTS.forEach((p, i) => { if (all || this._done.has(i)) { const px = x + p.p[0] * w * 0.5, py = y + p.p[1] * h * 0.5; s += label(Math.max(62, Math.min(W - 62, px + (p.id === 'wall' ? 44 : p.id === 'mem' ? 60 : 0))), py + (p.id === 'wall' ? -8 : p.id === 'mem' ? -10 : p.id === 'gol' ? 26 : 20), p.n, { size: 14, display: true }); } });
    const finished = this._i >= ORDER.length;
    const job = all ? 'Seven parts, seven jobs' : finished ? 'All seven matched' : PARTS.find((q) => q.id === ORDER[this._i]).job;
    let head = `<div class="cp-job">${job}</div>`;
    head += `<div class="cp-say" aria-live="polite">${all ? '' : this._say || `Job ${Math.min(this._i + 1, 7)} of 7`}</div>`;
    return { svg: cwFrame(st, 'cp', s), head: `<style>.cp-job{font:600 24px/1.2 var(--sim-font-display);color:var(--sim-label);text-align:center;min-height:58px;display:flex;align-items:center;justify-content:center}.cp-say{font:800 17px/1.2 var(--sim-font);color:var(--sim-label-muted);text-align:center;min-height:20px}.sim-dom-root--portrait .cp-job{font-size:20px;min-height:50px}</style>${head}` };
  }
}
