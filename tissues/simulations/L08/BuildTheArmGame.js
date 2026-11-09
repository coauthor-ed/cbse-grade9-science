import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * BuildTheArmGame - mini-game for les-08, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). Lesson 8 makes two claims and this game requires
 * both of them at once:
 *
 *   1. Muscle only moves a bone through a connective-tissue link. Slide
 *      blk-l08-s4 says thickening the muscle does not fix a missing link, so
 *      "a thicker muscle, no tendon" is on the menu here and loses.
 *   2. The KIND of movement comes from the joint, not from the muscle. Slide
 *      blk-l08-s6 lists four connections and what each permits.
 *
 * The brief asks for a forearm that bends up and down in one plane only, and
 * lifts. Only hinge + tendon satisfies it; every other pairing fails in a way
 * the student can watch, because the arm animates the movement the choice
 * actually produces.
 *
 * The rig is SVG, and everything distal to the elbow - forearm, tendon
 * insertion, hand, load - lives in ONE group that rotates about the joint. An
 * earlier version positioned the load independently and only nudged its `top`,
 * so the arm swung while the load hung motionless in mid-air: the exact
 * opposite of the thing being taught. Anything that should travel with the
 * forearm has to be inside that group, not merely animated alongside it.
 */

const W = 900;
const H = 600;

const JOINTS = [
  { value: 'ball',  label: 'Ball and socket', moves: 'sweeps in every direction' },
  { value: 'hinge', label: 'Hinge',           moves: 'bends up and down in one plane' },
  { value: 'pivot', label: 'Pivot',           moves: 'rotates around one axis' },
  { value: 'fixed', label: 'Fixed',           moves: 'barely moves at all' },
];

const LINKS = [
  { value: 'none',    label: 'No link - just thicken the muscle' },
  { value: 'tendon',  label: 'A connective-tissue link from muscle to bone' },
];

/** Rig geometry, in viewBox units. The elbow is the origin of every rotation. */
const ELBOW = { x: 196, y: 196 };

const CSS = `
.bta { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); }

.bta .brief {
  position: absolute; left: 40px; top: 44px; width: 330px;
  background: var(--sim-panel); border: 3px solid var(--sim-border);
  border-radius: 18px; padding: 16px 18px; box-sizing: border-box;
}
.bta .kicker {
  font-size: 11px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase;
  color: var(--sim-label-muted); margin: 0 0 10px;
}
.bta .req {
  display: flex; align-items: center; gap: 10px; padding: 9px 0;
  border-top: 1px solid var(--sim-border);
}
.bta .req .mark {
  width: 24px; height: 24px; flex: 0 0 24px; border-radius: 50%; background: var(--sim-bad);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 800; color: var(--sim-bg-deep);
}
.bta .req.ok .mark { background: var(--sim-good); }
.bta .req span:last-child { font-size: 14px; line-height: 1.35; }

/* Legend, so every shape in the rig is named once. */
.bta .legend {
  position: absolute; left: 40px; top: 244px; width: 330px;
  border: 3px solid var(--sim-border); border-radius: 18px; padding: 14px 18px;
  background: var(--sim-bg-surface); box-sizing: border-box;
}
.bta .legend .row { display: flex; align-items: center; gap: 10px; font-size: 13px; padding: 4px 0; }
.bta .legend .sw { width: 22px; height: 12px; border-radius: 6px; border: 2px solid var(--sim-bg-deep); flex: none; }
.bta .legend .sw.bone { background: var(--sim-series-5); }
.bta .legend .sw.muscle { background: var(--sim-series-1); }
.bta .legend .sw.tendon { background: var(--sim-series-2); }
.bta .legend .sw.joint { background: var(--sim-series-3); border-radius: 50%; width: 14px; height: 14px; }
.bta .legend .sw.load { background: var(--sim-warning); border-radius: 3px; width: 14px; height: 14px; }
.bta .legend .row.off { opacity: 0.35; }

.bta .stage { position: absolute; left: 392px; top: 24px; width: 480px; height: 396px; }
.bta svg { width: 100%; height: 100%; overflow: visible; }

.bta .bone { fill: var(--sim-series-5); stroke: var(--sim-bg-deep); stroke-width: 3; }
.bta .joint { fill: var(--sim-series-3); stroke: var(--sim-bg-deep); stroke-width: 3; }
.bta .muscle { fill: var(--sim-series-1); stroke: var(--sim-bg-deep); stroke-width: 3; }
.bta .tendon { stroke: var(--sim-series-2); stroke-width: 9; stroke-linecap: round; fill: none; }
.bta .tendon.absent { display: none; }
.bta .load { fill: var(--sim-warning); stroke: var(--sim-bg-deep); stroke-width: 3; }
.bta .bench { fill: var(--sim-track); }
.bta .ghost { fill: none; stroke: var(--sim-label-muted); stroke-width: 2; stroke-dasharray: 5 6; opacity: 0.5; }
.bta .anchor { fill: var(--sim-stroke); stroke: var(--sim-bg-deep); stroke-width: 3; }
.bta .tag { font-size: 12px; fill: var(--sim-label-muted); font-family: var(--sim-font); }

/* Everything past the elbow travels together. */
.bta .forearm { transform-box: view-box; transform-origin: ${ELBOW.x}px ${ELBOW.y}px; }
.bta .bellygrp { transform-box: view-box; transform-origin: 92px 150px; }

.bta[data-move="hinge"] .forearm { animation: bta-hinge 2.4s ease-in-out infinite; }
.bta[data-move="ball"]  .forearm { animation: bta-ball 2.8s ease-in-out infinite; }
.bta[data-move="pivot"] .forearm { animation: bta-pivot 2.4s ease-in-out infinite; }
.bta[data-move="none"]  .forearm { animation: none; }

/* The muscle shortens on the same clock as the arm it is pulling. */
.bta[data-move="hinge"] .bellygrp { animation: bta-pull 2.4s ease-in-out infinite; }
.bta[data-move="ball"]  .bellygrp { animation: bta-pull 2.8s ease-in-out infinite; }
.bta[data-move="pivot"] .bellygrp { animation: bta-pull 2.4s ease-in-out infinite; }
.bta[data-bulge="true"] .bellygrp { transform: scale(1, 1.34); }

@keyframes bta-hinge { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-52deg); } }
/* Ball and socket: bends AND swings out of plane. scaleY fakes the foreshortening. */
@keyframes bta-ball {
  0%, 100% { transform: rotate(0deg) scaleY(1); }
  28%      { transform: rotate(-44deg) scaleY(0.72); }
  62%      { transform: rotate(19deg) scaleY(1.05); }
}
/* Pivot: the forearm rolls about its own long axis, so it flattens and fills again. */
@keyframes bta-pivot {
  0%, 100% { transform: rotate(0deg) scaleY(1); }
  50%      { transform: rotate(0deg) scaleY(0.12); }
}
@keyframes bta-pull {
  0%, 100% { transform: scale(1, 1); }
  50%      { transform: scale(0.9, 1.42); }
}

.bta .caption {
  position: absolute; left: 392px; top: 430px; width: 480px; text-align: center;
  font-size: 15px; font-weight: 700; margin: 0;
}
.bta .caption.bad { color: var(--sim-bad); }
.bta .caption.good { color: var(--sim-good); }

.bta .hintline {
  position: absolute; left: 392px; top: 470px; width: 480px; margin: 0;
  font-size: 13.5px; line-height: 1.5; color: var(--sim-label-muted);
}

@media (prefers-reduced-motion: reduce) {
  .bta .forearm, .bta .bellygrp { animation: none !important; }
}
`;

