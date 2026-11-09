// CareCircleScene - care for a mother and a baby, drawn as the plain things of a home and a health visit on a low table by a
// window. 4 beats: during pregnancy, after the birth, when a mother feels low, ASHA workers. Things only: no people, no
// faces. The baby is a wrapped bundle seen from behind in a cradle. No controls.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { BODY_CSS, frame, tag, txt, n, form, tube, INK } from '../shared/BodyArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const cm = (a, b, k) => `color-mix(in oklab, ${a} ${k}%, ${b})`;
const S = (i) => `var(--sim-series-${i})`, PAPER = 'var(--sim-bg-surface)';
const STEEL = cm('var(--sim-stroke)', PAPER, 64);
const things = {
  thali: () => `<ellipse cx="4" cy="8" rx="66" ry="17" style="fill:${INK};opacity:0.16;filter:blur(5px)"/>` + form('M-62 -4A62 22 0 1 1 62 -4A62 22 0 1 1 -62 -4Z', STEEL, { ao: 6, rim: 2.2, hi: 56, lo: 70 })
    + `<ellipse cx="0" cy="-5" rx="52" ry="17" style="fill:${cm(STEEL, 'black', 88)}"/>`
    + form('M-44 -6C-40 -18 -14 -20 -8 -8C-10 2 -40 4 -44 -6Z', cm(S(2), PAPER, 16), { ao: 3, rim: 1.2, hi: 76, lo: 86 })
    + form('M-2 -13A15 7 0 1 1 28 -13A15 7 0 1 1 -2 -13Z', cm(S(2), S(8), 70), { ao: 3, rim: 1.4 })
    + form('M2 3A13 6 0 1 1 28 3A13 6 0 1 1 2 3Z', S(3), { ao: 3, rim: 1.4 })
    + form('M30 -8A10 6 0 1 1 50 -8A10 6 0 1 1 30 -8Z', cm(S(6), S(8), 70), { ao: 3, rim: 1.4 }),
  card: (ticks = 4) => {
    let s = `<rect x="-38" y="-36" width="84" height="84" rx="8" transform="rotate(4)" style="fill:${INK};opacity:0.14;filter:blur(5px)"/><g transform="rotate(-4)">` + form('M-40 -42L40 -42L40 42L-40 42Z', cm(S(2), PAPER, 12), { ao: 5, aoOp: 0.25, rim: 1.8, hi: 80, lo: 88 });
    s += `<rect x="-32" y="-34" width="64" height="10" rx="3" style="fill:${S(1)};opacity:0.7"/>`;
    for (let i = 0; i < 5; i++) { const y = -14 + i * 11; s += `<rect x="-32" y="${y}" width="9" height="9" rx="2" style="fill:${PAPER};stroke:${INK};stroke-width:1.2"/><path d="M-16 ${y + 5}L30 ${y + 5}" style="fill:none;stroke:var(--sim-stroke);stroke-width:2"/>`; if (i < ticks) s += `<path d="M-30 ${y + 5}l2.5 2.5l5 -6" style="fill:none;stroke:${S(3)};stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round"/>`; }
    return `${s}</g>`;
  },
  steth: () => tube('M-22 -44C-34 -14 -30 6 -4 12C24 16 34 -8 22 -44', cm(S(5), 'black', 50), 5) + tube('M-4 12C2 34 36 44 44 22', cm(S(5), 'black', 50), 5)
    + form('M34 18A13 13 0 1 1 60 18A13 13 0 1 1 34 18Z', STEEL, { ao: 5, rim: 2, hi: 60 }) + `<circle cx="-22" cy="-46" r="4" style="fill:${STEEL}"/><circle cx="22" cy="-46" r="4" style="fill:${STEEL}"/>`,
  pillow: () => `<ellipse cx="4" cy="30" rx="70" ry="9" style="fill:${INK};opacity:0.16;filter:blur(5px)"/>` + form('M-66 -14C-40 -32 40 -32 66 -14C74 0 74 14 66 26C40 36 -40 36 -66 26C-74 14 -74 0 -66 -14Z', cm(S(5), PAPER, 22), { ao: 14, rim: 2, hi: 72, lo: 82, inner: `<path d="M-40 -6Q0 -18 40 -6" style="fill:none;stroke:${PAPER};stroke-width:4;opacity:0.55"/>` }),
  cradle: () => {
    const w = cm(cm(S(2), S(8), 46), PAPER, 74), dark = cm(w, 'black', 60), wrap = cm(S(4), PAPER, 30), cap = cm(S(1), PAPER, 46);
    let weave = '';
    for (let r = 0; r < 6; r++) for (let c = -8; c <= 8; c++) { const x = c * 8 + (r % 2) * 4, y = 4 + r * 7.4; weave += `<path d="M${x - 3} ${y}q3 -3 6 0" style="fill:none;stroke:${r % 2 ? cm(w, 'white', 70) : dark};stroke-width:1.8;opacity:0.5"/>`; }
    const rib = [-13, -8, -3, 2, 7].map((x) => `<path d="M${x - 38} -40Q${x - 42} -24 ${x - 36} -10" style="fill:none;stroke:${cm(cap, 'black', 60)};stroke-width:1.7;opacity:0.55"/>`).join('');
    return tube('M-62 42Q0 66 62 42', cm(w, 'black', 62), 7)
      + form('M-46 -4C-46 -30 -18 -40 6 -36C34 -32 48 -18 46 -4C30 8 -30 8 -46 -4Z', wrap, { ao: 12, rim: 1.8, hi: 74, lo: 80, inner: `<path d="M-26 -38C-14 -22 -14 -8 -24 8M-2 -38C12 -22 14 -8 4 8M22 -34C32 -22 34 -10 28 4" style="fill:none;stroke:${cm(S(4), 'black', 40)};stroke-width:2.2;opacity:0.5"/><path d="M-22 -36C-10 -20 -10 -8 -20 8M2 -38C16 -22 18 -8 8 8" style="fill:none;stroke:${PAPER};stroke-width:1.6;opacity:0.5"/>` })
      + form('M-54 -24C-54 -42 -32 -46 -22 -38C-12 -30 -14 -12 -26 -6C-40 -2 -54 -8 -54 -24Z', cap, { ao: 7, rim: 1.8, hi: 62, lo: 74, cx: 0.4, inner: rib }) + `<path d="M-52 -14C-46 -6 -32 -2 -24 -6" style="fill:none;stroke:${cm(cap, 'black', 62)};stroke-width:4;stroke-linecap:round"/>`
      + form('M-60 -2C-58 34 -30 46 0 46C30 46 58 34 60 -2C30 8 -30 8 -60 -2Z', w, { ao: 9, rim: 2.2, hi: 56, lo: 72, inner: weave })
      + tube('M-60 -2C-30 8 30 8 60 -2', cm(w, 'black', 80), 5);
  },
  blanket: () => `<ellipse cx="4" cy="30" rx="66" ry="8" style="fill:${INK};opacity:0.16;filter:blur(5px)"/>` + [0, 1, 2].map((i) => form(`M-60 ${16 - i * 15}C-60 ${2 - i * 15} 60 ${2 - i * 15} 60 ${16 - i * 15}C64 ${24 - i * 15} 60 ${32 - i * 15} 60 ${32 - i * 15}L-60 ${32 - i * 15}C-64 ${28 - i * 15} -64 ${22 - i * 15} -60 ${16 - i * 15}Z`, cm(S([8, 2, 4][i]), PAPER, 34), { ao: 5, rim: 1.8, hi: 66 })).join(''),
  phone: () => `<rect x="-22" y="-40" width="50" height="88" rx="9" style="fill:${INK};opacity:0.16;filter:blur(5px)"/>` + form('M-26 -44L26 -44Q30 -44 30 -40L30 40Q30 44 26 44L-26 44Q-30 44 -30 40L-30 -40Q-30 -44 -26 -44Z', cm(S(5), 'black', 34), { ao: 3, rim: 2, hi: 50 })
    + `<rect x="-25" y="-37" width="50" height="72" rx="3" style="fill:${cm(S(1), PAPER, 26)}"/><path d="M-16 -22L10 -22M-16 -10L18 -10M-16 2L4 2" style="fill:none;stroke:${S(1)};stroke-width:4;stroke-linecap:round"/>`,
  cup: () => `<ellipse cx="2" cy="32" rx="44" ry="8" style="fill:${INK};opacity:0.14;filter:blur(4px)"/>` + form('M-30 -20L30 -20L24 26Q0 34 -24 26Z', cm(S(8), PAPER, 40), { ao: 8, rim: 2, hi: 60, cx: 0.26 }) + tube('M29 -8Q46 -6 44 8Q42 20 26 18', cm(S(8), PAPER, 40), 5) + `<ellipse cx="0" cy="-20" rx="30" ry="8" style="fill:${cm(S(2), S(8), 46)};stroke:${cm(S(8), 'black', 58)};stroke-width:2"/>`
    + `<path d="M-8 -34Q-14 -44 -6 -52M8 -34Q2 -44 10 -52" style="fill:none;stroke:var(--sim-stroke);stroke-width:2.6;stroke-linecap:round;opacity:0.6"/>`,
  bag: () => `<ellipse cx="4" cy="44" rx="66" ry="9" style="fill:${INK};opacity:0.16;filter:blur(5px)"/>` + tube('M-24 -30Q-24 -56 0 -56Q24 -56 24 -30', cm(S(3), 'black', 52), 6) + form('M-58 -30L58 -30Q64 -30 64 -24L60 38Q60 44 54 44L-54 44Q-60 44 -60 38L-64 -24Q-64 -30 -58 -30Z', cm(S(3), PAPER, 66), { ao: 12, rim: 2.4, hi: 54, inner: `<path d="M-62 -6L62 -6" style="fill:none;stroke:${cm(S(3), 'black', 52)};stroke-width:3"/><path d="M-30 -30L-30 44M30 -30L30 44" style="fill:none;stroke:${cm(S(3), 'black', 58)};stroke-width:1.5;stroke-dasharray:5 4;opacity:0.6"/>` }),
};
const BEATS = [
  { head: 'During pregnancy', items: [['thali', 'Balanced food'], ['steth', 'Regular check-ups'], ['pillow', 'Rest, light exercise']] },
  { head: 'After the birth', items: [['cradle', 'Warm, gentle care'], ['card', 'Vaccines on time'], ['thali', 'Food, rest']] },
  { head: 'When a mother feels low', items: [['cup', 'Talk about it'], ['steth', 'Doctor or nurse'], ['phone', 'Call an ASHA worker']] },
  { head: 'ASHA workers', big: 'More than 10 lakh', items: [['bag', 'Maternal care'], ['card', 'Immunisation'], ['blanket', 'Safe deliveries']] },
];
function room(st) {
  const W = st.W, H = st.H, P = st.portrait, y = H * (P ? 0.27 : 0.4), wood = cm(cm(S(2), S(8), 38), PAPER, 58), wx = W * (P ? 0.58 : 0.66), ww = W * (P ? 0.34 : 0.26), wy = 12, wh = y - 26;
  const frameCol = cm(wood, 'black', 72), cur = cm(S(5), PAPER, 26);
  let s = `<defs><linearGradient id="cr-w" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" style="stop-color:${cm(S(2), PAPER, 13)}"/><stop offset="1" style="stop-color:${cm(S(8), PAPER, 20)}"/></linearGradient>`
    + `<linearGradient id="cr-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${cm(wood, PAPER, 82)}"/><stop offset="1" style="stop-color:${cm(wood, 'black', 80)}"/></linearGradient>`
    + `<linearGradient id="cr-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${cm(S(1), PAPER, 52)}"/><stop offset="1" style="stop-color:${cm(S(2), PAPER, 22)}"/></linearGradient>`
    + `<linearGradient id="cr-l" x1="1" y1="0" x2="0.2" y2="1"><stop offset="0" style="stop-color:${PAPER};stop-opacity:0.5"/><stop offset="1" style="stop-color:${PAPER};stop-opacity:0"/></linearGradient></defs>`
    + `<rect width="${W}" height="${H}" style="fill:url(#cr-w)"/>`;
  // the window: sky, a far branch, frame with depth, and a curtain drawn to one side
  s += `<rect x="${n(wx - 5)}" y="${n(wy - 5)}" width="${n(ww + 10)}" height="${n(wh + 10)}" rx="4" style="fill:${frameCol}"/><rect x="${n(wx)}" y="${n(wy)}" width="${n(ww)}" height="${n(wh)}" style="fill:url(#cr-s)"/>`
    + `<path d="M${n(wx + ww)} ${n(wy + wh * 0.3)}C${n(wx + ww * 0.8)} ${n(wy + wh * 0.42)} ${n(wx + ww * 0.6)} ${n(wy + wh * 0.3)} ${n(wx + ww * 0.42)} ${n(wy + wh * 0.46)}" style="fill:none;stroke:${cm(S(3), 'black', 50)};stroke-width:3;stroke-linecap:round;opacity:0.55"/>`
    + Array.from({ length: 11 }, (_, i) => `<ellipse cx="${n(wx + ww * (0.46 + i * 0.054))}" cy="${n(wy + wh * (0.36 + 0.09 * Math.sin(i * 2.1)))}" rx="10" ry="6" transform="rotate(${-20 + i * 19} ${n(wx + ww * (0.46 + i * 0.054))} ${n(wy + wh * 0.4)})" style="fill:${cm(S(3), PAPER, 62)};opacity:0.8"/>`).join('')
    + `<path d="M${n(wx + ww / 2)} ${n(wy)}L${n(wx + ww / 2)} ${n(wy + wh)}" style="fill:none;stroke:${frameCol};stroke-width:4"/><path d="M${n(wx)} ${n(wy + wh * 0.46)}L${n(wx + ww)} ${n(wy + wh * 0.46)}" style="fill:none;stroke:${frameCol};stroke-width:3"/>`
    + `<rect x="${n(wx - 9)}" y="${n(wy + wh + 3)}" width="${n(ww + 18)}" height="6" rx="2" style="fill:${cm(wood, PAPER, 80)};stroke:${frameCol};stroke-width:1.5"/>`;
  const cw = ww * 0.32, cd = `M${n(wx - 12)} ${n(wy - 8)}L${n(wx + cw)} ${n(wy - 8)}C${n(wx + cw * 0.5)} ${n(wy + wh * 0.4)} ${n(wx + cw * 0.3)} ${n(wy + wh * 0.8)} ${n(wx + 6)} ${n(wy + wh + 4)}L${n(wx - 12)} ${n(wy + wh + 4)}Z`;
  s += form(cd, cur, { ao: 7, aoOp: 0.3, rim: 1.4, hi: 74, lo: 82, inner: [0.22, 0.5, 0.78].map((q) => `<path d="M${n(wx - 12 + cw * q * 1.3)} ${n(wy - 8)}C${n(wx - 8 + cw * q)} ${n(wy + wh * 0.4)} ${n(wx - 10 + cw * q * 0.7)} ${n(wy + wh * 0.8)} ${n(wx - 8 + cw * q * 0.3)} ${n(wy + wh)}" style="fill:none;stroke:${cm(cur, 'black', 62)};stroke-width:2;opacity:0.5"/>`).join('') });
  s += `<path d="M${n(wx - 12)} ${n(wy - 8)}L${n(wx + ww + 14)} ${n(wy - 8)}" style="fill:none;stroke:${frameCol};stroke-width:4;stroke-linecap:round"/>`;
  // a table top in light perspective: planks, grain, a lit stretch from the window, a front edge
  const th = H - y, ey = H - 12;
  s += `<rect y="${n(y)}" width="${W}" height="${n(th)}" style="fill:url(#cr-t)"/>`;
  for (let i = 1; i < 6; i++) { const u = i / 6, x0 = W * (0.5 + (u - 0.5) * 0.74), x1 = W * (0.5 + (u - 0.5) * 1.36); s += `<path d="M${n(x0)} ${n(y)}L${n(x1)} ${n(ey)}" style="fill:none;stroke:${cm(wood, 'black', 56)};stroke-width:1.6;opacity:0.4"/>`; }
  for (let i = 0; i < 16; i++) { const u = (i + 0.5) / 16, x0 = W * (0.5 + (u - 0.5) * 0.9), x1 = W * (0.5 + (u - 0.5) * 1.2), q = y + th * (0.1 + 0.8 * ((i * 7 % 16) / 16)); s += `<path d="M${n(x0)} ${n(q)}Q${n((x0 + x1) / 2 + 3)} ${n(q + 16)} ${n(x1)} ${n(q + 34)}" style="fill:none;stroke:${cm(wood, 'black', 62)};stroke-width:1;opacity:0.22"/>`; }
  s += `<path d="M${n(wx - 8)} ${n(y)}L${n(wx + ww + 8)} ${n(y)}L${n(wx - W * 0.1)} ${n(ey)}L${n(wx - W * 0.42)} ${n(ey)}Z" style="fill:url(#cr-l);filter:blur(10px)"/>`;
  s += `<rect y="${n(y)}" width="${W}" height="2.5" style="fill:${PAPER};opacity:0.5"/><rect y="${n(ey)}" width="${W}" height="12" style="fill:${cm(wood, 'black', 56)}"/><rect y="${n(ey)}" width="${W}" height="2" style="fill:${PAPER};opacity:0.28"/>`;
  return s;
}

