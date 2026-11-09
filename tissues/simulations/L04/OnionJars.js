// OnionJars - blk-l04-s1 (the method) and the setup of the predict blk-l04-s3 (role setup lands on the last beat).
//   two-jars  two narrow glass jars of water on a window sill, a red onion on each mouth, base in the water,
//             short white roots; Jar A and Jar B
//   measure   a ruler beside each jar, from the bulb base to the root end; Day 1, Day 2, Day 3 buttons in the scene
//             (rest: Day 3). Lengths from the book's graph: A 0.2, 0.8, 1.8; B 0.2, 0.7, 1.6 cm
//   cut       day 3: about 1 cm cut from Jar B's root tips (the cut bits lie on the sill, scissors beside), Jar A
//             uncut. No length after the cut and nothing about days 4 to 7: the prediction comes next.
// The same picture scale (29 px per cm) as OnionJarsResult, so the roots match its graph.
import { SvgScene, chip, mountEl } from 'simulations/base/kit/SimSvg.js';
import { tapMin } from '../shared/TapMin.js';
import { PLANT_COLOR_MAP, stroke } from '../shared/PlantArt.js';
import { cwFrame, T, mx, n1 } from '../shared/CellWorld.js';
import { sill, onionDefs, onionJar, rootBits, ruler } from '../shared/OnionArt2.js';

const one = (idx) => [{ idx, dwellMs: null }];
const A = [0.2, 0.8, 1.8], B = [0.2, 0.7, 1.6], K = 29;
const CSS = `.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }
.oj-row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; padding: 8px 0 2px; }
.oj-row[hidden] { display: none; }
.oj-row button { min-height: var(--tap-min, 44px); min-width: 88px; padding: 6px 16px; border-radius: var(--sim-radius-pill); border: var(--sim-border); border-color: var(--sim-stroke);
  background: var(--sim-bg-surface); color: var(--sim-label); font: 800 var(--sim-text-md)/1.1 var(--sim-font); cursor: pointer;
  box-shadow: 0 calc(3px * var(--look-lip, 1)) 0 var(--sim-stroke); }
.oj-row button[aria-pressed="true"] { background: color-mix(in oklab, var(--sim-accent) 22%, var(--sim-bg-surface)); border-color: var(--sim-accent); box-shadow: 0 calc(3px * var(--look-lip, 1)) 0 var(--sim-accent); }`;

function scissors(x, y, k = 1) {
  const steel = mx('strata-5', 'elev-peak', 40), dk = mx('strata-5', 'strata-6', 60), grip = T('series-1');
  return `<g transform="translate(${n1(x)} ${n1(y)}) scale(${k}) rotate(-12)"><ellipse cx="4" cy="16" rx="58" ry="7" style="fill:${T('strata-6')};opacity:.2"/>`
    + `<path d="M0 0L64 -10L66 -6L4 6Z" style="fill:${steel};stroke:${dk};stroke-width:1.6"/><path d="M0 2L62 12L60 16L-2 8Z" style="fill:${mx(steel, 'strata-6', 80)};stroke:${dk};stroke-width:1.6"/>`
    + `<circle cx="2" cy="4" r="3.4" style="fill:${dk}"/><path d="M0 0C-14 -6 -26 -18 -40 -16C-54 -14 -54 2 -40 4C-28 6 -14 2 0 2Z" style="fill:${grip};stroke:${mx('series-1', 'strata-6', 60)};stroke-width:2"/><ellipse cx="-38" cy="-6" rx="8" ry="5" style="fill:${mx('sea-shallow', 'elev-peak', 50)}"/>`
    + `<path d="M0 6C-12 12 -22 26 -36 26C-50 26 -52 12 -40 8C-28 4 -14 8 0 6Z" style="fill:${grip};stroke:${mx('series-1', 'strata-6', 60)};stroke-width:2"/><ellipse cx="-38" cy="17" rx="8" ry="4.6" style="fill:${mx('sea-shallow', 'elev-peak', 50)}"/></g>`;
}

