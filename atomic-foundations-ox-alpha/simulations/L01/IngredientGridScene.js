// IngredientGridScene - companion to blk-l01-s5, "Is Salt Made of Salty Stuff?".
//   b0  guess     the obvious idea: the grain holds salty stuff, or sweet stuff
//   b1  break     cards: sodium + chlorine = salt; carbon + hydrogen + oxygen = sugar (tap to switch)
//   b2  takeaway  a table of 118 tiles, with the five elements of the two grains lit
// Nothing inside the cards is salty or sweet: that is what the learner should see for themselves.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, mix, lighten, darken, rr, pill, popAt, outBack, clamp01, drawBackdrop, drawFloor, drawBench, drawCard, font, ellipse } from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawGrain, bigText, isDay, snow } from './GrainKit.js';

const S_GUESS = 0, S_BREAK = 1, S_TAKE = 2;
const SETS = {
  salt: [
    { name: 'sodium', note: 'burns on water', kind: 'metal' },
    { name: 'chlorine', note: 'poison gas', kind: 'green' },
  ],
  sugar: [
    { name: 'carbon', note: 'black solid', kind: 'coal' },
    { name: 'hydrogen', note: 'clear gas', kind: 'clear' },
    { name: 'oxygen', note: 'clear gas', kind: 'clear' },
  ],
};
// The periodic table as 118 tiles: [row, first column, last column].
const ROWS = [[0, 0, 0], [0, 17, 17], [1, 0, 1], [1, 12, 17], [2, 0, 1], [2, 12, 17], [3, 0, 17], [4, 0, 17], [5, 0, 17], [6, 0, 17], [7.4, 2, 15], [8.4, 2, 15]];
const LIT = { H: [0, 0, 'sugar'], C: [1, 13, 'sugar'], O: [1, 15, 'sugar'], Na: [2, 0, 'salt'], Cl: [2, 16, 'salt'] };
const TILE = 34, TX = 340 - (18 * TILE) / 2, TY = 118;