export class CareCircleScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 440;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 470;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static ARIA_LABEL = 'Things on a low table by a window, for care during pregnancy, after the birth, when a mother feels low, and the work of ASHA workers.';
  css() { return `${BODY_CSS}.svs { padding: 0; }`; }
  stageHeight(st) { return st.portrait ? 430 : 390; }
  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, b = BEATS[this.stepIndex];
    let s = tag(P ? W / 2 : 16, 30, b.head, { size: 19, display: true, anchor: P ? undefined : 'start' });
    if (b.big) s += P ? tag(W / 2, 74, b.big, { size: 20, display: true }) : tag(W * 0.46, 30, b.big, { size: 19, display: true });
    const k = P ? 0.98 : 1.46;
    const spots = P ? [[W * 0.26, 186], [W * 0.74, 186], [W * 0.5, 324]] : [[W * 0.18, H * 0.6], [W * 0.5, H * 0.66], [W * 0.82, H * 0.6]];
    b.items.forEach(([t, lab], i) => {
      const [x, y] = spots[i];
      s += `<g transform="translate(${n(x)} ${n(y)}) scale(${k})">${things[t](t === 'card' ? (this.stepIndex === 1 ? 3 : 5) : undefined)}</g>`;
      s += tag(x, P ? y + 70 : H - 34, lab, { size: P ? 14 : 15 });
    });
    return { svg: frame(st, 'cr', s, { back: room(st) }) };
  }
}
