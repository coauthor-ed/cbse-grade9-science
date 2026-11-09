// WallOrNoWallGame - Wall or no wall? Eight cases: a cell and a liquid. The learner picks what will be seen; the cell then
// shows what really happens, right or wrong, and says why. A wrong case comes back at the end, so a learner can always
// finish. Physics: water moves towards more solute, solute stays out; a rigid wall keeps the outline; no wall, the
// whole cell changes size. Tiles: swell, shrink, inside, same.
import { GameBoard, mountGame, finishGame, onTap } from 'simulations/base/kit/GameFrame.js';
import { cwDefs, animalCell, plantCell, cheekCell, eyepiece } from '../shared/CellWorld.js';

const TILES = [
  { id: 'swell', label: 'Whole cell swells' }, { id: 'shrink', label: 'Whole cell shrinks' },
  { id: 'inside', label: 'Outline stays, inside shrinks' }, { id: 'same', label: 'No visible change' },
];
const LIQ = { sugar: '20 per cent sugar', salt: 'Strong salt solution', water: 'Plain water', equal: 'Same strength as the cell' };
const CASES = [
  { cell: 'plant', name: 'Rhoeo leaf cell', liq: 'sugar', ans: 'inside', why: 'Water leaves by osmosis and the membrane pulls away, but the rigid wall stays where it was.' },
  { cell: 'animal', name: 'Cheek cell', liq: 'sugar', ans: 'shrink', why: 'Water leaves by osmosis. With no wall to hold the outline, the whole cell shrinks.' },
  { cell: 'animal', name: 'Cheek cell', liq: 'equal', ans: 'same', why: 'Water crosses both ways, but there is no net movement, so the size stays the same.' },
  { cell: 'animal', name: 'Cheek cell', liq: 'water', ans: 'swell', why: 'The inside has more solute, so more water enters than leaves, and nothing rigid stops the swelling.' },
  { cell: 'plant', name: 'Onion peel cell', liq: 'water', ans: 'same', why: 'Water enters, but the rigid wall keeps the outline. The cell stays firm instead of swelling like a cheek cell.' },
  { cell: 'plant', name: 'Onion peel cell', liq: 'salt', ans: 'inside', why: 'The salt stays outside and water leaves. The wall keeps its size as the membrane pulls away.' },
  { cell: 'animal', name: 'Cheek cell', liq: 'salt', ans: 'shrink', why: 'The salt stays outside and water leaves. Nothing rigid holds the outline, so the whole cell shrinks.' },
  { cell: 'nowall', name: 'Plant cell, wall removed', liq: 'sugar', ans: 'shrink', why: 'Without its wall this cell behaves like a cheek cell, so the whole cell shrinks. The wall is what holds the shape.' },
];

const CSS = `
.gm.hs { background: var(--sim-bg-deep); border-radius: 14px; }
.hs .wrap { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 400px minmax(0, 1fr); gap: 14px; align-items: start; }
.hs .fig { position: relative; border-radius: var(--sim-radius-lg); overflow: hidden; border: var(--sim-border); background: var(--sim-bg-surface); line-height: 0; }
.hs .fig svg { display: block; width: 100%; height: auto; }
.hs .tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.hs .tile { min-height: 58px; padding: 6px 10px; text-align: center; line-height: 1.2; }
.hs .tile[data-state="good"] { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); }
.hs .tile[data-state="bad"] { border-color: var(--sim-bad); background: color-mix(in oklab, var(--sim-bad) 16%, var(--sim-bg-surface)); }
.hs .tile[disabled] { cursor: default; color: var(--sim-label); opacity: 0.55; }
.hs .tile[data-state="good"][disabled], .hs .tile[data-state="bad"][disabled] { opacity: 1; }
.hs .why { font-size: 15px; line-height: 1.35; font-weight: 700; margin: 8px 0 0; min-height: 62px; }
.hs .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 4px; }
.hs .count { font-size: 15px; font-weight: 800; color: var(--sim-label-muted); }
.hs .next { min-width: 120px; background: var(--sim-accent); color: var(--sim-bg-deep); border-color: var(--sim-accent); font-weight: 800; }
.sim-dom-root--portrait .hs .wrap { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .hs .fig { width: 100%; }
.sim-dom-root--portrait .hs .tile { min-height: 52px; padding: 4px 6px; }
`;

