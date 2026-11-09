import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, inOutSine, clamp01, mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';

// LeverClassesScene - blk-l08-s10, Three Classes of Lever (book Table 7.2).
// b0: the book's three schematics (a bar, a triangle fulcrum, a load arrow and an
//     effort arrow) and one real example drawn under each, its parts in the same
//     left-to-right order: scissors (L F E), a lemon squeezer (F L E, the book's own
//     picture), tweezers (F E L). In turn each middle part's ring grows and a dashed drop
//     ties it to the same part on the example: the class is the part in the middle.
// b1: two tongs. Crossed at a pivot (L F E, class I) and joined at one end
//     (F E L, class III). Both close on what they hold; the middle parts' rings grow.
// Effort arrows follow the book (owner decision): every schematic effort arrow points
// down, as Table 7.2 draws it (FIGURES.md flags II and III as physically up), and on
// each tool the arrows show the hand's push: squeeze the loops, press the squeezer's
// handle down, pinch the tweezers.

const ROLE = { f: 's6', l: 's5', e: 's1' };
const LETTER = { f: 'F', l: 'L', e: 'E' };
const ORDERS = [['l', 'f', 'e'], ['f', 'l', 'e'], ['f', 'e', 'l']];
const NAMES = ['Class I', 'Class II', 'Class III'];
const COLS = [128, 340, 552];
const SCH_Y = 120, SCH_LEN = 150;
const GROUND = 452;
const STEP_S = 0.6, GLOW_S = 0.5;
const SQUEEZE_S = 0.7;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

const col = (c, k) => c[ROLE[k]];
function metal(c) { return mix(c.bgSurface, c.label, 0.6); }

function arrow(ctx, color, x1, y1, x2, y2, w = 5) {
  const a = Math.atan2(y2 - y1, x2 - x1), head = 13;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(a) * head * 0.7, y2 - Math.sin(a) * head * 0.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - 0.5), y2 - head * Math.sin(a - 0.5));
  ctx.lineTo(x2 - head * Math.cos(a + 0.5), y2 - head * Math.sin(a + 0.5));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function ring(ctx, color, x, y, r, k = 1) {
  ctx.save();
  ctx.globalAlpha *= k;
  ctx.strokeStyle = darken(color, 0.2);
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// A wooden bar with a light top, a shade foot and a rim.
function plank(ctx, c, x0, x1, y, h) {
  const wood = mix(c.gold, c.bgSurface, 0.15);
  ctx.save();
  rr(ctx, x0, y, x1 - x0, h, 4);
  ctx.fillStyle = wood; ctx.fill();
  ctx.fillStyle = lighten(wood, 0.3);
  ctx.fillRect(x0 + 3, y + 2, x1 - x0 - 6, 3);
  ctx.fillStyle = darken(wood, 0.25);
  ctx.fillRect(x0 + 2, y + h - 4, x1 - x0 - 4, 3);
  ctx.strokeStyle = darken(wood, 0.45); ctx.lineWidth = 2;
  rr(ctx, x0, y, x1 - x0, h, 4); ctx.stroke();
  ctx.restore();
}

function wedge(ctx, c, x, yTop, s = 1) {
  const fc = c.s6, w = 20 * s, h = 32 * s;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, yTop); ctx.lineTo(x - w, yTop + h); ctx.lineTo(x + w, yTop + h); ctx.closePath();
  ctx.fillStyle = fc; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, yTop); ctx.lineTo(x + w, yTop + h); ctx.lineTo(x + w * 0.35, yTop + h); ctx.closePath();
  ctx.fillStyle = darken(fc, 0.22); ctx.fill();
  ctx.strokeStyle = lighten(fc, 0.35); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 2, yTop + 5); ctx.lineTo(x - w + 6, yTop + h - 3); ctx.stroke();
  ctx.strokeStyle = darken(fc, 0.45); ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, yTop); ctx.lineTo(x - w, yTop + h); ctx.lineTo(x + w, yTop + h); ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// The book's schematic: returns the x of each part.
