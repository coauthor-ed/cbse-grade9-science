/**
 * HearingRangeScene - L05 blk-l05-s03 "What Humans Hear" (2 beats). Rebuilt 2026-11-03 (whole file).
 *   b0  a frequency strip (log-like: 5-20 Hz, 20 Hz-20 kHz at 120 px a decade, 20-100 kHz), the audible
 *       band lit. A teacher with a speaker plays 100, 200 ... 1000 Hz, then 50, 40, 30, 20 Hz: a marker
 *       steps along the strip with its value; arcs from the speaker get closer together as the value
 *       rises and fade out at 20 Hz. Then a second, shorter band eases in under the strip: "older listener".
 *   b1  the strip in three zones, tagged infrasonic / audible / ultrasonic; an elephant under the
 *       infrasonic end, a person under the audible zone, a dog and a cat under the ultrasonic end, a bat
 *       flying there and a dolphin in the sea below.
 * The L07 HearingRangeScene-whistle extends this class (strip, mapping and drawing helpers).
 * Pure in the beat and this.t().
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, pill, alpha, mix, lighten, darken, rr, font, inOutSine, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawSpeaker } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawAnimal, animalLook } from 'simulations/base/kit/SimAnimal.js';
import { drawBat, drawDolphin, drawSeaCut } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const X0 = 40, XA = 150, XB = 510, X1 = 640;      // strip ends and the 20 Hz / 20 kHz edges
const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 50, 40, 30, 20];
const DT = 0.62, MOVE = 0.4;
const T_OLD = STEPS.length * DT + 0.4;

// frequency (Hz) -> strip x
function fx(f) {
  const L = Math.log10;
  if (f <= 20) return X0 + (XA - X0) * clamp01((L(f) - L(5)) / (L(20) - L(5)));
  if (f <= 20000) return XA + (XB - XA) * (L(f) - L(20)) / 3;
  return XB + (X1 - XB) * clamp01((L(f) - L(20000)) / (L(100000) - L(20000)));
}

export class HearingRangeScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A long frequency strip from below 20 hertz to above 20 kilohertz, with the audible band from 20 hertz to 20 kilohertz lit. A teacher plays sounds from a speaker: a marker steps from 100 hertz up to 1000 hertz, the sound arcs get closer together, then down from 50 hertz to 20 hertz, where the arcs fade away. A shorter band below shows an older listener: the range narrows with age. Then the strip in three zones, infrasonic, audible and ultrasonic: an elephant under infrasonic, a person under audible, and a dog, a cat, a bat and a dolphin by the ultrasonic end.';

  constructor(container, config) { super(container, config); this.mode = 'b0'; }

  fx(f) { return fx(f); }

  enter(stage) { this.mode = (stage | 0) >= 1 && stage < 100 ? 'b1' : 'b0'; }
  _tend() { return this.mode === 'b0' ? T_OLD + 1.2 : 2.6; }
  busy() { return this.age < this._tend(); }
  t() { return Math.min(this.age, this._tend()); }

  draw(ctx, c) {
    const t = this.t();
    drawBackdrop(ctx, c, 'dots');
    if (this.mode === 'b0') this._play(ctx, c, t); else this._zones(ctx, c, t);
  }

  // ---- shared strip ------------------------------------------------------------------------
  // o: { y (centre), h, zones (tint infra/ultra), dimAudible, audibleText, hi (upper lit edge x) }
  strip(ctx, c, o) {
    const y = o.y, h = o.h ?? 40, top = y - h / 2;
    ctx.save();
    rr(ctx, X0, top + 3, X1 - X0, h, h / 2); ctx.fillStyle = alpha(c.bgDeep, 0.12); ctx.fill();
    rr(ctx, X0, top, X1 - X0, h, h / 2); ctx.fillStyle = mix(c.raised, c.labelMuted, 0.18); ctx.fill();
    ctx.save(); rr(ctx, X0, top, X1 - X0, h, h / 2); ctx.clip();
    if (o.zones) {
      ctx.fillStyle = alpha(c.s5, 0.55); ctx.fillRect(X0, top, XA - X0, h);
      ctx.fillStyle = alpha(c.s4, 0.55); ctx.fillRect(XB, top, X1 - XB, h);
      // hatch: these are sounds we do not hear
      ctx.strokeStyle = alpha(c.bgSurface, 0.5); ctx.lineWidth = 3;
      for (let x = X0 - h; x < X1; x += 14) if (x < XA || x > XB - h) { ctx.beginPath(); ctx.moveTo(x, top + h); ctx.lineTo(x + h, top); ctx.stroke(); }
    }
    const hi = o.hi ?? XB;
    const g = ctx.createLinearGradient(XA, 0, XB, 0);
    g.addColorStop(0, c.s1); g.addColorStop(1, c.s3);
    ctx.globalAlpha = o.dimAudible ? 0.35 : 1;
    ctx.fillStyle = g; ctx.fillRect(XA, top, hi - XA, h);
    ctx.fillStyle = alpha(lighten(c.s1, 0.7), 0.45); ctx.fillRect(XA, top + 3, hi - XA, h * 0.22);
    ctx.globalAlpha = 1;
    ctx.restore();
    rr(ctx, X0, top, X1 - X0, h, h / 2); ctx.strokeStyle = darken(mix(c.raised, c.labelMuted, 0.3), 0.35); ctx.lineWidth = 2; ctx.stroke();
    if (o.audibleText) {
      ctx.font = font(c, 700, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = c.bgDeep; ctx.fillText(o.audibleText, (XA + XB) / 2, y + 1);
    }
    ctx.restore();
  }

  ticks(ctx, c, y, list) {
    ctx.save();
    ctx.font = font(c, 600, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const [f, text] of list) {
      const x = fx(f);
      ctx.strokeStyle = c.label; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 4); ctx.stroke();
      ctx.fillStyle = c.label; ctx.fillText(text, x, y + 8);
    }
    ctx.restore();
  }

  marker(ctx, c, x, y, text, a = 1, tone) {
    ctx.save(); ctx.globalAlpha = a;
    const col = tone ?? c.warning;
    ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x - 11, y - 14); ctx.lineTo(x + 11, y - 14); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = darken(col, 0.5); ctx.lineWidth = 2; ctx.stroke();
    if (text) pill(ctx, c, text, Math.max(70, Math.min(610, x)), y - 38, { ...LBL, bg: col, ink: darken(col, 0.8) });
    ctx.restore();
  }

  // ---- b0: the teacher's sweep -------------------------------------------------------------
  _play(ctx, c, t) {
    const GY = 290, SY = 360;
    drawFloor(ctx, c, GY, {});
    const i = Math.min(STEPS.length - 1, Math.floor(t / DT)), u = t - i * DT;
    const f = STEPS[i], fPrev = STEPS[Math.max(0, i - 1)];
    const m = i > 0 ? inOutSine(clamp01(u / MOVE)) : 1;
    const xm = fx(fPrev) + (fx(f) - fx(fPrev)) * m;
    // how strongly it is heard: full above 50 Hz, fading to nothing at 20 Hz
    const heard = f >= 50 ? 1 : clamp01((f - 20) / 30);
    const heardNow = heard;
    // teacher and speaker
    const teacher = figureFor(this, { role: 'teacher', x: 92, y: GY, height: 228, facing: 1, pose: 'stand', autoReach: false, i: 2 });
    drawFigure(ctx, c, teacher, teacher.look);
    ctx.save();
    ctx.fillStyle = darken(mix(c.labelMuted, c.bgDeep, 0.3), 0.2); ctx.fillRect(208, 216, 10, GY - 216);
    rr(ctx, 186, GY - 8, 54, 8, 3); ctx.fill();
    ctx.restore();
    const sp = drawSpeaker(ctx, c, { x: 214, y: 170, r: 40, facing: 1, cone: 0.6 * Math.sin(TAU * Math.min(6, f / 60) * t) * heardNow });
    const lam = Math.max(14, Math.min(90, 6000 / f));
    if (heardNow > 0.02) drawSoundArcs(ctx, c, { x: sp.cone.x + 14, y: sp.cone.y, dir: 0, spread: 0.85, n: 5, wavelength: lam, speed: 70, r0: 16, t, strength: 0.9 * heardNow });
    // a student listening across the room
    const st = figureFor(this, { role: 'student', x: 598, y: GY, height: 208, facing: -1, pose: 'stand', autoReach: false, i: 4 });
    // the listener hears it: a glow round the head while the sound is audible (none at 20 Hz)
    if (heardNow > 0.02) {
      const hd = solveFigure(st).anchors.head, R = hd.r * 2.4, pulse = 0.8 + 0.2 * Math.sin(TAU * 1.5 * t);
      const g = ctx.createRadialGradient(hd.x, hd.y, hd.r * 0.6, hd.x, hd.y, R);
      g.addColorStop(0, alpha(c.warning, 0.55 * heardNow * pulse)); g.addColorStop(1, alpha(c.warning, 0));
      ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hd.x, hd.y, R, 0, TAU); ctx.fill(); ctx.restore();
    }
    drawFigure(ctx, c, st, st.look);
    // the strip
    const ko = clamp01((t - T_OLD) / 0.6), old = inOutSine(ko);
    this.strip(ctx, c, { y: SY, h: 42, audibleText: 'audible range' });
    this.ticks(ctx, c, SY + 26, [[20, '20 Hz'], [100, '100'], [1000, '1000'], [20000, '20 kHz']]);
    this.marker(ctx, c, xm, SY - 24, `${f} Hz`, f < 50 ? 0.4 + 0.6 * heard : 1);
    // older listener: a shorter band eases in
    if (old > 0) {
      const y2 = 452, hi = XB + (fx(9000) - XB) * old;
      ctx.save(); ctx.globalAlpha = old;
      rr(ctx, XA, y2 - 11, XB - XA, 22, 11); ctx.strokeStyle = alpha(c.labelMuted, 0.6); ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      rr(ctx, XA, y2 - 11, hi - XA, 22, 11); ctx.fillStyle = mix(c.s1, c.s3, 0.4); ctx.fill();
      ctx.strokeStyle = darken(mix(c.s1, c.s3, 0.4), 0.4); ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      pill(ctx, c, 'older listener', XA + 6, 490, { ...LBL, align: 'left', bg: c.raised, ink: c.label, alpha: old });
    }
  }

  // ---- b1: three zones and who hears them ----------------------------------------------------
  _zones(ctx, c, t) {
    // strip at the top; land below it, and at the bottom right the sea, where the dolphin swims
    const SY = 112, GY = 418;
    drawFloor(ctx, c, GY, {});
    drawSeaCut(ctx, c, { x: 420, w: 260, y: 446, bottom: 520, rocks: false, t });
    this.strip(ctx, c, { y: SY, h: 42, zones: true });
    pill(ctx, c, 'infrasonic', 104, SY - 50, { ...LBL, bg: c.s5, ink: c.bgDeep });
    pill(ctx, c, 'audible', (XA + XB) / 2, SY - 50, { ...LBL, bg: c.s1, ink: c.bgDeep });
    pill(ctx, c, 'ultrasonic', 576, SY - 50, { ...LBL, bg: c.s4, ink: c.bgDeep });
    this.ticks(ctx, c, SY + 26, [[20, '20 Hz'], [20000, '20 kHz']]);
    const k = (d) => inOutSine(clamp01((t - d) / 0.6));
    ctx.save();
    ctx.globalAlpha = k(0.1);
    drawAnimal(ctx, c, { kind: 'elephant', x: 104, y: GY, length: 180, facing: 1, pose: 'stand' }, animalLook(c, 'elephant', { t }));
    ctx.globalAlpha = k(0.3);
    const p = figureFor(this, { role: 'student', x: 300, y: GY, height: 196, facing: 0, pose: 'stand', autoReach: false, i: 3 });
    drawFigure(ctx, c, p, p.look);
    ctx.globalAlpha = k(0.5);
    drawAnimal(ctx, c, { kind: 'dog', x: 470, y: GY, length: 124, facing: -1, pose: 'stand' }, animalLook(c, 'dog', { t }));
    drawAnimal(ctx, c, { kind: 'cat', x: 596, y: GY, length: 88, facing: -1, pose: 'stand' }, animalLook(c, 'cat', { t }));
    ctx.globalAlpha = k(0.7);
    drawBat(ctx, c, { x: 590, y: 236, s: 0.9, dir: -1, flap: 0.15 + 0.1 * Math.sin(TAU * 0.8 * t) });
    drawDolphin(ctx, c, { x: 560, y: 486, s: 0.6, dir: -1, swim: (t * 0.8) % 1 });
    ctx.restore();
  }
}
