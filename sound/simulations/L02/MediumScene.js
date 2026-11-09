/**
 * MediumScene - two slides (L02). New 2026-11-03; replaces MediumPathScene.js (kept on disk, unused).
 *   "Medium and Vacuum" (2 beats) and "What Travels?" (1 beat): static BEAT_MAPS keyed by beat count.
 *
 * stage 0 three large windows: wood (solid: dense particles on a wood-grain ground), water
 *    (liquid: closer particles, blue tint), air (gas: sparse particles). FC2 2026-11-03: larger
 *    windows, tag off the bracket line, stage 1 drops the three state tags (4 tags at most). In each, one SimWave
 *    pulse passes left to right through the particles (computed field: each particle moves
 *    about its own place; one red particle per window). Tags solid / liquid / gas, and one
 *    "medium" tag above all three.
 * stage 1 a fourth window joins: empty (dashed outline, no particles), a small tuning fork at its
 *    left edge vibrating, no arcs and no pulse inside it, a "?". The answer is the next slide.
 * stage 2 a room: a friend holds a struck tuning fork at the left, you listen at the right
 *    (ear lit); the room air is a still, soft-edged dot region (no compressions, nothing
 *    moving, no arrows); one dashed "?" track from the fork to the ear.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, pill, alpha, lighten, darken, mix, font, rr, clamp01 } from 'simulations/base/kit/SimLook.js';
import { waveField, pistonSource, drawParticleStrip, drawRings } from 'simulations/base/kit/SimWave.js';
import { drawTuningFork } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawEar } from '../shared/SoundArt.js';

const LBL = { size: 26, display: true };
const PULSE_EVERY = 3;
const T_REST = 2 * PULSE_EVERY + 0.78;     // the frame each medium comes to rest on: a pulse inside every window
const MEDIA = [
  { key: 'solid', spacing: 10, v: 230, seed: 3 },
  { key: 'liquid', spacing: 14, v: 170, seed: 5 },
  { key: 'gas', spacing: 25, v: 110, seed: 9 },
];
const WIN_Y = 112, WIN_H = 300;          // large windows: at 390 the four sit side by side (no portrait flag in the kit)
const GROUND = 470;

function pulseField(m, x0) {
  const A = m.spacing * 0.75;
  return waveField({ source: pistonSource({ from: 0, repeat: PULSE_EVERY, strokes: [{ at: 0.15, to: A, dur: 0.22 }, { at: 0.37, to: 0, dur: 0.4 }] }), v: m.v, origin: x0 });
}

export class MediumScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static BEAT_MAPS = { 2: [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]], 1: [[{ idx: 2, dwellMs: null }]] };
  static ARIA_LABEL = 'Three windows of matter: wood, water and air, from closely packed particles to sparse ones. A pulse of sound passes through each, the particles moving about their places. A fourth, empty window joins: a vacuum with a small vibrating tuning fork at its edge and a question mark. On the next slide, a friend across a room strikes a tuning fork and you hear it; the still air between you holds a dashed question track.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) {
    const max = this.beatCount === 1 ? 2 : 1;
    this.cur = this.beatCount === 1 ? 2 : Math.max(0, Math.min(max, stage | 0));
  }
  busy() { return this.age < (this.cur === 2 ? 3 : T_REST); }

  draw(ctx, c) {
    if (this.cur === 2) this._room(ctx, c, Math.min(this.age, 3));
    else this._windows(ctx, c, Math.min(this.age, T_REST), this.cur === 1);
  }

  // ---- stages 0 and 1 ------------------------------------------------------
  _windows(ctx, c, t, vac) {
    drawBackdrop(ctx, c, 'dots');
    const n = vac ? 4 : 3, gap = vac ? 6 : 12, w = vac ? 162 : 214;
    const x0 = (680 - n * w - (n - 1) * gap) / 2;
    const xs = Array.from({ length: n }, (_, i) => x0 + i * (w + gap));
    for (let i = 0; i < 3; i++) this._medium(ctx, c, MEDIA[i], xs[i], w, t);
    if (vac) this._vacuum(ctx, c, xs[3], w, t);
    // one tag over the three media, with a bracket under it
    const bx0 = xs[0] + 8, bx1 = xs[2] + w - 8, by = WIN_Y - 14;
    ctx.save(); ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx0, by + 10); ctx.lineTo(bx0, by); ctx.lineTo(bx1, by); ctx.lineTo(bx1, by + 10); ctx.stroke(); ctx.restore();
    // the tag sits above the bracket, clear of its line
    pill(ctx, c, 'medium', (bx0 + bx1) / 2, by - 40, { ...LBL, bg: c.accent, ink: c.bgSurface });
    // fewer tags with the vacuum window: only 'vacuum' under the windows (4 tags at most)
    if (vac) pill(ctx, c, 'vacuum', xs[3] + w / 2, WIN_Y + WIN_H + 34, { ...LBL, bg: c.raised, ink: c.label });
    else for (let i = 0; i < 3; i++) pill(ctx, c, MEDIA[i].key, xs[i] + w / 2, WIN_Y + WIN_H + 34, { ...LBL, bg: c.raised, ink: c.label });
  }

  _frame(ctx, c, x, w, dashed) {
    ctx.save();
    rr(ctx, x, WIN_Y, w, WIN_H, 14);
    ctx.lineWidth = 4; ctx.strokeStyle = darken(c.stroke, 0.1);
    if (dashed) ctx.setLineDash([12, 9]);
    ctx.stroke(); ctx.restore();
  }

  _medium(ctx, c, m, x, w, t) {
    ctx.save();
    rr(ctx, x, WIN_Y, w, WIN_H, 14); ctx.clip();
    if (m.key === 'solid') {
      const wood = mix(c.s8, c.setSand, 0.45);
      const g = ctx.createLinearGradient(x, WIN_Y, x + w, WIN_Y + WIN_H);
      g.addColorStop(0, lighten(wood, 0.25)); g.addColorStop(1, darken(wood, 0.08));
      ctx.fillStyle = g; ctx.fillRect(x, WIN_Y, w, WIN_H);
      // wood grain, plus a sawn edge strip along the top
      ctx.strokeStyle = alpha(darken(wood, 0.3), 0.35); ctx.lineWidth = 2;
      for (let k = 0; k < 9; k++) {
        const y = WIN_Y + 18 + k * 27;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let xx = x; xx <= x + w; xx += 12) ctx.lineTo(xx, y + 5 * Math.sin((xx - x) / 34 + k * 1.3) + 3 * Math.sin((xx - x) / 11 + k));
        ctx.stroke();
      }
      ctx.fillStyle = darken(wood, 0.25); ctx.fillRect(x, WIN_Y, w, 12);
      ctx.fillStyle = alpha(lighten(wood, 0.5), 0.8); ctx.fillRect(x, WIN_Y + 12, w, 2);
    } else if (m.key === 'liquid') {
      const g = ctx.createLinearGradient(0, WIN_Y, 0, WIN_Y + WIN_H);
      g.addColorStop(0, alpha(lighten(c.water, 0.35), 0.45)); g.addColorStop(1, alpha(c.water, 0.6));
      ctx.fillStyle = g; ctx.fillRect(x, WIN_Y, w, WIN_H);
      ctx.strokeStyle = alpha(lighten(c.water, 0.6), 0.8); ctx.lineWidth = 2.5;
      ctx.beginPath(); for (let xx = x; xx <= x + w; xx += 8) (xx === x ? ctx.moveTo(xx, WIN_Y + 16) : ctx.lineTo(xx, WIN_Y + 16 + 3 * Math.sin((xx - x) / 14)));
      ctx.stroke();
    } else {
      ctx.fillStyle = alpha(lighten(c.s1, 0.8), 0.35); ctx.fillRect(x, WIN_Y, w, WIN_H);
    }
    const px = x + 8, pw = w - 16;
    drawParticleStrip(ctx, c, { x: px, y: WIN_Y + 22, w: pw, h: WIN_H - 34, field: pulseField(m, px), t, spacing: m.spacing, r: m.key === 'gas' ? 4 : 3.4,
      seed: m.seed, tube: false, mark: pw * 0.5, densityShade: true });
    ctx.restore();
    this._frame(ctx, c, x, w, false);
  }

  _vacuum(ctx, c, x, w, t) {
    ctx.save();
    rr(ctx, x, WIN_Y, w, WIN_H, 14);
    ctx.fillStyle = alpha(c.bgDeep, 0.06); ctx.fill();
    ctx.restore();
    this._frame(ctx, c, x, w, true);
    // the source: a small fork at the left edge, vibrating; nothing leaves it in here
    drawTuningFork(ctx, c, { x: x + 30, y: WIN_Y + WIN_H - 16, h: 150, vib: 0.85 * clamp01(t / 0.3), t, freq: 6, shadowY: WIN_Y + WIN_H - 14 });
    ctx.save(); ctx.font = font(c, 700, 72, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = c.labelMuted; ctx.fillText('?', x + w * 0.66, WIN_Y + WIN_H * 0.42); ctx.restore();
  }

  // ---- stage 2 ---------------------------------------------------------------
  _room(ctx, c, t) {
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, GROUND, {});
    // the room air: a still, soft-edged region of dots (no field: every dot at its place)
    // only between the fork and your ear, at head height; soft edges; no dots over the people
    drawRings(ctx, c, { cx: 360, cy: 230, R: 460, field: null, t: 0, source: false, spacing: 26, r: 3.4, seed: 17, mask: { x: 236, y: 130, w: 296, h: 190 }, maskFade: 48 });
    const fork = { x: 198, y: 352, h: 176 };
    const grip = { x: fork.x, y: fork.y - fork.h * 0.3 * 0.52 };
    const fr = figureFor(this, { role: 'student', x: 100, y: GROUND, height: 300, facing: 1, i: 2, pose: 'stand', autoReach: false, hands: [grip, null] });
    drawFigure(ctx, c, fr, fr.look, { between: () => drawTuningFork(ctx, c, { x: fork.x, y: fork.y, h: fork.h, vib: 0.8, t, freq: 6 }) });
    const you = figureFor(this, { role: 'student', x: 584, y: GROUND, height: 300, facing: -1, i: 5, pose: 'stand', autoReach: false });
    drawFigure(ctx, c, you, you.look);
    const hd = solveFigure(you).anchors.head;
    const ear = { x: hd.x + hd.r * 0.12, y: hd.y + hd.r * 0.16 };
    drawEar(ctx, c, { x: ear.x, y: ear.y, h: hd.r * 0.95, facing: -1, listen: 0.8 * clamp01(t / 0.6) });
    // one dashed question track from the prongs to the ear
    const a = { x: fork.x + 22, y: fork.y - fork.h * 0.8 }, b = { x: ear.x - 26, y: ear.y };
    const mid = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 70 };
    ctx.save(); ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 3.5; ctx.setLineDash([12, 10]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mid.x, mid.y, b.x, b.y); ctx.stroke(); ctx.restore();
    pill(ctx, c, '?', mid.x, (a.y + b.y) / 4 + mid.y / 2, { size: 34, display: true, bg: c.raised, ink: c.label });
  }
}
