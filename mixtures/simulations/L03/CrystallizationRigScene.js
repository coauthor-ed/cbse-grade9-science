// CrystallizationRigScene - the book's four steps with copper sulfate, one step per beat, big.
//
// Two mounts, told apart by the beat count, with separate stages:
//   5 beats  blk-l03-s04: 0 saturate (add copper sulfate until no more dissolves), 1 filter hot,
//            2 cool under a watch glass (crystals grow in the beaker), 3 slow against fast cooling,
//            4 filter, rinse, dry.
//   2 beats  blk-l03-s10: 5 the crystals and the liquid left, 6 two open dishes: the liquid is lost.
//
// Every stage is learner-driven and resets on entry, so a beat opened on its own is complete.
// Runs end by themselves. The acid and the safety rule are in the text; the scene shows the drop.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, lighten, darken, pill, chipRow, rr, drawBackdrop, drawFloor, drawBench, drawShadow,
  clamp, mulberry32, outBack,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, drawGlass, drawGlassLiquid } from 'simulations/base/kit/SimGlass.js';
import { GEO_COLOR_MAP } from 'simulations/base/kit/GeoLook.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const DEG = '\u00b0';

const BENCH_Y = 442;
const S_SAT = 0, S_FILTER = 1, S_COOL = 2, S_RATE = 3, S_DRY = 4, S_LEFT = 5, S_LOST = 6;
const SAT_AT = 5;              // the fifth spatula does not all dissolve
const map = (from, n) => Array.from({ length: n }, (_, i) => [{ idx: from + i, dwellMs: null }]);

const blue = (c, k = 1) => mix(mix(c.glass, c.water, 0.5), darken(c.water, 0.22), k);

/** One copper sulfate crystal: a slanted block with a lit top and a shaded side. */
function gem(ctx, c, x, y, s, rot, tone) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  const sk = s * 0.32;
  ctx.beginPath(); ctx.moveTo(-s, s * 0.55); ctx.lineTo(s * 0.78, s * 0.55); ctx.lineTo(s, -s * 0.2); ctx.lineTo(-s + sk * 0.6, -s * 0.2); ctx.closePath();
  ctx.fillStyle = tone; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-s + sk * 0.6, -s * 0.2); ctx.lineTo(s, -s * 0.2); ctx.lineTo(s * 0.72, -s * 0.72); ctx.lineTo(-s * 0.5, -s * 0.72); ctx.closePath();
  ctx.fillStyle = lighten(tone, 0.42); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-s, s * 0.55); ctx.lineTo(-s + sk * 0.6, -s * 0.2); ctx.lineTo(-s * 0.5, -s * 0.72); ctx.lineTo(-s * 0.78, -s * 0.1); ctx.closePath();
  ctx.fillStyle = darken(tone, 0.2); ctx.fill();
  ctx.strokeStyle = darken(tone, 0.5); ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-s, s * 0.55); ctx.lineTo(s * 0.78, s * 0.55); ctx.lineTo(s, -s * 0.2); ctx.lineTo(s * 0.72, -s * 0.72); ctx.lineTo(-s * 0.5, -s * 0.72); ctx.lineTo(-s, s * 0.55); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

