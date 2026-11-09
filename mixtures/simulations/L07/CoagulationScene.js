// CoagulationScene - blk-l07-s05. Alum makes fine grains clump, and the clumps sink.
//   stage 0  a lens on the cloudy water: the learner pushes two grains together and they spring apart
//   stage 1  alum goes in, the charges cancel, the lens shows grains touching and sticking, clumps appear in the beaker
//   stage 2  a clock: clumps sink, the water clears from the top down, then it can be poured off
//   stage 3  a dose dial: too little, right, too much (opposite charge). The result is read from the beaker
//   stage 4  hot milk and lemon juice: paneer is coagulation too
// Grains and clumps are drawn far larger than real. The dose numbers are model numbers.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  alpha, clamp01, darken, drawBackdrop, drawBench, drawFloor, drawVignette, lerp, lighten, mix, mulberry32, pill, chipRow, inkOn,
} from 'simulations/base/kit/SimLook.js';
import { glassBox, glassPath, drawGlass, drawGlassLiquid, drawGlassFront } from 'simulations/base/kit/SimGlass.js';
import { drawLens, lensPath } from './CentrifugeBenchKit.js';

const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);
const TAU = Math.PI * 2;

const BENCH_Y = 424;
const SIDE = { x: 44, y: 110, w: 252, h: 308 };
const MID = { x: 176, y: 96, w: 328, h: 322 };
const LENS = { x: 478, y: 224, r: 150 };
const GOOD = [4, 6];       // spoons on the dial
const MAP = [0, 1, 2, 3, 4].map((i) => [{ idx: i, dwellMs: null }]);

const CLUMPS = (() => {
  const rnd = mulberry32(7);
  return Array.from({ length: 16 }, () => {
    const parts = Array.from({ length: 7 }, () => ({ a: rnd() * TAU, d: 3 + rnd() * 15, r: 6 + rnd() * 6 }));
    return { u: rnd(), v: rnd(), parts, drop: 0.5 + rnd() * 0.5 };
  });
})();
const SPECK = (() => {
  const rnd = mulberry32(19);
  return Array.from({ length: 60 }, () => ({ u: rnd(), v: rnd() }));
})();
const GRAINS = [[-92, -78], [10, -96], [96, -52], [-108, 28], [-14, 6], [84, 54], [-60, 100], [30, 104]];
const STUCK = [[-30, -18], [14, -30], [40, 6], [-44, 22], [0, 8], [30, 42], [-16, 50], [-58, -12]];

const mudOf = (c) => mix(darken(c.gold, 0.5), c.flame, 0.12);

