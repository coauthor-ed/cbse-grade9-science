// PeriodCareScene - six hygiene points from the book as six objects on the shelves of a clean tiled wall, in soft window
// light. 3 beats: a calm statement, then the first three objects lit, then the last three. Objects only: pad, steel mug of
// water, soap, wrapped pad and bin, cloth pad drying on a line, clock with 4 to 6 hours marked. No people, no blood. No controls.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { BODY_CSS, frame, tag, txt, n, form, tube, BODY, INK, MUTED } from '../shared/BodyArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const SOFT = 'color-mix(in oklab, var(--sim-series-1) 20%, var(--sim-bg-surface))', STEEL = 'color-mix(in oklab, var(--sim-stroke) 64%, var(--sim-bg-surface))', GRN = 'color-mix(in oklab, var(--sim-series-3) 62%, var(--sim-bg-surface))';
const ico = {
  pad: () => {
    const d = 'M-15 -38C-5 -46 5 -46 15 -38C21 -24 20 -18 18 -12C26 -10 32 -4 32 2C32 8 26 12 18 12C20 20 21 26 15 38C5 46 -5 46 -15 38C-21 26 -20 20 -18 12C-26 12 -32 8 -32 2C-32 -4 -26 -10 -18 -12C-20 -18 -21 -24 -15 -38Z';
    let dots = ''; for (let y = -30; y <= 30; y += 8) for (let x = -9; x <= 9; x += 6) dots += `<circle cx="${x + (Math.abs(y) % 16 ? 3 : 0)}" cy="${y}" r="1.1" style="fill:color-mix(in oklab, var(--sim-series-1) 50%, var(--sim-bg-surface));opacity:0.7"/>`;
    return form(d, SOFT, { ao: 8, rim: 2, hi: 70, lo: 84, inner: dots });
  },
  water: () => form('M-26 -22L26 -22L22 30Q0 38 -22 30Z', STEEL, { ao: 8, rim: 2.2, hi: 50, lo: 66, cx: 0.22, cy: 0.4, inner: '<path d="M-14 -18L-16 28" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:6;opacity:0.65;filter:blur(1.5px)"/>' })
    + `<ellipse cx="0" cy="-22" rx="26" ry="8" style="fill:color-mix(in oklab, ${STEEL} 66%, black);stroke:color-mix(in oklab, ${STEEL} 56%, black);stroke-width:2"/><ellipse cx="0" cy="-20" rx="22" ry="5.5" style="fill:color-mix(in oklab, var(--sim-series-1) 60%, var(--sim-bg-surface))"/><path d="M-10 -21Q0 -24 10 -21" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:1.6;opacity:0.8"/>`
    + tube('M25 -8Q44 -6 42 10Q40 22 22 20', STEEL, 5),
  soap: () => `<ellipse cx="0" cy="30" rx="40" ry="9" style="fill:color-mix(in oklab, var(--sim-series-1) 40%, var(--sim-bg-surface));stroke:color-mix(in oklab, var(--sim-series-1) 60%, black);stroke-width:2"/>`
    + form('M-28 2C-28 -6 28 -6 28 2C32 16 30 26 24 28C8 32 -8 32 -24 28C-30 26 -32 16 -28 2Z', GRN, { ao: 7, rim: 2, hi: 66, inner: '<path d="M-20 6Q0 0 20 6" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:3;opacity:0.6"/>' })
    + [[-14, -14, 8], [6, -24, 11], [22, -8, 6]].map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" style="fill:color-mix(in oklab, var(--sim-bg-surface) 40%, transparent);stroke:var(--sim-series-1);stroke-width:1.4"/><path d="M${a - r * 0.5} ${b - r * 0.3}A${r * 0.6} ${r * 0.6} 0 0 1 ${a} ${b - r * 0.6}" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:1.8"/>`).join(''),
  bin: () => {
    const c = 'color-mix(in oklab, var(--sim-series-3) 44%, var(--sim-bg-surface))';
    return form('M-11 -40L12 -44L14 -22L-10 -18Z', 'color-mix(in oklab, var(--sim-series-2) 26%, var(--sim-bg-surface))', { ao: 4, rim: 1.8, inner: [-38, -33, -27].map((y) => `<path d="M-10 ${y}L13 ${y - 4}" style="fill:none;stroke:color-mix(in oklab, var(--sim-series-2) 50%, black);stroke-width:1.2;opacity:0.5"/>`).join('') })
      + form('M-24 -10L24 -10L19 36Q0 40 -19 36Z', c, { ao: 10, rim: 2.2, hi: 56, inner: [-10, 0, 10].map((x) => `<path d="M${x} -6L${x * 0.8} 34" style="fill:none;stroke:color-mix(in oklab, ${c} 60%, black);stroke-width:2;opacity:0.4"/>`).join('') })
      + `<rect x="-28" y="-16" width="56" height="9" rx="4.5" style="fill:color-mix(in oklab, ${c} 76%, black);stroke:color-mix(in oklab, ${c} 56%, black);stroke-width:1.6"/>`;
  },
  line: () => `<path d="M-48 -32Q0 -22 48 -32" style="fill:none;stroke:${INK};stroke-width:2.2"/>`
    + form('M-16 -24C-6 -30 6 -30 16 -24C21 -6 21 14 16 30C6 36 -6 36 -16 30C-21 14 -21 -6 -16 -24Z', 'color-mix(in oklab, var(--sim-series-5) 30%, var(--sim-bg-surface))', { ao: 7, rim: 2, hi: 66, inner: '<path d="M-10 -18C-5 -22 5 -22 10 -18C14 -2 14 10 10 24C5 28 -5 28 -10 24C-14 10 -14 -2 -10 -18Z" style="fill:none;stroke:var(--sim-series-5);stroke-width:1.6;stroke-dasharray:4 3;opacity:0.7"/>' })
    + `<rect x="-5" y="-34" width="10" height="17" rx="3" style="fill:var(--sim-series-2);stroke:color-mix(in oklab, var(--sim-series-2) 56%, black);stroke-width:1.4"/>`,
  clock: () => {
    const R = 36, pt = (h) => { const a = (h / 12) * 6.283 - 1.571; return [Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86]; }, [a4, a6] = [pt(4), pt(6)];
    return form(`M0 ${-R}A${R} ${R} 0 1 1 0 ${R}A${R} ${R} 0 1 1 0 ${-R}Z`, 'color-mix(in oklab, var(--sim-series-5) 22%, var(--sim-bg-surface))', { ao: 8, rim: 2.6, hi: 70, lo: 80 })
      + `<path d="M0 0L${n(pt(0)[0])} ${n(pt(0)[1])}A${n(R * 0.86)} ${n(R * 0.86)} 0 0 1 ${n(a4[0])} ${n(a4[1])}Z" style="fill:var(--sim-series-3);opacity:0.42"/><path d="M0 0L${n(a4[0])} ${n(a4[1])}A${n(R * 0.86)} ${n(R * 0.86)} 0 0 1 ${n(a6[0])} ${n(a6[1])}Z" style="fill:var(--sim-series-2);opacity:0.5"/>`
      + Array.from({ length: 12 }, (_, i) => { const p = pt(i); return `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${i % 3 ? 1.4 : 2.4}" style="fill:${INK}"/>`; }).join('')
      + `<path d="M0 0L0 -24M0 0L${n(a6[0] * 0.66)} ${n(a6[1] * 0.66)}" style="fill:none;stroke:${INK};stroke-width:3.5;stroke-linecap:round"/><circle r="3.5" style="fill:${INK}"/>`;
  },
};
const CARDS = [['pad', 'Clean products'], ['water', 'Water, not soap,', 'for the genital area'], ['soap', 'Wash hands', 'before and after'], ['bin', 'Wrap, then bin', 'Never flush'], ['line', 'Reusable pads', 'fully dry'], ['clock', 'Change in', '4 to 6 hours']];
function wall(st) {
  const W = st.W, H = st.H, u = 46;
  let s = `<defs><linearGradient id="pc-w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:color-mix(in oklab, var(--sim-series-1) 12%, var(--sim-bg-surface))"/><stop offset="1" style="stop-color:color-mix(in oklab, var(--sim-series-3) 14%, var(--sim-bg-deep))"/></linearGradient></defs><rect width="${W}" height="${H}" style="fill:url(#pc-w)"/>`;
  for (let x = 0; x < W; x += u) s += `<path d="M${x} 0L${x} ${H}" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:1.6;opacity:0.5"/>`;
  for (let y = 0; y < H; y += u) s += `<path d="M0 ${y}L${W} ${y}" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:1.6;opacity:0.5"/>`;
  return `${s}<path d="M0 0L${n(W * 0.5)} 0L${n(W * 0.2)} ${H}L0 ${H}Z" style="fill:var(--sim-bg-surface);opacity:0.25;filter:blur(18px)"/>`;
}

