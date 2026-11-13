/**
 * GripScene - slide blk-l14-n02 "Grip" (2 beats; Fig 6.25 and the Bridging Science and Society box).
 *   b0 'slip'    two stacked lanes, the same walker and the same push. Top "dry floor" (rough): the rear
 *                foot pushes back, friction on the foot points forward ("friction"), she walks on and rests
 *                mid-stride. Bottom "wet polished floor" (tiles under a water sheen, puddle glints): the same
 *                push, but the rear foot SLIDES back (a short streak where it was), the friction arrow is
 *                tiny, and she tips backward with her arms out. The slip is the hero.
 *   b1 'grooves' two close-up cards (side by side; stacked on a phone): a shoe sole on a rough floor, its
 *                zigzag grooves biting into the floor ("grooves"); a tyre on a road with tread blocks
 *                ("treads"). Below, a thin row of three risk tiles, icons only: a wet floor, ice, a wet road.
 * Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, font, rr, ellipse, lerp, hsl, hslOf } from 'simulations/base/kit/SimLook.js';
import { drawFigure, solveFigure, figureLook, walkPhase } from 'simulations/base/kit/SimFigure.js';
import { drawForce } from '../shared/ForceCast.js';
import { drawSurface } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';

/** Dark tyre rubber, as the kit bicycle makes it (from the stroke token's hue). */
const rubber = (c) => hsl(hslOf(c.stroke).h, 0.12, 0.22);
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const LANE = 260, WH = 196, W_DIST = (1 + 0.72) * 0.68 * WH, WX = 392, TW = 0.3, DW = 2.0;
const T_SLIP = TW + DW, D_SLIP = 0.55, SLIDE = 34, FRIC = 92, FRIC_WET = 26;

