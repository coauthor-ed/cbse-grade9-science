import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * ActionReactionGame - mini-game for les-15, hosted by mini-game@1.
 *
 * Tie level L3 (strategy). Redesigned 2026-09-01: the original was 3x
 * 3-option MCQ ("pick the action-reaction pair"). Sound content, but pure
 * recognition with no simulated consequence, so it read as L1.
 *
 * L15's own worked example (blk-l15-s10, "Equal Forces, Wildly Different
 * Effects") is exactly the richer, quantitative half of the third law this
 * redesign builds on: the SAME 300 N pushes apart a canoe and a battleship
 * every time (the third law fixes the force pair), but a = F/m means their
 * accelerations are nowhere near equal - "the same 300 N, divided by the
 * canoe's small mass, gives a large acceleration... divided by the
 * battleship's enormous mass, gives an acceleration far too small to see."
 * This game makes that inverse relationship the win condition, using the
 * lesson's own 300 N and its own two bodies.
 *
 * ONE control: the canoe's mass (the battleship's is fixed and huge, so its
 * own acceleration is shown only as a tiny reference number - matching the
 * lesson's "too small to see" line). Win: tune the canoe's mass so its
 * acceleration lands on a target value.
 *
 *   F = 300 N (fixed, both bodies, per s10)
 *   canoeAccel = F / canoeMass
 *   target: canoeAccel = 3 m/s^2  ->  canoeMass = 100 kg
 *
 * The designed wrong attractor is the direct inverse of what a=F/m says:
 * a student reaches for a HEAVIER canoe expecting a BIGGER acceleration
 * (the everyday "more mass = more effect" intuition) and gets a weaker one
 * instead. A second attractor (too light) overshoots the other way.
 *
 * Built on DomSimulation - one slider, two bodies recoiling apart with a
 * CSS-transition push (no rAF loop), Quill via SimMascotDom.
 */

const W = 900;
const H = 600;

const FORCE = 300;          // N, fixed, both bodies - the third law's own guarantee
const SHIP_MASS = 30000;    // kg, fixed and huge
const CANOE_MIN = 20;
const CANOE_MAX = 300;
const CANOE_DEFAULT = 60;
const TARGET_ACCEL = 3;     // m/s^2
const TOLERANCE = 0.15;     // +-15%

