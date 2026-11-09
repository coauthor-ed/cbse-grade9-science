import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, drawCard, pill, font, alpha, lighten, darken, mix, rr, clamp01,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { displacementArrow } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

// Book Ex 7.8: a child on a slide of height h; v = sqrt(2gh) at the bottom.
//   blk-l05-s06 (2 beats): stage 0 one child slides down one straight slide; U turns into K.
//                          stage 1 v = sqrt(2gh) small, and the 6 m/s tag, biggest (h = 1.8 m).
//   blk-l05-s07 (3 beats): stage 2 a light and a heavy child on the same slide, the same speed;
//                          stage 3 three slides from one platform, the same speed at each foot;
//                          stage 4 real slides: friction, a little heat, more on the longer path.
const MAP_S06 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
const MAP_S07 = [[{ idx: 2, dwellMs: null }], [{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }]];

const G = 10;
const GROUND = 462;
const LIP_Y = 432; // the slide bed at the foot (a low exit lip)
const S = { x: 178, y: 196 }; // the top of every slide (the platform edge)
const HPX = LIP_Y - S.y; // the drop, px
const PXM = HPX / 1.8; // px per metre: the drop is 1.8 m
const SPEED = 6; // sqrt(2 x 10 x 1.8)

// three slides: x at the foot of the slope, the lip end, the shape of the drop, the tone
const SLIDES = {
  straight: { xr: 400, xe: 560, tone: 's1', shape: (q) => 1 - q },
  curved: { xr: 500, xe: 575, tone: 's6', shape: (q) => 1 - q * q * (3 - 2 * q) },
  wavy: { xr: 600, xe: 664, tone: 's5', shape: (q) => (1 - q) * (1 + 0.07 * Math.sin(4 * Math.PI * q)) },
};
const HEAT = { straight: 0.07, curved: 0.11, wavy: 0.18 }; // made-up shares, for the picture only

function yOn(sl, x) {
  if (x >= sl.xr) return LIP_Y;
  const q = clamp01((x - S.x) / (sl.xr - S.x));
  return LIP_Y - HPX * sl.shape(q);
}

// time along a slide: v = sqrt(2 g drop) on the slope; the lip slows the child to rest
function timeTable(sl, stopX) {
  const N = 360;
  const xs = [];
  const ts = [];
  let t = 0;
  let px = S.x;
  let py = yOn(sl, S.x);
  for (let i = 0; i <= N; i++) {
    const x = S.x + ((stopX - S.x) * i) / N;
    const y = yOn(sl, x);
    const ds = Math.hypot(x - px, y - py) / PXM;
    let v = Math.sqrt(2 * G * Math.max(0, (y - S.y) / PXM) + 0.3);
    if (x > sl.xr) v = Math.max(0.7, SPEED * (1 - (x - sl.xr) / (stopX - sl.xr + 1)));
    if (i > 0) t += ds / v;
    xs.push(x);
    ts.push(t);
    px = x;
    py = y;
  }
  return { xs, ts, end: t };
}

function xAt(tab, t) {
  if (t <= 0) return tab.xs[0];
  if (t >= tab.end) return tab.xs[tab.xs.length - 1];
  let lo = 0;
  let hi = tab.ts.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (tab.ts[m] < t) lo = m; else hi = m;
  }
  const k = (t - tab.ts[lo]) / (tab.ts[hi] - tab.ts[lo] || 1);
  return tab.xs[lo] + (tab.xs[hi] - tab.xs[lo]) * k;
}

// riders per stage: slide, where they stop, start delay, size, look
const RIDERS = [
  [{ sl: 'straight', stop: 520, delay: 0, h: 118, i: 0 }],
  [{ sl: 'straight', stop: 520, delay: 0, h: 118, i: 0 }],
  [{ sl: 'straight', stop: 530, delay: 0, h: 104, i: 0, tag: 'light' },
    { sl: 'straight', stop: 432, delay: 0.55, h: 140, i: 1, tag: 'heavy' }],
  [{ sl: 'straight', stop: 440, delay: 0, h: 104, i: 0 },
    { sl: 'curved', stop: 545, delay: 0.3, h: 104, i: 2 },
    { sl: 'wavy', stop: 632, delay: 0.6, h: 104, i: 3 }],
];
RIDERS[4] = RIDERS[3];
const TABLES = RIDERS.map((rs) => rs.map((r) => timeTable(SLIDES[r.sl], r.stop)));
const SLIDES_IN = [['straight'], ['straight'], ['straight'], ['wavy', 'curved', 'straight'], ['wavy', 'curved', 'straight']];

