import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * FrictionRaceGame - mini-game for les-11, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). Redesigned 2026-09-01: the original was a
 * click-pick between two preset surfaces ("which stops first, carpet or
 * ice?") - correct content, but a two-option pick with no simulated
 * consequence, so it read as L1.
 *
 * L11's own throughline (s1/s3/s4/s7/s10) is: friction always opposes
 * motion, and a rougher surface removes speed faster - so MORE friction
 * means the block travels a SHORTER distance before stopping, for the
 * SAME push. s10 already frames friction as "steadily eating away at
 * motion, second by second" - i.e. a constant deceleration - so this
 * redesign keeps that same shape rather than introducing a formula the
 * lesson never states.
 *
 * The student tunes ONE friction slider (continuous, not a two-surface
 * pick) so a block given a fixed push comes to rest inside a target
 * distance window.
 *
 *   v0 = 8 (fixed push)
 *   distance = v0^2 / (2 * friction)   -- more friction, shorter distance
 *   target window: 7.5 .. 8.5 (friction ~= 3.76 .. 4.27, mid-slider)
 *
 * The designed wrong attractor is the exact misconception the original
 * docstring named: a student picks LOW friction thinking "smooth/slippery
 * surface -> stops fast", when the real effect is the opposite - low
 * friction lets the block travel FAR past the target. A second attractor
 * (friction cranked to the max) overcorrects and stops it far short,
 * catching "more must always be better" as well.
 *
 * Built on DomSimulation - one slider, a sliding block with a CSS-
 * transition stop (no rAF loop, per this sprint's DomSimulation
 * convention), Quill via SimMascotDom.
 */

const W = 900;
const H = 600;

const V0 = 8;
const FRICTION_DEFAULT = 1.5;
const FRICTION_MIN = 0.5;
const FRICTION_MAX = 8;
const TARGET_DIST = 8;
const TARGET_LOW = 7.5;
const TARGET_HIGH = 8.5;
const TRACK_PX = 780; // maps distance 0..32 onto the visible track
const MAX_DIST_FOR_DISPLAY = 32;

const CSS = `
.fr { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.fr .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.fr h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.fr h2 b { color: var(--sim-accent); }

.fr .scene { position: relative; height: 90px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 10px; margin-bottom: 8px; overflow: hidden; }
.fr .floor { position: absolute; left: 10px; right: 10px; bottom: 16px; height: 16px; border-radius: 4px; transition: background 200ms ease; }
.fr .target-zone { position: absolute; bottom: 12px; height: 24px; background: rgb(0 0 0 / 0.12); border-left: 2px dashed var(--sim-good); border-right: 2px dashed var(--sim-good); }
.fr .block { position: absolute; bottom: 30px; left: 14px; width: 42px; height: 28px; background: var(--sim-accent); border: 2px solid var(--sim-bg-deep); border-radius: 4px; transition: left 900ms cubic-bezier(.15,.75,.3,1); }
.fr .start-arrow { position: absolute; bottom: 46px; left: 60px; width: 44px; height: 5px; background: var(--sim-accent); border-radius: 2px; opacity: 0.85; }
.fr .start-arrow::after { content: ''; position: absolute; right: -8px; top: -5px; width: 0; height: 0; border-left: 10px solid var(--sim-accent); border-top: 6px solid transparent; border-bottom: 6px solid transparent; }

.fr .row { display: grid; grid-template-columns: 140px 1fr 90px; align-items: center; gap: 14px; padding: 12px 14px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-panel); margin: 14px 0 10px; }
.fr .row .name { font: 700 15px var(--sim-font, system-ui); }
.fr .row input[type="range"] { width: 100%; }
.fr .row .val { font: 700 17px var(--sim-font-display, system-ui); text-align: right; }

.fr .readout { padding: 14px 16px; border: 2px solid var(--sim-border); border-radius: 12px; background: var(--sim-bg-surface); display: flex; align-items: center; justify-content: space-between; }
.fr .readout .kicker { margin: 0; }
.fr .readout .v { font: 700 20px var(--sim-font-display, system-ui); color: var(--sim-accent); }

.fr .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class FrictionRaceGame extends withChallenge(DomSimulation) {
  static simId = 'friction-race-game';
  static label = { en: 'Stick the Landing' };
  static category = 'science.forces';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A block gets a fixed push. Tune the surface friction so it stops inside the marked target zone.';
  static OBJECTIVE = {
    prompt: {
      en: 'The block always gets the same push. Tune the surface\'s friction so the block stops inside the marked target zone.',
    },
  };
  static SCORING = { mode: 'ok' };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.friction = FRICTION_DEFAULT;
    this._moved = false;
  }

  async setup() {
    await super.setup();
    const lowPx = 10 + (TARGET_LOW / MAX_DIST_FOR_DISPLAY) * TRACK_PX;
    const widthPx = ((TARGET_HIGH - TARGET_LOW) / MAX_DIST_FOR_DISPLAY) * TRACK_PX;
    this.root.insertAdjacentHTML('beforeend', `
      <div class="fr">
        <p class="kicker">More friction, shorter distance</p>
        <h2>Tune the friction so the block stops in the <b>marked zone</b>.</h2>
        <div class="scene">
          <div class="floor" id="fr-floor"></div>
          <div class="target-zone" style="left:${lowPx}px; width:${widthPx}px;"></div>
          <div class="block" id="fr-block"></div>
          <div class="start-arrow"></div>
        </div>
        <div class="row">
          <span class="name">Surface friction</span>
          <input type="range" id="fr-friction" min="${FRICTION_MIN}" max="${FRICTION_MAX}" step="0.1" value="${FRICTION_DEFAULT}">
          <span class="val" id="fr-vfric">${FRICTION_DEFAULT.toFixed(1)}</span>
        </div>
        <div class="readout">
          <p class="kicker">Distance travelled</p>
          <span class="v" id="fr-dist">not pushed yet</span>
        </div>
        <p class="foot">Same push every time. Low friction lets it slide on and on; high friction eats the motion away fast.</p>
      </div>
    `);

    this._fricIn = this.root.querySelector('#fr-friction');
    this._vfric = this.root.querySelector('#fr-vfric');
    this._dist = this.root.querySelector('#fr-dist');
    this._floor = this.root.querySelector('#fr-floor');
    this._block = this.root.querySelector('#fr-block');

    this.quill = SimMascotDom.mount(this.root, { x: 740, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._fricIn.addEventListener('input', () => {
      this.friction = Number(this._fricIn.value);
      this._moved = true;
      this._render();
    });

    this._render();
    this.quill.speak('Same push every time. You are only tuning how hard the floor fights back.', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _distance() {
    return (V0 * V0) / (2 * this.friction);
  }

  _render() {
    this._vfric.textContent = this.friction.toFixed(1);
    // Rougher surface reads visually rougher too, via lightness on the fixed
    // token - no new --sim-* token, just an alpha ramp on the existing one.
    const roughness = Math.min(1, this.friction / FRICTION_MAX);
    this._floor.style.background = `repeating-linear-gradient(45deg, var(--sim-series-1) 0, var(--sim-series-1) ${2 + roughness * 6}px, transparent ${2 + roughness * 6}px, transparent ${8}px)`;

    const dist = this._distance();
    this._dist.textContent = this._moved ? `${dist.toFixed(1)} m` : 'not pushed yet';

    const shownDist = Math.min(dist, MAX_DIST_FOR_DISPLAY);
    const leftPx = 14 + (shownDist / MAX_DIST_FOR_DISPLAY) * TRACK_PX;
    this._block.style.left = `${leftPx}px`;
  }

  checkObjective() {
    if (!this._moved) return null;
    const dist = this._distance();
    if (dist >= TARGET_LOW && dist <= TARGET_HIGH) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    const hint = dist > TARGET_HIGH
      ? 'Too far past the zone - low friction lets it keep sliding. Raise the friction.'
      : 'Stopped short of the zone - that much friction eats the motion too fast. Ease it back.';
    return { ok: false, hint };
  }
}
