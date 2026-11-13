/**
 * CanoeScene - slide blk-l15-s5 "Rowing a canoe" (2 beats; Fig 6.28).
 * Side view: open water across the full width (a calm surface line, light ripples). The canoeist (she)
 * paddles RIGHT; the canoe stays near the middle and the ripples slide back (the canoe moves right).
 * A stroke: the blade dips in at the catch (forward), sweeps back through the water, lifts clear at the hip,
 * swings forward in the air and dips again. Only while it pushes in the water: a soft eddy of water is pushed
 * back behind the blade and two equal F arrows sit at the blade: "paddle pushes the water" (LEFT, below) and
 * "water pushes the paddle" (RIGHT, above). The canoe gains speed during each push (v arrow above, kind 'v').
 *   b0 'stroke'  one full gentle stroke, then a second that stops at mid-push: rest there with the pair and v.
 *   b1 'harder'  the same with harder strokes: both arrows 1.6x (same scale), a bigger eddy, v grows more. Rest:
 *                the hero pair at the blade plus a faint strip at the bottom right: "gentle stroke" / "harder stroke".
 * Speed and ripple shift come from the beat's own stroke plan integrated from age 0, so a cold start, a
 * resume or Previous lands on the same frame. Frames depend on beat and age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawForce } from '../shared/ForceCast.js';
import { LOOKS } from '../shared/MotionCast.js';
import { drawCanoe } from 'simulations/base/kit/SimVehicles.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawTag } from '../shared/MotionGraph.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const lerp = (p, q, t) => p + (q - p) * t;
const WY = 228, CX = 312, CL = 420;                  // water line, canoe centre, canoe length
const T0 = 0.4, PUSH = 0.8, REC = 0.7, CYCLE = PUSH + REC, HOLD = 0.4;   // dip, push in the water, recovery in the air; the last push stops at mid-stroke
const PAIR = 80, HARD = 1.6;                          // gentle pair length (px); harder = 1.6x on the same scale
const V0 = 30, DV = 22, VPX = 1.5;                    // speed (px/s of ripple shift), gain per gentle push, v arrow px per unit
// The paddle (canoe frame, as the kit draws it): the top hand at PIV, shaft angle th from the vertical (+ = blade forward).
const PIV = { x: CX + 0.07 * CL, y: WY - 0.21 * CL }, PLEN = 0.42 * CL, BLADE = PLEN - 0.08 * CL;
const TH_CATCH = 0.55, TH_FIN = -0.4, TH_MID = 0.075, TH_OUT = -1.05, TH_FWD = 1.0;
const LIFT = 0.08 * CL, LIFT2 = 0.04 * CL;            // hands lift the blade clear; a little more while the shaft passes upright
const PLANS = [
  { strokes: [{ t: T0, k: 1 }, { t: T0 + CYCLE, k: 1 }], v0: V0 },
  { strokes: [{ t: T0, k: HARD }, { t: T0 + CYCLE, k: HARD }], v0: V0 + DV },
];

/** The air path from the finish back to the catch, q 0..1: the blade comes out at the hip, swings forward
 *  clear of the water (the shaft leans out towards us, so it looks shorter: fs), then dips in at the catch. */
function recover(q) {
  if (q < 0.25) { const e = inOutSine(q / 0.25); return { th: lerp(TH_FIN, TH_OUT, e), lift: LIFT * e, fs: 1 }; }
  if (q < 0.75) { const v = (q - 0.25) / 0.5, s = Math.sin(Math.PI * v); return { th: lerp(TH_OUT, TH_FWD, inOutSine(v)), lift: LIFT + LIFT2 * s, fs: 1 - 0.32 * s }; }
  const e = inOutSine((q - 0.75) / 0.25);
  return { th: lerp(TH_FWD, TH_CATCH, e), lift: LIFT * (1 - e), fs: 1 };
}

/** Paddle state at age a: { th, lift, fs, show (pair alpha: only while the blade pushes in the water), k (effort), rest }. */
function paddleAt(plan, a) {
  const S = plan.strokes, last = S[S.length - 1];
  if (a < S[0].t) return { ...recover(0.75 + 0.25 * clamp01(a / S[0].t)), show: 0, k: S[0].k };
  for (const s of S) {
    const r = a - s.t;
    if (s === last) {
      return { th: lerp(TH_CATCH, TH_MID, inOutSine(clamp01(r / HOLD))), lift: 0, fs: 1, show: clamp01(r / 0.12), k: s.k, rest: r >= HOLD };
    }
    if (r < PUSH) { const u = r / PUSH; return { th: lerp(TH_CATCH, TH_FIN, inOutSine(u)), lift: 0, fs: 1, show: clamp01(u / 0.15) * clamp01((1 - u) / 0.12), k: s.k }; }
    if (r < CYCLE) return { ...recover((r - PUSH) / REC), show: 0, k: s.k };
  }
  return { th: TH_MID, lift: 0, fs: 1, show: 1, k: last.k, rest: true };
}