function schematic(ctx, c, cx, y, order, len, midK, size = 22) {
  const xs = {};
  order.forEach((k, i) => { xs[k] = cx + (i - 1) * len / 2; });
  const mid = order[1];
  plank(ctx, c, cx - len / 2 - 12, cx + len / 2 + 12, y - 5, 11);
  wedge(ctx, c, xs.f, y + 6);
  // load: pushes down on the bar
  arrow(ctx, col(c, 'l'), xs.l, y - 50, xs.l, y - 7);
  // effort: down in all three, as the book's table draws it
  arrow(ctx, col(c, 'e'), xs.e, y - 50, xs.e, y - 7);
  const big = (k) => (k === mid ? 1 + 0.18 * midK : 1);
  // tags to the right of their arrows (never on a tail); F under its triangle
  pill(ctx, c, 'L', xs.l + 24, y - 34, { bg: col(c, 'l'), size: size * big('l') });
  pill(ctx, c, 'F', xs.f, y + 62, { bg: col(c, 'f'), size: size * big('f') });
  pill(ctx, c, 'E', xs.e + 24, y - 34, { bg: col(c, 'e'), size: size * big('e') });
  return xs;
}

function dropLine(ctx, color, x1, y1, x2, y2, k) {
  if (k <= 0) return;
  ctx.save();
  ctx.strokeStyle = alpha(color, 0.9);
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k);
  ctx.stroke();
  ctx.restore();
}

// A tapered steel strip from p to q, widths w0 -> w1, light top edge, shade foot.
function strip(ctx, c, p, q, w0, w1, tone) {
  const a = Math.atan2(q.y - p.y, q.x - p.x), nx = -Math.sin(a), ny = Math.cos(a);
  const steel = tone ?? metal(c);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p.x + nx * w0 / 2, p.y + ny * w0 / 2);
  ctx.lineTo(q.x + nx * w1 / 2, q.y + ny * w1 / 2);
  ctx.lineTo(q.x - nx * w1 / 2, q.y - ny * w1 / 2);
  ctx.lineTo(p.x - nx * w0 / 2, p.y - ny * w0 / 2);
  ctx.closePath();
  ctx.fillStyle = steel; ctx.fill();
  ctx.strokeStyle = darken(steel, 0.45); ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p.x - nx * w0 * 0.25, p.y - ny * w0 * 0.25);
  ctx.lineTo(q.x - nx * w1 * 0.2, q.y - ny * w1 * 0.2);
  ctx.strokeStyle = alpha(lighten(steel, 0.6), 0.8); ctx.lineWidth = Math.max(1.5, w1 * 0.25); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p.x + nx * w0 * 0.32, p.y + ny * w0 * 0.32);
  ctx.lineTo(q.x + nx * w1 * 0.3, q.y + ny * w1 * 0.3);
  ctx.strokeStyle = alpha(darken(steel, 0.3), 0.8); ctx.lineWidth = Math.max(1.5, w1 * 0.22); ctx.stroke();
  ctx.restore();
}

function pivotPin(ctx, c, x, y, r = 8) {
  const steel = metal(c);
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = darken(steel, 0.15); ctx.fill();
  ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + r * 0.3); ctx.lineTo(x + r * 0.6, y - r * 0.3); ctx.stroke();
  ctx.restore();
}

const at = (o, ang, d) => ({ x: o.x + Math.cos(ang) * d, y: o.y + Math.sin(ang) * d });

