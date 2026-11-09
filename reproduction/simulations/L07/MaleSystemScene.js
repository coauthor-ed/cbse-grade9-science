// MaleSystemScene - one figure for two slides. A cut-away side section of the lower body, labelled like the book's
// diagram: no skin detail, no face. Predict setup (MAX or 1 beat): the outline with two marked places and no testes.
// Answer slide, 5 beats: scrotum and testis, testis with its hormone, the way out (sperm route), the glands, the sperm.
// Tap-light chips under the figure light one part. Controls: .tl-row chips.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { maleSystemSvg, MALE_PT, MALE_ROUTE, BODY_CSS, travel, frame, tag, leader, spermSvg, panel, n } from '../shared/BodyArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const CHIPS = [
  { id: 'testis', label: 'Testis', targets: ['testis'], tone: 2 },
  { id: 'scrotum', label: 'Scrotum', targets: ['scrotum'], tone: 8 },
  { id: 'vas', label: 'Vas deferens', targets: ['vas'], tone: 1 },
  { id: 'urethra', label: 'Urethra', targets: ['urethra'], tone: 5 },
  { id: 'vesicle', label: 'Seminal vesicle', targets: ['vesicle'], tone: 3 },
  { id: 'prostate', label: 'Prostate gland', targets: ['prostate'], tone: 8 },
];
// beat 0-4 of the answer: which parts the sentence names
const BEAT = [['testis', 'scrotum'], ['testis'], ['testis', 'vas', 'urethra', 'penis'], ['vesicle', 'prostate'], []];
const NAME = { testis: 'Testis', scrotum: 'Scrotum', vas: 'Vas deferens', urethra: 'Urethra', vesicle: 'Seminal vesicle', prostate: 'Prostate gland', bladder: 'Urinary bladder', penis: 'Penis' };
// label slots: [side, row]
const SLOT = { vesicle: ['R', 0], vas: ['L', 0], bladder: ['L', 1], prostate: ['L', 2], urethra: ['L', 2.75], testis: ['L', 4.1], scrotum: ['R', 4.1], penis: ['L', 3.42] };

export class MaleSystemScene extends SvgScene {
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [one(0)], 1: [one(0)], 5: [one(1), one(2), one(3), one(4), one(5)] };
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4), one(5)];
  static WIDTH = 640;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 510;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A labelled cut-away side view of the male reproductive system: testis in the scrotum, vas deferens, seminal vesicle, prostate gland, urinary bladder, urethra and penis.';

  tl = tapLight({ label: 'Parts of the male system', chips: CHIPS, onChange: () => this.repaint() });
  css() { return `${BODY_CSS}.svs { padding: 0; }`; }
  stageHeight(st) { return st.portrait ? 330 : 360; }
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.enter(this.stepIndex); this.repaint(); }
  destroy() { this.tl.destroy(); super.destroy(); }
  enter(step) {
    if (!this.tl?.mount) return;
    const show = step >= 1;
    this.tl.set({ chips: show ? CHIPS : [], lit: null });
    this.relayout?.();
  }
  _lit() {
    const t = this.tl.lit?.() ?? [], step = this.stepIndex;
    if (t.length) return t;
    return step >= 1 ? BEAT[step - 1] : null;
  }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    const k = P ? 0.84 : 0.98, ax = (W - 356 * k) / 2 + (P ? 26 : 10), ay = P ? 8 : 12;
    const pt = (p) => [ax + p[0] * k, ay + p[1] * k];
    const size = 14, rowH = (H - 40) / 4.4, rowY = (r) => 26 + r * rowH;
    if (step === 0) {
      let s = maleSystemSvg(ax, ay, k, { parts: ['bladder', 'urethra'] });
      const a = pt(MALE_PT.placeA), b = pt(MALE_PT.placeB);
      for (const [p, l, ry] of [[[a[0] + 44 * k, a[1] + 90 * k], 'A', 34], [b, 'B', 40]]) s += `<ellipse cx="${n(p[0])}" cy="${n(p[1])}" rx="${n(36 * k)}" ry="${n(ry * k)}" style="fill:none;stroke:var(--sim-label);stroke-width:3;stroke-dasharray:8 7"/>` + tag(p[0], p[1], l, { size: 17, display: true });
      return { svg: frame(st, 'ms', s, { field: { a: 1, b: 8, seed: 5, k: 11 } }) };
    }
    const lit = this._lit();
    const dim = (id) => !!lit && !lit.includes(id);
    const litF = (id) => !!lit?.includes(id);
    const go = step === 3 && !this.tl.any?.() ? travel(spermSvg(0, 0, 7, 26, 0, { phase: 1 }), MALE_ROUTE, { t: 3 }) : '';
    let s = maleSystemSvg(ax, ay, k, { dim, lit: litF, extra: go });
    const list = lit ?? [];
    for (const id of list) {
      const [side, r] = SLOT[id];
      const y = rowY(r), lab = NAME[id], ax0 = side === 'L' ? 8 : W - 8;
      const p = pt(id === 'scrotum' ? [160, 326] : MALE_PT[id]);
      s += leader(side === 'L' ? ax0 + 60 : ax0 - 60, y, p[0], p[1]);
      const words = lab.split(' ');
      if (P && words.length === 2) {
        s += tag(ax0, y - 13, words[0], { anchor: side === 'L' ? 'start' : 'end', size }) + tag(ax0, y + 13, words[1], { anchor: side === 'L' ? 'start' : 'end', size });
      } else s += tag(ax0, y, lab, { anchor: side === 'L' ? 'start' : 'end', size });
    }
    if (step === 5 && !this.tl.any?.()) {
      const cw = P ? W - 28 : 420, chh = 156, cx = (W - cw) / 2, cy = (H - chh) / 2;
      s += panel(cx, cy, cw, chh);
      const hx = cx + cw * 0.78, hy = cy + 78;
      s += spermSvg(hx, hy, 24, cw * 0.56, 0, { phase: 1 });
      s += tag(cx + cw - 10, cy + 26, 'Head: genetic material', { size: 15, display: true, anchor: 'end' }) + tag(cx + 12, cy + chh - 26, 'Long tail: swims', { size: 15, display: true, anchor: 'start' });
    }
    return { svg: frame(st, 'ms', s, { field: { a: 1, b: 8, seed: 5, k: 11 } }) };
  }
}
