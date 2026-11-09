import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * WhereGrowthHappensGame - mini-game for les-04, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). Three plants each need something different:
 * a root has to get LONGER, a trunk has to get THICKER, a mown blade has to
 * COME BACK after its tip is gone. The student places the dividing cells and
 * watches whether the plant does what it needed to do.
 *
 * The names apical, lateral and intercalary are never shown - only positions
 * and outcomes - so the student has to reason from what each job mechanically
 * requires, which is the lesson's own line of argument rather than its
 * vocabulary list. "Everywhere" is offered and loses all three, because the
 * bean-root experiment on slide blk-l04-s1 already ruled it out: removing two
 * millimetres stopped every bit of elongation.
 */

const W = 900;
const H = 600;

const PLACES = [
  { value: 'tip',        label: 'Right at the growing tip' },
  { value: 'ring',       label: 'A ring running along the sides' },
  { value: 'base',       label: 'Just above the base, below the tip' },
  { value: 'everywhere', label: 'Spread evenly through every cell' },
];

const PLANTS = [
  { id: 'root',  name: 'A bean root',       need: 'must get longer',            answer: 'tip'  },
  { id: 'trunk', name: 'A young tree trunk', need: 'must get thicker',          answer: 'ring' },
  { id: 'grass', name: 'A mown grass blade', need: 'must regrow after its tip is cut off', answer: 'base' },
];

const CSS = `
.wgh { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }
.wgh .grid {
  position: absolute; inset: 30px 40px 96px;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
}
.wgh .card {
  border: 3px solid var(--sim-border); border-radius: 20px;
  background: var(--sim-bg-surface); padding: 16px; box-sizing: border-box;
  display: flex; flex-direction: column;
}
.wgh .card.ok { border-color: var(--sim-good); }
.wgh .card h4 { margin: 0 0 3px; font-size: 17px; }
.wgh .card .need { margin: 0 0 12px; font-size: 13px; color: var(--sim-label-muted); }

.wgh .stage { flex: 1; position: relative; min-height: 210px; }
.wgh .plant {
  position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%);
  background: var(--sim-series-2); border: 2px solid var(--sim-bg-deep);
  border-radius: 8px;
  transition: height var(--motion-slow, 420ms) var(--ease-settle, ease),
              width var(--motion-slow, 420ms) var(--ease-settle, ease);
}
.wgh .ghost {
  position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%);
  border: 2px dashed var(--sim-border); border-radius: 8px;
}
.wgh .zone {
  position: absolute; background: var(--sim-accent); opacity: 0.75; border-radius: 4px;
  transition: all var(--motion-base, 240ms) ease;
}
.wgh .cut {
  position: absolute; left: 50%; transform: translateX(-50%);
  width: 74px; height: 0; border-top: 3px dashed var(--sim-warning);
}
.wgh .verdict { margin: 10px 0 0; font-size: 14px; font-weight: 700; text-align: center; }
.wgh .card.ok .verdict { color: var(--sim-good); }
.wgh .card:not(.ok) .verdict { color: var(--sim-label-muted); }

.wgh .hintline {
  position: absolute; left: 40px; right: 260px; bottom: 30px;
  font-size: 14px; line-height: 1.5; color: var(--sim-label-muted); margin: 0;
}
.wgh .hintline b { color: var(--sim-accent); }

@media (prefers-reduced-motion: reduce) {
  .wgh .plant, .wgh .zone { transition: none; }
}
`;

export class WhereGrowthHappensGame extends withChallenge(DomSimulation) {
  static simId = 'where-growth-happens-game';
  static label = { en: 'Where Does the Growth Go?' };
  static category = 'biology.tissues';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Three plants: a root that must lengthen, a trunk that must thicken, and a mown grass blade '
    + 'that must regrow. For each, choose where the dividing cells sit.';

  static OBJECTIVE = {
    prompt: { en: 'Put the dividing cells where each plant needs them. All three have to do their job.' },
  };
  static SCORING = { mode: 'accuracy', tolerance: 0.02 };

  static CONTROLS = PLANTS.map((p) => ({
    type: 'select',
    id: p.id,
    label: `${p.name} (${p.need}):`,
    value: 'everywhere',
    options: PLACES.map((pl) => ({ value: pl.value, label: pl.label })),
  }));

