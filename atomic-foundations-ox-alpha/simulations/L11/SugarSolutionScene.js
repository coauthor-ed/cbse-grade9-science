// SugarSolutionScene - companion to blk-l11-s5, "Why Sugar Water Stays Dark". This closes the module's
// opening question, so the picture of lesson 1 comes back: two glasses, one bulb lit, one dark.
//   b0  whole     drop a grain of each: salt gives ions, sugar gives whole molecules
//   b1  neutral   sugar water in the bulb test: add more and more sugar, the bulb stays dark
//   b2  melted    melted salt and melted sugar in the same rig: only salt lights the bulb
//   b3  answer    the two rigs of lesson 1, with what is in them: close the switch on both
//   b4  takeaway  what happened to the electrons in each grain, and what that left
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, darken, drawBackdrop, drawBench, drawCard, drawFloor, lerp, mix, mulberry32, rr } from 'simulations/base/kit/SimLook.js';
import { drawIon, drawMolecule, MOLECULES } from 'simulations/base/kit/SimAtom.js';
import { glassBox, drawGlass, drawGlassLiquid } from 'simulations/base/kit/SimGlass.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawBulb, drawBurner, drawGrain, drawRig, popIn, say, tag, snow } from '../L10/IonBenchKit.js';

const S_WHOLE = 0, S_NEUTRAL = 1, S_MELTED = 2, S_ANSWER = 3, S_TAKE = 4;
const BENCH = 450, DROP_S = 1.7, LEVER_S = 0.25, GLOW_S = 0.55, FLOW_S = 6;
const GL = { salt: glassBox('beaker', 30, 118, 300, 322, { wall: 7 }), sugar: glassBox('beaker', 350, 118, 300, 322, { wall: 7 }) };
const MAXSUGAR = 6;

function spots(seed, n, x0, x1, y0, y1, cols) {
  const r = mulberry32(seed), out = [], rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    out.push({ x: lerp(x0, x1, (col + 0.5) / cols) + (row % 2 ? 12 : -12) + (r() - 0.5) * 8, y: lerp(y0, y1, (row + 0.5) / rows) + (r() - 0.5) * 8, rot: r() * 6.28 });
  }
  return out;
}
const SALT_SPOTS = spots(3, 12, 54, 306, 176, 424, 3).map((q, i) => ({ ...q, na: (i + Math.floor(i / 3)) % 2 === 0 }));
const SUGAR_SPOTS = spots(5, 4, 374, 626, 170, 424, 2);
const RIG_SUGAR = spots(9, MAXSUGAR, -92, 92, -114, -24, 3);
const RIG_IONS = spots(4, 10, -98, 98, -116, -22, 5).map((q, i) => ({ ...q, pos: i % 2 === 0 }));

