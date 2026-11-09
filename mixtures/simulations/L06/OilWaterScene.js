// OilWaterScene - blk-l06-s01, three beats. One tall glass of water on the lab bench.
//   b0  the learner pours mustard oil in: it dives, rises as blobs, and gathers in a layer with one sharp line
//   b1  the learner shakes the glass: tiny oil drops fill the water and it goes cloudy gold. Stopped, the drops rise
//       (big ones first) and join the layer on top. Nothing dissolved.
//   b2  try other liquids: kerosene floats, chloroform sinks. The find is the order turning over.
// Heights come from one volume, so the layer comes back to exactly where it was.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, darken, drawBackdrop, drawBench, lighten, mix, mulberry32, outBack, pill } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { glassBox, drawGlass, drawGlassFront } from 'simulations/base/kit/SimGlass.js';

// Phone: the scene is under half size, so small text is raised to read at about 10 px.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;
const fs = (px) => (PHONE ? Math.max(px, 25) : px);

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, u) => a + (b - a) * u;
const BENCH_Y = 442;
const GLASS = { x: 214, y: 84, w: 252, h: BENCH_Y - 84 + 2 };
const WATER_H = 188, LAYER_H = 96;
const POUR_S = 3, SHAKE_S = 1.5, RISE_S = 6.5, SWAP_S = 1.5;
const S_POUR = 0, S_SHAKE = 1, S_ORDER = 2;
const MAP = [[{ idx: S_POUR, dwellMs: null }], [{ idx: S_SHAKE, dwellMs: null }], [{ idx: S_ORDER, dwellMs: null }]];
const LIQ = {
  oil: { label: 'mustard oil', top: true },
  kerosene: { label: 'kerosene', top: true },
  chloroform: { label: 'chloroform', top: false },
};
const tone = (c, id) => (id === 'oil' ? mix(c.gold, c.s8, 0.25)
  : id === 'kerosene' ? mix(c.gold, c.glass, 0.72) : lighten(mix(c.glass, c.s5, 0.35), 0.25));
const HOME = { x: 112, y: BENCH_Y };
const TIP = { x: 100, y: 14, ang: 2.05 };
const MOUTH = { x: TIP.x + 176 * Math.sin(TIP.ang), y: TIP.y - 176 * Math.cos(TIP.ang) };

export class OilWaterScene extends SimScene {
  static BEAT_STEP_MAP = MAP;
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A tall glass of water. Mustard oil poured in rises and forms a layer on top with one sharp line. Shaken, the glass goes cloudy; left to stand, the drops rise and the layer comes back. Kerosene also floats; chloroform sinks below the water.';
  static CONTROLS = [
    { type: 'button', id: 'pour', label: 'Pour in the oil' },
    { type: 'button', id: 'shake', label: 'Shake the glass' },
    { type: 'segmented', id: 'liquid', label: 'Second liquid', value: 'oil', options: [{ value: 'oil', label: 'Mustard oil' }, { value: 'kerosene', label: 'Kerosene' }, { value: 'chloroform', label: 'Chloroform' }] },
  ];

  constructor(container, config) {
    super(container, config);
    const r = mulberry32(9);
    this._drops = Array.from({ length: 90 }, () => {
      const s = r();
      return { x: r() * 2 - 1, y: r(), r: 3.5 + s * s * 8, ph: r() * TAU };
    });
    this._rest(0, 'oil');
    this._flipped = false;
  }

  _rest(layer, liq) {
    this._liq = liq;
    this._layer = layer;      // 0..1 of the settled layer
    this._kind = '';          // pour | shake | rise | swap
    this._t = 0;
    this._cloud = 0;
  }

  enter(stage) {
    this._rest(stage === S_POUR ? 0 : 1, 'oil');
    this._flipped = false;
  }

  _start(kind) {
    if (this._kind) return;
    if (reducedMotion()) { this._cloud = 0; this._layer = 1; return; }
    this._kind = kind; this._t = 0;
  }

