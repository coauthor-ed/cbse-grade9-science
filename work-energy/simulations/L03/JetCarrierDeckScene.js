import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, drawShadow, pill, alpha, lighten, darken, mix, luma,
  rr, clamp01, vectorArrow,
} from 'simulations/base/kit/SimLook.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';
import { displacementArrow } from 'simulations/base/kit/SimApparatus.js';

// JetCarrierDeckScene - blk-l03-s07, Stopping a Jet (book Example 7.6, Fig 7.12).
// b0: a jet rolls onto the deck; its tailhook catches the wire, which pulls
//     back (solid F, 367500 N) while the jet moves forward (dashed s, 100 m)
//     until it stops.
// b1: the same stop with a K bar: full at the catch, draining to 0 as the jet
//     comes to rest; the wire's work W = -36 750 000 J.
// b2: back at the catch, the jet still moving: its speed tag, 70 m/s = 252 km/h,
//     and the full K bar it had then.
// The jet is drawn much larger than the 100 m deck scale, so the run is short
// on screen; positions and the drain still follow the constant pull.

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

const K0 = 36750000;
const HORIZON_Y = 196;
const DECK_Y = 344;          // deck top
const SLAB_H = 18;
const WATER_Y = 446;
const CATCH_X = 64;          // hook position when the wire is caught
const STOP_X = 330;          // hook position when the jet stops (100 m later)
const ENTRY_X = -250;        // hook position as the jet rolls in
const JET_L = 244;

const ROLL_S = 0.6;          // entry roll to the catch
const STOP_S = 1.6;          // catch to stop (constant pull: x = s(1-(1-u)^2))

const BAR = { x: 578, y: 18, h: 178 };

