/**
 * PostmenScene - slide "The two postmen" (blk-l03-n02, 2 beats; Example 4.1, Ganitakaumudi).
 * b0: a straight country road 210 yojanas long (gravel, a few trees). Postman A stands at the
 *     left end, postman B at the right end, facing each other, each with a satchel. A bracket
 *     under the road reads "210 yojanas"; velocity arrows give their speeds, 9 and 5 yojanas/day.
 * b1: a day counter runs 0 to 15 (about 3 s on screen). A is at 9 d, B at 210 - 5 d (yojanas,
 *     d in days, positions on the road's own scale), so the gap between them, shown live,
 *     shrinks by 14 each day; they meet on day 15 at 135 from the left. At rest the spans
 *     under the road read 135 yojanas and 75 yojanas.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, font, alpha, darken, lighten, rr, ellipse, pill, drawShadow } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawFigure, figureLook, walkPhase } from 'simulations/base/kit/SimFigure.js';
import { drawSurface } from '../shared/MotionCast.js';

const GO = 0.6, PLAY = 3.2, DAYS = 15;
const ROAD_TOP = 344, GROUND = ROAD_TOP + 16, FIG_H = 180;
const SPAN_Y = 432;
const V_PX = 13;                            // arrow px per yojana/day
const LOOK_A = { skin: 2, hairStyle: 'short', hair: 0, outfit: 'shirt', top: 's4', moustache: true };
const LOOK_B = { skin: 1, hairStyle: 'sidepart', hair: 2, outfit: 'kurta', top: 's2' };

export class PostmenScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two postmen at the two ends of a straight country road 210 yojanas long, facing each other. One walks 9 yojanas a day, the other 5. A day counter runs to 15 while they walk towards each other; the gap closes by 14 yojanas each day, and they meet after 15 days, 135 yojanas from the first end and 75 from the other.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  busy() { return this.cur === 1 && this.age < GO + PLAY + 0.3; }

  spec() { return trackSpec({ from: 0, to: 210, x0: 70, x1: 610, y: GROUND }); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const d = this.cur === 0 ? 0 : clamp01((this.age - GO) / PLAY) * DAYS;
    const spec = this.spec(), a = 9 * d, b = 210 - 5 * d;
    this.scenery(ctx, c);
    this.road(ctx, c);
    const xa = spec.toPx(a) - (this.cur === 1 ? 36 * clamp01(d / 2) : 0), xb = spec.toPx(b) + (this.cur === 1 ? 36 * clamp01(d / 2) : 0);
    const moving = this.cur === 1 && d > 0 && d < DAYS;
    this.postman(ctx, c, xa, 1, a, moving, LOOK_A);
    this.postman(ctx, c, xb, -1, 210 - b, moving, LOOK_B);
    // Speeds as velocity arrows above the heads; they fade as the two close in, so the meeting stays clear.
    const k = this.cur === 0 ? 1 : clamp01((b - a - 118) / 22);
    if (k > 0) {
      ctx.save(); ctx.globalAlpha *= k;
      const ay = GROUND - FIG_H - 34;
      drawMotionArrow(ctx, c, 'v', xa + 14, ay, { length: 9 * V_PX, label: '9 yojanas/day' });
      drawMotionArrow(ctx, c, 'v', xb - 14, ay, { length: 5 * V_PX, angle: Math.PI, label: '5 yojanas/day', side: -1 });
      ctx.restore();
    }
    this.spans(ctx, c, spec, a, b, d);
    if (this.cur === 1) pill(ctx, c, 'day ' + Math.floor(d + 1e-6), 340, 62, { size: 40, bg: c.raised, display: true });
  }

  /** Spans under the road: walked by A (left), the gap still between them, walked by B (right). */
  spans(ctx, c, spec, a, b, d) {
    const xa = spec.toPx(a), xb = spec.toPx(b), x0 = spec.toPx(0), x1 = spec.toPx(210);
    if (this.cur === 0) { this.bracket(ctx, c, x0, x1, '210 yojanas', c.label); return; }
    if (a > 0.5) this.bracket(ctx, c, x0, xa, this.fit(ctx, c, Math.round(a), xa - x0), c.s1ink);
    if (b - a > 0.5) this.bracket(ctx, c, xa, xb, this.fit(ctx, c, Math.round(b - a), xb - xa), c.labelMuted);
    if (210 - b > 0.5) this.bracket(ctx, c, xb, x1, this.fit(ctx, c, Math.round(210 - b), x1 - xb), c.s6ink);
  }

  fit(ctx, c, n, w) {
    ctx.save(); ctx.font = font(c, 800, 26, true);
    const long = n + ' yojanas', t = ctx.measureText(long).width + 12 < w ? long : ctx.measureText(String(n)).width + 8 < w ? String(n) : '';
    ctx.restore();
    return t;
  }

  bracket(ctx, c, xL, xR, text, col) {
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(xL + 2, SPAN_Y - 12); ctx.lineTo(xL + 2, SPAN_Y); ctx.lineTo(xR - 2, SPAN_Y); ctx.lineTo(xR - 2, SPAN_Y - 12); ctx.stroke();
    if (text) {
      ctx.font = font(c, 800, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = alpha(c.bgDeep, 0.9); ctx.strokeText(text, (xL + xR) / 2, SPAN_Y + 26);
      ctx.fillStyle = col; ctx.fillText(text, (xL + xR) / 2, SPAN_Y + 26);
    }
    ctx.restore();
  }

  /** The country road: one gravel strip spanning the frame, a grass verge behind it. */
  road(ctx, c) {
    ctx.save();
    rr(ctx, 14, ROAD_TOP - 10, 652, 16, 6); ctx.fillStyle = darken(c.good, 0.08); ctx.fill();
    ctx.restore();
    drawSurface(ctx, c, 'rough', 20, 660, ROAD_TOP, { h: 38, seed: 7 });
  }

  /** A few roadside trees behind the road (fixed places, no randomness). */
  scenery(ctx, c) {
    for (const [x, h, s] of [[140, 104, 1], [252, 78, -1], [494, 96, 1], [586, 70, -1], [36, 70, 1]]) this.tree(ctx, c, x, ROAD_TOP - 4, h, s);
  }

  tree(ctx, c, x, y, h, flip) {
    const leaf = c.good, trunk = darken(c.waste, 0.15), r = h * 0.34;
    ctx.save();
    drawShadow(ctx, c, x, y, r * 0.9, 5, 0.6);
    // trunk: lit left side, shaded right, darker rim
    rr(ctx, x - 6, y - h * 0.5, 12, h * 0.5, 4); ctx.fillStyle = trunk; ctx.fill();
    ctx.fillStyle = darken(trunk, 0.25); ctx.fillRect(x + 1, y - h * 0.5 + 2, 4, h * 0.5 - 4);
    rr(ctx, x - 6, y - h * 0.5, 12, h * 0.5, 4); ctx.strokeStyle = darken(trunk, 0.45); ctx.lineWidth = 2; ctx.stroke();
    // canopy: three lobes, shade underneath, a lit cap, an inner line and a rim
    const cy = y - h * 0.62, lobes = [[x - r * 0.62 * flip, cy + r * 0.2, r * 0.72], [x + r * 0.6 * flip, cy + r * 0.25, r * 0.66], [x, cy - r * 0.35, r * 0.82]];
    ctx.beginPath(); for (const [lx, ly, lr] of lobes) { ctx.moveTo(lx + lr, ly); ctx.arc(lx, ly, lr, 0, Math.PI * 2); }
    ctx.fillStyle = darken(leaf, 0.42); ctx.lineWidth = 5; ctx.strokeStyle = darken(leaf, 0.42); ctx.stroke(); ctx.fill();
    ctx.beginPath(); for (const [lx, ly, lr] of lobes) { ctx.moveTo(lx + lr, ly); ctx.arc(lx, ly, lr, 0, Math.PI * 2); }
    ctx.fillStyle = leaf; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = darken(leaf, 0.2); ellipse(ctx, x + r * 0.3, cy + r * 0.75, r * 1.4, r * 0.6); ctx.fill();
    ctx.fillStyle = alpha(lighten(leaf, 0.45), 0.8); ellipse(ctx, x - r * 0.35, cy - r * 0.6, r * 0.5, r * 0.3); ctx.fill();
    ctx.strokeStyle = alpha(darken(leaf, 0.3), 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + r * 0.1, cy + r * 0.3, r * 0.5, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  /** A postman: SimFigure walking (phase from the distance walked) with a satchel on his near hip. */
  postman(ctx, c, x, facing, dist, moving, look) {
    const pose = moving ? { name: 'walk', phase: walkPhase(dist * 2.57, FIG_H) } : 'stand';
    drawFigure(ctx, c, { x, y: GROUND, height: FIG_H, facing, pose }, figureLook(c, look), {
      between: (g, sk) => this.satchel(g, c, sk, facing),
    });
  }

  satchel(ctx, c, sk, facing) {
    const A = sk.anchors, hip = A.hip, sh = A.shoulder, s = FIG_H / 150;
    const bag = darken(c.waste, 0.05), bx = hip.x - facing * 10 * s, by = hip.y + 2 * s, w = 34 * s, h = 26 * s;
    ctx.save();
    // strap from the shoulder to the bag
    ctx.strokeStyle = darken(bag, 0.35); ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sh.x + facing * 6 * s, sh.y - 2 * s); ctx.lineTo(bx + facing * 8 * s, by - h * 0.4); ctx.stroke();
    rr(ctx, bx - w / 2, by - h / 2, w, h, 6 * s); ctx.fillStyle = bag; ctx.fill();
    ctx.fillStyle = darken(bag, 0.22); ctx.fillRect(bx - w / 2 + 2, by + h * 0.12, w - 4, h * 0.36);
    rr(ctx, bx - w / 2, by - h / 2, w, h * 0.46, 6 * s); ctx.fillStyle = lighten(bag, 0.18); ctx.fill();    // flap
    ctx.strokeStyle = darken(bag, 0.45); ctx.lineWidth = 2; rr(ctx, bx - w / 2, by - h / 2, w, h, 6 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx - w / 2 + 3, by - h / 2 + h * 0.46); ctx.lineTo(bx + w / 2 - 3, by - h / 2 + h * 0.46); ctx.stroke();
    // a letter peeping out
    ctx.fillStyle = c.raised; ctx.fillRect(bx - w * 0.2, by - h / 2 - 5 * s, w * 0.38, 6 * s);
    ctx.strokeStyle = darken(c.raised, 0.3); ctx.lineWidth = 1.5; ctx.strokeRect(bx - w * 0.2, by - h / 2 - 5 * s, w * 0.38, 6 * s);
    ctx.restore();
  }
}
