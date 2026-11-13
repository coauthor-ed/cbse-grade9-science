/**
 * NetForceBlockScene - predict blk-l10-s3 "Two forces on a block" (setup) and explain blk-l10-s4
 * "Add or subtract" (2 beats; Ex 6.1, Fig 6.6, Fig 6.7).
 *   setup  one wooden block on a table top: F 10 N right (tail on its right face) and F 6 N left
 *          (tail on its left face), to scale. No net arrow, no sum. Still.
 *   b0 'three'  three rows as in Fig 6.6: (a) 10 N and 6 N both right; (b) 10 N right, 6 N left;
 *          (c) 6 N right, 10 N left. Row by row the net force arrow grows below its block, the sum
 *          appears beside it, then the block slides a little in the net direction (x = a t^2 / 2,
 *          a in proportion to the net force, so row (a) goes farthest). Row (b) is the hero.
 *   b1 'turn'   the rows dim; a bicycle handlebar seen from above, two hands on its grips. A push
 *          forward on one end, an equal pull back on the other: the bar turns about its centre
 *          while the frame stays; net force = 0.
 * One px-per-newton scale (PXN) for every force arrow in a beat. Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, font, rr } from 'simulations/base/kit/SimLook.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawSurface } from '../shared/MotionCast.js';
import { drawSheet } from '../shared/MotionGraph.js';
import { drawForce, drawNet, drawBoxOn } from '../shared/ForceCast.js';

const SETUP = 9, PXN = 10, ROW_H = 166, ROW0 = 8, BX = 214, BW = 116, BH = 58, EQ_X = 410;
const ROWS = [
  { tag: '(a)', f: [{ n: 10, dir: 1 }, { n: 6, dir: 1 }], eq: '10 N + 6 N = 16 N' },
  { tag: '(b)', f: [{ n: 10, dir: 1 }, { n: 6, dir: -1 }], eq: '10 N - 6 N = 4 N' },
  { tag: '(c)', f: [{ n: 6, dir: 1 }, { n: 10, dir: -1 }], eq: '10 N - 6 N = 4 N' },
];
const T0 = 0.4, STEP = 1.45, GROW = 0.4, SLIDE = 0.8, KA = 7;   // slide: x = KA * net * t^2 / 2 px
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));

export class NetForceBlockScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  /** The predict mount (beat and count Number.MAX_SAFE_INTEGER) gets its own stage, SETUP. */
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: SETUP, dwellMs: null }]] };
  static ARIA_LABEL = 'Forces on a wooden block on a table. Three cases: 10 N and 6 N both to the right give a net force of 16 N to the right; 10 N to the right and 6 N to the left give 4 N to the right; 6 N to the right and 10 N to the left give 4 N to the left. Each block slides a little in the direction of its net force. Then a bicycle handlebar seen from above: equal and opposite forces on its two ends turn it about its centre, though the net force is zero.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER; }
  get key() { return this.isSetup() ? -1 : this.cur >= 1 ? 1 : 0; }
  busy() { const k = this.key; return k === -1 ? this.age < 0.9 : k === 0 ? this.age < T0 + 2 * STEP + GROW + SLIDE + 0.3 : this.age < 3.6; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const k = this.key;
    if (k === -1) return this.setupBlock(ctx, c);
    if (k === 0) return this.rows(ctx, c, this.age, 1);
    const fade = 1 - ease(this.age, 0, 0.6);
    if (fade > 0.02) this.rows(ctx, c, 99, fade);   // the rows dim away; the handlebar takes the board
    this.handlebar(ctx, c);
  }

  /** A table top (marble strip) with two wooden legs under it. */
  table(ctx, c, x0, x1, y, legTo) {
    const wood = darken(c.gold, 0.32);
    for (const lx of [x0 + 40, x1 - 64]) {
      if (legTo > y + 30) {
        ctx.fillStyle = wood; ctx.fillRect(lx, y + 26, 24, legTo - y - 26);
        ctx.fillStyle = alpha(lighten(wood, 0.3), 0.8); ctx.fillRect(lx + 3, y + 26, 6, legTo - y - 26);
        ctx.fillStyle = alpha(darken(wood, 0.3), 0.8); ctx.fillRect(lx + 17, y + 26, 7, legTo - y - 26);
        ctx.strokeStyle = darken(wood, 0.45); ctx.lineWidth = 2; ctx.strokeRect(lx, y + 26, 24, legTo - y - 26);
      }
    }
    drawSurface(ctx, c, 'marble', x0, x1, y, { h: 30 });
  }

  // -- setup: one block, 10 N right and 6 N left; nothing about the sum --------------------------------
  setupBlock(ctx, c) {
    const S = 14, y = 330, k = ease(this.age, 0.1, 0.6);
    this.table(ctx, c, 40, 640, y, 500);
    const b = drawBoxOn(ctx, c, { x: 340, y, w: 190, h: 110, kind: 'block' });
    drawForce(ctx, c, b.front.x, b.centre.y, { length: 10 * S * k, label: '10 N', fit: false, alpha: k });
    drawForce(ctx, c, b.back.x, b.centre.y, { length: 6 * S * k, angle: Math.PI, label: '6 N', side: -1, fit: false, alpha: k });
  }

  // -- b0: Fig 6.6, three rows; their net forces row by row -------------------------------------------------
  rows(ctx, c, a, dim) {
    ctx.save(); ctx.globalAlpha *= dim;
    if (dim > 0.99) drawSheet(ctx, c, { x: 8, y: ROW0 + ROW_H - 4, w: 664, h: ROW_H - 4 });
    ROWS.forEach((r, i) => {
      const R = ROW0 + i * ROW_H, top = R + 36, floor = top + BH;
      const t0 = T0 + i * STEP, kn = ease(a, t0, GROW), ts = clamp01((a - t0 - GROW) / SLIDE) * SLIDE;
      const net = r.f.reduce((s, f) => s + f.n * f.dir, 0), dx = 0.5 * KA * net * ts * ts;
      this.table(ctx, c, 70, 380, floor, floor);
      const b = drawBoxOn(ctx, c, { x: BX + dx, y: floor, w: BW, h: BH, kind: 'block' });
      ctx.save(); ctx.font = font(c, 800, 28, true); ctx.fillStyle = c.label; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(r.tag, 18, floor + 50); ctx.restore();
      // Forces: tails on the face they leave from; two forces the same way stack on that face.
      const same = r.f[0].dir === r.f[1].dir;
      r.f.forEach((f, j) => {
        const x = f.dir > 0 ? b.front.x : b.back.x, y = same ? top + 14 + j * 30 : b.centre.y;
        drawForce(ctx, c, x, y, { newtons: f.n, scale: PXN, angle: f.dir > 0 ? 0 : Math.PI, label: f.n + ' N', side: same && j === 1 ? -1 : f.dir > 0 ? 1 : -1, fit: false });
      });
      if (kn > 0) {
        const ny = floor + 50;
        drawNet(ctx, c, BX + dx, ny, r.f.map((f) => ({ newtons: f.n * kn, dir: f.dir })), { scale: PXN, label: '', alpha: kn, fit: false });
        ctx.save(); ctx.globalAlpha *= kn; ctx.font = font(c, 800, 28, true); ctx.fillStyle = c.s3ink ?? darken(c.s3, 0.3);
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = font(c, 800, 26, true); ctx.fillText(r.eq, EQ_X, ny + 1); ctx.restore();
      }
    });
    ctx.restore();
  }

  // -- b1: a handlebar from above; equal and opposite forces on its ends make it turn ----------------------
  handlebar(ctx, c) {
    const a = this.age, cx = 352, cy = 300, kf = ease(a, 0.7, 0.4), th = 0.42 * ease(a, 1.0, 1.4), kc = ease(a, 2.2, 0.4), kn = ease(a, 2.7, 0.4);
    const steel = mix2(c), dark = darken(c.stroke, 0.55);
    // The frame (top tube) stays put.
    tube(ctx, cx, cy + 20, cx, 520, 24, c.s1);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(th);
    // Front tyre and fork, seen from above (ahead of the bar).
    rr(ctx, -15, -236, 30, 196, 15); ctx.fillStyle = dark; ctx.fill();
    ctx.fillStyle = alpha(lighten(dark, 0.35), 0.8); ctx.fillRect(-9, -226, 5, 176);
    ctx.fillStyle = alpha(lighten(dark, 0.22), 0.9); for (let ty = -224; ty < -50; ty += 18) ctx.fillRect(-12, ty, 24, 5);
    rr(ctx, -15, -236, 30, 196, 15); ctx.strokeStyle = darken(dark, 0.4); ctx.lineWidth = 2; ctx.stroke();
    tube(ctx, 0, -40, 0, 0, 20, c.s1);
    // The bar, its grips and the stem.
    tube(ctx, -178, 8, 178, 8, 16, steel, true);
    for (const s of [-1, 1]) tube(ctx, s * 118, 8, s * 180, 8, 26, darken(c.stroke, 0.35));
    ctx.beginPath(); ctx.arc(0, 4, 20, 0, Math.PI * 2); ctx.fillStyle = steel; ctx.fill(); ctx.strokeStyle = darken(steel, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(-5, -1, 8, 0, Math.PI * 2); ctx.fillStyle = alpha(lighten(steel, 0.5), 0.8); ctx.fill();
    // Two hands on the grips, arms coming from the rider (below).
    const look = figureLook(c, { skin: 1, top: 's5' });
    for (const s of [-1, 1]) fist(ctx, s * 148, 8, look.skin, look.top);
    ctx.restore();
    // Forces: tails on the bar ends, at right angles to the bar; equal lengths.
    const end = (s) => ({ x: cx + Math.cos(th) * s * 182 - Math.sin(th) * 8, y: cy + Math.sin(th) * s * 182 + Math.cos(th) * 8 });
    const L = 112 * kf, A = end(-1), B = end(1);
    if (kf > 0) {
      drawForce(ctx, c, A.x, A.y, { length: L, angle: th - Math.PI / 2, label: 'push', side: -1, alpha: kf, fit: false });
      drawForce(ctx, c, B.x, B.y, { length: L, angle: th + Math.PI / 2, label: 'pull', side: -1, alpha: kf, fit: false });
    }
    if (kc > 0) turnArc(ctx, c, cx, cy, 236, 1.85, 1.85 + 0.75 * kc, kc);
    if (kn > 0) drawNet(ctx, c, 40, 488, [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }], { alpha: kn, side: -1, label: '' }), netLabel(ctx, c, 'net force = 0', 62, 488, kn);
  }
}

