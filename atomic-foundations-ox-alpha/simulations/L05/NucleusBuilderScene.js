// NucleusBuilderScene - companion to blk-l05-s7, "Why Does the Nucleus Not Fly Apart?".
//   b0  repel     six protons alone, packed. The learner lets go and they fly apart.
//   b1  buffer    the same six protons. The learner adds neutrons until the hold beats the push.
//   b2  heavier   carbon, iron, uranium: the learner picks one, sees it packed, and reads the counts
//   b3  takeaway  the same three as columns: the gap between neutrons and protons grows
// The push and hold meters are a teaching model: they show which is larger, not a measured force. The
// nuclei of b2 are packed here, because the kit draws a nucleus above 48 nucleons as one ball.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, darken, drawCard, drawMeter, mulberry32, outBack, rr, vectorArrow } from 'simulations/base/kit/SimLook.js';
import { ease, reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawFocus, drawNucleon, drawNucleus } from 'simulations/base/kit/SimAtom.js';
import { tag } from '../L04/AtomLabels.js';

const TAU = Math.PI * 2;
const S_REPEL = 0, S_BUFFER = 1, S_HEAVY = 2, S_TAKE = 3;
const N0 = { x: 340, y: 228 };
const R0 = 62;                           // proton radius on b0
const NEED = 6;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const ELS = {
  c: { name: 'carbon', p: 6, n: 6 },
  fe: { name: 'iron', p: 26, n: 30 },
  u: { name: 'uranium', p: 92, n: 146 },
};
const push = (n) => 0.85 - 0.15 * (n / NEED);
const hold = (n) => 0.1 + 0.66 * (n / NEED);

const PACK = new Map();
function packOf(key, p, n) {
  if (PACK.has(key)) return PACK.get(key);
  const N = p + n, rnd = mulberry32(7);
  const kinds = [...Array(p).fill('proton'), ...Array(n).fill('neutron')];
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; }
  const b = 1 / (0.65 + 0.95 * Math.sqrt(N));
  const balls = kinds.map((kind, i) => {
    const rho = Math.sqrt((N - i - 0.5) / N) * (1 - b), a = i * GOLDEN;
    return { x: Math.cos(a) * rho, y: Math.sin(a) * rho, kind };
  });
  const pk = { b, balls };
  PACK.set(key, pk);
  return pk;
}

