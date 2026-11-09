// OnionCheek - Fig 2.8 through the eyepiece. b0 onion peel, regular boxes. b1 cheek cells, irregular and scattered;
// the two chips swap the field. b2 both side by side, the question stays open: no wall named yet. Controls: view.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwFrame, eyepiece, onionField, mx } from '../shared/CellWorld.js';
import { ctlBar, labelWhite } from '../shared/PlantArt.js';
import { cheekField, eyepieceBare } from './FieldArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];

export class OnionCheek extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 680; static HEIGHT = 520; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 490;
  static ARIA_LABEL = 'Two microscope views. Onion peel cells are box-shaped and lie in regular rows. Cheek cells are irregular in shape and lie scattered.';
  static CONTROLS = [];
  _v = 'onion';

  async setup() {
    await super.setup();
    this.bar = ctlBar(this, [{ kind: 'seg', id: 'view', label: 'Slide', value: 'onion', options: [{ value: 'onion', label: 'Onion peel' }, { value: 'cheek', label: 'Cheek cells' }] }], (id, v) => { this._v = v; this.repaint(); });
    this.enter(this.stepIndex);
    this.repaint();
  }
  destroy() { this.bar?.destroy(); super.destroy(); }
  enter(step) {
    this._v = step === 0 ? 'onion' : 'cheek';
    this.bar?.set('view', this._v);
    this.bar?.show('view', step === 1);
  }
  stageHeight(st) { return st.portrait ? (this.stepIndex === 2 ? 450 : 390) : 416; }
  paint(st) {
    const { W, H, portrait: P } = st; let g = '';
    const field = (v, cx, cy, R) => (v === 'onion' ? onionField(cx - R, cy - R, 2 * R, 2 * R, { cols: 6, rows: 9, seed: 5, tint: 'series-6' }) : cheekField(cx, cy, R, 0, false));
    if (this.stepIndex < 2) {
      const v = this._v, cx = W / 2, cy = H / 2 + 8, R = Math.min(W, H) / 2 - (P ? 24 : 34);
      g += eyepiece(W, H, cx, cy, R, field(v, cx, cy, R), { id: 'oc-e', tint: v === 'onion' ? 'pink' : 'blue' });
      g += labelWhite(P ? W / 2 : 22, 24, v === 'onion' ? 'Onion peel, red stain' : 'Cheek cells, blue stain', { size: 16, anchor: P ? 'middle' : 'start' });
      g += labelWhite(W / 2, H - 8, v === 'onion' ? 'Box-shaped, in regular rows' : 'Irregular, scattered', { size: 15 });
    } else {
      const rr = P ? 112 : 142, a = P ? { x: W / 2, y: 112 + 16 } : { x: W * 0.27, y: H / 2 }, b = P ? { x: W / 2, y: H - 124 - 10 } : { x: W * 0.73, y: H / 2 };
      g += `<rect width="${W}" height="${H}" style="fill:${mx('strata-6', 'sea-deep', 80)}"/>`;
      g += eyepieceBare(a.x, a.y, rr, field('onion', a.x, a.y, rr), 'oc-a', 'cw-fieldP') + eyepieceBare(b.x, b.y, rr, field('cheek', b.x, b.y, rr), 'oc-b', 'cw-fieldB');
      if (P) g += labelWhite(W / 2, 18, 'Onion peel', { size: 15 }) + labelWhite(W / 2, H - 8, 'Cheek cells', { size: 15 });
      else g += labelWhite(a.x, 32, 'Onion peel', { size: 16 }) + labelWhite(b.x, 32, 'Cheek cells', { size: 16 }) + labelWhite(W / 2, H - 14, 'Why are they so different?', { size: 16 });
    }
    return { svg: cwFrame(st, 'oc', g) };
  }
}
