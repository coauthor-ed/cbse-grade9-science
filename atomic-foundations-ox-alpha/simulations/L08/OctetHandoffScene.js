// OctetHandoffScene - companion to blk-l08-s1, "Sodium Meets Chlorine".
// A sodium atom and a chlorine atom, side by side and large. No charges yet: the next slide asks
// the learner to predict them.
//   b0  na    sodium's one valence electron lights; chlorine waits
//   b1  cl    chlorine's seven valence electrons light, and the one empty place
//   b2  move  the learner gives one electron, either way. Sodium to chlorine: both show 8.
//             Chlorine to sodium: neither shows 8, and the atoms go back.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01 } from 'simulations/base/kit/SimLook.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawAtom, drawDepthField, drawElectron, atomLayout } from 'simulations/base/kit/SimAtom.js';
import { popIn, say, tag } from '../L07/AtomBoard.js';

const S_NA = 0, S_CL = 1, S_MOVE = 2;
const NA = { x: 176, y: 206, p: 11, n: 12 }, CL = { x: 504, y: 206, p: 17, n: 18 };
const R = 156, ER = 11, NR = 40;
const PH_NA = 2.19, PH_CL = -2.52;     // turn the shells so the moving electron and the empty place face each other
const FLY = 0.85;
const naO = { p: NA.p, n: NA.n, radius: R, er: ER, nucleusR: NR, phase: PH_NA, seed: 3 };
const clO = { p: CL.p, n: CL.n, radius: R, er: ER, nucleusR: NR, phase: PH_CL, seed: 4, seats: [2, 8, 8] };

