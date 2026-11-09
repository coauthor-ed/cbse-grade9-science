// PreventionBoardScene - prevention, on the same diagrams as the system lessons. Mounts by beat count.
// 1 or MAX: predict setup, a strip of pills and nothing more. 3: what pills do and do not stop, two close-ups; the book's list of STIs on a clipboard;
// what a condom does, the same two close-ups. 5: one idea per beat, each on the route diagram: barrier, pill, IUD, surgery, the pill from Lucknow.
// Book's words and side effects, no ranking of methods. Nothing to press, no people, no external body.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { femaleSystemSvg, maleSystemSvg, tubePt, BODY_CSS, travel, form, lightGrad, frame, tag, txt, n, BODY, INK, MUTED, PAPER, spermSvg, eggSvg, cellSvg } from '../shared/BodyArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const PILL = 'color-mix(in oklab, var(--sim-series-5) 42%, var(--sim-bg-surface))';
function strip(x, y, cols, rows, u) {
  const w = cols * u + 16, h = rows * u + 16, foil = 'color-mix(in oklab, var(--sim-stroke) 52%, var(--sim-bg-surface))';
  let inner = `<path d="M${n(x)} ${n(y + h * 0.3)}L${n(x + w)} ${n(y)}" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:${n(h * 0.3)};opacity:0.4;filter:blur(5px)"/>`;
  for (let c = 1; c < cols; c++) inner += `<path d="M${n(x + 8 + c * u)} ${n(y)}L${n(x + 8 + c * u)} ${n(y + h)}" style="fill:none;stroke:color-mix(in oklab, ${foil} 66%, black);stroke-width:1;opacity:0.5;stroke-dasharray:3 3"/>`;
  let s = `<rect x="${n(x + 6)}" y="${n(y + 8)}" width="${n(w)}" height="${n(h)}" rx="12" style="fill:${INK};opacity:0.2;filter:blur(7px)"/>` + form(`M${n(x + 12)} ${n(y)}L${n(x + w - 12)} ${n(y)}Q${n(x + w)} ${n(y)} ${n(x + w)} ${n(y + 12)}L${n(x + w)} ${n(y + h - 12)}Q${n(x + w)} ${n(y + h)} ${n(x + w - 12)} ${n(y + h)}L${n(x + 12)} ${n(y + h)}Q${n(x)} ${n(y + h)} ${n(x)} ${n(y + h - 12)}L${n(x)} ${n(y + 12)}Q${n(x)} ${n(y)} ${n(x + 12)} ${n(y)}Z`, foil, { ao: 8, aoOp: 0.35, rim: 2, hi: 66, lo: 76, inner });
  const [g, url] = lightGrad(PILL, { hi: 40, lo: 66 });
  s += `<defs>${g}</defs>`;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) { const px = x + 8 + (c + 0.5) * u, py = y + 8 + (r + 0.5) * u, q = u * 0.34; s += `<circle cx="${n(px + 1.5)}" cy="${n(py + 2)}" r="${n(q + 2)}" style="fill:color-mix(in oklab, ${foil} 60%, black);opacity:0.5"/><circle cx="${n(px)}" cy="${n(py)}" r="${n(q)}" style="fill:${url};stroke:color-mix(in oklab, var(--sim-series-5) 60%, black);stroke-width:1.4"/><path d="M${n(px - q * 0.55)} ${n(py - q * 0.2)}A${n(q * 0.6)} ${n(q * 0.6)} 0 0 1 ${n(px - q * 0.1)} ${n(py - q * 0.6)}" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:2;stroke-linecap:round;opacity:0.8"/>`; }
  return s;
}
const cm = (a, b, k) => `color-mix(in oklab, ${a} ${k}%, ${b})`;
const GERM = cm(cm('var(--sim-series-6)', 'var(--sim-series-2)', 62), PAPER, 72);
function germ(x, y, r) {
  let s = '';
  for (let i = 0; i < 11; i++) { const a = (i / 11) * 6.283; s += `<circle cx="${n(x + Math.cos(a) * r * 1.16)}" cy="${n(y + Math.sin(a) * r * 1.16)}" r="${n(r * 0.17)}" style="fill:${cm(GERM, 'black', 70)}"/>`; }
  return s + cellSvg(x, y, r, { col: GERM, nuc: false, grains: 12 });
}
/** A round close-up: quiet tissue light inside, a soft rim, a lit edge. inner is clipped to it. */
function lens(cx, cy, r, id, inner) {
  const bg = cm('var(--sim-series-4)', PAPER, 20);
  return `<circle cx="${n(cx + 3)}" cy="${n(cy + 6)}" r="${n(r + 3)}" style="fill:${INK};opacity:0.2;filter:blur(7px)"/>`
    + `<defs><clipPath id="${id}"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/></clipPath></defs>`
    + form(`M${n(cx - r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx + r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx - r)} ${n(cy)}Z`, bg, { ao: 16, aoOp: 0.34, rim: 3, hi: 70, lo: 88, rimCol: 'var(--sim-stroke)' })
    + `<g clip-path="url(#${id})">${inner}</g>`
    + `<path d="M${n(cx - r * 0.84)} ${n(cy - r * 0.38)}A${n(r * 0.92)} ${n(r * 0.92)} 0 0 1 ${n(cx - r * 0.3)} ${n(cy - r * 0.86)}" style="fill:none;stroke:${PAPER};stroke-width:4;stroke-linecap:round;opacity:0.65"/>`;
}
const wall = (cx, cy, r, side) => {
  const d = side < 0 ? `M${n(cx - r * 1.1)} ${n(cy - r * 1.1)}L${n(cx - r * 0.34)} ${n(cy - r * 1.1)}C${n(cx - r * 0.6)} ${n(cy - r * 0.3)} ${n(cx - r * 0.34)} ${n(cy + r * 0.3)} ${n(cx - r * 0.5)} ${n(cy + r * 1.1)}L${n(cx - r * 1.1)} ${n(cy + r * 1.1)}Z`
    : `M${n(cx + r * 1.1)} ${n(cy - r * 1.1)}L${n(cx + r * 0.46)} ${n(cy - r * 1.1)}C${n(cx + r * 0.3)} ${n(cy - r * 0.3)} ${n(cx + r * 0.6)} ${n(cy + r * 0.3)} ${n(cx + r * 0.36)} ${n(cy + r * 1.1)}L${n(cx + r * 1.1)} ${n(cy + r * 1.1)}Z`;
  return form(d, BODY.tissue, { ao: 14, aoOp: 0.4, rim: 2, hi: 62, lo: 80, rimCol: BODY.tissueRim });
};
const cross = (x, y, q, w = 6) => `<path d="M${n(x - q)} ${n(y - q)}L${n(x + q)} ${n(y + q)}M${n(x + q)} ${n(y - q)}L${n(x - q)} ${n(y + q)}" style="fill:none;stroke:${INK};stroke-width:${w};stroke-linecap:round"/>`;
const route = (x0, y0, x1, y1, col) => `<path d="M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}" style="fill:none;stroke:${col};stroke-width:5;stroke-linecap:round;stroke-dasharray:3 11"/>`;
function film(x, cy, r) {
  const d = `M${n(x + r * 0.1)} ${n(cy - r * 1.1)}Q${n(x - r * 0.16)} ${n(cy)} ${n(x + r * 0.1)} ${n(cy + r * 1.1)}`, c = cm('var(--sim-series-1)', PAPER, 40);
  return `<path d="${d}" style="fill:none;stroke:${cm(c, 'black', 60)};stroke-width:11"/><path d="${d}" style="fill:none;stroke:${c};stroke-width:8"/><path d="${d}" style="fill:none;stroke:${PAPER};stroke-width:2.4;opacity:0.7;transform:translate(-1.6px,0)"/>`;
}
function packet(x, y, q) {
  const foil = cm('var(--sim-stroke)', PAPER, 52), teeth = Array.from({ length: 12 }, (_, i) => `<path d="M${n(x - q + (i + 0.5) * q / 6)} ${n(y - q - 1)}l${n(q / 12)} -5l${n(q / 12)} 5M${n(x - q + (i + 0.5) * q / 6)} ${n(y + q + 1)}l${n(q / 12)} 5l${n(q / 12)} -5" style="fill:none;stroke:${cm(foil, 'black', 60)};stroke-width:1.2"/>`).join('');
  return `<rect x="${n(x - q + 4)}" y="${n(y - q + 7)}" width="${n(q * 2)}" height="${n(q * 2)}" rx="6" style="fill:${INK};opacity:0.2;filter:blur(6px)"/>` + teeth
    + form(`M${n(x - q)} ${n(y - q)}L${n(x + q)} ${n(y - q)}L${n(x + q)} ${n(y + q)}L${n(x - q)} ${n(y + q)}Z`, foil, { ao: 7, aoOp: 0.3, rim: 1.8, hi: 68, lo: 76 })
    + `<circle cx="${n(x + 1.5)}" cy="${n(y + 2)}" r="${n(q * 0.6)}" style="fill:none;stroke:${cm(foil, 'black', 58)};stroke-width:4;opacity:0.45"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(q * 0.6)}" style="fill:none;stroke:${PAPER};stroke-width:3;opacity:0.7"/>`;
}
function clipboard(x, y, w, h, title, rows) {
  const wood = cm(cm('var(--sim-series-2)', 'var(--sim-series-8)', 46), PAPER, 62), page = cm(PAPER, 'white', 86), steel = cm('var(--sim-stroke)', PAPER, 60);
  let grain = '';
  for (let i = 0; i < 9; i++) grain += `<path d="M${n(x)} ${n(y + (i + 0.6) * h / 9)}C${n(x + w * 0.3)} ${n(y + (i + 0.3) * h / 9)} ${n(x + w * 0.7)} ${n(y + (i + 0.9) * h / 9)} ${n(x + w)} ${n(y + (i + 0.5) * h / 9)}" style="fill:none;stroke:${cm(wood, 'black', 62)};stroke-width:1.3;opacity:0.35"/>`;
  const r = 12, box = (a, b, c, e, q) => `M${n(a + q)} ${n(b)}L${n(c - q)} ${n(b)}Q${n(c)} ${n(b)} ${n(c)} ${n(b + q)}L${n(c)} ${n(e - q)}Q${n(c)} ${n(e)} ${n(c - q)} ${n(e)}L${n(a + q)} ${n(e)}Q${n(a)} ${n(e)} ${n(a)} ${n(e - q)}L${n(a)} ${n(b + q)}Q${n(a)} ${n(b)} ${n(a + q)} ${n(b)}Z`;
  let s = `<rect x="${n(x + 5)}" y="${n(y + 8)}" width="${n(w)}" height="${n(h)}" rx="${r}" style="fill:${INK};opacity:0.24;filter:blur(8px)"/>`
    + form(box(x, y, x + w, y + h, r), wood, { ao: 7, aoOp: 0.4, rim: 2, hi: 54, lo: 70, inner: grain });
  const m = 12, px = x + m, py = y + 22, pw = w - m * 2, ph = h - 22 - m;
  s += `<rect x="${n(px + 2)}" y="${n(py + 3)}" width="${n(pw)}" height="${n(ph)}" rx="4" style="fill:${INK};opacity:0.22"/><rect x="${n(px)}" y="${n(py)}" width="${n(pw)}" height="${n(ph)}" rx="4" style="fill:${page}"/>`;
  s += txt(x + w / 2, py + 40, title, { size: w < 340 ? 16 : 19, display: true });
  const y0 = py + 56, rh = (ph - 56 - 8) / rows.length;
  rows.forEach((t, i) => {
    const ly = y0 + i * rh;
    s += `<path d="M${n(px + 14)} ${n(ly)}L${n(px + pw - 14)} ${n(ly)}" style="fill:none;stroke:var(--sim-stroke);stroke-width:1.4;opacity:0.55"/>`
      + `<circle cx="${n(px + 30)}" cy="${n(ly + rh / 2)}" r="5.5" style="fill:${GERM};stroke:${cm(GERM, 'black', 60)};stroke-width:1.4"/>`
      + txt(px + 48, ly + rh / 2 + 6, t, { size: w < 340 ? 16 : 17, anchor: 'start', weight: 700 });
  });
  const cw = Math.min(120, w * 0.34), cx = x + w / 2;
  s += `<rect x="${n(cx - cw / 2 + 2)}" y="${n(y - 2)}" width="${n(cw)}" height="32" rx="7" style="fill:${INK};opacity:0.28;filter:blur(3px)"/>`
    + form(box(cx - cw / 2, y - 6, cx + cw / 2, y + 26, 7), steel, { ao: 4, aoOp: 0.35, rim: 1.8, hi: 62, lo: 70 })
    + `<circle cx="${n(cx)}" cy="${n(y + 4)}" r="5" style="fill:${cm(steel, 'black', 62)}"/><path d="M${n(cx - cw / 2 + 10)} ${n(y + 18)}L${n(cx + cw / 2 - 10)} ${n(y + 18)}" style="fill:none;stroke:${PAPER};stroke-width:2;opacity:0.5;stroke-linecap:round"/>`;
  return s;
}
const STIS = ['gonorrhoea', 'herpes', 'syphilis', 'genital warts', 'HIV, which can lead to AIDS'];

