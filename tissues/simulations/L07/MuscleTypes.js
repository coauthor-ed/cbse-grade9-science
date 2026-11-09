// MuscleTypes - blk-l07-s12 (6 beats: voluntary, skeletal, involuntary, smooth, cardiac, compare). Fig 3.13.
// Voluntary: an arm lifts a school bag when you choose (Lift the bag). Skeletal: long cylindrical unbranched fibres,
// many nuclei at the edge, clear light and dark bands; they contract strongly on a tap. Involuntary: food moves along
// the intestine and the heart beats on their own. Smooth: spindle cells, thick in the middle, pointed at both ends, one
// central nucleus, NO bands; a slow squeeze passes along the sheet. Cardiac: cylindrical BRANCHED fibres, one nucleus
// each, faint bands, joined end to end; a steady beat that never stops. Compare: all three side by side.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapMin, TAP_MIN_CSS } from '../shared/TapMin.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { PLANT_COLOR_MAP } from '../shared/PlantArt.js';
import { cwFrame, depthField, mx, n1, rnd } from '../shared/CellWorld.js';
import { BODY_CSS, tag, leader, field, tube, form } from '../shared/BodyArt.js';
import { taDefs } from '../shared/TissueArt.js';
import { heartSvg } from '../shared/OrganArt.js';
import { ARM, armGeom, armSvg, tweenTo, cancelTween, drawOnly, INK, W_, MUS, MUS_D } from '../shared/LimbArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const UP = 1.68;
const NUC = mx('series-5', INK, 64), NUC_L = mx('series-5', W_, 50), SM = mx(MUS, W_, 70);

// -- tissue drawings, each in a local box ------------------------------------------------------------------
/** Skeletal: n long unbranched fibres, clear bands (a dashed stroke across the width), many nuclei at the edge. */
function skeletal(x, y, w, h, n = 4) {
  const fh = (h - (n - 1) * 8) / n, q = rnd(4);
  let s = '';
  for (let i = 0; i < n; i++) {
    const fy = y + i * (fh + 8), x0 = x + (i % 2 ? 14 : 0), x1 = x + w - (i % 2 ? 0 : 18), r = fh / 2;
    const d = `M${n1(x0 + r)} ${n1(fy)}H${n1(x1 - r)}A${n1(r)} ${n1(r)} 0 0 1 ${n1(x1 - r)} ${n1(fy + fh)}H${n1(x0 + r)}A${n1(r)} ${n1(r)} 0 0 1 ${n1(x0 + r)} ${n1(fy)}Z`;
    let inner = `<path d="M${n1(x0)} ${n1(fy + fh / 2)}H${n1(x1)}" style="fill:none;stroke:${MUS_D};stroke-width:${n1(fh)};stroke-dasharray:5 5;opacity:.5"/>`;
    inner += `<path d="M${n1(x0)} ${n1(fy + fh / 2)}H${n1(x1)}" style="fill:none;stroke:${MUS_D};stroke-width:${n1(fh)};stroke-dasharray:1 9;stroke-dashoffset:-7;opacity:.5"/>`;
    for (let nx = x0 + 26 + q() * 10; nx < x1 - 24; nx += 30 + q() * 16) {
      const top = q() > 0.5, ny = top ? fy + 4.5 : fy + fh - 4.5;
      inner += `<ellipse cx="${n1(nx)}" cy="${n1(ny)}" rx="10" ry="3.4" style="fill:${NUC};stroke:${NUC_L};stroke-width:.8"/>`;
    }
    s += form(d, MUS, { inner, rim: 2.2, ao: 8, aoOp: 0.4 });
  }
  return s;
}
/** One smooth muscle cell: a long thin spindle tapering to a point at both ends, grainy, one central rod-shaped nucleus. */
function smoothCell(cx, cy, len, w, deg, q, tone = 0) {
  const h = len / 2, d = `M${n1(-h)} 0C${n1(-h * 0.45)} ${n1(-w * 0.62)} ${n1(h * 0.45)} ${n1(-w * 0.62)} ${n1(h)} 0C${n1(h * 0.45)} ${n1(w * 0.62)} ${n1(-h * 0.45)} ${n1(w * 0.62)} ${n1(-h)} 0Z`;
  let g = '';
  for (let i = 0; i < 7; i++) g += `<circle cx="${n1((q() - 0.5) * len * 0.6)}" cy="${n1((q() - 0.5) * w * 0.5)}" r="${n1(0.8 + q() * 0.8)}" style="fill:${MUS_D};opacity:.3"/>`;
  return `<g transform="translate(${n1(cx)} ${n1(cy)}) rotate(${n1(deg)})"><path d="${d}" style="fill:${[SM, mx(SM, MUS, 70), mx(SM, 'elev-peak', 80)][tone]};stroke:${MUS_D};stroke-width:1.2;stroke-linejoin:round"/>`
    + `<path d="M${n1(-h * 0.7)} ${n1(w * 0.18)}C${n1(-h * 0.3)} ${n1(w * 0.36)} ${n1(h * 0.3)} ${n1(w * 0.36)} ${n1(h * 0.7)} ${n1(w * 0.18)}" style="fill:none;stroke:${MUS_D};stroke-width:${n1(w * 0.22)};opacity:.16;stroke-linecap:round"/>${g}`
    + `<rect x="${n1(-len * 0.11 + (q() - 0.5) * len * 0.08)}" y="${n1(-w * 0.15)}" width="${n1(len * 0.22)}" height="${n1(w * 0.3)}" rx="${n1(w * 0.15)}" style="fill:${NUC};stroke:${NUC_L};stroke-width:.7"/></g>`;
}
/** Smooth: a sheet of spindle cells packed side by side, each row offset by half a cell so the pointed ends tuck in;
 *  the cells squeeze in turn (a slow wave). */
