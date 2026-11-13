/**
 * ChapterSixCardScene - slide blk-l15-n02 "The chapter at a glance" (2 beats). Card look of
 * L08 ChapterFourCardScene (raised sheet, tinted tiles with a rim, an icon well, 26 px words).
 *   b0 'laws'    four tiles in a 2 x 2 grid: "friction" (a block slides right on a rough floor and slows,
 *                friction at its base, to the left), "first law" (a block on the ideal floor at steady
 *                speed, equal-gap dots, the kit dot "net force = 0"), "second law" (a cart, F right and a
 *                shorter a right, it speeds up; "a = F / m"), "third law" (two touching blocks, an equal and
 *                opposite pair at the contact, one arrow on each). Each tile lights and plays once in turn
 *                (0.6 s); rest: all shown.
 *   b1 'beyond'  top: a scale strip from tiny to huge (an atom, a person, a planet, a star): a bright middle
 *                band "Newton's laws work", the two ends dimmed, tags "atoms", "very massive objects",
 *                "near the speed of light". Bottom: a maglev train floats a little above its guideway (a
 *                glowing gap) and glides right once; tag "magnetic levitation".
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, font, clamp01, inOutSine, alpha, darken, lighten, mix, rr, luma } from 'simulations/base/kit/SimLook.js';
import { drawStrobe, trackSpec } from 'simulations/base/kit/SimTrack.js';
import { drawCart, drawBlock, propRig } from 'simulations/base/kit/SimProps.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawForce, drawNet, drawBoxOn } from '../shared/ForceCast.js';
import { drawMotionArrow } from '../shared/MotionCast.js';
import { drawSheet, drawTag } from '../shared/MotionGraph.js';

const TAU = Math.PI * 2;
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const CARD = { x: 16, y: 16, w: 648, h: 488 };
const TILE_W = 303, TILE_H = 222, GX = 14, GY = 14;
const LIGHT0 = 0.3, LIGHT_DT = 0.7, PLAY = 0.6;
const TILES = [
  { icon: 'friction', text: 'friction', tone: 8 },
  { icon: 'first', text: 'first law', tone: 1 },
  { icon: 'second', text: 'second law', tone: 6 },
  { icon: 'third', text: 'third law', tone: 3 },
];
// b1
const BY = 196, BAR = { x0: 46, x1: 634 }, MID = { x0: 186, x1: 474 };
const GT = 446, TRAIN = { len: 372, h: 66, lift: 16, x0: 40, x1: 254 }, T_GO = 0.6, GO = 2.8;

function tileRect(i) {
  const col = i % 2, row = Math.floor(i / 2);
  return { x: CARD.x + GX + col * (TILE_W + GX), y: CARD.y + GY + row * (TILE_H + GY), w: TILE_W, h: TILE_H };
}

export class ChapterSixCardScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A chapter card with four tiles that play in turn. Friction: a block slides to the right on a rough floor and slows down; friction acts at its base, to the left. First law: a block on a smooth floor moves at a steady speed, leaving equally spaced dots; the net force is zero. Second law: a force F pulls a cart to the right and it speeds up; a = F / m. Third law: two blocks touch and push on each other with equal and opposite forces, one on each block. Then a strip from tiny to huge, an atom, a person, a planet and a star: Newton\'s laws work across the bright middle; the ends, atoms, very massive objects and speeds near the speed of light, are dimmed. Below, a magnetic levitation train floats just above its track and glides to the right.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.age < (this.cur === 0 ? LIGHT0 + 3 * LIGHT_DT + PLAY + 0.5 : T_GO + GO + 0.5); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawSheet(ctx, c, CARD);
    if (this.cur === 0) {
      TILES.forEach((t, i) => {
        const t0 = LIGHT0 + i * LIGHT_DT;
        this.tile(ctx, c, tileRect(i), t, clamp01((this.age - t0) / 0.3), clamp01((this.age - t0) / PLAY));
      });
    } else {
      this.beyond(ctx, c, this.age);
    }
  }

  // -- b0: the four tiles ----------------------------------------------------------------------------------
  tile(ctx, c, R, t, on, u) {
    const tone = c['s' + t.tone], bg = mix(tone, c.bgSurface, 0.88), pop = on > 0 && on < 1 ? 1 + 0.04 * Math.sin(Math.PI * on) : 1;
    ctx.save();
    ctx.translate(R.x + R.w / 2, R.y + R.h / 2); ctx.scale(pop, pop); ctx.translate(-R.x - R.w / 2, -R.y - R.h / 2);
    ctx.globalAlpha = 0.28 + 0.72 * on;
    rr(ctx, R.x, R.y + 4, R.w, R.h, 14); ctx.fillStyle = alpha(darken(tone, 0.4), 0.35 * on); ctx.fill();
    rr(ctx, R.x, R.y, R.w, R.h, 14); ctx.fillStyle = on > 0 ? mix(c.bgSurface, bg, on) : c.bgSurface; ctx.fill();
    rr(ctx, R.x + 8, R.y + 4, R.w - 16, 4, 2); ctx.fillStyle = alpha(lighten(bg, 0.7), 0.7 * on); ctx.fill();
    rr(ctx, R.x, R.y, R.w, R.h, 14); ctx.lineWidth = 2.5; ctx.strokeStyle = mix(c.stroke, darken(tone, 0.2), on); ctx.stroke();
    ctx.font = font(c, 800, 26, true); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.label;
    ctx.fillText(t.text, R.x + 16, R.y + 28);
    const I = { x: R.x + 10, y: R.y + 52, w: R.w - 20, h: R.h - 62 };
    rr(ctx, I.x, I.y, I.w, I.h, 10); ctx.fillStyle = c.bgSurface; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = alpha(darken(tone, 0.2), 0.4); ctx.stroke();
    ctx.save(); rr(ctx, I.x, I.y, I.w, I.h, 10); ctx.clip();
    this.icon(ctx, c, t.icon, I, inOutSine(u), u);
    ctx.restore();
    ctx.restore();
  }

  icon(ctx, c, kind, I, e, u) {
    const fy = I.y + I.h - 34;                        // where things stand in every well
    if (kind === 'friction') {
      // slows down (still sliding at rest, so friction still acts): v = 1 - 0.7 u, x = D (u - 0.35 u^2)
      const x = I.x + 60 + 150 * (u - 0.35 * u * u);
      const box = drawBoxOn(ctx, c, { x, y: fy, w: 76, h: 60, kind: 'block', surface: 'rough', x0: I.x - 4, x1: I.x + I.w + 4, surfaceH: 30 });
      drawForce(ctx, c, box.bottom.x - 4, box.bottom.y - 8, { length: 70, angle: Math.PI, label: '', fit: false });
      drawMotionArrow(ctx, c, 'v', box.front.x + 6, box.top.y + 14, { length: 60 * (1 - 0.7 * u), angle: 0, label: 'v', side: 1, at: 0.5 });
    } else if (kind === 'first') {
      this.idealFloor(ctx, c, I.x - 4, I.x + I.w + 4, fy, 30);
      const x0 = I.x + 44, step = 46, x = x0 + 3 * step * u;
      const n = Math.floor(3 * u + 1e-6);
      const xs = []; for (let k = 0; k <= n; k++) xs.push(x0 + k * step - 30);
      drawStrobe(ctx, c, trackSpec({ from: 0, to: 680, x0: 0, x1: 680, y: fy }), { at: xs, marks: 'dots' });
      const b = drawBlock(ctx, c, propRig({ x0: 0, groundY: fy, scale: 1 }), x, { w: 60, h: 50, tone: 1 });
      drawMotionArrow(ctx, c, 'v', b.x0 + 64, b.y0 + 16, { length: 40, angle: 0, label: 'v', side: 1, at: 0.5 });
      drawNet(ctx, c, I.x + 110, I.y + 64, [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }], {});
    } else if (kind === 'second') {
      // speeds up: x = D u^2; F right from the cart's front, a right and shorter, above it
      const x = I.x + 70 + 60 * u * u;
      const cart = drawCart(ctx, c, propRig({ x0: 0, groundY: fy + 4, scale: 1 }), x, { w: 92, h: 34, tone: 6 });
      ctx.beginPath(); ctx.moveTo(I.x, fy + 5); ctx.lineTo(I.x + I.w, fy + 5); ctx.strokeStyle = alpha(c.label, 0.45); ctx.lineWidth = 3; ctx.stroke();
      drawForce(ctx, c, cart.right.x + 2, cart.right.y, { length: 80, angle: 0, label: 'F', fit: false });
      drawMotionArrow(ctx, c, 'a', cart.x0 + 10, cart.y0 - 14, { length: 50, angle: 0, label: 'a', side: 1, at: 0.5 });
      ctx.font = font(c, 900, 26, true); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = darken(c.s6, 0.1);
      ctx.fillText('a = F / m', I.x + I.w - 12, I.y + 24);
    } else if (kind === 'third') {
      const rig = propRig({ x0: 0, groundY: fy, scale: 1 }), cx = I.x + I.w / 2, L = 70 * e;
      ctx.beginPath(); ctx.moveTo(I.x, fy + 1); ctx.lineTo(I.x + I.w, fy + 1); ctx.strokeStyle = alpha(c.label, 0.45); ctx.lineWidth = 3; ctx.stroke();
      drawBlock(ctx, c, rig, cx - 40, { w: 80, h: 70, tone: 1 });
      drawBlock(ctx, c, rig, cx + 40, { w: 80, h: 70, tone: 2 });
      if (L > 1) {
        drawForce(ctx, c, cx + 3, fy - 52, { length: L, angle: 0, label: '', alpha: e, fit: false });
        drawForce(ctx, c, cx - 3, fy - 20, { length: L, angle: Math.PI, label: '', alpha: e, fit: false });
        this.word(ctx, c, 'F', cx + 3 + L + 14, fy - 52, c.s2ink, e);
        this.word(ctx, c, 'F', cx - 3 - L - 14, fy - 20, c.s1ink, e);
      }
    }
  }

  word(ctx, c, s, x, y, col, k = 1) {
    ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 900, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = c.bgSurface; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
    ctx.restore();
  }

  /** The ideal floor (L10/L11 glass look with a dashed edge), small. */
  idealFloor(ctx, c, x0, x1, y, h) {
    const p = darken(luma(c.label) > luma(c.bgSurface) ? c.label : c.bgSurface, 0.04), base = mix(p, c.glass, 0.5), w = x1 - x0;
    ctx.save();
    const g = ctx.createLinearGradient(x0, y, x0, y + h); g.addColorStop(0, lighten(base, 0.5)); g.addColorStop(1, darken(base, 0.08));
    rr(ctx, x0, y, w, h, 6); ctx.fillStyle = g; ctx.fill();
    ctx.save(); rr(ctx, x0, y, w, h, 6); ctx.clip();
    for (const [sx, sw] of [[0.1, 70], [0.55, 40]]) {
      const gx = x0 + w * sx; ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + sw, y); ctx.lineTo(gx + sw - h * 0.7, y + h); ctx.lineTo(gx - h * 0.7, y + h); ctx.closePath();
      ctx.fillStyle = alpha(lighten(base, 0.95), 0.5); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = alpha(lighten(c.glass, 0.7), 0.9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 8, y + 4); ctx.lineTo(x1 - 8, y + 4); ctx.stroke();
    ctx.setLineDash([8, 7]); ctx.lineWidth = 3; ctx.strokeStyle = darken(c.glass, 0.35); rr(ctx, x0, y, w, h, 6); ctx.stroke();
    ctx.restore();
  }

  // -- b1: where the laws work, and less friction -----------------------------------------------------------
  beyond(ctx, c, a) {
    const kS = ease(a, 0.1, 0.5), kB = ease(a, 0.5, 0.5);
    ctx.save(); ctx.globalAlpha *= kS;
    this.strip(ctx, c, kB);
    ctx.restore();
    this.maglev(ctx, c, ease(a, T_GO, GO), a);
  }

  strip(ctx, c, kB) {
    const dim = mix(c.labelMuted, c.bgSurface, 0.45), good = c.good;
    rr(ctx, BAR.x0, BY - 9, BAR.x1 - BAR.x0, 18, 9); ctx.fillStyle = dim; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = darken(dim, 0.25); ctx.stroke();
    if (kB > 0) {
      const x1 = MID.x0 + (MID.x1 - MID.x0) * kB;
      rr(ctx, MID.x0 - 6, BY - 16, x1 - MID.x0 + 12, 32, 14); ctx.fillStyle = alpha(good, 0.22); ctx.fill();
      rr(ctx, MID.x0, BY - 9, x1 - MID.x0, 18, 9); ctx.fillStyle = good; ctx.fill();
      ctx.fillStyle = alpha(lighten(good, 0.6), 0.8); ctx.fillRect(MID.x0 + 8, BY - 6, Math.max(0, x1 - MID.x0 - 16), 3);
      rr(ctx, MID.x0, BY - 9, x1 - MID.x0, 18, 9); ctx.lineWidth = 2; ctx.strokeStyle = darken(good, 0.35); ctx.stroke();
    }
    // the four things, tiny to huge; the two at the ends dimmed
    ctx.save(); ctx.globalAlpha *= 0.42; this.atom(ctx, c, 92, BY - 52); ctx.restore();
    const look = figureLook(c, { skin: 1, hairStyle: 'braid', hair: 1, top: 's4', bottom: 'navy' });
    drawFigure(ctx, c, { x: 262, y: BY - 16, height: 104, facing: 1, pose: 'stand' }, look);
    this.planet(ctx, c, 408, BY - 58, 40);
    ctx.save(); ctx.globalAlpha *= 0.42; this.star(ctx, c, 566, BY - 66, 44); ctx.restore();
    drawTag(ctx, c, 'Newton\'s laws work', (MID.x0 + MID.x1) / 2, BY + 44, { size: 26, col: darken(good, 0.1), alpha: kB, prefer: [[0, 0]] });
    drawTag(ctx, c, 'atoms', BAR.x0 + 2, BY + 44, { size: 26, col: c.labelMuted, align: 'left', prefer: [[0, 0]] });
    drawTag(ctx, c, 'very massive objects', CARD.x + CARD.w - 14, 50, { size: 26, col: c.labelMuted, align: 'right', prefer: [[0, 0]] });
    drawTag(ctx, c, 'near the speed of light', CARD.x + CARD.w - 14, BY + 44 + 44, { size: 26, col: c.labelMuted, align: 'right', prefer: [[0, 0]] });
  }

  atom(ctx, c, x, y) {
    ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = c.s5;
    for (const r of [0, Math.PI / 3, -Math.PI / 3]) { ctx.beginPath(); ctx.ellipse(x, y, 28, 10, r, 0, TAU); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fillStyle = c.s6; ctx.fill();
    for (const [r, t] of [[0, 0.3], [Math.PI / 3, 2.2], [-Math.PI / 3, 4.1]]) {
      const ex = 28 * Math.cos(t), ey = 10 * Math.sin(t);
      ctx.beginPath(); ctx.arc(x + ex * Math.cos(r) - ey * Math.sin(r), y + ex * Math.sin(r) + ey * Math.cos(r), 4, 0, TAU); ctx.fillStyle = c.s1; ctx.fill();
    }
    ctx.restore();
  }

  planet(ctx, c, x, y, r) {
    const sea = mix(c.s1, c.s7, 0.35), land = mix(c.good, c.s3, 0.35);
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 4, x, y, r); g.addColorStop(0, lighten(sea, 0.3)); g.addColorStop(1, darken(sea, 0.25));
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    ctx.fillStyle = land;
    ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.2, r * 0.35, r * 0.22, -0.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + r * 0.35, y + r * 0.35, r * 0.3, r * 0.18, 0.3, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(sea, 0.45); ctx.stroke();
    ctx.restore();
  }

  star(ctx, c, x, y, r) {
    const col = mix(c.gold, c.flame, 0.2);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const t = i * TAU / 12; ctx.beginPath(); ctx.moveTo(x + Math.cos(t) * (r + 6), y + Math.sin(t) * (r + 6)); ctx.lineTo(x + Math.cos(t) * (r + 16), y + Math.sin(t) * (r + 16)); ctx.stroke(); }
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 4, x, y, r); g.addColorStop(0, lighten(col, 0.5)); g.addColorStop(1, col);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(col, 0.35); ctx.stroke();
    ctx.restore();
  }

  /** A maglev train over its guideway: the gap glows; it glides right once (eased), then rests. */
  maglev(ctx, c, u, a) {
    const beam = mix(c.bgSurface, c.label, 0.28);
    // pillars and the guideway beam
    for (const px of [120, 340, 560]) {
      rr(ctx, px - 16, GT + 20, 32, CARD.y + CARD.h - GT - 22, 4); ctx.fillStyle = darken(beam, 0.08); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = darken(beam, 0.4); ctx.stroke();
    }
    rr(ctx, CARD.x + 4, GT, CARD.w - 8, 24, 5); ctx.fillStyle = beam; ctx.fill();
    ctx.fillStyle = alpha(lighten(beam, 0.5), 0.8); ctx.fillRect(CARD.x + 10, GT + 2, CARD.w - 20, 4);
    ctx.fillStyle = alpha(darken(beam, 0.2), 0.8); ctx.fillRect(CARD.x + 10, GT + 16, CARD.w - 20, 6);
    rr(ctx, CARD.x + 4, GT, CARD.w - 8, 24, 5); ctx.lineWidth = 2; ctx.strokeStyle = darken(beam, 0.45); ctx.stroke();
    const x0 = TRAIN.x0 + (TRAIN.x1 - TRAIN.x0) * u, L = TRAIN.len, yb = GT - TRAIN.lift, yt = yb - TRAIN.h;
    // the glowing gap: no wheels, nothing touching
    const glow = c.s7;
    ctx.save(); ctx.lineCap = 'round';
    for (const [w, k] of [[12, 0.18], [6, 0.35], [2.5, 0.95]]) {
      ctx.beginPath(); ctx.moveTo(x0 + 24, GT - TRAIN.lift / 2); ctx.lineTo(x0 + L - 40, GT - TRAIN.lift / 2); ctx.strokeStyle = alpha(glow, k); ctx.lineWidth = w; ctx.stroke();
    }
    ctx.restore();
    // the body: a long capsule with a sloped nose at the right
    const body = mix(c.bgSurface, c.label, 0.08), stripe = c.s1;
    const path = () => {
      ctx.beginPath(); ctx.moveTo(x0 + 18, yt); ctx.lineTo(x0 + L - 92, yt);
      ctx.bezierCurveTo(x0 + L - 30, yt, x0 + L, yb - 20, x0 + L, yb - 6); ctx.quadraticCurveTo(x0 + L, yb, x0 + L - 10, yb);
      ctx.lineTo(x0 + 18, yb); ctx.quadraticCurveTo(x0, yb, x0, yb - 18); ctx.lineTo(x0, yt + 18); ctx.quadraticCurveTo(x0, yt, x0 + 18, yt); ctx.closePath();
    };
    ctx.save(); ctx.translate(0, 4); path(); ctx.fillStyle = alpha(darken(body, 0.6), 0.2); ctx.fill(); ctx.restore();
    path(); ctx.fillStyle = body; ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.fillStyle = darken(body, 0.12); ctx.fillRect(x0, yb - 16, L, 16);                       // shade side, low
    ctx.fillStyle = stripe; ctx.fillRect(x0, yb - 26, L, 7);                                    // the livery stripe
    ctx.fillStyle = alpha(lighten(body, 0.6), 0.8); ctx.fillRect(x0 + 10, yt + 3, L - 110, 3);  // light side, top
    const win = mix(c.label, c.s1, 0.35);
    for (let wx = x0 + 26; wx < x0 + L - 120; wx += 40) { rr(ctx, wx, yt + 14, 28, 18, 5); ctx.fillStyle = win; ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(x0 + L - 96, yt + 12); ctx.lineTo(x0 + L - 60, yt + 12); ctx.quadraticCurveTo(x0 + L - 30, yt + 16, x0 + L - 18, yt + 34); ctx.lineTo(x0 + L - 96, yt + 34); ctx.closePath();
    ctx.fillStyle = win; ctx.fill();
    ctx.restore();
    path(); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(body, 0.45); ctx.stroke();
    drawTag(ctx, c, 'magnetic levitation', 340, GT - TRAIN.lift - TRAIN.h - 30, { size: 26, col: c.s7ink, prefer: [[0, 0]] });
  }
}
