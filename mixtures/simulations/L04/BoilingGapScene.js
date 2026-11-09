/**
 * BoilingGapScene - blk-l04-s04. The book's five liquids on one big thermometer.
 *
 * The learner taps any two. The gap between them lights up in the thermometer, the reading says how
 * far apart they are, and a bar shows what the first vapour holds: nearly one liquid when the gap is
 * wide, a lot of both when it is small. Chloroform and benzene do not mix with water at all, so those
 * pairs say so and show no vapour bar. 24 C reads "near the limit", never as a hard failure.
 *
 *   beat 0  pick any two: the gap only
 *   beat 1  about 25 C: the ruler and the vapour bar. Preset alcohol and benzene, 2 C
 *   beat 2  near the limit, and pairs that do not mix. Preset acetone and benzene, 24 C
 *
 * The vapour bar is a picture of the rule, not data: its share is a smooth guess from the gap, and
 * the design note says so. SvgScene: portrait is its own layout and text never shrinks.
 */
import { SvgScene, chip, tone, cushionCircle } from 'simulations/base/kit/SimSvg.js';
import { esc } from 'simulations/base/SimUi.js';

const DEG = '\u00b0';
const LIQ = [
  { name: 'Acetone', bp: 56, tone: 2 },
  { name: 'Chloroform', bp: 61, tone: 5 },
  { name: 'Alcohol', bp: 78, tone: 3 },
  { name: 'Benzene', bp: 80, tone: 6 },
  { name: 'Water', bp: 100, tone: 1 },
];
const AX_MIN = 40, AX_MAX = 110, RULE = 25;
const WATER = 4;
const iOf = (n) => LIQ.findIndex((l) => l.name === n);
const PRESET = { 1: ['Alcohol', 'Benzene'], 2: ['Acetone', 'Benzene'] };

const noMix = (i, j) => (i === WATER || j === WATER) && (LIQ[i].name === 'Chloroform' || LIQ[j].name === 'Chloroform' || LIQ[i].name === 'Benzene' || LIQ[j].name === 'Benzene');
const verdictOf = (i, j) => {
  if (noMix(i, j)) return { text: 'these do not mix: lesson 6', tone: 'warning' };
  const gap = Math.abs(LIQ[i].bp - LIQ[j].bp);
  if (gap >= RULE) return { text: 'separates well', tone: 'good' };
  if (gap >= 23) return { text: 'near the limit', tone: 'warning' };
  return { text: 'too close: still a mixture', tone: 'bad' };
};

