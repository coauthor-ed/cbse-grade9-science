// LibrarySortScene - blk-l01-s01b, 3 beats. A library room. Beat 0: books in a heap on the floor; the learner presses
// Sort the books, they fly to the shelves and one book is found. Beat 1: the shelves, the book found. Beat 2: the same
// shelves hold living things, with the six uses of classification under them. Control: .ls-sort.
import { SvgScene, mountEl } from 'simulations/base/kit/SimSvg.js';
import { LIFE_COLOR_MAP } from '../shared/LifeArt.js';
import { fitBio, svgBioColour as bc } from '../shared/BioArt.js';
import { BIO_BTN_CSS, PLATE } from '../shared/BioBits.js';
import { words } from '../shared/SeaBits.js';

const one = (idx) => [{ idx, dwellMs: null }];
const USES = ['Organised study', 'Similar or different', 'How they are related', 'Naming new finds', 'Finding those at risk', 'One common system'];
const SHELF_ART = [['Mushroom', 'Mycelium'], ['FernPlant', 'Gulmohar', 'Leaf'], ['Beetle', 'Crab', 'Snail'], ['Tiger', 'Deer', 'Owl']];
const SUBJECTS = ['History', 'Maths', 'Biology', 'Stories'];
const rnd = (s) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const ease = (t) => 1 - (1 - t) ** 3;

