import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * FreeBodyFillInGame - mini-game for les-17, hosted by mini-game@1.
 *
 * Tie level L2/L3 (embodiment / strategy). Redesigned 2026-09-01: the
 * original was 3x 4-option MCQ ("pick the missing arrow"). Sound content,
 * but three multiple-choice picks with no simulated consequence, so it
 * read as L1.
 *
 * L17's own hook (blk-l17-s15/s17, "Why Do You Feel Heavier When a Lift
 * Starts Moving?") is the free-body diagram of a person on a scale inside
 * an elevator: two forces touch them, weight mg down and the scale's
 * normal force N up, and "the scale doesn't measure weight directly - it
 * measures N", with N = m(g + a) once the lift accelerates. That is a
 * genuine, quantitative free-body result, and its own classic trap is
 * exactly what this redesign tests: people conflate MOVING (even fast,
 * even upward) with feeling heavier, when it is specifically
 * ACCELERATION that changes the reading - constant velocity, either
 * direction, reads completely normal.
 *
 * ONE control: the lift's acceleration (signed - positive is accelerating
 * upward, negative is accelerating downward, zero is at rest OR moving at
 * ANY constant speed). Win: set the scale reading to a target value.
 *
 *   m = 60 kg, g = 10 m/s^2 -> normal weight = 600 N
 *   N = m * (g + a)
 *   target: N = 780 N  ->  a = +3 m/s^2 (accelerating upward)
 *
 * The designed wrong attractor is the "just moving" trap directly: leave
 * acceleration at 0, on the belief that "the lift is going up" is already
 * enough - it reads a perfectly normal 600 N regardless of speed or
 * direction, because a=0. A second attractor accelerates DOWNWARD,
 * catching a same-sign-as-target-motion-direction confusion.
 *
 * Built on DomSimulation - one slider, a free-body pair of arrows on a
 * person that resize live, Quill via SimMascotDom.
 */

const W = 900;
const H = 600;

const MASS = 60;      // kg
const G = 10;         // m/s^2
const NORMAL_WEIGHT = MASS * G; // 600 N
const A_MIN = -6;
const A_MAX = 6;
const A_DEFAULT = 0;
const TARGET_N = 780;
const TOLERANCE = 0.04; // +-4% -> N in [748.8, 811.2] -> a in [2.48, 3.52]

