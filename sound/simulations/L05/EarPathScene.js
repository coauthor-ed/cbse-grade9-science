/**
 * EarPathScene - L05 blk-l05-s07 "Inside the Ear" (3 beats). Rebuilt 2026-11-03 (whole file).
 *   b0  the ear in section (SoundArt drawEarCutaway, filling the stage): arcs arrive at the canal; the
 *       eardrum moves with them, the bones swing, and a signal dot runs eardrum -> bones -> cochlea ->
 *       nerve, one pass every 2.4 s; the part the dot is in is lit. Tags beside the parts, no leaders.
 *       Chips outside (TapLight): eardrum, tiny bones, cochlea; a tapped chip holds that part lit.
 *   b1  a head from above (drawHeadTop), a speaker on the left: one sound ring spreads out at 110 px/s;
 *       the left ear lights when the ring reaches it, the right ear later. A time line under the head
 *       gets a tick at each arrival, very close together: "less than 0.001 s".
 *   b2  three panels: a snake on the ground, vibrations coming up from the ground; a fish in water,
 *       vibrations reaching its body; a cricket with the hearing organ on its front leg lit.
 * Pure in the beat, the lit chip and this.t().
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, alpha, mix, lighten, darken, rr, inOutSine, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawSpeaker } from 'simulations/base/kit/SimApparatus.js';
import { tapLight, tapLightControl } from 'simulations/base/kit/TapLight.js';
import { drawEarCutaway, drawHeadTop, drawSnake, drawFish, drawCricket, drawSeaCut } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const CHIPS = [
  { id: 'eardrum', label: 'eardrum', targets: ['eardrum'] },
  { id: 'bones', label: 'tiny bones', targets: ['bones'] },
  { id: 'cochlea', label: 'cochlea', targets: ['cochlea'] },
];
const PASS = 2.4;             // one signal pass (s)
const V_RING = 110;           // b1 ring speed (px/s), slow motion
const RING_T0 = 0.4;

export class EarPathScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static CONTROLS = [tapLightControl({ id: 'lit', label: 'Show', chips: CHIPS })];
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'The ear in section: sound arcs arrive at the ear canal, the eardrum vibrates, the tiny bones swing, and a signal dot runs from the eardrum through the bones to the cochlea and along the nerve to the brain; buttons light the eardrum, the tiny bones or the cochlea. Then a head seen from above with a sound source on the left: the sound reaches the left ear first and the right ear a moment later, two marks very close together on a time line, less than 0.001 s apart. Then a snake feeling vibrations from the ground, a fish feeling vibrations in the water, and a cricket whose hearing organ is on its front leg.';

  tl = tapLight({ chips: CHIPS });

  constructor(container, config) { super(container, config); this.mode = 'b0'; }

  enter(stage) {
    const s = Math.max(0, Math.min(2, stage | 0));
    this.mode = ['b0', 'b1', 'b2'][stage > 100 ? 0 : s];
    this.tl.reset();
  }

  getControlValue(id) { return id === 'lit' ? this.tl.controlValue() : undefined; }
  onControlChange(id, v) { if (id === 'lit') this.tl.fromControl(v); }
  isControlDisabled(id) { return id === 'lit' && this.mode !== 'b0'; }

  _ringEnd() { return RING_T0 + 470 / V_RING; }
  _tend() { return this.mode === 'b0' ? 2 * PASS + 0.62 * PASS : this.mode === 'b1' ? this._ringEnd() : 3; }
  busy() { return this.age < this._tend(); }
  t() { return Math.min(this.age, this._tend()); }

  draw(ctx, c) {
    const t = this.t();
    drawBackdrop(ctx, c, 'dots');
    if (this.mode === 'b0') this._ear(ctx, c, t);
    else if (this.mode === 'b1') this._twoEars(ctx, c, t);
    else this._animals(ctx, c, t);
  }

  // ---- b0 ------------------------------------------------------------------------------------
  _ear(ctx, c, t) {
    const u = (t % PASS) / PASS;
    const chip = this.tl.lit()[0] || null;
    const SEG = [[0, 'eardrum'], [0.22, 'bones'], [0.45, 'cochlea'], [0.78, 'nerve']];
    let j = SEG.length - 1; while (j > 0 && u < SEG[j][0]) j--;
    const auto = SEG[j][1], prev = SEG[(j + SEG.length - 1) % SEG.length][1];
    const lit = chip || auto;
    const fade = chip || t < PASS * 0.2 ? 1 : inOutSine(clamp01((u - SEG[j][0]) / 0.09));
    const F = 2.2;
    const o = { x: 368, y: 266, w: 560, drum: 0.8 * Math.sin(TAU * F * t), bones: 0.5 + 0.5 * Math.sin(TAU * F * t - 0.6), pulse: u };
    // the lit part cross-fades into the next one (no one-frame jump)
    let ear = drawEarCutaway(ctx, c, { ...o, lit: fade < 1 ? prev : lit });
    if (fade < 1) { ctx.save(); ctx.globalAlpha = fade; ear = drawEarCutaway(ctx, c, { ...o, lit }); ctx.restore(); }
    // arcs arrive at the canal from the left
    const cn = ear.canal || { x: 120, y: 266 }, bx = ear.box ? ear.box.x : 90;
    drawSoundArcs(ctx, c, { x: bx + 6, y: cn.y, dir: Math.PI, spread: 0.7, n: 3, wavelength: 22, speed: 22 * F, r0: 10, t, reverse: true, strength: 0.85 });
    const T = ear.tags || {};
    const tag = (key, text, p, hw = 70) => {
      if (!p) return;
      const on = lit === key;
      pill(ctx, c, text, Math.max(12 + hw, Math.min(668 - hw, p.x)), p.y, { ...LBL, bg: on ? c.warning : c.raised, ink: on ? darken(c.warning, 0.8) : c.label });
    };
    // eardrum and bones: beside their own parts (the part anchors), not the far tag row
    const ED = ear.eardrum, BN = ear.bones;
    tag('eardrum', 'eardrum', ED && { x: ED.x - 64, y: ED.y + 96 }, 66);
    tag('bones', 'tiny bones', BN && { x: BN.x + 36, y: BN.y - 84 }, 84);
    tag('cochlea', 'cochlea', T.cochlea);
    tag('nerve', 'to the brain', T.nerve, 92);
  }

  // ---- b1 ------------------------------------------------------------------------------------
  _twoEars(ctx, c, t) {
    const HX = 380, HY = 220;
    const sp = drawSpeaker(ctx, c, { x: 82, y: HY, r: 34, facing: 1, cone: 0 });
    const src = sp.cone || { x: 80, y: HY };
    const R = Math.max(0, t - RING_T0) * V_RING;
    // where the ears are (a dry run with the same options, then the real one with the glows)
    const d0 = { x: HX, y: HY, r: 86, shoulders: false };
    ctx.save(); ctx.globalAlpha = 0; const ears = drawHeadTop(ctx, c, d0); ctx.restore();
    const dL = Math.hypot(ears.left.x - src.x, ears.left.y - src.y), dR = Math.hypot(ears.right.x - src.x, ears.right.y - src.y);
    const kL = inOutSine(clamp01((R - dL) / 40)), kR = inOutSine(clamp01((R - dR) / 40));
    drawHeadTop(ctx, c, { ...d0, litLeft: kL, litRight: kR });
    // the time line (the ring stops above it)
    const TY = 432;
    if (R > 30) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 680, TY - 100); ctx.clip(); drawSoundArcs(ctx, c, { x: src.x + 8, y: src.y, dir: 0, spread: 1.4, single: true, radius: R, strength: clamp01(1.4 - R / 520), tone: 1 }); ctx.restore(); }
    const x0 = 120, x1 = 600;
    ctx.save();
    ctx.strokeStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, TY); ctx.lineTo(x1, TY); ctx.stroke();
    const tick = (x, k, col) => { if (k <= 0) return; ctx.globalAlpha = k; ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, TY - 24); ctx.lineTo(x, TY + 24); ctx.stroke(); ctx.globalAlpha = 1; };
    const xm = 360;
    tick(xm - 5, kL, c.s6); tick(xm + 5, kR, c.s1);
    ctx.restore();
    if (kL > 0) pill(ctx, c, 'left ear', xm - 18, TY - 50, { ...LBL, align: 'right', bg: c.s6, ink: c.bgDeep, alpha: kL });
    if (kR > 0) pill(ctx, c, 'right ear', xm + 18, TY - 50, { ...LBL, align: 'left', bg: c.s1, ink: c.bgDeep, alpha: kR });
    if (kR > 0) pill(ctx, c, 'less than 0.001 s', xm, TY + 50, { ...LBL, bg: c.raised, ink: c.label, alpha: kR });
  }

  // ---- b2 ------------------------------------------------------------------------------------
  _panel(ctx, c, x, w, title, fill) {
    const y = 28, h = 464;
    ctx.save();
    rr(ctx, x, y + 4, w, h, 18); ctx.fillStyle = alpha(c.bgDeep, 0.12); ctx.fill();
    rr(ctx, x, y, w, h, 18); ctx.fillStyle = alpha(c.bgSurface, 0.82); ctx.fill();
    ctx.save(); rr(ctx, x, y, w, h, 18); ctx.clip(); fill(); ctx.restore();
    rr(ctx, x, y, w, h, 18); ctx.strokeStyle = alpha(c.stroke, 0.8); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    pill(ctx, c, title, x + w / 2, y + 34, { ...LBL, bg: c.raised, ink: c.label });
  }

  _animals(ctx, c, t) {
    const soil = mix(c.s8, c.bgDeep, 0.45);
    // snake on the ground
    this._panel(ctx, c, 14, 210, 'snake', () => {
      const g = ctx.createLinearGradient(0, 214, 0, 492);
      g.addColorStop(0, lighten(soil, 0.15)); g.addColorStop(1, darken(soil, 0.25));
      ctx.fillStyle = g; ctx.fillRect(14, 214, 210, 290);
      ctx.fillStyle = alpha(lighten(soil, 0.4), 0.5);
      for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(24 + ((i * 53) % 196), 236 + ((i * 37) % 240), 2 + (i % 3), 0, TAU); ctx.fill(); }
    });
    const sn = drawSnake(ctx, c, { x: 119, y: 214, len: 205, dir: 1, wave: 0 });
    for (const [i, p] of (sn.points || []).entries()) {
      if (i % 3 !== 1) continue;
      drawSoundArcs(ctx, c, { x: p.x, y: 222, dir: Math.PI / 2, spread: 0.8, n: 3, wavelength: 22, speed: 30, r0: 14, t: t + i * 0.2, reverse: true, strength: 0.85 });
    }
    // fish in water
    this._panel(ctx, c, 235, 210, 'fish', () => { drawSeaCut(ctx, c, { x: 235, w: 210, y: 92, bottom: 500, rocks: true, t }); });
    const fs = drawFish(ctx, c, { x: 338, y: 236, s: 1.5, dir: 1, swim: (t * 0.6) % 1 });
    for (const [i, p] of (fs.points || []).entries()) {
      if (i !== 2 && i !== 4) continue;
      drawSoundArcs(ctx, c, { x: p.x, y: p.y + 14, dir: Math.PI / 2, spread: 0.8, n: 3, wavelength: 22, speed: 30, r0: 12, t: t + i * 0.3, reverse: true, strength: 0.85 });
    }
    // cricket on a leaf, hearing organ on the front leg lit
    this._panel(ctx, c, 456, 210, 'cricket', () => {
      const g = ctx.createLinearGradient(0, 100, 0, 492);
      g.addColorStop(0, alpha(c.s3, 0.1)); g.addColorStop(1, alpha(c.s3, 0.22));
      ctx.fillStyle = g; ctx.fillRect(456, 28, 210, 464);
      const s2 = ctx.createLinearGradient(0, 224, 0, 492);
      s2.addColorStop(0, lighten(soil, 0.15)); s2.addColorStop(1, darken(soil, 0.25));
      ctx.fillStyle = s2; ctx.fillRect(456, 224, 210, 276);
      ctx.fillStyle = mix(c.s3, soil, 0.35); ctx.fillRect(456, 220, 210, 8);
    });
    const CR = { x: 544, y: 196, s: 1.25 };
    drawCricket(ctx, c, { ...CR, dir: 1, leaf: false });
    // the hearing organ sits on the front leg's lower segment (cricket local point 40, 21)
    const leg = { x: CR.x + 40 * CR.s, y: CR.y + 21 * CR.s };
    const k = 0.75 + 0.25 * Math.sin(TAU * 0.8 * t);
    ctx.save();
    const gl = ctx.createRadialGradient(leg.x, leg.y, 2, leg.x, leg.y, 24);
    gl.addColorStop(0, alpha(c.warning, 0.85 * k)); gl.addColorStop(1, alpha(c.warning, 0));
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(leg.x, leg.y, 24, 0, TAU); ctx.fill();
    ctx.strokeStyle = darken(c.warning, 0.3); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(leg.x, leg.y, 11, 0, TAU); ctx.stroke();
    ctx.restore();
    drawSoundArcs(ctx, c, { x: leg.x, y: leg.y, dir: Math.PI / 2 + 0.35, spread: 0.7, n: 3, wavelength: 20, speed: 28, r0: 18, t, reverse: true, strength: 0.85 });
    pill(ctx, c, 'leg', leg.x - 10, leg.y + 70, { ...LBL, bg: c.warning, ink: darken(c.warning, 0.8) });
  }
}
