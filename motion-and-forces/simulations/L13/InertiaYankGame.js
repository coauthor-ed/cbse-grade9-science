import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * InertiaYankGame - mini-game for les-13, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). Redesigned 2026-09-01: the original was a
 * 4-option MCQ about the tablecloth trick. Sound content, but a single
 * multiple-choice pick with no simulated consequence read as L1 - and
 * the tablecloth scenario is explicitly FRICTIONLESS (blk-l13-game's own
 * old objective said so), which means yank SPEED cannot be a meaningful
 * lever for a redesign: on a frictionless cloth, the book stays put at
 * ANY yank speed, so a "yank fast enough" mechanic would misstate the
 * physics the lesson is isolating.
 *
 * L13 has a second worked scenario that DOES have a real, continuous,
 * physically-meaningful lever: the bus lurch (blk-l13-s4). "The driver
 * brakes... she lurches forward. Now the bus speeds up... she lurches
 * backward" - a signed velocity change with a signed, non-obvious
 * consequence. This redesign is built on that instead.
 *
 * ONE slider: how the bus's velocity changes (negative = braking,
 * positive = speeding up). The passenger keeps her own velocity
 * (inertia) while the bus's changes, so:
 *   bus BRAKES (slider < 0)   -> passenger lurches FORWARD relative to the bus
 *   bus SPEEDS UP (slider > 0) -> passenger lurches BACKWARD relative to the bus
 * Win: produce a clear BACKWARD lurch (busChange >= +3 - direction right AND
 * big enough to actually register as a lurch, not a wobble).
 *
 * The designed wrong attractor is the direct swap the lesson itself would
 * catch: a student asked for "backward" reaches for BRAKING, on the (wrong)
 * word-association that braking pulls things backward - it is exactly the
 * opposite direction s4 states. A second attractor (speeding up, but only
 * barely) catches "right direction, not enough magnitude to count".
 *
 * Built on DomSimulation - a single signed slider and an animated (CSS
 * transition, no rAF) passenger figure, Quill via SimMascotDom.
 */

const W = 900;
const H = 600;

const CHANGE_MIN = -8;
const CHANGE_MAX = 8;
const CHANGE_DEFAULT = 0;
const BACKWARD_THRESHOLD = 3;

