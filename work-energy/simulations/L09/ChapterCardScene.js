import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, pill, font, clamp01, inOutSine, outBack,
  mix, alpha, lighten, darken, rr, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawStairs, drawBall, drawCrate, drawGulel, displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// ChapterCardScene - blk-l09-s05, At a Glance. A visual summary: one picture
// per idea, each tile in its own band, a short formula under it. The slide
// carries the sentences; the card carries the pictures.
// b0: three tiles side by side: W = F x s (a crate pushed through s), energy
//     can do work (a stretched gulel), work done = change in energy (W in,
//     the K bar rises).
// b1: four tiles, two by two: K (a rolling ball), U (a ball on a shelf at h,
//     mg down), P (a student on stairs, a stopwatch), machines (a steep and a
//     gentle ramp to the same height: a big F and a small F, equal W bars).
// Tap: reveal the tiles again.

const TIMES = String.fromCharCode(215);
const HALF = String.fromCharCode(189);
const SQ = String.fromCharCode(178);
const ROW_S = 0.6;      // one tile's reveal
const GAP_S = 0.55;     // between tile starts

const TILES = [
  [
    { pic: 'push', text: [`W = F ${TIMES} s`] },
    { pic: 'gulel', text: ['energy:', 'can do work'] },
    { pic: 'change', text: ['work done =', 'change in energy'] },
  ],
  [
    { pic: 'roll', text: [`K = ${HALF} m v${SQ}`] },
    { pic: 'height', text: ['U = m g h'] },
    { pic: 'stairs', text: ['P = W / t'] },
    { pic: 'ramp', text: ['machines'] },
  ],
];