function flame(ctx, c, x, y, k, t) {
  const f = k * (42 + 5 * Math.sin(t * 11));
  ctx.fillStyle = alpha(c.flame, 0.92);
  ctx.beginPath(); ctx.moveTo(x - 13, y); ctx.quadraticCurveTo(x - 20, y - f * 0.6, x, y - f); ctx.quadraticCurveTo(x + 20, y - f * 0.6, x + 13, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = alpha(lighten(c.flame, 0.6), 0.95);
  ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.quadraticCurveTo(x - 8, y - f * 0.4, x, y - f * 0.58); ctx.quadraticCurveTo(x + 8, y - f * 0.4, x + 6, y); ctx.closePath(); ctx.fill();
}

function burner(ctx, c, x) {
  const col = mix(c.stroke, c.bgDeep, 0.15);
  ctx.fillStyle = col;
  rr(ctx, x - 15, BENCH_Y - 44, 30, 36, 5); ctx.fill();
  rr(ctx, x - 26, BENCH_Y - 11, 52, 11, 4); ctx.fill();
  ctx.fillStyle = mix(c.stroke, c.label, 0.28);
  rr(ctx, x - 18, BENCH_Y - 46, 36, 8, 3); ctx.fill();
}

function watchGlass(ctx, c, cx, y, w, flip) {
  ctx.save();
  ctx.beginPath();
  if (flip) { ctx.moveTo(cx - w / 2, y + 14); ctx.quadraticCurveTo(cx, y - 14, cx + w / 2, y + 14); ctx.quadraticCurveTo(cx, y - 4, cx - w / 2, y + 14); }
  else { ctx.moveTo(cx - w / 2, y); ctx.quadraticCurveTo(cx, y + 34, cx + w / 2, y); ctx.quadraticCurveTo(cx, y + 20, cx - w / 2, y); }
  ctx.closePath();
  ctx.fillStyle = alpha(lighten(c.glass, 0.2), 0.72); ctx.fill();
  ctx.strokeStyle = c.glass; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}

export class CrystallizationRigScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static COLOR_MAP = GEO_COLOR_MAP;       // for the ice token
  static BEAT_STEP_MAP = map(S_SAT, 5);
  static BEAT_MAPS = { 5: map(S_SAT, 5), 2: map(S_LEFT, 2) };
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'Growing copper sulfate crystals, one step at a time on a lab bench: a beaker in a water bath into which copper sulfate is added until no more dissolves; hot filtering into a clean beaker; slow cooling under a watch glass; slow and fast cooling compared; and filtering, rinsing and drying the crystals.';
  static CONTROLS = [
    { type: 'button', id: 'add', label: 'Add copper sulfate' },
    { type: 'segmented', id: 'when', label: 'Filter it', value: 'hot', options: [{ value: 'hot', label: 'While hot' }, { value: 'cold', label: 'After it cools' }] },
    { type: 'button', id: 'pour', label: 'Pour' },
    { type: 'button', id: 'cool', label: 'Leave it to cool' },
    { type: 'button', id: 'both', label: 'Cool both' },
    { type: 'segmented', id: 'finish', label: 'Step 4', value: 'filter', options: [{ value: 'filter', label: 'Filter' }, { value: 'rinse', label: 'Rinse' }, { value: 'dry', label: 'Dry' }] },
    { type: 'button', id: 'leave', label: 'Leave them open' },
    { type: 'button', id: 'again', label: 'Start again' },
  ];

  constructor(container, config) {
    super(container, config);
    this._reset();
  }

  _reset() {
    this._adds = 0;
    this._grains = [];          // falling powder
    this._when = 'hot';
    this._pour = 0;             // 0..1 of the pour
    this._pouring = false;
    this._u = 0;                // 0..1 of a cooling or evaporating run
    this._going = false;
    this._finish = 'filter';
    this._pop = 0;
    this._found = false;
  }

  enter() { this._reset(); }

  _uses(id) {
    const s = this.stage;
    if (id === 'add') return s === S_SAT;
    if (id === 'when' || id === 'pour') return s === S_FILTER;
    if (id === 'cool') return s === S_COOL;
    if (id === 'both') return s === S_RATE;
    if (id === 'finish') return s === S_DRY;
    if (id === 'leave') return s === S_LOST;
    if (id === 'again') return s !== S_DRY && s !== S_LEFT;
    return false;
  }

  isControlHidden(id) { return !this._uses(id); }
  isControlDisabled(id) {
    if (id === 'add') return this._adds >= SAT_AT + 1 || this._grains.length > 0;
    if (id === 'pour') return this._pouring || this._pour >= 1;
    if (id === 'when') return this._pouring;
    if (id === 'cool' || id === 'both' || id === 'leave') return this._going || this._u >= 1;
    return false;
  }

  getControlValue(id) {
    if (id === 'when') return this._when;
    if (id === 'finish') return this._finish;
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'again') { this._reset(); }
    else if (id === 'add') this._add();
    else if (id === 'when') { this._when = v === 'cold' ? 'cold' : 'hot'; this._pour = 0; }
    else if (id === 'pour') { this._pour = 0; this._pouring = true; }
    else if (id === 'cool' || id === 'both' || id === 'leave') { this._u = 0; this._going = true; }
    else if (id === 'finish') { this._finish = String(v); this._pop = 0; }
    this.animateFor(1200);
    this.requestUiUpdate?.();
  }

  _add() {
    this._adds += 1;
    const rnd = mulberry32(this._adds * 7 + 3);
    this._grains = Array.from({ length: 16 }, () => ({ x: 300 + rnd() * 80, y: 60 - rnd() * 40, v: 170 + rnd() * 60 }));
    if (this._adds === SAT_AT && !this._found) {
      this._found = true;
      this.celebrate(340, 262, 16, { key: 'saturated' });
    }
  }

  get _sat() { return this._adds >= SAT_AT; }

  update(d) {
    this._pop = Math.min(1, this._pop + d * 3);
    if (this._grains.length) {
      for (const g of this._grains) g.y += g.v * d;
      this._grains = this._grains.filter((g) => g.y < 246);
      if (!this._grains.length) this.requestUiUpdate?.();
    }
    if (this._pouring) {
      this._pour = Math.min(1, this._pour + d / 3.2);
      if (this._pour >= 1) { this._pouring = false; this.requestUiUpdate?.(); }
    }
    if (this._going) {
      this._u = Math.min(1, this._u + d / 5);
      if (this._u >= 1) { this._going = false; this.requestUiUpdate?.(); }
    }
  }

  busy() { return this._going || this._pouring || this._grains.length > 0 || this._pop < 1 || this.stage === S_SAT && this.age < 1; }

  draw(ctx, c, t) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 496);
    drawBench(ctx, c, 0, 680, BENCH_Y, { h: 52 });
    const s = this.stage;
    if (s === S_SAT) this._saturate(ctx, c, t);
    else if (s === S_FILTER) this._filter(ctx, c, t);
    else if (s === S_COOL) this._cooling(ctx, c);
    else if (s === S_RATE) this._rate(ctx, c);
    else if (s === S_DRY) this._dry(ctx, c, t);
    else if (s === S_LEFT) this._left(ctx, c);
    else this._lost(ctx, c, t);
  }

  _beaker(ctx, c, x, y, w, h, level, fill, o = {}) {
    const g = glassBox('beaker', x, y, w, h, { wall: 5, r: 11 });
    if (o.shadow !== false) drawShadow(ctx, c, x + w / 2, y + h + 2, w * 0.52, 7);
    drawGlass(ctx, c, g, { shadow: false, ticks: o.ticks ?? 5 });
    if (level > 0.005) drawGlassLiquid(ctx, c, g, { level, fill, opacity: o.opacity ?? 0.82 });
    return g;
  }

  _title(ctx, c, text) {
    pill(ctx, c, text, 340, 50, { bg: c.raised, ink: c.label, size: fs(22), display: true });
  }

  // Step 1
  _saturate(ctx, c, t) {
    this._title(ctx, c, 'Step 1: saturate');
    // tripod and burner
    const cx = 340;
    burner(ctx, c, cx);
    flame(ctx, c, cx, BENCH_Y - 46, 0.8, t);
    ctx.strokeStyle = mix(c.stroke, c.bgDeep, 0.2); ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 92, BENCH_Y - 2); ctx.lineTo(cx - 70, 342); ctx.moveTo(cx + 92, BENCH_Y - 2); ctx.lineTo(cx + 70, 342); ctx.stroke();
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.1);
    rr(ctx, cx - 112, 334, 224, 10, 4); ctx.fill();
    // the water bath: a wide pan of water, the beaker stands in it
    const bath = glassBox('beaker', cx - 150, 236, 300, 98, { wall: 6, r: 10, spout: false });
    ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.3);
    rr(ctx, bath.x, bath.y, bath.w, bath.h, 10); ctx.fill();
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 3; ctx.stroke();
    rr(ctx, bath.x + 7, bath.y + 18, bath.w - 14, bath.h - 25, 7);
    ctx.fillStyle = alpha(c.water, 0.5); ctx.fill();
    const deep = clamp(this._adds / SAT_AT, 0, 1);
    const g = this._beaker(ctx, c, cx - 84, 110, 168, 214, 0.7, blue(c, 0.25 + 0.75 * deep), { shadow: false, opacity: 0.9, ticks: 0 });
    if (this._sat) {
      const over = this._adds - SAT_AT + 1;
      const rnd = mulberry32(9);
      ctx.save();
      ctx.beginPath(); ctx.rect(g.inner.x, g.inner.y, g.inner.w, g.inner.h); ctx.clip();
      for (let i = 0; i < 24 * over; i += 1) {
        const u = rnd();
        gem(ctx, c, g.inner.x + 22 + u * (g.inner.w - 44), g.floor - 5 - rnd() * 9 * (1 - Math.abs(u - 0.5) * 1.6), 5.5, rnd() * 2, mix(c.water, c.bgDeep, 0.25));
      }
      ctx.restore();
    }
    for (const gr of this._grains) {
      ctx.fillStyle = gr.y < g.floor - 60 ? mix(c.water, c.glass, 0.3) : alpha(mix(c.water, c.glass, 0.3), this._sat ? 1 : 0.4);
      ctx.fillRect(gr.x, gr.y, 4, 4);
    }
    // the glass rod
    ctx.strokeStyle = alpha(lighten(c.glass, 0.3), 0.9); ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(cx + 62, 76); ctx.lineTo(cx - 8, g.floor - 12); ctx.stroke();
    // what is happening
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    pill(ctx, c, this._sat ? 'saturated' : this._adds ? 'all dissolved' : 'water, 1 drop of acid', cx + 232, 150, { bg: this._sat ? c.good : c.raised, ink: this._sat ? undefined : c.label, size: PHONE ? 21 : 17, display: true, align: 'center' });
    pill(ctx, c, `${this._adds} added`, cx - 232, 150, { bg: c.raised, ink: c.label, size: fs(17), display: true });
    if (!this._adds) chipRow(ctx, c, [{ text: 'add copper sulfate', bg: c.warning }], cx - 232, 196, { size: PHONE ? 21 : 15, align: 'center' });
  }

  // Step 2
  _filter(ctx, c, t) {
    this._title(ctx, c, 'Step 2: filter hot');
    const cold = this._when === 'cold';
    const u = this._pour;
    const fx = 340;
    // stand
    ctx.strokeStyle = mix(c.stroke, c.bgDeep, 0.15); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(fx + 120, BENCH_Y - 6); ctx.lineTo(fx + 120, 110); ctx.moveTo(fx + 120, 244); ctx.lineTo(fx + 66, 244); ctx.stroke();
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.15); rr(ctx, fx + 88, BENCH_Y - 9, 64, 9, 3); ctx.fill();
    // the clean beaker catches what runs through
    const out = cold ? 0.28 : 0.56;
    const b = this._beaker(ctx, c, fx - 90, 288, 180, 154, u * out, blue(c, 0.8), { ticks: 3 });
    // funnel with its paper
    const f = glassBox('funnel', fx - 92, 120, 184, 180, { wall: 4, cone: 0.56, stem: 0.08, spout: false });
    drawGlass(ctx, c, f, { shadow: false });
    ctx.save();
    ctx.beginPath(); ctx.moveTo(fx - 76, 132); ctx.lineTo(fx + 76, 132); ctx.lineTo(fx, 214); ctx.closePath();
    ctx.fillStyle = alpha(lighten(c.glass, 0.65), 0.82); ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.6); ctx.lineWidth = 2; ctx.stroke();
    ctx.clip();
    const lvl = 214 - 62 * Math.sin(Math.min(1, u * 1.15) * Math.PI);
    ctx.fillStyle = alpha(blue(c, 0.8), 0.85); ctx.fillRect(fx - 90, lvl, 180, 214 - lvl);
    const rnd = mulberry32(21);
    const n = Math.round(u * (cold ? 46 : 26));
    for (let i = 0; i < n; i += 1) {
      const x = fx - 46 + rnd() * 92, y = 196 - rnd() * 26 + Math.abs(x - fx) * 0.45 - 6;
      if (cold) gem(ctx, c, x, y, 5.5, rnd() * 2, c.water);
      else { ctx.fillStyle = mix(c.waste, c.label, 0.2); ctx.beginPath(); ctx.arc(x, y, 3.8, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
    // the hot solution, tipped in from the left
    const tip = this._pouring ? 1 : u >= 1 ? 0 : 0;
    ctx.save();
    ctx.translate(136, 150);
    ctx.rotate(tip * 0.75 + 0.05);
    const rem = 0.72 * (1 - u * 0.8);
    this._beaker(ctx, c, -62, -70, 124, 140, rem, blue(c, 0.85), { shadow: false, ticks: 0 });
    ctx.restore();
    if (this._pouring) {
      ctx.strokeStyle = alpha(blue(c, 0.85), 0.9); ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(214, 140); ctx.quadraticCurveTo(262, 136, 300, 170 + Math.sin(t * 9) * 1.5); ctx.stroke();
    }
    if (u > 0.05 && u < 1) {
      const dy = (t * 2.2) % 1;
      ctx.fillStyle = blue(c, 0.8);
      ctx.beginPath(); ctx.ellipse(fx, 302 + dy * (b.floor - 302 - u * out * b.inner.h - 6), 3.4, 5, 0, 0, Math.PI * 2); ctx.fill();
    }
    pill(ctx, c, cold ? 'cool' : 'hot', 136, 244, { bg: cold ? c.accent : c.flame, size: fs(18), display: true });
    if (u >= 1) {
      pill(ctx, c, cold ? 'crystals lost on the paper' : 'impurity left on the paper', 340, 96, { bg: cold ? c.warning : c.good, size: fs(17), display: true });
    }
  }

  // Step 3
  _cooling(ctx, c) {
    this._title(ctx, c, 'Step 3: leave it to cool');
    const u = this._u;
    const g = this._beaker(ctx, c, 212, 142, 256, 300, 0.74, blue(c, 0.85), { ticks: 0 });
    watchGlass(ctx, c, 340, 122, 300, true);
    pill(ctx, c, 'watch glass', 572, 136, { bg: c.raised, ink: c.label, size: fs(16) });
    const P = [[-74, 12, 34, 0.1], [40, 8, 42, -0.15], [-14, 22, 26, 0.3], [84, 22, 22, 0.2], [-104, 26, 20, -0.2], [2, -8, 22, 0.45]];
    P.forEach(([dx, dy, s, r], i) => {
      const k = clamp((u - i * 0.1) / 0.5, 0, 1);
      if (k > 0.02) gem(ctx, c, 340 + dx, g.floor - 24 - dy * k, s * k, r, c.water);
    });
    const T = Math.round(70 - 42 * u);
    pill(ctx, c, `${T} ${DEG}C`, 108, 230, { bg: c.raised, ink: c.label, size: fs(32), display: true });
    if (u >= 1) pill(ctx, c, 'large, shiny crystals', 340, 92, { bg: c.good, size: fs(16), display: true });
  }

  // Slow against fast
  _rate(ctx, c) {
    this._title(ctx, c, 'Slow and fast cooling');
    const u = this._u;
    const y = 216, h = 226, w = 196;
    const a = this._beaker(ctx, c, 62, y, w, h, 0.72, blue(c, 0.85), { ticks: 0 });
    // the ice bath
    const bx = 396, bw = 256;
    const b = this._beaker(ctx, c, bx + 30, y, w, h, 0.72, blue(c, 0.85), { ticks: 0 });
    const ice = glassBox('beaker', bx, y + 72, bw, h - 72, { wall: 5, r: 12, spout: false });
    drawGlass(ctx, c, ice, { shadow: false });
    drawGlassLiquid(ctx, c, ice, { level: 0.8, fill: mix(c.ice, c.water, 0.3), opacity: 0.4 });
    const rnd = mulberry32(13);
    for (let i = 0; i < 9; i += 1) {
      const x = i % 2 ? bx + 8 + rnd() * 18 : bx + bw - 26 - rnd() * 18;
      const yy = y + 104 + rnd() * 80;
      rr(ctx, x, yy, 18, 16, 4); ctx.fillStyle = alpha(lighten(c.ice, 0.4), 0.9); ctx.fill();
      ctx.strokeStyle = alpha(c.stroke, 0.5); ctx.lineWidth = 1.5; ctx.stroke();
    }
    [[-46, 8, 32, 0.12], [34, 6, 38, -0.2], [-4, 24, 24, 0.35]].forEach(([dx, dy, s, r], i) => {
      const k = clamp((u - i * 0.15) / 0.6, 0, 1);
      if (k > 0.02) gem(ctx, c, a.cx + dx, a.floor - 22 - dy * k, s * k, r, c.water);
    });
    const r2 = mulberry32(31);
    const n = Math.round(clamp(u * 2.4, 0, 1) * 64);
    ctx.save();
    ctx.beginPath(); ctx.rect(b.inner.x, b.inner.y, b.inner.w, b.inner.h); ctx.clip();
    for (let i = 0; i < n; i += 1) {
      const row = r2();
      gem(ctx, c, b.inner.x + 12 + r2() * (b.inner.w - 24), b.floor - 6 - row * row * 44, 6 + r2() * 2, r2() * 3, c.water);
    }
    ctx.restore();
    pill(ctx, c, 'room temperature', a.cx, 182, { bg: c.raised, ink: c.label, size: fs(17), display: true });
    pill(ctx, c, 'ice-cold water', b.cx, 182, { bg: c.raised, ink: c.label, size: fs(17), display: true });
    if (u >= 1) {
      pill(ctx, c, 'few and large', a.cx, 110, { bg: c.good, size: fs(19), display: true });
      pill(ctx, c, 'many and small', b.cx, 110, { bg: c.warning, size: fs(19), display: true });
    }
  }

  // Step 4
  _dry(ctx, c, t) {
    this._title(ctx, c, 'Step 4: filter, rinse, dry');
    const k = outBack(this._pop);
    const s = this._finish;
    const cx = 340;
    if (s === 'dry') {
      this._dryCrystals(ctx, c, cx, 460, k);
      pill(ctx, c, 'dry crystals', cx, 244, { bg: c.good, size: fs(20), display: true });
      return;
    }
    this._beaker(ctx, c, cx - 84, 326, 168, 116, 0.5, blue(c, 0.7), { ticks: 0 });
    const f = glassBox('funnel', cx - 110, 118, 220, 214, { wall: 4, cone: 0.56, stem: 0.08, spout: false });
    drawGlass(ctx, c, f, { shadow: false });
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx - 92, 132); ctx.lineTo(cx + 92, 132); ctx.lineTo(cx, 232); ctx.closePath();
    ctx.fillStyle = alpha(lighten(c.glass, 0.65), 0.82); ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.6); ctx.lineWidth = 2; ctx.stroke();
    ctx.clip();
    const r = mulberry32(3);
    for (let i = 0; i < 9; i += 1) gem(ctx, c, cx - 46 + r() * 92, 204 - r() * 40, 15, r() * 2, c.water);
    ctx.restore();
    ctx.fillStyle = blue(c, 0.7);
    ctx.beginPath(); ctx.ellipse(cx, 342 + ((t * 1.4) % 1) * 28, 3.4, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (s === 'rinse') {
      ctx.fillStyle = alpha(mix(c.ice, c.water, 0.3), 0.95);
      for (let i = 0; i < 5; i += 1) {
        const yy = 82 + ((t * 1.2 + i / 5) % 1) * 96;
        ctx.beginPath(); ctx.ellipse(cx - 40 + i * 20, yy, 3.6, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      }
      pill(ctx, c, 'a little cold water', 548, 150, { bg: c.accent, size: fs(16), display: true });
    } else {
      pill(ctx, c, 'crystals stay on the paper', 340, 92, { bg: c.raised, ink: c.label, size: fs(15), display: true });
    }
  }

  _dryCrystals(ctx, c, cx, w, k = 1) {
    const q = w / 300;
    drawShadow(ctx, c, cx, BENCH_Y + 1, w * 0.36, 7);
    const yy = BENCH_Y - 50 * q;
    watchGlass(ctx, c, cx, yy, w, false);
    const P = [[-74, -14, 30, 0.1], [-16, -24, 40, -0.14], [52, -16, 32, 0.2], [100, -6, 22, -0.1], [-114, -2, 20, 0.3], [18, 2, 24, 0.25], [-46, 0, 22, -0.25]];
    for (const [dx, dy, s, r] of P) gem(ctx, c, cx + dx * q, yy + dy * q, s * q * k, r, c.water);
  }

  // s10 beat 0
  _left(ctx, c) {
    this._dryCrystals(ctx, c, 212, 340);
    pill(ctx, c, 'crystals', 212, 288, { bg: c.good, size: fs(20), display: true });
    this._beaker(ctx, c, 442, 208, 176, 234, 0.62, blue(c, 0.62), { ticks: 0 });
    pill(ctx, c, 'still a solution', 530, 166, { bg: c.raised, ink: c.label, size: fs(20), display: true });
  }

  // s10 beat 1
  _lost(ctx, c, t) {
    const u = this._u;
    const dish = (cx, fill, solid, name) => {
      const g = this._beaker(ctx, c, cx - 118, 316, 236, 126, 0.68 * (1 - u) , fill, { ticks: 0, opacity: 0.6 });
      if (solid && u > 0.35) {
        const k = (u - 0.35) / 0.65;
        const r = mulberry32(8);
        for (let i = 0; i < Math.round(k * 34); i += 1) {
          rr(ctx, g.inner.x + 10 + r() * (g.inner.w - 26), g.floor - 8 - r() * 9, 8, 8, 1.5);
          ctx.fillStyle = lighten(c.glass, 0.7); ctx.fill();
          ctx.strokeStyle = alpha(c.stroke, 0.6); ctx.lineWidth = 1; ctx.stroke();
        }
      }
      if (this._going) {
        ctx.strokeStyle = alpha(c.label, 0.28); ctx.lineWidth = 7; ctx.lineCap = 'round';
        for (let i = 0; i < 4; i += 1) {
          const p = (t * 0.5 + i / 4) % 1, x = cx - 60 + i * 40, y = 300 - p * 150;
          ctx.globalAlpha = 1 - p;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 16, x, y - 32); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      pill(ctx, c, name, cx, 276, { bg: c.raised, ink: c.label, size: fs(19), display: true });
    };
    dish(182, mix(c.glass, c.water, 0.3), true, 'salt water');
    dish(498, mix(c.glass, c.gold, 0.25), false, 'acetone and water');
    if (u >= 1) {
      pill(ctx, c, 'salt left, water gone', 182, 92, { bg: c.warning, size: fs(19), display: true });
      pill(ctx, c, 'both liquids gone', 498, 92, { bg: c.warning, size: fs(19), display: true });
    }
  }
}
