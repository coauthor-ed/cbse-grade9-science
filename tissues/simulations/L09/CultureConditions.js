// CultureConditions - blk-l09-n01 (beats three-ways, results, reading, reasons). Steward's Table 3.6 as three flasks
// on a lab bench, exactly as the table: P light yes, air no, solid medium + nutrients; Q light yes, air yes, liquid
// medium + nutrients; R light no, air yes, liquid medium + nutrients. Light is a lamp (R sits under a dark hood); air is a
// bubbler tube (P is sealed with a stopper). Step 1: each flask shows its result in the table's words: P "reduced",
// Q "increased 20 per cent", R "reduced"; P and R are drawn the same, because the table does not rank them. Step 2:
// Q lit as the only set with all three; Light / Air / Liquid chips light the flasks that have each. Step 3: possible
// reasons, labelled as suggestions: a cell on a solid medium touches food on one side; in a stirred liquid, food and air
// reach every side. Cell sizes show up or down only, not amounts.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { tapMin, TAP_MIN_CSS } from '../shared/TapMin.js';
import { flowChoiceHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { PLANT_COLOR_MAP, artDefs } from '../shared/PlantArt.js';
import { cwDefs, T, mx } from '../shared/CellWorld.js';
import { BODY_CSS, frame, tag, txt, n, form } from '../shared/BodyArt.js';
import { tiles, bench, lightFall } from '../shared/Scapes.js';
import { flask, flaskBox, cell, callus, MEDIUM, AGAR } from '../shared/CultureArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const INK = T('strata-6'), W_ = T('elev-peak');
const SETS = [
  { id: 'P', light: true, air: false, liquid: false, res: 'reduced', up: false },
  { id: 'Q', light: true, air: true, liquid: true, res: 'increased 20 per cent', up: true },
  { id: 'R', light: false, air: true, liquid: true, res: 'reduced', up: false },
];
const LAMP = mx('gold', 'elev-peak', 40), AIR = mx('series-1', 'elev-peak', 40), AIR_D = mx('series-1', INK, 60), GOOD = T('good'), DOWN = mx('series-6', INK, 80);

function lamp(x, y, on) {
  let s = `<path d="M${n(x)} 0V${n(y - 22)}" style="fill:none;stroke:${INK};stroke-width:2;opacity:.6"/>`;
  s += `<path d="M${n(x - 30)} ${n(y)}Q${n(x - 26)} ${n(y - 26)} ${n(x)} ${n(y - 26)}Q${n(x + 26)} ${n(y - 26)} ${n(x + 30)} ${n(y)}Z" style="fill:${mx('strata-5', 'elev-peak', 60)};stroke:${INK};stroke-width:2"/>`;
  s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="14" ry="6" style="fill:${on ? LAMP : mx('strata-5', INK, 60)}"/>`;
  return s;
}
function bubbler(x, top, bot, seed) {
  let s = `<path d="M${n(x)} ${n(top)}V${n(bot)}" style="fill:none;stroke:${mx(AIR, INK, 50)};stroke-width:5;stroke-linecap:round"/><path d="M${n(x)} ${n(top)}V${n(bot)}" style="fill:none;stroke:${W_};stroke-width:2.4;stroke-linecap:round;opacity:.8"/>`;
  for (let i = 0; i < 6; i++) { const yy = bot - 10 - i * ((bot - top) * 0.11), dx = ((i + seed) % 3 - 1) * 5; s += `<circle cx="${n(x + dx + 8)}" cy="${n(yy)}" r="${n(3 + (i % 2) * 1.6)}" style="fill:${W_};stroke:${AIR_D};stroke-width:1.2;opacity:.85"/>`; }
  return s;
}
// a badge: icon + word; off = struck through and muted
function badge(x, y, kind, on, w) {
  const col = on ? INK : T('label-muted');
  let icon = '';
  if (kind === 'light') icon = `<circle cx="${n(x + 15)}" cy="${n(y)}" r="6" style="fill:${on ? LAMP : 'none'};stroke:${col};stroke-width:2"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = i * 0.785; return `<path d="M${n(x + 15 + Math.cos(a) * 8.5)} ${n(y + Math.sin(a) * 8.5)}l${n(Math.cos(a) * 3)} ${n(Math.sin(a) * 3)}" style="fill:none;stroke:${col};stroke-width:1.8;stroke-linecap:round"/>`; }).join('');
  else if (kind === 'air') icon = [[10, 4, 3.6], [17, -3, 4.6], [22, 5, 3]].map(([dx, dy, r]) => `<circle cx="${n(x + dx)}" cy="${n(y + dy)}" r="${r}" style="fill:${on ? AIR : 'none'};stroke:${col};stroke-width:1.6"/>`).join('');
  else icon = on ? `<path d="M${n(x + 6)} ${n(y - 6)}h18v9q-9 6 -18 0z" style="fill:${MEDIUM};stroke:${col};stroke-width:1.6"/><path d="M${n(x + 8)} ${n(y - 1)}q4 -3 7 0t7 0" style="fill:none;stroke:${col};stroke-width:1.4"/>` : `<path d="M${n(x + 6)} ${n(y + 7)}l4 -12h14l-4 12z" style="fill:${AGAR};stroke:${col};stroke-width:1.6"/>`;
  const word = kind === 'light' ? (on ? 'light' : 'no light') : kind === 'air' ? (on ? 'air' : 'no air') : (on ? 'liquid' : 'solid');
  let s = `<rect x="${n(x)}" y="${n(y - 15)}" width="${n(w)}" height="30" rx="9" style="fill:${on || kind === 'medium' ? T('bg-surface') : mx('bg-surface', 'strata-5', 80)};stroke:${on || kind === 'medium' ? T('stroke') : mx('stroke', 'bg-surface', 50)};stroke-width:2"/>` + icon;
  if (!on && kind !== 'medium') s += `<path d="M${n(x + 6)} ${n(y + 9)}L${n(x + 26)} ${n(y - 9)}" style="fill:none;stroke:${col};stroke-width:2.4;stroke-linecap:round"/>`;
  return s + txt(x + 32, y + 5, word, { size: 14, anchor: 'start', col });
}
const arrowUp = (x, y, up, col) => `<path d="M${n(x)} ${n(y + (up ? 12 : -12))}V${n(y + (up ? -12 : 12))}M${n(x - 8)} ${n(y + (up ? -4 : 4))}L${n(x)} ${n(y + (up ? -12 : 12))}L${n(x + 8)} ${n(y + (up ? -4 : 4))}" style="fill:none;stroke:${col};stroke-width:4;stroke-linecap:round;stroke-linejoin:round"/>`;

