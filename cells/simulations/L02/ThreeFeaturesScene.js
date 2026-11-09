// ThreeFeaturesScene - one stained cell in one eyepiece, three separate features. The image is really blurred and really faded here.
//   beat 0 More magnification: size grows, blur grows with it, since resolution is unchanged, so detail does not appear
//   beat 1 Better resolution: same size, blur goes  beat 2 More contrast: same size, nucleus stands out
// Blur in screen px = DETAIL x magnification / resolution. Each beat shows its one control and starts from a fixed state.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwDefs, eyepiece, animalCell, T, n1 } from '../shared/CellWorld.js';
import { PLANT_COLOR_MAP, label, frame, ctlBar } from '../shared/PlantArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const MAGS = [400, 1000, 2000];
const START = [{ m: 0, r: 1, c: 1 }, { m: 1, r: 1, c: 1 }, { m: 1, r: 3, c: 1 }];

export class ThreeFeaturesScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 520;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'One stained cell in a round microscope field. More magnification makes it larger and more blurred. Better resolution sharpens it at the same size. More contrast makes the nucleus stand out.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 390 : 410; }
  async setup() {
    this._v = { ...START[0] };
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'btn', id: 'm', label: 'More magnification', go: true }, { kind: 'btn', id: 'r', label: 'Better resolution', go: true }, { kind: 'btn', id: 'c', label: 'More contrast', go: true }, { kind: 'btn', id: 'back', label: 'Start again' }], (id) => {
      if (id === 'back') this._v = { ...START[this.stepIndex] };
      if (id === 'm') this._v.m = Math.min(MAGS.length - 1, this._v.m + 1);
      if (id === 'r') this._v.r = 3;
      if (id === 'c') this._v.c = 2;
      this._sync(); this.repaint();
    });
    this.enter(this.stepIndex);
  }
  _sync() { const v = this._v; this.ctl?.disable('m', v.m >= MAGS.length - 1); this.ctl?.disable('r', v.r >= 3); this.ctl?.disable('c', v.c >= 2); }
  enter(step) { this._v = { ...START[step] }; for (const [i, id] of ['m', 'r', 'c'].entries()) this.ctl?.show(id, i === step); this._sync(); }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, R = Math.min(W * 0.42, H * 0.38), cx = W / 2, cy = R + 32, v = this._v, mag = MAGS[v.m];
    const scale = mag / 1000, blur = (mag / 400) * 1.1 / v.r, fil = `blur(${n1(blur)}px) contrast(${v.c === 2 ? 1.5 : 0.62}) saturate(${v.c === 2 ? 1.5 : 0.55})`;
    const body = `<g style="filter:${fil}" transform="translate(${n1(cx)} ${n1(cy)}) scale(${n1(scale)})">${animalCell(0, 0, R * 0.92, { seed: 9 })}</g>`;
    let s = `<defs>${cwDefs()}</defs>` + eyepiece(W, H, cx, cy, R, body, { id: 'tf-e', tint: 'blue' });
    s += label(W / 2, cy + R + 34, `${mag}X, ${v.r >= 3 ? 'sharp' : mag > 400 ? 'blurred' : 'small'}${v.c === 2 ? ', strong contrast' : ''}`, { size: P ? 18 : 22, display: true });
    return { svg: frame(st, 'tf', s) };
  }
}
