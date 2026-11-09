// DecibelScene.js - slide "Decibels and Noise" (blk-l05-s06, 2 beats). New 2026-11-03.
// b0 a tall decibel scale (0 to 120 dB, ticks every 20). Three pictures sit at their levels, as the
//    slide gives them: rustling leaves (a few dB), two people talking (about 60 dB), a firecracker
//    (over 100 dB). A marker climbs the scale step by step; each picture lights when it is reached.
//    Intensity bars at 60, 70, 80 dB (1, 10, 100 units) grow as the marker passes: +10 dB = 10 x intensity.
// b1 noise above (a firecracker bursts, a person covers both ears); below, a hearing aid, case open: microphone, amplifier, speaker in a chain. Small arcs arrive at the
//    microphone; a pulse signal grows as it passes through the amplifier (small before it, large
//    after it); larger arcs leave the ear tip into an ear.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, alpha, mix, clamp01, inOutSine, font, rr } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawSignalWire } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawCracker, drawHearingAid, drawEar } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const SC = { x: 92, w: 30, y0: 504, y1: 66 };            // the scale: 0 dB at y0, 120 dB at y1
const Y = (db) => SC.y0 - (db / 120) * (SC.y0 - SC.y1);
// the climb: [start, end, from, to] in s and dB
const STEPS = [[0.4, 1.0, 0, 8], [1.7, 2.5, 8, 60], [3.2, 3.9, 60, 110]];
const LEVELS = { leaves: 8, talk: 60, cracker: 110 };
const RUN = 4.6;

const AID = { x: 236, y: 400, w: 440 };
// b0 the intensity ladder beside the scale: one bar per 10 dB step from 60 dB, each ten times the last
const LAD = { x: 192, px: 1.2, levels: [60, 70, 80] };     // 1.2 px per unit of intensity: 1.2, 12, 120 px

