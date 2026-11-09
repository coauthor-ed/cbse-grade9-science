// RhoeoField - Fig 2.9 and the cheek half of the same test, in an eyepiece. A field of Rhoeo cells: walls fixed, the
// coloured content shrinks with minutes in 20 per cent sugar. Wall geometry never takes the minutes value.
//   setup  two eyepieces in plain water: the slides before any sugar, no result shown
//   b0  Rhoeo field, slider from 0
//   b1  one cell, close: wall, membrane, space. Slider stays, from 30
//   b2  cheek cells, slider from 0: no wall, the whole cell shrinks (dashed: first outline)
//   b3  the two side by side at 30 minutes, dashed first outlines in both
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwFrame, eyepiece, nucleus, n1, rnd, T, mx } from '../shared/CellWorld.js';
import { ctlBar, label, labelWhite, leader } from '../shared/PlantArt.js';
import { cheekField, eyepieceBare, pull } from './FieldArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const PINK = T('series-4'), INK = T('strata-6');
const WALL = mx('elev-low', 'elev-peak', 62), WALL_D = mx('elev-low', 'strata-6', 58);


/** Hex grid with shared, jittered corners: the wall map. */
function hexCells(cx, cy, R, r0) {
  const out = [], h = r0 * 1.5, w = r0 * Math.sqrt(3), key = (x, y) => `${Math.round(x)}:${Math.round(y)}`, memo = new Map(), q = rnd(11);
  const jit = (x, y) => { const k = key(x, y); if (!memo.has(k)) memo.set(k, [x + (q() - 0.5) * r0 * 0.34, y + (q() - 0.5) * r0 * 0.34]); return memo.get(k); };
  const rows = Math.ceil(R / h) + 1, cols = Math.ceil(R / w) + 1;
  for (let j = -rows; j <= rows; j++) for (let i = -cols; i <= cols; i++) {
    const x = cx + (i + (j & 1 ? 0.5 : 0)) * w, y = cy + j * h;
    if (Math.hypot(x - cx, y - cy) > R + r0) continue;
    const pts = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; pts.push(jit(x + Math.cos(a) * r0, y + Math.sin(a) * r0)); }
    out.push({ x, y, pts, seed: (i * 7 + j * 13 + 97) % 23 });
  }
  return out;
}
const closed = (p) => { let d = `M${n1((p[0][0] + p[p.length - 1][0]) / 2)} ${n1((p[0][1] + p[p.length - 1][1]) / 2)}`; for (let i = 0; i < p.length; i++) { const b = p[(i + 1) % p.length]; d += `Q${n1(p[i][0])} ${n1(p[i][1])} ${n1((p[i][0] + b[0]) / 2)} ${n1((p[i][1] + b[1]) / 2)}`; } return d + 'Z'; };
const inset = (c, k) => c.pts.map(([x, y]) => [c.x + (x - c.x) * k, c.y + (y - c.y) * k]);

/** One cell of the field. p is pull 0..1. r is the cell size, for the wall width. */
function rhoeoCell(c, p, r) {
  const f = 0.9 - p * (0.38 + (c.seed % 5) * 0.03), stained = c.seed % 5 !== 2, inner = closed(inset(c, f));
  const poly = `M${c.pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join('L')}Z`;
  let s = `<path d="${poly}" style="fill:${mx('series-4', 'elev-peak', p > 0.02 ? 7 : 12)}"/>`;
  if (stained) s += `<path d="${inner}" style="fill:url(#rf-pink) ${PINK}"/><path d="${closed(inset(c, f * 0.62))}" style="fill:${mx('series-4', 'elev-peak', 44)};opacity:.5"/>`;
  else s += `<path d="${inner}" style="fill:${mx('series-1', 'elev-peak', 8)};stroke:${mx('sea-shallow', 'sea-deep', 60)};stroke-width:1.2;opacity:.9"/>`;
  return s + `<path d="${poly}" style="fill:none;stroke:${WALL_D};stroke-width:${n1(r * 0.17)};stroke-linejoin:round;opacity:.5"/><path d="${poly}" style="fill:none;stroke:${WALL};stroke-width:${n1(r * 0.09)};stroke-linejoin:round"/>`;
}
const DEFS = `<radialGradient id="rf-pink" cx=".38" cy=".32" r=".8"><stop offset="0" style="stop-color:${mx('series-4', 'elev-peak', 52)}"/><stop offset=".6" style="stop-color:${mx('series-4', 'series-5', 82)}"/><stop offset="1" style="stop-color:${mx('series-4', 'strata-6', 62)}"/></radialGradient>`;

