// ThunderScene.js - slide "Lightning First, Thunder Later" (blk-l04-a01, 3 beats). New 2026-11-03.
// Book Example 10.3. Light reaches the watcher at once; the thunder's sound arcs crawl across.
// b0 monsoon clouds over green fields, a house with a person at the right. A bolt flashes, the sky
//    lights for a moment and the stopwatch starts. The thunder leaves the strike as sound arcs and
//    travels at ARC_V px/s; the person reacts when the arcs reach them. Loops twice, then rests on
//    the arrival.
// b1 the same, plus a distance bar strike -> house "1.7 km" and the line 340 m/s x 5 s = 1700 m.
//    ARC_V = (screen distance strike -> ear) / 5 s, so the arcs arrive as the stopwatch reads 5.0 s.
// b2 a playground: a friend's balloon bursts at the left, you at the right with a stopwatch; arcs
//    cross (slow motion: 100 m at 340 m/s is 0.29 s) and the stopwatch stops when they arrive.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, alpha, mix, lighten, darken, clamp01, ellipse, font } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { drawStormCloud, drawBolt, drawBalloon } from '../shared/SoundArt.js';

const W = 680, HZN = 318;                          // horizon
const GROUND = 420;                                 // feet of the person, base of the house
const CLOUD = { x: 168, y: 190, w: 270 };
const STRIKE = { x: 96, y: 386 };                   // where the bolt meets the field
const ORIGIN = { x: 112, y: 300 };                  // thunder leaves the low part of the channel
const YOU = { x: 468, h: 190 };
const EAR = { x: YOU.x, y: GROUND - 0.86 * YOU.h };
const DELAY = 5;                                    // s: the book's 5 s
const D_ARR = Math.hypot(EAR.x - ORIGIN.x, EAR.y - ORIGIN.y) - 8;
const ARC_V = D_ARR / DELAY;                        // px per s: arrives at 5.0 s on the stopwatch
const FLASH_AT = 0.6, ARRIVE = FLASH_AT + DELAY, LOOP = 8.2, REST = ARRIVE + 0.3;
const WATCH = { x: 600, y: 104, r: 56 };
const HOLD = 3.0;                                   // b1 opens on the arrival frame (5.0 s), then replays once
const BAR_Y = 474;

// b2 playground: 100 m at 340 m/s = 0.294 s, shown in slow motion over PG_SLOW s on screen
const PG = { friend: 112, you: 586, h: 170, balloon: { x: 176, y: 178, r: 42 } };
const PG_EAR = { x: PG.you, y: GROUND - 0.86 * PG.h };
const PG_D = Math.hypot(PG_EAR.x - PG.balloon.x, PG_EAR.y - PG.balloon.y) - 8;
const PG_TIME = 100 / 340, PG_SLOW = 4.0, PG_POP = 0.8, PG_LOOP = 7.2, PG_REST = PG_POP + PG_SLOW + 0.3;

const SIZE = 26;

