import { GameBoard, mountGame, onTap } from '../shared/GameFrame.js';

/**
 * BulbConductorGame - mini-game for les-01, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). The lesson's claim is not "salt is special" but
 * "something free to move carries the charge". Six samples are listed and two
 * of them conduct. The wrong attractor is "it dissolved", so sugar water is
 * exactly the trap.
 *
 * A pick is the student's prediction, not a test result: a card lit up here says
 * "I think this one lights", so a wrong pick must not read as a lit bulb until
 * Check has answered.
 */

const SAMPLES = [
  { id: 'salt-water',  name: 'Salt water',       tip: 'Salt dissolved in water' },
  { id: 'sugar-water', name: 'Sugar water',      tip: 'Sugar dissolved in water' },
  { id: 'pure-water',  name: 'Pure water',       tip: 'Water and nothing else' },
  { id: 'dry-salt',    name: 'Dry salt crystal', tip: 'A solid grain, not in water' },
  { id: 'hcl',         name: 'Dilute HCl',       tip: 'A strong acid in water' },
  { id: 'sand',        name: 'Wet sand',         tip: 'Sand does not dissolve' },
];

const CONDUCTORS = new Set(['salt-water', 'hcl']);

const CSS = `
.bc .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.bc .card { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 14px; padding: 10px 12px;
            min-height: 94px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.bc .card[aria-pressed="true"] { background: color-mix(in oklab, var(--sim-gold) 20%, var(--sim-bg-surface));
                                 border-color: var(--sim-gold); outline: 2px solid var(--sim-gold); outline-offset: 1px; }
.bc .swatch { display: flex; align-items: center; gap: 8px; }
.bc .bulb { width: 22px; height: 22px; border-radius: 50%; background: var(--sim-bg-deep);
            border: var(--sim-border); flex: 0 0 22px; }
.bc .card[aria-pressed="true"] .bulb { background: var(--sim-gold); border-color: var(--sim-gold); }
.bc .name { font-weight: 800; font-size: 17px; line-height: 1.15; }
.bc .tip { font-size: 14px; line-height: 1.2; color: var(--sim-label-muted); }
.bc .tally { display: flex; gap: 12px; align-items: baseline; }
.bc .big { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; color: var(--sim-accent); }
.bc .lab { color: var(--sim-label-muted); font-size: 15px; }
.bc .footer { font-size: 15px; color: var(--sim-label-muted); }
.bc .footer b { color: var(--sim-accent); }

.sim-dom-root--portrait .bc .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.sim-dom-root--portrait .bc .card { min-height: 84px; padding: 8px; }
.sim-dom-root--portrait .bc .name { font-size: 16px; }
.sim-dom-root--portrait .bc .footer { display: none; }
`;

export class BulbConductorGame extends GameBoard {
  static simId = 'bulb-conductor-game';
  static label = { en: 'The Bulb Decides' };
  static category = 'science.electricity';
  static ARIA_LABEL = 'Six samples. Tap the ones you think will light the bulb.';
  static OBJECTIVE = {
    prompt: { en: 'Pick every sample that lights the bulb. Dissolving is not enough on its own.' },
  };

  constructor(container, config) {
    super(container, config);
    this.picked = new Set();
    this._moved = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `
        <div class="gm bc">
          <div class="gm-head">
            <p class="kicker">The case so far</p>
            <h2>Which of these <b>light the bulb</b>?</h2>
            <p class="sub">Tap each sample you think will light it. Sugar water looks the same as salt water, so what decides it?</p>
          </div>
          <div class="grid">
            ${SAMPLES.map((s) => `
              <div class="card tap" data-id="${s.id}" role="button" tabindex="0" aria-pressed="false">
                <div class="swatch">
                  <div class="bulb" aria-hidden="true"></div>
                  <div class="name">${s.name}</div>
                </div>
                <div class="tip">${s.tip}</div>
              </div>`).join('')}
          </div>
          <div class="tally">
            <span class="big" id="bc-count">0</span>
            <span class="lab">picked</span>
            <span class="footer">A charged particle has to be <b>free to move</b>.</span>
          </div>
        </div>`,
    });
    this._countOut = this.root.querySelector('#bc-count');
    this.root.querySelectorAll('.card').forEach((el) => onTap(el, () => {
      const id = el.dataset.id;
      if (this.picked.has(id)) this.picked.delete(id);
      else this.picked.add(id);
      this._moved = true;
      this._render();
    }));
    this._render();
    this.quill.speak('Salt water lights it. What about the others?', 5200);
  }

  _render() {
    this.root.querySelectorAll('.card').forEach((el) => {
      el.setAttribute('aria-pressed', this.picked.has(el.dataset.id) ? 'true' : 'false');
    });
    this._countOut.textContent = String(this.picked.size);
  }

  checkObjective() {
    if (!this._moved) return null;
    if (this.picked.size === 0) return null;
    let right = 0, wrong = 0;
    for (const id of this.picked) {
      if (CONDUCTORS.has(id)) right += 1;
      else wrong += 1;
    }
    if (right === CONDUCTORS.size && wrong === 0) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    if (wrong > 0 && right === 0) {
      return { ok: false, hint: 'None of those light it. The rule is not "it dissolved". The rule is "charges are free to move".' };
    }
    if (wrong > 0) {
      return { ok: false, hint: `${wrong} of your picks ${wrong === 1 ? 'does' : 'do'} not light the bulb. Some samples dissolve without freeing any charge.` };
    }
    return { ok: false, hint: 'You found one conductor, but there is another. A second sample also lets charge move.' };
  }
}
