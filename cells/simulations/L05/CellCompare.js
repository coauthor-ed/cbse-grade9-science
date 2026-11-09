// CellCompare - Fig 2.10 and Table 2.1. Three drawn cells over a table the learner fills in (Activity 2.4).
//   setup  three outlines with the insides hidden
//   b0  the table: tap a row name to light that structure, tap squares to tick, Check table marks them
//   b1  table complete, the bacterial cell lit
//   b2  table complete, plant and animal lit: nucleus and organelles
//   b3  table complete, the plant cell's wall, chloroplasts and vacuole lit
// Controls: row buttons r0-r5, squares s<row><col>, Check table.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwFrame, animalCell, plantCell, bacterium, depthField, n1, T, mx } from '../shared/CellWorld.js';
import { label } from '../shared/PlantArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const COLS = ['Bacterial', 'Plant', 'Animal'];
const ROWS = [
  { name: 'Cell membrane', has: [1, 1, 1], lit: ['membrane'] },
  { name: 'Cell wall', has: [1, 1, 0], lit: ['wall'] },
  { name: 'Cytoplasm', has: [1, 1, 1], lit: ['cytoplasm'] },
  { name: 'Well-defined nucleus', has: [0, 1, 1], lit: ['nucleus'], skipBact: true },
  { name: 'Nucleoid', has: [1, 0, 0], lit: ['nucleoid'] },
  { name: 'Membrane-bound organelles', has: [0, 1, 1], lit: ['mito', 'chloro', 'golgi', 'er', 'vacuole', 'lysosome'] },
];
const ALL = () => ROWS.map((r) => r.has.slice());
const CSS = `
.cc-t { display: grid; grid-template-columns: minmax(0, 1fr) repeat(3, 60px); gap: 3px; width: 100%; margin-top: 6px; font: 800 var(--sim-text-sm)/1.15 var(--sim-font); color: var(--sim-label); }
.cc-h { text-align: center; align-self: end; padding-bottom: 2px; font-size: 14px; }
.cc-r, .cc-s { appearance: none; box-sizing: border-box; min-height: 44px; margin: 0; border: calc(2px * var(--look-rim)) solid var(--sim-stroke); border-radius: var(--sim-radius-sm); background: var(--sim-bg-surface); color: var(--sim-label); cursor: pointer; font: inherit; touch-action: pan-y; -webkit-tap-highlight-color: transparent; }
.cc-r { text-align: left; padding: 2px 6px; line-height: 1.1; }
.cc-r[aria-pressed="true"] { background: color-mix(in oklab, var(--primary-color, var(--sim-accent)) 26%, var(--sim-bg-surface)); border-color: var(--primary-color, var(--sim-accent)); }
.cc-s { font-size: 22px; line-height: 1; }
.cc-s[aria-checked="true"] { background: color-mix(in oklab, var(--sim-good) 22%, var(--sim-bg-surface)); }
.cc-s[data-bad="1"] { border-color: var(--sim-bad); background: color-mix(in oklab, var(--sim-bad) 20%, var(--sim-bg-surface)); }
.cc-s[disabled], .cc-r[disabled] { cursor: default; opacity: 1; color: var(--sim-label); }
.cc-foot { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 6px; font: 800 var(--sim-text-sm)/1.2 var(--sim-font); color: var(--sim-label); min-height: 46px; }
.cc-go { appearance: none; min-height: 44px; padding: 4px 16px; border: 0; border-radius: var(--look-pill); background: var(--primary-color, var(--sim-accent)); color: var(--on-primary, var(--sim-bg-deep)); font: 800 var(--sim-text-md)/1.2 var(--sim-font); cursor: pointer; box-shadow: 0 calc(3px * var(--look-lip)) 0 var(--primary-hover, var(--sim-stroke)); }
.cc-s:focus-visible, .cc-r:focus-visible, .cc-go:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.sim-dom-root:not(.sim-dom-root--portrait) .cc-r, .sim-dom-root:not(.sim-dom-root--portrait) .cc-s { min-height: 34px; }
.sim-dom-root:not(.sim-dom-root--portrait) .cc-t { grid-template-columns: minmax(0, 1fr) repeat(3, 66px); grid-column: 2; grid-row: 1; margin: 0; align-self: center; }
.sim-dom-root:not(.sim-dom-root--portrait) .cc-foot { grid-column: 2; grid-row: 2; }
.sim-dom-root.svs:not(.sim-dom-root--portrait) { display: grid; grid-template-columns: 250px minmax(0, 1fr); grid-template-rows: auto auto; column-gap: 12px; align-content: center; }
.sim-dom-root.svs:not(.sim-dom-root--portrait) .svs-host { grid-column: 1; grid-row: 1 / span 2; }
.sim-dom-root.svs[data-step="4"]:not(.sim-dom-root--portrait) { display: block; }
`;

