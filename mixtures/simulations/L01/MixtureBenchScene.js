// MixtureBenchScene - three beakers on a bench, a hand lens, and a laser you aim across them.
//
// Three mounts, told apart by the beat count (the only thing the scene sees):
//   3  blk-l01-s01, the hook. Look at each beaker through a lens: grains in B, none in C. The laser
//      and the clock arrive on the last beat, unlit, so the predict that follows stays open.
//   0  blk-l01-s02, the predict (role: setup). Beakers and an unlit pointer. Nothing to press.
//   4  blk-l01-s03, the answer. b0 aim the beam at each beaker. b1 the close-up: light is scattered
//      by particles, and some of it reaches your eye; dissolved salt has none big enough.
//      b2 the two words on the beakers. b3 milk looks uniform and the beam says it is not.
//
// `scatters` per beaker is the whole model: every drawn difference comes from it.
// The clock is only shown here: the settling test belongs to SettleFilterScene.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, blob, clamp01, darken, drawBackdrop, drawDepth, drawShadow, lighten, mix,
  mulberry32, outBack, pill,
} from 'simulations/base/kit/SimLook.js';
import { drawIcon } from 'simulations/base/kit/SimIcons.js';
import {
  BENCH, BENCH3,
  beakerBox, benchLiquid, liquidLevel, liquidMid, scatterGrains,
  drawBenchBackdrop, drawBeaker, drawPaperLabel, drawLiquid, drawChalk, drawClock, drawBeam, drawPointer,
} from './MixtureBenchKit.js';

// Phone: the scene is under half size, so small text is raised to read at about 10 px.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const SIZE = { w: BENCH3.w, h: BENCH3.h };
const FRAC = BENCH3.frac;
const BEAKERS = [
  { key: 'A', cx: BENCH3.cx.A, scatters: false },
  { key: 'B', cx: BENCH3.cx.B, scatters: true },
  { key: 'C', cx: BENCH3.cx.C, scatters: true },
].map((b) => {
  const box = beakerBox(b.cx, SIZE);
  return { ...b, box, head: box.x + box.w + 10, wall: box.x - 22, midY: liquidMid(box, FRAC) };
});
const byKey = (k) => BEAKERS.find((b) => b.key === k) ?? BEAKERS[0];
const DEPTH = BEAKERS[0].box.floor - liquidLevel(BEAKERS[0].box, FRAC);

const GRAIN_N = 32;
const BEAM = { thin: 3, glow: 16, core: 4, patch: 18 };
const CLOCK = { x: 56, y: 104, r: 30 };
const LENS = { y: 262, r: 122 };
const ZOOM = { x: 340, y: 228, r: 200, beam: 170, eye: 366 };
const POP_S = 0.45;
const ZOOM_S = 1.3;

const S_LOOK = 0, S_LENS = 1, S_TOOLS = 2;
const S_SEE = 0, S_WHY = 1, S_WORDS = 2, S_MILK = 3;
const MAP_HOOK = [S_LOOK, S_LENS, S_TOOLS].map((i) => [{ idx: i, dwellMs: null }]);
const MAP_ANSWER = [S_SEE, S_WHY, S_WORDS, S_MILK].map((i) => [{ idx: i, dwellMs: null }]);

export class MixtureBenchScene extends SimScene {
  static BEAT_STEP_MAP = MAP_HOOK;
  static BEAT_MAPS = { 3: MAP_HOOK, 4: MAP_ANSWER };
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL =
    'Three labelled glass beakers stand on a bench: A clear, B cloudy with chalk grains, C evenly cloudy with milk. '
    + 'A hand lens shows grains in B and none in C. A red laser pointer sends its beam through one beaker at a time: '
    + 'the path shows in B and in C and not in A, because particles in B and C scatter the light.';
  static CONTROLS = [
    { type: 'segmented', id: 'look', label: 'Hand lens', value: 'off', options: [
      { value: 'off', label: 'Off' }, { value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }] },
    { type: 'segmented', id: 'aim', label: 'Aim the beam at', value: 'B', options: ['A', 'B', 'C'] },
  ];

  constructor(container, config) {
    super(container, config);
    this._grains = scatterGrains(GRAIN_N, 7, { depth: DEPTH, rMin: 2.6, rMax: 4.6 });
    this._aim = 'B';
    this._look = 'off';
    this._seen = new Set();          // beakers looked at, and beakers the beam has crossed
    this._lit = new Set(['B']);          // the beam opens on B
    this._foundLook = false;
    this._foundBeam = false;
    this._zoomT = ZOOM_S;
    this._lensT = 1;
  }

  get _mount() {
    if (this.beatCount === 4) return 'answer';
    if (this.beatCount === 3) return 'hook';
    return 'setup';
  }