// tile boxes: b0 three columns, b1 two by two; 16+ px between bands
const BOX3 = [0, 1, 2].map((i) => ({ x: 18 + i * 220, y: 40, w: 204, h: 420 }));
const BOX4 = [0, 1, 2, 3].map((i) => ({ x: 18 + (i % 2) * 332, y: 18 + Math.floor(i / 2) * 246, w: 312, h: 230 }));

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class ChapterCardScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A picture summary of the chapter, one tile at a time. First three tiles: a crate pushed through a distance s by a force F, W = F times s; a stretched gulel, energy can do work; an arrow of work W filling a kinetic energy bar, work done = change in energy. Then four tiles: a rolling ball, K = one half m v squared; a ball on a shelf at height h with its weight mg, U = m g h; a student climbing stairs against a stopwatch, P = W over t; and machines: a steep ramp with a big force and a gentle ramp with a small force to the same height, with equal work bars.';

  enter() { this.revealT = 0; }

  pointerDown() {
    this.revealT = 0;
    this.animateFor(600);
  }

  get tiles() { return TILES[Math.min(1, this.stage)] ?? TILES[0]; }

  get revealEnd() { return GAP_S * (this.tiles.length - 1) + ROW_S + 0.9; }

  update(d) { this.revealT = Math.min(this.revealEnd, (this.revealT ?? 0) + d); }

  busy() { return (this.revealT ?? 0) < this.revealEnd; }

  // 0..1 for tile i's own reveal; the picture's motion runs after it lands
  rowU(i) { return clamp01(((this.revealT ?? 0) - 0.15 - i * GAP_S) / ROW_S); }
  actU(i) { return clamp01(((this.revealT ?? 0) - 0.15 - i * GAP_S - ROW_S * 0.6) / 0.9); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const tiles = this.tiles;
    const three = tiles.length === 3;
    const boxes = three ? BOX3 : BOX4;
    tiles.forEach((tile, i) => {
      const u = this.rowU(i);
      if (u <= 0) return;
      const b = boxes[i];
      ctx.save();
      ctx.globalAlpha = Math.min(1, u * 1.6);
      ctx.translate(0, 22 * (1 - outBack(u)));
      this.band(ctx, c, b);
      const labH = three ? 96 : 52;
      const pic = { x: b.x + 10, y: b.y + 12, w: b.w - 20, h: b.h - labH - 18 };
      this.picture(ctx, c, tile.pic, pic.x, pic.y, pic.w, pic.h, inOutSine(this.actU(i)));
      this.words(ctx, c, tile.text, b.x + b.w / 2, b.y + b.h - labH / 2 - 6, three ? 26 : 30);
      ctx.restore();
    });
  }

  // a soft band per tile, so each picture sits in its own space
  band(ctx, c, b) {
    rr(ctx, b.x, b.y, b.w, b.h, 18);
    ctx.fillStyle = alpha(c.bgSurface, 0.82);
    ctx.fill();
    ctx.strokeStyle = mix(c.bgSurface, c.label, 0.16);
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  words(ctx, c, lines, cx, cy, size) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = c.label;
    if (lines.length === 1) {
      ctx.font = font(c, 800, size, true);
      ctx.fillText(lines[0], cx, cy);
    } else {
      const s = size - 4;
      ctx.font = font(c, 700, s, true);
      ctx.fillText(lines[0], cx, cy - s * 0.62);
      ctx.fillText(lines[1], cx, cy + s * 0.62);
    }
    ctx.restore();
  }

  // a ground strip under each picture, so every prop stands on something
  ground(ctx, c, x, y, w) {
    const g = mix(c.bgSurface, c.label, 0.14);
    rr(ctx, x, y, w, 8, 4);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = lighten(g, 0.25);
    ctx.fillRect(x + 4, y, w - 8, 2);
  }

  tag(ctx, c, text, x, y, bg) { pill(ctx, c, text, x, y, { bg, size: 22 }); }

  picture(ctx, c, kind, x, y, w, h, a) {
    const gy = y + h - 8;
    if (kind === 'push') {
      // a crate pushed through s: F behind it, s dashed under the ground
      const gp = y + h * 0.6;
      this.ground(ctx, c, x, gp, w);
      const x0 = x + 74, x1 = x + w - 36;
      const cx = x0 + (x1 - x0) * a;
      drawCrate(ctx, c, { x: cx, y: gp, w: 60, h: 54 });
      vectorArrow(ctx, c, cx - 30 - 44, gp - 27, { angle: 0, length: 42, col: c.accent, width: 6 });
      this.tag(ctx, c, 'F', cx - 30 - 24, gp - 66, c.accent);
      if (a > 0.05) {
        displacementArrow(ctx, c, x0 - 4, gp + 40, cx, gp + 40, { tone: 2, width: 4 });
        this.tag(ctx, c, 's', (x0 + cx) / 2 - 2, gp + 70, c.s2);
      }
    } else if (kind === 'gulel') {
      this.ground(ctx, c, x, gy, w);
      const gh = Math.min(h - 40, 220);
      const pull = 20 + 46 * a;
      drawGulel(ctx, c, { x: x + w / 2 + 34, y: gy, h: gh, spread: 46, pull: { x: x + w / 2 - pull, y: gy - gh * 0.62 }, stone: true, stoneR: 11 });
    } else if (kind === 'change') {
      // W done on the ball: the K bar rises by exactly W
      drawEnergyBars(ctx, c, {
        x: x + w - 82, y: y + 10, h: h - 70, panel: false, max: 1, total: 1, size: 24,
        bars: [{ id: 'K', label: 'K', tone: 1 }], values: { K: a },
      });
      const ay = y + h * 0.55;
      pill(ctx, c, 'W', x + 30, ay - 40, { bg: c.s2, size: 26 });
      vectorArrow(ctx, c, x + 12, ay, { angle: 0, length: w - 100, col: c.s2, width: 7, alpha: 0.4 + 0.6 * a });
    } else if (kind === 'roll') {
      this.ground(ctx, c, x, gy, w);
      const r = 30;
      const bx = x + r + 60 + (w - 2 * r - 150) * a;
      ctx.save();
      ctx.strokeStyle = alpha(c.s1, 0.5);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (const [dy, len] of [[-14, 30], [0, 44], [14, 26]]) {
        ctx.beginPath(); ctx.moveTo(bx - r - 8, gy - r + dy); ctx.lineTo(bx - r - 8 - len * a, gy - r + dy); ctx.stroke();
      }
      ctx.restore();
      drawBall(ctx, c, { x: bx, y: gy - r, r, tone: 6, shadowY: gy });
      vectorArrow(ctx, c, bx + r + 6, gy - r, { angle: 0, length: 46, col: c.s1, width: 6 });
      this.tag(ctx, c, 'v', bx + r + 32, gy - r - 34, c.s1);
    } else if (kind === 'height') {
      this.ground(ctx, c, x, gy, w);
      // a shelf on a post, a ball on it, the height bracket beside, mg down
      const sx = x + w * 0.56, sy = y + 58;
      const wood = mix(c.s8, c.gold, 0.45);
      ctx.fillStyle = darken(wood, 0.2);
      ctx.fillRect(sx - 5, sy + 10, 12, gy - sy - 10);
      ctx.fillStyle = lighten(wood, 0.2);
      ctx.fillRect(sx - 5, sy + 10, 4, gy - sy - 10);
      rr(ctx, sx - 46, sy, 96, 12, 3);
      ctx.fillStyle = wood;
      ctx.fill();
      ctx.fillStyle = darken(wood, 0.25);
      ctx.fillRect(sx - 44, sy + 8, 92, 4);
      drawBall(ctx, c, { x: sx, y: sy - 20, r: 20, tone: 6 });
      const hx = x + w * 0.28;
      ctx.save();
      ctx.strokeStyle = c.label;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(hx, gy); ctx.lineTo(hx, gy - (gy - sy) * a); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(hx - 9, gy); ctx.lineTo(hx + 9, gy); ctx.moveTo(hx - 9, sy); ctx.lineTo(hx + 9, sy); ctx.stroke();
      ctx.restore();
      this.tag(ctx, c, 'h', hx - 34, (gy + sy) / 2, c.s3);
      if (a > 0.5) {
        const mx = sx + 76;
        vectorArrow(ctx, c, mx, sy - 24, { angle: Math.PI / 2, length: 52, col: c.s6, width: 6, alpha: (a - 0.5) * 2 });
        this.tag(ctx, c, 'mg', mx + 2, sy + 50, c.s6);
      }
    } else if (kind === 'stairs') {
      // 5 steps of 12 px: a 100 px student is about 1.6 m beside 19 cm steps
      const sx0 = x + 96;
      const st = drawStairs(ctx, c, { x: sx0, y: gy + 6, n: 5, rise: 12, run: 30, depth: gy + 6 });
      const xs = x + 82, xe = sx0 + 5 * 30 - 14;
      const fx = xs + (xe - xs) * a;
      const pose = a > 0 && a < 1 ? { name: 'climb', phase: (a * 4) % 1 } : 'stand';
      const spec = figureFor(this, { role: 'student', pose, x: fx, y: fx < sx0 ? gy + 6 : st.ground(fx), height: 100, facing: 1 });
      spec.ground = st.ground;
      drawFigure(ctx, c, spec, spec.look);
      // a stopwatch for t, clear of the climber
      const cx = x + 34, cy = y + 34, r = 24;
      ctx.save();
      ctx.fillStyle = c.raised;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c.stroke;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = c.stroke;
      ctx.fillRect(cx - 5, cy - r - 8, 10, 6);
      ctx.fillStyle = alpha(c.s4, 0.5);
      const sw = Math.max(0.02, a) * 0.75;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r - 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sw); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = c.label;
      ctx.lineWidth = 3;
      const ang = -Math.PI / 2 + Math.PI * 2 * sw;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * (r - 6), cy + Math.sin(ang) * (r - 6)); ctx.stroke();
      ctx.restore();
    } else if (kind === 'ramp') {
      // the same height two ways: steep and short (big F), gentle and long (small F)
      this.ground(ctx, c, x, gy, w);
      const rise = h - 58, top = gy - rise;
      this.wedge(ctx, c, x + 6, x + 74, gy, top, a, 46);
      this.wedge(ctx, c, x + 86, x + 214, gy, top, a, 24);
      ctx.save();
      ctx.strokeStyle = alpha(c.label, 0.5);
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(x + 4, top); ctx.lineTo(x + 222, top); ctx.stroke();
      ctx.restore();
      // equal work: two W bars rise to the same level
      const bh = (rise - 6) * a, bw = 20, b0 = x + 232;
      for (const [k, tone] of [[0, c.accent], [1, c.accent]]) {
        const bx = b0 + k * (bw + 8);
        rr(ctx, bx, gy - bh, bw, Math.max(0.1, bh), 5);
        ctx.fillStyle = tone;
        ctx.fill();
        ctx.fillStyle = alpha(lighten(tone, 0.4), 0.7);
        ctx.fillRect(bx + 4, gy - bh + 3, 4, Math.max(0, bh - 6));
      }
      ctx.save();
      ctx.font = font(c, 800, 22, true);
      ctx.fillStyle = c.label;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('W', b0 + bw + 4, gy - bh - 6);
      ctx.restore();
    }
  }

  // one ramp from (xa, gy) up to (xb, top), a crate partway up it, F along the slope
  wedge(ctx, c, xa, xb, gy, top, a, flen) {
    const stone = mix(c.bgSurface, c.label, 0.24);
    ctx.fillStyle = stone;
    ctx.beginPath(); ctx.moveTo(xa, gy); ctx.lineTo(xb, top); ctx.lineTo(xb, gy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(stone, 0.18);
    ctx.beginPath(); ctx.moveTo(xb - 10, top + (gy - top) * 10 / (xb - xa)); ctx.lineTo(xb, top); ctx.lineTo(xb, gy); ctx.lineTo(xb - 10, gy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = lighten(stone, 0.3);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(xa, gy); ctx.lineTo(xb, top); ctx.stroke();
    const ang = Math.atan2(top - gy, xb - xa);
    const u = 0.3 + 0.35 * a;
    const px = xa + (xb - xa) * u, py = gy + (top - gy) * u;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    drawCrate(ctx, c, { x: 0, y: -1, w: 28, h: 24 });
    ctx.restore();
    // F pushes along the slope from below the crate
    const nx = Math.sin(ang) * 12, ny = -Math.cos(ang) * 12;
    const ex = px - Math.cos(ang) * (16 + flen) + nx, ey = py - Math.sin(ang) * (16 + flen) + ny;
    vectorArrow(ctx, c, ex, ey, { angle: ang, length: flen, col: c.s6, width: 5 });
    this.tag(ctx, c, 'F', ex - 14, ey - 26, c.s6);
  }
}
