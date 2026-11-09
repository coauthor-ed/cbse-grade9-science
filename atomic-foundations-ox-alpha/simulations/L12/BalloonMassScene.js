// BalloonMassScene - companion to blk-l12-s1, "Why the Reading Changed". The book's Activity 9.2, now with atoms.
//   b0  recall    both set-ups from Lesson 2, side by side, with their readings
//   b1  open      set-up 1: balloon beside the flask. Tip in the soda; CO2 leaves by the mouth, the reading falls
//   b2  closed    set-up 2: balloon on the mouth. The same molecules stay in it, the reading holds
//   b3  nogas     Activity 9.1 (salt in water) and 9.3 (the two solutions): no gas, no change
//   b4  takeaway  the sum: what stayed plus what left is what you started with
// In the lens, each molecule that leaves takes one equal step off the reading. Six molecules stand for all of them.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, drawBench, drawCard, mix, lerp, luma, rr, darken, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawMolecule, drawIon, MOLECULES } from 'simulations/base/kit/SimAtom.js';
import { say, tag, formula, popIn } from '../L07/AtomBoard.js';
import { snow } from '../L01/GrainKit.js';
import { drawDigitalBalance, drawFlaskRig, RUN_S } from '../L02/BalanceKit.js';
import { drawLens, lensLeader, span } from './MolKit.js';

const S_RECALL = 0, S_OPEN = 1, S_CLOSED = 2, S_NOGAS = 3, S_TAKE = 4;
const BENCH = 470;
const M0 = 22.5, M1 = 21.48, N = 6;
const RIG = 176, LX = 478, LY = 198, LR = 176, MR = 46;
const fmt = (v) => `${v.toFixed(2)} g`;

// Where each molecule rests in the lens (offsets), when it starts, and its tilt.
const MOL = [[-84, -92, 0.4], [50, -108, -0.5], [-116, 14, 1.3], [8, -8, 0.2], [112, 12, 1.1], [-22, 96, -0.3]];
const bornAt = (i) => 1.9 + i * 0.42;
const leaveAt = (i) => bornAt(i) + 1.25;
const END = RUN_S.sealed;

const SALT_R = [[-60, 0], [-22, -6], [18, 2], [56, -4], [-36, 22], [2, 24], [38, 20]];

