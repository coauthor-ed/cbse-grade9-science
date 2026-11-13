/**
 * NonContactPairsScene - slide blk-l15-n01 "With or without contact" (1 beat; Figs 6.31-6.33), and the
 * predict setup of blk-l15-s9 "The fruit and the Earth".
 *   b0 'pairs'  three panels in a row (on a phone: magnets and balloons side by side, the fruit below),
 *               each a pair with no contact and two equal F arrows on the two objects:
 *               (1) two bar magnets on a table, N facing N; they slide apart a little;
 *               (2) two charged balloons hanging from one point swing apart;
 *               (3) a mango falls from a branch towards the Earth (a big curved arc): "pull of the Earth"
 *                   on the fruit (down), "pull of the fruit" on the Earth (up), equal length.
 *               Each panel animates in turn (0.8 s); a panel waiting its turn is dimmed. Rest: all shown.
 *   setup       (hostRole 'setup' or beat MAX) only the fruit and the Earth, large: the fruit falls from
 *               rest (x = 1/2 a t squared) to mid-way, the two equal arrows shown; the Earth does not
 *               move. No acceleration arrows, no masses (that is the answer).
 * Pair colours: object 1 series-1 (balloon 1, the Earth), object 2 series-2 (balloon 2, the fruit); the
 * magnets keep red N / blue S halves, so their rings use series-5 and series-8. Tags in the same inks.
 * Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, rr } from 'simulations/base/kit/SimLook.js';
import { drawMagnet } from 'simulations/base/kit/SimApparatus.js';
import { drawForce } from '../shared/ForceCast.js';
import { drawSurface } from '../shared/MotionCast.js';
import { drawTag, drawSheet } from '../shared/MotionGraph.js';

const TAU = Math.PI * 2;
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const SETUP = 9;
const T0 = 0.3, STEP = 0.9, DUR = 0.8;

// -- the fruit and the Earth (also drawn, copied, in GunBulletScene) --------------------------------------
const woodOf = (c) => mix(darken(c.gold, 0.32), c.flame, 0.12);

/** A leafy branch from (x0, y) out to x1, drooping a little; returns the point the stem hangs from. */
function drawBranch(ctx, c, x0, x1, y) {
  const wood = woodOf(c), leaf = mix(c.good, c.s3, 0.35), len = x1 - x0;
  const P = (u) => ({ x: x0 + u * len, y: y + 18 * u * u });
  ctx.save(); ctx.lineCap = 'round';
  for (const [w, col] of [[16, darken(wood, 0.35)], [12, wood]]) {
    ctx.beginPath(); ctx.moveTo(x0 - 20, y - 6);
    ctx.quadraticCurveTo(x0 + len * 0.5, y - 4, x1, y + 18); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(x0 - 20, y - 9); ctx.quadraticCurveTo(x0 + len * 0.5, y - 7, x1 - 6, y + 13);
  ctx.strokeStyle = alpha(lighten(wood, 0.45), 0.7); ctx.lineWidth = 2.5; ctx.stroke();
  // leaves along the branch: light side up, darker side down, a midrib
  const leaves = [[0.12, -1, 0.9], [0.3, 1, 1], [0.46, -1, 1.05], [0.62, 1, 0.9], [0.78, -1, 0.95], [0.95, 1, 0.8]];
  for (const [u, s, k] of leaves) {
    const p = P(u), ang = s * 0.75 - 0.25, L = 46 * k, W = 15 * k;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang + (s < 0 ? -Math.PI / 2 : Math.PI / 2) * 0.55);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -W, L, 0); ctx.quadraticCurveTo(L * 0.5, W, 0, 0);
    ctx.fillStyle = s < 0 ? lighten(leaf, 0.12) : darken(leaf, 0.08); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = darken(leaf, 0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(L - 6, 0); ctx.strokeStyle = alpha(lighten(leaf, 0.5), 0.8); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  return P(0.55);
}

/** A mango, tilted a little: amber body, green shoulder, shade side, highlight, darker rim. No face. */
function drawMango(ctx, c, x, y, r) {
  const col = mix(c.s2, c.s8, 0.3);
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.3);
  const path = () => { ctx.beginPath(); ctx.ellipse(0, 0, r * 0.8, r, 0, 0, TAU); };
  ctx.save(); ctx.translate(3, 5); path(); ctx.fillStyle = alpha(darken(col, 0.6), 0.25); ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = col; ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.beginPath(); ctx.ellipse(r * 0.45, r * 0.35, r * 0.8, r * 1.0, 0, 0, TAU); ctx.fillStyle = alpha(darken(col, 0.25), 0.55); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-r * 0.15, -r * 0.85, r * 0.7, r * 0.45, 0, 0, TAU); ctx.fillStyle = alpha(mix(col, c.good, 0.55), 0.75); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.3, r * 0.16, r * 0.3, 0.3, 0, TAU); ctx.fillStyle = alpha(lighten(col, 0.75), 0.75); ctx.fill();
  path(); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(col, 0.4); ctx.stroke();
  ctx.restore();
}

