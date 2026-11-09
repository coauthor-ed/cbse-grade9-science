/**
 * NotesScene - L05 blk-l05-n01 "Sa, Re, Ga" (2 beats). New 2026-11-03.
 *   b0  eight steps rising left to right, Sa Re Ga Ma Pa Dha Ni Sa (an arrow beside them: frequency);
 *       a marker climbs one step every 0.45 s, ending on the top Sa (hop eased); a phone shows ONE spectrum peak whose place is the step number, and arcs
 *       from the phone get closer together on each step. No Hz values (the book gives none).
 *   b1  left: a struck tuning fork, a phone with one clean peak; right: three people talking at a
 *       market, arcs of three spacings from them, a phone with many peaks. Tags "one frequency",
 *       "many frequencies".
 * Pure in the beat and this.t().
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, pill, inkOn, alpha, mix, lighten, darken, font, inOutSine, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawTuningFork } from 'simulations/base/kit/SimApparatus.js';
import { drawFigureRow, groupLook } from 'simulations/base/kit/SimFigure.js';
import { drawPhone } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const NOTES = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni', 'Sa'];
const STEP = 0.45, HOP = 0.3;
const SX = 170, SW = 58, FLOOR = 486, RISE = 47;
const MANY = [[0.08, 0.5], [0.16, 0.85], [0.25, 0.42], [0.33, 0.66], [0.43, 0.3], [0.52, 0.56], [0.62, 0.36], [0.72, 0.46], [0.83, 0.24], [0.92, 0.3]];

export class NotesScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Eight steps rise from left to right, named Sa, Re, Ga, Ma, Pa, Dha, Ni, Sa. A marker climbs one step at a time, and a phone beside them shows a single peak that moves to the right on each step: each note has a higher frequency than the one before. Then a struck tuning fork with a phone showing one clean peak, one frequency, beside people talking at a market with a phone showing many peaks, many frequencies.';

  constructor(container, config) { super(container, config); this.mode = 'b0'; }

  enter(stage) { this.mode = (stage | 0) >= 1 && stage < 100 ? 'b1' : 'b0'; }
  _tend() { return this.mode === 'b0' ? NOTES.length * STEP + 0.3 : 3.6; }
  busy() { return this.age < this._tend(); }
  t() { return Math.min(this.age, this._tend()); }

  draw(ctx, c) {
    const t = this.t();
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, FLOOR, {});
    if (this.mode === 'b0') this._stairs(ctx, c, t); else this._mix(ctx, c, t);
  }

  _stepTop(i) { return FLOOR - (i + 1) * RISE - 8; }

  _stairs(ctx, c, t) {
    const n = NOTES.length, k = Math.min(n - 1, Math.floor(t / STEP)), u = t - k * STEP;
    const tone = (i) => mix(c.s1, c.s6, i / (n - 1));
    // the steps: lit up to the marker, a top face and a shaded front
    for (let i = 0; i < n; i++) {
      const lit = i < k ? 1 : i === k ? (k > 0 ? inOutSine(clamp01((u - HOP * 0.6) / 0.35)) : 1) : 0;
      const x = SX + i * SW, y = this._stepTop(i), on = lit > 0.5, col = mix(mix(c.raised, c.labelMuted, 0.45), tone(i), lit);
      ctx.save();
      ctx.fillStyle = darken(col, 0.18); ctx.fillRect(x, y, SW, FLOOR - y);
      const g = ctx.createLinearGradient(x, 0, x + SW, 0);
      g.addColorStop(0, lighten(col, 0.08)); g.addColorStop(1, darken(col, 0.12));
      ctx.fillStyle = g; ctx.fillRect(x + 3, y + 10, SW - 6, FLOOR - y - 10);
      ctx.fillStyle = lighten(col, 0.4); ctx.fillRect(x, y, SW, 10);
      ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 1.6; ctx.strokeRect(x + 0.5, y + 0.5, SW - 1, FLOOR - y);
      ctx.font = font(c, 700, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = on ? inkOn(c, col) : c.label;
      ctx.fillText(NOTES[i], x + SW / 2, y + 34);
      ctx.restore();
    }
    // the marker: hops from the previous step to step k
    const hop = k > 0 ? inOutSine(clamp01(u / HOP)) : 1;
    const from = Math.max(0, k - 1);
    const ax = SX + from * SW + SW / 2, ay = this._stepTop(from), bx = SX + k * SW + SW / 2, by = this._stepTop(k);
    const mx = ax + (bx - ax) * hop, my = ay + (by - ay) * hop - Math.sin(Math.PI * hop) * 30 * (k > 0 ? 1 : 0);
    const R = 18;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(mx, my + 1, R * 0.9, 4, 0, 0, TAU); ctx.fillStyle = alpha(c.bgDeep, 0.2); ctx.fill();
    const g = ctx.createRadialGradient(mx - 5, my - R - 5, 2, mx, my - R, R);
    g.addColorStop(0, lighten(c.warning, 0.5)); g.addColorStop(1, darken(c.warning, 0.2));
    ctx.beginPath(); ctx.arc(mx, my - R, R, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = darken(c.warning, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    // beside the stairs: an upward arrow, the height of a step is its frequency
    const AX = SX + n * SW + 22, top = this._stepTop(n - 1);
    ctx.save(); ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(AX, FLOOR - 10); ctx.lineTo(AX, top - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(AX, top - 22); ctx.lineTo(AX - 10, top - 2); ctx.lineTo(AX + 10, top - 2); ctx.closePath(); ctx.fill();
    ctx.restore();
    pill(ctx, c, 'frequency', AX - 80, top - 62, { ...LBL, bg: c.raised, ink: c.label });
    // the phone: one peak at the note's place, arcs closer together on each step
    const ph = drawPhone(ctx, c, { x: 92, y: 262, h: 240, peaks: [{ u: 0.1 + 0.11 * k, h: 0.86 }], lit: true });
    drawSoundArcs(ctx, c, { x: 150, y: 170, dir: -0.45, spread: 0.8, n: 4, wavelength: 46 - 3.6 * k, speed: 60, r0: 16, t, strength: 0.85 });
  }

  _mix(ctx, c, t) {
    // a soft divider between the two halves
    ctx.save(); ctx.setLineDash([8, 10]); ctx.strokeStyle = alpha(c.labelMuted, 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(340, 70); ctx.lineTo(340, FLOOR - 6); ctx.stroke(); ctx.restore();
    // left: the struck fork and one peak
    const fk = drawTuningFork(ctx, c, { x: 92, y: FLOOR - 4, h: 250, vib: 0.9, t, freq: 6 });
    const tip = fk.tips ? fk.tips[1] : { x: 110, y: 240 };
    drawSoundArcs(ctx, c, { x: tip.x + 8, y: tip.y + 40, dir: 0, spread: 0.8, n: 3, wavelength: 26, speed: 40, r0: 14, t, strength: 0.8 });
    drawPhone(ctx, c, { x: 252, y: 290, h: 196, peaks: [{ u: 0.42, h: 0.88 }] });
    pill(ctx, c, 'one frequency', 172, 34, { ...LBL, bg: c.s1, ink: c.bgDeep });
    // right: people talking at a market, many peaks
    const row = drawFigureRow(ctx, c, { x: 360, y: FLOOR, w: 196, n: 3, height: 176, facing: 0, overlap: 0.25, t, looks: [0, 1, 2].map((i) => ({ ...groupLook(c, i, { t }), mood: 'happy' })) });
    const sp = [22, 36, 15];
    (row.figures || []).slice(0, 3).forEach((f, i) => {
      const hd = f.sk?.anchors?.head;
      if (hd) drawSoundArcs(ctx, c, { x: hd.x, y: hd.y - hd.r - 4, dir: -Math.PI / 2 + (i - 1) * 0.5, spread: 0.7, n: 3, wavelength: sp[i], speed: 40, r0: 10, t: t + i * 0.3, strength: 0.75, tone: [1, 5, 3][i] });
    });
    const peaks = MANY.map(([u, h], i) => ({ u, h: h * (0.82 + 0.18 * Math.sin(TAU * 0.7 * t + i * 1.7)) }));
    drawPhone(ctx, c, { x: 610, y: 290, h: 196, peaks });
    pill(ctx, c, 'many frequencies', 508, 34, { ...LBL, bg: c.s5, ink: c.bgDeep });
  }
}
