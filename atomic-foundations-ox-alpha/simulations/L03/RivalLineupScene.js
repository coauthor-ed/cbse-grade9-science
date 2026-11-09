// RivalLineupScene - companion to blk-l03-s5, "Could It Be Something Else?".
// The learner tests each other explanation on the tube itself.
//   b0  light     send light, then cathode rays, through the charged plates: light goes straight
//   b1  ions      change the gas: the dashed line is what heavy gas atoms would do, the ray does not follow it
//   b2  takeaway  two ideas ruled out, one new particle left
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, popAt, drawBackdrop, drawBench, drawFloor, drawCard } from 'simulations/base/kit/SimLook.js';
import { drawElectron, drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion, follow } from 'simulations/base/kit/SimAnim.js';
import { bigText, chipInk } from '../L01/GrainKit.js';
import { drawRayRig } from './RayTubeKit.js';

const S_LIGHT = 0, S_GAS = 1, S_TAKE = 2;
const BENCH = 402;
const BEND = 70;
// What the bend would be if the rays were charged atoms of the gas: heavier gas, less bend.
const GASES = [{ key: 'hydrogen', guess: 70 }, { key: 'air', guess: 26 }, { key: 'carbon dioxide', guess: 14 }];

export class RivalLineupScene extends SimScene {
  static BEAT_STEP_MAP = [S_LIGHT, S_GAS, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'send', label: 'Send through', value: 'light', options: [{ value: 'light', label: 'Light' }, { value: 'ray', label: 'Cathode rays' }] },
    { type: 'segmented', id: 'gas', label: 'Gas in the tube', value: 'hydrogen', options: GASES.map((g) => ({ value: g.key, label: g.key })) },
  ];
  static ARIA_LABEL = 'The tube with its plates on. Light goes straight through while cathode rays bend, so the rays are not light. With hydrogen, air and carbon dioxide in the tube, a dashed line shows '
    + 'how much less heavy gas atoms would bend, but the ray bends the same each time. Last, two ideas are crossed out and the electron is left.';

  constructor(container, config) {
    super(container, config);
    this._send = 'light';
    this._gas = 'hydrogen';
    this._seen = {};
    this._ghost = 70;
    this._found = false;
  }

  enter() {
    this._send = 'light'; this._gas = 'hydrogen'; this._ghost = 70; this._found = false;
    this._seen = {};
    this._seen.light = true; this._seen.hydrogen = true;
    this.requestUiUpdate?.();
  }

  isControlHidden(id) { return id === 'send' ? this.stage !== S_LIGHT : this.stage !== S_GAS; }
  getControlValue(id) { return id === 'send' ? this._send : this._gas; }
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'send') this._setSend(v); else this._setGas(v);
  }

  _setSend(v) {
    this._send = v;
    this._seen[v] = true;
    if (this._seen.ray && !this._found) {
      this._found = true;
      this.after(0.5, () => this.celebrate(600, 116, 20, { key: 'not-light' }));
    }
    this.requestUiUpdate?.();
  }

  _setGas(v) {
    this._gas = v;
    this._seen[v] = true;
    if (GASES.every((g) => this._seen[g.key]) && !this._found) {
      this._found = true;
      this.after(0.7, () => this.celebrate(600, 116, 20, { key: 'not-gas' }));
    }
    this.requestUiUpdate?.();
  }

  pointerDown() {
    if (this.stage === S_LIGHT) this._setSend(this._send === 'light' ? 'ray' : 'light');
    else if (this.stage === S_GAS) {
      const i = GASES.findIndex((g) => g.key === this._gas);
      this._setGas(GASES[(i + 1) % 3].key);
    }
  }

  update(d) {
    const tg = GASES.find((g) => g.key === this._gas).guess;
    this._ghost = reducedMotion() ? tg : follow(this._ghost, tg, d, 0.12);
    if (Math.abs(this._ghost - tg) < 0.2) this._ghost = tg;
  }

  busy() { return this._ghost !== GASES.find((g) => g.key === this._gas).guess || this.age < 1.4; }

  draw(ctx, c, t) {
    if (this.stage === S_TAKE) { this._take(ctx, c, t); return; }
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 66);
    drawBench(ctx, c, 26, 654, BENCH);
    if (this.stage === S_LIGHT) {
      const light = this._send === 'light';
      drawRayRig(ctx, c, { bench: BENCH, plates: 1, bend: light ? 0 : BEND, beamCol: light ? c.flame : c.electron });
      pill(ctx, c, light ? 'light: goes straight' : 'cathode rays: they bend', 340, 42, { bg: light ? c.warning : c.accent, ink: chipInk(c), size: 28, display: true });
      if (this._found) bigText(ctx, c, 'the rays are not light', 200, 340, 30, c.label);
      else bigText(ctx, c, 'tap to send the other', 188, 340, 28, c.labelMuted);
    } else {
      const gas = GASES.find((g) => g.key === this._gas);
      drawRayRig(ctx, c, { bench: BENCH, plates: 1, bend: BEND, ghost: this._ghost, ghostCol: c.bad, gas: gas.key === 'carbon dioxide' ? c.s8 : gas.key === 'air' ? c.s3 : c.glass });
      pill(ctx, c, gas.key, 340, 42, { bg: c.raised, ink: c.label, size: 28, display: true });
      bigText(ctx, c, this._found ? 'same bend every time' : 'dashed: if they were gas atoms', 196, 340, 25, this._found ? c.label : c.bad);
    }
  }

  _take(ctx, c, t) {
    drawDepthField(ctx, c, { x: 340, y: 250, seed: 22, t });
    [['light', 28, 0.1], ['gas atoms', 240, 0.35]].forEach(([name, x, at]) => {
      const p = reducedMotion() ? { alpha: 1 } : popAt(this.age, at);
      if (!p) return;
      ctx.save(); ctx.globalAlpha *= p.alpha;
      drawCard(ctx, c, x, 110, 196, 250, 1, { accent: c.stroke });
      bigText(ctx, c, name, x + 98, 190, 32, c.labelMuted);
      ctx.strokeStyle = c.bad; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + 44, 240); ctx.lineTo(x + 152, 320); ctx.moveTo(x + 152, 240); ctx.lineTo(x + 44, 320); ctx.stroke();
      ctx.restore();
    });
    const p = reducedMotion() ? { alpha: 1 } : popAt(this.age, 0.65);
    if (p) {
      ctx.save(); ctx.globalAlpha *= p.alpha;
      drawCard(ctx, c, 452, 74, 204, 322, 1, { accent: c.gold });
      drawElectron(ctx, c, 554, 196, 58, { focus: 0.8 });
      bigText(ctx, c, 'electron', 554, 310, 36, c.label);
      bigText(ctx, c, 'a new particle', 554, 352, 25, c.labelMuted);
      ctx.restore();
    }
  }
}
