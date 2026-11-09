// IsotopeAppsScene - companion to blk-l13-s5, "What Isotopes Are Used For".
//   b0  fuel      a uranium-235 nucleus: send a neutron, it splits and gives out energy
//   b1  medicine  the thyroid takes in iodine-131 just as it takes in ordinary iodine
//   b2  clock     a bone: slide the years and carbon-14 decays, half gone at about 5,700
//   b3  takeaway  one atom: its electrons say where it goes, its nucleus says what it does
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawCard, darken, lighten, mix, rr, ellipse, mulberry32, lerp } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { reducedMotion, ease } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawNucleus, drawNucleon, drawAtom, drawBall, drawFocus } from 'simulations/base/kit/SimAtom.js';
import { say, tag, popIn } from '../L07/AtomBoard.js';
import { span } from '../L12/MolKit.js';

const S_FUEL = 0, S_MED = 1, S_CLOCK = 2, S_TAKE = 3;
const HIT_S = 1, SPLIT_S = 1.2, FLOW_S = 3.4, HALF = 5700, BEADS = 28;
const BEAD = (() => {
  const rnd = mulberry32(14), out = [];
  for (let i = 0; i < BEADS; i++) {
    const row = i % 3, k = Math.floor(i / 3);
    out.push({ x: 148 + k * 40 + (row === 1 ? 20 : 0), y: 118 + row * 52, keep: rnd() });
  }
  const order = out.map((b, i) => i).sort((a, b) => out[a].keep - out[b].keep);
  order.forEach((idx, rank) => { out[idx].rank = (rank + 0.5) / BEADS; });
  return out;
})();

const SPOTS = [[252, 164], [224, 222], [280, 232], [206, 286], [256, 296], [232, 346]];