export class BalloonMassScene extends SimScene {
  static BEAT_STEP_MAP = [S_RECALL, S_OPEN, S_CLOSED, S_NOGAS, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'run', label: 'Start the reaction' },
    { type: 'button', id: 'salt', label: 'Stir in the salt' },
    { type: 'button', id: 'pour', label: 'Mix the two solutions' },
    { type: 'button', id: 'total', label: 'Add the two masses' },
  ];
  static ARIA_LABEL = 'Two set-ups from Lesson 2 stand on balances. The open flask reads less after the reaction and the flask with the '
    + 'balloon fixed on reads the same. A lens shows the atoms: in the open flask, carbon dioxide molecules leave through the mouth and the '
    + 'reading falls with each one. With the balloon on, the same molecules stay inside and the reading holds. Salt stirred into water and '
    + 'two solutions mixed in open flasks give no gas, and those readings do not change. Last, the mass on the balance and the mass that '
    + 'left add up to the mass at the start.';

  constructor(container, config) {
    super(container, config);
    this._runAt = null;
    this._job = 'salt';
    this._totalAt = null;
  }

  enter() { this._runAt = null; this._job = 'salt'; this._totalAt = null; this.requestUiUpdate?.(); }

  _t() {
    if (this._runAt == null) return 0;
    return reducedMotion() ? END + 1 : this.age - this._runAt;
  }
  get _going() { return this._runAt != null && this._t() < END; }

  isControlHidden(id) {
    if (id === 'run') return this.stage !== S_OPEN && this.stage !== S_CLOSED;
    if (id === 'total') return this.stage !== S_TAKE;
    return this.stage !== S_NOGAS;
  }
  isControlDisabled(id) { return id === 'total' ? this._totalAt != null : this._going; }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'total') this._total();
    else if (id === 'run') this._go(); else this._go(id);
  }

  pointerDown() {
    if (this.stage === S_OPEN || this.stage === S_CLOSED) { if (!this._going) this._go(); }
    else if (this.stage === S_NOGAS && !this._going) this._go(this._job);
    else if (this.stage === S_TAKE && this._totalAt == null) this._total();
  }

  _total() {
    this._totalAt = this.age;
    this.celebrate(516, 366, 30, { key: 'atoms-add-up', lookAt: 'scene' });
    this.requestUiUpdate?.();
  }

  _go(job) {
    if (job) this._job = job;
    this._runAt = this.age;
    this.requestUiUpdate?.();
  }

  busy() {
    if (this._going) return true;
    return !reducedMotion() && (this.age < 1 || (this._totalAt != null && this.age - this._totalAt < 0.6));
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 34);
    drawBench(ctx, c, 14, 666, BENCH);
    if (this.stage === S_RECALL) this._both(ctx, c);
    else if (this.stage === S_NOGAS) this._noGas(ctx, c);
    else if (this.stage === S_TAKE) this._sum(ctx, c);
    else this._run(ctx, c);
  }

  _left(i, t) { return t >= leaveAt(i) + 1.1; }

  _reading(open, t) {
    if (!open) return M0;
    let lost = 0;
    for (let i = 0; i < N; i++) lost += ease.inOutCubic(span(t, leaveAt(i) + 0.3, leaveAt(i) + 1.1));
    return M0 - (M0 - M1) * (lost / N);
  }

  _both(ctx, c) {
    [[176, 'open', M1, 'bad', 'set-up 1: open'], [504, 'sealed', M0, 'good', 'set-up 2: balloon on']].forEach(([x, mode, v, tone, label], i) => {
      const y = drawDigitalBalance(ctx, c, x, BENCH, fmt(v), tone, { w: 270 });
      ctx.save();
      ctx.translate(x, y); ctx.scale(0.86, 0.86);
      drawFlaskRig(ctx, c, mode, 99);
      ctx.restore();
      tag(ctx, c, label, x, 44, { scale: Math.min(1.05, popIn(this.age, 0.1 + i * 0.2)) });
    });
    const p = popIn(this.age, 0.6);
    if (p > 0) tag(ctx, c, 'why?', 340, 216, { size: 40, bg: c.warning, scale: Math.min(1.06, p) });
  }

  _run(ctx, c) {
    const open = this.stage === S_OPEN, t = this._t();
    const v = this._reading(open, t), done = this._runAt != null && t >= END;
    const y = drawDigitalBalance(ctx, c, RIG, BENCH, fmt(v), done ? (open ? 'bad' : 'good') : 'live', { w: 300 });
    const mouthY = y - 170 * 0.96;
    lensLeader(ctx, c, RIG - 24, mouthY, LX, LY, LR);
    ctx.save();
    ctx.translate(RIG + 8, y); ctx.scale(0.96, 0.96);
    drawFlaskRig(ctx, c, open ? 'open' : 'sealed', t);
    ctx.restore();
    drawLens(ctx, c, LX, LY, LR, () => this._lens(ctx, c, open, t));
    let there = 0, born = 0;
    for (let i = 0; i < N; i++) { if (t >= bornAt(i)) born += 1; if (open && t >= leaveAt(i) + 0.75) there += 1; }
    const inRig = born - there;
    if (this._runAt == null) tag(ctx, c, open ? 'tap: tip in the soda' : 'tap: lift the balloon', LX, LY, { bg: c.warning, size: 28 });
    else {
      if (open && done) tag(ctx, c, 'all gone', LX, LY - 10, { size: 32 });
      const f = formula(ctx, c, 'CO_2', 0, 0, { size: 34, ghost: true });
      drawCard(ctx, c, LX - 118, 390, 236, 62, 1);
      formula(ctx, c, 'CO_2', LX - 104 + f.w / 2, 420, { size: 34 });
      say(ctx, c, `on balance: ${inRig}`, LX + 112, 421, { align: 'right', size: 24 });
    }
  }

  _lens(ctx, c, open, t) {
    const dark = luma(c.bgDeep) < 0.5;
    if (open) {                                       // the neck of the flask, open at the top
      const glass = mix(c.glass, c.label, dark ? 0.1 : 0.35);
      ctx.fillStyle = glass;
      rr(ctx, LX - 122, LY + 62, 30, 130, 10); ctx.fill();
      rr(ctx, LX + 92, LY + 62, 30, 130, 10); ctx.fill();
    } else {                                          // the skin of the balloon, all round
      ctx.strokeStyle = c.s1;
      ctx.lineWidth = 16;
      ctx.beginPath(); ctx.arc(LX, LY, LR - 8, 0.62 * Math.PI, 2.38 * Math.PI); ctx.stroke();
    }
    for (let i = 0; i < N; i++) {
      if (t < bornAt(i)) continue;
      const [ox, oy, tilt] = MOL[i];
      const rest = { x: LX + ox * 0.96, y: LY + oy * 0.96 };
      const u = ease.outCubic(span(t, bornAt(i), bornAt(i) + 1.1));
      let x = lerp(LX + (ox * 0.4), rest.x, u), y = lerp(LY + LR + 60, rest.y, u), rot = tilt + (1 - u) * 1.4;
      if (open) {
        const w = ease.inOutCubic(span(t, leaveAt(i), leaveAt(i) + 1.1));
        y -= w * (rest.y - (LY - LR - 70));
        x += w * (i % 2 ? 40 : -30);
        rot += w * 0.8;
      }
      drawMolecule(ctx, c, x, y, { ...MOLECULES.CO2, r: MR, rot, labels: false });
    }
  }

  _noGas(ctx, c) {
    const t = this._t(), pour = this._job === 'pour', done = this._runAt != null && t >= END;
    const v = pour ? 148.2 : 62.4;
    const y = drawDigitalBalance(ctx, c, 340, BENCH, fmt(v), done ? 'good' : 'live', { w: pour ? 520 : 380 });
    if (pour) this._flasks(ctx, c, y, t); else this._beaker(ctx, c, y, t);
    tag(ctx, c, pour ? 'two solutions, no gas' : 'salt in water, no gas', 340, 40);
    if (this._runAt == null) tag(ctx, c, pour ? 'tap: pour B into A' : 'tap: stir', 340, 92, { bg: c.warning, size: 26 });
    if (done) tag(ctx, c, 'no change', 340, 92, { bg: c.good, size: 28 });
  }

  _beaker(ctx, c, y, t) {
    const g = glassBox('beaker', 214, y - 250, 252, 250, { wall: 6 });
    drawGlass(ctx, c, g);
    const sy = drawGlassLiquid(ctx, c, g, { level: 0.62, fill: c.water, opacity: 0.5 });
    const u = ease.inOutCubic(span(t, 0.6, 4.6));
    const rnd = mulberry32(5);
    for (let i = 0; i < 16; i++) {                    // ions spreading through the water
      const px = g.inner.x + 26 + rnd() * (g.inner.w - 52), py = sy + 22 + rnd() * (g.floor - sy - 44);
      const hx = 340 + SALT_R[i % 7][0] * 0.8, hy = g.floor - 18 - SALT_R[i % 7][1] * 0.5;
      if (u > 0.02) drawIon(ctx, c, lerp(hx, px, u), lerp(hy, py, u), { r: 15, charge: i % 2 ? -1 : 1 });
    }
    if (u < 0.5) {
      ctx.fillStyle = snow(c);
      ctx.strokeStyle = darken(snow(c), 0.3);
      ctx.lineWidth = 2;
      SALT_R.forEach(([dx, dy]) => {
        const r = 15 * (1 - u * 1.8);
        rr(ctx, 340 + dx - r, g.floor - 22 - dy * 0.5 - r * 0.6, r * 2, r * 1.5, 4); ctx.fill(); ctx.stroke();
      });
    }
    drawGlassFront(ctx, c, g);
  }

  _flasks(ctx, c, y, t) {
    const u = ease.inOutCubic(span(t, 0.6, 3.2));
    const fA = glassBox('flask', 92, y - 230, 206, 230, { neck: 0.34, wall: 6 }), fB = glassBox('flask', 382, y - 230, 206, 230, { neck: 0.34, wall: 6 });
    const dark = luma(c.bgDeep) < 0.5, soln = mix(c.water, c.bgSurface, dark ? 0.35 : 0.3);
    drawGlass(ctx, c, fA);
    const sy = drawGlassLiquid(ctx, c, fA, { level: lerp(0.3, 0.52, u), fill: soln, opacity: 0.6 });
    const white = ease.smooth(span(t, 1.8, 4.4));
    if (white > 0 && sy != null) {
      const rnd = mulberry32(11);
      ctx.fillStyle = snow(c);
      ctx.strokeStyle = darken(snow(c), 0.28);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 46 * white; i++) {
        const px = 195 + (rnd() - 0.5) * 150, h = rnd();
        ctx.beginPath(); ctx.arc(px, lerp(sy + 8, fA.floor - 8, Math.sqrt(h)), 4.5 + rnd() * 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    drawGlassFront(ctx, c, fA);
    drawGlass(ctx, c, fB);
    drawGlassLiquid(ctx, c, fB, { level: lerp(0.3, 0.02, u), fill: soln, opacity: 0.6 });
    drawGlassFront(ctx, c, fB);
    say(ctx, c, 'A', fA.cx + 74, y - 214, { size: 34 });
    say(ctx, c, 'B', fB.cx - 74, y - 214, { size: 34 });
    if (white > 0.9) tag(ctx, c, 'white solid', 340, 300);
  }

  _sum(ctx, c) {
    const y = drawDigitalBalance(ctx, c, RIG, BENCH, fmt(M1), 'bad', { w: 300 });
    ctx.save();
    ctx.translate(RIG + 8, y); ctx.scale(0.96, 0.96);
    drawFlaskRig(ctx, c, 'open', 99);
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const p = popIn(this.age, 0.1 + i * 0.1);
      if (p > 0) drawMolecule(ctx, c, 130 + i * 74, 76 + (i % 2) * 42, { ...MOLECULES.CO2, r: 36 * Math.min(1.05, p), rot: i * 0.7 + 0.3, labels: false });
    }
    const x = 370, w = 292;
    drawCard(ctx, c, x, 150, w, 270, 1, { accent: c.good });
    const line = (k, label, val, col) => {
      const p = popIn(this.age, 0.3 + k * 0.28);
      if (p <= 0) return;
      say(ctx, c, label, x + 22, 202 + k * 62, { align: 'left', size: 26 });
      say(ctx, c, val, x + w - 20, 202 + k * 62, { align: 'right', size: 30, col: col ?? c.label });
    };
    line(0, 'on balance', fmt(M1));
    line(1, 'in the air', fmt(M0 - M1), c.s1ink);
    const p = this._totalAt == null ? 0 : popIn(this.age, this._totalAt);
    if (this._totalAt == null) tag(ctx, c, 'tap: add them', x + w / 2, 366, { bg: c.warning, size: 26 });
    if (p > 0) {
      ctx.fillStyle = c.stroke;
      rr(ctx, x + 20, 312, w - 40, 5, 2.5); ctx.fill();
      say(ctx, c, 'start', x + 22, 366, { align: 'left', size: 32 });
      say(ctx, c, fmt(M0), x + w - 20, 366, { align: 'right', size: 40, col: c.good });
    }
  }
}
