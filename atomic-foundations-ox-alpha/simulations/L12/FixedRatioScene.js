// FixedRatioScene - companion to blk-l12-s4, "Why Water Is Always 1:8".
//   b0  why       one water molecule: 2 blocks of hydrogen mass, 16 of oxygen. Tap to divide by 2: 1:8
//   b1  many      the slider adds molecules to a beaker: the totals grow, the ratio does not move
//   b2  hingula   three lumps of the red rock: heat each one, every lump splits 86:14
//   b3  takeaway  fixed atoms, fixed masses, fixed ratio
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, drawBench, drawCard, drawShadow, mix, darken, lighten, rr, luma, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawMolecule, drawBall, atomTone, MOLECULES } from 'simulations/base/kit/SimAtom.js';
import { say, tag, popIn } from '../L07/AtomBoard.js';
import { massBlocks, span } from './MolKit.js';

const S_WHY = 0, S_MANY = 1, S_HIN = 2, S_TAKE = 3;
const BENCH = 462;
const SPOTS = (() => {                                // where the molecules stand in the beaker: fixed, so the picture is stable
  const rnd = mulberry32(21), out = [];
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out.push({ x: 104 + k * 66 + (r % 2) * 16, y: 396 - r * 62, rot: rnd() * 6.28 });
  return out;
})();
const ROCKS = [120, 340, 560];

