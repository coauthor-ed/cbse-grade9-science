// RootTipFieldScene - blk-l08-n02. A drawn, stained onion root tip in an eyepiece. Beat 0: most cells show a round nucleus;
// tap the five that look different; they ring, the count rises, once all five are found the find is celebrated. Beat 1: the
// five marked, the rest dim. Beat 2: four cells enlarged in shuffled order; tap the one that comes first; then the order
// shows 1 to 4. Stages stay unnamed. Stage order: thick threads in a nucleus, lined up, pulled apart, two nuclei.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, labelWhite, stroke } from '../shared/PlantArt.js';
import { cwFrame, eyepiece, T, mx, n1, rnd } from '../shared/CellWorld.js';

const one = (idx) => [{ idx, dwellMs: null }];
const INK = mx('series-5', 'strata-6', 44);
const CHR = mx('series-6', 'strata-6', 56);
function rods(x, y, n, spread, h, rot, dir) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const u = n > 1 ? i / (n - 1) - 0.5 : 0, px = x + Math.cos(rot) * u * spread, py = y + Math.sin(rot) * u * spread, l = h * (0.8 + ((i * 7) % 5) * 0.08), a = rot + Math.PI / 2 + u * 0.5;
    const ex = Math.cos(a) * l * dir, ey = Math.sin(a) * l * dir;
    s += `<path d="M${n1(px)} ${n1(py)}q${n1(ex * 0.5 + 2)} ${n1(ey * 0.5)} ${n1(ex)} ${n1(ey)}" ${stroke(CHR, Math.max(2.4, h * 0.26))}/>`;
  }
  return s;
}
/** One stained cell. kind 0 resting, 1 thick threads, 2 lined up, 3 pulled apart, 4 two nuclei. */
function tipCell(x, y, w, h, kind, seed, o = {}) {
  const q = rnd(seed + 3), r = Math.min(w, h) * 0.34, wall = mx('series-5', 'strata-6', 58);
  let s = `<rect x="${n1(x - w / 2)}" y="${n1(y - h / 2)}" width="${n1(w)}" height="${n1(h)}" rx="${n1(Math.min(w, h) * 0.12)}" style="fill:${mx('series-5', 'elev-peak', 26)};stroke:${wall};stroke-width:${o.bw ?? 2.2}"/>`;
  const n = Math.round(w * h * 0.006);
  for (let i = 0; i < n; i++) s += `<circle cx="${n1(x + (q() - 0.5) * w * 0.86)}" cy="${n1(y + (q() - 0.5) * h * 0.82)}" r="${n1(0.7 + q() * 1)}" style="fill:${INK};opacity:.34"/>`;
  const nucleus = (cx, cy, R) => `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R)}" style="fill:${mx('series-5', 'series-6', 62)};opacity:.72;stroke:${mx('series-5', 'strata-6', 60)};stroke-width:1.6"/>`;
  if (kind === 0) {
    s += nucleus(x, y, r);
    for (let i = 0; i < Math.round(r * 1.6); i++) { const a = q() * 6.28, d = q() * r * 0.84; s += `<circle cx="${n1(x + Math.cos(a) * d)}" cy="${n1(y + Math.sin(a) * d)}" r="${n1(0.7 + q() * 0.9)}" style="fill:${INK};opacity:.5"/>`; }
    s += `<circle cx="${n1(x + r * 0.2)}" cy="${n1(y - r * 0.14)}" r="${n1(r * 0.28)}" style="fill:${CHR}"/>`;
  } else if (kind === 1) {
    s += nucleus(x, y, r * 1.08);
    for (let i = 0; i < 7; i++) { const a = q() * 6.28, a2 = a + 1.4 + q(), d = r * 0.8; s += `<path d="M${n1(x + Math.cos(a) * d)} ${n1(y + Math.sin(a) * d)}Q${n1(x + (q() - 0.5) * r)} ${n1(y + (q() - 0.5) * r)} ${n1(x + Math.cos(a2) * d)} ${n1(y + Math.sin(a2) * d)}" ${stroke(CHR, Math.max(2, r * 0.13))}/>`; }
  } else if (kind === 2) {
    s += rods(x, y, 8, h * 0.62, r * 0.46, Math.PI / 2, 1) + rods(x, y, 8, h * 0.62, r * 0.46, Math.PI / 2, -1);
  } else if (kind === 3) {
    s += rods(x - w * 0.22, y, 8, h * 0.56, r * 0.5, Math.PI / 2, -1) + rods(x + w * 0.22, y, 8, h * 0.56, r * 0.5, Math.PI / 2, 1);
  } else {
    s += nucleus(x - w * 0.27, y, r * 0.62) + nucleus(x + w * 0.27, y, r * 0.62) + `<path d="M${n1(x)} ${n1(y - h * 0.42)}V${n1(y + h * 0.42)}" ${stroke(wall, 2, 'stroke-dasharray:5 4;opacity:.7')}/>`;
  }
  return s;
}
const PICK = [[2, 1, 1], [4, 2, 2], [1, 3, 3], [3, 1, 4], [2, 4, 3]]; // col, row, kind (cells that differ); row 4 kind 3 repeats as the book's field does
const ORDER = [3, 1, 4, 2]; // shuffled display: kinds in this order on screen; the first in time is kind 1

