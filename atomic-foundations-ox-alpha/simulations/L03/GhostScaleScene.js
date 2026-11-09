// GhostScaleScene - companion to blk-l03-s6, "How Light Is an Electron?".
// Grade level: no q/m, no crossed fields.
//   b0  dot      the end of the tube: a glowing spot on a scale. Switch on the plates: it moves
//   b1  lighter  electron or charged hydrogen atom under the same push: only the light one bends
//   b2  number   add electrons to a balance until they match one hydrogen atom: 1836
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, mix, pill, darken, drawBackdrop, drawBench, drawFloor } from 'simulations/base/kit/SimLook.js';
import { drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { drawBalance, balanceTilt } from 'simulations/base/kit/SimBalance.js';
import { reducedMotion, follow } from 'simulations/base/kit/SimAnim.js';
import { bigText, isDay, chipInk } from '../L01/GrainKit.js';
import { drawRayRig } from './RayTubeKit.js';

const S_DOT = 0, S_LIGHT = 1, S_NUM = 2;
const BENCH = 402;
const COUNTS = [1, 10, 100, 1000, 1836];
const X = 340, Y = 268, R = 176;

export class GhostScaleScene extends SimScene {
  static BEAT_STEP_MAP = [S_DOT, S_LIGHT, S_NUM].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'plates', label: 'Plates on or off' },
    { type: 'segmented', id: 'who', label: 'Send', value: 'e', options: [{ value: 'e', label: 'Electrons' }, { value: 'h', label: 'Charged hydrogen atoms' }] },
    { type: 'button', id: 'add', label: 'Add more electrons' },
  ];
  static ARIA_LABEL = 'The end of the tube with a glowing spot on a scale. With the plates on, the spot moves along the scale. Under the same push, electrons bend a long way but charged hydrogen atoms hardly bend. '
    + 'Last, on a balance, 1836 electrons match the mass of one hydrogen atom.';

  constructor(container, config) {
    super(container, config);
    this._on = false;
    this._s = 0;
    this._who = 'e';
    this._seen = {};
    this._n = 0;
    this._tilt = 0;
    this._found = false;
  }

  enter() {
    this._on = false; this._s = 0; this._who = 'e'; this._seen = { e: true }; this._n = 0; this._found = false;
    this._tilt = -balanceTilt(1836, 1, { max: 0.24, scale: 1200 });
    this.requestUiUpdate?.();
  }

  isControlHidden(id) { return (id === 'plates' && this.stage !== S_DOT) || (id === 'who' && this.stage !== S_LIGHT) || (id === 'add' && this.stage !== S_NUM); }
  isControlDisabled(id) { return id === 'add' && this._n >= COUNTS.length - 1; }
  getControlValue(id) { return id === 'who' ? this._who : undefined; }
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'plates') this._toggle();
    if (id === 'who') this._pick(v);
    if (id === 'add') this._add();
  }

  _toggle() { this._on = !this._on; if (reducedMotion()) this._s = this._on ? 1 : 0; this.requestUiUpdate?.(); }

  _pick(v) {
    this._who = v;
    this._seen[v] = true;
    if (this._seen.h && !this._found) { this._found = true; this.after(0.4, () => this.celebrate(600, 116, 20, { key: 'lighter-bends' })); }
    this.requestUiUpdate?.();
  }

  _add() {
    if (this._n >= COUNTS.length - 1) return;
    this._n += 1;
    if (this._n === COUNTS.length - 1) this.after(0.9, () => this.celebrate(340, 240, 26, { key: 'mass-1836' }));
    this.requestUiUpdate?.();
  }

  pointerDown() {
    if (this.stage === S_DOT) this._toggle();
    else if (this.stage === S_LIGHT) this._pick(this._who === 'e' ? 'h' : 'e');
    else this._add();
  }

  _target() { return balanceTilt(COUNTS[this._n], 1836, { max: 0.24, scale: 1200 }); }

  update(d) {
    const tg = this._on ? 1 : 0;
    this._s = follow(this._s, tg, d, 0.18);
    if (Math.abs(this._s - tg) < 0.004) this._s = tg;
    const tt = this._target();
    this._tilt = reducedMotion() ? tt : follow(this._tilt, tt, d, 0.18);
    if (Math.abs(this._tilt - tt) < 0.001) this._tilt = tt;
  }

  busy() { return this._s !== (this._on ? 1 : 0) || this._tilt !== this._target(); }

  draw(ctx, c, t) {
    if (this.stage === S_DOT) this._screen(ctx, c, t);
    else if (this.stage === S_LIGHT) this._lanes(ctx, c);
    else this._balance(ctx, c);
  }

  _screen(ctx, c, t) {
    drawDepthField(ctx, c, { x: X, y: Y, seed: 44, t });
    const glassT = isDay(c) ? mix(c.label, c.s3, 0.2) : mix(c.bgDeep, c.s3, 0.2);
    ctx.beginPath(); ctx.arc(X, Y, R + 18, 0, Math.PI * 2); ctx.fillStyle = darken(c.glass, 0.25); ctx.fill();
    ctx.beginPath(); ctx.arc(X, Y, R, 0, Math.PI * 2); ctx.fillStyle = glassT; ctx.fill();
    // the scale
    const base = Y + 120;
    ctx.strokeStyle = alpha(c.glass, 0.8); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(X, base); ctx.lineTo(X, Y - 136); ctx.stroke();
    for (let i = 0; i <= 5; i++) {
      const y = base - i * 50;
      ctx.beginPath(); ctx.moveTo(X - 14, y); ctx.lineTo(X + 14, y); ctx.stroke();
      if (i % 2 === 0) bigText(ctx, c, `${i} cm`, X - 62, y, 24, isDay(c) ? c.bgSurface : c.label);
    }
    const y = base - 200 * this._s;
    ctx.beginPath(); ctx.arc(X, y, 38, 0, Math.PI * 2); ctx.fillStyle = alpha(c.s3, 0.35); ctx.fill();
    ctx.beginPath(); ctx.arc(X, y, 20, 0, Math.PI * 2); ctx.fillStyle = mix(c.s3, isDay(c) ? c.bgSurface : c.label, 0.55); ctx.fill();
    bigText(ctx, c, 'the glowing spot', X, 52, 34, c.label);
    if (!this._on) pill(ctx, c, 'tap: plates on', X + 188, 478, { bg: c.warning, ink: chipInk(c), size: 26, display: true });
    else pill(ctx, c, 'it moved 4 cm', X + 188, 478, { bg: c.gold, ink: chipInk(c), size: 26, display: true });
  }

  _lanes(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 66);
    drawBench(ctx, c, 26, 654, BENCH);
    const e = this._who === 'e';
    drawRayRig(ctx, c, { bench: BENCH, plates: 1, bend: e ? 76 : 0.5, beamCol: e ? c.electron : c.s8 });
    pill(ctx, c, e ? 'electrons: a big bend' : 'charged hydrogen atoms', X, 42, { bg: e ? c.accent : c.s8, ink: chipInk(c), size: 28, display: true });
    bigText(ctx, c, e ? 'very light' : 'hardly any bend', 190, 338, 30, c.label);
  }

  _balance(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 66);
    drawBench(ctx, c, 26, 654, BENCH + 26);
    const n = COUNTS[this._n];
    drawBalance(ctx, c, {
      x: X, y: 252, w: 400, tilt: this._tilt,
      left: [{ kind: 'block', text: 'H', tone: c.s8, w: 76, h: 76 }],
      right: [{ kind: 'block', text: String(n), tone: c.electron, w: Math.max(76, 36 + 22 * String(n).length), h: 76 }],
    });
    bigText(ctx, c, `1 hydrogen atom : ${n} electron${n > 1 ? 's' : ''}`, X, 56, 30, c.label);
    if (this._n === COUNTS.length - 1) pill(ctx, c, 'level at 1836', X, 112, { bg: c.gold, ink: chipInk(c), size: 28, display: true });
    else pill(ctx, c, 'tap to add electrons', X, 112, { bg: c.warning, ink: chipInk(c), size: 26, display: true });
  }
}
