/**
 * GrainDanceScene - slide "Sound Moves Grains" (L03), 3 beats. Rebuilt 2026-11-03 on the kit
 * (SimWave rings + sound arcs, SimFigure) and the course art (SoundArt plate, beater, bowl).
 *
 * b0 you stand holding a steel plate out at your side and a raised beater; a rubber-covered
 *    bowl with grains resting on the sheet stands away; even still air dots fill the gap.
 * b1 the beater hits; the plate rings and its ringing fades over about 2 s; the air
 *    particles vibrate in place (one marked red) as compressions cross the gap; when the
 *    wave reaches the sheet the sheet vibrates and the grains hop off it; they settle after
 *    the wave has passed. Loops every LOOP s, then holds a frame with grains in the air.
 * b2 a harder hit from a bigger swing: bigger air amplitude, hops twice as high; a dashed
 *    line marks b1's hop height.
 *
 * Model: one waveField from the plate (origin at the plate centre, d = radius). Its source is
 * a sine at FQ under the ringing envelope. The sheet's bulge is that field at the sheet's
 * distance; each grain flies a parabola per sheet cycle, height from the amplitude that
 * arrived in that cycle. Frames depend on the beat and the time only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, pill, alpha, inOutSine, clamp01 } from 'simulations/base/kit/SimLook.js';
import { waveField, drawRings } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawPlateAndBeater, drawRubberBowl } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const GROUND = 482;
const FIG = { x: 92, h: 350 };                    // you, standing, facing the bowl
const PL = { x: 212, y: 214, r: 76 };              // plate centre, held out at your side
const GRIP = { x: 211, y: 260 };                  // where the beater's end should be; the hand's reach decides
const BOWL = { x: 528, w: 276, h: 108 };
// the air between plate and bowl: even dots that only vibrate (the bowl's own outline cut out)
// Rounded corners and a 40 px opacity fade on every side (top, bottom, frame edge) so it reads as air, not a box.
function roundPoly(pts, rad, n = 6) {
  const out = [];
  pts.forEach((p, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
    const la = Math.hypot(a.x - p.x, a.y - p.y), lb = Math.hypot(b.x - p.x, b.y - p.y), r = Math.min(rad, la / 2, lb / 2);
    const p0 = { x: p.x + (a.x - p.x) * r / la, y: p.y + (a.y - p.y) * r / la }, p1 = { x: p.x + (b.x - p.x) * r / lb, y: p.y + (b.y - p.y) * r / lb };
    for (let k = 0; k <= n; k++) {
      const u = k / n, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
      out.push({ x: w0 * p0.x + w1 * p.x + w2 * p1.x, y: w0 * p0.y + w1 * p.y + w2 * p1.y });
    }
  });
  return out;
}
const AIR = roundPoly([{ x: 232, y: 136 }, { x: 668, y: 136 }, { x: 668, y: 372 }, { x: 392, y: 372 }, { x: 392, y: 484 }, { x: 232, y: 484 }], 70);
const AIR_FADE = 40;
const SHEET = { x: BOWL.x, y: GROUND - BOWL.h + 8 }; // where the wave meets the sheet (estimate; drawn by SoundArt)
const D_SHEET = Math.hypot(SHEET.x - PL.x, SHEET.y - PL.y);
const ANG = Math.atan2(SHEET.y - PL.y, SHEET.x - PL.x);
const V = 240;          // px/s on screen
const FQ = 1.5;         // Hz on screen: slow enough to follow the red particle
const LAMBDA = V / FQ;  // 160 px between compressions (and arcs)
const T0 = 0.38;        // the hit, s into a loop
const LOOP = 5.0;
const RING_S = 2.6;     // the ringing is gone after this
const A_SOFT = 14, A_HARD = 26;
const HOP_SOFT = 44, HOP_HARD = 88;
const MARK_D = 190;     // the red air particle's mean distance from the plate
const FALL = 900;
const HOLD = T0 + D_SHEET / V + 0.5 / FQ;          // a frame with grains mid-hop, arcs in the gap
const RUN = 2 * LOOP + HOLD;
const GRAINS = Array.from({ length: 30 }, (_, i) => ({ u: 0.08 + 0.84 * ((i * 7) % 30) / 29, d: ((i * 11) % 30) / 29, lag: ((i * 5) % 7) / 7 * 0.12 }));

// the plate's ringing: a quick rise, a gradual fade over about 2 s, then nothing
const env = (tr) => (tr <= 0 ? 0 : (1 - Math.exp(-tr / 0.03)) * Math.exp(-tr / 1.1) * (1 - clamp01((tr - RING_S + 0.5) / 0.5)));
function ringSource(A) {
  const f = (tr) => A * env(tr) * Math.sin(TAU * FQ * tr);
  return Object.assign(f, { kind: 'sine', amp: A, freq: FQ, period: 1 / FQ, span: 1 / FQ, wavelength: (v) => v / FQ });
}
const FIELDS = { soft: waveField({ source: ringSource(A_SOFT), v: V, falloff: FALL }), hard: waveField({ source: ringSource(A_HARD), v: V, falloff: FALL }) };

export class GrainDanceScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'You hold a steel plate and a wooden beater. A bowl covered with a rubber sheet, with rice grains on it, stands away from you; nothing touches it. When the beater hits, the plate rings, sound waves cross the air, the air particles only vibrate in place, the sheet vibrates and the grains jump. A harder hit makes the grains jump about twice as high.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) { this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(2, stage | 0)); }
  busy() { return this.cur > 0 && this.age < RUN; }

  // local loop time; after the runs it holds the mid-hop frame
  tau() { return this.age < RUN ? this.age % LOOP : HOLD; }

  _hop(g, F, A, Hmax, tr) {
    const ph = FQ * (tr - D_SHEET / V) - g.lag;
    if (ph < 0) return 0;
    const k = Math.floor(ph), u = ph - k;
    const H = Hmax * env((k + 0.25) / FQ) * (F.ampAt(D_SHEET) / (A * FALL / (FALL + D_SHEET))) * Math.sin(Math.PI * g.u) ** 0.6;
    return H < 1.5 ? 0 : H * 4 * u * (1 - u);
  }

  draw(ctx, c) {
    const b = this.cur, hard = b === 2, live = b > 0;
    const t = live ? this.tau() : 0, tr = t - T0;
    const F = hard ? FIELDS.hard : FIELDS.soft, A = hard ? A_HARD : A_SOFT;
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, {});

    // air: even dots filling the whole region between the plate and the bowl; each one only
    // vibrates about its own place as the compressions pass through (one marked red)
    const mx = PL.x + Math.cos(ANG) * MARK_D, my = PL.y + Math.sin(ANG) * MARK_D;
    drawRings(ctx, c, { cx: PL.x, cy: PL.y, field: live ? F : null, t: tr, spacing: 15, r: 3.4, source: false,
      mask: AIR, maskFade: AIR_FADE, mark: { x: mx, y: my } });

    // the beater: raised back, down onto the plate at T0 (from further back and faster for
    // the hard hit), back up after
    const top = hard ? 1 : 0.55;
    let swing = b === 0 ? 0.8 : top;
    if (live) {
      const down = hard ? 0.22 : 0.32;
      swing = t < T0 - down ? top : t < T0 ? top * (1 - inOutSine((t - (T0 - down)) / down)) : top * inOutSine(clamp01((t - T0) / 0.5));
    }
    const ring = live ? env(tr) : 0;
    const plateOpts = { x: PL.x, y: PL.y, r: PL.r, swing, hard, held: true, ring, t: this.age, grip: GRIP };
    ctx.save(); ctx.globalAlpha = 0; const grips = drawPlateAndBeater(ctx, c, plateOpts); ctx.restore();
    // you stand (no crouch): the beater's end goes where your near hand can reach
    const spec = figureFor(this, { role: 'student', x: FIG.x, y: GROUND, height: FIG.h, facing: 1, i: 2, autoReach: false,
      pose: { name: 'stand', lean: 9 + (hard ? 3 * (1 - swing) : 0), crouch: 0 }, hands: [GRIP, grips.sideGrip] });
    const reach = solveFigure(spec).anchors.hand[0];
    plateOpts.grip = { x: reach.x, y: reach.y };
    spec.hands = [plateOpts.grip, grips.sideGrip];
    drawFigure(ctx, c, spec, spec.look, { between: () => drawPlateAndBeater(ctx, c, plateOpts) });

    // the bowl: the sheet moves with the arriving wave; grains fly off it
    const sheet = live ? Math.max(-1, Math.min(1, F.s(D_SHEET, tr) / (A_HARD * FALL / (FALL + D_SHEET)))) * 0.9 : 0;
    const grains = GRAINS.map((g) => ({ u: g.u, d: g.d, h: live ? this._hop(g, F, A, hard ? HOP_HARD : HOP_SOFT, tr) : 0 }));
    const bw = drawRubberBowl(ctx, c, { x: BOWL.x, y: GROUND, w: BOWL.w, h: BOWL.h, sheet, grains });

    // labels
    if (b === 0) {
      pill(ctx, c, 'metal plate', PL.x + 70, PL.y - PL.r - 30, { size: 26, display: true, bg: c.raised, ink: c.label });
      pill(ctx, c, 'rubber sheet', BOWL.x, bw.sheet.y + 56, { size: 26, display: true, bg: c.raised, ink: c.label });
    } else {
      pill(ctx, c, 'sound wave', 470, 112, { size: 26, display: true, bg: c.raised, ink: c.s1ink });
      if (hard) {
        const y = bw.sheet.y - HOP_SOFT - 3, x0 = bw.sheet.x0 + 10, x1 = bw.sheet.x1 - 10;
        ctx.save(); ctx.strokeStyle = alpha(c.label, 0.85); ctx.lineWidth = 3.5; ctx.setLineDash([10, 7]);
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore();
        pill(ctx, c, 'softer beat', x1 - 74, y - 72, { size: 26, display: true, bg: c.raised, ink: c.labelMuted });
      }
    }
  }
}
