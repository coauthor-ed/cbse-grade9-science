// WhichDivisionGame - blk-l07-game. Eight real cases, one at a time: tap Mitosis or Meiosis. A wrong tap gives a true line
// and the case stays, so a learner can always finish. After a right tap the picture shows the result of that division.
// Eight rounds, then finishGame. Control names: .wd-pick[data-m] (mitosis, meiosis). Try again: .wd-again. No timer.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { artDefs } from '../shared/PlantArt.js';
import { cwDefs } from '../shared/CellWorld.js';
import { divCell, setOf, arrow, badge } from './DivideArt.js';

const CASES = [
  { m: 'mitosis', say: 'A small cut on your knee heals.', ok: 'New skin cells need the full set of chromosomes.' },
  { m: 'meiosis', say: 'Testes produce sperm.', ok: 'Sperm are gametes, so they have half the number.' },
  { m: 'mitosis', say: 'One fertilised egg becomes a body of trillions of cells.', ok: 'Every body cell keeps the same number.' },
  { m: 'meiosis', say: 'Anthers form pollen grains.', ok: 'Pollen grains later produce sperm cells, so this is meiosis.' },
  { m: 'mitosis', say: 'New hair grows after hair falls out.', ok: 'Growth and replacement use mitosis.' },
  { m: 'meiosis', say: 'Ovaries produce eggs.', ok: 'Eggs are gametes, in animals and in plants.' },
  { m: 'meiosis', say: 'A cell divides twice and forms four cells with half the number.', ok: 'That is what meiosis does.' },
  { m: 'mitosis', say: 'A cell forms two daughter cells, each identical to the parent.', ok: 'That is what mitosis does.' },
];
const WHY = {
  mitosis: 'Mitosis keeps the number the same. This case needs half the number.',
  meiosis: 'Meiosis makes gametes. This case is growth or repair.',
};
const SET = [{ h: 0, c: 'a' }, { h: 0, c: 'b' }, { h: 1, c: 'a' }, { h: 1, c: 'b' }], H2 = [{ h: 0, c: 'a' }, { h: 1, c: 'b' }];
function result(kind) {
  if (!kind) return divCell(84, 62, 46, { seed: 4 }) + setOf(SET, 84, 62, 0.42, { gap: 30 }) + badge(120, 26, 4, 13);
  if (kind === 'mitosis') {
    let s = divCell(24, 62, 22, { seed: 4, ring: false }) + setOf(SET, 24, 62, 0.22, { gap: 26 });
    [[112, 30], [112, 94]].forEach(([x, y], i) => { s += arrow(50, 62 + (i ? 8 : -8), x - 34, y, { w: 3, h: 6 }) + divCell(x, y, 28, { seed: 5 + i, ring: false }) + setOf(SET, x, y, 0.27, { gap: 26 }) + badge(x + 32, y - 14, 4, 12); });
    return s;
  }
  let s = divCell(20, 62, 18, { seed: 4, ring: false }) + setOf(SET, 20, 62, 0.18, { gap: 24 });
  [[74, 30], [122, 30], [74, 94], [122, 94]].forEach(([x, y], i) => { s += divCell(x, y, 21, { seed: 5 + i, ring: false }) + setOf(H2, x, y, 0.26, { gap: 28 }) + badge(x + 17, y - 19, 2, 10); });
  return s + arrow(40, 56, 50, 34, { w: 3, h: 6 }) + arrow(40, 68, 50, 90, { w: 3, h: 6 });
}

