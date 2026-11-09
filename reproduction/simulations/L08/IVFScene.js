// IVFScene - fertilisation outside the body, on a laboratory bench. 3 beats. 0: a culture dish with an egg and sperm; the
// fertilised egg goes to the uterus. 1: the dish beside a test tube: the name says tube, the work is in a dish. 2: the date
// and the city on a card. No likeness of any person. Not to scale. No controls.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { femaleSystemSvg, BODY_CSS, travel, frame, tag, txt, eggSvg, spermSvg, form, panel, n, MUTED, INK } from '../shared/BodyArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const GL = 'var(--sim-glass)';
const glassEdge = `color-mix(in oklab, ${GL} 50%, ${INK})`;
function bench(st) {
  const W = st.W, H = st.H, y = st.portrait ? H * 0.16 : H * 0.34;
  return `<defs><linearGradient id="iv-wall" x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" style="stop-color:color-mix(in oklab, var(--sim-series-1) 16%, var(--sim-bg-deep))"/><stop offset="1" style="stop-color:color-mix(in oklab, var(--sim-series-5) 10%, var(--sim-bg-deep))"/></linearGradient>
    <linearGradient id="iv-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in oklab, var(--sim-series-1) 10%, var(--sim-bg-surface))"/><stop offset="1" style="stop-color:color-mix(in oklab, var(--sim-stroke) 42%, var(--sim-bg-surface))"/></linearGradient></defs>
    <rect width="${W}" height="${H}" style="fill:url(#iv-wall)"/>`
    + Array.from({ length: 7 }, (_, i) => `<path d="M${n(W * (i + 1) / 7)} 0L${n(W * (i + 1) / 7)} ${n(y)}" style="fill:none;stroke:var(--sim-stroke);stroke-width:1;opacity:0.16"/>`).join('')
    + `<path d="M${n(W * 0.62)} 0L${n(W)} 0L${n(W)} ${n(y)}L${n(W * 0.46)} ${n(y)}Z" style="fill:var(--sim-bg-surface);opacity:0.22;filter:blur(10px)"/>`
    + `<rect y="${n(y)}" width="${W}" height="${n(H - y)}" style="fill:url(#iv-top)"/><rect y="${n(y)}" width="${W}" height="3" style="fill:var(--sim-bg-surface);opacity:0.65"/>`;
}
function dish(cx, cy, rx) {
  const ry = rx * 0.4, dep = rx * 0.17, id = `iv-d${Math.round(cx)}`;
  return `<ellipse cx="${n(cx + 8)}" cy="${n(cy + dep + 12)}" rx="${n(rx * 1.06)}" ry="${n(ry * 1.02)}" style="fill:${INK};opacity:0.2;filter:blur(8px)"/>`
    + `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" style="stop-color:color-mix(in oklab, ${GL} 60%, var(--sim-bg-surface))"/><stop offset="0.4" style="stop-color:color-mix(in oklab, ${GL} 24%, var(--sim-bg-surface))"/><stop offset="1" style="stop-color:color-mix(in oklab, ${GL} 56%, var(--sim-bg-deep))"/></linearGradient>`
    + `<radialGradient id="${id}m" cx="0.42" cy="0.36" r="0.75"><stop offset="0" style="stop-color:color-mix(in oklab, var(--sim-series-4) 12%, var(--sim-bg-surface))"/><stop offset="1" style="stop-color:color-mix(in oklab, var(--sim-series-4) 34%, var(--sim-bg-surface))"/></radialGradient></defs>`
    + `<path d="M${cx - rx} ${cy}L${cx - rx} ${n(cy + dep)}A${rx} ${n(ry)} 0 0 0 ${cx + rx} ${n(cy + dep)}L${cx + rx} ${cy}" style="fill:url(#${id});stroke:${glassEdge};stroke-width:2.2"/>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${n(ry)}" style="fill:color-mix(in oklab, ${GL} 22%, var(--sim-bg-surface));stroke:${glassEdge};stroke-width:2.2"/>`
    + `<ellipse cx="${cx}" cy="${n(cy + 3)}" rx="${n(rx * 0.93)}" ry="${n(ry * 0.88)}" style="fill:url(#${id}m);stroke:color-mix(in oklab, ${GL} 40%, transparent);stroke-width:1.5"/>`;
}
const shine = (cx, cy, rx) => `<path d="M${n(cx - rx * 0.76)} ${n(cy - rx * 0.1)}A${n(rx * 0.84)} ${n(rx * 0.33)} 0 0 1 ${n(cx - rx * 0.1)} ${n(cy - rx * 0.32)}" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:5;stroke-linecap:round;opacity:0.8"/>`;
function testTube(x, y, h) {
  const d = `M${x - 18} ${y}L${x - 18} ${y + h}A18 18 0 0 0 ${x + 18} ${y + h}L${x + 18} ${y}Z`;
  return `<g transform="rotate(12 ${x} ${y + h})"><ellipse cx="${x + 16}" cy="${y + h + 16}" rx="44" ry="9" style="fill:${INK};opacity:0.16;filter:blur(5px)"/>`
    + form(d, `color-mix(in oklab, ${GL} 30%, var(--sim-bg-surface))`, { ao: 8, aoOp: 0.32, rim: 2.2, rimCol: glassEdge, cx: 0.2, cy: 0.5, r: 1, hi: 40, lo: 80 })
    + `<rect x="${x - 23}" y="${y - 7}" width="46" height="9" rx="4.5" style="fill:color-mix(in oklab, ${GL} 42%, var(--sim-bg-surface));stroke:${glassEdge};stroke-width:2"/><path d="M${x - 9} ${y + 12}L${x - 9} ${y + h - 6}" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:4;stroke-linecap:round;opacity:0.85"/></g>`;
}

