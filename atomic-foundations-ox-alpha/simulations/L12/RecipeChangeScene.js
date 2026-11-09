// RecipeChangeScene - companion to blk-l12-s6, "A Different Compound" (observe of the hydrogen peroxide predict).
//   b0  atom      a water molecule. The learner adds one oxygen atom: H2O2, and 1:8 becomes 1:16
//   b1  new       water and hydrogen peroxide side by side: a drop on a cut. Only one fizzes
//   b2  whatif    the book's What if: a slider of ratios. In the imagined world any value, in ours only two
//   b3  takeaway  the two laws from one picture
// Boiling points in b2 are invented on purpose, for a world that does not exist; the scene says so.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, drawBench, drawCard, drawShadow, mix, lerp, luma, clamp01 } from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { reducedMotion, ease, hash2 } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawMolecule, drawBond, MOLECULES } from 'simulations/base/kit/SimAtom.js';
import { say, tag, formula, popIn } from '../L07/AtomBoard.js';
import { atomBall, H2O2, span } from './MolKit.js';

const S_ATOM = 0, S_NEW = 1, S_WHAT = 2, S_TAKE = 3;
const BENCH = 462, FLY_S = 1.2, FIZZ_S = 3.4;

export class RecipeChangeScene extends SimScene {
  static BEAT_STEP_MAP = [S_ATOM, S_NEW, S_WHAT, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'add', label: 'Add one oxygen atom' },
    { type: 'button', id: 'test', label: 'Put a drop on a cut' },
    { type: 'segmented', id: 'world', label: 'World', options: [{ value: 'imagine', label: 'Imagined' }, { value: 'real', label: 'Real' }], value: 'imagine' },
    { type: 'slider', id: 'o', label: 'Oxygen for 1 g of hydrogen', min: 5, max: 20, step: 1, value: 8, suffix: ' g' },
  ];
  static ARIA_LABEL = 'A water molecule has a mass ratio of 1 to 8. When one oxygen atom is added it becomes hydrogen peroxide, H2O2, '
    + 'with a ratio of 1 to 16. A drop of each on a cut: water does nothing and hydrogen peroxide fizzes, giving off oxygen. Then a slider '
    + 'tries other ratios. In an imagined world every ratio gives a different liquid with a different boiling point. In the real world only '
    + 'two stops exist, water and hydrogen peroxide. Last, the two laws: same atoms give the same mass, and fixed atoms give a fixed ratio.';

  constructor(container, config) {
    super(container, config);
    this._addAt = null;
    this._testAt = null;
    this._world = 'imagine';
    this._o = 8;
    
  }

  enter() { this._addAt = null; this._testAt = null; this._world = 'imagine'; this._o = 8;  }

  busy() {
    if (reducedMotion()) return false;
    if (this.age < 1.2) return true;
    if (this.stage === S_ATOM && this._addAt != null) return this.age - this._addAt < FLY_S + 0.2;
    if (this.stage === S_NEW && this._testAt != null) return this.age - this._testAt < FIZZ_S + 0.2;
    return false;
  }

  isControlHidden(id) {
    if (id === 'add') return this.stage !== S_ATOM;
    if (id === 'test') return this.stage !== S_NEW;
    return this.stage !== S_WHAT;
  }
  isControlDisabled(id) { return (id === 'add' && this._addAt != null) || (id === 'test' && this._testAt != null); }
  getControlValue(id) { return id === 'world' ? this._world : id === 'o' ? this._o : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'add') this._add();
    if (id === 'test') this._test();
    if (id === 'world') { this._world = v; if (v === 'real') this._o = this._o > 12 ? 16 : 8; }
    if (id === 'o') {
      const n = Number(v);
      this._o = this._world === 'real' ? (n > 12 ? 16 : 8) : n;
    }
    this.requestUiUpdate?.();
  }

  pointerDown() {
    if (this.stage === S_ATOM && this._addAt == null) this._add();
    if (this.stage === S_NEW && this._testAt == null) this._test();
  }

  _add() {
    this._addAt = this.age;
    const land = () => this.celebrate(340, 190, 40, { key: 'one-more-atom', lookAt: 'scene' });
    if (reducedMotion()) land(); else this.after(FLY_S, land);
    this.requestUiUpdate?.();
  }

  _test() {
    this._testAt = this.age;
    const land = () => this.celebrate(494, 200, 24, { key: 'different-substance', lookAt: 'scene' });
    if (reducedMotion()) land(); else this.after(1.2, land);
    this.requestUiUpdate?.();
  }

  draw(ctx, c) {
    if (this.stage === S_NEW || this.stage === S_WHAT) {
      drawBackdrop(ctx, c, 'dots');
      drawFloor(ctx, c, BENCH + 36);
      drawBench(ctx, c, 14, 666, BENCH);
    } else drawDepthField(ctx, c, { x: 340, y: 200, seed: 14, n: 8 });
    if (this.stage === S_ATOM) this._atom(ctx, c);
    else if (this.stage === S_NEW) this._new(ctx, c);
    else if (this.stage === S_WHAT) this._what(ctx, c);
    else this._take(ctx, c);
  }

  // The one molecule that gains an atom. Positions are stage px: water first, peroxide after.
  _atom(ctx, c) {
    const t = this._addAt == null ? 0 : reducedMotion() ? 1 : clamp01((this.age - this._addAt) / FLY_S);
    const u = ease.inOutCubic(t);
    const HR = 40, OR = 60;
    const P = {
      o1: { x: lerp(340, 274, u), y: lerp(150, 190, u) },
      o2: { x: lerp(620, 416, u), y: lerp(70, 190, u) },
      h1: { x: lerp(230, 176, u), y: lerp(250, 264, u) },
      h2: { x: lerp(450, 514, u), y: lerp(250, 116, u) },
    };
    // Water bonds both H to one O. The second H crosses to the new O as the atom joins: H-O-O-H.
    drawBond(ctx, c, P.o1.x, P.o1.y, P.h1.x, P.h1.y, { w: 16 });
    const swap = span(u, 0.55, 1);
    if (swap < 1) {
      ctx.save(); ctx.globalAlpha *= 1 - swap;
      drawBond(ctx, c, P.o1.x, P.o1.y, P.h2.x, P.h2.y, { w: 16 });
      ctx.restore();
    }
    if (swap > 0) {
      ctx.save(); ctx.globalAlpha *= swap;
      drawBond(ctx, c, P.o1.x, P.o1.y, P.o2.x, P.o2.y, { w: 16 });
      drawBond(ctx, c, P.o2.x, P.o2.y, P.h2.x, P.h2.y, { w: 16 });
      ctx.restore();
    }
    atomBall(ctx, c, 'H', P.h1.x, P.h1.y, HR);
    atomBall(ctx, c, 'H', P.h2.x, P.h2.y, HR);
    atomBall(ctx, c, 'O', P.o1.x, P.o1.y, OR);
    atomBall(ctx, c, 'O', P.o2.x, P.o2.y, OR, { focus: this._addAt == null ? 1 : 0 });
    const done = u >= 1;
    const x = 30, y = 340, w = 620;
    drawCard(ctx, c, x, y, w, 150, 1, { accent: done ? c.good : c.stroke });
    formula(ctx, c, done ? 'H_2O_2' : 'H_2O', x + 110, y + 75, { size: 56 });
    say(ctx, c, `2 : ${done ? 32 : 16}`, x + 330, y + 75, { size: 48 });
    say(ctx, c, '=', x + 436, y + 75, { size: 42, col: c.labelMuted });
    say(ctx, c, `1 : ${done ? 16 : 8}`, x + 530, y + 75, { size: 52, col: done ? c.good : c.label });
    if (this._addAt == null) tag(ctx, c, 'tap: add one oxygen atom', 200, 44, { bg: c.warning, size: 26 });
  }

  _tube(ctx, c, x, fizz, t) {
    const g = glassBox('tube', x - 58, 196, 116, BENCH - 196 - 14, { wall: 6 });
    const dark = luma(c.bgDeep) < 0.5;
    drawGlass(ctx, c, g);
    const sy = drawGlassLiquid(ctx, c, g, { level: 0.7, fill: mix(c.water, c.bgSurface, dark ? 0.35 : 0.45), opacity: 0.5 });
    if (fizz) {
      for (let i = 0; i < 42; i++) {
        const ti = i * 0.07;
        if (t < ti) continue;
        const age = t - ti, y = g.floor - 8 - age * (70 + 50 * hash2(i, 2));
        if (y < sy + 3 || age > 3) continue;
        ctx.beginPath(); ctx.arc(x + (hash2(i, 3) - 0.5) * 72, y, 3 + 4 * hash2(i, 4), 0, 7);
        ctx.fillStyle = mix(c.bgSurface, c.label, dark ? 0.85 : 0.08); ctx.fill();
      }
    }
    drawGlassFront(ctx, c, g);
    return sy;
  }

  _new(ctx, c) {
    const t = this._testAt == null ? 0 : reducedMotion() ? 3 : this.age - this._testAt;
    drawMolecule(ctx, c, 186, 96, { ...MOLECULES.H2O, r: 88 });
    drawMolecule(ctx, c, 494, 92, { ...H2O2, r: 112 });
    drawShadow(ctx, c, 186, BENCH, 70, 7);
    drawShadow(ctx, c, 494, BENCH, 70, 7);
    this._tube(ctx, c, 186, false, t);
    this._tube(ctx, c, 494, this._testAt != null && t > 0.4, t);
    const a = this._testAt != null ? popIn(t, 1.2) : 0;
    tag(ctx, c, 'water', 186, 204);
    tag(ctx, c, 'hydrogen peroxide', 494, 204);
    if (this._testAt == null) tag(ctx, c, 'tap: put a drop on a cut', 340, 278, { bg: c.warning, size: 25 });
    if (a > 0) {
      tag(ctx, c, 'nothing', 186, 280, { size: 26, scale: Math.min(1.05, a) });
      tag(ctx, c, 'fizz: oxygen', 494, 280, { size: 26, bg: c.good, scale: Math.min(1.05, a) });
    }
  }

  _what(ctx, c) {
    const real = this._world === 'real', o = this._o;
    const k = (o - 5) / 15;
    const dark = luma(c.bgDeep) < 0.5;
    const tone = real ? mix(c.water, c.bgSurface, dark ? 0.35 : 0.45) : mix(mix(c.s5, c.s3, k), c.bgSurface, 0.25);
    const g = glassBox('tumbler', 76, 150, 250, BENCH - 150, { taper: 0.16 });
    drawShadow(ctx, c, 200, BENCH, 112, 9);
    drawGlass(ctx, c, g);
    drawGlassLiquid(ctx, c, g, { level: 0.72, fill: tone, opacity: 0.72 });
    drawGlassFront(ctx, c, g);
    tag(ctx, c, real ? 'the real world' : 'an imagined world', 340, 40, { size: 28, bg: real ? c.good : c.warning });
    const x = 356, w = 300;
    drawCard(ctx, c, x, 92, w, 340, 1, { accent: real ? c.good : c.warning });
    say(ctx, c, 'hydrogen : oxygen', x + w / 2, 134, { size: 26, col: c.labelMuted });
    say(ctx, c, `1 : ${o}`, x + w / 2, 200, { size: 66 });
    if (real) {
      if (o === 8) { formula(ctx, c, 'H_2O', x + w / 2, 288, { size: 48 }); say(ctx, c, 'water', x + w / 2, 350, { size: 34 }); }
      else { formula(ctx, c, 'H_2O_2', x + w / 2, 288, { size: 48 }); say(ctx, c, 'hydrogen peroxide', x + w / 2, 350, { size: 30 }); }
      say(ctx, c, 'nothing in between', x + w / 2, 400, { size: 24, col: c.labelMuted });
    } else {
      say(ctx, c, 'boils at', x + w / 2, 276, { size: 26, col: c.labelMuted });
      say(ctx, c, `${100 + (o - 8) * 9} \u00b0C`, x + w / 2, 326, { size: 52, col: c.s2ink });
      say(ctx, c, 'water? which one?', x + w / 2, 392, { size: 26 });
    }
  }

  _take(ctx, c) {
    const panel = (x, big, small, delay, tone) => {
      const p = popIn(this.age, delay);
      if (p <= 0) return;
      const w = 316;
      drawCard(ctx, c, x, 34, w, 452, Math.min(1, p), { accent: tone });
      say(ctx, c, big, x + w / 2, 322, { size: 40, col: c.label });
      say(ctx, c, small, x + w / 2, 386, { size: 40, col: tone });
    };
    panel(16, 'same atoms', 'same mass', 0.2, c.good);
    panel(348, 'fixed atoms', 'fixed ratio', 0.5, c.good);
    const a = popIn(this.age, 0.4), b = popIn(this.age, 0.7);
    if (a > 0) {
      drawMolecule(ctx, c, 174, 100, { ...MOLECULES.H2, r: 56, labels: false });
      drawMolecule(ctx, c, 94, 190, { ...MOLECULES.O2, r: 54, labels: false });
      say(ctx, c, '\u2192', 174, 190, { size: 44, col: c.labelMuted });
      drawMolecule(ctx, c, 254, 190, { ...MOLECULES.H2O, r: 60, labels: false });
    }
    if (b > 0) {
      drawMolecule(ctx, c, 506, 150, { ...MOLECULES.H2O, r: 104 });
    }
  }
}
