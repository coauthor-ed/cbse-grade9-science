// EchoCliffScene-roundtrip.js - slide "An Echo in a Corridor" (blk-l06-s05, 2 beats).
// Rebuilt 2026-11-03 (whole-file rewrite): a long empty corridor in side cut, you clap at the near end.
// b0 the clap starts a stopwatch; sound arcs run to the end wall, reflect (an image source behind the
//    wall: angle in = angle out) and come back; the stopwatch stops at 0.50 s as the echo reaches you.
// b1 the same trip as one pulse out and back (kit outAndBack), a bracket 85 m from you to the wall and
//    the line 340 x 0.5 / 2 = 85 m. Every number comes from V_REAL and ECHO_S below.
// Screen time runs SLOW times slower than real time (one "slow motion" tag). Your pose is fixed
// (auto-reach off); only the arms move for the clap.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, alpha, mix, lighten, darken, clamp01, inOutSine, rr } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs, drawOutAndBack } from 'simulations/base/kit/SimWave.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';

const W = 680;
const V_REAL = 340, ECHO_S = 0.5, DIST_M = V_REAL * ECHO_S / 2;     // 85 m
const SLAB_T = 172, CEIL = 194, BACK_FLOOR = 406, FRONT_FLOOR = 452, SLAB_B = 474;
const FEET_Y = 440, WALL_X = 632;
const FIG = { x: 92, h: 200 };
const CP = { x: 138, y: 318 };                    // where the hands meet
const SLOW = 4.5;                                 // screen seconds per real second (rest frame inside the 4 s settle)
const D = WALL_X - CP.x;                          // px for 85 m
const V = (2 * D) / (ECHO_S * SLOW);              // px per screen second
const TC = 0.6, TA = TC + ECHO_S * SLOW, REST = TA + 0.25, LOOP = REST + 0.2;
const SIZE = 26;

