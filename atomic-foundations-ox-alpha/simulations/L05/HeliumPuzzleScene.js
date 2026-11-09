// HeliumPuzzleScene - companion to blk-l05-s3, "The Neutron".
//   b0  weigh       one helium atom on a pan balance. The learner adds hydrogen atoms: two is not
//                   enough, and it takes four to balance.
//   b1  hypothesis  helium's nucleus: two protons, two empty places. Mass 4, charge +2.
//   b2  chadwick    the two places fill with neutrons, and the three particles stand in a row
//   b3  takeaway    the finished helium nucleus, which is also the alpha particle of the last lesson
// Atoms on the balance are drawn hugely enlarged: a picture of the ratio, not a real weighing of atoms.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, darken, drawBackdrop, drawFloor, ellipse, outBack, rr } from 'simulations/base/kit/SimLook.js';
import { balanceTilt } from 'simulations/base/kit/SimBalance.js';
import { reducedMotion, spring } from 'simulations/base/kit/SimAnim.js';
import { drawAtom, drawDepthField, drawElectron, drawFocus, drawNucleon, drawSeat } from 'simulations/base/kit/SimAtom.js';
import { tag } from '../L04/AtomLabels.js';

const TAU = Math.PI * 2;
const S_WEIGH = 0, S_HYPO = 1, S_CHAD = 2, S_CORE = 3;
const PIVOT = { x: 340, y: 118 };
const NUC = { x: 340, y: 216 };
const B = 78;                            // nucleon radius in the big nucleus
const SPOTS = [[-B, -B * 0.72, 'proton'], [B, -B * 0.72, 'neutron'], [-B, B * 0.72, 'neutron'], [B, B * 0.72, 'proton']];

