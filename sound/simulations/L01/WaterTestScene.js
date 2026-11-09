/**
 * WaterTestScene - slide "The Water Test" (L01, blk-l01-s07), 2 beats. New 2026-11-03.
 *
 * b0 a student holds a vibrating tuning fork by the stem, prongs down, above a wide dish of
 *    water. The prongs are a blur (kit fork vib at a high rate): tag "too fast to see". The
 *    fork lowers (eased; only the arm moves) until one prong tip just touches the surface.
 *    The water is still until that moment.
 * b1 the prong in the water: rings spread from the contact point across the surface in
 *    perspective. Ring k is born at t_k = k / F_FORK (one per prong swing), radius =
 *    V_RING x (t - t_k), fading with radius. A few droplets jump at the prong. A round inset
 *    shows the prong tip magnified and slowed, moving to and fro over the water, with a
 *    double arrow.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, drawBench, pill, alpha, lighten, darken, inOutSine, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawTuningFork } from 'simulations/base/kit/SimApparatus.js';
import { drawVibrationArrow } from 'simulations/base/kit/SimWave.js';
import { figureFor, solveFigure, paintFigure } from 'simulations/base/kit/SimFigure.js';
import { drawWaterDish } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const BENCH = { x0: 150, x1: 676, y: 446 };
const DISH = { x: 418, w: 430, d: 42 };
const FORK_H = 162, FORK_A = Math.PI - 0.9;       // prongs down and right, tilted so only one prong tip reaches the water (the other is about 23 px higher)
const F_FORK = 14;                                // the prongs' rate on screen (a blur)
const V_RING = 290;                               // ring speed on the surface (px/s): spacing = V_RING / F_FORK
const LIFT = 24;                                // how high the fork starts above the touch (b0)
const T_LOWER0 = 0.5, T_LOWER1 = 2.3;
const TEND = [3.0, 3.6];
const ST = { x: 170, y: 620, height: 460, lean: 15 };
const INSET = { x: 572, y: 128, r: 92 };

export class WaterTestScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A student holds a vibrating tuning fork by its stem, prongs down, over a wide dish of water; the prongs are a blur, too fast to see. The fork lowers until one prong just touches the water. Then rings of waves spread out across the water from the prong and a few droplets jump; a round close-up shows the prong tip moving to and fro.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.cal = null;
  }

  enter(stage) { this.cur = Math.max(0, Math.min(1, stage | 0)); }

  busy() { return this.age < TEND[this.cur]; }

  t() { return Math.min(this.age, TEND[this.cur]); }

  // the fork's tips and grip relative to its stem end, measured once with an invisible draw
  _calibrate(ctx, c) {
    if (this.cal) return this.cal;
    ctx.save(); ctx.globalAlpha = 0;
    const f = drawTuningFork(ctx, c, { x: 0, y: 0, h: FORK_H, angle: FORK_A, vib: 0, t: 0 });
    ctx.restore();
    const low = f.tips[0].y > f.tips[1].y ? 0 : 1;
    this.cal = { tip: f.tips[low], other: f.tips[1 - low], grip: f.grip };
    return this.cal;
  }

  draw(ctx, c) {
    const t = this.t();
    const K = this._calibrate(ctx, c);
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 500, {});
    // the dish surface is known before drawing (SoundArt geometry), so the hand can be solved first
    const S = { cx: DISH.x, cy: BENCH.y - DISH.d + 7, rx: DISH.w / 2 - 6, ry: DISH.w * 0.13 - 2 };
    // the touch is near the back of the surface, so the higher prong tip sits clear above the
    // water line behind it instead of over the water
    const contact = { x: S.cx - S.rx * 0.04, y: S.cy - S.ry * 0.55 };
    const down = this.cur === 0 ? inOutSine(clamp01((t - T_LOWER0) / (T_LOWER1 - T_LOWER0))) : 1;
    const stem = { x: contact.x - K.tip.x, y: contact.y - K.tip.y - LIFT * (1 - down) };
    const grip = { x: stem.x + K.grip.x, y: stem.y + K.grip.y };
    const spec = figureFor(this, { role: 'student', x: ST.x, y: ST.y, height: ST.height, facing: 1, i: 0, pose: { name: 'stand', lean: ST.lean }, autoReach: false, mood: 'smile', hands: [grip, null] });
    const sk = solveFigure(spec);
    // the student stands behind the bench: body first, then bench and dish, then fork and arm
    paintFigure(ctx, c, sk, spec.look, { layer: 'back' });
    paintFigure(ctx, c, sk, spec.look, { layer: 'mid' });
    drawBench(ctx, c, BENCH.x0, BENCH.x1, BENCH.y, { h: 520 - BENCH.y });
    drawWaterDish(ctx, c, { x: DISH.x, y: BENCH.y, w: DISH.w, d: DISH.d });
    const touching = down >= 1;
    if (this.cur === 1) this._rings(ctx, c, S, contact, t);
    else if (touching) this._dimple(ctx, c, S, contact);
    // the fork: the lower prong tip lands exactly on the contact point
    // too fast to see: the kit fork sampled at five phases of one swing, faint, then the fork
    // itself, so the prongs read as a blur (frames depend on t only)
    ctx.save(); ctx.globalAlpha = 0.22;
    for (let k = 1; k <= 5; k++) drawTuningFork(ctx, c, { x: stem.x, y: stem.y, h: FORK_H, angle: FORK_A, vib: 1, t: t + k / (5 * F_FORK), freq: F_FORK });
    ctx.restore();
    drawTuningFork(ctx, c, { x: stem.x, y: stem.y, h: FORK_H, angle: FORK_A, vib: 1, t, freq: F_FORK });
    paintFigure(ctx, c, sk, spec.look, { layer: 'front', noShadow: true });
    if (this.cur === 1) { this._droplets(ctx, c, contact, t); this._inset(ctx, c, t); }
    if (this.cur === 1) pill(ctx, c, 'rings of waves', S.cx + S.rx * 0.5, S.cy + S.ry * 0.2, { ...LBL, bg: c.raised, ink: c.label });
  }

  _dimple(ctx, c, S, p) {
    ctx.save();
    ctx.strokeStyle = alpha(lighten(c.water, 0.7), 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 9, 9 * S.ry / S.rx, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  _rings(ctx, c, S, p, t) {
    const R = S.rx * 1.25, life = R / V_RING, k0 = Math.ceil((t - life) * F_FORK), k1 = Math.floor(t * F_FORK);
    const q = S.ry / S.rx;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(S.cx, S.cy, S.rx - 1, S.ry - 1, 0, 0, TAU); ctx.clip();
    const crest = lighten(c.water, 0.78), trough = darken(c.water, 0.35);
    for (let k = k0; k <= k1; k++) {
      const r = V_RING * (t - k / F_FORK);
      if (r <= 2 || r > R) continue;
      const fade = Math.pow(1 - r / R, 1.3);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = alpha(trough, 0.5 * fade);
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 1.6, r, r * q, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = alpha(crest, 0.95 * fade);
      ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * q, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  _droplets(ctx, c, p, t) {
    const col = lighten(c.water, 0.55);
    for (let i = 0; i < 5; i++) {
      const u = (t * 1.9 + i * 0.37) % 1, side = i % 2 ? 1 : -1;
      const x = p.x + side * (6 + 30 * u) * (0.6 + 0.2 * i), y = p.y - 46 * u * (1 - u) * 4 * (0.5 + 0.12 * i);
      const r = 3.2 - 0.3 * i;
      ctx.fillStyle = alpha(col, 0.9 * (1 - u * 0.6));
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = alpha(darken(c.water, 0.3), 0.6 * (1 - u * 0.6)); ctx.lineWidth = 1; ctx.stroke();
    }
  }

  // magnified, slowed prong tip at the water line, with a double arrow
  _inset(ctx, c, t) {
    const { x, y, r } = INSET, wl = y + r * 0.42;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = c.raised; ctx.fill();
    ctx.clip();
    // the water below the line, a few slow rings in section
    ctx.fillStyle = alpha(c.water, 0.45); ctx.fillRect(x - r, wl, 2 * r, r);
    ctx.strokeStyle = alpha(darken(c.water, 0.3), 0.9); ctx.lineWidth = 2;
    const sw = 14 * Math.sin(TAU * 0.9 * t);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const xx = x - r + (2 * r * i) / 40, d = Math.abs(xx - x);
      const yy = wl + 4 * Math.sin(d * 0.12 - TAU * 0.9 * t) * Math.exp(-d / 70);
      if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
    }
    ctx.stroke();
    // the prong, three times bigger: a fork drawn so its lower tip sits at the water line
    ctx.translate(x + sw, wl + 2); ctx.scale(3, 3);
    const K = this.cal;
    drawTuningFork(ctx, c, { x: -K.tip.x, y: -K.tip.y, h: FORK_H, angle: FORK_A, vib: 0, t: 0 });
    ctx.restore();
    ctx.save();
    ctx.lineWidth = 4; ctx.strokeStyle = darken(c.stroke, 0.1);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.restore();
    drawVibrationArrow(ctx, c, { x, y: wl + 30, len: 64 });
    pill(ctx, c, 'prong tip', x, y + r + 26, { ...LBL, bg: c.raised, ink: c.label });
  }
}
