// RbcDisc - the RBC box. A red blood cell is a dished disc, no nucleus.
//   b0  several discs in plasma, one large and cut to show there is no nucleus
//   b1  same size, two halves: with a nucleus, the haemoglobin dots stay out of its space; without, they fill it
//   b2  a life bar: about 120 days; no repair, no division
// The dot counts are drawn, not measured. No controls.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { cwFrame, nucleus, depthField, n1, rnd, T, mx } from '../shared/CellWorld.js';
import { label } from '../shared/PlantArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const R0 = 'series-6', RED = T(R0), DEEP = mx(R0, 'strata-6', 58), LITE = mx(R0, 'elev-peak', 56);
const DEFS = `<radialGradient id="rb-rim" cx=".4" cy=".34" r=".72"><stop offset="0" style="stop-color:${mx(R0, 'elev-peak', 70)}"/><stop offset=".42" style="stop-color:${mx(R0, 'strata-6', 88)}"/><stop offset=".72" style="stop-color:${RED}"/><stop offset=".92" style="stop-color:${LITE}"/><stop offset="1" style="stop-color:${DEEP}"/></radialGradient>
<radialGradient id="rb-dish" cx=".58" cy=".62" r=".7"><stop offset="0" style="stop-color:${mx(R0, 'elev-peak', 76)}"/><stop offset=".62" style="stop-color:${mx(R0, 'strata-6', 84)}"/><stop offset="1" style="stop-color:${DEEP}"/></radialGradient>`;
/** A whole disc seen at a slant. */
function disc(x, y, r, tilt = 0.62, rot = 0) {
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${rot}) scale(1 ${tilt})"><ellipse cx="${n1(r * 0.05)}" cy="${n1(r * 0.28)}" rx="${n1(r)}" ry="${n1(r)}" style="fill:${DEEP}"/><circle r="${n1(r)}" style="fill:url(#rb-rim) ${RED}"/><ellipse cy="${n1(r * 0.03)}" rx="${n1(r * 0.52)}" ry="${n1(r * 0.5)}" style="fill:url(#rb-dish) ${RED}"/><ellipse cx="${n1(-r * 0.46)}" cy="${n1(-r * 0.62)}" rx="${n1(r * 0.22)}" ry="${n1(r * 0.09)}" transform="rotate(-30 ${n1(-r * 0.46)} ${n1(-r * 0.62)})" style="fill:${T('elev-peak')};opacity:.6"/></g>`;
}
/** The section of a disc: a dumbbell. Used as a clip and a shape. */
const dumbbell = (x, y, w, h) => `M${n1(x - w)} ${n1(y)}C${n1(x - w)} ${n1(y - h * 1.3)} ${n1(x - w * 0.5)} ${n1(y - h * 1.3)} ${n1(x - w * 0.32)} ${n1(y - h * 0.9)}C${n1(x - w * 0.12)} ${n1(y - h * 0.46)} ${n1(x + w * 0.12)} ${n1(y - h * 0.46)} ${n1(x + w * 0.32)} ${n1(y - h * 0.9)}C${n1(x + w * 0.5)} ${n1(y - h * 1.3)} ${n1(x + w)} ${n1(y - h * 1.3)} ${n1(x + w)} ${n1(y)}C${n1(x + w)} ${n1(y + h * 1.3)} ${n1(x + w * 0.5)} ${n1(y + h * 1.3)} ${n1(x + w * 0.32)} ${n1(y + h * 0.9)}C${n1(x + w * 0.12)} ${n1(y + h * 0.46)} ${n1(x - w * 0.12)} ${n1(y + h * 0.46)} ${n1(x - w * 0.32)} ${n1(y + h * 0.9)}C${n1(x - w * 0.5)} ${n1(y + h * 1.3)} ${n1(x - w)} ${n1(y + h * 1.3)} ${n1(x - w)} ${n1(y)}Z`;
function dots(x, y, rx, ry, n, keep) {
  const q = rnd(7); let s = '', c = 0;
  for (let i = 0; i < 900 && c < n; i++) {
    const u = (q() * 2 - 1) * rx, v = (q() * 2 - 1) * ry, px = x + u, py = y + v;
    if (!keep(px, py)) continue;
    s += `<circle cx="${n1(px)}" cy="${n1(py)}" r="3.6" style="fill:${RED};stroke:${DEEP};stroke-width:1"/>`; c += 1;
  }
  return s;
}
export class RbcDisc extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 680; static HEIGHT = 450; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 470;
  static ARIA_LABEL = 'Red blood cells drawn as dished discs. A cut through one shows no nucleus. Without a nucleus the cell holds more haemoglobin. A bar shows a life of about 120 days.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 400 : 430; }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex, size = P ? 14 : 16;
    let g = `<defs>${DEFS}</defs>` + depthField(W, H, { tone: 'rose', seed: step + 3 });
    if (step === 0) {
      const q = rnd(4), L = P ? 8 : 12; for (let i = 0; i < L; i++) { const a = i / L * 6.283, x = W / 2 + Math.cos(a) * W * 0.42 * (0.8 + q() * 0.3), y = H / 2 + Math.sin(a) * H * 0.42 * (0.8 + q() * 0.3); g += `<g opacity=".82">${disc(x, y, P ? 34 : 44, 0.5 + q() * 0.4, q() * 60 - 30)}</g>`; }
      const R = P ? 118 : 150, cx = W / 2, cy = H / 2 - 4;
      g += disc(cx, cy, R, 0.7, -8);
      g += label(cx, cy + 6, 'No nucleus', { size: P ? 16 : 18 });
      g += label(W / 2, 26, 'Mature red blood cells', { size });
    }
    if (step === 1) {
      const col = P ? [[W / 2, H * 0.27], [W / 2, H * 0.73]] : [[W * 0.27, H / 2], [W * 0.73, H / 2]], w = P ? 128 : 148, h = P ? 64 : 92;
      const keepD = (cx, cy) => (x, y) => { const u = (x - cx) / w, v = (y - cy) / h; return (u * u) ** 0.8 + v * v * (0.6 + 1.2 * Math.exp(-u * u * 8)) < 1; };
      col.forEach(([cx, cy], i) => {
        const d = dumbbell(cx, cy, w, h), nu = i === 0, nr = h * 0.72;
        g += `<path d="${d}" transform="translate(4 8)" style="fill:${T('strata-6')};opacity:.18;filter:url(#cw-blur3)"/><path d="${d}" style="fill:${mx(R0, 'elev-peak', 18)};stroke:${DEEP};stroke-width:4"/>`;
        const keep = keepD(cx, cy);
        g += dots(cx, cy, w, h * 1.2, nu ? 46 : 150, (x, y) => keep(x, y) && (!nu || Math.hypot(x - cx, y - cy) > nr + 8));
        if (nu) g += nucleus(cx, cy, nr, { pores: false });
        g += label(cx, cy + (P ? -h - 22 : h + 56), nu ? 'If it kept a nucleus' : 'Mature cell: no nucleus', { size });
      });
      g += label(P ? W / 2 : W / 2, H - 12, 'Dots: haemoglobin, not counted', { size: P ? 14 : 15 });
    }
    if (step === 2) {
      const x0 = P ? 26 : 70, x1 = W - x0, y = P ? H * 0.68 : H * 0.7, w = x1 - x0;
      for (let i = 0; i <= 4; i++) { const u = i / 4, x = x0 + u * w, a = 1 - u * 0.62; g += `<g opacity="${n1(a * 100) / 100}">${disc(x, y - (P ? 70 : 96), P ? 24 + (1 - u) * 6 : 38 + (1 - u) * 8, 0.66, -8)}</g>`; }
      g += `<rect x="${x0}" y="${n1(y - 11)}" width="${n1(w)}" height="22" rx="11" style="fill:url(#rb-rim) ${RED};stroke:${DEEP};stroke-width:3"/>`;
      for (let i = 0; i <= 12; i++) { const x = x0 + (i / 12) * w; g += `<rect x="${n1(x - 1)}" y="${n1(y + 12)}" width="2" height="${i % 3 ? 7 : 13}" style="fill:${T('strata-6')}"/>`; }
      [0, 30, 60, 90, 120].forEach((d, i) => { g += label(x0 + (i / 4) * w, y + 42, String(d), { size: P ? 14 : 16 }); });
      g += label(W / 2, y + 68, 'days, about', { size });
      g += label(W / 2, P ? 34 : 46, 'No repair', { size: P ? 19 : 22, display: true }) + label(W / 2, P ? 62 : 80, 'No division', { size: P ? 19 : 22, display: true });
    }
    return { svg: cwFrame(st, 'rb', g) };
  }
}