export class GripScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Beat 1: the same walker on two floors. On a dry floor her rear foot pushes back and friction on the foot points forward, so she walks on. On a wet polished floor the same push makes the foot slide back: the friction is tiny, and she tips backward with her arms out. Beat 2: close-ups of the zigzag grooves on a shoe sole gripping the floor, and the tread blocks on a tyre on the road. Below them, three small pictures of risky surfaces: a wet floor, ice, and a road covered with water.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  busy() { return this.cur === 0 ? this.age < T_SLIP + D_SLIP + 0.6 : this.age < 0.8; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) { this.lane(ctx, c, 0, false); this.divider(ctx, c, LANE); this.lane(ctx, c, LANE, true); }
    else this.cards(ctx, c);
  }

  divider(ctx, c, y) {
    ctx.save(); ctx.strokeStyle = alpha(c.label, 0.18); ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(656, y); ctx.stroke(); ctx.restore();
  }

  text(ctx, c, s, x, y, col = alpha(c.label, 0.78), align = 'left', size = 26) {
    ctx.save(); ctx.font = font(c, 800, size, true); ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }

  // -- b0: two lanes ---------------------------------------------------------------------
  lane(ctx, c, oy, wet) {
    const FY = oy + LANE - 46, a = this.age;
    drawSurface(ctx, c, wet ? 'tiles' : 'rough', 0, 680, FY, { h: 32, seed: wet ? 9 : 4 });
    if (wet) this.sheen(ctx, c, FY);
    this.text(ctx, c, wet ? 'wet polished floor' : 'dry floor', 18, oy + 30);
    const look = figureLook(c, { skin: 3, hairStyle: 'ponytail', hair: 1, top: 's2', bottom: 'navy', shoeStyle: 'sneaker', mood: wet && a > T_SLIP ? 'oops' : 'smile' });
    const u = ease(a, TW, DW), d = W_DIST * u, x = WX - W_DIST + d;
    const walk = { x, y: FY, height: WH, facing: 1, pose: { name: 'walk', phase: walkPhase(d, WH, 'walk') } };
    const s = wet ? ease(a, T_SLIP, D_SLIP) : 0;
    let rear;
    if (s <= 0) {
      const sk = drawFigure(ctx, c, walk, look);
      rear = sk.anchors.foot[0];
    } else {
      // The slip: the rear foot slides back, she tips backward and throws her arms out.
      const end = solveFigure({ ...walk, x: WX, pose: { name: 'walk', phase: 0.72 } }).anchors;
      const r0 = end.foot[0], f0 = end.foot[1], sh = FY - 0.8 * WH;
      rear = { x: r0.x - SLIDE * s, y: FY };
      const hands = [
        { x: lerp(end.hand[0].x, WX - 0.46 * WH, s), y: lerp(end.hand[0].y, sh + 0.0 * WH, s) },
        { x: lerp(end.hand[1].x, WX + 0.4 * WH, s), y: lerp(end.hand[1].y, sh + 0.05 * WH, s) },
      ];
      this.streak(ctx, c, rear.x + 26, r0.x + 34, FY, ease(a, T_SLIP + 0.05, 0.25));
      drawFigure(ctx, c, { x: WX, y: FY, height: WH, facing: 1, autoReach: false,
        pose: { name: 'stand', lean: lerp(3, -12, s), crouch: lerp(0.03, 0.1, s) }, feet: [rear, { x: f0.x, y: FY }], hands }, look);
    }
    // Friction on the rear foot, forward: full on the dry floor, tiny on the wet one.
    const k = ease(a, TW + DW - 0.15, 0.3);
    if (k > 0) {
      const L = (wet ? FRIC_WET : FRIC) * k;
      drawForce(ctx, c, rear.x + 2, FY - 12, { length: L, label: '', alpha: k, fit: false });
      if (!wet) drawTag(ctx, c, 'friction', rear.x - 12, FY - 22, { align: 'right', col: c.s1ink, size: 26, alpha: k, prefer: [[0, 0]] });
    }
  }

  /** A thin water sheen over the tiles, with a few puddle glints (fixed places). */
  sheen(ctx, c, FY) {
    ctx.save();
    ctx.fillStyle = alpha(c.water, 0.22); ctx.fillRect(0, FY, 680, 32);
    ctx.strokeStyle = alpha(lighten(c.water, 0.6), 0.85); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, FY + 2); ctx.lineTo(680, FY + 2); ctx.stroke();
    for (const [px, w] of [[70, 60], [210, 40], [520, 70], [630, 34]]) {
      ellipse(ctx, px, FY + 14, w / 2, 5); ctx.fillStyle = alpha(c.water, 0.35); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px - w * 0.3, FY + 12); ctx.lineTo(px + w * 0.1, FY + 12); ctx.stroke();
    }
    ctx.restore();
  }

  /** Short motion lines behind the sliding shoe (from where it is back to where it started). */
  streak(ctx, c, x0, x1, FY, k) {
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = alpha(c.label, 0.75); ctx.lineCap = 'round';
    [[-4, 3.5, 1], [-11, 2.5, 0.75], [-18, 2, 0.5]].forEach(([dy, w, f]) => {
      ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, FY + dy); ctx.lineTo(x0 + (x1 - x0) * f, FY + dy); ctx.stroke();
    });
    ctx.restore();
  }

  // -- b1: grooves and treads ----------------------------------------------------------------
  cards(ctx, c) {
    const P = this.portrait, k1 = ease(this.age, 0.05, 0.35), k2 = ease(this.age, 0.3, 0.35), k3 = ease(this.age, 0.55, 0.3);
    const A = P ? { x: 16, y: 10, w: 648, h: 184 } : { x: 16, y: 14, w: 318, h: 350 };
    const B = P ? { x: 16, y: 204, w: 648, h: 184 } : { x: 346, y: 14, w: 318, h: 350 };
    this.card(ctx, c, A, k1, (cx) => this.sole(cx, c));
    this.card(ctx, c, B, k2, (cx) => this.tyre(cx, c));
    const ry = P ? 400 : 380, rh = P ? 112 : 124, gap = 14, tw = (648 - 2 * gap) / 3;
    ['wetFloor', 'ice', 'wetRoad'].forEach((kind, i) => this.card(ctx, c, { x: 16 + i * (tw + gap), y: ry, w: tw, h: rh }, k3, (cx) => this.risk(cx, c, kind), 210, 124));
  }

  /** A card fitting a local drawing (lw x lh) centred in rect R. */
  card(ctx, c, R, k, paint, lw = 300, lh = 220) {
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha *= k;
    rr(ctx, R.x, R.y + 3, R.w, R.h, 18); ctx.fillStyle = alpha(darken(c.bgDeep, 0.3), 0.12); ctx.fill();
    rr(ctx, R.x, R.y, R.w, R.h, 18); ctx.fillStyle = c.bgSurface; ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.16); ctx.lineWidth = 2; ctx.stroke();
    rr(ctx, R.x, R.y, R.w, R.h, 18); ctx.clip();
    const s = Math.min((R.w - 16) / lw, (R.h - 12) / lh);
    ctx.translate(R.x + (R.w - lw * s) / 2, R.y + (R.h - lh * s) / 2); ctx.scale(s, s);
    paint(ctx);
    ctx.restore();
  }

  /** A sneaker, side view, toe right, pressed on a rough floor: zigzag grooves bite into the floor grain. */
  sole(ctx, c) {
    const FY = 168, up = c.s2, rim = darken(up, 0.38), mid = mix(c.bgSurface, c.label, 0.07), rub = rubber(c);
    drawSurface(ctx, c, 'rough', 0, 300, FY, { h: 46, seed: 6 });
    ctx.save(); ctx.lineJoin = 'round';
    // Upper: heel counter, collar, tongue, laces sloping to the toe cap.
    ctx.beginPath();
    ctx.moveTo(34, 138); ctx.bezierCurveTo(28, 110, 40, 84, 62, 72); ctx.lineTo(102, 74);
    ctx.bezierCurveTo(118, 70, 132, 58, 146, 56); ctx.bezierCurveTo(196, 74, 240, 96, 262, 116);
    ctx.bezierCurveTo(272, 124, 272, 134, 264, 138); ctx.closePath();
    const g = ctx.createLinearGradient(0, 56, 0, 140); g.addColorStop(0, lighten(up, 0.18)); g.addColorStop(1, darken(up, 0.12));
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = 3; ctx.stroke();
    // Shade along the back of the upper, light along the lace line.
    ctx.save(); ctx.clip(); ctx.fillStyle = alpha(darken(up, 0.3), 0.35); ellipse(ctx, 50, 120, 30, 46); ctx.fill(); ctx.restore();
    ctx.strokeStyle = alpha(lighten(up, 0.55), 0.9); ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const x = 150 + i * 22, y = 64 + i * 10; ctx.beginPath(); ctx.moveTo(x - 6, y + 6); ctx.lineTo(x + 8, y - 2); ctx.stroke(); }
    ctx.strokeStyle = alpha(rim, 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(84, 76); ctx.bezierCurveTo(100, 104, 150, 118, 210, 112); ctx.stroke();
    // Midsole band, then the outsole with its zigzag teeth down into the floor.
    rr(ctx, 30, 134, 240, 16, 8); ctx.fillStyle = mid; ctx.fill(); ctx.strokeStyle = darken(mid, 0.25); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(32, 150);
    for (let x = 32; x < 268; x += 16) { ctx.lineTo(x + 5, FY + 3); ctx.lineTo(x + 11, FY + 3); ctx.lineTo(x + 16, 154); }
    ctx.lineTo(268, 150); ctx.closePath(); ctx.fillStyle = rub; ctx.fill(); ctx.strokeStyle = darken(rub, 0.35); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    drawTag(ctx, c, 'grooves', 150, 196, { col: c.s1ink, size: 26, prefer: [[0, 0]] });
  }

  /** A tyre on a road, side view: tread blocks round the rim, sidewall, metal wheel. */
  tyre(ctx, c) {
    const FY = 176, r = 78, cx = 130, cy = FY - r + 3, rub = rubber(c), metal = mix(c.bgSurface, c.label, 0.35);
    drawSurface(ctx, c, 'rough', 0, 300, FY, { h: 40, seed: 2 });
    ctx.save();
    ellipse(ctx, cx, FY + 2, r * 0.9, 6); ctx.fillStyle = alpha(darken(c.bgDeep, 0.5), 0.3); ctx.fill();
    // Tread blocks stand proud of the carcass, with gaps (grooves) between them.
    for (let i = 0; i < 28; i++) {
      const t = i * Math.PI * 2 / 28;
      ctx.save(); ctx.translate(cx + Math.cos(t) * (r - 5), cy + Math.sin(t) * (r - 5)); ctx.rotate(t);
      rr(ctx, -6, -7.5, 12, 15, 3); ctx.fillStyle = darken(rub, 0.08); ctx.fill(); ctx.strokeStyle = darken(rub, 0.45); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx, cy, r - 9, 0, Math.PI * 2); ctx.fillStyle = rub; ctx.fill(); ctx.strokeStyle = darken(rub, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r - 18, 0, Math.PI * 2); ctx.strokeStyle = alpha(lighten(rub, 0.35), 0.6); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.56, 0, Math.PI * 2); ctx.fillStyle = metal; ctx.fill(); ctx.strokeStyle = darken(metal, 0.35); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = darken(metal, 0.18);
    for (let i = 0; i < 5; i++) { const t = i * Math.PI * 2 / 5 - Math.PI / 2; ellipse(ctx, cx + Math.cos(t) * r * 0.32, cy + Math.sin(t) * r * 0.32, 7, 7); ctx.fill(); }
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.13, 0, Math.PI * 2); ctx.fillStyle = lighten(metal, 0.3); ctx.fill();
    ctx.fillStyle = alpha(lighten(rub, 0.6), 0.45); ellipse(ctx, cx - r * 0.5, cy - r * 0.55, r * 0.22, r * 0.09, -0.75); ctx.fill();
    ctx.restore();
    drawTag(ctx, c, 'treads', 248, 44, { col: c.s1ink, size: 26, prefer: [[0, 0]] });
    // A short leader from the tag to the tread blocks at the upper right.
    ctx.save(); ctx.strokeStyle = alpha(c.s1ink, 0.8); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(236, 64); ctx.lineTo(cx + Math.cos(-0.6) * (r + 6), cy + Math.sin(-0.6) * (r + 6)); ctx.stroke(); ctx.restore();
  }

  /** Risk tile icons (local 210 x 124): a wet tiled floor, ice, a road under water. */
  risk(ctx, c, kind) {
    const FY = 92;
    if (kind === 'ice') {
      drawSurface(ctx, c, 'ice', 8, 202, FY, { h: 28, seed: 3 });
      this.flake(ctx, c, 105, 46, 30);
      return;
    }
    drawSurface(ctx, c, kind === 'wetFloor' ? 'tiles' : 'rough', 8, 202, FY, { h: 28, seed: kind === 'wetFloor' ? 8 : 1 });
    ctx.save();
    ctx.fillStyle = alpha(c.water, 0.4); ellipse(ctx, 105, FY + 9, 70, 8); ctx.fill();
    ctx.strokeStyle = alpha(lighten(c.water, 0.6), 0.9); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(70, FY + 7); ctx.lineTo(110, FY + 7); ctx.stroke();
    if (kind === 'wetRoad') {
      ctx.strokeStyle = alpha(c.gold, 0.9); ctx.lineWidth = 4; ctx.setLineDash([14, 12]);
      ctx.beginPath(); ctx.moveTo(10, FY + 21); ctx.lineTo(200, FY + 21); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = alpha(c.water, 0.85); ctx.lineWidth = 3;
      for (let i = 0; i < 7; i++) { const x = 30 + i * 25, y = 16 + (i % 3) * 16; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 20); ctx.stroke(); }
    } else {
      for (const [x, y, s] of [[70, 34, 1], [108, 22, 1.25], [146, 40, 0.9]]) this.drop(ctx, c, x, y, 13 * s);
    }
    ctx.restore();
  }

  drop(ctx, c, x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.6);
    ctx.bezierCurveTo(x + r * 0.9, y - r * 0.4, x + r, y + r, x, y + r); ctx.bezierCurveTo(x - r, y + r, x - r * 0.9, y - r * 0.4, x, y - r * 1.6);
    ctx.fillStyle = c.water; ctx.fill(); ctx.strokeStyle = darken(c.water, 0.3); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = alpha(lighten(c.water, 0.7), 0.9); ellipse(ctx, x - r * 0.35, y + r * 0.1, r * 0.18, r * 0.32); ctx.fill();
  }

  flake(ctx, c, x, y, r) {
    ctx.save(); ctx.strokeStyle = darken(c.water, 0.15); ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const t = i * Math.PI / 3, ex = x + Math.cos(t) * r, ey = y + Math.sin(t) * r;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
      for (const sg of [-1, 1]) {
        const bx = x + Math.cos(t) * r * 0.6, by = y + Math.sin(t) * r * 0.6, bt = t + sg * 0.75;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(bt) * r * 0.32, by + Math.sin(bt) * r * 0.32); ctx.stroke();
      }
    }
    ctx.restore();
  }
}