export class DecibelScene extends SimScene {
  static HEIGHT = 560;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A tall decibel scale from 0 to 120 dB. A marker climbs it: rustling leaves light up at a few '
    + 'dB, two people talking at 60 dB, and a firecracker bursting at over 100 dB. Beside the scale, bars of intensity '
    + 'at 60, 70 and 80 dB are 1, 10 and 100 units long: each 10 dB step is ten times the intensity. Then noise: a '
    + 'firecracker bursts and a person covers both ears. Below, a hearing aid with its case '
    + 'open: small sound arcs reach its microphone, the signal grows as it passes through the amplifier, and the '
    + 'speaker sends larger sound arcs into the ear.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.probeOut = null;
  }

  enter(stage) { this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(1, stage | 0)); }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.t() < (this.cur >= 1 ? 5.0 : RUN); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur >= 1) this.aid(ctx, c); else this.scale(ctx, c);
  }

  level(a) {
    let db = 0;
    for (const [s, e, from, to] of STEPS) { if (a >= s) db = from + (to - from) * inOutSine(clamp01((a - s) / (e - s))); }
    return db;
  }

  // ---- b0 ----------------------------------------------------------------------------------
  scale(ctx, c) {
    const a = this.t(), tt = Math.min(a, RUN + 2), db = this.level(a);
    const on = (lv) => clamp01((db - lv + 2) / 2);
    this.bar(ctx, c, db);
    // pictures at their levels, dim until reached
    const leaf = on(LEVELS.leaves), talk = on(LEVELS.talk), crk = on(LEVELS.cracker);
    ctx.save(); ctx.globalAlpha = 0.3 + 0.7 * leaf; this.leaves(ctx, c, 372, Y(LEVELS.leaves) - 4, leaf, tt); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.3 + 0.7 * talk; this.talkers(ctx, c, Y(LEVELS.talk) + 76, talk, tt); ctx.restore();
    const since = a - STEPS[2][1];
    const flash = crk <= 0 ? 0 : since < 0.9 ? 1 - 0.35 * clamp01(since / 0.9) : 0.65;
    ctx.save(); ctx.globalAlpha = 0.3 + 0.7 * crk; drawCracker(ctx, c, { x: 600, y: Y(LEVELS.cracker) + 96, s: 1.1, flash, t: tt }); ctx.restore();
    // names, beside each picture
    const nm = (text, x, y, k, align) => pill(ctx, c, text, x, y, { bg: c.raised, size: 26, display: true, align, alpha: 0.35 + 0.65 * k, ink: k > 0.5 ? c.label : c.labelMuted });
    nm('rustling leaves', 460, Y(LEVELS.leaves) - 6, leaf, 'left');
    nm('normal talk', 490, Y(LEVELS.talk) - 4, talk, 'left');
    nm('firecracker', 532, Y(LEVELS.cracker) + 10, crk, 'right');
    // a small rise in decibels, a large rise in intensity: bars at 60, 70 and 80 dB, 1, 10 and 100 units
    // long (each +10 dB is ten times the intensity), each growing as the marker passes its level
    const grow = LAD.levels.map((lv) => clamp01((db - lv) / 6));
    this.ladder(ctx, c, grow);
    if (grow[2] > 0.5) pill(ctx, c, '+10 dB = 10 x intensity', LAD.x - 50, Y(93), { bg: c.warning, size: 26, display: true, align: 'left', alpha: clamp01((grow[2] - 0.5) * 2) });
    this.probeOut = { db: Math.round(db), lit: [leaf, talk, crk].map((v) => +v.toFixed(2)), ladder: LAD.levels.map((lv, i) => Math.round(10 ** i * LAD.px * grow[i])) };
  }

  /** The intensity bars: shaded, a light top edge, the value 1, 10, 100 at each bar's left. */
  ladder(ctx, c, grow) {
    const col = c.s6, h = 18;
    ctx.save();
    LAD.levels.forEach((lv, i) => {
      const y = Y(lv), units = 10 ** i, L = Math.max(4, units * LAD.px) * inOutSine(grow[i]);
      ctx.globalAlpha = 0.35 + 0.65 * clamp01(grow[i] * 3);
      ctx.font = font(c, 700, 26, true); ctx.fillStyle = c.label; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(String(units), LAD.x - 8, y);
      if (L <= 0.5) return;
      const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
      g.addColorStop(0, mix(col, c.bgSurface, 0.3)); g.addColorStop(1, mix(col, c.label, 0.2));
      rr(ctx, LAD.x, y - h / 2, L, h, Math.min(5, L / 2)); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = mix(col, c.label, 0.45); ctx.lineWidth = 1.5; ctx.stroke();
    });
    ctx.restore();
  }

  /** The scale: a rounded tube filling from quiet (green) to loud (red), ticks every 20 dB, the marker. */
  bar(ctx, c, db) {
    const { x, w, y0, y1 } = SC;
    ctx.save();
    rr(ctx, x, y1 - 10, w, y0 - y1 + 20, w / 2); ctx.fillStyle = mix(c.bgSurface, c.label, 0.08); ctx.fill();
    ctx.save(); rr(ctx, x, y1 - 10, w, y0 - y1 + 20, w / 2); ctx.clip();
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, c.good); g.addColorStop(0.5, c.warning); g.addColorStop(1, c.bad);
    ctx.fillStyle = g; ctx.fillRect(x, Y(db), w, y0 + 12 - Y(db));
    ctx.fillStyle = alpha(c.bgSurface, 0.35); ctx.fillRect(x + 5, y1 - 10, 6, y0 - y1 + 20);
    ctx.restore();
    rr(ctx, x, y1 - 10, w, y0 - y1 + 20, w / 2); ctx.strokeStyle = mix(c.label, c.bgSurface, 0.2); ctx.lineWidth = 3; ctx.stroke();
    ctx.font = font(c, 700, 26, true); ctx.fillStyle = c.label; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let v = 0; v <= 120; v += 20) {
      ctx.strokeStyle = c.label; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x - 10, Y(v)); ctx.lineTo(x, Y(v)); ctx.stroke();
      ctx.fillText(String(v), x - 14, Y(v));
    }
    ctx.textAlign = 'center'; ctx.fillText('dB', x + w / 2, y1 - 36);
    // marker: a pointer on the right of the tube
    const my = Y(db);
    ctx.fillStyle = c.label;
    ctx.beginPath(); ctx.moveTo(x + w + 4, my); ctx.lineTo(x + w + 22, my - 11); ctx.lineTo(x + w + 22, my + 11); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /** A twig with leaves that rustle while lit: shaded leaves with a midrib, a two-tone branch. */
  leaves(ctx, c, x, y, k, t) {
    const bark = mix(c.gold, c.label, 0.5), leaf = c.good;
    ctx.save();
    ctx.lineCap = 'round';
    const br = (w, col, dy) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x - 110, y + 18 + dy); ctx.bezierCurveTo(x - 50, y + 4 + dy, x + 20, y + 8 + dy, x + 78, y - 16 + dy); ctx.stroke(); };
    br(9, mix(bark, c.label, 0.3), 0); br(4, mix(bark, c.bgSurface, 0.3), -1.5);
    const L = [[-80, 12, -1.9, 1], [-52, 7, 1.2, 0.9], [-26, 6, -2.1, 1.05], [2, 6, 1.0, 1], [28, 2, -1.7, 0.95], [52, -6, 1.3, 0.9], [76, -16, -0.6, 1.0]];
    L.forEach(([dx, dy, ang, s], i) => {
      const sway = k * 0.16 * Math.sin(TAU * 1.6 * t + i * 1.3), len = 46 * s, wd = 17 * s;
      ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(ang + sway);
      const shape = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(len * 0.3, -wd, len * 0.8, -wd * 0.7, len, 0); ctx.bezierCurveTo(len * 0.8, wd * 0.7, len * 0.3, wd, 0, 0); ctx.closePath(); };
      shape(); ctx.fillStyle = mix(leaf, c.label, 0.18); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(len * 0.3, -wd, len * 0.8, -wd * 0.7, len, 0); ctx.closePath(); ctx.fillStyle = mix(leaf, c.bgSurface, 0.25); ctx.fill();
      ctx.strokeStyle = mix(leaf, c.label, 0.45); ctx.lineWidth = 1.6; shape(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(len - 4, 0); ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  /** Two people talking, facing each other; small arcs from the speaker's mouth while lit. */
  talkers(ctx, c, ground, k, t) {
    const h = 150;
    const a = figureFor(this, { role: 'student', x: 348, y: ground, height: h, facing: 1, i: 3, pose: 'stand', autoReach: false, mood: 'smile' });
    const b = figureFor(this, { role: 'adult', x: 444, y: ground, height: h * 1.04, facing: -1, i: 6, pose: 'stand', autoReach: false, mood: 'smile' });
    const sa = drawFigure(ctx, c, a, a.look);
    drawFigure(ctx, c, b, b.look);
    if (k > 0.05) {
      const hd = sa.anchors.head;
      drawSoundArcs(ctx, c, { x: hd.x + hd.r * 0.9, y: hd.y + hd.r * 0.35, dir: 0, spread: 0.8, n: 2, wavelength: 16, r0: 8, t, strength: 0.75 * k });
    }
  }

  // ---- b1 ----------------------------------------------------------------------------------
  aid(ctx, c) {
    const a = this.t(), t = Math.min(a, 5.0) + 10;
    const u = (t * 0.45) % 1;
    this.noise(ctx, c, a, t);
    const ear = drawEar(ctx, c, { x: 610, y: AID.y + 22, h: 180, facing: 1, listen: clamp01((a - 1.2) / 0.6) });
    const ha = drawHearingAid(ctx, c, { x: AID.x, y: AID.y, w: AID.w, lit: null, pulse: u,
      labels: ['microphone', 'amplifier', 'speaker'] });
    // the signal: small from the microphone to the amplifier, large from the amplifier to the speaker
    drawSignalWire(ctx, c, { a: ha.mic, b: ha.amp, sag: -26, t, amp: 4, cycles: 3, speed: 1, style: 'pulse' });
    drawSignalWire(ctx, c, { a: ha.amp, b: ha.speaker, sag: -26, t, amp: 11, cycles: 3, speed: 1, style: 'pulse' });
    // small arcs arrive at the microphone; larger arcs leave the ear tip into the ear
    drawSoundArcs(ctx, c, { x: ha.mic.x - 18, y: ha.mic.y, dir: Math.PI, spread: 0.5, n: 3, wavelength: 13, r0: 20, t, reverse: true, strength: 0.5 });
    drawSoundArcs(ctx, c, { x: ha.tip.x + 6, y: ha.tip.y, dir: Math.atan2(ear.canal.y - ha.tip.y, ear.canal.x - ha.tip.x), spread: 1.05, n: 3, wavelength: 30, r0: 18, t, strength: 1 });
    this.probeOut = { mic: ha.mic, amp: ha.amp, speaker: ha.speaker, tip: ha.tip, canal: ear.canal };
  }

  /** Noise, above the aid: a firecracker bursting, strong arcs, a person covering both ears. */
  noise(ctx, c, a, t) {
    const gy = 236, flash = a < 0.3 ? 0 : 0.85 - 0.25 * clamp01((a - 0.3) / 1.5);
    const ck = drawCracker(ctx, c, { x: 120, y: gy, s: 1.15, flash, t });
    drawSoundArcs(ctx, c, { x: ck.top.x + 24, y: ck.top.y + 10, dir: 0.1, spread: 0.7, n: 4, wavelength: 34, r0: 30, t, strength: 0.9 * clamp01(a / 0.4) });
    const spec = figureFor(this, { role: 'student', x: 360, y: gy, height: 176, facing: -1, i: 1, pose: 'stand', autoReach: false, mood: 'oops' });
    const h = solveFigure(spec).anchors.head;
    spec.hands = [{ x: h.x + h.r * 0.15, y: h.y + h.r * 0.15 }, { x: h.x + h.r * 0.45, y: h.y + h.r * 0.05 }];
    drawFigure(ctx, c, spec, spec.look);
    pill(ctx, c, 'noise', ck.top.x + 4, gy + 26, { bg: c.raised, size: 26, display: true });
  }
}