export class PeriodCareScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 440;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 470;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static ARIA_LABEL = 'Six objects on shelves for period care: clean products, a mug of water, soap for hand washing, a wrapped pad and a bin, a reusable pad drying on a line, and a clock marked 4 to 6 hours.';
  css() { return `${BODY_CSS}.svs { padding: 0; }`; }
  stageHeight(st) { return st.portrait ? 450 : 400; }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, cols = P ? 2 : 3, rows = P ? 3 : 2;
    const top = step === 0 ? 58 : 8, rh = (H - top - 6) / rows, cw = (W - 12) / cols;
    let s = step === 0 ? tag(W / 2, 30, P ? 'A sign of a healthy system' : 'A sign of a healthy reproductive system', { size: P ? 17 : 19, display: true, rim: BODY.lining }) : '';
    for (let r = 0; r < rows; r++) {
      const y = top + (r + 1) * rh - 52;
      s += `<rect x="6" y="${n(y + 6)}" width="${W - 12}" height="12" rx="3" style="fill:color-mix(in oklab, var(--sim-series-2) 34%, var(--sim-bg-surface));stroke:color-mix(in oklab, var(--sim-series-2) 50%, black);stroke-width:1.6"/><rect x="10" y="${n(y + 18)}" width="${W - 20}" height="9" rx="3" style="fill:${INK};opacity:0.14;filter:blur(4px)"/>`;
    }
    CARDS.forEach(([k, a, b], i) => {
      const c = i % cols, r = Math.floor(i / cols), x = 6 + c * cw + cw / 2, base = top + (r + 1) * rh - 52;
      const on = step === 0 || (step === 1 ? i < 3 : i >= 3), sz = Math.min(1.12, (rh - 60) / 84), oy = base + 2 - 40 * sz;
      s += `<g style="opacity:${on ? 1 : 0.3}"><ellipse cx="${n(x + 5)}" cy="${n(base + 4)}" rx="${n(36 * sz)}" ry="5" style="fill:${INK};opacity:0.18;filter:blur(3px)"/><g transform="translate(${n(x)} ${n(oy)}) scale(${n(sz)})">${ico[k]()}</g>`;
      s += txt(x, base + (b ? 31 : 42), a, { size: 15, weight: 800 });
      if (b) s += txt(x, base + 51, b, { size: 14, col: MUTED });
      s += '</g>';
    });
    return { svg: frame(st, 'pc', s, { back: wall(st) }) };
  }
}