const CSS = `
.gm.wd { background: var(--sim-bg-deep); border-radius: 14px; padding: 8px 16px; gap: 6px; }
.wd .play { display: grid; grid-template-columns: 560px minmax(0, 1fr); gap: 14px; align-items: stretch; flex: 1; min-height: 0; }
.wd .card { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 12px; align-items: center; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--look-radius, 12px); box-shadow: var(--sim-lift, none); padding: 10px 12px; color: var(--sim-label); }
.wd .card svg { width: 170px; height: 124px; display: block; }
.wd .n { font-size: 17px; font-weight: 800; color: var(--sim-label-muted); }
.wd .card b { display: block; font: 600 22px/1.25 var(--sim-font-display); margin-top: 2px; }
.wd .ms { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; padding-top: 34px; align-content: start; }
.wd .wd-pick { display: flex; align-items: center; justify-content: center; min-height: 72px; font: 600 22px/1.1 var(--sim-font-display); }
.wd .wd-pick[data-shake="1"] { animation: wd-shake 0.3s ease; }
@keyframes wd-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.wd .why { min-height: 24px; margin: 0; font-size: 16px; line-height: 1.3; font-weight: 700; color: var(--sim-label); }
.wd .why[data-k="bad"] { color: var(--sim-bad); }
.wd .wd-again { display: none; width: 180px; }
.wd[data-done="1"] .wd-again { display: flex; align-items: center; justify-content: center; min-height: 48px; text-align: center; }
.wd[data-done="1"] .ms { display: none; }
.sim-dom-root--portrait .wd .play { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .wd .card { grid-template-columns: minmax(0, 1fr); padding: 8px; justify-items: center; text-align: center; }
.sim-dom-root--portrait .wd .card svg { width: 170px; height: 124px; }
.sim-dom-root--portrait .wd .card b { font-size: 18px; }
.sim-dom-root--portrait .wd .ms { grid-template-columns: repeat(2, minmax(0, 1fr)); padding-top: 0; }
.sim-dom-root--portrait .wd .wd-pick { font-size: 19px; min-height: 56px; }
.sim-dom-root--portrait .wd .wd-again { width: 100%; }
@media (prefers-reduced-motion: reduce) { .wd .wd-pick[data-shake="1"] { animation: none; } }
`;

export class WhichDivisionGame extends GameBoard {
  static HEIGHT = 326;
  static OBJECTIVE = { prompt: { en: 'Decide which division each case needs.' } };
  static ARIA_LABEL = 'Eight cases, one at a time. For each, tap Mitosis or Meiosis. After a right answer a small picture shows the cells that form.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm wd"><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${artDefs()}${cwDefs()}</defs></svg><div class="gm-head"><h2>Which division does this need?</h2></div>
        <div class="play"><div class="card"><svg viewBox="0 0 168 124" aria-hidden="true"></svg><div><span class="n"></span><b></b></div></div>
        <div class="ms"><div class="tap btn wd-pick" role="button" tabindex="0" data-m="mitosis">Mitosis</div><div class="tap btn wd-pick" role="button" tabindex="0" data-m="meiosis">Meiosis</div></div></div>
        <p class="why" aria-live="polite"></p><div class="tap btn wd-again" role="button" tabindex="0">Play again</div></div>`,
    });
    this.root.querySelectorAll('.wd-pick').forEach((el) => onTap(el, () => this._pick(el)));
    const again = this.root.querySelector('.wd-again');
    if (again) onTap(again, () => { this._reset(); this._draw(); });
    this._draw();
    this.quill?.speak('Ask one thing of each case: does it make gametes?', 5200);
  }
  _reset() { this._i = 0; this._line = ''; this._bad = false; this._last = null; }
  _draw() {
    const r = this.root, done = this._i >= CASES.length, c = CASES[Math.min(this._i, CASES.length - 1)];
    if (!r.querySelector('.gm')) return;
    r.querySelector('.gm').dataset.done = done ? '1' : '0';
    r.querySelector('.card svg').innerHTML = result(this._last);
    r.querySelector('.n').textContent = done ? 'All eight sorted' : `Case ${this._i + 1} of ${CASES.length}`;
    r.querySelector('.card b').textContent = done ? 'Mitosis gives two cells like the parent. Meiosis gives four cells with half the number.' : c.say;
    const w = r.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    this.relayout?.();
  }
  _pick(el) {
    if (this._i >= CASES.length) return;
    const c = CASES[this._i], id = el.dataset.m;
    if (id === c.m) {
      this._line = c.ok; this._bad = false; this._last = c.m; this._i += 1;
      this._draw();
      if (this._i >= CASES.length) finishGame(this);
    } else {
      this._line = WHY[id]; this._bad = true; el.dataset.shake = '1';
      setTimeout(() => { el.dataset.shake = '0'; }, 320);
      this._draw();
    }
  }
  checkObjective() { return this._i >= CASES.length ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._draw(); }
}
