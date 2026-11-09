// ElementSymbolsScene - companion to blk-l02-s9, "Symbols of Elements" (book 8.4).
//   b0  pictures  Dalton's circles: tap one to see which element it stood for
//   b1  letters   IUPAC rules: step through elements, the letters used light up in the name
//   b2  latin-a   tiles Na, K, Fe: tap to turn one over to its Latin name
//   b3  latin-b   tiles Cu, Ag, Au, Pb: the same
//   b4  takeaway  one symbol, read everywhere
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { rr, pill, popAt, clamp01, darken, lighten, font, outBack } from 'simulations/base/kit/SimLook.js';
import { drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { bigText, isDay, chipInk } from '../L01/GrainKit.js';

const S_PIC = 0, S_LET = 1, S_LA = 2, S_LB = 3, S_TAKE = 4;
const DALTON = [
  { name: 'hydrogen', mark: 'dot' }, { name: 'carbon', mark: 'solid' }, { name: 'oxygen', mark: 'none' },
  { name: 'sulfur', mark: 'cross' }, { name: 'copper', mark: 'C' }, { name: 'gold', mark: 'G' },
];
const LETTERS = [
  { sym: 'H', name: 'hydrogen', on: [0], rule: 'the first letter' },
  { sym: 'Al', name: 'aluminium', on: [0, 1], rule: 'the first two letters' },
  { sym: 'Co', name: 'cobalt', on: [0, 1], rule: 'capital, then small', not: 'CO' },
  { sym: 'Cl', name: 'chlorine', on: [0, 2], rule: 'first and a later letter' },
  { sym: 'Zn', name: 'zinc', on: [0, 2], rule: 'first and a later letter' },
];
const SET_A = [['Na', 'sodium', 'natrium'], ['K', 'potassium', 'kalium'], ['Fe', 'iron', 'ferrum']];
const SET_B = [['Cu', 'copper', 'cuprum'], ['Ag', 'silver', 'argentum'], ['Au', 'gold', 'aurum'], ['Pb', 'lead', 'plumbum']];
const FLIP_S = 0.36;

export class ElementSymbolsScene extends SimScene {
  static BEAT_STEP_MAP = [S_PIC, S_LET, S_LA, S_LB, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [{ type: 'button', id: 'next', label: 'Next element' }];
  static ARIA_LABEL = 'Dalton\'s round pictures for six elements, each tapped to show its name. Then letters from element names light up to form symbols: H, Al, Co, Cl, Zn. '
    + 'Then tiles for Na, K and Fe, and for Cu, Ag, Au and Pb, turn over to show their Latin names. Last, one symbol, Na, is read in four countries.';

  constructor(container, config) {
    super(container, config);
    this._open = {};
    this._i = 0;
    this._at = 0;
    this._found = false;
  }

  enter() { this._open = {}; this._i = 0; this._at = 0; this._found = false; this.requestUiUpdate?.(); }

  isControlHidden(id) { return id === 'next' ? this.stage !== S_LET : false; }
  onControlChange(id) { if (this._guard(id) && id === 'next') this._next(); }
  _next() { this._i = (this._i + 1) % LETTERS.length; this._at = this.age; this.requestUiUpdate?.(); }

  _flip(i) {
    if (this._open[i] != null) return;
    this._open[i] = this.age;
    const set = this.stage === S_LA ? SET_A : this.stage === S_LB ? SET_B : null;
    if (set && Object.keys(this._open).length === set.length && !this._found) {
      this._found = true;
      this.after(FLIP_S + 0.1, () => this.celebrate(340, 250, 12, { key: `latin-${this.stage}` }));
    }
  }

  pointerDown(p) {
    if (this.stage === S_LET) { this._next(); return; }
    if (this.stage === S_PIC) { this._flip(this._picAt(p)); return; }
    if (this.stage === S_LA || this.stage === S_LB) {
      const set = this.stage === S_LA ? SET_A : SET_B;
      this._flip(Math.max(0, Math.min(set.length - 1, Math.floor((p.x / 680) * set.length))));
    }
  }

  _picAt(p) { return (p.y > 262 ? 3 : 0) + Math.max(0, Math.min(2, Math.floor((p.x - 60) / 187))); }

  busy() {
    if (this.age - this._at < 0.5 || this.age < 1.5) return true;
    return Object.values(this._open).some((a) => this.age - a < FLIP_S + 0.05);
  }

  draw(ctx, c, t) {
    drawDepthField(ctx, c, { x: 340, y: 250, seed: 15 + this.stage, t });
    if (this.stage === S_PIC) this._pictures(ctx, c);
    else if (this.stage === S_LET) this._letters(ctx, c);
    else if (this.stage === S_TAKE) this._take(ctx, c);
    else this._tiles(ctx, c, this.stage === S_LA ? SET_A : SET_B);
  }

  _pictures(ctx, c) {
    bigText(ctx, c, "Dalton's pictures, 1803", 340, 42, 32, c.label);
    DALTON.forEach((d, i) => {
      const x = 153 + (i % 3) * 187, y = 158 + Math.floor(i / 3) * 192, r = 66;
      ctx.beginPath(); ctx.arc(x, y + 5, r, 0, Math.PI * 2); ctx.fillStyle = darken(c.raised, 0.2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = d.mark === 'solid' ? c.label : c.bgSurface; ctx.fill();
      ctx.lineWidth = 7; ctx.strokeStyle = c.label; ctx.stroke();
      if (d.mark === 'dot') { ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fillStyle = c.label; ctx.fill(); }
      if (d.mark === 'cross') {
        ctx.strokeStyle = c.label; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
      }
      if (d.mark.length === 1 && d.mark !== 'none') bigText(ctx, c, d.mark, x, y + 3, 74, c.label);
      const a = this._open[i];
      if (a != null) {
        const p = reducedMotion() ? { scale: 1, alpha: 1, u: 2 } : popAt(this.age, a);
        if (p) pill(ctx, c, d.name, x, y + r + 16, { bg: c.gold, ink: chipInk(c), size: 26, display: true, scale: p.scale, alpha: p.alpha, pop: p.u });
      }
    });
  }

  _tile(ctx, c, x, y, w, h, sym, o = {}) {
    const bg = o.bg ?? c.accent;
    rr(ctx, x - w / 2, y - h / 2 + 7, w, h, 20); ctx.fillStyle = darken(bg, 0.32); ctx.fill();
    rr(ctx, x - w / 2, y - h / 2, w, h, 20); ctx.fillStyle = bg; ctx.fill();
    rr(ctx, x - w / 2 + 14, y - h / 2 + 10, w - 28, 8, 4); ctx.fillStyle = lighten(bg, 0.35); ctx.fill();
    bigText(ctx, c, sym, x, y + (o.dy ?? 0), o.size ?? 92, o.ink ?? chipInk(c));
  }

  _letters(ctx, c) {
    const e = LETTERS[this._i];
    const k = reducedMotion() ? 1 : outBack(clamp01((this.age - this._at) / 0.3));
    bigText(ctx, c, 'where the letters come from', 340, 44, 32, c.label);
    this._tile(ctx, c, 340, 190, 196 * k, 196 * k, e.sym, { size: 110 * Math.max(0.2, k) });
    this._name(ctx, c, e, 346);
    pill(ctx, c, e.rule, 340, 420, { bg: c.raised, ink: c.label, size: 28, display: true });
    if (e.not) pill(ctx, c, 'CO is carbon monoxide', 340, 476, { bg: c.warning, ink: chipInk(c), size: 24, display: true });
  }

  /** The name, spaced letter by letter, the letters the symbol uses in gold. */
  _name(ctx, c, e, y) {
    ctx.save();
    const size = 54;
    ctx.font = font(c, 700, size, true);
    const widths = [...e.name].map((ch) => ctx.measureText(ch).width + 3);
    const total = widths.reduce((a, b) => a + b, 0);
    let x = 340 - total / 2;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    [...e.name].forEach((ch, i) => {
      ctx.fillStyle = e.on.includes(i) ? (isDay(c) ? c.accent : c.gold) : c.labelMuted;
      ctx.fillText(ch, x, y);
      x += widths[i];
    });
    ctx.restore();
  }

  _tiles(ctx, c, set) {
    const n = set.length, W = n === 3 ? 196 : 148, H = 280, gap = (640 - n * W) / (n + 1);
    bigText(ctx, c, 'tap a tile', 340, 50, 32, c.label);
    set.forEach(([sym, en, la], i) => {
      const x = 20 + gap + W / 2 + i * (W + gap), y = 262;
      const a = this._open[i];
      const u = a == null ? 0 : reducedMotion() ? 1 : clamp01((this.age - a) / FLIP_S);
      const sx = Math.abs(Math.cos(u * Math.PI));
      const back = u >= 0.5;
      const w = Math.max(6, W * sx);
      if (!back) {
        this._tile(ctx, c, x, y, w, H, sym, { size: n === 3 ? 100 : 82, dy: -24 });
        if (sx > 0.6) bigText(ctx, c, en, x, y + 86, n === 3 ? 30 : 25, chipInk(c));
      } else {
        this._tile(ctx, c, x, y, w, H, sym, { bg: c.gold, ink: chipInk(c), size: n === 3 ? 100 : 82, dy: -24 });
        if (sx > 0.6) this._latin(ctx, c, la, x, y + 86, n === 3 ? 30 : 24);
      }
    });
  }

  _latin(ctx, c, la, x, y, size) {
    bigText(ctx, c, la, x, y, size, chipInk(c));
  }

  _take(ctx, c) {
    this._tile(ctx, c, 340, 250, 240, 240, 'Na', { size: 130 });
    [['Kerala', 140, 94], ['Japan', 540, 94], ['Brazil', 140, 420], ['Egypt', 540, 420]].forEach(([text, x, y], i) => {
      const p = reducedMotion() ? { scale: 1, alpha: 1, u: 2 } : popAt(this.age, 0.2 + i * 0.18);
      if (p) pill(ctx, c, `${text}: Na`, x, y, { bg: c.raised, ink: c.label, size: 28, display: true, scale: p.scale, alpha: p.alpha, pop: p.u });
    });
  }
}
