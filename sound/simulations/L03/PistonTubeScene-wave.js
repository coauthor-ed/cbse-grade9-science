// PistonTubeScene-wave.js - slide "The Particles Stay in Place" (blk-l03-s05, 3 beats). New 2026-11-03.
// The kit piston tube (piston at the LEFT) driven forward and back again and again; the air dots
// are a SimWave strip on the computed field s(d, t) = f(t - d / v), so C and R travel while every
// dot, the red one most of all, only vibrates about its own mean place.
// b0 C R C R travel, red particle with its range; b1 the same plus the direction of propagation;
// b2 the open end leads to an ear: a soft glow rides each compression (energy travels), the ear
// glows when a compression arrives, and the dots beside the ear only vibrate.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, alpha } from 'simulations/base/kit/SimLook.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { pistonSource, waveField, drawParticleStrip, drawPropagationArrow } from 'simulations/base/kit/SimWave.js';
import { drawPistonTube } from 'simulations/base/kit/SimApparatus.js';
import { drawEar } from '../shared/SoundArt.js';

const A = 22, T = 2, V = 130;                    // stroke, period (s), speed: wavelength 260 px, A = 0.085 wavelength (R readable)
const POS0 = 52;                                 // piston face at its mean place, px from the tube's left end
const T_FILL = 30;                               // the tube is already full of waves on landing
const LONG = { x: 100, y: 262, len: 568, d: 170, rod: 46 };  // b0, b1
const SHORT = { ...LONG, len: 372 };                          // b2: room for the listener's head
const FLOOR = 478;
const EAR = { x: 604, y: LONG.y + 6, h: 74 };                 // ear centre; the head reaches about 1.1 h to its left
const AIR_END = 536;                                          // b2: open air from the tube mouth up to the face
const D_EAR = AIR_END - 30 - (LONG.x + POS0);                 // field distance of the air just beside the ear
const FACE0 = LONG.x + POS0;
const MARK = 250;                                // the red particle's mean distance from the piston face
const FIELD = waveField({ v: V, origin: FACE0, source: pistonSource({ from: -A, repeat: T,
  strokes: [{ at: 0, to: A, dur: T / 2 }, { at: T / 2, to: -A, dur: T / 2 }] }) });
const handAt = (tb, pos) => ({ x: tb.x + pos - 20 - tb.rod - 9, y: tb.y + 4 });   // = drawPistonTube().hand
const stripFor = (x2) => ({ x: FACE0 - A - 6, y: LONG.y - LONG.d / 2, w: x2 - (FACE0 - A - 6), h: LONG.d });

export class PistonTubeWaveScene extends SimScene {
  static CONTINUOUS = true; // the piston keeps moving forward and back while the beat is on screen
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A long glass tube of air with a piston at the left moving forward and back again and again. '
    + 'Compressions, C, and rarefactions, R, travel along the tube one after another, while the red particle only moves '
    + 'to and fro about its own place. An arrow shows the direction of propagation. Then the open end of the tube leads '
    + 'to an ear: a glow travels with each compression, the ear lights up as each one arrives, and the particles beside '
    + 'the ear only vibrate.';