/** World points of the paddle for a state: grip end, top hand, lower hand, blade centre, tip; u along the shaft. */
function paddleGeom(st) {
  const ux = Math.sin(st.th), uy = Math.cos(st.th), p = { x: PIV.x, y: PIV.y - st.lift };
  const at = (d) => ({ x: p.x + ux * d * st.fs, y: p.y + uy * d * st.fs });
  return { pivot: p, lower: at(0.12 * CL), blade: at(BLADE), tip: at(PLEN), grip: at(-0.03 * CL), ux, uy };
}

/** Speed and ripple shift at age a, integrated from 0 (speed rises only while the blade pushes). */
function motionAt(plan, a) {
  let v = plan.v0, x = 0;
  const S = plan.strokes, last = S[S.length - 1], dt = 1 / 60, end = Math.min(a, last.t + HOLD + 0.1);
  for (let t = 0; t < end; t += dt) {
    for (const s of S) { const r = t - s.t, dur = s === last ? HOLD : PUSH; if (r >= 0 && r < dur) v += (DV * s.k * s.k / PUSH) * dt * Math.PI / 2 * Math.sin(Math.PI * r / PUSH); }
    x += v * dt;
  }
  return { v, x };
}

export class CanoeScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A canoeist paddles to the right on calm water. Each stroke, her paddle pushes the water backwards and a swirl of water moves back behind the blade. Two equal arrows at the blade: the paddle pushes the water to the left, and the water pushes the paddle to the right. The canoe speeds up a little with each stroke. With a harder stroke both arrows are longer, the swirl is bigger and the velocity of the canoe grows more.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage >= 1 ? 1 : 0; }
  plan() { return PLANS[this.cur]; }
  endT() { const p = this.plan(); return p.strokes[p.strokes.length - 1].t + HOLD + 0.5; }
  busy() { return this.age < this.endT(); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const p = this.plan(), a = Math.min(this.age, this.endT()), st = paddleAt(p, a), mo = motionAt(p, a);
    this.water(ctx, c, mo.x);
    this.swirls(ctx, c, p, a, mo.x);
    const pd = this.canoeist(ctx, c, st);
    const blade = pd.blade;
    // Velocity above the canoe.
    drawMotionArrow(ctx, c, 'v', CX + 60, WY - 150, { length: mo.v * VPX, angle: 0, label: 'v', side: 1 });
    // The pair at the blade: only while the blade pushes in the water (the rest frame is mid-push).
    const show = st.show;
    if (show > 0) {
      const L = PAIR * st.k, yUp = blade.y - 30, yDn = blade.y + 30;
      ctx.save(); ctx.beginPath(); ctx.arc(blade.x, blade.y, 30, 0, Math.PI * 2); ctx.strokeStyle = alpha(c.s1, 0.85 * show); ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
      drawForce(ctx, c, blade.x + 4, yUp, { length: L, angle: 0, label: '', alpha: show, fit: false });
      drawForce(ctx, c, blade.x - 4, yDn, { length: L, angle: Math.PI, label: '', alpha: show, fit: false });
      // Tags in the water under their own arrows (the right-pointing one first), each with a short leader.
      const rY = yDn + 52, lY = yDn + 100;
      drawTag(ctx, c, 'water pushes the paddle', 668, rY, { size: 26, col: c.s1ink, alpha: show, align: 'right', prefer: [[0, 0]] });
      drawTag(ctx, c, 'paddle pushes the water', 12, lY, { size: 26, col: c.s2ink, alpha: show, align: 'left', prefer: [[0, 0]] });
      ctx.save(); ctx.globalAlpha = 0.7 * show; ctx.lineWidth = 2.5; ctx.setLineDash([4, 5]);
      ctx.strokeStyle = c.s1ink; ctx.beginPath(); ctx.moveTo(blade.x + L * 0.75, rY - 20); ctx.lineTo(blade.x + L * 0.75, yUp + 6); ctx.stroke();
      ctx.strokeStyle = c.s2ink; ctx.beginPath(); ctx.moveTo(blade.x - L * 0.75, lY - 20); ctx.lineTo(blade.x - L * 0.75, yDn + 6); ctx.stroke();
      ctx.restore();
    }
    if (this.cur === 1) this.strip(ctx, c, ease(a, p.strokes[1].t + HOLD, 0.5));
  }

  /** The canoeist as MotionCast draws her, but with a paddle that can lift: kit canoe (back), the paddler with
   *  her hands on the lifted paddle, the kit near hull with its own fixed-pivot paddle masked out, our paddle.
   *  Kit gap: drawCanoe has no lift (or paddle: false) option. */
  canoeist(ctx, c, st) {
    const base = { x: CX, y: WY, length: CL };
    const back = drawCanoe(ctx, c, { ...base, stroke: 0, part: 'back' }), A = back.anchors;
    const pd = paddleGeom(st);
    drawFigure(ctx, c, { x: A.seat.x, y: A.seat.y + 4, height: A.paddlerHeight, build: 'adult', facing: back.f, pose: 'sit',
      seat: A.seat, hands: [pd.lower, pd.pivot] }, figureLook(c, LOOKS.canoeist));
    // Near hull: drawn at stroke 0 outside that paddle's band, then the band is filled from a stroke 1 draw
    // (its paddle lies well clear of the band below the gunwale).
    const band = (th, grow = 0) => {
      const ux = Math.sin(th), uy = Math.cos(th), w = 0.05 * CL + grow, d0 = -0.07 * CL, d1 = 0.47 * CL;
      ctx.moveTo(PIV.x + ux * d0 - uy * w, PIV.y + uy * d0 + ux * w); ctx.lineTo(PIV.x + ux * d1 - uy * w, PIV.y + uy * d1 + ux * w);
      ctx.lineTo(PIV.x + ux * d1 + uy * w, PIV.y + uy * d1 - ux * w); ctx.lineTo(PIV.x + ux * d0 + uy * w, PIV.y + uy * d0 - ux * w); ctx.closePath();
    };
    ctx.save(); ctx.beginPath(); ctx.rect(-40, -40, 760, 600); band(TH_CATCH); ctx.clip('evenodd');
    drawCanoe(ctx, c, { ...base, stroke: 0, part: 'front' }); ctx.restore();
    ctx.save(); ctx.beginPath(); band(TH_CATCH, 3); ctx.clip(); ctx.beginPath(); ctx.rect(0, WY - 0.11 * CL, 680, 400); ctx.clip();
    drawCanoe(ctx, c, { ...base, stroke: 1, part: 'front' }); ctx.restore();
    this.paddle(ctx, c, st, pd);
    return pd;
  }

  /** The paddle (shaft, T grip, blade) in the kit's look, at any lift; the water veils what is under the line. */
  paddle(ctx, c, st, pd) {
    const wood = darken(c.gold, 0.32), { grip, tip, blade, ux, uy } = pd, gw = 0.025 * CL;
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(grip.x, grip.y); ctx.lineTo(tip.x, tip.y);
    ctx.strokeStyle = darken(wood, 0.3); ctx.lineWidth = Math.max(5, 0.024 * CL); ctx.stroke();
    ctx.strokeStyle = wood; ctx.lineWidth = Math.max(3, 0.016 * CL); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(grip.x - uy * gw, grip.y + ux * gw); ctx.lineTo(grip.x + uy * gw, grip.y - ux * gw);
    ctx.strokeStyle = darken(wood, 0.2); ctx.lineWidth = Math.max(5, 0.022 * CL); ctx.stroke();
    const bl = () => { ctx.beginPath(); ctx.ellipse(blade.x, blade.y, 0.03 * CL, 0.085 * CL * st.fs, -st.th, 0, Math.PI * 2); };
    bl(); ctx.fillStyle = wood; ctx.fill(); ctx.strokeStyle = darken(wood, 0.35); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = alpha(lighten(wood, 0.45), 0.55); ctx.beginPath();                        // light side of the blade
    ctx.ellipse(blade.x - uy * 3, blade.y + ux * 3, 0.012 * CL, 0.06 * CL * st.fs, -st.th, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(0, WY, 680, 400); ctx.clip();
    ctx.beginPath(); ctx.moveTo(grip.x, grip.y); ctx.lineTo(tip.x, tip.y); ctx.strokeStyle = alpha(c.water, 0.5); ctx.lineWidth = 0.024 * CL; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(blade.x, blade.y, 0.034 * CL, 0.09 * CL * st.fs, -st.th, 0, Math.PI * 2); ctx.fillStyle = alpha(c.water, 0.5); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  /** Open water: a calm surface line, depth shading, ripple dashes that slide back by the distance travelled. */
  water(ctx, c, shift) {
    const top = mix(c.water, c.bgSurface, 0.6), deep = mix(c.water, c.bgSurface, 0.32);
    ctx.save();
    const g = ctx.createLinearGradient(0, WY, 0, 520); g.addColorStop(0, top); g.addColorStop(1, deep);
    ctx.fillStyle = g; ctx.fillRect(0, WY, 680, 520 - WY);
    ctx.fillStyle = alpha(lighten(top, 0.5), 0.55); ctx.fillRect(0, WY, 680, 5);              // light skin of the surface
    ctx.strokeStyle = darken(top, 0.3); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, WY); ctx.lineTo(680, WY); ctx.stroke();
    ctx.lineCap = 'round';
    const rows = [[WY + 26, 150, 46, 0.7], [WY + 70, 190, 60, 0.5], [WY + 140, 230, 70, 0.4], [WY + 230, 260, 80, 0.32]];
    rows.forEach(([y, gap, len, k], i) => {
      ctx.strokeStyle = alpha(lighten(top, 0.55), k); ctx.lineWidth = 3;
      const off = ((-shift * (1 - i * 0.08) + i * 67) % gap + gap) % gap;
      for (let x = off - gap; x < 700; x += gap) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len / 2, y - 4, x + len, y); ctx.stroke(); }
    });
    ctx.restore();
  }

  /** Water pushed back: one soft eddy per push, born behind the blade, drifting back with the ripples, fading.
   *  A few short ripple arcs of different sizes round a slowly turning centre. */
  swirls(ctx, c, p, a, shift) {
    const ink = lighten(mix(c.water, c.bgSurface, 0.3), 0.15);
    const ARCS = [[0.3, 0.2, 1.3, 4, 0, 0], [0.55, 2.4, 1.0, 3.5, -6, 4], [0.8, 4.3, 1.1, 3, 5, -3], [1.0, 1.1, 0.8, 2.5, -10, 2], [0.7, 5.6, 0.6, 2.5, 12, 6]];
    for (const s of p.strokes) {
      const r = a - s.t;
      if (r < 0.1) continue;
      const grow = clamp01(r / PUSH), fade = 1 - 0.6 * clamp01((r - PUSH - 0.2) / 0.9);
      const born = motionAt(p, s.t + PUSH * 0.4).x, x = CX - 40 - (shift - born) * 0.8 - 40 * grow, y = WY + 92;
      const R = (24 + 18 * s.k) * (0.45 + 0.55 * grow), spin = -1.4 * grow;
      ctx.save(); ctx.strokeStyle = ink; ctx.lineCap = 'round';
      for (const [f, a0, span, lw, dx, dy] of ARCS) {
        ctx.globalAlpha = fade * clamp01(grow * 3) * (0.95 - 0.45 * f);
        ctx.lineWidth = lw; ctx.beginPath();
        ctx.ellipse(x + dx * (R / 40), y + dy * (R / 40), R * f * 1.4, R * f * 0.62, 0, a0 + spin, a0 + spin + span); ctx.stroke();
      }
      ctx.restore();
    }
  }

  /** b1 rest: a compact two-row strip, gentle pair faint and short, harder pair long, same scale. */
  strip(ctx, c, k) {
    if (k <= 0) return;
    const x0 = 492, rows = [['gentle stroke', 1, 0.55], ['harder stroke', HARD, 1]];
    rows.forEach(([name, s, al], i) => {
      const y = 448 + i * 44, mid = x0 - 16 - PAIR * HARD * 0.5;
      drawTag(ctx, c, name, x0, y, { size: 26, col: c.label, alpha: k * al, align: 'left', prefer: [[0, 0]] });
      drawForce(ctx, c, mid + 3, y - 7, { length: PAIR * s * 0.5, angle: 0, label: '', alpha: k * al, fit: false });
      drawForce(ctx, c, mid - 3, y + 7, { length: PAIR * s * 0.5, angle: Math.PI, label: '', alpha: k * al, fit: false });
    });
  }
}
