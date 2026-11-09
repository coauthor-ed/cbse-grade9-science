/**
 * DeskScene - slide "Through a Desk" (L02), 2 beats. New 2026-11-03.
 *
 * b0 a long desk across the stage; you stand at its left end, a friend at the right end
 *    scratches the desk top with one finger (only the hand moves, to and fro; one fixed pose,
 *    auto-reach off). Sound arcs travel through the AIR above the desk to your ear; the ear
 *    glows faintly.
 * b1 you bend once (eased, 0.5 s, then still) until one ear rests on the desk top, your hand
 *    over the other ear. The friend scratches again: the arcs now run INSIDE the wood (clipped
 *    to the desk top, the same arc style) and reach your ear, which glows strongly. No air arcs.
 * Book Fig 10.5.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, drawBench, pill, alpha, lighten, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure, solveFigure, figureMetrics } from 'simulations/base/kit/SimFigure.js';
import { drawEar } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const GROUND = 488;
const FH = 390;                       // both people
const DESK = { x0: 112, x1: 596 };
const YOU = { x: 92 }, FRIEND = { x: 628 };
const SCR = { x: 556, amp: 8, f: 1.8 };   // the scratch: where, how far, how often (to and fro)
const BEND = { lean: 84, tilt: 36, dur: 0.6 };
const WL = 44, V_ARC = 110;
const TEND = 6;

export class DeskScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A long desk. A friend at one end scratches the desk top with a finger; you stand at the other end and sound arcs reach your ear through the air. Next, you bend and press one ear to the desk, a hand over your other ear: the arcs now travel inside the wooden desk top to your ear, which glows brightly.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.bend = null;
  }

  enter(stage) { this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(1, stage | 0)); }
  busy() { return this.age < TEND; }

  _you(k, o = {}) {
    return figureFor(this, { role: 'student', x: YOU.x, y: GROUND, height: FH, facing: 1, i: 1, autoReach: false,
      pose: { name: 'stand', lean: BEND.lean * k, tilt: BEND.tilt * k, crouch: (this._bendCrouch() ?? 0) * k }, ...o });
  }

  // the crouch at which the bent head rests on the desk top (pure; found once)
  _bendCrouch() {
    if (this.bend != null) return this.bend;
    this.bend = 0;
    const top = this._top();
    let best = 1e9;
    for (let cr = 0; cr <= 0.35 + 1e-9; cr += 0.01) {
      const sp = figureFor(this, { role: 'student', x: YOU.x, y: GROUND, height: FH, facing: 1, i: 1, autoReach: false, pose: { name: 'stand', lean: BEND.lean, tilt: BEND.tilt, crouch: cr } });
      const h = solveFigure(sp).anchors.head, miss = Math.abs(h.y + h.r * 0.92 - top);
      if (miss < best) { best = miss; this.bend = cr; }
    }
    return this.bend;
  }

  _top() {
    const b = figureFor(this, { role: 'student', x: 0, y: GROUND, height: FH, i: 1 }).build;
    return GROUND - figureMetrics(FH, b).deskTop;
  }

  draw(ctx, c) {
    const t = Math.min(this.age, TEND), b1 = this.cur === 1;
    const top = this._top();
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, {});

    // the friend at the right end: one fixed stance; only the near hand moves, to and fro
    const sx = SCR.x + SCR.amp * Math.sin(TAU * SCR.f * t);
    const fr = figureFor(this, { role: 'student', x: FRIEND.x, y: GROUND, height: FH, facing: -1, i: 4, autoReach: false,
      pose: { name: 'stand', lean: 34, crouch: 0.12 }, hands: [{ x: sx, y: top - 3 }, null] });
    // a table with legs, a lit top with grain and an apron (kit bench at desk height)
    drawBench(ctx, c, DESK.x0, DESK.x1, top, { h: GROUND - top });
    drawFigure(ctx, c, fr, fr.look);
    // scratch marks at the fingertip
    ctx.save(); ctx.strokeStyle = alpha(c.labelMuted, 0.7); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const dy of [-12, -20]) { ctx.beginPath(); ctx.moveTo(SCR.x - 16, top + dy); ctx.lineTo(SCR.x - 8, top + dy - 3); ctx.moveTo(SCR.x + 8, top + dy - 3); ctx.lineTo(SCR.x + 16, top + dy); ctx.stroke(); }
    ctx.restore();

    // you: upright (b0) or bent once onto the desk top (b1)
    const k = b1 ? inOutSine(clamp01(t / BEND.dur)) : 0;
    let you = this._you(k);
    const hd0 = solveFigure(you).anchors.head;
    // b1: the near hand closes the other ear (on the side of the head, not the crown)
    if (b1) you = this._you(k, { hands: [{ x: hd0.x - hd0.r * 0.3, y: hd0.y - hd0.r * 0.2 }, null] });
    const hd = solveFigure(you).anchors.head;
    drawFigure(ctx, c, you, you.look);

    const src = { x: SCR.x, y: top - 8 };
    if (!b1) {
      // through the air: arcs from the scratch to your ear, growing from the source
      const ear = { x: hd.x - hd.r * 0.12, y: hd.y + hd.r * 0.16 };
      const dist = Math.hypot(ear.x - src.x, ear.y - src.y), dir = Math.atan2(ear.y - src.y, ear.x - src.x);
      const reach = Math.min(dist - 20, 16 + t * V_ARC);
      ctx.save(); ctx.beginPath(); ctx.arc(src.x, src.y, reach, 0, TAU); ctx.clip();
      drawSoundArcs(ctx, c, { x: src.x, y: src.y, dir, spread: 0.26, n: Math.floor((dist - 30) / WL), wavelength: WL, r0: 14, t, speed: 60, strength: 0.75 });
      ctx.restore();
      const arrived = clamp01((16 + t * V_ARC - (dist - 30)) / 60);
      drawEar(ctx, c, { x: ear.x, y: ear.y, h: hd.r * 0.95, facing: 1, listen: 0.3 * arrived });
      pill(ctx, c, 'air', 430, top - 196, { ...LBL, bg: c.raised, ink: c.label });
    } else {
      // through the wood: the same arcs, clipped to the desk top, from the scratch to your ear
      const ear = { x: hd.x, y: top + 2 };
      const dist = src.x - ear.x;
      const reach = Math.min(dist - 10, 16 + t * V_ARC * 1.6);
      ctx.save(); ctx.beginPath(); ctx.rect(DESK.x0 + 4, top + 1, DESK.x1 - DESK.x0 - 8, 31); ctx.clip();
      ctx.beginPath(); ctx.arc(SCR.x, top + 14, reach, 0, TAU); ctx.clip();
      drawSoundArcs(ctx, c, { x: SCR.x, y: top + 14, dir: Math.PI, spread: 0.5, n: Math.floor((dist - 20) / WL), wavelength: WL, r0: 14, t, speed: 90, strength: 1 });
      ctx.restore();
      const arrived = clamp01((16 + t * V_ARC * 1.6 - (dist - 20)) / 50);
      // the ear on the desk: a strong glow where the head rests on the wood
      const gr = ctx.createRadialGradient(ear.x, ear.y - 6, 4, ear.x, ear.y - 6, 52);
      gr.addColorStop(0, alpha(lighten(c.warning, 0.3), 0.85 * arrived)); gr.addColorStop(0.5, alpha(c.warning, 0.4 * arrived)); gr.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ear.x, ear.y - 6, 52, 0, TAU); ctx.fill();
      pill(ctx, c, 'wood', (DESK.x0 + DESK.x1) / 2, top + 78, { ...LBL, bg: c.raised, ink: c.label });
    }
    // 'you' beside the figure, never on the hair: above the bent back (b1) or level with the shoulder, in front (b0)
    const ysh = solveFigure(you).anchors.shoulder;
    pill(ctx, c, 'you', b1 ? YOU.x + 40 : ysh.x + 96, b1 ? top - 170 : ysh.y + 56, { ...LBL, bg: c.raised, ink: c.label });
    const fh = solveFigure(fr).anchors.head;
    pill(ctx, c, 'friend', fh.x - 6, fh.y - fh.r - 34, { ...LBL, bg: c.raised, ink: c.label });
  }
}
