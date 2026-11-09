// CovalentHandshakeScene - companion to blk-l11-s1, "The Other Kind of Bond".
//   b0  problem   try moving the electron from one hydrogen atom to the other: it takes too much energy
//   b1  share     drag the two atoms together: each shares its electron and both K-shells hold 2
//   b2  pair      pull one atom away and let go: the pair stays between the nuclei and attracts both
//   b3  takeaway  the molecule, drawn as atoms, as H-H and as H2
// The pair never circles either atom: it sits between the two nuclei, as the book says.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, drawCard, drawMeter, inkOn, lerp } from 'simulations/base/kit/SimLook.js';
import { drawDepthField, drawElectron, drawNucleus, drawSeat, drawSharedPair, drawShell, drawFocus } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { formula, popIn, say, tag } from '../L10/IonBenchKit.js';

const S_PROBLEM = 0, S_SHARE = 1, S_PAIR = 2, S_TAKE = 3;
const CX = 340, CY = 248, R = 118, NR = 34, ER = 13;
const D_FAR = 186, D_BOND = 90;                     // half the distance between the nuclei
const MOVE_S = 0.8, HOLD_S = 1.5;

export class CovalentHandshakeScene extends SimScene {
  static BEAT_STEP_MAP = [S_PROBLEM, S_SHARE, S_PAIR, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'move', label: 'Move the electron' },
    { type: 'button', id: 'join', label: 'Bring them together' },
  ];
  static ARIA_LABEL = 'Two hydrogen atoms, each with one electron. If you try to move one electron to the other atom, the energy needed '
    + 'is far too high and it goes back. Next you bring the atoms together: each shares its electron and both K-shells hold two. '
    + 'Next you pull one atom away and let go: the shared pair stays between the two nuclei, attracts both and pulls them back. '
    + 'Last, the molecule is shown as atoms, as H-H and as H2.';

  constructor(container, config) {
    super(container, config);
    this._try = -1; this._foundA = false;
    this._d = D_FAR; this._joined = false; this._join = 0; this._drag = null; this._vel = 0; this._foundB = false; this._foundC = false; this._doneAt = -9; this._stretched = false;
  }

  enter(stage) {
    this._try = -1; this._foundA = false;
    this._joined = stage >= S_PAIR; this._join = this._joined ? 1 : 0;
    this._d = this._joined ? D_BOND : D_FAR;
    this._drag = null; this._vel = 0; this._foundB = false; this._foundC = false; this._doneAt = -9; this._stretched = false;
    this.requestUiUpdate?.();
  }

  isControlHidden(id) { return id === 'move' ? this.stage !== S_PROBLEM : this.stage !== S_SHARE; }
  isControlDisabled(id) { return id === 'move' ? this._try >= 0 : this._joined; }
  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'move') this._start();
    if (id === 'join') this._snap();
    this.requestUiUpdate?.();
  }

  _start() {
    if (this._try >= 0) return;
    this._try = this.age;
    this.animateFor?.();
    this.after(MOVE_S * 2 + HOLD_S, () => {
      this._try = -1;
      if (!this._foundA) {
        this._foundA = true;
        this._doneAt = this.age;
        this.celebrate(CX, CY, 12, { key: 'no-move', small: true, lookAt: 'scene' });
      }
      this.requestUiUpdate?.();
    });
  }

  _snap() {
    if (this._joined) return;
    this._joined = true;
    this._doneAt = this.age;
    this.after(MOVE_S, () => this.celebrate(CX, CY, 28, { key: 'shared-pair', lookAt: 'scene' }));
    this.animateFor?.();
  }

  update(d) {
    if (this.stage === S_SHARE) {
      if (this._joined) {
        this._d += (D_BOND - this._d) * Math.min(1, d * 6);
        this._join = Math.min(1, this._join + d / MOVE_S);
      }
    }
    if (this.stage === S_PAIR && !this._drag && this._vel !== null && this._d !== D_BOND) {
      this._vel += (-46 * (this._d - D_BOND) - 7 * this._vel) * d;
      this._d += this._vel * d;
      if (Math.abs(this._d - D_BOND) < 0.4 && Math.abs(this._vel) < 4) {
        this._d = D_BOND; this._vel = 0;
        if (!this._foundC && this._stretched) {
          this._foundC = true;
          this._doneAt = this.age;
          this.celebrate(CX, CY, 28, { key: 'pair-holds-both', lookAt: 'scene' });
        }
      }
    }
  }

  busy() {
    if (this._try >= 0 || this._drag) return true;
    if (this.stage === S_SHARE && this._joined && (this._join < 1 || Math.abs(this._d - D_BOND) > 0.5)) return true;
    if (this.stage === S_PAIR && this._d !== D_BOND) return true;
    return this.age < 0.9;
  }

  pointerDown(p) {
    if (this.stage === S_PROBLEM) { if (Math.hypot(p.x - (CX - D_FAR + R), p.y - CY) < 60 || Math.hypot(p.x - (CX - D_FAR), p.y - CY) < R) this._start(); this.requestUiUpdate?.(); return; }
    if ((this.stage === S_SHARE && !this._joined) || this.stage === S_PAIR) {
      this._drag = { x0: p.x, d0: this._d, side: p.x < CX ? -1 : 1 };
      this._vel = 0;
    }
  }
  pointerMove(p) {
    const g = this._drag;
    if (!g) return false;
    const want = g.d0 + (p.x - g.x0) * g.side;
    if (this.stage === S_SHARE) {
      this._d = Math.max(D_BOND + 6, Math.min(D_FAR, want));
      if (this._d < 118) { this._drag = null; this._snap(); return true; }
    } else {
      this._d = Math.max(D_BOND, Math.min(176, want));
      if (this._d > 118) this._stretched = true;
    }
    this.animateFor?.();
    return false;
  }
  pointerUp() { this._drag = null; this.animateFor?.(); }

  _atom(ctx, c, x, o = {}) {
    drawShell(ctx, c, x, CY, R, { active: o.active, fill: 0.08 });
    drawNucleus(ctx, c, x, CY, { p: 1, n: 0, r: NR, solid: true, label: '', profile: 'rich' });
    say(ctx, c, 'H', x, CY + 1, { size: 34, col: inkOn(c, c.proton) });
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: CX, y: CY, seed: 11, n: 12 });
    if (this.stage === S_PROBLEM) this._problem(ctx, c);
    if (this.stage === S_SHARE) this._share(ctx, c);
    if (this.stage === S_PAIR) this._pair(ctx, c);
    if (this.stage === S_TAKE) this._take(ctx, c);
  }

  _problem(ctx, c) {
    const xL = CX - D_FAR, xR = CX + D_FAR;
    this._atom(ctx, c, xL); this._atom(ctx, c, xR);
    const t = this._try >= 0 ? this.age - this._try : -1;
    let u = 0;
    if (t >= 0) u = t < MOVE_S ? ease.inOutCubic(t / MOVE_S) : t < MOVE_S + HOLD_S ? 1 : 1 - ease.inOutCubic((t - MOVE_S - HOLD_S) / MOVE_S);
    if (reducedMotion() && t >= 0) u = 1;
    const a0 = { x: xL + R, y: CY }, b0 = { x: xR - R * 0.6, y: CY - R * 0.8 };
    const ex = lerp(a0.x, b0.x, u), ey = lerp(a0.y, b0.y, u) - Math.sin(u * Math.PI) * 80;
    drawSeat(ctx, c, xL - R, CY, ER);
    drawElectron(ctx, c, xR - R, CY, ER, { profile: 'rich' });
    drawFocus(ctx, c, ex, ey, ER, 0.8);
    drawElectron(ctx, c, ex, ey, ER, { profile: 'rich' });
    const m = ease.outCubic(u);
    say(ctx, c, 'energy needed', CX, 438, { size: 24, col: c.label });
    drawMeter(ctx, c, 150, 462, 380, 22, m * 0.96, { col: c.bad });
    if (t >= 0 && u > 0.9) tag(ctx, c, 'far too much', CX, 62, { bg: c.bad });
    else if (this._foundA) tag(ctx, c, 'moving it does not happen', CX, 40, { bg: c.good, scale: popIn(this.age - this._doneAt, 0, 0.3) });
    else if (t < 0) tag(ctx, c, 'tap to move the electron', CX, 40, { bg: c.warning, scale: popIn(this.age, 0.4) });
  }

  _share(ctx, c) {
    const d = this._d, xL = CX - d, xR = CX + d, j = ease.inOutCubic(this._join);
    this._atom(ctx, c, xL, { active: j >= 1 }); this._atom(ctx, c, xR, { active: j >= 1 });
    if (j > 0.99) {
      drawSharedPair(ctx, c, xL, CY, xR, CY, { r: ER, focus: 0.8, profile: 'rich' });
    } else {
      const k = 1 - j;
      drawElectron(ctx, c, lerp(CX - ER * 1.08, xL + R, k), lerp(CY, CY, k), ER, { profile: 'rich' });
      drawElectron(ctx, c, lerp(CX + ER * 1.08, xR - R, k), CY, ER, { profile: 'rich' });
      drawSeat(ctx, c, xL - R, CY, ER * k + 0.5);
      drawSeat(ctx, c, xR + R, CY, ER * k + 0.5);
    }
    const n = j > 0.5 ? 2 : 1;
    tag(ctx, c, `K-shell: ${n}`, xL - (j > 0.5 ? 34 : 0), 420, { bg: n === 2 ? c.good : c.raised, size: 26 });
    tag(ctx, c, `K-shell: ${n}`, xR + (j > 0.5 ? 34 : 0), 420, { bg: n === 2 ? c.good : c.raised, size: 26 });
    if (!this._joined) tag(ctx, c, 'drag them together', CX, 40, { bg: c.warning, scale: popIn(this.age, 0.4) });
    else if (j >= 1) tag(ctx, c, 'one shared pair', CX, 40, { bg: c.good, scale: popIn(this.age - this._doneAt, MOVE_S, 0.3) });
  }

  _pair(ctx, c) {
    const d = this._d, xL = CX - d, xR = CX + d;
    const pull = clamp01(0.35 + (d - D_BOND) / 50);
    this._atom(ctx, c, xL); this._atom(ctx, c, xR);
    drawSharedPair(ctx, c, xL, CY, xR, CY, { r: 15, pull, focus: 0.8, profile: 'rich' });
    const e = clamp01((d - D_BOND) / (176 - D_BOND));
    say(ctx, c, 'energy', 138, 462, { size: 24, align: 'left' });
    drawMeter(ctx, c, 232, 448, 300, 24, 0.12 + e * 0.85, { col: c.warning });
    if (this._foundC) tag(ctx, c, 'the pair attracts both nuclei', CX, 40, { bg: c.good, scale: popIn(this.age - this._doneAt, 0, 0.3) });
    else tag(ctx, c, 'pull one atom away, then let go', CX, 40, { bg: c.warning, scale: popIn(this.age, 0.4) });
  }

  _take(ctx, c) {
    const xL = CX - D_BOND, xR = CX + D_BOND, y = CY;
    ctx.save();
    ctx.translate(0, -66);
    this._atom(ctx, c, xL); this._atom(ctx, c, xR);
    drawSharedPair(ctx, c, xL, y, xR, y, { r: 14, profile: 'rich' });
    ctx.restore();
    const a = popIn(this.age, 0.3), b = popIn(this.age, 0.55), k = popIn(this.age, 0.8);
    drawCard(ctx, c, 110, 366, 460, 124, 1, {});
    if (a > 0) say(ctx, c, 'H\u2014H', 230, 428, { size: 62 });
    if (b > 0) formula(ctx, c, 'H_2', 450, 424, { size: 62 });
    if (k > 0) tag(ctx, c, 'one single bond', CX, 40, { bg: c.raised, scale: k });
  }
}
