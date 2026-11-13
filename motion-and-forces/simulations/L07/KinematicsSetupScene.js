/**
 * KinematicsSetupScene - slide blk-l07-s1 "Five quantities" (2 beats). Also the base of the other
 * L07 derivation scenes (DeriveVScene, AreaDeriveScene, VSquaredScene), which subclass it for the
 * shared parts: the five chips u, v, a, t, s in fixed tones, the symbolic velocity-time graph
 * (Fig 4.19: u and v on the velocity axis, t on the time axis, no numbers) and the algebra writer
 * (symbols in their chip tones, stacked fractions, write-on, the boxed hero).
 *   b0  one car on the highway speeds up once, start mark to end mark (x = u t + a t^2 / 2, v = 3 u,
 *       compressed), the stopwatch runs with it; then the chips attach one by one: u on a short
 *       velocity arrow at the start mark, v on a three times longer one at the end mark, a on the
 *       car (acceleration arrow along v), t on the stopwatch, s on the dashed displacement arrow
 *       from the start mark to the end mark. Rest: car at the end mark, five chips.
 *   b1  the road dims; three empty equation cards (1, 2, 3, a dashed slot inside) rise; the five
 *       chips hop off the picture and hover in a row above them. No equation text yet.
 * Chip tones: v and a the kit arrow tones (series 1, 2), s the displacement tone (series 4),
 * u series 5, t series 6.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01, lerp, outBack, inOutSine, rr, darken, lighten, inkOn, alpha } from 'simulations/base/kit/SimLook.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { trackSpec, drawTrack, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { graphFrame, drawGraphPaper, drawAxes, drawThrough, drawSheet } from '../shared/MotionGraph.js';

const TONE = { u: 's5', v: 's1', a: 's2', t: 's6', s: 's4' };
const ORDER = ['u', 'v', 'a', 't', 's'];
// The symbolic graph's own data (never printed): u at t = 0, v at time t.
const GU = 3, GV = 9, GT = 8;
// Beat 0 road: the car's nose runs from XS to XE with v = 3 u.
const XS = 196, XE = 470, RUN = 2.6, LEAD = 0.25, CAR = 150, CAR_M = 4.2, ROAD_Y = 368;
const U_PX = (XE - XS) / (2 * RUN), A_PX = (2 * U_PX) / RUN;
const CHIP_AT = 3.1, CHIP_GAP = 0.45;
const CARDS = [22, 242, 462].map((x, i) => ({ x, y: 196, w: 196, h: 172, n: String(i + 1) }));

export class KinematicsSetupScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A car on a highway speeds up steadily from a start mark to an end mark. Five labels attach to the picture: u on a short velocity arrow at the start mark, v on a longer velocity arrow at the end mark, a on an acceleration arrow pointing forward over the car, t on a stopwatch that timed the trip, and s on a dashed displacement arrow from the start mark to the end mark. Then the road fades, three empty equation cards numbered 1, 2 and 3 rise, and the five labels hop up and wait above them.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.gf = graphFrame({ x: 6, y: 12, w: 360, h: 500 }, {
      x: { max: 10, step: 10, minor: 20, title: 'time', fmt: () => '' },
      y: { max: 12, step: 12, minor: 24, title: 'velocity', fmt: () => '' },
    });
  }

  enter(stage) { this.cur = stage; }
  /** The beat to draw; a host setup or an out-of-range stage lands on beat 0. */
  get key() {
    const n = this.beatCount || this.constructor.BEAT_STEP_MAP.length;
    if (this.hostRole === 'setup' || !(this.cur >= 0) || this.cur > 99) return 0;
    return Math.min(n - 1, Math.floor(this.cur));
  }
  busy() { return this.age < (this.key === 0 ? CHIP_AT + 5 * CHIP_GAP + 0.6 : 2.4); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const a = this.age;
    if (this.key === 0) { this.road(ctx, c, a, 1); return; }
    // b1: the picture at rest, dimmed; cards rise; chips hop up into a row.
    this.road(ctx, c, 99, 1 - 0.82 * clamp01(a / 0.5), true);
    CARDS.forEach((C, i) => this.card(ctx, c, C, clamp01((a - 0.3 - i * 0.15) / 0.5)));
    ORDER.forEach((ch, i) => {
      const from = this.chipHome(ch), to = [140 + i * 100, 110];
      const k = inOutSine(clamp01((a - 1.0 - i * 0.15) / 0.6));
      const x = lerp(from[0], to[0], k), y = lerp(from[1], to[1], k) - Math.sin(Math.PI * k) * 70;
      this.chip(ctx, c, ch, x, y, { r: 30 + 4 * k });
    });
  }

  // -- b0: the highway ---------------------------------------------------------------------------

  /** Where each chip sits on the b0 picture at rest. */
  chipHome(ch) {
    const roof = ROAD_Y - 0.52 * CAR;
    return {
      u: [XS + 30, ROAD_Y - 92], v: [XE + 88, ROAD_Y - 92], a: [XE - CAR / 2 + 36, roof - 56],
      t: [428, 104], s: [(XS + XE) / 2, 478],
    }[ch];
  }

  /** The road, the marks, the car, the stopwatch and, once the trip is over, the arrows. */
  road(ctx, c, a, al, noChips = false) {
    const tau = clamp01((a - LEAD) / RUN) * RUN, d = U_PX * tau + 0.5 * A_PX * tau * tau, nose = XS + d;
    ctx.save();
    ctx.globalAlpha = al;
    const spec = trackSpec({ from: 0, to: 100, x0: 16, x1: 664, y: ROAD_Y });
    const tr = drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 44, scroll: 0 });
    [XS, XE].forEach((x) => {                       // painted stop lines across the road
      ctx.fillStyle = c.label; ctx.globalAlpha = al * 0.85;
      ctx.fillRect(x - 3, tr.top ?? ROAD_Y, 6, (tr.bottom ?? ROAD_Y + 44) - (tr.top ?? ROAD_Y));
    });
    ctx.globalAlpha = al;
    const body = drawCar(ctx, c, { x: nose - CAR / 2, y: ROAD_Y, length: CAR, roll: d / (CAR / CAR_M), tone: 3 });
    const roof = body.box ? body.box.y0 : ROAD_Y - 0.52 * CAR;
    // The stopwatch runs with the trip (the dial has no numbers; its chip is t).
    const sw = noChips ? 0 : 1;
    if (sw > 0) drawStopwatch(ctx, c, { x: 330, y: 104, r: 58, seconds: (tau / RUN) * 40, readout: false });
    ctx.restore();
    if (noChips) {                                    // b1: arrows only, dim, chips have left
      this.arrows(ctx, c, roof, al, null);
      return;
    }
    this.arrows(ctx, c, roof, 1, a);
  }

  /** The five chips attach in order; each arrow draws on with its chip. at null: all, no chips. */
  arrows(ctx, c, roof, al, a) {
    const k = (i) => (a == null ? 1 : clamp01((a - CHIP_AT - i * CHIP_GAP) / 0.4));
    const yv = ROAD_Y - 48, ya = roof - 16, ys = 446;
    const draws = [
      () => drawMotionArrow(ctx, c, 'v', XS, yv, { length: 57 * k(0), alpha: al * Math.min(1, 3 * k(0)) }),
      () => drawMotionArrow(ctx, c, 'v', XE, yv, { length: 171 * k(1), alpha: al * Math.min(1, 3 * k(1)) }),
      () => drawMotionArrow(ctx, c, 'a', XE - CAR / 2, ya, { length: 70 * k(2), alpha: al * Math.min(1, 3 * k(2)) }),
      () => {},
      () => drawMotionArrow(ctx, c, 's', XS, ys, { length: (XE - XS) * k(4), alpha: al * Math.min(1, 3 * k(4)) }),
    ];
    ORDER.forEach((ch, i) => {
      if (k(i) <= 0) return;
      draws[i]();
      if (a != null) { const [x, y] = this.chipHome(ch); this.chip(ctx, c, ch, x, y, { scale: outBack(k(i)) }); }
    });
  }

  /** An empty equation card: raised sheet, number badge, dashed slot. */
  card(ctx, c, C, k) {
    if (k <= 0) return;
    const y = C.y + (1 - outBack(k)) * 60;
    ctx.save();
    drawSheet(ctx, c, { x: C.x, y, w: C.w, h: C.h }, { alpha: Math.min(1, k * 1.5) });
    ctx.globalAlpha = Math.min(1, k * 1.5);
    this.badge(ctx, c, C.n, C.x + 30, y + 30);
    ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = c.labelMuted;
    rr(ctx, C.x + 22, y + 66, C.w - 44, C.h - 92, 12); ctx.stroke();
    ctx.restore();
  }

  // -- Shared parts (used by the subclasses) --------------------------------------------------

  /** A symbol's chip tone. */
  symCol(c, ch) { return c[TONE[ch]]; }

  /** A round chip: shade lip, body, light side, inner line, darker rim, the letter. */
  chip(ctx, c, ch, x, y, o = {}) {
    const s = o.scale ?? 1, r = o.r ?? 30, col = o.col ?? this.symCol(c, ch);
    if (s <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.translate(x, y); ctx.scale(s, s);
    if (o.ghost) {
      ctx.setLineDash([6, 6]); ctx.lineWidth = 3; ctx.strokeStyle = col;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    } else {
      ctx.fillStyle = darken(col, 0.35); ctx.beginPath(); ctx.arc(0, 3, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = alpha(lighten(col, 0.4), 0.55); ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.75, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = alpha(lighten(col, 0.5), 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r - 5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = o.ghost ? col : inkOn(c, col); ctx.font = font(c, 900, Math.round(r * 1.2), true);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.text ?? ch, 0, o.text ? 2 : -2);
    if (o.strike > 0) {
      ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
      const e = r * 0.95 * o.strike;
      ctx.beginPath(); ctx.moveTo(-r * 0.95, r * 0.95); ctx.lineTo(-r * 0.95 + 2 * e, r * 0.95 - 2 * e); ctx.stroke();
    }
    ctx.restore();
  }

  /** A card number badge. */
  badge(ctx, c, n, x, y) { this.chip(ctx, c, '', x, y, { r: 20, col: c.stroke, text: n }); }

  /** The symbolic graph of Fig 4.19: paper, axes, u and v on the velocity axis, t on the time axis. */
  symGraph(ctx, c, o = {}) {
    const f = this.gf, al = o.alpha ?? 1;
    drawGraphPaper(ctx, c, f, { alpha: al });
    drawAxes(ctx, c, f, 99, { alpha: al });
    ctx.save();
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.textBaseline = 'middle';
    const lit = o.lit ?? {};
    [['u', GU], ['v', GV]].forEach(([ch, val]) => {
      const y = f.py(val);
      ctx.globalAlpha = al; ctx.strokeStyle = c.label;
      ctx.beginPath(); ctx.moveTo(f.plot.x - 8, y); ctx.lineTo(f.plot.x, y); ctx.stroke();
      ctx.globalAlpha = Math.max(al, lit[ch] ?? 0);
      ctx.font = font(c, 900, 32 + 6 * (lit[ch] ?? 0), true); ctx.fillStyle = this.symCol(c, ch); ctx.textAlign = 'right';
      ctx.fillText(ch, f.plot.x - 14, y);
    });
    const x = f.px(GT);
    ctx.globalAlpha = al; ctx.strokeStyle = c.label;
    ctx.beginPath(); ctx.moveTo(x, f.base); ctx.lineTo(x, f.base + 8); ctx.stroke();
    ctx.globalAlpha = Math.max(al, lit.t ?? 0);
    ctx.font = font(c, 900, 32 + 6 * (lit.t ?? 0), true); ctx.fillStyle = this.symCol(c, 't'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('t', x, f.base + 8);
    // Book guides: E to B at v, B down to D at t (dashed).
    const g = o.guides ?? 1;
    if (g > 0) {
      const [ex, ey] = f.at([0, GV]), [bx, by] = f.at([GT, GV]);
      ctx.globalAlpha = al * g * 0.8; ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 2.5; ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(bx, by); ctx.moveTo(bx, by); ctx.lineTo(bx, f.base); ctx.stroke();
    }
    ctx.restore();
    if (o.line !== false) drawThrough(ctx, c, f, [[0, GU], [GT, GV]], o.lineK ?? 1, { width: 6, alpha: o.lineAlpha ?? al });
  }

  /** The graph's data points A (0, u), B (t, v), C (t, u), D (t, 0), O. */
  gpt(name) { return { A: [0, GU], B: [GT, GV], C: [GT, GU], D: [GT, 0], E: [0, GV], O: [0, 0] }[name]; }

  /** Width of a string drawn char by char (matches runText). */
  textW(ctx, s) { let w = 0; for (const ch of s) w += ctx.measureText(ch).width; return w; }

  /** Lay out a line of algebra: strings, or { f: [top, bottom], paren, sup }, or { s, glow, strike, col }; any item may set hide (keeps its room). */
  eqLayout(ctx, c, items, size) {
    const fs = Math.max(26, Math.round(size * 0.8));
    const parts = [];
    let w = 0, up = size * 0.62, dn = size * 0.62;
    for (const it of items) {
      const o = typeof it === 'string' ? { s: it } : it;
      let p;
      if (o.f) {
        ctx.font = font(c, 800, fs, true);
        const fw = Math.max(this.textW(ctx, o.f[0]), this.textW(ctx, o.f[1])) + 12;
        const hh = fs * 1.32, pw = o.paren ? fs * 0.42 : 0;
        ctx.font = font(c, 800, size, true);
        const sw = o.sup ? ctx.measureText(o.sup).width + 2 : 0;
        p = { o, kind: 'f', w: fw + 2 * pw + sw + 8, fw, pw, sw, hh, fs };
        up = Math.max(up, hh + 4); dn = Math.max(dn, hh + 4);
      } else {
        ctx.font = font(c, 800, size, true);
        p = { o, kind: 's', w: this.textW(ctx, o.s) };
      }
      parts.push(p); w += p.w;
    }
    return { parts, w, up, dn };
  }

  /** One run of text, symbols in their chip tones. */
  runText(ctx, c, s, x, y, size, o = {}) {
    ctx.font = font(c, 800, size, true);
    const x0 = x;
    for (const ch of s) {
      ctx.fillStyle = o.col ?? (TONE[ch] ? (c[TONE[ch] + 'ink'] ?? this.symCol(c, ch)) : c.label);   // text uses the series ink token (contrast)
      ctx.fillText(ch, x, y); x += ctx.measureText(ch).width;
    }
    return x - x0;
  }

  /**
   * Draw a line of algebra at (x, y) (y = the fraction bar line). o: { align 'left'|'center',
   * alpha, k (write-on 0..1) }. Returns { x0, x1, y0, y1, boxes: [{ x, w }] per item }.
   */
  eq(ctx, c, items, x, y, size, o = {}) {
    const L = this.eqLayout(ctx, c, items, size);
    const x0 = o.align === 'left' ? x : x - L.w / 2, k = o.k ?? 1;
    const res = { x0, x1: x0 + L.w, y0: y - L.up, y1: y + L.dn, boxes: [] };
    let cx = x0;
    L.parts.forEach((p) => { res.boxes.push({ x: cx, w: p.w, h: p.kind === 'f' ? p.hh : size * 0.62 }); cx += p.w; });
    if (k <= 0) return res;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    if (k < 1) { ctx.beginPath(); ctx.rect(x0 - 10, y - L.up - 10, (L.w + 20) * k, L.up + L.dn + 20); ctx.clip(); }
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    L.parts.forEach((p, i) => {
      const po = p.o, bx = res.boxes[i].x, hh = res.boxes[i].h;
      if (po.hide) return;
      if (po.glow > 0) {
        ctx.save(); ctx.globalAlpha *= po.glow;
        ctx.fillStyle = alpha(this.symCol(c, po.glowSym ?? 't'), 0.12);
        rr(ctx, bx - 1, y - hh - 4, p.w + 2, 2 * hh + 8, 10); ctx.fill();
        ctx.strokeStyle = this.symCol(c, po.glowSym ?? 't'); ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      if (p.kind === 's') {
        const w = this.runText(ctx, c, po.s, bx, y, size, po);
        if (po.strike > 0) {
          ctx.strokeStyle = this.symCol(c, 't'); ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(bx - 2, y + size * 0.3); ctx.lineTo(bx - 2 + (w + 4) * po.strike, y - size * 0.3); ctx.stroke();
        }
        return;
      }
      const fx = bx + 4 + p.pw, mid = fx + p.fw / 2;
      ctx.font = font(c, 800, p.fs, true);
      this.runText(ctx, c, po.f[0], mid - this.textW(ctx, po.f[0]) / 2, y - p.fs * 0.66, p.fs, po);
      ctx.font = font(c, 800, p.fs, true);
      this.runText(ctx, c, po.f[1], mid - this.textW(ctx, po.f[1]) / 2, y + p.fs * 0.7, p.fs, po);
      ctx.strokeStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx + p.fw, y); ctx.stroke();
      if (po.paren) {
        const l = bx + 4, r = fx + p.fw;
        ctx.beginPath();
        ctx.moveTo(l + p.pw * 0.9, y - p.hh); ctx.quadraticCurveTo(l - p.pw * 0.2, y, l + p.pw * 0.9, y + p.hh);
        ctx.moveTo(r + p.pw * 0.1, y - p.hh); ctx.quadraticCurveTo(r + p.pw * 1.2, y, r + p.pw * 0.1, y + p.hh);
        ctx.stroke();
      }
      if (po.sup) this.runText(ctx, c, po.sup, fx + p.fw + p.pw + 2, y - p.hh + size * 0.32, size, po);
    });
    ctx.restore();
    return res;
  }

  /** The boxed hero around an eq() result. */
  heroBox(ctx, c, r, k) {
    if (k <= 0) return;
    ctx.save();
    ctx.globalAlpha = k;
    rr(ctx, r.x0 - 18, r.y0 - 10, r.x1 - r.x0 + 36, r.y1 - r.y0 + 20, 14);
    ctx.fillStyle = alpha(c.annot, 0.1); ctx.fill();
    ctx.strokeStyle = c.annot; ctx.lineWidth = 4; ctx.stroke();
    rr(ctx, r.x0 - 12, r.y0 - 4, r.x1 - r.x0 + 24, r.y1 - r.y0 + 8, 10);
    ctx.strokeStyle = alpha(c.annot, 0.35); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  /** A titled algebra card (badge n) on the right of the graph. */
  algebraCard(ctx, c, P, n, k = 1) {
    if (k <= 0) return;
    drawSheet(ctx, c, P, { alpha: k });
    ctx.save(); ctx.globalAlpha = k; this.badge(ctx, c, n, P.x + 30, P.y + 30); ctx.restore();
  }
}

