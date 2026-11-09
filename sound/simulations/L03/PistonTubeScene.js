// PistonTubeScene.js - slide "A Tube of Air" (blk-l03-s03, 3 beats). Rebuilt 2026-11-03.
// The kit piston tube (piston at the LEFT, book Fig 10.9) with a SimWave strip of air dots inside.
// Every dot sits at its mean place plus the computed field s(d, t) = f(t - d / v); the piston
// face is drawn at f(t), the same value the dots next to it get, so piston and air never part.
// b0 at rest (average density), b1 one forward stroke (C forms and travels), b2 forward then
// back (C ahead, R behind). Each beat loops from its own clock, so any beat is right cold.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, pill, clamp01 } from 'simulations/base/kit/SimLook.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { pistonSource, waveField, drawParticleStrip } from 'simulations/base/kit/SimWave.js';
import { drawPistonTube } from 'simulations/base/kit/SimApparatus.js';

const TUBE = { x: 100, y: 268, len: 568, d: 170, rod: 46 };
const FLOOR = 478;
const handAt = (pos) => ({ x: TUBE.x + pos - 20 - TUBE.rod - 9, y: TUBE.y + 4 });   // = drawPistonTube().hand
const POS0 = 52;                       // piston face at rest, px from the tube's left end
const FACE0 = TUBE.x + POS0;           // d = 0 of the field
const A = 42, V = 170;                 // stroke length, wave speed (px, px/s)
const STRIP = { x: FACE0 - A - 6, y: TUBE.y - TUBE.d / 2, w: TUBE.x + TUBE.len - 10 - (FACE0 - A - 6), h: TUBE.d };
// b1: one forward stroke, held. b2: forward, then back to the start.
const PUSH = waveField({ v: V, origin: FACE0, source: pistonSource({ strokes: [{ at: 0.2, to: A, dur: 0.6 }] }) });
const PUSHPULL = waveField({ v: V, origin: FACE0, source: pistonSource({ strokes: [{ at: 0.2, to: A, dur: 0.6 }, { at: 0.9, to: 0, dur: 0.6 }] }) });
const LOOP = [0, 4.0, 4.8];            // loop length per beat (s): the last region has left the tube
const OFF = [0, 2.0, 2.4];             // loop phase at landing: the beat's region is already mid-tube

export class PistonTubeScene extends SimScene {
  static CONTINUOUS = true; // b1 and b2 loop their stroke for as long as the beat is on screen
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A long glass tube of air with a piston at the left end. At rest the dots are spread evenly: average density. '
    + 'Pushing the piston forward packs the air next to it into a compression, C, which travels along the tube. '
    + 'Pulling it back spreads the air into a rarefaction, R, which travels behind the compression.';

  constructor(container, config) {
    super(container, config);
    this.waveProbe = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.stage > 0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, FLOOR);
    const st = Math.max(0, Math.min(2, this.stage));
    if (st === 0) { this.rest(ctx, c); return; }
    const P = LOOP[st], tl = (this.t() + OFF[st]) % P;
    const F = st === 1 ? PUSH : PUSHPULL;
    // b1 holds the piston forward; the restart (piston home) happens under a short fade.
    const k = st === 1 ? clamp01(Math.min(tl / 0.18, (P - tl) / 0.3)) : 1;
    ctx.save(); ctx.globalAlpha *= 0.25 + 0.75 * k;
    const pos = POS0 + F.source(tl);
    this.student(ctx, c, handAt(pos), () => drawPistonTube(ctx, c, { ...TUBE, pos }));
    const s = drawParticleStrip(ctx, c, { ...STRIP, field: F, t: tl, tube: false, spacing: 15, r: 4.4,
      densityShade: true, tags: st === 1 ? { C: 'C', R: '' } : true });
    ctx.restore();
    this.strokeCue(ctx, c, F, tl);
    this.waveProbe = { t: tl, regions: s.regions.map((g) => ({ kind: g.kind, x: +g.x.toFixed(1), tagged: !!g.tagged })), minGap: s.minGap };
  }

  rest(ctx, c) {
    this.student(ctx, c, handAt(POS0), () => drawPistonTube(ctx, c, { ...TUBE, pos: POS0 }));
    drawParticleStrip(ctx, c, { ...STRIP, field: null, tube: false, spacing: 15, r: 4.4 });
    pill(ctx, c, 'average density', TUBE.x + TUBE.len / 2 + 20, STRIP.y - 40, { bg: c.raised, size: 28, display: true });
    this.waveProbe = { t: 0, regions: [] };
  }

  /** You, standing at the left end with both hands on the piston handle: the stroke has a doer. */
  student(ctx, c, h, tubeDraw) {
    const you = figureFor(this, { role: 'student', i: 0, x: 52, y: FLOOR, height: 360, facing: 1,
      pose: { name: 'stand' }, hands: [{ x: h.x, y: h.y - 14 }, { x: h.x - 2, y: h.y + 16 }] });
    // The tube is painted between the torso and the near arm: the handle crosses in front of the body, the hand grips it.
    drawFigure(ctx, c, you, you.look, { between: tubeDraw });
  }

  /** "push" / "pull" under the tube's left end while the piston moves that way. */
  strokeCue(ctx, c, F, tl) {
    const v = F.source(tl + 0.02) - F.source(tl - 0.02);
    if (Math.abs(v) < 0.05) return;
    pill(ctx, c, v > 0 ? 'push' : 'pull', FACE0 + 30, STRIP.y + STRIP.h + 46, { bg: v > 0 ? c.s5 : c.s2, size: 28, display: true });
  }
}