function smooth(x, y, w, h, wave, out = {}) {
  const cw = Math.max(15, Math.min(26, h / 9)), rh = cw * 0.62, len = Math.min(190, Math.max(100, w * 0.56)), q = rnd(8);
  const rows = Math.floor((h - cw) / rh) + 1;
  let s = '';
  for (let r = 0; r < rows; r++) {
    for (let cx = x - (r % 2 ? len * 0.5 : 0) - len * (0.05 + q() * 0.3); cx < x + w + len * 0.5; cx += len * (0.9 + q() * 0.14)) {
      const cy = y + cw / 2 + r * rh + (q() - 0.5) * 2;
      const d = wave ? `animation-delay:${n1(-((cx - x) / w) * 4.6)}s` : 'animation:none';
      const ccx = cx + (q() - 0.5) * 8, dd = Math.hypot(ccx - x - w / 2, cy - y - h / 2);
      if (ccx > x + 30 && ccx < x + w - 30 && (out.d == null || dd < out.d)) { out.d = dd; out.nuc = [ccx, cy]; }
      s += `<g class="mt-sm" style="${d}">${smoothCell(ccx, cy, len * (0.92 + q() * 0.16), cw, (q() - 0.5) * 3, q, Math.floor(q() * 3))}</g>`;
    }
  }
  const id = `mt-smc${Math.round(x)}${Math.round(y)}`;
  return `<defs><clipPath id="${id}"><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="14"/></clipPath></defs><g clip-path="url(#${id})"><rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" style="fill:${mx(MUS_D, 'elev-peak', 70)}"/>${s}</g>`;
}
/** Cardiac: cylindrical fibres joined end to end, branching off at shallow Y angles; stepped dark discs where the cells
 *  join, faint bands across, one central nucleus per cell. */
