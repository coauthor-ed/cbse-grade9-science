/**
 * VoiceScene - slide "Your Voice, and a Cricket" (L01 blk-l01-n02), 3 beats. New 2026-11-03.
 *
 * b0 the head and neck in section (SoundArt head cutaway), large. A hand rests on the front
 *    of the throat with small buzz marks under the fingers. The larynx glows; tags "larynx"
 *    and "vocal cords" sit beside the neck (no leader lines). The cords vibrate (humming).
 * b1 two big round insets looking down at the cords: "open" (V gap, air arrows passing up
 *    through) and "closed" (slit, vibrating). The head sits small at the lower left. The
 *    scene alternates breathing (open lit, no sound) and speaking (closed lit, cords in the
 *    head vibrate, sound arcs leave the mouth); it rests on speaking.
 * b2 a field cricket on a leaf, large; its wings lift and rub; sound arcs leave the wings.
 * Not on this slide: pitch, loudness, frequency, waves in air.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, darken, lighten, alpha, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawHeadCutaway, drawVocalCords, drawCricket } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const B0_END = 6;
const PH = 3;                         // b1: seconds per state (breathe, speak)
const B1_END = PH * 2 + PH * 0.6;     // b1 rests mid-speak (closed, arcs on)
const B2_END = 6.2;

const HEAD0 = { x: 372, y: 196, h: 330 };
const OPEN = { x: 300, y: 142, r: 106 }, CLOSED = { x: 540, y: 142, r: 106 };
const HEAD1 = { x: 150, y: 338, h: 196 };
const CRICKET = { x: 330, y: 300, s: 2.05 };

export class VoiceScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A head and neck drawn in section. A hand rests on the front of the throat and feels a buzz; the voice box, the larynx, glows, with the vocal cords inside it. Next, two round views look down at the vocal cords: open, with air passing through, and closed, vibrating, while sound leaves the mouth. Last, a cricket on a leaf rubs its wings together and sound leaves its wings.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) {
    this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(2, stage | 0));
  }

  busy() {
    return this.age < [B0_END, B1_END, B2_END][this.cur];
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this._throat(ctx, c, Math.min(this.age, B0_END));
    else if (this.cur === 1) this._cords(ctx, c, Math.min(this.age, B1_END));
    else this._cricket(ctx, c, Math.min(this.age, B2_END));
  }

  // ---- b0: hum, feel the buzz ------------------------------------------------
  _throat(ctx, c, t) {
    const k = inOutSine(clamp01(t / 0.6));
    const hd = drawHeadCutaway(ctx, c, { ...HEAD0, facing: -1, labels: false, lit: true, vib: k, t });
    const L = hd.larynx, h = HEAD0.h;
    // the larynx glows (soft, on top of the section)
    const g = ctx.createRadialGradient(L.x, L.y, 2, L.x, L.y, h * 0.13);
    g.addColorStop(0, alpha(c.warning, 0.55 * k)); g.addColorStop(1, alpha(c.warning, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(L.x, L.y, h * 0.13, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(L.x, L.y, h * 0.075, h * 0.06, 0, 0, TAU);
    ctx.strokeStyle = alpha(c.warning, 0.95 * k); ctx.lineWidth = 3.5; ctx.stroke();
    // the hand on the front of the throat
    const throat = { x: HEAD0.x - 0.185 * h, y: HEAD0.y + 0.74 * h };
    this._hand(ctx, c, throat);
    // buzz marks beside the fingertips
    ctx.save(); ctx.lineCap = 'round';
    for (const [dy, ph] of [[-46, 0], [44, 1.7]]) {
      const a = 0.45 + 0.55 * Math.abs(Math.sin(TAU * 3 * t + ph));
      for (let i = 0; i < 2; i++) {
        const r = 12 + i * 10;
        ctx.beginPath(); ctx.arc(throat.x - 4, throat.y + dy, r, Math.PI * 0.7, Math.PI * 1.3);
        ctx.strokeStyle = alpha(c.s6, a * k * (1 - i * 0.3)); ctx.lineWidth = 4; ctx.stroke();
      }
    }
    ctx.restore();
    // tags right beside their parts: larynx just left of the glow, cords just right of the cords
    ctx.font = '700 26px sans-serif';
    const wL = ctx.measureText('larynx').width + 30, wC = ctx.measureText('vocal cords').width + 30;
    pill(ctx, c, 'larynx', L.x - h * 0.075 - 16 - wL / 2, L.y - 6, { ...LBL, bg: c.warning, ink: darken(c.warning, 0.75) });
    pill(ctx, c, 'vocal cords', hd.cords.x + 26 + wC / 2, hd.cords.y, { ...LBL, bg: c.raised, ink: c.label });
  }

  // A hand from the lower left, fingers laid on the throat (no hand part in the kit).
  _hand(ctx, c, p) {
    const skin = figureLook(c, { skin: 1 }).skin, edge = darken(skin, 0.38), lit = lighten(skin, 0.25);
    const sleeve = c.s2;
    const rod = (pts, w, col) => {
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = darken(col, 0.38); ctx.lineWidth = w + 4; ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // forearm in a sleeve from the lower left, then the wrist
    rod([{ x: p.x - 250, y: p.y + 190 }, { x: p.x - 150, y: p.y + 60 }], 50, sleeve);
    ctx.strokeStyle = alpha(lighten(sleeve, 0.4), 0.7); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(p.x - 252, p.y + 166); ctx.lineTo(p.x - 166, p.y + 52); ctx.stroke();
    rod([{ x: p.x - 152, y: p.y + 56 }, { x: p.x - 112, y: p.y + 18 }], 36, skin);
    // the back of the hand
    ctx.beginPath(); ctx.moveTo(p.x - 128, p.y + 30);
    ctx.bezierCurveTo(p.x - 132, p.y - 20, p.x - 104, p.y - 40, p.x - 62, p.y - 34);
    ctx.lineTo(p.x - 60, p.y + 34); ctx.bezierCurveTo(p.x - 84, p.y + 46, p.x - 112, p.y + 46, p.x - 128, p.y + 30); ctx.closePath();
    ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.strokeStyle = alpha(lit, 0.7); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(p.x - 118, p.y - 6); ctx.quadraticCurveTo(p.x - 100, p.y - 28, p.x - 72, p.y - 26); ctx.stroke();
    // four fingers side by side, flat on the front of the neck, tips at the throat
    [-26, -9, 8, 24].forEach((dy, i) => {
      const tip = { x: p.x + 4 - Math.abs(i - 1.2) * 4, y: p.y + dy };
      rod([{ x: p.x - 72, y: p.y + dy * 1.15 }, { x: p.x - 34, y: p.y + dy * 1.05 }, tip], 14, skin);
      ctx.strokeStyle = alpha(edge, 0.6); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x - 36, p.y + dy * 1.05 - 6); ctx.lineTo(p.x - 36, p.y + dy * 1.05 + 6); ctx.stroke();
    });
    // the thumb, below, pointing up toward the jaw line
    rod([{ x: p.x - 110, y: p.y + 30 }, { x: p.x - 66, y: p.y + 50 }, { x: p.x - 30, y: p.y + 48 }], 16, skin);
    ctx.restore();
  }

  // ---- b1: open to breathe, closed to speak ----------------------------------
  _cords(ctx, c, t) {
    const u = t % (PH * 2), speak = u >= PH;
    const ramp = inOutSine(clamp01((u % PH) / 0.45));
    const kS = speak ? ramp : 1 - ramp, kO = 1 - kS;   // eased cross-fade at each switch
    const box = (S, k) => {
      ctx.beginPath(); ctx.arc(S.x, S.y, S.r + 9, 0, TAU);
      ctx.strokeStyle = alpha(c.warning, k); ctx.lineWidth = 6; ctx.stroke();
    };
    // open: air passes up through the V gap
    ctx.save(); ctx.globalAlpha = 0.55 + 0.45 * kO;
    drawVocalCords(ctx, c, { ...OPEN, state: 'open', label: 'open' });
    ctx.save(); ctx.beginPath(); ctx.arc(OPEN.x, OPEN.y, OPEN.r - 4, 0, TAU); ctx.clip();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
      const v = ((t * 0.7 + i / 3) % 1), y = OPEN.y + OPEN.r * (0.6 - 1.2 * v), a = Math.sin(Math.PI * v) * kO;
      ctx.beginPath(); ctx.moveTo(OPEN.x - 13, y + 11); ctx.lineTo(OPEN.x, y - 2); ctx.lineTo(OPEN.x + 13, y + 11);
      ctx.strokeStyle = alpha(c.bgSurface ?? c.raised, a); ctx.lineWidth = 9; ctx.stroke();
      ctx.strokeStyle = alpha(c.s1, a); ctx.lineWidth = 5; ctx.stroke();
    }
    ctx.restore(); ctx.restore();
    box(OPEN, kO);
    // closed: the cords vibrate
    ctx.save(); ctx.globalAlpha = 0.55 + 0.45 * kS;
    drawVocalCords(ctx, c, { ...CLOSED, state: 'closed', vib: kS, t, lit: kS > 0.5, label: 'closed' });
    ctx.restore();
    box(CLOSED, kS);
    // the head, small: cords vibrate and sound leaves the mouth while speaking
    const hd = drawHeadCutaway(ctx, c, { ...HEAD1, facing: 1, labels: false, lit: kS > 0.5, vib: kS, t });
    drawSoundArcs(ctx, c, { x: hd.mouth.x + 10, y: hd.mouth.y, dir: -0.08, spread: 0.85, n: 4, wavelength: 34, r0: 14, t, strength: kS });
  }

  // ---- b2: a cricket rubs its wings ------------------------------------------
  _cricket(ctx, c, t) {
    const k = inOutSine(clamp01(t / 0.5));
    const cr = drawCricket(ctx, c, { ...CRICKET, rub: t * 2.4 * k, lit: true });
    drawSoundArcs(ctx, c, { x: cr.wings.x + 20, y: cr.wings.y - 26, dir: -1.05, spread: 0.9, n: 3, wavelength: 34, r0: 16, t, strength: k });
    pill(ctx, c, 'wings', cr.wings.x - 70, cr.wings.y - 52, { ...LBL, bg: c.warning, ink: darken(c.warning, 0.75) });
  }
}