  update(d) {
    if (!this._kind) return;
    this._t += d;
    const t = this._t;
    if (this._kind === 'pour') {
      this._layer = clamp01((t - 0.4) / (POUR_S - 1.1));
      if (t >= POUR_S) this._kind = '';
    } else if (this._kind === 'shake') {
      this._cloud = clamp01(t / 0.5);
      this._layer = 1 - this._cloud;
      if (t >= SHAKE_S) { this._kind = 'rise'; this._t = 0; }
    } else if (this._kind === 'rise') {
      const u = clamp01(t / RISE_S);
      this._cloud = (1 - u) ** 1.4;
      this._layer = 1 - this._cloud;
      if (u >= 1) { this._kind = ''; this._cloud = 0; this._layer = 1; }
    } else if (this._kind === 'swap') {
      this._layer = clamp01(t / SWAP_S);
      if (t >= SWAP_S) this._kind = '';
    }
  }

  busy() { return !!this._kind; }

  _shakeX() { return this._kind === 'shake' ? Math.sin(this._t * 38) * 9 : 0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    drawBench(ctx, c, -20, 700, BENCH_Y, { h: 110 });
    this._bottle(ctx, c);
    ctx.save();
    ctx.translate(this._shakeX(), 0);
    this._glass(ctx, c);
    ctx.restore();
    this._labels(ctx, c);
  }

  _glass(ctx, c) {
    const g = glassBox('beaker', GLASS.x, GLASS.y, GLASS.w, GLASS.h, { wall: 8, r: 16, spout: false });
    drawGlass(ctx, c, g);
    const f = g.floor, L = g.inner.x, W = g.inner.w;
    const up = LIQ[this._liq].top;
    const h2 = LAYER_H * this._layer;
    const hd = LAYER_H * (1 - this._layer) * (this._cloud > 0 ? 1 : 0);   // oil spread through the water, still counted in the height
    const waterCol = alpha(c.water, 0.62);
    const second = tone(c, this._liq);
    const lowH = up ? WATER_H + hd : h2;
    const upH = up ? h2 : WATER_H;
    const lineY = f - lowH;
    const surfY = lineY - upH;
    ctx.save();
    ctx.beginPath(); ctx.rect(L, g.top, W, g.floor - g.top); ctx.clip();
    // the lower layer
    ctx.fillStyle = up ? waterCol : second;
    ctx.fillRect(L, lineY, W, lowH);
    if (upH > 0.5) {
      const grad = ctx.createLinearGradient(0, surfY, 0, lineY);
      grad.addColorStop(0, up ? lighten(second, 0.12) : alpha(lighten(c.water, 0.1), 0.62));
      grad.addColorStop(1, up ? darken(second, 0.08) : alpha(c.water, 0.65));
      ctx.fillStyle = grad;
      ctx.fillRect(L, surfY, W, upH);
    }
    if (this._cloud > 0) {
      ctx.fillStyle = alpha(mix(second, c.label, 0.06), 0.62 * this._cloud);
      ctx.fillRect(L, lineY, W, lowH);
    }
    this._blobs(ctx, c, g, lineY, second, up);
    // the one sharp line and the surface
    if (lowH > 1 && upH > 1) {
      ctx.fillStyle = darken(second, 0.35);
      ctx.fillRect(L, lineY - 1.5, W, 3);
    }
    ctx.fillStyle = alpha(lighten(up ? second : c.water, 0.5), 0.85);
    ctx.fillRect(L, surfY, W, 2.5);
    ctx.restore();
    drawGlassFront(ctx, c, g);
    if (this.stage === S_SHAKE) this._lid(ctx, c, g);
    if (this._kind === 'pour') this._stream(ctx, c, surfY, second);
  }

