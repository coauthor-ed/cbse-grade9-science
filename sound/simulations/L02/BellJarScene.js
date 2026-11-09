/**
 * BellJarScene - explain slide "The Bell Jar" (L02, blk-l02-s02), 3 beats, poeRecapStep 2.
 * Rebuilt 2026-11-03 (whole-file rewrite; the lab room and bench idea kept from the original,
 * the jar, bell, hammer and pump are now the kit's drawBellJar).
 *
 * b0 a big bell jar on a lab bench, an electric bell inside, the hammer striking twice a
 *    second, the vacuum pump handle working. The air inside is a still, soft-edged dot region
 *    masked to the jar; a computed air amount falls 1 -> 0.05 and the dot count follows it
 *    (stacked dot layers drop out one by one). Sound arcs outside the jar have strength =
 *    air amount, so they fade with the dots. An "air in jar" bar shows the amount. Loops
 *    slowly (a short veil between pump-downs, never a jump in view).
 * b1 starts near-empty (5 s): hammer striking, a few faint dots, NO arcs. Then the valve opens
 *    ("air in"), dots return and the arcs grow back; then the pump draws it out again, so the
 *    loop (and the at-rest frame) is the empty jar with the hammer still striking.
 * b2 the two astronauts at the station (drawAstronaut, radio on). No sound arcs. The chest
 *    radio units light in turn and a thin dashed radio-wave line runs from the one speaking
 *    to the other. Tags "radio devices" (once) and "no medium" in the gap between helmets.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, mix, lighten, darken, luma, mulberry32, ellipse, pill, rr, clamp01, drawVignette } from 'simulations/base/kit/SimLook.js';
import { drawRings, drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawBellJar } from 'simulations/base/kit/SimApparatus.js';
import { drawAstronaut, drawStationArm } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const BENCH = { y: 470, front: 494, apron: 512 };
const JAR = { x: 280, w: 280, h: 300, standH: 60 };
const STRIKES = 2;                  // hammer strikes per second
const PUMP_RATE = 0.9;              // pump handle strokes per second while pumping
const P0 = 13, DOWN0 = 9;           // b0: loop period, pump-down length
const P1 = 15.5;                    // b1: loop period (empty 0-5 s, air in 5-10 s, full, pump-down 11.5-15.5 s)
const LAYERS = 9, S0 = 15;          // air dots: 9 layers on a 45 px grid, together a 15 px grid
const RANK = [0, 5, 3, 7, 1, 8, 4, 2, 6];   // the order the layers go (spread out over the jar)
const GAUGE = { x: 612, y: 150, w: 34, h: 210 };

const smooth = (u) => { const k = clamp01(u); return k * k * (3 - 2 * k); };
// exponential pump-down / let-in from a to b over dur, exactly b at dur
const expo = (a, b, u, k = 3.2) => { const q = clamp01(u); return b + (a - b) * (Math.exp(-k * q) - Math.exp(-k)) / (1 - Math.exp(-k)); };

const STARS = (() => {
  const r = mulberry32(4409), out = [];
  for (let i = 0; i < 110; i++) out.push({ x: r() * 680, y: r() * 400, s: 0.6 + r() * 1.7, p: r() * TAU });
  return out;
})();

export class BellJarScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static CONTINUOUS = true;          // the hammer never stops striking (b0, b1); the radios keep taking turns (b2)
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A large glass bell jar on a lab bench with an electric bell inside; its hammer keeps striking. A vacuum pump draws the air out: the dots of air inside thin out, the sound arcs outside fade, and an air bar falls. With almost no air the hammer still strikes but no sound leaves the jar; when the valve lets air back in, the dots and the sound return. Then two astronauts at a space station talk through radio units on their suits, with no medium between their helmets.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this._jarPoly = null;
  }

  enter(stage) { this.cur = Math.max(0, Math.min(2, stage | 0)); }
  busy() { return true; }

  // ---- the model: everything from the beat and its time -------------------------------
  _state(t) {
    if (this.cur === 0) {
      const tau = t % P0, n = Math.floor(t / P0);
      const air = tau < DOWN0 ? expo(1, 0.05, tau / DOWN0) : 0.05;
      const pump = (n * DOWN0 + Math.min(tau, DOWN0)) * PUMP_RATE;
      let veil = 0;
      if (tau > P0 - 0.45) veil = smooth((tau - (P0 - 0.45)) / 0.45);
      else if (n > 0 && tau < 0.45) veil = 1 - smooth(tau / 0.45);
      return { air, pump, pumping: tau < DOWN0, valve: false, veil };
    }
    const tau = t % P1, n = Math.floor(t / P1);
    let air = 0.05, valve = false;
    if (tau >= 5 && tau < 10) { air = expo(0.05, 1, (tau - 5) / 5, 2.6); valve = true; }
    else if (tau >= 10 && tau < 11.5) air = 1;
    else if (tau >= 11.5) air = expo(1, 0.05, (tau - 11.5) / 4);
    const pump = (n * 4 + Math.max(0, tau - 11.5)) * PUMP_RATE;
    return { air, pump, pumping: tau >= 11.5, valve, valveK: valve ? smooth((tau - 5) / 0.4) * (1 - smooth((tau - 9.6) / 0.4)) : 0, veil: 0 };
  }

  draw(ctx, c) {
    const t = this.age;
    if (this.cur === 2) { this._space(ctx, c, t); return; }
    const dark = luma(c.bgDeep) < 0.5;
    const st = this._state(t);
    this._room(ctx, c, dark);
    this._bench(ctx, c, dark);
    const j = drawBellJar(ctx, c, { x: JAR.x, y: BENCH.y, w: JAR.w, h: JAR.h, standH: JAR.standH, hammer: t * STRIKES, ring: 1, pump: st.pump });
    this._air(ctx, c, j, st.air);
    this._strikeMarks(ctx, c, j.strike, t);
    // sound leaves the jar only as strongly as there is air to carry it
    const k = clamp01((st.air - 0.12) / 0.88);
    if (k > 0.01) {
      const g = j.bell, r0 = JAR.w / 2 + 20;
      drawSoundArcs(ctx, c, { x: g.x, y: g.y, dir: Math.PI + 0.12, spread: 0.85, n: 3, wavelength: 34, t, r0, strength: k });
      drawSoundArcs(ctx, c, { x: g.x, y: g.y, dir: -0.55, spread: 0.7, n: 3, wavelength: 34, t: t + 0.3, r0, strength: k });
    }
    this._gauge(ctx, c, st.air);
    if (st.valve && j.outlet) {
      const o = j.outlet;
      ctx.save(); ctx.globalAlpha = st.valveK;
      pill(ctx, c, 'air in', o.x - 8, o.y + 50, { ...LBL, bg: c.accent, ink: c.bgSurface });
      ctx.restore();
    }
    drawVignette(ctx, c, 0.7);
    if (st.veil > 0) { ctx.fillStyle = alpha(c.bgDeep, st.veil); ctx.fillRect(0, 0, 680, 520); }
  }

  // the hammer visibly striking (FC2 2026-11-03): swing marks beside the hammer head all the
  // time, and a short contact flash on the bell rim at each hit (phase 0), with or without air
  _strikeMarks(ctx, c, S, t) {
    if (!S) return;
    const u = (t * STRIKES) % 1, hit = u < 0.16 ? 1 - u / 0.16 : 0;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = alpha(c.label, 0.55); ctx.lineWidth = 3;
    for (const r of [22, 32]) { ctx.beginPath(); ctx.arc(S.x, S.y, r, 0.25, 1.05); ctx.stroke(); }
    if (hit > 0) {
      const g = ctx.createRadialGradient(S.x, S.y, 1, S.x, S.y, 26);
      g.addColorStop(0, alpha(lighten(c.warning, 0.4), 0.95 * hit)); g.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(S.x, S.y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = alpha(c.warning, hit); ctx.lineWidth = 3;
      for (const a of [-0.9, -0.3, 0.3]) {
        ctx.beginPath(); ctx.moveTo(S.x + 12 * Math.cos(a), S.y + 12 * Math.sin(a)); ctx.lineTo(S.x + 24 * Math.cos(a), S.y + 24 * Math.sin(a)); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---- lab ------------------------------------------------------------------------------
  _room(ctx, c, dark) {
    const wall = mix(c.bgDeep, c.s5, dark ? 0.12 : 0.06), wallLow = mix(c.bgDeep, c.s1, dark ? 0.1 : 0.05);
    const g = ctx.createLinearGradient(0, 0, 0, BENCH.y);
    g.addColorStop(0, darken(wall, dark ? 0.2 : 0.04)); g.addColorStop(1, mix(wall, wallLow, 0.6));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, BENCH.y);
    const L = ctx.createRadialGradient(110, 0, 10, 110, 0, 560);
    L.addColorStop(0, alpha(lighten(c.gold, 0.5), dark ? 0.14 : 0.22)); L.addColorStop(1, alpha(c.gold, 0));
    ctx.fillStyle = L; ctx.fillRect(0, 0, 680, BENCH.y);
    ctx.strokeStyle = alpha(darken(wall, 0.5), dark ? 0.35 : 0.12); ctx.lineWidth = 1;
    for (let x = 60; x < 680; x += 150) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BENCH.y); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, 330); ctx.lineTo(680, 330); ctx.stroke();
    // a far shelf of glassware, low contrast
    const far = (k) => mix(wall, c.label, (dark ? 0.12 : 0.17) * k);
    ctx.fillStyle = far(1.3); rr(ctx, 470, 92, 210, 8, 3); ctx.fill();
    for (const [x, kind] of [[494, 'flask'], [532, 'beaker'], [566, 'bottle'], [604, 'flask'], [646, 'beaker']]) {
      ctx.fillStyle = far(1); ctx.beginPath();
      if (kind === 'flask') { ctx.moveTo(x - 4, 52); ctx.lineTo(x + 4, 52); ctx.lineTo(x + 4, 66); ctx.lineTo(x + 15, 92); ctx.lineTo(x - 15, 92); ctx.lineTo(x - 4, 66); }
      else if (kind === 'beaker') ctx.rect(x - 11, 64, 22, 28);
      else { ctx.rect(x - 7, 60, 14, 32); ctx.rect(x - 3, 52, 6, 8); }
      ctx.fill();
      ctx.fillStyle = alpha(lighten(far(1), 0.4), 0.5); ctx.fillRect(x - 6, 70, 2, 18);
    }
  }

  _bench(ctx, c, dark) {
    const wall = mix(c.bgDeep, c.s5, dark ? 0.12 : 0.06), wood = mix(c.s8, c.waste, dark ? 0.45 : 0.3);
    ctx.fillStyle = darken(wall, dark ? 0.45 : 0.12); ctx.fillRect(0, BENCH.apron, 680, 520 - BENCH.apron);
    const g = ctx.createLinearGradient(0, BENCH.y, 680, BENCH.front);
    g.addColorStop(0, lighten(wood, dark ? 0.12 : 0.28)); g.addColorStop(1, darken(wood, dark ? 0.2 : 0.06));
    ctx.fillStyle = g; ctx.fillRect(0, BENCH.y - 6, 680, BENCH.front - BENCH.y + 6);
    ctx.strokeStyle = alpha(darken(wood, 0.4), 0.22); ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = BENCH.y - 3 + i * 3.4;
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= 680; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.02 + i * 1.7) * 1.2);
      ctx.stroke();
    }
    ctx.fillStyle = alpha(lighten(wood, 0.6), 0.5); ctx.fillRect(0, BENCH.y - 6, 680, 1.5);
    ctx.fillStyle = darken(wood, 0.3); ctx.fillRect(0, BENCH.front, 680, BENCH.apron - BENCH.front);
    ctx.fillStyle = alpha(lighten(wood, 0.3), 0.6); ctx.fillRect(0, BENCH.front, 680, 2);
  }

  // The air in the jar: still dots (no field), soft-edged, masked to the jar. LAYERS stacked
  // dot layers on offset grids make one even 15 px grid; the layers drop out in RANK order
  // as the air amount falls, so the dot count follows the amount (the last one fades).
  _air(ctx, c, j, air) {
    const poly = this._poly(j.interior);
    const S = S0 * 3;
    for (let i = 0; i < LAYERS; i++) {
      const a = clamp01(air * LAYERS - RANK[i]);
      if (a <= 0.01) continue;
      const ox = (i % 3) * S0, oy = Math.floor(i / 3) * S0;
      ctx.save(); ctx.globalAlpha = 0.85 * a;
      drawRings(ctx, c, { cx: j.interior.x + ox, cy: j.interior.y + oy, field: null, t: 0, spacing: S, r: 3.4, seed: 21 + i, source: false, mask: poly, maskFade: 18 });
      ctx.restore();
    }
  }

  _poly(I) {
    const key = [I.x, I.y, I.w, I.h].join(',');
    if (this._jarPoly && this._jarPoly.key === key) return this._jarPoly.pts;
    const L = [], R = [];
    for (let y = I.y + 2; y <= I.y + I.h - 2; y += 6) {
      let x0 = null, x1 = null;
      for (let x = I.x; x <= I.x + I.w; x += 2) if (I.contains(x, y)) { if (x0 === null) x0 = x; x1 = x; }
      if (x0 !== null) { L.push({ x: x0, y }); R.push({ x: x1, y }); }
    }
    const pts = L.concat(R.reverse());
    this._jarPoly = { key, pts };
    return pts;
  }

  _gauge(ctx, c, air) {
    const { x, y, w, h } = GAUGE;
    pill(ctx, c, 'air in jar', x + w / 2 - 34, y - 34, { ...LBL, bg: c.raised, ink: c.label });
    ctx.save();
    rr(ctx, x, y, w, h, w / 2); ctx.fillStyle = alpha(c.bgSurface, 0.85); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = darken(c.stroke, 0.1); ctx.stroke();
    rr(ctx, x, y, w, h, w / 2); ctx.clip();
    const fh = h * air, col = c.s1;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, lighten(col, 0.3)); g.addColorStop(0.55, col); g.addColorStop(1, darken(col, 0.25));
    ctx.fillStyle = g; ctx.fillRect(x, y + h - fh, w, fh);
    ctx.fillStyle = alpha(lighten(col, 0.7), 0.7); ctx.fillRect(x + 6, y + h - fh + 4, 5, Math.max(0, fh - 10));
    ctx.restore();
  }

  // ---- b2: the astronauts ---------------------------------------------------------------
  _space(ctx, c, t) {
    const top = darken(c.water, 0.9), low = darken(mix(c.water, c.s4, 0.2), 0.7);
    const g = ctx.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, top); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, 520);
    const starCol = lighten(c.water, 0.92);
    for (const s of STARS) {
      ctx.fillStyle = alpha(starCol, 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(s.p + t * 1.2)));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, TAU); ctx.fill();
    }
    this._earth(ctx, c, t);
    const arm = drawStationArm(ctx, c, { x: 10, y: 40, len: 660, at: 0.74, lift: 0.4 });
    const p = arm.panel;
    const bob = (ph) => 2.6 * Math.sin(Math.min(t, 6) * 0.8 + ph);
    // turns: the worker speaks, then the friend, 2.6 s each; a unit lights while its owner speaks
    const TURN = 2.6, turn = Math.floor(t / TURN) % 2, u = (t % TURN) / TURN;
    const on = smooth(u / 0.12) * (1 - smooth((u - 0.88) / 0.12));
    const a2 = drawAstronaut(ctx, c, { x: p.x - 346, y: p.y + 222 + bob(1.9), s: 1.0, dir: 1, pose: 'float', radio: true, radioLit: turn === 1 ? on : 0 });
    const a1 = drawAstronaut(ctx, c, { x: p.x - 58, y: p.y + 96 + bob(0), s: 1.0, dir: 1, pose: 'work', tool: 'wrench', radio: true, radioLit: turn === 0 ? on : 0 });
    const from = turn === 0 ? a1.chest : a2.chest, to = turn === 0 ? a2.chest : a1.chest;
    this._radioLink(ctx, c, from, to, u, on);
    // tags: "no medium" in the gap between the helmets, "radio devices" under the link
    const hx = (a1.helmet.x + a2.helmet.x) / 2, hy = (a1.helmet.y + a2.helmet.y) / 2;
    pill(ctx, c, 'no medium', hx - 14, hy + 6, { ...LBL, bg: c.raised, ink: c.label });
    const mx = (a1.chest.x + a2.chest.x) / 2 + 26, my = Math.max(a1.chest.y, a2.chest.y) + 44;
    pill(ctx, c, 'radio devices', mx, my, { ...LBL, bg: c.accent, ink: c.bgSurface });
    return { a1, a2 };
  }

  // A thin dashed radio-wave line (a small sine, not sound arcs) from the unit that speaks;
  // its front runs out over the first half of the turn and the far unit answers with a blink.
  _radioLink(ctx, c, a, b, u, on) {
    const front = smooth(u / 0.45), dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    const col = lighten(c.accent, 0.5);
    ctx.save();
    ctx.globalAlpha = on;
    ctx.strokeStyle = col; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.setLineDash([11, 7]); ctx.lineDashOffset = -u * 60;
    ctx.beginPath();
    const n = 60;
    for (let i = 0; i <= n * front; i++) {
      const s = i / n, w = 6 * Math.sin(s * L / 14);
      const x = a.x + dx * s + nx * w, y = a.y + dy * s + ny * w;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    const tip = { x: a.x + dx * front, y: a.y + dy * front };
    ctx.fillStyle = lighten(c.accent, 0.6); ctx.beginPath(); ctx.arc(tip.x, tip.y, 5, 0, TAU); ctx.fill();
    if (front > 0.98) {
      const k = 0.5 + 0.5 * Math.sin(u * 40);
      ctx.fillStyle = alpha(lighten(c.accent, 0.5), 0.35 + 0.35 * k);
      ctx.beginPath(); ctx.arc(b.x, b.y, 11, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  _earth(ctx, c, t) {
    const cx = 300, cy = 1230, R = 820;
    const ag = ctx.createRadialGradient(cx, cy, R - 6, cx, cy, R + 50);
    ag.addColorStop(0, alpha(lighten(c.water, 0.55), 0.8)); ag.addColorStop(0.35, alpha(lighten(c.water, 0.35), 0.3)); ag.addColorStop(1, alpha(c.water, 0));
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(cx, cy, R + 50, 0, TAU); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const sea = darken(c.water, 0.15);
    const eg = ctx.createRadialGradient(cx - 200, cy - R + 50, 30, cx, cy, R);
    eg.addColorStop(0, lighten(sea, 0.24)); eg.addColorStop(0.5, sea); eg.addColorStop(1, darken(sea, 0.5));
    ctx.fillStyle = eg; ctx.fillRect(0, 380, 680, 140);
    const land = mix(c.setGround, c.good, 0.35);
    for (const [x, y, rx, ry, rot] of [[90, 500, 110, 26, -0.1], [330, 452, 120, 22, 0.06], [600, 488, 130, 34, -0.04]]) {
      ellipse(ctx, x, y, rx, ry, rot); ctx.fillStyle = alpha(darken(land, 0.1), 0.85); ctx.fill();
      ellipse(ctx, x - rx * 0.2, y - ry * 0.25, rx * 0.6, ry * 0.5, rot); ctx.fillStyle = alpha(lighten(land, 0.15), 0.6); ctx.fill();
    }
    const cloud = lighten(c.water, 0.94);
    for (let i = 0; i < 9; i++) {
      const x = ((i * 103 + t * 2.5) % 840) - 80, y = 438 + ((i * 41) % 80);
      ellipse(ctx, x, y, 66 + (i % 3) * 24, 7 + (i % 2) * 5, -0.04); ctx.fillStyle = alpha(cloud, 0.5); ctx.fill();
    }
    const sh = ctx.createLinearGradient(260, 420, 680, 520);
    sh.addColorStop(0, alpha(darken(sea, 0.8), 0)); sh.addColorStop(1, alpha(darken(sea, 0.8), 0.55));
    ctx.fillStyle = sh; ctx.fillRect(0, 380, 680, 140);
    ctx.restore();
    ctx.strokeStyle = alpha(lighten(c.water, 0.75), 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI * 1.3, Math.PI * 1.85); ctx.stroke();
  }
}
