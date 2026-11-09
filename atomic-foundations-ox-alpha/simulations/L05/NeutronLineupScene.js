// NeutronLineupScene - companion to blk-l05-s5, "How Do You Find a Particle With No Charge?".
//   b0  quiet     a beam between charged plates. The learner tries electron, proton and neutron: only
//                 the neutron goes straight.
//   b1  wax       the apparatus. Alpha particles hit beryllium, an invisible ray comes out. The learner
//                 slides the wax in: protons fly out.
//   b2  mass      a carrom board. The learner sets the mass of the hidden striker and fires at the coin
//                 (the proton). Light strikers hardly move it; a striker about as heavy as the coin
//                 reaches the measured mark; a much heavier one goes past it.
//   b3  takeaway  a proton and a neutron on a balance, level
// Model: a head-on elastic hit, coin speed 2m/(1+m) of the striker speed, distance in step with speed.
// The ray's speed is fixed for the sake of the picture; Chadwick found it by using two targets.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, clamp01, darken, drawBackdrop, drawBench, drawFloor, lerp, lighten, luma, mix, outBack, rr } from 'simulations/base/kit/SimLook.js';
import { ease, reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawBall, drawDepthField, drawElectron, drawFocus, drawNucleon } from 'simulations/base/kit/SimAtom.js';
import { tag } from '../L04/AtomLabels.js';

const TAU = Math.PI * 2;
const S_QUIET = 0, S_WAX = 1, S_MASS = 2, S_TAKE = 3;
const PLATE = { x0: 180, x1: 500, top: 118, bot: 322 };
const BOARD = { x: 40, y: 90, w: 600, h: 300 };
const COIN0 = 300, MARK = 500, FLY = 1.1;
const clampMass = (m) => Math.max(0.1, Math.min(3, m));
const coinEnd = (m) => COIN0 + (MARK - COIN0) * ((2 * m) / (1 + m));

