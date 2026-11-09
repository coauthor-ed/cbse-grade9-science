// ConductionStatesScene - companion to blk-l10-s3, "Three States, One Rule".
// The bulb test of lesson 1, three times over, with the same ions.
//   b0  solid     close the switch: the ions stay in their places, the bulb stays dark
//   b1  solution  close the switch: Na+ moves to the negative rod, Cl- to the positive rod, the bulb glows
//   b2  molten    the same with no water: a glass crucible over a burner
//   b3  takeaway  all three in a row, with what they share
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawBench, drawFloor, lerp, mix, mulberry32, rr, darken } from 'simulations/base/kit/SimLook.js';
import { drawIon } from 'simulations/base/kit/SimAtom.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawBurner, drawRig, popIn, tag, chipInk } from './IonBenchKit.js';

const S_SOLID = 0, S_WATER = 1, S_MOLTEN = 2, S_TAKE = 3;
const BENCH = 442;
const LEVER_S = 0.25, GLOW_S = 0.55, FLOW_S = 6;
const N = 12, R = 15;

const LOOSE = [];
{
  const r = mulberry32(8);
  for (let i = 0; i < N; i++) LOOSE.push({ pos: i % 2 === 0, u: (i + 0.5) / N + (r() - 0.5) * 0.05, row: (i * 5 % N + 0.5) / N, ph: r() * 6.28 });
}

export class ConductionStatesScene extends SimScene {
  static BEAT_STEP_MAP = [S_SOLID, S_WATER, S_MOLTEN, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static NOTE_STAGE = 0;
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [{ type: 'button', id: 'switch', label: 'Switch' }];
  static ARIA_LABEL = 'The bulb test with salt in three states. Solid salt: close the switch and the ions stay in their places, so '
    + 'the bulb stays dark. Salt in water: the sodium ions move towards the negative rod, the chloride ions towards the positive '
    + 'rod, and the bulb glows. Molten salt in a crucible over a burner, with no water: the bulb glows too. Last, the three '
    + 'stand in a row: the ions are the same, and only their freedom to move changes.';

  constructor(container, config) {
    super(container, config);
    this._closed = false; this._lever = 0; this._glow = 0; this._flow = 0; this._flowAt = -99; this._foundAt = -9; this._found = false;
  }

  noteRows() { return this.stage === S_TAKE ? [] : [{ text: 'ions drawn far bigger than life' }]; }

  enter() {
    this._closed = false; this._lever = 0; this._glow = 0; this._flow = 0; this._flowAt = -99; this._foundAt = -9; this._found = false;
    this.requestUiUpdate?.();
  }

  isControlHidden() { return this.stage === S_TAKE; }
  onControlChange(id) {
    if (!this._guard(id)) return;
    this._toggle();
    this.requestUiUpdate?.();
  }
  _toggle() {
    this._closed = !this._closed;
    if (this._closed) this._flowAt = this.age;
    this.animateFor?.();
  }
  _lit() { return this._closed && this.stage !== S_SOLID; }

  update(d) {
    const lt = this._closed ? 1 : 0;
    this._lever += Math.sign(lt - this._lever) * Math.min(Math.abs(lt - this._lever), d / LEVER_S);
    const gt = this._lit() && this._lever > 0.9 ? 1 : 0;
    this._glow += Math.sign(gt - this._glow) * Math.min(Math.abs(gt - this._glow), d / GLOW_S);
    if (this._lit() && this.age - this._flowAt < FLOW_S && !reducedMotion()) this._flow += d;
    if (this._closed && this._lever >= 1 && !this._found) {
      if (this.stage !== S_SOLID && this._glow < 1) return;
      this._found = true;
      this._foundAt = this.age;
      if (this.stage !== S_SOLID) this.celebrate(340, 106, 26, { key: `lights-${this.stage}`, lookAt: 'bulb' });
    }
  }

  busy() {
    const lt = this._closed ? 1 : 0, gt = this._lit() ? 1 : 0;
    if (Math.abs(this._lever - lt) > 1e-3 || Math.abs(this._glow - gt) > 1e-3) return true;
    return (this._lit() && this.age - this._flowAt < FLOW_S && !reducedMotion()) || this.age < 1;
  }

  pointerDown(p) {
    if (this.stage !== S_TAKE && p.y < 240) { this._toggle(); this.requestUiUpdate?.(); }
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH + 58);
    if (this.stage === S_TAKE) { this._row(ctx, c); return; }
    drawBench(ctx, c, 40, 640, BENCH);
    const st = this.stage;
    if (st === S_MOLTEN) {
      const lift = 92;
      this._stand(ctx, c, 340, BENCH, lift);
      drawRig(ctx, c, 340, BENCH - lift, 0.84, { ...this._look(c, st), lever: this._lever, glow: this._glow, signs: true });
    } else drawRig(ctx, c, 340, BENCH, 0.98, { ...this._look(c, st), lever: this._lever, glow: this._glow, signs: st === S_WATER });
    tag(ctx, c, ['solid salt', 'salt in water', 'molten salt, 801 \u00b0C'][st], st === S_MOLTEN ? 128 : 112, 400, { bg: c.raised, size: st === S_MOLTEN ? 22 : 24 });
    const ty = st === S_MOLTEN ? 44 : 92;
    if (!this._closed && !this._found) tag(ctx, c, 'tap the switch', 560, ty, { bg: c.warning, scale: popIn(this.age, 0.5) });
    else if (this._found) {
      const lit = st !== S_SOLID;
      tag(ctx, c, lit ? 'bulb glows' : 'bulb stays dark', 560, ty, { bg: lit ? c.good : c.bad, scale: popIn(this.age - this._foundAt, 0, 0.3) });
    }
  }