function fmtBig(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

export class JetCarrierDeckScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'A 15000 kg jet lands on the deck of a ship. The hook at its tail catches a wire, which pulls back with 367500 N while the jet moves forward 100 m and stops. A kinetic energy bar drains from 36 750 000 J to zero as it stops: the wire does -36 750 000 J of work. The landing speed was 70 m/s, which is 252 km/h.';

  enter() { this.motionT = 0; }

  pointerDown() { this.motionT = 0; this.animateFor(800); }

  get motionEnd() {
    if (this.stage === 0) return ROLL_S + STOP_S + 0.5;
    if (this.stage === 1) return STOP_S + 0.6;
    return ROLL_S + 0.6;
  }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  // The jet's state for this beat at this moment: hook x, stop progress u (0..1), moving?
  state() {
    const t = this.motionT ?? 0;
    if (this.stage === 2) {
      const u = clamp01(t / ROLL_S);
      return { hookX: ENTRY_X + (CATCH_X - ENTRY_X) * u, u: 0, caught: false, moving: true };
    }
    const t0 = this.stage === 0 ? ROLL_S : 0;
    if (t < t0) {
      const u = t / ROLL_S;
      return { hookX: ENTRY_X + (CATCH_X - ENTRY_X) * u, u: 0, caught: false, moving: true };
    }
    const u = clamp01((t - t0) / STOP_S);
    const s = 1 - (1 - u) * (1 - u);
    return { hookX: CATCH_X + (STOP_X - CATCH_X) * s, u, caught: true, moving: u < 1, endA: clamp01((t - t0 - STOP_S) / 0.4) };
  }

  pal(c) {
    const light = luma(c.bgSurface) > 0.5;
    return {
      light,
      sea: light ? mix(c.s1, c.bgSurface, 0.45) : mix(c.s1, c.bgDeep, 0.6),
      seaNear: light ? mix(c.s1, c.bgSurface, 0.25) : mix(c.s1, c.bgDeep, 0.45),
      deck: light ? mix(c.label, c.bgSurface, 0.62) : mix(c.label, c.bgDeep, 0.72),
      hull: light ? mix(c.label, c.bgSurface, 0.48) : mix(c.label, c.bgDeep, 0.6),
      skin: light ? mix(c.label, c.bgSurface, 0.6) : mix(c.label, c.bgDeep, 0.38),
    };
  }

  draw(ctx, c) {
    const p = this.pal(c);
    const s = this.state();
    drawBackdrop(ctx, c, 'sky');
    this.sea(ctx, c, p);
    this.ship(ctx, c, p);
    this.wire(ctx, c, s);
    this.jet(ctx, c, p, s);
    this.arrows(ctx, c, s);
    this.bar(ctx, c, s);
    if (this.stage === 2) this.answer(ctx, c, s);
  }

  sea(ctx, c, p) {
    ctx.save();
    ctx.fillStyle = p.sea;
    ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);
    ctx.fillStyle = alpha(lighten(p.sea, 0.4), 0.8);
    ctx.fillRect(0, HORIZON_Y, W, 2);
    // a far ship on the horizon
    ctx.fillStyle = mix(p.sea, c.bgDeep, 0.4);
    rr(ctx, 380, HORIZON_Y - 6, 86, 8, 3);
    ctx.fill();
    ctx.fillRect(440, HORIZON_Y - 16, 12, 10);
    // wave dashes, closer ones longer
    ctx.fillStyle = alpha(lighten(p.sea, 0.35), 0.7);
    for (const [x, y, w] of [[30, 214, 40], [170, 222, 30], [300, 210, 46], [520, 230, 36], [96, 240, 50], [420, 246, 44], [250, 262, 54]]) {
      rr(ctx, x, y, w, 3, 1.5);
      ctx.fill();
    }
    ctx.fillStyle = p.seaNear;
    ctx.fillRect(0, WATER_Y, W, H - WATER_Y);
    ctx.fillStyle = alpha(lighten(p.seaNear, 0.45), 0.85);
    for (const [x, y, w] of [[20, 470, 70], [200, 500, 96], [430, 474, 78], [590, 504, 60], [110, 490, 40]]) {
      rr(ctx, x, y, w, 5, 2.5);
      ctx.fill();
    }
    ctx.restore();
  }

  ship(ctx, c, p) {
    ctx.save();
    // hull, flared under the deck, down to the waterline
    ctx.beginPath();
    ctx.moveTo(0, DECK_Y + SLAB_H);
    ctx.lineTo(W, DECK_Y + SLAB_H);
    ctx.lineTo(W, WATER_Y);
    ctx.lineTo(0, WATER_Y);
    ctx.closePath();
    ctx.fillStyle = p.hull;
    ctx.fill();
    ctx.fillStyle = darken(p.hull, 0.22);
    ctx.fillRect(0, DECK_Y + SLAB_H, W, 12);
    ctx.fillStyle = lighten(p.hull, 0.12);
    ctx.fillRect(0, WATER_Y - 14, W, 4);
    // hull plates and a row of portholes
    ctx.strokeStyle = alpha(darken(p.hull, 0.3), 0.6);
    ctx.lineWidth = 2;
    for (let x = 40; x < W; x += 92) {
      ctx.beginPath();
      ctx.moveTo(x, DECK_Y + SLAB_H + 12);
      ctx.lineTo(x, WATER_Y - 14);
      ctx.stroke();
    }
    for (let x = 22; x < W; x += 46) {
      ctx.beginPath();
      ctx.arc(x, 420, 4, 0, Math.PI * 2);
      ctx.fillStyle = darken(p.hull, 0.35);
      ctx.fill();
    }
    // the deck slab: lit lip, painted lines like the book's photo
    ctx.fillStyle = p.deck;
    ctx.fillRect(0, DECK_Y, W, SLAB_H);
    ctx.fillStyle = lighten(p.deck, 0.25);
    ctx.fillRect(0, DECK_Y, W, 3);
    ctx.fillStyle = darken(p.deck, 0.25);
    ctx.fillRect(0, DECK_Y + SLAB_H - 4, W, 4);
    ctx.fillStyle = alpha(c.gold, 0.9);
    for (let x = 8; x < W; x += 44) ctx.fillRect(x, DECK_Y + 6, 24, 3);
    ctx.fillStyle = alpha(c.bad, 0.75);
    for (let x = 30; x < W; x += 88) ctx.fillRect(x, DECK_Y + 10, 14, 3);
    // the wire supports at the catch point
    for (const dx of [-10, 10]) {
      ctx.fillStyle = darken(p.deck, 0.4);
      rr(ctx, CATCH_X + dx - 4, DECK_Y - 9, 8, 10, 2);
      ctx.fill();
      ctx.fillStyle = lighten(p.deck, 0.3);
      ctx.fillRect(CATCH_X + dx - 3, DECK_Y - 8, 2, 7);
    }
    ctx.restore();
  }

  // Seen side-on the wire runs from the supports at the catch point to the hook.
  wire(ctx, c, s) {
    const hook = { x: s.hookX - 6, y: DECK_Y - 6 };
    ctx.save();
    ctx.lineCap = 'round';
    if (s.caught) {
      for (const [dy, a] of [[-3, 0.55], [0, 1]]) {
        ctx.strokeStyle = alpha(mix(c.label, c.bgSurface, 0.25), a);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(CATCH_X, DECK_Y - 6 + dy);
        ctx.lineTo(hook.x, hook.y + dy);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = mix(c.label, c.bgSurface, 0.25);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(CATCH_X - 10, DECK_Y - 6);
      ctx.lineTo(CATCH_X + 10, DECK_Y - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Side view, nose to the right; x0 is the tailhook's tip on the deck.
  jet(ctx, c, p, s) {
    const x0 = Math.round(s.hookX);
    const D = DECK_Y;
    const skin = p.skin;
    const shade = darken(skin, 0.28);
    const lit = lighten(skin, 0.3);
    const cy = D - 58;     // fuselage centre line
    ctx.save();
    drawShadow(ctx, c, x0 + JET_L * 0.55, D + 1, JET_L * 0.42, 7);
    // speed streaks while it rolls
    if (s.moving) {
      ctx.strokeStyle = alpha(c.labelMuted, 0.55);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (const [dy, l] of [[-36, 58], [-12, 40], [-62, 30]]) {
        ctx.beginPath();
        ctx.moveTo(x0 - 6, cy + dy + 20);
        ctx.lineTo(x0 - 6 - l, cy + dy + 20);
        ctx.stroke();
      }
    }
    // far fin and far tailplane (behind)
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.moveTo(x0 + 72, cy - 10);
    ctx.lineTo(x0 + 40, cy - 64);
    ctx.lineTo(x0 + 24, cy - 64);
    ctx.lineTo(x0 + 30, cy - 10);
    ctx.closePath();
    ctx.fill();
    // landing gear struts and wheels
    for (const [wx, r] of [[x0 + 100, 11], [x0 + 204, 8]]) {
      ctx.strokeStyle = darken(skin, 0.45);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(wx, cy + 8);
      ctx.lineTo(wx, D - r);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wx, D - r, r, 0, Math.PI * 2);
      ctx.fillStyle = darken(c.bgDeep, 0.3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx, D - r, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = mix(c.label, c.bgSurface, 0.4);
      ctx.fill();
    }
    // the tailhook: from under the tail down to the wire
    ctx.strokeStyle = darken(skin, 0.5);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0 + 36, cy + 12);
    ctx.lineTo(x0 - 4, D - 7);
    ctx.stroke();
    ctx.fillStyle = darken(skin, 0.5);
    ctx.beginPath();
    ctx.arc(x0 - 6, D - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    // fuselage: exhaust at the tail, a long body, a pointed nose
    ctx.beginPath();
    ctx.moveTo(x0 + 14, cy - 13);
    ctx.lineTo(x0 + 168, cy - 15);
    ctx.quadraticCurveTo(x0 + JET_L - 12, cy - 10, x0 + JET_L, cy + 4);
    ctx.quadraticCurveTo(x0 + JET_L - 20, cy + 14, x0 + 170, cy + 16);
    ctx.lineTo(x0 + 14, cy + 14);
    ctx.closePath();
    ctx.fillStyle = skin;
    ctx.fill();
    // shade side (belly) and light side (spine)
    ctx.save();
    ctx.clip();
    ctx.fillStyle = shade;
    ctx.fillRect(x0, cy + 5, JET_L, 14);
    ctx.fillStyle = lit;
    ctx.fillRect(x0, cy - 15, JET_L, 5);
    ctx.restore();
    ctx.strokeStyle = darken(skin, 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();
    // panel lines
    ctx.strokeStyle = alpha(darken(skin, 0.35), 0.7);
    ctx.lineWidth = 1.5;
    for (const px of [x0 + 60, x0 + 118, x0 + 196]) {
      ctx.beginPath();
      ctx.moveTo(px, cy - 13);
      ctx.lineTo(px, cy + 14);
      ctx.stroke();
    }
    // the exhaust nozzle
    rr(ctx, x0 + 4, cy - 11, 14, 22, 4);
    ctx.fillStyle = darken(skin, 0.5);
    ctx.fill();
    ctx.fillStyle = alpha(c.s2, 0.6);
    ctx.fillRect(x0 + 4, cy - 6, 4, 12);
    // the side intake
    ctx.beginPath();
    ctx.moveTo(x0 + 140, cy - 2);
    ctx.lineTo(x0 + 176, cy - 4);
    ctx.lineTo(x0 + 176, cy + 13);
    ctx.lineTo(x0 + 130, cy + 14);
    ctx.closePath();
    ctx.fillStyle = darken(skin, 0.4);
    ctx.fill();
    // the near wing: swept, seen from the side and a little above
    ctx.beginPath();
    ctx.moveTo(x0 + 150, cy + 2);
    ctx.lineTo(x0 + 70, cy + 22);
    ctx.lineTo(x0 + 52, cy + 22);
    ctx.lineTo(x0 + 70, cy + 4);
    ctx.closePath();
    ctx.fillStyle = mix(skin, shade, 0.5);
    ctx.fill();
    ctx.strokeStyle = darken(skin, 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // near tailplane
    ctx.beginPath();
    ctx.moveTo(x0 + 58, cy + 4);
    ctx.lineTo(x0 + 18, cy + 18);
    ctx.lineTo(x0 + 8, cy + 18);
    ctx.lineTo(x0 + 22, cy + 4);
    ctx.closePath();
    ctx.fillStyle = mix(skin, shade, 0.4);
    ctx.fill();
    // near fin, swept aft, with a lit leading edge
    ctx.beginPath();
    ctx.moveTo(x0 + 84, cy - 13);
    ctx.lineTo(x0 + 46, cy - 72);
    ctx.lineTo(x0 + 28, cy - 72);
    ctx.lineTo(x0 + 34, cy - 13);
    ctx.closePath();
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.strokeStyle = darken(skin, 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = lit;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x0 + 80, cy - 15);
    ctx.lineTo(x0 + 47, cy - 68);
    ctx.stroke();
    // canopy
    ctx.beginPath();
    ctx.moveTo(x0 + 168, cy - 14);
    ctx.quadraticCurveTo(x0 + 180, cy - 36, x0 + 206, cy - 22);
    ctx.lineTo(x0 + 214, cy - 12);
    ctx.closePath();
    ctx.fillStyle = mix(c.glass, c.bgDeep, 0.25);
    ctx.fill();
    ctx.fillStyle = alpha(lighten(c.glass, 0.5), 0.8);
    ctx.fillRect(x0 + 178, cy - 26, 14, 3);
    ctx.strokeStyle = darken(skin, 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();
    // the mass tag rides above the jet
    pill(ctx, c, '15000 kg', x0 + 150, cy - 70, { bg: c.s2, size: 24 });
    ctx.restore();
  }

  arrows(ctx, c, s) {
    if (this.stage === 2) return;
    const dim = this.stage === 1 ? 0.75 : 1;
    if (s.caught) {
      // the wire's pull on the hook: solid, backward
      const y = DECK_Y - 40;
      vectorArrow(ctx, c, s.hookX - 10, y, { angle: Math.PI, length: 112, width: 7, head: 20, col: c.bad, alpha: dim });
      pill(ctx, c, 'F = 367500 N', Math.max(96, s.hookX - 70), y - 34, { bg: c.bad, size: 22, alpha: dim });
      // the jet's displacement: dashed, forward, growing with the hook
      if (s.hookX - CATCH_X > 8) {
        displacementArrow(ctx, c, CATCH_X, 386, s.hookX, 386, { width: 5, head: 16, alpha: dim });
      }
      if (s.u >= 1) pill(ctx, c, 's = 100 m', (CATCH_X + STOP_X) / 2, 414, { bg: c.s2, size: 22, alpha: dim * s.endA });
      // tick marks at both ends of the run
      ctx.save();
      ctx.strokeStyle = alpha(c.label, 0.7 * dim);
      ctx.lineWidth = 2;
      for (const x of [CATCH_X, s.u >= 1 ? STOP_X : null]) {
        if (x == null) continue;
        ctx.beginPath();
        ctx.moveTo(x, DECK_Y + SLAB_H + 2);
        ctx.lineTo(x, 398);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  bar(ctx, c, s) {
    if (this.stage === 0) return;
    const k = this.stage === 2 ? K0 : K0 * (1 - s.u) * (1 - s.u);
    drawEnergyBars(ctx, c, {
      x: BAR.x, y: BAR.y, h: BAR.h, max: K0, total: K0, size: 26,
      bars: [{ id: 'K', label: 'K', tone: 1 }], values: { K: k },
    });
    const top = BAR.y + 27;
    pill(ctx, c, '36 750 000 J', BAR.x - 10, top + 6, { bg: c.s1, size: 22, align: 'right' });
    if (this.stage === 1 && s.u >= 1) {
      pill(ctx, c, 'W = -36 750 000 J', (CATCH_X + STOP_X) / 2 + 30, 478, { bg: c.bad, size: 24, display: true, alpha: s.endA });
    }
  }

  answer(ctx, c, s) {
    const a = clamp01(((this.motionT ?? 0) - ROLL_S) / 0.35);
    if (a <= 0) return;
    const cx = 420, cy = 120;
    // leader from the tag down to the jet's nose
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = alpha(c.s1, 0.9);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy + 76);
    ctx.lineTo(s.hookX + 200, DECK_Y - 92);
    ctx.stroke();
    ctx.restore();
    pill(ctx, c, 'v = 70 m/s', cx - 40, cy, { bg: c.s1, size: 34, display: true, alpha: a, scale: 0.85 + 0.15 * a });
    pill(ctx, c, '= 252 km/h', cx - 40, cy + 54, { bg: c.s4, size: 26, display: true, alpha: a });
  }
}
