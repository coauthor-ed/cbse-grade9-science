// GrainFinaleScene - companion to blk-l13-s9, "One Grain of Salt, Explained". The last scene of the module.
//   b0  grain   tap to go deeper: the grain, its crystal of ions, one Na+, one Cl-
//   b1  answer  salt water and sugar water: close the switch, only the ions carry charge
//   b2  idea    the learner moves the one electron themselves: metal and gas become ions, and the ions a white crystal
//   b3  next    lithium, sodium and potassium each show one outer electron, and the periodic table lights up
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, drawBench, drawCard, drawShadow, mix, lerp, rr, luma, clamp01 } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawAtom, atomLayout, drawIon, drawElectron, drawMolecule, drawFocus, MOLECULES } from 'simulations/base/kit/SimAtom.js';
import { say, tag, formula, popIn } from '../L07/AtomBoard.js';
import { span } from '../L12/MolKit.js';
import { drawGrain, drawPlate, drawBulb, drawWire, drawCell } from '../L01/GrainKit.js';

const S_GRAIN = 0, S_ANSWER = 1, S_IDEA = 2, S_NEXT = 3;
const ZOOM_S = 0.9, LIGHT_S = 1.2, MERGE_S = 2.6;
const BENCH = 472;
const NA = { x: 150, y: 214, r: 128, base: { p: 11, n: 12, shells: [2, 8, 1], radius: 128, nucleusR: 38, er: 9, phase: 2.19, seed: 3 } };
const CL = { x: 524, y: 214, r: 146, base: { p: 17, n: 18, shells: [2, 8, 7], seats: [2, 8, 8], radius: 146, nucleusR: 42, er: 9, phase: -2.52, seed: 4 } };
const FAMILY = [
  { name: 'lithium', cfg: '2, 1', p: 3, n: 4, shells: [2, 1], y: 90 },
  { name: 'sodium', cfg: '2, 8, 1', p: 11, n: 12, shells: [2, 8, 1], y: 256 },
  { name: 'potassium', cfg: '2, 8, 8, 1', p: 19, n: 20, shells: [2, 8, 8, 1], y: 424 },
];
const TX = 304, TY = 128, CELL = 20;
const tableHas = (r, g) => (r === 0 ? g === 0 || g === 17 : r <= 2 ? g <= 1 || g >= 12 : true);