export class IngredientGridScene extends SimScene {
  static BEAT_STEP_MAP = [S_GUESS, S_BREAK, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'grain', label: 'Grain', value: 'salt', options: [{ value: 'salt', label: 'Salt' }, { value: 'sugar', label: 'Sugar' }] },
  ];
  static ARIA_LABEL = 'First, two grains are labelled with the obvious guess: salty stuff and sweet stuff. Then cards show what they are '
    + 'really made of: sodium, a metal that burns on water, and chlorine, a poison gas, give salt; black carbon and two clear gases, '
    + 'hydrogen and oxygen, give sugar. Last, a table of 118 tiles lights up the five elements of the two grains.';

  constructor(container, config) {
    super(container, config);
    this._grain = 'salt';
    this._at = 0;
    this._seen = {};
    this._found = false;
  }

  enter() { this._grain = 'salt'; this._at = 0; this._seen = { salt: true }; this._found = false; this.requestUiUpdate?.(); }

  isControlHidden() { return this.stage === S_GUESS; }
  getControlValue(id) { return id === 'grain' ? this._grain : undefined; }
  onControlChange(id, v) { if (this._guard(id) && id === 'grain') this._set(v); }

  _set(v) {
    if (v === this._grain) return;
    this._grain = v;
    this._at = this.age;
    this._seen[v] = true;
    if (this.stage === S_BREAK && this._seen.sugar && !this._found) {
      this._found = true;
      this.after(1.1, () => this.celebrate(600, 240, 22, { key: 'not-salty' }));
    }
    this.requestUiUpdate?.();
  }

  busy() { return this.age - this._at < 1.3; }

  pointerDown(p) {
    if (this.stage === S_GUESS) return;
    if (this.stage === S_TAKE || p.y < 470) this._set(this._grain === 'salt' ? 'sugar' : 'salt');
  }

  draw(ctx, c, t) {
    if (this.stage === S_GUESS) this._guess(ctx, c);
    else if (this.stage === S_BREAK) this._cards(ctx, c);
    else this._table(ctx, c, t);
  }

  _pop(at) { return reducedMotion() ? { scale: 1, alpha: 1, u: 2 } : popAt(this.age - this._at, at); }

  _guess(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 470);
    drawBench(ctx, c, 26, 654, 408);
    [[188, 'salt', 'salty stuff?', c.s1, 3], [492, 'sugar', 'sweet stuff?', c.s4, 9]].forEach(([x, name, guess, bg, seed], i) => {
      drawGrain(ctx, c, x, 288, 104, { seed });
      bigText(ctx, c, name, x, 120, 40, c.label);
      const p = this._pop(0.3 + i * 0.3);
      if (p) pill(ctx, c, guess, x, 66, { bg, size: 28, display: true, scale: p.scale, alpha: p.alpha, pop: p.u });
    });
  }

  _cards(ctx, c) {
    drawDepthField(ctx, c, { x: 340, y: 230, seed: 4 });
    const parts = SETS[this._grain], n = parts.length;
    const W = n === 2 ? 188 : 142, gap = n === 2 ? 40 : 28, y0 = 96, h = 310;
    const total = (n + 1) * W + n * gap;
    const x0 = 340 - total / 2;
    bigText(ctx, c, `what is in ${this._grain}?`, 340, 50, 32, c.label);
    parts.forEach((q, i) => {
      const x = x0 + i * (W + gap);
      this._card(ctx, c, x, y0, W, h, q, 0.05 + i * 0.16);
      if (i < n - 1) bigText(ctx, c, '+', x + W + gap / 2, y0 + h / 2, 40, c.label);
    });
    const x = x0 + n * (W + gap);
    bigText(ctx, c, '=', x - gap / 2, y0 + h / 2, 40, c.label);
    const p = this._pop(0.1 + n * 0.16);
    if (p) {
      ctx.save();
      ctx.globalAlpha *= p.alpha;
      drawCard(ctx, c, x, y0, W, h, 1, { accent: c.gold });
      drawGrain(ctx, c, x + W / 2, y0 + 118, W * 0.32, { seed: this._grain === 'salt' ? 3 : 9 });
      this._cardText(ctx, c, x, y0, W, h, this._grain, 'safe to eat');
      ctx.restore();
    }
  }

  _card(ctx, c, x, y, w, h, q, at) {
    const p = this._pop(at);
    if (!p) return;
    ctx.save();
    ctx.globalAlpha *= p.alpha;
    drawCard(ctx, c, x, y, w, h, 1, { accent: c.stroke });
    const cx = x + w / 2, cy = y + 118;
    if (q.kind === 'metal') this._sodium(ctx, c, cx, cy, w);
    else if (q.kind === 'coal') this._coal(ctx, c, cx, cy, w);
    else this._jar(ctx, c, cx, cy, w, q.kind === 'green');
    this._cardText(ctx, c, x, y, w, h, q.name, q.note);
    ctx.restore();
  }

  _cardText(ctx, c, x, y, w, h, name, note) {
    const big = w > 160 ? 30 : 24;
    bigText(ctx, c, name, x + w / 2, y + h - 88, big, c.label);
    ctx.save();
    ctx.font = font(c, 800, w > 160 ? 22 : 21, false);
    ctx.fillStyle = c.labelMuted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(note, x + w / 2, y + h - 46);
    ctx.restore();
  }

  _sodium(ctx, c, x, y, w) {
    const s = Math.min(1, w / 180);
    // a flame on a dish of water, the soft metal lump in the middle of it
    ctx.save();
    ctx.translate(x, y + 40); ctx.scale(s, s);
    ellipse(ctx, 0, 14, 76, 17); ctx.fillStyle = mix(c.water, c.bgSurface, 0.3); ctx.fill();
    ctx.strokeStyle = darken(c.water, 0.25); ctx.lineWidth = 3; ctx.stroke();
    for (const [dx, h, col] of [[-22, 66, c.flame], [20, 76, c.flame], [0, 104, c.flame], [0, 62, c.warning]]) {
      ctx.beginPath();
      ctx.moveTo(dx - 20, 2);
      ctx.quadraticCurveTo(dx - 24, -h * 0.5, dx, -h);
      ctx.quadraticCurveTo(dx + 24, -h * 0.5, dx + 20, 2);
      ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
    }
    rr(ctx, -28, -16, 56, 28, 8); ctx.fillStyle = mix(c.waste, c.label, 0.34); ctx.fill();
    ctx.strokeStyle = darken(c.waste, 0.3); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }

  _coal(ctx, c, x, y, w) {
    const r = w * 0.32, tone = isDay(c) ? c.label : mix(c.bgDeep, c.waste, 0.3);
    ctx.beginPath();
    [[-1, -0.2], [-0.5, -0.9], [0.25, -1], [1, -0.35], [0.9, 0.6], [0.1, 0.92], [-0.8, 0.7]].forEach(([a, b], i) => (i ? ctx.lineTo(x + a * r, y + b * r) : ctx.moveTo(x + a * r, y + b * r)));
    ctx.closePath();
    ctx.fillStyle = tone; ctx.fill();
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = isDay(c) ? darken(tone, 0.3) : lighten(tone, 0.25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 0.5 * r, y - 0.9 * r); ctx.lineTo(x - 0.1 * r, y - 0.1 * r); ctx.lineTo(x + r, y - 0.35 * r);
    ctx.moveTo(x - 0.1 * r, y - 0.1 * r); ctx.lineTo(x + 0.1 * r, y + 0.92 * r);
    ctx.strokeStyle = alpha(lighten(tone, 0.4), 0.6); ctx.lineWidth = 2.5; ctx.stroke();
  }

  _jar(ctx, c, x, y, w, green) {
    const jw = w * 0.56, jh = 118;
    const g = glassBox('jar', x - jw / 2, y - jh / 2, jw, jh, { wall: 5 });
    drawGlass(ctx, c, g, { shadow: false });
    if (green) drawGlassLiquid(ctx, c, g, { level: 0.92, fill: mix(c.s3, c.s2, 0.45), opacity: 0.72, meniscus: false, sheen: false });
    drawGlassFront(ctx, c, g, { shade: 0.1 });
  }

  _table(ctx, c, t) {
    drawDepthField(ctx, c, { x: 340, y: 260, seed: 5, t });
    const pick = this._grain;
    const pulse = reducedMotion() ? 1 : outBack(clamp01((this.age - this._at) / 0.4));
    const base = isDay(c) ? mix(c.s5, c.bgSurface, 0.7) : mix(c.s5, c.raised, 0.72);
    for (const [r, a, b] of ROWS) {
      for (let col = a; col <= b; col++) {
        rr(ctx, TX + col * TILE + 2, TY + r * TILE + 2, TILE - 4, TILE - 4, 6);
        ctx.fillStyle = base; ctx.fill();
      }
    }
    for (const [sym, [r, col, of]] of Object.entries(LIT)) {
      if (of !== pick) continue;
      const cx = TX + col * TILE + TILE / 2, cy = TY + r * TILE + TILE / 2;
      const s = 1 + 0.55 * pulse;
      const S = TILE * s;
      const bg = pick === 'salt' ? c.s1 : c.s4;
      rr(ctx, cx - S / 2, cy - S / 2 + 4, S, S, 10); ctx.fillStyle = darken(bg, 0.3); ctx.fill();
      rr(ctx, cx - S / 2, cy - S / 2, S, S, 10); ctx.fillStyle = bg; ctx.fill();
      bigText(ctx, c, sym, cx, cy + 1, 28, isDay(c) ? snow(c) : c.bgDeep);
    }
    bigText(ctx, c, 'about 118 kinds of atoms', 340, 58, 34, c.label);
    pill(ctx, c, pick === 'salt' ? 'salt uses these 2' : 'sugar uses these 3', 340, 150, { bg: pick === 'salt' ? c.s1 : c.s4, size: 24, display: true });
  }
}
