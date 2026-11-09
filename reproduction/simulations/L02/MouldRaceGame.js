// MouldRaceGame - blk-l02-s06. Class name kept. A fair test: set a dabba warm or cold, moist or dry, keep it three days, and
// the result fills one of four boxes. When all four are done, say what mould needs. Warm and moist grows; cold slows or
// stops it; dry does not grow. Control names: .mr-t[data-v] (warm, cold), .mr-w[data-v] (moist, dry), .mr-go,
// .mr-a[data-a] (warm, moist, both, dark). No timer. A wrong answer gets a line and stays open.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';

const KEYS = [['warm', 'moist'], ['warm', 'dry'], ['cold', 'moist'], ['cold', 'dry']];
const NAME = { warm: 'Warm', cold: 'Cold', moist: 'Moist', dry: 'Dry' };
const RES = (t, w) => (t === 'warm' && w === 'moist' ? 'Mould spreads' : t === 'cold' && w === 'moist' ? 'Slows or stops' : 'No mould');
const ANS = [['warm', 'Warmth alone'], ['moist', 'Moisture alone'], ['both', 'Warmth and moisture'], ['dark', 'Only the dark']];
const LINE = { warm: 'The warm, dry box stayed clean, so warmth alone is not enough.', moist: 'The cold, moist box slowed or stopped it, so moisture alone is not enough.', dark: 'All four boxes were kept dark, so the dark cannot explain the difference.' };
const dabba = (t, w, r) => `<svg viewBox="0 0 120 56" aria-hidden="true"><rect x="6" y="14" width="108" height="40" rx="7" style="fill:${t === 'cold' ? 'var(--sim-ice)' : 'color-mix(in oklab, var(--sim-strata-1) 40%, var(--sim-elev-peak))'};stroke:var(--sim-strata-5);stroke-width:3"/><rect x="2" y="6" width="116" height="10" rx="4" style="fill:color-mix(in oklab, var(--sim-strata-5) 50%, var(--sim-elev-peak));stroke:var(--sim-strata-5);stroke-width:2"/><rect x="24" y="34" width="72" height="9" rx="4" style="fill:var(--sim-strata-2);stroke:var(--sim-strata-3);stroke-width:2"/>${w === 'moist' ? '<rect x="10" y="44" width="100" height="7" rx="3" style="fill:var(--sim-sea-shallow)"/>' : ''}${r === 'Mould spreads' ? [30, 44, 58, 72, 86].map((x) => `<path d="M${x} 34v-11" style="stroke:var(--sim-strata-5);stroke-width:3;fill:none"/><circle cx="${x}" cy="22" r="3.4" style="fill:var(--sim-strata-6)"/>`).join('') : r === 'Slows or stops' ? '<circle cx="60" cy="31" r="3" style="fill:var(--sim-strata-6)"/>' : ''}</svg>`;