export class EchoCliffScene extends SimScene {
  static HEIGHT = 520;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A long empty corridor seen in a side cut, with doors along the back wall and the end wall far '
    + 'to the right. You stand at the near end and clap; a stopwatch starts on the clap. Sound arcs travel to the end '
    + 'wall, reflect and come back, and the stopwatch reads 0.50 seconds when the echo reaches you. Then one pulse goes '
    + 'out and back, a bracket shows 85 metres to the wall, and the line 340 times 0.5 divided by 2 equals 85 metres.';

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }
  busy() { return this.t() < LOOP; }

  draw(ctx, c) {
    const a = this.t(), tl = a < LOOP ? a : REST, b1 = this.stage >= 1;
    this.corridor(ctx, c);
    const e = tl - TC;                                         // screen seconds since the clap
    const heard = clamp01((tl - TA) / 0.25);
    // the sound, clipped to the inside of the corridor
    ctx.save(); ctx.beginPath(); ctx.rect(20, CEIL, WALL_X - 20, FRONT_FLOOR - CEIL); ctx.clip();
    if (!b1) {
      for (let k = 0; k < 3; k++) {
        const r = e * V - k * 26;
        if (e <= 0 || r < 20) continue;
        if (r <= D) drawSoundArcs(ctx, c, { x: CP.x, y: CP.y, dir: 0, spread: 0.5, single: true, radius: r, strength: 1 - k * 0.25 });
        else drawSoundArcs(ctx, c, { x: 2 * WALL_X - CP.x, y: CP.y, dir: Math.PI, spread: 0.5, single: true, radius: r, tone: 2, strength: (1 - k * 0.25) * 0.8 });
      }
    } else {
      drawOutAndBack(ctx, c, { a: { x: CP.x + 20, y: CP.y }, b: { x: WALL_X - 4, y: CP.y }, v: V, t: tl, start: TC, R: 30 });
    }
    ctx.restore();
    this.you(ctx, c, tl, heard);
    // stopwatch: starts on the clap, stops when the echo is back
    const secs = Math.min(ECHO_S, Math.max(0, e) / SLOW);
    drawStopwatch(ctx, c, { x: 76, y: 104, r: 58, seconds: secs, dialSeconds: 1, readout: false });
    pill(ctx, c, `${secs.toFixed(2)} s`, 196, 104, { size: 34, display: true, bg: heard > 0 ? lighten(c.warning, 0.45) : c.raised });
    pill(ctx, c, 'slow motion', 572, 36, { size: SIZE, bg: alpha(c.raised, 0.9) });
    if (b1) {
      pill(ctx, c, `${V_REAL} m/s \u00d7 ${ECHO_S} s \u00f7 2 = ${DIST_M} m`, 440, 108, { size: 30, display: true, bg: lighten(c.gold, 0.55) });
      this.bracket(ctx, c, FIG.x, WALL_X, 497, `${DIST_M} m`);
    }
    this.probeOut = { tl: +tl.toFixed(2), secs: +secs.toFixed(3), heard: +heard.toFixed(2), D, V: +V.toFixed(1) };
  }

  /** You, fixed pose; the arms swing in to clap at TC. */
  you(ctx, c, tl, heard) {
    const u = tl < TC ? inOutSine(clamp01((tl - (TC - 0.5)) / 0.5)) : tl < TC + 0.3 ? 1 : 1 - inOutSine(clamp01((tl - TC - 0.3) / 0.5)) * 0.6;
    const near = { x: CP.x + 22 * (1 - u), y: CP.y - 20 * (1 - u) }, far = { x: CP.x - 4 - 14 * (1 - u), y: CP.y + 22 * (1 - u) };
    const sp = figureFor(this, { role: 'student', x: FIG.x, y: FEET_Y, height: FIG.h, facing: 1, i: 3, pose: 'stand',
      autoReach: false, hands: [near, far], mood: heard > 0 ? 'happy' : 'smile' });
    const sk = drawFigure(ctx, c, sp);
    const hd = sk.anchors.head;
    if (heard > 0) {
      ctx.save();
      const g = ctx.createRadialGradient(hd.x - 4, hd.y, 2, hd.x - 4, hd.y, hd.r * 1.5);
      g.addColorStop(0, alpha(c.warning, 0.55 * heard)); g.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hd.x - 4, hd.y, hd.r * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // a clap flash where the hands meet
    const dc = tl - TC;
    if (dc >= 0 && dc < 0.35) {
      const k = 1 - dc / 0.35;
      ctx.save(); ctx.strokeStyle = alpha(c.warning, k); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const an = -0.9 + i * 0.45; ctx.beginPath(); ctx.moveTo(CP.x + 8 + Math.cos(an) * 10, CP.y + Math.sin(an) * 10); ctx.lineTo(CP.x + 8 + Math.cos(an) * (20 + 8 * k), CP.y + Math.sin(an) * (20 + 8 * k)); ctx.stroke(); }
      ctx.restore();
    }
  }

  corridor(ctx, c) {
    const paint = mix(c.bgSurface, c.gold, 0.16), tile = mix(c.bgSurface, c.s1, 0.3), con = mix(c.labelMuted, c.bgSurface, 0.45);
    const floorC = mix(c.labelMuted, c.bgSurface, 0.62);
    // outside the cut: a soft room tone
    ctx.fillStyle = mix(c.bgSurface, c.bgDeep, 0.08); ctx.fillRect(0, 0, W, 520);
    // back wall: painted upper part, light falling off toward the far end
    const g = ctx.createLinearGradient(0, CEIL, 0, BACK_FLOOR);
    g.addColorStop(0, darken(paint, 0.1)); g.addColorStop(0.35, paint); g.addColorStop(1, lighten(paint, 0.1));
    ctx.fillStyle = g; ctx.fillRect(20, CEIL, WALL_X - 20, BACK_FLOOR - CEIL);
    // tiled dado
    const dTop = 328;
    ctx.fillStyle = tile; ctx.fillRect(20, dTop, WALL_X - 20, BACK_FLOOR - dTop);
    ctx.fillStyle = alpha(lighten(tile, 0.5), 0.6); ctx.fillRect(20, dTop, WALL_X - 20, 3);
    ctx.strokeStyle = alpha(darken(tile, 0.25), 0.6); ctx.lineWidth = 1;
    for (let y = dTop + 26; y < BACK_FLOOR; y += 26) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(WALL_X, y); ctx.stroke(); }
    for (let x = 20; x < WALL_X; x += 26) { ctx.beginPath(); ctx.moveTo(x, dTop + 3); ctx.lineTo(x, BACK_FLOOR); ctx.stroke(); }
    ctx.fillStyle = darken(tile, 0.3); ctx.fillRect(20, dTop - 4, WALL_X - 20, 4);
    // doors along the back wall
    const wood = mix(c.s8, c.s2, 0.5);
    for (const dx of [236, 316, 396, 476, 556]) {
      const dw = 46, dh = 116, top = BACK_FLOOR - dh;
      ctx.fillStyle = darken(wood, 0.35); ctx.fillRect(dx - dw / 2 - 5, top - 5, dw + 10, dh + 5);
      const dg = ctx.createLinearGradient(dx - dw / 2, 0, dx + dw / 2, 0);
      dg.addColorStop(0, lighten(wood, 0.12)); dg.addColorStop(1, darken(wood, 0.12));
      ctx.fillStyle = dg; ctx.fillRect(dx - dw / 2, top, dw, dh);
      ctx.strokeStyle = alpha(darken(wood, 0.3), 0.7); ctx.lineWidth = 1.5;
      rr(ctx, dx - dw / 2 + 7, top + 9, dw - 14, 40, 2); ctx.stroke();
      rr(ctx, dx - dw / 2 + 7, top + 58, dw - 14, 48, 2); ctx.stroke();
      ctx.fillStyle = mix(c.gold, c.labelMuted, 0.3); ctx.beginPath(); ctx.arc(dx + dw / 2 - 8, top + 64, 3, 0, Math.PI * 2); ctx.fill();
    }
    // tube lights on the ceiling with soft pools
    for (const lx of [200, 320, 440, 560]) {
      const pg = ctx.createRadialGradient(lx, CEIL, 4, lx, CEIL, 120);
      pg.addColorStop(0, alpha(lighten(c.gold, 0.7), 0.35)); pg.addColorStop(1, alpha(c.gold, 0));
      ctx.fillStyle = pg; ctx.fillRect(lx - 120, CEIL, 240, 120);
      ctx.fillStyle = darken(con, 0.1); ctx.fillRect(lx - 36, CEIL, 72, 6);
      ctx.fillStyle = lighten(c.gold, 0.8); ctx.fillRect(lx - 32, CEIL + 6, 64, 4);
    }
    // floor plane, tiles in light perspective (joints lean away from the middle)
    ctx.fillStyle = floorC; ctx.fillRect(20, BACK_FLOOR, WALL_X - 20, FRONT_FLOOR - BACK_FLOOR);
    const fg = ctx.createLinearGradient(0, BACK_FLOOR, 0, FRONT_FLOOR);
    fg.addColorStop(0, alpha(c.bgDeep, 0.14)); fg.addColorStop(1, alpha(lighten(floorC, 0.4), 0.25));
    ctx.fillStyle = fg; ctx.fillRect(20, BACK_FLOOR, WALL_X - 20, FRONT_FLOOR - BACK_FLOOR);
    ctx.strokeStyle = alpha(darken(floorC, 0.3), 0.55); ctx.lineWidth = 1.2;
    for (const y of [BACK_FLOOR + 14, BACK_FLOOR + 30]) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(WALL_X, y); ctx.stroke(); }
    ctx.save(); ctx.beginPath(); ctx.rect(20, BACK_FLOOR, WALL_X - 20, FRONT_FLOOR - BACK_FLOOR); ctx.clip();
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, BACK_FLOOR); ctx.lineTo(x + (x - 330) * 0.18, FRONT_FLOOR); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = alpha(lighten(floorC, 0.5), 0.7); ctx.fillRect(20, FRONT_FLOOR - 2, WALL_X - 20, 2);
    // sky band over the cut and ground under it, softly shaded (not flat)
    { const sg = ctx.createLinearGradient(0, 0, 0, SLAB_T); sg.addColorStop(0, mix(c.bgSurface, c.s1, 0.10)); sg.addColorStop(1, mix(c.bgSurface, c.s1, 0.02));
      ctx.fillStyle = sg; ctx.fillRect(0, 0, W, SLAB_T);
      const gg = ctx.createLinearGradient(0, SLAB_B, 0, 520); gg.addColorStop(0, mix(c.bgSurface, c.s8, 0.14)); gg.addColorStop(1, mix(c.bgSurface, c.s8, 0.04));
      ctx.fillStyle = gg; ctx.fillRect(0, SLAB_B, W, 520 - SLAB_B); }
    // the cut: ceiling slab, floor slab and the end wall, hatched
    const cut = (x, y, w, h) => {
      ctx.fillStyle = con; ctx.fillRect(x, y, w, h);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.strokeStyle = alpha(darken(con, 0.35), 0.55); ctx.lineWidth = 1.3;
      for (let i = -h; i < w; i += 10) { ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = alpha(lighten(con, 0.4), 0.8); ctx.fillRect(x, y, w, 2);
    };
    cut(0, SLAB_T, W, CEIL - SLAB_T);
    cut(0, FRONT_FLOOR, W, SLAB_B - FRONT_FLOOR);
    cut(WALL_X, SLAB_T, W - WALL_X, SLAB_B - SLAB_T);
    cut(0, SLAB_T, 20, SLAB_B - SLAB_T);
    // the end wall face, a little lit
    ctx.fillStyle = alpha(lighten(con, 0.35), 0.9); ctx.fillRect(WALL_X - 3, CEIL, 3, FRONT_FLOOR - CEIL);
  }

  bracket(ctx, c, x0, x1, y, text) {
    ctx.save(); ctx.strokeStyle = c.label; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y - 10); ctx.lineTo(x0, y + 10); ctx.moveTo(x1, y - 10); ctx.lineTo(x1, y + 10);
    ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore();
    pill(ctx, c, text, (x0 + x1) / 2, y, { size: 30, display: true, bg: lighten(c.gold, 0.55) });
  }
}
