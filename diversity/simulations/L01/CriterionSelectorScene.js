// CriterionSelectorScene - blk-l01-s03, 2 beats. Six animals of one forest by day and by night, after the book's figure.
// Four rules in the scene regroup them. Beat 0: the forest, no rule yet. Beat 1: body covering chosen, eagle and bat apart.
// Controls: .bb-btn[data-rule] where, when, cover, eats. Groups are facts of these six animals as drawn.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { LIFE_COLOR_MAP, svgBroadLeaf } from '../shared/LifeArt.js';
import { fitBio, svgBioColour as bc } from '../shared/BioArt.js';
import { BIO_BTN_CSS, PLATE, btnRow } from '../shared/BioBits.js';
import { words } from '../shared/SeaBits.js';

const one = (idx) => [{ idx, dwellMs: null }];
const ART = { eagle: 'Eagle', tiger: 'Tiger', owl: 'Owl', bat: 'Bat', deer: 'Deer', frog: 'Frog' };
const RULES = {
  where: { label: 'Where seen', groups: [['In the air', ['eagle', 'bat']], ['In a tree', ['owl']], ['On the ground', ['tiger', 'deer']], ['Near water', ['frog']]] },
  when: { label: 'When active', groups: [['Day', ['eagle', 'tiger', 'deer']], ['Night', ['owl', 'bat']], ['Day and night', ['frog']]] },
  cover: { label: 'Body covering', groups: [['Feathers', ['eagle', 'owl']], ['Fur', ['tiger', 'deer', 'bat']], ['Moist skin', ['frog']]] },
  eats: { label: 'What it eats', groups: [['Other animals', ['eagle', 'tiger', 'owl']], ['Insects', ['bat', 'frog']], ['Plants', ['deer']]] },
};
// Unit boxes in the forest, before any rule: [x, y, w, h].
const HOME = { eagle: [0.05, 0.04, 0.34, 0.32], bat: [0.6, 0.03, 0.36, 0.17], owl: [0.62, 0.22, 0.3, 0.3], deer: [0.02, 0.42, 0.44, 0.38], tiger: [0.3, 0.5, 0.4, 0.3], frog: [0.54, 0.8, 0.16, 0.11] };

export class CriterionSelectorScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1)];
  static WIDTH = 560; static HEIGHT = 500; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 620;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Six animals of one forest: eagle, tiger, deer, owl, bat and frog, with day on the left and night on the right. Four rules regroup them: where seen, when active, body covering, what it eats. The eagle and the bat share a group under where seen and are apart under body covering.';

  _rule = null; _seen = new Set();

  css() { return BIO_BTN_CSS; }
  async setup() {
    await super.setup();
    this.row = btnRow(this.root);
    this.row.innerHTML = Object.entries(RULES).map(([k, r]) => `<button type="button" class="bb-btn" data-rule="${k}" aria-pressed="false">${r.label}</button>`).join('');
    this.row.addEventListener('click', (e) => { const b = e.target.closest?.('[data-rule]'); if (b) this._pick(b.dataset.rule); });
    this.enter(this.stepIndex); this.repaint();
  }
  stageHeight(st) { return st.portrait ? 470 : 400; }
  enter(step) { this._rule = step === 1 ? 'cover' : null; this._mark(); }
  _mark() { this.row?.querySelectorAll?.('[data-rule]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rule === this._rule))); }
  _pick(k) { this._rule = this._rule === k ? null : k; this._mark(); this.repaint(); }
  _forest(st) {
    const W = st.W, H = st.H, m = W / 2, floor = H * 0.8;
    const night = bc({ a: 'seaDeep', b: 'strata6', t: 0.5 }), day = bc({ a: 'skyDay', b: 'elevPeak', t: 0.3 });
    let s = `<defs><clipPath id="cs-clip"><rect width="${W}" height="${H}" rx="16"/></clipPath></defs><g clip-path="url(#cs-clip)">`;
    s += `<rect width="${m}" height="${H}" style="fill:${day}"/><rect x="${m}" width="${m}" height="${H}" style="fill:${night}"/>`;
    s += `<circle cx="${W * 0.08}" cy="${H * 0.1}" r="20" style="fill:${bc('sun')}"/><circle cx="${W * 0.94}" cy="${H * 0.26}" r="15" style="fill:${bc('white')}"/><circle cx="${W * 0.93}" cy="${H * 0.25}" r="13" style="fill:${night}"/>`;
    s += svgBroadLeaf(W * 0.3, floor + 6, 1.3, { seed: 3 }) + svgBroadLeaf(W * 0.76, floor + 6, 1.8, { seed: 8 });
    s += `<rect x="${m}" y="0" width="${m}" height="${H}" style="fill:${night};opacity:.42"/>`;
    s += `<rect y="${floor}" width="${W}" height="${H - floor}" style="fill:${bc('leaf')}"/><rect x="${m}" y="${floor}" width="${m}" height="${H - floor}" style="fill:${bc('leafDeep')}"/>`;
    s += `<ellipse cx="${W * 0.62}" cy="${floor + 34}" rx="${W * 0.2}" ry="20" style="fill:${bc('water')}"/>`;
    return s + '</g>';
  }
  paint(st) {
    let svg = this._forest(st);
    const R = RULES[this._rule];
    if (!R) {
      for (const [k, [x, y, w, h]] of Object.entries(HOME)) svg += fitBio(ART[k], x * st.W, y * st.H, w * st.W, h * st.H);
      return { svg };
    }
    const n = R.groups.length;
    if (!st.portrait) {
      const gap = 10, w = (st.W - 20 - gap * (n - 1)) / n, y = 16, h = st.H - 32;
      R.groups.forEach(([title, list], i) => {
        const x = 10 + i * (w + gap);
        svg += PLATE(x, y, w, h, { fill: 'var(--sim-bg-surface)' }) + words(x + w / 2, y + 30, title, { size: 17, display: true });
        const ch = (h - 48) / list.length;
        list.forEach((a, k) => { svg += fitBio(ART[a], x + 12, y + 40 + k * ch, w - 24, ch - 26, { max: 2.2 }); svg += words(x + w / 2, y + 40 + (k + 1) * ch - 2, this._name(a), { size: 14 }); });
      });
    } else {
      const gap = 8, tot = R.groups.reduce((a, [, l]) => a + 1, 0), h = (st.H - 16 - gap * (tot - 1)) / tot;
      R.groups.forEach(([title, list], i) => {
        const y = 8 + i * (h + gap), x = 8, w = st.W - 16;
        svg += PLATE(x, y, w, h, { fill: 'var(--sim-bg-surface)' }) + words(x + 12, y + 26, title, { size: 17, display: true, anchor: 'start' });
        const cw = (w - 16) / Math.max(list.length, 2);
        list.forEach((a, k) => { const cx = x + 8 + k * cw + (list.length === 1 ? w * 0.25 : 0); svg += fitBio(ART[a], cx + 6, y + 30, cw - 12, h - 56, { max: 1.4 }); svg += words(cx + cw / 2, y + h - 8, this._name(a), { size: 14 }); });
      });
    }
    return { svg };
  }
  _name(a) { return a[0].toUpperCase() + a.slice(1); }
}
