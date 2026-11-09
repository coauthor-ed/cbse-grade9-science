// GrowingUpScene - a road past three signposts, childhood, adolescence, adulthood, with two bands below on the same stretches.
// Each band fades in slowly, because each change is gradual. Beat 0: sexual maturity, through adolescence. Beat 1: emotional
// maturity, which takes longer, and what it means. No bodies, no ages: the book gives no number, so the bands show order only.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { BODY_CSS, frame, txt, n, panel, MUTED, form, tube, tag, tagW } from '../shared/BodyArt.js';
import { PLANT_COLOR_MAP, artDefs } from '../shared/PlantArt.js';
import { sky, hills, orchard, grass } from '../shared/Scapes.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const A = 'var(--sim-series-4)', B = 'var(--sim-series-1)';
const cm = (a, b, k) => `color-mix(in oklab, ${a} ${k}%, ${b})`;
const WOOD = cm(cm('var(--sim-series-2)', 'var(--sim-series-8)', 46), 'var(--sim-bg-surface)', 70);
function land(st) {
  const W = st.W, H = st.H, top = st.portrait ? 132 : 150, y = top - 28;
  const lane = (off) => `M-10 ${n(y + 6 + off)}C${n(W * 0.28)} ${n(y - 8 + off)} ${n(W * 0.6)} ${n(y + 14 + off)} ${W + 10} ${n(y - 2 + off)}`;
  return artDefs() + sky(W, H, { sun: [W * 0.12, top * 0.3], warm: 0.5 }) + hills(W, top * 0.5, { seed: 7 }) + orchard(W, top * 0.72, { seed: 5 })
    + `<rect y="${n(y - 12)}" width="${W}" height="${n(H - y + 12)}" style="fill:${cm('var(--sim-series-3)', 'var(--sim-bg-surface)', 40)}"/>`
    + grass(W, y - 6, 12, { seed: 4 })
    + `<path d="${lane(0)}" style="fill:none;stroke:${cm(WOOD, 'black', 62)};stroke-width:21"/><path d="${lane(0)}" style="fill:none;stroke:${cm(WOOD, 'var(--sim-bg-surface)', 62)};stroke-width:18"/><path d="${lane(-3)}" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:2;opacity:0.5;stroke-dasharray:14 22"/><path d="${lane(4)}" style="fill:none;stroke:${cm(WOOD, 'black', 62)};stroke-width:1.6;opacity:0.5;stroke-dasharray:6 18"/>`;
}
function sign(x, y, label, P) {
  const w = label.length * (P ? 8.2 : 10.4) + 24, h = P ? 28 : 32, top = y - (P ? 72 : 96);
  const d = `M${n(x - w / 2)} ${n(top + 4)}L${n(x + w / 2 - 4)} ${n(top)}L${n(x + w / 2)} ${n(top + h - 4)}L${n(x - w / 2 + 4)} ${n(top + h)}Z`;
  let grain = '';
  for (let i = 1; i < 4; i++) grain += `<path d="M${n(x - w / 2)} ${n(top + i * h / 4 + 2)}Q${n(x)} ${n(top + i * h / 4 - 3)} ${n(x + w / 2)} ${n(top + i * h / 4)}" style="fill:none;stroke:${cm(WOOD, 'black', 62)};stroke-width:1.1;opacity:0.4"/>`;
  return `<ellipse cx="${n(x + 6)}" cy="${n(y + 2)}" rx="16" ry="4" style="fill:var(--sim-label);opacity:0.24"/>` + tube(`M${n(x)} ${n(top + h - 4)}L${n(x)} ${n(y)}`, cm(WOOD, 'black', 76), 7)
    + form(d, WOOD, { ao: 5, aoOp: 0.32, rim: 2, hi: 62, lo: 76, inner: grain }) + txt(x, top + h / 2 + (P ? 5 : 6), label, { size: P ? 14 : 17, display: true });
}
// A band of one height that fades in from the left: the change is gradual. Ends in a soft cap.
function band(W, y, a, b, col, id) {
  const x0 = W * a, x1 = W * b, h = 30;
  return `<defs><linearGradient id="${id}"><stop offset="0" style="stop-color:${col};stop-opacity:0.08"/><stop offset="0.7" style="stop-color:${col};stop-opacity:0.8"/><stop offset="1" style="stop-color:${col};stop-opacity:0.95"/></linearGradient></defs>`
    + `<rect x="${n(x0 + 3)}" y="${n(y + 4)}" width="${n(x1 - x0)}" height="${h}" rx="${h / 2}" style="fill:var(--sim-label);opacity:0.12;filter:blur(4px)"/>`
    + `<rect x="${n(x0)}" y="${n(y)}" width="${n(x1 - x0)}" height="${h}" rx="${h / 2}" style="fill:var(--sim-bg-surface);opacity:0.55"/><rect x="${n(x0)}" y="${n(y)}" width="${n(x1 - x0)}" height="${h}" rx="${h / 2}" style="fill:url(#${id});stroke:color-mix(in oklab, ${col} 50%, transparent);stroke-width:2"/>`
    + `<rect x="${n(x0 + 12)}" y="${n(y + 4)}" width="${n(x1 - x0 - 24)}" height="6" rx="3" style="fill:var(--sim-bg-surface);opacity:0.4"/>`;
}

