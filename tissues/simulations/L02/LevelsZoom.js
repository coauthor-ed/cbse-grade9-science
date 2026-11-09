// LevelsZoom - blk-l02-s8. One step of the hierarchy per beat, each a zoom out from the one before.
//   cell      one smooth muscle cell from the stomach wall
//   tissue    many such cells side by side in a sheet: muscle tissue; the first cell still ringed
//   organ     the stomach, a window in its front wall; chips light muscle, epithelial lining, nervous tissue, blood
//   system    a clinical front view: mouth, food pipe, stomach and intestines lit as one system; the body outline quiet
//   organism  the whole person (plain clinical figure, no face); beside it the plant's steps: cells, xylem and
//             phloem, a leaf, the whole plant
//   amoeba    one amoeba: "cell" and "organism" both point at the same cell; tissue, organ and organ system: none
// The ladder in the title row lights the beat's level.
import { SvgScene, chip } from 'simulations/base/kit/SimSvg.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { PLANT_COLOR_MAP } from '../shared/PlantArt.js';
import { cwFrame, depthField, plantCell, nucleus, mitochondrion, T, mx, n1 } from '../shared/CellWorld.js';
import { form, tube, tapered, BODY } from '../shared/BodyArt.js';
import { stomachJ, STOMACH_AT } from '../shared/StomachArt.js';
import { taDefs, amoeba, muscleSheet, xylemTube, phloemTube, leafArt, MUSC_D, LINE } from '../shared/TissueArt.js';

const one = (idx) => [{ idx, dwellMs: null }];
const W_ = T('elev-peak'), INK = T('strata-6');
const LEVELS = ['cell', 'tissue', 'organ', 'organ system', 'organism'];
const ORGAN_CHIPS = [
  { id: 'muscle', label: 'muscle', targets: ['muscle'], tone: 6 },
  { id: 'lining', label: 'epithelial lining', targets: ['lining'], tone: 8 },
  { id: 'nerve', label: 'nervous tissue', targets: ['nerve'], tone: 2 },
  { id: 'blood', label: 'blood', targets: ['blood'], tone: 4 },
];
const CSS = `.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }
.lz-ladder { display: flex; flex-wrap: wrap; gap: 4px 6px; justify-content: center; align-items: center; }
.lz-ladder .sv-chip { font-size: var(--sim-text-sm); }
.lz-ladder i { font-style: normal; font-weight: 800; color: var(--sim-label-muted); }
.lz-ladder .lz-none { opacity: .45; text-decoration: line-through; }
svg .lz-zoom { transform-box: view-box; transform-origin: 50% 50%; animation: lz-out .8s cubic-bezier(.2,.7,.3,1) both; }
@keyframes lz-out { from { transform: scale(1.7); opacity: .2; } }
@media (prefers-reduced-motion: reduce) { svg .lz-zoom { animation: none; } }`;

const arrowR = (x0, y, x1, col = INK) => `<path d="M${n1(x0)} ${n1(y)}H${n1(x1 - 8)}" style="fill:none;stroke:${col};stroke-width:3.4;stroke-linecap:round"/><path d="M${n1(x1)} ${n1(y)}l-11 -7v14z" style="fill:${col}"/>`;
const arrowD = (x, y0, y1, col = INK) => `<path d="M${n1(x)} ${n1(y0)}V${n1(y1 - 8)}" style="fill:none;stroke:${col};stroke-width:3.4;stroke-linecap:round"/><path d="M${n1(x)} ${n1(y1)}l-7 -11h14z" style="fill:${col}"/>`;