/** The Earth as a big curved arc filling x0..x1 from `top` down; returns surfaceY(x). */
function drawEarth(ctx, c, x0, x1, top, bottom) {
  const w = x1 - x0, R = Math.max(w * 1.1, 260), cx = (x0 + x1) / 2, cy = top + R;
  const sea = mix(c.s1, c.s7, 0.35), land = mix(c.good, c.s3, 0.35);
  const disc = () => { ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); };
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, top - 24, w, bottom - top + 24); ctx.clip();
  ctx.beginPath(); ctx.arc(cx, cy, R + 12, 0, TAU); ctx.fillStyle = alpha(lighten(sea, 0.55), 0.3); ctx.fill();   // air glow
  const g = ctx.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, lighten(sea, 0.18)); g.addColorStop(1, darken(sea, 0.3));
  disc(); ctx.fillStyle = g; ctx.fill();
  ctx.save(); disc(); ctx.clip();
  for (const [u, dy, rw, rh, rot] of [[0.2, 30, 0.2, 20, -0.08], [0.72, 46, 0.17, 16, 0.1], [0.46, 84, 0.12, 12, 0.02]]) {
    ctx.beginPath(); ctx.ellipse(x0 + u * w, top + dy, rw * w, rh, rot, 0, TAU); ctx.fillStyle = land; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = darken(land, 0.35); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x0 + u * w - 6, top + dy - rh * 0.35, rw * w * 0.6, rh * 0.35, rot, 0, TAU); ctx.fillStyle = alpha(lighten(land, 0.4), 0.5); ctx.fill();
  }
  ctx.restore();
  const span = Math.asin(Math.min(1, w / (2 * R))) + 0.05;
  ctx.beginPath(); ctx.arc(cx, cy, R - 4, -Math.PI / 2 - span, -Math.PI / 2 + span); ctx.strokeStyle = alpha(lighten(sea, 0.7), 0.85); ctx.lineWidth = 3; ctx.stroke();
  disc(); ctx.strokeStyle = darken(sea, 0.45); ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  return (x) => cy - Math.sqrt(Math.max(0, R * R - (x - cx) * (x - cx)));
}

/** A hanging balloon: knot at (kx, ky), body below it along angle th (0 = straight down). No face. */
function drawHangingBalloon(ctx, c, kx, ky, th, r, col) {
  ctx.save(); ctx.translate(kx, ky); ctx.rotate(-th);
  const cy = r * 1.12;
  const path = () => { ctx.beginPath(); ctx.ellipse(0, cy, r * 0.86, r, 0, 0, TAU); };
  path(); ctx.fillStyle = col; ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.beginPath(); ctx.ellipse(r * 0.4, cy + r * 0.35, r * 0.9, r, 0, 0, TAU); ctx.fillStyle = alpha(darken(col, 0.28), 0.55); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(-r * 0.32, cy - r * 0.36, r * 0.16, r * 0.3, 0.5, 0, TAU); ctx.fillStyle = alpha(lighten(col, 0.8), 0.8); ctx.fill();
  path(); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(col, 0.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5, 2); ctx.lineTo(5, 2); ctx.lineTo(0, cy - r + 2); ctx.closePath(); ctx.fillStyle = darken(col, 0.2); ctx.fill();   // knot
  ctx.restore();
  return { x: kx + Math.sin(th) * cy, y: ky + Math.cos(th) * cy };
}