export class BuildTheArmGame extends withChallenge(DomSimulation) {
  static simId = 'build-the-arm-game';
  static label = { en: 'Build the Arm' };
  static category = 'biology.tissues';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'An arm rig: an upper bone, a joint, a forearm, a hand and a load resting on a bench. Choose '
    + 'the joint type and whether the muscle is linked to the bone, then watch what the arm does.';

  static OBJECTIVE = {
    prompt: {
      en: 'Build a forearm that bends up and down in one plane only - and actually lifts the load.',
    },
  };
  static SCORING = { mode: 'accuracy' };   // checkObjective returns {ok}

  static CONTROLS = [
    { type: 'select', id: 'joint', label: 'Connection between the bones:', value: 'fixed',
      options: JOINTS.map((j) => ({ value: j.value, label: j.label })) },
    { type: 'select', id: 'link', label: 'Muscle to bone:', value: 'none',
      options: LINKS.map((l) => ({ value: l.value, label: l.label })) },
  ];

  constructor(container, config) {
    super(container, config);
    this.joint = 'fixed';
    this.link = 'none';
    this._moved = false;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="bta" data-move="none" data-bulge="true">
        <div class="brief">
          <p class="kicker">The brief</p>
          <div class="req" data-req="plane"><span class="mark">&times;</span><span>Bends up and down, one plane only</span></div>
          <div class="req" data-req="lift"><span class="mark">&times;</span><span>Lifts the load clear of the bench</span></div>
        </div>

        <div class="legend">
          <p class="kicker">The parts</p>
          <div class="row"><span class="sw bone"></span><span>Bone - rigid, cannot shorten</span></div>
          <div class="row"><span class="sw joint"></span><span>Joint - decides the kind of movement</span></div>
          <div class="row"><span class="sw muscle"></span><span>Muscle - can only pull, never push</span></div>
          <div class="row" data-leg="tendon"><span class="sw tendon"></span><span>Connective link - carries the pull to the bone</span></div>
          <div class="row"><span class="sw load"></span><span>The load</span></div>
        </div>

        <div class="stage">
          <svg viewBox="0 0 480 396" role="img" aria-hidden="true">
            <!-- Shoulder anchor and upper arm: fixed, the frame everything pulls against. -->
            <rect class="anchor" x="24" y="150" width="30" height="92" rx="10"/>
            <rect class="bone" x="48" y="180" width="152" height="32" rx="16"/>
            <text class="tag" x="60" y="234">upper arm</text>

            <!-- Muscle belly, anchored at the shoulder end. -->
            <g class="bellygrp">
              <rect class="muscle" x="62" y="128" width="118" height="34" rx="17"/>
            </g>
            <text class="tag" x="66" y="120">muscle</text>

            <!-- Where the load starts, so "clear of the bench" is visible. -->
            <rect class="bench" x="296" y="268" width="158" height="14" rx="7"/>
            <text class="tag" x="296" y="300">bench</text>
            <path class="ghost" d="M330 268 h74 v-44 h-74 z"/>
            <text class="tag" x="330" y="216">load starts here</text>

            <!-- Everything past the elbow rotates as one. -->
            <g class="forearm">
              <path class="tendon" d="M178 148 L232 190"/>
              <rect class="bone" x="${ELBOW.x - 4}" y="${ELBOW.y - 15}" width="160" height="30" rx="15"/>
              <rect class="bone" x="${ELBOW.x + 150}" y="${ELBOW.y - 19}" width="34" height="38" rx="12"/>
              <rect class="load" x="${ELBOW.x + 138}" y="${ELBOW.y + 28}" width="74" height="44" rx="8"/>
            </g>

            <!-- Drawn last so the joint sits on top of both bones. -->
            <circle class="joint" cx="${ELBOW.x}" cy="${ELBOW.y}" r="17"/>
            <text class="tag" x="${ELBOW.x - 18}" y="${ELBOW.y + 46}">joint</text>
          </svg>
        </div>

        <p class="caption">Nothing is moving.</p>
        <p class="hintline"></p>
      </div>
    `);

    this._wrap = this.root.querySelector('.bta');
    this._reqPlane = this.root.querySelector('[data-req="plane"]');
    this._reqLift = this.root.querySelector('[data-req="lift"]');
    this._caption = this.root.querySelector('.caption');
    this._tendon = this.root.querySelector('.tendon');
    this._legendTendon = this.root.querySelector('[data-leg="tendon"]');
    this._hint = this.root.querySelector('.hintline');

    this.quill = SimMascotDom.mount(this.root, { x: 206, y: 592, height: 96, bubbleSide: 'right' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this._render();
    this.quill.speak('Muscles only pull.', 4000);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy?.();
  }

  onBeatChange() { /* a game, not a paced explainer */ }

  onControlChange(id, value) {
    if (id === 'joint') this.joint = String(value);
    else if (id === 'link') this.link = String(value);
    else return;
    this._moved = true;
    this._render();
  }

  /** @returns {{plane:boolean, lift:boolean}} */
  _state() {
    const linked = this.link === 'tendon';
    return {
      plane: this.joint === 'hinge',
      lift: linked && this.joint !== 'fixed',
    };
  }

  _render() {
    const { plane, lift } = this._state();
    const linked = this.link === 'tendon';

    this._tendon.classList.toggle('absent', !linked);
    this._legendTendon.classList.toggle('off', !linked);

    // Unlinked, the muscle only bulges - a static swell, going nowhere. Linked,
    // it shortens on the same clock as the arm, so the pull and the movement
    // are visibly one event.
    this._wrap.dataset.bulge = String(!linked);
    this._wrap.dataset.move = lift ? this.joint : 'none';

    this._reqPlane.classList.toggle('ok', plane);
    this._reqPlane.querySelector('.mark').innerHTML = plane ? '&check;' : '&times;';
    this._reqLift.classList.toggle('ok', lift);
    this._reqLift.querySelector('.mark').innerHTML = lift ? '&check;' : '&times;';

    const joint = JOINTS.find((j) => j.value === this.joint);
    this._caption.classList.toggle('good', plane && lift);
    this._caption.classList.toggle('bad', !lift);
    this._caption.textContent = !linked
      ? 'The muscle bulges. The bone does not move, and neither does the load.'
      : this.joint === 'fixed'
        ? 'The muscle pulls hard and the joint holds everything still.'
        : `The forearm ${joint.moves}.`;

    this._hint.textContent = linked
      ? 'The pull now reaches the bone. What the arm does with it is up to the joint.'
      : 'The muscle is thicker than before, and the load has not moved a millimetre.';
  }

  checkObjective() {
    if (!this._moved) return null;
    const { plane, lift } = this._state();

    if (plane && lift) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');

    let hint;
    if (this.link !== 'tendon') {
      hint = 'All that force and none of it reaches the bone. A stronger pull on nothing is still a pull on nothing.';
    } else if (this.joint === 'fixed') {
      hint = 'This connection is built to stop movement, not to allow it. The load never leaves the bench.';
    } else if (this.joint === 'ball') {
      hint = 'It lifts, but it also swings out of the plane. The brief asked for one plane and nothing else.';
    } else {
      hint = 'It rolls about its own axis rather than bending. Which of the four connections opens and closes like a door?';
    }
    return { ok: false, hint };
  }
}
