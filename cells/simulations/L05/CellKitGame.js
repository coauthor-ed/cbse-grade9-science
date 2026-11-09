// CellKitGame - Table 2.1 as a build. Three cells in tabs. A tap on a tray part adds it if that cell has it, and the
// part appears on the drawing; a part that does not belong says why and stays in the tray. All three complete: finish.
// Control names: tabs bacterial, plant, animal; tray parts by name.
import { GameBoard, mountGame, finishGame, onTap } from 'simulations/base/kit/GameFrame.js';
import { cwDefs, animalCell, plantCell, bacterium, roughEr, depthField } from '../shared/CellWorld.js';

const PARTS = [
  { id: 'membrane', label: 'Cell membrane' }, { id: 'cytoplasm', label: 'Cytoplasm' }, { id: 'wall', label: 'Cell wall' }, { id: 'ribosome', label: 'Ribosomes' },
  { id: 'nucleus', label: 'Well-defined nucleus' }, { id: 'nucleoid', label: 'Nucleoid' }, { id: 'mito', label: 'Mitochondria' }, { id: 'chloro', label: 'Chloroplasts' },
  { id: 'vacuole', label: 'Large central vacuole' }, { id: 'er', label: 'Endoplasmic reticulum' }, { id: 'golgi', label: 'Golgi apparatus' },
];
const NO_ORG = 'Bacterial cells have no membrane-bound organelles.';
const CELLS = {
  bacterial: { label: 'Bacterial cell', needs: ['membrane', 'cytoplasm', 'wall', 'ribosome', 'nucleoid'],
    no: { nucleus: 'A bacterial cell has no well-defined nucleus. Its genetic material has no membrane around it.', mito: NO_ORG, chloro: NO_ORG, vacuole: NO_ORG, er: NO_ORG, golgi: NO_ORG } },
  plant: { label: 'Plant cell', needs: ['membrane', 'cytoplasm', 'wall', 'ribosome', 'nucleus', 'mito', 'chloro', 'vacuole', 'er', 'golgi'],
    no: { nucleoid: 'A nucleoid is found in prokaryotic cells. A plant cell has a well-defined nucleus.' } },
  animal: { label: 'Animal cell', needs: ['membrane', 'cytoplasm', 'ribosome', 'nucleus', 'mito', 'er', 'golgi'],
    no: { wall: 'Animal cells have no cell wall.', nucleoid: 'A nucleoid is found in prokaryotic cells. An animal cell has a well-defined nucleus.', chloro: 'Animal cells have no chloroplasts.', vacuole: 'Animal cells may have small vacuoles, but not one large central vacuole.' } },
};
const CSS = `
.gm.ck { background: var(--sim-bg-deep); border-radius: 14px; }
.ck .wrap { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 330px minmax(0, 1fr); gap: 14px; align-items: start; }
.ck .tabs { display: flex; gap: 6px; margin-bottom: 8px; }
.ck .tab { flex: 1 1 0; min-height: 46px; padding: 4px 6px; line-height: 1.15; }
.ck .tab[aria-pressed="true"] { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 22%, var(--sim-bg-surface)); }
.ck .tab[data-done="1"]::after { content: ' \\2713'; color: var(--sim-good); }
.ck .fig { border-radius: var(--sim-radius-lg); overflow: hidden; border: var(--sim-border); line-height: 0; }
.ck .fig svg { display: block; width: 100%; height: auto; }
.ck .tray { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.ck .part { min-height: 48px; padding: 2px 6px; line-height: 1.12; font-size: 15px; }
.ck .part[data-on="1"] { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); }
.ck .part[data-no="1"] { border-color: var(--sim-bad); background: color-mix(in oklab, var(--sim-bad) 16%, var(--sim-bg-surface)); }
.ck .why { font-size: 15px; line-height: 1.3; font-weight: 700; margin: 6px 0 0; min-height: 40px; }
.sim-dom-root--portrait .ck .wrap { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .ck .tray { gap: 5px; }
.sim-dom-root--portrait .ck .part { padding: 2px 3px; font-size: 14px; letter-spacing: -0.01em; overflow-wrap: anywhere; hyphens: auto; }
.sim-dom-root--portrait .ck .tab { padding: 4px 3px; font-size: 14px; }
`;
function drawing(key, on) {
  const W = 380, H = 224, empty = on.size === 0, has = (p) => on.has(p), vis = (n) => (has(n) ? 1 : 0);
  let s = `<defs>${cwDefs()}</defs>` + depthField(W, H, { tone: key === 'plant' ? 'green' : 'blue', seed: 6 });
  const faint = `<g opacity="${empty ? 0.7 : 0.3}">`;
  if (key === 'bacterial') {
    s += `${faint}<path d="M100 79H270C310 79 310 145 270 145H100C60 145 60 79 100 79Z" style="fill:none;stroke:var(--sim-label);stroke-width:2;stroke-dasharray:6 6"/></g>`;
    if (!empty) s += bacterium(182, 112, 1.08, { part: (n) => (n === 'nucleus' ? vis('nucleoid') : vis(n)) });
  } else if (key === 'plant') {
    s += `${faint}<rect x="104" y="14" width="180" height="196" rx="16" style="fill:none;stroke:var(--sim-label);stroke-width:2;stroke-dasharray:6 6"/></g>`;
    if (!empty) s += plantCell(194, 112, 180, 196, { part: (n) => vis(n), parts: ['wall', 'membrane', 'cytoplasm', 'nucleus', 'vacuole', 'mito', 'chloro', 'golgi', 'ribosome'] });
    if (has('er')) s += roughEr(194 + 160 * 0.32, 112 + 176 * 0.2, 26, { a0: 150, a1: 400, n: 2, w: 6, step: 8 });
  } else {
    s += `${faint}<circle cx="190" cy="112" r="96" style="fill:none;stroke:var(--sim-label);stroke-width:2;stroke-dasharray:6 6"/></g>`;
    if (!empty) s += animalCell(190, 112, 97, { part: (n) => vis(n) });
  }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="The cell you are building">${s}</svg>`;
}
const ARIA = 'A game. Build a bacterial cell, a plant cell and an animal cell by tapping the parts that belong in each one.';

export class CellKitGame extends GameBoard {
  static ARIA_LABEL = ARIA;
  static OBJECTIVE = { prompt: { en: 'Build a bacterial cell, a plant cell and an animal cell from the parts tray.' } };
  _key = 'bacterial'; _on = { bacterial: new Set(), plant: new Set(), animal: new Set() }; _won = false;
  _t(sel, v) { const e = this.root.querySelector(sel); if (e) e.textContent = v; }
  _h(sel, v) { const e = this.root.querySelector(sel); if (e) e.innerHTML = v; }
  _hide(sel, v) { const e = this.root.querySelector(sel); if (e) e.hidden = v; }
  _nextBtn(fn) { const e = this.root.querySelector('[data-next]'); if (e) onTap(e, fn); }
  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm ck"><div class="gm-head"><h2>Cell Kit</h2><p class="sub">Tap each part that belongs in this cell.</p></div>
      <div class="wrap"><div><div class="tabs">${Object.entries(CELLS).map(([k, c]) => `<button type="button" class="tap btn tab" data-tab="${k}">${c.label}</button>`).join('')}</div><div class="fig" data-fig></div></div>
      <div><div class="tray">${PARTS.map((p) => `<button type="button" class="tap btn part" data-part="${p.id}">${p.label}</button>`).join('')}</div><p class="why" data-why aria-live="polite"></p></div></div></div>`,
    });
    this.root.querySelectorAll('[data-tab]').forEach((b) => onTap(b, () => { this._key = b.dataset.tab; this._say(''); this._show(); }));
    this.root.querySelectorAll('[data-part]').forEach((b) => onTap(b, () => this._tap(b)));
    this._show();
  }
  _say(t) { this._t('[data-why]', t); }
  _show() {
    const k = this._key, c = CELLS[k], on = this._on[k];
    this._h('[data-fig]', drawing(k, on));
    this.root.querySelectorAll('[data-tab]').forEach((b) => { const kk = b.dataset.tab; b.setAttribute('aria-pressed', String(kk === k)); b.dataset.done = CELLS[kk].needs.every((p) => this._on[kk].has(p)) ? '1' : '0'; });
    this.root.querySelectorAll('[data-part]').forEach((b) => { b.dataset.on = on.has(b.dataset.part) ? '1' : '0'; b.dataset.no = '0'; });
    if (!this.root.querySelector('[data-why]')?.textContent) this._say(`${c.label}: ${on.size} of ${c.needs.length} parts in place.`);
    this.relayout?.();
  }
  _tap(b) {
    const k = this._key, c = CELLS[k], id = b.dataset.part, on = this._on[k];
    if (on.has(id)) return;
    if (!c.needs.includes(id)) { this._show(); b.dataset.no = '1'; this._say(c.no[id]); this.quill?.setExpression?.('surprised'); return; }
    on.add(id); this._say('');
    if (c.needs.every((p) => on.has(p))) {
      this._say(`${c.label} complete.`); this.quill?.perform?.('hop');
      const left = Object.keys(CELLS).find((kk) => !CELLS[kk].needs.every((p) => this._on[kk].has(p)));
      if (left) this._say(`${c.label} complete. Now the ${CELLS[left].label.toLowerCase()}.`);
    }
    this._show();
    if (Object.keys(CELLS).every((kk) => CELLS[kk].needs.every((p) => this._on[kk].has(p)))) { this._won = true; finishGame(this); }
  }
  checkObjective() { return this._won ? { ok: true } : null; }
}
