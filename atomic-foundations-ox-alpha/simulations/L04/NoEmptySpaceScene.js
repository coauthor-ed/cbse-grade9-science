// NoEmptySpaceScene - companion to blk-l04-s5, "Why Does Your Hand Stop at a Desk?".
//   b0  guess     a student presses on a desk; the lens shows both are mostly empty. Press harder: it stops.
//   b1  push      two atoms, big. The learner drags one onto the other: the electrons crowd away, the
//                 push rises steeply, the nuclei never come near, and on release the atom springs back.
//   b2  whatif    a see-saw with a spoon and a mountain. The learner takes the empty space out of the
//                 spoon until it balances.
//   b3  takeaway  rows of atoms, hand on desk, with a gap held open by the push between electrons
// Model numbers: a 50 g spoon of 5 cm3 packed at nuclear density is about 10^12 kg, 100 crore tonnes.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, clamp01, darken, drawBackdrop, drawBench, drawFloor, drawShadow, inkOn, lerp, lighten, luma, mix, outBack, rr, vectorArrow } from 'simulations/base/kit/SimLook.js';
import { ease, reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawAtom, drawCharge, drawDepthField, drawElectron, drawFocus, drawNucleus, drawShell, shellPoints } from 'simulations/base/kit/SimAtom.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { tag } from './AtomLabels.js';

const TAU = Math.PI * 2;
const S_GUESS = 0, S_PUSH = 1, S_WHATIF = 2, S_TAKE = 3;
const R = 104, X = 340, BOT_Y = 408, TOP_REST = 116;
const D_MIN = 2 * R - 8;                 // the closest the two centres ever get
const TOP_MAX = BOT_Y - D_MIN;
const LENS = { x: 462, y: 154, r: 130 };
const DESK_Y = 306, HAND = { x: 276, y: DESK_Y - 8 };

const fmtMass = (g) => {
  if (g < 1000) return `${Math.round(g)} g`;
  if (g < 1e6) return `${(g / 1e3).toFixed(g < 1e4 ? 1 : 0)} kg`;
  if (g < 1e11) return `${Math.round(g / 1e6)} tonnes`;
  if (g < 1e13) return `${Math.round(g / 1e11)} lakh tonnes`;
  return `${Math.round(g / 1e13)} crore tonnes`;
};

