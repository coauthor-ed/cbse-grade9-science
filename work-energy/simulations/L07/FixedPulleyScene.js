import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawFloor, drawShadow, drawCard, pill, font, clamp01, outBack, inOutSine,
  mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawPulley, drawSpringBalance } from 'simulations/base/kit/SimProps.js';
import { drawCrate, displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// FixedPulleyScene - blk-l07-s04, A Fixed Pulley (book Fig 7.24b).
// b0: a girl on a platform pulls the rope down; over the fixed pulley at the
//     top the load rises by the same length (rope down, load up).
// b1: a spring balance in each part of the rope. As she takes the strain both
//     needles move to the same reading, 50 N and 50 N, and the card reads
//     MA = 50 N / 50 N = 1. Equal readings: only the direction changed.

const GROUND = 452;
const PLAT = { x0: 128, x1: 300, y: 392 };
const PUL = { x: 330, y: 104, r: 36 };
const EFF_X = PUL.x - PUL.r, LOAD_X = PUL.x + PUL.r;   // the two straight parts of the rope
const BEAM_Y = 44, BEAM_H = 18;
const POST_X = 84;
const HAND_Y0 = 236, PULL = 52, HAND_Y1 = HAND_Y0 + PULL;   // the hands come down 72 px
const CRATE_W = 74, CRATE_H = 62;
const FIG_H = 160;
const READ_N = 50, BAL_MAX = 100;
const BAL_S = 0.8;                               // the balances are drawn at 0.8 of kit size
const BAL_LEN = (k) => (30 + k * 40 + 90 + 14) * BAL_S;   // kit balance: coil + case + hook, top to hook
const CARD = { x: 464, y: 150, w: 206, h: 106 };   // the empty sky right of the pulley

const PULL_S = 1.4;
const NEEDLE_S = 0.8;
const B1_END = NEEDLE_S + 1.4;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class FixedPulleyScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A girl stands on a raised platform. A rope goes up from her hands, over a pulley fixed to a beam at the top, and down to a load on the ground. She pulls the rope down and the load goes up by the same length. Then a spring balance is put in each part of the rope: the one she pulls and the one holding the load both read 50 N, and a card shows mechanical advantage = 50 N / 50 N = 1.';

  enter() {
    this.motionT = 0;
  }

  get balBeat() { return this.stage >= 1; }
  get motionEnd() { return (this.balBeat ? B1_END : PULL_S + 0.5) + 0.1; }

  pointerDown() {
    this.motionT = 0;   // tap: play the beat again
    this.animateFor(600);
  }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }
  prog(t0, dt) { return clamp01(((this.motionT ?? 0) - t0) / dt); }

  // how far the rope has been pulled, 0..1 (b1 starts pulled)
  get pullU() { return this.balBeat ? 1 : inOutSine(this.prog(0.15, PULL_S)); }
  // needle reading as she takes the strain (b1)
  get readN() { return this.balBeat ? READ_N * inOutSine(this.prog(0.1, NEEDLE_S)) : 0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, { seams: true });
    const lift = this.pullU * PULL;
    const handY = HAND_Y0 + lift;
    this.gantry(ctx, c);
    this.platform(ctx, c);
    const spec = this.girlSpec(handY);
    const grip = solveFigure(spec).anchors.hand[0];   // where her hand really is
    this.ropeAndLoad(ctx, c, lift, grip);
    drawFigure(ctx, c, spec, spec.look);
    if (!this.balBeat) this.motionMarks(ctx, c);
    else this.card(ctx, c);
  }

  gantry(ctx, c) {
    const steel = mix(c.bgSurface, c.label, 0.3);
    ctx.save();
    drawShadow(ctx, c, POST_X, GROUND + 2, 30, 5, 0.8);
    // the post: an I-section, lit left flange, shaded web
    const px = POST_X - 11;
    ctx.fillStyle = steel;
    ctx.fillRect(px, BEAM_Y, 22, GROUND - BEAM_Y);
    ctx.fillStyle = darken(steel, 0.2);
    ctx.fillRect(px + 7, BEAM_Y + BEAM_H, 8, GROUND - BEAM_Y - BEAM_H);
    ctx.fillStyle = lighten(steel, 0.25);
    ctx.fillRect(px + 2, BEAM_Y + 4, 3, GROUND - BEAM_Y - 8);
    ctx.strokeStyle = darken(steel, 0.38);
    ctx.lineWidth = 2;
    ctx.strokeRect(px, BEAM_Y, 22, GROUND - BEAM_Y);
    // base plate with bolts
    rr(ctx, px - 12, GROUND - 8, 46, 9, 3);
    ctx.fillStyle = darken(steel, 0.25);
    ctx.fill();
    // the beam out to past the pulley
    const bx1 = PUL.x + 96;
    rr(ctx, px, BEAM_Y, bx1 - px, BEAM_H, 3);
    ctx.fillStyle = steel;
    ctx.fill();
    ctx.fillStyle = lighten(steel, 0.25);
    ctx.fillRect(px + 4, BEAM_Y + 2, bx1 - px - 8, 3);
    ctx.fillStyle = darken(steel, 0.22);
    ctx.fillRect(px + 4, BEAM_Y + BEAM_H - 6, bx1 - px - 8, 4);
    rr(ctx, px, BEAM_Y, bx1 - px, BEAM_H, 3);
    ctx.strokeStyle = darken(steel, 0.38);
    ctx.stroke();
    // the diagonal brace
    ctx.lineCap = 'round';
    ctx.strokeStyle = darken(steel, 0.38);
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(POST_X, 176); ctx.lineTo(POST_X + 120, BEAM_Y + BEAM_H); ctx.stroke();
    ctx.strokeStyle = steel;
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(POST_X, 176); ctx.lineTo(POST_X + 120, BEAM_Y + BEAM_H); ctx.stroke();
    ctx.fillStyle = darken(steel, 0.4);
    for (const [x, y] of [[POST_X, 176], [POST_X + 120, BEAM_Y + BEAM_H - 2], [POST_X, BEAM_Y + 9], [bx1 - 10, BEAM_Y + 9]]) {
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  platform(ctx, c) {
    const { x0, x1, y } = PLAT;
    const brick = mix(c.s8, c.bgSurface, 0.35), mortar = mix(c.bgSurface, c.labelMuted, 0.35);
    ctx.save();
    drawShadow(ctx, c, (x0 + x1) / 2, GROUND + 2, (x1 - x0) * 0.58, 7, 0.9);
    ctx.fillStyle = mortar;
    ctx.fillRect(x0, y, x1 - x0, GROUND - y);
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y, x1 - x0, GROUND - y); ctx.clip();
    for (let row = 0, yy = y + 12; yy < GROUND; row++, yy += 16) {
      for (let xx = x0 - (row % 2) * 18; xx < x1; xx += 36) {
        rr(ctx, xx + 1.5, yy + 1.5, 33, 13, 2);
        ctx.fillStyle = brick;
        ctx.fill();
        ctx.fillStyle = lighten(brick, 0.18);
        ctx.fillRect(xx + 3, yy + 2.5, 26, 2);
      }
    }
    // shade on the right face
    ctx.fillStyle = alpha(darken(brick, 0.5), 0.35);
    ctx.fillRect(x1 - 30, y, 30, GROUND - y);
    ctx.restore();
    // the concrete top slab
    const slab = mix(c.bgSurface, c.label, 0.18);
    rr(ctx, x0 - 8, y - 4, x1 - x0 + 16, 14, 3);
    ctx.fillStyle = darken(slab, 0.3);
    ctx.fill();
    rr(ctx, x0 - 8, y - 8, x1 - x0 + 16, 13, 3);
    ctx.fillStyle = slab;
    ctx.fill();
    ctx.fillStyle = lighten(slab, 0.3);
    ctx.fillRect(x0 - 4, y - 6, x1 - x0 + 8, 3);
    ctx.restore();
  }

  ropeAndLoad(ctx, c, lift, grip) {
    const handY = grip.y, hx = grip.x;
    const rope = mix(c.gold, c.labelMuted, 0.35);
    const k = this.readN / BAL_MAX;
    const crateY = GROUND - lift;                     // bottom of the crate
    const ringY = crateY - CRATE_H - 12;
    const ropeLine = (x1, y1, x2, y2) => {
      ctx.strokeStyle = darken(rope, 0.35); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = rope; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };
    ctx.save();
    ctx.lineCap = 'round';
    // over the top of the wheel
    ctx.strokeStyle = darken(rope, 0.35); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(PUL.x, PUL.y, PUL.r, Math.PI, 0); ctx.stroke();
    // effort side: pulley -> (balance) -> hands, and a tail below the hands
    if (this.balBeat) {
      const top = handY - BAL_LEN(k);
      ropeLine(EFF_X, PUL.y, hx, top);
      this.effBal = this.balance(ctx, c, hx, top, 5);
    } else {
      ropeLine(EFF_X, PUL.y, hx, handY);
    }
    ropeLine(hx, handY, hx + 3, handY + 34);
    // load side: pulley -> (balance) -> ring on the crate
    if (this.balBeat) {
      const top = ringY - BAL_LEN(k) + 10;
      ropeLine(LOAD_X, PUL.y, LOAD_X, top);
      this.loadBal = this.balance(ctx, c, LOAD_X, top, 6);
    } else {
      ropeLine(LOAD_X, PUL.y, LOAD_X, ringY);
    }
    // the crate on its sling
    ctx.strokeStyle = darken(rope, 0.3); ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(LOAD_X - CRATE_W / 2 + 8, crateY - CRATE_H); ctx.lineTo(LOAD_X, ringY);
    ctx.lineTo(LOAD_X + CRATE_W / 2 - 8, crateY - CRATE_H);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(LOAD_X, ringY, 5, 0, Math.PI * 2);
    ctx.strokeStyle = mix(c.bgSurface, c.label, 0.45); ctx.lineWidth = 3; ctx.stroke();
    if (lift > 2) drawShadow(ctx, c, LOAD_X, GROUND + 2, CRATE_W * 0.45 * (1 - lift / 300), 4, 0.6);
    drawCrate(ctx, c, { x: LOAD_X, y: crateY, w: CRATE_W, h: CRATE_H, held: lift > 2 });
    ctx.restore();
    // the wheel, turning as the rope runs (a painted spoke mark shows it)
    drawPulley(ctx, c, PUL.x, PUL.y, PUL.r);
    const ang = lift / PUL.r - Math.PI / 2;
    ctx.save();
    ctx.strokeStyle = darken(mix(c.bgSurface, c.label, 0.22), 0.3);
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const a of [ang, ang + Math.PI * 2 / 3, ang + Math.PI * 4 / 3]) {
      ctx.beginPath();
      ctx.moveTo(PUL.x + Math.cos(a) * PUL.r * 0.3, PUL.y + Math.sin(a) * PUL.r * 0.3);
      ctx.lineTo(PUL.x + Math.cos(a) * PUL.r * 0.62, PUL.y + Math.sin(a) * PUL.r * 0.62);
      ctx.stroke();
    }
    ctx.restore();
    pill(ctx, c, 'fixed pulley', PUL.x + 112, PUL.y + 4, { bg: c.raised, ink: c.label, size: 22 });
  }

  // a kit balance at 0.8 size, hung from (x, top); returns its box in scene px
  balance(ctx, c, x, top, tone) {
    ctx.save();
    ctx.translate(x, top);
    ctx.scale(BAL_S, BAL_S);
    const b = drawSpringBalance(ctx, c, 0, 0, { reading: this.readN, max: BAL_MAX, tone });
    ctx.restore();
    return { x0: x + b.x0 * BAL_S, y0: top, w: b.w * BAL_S, h: b.h * BAL_S };
  }

  girlSpec(handY) {
    const hands = [{ x: EFF_X, y: handY }, { x: EFF_X - 1, y: handY + 16 }];
    const fx = EFF_X - 34;
    const spec = figureFor(this, {
      role: 'student', pose: { name: 'pull', lean: -8, crouch: 0.02 }, x: fx, y: PLAT.y - 8, height: FIG_H, facing: 1,
      hands, look: { hairStyle: 'ponytail', mood: 'effort' }, i: 2,
    });
    return spec;
  }

  // b0: the rope goes down where she pulls, the load goes up (dashed: movement)
  motionMarks(ctx, c) {
    const u = this.prog(0.3, 0.6);
    if (u <= 0) return;
    const a = outBack(u);
    displacementArrow(ctx, c, EFF_X + 22, HAND_Y0 - 4, EFF_X + 22, HAND_Y0 - 4 + PULL * a, { tone: 5, width: 5, head: 14 });
    displacementArrow(ctx, c, LOAD_X + CRATE_W / 2 + 22, GROUND - 4, LOAD_X + CRATE_W / 2 + 22, GROUND - 4 - PULL * a, { tone: 6, width: 5, head: 14 });
    const k = this.prog(0.7, 0.4);
    if (k > 0) {
      pill(ctx, c, 'rope down', EFF_X - 92, HAND_Y0 - 38, { bg: c.s5, size: 22, scale: outBack(k) });
      pill(ctx, c, 'load up', LOAD_X + CRATE_W / 2 + 70, GROUND - PULL - 30, { bg: c.s6, size: 22, scale: outBack(k) });
    }
  }

  card(ctx, c) {
    // the two readings, beside their balances
    const pk = this.prog(NEEDLE_S - 0.1, 0.35);
    if (pk > 0 && this.effBal && this.loadBal) {
      // left of her balance, level with its top: above her head, clear of the hair
      pill(ctx, c, `${READ_N} N`, EFF_X - 66, this.effBal.y0 + 12, { bg: c.s5, size: 24, scale: outBack(pk) });
      pill(ctx, c, `${READ_N} N`, LOAD_X + 62, this.loadBal.y0 + this.loadBal.h * 0.6, { bg: c.s6, size: 24, scale: outBack(pk) });
    }
    const k = this.prog(NEEDLE_S + 0.2, 0.4);
    if (k <= 0) return;
    const { x, y, w, h } = CARD;
    drawCard(ctx, c, x, y, w, h, k);
    ctx.save();
    ctx.globalAlpha = k;
    const cy = y + h / 2 + 2;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = font(c, 800, 24, true);
    ctx.fillStyle = c.label;
    ctx.fillText('MA =', x + 10, cy);
    ctx.textAlign = 'center';
    ctx.font = font(c, 800, 22, true);
    ctx.fillStyle = c.s6ink;
    ctx.fillText(`${READ_N} N`, x + 102, cy - 20);
    ctx.fillStyle = c.s5ink;
    ctx.fillText(`${READ_N} N`, x + 102, cy + 22);
    ctx.fillStyle = c.label;
    ctx.fillRect(x + 72, cy - 1.5, 60, 3);
    ctx.restore();
    const e = this.prog(NEEDLE_S + 0.6, 0.4);
    if (e > 0) pill(ctx, c, '= 1', x + w - 38, cy, { bg: c.accent, size: 26, scale: outBack(e) });
  }
}