export class GrowingUpScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1)];
  static COLOR_MAP = PLANT_COLOR_MAP;
  static WIDTH = 640;
  static HEIGHT = 420;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 460;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static ARIA_LABEL = 'Two bands across childhood, adolescence and adulthood: sexual maturity grows through adolescence, and emotional maturity takes longer, into adulthood.';
  css() { return `${BODY_CSS}.svs { padding: 0; }`; }
  stageHeight(st) { return st.portrait ? 430 : 380; }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    const top = P ? 132 : 150, xs = [0.3, 0.66];
    let s = '';
    [['Childhood', 0.16], ['Adolescence', 0.48], ['Adulthood', 0.83]].forEach(([l, u]) => { s += sign(W * u, top - 22, l, P); });
    s += panel(10, top, W - 20, H - top - 10, { fillCol: cm('var(--sim-bg-surface)', 'transparent', 90) });
    const dashEnd = top + 26 + (step === 0 ? 46 : 112);
    xs.forEach((u) => { s += `<path d="M${n(W * u)} ${top + 8}L${n(W * u)} ${dashEnd}" style="fill:none;stroke:var(--sim-label);stroke-width:1.6;opacity:0.3;stroke-dasharray:3 8"/>`; });
    const y1 = top + 26;
    s += txt(W * 0.14, y1, 'Sexual maturity', { size: P ? 16 : 18, display: true, anchor: 'start' });
    s += band(W, y1 + 10, 0.14, 0.62, A, 'gu-a');
    if (step === 0) {
      const y = y1 + 76;
      s += txt(W / 2, y, 'Sperm production in boys', { size: P ? 15 : 16 }) + txt(W / 2, y + 30, 'Menstrual cycles in girls', { size: P ? 15 : 16 });
      s += txt(W / 2, y + 74, 'Gradual, and different', { size: 15, col: MUTED }) + txt(W / 2, y + 96, 'for each person', { size: 15, col: MUTED });
    } else {
      const y2 = y1 + 66;
      s += txt(W * 0.26, y2, P ? 'Emotional maturity: longer' : 'Emotional maturity takes longer', { size: P ? 16 : 18, display: true, anchor: 'start' });
      s += band(W, y2 + 10, 0.26, 0.94, B, 'gu-b');
      const items = ['Handling feelings', 'Communicating clearly', 'Thoughtful decisions'];
      if (P) items.forEach((l, i) => { s += tag(W / 2, y2 + 76 + i * 36, l, { size: 15 }); });
      else { const ws = items.map((l) => tagW(l, 14)), gap = (W - 40 - ws.reduce((a, b) => a + b, 0)) / 2; let x = 20; items.forEach((l, i) => { s += tag(x, H - 42, l, { size: 14, anchor: 'start' }); x += ws[i] + gap; }); }
    }
    return { svg: frame(st, 'gu', s, { back: land(st) }) };
  }
}