// Scissors, blades to the left: card (L) between the blades, screw (F), loops (E).
function scissors(ctx, c, cx, cy, half) {
  const o = { x: cx, y: cy };
  const plastic = c.s4;
  const cardX = cx - 62;
  // a sheet of card, its cut running in from the left edge to where the blades meet it
  const paper = mix(c.bgSurface, c.gold, 0.18);
  ctx.save();
  rr(ctx, cardX - 38, cy - 40, 44, 80, 3);
  ctx.fillStyle = paper; ctx.fill();
  ctx.fillStyle = darken(paper, 0.08); ctx.fillRect(cardX - 38, cy + 18, 44, 22);
  ctx.strokeStyle = darken(paper, 0.4); ctx.lineWidth = 2; rr(ctx, cardX - 38, cy - 40, 44, 80, 3); ctx.stroke();
  ctx.strokeStyle = darken(paper, 0.55); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cardX - 38, cy); ctx.lineTo(cardX - 4, cy); ctx.stroke();
  ctx.restore();
  const loops = [];
  for (const s of [-1, 1]) {
    const bladeAng = Math.PI + s * half;
    const handAng = -s * half * 2.2;
    const tip = at(o, bladeAng, 98);
    strip(ctx, c, at(o, bladeAng, -6), tip, 18, 4);
    // shank to the loop
    const lc = at(o, handAng, 64);
    loops.push(lc);
    strip(ctx, c, at(o, handAng, 2), at(o, handAng, 44), 14, 11, darken(plastic, 0.05));
    ctx.save();
    ctx.beginPath(); ctx.ellipse(lc.x, lc.y, 23, 16, handAng, 0, Math.PI * 2);
    ctx.strokeStyle = darken(plastic, 0.4); ctx.lineWidth = 13; ctx.stroke();
    ctx.strokeStyle = plastic; ctx.lineWidth = 9; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(lc.x, lc.y, 23, 16, handAng, Math.PI * 1.05, Math.PI * 1.6);
    ctx.strokeStyle = lighten(plastic, 0.4); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  pivotPin(ctx, c, cx, cy, 9);
  return { l: { x: cardX, y: cy }, f: { x: cx, y: cy }, e: { x: cx + 60, y: cy }, loops };
}

