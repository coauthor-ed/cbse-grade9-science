// AmplitudeScene.js - slide "Amplitude" (blk-l05-s05, 2 beats). New 2026-11-03.
// Book Fig 10.20 (a) low and (b) high amplitude, and Activity 10.6 (plate, beater, bowl with grains).
// b0 two waves with the SAME wavelength, stacked: each a strip of air particles over its density graph.
//    Both graphs share one density scale, so the bigger swing is a taller curve by the maths. An
//    amplitude arrow grows from the dashed average line up to a crest and down to a trough on each.
// b1 you hold a steel plate and a beater; the air strip runs from the plate into a bowl with a rubber sheet and rice grains.
//    A soft hit, then a hard hit, alternate. ONE waveField per hit drives everything: the air strip
//    (red particle and its mean +/- amp bracket), the sheet's bulge (the same field at the bowl's
//    distance) and the grains' hops (height proportional to the amplitude that arrived).
//    The run is short (hard hop peak at about 3.9 s) and at rest it holds the hard hit with grains in the air
//    and a dashed line at the soft hop height, its 'soft' tag at the line's right end.
// Graphs plot the field's own density at each particle's mean place (the book's smooth curve), as in
// L04 DensityGraphScene and WavelengthScene.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, pill, alpha, inOutSine, clamp01 } from 'simulations/base/kit/SimLook.js';
import { sineSource, waveField, drawParticleStrip, drawDensityGraph } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawPlateAndBeater, drawRubberBowl } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const X0 = 70, WIDTH = 560, V = 120;
const LAM = 210;
const RANGE = [0.4, 1.6];                          // ONE density scale for both graphs
const ramp = (a, t0, dur) => clamp01((a - t0) / dur);

/** A wave of wavelength LAM with strain swing `strain`, its first crest `first` px into the strip. */
function wave(strain, first) {
  const freq = V / LAM, origin = X0 - 3 * LAM, amp = strain * LAM / TAU;
  const F = waveField({ v: V, origin, source: sineSource({ amp, freq }) });
  const t = (X0 - origin + first) / V + 20 / freq;
  const G = { origin, dir: 1, xAt: (d) => origin + d, rhoLin: F.rhoLin, rhoRangeLin: F.rhoRangeLin };
  return { F, G, t };
}
const SMALL = wave(0.2, 60);
const LARGE = wave(0.52, 60);

// ---- b1: plate, air, bowl ------------------------------------------------------------------
const GROUND = 542;
const FIG = { x: 104, h: 420 };
const PL = { x: 206, y: 318, r: 74 };
const GRIP = { x: 206, y: 362 };
const BOWL = { x: 566, w: 204, h: 150 };
const STRIP = { x: PL.x + 26, w: BOWL.x - BOWL.w / 2 - PL.x - 20, h: 90 };   // the air from the plate to the bowl's rim
const ORIGIN = PL.x + 22;                           // d = 0 at the plate face
const D_BOWL = STRIP.x + STRIP.w - ORIGIN + 14;     // the sheet takes the field just past the strip's end
const FQ = 1.0, V1 = 300;                           // lambda 300 px; 1 Hz on screen
const A_SOFT = 7, A_HARD = 14;
const HOPK = 6;                                     // hop px per px of amplitude: 42 soft, 84 hard
const T0 = 0.35;                                    // the hit, s into each half
const RING_S = 1.8;
const HALF = 2.2;           // one soft hit, then one hard hit, then rest
const MARK_D = 120;
const env = (tr) => (tr <= 0 ? 0 : (1 - Math.exp(-tr / 0.05)) * Math.exp(-tr / 1.2) * (1 - clamp01((tr - RING_S + 0.5) / 0.5)));
function ringSource(A) {
  const f = (tr) => A * env(tr) * Math.sin(TAU * FQ * tr);
  return Object.assign(f, { kind: 'sine', amp: A, freq: FQ, period: 1 / FQ, span: 1 / FQ, wavelength: (v) => v / FQ });
}
const FIELDS = { soft: waveField({ source: ringSource(A_SOFT), v: V1, origin: ORIGIN }), hard: waveField({ source: ringSource(A_HARD), v: V1, origin: ORIGIN }) };
const GRAINS = Array.from({ length: 20 }, (_, i) => ({ u: 0.07 + 0.52 * ((i * 7) % 22) / 21, d: ((i * 9) % 22) / 21, lag: ((i * 5) % 7) / 7 * 0.1 }));
// the frame it rests on: the hard hit, grains near the top of their first hop
const HOLD = HALF + T0 + D_BOWL / V1 + 0.5 / FQ + 0.05;
const RUN = HOLD;