  _stand(ctx, c, x, y, lift) {
    drawBurner(ctx, c, x, y, 1);
    const metal = mix(c.waste, c.label, 0.2);
    ctx.fillStyle = metal;
    rr(ctx, x - 112, y - lift - 4, 224, 10, 5); ctx.fill();
    ctx.strokeStyle = darken(metal, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.strokeStyle = metal; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + s * 96, y - lift + 4); ctx.lineTo(x + s * 112, y - 4); ctx.stroke();
    }
  }

  _look(c, st) {
    if (st === S_SOLID) return { level: 0, contents: (cx, sy, g) => this._fixed(cx, c, g) };
    if (st === S_WATER) return { level: 0.74, contents: (cx, sy, g) => this._free(cx, c, sy, g) };
    return { level: 0.7, shape: 'tumbler', fill: mix(c.flame, c.warning, 0.3), opacity: 0.62, contents: (cx, sy, g) => this._free(cx, c, sy, g) };
  }

  _fixed(ctx, c, g) {
    for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) {
      drawIon(ctx, c, -90 + i * 36, g.floor - 22 - j * 36, { charge: (i + j) % 2 === 0 ? 1 : -1, r: R });
    }
  }

  _free(ctx, c, sy, g) {
    const y0 = sy + 22, y1 = g.floor - 20, left = -94, right = 94;
    const f = this._flow / FLOW_S;
    for (const q of LOOSE) {
      const u = ((q.u + f * 1.4 * (q.pos ? -1 : 1)) % 1 + 1) % 1;
      drawIon(ctx, c, lerp(left, right, u), lerp(y0, y1, q.row) + Math.sin(u * 9 + q.ph) * 5, { charge: q.pos ? 1 : -1, r: R });
    }
  }

  _row(ctx, c) {
    const bench = 300, s = 0.46;
    drawBench(ctx, c, 10, 670, bench, { h: 28 });
    const rows = [
      { x: 118, st: S_SOLID, name: 'solid', free: 'not free', lit: 0 },
      { x: 340, st: S_WATER, name: 'in water', free: 'free', lit: 1 },
      { x: 562, st: S_MOLTEN, name: 'molten', free: 'free', lit: 1 },
    ];
    rows.forEach((q, i) => {
      const k = popIn(this.age, 0.15 + i * 0.15);
      drawRig(ctx, c, q.x, bench, s, { ...this._look(c, q.st), lever: 1, glow: q.lit });
      tag(ctx, c, q.name, q.x, 360, { size: 26, bg: c.raised, scale: k });
      tag(ctx, c, `ions ${q.free}`, q.x, 414, { size: 24, bg: q.lit ? c.good : c.bad, scale: k });
      tag(ctx, c, q.lit ? 'glows' : 'dark', q.x, 468, { size: 24, bg: q.lit ? c.warning : c.raised, ink: q.lit ? chipInk(c, c.warning) : c.label, scale: k });
    });
  }
}