// ---- small drawing helpers (scene-local: the kit has no top-view hand, bar or turn arc) ----------------
function mix2(c) { return lighten(c.stroke, 0.35); }

/** A round tube with a lit side and a rim, from (x0, y0) to (x1, y1). */
function tube(ctx, x0, y0, x1, y1, w, col, shine) {
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = w + 4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  const nx = -(y1 - y0), ny = x1 - x0, n = Math.hypot(nx, ny) || 1, o = w * 0.22;
  ctx.strokeStyle = alpha(darken(col, 0.25), 0.8); ctx.lineWidth = w * 0.3;
  ctx.beginPath(); ctx.moveTo(x0 - nx / n * o, y0 - ny / n * o); ctx.lineTo(x1 - nx / n * o, y1 - ny / n * o); ctx.stroke();
  ctx.strokeStyle = alpha(lighten(col, 0.55), shine ? 0.9 : 0.6); ctx.lineWidth = w * 0.18;
  ctx.beginPath(); ctx.moveTo(x0 + nx / n * o, y0 + ny / n * o); ctx.lineTo(x1 + nx / n * o, y1 + ny / n * o); ctx.stroke();
  ctx.restore();
}

/** A hand closed round a grip, seen from above: knuckles forward (up), wrist and sleeve toward the rider. */
function fist(ctx, x, y, skin, sleeve) {
  ctx.save(); ctx.translate(x, y);
  rr(ctx, -20, 22, 40, 78, 16); ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = darken(skin, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = alpha(darken(skin, 0.18), 0.7); ctx.fillRect(8, 26, 10, 70);
  rr(ctx, -25, 62, 50, 44, 10); ctx.fillStyle = sleeve; ctx.fill(); ctx.strokeStyle = darken(sleeve, 0.35); ctx.stroke();
  ctx.fillStyle = alpha(lighten(sleeve, 0.35), 0.7); ctx.fillRect(-20, 66, 8, 36);
  rr(ctx, -28, -24, 56, 52, 18); ctx.fillStyle = skin; ctx.fill();
  ctx.fillStyle = alpha(lighten(skin, 0.35), 0.75); rr(ctx, -22, -19, 18, 40, 8); ctx.fill();
  ctx.fillStyle = alpha(darken(skin, 0.2), 0.7); rr(ctx, 10, -19, 14, 42, 7); ctx.fill();
  rr(ctx, -28, -24, 56, 52, 18); ctx.strokeStyle = darken(skin, 0.32); ctx.lineWidth = 2.5; ctx.stroke();
  ctx.strokeStyle = alpha(darken(skin, 0.35), 0.8); ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) { const kx = -28 + i * 14; ctx.beginPath(); ctx.moveTo(kx, -22); ctx.lineTo(kx, -8); ctx.stroke(); }
  ctx.restore();
}

