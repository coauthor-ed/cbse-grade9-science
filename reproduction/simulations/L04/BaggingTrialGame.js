// BaggingTrialGame - L04 blk-l04-s06. Two young buds and three open flowers on one pea plant. The learner sets a bag and the stamens on
// each, waits, and reads pods. Finding a flower with no pod opens the why question. A win is the right reason.
// Control names: [data-bag="0..4"], [data-stamens="0..4"], [data-act="wait"], [data-act="again"], [data-why="a|b|c"].
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { peaFlower } from '../shared/FlowerArt.js';

const FLOWERS = [{ stage: 'bud', name: 'Young bud' }, { stage: 'bud', name: 'Young bud' }, { stage: 'open', name: 'Open flower' }, { stage: 'open', name: 'Open flower' }, { stage: 'open', name: 'Open flower' }];
const WHY = [
  { id: 'a', text: 'The bag kept out all the air', ok: false, say: 'Bags are loose muslin, and other bagged flowers gave pods.' },
  { id: 'b', text: 'No pollen ever reached its stigma', ok: true, say: 'Yes. Its own pollen was removed, and the bag kept outside pollen away.' },
  { id: 'c', text: 'A young bud can never give a pod', ok: false, say: 'A young bud with its stamens left in does give a pod.' },
];
const CSS = `
.sim-dom-root:not(.sim-dom-root--portrait) .bt .gm-head .kicker { display: none; }
.sim-dom-root:not(.sim-dom-root--portrait) .bt { gap: 6px; padding: 8px 14px; }
.sim-dom-root:not(.sim-dom-root--portrait) .bt .why .btn { min-height: 44px; }
/* The guide stands at the end of the action row, clear of the cards. */
.sim-dom-root:not(.sim-dom-root--portrait) .q-mascot { left: auto !important; right: 26px; top: 243px !important; width: 40px !important; height: 50px !important; }
.sim-dom-root:not(.sim-dom-root--portrait) .bt .acts { padding-right: 56px; }
.bt .row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.bt .card { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 4px 6px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; }
.bt { background: var(--sim-bg-deep); }
.bt .picrow { display: flex; align-items: center; justify-content: center; gap: 2px; height: 62px; width: 100%; }
.bt .picrow > div { flex: 0 1 84px; min-width: 0; }
.bt .card svg { display: block; width: 100%; height: 60px; }
.bt .name { font: 700 15px/1.1 var(--sim-font); margin: 0; }
.bt .res { font: 600 17px/1.05 var(--sim-font-display); margin: 0; flex: none; text-align: center; }
.bt .res:empty { display: none; }
.bt .btn:disabled { opacity: 1; color: var(--sim-label-muted); cursor: default; }
.bt .res[data-no="1"] { color: var(--sim-bad); }
.bt .btn { width: 100%; padding: 2px 4px; min-height: 44px; font-size: 14px; line-height: 1.1; }
.bt .btn[aria-pressed="true"] { background: color-mix(in oklab, var(--sim-accent) 30%, var(--sim-bg-surface)); }
.bt .acts { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; min-height: 48px; }
.bt .acts .btn { width: auto; min-width: 150px; padding: 4px 14px; }
.bt .go { background: var(--sim-accent); color: var(--sim-bg-deep); }
.bt .msg { font: 700 15px/1.3 var(--sim-font); margin: 0; flex: 1 1 200px; min-width: 0; }
.bt .why { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.bt .why[hidden] { display: none; }
.sim-dom-root--portrait .bt .gm-head .kicker { display: none; }
.sim-dom-root--portrait .bt { gap: 6px; }
.sim-dom-root--portrait .bt .row { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.sim-dom-root--portrait .bt[data-done="1"] .card { grid-template-rows: auto 35px 35px; }
.sim-dom-root--portrait .bt[data-done="1"] .card svg { height: 46px; }
.sim-dom-root--portrait .bt[data-done="1"] .picrow { gap: 0; }
.sim-dom-root--portrait .bt[data-done="1"] .btn:disabled { min-height: 28px; font-size: 13px; box-shadow: none; }
.sim-dom-root--portrait .bt[data-done="1"] .card:last-child { grid-template-rows: auto 66px; }
.sim-dom-root--portrait .bt .card { display: grid; grid-template-columns: 56px minmax(0, 1fr); grid-template-rows: auto 44px 44px; gap: 2px 4px; padding: 3px 5px 5px; align-items: center; justify-items: stretch; }
.sim-dom-root--portrait .bt .name { grid-column: 1 / -1; text-align: center; }
.sim-dom-root--portrait .bt .picrow { grid-column: 1; grid-row: 2 / 4; height: auto; flex-direction: column; }
.sim-dom-root--portrait .bt .picrow > div { flex: none; width: 56px; }
.sim-dom-root--portrait .bt .res { font-size: 15px; }
.sim-dom-root--portrait .bt .btn { font-size: 14px; padding: 2px; }
.sim-dom-root--portrait .bt .card:last-child { grid-column: 1 / -1; grid-template-columns: 56px minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: auto 56px; }
.sim-dom-root--portrait .bt .card:last-child .picrow { grid-row: 2; }
.sim-dom-root--portrait .bt .why { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .bt .acts .btn { flex: 1 1 100%; }
`;
const pic = (f, st, pod) => `<svg viewBox="-66 -96 140 120" aria-hidden="true">${peaFlower(pod === 'yes' ? -46 : 0, pod === 'yes' ? -30 : 0, 1, { stage: f.stage, stamens: st.stamens, bag: pod ? false : st.bag, pod: pod === 'yes' })}</svg>`;

