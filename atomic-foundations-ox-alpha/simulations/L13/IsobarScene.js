// IsobarScene - companion to blk-l13-s10, "Isobars".
//   b0  same       three nuclei: tap each onto its balance, each reads 40 nucleons
//   b1  different  tap each nucleus: its protons and neutrons, and the element they make
//   b2  takeaway   isotopes and isobars side by side
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, drawBench, drawCard } from 'simulations/base/kit/SimLook.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawNucleus } from 'simulations/base/kit/SimAtom.js';
import { say, tag, popIn } from '../L07/AtomBoard.js';
import { span } from '../L12/MolKit.js';
import { drawDigitalBalance } from '../L02/BalanceKit.js';

const S_SAME = 0, S_DIFF = 1, S_TAKE = 2;
const BENCH = 470, DROP_S = 0.7;
const SET = [
  { x: 118, name: 'argon', p: 18, n: 22, kind: 'gas' },
  { x: 340, name: 'potassium', p: 19, n: 21, kind: 'metal' },
  { x: 562, name: 'calcium', p: 20, n: 20, kind: 'metal' },
];

export class IsobarScene extends SimScene {
  static BEAT_STEP_MAP = [S_SAME, S_DIFF, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [{ type: 'button', id: 'next', label: 'Next nucleus' }];
  static ARIA_LABEL = 'Nuclei of argon, potassium and calcium each read 40 nucleons on a balance. Argon has 18 protons and 22 neutrons, potassium '
    + '19 and 21, and calcium 20 and 20, so they are three different elements. Last, isotopes have the same protons and a different mass '
    + 'number, while isobars have a different number of protons and the same mass number.';

  constructor(container, config) {
    super(container, config);
    this._on = [];
    this._onAt = [];
  }

  enter() { this._on = [false, false, false]; this._onAt = [-9, -9, -9]; }

  busy() { return !reducedMotion() && (this.age < 1.2 || this._onAt.some((a) => this.age - a < DROP_S + 0.5)); }
  isControlHidden() { return this.stage === S_TAKE; }
  isControlDisabled() { return this._on.every(Boolean); }

  onControlChange(id) {
    if (!this._guard(id)) return;
    const i = this._on.indexOf(false);
    if (i >= 0) this._set(i);
  }

  pointerDown(p) {
    if (this.stage === S_TAKE) return;
    const i = p.x < 229 ? 0 : p.x < 451 ? 1 : 2;
    if (!this._on[i]) this._set(i);
  }

  _set(i) {
    this._on[i] = true;
    this._onAt[i] = this.age;
    if (this._on.every(Boolean)) {
      const stage = this.stage;
      const land = () => this.celebrate(340, 100, 30, { key: stage === S_SAME ? 'all-forty' : 'three-elements', lookAt: 'scene' });
      if (reducedMotion()) land(); else this.after(DROP_S + 0.1, land);
    }
    this.requestUiUpdate?.();
  }

  draw(ctx, c) {
    if (this.stage === S_SAME) {
      drawBackdrop(ctx, c, 'dots');
      drawFloor(ctx, c, BENCH + 34);
      drawBench(ctx, c, 14, 666, BENCH);
      this._same(ctx, c);
      return;
    }
    drawDepthField(ctx, c, { x: 340, y: 220, seed: 41, n: 8 });
    if (this.stage === S_DIFF) this._diff(ctx, c);
    else this._take(ctx, c);
  }

  _same(ctx, c) {
    SET.forEach((q, i) => {
      const on = this._on[i], t = reducedMotion() ? 9 : this.age - this._onAt[i];
      const y0 = drawDigitalBalance(ctx, c, q.x, BENCH, on && t >= DROP_S ? '40' : '0', on && t >= DROP_S ? 'good' : 'live', { w: 206 });
      const R = 88, u = on ? ease.outCubic(span(t, 0, DROP_S)) : 0;
      const y = 142 + (y0 - R - 142) * u;
      drawNucleus(ctx, c, q.x, y, { p: q.p, n: q.n, r: R, seed: 3 + i });
      say(ctx, c, q.name, q.x, 30, { size: 28 });
    });
    if (this._on.every((v) => v)) tag(ctx, c, 'all 40 nucleons', 340, 136, { size: 30, bg: c.good });
    else if (!this._on.some(Boolean)) tag(ctx, c, 'tap each nucleus', 340, 276, { size: 28, bg: c.warning });
  }

  _diff(ctx, c) {
    SET.forEach((q, i) => {
      const on = this._on[i];
      drawNucleus(ctx, c, q.x, 128, { p: q.p, n: q.n, r: 96, seed: 3 + i });
      say(ctx, c, on ? q.name : '?', q.x, 262, { size: on ? 30 : 44, col: on ? c.label : c.labelMuted });
      if (!on) return;
      const p = popIn(this.age, this._onAt[i], 0.4);
      const s = Math.min(1.04, p);
      drawCard(ctx, c, q.x - 102, 288, 204, 192, Math.min(1, p));
      say(ctx, c, q.p, q.x - 56, 330, { size: 40, col: c.proton });
      say(ctx, c, q.n, q.x + 56, 330, { size: 40, col: c.neutron });
      say(ctx, c, 'protons', q.x - 56, 372, { size: 24, col: c.labelMuted });
      say(ctx, c, 'neutrons', q.x + 50, 372, { size: 24, col: c.labelMuted });
      tag(ctx, c, q.kind, q.x, 436, { size: 28, scale: s, bg: q.kind === 'gas' ? c.s1 : c.s2 });
    });
    if (!this._on.some(Boolean)) tag(ctx, c, 'tap each nucleus', 340, 400, { size: 28, bg: c.warning });
  }

  _take(ctx, c) {
    const row = (y, title, tone, A, B, z, a, delay) => {
      const p = popIn(this.age, delay);
      if (p <= 0) return;
      drawCard(ctx, c, 16, y, 648, 230, Math.min(1, p), { accent: tone });
      say(ctx, c, title, 120, y + 40, { size: 34, col: tone });
      drawNucleus(ctx, c, 76, y + 130, { p: A[0], n: A[1], r: 52, seed: 5 });
      drawNucleus(ctx, c, 196, y + 130, { p: B[0], n: B[1], r: 52, seed: 6 });
      say(ctx, c, 'protons', 400, y + 62, { size: 28, col: c.labelMuted });
      say(ctx, c, z, 580, y + 62, { size: 32 });
      say(ctx, c, 'mass no.', 400, y + 124, { size: 28, col: c.labelMuted });
      say(ctx, c, a, 580, y + 124, { size: 32 });
      say(ctx, c, 'element', 400, y + 186, { size: 28, col: c.labelMuted });
      say(ctx, c, title === 'isotopes' ? 'same' : 'different', 580, y + 186, { size: 32 });
    };
    row(16, 'isotopes', c.s3ink, [17, 18], [17, 20], 'same', 'different', 0.2);
    row(274, 'isobars', c.s4ink, [18, 22], [20, 20], 'different', 'same', 0.6);
  }
}
