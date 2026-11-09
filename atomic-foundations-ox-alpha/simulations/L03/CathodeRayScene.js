// CathodeRayScene - companion to blk-l03-s3, "The Electron".
//   b0  beam         a straight ray; switch on the plates and it bends towards the + plate
//   b1  electron     the ray is a stream of particles: electrons, far lighter than an atom
//   b2  every-metal  change the cathode metal or the gas: the same ray, the same bend
//   b3  takeaway     three elements, each with electrons in it
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { mix, pill, popAt, drawBackdrop, drawBench, drawFloor } from 'simulations/base/kit/SimLook.js';
import { drawBall, drawElectron, drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion, follow, hash2 } from 'simulations/base/kit/SimAnim.js';
import { bigText, chipInk } from '../L01/GrainKit.js';
import { drawRayRig } from './RayTubeKit.js';

const S_BEAM = 0, S_ELECTRON = 1, S_METAL = 2, S_TAKE = 3;
const BENCH = 402;
const BEND = 70;
const METALS = [{ key: 'copper', tone: 's8' }, { key: 'aluminium', tone: 'labelMuted' }, { key: 'gold', tone: 'gold' }];
const FLOW_S = 4;

export class CathodeRayScene extends SimScene {
  static BEAT_STEP_MAP = [S_BEAM, S_ELECTRON, S_METAL, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'plates', label: 'Switch on the plates' },
    { type: 'segmented', id: 'metal', label: 'Cathode metal', value: 'copper', options: METALS.map((m) => ({ value: m.key, label: m.key })) },
  ];
  static ARIA_LABEL = 'A glass tube on a bench with a cathode, an anode, two charged plates and a glowing screen. A ray runs straight, then bends towards the positive plate when the plates are on. '
    + 'The ray is shown as a stream of electrons. Changing the cathode metal gives the same ray and the same bend. Last, atoms of three elements each hold electrons.';

  constructor(container, config) {
    super(container, config);
    this._on = false;
    this._p = 0;
    this._metal = 'copper';
    this._seen = {};
    this._found = false;
  }

  enter(stage) {
    this._on = stage !== S_BEAM;
    this._p = this._on ? 1 : 0;
    this._metal = 'copper';
    this._seen = { copper: true };
    this._found = false;
    this.requestUiUpdate?.();
  }

  isControlHidden(id) { return id === 'plates' ? this.stage !== S_BEAM : this.stage !== S_METAL; }
  isControlDisabled(id) { return id === 'plates' ? this._on : false; }
  getControlValue(id) { return id === 'metal' ? this._metal : undefined; }
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'plates') this._plates(); else this._pick(v);
  }

  _plates() {
    if (this._on) return;
    this._on = true;
    if (reducedMotion()) this._p = 1;
    this.after(1, () => this.celebrate(600, 130, 24, { key: 'bends-to-plus' }));
    this.requestUiUpdate?.();
  }

  _pick(v) {
    this._metal = v;
    this._seen[v] = true;
    if (Object.keys(this._seen).length === 3 && !this._found) {
      this._found = true;
      this.after(0.4, () => this.celebrate(600, 116, 24, { key: 'same-rays' }));
    }
    this.requestUiUpdate?.();
  }

  pointerDown() {
    if (this.stage === S_BEAM) this._plates();
    else if (this.stage === S_METAL) {
      const i = METALS.findIndex((m) => m.key === this._metal);
      this._pick(METALS[(i + 1) % 3].key);
    }
  }

  update(d) {
    const tg = this._on ? 1 : 0;
    this._p = follow(this._p, tg, d, 0.2);
    if (Math.abs(this._p - tg) < 0.004) this._p = tg;
  }

  busy() {
    if (Math.abs(this._p - (this._on ? 1 : 0)) > 0) return true;
    return this.stage === S_ELECTRON && !reducedMotion() && this.age < FLOW_S;
  }

  draw(ctx, c, t) {
    if (this.stage === S_TAKE) { this._take(ctx, c, t); return; }
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 66);
    drawBench(ctx, c, 26, 654, BENCH);
    const m = METALS.find((q) => q.key === this._metal);
    const dots = this.stage === S_ELECTRON ? { t: reducedMotion() ? 0.1 : Math.min(this.age, FLOW_S) * 0.2, n: 9, r: 10 } : null;
    drawRayRig(ctx, c, { bench: BENCH, plates: this._p, bend: BEND * this._p, metal: this.stage === S_METAL ? c[m.tone] : undefined, dots });
    if (this.stage === S_BEAM) {
      if (!this._on) pill(ctx, c, 'tap to switch on the plates', 340, 42, { bg: c.warning, ink: chipInk(c), size: 26, display: true });
      else if (this._p > 0.9) pill(ctx, c, 'bends towards +', 340, 42, { bg: c.good, ink: chipInk(c), size: 28, display: true });
      bigText(ctx, c, 'cathode', 90, 332, 28, c.label);
      bigText(ctx, c, 'anode', 226, 332, 28, c.label);
    } else if (this.stage === S_ELECTRON) {
      pill(ctx, c, 'a stream of electrons', 340, 42, { bg: c.accent, ink: chipInk(c), size: 28, display: true });
      bigText(ctx, c, 'far lighter than an atom', 200, 340, 28, c.label);
    } else {
      pill(ctx, c, `${this._metal} cathode`, 340, 42, { bg: c.raised, ink: c.label, size: 28, display: true });
      if (this._found) bigText(ctx, c, 'same ray, same bend', 340, 340, 30, c.label);
    }
  }

  _take(ctx, c, t) {
    drawDepthField(ctx, c, { x: 340, y: 240, seed: 21, t });
    bigText(ctx, c, 'electrons in every atom', 340, 58, 34, c.label);
    [[116, 'hydrogen', 1, 84], [340, 'copper', 8, 102], [564, 'gold', 13, 102]].forEach(([x, name, n, r], k) => {
      const tone = k === 0 ? c.labelMuted : k === 1 ? c.s8 : c.gold;
      const y = 250;
      const p = reducedMotion() ? { scale: 1, alpha: 1, u: 2 } : popAt(this.age, 0.1 + k * 0.2);
      if (!p) return;
      drawBall(ctx, c, x, y, r * p.scale, mix(tone, c.bgSurface, 0.45));
      if (p.u < 1) return;
      for (let i = 0; i < n; i++) {
        const a = hash2(i, k + 3) * Math.PI * 2, q = Math.sqrt((i + 0.5) / n) * r * 0.74;
        drawElectron(ctx, c, x + Math.cos(i * 2.4 + a * 0.2) * q, y + Math.sin(i * 2.4 + a * 0.2) * q, 11);
      }
      bigText(ctx, c, name, x, 410, 30, c.label);
    });
  }
}