const CSS = `
.fb { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.fb .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.fb h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.fb h2 b { color: var(--sim-accent); }

.fb .scene { position: relative; width: 900px; height: 210px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; margin-bottom: 8px; overflow: hidden; }
.fb svg { display: block; width: 100%; height: 100%; }
.fb .shaft { stroke: var(--sim-border); stroke-width: 3; stroke-dasharray: 6 8; }
.fb .cab { fill: var(--sim-panel); stroke: var(--sim-border); stroke-width: 2; }
.fb .person { fill: var(--sim-series-1); }
.fb .scale { fill: var(--sim-series-2); }
.fb .w-arrow { stroke: var(--sim-gold); stroke-width: 6; stroke-linecap: round; }
.fb .w-head { fill: var(--sim-gold); }
.fb .n-arrow { stroke: var(--sim-accent); stroke-width: 6; stroke-linecap: round; transition: y1 500ms ease, y2 500ms ease; }
.fb .n-head { fill: var(--sim-accent); transition: transform 500ms ease; }
.fb .lab { font: 700 13px var(--sim-font, system-ui); fill: var(--sim-label-muted); }

.fb .row { display: grid; grid-template-columns: 190px 1fr 110px; align-items: center; gap: 14px; padding: 12px 14px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-panel); margin: 10px 0; }
.fb .row .name { font: 700 15px var(--sim-font, system-ui); }
.fb .row input[type="range"] { width: 100%; }
.fb .row .val { font: 700 17px var(--sim-font-display, system-ui); text-align: right; }

.fb .readout { padding: 14px 16px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-bg-surface); display: flex; align-items: center; justify-content: space-between; }
.fb .readout .kicker { margin: 0; }
.fb .readout .v { font: 700 20px var(--sim-font-display, system-ui); color: var(--sim-accent); }

.fb .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class FreeBodyFillInGame extends withChallenge(DomSimulation) {
  static simId = 'free-body-fill-in-game';
  static label = { en: 'What the Scale Reads' };
  static category = 'science.forces';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A person stands on a scale in a lift. Set the lift\'s acceleration so the scale reads 780 newtons.';
  static OBJECTIVE = {
    prompt: {
      en: 'A person (60 kg, normal weight 600 N) stands on a scale in a lift. Set the LIFT\'S ACCELERATION so the scale reads 780 N.',
    },
  };
  static SCORING = { mode: 'accuracy', tolerance: TOLERANCE };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.accel = A_DEFAULT;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="fb">
        <p class="kicker">Two forces on the free body: mg down, N up</p>
        <h2>Set the lift's acceleration so the scale reads <b>780 N</b>.</h2>
        <div class="scene">
          <svg viewBox="0 0 900 210" aria-hidden="true">
            <line class="shaft" x1="330" y1="10" x2="330" y2="200"/>
            <line class="shaft" x1="570" y1="10" x2="570" y2="200"/>
            <rect class="cab" x="330" y="20" width="240" height="170"></rect>
            <rect class="scale" x="400" y="165" width="100" height="16" rx="3"></rect>
            <circle class="person" cx="450" cy="120" r="20"></circle>
            <rect class="person" x="435" y="138" width="30" height="30" rx="6"></rect>
            <line class="w-arrow" x1="450" y1="172" x2="450" y2="200"></line>
            <polygon class="w-head" points="450,200 444,188 456,188"></polygon>
            <text class="lab" x="466" y="198">mg = 600 N</text>
            <line class="n-arrow" id="fb-n" x1="450" y1="165" x2="450" y2="140"></line>
            <polygon class="n-head" id="fb-nh" points="450,140 444,152 456,152"></polygon>
            <text class="lab" id="fb-nlab" x="466" y="145">N = ?</text>
          </svg>
        </div>
        <div class="row">
          <span class="name">Lift accel: down &larr; &middot; &rarr; up</span>
          <input type="range" id="fb-accel" min="${A_MIN}" max="${A_MAX}" step="0.5" value="${A_DEFAULT}">
          <span class="val" id="fb-vaccel">0 m/s^2</span>
        </div>
        <div class="readout">
          <p class="kicker">Scale reading (= N)</p>
          <span class="v" id="fb-reading">600 N</span>
        </div>
        <p class="foot">N = m(g + a). Moving fast is not the same as accelerating - constant speed, either direction, reads a plain 600 N.</p>
      </div>
    `);

    this._accelIn = this.root.querySelector('#fb-accel');
    this._vaccel = this.root.querySelector('#fb-vaccel');
    this._reading = this.root.querySelector('#fb-reading');
    this._n = this.root.querySelector('#fb-n');
    this._nh = this.root.querySelector('#fb-nh');
    this._nlab = this.root.querySelector('#fb-nlab');

    this.quill = SimMascotDom.mount(this.root, { x: 740, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._accelIn.addEventListener('input', () => {
      this.accel = Number(this._accelIn.value);
      this._moved = true;
      this._render();
    });

    this._render();
    this.quill.speak('Moving is not the same as accelerating. Watch the scale, not the speed.', 5400);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _reading_N() { return MASS * (G + this.accel); }

  _render() {
    this._vaccel.textContent = `${this.accel > 0 ? '+' : ''}${this.accel.toFixed(1)} m/s^2`;
    const n = this._reading_N();
    this._reading.textContent = `${n.toFixed(0)} N`;
    this._nlab.textContent = `N = ${n.toFixed(0)} N`;

    // N-arrow length scales with the reading, always pointing up from the
    // scale toward the person - a heavier reading is visibly a longer arrow.
    const len = Math.max(10, (n / NORMAL_WEIGHT) * 25);
    const y1 = 165, y2 = 165 - len;
    this._n.setAttribute('y1', y1);
    this._n.setAttribute('y2', y2);
    this._nh.setAttribute('points', `450,${y2} 444,${y2 + 12} 456,${y2 + 12}`);
  }

  checkObjective() {
    if (!this._moved) return null;
    const n = this._reading_N();
    const err = Math.abs(n - TARGET_N) / TARGET_N;
    if (err <= TOLERANCE) {
      this.quill?.perform('hop');
      return { value: n, target: TARGET_N, hint: 'N = m(g + a). Accelerating upward adds to the reading.' };
    }
    this.quill?.setExpression('surprised');
    let hint;
    if (Math.abs(this.accel) < 0.6) {
      hint = 'Zero acceleration always reads a plain 600 N, no matter how fast the lift is moving or which way. You need it actually ACCELERATING.';
    } else if (this.accel < 0) {
      hint = 'Accelerating DOWNWARD makes the reading LIGHTER, not heavier. You want the lift accelerating UPWARD.';
    } else if (n < TARGET_N) {
      hint = 'Right direction, not enough acceleration yet. Push it further upward.';
    } else {
      hint = 'That is too much upward acceleration - the reading overshot 780 N. Ease it back.';
    }
    return { value: n, target: TARGET_N, hint };
  }
}