export class BoilingGapScene extends SvgScene {
  static BEAT_STEP_MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);
  static HEIGHT = 570;
  static PORTRAIT_HEIGHT = 246;
  static ARIA_LABEL = 'Five liquids marked at their boiling points on one big thermometer. Tap any two to see how far apart they are. Simple distillation separates liquids at least about 25 degrees apart. Chloroform and benzene do not mix with water, so those pairs are not for distillation.';
  static CONTROLS = [];

  css() {
    return `.bgs-pick { min-height: 46px; min-width: 46px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto; padding-inline: 12px; }
.bgs-pick[aria-pressed="true"] { outline: 3px solid var(--sim-label); outline-offset: 2px; }
.bgs-pick:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 3px; }
.sim-dom-root--portrait.svs { padding: 4px; }
.sim-dom-root--portrait .sv-stage > .sv-back { inset: -4px; width: calc(100% + 8px); height: calc(100% + 8px); }
.sim-dom-root--portrait .svs-head { display: none; }
.sim-dom-root--portrait .bgs-pick { min-height: 49px; min-width: 49px; padding: 2px 6px; font-size: var(--sim-text-sm); white-space: nowrap; }`;
  }

  async setup() {
    await super.setup();
    this.root?.addEventListener?.('click', this._onClick = (e) => {
      const t = e.target instanceof Element ? e.target.closest('[data-bgs]') : null;
      if (t) this._toggle(Number(t.dataset.bgs));
    });
    this.root?.addEventListener?.('keydown', this._onKey = (e) => {
      const t = e.target instanceof Element ? e.target.closest('[data-bgs]') : null;
      if (!t || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      const i = Number(t.dataset.bgs);
      this._toggle(i);
      this.root.querySelector(`[data-bgs="${i}"]`)?.focus();
    });
  }

  destroy() {
    this.root?.removeEventListener?.('click', this._onClick);
    this.root?.removeEventListener?.('keydown', this._onKey);
    super.destroy();
  }

  enter(step) {
    this.beat = step;
    this.pick = (PRESET[step] ?? []).map(iOf);
    this.found = false;
    this.fresh = true;
  }

  stageHeight(st) { return st.portrait ? 238 : 490; }

  get gap() { return this.pick.length === 2 ? Math.abs(LIQ[this.pick[0]].bp - LIQ[this.pick[1]].bp) : null; }

  _toggle(i) {
    const at = this.pick.indexOf(i);
    if (at >= 0) this.pick.splice(at, 1);
    else { this.pick.push(i); if (this.pick.length > 2) this.pick.shift(); }
    this.fresh = true;
    if (this.pick.length === 2 && this.beat >= 1 && !this.found && this.gap >= RULE && !noMix(this.pick[0], this.pick[1])) {
      this.found = true;
      this.celebrate();
    }
    this.repaint();
  }

  layout(st) {
    const p = st.portrait;
    // Phone: the host gives a scene about 350 x 225, so chips and result share a row under the tube.
    const x0 = p ? 46 : 96, x1 = st.W - (p ? 22 : 34);
    const tubeY = p ? 58 : 176;
    return { p, W: st.W, x0, x1, tubeY, tubeH: p ? 22 : 38, x: (t) => x0 + ((t - AX_MIN) / (AX_MAX - AX_MIN)) * (x1 - x0) };
  }

  paint(st) {
    const L = this.layout(st);
    const svg = this.thermoSvg(L) + this.resultSvg(L);
    const out = { svg, over: this.overHtml(L), head: this.headHtml(), floor: L.p ? 236 : 482 };
    this.fresh = false;
    return out;
  }

  thermoSvg(L) {
    const { tubeY: y, tubeH: h, x0, x1 } = L;
    const top = y - h / 2;
    let s = '';
    const bulbX = x0 - 26;
    s += `<rect x="${bulbX}" y="${top}" width="${x1 - bulbX + 10}" height="${h}" rx="${h / 2}" style="fill:color-mix(in oklab, var(--sim-glass) 22%, var(--sim-bg-surface));stroke:var(--sim-stroke);stroke-width:3"/>`;
    s += cushionCircle(bulbX, y, h * 0.95, 'var(--sim-bad)', { lift: 3 });
    s += `<rect x="${bulbX}" y="${y - 6}" width="${L.x(AX_MAX) - bulbX - 30}" height="12" rx="6" style="fill:color-mix(in oklab, var(--sim-bad) 30%, transparent)"/>`;
    for (let t = AX_MIN; t <= AX_MAX; t += 10) {
      const x = L.x(t).toFixed(1);
      s += `<line x1="${x}" y1="${y + h / 2 + 2}" x2="${x}" y2="${y + h / 2 + 11}" style="stroke:var(--sim-stroke);stroke-width:3"/>`;
      if (t % 20 === 0 || !L.p) s += `<text x="${x}" y="${y + h / 2 + 29}" text-anchor="middle" style="fill:var(--sim-label-muted);font-size:14px;font-weight:700">${t}</text>`;
    }
    // the highlighted gap
    if (this.pick.length === 2) {
      const [a, b] = this.pick.map((i) => L.x(LIQ[i].bp)).sort((p, q) => p - q);
      s += `<rect${this.fresh ? ' class="sv-pop"' : ''} x="${a.toFixed(1)}" y="${y - h / 2 + 4}" width="${Math.max(6, b - a).toFixed(1)}" height="${h - 8}" rx="6" style="fill:var(--sim-warning)"/>`;
    }
    // the marks
    LIQ.forEach((l, i) => {
      const x = L.x(l.bp).toFixed(1);
      const on = this.pick.includes(i);
      s += `<line x1="${x}" y1="${y - h / 2 - (L.p ? 8 : (i % 2 ? 0 : 34))}" x2="${x}" y2="${y + h / 2 + (L.p || !(i % 2) ? 0 : 42)}" style="stroke:${tone(l.tone)};stroke-width:${on ? 6 : 4};stroke-linecap:round"/>`;
      if (L.p) s += `<text x="${x}" y="${y - h / 2 - (i % 2 ? 34 : 14)}" text-anchor="middle" style="fill:var(--sim-label);font-size:15px;font-weight:800">${l.bp}</text>`;
    });
    // the ruler: how long 25 degrees is, under the tube
    if (this.beat >= 1) {
      const a = this.pick.length ? Math.min(...this.pick.map((i) => LIQ[i].bp)) : 56;
      const ry = y + h / 2 + (L.p ? 44 : 104);
      const xa = L.x(a), xb = L.x(a + RULE);
      s += `<path d="M${xa.toFixed(1)} ${ry - 7}v14M${xa.toFixed(1)} ${ry}H${xb.toFixed(1)}M${xb.toFixed(1)} ${ry - 7}v14" style="fill:none;stroke:var(--sim-warning);stroke-width:4;stroke-linecap:round"/>`;
      const room = xb + 110 < L.W;
      s += `<text x="${(room ? xb + 10 : xa - 10).toFixed(1)}" y="${ry + 5}" text-anchor="${room ? 'start' : 'end'}" style="fill:var(--sim-label);font-size:15px;font-weight:800">about ${RULE} ${DEG}C</text>`;
    }
    return s;
  }

  /** The reading card under the thermometer, and from beat 1 what the first vapour holds. */
  resultSvg(L) {
    const y = L.p ? 120 : 322;
    const x = L.p ? L.W - 80 : 12, w = L.p ? 78 : L.W - 24, h = L.p ? 114 : 160;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" style="fill:var(--sim-bg-surface);stroke:var(--sim-stroke);stroke-width:2.5"/>`;
    if (this.pick.length !== 2) {
      s += `<text x="${x + w / 2}" y="${y + h / 2 + 8}" text-anchor="middle" style="fill:var(--sim-label-muted);font-size:${L.p ? 15 : 20}px;font-weight:700">${L.p ? 'Tap two' : 'Tap two liquids'}</text>`;
      return s;
    }
    const [i, j] = this.pick;
    s += `<text x="${x + (L.p ? 8 : 24)}" y="${y + (L.p ? 32 : 62)}" style="font-family:var(--sim-font-display);fill:var(--sim-label);font-size:${L.p ? 22 : 44}px;font-weight:700">${this.gap} ${DEG}C</text>`;
    s += `<text x="${x + (L.p ? 10 : 26)}" y="${y + (L.p ? 50 : 88)}" style="fill:var(--sim-label-muted);font-size:${L.p ? 14 : 17}px;font-weight:700">apart</text>`;
    if (this.beat >= 1 && !noMix(i, j)) {
      const lo = LIQ[i].bp <= LIQ[j].bp ? i : j, hi = lo === i ? j : i;
      const share = Math.min(0.96, 0.5 + (this.gap / 50) * 0.5);
      const bx = L.p ? x + 10 : x + 306, bw = L.p ? w - 20 : w - 330, by = L.p ? y + 84 : y + 70, bh = L.p ? 18 : 34;
      s += `<text x="${bx}" y="${by - 12}" style="fill:var(--sim-label);font-size:${L.p ? 14 : 16}px;font-weight:800">${L.p ? 'Vapour' : 'First vapour'}</text>`;
      s += `<rect x="${bx}" y="${by}" width="${(bw * share).toFixed(1)}" height="${bh}" style="fill:${tone(LIQ[lo].tone)}"/>`;
      s += `<rect x="${(bx + bw * share).toFixed(1)}" y="${by}" width="${(bw * (1 - share)).toFixed(1)}" height="${bh}" style="fill:${tone(LIQ[hi].tone)}"/>`;
      s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" style="fill:none;stroke:var(--sim-stroke);stroke-width:3"/>`;
      if (!L.p) s += `<text x="${bx}" y="${by + bh + 21}" style="fill:var(--sim-label-muted);font-size:15px;font-weight:700">${esc(LIQ[lo].name)}</text>`;
      if (!L.p) s += `<text x="${bx + bw}" y="${by + bh + 21}" text-anchor="end" style="fill:var(--sim-label-muted);font-size:15px;font-weight:700">${esc(LIQ[hi].name)}</text>`;
    }
    return s;
  }

  headHtml() {
    return chip(this.beat === 0 ? 'Tap any two liquids' : this.beat === 1 ? `The rule: about ${RULE} ${DEG}C apart` : 'Check the pair', 0, 0, { tone: 'plain', size: 'big', static: true });
  }

  overHtml(L) {
    let out = '';
    LIQ.forEach((l, i) => {
      const on = this.pick.includes(i);
      const pos = L.p
        ? { x: [47, 151, 253, 47, 138][i], y: i < 3 ? 142 : 194 }
        : { x: L.x(l.bp), y: L.tubeY + (i % 2 ? 76 : -66) };
      const text = L.p ? `${l.name} ${l.bp}` : `${l.name} ${l.bp} ${DEG}C`;
      out += chip(text, pos.x, pos.y, { tone: l.tone, cls: 'bgs-pick' })
        .replace('<span ', `<span role="button" tabindex="0" aria-pressed="${on}" data-bgs="${i}" `);
    });
    if (this.pick.length === 2 && this.beat >= 1) {
      const v = verdictOf(this.pick[0], this.pick[1]);
      out += chip(L.p ? v.text.replace('too close: still a mixture', 'still a mixture').replace('these do not mix: lesson 6', 'they do not mix') : v.text, L.p ? 232 : 142, L.p ? 194 : 450, { tone: v.tone, size: L.p ? 'sm' : undefined });
    }
    return out;
  }
}