export class BaggingTrialGame extends GameBoard {
  static ARIA_LABEL = 'Five pea flowers. Set a bag and the stamens on each, wait for pods, find the flower with no pod and say why.';
  static OBJECTIVE = { prompt: { en: 'Find a flower that gives no pod, then say why.' } };
  static PORTRAIT_HEIGHT = 620;
  constructor(container, config) { super(container, config); this._reset(); }
  _reset() { this._st = FLOWERS.map(() => ({ bag: false, stamens: true })); this._done = false; this._won = false; this._msg = 'Tap to change each flower, then wait.'; this._picked = null; }
  async setup() {
    await super.setup();
    mountGame(this, { check: false, css: CSS, html: `<div class="gm bt"><div class="gm-head"><p class="kicker">Pea flowers</p><h2>Find the flower with no pod</h2></div>
      <div class="row">${FLOWERS.map((f, i) => `<div class="card"><p class="name">${f.name}</p><div class="picrow"><div data-pic="${i}"></div><p class="res" data-res="${i}"></p></div>
        <button class="btn tap" data-bag="${i}"></button><button class="btn tap" data-stamens="${i}"></button></div>`).join('')}</div>
      <div class="acts"><button class="btn tap go" data-act="wait">Wait for pods</button><button class="btn tap" data-act="again" hidden>Change the flowers</button><p class="msg" data-msg aria-live="polite"></p></div>
      <div class="why" data-whyrow hidden>${WHY.map((w) => `<button class="btn tap" data-why="${w.id}">${w.text}</button>`).join('')}</div></div>` });
    this.root.querySelectorAll('[data-bag]').forEach((b) => onTap(b, () => { if (this._done) return; const s = this._st[+b.dataset.bag]; s.bag = !s.bag; this._paint(); }));
    this.root.querySelectorAll('[data-stamens]').forEach((b) => onTap(b, () => { if (this._done) return; const s = this._st[+b.dataset.stamens]; s.stamens = !s.stamens; this._paint(); }));
    this.root.querySelector('[data-act="wait"]')?.addEventListener('click', () => this._wait());
    this.root.querySelector('[data-act="again"]')?.addEventListener('click', () => { this._done = false; this._msg = 'Change a flower, then wait again.'; this._paint(); });
    this.root.querySelectorAll('[data-why]').forEach((b) => onTap(b, () => this._why(b.dataset.why)));
    this._paint();
  }
  _pod(i) { const f = FLOWERS[i], s = this._st[i]; return f.stage === 'open' || s.stamens || !s.bag; }
  _wait() {
    this._done = true;
    const none = FLOWERS.some((_, i) => !this._pod(i));
    this._msg = none ? 'One flower gave no pod. Why?' : 'Every flower gave a pod. Try a young bud with its stamens removed and a bag on.';
    this._paint();
  }
  _why(id) {
    const w = WHY.find((x) => x.id === id);
    this._msg = w.say; this._picked = id;
    if (w.ok) { this._won = true; this.quill?.perform?.('hop'); this._paint(); finishGame(this); } else { this.quill?.perform?.('shake'); this._paint(); }
  }
  checkObjective() { return this._won ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._paint(); }
  _paint() {
    const r = this.root; if (!r?.querySelector?.('[data-pic]')) return;
    FLOWERS.forEach((f, i) => {
      const s = this._st[i], pod = this._done ? (this._pod(i) ? 'yes' : 'no') : null;
      r.querySelector(`[data-pic="${i}"]`).innerHTML = pod === 'no' ? pic(f, { ...s, bag: false }, null) : pic(f, s, pod);
      const res = r.querySelector(`[data-res="${i}"]`); res.textContent = pod === 'yes' ? 'Pod' : pod === 'no' ? 'No pod' : ''; res.dataset.no = pod === 'no' ? '1' : '0';
      const b = r.querySelector(`[data-bag="${i}"]`); b.textContent = s.bag ? 'Bag on' : 'No bag'; b.setAttribute('aria-pressed', String(s.bag)); b.disabled = this._done;
      const t = r.querySelector(`[data-stamens="${i}"]`); t.textContent = s.stamens ? 'Stamens in' : 'Stamens out'; t.setAttribute('aria-pressed', String(!s.stamens)); t.disabled = this._done;
    });
    r.querySelector('.bt').dataset.done = this._done ? '1' : '0';
    r.querySelector('[data-msg]').textContent = this._msg;
    r.querySelector('[data-act="wait"]').hidden = this._done;
    const a = r.querySelector('[data-act="again"]'); a.hidden = !this._done || this._won;
    r.querySelector('[data-whyrow]').hidden = !(this._done && FLOWERS.some((_, i) => !this._pod(i)));
  }
}
