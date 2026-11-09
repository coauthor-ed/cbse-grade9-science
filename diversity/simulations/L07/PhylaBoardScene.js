// PhylaBoardScene - L07 blk-l07-s07, 5 beats. The eight phyla of Fig 12.16 as drawn cards, values exactly as printed in
// the book. Beat 0: choose a row. Beat 1: level of organisation. Beat 2: skeleton. Beat 3: the pattern across the
// eight. Beat 4: Amphioxus, outside the eight, with its notochord. Controls: tap-light chips Habitat, Level, Skeleton.
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { tapLight } from 'simulations/base/kit/TapLight.js';
import { bioIcon } from '../shared/BioArt.js';
import { tag, amphioxus } from '../L06/BodyKit.js';

const one = (idx) => [{ idx, dwellMs: null }];
const P = [
  { n: 'Porifera', a: 'Sponge', e: 'sponges', hab: 'Water (Marine)', lev: 'Cellular', ske: 'None' },
  { n: 'Cnidaria', a: 'Hydra', e: 'Hydra, jellyfish', hab: 'Water (Fresh and marine)', lev: 'Tissue', ske: 'None' },
  { n: 'Platyhelminthes', a: 'Flatworm', e: 'flatworms', hab: 'Water/inside host', lev: 'Organ', ske: 'None' },
  { n: 'Nematoda', a: 'Roundworm', e: 'roundworms', hab: 'Soil/water/inside host', lev: 'Organ system (digestive system)', ske: 'None' },
  { n: 'Annelida', a: 'Earthworm', e: 'earthworms', hab: 'Moist soil/water', lev: 'Organ system', ske: 'None' },
  { n: 'Arthropoda', a: 'Beetle', e: 'insects, crabs', hab: 'Land/water', lev: 'Organ system', ske: 'Exoskeleton' },
  { n: 'Mollusca', a: 'Snail', e: 'snails, octopus', hab: 'Water/moist land', lev: 'Organ system', ske: 'Exoskeleton' },
  { n: 'Echinodermata', a: 'Starfish', e: 'starfish, urchins', hab: 'Marine water', lev: 'Organ system', ske: 'Endoskeleton' },
];
const TONE = { Cellular: 2, Tissue: 7, Organ: 5, 'Organ system': 3, 'Organ system (digestive system)': 3, None: 8, Exoskeleton: 1, Endoskeleton: 4 };
const CHIPS = [{ id: 'hab', label: 'Habitat', targets: ['hab'] }, { id: 'lev', label: 'Level', targets: ['lev'] }, { id: 'ske', label: 'Skeleton', targets: ['ske'] }];
const ROW = { hab: 'Habitat', lev: 'Level of organisation', ske: 'Skeleton' };
const amphi = () => `<svg viewBox="0 0 340 130" role="img" aria-label="Amphioxus drawn from the side with its notochord lit">${amphioxus(170, 84, 310)}${tag(170, 24, 170, 80, 'Notochord', { size: 17 })}</svg>`;
const CSS = `
.pb { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.pb-title { margin: 0; text-align: center; font: 600 var(--sim-text-xl)/1.15 var(--sim-font-display, var(--sim-font)); color: var(--sim-label); }
.pb-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--sim-space-2); }
.pb--p .pb-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.pb-card { --c: var(--sim-stroke); display: grid; grid-template-columns: 42px minmax(0, 1fr); column-gap: 6px; align-items: center; min-width: 0; padding: 4px 8px; box-sizing: border-box;
  border: calc(2.5px * var(--look-rim)) solid var(--c); border-radius: var(--sim-radius-md); background: var(--sim-bg-surface);
  box-shadow: 0 calc(4px * var(--look-lip)) 0 color-mix(in oklab, var(--c) 60%, var(--sim-bg-deep)); }
.pb-art { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; }
.pb-art svg { width: 42px; height: 42px; display: block; }
.pb-name { grid-column: 1 / -1; font: 600 15px/1.15 var(--sim-font-display, var(--sim-font)); color: var(--sim-label); }
.pb-eg { font: 700 14px/1.15 var(--sim-font); color: var(--sim-text-muted, var(--sim-label)); }
.pb-val { grid-column: 1 / -1; margin-top: 2px; padding: 2px 6px; min-height: 36px; display: flex; align-items: center; justify-content: center; text-align: center; box-sizing: border-box; border-radius: var(--sim-radius-sm);
  background: color-mix(in oklab, var(--c) 24%, var(--sim-bg-surface)); color: var(--sim-label); font: 800 14px/1.15 var(--sim-font); animation: pb-pop 0.32s var(--look-spring) both; }
.pb-val--big { font: 600 15px/1.1 var(--sim-font-display, var(--sim-font)); }
@keyframes pb-pop { from { opacity: 0; scale: 0.7; } to { opacity: 1; scale: 1; } }
.pb-pat { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 0; padding: 0; list-style: none; }
.pb-pat li { --c: var(--sim-stroke); padding: 3px 10px; min-height: 28px; display: flex; align-items: center; border-radius: var(--look-pill); background: color-mix(in oklab, var(--c) 26%, var(--sim-bg-surface)); border: calc(2px * var(--look-rim)) solid var(--c); font: 800 14px/1.1 var(--sim-font); color: var(--sim-label); }
.pb-amphi { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: center; gap: 4px; padding: var(--sim-space-2) var(--sim-space-3); border: calc(2.5px * var(--look-rim)) solid var(--sim-series-5); border-radius: var(--sim-radius-lg); background: var(--sim-bg-surface); box-shadow: 0 calc(5px * var(--look-lip)) 0 color-mix(in oklab, var(--sim-series-5) 55%, var(--sim-bg-deep)); }
.pb-amphi svg { width: min(100%, 560px); height: auto; display: block; }
.pb-read { margin: 0; font: 600 var(--sim-text-lg)/1.2 var(--sim-font-display, var(--sim-font)); color: var(--sim-label); text-align: center; }
.pb-side { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.pb-mini { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; opacity: 0.6; }
.pb-mini svg { width: 40px; height: 40px; display: block; }
.pb[data-step="4"] .pb-tl { display: none; }
@media (prefers-reduced-motion: reduce) { .pb-val { animation: none; } }
`;

