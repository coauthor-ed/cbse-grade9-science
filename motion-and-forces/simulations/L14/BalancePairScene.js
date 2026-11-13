/**
 * BalancePairScene - predict blk-l15-s2 "Two spring balances" (setup) and explain blk-l15-s3
 * "Newton's third law" (2 beats; Fig 6.26).
 * Side view on a table top: two identical spring balances lie flat, hooked together in a line. Balance A
 * (left, rim series-1) has its ring on a hook in a wall block; balance B (right, rim series-2) has its ring
 * held by your fist, which pulls right.
 *   setup  hooked, the hand holding, the pull about to begin; each scale window covered by a "?" card. No arrows.
 *   b0 'equal'  the hand pulls: the reading goes 2 N, 6 N, 4 N (0.8 s each, eased); both pointers follow
 *               together (both springs stretch the same) and the hand moves out by both stretches. Two F
 *               arrows at the joined hooks, one per balance, equal and following the reading: "B pulls A"
 *               (tail on A's hook, right, above the axis) and "A pulls B" (tail on B's hook, left, below).
 *               A reading chip beside each window. Rest: 4 N, 4 N.
 *   b1 'law'    same picture at 4 N; the balances lit in their tones, wall, table and hand dimmed; arrow tags
 *               "on A", "on B" and an "equal and opposite" chip above the joint.
 * Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, rr } from 'simulations/base/kit/SimLook.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawDesk } from 'simulations/base/kit/SimProps.js';
import { drawForce, drawSpringBalance } from '../shared/ForceCast.js';
import { drawTag } from '../shared/MotionGraph.js';

const SETUP = 9;
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const LEN = 170, BW = 96, ROD = 8, MAX = 10, SPAN = LEN - 64;      // balance: length, body width, hook rod, scale span
const AY = 355, WALL_X = 46, RING_A = WALL_X + 18, HOOK_GAP = 16;    // axis height, wall face, A's ring, hook overlap
const PX_PER_N = 16;                                                 // one force scale
const T0 = 0.3, STEP = 0.8, R_END = 4;

/** The reading at age a in b0: 0 -> 2 -> 6 -> 4 N, each step eased over 0.8 s. */
function readingAt(a) {
  const pts = [0, 2, 6, 4];
  for (let i = 0; i < 3; i++) {
    const t = T0 + i * STEP;
    if (a < t + STEP) return pts[i] + (pts[i + 1] - pts[i]) * ease(a, t, STEP);
  }
  return R_END;
}

