// FieldEstimateScene - Activity 2.1 in the eyepiece. Numbers on the figure are computed from FIELD_MM and the count.
//   0 ruler across the field, 5 mm  1 5 x 1000 = 5000 um  2 peel with 25 cells along a line  3 5000 / 25 = 200 um
//   4 another peel: press Count one cell along the line, 20 in all, the working fills in as the count grows. Celebrate once, at the last cell.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwDefs, eyepiece, onionField, T, mx, n1 } from '../shared/CellWorld.js';
import { PLANT_COLOR_MAP, label, frame, stroke, fill, ctlBar } from '../shared/PlantArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const FIELD_MM = 5, N1 = 25, N2 = 20, UM = FIELD_MM * 1000;

export class FieldEstimateScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4)];
  static WIDTH = 640;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 520;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A round microscope field 5 millimetres wide, measured with a clear ruler. Then an onion peel with 25 cells along a line across the field, which gives 5000 divided by 25, or 200 micrometres for one cell. Last, a second peel to count, with a button that counts one cell at a time.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 420; }
  async setup() {
    this._n = 0; this._done = false;
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'btn', id: 'count', label: 'Count one cell', go: true }, { kind: 'btn', id: 'again', label: 'Start again' }], (id) => {
      if (id === 'again') { this._n = 0; this._done = false; }
      if (id === 'count' && this._n < N2) { this._n += 1; if (this._n === N2 && !this._done) { this._done = true; this.celebrate?.(); } }
      this.ctl.disable('count', this._n >= N2); this.repaint();
    });
    this.enter(this.stepIndex);
  }
  enter(step) { this._n = 0; this._done = false; const on = step === 4; this.ctl?.show('count', on); this.ctl?.show('again', on); this.ctl?.disable('count', false); }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, R = Math.min(W * 0.42, H * 0.38), cx = W / 2, cy = R + 34;
    const size = P ? 16 : 18, x0 = cx - R, unit = (2 * R) / FIELD_MM;
    let body = '', s = `<defs>${cwDefs()}</defs>`;
    if (step <= 1) {
      // a clear ruler: mm marks, read straight off the field
      body += `<rect x="${n1(x0 - 20)}" y="${n1(cy - 26)}" width="${n1(2 * R + 40)}" height="62" ${fill(mx('sky-day', 'elev-peak', 26))} opacity=".7"/>`;
      for (let i = 0; i <= 10; i++) { const x = x0 + (i * unit) / 2, L = i % 2 ? 12 : 22; body += `<path d="M${n1(x)} ${n1(cy - 26)}v${L}" ${stroke(T('strata-6'), i % 2 ? 1.6 : 2.6)}/>`; if (i % 2 === 0) body += `<text x="${n1(x)}" y="${n1(cy + 16)}" text-anchor="middle" style="font:800 16px var(--sim-font);fill:${T('strata-6')}">${i / 2}</text>`; }
    } else {
      const n = step === 4 ? N2 : N1, cw = (2 * R) / n, rows = Math.ceil((2 * R) / (cw * 1.7)) + 1, ch = cw * 1.7, yTop = cy - (Math.floor(rows / 2) + 0.5) * ch;
      body += onionField(x0, yTop, 2 * R, rows * ch, { cols: n, rows, tint: step === 4 ? 'series-4' : 'strata-2', seed: step === 4 ? 9 : 3, nucleus: false });
      const counted = step === 4 ? this._n : n;
      for (let i = 0; i < counted; i++) { const x = x0 + (i + 0.5) * cw; body += `<circle cx="${n1(x)}" cy="${n1(cy)}" r="${n1(Math.max(3, cw * 0.28))}" ${fill(T('magma'))}/>`; }
      body += `<path d="M${n1(x0)} ${n1(cy)}H${n1(x0 + 2 * R)}" ${stroke(T('magma'), 2.2)}/>`;
      for (let i = 5; i <= counted; i += 5) if (x0 + (i - 0.5) * cw + 16 < cx + Math.sqrt(R * R - 625) - 4) body += label(x0 + (i - 0.5) * cw, cy + 25, String(i), { size: P ? 16 : 19, display: true });
    }
    s += eyepiece(W, H, cx, cy, R, body, { id: `fe${step}`, tint: 'pale' });
    const ty = cy + R + (P ? 48 : 44);
    const line = [`field width: ${FIELD_MM} mm`, `${FIELD_MM} x 1000 = ${UM} \u00b5m`, `${N1} cells along the line`, `${UM} \u00b5m / ${N1} = ${UM / N1} \u00b5m`][step] ?? (this._n < N2 ? `counted so far: ${this._n}` : `${UM} \u00b5m / ${N2} = ${UM / N2} \u00b5m`);
    s += label(W / 2, ty, line, { size: P ? 20 : 24, display: true });
    return { svg: frame(st, 'fe', s) };
  }
}
