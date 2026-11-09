// SuspensionJarScene - blk-l07-s00. What a suspension is, and what settling and filtering leave behind.
//
//   stage 0  stir a jar: sugar disappears, sand, sawdust and tea leaves do not. Sugar is there as the contrast.
//   stage 1  muddy water and a clock: heavy mud settles fast, then the water stops clearing. The clock is the learner's.
//   stage 2  pour the cloudy water through filter paper: the big grains stay, the water is still cloudy. A lens shows why.
// The grains are drawn far larger than real. Times on the clock are model numbers.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, mix, lighten, darken, pill, rr, clamp01, mulberry32, lerp, drawBackdrop, drawFloor, drawBench, drawVignette, chipRow, inkOn,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, glassPath, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const TAU = Math.PI * 2;

const BENCH_Y = 424;
const JAR = { x: 180, y: 96, w: 320, h: 322 };
const SAMPLES = {
  sugar: { name: 'Sugar', word: 'solution', n: 60, r: 7, tone: (c) => lighten(c.glass, 0.8), rest: 'floor', fall: 0 },
  sand: { name: 'Sand', word: 'suspension', n: 110, r: 7, tone: (c) => mix(darken(c.gold, 0.2), c.flame, 0.2), rest: 'floor', fall: 1.5 },
  sawdust: { name: 'Sawdust', word: 'suspension', n: 70, r: 8, tone: (c) => lighten(c.gold, 0.12), rest: 'top', fall: 3 },
  tea: { name: 'Tea leaves', word: 'suspension', n: 60, r: 9, tone: (c) => mix(darken(c.flame, 0.55), c.waste, 0.2), rest: 'floor', fall: 2.6 },
};
const STIR_S = 2.4;
const GRAINS = (() => {
  const rnd = mulberry32(17);
  return Array.from({ length: 110 }, () => ({ u: rnd(), v: rnd(), a: rnd() * TAU, k: 0.65 + rnd() * 0.5, d: rnd(), bed: rnd(), bx: rnd() }));
})();
// Mud: a fast part that lands in the first minutes, a fine part that barely clears.
const MUD_MAX = 120;                     // minutes on the clock
const cloudAt = (m) => 0.5 + 0.5 * Math.exp(-m / 16);      // cloudiness, 1 to about 0.5
const bedAt = (m) => 1 - Math.exp(-m / 14);                // share of the bed, 0 to 1
const FLECKS = (() => {
  const rnd = mulberry32(23);
  return Array.from({ length: 44 }, () => ({ u: rnd(), v: rnd(), r: 2 + rnd() * 3 }));
})();

const MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);