export class HeliumPuzzleScene extends SimScene {
  static BEAT_STEP_MAP = [S_WEIGH, S_HYPO, S_CHAD, S_CORE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'add', label: 'Add a hydrogen atom' },
    { type: 'button', id: 'take', label: 'Take one off' },
  ];
  static ARIA_LABEL = 'A helium atom on one pan of a balance. You add hydrogen atoms to the other pan: two do not balance it, and four do. Then the helium nucleus shows two protons and two empty places, with mass 4 and charge plus 2. The places fill with neutrons, and proton, neutron and electron stand in a row with their charges. Last, the finished helium nucleus, two protons and two neutrons, which is also an alpha particle.';

  constructor(container, config) {
    super(container, config);
    this._n = 0;
    this._tilt = -0.26;
    this._found = false;
  }

  enter() {
    this._n = 0;
    this._tilt = balanceTilt(4, 0, { max: 0.26, scale: 1.6 });
    this._found = false;
  }

  isControlHidden() { return this.stage !== S_WEIGH; }
  isControlDisabled(id) { return (id === 'add' && this._n >= 6) || (id === 'take' && this._n <= 0); }

  onControlChange(id) {
    if (!this._guard(id)) return;
    this._set(this._n + (id === 'add' ? 1 : -1));
  }

  _set(n) {
    this._n = Math.max(0, Math.min(6, n));
    if (this._n === 4 && !this._found) {
      this._found = true;
      this.after(0.5, () => this.celebrate(PIVOT.x, PIVOT.y + 80, 30, { key: 'four', lookAt: true }));
    }
    if (reducedMotion()) this._tilt = this._target();
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_WEIGH && p.x > 340) this._set(this._n + 1);
  }

  _target() { return balanceTilt(4, this._n, { max: 0.26, scale: 1.6 }); }

  update(d) { this._tilt += (this._target() - this._tilt) * Math.min(1, d * 6); }

  busy() { return Math.abs(this._target() - this._tilt) > 0.002 || this.age < 1.8; }

  _h(ctx, c, x, y, r) { drawAtom(ctx, c, x, y, { shells: [1], p: 1, n: 0, radius: r, nucleusR: r * 0.34, er: 6, sym: '' }); }

  // A pan balance with long hangers, so an atom has room to sit on its pan. (The kit's balance
  // hangs its pans too near the beam for a big round hero.)
  _rig(ctx, c) {
    const x = PIVOT.x, y = PIVOT.y, half = 214, chain = 168, metal = darken(c.gold, 0.15), dark = darken(metal, 0.32);
    const ca = Math.cos(this._tilt), sa = Math.sin(this._tilt);
    rr(ctx, x - 74, 452, 148, 18, 9); ctx.fillStyle = dark; ctx.fill();
    rr(ctx, x - 68, 448, 136, 14, 7); ctx.fillStyle = metal; ctx.fill();
    rr(ctx, x - 9, y, 18, 450 - y, 7); ctx.fillStyle = metal; ctx.fill();
    ctx.save();
    ctx.translate(x, y); ctx.rotate(this._tilt);
    rr(ctx, -half - 10, -6, 2 * half + 20, 15, 7); ctx.fillStyle = dark; ctx.fill();
    rr(ctx, -half - 10, -9, 2 * half + 20, 14, 7); ctx.fillStyle = metal; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, 17, 0, TAU); ctx.fillStyle = dark; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 2, 15, 0, TAU); ctx.fillStyle = metal; ctx.fill();
    const pan = (s) => {
      const tx = x + s * half * ca, ty = y + s * half * sa, py = ty + chain;
      ctx.strokeStyle = metal; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tx - 90, py); ctx.lineTo(tx, ty); ctx.lineTo(tx + 90, py); ctx.stroke();
      ctx.lineCap = 'butt';
      ellipse(ctx, tx, py + 4, 100, 12, 0); ctx.fillStyle = dark; ctx.fill();
      ellipse(ctx, tx, py, 100, 10, 0); ctx.fillStyle = metal; ctx.fill();
      return { x: tx, y: py };
    };
    return { left: pan(-1), right: pan(1) };
  }

  _weigh(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, 470);
    const pans = this._rig(ctx, c);
    drawAtom(ctx, c, pans.left.x, pans.left.y - 62, { shells: [2], p: 2, n: 2, radius: 58, nucleusR: 22, er: 8, seed: 1, solid: false });
    const R = 24;
    for (let i = 0; i < this._n; i++) {
      const up = i >= 4 ? 1 : 0, cols = up ? this._n - 4 : Math.min(this._n, 4);
      const x = pans.right.x + ((i - up * 4) - (cols - 1) / 2) * (R * 2 + 1);
      this._h(ctx, c, x, pans.right.y - R - 8 - up * (R * 2), R);
    }
    tag(ctx, c, 'helium', 126, 40, { size: 28 });
    const done = this._n === 4;
    tag(ctx, c, `${this._n} hydrogen`, 554, 40, { size: 28, bg: done ? c.good : undefined });
    if (!this._n) tag(ctx, c, 'tap here to add hydrogen', 470, 490, { bg: c.warning });
    else if (done) tag(ctx, c, 'four times as heavy', 340, 490, { bg: c.good });
    else tag(ctx, c, this._n === 2 ? 'twice is not enough' : 'not balanced', 340, 490, {});
  }

  _core(ctx, c, fill, fy = NUC.y) {
    drawFocus(ctx, c, NUC.x, fy, 150, 0.5);
    for (const [dx, dy, kind] of SPOTS) {
      const x = NUC.x + dx, y = fy + dy;
      if (kind === 'proton') drawNucleon(ctx, c, x, y, B, 'proton');
      else if (fill >= 1) drawNucleon(ctx, c, x, y, B, 'neutron');
      else {
        drawSeat(ctx, c, x, y, B * 0.94);
        if (fill > 0) drawNucleon(ctx, c, x, y, Math.max(4, B * fill), 'neutron');
        else tag(ctx, c, '?', x, y, { size: 40 });
      }
    }
  }

  draw(ctx, c) {
    const age = reducedMotion() ? 9 : this.age;
    if (this.stage === S_WEIGH) { this._weigh(ctx, c); return; }
    drawDepthField(ctx, c, { x: NUC.x, y: NUC.y, seed: 12 });
    if (this.stage === S_HYPO) {
      this._core(ctx, c, 0);
      const u = outBack(clamp01((age - 0.3) / 0.5));
      tag(ctx, c, 'mass 4', 196, 470, { bg: c.warning, size: 30, scale: u });
      tag(ctx, c, 'charge +2', 484, 470, { bg: c.proton, size: 30, scale: u });
      return;
    }
    if (this.stage === S_CHAD) {
      const k = spring(clamp01(age / 1.2) * 1.2, 'playful');
      const m = clamp01((age - 1) / 0.5);
      if (m < 1) {
        ctx.save();
        ctx.globalAlpha *= 1 - m;
        this._core(ctx, c, Math.min(0.999, Math.max(0.01, k)));
        ctx.restore();
      }
      if (m > 0) {
        ctx.save();
        ctx.globalAlpha *= m;
        this._cards(ctx, c);
        ctx.restore();
      }
      return;
    }
    this._core(ctx, c, 1, 206);
    const u = outBack(clamp01((age - 0.3) / 0.5));
    tag(ctx, c, '2 protons + 2 neutrons', 340, 432, { bg: c.warning, size: 28, scale: u });
    tag(ctx, c, 'this is an alpha particle', 340, 486, { scale: u });
  }

  // Three particles in a row.
  _cards(ctx, c) {
    const xs = [136, 340, 544], y = 216;
    drawNucleon(ctx, c, xs[0], y, 88, 'proton');
    drawFocus(ctx, c, xs[1], y, 88, 0.9);
    drawNucleon(ctx, c, xs[1], y, 88, 'neutron');
    drawElectron(ctx, c, xs[2], y, 24);
    tag(ctx, c, 'proton', xs[0], 346, { size: 28 });
    tag(ctx, c, 'neutron', xs[1], 346, { size: 28, bg: c.warning });
    tag(ctx, c, 'electron', xs[2], 346, { size: 28 });
    tag(ctx, c, '+1', xs[0], 402, { bg: c.proton, size: 30 });
    tag(ctx, c, '0', xs[1], 402, { bg: c.neutron, size: 30 });
    tag(ctx, c, '-1', xs[2], 402, { bg: c.electron, size: 30 });
    tag(ctx, c, 'James Chadwick, 1932', 340, 472, { size: 26 });
  }
}
