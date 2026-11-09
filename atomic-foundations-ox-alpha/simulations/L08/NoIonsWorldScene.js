// NoIonsWorldScene - companion to blk-l08-s7, "What If Electrons Never Moved Between Atoms?".
//   b0  world     three jars on a bench: salt, neela thotha, a piece of marble. The switch empties them.
//   b1  life      a nerve with Na+ ions outside it, and a glass of ORS. "Send a signal" runs a pulse,
//                 with ions entering behind it. With the switch off there are no ions and no pulse.
//   b2  takeaway  one Na+ and one Cl- beside a grain of salt: far more ions, arranged somehow
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { mix, darken, lighten, luma, rr, clamp01, drawBench, drawBackdrop, drawFloor } from 'simulations/base/kit/SimLook.js';
import { reducedMotion, hash2 } from 'simulations/base/kit/SimAnim.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { drawDepthField, drawIon, drawBall } from 'simulations/base/kit/SimAtom.js';
import { popIn, say, tag } from '../L07/AtomBoard.js';

const S_WORLD = 0, S_LIFE = 1, S_TAKE = 2;
const JARS = [
  { x: 40, name: 'salt' },
  { x: 250, name: 'neela thotha' },
  { x: 460, name: 'marble' },
];
const NERVE = { x0: 120, x1: 660, y: 142, h: 62 };
const SOMA = { x: 76, y: 142, r: 62 };
const PULSE_S = 2.2;