function cardiac(x, y, w, h) {
  const fw = Math.min(28, h * 0.16), rows = [0.16, 0.5, 0.84].map((u) => y + h * u), q = rnd(11);
  const yAt = (r, xx) => rows[r] + Math.sin((xx - x) / w * Math.PI * 1.6 + r * 1.3) * fw * 0.3;
  const segs = [];   // each: list of points
  rows.forEach((_, r) => { const pts = []; for (let xx = x - 10; xx <= x + w + 10; xx += 8) pts.push([xx, yAt(r, xx)]); segs.push(pts); });
  // branches: leave one fibre at a shallow angle and join the next (a Y)
  for (const [r, u] of [[0, 0.12], [1, 0.4], [0, 0.6], [1, 0.02], [1, 0.74]]) {
    const r2 = r + 1, a = x + w * u, b = a + Math.max(w * 0.3, (rows[1] - rows[0]) * 2.2), pts = [];
    if (b > x + w + 20 && w < 300 && u > 0.3) continue;
    for (let t = 0; t <= 1.0001; t += 0.1) { const e = t * t * (3 - 2 * t), xx = a + (b - a) * t; pts.push([xx, yAt(r, xx) * (1 - e) + yAt(r2, xx) * e]); }
    segs.push(pts);
  }
  const P = (pts) => `M${pts.map((p) => `${n1(p[0])} ${n1(p[1])}`).join('L')}`;
  let s = '';
  for (const p of segs) s += `<path d="${P(p)}" style="fill:none;stroke:${MUS_D};stroke-width:${n1(fw + 4)};stroke-linecap:round;stroke-linejoin:round"/>`;
  for (const p of segs) s += `<path d="${P(p)}" style="fill:none;stroke:${MUS};stroke-width:${n1(fw)};stroke-linecap:round;stroke-linejoin:round"/>`;
  for (const p of segs) s += `<path d="${P(p)}" style="fill:none;stroke:${MUS_D};stroke-width:${n1(fw - 3)};stroke-dasharray:1.4 4.2;opacity:.28"/>`;
  for (const p of segs) s += `<path d="${P(p)}" style="fill:none;stroke:${MUS_D};stroke-width:${n1(fw * 0.3)};opacity:.22;transform:translate(0,${n1(fw * 0.28)}px)"/>`;
  // intercalated discs (stepped lines across each main fibre) and one nucleus in the middle of each cell
  rows.forEach((_, r) => {
    const step = 66 + r * 6;
    for (let xx = x + 22 + r * 18; xx < x + w - 8; xx += step) {
      const yy = yAt(r, xx), t = fw / 2, k = 3;
      s += `<path d="M${n1(xx)} ${n1(yy - t)}v${n1(t * 0.66)}h${k}v${n1(t * 0.66)}h${-k * 2}v${n1(t * 0.68)}" style="fill:none;stroke:${INK};stroke-width:2.2;opacity:.7;stroke-linejoin:round"/>`;
      const nx = xx + step / 2;
      if (nx < x + w - 10) s += `<ellipse cx="${n1(nx)}" cy="${n1(yAt(r, nx))}" rx="${n1(fw * 0.36)}" ry="${n1(fw * 0.2)}" style="fill:${NUC};stroke:${NUC_L};stroke-width:.8"/>`;
    }
  });
  return s;
}
// A human heart, front view (shared/OrganArt.js): about 130 by 190 at k = 1, centred on (x, y).
const heart = (x, y, k = 1) => heartSvg(x, y + 10 * k, k * 1.3);