const CSS = `
.iy { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.iy .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.iy h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.iy h2 b { color: var(--sim-accent); }

.iy .scene { position: relative; width: 900px; height: 190px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; margin-bottom: 8px; overflow: hidden; }
.iy svg { display: block; width: 100%; height: 100%; }
.iy .bus { fill: var(--sim-series-1); }
.iy .wheel { fill: var(--sim-bg-deep); }
.iy .passenger { fill: var(--sim-accent); transition: transform 700ms cubic-bezier(.2,.8,.2,1); transform-box: fill-box; transform-origin: center; }
.iy .floor { stroke: var(--sim-border); stroke-width: 3; }
.iy .zone-fwd, .iy .zone-back { opacity: 0.16; }
.iy .zone-fwd { fill: var(--sim-bad); }
.iy .zone-back { fill: var(--sim-good); }

.iy .row { display: grid; grid-template-columns: 190px 1fr 110px; align-items: center; gap: 14px; padding: 12px 14px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-panel); margin: 10px 0; }
.iy .row .name { font: 700 15px var(--sim-font, system-ui); }
.iy .row input[type="range"] { width: 100%; }
.iy .row .val { font: 700 17px var(--sim-font-display, system-ui); text-align: right; }

.iy .readout { padding: 14px 16px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-bg-surface); display: flex; align-items: center; justify-content: space-between; }
.iy .readout .kicker { margin: 0; }
.iy .readout .v { font: 700 20px var(--sim-font-display, system-ui); color: var(--sim-accent); }

.iy .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class InertiaYankGame extends withChallenge(DomSimulation) {
  static simId = 'inertia-yank-game';
  static label = { en: 'The Bus Lurch' };
  static category = 'science.forces';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A passenger stands in a moving bus. Set whether the bus brakes or speeds up so the passenger lurches backward.';
  static OBJECTIVE = {
    prompt: {
      en: "A passenger stands in a moving bus. Set the bus's speed change so the passenger lurches BACKWARD relative to the bus.",
    },
  };
  static SCORING = { mode: 'ok' };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.change = CHANGE_DEFAULT;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="iy">
        <p class="kicker">Inertia - she keeps her own velocity</p>
        <h2>Set the bus's speed change so the passenger lurches <b>backward</b>.</h2>
        <div class="scene">
          <svg viewBox="0 0 900 190" aria-hidden="true">
            <line class="floor" x1="20" y1="150" x2="880" y2="150"/>
            <rect class="bus" x="260" y="60" width="380" height="80" rx="10"></rect>
            <circle class="wheel" cx="320" cy="150" r="16"></circle>
            <circle class="wheel" cx="580" cy="150" r="16"></circle>
            <rect class="passenger" id="iy-p" x="435" y="88" width="30" height="44" rx="6"></rect>
            <rect class="zone-fwd" x="640" y="60" width="120" height="80"></rect>
            <rect class="zone-back" x="140" y="60" width="120" height="80"></rect>
            <text x="700" y="50" font-family="var(--sim-font, system-ui)" font-size="13" fill="var(--sim-bad)" font-weight="700" text-anchor="middle">forward lurch</text>
            <text x="200" y="50" font-family="var(--sim-font, system-ui)" font-size="13" fill="var(--sim-good)" font-weight="700" text-anchor="middle">backward lurch</text>
          </svg>
        </div>
        <div class="row">
          <span class="name">Bus: brake &larr; &middot; &rarr; speed up</span>
          <input type="range" id="iy-change" min="${CHANGE_MIN}" max="${CHANGE_MAX}" step="0.5" value="${CHANGE_DEFAULT}">
          <span class="val" id="iy-vchange">0</span>
        </div>
        <div class="readout">
          <p class="kicker">Passenger, relative to the bus</p>
          <span class="v" id="iy-result">standing still with it</span>
        </div>
        <p class="foot">The passenger's own body keeps moving at the OLD speed. Only the bus's speed is changing under her feet.</p>
      </div>
    `);

    this._changeIn = this.root.querySelector('#iy-change');
    this._vchange = this.root.querySelector('#iy-vchange');
    this._result = this.root.querySelector('#iy-result');
    this._p = this.root.querySelector('#iy-p');

    this.quill = SimMascotDom.mount(this.root, { x: 740, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._changeIn.addEventListener('input', () => {
      this.change = Number(this._changeIn.value);
      this._moved = true;
      this._render();
    });

    this._render();
    this.quill.speak('Her body does not know the bus changed speed - it just keeps going.', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _render() {
    this._vchange.textContent = `${this.change > 0 ? '+' : ''}${this.change.toFixed(1)}`;
    if (!this._moved) {
      this._result.textContent = 'standing still with it';
      this._p.style.transform = 'translateX(0px)';
      return;
    }
    // Passenger keeps her velocity; the bus changes under her. A brake
    // (change < 0) leaves her relatively FORWARD; speeding up (change > 0)
    // leaves her relatively BACKWARD. Drawn as a shift opposite the bus's
    // own change, capped for legibility.
    const shiftPx = Math.max(-90, Math.min(90, -this.change * 11));
    this._p.style.transform = `translateX(${shiftPx}px)`;
    if (this.change > 0.3) this._result.textContent = `lurches BACKWARD (by ${this.change.toFixed(1)})`;
    else if (this.change < -0.3) this._result.textContent = `lurches FORWARD (by ${Math.abs(this.change).toFixed(1)})`;
    else this._result.textContent = 'barely moves relative to the bus';
  }

  checkObjective() {
    if (!this._moved) return null;
    if (this.change >= BACKWARD_THRESHOLD) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    let hint;
    if (this.change < 0) {
      hint = 'Braking lurches her FORWARD, not backward - her body keeps going while the bus slows. Try speeding the bus up instead.';
    } else {
      hint = 'Right direction - speeding up does lurch her backward - but not by enough yet. Raise it further.';
    }
    return { ok: false, hint };
  }
}