export class CultureConditions extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static WIDTH = 640;
  static HEIGHT = 514;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 574;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'Three flasks of carrot phloem cells, as in Table 3.6. Flask P: light, no air, solid medium with nutrients; the fresh weight of the cells is reduced. Flask Q: light, air, liquid medium with nutrients; the weight increased by 20 per cent. Flask R: no light, air, liquid medium with nutrients; the weight is reduced. P and R are drawn the same, since the table does not say which is lower. Only Q has light, air and a liquid medium together. Possible reasons, as suggestions: in a stirred liquid, food and air reach every side of a cell; on a solid medium only one side touches the food.';
  static CONTROLS = [];

  pick = 'all';

  async setup() {
    await super.setup(); tapMin(this);
    bindFlow(this.root, { action: (a, v) => { if (a === 'has' && this.stepIndex === 2) { this.pick = v; this.repaint(); } } });
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; } .svs-head { min-height: 50px; }' + BODY_CSS + TAP_MIN_CSS; }
  stageHeight(st) { return st.portrait ? 500 : 440; }
  enter() { this.pick = 'all'; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, fs = P ? 14 : 15;
    const by = H * (P ? 0.6 : 0.64);
    let s = tiles(W, by, { size: 72 }) + bench(W, by, H, { planks: 2 });
    let head = '';
    if (step < 3) {
      const fh = P ? 130 : 180, xs = [0.18, 0.5, 0.82].map((u) => W * u);
      const has = (t) => (this.pick === 'all' ? t.light && t.air && t.liquid : t[this.pick]);
      SETS.forEach((t, i) => {
        const x = xs[i], dim = step === 2 && !has(t);
        let g = '';
        // light from a lamp, or a dark hood over the flask
        if (t.light) g += `<path d="M${n(x - 12)} ${n(by - fh - 46)}L${n(x - fh * 0.5)} ${n(by)}L${n(x + fh * 0.5)} ${n(by)}L${n(x + 12)} ${n(by - fh - 46)}Z" style="fill:${LAMP};opacity:.28"/>` + lamp(x, by - fh - 40, true);
        const b = flaskBox(x, by + 6, fh, { level: 0.42 });
        // the cells: a small mass at the start; in step 1 bigger in Q, smaller (the same) in P and R
        const k = step >= 1 ? (t.up ? 1.28 : 0.8) : 1, R = (P ? 26 : 34) * k, ry = R * 0.62, my = t.liquid ? (b.top + b.bot) / 2 + 2 : b.top - ry * 0.78;
        // a cream callus lump: floating in the stirred liquid, or sitting on top of the firm jelly
        const lump = callus(x - (t.air ? fh * 0.04 : 0), my, R, ry, { seed: 4 + i });
        const inner = (t.liquid ? lump : '') + (t.air ? bubbler(x + fh * 0.2, by - fh + 10, by - 8, i) : '');
        g += flask(x, by + 6, fh, { level: 0.42, solid: !t.liquid, medium: t.liquid ? mx(MEDIUM, 'elev-peak', 70) : AGAR, stir: t.liquid, inner, plug: t.air, seed: 3 + i });
        if (!t.liquid) g += lump;
        if (!t.air) g += `<path d="M${n(x - fh * 0.13)} ${n(by - fh - 6)}L${n(x + fh * 0.13)} ${n(by - fh - 6)}L${n(x + fh * 0.11)} ${n(by - fh + 16)}L${n(x - fh * 0.11)} ${n(by - fh + 16)}Z" style="fill:${mx('series-6', 'strata-5', 40)};stroke:${INK};stroke-width:2"/>`;
        if (!t.light) {
          // a dark cloth over the flask: a soft peak, folds falling to a wavy hem, a shadow on the bench
          const L = x - fh * 0.52, Rr = x + fh * 0.52, top = by - fh - 40, CL = mx('strata-6', 'sea-deep', 70);
          let hem = '';
          for (let j = 1; j <= 6; j++) { const u = j / 6, hx = Rr - (Rr - L) * u; hem += `Q${n(hx + (Rr - L) / 12)} ${n(by + (j % 2 ? 9 : 1))} ${n(hx)} ${n(by + 3)}`; }
          g += `<ellipse cx="${n(x + 8)}" cy="${n(by + 6)}" rx="${n(fh * 0.62)}" ry="9" style="fill:${INK};opacity:.32;filter:url(#cw-blur3)"/>`;
          const cd = `M${n(x - 6)} ${n(top)}Q${n(x)} ${n(top - 8)} ${n(x + 6)} ${n(top)}C${n(x + fh * 0.36)} ${n(top + 16)} ${n(Rr - 6)} ${n(by - fh * 0.5)} ${n(Rr)} ${n(by + 3)}${hem}C${n(L + 6)} ${n(by - fh * 0.5)} ${n(x - fh * 0.36)} ${n(top + 16)} ${n(x - 6)} ${n(top)}Z`;
          g += form(cd, CL, { ao: 14, rim: 2, rimCol: INK, hi: 30, lo: 50 });
          // fold lines: dark valleys with a lit ridge beside each
          for (const [u, lean] of [[-0.3, -0.12], [-0.08, -0.04], [0.14, 0.05], [0.34, 0.12]]) {
            const fx0 = x + u * fh * 0.22, fx1 = x + u * fh * 1.0 + lean * fh;
            g += `<path d="M${n(fx0)} ${n(top + 10)}Q${n((fx0 + fx1) / 2 + lean * 20)} ${n(by - fh * 0.5)} ${n(fx1)} ${n(by)}" style="fill:none;stroke:${mx(CL, INK, 50)};stroke-width:3.2;stroke-linecap:round;opacity:.7"/><path d="M${n(fx0 + 4)} ${n(top + 12)}Q${n((fx0 + fx1) / 2 + lean * 20 + 5)} ${n(by - fh * 0.5)} ${n(fx1 + 6)} ${n(by - 2)}" style="fill:none;stroke:${W_};stroke-width:1.6;stroke-linecap:round;opacity:.22"/>`;
          }
        }
        // its letter and its three conditions
        g += txt(x - fh * 0.3, by - fh * 0.66, t.id, { size: 28, display: true, col: t.light ? INK : W_ });
        const bw = P ? 98 : 104, rowx = P ? x - bw / 2 : x - bw / 2;
        ['light', 'air', 'medium'].forEach((kd, j) => { g += badge(rowx, by + (P ? 72 : 50) + j * 32, kd, kd === 'medium' ? t.liquid : t[kd], bw); });
        if (step >= 1) {
          const ry = P ? by - fh * 0.55 : by - fh * 0.62, col = t.up ? GOOD : DOWN;
          g += `<g class="ba-pop">${P ? arrowUp(x - (t.up ? 60 : 50), by + 18, t.up, col) : arrowUp(x + fh * 0.3 + 10, ry, t.up, col)}</g>`;
          const tw = t.up ? (P ? 'increased' : 'increased 20 per cent') : 'reduced';
          g += tag(x, by + 18, tw, { size: P ? 14 : 15, display: true, rim: col });
          if (P && t.up) g += txt(x, by + 50, '20 per cent', { size: 14, weight: 800 });
        }
        s += `<g style="opacity:${dim ? 0.32 : 1}">${g}</g>`;
      });
      if (step === 0) s += txt(W / 2, P ? H - 6 : H - 6, 'every medium has nutrients', { size: fs, display: true });
      if (step >= 1 && !P) s += txt(W / 2, H - 8, 'fresh weight of the cells (sizes show up or down only)', { size: 16 });
      if (step === 2) {
        head = flowChoiceHtml({ action: 'has', label: 'Which flasks have', value: this.pick, options: [{ value: 'light', label: 'Light' }, { value: 'air', label: 'Air' }, { value: 'liquid', label: 'Liquid' }, { value: 'all', label: 'All three' }] });
      }
    } else {
      // possible reasons: two lenses, solid vs stirred liquid
      const r = P ? 82 : 124, ys = P ? [H * 0.29, H * 0.76] : [H * 0.5, H * 0.5], xs = P ? [W * 0.5, W * 0.5] : [W * 0.27, W * 0.73];
      s = lightFall(W, H, W * 0.2, { a: 0.2 }) + tiles(W, H, { size: 72 });
      [0, 1].forEach((i) => {
        const cx = xs[i], cy = ys[i], id = `cc-l${i}`;
        let body = `<rect x="${n(cx - r)}" y="${n(cy - r)}" width="${n(r * 2)}" height="${n(r * 2)}" style="fill:${MEDIUM}"/>`;
        const cr = r * 0.26;
        if (i === 0) {
          body = `<rect x="${n(cx - r)}" y="${n(cy - r)}" width="${n(r * 2)}" height="${n(r * 2)}" style="fill:${mx('gold', 'elev-peak', 8)}"/><rect x="${n(cx - r)}" y="${n(cy + cr * 0.9)}" width="${n(r * 2)}" height="${n(r)}" style="fill:${AGAR}"/><path d="M${n(cx - r)} ${n(cy + cr * 0.9)}H${n(cx + r)}" style="fill:none;stroke:${W_};stroke-width:2.4"/>`;
          body += cell(cx, cy, cr, { seed: 5 });
          for (const dx of [-0.5, 0, 0.5]) body += arrowUp(cx + dx * cr * 1.4, cy + cr * 1.6, true, mx('gold', INK, 64));
        } else {
          body += cell(cx, cy, cr, { seed: 5 });
          for (let k = 0; k < 8; k++) { const a = k * 0.785, x0 = cx + Math.cos(a) * cr * 2.2, y0 = cy + Math.sin(a) * cr * 2.2, x1 = cx + Math.cos(a) * cr * 1.3, y1 = cy + Math.sin(a) * cr * 1.3; body += `<path d="M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}M${n(x1 + Math.cos(a + 0.5) * 7)} ${n(y1 + Math.sin(a + 0.5) * 7)}L${n(x1)} ${n(y1)}L${n(x1 + Math.cos(a - 0.5) * 7)} ${n(y1 + Math.sin(a - 0.5) * 7)}" style="fill:none;stroke:${k % 2 ? AIR_D : mx('gold', INK, 64)};stroke-width:3;stroke-linecap:round"/>`; }
          for (const k of [0, 1]) body += `<path d="M${n(cx - r)} ${n(cy + r * (0.62 + k * 0.16))}q${n(r * 0.5)} ${n(-r * 0.14)} ${n(r)} 0t${n(r)} 0" style="fill:none;stroke:${mx(MEDIUM, INK, 50)};stroke-width:2;opacity:.45"/>`;
        }
        s += `<circle cx="${n(cx + 3)}" cy="${n(cy + 6)}" r="${n(r + 6)}" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r + 6)}" style="fill:${mx('strata-5', 'strata-6', 50)}"/><clipPath id="${id}"><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/></clipPath><g clip-path="url(#${id})">${body}</g>`;
        s += tag(cx, cy - r - (P ? 12 : 20), i === 0 ? 'P: on a solid medium' : 'Q: in a stirred liquid', { size: fs + 1, display: true });
        s += txt(cx, cy + r + (P ? 24 : 30), i === 0 ? 'food reaches one side' : 'food and air on every side', { size: fs, display: true });
      });
      s += tag(P ? W / 2 : W / 2, P ? 18 : 22, 'possible reasons (suggestions)', { size: fs, rim: T('warning') });
      if (!P) s += txt(W / 2, H - 14, 'air: oxygen for respiration. Light may help in other ways.', { size: fs });
    }
    return { svg: frame(st, 'cc', `<defs>${artDefs()}${cwDefs()}</defs>${s}`, { back: '' }), head };
  }
}
