import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, inOutSine, clamp01, mix, alpha, lighten, darken, rr,
} from 'simulations/base/kit/SimLook.js';

// SpoonAndScissorsScene - blk-l08-s11, A Spoon and Scissors (book P&P 11, 12; Fig 7.35).
// b0: a spoon slid over the rim of a tin, its bowl under the lid. The rim is the
//     fulcrum, the lid the load, the hand the effort. The hand presses the long
//     handle down; the bowl lifts the lid's near edge about 35 px (dashed s). The
//     effort arrow is short; the push on the lid starts where the bowl touches it
//     and is longer by the ratio of the two arms (196 px : about 60 px).
// b1: one pair of scissors. The card starts near the tips (long load arm, long
//     squeeze arrows), then slides in near the pivot: the load arm and the effort
//     arrows shrink together (arrow length = load arm / 3). A faint outline keeps
//     where it was.

const ROLE = { f: 's6', l: 's5', e: 's1' };
const GROUND = 452;

// -- b0: the tin and the spoon
const CAN_X0 = 360, CAN_X1 = 572, RIM_Y = 262;
const PIV = { x: CAN_X0 + 2, y: RIM_Y };
const HANDLE = 222, TIP = 62;            // handle length and bowl length, design px
const HAND_AT = 196;                     // effort arm: pivot to the hand
const TH_REST = 0.16;                    // at rest the bowl dips into the slot under the lid
const TH_PRESS = -0.5;                   // handle swing at full press
const PRESS_S = 0.8;
const BOWL = { cx: TIP * 0.56, rx: TIP * 0.46, ry: 11 }; // the bowl, seen a little from above
const EFF_LEN = 26;

// the bowl's outline in spoon-local coordinates (x along the spoon, y down)
const BOWL_PTS = Array.from({ length: 25 }, (_, i) => {
  const an = Math.PI + (i / 24) * Math.PI;   // the upper half, back to front
  return { x: BOWL.cx + BOWL.rx * Math.cos(an), y: BOWL.ry * Math.sin(an) };
});

// -- b1: the scissors
const SC = { x: 268, y: 262 };           // the screw
const BLADE = 352, SC_HALF = 0.15;
const D_TIPS = 300, D_PIVOT = 84;        // card distance from the screw
const ARROW_PER = 1 / 3;                 // effort arrow length per px of load arm
const SLIDE_S = 0.9, SLIDE_AT = 0.5;

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

function metal(c) { return mix(c.bgSurface, c.label, 0.6); }
function skin(c) { return mix(c.s8, c.label, 0.45); }

function arrow(ctx, color, x1, y1, x2, y2, w = 6, a1 = 1) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 4) return;
  const a = Math.atan2(y2 - y1, x2 - x1), head = Math.min(16, len * 0.6);
  ctx.save();
  ctx.globalAlpha *= a1;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - Math.cos(a) * head * 0.7, y2 - Math.sin(a) * head * 0.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - 0.5), y2 - head * Math.sin(a - 0.5));
  ctx.lineTo(x2 - head * Math.cos(a + 0.5), y2 - head * Math.sin(a + 0.5));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function ring(ctx, color, x, y, r) {
  ctx.save();
  ctx.strokeStyle = darken(color, 0.2); ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

// A dimension bracket from x0 to x1 at y, with its name under it.
function bracket(ctx, c, x0, x1, y, text, color, k = 1) {
  ctx.save();
  ctx.globalAlpha *= k;
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x0, y - 9); ctx.lineTo(x0, y + 9);
  ctx.moveTo(x1, y - 9); ctx.lineTo(x1, y + 9);
  ctx.moveTo(x0, y); ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.restore();
  if (text) pill(ctx, c, text, (x0 + x1) / 2, y + 28, { bg: color, size: 22, alpha: k });
}