  constructor(container, config) {
    super(container, config);
    this.choice = { root: 'everywhere', trunk: 'everywhere', grass: 'everywhere' };
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="wgh">
        <div class="grid">
          ${PLANTS.map((p) => `
            <div class="card" data-plant="${p.id}">
              <h4>${p.name}</h4>
              <p class="need">${p.need}</p>
              <div class="stage">
                <div class="ghost"></div>
                <div class="plant"></div>
                <div class="zone"></div>
                ${p.id === 'grass' ? '<div class="cut"></div>' : ''}
              </div>
              <p class="verdict">no change</p>
            </div>`).join('')}
        </div>
        <p class="hintline"></p>
      </div>
    `);

    this._cards = {};
    PLANTS.forEach((p) => { this._cards[p.id] = this.root.querySelector(`[data-plant="${p.id}"]`); });
    this._hint = this.root.querySelector('.hintline');

    this.quill = SimMascotDom.mount(this.root, { x: 790, y: 552, height: 122, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Three plants, three different jobs. One answer will not cover them.', 5000);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  onBeatChange() { /* a game, not a paced explainer */ }

  onControlChange(id, value) {
    if (!(id in this.choice)) return;
    this.choice[id] = String(value);
    this._moved = true;
    this._render();
  }

  _correct() { return PLANTS.filter((p) => this.choice[p.id] === p.answer).length; }

  _render() {
    PLANTS.forEach((p) => {
      const card = this._cards[p.id];
      const pick = this.choice[p.id];
      const ok = pick === p.answer;
      card.classList.toggle('ok', ok);

      const plant = card.querySelector('.plant');
      const ghost = card.querySelector('.ghost');
      const zone = card.querySelector('.zone');
      const cut = card.querySelector('.cut');

      // start size, and what this choice grows it into
      const base = p.id === 'trunk' ? { w: 40, h: 150 } : { w: 26, h: 110 };
      ghost.style.width = `${base.w}px`;
      ghost.style.height = `${base.h}px`;

      let w = base.w;
      let h = p.id === 'grass' ? 60 : base.h;   // the mown blade starts cut short
      if (ok) {
        if (p.id === 'trunk') w = base.w * 2.1;
        else h = base.h + 60;
      }
      plant.style.width = `${w}px`;
      plant.style.height = `${h}px`;

      // where the dividing cells are drawn
      const styles = {
        tip:        { left: '50%', bottom: `${h + 8}px`, width: '30px', height: '12px', transform: 'translateX(-50%)', opacity: '0.85' },
        ring:       { left: '50%', bottom: '8px', width: `${w + 10}px`, height: `${h}px`, transform: 'translateX(-50%)', opacity: '0.28' },
        base:       { left: '50%', bottom: '30px', width: `${w + 8}px`, height: '14px', transform: 'translateX(-50%)', opacity: '0.85' },
        everywhere: { left: '50%', bottom: '8px', width: `${w}px`, height: `${h}px`, transform: 'translateX(-50%)', opacity: '0.3' },
      }[pick];
      Object.assign(zone.style, { left: '', bottom: '', width: '', height: '', transform: '', opacity: '' }, styles);

      if (cut) cut.style.bottom = `${h + 12}px`;

      card.querySelector('.verdict').textContent = ok
        ? (p.id === 'trunk' ? 'thicker' : p.id === 'grass' ? 'grown back' : 'longer')
        : pick === 'everywhere' ? 'nothing happens' : 'wrong place - no change';
    });

    this._hint.innerHTML = `<b>${this._correct()} of ${PLANTS.length}</b> plants are doing what they needed to do.`;
  }

  checkObjective() {
    if (!this._moved) return null;
    const n = this._correct();

    if (n === PLANTS.length) {
      this.quill?.perform('hop');
      return { value: n, target: PLANTS.length };
    }
    this.quill?.setExpression('surprised');

    const allEverywhere = PLANTS.every((p) => this.choice[p.id] === 'everywhere');
    const wrong = PLANTS.find((p) => this.choice[p.id] !== p.answer);
    const hint = allEverywhere
      ? 'If division happened in every cell, snipping two millimetres off a bean root would barely matter. It stopped the root dead.'
      : this.choice[wrong.id] === 'everywhere'
        ? `${wrong.name} still has division spread everywhere, and the bean root already ruled that out.`
        : `${wrong.name} ${wrong.need}. Ask which direction new cells would have to appear in to do that.`;
    return { ok: false, hint };
  }
}