  _blobs(ctx, c, g, lineY, col, up) {
    const k = this._kind;
    const drop = (x, y, r) => {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = alpha(lighten(col, 0.6), 0.75);
      ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.26, 0, TAU); ctx.fill();
    };
    const cx = g.cx, hw = g.inner.w / 2 - 16;
    if (k === 'pour' && this._t > 0.3) {
      // poured oil dives in near the stream and comes back up as blobs
      for (let i = 0; i < 16; i++) {
        const d = this._drops[i];
        const age = ((this._t * 1.1 + d.ph) % 1.3) / 1.3;
        const x = cx - 70 + d.x * 46 + Math.sin(age * 5 + d.ph) * 5;
        const y = lerp(lineY + 96 + d.y * 40, lineY + 6, age);
        drop(x, y, d.r * 1.3);
      }
    } else if (k === 'swap') {
      for (let i = 0; i < 16; i++) {
        const d = this._drops[i];
        const age = ((this._t * 1.1 + d.ph) % 1.3) / 1.3;
        const x = cx + d.x * hw * 0.7;
        const y = up ? lerp(lineY + 70, lineY + 4, age) : lerp(g.top + 60, lineY - 4, age);
        drop(x, y, d.r * 1.3);
      }
    } else if (this._cloud > 0.002) {
      const H = g.floor - lineY;
      const shaking = k === 'shake';
      for (const d of this._drops) {
        const speed = 0.25 + (d.r / 11.5) ** 2 * 1.5;                // bigger drops rise faster
        const prog = shaking ? 0 : (this._t / RISE_S) * speed * 1.6;
        const y0 = d.y;
        const yy = y0 - prog;
        if (yy < 0) continue;
        const wob = shaking ? Math.sin(this._t * 24 + d.ph) * 16 : 0;
        const wob2 = shaking ? Math.cos(this._t * 21 + d.ph * 2) * 14 : 0;
        drop(cx + d.x * hw + wob, lineY + 6 + yy * (H - 12) + wob2, d.r);
      }
    }
  }

  _lid(ctx, c, g) {
    const col = mix(c.stroke, c.bgDeep, 0.2);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.roundRect(g.x - 8, g.y - 12, g.w + 16, 18, 7); ctx.fill();
    ctx.fillStyle = alpha(lighten(col, 0.4), 0.6);
    ctx.fillRect(g.x, g.y - 8, g.w, 3);
  }

  _stream(ctx, c, surfY, col) {
    const u = clamp01(this._t / 0.4), v = clamp01((POUR_S - this._t) / 0.6);
    const a = Math.min(u, v);
    if (a <= 0) return;
    ctx.strokeStyle = alpha(col, a); ctx.lineCap = 'round'; ctx.lineWidth = 11 * a;
    ctx.beginPath(); ctx.moveTo(MOUTH.x, MOUTH.y); ctx.quadraticCurveTo(MOUTH.x + 6, (MOUTH.y + surfY) / 2, MOUTH.x + 6, surfY + 14); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(col, 0.5), 0.6 * a); ctx.lineWidth = 3;
    ctx.stroke();
  }

  // The oil bottle stands to the left and tips over the glass during the pour.
  _bottle(ctx, c) {
    if (this.stage !== S_POUR) return;
    const pouring = this._kind === 'pour';
    const u = pouring ? Math.min(clamp01(this._t / 0.4), clamp01((POUR_S - this._t) / 0.4)) : 0;
    const e = reducedMotion() ? 0 : outBack(u) * u + (1 - u) * 0;
    const x = lerp(HOME.x, TIP.x, e), y = lerp(HOME.y, TIP.y, e), ang = lerp(0, TIP.ang, e);
    const col = tone(c, 'oil');
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    const g = glassBox('bottle', -44, -176, 88, 176, { wall: 5, r: 10, neck: 0.36 });
    drawGlass(ctx, c, g, { shadow: !pouring });
    ctx.save();
    ctx.beginPath(); ctx.rect(-40, -126 + 62 * this._layer * 0.6, 80, 128); ctx.clip();
    ctx.fillStyle = alpha(col, 0.92);
    ctx.beginPath(); ctx.roundRect(-39, -130, 78, 128, 8); ctx.fill();
    ctx.restore();
    drawGlassFront(ctx, c, g);
    ctx.fillStyle = darken(col, 0.45);
    ctx.fillRect(-14, -188, 28, 13);
    ctx.restore();
  }

  _labels(ctx, c) {
    const f = GLASS.y + GLASS.h - 8;
    const x = 560;
    const up = LIQ[this._liq].top;
    const name = LIQ[this._liq].label;
    const settled = !this._kind && this._layer >= 1;
    const col = tone(c, this._liq);
    if (this.stage === S_POUR) pill(ctx, c, 'mustard oil', HOME.x, BENCH_Y - 196, { bg: col, size: fs(20), display: true, alpha: this._kind || this._layer > 0 ? 0 : 1 });
    if (this._layer > 0.6 && !this._cloud) {
      const yUp = up ? f - WATER_H - LAYER_H / 2 : f - LAYER_H - WATER_H / 2;
      const yLow = up ? f - WATER_H / 2 : f - LAYER_H / 2;
      pill(ctx, c, up ? name : 'water', x, yUp, { bg: up ? col : c.water, size: fs(21), display: true });
      pill(ctx, c, up ? 'water' : name, x, yLow, { bg: up ? c.water : col, size: fs(21), display: true });
    }
    if (settled && this._layer >= 1) {
      const lineY = up ? f - WATER_H : f - LAYER_H;
      pill(ctx, c, 'one sharp line', 106, lineY, { bg: c.raised, size: fs(19), display: true });
    }
    if (this.stage === S_SHAKE && this._cloud > 0.2) {
      const t = this._kind === 'shake' ? 'cloudy gold' : 'tiny drops rising';
      pill(ctx, c, t, x, 240, { bg: c.warning, size: fs(19), display: true });
    }
    const hint = this._hint();
    if (hint) pill(ctx, c, hint, 340, 44, { bg: c.accent, size: fs(20), display: true, alpha: reducedMotion() ? 1 : 0.84 + 0.16 * Math.sin(this.clock * 3) });
  }

  _hint() {
    if (this.stage === S_POUR && this._layer === 0 && !this._kind) return 'pour in the oil';
    if (this.stage === S_SHAKE && !this._kind && this._layer >= 1) return 'shake it, then watch';
    if (this.stage === S_ORDER && this._liq === 'oil' && !this._kind) return 'try the other liquids';
    return '';
  }

  _swap(v) {
    if (!LIQ[v] || v === this._liq || this._kind) return;
    this._liq = v;
    this._layer = 0;
    if (reducedMotion()) this._layer = 1; else { this._kind = 'swap'; this._t = 0; }
    if (v === 'chloroform' && !this._flipped) {
      this._flipped = true;
      this.after(1.5, () => this.celebrate(GLASS.x + GLASS.w / 2, BENCH_Y - 60, 20, { key: 'order-flips', lookAt: true }));
    }
  }

  pointerDown(p) {
    const onGlass = p.x > GLASS.x - 10 && p.x < GLASS.x + GLASS.w + 10 && p.y > GLASS.y - 16 && p.y < BENCH_Y;
    if (this.stage === S_POUR && this._layer === 0 && (onGlass || p.x < GLASS.x)) this._start('pour');
    if (this.stage === S_SHAKE && onGlass) this._start('shake');
  }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'pour') this._start('pour');
    else if (id === 'shake') this._start('shake');
    else if (id === 'liquid') this._swap(String(v));
    this.requestUiUpdate?.();
  }

  getControlValue(id) { return id === 'liquid' ? this._liq : super.getControlValue(id); }

  isControlHidden(id) {
    if (id === 'pour') return this.stage !== S_POUR;
    if (id === 'shake') return this.stage !== S_SHAKE;
    if (id === 'liquid') return this.stage !== S_ORDER;
    return false;
  }

  isControlDisabled(id) {
    if (id === 'pour') return !!this._kind || this._layer > 0;
    if (id === 'shake') return !!this._kind;
    if (id === 'liquid') return !!this._kind;
    return false;
  }
}