export class NeutronLineupScene extends SimScene {
  static BEAT_STEP_MAP = [S_QUIET, S_WAX, S_MASS, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'part', label: 'Particle', value: 'electron', options: [
      { value: 'electron', label: 'electron' }, { value: 'proton', label: 'proton' }, { value: 'neutron', label: 'neutron' }] },
    { type: 'button', id: 'wax', label: 'Slide the wax in' },
    { type: 'slider', id: 'mass', label: 'Mass of the hidden particle', min: 0.1, max: 3, step: 0.1, value: 0.2, suffix: '' },
    { type: 'button', id: 'fire', label: 'Fire' },
  ];
  static ARIA_LABEL = 'How a neutral particle was found. A beam passes between charged plates: electrons and protons bend, and a neutron goes straight. Then alpha particles hit beryllium and an invisible ray comes out; when you slide wax into the ray, protons fly out of the wax. Then on a carrom board you set the mass of a hidden striker and fire it at a coin that stands for a proton: only a striker about as heavy as the coin sends it to the measured mark. Last, a proton and a neutron balance.';

  constructor(container, config) {
    super(container, config);
    this._part = 'electron';
    this._seen = {};
    this._waxIn = false;
    this._m = 0.2;
    this._t0 = null;
    this._done = false;
    this._found = false;
  }

  enter() {
    this._part = 'electron';
    this._seen = {};
    this._waxIn = false;
    this._waxT = 0;
    this._m = 0.2;
    this._t0 = this.stage === S_QUIET ? 0 : null;
    this._last = null;
    this._found = false;
  }

  isControlHidden(id) {
    if (id === 'part') return this.stage !== S_QUIET;
    if (id === 'wax') return this.stage !== S_WAX || this._waxIn;
    if (id === 'mass') return this.stage !== S_MASS;
    return this.stage !== S_MASS && this.stage !== S_QUIET;
  }

  isControlDisabled(id) { return id === 'fire' && this.busy(); }

  getControlValue(id) {
    if (id === 'part') return this._part;
    if (id === 'mass') return this._m.toFixed(1);
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'part') { this._part = String(v); this._fire(); }
    if (id === 'fire') this._fire();
    if (id === 'wax') { this._waxIn = true; this._waxT = this.age; }
    if (id === 'mass') { this._m = clampMass(Number(v)); this._t0 = null; this._last = null; }
    this.requestUiUpdate?.();
  }

  _fire() { this._t0 = this.age; this._shotM = this._m; this._shotDone = false; }

  pointerDown(p) {
    if (this.stage === S_WAX && !this._waxIn) { this._waxIn = true; this._waxT = this.age; }
    if (this.stage === S_MASS && !this.busy()) this._fire();
    this.requestUiUpdate?.();
  }

  _run() { return this._t0 == null ? 99 : reducedMotion() ? 99 : this.age - this._t0; }

  update() {
    if (this.stage === S_QUIET && this._t0 != null && this._run() > 1.3) {
      if (!this._seen[this._part]) {
        this._seen[this._part] = true;
        if (this._part === 'neutron' && !this._found) { this._found = true; this.celebrate(500, PLATE.top + 102, 30, { key: 'neutral', lookAt: true }); }
      }
    }
    if (this.stage === S_MASS && this._t0 != null && !this._shotDone && this._run() > 0.55 + FLY) {
      this._shotDone = true;
      const m = this._shotM;
      this._last = m;
      if (Math.abs(coinEnd(m) - MARK) < 26 && !this._found) { this._found = true; this.celebrate(MARK, 240, 30, { key: 'mass', lookAt: true }); }
    }
  }

  busy() {
    if (this.stage === S_QUIET) return this._run() < 1.4;
    if (this.stage === S_WAX) return this._waxIn ? this.age - this._waxT < 3 : this.age < 1;
    if (this.stage === S_MASS) return this._t0 != null && this._run() < 0.6 + FLY;
    return this.age < 1;
  }

  draw(ctx, c) {
    if (this.stage === S_QUIET) this._quiet(ctx, c);
    else if (this.stage === S_WAX) this._wax(ctx, c);
    else if (this.stage === S_MASS) this._carrom(ctx, c);
    else this._take(ctx, c);
  }

  _plate(ctx, c, y, sign) {
    const col = sign > 0 ? c.proton : c.electron;
    rr(ctx, PLATE.x0, y + 4, PLATE.x1 - PLATE.x0, 26, 8); ctx.fillStyle = darken(col, 0.35); ctx.fill();
    rr(ctx, PLATE.x0, y, PLATE.x1 - PLATE.x0, 26, 8); ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = alpha(c.bgDeep, 0.85);
    for (let i = 0; i < 6; i++) {
      const x = PLATE.x0 + 30 + i * 52, yy = y + 13;
      ctx.fillRect(x - 8, yy - 2.5, 16, 5);
      if (sign > 0) ctx.fillRect(x - 2.5, yy - 8, 5, 16);
    }
  }

  _quiet(ctx, c) {
    const P = this._part, y0 = (PLATE.top + PLATE.bot) / 2 + 13;
    drawDepthField(ctx, c, { x: 340, y: y0, seed: 14 });
    this._plate(ctx, c, PLATE.top, 1);
    this._plate(ctx, c, PLATE.bot, -1);
    const u = clamp01(this._run() / 1.2);
    const dir = P === 'electron' ? -1 : P === 'proton' ? 1 : 0, amt = P === 'electron' ? 92 : 40;
    const path = (t) => {
      const x = 30 + 606 * t;
      const k = clamp01((x - PLATE.x0) / (PLATE.x1 - PLATE.x0));
      const dy = x < PLATE.x1 ? k * k * amt : amt + ((x - PLATE.x1) / (PLATE.x1 - PLATE.x0)) * 2 * amt;
      return [x, y0 + dir * dy];
    };
    ctx.strokeStyle = alpha(P === 'electron' ? c.electron : P === 'proton' ? c.proton : c.neutron, 0.8);
    ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 50; i++) { const q = path((i / 50) * u); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }
    ctx.stroke();
    ctx.lineCap = 'butt';
    const q = path(u);
    if (P === 'electron') drawElectron(ctx, c, q[0], q[1], 13);
    else drawNucleon(ctx, c, q[0], q[1], 19, P);
    const done = u >= 1;
    tag(ctx, c, P, 110, 40, { size: 28, bg: P === 'neutron' ? c.neutron : P === 'proton' ? c.proton : c.electron });
    if (done) tag(ctx, c, dir ? 'bends' : 'no bend at all', 340, 410, { size: 30, bg: dir ? c.raised : c.good });
    const seen = Object.keys(this._seen).length;
    tag(ctx, c, seen >= 3 ? 'plates cannot show it' : 'try all three', 340, 476, { bg: seen >= 3 ? c.raised : c.warning });
  }

  // The bench: a source, a beryllium disc, the wax block, and a counter.
  _wax(ctx, c) {
    const age = reducedMotion() ? 9 : this.age;
    const dark = luma(c.bgDeep) < 0.5;
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, 452);
    drawBench(ctx, c, 20, 660, 344, { h: 108 });
    const y = 280;
    const box = mix(c.waste, c.bgSurface, dark ? 0.35 : 0.2);
    rr(ctx, 36, y - 42, 74, 106, 9); ctx.fillStyle = darken(box, 0.35); ctx.fill();
    rr(ctx, 36, y - 46, 74, 106, 9); ctx.fillStyle = box; ctx.fill();
    const al = mix(c.s6, c.s8, 0.25);
    const ber = mix(c.label, c.bgSurface, dark ? 0.45 : 0.6);
    rr(ctx, 186, y - 54, 26, 118, 8); ctx.fillStyle = darken(ber, 0.3); ctx.fill();
    rr(ctx, 186, y - 58, 26, 118, 8); ctx.fillStyle = ber; ctx.fill();
    for (let i = 0; i < 4; i++) {                             // alpha particles, resting in flight
      const x = 118 + ((age * 90 + i * 16) % 62);
      drawBall(ctx, c, reducedMotion() ? 124 + i * 16 : x, y, 6, al);
    }
    // The ray: pale, broken, and only a guess at where it goes.
    const wx = this._waxIn ? 372 : 372;
    const inU = this._waxIn ? ease.outCubic(clamp01((this.age - this._waxT) / 0.5)) : (reducedMotion() ? 0 : 0);
    const wy = lerp(182, y - 58, this._waxIn ? (reducedMotion() ? 1 : inU) : 0);
    const stopX = this._waxIn ? wx : 640;
    ctx.strokeStyle = alpha(c.label, dark ? 0.5 : 0.42); ctx.lineWidth = 6; ctx.setLineDash([3, 15]); ctx.lineCap = 'round';
    for (const dy of [-16, 0, 16]) { ctx.beginPath(); ctx.moveTo(216, y + dy); ctx.lineTo(stopX, y + dy); ctx.stroke(); }
    ctx.setLineDash([]); ctx.lineCap = 'butt';
    const wax = mix(c.gold, c.bgSurface, dark ? 0.2 : 0.5);
    rr(ctx, wx, wy + 5, 76, 116, 10); ctx.fillStyle = darken(wax, 0.28); ctx.fill();
    rr(ctx, wx, wy, 76, 116, 10); ctx.fillStyle = wax; ctx.fill();
    rr(ctx, wx + 8, wy + 7, 34, 8, 4); ctx.fillStyle = lighten(wax, 0.4); ctx.fill();
    if (this._waxIn) {
      const t = reducedMotion() ? 3 : this.age - this._waxT - 0.5;
      for (let i = 0; i < 5; i++) {
        const u = clamp01((t - i * 0.24) / 0.8);
        if (u <= 0) continue;
        const dy = (i - 2) * 26;
        const x = lerp(wx + 76, 620, ease.outCubic(u)), yy = y + dy * (0.4 + 0.6 * u);
        ctx.strokeStyle = alpha(c.proton, 0.45); ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(wx + 76, y + dy * 0.4); ctx.lineTo(x, yy); ctx.stroke();
        drawNucleon(ctx, c, x, yy, 13, 'proton');
      }
      if (t > 1) tag(ctx, c, 'protons fly out', 540, 164, { bg: c.proton });
    } else tag(ctx, c, 'tap to slide the wax in', 470, 72, { bg: c.warning });
    tag(ctx, c, 'alpha', 76, 182, { bg: al });
    tag(ctx, c, 'beryllium', 200, 176, {});
    tag(ctx, c, 'wax', 410, Math.max(40, wy - 30), {});
    tag(ctx, c, 'invisible ray', 290, 228, { bg: c.raised, size: 22 });
  }

  // The board, from above: a corner pocket each end of the frame, the coin at the middle.
  _carrom(ctx, c) {
    const { x, y, w, h } = BOARD, dark = luma(c.bgDeep) < 0.5;
    drawBackdrop(ctx, c, 'plain', { setting: 'none' });
    const wood = mix(c.gold, c.s8, 0.2);
    const frame = darken(wood, 0.5);
    rr(ctx, x - 18, y - 18, w + 36, h + 42, 16); ctx.fillStyle = darken(frame, 0.35); ctx.fill();
    rr(ctx, x - 18, y - 18, w + 36, h + 36, 16); ctx.fillStyle = frame; ctx.fill();
    rr(ctx, x, y, w, h, 6); ctx.fillStyle = dark ? mix(wood, c.bgDeep, 0.25) : lighten(wood, 0.34); ctx.fill();
    for (const [px, py] of [[x + 20, y + 20], [x + w - 20, y + 20], [x + 20, y + h - 20], [x + w - 20, y + h - 20]]) {
      ctx.beginPath(); ctx.arc(px, py, 18, 0, TAU); ctx.fillStyle = darken(frame, 0.55); ctx.fill();
    }
    const cy = y + h / 2;
    ctx.strokeStyle = alpha(darken(wood, 0.5), 0.55); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x + w / 2 - 40, cy, 66, 0, TAU); ctx.stroke();
    // The measured mark.
    ctx.strokeStyle = c.good; ctx.lineWidth = 7; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(MARK, y + 16); ctx.lineTo(MARK, y + h - 16); ctx.stroke(); ctx.setLineDash([]);
    const m = this._t0 != null ? this._shotM ?? this._m : this._m;
    const t = this._run();
    const hit = 0.55;
    const r = 14 + 15 * Math.sqrt(m);
    const k0 = this._t0 == null ? 0 : clamp01(t / hit);
    const sx = lerp(84, COIN0 - r - 22, k0 * k0);
    const after = this._t0 == null ? 0 : ease.outCubic(clamp01((t - hit) / FLY));
    const strikerV = (m - 1) / (m + 1);                       // its speed after the hit, as a share
    const sxx = t > hit ? (COIN0 - r - 22) + strikerV * (coinEnd(m) - COIN0) * after : sx;
    const coin = lerp(COIN0, coinEnd(m), after);
    drawBall(ctx, c, sxx, cy, r, c.neutron, {});
    drawNucleon(ctx, c, coin, cy, 22, 'proton');
    tag(ctx, c, `hidden particle: mass ${m.toFixed(1)}`, 262, 42, { size: 24 });
    tag(ctx, c, 'measured speed', 556, 42, { bg: c.good, size: 22 });
    const last = this._last;
    if (last == null) tag(ctx, c, 'set the mass, then fire', 340, 470, { bg: c.warning });
    else {
      const e = coinEnd(last), ok = Math.abs(e - MARK) < 26;
      tag(ctx, c, ok ? 'about as heavy as a proton' : e < MARK ? 'too light: proton too slow' : 'too heavy: proton too fast', 340, 470, { bg: ok ? c.good : c.raised, size: 26 });
    }
  }

  _take(ctx, c) {
    const age = reducedMotion() ? 9 : this.age;
    drawDepthField(ctx, c, { x: 340, y: 210, seed: 19 });
    const u = outBack(clamp01(age / 0.5));
    const y = 212, x0 = 180, x1 = 500;
    ctx.fillStyle = c.gold;
    rr(ctx, 60, y + 96, 560, 16, 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(340, y + 112); ctx.lineTo(296, y + 186); ctx.lineTo(384, y + 186); ctx.closePath();
    ctx.fillStyle = darken(c.gold, 0.3); ctx.fill();
    drawNucleon(ctx, c, x0, y, Math.max(4, 96 * u), 'proton');
    drawFocus(ctx, c, x1, y, Math.max(4, 96 * u), 0.8);
    drawNucleon(ctx, c, x1, y, Math.max(4, 96 * u), 'neutron');
    tag(ctx, c, 'proton', 88, 46, { bg: c.proton, size: 26 });
    tag(ctx, c, 'neutron: no charge', 500, 46, { bg: c.neutron, size: 26 });
    tag(ctx, c, 'about the same mass', 340, 484, { bg: c.warning, size: 26 });
  }
}