export class LibrarySortScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 560; static HEIGHT = 500; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 570;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'A library room. Books lie in a heap on the floor. Pressing Sort the books moves them to labelled shelves and one book, On the Origin of Species, is found. Then the same shelves hold living things, with six uses of classification listed under them.';

  _sorted = false; _found = false;

  css() { return BIO_BTN_CSS + `.ls-bar { display: flex; justify-content: center; padding-top: 10px; } .ls-bar[hidden] { display: none; }`; }
  async setup() {
    await super.setup();
    this.bar = mountEl(this.root, 'ls-bar');
    this.bar.innerHTML = '<button type="button" class="bb-btn ls-sort">Sort the books</button>';
    this.bar.addEventListener('click', (e) => { if (e.target.closest?.('.ls-sort')) this._sort(); });
    this.enter(this.stepIndex); this.repaint();
  }
  stageHeight(st) { return st.portrait ? 480 : 430; }
  enter(step) {
    this._sorted = step > 0; this._found = step > 0; this._going = false;
    if (this.bar) this.bar.hidden = step !== 0;
    const b = this.bar?.querySelector?.('.ls-sort'); if (b) b.disabled = false;
    this.relayout?.();
  }
  _sort() {
    if (this._sorted || this._going) return;
    this._going = true; const b = this.bar?.querySelector?.('.ls-sort'); if (b) b.disabled = true;
    this.play(1.3);
    const step = this.stepIndex;
    this.after(1.35, () => { if (this.stepIndex !== step) return; this._going = false; this._sorted = true; this._found = true; this.repaint(); this.celebrate(); });
  }
  _layout(st) {
    const shelves = st.portrait ? 4 : 4, x0 = st.portrait ? 14 : 70, w = st.W - 2 * x0, top = 54, rowH = st.portrait ? 74 : 72;
    return { shelves, x0, w, top, rowH, floor: top + shelves * rowH + 10 };
  }
  _books(L, st, p) {
    // Each book has a place in the heap and a place on a shelf; p = 0 heap, 1 shelf. Same seed, so the same room every time.
    const r = rnd(4242), n = 40, out = [], perRow = 10, bw = (L.w - 26) / perRow;
    const heapH = st.H - L.floor;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / perRow), col = i % perRow, target = i === 24;
      const sx = L.x0 + 13 + col * bw + 2, h = 40 + (i * 7) % 14, sy = L.top + row * L.rowH + 62 - h, sw = bw - 5;
      const hx = st.W / 2 + (r() - 0.5) * (st.W - 90), hy = L.floor + 8 + r() * Math.max(10, heapH - 56) * 0.9, rot = (r() - 0.5) * 150;
      const u = ease(Math.min(1, Math.max(0, p * 1.5 - (i / n) * 0.5)));
      const x = hx + (sx - hx) * u, y = hy + (sy - hy) * u, a = rot * (1 - u);
      const col2 = target ? 'var(--sim-gold)' : `var(--sim-series-${(row * 3 + col) % 8 + 1})`;
      const fw = sw + (1 - u) * 18, fh = h - (1 - u) * 14;
      out.push(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})"><rect width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" rx="2.5" style="fill:color-mix(in oklab, ${col2} 86%, ${bc('white')});stroke:color-mix(in oklab, ${col2} 60%, black);stroke-width:1.4"/><rect x="2" y="6" width="${Math.max(3, fw - 4).toFixed(1)}" height="3" style="fill:${bc('white')};opacity:.6"/></g>`);
    }
    return out.join('');
  }
  _room(L, st) {
    let s = `<rect x="0" y="0" width="${st.W}" height="${L.floor}" rx="14" style="fill:${bc({ a: 'strata1', b: 'elevPeak', t: 0.62 })}"/>`;
    s += `<rect x="0" y="${L.floor}" width="${st.W}" height="${st.H - L.floor}" rx="10" style="fill:${bc({ a: 'strata2', b: 'strata3', t: 0.34 })}"/>`;
    s += PLATE(L.x0, L.top - 10, L.w, L.shelves * L.rowH + 8, { r: 8, fill: bc({ a: 'strata3', b: 'strata1', t: 0.34 }), rim: bc('barkDark') });
    for (let i = 0; i < L.shelves; i++) s += `<rect x="${L.x0 + 6}" y="${L.top + i * L.rowH + 62}" width="${L.w - 12}" height="6" style="fill:${bc('barkDark')}"/>`;
    return s;
  }
  paint(st) {
    const L = this._layout(st), step = this.stepIndex;
    let svg = this._room(L, st);
    if (step === 2) return { svg: svg + this._life(L, st) };
    if (this._sorted) {
      for (let i = 0; i < L.shelves; i++) svg += `<rect x="${st.W / 2 - 46}" y="${L.top + i * L.rowH - 6}" width="92" height="20" rx="6" style="fill:${bc('white')}"/>` + words(st.W / 2, L.top + i * L.rowH + 9, SUBJECTS[i], { size: 14, ink: bc('ink') });
    }
    svg += `<g data-books>${this._books(L, st, this._sorted ? 1 : 0)}</g>`;
    if (this._found) {
      const bw = (L.w - 26) / 10, x = L.x0 + 13 + 4 * bw + bw / 2, y = L.top + 2 * L.rowH + 62;
      svg += `<path d="M${x} ${y + 8}L${x} ${st.H - 50}" style="fill:none;stroke:${bc('ink')};stroke-width:2.5"/>`;
      const tw = Math.min(st.W - 16, 276);
      svg += PLATE((st.W - tw) / 2, st.H - 50, tw, 38, { r: 12, fill: 'var(--sim-gold)', rim: bc('ink') }) + words(st.W / 2, st.H - 25, 'On the Origin of Species', { size: 16, ink: bc('ink') });
    } else svg += words(st.W / 2, 32, 'Thousands of books, no order', { size: 18, display: true });
    if (this._found) svg += words(st.W / 2, 32, 'Found in one walk', { size: 18, display: true });
    return { svg };
  }
  animate(st, t) {
    if (!this._going) return;
    const g = this.sv.wrap.querySelector('[data-books]');
    if (g) g.innerHTML = this._books(this._layout(st), st, Math.min(1, t / 1.25));
  }
  _life(L, st) {
    let s = words(st.W / 2, 32, 'The same idea for living things', { size: 18, display: true });
    const cols = st.portrait ? 2 : 3, gw = (st.W - 8) / cols, chipH = 30, y0 = L.floor + 8;
    SHELF_ART.forEach((names, i) => {
      const sh = st.portrait ? (names.length ? L.w / names.length : 0) : L.w / names.length;
      names.forEach((n, k) => { s += fitBio(n, L.x0 + 10 + k * sh, L.top + i * L.rowH - 2, sh - 20, 64); });
    });
    USES.forEach((u, i) => {
      const c = i % cols, r = Math.floor(i / cols), x = 4 + c * gw, y = y0 + r * (chipH + 3);
      s += `<rect x="${x + 2}" y="${y}" width="${gw - 4}" height="${chipH}" rx="9" style="fill:${bc('white')}"/>` + words(x + gw / 2, y + 20, u, { size: 14, ink: bc('ink') });
    });
    return s;
  }
}
