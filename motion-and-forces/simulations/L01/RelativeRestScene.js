/**
 * RelativeRestScene - predict blk-l01-s2 (setup) and explain blk-l01-s3 (2 beats).
 * Setup (hostRole 'setup' or beat MAX_SAFE_INTEGER, stage 2): a classroom wall and floor,
 *   a desk with a large closed book on it. No Earth, no Sun, no tag: nothing answers.
 * b0: the classroom moves left; the book carries the tag "at rest (classroom)". An inset
 *   opens: the Sun, the Earth's orbit, the Earth carried once along a short arc (a faint
 *   copy stays where it started, the arc between them), a tiny desk on the Earth; tag
 *   "in motion (Sun)".
 * b1: a bus in cut-away view on a road at steady speed, a passenger seated inside (upright:
 *   the bus does not change speed). The camera rides with the bus: road dashes and a roadside
 *   tree (its crown above the roof) slide back once, about 3 s, then rest with the tree left
 *   behind her. She stays on her seat. Tags above her: "bus: at rest", "road: in motion".
 * ASCII only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, rr, darken, lighten, alpha, mix, font, outBack, inOutSine } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack } from 'simulations/base/kit/SimTrack.js';
import { drawBus } from 'simulations/base/kit/SimVehicles.js';
import { drawDesk } from 'simulations/base/kit/SimProps.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { LOOKS } from '../shared/MotionCast.js';

const FLOOR = 430;
const RIDE = 3.0, GO = 0.5, BUS_Y = 458, BUS_L = 700, BUS_X = 300;
const TREE_PX0 = 780, TREE_PX1 = 110;          // the tree slides from ahead of her to behind her

/** A light tag with a coloured rim (never a dark pill); returns its box. */
function tagAt(ctx, c, text, x, y, col, size = 26) {
  ctx.save();
  ctx.font = font(c, 800, size, true);
  const w = ctx.measureText(text).width + 26, h = size * 1.3;
  x = Math.max(w / 2 + 8, Math.min(680 - w / 2 - 8, x));
  ctx.save(); ctx.translate(0, 3); rr(ctx, x - w / 2, y - h / 2, w, h, 10); ctx.fillStyle = darken(col, 0.35); ctx.fill(); ctx.restore();
  rr(ctx, x - w / 2, y - h / 2, w, h, 10); ctx.fillStyle = c.bgSurface; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
  return { x0: x - w / 2, y0: y - h / 2, w, h };
}

