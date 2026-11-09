// OnionJarsResult - blk-l04-s2 (observe; answers the predict on blk-l04-s3). A day slider (1 to 7) in the scene sets
// both the jars and a live two-line graph; the roots in the jars match the graph on every day (29 px per cm, the
// same scale as OnionJars). Numbers from the book's graph: Jar A 0.2, 0.8, 1.8, 2.9, 3.8, 4.9, 5.8; Jar B 0.2, 0.7,
// 1.6, 2.6, 1.6, 1.6, 1.6 cm. In that graph the tips are cut after the day 4 reading, so Jar B is cut from day 5 on.
//   results  both lines, slider at day 7
//   trend    Jar A: about 1 cm a day; Jar B: 1 cm shorter at the cut, then flat
//   answer   Jar B lit, Jar A dimmed: Jar B stops getting longer
import { SvgScene, chip, mountEl } from 'simulations/base/kit/SimSvg.js';
import { tapMin } from '../shared/TapMin.js';
import { PLANT_COLOR_MAP, stroke } from '../shared/PlantArt.js';
import { cwFrame, T, n1 } from '../shared/CellWorld.js';
import { sill, onionDefs, onionJar } from '../shared/OnionArt2.js';

const one = (idx) => [{ idx, dwellMs: null }];
const A = [0.2, 0.8, 1.8, 2.9, 3.8, 4.9, 5.8], B = [0.2, 0.7, 1.6, 2.6, 1.6, 1.6, 1.6], K = 29, CUT_AFTER = 4;
const CA = 'var(--sim-series-3)', CB = 'var(--sim-series-8)';
const CSS = `.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }
.ojr-row { display: flex; align-items: center; gap: 12px; padding: 6px 8px 2px; }
.ojr-row label { font: 800 var(--sim-text-lg)/1 var(--sim-font-display, var(--sim-font)); color: var(--sim-label); min-width: 64px; }
.ojr-row input { flex: 1 1 auto; min-height: var(--tap-min, 44px); accent-color: var(--sim-accent); cursor: pointer; }`;