// The case as seen down a microscope: the cell in the middle of a round lit field, neighbours of the same kind cut by the
// field edge, all in the same liquid, so all change the same way. The liquid is named in the header, not drawn as dots.
function drawing(c, u) {
  const W = 400, H = 240, e = c.ans, k = u, cx = 200, cy = 120, R = 116;
  let body = '';
  if (c.cell === 'plant') {
    const onion = c.name.startsWith('Onion'), w = onion ? 196 : 158, h = onion ? 104 : 132, pull = e === 'inside' ? k * 0.9 : 0, parts = ['wall', 'membrane', 'cytoplasm', 'nucleus', 'vacuole'];
    for (const [dx, dy] of [[-1, 0], [1, 0], [-0.5, -1], [0.5, -1], [-0.5, 1], [0.5, 1]]) body += `<g opacity=".5">${plantCell(cx + dx * w, cy + dy * h, w, h, { pull, parts, seed: 7 + Math.round(dx * 4 + dy * 9) })}</g>`;
    body += plantCell(cx, cy, w, h, { pull, parts, seed: onion ? 4 : 6 });
  } else if (c.cell === 'nowall') {
    const pull = e === 'shrink' ? k * 0.9 : 0;
    body += plantCell(cx, cy, 150, 126, { pull, parts: ['membrane', 'cytoplasm', 'nucleus', 'vacuole'], seed: 5 });
  } else {
    const f = e === 'swell' ? 1 + 0.22 * k : e === 'shrink' ? 1 - 0.38 * k : 1;
    for (const [x, y, r, sd] of [[52, 46, 40, 3], [352, 60, 36, 6], [330, 206, 42, 8], [70, 200, 34, 11]]) body += cheekCell(x, y, r * f, { seed: sd, a: 0.7 });
    body += animalCell(cx, cy, 74 * (e === 'swell' ? 1 + 0.22 * k : 1), { shrink: e === 'shrink' ? k * 0.9 : 0, parts: ['membrane', 'cytoplasm', 'nucleus', 'mito'], seed: 9 });
  }
  const s = `<defs>${cwDefs()}</defs>` + eyepiece(W, H, cx, cy, R, body, { id: 'hs-ep', tint: c.cell === 'animal' ? 'blue' : 'pale' });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${c.name} in ${LIQ[c.liq]}, seen through a microscope">${s}</svg>`;
}

const ARIA = 'A game. A cell sits in a liquid. Pick what you will see, and the cell then shows what happens and why.';

export class WallOrNoWallGame extends GameBoard {
  static ARIA_LABEL = ARIA;
  static OBJECTIVE = { prompt: { en: 'Pick what each of eight cells will do in its liquid.' } };
  _q = CASES.slice(); _done = 0; _ans = null;

  _t(sel, v) { const e = this.root.querySelector(sel); if (e) e.textContent = v; }
  _h(sel, v) { const e = this.root.querySelector(sel); if (e) e.innerHTML = v; }
  _hide(sel, v) { const e = this.root.querySelector(sel); if (e) e.hidden = v; }
  _nextBtn(fn) { const e = this.root.querySelector('[data-next]'); if (e) onTap(e, fn); }
  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm hs"><div class="gm-head"><h2>Wall or no wall?</h2><p class="sub" data-t></p></div>
        <div class="wrap"><div class="fig" data-fig></div>
        <div><div class="tiles">${TILES.map((t) => `<button type="button" class="tap btn tile" data-tile="${t.id}">${t.label}</button>`).join('')}</div>
        <p class="why" data-why aria-live="polite"></p><div class="row"><span class="count" data-n></span><button type="button" class="tap btn next" data-next hidden>Next cell</button></div></div></div></div>`,
    });
    this.root.querySelectorAll('[data-tile]').forEach((b) => onTap(b, (e) => { e.stopPropagation?.(); this._pick(b.dataset.tile); }));
    this._nextBtn(() => this._next());
    this._show();
  }
  destroy() { clearInterval(this._iv); super.destroy(); }
  _show() {
    clearInterval(this._iv);
    const c = this._q[0]; this._ans = null;
    this._t('[data-t]', `${c.name} in: ${LIQ[c.liq]}`);
    this._h('[data-fig]', drawing(c, 0));
    this._t('[data-why]', 'What will you see after some time?');
    this._t('[data-n]', `${this._done} of ${CASES.length} right`);
    this._hide('[data-next]', true);
    this.root.querySelectorAll('[data-tile]').forEach((b) => { b.dataset.state = ''; b.disabled = false; });
    this.relayout?.();
  }
  _pick(id) {
    if (this._ans || !this._q.length) return;
    const c = this._q[0], ok = id === c.ans; this._ans = id;
    if (ok) this._done += 1;
    this.root.querySelectorAll('[data-tile]').forEach((b) => { b.disabled = true; b.dataset.state = b.dataset.tile === c.ans ? 'good' : b.dataset.tile === id ? 'bad' : ''; });
    this._t('[data-why]', (ok ? '' : 'Not this time. ') + c.why);
    this._t('[data-n]', `${this._done} of ${CASES.length} right`);
    const nx = this.root.querySelector('[data-next]');
    if (nx) nx.hidden = false;
    if (ok) this.quill?.perform?.('hop'); else this.quill?.setExpression?.('surprised');
    this._q.shift(); if (!ok) this._q.push(c);
    if (!this._q.length && nx) nx.textContent = 'Finish';
    let i = 0; const fig = this.root.querySelector('[data-fig]'), still = this.reducedMotion?.() ?? globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!fig) return;
    if (still || c.ans === 'same') { fig.innerHTML = drawing(c, 1); return; }
    this._iv = setInterval(() => { i += 1; fig.innerHTML = drawing(c, Math.min(1, i / 10)); if (i >= 10) clearInterval(this._iv); }, 70);
  }
  _next() {
    if (this._q.length) { this._show(); return; }
    finishGame(this);
  }
  checkObjective() { return this._q.length ? null : { ok: true }; }
}
