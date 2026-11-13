import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SimMascotDom } from 'simulations/base/SimMascotDom.js';

/**
 * CentripetalAimGame - mini-game for les-08, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). A ball moves in a circle. The student has to
 * draw (by clicking a direction on a 4-way pad) the direction the net force
 * points. The right answer: TOWARDS THE CENTRE - the centripetal direction.
 *
 * The rig: a ball is shown at one of 8 positions around a circular track.
 * The ball has a velocity vector (tangent, drawn but not asked about) and
 * the student has to mark the centripetal direction. The student picks one
 * of four arrows (N, E, S, W) which represents the direction of the net
 * force / acceleration. The system checks the answer against the
 * centre-relative direction.
 *
 * The trap: students pick the TANGENT direction (along the motion),
 * confusing velocity with the direction of acceleration. The lesson's
 * core: in uniform circular motion, the velocity is tangent but the
 * acceleration points to the centre.
 *
 * Built on DomSimulation - SVG rig with a 4-way direction pad is exactly
 * DomSimulation's content shape, and Quill drops in through SimMascotDom.
 */

const W = 900;
const H = 600;

const CX = 300, CY = 280, R = 150;

// 8 positions around the circle (angle in degrees from 12 o'clock, CW).
const POSITIONS = [
  { key: 'N',   angle:   0, dir: 'S' }, // 12 o'clock - centripetal points S
  { key: 'NE',  angle:  45, dir: 'SW' },
  { key: 'E',   angle:  90, dir: 'W'  },
  { key: 'SE',  angle: 135, dir: 'NW' },
  { key: 'S',   angle: 180, dir: 'N'  },
  { key: 'SW',  angle: 225, dir: 'NE' },
  { key: 'W',   angle: 270, dir: 'E'  },
  { key: 'NW',  angle: 315, dir: 'SE' },
];

const DIR_VEC = {
  N:  { dx:  0, dy: -1 },
  S:  { dx:  0, dy:  1 },
  E:  { dx:  1, dy:  0 },
  W:  { dx: -1, dy:  0 },
  NE: { dx:  0.707, dy: -0.707 },
  NW: { dx: -0.707, dy: -0.707 },
  SE: { dx:  0.707, dy:  0.707 },
  SW: { dx: -0.707, dy:  0.707 },
};

const CSS = `
.ca { position: absolute; inset: 0; font-family: var(--sim-font); color: var(--sim-label); padding: 22px 28px; box-sizing: border-box; }
.ca .kicker { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 6px; }
.ca h2 { font-family: var(--sim-font-display); font-size: 24px; font-weight: 700; margin: 0 0 14px; line-height: 1.2; }
.ca h2 b { color: var(--sim-accent); }

.ca .scene { position: relative; width: 600px; height: 420px; background: var(--sim-bg-surface); border: 2px solid var(--sim-border); border-radius: 14px; }
.ca svg { display: block; width: 100%; height: 100%; }
.ca .track { fill: none; stroke: var(--sim-border); stroke-width: 3; }
.ca .centre-dot { fill: var(--sim-label-muted); }
.ca .ball { fill: var(--sim-accent); stroke: var(--sim-bg-deep); stroke-width: 3; }
.ca .rad { stroke: var(--sim-label-muted); stroke-width: 2; stroke-dasharray: 5 5; }
.ca .tangent { stroke: var(--sim-series-2); stroke-width: 4; stroke-linecap: round; }
.ca .cp { stroke: var(--sim-good); stroke-width: 5; stroke-linecap: round; }
.ca .cp-arrow { fill: var(--sim-good); stroke: var(--sim-bg-deep); stroke-width: 1; }

.ca .pad { position: absolute; right: 28px; top: 80px; width: 220px; background: var(--sim-panel); border: 2px solid var(--sim-border); border-radius: 14px; padding: 18px; box-sizing: border-box; }
.ca .pad .label { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sim-label-muted); margin: 0 0 8px; text-align: center; }
.ca .pad .grid2 { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); gap: 6px; aspect-ratio: 1; max-width: 180px; margin: 0 auto; }
.ca .pad button { font: 700 18px var(--sim-font, system-ui); padding: 0; border: 2px solid var(--sim-border); background: var(--sim-bg-surface); color: var(--sim-label); border-radius: 10px; cursor: pointer; aspect-ratio: 1; }
.ca .pad button[data-dir="center"] { grid-column: 2; grid-row: 2; }
.ca .pad button:hover { border-color: var(--sim-accent); }
.ca .pad button[data-picked="1"] { background: var(--sim-accent); color: var(--sim-bg-deep); border-color: var(--sim-accent); }
.ca .pad button[data-good="1"] { background: var(--sim-good); color: var(--sim-bg-deep); border-color: var(--sim-good); }
.ca .pad button[data-bad="1"]  { background: var(--sim-bad);  color: var(--sim-bg-deep); border-color: var(--sim-bad); }

.ca .foot { position: absolute; left: 28px; bottom: 18px; font-size: 14px; color: var(--sim-label-muted); margin: 0; }
`;