  isControlHidden(id) {
    if (id === 'look') return !(this._mount === 'hook' && this.stage === S_LENS);
    if (id === 'aim') return this._mount !== 'answer';
    return false;
  }

  getControlValue(id) {
    if (id === 'look') return this._look;
    if (id === 'aim') return this._aim;
    return super.getControlValue(id);
  }

  enter(stage) {
    this._look = 'off';
    this._aim = stage === S_MILK && this.beatCount === 4 ? 'C' : 'B';
    this._zoomT = stage === S_WHY ? 0 : ZOOM_S;
  }

  update(d) {
    if (this._zoomT < ZOOM_S) this._zoomT = Math.min(ZOOM_S, this._zoomT + d);
    if (this._lensT < POP_S) this._lensT = Math.min(POP_S, this._lensT + d);
  }

  busy() { return this._zoomT < ZOOM_S || this._lensT < POP_S; }

  // -- controls ---------------------------------------------------------------------------------
  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'look') this._setLook(String(v));
    if (id === 'aim') this._setAim(String(v));
    this.requestUiUpdate?.();
  }

  _setLook(k) {
    this._look = k;
    this._lensT = 0;
    if (k === 'off') return;
    this._seen.add(k);
    if (!this._foundLook && this._seen.has('B') && this._seen.has('C') && k === 'C') {
      this._foundLook = true;
      this.celebrate(byKey('C').cx, LENS.y, 22, { key: 'no-grains', lookAt: true });
    }
  }

  _setAim(k) {
    this._aim = k;
    this._zoomT = this.stage === S_WHY ? 0 : ZOOM_S;
    this._lit.add(k);
    if (!this._foundBeam && this._lit.size === 3 && this.stage === S_SEE) {
      this._foundBeam = true;
      this.celebrate(byKey('C').cx, byKey('C').midY, 22, { key: 'c-shows-beam', lookAt: true });
    }
  }

  pointerDown(p) {
    const b = BEAKERS.find((x) => p.x > x.box.x - 8 && p.x < x.box.x + x.box.w + 8 && p.y > x.box.y && p.y < BENCH.y);
    if (!b) return;
    if (!this.isControlHidden('look')) this._setLook(this._look === b.key ? 'off' : b.key);
    else if (!this.isControlHidden('aim')) this._setAim(b.key);
    this.requestUiUpdate?.();
    this.animateFor(400);
  }

  // -- drawing ----------------------------------------------------------------------------------
  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawDepth(ctx, c);
    drawBenchBackdrop(ctx, c, { wallRect: { x: 12, y: 112, w: 656, h: 280 } });
    const answer = this._mount === 'answer';
    const lit = answer && this.stage !== S_WHY;
    for (const b of BEAKERS) this._beaker(ctx, c, b, lit && b.key === this._aim);
    if (answer || this._mount === 'setup' || this.stage === S_TOOLS) this._laser(ctx, c, lit);
    if (this._mount === 'hook' && this.stage === S_TOOLS) this._clock(ctx, c);
    if (answer && this.stage >= S_WORDS) this._tags(ctx, c);
    if (this._mount === 'hook' && this._look !== 'off' && this.stage === S_LENS) this._lens(ctx, c);
    if (answer && this.stage === S_WHY) this._zoom(ctx, c);
  }

  _beaker(ctx, c, b, lit) {
    const look = benchLiquid(c, b.key);
    drawBeaker(ctx, c, b.box, {});
    drawLiquid(ctx, c, b.box, { frac: FRAC, fill: look.fill, alphaMix: look.mix });
    if (b.key === 'B') {
      drawChalk(ctx, c, b.box, this._grains, { depth: DEPTH });
    }
    drawPaperLabel(ctx, c, b.key, b.cx, BENCH.y + 24, undefined, fs(22));
    if (!lit) return;
    drawBeam(ctx, c, b.box, {
      headX: b.head, wallX: b.wall, insideColor: c.bad, inside: b.scatters, y: b.midY, ...BEAM,
    });
    if (b.key === 'B') this._glints(ctx, c, b);
  }

  /** Grains the beam passes through flash brighter: each one is throwing light sideways. */
  _glints(ctx, c, b) {
    const top = b.box.floor - DEPTH;
    for (const g of this._grains) {
      const y = top + g.gy * DEPTH;
      if (Math.abs(y - b.midY) > 9) continue;
      const x = b.box.x + 6 + g.gx * b.box.iw;
      ctx.fillStyle = alpha(lighten(c.bad, 0.55), 0.95);
      ctx.beginPath(); ctx.arc(x, b.midY, g.r + 1, 0, Math.PI * 2); ctx.fill();
    }
  }

  /** The pointer on its stand. It arrives with a spring on the hook's last beat. */
  _laser(ctx, c, lit) {
    const b = byKey(this._mount === 'answer' ? this._aim : 'B');
    const k = this._mount === 'hook' ? outBack(clamp01(this.age / POP_S)) : 1;
    ctx.save();
    ctx.translate(b.head + 22, BENCH.y);
    ctx.scale(k, k);
    ctx.translate(-(b.head + 22), -BENCH.y);
    drawPointer(ctx, c, b.head + 22, BENCH.y, { lit, headX: b.head - 2, headY: b.midY });
    ctx.restore();
  }

  _clock(ctx, c) {
    const k = outBack(clamp01((this.age - 0.15) / POP_S));
    ctx.save();
    ctx.translate(CLOCK.x, CLOCK.y);
    ctx.scale(k, k);
    ctx.translate(-CLOCK.x, -CLOCK.y);
    drawClock(ctx, c, CLOCK.x, CLOCK.y, CLOCK.r, 0, { ticks: 10 });
    ctx.restore();
  }

  /** The two words, one on each beaker. Milk waits for its own beat. */
  _tags(ctx, c) {
    const milk = this.stage === S_MILK;
    const tag = (b, text, bg) => pill(ctx, c, text, b.cx, b.box.y - 26, { bg, size: fs(18) });
    tag(BEAKERS[0], 'homogeneous', c.s1);
    tag(BEAKERS[1], 'heterogeneous', c.s5);
    tag(BEAKERS[2], milk ? 'heterogeneous' : 'looks uniform?', milk ? c.s5 : c.raised);
  }

  /** The hand lens: a big round view of what is in the liquid. */
  _lens(ctx, c) {
    const b = byKey(this._look);
    const k = outBack(clamp01(this._lensT / POP_S));
    const x = Math.max(LENS.r + 16, Math.min(680 - LENS.r - 40, b.cx));
    const y = LENS.y, r = LENS.r * k;
    if (r < 2) return;
    const look = benchLiquid(c, b.key);
    drawShadow(ctx, c, x + 8, y + r + 8, r * 0.8, 9);
    ctx.lineCap = 'round';                                // the handle, down to the right
    ctx.strokeStyle = darken(c.gold, 0.32);
    ctx.lineWidth = 22 * k;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.74, y + r * 0.74);
    ctx.lineTo(x + r * 1.1, y + r * 1.02);
    ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = mix(c.bgSurface, look.fill, b.key === 'A' ? 0.45 : 0.86);
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    if (b.key === 'B') this._lensGrains(ctx, c, x, y, r);
    if (b.key === 'C') {                                  // even cloud, and nothing else to see
      ctx.fillStyle = alpha(lighten(c.glass, 0.9), 0.5);
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.fillStyle = alpha(lighten(c.glass, 0.9), 0.5);    // the curve of the glass, top left
    ctx.beginPath();
    ctx.ellipse(x - r * 0.42, y - r * 0.52, r * 0.3, r * 0.14, -0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = darken(c.gold, 0.18);
    ctx.lineWidth = 11 * k;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(c.gold, 0.4), 0.8);
    ctx.lineWidth = 3 * k;
    ctx.beginPath(); ctx.arc(x, y, r + 2, Math.PI * 0.95, Math.PI * 1.6); ctx.stroke();
    if (k > 0.9) {
      pill(ctx, c, { A: 'clear liquid', B: 'white grains', C: 'no grains: only cloudy' }[b.key], x, y - r - 24, { bg: c.accent, size: fs(18) });
    }
  }

  _lensGrains(ctx, c, x, y, r) {
    const rnd = mulberry32(21);
    for (let i = 0; i < 17; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r * 0.92;
      const gx = x + Math.cos(a) * d, gy = y + Math.sin(a) * d;
      const s = (10 + rnd() * 13) * (r / LENS.r), ph = rnd() * 6;
      ctx.fillStyle = darken(c.glass, 0.26);
      blob(ctx, gx + 2, gy + 2.5, s, s * 0.84, 7, 0.2, ph); ctx.fill();
      ctx.fillStyle = lighten(c.glass, 0.9);
      blob(ctx, gx, gy, s, s * 0.84, 7, 0.2, ph); ctx.fill();
      ctx.fillStyle = alpha(darken(c.glass, 0.08), 0.5);
      ctx.beginPath(); ctx.ellipse(gx + s * 0.25, gy + s * 0.28, s * 0.42, s * 0.26, 0.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  /** The close-up: one beam, the particles it meets, and the light each sends sideways. */
  _zoom(ctx, c) {
    const b = byKey(this._aim);
    const { x, y, r, beam, eye } = ZOOM;
    ctx.fillStyle = alpha(c.bgDeep, 0.72);
    ctx.fillRect(0, 0, 680, 520);
    const look = benchLiquid(c, b.key);
    const ink = mix(c.bgDeep, c.water, 0.28);             // the view is dim, so the light reads
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = b.key === 'A' ? ink : mix(ink, look.fill, 0.2);
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    const u = clamp01(this._zoomT / ZOOM_S);
    const front = x + r - (r * 2 + 20) * clamp01(u / 0.45);       // the beam's leading edge, right to left
    this._zoomBeam(ctx, c, front, x + r, beam);
    const parts = this._zoomParts(b);
    for (const p of parts) {
      if (p.hit && front < p.x) this._rays(ctx, c, p, clamp01((front < p.x - 40 ? u - 0.3 : 0) / 0.5), eye);
      this._particle(ctx, c, b, p);
    }
    ctx.restore();
    ctx.strokeStyle = lighten(c.glass, 0.2);
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    drawIcon(ctx, c, 'eye', x, eye + 22, 26, { tone: c.s1 });
    pill(ctx, c, 'your eye', x, y + r + 26, { bg: c.raised, size: fs(16) });
    pill(ctx, c, `inside ${b.key}`, 92, 58, { bg: c.raised, size: fs(18) });
    if (u >= 1) {
      pill(ctx, c, b.scatters ? 'scattered' : 'nothing big enough to scatter it', x, 18 + y - r + 8, { bg: b.scatters ? c.accent : c.raised, size: fs(18) });
    }
  }

  _zoomBeam(ctx, c, from, to, y) {
    if (from >= to) return;
    ctx.fillStyle = alpha(c.bad, 0.3);
    ctx.fillRect(from, y - 11, to - from, 22);
    ctx.fillStyle = lighten(c.bad, 0.3);
    ctx.fillRect(from, y - 3.5, to - from, 7);
  }

  /** Fixed positions, so the view is the same every time. Dissolved salt is drawn far smaller. */
  _zoomParts(b) {
    const rnd = mulberry32(b.key.charCodeAt(0));
    const { x, y, r, beam } = ZOOM;
    const out = [];
    if (b.key === 'A') {
      for (let i = 0; i < 90; i++) {
        const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r * 0.95;
        out.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, s: 2.2, hit: false, ph: 0 });
      }
      return out;
    }
    const big = b.key === 'B';
    const n = big ? 3 : 5;
    for (let i = 0; i < n; i++) {                          // the particles the beam meets
      out.push({ x: x - r * 0.7 + (i + 0.5) * ((r * 1.4) / n), y: beam + (rnd() - 0.5) * 8, s: big ? 26 : 12, hit: true, ph: rnd() * 6 });
    }
    const m = big ? 7 : 14;
    for (let i = 0; i < m; i++) {                          // and the ones it misses
      const a = rnd() * Math.PI * 2, d = 0.3 + rnd() * 0.65;
      const py = y + Math.sin(a) * d * r;
      const px = x + Math.cos(a) * d * r;
      if (Math.abs(py - beam) < (big ? 46 : 28) || Math.abs(px - x) < 60 || py < ZOOM.y - r * 0.6) continue;
      out.push({ x: px, y: py, s: big ? 18 + rnd() * 10 : 9 + rnd() * 5, hit: false, ph: rnd() * 6 });
    }
    return out;
  }

  _particle(ctx, c, b, p) {
    if (b.key === 'A') {
      ctx.fillStyle = alpha(lighten(c.glass, 0.4), 0.55);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
      return;
    }
    ctx.fillStyle = lighten(c.glass, 0.85);
    if (b.key === 'B') blob(ctx, p.x, p.y, p.s, p.s * 0.84, 7, 0.2, p.ph);
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); }
    ctx.fill();
    ctx.fillStyle = alpha(darken(c.glass, 0.1), 0.5);
    ctx.beginPath(); ctx.ellipse(p.x + p.s * 0.22, p.y + p.s * 0.28, p.s * 0.44, p.s * 0.26, 0.4, 0, Math.PI * 2); ctx.fill();
  }

  /** Light leaving a particle in many directions; the ray towards the eye is the bright one. */
  _rays(ctx, c, p, u, eyeY) {
    if (u <= 0) return;
    const reach = 40 + 100 * u;
    ctx.lineCap = 'round';
    ctx.strokeStyle = alpha(lighten(c.bad, 0.2), 0.42);
    ctx.lineWidth = 3;
    ctx.setLineDash([9, 8]);
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI + (i + 0.5) * (Math.PI * 2 / 7) + 0.3;
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(a) * p.s, p.y + Math.sin(a) * p.s);
      ctx.lineTo(p.x + Math.cos(a) * reach, p.y + Math.sin(a) * reach);
      ctx.stroke();
    }
    ctx.strokeStyle = lighten(c.bad, 0.42);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + (ZOOM.x - p.x) * u, p.y + (eyeY - p.y) * u);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
