import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * FramePickerGame - mini-game for les-01, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). A child is in a parked car. From the child's
 * own frame the child does not move. From the road's frame the car does
 * not move either. From a passing bus's frame BOTH move. The point of the
 * lesson is "position is relative" - there is no single correct frame.
 *
 * The trap: a student picks "parked car" as the frame for "is the child
 * moving?" because the car is stationary. But the child is also stationary
 * in the parked car, and stationary in the road - the only frame where
 * the child is *moving* is the bus. The question asks for a frame where
 * the child is NOT moving relative to the frame, so the road and the car
 * both work, and only the bus fails.
 *
 * Built on DomSimulation so Quill drops in through SimMascotDom and every
 * colour is a live var(--sim-*) with no fallback table to go stale.
 */

const W = 900;
const H = 600;

const FRAMES = [
  { key: 'car',  name: 'The parked car',       childMoves: false, busMoves: false },
  { key: 'road', name: 'The road',              childMoves: false, busMoves: true  },
  { key: 'bus',  name: 'A passing bus',         childMoves: true,  busMoves: false },
];

const CSS = `
.fp { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 24px 28px; box-sizing: border-box; }
.fp .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.fp h2 { font-family: var(--sim-font-display); font-size: 26px; font-weight: 700; margin: 0 0 18px; line-height: 1.2; }
.fp h2 b { color: var(--sim-accent); }

.fp .scene { position: relative; height: 220px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 16px; margin-bottom: 18px; overflow: hidden; }
.fp .roadline { position: absolute; left: 0; right: 0; top: 130px; border-top: 3px dashed var(--sim-label-muted); }
.fp .bus { position: absolute; bottom: 50px; left: 70px; width: 120px; height: 50px; background: var(--sim-series-2); border: 3px solid var(--sim-bg-deep); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--sim-bg-deep); }
.fp .car { position: absolute; bottom: 50px; left: 360px; width: 90px; height: 40px; background: var(--sim-series-1); border: 3px solid var(--sim-bg-deep); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--sim-bg-deep); }
.fp .child { position: absolute; bottom: 90px; left: 396px; width: 18px; height: 18px; border-radius: 50%; background: var(--sim-accent); border: 2px solid var(--sim-bg-deep); }

.fp .prompt { font-size: 18px; margin: 0 0 12px; }
.fp .choices { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.fp .choice {
  padding: 16px; border-radius: 14px; background: var(--sim-panel);
  border: 2px solid var(--sim-border); cursor: pointer; text-align: center;
  font-weight: 700; font-size: 16px; transition: border-color 140ms, transform 140ms;
}
.fp .choice:hover { border-color: var(--sim-accent); transform: translateY(-2px); }
.fp .choice[data-picked="1"] { border-color: var(--sim-accent); background: var(--sim-accent); color: var(--sim-bg-deep); }
.fp .choice[data-good="1"] { border-color: var(--sim-good); background: var(--sim-good); color: var(--sim-bg-deep); }
.fp .choice[data-bad="1"]  { border-color: var(--sim-bad);  background: var(--sim-bad);  color: var(--sim-bg-deep); }

.fp .foot { position: absolute; left: 28px; right: 28px; bottom: 20px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class FramePickerGame extends withChallenge(DomSimulation) {
  static simId = 'frame-picker-game';
  static label = { en: 'Pick the Frame' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A child sits in a parked car. A bus drives past. Pick the frame in which the child is NOT moving.';
  static OBJECTIVE = {
    prompt: {
      en: 'A child sits in a parked car. A bus drives past. Pick the frame in which the child is NOT moving relative to the frame.',
    },
  };
  static SCORING = { mode: 'ok' };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.picked = null;  // frame key
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="fp">
        <p class="kicker">Frame of reference</p>
        <h2>Same child. <b>Three possible frames.</b></h2>
        <div class="scene" aria-hidden="true">
          <div class="roadline"></div>
          <div class="bus">BUS</div>
          <div class="car">CAR</div>
          <div class="child"></div>
        </div>
        <p class="prompt">In which frame is the child <b>not moving</b>?</p>
        <div class="choices">
          ${FRAMES.map((f) => `<button type="button" class="choice" data-frame="${f.key}" data-picked="0">${f.name}</button>`).join('')}
        </div>
        <p class="foot">Position is relative - the same child can be still in one frame and moving in another.</p>
      </div>
    `);

    this.quill = SimMascotDom.mount(this.root, { x: 760, y: 560, height: 120, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this.root.querySelectorAll('.choice').forEach((el) => {
      el.addEventListener('click', () => {
        this.picked = el.dataset.frame;
        this._render();
      });
    });

    this.quill.speak('The bus moves. The car is parked. Which frame holds the child still?', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _render() {
    this.root.querySelectorAll('.choice').forEach((el) => {
      el.dataset.picked = (this.picked && el.dataset.frame === this.picked) ? '1' : '0';
    });
  }

  checkObjective() {
    if (!this.picked) return null;
    const frame = FRAMES.find((f) => f.key === this.picked);
    // Win if the child is NOT moving in the chosen frame.
    if (!frame.childMoves) {
      this.quill?.perform('hop');
      this.root.querySelectorAll('.choice').forEach((el) => {
        const f = FRAMES.find((x) => x.key === el.dataset.frame);
        if (f && !f.childMoves) el.dataset.good = '1';
      });
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    this.root.querySelectorAll('.choice').forEach((el) => {
      const f = FRAMES.find((x) => x.key === el.dataset.frame);
      if (f && !f.childMoves) el.dataset.good = '1';
      if (el.dataset.frame === this.picked) el.dataset.bad = '1';
    });
    return {
      ok: false,
      hint: 'In a bus, the road slides past you and so does the car - and so does the child in it. The child is still in the road and in the car.',
    };
  }
}
