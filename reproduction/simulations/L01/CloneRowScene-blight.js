// CloneRowScene-blight - blk-l01-s09, new. A row of identical roses. Beat 0: one sick. Beat 1: Next week: the next plant
// wilts, as the row shares one weakness. Beat 2: the same disease on copies and on plants grown from seed. Beat 3: a
// healthy row: what the farmer chose it for. Sick counts and which seed plants survive are made up, for the picture.
// Control name: Next week.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgRosePlant, label, frame, ctlBar } from '../shared/PlantArt.js';

import { sky, hills, field } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const SEED = [['red', 1], ['yellow', 0], ['pink', 1], ['red', 0], ['yellow', 0]];

export class BlightRowScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A row of identical rose plants. A disease reaches one, then the next, until all wilt. Beside it, plants grown from seed differ and some stay healthy.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'btn', id: 'week', label: 'Next week', go: true }], (id) => {
      if (id !== 'week') return;
      this._sick = Math.min(this._n(), this._sick + 1);
      if (this._sick >= this._n()) this.ctl.disable('week', true);
      this.repaint();
    });
    this.enter(this.stepIndex); this.repaint();
  }
  _n() { return this.sv?.portrait ? 4 : 5; }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 320 : (this.stepIndex === 1 ? 372 : 400); }
  enter(step) {
    this._sick = step === 1 ? 2 : 1;
    if (!this.ctl) return;
    this.ctl.show('week', step === 1); this.ctl.disable('week', false);
  }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  row(W, y, q, n, spec) {
    let s = '';
    for (let i = 0; i < n; i++) { const o = spec(i); s += svgRosePlant(W * (i + 0.5) / n, y, q, { blooms: o.sick ? 0 : 2, seed: 2, ...o }); }
    return s;
  }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, n = this._n();
    if (step === 2) {
      const my = Math.round(H * 0.5), q = P ? 0.5 : 0.76, m = Math.min(n, 5);
      let s = sky(W, my, { warm: 0.4 }) + hills(W, my * 0.5) + field(W, H, my * 0.5, { vanish: W * 0.5 });
      s += this.row(W, my - 10, q, m, () => ({ tint: 'red', sick: 0.92 })) + this.row(W, H - 18, q, m, (i) => ({ tint: SEED[i][0], sick: SEED[i][1] ? 0.92 : 0, seed: 2 + i }));
      s += label(W * 0.26, 26, 'Copies of one bush', { size: P ? 15 : 18, display: true }) + label(W * 0.26, my + 26, 'Grown from seed', { size: P ? 15 : 18, display: true });
      return { svg: frame(st, 'bl', s) };
    }
    const gy = Math.round(H * 0.8), q = P ? 0.72 : 1.04;
    let s = sky(W, H * 0.46, { warm: 0.5, sun: [W * 0.8, 30] }) + hills(W, H * 0.44) + field(W, H, H * 0.44, { vanish: W * 0.5 });
    s += this.row(W, H * 0.52, q * 0.4, n + 2, () => ({ tint: 'red' }));
    const sick = step === 3 ? 0 : this._sick;
    s += this.row(W, gy + 4, q, n, (i) => ({ tint: 'red', sick: i < sick ? 0.92 : 0 }));
    const t = step === 3 ? 'One good variety, in large numbers' : `${sick} of ${n} plants sick`;
    s += label(W / 2, 34, t, { size: P ? 19 : 24, display: true });
    return { svg: frame(st, 'bl', s) };
  }
}