/** A roadside tree standing on y at x, about h tall. */
function drawTree(ctx, c, x, y, h) {
  const bark = darken(c.s8, 0.45), leaf = c.s3, tw = h * 0.1, th = h * 0.45;
  ctx.save();
  rr(ctx, x - tw / 2, y - th, tw, th + 2, 4); ctx.fillStyle = bark; ctx.fill();
  ctx.fillStyle = darken(bark, 0.25); ctx.fillRect(x + tw * 0.1, y - th + 4, tw * 0.35, th - 4);
  rr(ctx, x - tw / 2, y - th, tw, th + 2, 4); ctx.strokeStyle = darken(bark, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
  const lobes = [[-0.18, -0.58, 0.2], [0.18, -0.58, 0.2], [0, -0.8, 0.24]];
  const crown = () => { ctx.beginPath(); for (const [dx, dy, r] of lobes) { ctx.moveTo(x + dx * h + r * h, y + dy * h); ctx.arc(x + dx * h, y + dy * h, r * h, 0, Math.PI * 2); } };
  ctx.save(); ctx.translate(0, 4); crown(); ctx.fillStyle = darken(leaf, 0.45); ctx.fill(); ctx.restore();
  crown(); ctx.fillStyle = leaf; ctx.fill();
  ctx.save(); crown(); ctx.clip();
  ctx.fillStyle = darken(leaf, 0.2); ctx.fillRect(x - h, y - h * 0.62, 2 * h, h);
  ctx.fillStyle = alpha(lighten(leaf, 0.45), 0.85); ctx.beginPath(); ctx.ellipse(x - h * 0.1, y - h * 0.92, h * 0.09, h * 0.045, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.lineWidth = 2.5; ctx.strokeStyle = darken(leaf, 0.4);
  for (const [dx, dy, r] of lobes) { ctx.beginPath(); ctx.arc(x + dx * h, y + dy * h, r * h, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
  ctx.restore();
}

export class RelativeRestScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  // The predict setup mount sends beat and count Number.MAX_SAFE_INTEGER: map it to stage 2 (setup).
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: 2, dwellMs: null }]] };
  static ARIA_LABEL = 'A book lies on a desk in a classroom. Measured from the classroom, the book stays in the same place: at rest. In an inset, the Earth moves along its path around the Sun, carrying the desk with it: measured from the Sun, the book is in motion. Then a passenger sits in a moving bus: she stays in the same place in the bus, so she is at rest with respect to the bus, while a roadside tree falls behind her, so she is in motion with respect to the road.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === 2 || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.age < (this.isSetup() ? 0.6 : this.cur === 1 ? GO + RIDE + 0.8 : 2.8); }

  draw(ctx, c) {
    if (this.isSetup()) { this.room(ctx, c, 340, 1.35); return; }
    if (this.cur === 1) { this.busBeat(ctx, c); return; }
    this.bookBeat(ctx, c);
  }

  // -- the classroom ---------------------------------------------------------

  /** Wall, board, floor, the desk centred at cx (scale k), the book on it. Returns the book's box. */
  room(ctx, c, cx, k) {
    const wall = mix(c.bgSurface, c.s2, 0.14), floorCol = darken(mix(c.s8, c.bgSurface, 0.45), 0.12);
    ctx.save();
    ctx.fillStyle = wall; ctx.fillRect(0, 0, 680, FLOOR);
    ctx.fillStyle = darken(wall, 0.06); ctx.fillRect(0, FLOOR - 120, 680, 120);                       // lower wall
    ctx.fillStyle = darken(wall, 0.22); ctx.fillRect(0, FLOOR - 14, 680, 14);                          // skirting
    // Floor: planks with a light top edge.
    ctx.fillStyle = floorCol; ctx.fillRect(0, FLOOR, 680, 520 - FLOOR);
    ctx.strokeStyle = darken(floorCol, 0.22); ctx.lineWidth = 2;
    for (const y of [FLOOR + 30, FLOOR + 64]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(680, y); ctx.stroke(); }
    ctx.fillStyle = alpha(lighten(floorCol, 0.3), 0.6); ctx.fillRect(0, FLOOR, 680, 3);
    // A chalkboard on the wall, behind the desk.
    const bx = 56, bw = 300, by = 50, bh = 140, board = mix(darken(c.s3, 0.62), c.label, 0.1);
    rr(ctx, bx - 10, by - 10, bw + 20, bh + 20, 10); ctx.fillStyle = darken(c.s8, 0.35); ctx.fill();
    rr(ctx, bx, by, bw, bh, 6); ctx.fillStyle = board; ctx.fill();
    ctx.fillStyle = alpha(lighten(board, 0.25), 0.5); ctx.fillRect(bx + 6, by + 6, bw - 12, 4);
    rr(ctx, bx + bw * 0.62, by + bh + 4, 40, 8, 3); ctx.fillStyle = lighten(c.bgSurface, 0.2); ctx.fill();   // chalk on the ledge
    ctx.restore();
    // The desk and the book.
    const desk = drawDesk(ctx, c, { x0: cx - 150 * k, x1: cx + 150 * k, y: FLOOR + 30, forHeight: 250 * k, build: 'adult' });
    return this.book(ctx, c, cx + 10 * k, desk.top, 150 * k);
  }

  /** A closed book lying flat on y, w wide: cover with light and shade, a page edge, a spine. */
  book(ctx, c, x, y, w) {
    const h = w * 0.2, cov = c.s6, pages = mix(c.bgSurface, c.s2, 0.12), x0 = x - w / 2, top = y - h;
    ctx.save();
    ctx.fillStyle = alpha(darken(c.bgDeep, 0.5), 0.2); ctx.beginPath(); ctx.ellipse(x, y + 1, w * 0.55, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Back cover, page block, front cover (seen a little from above).
    rr(ctx, x0, y - h * 0.32, w, h * 0.32, 4); ctx.fillStyle = darken(cov, 0.2); ctx.fill();
    rr(ctx, x0 + 6, top + h * 0.3, w - 10, h * 0.45, 2); ctx.fillStyle = pages; ctx.fill();
    ctx.strokeStyle = darken(pages, 0.18); ctx.lineWidth = 1.5;
    for (const f of [0.42, 0.55, 0.66]) { ctx.beginPath(); ctx.moveTo(x0 + 10, top + h * f); ctx.lineTo(x0 + w - 6, top + h * f); ctx.stroke(); }
    rr(ctx, x0 - 2, top, w + 2, h * 0.34, 5); ctx.fillStyle = cov; ctx.fill();
    ctx.fillStyle = alpha(lighten(cov, 0.45), 0.8); ctx.fillRect(x0 + w * 0.12, top + 3, w * 0.5, 3);
    rr(ctx, x0 - 4, top, 12, h, 5); ctx.fillStyle = darken(cov, 0.12); ctx.fill();                       // spine
    ctx.strokeStyle = darken(cov, 0.42); ctx.lineWidth = 2.5;
    rr(ctx, x0 - 2, top, w + 2, h * 0.34, 5); ctx.stroke(); rr(ctx, x0 - 4, top, 12, h, 5); ctx.stroke();
    rr(ctx, x0, y - h * 0.32, w, h * 0.32, 4); ctx.stroke();
    ctx.restore();
    return { x0: x0 - 4, y0: top, w: w + 6, h };
  }

  bookBeat(ctx, c) {
    const bk = this.room(ctx, c, 186, 1.0);
    const p = clamp01((this.age - 0.2) / 0.4);
    if (p > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, p * 2); tagAt(ctx, c, 'at rest (classroom)', 186, bk.y0 - 40 + 8 * (1 - outBack(p)), c.s3); ctx.restore(); }
    const q = clamp01((this.age - 0.5) / 0.45);
    if (q > 0) this.inset(ctx, c, q);
  }

  /** The Sun inset: the Earth carried along a short arc of its orbit; a tiny desk rides on it. */
  inset(ctx, c, q) {
    const x0 = 372, y0 = 24, w = 292, h = 300, s = outBack(q);
    const cx = x0 + w / 2, cy = y0 + 132, rx = 112, ry = 70;
    ctx.save();
    ctx.translate(cx, y0 + h / 2); ctx.scale(s, s); ctx.translate(-cx, -(y0 + h / 2));
    const space = darken(c.s5, 0.72);
    ctx.save(); ctx.translate(0, 5); rr(ctx, x0, y0, w, h, 16); ctx.fillStyle = darken(space, 0.4); ctx.fill(); ctx.restore();
    rr(ctx, x0, y0, w, h, 16); ctx.fillStyle = space; ctx.fill();
    ctx.strokeStyle = lighten(space, 0.3); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = alpha(lighten(space, 0.75), 0.7);
    for (const [sx, sy, r] of [[0.08, 0.1, 2], [0.86, 0.12, 2.5], [0.93, 0.5, 1.8], [0.06, 0.62, 2.2], [0.3, 0.06, 1.6], [0.7, 0.08, 1.8]]) { ctx.beginPath(); ctx.arc(x0 + sx * w, y0 + sy * h, r, 0, Math.PI * 2); ctx.fill(); }
    // The orbit.
    ctx.save(); ctx.strokeStyle = alpha(lighten(space, 0.6), 0.6); ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    // The Sun.
    const sun = c.gold, sr = 30;
    ctx.save(); ctx.strokeStyle = alpha(lighten(sun, 0.2), 0.85); ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (sr + 7), cy + Math.sin(a) * (sr + 7)); ctx.lineTo(cx + Math.cos(a) * (sr + 15), cy + Math.sin(a) * (sr + 15)); ctx.stroke(); }
    ctx.restore();
    this.ball(ctx, c, cx, cy, sr, sun);
    // The Earth: carried once from a0 to a1 (front of the orbit, moving left to right).
    const a0 = Math.PI * 0.78, a1 = Math.PI * 0.32;
    const u = inOutSine(clamp01((this.age - 0.9) / 1.6)), a = a0 + (a1 - a0) * u;
    const at = (ang) => ({ x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry });
    const e0 = at(a0), e = at(a);
    if (u > 0.02) {
      ctx.save(); ctx.strokeStyle = alpha(c.s1, 0.95); ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, a, a0); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.35; this.earth(ctx, c, e0.x, e0.y, false); ctx.restore();
    }
    this.earth(ctx, c, e.x, e.y, true);
    const tq = clamp01((this.age - 2.4) / 0.35);
    if (tq > 0) { ctx.save(); ctx.globalAlpha = tq; tagAt(ctx, c, 'in motion (Sun)', cx, y0 + h - 34, c.s1); ctx.restore(); }
    ctx.restore();
  }

  ball(ctx, c, x, y, r, col) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = darken(col, 0.2); ctx.beginPath(); ctx.arc(x + r * 0.35, y + r * 0.35, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - r * 0.12, y - r * 0.12, r * 0.86, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(lighten(col, 0.55), 0.85); ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.26, r * 0.14, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.strokeStyle = darken(col, 0.42); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  /** The Earth, r 20: ocean with land, light and shade; with the tiny desk standing on its top. */
  earth(ctx, c, x, y, desk) {
    const r = 20;
    this.ball(ctx, c, x, y, r, c.s1);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = c.s3;
    ctx.beginPath(); ctx.ellipse(x - 6, y - 4, 8, 6, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 8, y + 7, 6, 5, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (!desk) return;
    // The tiny desk on top (wood slab on two legs) and the red book on it.
    const wood = mix(c.s8, c.label, 0.25), dy = y - r + 1;
    ctx.save();
    ctx.fillStyle = darken(wood, 0.3); ctx.fillRect(x - 7, dy - 8, 2.5, 8); ctx.fillRect(x + 4.5, dy - 8, 2.5, 8);
    ctx.fillStyle = wood; rr(ctx, x - 10, dy - 11, 20, 4, 1.5); ctx.fill();
    ctx.fillStyle = c.s6; ctx.fillRect(x - 4, dy - 15, 9, 4);
    ctx.restore();
  }

  // -- the bus ---------------------------------------------------------------

  busBeat(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const u = inOutSine(clamp01((this.age - GO) / RIDE));
    const pxPerM = BUS_L / 12, d = ((TREE_PX0 - TREE_PX1) / pxPerM) * u;
    // The road moves back under the bus (scroll by the distance travelled); the tree with it.
    const spec = trackSpec({ from: 0, to: 680 / pxPerM, x0: 0, x1: 680, y: BUS_Y });
    drawTree(ctx, c, TREE_PX0 - d * pxPerM, BUS_Y - 40, 330);
    drawTrack(ctx, c, spec, { kind: 'road', ticks: false, scroll: d, origin: null });
    const bus = drawBus(ctx, c, { x: BUS_X, y: BUS_Y, length: BUS_L, inside: true, lean: 0, roll: d, pxPerM });
    const A = bus.anchors, seat = A.seats[A.seats.length - 1];
    drawFigure(ctx, c, { x: seat.x, y: A.floor, height: A.figureHeight, build: 'adult', facing: 1, pose: 'sit', seat },
      figureLook(c, { ...LOOKS.passenger, hairStyle: 'braid' }));
    // Her tags, above her over the roof, stacked; a short leader down to her head.
    const p = clamp01((this.age - 0.2) / 0.4), q = clamp01((this.age - GO - RIDE * 0.55) / 0.4);
    const head = { x: seat.x, y: A.floor - A.figureHeight * 0.95 };
    const tx = seat.x - 40, y1 = 52, y2 = 102;
    if (p > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, p * 2);
      ctx.strokeStyle = alpha(c.label, 0.5); ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(head.x, y2 + 20); ctx.lineTo(head.x, head.y - 10); ctx.stroke(); ctx.setLineDash([]);
      tagAt(ctx, c, 'bus: at rest', tx, y1 + 8 * (1 - outBack(p)), c.s3);
      ctx.restore();
    }
    if (q > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, q * 2); tagAt(ctx, c, 'road: in motion', tx, y2 + 8 * (1 - outBack(q)), c.s1); ctx.restore(); }
  }
}
