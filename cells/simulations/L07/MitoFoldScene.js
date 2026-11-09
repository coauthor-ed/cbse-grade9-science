// MitoFoldScene - blk-l05-s06. Beat 0: a cell with its mitochondria lit. Beat 1: one mitochondrion cut open: two membranes
// lit in turn by the labels. Beat 2: Folds slider; the reading is the measured length of the drawn inner membrane, the
// outline does not change. Beat 3: glucose comes in, ATP goes out. Control name: Folds.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label, leader, ctlBar } from '../shared/PlantArt.js';
import { cwFrame, depthField, animalCell, T, mx, n1 } from '../shared/CellWorld.js';
import { mitoHero, mitoLength } from './OrganelleHero.js';

const one = (idx) => [{ idx, dwellMs: null }];
const DIM = 0.3;

export class MitoFoldScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 482;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A cell with its mitochondria lit, then one mitochondrion cut open: a smooth outer membrane and an inner membrane folded into finger-like cristae. A Folds slider deepens the folds while the outline stays the same size and a reading shows how much longer the inner membrane has become. On the last step glucose goes in and ATP comes out.';
  static CONTROLS = [];

  async setup() {
    this._fold = 1;
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'range', id: 'fold', label: 'Folds', min: 0, max: 100, step: 5, value: 0, read: (v) => `${v}%`, say: (v) => `folds ${v} per cent deep` }], (id, v) => { this._fold = v / 100; this.repaint(); });
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 330 : 400; }
  enter(step) {
    this._fold = step === 2 ? 0.2 : 1;
    if (step === 3) this.play(3);
    if (!this.ctl) return;
    this.ctl.show('fold', step === 2);
    this.ctl.set('fold', Math.round(this._fold * 100));
  }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    let s = depthField(W, H, { tone: 'rose', seed: 11 });
    if (step === 0) {
      const r = P ? 142 : 186, cy = H * 0.52, cx = W * 0.5;
      s += animalCell(cx, cy, r, { part: (n) => (n === 'mito' || n === 'membrane' ? 1 : 0.34), seed: 9 });
      s += label(W / 2, 32, 'Mitochondria in a cell', { size: P ? 19 : 23, display: true });
      return { svg: cwFrame(st, 'mf', s) };
    }
    const cx = W * 0.5, cy = H * (P ? 0.5 : 0.52), rx = P ? 146 : 262, ry = P ? 106 : 142;
    const lit = step === 1 ? ['outer', 'inner', 'space'] : step === 2 ? ['inner'] : ['inner', 'matrix'];
    const dim = (n) => (lit.includes(n) ? 1 : (step === 3 ? 0.7 : (n === 'matrix' || n === 'space' ? 0.8 : 0.42)));
    s += mitoHero(cx, cy, rx, ry, { fold: this._fold, dim, rot: -5 });
    const fs = P ? 14 : 16;
    if (step === 1) {
      s += leader(W * (P ? 0.18 : 0.2), P ? 42 : 50, cx - rx * 0.62, cy - ry * 0.88) + label(W * (P ? 0.25 : 0.2), P ? 30 : 38, 'Outer membrane', { size: fs });
      s += leader(W * (P ? 0.76 : 0.8), P ? 42 : 50, cx + rx * 0.48, cy - ry * 0.62) + label(W * (P ? 0.74 : 0.8), P ? 30 : 38, 'Inner membrane', { size: fs });
      s += leader(W * 0.5, H - (P ? 40 : 46), cx + rx * 0.05, cy + ry * 0.24) + label(W * 0.5, H - (P ? 18 : 24), 'Cristae', { size: fs + 1, display: true });
    }
    if (step === 2) {
      const k = mitoLength(rx, ry, this._fold) / mitoLength(rx, ry, 0);
      s += label(W / 2, P ? 30 : 36, 'Same size outside', { size: P ? 15 : 18 });
      s += label(W / 2, H - (P ? 16 : 20), `Inner membrane: ${k.toFixed(1)} times as long`, { size: P ? 17 : 21, display: true });
    }
    if (step === 3) {
      s += '<g data-anim="flow"></g>';
      s += label(W * (P ? 0.2 : 0.14), P ? 30 : 38, 'Glucose in', { size: fs + 1, display: true }) + label(W * (P ? 0.5 : 0.56), H - (P ? 14 : 18), 'ATP out', { size: fs + 1, display: true });
    }
    return { svg: cwFrame(st, 'mf', s) };
  }

  animate(st, t) {
    if (this.stepIndex !== 3) return;
    const el = this.sv?.wrap?.querySelector?.('[data-anim="flow"]');
    if (!el) return;
    const W = st.W, H = st.H, P = st.portrait, u = Math.min(1, t / 3);
    let s = '';
    const hex = (x, y, r, a) => `<path d="M${n1(x + r)} ${n1(y)}l${n1(-r / 2)} ${n1(r * 0.87)}h${n1(-r)}l${n1(-r / 2)} ${n1(-r * 0.87)}l${n1(r / 2)} ${n1(-r * 0.87)}h${n1(r)}Z" style="fill:${T('series-2')};stroke:${mx('series-2', 'strata-6', 60)};stroke-width:2.4;opacity:${a}"/>`;
    const coin = (x, y, a) => `<g opacity="${a}"><circle cx="${n1(x)}" cy="${n1(y)}" r="${P ? 12 : 15}" style="fill:${T('gold')};stroke:${mx('gold', 'strata-6', 60)};stroke-width:2.4"/><circle cx="${n1(x - 4)}" cy="${n1(y - 5)}" r="3" style="fill:${T('elev-peak')};opacity:.8"/></g>`;
    const r = P ? 11 : 14;
    for (let i = 0; i < 3; i++) {
      const v = Math.max(0, Math.min(1, u * 1.6 - i * 0.28));
      const x = W * (0.1 + i * 0.1) + v * W * 0.22, y = H * (0.18 + i * 0.05) + v * H * 0.22;
      s += hex(x, y, r, v >= 1 ? 0.28 : 1);
      const c = Math.max(0, Math.min(1, u * 1.8 - 0.7 - i * 0.14));
      if (c > 0) s += coin(W * (0.56 + i * 0.03) + c * W * (0.34 - i * 0.09), H * 0.56 + c * H * (0.3 - i * 0.03 * (P ? 0.4 : 1)), 1);
    }
    el.innerHTML = s;
  }
}