export class GrainFinaleScene extends SimScene {
  static BEAT_STEP_MAP = [S_GRAIN, S_ANSWER, S_IDEA, S_NEXT].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'deeper', label: 'Go deeper' },
    { type: 'button', id: 'top', label: 'Back to the grain' },
    { type: 'button', id: 'switch', label: 'Close the switches' },
    { type: 'button', id: 'move', label: 'Move the electron' },
    { type: 'button', id: 'each', label: 'Show the next atom' },
  ];
  static ARIA_LABEL = 'A grain of salt, then its crystal of sodium and chloride ions, then one sodium ion with 11 protons, 12 neutrons and 10 electrons, '
    + 'then one chloride ion with 17 protons, 18 or 20 neutrons and 18 electrons. Salt water lights a bulb and sugar water does not. The '
    + 'learner moves one electron from a sodium atom to a chlorine atom: the two become ions, the ions pull together, and a white grain of salt '
    + 'appears. Last, lithium, sodium and potassium each show one outer electron, and their column lights up in the periodic table.';

  constructor(container, config) {
    super(container, config);
    this._clear();
  }

  _clear() {
    this._lvl = 0; this._zoomAt = -9;
    this._onAt = null;
    this._ex = null; this._drag = false; this._movedAt = null;
    this._seen = [false, false, false]; this._seenAt = [-9, -9, -9];
    this._done = false;
  }

  enter() { this._clear(); this.requestUiUpdate?.(); }

  busy() {
    if (reducedMotion()) return false;
    if (this.age < 1.2 || this._drag) return true;
    if (this.age - this._zoomAt < ZOOM_S + 0.1) return true;
    if (this._onAt != null && this.age - this._onAt < LIGHT_S + 0.4) return true;
    if (this._movedAt != null && this.age - this._movedAt < MERGE_S + 0.4) return true;
    return this._seenAt.some((a) => this.age - a < 0.7);
  }

  isControlHidden(id) {
    const on = { deeper: S_GRAIN, top: S_GRAIN, switch: S_ANSWER, move: S_IDEA, each: S_NEXT };
    return on[id] !== this.stage;
  }
  isControlDisabled(id) {
    if (id === 'deeper') return this._lvl >= 3 || this.age - this._zoomAt < ZOOM_S;
    if (id === 'top') return this._lvl === 0;
    if (id === 'switch') return this._onAt != null;
    if (id === 'move') return this._movedAt != null;
    return this._seen.every(Boolean);
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'deeper') this._deeper();
    if (id === 'top') { this._lvl = 0; this._zoomAt = this.age - ZOOM_S; }
    if (id === 'switch') this._close();
    if (id === 'move') this._landElectron();
    if (id === 'each') this._show(this._seen.indexOf(false));
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_GRAIN && !this.isControlDisabled('deeper')) this._deeper();
    if (this.stage === S_ANSWER && this._onAt == null) this._close();
    if (this.stage === S_NEXT && p.x < 300) {
      const i = p.y < 172 ? 0 : p.y < 340 ? 1 : 2;
      if (!this._seen[i]) this._show(i);
    }
    if (this.stage === S_IDEA && this._movedAt == null) {
      const q = this._eStart();
      if (Math.hypot(p.x - q.x, p.y - q.y) < 56) { this._drag = true; this._ex = { x: q.x, y: q.y }; this.animateFor?.(); }
    }
    this.requestUiUpdate?.();
  }

  pointerMove(p) {
    if (!this._drag) return false;
    this._ex = { x: Math.max(20, Math.min(660, p.x)), y: Math.max(20, Math.min(500, p.y)) };
    this.animateFor?.();
    return false;
  }

  pointerUp() {
    if (!this._drag) return;
    this._drag = false;
    const s = this._seat();
    if (this._ex && Math.hypot(this._ex.x - s.x, this._ex.y - s.y) < 90) this._landElectron();
    else this._ex = null;
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  _deeper() {
    this._lvl += 1;
    this._zoomAt = this.age;
    if (this._lvl === 3 && !this._done) {
      this._done = true;
      const land = () => this.celebrate(214, 256, 30, { key: 'inside-the-grain', lookAt: 'scene' });
      if (reducedMotion()) land(); else this.after(ZOOM_S, land);
    }
    this.requestUiUpdate?.();
  }

  _close() {
    this._onAt = this.age;
    const land = () => this.celebrate(170, 96, 30, { key: 'only-ions-carry', lookAt: 'scene' });
    if (reducedMotion()) land(); else this.after(LIGHT_S, land);
    this.requestUiUpdate?.();
  }

  _landElectron() {
    this._movedAt = this.age;
    this._ex = null;
    const land = () => this.celebrate(340, 396, 40, { key: 'one-electron', lookAt: 'scene' });
    if (reducedMotion()) land(); else this.after(MERGE_S, land);
    this.requestUiUpdate?.();
  }

  _show(i) {
    if (i < 0) return;
    this._seen[i] = true;
    this._seenAt[i] = this.age;
    if (this._seen.every(Boolean)) {
      const land = () => this.celebrate(TX + CELL / 2, TY + CELL * 3, 26, { key: 'one-family', lookAt: 'scene' });
      if (reducedMotion()) land(); else this.after(0.6, land);
    }
    this.requestUiUpdate?.();
  }

  _eStart() {
    const lay = atomLayout(NA.base), q = lay.shells[2].pts[0];
    return { x: NA.x + q.x, y: NA.y + q.y };
  }

  _seat() {
    const lay = atomLayout(CL.base), q = lay.shells[2].pts[7];
    return { x: CL.x + q.x, y: CL.y + q.y };
  }

  draw(ctx, c) {
    if (this.stage === S_ANSWER) {
      drawBackdrop(ctx, c, 'dots');
      drawFloor(ctx, c, BENCH + 30);
      drawBench(ctx, c, 14, 666, BENCH);
      this._answer(ctx, c);
      return;
    }
    drawDepthField(ctx, c, { x: 340, y: 240, seed: 7, n: 10 });
    if (this.stage === S_GRAIN) this._grain(ctx, c);
    else if (this.stage === S_IDEA) this._idea(ctx, c);
    else this._next(ctx, c);
  }

  // ---- b0: the descent --------------------------------------------------------------

  _level(ctx, c, i) {
    if (i === 0) {
      drawPlate(ctx, c, 340, 372, 250, 52);
      drawShadow(ctx, c, 340, 372, 170, 18);
      drawGrain(ctx, c, 340, 232, 168, { seed: 5 });
    } else if (i === 1) {
      const CW = 96;
      for (let r = 0; r < 4; r++) {
        for (let k = 0; k < 7; k++) {
          const na = (r + k) % 2 === 0;
          drawIon(ctx, c, 340 + (k - 3) * CW, 264 + (r - 1.5) * CW, { sym: na ? 'Na' : 'Cl', charge: na ? 1 : -1, r: na ? 38 : 47 });
        }
      }
    } else {
      const na = i === 2;
      drawAtom(ctx, c, 214, 256, { p: na ? 11 : 17, n: na ? 12 : 18, shells: na ? [2, 8] : [2, 8, 8], radius: 196, nucleusR: 58, er: 10, seed: 5, focusShell: 'outer' });
      drawCard(ctx, c, 430, 38, 236, 436, 1, { accent: na ? c.cation : c.anion });
      formula(ctx, c, na ? 'Na^+' : 'Cl^-', 548, 96, { size: 56 });
      [[na ? '11' : '17', 'protons', c.proton], [na ? '12' : '18 or 20', 'neutrons', c.neutron], [na ? '10' : '18', 'electrons', c.electron]].forEach(([v, l, col], k) => {
        say(ctx, c, v, 548, 176 + k * 100, { size: v.length > 2 ? 40 : 50, col });
        say(ctx, c, l, 548, 222 + k * 100, { size: 26, col: c.labelMuted });
      });
    }
  }

  _grain(ctx, c) {
    const lvl = this._lvl;
    const u = reducedMotion() ? 1 : ease.inOutCubic(clamp01((this.age - this._zoomAt) / ZOOM_S));
    if (u < 1 && lvl > 0) {
      ctx.save();
      ctx.globalAlpha *= 1 - u;
      ctx.translate(340, 250); ctx.scale(1 + u * 3, 1 + u * 3); ctx.translate(-340, -250);
      this._level(ctx, c, lvl - 1);
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha *= u;
    const s = 0.45 + 0.55 * u;
    ctx.translate(340, 250); ctx.scale(s, s); ctx.translate(-340, -250);
    this._level(ctx, c, lvl);
    ctx.restore();
    if (u >= 1) {
      if (lvl === 0) tag(ctx, c, 'tap to go deeper', 340, 34, { bg: c.warning, size: 28 });
      if (lvl === 1) tag(ctx, c, 'a crystal of ions, tap again', 340, 34, { size: 26 });
    }
    for (let i = 0; i < 4; i++) {
      const x = (lvl >= 2 ? 214 : 340) + (i - 1.5) * 32;
      ctx.beginPath(); ctx.arc(x, 498, i === lvl ? 10 : 7, 0, 7);
      ctx.fillStyle = i <= lvl ? c.accent : c.stroke;
      ctx.fill();
    }
  }

  // ---- b1: the two glasses ------------------------------------------------------------

  _beaker(ctx, c, x, salt, k) {
    const dark = luma(c.bgDeep) < 0.5;
    const g = glassBox('beaker', x - 124, 262, 248, BENCH - 262, { wall: 6 });
    drawShadow(ctx, c, x, BENCH, 124, 8);
    drawGlass(ctx, c, g);
    drawGlassLiquid(ctx, c, g, { level: 0.76, fill: mix(c.water, c.bgSurface, dark ? 0.35 : 0.45), opacity: 0.5 });
    const rod = mix(c.waste, c.label, 0.15);
    for (const dx of [-82, 82]) { ctx.fillStyle = rod; rr(ctx, x + dx - 7, 240, 14, 196, 5); ctx.fill(); }
    if (salt) {
      const P = [[-46, 366], [12, 346], [52, 392], [-14, 412], [-52, 420], [44, 436], [16, 380], [-20, 374]];
      P.forEach(([dx, y], i) => {
        const q = i % 2 ? -1 : 1, drift = (q > 0 ? -1 : 1) * k * 16;
        drawIon(ctx, c, x + dx + drift, y, { r: 19, charge: q });
      });
    } else {
      [[-36, 372], [30, 356], [0, 420]].forEach(([dx, y], i) => drawMolecule(ctx, c, x + dx, y, { ...MOLECULES.sugar, r: 34, rot: i * 1.1, labels: false }));
    }
    drawGlassFront(ctx, c, g);
  }

  _answer(ctx, c) {
    const t = this._onAt == null ? 0 : reducedMotion() ? 9 : this.age - this._onAt;
    const on = this._onAt != null ? ease.smooth(span(t, 0.2, LIGHT_S)) : 0;
    [[170, true], [510, false]].forEach(([x, salt]) => {
      const k = salt ? on : 0;
      drawWire(ctx, c, [[x - 82, 244], [x - 82, 196], [x - 40, 196]], k > 0 ? 1 : 0);
      drawWire(ctx, c, [[x + 82, 244], [x + 82, 196], [x + 40, 196]], k > 0 ? 1 : 0);
      drawCell(ctx, c, x, 196, 96, 40);
      drawBulb(ctx, c, x, 92, 64, k);
      this._beaker(ctx, c, x, salt, k);
    });
    tag(ctx, c, 'salt water', 170, 244, { size: 26 });
    tag(ctx, c, 'sugar water', 510, 244, { size: 26 });
    if (this._onAt == null) tag(ctx, c, 'tap: close the switches', 340, 34, { bg: c.warning, size: 26 });
    else if (t >= LIGHT_S) tag(ctx, c, 'ions carry charge', 340, 34, { bg: c.good, size: 28 });
  }

  // ---- b2: one electron ---------------------------------------------------------------

  _idea(ctx, c) {
    const t = this._movedAt == null ? -1 : reducedMotion() ? 9 : this.age - this._movedAt;
    if (t < 0) {
      drawAtom(ctx, c, NA.x, NA.y, { ...NA.base, shells: [2, 8, 0], focusShell: 'outer' });
      drawAtom(ctx, c, CL.x, CL.y, { ...CL.base, focusShell: 'outer' });
      const q = this._ex ?? this._eStart();
      drawFocus(ctx, c, q.x, q.y, 22, 1);
      drawElectron(ctx, c, q.x, q.y, 17);
      tag(ctx, c, 'sodium', NA.x, 382, { size: 28 });
      say(ctx, c, 'soft metal', NA.x, 426, { size: 26, col: c.labelMuted });
      tag(ctx, c, 'chlorine', CL.x, 382, { size: 28 });
      say(ctx, c, 'poisonous gas', CL.x, 426, { size: 26, col: c.labelMuted });
      if (!this._drag) tag(ctx, c, 'drag the electron across', 340, 480, { bg: c.warning, size: 26 });
      return;
    }
    const m = ease.inOutCubic(span(t, 0.5, 1.7));
    const yy = lerp(214, 168, m);
    const xa = lerp(NA.x, 256, m), xb = lerp(CL.x, 436, m);
    const ra = lerp(116, 84, m), rb = lerp(136, 108, m);
    drawIon(ctx, c, xa, yy, { sym: 'Na', charge: 1, r: ra });
    drawIon(ctx, c, xb, yy, { sym: 'Cl', charge: -1, r: rb });
    const g = popIn(t, MERGE_S - 0.6, 0.6);
    if (g > 0) {
      drawGrain(ctx, c, 340, 400, 84 * Math.min(1.05, g), { seed: 5 });
      tag(ctx, c, 'salt', 490, 420, { size: 34, bg: c.good, scale: Math.min(1.05, g) });
    }
  }

  // ---- b3: the next step --------------------------------------------------------------

  _next(ctx, c) {
    const L = lookOf();
    FAMILY.forEach((q, i) => {
      const on = this._seen[i], p = on ? Math.min(1.04, popIn(this.age, this._seenAt[i], 0.35)) : 1;
      const R = 74;
      drawAtom(ctx, c, 88, q.y, { p: q.p, n: q.n, shells: q.shells, radius: R * p, er: 7, nucleusR: 22, focusShell: on ? 'outer' : undefined, solid: true, sym: '', seed: 3 });
      say(ctx, c, q.name, 174, q.y - 22, { align: 'left', size: 26 });
      say(ctx, c, on ? q.cfg : 'tap', 174, q.y + 18, { align: 'left', size: 26, col: on ? c.electron : c.labelMuted });
    });
    const all = this._seen.every(Boolean), glow = all ? popIn(this.age, Math.max(...this._seenAt) + 0.2, 0.5) : 0;
    tag(ctx, c, all ? 'the periodic table' : '?', TX + CELL * 9, 70, { size: 30, bg: all ? c.good : c.raised });
    for (let r = 0; r < 7; r++) {
      for (let g = 0; g < 18; g++) {
        if (!tableHas(r, g)) continue;
        const fam = g === 0 && r >= 1;
        const x = TX + g * CELL, y = TY + r * CELL;
        rr(ctx, x, y, CELL - 3, CELL - 3, 3 * L.radius);
        ctx.fillStyle = fam && all ? mix(c.stroke, c.warning, Math.min(1, glow)) : mix(c.stroke, c.bgSurface, 0.35);
        ctx.fill();
      }
    }
    if (all) {
      const p = Math.min(1.05, popIn(this.age, Math.max(...this._seenAt) + 0.4, 0.4));
      if (p > 0) {
        tag(ctx, c, 'one outer electron', TX + CELL * 9, 318, { size: 28, bg: c.warning, scale: p });
        say(ctx, c, '118 elements', TX + CELL * 9, 372, { size: 28 });
      }
    }
  }
}
