// TwinGrainsScene - companion to blk-l01-s1, "Two White Grains".
//   b0  twins     two big white grains on a dark plate: tap one to find out which it is
//   b1  sprinkle  each grain drops into a glass and disappears: two clear glasses
//   b2  question  tap each grain to taste it: the lens over each one holds a question
// The grains share one drawing: the point of b0 is that the eye cannot tell them apart.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, mix, lerp, clamp01, pill, popAt, outBack, drawBackdrop, drawFloor, drawBench, darken } from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { ease, reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawGrain, drawPlate, bigText, isDay } from './GrainKit.js';

const TAU = Math.PI * 2;
const S_LOOK = 0, S_STIR = 1, S_TASTE = 2;
const BENCH = 408;
const SPOTS = [{ x: 208, name: 'salt', seed: 3, taste: 'salty' }, { x: 472, name: 'sugar', seed: 9, taste: 'sweet' }];
const GLASS_W = 200, GLASS_H = 236;
const STIR_S = 2.6;

export class TwinGrainsScene extends SimScene {
  static BEAT_STEP_MAP = [S_LOOK, S_STIR, S_TASTE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [{ type: 'button', id: 'drop', label: 'Drop them in' }];
  static ARIA_LABEL = 'Two white grains on a dark plate look the same. Tap one to see which it is. '
    + 'Next each grain drops into a glass of water and disappears, leaving two clear glasses. '
    + 'Last, tap each grain to taste it: one is salty and one is sweet, and a lens over each shows a question mark.';

  constructor(container, config) {
    super(container, config);
    this._open = [false, false];
    this._openAt = [0, 0];
    this._dropAt = null;
    this._found = false;
  }

  enter() {
    this._open = [false, false];
    this._openAt = [0, 0];
    this._dropAt = null;
    this._found = false;
  }

  isControlHidden(id) { return id === 'drop' ? this.stage !== S_STIR : false; }
  isControlDisabled(id) { return id === 'drop' ? this._dropAt != null : false; }
  onControlChange(id) { if (this._guard(id) && id === 'drop') this._drop(); }

  _drop() {
    if (this._dropAt != null) return;
    this._dropAt = this.age;
    this.requestUiUpdate?.();
  }

  _stirT() {
    if (this._dropAt == null) return 0;
    return reducedMotion() ? 1 : clamp01((this.age - this._dropAt) / STIR_S);
  }

  busy() {
    if (this.stage === S_STIR && this._dropAt != null && this._stirT() < 1) return true;
    return this.age < 1.2 || this._open.some((o, i) => o && this.age - this._openAt[i] < 0.6);
  }

  pointerDown(p) {
    if (this.stage === S_STIR) { this._drop(); return; }
    const i = p.x < 340 ? 0 : 1;
    if (this._open[i]) return;
    this._open[i] = true;
    this._openAt[i] = this.age;
    if (this.stage === S_TASTE && this._open[0] && this._open[1] && !this._found) {
      this._found = true;
      this.celebrate(340, 240, 26, { key: 'tastes-differ' });
    }
  }

  draw(ctx, c, t) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 66);
    drawBench(ctx, c, 26, 654, BENCH);
    if (this.stage === S_STIR) this._glasses(ctx, c, t);
    else if (this.stage === S_TASTE) this._lenses(ctx, c);
    else this._plate(ctx, c);
  }

  _chip(ctx, c, i, y, text, bg) {
    const p = reducedMotion() ? { scale: 1, alpha: 1, u: 2 } : popAt(this.age, this._openAt[i]);
    if (p) pill(ctx, c, text, SPOTS[i].x, y, { bg, size: 28, display: true, scale: p.scale, alpha: p.alpha, pop: p.u });
  }

  _bob(i) {
    if (reducedMotion()) return 1;
    return outBack(clamp01(this.age / 0.5 - i * 0.2));
  }

  _plate(ctx, c) {
    drawPlate(ctx, c, 340, BENCH - 22, 284, 44);
    SPOTS.forEach((s, i) => {
      const u = this._bob(i), lift = this._open[i] ? 10 : 0;
      drawGrain(ctx, c, s.x, BENCH - 136 - lift, 100 * u, { seed: s.seed });
      if (this._open[i]) this._chip(ctx, c, i, 96, s.name, i ? c.s4 : c.s1);
    });
    if (!this._open[0] && !this._open[1]) pill(ctx, c, 'tap a grain', 340, 60, { bg: c.raised, ink: c.label, size: 26, display: true });
  }

  _glasses(ctx, c, t) {
    const u = this._stirT();
    SPOTS.forEach((s, i) => {
      const g = glassBox('tumbler', s.x - GLASS_W / 2, BENCH - GLASS_H, GLASS_W, GLASS_H, { taper: 0.12, wall: 6 });
      drawGlass(ctx, c, g);
      const sy = drawGlassLiquid(ctx, c, g, { level: 0.68, fill: c.water, opacity: 0.42 });
      const fall = ease.inOutCubic(clamp01(u / 0.34));
      const fade = clamp01((u - 0.34) / 0.5);
      const y = lerp(92, g.floor - 44, fall);
      const r = lerp(46, 20, fade);
      if (fade < 1) {
        drawGrain(ctx, c, s.x, y, r, { seed: s.seed, alpha: 1 - fade });
        if (fall >= 1 && !reducedMotion()) this._swirl(ctx, c, s.x, y, fade, t);
      }
      drawGlassFront(ctx, c, g, { shade: 0.1 });
    });
    if (u >= 1) pill(ctx, c, 'both clear', 340, 72, { bg: c.raised, ink: c.label, size: 28, display: true });
  }

  _swirl(ctx, c, x, y, fade, t) {
    ctx.save();
    ctx.strokeStyle = alpha(isDay(c) ? c.bgSurface : c.label, 0.7 * (1 - fade));
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = t * 3 + (i * TAU) / 3;
      ctx.beginPath(); ctx.arc(x, y, 34 + fade * 34, a, a + 1.5); ctx.stroke();
    }
    ctx.restore();
  }

  _lenses(ctx, c) {
    const y = 214, R = 122;
    SPOTS.forEach((s, i) => {
      // the handle first, so the rim sits on top of it
      const hx = s.x + (i ? 1 : -1) * R * 0.62, hy = y + R * 0.78;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = darken(c.s2, 0.22); ctx.lineWidth = 26;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + (i ? 1 : -1) * 44, hy + 66); ctx.stroke();
      ctx.strokeStyle = c.s2; ctx.lineWidth = 17;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + (i ? 1 : -1) * 44, hy + 66); ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(s.x, y, R, 0, TAU);
      ctx.fillStyle = isDay(c) ? mix(c.label, c.s5, 0.2) : mix(c.raised, c.s5, 0.2);
      ctx.fill();
      drawGrain(ctx, c, s.x, y + 4, 84, { seed: s.seed, alpha: 0.2 });
      bigText(ctx, c, '?', s.x, y + 6, 118, isDay(c) ? c.bgSurface : c.warning);
      ctx.beginPath(); ctx.arc(s.x, y, R, 0, TAU);
      ctx.lineWidth = 11; ctx.strokeStyle = darken(c.s2, 0.14); ctx.stroke();
      if (this._open[i]) this._chip(ctx, c, i, 382, s.taste, i ? c.s4 : c.s1);
    });
    if (!this._open[0] && !this._open[1]) pill(ctx, c, 'tap to taste', 340, 56, { bg: c.raised, ink: c.label, size: 26, display: true });
  }
}
