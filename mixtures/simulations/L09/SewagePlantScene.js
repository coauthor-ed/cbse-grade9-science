// SewagePlantScene - blk-l09-s06, five beats. A town's sewage plant cut open, lit by day in both themes.
// Three tanks in the book's order, sedimentation, coagulation, filtration, and the water changes colour tank by tank.
//   stage 0  the learner lets the first tank settle: heavy solids sink, the water stays cloudy.
//   stage 1  the learner adds the coagulant (clumps form and sink), then sends the water through the sand and gravel.
//   stage 2  a choice of order. Filter first: the heavy solids reach the sand, block it, and the flow stops.
//   stage 3  where the clean water goes: flushing, plants, or the river. Never drinking.
//   stage 4  separation at home: each item goes in the dry bin or the wet bin. All sorted is the find.
// A real plant has more stages, as the prose does not claim otherwise. Colours only from c. Each run ends by itself.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, lighten, darken, font, pill, rr, clamp01, lerp, mulberry32, outBack, drawCard, drawShadow,
} from 'simulations/base/kit/SimLook.js';
import { GEO_COLOR_MAP } from 'simulations/base/kit/GeoLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const GROUND = 170;
const T1 = { x: 24, w: 196, top: 214, bot: 410 };
const T2 = { x: 244, w: 176, top: 232, bot: 410 };
const T3 = { x: 444, w: 212, top: 250, bot: 410 };
const SAND = { top: 312, bot: 360 };
const S_SETTLE = 0, S_STAGES = 1, S_ORDER = 2, S_REUSE = 3, S_SORT = 4;
const MAP = [0, 1, 2, 3, 4].map((i) => [{ idx: i, dwellMs: null }]);
const DESTS = {
  flush: { label: 'Flushing', x: 124 },
  plants: { label: 'Plants', x: 340 },
  river: { label: 'River', x: 556 },
};
const ITEMS = [
  { id: 'bottle', label: 'Plastic bottle', bin: 'dry' },
  { id: 'peel', label: 'Vegetable peels', bin: 'wet' },
  { id: 'paper', label: 'Newspaper', bin: 'dry' },
  { id: 'can', label: 'Metal can', bin: 'dry' },
  { id: 'food', label: 'Food scraps', bin: 'wet' },
  { id: 'jar', label: 'Glass jar', bin: 'dry' },
];

