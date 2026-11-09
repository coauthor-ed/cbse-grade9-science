import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { treeCards, TREE_CARDS_CSS } from 'simulations/base/kit/TreeCards.js';

// blk-l01-s08: each beat reconstructs its whole state; no cross-block memory.
// Beat 3 adds the course's shared throughline: the classification tree,
// here at its very first state (root only, three unnamed branches hinted).
const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

const TREE = {
  root: { label: 'Living things', state: 'new' },
  branches: [0, 1, 2].map(() => ({ state: 'placeholder', name: 'Branch', sub: 'not named yet' })),
  caption: 'The tree so far - one root, waiting to split.',
};

const CSS = `
  .ru-root {
    box-sizing: border-box;
    padding: var(--sim-space-4);
    color: var(--sim-label);
    background: var(--sim-bg-deep);
    font-family: var(--sim-font);
    font-size: var(--sim-text-lg);
    line-height: 1.4;
    display: flex;
    flex-direction: column;
    gap: var(--sim-space-3);
  }
  .ru-root * { box-sizing: border-box; min-width: 0; }
  .ru-root [hidden] { display: none !important; }
  .ru-main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 180px;
    align-items: stretch;
    gap: var(--sim-space-3);
  }
  .ru-card {
    background: var(--sim-bg-surface);
    border:2px solid var(--sim-stroke);
    border-radius:var(--sim-radius-md);
    padding: var(--sim-space-3) var(--sim-space-3); box-shadow:0 3px 0 var(--sim-stroke);}
  .ru-fields { display: flex; flex-direction: column; gap: var(--sim-space-2); }
  .ru-field + .ru-field { border-top: 1px solid var(--sim-stroke); padding-top: 9px; }
  .ru-key { color: var(--sim-label-muted); }
  .ru-group {
    display: inline-block;
    padding: 1px var(--sim-space-2);
    border: 2px solid var(--sim-accent);
    border-radius: var(--sim-radius-pill);
    color: var(--sim-accent);
    font-weight: 600;
  }
  .ru-uses { display: flex; flex-direction: column; justify-content: space-around; gap: var(--sim-space-3); }
  .ru-use { display: flex; align-items: center; gap: var(--sim-space-2); }
  .ru-arrow { color: var(--sim-label-muted); font-size: var(--sim-text-2xl); }
  .ru-chip {
    flex: 1;
    text-align: center;
    border: 2px solid var(--sim-accent);
    border-radius: var(--sim-radius-pill);
    background: var(--sim-bg-surface);
    padding: var(--sim-space-2) var(--sim-space-2);
    font-weight: 600;
  }
  .ru-local-section { margin-top: -14px; }
  .ru-link {
    display: block;
    width: 28px;
    height: 36px;
    margin-left: auto;
    margin-right: 64px;
    color: var(--sim-label-muted);
  }
  .ru-link line { stroke: currentColor; stroke-width: 2; stroke-dasharray: 4 3; }
  .ru-link path { fill: none; stroke: currentColor; stroke-width: 2; }
  .ru-heading { font-size: var(--sim-text-xl); font-weight: 700; margin: 0 0 9px; }
  .ru-local .ru-fields { gap: var(--sim-space-1); }
  .ru-local .ru-field + .ru-field { padding-top: 5px; }
  .ru-micro { background: var(--sim-bg-cell); border-style: dashed; }
  .ru-pending-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sim-space-2); }
  .ru-unresolved {
    color: var(--sim-label-muted);
    border-color: var(--sim-label-muted);
    background: transparent;
    border-style: dashed;
  }
  .ru-root[data-step="1"] .ru-local,
  .ru-root[data-step="2"] .ru-micro { animation: ru-arrive 350ms ease-out both; }
  @keyframes ru-arrive {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .ru-tree { margin-top: 4px; }
  .ru-root[data-step="3"] .ru-tree { animation: ru-arrive 350ms ease-out both; }
  .ru-root.sim-dom-root--portrait { font-size: var(--sim-text-lg); }
  .sim-dom-root--portrait .ru-main { grid-template-columns: minmax(0, 1fr); gap: var(--sim-space-2); }
  .sim-dom-root--portrait .ru-uses { gap: var(--sim-space-2); padding-left: 18px; }
  .sim-dom-root--portrait .ru-chip { padding: var(--sim-space-1) var(--sim-space-2); }
  .sim-dom-root--portrait .ru-link { margin-right: 144px; }
  @media (prefers-reduced-motion: reduce) {
    .ru-root .ru-local, .ru-root .ru-micro { animation: none !important; }
  }
`;