export class SlideSpeedRevealScene extends SimScene {
  static CONTROLS_IN_SIGHT = true;   // drive TRAY_CLOSED: controls below, not in a closed tray
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = MAP_S06;
  static BEAT_MAPS = { 2: MAP_S06, 3: MAP_S07 };
  static NOTE_STAGE = -1;
  static ARIA_LABEL = 'A playground slide 1.8 m high, seen from the side. A child slides down from the platform: the U bar empties as the K bar fills. At the bottom v = the square root of 2gh, 6 m/s. Next a light child and a heavy child slide down the same slide and both reach 6 m/s. Then three slides of different shapes start at the same platform and all three children reach 6 m/s. With friction, each path turns a little energy into heat, more on the longer, wavier path.';
  static CONTROLS = [{ type: 'button', id: 'again', label: 'Slide again' }];

  enter() {
    this.runT0 = 0;
  }

  onControlChange(id) {
    if (!this._guard(id)) return;
    if (id === 'again') {
      this.runT0 = this.age;
      this.animateFor?.(200);
    }
  }

  t() {
    return reducedMotion() ? 99 : this.age - (this.runT0 || 0) - 0.3;
  }

  busy() {
    const end = Math.max(...RIDERS[this.stage].map((r, k) => r.delay + TABLES[this.stage][k].end));
    return this.t() < end + 0.9;
  }

  draw(ctx, c) {
    const s = this.stage;
    const t = this.t();
    drawBackdrop(ctx, c, 'sky');
    drawFloor(ctx, c, GROUND, {});
    for (const name of SLIDES_IN[s]) this.slide(ctx, c, name, s === 4);
    this.tower(ctx, c);
    // riders: back slides first
    const order = RIDERS[s].map((r, k) => k).reverse();
    const pos = [];
    for (const k of order) {
      const r = RIDERS[s][k];
      const sl = SLIDES[r.sl];
      const x = xAt(TABLES[s][k], t - r.delay);
      const y = yOn(sl, x);
      const done = t - r.delay >= TABLES[s][k].end;
      pos[k] = { x, y, done, r };
      this.rider(ctx, c, sl, x, y, r);
    }
    if (s === 0 || s === 1) this.oneSlide(ctx, c, pos[0], s);
    else if (s === 2) this.twoKids(ctx, c, pos);
    else if (s === 3) this.speedTags(ctx, c, pos);
    else this.friction(ctx, c, pos, t);
  }

  // -- the playground ------------------------------------------------------------