const CSS = `
.ar { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.ar .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.ar h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.ar h2 b { color: var(--sim-accent); }

.ar .scene { position: relative; width: 900px; height: 170px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; margin-bottom: 8px; overflow: hidden; }
.ar svg { display: block; width: 100%; height: 100%; }
.ar .ship { fill: var(--sim-series-2); transition: transform 700ms cubic-bezier(.2,.8,.2,1); transform-box: fill-box; transform-origin: center; }
.ar .canoe { fill: var(--sim-series-1); transition: transform 700ms cubic-bezier(.2,.8,.2,1); transform-box: fill-box; transform-origin: center; }
.ar .force-arrow { stroke: var(--sim-gold); stroke-width: 5; stroke-linecap: round; }
.ar .force-head { fill: var(--sim-gold); }
.ar .lab { font: 700 13px var(--sim-font, system-ui); fill: var(--sim-label-muted); }

.ar .row { display: grid; grid-template-columns: 140px 1fr 90px; align-items: center; gap: 14px; padding: 12px 14px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-panel); margin: 10px 0; }
.ar .row .name { font: 700 15px var(--sim-font, system-ui); }
.ar .row input[type="range"] { width: 100%; }
.ar .row .val { font: 700 17px var(--sim-font-display, system-ui); text-align: right; }

.ar .readouts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ar .readout { padding: 12px 14px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-bg-surface); }
.ar .readout .kicker { margin: 0 0 4px; }
.ar .readout .v { font: 700 18px var(--sim-font-display, system-ui); color: var(--sim-accent); }

.ar .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class ActionReactionGame extends withChallenge(DomSimulation) {
  static simId = 'action-reaction-game';
  static label = { en: 'Same Force, Different Fate' };
  static category = 'science.forces';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A canoe and a battleship push apart with the same 300 newton force. Set the canoe\'s mass to hit a target acceleration.';
  static OBJECTIVE = {
    prompt: {
      en: 'The SAME 300 N force pushes the canoe and the battleship apart, every time. Set the canoe\'s MASS so the canoe\'s acceleration is 3 m/s^2.',
    },
  };
  static SCORING = { mode: 'accuracy', tolerance: TOLERANCE };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.canoeMass = CANOE_DEFAULT;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="ar">
        <p class="kicker">Equal forces, unequal effects</p>
        <h2>Set the canoe's mass so its acceleration hits <b>3 m/s<sup>2</sup></b>.</h2>
        <div class="scene">
          <svg viewBox="0 0 900 170" aria-hidden="true">
            <text class="lab" x="450" y="26" text-anchor="middle">300 N on each - always equal, by the third law</text>
            <line class="force-arrow" x1="430" y1="85" x2="380" y2="85"></line>
            <polygon class="force-head" points="380,85 392,79 392,91"></polygon>
            <line class="force-arrow" x1="470" y1="85" x2="520" y2="85"></line>
            <polygon class="force-head" points="520,85 508,79 508,91"></polygon>
            <rect class="canoe" id="ar-canoe" x="260" y="100" width="90" height="36" rx="8"></rect>
            <text class="lab" x="305" y="150" text-anchor="middle">canoe</text>
            <rect class="ship" id="ar-ship" x="560" y="90" width="150" height="56" rx="8"></rect>
            <text class="lab" x="635" y="160" text-anchor="middle">battleship (fixed, huge)</text>
          </svg>
        </div>
        <div class="row">
          <span class="name">Canoe's mass</span>
          <input type="range" id="ar-mass" min="${CANOE_MIN}" max="${CANOE_MAX}" step="1" value="${CANOE_DEFAULT}">
          <span class="val" id="ar-vmass">${CANOE_DEFAULT} kg</span>
        </div>
        <div class="readouts">
          <div class="readout"><p class="kicker">Canoe's acceleration</p><span class="v" id="ar-canoe-a">-</span></div>
          <div class="readout"><p class="kicker">Battleship's acceleration</p><span class="v" id="ar-ship-a">-</span></div>
        </div>
        <p class="foot">a = F / m. The force never changes - only mass decides how much each body actually moves.</p>
      </div>
    `);

    this._massIn = this.root.querySelector('#ar-mass');
    this._vmass = this.root.querySelector('#ar-vmass');
    this._canoeA = this.root.querySelector('#ar-canoe-a');
    this._shipA = this.root.querySelector('#ar-ship-a');
    this._canoeEl = this.root.querySelector('#ar-canoe');
    this._shipEl = this.root.querySelector('#ar-ship');

    this.quill = SimMascotDom.mount(this.root, { x: 740, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._massIn.addEventListener('input', () => {
      this.canoeMass = Number(this._massIn.value);
      this._moved = true;
      this._render();
    });

    this._render();
    this.quill.speak('Same 300 newtons on both, always. Only the masses decide who actually moves.', 5400);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _canoeAccel() { return FORCE / this.canoeMass; }
  _shipAccel() { return FORCE / SHIP_MASS; }

  _render() {
    this._vmass.textContent = `${this.canoeMass} kg`;
    const ca = this._canoeAccel();
    const sa = this._shipAccel();
    this._canoeA.textContent = this._moved ? `${ca.toFixed(2)} m/s^2` : '-';
    this._shipA.textContent = this._moved ? `${sa.toFixed(4)} m/s^2 (too small to see)` : '-';

    if (this._moved) {
      const canoeShift = Math.max(-60, -ca * 14);
      const shipShift = Math.max(-8, -sa * 400);
      this._canoeEl.style.transform = `translateX(${canoeShift}px)`;
      this._shipEl.style.transform = `translateX(${shipShift}px)`;
    }
  }

  checkObjective() {
    if (!this._moved) return null;
    const ca = this._canoeAccel();
    const err = Math.abs(ca - TARGET_ACCEL) / TARGET_ACCEL;
    if (err <= TOLERANCE) {
      this.quill?.perform('hop');
      return { value: ca, target: TARGET_ACCEL, hint: 'Same force, and mass alone decided the acceleration.' };
    }
    this.quill?.setExpression('surprised');
    const hint = ca < TARGET_ACCEL
      ? 'Too little acceleration - a heavier canoe soaks up more of the same force and moves less. Try a LIGHTER canoe.'
      : 'Too much acceleration - a lighter canoe barely resists the same force. Try a HEAVIER canoe.';
    return { value: ca, target: TARGET_ACCEL, hint };
  }
}