export class NoIonsWorldScene extends SimScene {
  static BEAT_STEP_MAP = [S_WORLD, S_LIFE, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'toggle', id: 'ions', label: 'Electrons can move', value: true },
    { type: 'button', id: 'pulse', label: 'Send a signal' },
  ];
  static ARIA_LABEL =
    'Three jars on a lab bench hold salt, blue neela thotha and a piece of marble. Turn off the switch that lets '
    + 'electrons move and all three are empty, because each is made of ions. Next a nerve with sodium ions outside '
    + 'it and a glass of ORS with ions in the water. Send a signal and it runs along the nerve as ions move in. '
    + 'With the switch off there are no ions and no signal. Last, one sodium ion and one chloride ion beside a '
    + 'grain of salt, which holds far more ions than anyone can count.';

  constructor(container, config) {
    super(container, config);
    this._on = true;
    this._mix = 1;         // 1 = ions exist, eases on the switch
    this._p = -1;          // pulse progress, -1 at rest
    this._ran = false;
    this._found = false;
  }

  enter() {
    this._on = true;
    this._mix = 1;
    this._p = -1;
    this._ran = false;
    this._found = false;
  }

  busy() { return Math.abs(this._mix - (this._on ? 1 : 0)) > 0.01 || this._p >= 0 || this.age < 1; }

  isControlHidden(id) { return id === 'ions' ? this.stage === S_TAKE : this.stage !== S_LIFE; }
  isControlDisabled(id) { return id === 'pulse' && this._p >= 0; }
  getControlValue(id) { return id === 'ions' ? this._on : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'ions') {
      this._on = v === true || v === 'true';
      if (reducedMotion()) this._mix = this._on ? 1 : 0;
      if (!this._on && !this._found) {
        this._found = true;
        this.celebrate(340, 240, 14, { key: 'no-ions', small: true, lookAt: 'scene' });
      }
    } else if (id === 'pulse') {
      if (reducedMotion()) { this._ran = true; this._p = -1; } else this._p = 0;
    }
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  update(d) {
    const t = this._on ? 1 : 0;
    this._mix += Math.sign(t - this._mix) * Math.min(Math.abs(t - this._mix), d * 2.4);
    if (this._p >= 0) {
      this._p += d / PULSE_S;
      if (this._p >= 1) { this._p = -1; this._ran = true; this.requestUiUpdate?.(); }
    }
  }

  draw(ctx, c) {
    if (this.stage === S_WORLD) this._world(ctx, c);
    else if (this.stage === S_LIFE) this._life(ctx, c);
    else this._grain(ctx, c);
  }

  _world(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 470);
    drawBench(ctx, c, 14, 666, 378);
    const k = this._mix;
    JARS.forEach((J, i) => {
      const g = glassBox('jar', J.x, 138, 180, 240, { wall: 7 });
      drawGlass(ctx, c, g);
      if (k > 0.01) {
        ctx.save();
        ctx.globalAlpha *= k;
        if (i === 0) this._heap(ctx, c, J.x + 90, 370, 70, c.label);
        else if (i === 1) this._crystals(ctx, c, J.x + 90, 370);
        else this._marble(ctx, c, J.x + 90, 370);
        ctx.restore();
      }
      drawGlassFront(ctx, c, g, { shade: 0.1 });
      say(ctx, c, J.name, J.x + 90, 424, { size: i === 1 ? 26 : 28 });
    });
    if (k < 0.5) tag(ctx, c, 'all three are made of ions', 340, 72, { bg: c.bad, size: 26 });
    else tag(ctx, c, 'turn the switch off', 340, 72, { size: 24 });
  }

  _heap(ctx, c, x, y, w) {
    const day = luma(c.bgDeep) > 0.5;
    const col = day ? mix(c.bgDeep, c.stroke, 0.18) : mix(c.label, c.bgSurface, 0.06);
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w * 0.3, y - 74, x, y - 92);
    ctx.quadraticCurveTo(x + w * 0.3, y - 74, x + w, y);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = darken(col, 0.25);
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  _crystals(ctx, c, x, y) {
    const col = c.s1;
    for (let i = 0; i < 9; i++) {
      const row = i < 4 ? 0 : i < 7 ? 1 : 2;
      const n = [4, 3, 2][row];
      const col0 = [0, 4, 7][row];
      const cx = x + ((i - col0) - (n - 1) / 2) * 38 + (hash2(i, 1) - 0.5) * 8, cy = y - 22 - row * 34;
      rr(ctx, cx - 18, cy - 15, 36, 30, 7);
      ctx.fillStyle = i % 2 ? col : lighten(col, 0.14);
      ctx.fill();
      ctx.strokeStyle = darken(col, 0.35);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  _marble(ctx, c, x, y) {
    const day = luma(c.bgDeep) > 0.5;
    const col = day ? mix(c.bgDeep, c.stroke, 0.12) : mix(c.label, c.bgSurface, 0.14);
    rr(ctx, x - 62, y - 92, 124, 92, 14);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = darken(col, 0.25);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = mix(col, c.labelMuted, 0.7);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 46, y - 66); ctx.quadraticCurveTo(x - 6, y - 40, x + 44, y - 58); ctx.stroke();
  }

  _life(ctx, c) {
    drawDepthField(ctx, c, { x: 340, y: 150, seed: 15, n: 7 });
    const k = this._mix, p = this._p;
    const { x0, x1, y, h } = NERVE, w = x1 - x0;
    const head = p < 0 ? (this._ran ? 1 : -1) : p;
    const nerve = mix(c.s5, c.bgSurface, 0.3), rim = darken(nerve, 0.32);
    // the cell body with short branches, then the long fibre
    ctx.lineCap = 'round';
    for (const a of [2.5, 3.4, 4.2, 1.7]) {
      ctx.strokeStyle = rim;
      ctx.lineWidth = 22;
      ctx.beginPath(); ctx.moveTo(SOMA.x, SOMA.y); ctx.lineTo(SOMA.x + Math.cos(a) * (SOMA.r + 30), SOMA.y + Math.sin(a) * (SOMA.r + 30)); ctx.stroke();
      ctx.strokeStyle = nerve;
      ctx.lineWidth = 15;
      ctx.stroke();
    }
    rr(ctx, x0 - 30, y - h / 2 + 5, w + 30, h, h / 2); ctx.fillStyle = rim; ctx.fill();
    rr(ctx, x0 - 30, y - h / 2, w + 30, h, h / 2); ctx.fillStyle = nerve; ctx.fill();
    drawBall(ctx, c, SOMA.x, SOMA.y, SOMA.r, nerve, { rimDark: true });
    if (head >= 0 && k > 0.5) {
      const hx = x0 + w * Math.min(1, head);
      ctx.save();
      rr(ctx, x0 - 30, y - h / 2, w + 30, h, h / 2);
      ctx.clip();
      rr(ctx, Math.max(x0 - 30, hx - 96), y - h / 2 + 8, 96, h - 16, (h - 16) / 2);
      ctx.fillStyle = c.warning;
      ctx.fill();
      ctx.restore();
    }
    const N = 8;
    for (let i = 0; i < N; i++) {
      const fx = (i + 0.5) / N, ix = x0 + w * fx;
      const entered = head >= 0 && k > 0.5 && head > fx;
      const u = entered ? clamp01((head - fx) * 8) : 0;
      if (k < 0.05) continue;
      ctx.save();
      ctx.globalAlpha *= k;
      drawIon(ctx, c, ix, y - h / 2 - 30 + u * 60, { sym: 'Na', charge: 1, r: 25 });
      ctx.restore();
    }
    say(ctx, c, 'nerve cell', 96, y + h / 2 + 74, { size: 28 });
    if (!this._on) tag(ctx, c, 'no ions: no signal', 440, y + h / 2 + 46, { bg: c.bad, size: 26 });
    else if (this._ran && p < 0) tag(ctx, c, 'ions carried the signal', 440, y + h / 2 + 46, { bg: c.good, size: 26 });
    this._ors(ctx, c);
  }

  _ors(ctx, c) {
    const g = glassBox('tumbler', 250, 300, 150, 190, { wall: 6 });
    const k = this._mix;
    drawGlass(ctx, c, g);
    const fill = luma(c.bgDeep) < 0.5 ? mix(c.water, c.glass, 0.5) : mix(c.water, c.bgSurface, 0.45);
    const sy = drawGlassLiquid(ctx, c, g, { level: 0.74, fill, opacity: 0.75 });
    if (sy != null && k > 0.03) {
      ctx.save();
      ctx.globalAlpha *= k;
      for (let i = 0; i < 6; i++) {
        drawIon(ctx, c, 278 + (i % 3) * 48 + (i > 2 ? 10 : 0), sy + 36 + (i > 2 ? 62 : 0), { charge: i % 2 ? -1 : 1, r: 17 });
      }
      ctx.restore();
    }
    drawGlassFront(ctx, c, g, { shade: 0.1 });
    say(ctx, c, 'ORS', 160, 392, { size: 40 });
    if (this._on) say(ctx, c, 'water, salt, sugar', 526, 392, { size: 26 });
    else say(ctx, c, 'nothing to replace', 526, 392, { size: 26, col: c.labelMuted });
  }

  _grain(ctx, c) {
    drawDepthField(ctx, c, { x: 430, y: 240, seed: 16, n: 8 });
    const a = this.age, u = popIn(a, 0.1), v = popIn(a, 0.5);
    ctx.save();
    drawIon(ctx, c, 62, 230, { sym: 'Na', charge: 1, r: 44 * Math.max(0.1, u) });
    drawIon(ctx, c, 154, 230, { sym: 'Cl', charge: -1, r: 62 * Math.max(0.1, u) });
    ctx.restore();
    say(ctx, c, 'one pair', 108, 330, { size: 30 });
    if (v > 0) this._cube(ctx, c, 450, 218, 172 * Math.min(1, v));
    if (v > 0) {
      say(ctx, c, 'one grain', 450, 428, { size: 32 });
      tag(ctx, c, 'how are its ions arranged?', 450, 480, { size: 24 });
    }
  }

  /** A grain of salt, close up: a chunky white cube with a chipped corner. */
  _cube(ctx, c, x, y, s) {
    const day = luma(c.bgDeep) > 0.5;
    const top = day ? mix(c.bgDeep, c.stroke, 0.06) : mix(c.label, c.bgSurface, 0.04);
    const left = day ? mix(c.bgDeep, c.stroke, 0.24) : mix(c.label, c.bgSurface, 0.2);
    const right = day ? mix(c.bgDeep, c.stroke, 0.42) : mix(c.label, c.bgSurface, 0.38);
    const dx = s * 0.87, dy = s * 0.5;
    const face = (pts, col) => {
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = darken(right, 0.3);
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.stroke();
    };
    face([[x, y - s], [x + dx, y - s + dy], [x, y - s + dy * 2], [x - dx, y - s + dy]], top);
    face([[x - dx, y - s + dy], [x, y - s + dy * 2], [x, y + s], [x - dx, y + s - dy]], left);
    face([[x + dx, y - s + dy], [x + dx, y + s - dy], [x, y + s], [x, y - s + dy * 2]], right);
  }
}