export class FixedRatioScene extends SimScene {
  static BEAT_STEP_MAP = [S_WHY, S_MANY, S_HIN, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'halve', label: 'Divide both by 2' },
    { type: 'slider', id: 'n', label: 'Water molecules', min: 1, max: 16, step: 1, value: 1, suffix: '' },
    { type: 'button', id: 'heat', label: 'Heat the next sample' },
  ];
  static ARIA_LABEL = 'One water molecule has 2 hydrogen atoms of mass 1 and one oxygen atom of mass 16, which gives 2 to 16, or 1 to 8. '
    + 'As more molecules are added to a beaker, the masses of hydrogen and oxygen grow together and the ratio stays 1 to 8. Three samples of '
    + 'the red rock hingula each split into 86 percent mercury and 14 percent sulfur by mass. Last, a fixed count of atoms and a fixed mass '
    + 'for each give a fixed ratio.';

  constructor(container, config) {
    super(container, config);
    this._halved = false;
    this._n = 1;
    this._heated = 0;
    this._heatAt = -9;
    this._found = false;
  }

  enter() { this._halved = false; this._n = 1; this._heated = 0; this._heatAt = -9; this._found = false; }

  busy() { return this.age < 1.4 || (this.age - this._heatAt < 2 && !reducedMotion()); }
  isControlHidden(id) { return { halve: S_WHY, n: S_MANY, heat: S_HIN }[id] !== this.stage; }
  isControlDisabled(id) { return (id === 'halve' && this._halved) || (id === 'heat' && (this._heated >= 3 || this.age - this._heatAt < 1.5)); }
  getControlValue(id) { return id === 'n' ? this._n : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'halve') this._halve();
    if (id === 'heat') this._heat();
    if (id === 'n') {
      this._n = Number(v);
      if (this._n >= 8 && !this._found) {
        this._found = true;
        this.celebrate(556, 200, 24, { key: 'ratio-holds', lookAt: 'scene' });
      }
    }
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_WHY && !this._halved) this._halve();
    if (this.stage === S_HIN && !this.isControlDisabled('heat')) this._heat();
  }

  _halve() {
    this._halved = true;
    this.celebrate(340, 430, 30, { key: 'one-to-eight', lookAt: 'scene' });
    this.requestUiUpdate?.();
  }

  _heat() {
    this._heated += 1;
    this._heatAt = this.age;
    if (this._heated === 3) {
      const hit3 = () => this.celebrate(340, 96, 24, { key: 'same-split', lookAt: 'scene' });
      if (reducedMotion()) hit3(); else this.after(1.5, hit3);
    }
    this.requestUiUpdate?.();
  }

  draw(ctx, c) {
    if (this.stage === S_MANY || this.stage === S_HIN) {
      drawBackdrop(ctx, c, 'dots');
      drawFloor(ctx, c, BENCH + 36);
      drawBench(ctx, c, 14, 666, BENCH);
    } else drawDepthField(ctx, c, { x: 340, y: 170, seed: 16, n: 8 });
    if (this.stage === S_WHY) this._why(ctx, c);
    else if (this.stage === S_MANY) this._many(ctx, c);
    else if (this.stage === S_HIN) this._hingula(ctx, c);
    else this._take(ctx, c);
  }

  _why(ctx, c) {
    drawMolecule(ctx, c, 340, 152, { ...MOLECULES.H2O, r: 136 });
    const H = atomTone(c, 'H'), O = atomTone(c, 'O');
    const a = popIn(this.age, 0.3), b = popIn(this.age, 0.6);
    const y0 = 316, s = 21;
    if (a > 0) {
      say(ctx, c, 'H', 30, y0 + 18, { size: 30 });
      massBlocks(ctx, c, 58, y0, this._halved ? 1 : 2, H, { s: this._halved ? s * 2 + 3 : s, h: 36 });
      say(ctx, c, this._halved ? '1' : '2', 134, y0 + 18, { size: 38 });
    }
    if (b > 0) {
      say(ctx, c, 'O', 30, y0 + 66, { size: 30 });
      massBlocks(ctx, c, 58, y0 + 48, this._halved ? 8 : 16, O, { s: this._halved ? s * 2 + 3 : s, h: 36 });
      say(ctx, c, this._halved ? '8' : '16', 618, y0 + 66, { size: 38 });
    }
    const p = popIn(this.age, 1);
    if (p <= 0) return;
    if (this._halved) tag(ctx, c, '1 : 8', 340, 456, { size: 44, bg: c.good, scale: Math.min(1.05, p) });
    else tag(ctx, c, '2 : 16', 340, 456, { size: 44, scale: Math.min(1.05, p) });
  }

  _many(ctx, c) {
    const n = this._n, g = glassBox('beaker', 66, 150, 348, BENCH - 150, { wall: 7 });
    drawGlass(ctx, c, g);
    const dark = luma(c.bgDeep) < 0.5;
    drawGlassLiquid(ctx, c, g, { level: 0.86, fill: mix(c.water, c.bgSurface, dark ? 0.35 : 0.45), opacity: 0.45 });
    for (let i = 0; i < n; i++) drawMolecule(ctx, c, SPOTS[i].x + 4, SPOTS[i].y, { ...MOLECULES.H2O, r: 30, rot: SPOTS[i].rot, labels: false });
    drawGlassFront(ctx, c, g);
    const x = 438, w = 226;
    drawCard(ctx, c, x, 40, w, 340, 1, { accent: c.good });
    say(ctx, c, `${n} molecule${n > 1 ? 's' : ''}`, x + w / 2, 80, { size: 26, col: c.labelMuted });
    say(ctx, c, 'H', x + 26, 138, { align: 'left', size: 30 });
    say(ctx, c, 2 * n, x + w - 24, 138, { align: 'right', size: 42 });
    say(ctx, c, 'O', x + 26, 200, { align: 'left', size: 30 });
    say(ctx, c, 16 * n, x + w - 24, 200, { align: 'right', size: 42 });
    ctx.fillStyle = c.stroke;
    rr(ctx, x + 22, 240, w - 44, 4, 2); ctx.fill();
    say(ctx, c, 'ratio', x + w / 2, 268, { size: 26, col: c.labelMuted });
    say(ctx, c, '1 : 8', x + w / 2, 326, { size: 62, col: c.good });
  }

  _rock(ctx, c, x, y, s) {
    const rnd = mulberry32(x), base = mix(c.s6, c.s8, 0.25), L = lookOf();
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, k = 0.8 + rnd() * 0.3;
      pts.push([x + Math.cos(a) * s * 1.1 * k, y + Math.sin(a) * s * 0.75 * k]);
    }
    const path = () => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); };
    path(); ctx.fillStyle = base; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = darken(base, 0.2);
    ctx.fillRect(x - s * 1.3, y + s * 0.18, s * 2.6, s);
    ctx.fillStyle = lighten(base, 0.22);
    ctx.fillRect(x - s * 0.6, y - s * 0.5, s * 0.8, s * 0.14);
    ctx.restore();
    path(); ctx.strokeStyle = darken(base, 0.4); ctx.lineWidth = 4 * L.rim; ctx.lineJoin = 'round'; ctx.stroke();
  }

  _hingula(ctx, c) {
    const merc = mix(c.glass, c.labelMuted, 0.45), sul = c.s2;
    tag(ctx, c, 'hingula', 340, 36, { size: 30, bg: mix(c.s6, c.s8, 0.25) });
    ROCKS.forEach((x, i) => {
      const lit = i < this._heated, last = i === this._heated - 1;
      const u = !lit ? 0 : last && !reducedMotion() ? ease.inOutCubic(span(this.age - this._heatAt, 0, 1.2)) : 1;
      drawShadow(ctx, c, x, 196, 86, 9);
      if (u < 0.5) this._rock(ctx, c, x, 154, 70 * (1 - u * 0.6));
      if (u >= 0.5) {
        const q = ease.outCubic(span(u, 0.5, 1));
        drawBall(ctx, c, x - 34, 150, 42 * q, merc);
        drawBall(ctx, c, x + 46, 170, 22 * q, sul);
      }
      const bx = x - 94, by = 244, W = 188;
      drawCard(ctx, c, bx - 6, by - 8, W + 12, 148, 1);
      rr(ctx, bx + 4, by, W - 8, 42, 8); ctx.fillStyle = c.track; ctx.fill();
      if (u > 0) {
        const wM = (W - 8) * 0.86 * u, wS = (W - 8) * 0.14 * u;
        rr(ctx, bx + 4, by, wM, 42, 8); ctx.fillStyle = merc; ctx.fill();
        rr(ctx, bx + 4 + wM, by, wS, 42, 6); ctx.fillStyle = sul; ctx.fill();
      }
      if (u >= 1) {
        say(ctx, c, '86%', bx + 44, by + 78, { size: 30 });
        say(ctx, c, '14%', bx + W - 42, by + 78, { size: 30 });
        say(ctx, c, 'mercury', bx + 46, by + 114, { size: 24, col: c.labelMuted });
        say(ctx, c, 'sulfur', bx + W - 42, by + 114, { size: 24, col: c.labelMuted });
      } else say(ctx, c, `sample ${i + 1}`, x, by + 92, { size: 26, col: c.labelMuted });
    });
    if (this._heated < 3) tag(ctx, c, 'tap: heat the next sample', 340, 424, { bg: c.warning, size: 26 });
    else tag(ctx, c, 'the same split each time', 340, 424, { bg: c.good, size: 26 });
  }

  _take(ctx, c) {
    drawMolecule(ctx, c, 340, 132, { ...MOLECULES.H2O, r: 112 });
    const rows = [['2 H + 1 O', 'fixed atoms'], ['1 and 16', 'fixed masses'], ['1 : 8', 'fixed ratio']];
    rows.forEach(([big, small], i) => {
      const p = popIn(this.age, 0.3 + i * 0.3);
      if (p <= 0) return;
      const x = 16 + i * 220, w = 208;
      drawCard(ctx, c, x, 268, w, 170, Math.min(1, p), { accent: i === 2 ? c.good : c.stroke });
      say(ctx, c, big, x + w / 2, 332, { size: i === 2 ? 48 : 36, col: i === 2 ? c.good : c.label });
      say(ctx, c, small, x + w / 2, 396, { size: 26, col: c.labelMuted });
    });
  }
}
