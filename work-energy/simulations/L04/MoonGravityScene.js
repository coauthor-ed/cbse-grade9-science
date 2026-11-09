import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, pill, font, clamp01, inOutSine,
  mix, alpha, lighten, darken, ellipse,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';

// MoonGravityScene - blk-l04-s10, On the Moon (book Revise Q12).
// b0: the same throw on the Earth (left) and the Moon (right): one K bar each,
//     the same height, tied by one dashed level line.
// b1: both balls fly on one clock and one scale (25 px per metre). The Earth
//     ball stops 8 m up with all its K turned to U. The Moon ball, under g/6,
//     is still rising when it leaves the top of the frame: its height is the
//     next question, so it is a "?" here, never 48 m.

const G_EARTH = 10, G_MOON = G_EARTH / 6;
const H_EARTH = 8;                               // m, the slide's number
const V0 = Math.sqrt(2 * G_EARTH * H_EARTH);     // the same launch speed on both
const PXM = 25;                                  // px per metre, both sides
const GROUND = 452;
const MID = 340;                                 // the Earth | Moon split
const FIG_H = 104;
const SIDES = [
  { id: 'earth', g: G_EARTH, figX: 76, barX: 188 },
  { id: 'moon', g: G_MOON, figX: MID + 76, barX: MID + 188 },
];
const BAR_Y = 262, BAR_H = 110;
const THROW_S = 0.6;                              // b0: the throw, K fills
const FLY_S = Math.sqrt(2 * H_EARTH / G_EARTH) + 0.55;   // b1: Earth apex, then a short hold
const CRATERS = [[440, 478, 30, 8], [560, 470, 22, 6], [640, 496, 34, 9], [380, 500, 18, 5], [520, 504, 16, 4]];
const STARS = [[372, 40, 2], [430, 92, 1.5], [505, 30, 2.2], [590, 70, 1.6], [650, 24, 2], [620, 150, 1.4], [470, 180, 1.5], [660, 210, 1.8]];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class MoonGravityScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Left, an astronaut on the Earth; right, an astronaut on the Moon, where gravity is one sixth. Both throw the same ball straight up at the same speed, and both kinetic energy bars start at the same height. Then the Earth ball rises 8 m and stops, its kinetic energy all turned to potential energy. The Moon ball is still rising when it leaves the top of the picture, so its height is shown as a question mark.';

  enter() { this.motionT = 0; }

  get flyBeat() { return this.stage >= 1; }
  get motionEnd() { return (this.flyBeat ? FLY_S : THROW_S) + 0.1; }

  pointerDown() { this.motionT = 0; this.animateFor(800); }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  // Height in metres above the hand at flight time t, never below 0.
  rise(g, t) { return Math.max(0, V0 * t - 0.5 * g * t * t); }

  // The state of one side right now: ball height (m), K and U as parts of the launch K.
  sideState(s) {
    const t = this.motionT ?? 0;
    if (!this.flyBeat) {
      const k = inOutSine(clamp01(t / THROW_S));
      return { h: 0.25 * k, K: k, U: 0 };
    }
    const tf = Math.min(t, Math.sqrt(2 * H_EARTH / G_EARTH));   // the Earth ball holds at its top
    const tt = s.id === 'earth' ? tf : t;
    const h = this.rise(s.g, tt);
    const hMax = V0 * V0 / (2 * s.g);
    const U = clamp01(h / hMax);
    return { h, K: 1 - U, U };
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'sky');
    drawFloor(ctx, c, GROUND, { seams: true });
    this.moonWorld(ctx, c);
    const states = SIDES.map((s) => this.sideState(s));
    SIDES.forEach((s, i) => this.side(ctx, c, s, states[i]));
    this.levelTie(ctx, c);
    pill(ctx, c, 'Earth', MID / 2, GROUND + 38, { bg: c.s1, size: 26 });
    pill(ctx, c, 'Moon: g/6', MID + MID / 2, GROUND + 38, { bg: c.gold, size: 26 });
  }

  moonWorld(ctx, c) {
    const skyTop = darken(c.s5, 0.82), skyLow = darken(c.s5, 0.62);
    ctx.save();
    const gr = ctx.createLinearGradient(0, 0, 0, GROUND);
    gr.addColorStop(0, skyTop);
    gr.addColorStop(1, skyLow);
    ctx.fillStyle = gr;
    ctx.fillRect(MID, 0, W - MID, GROUND);
    for (const [x, y, r] of STARS) {
      ctx.fillStyle = alpha(lighten(c.gold, 0.6), 0.85);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // the Earth, small, in the Moon's sky
    const ex = 620, ey = 110, er = 20;
    ctx.fillStyle = c.s1;
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = mix(c.s3, c.s1, 0.3);
    ellipse(ctx, ex - 6, ey - 4, 8, 6, 0.4); ctx.fill();
    ellipse(ctx, ex + 8, ey + 8, 6, 4, -0.3); ctx.fill();
    ctx.fillStyle = alpha(darken(c.s5, 0.8), 0.55);
    ctx.beginPath(); ctx.arc(ex + 7, ey, er, -Math.PI / 2, Math.PI / 2); ctx.arc(ex + 2, ey, er * 0.95, Math.PI / 2, -Math.PI / 2, true); ctx.fill();
    // Moon ground: light top edge, grey body, shade lower, craters with lit and shaded rims
    const grey = lighten(c.waste, 0.18);
    ctx.fillStyle = grey;
    ctx.fillRect(MID, GROUND, W - MID, H - GROUND);
    ctx.fillStyle = lighten(grey, 0.3);
    ctx.fillRect(MID, GROUND, W - MID, 5);
    ctx.fillStyle = darken(grey, 0.14);
    ctx.fillRect(MID, GROUND + 50, W - MID, H - GROUND - 50);
    for (const [x, y, rx, ry] of CRATERS) {
      ellipse(ctx, x, y, rx, ry); ctx.fillStyle = darken(grey, 0.28); ctx.fill();
      ellipse(ctx, x + rx * 0.12, y + ry * 0.2, rx * 0.8, ry * 0.65); ctx.fillStyle = darken(grey, 0.12); ctx.fill();
      ctx.strokeStyle = lighten(grey, 0.35); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    }
    // the split
    ctx.fillStyle = alpha(c.bgDeep, 0.9);
    ctx.fillRect(MID - 2, 0, 4, H);
    ctx.restore();
  }

  side(ctx, c, s, st) {
    const moon = s.id === 'moon';
    const spec = figureFor(this, {
      role: 'adult', pose: 'reach-up', x: s.figX, y: GROUND, height: FIG_H, facing: 0, i: 2,
      look: { top: lighten(c.waste, 0.72), bottom: lighten(c.waste, 0.6), shoe: darken(c.waste, 0.2) },
    });
    const sk = drawFigure(ctx, c, spec, spec.look);
    const hand = sk?.anchors?.hand?.[0] ?? { x: s.figX + 18, y: GROUND - FIG_H - 10 };
    this.helmet(ctx, c, sk);
    const bx = hand.x + 4, launchY = hand.y - 16;
    const ink = moon ? c.gold : c.label;
    // launch level, dashed
    ctx.save();
    ctx.strokeStyle = alpha(ink, 0.6);
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx - 22, launchY); ctx.lineTo(bx + 62, launchY); ctx.stroke();
    ctx.restore();
    const by = launchY - st.h * PXM;
    if (this.flyBeat) this.heightMark(ctx, c, bx + 46, launchY, moon, ink);
    // the ball (or, off the top, a cut ball and a chevron saying it is still going)
    if (by > 16) {
      if (this.flyBeat) this.trail(ctx, c, bx, launchY, by);
      drawBall(ctx, c, { x: bx, y: by, r: 14, tone: 6 });
    } else {
      drawBall(ctx, c, { x: bx, y: 4, r: 14, tone: 6 });
      ctx.save();
      ctx.strokeStyle = c.gold; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx - 10, 36); ctx.lineTo(bx, 26); ctx.lineTo(bx + 10, 36); ctx.stroke();
      ctx.restore();
    }
    drawEnergyBars(ctx, c, {
      x: s.barX, y: BAR_Y, h: BAR_H, max: 1, total: 1,
      bars: [{ id: 'K', label: 'K', tone: 1 }, { id: 'U', label: 'U', tone: 3 }],
      values: { K: st.K, U: st.U }, size: 26,
    });
  }

  helmet(ctx, c, sk) {
    const hd = sk?.anchors?.head;
    if (!hd) return;
    ctx.save();
    ctx.fillStyle = alpha(c.glass, 0.22);
    ctx.strokeStyle = lighten(c.waste, 0.7);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hd.x, hd.y, hd.r * 1.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(c.glass, 0.6), 0.8);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hd.x, hd.y, hd.r * 1.25, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
    ctx.restore();
  }

  trail(ctx, c, x, y0, y1) {
    ctx.save();
    ctx.strokeStyle = alpha(c.s6, 0.35);
    ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1 + 14); ctx.stroke();
    ctx.restore();
  }

  // Earth: a closed bracket from the launch level to the top, "8 m", shown once the
  // ball is there. Moon: a bracket open at the frame top, "?".
  heightMark(ctx, c, x, launchY, moon, ink) {
    const t = this.motionT ?? 0;
    const tE = Math.sqrt(2 * H_EARTH / G_EARTH);
    const a = clamp01((t - tE) / 0.35);
    if (a <= 0) return;
    const topY = moon ? 8 : launchY - H_EARTH * PXM;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, launchY); ctx.lineTo(x, topY);
    ctx.moveTo(x - 9, launchY); ctx.lineTo(x + 9, launchY);
    if (!moon) { ctx.moveTo(x - 9, topY); ctx.lineTo(x + 9, topY); }
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(x - 7, topY + 13); ctx.lineTo(x + 7, topY + 13); ctx.closePath(); ctx.fill();
    if (!moon) {
      ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.globalAlpha = a * 0.6;
      ctx.beginPath(); ctx.moveTo(x - 68, topY); ctx.lineTo(x + 4, topY); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = a;
    }
    ctx.font = font(c, 800, moon ? 40 : 26, true);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(moon ? '?' : `${H_EARTH} m`, x + 12, moon ? 150 : (launchY + topY) / 2);
    ctx.restore();
  }

  // b0: one dashed line across both K tops says "the same".
  levelTie(ctx, c) {
    if (this.flyBeat) return;
    const k = this.sideState(SIDES[0]).K;
    if (k < 0.98) return;
    // kit geometry: bars start 16 px in from the panel edge; fill top = y + 27
    const y = BAR_Y + 27;
    ctx.save();
    ctx.strokeStyle = alpha(c.s1, 0.9);
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(SIDES[0].barX + 20, y); ctx.lineTo(SIDES[1].barX + 70, y); ctx.stroke();
    ctx.restore();
  }
}
