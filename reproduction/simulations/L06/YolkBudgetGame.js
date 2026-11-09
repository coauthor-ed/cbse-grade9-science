// YolkBudgetGame - L06 blk-l06-s06. One fixed store of yolk, 600 units in this game (a made-up number). The learner chooses how many eggs share
// it. Round 1: each egg needs 150 or more to hatch as a young one. Round 2: each egg needs 10 or more to hatch as a larva, and the aim is as
// many eggs as possible. Control names: [data-n="2|4|6|15|30|60|120"], [data-act="lay"], [data-act="next"].
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { eggYolk, caterpillar, chick } from '../shared/FlowerArt.js';

const STORE = 600, YOUNG = 150, LARVA = 10;
const CHOICES = [2, 4, 6, 15, 30, 60, 120];
const ROUNDS = [
  { title: 'Hatch young ones, not larvae', sub: 'An egg needs 150 units of yolk to hatch as a young one. Find the most eggs that can do it.', best: 4 },
  { title: 'Lay as many as you can', sub: 'An egg needs 10 units of yolk to hatch as a larva. Find the most eggs that can do it.', best: 60 },
];
const CSS = `
.yb { background: var(--sim-bg-deep); }
.yb .board { display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 12px; align-items: start; }
.yb .pic { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); overflow: hidden; }
.yb .pic svg { display: block; width: 100%; height: auto; }
.yb .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.yb .nums { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.yb .btn { min-height: 48px; padding: 2px 4px; }
.yb .btn[aria-pressed="true"] { background: color-mix(in oklab, var(--sim-accent) 34%, var(--sim-bg-surface)); border-color: var(--sim-accent); }
.yb .read { font: 600 22px/1.15 var(--sim-font-display); margin: 0; }
.yb .small { font: 700 15px/1.25 var(--sim-font); margin: 0; color: var(--sim-label-muted); }
.yb .msg { font: 700 15px/1.3 var(--sim-font); margin: 0; min-height: 40px; }
.yb .go { background: var(--sim-accent); color: var(--sim-bg-deep); min-width: 150px; }
.sim-dom-root:not(.sim-dom-root--portrait) .yb .gm-head .kicker { display: none; }
.sim-dom-root:not(.sim-dom-root--portrait) .yb .board { grid-template-columns: 500px minmax(0, 1fr); }
.sim-dom-root:not(.sim-dom-root--portrait) .yb .nums { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.sim-dom-root:not(.sim-dom-root--portrait) .yb .side { padding-top: 10px; gap: 10px; }
.sim-dom-root--portrait .yb .board { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .yb .msg:empty { display: none; }
.sim-dom-root--portrait .yb .sub { padding-right: 62px; }
.sim-dom-root--portrait .yb .go { width: 100%; }
.sim-dom-root--portrait .yb .nums { grid-template-columns: repeat(4, minmax(0, 1fr)); }
`;
function pic(n, st) {
  const W = 360, H = 210, each = STORE / n;
  // a warm box of straw, drawn the same for every choice, so that only the eggs change
  let s = `<defs><linearGradient id="yb-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:color-mix(in oklab, var(--sim-strata-1) 42%, var(--sim-elev-peak))"/><stop offset="1" style="stop-color:color-mix(in oklab, var(--sim-strata-2) 62%, var(--sim-elev-peak))"/></linearGradient></defs><rect width="${W}" height="${H}" style="fill:url(#yb-w)"/>`;
  for (let i = 0; i < 70; i++) { const a = (i * 71) % W, b = (i * 37) % H, l = 14 + (i % 5) * 5, u = i % 2 ? 1 : -1; s += `<path d="M${a} ${b}q${l / 2} ${u * 5} ${l} ${u * ((i % 3) - 1) * 4}" style="fill:none;stroke:var(--sim-strata-${i % 3 ? 3 : 2});stroke-width:1.5;opacity:0.5;stroke-linecap:round"/>`; }
  const shown = Math.min(n, 60), cols = Math.ceil(Math.sqrt(shown * 2)), g = Math.min(50, (W - 20) / cols), rows = Math.ceil(shown / cols), r = Math.max(5.5, Math.min(22, g * 0.42));
  for (let i = 0; i < shown; i++) {
    const x = 10 + g * (i % cols + 0.5) + (W - 20 - g * cols) / 2, y = 10 + (Math.floor(i / cols) + 0.5) * ((H - 30) / rows);
    s += st ? (st === 'young' ? chick(x, y, r / 26, {}) : st === 'larva' ? caterpillar(x, y, r / 24, {}) : eggYolk(x, y, 1, { r, yolk: 0.08 })) : eggYolk(x, y, 1, { r, yolk: Math.min(0.75, 0.06 + each / 400) });
  }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${n} eggs sharing one store of yolk">${s}</svg>`;
}

