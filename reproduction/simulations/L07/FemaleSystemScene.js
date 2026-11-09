// FemaleSystemScene - a labelled cut-away front view, like the book's diagram: ovaries, oviducts, uterus, cervix, vagina.
// 5 beats: one part or pair at a time, then the two routes meeting in an oviduct. The egg stays in the tube and moves
// along it (the tube moves it), the sperm route comes up from the vagina. Tap-light chips light a part. Not to scale.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { femaleSystemSvg, tubePt, BODY_CSS, travel, frame, tag, leader, n, BODY, eggSvg, spermSvg } from '../shared/BodyArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const CHIPS = [
  { id: 'ovary', label: 'Ovary', targets: ['ovary'], tone: 2 },
  { id: 'tube', label: 'Oviduct', targets: ['tube'], tone: 4 },
  { id: 'uterus', label: 'Uterus', targets: ['uterus', 'lining', 'cavity'], tone: 6 },
  { id: 'cervix', label: 'Cervix', targets: ['cervix'], tone: 5 },
  { id: 'vagina', label: 'Vagina', targets: ['vagina'], tone: 1 },
];
const BEAT = [['ovary'], ['tube'], ['uterus', 'lining', 'cavity'], ['cervix', 'vagina'], null];
const LAB = {
  ovary: { text: 'Ovary', at: [52, 214], to: [86, 150] },
  tube: { text: 'Oviduct (fallopian tube)', at: [344, 14], to: [340, 70], short: 'Oviduct' },
  uterus: { text: 'Uterus', at: [96, 268], to: [172, 150] },
  cervix: { text: 'Cervix', at: [344, 244], to: [244, 238] },
  vagina: { text: 'Vagina', at: [344, 304], to: [258, 300] },
};

export class FemaleSystemScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4)];
  static WIDTH = 640;
  static HEIGHT = 500;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 480;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A labelled cut-away front view of the female reproductive system: two ovaries, two oviducts, the uterus with its lining, the cervix and the vagina. On the last beat, the route of an egg along an oviduct and the route of sperm up through the uterus meet in that oviduct.';

  tl = tapLight({ label: 'Parts of the female system', chips: CHIPS, onChange: () => this.repaint() });
  css() { return `${BODY_CSS}.svs { padding: 0; }`; }
  stageHeight(st) { return st.portrait ? 300 : 370; }
  async setup() { await super.setup(); this.tl.mount(this.root, this); this.enter(this.stepIndex); this.repaint(); }
  destroy() { this.tl.destroy(); super.destroy(); }
  enter() { this.tl?.set?.({ lit: null }); this.relayout?.(); }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    const k = P ? 0.78 : 1.02, ax = (W - 440 * k) / 2, ay = P ? 10 : 14;
    const pt = (p) => [ax + p[0] * k, ay + p[1] * k];
    const t = this.tl.lit?.() ?? [];
    const lit = t.length ? t : BEAT[step];
    const route = step === 4 && !t.length;
    let s = femaleSystemSvg(ax, ay, k, { dim: (id) => !!lit && !lit.includes(id) && id !== 'ligament', lit: (id) => !!lit?.includes(id), lining: 0.55 });
    const ids = t.length ? CHIPS.filter((c) => c.targets.some((x) => t.includes(x))).map((c) => c.id) : route ? Object.keys(LAB) : (BEAT[step] ?? []).filter((x) => LAB[x]);
    for (const id of ids) {
      const L = LAB[id], [lx, ly] = pt(L.at), [tx, ty] = pt(L.to);
      s += leader(lx, ly, tx, ty, 'var(--sim-label)', 2.5, route ? 0.6 : 1) + tag(lx, ly, P || route ? (L.short ?? L.text) : L.text, { size: 14 });
    }
    if (route) {
      const [ex, ey] = tubePt('R', 0.5), e = pt([ex, ey]);
      const sp = [[220, 322], [220, 200], [240, 120], [262, 104], [ex - 22, ey + 2]].map(pt);
      s += `<path d="M${sp.map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}" style="fill:none;stroke:${BODY.sperm};stroke-width:5;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:3 11"/>`;
      const eg = [[354, 128], [392, 120], tubePt('R', 0.92), tubePt('R', 0.75), tubePt('R', 0.6)].map(pt);
      s += `<path d="M${eg.map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}" style="fill:none;stroke:${BODY.egg};stroke-width:6;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:3 11"/>`;
      const dp = (a) => `M${a.map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}`;
      s += travel(eggSvg(0, 0, P ? 8 : 10, { id: 'fe' }), dp([...eg, e]), { t: 2.4 }) + travel(spermSvg(0, 0, 4, 15, -6), dp(sp.slice(0, -1).concat([[e[0] - 16, e[1] + 2]])), { t: 2.6 });
    }
    return { svg: frame(st, 'fs', s, { field: { a: 5, b: 1, seed: 11, k: 11 } }) };
  }
}
