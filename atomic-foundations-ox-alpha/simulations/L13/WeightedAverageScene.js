// WeightedAverageScene - companion to blk-l13-s3, "Where 35.5 Comes From".
// A weighted average is a balance point, so the hero is a plank marked from 35 to 37 u on a pivot.
// Atoms stand on the two marks and the pivot slides to where the plank balances.
//   b0  simple    one atom of each: the pivot sits at 36. The table says 35.5
//   b1  weighted  the learner changes the mix: at 3 to 1 the pivot reaches 35.5
//   b2  lakh      100 dots for 10 lakh atoms: tap any one, it is 35 or 37, never 35.5
//   b3  takeaway  the plank at 3 to 1 with the answer
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawCard, drawShadow, mix, darken, lighten, rr, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawBall } from 'simulations/base/kit/SimAtom.js';
import { say, tag, popIn } from '../L07/AtomBoard.js';
import { ballInk } from '../L12/MolKit.js';

const S_SIMPLE = 0, S_MIX = 1, S_LAKH = 2, S_TAKE = 3;
const X35 = 130, X37 = 550, BEAM_Y = 340;
const xOf = (m) => X35 + ((m - 35) / 2) * (X37 - X35);
const R = 38;
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;   // read once: a turned phone keeps its layout
const GRID = 10, CELL = 44, GX = 30, GY = 40;
const PATTERN = (() => {                              // 25 of the 100 dots are chlorine-37, scattered, the same every time
  const rnd = mulberry32(35), list = Array.from({ length: 100 }, (_, i) => i);
  for (let i = 99; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  const set = new Set(list.slice(0, 25));
  return Array.from({ length: 100 }, (_, i) => set.has(i));
})();

export class WeightedAverageScene extends SimScene {
  static BEAT_STEP_MAP = [S_SIMPLE, S_MIX, S_LAKH, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'a35', label: 'Add chlorine-35' },
    { type: 'button', id: 'a37', label: 'Add chlorine-37' },
    { type: 'button', id: 'again', label: 'Start again' },
  ];
  static ARIA_LABEL = 'A plank marked from 35 to 37 u balances on a pivot. With one atom of each isotope the pivot is at 36, but the table '
    + 'says 35.5. When the mix is three atoms of chlorine-35 to one of chlorine-37, the pivot moves to 35.5. A field of 100 dots stands for '
    + '10 lakh atoms, 7.5 lakh of 35 u and 2.5 lakh of 37 u: each one tapped is 35 or 37, and none is 35.5.';

  constructor(container, config) {
    super(container, config);
    this._a = 1; this._b = 1; this._fx = xOf(36);
    this._found = false;
    this._tapped = {};
    this._pick = null;
    this._done = false;
  }

  _avg() { return (this._a * 35 + this._b * 37) / (this._a + this._b); }

  enter(stage) {
    this._a = stage === S_TAKE ? 3 : 1;
    this._b = 1;
    this._fx = xOf(this._avg());
    this._found = false;
    this._tapped = {};
    this._pick = null;
    this._done = false;
  }

  busy() { return !reducedMotion() && (this.age < 1 || Math.abs(this._fx - xOf(this._avg())) > 0.5); }
  isControlHidden() { return this.stage !== S_MIX; }
  isControlDisabled(id) { return (id === 'a35' && this._a >= 6) || (id === 'a37' && this._b >= 6); }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'a35') this._add(1, 0);
    if (id === 'a37') this._add(0, 1);
    if (id === 'again') { this._a = 1; this._b = 1; }
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_MIX && p.y > 130) {
      if (p.x < 340) { if (this._a < 6) this._add(1, 0); } else if (this._b < 6) this._add(0, 1);
    }
    if (this.stage === S_LAKH) {
      const q = this._dotAt(p);
      if (!q) return;
      const { i, j, k } = q;
      this._pick = k;
      this._tapped[k] = true;
      if (Object.keys(this._tapped).length === 4 && !this._done) {
        this._done = true;
        this.celebrate(GX + (i + 0.5) * CELL, GY + (j + 0.5) * CELL, 20, { key: 'no-atom-35-5', lookAt: 'scene' });
      }
    }
    this.requestUiUpdate?.();
  }

  _add(a, b) {
    this._a += a; this._b += b;
    if (this._a === 3 * this._b && !this._found) {
      this._found = true;
      const at = xOf(35.5);
      this.after(0.7, () => this.celebrate(at, BEAM_Y + 40, 30, { key: 'three-to-one', lookAt: 'scene' }));
    }
  }

  update(d) {
    const to = xOf(this._avg());
    if (reducedMotion()) this._fx = to;
    else this._fx += (to - this._fx) * Math.min(1, d * 6);
  }

  // 100 dots cannot each be a fingertip wide, so on a phone a tap just off the field counts,
  // and a tap on a used dot takes the nearest fresh one.
  _dotAt(p) {
    const cell = (v, o) => Math.floor((v - o) / CELL), edge = PHONE ? CELL : 0;
    const off = (v, o) => v < o - edge || v > o + GRID * CELL + edge;
    if (off(p.x, GX) || off(p.y, GY)) return null;
    const at = (i, j) => ({ i, j, k: j * GRID + i });
    const q = at(Math.max(0, Math.min(GRID - 1, cell(p.x, GX))), Math.max(0, Math.min(GRID - 1, cell(p.y, GY))));
    if (!PHONE || !this._tapped[q.k]) return q;
    let best = q, far = Infinity;
    for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
      if (this._tapped[j * GRID + i]) continue;
      const d = Math.hypot(GX + (i + 0.5) * CELL - p.x, GY + (j + 0.5) * CELL - p.y);
      if (d < far && d < CELL * 2) { far = d; best = at(i, j); }
    }
    return best;
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: 340, y: 270, seed: 22, n: 8 });
    if (this.stage === S_LAKH) this._field(ctx, c);
    else this._plank(ctx, c);
  }

  _atoms(ctx, c, x, n, col, mass) {
    const perRow = 3;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / perRow), k = i % perRow;
      const inRow = Math.min(perRow, n - row * perRow);
      const ax = x + (k - (inRow - 1) / 2) * (R * 2 + 2), ay = BEAM_Y - 24 - R - row * (R * 1.86);
      drawBall(ctx, c, ax, ay, R, col);
      say(ctx, c, mass, ax, ay + 1, { size: 32, col: ballInk(c, col) });
    }
  }

  _plank(ctx, c) {
    const L = lookOf(), wood = mix(c.waste, c.s2, 0.35), a = this._a, b = this._b;
    const avg = this._avg(), n = a + b;
    // pivot, floor shadow, plank
    drawShadow(ctx, c, this._fx, BEAM_Y + 124, 90, 8);
    ctx.beginPath();
    ctx.moveTo(this._fx, BEAM_Y + 24); ctx.lineTo(this._fx + 54, BEAM_Y + 124); ctx.lineTo(this._fx - 54, BEAM_Y + 124); ctx.closePath();
    ctx.fillStyle = mix(c.stroke, c.label, 0.2); ctx.fill();
    ctx.strokeStyle = darken(mix(c.stroke, c.label, 0.2), 0.3); ctx.lineWidth = 4 * L.rim; ctx.lineJoin = 'round'; ctx.stroke();
    rr(ctx, 30, BEAM_Y + 8, 620, 20, 8); ctx.fillStyle = darken(wood, 0.34); ctx.fill();
    rr(ctx, 30, BEAM_Y - 22, 620, 44, 10); ctx.fillStyle = wood; ctx.fill();
    ctx.strokeStyle = darken(wood, 0.4); ctx.lineWidth = 3 * L.rim; ctx.stroke();
    rr(ctx, 40, BEAM_Y - 18, 600, 5, 2.5); ctx.fillStyle = lighten(wood, 0.3); ctx.fill();
    [35, 35.5, 36, 36.5, 37].forEach((m) => {
      const x = xOf(m);
      ctx.fillStyle = darken(wood, 0.5);
      if (!Number.isInteger(m)) { rr(ctx, x - 2, BEAM_Y - 12, 4, 26, 2); ctx.fill(); }
      else say(ctx, c, m, x, BEAM_Y + 1, { size: 28, col: ballInk(c, wood) });
    });
    this._atoms(ctx, c, X35, a, c.s3, 35);
    this._atoms(ctx, c, X37, b, c.s4, 37);
    // the reading
    drawCard(ctx, c, 110, 14, 460, 96, 1, { accent: Math.abs(avg - 35.5) < 0.001 ? c.good : c.stroke });
    const sum = `${a} \u00d7 35 + ${b} \u00d7 37 = ${a * 35 + b * 37}`;
    if (this.stage === S_SIMPLE) {
      say(ctx, c, '(35 + 37) \u00f7 2', 340, 42, { size: 28, col: c.labelMuted });
      say(ctx, c, '36 u', 340, 82, { size: 42 });
    } else {
      say(ctx, c, sum, 340, 42, { size: 28, col: c.labelMuted });
      say(ctx, c, `\u00f7 ${n} = ${avg.toFixed(2).replace(/0$/, '')} u`, 340, 82, { size: 38, col: Math.abs(avg - 35.5) < 0.001 ? c.good : c.label });
    }
    if (this.stage === S_SIMPLE) {
      const p = popIn(this.age, 0.5);
      if (p > 0) {
        tag(ctx, c, 'table: 35.5', xOf(35.5) - 30, BEAM_Y + 82, { size: 28, bg: c.warning, scale: Math.min(1.05, p) });
      }
    }
    if (this.stage === S_MIX && !this._found && a === 1 && b === 1) tag(ctx, c, 'tap a side to add atoms', 340, 170, { bg: c.warning, size: 25 });
    if (this.stage === S_TAKE) {
      const p = popIn(this.age, 0.4);
      if (p > 0) tag(ctx, c, 'an average, not one atom', 470, BEAM_Y + 90, { size: 26, bg: c.good, scale: Math.min(1.05, p) });
    }
  }

  _field(ctx, c) {
    PATTERN.forEach((heavy, k) => {
      const i = k % GRID, j = Math.floor(k / GRID);
      const x = GX + (i + 0.5) * CELL, y = GY + (j + 0.5) * CELL;
      const on = this._pick === k, seen = this._tapped[k];
      drawBall(ctx, c, x, y, on ? 21 : 17, heavy ? c.s4 : c.s3, { dim: seen && !on ? 0.25 : 0, focus: on ? 1 : 0 });
    });
    const x = 476, w = 190;
    drawCard(ctx, c, x, 40, w, 440, 1);
    say(ctx, c, '35 u', x + w / 2, 84, { size: 34, col: c.s3ink });
    say(ctx, c, '7.5 lakh', x + w / 2, 128, { size: 28 });
    say(ctx, c, '37 u', x + w / 2, 196, { size: 34, col: c.s4ink });
    say(ctx, c, '2.5 lakh', x + w / 2, 240, { size: 28 });
    ctx.fillStyle = c.stroke;
    rr(ctx, x + 18, 282, w - 36, 4, 2); ctx.fill();
    say(ctx, c, 'this atom', x + w / 2, 322, { size: 26, col: c.labelMuted });
    if (this._pick == null) tag(ctx, c, 'tap a dot', x + w / 2, 386, { bg: c.warning, size: 26 });
    else say(ctx, c, PATTERN[this._pick] ? '37 u' : '35 u', x + w / 2, 386, { size: 56, col: PATTERN[this._pick] ? c.s4ink : c.s3ink });
    if (this._done) say(ctx, c, 'never 35.5', x + w / 2, 446, { size: 26, col: c.good });
  }
}