  tower(ctx, c) {
    const x0 = 100;
    const x1 = S.x;
    const top = S.y;
    const post = mix(c.s2, c.stroke, 0.35);
    for (const x of [x0, x1 - 8]) {
      ctx.fillStyle = darken(post, 0.35);
      ctx.fillRect(x - 1, top - 40, 10, GROUND - top + 40);
      ctx.fillStyle = post;
      ctx.fillRect(x, top - 40, 8, GROUND - top + 40);
      ctx.fillStyle = lighten(post, 0.35);
      ctx.fillRect(x, top - 40, 2.5, GROUND - top + 40);
    }
    // ladder rungs
    for (let y = top + 30; y < GROUND - 10; y += 30) {
      ctx.fillStyle = darken(post, 0.2);
      ctx.fillRect(x0 + 6, y, x1 - x0 - 12, 5);
      ctx.fillStyle = lighten(post, 0.3);
      ctx.fillRect(x0 + 6, y, x1 - x0 - 12, 1.5);
    }
    // deck and rail
    const deck = mix(c.gold, c.flame, 0.25);
    ctx.fillStyle = darken(deck, 0.35);
    rr(ctx, x0 - 8, top - 2, x1 - x0 + 16, 14, 4);
    ctx.fill();
    ctx.fillStyle = deck;
    rr(ctx, x0 - 8, top - 4, x1 - x0 + 16, 12, 4);
    ctx.fill();
    ctx.fillStyle = lighten(deck, 0.35);
    ctx.fillRect(x0 - 6, top - 4, x1 - x0 + 12, 3);
    ctx.strokeStyle = post;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0 + 4, top - 40);
    ctx.lineTo(x1 - 4, top - 40);
    ctx.stroke();
  }

  slide(ctx, c, name, rough) {
    const sl = SLIDES[name];
    const col = c[sl.tone];
    const path = () => {
      ctx.beginPath();
      for (let x = S.x; x <= sl.xe; x += 4) {
        const y = yOn(sl, x);
        if (x === S.x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    };
    // legs from the bed down to the ground
    const legs = [sl.xr - 20, sl.xe - 14, S.x + (sl.xr - S.x) * 0.5];
    ctx.save();
    for (const lx of legs) {
      const ly = yOn(sl, lx);
      ctx.fillStyle = darken(c.stroke, 0.2);
      ctx.fillRect(lx - 4, ly + 6, 8, GROUND - ly - 6);
      ctx.fillStyle = lighten(c.stroke, 0.25);
      ctx.fillRect(lx - 4, ly + 6, 2.5, GROUND - ly - 6);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // the side wall (shade), the bed, the lit rim
    path();
    ctx.strokeStyle = darken(col, 0.4);
    ctx.lineWidth = 22;
    ctx.stroke();
    ctx.translate(0, 2);
    path();
    ctx.strokeStyle = darken(col, 0.12);
    ctx.lineWidth = 15;
    ctx.stroke();
    ctx.translate(0, -2);
    path();
    ctx.strokeStyle = col;
    ctx.lineWidth = 8;
    ctx.translate(0, -4);
    ctx.stroke();
    path();
    ctx.strokeStyle = alpha(lighten(col, 0.6), 0.85);
    ctx.lineWidth = 2.5;
    ctx.translate(0, -3);
    ctx.stroke();
    ctx.restore();
    if (rough) {
      // rough patches along the bed: short ticks, more on the longer path
      ctx.save();
      ctx.strokeStyle = alpha(darken(col, 0.55), 0.8);
      ctx.lineWidth = 2;
      const n = Math.round((sl.xe - S.x) / 26);
      for (let i = 1; i < n; i++) {
        const x = S.x + ((sl.xe - S.x) * i) / n;
        const y = yOn(sl, x) - 6;
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 2);
        ctx.lineTo(x, y - 2);
        ctx.lineTo(x + 4, y + 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  rider(ctx, c, sl, x, y, r) {
    // tilt the seated child with the bed under it, a little less than the slope
    const dx = 6;
    const slope = Math.atan2(yOn(sl, Math.min(sl.xe, x + dx)) - yOn(sl, Math.max(S.x, x - dx)), 2 * dx);
    ctx.save();
    ctx.translate(x, y - 6);
    ctx.rotate(slope * 0.75);
    ctx.translate(-x, -(y - 6));
    const spec = figureFor(this, {
      role: r.h > 120 ? 'student' : 'child', pose: 'sit', x, y: y + 4, height: r.h, facing: 1, i: r.i,
      seat: { x, y: y - 6 },
    });
    drawFigure(ctx, c, spec, { mood: 'happy' });
    ctx.restore();
  }

  // -- stages 0 and 1: one slide, U to K, then the formula ------------------------

  oneSlide(ctx, c, p, s) {
    const U = clamp01((LIP_Y - p.y) / HPX);
    drawEnergyBars(ctx, c, {
      x: 500, y: 20, h: 136, barW: 46, gap: 26, max: 1, total: 1,
      bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'U', label: 'U', tone: 3 }],
      values: { K: 1 - U, U }, size: 26,
    });
    // h: from the ground to the top of the slide, left of the tower; its pill further left, clear of the rungs
    displacementArrow(ctx, c, 90, GROUND, 90, S.y, { label: '', side: -1 });
    pill(ctx, c, s === 1 ? '1.8 m' : 'h', s === 1 ? 44 : 41, (GROUND + S.y) / 2, { size: s === 1 ? 22 : 26, bg: c.s2 });
    if (s === 1) {
      this.formula(ctx, c, 222, 22);
      if (p.done) this.speed(ctx, c, p, '6 m/s');
    }
  }

  // Only the result's shape, small: v = sqrt(2gh). The slide text carries the working.
  formula(ctx, c, x, y) {
    ctx.save();
    ctx.font = font(c, 700, 26, true);
    const inner = '2gh';
    const iw = ctx.measureText(inner).width;
    const lw = ctx.measureText('v =').width;
    const w = 44 + lw + 10 + 30 + iw;
    const h = 58;
    drawCard(ctx, c, x, y, w, h, 1);
    const ink = c.label;
    ctx.fillStyle = ink;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const y1 = y + h / 2 + 2;
    let cx = x + 22;
    ctx.fillText('v =', cx, y1);
    cx += lw + 10;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, y1 + 2);
    ctx.lineTo(cx + 5, y1 - 2);
    ctx.lineTo(cx + 11, y1 + 13);
    ctx.lineTo(cx + 19, y1 - 18);
    ctx.lineTo(cx + 24 + iw, y1 - 18);
    ctx.stroke();
    ctx.fillText(inner, cx + 22, y1 + 1);
    ctx.restore();
  }

  // The speed at the foot: the biggest thing on the board, above and ahead of the child.
  speed(ctx, c, p, text) {
    const head = p.y - p.r.h * 0.9;
    const px = Math.min(p.x + 30, 600), py = head - 40;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + 10, head - 4);
    ctx.lineTo(px - 10, py + 20);
    ctx.stroke();
    ctx.restore();
    pill(ctx, c, text, px, py, { size: 36, bg: c.accent });
  }

  tag(ctx, c, p, text, o = {}) {
    // a speed tag above the child's head, on a short stem
    const top = p.y - p.r.h * 0.78 - (o.lift ?? 0);
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, top + 14);
    ctx.lineTo(p.x, top + 30);
    ctx.stroke();
    ctx.restore();
    pill(ctx, c, text, Math.min(p.x, 628), top, { size: o.size ?? 24, bg: o.bg ?? c.accent });
  }

  // -- stage 2: light and heavy ---------------------------------------------------

  twoKids(ctx, c, pos) {
    for (const p of pos) {
      if (p.done) this.tag(ctx, c, p, '6 m/s', { lift: p.r.tag === 'heavy' ? 4 : 0, size: 26 });
      // while both children are near the top their name chips would sit on each other:
      // the heavy one's chip comes in once the light one has slid clear
      const other = pos.find((q) => q !== p);
      const gap = other ? Math.abs(p.x - other.x) : 999;
      const fa = p.r.tag === 'heavy' && !other?.done ? clamp01((gap - 92) / 20) : 1;
      pill(ctx, c, p.r.tag, p.x, GROUND + 26, { size: 26, bg: c.stroke, alpha: fa });
    }
    displacementArrow(ctx, c, 62, GROUND, 62, S.y, { label: 'h', side: 1, size: 26, at: 0.3 });
  }

  // -- stage 3: three slides, one speed ---------------------------------------------

  speedTags(ctx, c, pos) {
    pos.forEach((p, k) => {
      if (p.done) this.tag(ctx, c, p, '6 m/s', { lift: k === 1 ? 26 : 0 });
    });
    // one platform, one height
    displacementArrow(ctx, c, 62, GROUND, 62, S.y, { label: 'h', side: 1, size: 22, at: 0.3 });
  }

  // -- stage 4: friction: a little heat, more on the longer path -------------------

  friction(ctx, c, pos, t) {
    const names = ['straight', 'curved', 'wavy'];
    const xs = [234, 370, 506];
    pos.forEach((p, k) => {
      const name = names[k];
      const a = p.done ? 1 : 0;
      const heat = HEAT[name] * a;
      drawEnergyBars(ctx, c, {
        x: xs[k], y: 14, h: 112, barW: 40, gap: 14, max: 1, total: 1,
        bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'heat', label: 'heat', tone: 8 }],
        values: { K: a ? 1 - heat : 0, heat },
        anchor: p.done ? { x: p.x, y: p.y - p.r.h * 0.7 } : undefined,
      });
      // a tone chip under each panel: which slide it is
      ctx.fillStyle = c[SLIDES[name].tone];
      rr(ctx, xs[k] + 10, 6, 40, 8, 4);
      ctx.fill();
      // heat rising off the bed while the child rubs along it
      if (!p.done && t > 0 && !reducedMotion()) {
        ctx.save();
        ctx.strokeStyle = alpha(c.s8, 0.7);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - 18, p.y - 4);
        for (let i = 1; i <= 5; i++) ctx.lineTo(p.x - 18 + Math.sin(i + t * 9) * 3, p.y - 4 - i * 4);
        ctx.stroke();
        ctx.restore();
      }
    });
    void W;
    void H;
    void drawShadow;
  }
}
