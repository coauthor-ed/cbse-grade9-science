// ZoomDescentScene - companion to blk-l01-s6, "Into One Grain of Salt".
//   b0  zoom   the learner zooms from a grain, through its stepped surface, to its tiny particles
//   b1  claim  a sodium atom and a chlorine atom, their insides still a question
//   b2  hook   a balance: why did anyone believe in atoms?
// The particles stay unnamed: ions come in a later lesson.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { mix, rr, pill, clamp01, lerp, drawBackdrop, drawFloor, drawBench } from 'simulations/base/kit/SimLook.js';
import { drawAtom, drawBall, drawDepthField } from 'simulations/base/kit/SimAtom.js';
import { drawBalance } from 'simulations/base/kit/SimBalance.js';
import { reducedMotion, follow } from 'simulations/base/kit/SimAnim.js';
import { drawGrain, bigText, isDay, snow, chipInk } from './GrainKit.js';

const S_ZOOM = 0, S_CLAIM = 1, S_HOOK = 2;
const LEVELS = ['x 1', 'x 100', 'x 10,000', 'x 25 lakh'];

export class ZoomDescentScene extends SimScene {
  static BEAT_STEP_MAP = [S_ZOOM, S_CLAIM, S_HOOK].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [{ type: 'slider', id: 'zoom', label: 'Zoom', min: 0, max: 3, step: 1, value: 0, suffix: '' }];
  static ARIA_LABEL = 'One grain of salt is magnified in steps: the grain, its stepped surface, then a regular block of tiny particles at '
    + 'about 25 lakh times. Next a sodium atom and a chlorine atom stand side by side with question marks. Last, a balance holds a grain.';

  constructor(container, config) {
    super(container, config);
    this._level = 0;
    this._z = 0;
    this._found = false;
  }

  enter() { this._level = 0; this._z = 0; this._found = false; this.requestUiUpdate?.(); }

  isControlHidden() { return this.stage !== S_ZOOM; }
  getControlValue(id) { return id === 'zoom' ? this._level : undefined; }
  onControlChange(id, v) { if (this._guard(id) && id === 'zoom') this._go(Number(v)); }

  _go(n) {
    this._level = Math.max(0, Math.min(3, n));
    if (reducedMotion()) this._z = this._level;
    this.requestUiUpdate?.();
  }

  pointerDown() { if (this.stage === S_ZOOM) this._go((this._level + 1) % 4); }

  update(d) {
    this._z = follow(this._z, this._level, d, 0.28);
    if (Math.abs(this._z - this._level) < 0.002) this._z = this._level;
    if (this.stage === S_ZOOM && this._level === 3 && this._z > 2.97 && !this._found) {
      this._found = true;
      this.celebrate(340, 250, 26, { key: 'tiny-particles' });
    }
  }

  busy() { return Math.abs(this._z - this._level) > 0.002; }

  draw(ctx, c, t) {
    if (this.stage === S_ZOOM) this._zoom(ctx, c, t);
    else if (this.stage === S_CLAIM) this._claim(ctx, c, t);
    else this._hook(ctx, c);
  }

  _zoom(ctx, c, t) {
    drawDepthField(ctx, c, { x: 340, y: 260, seed: 6, t });
    const z = this._z;
    // each level is clean when the zoom rests on it: the layers cross only between levels
    const a0 = clamp01((0.75 - z) / 0.35), a1 = Math.min(clamp01((z - 0.35) / 0.4), clamp01((2.7 - z) / 0.4)), a2 = clamp01((z - 2.3) / 0.4);
    if (a0 > 0) {
      const r = lerp(104, 340, clamp01(z / 1.3) ** 1.6);
      drawGrain(ctx, c, 340, 270, r, { seed: 3, alpha: a0 });
    }
    if (a1 > 0) this._steps(ctx, c, a1, z);
    if (a2 > 0) this._lattice(ctx, c, a2, z);
    pill(ctx, c, LEVELS[this._level], 340, 56, { bg: this._level === 3 ? c.gold : c.raised, ink: this._level === 3 ? undefined : c.label, size: 34, display: true });
    if (this._level === 0) pill(ctx, c, 'tap to zoom in', 340, 462, { bg: c.warning, ink: chipInk(c), size: 24, display: true });
    if (this._level === 1 || this._level === 2) pill(ctx, c, 'its stepped surface', 340, 484, { bg: c.raised, ink: c.label, size: 24, display: true });
    if (this._level === 3 && z > 2.9) pill(ctx, c, 'tiny particles, in order', 340, 472, { bg: c.raised, ink: c.label, size: 26, display: true });
  }

  /** The stepped surface of the crystal: square terraces. */
  _steps(ctx, c, a, z) {
    ctx.save();
    ctx.globalAlpha *= a;
    const s = lerp(0.8, 1.45, clamp01((z - 0.8) / 1.4));
    const base = snow(c), mid = mix(base, c.glass, isDay(c) ? 0.26 : 0.2), dark = mix(base, c.s5, 0.42);
    for (let i = 0; i < 4; i++) {
      const w = (440 - i * 96) * s, h = (300 - i * 66) * s;
      const y = 276 - i * 28 * s;
      rr(ctx, 340 - w / 2, y - h / 2 + 18 * s, w, h, 14); ctx.fillStyle = dark; ctx.fill();
      rr(ctx, 340 - w / 2, y - h / 2, w, h, 14); ctx.fillStyle = i % 2 ? base : mid; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = isDay(c) ? mix(dark, c.label, 0.2) : dark; ctx.stroke();
    }
    ctx.restore();
  }

  _lattice(ctx, c, a, z) {
    ctx.save();
    ctx.globalAlpha *= a;
    const s = lerp(0.72, 1, clamp01(z - 2));
    const d = 80 * s, big = 35 * s, small = 23 * s;
    for (let j = -2; j <= 2; j++) {
      for (let i = -3; i <= 3; i++) {
        const even = (i + j) % 2 === 0;
        drawBall(ctx, c, 340 + i * d, 262 + j * d, even ? big : small, even ? c.anion : c.cation);
      }
    }
    ctx.restore();
  }

  _claim(ctx, c, t) {
    drawDepthField(ctx, c, { x: 340, y: 250, seed: 8, t });
    [[180, 'sodium', [2, 8, 1], 11, 12], [500, 'chlorine', [2, 8, 7], 17, 18]].forEach(([x, name, shells, p, n]) => {
      drawAtom(ctx, c, x, 240, { p, n, shells, radius: 138, dim: 0.5 });
      bigText(ctx, c, '?', x, 240, 124, isDay(c) ? c.label : c.warning);
      bigText(ctx, c, name, x, 424, 36, c.label);
    });
  }

  _hook(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 470);
    drawBench(ctx, c, 26, 654, 412);
    drawBalance(ctx, c, { x: 340, y: 232, w: 400, tilt: 0, left: [{ kind: 'weight', text: '10 g', tone: c.s2, w: 56, h: 48 }], right: [{ kind: 'weight', text: '10 g', tone: c.s2, w: 56, h: 48 }] });
    bigText(ctx, c, 'why believe in atoms?', 340, 56, 36, c.label);
  }
}