export class IsotopeAppsScene extends SimScene {
  static BEAT_STEP_MAP = [S_FUEL, S_MED, S_CLOCK, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'fire', label: 'Send a neutron' },
    { type: 'button', id: 'give', label: 'Give iodine-131' },
    { type: 'slider', id: 'years', label: 'Years since death', min: 0, max: 17100, step: 1900, value: 0, suffix: ' years' },
  ];
  static ARIA_LABEL = 'A neutron hits a uranium-235 nucleus, which splits in two and gives out energy. In the neck, the thyroid gland takes in '
    + 'iodine-131 just as it takes in ordinary iodine. In an old bone, a slider adds years: the carbon-14 decays and about half is left after '
    + '5,700 years. Last, one atom: its electrons are the same as the ordinary atom, so it goes to the same places, and its nucleus is different.';

  constructor(container, config) {
    super(container, config);
    this._at = null;
    this._years = 0;
    this._found = false;
  }

  enter() { this._at = null; this._years = 0; this._found = false; this.requestUiUpdate?.(); }

  _t() { return this._at == null ? 0 : reducedMotion() ? 99 : this.age - this._at; }

  busy() {
    if (reducedMotion()) return false;
    if (this.age < 1.2) return true;
    if (this._at == null) return false;
    return this.stage === S_FUEL ? this._t() < HIT_S + SPLIT_S + 0.6 : this.stage === S_MED ? this._t() < FLOW_S + 0.3 : false;
  }

  isControlHidden(id) { return { fire: S_FUEL, give: S_MED, years: S_CLOCK }[id] !== this.stage; }
  isControlDisabled(id) { return id !== 'years' && this._at != null; }
  getControlValue(id) { return id === 'years' ? this._years : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'years') {
      this._years = Number(v);
      if (this._years >= HALF && !this._found) {
        this._found = true;
        this.celebrate(340, 410, 24, { key: 'half-left', lookAt: 'scene' });
      }
    } else this._go();
    this.requestUiUpdate?.();
  }

  pointerDown() { if ((this.stage === S_FUEL || this.stage === S_MED) && this._at == null) this._go(); }

  _go() {
    this._at = this.age;
    this.requestUiUpdate?.();
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: 340, y: 230, seed: 31, n: 8 });
    if (this.stage === S_FUEL) this._fuel(ctx, c);
    else if (this.stage === S_MED) this._med(ctx, c);
    else if (this.stage === S_CLOCK) this._clock(ctx, c);
    else this._take(ctx, c);
  }

  _fuel(ctx, c) {
    const t = this._t(), CX = 340, CY = 240;
    const inU = ease.inOutCubic(span(t, 0, HIT_S)), sp = ease.outCubic(span(t, HIT_S, HIT_S + SPLIT_S));
    tag(ctx, c, 'uranium-235', 340, 38, { size: 30 });
    if (sp <= 0) {
      drawNucleus(ctx, c, CX, CY, { p: 92, n: 143, r: 150, solid: true, label: '235' });
      if (this._at == null) {
        drawNucleon(ctx, c, 60, CY, 26, 'neutron');
        tag(ctx, c, 'tap: send a neutron', 340, 460, { bg: c.warning, size: 26 });
      } else drawNucleon(ctx, c, lerp(60, CX - 150, inU), CY, 26, 'neutron');
      return;
    }
    drawFocus(ctx, c, CX, CY, 90 + 110 * sp, 1 - sp * 0.4);
    const d = sp * 176;
    drawNucleus(ctx, c, CX - d, CY - sp * 30, { p: 40, n: 58, r: 110, solid: true, label: '' });
    drawNucleus(ctx, c, CX + d, CY + sp * 30, { p: 52, n: 82, r: 122, solid: true, label: '' });
    [[-0.5, -0.5], [0.5, -0.72], [0.1, 0.8]].forEach(([ux, uy], i) => drawNucleon(ctx, c, CX + ux * 90 * sp + i * 8, CY + uy * 196 * sp, 24, 'neutron'));
    const p = popIn(t, HIT_S + SPLIT_S - 0.2);
    if (p > 0) tag(ctx, c, 'energy for electricity', 340, 468, { bg: c.warning, size: 28, scale: Math.min(1.05, p) });
  }

  _med(ctx, c) {
    const L = lookOf(), t = this._t();
    // the neck from the front, the windpipe, and the gland lying across it like a butterfly
    const neck = mix(c.s8, c.bgSurface, 0.5);
    rr(ctx, 176, -20, 328, 560, 50); ctx.fillStyle = neck; ctx.fill();
    ctx.strokeStyle = darken(neck, 0.3); ctx.lineWidth = 4 * L.rim; ctx.stroke();
    const pipe = mix(c.glass, c.bgSurface, 0.4);
    rr(ctx, 298, -20, 84, 560, 16); ctx.fillStyle = pipe; ctx.fill();
    for (let y = 16; y < 520; y += 40) { rr(ctx, 298, y, 84, 13, 6); ctx.fillStyle = darken(pipe, 0.2); ctx.fill(); }
    const tone = mix(c.s4, c.s6, 0.4), dk = darken(tone, 0.32);
    const lobe = (x, a) => {
      ellipse(ctx, x, 244, 72, 136, a); ctx.fillStyle = tone; ctx.fill();
      ctx.strokeStyle = dk; ctx.lineWidth = 5 * L.rim; ctx.stroke();
      ellipse(ctx, x - 16, 170, 20, 34, a); ctx.fillStyle = lighten(tone, 0.24); ctx.fill();
    };
    rr(ctx, 300, 284, 80, 52, 18); ctx.fillStyle = tone; ctx.fill(); ctx.strokeStyle = dk; ctx.lineWidth = 5 * L.rim; ctx.stroke();
    lobe(254, 0.2); lobe(426, -0.2);
    rr(ctx, 296, 288, 88, 44, 16); ctx.fillStyle = tone; ctx.fill();
    tag(ctx, c, 'thyroid gland', 340, 34, { size: 28 });
    const N = 12;
    for (let i = 0; i < N; i++) {
      const hot = i % 4 < 2, u = ease.inOutCubic(span(t, i * 0.2, i * 0.2 + 1.3));
      if (this._at == null || u <= 0) continue;
      const side = i % 2 ? 1 : -1;
      const [ox, ty] = SPOTS[Math.floor(i / 2)], tx = side < 0 ? ox : 680 - ox;
      const sx = side < 0 ? -30 : 710, sy = 430 - i * 10;
      const x = lerp(sx, tx, u), y = lerp(sy, ty, u);
      drawBall(ctx, c, x, y, 22, hot ? c.s2 : c.s1, { focus: hot && u >= 1 ? 0.7 : 0 });
      if (u >= 1) say(ctx, c, 'I', x, y + 1, { size: 26, col: c.bgDeep });
    }
    if (this._at == null) tag(ctx, c, 'tap: give iodine-131', 340, 470, { bg: c.warning, size: 26 });
    else if (t >= FLOW_S) {
      tag(ctx, c, 'iodine', 96, 470, { size: 26, bg: c.s1 });
      tag(ctx, c, 'iodine-131', 570, 470, { size: 26, bg: c.s2 });
    }
  }

  _bone(ctx, c) {
    const L = lookOf();
    const tone = mix(mix(c.s2, c.bgSurface, 0.6), c.waste, 0.2);
    const dk = darken(tone, 0.34);
    const shape = (grow) => {
      for (const [x, y] of [[96, 100], [96, 216], [584, 100], [584, 216]]) { ctx.beginPath(); ctx.arc(x, y, 62 + grow, 0, 7); ctx.fill(); }
      rr(ctx, 90, 76 - grow, 500, 164 + grow * 2, 26); ctx.fill();
    };
    ctx.fillStyle = dk; shape(5 * L.rim);
    ctx.fillStyle = tone; shape(0);
  }

  _clock(ctx, c) {
    this._bone(ctx, c);
    const y = this._years, left = 0.5 ** (y / HALF);
    for (const b of BEAD) {
      const alive = b.rank <= left;
      drawBall(ctx, c, b.x, b.y, 17, alive ? c.s3 : c.s6, { dim: alive ? 0 : 0.72 });
    }
    drawCard(ctx, c, 40, 300, 600, 170, 1, { accent: this._found ? c.good : c.stroke });
    say(ctx, c, 'years', 180, 344, { size: 26, col: c.labelMuted });
    say(ctx, c, y.toLocaleString('en-IN'), 180, 406, { size: 60 });
    say(ctx, c, 'carbon-14 left', 500, 344, { size: 26, col: c.labelMuted });
    say(ctx, c, `${Math.round(left * 100)}%`, 500, 406, { size: 60, col: c.s3ink });
    if (y === 0) tag(ctx, c, 'move the slider', 340, 34, { bg: c.warning, size: 25 });
    else tag(ctx, c, 'carbon-14 in the bone', 340, 34, { size: 25 });
  }

  _take(ctx, c) {
    drawAtom(ctx, c, 196, 256, { p: 6, n: 8, shells: [2, 4], radius: 176, nucleusR: 64, er: 14, focusShell: 'outer', seed: 9 });
    say(ctx, c, 'carbon-14', 196, 470, { size: 30 });
    const row = (y, big, small, tone, delay) => {
      const p = popIn(this.age, delay);
      if (p <= 0) return;
      drawCard(ctx, c, 392, y, 274, 190, Math.min(1, p), { accent: tone });
      say(ctx, c, big, 529, y + 62, { size: 30, col: tone });
      say(ctx, c, small, 529, y + 128, { size: 26 });
    };
    row(40, 'same electrons', 'same reactions', c.electron, 0.3);
    row(262, 'different nucleus', 'a new use', c.proton, 0.7);
  }
}
