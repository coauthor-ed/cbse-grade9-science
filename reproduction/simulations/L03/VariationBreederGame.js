// VariationBreederGame - blk-l03-s07. Class name kept. Make all eight kinds of gamete: tap one bead in each pair, press Make,
// and the set lands in the eight-slot board with what it stands for. A repeat says so and is not lost. Win when all eight are
// made. Control names: .bg-b[data-p][data-d], .bg-make, .bg-again. No timer.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';

const PAIRS = [{ s: 3, a: 'Blonde', b: 'Black' }, { s: 1, a: 'Straight', b: 'Curly' }, { s: 4, a: 'Brown eyes', b: 'Black eyes' }];
const col = (i, d) => (d ? `color-mix(in oklab, var(--sim-series-${PAIRS[i].s}) 78%, black)` : `color-mix(in oklab, var(--sim-series-${PAIRS[i].s}) 50%, var(--sim-elev-peak))`);
const CSS = `
.gm.bg { background: var(--sim-bg-deep); border-radius: 14px; padding: 8px 16px; gap: 6px; }
.bg .play { display: grid; grid-template-columns: 410px minmax(0, 1fr); gap: 14px; flex: 1; min-height: 0; align-items: start; }
.bg .pairs { display: flex; flex-direction: column; gap: 6px; }
.bg .row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.bg .bg-b { display: flex; align-items: center; gap: 8px; min-height: 52px; font-size: 15px; font-weight: 800; }
.bg .bg-b i { flex: 0 0 26px; height: 26px; border-radius: 50%; background: var(--c); border: 2px solid color-mix(in oklab, var(--c) 60%, black); }
.bg .bg-b[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 1px; background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); }
.bg .bg-make, .bg .bg-again { display: flex; align-items: center; justify-content: center; min-height: 48px; font-weight: 800; }
.bg .bg-make { background: var(--sim-accent); color: var(--sim-bg-deep); }
.bg .acts { display: flex; gap: 6px; }
.bg .acts > * { flex: 1 1 0; text-align: center; }
.bg .bg-again { display: none; }
.bg[data-done="1"] .bg-again { display: flex; }
.bg .why { min-height: 22px; margin: 0; font-size: 15px; line-height: 1.3; font-weight: 700; }
.bg .why[data-k="bad"] { color: var(--sim-bad); }
.bg .board { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.bg .slot { min-height: 100px; padding: 6px; border-radius: var(--sim-radius-lg); background: var(--sim-bg-surface); border: var(--sim-border); text-align: center; font-size: 14px; line-height: 1.2; font-weight: 700; }
.bg .slot[data-on="0"] { border-style: dashed; opacity: 0.6; }
.bg .slot u { display: flex; gap: 4px; justify-content: center; text-decoration: none; margin-bottom: 4px; }
.bg .slot u b { width: 18px; height: 18px; border-radius: 50%; background: var(--c); border: 2px solid color-mix(in oklab, var(--c) 60%, black); }
.sim-dom-root:not(.sim-dom-root--portrait) .bg .play { align-items: stretch; }
.sim-dom-root:not(.sim-dom-root--portrait) .bg .board { grid-auto-rows: 1fr; padding-top: 26px; gap: 8px; }
.sim-dom-root:not(.sim-dom-root--portrait) .bg .slot { min-height: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 15px; }
.sim-dom-root:not(.sim-dom-root--portrait) .bg .slot u b { width: 26px; height: 26px; }
.sim-dom-root--portrait .bg .play { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .bg .pairs { width: 100%; }
.sim-dom-root--portrait .bg .board { width: 100%; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
.sim-dom-root--portrait .bg .slot { min-height: 92px; padding: 5px 2px; font-size: 13px; }
`;

export class VariationBreederGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'Make all eight kinds of gamete from three pairs of beads.' } };
  static ARIA_LABEL = 'Pick one bead from each of three pairs and make a gamete. Find all eight kinds.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm bg" data-done="0"><div class="gm-head"><p class="kicker">Three pairs of beads</p><h2>Make all eight gametes</h2></div>
      <div class="play"><div class="pairs">${PAIRS.map((p, i) => `<div class="row">${[p.a, p.b].map((t, d) => `<div class="tap btn bg-b" role="button" tabindex="0" data-p="${i}" data-d="${d}" style="--c:${col(i, d)}"><i></i>${t}</div>`).join('')}</div>`).join('')}
      <div class="acts"><div class="tap btn bg-make" role="button" tabindex="0">Make this gamete</div><div class="tap btn bg-again" role="button" tabindex="0">Play again</div></div><p class="why" aria-live="polite"></p></div>
      <div class="board"></div></div></div>`,
    });
    const r = this.root;
    r.querySelectorAll('.bg-b').forEach((el) => onTap(el, () => { this._sel[+el.dataset.p] = +el.dataset.d; this._draw(); }));
    const mk = r.querySelector('.bg-make'), ag = r.querySelector('.bg-again');
    if (mk) onTap(mk, () => this._make());
    if (ag) onTap(ag, () => { this._reset(); this._draw(); });
    this._draw();
    this.quill?.speak('One bead from each pair.', 5200);
  }
  _reset() { this._sel = [0, 0, 0]; this._made = []; this._line = 'Pick one bead from each pair.'; this._bad = false; }
  _key(s) { return s[0] * 4 + s[1] * 2 + s[2]; }
  _make() {
    const k = this._key(this._sel);
    if (this._made.includes(k)) { this._line = 'You have made that one. Change one bead.'; this._bad = true; this._draw(); return; }
    this._made.push(k); this._line = `${this._made.length} of 8.`; this._bad = false;
    if (this._made.length === 8) this._line = 'All eight. Three pairs give 2 x 2 x 2 kinds.';
    this._draw();
    if (this._made.length === 8) finishGame(this);
  }
  _draw() {
    const r = this.root, done = this._made.length === 8;
    if (!r.querySelector('.gm')) return;
    r.querySelector('.gm').dataset.done = done ? '1' : '0';
    r.querySelectorAll('.bg-b').forEach((el) => el.setAttribute('aria-pressed', String(this._sel[+el.dataset.p] === +el.dataset.d)));
    r.querySelector('.board').innerHTML = Array.from({ length: 8 }, (_, i) => {
      const k = this._made[i];
      if (k === undefined) return '<div class="slot" data-on="0"></div>';
      const b = [(k >> 2) & 1, (k >> 1) & 1, k & 1];
      return `<div class="slot" data-on="1"><u>${b.map((d, p) => `<b style="--c:${col(p, d)}"></b>`).join('')}</u>${b.map((d, p) => (d ? PAIRS[p].b : PAIRS[p].a)).join(', ')}</div>`;
    }).join('');
    const w = r.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    this.relayout?.();
  }
  checkObjective() { return this._made.length === 8 ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._draw(); }
}