export class IVFScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 440;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 460;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static ARIA_LABEL = 'In-vitro fertilisation on a laboratory bench: an egg and sperm in a culture dish, then the fertilised egg moved to the uterus. The name test tube baby is shown beside a dish and a test tube.';
  css() { return `${BODY_CSS}.svs { padding: 0; }`; }
  stageHeight(st) { return st.portrait ? 440 : 390; }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    const dx = P ? W / 2 : W * 0.31, dy = P ? 118 : H * 0.56, rx = P ? 140 : 168;
    let s = dish(dx, dy, rx);
    s += eggSvg(dx - 6, dy - 2, P ? 34 : 40, { id: 'iv' });
    s += spermSvg(dx + rx * 0.5, dy - 20, 7, 42, 188, { phase: 1 }) + spermSvg(dx - rx * 0.54, dy + 24, 7, 42, -14, { phase: 2 }) + spermSvg(dx + rx * 0.44, dy + 30, 7, 42, 200);
    s += shine(dx, dy, rx);
    s += tag(dx, dy + (P ? 100 : 112), 'Culture dish', { size: 15, display: true });
    if (step === 0) {
      const k = P ? 0.56 : 0.64, ux = P ? W / 2 - 220 * k : W - 440 * k - 8, uy = P ? 226 : 20, tx = ux + 220 * k, ty = uy + 130 * k;
      s += `<ellipse cx="${n(tx)}" cy="${n(uy + 150 * k)}" rx="${n(190 * k)}" ry="${n(160 * k)}" style="fill:var(--sim-bg-surface);opacity:0.45;filter:blur(16px)"/>`;
      s += femaleSystemSvg(ux, uy, k, { lining: 0.9, vessels: true, dim: (id) => ['ovary', 'ligament'].includes(id) });
      s += `<path d="M${n(dx - 6)} ${n(dy)}L${n(tx)} ${n(ty)}" style="fill:none;stroke:${INK};stroke-width:3.5;stroke-linecap:round;stroke-dasharray:2 10"/>`;
      s += travel(eggSvg(0, 0, 9, {}), `M${n(dx - 6)} ${n(dy)}L${n(tx)} ${n(ty)}`, { t: 2, d: 0.4 });
      s += P ? tag(W / 2, H - 22, 'Fertilised egg placed in the uterus', { size: 14 }) : tag(W - 12, H - 24, 'Fertilised egg placed in the uterus', { size: 14, anchor: 'end' });
    }
    if (step === 1) {
      const tx0 = P ? W * 0.5 : W * 0.78;
      s += testTube(tx0, P ? 236 : 70, P ? 112 : 190);
      s += tag(tx0, H - (P ? 40 : 34), 'The name says test tube', { size: 14 });
      if (!P) s += txt(W * 0.31, H - 22, 'The work is done in a dish', { size: 15, col: MUTED });
    }
    if (step === 2) {
      const cx = P ? W / 2 : W * 0.78, cy = P ? 316 : H * 0.42, cw = P ? 280 : 240;
      s += panel(cx - cw / 2, cy - 92, cw, 174);
      s += txt(cx, cy - 34, '1978', { size: 44, display: true });
      s += txt(cx, cy + 8, 'Kolkata', { size: 22, display: true });
      s += txt(cx, cy + 46, "India's first", { size: 15, col: MUTED }) + txt(cx, cy + 66, 'test tube baby', { size: 15, col: MUTED });
    }
    return { svg: frame(st, 'iv', s, { back: bench(st) }) };
  }
}
