// FenceScene.js - slide "Two Knocks on a Fence" (blk-l04-n01, 2 beats). New 2026-11-03.
// Book Practice 11, Fig 10.23: a steel pipe fence, a friend knocks at one end, you listen with your
// ear on the rail 340 m away.
// b0 the knock sends two pulses at once: one INSIDE the steel rail (fast, bright) and one through the
//    air (sound arcs, slow). Screen speeds are in the ratio 5000 : 340 (V_STEEL / V_AIR, computed);
//    the whole run is slowed SLOW times so the air pulse takes 5 s. Your ear glows twice: first for
//    the steel, then for the air. Tags steel, air, and a 340 m distance bar.
// b1 the fence small above; below, a time line 0 to 1.2 s with ticks at 0.068 s (steel) and 1 s (air),
//    a 0.1 s bracket (the least gap to hear two sounds) and the real 0.932 s gap bracket. A playhead
//    runs along the time line in step with the pulses above.
// The friend's pose is fixed (auto-reach off); only the arm with the hammer moves.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, alpha, mix, lighten, darken, clamp01, ellipse, font, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';

const W = 680, GROUND = 430, RAIL_Y = 304, RAIL_R = 8;
const POSTS = [26, 150, 274, 398, 522, 654];
const KNOCK = { x: 125, y: RAIL_Y - RAIL_R };
const EAR = { x: 556, y: 297 };                     // your head on the rail (solved: lean 75, crouch 0.45)
const DIST_M = 340, V_STEEL = 5000, V_AIR = 340;
const T_STEEL = DIST_M / V_STEEL, T_AIR = DIST_M / V_AIR;   // 0.068 s, 1 s
const SLOW = 5;                                     // screen seconds per real second
const SPAN = EAR.x - KNOCK.x;                       // px for 340 m
const PX_AIR = SPAN / (T_AIR * SLOW);               // px per screen second
const PX_STEEL = PX_AIR * V_STEEL / V_AIR;          // 5000 : 340
const TK = 1.0, LOOP = 7.4, REST = TK + T_AIR * SLOW + 0.5;
const SIZE = 26;
// time line (b1)
const TL = { x0: 70, x1: 630, y: 364, tMax: 1.2 };
const tx = (s) => TL.x0 + (s / TL.tMax) * (TL.x1 - TL.x0);

export class FenceScene extends SimScene {
  static HEIGHT = 520;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A long steel pipe fence on posts across a grassy field. At the left a friend knocks the rail with a '
    + 'hammer; at the right you bend with your ear on the rail, 340 metres away. Two pulses leave together: a bright one '
    + 'races inside the steel rail and reaches your ear almost at once, and sound arcs cross the air slowly and arrive '
    + 'later, so your ear lights up twice. Then a time line from 0 to 1.2 seconds marks the steel sound at 0.068 seconds '
    + 'and the air sound at 1 second; a short bracket shows the 0.1 second least gap and a long bracket the real gap of '
    + '0.932 seconds.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.t() < LOOP; }