export class OnionJars extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 530;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 560;
  static MIN_SCALE = 0.85;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'Two narrow glass jars of water on a window sill, Jar A and Jar B, each with a red onion on its mouth and white roots growing into the water. The roots are measured with a ruler on days 1, 2 and 3. On day 3 about 1 cm is cut from the root tips in Jar B; Jar A is left uncut.';
  static CONTROLS = [];

  async setup() {
    this._day = 3;
    await super.setup(); tapMin(this);
    this._row = mountEl(this.root, 'oj-row');
    this._row.setAttribute('role', 'group');
    this._row.setAttribute('aria-label', 'Measuring day');
    for (const d of [1, 2, 3]) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = `Day ${d}`; b.dataset.day = String(d);
      b.addEventListener('click', () => { this._day = d; this.repaint(); });
      this._row.appendChild(b);
    }
    this.repaint();
  }
  enter() { this._day = 3; }
  stageHeight(st) { return st.portrait ? 420 : 400; }
  css() { return CSS; }

  paint(st) {
    const step = this.stepIndex, W = st.W, H = st.H, P = st.portrait, gy = H - (P ? 46 : 52);
    if (this._row) {
      this._row.hidden = step !== 1;
      for (const b of this._row.children) b.setAttribute('aria-pressed', String(Number(b.dataset.day) === this._day));
    }
    const day = step === 0 ? 2 : step === 1 ? this._day : 3;
    const jw = P ? 104 : 120, jh = P ? 230 : 236, r = P ? 44 : 50, xa = W * (P ? 0.21 : 0.26), xb = W * (P ? 0.6 : 0.62);
    let s = `<defs>${onionDefs()}</defs>` + sill(W, H, gy + 6, 'oj');
    const a = onionJar(xa, gy + 6, { w: jw, h: jh, r, len: A[day - 1] * K, seed: 3, id: 'oja' });
    const cutNow = step === 2;
    const b = onionJar(xb, gy + 6, { w: jw, h: jh, r, len: (cutNow ? B[2] - 1 : B[day - 1]) * K, cut: cutNow, seed: 7, id: 'ojb' });
    s += a.svg + b.svg;
    let over = '';
    const lab = (x, t) => chip(t, x, gy + (P ? 26 : 28), { tone: 'plain' });
    over += lab(xa, 'Jar A') + lab(xb, 'Jar B');
    if (step === 1) {
      const rx = (x) => x + jw / 2 + (P ? 6 : 12);
      s += ruler(rx(xa), a.base[1], 2, K, { reading: A[day - 1] }) + ruler(rx(xb), b.base[1], 2, K, { reading: B[day - 1] });
      over += chip(`${A[day - 1]} cm`, xa, a.base[1] + A[day - 1] * K + 26, { tone: 3 }) + chip(`${B[day - 1]} cm`, xb, b.base[1] + B[day - 1] * K + 26, { tone: 8 });
    }
    if (step === 2) {
      // the removed tips: faint where they were, and lying cut on the sill in front of Jar B
      const ty = b.base[1] + (B[2] - 1) * K;
      s += `<path d="M${n1(xb - jw * 0.36)} ${n1(ty)}H${n1(xb + jw * 0.36)}" ${stroke(T('series-6'), 2.6, 'stroke-dasharray:6 4')}/>`;
      const bx = xb + jw / 2 + (P ? 34 : 86);
      s += scissors(P ? xb + 10 : bx - 52, gy + (P ? 22 : 10), P ? 0.55 : 0.85) + rootBits(P ? bx : bx + 26, gy + (P ? 2 : 14), 6, K * 1, 9);
      over += chip(P ? '1 cm tips' : 'about 1 cm cut off', Math.min(W - (P ? 40 : 84), P ? bx : bx), gy - (P ? 26 : 30), { tone: 6 }) + chip('not cut', xa, a.base[1] + A[2] * K + 26, { tone: 'plain' }) + chip('tips cut', xb, ty + 24, { tone: 'plain' });
    }
    const head = chip(step === 0 ? 'Same water, same light' : `Day ${day}`, 0, 0, { tone: 'plain', static: true });
    return { svg: cwFrame(st, 'oj', s), over, head };
  }
}