export class MuscleTypes extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4), one(5)];
  static WIDTH = 640;
  static HEIGHT = 500;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 540;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Three kinds of muscle. An arm lifts a school bag only when you choose: a voluntary movement. Skeletal muscle: long, cylindrical, unbranched fibres with many nuclei at the edge and clear light and dark bands; they contract strongly when tapped. Food moves along the intestine and the heart beats without any thought: involuntary movements. Smooth muscle: spindle-shaped cells, thick in the middle and pointed at both ends, one nucleus each and no bands, squeezing slowly. Cardiac muscle: cylindrical, branched fibres with one nucleus each and faint bands, beating steadily.';
  static CONTROLS = [];

  u = 0; taps = 0;
  async setup() { await super.setup(); tapMin(this); bindFlow(this.root, { action: (a) => this._act(a) }); }
  css() {
    return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs-head { min-height: 52px; display: flex; justify-content: center; align-items: center; }' + BODY_CSS + TAP_MIN_CSS
      + ' svg .mt-sk { transform-box: fill-box; transform-origin: 0% 50%; } svg .mt-sk.go { animation: mt-sk 1.5s cubic-bezier(.2,.8,.3,1) both; } @keyframes mt-sk { 22%, 55% { transform: scale(0.78, 1.14); } }'
      + ' svg .mt-sm { transform-box: fill-box; transform-origin: center; animation: mt-sm 4.6s ease-in-out infinite; } @keyframes mt-sm { 50% { transform: scale(0.86, 1.18); } }'
      + ' svg .mt-ca { transform-box: fill-box; transform-origin: center; animation: mt-ca 1s ease-in-out infinite; } @keyframes mt-ca { 12% { transform: scale(0.95, 0.96); } 30% { transform: none; } }'
      + ' svg .mt-gut { offset-rotate: 0deg; animation: mt-gut 5s linear infinite; } @keyframes mt-gut { from { offset-distance: 0%; } to { offset-distance: 100%; } }';
  }
  stageHeight(st) { return st.portrait ? 440 : 420; }
  busy() { return !!this._lkGo; }
  enter(step) { cancelTween(this); this.u = 0; this.taps = 0; }
  destroy() { cancelTween(this); super.destroy(); }
  _act(a) {
    const step = this.stepIndex;
    if (a === 'lift' && step === 0 && !this._lkGo) {
      const on = this.u < 0.5;
      tweenTo(this, this.u, on ? 1 : 0, 1300, (v, k) => { this.u = v; if (k >= 1) this.repaint(); else drawOnly(this); });
    } else if (a === 'tap' && (step === 1 || step === 5)) { this.taps++; this.repaint(); }
  }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 14 : 15;
    let s = `<defs>${taDefs()}</defs>`, head = '';
    const L = (t, at, x, y, o = {}) => leader(x, y, at[0], at[1], o.col ?? INK, 2.4) + tag(x, y, t, { size: fs, rim: o.rim, anchor: o.anchor, display: o.display });
    if (step === 0) {
      s += field(st, 'mt', { a: 1, b: 7, k: 10 });
      const th = ARM.rest + this.u * (UP - ARM.rest), g = armGeom(th), arm = armSvg(g, { bag: true, dim: (id) => (id === 'biceps' ? 1 : 0.9) });
      const k = P ? 0.86 : 0.95, tx = P ? W * 0.4 : W * 0.42, ty = P ? 50 : 40;
      const fy = ty + g.floor * k;
      s += `<rect x="0" y="${n1(fy)}" width="${W}" height="${n1(H - fy)}" style="fill:${mx('strata-3', 'elev-peak', 34)}"/><path d="M0 ${n1(fy)}H${W}" style="fill:none;stroke:${mx('strata-3', INK, 60)};stroke-width:3"/>`;
      s += `<g transform="translate(${n1(tx)} ${n1(ty)}) scale(${k})">${arm.svg}</g>`;
      s += L('you choose to lift', [tx + arm.mid[0] * k, ty + arm.mid[1] * k], P ? W - 8 : W - 30, 50, { anchor: 'end', display: true });
      s += tag(P ? W - 8 : W - 30, fy - 30, 'voluntary movement', { size: fs, anchor: 'end', display: true });
      head = flowChipHtml({ action: 'lift', label: this.u > 0.5 ? 'Put the bag down' : 'Lift the bag' });
    } else if (step === 2) {
      s += field(st, 'mt', { a: 4, b: 6, k: 10 });
      // intestine: a looping tube with food moving along it; the heart beside it, beating
      const gx = P ? 20 : 40, gy = P ? 230 : 70, gw = P ? W - 40 : 290, gh = P ? 180 : 300;
      const gut = `M${gx} ${gy + 20}C${gx + gw * 0.5} ${gy - 10} ${gx + gw} ${gy + 10} ${gx + gw * 0.9} ${gy + gh * 0.32}C${gx + gw * 0.8} ${gy + gh * 0.55} ${gx + gw * 0.1} ${gy + gh * 0.38} ${gx + gw * 0.12} ${gy + gh * 0.66}C${gx + gw * 0.14} ${gy + gh * 0.95} ${gx + gw * 0.8} ${gy + gh * 0.8} ${gx + gw} ${gy + gh}`;
      const gc = mx('series-4', 'series-8', 60);
      s += tube(gut, gc, P ? 34 : 44) + `<path d="${gut}" style="fill:none;stroke:${mx(gc, INK, 60)};stroke-width:${P ? 30 : 40};stroke-dasharray:2 14;opacity:.25"/>`;
      s += `<g class="mt-gut" style="offset-path:path('${gut}')"><ellipse rx="${P ? 15 : 19}" ry="${P ? 10 : 13}" style="fill:${mx('strata-3', 'series-2', 60)};stroke:${mx('strata-3', INK, 60)};stroke-width:2"/><path d="M-26 -${P ? 17 : 22}V${P ? 17 : 22}" style="fill:none;stroke:${mx(gc, INK, 50)};stroke-width:6;stroke-linecap:round;opacity:.8"/></g>`;
      const hx = P ? W * 0.5 : W * 0.76, hy = P ? 110 : H * 0.48, hk = P ? 0.72 : 1.05;
      s += `<g class="mt-ca">${heart(hx, hy, hk)}</g>`;
      s += tag(gx + gw / 2, gy + gh + (P ? 20 : 26), 'food moves along the intestine', { size: fs }) + tag(hx, hy + 145 * hk, 'the heart beats', { size: fs });
      s += tag(P ? W / 2 : W / 2, P ? 18 : 24, 'no thought needed: involuntary', { size: fs, display: true });
    } else if (step === 1 || step === 3 || step === 4) {
      s += depthField(W, H, { tone: 'rose', seed: 30 + step });
      const bx = P ? 14 : 40, by = P ? 70 : 60, bw = W - (P ? 28 : 80), bh = P ? 240 : 270;
      if (step === 1) {
        s += `<g class="mt-sk${this.taps ? ' go' : ''}" data-t="${this.taps}">${skeletal(bx, by, bw, bh)}</g>`;
        s += L('many nuclei at the edge', [bx + bw * 0.42, by + 5], P ? W - 8 : W - 40, 30, { anchor: 'end' });
        s += L('light and dark bands', [bx + bw * 0.7, by + bh * 0.62], P ? W - 8 : W - 40, by + bh + 32, { anchor: 'end' });
        s += tag(P ? 8 : 40, by + bh + (P ? 76 : 32), 'long, unbranched fibres', { size: fs, anchor: 'start', display: true });
        head = flowChipHtml({ action: 'tap', label: 'Tap to contract' });
      } else if (step === 3) {
        const o = {};
        s += smooth(bx, by, bw, bh, true, o);
        s += L('one nucleus, in the middle', o.nuc ?? [bx + bw * 0.5, by + bh * 0.5], P ? W - 8 : W - 40, 30, { anchor: 'end' });
        s += tag(P ? W / 2 : bx + bw / 2, by + bh + 32, 'spindle-shaped, no bands', { size: fs, display: true });
        s += tag(P ? W / 2 : bx + bw / 2, by + bh + (P ? 72 : 66), 'slow, steady squeeze', { size: fs });
      } else {
        s += `<g class="mt-ca">${cardiac(bx, by, bw, bh)}</g>`;
        s += L('branched', [bx + bw * 0.3, by + bh * 0.34], P ? 8 : 40, 30, { anchor: 'start' });
        s += L('one nucleus', [bx + 220, by + bh * 0.5 + Math.sin((220 / bw) * Math.PI * 1.6 + 1.3) * Math.min(28, bh * 0.16) * 0.3], P ? W - 8 : W - 40, 30, { anchor: 'end' });
        s += tag(P ? W / 2 : bx + bw / 2, by + bh + 32, 'faint bands, joined end to end', { size: fs, display: true });
        s += tag(P ? W / 2 : bx + bw / 2, by + bh + (P ? 72 : 66), 'beats all life, never tires', { size: fs });
      }
    } else {
      s += depthField(W, H, { tone: 'rose', seed: 40 });
      const cols = [['Skeletal', 'many nuclei, bands'], ['Smooth', 'one nucleus, no bands'], ['Cardiac', 'branched, faint bands']];
      const cw = P ? W - 16 : (W - 40) / 3, ch = P ? (H - 20) / 3 : H - 40;
      cols.forEach(([t, sub], i) => {
        const x = P ? 8 : 20 + i * cw, y = P ? 6 + i * ch : 20;
        s += `<rect x="${n1(x + 4)}" y="${n1(y + 2)}" width="${n1(cw - 8)}" height="${n1(ch - 4)}" rx="14" style="fill:${mx('elev-peak', 'series-4', 76)};opacity:.6;stroke:${mx('series-4', INK, 40)};stroke-width:2"/>`;
        const ix = x + 16, iy = y + (P ? 34 : 56), iw = cw - 32, ih = P ? ch - 58 : 190;
        const art = i === 0 ? `<g class="mt-sk${this.taps ? ' go' : ''}">${skeletal(ix, iy, iw, ih, P ? 3 : 4)}</g>` : i === 1 ? smooth(ix, iy, iw, ih, true) : `<g class="mt-ca">${cardiac(ix, iy, iw, ih)}</g>`;
        s += `<svg x="${n1(ix - 6)}" y="${n1(iy - 6)}" width="${n1(iw + 12)}" height="${n1(ih + 12)}" viewBox="${n1(ix - 6)} ${n1(iy - 6)} ${n1(iw + 12)} ${n1(ih + 12)}" style="overflow:hidden">${art}</svg>`;
        s += P ? tag(x + 14, y + 18, t, { size: fs + 1, display: true, anchor: 'start' }) : tag(x + cw / 2, y + 30, t, { size: fs + 1, display: true });
        if (!P) s += tag(x + cw / 2, iy + ih + 30, sub, { size: 14 }) + tag(x + cw / 2, iy + ih + 66, ['voluntary', 'involuntary', 'involuntary'][i], { size: 14 });
        else s += tag(x + cw - 12, y + 18, sub, { size: 14, anchor: 'end' });
      });
      head = flowChipHtml({ action: 'tap', label: 'Tap skeletal to contract' });
    }
    return { svg: cwFrame(st, 'mt', s), head };
  }
}
