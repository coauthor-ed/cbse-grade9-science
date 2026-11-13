import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * ForceShelfGame - mini-game for les-09, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). Redesigned 2026-09-01: the original was an
 * 8-card "IS a force / NOT a force" sort - real recognition, but no
 * simulated consequence, so it read as L1. L09 itself never gets past "what
 * is a force" (magnitude + direction, spring balance, newtons) - it does NOT
 * teach F=ma, momentum or KE, so this redesign stays inside that vocabulary
 * rather than reaching for physics the lesson hasn't introduced yet.
 *
 * The lesson's own point (blk-l09-s3: "If the magnitude OR the direction of
 * a force changes, its effect changes as well") becomes the win condition
 * directly: a ball is moving right at a fixed speed. The student sets a
 * push's MAGNITUDE (a spring-balance-style slider, echoing s5-s7) and
 * DIRECTION (an angle dial, 0=same as the ball's motion .. 180=dead
 * opposite). Win: send the ball moving backward.
 *
 * alongMotion = magnitude * cos(angleDeg); newV = 5 + alongMotion (a push
 * WITH the motion is positive, against it is negative). Reversed when
 * newV <= -1 (a clean flip, not just "stalled near zero").
 *
 * Two designed-in wrong attractors, each the actual misconception the
 * lesson is trying to prevent:
 *   - RIGHT direction (180, opposite), too WEAK a magnitude -> slows the
 *     ball but doesn't reverse it. Tests "direction alone is not enough".
 *   - Big magnitude but PERPENDICULAR (90) -> along-motion component is
 *     exactly zero at any magnitude, so cranking the slider never helps.
 *     Tests "direction alone decides whether magnitude can matter at all".
 *
 * Built on DomSimulation - slider pair + a side panel, Quill via
 * SimMascotDom, same shape as the other games in this bundle.
 */

const W = 900;
const H = 600;

const V0 = 5;              // ball's initial rightward speed
const MAG_DEFAULT = 3;
const ANGLE_DEFAULT = 90;  // starts perpendicular - genuinely inert, a fair start
const REVERSE_THRESHOLD = -1;