export class NoEmptySpaceScene extends SimScene {
  static BEAT_STEP_MAP = [S_GUESS, S_PUSH, S_WHATIF, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static DRAGGABLE = true;
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'press', label: 'Press harder' },
    { type: 'slider', id: 'squeeze', label: 'Remove empty space', min: 0, max: 100, step: 1, value: 0, suffix: '%' },
  ];
  static ARIA_LABEL = 'Why a hand stops at a desk. A student presses on a desk, and a lens shows that both are made of mostly empty atoms, yet the hand stops. Then you drag one big atom onto another: their electrons push on each other, the push rises steeply and the nuclei never come near each other. Then you take the empty space out of a spoon, and its mass rises until it balances a mountain on a see-saw. Last, rows of atoms of a hand and a desk are held apart by the push between their electrons.';

  constructor(container, config) {
    super(container, config);
    this._y = TOP_REST;
    this._v = 0;
    this._held = false;
    this._pressT = -1;
    this._sq = 0;
    this._foundPush = false;
    this._foundSpoon = false;
  }

  enter() {
    this._y = TOP_REST;
    this._v = 0;
    this._held = false;
    this._pressT = -1;
    this._sq = 0;
    this._foundPush = false;
    this._foundSpoon = false;
  }

  isControlHidden(id) {
    if (id === 'press') return this.stage !== S_GUESS;
    if (id === 'squeeze') return this.stage !== S_WHATIF;
    return false;
  }

  isControlDisabled(id) { return id === 'press' && this._pressing(); }
  getControlValue(id) { return id === 'squeeze' ? String(this._sq) : super.getControlValue(id); }
  _pressing() { return this._pressT >= 0 && this.age - this._pressT < 1.1; }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'press') { this._pressT = this.age; this.animateFor?.(); }
    if (id === 'squeeze') this._setSq(Number(v));
  }

  _setSq(v) {
    this._sq = Math.max(0, Math.min(100, v));
    if (this._sq >= 100 && !this._foundSpoon) {
      this._foundSpoon = true;
      this.celebrate(112, 300, 30, { key: 'spoon', lookAt: true });
    }
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_PUSH && Math.hypot(p.x - X, p.y - this._y) < R + 40) { this._held = true; this._gy = this._y - p.y; }
    if (this.stage === S_WHATIF) { this._held = true; this._setSq(Math.round((p.x - 60) / 5.6)); }
    this.animateFor?.();
  }

  pointerMove(p) {
    if (!this._held) return false;
    if (this.stage === S_PUSH) {
      this._want = p.y + this._gy;
      this._y = Math.max(TOP_REST, Math.min(TOP_MAX, this._want));
      this._v = 0;
      if (this._pk() > 0.86 && !this._foundPush) {
        this._foundPush = true;
        this.celebrate(X, (this._y + BOT_Y) / 2, 30, { key: 'push', lookAt: true });
      }
      this.animateFor?.();
      return false;
    }
    if (this.stage === S_WHATIF) { this._setSq(Math.round((p.x - 60) / 5.6)); return true; }
    return false;
  }

  pointerUp() { this._held = false; }

  /** The push, 0..1: nothing far off, then steeply harder as the electrons meet. */
  _pk() {
    const d = BOT_Y - this._y;
    return clamp01(((2 * R + 30 - d) / (2 * R + 30 - D_MIN))) ** 2;
  }

  update(d) {
    if (this.stage === S_PUSH && !this._held && this._y > TOP_REST + 0.3) {
      // Let go: the push throws it back and it settles.
      const a = -900 * (this._y - TOP_REST) / 100 - 1400 * this._pk() - 8 * this._v;
      this._v += a * d;
      this._y = Math.max(TOP_REST, this._y + this._v * d);
      if (this._y <= TOP_REST + 0.3) { this._y = TOP_REST; this._v = 0; }
    }
  }

  busy() {
    return this._held || this._pressing() || (this.stage === S_PUSH && this._y > TOP_REST + 0.3) || (this.stage === S_TAKE && this.age < 1.2);
  }

  draw(ctx, c) {
    if (this.stage === S_GUESS) this._guess(ctx, c);
    else if (this.stage === S_PUSH) this._push(ctx, c);
    else if (this.stage === S_WHATIF) this._whatif(ctx, c);
    else this._take(ctx, c);
  }

  // A row of mostly empty atoms.
  _row(ctx, c, x0, y, n, step, r, o = {}) {
    for (let i = 0; i < n; i++) {
      drawAtom(ctx, c, x0 + i * step, y, { shells: [2, 6], p: 8, n: 8, radius: r, nucleusR: Math.max(3, r * 0.1), solid: true, sym: '', er: Math.max(3.2, r * 0.09), phase: o.phase ?? 0.5 * i });
    }
  }

  _guess(ctx, c) {
    const age = this._pressT >= 0 ? this.age - this._pressT : 9;
    const p = !reducedMotion() && age < 1.1 ? Math.sin(Math.PI * clamp01(age / 1.1)) : 0;
    const stopped = this._pressT >= 0;
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, 472);
    drawBench(ctx, c, 214, 660, DESK_Y, { h: 166 });
    const hand = { x: HAND.x, y: HAND.y + p * 2.5 };
    const spec = figureFor(this, { role: 'student', pose: 'push', x: 142, y: 472, height: 322, i: 2, hands: [hand, { x: hand.x - 18, y: hand.y }] });
    drawFigure(ctx, c, spec, spec.look);
    // The lens on the contact.
    ctx.beginPath(); ctx.moveTo(hand.x + 8, hand.y + 3); ctx.lineTo(LENS.x - LENS.r * 0.9, LENS.y - 40); ctx.lineTo(LENS.x - 30, LENS.y + LENS.r); ctx.closePath();
    ctx.fillStyle = alpha(c.gold, 0.2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(LENS.x, LENS.y, LENS.r, 0, TAU); ctx.fillStyle = mix(c.bgSurface, c.bgDeep, 0.35); ctx.fill(); ctx.clip();
    this._row(ctx, c, LENS.x - 78, LENS.y - 54 + p * 3, 3, 78, 36);
    this._row(ctx, c, LENS.x - 117, LENS.y + 33, 4, 78, 36, { phase: 1 });
    ctx.restore();
    ctx.beginPath(); ctx.arc(LENS.x, LENS.y, LENS.r, 0, TAU);
    ctx.strokeStyle = darken(c.s8, 0.25); ctx.lineWidth = 11; ctx.stroke();
    ctx.strokeStyle = c.s8; ctx.lineWidth = 6; ctx.stroke();
    tag(ctx, c, stopped ? 'your hand stops' : 'both mostly empty', 462, 382, { bg: stopped ? c.warning : c.raised });
  }

  // One big atom: the outer electrons crowd to the far side as the push grows. away: -1 away is up.
  _big(ctx, c, x, y, k, away) {
    drawShell(ctx, c, x, y, R * 0.5, { band: 0 });
    drawShell(ctx, c, x, y, R, {});
    drawNucleus(ctx, c, x, y, { p: 8, n: 8, r: 15, solid: false });
    const elec = (ex, ey, r) => {
      drawElectron(ctx, c, ex, ey, r);
      drawCharge(ctx, c, ex, ey, r * 1.05, -1, inkOn(c, c.electron));
    };
    for (const q of shellPoints(R * 0.5, 2, 0.5)) elec(x + q.x, y + q.y, 10);
    const push = k * 0.7;
    for (let i = 0; i < 6; i++) {
      const a0 = 0.26 + (i * TAU) / 6;
      const a = a0 - away * push * Math.cos(a0);
      elec(x + Math.cos(a) * R, y + Math.sin(a) * R, 12);
    }
  }

  _push(ctx, c) {
    const k = this._pk();
    const my = (this._y + BOT_Y) / 2;
    drawDepthField(ctx, c, { x: X, y: 260, seed: 4 });
    this._big(ctx, c, X, this._y, k, 1);
    this._big(ctx, c, X, BOT_Y, k, -1);
    if (k > 0.04) {
      const len = 26 + 74 * k, col = c.warning;
      for (const dx of [-124, 124]) {
        vectorArrow(ctx, c, X + dx, my - 6, { angle: -Math.PI / 2, length: len, col, width: 9, head: 18 });
        vectorArrow(ctx, c, X + dx, my + 6, { angle: Math.PI / 2, length: len, col, width: 9, head: 18 });
      }
      tag(ctx, c, 'electrons push', 112, 36, { bg: c.warning, scale: outBack(clamp01(k * 3)) });
    } else tag(ctx, c, 'drag it down', 566, 40, { bg: c.warning });
    tag(ctx, c, 'nucleus', 590, BOT_Y, { bg: c.proton });
    ctx.strokeStyle = alpha(c.proton, 0.9); ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(536, BOT_Y); ctx.lineTo(X + 20, BOT_Y); ctx.stroke();
    ctx.lineCap = 'butt';
  }

  _spoon(ctx, c, x, y, fill) {
    const steel = mix(c.label, c.bgSurface, luma(c.bgDeep) < 0.5 ? 0.3 : 0.55);
    const body = mix(steel, c.proton, fill);
    rr(ctx, x - 6, y - 14, 86, 11, 5); ctx.fillStyle = darken(body, 0.2); ctx.fill();
    rr(ctx, x - 6, y - 16, 86, 8, 4); ctx.fillStyle = body; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - 30, y - 15, 36, 16, 0, 0, TAU); ctx.fillStyle = darken(body, 0.22); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - 30, y - 18, 34, 13, 0, 0, TAU); ctx.fillStyle = body; ctx.fill();
    if (fill > 0.02) { drawFocus(ctx, c, x - 30, y - 18, 18, fill); }
  }

  _mountain(ctx, c, x, y) {
    const rock = mix(c.waste, c.bgSurface, 0.15);
    ctx.beginPath(); ctx.moveTo(x - 124, y); ctx.lineTo(x - 66, y - 92); ctx.lineTo(x - 34, y - 70); ctx.lineTo(x + 12, y - 158); ctx.lineTo(x + 60, y - 84); ctx.lineTo(x + 124, y); ctx.closePath();
    ctx.fillStyle = rock; ctx.fill();
    ctx.lineJoin = 'round'; ctx.strokeStyle = darken(rock, 0.3); ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 12, y - 158); ctx.lineTo(x + 60, y - 84); ctx.lineTo(x + 124, y); ctx.lineTo(x + 18, y); ctx.lineTo(x + 40, y - 90); ctx.closePath();
    ctx.fillStyle = darken(rock, 0.14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 12, y - 158); ctx.lineTo(x + 34, y - 118); ctx.lineTo(x + 16, y - 124); ctx.lineTo(x + 4, y - 112); ctx.lineTo(x - 12, y - 116); ctx.closePath();
    ctx.fillStyle = lighten(rock, 0.72); ctx.fill();
  }

  _whatif(ctx, c) {
    const e = this._sq / 100;
    const th = 0.2 * (1 - e * e);
    const px = 340, py = 398;
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, 452);
    drawShadow(ctx, c, px, 452, 100, 12);
    ctx.beginPath(); ctx.moveTo(px - 54, 452); ctx.lineTo(px, py); ctx.lineTo(px + 54, 452); ctx.closePath();
    ctx.fillStyle = darken(c.gold, 0.4); ctx.fill();
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(th);
    rr(ctx, -300, -7, 600, 18, 8); ctx.fillStyle = darken(c.gold, 0.45); ctx.fill();
    rr(ctx, -300, -11, 600, 18, 8); ctx.fillStyle = darken(c.gold, 0.22); ctx.fill();
    this._spoon(ctx, c, -232, -11, e);
    this._mountain(ctx, c, 158, -11);
    ctx.restore();
    const g = 50 * 10 ** (e * 13.3);
    tag(ctx, c, `spoon: ${fmtMass(g)}`, 212, 52, { bg: e >= 1 ? c.proton : c.raised, size: 30 });
    if (e >= 1) tag(ctx, c, 'neutron stars are like this', 340, 492, { bg: c.warning });
    else tag(ctx, c, `empty space left: ${100 - this._sq}%`, 340, 492, { bg: c.raised });
  }

  _take(ctx, c) {
    const age = reducedMotion() ? 9 : this.age;
    const u = ease.outCubic(clamp01(age / 0.7));
    const gap = lerp(120, 0, u);
    drawDepthField(ctx, c, { x: 340, y: 240, seed: 9 });
    this._row(ctx, c, 112, 142 - gap, 4, 152, 74);
    this._row(ctx, c, 36, 344, 5, 152, 74, { phase: 1 });
    const v = outBack(clamp01((age - 0.7) / 0.45));
    for (const x of [188, 340, 492]) {
      vectorArrow(ctx, c, x, 238, { angle: -Math.PI / 2, length: 30 * v + 1, col: c.warning, width: 9, head: 16 });
      vectorArrow(ctx, c, x, 248, { angle: Math.PI / 2, length: 30 * v + 1, col: c.warning, width: 9, head: 16 });
    }
    tag(ctx, c, 'hand', 58, 40, { bg: c.raised });
    tag(ctx, c, 'desk', 58, 484, { bg: c.raised });
    if (v > 0) tag(ctx, c, 'electrons push on electrons', 370, 484, { bg: c.warning, scale: v });
  }
}