export class PreventionBoardScene extends SvgScene {
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [one(0)], 1: [one(0)], 3: [one(1), one(2), one(3)], 5: [one(4), one(5), one(6), one(7), one(8)] };
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4), one(5), one(6), one(7), one(8)];
  static WIDTH = 640;
  static HEIGHT = 440;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 470;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static ARIA_LABEL = 'Ways of preventing pregnancy and infection, on a front view of the female reproductive system: a barrier stops sperm, pills change the release of eggs, an intra-uterine device sits in the uterus, surgery blocks a tube.';
  css() { return `${BODY_CSS}.svs { padding: 0; }`; }
  stageHeight(st) { return st.portrait ? 440 : 390; }

  // Two close-ups side by side: what the method does to pregnancy, what it does to infections.
  _pair(st, title, left, right, lv, rv, rok, kind) {
    const W = st.W, H = st.H, P = st.portrait, r = P ? 80 : 112, cy = P ? 142 : 168, a = P ? 90 : 158, b = W - a;
    let s = tag(W / 2, 28, title, { size: P ? 17 : 19, display: true });
    const tagY = cy + r + 22;
    s += txt(a, cy - r - 10 + (P ? 0 : 2), 'Pregnancy', { size: P ? 15 : 17, display: true }) + txt(b, cy - r - 10 + (P ? 0 : 2), 'Infections', { size: P ? 15 : 17, display: true });
    s += lens(a, cy, r, 'pb-la', left(a, cy, r)) + lens(b, cy, r, 'pb-lb', right(b, cy, r));
    s += tag(a, tagY, lv, { size: 14, rim: 'var(--sim-good)' }) + tag(b, tagY, rv, { size: 14, rim: rok ? 'var(--sim-good)' : 'var(--sim-bad)' });
    if (kind === 'pills') s += P ? strip(W / 2 - 92, tagY + 26, 6, 2, 28) : strip(W / 2 - 37, cy - 92, 2, 6, 29);
    else s += P ? packet(W / 2, tagY + 58, 34) : packet(W / 2, cy, 34);
    return s;
  }
  _fig(st, o, top = 20) {
    const W = st.W, P = st.portrait, k = P ? 0.78 : 0.94;
    this._k = k; this._ax = W / 2 - 220 * k; this._ay = top;
    return femaleSystemSvg(this._ax, top, k, { id: 'pb', ...o });
  }
  _pt(p) { return [this._ax + p[0] * this._k, this._ay + p[1] * this._k]; }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    let s = '';
    const note = (t) => tag(W / 2, H - 26, t, { size: P ? 14 : 15 });
    const dots = (pts, col) => `<path d="M${pts.map((p) => `${n(p[0])} ${n(p[1])}`).join('L')}" style="fill:none;stroke:${col};stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:3 11"/>`;
    if (step === 0) {
      const u = P ? 42 : 54, cols = 7, rows = 3, sw = cols * u + 16, sh = rows * u + 16;
      s += strip((W - sw) / 2, (H - sh) / 2 - 8, cols, rows, u);
      s += tag(W / 2, H - 42, 'Oral contraceptive pills', { size: 16, display: true });
    } else if (step === 1) {
      s = this._pair(st, 'Oral pills',
        (x, y, r) => form(`M${n(x - r * 1.1)} ${n(y - r * 0.8)}C${n(x - r * 0.3)} ${n(y - r * 0.9)} ${n(x - r * 0.02)} ${n(y - r * 0.3)} ${n(x - r * 0.04)} ${n(y + r * 0.1)}C${n(x - r * 0.06)} ${n(y + r * 0.6)} ${n(x - r * 0.5)} ${n(y + r * 0.9)} ${n(x - r * 1.1)} ${n(y + r * 0.8)}Z`, cm(BODY.ovary, PAPER, 66), { ao: 14, rim: 2.2, hi: 56, lo: 72 })
          + eggSvg(x - r * 0.46, y, r * 0.26, {}) + route(x + r * 0.08, y - r * 0.02, x + r * 0.84, y - r * 0.02, BODY.egg) + cross(x + r * 0.46, y - r * 0.02, r * 0.13),
        (x, y, r) => wall(x, y, r, -1) + wall(x, y, r, 1) + route(x - r * 0.4, y - r * 0.06, x + r * 0.3, y + r * 0.06, GERM) + germ(x - r * 0.68, y - r * 0.44, r * 0.13) + germ(x - r * 0.74, y + r * 0.22, r * 0.13) + travel(germ(0, 0, r * 0.13), `M${n(x - r * 0.46)} ${n(y - r * 0.06)}L${n(x + r * 0.46)} ${n(y + r * 0.06)}`, { t: 2 }),
        'Help prevent', 'Do not stop', false, 'pills');
      s += tag(W / 2, H - 26, 'Pills work on the release of eggs', { size: P ? 14 : 15 });
    } else if (step === 2) {
      const w = P ? 326 : 460;
      s += clipboard((W - w) / 2, 18, w, H - 72, P ? 'Sexually transmitted' : 'Sexually transmitted infections', STIS);
      s += note('Some of these are not curable yet');
    } else if (step === 3) {
      s = this._pair(st, 'Condom',
        (x, y, r) => [[-0.2, 1], [-0.42, 2], [0.34, 0]].map(([v, ph]) => spermSvg(x - r * 0.16, y + r * v, r * 0.09, r * 0.5, 0, { phase: ph })).join('') + film(x + r * 0.02, y, r) + eggSvg(x + r * 0.56, y, r * 0.24, {}),
        (x, y, r) => [[-0.5, -0.42], [-0.26, 0.04], [-0.56, 0.42], [-0.72, 0]].map(([u, v]) => germ(x + r * u, y + r * v, r * 0.13)).join('') + film(x + r * 0.02, y, r),
        'Helps prevent', 'Greatly reduces risk', true, 'condom');
      s += note('No method is perfect');
    } else if (step === 4) {
      s += this._fig(st, { lining: 0.5, dim: (id) => ['ovary', 'tube', 'ligament'].includes(id) });
      const a = this._pt([220, 330]), b = this._pt([220, 268]), [l, r] = [this._pt([190, 254]), this._pt([250, 254])], mid = this._pt([220, 240]);
      s += dots([a, b], BODY.sperm);
      s += `<path d="M${n(l[0])} ${n(l[1])}Q${n(mid[0])} ${n(mid[1] - 2)} ${n(r[0])} ${n(r[1])}" style="fill:none;stroke:${INK};stroke-width:7;stroke-linecap:round"/>`;
      s += travel(spermSvg(0, 0, 5, 18, -90), `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1] + 2)}`, { t: 1.2 });
      s += tag(16, H - 76, 'Barrier', { size: 16, display: true, anchor: 'start' }) + note('Sperm cannot reach the egg');
    } else if (step === 5) {
      s += this._fig(st, { lining: 0.5, dim: (id) => ['uterus', 'lining', 'cavity', 'cervix', 'vagina', 'ligament'].includes(id) });
      const o = this._pt([354, 130]), t = this._pt(tubePt('R', 0.75));
      s += `<g style="opacity:0.4">${eggSvg(o[0], o[1] - 4, 10, { id: 'pbe' })}</g>` + dots([[o[0] + 12, o[1] - 12], t], BODY.egg);
      s += `<path d="M${n(t[0] - 14)} ${n(t[1] - 14)}L${n(t[0] + 14)} ${n(t[1] + 14)}M${n(t[0] + 14)} ${n(t[1] - 14)}L${n(t[0] - 14)} ${n(t[1] + 14)}" style="fill:none;stroke:${INK};stroke-width:5;stroke-linecap:round"/>`;
      s += strip(14, H - 112, 4, 2, 26);
      s += P ? tag(W - 8, H - 66, 'Changes release of eggs', { size: 14, anchor: 'end' }) + tag(W - 8, H - 30, 'May have side effects', { size: 14, anchor: 'end', col: MUTED })
        : tag(W - 16, H - 66, 'Changes the release of eggs', { size: 15, anchor: 'end' }) + tag(W - 16, H - 28, 'May have some side effects', { size: 14, anchor: 'end', col: MUTED });
    } else if (step === 6) {
      s += this._fig(st, { lining: 0.55, copperT: true, dim: (id) => ['ovary', 'tube', 'ligament'].includes(id) });
      s += tag(16, H - 76, 'Copper-T', { size: 16, display: true, anchor: 'start' }) + note('May sometimes irritate the uterus');
    } else if (step === 7) {
      const k = P ? 0.62 : 0.74, fx = P ? W / 2 - 220 * k : 8, fy = 44;
      s += txt(P ? W / 2 : fx + 220 * k, 28, 'Fallopian tubes blocked', { size: 16, display: true });
      s += femaleSystemSvg(fx, fy, k, { id: 'pb', lining: 0.5, block: true, dim: (id) => ['ovary', 'ligament', 'vagina', 'cervix'].includes(id) });
      const k2 = P ? 0.44 : 0.72, mx = P ? W / 2 - 170 * k2 : W - 356 * k2 - 6, my = P ? fy + 240 : 44;
      s += txt(P ? W / 2 : mx + 178 * k2, P ? fy + 228 : 28, 'Vas deferens blocked', { size: 16, display: true });
      s += maleSystemSvg(mx, my, k2, { dim: (id) => id !== 'vas' && id !== 'testis', lit: (id) => id === 'vas' });
      const b = [mx + 88 * k2, my + 170 * k2];
      s += `<rect x="${n(b[0] - 14)}" y="${n(b[1] - 7)}" width="28" height="14" rx="4" style="fill:${INK};stroke:${PAPER};stroke-width:2"/>`;
      s += P ? '' : note('Sperm and egg cannot meet');
    } else {
      const u = P ? 62 : 74, cols = 4, rows = 2, sw = cols * u + 16, sh = rows * u + 16;
      s += tag(W / 2, 34, 'Central Drug Research Institute', { size: P ? 16 : 19, display: true }) + tag(W / 2, 72, 'Lucknow', { size: P ? 15 : 17 });
      s += strip((W - sw) / 2, P ? 104 : 104, cols, rows, u);
      if (P) s += tag(W / 2, H - 118, 'Your book: world\'s first', { size: 15 }) + tag(W / 2, H - 80, 'non-steroidal, non-hormonal oral pill', { size: 15 });
      else s += tag(W / 2, H - 78, 'Your book: world\'s first non-steroidal, non-hormonal oral pill', { size: 16 });
      s += note(P ? 'Free: Family Planning Programme' : 'Free through the National Family Planning Programme');
    }
    return { svg: frame(st, 'pb', s, { field: { a: 1, b: 3, seed: 14, k: 11, x: 0.8 } }) };
  }
}
