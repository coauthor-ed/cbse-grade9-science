// ShipTheProteinGame - Fig 2.13 as routes. Three cargoes. The learner taps the next stop; the cargo moves there on the
// map, in a vesicle after the Golgi apparatus. A wrong stop says why, the cargo stays put. Stops: rough, smooth, golgi,
// membrane, lysosome, mito, nucleus. Routes (book): protein rough -> golgi -> membrane; lipid smooth -> golgi -> membrane;
// lysosome enzymes rough -> golgi -> lysosome.
import { GameBoard, mountGame, finishGame, onTap } from 'simulations/base/kit/GameFrame.js';
import { cwDefs, nucleus, roughEr, smoothEr, golgi, lysosome, mitochondrion, depthField, blobPath, mx, T, vesicle } from '../shared/CellWorld.js';

const STOPS = [
  { id: 'rough', label: 'Rough ER' }, { id: 'smooth', label: 'Smooth ER' }, { id: 'golgi', label: 'Golgi apparatus' }, { id: 'membrane', label: 'Plasma membrane' },
  { id: 'lysosome', label: 'Lysosome' }, { id: 'mito', label: 'Mitochondrion' }, { id: 'nucleus', label: 'Nucleus' },
];
const POS = { nucleus: [96, 130], rough: [176, 100], smooth: [166, 226], golgi: [292, 150], membrane: [466, 170], lysosome: [392, 74], mito: [388, 252] };
const CARGO = [
  { name: 'A protein for secretion', tone: 'series-6', route: ['rough', 'golgi', 'membrane'], ok: ['Ribosomes on the rough ER make the protein.', 'The Golgi apparatus modifies and sorts it, then packages it into a vesicle.', 'The vesicle joins the plasma membrane and the protein is released outside the cell.'] },
  { name: 'A lipid for the cell membrane', tone: 'series-2', route: ['smooth', 'golgi', 'membrane'], ok: ['Smooth ER is involved in making fats.', 'The Golgi apparatus sorts it and packages it into a vesicle.', 'The vesicle joins the plasma membrane, and the lipid becomes part of the membrane.'] },
  { name: 'Enzymes for a lysosome', tone: 'series-3', route: ['rough', 'golgi', 'lysosome'], ok: ['Enzymes are proteins, so ribosomes on the rough ER make them.', 'The Golgi apparatus packages them into vesicles.', 'A sac of enzymes is a lysosome: the Golgi apparatus packages proteins for lysosome formation.'] },
];
function why(c, step, id) {
  if (id === 'nucleus') return 'The nucleus holds the instructions, but this cargo is not made or packed there.';
  if (id === 'mito') return 'Mitochondria supply energy. They do not make or carry this cargo.';
  if (step === 0) {
    if (id === 'smooth') return 'Smooth ER has no ribosomes, so it does not make proteins.';
    if (id === 'rough') return 'Rough ER is mainly involved with proteins. Fats are made on smooth ER.';
    return 'This cargo has not been made yet. Start where it is made.';
  }
  if (step === 1) return 'It must be modified, sorted and packaged first.';
  if (id === 'lysosome') return 'This cargo is going to the plasma membrane, not to a lysosome.';
  if (id === 'membrane') return 'These enzymes stay inside the cell, in a sac.';
  return 'It has already left there. Follow the vesicle onward.';
}
const CSS = `
.gm.sp { background: var(--sim-bg-deep); border-radius: 14px; }
.sp .wrap { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 404px) minmax(0, 1fr); gap: 16px; align-items: start; }
.sp .fig { position: relative; border-radius: var(--sim-radius-lg); overflow: hidden; border: var(--sim-border); line-height: 0; }
.sp .fig svg { display: block; width: 100%; height: auto; }
.sp .stops { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.sp .stop { min-height: 50px; padding: 4px 6px; line-height: 1.15; font-size: 16px; }
.sp .stop[data-state="good"] { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); }
.sp .stop[data-state="bad"] { border-color: var(--sim-bad); background: color-mix(in oklab, var(--sim-bad) 16%, var(--sim-bg-surface)); }
.sp .why { font-size: 15px; line-height: 1.35; font-weight: 700; margin: 8px 0 0; min-height: 62px; }
.sp .next { width: 100%; background: var(--sim-accent); color: var(--sim-bg-deep); border-color: var(--sim-accent); font-weight: 800; }
.sp [data-tok] { transition: transform 0.7s var(--look-spring-soft, ease); }
.sp .gm-head .kicker { display: none; }
@media (prefers-reduced-motion: reduce) { .sp [data-tok] { transition: none; } }
.sim-dom-root--portrait .sp .wrap { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .sp .stops { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }
.sim-dom-root--portrait .sp .stop { min-height: 46px; font-size: 14px; padding: 2px 1px; letter-spacing: -0.2px; }
.sim-dom-root--portrait .sp .why { font-size: 14px; min-height: 56px; margin-top: 6px; }
`;
const LBL = { nucleus: 'Nucleus', rough: 'Rough ER', smooth: 'Smooth ER', golgi: 'Golgi', lysosome: 'Lysosome', mito: 'Mitochondrion' };
const map = () => {
  const W = 520, H = 340; let s = `<defs>${cwDefs()}</defs>` + depthField(W, H, { tone: 'blue', seed: 3 });
  s += `<path d="${blobPath(150, 170, 400, 340, 3, 0.02, 12)}" style="fill:url(#cw-cyto) ${mx('membrane', 'elev-peak', 20)}"/>`;
  s += roughEr(96, 134, 72, { a0: -70, a1: 60, n: 2, w: 9, step: 10 }) + nucleus(96, 134, 62) + smoothEr(166, 234, 0.92, { rot: -6 }) + golgi(292, 150, 0.96, { vesicles: false }) + lysosome(392, 74, 21) + mitochondrion(388, 252, 0.82, { rot: 8 });
  s += `<path d="M470 0C444 80 448 240 474 340" style="fill:none;stroke:${mx('sea-shallow', 'sea-deep', 72)};stroke-width:6"/><path d="M478 0C452 80 456 240 482 340" style="fill:none;stroke:${mx('sea-shallow', 'elev-peak', 60)};stroke-width:3;opacity:.6"/>`;
  const tag = (x, y, t, a = 'middle') => `<text x="${x}" y="${y}" text-anchor="${a}" style="font:800 24px var(--sim-font);fill:${T('strata-6')};paint-order:stroke;stroke:${T('elev-peak')};stroke-width:5px;stroke-linejoin:round">${t}</text>`;
  s += tag(60, 40, LBL.nucleus) + tag(174, 40, LBL.rough) + tag(160, 300, LBL.smooth) + tag(292, 218, LBL.golgi) + tag(392, 130, LBL.lysosome) + tag(372, 318, 'Mitochondrion') + tag(452, 30, 'Plasma membrane', 'end');
  return s;
};
const ARIA = 'A game. Send three cargoes through a map of a cell by tapping the stops in the right order.';

