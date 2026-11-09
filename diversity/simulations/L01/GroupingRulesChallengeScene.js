// GroupingRulesChallengeScene - blk-l01-s07, a mini-game. Six sightings, two rounds. Round 1 sorts by where seen, round 2 by
// body covering. A sighting with no note for this round goes to Not noted: guessing is the wrong move. Tap a tile, tap a bin,
// then Check this round. A wrong tile goes back with its reason, so a learner can always finish.
// Controls: .gr-tile[data-id], .gr-bin[data-bin], .gr-go.
import { GameBoard, mountGame, finishGame, onTap } from 'simulations/base/kit/GameFrame.js';

const TILES = [
  { id: 'A', where: 'air', cover: 'feathers' }, { id: 'B', where: 'air', cover: 'hair' }, { id: 'C', where: 'tree', cover: 'feathers' },
  { id: 'D', where: 'tree', cover: 'hair' }, { id: 'E', where: 'air', cover: '' }, { id: 'F', where: '', cover: 'hair' },
];
const ROUNDS = [
  { key: 'where', title: 'Round 1: where seen', bins: [['air', 'In the air'], ['tree', 'In a tree'], ['', 'Not noted']] },
  { key: 'cover', title: 'Round 2: body covering', bins: [['feathers', 'Feathers'], ['hair', 'Hair'], ['', 'Not noted']] },
];
const WORD = { air: 'In the air', tree: 'In a tree', feathers: 'Feathers', hair: 'Hair', '': 'Not noted' };
const CSS = `
.gr .board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr); gap: 16px; align-items: start; }
.gr .tray { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.gr .gr-tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; padding: 4px; min-height: 84px; text-align: center; line-height: 1.15; }
.gr .gr-tile b { font: 700 26px/1 var(--sim-font-display); color: var(--sim-accent); }
.gr .gr-tile span { font-size: 14px; font-weight: 700; color: var(--sim-label); }
.gr .gr-tile[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 1px; background: color-mix(in oklab, var(--sim-accent) 14%, var(--sim-bg-surface)); }
.gr .gr-tile[data-placed="1"] { opacity: 0.45; border-style: dashed; }
.gr .bins { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.gr .gr-bin { display: flex; flex-direction: column; gap: 6px; padding: 8px; min-height: 148px; text-align: left; border-style: dashed; box-shadow: none; }
.gr .gr-bin .lbl { font-weight: 800; font-size: 15px; }
.gr .gr-bin .held { display: flex; flex-wrap: wrap; gap: 4px; }
.gr .gr-bin .held i { font: 700 18px/30px var(--sim-font-display); width: 32px; height: 32px; text-align: center; border-radius: var(--sim-radius-sm); background: var(--sim-bg-deep); border: calc(1.5px * var(--look-rim)) solid var(--sim-stroke); pointer-events: none; }
.gr .foot { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.gr .say { flex: 1 1 auto; margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; min-height: 40px; }
.gr .gr-go { flex: none; min-width: 180px; }
.gr .gr-go:disabled { opacity: 0.5; cursor: default; }
.gm-quill .sim-dom-root--portrait .gr .sub { padding-right: 56px; }
.sim-dom-root--portrait .gr .gr-tile { min-height: 70px; }
.sim-dom-root--portrait .gr .board { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .gr .tray { width: 100%; }
.sim-dom-root--portrait .gr .bins { width: 100%; }
.sim-dom-root--portrait .gr .gr-bin { min-height: 100px; padding: 6px; }
.sim-dom-root--portrait .gr .foot { flex-direction: column; align-items: stretch; }
.sim-dom-root--portrait .gr .gr-go { width: 100%; }
`;

export class GroupingRulesChallengeScene extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'Sort six sightings twice, once by where they were seen and once by body covering.' } };
  static HEIGHT = 358;
  static ARIA_LABEL = 'A sorting game with six lettered sightings and two rounds. Round 1 sorts by where each was seen. Round 2 sorts by body covering. A sighting with no note goes to Not noted.';

  _r = 0; _at = {}; _pick = null; _won = false; _move = false;

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm gr"><div class="gm-head"><p class="kicker">Challenge</p><h2 class="gr-title"></h2><p class="sub">Tap a tile, then a bin. A dash means nobody noted it.</p></div>
        <div class="board"><div class="tray"></div><div class="bins"></div></div>
        <div class="foot"><p class="say" aria-live="polite"></p><button type="button" class="tap btn gr-go">Check this round</button></div></div>`,
    });
    this._el = (s) => this.root.querySelector(s);
    this._el('.gr-go')?.addEventListener('click', (e) => { e.stopPropagation(); this._go(); });
    this._draw('Sort every tile by what it says.');
  }
  _draw(say) {
    const R = ROUNDS[this._r], tray = this._el('.tray'), bins = this._el('.bins');
    if (!tray) return;
    this._el('.gr-title').textContent = R.title;
    tray.innerHTML = TILES.map((t) => `<div class="tap btn gr-tile" role="button" tabindex="0" data-id="${t.id}" aria-pressed="${this._pick === t.id}" data-placed="${this._at[t.id] !== undefined ? 1 : 0}" aria-label="Sighting ${t.id}: ${WORD[t[R.key]]}"><b>${t.id}</b><span>${t[R.key] ? WORD[t[R.key]] : '-'}</span></div>`).join('');
    bins.innerHTML = R.bins.map(([k, label]) => `<div class="tap btn gr-bin" role="button" tabindex="0" data-bin="${k}"><span class="lbl">${label}</span><span class="held">${TILES.filter((t) => this._at[t.id] === k).map((t) => `<i>${t.id}</i>`).join('')}</span></div>`).join('');
    tray.querySelectorAll('.gr-tile').forEach((el) => onTap(el, () => { const id = el.dataset.id; delete this._at[id]; this._pick = id; this._move = true; this._draw('Now tap a bin.'); }));
    bins.querySelectorAll('.gr-bin').forEach((el) => onTap(el, () => { if (this._pick === null) { this._say('Tap a tile first.'); return; } this._at[this._pick] = el.dataset.bin; this._pick = null; this._draw(''); }));
    const btn = this._el('.gr-go'); if (btn) { btn.disabled = Object.keys(this._at).length < TILES.length; btn.textContent = this._r ? 'Check round 2' : 'Check round 1'; }
    if (say !== undefined) this._say(say);
    this.relayout?.();
  }
  _say(s) { const e = this._el('.say'); if (e) e.textContent = s; }
  _go() {
    const key = ROUNDS[this._r].key, wrong = TILES.filter((t) => this._at[t.id] !== t[key]);
    if (wrong.length) {
      wrong.forEach((t) => delete this._at[t.id]);
      const t = wrong[0];
      this.quill?.speak('Look at the tile again.', 2400);
      this._draw(t[key] ? `${t.id} says ${WORD[t[key]]}. It went back to the tray.` : `Nobody noted this for ${t.id}, so it belongs in Not noted.`);
      return;
    }
    if (this._r === 0) {
      this._r = 1; this._at = {}; this._pick = null;
      this._draw('Round 1 is right. The same six, under a new rule.');
      return;
    }
    this._won = true;
    this._say('Both rounds are right. One set of animals, two groupings.');
    finishGame(this);
  }
  checkObjective() {
    if (!this._won) return null;
    this.quill?.perform?.('hop');
    return { ok: true };
  }
}
