// CloneOrSeedGame - blk-l01-s08. Five orders reach a nursery, one at a time; tap the method that fills each. Seeds fill
// one order, so copying is not always the answer. A wrong tap gives a true line and the order stays. Five rounds, then
// finishGame. Control names: .ord-m[data-m] (cutting, graft, layer, tissue, seed). Try again: .ord-again. No timer.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { esc } from 'simulations/base/SimUi.js';
import { artDefs, svgStem, svgRoots, svgRose, svgBottle, svgLemonTree, svgSoil, svgBanana, svgRosePlant, svgPlantColour as pc, stroke } from '../shared/PlantArt.js';

// Seeds on damp soil: two whole seeds with a pale scar and a highlight, one split with its root and first two leaves.
const seedArt = () => {
  const coat = 'var(--sim-strata-3)', deep = 'var(--sim-strata-6)', shine = 'var(--sim-elev-peak)', green = 'var(--sim-series-3)';
  const seed = (x, y, r, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><defs><radialGradient id="sd${x}" cx="0.36" cy="0.3" r="0.8"><stop offset="0" style="stop-color:color-mix(in oklab, ${coat} 66%, ${shine})"/><stop offset="0.55" style="stop-color:${coat}"/><stop offset="1" style="stop-color:color-mix(in oklab, ${coat} 56%, ${deep})"/></radialGradient></defs><path d="M${-r} 0C${-r} ${-r * 0.8} ${r * 0.7} ${-r * 0.86} ${r} ${-r * 0.1}C${r * 1.05} ${r * 0.6} ${-r} ${r * 0.86} ${-r} 0Z" style="fill:url(#sd${x});stroke:${deep};stroke-width:1.2"/><path d="M${r * 0.56} ${r * 0.16}q${r * 0.12} ${r * 0.16} ${r * -0.1} ${r * 0.24}" style="fill:none;stroke:${shine};stroke-width:1.5;opacity:0.7"/><ellipse cx="${-r * 0.34}" cy="${-r * 0.34}" rx="${r * 0.3}" ry="${r * 0.13}" style="fill:${shine};opacity:0.55"/></g>`;
  return `<ellipse cx="30" cy="59" rx="28" ry="7" style="fill:var(--sim-strata-4);opacity:0.75"/>`
    + `<path d="M31 50C30 42 30 34 31 24" style="fill:none;stroke:${green};stroke-width:3;stroke-linecap:round"/>`
    + `<path d="M31 26C22 26 15 20 13 12C23 11 30 16 31 26Z" style="fill:${green};stroke:color-mix(in oklab, ${green} 60%, ${deep});stroke-width:1.1"/><path d="M31 26C39 26 46 21 48 13C38 12 32 16 31 26Z" style="fill:color-mix(in oklab, ${green} 74%, ${shine});stroke:color-mix(in oklab, ${green} 60%, ${deep});stroke-width:1.1"/>`
    + `<path d="M31 54C30 59 33 62 31 67M31 57C27 60 25 62 23 66M31 57C35 60 37 62 39 65" style="fill:none;stroke:var(--sim-strata-2);stroke-width:1.5;stroke-linecap:round"/>`
    + seed(30, 50, 9, -8) + seed(12, 56, 7, 18) + seed(49, 55, 7.5, -24);
};
// A low twig bent down under the soil, its tip up, roots at the buried bend, still joined to its parent stem. Not a tree.
const layerArt = () => {
  const lf = (x, y, r) => `<path d="M${x} ${y}c-9 -3 -12 -11 -10 -18c8 1 13 9 10 18Z" transform="rotate(${r} ${x} ${y})" style="fill:${pc('leaf')};stroke:${pc('leafDark')};stroke-width:1.2"/>`;
  let s = svgSoil(0, 42, 1, { w: 60, h: 28, seed: 3 });
  s += `<path d="M11 44L12 4" ${stroke(pc('barkDark'), 7)}/><path d="M10 44L11 4" ${stroke(pc('bark'), 4)}/>`;
  s += `<path d="M12 24C22 22 24 54 34 55C43 56 47 44 51 30" ${stroke(pc('barkDark'), 5.4)}/><path d="M12 24C22 22 24 54 34 55C43 56 47 44 51 30" ${stroke(pc('bark'), 3)}/>`;
  s += `<path d="M30 57q-3 6 -8 9M34 58q0 6 1 10M38 57q4 5 8 7M28 55q-5 3 -10 3" ${stroke(pc('cloud'), 1.8)}/>`;
  return s + lf(51, 30, -20) + lf(51, 30, 34) + lf(12, 6, -36) + lf(12, 6, 30) + lf(12, 16, -66);
};
const METHODS = [
  { id: 'cutting', name: 'Cuttings', art: () => svgStem(30, 58, 0.34, { len: 130, nodes: 3, w: 7, rot: 24, leaves: [[0.8, 1, 42], [0.94, -1, 40]] }) + svgRoots(14, 50, 0.4, { len: 30, n: 4, seed: 3 }) },
  { id: 'graft', name: 'Grafting', art: () => svgStem(30, 62, 0.34, { len: 150, nodes: 2, w: 9, buds: false }) + svgRose(30, 12, 0.5, { tint: 'yellow' }) + svgRoots(30, 58, 0.34, { len: 24, n: 4, seed: 2 }) },
  { id: 'layer', name: 'Layering', art: layerArt },
  { id: 'tissue', name: 'Tissue culture', art: () => svgBottle(30, 62, 0.44, { lets: 8 }) },
  { id: 'seed', name: 'Seeds', art: seedArt },
];
const ORDERS = [
  { m: 'cutting', say: 'Forty rose plants for a school, all the same as one good bush', art: () => svgRosePlant(60, 110, 0.56, { blooms: 2, tint: 'red' }) + svgRosePlant(108, 110, 0.56, { blooms: 2, tint: 'red' }), ok: 'Cuttings give many copies of one bush, at low cost.' },
  { m: 'graft', say: 'Yellow rose flowers on a wild rose plant that already has good roots', art: () => svgRosePlant(84, 110, 0.6, { blooms: 3, tint: 'yellow' }), ok: 'A graft joins the two: wild rose roots, yellow flowers above the join.' },
  { m: 'layer', say: 'A new lemon plant, from a thin twig that can stay on the tree until it has roots', art: () => svgLemonTree(84, 110, 0.56, {}), ok: 'A layered twig stays joined until roots form, in 10-15 days.' },
  { m: 'tissue', say: 'A very large number of healthy banana plants, to replace infected ones', art: () => svgBanana(84, 110, 0.44, { bunch: true }), ok: 'Plantlets from shoot tips help eliminate virus-infected plants.' },
  { m: 'seed', say: 'Young plants that differ from each other, to look for one that resists a disease', art: () => svgRosePlant(46, 110, 0.5, { blooms: 1, tint: 'red' }) + svgRosePlant(84, 110, 0.5, { blooms: 1, tint: 'yellow' }) + svgRosePlant(122, 110, 0.5, { blooms: 1, tint: 'pink' }), ok: 'Only seeds give differences: the other four methods make copies.' },
];
const WHY = {
  cutting: 'A cutting copies one plant, on its own roots.',
  graft: 'Grafting joins a stem piece to a plant that has roots.',
  layer: 'Layering roots a twig that stays joined to its parent.',
  tissue: 'Tissue culture gives very many plantlets, in a laboratory.',
  seed: 'Seeds give young that differ, not copies of one plant.',
};

const CSS = `
.gm.ord { background: var(--sim-bg-deep); border-radius: 14px; padding: 8px 16px; gap: 6px; }
.ord .play { display: grid; grid-template-columns: 420px minmax(0, 1fr); gap: 14px; align-items: stretch; flex: 1; min-height: 0; }
.ord .card { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 10px; align-items: center; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 10px 12px; box-shadow: 0 var(--sim-lift) 0 var(--sim-stroke); }
.ord .card svg { width: 150px; height: 124px; display: block; }
.ord .n { font-size: 15px; font-weight: 800; color: var(--sim-label-muted); }
.ord .card b { display: block; font: 600 20px/1.25 var(--sim-font-display); margin-top: 2px; }
.ord .ms { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; align-content: start; }
.ord .ord-m { display: flex; align-items: center; gap: 6px; min-height: 76px; padding: 4px 8px; text-align: left; }
.ord .ord-m svg { flex: 0 0 56px; width: 56px; height: 66px; }
.ord .ord-m span { font-size: 15px; font-weight: 800; line-height: 1.15; }
.ord .ord-m[data-used="1"] { opacity: 0.45; }
.ord .ord-m[data-shake="1"] { animation: ord-shake 0.3s ease; }
@keyframes ord-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.ord .why { min-height: 40px; margin: 0; font-size: 15px; line-height: 1.3; font-weight: 700; }
.ord .why[data-k="bad"] { color: var(--sim-bad); }
.ord .ord-again { display: none; width: 180px; }
.ord[data-done="1"] .ord-again { display: flex; align-items: center; justify-content: center; min-height: 48px; text-align: center; }
.sim-dom-root:not(.sim-dom-root--portrait) .ord .ms { padding-top: 28px; grid-auto-rows: 118px; }
.sim-dom-root:not(.sim-dom-root--portrait) .ord .ord-m svg { flex: 0 0 76px; width: 76px; height: 90px; }
.sim-dom-root--portrait .ord .play { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .ord .card { grid-template-columns: 96px minmax(0, 1fr); padding: 8px; }
.sim-dom-root--portrait .ord .card svg { width: 96px; height: 80px; }
.sim-dom-root--portrait .ord .card b { font-size: 17px; }
.sim-dom-root--portrait .ord .ms { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.sim-dom-root--portrait .ord .ord-again { width: 100%; }
@media (prefers-reduced-motion: reduce) { .ord .ord-m[data-shake="1"] { animation: none; } }
`;

export class CloneOrSeedGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'Match each order to the method that fills it.' } };
  static ARIA_LABEL = 'Five orders reach a nursery. For each, tap the method that fills it: cuttings, grafting, layering, tissue culture or seeds.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm ord"><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${artDefs()}</defs></svg><div class="gm-head"><p class="kicker">Nursery orders</p><h2>Which method fills this order?</h2></div>
        <div class="play"><div class="card"><svg viewBox="0 0 168 124" aria-hidden="true"></svg><div><span class="n"></span><b></b></div></div>
        <div class="ms">${METHODS.map((m) => `<div class="tap btn ord-m" role="button" tabindex="0" data-m="${m.id}"><svg viewBox="0 0 60 70" aria-hidden="true">${m.art()}</svg><span>${esc(m.name)}</span></div>`).join('')}</div></div>
        <p class="why" aria-live="polite"></p><div class="tap btn ord-again" role="button" tabindex="0">Play again</div></div>`,
    });
    this.root.querySelectorAll('.ord-m').forEach((el) => onTap(el, () => this._pick(el)));
    const again = this.root.querySelector('.ord-again');
    if (again) onTap(again, () => { this._reset(); this._draw(); });
    this._draw();
    this.quill?.speak('Five orders. Pick a method for each.', 5200);
  }
  _reset() { this._i = 0; this._line = ''; this._bad = false; }
  _draw() {
    const r = this.root, o = ORDERS[Math.min(this._i, ORDERS.length - 1)], done = this._i >= ORDERS.length;
    if (!r.querySelector('.gm')) return;
    r.querySelector('.gm').dataset.done = done ? '1' : '0';
    r.querySelector('.card svg').innerHTML = o.art();
    r.querySelector('.n').textContent = done ? 'All five filled' : `Order ${this._i + 1} of ${ORDERS.length}`;
    r.querySelector('.card b').textContent = done ? 'Four methods make copies. Only seeds give differences.' : o.say;
    const w = r.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    r.querySelectorAll('.ord-m').forEach((el) => { el.dataset.used = ORDERS.slice(0, this._i).some((q) => q.m === el.dataset.m) ? '1' : '0'; });
    this.relayout?.();
  }
  _pick(el) {
    if (this._i >= ORDERS.length) return;
    const o = ORDERS[this._i], id = el.dataset.m;
    if (el.dataset.used === '1') { this._line = 'That method has filled its order. Try another.'; this._bad = true; this._draw(); return; }
    if (id === o.m) {
      this._line = o.ok; this._bad = false; this._i += 1;
      this._draw();
      if (this._i >= ORDERS.length) finishGame(this);
    } else {
      this._line = WHY[id]; this._bad = true; el.dataset.shake = '1';
      setTimeout(() => { el.dataset.shake = '0'; }, 320);
      this._draw();
    }
  }
  checkObjective() { return this._i >= ORDERS.length ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._draw(); }
}