export class RootTipFieldScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 444;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A round microscope field of stained onion root tip cells, drawn. Most have a round nucleus with one dark spot. Five look different: thick threads, a line of rods across the middle, two groups pulled apart, or two small nuclei. Tap them to find them. Then four such cells are shown larger, and you tap the one that comes first.';
  static CONTROLS = [];

  async setup() {
    this._found = new Set(); this._first = null;
    await super.setup();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 400 : 430; }
  enter(step) { this._found = new Set(); this._first = null; this._said = false; this._fb = ''; if (step === 1) PICK.forEach((_, i) => this._found.add(i)); }

  _geom(st) {
    const W = st.W, H = st.H, P = st.portrait, cx = W / 2, cy = P ? H * 0.5 : H * 0.5, R = P ? 168 : 186, cw = P ? 62 : 70, ch = P ? 52 : 58;
    return { W, H, P, cx, cy, R, cw, ch, x0: cx - 2.5 * cw, y0: cy - 3 * ch };
  }
  _cellAt(g, c, r) { return [g.x0 + (c + (r % 2 ? 0.1 : 0)) * cw(g), g.y0 + r * g.ch + g.ch * 0.5]; }

  pointerDown(p) {
    const st = this.sv, g = this._geom(st), step = this.stepIndex;
    if (step === 0) {
      let hit = -1;
      PICK.forEach(([c, r], i) => { const [x, y] = this._cellAt(g, c, r); if (Math.abs(p.x - x) < g.cw / 2 && Math.abs(p.y - y) < g.ch / 2) hit = i; });
      if (hit < 0) { this._fb = 'That cell has a round nucleus.'; this.repaint(); return false; }
      if (!this._found.has(hit)) this._found.add(hit);
      this._fb = '';
      this.repaint();
      if (this._found.size === PICK.length) this.celebrate();
      return false;
    }
    if (step === 2) {
      const b = this._boxes(g);
      let hit = -1;
      b.forEach(([x, y, w, h], i) => { if (Math.abs(p.x - x) < w / 2 + 2 && Math.abs(p.y - y) < h / 2 + 2) hit = i; });
      if (hit < 0) return false;
      const was = this._first;
      this._first = ORDER[hit];
      this.repaint();
      if (this._first === 1 && was !== 1) this.celebrate(b[hit][0], b[hit][1]);
      return false;
    }
    return false;
  }
  _boxes(g) {
    const { W, H, P } = g, w = P ? 150 : 170, h = P ? 134 : 150, gx = P ? 12 : 22, gy = P ? 14 : 18, y0 = P ? 66 : 76;
    return [0, 1, 2, 3].map((i) => [W / 2 + (i % 2 ? 1 : -1) * (w + gx) / 2, y0 + (i >> 1) * (h + gy) + h / 2, w, h]);
  }

  paint(st) {
    const g = this._geom(st), { W, H, P } = g, step = this.stepIndex;
    if (step === 2) {
      let s = `<rect width="${W}" height="${H}" style="fill:${mx('strata-6', 'sea-deep', 76)}"/>`;
      s += labelWhite(W / 2, P ? 32 : 38, this._first === 1 ? 'The cell with thick threads comes first' : this._first ? 'Look for a nucleus that is still whole' : 'Tap the cell that comes first', { size: P ? 16 : 21, display: true });
      this._boxes(g).forEach(([x, y, w, h], i) => {
        const k = ORDER[i], done = this._first === 1;
        s += `<rect x="${n1(x - w / 2 - 4)}" y="${n1(y - h / 2 - 4)}" width="${n1(w + 8)}" height="${n1(h + 8)}" rx="16" style="fill:${mx('series-5', 'elev-peak', 16)};stroke:${done && k === 1 ? T('gold') : mx('series-5', 'strata-6', 66)};stroke-width:${done && k === 1 ? 4 : 2}"/>`;
        s += tipCell(x, y, w * 0.9, h * 0.86, k, k + 2, { bw: 3 });
        if (done) s += `<circle cx="${n1(x - w / 2 + 20)}" cy="${n1(y - h / 2 + 20)}" r="17" style="fill:${T('gold')};stroke:${mx('gold', 'strata-6', 66)};stroke-width:2.4"/><text x="${n1(x - w / 2 + 20)}" y="${n1(y - h / 2 + 27)}" text-anchor="middle" style="font-family:var(--sim-font-display);font-weight:700;font-size:21px;fill:${T('strata-6')}">${k}</text>`;
      });
      return { svg: cwFrame(st, 'rt', s) };
    }
    const q = rnd(4); let body = '';
    const kinds = new Map(PICK.map(([c, r, k], i) => [`${c},${r}`, { k, i }]));
    for (let r = 0; r < 6; r++) for (let c = -1; c < 7; c++) {
      const [x, y] = this._cellAt(g, c, r), hit = kinds.get(`${c},${r}`), lit = hit && this._found.has(hit.i);
      const dimmed = step === 1 && !hit;
      body += `<g${dimmed ? ' opacity=".42"' : ''}>${tipCell(x, y, g.cw - 2, g.ch - 2, hit ? hit.k : 0, Math.round(q() * 100))}</g>`;
      if (lit) body += `<rect x="${n1(x - g.cw / 2 + 1)}" y="${n1(y - g.ch / 2 + 1)}" width="${g.cw - 4}" height="${g.ch - 4}" rx="9" ${stroke(T('gold'), 4)}/>`;
    }
    let s = eyepiece(W, H, g.cx, g.cy, g.R, body, { id: 'rt-e', tint: 'pink' });
    const line = step === 1 ? 'Different stages of division' : this._found.size === PICK.length ? 'All five found' : this._fb || `Found ${this._found.size} of ${PICK.length}`;
    s += labelWhite(W / 2, H - (P ? 4 : 8), line, { size: P ? 16 : 19, display: true });
    return { svg: cwFrame(st, 'rt', s) };
  }
}
function cw(g) { return g.cw; }