export class PhylaBoardScene extends DomSimulation {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3), one(4)];
  static WIDTH = 1040; static HEIGHT = 440; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 620;
  static LAYOUT = 'fit';
  static ARIA_LABEL = 'Eight drawn phyla, side by side, with the habitat, level of organisation and skeleton printed in the book for each one.';
  static CONTROLS = [];
  tl = tapLight({ label: 'Compare the phyla', chips: CHIPS, onChange: () => this._paint() });
  async setup() {
    await super.setup();
    this.render({ css: CSS, rootClass: 'sl-backdrop pb' });
    this.hostEl = document.createElement('div'); this.hostEl.className = 'pb-body';
    this.tlEl = document.createElement('div'); this.tlEl.className = 'pb-tl';
    this.root.appendChild(this.tlEl); this.root.appendChild(this.hostEl);
    this.tl.mount(this.tlEl, this);
    this.stepIndex = 0;
    this.onStep(0);
  }
  destroy() { this.tl.destroy(); super.destroy(); }
  onStep(step) {
    this.root.dataset.step = String(step);
    this.tl.set({ lit: step === 0 ? ['hab'] : step === 2 ? ['ske'] : ['lev'] });
    this.tlEl.style.display = step >= 3 ? 'none' : '';
    this._paint();
  }
  _row() { return ['hab', 'lev', 'ske'].find((t) => this.tl.has(t)) ?? 'hab'; }
  _portrait() { return (this.root?.clientWidth || 700) < 520; }
  _paint() {
    if (!this.hostEl) return;
    this.root.classList.toggle('pb--p', this._portrait());
    const step = this.stepIndex ?? 0;
    if (step === 4) { this.hostEl.innerHTML = this._amphi(); this.relayout?.(); return; }
    const row = step === 3 ? 'lev' : this._row();
    const cards = P.map((p) => {
      const v = p[row], t = row === 'hab' ? 6 : TONE[v];
      return `<div class="pb-card" style="--c:var(--sim-series-${t})"><div class="pb-name">${esc(p.n)}</div><div class="pb-art">${bioIcon(p.a, 48)}</div><div class="pb-eg">${esc(p.e)}</div><div class="pb-val" data-row="${row}">${esc(v)}</div></div>`;
    }).join('');
    const title = step === 3 ? 'From sponges to echinoderms' : ROW[row];
    const pat = step === 3 ? `<ul class="pb-pat">${[['Better feeding', 2], ['Better movement', 5], ['Better protection', 3], ['New challenges', 1]].map(([s, t]) => `<li style="--c:var(--sim-series-${t})">${esc(s)}</li>`).join('')}</ul>` : '';
    this.hostEl.innerHTML = `<div class="pb"><p class="pb-title">${esc(title)}</p><div class="pb-grid">${cards}</div>${pat}</div>`;
    this.relayout?.();
  }
  _amphi() {
    return `<div class="pb"><p class="pb-title">Outside the eight</p><div class="pb-amphi">${amphi()}<p class="pb-read">Amphioxus: a notochord and no backbone</p></div><div class="pb-mini" aria-hidden="true">${P.map((p) => bioIcon(p.a, 40)).join('')}</div></div>`;
  }
}