/** A thin curved annotation arrow round (cx, cy): the bar turns. Labelled "turns". */
function turnArc(ctx, c, cx, cy, r, a0, a1, k) {
  ctx.save(); ctx.globalAlpha *= k; ctx.strokeStyle = c.annot; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
  const hx = cx + r * Math.cos(a1), hy = cy + r * Math.sin(a1), tx = -Math.sin(a1), ty = Math.cos(a1);
  ctx.fillStyle = c.annot; ctx.beginPath();
  ctx.moveTo(hx + tx * 16, hy + ty * 16); ctx.lineTo(hx - tx * 4 + Math.cos(a1) * 11, hy - ty * 4 + Math.sin(a1) * 11); ctx.lineTo(hx - tx * 4 - Math.cos(a1) * 11, hy - ty * 4 - Math.sin(a1) * 11);
  ctx.closePath(); ctx.fill();
  ctx.font = font(c, 800, 28, true); ctx.fillStyle = darken(c.annot, 0.15); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('turns', cx + r * Math.cos(2.6) - 16, cy + r * Math.sin(2.6) + 14);
  ctx.restore();
}

function netLabel(ctx, c, text, x, y, k) {
  ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 800, 28, true); ctx.fillStyle = c.s3ink ?? darken(c.s3, 0.3);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1); ctx.restore();
}
