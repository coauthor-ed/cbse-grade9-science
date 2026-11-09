// FlowerWhorlScene - L04 blk-l04-s01, 6 beats. A flower cut in half, as in a textbook section, big and centred. Each beat lights
// what it names: all, sepal (with a bud beside it), petal, stamen, pistil, ovary and ovule (with one ovule enlarged to show the egg cell).
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { label } from '../shared/PlantArt.js';
import { frame, leader, phoneMin, flowerSection, flowerBud, ovuleZoom, backdrop } from '../shared/FlowerArt.js';

const CHIPS = [
  { id: 'sepal', label: 'Sepal', targets: ['sepal'] },
  { id: 'petal', label: 'Petal', targets: ['petal'] },
  { id: 'stamen', label: 'Stamen', targets: ['stamen'] },
  { id: 'pistil', label: 'Pistil', targets: ['pistil', 'ovary', 'ovule'] },
];
const LIT = [null, 'sepal', 'petal', 'stamen', 'pistil', 'pistil'];
const DIM = 'opacity:0.2';

export class FlowerWhorlScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }], [{ idx: 4 }], [{ idx: 5 }]];
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 480;
  static ARIA_LABEL = 'A flower cut in half lengthwise, showing sepals, petals, stamens with anther and filament, and the pistil with stigma, style and ovary holding ovules. Each part lights as the text names it.';
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [];
  tl = tapLight({ label: 'Parts of the flower', chips: CHIPS, onChange: () => this.repaint() });

  async setup() { await super.setup(); this.tl.mount(this.root, this); }
  stageHeight(st) { return st.portrait ? 380 : 400; }
  enter(step) { this.tl.set({ lit: LIT[step] ?? null }); }

  paint(st) {
    const W = st.W, H = st.H, p = st.portrait, b = this.stepIndex;
    const s = p ? Math.min(0.92, (W - 8) / 340) : 1.2, cx = p ? W / 2 : W / 2, by = H - (p ? 104 : 96);
    const lit = this.tl.lit(), any = lit.length > 0;
    const off = (t) => (any && !lit.includes(t) ? DIM : '');
    const part = (n) => {
      if (b === 5 && lit[0] === 'pistil' && n === 'pistil') return 'opacity:0.5';
      if (b === 4 && lit[0] === 'pistil' && (n === 'ovary' || n === 'ovule')) return 'opacity:0.5';
      return off(n);
    };
    const X = (u) => cx + u * s, Y = (v) => by + v * s;
    let art = backdrop('bokeh', W, H, {});
    art += flowerSection(cx, by, s, { part });
    const L = [];
    const tag = (txt, px, py, ax, ay, anchor) => { L.push(leader(px + (anchor === 'end' ? 4 : anchor === 'start' ? -4 : 0), py - 5, X(ax), Y(ay))); L.push(label(px, py, txt, { size: 16, anchor })); };
    const lx = p ? 8 : cx - 300, rx = p ? W - 8 : cx + 300;
    const sh = (t) => any ? lit.includes(t) : false;
    if (!any) {
      tag('Petal', rx, 120, 140, -100, 'end'); tag('Sepal', lx, H - 62, -78, 20, 'start'); tag('Stamen', lx, 56, -92, -100, 'start'); tag('Pistil', rx, 36, 12, -204, 'end');
    }
    if (sh('sepal')) tag('Sepal', rx, H - 66, 80, 20, 'end');
    if (sh('petal')) tag('Petal', rx, 56, 120, -110, 'end');
    if (sh('stamen')) { tag('Anther', lx, 56, -84, -92, 'start'); tag('Filament', rx, 56, 46, -62, 'end'); }
    if (b === 5 ? false : sh('pistil')) { tag('Stigma', rx, 40, 8, -204, 'end'); tag('Style', lx, 90, -6, -150, 'start'); tag('Ovary', lx, H - 70, -28, -40, 'start'); }
    if (b === 5 && sh('pistil')) tag('Ovary', lx, H - 70, -28, -40, 'start');
    art += L.join('');
    if (b === 1 && lit[0] === 'sepal') {
      const bx = p ? 56 : 92, by2 = p ? 150 : 200, bs = p ? 0.8 : 1.05;
      art += flowerBud(bx, by2, bs, {}) + label(bx, by2 + 62 * bs + 6, 'A bud', { size: 16 });
    }
    if (b === 5 && lit[0] === 'pistil') {
      const zx = p ? W - 74 : W - 112, zy = p ? 116 : 136, zs = p ? 0.84 : 1.1;
      art += leader(X(14), Y(-46), zx - 50 * zs, zy + 30 * zs) + ovuleZoom(zx, zy, zs, {}) + label(zx, zy - 86 * zs, 'Ovule', { size: 16 }) + label(zx, zy - 22 * zs, 'Egg cell', { size: 15 });
    }
    return { svg: frame(st, 'fw', art) };
  }
  destroy() { this.tl.destroy(); super.destroy(); }
}
