import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, pill, alpha, darken, clamp01, inOutSine, outBack, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawLeverPlank, drawCrate } from 'simulations/base/kit/SimApparatus.js';

// LeverMAScene - blk-l08-s08, Mechanical Advantage of a Lever.
// One lever, level on its fulcrum: load arm 20 cm, effort arm 60 cm.
// The 20 cm arm is laid along the 60 cm arm and fits exactly three times,
// so MA = 60 / 20 = 3; then the effort arrow is drawn and the load arrow
// grows as three effort-lengths: the load is 3 x the effort.

const PX_CM = 7.4;
const LOAD_CM = 20, EFF_CM = 60;
const MA = EFF_CM / LOAD_CM;                 // 3
const FX = 204, FY = 318, TH = 20;
const LOAD_X = FX - LOAD_CM * PX_CM;         // 56
const EFF_X = FX + EFF_CM * PX_CM;           // 648
const GROUND = 400;
const DIM_Y = 432, DIM_LABEL_Y = 474;
const TOP = FY - TH;                         // plank top, 298
const CRATE_H = 72;
const E_LEN = 62;                            // the effort arrow; the load arrow is MA x this
const SEG = LOAD_CM * PX_CM;                 // 148 px, one load arm

// timeline (s)
const T_DIM_L = [0.1, 0.45], T_DIM_E = [0.45, 0.85], T_HOP0 = 0.9, HOP = 0.42;
const T_MA = [T_HOP0 + 3 * HOP, T_HOP0 + 3 * HOP + 0.4];
const T_EFF = [T_MA[1], T_MA[1] + 0.4];
const T_LOAD0 = T_EFF[1] + 0.05, LOAD_SEG = 0.25;
const T_END = T_LOAD0 + MA * LOAD_SEG + 0.1;
const span = (t, [a, b]) => clamp01((t - a) / (b - a));

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
];

export class LeverMAScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A lever resting level on a fulcrum, with a crate on the short end. The load arm is 20 cm and the effort arm is 60 cm. The 20 cm length is laid along the effort arm and fits three times, so the mechanical advantage is 60 divided by 20, which is 3. A short effort arrow pushes down on the long end, and the load arrow on the crate is drawn three effort-lengths long.';

  enter() { this.motionT = 0; }

  pointerDown() { this.motionT = 0; this.animateFor(800); }

  update(d) { this.motionT = Math.min(T_END, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < T_END; }

  draw(ctx, c) {
    const t = this.motionT ?? 0;
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, GROUND);
    drawLeverPlank(ctx, c, { x: FX, y: FY, left: LOAD_CM * PX_CM + 16, right: EFF_CM * PX_CM + 16, thick: TH, groundY: GROUND });
    drawCrate(ctx, c, { x: LOAD_X + 2, y: TOP + 1, w: 86, h: CRATE_H });
    this.marks(ctx, c);
    this.dims(ctx, c, t);
    this.forces(ctx, c, t);
    const u = span(t, T_MA);
    if (u > 0) {
      ctx.save();
      ctx.translate(400, 150);
      const k = outBack(u);
      ctx.scale(k, k);
      pill(ctx, c, `MA = ${EFF_CM} \u00f7 ${LOAD_CM} = ${MA}`, 0, 0, { bg: c.accent, size: 34, display: true });
      ctx.restore();
    }
  }

  // Thin guide lines from the load, the fulcrum and the effort point down to the dimension line.
  marks(ctx, c) {
    ctx.save();
    ctx.strokeStyle = alpha(c.labelMuted, 0.55);
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    for (const x of [LOAD_X, EFF_X]) { ctx.beginPath(); ctx.moveTo(x, FY + 6); ctx.lineTo(x, DIM_Y - 12); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(FX, GROUND + 4); ctx.lineTo(FX, DIM_Y - 12); ctx.stroke();
    ctx.restore();
  }

  dimLine(ctx, col, x0, x1, w = 5) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, DIM_Y); ctx.lineTo(x1, DIM_Y); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const x of [x0, x1]) { ctx.moveTo(x, DIM_Y - 11); ctx.lineTo(x, DIM_Y + 11); }
    ctx.stroke();
    ctx.restore();
  }

  dims(ctx, c, t) {
    const uL = inOutSine(span(t, T_DIM_L)), uE = inOutSine(span(t, T_DIM_E));
    if (uL > 0) this.dimLine(ctx, c.s6, FX - SEG * uL, FX);
    if (uE > 0) this.dimLine(ctx, c.s2, FX, FX + EFF_CM * PX_CM * uE);
    if (uL >= 1) pill(ctx, c, `${LOAD_CM} cm`, (LOAD_X + FX) / 2, DIM_LABEL_Y, { bg: c.s6, size: 26, display: true });
    if (uE >= 1) pill(ctx, c, `${EFF_CM} cm`, (FX + EFF_X) / 2, DIM_LABEL_Y, { bg: c.s2, size: 26, display: true });
    // the 20 cm arm laid along the 60 cm arm, three times: a copy hops over and fades
    // as it lands, leaving a tick on the 60 cm bracket at each third
    for (let i = 0; i < MA; i += 1) {
      const u = clamp01((t - T_HOP0 - i * HOP) / HOP);
      if (u <= 0) break;
      const x0 = FX + i * SEG;
      if (i < MA - 1 && u > 0.85) {
        const tk = clamp01((u - 0.85) / 0.15);
        ctx.save();
        ctx.strokeStyle = alpha(c.s2, tk);
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x0 + SEG, DIM_Y - 9); ctx.lineTo(x0 + SEG, DIM_Y + 9); ctx.stroke();
        ctx.restore();
      }
      if (u >= 1) continue;
      const lift = Math.sin(Math.PI * u) * 30;
      const k = inOutSine(u);
      const from = i === 0 ? LOAD_X : x0 - SEG;
      const sx = from + (x0 - from) * k;
      ctx.save();
      ctx.translate(0, -lift - 14);
      this.dimLine(ctx, alpha(c.s6, 1 - 0.8 * clamp01((u - 0.7) / 0.3)), sx, sx + SEG, 6);
      ctx.restore();
    }
  }

  forces(ctx, c, t) {
    const uE = inOutSine(span(t, T_EFF));
    if (uE > 0) {
      vectorArrow(ctx, c, EFF_X, TOP - 6 - E_LEN, { angle: Math.PI / 2, length: E_LEN * uE, col: c.s2, width: 7, head: 18 });
      if (uE >= 1) pill(ctx, c, 'effort', EFF_X - 70, TOP - 6 - E_LEN / 2, { bg: c.s2, size: 26, display: true });
    }
    const top = TOP - CRATE_H - 6;
    const full = E_LEN * MA;
    const done = clamp01((t - T_LOAD0) / (MA * LOAD_SEG));
    if (done > 0) {
      const len = full * inOutSine(done);
      vectorArrow(ctx, c, LOAD_X, top - full, { angle: Math.PI / 2, length: len, col: c.s6, width: 9, head: 20 });
      // the effort-lengths it is made of
      ctx.save();
      ctx.strokeStyle = darken(c.s6, 0.35);
      ctx.lineWidth = 3;
      for (let i = 1; i < MA; i += 1) {
        const y = top - full + i * E_LEN;
        if (y > top - full + len) break;
        ctx.beginPath(); ctx.moveTo(LOAD_X - 13, y); ctx.lineTo(LOAD_X + 13, y); ctx.stroke();
      }
      ctx.restore();
      if (done >= 1) pill(ctx, c, 'load', LOAD_X + 64, top - full / 2, { bg: c.s6, size: 26, display: true });
    }
  }
}