export class ShipTheProteinGame extends GameBoard {
  static HEIGHT = 368;
  static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = ARIA;
  static OBJECTIVE = { prompt: { en: 'Send a protein, a lipid and lysosome enzymes through the cell. Tap each stop in order; a wrong stop tells you why.' } };
  _c = 0; _s = 0; _won = false;
  _t(sel, v) { const e = this.root.querySelector(sel); if (e) e.textContent = v; }
  _h(sel, v) { const e = this.root.querySelector(sel); if (e) e.innerHTML = v; }
  _hide(sel, v) { const e = this.root.querySelector(sel); if (e) e.hidden = v; }
  _nextBtn(fn) { const e = this.root.querySelector('[data-next]'); if (e) onTap(e, fn); }
  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm sp"><div class="gm-head"><p class="kicker">Challenge</p><h2>Follow the protein</h2><p class="sub" data-t></p></div>
      <div class="wrap"><div class="fig"><svg viewBox="0 0 520 340" role="img" aria-label="A map of part of a cell: nucleus, rough and smooth ER, Golgi apparatus, a lysosome, a mitochondrion and the plasma membrane."><g data-base></g><g data-tok></g></svg></div>
      <div><div class="stops">${STOPS.map((p) => `<button type="button" class="tap btn stop" data-stop="${p.id}">${p.label}</button>`).join('')}</div><p class="why" data-why aria-live="polite"></p><button type="button" class="tap btn next" data-next hidden>Next cargo</button></div></div></div>`,
    });
    this._h('[data-base]', map());
    this.root.querySelectorAll('[data-stop]').forEach((b) => onTap(b, () => this._tap(b)));
    this._nextBtn(() => { this._c += 1; this._s = 0; this._show(); });
    this._show();
  }
  _token(pos, inVesicle) {
    const c = CARGO[this._c], g = this.root.querySelector('[data-tok]');
    if (!g) return;
    g.style.transform = `translate(${pos[0]}px, ${pos[1]}px)`;
    g.innerHTML = (inVesicle ? vesicle(0, 0, 17) : '') + `<circle r="15" style="fill:none;stroke:${T('elev-peak')};stroke-width:3;stroke-dasharray:4 3"/><circle r="9" style="fill:${T(c.tone)};stroke:${T('elev-peak')};stroke-width:2.6"/>`;
  }
  _show() {
    const c = CARGO[this._c];
    this._t('[data-t]', `Cargo ${this._c + 1} of ${CARGO.length}: ${c.name}`);
    this._t('[data-why]', 'Tap the first stop.');
    this._hide('[data-next]', true);
    this.root.querySelectorAll('[data-stop]').forEach((b) => { b.dataset.state = ''; b.disabled = false; });
    this._token([34, 300], false);
    this.relayout?.();
  }
  _tap(b) {
    const c = CARGO[this._c], id = b.dataset.stop, want = c.route[this._s];
    if (this._s >= c.route.length) return;
    this.root.querySelectorAll('[data-stop]').forEach((x) => { if (x.dataset.state === 'bad') x.dataset.state = ''; });
    if (id !== want) { b.dataset.state = 'bad'; this._t('[data-why]', why(c, this._s, id)); this.quill?.setExpression?.('surprised'); return; }
    b.dataset.state = 'good'; this._t('[data-why]', c.ok[this._s]);
    this._s += 1;
    this._token(POS[id], this._s >= 2);
    if (this._s === c.route.length) {
      this.quill?.perform?.('hop');
      if (this._c === CARGO.length - 1) { this._won = true; finishGame(this); } else this._hide('[data-next]', false);
    }
  }
  checkObjective() { return this._won ? { ok: true } : null; }
}