/** A plain clinical figure, front view, no face. (cx, top) is the crown; h the height. o.organs: markup drawn inside. */
function person(cx, top, h, o = {}) {
  const k = h / 400, X = (v) => cx + v * k, Y = (v) => top + v * k, skin = BODY.skin;
  const head = `M${X(0)} ${Y(0)}C${X(-30)} ${Y(0)} ${X(-36)} ${Y(30)} ${X(-34)} ${Y(46)}C${X(-32)} ${Y(66)} ${X(-18)} ${Y(80)} ${X(0)} ${Y(80)}C${X(18)} ${Y(80)} ${X(32)} ${Y(66)} ${X(34)} ${Y(46)}C${X(36)} ${Y(30)} ${X(30)} ${Y(0)} ${X(0)} ${Y(0)}Z`;
  const body = `M${X(-12)} ${Y(76)}V${Y(92)}C${X(-40)} ${Y(96)} ${X(-62)} ${Y(100)} ${X(-66)} ${Y(122)}C${X(-70)} ${Y(160)} ${X(-58)} ${Y(190)} ${X(-52)} ${Y(214)}C${X(-50)} ${Y(232)} ${X(-56)} ${Y(244)} ${X(-50)} ${Y(258)}H${X(50)}C${X(56)} ${Y(244)} ${X(50)} ${Y(232)} ${X(52)} ${Y(214)}C${X(58)} ${Y(190)} ${X(70)} ${Y(160)} ${X(66)} ${Y(122)}C${X(62)} ${Y(100)} ${X(40)} ${Y(96)} ${X(12)} ${Y(92)}V${Y(76)}Z`;
  const armL = tapered([[X(-60), Y(108)], [X(-74), Y(170)], [X(-82), Y(232)], [X(-86), Y(268)]], [15 * k, 13 * k, 10 * k, 9 * k]);
  const armR = tapered([[X(60), Y(108)], [X(74), Y(170)], [X(82), Y(232)], [X(86), Y(268)]], [15 * k, 13 * k, 10 * k, 9 * k]);
  const legL = tapered([[X(-26), Y(250)], [X(-30), Y(320)], [X(-30), Y(392)], [X(-34), Y(400)]], [24 * k, 17 * k, 11 * k, 10 * k]);
  const legR = tapered([[X(26), Y(250)], [X(30), Y(320)], [X(30), Y(392)], [X(34), Y(400)]], [24 * k, 17 * k, 11 * k, 10 * k]);
  let s = `<ellipse cx="${n1(cx + 8)}" cy="${n1(Y(402))}" rx="${n1(70 * k)}" ry="${n1(9 * k)}" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/>`;
  s += form(legL, skin, { rim: 2 }) + form(legR, skin, { rim: 2 }) + form(armL, skin, { rim: 2 }) + form(armR, skin, { rim: 2 }) + form(body, skin, { rim: 2, ao: 16 }) + form(head, skin, { rim: 2, ao: 12 });
  return s + (o.organs ?? '');
}
/** Mouth, food pipe, stomach and intestines in a front view; (cx, top) the crown, h the figure height. */
function gut(cx, top, h, o = {}) {
  const k = h / 400, X = (v) => cx + v * k, Y = (v) => top + v * k, a = o.a ?? 1, w = Math.max(3, 9 * k);
  let s = `<ellipse cx="${X(0)}" cy="${Y(60)}" rx="${n1(14 * k)}" ry="${n1(6 * k)}" style="fill:${mx('series-6', INK, 60)};stroke:${MUSC_D};stroke-width:2"/>`;
  s += tube(`M${X(0)} ${Y(64)}C${X(2)} ${Y(86)} ${X(-2)} ${Y(100)} ${X(0)} ${Y(116)}`, LINE, w);
  { const sk = 0.21 * k; s += stomachJ(X(0) - 100 * sk, Y(112) + 78 * sk, sk, { window: false }); }
  const si = `M${X(-24)} ${Y(222)}C${X(-30)} ${Y(232)} ${X(26)} ${Y(226)} ${X(24)} ${Y(236)}S${X(-30)} ${Y(240)} ${X(-24)} ${Y(248)}S${X(26)} ${Y(250)} ${X(20)} ${Y(258)}`;
  const li = `M${X(-38)} ${Y(266)}V${Y(220)}Q${X(-38)} ${Y(210)} ${X(-28)} ${Y(210)}H${X(34)}Q${X(44)} ${Y(210)} ${X(44)} ${Y(220)}V${Y(266)}`;
  s += tube(li, mx('series-8', 'series-2', 30), w * 1.5) + tube(si, mx('series-4', 'series-8', 50), w * 0.9);
  return `<g opacity="${a}">${s}</g>`;
}
function plantThumb(cx, gy, h) {
  const k = h / 200, X = (v) => cx + v * k, Y = (v) => gy - v * k;
  let s = `<path d="M${X(-50)} ${gy}H${X(50)}" style="fill:none;stroke:${mx('strata-3', INK, 50)};stroke-width:6;stroke-linecap:round"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="M${X(0)} ${gy}q${n1((i - 2) * 6 * k)} ${n1(14 * k)} ${n1((i - 2) * 12 * k)} ${n1((24 + (i % 2) * 6) * k)}" style="fill:none;stroke:${mx('strata-1', W_, 40)};stroke-width:2;stroke-linecap:round"/>`;
  s += tube(`M${X(0)} ${gy}C${X(-4)} ${Y(80)} ${X(4)} ${Y(140)} ${X(0)} ${Y(190)}`, mx('elev-low', 'chloro', 40), Math.max(3, 7 * k));
  s += leafArt(X(0), Y(150), 70 * k, -28, { seed: 2 }) + leafArt(X(0), Y(110), 64 * k, 206, { seed: 3 }) + leafArt(X(0), Y(70), 56 * k, -14, { seed: 4 }) + leafArt(X(0), Y(186), 40 * k, -84, { seed: 5 });
  return s;
}