// A lemon squeezer side on (the book's class II picture): hinge (F) on the left, the
// lemon half in the cup (L) in the middle, the handles (E) on the right; the hand presses
// the top handle down.
function squeezer(ctx, c, cx, cy, k) {
  const steel = metal(c);
  const grip = c.s3;
  const h = { x: cx - 96, y: cy };
  const close = 8 * k;
  const lo = { x: cx + 100, y: cy + 22 }, up = { x: cx + 100, y: cy - 62 + close };
  const yOn = (q, x) => h.y + (q.y - h.y) * (x - h.x) / (q.x - h.x);
  const cup = { x: cx - 16, y: yOn(lo, cx - 16) };
  // lower arm, and the perforated cup hanging under it
  strip(ctx, c, h, lo, 12, 10);
  ctx.save();
  ctx.beginPath(); ctx.arc(cup.x, cup.y + 2, 32, 0, Math.PI); ctx.closePath();
  ctx.fillStyle = darken(steel, 0.05); ctx.fill();
  ctx.fillStyle = darken(steel, 0.22);
  ctx.beginPath(); ctx.arc(cup.x, cup.y + 2, 32, 0.1, Math.PI * 0.55); ctx.lineTo(cup.x, cup.y + 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = darken(steel, 0.45);
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(cup.x + i * 10, cup.y + 18 - Math.abs(i) * 3, 2.2, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cup.x, cup.y + 2, 32, 0, Math.PI); ctx.closePath(); ctx.stroke();
  ctx.restore();
  // the lemon half, cut face down in the cup, its rind dome up under the presser
  const lemon = c.gold;
  const dome = 24 - close * 0.6;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(cup.x, cup.y - 4, 30, dome, 0, Math.PI, 0); ctx.closePath();
  ctx.fillStyle = lemon; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = darken(lemon, 0.16); ctx.beginPath(); ctx.ellipse(cup.x + 14, cup.y - 2, 22, dome, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = mix(lemon, c.bgSurface, 0.55); ctx.fillRect(cup.x - 30, cup.y - 6, 60, 4);
  ctx.strokeStyle = darken(lemon, 0.45); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cup.x, cup.y - 4, 30, dome, 0, Math.PI, 0); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = alpha(lighten(lemon, 0.6), 0.9);
  ctx.beginPath(); ctx.ellipse(cup.x - 12, cup.y - 4 - dome * 0.6, 7, 3.5, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // upper arm with the domed presser over the lemon
  strip(ctx, c, h, up, 12, 10);
  const pa = Math.atan2(up.y - h.y, up.x - h.x);
  ctx.save();
  ctx.translate(cup.x, yOn(up, cup.x));
  ctx.rotate(pa);
  ctx.beginPath(); ctx.ellipse(0, 4, 30, 11, 0, 0, Math.PI); ctx.closePath();
  ctx.fillStyle = steel; ctx.fill();
  ctx.fillStyle = darken(steel, 0.2); ctx.fillRect(4, 7, 22, 5);
  ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  // handle grips
  for (const q of [lo, up]) {
    const a = Math.atan2(q.y - h.y, q.x - h.x);
    strip(ctx, c, { x: q.x - Math.cos(a) * 66, y: q.y - Math.sin(a) * 66 }, q, 16, 16, grip);
  }
  pivotPin(ctx, c, h.x, h.y, 9);
  return { f: { x: h.x, y: h.y }, l: { x: cup.x, y: cup.y - 12 }, e: { x: up.x - 20, y: yOn(up, up.x - 20) } };
}

// Tweezers lying flat: joined end (F) left, finger grips (E) in the middle, tips (L) right.
function tweezers(ctx, c, cx, cy, squeeze) {
  const j = { x: cx - 92, y: cy };
  const spread = 30 - 12 * squeeze;
  const steel = metal(c);
  // the seed held at the tips
  const tipX = cx + 92;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(tipX + 4, cy, 10, 6, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = mix(c.s8, c.label, 0.35); ctx.fill();
  ctx.strokeStyle = darken(c.s8, 0.4); ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  for (const s of [-1, 1]) {
    const m = { x: cx, y: cy + s * spread };
    const tp = { x: tipX - 4, y: cy + s * 7 };
    strip(ctx, c, { x: j.x + 6, y: cy + s * 4 }, m, 10, 13);
    strip(ctx, c, m, tp, 13, 4);
    // grip ridges
    ctx.save();
    ctx.strokeStyle = darken(steel, 0.35); ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * 7, cy + s * spread - 4); ctx.lineTo(cx + i * 7, cy + s * spread + 4); ctx.stroke();
    }
    ctx.restore();
  }
  // the folded joint
  ctx.save();
  rr(ctx, j.x - 8, cy - 11, 22, 22, 9);
  ctx.fillStyle = darken(steel, 0.08); ctx.fill();
  ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = lighten(steel, 0.4); ctx.fillRect(j.x - 4, cy - 8, 12, 3);
  ctx.restore();
  return { f: { x: j.x, y: cy }, e: { x: cx, y: cy }, l: { x: tipX + 4, y: cy }, spread };
}

// Tongs crossed at a pivot: jaws (L) left, pivot (F), handles (E) right.
function crossTongs(ctx, c, cx, cy, half) {
  const o = { x: cx, y: cy };
  const steel = metal(c);
  const cube = 34;
  const jawD = 112;
  // the ice cube held in the jaws
  const qx = cx - jawD - 4;
  ctx.save();
  rr(ctx, qx - cube / 2, cy - cube / 2, cube, cube, 6);
  ctx.fillStyle = mix(c.s7, c.bgSurface, 0.35); ctx.fill();
  ctx.fillStyle = alpha(lighten(c.s7, 0.6), 0.85); ctx.fillRect(qx - cube / 2 + 5, cy - cube / 2 + 5, cube - 16, 5);
  ctx.fillStyle = darken(c.s7, 0.18); ctx.fillRect(qx + cube / 2 - 10, cy - cube / 2 + 4, 6, cube - 8);
  ctx.strokeStyle = darken(c.s7, 0.4); ctx.lineWidth = 2; rr(ctx, qx - cube / 2, cy - cube / 2, cube, cube, 6); ctx.stroke();
  ctx.restore();
  for (const s of [-1, 1]) {
    const jawAng = Math.PI + s * half;
    const handAng = -s * half;
    const jaw = at(o, jawAng, jawD);
    strip(ctx, c, at(o, jawAng, -4), jaw, 18, 13);
    // a cupped pad facing the cube
    ctx.save();
    rr(ctx, jaw.x - 22, jaw.y - (s < 0 ? 9 : 1), 30, 10, 4);
    ctx.fillStyle = darken(steel, 0.1); ctx.fill();
    ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    const hEnd = at(o, handAng, 132);
    strip(ctx, c, at(o, handAng, 4), hEnd, 18, 15);
    // rubber grip
    const g0 = at(o, handAng, 84);
    strip(ctx, c, g0, at(o, handAng, 136), 18, 17, c.s5);
  }
  pivotPin(ctx, c, cx, cy, 9);
  return { l: { x: qx, y: cy }, f: { x: cx, y: cy }, e: { x: cx + 110, y: cy } };
}

// Kitchen tongs (a chimta) joined at one end: joint (F) left, grip (E), tips (L) right.
function joinedTongs(ctx, c, cx, cy, half) {
  const j = { x: cx - 128, y: cy };
  const L = 250;
  const ballR = 17;
  const tip = { x: j.x + L, y: cy };
  // a round sweet held at the tips
  ctx.save();
  const bx = tip.x + 4, by = cy;
  ctx.beginPath(); ctx.arc(bx, by, ballR, 0, Math.PI * 2);
  ctx.fillStyle = c.s2; ctx.fill();
  ctx.beginPath(); ctx.arc(bx, by, ballR, -0.4, Math.PI * 0.6);
  ctx.fillStyle = darken(c.s2, 0.2); ctx.fill();
  ctx.fillStyle = darken(c.s2, 0.35);
  for (const [dx, dy] of [[-6, -4], [3, 5], [6, -7], [-3, 8]]) { ctx.beginPath(); ctx.arc(bx + dx, by + dy, 1.8, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = darken(c.s2, 0.45); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, ballR, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  for (const s of [-1, 1]) {
    const a = s * half;
    const end = at(j, a, L - 6);
    strip(ctx, c, { x: j.x + 4, y: cy + s * 4 }, end, 16, 13);
    // turned-in tip
    strip(ctx, c, end, { x: end.x + 12, y: end.y - s * 8 }, 13, 9);
  }
  // the ring at the joint
  ctx.save();
  const steel = metal(c);
  ctx.beginPath(); ctx.arc(j.x - 10, cy, 14, 0, Math.PI * 2);
  ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 8; ctx.stroke();
  ctx.strokeStyle = steel; ctx.lineWidth = 5; ctx.stroke();
  rr(ctx, j.x - 4, cy - 10, 18, 20, 6);
  ctx.fillStyle = darken(steel, 0.1); ctx.fill();
  ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  const gx = cx - 6;
  const gy = Math.tan(half) * (gx - j.x);
  return { f: { x: j.x, y: cy }, e: { x: gx, y: cy, gy }, l: { x: bx, y: cy } };
}

export class LeverClassesScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Three lever schematics side by side, each a bar on a triangle fulcrum with a load arrow and an effort arrow: class I with the fulcrum in the middle, class II with the load in the middle, class III with the effort in the middle. All three effort arrows point down, as the book draws them. Under each is a real example with its parts in the same order: scissors cutting card, a lemon squeezer pressed at its handle, and tweezers pinched in the middle; the middle part of each is ringed in turn. Then two tongs: tongs crossed at a pivot (class I) and tongs joined at one end (class III), both closing on what they hold.';

  enter() { this.motionT = 0; }

  get tongs() { return this.stage === 1; }

  pointerDown() {
    this.motionT = 0;
    this.animateFor(800);
  }

  get motionEnd() { return this.tongs ? SQUEEZE_S + 0.2 + GLOW_S + 0.1 : 0.2 + 2 * STEP_S + GLOW_S + 0.1; }
  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'grid');
    if (this.tongs) this.drawTongs(ctx, c);
    else this.drawClasses(ctx, c);
  }

  drawClasses(ctx, c) {
    const t = this.motionT ?? 0;
    // a work surface for the three examples
    ctx.save();
    ctx.fillStyle = alpha(mix(c.gold, c.bgSurface, 0.55), 0.35);
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = alpha(darken(c.gold, 0.3), 0.6);
    ctx.fillRect(0, GROUND, W, 3);
    ctx.restore();
    for (let i = 0; i < 3; i++) {
      const cx = COLS[i];
      const k = inOutSine(clamp01((t - 0.2 - i * STEP_S) / GLOW_S));
      pill(ctx, c, NAMES[i], cx, 26, { bg: c.stroke, size: 26 });
      const xs = schematic(ctx, c, cx, SCH_Y, ORDERS[i], SCH_LEN, k, 26);
      let pts;
      if (i === 0) { drawShadow(ctx, c, cx, GROUND + 2, 90, 7, 0.6); pts = scissors(ctx, c, cx + 4, 352, 0.17); }
      else if (i === 1) { drawShadow(ctx, c, cx, GROUND + 2, 100, 7, 0.6); pts = squeezer(ctx, c, cx, 352, k); }
      else { drawShadow(ctx, c, cx, GROUND + 2, 90, 7, 0.6); pts = tweezers(ctx, c, cx - 4, 352, 0.4 * k); }
      const mid = ORDERS[i][1];
      for (const r of ORDERS[i]) ring(ctx, col(c, r), pts[r].x, pts[r].y, r === mid ? 16 + 4 * k : 14, r === mid ? 1 : 0.75);
      const sy = mid === 'f' ? SCH_Y + 80 : SCH_Y + 12;
      dropLine(ctx, col(c, mid), xs[mid], sy, pts[mid].x, pts[mid].y - 20, k);
      if (i === 0) {
        // squeeze the loops together
        for (const lc of pts.loops) {
          const sg = Math.sign(lc.y - 352);
          arrow(ctx, col(c, 'e'), lc.x + 6, lc.y + sg * 64, lc.x + 6, lc.y + sg * 26, 5);
        }
      }
      if (i === 1) arrow(ctx, col(c, 'e'), pts.e.x, pts.e.y - 64, pts.e.x, pts.e.y - 18, 5);
      if (mid === 'e' && i === 2) {
        const sp = pts.spread;
        arrow(ctx, col(c, 'e'), pts.e.x, 352 - sp - 46, pts.e.x, 352 - sp - 12, 5);
        arrow(ctx, col(c, 'e'), pts.e.x, 352 + sp + 46, pts.e.x, 352 + sp + 12, 5);
      }
    }
  }

  drawTongs(ctx, c) {
    const t = this.motionT ?? 0;
    const sq = inOutSine(clamp01(t / SQUEEZE_S));
    const k = inOutSine(clamp01((t - SQUEEZE_S - 0.2) / GLOW_S));
    ctx.save();
    ctx.fillStyle = alpha(mix(c.gold, c.bgSurface, 0.55), 0.35);
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = alpha(darken(c.gold, 0.3), 0.6);
    ctx.fillRect(0, GROUND, W, 3);
    ctx.restore();
    const halves = [
      { cx: 172, order: ORDERS[0], name: 'Class I' },
      { cx: 508, order: ORDERS[2], name: 'Class III' },
    ];
    const ty = 340;
    for (let i = 0; i < 2; i++) {
      const hf = halves[i];
      pill(ctx, c, hf.name, hf.cx, 26, { bg: c.stroke, size: 23 });
      const xs = schematic(ctx, c, hf.cx, SCH_Y + 10, hf.order, 220, k);
      let pts;
      drawShadow(ctx, c, hf.cx, GROUND + 2, 140, 8, 0.6);
      if (i === 0) {
        // open 13 deg, closed on the cube (gap 34 at the pads)
        const half = (13 - 5.6 * sq) * Math.PI / 180;
        pts = crossTongs(ctx, c, hf.cx + 30, ty, half);
        const hx = pts.e.x, hy = Math.tan(half) * 110;
        arrow(ctx, col(c, 'e'), hx, ty - hy - 48, hx, ty - hy - 14, 5);
        arrow(ctx, col(c, 'e'), hx, ty + hy + 48, hx, ty + hy + 14, 5);
      } else {
        const half = (7.5 - 3.8 * sq) * Math.PI / 180;
        pts = joinedTongs(ctx, c, hf.cx, ty, half);
        const gy = pts.e.gy;
        arrow(ctx, col(c, 'e'), pts.e.x, ty - gy - 48, pts.e.x, ty - gy - 12, 5);
        arrow(ctx, col(c, 'e'), pts.e.x, ty + gy + 48, pts.e.x, ty + gy + 12, 5);
      }
      const mid = hf.order[1];
      for (const r of hf.order) if (r !== 'e') ring(ctx, col(c, r), pts[r].x, pts[r].y, r === mid ? 22 + 4 * k : 22, r === mid ? 1 : 0.75);
      const sy = mid === 'f' ? SCH_Y + 90 : SCH_Y + 26;
      dropLine(ctx, col(c, mid), xs[mid], sy, pts[mid].x, pts[mid].y - (mid === 'e' ? 70 : 24), k);
    }
  }
}