  constructor(container, config) {
    super(container, config);
    this.waveProbe = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, FLOOR);
    const st = Math.max(0, Math.min(2, this.stage)), t = this.t() + T_FILL;
    const tube = st === 2 ? SHORT : LONG;
    const x2 = st === 2 ? AIR_END : tube.x + tube.len - 10;
    const strip = stripFor(x2);
    const pos = POS0 + FIELD.source(t);
    this.student(ctx, c, handAt(tube, pos), () => drawPistonTube(ctx, c, { ...tube, pos }));
    if (st === 2) this.energy(ctx, c, t, strip);
    const inTube = st === 2 ? stripFor(tube.x + tube.len - 4) : strip;
    const s = drawParticleStrip(ctx, c, { ...inTube, field: FIELD, t, tube: false, spacing: 15, r: 4.4,
      densityShade: true, mark: MARK, bracket: true, tags: true });
    if (st === 2) {
      // Past the tube mouth the air goes on to the ear: same dots and field, no shading box, a faded open end;
      // the head is drawn over its far edge.
      const ox = tube.x + tube.len + 6;
      drawParticleStrip(ctx, c, { x: ox, y: strip.y, w: AIR_END - ox, h: strip.h, field: FIELD, t, tube: false, spacing: 15, r: 4.4,
        seed: 3, clip: false, fadeEnd: 36 });
      this.listener(ctx, c, this.listen(t), this.t());
    }
    if (st === 1) drawPropagationArrow(ctx, c, { x: 170, y: 400, len: 440, label: 'direction of propagation', side: 'below' });
    this.waveProbe = { t, marked: s.marked && { x: +s.marked.x.toFixed(1), mean: s.marked.mean, amp: s.marked.amp },
      regions: s.regions.map((g) => ({ kind: g.kind, x: +g.x.toFixed(1), tagged: !!g.tagged })) };
  }

  /** You at the left end, hands on the piston handle (the kit's hand point: hx - 9, y + 4). */
  student(ctx, c, h, tubeDraw) {
    const you = figureFor(this, { role: 'student', i: 0, x: 52, y: FLOOR, height: 360, facing: 1,
      pose: { name: 'stand' }, hands: [{ x: h.x, y: h.y - 14 }, { x: h.x - 2, y: h.y + 16 }] });
    // The tube is painted between the torso and the near arm: the handle crosses in front of the body, the hand grips it.
    drawFigure(ctx, c, you, you.look, { between: tubeDraw });
  }

  /** A friend standing at the open end, side view facing the tube, sized and placed so the ear is at EAR;
   *  a soft glow at the ear rises as each compression arrives. */
  listener(ctx, c, listen, age) {
    const base = { role: 'child', i: 2, x: EAR.x, y: FLOOR, facing: -1, pose: 'relax' };
    const p = solveFigure(figureFor(this, { ...base, height: 100 })).anchors.head;
    const k = (FLOOR - EAR.y) / (FLOOR - (p.y + p.r * 0.12));         // px per unit of the 100 px probe
    const spec = figureFor(this, { ...base, height: 100 * k });
    const h = solveFigure(spec).anchors.head;
    spec.x = EAR.x - (h.x - EAR.x + h.r * 0.22);
    const sk = drawFigure(ctx, c, spec, { ...spec.look, t: age });
    const hd = sk.anchors.head, ex = hd.x + hd.r * 0.22, ey = hd.y + hd.r * 0.12, R = hd.r * 1.15;
    ctx.save();
    const gr = ctx.createRadialGradient(ex, ey, 2, ex, ey, R);
    gr.addColorStop(0, alpha(c.s5, 0.8 * listen)); gr.addColorStop(1, alpha(c.s5, 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ex, ey, R, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /** The ear's glow: full as each compression reaches the air beside it, easing to a low glow until the next
   *  (waves keep arriving, so the ear is never quite still). Pure in t: C peaks where the forward stroke is fastest. */
  listen(t) {
    const since = (((t - D_EAR / V - T / 4) % T) + T) % T;
    return 0.3 + 0.7 * Math.exp(-since / 0.55);
  }

  /** A soft glow on each compression: it travels with the wave while the dots stay. */
  energy(ctx, c, t, strip) {
    const regs = FIELD.regions(t, 0, strip.x + strip.w - FACE0).filter((g) => g.kind === 'C');
    const cy = strip.y + strip.h / 2;
    ctx.save();
    for (const g of regs) {
      const gr = ctx.createRadialGradient(g.x, cy, 4, g.x, cy, 92);
      gr.addColorStop(0, alpha(c.s5, 0.5)); gr.addColorStop(1, alpha(c.s5, 0));
      ctx.fillStyle = gr; ctx.fillRect(g.x - 92, strip.y - 4, 184, strip.h + 8);
    }
    ctx.restore();
  }
}