function rhoeoField(cx, cy, R, p) {
  const r0 = R * 0.3; let s = '';
  for (const c of hexCells(cx, cy, R, r0)) s += rhoeoCell(c, p, r0);
  return s;
}
function closeCell(cx, cy, r, p) {
  const c = { x: cx, y: cy, seed: 1, pts: [] }; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.08, w = 1 + [0.02, -0.05, 0.04, -0.02, 0.05, -0.04][k]; c.pts.push([cx + Math.cos(a) * r * w, cy + Math.sin(a) * r * 0.88 * w]); }
  const poly = `M${c.pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join('L')}Z`, f = 0.875 - p * 0.42, inner = closed(inset(c, f)), q = rnd(5);
  let s = `<path d="${poly}" style="fill:${mx('series-4', 'elev-peak', 10)}"/>`;
  s += `<path d="${inner}" style="fill:url(#rf-pink) ${PINK}"/>`;
  for (let i = 0; i < 90; i++) { const a = q() * 6.28, u = Math.sqrt(q()) * r * 0.74 * f; s += `<circle cx="${n1(cx + Math.cos(a) * u)}" cy="${n1(cy + Math.sin(a) * u * 0.86)}" r="${n1(0.8 + q() * 1.6)}" style="fill:${mx('series-4', 'elev-peak', 26)};opacity:.5"/>`; }
  s += nucleus(cx + r * 0.3 * f, cy - r * 0.26 * f, r * 0.17) + `<path d="${inner}" style="fill:none;stroke:${mx('series-5', 'strata-6', 66)};stroke-width:3"/><path d="${inner}" style="fill:none;stroke:${mx('series-4', 'elev-peak', 34)};stroke-width:7;opacity:.34"/>`;
  s += `<path d="${poly}" transform="translate(4 8)" style="fill:none;stroke:${INK};stroke-width:${n1(r * 0.17)};stroke-linejoin:round;opacity:.16;filter:url(#cw-blur3)"/>`;
  s += `<path d="${poly}" style="fill:none;stroke:${mx('elev-low', 'strata-6', 52)};stroke-width:${n1(r * 0.17)};stroke-linejoin:round"/><path d="${poly}" style="fill:none;stroke:url(#cw-wall) ${WALL};stroke-width:${n1(r * 0.14)};stroke-linejoin:round"/><path d="${poly}" style="fill:none;stroke:${mx('elev-low', 'elev-peak', 34)};stroke-width:${n1(r * 0.03)};stroke-linejoin:round;opacity:.7"/>`;
  return s;
}

/** The neighbours round the close cell: their walls, faint, so the cell sits in a tissue. */
function rhoeoFieldBig(cx, cy, r, W, H) {
  let s = ''; const off = [[1.9, 0.02], [-1.9, 0], [0.95, 1.6], [-0.95, 1.6], [0.95, -1.6], [-0.95, -1.6], [2.85, 1.6], [-2.85, 1.6], [2.85, -1.6], [-2.85, -1.6]];
  off.forEach(([u, v], i) => {
    const x = cx + u * r, y = cy + v * r, p = []; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.08; p.push([x + Math.cos(a) * r * 0.97, y + Math.sin(a) * r * 0.86]); }
    const c = { x, y, pts: p };
    s += `<path d="M${p.map(([a, b]) => `${n1(a)} ${n1(b)}`).join('L')}Z" style="fill:none;stroke:${WALL};stroke-width:${n1(r * 0.1)};opacity:.5"/><path d="${closed(inset(c, 0.45))}" style="fill:${mx('series-4', 'elev-peak', 40)};opacity:.5"/>`;
  });
  return s;
}