export class NonContactPairsScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: SETUP, dwellMs: null }]] };
  static ARIA_LABEL = 'Three pairs of forces without contact. Two bar magnets with their north poles facing push each other apart: one arrow acts on magnet 1 and an equal arrow acts on magnet 2. Two charged balloons hanging from one point swing apart, each pushed by an equal force. A mango falls towards the Earth: the pull of the Earth acts on the fruit, downwards, and the pull of the fruit acts on the Earth, upwards, with an equal arrow.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.age < (this.isSetup() ? 1.8 : T0 + 2 * STEP + DUR + 0.6); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const a = this.age;
    if (this.isSetup()) {
      drawSheet(ctx, c, { x: 8, y: 8, w: 664, h: 504 }, { r: 16 });
      this.fruitPanel(ctx, c, this.fruitLayout('big', { x: 8, y: 8, w: 664, h: 504 }), clamp01((a - 0.3) / 1.0), ease(a, 0.1, 0.3));
      return;
    }
    const P = this.portrait;
    const rects = P
      ? [{ x: 8, y: 6, w: 328, h: 256 }, { x: 344, y: 6, w: 328, h: 256 }, { x: 8, y: 268, w: 664, h: 246 }]
      : [{ x: 8, y: 8, w: 188, h: 504 }, { x: 202, y: 8, w: 226, h: 504 }, { x: 434, y: 8, w: 238, h: 504 }];
    const titles = ['magnets', 'charged balloons', 'fruit and Earth'];
    rects.forEach((R, i) => {
      const t = T0 + i * STEP, u = ease(a, t, DUR), k = ease(a, t + 0.15, 0.4), on = 0.5 + 0.5 * ease(a, t - 0.25, 0.25);
      drawSheet(ctx, c, R, { r: 16 });
      ctx.save(); ctx.globalAlpha *= on;
      if (i === 0) this.magnetPanel(ctx, c, R, u, k, P);
      else if (i === 1) this.balloonPanel(ctx, c, R, u, k, P);
      else this.fruitPanel(ctx, c, this.fruitLayout(P ? 'wide' : 'tall', R), clamp01((a - t) / DUR), k);
      ctx.restore();
      const tx = P && i === 2 ? R.x + R.w - 12 : R.x + R.w / 2;
      drawTag(ctx, c, titles[i], tx, R.y + 32, { size: 26, col: c.label, align: P && i === 2 ? 'right' : 'center', prefer: [[0, 0]] });
    });
  }

  tag(ctx, c, s, x, y, col, k, align = 'center') {
    if (k > 0) drawTag(ctx, c, s, x, y, { size: 26, col, alpha: k, align, prefer: [[0, 0]] });
  }

  // -- (1) magnets -------------------------------------------------------------------------------------------
  magnetPanel(ctx, c, R, u, k, P) {
    const cx = R.x + R.w / 2, ty = R.y + (P ? 128 : 270), mw = P ? 96 : 66, mh = P ? 32 : 28, L = P ? 76 : 56;
    drawSurface(ctx, c, 'marble', R.x + 6, R.x + R.w - 6, ty, { h: 30, seed: 4 });
    const gap = 10 + (P ? 26 : 18) * u, my = ty - mh / 2 - 1;
    const m1 = cx - gap / 2 - mw / 2, m2 = cx + gap / 2 + mw / 2;
    this.ring(ctx, c, m1, my, mw, mh, c.s5);
    this.ring(ctx, c, m2, my, mw, mh, c.s8);
    drawMagnet(ctx, c, { x: m1, y: my, w: mw, h: mh, flip: true, size: 20 });
    drawMagnet(ctx, c, { x: m2, y: my, w: mw, h: mh, size: 20 });
    if (k <= 0) return;
    const ay = my - mh / 2 - 18;
    drawForce(ctx, c, cx - gap / 2 - 4, ay, { length: L * k, angle: Math.PI, label: '', alpha: k, fit: false });
    drawForce(ctx, c, cx + gap / 2 + 4, ay, { length: L * k, angle: 0, label: '', alpha: k, fit: false });
    this.tag(ctx, c, 'on magnet 1', R.x + 8, ty + (P ? 56 : 68), c.s5ink, k, 'left');
    this.tag(ctx, c, 'on magnet 2', R.x + R.w - 8, ty + (P ? 102 : 116), c.s8ink, k, 'right');
  }

  /** A soft series-tone ring round a magnet: says which object is magnet 1 and which is magnet 2. */
  ring(ctx, c, x, y, w, h, col) {
    ctx.save(); rr(ctx, x - w / 2 - 5, y - h / 2 - 5, w + 10, h + 10, 10);
    ctx.fillStyle = alpha(col, 0.18); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = alpha(col, 0.9); ctx.stroke(); ctx.restore();
  }

  // -- (2) charged balloons ------------------------------------------------------------------------------------
  balloonPanel(ctx, c, R, u, k, P) {
    const cx = R.x + R.w / 2, py = R.y + (P ? 74 : 104), Lt = P ? 38 : 130, r = P ? 24 : 30, L = P ? 54 : 44;
    const th = 0.06 + (P ? 0.52 : 0.24) * u;
    // the wooden rod and the peg the two threads hang from
    const wood = woodOf(c);
    rr(ctx, cx - 70, py - 16, 140, 12, 5); ctx.fillStyle = wood; ctx.fill();
    ctx.fillStyle = alpha(lighten(wood, 0.4), 0.7); ctx.fillRect(cx - 64, py - 15, 128, 3);
    rr(ctx, cx - 70, py - 16, 140, 12, 5); ctx.lineWidth = 2; ctx.strokeStyle = darken(wood, 0.45); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, py - 2, 4, 0, TAU); ctx.fillStyle = darken(wood, 0.4); ctx.fill();
    const out = [];
    for (const [s, col] of [[-1, c.s1], [1, c.s2]]) {
      const kx = cx + s * Math.sin(th) * Lt, ky = py + Math.cos(th) * Lt;
      ctx.beginPath(); ctx.moveTo(cx, py); ctx.lineTo(kx, ky); ctx.strokeStyle = alpha(c.label, 0.6); ctx.lineWidth = 2; ctx.stroke();
      out.push(drawHangingBalloon(ctx, c, kx, ky, s * th, r, col));
    }
    if (k <= 0) return;
    drawForce(ctx, c, out[0].x, out[0].y, { length: L * k, angle: Math.PI, label: '', alpha: k, fit: false });
    drawForce(ctx, c, out[1].x, out[1].y, { length: L * k, angle: 0, label: '', alpha: k, fit: false });
    const ty = P ? R.y + 194 : R.y + 344;
    this.tag(ctx, c, 'on balloon 1', R.x + 8, ty, c.s1ink, k, 'left');
    this.tag(ctx, c, 'on balloon 2', R.x + R.w - 8, ty + (P ? 44 : 46), c.s2ink, k, 'right');
  }

  // -- (3) the fruit and the Earth -----------------------------------------------------------------------------
  /** Where everything goes, per frame shape: 'tall' (a column), 'wide' (a phone row), 'big' (the setup). */
  fruitLayout(kind, R) {
    // Earth arrow just left of the fruit (dxE < 0) so the tags can sit right of both arrows.
    if (kind === 'big') {
      return { R, bx0: R.x, bx1: R.x + 380, by: R.y + 70, r: 30, ey: R.y + R.h - 96, L: 104, dxE: -44, rest: 0.5, tagEdy: 52 };
    }
    if (kind === 'wide') {
      return { R, bx0: R.x, bx1: R.x + 300, by: R.y + 30, r: 20, ey: R.y + R.h - 76, L: 58, dxE: -36, rest: 0.42, tagEdy: 20 };
    }
    // a narrow column: tags centred in rows of their own (between the arrows, and on the Earth)
    return { R, bx0: R.x, bx1: R.x + 160, by: R.y + 98, r: 25, ey: R.y + R.h - 84, L: 64, dxE: -34, rest: 0.3,
      tagF: { x: R.x + R.w / 2, y: R.y + 318, align: 'center' }, tagE: { x: R.x + R.w / 2, y: R.y + R.h - 30, align: 'center' } };
  }

  /** f: fall clock 0..1 (the fruit drops as f squared: constant acceleration); k: arrows 0..1. */
  fruitPanel(ctx, c, Lo, f, k) {
    const { R, r, L } = Lo;
    const surf = drawEarth(ctx, c, R.x + 2, R.x + R.w - 2, Lo.ey, R.y + R.h - 2);
    const stem = drawBranch(ctx, c, Lo.bx0, Lo.bx1, Lo.by);
    const fx = stem.x, y0 = stem.y + 14 + r, y1 = y0 + Lo.rest * (surf(fx) - y0 - r);
    const fy = y0 + (y1 - y0) * f * f;
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = darken(woodOf(c), 0.2); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(stem.x, stem.y); ctx.lineTo(fx, f > 0.02 ? stem.y + 10 : fy - r + 2); ctx.stroke(); ctx.restore();
    drawMango(ctx, c, fx, fy, r);
    if (k <= 0) return;
    const ex = fx + Lo.dxE, ey = surf(ex) + 4;
    drawForce(ctx, c, fx, fy, { length: L * k, angle: Math.PI / 2, label: '', alpha: k, fit: false });
    drawForce(ctx, c, ex, ey, { length: L * k, angle: -Math.PI / 2, label: '', alpha: k, fit: false });
    const pF = Lo.tagF ?? { x: fx + 24, y: fy + 0.58 * L, align: 'left' }, pE = Lo.tagE ?? { x: fx + 24, y: ey + Lo.tagEdy, align: 'left' };
    this.tag(ctx, c, 'pull of the Earth', pF.x, pF.y, c.s2ink, k, pF.align);
    this.tag(ctx, c, 'pull of the fruit', pE.x, pE.y, c.s1ink, k, pE.align);
  }
}
