// WholeNumberScene - companion to blk-l02-s6, "Why Whole Atoms Fit the Facts".
// Built on carbon's two oxides, not on any mass ratio.
//   b0  continuous  if matter were smooth: oxygen pours in any amount, each a new compound
//   b1  lumps       slide the oxygen: only 16 g and 32 g give one pure compound; between them, some of each
//   b2  takeaway    the whole numbers are counts of atoms, not grams (CO, NaCl)
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { mix, rr, pill, clamp01, darken, lighten } from 'simulations/base/kit/SimLook.js';
import { drawDepthField, drawMolecule, MOLECULES, drawBall, atomTone } from 'simulations/base/kit/SimAtom.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { reducedMotion, follow } from 'simulations/base/kit/SimAnim.js';
import { bigText, isDay, chipInk } from '../L01/GrainKit.js';

const S_SMOOTH = 0, S_LUMPS = 1, S_TAKE = 2;
const CO = { atoms: [{ sym: 'C', x: -1.2, y: 0 }, { sym: 'O', x: 1.2, y: 0 }], bonds: [[0, 1, 2]] };
const NACL = { atoms: [{ sym: 'Na', x: -1.5, y: 0 }, { sym: 'Cl', x: 1.5, y: 0 }], bonds: [] };

export class WholeNumberScene extends SimScene {
  static BEAT_STEP_MAP = [S_SMOOTH, S_LUMPS, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'slider', id: 'oxygen', label: 'Oxygen (g)', min: 0, max: 40, step: 2, value: 12, suffix: ' g' },
    { type: 'segmented', id: 'view', label: 'Compound', value: 'co', options: [{ value: 'co', label: 'Carbon monoxide' }, { value: 'nacl', label: 'Salt' }] },
  ];
  static ARIA_LABEL = 'With 12 grams of carbon, oxygen is added. If matter were smooth, every amount would give a new compound. In fact only 16 grams and 32 grams give '
    + 'one pure compound: carbon monoxide with one oxygen atom, carbon dioxide with two. In between you get some of each. Last, carbon monoxide and salt show that the whole numbers count atoms, not grams.';

  constructor(container, config) {
    super(container, config);
    this._o = 12;
    this._os = 12;
    this._hit = {};
    this._view = 'co';
    this._found = false;
    this._drag = false;
  }

  enter(stage) {
    this._o = stage === S_LUMPS ? 8 : 12; this._os = this._o; this._hit = {}; this._view = 'co'; this._found = false;
    this.requestUiUpdate?.();
  }

  isControlHidden(id) { return id === 'oxygen' ? this.stage === S_TAKE : this.stage !== S_TAKE; }
  getControlValue(id) { return id === 'oxygen' ? this._o : this._view; }
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'view') { this._view = v; this.requestUiUpdate?.(); return; }
    this._o = Number(v);
    if (reducedMotion()) this._os = this._o;
    if (this.stage === S_LUMPS && (this._o === 16 || this._o === 32)) {
      this._hit[this._o] = true;
      if (this._hit[16] && this._hit[32] && !this._found) {
        this._found = true;
        this.after(0.5, () => this.celebrate(340, 250, 26, { key: 'jump-of-16' }));
      }
    }
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_TAKE) { this.onControlChange('view', this._view === 'co' ? 'nacl' : 'co'); return; }
    this._drag = true; this.pointerMove(p);
  }

  pointerMove(p) {
    if (!this._drag || this.stage === S_TAKE) return false;
    const v = Math.round(clamp01((p.x - 70) / 540) * 20) * 2;
    if (v !== this._o) this.onControlChange('oxygen', v);
    return true;
  }

  pointerUp() { this._drag = false; }

  update(d) {
    this._os = follow(this._os, this._o, d, 0.08);
    if (Math.abs(this._os - this._o) < 0.03) this._os = this._o;
  }

  busy() { return this._os !== this._o; }

  draw(ctx, c, t) {
    drawDepthField(ctx, c, { x: 340, y: 230, seed: 11, t });
    if (this.stage === S_SMOOTH) this._smooth(ctx, c);
    else if (this.stage === S_LUMPS) this._lumps(ctx, c);
    else this._counts(ctx, c);
  }

  _track(ctx, c, ticks) {
    const y = 448, x0 = 70, x1 = 610;
    rr(ctx, x0, y - 9, x1 - x0, 18, 9); ctx.fillStyle = isDay(c) ? mix(c.s5, c.bgSurface, 0.7) : mix(c.s5, c.raised, 0.6); ctx.fill();
    for (const v of ticks) {
      const x = x0 + (v / 40) * (x1 - x0);
      rr(ctx, x - 5, y - 18, 10, 36, 5); ctx.fillStyle = this._hit[v] ? c.good : c.gold; ctx.fill();
      bigText(ctx, c, `${v} g`, x, y + 42, 24, c.label);
    }
    const hx = x0 + (this._os / 40) * (x1 - x0);
    drawBall(ctx, c, hx, y, 21, c.s6);
  }

  _smooth(ctx, c) {
    // a block of carbon beside a tall jar of smooth oxygen that fills to any level
    drawBall(ctx, c, 190, 248, 104, atomTone(c, 'C'));
    bigText(ctx, c, '12 g', 190, 248, 44, isDay(c) ? c.bgSurface : c.label);
    bigText(ctx, c, 'carbon', 190, 388, 30, c.label);
    const g = glassBox('cylinder', 420, 94, 160, 320, { wall: 6 });
    drawGlass(ctx, c, g);
    drawGlassLiquid(ctx, c, g, { level: clamp01(this._os / 44) + 0.02, fill: c.s6, opacity: 0.74 });
    drawGlassFront(ctx, c, g, { shade: 0.1 });
    bigText(ctx, c, `${Math.round(this._o)} g oxygen?`, 500, 56, 32, c.label);
    bigText(ctx, c, '+', 320, 248, 54, c.label);
    this._track(ctx, c, []);
  }

  _lumps(ctx, c) {
    const o = Math.round(this._o);
    bigText(ctx, c, `12 g carbon + ${o} g oxygen`, 340, 52, 32, c.label);
    if (o === 16) { drawMolecule(ctx, c, 340, 228, { ...CO, r: 136 }); pill(ctx, c, 'carbon monoxide', 340, 372, { bg: c.good, ink: chipInk(c), size: 28, display: true }); }
    else if (o === 32) { drawMolecule(ctx, c, 340, 228, { ...MOLECULES.CO2, r: 190 }); pill(ctx, c, 'carbon dioxide', 340, 372, { bg: c.good, ink: chipInk(c), size: 28, display: true }); }
    else if (o < 16) {
      drawMolecule(ctx, c, 240, 228, { ...CO, r: 96 });
      drawBall(ctx, c, 480, 228, 76, atomTone(c, 'C'));
      bigText(ctx, c, 'C', 480, 228, 44, isDay(c) ? c.bgSurface : c.label);
      pill(ctx, c, 'carbon left over', 340, 372, { bg: c.raised, ink: c.label, size: 26, display: true });
    } else if (o < 32) {
      drawMolecule(ctx, c, 196, 228, { ...CO, r: 92 });
      drawMolecule(ctx, c, 470, 228, { ...MOLECULES.CO2, r: 142 });
      pill(ctx, c, 'some of each, no new compound', 340, 372, { bg: c.raised, ink: c.label, size: 25, display: true });
    } else {
      drawMolecule(ctx, c, 270, 228, { ...MOLECULES.CO2, r: 170 });
      drawBall(ctx, c, 560, 228, 62, atomTone(c, 'O'));
      bigText(ctx, c, 'O', 560, 228, 40, c.bgDeep);
      pill(ctx, c, 'oxygen left over', 340, 372, { bg: c.raised, ink: c.label, size: 26, display: true });
    }
    this._track(ctx, c, [16, 32]);
  }

  _counts(ctx, c) {
    const co = this._view === 'co';
    drawMolecule(ctx, c, 340, 176, { ...(co ? CO : NACL), r: 118 });
    bigText(ctx, c, co ? 'carbon monoxide' : 'salt', 340, 44, 34, c.label);
    this._row(ctx, c, 'atoms', '1 : 1', 324, c.good, true);
    this._row(ctx, c, 'grams', co ? '3 : 4' : '23 : 35.5', 416, c.raised, false);
  }

  _row(ctx, c, label, value, y, bg, on) {
    const x = 90, w = 500, h = 76;
    rr(ctx, x, y - h / 2 + 5, w, h, 16); ctx.fillStyle = darken(bg, 0.26); ctx.fill();
    rr(ctx, x, y - h / 2, w, h, 16); ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = lighten(bg, 0.2); ctx.lineWidth = 2.5; ctx.stroke();
    const ink = on ? chipInk(c) : c.label;
    bigText(ctx, c, label, x + 106, y, 32, ink);
    bigText(ctx, c, value, x + 340, y, 44, ink);
  }
}