export class CoagulationScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'Cloudy muddy water in a beaker, with a lens showing tiny grains that each carry the same charge and push one another away. Alum cancels the charge, so the grains stick into clumps that can be seen. The clumps sink and clear water is left on top. Too little alum makes few clumps. Too much gives the grains the opposite charge and the water stays cloudy. Lemon juice does the same job to the proteins in hot milk, making paneer.';
  static CONTROLS = [
    { type: 'button', id: 'push', label: 'Push two grains together' },
    { type: 'button', id: 'alum', label: 'Add alum and stir' },
    { type: 'slider', id: 'wait', label: 'Minutes left to stand', min: 0, max: 60, step: 5, value: 0 },
    { type: 'slider', id: 'dose', label: 'Spoons of alum', min: 0, max: 10, step: 1, value: 0 },
    { type: 'button', id: 'stir', label: 'Stir' },
    { type: 'button', id: 'lemon', label: 'Add lemon juice' },
    { type: 'button', id: 'again', label: 'Start again' },
  ];

  constructor(container, config) {
    super(container, config);
    this._fresh();
  }

  _fresh() {
    this._push = 0;              // 0..1 of one push and spring back
    this._g = 0;                 // clump growth 0..1
    this._adding = false;
    this._wait = 0;
    this._dose = 0; this._stirred = null; this._stirT = 0;
    this._lemon = 0; this._squeezing = false;
    this._seen = new Set();
    this._ended = { low: false, high: false };
  }

  enter(stage) {
    this._fresh();
    if (stage === 2) this._g = 1;
    this.requestUiUpdate?.();
  }

  isControlHidden(id) {
    const st = this.stage;
    if (id === 'push') return st !== 0;
    if (id === 'alum') return st !== 1;
    if (id === 'wait') return st !== 2;
    if (id === 'dose' || id === 'stir') return st !== 3;
    if (id === 'lemon') return st !== 4;
    return st !== 1 && st !== 4;
  }
  isControlDisabled(id) {
    if (id === 'push') return this._push > 0;
    if (id === 'alum') return this._adding || this._g >= 1;
    if (id === 'stir') return this._stirT > 0;
    if (id === 'lemon') return this._squeezing || this._lemon >= 1;
    return false;
  }
  getControlValue(id) {
    if (id === 'wait') return String(this._wait);
    if (id === 'dose') return String(this._dose);
    return super.getControlValue(id);
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'push') this._push = 0.001;
    else if (id === 'alum') this._adding = true;
    else if (id === 'wait') {
      this._wait = Number(v);
      if (this._wait >= 30) this._find(340, 170, 'water-clear');
    } else if (id === 'dose') { this._dose = Number(v); this._stirred = null; } else if (id === 'stir') { this._stirT = 1.4; this._stirred = null; } else if (id === 'lemon') this._squeezing = true;
    else if (id === 'again') { const st = this.stage; this._fresh(); if (st === 2) this._g = 1; }
    this.animateFor(600);
    this.requestUiUpdate?.();
  }

  _find(x, y, key) {
    if (this._seen.has(key)) return;
    this._seen.add(key);
    this.celebrate(x, y, 18, { key, small: true });
  }

  update(d) {
    if (this._push > 0) {
      this._push += d / 1.8;
      if (this._push >= 1) { this._push = 0; this.requestUiUpdate?.(); this._find(LENS.x, LENS.y, 'grains-repel'); }
    }
    if (this._adding) {
      this._g = Math.min(1, this._g + d / 4);
      if (this._g >= 1) { this._adding = false; this.requestUiUpdate?.(); }
    }
    if (this._stirT > 0) {
      this._stirT = Math.max(0, this._stirT - d);
      if (this._stirT === 0) {
        this._stirred = this._dose;
        if (this._dose < GOOD[0]) this._ended.low = true;
        else if (this._dose > GOOD[1]) this._ended.high = true;
        if (this._ended.low && this._ended.high) this._find(MID.x + MID.w / 2, 260, 'dose-ends');
        this.requestUiUpdate?.();
      }
    }
    if (this._squeezing) {
      this._lemon = Math.min(1, this._lemon + d / 4);
      if (this._lemon >= 1) { this._squeezing = false; this.requestUiUpdate?.(); }
    }
  }

  busy() { return this._push > 0 || this._adding || this._stirT > 0 || this._squeezing; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, BENCH_Y + 58);
    drawBench(ctx, c, 24, 656, BENCH_Y, { h: 58 });
    const st = this.stage;
    if (st === 0) this._why(ctx, c);
    else if (st === 1) this._alum(ctx, c);
    else if (st === 2) this._sink(ctx, c);
    else if (st === 3) this._doseView(ctx, c);
    else this._paneer(ctx, c);
    drawVignette(ctx, c, 0.35);
  }

  /** One beaker. o: { cloud 0..1, clump 0..1, fall 0..1, box } */
  _beaker(ctx, c, box, o) {
    const mud = mudOf(c);
    const g = glassBox('beaker', box.x, box.y, box.w, box.h);
    drawGlass(ctx, c, g);
    const cloud = o.cloud ?? 1, fall = o.fall ?? 0, clump = o.clump ?? 0;
    const top = g.floor - g.inner.h * 0.78;
    drawGlassLiquid(ctx, c, g, { level: 0.78, fill: mix(c.water, lighten(mud, 0.18), 0.08 + 0.72 * cloud), opacity: 0.6 + 0.36 * cloud });
    const I = g.inner;
    ctx.save();
    glassPath(ctx, g, I);
    ctx.clip();
    const floor = g.floor;
    if (cloud > 0.3 && clump < 0.5) {
      ctx.fillStyle = alpha(darken(mud, 0.2), 0.55);
      for (const s of SPECK) { ctx.beginPath(); ctx.arc(I.x + 6 + s.u * (I.w - 12), top + 6 + s.v * (floor - top - 12), 2, 0, TAU); ctx.fill(); }
    }
    const n = Math.round(CLUMPS.length * Math.min(1, (o.count ?? 1)));
    for (let i = 0; i < n; i += 1) {
      const k = CLUMPS[i];
      const s = clamp01(clump * 1.3 - k.u * 0.3);
      if (s <= 0) continue;
      const y0 = top + 26 + k.v * (floor - top - 70);
      const yEnd = floor - 12 - k.u * 30;
      const f = clamp01(fall / k.drop);
      const y = lerp(y0, yEnd, f * f * (3 - 2 * f));
      const x = I.x + 32 + ((i * 0.381966) % 1) * (I.w - 64);
      for (const p of k.parts) {
        ctx.beginPath();
        ctx.arc(x + Math.cos(p.a) * p.d * s, y + Math.sin(p.a) * p.d * s, p.r * s, 0, TAU);
        ctx.fillStyle = darken(mud, 0.12); ctx.fill();
      }
    }
    if (fall > 0.1) {
      const bed = 44 * clamp01((fall - 0.1) / 0.8);
      ctx.fillStyle = darken(mud, 0.12);
      ctx.fillRect(I.x, floor - bed, I.w, bed + 3);
    }
    ctx.restore();
    drawGlassFront(ctx, c, g);
    return g;
  }

  _grain(ctx, c, x, y, r, sign, a = 1) {
    const mud = mudOf(c);
    ctx.fillStyle = lighten(mud, 0.1);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = darken(mud, 0.3); ctx.lineWidth = 3; ctx.stroke();
    if (sign && a > 0.02) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = lighten(c.glass, 0.8); ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y);
      if (sign > 0) { ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9); }
      ctx.stroke();
      ctx.restore();
    }
  }

  /** The lens over the water. stuck 0..1 walks the grains together; sign is their charge. */
  _lens(ctx, c, stuck, sign, signA) {
    const { x, y, r } = LENS;
    ctx.save();
    lensPath(ctx, x, y, r);
    ctx.clip();
    ctx.fillStyle = mix(c.water, mudOf(c), 0.28);
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    const u = this._push;
    const bump = u > 0 ? Math.sin(Math.min(1, u) * Math.PI) : 0;
    GRAINS.forEach((p, i) => {
      let gx = lerp(p[0], STUCK[i][0], stuck), gy = lerp(p[1], STUCK[i][1], stuck);
      if (i === 4) { gx += 34 * bump; gy -= 12 * bump; }
      if (i === 5) { gx -= 34 * bump; gy -= 16 * bump; }
      this._grain(ctx, c, x + gx, y + gy, 27, sign, signA);
    });
    if (bump > 0.75) {
      ctx.strokeStyle = c.warning; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x + 42, y + 18, 42, -2.4, -1.1); ctx.stroke();
    }
    ctx.restore();
    drawLens(ctx, c, { cx: x, cy: y, r, handle: 'none' });
  }

  _why(ctx, c) {
    this._beaker(ctx, c, SIDE, { cloud: 1 });
    this._lens(ctx, c, 0, -1, 1);
    const tag = { bg: c.raised, ink: c.label, size: fs(18), display: true };
    pill(ctx, c, 'same charge', LENS.x, fs(34), tag);
    pill(ctx, c, 'cloudy water', SIDE.x + SIDE.w / 2, fs(34), tag);
    if (this._push === 0 && this._seen.has('grains-repel')) pill(ctx, c, 'they push apart', 340, 484, { bg: c.warning, size: fs(19), display: true });
  }

  _alum(ctx, c) {
    const g = this._g;
    this._beaker(ctx, c, SIDE, { cloud: 1, clump: g });
    if (this._adding && g < 0.3) {
      ctx.fillStyle = lighten(c.glass, 0.8);
      const rnd = mulberry32(3);
      for (let i = 0; i < 22; i += 1) {
        const y = 118 + ((g * 900 + rnd() * 90) % 90);
        ctx.beginPath(); ctx.arc(SIDE.x + SIDE.w / 2 - 34 + rnd() * 68, y, 3.5, 0, TAU); ctx.fill();
      }
    }
    this._lens(ctx, c, clamp01((g - 0.25) / 0.6), -1, 1 - clamp01(g / 0.3));
    const tag = { bg: c.raised, ink: c.label, size: fs(18), display: true };
    pill(ctx, c, g < 0.25 ? 'alum' : g < 1 ? 'charge cancelled' : 'clumps', LENS.x, fs(34), { ...tag, bg: g >= 1 ? c.good : c.raised, ink: g >= 1 ? inkOn(c, c.good) : c.label });
    pill(ctx, c, 'coagulation', SIDE.x + SIDE.w / 2, fs(34), tag);
  }

  _sink(ctx, c) {
    const f = clamp01(this._wait / 40);
    this._beaker(ctx, c, MID, { cloud: 1 - f * 0.95, clump: 1, fall: f });
    pill(ctx, c, `${this._wait} min`, 340, fs(38), { bg: c.raised, ink: c.label, size: fs(26), display: true });
    if (this._wait >= 30) pill(ctx, c, 'clear water on top', 340, 484, { bg: c.good, size: fs(19), display: true });
    else if (this._wait === 0) pill(ctx, c, 'move the clock', 340, 484, { bg: c.accent, size: fs(17), display: true });
  }

  _doseView(ctx, c) {
    const d = this._stirred;
    const res = d === null ? null : d < GOOD[0] ? 'low' : d > GOOD[1] ? 'high' : 'ok';
    const cl = res === 'ok' ? 1 : res === 'low' ? 0.8 : 0;
    this._beaker(ctx, c, MID, { cloud: res === 'ok' ? 0.42 : 1, clump: res ? cl : 0, count: res === 'low' ? 0.2 + d * 0.08 : 1, fall: res === 'ok' ? 0.9 : 0 });
    if (this._stirT > 0) {
      const x = 340 + Math.sin(this._stirT * 9) * 90;
      ctx.strokeStyle = mix(c.glass, c.label, 0.3); ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + 20, 60); ctx.lineTo(x - 6, 380); ctx.stroke();
    }
    pill(ctx, c, `${this._dose} ${this._dose === 1 ? 'spoon' : 'spoons'}`, 340, fs(38), { bg: c.raised, ink: c.label, size: fs(24), display: true });
    if (res) {
      const label = res === 'ok' ? 'clumps sink, water clears' : res === 'low' ? 'too little: few clumps' : 'too much: grains push apart';
      pill(ctx, c, label, 340, 484, { bg: res === 'ok' ? c.good : c.warning, size: fs(18), display: true });
    }
  }

  _paneer(ctx, c) {
    const p = this._lemon;
    const box = { x: 170, y: 118, w: 340, h: 300 };
    const g = glassBox('beaker', box.x, box.y, box.w, box.h);
    const milk = lighten(c.glass, 0.86), whey = mix(lighten(c.gold, 0.5), c.good, 0.14);
    drawGlass(ctx, c, g);
    drawGlassLiquid(ctx, c, g, { level: 0.74, fill: mix(milk, whey, p * p), opacity: 0.96 - 0.25 * p });
    const I = g.inner, top = g.floor - I.h * 0.74;
    ctx.save();
    glassPath(ctx, g, I);
    ctx.clip();
    if (p > 0.1) {
      CLUMPS.forEach((k, i) => {
        const s = clamp01((p - 0.1) * 1.4 - k.u * 0.2);
        const x = I.x + 30 + ((i * 0.381966) % 1) * (I.w - 60);
        const y = lerp(top + 30 + k.v * 150, g.floor - 22 - k.v * 56, p * p);
        for (const q of k.parts) {
          ctx.beginPath(); ctx.arc(x + Math.cos(q.a) * q.d * s, y + Math.sin(q.a) * q.d * s, (q.r + 4) * s, 0, TAU);
          ctx.fillStyle = lighten(c.glass, 0.92); ctx.fill();
          ctx.strokeStyle = alpha(mix(c.gold, c.glass, 0.5), 0.55); ctx.lineWidth = 1.5; ctx.stroke();
        }
      });
    }
    ctx.restore();
    drawGlassFront(ctx, c, g);
    if (this._squeezing) {
      ctx.fillStyle = mix(c.gold, c.good, 0.2);
      for (let i = 0; i < 5; i += 1) {
        const u = (p * 30 + i / 5) % 1;
        ctx.beginPath(); ctx.ellipse(340, 60 + u * 80, 6, 9, 0, 0, TAU); ctx.fill();
      }
    }
    pill(ctx, c, p >= 1 ? 'paneer' : 'hot milk', 340, fs(36), { bg: p >= 1 ? c.good : c.raised, ink: p >= 1 ? undefined : c.label, size: fs(20), display: true });
    if (p >= 1) chipRow(ctx, c, [{ text: 'coagulant: lemon juice', bg: c.raised, ink: c.label }], 340, 484, { align: 'center', size: fs(18), display: true });
  }
}
