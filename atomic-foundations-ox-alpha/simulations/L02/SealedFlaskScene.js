// SealedFlaskScene - companion to blk-l02-s3, "Mass Stays the Same". The book's Activity 9.2.
//   b0  sealed    the balloon is fixed on the mouth: lift it, the gas fills it, the reading holds
//   b1  open      the balloon lies beside the flask: tip it in, the gas leaves, the reading falls
//   b2  takeaway  both rigs side by side with their readings
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, popAt, drawBackdrop, drawFloor, drawBench } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { chipInk } from '../L01/GrainKit.js';
import { drawDigitalBalance, drawFlaskRig, massAt, RUN_S } from './BalanceKit.js';

const S_SEALED = 0, S_OPEN = 1, S_TAKE = 2;
const BENCH = 462;
const M0 = 22.5, M1 = 21.45;
const fmt = (v) => `${v.toFixed(2)} g`;

export class SealedFlaskScene extends SimScene {
  static BEAT_STEP_MAP = [S_SEALED, S_OPEN, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [{ type: 'button', id: 'run', label: 'Mix them' }];
  static ARIA_LABEL = 'A digital balance holds a conical flask of vinegar and a balloon of baking soda, reading 22.50 grams. With the balloon '
    + 'fixed on the mouth, the soda falls in, the balloon swells and the reading stays at 22.50 grams. With the balloon beside the open flask, '
    + 'the gas escapes and the reading falls to 21.45 grams. Last, both set-ups stand side by side.';

  constructor(container, config) {
    super(container, config);
    this._runAt = null;
    this._found = false;
  }

  enter() { this._runAt = null; this._found = false; this.requestUiUpdate?.(); }

  _mode() { return this.stage === S_OPEN ? 'open' : 'sealed'; }
  _t() {
    if (this._runAt == null) return 0;
    return reducedMotion() ? RUN_S.sealed + 1 : this.age - this._runAt;
  }

  isControlHidden(id) { return id === 'run' && this.stage === S_TAKE; }
  isControlDisabled(id) { return id === 'run' && this._runAt != null && this._t() < RUN_S.sealed; }
  onControlChange(id) { if (this._guard(id) && id === 'run') this._go(); }
  pointerDown() { if (this.stage !== S_TAKE && !this.isControlDisabled('run')) this._go(); }

  _go() {
    this._runAt = this.age;
    this._found = false;
    const hit = () => {
      if (this._found) return;
      this._found = true;
      this.celebrate(340, 372, 24, { key: this.stage === S_OPEN ? 'gas-left' : 'mass-held', lookAt: 'balance' });
    };
    if (reducedMotion()) hit(); else this.after(RUN_S.sealed, hit);
    this.requestUiUpdate?.();
  }

  busy() { return this._runAt != null && !reducedMotion() && this._t() < RUN_S.sealed + 0.1; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 40);
    drawBench(ctx, c, 26, 654, BENCH);
    if (this.stage === S_TAKE) { this._both(ctx, c); return; }
    const mode = this._mode(), t = this._t();
    const v = massAt(mode, t, M0, M1);
    const done = this._runAt != null && t >= RUN_S.sealed;
    const tone = done ? (mode === 'sealed' ? 'good' : 'bad') : 'live';
    const y = drawDigitalBalance(ctx, c, 340, BENCH, fmt(v), tone, { w: 340 });
    ctx.save();
    ctx.translate(340, y);
    ctx.scale(1.26, 1.26);
    drawFlaskRig(ctx, c, mode, t);
    ctx.restore();
    if (this._runAt == null) pill(ctx, c, mode === 'sealed' ? 'tap to lift the balloon' : 'tap to tip in the soda', 340, 56, { bg: c.warning, ink: chipInk(c), size: 26, display: true });
    if (done) {
      const text = mode === 'sealed' ? 'no change' : `${(M1 - M0).toFixed(2)} g: gas left`;
      const p = reducedMotion() ? { scale: 1, alpha: 1, u: 2 } : popAt(this.age, this._runAt + RUN_S.sealed);
      if (p) pill(ctx, c, text, 530, 130, { bg: mode === 'sealed' ? c.good : c.bad, ink: chipInk(c), size: 26, display: true, scale: p.scale, alpha: p.alpha, pop: p.u });
    }
  }

  _both(ctx, c) {
    const S = 0.84;
    [[182, 'sealed', M0, 'good', 'fixed on'], [500, 'open', M1, 'bad', 'open']].forEach(([x, mode, v, tone, label]) => {
      const y = drawDigitalBalance(ctx, c, x, BENCH, fmt(v), tone, { w: 276 });
      ctx.save();
      ctx.translate(x, y); ctx.scale(S, S);
      drawFlaskRig(ctx, c, mode, 99);
      ctx.restore();
      pill(ctx, c, label, x, 56, { bg: tone === 'good' ? c.good : c.bad, ink: chipInk(c), size: 28, display: true });
    });
  }
}
