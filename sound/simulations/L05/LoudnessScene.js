// LoudnessScene.js - slide "Loudness" (blk-l05-s04, 2 beats). New 2026-11-03.
// b0 a speaker at the left, you near it and a friend far from it. The sound arcs weaken with
//    distance (strength ~ 1 / r). Above each listener, a small density graph of the wave reaching
//    them: the same wavelength, its amplitude ~ 1 / r (one density scale for both graphs, so the
//    near curve is three times as tall by the maths). The near listener's ear glows more.
// b1 a tuning fork in the middle, two listeners at the SAME distance on either side. The same wave
//    reaches both (the same graph above each), and a microphone on a stand beside each swings the same.
//    One listener wears a hearing aid and reacts more strongly: loudness is in the listener.
// Graphs plot the field's own density at each particle's mean place, as in L04 DensityGraphScene.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, pill, alpha, mix, clamp01, rr } from 'simulations/base/kit/SimLook.js';
import { sineSource, waveField, drawDensityGraph, drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawSpeaker, drawTuningFork, drawMicrophone } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawHearingAid } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const GROUND = 520;
const FIG_H = 214;
const LAM = 90, V = 60;                      // graphs: two wavelengths in 180 px, crawling at 60 px/s
const RANGE = [0.4, 1.6];
const ARC_L = 64, ARC_V = 80;                // the arcs in the room: 64 px apart

/** A graph field: density along a 180 px window, strain swing `strain`. */
function gfield(strain, x0) {
  const origin = x0 - 4 * LAM, amp = strain * LAM / TAU;
  const F = waveField({ v: V, origin, source: sineSource({ amp, freq: V / LAM }) });
  return { origin, dir: 1, xAt: (d) => origin + d, rhoLin: F.rhoLin, rhoRangeLin: F.rhoRangeLin };
}
// b0: the speaker's cone at x 104; listeners' ears at 170 px and 510 px from it: amplitude 3 : 1
const SP = { x: 92, r: 42 };
const NEAR = { x: 274, gx: 170 }, FAR = { x: 614, gx: 470 };
const S_NEAR = 0.51, S_FAR = S_NEAR * 170 / 510;
const G_NEAR = gfield(S_NEAR, NEAR.gx), G_FAR = gfield(S_FAR, FAR.gx);
// b1: the fork in the middle, both listeners 230 px away
const FORK = { x: 340 };
const L1 = { x: 110, gx: 26 }, L2 = { x: 570, gx: 474 };
const S_SAME = 0.34;
const G_L1 = gfield(S_SAME, L1.gx), G_L2 = gfield(S_SAME, L2.gx);

