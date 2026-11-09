// CycleClockScene - the monthly cycle: a day track above the uterus, the lining thick or thin by the day.
// Mounts told apart by beat count. 1 or MAX = predict setup (a 28-day track only, nothing about 35). 5 = the cycle of
// 28 days, phase by phase, then the years it runs. 4 = the answer: two tracks lined up at the NEXT period, so the last
// 14 days match and the extra days fall in the first half; the three lengths (controls .cc-len, data-c 21, 28, 35); all three
// together; pregnancy, where the lining stays. Rule in the model: egg day = cycle length - 14, rough. Days are rough.
import { SvgScene, mountEl } from 'simulations/base/kit/SimSvg.js';
import { femaleSystemSvg, embryoSvg, tubePt, BODY_CSS, travel, pop, eggSvg, frame, tag, txt, n, BODY, INK, MUTED, PAPER, panel } from '../shared/BodyArt.js';

const one = (i) => [{ idx: i, dwellMs: null }];
const PH = { period: BODY.lining, rebuild: 'color-mix(in oklab, var(--sim-series-4) 45%, var(--sim-bg-surface))', thick: 'color-mix(in oklab, var(--sim-series-5) 55%, var(--sim-bg-surface))' };
const eggDay = (C) => C - 14;
const LENS = [21, 28, 35];
/** Lining 0..1 on day d of a cycle of C days. */
const liningAt = (d, C) => { const ov = eggDay(C); return d <= 5 ? 0.45 - (d / 5) * 0.4 : d <= ov ? 0.1 + ((d - 5) / (ov - 5 || 1)) * 0.45 : 0.55 + ((d - ov) / 14) * 0.45; };
// beat of the first mount: day shown, which phase is lit
const DAY = { 1: [3, 'period', 'Days 1 to 5: period'], 2: [10, 'rebuild', 'Days 6 to 14: lining rebuilds'], 3: [14, 'egg', 'Day 14: ovulation'], 4: [24, 'thick', 'Days 15 to 28: thicker'] };

function track(x, y, w, C, o = {}) {
  // day d spans x + (d - 1) * u; right edge = day C ends
  const u = o.u ?? w / C, ov = eggDay(C), h = o.h ?? 30, x0 = o.right != null ? o.right - C * u : x, X = (d) => x0 + (d - 1) * u;
  const dim = (k) => (o.lit && o.lit !== k ? 0.3 : 1);
  const seg = (a, b, col, k) => `<rect x="${n(X(a))}" y="${y}" width="${n((b - a + 1) * u)}" height="${h}" style="fill:${col};opacity:${dim(k)}"/>`;
  const id = `tk${Math.round(y)}${C}`;
  let s = `<defs><clipPath id="${id}"><rect x="${n(x0)}" y="${y}" width="${n(C * u)}" height="${h}" rx="${h / 2}"/></clipPath></defs><g clip-path="url(#${id})">`;
  s += seg(1, 5, PH.period, 'period') + seg(6, ov, PH.rebuild, 'rebuild') + seg(ov + 1, C, PH.thick, 'thick') + '</g>';
  s += `<rect x="${n(x0 + 8)}" y="${n(y + 3)}" width="${n(C * u - 16)}" height="${n(h * 0.26)}" rx="${n(h * 0.13)}" style="fill:var(--sim-bg-surface);opacity:0.4"/><rect x="${n(x0)}" y="${y}" width="${n(C * u)}" height="${h}" rx="${h / 2}" style="fill:none;stroke:color-mix(in oklab, var(--sim-stroke) 66%, var(--sim-label));stroke-width:2"/>`;
  if (!o.noEgg) {
    const ex = X(ov) + u / 2;
    s += `<g style="opacity:${dim('egg')}">${eggSvg(ex, y + h / 2, h * 0.42, {})}</g>`;
    if (o.eggLabel) s += txt(ex - 10, y + h + 20, `day ${ov}`, { size: 16, display: true, anchor: 'end' });
  }
  if (o.mark) { const mx = X(o.mark) + u / 2; s += `<path d="M${n(mx)} ${y - 8}L${n(mx)} ${y + h + 8}" style="fill:none;stroke:${INK};stroke-width:4;stroke-linecap:round"/>`; }
  return { s, X, x0, u };
}

