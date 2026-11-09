// ConfigReaderScene - companion to blk-l07-s4, "The Outermost Shell".
// One big atom and its configuration. Four buttons change the atom: carbon, oxygen, sodium, chlorine.
//   b0  read      the configuration is written digit by digit under K, L, M; the last digit lights
//   b1  valence   the inner shells dim and the valence shell lights: the valence electrons are counted
//   b2  takeaway  two atoms come together: their outer shells meet first, the inner shells stay out of it
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawCard, clamp01 } from 'simulations/base/kit/SimLook.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawAtom, drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { popIn, say, tag, SHELL, at } from './AtomBoard.js';

const CX = 236, CY = 262, R = 186;
const ATOMS = [
  { name: 'carbon', sym: 'C', p: 6, n: 6, cfg: [2, 4] },
  { name: 'oxygen', sym: 'O', p: 8, n: 8, cfg: [2, 6] },
  { name: 'sodium', sym: 'Na', p: 11, n: 12, cfg: [2, 8, 1] },
  { name: 'chlorine', sym: 'Cl', p: 17, n: 18, cfg: [2, 8, 7] },
];
const S_READ = 0, S_VAL = 1, S_TAKE = 2;
const PANEL = { x: 448, y: 22, w: 218, h: 476 };

export class ConfigReaderScene extends SimScene {
  static BEAT_STEP_MAP = [S_READ, S_VAL, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [{ type: 'segmented', id: 'atom', label: 'Atom', value: 'Na', options: ATOMS.map((A) => A.sym) }];
  static ARIA_LABEL =
    'Reading an electronic configuration. Four buttons choose carbon, 2, 4; oxygen, 2, 6; sodium, 2, 8, 1; or '
    + 'chlorine, 2, 8, 7. The big atom shows its shells and the numbers are written under K, L and M. Next the '
    + 'inner shells dim and the outermost shell lights up as the valence shell, and its electrons are counted. '
    + 'Last, a sodium atom and a chlorine atom come together: their outer shells meet first.';

  constructor(container, config) {
    super(container, config);
    this._pick = 2;
    this._at = 0;          // scene age when the atom last changed
  }

  enter(stage) {
    this._pick = stage === S_VAL ? 3 : 2;
    this._at = reducedMotion() ? -9 : this.age;
  }

  busy() { return this.age - this._at < (this.stage === S_TAKE ? 2.2 : 1.6); }

  isControlHidden(id) { return id === 'atom' && this.stage === S_TAKE; }
  getControlValue(id) { return id === 'atom' ? ATOMS[this._pick].sym : super.getControlValue(id); }
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    const i = ATOMS.findIndex((A) => A.sym === v);
    if (i < 0 || i === this._pick) return;
    this._pick = i;
    this._at = reducedMotion() ? -9 : this.age;
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: this.stage === S_TAKE ? 340 : CX, y: CY, seed: 3, n: 9 });
    if (this.stage === S_TAKE) { this._meet(ctx, c); return; }
    const A = ATOMS[this._pick], val = this.stage === S_VAL;
    const a = this.age - this._at;
    at(ctx, CX, CY, Math.min(1.04, Math.max(0.86, popIn(a, 0, 0.4))), () => {
      drawAtom(ctx, c, 0, 0, { p: A.p, n: A.n, shells: A.cfg, radius: R, nucleusR: 46, er: 12, phase: 0.2, focusShell: val ? 'outer' : undefined, dimInner: val, seed: 2 });
    });
    this._panel(ctx, c, A, a);
  }

  _panel(ctx, c, A, a) {
    const { x, y, w, h } = PANEL, cx = x + w / 2;
    drawCard(ctx, c, x, y, w, h, 1, { accent: this.stage === S_VAL ? c.electron : c.accent });
    say(ctx, c, A.name, cx, y + 54, { size: 36 });
    const n = A.cfg.length, gap = n === 3 ? 62 : 80, x0 = cx - ((n - 1) * gap) / 2;
    const last = n - 1;
    A.cfg.forEach((v, i) => {
      const u = this.stage === S_VAL ? 1 : popIn(a, 0.15 + i * 0.24, 0.3);
      if (u <= 0) return;
      const lit = i === last;
      const nx = x0 + i * gap;
      const dim = this.stage === S_VAL && !lit;
      say(ctx, c, v, nx, y + 150, { size: Math.round((lit ? 72 : 62) * Math.min(1.05, u)), col: lit ? c.s2ink : dim ? c.labelMuted : c.label });
      say(ctx, c, SHELL[i], nx, y + 214, { size: 26, col: dim ? c.labelMuted : c.electron });
    });
    if (this.stage === S_VAL) {
      const u = popIn(a, 0.35);
      if (u > 0) {
        say(ctx, c, `${A.cfg[last]}`, cx, y + 310, { size: 72, col: c.s2ink });
        say(ctx, c, `valence electron${A.cfg[last] > 1 ? 's' : ''}`, cx, y + 382, { size: 23 });
      }
    } else if (a > 0.4 + n * 0.24 || reducedMotion()) say(ctx, c, 'last = outermost', cx, y + 310, { size: 24, col: c.labelMuted });
  }

  _meet(ctx, c) {
    const a = this.age - this._at;
    const u = reducedMotion() ? 1 : ease.inOutCubic(clamp01((a - 0.3) / 1.2));
    const gap = 200 * (1 - u);
    const r = 158;
    const xa = 340 - r - gap / 2 + 8, xb = 340 + r + gap / 2 - 8;
    const NA = ATOMS[2], CL = ATOMS[3];
    drawAtom(ctx, c, xa, CY - 20, { p: NA.p, n: NA.n, shells: NA.cfg, radius: r, nucleusR: 40, er: 10, phase: 0.3, focusShell: 'outer', dimInner: true });
    drawAtom(ctx, c, xb, CY - 20, { p: CL.p, n: CL.n, shells: CL.cfg, radius: r, nucleusR: 40, er: 10, phase: 2.3, focusShell: 'outer', dimInner: true, seats: [2, 8, 8] });
    const p = popIn(a, 1.5);
    if (p > 0) tag(ctx, c, 'outer electrons meet first', 340, 472, { scale: Math.min(1.05, p), size: 26 });
  }
}