export class CellCompare extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static BEAT_MAPS = { 1: [one(4)] };
  static WIDTH = 680; static HEIGHT = 470; static PORTRAIT_WIDTH = 330; static PORTRAIT_HEIGHT = 580;
  static ARIA_LABEL = 'A bacterial cell, a plant cell and an animal cell drawn side by side, above a table of six structures to tick for each cell.';
  static CONTROLS = [];
  _row = null; _ticks = ROWS.map(() => [0, 0, 0]); _bad = null; _won = false;
  css() { return CSS; }

  async setup() {
    await super.setup();
    const t = document.createElement('div'); t.className = 'cc-t'; t.setAttribute('role', 'grid'); this.tbl = t;
    const cell = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.textContent = html; t.appendChild(d); };
    cell('cc-h', '');
    COLS.forEach((c) => cell('cc-h', c));
    this._sq = [];
    this._rb = ROWS.map((r, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'cc-r'; b.textContent = r.name; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { this._row = this._row === i ? null : i; this._sync(); this.repaint(); });
      t.appendChild(b);
      this._sq[i] = COLS.map((c, j) => {
        const s = document.createElement('button'); s.type = 'button'; s.className = 'cc-s'; s.setAttribute('role', 'checkbox'); s.setAttribute('aria-label', `${r.name}, ${c} cell`);
        s.addEventListener('click', () => { this._ticks[i][j] ^= 1; this._row = i; this._bad = null; this._sync(); this.repaint(); });
        t.appendChild(s); return s;
      });
      return b;
    });
    this.root.appendChild(t);
    const f = document.createElement('div'); f.className = 'cc-foot'; this.foot = f;
    const go = document.createElement('button'); go.type = 'button'; go.className = 'cc-go'; go.textContent = 'Check table'; go.addEventListener('click', () => this._check()); this.go = go;
    const msg = document.createElement('span'); msg.setAttribute('aria-live', 'polite'); this.msg = msg;
    f.appendChild(go); f.appendChild(msg); this.root.appendChild(f);
    this.enter(this.stepIndex);
    this.repaint();
  }
  onBeatChange(beat, count) {
    if (this.hostRole === 'setup') { super.onBeatChange(0, 1); return; }
    super.onBeatChange(beat, count);
  }
  enter(step) {
    if (!this._sq) return;
    this._row = null; this._bad = null;
    if (step === 0) this._ticks = ROWS.map(() => [0, 0, 0]);
    else this._ticks = ALL();
    this.tbl.style.display = step === 4 ? 'none' : '';
    this.foot.style.display = step === 0 ? '' : 'none';
    this._msg('');
    this._sync();
  }
  _msg(t) { if (this.msg) this.msg.textContent = t; }
  _sync() {
    const locked = this.stepIndex !== 0;
    this._rb?.forEach((b, i) => { b.setAttribute('aria-pressed', String(this._row === i)); b.disabled = locked; });
    this._sq?.forEach((row, i) => row.forEach((s, j) => {
      const on = !!this._ticks[i][j]; s.setAttribute('aria-checked', String(on)); s.textContent = on ? '\u2713' : ''; s.dataset.bad = this._bad?.[i]?.[j] ? '1' : '0'; s.disabled = locked;
    }));
  }
  _check() {
    let wrong = 0; this._bad = ROWS.map((r, i) => r.has.map((h, j) => { const b = h !== this._ticks[i][j]; if (b) wrong += 1; return b; }));
    this._sync();
    if (wrong) { this._msg(`${wrong} square${wrong === 1 ? '' : 's'} to look at again.`); return; }
    this._msg('All correct.');
    if (!this._won) { this._won = true; this.celebrate(); }
  }
  /** Which parts are lit on which cell. null: everything at full strength. */
  _lit() {
    const s = this.stepIndex;
    if (s === 0 && this._row !== null) { const r = ROWS[this._row]; return { names: r.lit, cols: r.has }; }
    if (s === 1) return { names: null, cols: [1, 0, 0] };
    if (s === 2) return { names: ['nucleus', 'mito', 'chloro', 'golgi', 'er', 'vacuole', 'lysosome'], cols: [0, 1, 1] };
    if (s === 3) return { names: ['wall', 'chloro', 'vacuole'], cols: [0, 1, 0] };
    return null;
  }
  stageHeight(st) { return st.portrait ? (this.stepIndex === 4 ? 380 : 164) : 440; }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex, L = this._lit();
    let g = depthField(W, H, { tone: 'blue', seed: 2 });
    if (step === 4) {
      const pl = P ? [W * 0.27, 118] : [W * 0.5, H * 0.46], an = P ? [W * 0.73, 118] : [W * 0.84, H * 0.46], ba = P ? [W * 0.46, 298] : [W * 0.17, H * 0.46], q = mx('strata-5', 'sea-deep', 56), rim = mx('strata-6', 'sea-deep', 70);
      const shape = (d) => `<path d="${d}" style="fill:${q};stroke:${rim};stroke-width:4"/><path d="${d}" transform="scale(1)" style="fill:none;stroke:${T('elev-peak')};stroke-width:1.4;opacity:.3"/>`;
      const s = P ? 1 : 1.5, rect = (x, y, w, h, r) => `M${x - w / 2 + r} ${y - h / 2}H${x + w / 2 - r}Q${x + w / 2} ${y - h / 2} ${x + w / 2} ${y - h / 2 + r}V${y + h / 2 - r}Q${x + w / 2} ${y + h / 2} ${x + w / 2 - r} ${y + h / 2}H${x - w / 2 + r}Q${x - w / 2} ${y + h / 2} ${x - w / 2} ${y + h / 2 - r}V${y - h / 2 + r}Q${x - w / 2} ${y - h / 2} ${x - w / 2 + r} ${y - h / 2}Z`;
      g += shape(rect(pl[0], pl[1], 118 * s, 142 * s, 14)) + shape(`M${an[0] - 58 * s} ${an[1]}C${an[0] - 60 * s} ${an[1] - 64 * s} ${an[0] + 50 * s} ${an[1] - 74 * s} ${an[0] + 60 * s} ${an[1] - 6 * s}S${an[0] - 40 * s} ${an[1] + 70 * s} ${an[0] - 58 * s} ${an[1]}Z`) + shape(rect(ba[0], ba[1], 156 * (P ? 1 : 0.9), 62 * (P ? 1 : 0.9), 30));
      g += `<path d="M${n1(ba[0] + 76)} ${ba[1]}c24 -10 30 12 50 2" style="fill:none;stroke:${rim};stroke-width:4;stroke-linecap:round"/>`;
      const y1 = P ? 212 : H * 0.46 + 134;
      g += label(pl[0], y1 + 4, 'Plant cell', { size: P ? 17 : 20 }) + label(an[0], y1 + 4, 'Animal cell', { size: P ? 17 : 20 }) + label(ba[0], P ? 356 : y1 + 4, 'Bacterial cell', { size: P ? 17 : 20 });
    } else {
      const x = P ? [W / 6, W / 2, (W * 5) / 6] : [H * 0.13, H * 0.45, H * 0.8], cy = P ? H / 2 : W / 2 - 14, u = P ? 1 : 1.22, at = (i) => (P ? [x[i], cy] : [cy, x[i] - 6]);
      const fn = (col) => (n) => { if (!L) return 1; if (!L.cols[col]) return 0.22; if (!L.names) return 1; return L.names.includes(n) ? 1 : 0.22; };
      const bf = fn(0);
      g += bacterium(...at(0), P ? 0.5 : 0.56, { rot: P ? 90 : 0, part: (n) => bf(n === 'nucleus' ? 'nucleoid' : n) });
      g += plantCell(...at(1), 92 * u, 112 * u, { part: fn(1) });
      g += animalCell(...at(2), 50 * u, { part: fn(2) });
      if (step === 1) {
        const [bx, by] = at(0), k = P ? 0.5 : 0.56;
        g += P ? label(bx + 8, by + 96 * k + 22, 'Tail for moving', { size: 16, anchor: 'start' }) : label(bx + 196 * k, by - 30, 'Tail for moving', { size: 18, anchor: 'end' });
      }
      g += (P ? '' : label(W / 2, x[0] + 56, 'Bacterial', { size: 18 }) + label(W / 2, x[1] + 82, 'Plant', { size: 18 }) + label(W / 2, x[2] + 68, 'Animal', { size: 18 }));
    }
    return { svg: cwFrame(st, 'cc', g) };
  }
}