export class SuspensionJarScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A large glass jar of water on a lab bench. Stirred sugar disappears, but stirred sand, sawdust and tea leaves can still be seen. Muddy water left to stand drops a layer of mud and stays cloudy. Poured through filter paper it leaves some mud on the paper and comes through still cloudy, because the finest grains pass through the gaps.';
  static CONTROLS = [
    { type: 'segmented', id: 'sample', label: 'Jar', value: 'sand', options: Object.entries(SAMPLES).map(([value, s]) => ({ value, label: s.name })) },
    { type: 'button', id: 'stir', label: 'Stir' },
    { type: 'slider', id: 'wait', label: 'Minutes left to stand', min: 0, max: MUD_MAX, step: 5, value: 0 },
    { type: 'button', id: 'pour', label: 'Pour through the filter' },
    { type: 'button', id: 'again', label: 'Start again' },
  ];

  constructor(container, config) {
    super(container, config);
    this._fresh();
  }

  _fresh() {
    this._sample = 'sand';
    this._stir = 0;          // seconds left of stirring
    this._since = 1e3;       // seconds since the stirring stopped
    this._turn = 0;          // how far the water has turned
    this._mixed = false;     // stirred at least once
    this._done = new Set();
    this._tried = new Set();
    this._wait = 0;          // minutes
    this._pour = 0;          // 0..1 of the pour
    this._pouring = false;
  }

  enter() { this._fresh(); this.requestUiUpdate?.(); }

  isControlHidden(id) {
    if (id === 'sample' || id === 'stir') return this.stage !== 0;
    if (id === 'wait') return this.stage !== 1;
    if (id === 'pour' || id === 'again') return this.stage !== 2;
    return false;
  }
  isControlDisabled(id) {
    if (id === 'stir') return this._stir > 0;
    if (id === 'pour') return this._pouring || this._pour >= 1;
    if (id === 'again') return this._pouring;
    return false;
  }
  getControlValue(id) {
    if (id === 'sample') return this._sample;
    if (id === 'wait') return String(this._wait);
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'sample') { this._sample = v; this._mixed = false; this._since = 1e3; this._stir = 0; } else if (id === 'stir') {
      this._stir = STIR_S;
      this._mixed = true;
    } else if (id === 'wait') {
      this._wait = Number(v);
      if (this._wait >= 60) this._find(340, 200, 'still-cloudy');
    } else if (id === 'pour') this._pouring = true;
    else if (id === 'again') { this._pour = 0; this._pouring = false; }
    this.animateFor(600);
    this.requestUiUpdate?.();
  }

  _find(x, y, key) {
    if (this._done.has(key)) return;
    this._done.add(key);
    this.celebrate(x, y, 18, { key, small: true });
  }

  update(d) {
    if (this._stir > 0) {
      this._turn += d * 7;
      this._stir = Math.max(0, this._stir - d);
      this._since = 0;
      if (this._stir === 0) {
        this.requestUiUpdate?.();
        this._tried.add(SAMPLES[this._sample].word);
        if (this._tried.size === 2) this._find(340, 250, 'grains-stay');
      }
    } else if (this._since < 7) {
      this._since += d;
      this._turn += d * 7 * Math.exp(-this._since * 1.3);
    }
    if (this._pouring) {
      this._pour = Math.min(1, this._pour + d / 5);
      if (this._pour >= 1) {
        this._pouring = false;
        this._find(FLASK.x + FLASK.w / 2, FLASK.y + 170, 'filter-cloudy');
        this.requestUiUpdate?.();
      }
    }
  }

  busy() { return this._stir > 0 || this._pouring || this._since < 7; }

  draw(ctx, c, t) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH_Y + 58);
    drawBench(ctx, c, 40, 640, BENCH_Y, { h: 58 });
    if (this.stage === 0) this._stirJar(ctx, c);
    else if (this.stage === 1) this._muddyJar(ctx, c);
    else this._filter(ctx, c, t);
    drawVignette(ctx, c, 0.4);
  }

  // ---- stage 0 -----------------------------------------------------------------------------------
  _stirJar(ctx, c) {
    const s = SAMPLES[this._sample];
    const g = glassBox('jar', JAR.x, JAR.y, JAR.w, JAR.h);
    drawGlass(ctx, c, g);
    drawGlassLiquid(ctx, c, g, { level: 0.82, fill: c.water, opacity: 0.42 });
    const top = g.floor - g.inner.h * 0.82;
    ctx.save();
    glassPath(ctx, g, g.inner);
    ctx.clip();
    const n = s.n, I = g.inner;
    const dis = this._sample === 'sugar' && this._mixed ? clamp01(1 - (STIR_S - this._stir) / STIR_S) : 1;
    const inWater = this._stir > 0 ? clamp01((STIR_S - this._stir) / 0.5) : Math.exp(-(this._since * this._since) / (2 * s.fall * s.fall + 0.01));
    for (let i = 0; i < n; i += 1) {
      const p = GRAINS[i];
      const restY = s.rest === 'top' ? top + 8 + p.bed * 26 : g.floor - 8 - p.bed * p.bed * 42;
      const restX = I.x + 14 + p.bx * (I.w - 28);
      const a = p.a + this._turn * p.k;
      const swirlX = I.x + I.w / 2 + Math.cos(a) * (0.1 + 0.8 * p.u) * (I.w / 2 - 10);
      const swirlY = top + 14 + p.v * (g.floor - top - 28) + Math.sin(a) * 8;
      const on = this._mixed ? inWater : 0;
      const x = lerp(restX, swirlX, on), y = lerp(restY, swirlY, on);
      const r = s.r * p.k * (this._sample === 'sugar' ? dis : 1);
      if (r < 0.4) continue;
      ctx.beginPath();
      if (this._sample === 'sand' || this._sample === 'sugar') ctx.arc(x, y, r, 0, TAU);
      else ctx.ellipse(x, y, r * 1.4, r * 0.62, a, 0, TAU);
      ctx.fillStyle = i % 3 ? s.tone(c) : darken(s.tone(c), 0.18);
      ctx.fill();
    }
    ctx.restore();
    // the stirring rod
    if (this._stir > 0) {
      const x = JAR.x + JAR.w / 2 + Math.sin(this._turn) * 90;
      ctx.strokeStyle = mix(c.glass, c.label, 0.3); ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + 24, 58); ctx.lineTo(x - 6, g.floor - 30); ctx.stroke();
    }
    drawGlassFront(ctx, c, g);
    const y0 = fs(38);
    pill(ctx, c, s.name, 340, y0, { bg: c.raised, ink: c.label, size: fs(22), display: true });
    if (this._mixed && this._stir === 0) {
      const dissolved = this._sample === 'sugar';
      chipRow(ctx, c, [
        { text: dissolved ? 'dissolved' : 'can still be seen', bg: dissolved ? c.accent : c.good },
        { text: s.word, bg: c.raised, ink: c.label },
      ], 340, 484, { align: 'center', size: fs(19), display: true });
    }
  }

  // ---- stage 1 -----------------------------------------------------------------------------------
  _muddyJar(ctx, c) {
    const m = this._wait, cloud = cloudAt(m), bed = bedAt(m);
    const g = glassBox('jar', JAR.x, JAR.y, JAR.w, JAR.h);
    const mud = mix(darken(c.gold, 0.5), c.flame, 0.12);
    drawGlass(ctx, c, g);
    const fill = mix(c.water, lighten(mud, 0.18), 0.1 + 0.8 * cloud * cloud);
    drawGlassLiquid(ctx, c, g, { level: 0.84, fill, opacity: 0.62 + 0.36 * cloud });
    const I = g.inner, top = g.floor - I.h * 0.84, bedH = 74 * bed;
    ctx.save();
    glassPath(ctx, g, I);
    ctx.clip();
    for (const f of FLECKS) {
      const fall = clamp01(m / (6 + f.u * 30));
      const y0 = top + 8 + f.v * (g.floor - top - 16);
      const y = lerp(y0, g.floor - 6 - bedH * f.v, fall);
      ctx.beginPath(); ctx.arc(I.x + 10 + f.u * (I.w - 20), y, f.r, 0, TAU);
      ctx.fillStyle = darken(mud, 0.2); ctx.fill();
    }
    if (bed > 0.01) {
      ctx.beginPath();
      ctx.moveTo(I.x, g.floor + 2);
      ctx.lineTo(I.x, g.floor - bedH);
      for (let i = 1; i <= 8; i += 1) ctx.quadraticCurveTo(I.x + (i - 0.5) * I.w / 8, g.floor - bedH - 6 * (i % 2 ? 1 : -0.5), I.x + i * I.w / 8, g.floor - bedH);
      ctx.lineTo(I.x + I.w, g.floor + 2);
      ctx.closePath();
      ctx.fillStyle = darken(mud, 0.12); ctx.fill();
      ctx.fillStyle = alpha(lighten(mud, 0.3), 0.55);
      ctx.fillRect(I.x, g.floor - bedH + 6, I.w, 4);
    }
    ctx.restore();
    drawGlassFront(ctx, c, g);
    // the reading
    pill(ctx, c, m >= 60 ? `${Math.round(m / 60 * 10) / 10} h` : `${m} min`, 340, fs(38), { bg: c.raised, ink: c.label, size: fs(26), display: true });
    if (m >= 10) {
      const y = g.floor - bedH / 2;
      pill(ctx, c, 'mud settled', 92, Math.min(y, 396), { bg: mud, ink: inkOn(c, mud), size: fs(16), display: true });
    }
    if (m >= 40) pill(ctx, c, 'still cloudy', 590, 210, { bg: c.warning, size: fs(18), display: true });
    else if (m === 0) pill(ctx, c, 'move the clock', 590, 210, { bg: c.raised, ink: c.label, size: fs(16) });
  }

  // ---- stage 2 -----------------------------------------------------------------------------------
  _filter(ctx, c, t) {
    const p = this._pour;
    const mud = mix(darken(c.gold, 0.5), c.flame, 0.12);
    const cloudy = mix(c.water, lighten(mud, 0.18), 0.6);
    // the flask under the funnel
    const fl = glassBox('flask', FLASK.x, FLASK.y, FLASK.w, FLASK.h);
    drawGlass(ctx, c, fl);
    if (p > 0.03) drawGlassLiquid(ctx, c, fl, { level: 0.08 + 0.46 * p, fill: cloudy, opacity: 0.86 });
    // retort stand
    ctx.fillStyle = darken(c.stroke, 0.1);
    rr(ctx, 148, 96, 9, BENCH_Y - 96, 4); ctx.fill();
    rr(ctx, 112, BENCH_Y - 10, 80, 10, 4); ctx.fill();
    rr(ctx, 150, 158, 118, 8, 4); ctx.fill();
    // the funnel and its paper
    const fu = glassBox('funnel', FUNNEL.x, FUNNEL.y, FUNNEL.w, FUNNEL.h);
    drawGlass(ctx, c, fu, { shadow: false });
    const px = FUNNEL.x + FUNNEL.w / 2;
    ctx.beginPath(); ctx.moveTo(px - 92, FUNNEL.y + 8); ctx.lineTo(px + 92, FUNNEL.y + 8); ctx.lineTo(px, FUNNEL.y + 118); ctx.closePath();
    ctx.fillStyle = lighten(c.glass, 0.82); ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.5); ctx.lineWidth = 2; ctx.stroke();
    // what stays on the paper
    if (p > 0) {
      ctx.save();
      ctx.beginPath(); ctx.moveTo(px - 84, FUNNEL.y + 12); ctx.lineTo(px + 84, FUNNEL.y + 12); ctx.lineTo(px, FUNNEL.y + 112); ctx.closePath(); ctx.clip();
      ctx.fillStyle = darken(mud, 0.1);
      const rise = FUNNEL.y + 112 - 62 * p;
      ctx.fillRect(px - 90, rise, 180, 120);
      ctx.restore();
    }
    drawGlassFront(ctx, c, fu);
    // the stream
    if (this._pouring) {
      ctx.fillStyle = alpha(cloudy, 0.9);
      const y0 = FUNNEL.y + FUNNEL.h - 8;
      for (let i = 0; i < 6; i += 1) {
        const u = (t * 2 + i / 6) % 1;
        ctx.beginPath(); ctx.ellipse(px, y0 + u * 66, 4, 7, 0, 0, TAU); ctx.fill();
      }
    }
    drawGlassFront(ctx, c, fl);
    // the lens: why it gets through
    this._lens(ctx, c, t, mud);
    const done = p >= 1;
    pill(ctx, c, done ? 'still cloudy' : p > 0 ? 'filtering' : 'muddy water', FLASK.x + FLASK.w / 2, fs(38), { bg: done ? c.warning : c.raised, ink: done ? undefined : c.label, size: fs(20), display: true });
  }

  _lens(ctx, c, t, mud) {
    const cx = 530, cy = 214, r = 112;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
    ctx.fillStyle = mix(c.bgSurface, c.water, 0.12); ctx.fill();
    ctx.clip();
    // the paper seen very close: fibres with gaps
    const fib = lighten(c.glass, 0.82);
    ctx.fillStyle = fib;
    for (let i = 0; i < 5; i += 1) { rr(ctx, cx - r - 4 + i * 54, cy - 12, 36, 26, 8); ctx.fill(); }
    const big = [[-74, -36, 21], [-20, -40, 22], [46, -38, 21], [12, -68, 18], [-48, -74, 17]];
    ctx.fillStyle = darken(mud, 0.05);
    for (const [dx, dy, gr] of big) { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, gr, 0, TAU); ctx.fill(); }
    const u = this._pouring ? t : 0;
    for (let i = 0; i < 18; i += 1) {
      const gap = i % 4;
      const fall = ((u * 0.5 + i * 0.137) % 1);
      ctx.beginPath(); ctx.arc(cx - r + 44 + gap * 54 + ((i * 7) % 11) - 5, cy - 20 + fall * 120, 4, 0, TAU);
      ctx.fillStyle = mud; ctx.fill();
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
    ctx.strokeStyle = darken(c.gold, 0.25); ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = alpha(lighten(c.gold, 0.3), 0.8); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r - 6, Math.PI * 1.1, Math.PI * 1.75); ctx.stroke();
    pill(ctx, c, 'filter paper', FUNNEL.x + FUNNEL.w / 2, 104, { bg: c.raised, ink: c.label, size: fs(15) });
    pill(ctx, c, 'larger grains stay', cx, cy - r - 16, { bg: c.raised, ink: c.label, size: fs(15) });
    pill(ctx, c, 'tiny grains pass', cx, cy + r + 18, { bg: c.raised, ink: c.label, size: fs(15) });
  }
}

const FUNNEL = { x: 168, y: 120, w: 208, h: 190 };
const FLASK = { x: 182, y: 248, w: 180, h: 174 };