const CSS = `
.gm.mr { background: var(--sim-bg-deep); border-radius: 14px; padding: 8px 16px; gap: 6px; }
.mr .play { display: grid; grid-template-columns: 290px minmax(0, 1fr); gap: 14px; flex: 1; min-height: 0; align-items: start; }
.mr .set { display: flex; flex-direction: column; gap: 6px; }
.mr .row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.mr .mr-t, .mr .mr-w, .mr .mr-go, .mr .mr-a { display: flex; align-items: center; justify-content: center; text-align: center; min-height: 48px; }
.mr .tap[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 1px; background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); }
.mr .mr-go { background: var(--sim-accent); color: var(--sim-bg-deep); font-weight: 800; }
.mr .boxes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.mr .box { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 6px; text-align: center; min-height: 118px; box-shadow: 0 var(--sim-lift) 0 var(--sim-stroke); }
.mr .box[data-on="0"] { border-style: dashed; box-shadow: none; }
.mr .box svg { width: 100%; height: 50px; display: block; }
.mr .box b { display: block; font-size: 14px; line-height: 1.2; }
.mr .box i { display: block; font-style: normal; font-weight: 800; font-size: 15px; line-height: 1.2; margin-top: 2px; }
.mr .q { display: none; margin-top: 8px; }
.mr[data-all="1"] .q { display: block; }
.mr .q p { margin: 0 0 6px; font: 600 18px/1.2 var(--sim-font-display); }
.mr .as { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.mr .why { min-height: 22px; margin: 0; font-size: 15px; line-height: 1.3; font-weight: 700; }
.mr .why[data-k="bad"] { color: var(--sim-bad); }
.sim-dom-root:not(.sim-dom-root--portrait) .mr .boxes-wrap { padding-top: 24px; }
.sim-dom-root:not(.sim-dom-root--portrait) .mr .mr-t, .sim-dom-root:not(.sim-dom-root--portrait) .mr .mr-w, .sim-dom-root:not(.sim-dom-root--portrait) .mr .mr-go { min-height: 68px; font-size: 18px; }
.sim-dom-root:not(.sim-dom-root--portrait) .mr .set { gap: 10px; }
.sim-dom-root:not(.sim-dom-root--portrait) .mr[data-all="0"] .box { min-height: 250px; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
.sim-dom-root:not(.sim-dom-root--portrait) .mr[data-all="0"] .box svg { height: 112px; }
.sim-dom-root:not(.sim-dom-root--portrait) .mr[data-all="0"] .box b { font-size: 17px; }
.sim-dom-root:not(.sim-dom-root--portrait) .mr[data-all="0"] .box i { font-size: 18px; }
.sim-dom-root--portrait .mr .play { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .mr .set, .sim-dom-root--portrait .mr .boxes-wrap { width: 100%; }
.sim-dom-root--portrait .mr .boxes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.sim-dom-root--portrait .mr .as { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

export class MouldRaceGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'Test four dabbas and find what mould needs.' } };
  static ARIA_LABEL = 'Four dabbas: warm or cold, moist or dry. Keep each for three days and read the result, then say what mould needs.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm mr" data-all="0"><div class="gm-head"><p class="kicker">Four dabbas</p><h2>What does mould need?</h2></div>
      <div class="play"><div class="set"><div class="row"><div class="tap btn mr-t" role="button" tabindex="0" data-v="warm">Warm</div><div class="tap btn mr-t" role="button" tabindex="0" data-v="cold">Cold</div></div>
      <div class="row"><div class="tap btn mr-w" role="button" tabindex="0" data-v="moist">Moist</div><div class="tap btn mr-w" role="button" tabindex="0" data-v="dry">Dry</div></div>
      <div class="tap btn mr-go" role="button" tabindex="0">Keep for three days</div><p class="why" aria-live="polite"></p></div>
      <div class="boxes-wrap"><div class="boxes"></div><div class="q"><p>So what does mould need?</p><div class="as">${ANS.map(([a, t]) => `<div class="tap btn mr-a" role="button" tabindex="0" data-a="${a}">${t}</div>`).join('')}</div></div></div></div></div>`,
    });
    const r = this.root;
    r.querySelectorAll('.mr-t').forEach((el) => onTap(el, () => { this._t = el.dataset.v; this._draw(); }));
    r.querySelectorAll('.mr-w').forEach((el) => onTap(el, () => { this._w = el.dataset.v; this._draw(); }));
    const go = r.querySelector('.mr-go');
    if (go) onTap(go, () => { this._done[`${this._t}-${this._w}`] = true; this._line = `${NAME[this._t]} and ${NAME[this._w].toLowerCase()}: ${RES(this._t, this._w).toLowerCase()}.`; this._bad = false; this._draw(); });
    r.querySelectorAll('.mr-a').forEach((el) => onTap(el, () => this._ans(el.dataset.a)));
    this._draw();
    this.quill?.speak('Change one thing at a time.', 5200);
  }
  _reset() { this._t = 'warm'; this._w = 'moist'; this._done = {}; this._won = false; this._line = 'Set a dabba, then keep it.'; this._bad = false; }
  _all() { return KEYS.every(([t, w]) => this._done[`${t}-${w}`]); }
  _draw() {
    const r = this.root;
    if (!r.querySelector('.gm')) return;
    r.querySelector('.gm').dataset.all = this._all() ? '1' : '0';
    r.querySelectorAll('.mr-t').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.v === this._t)));
    r.querySelectorAll('.mr-w').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.v === this._w)));
    r.querySelector('.boxes').innerHTML = KEYS.map(([t, w]) => { const on = this._done[`${t}-${w}`], res = on ? RES(t, w) : ''; return `<div class="box" data-on="${on ? 1 : 0}">${dabba(t, w, res)}<b>${NAME[t]}, ${NAME[w].toLowerCase()}</b><i>${on ? res : 'Not tested'}</i></div>`; }).join('');
    const w = r.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    this.relayout?.();
  }
  _ans(a) {
    if (a === 'both') { this._won = true; this._line = 'Yes. Spores need warmth and moisture.'; this._bad = false; this._draw(); finishGame(this); } else { this._line = LINE[a]; this._bad = true; this._draw(); }
  }
  checkObjective() { return this._won ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._draw(); }
}