export class OctetHandoffScene extends SimScene {
  static BEAT_STEP_MAP = [S_NA, S_CL, S_MOVE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'na', label: 'Sodium gives 1' },
    { type: 'button', id: 'cl', label: 'Chlorine gives 1' },
    { type: 'button', id: 'again', label: 'Start again' },
  ];
  static ARIA_LABEL =
    'A sodium atom, 2, 8, 1, beside a chlorine atom, 2, 8, 7. Sodium has one valence electron and chlorine has '
    + 'one empty place. You choose which atom gives one electron. If sodium gives it, sodium shows 8 in its '
    + 'outermost shell and chlorine shows 8 too. If chlorine gives it, neither atom has 8, and they go back.';

  constructor(container, config) {
    super(container, config);
    this._state = 'start';  // start | right | wrong
    this._fly = null;       // { from, t } while an electron crosses
    this._at = 0;
    this._found = false;
  }

  enter() {
    this._state = 'start';
    this._fly = null;
    this._at = this.age;
    this._found = false;
  }

  busy() { return !!this._fly || this.age - this._at < 1; }

  isControlHidden(id) {
    if (this.stage !== S_MOVE) return true;
    return id === 'again' ? this._state !== 'right' : this._state === 'right';
  }

  isControlDisabled() { return !!this._fly || this._state === 'wrong'; }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') { this.enter(); this.requestUiUpdate?.(); return; }
    this._give(id);
  }

  pointerDown(p) {
    if (this.stage !== S_MOVE || this._fly || this._state !== 'start') return;
    if (Math.hypot(p.x - NA.x, p.y - NA.y) < R + 10) this._give('na');
    else if (Math.hypot(p.x - CL.x, p.y - CL.y) < R + 10) this._give('cl');
  }

  _give(from) {
    if (this._state !== 'start' || this._fly) return;
    if (reducedMotion()) { this._land(from); return; }
    this._fly = { from, t: 0 };
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  _land(from) {
    this._fly = null;
    this._at = this.age;
    if (from === 'na') {
      this._state = 'right';
      if (!this._found) {
        this._found = true;
        this.celebrate(340, 206, 28, { key: 'one-electron-moves', lookAt: 'scene' });
      }
    } else {
      this._state = 'wrong';
      this.oops(340, 206);
      this.after(2.2, () => { this._state = 'start'; this._at = this.age; this.requestUiUpdate?.(); });
    }
    this.requestUiUpdate?.();
  }

  update(d) {
    if (!this._fly) return;
    this._fly.t += d;
    if (this._fly.t >= FLY) this._land(this._fly.from);
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: 340, y: 206, seed: 6, n: 8 });
    const st = this.stage, s = this._state, f = this._fly;
    const na = f?.from === 'na' ? [2, 8, 0] : s === 'right' ? [2, 8] : s === 'wrong' ? [2, 8, 2] : [2, 8, 1];
    const cl = f?.from === 'cl' ? [2, 8, 6] : s === 'right' ? [2, 8, 8] : s === 'wrong' ? [2, 8, 6] : [2, 8, 7];
    const lay = atomLayout({ ...naO, shells: [2, 8, 1] });
    const naExtra = s === 'right' ? { radius: lay.shells[1].r + ER, phase: 1.5 } : null;
    const naDim = st === S_CL ? 0.55 : 0, clDim = st === S_NA ? 0.55 : 0;
    drawAtom(ctx, c, NA.x, NA.y, { ...naO, shells: na, ...naExtra, focusShell: st === S_CL ? undefined : 'outer', dimInner: st !== S_CL, dim: naDim });
    drawAtom(ctx, c, CL.x, CL.y, { ...clO, shells: cl, focusShell: st === S_NA ? undefined : 'outer', dimInner: st !== S_NA, dim: clDim });
    if (f) this._flyer(ctx, c, f);
    this._reading(ctx, c, NA.x, 'sodium', (s === 'right' ? [2, 8] : na).filter((v, i) => v > 0 || i < 2), st === S_CL, s);
    this._reading(ctx, c, CL.x, 'chlorine', cl, st === S_NA, s);
    this._hint(ctx, c);
  }

  _flyer(ctx, c, f) {
    const u = ease.inOutCubic(clamp01(f.t / FLY));
    const a = atomLayout({ ...naO, shells: [2, 8, 1] }).shells[2].pts[0];
    const b = atomLayout({ ...clO, shells: [2, 8, 7] }).shells[2].pts[7];
    const pa = { x: NA.x + a.x, y: NA.y + a.y }, pb = { x: CL.x + b.x, y: CL.y + b.y };
    const [p0, p1] = f.from === 'na' ? [pa, pb] : [pb, pa];
    drawElectron(ctx, c, p0.x + (p1.x - p0.x) * u, p0.y + (p1.y - p0.y) * u - Math.sin(u * Math.PI) * 46, 13, { focus: 1 });
  }

  _reading(ctx, c, x, name, cfg, dim, s) {
    const outer = cfg[cfg.length - 1], eight = outer === 8;
    say(ctx, c, name, x - 66, 412, { size: 30, align: 'center', col: dim ? c.labelMuted : c.label });
    say(ctx, c, cfg.join(','), x + 66, 412, { size: 46, col: eight && s === 'right' ? c.good : dim ? c.labelMuted : c.s2ink });
  }

  _hint(ctx, c) {
    const s = this._state, y = 476;
    if (this.stage === S_NA) {
      const p = popIn(this.age - this._at, 0.5);
      if (p > 0) tag(ctx, c, '1 valence electron', NA.x, y, { scale: Math.min(1.05, p), size: 26 });
    } else if (this.stage === S_CL) {
      const p = popIn(this.age - this._at, 0.5);
      if (p > 0) tag(ctx, c, '1 short of an octet', CL.x, y, { scale: Math.min(1.05, p), size: 26 });
    } else if (s === 'right') tag(ctx, c, 'both have 8', 340, y, { bg: c.good, size: 28 });
    else if (s === 'wrong') tag(ctx, c, 'neither has 8', 340, y, { bg: c.bad, size: 28 });
    else if (!this._fly) tag(ctx, c, 'tap the atom that gives 1 electron', 340, y, { size: 24 });
  }
}
