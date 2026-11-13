/**
 * MarbleExplainedScene - slide blk-l11-n03 "The marble, explained" (1 beat). A thin subclass of the
 * L08 MarbleRingScene (read only; its release beat is drawn there and overlaid here).
 *   b0 'ring'  the marble runs round inside the ring with its v arrow along the tangent and a short F
 *              arrow, the push of the ring, from the marble towards the centre (moving with it). One
 *              round, then the ring lifts: the F arrow goes, "net force = 0" by the marble, which goes
 *              straight along the tangent with equal-time dots; the tangent line is drawn.
 *              Rest: the straight path, the release point, "net force = 0".
 * The geometry below repeats the L08 constants (that file does not export them).
 * Every frame is a function of the beat and its age only.
 */
import { clamp01, darken, font } from 'simulations/base/kit/SimLook.js';
import { drawForce, drawNet } from '../shared/ForceCast.js';
import { MarbleRingScene } from '../L08/MarbleRingScene.js';

const TAU = Math.PI * 2;
const OX = 210, OY = 262, MR = 15, RP = 120 - MR - 2;
const PERIOD = 2.0, OMEGA = TAU / PERIOD, V = RP * OMEGA;
const TH_R = -Math.PI / 4, LEAD = 0.3, T_REL = LEAD + PERIOD, LIFT = 0.7;
const DIR = { x: Math.cos(TH_R + Math.PI / 2), y: Math.sin(TH_R + Math.PI / 2) };
const PR = { x: OX + RP * Math.cos(TH_R), y: OY + RP * Math.sin(TH_R) };
const LINE = 300, T_LINE = LINE / V, F_LEN = 38;

export class MarbleExplainedScene extends MarbleRingScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'Top view of a smooth table with a tape ring on it. A marble runs round inside the ring at a steady speed; its velocity points along the circle, and the ring pushes it towards the centre, which keeps turning its velocity. When the ring is lifted, no net force acts on the marble: it keeps the velocity it had at that instant and moves off in a straight line along the tangent, with equally spaced dots at equal times.';

  text(ctx, c, lines, x, y, k, align = 'center') {
    ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 800, 26, true); ctx.fillStyle = c.s3ink ?? darken(c.s3, 0.3);
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1) / 2) * 30));
    ctx.restore();
  }

  draw(ctx, c) { super.draw(ctx, c); }

  releaseFrame(ctx, c) {
    super.releaseFrame(ctx, c);
    const a = this.age, tCirc = Math.min(a, T_REL) - LEAD;
    // On the circle: the push of the ring, from the marble towards the centre; its label at the centre,
    // where every one of these arrows points. It goes as the ring starts to lift.
    const kF = clamp01((a - 0.15) / 0.3) * (1 - clamp01((a - T_REL) / 0.15));
    if (kF > 0) {
      const th = TH_R + OMEGA * Math.max(0, tCirc), cx = OX + RP * Math.cos(th), cy = OY + RP * Math.sin(th);
      drawForce(ctx, c, cx - Math.cos(th) * (MR + 1), cy - Math.sin(th) * (MR + 1), { length: F_LEN, angle: th + Math.PI, label: '', alpha: kF, fit: false });
      this.text(ctx, c, ['push of', 'the ring'], OX, OY, kF);
    }
    // Off the ring: no net force, by the marble (left of it, clear of the line and the v chip).
    const kN = clamp01((a - T_REL - 0.35) / 0.35);
    if (kN > 0) {
      const s = Math.min(Math.max(0, a - T_REL), T_LINE) * V, mx = PR.x + DIR.x * s, my = PR.y + DIR.y * s;
      const dx = mx - 62, dy = my + 62;
      drawNet(ctx, c, dx, dy, [{ newtons: 1, dir: 1 }, { newtons: 1, dir: -1 }], { alpha: kN, side: -1, label: '' });
      this.text(ctx, c, ['net force = 0'], dx - 22, dy, kN, 'right');
    }
  }
}