const CSS = `
.fsh { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.fsh .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.fsh h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.fsh h2 b { color: var(--sim-accent); }

.fsh .scene { position: relative; width: 900px; height: 200px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; box-sizing: border-box; margin-bottom: 18px; }
.fsh svg { display: block; width: 100%; height: 100%; }
.fsh .track { stroke: var(--sim-border); stroke-width: 3; stroke-dasharray: 6 8; }
.fsh .ball { fill: var(--sim-series-1); stroke: var(--sim-bg-deep); stroke-width: 3; }
.fsh .v-arrow { stroke: var(--sim-accent); stroke-width: 6; stroke-linecap: round; }
.fsh .v-head { fill: var(--sim-accent); }
.fsh .push-arrow { stroke: var(--sim-gold); stroke-width: 7; stroke-linecap: round; }
.fsh .push-head { fill: var(--sim-gold); }
.fsh .lab { font: 700 14px var(--sim-font, system-ui); fill: var(--sim-label-muted); }

.fsh .row { display: grid; grid-template-columns: 140px 1fr 90px; align-items: center; gap: 14px; padding: 12px 14px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-panel); margin-bottom: 10px; }
.fsh .row .name { font: 700 15px var(--sim-font, system-ui); }
.fsh .row input[type="range"] { width: 100%; }
.fsh .row .val { font: 700 17px var(--sim-font-display, system-ui); text-align: right; }

.fsh .readout { padding: 14px 16px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-bg-surface); display: flex; align-items: center; justify-content: space-between; }
.fsh .readout .kicker { margin: 0; }
.fsh .readout .v { font: 700 20px var(--sim-font-display, system-ui); color: var(--sim-accent); }

.fsh .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class ForceShelfGame extends withChallenge(DomSimulation) {
  static simId = 'force-shelf-game';
  static label = { en: 'Turn It Around' };
  static category = 'science.forces';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A ball moving right. Set a push\'s magnitude and direction to send it moving backward.';
  static OBJECTIVE = {
    prompt: {
      en: 'The ball is moving right. Set ONE push - magnitude and direction - so the ball ends up moving backward (left).',
    },
  };
  static SCORING = { mode: 'ok' };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.mag = MAG_DEFAULT;
    this.angle = ANGLE_DEFAULT;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="fsh">
        <p class="kicker">Magnitude AND direction</p>
        <h2>Push the ball so it ends up moving <b>backward</b>.</h2>
        <div class="scene">
          <svg viewBox="0 0 900 200" aria-hidden="true">
            <line class="track" x1="20" y1="150" x2="880" y2="150"/>
            <circle class="ball" id="fsh-ball" cx="380" cy="150" r="26"></circle>
            <line class="v-arrow" id="fsh-va" x1="0" y1="0" x2="0" y2="0"></line>
            <polygon class="v-head" id="fsh-vh" points=""></polygon>
            <text class="lab" x="406" y="90">moving right at 5</text>
            <line class="push-arrow" id="fsh-pa" x1="0" y1="0" x2="0" y2="0"></line>
            <polygon class="push-head" id="fsh-ph" points=""></polygon>
          </svg>
        </div>
        <div class="row">
          <span class="name">Push magnitude</span>
          <input type="range" id="fsh-mag" min="0" max="10" step="0.5" value="${MAG_DEFAULT}">
          <span class="val" id="fsh-vmag">${MAG_DEFAULT} N</span>
        </div>
        <div class="row">
          <span class="name">Push direction</span>
          <input type="range" id="fsh-ang" min="0" max="180" step="5" value="${ANGLE_DEFAULT}">
          <span class="val" id="fsh-vang">${ANGLE_DEFAULT} deg</span>
        </div>
        <div class="readout">
          <p class="kicker">Ball's new motion</p>
          <span class="v" id="fsh-result">not pushed yet</span>
        </div>
        <p class="foot">0 deg = push the SAME way the ball is already going. 180 deg = push it dead OPPOSITE. 90 deg = push sideways - it never affects forward/backward speed, at any magnitude.</p>
      </div>
    `);

    this._magIn = this.root.querySelector('#fsh-mag');
    this._angIn = this.root.querySelector('#fsh-ang');
    this._vmag = this.root.querySelector('#fsh-vmag');
    this._vang = this.root.querySelector('#fsh-vang');
    this._result = this.root.querySelector('#fsh-result');
    this._ball = this.root.querySelector('#fsh-ball');
    this._va = this.root.querySelector('#fsh-va');
    this._vh = this.root.querySelector('#fsh-vh');
    this._pa = this.root.querySelector('#fsh-pa');
    this._ph = this.root.querySelector('#fsh-ph');

    this.quill = SimMascotDom.mount(this.root, { x: 740, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._magIn.addEventListener('input', () => { this.mag = Number(this._magIn.value); this._moved = true; this._render(); });
    this._angIn.addEventListener('input', () => { this.angle = Number(this._angIn.value); this._moved = true; this._render(); });

    this._render();
    this.quill.speak('Same push, different angle - completely different result. Try it.', 5000);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _arrow(el, headEl, x1, y1, x2, y2) {
    el.setAttribute('x1', x1); el.setAttribute('y1', y1);
    el.setAttribute('x2', x2); el.setAttribute('y2', y2);
    const dx = x2 - x1, dy = y2 - y1;
    const L = Math.hypot(dx, dy);
    if (L < 1) { headEl.setAttribute('points', ''); return; }
    const ux = dx / L, uy = dy / L;
    const t = 12;
    const px = -uy, py = ux;
    headEl.setAttribute('points',
      `${x2},${y2} ${(x2 - ux * t + px * t * 0.6).toFixed(2)},${(y2 - uy * t + py * t * 0.6).toFixed(2)} ${(x2 - ux * t - px * t * 0.6).toFixed(2)},${(y2 - uy * t - py * t * 0.6).toFixed(2)}`);
  }

  _newV() {
    const rad = (this.angle * Math.PI) / 180;
    const alongMotion = this.mag * Math.cos(rad);
    return V0 + alongMotion;
  }

  _render() {
    this._vmag.textContent = `${this.mag.toFixed(1)} N`;
    this._vang.textContent = `${this.angle} deg`;

    const newV = this._newV();
    this._result.textContent = this._moved
      ? `${newV >= 0 ? 'still moving right' : 'now moving LEFT'} at ${Math.abs(newV).toFixed(1)}`
      : 'not pushed yet';

    // Ball's own rightward velocity arrow (fixed - always 5, to the right).
    const cx = 380;
    this._arrow(this._va, this._vh, cx + 30, 150, cx + 30 + V0 * 14, 150);

    // Push arrow: angle measured from "same as motion" (pointing right = 0deg).
    const rad = (this.angle * Math.PI) / 180;
    const pushLen = Math.max(this.mag, 0.4) * 14;
    const px = cx - Math.cos(rad) * pushLen;
    const py = 150 + Math.sin(rad) * pushLen * 0.001; // keep it visually horizontal-biased
    this._arrow(this._pa, this._ph, cx, 150, cx - Math.cos(rad) * pushLen, 150 - Math.sin(rad) * 40);
    void px; void py;
  }

  checkObjective() {
    if (!this._moved) return null;
    const newV = this._newV();
    if (newV <= REVERSE_THRESHOLD) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    let hint;
    if (Math.abs(this.angle - 90) <= 15) {
      hint = 'A push at 90 degrees never touches its forward/backward speed - no magnitude will help here. Aim it back toward 180.';
    } else if (this.angle < 135) {
      hint = 'This push is not opposing the motion enough. Turn the angle closer to 180 degrees.';
    } else {
      hint = 'Right direction, not enough push yet. Raise the magnitude.';
    }
    return { ok: false, hint };
  }
}
