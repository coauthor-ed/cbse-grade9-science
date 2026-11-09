// MicSpeakerScene.js - slide "Microphone and Speaker" (blk-l03-n03), 2 beats.
// One chain, left to right: sound arcs arrive at a microphone (cutaway), the diaphragm moves in
// time with them, the signal travels along the wire, and a speaker (cutaway) at the far end moves
// its cone with the same signal and sends out arcs with the same spacing.
// Timing is one number, F: the arcs move at 1.2 wavelengths per second (drawSoundArcs default),
// so an arc arrives at the mic each 1/F s; the diaphragm is cos(2 pi F t) (pushed in as an arc
// lands); the wire carries cos(2 pi (F t - CYC u)); with CYC whole, the cone at u = 1 moves
// exactly as the diaphragm did, and the speaker sends an arc out each time the cone pushes out.
// b0: the mic is named (diaphragm), the speaker end dimmed. b1: the speaker is named (cone).
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawBench, pill } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawMicrophone, drawSpeaker, drawSignalWire } from 'simulations/base/kit/SimApparatus.js';

const TAU = Math.PI * 2;
const WL = 38, F = 1.2;                         // arc spacing (px) and arcs per second, in and out
const CYC = 3;                                  // whole cycles on the wire
const BENCH_Y = 452;
const MIC = { x: 184, y: 200, r: 60 };
const SPK = { x: 540, r: 78 };

export class MicSpeakerScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static CONTINUOUS = true;                    // sound keeps arriving and leaving while the beat is on
  static ARIA_LABEL = 'Sound arcs arrive at a microphone, shown cut open. Its thin diaphragm moves in and out in time with them, and a signal travels along the wire. At the other end a speaker, also cut open, moves its cone with the same signal and sends out sound arcs with the same spacing.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) { this.cur = stage; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'grid');
    drawBench(ctx, c, 14, 666, BENCH_Y, { h: 80 });
    const t = this.age + 0.4;
    const b1 = this.cur === 1;
    const sig = (u, tt) => Math.cos(TAU * (F * tt - CYC * u));
    const dia = sig(0, t), cone = sig(1, t);
    // the microphone end
    ctx.save(); ctx.globalAlpha *= b1 ? 0.5 : 1;
    drawSoundArcs(ctx, c, { x: MIC.x - MIC.r * 0.2, y: MIC.y, dir: Math.PI, spread: 1.0, n: 3, wavelength: WL, r0: MIC.r + 6, t, reverse: true, strength: 0.9 });
    const mic = drawMicrophone(ctx, c, { x: MIC.x, y: MIC.y, r: MIC.r, len: 112, facing: -1, tilt: 0.3, cutaway: true, diaphragm: dia, stand: true, standY: BENCH_Y });
    ctx.restore();
    // the speaker end
    ctx.save(); ctx.globalAlpha *= b1 ? 1 : 0.38;
    const sp = drawSpeaker(ctx, c, { x: SPK.x, y: BENCH_Y - SPK.r * 1.85, r: SPK.r, cone: b1 ? cone : 0, facing: 1, cutaway: true });
    ctx.restore();
    if (b1) drawSoundArcs(ctx, c, { x: sp.cone.x, y: sp.cone.y, dir: 0, spread: 1.0, n: 3, wavelength: WL, r0: SPK.r * 0.55, t, strength: 0.9 });
    // the wire and its signal IN it (glow and beads on the crests): drawn after both ends so it lies on top
    const w = drawSignalWire(ctx, c, { a: mic.wireOut, b: sp.wireIn, sag: 96, t, cycles: CYC, trace: sig, style: 'pulse' });
    // one name per beat, set right beside its part (no leader line)
    if (!b1) {
      const g = mic.grille;
      pill(ctx, c, 'diaphragm', g.x + 8, g.y - g.r - 40, { size: 28, bg: c.raised, fg: c.label });
    } else {
      const k = sp.cone;
      pill(ctx, c, 'cone', k.x - 8, k.y - SPK.r * 1.35 - 34, { size: 28, bg: c.raised, fg: c.label });
    }
    return w;
  }
}
