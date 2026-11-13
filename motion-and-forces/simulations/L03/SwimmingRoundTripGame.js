import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * SwimmingRoundTripGame - mini-game for les-03, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). A swimmer crosses a 100 m wide river and
 * comes back. Each crossing takes 50 s. Total: 200 m in 100 s.
 *
 *   speed     = total distance / total time = 200/100 = 2 m/s
 *   velocity  = displacement / time = 0/100 = 0 m/s
 *
 * The question asks for the AVERAGE velocity over the round trip. The
 * correct answer is 0 - the swimmer ended where they started, so the
 * displacement is 0 even though the distance is 200 m. The trap: a
 * student types 2 because "I went 2 m per second". 2 is the speed, not
 * the velocity; the lesson's whole point is the difference.
 *
 * Built on DomSimulation for the kit's documented reason: cards, inputs
 * and a river diagram are exactly what DomSimulation's pick-by-content-
 * shape table says to use, and Quill drops in through SimMascotDom.
 */

const W = 900;
const H = 600;

const RIVER_M = 100;
const CROSS_S = 50;
const TOTAL_DISTANCE = 2 * RIVER_M;       // 200 m
const TOTAL_TIME = 2 * CROSS_S;            // 100 s
const TARGET_SPEED = TOTAL_DISTANCE / TOTAL_TIME;     // 2 m/s
const TARGET_VELOCITY = 0;                            // 0 m/s

const TOL = 0.05;  // m/s

const CSS = `
.sw { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.sw .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.sw h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 16px; line-height: 1.2; }
.sw h2 b { color: var(--sim-accent); }

.sw .map { position: relative; height: 200px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; margin-bottom: 16px; overflow: hidden; }
.sw .water { position: absolute; top: 50px; bottom: 50px; left: 0; right: 0; background: var(--sim-series-2); opacity: 0.5; }
.sw .bank { position: absolute; top: 0; bottom: 0; left: 0; width: 28px; background: var(--sim-series-1); opacity: 0.6; border-right: 2px solid var(--sim-border); }
.sw .bank.right { left: auto; right: 0; border-right: none; border-left: 2px solid var(--sim-border); }
.sw .swimlane { position: absolute; left: 28px; right: 28px; top: 50px; height: 100px; }
.sw .arrow { position: absolute; top: 50%; transform: translateY(-50%); height: 6px; background: var(--sim-accent); border-radius: 3px; }
.sw .arrow.there { left: 0; width: calc(100% - 16px); }
.sw .arrow.back  { right: 0; width: calc(100% - 16px); }
.sw .swimmer { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; border-radius: 50%; background: var(--sim-accent); border: 2px solid var(--sim-bg-deep); }
.sw .lab { position: absolute; font: 700 12px var(--sim-font, system-ui); color: var(--sim-label); }

.sw .row { display: flex; align-items: center; gap: 14px; padding: 12px 14px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-panel); margin-bottom: 10px; }
.sw .row .lab { font-weight: 700; font-size: 16px; flex: 1; }
.sw .row input { width: 110px; padding: 8px 10px; font: 700 18px var(--sim-font); text-align: right; background: var(--sim-bg-surface); color: var(--sim-label); border: 2px solid var(--sim-border); border-radius: 8px; }
.sw .row .unit { color: var(--sim-label-muted); font-weight: 700; }
.sw .row[data-good="1"] { border-color: var(--sim-good); }
.sw .row[data-bad="1"]  { border-color: var(--sim-bad); }

.sw .foot { font-size: 14px; color: var(--sim-label-muted); margin: 14px 0 0; }
`;

export class SwimmingRoundTripGame extends withChallenge(DomSimulation) {
  static simId = 'swimming-round-trip-game';
  static label = { en: 'Swim There and Back' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A swimmer crosses a river and returns. Find the average speed and the average velocity over the whole trip.';
  static OBJECTIVE = {
    prompt: {
      en: 'A swimmer crosses a 100 m river and swims back. Each crossing takes 50 s. Type the average speed and the average velocity over the whole round trip.',
    },
  };
  static SCORING = { mode: 'ok' };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.values = { speed: null, velocity: null };
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="sw">
        <p class="kicker">Speed vs velocity, round trip</p>
        <h2>Cross a <b>100 m</b> river, swim back. Each crossing takes <b>50 s</b>.</h2>
        <div class="map" aria-hidden="true">
          <div class="water"></div>
          <div class="bank"></div>
          <div class="bank right"></div>
          <div class="swimlane">
            <div class="arrow there"></div>
            <div class="arrow back"></div>
            <div class="swimmer"></div>
            <div class="lab" style="left: 16px; top: 18px;">start</div>
            <div class="lab" style="right: 16px; top: 18px;">finish = start</div>
          </div>
        </div>
        <div class="row" data-key="speed">
          <span class="lab">Average speed over the round trip</span>
          <input type="number" step="0.1" min="0" inputmode="decimal" data-key="speed" aria-label="Average speed">
          <span class="unit">m/s</span>
        </div>
        <div class="row" data-key="velocity">
          <span class="lab">Average velocity over the round trip</span>
          <input type="number" step="0.1" inputmode="decimal" data-key="velocity" aria-label="Average velocity">
          <span class="unit">m/s</span>
        </div>
        <p class="foot">Speed = distance / time. Velocity = displacement / time. The swimmer finishes where they started.</p>
      </div>
    `);

    this.quill = SimMascotDom.mount(this.root, { x: 760, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this.root.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', () => {
        this.values[inp.dataset.key] = Number(inp.value);
        this._moved = true;
      });
    });

    this.quill.speak('You swam there AND back. The clock kept going. The river did not.', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  checkObjective() {
    if (!this._moved) return null;
    if (this.values.speed === null || this.values.velocity === null || isNaN(this.values.speed) || isNaN(this.values.velocity)) {
      this.quill?.setExpression('surprised');
      return { ok: false, hint: 'Fill in both numbers first.' };
    }
    const speedOK = Math.abs(this.values.speed - TARGET_SPEED) <= TOL;
    const velOK   = Math.abs(this.values.velocity - TARGET_VELOCITY) <= TOL;
    this.root.querySelector('[data-key="speed"]').dataset.good = speedOK ? '1' : '0';
    this.root.querySelector('[data-key="speed"]').dataset.bad  = speedOK ? '0' : '1';
    this.root.querySelector('[data-key="velocity"]').dataset.good = velOK ? '1' : '0';
    this.root.querySelector('[data-key="velocity"]').dataset.bad  = velOK ? '0' : '1';
    if (speedOK && velOK) { this.quill?.perform('hop'); return { ok: true }; }
    this.quill?.setExpression('surprised');
    if (speedOK && !velOK) return { ok: false, hint: 'Speed is right. But velocity is displacement / time - and the swimmer ended where they started.' };
    if (!speedOK && velOK) return { ok: false, hint: 'Velocity is right. Now work the speed back: total distance is 200 m and total time is 100 s.' };
    return { ok: false, hint: 'Speed = distance / time, velocity = displacement / time. They are not the same thing when the trip ends where it began.' };
  }
}