export class OnionJarsResult extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 510;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 616;
  static MIN_SCALE = 0.85;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'Two onion jars and a graph of root length against day, days 1 to 7. Jar A roots grow about 1 cm a day to 5.8 cm. Jar B roots reach 2.6 cm, are cut 1 cm shorter, and then stay at 1.6 cm. A day slider sets the jars and the graph together.';
  static CONTROLS = [];

  async setup() {
    this._day = 7;
    await super.setup(); tapMin(this);
    const row = mountEl(this.root, 'ojr-row');
    row.innerHTML = '<label for="ojr-day">Day 7</label><input id="ojr-day" type="range" min="1" max="7" step="1" value="7" aria-label="Day">';
    this._lab = row.querySelector('label');
    this._in = row.querySelector('input');
    this._in?.addEventListener('input', () => { this._day = Number(this._in.value) || 7; this.repaint(); });
    this.repaint();
  }
  enter() { this._day = 7; }
  stageHeight(st) { return st.portrait ? 500 : 380; }
  css() { return CSS; }

  paint(st) {
    const step = this.stepIndex, W = st.W, H = st.H, P = st.portrait, d = this._day ?? 7;
    if (this._in && Number(this._in.value) !== d) this._in.value = String(d);
    if (this._lab) this._lab.textContent = `Day ${d}`;
    // jars: left half (landscape) or the top (portrait)
    const kk = P ? 22 : K, jh = P ? 170 : 236, jw = P ? 92 : 100, jr = P ? 36 : 44, gy = P ? 254 : H - 44, xa = P ? W * 0.27 : W * 0.15, xb = P ? W * 0.73 : W * 0.38;
    let s = `<defs>${onionDefs()}</defs>` + sill(W, P ? gy + 40 : H, gy + 6, 'ojr');
    const cutB = d > CUT_AFTER;
    const a = onionJar(xa, gy + 6, { w: jw, h: jh, r: jr, len: A[d - 1] * kk, seed: 3, id: 'ra' });
    const b = onionJar(xb, gy + 6, { w: jw, h: jh, r: jr, len: B[d - 1] * kk, cut: cutB, seed: 7, id: 'rb' });
    const dimA = step === 2 ? 0.35 : 1;
    s += `<g opacity="${dimA}">${a.svg}</g>${b.svg}`;
    // each jar's reading sits in its name pill under the jar; a dashed tick in the jar marks the root ends
    let over = chip(`Jar A: ${A[d - 1]} cm`, xa, gy + 26, { tone: 3 }) + chip(`Jar B: ${B[d - 1]} cm`, xb, gy + 26, { tone: 8 });
    for (const [x, j, v, col, op] of [[xa, a, A[d - 1], CA, dimA], [xb, b, B[d - 1], CB, 1]]) { const ty = j.base[1] + v * kk + 2; s += `<path d="M${n1(x - jw * 0.44)} ${n1(ty)}H${n1(x + jw * 0.44)}" ${stroke(col, 2.4, `stroke-dasharray:5 4;opacity:${op}`)}/>`; }
    // the graph panel
    const gx0 = P ? 12 : W * 0.53, gx1 = W - 12, gy0 = P ? gy + 40 : 14, gy1 = P ? H - 10 : H - 14;
    s += `<rect x="${n1(gx0 + 3)}" y="${n1(gy0 + 5)}" width="${n1(gx1 - gx0)}" height="${n1(gy1 - gy0)}" rx="14" style="fill:${T('strata-6')};opacity:.18;filter:url(#cw-blur3)"/><rect x="${n1(gx0)}" y="${n1(gy0)}" width="${n1(gx1 - gx0)}" height="${n1(gy1 - gy0)}" rx="14" style="fill:var(--sim-bg-surface);stroke:var(--sim-stroke);stroke-width:2"/>`;
    const px0 = gx0 + 44, px1 = gx1 - 16, py0 = gy0 + (P ? 34 : 42), py1 = gy1 - (P ? 60 : 66);
    const X = (day) => px0 + ((day - 1) / 6) * (px1 - px0), Y = (cm) => py1 - (cm / 6) * (py1 - py0);
    for (let c = 0; c <= 6; c++) s += `<path d="M${n1(px0)} ${n1(Y(c))}H${n1(px1)}" ${stroke('var(--sim-track)', c ? 1.2 : 2.4)}/>` + (P && c % 2 ? '' : `<text x="${n1(px0 - 10)}" y="${n1(Y(c) + 5)}" text-anchor="end" style="font:700 14px var(--sim-font);fill:var(--sim-label-muted)">${c}</text>`);
    for (let i = 1; i <= 7; i++) s += `<text x="${n1(X(i))}" y="${n1(py1 + 20)}" text-anchor="middle" style="font:700 14px var(--sim-font);fill:var(--sim-label-muted)">${i}</text>`;
    s += `<text x="${n1(px1 + 6)}" y="${n1(py1 + 40)}" text-anchor="end" style="font:800 14px var(--sim-font);fill:var(--sim-label)">day</text><text x="${n1(gx0 + 12)}" y="${n1(gy0 + 20)}" style="font:800 14px var(--sim-font);fill:var(--sim-label)">root length (cm)</text>`;
    // day marker
    s += `<path d="M${n1(X(d))} ${n1(py0 - 6)}V${n1(py1)}" ${stroke('var(--sim-accent)', 2.4, 'stroke-dasharray:5 4')}/>`;
    // the cut: between the day 4 and day 5 readings of Jar B
    const cx = (X(4) + X(5)) / 2;
    if (d > CUT_AFTER) s += `<path d="M${n1(cx)} ${n1(Y(2.6) - 6)}V${n1(Y(1.6) + 6)}" ${stroke(CB, 2, 'stroke-dasharray:3 3')}/>`;
    const line = (vals, col, w, o2) => {
      const pts = vals.slice(0, d).map((v, i) => [X(i + 1), Y(v)]);
      let out = pts.length > 1 ? `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${n1(p[0])} ${n1(p[1])}`).join('')}" ${stroke(col, w, `stroke-linejoin:round;opacity:${o2}`)}/>` : '';
      for (const p of pts) out += `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${w + 2}" style="fill:${col};stroke:var(--sim-bg-surface);stroke-width:2;opacity:${o2}"/>`;
      return out;
    };
    s += line(A, CA, step === 2 ? 3 : 4, dimA) + line(B, CB, step === 2 ? 5.5 : 4, 1);
    over += chip('numbers from the book\'s graph', (gx0 + gx1) / 2 - 24, gy1 - 12, { tone: 'plain', cls: 'sv-chip--sm' });
    if (d > CUT_AFTER && !(P && step === 2)) over += chip('cut', cx, Y(2.6) - 20, { tone: 8, cls: 'sv-chip--sm' });
    if (step === 1 && d >= 7) over += chip('about 1 cm a day', X(4.6), Y(4.6) - 26, { tone: 3 }) + chip('then flat', X(6), Y(1.6) - 22, { tone: 8 });
    if (step === 2 && d >= 5) over += chip('Jar B stops getting longer', Math.min(px1 - 90, X(5.4)), Y(1.6) - 30, { tone: 8 });
    const head = chip(['The results', 'Jar A grows, Jar B stops', 'The answer'][step] ?? '', 0, 0, { tone: 'plain', static: true });
    return { svg: cwFrame(st, 'ojr', s), over, head };
  }
}