export class RecordUsesScene extends DomSimulation {
  static WIDTH = 580;
  // Measured in Chromium (real content, not guessed): landscape 779 / portrait 866.
  static HEIGHT = 823;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1079;
  // Dense content: beside the text only when it can render at >= 0.9x, else full width below.
  static MIN_SCALE = 0.9;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static FIT = true;
  static ARIA_LABEL = 'Observation records, their uses, an unresolved microscopic record, and the classification tree\'s first state.';
  // Lesson navigation is the only driver: the closing unresolved state holds.
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.stepIndex = 0;
  }

  async setup() {
    await super.setup();
    this.root.classList.add('ru-root');
    this.root.setAttribute('role', 'group');
    this.root.setAttribute('aria-label', this.constructor.ARIA_LABEL);
    this.root.innerHTML = `
      <div class="ru-main">
        <div class="ru-card ru-fields" role="group" aria-label="Observation record">
          <div class="ru-field"><span class="ru-key">Organism:</span> <span class="ru-group">bird</span> — species unsure</div>
          <div class="ru-field"><span class="ru-key">Where:</span> garden fence</div>
          <div class="ru-field"><span class="ru-key">When:</span> daylight</div>
          <div class="ru-field"><span class="ru-key">Feature:</span> feathers</div>
        </div>
        <div class="ru-uses" role="group" aria-label="Uses linked to the observation record">
          <div class="ru-use"><span class="ru-arrow" aria-hidden="true">→</span><span class="ru-chip">Comparison</span></div>
          <div class="ru-use"><span class="ru-arrow" aria-hidden="true">→</span><span class="ru-chip">Naming</span></div>
          <div class="ru-use"><span class="ru-arrow" aria-hidden="true">→</span><span class="ru-chip">Conservation</span></div>
        </div>
      </div>
    `;
    this._local = document.createElement('div');
    this._local.className = 'ru-local-section';
    this._local.innerHTML = `
        <svg class="ru-link" viewBox="0 0 28 36" role="img" aria-label="Two-way link between Conservation and Local record">
          <line x1="14" y1="3" x2="14" y2="33" />
          <path d="M9 8 L14 3 L19 8 M9 28 L14 33 L19 28" />
        </svg>
        <div class="ru-card ru-local" role="group" aria-label="Local record">
          <div class="ru-heading">Local record</div>
          <div class="ru-fields">
            <div class="ru-field">Landscape-linked community</div>
            <div class="ru-field">Protected habitat patch</div>
          </div>
        </div>
    `;
    this.root.appendChild(this._local);
    this._micro = document.createElement('div');
    this._micro.className = 'ru-card ru-micro';
    this._micro.setAttribute('role', 'group');
    this._micro.setAttribute('aria-label', 'Microscopic organism, unresolved record');
    this._micro.innerHTML = `
        <div class="ru-heading">Microscopic organism</div>
        <div class="ru-fields">
          <div class="ru-field"><span class="ru-key">Size:</span> too small to see unaided</div>
          <div class="ru-field ru-pending-row">
            <span><span class="ru-key">Body covering:</span> (blank)</span>
            <span class="ru-group ru-unresolved">unresolved</span>
          </div>
        </div>
    `;
    this.root.appendChild(this._micro);
    this._tree = document.createElement('div');
    this._tree.className = 'ru-tree';
    this._tree.setAttribute('role', 'group');
    this._tree.setAttribute('aria-label', 'The classification tree, first state: one root, three unnamed branches hinted.');
    this._tree.innerHTML = treeCards(TREE);
    this.root.appendChild(this._tree);
    this.injectStyle(CSS + TREE_CARDS_CSS);
    this._render();
  }

  onStep() {
    this._render();
  }

  _render() {
    if (!this.root) return;
    this.root.dataset.step = String(this.stepIndex);
    this._local.hidden = this.stepIndex < 1;
    this._micro.hidden = this.stepIndex < 2;
    this._tree.hidden = this.stepIndex < 3;
    this.refit();
  }

}