export class NucleusBuilderScene extends SimScene {
  static BEAT_STEP_MAP = [S_REPEL, S_BUFFER, S_HEAVY, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'button', id: 'go', label: 'Let go' },
    { type: 'button', id: 'add', label: 'Add a neutron' },
    { type: 'button', id: 'take', label: 'Take one off' },
    { type: 'segmented', id: 'el', label: 'Element', value: 'c', options: [
      { value: 'c', label: 'carbon' }, { value: 'fe', label: 'iron' }, { value: 'u', label: 'uranium' }] },
  ];
  static ARIA_LABEL = 'Six protons packed together push each other apart and fly away when you let go. With the same six protons you add neutrons, and the hold of the nuclear force grows until it beats the push, at six neutrons. Then you pick carbon, iron or uranium and see its nucleus packed: 6 and 6, 26 and 30, 92 and 146. Last, three pairs of columns show the extra neutrons growing with the number of protons.';

  constructor(container, config) {
    super(container, config);
    this._flew = null;
    this._n = 0;
    this._el = 'c';
    this._found = false;
  }

  enter() {
    this._flew = null;
    this._n = 0;
    this._el = 'c';
    this._found = false;
  }

  isControlHidden(id) {
    if (id === 'go') return this.stage !== S_REPEL;
    if (id === 'add' || id === 'take') return this.stage !== S_BUFFER;
    return this.stage !== S_HEAVY;
  }

  isControlDisabled(id) {
    if (id === 'add') return this._n >= 8;
    if (id === 'take') return this._n <= 0;
    return false;
  }

  getControlValue(id) { return id === 'el' ? this._el : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'go') this._toggleGo();
    if (id === 'add') this._setN(this._n + 1);
    if (id === 'take') this._setN(this._n - 1);
    if (id === 'el') { this._el = String(v); this._t0 = this.age; }
    this.requestUiUpdate?.();
  }

  _toggleGo() { this._flew = this._flew == null ? this.age : null; }

  _setN(n) {
    this._n = Math.max(0, Math.min(8, n));
    if (hold(this._n) >= push(this._n) && !this._found) {
      this._found = true;
      this.celebrate(230, 240, 30, { key: 'hold', lookAt: true });
    }
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_REPEL) this._toggleGo();
    if (this.stage === S_BUFFER && p.x < 440) this._setN(this._n + 1);
    this.requestUiUpdate?.();
  }

  busy() {
    if (this.stage === S_REPEL) return this._flew != null && this.age - this._flew < 1.1;
    if (this.stage === S_HEAVY) return this._t0 != null && this.age - this._t0 < 0.6;
    if (this.stage === S_TAKE) return this.age < 1.3;
    return false;
  }

  draw(ctx, c) {
    if (this.stage === S_REPEL) this._repel(ctx, c);
    else if (this.stage === S_BUFFER) this._buffer(ctx, c);
    else if (this.stage === S_HEAVY) this._heavy(ctx, c);
    else this._take(ctx, c);
  }

  _repel(ctx, c) {
    drawDepthField(ctx, c, { x: N0.x, y: N0.y, seed: 15 });
    const t = this._flew == null ? 0 : reducedMotion() ? 1 : ease.outCubic(clamp01((this.age - this._flew) / 1));
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i * TAU) / 6;
      const d = R0 * 1.15 + t * 300;
      const x = N0.x + Math.cos(a) * d, y = N0.y + Math.sin(a) * d;
      drawNucleon(ctx, c, x, y, R0, 'proton');
      if (!t) vectorArrow(ctx, c, N0.x + Math.cos(a) * (d + R0 * 0.2), N0.y + Math.sin(a) * (d + R0 * 0.2), { angle: a, length: R0 + 42, col: c.warning, width: 9, head: 18 });
    }
    tag(ctx, c, t ? 'they fly apart' : 'like charges push apart', 340, 482, { bg: c.warning, size: 28 });
  }

  _buffer(ctx, c) {
    const n = this._n, on = hold(n) >= push(n), x = 226, y = 232, r = 176;
    drawDepthField(ctx, c, { x, y, seed: 16 });
    drawFocus(ctx, c, x, y, r * 0.85, on ? 0.9 : 0.3);
    drawNucleus(ctx, c, x, y, { p: 6, n, r: r * (0.74 + 0.02 * n), seed: 4 });
    const px = 448, w = 214;
    drawCard(ctx, c, px, 96, w, 268);
    tag(ctx, c, 'push', px + w / 2, 134, { bg: c.warning });
    drawMeter(ctx, c, px + 18, 168, w - 36, 24, push(n), { col: c.warning });
    tag(ctx, c, 'hold', px + w / 2, 240, { bg: on ? c.good : c.raised });
    drawMeter(ctx, c, px + 18, 274, w - 36, 24, hold(n), { col: on ? c.good : c.s5 });
    tag(ctx, c, `${n} neutrons`, x, 40, { size: 28 });
    if (!n) tag(ctx, c, 'tap to add neutrons', 556, 40, { bg: c.warning });
    tag(ctx, c, on ? 'nuclear force holds' : 'not held yet', 340, 472, { bg: on ? c.good : c.raised, size: 28 });
  }

  _packed(ctx, c, E, x, y, R) {
    const pk = packOf(E.name, E.p, E.n);
    const r = pk.b * R;
    if (E.p + E.n <= 48) { drawNucleus(ctx, c, x, y, { p: E.p, n: E.n, r: R, seed: 6 }); return; }
    pk.balls.forEach((q) => drawNucleon(ctx, c, x + q.x * R, y + q.y * R, r * 1.12, q.kind, { rimDark: true }));
  }

  _heavy(ctx, c) {
    const E = ELS[this._el], x = 232, y = 228;
    const u = this._t0 == null || reducedMotion() ? 1 : outBack(clamp01((this.age - this._t0) / 0.45));
    drawDepthField(ctx, c, { x, y, seed: 17 });
    const R = 80 + 112 * Math.sqrt((E.p + E.n) / 238);
    drawFocus(ctx, c, x, y, R, 0.4);
    this._packed(ctx, c, E, x, y, Math.max(20, R * u));
    tag(ctx, c, E.name, 532, 92, { size: 34 });
    tag(ctx, c, `${E.p} protons`, 532, 186, { bg: c.proton, size: 30 });
    tag(ctx, c, `${E.n} neutrons`, 532, 262, { bg: c.neutron, size: 30 });
    tag(ctx, c, E.n === E.p ? 'equal numbers' : `${E.n - E.p} more neutrons`, 532, 338, { bg: c.warning });
  }

  _take(ctx, c) {
    const age = reducedMotion() ? 9 : this.age;
    drawDepthField(ctx, c, { x: 340, y: 240, seed: 18 });
    const base = 410, scale = 2.2, list = [ELS.c, ELS.fe, ELS.u];
    list.forEach((E, i) => {
      const cx = 130 + i * 210, u = ease.outCubic(clamp01((age - i * 0.18) / 0.7));
      const col = (x, v, tone) => {
        const h = Math.max(10, v * scale * u);
        rr(ctx, x, base - h + 4, 62, h, 10); ctx.fillStyle = darken(tone, 0.32); ctx.fill();
        rr(ctx, x, base - h, 62, h, 10); ctx.fillStyle = tone; ctx.fill();
        tag(ctx, c, String(v), x + 31, base - h - 24, { bg: c.raised, size: 26 });
      };
      col(cx - 66, E.p, c.proton);
      col(cx + 4, E.n, c.neutron);
      tag(ctx, c, E.name, cx, 444, { size: 26 });
    });
    tag(ctx, c, 'protons', 96, 42, { bg: c.proton });
    tag(ctx, c, 'neutrons', 254, 42, { bg: c.neutron });
    tag(ctx, c, 'more protons, even more neutrons', 340, 494, { bg: c.warning, size: 24 });
  }
}
