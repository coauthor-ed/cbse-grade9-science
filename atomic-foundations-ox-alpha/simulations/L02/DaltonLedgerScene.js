// DaltonLedgerScene - companion to blk-l02-s7, "Dalton's Atomic Theory".
//   b0  postulates  six numbers: tap one and its picture fills the stage (Dalton's solid balls)
//   b1  explains    carbon and oxygen rearrange: the same atoms before and after, so the mass cannot change
//   b2  takeaway    one plain atom, the three results around it
// Dalton's atom has no parts, so these are plain balls, not the shell atoms of later lessons.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, popAt, clamp01, lerp, drawBackdrop, drawFloor, drawBench } from 'simulations/base/kit/SimLook.js';
import { drawBall, drawBond, atomTone, drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { bigText, isDay, chipInk } from '../L01/GrainKit.js';

const S_POST = 0, S_EXPLAIN = 1, S_TAKE = 2;
const LABELS = ['all matter: tiny atoms', 'cannot be split or lost', 'same element, same atoms', 'different elements differ', 'whole numbers: 1:1 or 1:2', 'always the same numbers'];
const NUM_Y = 470;
const numX = (i) => 340 + (i - 2.5) * 100;
const REACT_S = 2;

export class DaltonLedgerScene extends SimScene {
  static BEAT_STEP_MAP = [S_POST, S_EXPLAIN, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'post', label: 'Postulate', value: '1', options: ['1', '2', '3', '4', '5', '6'] },
    { type: 'button', id: 'react', label: 'React them' },
  ];
  static ARIA_LABEL = 'Six numbered pictures of Dalton\'s postulates, each using plain solid balls for atoms. Next, one carbon atom and two oxygen atoms rearrange into '
    + 'carbon dioxide: the same three atoms before and after, so the mass does not change. Last, one plain atom with the three results around it.';

  constructor(container, config) {
    super(container, config);
    this._n = 0;
    this._at = 0;
    this._runAt = null;
  }

  enter() { this._n = 0; this._at = 0; this._runAt = null; this.requestUiUpdate?.(); }

  isControlHidden(id) { return id === 'post' ? this.stage !== S_POST : this.stage !== S_EXPLAIN; }
  isControlDisabled(id) { return id === 'react' ? this._runAt != null : false; }
  getControlValue(id) { return id === 'post' ? String(this._n + 1) : undefined; }
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'post') this._set(Number(v) - 1); else this._react();
  }

  _set(i) { this._n = i; this._at = this.age; this.requestUiUpdate?.(); }

  _react() {
    if (this._runAt != null) return;
    this._runAt = this.age;
    const hit = () => this.celebrate(340, 230, 24, { key: 'same-atoms' });
    if (reducedMotion()) hit(); else this.after(REACT_S + 0.2, hit);
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_POST) {
      if (p.y > 420) { let b = 0; for (let i = 0; i < 6; i++) if (Math.abs(numX(i) - p.x) < Math.abs(numX(b) - p.x)) b = i; this._set(b); } else this._set((this._n + 1) % 6);
    } else if (this.stage === S_EXPLAIN) this._react();
  }

  _r() {
    if (this._runAt == null) return 0;
    return reducedMotion() ? 1 : ease.inOutCubic(clamp01((this.age - this._runAt) / REACT_S));
  }

  busy() { return this.age - this._at < 0.5 || (this._runAt != null && this._r() < 1); }

  draw(ctx, c, t) {
    if (this.stage === S_POST) { drawDepthField(ctx, c, { x: 340, y: 230, seed: 12, t }); this._post(ctx, c); }
    else if (this.stage === S_EXPLAIN) this._explain(ctx, c);
    else this._take(ctx, c, t);
  }

  _post(ctx, c) {
    const n = this._n;
    bigText(ctx, c, LABELS[n], 340, 52, 34, c.label);
    const H = atomTone(c, 'H'), O = atomTone(c, 'O'), K = atomTone(c, 'C'), G = c.gold;
    if (n === 0) {
      for (let j = 0; j < 6; j++) for (let i = 0; i < 9 - (j % 2); i++) drawBall(ctx, c, 340 + (i - (8 - (j % 2)) / 2) * 60, 390 - j * 52, 27, c.s1);
    } else if (n === 1) {
      drawBall(ctx, c, 340, 240, 130, c.s1);
      ctx.save();
      ctx.strokeStyle = c.bad; ctx.lineWidth = 16; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(250, 150); ctx.lineTo(430, 330); ctx.moveTo(430, 150); ctx.lineTo(250, 330); ctx.stroke();
      ctx.restore();
    } else if (n === 2) {
      for (let i = 0; i < 4; i++) drawBall(ctx, c, 340 + (i - 1.5) * 150, 240, 66, G);
    } else if (n === 3) {
      drawBall(ctx, c, 130, 280, 42, H); drawBall(ctx, c, 300, 256, 72, O); drawBall(ctx, c, 510, 232, 110, G);
    } else if (n === 4) {
      this._mol(ctx, c, 180, 240, 58, [K, O], 92);
      this._mol(ctx, c, 480, 240, 58, [O, K, O], 92);
    } else {
      for (let i = 0; i < 3; i++) this._mol(ctx, c, 340 + (i - 1) * 208, 240, 46, [H, O, H], 62);
    }
    for (let i = 0; i < 6; i++) {
      const on = i === n;
      pill(ctx, c, String(i + 1), numX(i), NUM_Y, { bg: on ? c.accent : c.raised, ink: on ? chipInk(c) : c.label, size: 38, display: true });
    }
  }

  _mol(ctx, c, x, y, r, tones, d) {
    const n = tones.length, x0 = x - ((n - 1) * d) / 2;
    for (let i = 0; i < n - 1; i++) drawBond(ctx, c, x0 + i * d, y, x0 + (i + 1) * d, y, { w: 12 });
    tones.forEach((t, i) => drawBall(ctx, c, x0 + i * d, y, i === Math.floor(n / 2) || n === 2 ? r : r * 0.9, t));
  }

  _explain(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 482);
    drawBench(ctx, c, 26, 654, 444);
    const k = this._r(), K = atomTone(c, 'C'), O = atomTone(c, 'O');
    const y = 250;
    const cx = lerp(150, 340, k);
    const o1 = lerp(420, 216, k), o2 = lerp(560, 464, k);
    if (k > 0.8) { drawBond(ctx, c, o1, y, cx, y, { order: 2, w: 13 }); drawBond(ctx, c, cx, y, o2, y, { order: 2, w: 13 }); }
    else { const a = clamp01(1 - k * 1.4); if (a > 0.05) drawBond(ctx, c, o1, y, o2, y, { order: 2, w: 13 }); }
    drawBall(ctx, c, o1, y, 66, O); bigText(ctx, c, 'O', o1, y + 2, 46, c.bgDeep);
    drawBall(ctx, c, o2, y, 66, O); bigText(ctx, c, 'O', o2, y + 2, 46, c.bgDeep);
    drawBall(ctx, c, cx, y, 74, K); bigText(ctx, c, 'C', cx, y + 2, 50, isDay(c) ? c.bgSurface : c.label);
    bigText(ctx, c, k >= 1 ? 'after: 1 C, 2 O' : 'before: 1 C, 2 O', 340, 66, 36, c.label);
    if (this._runAt == null) pill(ctx, c, 'tap to join them', 340, 396, { bg: c.warning, ink: chipInk(c), size: 26, display: true });
    if (k >= 1) pill(ctx, c, 'same atoms, same mass', 340, 396, { bg: c.good, ink: chipInk(c), size: 28, display: true });
  }

  _take(ctx, c, t) {
    drawDepthField(ctx, c, { x: 340, y: 250, seed: 14, t });
    drawBall(ctx, c, 340, 250, 128, c.s1, { focus: 0.7 });
    [['mass stays', 150, 96, 0.2], ['fixed ratios', 530, 96, 0.5], ['whole atoms', 340, 452, 0.8]].forEach(([text, x, y, at]) => {
      const p = reducedMotion() ? { scale: 1, alpha: 1, u: 2 } : popAt(this.age, at);
      if (p) pill(ctx, c, text, x, y, { bg: c.gold, ink: chipInk(c), size: 32, display: true, scale: p.scale, alpha: p.alpha, pop: p.u });
    });
  }
}
