// ElectronTransferScene - companion to blk-l08-s3, "The Electron Moves".
//   b0  cation   sodium loses an electron: protons stay 11, electrons fall to 10, the charge reads +1
//   b1  anion    chlorine takes it: protons stay 17, electrons rise to 18, the charge reads -1
//   b2  attract  Na+ and Cl- pull together and hold: the ionic bond
//   b3  no-want  the energy hill: lone atoms, then lone ions. Both have 8, and the energy went UP
//   b4  energy   the learner lets the ions pull together: the ball rolls below where it started
// The energy picture is to scale in sign and rough size, not in units: a small rise, a deep fall.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawCard, mix, darken, luma, clamp01, drawShadow, vectorArrow } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawAtom, drawDepthField, drawElectron, drawIon, drawBall, atomLayout, drawFocus } from 'simulations/base/kit/SimAtom.js';
import { popIn, say, tag, formula } from '../L07/AtomBoard.js';

const S_CAT = 0, S_AN = 1, S_ATT = 2, S_NOWANT = 3, S_EN = 4;
const CX = 236, CY = 258, R = 180, ER = 12, NR = 44;
const PANEL = { x: 452, y: 22, w: 214, h: 476 };
const NA = { p: 11, n: 12, cfg: [2, 8, 1], f: 'Na^+', kind: 'cation' };
const CL = { p: 17, n: 18, cfg: [2, 8, 7], f: 'Cl^-', kind: 'anion' };
const R_NA = 86, R_CL = 124;           // Cl- is the larger ion, as in the real crystal
const FLY_AT = 0.7, FLY_S = 1;

// The energy hill, as stage points: atoms on a shelf, a small rise, a deep valley.
const HILL = [[0, 250], [200, 250], [336, 186], [542, 440], [680, 396]];
const smooth = (u) => u * u * (3 - 2 * u);
function hillY(x) {
  for (let i = 0; i < HILL.length - 1; i++) {
    const [x0, y0] = HILL[i], [x1, y1] = HILL[i + 1];
    if (x <= x1) return y0 + (y1 - y0) * smooth(clamp01((x - x0) / (x1 - x0)));
  }
  return HILL[HILL.length - 1][1];
}
const X_START = 96, X_TOP = 336, X_LOW = 542, BALL = 30;