export class CentripetalAimGame extends withChallenge(DomSimulation) {
  static simId = 'centripetal-aim-game';
  static label = { en: 'Aim the Net Force' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL = 'A ball moves in a circle. Pick the direction the net force points.';
  static OBJECTIVE = {
    prompt: {
      en: 'The ball moves uniformly in a circle. The velocity is tangent (the green line). Which direction does the NET FORCE point?',
    },
  };
  static SCORING = { mode: 'ok' };

  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.idx = 0; // which of POSITIONS
    this.picked = null;
  }

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', `
      <div class="ca">
        <p class="kicker">Uniform circular motion</p>
        <h2>The ball moves in a circle. The <b>net force</b> is a centripetal force. Pick its direction.</h2>
        <div class="scene">
          <svg viewBox="0 0 600 420" aria-hidden="true">
            <circle class="track" cx="${CX}" cy="${CY}" r="${R}"></circle>
            <circle class="centre-dot" cx="${CX}" cy="${CY}" r="5"></circle>
            <text x="${CX + 10}" y="${CY - 6}" font-family="var(--sim-font, system-ui)" font-size="12" fill="var(--sim-label-muted)">centre</text>
            <line id="ca-rad" class="rad" x1="0" y1="0" x2="0" y2="0"></line>
            <line id="ca-tan" class="tangent" x1="0" y1="0" x2="0" y2="0"></line>
            <line id="ca-cp" class="cp" x1="0" y1="0" x2="0" y2="0"></line>
            <polygon id="ca-cp-arrow" class="cp-arrow" points=""></polygon>
            <circle id="ca-ball" class="ball" cx="0" cy="0" r="14"></circle>
          </svg>
        </div>
        <div class="pad">
          <p class="label">Net force direction</p>
          <div class="grid2">
            <button type="button" data-dir="NW">NW</button>
            <button type="button" data-dir="N">N</button>
            <button type="button" data-dir="NE">NE</button>
            <button type="button" data-dir="W">W</button>
            <button type="button" data-dir="center" disabled style="visibility:hidden"></button>
            <button type="button" data-dir="E">E</button>
            <button type="button" data-dir="SW">SW</button>
            <button type="button" data-dir="S">S</button>
            <button type="button" data-dir="SE">SE</button>
          </div>
        </div>
        <p class="foot">Velocity is tangent (green). The net force is centripetal - it points to the centre, not along the motion.</p>
      </div>
    `);

    this._rad = this.root.querySelector('#ca-rad');
    this._tan = this.root.querySelector('#ca-tan');
    this._cp  = this.root.querySelector('#ca-cp');
    this._cpArrow = this.root.querySelector('#ca-cp-arrow');
    this._ball = this.root.querySelector('#ca-ball');

    this.quill = SimMascotDom.mount(this.root, { x: 700, y: 555, height: 110, flip: true, bubbleSide: 'left' });
    this.injectStyle(CSS + SimMascotDom.styles());

    this.root.querySelectorAll('.pad button').forEach((el) => {
      if (el.dataset.dir === 'center') return;
      el.addEventListener('click', () => {
        this.picked = el.dataset.dir;
        this._render();
      });
    });

    this._render();
    this.quill.speak('The ball is on the circle. Where does the net force pull it?', 5200);
  }

  destroy() {
    this.quill?.destroy();
    this.quill = null;
    super.destroy();
  }

  _ballPos() {
    const p = POSITIONS[this.idx];
    const a = ((p.angle - 90) * Math.PI) / 180;
    return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
  }

  _render() {
    const p = POSITIONS[this.idx];
    const b = this._ballPos();
    this._ball.setAttribute('cx', b.x);
    this._ball.setAttribute('cy', b.y);
    this._rad.setAttribute('x1', b.x);
    this._rad.setAttribute('y1', b.y);
    this._rad.setAttribute('x2', CX);
    this._rad.setAttribute('y2', CY);

    // Tangent: perpendicular to radius. Pick CW (we treat motion as CW).
    // Rotate the radial vector 90 deg CW: (rx, ry) -> (ry, -rx). Normalised.
    let rx = b.x - CX, ry = b.y - CY;
    const rmag = Math.hypot(rx, ry);
    const ux = rx / rmag, uy = ry / rmag;
    const tx = uy, ty = -ux;
    const tlen = 70;
    this._tan.setAttribute('x1', b.x);
    this._tan.setAttribute('y1', b.y);
    this._tan.setAttribute('x2', b.x + tx * tlen);
    this._tan.setAttribute('y2', b.y + ty * tlen);

    // Centripetal arrow (drawn after picking)
    this.root.querySelectorAll('.pad button').forEach((el) => {
      if (el.dataset.dir === 'center') return;
      el.dataset.picked = (this.picked && el.dataset.dir === this.picked) ? '1' : '0';
      el.dataset.good = '0';
      el.dataset.bad = '0';
    });
    if (this.picked) {
      // Draw a centripetal arrow from the ball toward the centre, plus
      // a small tag if the answer was right/wrong.
      this._cp.setAttribute('x1', b.x);
      this._cp.setAttribute('y1', b.y);
      this._cp.setAttribute('x2', CX);
      this._cp.setAttribute('y2', CY);
      const ax = CX, ay = CY;
      const bx = b.x, by = b.y;
      const dx = ax - bx, dy = ay - by;
      const L = Math.hypot(dx, dy);
      const ux2 = dx / L, uy2 = dy / L;
      const t = 16;
      // arrowhead at the centre end
      const px = -uy2, py = ux2;
      this._cpArrow.setAttribute('points',
        `${ax},${ay} ${(ax - ux2 * t + px * t * 0.6).toFixed(2)},${(ay - uy2 * t + py * t * 0.6).toFixed(2)} ${(ax - ux2 * t - px * t * 0.6).toFixed(2)},${(ay - uy2 * t - py * t * 0.6).toFixed(2)}`
      );

      // mark pad buttons
      this.root.querySelectorAll('.pad button').forEach((el) => {
        if (el.dataset.dir === 'center') return;
        const want = p.dir;
        if (el.dataset.dir === this.picked) {
          el.dataset.bad = (this.picked !== want) ? '1' : '0';
          el.dataset.good = (this.picked === want) ? '1' : '0';
        }
        if (el.dataset.dir === want) el.dataset.good = '1';
      });
    } else {
      this._cp.setAttribute('x1', 0); this._cp.setAttribute('y1', 0);
      this._cp.setAttribute('x2', 0); this._cp.setAttribute('y2', 0);
      this._cpArrow.setAttribute('points', '');
    }
  }

  checkObjective() {
    if (!this.picked) return null;
    const p = POSITIONS[this.idx];
    if (this.picked === p.dir) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    return {
      ok: false,
      hint: 'The velocity (green) is tangent, but acceleration and net force point to the CENTRE. Same for every position on the circle.',
    };
  }
}