export class AmplitudeScene extends SimScene {
  static HEIGHT = 560;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two sound waves with the same wavelength, each a strip of air particles over a graph of density '
    + 'against distance on the same scale. In the small amplitude wave the compressions and rarefactions are weak and '
    + 'the curve rises only a little above the dashed average line; in the large amplitude wave they are strong and the '
    + 'curve rises much higher. An arrow from the average line to a crest marks the amplitude. Then you beat a steel '
    + 'plate softly and then hard. On the hard hit the marked air particle swings further from its place, the rubber '
    + 'sheet on the bowl bulges more and the rice grains jump about twice as high.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.probeOut = null;
  }

  enter(stage) { this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(1, stage | 0)); }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.cur === 0 ? this.t() < 1.8 : this.t() < RUN; }

  draw(ctx, c) {
    if (this.cur >= 1) { this.beat(ctx, c); return; }
    drawBackdrop(ctx, c, 'dots');
    this.compare(ctx, c);
  }

  // ---- b0 ----------------------------------------------------------------------------------
  compare(ctx, c) {
    const a = this.t(), out = {};
    const rows = [{ w: SMALL, top: 0, name: 'small amplitude' }, { w: LARGE, top: 280, name: 'large amplitude', tag: true }];
    for (const r of rows) {
      const y = r.top;
      pill(ctx, c, r.name, X0 - 6, y + 25, { bg: c.raised, size: 26, display: true, align: 'left' });
      drawParticleStrip(ctx, c, { x: X0, y: y + 94, w: WIDTH, h: 44, field: r.w.F, t: r.w.t, spacing: 10, r: 3.4,
        densityShade: true, tags: true });
      const g = drawDensityGraph(ctx, c, { x: X0, y: y + 146, w: WIDTH, h: 124, field: r.w.G, t: r.w.t, linear: true,
        range: RANGE, marks: false });
      const k = g.crests[1] ?? g.crests[0], tr = k && g.troughs.find((p) => p.x > k.x);
      const u = ramp(a, 0.3, 0.7);
      if (k) this.ampArrow(ctx, c, k.x, g.avgY, k.y, u);
      if (tr) this.ampArrow(ctx, c, tr.x, g.avgY, tr.y, ramp(a, 0.8, 0.7));
      if (r.tag && k && tr && u >= 1) pill(ctx, c, 'amplitude', tr.x, k.y + 8, { bg: c.raised, size: 26, display: true });
      out[r.name] = k ? Math.round(g.avgY - k.y) : null;
    }
    this.probeOut = out;
  }

  /** A label-ink arrow from the average line (y0) to a crest or trough (y1), grown with u. */
  ampArrow(ctx, c, x, y0, y1, u) {
    if (u <= 0) return;
    const ye = y0 + (y1 - y0) * inOutSine(u), s = Math.sign(y1 - y0) || 1;
    ctx.save(); ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y0, 4.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, ye - s * 8); ctx.stroke();
    if (Math.abs(ye - y0) > 9) { ctx.beginPath(); ctx.moveTo(x, ye); ctx.lineTo(x - 7, ye - s * 12); ctx.lineTo(x + 7, ye - s * 12); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }

  // ---- b1 ----------------------------------------------------------------------------------
  /** Run time: the soft hit, then the hard hit; after the run it holds the hard-hit frame. */
  tau() { const a = this.t(); return a < RUN ? a : HOLD; }

  /** The beater's swing at loop time tau: raised, down onto the plate at T0, back up. */
  swingAt(tau) {
    const hard = tau >= HALF, t = tau - (hard ? HALF : 0), top = hard ? 1 : 0.5, down = hard ? 0.22 : 0.3;
    if (t < T0 - down) return top;
    if (t < T0) return top * (1 - inOutSine((t - (T0 - down)) / down));
    return top * inOutSine(clamp01((t - T0) / 0.6));
  }

  /** Your one fixed pose: no auto-reach, fixed lean; the hands hold the beater's end and the plate's rim. */
  figSpec(plateGrip) {
    return figureFor(this, { role: 'student', x: FIG.x, y: GROUND, height: FIG.h, facing: 1, i: 2, autoReach: false,
      pose: { name: 'stand', lean: 8, crouch: 0 }, hands: [GRIP, plateGrip] });
  }

  hop(g, A, tr) {
    const ph = FQ * (tr - D_BOWL / V1) - g.lag;
    if (ph < 0) return 0;
    const k = Math.floor(ph), u = ph - k;
    const H = HOPK * A * env((k + 0.25) / FQ) * Math.sin(Math.PI * g.u) ** 0.6;
    return H < 1.5 ? 0 : H * 4 * u * (1 - u);
  }

  beat(ctx, c) {
    const tau = this.tau(), hard = tau >= HALF, tr = tau - (hard ? HALF : 0) - T0;
    const F = hard ? FIELDS.hard : FIELDS.soft, A = hard ? A_HARD : A_SOFT;
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, {});

    // the bowl first (the strip's height follows its sheet): the sheet takes the same field at its
    // distance; grains hop with the arriving amplitude
    const sheet = Math.max(-1, Math.min(1, F.s(D_BOWL, tr) / A_HARD)) * 0.95;
    const grains = GRAINS.map((g) => ({ u: g.u, d: g.d, h: this.hop(g, A, tr) }));
    const bw = drawRubberBowl(ctx, c, { x: BOWL.x, y: GROUND, w: BOWL.w, h: BOWL.h, sheet, grains });

    // the air between the plate and the bowl: one strip that runs into the bowl's mouth
    const s = drawParticleStrip(ctx, c, { ...STRIP, y: bw.sheet.y - STRIP.h + 6, field: F, t: tr, spacing: 11, r: 3.6,
      tube: false, densityShade: true, fadeEnd: 0, mark: MARK_D, bracket: true });

    // the plate and beater, held by you
    const swing = this.swingAt(tau), ring = env(tr);
    const plateOpts = { x: PL.x, y: PL.y, r: PL.r, swing, hard, held: true, ring, t: this.t(), grip: GRIP };
    ctx.save(); ctx.globalAlpha = 0; const grips = drawPlateAndBeater(ctx, c, plateOpts); ctx.restore();
    const spec = this.figSpec(grips.sideGrip);
    const reach = solveFigure(spec).anchors.hand[0];
    plateOpts.grip = { x: reach.x, y: reach.y };
    spec.hands = [plateOpts.grip, grips.sideGrip];
    drawFigure(ctx, c, spec, spec.look, { between: () => drawPlateAndBeater(ctx, c, plateOpts) });

    // tags: which hit, beside the plate; on the hard hit a dashed line at the soft hop height
    pill(ctx, c, hard ? 'hard' : 'soft', PL.x + 40, PL.y - PL.r - 30, { bg: hard ? c.s6 : c.raised, size: 26, display: true, align: 'left' });
    if (hard) {
      const y = bw.sheet.y - HOPK * A_SOFT * env(0.25 / FQ), x0 = bw.sheet.x0 + 6;
      const x1 = bw.sheet.x0 + (bw.sheet.x1 - bw.sheet.x0) * 0.62;
      ctx.save(); ctx.strokeStyle = alpha(c.label, 0.85); ctx.lineWidth = 3; ctx.setLineDash([10, 7]);
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore();
      pill(ctx, c, 'soft', x1 + 6, y, { bg: c.raised, size: 26, display: true, align: 'left', ink: c.labelMuted });
    }
    this.probeOut = { hard, tr: +tr.toFixed(2), bracket: s.marked && s.marked.amp, sheet: +sheet.toFixed(2),
      hopMax: Math.round(Math.max(...grains.map((g) => g.h))) };
  }

  /** Knee/hip probe: your joints over 2 s of frames at 60 fps from the hard hit; largest frame-to-frame move in px. */
  figProbe() {
    let prev = null, maxKnee = 0, maxHip = 0;
    const c = this.colors;
    for (let i = 0; i <= 120; i++) {
      const tau = HALF + i / 60, tr = tau - HALF - T0;
      const ring = env(tr);
      const opts = { x: PL.x, y: PL.y, r: PL.r, swing: this.swingAt(tau), hard: true, held: true, ring, t: tau, grip: GRIP };
      const cv = document.createElement('canvas').getContext('2d');
      const grips = drawPlateAndBeater(cv, c, opts);
      const spec = this.figSpec(grips.sideGrip);
      const reach = solveFigure(spec).anchors.hand[0];
      spec.hands = [{ x: reach.x, y: reach.y }, grips.sideGrip];
      const sk = solveFigure(spec), cur = { hip: sk.anchors.hip, knee: sk.anchors.knee };
      if (prev) {
        maxHip = Math.max(maxHip, Math.hypot(cur.hip.x - prev.hip.x, cur.hip.y - prev.hip.y));
        cur.knee.forEach((k, j) => { maxKnee = Math.max(maxKnee, Math.hypot(k.x - prev.knee[j].x, k.y - prev.knee[j].y)); });
      }
      prev = cur;
    }
    return { maxKnee: +maxKnee.toFixed(3), maxHip: +maxHip.toFixed(3) };
  }
}