export class CycleClockScene extends SvgScene {
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [one(0)], 1: [one(0)], 5: [one(1), one(2), one(3), one(4), one(5)], 4: [one(6), one(7), one(8), one(9)] };
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4), one(5), one(6), one(7), one(8), one(9)];
  static WIDTH = 640;
  static HEIGHT = 480;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 480;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A track of the days of the monthly cycle above a front view of the uterus. The lining is thin after a period and thick before the next one. In a longer cycle the egg is released later, about 14 days before the next period.';

  css() {
    return BODY_CSS + `.svs { padding: 0; }
.cc-row { display: flex; gap: 10px; justify-content: center; padding: 8px 4px 2px; }
.cc-row[hidden] { display: none; }
.cc-len { min-height: 46px; min-width: 96px; padding: 4px 12px; cursor: pointer; touch-action: manipulation; font: 800 16px/1 var(--sim-font); color: var(--sim-label); background: var(--sim-bg-surface); border: calc(2px * var(--look-rim)) solid var(--sim-stroke); border-radius: var(--sim-radius-md); box-shadow: 0 calc(3px * var(--look-lip)) 0 color-mix(in oklab, var(--sim-stroke) 62%, var(--sim-bg-deep)); }
.cc-len[aria-pressed="true"] { background: color-mix(in oklab, var(--sim-accent) 26%, var(--sim-bg-surface)); border-color: var(--sim-accent); }`;
  }
  stageHeight(st) { return st.portrait ? 400 : 390; }
  async setup() {
    this._C = 28;
    await super.setup();
    this._row = mountEl(this.root, 'cc-row');
    this._row.innerHTML = LENS.map((c) => `<button type="button" class="cc-len" data-c="${c}" aria-pressed="false">${c} days</button>`).join('');
    this._row.querySelectorAll('.cc-len').forEach((b) => b.addEventListener('click', () => { this._C = Number(b.dataset.c); this._sync(); this.repaint(); }));
    this._sync(); this.repaint();
  }
  enter() { this._C = 28; this._sync?.(); }
  _sync() {
    if (!this._row) return;
    this._row.hidden = this.stepIndex !== 7;
    this._row.style.display = this.stepIndex === 7 ? '' : 'none';
    this._row.querySelectorAll('.cc-len').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.c) === this._C)));
    this.relayout?.();
  }
  _fig(st, cx, y, k, o) { return femaleSystemSvg(cx - 220 * k, y, k, { id: 'cc', ...o }); }
  _first(st) {
    const W = st.W, H = st.H, P = st.portrait, x = 18, w = W - 36, step = this.stepIndex, y = 54;
    const [d, lit, lab] = DAY[step] ?? [14, null, ''];
    const t = track(x, y, w, 28, { lit, mark: step ? d : 0, noEgg: step === 1 || step === 2 });
    let s = t.s;
    s += txt(x, y + 50, 'Day 1', { size: 15, anchor: 'start', col: MUTED }) + txt(x + w, y + 50, 'Day 28', { size: 15, anchor: 'end', col: MUTED });
    if (lab) s += tag(W / 2, 26, lab, { size: 16, display: true });
    else s += tag(W / 2, 26, 'One cycle of 28 days', { size: 16, display: true }) + txt(t.X(14) + t.u / 2, y + 50, 'day 14', { size: 16, display: true });
    const k = P ? 0.76 : 0.82, fy = y + (P ? 62 : 56), l = liningAt(d, 28);
        s += this._fig(st, W / 2, fy, k, { lining: l, shed: step === 1 ? 1 : 0, vessels: step === 4, dim: (id) => (step === 0 ? false : ['ovary', 'tube', 'ligament'].includes(id) && step !== 2 && step !== 3 ? true : false) });
    if (step === 2) s += tag(P ? 64 : W / 2 - 220, fy + 240 * k + (P ? 20 : 0), 'An egg matures', { size: 14, anchor: P ? undefined : 'start' });
    if (step === 3) {
      const ax = W / 2 - 220 * k, q = (p) => `${n(ax + p[0] * k)} ${n(fy + p[1] * k)}`;
      s += travel(eggSvg(0, 0, 8, { id: 'cce' }), `M${q([354, 132])}L${q([394, 112])}L${q(tubePt('R', 0.9))}L${q(tubePt('R', 0.65))}`, { t: 2 });
      s += tag(W - 14, fy + 12, 'Mature egg released', { size: 14, anchor: 'end' });
    }
    if (step === 1) s += tag(P ? W - 12 : W - 40, H - 40, 'Lining sheds', { size: 14, anchor: 'end' });
    if (step === 4) s += tag(P ? W - 12 : W - 40, H - 40, 'Thick, with blood vessels', { size: 14, anchor: 'end' });
    return s;
  }
  _years(st) {
    const W = st.W, H = st.H, P = st.portrait, x = 22, w = W - 44, y = P ? 150 : 150, A = (a) => x + (a / 60) * w;
    let s = tag(W / 2, 30, 'Cycles repeat every 21 to 35 days', { size: P ? 15 : 17, display: true });
    s += `<rect x="${x}" y="${y}" width="${w}" height="40" rx="20" style="fill:${PAPER};stroke:var(--sim-stroke);stroke-width:3"/>`;
    s += `<rect x="${n(A(12))}" y="${y + 3}" width="${n(A(50) - A(12))}" height="34" rx="14" style="fill:${PH.rebuild}"/>`;
    for (let a = 13; a < 50; a += 1.2) s += `<rect x="${n(A(a))}" y="${y + 8}" width="3" height="24" rx="1.5" style="fill:${BODY.lining}"/>`;
    s += txt(A(0) + 4, y + 66, 'Birth', { size: 15, anchor: 'start', col: MUTED });
    s += tag(A(12) + (P ? 18 : 0), y - 40, 'Puberty: age 10 to 14', { size: P ? 14 : 15 });
    s += tag(A(50) - (P ? 26 : 0), y + 82, 'Menopause: around age 50', { size: P ? 14 : 15 });
    s += `<path d="M${n(A(12))} ${y - 24}L${n(A(12))} ${y + 6}M${n(A(50))} ${y + 34}L${n(A(50))} ${y + 66}" style="fill:none;stroke:${INK};stroke-width:3;stroke-linecap:round"/>`;
    s += tag(W / 2, H - 46, 'Irregular at first: this is common', { size: 15 });
    return s;
  }
  _two(st) {
    const W = st.W, P = st.portrait, right = W - 22, u = (W - 44) / 35, y1 = 92, y2 = 192;
    const a = track(0, y1, 0, 28, { u, right, eggLabel: true }), b = track(0, y2, 0, 35, { u, right, eggLabel: true });
    let s = tag(W / 2, 28, 'Both tracks end at the next period', { size: P ? 15 : 16, display: true });
    s += txt(a.x0 - 6, y1 - 8, '28 days', { size: 16, anchor: 'start', display: true }) + txt(b.x0, y2 - 8, '35 days', { size: 16, anchor: 'start', display: true });
    s += a.s + b.s;
    const ex = a.X(14) + u / 2, y3 = y2 + 84;
    s += `<path d="M${n(ex)} ${y1 + 44}L${n(ex)} ${y3}L${right} ${y3}L${right} ${y2 + 36}" style="fill:none;stroke:${INK};stroke-width:3;stroke-linejoin:round;stroke-dasharray:3 9;stroke-linecap:round"/>`;
    s += tag((ex + right) / 2, y3, 'about 14 days', { size: 15, display: true });
    s += tag(b.x0 + 7 * u / 2, y3 + 2, 'extra days', { size: 14 });
    s += txt(W / 2, st.H - 18, 'The extra days come before the egg', { size: 15, col: MUTED });
    return s;
  }
  _lengthCase(st) {
    const W = st.W, H = st.H, P = st.portrait, C = this._C, right = W - 22, u = (W - 44) / 35, y = 130, ov = eggDay(C);
    const t = track(0, y, 0, C, { u, right, h: 44 });
    let s = tag(W / 2, 30, `A ${C}-day cycle`, { size: 19, display: true });
    s += t.s;
    const ex = t.X(ov) + u / 2;
    s += `<path d="M${n(ex)} ${y + 50}L${n(ex)} ${y + 74}L${right} ${y + 74}L${right} ${y + 50}" style="fill:none;stroke:${INK};stroke-width:3;stroke-linejoin:round"/>`;
    s += tag((ex + right) / 2, y + 74, '14 days', { size: 14 });
    s += pop(panel(W / 2 - (P ? 150 : 170), y + 110, P ? 300 : 340, 104, { rim: BODY.egg }) + txt(W / 2, y + 150, `${C} - 14 = ${ov}`, { size: 30, display: true }) + txt(W / 2, y + 190, `Egg released around day ${ov}`, { size: 17, weight: 800 }));
    return s;
  }
  _three(st) {
    const W = st.W, H = st.H, P = st.portrait, right = W - 22, u = (W - 44) / 35;
    let s = tag(W / 2, 28, '"Always day 14" is wrong', { size: 17, display: true });
    LENS.forEach((C, i) => {
      const y = 92 + i * 84, t = track(0, y, 0, C, { u, right, eggLabel: true });
      s += txt(t.x0, y - 8, `${C} days`, { size: 16, anchor: 'start', display: true }) + t.s;
    });
    s += tag(W / 2, H - 32, 'The day can shift, even for one person', { size: P ? 14 : 15 });
    return s;
  }
  _preg(st) {
    const W = st.W, H = st.H, P = st.portrait, k = P ? 0.82 : 0.86, fy = 56;
    let s = tag(W / 2, 28, 'In pregnancy the cycle stops', { size: 17, display: true });
    s += this._fig(st, W / 2, fy, k, { lining: 1, vessels: true, dim: (id) => ['ovary', 'tube', 'ligament'].includes(id) });
    const ax = W / 2 - 220 * k, ay = fy;
    s += embryoSvg(1, ax + 220 * k - 14 * k, ay + 92 * k, 34);
    s += P ? tag(W / 2, H - 58, 'Hormones keep the lining', { size: 14 }) + tag(W / 2, H - 24, 'No more eggs are released', { size: 14 })
      : tag(16, H - 76, 'Hormones keep the lining', { size: 14, anchor: 'start' }) + tag(W - 16, H - 76, 'No more eggs are released', { size: 14, anchor: 'end' });
    return s;
  }
  paint(st) {
    const step = this.stepIndex;
    this._sync?.();
    const s = step <= 4 ? this._first(st) : step === 5 ? this._years(st) : step === 6 ? this._two(st) : step === 7 ? this._lengthCase(st) : step === 8 ? this._three(st) : this._preg(st);
    return { svg: frame(st, 'cc', s, { field: { a: 6, b: 2, seed: 21, k: 9, x: 1 } }) };
  }
}