function strip(ctx, c, p, q, w0, w1, tone) {
  const a = Math.atan2(q.y - p.y, q.x - p.x), nx = -Math.sin(a), ny = Math.cos(a);
  const steel = tone ?? metal(c);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p.x + nx * w0 / 2, p.y + ny * w0 / 2);
  ctx.lineTo(q.x + nx * w1 / 2, q.y + ny * w1 / 2);
  ctx.lineTo(q.x - nx * w1 / 2, q.y - ny * w1 / 2);
  ctx.lineTo(p.x - nx * w0 / 2, p.y - ny * w0 / 2);
  ctx.closePath();
  ctx.fillStyle = steel; ctx.fill();
  ctx.strokeStyle = darken(steel, 0.45); ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p.x - nx * w0 * 0.25, p.y - ny * w0 * 0.25);
  ctx.lineTo(q.x - nx * w1 * 0.2, q.y - ny * w1 * 0.2);
  ctx.strokeStyle = alpha(lighten(steel, 0.6), 0.8); ctx.lineWidth = Math.max(1.5, w1 * 0.25); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p.x + nx * w0 * 0.32, p.y + ny * w0 * 0.32);
  ctx.lineTo(q.x + nx * w1 * 0.3, q.y + ny * w1 * 0.3);
  ctx.strokeStyle = alpha(darken(steel, 0.3), 0.8); ctx.lineWidth = Math.max(1.5, w1 * 0.22); ctx.stroke();
  ctx.restore();
}

const rot = (o, ang, d) => ({ x: o.x + Math.cos(ang) * d, y: o.y + Math.sin(ang) * d });

