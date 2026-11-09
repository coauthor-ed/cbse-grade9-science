// SlinkyScene.js - slide "A Slinky Model" (blk-l03-s04, 3 beats). Rebuilt 2026-11-03 (book Fig 10.8).
// A SimWave slinky on the floor: your hand at the left end, a friend's hand holding the right end
// still. Every turn sits at its rest place plus the computed field s(d, t) = f(t - d / v); the
// field is eased to zero over the last turns so the friend's end really stays still.
// b0 one push-pull pulse every 3.2 s; b1 push and pull again and again (sine); b2 the same with
// everything but the red turn dimmed, its range bracket and dashed mean line under it.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, pill, chipSize } from 'simulations/base/kit/SimLook.js';
import { sineSource, pulseSource, waveField, drawSlinky, swingAmp } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';

const FLOOR = 470;
const SL = { x1: 112, x2: 572, y: 366, ry: 84, spacing: 14, wire: 4 };
const N = Math.floor((SL.x2 - SL.x1) / SL.spacing);
const LEN = N * SL.spacing;
const MARK = Math.round(N / 4);                   // the red turn, a quarter along from your end
const HELD = 3 * SL.spacing;                      // drawSlinky fixedEnd 'right' stills the last 3 turns
const PULSE = waveField({ v: 200, origin: SL.x1, source: pulseSource({ amp: 24, dur: 0.5, at: 0.2 }) });
const SINE = waveField({ v: 150, origin: SL.x1, source: sineSource({ amp: swingAmp(250), freq: 0.6 }) });   // wavelength 250 px
const P0 = 3.2, OFF0 = 0.9;                       // b0 loop: the pulse has left before the next push
const T_FILL = 30;                                // b1, b2: the slinky is already full of waves
const WORDS = { C: 'close together', R: 'spread out' };
const TAG = 30;                                   // tag font size (design px)


export class SlinkyScene extends SimScene {
  static CONTINUOUS = true; // the hand keeps pushing and pulling while the beat is on screen
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A slinky lies on the floor. Your hand holds the left end and a friend holds the right end still. '
    + 'One turn near your end is red. A sharp push and pull sends a region of turns closer together, followed by turns '
    + 'spread out, along the slinky. Pushing and pulling again and again sends these regions one after another. '
    + 'The red turn only moves a little to and fro about its own place, shown by a bracket and a dashed line.';

  constructor(container, config) {
    super(container, config);
    this.waveProbe = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, FLOOR);
    const st = Math.max(0, Math.min(2, this.stage));
    const t = st === 0 ? (this.t() + OFF0) % P0 : this.t() + T_FILL;
    const F = st === 0 ? PULSE : SINE;
    let sl;
    if (st < 2) sl = drawSlinky(ctx, c, { ...SL, field: F, t, mark: MARK, fixedEnd: 'right' });
    else sl = this.focusRed(ctx, c, F, t);
    this.people(ctx, c, sl.hands);
    const meanX = SL.x1 + MARK * SL.spacing;
    const regs = F.regions(t, 0, LEN - HELD, { th: 0.06 }).filter((g) => g.x > SL.x1 + 40 && g.x < SL.x2 - HELD);
    this.tags(ctx, c, regs, st === 2 ? meanX : null, st === 2 ? 0.75 : 1);
    this.waveProbe = { t, red: sl.marked && { x: +sl.marked.x.toFixed(1), mean: meanX }, regions: regs.map((g) => ({ kind: g.kind, x: +g.x.toFixed(1) })) };
  }

  /** b2: the slinky dimmed, the red turn's wire at full strength with the kit's mean line + range bracket. */
  focusRed(ctx, c, F, t) {
    const o = { ...SL, field: F, t, mark: MARK, fixedEnd: 'right' };
    ctx.save(); ctx.globalAlpha *= 0.42;
    drawSlinky(ctx, c, o);
    ctx.restore();
    const xr = F.xAt(MARK * SL.spacing, t);
    // Full strength only in: the red turn's own box, the kit's dashed mean line and its range bracket under the coil.
    const mean = SL.x1 + MARK * SL.spacing, amp = F.ampAt(MARK * SL.spacing) + 10;
    ctx.save(); ctx.beginPath();
    ctx.rect(xr - SL.spacing * 1.1, SL.y - SL.ry - 12, SL.spacing * 2.2, SL.ry * 2 + 24);
    ctx.rect(mean - 3, SL.y - SL.ry - 12, 6, SL.ry * 2 + 50);
    ctx.rect(mean - amp, SL.y + SL.ry + 4, amp * 2, 30);
    ctx.clip();
    const sl = drawSlinky(ctx, c, { ...o, markBracket: true });
    ctx.restore();
    return sl;
  }

  /** C words above the coil, R words below it, each on its computed region; none over the red range. */
  tags(ctx, c, regs, avoidX, a) {
    const last = { C: -1e9, R: -1e9 };
    for (const g of regs) {
      const s = WORDS[g.kind], sz = chipSize(ctx, c, s, TAG, true);
      if (avoidX != null && g.kind === 'R' && Math.abs(g.x - avoidX) < sz.w / 2 + 40) continue;
      const lo = SL.x1 + 30 + sz.w / 2, hi = SL.x2 - 34 - sz.w / 2;   // between the two heads, never on a figure
      if (g.x < lo - 34 || g.x > hi + 34) continue;           // its region is under a head: no tag this moment
      const x = Math.max(lo, Math.min(hi, g.x));
      if (x - last[g.kind] < sz.w + 12) continue;
      const y = g.kind === 'C' ? SL.y - SL.ry - 32 : SL.y + SL.ry + 44;
      pill(ctx, c, s, x, y, { bg: g.kind === 'C' ? c.s5 : c.s2, size: TAG, display: true, alpha: a });
      last[g.kind] = x;
    }
  }

  /** You (left, holding the end that moves) and a friend (right, holding the far end still). */
  people(ctx, c, hands) {
    const [l, r] = hands;
    const you = figureFor(this, { role: 'student', i: 0, x: 42, y: FLOOR, height: 380, facing: 1,
      autoReach: false, pose: { name: 'push', lean: 24, crouch: 0.8 }, hands: [{ x: l.x - 4, y: l.y + 4 }, { x: l.x - 10, y: l.y + 16 }] });
    drawFigure(ctx, c, you, you.look);
    const friend = figureFor(this, { role: 'student', i: 1, x: 640, y: FLOOR, height: 380, facing: -1,
      pose: { name: 'stand', crouch: 0.75 }, hands: [{ x: r.x + 4, y: r.y + 4 }, { x: r.x + 10, y: r.y + 16 }] });
    drawFigure(ctx, c, friend, friend.look);
  }
}