export class RhoeoField extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static BEAT_MAPS = { 1: [one(4)] };
  static WIDTH = 680; static HEIGHT = 540; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 470;
  static ARIA_LABEL = 'Rhoeo leaf peel cells and cheek cells in a round microscope view. In sugar solution the outlines of the Rhoeo cells stay fixed while their coloured content shrinks. Cheek cells shrink as whole cells.';
  static CONTROLS = [];
  _m = 0; _seen = {};

  async setup() {
    await super.setup();
    this.bar = ctlBar(this, [{ kind: 'range', id: 'min', label: 'Minutes in sugar', min: 0, max: 30, step: 1, value: 0, read: (v) => `${v} min` }], (id, v) => {
      this._m = v; this.repaint();
      const key = this.stepIndex;
      if (v >= 30 && !this._seen[key] && key !== 1) { this._seen[key] = true; this.celebrate(); }
    });
    this.enter(this.stepIndex);
    this.repaint();
  }
  destroy() { this.bar?.destroy(); super.destroy(); }
  onBeatChange(beat, count) {
    if (this.hostRole === 'setup') { super.onBeatChange(0, 1); return; }
    super.onBeatChange(beat, count);
  }
  enter(step) {
    this._m = step === 1 || step === 3 ? 30 : 0;
    this.bar?.set('min', this._m);
    this.bar?.show('min', step <= 2);
  }
  stageHeight(st) { return st.portrait ? ([380, 380, 380, 420, 420][this.stepIndex] ?? 380) : 430; }

  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex, m = this._m, p = pull(m);
    let g = `<defs>${DEFS}</defs>`;
    const eye = (cx, cy, R, body, id, tint) => eyepiece(W, H, cx, cy, R, body, { id, tint });
    if (step === 0 || step === 2) {
      const cx = W / 2, cy = H / 2 + (P ? 8 : 6), R = Math.min(W, H) / 2 - (P ? 22 : 34);
      g += eye(cx, cy, R, step === 0 ? rhoeoField(cx, cy, R, p) : cheekField(cx, cy, R, m, m > 0), 'rf-e', step === 0 ? 'pink' : 'blue');
      g += labelWhite(P ? W / 2 : 22, 24, step === 0 ? 'Rhoeo leaf peel' : 'Cheek cells', { size: 16, anchor: P ? 'middle' : 'start' });
    } else if (step === 1) {
      const cx = W / 2 + (P ? 0 : 0), cy = H / 2 + (P ? 16 : 0), r = P ? 128 : 170;
      g += `<rect width="${W}" height="${H}" style="fill:${mx('series-4', 'elev-peak', 8)}"/>` + rhoeoFieldBig(cx, cy, r, W, H) + closeCell(cx, cy, r, p);
      const f = 0.875 - p * 0.42, wx = cx + r * 0.94, ix = cx - r * 0.86 * f;
      if (P) {
        g += label(W - 14, 30, 'Cell wall: same size', { size: 14, anchor: 'end' }) + leader(W - 84, 37, cx + r * 0.46, cy - r * 0.78);
        g += label(cx - 76, H - 12, 'Cell membrane', { size: 14 }) + leader(cx - 76, H - 26, cx - r * 0.2 * (f / 0.46), cy + r * 0.76 * f);
        g += label(cx + 92, H - 12, 'Space', { size: 14 }) + leader(cx + 92, H - 26, cx + r * 0.52, cy + r * 0.3);
      } else {
        g += label(W - 18, 40, 'Cell wall: same size', { size: 16, anchor: 'end' }) + leader(W - 100, 48, cx + r * 0.56, cy - r * 0.74);
        g += label(84, H - 60, 'Cell membrane', { size: 16 }) + leader(100, H - 76, ix + 4, cy + r * 0.2);
        g += label(W - 92, H - 44, 'Space', { size: 16 }) + leader(W - 110, H - 60, cx + r * 0.54, cy + r * 0.26);
      }
    } else {
      const sugar = step === 3, mm = sugar ? 30 : 0;
      const R = P ? Math.min(W / 2 - 26, 92) + 40 : 150, a = P ? { x: W / 2, y: 116 } : { x: W * 0.27, y: H / 2 + 8 }, b = P ? { x: W / 2, y: H - 104 } : { x: W * 0.73, y: H / 2 + 8 };
      const rr = P ? 92 : R;
      g += `<rect width="${W}" height="${H}" style="fill:${mx('strata-6', 'sea-deep', 80)}"/>`;
      g += eyepieceBare(a.x, a.y, rr, rhoeoField(a.x, a.y, rr, pull(mm)), 'rf-a', 'cw-fieldP') + eyepieceBare(b.x, b.y, rr, cheekField(b.x, b.y, rr, mm, sugar), 'rf-b', 'cw-fieldB');
      const lx = (o) => (P ? o.x - rr - 8 : o.x);
      if (P) { g += labelWhite(10, a.y - rr + 16, 'Rhoeo', { size: 15, anchor: 'start' }) + labelWhite(10, b.y - rr + 16, 'Cheek', { size: 15, anchor: 'start' }); }
      else { g += labelWhite(lx(a), 30, 'Rhoeo leaf peel', { size: 16 }) + labelWhite(lx(b), 30, 'Cheek cells', { size: 16 }); }
      g += labelWhite(W / 2, H - 10, sugar ? '30 minutes in 20 per cent sugar' : 'Fresh slides, in water', { size: P ? 14 : 16 });
    }
    return { svg: cwFrame(st, 'rf', g) };
  }
}