  draw(ctx, c) {
    const a = this.t(), tl = a < LOOP ? a : REST;   // one run, then rest on the air arrival
    const g = ctx.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, c.setSkyTop); g.addColorStop(0.5, c.setSkyLow); g.addColorStop(1, c.setSkyLow);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 520);
    if (this.stage >= 1) {
      ctx.save(); ctx.translate(170, -52); ctx.scale(0.5, 0.5);
      this.fence(ctx, c, tl, false);
      ctx.restore();
      this.timeLine(ctx, c, tl);
    } else {
      this.fence(ctx, c, tl, true);
    }
  }

  /** The whole fence picture at full size (b1 draws it scaled down, without tags). */
  fence(ctx, c, tl, tags) {
    const dt = tl - TK;
    // field
    const far = mix(c.setGroundFar, c.s3, 0.3), near = mix(c.setGround, c.s3, 0.42);
    const gg = ctx.createLinearGradient(0, 330, 0, 520);
    gg.addColorStop(0, far); gg.addColorStop(1, near);
    ctx.fillStyle = gg; ctx.fillRect(0, 330, W, 520 - 330);
    ctx.fillStyle = darken(mix(far, c.s3, 0.3), 0.25);
    ctx.beginPath(); ctx.moveTo(0, 334);
    for (let x = 0; x <= W; x += 12) ctx.lineTo(x, 326 - Math.abs(Math.sin(x * 0.05)) * 10 - Math.abs(Math.sin(x * 0.017)) * 12);
    ctx.lineTo(W, 334); ctx.closePath(); ctx.fill();
    // posts (behind the rail), then the rail
    for (const x of POSTS) this.post(ctx, c, x);
    // the friend knocking: fixed stance, only the arm moves (raised -> on the rail at TK -> back up)
    const swing = this.swing(dt);
    const hand = { x: 108 + 6 * swing, y: 274 - 36 * swing };   // raised in front of her, never at the face
    const fs = figureFor(this, { role: 'student', x: 52, y: GROUND, height: 250, facing: 1, i: 5, pose: { name: 'stand', lean: 8 },
      autoReach: false, hands: [hand, null], mood: 'smile' });
    this.grass(ctx, c);
    this.rail(ctx, c);
    // the steel pulse: a bright glow running inside the rail
    const xs = KNOCK.x + Math.max(0, dt) * PX_STEEL;
    // the steel path stays lit behind the pulse, and the pulse is held glowing at your ear once it arrives,
    // so the at-rest frame still shows that the knock came through the rail
    if (dt >= 0) this.steelPulse(ctx, c, Math.min(xs, EAR.x - 34), true);
    // you: bent, ear on the rail, hands on the rail (fixed)
    const tS = TK + T_STEEL * SLOW, tA = TK + T_AIR * SLOW;
    const g1 = tl >= tS ? clamp01(1 - (tl - tS) / 1.4) : 0, g2 = tl >= tA ? clamp01(1 - (tl - tA) / 2.6) : 0;
    const glow = Math.max(g1, g2);
    if (glow > 0) {
      const rg = ctx.createRadialGradient(EAR.x, EAR.y, 4, EAR.x, EAR.y, 58);
      rg.addColorStop(0, alpha(c.warning, 0.7 * glow)); rg.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(EAR.x, EAR.y, 58, 0, Math.PI * 2); ctx.fill();
    }
    const ys = figureFor(this, { role: 'student', x: 620, y: GROUND, height: 240, facing: -1, i: 2, pose: { name: 'stand', lean: 75, crouch: 0.45 },
      autoReach: false, mood: g1 > 0 || g2 > 0 ? 'happy' : 'think' });
    drawFigure(ctx, c, ys);
    drawFigure(ctx, c, fs, fs.look, { between: () => {} });
    this.hammer(ctx, c, hand, swing);
    // knock spark on contact
    if (dt >= 0 && dt < 0.3) {
      const k = 1 - dt / 0.3;
      ctx.save(); ctx.strokeStyle = alpha(c.warning, k); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const an = -Math.PI * (0.1 + i * 0.16); ctx.beginPath(); ctx.moveTo(KNOCK.x + Math.cos(an) * 14, KNOCK.y + Math.sin(an) * 14); ctx.lineTo(KNOCK.x + Math.cos(an) * (24 + 10 * k), KNOCK.y + Math.sin(an) * (24 + 10 * k)); ctx.stroke(); }
      ctx.restore();
    }
    // the air pulse: sound arcs from the knock, slow
    const rA = Math.max(0, dt) * PX_AIR, dArr = Math.hypot(EAR.x - KNOCK.x, EAR.y - KNOCK.y) - 6;
    const fade = tl > tA ? clamp01(1 - (tl - tA) / 1.2) : 1;
    for (let k = 0; k < 3; k++) {
      const r = Math.min(dArr, rA) - k * 30;
      if (dt <= 0 || r < 22) continue;
      drawSoundArcs(ctx, c, { x: KNOCK.x, y: KNOCK.y - 6, dir: -0.02, spread: 0.55, single: true, radius: r, strength: (1 - k * 0.25) * fade });
    }
    if (tags) {
      pill(ctx, c, 'steel', 340, RAIL_Y, { size: SIZE, display: true, bg: lighten(this.steel(c), 0.25) });
      pill(ctx, c, 'air', 250, 176, { size: SIZE, display: true, bg: c.raised });
      this.distanceBar(ctx, c, KNOCK.x, EAR.x, 480, '340 m');
    }
    this.probeOut = { tl: +tl.toFixed(2), steelX: Math.round(xs), airR: Math.round(rA), ratio: +(PX_STEEL / PX_AIR).toFixed(3), g1: +g1.toFixed(2), g2: +g2.toFixed(2), hand };
  }

  /** Hammer swing 0 (on the rail) .. 1 (raised), eased: up, down onto the rail at dt = 0, up again. */
  swing(dt) {
    if (dt < -0.9) return inOutSine(clamp01((dt + 1.6) / 0.6));           // lift slowly before the knock
    if (dt < 0) return 1 - inOutSine(clamp01((dt + 0.3) / 0.3));          // a quick blow
    if (dt < 0.25) return 0;                                              // rests on the rail a moment
    return 0;                                                             // stays on the rail
  }

  steel(c) { return mix(c.labelMuted, c.s7, 0.18); }

  post(ctx, c, x) {
    const st = darken(this.steel(c), 0.08), top = RAIL_Y - 14, w = 12;
    ctx.save();
    ctx.fillStyle = alpha(c.bgDeep, 0.22); ellipse(ctx, x + 4, GROUND + 4, 14, 4, 0); ctx.fill();
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, lighten(st, 0.35)); g.addColorStop(0.4, st); g.addColorStop(1, darken(st, 0.35));
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, top, w, GROUND - top + 2);
    ctx.fillStyle = darken(st, 0.2); ctx.fillRect(x - w / 2 - 2, top - 4, w + 4, 6);
    ctx.restore();
  }

  rail(ctx, c) {
    const st = this.steel(c);
    ctx.save();
    const g = ctx.createLinearGradient(0, RAIL_Y - RAIL_R, 0, RAIL_Y + RAIL_R);
    g.addColorStop(0, lighten(st, 0.3)); g.addColorStop(0.3, lighten(st, 0.55)); g.addColorStop(0.55, st); g.addColorStop(1, darken(st, 0.4));
    ctx.fillStyle = g; ctx.fillRect(0, RAIL_Y - RAIL_R, W, RAIL_R * 2);
    ctx.fillStyle = alpha(c.bgDeep, 0.18); ctx.fillRect(0, RAIL_Y + RAIL_R, W, 3);
    // couplings where pipe lengths join, over each post
    for (const x of POSTS) {
      ctx.fillStyle = darken(st, 0.15); ctx.fillRect(x - 9, RAIL_Y - RAIL_R - 2, 18, RAIL_R * 2 + 4);
      ctx.fillStyle = alpha(lighten(st, 0.6), 0.7); ctx.fillRect(x - 9, RAIL_Y - RAIL_R - 1, 18, 3);
    }
    ctx.restore();
  }

  steelPulse(ctx, c, x, trail) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, RAIL_Y - RAIL_R + 1, W, RAIL_R * 2 - 2); ctx.clip();
    if (trail && x > KNOCK.x) {
      const tg = ctx.createLinearGradient(KNOCK.x, 0, x, 0);
      tg.addColorStop(0, alpha(lighten(c.warning, 0.2), 0.6)); tg.addColorStop(1, alpha(lighten(c.warning, 0.3), 0.95));
      ctx.fillStyle = tg; ctx.fillRect(KNOCK.x, RAIL_Y - RAIL_R, x - KNOCK.x, RAIL_R * 2);
    }
    const g = ctx.createLinearGradient(x - 70, 0, x + 10, 0);
    g.addColorStop(0, alpha(c.warning, 0)); g.addColorStop(0.75, alpha(c.warning, 0.8)); g.addColorStop(1, lighten(c.warning, 0.6));
    ctx.fillStyle = g; ctx.fillRect(x - 70, RAIL_Y - RAIL_R, 80, RAIL_R * 2);
    ctx.restore();
    ctx.save();
    const rg = ctx.createRadialGradient(x, RAIL_Y, 2, x, RAIL_Y, 26);
    rg.addColorStop(0, alpha(lighten(c.warning, 0.5), 0.75)); rg.addColorStop(1, alpha(c.warning, 0));
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, RAIL_Y, 26, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /** A steel hammer held in the friend's hand: handle down-right to a head that meets the rail at swing 0. */
  hammer(ctx, c, hand, swing) {
    const an = 0.95 - swing * 0.9, L = 30;
    const hx = hand.x + Math.cos(an) * L * 0.3, hy = hand.y + Math.sin(an) * L * 0.3;
    const ex = hand.x + Math.cos(an) * L, ey = hand.y + Math.sin(an) * L;
    const wood = mix(c.s8, c.s2, 0.5), st = darken(this.steel(c), 0.1);
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = darken(wood, 0.3); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(hand.x - Math.cos(an) * 6, hand.y - Math.sin(an) * 6); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = wood; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.translate(ex, ey); ctx.rotate(an + Math.PI / 2);
    ctx.fillStyle = st; ctx.fillRect(-13, -6, 26, 12);
    ctx.fillStyle = lighten(st, 0.45); ctx.fillRect(-13, -6, 26, 3);
    ctx.fillStyle = darken(st, 0.3); ctx.fillRect(-13, 3, 26, 3);
    ctx.restore();
  }

  grass(ctx, c) {
    const gr = mix(c.s3, c.setGround, 0.35);
    ctx.save(); ctx.strokeStyle = darken(gr, 0.1); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const x = (i * 37) % W, y = GROUND + 2 + (i % 3) * 3, h = 8 + (i * 7) % 9;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - h); ctx.moveTo(x + 2, y); ctx.lineTo(x + 5, y - h * 0.8); ctx.stroke();
    }
    ctx.restore();
  }

  distanceBar(ctx, c, x1, x2, y, text) {
    ctx.save();
    ctx.font = font(c, 700, SIZE, true);
    const tw = ctx.measureText(text).width / 2 + 18, mid = (x1 + x2) / 2;
    ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y - 12); ctx.lineTo(x1, y + 12); ctx.moveTo(x2, y - 12); ctx.lineTo(x2, y + 12);
    ctx.moveTo(x1 + 4, y); ctx.lineTo(mid - tw, y); ctx.moveTo(mid + tw, y); ctx.lineTo(x2 - 4, y);
    ctx.stroke();
    const head = (x, s) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * 12, y - 6); ctx.lineTo(x - s * 12, y + 6); ctx.closePath(); ctx.fill(); };
    head(x1 + 2, -1); head(x2 - 2, 1);
    ctx.restore();
    pill(ctx, c, text, mid, y, { size: SIZE, display: true, bg: c.raised });
  }

  /** b1: the time line, its two arrivals, the 0.1 s least gap and the 0.932 s real gap. */
  timeLine(ctx, c, tl) {
    const card = { x: 24, y: 212, w: 632, h: 300 };
    ctx.save();
    ctx.fillStyle = alpha(c.bgSurface, 0.92); ctx.strokeStyle = alpha(c.stroke, 0.5); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(card.x, card.y, card.w, card.h, 16); ctx.fill(); ctx.stroke();
    // axis with small ticks every 0.1 s
    ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(TL.x0, TL.y); ctx.lineTo(TL.x1 + 8, TL.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(TL.x1 + 18, TL.y); ctx.lineTo(TL.x1 + 6, TL.y - 6); ctx.lineTo(TL.x1 + 6, TL.y + 6); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 2;
    for (let k = 0; k <= 12; k++) { const x = tx(k / 10), h = k % 5 ? 6 : 10; ctx.beginPath(); ctx.moveTo(x, TL.y - h); ctx.lineTo(x, TL.y + h); ctx.stroke(); }
    ctx.font = font(c, 700, SIZE, true); ctx.textBaseline = 'middle';
    ctx.textAlign = 'right'; ctx.fillText('0', TL.x0 - 12, TL.y);
    ctx.textAlign = 'center'; ctx.fillText('1.2 s', TL.x1 - 6, TL.y + 34);
    ctx.restore();
    // playhead in step with the fence above (real seconds = screen seconds / SLOW)
    const now = Math.max(0, Math.min(TL.tMax, (tl - TK) / SLOW));
    const done = tl >= REST - 0.01 || now >= TL.tMax;
    ctx.save(); ctx.strokeStyle = alpha(c.accent, 0.8); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(TL.x0, TL.y); ctx.lineTo(tx(now), TL.y); ctx.stroke();
    if (!done) { ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(tx(now), TL.y, 7, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    // the two arrivals: a glowing tick each, lit once the playhead has passed
    const arrival = (s, word, num) => {
      const x = tx(s), lit = now >= s || done ? 1 : 0.35;
      ctx.save(); ctx.globalAlpha = lit;
      ctx.fillStyle = alpha(c.warning, 0.35); ctx.beginPath(); ctx.arc(x, TL.y, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c.warning; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, TL.y - 18); ctx.lineTo(x, TL.y + 12); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.globalAlpha = lit;
      pill(ctx, c, num, Math.max(x, TL.x0 + 52), TL.y - 44, { size: SIZE, display: true, bg: c.raised });
      pill(ctx, c, word, Math.max(x, TL.x0 + 52), TL.y - 92, { size: SIZE, display: true, bg: word === 'steel' ? lighten(this.steel(c), 0.25) : c.raised });
      ctx.restore();
    };
    arrival(T_STEEL, 'steel', '0.068 s');
    arrival(T_AIR, 'air', '1 s');
    // brackets under the axis
    // the 0.1 s least gap: a short bracket with its value beside it on the same line (no leader)
    this.bracket(ctx, c, tx(0), tx(0.1), TL.y + 40, '', c.s5, 1);
    pill(ctx, c, '0.1 s', tx(0.1) + 14, TL.y + 34, { size: SIZE, display: true, bg: c.raised, align: 'left' });
    const gapU = done ? 1 : clamp01((now - T_STEEL) / (T_AIR - T_STEEL));
    if (now >= T_STEEL || done) this.bracket(ctx, c, tx(T_STEEL), tx(T_STEEL) + (tx(T_AIR) - tx(T_STEEL)) * gapU, TL.y + 84, gapU >= 1 ? '0.932 s' : '', c.s3, gapU);
  }

  bracket(ctx, c, x1, x2, y, text, col, u) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y - 12); ctx.lineTo(x1, y); ctx.lineTo(x2, y); if (u >= 1) ctx.lineTo(x2, y - 12); ctx.stroke();
    ctx.restore();
    if (text) pill(ctx, c, text, (x1 + x2) / 2, y + 28, { size: SIZE, display: true, bg: c.raised });
  }
}