export class SewagePlantScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static IRIS = false;
  static COLOR_MAP = GEO_COLOR_MAP;
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A sewage plant cut open, with three tanks in a row: sedimentation, coagulation and filtration through sand and gravel. The brown water clears tank by tank. '
    + 'If the filter comes first, heavy solids block the sand and the flow stops. The clean water goes to flushing, plants or the river. Then six items are sorted into dry waste and wet waste.';
  static CONTROLS = [
    { type: 'button', id: 'settle', label: 'Let it settle' },
    { type: 'button', id: 'dose', label: 'Add the coagulant' },
    { type: 'button', id: 'bed', label: 'Run the filter bed' },
    { type: 'segmented', id: 'order', label: 'Which stage comes first?', value: 'right', options: [{ value: 'right', label: 'Sedimentation first' }, { value: 'bad', label: 'Filter first' }] },
    { type: 'segmented', id: 'dest', label: 'Send the clean water to', value: '', options: Object.entries(DESTS).map(([value, d]) => ({ value, label: d.label })) },
    { type: 'button', id: 'dry', label: 'Dry waste' },
    { type: 'button', id: 'wet', label: 'Wet waste' },
  ];

  constructor(container, config) {
    super(container, config);
    const r = mulberry32(21);
    this._heavy = Array.from({ length: 34 }, () => ({ x: r(), y: r(), r: 3 + r() * 3.5 }));
    this._fine = Array.from({ length: 40 }, () => ({ x: r(), y: r(), r: 1.3 + r() * 1 }));
    this._clumps = Array.from({ length: 12 }, () => ({ x: r(), y: r(), r: 7 + r() * 4, d: r() }));
    this._cold(0);
  }

  _cold(stage) {
    this._go = null;              // 'settle' | 'dose' | 'bed' | 'bad'
    this._a = stage > S_SETTLE ? 1 : 0;   // tank 1 settled
    this._b = stage > S_STAGES ? 1 : 0;   // tank 2 clumped
    this._f = stage > S_STAGES ? 1 : 0;   // tank 3 filtered
    this._bad = 0;
    this._order = 'right';
    this._dest = '';
    this._seen = new Set();
    this._foundDest = false;
    this._flow = 3;
    this._sorted = 0;
    this._say = '';
    this._pop = 1;
    this._foundSort = false;
  }

  enter(stage) { this._cold(stage); }

  isControlHidden(id) {
    const s = this.stage;
    if (id === 'settle') return s !== S_SETTLE;
    if (id === 'dose' || id === 'bed') return s !== S_STAGES;
    if (id === 'order') return s !== S_ORDER;
    if (id === 'dest') return s !== S_REUSE;
    return s !== S_SORT;
  }

  isControlDisabled(id) {
    if (id === 'settle') return !!this._go || this._a >= 1;
    if (id === 'dose') return !!this._go || this._b >= 1;
    if (id === 'bed') return !!this._go || this._b < 1 || this._f >= 1;
    if (id === 'dry' || id === 'wet') return this._sorted >= ITEMS.length;
    return false;
  }

  getControlValue(id) {
    if (id === 'order') return this._order;
    if (id === 'dest') return this._dest;
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'settle' || id === 'dose' || id === 'bed') this._go = id;
    else if (id === 'order') {
      this._order = v === 'bad' ? 'bad' : 'right';
      this._bad = 0;
      this._go = this._order === 'bad' ? 'bad' : null;
    } else if (id === 'dest') {
      this._dest = String(v);
      this._seen.add(this._dest);
      this._flow = 0;
      if (!this._foundDest && this._seen.size === 3) { this._foundDest = true; }
    } else if (id === 'dry' || id === 'wet') {
      const it = ITEMS[this._sorted];
      this._pop = 0;
      if (it.bin === id) {
        this._sorted += 1;
        this._say = '';
        if (this._sorted === ITEMS.length && !this._foundSort) {
          this._foundSort = true;
          this.celebrate(340, 240, 18, { key: 'all-sorted', small: true });
        }
      } else {
        this._say = it.bin === 'dry' ? 'This can be recycled: dry waste' : 'This can be composted: wet waste';
        this.oops(340, 240);
      }
    }
    this.animateFor(900);
    this.requestUiUpdate?.();
  }

  update(d) {
    if (this._pop < 1) this._pop += d;
    if (this._flow < 3) this._flow += d;
    const step = (key, field, secs) => {
      if (this._go !== key) return;
      this[field] = Math.min(1, this[field] + d / secs);
      if (this[field] >= 1) { this._go = null; this.requestUiUpdate?.(); }
    };
    step('settle', '_a', 3);
    step('dose', '_b', 3);
    step('bed', '_f', 3);
    step('bad', '_bad', 3);
  }

  busy() {
    return !!this._go || this._pop < 0.5 || (this.stage === S_REUSE && !!this._dest && this._flow < 2.5);
  }

  _spr() { return reducedMotion() ? 1 : outBack(clamp01(this._pop / 0.4)); }

  /* ------------------------------------------------------------------ paint */

  draw(ctx, c, t) {
    this._world(ctx, c);
    if (this.stage === S_REUSE) this._reuse(ctx, c, t);
    else if (this.stage === S_SORT) this._sort(ctx, c);
    else this._plant(ctx, c, t);
  }

  _world(ctx, c) {
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, c.skyDay);
    sky.addColorStop(1, lighten(c.skyDay, 0.6));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 680, GROUND + 2);
    ctx.fillStyle = mix(c.gold, c.ice, 0.42);
    ctx.beginPath(); ctx.arc(600, 54, 30, 0, Math.PI * 2); ctx.fill();
    const land = ctx.createLinearGradient(0, GROUND, 0, 520);
    land.addColorStop(0, lighten(c.strata1, 0.12));
    land.addColorStop(1, c.strata2);
    ctx.fillStyle = land; ctx.fillRect(0, GROUND, 680, 350);
    ctx.fillStyle = mix(c.s3, c.strata1, 0.35);
    ctx.fillRect(0, GROUND - 4, 680, 12);
  }

  _brown(c) { return mix(c.strata3, c.water, 0.16); }
  _mid(c) { return mix(c.strata2, c.water, 0.62); }
  _clear(c) { return mix(c.water, c.ice, 0.45); }

  _tank(ctx, c, T, sy, tone) {
    const w = 8;
    ctx.fillStyle = mix(c.ice, c.waste, 0.55);
    rr(ctx, T.x - w, GROUND + 6, T.w + w * 2, T.bot - GROUND + 2, 10); ctx.fill();
    ctx.fillStyle = darken(mix(c.ice, c.waste, 0.55), 0.25);
    rr(ctx, T.x, GROUND + 6, T.w, T.bot - GROUND - 6, 6); ctx.fill();
    ctx.fillStyle = tone;
    rr(ctx, T.x, sy, T.w, T.bot - sy - 6, 6); ctx.fill();
    ctx.fillStyle = alpha(lighten(tone, 0.45), 0.8);
    ctx.fillRect(T.x + 2, sy, T.w - 4, 4);
  }

  _plant(ctx, c, t) {
    const bad = this.stage === S_ORDER && this._order === 'bad';
    const a = bad ? 0 : this._a, b = bad ? 0 : this._b, f = bad ? 0 : this._f;
    const t1 = mix(this._brown(c), mix(this._brown(c), this._mid(c), 0.6), a);
    const t2 = a < 0.05 ? mix(c.waste, c.ice, 0.6) : mix(mix(this._brown(c), this._mid(c), 0.6), this._mid(c), b);
    const t2Top = a < 0.05 ? T2.bot - 6 : T2.top + 18;
    this._houses(ctx, c);
    this._tank(ctx, c, T1, T1.top + 18, t1);
    this._heavies(ctx, c, a);
    this._tank(ctx, c, T2, a > 0 ? lerp(T2.bot - 6, t2Top, Math.min(1, a * 2)) : T2.bot - 6, t2);
    if (a > 0.3 && !bad) this._flocs(ctx, c, b);
    this._bedTank(ctx, c, f, bad);
    this._pipes(ctx, c, t, a, b, f, bad);
    if (this._go === 'dose' || this._b > 0) this._hopper(ctx, c, b);
    else this._hopper(ctx, c, 0);
    const names = [['Sedimentation', T1, !bad && (this.stage === S_SETTLE || a >= 1)], ['Coagulation', T2, !bad && this.stage >= S_STAGES], ['Filtration', T3, this.stage >= S_STAGES]];
    for (const [n, T, on] of names) pill(ctx, c, n, T.x + T.w / 2, 448, { bg: on ? c.bgSurface : mix(c.bgSurface, c.strata2, 0.5), size: fs(PHONE ? 19 : 20), display: true });
    const say = this._reading(bad, a, b, f);
    if (say) pill(ctx, c, say, 280, 36, { bg: c.bgSurface, size: fs(22), display: true });
  }

  _reading(bad, a, b, f) {
    if (bad) return this._bad >= 1 ? 'Sand blocked: the water stops' : 'Heavy solids reach the sand';
    if (f >= 1) return 'Clear water leaves the plant';
    if (b >= 1) return 'Clumps sank. Still a little cloudy';
    if (a >= 1) return 'Solids sank. Still cloudy';
    return 'Sewage from the town';
  }

  _houses(ctx, c) {
    const tones = [c.s8, c.s1, c.s5, c.s4];
    for (let i = 0; i < 4; i++) {
      const x = 12 + i * 46, w = 38, h = 30 + (i % 2) * 8, y = GROUND - h;
      ctx.fillStyle = mix(c.ice, tones[i], 0.25);
      rr(ctx, x, y, w, h + 2, 3); ctx.fill();
      ctx.fillStyle = darken(tones[i], 0.15);
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + w / 2, y - 16); ctx.lineTo(x + w + 4, y); ctx.closePath(); ctx.fill();
    }
  }

  _heavies(ctx, c, a) {
    const tone = darken(c.strata3, 0.28);
    const top = T1.top + 26, bot = T1.bot - 14;
    for (const p of this._heavy) {
      const x = T1.x + 12 + p.x * (T1.w - 24);
      const start = top + p.y * (bot - top - 10);
      const rest = bot - p.r - (p.x * 37 % 1) * 14;
      const y = lerp(start, rest, clamp01(a * 1.25 - p.y * 0.25));
      ctx.fillStyle = tone;
      ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = alpha(lighten(this._brown(c), 0.25), 0.8);
    for (const p of this._fine) {
      ctx.beginPath(); ctx.arc(T1.x + 8 + p.x * (T1.w - 16), top + p.y * (bot - top - 26), p.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  _flocs(ctx, c, b) {
    const tone = mix(c.strata2, c.strata3, 0.5);
    const top = T2.top + 28, bot = T2.bot - 12;
    if (b <= 0) {
      ctx.fillStyle = alpha(lighten(this._brown(c), 0.3), 0.85);
      for (const p of this._fine) { ctx.beginPath(); ctx.arc(T2.x + 8 + p.x * (T2.w - 16), top + p.y * (bot - top - 14), p.r, 0, Math.PI * 2); ctx.fill(); }
      return;
    }
    for (const p of this._clumps) {
      const k = clamp01(b * 2.2 - p.d * 0.4);
      const x = T2.x + 16 + p.x * (T2.w - 32);
      const y = lerp(top + 12 + p.y * 70, bot - p.r * 0.7 - (p.d * 12), clamp01(b * 1.7 - 0.5));
      ctx.fillStyle = tone;
      for (let i = 0; i < 5; i++) {
        const ang = i * 1.26 + p.d * 6;
        ctx.beginPath(); ctx.arc(x + Math.cos(ang) * p.r * 0.6 * k, y + Math.sin(ang) * p.r * 0.5 * k, Math.max(1.5, p.r * 0.55 * k), 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  _bedTank(ctx, c, f, bad) {
    const T = T3;
    const k = bad ? this._bad : f;
    const tone = bad ? mix(mix(c.waste, c.ice, 0.6), this._brown(c), Math.min(1, k * 2)) : f > 0 ? mix(this._mid(c), this._clear(c), f) : mix(c.waste, c.ice, 0.6);
    const sy = bad ? lerp(SAND.top, T.top - 8, k) : f > 0 ? T.top + 8 : SAND.top;
    this._tank(ctx, c, T, sy, tone);
    ctx.fillStyle = c.strata1;
    ctx.fillRect(T.x, SAND.top, T.w, SAND.bot - SAND.top);
    ctx.fillStyle = darken(c.strata1, 0.14);
    const r = mulberry32(5);
    for (let i = 0; i < 70; i++) { ctx.beginPath(); ctx.arc(T.x + 4 + r() * (T.w - 8), SAND.top + 3 + r() * (SAND.bot - SAND.top - 6), 1.8, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = mix(c.waste, c.ice, 0.3);
    rr(ctx, T.x, SAND.bot, T.w, T.bot - SAND.bot - 6, 6); ctx.fill();
    ctx.fillStyle = mix(c.waste, c.ice, 0.55);
    const r2 = mulberry32(9);
    for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(T.x + 10 + r2() * (T.w - 20), SAND.bot + 8 + r2() * (T.bot - SAND.bot - 24), 5 + r2() * 3, 0, Math.PI * 2); ctx.fill(); }
    if (bad && k > 0) {
      ctx.fillStyle = darken(c.strata3, 0.28);
      rr(ctx, T.x, SAND.top - 22 * k, T.w, 24 * k + 4, 4); ctx.fill();
    }
  }

  _pipes(ctx, c, t, a, b, f, bad) {
    const steel = mix(c.waste, c.ice, 0.35);
    const pipe = (x0, y, x1) => { ctx.fillStyle = steel; rr(ctx, x0, y - 8, x1 - x0, 16, 4); ctx.fill(); };
    pipe(0, T1.top + 30, T1.x);
    pipe(T1.x + T1.w, T2.top + 30, T2.x);
    pipe(T2.x + T2.w, T3.top + 22, T3.x);
    pipe(T3.x + T3.w, 392, 680);
    const col = alpha(lighten(this._clear(c), 0.3), 0.95);
    const dash = (x0, x1, y, tone, on) => {
      if (!on) return;
      const ph = reducedMotion() ? 0 : (t * 60) % 26;
      ctx.fillStyle = tone;
      for (let x = x0 + ph; x < x1 - 8; x += 26) { rr(ctx, x, y - 3, 12, 6, 3); ctx.fill(); }
    };
    dash(0, T1.x, T1.top + 30, this._brown(c), this._go === 'settle' || this._go === 'bad');
    dash(T1.x + T1.w, T2.x, T2.top + 30, this._mid(c), this._go === 'settle' || this._go === 'dose');
    dash(T2.x + T2.w, T3.x, T3.top + 22, this._mid(c), this._go === 'bed');
    dash(T3.x + T3.w, 680, 392, col, this._go === 'bed' || (f >= 1 && !bad && this.stage === S_ORDER));
    if (bad && this._bad < 1) dash(0, 680, 196, this._brown(c), false);
    if (bad) {
      ctx.fillStyle = this._brown(c);
      rr(ctx, 0, 186, T3.x + 24, 14, 4); ctx.fill();
      rr(ctx, T3.x + 10, 186, 14, 60, 4); ctx.fill();
      ctx.strokeStyle = steel; ctx.lineWidth = 3;
      ctx.strokeRect(-4, 186, T3.x + 28, 14);
    }
  }

  _hopper(ctx, c, b) {
    const x = T2.x + T2.w / 2;
    ctx.fillStyle = mix(c.ice, c.waste, 0.35);
    ctx.beginPath(); ctx.moveTo(x - 46, 92); ctx.lineTo(x + 46, 92); ctx.lineTo(x + 12, 150); ctx.lineTo(x - 12, 150); ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(mix(c.ice, c.waste, 0.35), 0.25);
    rr(ctx, x - 50, 86, 100, 10, 4); ctx.fill();
    rr(ctx, x - 9, 150, 18, 34, 3); ctx.fill();
    pill(ctx, c, 'coagulant', x + 112, 124, { bg: c.bgSurface, size: fs(18) });
    if (this._go === 'dose') {
      ctx.fillStyle = alpha(c.ice, 0.95);
      for (let i = 0; i < 7; i++) {
        const q = reducedMotion() ? i / 7 : (this.clock * 1.4 + i / 7) % 1;
        ctx.beginPath(); ctx.arc(x + (i % 3 - 1) * 5, 184 + q * 56, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  _reuse(ctx, c) {
    const steel = mix(c.waste, c.ice, 0.35);
    const y = 212;
    ctx.fillStyle = steel;
    rr(ctx, 0, y - 12, 610, 24, 6); ctx.fill();
    pill(ctx, c, 'Clean enough to reuse, not to drink', 300, 40, { bg: c.bgSurface, size: fs(PHONE ? 20 : 22), display: true });
    for (const [id, d] of Object.entries(DESTS)) {
      ctx.fillStyle = steel;
      rr(ctx, d.x - 11, y, 22, 54, 4); ctx.fill();
      const on = this._dest === id;
      if (id === 'flush') this._toilet(ctx, c, d.x, on);
      else if (id === 'plants') this._pots(ctx, c, d.x, on);
      else this._river(ctx, c, d.x, on);
      if (on) {
        ctx.fillStyle = this._clear(c);
        rr(ctx, 0, y - 6, d.x + 6, 12, 5); ctx.fill();
        rr(ctx, d.x - 6, y - 6, 12, 62, 5); ctx.fill();
      }
      pill(ctx, c, d.label, d.x, 468, { bg: on ? mix(c.bgSurface, c.good, 0.3) : c.bgSurface, size: fs(22), display: true });
    }
  }

  _toilet(ctx, c, x, on) {
    const white = c.ice;
    ctx.fillStyle = white;
    rr(ctx, x - 44, 270, 88, 66, 8); ctx.fill();
    ctx.fillStyle = darken(white, 0.12);
    rr(ctx, x - 54, 262, 108, 12, 5); ctx.fill();
    ctx.fillStyle = white;
    ctx.beginPath(); ctx.moveTo(x - 62, 340); ctx.lineTo(x + 62, 340); ctx.quadraticCurveTo(x + 54, 410, x + 22, 416); ctx.lineTo(x + 26, 438); ctx.lineTo(x - 26, 438); ctx.lineTo(x - 22, 416); ctx.quadraticCurveTo(x - 54, 410, x - 62, 340); ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(white, 0.2);
    rr(ctx, x - 68, 334, 136, 12, 6); ctx.fill();
    if (on) { ctx.fillStyle = this._clear(c); rr(ctx, x - 36, 288, 72, 42, 5); ctx.fill(); }
  }

  _pots(ctx, c, x, on) {
    const leaf = on ? c.s3 : mix(c.s3, c.strata1, 0.5);
    for (let i = -1; i <= 1; i++) {
      const px = x + i * 62;
      ctx.strokeStyle = darken(leaf, 0.25); ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px, 400); ctx.lineTo(px, 322); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.fillStyle = leaf;
      for (const [dx, dy, ro] of [[-18, 342, -0.6], [18, 330, 0.6], [-14, 312, -0.4], [12, 302, 0.4]]) {
        ctx.beginPath(); ctx.ellipse(px + dx, dy, 22, 10, ro, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = c.s8;
      ctx.beginPath(); ctx.moveTo(px - 28, 396); ctx.lineTo(px + 28, 396); ctx.lineTo(px + 20, 438); ctx.lineTo(px - 20, 438); ctx.closePath(); ctx.fill();
      ctx.fillStyle = darken(c.s8, 0.2);
      rr(ctx, px - 30, 392, 60, 9, 3); ctx.fill();
    }
  }

  _river(ctx, c, x, on) {
    const g = on ? this._clear(c) : mix(c.seaShallow ?? c.water, c.strata1, 0.25);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 92, 438); ctx.bezierCurveTo(x - 50, 390, x - 30, 340, x - 24, 270); ctx.lineTo(x + 24, 270); ctx.bezierCurveTo(x + 34, 340, x + 60, 390, x + 104, 438); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = alpha(lighten(g, 0.6), 0.8); ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const [a, b] of [[-30, 410], [14, 372], [-6, 330]]) { ctx.beginPath(); ctx.moveTo(x + a, b); ctx.lineTo(x + a + 26, b); ctx.stroke(); }
    ctx.lineCap = 'butt';
  }

  _sort(ctx, c) {
    const done = this._sorted >= ITEMS.length;
    const bin = (x, tone, label) => {
      drawShadow(ctx, c, x, 448, 96);
      ctx.fillStyle = tone;
      ctx.beginPath(); ctx.moveTo(x - 92, 300); ctx.lineTo(x + 92, 300); ctx.lineTo(x + 74, 446); ctx.lineTo(x - 74, 446); ctx.closePath(); ctx.fill();
      ctx.fillStyle = darken(tone, 0.2);
      rr(ctx, x - 102, 288, 204, 18, 7); ctx.fill();
      pill(ctx, c, label, x, 376, { bg: c.bgSurface, size: fs(22), display: true });
    };
    bin(136, c.s1, 'Dry waste');
    bin(544, c.s3, 'Wet waste');
    const dry = ITEMS.slice(0, this._sorted).filter((i) => i.bin === 'dry').length;
    const wet = this._sorted - dry;
    ctx.font = font(c, 700, fs(20)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    pill(ctx, c, `${dry} of 4 go to recycling`, 136, 476, { bg: c.bgSurface, size: fs(PHONE ? 18 : 18) });
    pill(ctx, c, `${wet} of 2 go to compost`, 544, 476, { bg: c.bgSurface, size: fs(PHONE ? 18 : 18) });
    if (done) {
      drawCard(ctx, c, 216, 110, 248, 130, 1, { accent: c.good });
      ctx.fillStyle = c.label; ctx.font = font(c, 700, fs(30), true);
      ctx.textAlign = 'center';
      ctx.fillText('All sorted', 340, 158);
      ctx.fillStyle = c.labelMuted; ctx.font = font(c, 700, fs(20));
      ctx.fillText('6 of 6', 340, 200);
    } else {
      const it = ITEMS[this._sorted];
      const s = this._spr();
      ctx.save();
      ctx.translate(340, 208);
      ctx.scale(s, s);
      this._item(ctx, c, it.id);
      ctx.restore();
      pill(ctx, c, it.label, 340, 340, { bg: c.bgSurface, size: fs(24), display: true });
      if (this._say) pill(ctx, c, this._say, 340, 34, { bg: mix(c.bgSurface, c.warning, 0.3), size: fs(20) });
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  _item(ctx, c, id) {
    if (id === 'bottle') {
      ctx.fillStyle = alpha(c.s1, 0.75);
      rr(ctx, -30, -30, 60, 110, 14); ctx.fill();
      rr(ctx, -13, -62, 26, 36, 6); ctx.fill();
      ctx.fillStyle = c.s6; rr(ctx, -16, -76, 32, 16, 4); ctx.fill();
      ctx.fillStyle = c.ice; rr(ctx, -30, 8, 60, 34, 2); ctx.fill();
    } else if (id === 'paper') {
      ctx.fillStyle = c.ice; rr(ctx, -66, -56, 132, 118, 5); ctx.fill();
      ctx.fillStyle = c.waste; rr(ctx, -54, -44, 108, 18, 2); ctx.fill();
      ctx.fillStyle = mix(c.waste, c.ice, 0.5);
      for (let i = 0; i < 4; i++) { rr(ctx, -54, -16 + i * 18, 48, 8, 2); ctx.fill(); rr(ctx, 6, -16 + i * 18, 48, 8, 2); ctx.fill(); }
    } else if (id === 'can') {
      ctx.fillStyle = mix(c.waste, c.ice, 0.55);
      rr(ctx, -44, -60, 88, 124, 8); ctx.fill();
      ctx.fillStyle = c.s6; ctx.fillRect(-44, -32, 88, 64);
      ctx.fillStyle = lighten(mix(c.waste, c.ice, 0.55), 0.3); ctx.beginPath(); ctx.ellipse(0, -60, 44, 10, 0, 0, Math.PI * 2); ctx.fill();
    } else if (id === 'jar') {
      ctx.fillStyle = alpha(c.ice, 0.75);
      rr(ctx, -46, -46, 92, 112, 14); ctx.fill();
      ctx.fillStyle = c.waste; rr(ctx, -40, -66, 80, 20, 4); ctx.fill();
      ctx.fillStyle = alpha(c.ice, 0.9); rr(ctx, -34, -36, 10, 80, 5); ctx.fill();
    } else if (id === 'peel') {
      ctx.strokeStyle = c.s8; ctx.lineWidth = 16; ctx.lineCap = 'round';
      for (const [x, y, r0] of [[-26, -10, 0.4], [20, -24, 2.1], [6, 26, 4]]) { ctx.beginPath(); ctx.arc(x, y, 34, r0, r0 + 2.4); ctx.stroke(); }
      ctx.lineCap = 'butt';
    } else {
      ctx.fillStyle = c.ice; ctx.beginPath(); ctx.ellipse(0, 22, 86, 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.strata1; for (const [x, y, r] of [[-30, 10, 14], [0, 2, 18], [28, 12, 13], [-6, 22, 12]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = c.s3; for (const [x, y] of [[-14, 0], [14, 8], [-34, 16]]) { rr(ctx, x, y, 12, 6, 3); ctx.fill(); }
    }
  }
}