export class LoudnessScene extends SimScene {
  static HEIGHT = 560;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A speaker at the left plays a sound. You stand near it and a friend stands far away. The sound '
    + 'arcs grow weaker as they spread. Above each listener a small density graph shows the wave that reaches them: '
    + 'the near one has a much larger amplitude, and it sounds louder; the far one sounds softer. Then a tuning fork '
    + 'sounds between two listeners at the same distance. The same wave reaches both, and a microphone on a stand '
    + 'beside each swings the same, but the listener with a hearing aid reacts more strongly.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.probeOut = null;
  }

  enter(stage) { this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(1, stage | 0)); }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.t() < 5.5; }

  /** The wave keeps crawling while busy, then rests on a frame that already shows the point. */
  tw() { return Math.min(this.t(), 5.5) + 40; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, {});
    if (this.cur >= 1) this.same(ctx, c); else this.distance(ctx, c);
  }

  graph(ctx, c, G, x, t) {
    return drawDensityGraph(ctx, c, { x, y: 96, w: 180, h: 118, field: G, t, linear: true, range: RANGE, marks: false, cell: 9 });
  }

  /** Arcs in the room: single SimWave arcs moving out from (x, y), each as strong as k / r. */
  arcs(ctx, c, x, y, dir, t, k, rMax) {
    const off = (t * ARC_V) % ARC_L;
    for (let r = 26 + off; r < rMax; r += ARC_L) {
      const s = clamp01(k / r) * clamp01((r - 26) / 20) * clamp01((rMax - r) / 40);
      drawSoundArcs(ctx, c, { x, y, dir, spread: 0.6, single: true, radius: r, t, strength: s, wavelength: ARC_L });
    }
  }

  /** A listener in one fixed pose, a glow at the head as strong as `react`. */
  person(ctx, c, x, facing, i, react, mood) {
    const spec = figureFor(this, { role: 'student', x, y: GROUND, height: FIG_H, facing, i, pose: 'stand', autoReach: false, mood });
    const h = solveFigure(spec).anchors.head;
    if (react > 0) {
      ctx.save();
      const R = h.r * (1.6 + 1.4 * react), g = ctx.createRadialGradient(h.x, h.y, h.r * 0.6, h.x, h.y, R);
      g.addColorStop(0, alpha(c.warning, 0.8 * react)); g.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, R, 0, TAU); ctx.fill();
      ctx.restore();
    }
    return drawFigure(ctx, c, spec, spec.look);
  }

  // ---- b0 ----------------------------------------------------------------------------------
  distance(ctx, c) {
    const t = this.tw();
    const y = GROUND - 1.85 * SP.r;
    const sp = drawSpeaker(ctx, c, { x: SP.x, y, r: SP.r, cone: Math.sin(TAU * 1.3 * t) * 0.8, facing: 1 });
    this.arcs(ctx, c, sp.cone.x, sp.cone.y, -0.22, t, 60, FAR.x - 18 - sp.cone.x);   // they stop at the friend's ear
    const a = this.person(ctx, c, NEAR.x, -1, 2, 1, 'oops');
    const b = this.person(ctx, c, FAR.x, -1, 5, 0.32, 'smile');
    const gn = this.graph(ctx, c, G_NEAR, NEAR.gx, t), gf = this.graph(ctx, c, G_FAR, FAR.gx, t);
    // tags above the arcs, on top of each listener's graph
    pill(ctx, c, 'louder', NEAR.gx + 90, 72, { bg: c.raised, size: 26, display: true });
    pill(ctx, c, 'softer', FAR.gx + 90, 72, { bg: c.raised, size: 26, display: true, ink: c.labelMuted });
    const swing = (g) => (g.crests.length ? Math.round(g.avgY - Math.min(...g.crests.map((p) => p.y))) : 0);
    this.probeOut = { near: swing(gn), far: swing(gf) };
  }

  // ---- b1 ----------------------------------------------------------------------------------
  same(ctx, c) {
    const t = this.tw(), age = this.t();
    // the fork stands in a wooden block
    this.block(ctx, c, FORK.x, GROUND, 128, 34);
    const f = drawTuningFork(ctx, c, { x: FORK.x, y: GROUND - 30, h: 210, vib: 0.7, t, freq: 4 });
    const [tl, tr] = f.tips;
    this.arcs(ctx, c, tl.x - 8, tl.y + 20, Math.PI - 0.14, t, 70, 200);
    this.arcs(ctx, c, tr.x + 8, tr.y + 20, 0.14, t, 70, 200);
    // two microphones on stands at the same distance: their diaphragms swing the same (it can be measured)
    const fill = clamp01((age - 0.3) / 0.7), dia = 0.8 * fill * Math.sin(TAU * 4 * t);
    drawMicrophone(ctx, c, { x: 262, y: GROUND - 140, r: 21, len: 58, facing: 1, tilt: 0.2, stand: true, standY: GROUND, diaphragm: dia });
    drawMicrophone(ctx, c, { x: 418, y: GROUND - 140, r: 21, len: 58, facing: -1, tilt: 0.2, stand: true, standY: GROUND, diaphragm: dia });
    const a = this.person(ctx, c, L1.x, 1, 4, 1, 'oops');
    const b = this.person(ctx, c, L2.x, -1, 1, 0.38, 'smile');
    // the hearing aid behind the left listener's ear (the ear is behind the face, facing right)
    // a behind-the-ear aid, drawn larger than life so it reads as a device: the case tilted along the
    // back of the head, its hook over the ear and its tip at the ear
    const h = a.anchors.head, ear = { x: h.x - h.r * 0.16, y: h.y - h.r * 0.18 }, w = 70, k = w / 360, al = 1.15;
    const tx = 214 * k, ty = 20 * k, ca = Math.cos(al), sa = Math.sin(al);
    ctx.save(); ctx.translate(ear.x - (tx * ca + ty * sa), ear.y - (-tx * sa + ty * ca)); ctx.rotate(-al);
    drawHearingAid(ctx, c, { x: 0, y: 0, w }); ctx.restore();
    pill(ctx, c, 'hearing aid', h.x + 4, h.y - h.r - 44, { bg: c.raised, size: 26, display: true });
    const g1 = this.graph(ctx, c, G_L1, L1.gx, t), g2 = this.graph(ctx, c, G_L2, L2.gx, t);
    pill(ctx, c, 'same intensity', FORK.x, 150, { bg: c.raised, size: 26, display: true });
    const swing = (g) => (g.crests.length ? Math.round(g.avgY - Math.min(...g.crests.map((p) => p.y))) : 0);
    this.probeOut = { left: swing(g1), right: swing(g2), mic: +fill.toFixed(2) };
  }

  /** A wooden block: lit top, shaded side, grain lines. */
  block(ctx, c, x, y, w, h) {
    const wood = mix(c.gold, c.label, 0.35), top = 10;
    ctx.save();
    ctx.fillStyle = mix(wood, c.label, 0.3);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y - h); ctx.lineTo(x + w / 2 + top, y - h - top); ctx.lineTo(x + w / 2 + top, y - top); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = mix(wood, c.bgSurface, 0.3);
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x - w / 2 + top, y - h - top); ctx.lineTo(x + w / 2 + top, y - h - top); ctx.lineTo(x + w / 2, y - h); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(0, y - h, 0, y);
    g.addColorStop(0, wood); g.addColorStop(1, mix(wood, c.label, 0.15));
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.strokeStyle = alpha(mix(wood, c.label, 0.5), 0.5); ctx.lineWidth = 1.5;
    for (let i = 1; i < 4; i++) { const yy = y - h + i * h / 4; ctx.beginPath(); ctx.moveTo(x - w / 2 + 6, yy); ctx.bezierCurveTo(x - 10, yy - 3, x + 10, yy + 3, x + w / 2 - 6, yy); ctx.stroke(); }
    ctx.strokeStyle = mix(wood, c.label, 0.55); ctx.lineWidth = 2; ctx.strokeRect(x - w / 2, y - h, w, h);
    ctx.restore();
  }

  /** A sound meter on the floor: a shaded case, a microphone ball on a short neck, a bar display. */
  meter(ctx, c, x, y, fill, t) {
    const w = 62, h = 92, top = y - h, body = mix(c.label, c.bgSurface, 0.62);
    ctx.save();
    ctx.fillStyle = alpha(c.label, 0.14); ctx.beginPath(); ctx.ellipse(x + 4, y + 2, w * 0.6, 6, 0, 0, TAU); ctx.fill();
    // neck and microphone ball
    ctx.fillStyle = mix(body, c.label, 0.3); ctx.fillRect(x - 5, top - 22, 10, 24);
    const mg = ctx.createRadialGradient(x - 4, top - 30, 2, x, top - 26, 13);
    mg.addColorStop(0, mix(c.label, c.bgSurface, 0.45)); mg.addColorStop(1, mix(c.label, c.bgSurface, 0.1));
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(x, top - 26, 12, 0, TAU); ctx.fill();
    ctx.strokeStyle = alpha(c.bgSurface, 0.35); ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 4, top - 36); ctx.lineTo(x + i * 4, top - 16); ctx.stroke(); }
    // case: lit left, shaded right
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, mix(body, c.bgSurface, 0.35)); g.addColorStop(1, mix(body, c.label, 0.2));
    rr(ctx, x - w / 2, top, w, h, 12); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = mix(body, c.label, 0.5); ctx.lineWidth = 2; ctx.stroke();
    // display: 6 bars, lit to the reading
    const dx = x - w / 2 + 9, dy = top + 10, dw = w - 18, dh = 52;
    rr(ctx, dx, dy, dw, dh, 6); ctx.fillStyle = mix(c.bgDeep, c.label, 0.4); ctx.fill();
    const n = 6, lit = fill * 4.4 + 0.12 * Math.sin(TAU * 1.3 * t) * fill;
    for (let i = 0; i < n; i++) {
      const bh = 6, by = dy + dh - 8 - i * 7.2, on = clamp01(lit - i);
      ctx.fillStyle = on > 0 ? alpha(i < 4 ? c.good : c.warning, 0.35 + 0.65 * on) : alpha(c.bgSurface, 0.12);
      ctx.fillRect(dx + 6, by - bh, dw - 12, bh - 1);
    }
    // knob
    ctx.fillStyle = mix(body, c.label, 0.45); ctx.beginPath(); ctx.arc(x, top + h - 15, 6, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