export class ThunderScene extends SimScene {
  static HEIGHT = 520;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'Dark monsoon clouds over green fields, with a house and a person at the right. Lightning flashes and the '
    + 'sky lights up at once; a stopwatch starts. The thunder spreads out as sound arcs that cross the fields slowly and reach '
    + 'the person when the stopwatch reads 5 seconds. Then a distance bar of 1.7 kilometres from the strike to the house and '
    + 'the line 340 metres per second times 5 seconds equals 1700 metres. Last, a playground: a friend bursts a balloon far '
    + 'away and you stop a stopwatch when the sound reaches you, with a distance bar between you.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() {
    if (this.stage === 1) return this.t() < HOLD + LOOP;
    return this.t() < (this.stage >= 2 ? PG_LOOP : LOOP) * 2;
  }

  /** Loop time: two loops, then the rest frame that shows the arrival. b1 first holds that rest frame (the sum's
   *  moment: thunder heard at 5.0 s), then plays the story once and rests on it again. */
  loopTime(loop, rest) {
    const a = this.t();
    if (this.stage === 1) { if (a < HOLD) return rest; const b = a - HOLD; return b < loop ? b : rest; }
    return a < loop * 2 ? a % loop : rest;
  }

  draw(ctx, c) {
    if (this.stage >= 2) this.playground(ctx, c);
    else this.storm(ctx, c);
  }

  // ---------------------------------------------------------------- b0, b1
  storm(ctx, c) {
    const tl = this.loopTime(LOOP, REST), dt = tl - FLASH_AT;
    // eased in over 60 ms and out over 0.5 s, with a flicker: bright, but no one-frame jump of the whole sky
    const fl = dt >= 0 && dt < 0.5 ? clamp01(dt / 0.06) * (1 - dt / 0.5) * (0.78 + 0.22 * Math.cos(dt * 40)) : 0;
    this.stormSky(ctx, c, fl, tl);
    this.fields(ctx, c, fl);
    this.house(ctx, c, fl);
    // the bolt: light, seen at once; its afterglow stays on screen so the strike is visible while the sound travels
    const after = dt >= 0 ? 0.8 : 0;
    if (fl > 0 || after > 0) {
      ctx.save(); ctx.globalAlpha = Math.max(after, Math.min(1, fl * 1.3));
      drawBolt(ctx, c, { from: { x: CLOUD.x - 20, y: CLOUD.y - 6 }, to: STRIKE, seed: 5, glow: Math.max(fl, 0.6), wd: 5, forks: 2 });
      ctx.restore();
      // the strike point: a lit patch on the field
      ctx.save(); ctx.fillStyle = alpha(lighten(c.warning, 0.6), Math.max(0.3, 0.5 * fl)); ellipse(ctx, STRIKE.x, STRIKE.y, 44, 10, 0); ctx.fill();
      ctx.fillStyle = alpha(c.warning, 0.6); ellipse(ctx, STRIKE.x, STRIKE.y, 12, 4, 0); ctx.fill(); ctx.restore();
    }
    // the thunder: sound arcs from the strike, travelling at ARC_V
    const run = Math.max(0, dt);
    const dir = Math.atan2(EAR.y - ORIGIN.y, EAR.x - ORIGIN.x);
    const fade = tl > ARRIVE ? clamp01(1 - (tl - ARRIVE) / 1.6) : 1;
    for (let k = 0; k < 3; k++) {
      const r = Math.min(D_ARR, run * ARC_V) - k * 30;
      if (dt <= 0 || r < 24) continue;
      drawSoundArcs(ctx, c, { x: ORIGIN.x, y: ORIGIN.y, dir, spread: 0.62, single: true, radius: r, strength: (1 - k * 0.25) * fade });
    }
    // the person reacts when the arcs arrive
    const react = tl >= ARRIVE ? clamp01((tl - ARRIVE) / 0.3) : 0;
    this.person(ctx, c, YOU.x, YOU.h, -1, 2, react, EAR);
    const sec = Math.min(DELAY, run);
    drawStopwatch(ctx, c, { ...WATCH, seconds: sec, dialSeconds: 10, text: sec.toFixed(1) + ' s', size: SIZE });
    if (this.stage >= 1) {
      this.extension(ctx, c, STRIKE.x, STRIKE.y + 6, BAR_Y);
      this.extension(ctx, c, YOU.x, GROUND + 4, BAR_Y);
      this.distanceBar(ctx, c, STRIKE.x, YOU.x, BAR_Y, '1.7 km');
      pill(ctx, c, '340 m/s \u00d7 5 s = 1700 m', 300, 36, { size: 28, display: true, bg: c.raised });
    }
    this.probeOut = { tl: +tl.toFixed(2), watch: +sec.toFixed(2), arcR: Math.round(Math.min(D_ARR, run * ARC_V)), dArr: Math.round(D_ARR), react };
  }

  stormSky(ctx, c, fl, tl) {
    const top = darken(mix(c.setSkyTop, c.labelMuted, 0.55), 0.38), low = mix(mix(c.setSkyLow, c.labelMuted, 0.4), c.s1, 0.12);
    const g = ctx.createLinearGradient(0, 0, 0, HZN);
    g.addColorStop(0, top); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HZN + 2);
    // far cloud deck: soft grey-blue bands
    ctx.save();
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = alpha(mix(top, c.s1, 0.2 + i * 0.1), 0.35);
      const y = 70 + i * 62;
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.013 + i * 2) * 10);
      ctx.lineTo(W, y + 40); ctx.lineTo(0, y + 40); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // layered storm clouds: one behind (smaller, bluer), the hero in front; anvil off
    ctx.save(); ctx.globalAlpha = 0.9;
    drawStormCloud(ctx, c, { x: 410, y: 158, w: 220, seed: 11, flash: fl * 0.5, rain: 0.35, t: tl });
    ctx.restore();
    drawStormCloud(ctx, c, { ...CLOUD, seed: 7, flash: fl, rain: 0.55, t: tl });
    ctx.save();
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = alpha(mix(c.label, c.bgDeep, 0.5), 1); ctx.fillRect(0, 0, W, HZN);
    ctx.globalCompositeOperation = 'color'; ctx.fillStyle = alpha(mix(mix(c.label, c.bgDeep, 0.5), c.s1, 0.75), 0.42); ctx.fillRect(0, 0, W, HZN);
    ctx.restore();
    if (fl > 0) { ctx.fillStyle = alpha(lighten(c.setSkyLow, 0.7), 0.32 * fl); ctx.fillRect(0, 0, W, HZN); }
  }

  fields(ctx, c, fl) {
    const far = mix(c.setGroundFar, c.s3, 0.3), near = mix(c.setGround, c.s3, 0.42);
    ctx.save();
    // far tree line
    ctx.fillStyle = darken(mix(far, c.s3, 0.3), 0.3);
    ctx.beginPath(); ctx.moveTo(0, HZN + 4);
    for (let x = 0; x <= W; x += 14) ctx.lineTo(x, HZN - 6 - Math.abs(Math.sin(x * 0.07)) * 12 - Math.abs(Math.sin(x * 0.023)) * 10);
    ctx.lineTo(W, HZN + 4); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(0, HZN, 0, 520);
    g.addColorStop(0, far); g.addColorStop(1, near);
    ctx.fillStyle = g; ctx.fillRect(0, HZN, W, 520 - HZN);
    // field strips in two greens, receding to the horizon
    const vp = { x: 300, y: HZN - 80 };
    for (let i = -6; i < 12; i++) {
      if (i % 2) continue;
      const xa = i * 90, xb = xa + 90;
      ctx.fillStyle = alpha(i % 4 ? lighten(near, 0.12) : darken(near, 0.08), 0.6);
      const at = (x, y) => vp.x + (x - vp.x) * (y - vp.y) / (520 - vp.y);
      ctx.beginPath(); ctx.moveTo(at(xa, HZN), HZN); ctx.lineTo(at(xb, HZN), HZN); ctx.lineTo(xb, 520); ctx.lineTo(xa, 520); ctx.closePath(); ctx.fill();
    }
    // crop rows
    ctx.strokeStyle = alpha(darken(near, 0.3), 0.35); ctx.lineWidth = 1.5;
    for (let y = HZN + 8, s = 6; y < 520; y += s, s *= 1.16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (fl > 0) { ctx.fillStyle = alpha(lighten(c.setSkyLow, 0.6), 0.22 * fl); ctx.fillRect(0, HZN, W, 520 - HZN); }
    ctx.restore();
  }

  /** A small village house: brick-red walls (lit front, shaded side), tiled roof, door and window. */
  house(ctx, c, fl) {
    const x = 540, y = GROUND, w = 98, h = 80, side = 26;
    const wall = mix(c.s6, c.setParchment, 0.55), roof = darken(mix(c.s6, c.s8, 0.4), 0.15);
    ctx.save();
    ctx.fillStyle = alpha(c.bgDeep, 0.25); ellipse(ctx, x + w / 2 + 10, y + 3, w * 0.7, 7, 0); ctx.fill();
    // side wall (shade)
    ctx.fillStyle = darken(wall, 0.22);
    ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + side, y - 10); ctx.lineTo(x + w + side, y - h - 10); ctx.lineTo(x + w, y - h); ctx.closePath(); ctx.fill();
    // front wall
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, lighten(wall, 0.08)); g.addColorStop(1, wall);
    ctx.fillStyle = g; ctx.fillRect(x, y - h, w, h);
    ctx.strokeStyle = alpha(darken(wall, 0.3), 0.35); ctx.lineWidth = 1;
    for (let yy = y - h + 9; yy < y; yy += 9) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
    // door and window
    ctx.fillStyle = darken(c.s8, 0.35); ctx.fillRect(x + 56, y - 46, 24, 46);
    ctx.fillStyle = lighten(c.s8, 0.1); ctx.fillRect(x + 59, y - 43, 18, 40);
    ctx.fillStyle = darken(c.s1, 0.45); ctx.fillRect(x + 14, y - 50, 26, 22);
    ctx.strokeStyle = lighten(wall, 0.4); ctx.lineWidth = 3; ctx.strokeRect(x + 14, y - 50, 26, 22);
    ctx.beginPath(); ctx.moveTo(x + 27, y - 50); ctx.lineTo(x + 27, y - 28); ctx.stroke();
    // roof: gable on the front, slope running back
    ctx.fillStyle = darken(roof, 0.2);
    ctx.beginPath(); ctx.moveTo(x - 10, y - h); ctx.lineTo(x + w / 2, y - h - 40); ctx.lineTo(x + w / 2 + side, y - h - 50); ctx.lineTo(x + w + side + 8, y - h - 12); ctx.lineTo(x + w + 10, y - h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = roof;
    ctx.beginPath(); ctx.moveTo(x + w / 2, y - h - 40); ctx.lineTo(x + w / 2 + side, y - h - 50); ctx.lineTo(x + w + side + 8, y - h - 12); ctx.lineTo(x + w + 10, y - h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = alpha(darken(roof, 0.35), 0.6); ctx.lineWidth = 1.4;
    for (let k = 1; k < 5; k++) { const u = k / 5; ctx.beginPath(); ctx.moveTo(x + w / 2 + side * u, y - h - 40 - 10 * u); ctx.lineTo(x + w + 10 + (side - 2) * u, y - h - 2 - 10 * u); ctx.stroke(); }
    ctx.strokeStyle = lighten(roof, 0.35); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 10, y - h); ctx.lineTo(x + w / 2, y - h - 40); ctx.stroke();
    if (fl > 0) { ctx.fillStyle = alpha(lighten(c.setSkyLow, 0.7), 0.3 * fl); ctx.fillRect(x, y - h, w, h); }
    ctx.restore();
  }

  /** A listener in one fixed pose; on arrival a soft glow at the head and a startled face. */
  person(ctx, c, x, h, facing, i, react, ear) {
    if (react > 0) {
      ctx.save();
      const g = ctx.createRadialGradient(ear.x, ear.y, 4, ear.x, ear.y, 46);
      g.addColorStop(0, alpha(c.warning, 0.55 * react)); g.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ear.x, ear.y, 46, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const spec = figureFor(this, { role: 'student', x, y: GROUND, height: h, facing, i, pose: 'stand', autoReach: false,
      mood: react > 0.5 ? 'oops' : 'smile' });
    return drawFigure(ctx, c, spec);
  }

  /** A dashed extension line from a point on the ground down to the dimension bar. */
  extension(ctx, c, x, y1, y2) {
    ctx.save(); ctx.strokeStyle = alpha(c.label, 0.7); ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2 - 12); ctx.stroke(); ctx.restore();
  }

  /** A dimension bar on the ground with end ticks and its label in a gap at the middle. */
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

  // ---------------------------------------------------------------- b2
  playground(ctx, c) {
    const tl = this.loopTime(PG_LOOP, PG_REST), dt = tl - PG_POP;
    // daytime sky over a school playground
    const g = ctx.createLinearGradient(0, 0, 0, HZN);
    g.addColorStop(0, c.setSkyTop); g.addColorStop(1, c.setSkyLow);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HZN + 2);
    this.schoolEdge(ctx, c);
    const dust = mix(c.setSand, c.setGround, 0.3);
    const gg = ctx.createLinearGradient(0, HZN, 0, 520);
    gg.addColorStop(0, mix(dust, c.setGroundFar, 0.3)); gg.addColorStop(1, darken(dust, 0.06));
    ctx.fillStyle = gg; ctx.fillRect(0, HZN, W, 520 - HZN);
    ctx.save();
    // grass edge and a chalk lane line receding
    ctx.fillStyle = mix(c.setGround, c.s3, 0.4); ctx.fillRect(0, HZN, W, 10);
    ctx.strokeStyle = alpha(c.bgSurface, 0.75); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 360); ctx.quadraticCurveTo(340, 338, W, 360); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 494); ctx.quadraticCurveTo(340, 470, W, 494); ctx.stroke();
    // pebbles and scuffs on the dust
    ctx.fillStyle = alpha(darken(dust, 0.25), 0.35);
    for (let i = 0; i < 40; i++) { const x = (i * 97) % W, y = HZN + 20 + ((i * 53) % 190); ellipse(ctx, x, y, 2 + (i % 3), 1.2, 0); ctx.fill(); }
    ctx.restore();
    // friend holding a balloon up (fixed pose, hand still)
    const B = PG.balloon, burst = dt > 0 ? clamp01(dt / 0.6) : 0;
    const hand = { x: PG.friend + 40, y: GROUND - 150 };
    const fs = figureFor(this, { role: 'student', x: PG.friend, y: GROUND, height: PG.h, facing: 1, i: 5, pose: 'stand', autoReach: false,
      hands: [hand, null], mood: 'happy' });
    drawFigure(ctx, c, fs);
    drawBalloon(ctx, c, { x: B.x, y: B.y, r: B.r, tone: 6, burst, string: (hand.y - (B.y + B.r * 1.12)) / B.r });
    // the pop's sound crosses the playground (slow motion)
    const run = Math.max(0, dt), v = PG_D / PG_SLOW;
    const dir = Math.atan2(PG_EAR.y - B.y, PG_EAR.x - B.x);
    const arrive = PG_POP + PG_SLOW, fade = tl > arrive ? clamp01(1 - (tl - arrive) / 1.4) : 1;
    for (let k = 0; k < 3; k++) {
      const r = Math.min(PG_D, run * v) - k * 30;
      if (dt <= 0 || r < 24) continue;
      drawSoundArcs(ctx, c, { x: B.x, y: B.y, dir, spread: 0.6, single: true, radius: r, strength: (1 - k * 0.25) * fade });
    }
    const react = tl >= arrive ? clamp01((tl - arrive) / 0.3) : 0;
    this.person(ctx, c, PG.you, PG.h, -1, 2, react, PG_EAR);
    // your stopwatch: starts at the burst you see, stops at the pop you hear
    const sec = Math.min(PG_TIME, run / PG_SLOW * PG_TIME);
    drawStopwatch(ctx, c, { x: PG.you, y: 100, r: 56, seconds: sec, dialSeconds: 1, text: sec.toFixed(2) + ' s', size: SIZE });
    pill(ctx, c, 'slow motion', 340, 40, { size: SIZE, display: true, bg: c.raised });
    this.distanceBar(ctx, c, PG.friend, PG.you, 456, 'distance');
    this.probeOut = { tl: +tl.toFixed(2), watch: +sec.toFixed(3), arcR: Math.round(Math.min(PG_D, run * v)), dArr: Math.round(PG_D), react };
  }

  /** The far edge of the playground: a school wall with a few trees behind. */
  schoolEdge(ctx, c) {
    ctx.save();
    // neem-like trees: tapering trunk with two limbs, a broad canopy of overlapping lobes, shade under, light on top
    const leaf = mix(c.setGround, c.s3, 0.45), bark = darken(c.setGroundFar, 0.35);
    for (let i = 0; i < 6; i++) {
      const x = 58 + i * 118 + ((i * 37) % 23) - 11, r = 30 + ((i * 7) % 3) * 6, y = HZN - 24, top = y - 30 - r * 0.5;
      ctx.fillStyle = bark;
      ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 2.5, top + r * 0.6); ctx.lineTo(x + 2.5, top + r * 0.6); ctx.lineTo(x + 5, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = bark; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x - r * 0.5, top + r * 0.5); ctx.moveTo(x, y - 20); ctx.lineTo(x + r * 0.55, top + r * 0.4); ctx.stroke();
      const lobes = [[-0.62, 0.15, 0.55], [0.6, 0.12, 0.58], [-0.25, -0.2, 0.62], [0.28, -0.25, 0.6], [0, -0.5, 0.52], [0, 0.2, 0.6]];
      ctx.fillStyle = darken(leaf, 0.22);
      for (const [dx, dy, k] of lobes) { ctx.beginPath(); ctx.arc(x + dx * r, top + dy * r + 5, k * r, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = leaf;
      for (const [dx, dy, k] of lobes) { ctx.beginPath(); ctx.arc(x + dx * r - 2, top + dy * r - 1, k * r * 0.9, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = alpha(lighten(c.s3, 0.35), 0.45);
      for (const [dx, dy, k] of lobes.slice(2, 5)) { ctx.beginPath(); ctx.arc(x + dx * r - r * 0.15, top + dy * r - r * 0.18, k * r * 0.45, 0, Math.PI * 2); ctx.fill(); }
    }
    const wall = mix(c.setParchment, c.s2, 0.3);
    ctx.fillStyle = wall; ctx.fillRect(0, HZN - 22, W, 22);
    ctx.fillStyle = darken(wall, 0.18); ctx.fillRect(0, HZN - 4, W, 4);
    ctx.fillStyle = lighten(wall, 0.25); ctx.fillRect(0, HZN - 24, W, 3);
    ctx.strokeStyle = alpha(darken(wall, 0.3), 0.4); ctx.lineWidth = 1;
    for (let x = 30; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, HZN - 21); ctx.lineTo(x, HZN - 4); ctx.stroke(); }
    ctx.restore();
  }
}