export class SpoonAndScissorsScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'First, a tin with a spoon slid over its rim, the tip under the lid. The rim is the fulcrum, the lid the load and a hand on the long handle gives the effort: the hand presses down a little and the lid edge lifts, with a short effort arrow and a long force arrow on the lid. Then a pair of scissors: a card near the blade tips needs long squeeze arrows at the handles; the card slides in near the pivot, the load arm gets short and the squeeze arrows shrink.';

  enter() { this.motionT = 0; }

  get cutting() { return this.stage === 1; }

  pointerDown() {
    this.motionT = 0;
    this.animateFor(800);
  }

  get motionEnd() { return this.cutting ? SLIDE_AT + SLIDE_S + 0.1 : PRESS_S + 0.1; }
  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }
  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    this.counter(ctx, c);
    if (this.cutting) this.drawScissors(ctx, c);
    else this.drawTin(ctx, c);
  }

  // a kitchen counter: wooden top with a front edge
  counter(ctx, c) {
    const wood = mix(c.gold, c.bgSurface, 0.35);
    ctx.save();
    ctx.fillStyle = wood;
    ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = lighten(wood, 0.25);
    ctx.fillRect(0, GROUND, W, 5);
    ctx.fillStyle = darken(wood, 0.18);
    ctx.fillRect(0, GROUND + 26, W, H - GROUND - 26);
    ctx.strokeStyle = alpha(darken(wood, 0.35), 0.5); ctx.lineWidth = 2;
    for (const x of [90, 250, 430, 600]) { ctx.beginPath(); ctx.moveTo(x, GROUND + 8); ctx.quadraticCurveTo(x + 30, GROUND + 14, x + 70, GROUND + 10); ctx.stroke(); }
    ctx.restore();
  }

  // -- b0 ----------------------------------------------------------------------

  drawTin(ctx, c) {
    const u = inOutSine(clamp01((this.motionT ?? 0) / PRESS_S));
    const th = TH_REST + TH_PRESS * u;
    // the lid turns on its far edge (the hinge) and rests on the highest point of the bowl
    const hx = CAN_X1 + 2, lw = hx - (CAN_X0 - 2);
    let lift = 0, touch = BOWL_PTS[BOWL_PTS.length - 1];
    for (const q of BOWL_PTS) {
      const p = rot(PIV, th, q.x), wy = p.y + Math.cos(th) * q.y, wx = p.x - Math.sin(th) * q.y;
      const need = (RIM_Y - 2 - wy) * lw / (hx - wx);
      if (need > lift) { lift = need; touch = { x: wx, y: wy, lx: q.x }; }
    }
    if (!(lift > 0)) touch = rot(PIV, th, TIP);
    this.can(ctx, c);
    this.slot(ctx, c, lift);
    this.spoon(ctx, c, th);
    this.lid(ctx, c, lift);
    const hand = rot(PIV, th + Math.PI, HAND_AT);
    this.hand(ctx, c, hand.x, hand.y, th);
    // the two arms, measured along the spoon, just under it
    const dl = Math.hypot(touch.x - PIV.x, touch.y - PIV.y);
    this.armBracket(ctx, c, th, -HAND_AT, 0, 30, 'effort arm', c.s1);
    this.armBracket(ctx, c, th, 0, dl, 34, null, c.s5);
    pill(ctx, c, 'load arm', PIV.x + 80, RIM_Y + 70, { bg: c.s5, size: 26 });
    // forces: a short effort arrow down on the handle; on the lid, where the bowl
    // touches it, a push up as many times longer as the effort arm is than the load arm
    arrow(ctx, c.s1, hand.x + 34, hand.y - 30 - EFF_LEN, hand.x + 34, hand.y - 30, 7);
    const k = clamp01(u * 1.4);
    const lidLen = EFF_LEN * HAND_AT / Math.max(30, dl);
    arrow(ctx, c.s5, touch.x, touch.y - 2, touch.x, touch.y - 2 - lidLen * k, 7);
    // the lid's near edge rises: a dashed s arrow from where it sat
    const ex = CAN_X0 - 30, y0 = RIM_Y - 2, y1 = RIM_Y - 2 - lift;
    if (lift > 8) this.sArrow(ctx, c, ex, y0, y1);
    ring(ctx, c[ROLE.f], PIV.x, PIV.y, 15);
    pill(ctx, c, 'fulcrum', PIV.x - 116, RIM_Y - 36, { bg: c[ROLE.f], size: 26 });
  }

  sArrow(ctx, c, x, y0, y1) {
    ctx.save();
    ctx.strokeStyle = c.accent; ctx.fillStyle = c.accent; ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1 + 10); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x, y1 - 2); ctx.lineTo(x - 8, y1 + 11); ctx.lineTo(x + 8, y1 + 11); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 10, y0); ctx.lineTo(x + 10, y0); ctx.stroke();
    ctx.restore();
    pill(ctx, c, 's', x, y1 - 28, { bg: c.accent, size: 26 });
  }

  armBracket(ctx, c, th, d0, d1, off, text, color) {
    const nx = -Math.sin(th), ny = Math.cos(th);
    const a = rot(PIV, th, d0), b = rot(PIV, th, d1);
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x + nx * (off - 9), a.y + ny * (off - 9)); ctx.lineTo(a.x + nx * (off + 9), a.y + ny * (off + 9));
    ctx.moveTo(b.x + nx * (off - 9), b.y + ny * (off - 9)); ctx.lineTo(b.x + nx * (off + 9), b.y + ny * (off + 9));
    ctx.moveTo(a.x + nx * off, a.y + ny * off); ctx.lineTo(b.x + nx * off, b.y + ny * off);
    ctx.stroke();
    ctx.restore();
    if (text) {
      // 26 px pill: set further off the bracket and a little toward the hand, clear of its line
      const m = rot(PIV, th, (d0 + d1) / 2 - 16);
      pill(ctx, c, text, m.x + nx * (off + 52), m.y + ny * (off + 52), { bg: color, size: 26 });
    }
  }

  can(ctx, c) {
    const steel = metal(c);
    const band = c.s3;
    const x0 = CAN_X0, x1 = CAN_X1, w = x1 - x0;
    drawShadow(ctx, c, (x0 + x1) / 2, GROUND + 2, w * 0.6, 10, 0.8);
    ctx.save();
    rr(ctx, x0, RIM_Y + 6, w, GROUND - RIM_Y - 6, 6);
    ctx.fillStyle = steel; ctx.fill();
    // the paper label wrapped round the middle
    const ly0 = RIM_Y + 46, ly1 = GROUND - 30;
    ctx.fillStyle = band; ctx.fillRect(x0, ly0, w, ly1 - ly0);
    ctx.fillStyle = lighten(band, 0.3); ctx.fillRect(x0, ly0 + 10, w, 6);
    ctx.fillStyle = darken(band, 0.15); ctx.fillRect(x0, ly1 - 18, w, 6);
    ctx.fillStyle = alpha(lighten(c.s2, 0.1), 0.95);
    rr(ctx, x0 + w * 0.3, ly0 + 32, w * 0.4, 46, 10); ctx.fill();
    ctx.fillStyle = alpha(darken(c.s2, 0.2), 0.9);
    rr(ctx, x0 + w * 0.36, ly0 + 46, w * 0.28, 7, 3); ctx.fill();
    rr(ctx, x0 + w * 0.4, ly0 + 59, w * 0.2, 6, 3); ctx.fill();
    // ribs on the steel above and below the label
    ctx.strokeStyle = alpha(darken(steel, 0.3), 0.7); ctx.lineWidth = 2;
    for (const y of [RIM_Y + 22, RIM_Y + 34, GROUND - 18, GROUND - 8]) { ctx.beginPath(); ctx.moveTo(x0 + 2, y); ctx.lineTo(x1 - 2, y); ctx.stroke(); }
    // light and shade sides of the cylinder
    ctx.fillStyle = alpha(lighten(c.label, 0.2), 0.32); ctx.fillRect(x0 + 16, RIM_Y + 8, 16, GROUND - RIM_Y - 10);
    ctx.fillStyle = alpha(c.bgDeep, 0.22); ctx.fillRect(x1 - 46, RIM_Y + 8, 44, GROUND - RIM_Y - 10);
    ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2;
    rr(ctx, x0, RIM_Y + 6, w, GROUND - RIM_Y - 6, 6); ctx.stroke();
    // the rolled rim: the fulcrum
    rr(ctx, x0 - 4, RIM_Y - 2, w + 8, 10, 4);
    ctx.fillStyle = lighten(steel, 0.12); ctx.fill();
    ctx.strokeStyle = darken(steel, 0.5); ctx.stroke();
    ctx.restore();
  }

  lid(ctx, c, lift) {
    const tin = mix(metal(c), c.gold, 0.4);
    const x0 = CAN_X0 - 2, x1 = CAN_X1 + 2, w = x1 - x0, hgt = 16;
    const ang = Math.atan2(lift, w - 8); // the near edge up, about the hinge
    ctx.save();
    ctx.translate(x1, RIM_Y - 2);
    ctx.rotate(ang);
    // the domed top, then the skirt that sits round the rim
    ctx.beginPath();
    ctx.moveTo(-w, -hgt + 6); ctx.quadraticCurveTo(-w / 2, -hgt - 8, 0, -hgt + 6);
    ctx.lineTo(0, 0); ctx.lineTo(-w, 0); ctx.closePath();
    ctx.fillStyle = tin; ctx.fill();
    ctx.strokeStyle = darken(tin, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = alpha(lighten(tin, 0.45), 0.9);
    ctx.beginPath(); ctx.moveTo(-w + 14, -hgt + 4); ctx.quadraticCurveTo(-w / 2, -hgt - 5, -24, -hgt + 3);
    ctx.lineTo(-24, -hgt + 6); ctx.quadraticCurveTo(-w / 2, -hgt - 1, -w + 14, -hgt + 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(tin, 0.22); ctx.fillRect(-w + 2, -7, w - 4, 6);
    ctx.strokeStyle = alpha(darken(tin, 0.45), 0.8); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-w + 2, -8); ctx.lineTo(-2, -8); ctx.stroke();
    ctx.restore();
  }

  // a dark slot opens under the lifted lid, from the near edge to the hinge
  slot(ctx, c, lift) {
    const x0 = CAN_X0 - 2, x1 = CAN_X1 + 2;
    if (lift > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0 + 4, RIM_Y - 2);
      ctx.lineTo(x0 + 4, RIM_Y - 2 - lift);
      ctx.lineTo(x1 - 20, RIM_Y - 2);
      ctx.closePath();
      ctx.fillStyle = darken(metal(c), 0.62); ctx.fill();
      ctx.restore();
    }
  }

  spoon(ctx, c, th) {
    const steel = metal(c);
    ctx.save();
    ctx.translate(PIV.x, PIV.y);
    ctx.rotate(th);
    // the handle: a flat bar, wider at its end, with a hanging hole
    ctx.beginPath();
    ctx.moveTo(6, -3);
    ctx.lineTo(-HANDLE + 22, -9);
    ctx.quadraticCurveTo(-HANDLE - 4, -11, -HANDLE - 4, -1);
    ctx.quadraticCurveTo(-HANDLE - 4, 9, -HANDLE + 22, 7);
    ctx.lineTo(6, 3);
    ctx.closePath();
    ctx.fillStyle = steel; ctx.fill();
    ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = alpha(lighten(steel, 0.6), 0.85); ctx.fillRect(-HANDLE + 24, -6, HANDLE - 30, 2.5);
    ctx.fillStyle = alpha(darken(steel, 0.3), 0.8); ctx.fillRect(-HANDLE + 24, 2.5, HANDLE - 30, 2);
    rr(ctx, -HANDLE + 4, -3, 14, 6, 3); ctx.fillStyle = alpha(c.bgDeep, 0.7); ctx.fill();
    // the neck, narrowing from the handle into the bowl
    ctx.beginPath();
    ctx.moveTo(6, -3); ctx.quadraticCurveTo(12, -3, BOWL.cx - BOWL.rx + 4, -5);
    ctx.lineTo(BOWL.cx - BOWL.rx + 4, 5); ctx.quadraticCurveTo(12, 3, 6, 3);
    ctx.closePath();
    ctx.fillStyle = steel; ctx.fill();
    ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
    // the bowl, slid under the lid: an oval rim, the hollow inside it shaded
    ctx.beginPath(); ctx.ellipse(BOWL.cx, 0, BOWL.rx, BOWL.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = lighten(steel, 0.12); ctx.fill();
    ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(BOWL.cx + 2, 1, BOWL.rx - 6, BOWL.ry - 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = darken(steel, 0.22); ctx.fill();
    ctx.beginPath(); ctx.ellipse(BOWL.cx + 8, 3, BOWL.rx * 0.45, BOWL.ry * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = alpha(lighten(steel, 0.65), 0.85); ctx.fill();
    ctx.beginPath(); ctx.ellipse(BOWL.cx - 6, -5, BOWL.rx * 0.5, 2, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = alpha(lighten(steel, 0.7), 0.9); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  // A fist round the handle, the forearm coming in from above.
  hand(ctx, c, x, y, th) {
    const sk = skin(c);
    const sleeve = c.s4;
    ctx.save();
    // forearm and sleeve
    const ex = x - 70, ey = y - 170;
    strip(ctx, c, { x: ex, y: ey }, { x: x - 6, y: y - 18 }, 40, 34, sk);
    strip(ctx, c, { x: ex - 18, y: ey - 50 }, { x: ex + 6, y: ey + 14 }, 54, 50, sleeve);
    ctx.translate(x, y);
    ctx.rotate(th);
    // the fist: back of the hand, four curled fingers under the handle, thumb on top
    rr(ctx, -26, -30, 52, 34, 12);
    ctx.fillStyle = sk; ctx.fill();
    ctx.strokeStyle = darken(sk, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = alpha(lighten(sk, 0.35), 0.8); rr(ctx, -20, -26, 26, 5, 2); ctx.fill();
    for (let i = 0; i < 4; i++) {
      const fx = -24 + i * 12.5;
      rr(ctx, fx, -2, 12, 18, 5);
      ctx.fillStyle = i % 2 ? darken(sk, 0.08) : sk; ctx.fill();
      ctx.strokeStyle = darken(sk, 0.4); ctx.lineWidth = 1.8; ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(16, -30, 15, 7, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = darken(sk, 0.06); ctx.fill();
    ctx.strokeStyle = darken(sk, 0.4); ctx.stroke();
    ctx.restore();
  }

  // -- b1 ----------------------------------------------------------------------

  drawScissors(ctx, c) {
    const t = this.motionT ?? 0;
    const u = inOutSine(clamp01((t - SLIDE_AT) / SLIDE_S));
    const d = D_TIPS + (D_PIVOT - D_TIPS) * u;
    drawShadow(ctx, c, SC.x + 80, GROUND + 2, 280, 9, 0.6);
    // the outline where the card was
    if (u > 0.02) this.card(ctx, c, D_TIPS, 0.3 * clamp01(u * 2), true);
    this.card(ctx, c, d, 1, false);
    this.scissors(ctx, c);
    ring(ctx, c[ROLE.f], SC.x, SC.y, 16);
    pill(ctx, c, 'pivot', SC.x, SC.y + 46, { bg: c[ROLE.f], size: 22 });
    // load arm: screw to card
    bracket(ctx, c, SC.x, SC.x + d, SC.y - 104, 'load arm', c.s5);
    // squeeze arrows at the handles: length tracks the load arm; a ghost of the first
    const hx = SC.x - 132;
    const gap = 132 * Math.tan(SC_HALF * 1.7) + 46;
    const len = d * ARROW_PER;
    if (u > 0.02) {
      const L0 = D_TIPS * ARROW_PER;
      arrow(ctx, c.s1, hx, SC.y - gap - L0, hx, SC.y - gap, 7, 0.25);
      arrow(ctx, c.s1, hx, SC.y + gap + L0, hx, SC.y + gap, 7, 0.25);
    }
    arrow(ctx, c.s1, hx, SC.y - gap - len, hx, SC.y - gap, 7);
    arrow(ctx, c.s1, hx, SC.y + gap + len, hx, SC.y + gap, 7);
    pill(ctx, c, 'effort', hx + 4, SC.y - gap - D_TIPS * ARROW_PER - 24, { bg: c.s1, size: 22 });
  }

  card(ctx, c, d, k, ghost) {
    const x = SC.x + d;
    const col = mix(c.s2, c.bgSurface, 0.15);
    const h = 150;
    ctx.save();
    ctx.globalAlpha *= k;
    if (ghost) {
      ctx.setLineDash([6, 5]); ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 2.5;
      rr(ctx, x - 8, SC.y - h / 2, 16, h, 3); ctx.stroke();
    } else {
      rr(ctx, x - 8, SC.y - h / 2, 16, h, 3);
      ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = lighten(col, 0.3); ctx.fillRect(x - 6, SC.y - h / 2 + 3, 4, h - 6);
      ctx.fillStyle = darken(col, 0.2); ctx.fillRect(x + 2, SC.y - h / 2 + 3, 4, h - 6);
      ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 2; rr(ctx, x - 8, SC.y - h / 2, 16, h, 3); ctx.stroke();
    }
    ctx.restore();
  }

  scissors(ctx, c) {
    const plastic = c.s4;
    for (const s of [-1, 1]) {
      const bAng = s * SC_HALF;
      // blade: wide at the screw, a straight cutting edge, a pointed tip
      const tip = rot(SC, bAng, BLADE);
      strip(ctx, c, rot(SC, bAng, -14), tip, 30, 6);
      const hAng = Math.PI - s * SC_HALF * 1.7;
      const lc = rot(SC, hAng, 150);
      strip(ctx, c, rot(SC, hAng, 6), rot(SC, hAng, 116), 22, 17, darken(plastic, 0.05));
      ctx.save();
      ctx.beginPath(); ctx.ellipse(lc.x, lc.y, 38, 24, hAng, 0, Math.PI * 2);
      ctx.strokeStyle = darken(plastic, 0.4); ctx.lineWidth = 17; ctx.stroke();
      ctx.strokeStyle = plastic; ctx.lineWidth = 12; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(lc.x, lc.y, 38, 24, hAng, Math.PI * 1.1, Math.PI * 1.6);
      ctx.strokeStyle = lighten(plastic, 0.4); ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
    }
    const steel = metal(c);
    ctx.save();
    ctx.beginPath(); ctx.arc(SC.x, SC.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = darken(steel, 0.15); ctx.fill();
    ctx.strokeStyle = darken(steel, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(SC.x - 6, SC.y + 3); ctx.lineTo(SC.x + 6, SC.y - 3); ctx.stroke();
    ctx.restore();
  }
}