export class ElectronTransferScene extends SimScene {
  static BEAT_STEP_MAP = [S_CAT, S_AN, S_ATT, S_NOWANT, S_EN].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'replay', label: 'Watch again' },
    { type: 'button', id: 'pull', label: 'Let the ions pull together' },
  ];
  static ARIA_LABEL =
    'A sodium atom loses one electron. It keeps 11 protons and has 10 electrons, so its charge is plus 1: the '
    + 'sodium ion. A chlorine atom takes the electron. It keeps 17 protons and has 18 electrons, so its charge is '
    + 'minus 1: the chloride ion. The two ions pull together and hold: the ionic bond. Then an energy hill. '
    + 'Moving the electron between lone atoms takes the ball up a small rise, even though both now have 8 '
    + 'electrons in the outer shell. When you let the ions pull together, the ball rolls down far below where '
    + 'it started: the ions together have less energy than the atoms had.';

  constructor(container, config) {
    super(container, config);
    this._t = 0;
    this._ballX = X_START;
    this._drag = false;
    this._roll = false;
    this._found = false;
  }

  enter(stage) {
    this._t = reducedMotion() ? 99 : 0;
    this._ballX = stage === S_NOWANT ? (reducedMotion() ? X_TOP : X_START) : X_TOP;
    this._drag = false;
    this._roll = false;
    this._found = false;
  }

  get _end() { return [FLY_AT + FLY_S + 1.1, FLY_AT + FLY_S + 1.1, 2.6, 2.6, 0.5][this.stage] ?? 1; }
  busy() { return this._t < this._end || this._roll || this._drag; }

  isControlHidden(id) { return id === 'pull' ? this.stage !== S_EN : this.stage > S_ATT; }
  isControlDisabled(id) { return id === 'pull' ? this._found || this._roll : this.busy(); }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'replay') { this._t = 0; this.requestUiUpdate?.(); return; }
    this._roll = true;
    this.animateFor?.();
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage !== S_EN || this._found) return;
    if (Math.hypot(p.x - this._ballX, p.y - (hillY(this._ballX) - BALL)) < BALL + 22) { this._drag = true; this.animateFor?.(); }
  }

  pointerMove(p) {
    if (!this._drag) return false;
    this._ballX = Math.max(X_TOP, Math.min(X_LOW, p.x));
    this.animateFor?.();
    if (this._ballX > X_LOW - 8) this._arrive();
    return false;
  }

  pointerUp() {
    if (!this._drag) return;
    this._drag = false;
    if (!this._found && this._ballX > X_TOP + 6) this._roll = true;   // past the top, it rolls on down
    this.animateFor?.();
  }

  _arrive() {
    this._ballX = X_LOW;
    this._roll = false;
    this._drag = false;
    if (!this._found) {
      this._found = true;
      this.celebrate(X_LOW, hillY(X_LOW) - BALL, 30, { key: 'lower-energy', lookAt: 'scene' });
    }
    this.requestUiUpdate?.();
  }

  update(d) {
    if (this._t < this._end) this._t = Math.min(this._end, this._t + d);
    if (this.stage === S_NOWANT && !reducedMotion()) {
      this._ballX = X_START + (X_TOP - X_START) * ease.inOutCubic(clamp01((this._t - 0.5) / 1.5));
    }
    if (this.stage === S_EN && this._roll) {
      this._ballX += d * (120 + (this._ballX - X_TOP) * 2.2);
      if (this._ballX >= X_LOW) this._arrive();
    }
  }

  draw(ctx, c) {
    if (this.stage <= S_AN) this._ionise(ctx, c, this.stage === S_CAT ? NA : CL);
    else if (this.stage === S_ATT) this._attract(ctx, c);
    else this._hill(ctx, c);
  }

  _ionise(ctx, c, A) {
    drawDepthField(ctx, c, { x: CX, y: CY, seed: 4, n: 9 });
    const t = this._t, lose = A === NA;
    const u = ease.inOutCubic(clamp01((t - FLY_AT) / FLY_S));
    const done = u >= 1, base = { p: A.p, n: A.n, radius: R, er: ER, nucleusR: NR, phase: lose ? 2.19 : -2.52, seed: 3 };
    const lay = atomLayout({ ...base, shells: A.cfg, seats: lose ? undefined : [2, 8, 8] });
    if (lose) {
      if (done) drawAtom(ctx, c, CX, CY, { ...base, shells: [2, 8], radius: lay.shells[1].r + ER, phase: 1.5, focusShell: 'outer' });
      else {
        drawAtom(ctx, c, CX, CY, { ...base, shells: t < FLY_AT ? [2, 8, 1] : [2, 8, 0], focusShell: 'outer', dimInner: true });
        const q = lay.shells[2].pts[0];
        if (t >= FLY_AT) drawElectron(ctx, c, CX + q.x + u * 290, CY + q.y - Math.sin(u * Math.PI) * 60 - u * 40, 13, { focus: 1 });
      }
    } else {
      drawAtom(ctx, c, CX, CY, { ...base, shells: done ? [2, 8, 8] : A.cfg, seats: [2, 8, 8], focusShell: 'outer', dimInner: !done });
      if (!done) {
        const q = lay.shells[2].pts[7];
        drawElectron(ctx, c, CX + q.x - (1 - u) * 220, CY + q.y - Math.sin(u * Math.PI) * 60, 13, { focus: 1 });
      }
    }
    const { x, y, w, h } = PANEL, cx = x + w / 2;
    drawCard(ctx, c, x, y, w, h, 1, { accent: lose ? c.cation : c.anion });
    say(ctx, c, 'protons', x + 18, y + 62, { align: 'left', size: 28 });
    say(ctx, c, A.p, x + w - 18, y + 62, { align: 'right', size: 44, col: c.proton });
    say(ctx, c, 'electrons', x + 18, y + 132, { align: 'left', size: 28 });
    const e = done ? A.p + (lose ? -1 : 1) : A.p;
    say(ctx, c, e, x + w - 18, y + 132, { align: 'right', size: 44, col: done ? c.s2ink : c.electron });
    say(ctx, c, 'charge', cx, y + 204, { size: 28, col: c.labelMuted });
    const p = done ? popIn(t, FLY_AT + FLY_S, 0.4) : 0;
    if (!done) say(ctx, c, '0', cx, y + 280, { size: 90 });
    else {
      say(ctx, c, lose ? '+1' : '−1', cx, y + 280, { size: Math.round(96 * Math.min(1.08, Math.max(0.6, p))), col: lose ? c.cation : c.anion });
      const q = popIn(t, FLY_AT + FLY_S + 0.3);
      if (q > 0) {
        formula(ctx, c, A.f, cx, y + 372, { size: 48 });
        say(ctx, c, A.kind, cx, y + 430, { size: 30 });
      }
    }
  }

  _attract(ctx, c) {
    drawDepthField(ctx, c, { x: 340, y: 240, seed: 4, n: 9 });
    const t = this._t, u = ease.inOutCubic(clamp01((t - 0.5) / 1.2));
    const touch = R_NA + R_CL - 6;
    const gap = touch + (420 - touch) * (1 - u);
    const mid = 340, xa = mid - gap / 2 - 18, xb = mid + gap / 2 - 18;
    if (u < 0.75) {
      const k = 1 - u / 0.75;
      vectorArrow(ctx, c, xa + R_NA + 10, 240, { length: 60 * k + 30, col: c.warning, width: 9, head: 22 });
      vectorArrow(ctx, c, xb - R_CL - 10, 240, { angle: Math.PI, length: 60 * k + 30, col: c.warning, width: 9, head: 22 });
    }
    drawShadow(ctx, c, mid - 18, 400, 230, 12, 0.5);
    drawIon(ctx, c, xa, 240, { sym: 'Na', charge: 1, r: R_NA, focus: u >= 1 ? 0.6 : 0 });
    drawIon(ctx, c, xb, 240, { sym: 'Cl', charge: -1, r: R_CL, focus: u >= 1 ? 0.6 : 0 });
    const p = popIn(t, 1.8);
    if (p > 0) tag(ctx, c, 'ionic bond', 340, 462, { scale: Math.min(1.05, p), size: 30 });
  }

  _hill(ctx, c) {
    const L = lookOf(), day = luma(c.bgDeep) > 0.5;
    drawDepthField(ctx, c, { x: 340, y: 240, seed: 9, n: 7 });
    // the ground under the curve: one flat fill, one rim
    const ground = mix(c.bgSurface, c.electron, day ? 0.22 : 0.3);
    ctx.beginPath();
    ctx.moveTo(0, 520);
    for (let x = 0; x <= 680; x += 8) ctx.lineTo(x, hillY(x));
    ctx.lineTo(680, 520);
    ctx.closePath();
    ctx.fillStyle = ground;
    ctx.fill();
    ctx.beginPath();
    for (let x = 0; x <= 680; x += 8) ctx.lineTo(x, hillY(x));
    ctx.strokeStyle = darken(ground, 0.3);
    ctx.lineWidth = 5 * L.rim;
    ctx.stroke();
    // the starting level, carried across as a dashed line
    ctx.save();
    ctx.setLineDash([12, 12]);
    ctx.strokeStyle = c.labelMuted;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(200, 250); ctx.lineTo(664, 250); ctx.stroke();
    ctx.restore();
    say(ctx, c, 'energy at the start', 16, 282, { align: 'left', size: 24 });
    // the three stations
    drawAtom(ctx, c, 62, 122, { p: 11, n: 12, shells: [2, 8, 1], radius: 54, er: 5, nucleusR: 22, sym: ' ' });
    drawAtom(ctx, c, 176, 122, { p: 17, n: 18, shells: [2, 8, 7], radius: 54, er: 5, nucleusR: 22, sym: ' ' });
    say(ctx, c, 'Na', 62, 200, { size: 26 });
    say(ctx, c, 'Cl', 176, 200, { size: 26 });
    say(ctx, c, 'lone atoms', 118, 30, { size: 26 });
    const rise = this._ballX > X_TOP - 30;
    if (rise) {
      drawIon(ctx, c, 300, 96, { sym: 'Na', charge: 1, r: 30 });
      drawIon(ctx, c, 396, 96, { sym: 'Cl', charge: -1, r: 40 });
      tag(ctx, c, 'both have 8', 348, 30, { size: 24 });
    }
    const x = this._ballX, y = hillY(x) - BALL;
    const low = this._found;
    if (low) {
      drawIon(ctx, c, X_LOW - 40, 300, { sym: 'Na', charge: 1, r: 30 });
      drawIon(ctx, c, X_LOW + 26, 300, { sym: 'Cl', charge: -1, r: 40 });
      tag(ctx, c, 'less energy', X_LOW - 8, 500 - 16, { bg: c.good, size: 26 });
    }
    if (this.stage === S_EN && !low) drawFocus(ctx, c, x, y, BALL, 1);
    drawBall(ctx, c, x, y, BALL, c.warning, { shade: 0.2 });
    if (this.stage === S_NOWANT && rise && this._t > 2) tag(ctx, c, 'took in energy', 500, 150, { bg: c.bad, size: 24 });
    if (this.stage === S_EN && !low && !this._roll && !this._drag) tag(ctx, c, 'drag the ball', 512, 180, { size: 24 });
  }
}