export class SugarSolutionScene extends SimScene {
  static BEAT_STEP_MAP = [S_WHOLE, S_NEUTRAL, S_MELTED, S_ANSWER, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static NOTE_STAGE = 0;
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'drop', label: 'Drop a grain of each' },
    { type: 'slider', id: 'more', label: 'Sugar', min: 1, max: MAXSUGAR, step: 1, value: 2, suffix: '' },
    { type: 'segmented', id: 'melt', label: 'In the rig', value: 'sugar', options: [{ value: 'sugar', label: 'Melted sugar' }, { value: 'salt', label: 'Melted salt' }] },
    { type: 'button', id: 'switch', label: 'Switch' },
  ];
  static ARIA_LABEL = 'Two beakers of water. A grain of salt breaks into sodium and chloride ions, each with its charge. A grain of sugar '
    + 'gives whole neutral molecules. Next, sugar water in the bulb test: however much sugar you add, the bulb stays dark. Next, '
    + 'melted salt lights the bulb and melted sugar does not. Next, the two rigs of lesson 1 stand side by side with their contents '
    + 'shown: close the switch and the salt water lights the bulb while the sugar water stays dark. Last, salt is shown as ions '
    + 'made by an electron moving, and sugar as a molecule whose atoms share electrons.';

  constructor(container, config) {
    super(container, config);
    this._reset();
  }

  _reset() {
    this._dropAt = -99; this._n = 2; this._nAt = -9; this._melt = 'sugar'; this._closed = false; this._lever = 0; this._glow = 0;
    this._flow = 0; this._flowAt = -99; this._found = false; this._foundAt = -9; this._foundB = false;
  }

  noteRows() { return this.stage === S_TAKE ? [] : [{ text: 'particles drawn far bigger than life' }]; }

  enter(stage) {
    this._reset();
    if (stage === S_NEUTRAL) { this._closed = true; this._lever = 1; }
    this.requestUiUpdate?.();
  }

  isControlHidden(id) {
    if (id === 'drop') return this.stage !== S_WHOLE;
    if (id === 'more') return this.stage !== S_NEUTRAL;
    if (id === 'melt') return this.stage !== S_MELTED;
    return this.stage !== S_MELTED && this.stage !== S_ANSWER;
  }
  isControlDisabled(id) { return id === 'drop' && this._dropAt >= 0; }
  getControlValue(id) { return id === 'more' ? this._n : id === 'melt' ? this._melt : undefined; }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'drop') this._drop();
    if (id === 'more') {
      this._n = Math.round(Number(v));
      this._nAt = this.age;
      if (this._n >= MAXSUGAR && !this._found) {
        this._found = true;
        this._foundAt = this.age;
        this.celebrate(340, 100, 26, { key: 'sugar-still-dark', lookAt: 'bulb' });
      }
    }
    if (id === 'melt') { this._melt = v; this._flowAt = this.age; if (this._closed) this._flow = 0; }
    if (id === 'switch') this._toggle();
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  _drop() {
    if (this._dropAt >= 0) return;
    this._dropAt = this.age;
    this.after(DROP_S, () => {
      if (this._found) return;
      this._found = true;
      this._foundAt = this.age;
      this.celebrate(500, 300, 28, { key: 'whole-molecules', lookAt: 'scene' });
    });
  }

  _toggle() {
    this._closed = !this._closed;
    if (this._closed) this._flowAt = this.age;
  }

  _rigLit() {
    if (this.stage === S_ANSWER) return this._closed;
    return this._closed && this.stage === S_MELTED && this._melt === 'salt';
  }

  update(d) {
    const lt = this._closed ? 1 : 0;
    this._lever += Math.sign(lt - this._lever) * Math.min(Math.abs(lt - this._lever), d / LEVER_S);
    const gt = this._rigLit() && this._lever > 0.9 ? 1 : 0;
    this._glow += Math.sign(gt - this._glow) * Math.min(Math.abs(gt - this._glow), d / GLOW_S);
    if (this._rigLit() && this.age - this._flowAt < FLOW_S && !reducedMotion()) this._flow += d;
    if (this.stage === S_MELTED && this._closed && this._lever >= 1 && this._melt === 'sugar' && !this._found) {
      this._found = true; this._foundAt = this.age;
      this.celebrate(340, 92, 26, { key: 'melted-sugar-dark', lookAt: 'bulb' });
    }
    if (this.stage === S_ANSWER && this._glow >= 1 && !this._found) {
      this._found = true; this._foundAt = this.age;
      this.celebrate(180, 110, 30, { key: 'opening-question', lookAt: 'scene' });
    }
  }

  busy() {
    const lt = this._closed ? 1 : 0, gt = this._rigLit() ? 1 : 0;
    if (Math.abs(this._lever - lt) > 1e-3 || Math.abs(this._glow - gt) > 1e-3) return true;
    if (this.age - this._dropAt < DROP_S + 0.4 || this.age - this._nAt < 0.5) return true;
    if (this._rigLit() && this.age - this._flowAt < FLOW_S && !reducedMotion()) return true;
    return this.age < 1.2;
  }

  pointerDown(p) {
    if (this.stage === S_WHOLE) { this._drop(); this.requestUiUpdate?.(); }
    if ((this.stage === S_MELTED || this.stage === S_ANSWER) && p.y < 200) { this._toggle(); this.requestUiUpdate?.(); }
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 52);
    const st = this.stage;
    if (st === S_WHOLE) this._whole(ctx, c);
    if (st === S_NEUTRAL) this._neutral(ctx, c);
    if (st === S_MELTED) this._melted(ctx, c);
    if (st === S_ANSWER) this._answer(ctx, c);
    if (st === S_TAKE) this._take(ctx, c);
  }

  _sugar(ctx, c, x, y, r, rot) { drawMolecule(ctx, c, x, y, { ...MOLECULES.sugar, r, rot, labels: false, profile: 'rich' }); }

  _whole(ctx, c) {
    drawBench(ctx, c, 8, 672, BENCH + 2);
    drawGlass(ctx, c, GL.salt); drawGlass(ctx, c, GL.sugar);
    drawGlassLiquid(ctx, c, GL.salt, { level: 0.84, fill: c.water, opacity: 0.42 });
    drawGlassLiquid(ctx, c, GL.sugar, { level: 0.84, fill: c.water, opacity: 0.42 });
    const t = this._dropAt >= 0 ? this.age - this._dropAt : -1;
    const fall = reducedMotion() ? (t >= 0 ? 1 : 0) : clamp01(t / 0.6);
    const open = reducedMotion() ? (t >= 0 ? 1 : 0) : ease.outCubic(clamp01((t - 0.6) / (DROP_S - 0.6)));
    for (const x of [180, 500]) {
      if (t < 0.6) drawGrain(ctx, c, x, lerp(70, 180, fall * fall), 26, { seed: x, col: snow(c) });
      else if (open < 0.4) drawGrain(ctx, c, x, 190, 26 * (1 - open * 2.2), { seed: x, col: snow(c) });
    }
    if (open > 0) {
      for (const q of SALT_SPOTS) {
        drawIon(ctx, c, lerp(180, q.x, open), lerp(190, q.y, open), { sym: q.na ? 'Na' : 'Cl', charge: q.na ? 1 : -1, r: (q.na ? 26 : 32) * clamp01(open * 2), profile: 'rich' });
      }
      for (const q of SUGAR_SPOTS) this._sugar(ctx, c, lerp(500, q.x, open), lerp(190, q.y, open), 64 * clamp01(open * 2), q.rot);
    }
    const a = this._found ? popIn(this.age - this._foundAt, 0, 0.3) : 0;
    if (a > 0) {
      tag(ctx, c, 'ions: + and \u2212', 180, 74, { bg: c.warning, size: 28, scale: a });
      tag(ctx, c, 'whole molecules', 500, 74, { bg: c.good, size: 28, scale: a });
    } else if (t < 0) {
      tag(ctx, c, 'tap to drop a grain of each', 340, 28, { bg: c.warning, scale: popIn(this.age, 0.4) });
    }
    if (t < 0.5) { say(ctx, c, 'salt', 62, 76, { size: 28 }); say(ctx, c, 'sugar', 618, 76, { size: 28 }); }
  }

  _sugarIn(ctx, c, n, r) {
    for (let i = 0; i < n; i++) {
      const q = RIG_SUGAR[i];
      const k = i === n - 1 ? popIn(this.age - this._nAt, 0, 0.35) : 1;
      this._sugar(ctx, c, q.x, q.y, r * k, q.rot);
    }
  }

  _ionsIn(ctx, c, r, w = 98) {
    const f = this._flow / FLOW_S;
    for (const q of RIG_IONS) {
      const u = (((q.x + 98) / 196 + f * 1.4 * (q.pos ? -1 : 1)) % 1 + 1) % 1;
      drawIon(ctx, c, lerp(-w, w, u), q.y, { charge: q.pos ? 1 : -1, r });
    }
  }

  _neutral(ctx, c) {
    drawBench(ctx, c, 40, 640, BENCH - 8);
    drawRig(ctx, c, 340, BENCH - 8, 0.98, { lever: 1, glow: 0, level: 0.74, signs: true, contents: (cx) => this._sugarIn(cx, c, this._n, 46) });
    tag(ctx, c, 'charge 0', 112, 330, { bg: c.raised });
    tag(ctx, c, this._found ? 'still dark' : 'add more sugar', 566, 92, { bg: this._found ? c.bad : c.warning, scale: this._found ? popIn(this.age - this._foundAt, 0, 0.3) : popIn(this.age, 0.5) });
  }

  _melted(ctx, c) {
    const lift = 92, salt = this._melt === 'salt';
    drawBench(ctx, c, 40, 640, BENCH - 8);
    const y = BENCH - 8;
    drawBurner(ctx, c, 340, y, 1);
    const metal = mix(c.waste, c.label, 0.2);
    ctx.fillStyle = metal; rr(ctx, 228, y - lift - 4, 224, 10, 5); ctx.fill();
    ctx.strokeStyle = darken(metal, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.strokeStyle = metal; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(340 + s * 96, y - lift + 4); ctx.lineTo(340 + s * 112, y - 4); ctx.stroke();
    }
    drawRig(ctx, c, 340, y - lift, 0.84, {
      lever: this._lever, glow: this._glow, level: 0.7, shape: 'tumbler', signs: true,
      fill: salt ? mix(c.flame, c.warning, 0.3) : mix(c.flame, c.s2, 0.35), opacity: salt ? 0.62 : 0.8,
      contents: (cx) => (salt ? this._ionsIn(cx, c, 15, 78) : this._sugarIn(cx, c, 4, 44)),
    });
    tag(ctx, c, salt ? 'melted salt, 801 \u00b0C' : 'melted sugar, 186 \u00b0C', 124, 392, { bg: c.raised, size: 22 });
    if (!this._closed) tag(ctx, c, 'tap the switch', 560, 44, { bg: c.warning, scale: popIn(this.age, 0.5) });
    else if (this._lever >= 1) tag(ctx, c, salt ? 'bulb glows' : 'bulb stays dark', 560, 44, { bg: salt ? c.good : c.bad });
  }

  _answer(ctx, c) {
    const y = 356, s = 0.66;
    drawBench(ctx, c, 8, 672, y, { h: 34 });
    drawRig(ctx, c, 176, y, s, { lever: this._lever, glow: this._glow, level: 0.74, contents: (cx) => this._ionsIn(cx, c, 19) });
    drawRig(ctx, c, 504, y, s, { lever: this._lever, glow: 0, level: 0.74, contents: (cx) => this._sugarIn(cx, c, 3, 56) });
    const a = this._found ? popIn(this.age - this._foundAt, 0, 0.3) : 1;
    tag(ctx, c, 'salt: ions', 176, 424, { bg: c.raised, size: 28 });
    tag(ctx, c, 'sugar: molecules', 504, 424, { bg: c.raised, size: 28 });
    if (this._found) {
      tag(ctx, c, 'glows', 176, 480, { bg: c.warning, size: 28, scale: a });
      tag(ctx, c, 'dark', 504, 480, { bg: c.bad, size: 28, scale: a });
    } else if (!this._closed) tag(ctx, c, 'tap to close both switches', 340, 482, { bg: c.warning, scale: popIn(this.age, 0.5) });
  }

  _take(ctx, c) {
    const L = { x: 18, w: 312 }, R = { x: 350, w: 312 }, y = 24, h = 470;
    const a = popIn(this.age, 0.1), b = popIn(this.age, 0.35);
    drawCard(ctx, c, L.x, y, L.w, h, 1, { accent: c.warning });
    drawCard(ctx, c, R.x, y, R.w, h, 1, { accent: c.stroke });
    const mL = L.x + L.w / 2, mR = R.x + R.w / 2;
    say(ctx, c, 'salt', mL, y + 44, { size: 34 });
    say(ctx, c, 'sugar', mR, y + 44, { size: 34 });
    drawBulb(ctx, c, L.x + 46, y + 48, 22, 1);
    drawBulb(ctx, c, R.x + R.w - 46, y + 48, 22, 0);
    if (a > 0) {
      drawIon(ctx, c, mL - 72, y + 180, { sym: 'Na', charge: 1, r: 54 * a, profile: 'rich' });
      drawIon(ctx, c, mL + 62, y + 180, { sym: 'Cl', charge: -1, r: 68 * a, profile: 'rich' });
    }
    if (b > 0) this._sugar(ctx, c, mR, y + 182, 118 * b, 0.2);
    const k = popIn(this.age, 0.7);
    tag(ctx, c, 'electron moved', mL, y + 318, { bg: c.raised, size: 28, scale: k });
    tag(ctx, c, 'electrons shared', mR, y + 318, { bg: c.raised, size: 28, scale: k });
    const k2 = popIn(this.age, 0.95);
    tag(ctx, c, 'ions', mL, y + 396, { bg: c.good, size: 34, scale: k2 });
    tag(ctx, c, 'no ions', mR, y + 396, { bg: c.bad, size: 34, scale: k2 });
  }
}