export class BalancePairScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: SETUP, dwellMs: null }]] };
  static ARIA_LABEL = 'Two identical spring balances lie flat on a table, hooked together. The left balance, A, is hooked to a wall. Your hand pulls the right balance, B. As you pull harder or more gently, the reading goes 2 newtons, 6 newtons, then 4 newtons, and both balances always show the same reading. Two equal arrows at the joined hooks: B pulls A to the right, and A pulls B to the left. The two forces act on two different balances.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === SETUP || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.isSetup() ? this.age < 0.5 : this.age < (this.cur === 0 ? T0 + 3 * STEP + 0.4 : 1.0); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const setup = this.isSetup(), law = !setup && this.cur >= 1, a = this.age;
    const rd = setup ? 0 : law ? R_END : readingAt(a);
    const dim = law ? 1 - 0.62 * ease(a, 0.2, 0.5) : 1;
    const s = clamp01(rd / MAX) * SPAN;
    // A: ring on the wall hook, axis to the right. B: hook meets A's hook, ring to the right in your fist.
    const hookA = RING_A + 26 + LEN + ROD + s + 12;
    const hookB = hookA + HOOK_GAP, ringB = hookB + 26 + LEN + ROD + s + 12;

    ctx.save(); ctx.globalAlpha = dim;
    const desk = drawDesk(ctx, c, { x0: -24, x1: 704, y: 540, forHeight: 400, build: 'adult', view: 'front' });
    this.wall(ctx, c, desk.top);
    ctx.restore();

    const sbA = drawSpringBalance(ctx, c, { x: RING_A, y: AY, angle: 0, reading: rd, max: MAX, every: 5, minor: 1, len: LEN, w: BW, rod: ROD, showUnit: false });
    const sbB = drawSpringBalance(ctx, c, { x: ringB, y: AY, angle: Math.PI, reading: rd, max: MAX, every: 5, minor: 1, len: LEN, w: BW, rod: ROD, showUnit: false });
    const lit = law ? ease(a, 0.2, 0.5) : 0;
    this.rim(ctx, c, RING_A + 26, 1, c.s1, lit);
    this.rim(ctx, c, ringB - 26, -1, c.s2, lit);

    ctx.save(); ctx.globalAlpha = dim; this.fist(ctx, c, ringB + 4, AY); ctx.restore();

    // Body centres (along the axis) for tags.
    const midA = RING_A + 26 + LEN / 2, midB = ringB - 26 - LEN / 2, top = AY - BW / 2, bot = AY + BW / 2;
    drawTag(ctx, c, 'A', RING_A + 50, top - 30, { size: 26, col: c.s1ink, prefer: [[0, 0]] });
    drawTag(ctx, c, 'B', ringB - 50, top - 30, { size: 26, col: c.s2ink, prefer: [[0, 0]] });

    if (setup) {
      this.cover(ctx, c, midA, AY); this.cover(ctx, c, midB, AY);
      return;
    }
    // Reading chips, below each body; equal at every instant.
    const txt = `${Math.round(rd)} N`;
    drawTag(ctx, c, txt, midA, bot + 30, { size: 28, col: c.s1ink, prefer: [[0, 0]] });
    drawTag(ctx, c, txt, midB, bot + 30, { size: 28, col: c.s2ink, prefer: [[0, 0]] });

    // The pair at the joined hooks: on A (tail on A's hook, right, above), on B (tail on B's hook, left, below).
    const k = clamp01((a - T0) / 0.3), L = Math.max(rd * PX_PER_N, 0.01), yA = AY - 30, yB = AY + 30;
    const fk = law ? 1 : k;
    if (fk > 0) {
      drawForce(ctx, c, hookA - 2, yA, { length: L, angle: 0, label: '', alpha: fk, fit: false });
      drawForce(ctx, c, hookB + 2, yB, { length: L, angle: Math.PI, label: '', alpha: fk, fit: false });
      const jx = (hookA + hookB) / 2;
      drawTag(ctx, c, law ? 'on A' : 'B pulls A', jx + 8, top - 74, { size: 26, col: c.s1ink, alpha: fk, prefer: [[0, 0]] });
      drawTag(ctx, c, law ? 'on B' : 'A pulls B', jx - 8, bot + 84, { size: 26, col: c.s2ink, alpha: fk, prefer: [[0, 0]] });
      if (law) {
        const ek = ease(a, 0.6, 0.4);
        drawTag(ctx, c, 'equal and opposite', jx, top - 136, { size: 26, col: c.accent, alpha: ek, prefer: [[0, 0]] });
      }
      // Leader ticks from the tags to their arrows.
      ctx.save(); ctx.globalAlpha = fk * 0.6; ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(jx + 8, top - 56); ctx.lineTo(hookA + L * 0.4, yA - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(jx - 8, bot + 66); ctx.lineTo(hookB - L * 0.4, yB + 8); ctx.stroke();
      ctx.restore();
    }
  }

  /** The wall block at the left, standing on the table, with a screw hook that holds A's ring. */
  wall(ctx, c, tableTop) {
    const plaster = mix(c.bgSurface, c.label, 0.16), y0 = 150, h = tableTop - y0;
    ctx.save();
    rr(ctx, -12, y0, WALL_X + 12, h, 6); ctx.fillStyle = plaster; ctx.fill();
    ctx.save(); rr(ctx, -12, y0, WALL_X + 12, h, 6); ctx.clip();
    ctx.fillStyle = darken(plaster, 0.12); ctx.fillRect(WALL_X - 14, y0, 14, h);              // shade side
    ctx.fillStyle = alpha(lighten(plaster, 0.5), 0.6); ctx.fillRect(0, y0, 5, h);             // light side
    ctx.strokeStyle = alpha(darken(plaster, 0.3), 0.5); ctx.lineWidth = 1.5;                   // brick courses
    for (let y = y0 + 22, i = 0; y < tableTop; y += 22, i++) {
      ctx.beginPath(); ctx.moveTo(-12, y); ctx.lineTo(WALL_X, y); ctx.stroke();
      const bx = i % 2 ? 10 : 26; ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx, y + 22); ctx.stroke();
    }
    ctx.restore();
    rr(ctx, -12, y0, WALL_X + 12, h, 6); ctx.strokeStyle = darken(plaster, 0.42); ctx.lineWidth = 2.5; ctx.stroke();
    // screw hook: a plate and a curled rod into the ring
    const metal = mix(c.bgSurface, c.label, 0.45);
    rr(ctx, WALL_X - 4, AY - 16, 10, 32, 3); ctx.fillStyle = metal; ctx.fill(); ctx.strokeStyle = darken(metal, 0.35); ctx.lineWidth = 2; ctx.stroke();
    ctx.lineCap = 'round';
    for (const [col, w] of [[darken(metal, 0.35), 7], [metal, 4]]) {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(WALL_X + 4, AY); ctx.lineTo(RING_A + 4, AY); ctx.arc(RING_A + 4, AY - 8, 8, Math.PI / 2, -Math.PI / 2, true); ctx.stroke();
    }
    ctx.restore();
  }

  /** A tone rim round a balance body (from the body start along dir), lit in b1 with a soft halo. */
  rim(ctx, c, x0, dir, col, lit) {
    const x = dir > 0 ? x0 : x0 - LEN, y = AY - BW / 2;
    ctx.save();
    if (lit > 0) { rr(ctx, x - 8, y - 8, LEN + 16, BW + 16, 22); ctx.fillStyle = alpha(col, 0.18 * lit); ctx.fill(); }
    rr(ctx, x - 3, y - 3, LEN + 6, BW + 6, 16); ctx.strokeStyle = col; ctx.lineWidth = 4 + 2 * lit; ctx.stroke();
    ctx.restore();
  }

  /** A paper card with "?" over the scale window: the reading stays hidden before the prediction. */
  cover(ctx, c, x, y) {
    const w = LEN - 22, h = BW - 12, paper = mix(c.bgSurface, c.gold, 0.12);
    ctx.save();
    rr(ctx, x - w / 2, y - h / 2, w, h, 10); ctx.fillStyle = paper; ctx.fill();
    ctx.fillStyle = darken(paper, 0.08); ctx.fillRect(x - w / 2 + 6, y + h / 2 - 12, w - 12, 6);
    rr(ctx, x - w / 2, y - h / 2, w, h, 10); ctx.strokeStyle = darken(paper, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
    drawTag(ctx, c, '?', x, y, { size: 32, prefer: [[0, 0]] });
  }

  /** Your fist round B's ring, the sleeve running off to the right. */
  fist(ctx, c, x, y) {
    const skin = figureLook(c, { skin: 2 }).skin, sleeve = c.s4;
    ctx.save();
    rr(ctx, x + 40, y - 30, 300, 60, 18); ctx.fillStyle = sleeve; ctx.fill(); ctx.strokeStyle = darken(sleeve, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = alpha(lighten(sleeve, 0.45), 0.6); ctx.fillRect(x + 50, y - 24, 240, 4);
    ctx.fillStyle = darken(sleeve, 0.14); ctx.fillRect(x + 50, y + 14, 240, 10);
    const body = () => rr(ctx, x - 6, y - 26, 56, 52, 20);
    body(); ctx.fillStyle = skin; ctx.fill();
    ctx.save(); body(); ctx.clip(); ctx.fillStyle = darken(skin, 0.13); ctx.fillRect(x - 10, y + 8, 80, 40); ctx.restore();
    body(); ctx.strokeStyle = darken(skin, 0.4); ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = alpha(darken(skin, 0.4), 0.6); ctx.lineWidth = 1.8;
    for (const dy of [-10, 2, 14]) { ctx.beginPath(); ctx.moveTo(x - 4, y + dy); ctx.lineTo(x + 12, y + dy); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(x + 22, y - 24, 16, 8, -0.2, 0, Math.PI * 2); ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = darken(skin, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
}