export class YolkBudgetGame extends GameBoard {
  static ARIA_LABEL = 'Share one store of yolk between eggs. Find how many eggs can each hatch as a young one, then how many can each hatch as a larva.';
  static OBJECTIVE = { prompt: { en: 'Find the most eggs that can hatch young ones, then the most that can hatch larvae.' } };
  static PORTRAIT_HEIGHT = 700;
  constructor(container, config) { super(container, config); this._reset(); }
  _reset() { this._r = 0; this._n = 15; this._st = null; this._ok = false; this._won = false; this._msg = ''; }
  async setup() {
    await super.setup();
    mountGame(this, { check: false, css: CSS, html: `<div class="gm yb"><div class="gm-head"><p class="kicker">One store of yolk</p><h2 data-title></h2><p class="sub" data-sub></p></div>
      <div class="board"><div class="pic" data-pic></div><div class="side"><p class="read" data-read></p><p class="small">Game numbers are made up.</p>
      <div class="nums">${CHOICES.map((n) => `<button class="btn tap" data-n="${n}">${n}</button>`).join('')}</div>
      <p class="msg" data-msg aria-live="polite"></p><div><button class="btn tap go" data-act="lay">Lay eggs</button> <button class="btn tap go" data-act="next" hidden>Next</button></div></div></div></div>` });
    this.root.querySelectorAll('[data-n]').forEach((b) => onTap(b, () => { if (this._ok) return; this._n = +b.dataset.n; this._st = null; this._msg = ''; this._paint(); }));
    this.root.querySelector('[data-act="lay"]')?.addEventListener('click', () => this._lay());
    this.root.querySelector('[data-act="next"]')?.addEventListener('click', () => { this._r = 1; this._n = 15; this._st = null; this._ok = false; this._msg = ''; this._paint(); });
    this._paint();
  }
  _lay() {
    const each = STORE / this._n, R = ROUNDS[this._r], n = this._n;
    this._st = each >= YOUNG ? 'young' : each >= LARVA ? 'larva' : 'none';
    if (n === R.best) {
      this._ok = true;
      this._msg = this._r ? 'Each egg gets just enough for a larva, as in fish, frogs and insects.' : 'Each egg gets enough to hatch a young one, as in reptiles and birds.';
      this.quill?.perform?.('nod');
      if (this._r) { this._won = true; this._paint(); finishGame(this); return; }
    } else if (this._r === 0) {
      this._msg = each >= YOUNG ? `All ${n} hatch as young ones. Can more eggs still do it?` : `Each egg has only ${Math.floor(each)} units. Try fewer eggs.`;
      this.quill?.perform?.('shake');
    } else {
      this._msg = each >= LARVA ? `All ${n} hatch as larvae. Can more eggs still do it?` : `Each egg has only ${each} units, too little to hatch. Try fewer eggs.`;
      this.quill?.perform?.('shake');
    }
    this._paint();
  }
  checkObjective() { return this._won ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._paint(); }
  _paint() {
    const r = this.root; if (!r?.querySelector?.('[data-pic]')) return;
    const R = ROUNDS[this._r], n = this._n;
    r.querySelector('[data-title]').textContent = R.title; r.querySelector('[data-sub]').textContent = R.sub;
    r.querySelector('[data-pic]').innerHTML = pic(n, this._st);
    r.querySelector('[data-read]').textContent = `${n} eggs, ${STORE / n} units each`;
    r.querySelector('[data-msg]').textContent = this._msg;
    r.querySelectorAll('[data-n]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.n === n)));
    r.querySelector('[data-act="lay"]').hidden = this._ok;
    r.querySelector('[data-act="next"]').hidden = !(this._ok && this._r === 0);
  }
}