export class LevelsZoom extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4), one(5)];
  static WIDTH = 640;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 620;
  static MIN_SCALE = 0.85;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static ARIA_LABEL = 'From one cell to a whole organism: a muscle cell, muscle tissue, the stomach with its tissues, the digestive system, a whole person beside the steps of a plant, and an amoeba whose one cell is the whole organism.';
  static CONTROLS = [];

  tl = tapLight({ label: 'Tissues in the stomach', chips: ORGAN_CHIPS, onChange: () => this.repaint() });

  async setup() { this._zoom = false; await super.setup(); this.tl.mount(this.root, this); this.enter(this.stepIndex ?? 0); this.repaint(); }
  destroy() { this.tl.destroy(); super.destroy(); }
  enter(step) { this._zoom = step > 0 && step < 5; this.tl.set({ chips: step === 2 ? ORGAN_CHIPS : [], lit: null, disabled: step !== 2 }); }
  stageHeight(st) { return st.portrait ? 420 : 380; }
  css() { return CSS; }

  _ladder(step) {
    const lv = step === 5 ? [0, 4] : [Math.min(step, 4)];
    return `<div class="lz-ladder">${LEVELS.map((l, i) => chip(l, 0, 0, { tone: lv.includes(i) ? 'accent' : 'plain', static: true, cls: step === 5 && !lv.includes(i) ? 'lz-none' : '' })).join('<i>&gt;</i>')}</div>`;
  }

  paint(st) {
    const step = this.stepIndex, W = st.W, H = st.H, P = st.portrait;
    let s = '', over = '';
    if (step === 0) {
      s += depthField(W, H, { tone: 'rose', seed: 3 });
      const len = P ? W * 0.86 : W * 0.72;
      const cy = H * 0.48, L = len / 2, Hh = len * 0.1, cx = W / 2;
      const d = `M${-L} 0C${n1(-L * 0.5)} ${n1(-Hh * 1.05)} ${n1(L * 0.5)} ${n1(-Hh * 1.05)} ${L} 0C${n1(L * 0.5)} ${n1(Hh * 1.05)} ${n1(-L * 0.5)} ${n1(Hh * 1.05)} ${-L} 0Z`;
      let fib = '', mito = '';
      for (let i = -3; i <= 3; i++) fib += `M${n1(-L * (0.86 - Math.abs(i) * 0.1))} ${n1(i * Hh * 0.2)}Q0 ${n1(i * Hh * 0.3)} ${n1(L * (0.86 - Math.abs(i) * 0.1))} ${n1(i * Hh * 0.2)}`;
      for (const [u, v, r] of [[-0.55, -0.25, 6], [-0.32, 0.38, -4], [0.36, -0.32, 3], [0.6, 0.18, -6], [-0.72, 0.08, 2]]) mito += mitochondrion(u * L, v * Hh, len / 1400, { rot: r, seed: 3 + r });
      s += `<g transform="translate(${n1(cx)} ${n1(cy)}) rotate(-8)"><path d="${d}" transform="translate(6 12)" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/><path d="${d}" style="fill:url(#ta-musc) ${MUSC_D}"/>`
        + `<clipPath id="lz-cell"><path d="${d}"/></clipPath><g clip-path="url(#lz-cell)"><rect x="${-L}" y="${n1(-Hh * 1.2)}" width="${len}" height="${n1(Hh * 2.4)}" style="fill:${INK};opacity:.22;filter:url(#cw-grain)"/><path d="${fib}" style="fill:none;stroke:${MUSC_D};stroke-width:1.6;opacity:.45"/>${mito}<path d="${d}" style="fill:none;stroke:${MUSC_D};stroke-width:14;opacity:.35;filter:url(#cw-blur3)"/></g>`
        + `<g transform="scale(1.9 .52)">${nucleus(0, 0, Hh * 0.72, { pores: false })}</g>`
        + `<path d="${d}" style="fill:none;stroke:${MUSC_D};stroke-width:2.6"/><path d="M${n1(-L * 0.6)} ${n1(-Hh * 0.62)}Q0 ${n1(-Hh * 1.02)} ${n1(L * 0.55)} ${n1(-Hh * 0.66)}" style="fill:none;stroke:${W_};stroke-width:4;opacity:.5;stroke-linecap:round"/></g>`;
      s += `<path d="M${n1(cx + 6)} ${n1(cy - len * 0.13 - 12)}L${n1(cx + 4)} ${n1(cy - 8)}" style="fill:none;stroke:${INK};stroke-width:2.4"/><circle cx="${n1(cx + 4)}" cy="${n1(cy - 8)}" r="4" style="fill:${INK}"/>`;
      over += chip('one muscle cell', W / 2, H - 30, { tone: 6 }) + chip('nucleus', W / 2 + 6, cy - len * 0.13 - 24, { tone: 'plain' });
    } else if (step === 1) {
      s += depthField(W, H, { tone: 'rose', seed: 5 });
      const x0 = 16, y0 = 16, w = W - 32, h = H - 72;
      s += `<rect x="${x0 + 4}" y="${y0 + 8}" width="${w}" height="${h}" rx="18" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/>` + muscleSheet(x0, y0, w, h, { seed: 4, len: P ? 104 : 120, cw: P ? 18 : 20, rx: 18 });
      s += `<ellipse cx="${W / 2}" cy="${n1(y0 + h * 0.5)}" rx="${P ? 70 : 82}" ry="${P ? 26 : 28}" style="fill:none;stroke:${W_};stroke-width:4;stroke-dasharray:8 6"/>`;
      over += chip('one cell', W / 2, y0 + h * 0.5 - (P ? 44 : 46), { tone: 'plain' }) + chip('muscle tissue: many similar cells', W / 2, H - 28, { tone: 6 });
    } else if (step === 2) {
      s += `<defs><radialGradient id="lz-b" cx=".4" cy=".35" r=".8"><stop offset="0" style="stop-color:${mx('series-4', W_, 12)}"/><stop offset="1" style="stop-color:${mx('series-5', W_, 26)}"/></radialGradient></defs><rect width="${W}" height="${H}" style="fill:url(#lz-b)"/>`;
      const k = Math.min((W - 30) / 370, (H - 64) / 344), sx = W / 2 - 178 * k + (P ? 0 : 20), sy = 8 + 82 * k;
      const tl = this.tl, any = tl.any();
      s += stomachJ(sx, sy, k, { part: (n) => (!any || tl.has(n) ? 1 : 0.2), lit: (n) => tl.has(n) });
      const at = STOMACH_AT, X = (v) => sx + v * k, Y = (v) => sy + v * k;
      const c = tl.chip();
      if (c) { const [ax, ay] = at[c.id]; over += chip(c.label, Math.max(80, Math.min(W - 80, X(ax))), Y(ay), { tone: c.tone }); }
      over += chip('the stomach: one organ', W / 2, H - 22, { tone: 'plain' });
      const fx = X(at.pipe[0]) - (P ? 50 : 66), fy = Y(at.pipe[1]) + 6;
      s += `<path d="M${n1(fx + 44)} ${n1(fy)}L${n1(X(at.pipe[0]) + 2)} ${n1(Y(at.pipe[1]) + 4)}" style="fill:none;stroke:${INK};stroke-width:2"/>`;
      over += chip('food pipe', Math.max(54, fx), fy, { tone: 'plain' });
    } else if (step === 3) {
      s += `<rect width="${W}" height="${H}" style="fill:${mx('series-1', W_, 12)}"/>`;
      const h = P ? 560 : 520, top = P ? 6 : -34, cx = W / 2;
      s += `<g opacity=".55">${person(cx, top, h)}</g>` + gut(cx, top, h);
      const k = h / 400, X = (v) => cx + v * k, Y = (v) => top + v * k;
      const cl = (v) => Math.max(66, Math.min(W - 66, v));
      const lab = [['mouth', -90, 52, 0, 60], ['food pipe', -90, 112, 2, 112], ['stomach', 100, 150, 30, 168], ['intestines', -100, 236, -24, 240]];
      for (const [t, lx, ly, ox, oy] of lab) { const x0 = cl(X(lx)), x1 = X(ox); s += `<path d="M${n1(x0 + (lx < 0 ? 40 : -40))} ${n1(Y(ly))}L${n1(x1)} ${n1(Y(oy))}" style="fill:none;stroke:${INK};stroke-width:2.4"/><circle cx="${n1(x1)}" cy="${n1(Y(oy))}" r="4" style="fill:${INK}"/>`; over += chip(t, x0, Y(ly), { tone: 'plain' }); }
      over += chip('the digestive system', P ? W / 2 : W - 120, P ? H - 22 : 26, { tone: 8 });
    } else if (step === 4) {
      s += `<defs><linearGradient id="lz-o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sky-day', W_, 22)}"/><stop offset="1" style="stop-color:${mx('elev-low', W_, 24)}"/></linearGradient></defs><rect width="${W}" height="${H}" style="fill:url(#lz-o)"/>`;
      const ph = P ? 300 : 320, pcx = P ? W * 0.24 : W * 0.2, ptop = P ? 34 : 24;
      s += person(pcx, ptop, ph, { organs: `<g opacity=".7">${gut(pcx, ptop, ph)}</g>` });
      over += chip('a person', pcx, ptop + ph + 18, { tone: 'plain' });
      // the plant's steps, a column of four panels on the right
      const px0 = P ? W * 0.5 : W * 0.44, pw = W - px0 - 12, cols = P ? 1 : 4, rows = P ? 4 : 1;
      const cw2 = P ? pw : (pw - 3 * 10) / 4, ch = P ? (H - 30 - 3 * 8) / 4 : H * 0.62, py0 = P ? 10 : H * 0.12;
      const names = ['cells', 'xylem, phloem', 'a leaf', 'the plant'];
      for (let i = 0; i < 4; i++) {
        const bx = px0 + (cols > 1 ? i * (cw2 + 10) : 0), by = py0 + (rows > 1 ? i * (ch + 8) : 0), cx = bx + cw2 / 2, cy = by + ch / 2;
        s += `<rect x="${n1(bx + 3)}" y="${n1(by + 5)}" width="${n1(cw2)}" height="${n1(ch)}" rx="14" style="fill:${INK};opacity:.18;filter:url(#cw-blur3)"/><rect x="${n1(bx)}" y="${n1(by)}" width="${n1(cw2)}" height="${n1(ch)}" rx="14" style="fill:${mx('elev-low', W_, 16)};stroke:${mx('elev-low', INK, 50)};stroke-width:2"/>`;
        const m = Math.min(cw2, ch);
        if (i === 0) s += plantCell(cx, cy - (P ? 4 : 10), m * 0.62, m * 0.8, { seed: 3 });
        if (i === 1) s += `<clipPath id="lz-c1"><rect x="${n1(bx + 4)}" y="${n1(by + 4)}" width="${n1(cw2 - 8)}" height="${n1(ch - 30)}" rx="10"/></clipPath><g clip-path="url(#lz-c1)">${xylemTube(cx - m * 0.18, by - 4, by + ch, m * 0.24, {})}${phloemTube(cx + m * 0.14, by - 8, by + ch, m * 0.2, { seg: m * 0.4 })}</g>`;
        if (i === 2) s += leafArt(cx - m * 0.4, cy - (P ? 4 : 10), m * 0.84, P ? 0 : -60, { seed: 8, wide: 0.26 });
        if (i === 3) s += plantThumb(cx, by + ch - 26, ch - 40);
        over += chip(names[i], cx, by + ch - 14, { tone: 'plain', cls: 'sv-chip--sm' });
        if (i < 3) s += P ? arrowD(cx + cw2 * 0.4, by + ch - 6, by + ch + 10) : arrowR(bx + cw2 - 4, by + ch * 0.12, bx + cw2 + 12);
      }
    } else {
      s += depthField(W, H, { tone: 'blue', seed: 6 });
      const r = P ? 92 : 110, x = W * (P ? 0.5 : 0.5), y = H * 0.5;
      s += amoeba(x, y, r, { seed: 7 });
      s += `<path d="M${n1(x - r * 1.9)} ${n1(y - r * 1.2)}L${n1(x - r * 0.7)} ${n1(y - r * 0.5)}M${n1(x + r * 1.9)} ${n1(y - r * 1.2)}L${n1(x + r * 0.7)} ${n1(y - r * 0.5)}" style="fill:none;stroke:${INK};stroke-width:3;stroke-linecap:round"/><circle cx="${n1(x - r * 0.7)}" cy="${n1(y - r * 0.5)}" r="5" style="fill:${INK}"/><circle cx="${n1(x + r * 0.7)}" cy="${n1(y - r * 0.5)}" r="5" style="fill:${INK}"/>`;
      over += chip('cell', Math.max(44, x - r * 1.9), y - r * 1.2 - 4, { tone: 'accent' }) + chip('organism', Math.min(W - 60, x + r * 1.9), y - r * 1.2 - 4, { tone: 'accent' });
      over += chip('no tissues, organs or organ systems', W / 2, H - 26, { tone: 'plain' });
    }
    const zoom = this._zoom;
    this._zoom = false;
    return { svg: cwFrame(st, 'lz', `<defs>${taDefs()}</defs><g${zoom ? ' class="lz-zoom"' : ''}>${s}</g>`), over, head: this._ladder(step) };
  }
}
