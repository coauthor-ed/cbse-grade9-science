// SpiralDeathScene - companion to blk-l06-s1, "Why Does an Atom Not Collapse?".
//   b0  orbit    the Earth round the Sun beside an electron round a nucleus: the same picture
//   b1  physics  one orbiter. The learner switches its charge on and off: with a charge it gives out
//                light, and its energy drains. Without, it keeps going.
//   b2  spiral   the learner lets the electron run: it spirals in, shedding waves, and hits the nucleus
// Path: r = r0 (1 - t/T)^(1/3), the shape the older physics gives, in slow motion (the chip says so).
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, drawMeter, inkOn, mix } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawBall, drawCharge, drawDepthField, drawElectron, drawFocus, drawNucleus, drawShell } from 'simulations/base/kit/SimAtom.js';
import { tag } from '../L04/AtomLabels.js';

const TAU = Math.PI * 2;
const S_ORBIT = 0, S_PHYS = 1, S_SPIRAL = 2;
const B = { x: 340, y: 226, R: 186 };
const RUN = 4.2;

const spiralR = (t) => B.R * (1 - Math.min(1, t / RUN) * 0.985) ** (1 / 3);

export class SpiralDeathScene extends SimScene {
  static BEAT_STEP_MAP = [S_ORBIT, S_PHYS, S_SPIRAL].map((i) => [{ idx: i, dwellMs: null }]);
  static IRIS = true;
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'segmented', id: 'charge', label: 'The moving thing', value: 'on', options: [
      { value: 'off', label: 'no charge' }, { value: 'on', label: 'has a charge' }] },
    { type: 'button', id: 'run', label: 'Let it go' },
  ];
  static ARIA_LABEL = 'The Earth going round the Sun beside an electron going round a nucleus. Then one orbiter: with a charge it gives out waves of light and its energy falls; with no charge it keeps going. Then the electron is let go, gives out wave after wave, spirals inward and falls into the nucleus.';

  constructor(container, config) {
    super(container, config);
    this._charged = false;
    this._drain = 0;
    this._t = 0;
    this._on = false;
    this._foundC = false;
    this._done = false;
  }

  enter() {
    this._charged = false;
    this._drain = 0;
    this._t = 0;
    this._on = false;
    this._foundC = false;
    this._done = false;
  }

  isControlHidden(id) {
    if (id === 'charge') return this.stage !== S_PHYS;
    if (id === 'run') return this.stage !== S_SPIRAL;
    return false;
  }

  isControlDisabled(id) { return id === 'run' && this._on; }
  getControlValue(id) { return id === 'charge' ? (this._charged ? 'on' : 'off') : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'charge') {
      this._charged = String(v) === 'on';
      this._drain = 0;
      this._at = this.age;
    }
    if (id === 'run') this._go();
    this.requestUiUpdate?.();
  }

  _go() {
    if (this._on) return;
    this._t = 0; this._done = false;
    if (reducedMotion()) { this._t = RUN; this._done = true; return; }
    this._on = true;
  }

  pointerDown() {
    if (this.stage === S_SPIRAL) this._go();
    if (this.stage === S_PHYS) this.onControlChange('charge', this._charged ? 'off' : 'on');
  }

  update(d) {
    const st = this.stage;
    if (st === S_PHYS && this._charged) {
      this._drain = Math.min(1, this._drain + d / 3.2);
      if (this._drain > 0.5 && !this._foundC) { this._foundC = true; this.celebrate(B.x, B.y, 12, { key: 'charge', lookAt: true }); }
    }
    if (st === S_SPIRAL && this._on) {
      this._t += d;
      if (this._t >= RUN) { this._t = RUN; this._on = false; this._done = true; this.requestUiUpdate?.(); }
    }
  }

  busy() {
    if (this.stage === S_ORBIT) return this.age < 5;
    if (this.stage === S_PHYS) return this.age < 5 || (this._charged && this._drain < 1) || (this._at != null && this.age - this._at < 4);
    return this._on;
  }

  _waves(ctx, c, x, y, t, k = 1) {
    if (reducedMotion()) return;
    for (let i = 0; i < 4; i++) {
      const u = (t * 0.9 + i / 4) % 1;
      ctx.beginPath(); ctx.arc(x, y, 24 + u * 200, 0, TAU);
      ctx.strokeStyle = alpha(c.warning, (1 - u) * 0.75 * k); ctx.lineWidth = 6; ctx.stroke();
    }
  }

  draw(ctx, c, t) {
    const th = reducedMotion() ? 0.8 : this.age * 2.6;     // orbits are drawn from the clock: nothing to resume
    if (this.stage === S_ORBIT) {
      drawDepthField(ctx, c, { x: 340, y: 230, seed: 31 });
      // The Sun and the Earth.
      const s = { x: 176, y: 226 }, n = { x: 504, y: 226 }, R = 138;
      drawShell(ctx, c, s.x, s.y, R, { band: 0, line: 3 });
      drawFocus(ctx, c, s.x, s.y, 44, 1);
      drawBall(ctx, c, s.x, s.y, 44, c.gold);
      const ex = s.x + Math.cos(th * 0.6) * R, ey = s.y + Math.sin(th * 0.6) * R;
      drawBall(ctx, c, ex, ey, 20, mix(c.s1, c.s3, 0.35));
      drawShell(ctx, c, n.x, n.y, R, { band: 0, line: 3 });
      drawNucleus(ctx, c, n.x, n.y, { p: 3, n: 4, r: 30, seed: 3 });
      const nx = n.x + Math.cos(th) * R, ny = n.y + Math.sin(th) * R;
      drawElectron(ctx, c, nx, ny, 15);
      tag(ctx, c, 'Earth and Sun', s.x, 424, { size: 26 });
      tag(ctx, c, 'electron and nucleus', n.x, 424, { size: 24 });
      tag(ctx, c, 'the same picture?', 340, 484, { bg: c.warning, size: 26 });
      return;
    }
    drawDepthField(ctx, c, { x: B.x, y: B.y, seed: 32 });
    if (this.stage === S_PHYS) {
      const R = B.R - 8;
      const ch = this._charged;
      drawShell(ctx, c, B.x, B.y, R, { band: 0, line: 3.5 });
      drawNucleus(ctx, c, B.x, B.y, { p: 3, n: 4, r: 30, seed: 3 });
      const x = B.x + Math.cos(th) * R, y = B.y + Math.sin(th) * R;
      if (ch) this._waves(ctx, c, x, y, this.clock);
      if (ch) { drawElectron(ctx, c, x, y, 18); drawCharge(ctx, c, x, y, 18, -1, inkOn(c, c.electron)); }
      else drawBall(ctx, c, x, y, 18, c.neutron);
      tag(ctx, c, ch ? 'gives out light' : 'no light', 340, 30, { bg: ch ? c.warning : c.raised, size: 26 });
      drawMeter(ctx, c, 200, 462, 280, 24, 1 - this._drain * 0.75, { col: ch ? c.warning : c.good });
      tag(ctx, c, 'energy', 128, 474, { size: 22 });
      return;
    }
    const t0 = this._t;
    // The path so far, thick and fading back.
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    let a = 0, last = null;
    const steps = Math.floor(t0 / 0.02);
    for (let i = 0; i <= steps; i++) {
      const tt = i * 0.02, rr0 = spiralR(tt);
      a += 0.02 * 2.6 * (B.R / rr0) ** 1.5;
      const p = [B.x + Math.cos(a) * rr0, B.y + Math.sin(a) * rr0];
      if (last) {
        ctx.strokeStyle = alpha(c.electron, 0.2 + 0.6 * (i / Math.max(1, steps)));
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
      }
      last = p;
    }
    ctx.lineCap = 'butt';
    if (!steps) drawShell(ctx, c, B.x, B.y, B.R, { band: 0, line: 3.5 });
    const x = last ? last[0] : B.x + B.R, y = last ? last[1] : B.y;
    if (this._on) this._waves(ctx, c, x, y, this.clock, 0.9);
    drawNucleus(ctx, c, B.x, B.y, { p: 3, n: 4, r: 30, seed: 3 });
    if (!this._done) { drawElectron(ctx, c, x, y, 15, { focus: 1 }); drawCharge(ctx, c, x, y, 15, -1, inkOn(c, c.electron)); }
    if (this._done) tag(ctx, c, 'the atom has collapsed', 340, 484, { bg: c.bad, size: 26 });
    else if (!this._on && !steps) tag(ctx, c, 'tap to let it go', 340, 484, { bg: c.warning, size: 26 });
    else tag(ctx, c, 'slowed down: really a tiny fraction of a second', 340, 490, { size: 20 });
  }
}
