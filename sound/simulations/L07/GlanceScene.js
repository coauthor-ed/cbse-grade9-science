// GlanceScene.js - slide "At a Glance" (blk-l07-n01, 3 beats). New 2026-11-03.
// b0 two panels: the opening's astronauts at the station (same parts, options and backdrop as
//    L01 OpeningQuestionsScene b0, radio units on, no arcs between the helmets; tag "no medium")
//    and the opening's bat and moth (same backdrop as its b1) now with a burst and its echo
//    (tag "echoes"). Comes to rest with the bat's wings raised and the echo half way back.
// b1 five cells, one per idea: a vibrating fork; a particle strip with C and R (kit field);
//    a density graph with lambda and v = lambda x nu; a cliff with an out-and-back pulse (">= 0.1 s");
//    a bat sending ultrasound ("> 20 kHz"). Two rows so each cell stays readable on a phone.
// b2 a phone playing music beside the same phone standing in a paper cone: bigger arcs from the
//    cone's wide end.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, mix, lighten, darken, pill, clamp01, mulberry32, ellipse, rr } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs, drawOutAndBack, drawParticleStrip, drawDensityGraph, sineSource, waveField, swingAmp } from 'simulations/base/kit/SimWave.js';
import { drawTuningFork } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { drawAstronaut, drawStationArm, drawBat, drawMoth, drawPhone } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const FLAP_HZ = 2.2;
const TEND0 = 7 / FLAP_HZ;                        // b0 rest: a whole number of wing beats (wings up)
const VB = 150, PB = 2.6;                         // b0 bat: burst speed (scene px/s), burst period
const PANEL = [{ x: 10, y: 10, w: 326, h: 500 }, { x: 344, y: 10, w: 326, h: 500 }];
const VIEW = [{ s: 0.78, tx: -102, ty: 58 }, { s: 0.66, tx: 344 + 163 - 0.66 * 340, ty: 260 - 0.66 * 236 }];
const LAMBDA = 180;
const STRIP_F = waveField({ source: sineSource({ amp: swingAmp(LAMBDA), freq: 0.5 }), v: LAMBDA * 0.5, origin: 186 });
const GRAPH_F = waveField({ source: sineSource({ amp: swingAmp(120), freq: 0.5 }), v: 60, origin: -206 });

// the opening's star field and tree lines (same seeds)
const STARS = (() => {
  const r = mulberry32(1007), out = [];
  for (let i = 0; i < 90; i++) out.push({ x: r() * 680, y: r() * 520, s: 0.6 + r() * 1.6, p: r() * TAU });
  return out;
})();
const TREES = (() => {
  const r = mulberry32(2203), far = [], near = [];
  for (let x = -20; x < 720; x += 34 + r() * 18) far.push({ x, h: 70 + r() * 50, w: 40 + r() * 26 });
  for (let x = -30; x < 730; x += 60 + r() * 40) near.push({ x, h: 90 + r() * 80, w: 64 + r() * 40 });
  return { far, near };
})();

export class GlanceScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static CONTINUOUS = true;          // b1 and b2 keep their small waves going; b0 comes to rest (busy)
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'Two panels: the astronauts at the space station with radio units and no medium between their '
    + 'helmets, and the bat sending a burst of ultrasound to a moth with its echo coming back. Then five small pictures: '
    + 'a vibrating tuning fork, a row of air particles with compressions and rarefactions, a density graph with the '
    + 'wavelength marked, an echo from a cliff, and a bat sending ultrasound. Last, a phone playing music beside the same '
    + 'phone standing in a paper cone, with bigger sound arcs from the cone.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) { this.cur = Math.max(0, Math.min(2, stage | 0)); }
  /** Scene time (one method, so a probe can pin a frame). */
  t() { return this.age; }
  busy() { return this.cur !== 0 || this.t() < TEND0; }

  draw(ctx, c) {
    const t = this.t();
    if (this.cur === 0) this.recap(ctx, c, Math.min(t, TEND0));
    else if (this.cur === 1) this.ideas(ctx, c, t);
    else this.phones(ctx, c, t);
  }

  // ---- b0 --------------------------------------------------------------------------------------
  recap(ctx, c, t) {
    ctx.fillStyle = c.bgDeep; ctx.fillRect(0, 0, 680, 520);
    const out = [];
    for (let i = 0; i < 2; i++) {
      const P = PANEL[i], V = VIEW[i];
      ctx.save();
      rr(ctx, P.x, P.y, P.w, P.h, 18); ctx.clip();
      ctx.translate(V.tx + (i ? 0 : P.x), V.ty); ctx.scale(V.s, V.s);
      out.push(i === 0 ? this._space(ctx, c, t, P, V) : this._night(ctx, c, t, P, V));
      ctx.restore();
      rr(ctx, P.x, P.y, P.w, P.h, 18); ctx.strokeStyle = alpha(c.stroke, 0.6); ctx.lineWidth = 3; ctx.stroke();
    }
    const map = (i, p) => ({ x: (VIEW[i].tx + (i ? 0 : PANEL[0].x)) + p.x * VIEW[i].s, y: VIEW[i].ty + p.y * VIEW[i].s });
    // tags, at screen scale
    const sp = out[0], h = map(0, { x: (sp.a1.helmet.x + sp.a2.helmet.x) / 2, y: (sp.a1.helmet.y + sp.a2.helmet.y) / 2 });
    // in the open space between the two astronauts, below their hands and above the Earth's rim
    pill(ctx, c, 'no medium', h.x + 70, h.y + 130, { ...LBL, bg: c.raised, ink: c.label, alpha: clamp01((t - 0.5) / 0.4) });
    const nt = out[1];
    if (nt.echo) {
      const e = map(1, nt.echo);
      pill(ctx, c, 'echoes', Math.min(PANEL[1].x + PANEL[1].w - 70, e.x + 10), e.y + 64, { ...LBL, bg: c.s2, alpha: clamp01((t - 1.6) / 0.4) });
    }
  }

  _space(ctx, c, t, P, V) {
    // the opening's backdrop (b0), filled to the panel edges
    const top = darken(c.water, 0.9), low = darken(mix(c.water, c.s4, 0.2), 0.72);
    const g = ctx.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, top); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(-200, -200, 1080, 920);
    const starCol = lighten(c.water, 0.92);
    for (const s of STARS) {
      ctx.fillStyle = alpha(starCol, 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(s.p + t * 1.3)));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, TAU); ctx.fill();
    }
    this._earth(ctx, c, t);
    const arm = drawStationArm(ctx, c, { x: 18, y: 44, len: 644, at: 0.76, lift: 0.35 });
    const bob = (ph) => 3 * Math.sin(t * 0.9 + ph);
    const p = arm.panel;
    const a1 = drawAstronaut(ctx, c, { x: p.x - 62, y: p.y + 92 + bob(0), s: 0.92, dir: 1, pose: 'work', tool: 'wrench', radio: true });
    const a2 = drawAstronaut(ctx, c, { x: p.x - 270, y: p.y + 196 + bob(1.7), s: 0.92, dir: 1, pose: 'float', radio: true });
    return { a1, a2 };
  }

  _earth(ctx, c, t) {
    const cx = 470, cy = 1180, R = 800;
    const ag = ctx.createRadialGradient(cx, cy, R - 6, cx, cy, R + 46);
    ag.addColorStop(0, alpha(lighten(c.water, 0.55), 0.8)); ag.addColorStop(0.35, alpha(lighten(c.water, 0.35), 0.3)); ag.addColorStop(1, alpha(c.water, 0));
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(cx, cy, R + 46, 0, TAU); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const sea = darken(c.water, 0.15);
    const eg = ctx.createRadialGradient(cx - 260, cy - R + 60, 30, cx, cy, R);
    eg.addColorStop(0, lighten(sea, 0.22)); eg.addColorStop(0.5, sea); eg.addColorStop(1, darken(sea, 0.5));
    ctx.fillStyle = eg; ctx.fillRect(-200, 300, 1080, 420);
    const land = mix(c.setGround, c.good, 0.35);
    for (const [x, y, rx, ry, rot] of [[150, 470, 120, 34, -0.2], [420, 430, 90, 22, 0.12], [610, 500, 150, 40, 0.05]]) {
      ellipse(ctx, x, y, rx, ry, rot); ctx.fillStyle = alpha(darken(land, 0.1), 0.85); ctx.fill();
      ellipse(ctx, x - rx * 0.2, y - ry * 0.25, rx * 0.6, ry * 0.5, rot); ctx.fillStyle = alpha(lighten(land, 0.15), 0.6); ctx.fill();
    }
    const cloud = lighten(c.water, 0.94);
    for (let i = 0; i < 9; i++) {
      const x = ((i * 97 + t * 3) % 820) - 70, y = 400 + ((i * 53) % 120);
      ellipse(ctx, x, y, 70 + (i % 3) * 26, 9 + (i % 2) * 6, -0.08); ctx.fillStyle = alpha(cloud, 0.55); ctx.fill();
    }
    const sh = ctx.createLinearGradient(240, 360, 680, 520);
    sh.addColorStop(0, alpha(darken(sea, 0.8), 0)); sh.addColorStop(1, alpha(darken(sea, 0.8), 0.55));
    ctx.fillStyle = sh; ctx.fillRect(-200, 300, 1080, 420);
    ctx.restore();
    ctx.strokeStyle = alpha(lighten(c.water, 0.75), 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke();
  }

  _night(ctx, c, t) {
    // the opening's backdrop (b1)
    const top = darken(c.water, 0.88), low = darken(mix(c.water, c.s4, 0.25), 0.62);
    const g = ctx.createLinearGradient(0, 0, 0, 420);
    g.addColorStop(0, top); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(-200, -200, 1080, 920);
    const starCol = lighten(c.water, 0.9);
    for (const s of STARS) {
      if (s.y > 330) continue;
      ctx.fillStyle = alpha(starCol, 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(s.p + t * 1.1)));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.s * 0.8, 0, TAU); ctx.fill();
    }
    const mx = 590, my = 86, mr = 36, moon = lighten(mix(c.warning, c.s4, 0.15), 0.75);
    const hg = ctx.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3);
    hg.addColorStop(0, alpha(moon, 0.35)); hg.addColorStop(1, alpha(moon, 0));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(mx, my, mr * 3, 0, TAU); ctx.fill();
    const mg = ctx.createRadialGradient(mx - 10, my - 10, 4, mx, my, mr);
    mg.addColorStop(0, lighten(moon, 0.4)); mg.addColorStop(1, darken(moon, 0.08));
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
    for (const [dx, dy, r] of [[-10, -6, 8], [9, 8, 6], [4, -14, 4]]) {
      ctx.fillStyle = alpha(darken(moon, 0.2), 0.45); ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, TAU); ctx.fill();
    }
    this._trees(ctx, c, mx);
    // the moth ahead, the bat behind it; the wingbeat stays in its upper half and ends raised
    const m = { x: 515 + 6 * Math.sin(t * 1.4), y: 215 + 8 * Math.sin(t * 2.1) };
    drawMoth(ctx, c, { x: m.x, y: m.y, s: 1.25, dir: -1, angle: 0.2, flap: t * 6 });
    const flap = 0.17 * (1 - Math.cos(TAU * FLAP_HZ * t));
    const bat = drawBat(ctx, c, { x: 265, y: 250 - 8 * Math.cos(TAU * FLAP_HZ * t), s: 1.95, dir: 1, flap });
    // one burst every PB s, timed so the rest frame has the echo half way back
    const M = bat.mouth, d = Math.hypot(m.x - M.x, m.y - M.y), off = TEND0 - 1.75 * 182 / VB - PB;
    let echo = null;
    for (let n = 0; n < 3; n++) {
      const tp = t - (off + n * PB);
      if (tp <= 0) continue;
      const r = VB * tp;
      for (let k = 0; k < 3; k++) {
        const rk = r - k * 13;
        if (rk > 16 && rk < d + 120) drawSoundArcs(ctx, c, { x: M.x, y: M.y, dir: Math.atan2(m.y - M.y, m.x - M.x), spread: 0.8, single: true, radius: rk, strength: (1 - k * 0.3) * clamp01((d + 120 - rk) / 120) });
        const re = rk - d;
        if (re > 10 && re < d - 20) drawSoundArcs(ctx, c, { x: m.x, y: m.y, dir: Math.atan2(M.y - m.y, M.x - m.x), spread: 0.75, single: true, radius: re, tone: 2, strength: 0.8 * (1 - k * 0.3) });
      }
      const re = r - d;
      if (re > 10 && re < d - 20) echo = { x: m.x + (M.x - m.x) * re / d, y: m.y + (M.y - m.y) * re / d };
    }
    return { echo };
  }

  _trees(ctx, c, mx) {
    const farCol = darken(mix(c.setGround, c.water, 0.45), 0.6), nearCol = darken(mix(c.setGround, c.water, 0.2), 0.78);
    const rim = alpha(lighten(c.water, 0.7), 0.4);
    const canopy = (list, base, col, rimOn, seed) => {
      const r = mulberry32(seed);
      ctx.fillStyle = col;
      const lobes = [];
      for (const tr of list) {
        const n = 7;
        for (let i = 0; i < n; i++) {
          const u = i / (n - 1), dx = (u - 0.5) * tr.w * 1.3, top = tr.h * (1 - 0.55 * Math.abs(u - 0.5) * 2);
          lobes.push([tr.x + dx + (r() - 0.5) * 8, base - top + tr.w * 0.22, tr.w * (0.2 + r() * 0.1)]);
        }
      }
      if (rimOn) {
        ctx.fillStyle = rim;
        for (const [x, y, rr2] of lobes) { const a = Math.atan2(86 - y, mx - x); ctx.beginPath(); ctx.arc(x + Math.cos(a) * 2.5, y + Math.sin(a) * 2.5, rr2, 0, TAU); ctx.fill(); }
        ctx.fillStyle = col;
      }
      for (const [x, y, rr2] of lobes) { ctx.beginPath(); ctx.arc(x, y, rr2, 0, TAU); ctx.fill(); }
      ctx.fillRect(-200, base - 60, 1080, 720 - base + 60);
    };
    canopy(TREES.far, 470, farCol, false, 11);
    canopy(TREES.near, 540, nearCol, true, 12);
  }

  // ---- b1 --------------------------------------------------------------------------------------
  card(ctx, c, x, y, w, h) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, lighten(c.bgSurface, 0.04)); g.addColorStop(1, mix(c.bgSurface, c.bgDeep, 0.5));
    rr(ctx, x, y + 4, w, h, 16); ctx.fillStyle = alpha(c.stroke, 0.35); ctx.fill();
    rr(ctx, x, y, w, h, 16); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.5); ctx.lineWidth = 2; ctx.stroke();
  }

  ideas(ctx, c, t) {
    ctx.fillStyle = c.bgDeep; ctx.fillRect(0, 0, 680, 520);
    const R1 = { y: 10, h: 240 }, R2 = { y: 262, h: 248 };
    const cells = [[10, R1, 150], [170, R1, 500], [10, R2, 300], [320, R2, 200], [530, R2, 140]];
    for (const [x, R, w] of cells) this.card(ctx, c, x, R.y, w, R.h);
    // 1 the fork vibrates
    drawTuningFork(ctx, c, { x: 85, y: 236, h: 160, vib: 1, t, freq: 4 });
    pill(ctx, c, 'vibrates', 85, 40, { ...LBL, bg: c.s6, ink: c.bgSurface });
    // 2 the particle strip with C and R
    drawParticleStrip(ctx, c, { x: 186, y: 150, w: 468, h: 84, field: STRIP_F, t: t + 30, densityShade: true, tags: true, spacing: 11, r: 3.6 });
    // 3 the density graph with its wavelength
    drawDensityGraph(ctx, c, { x: 34, y: 330, w: 252, h: 130, field: GRAPH_F, t: t + 30, linear: true, axes: false, lambda: '\u03bb', avg: true, marks: false });
    pill(ctx, c, 'v = \u03bb \u00d7 \u03bd', 160, 488, { ...LBL, bg: c.raised, ink: c.label });
    // 4 the cliff echo (slow motion): a pulse from you to the rock face and back
    this.cliff(ctx, c, t);
    // 5 a bat sending ultrasound
    const flap = 0.17 * (1 - Math.cos(TAU * FLAP_HZ * t));
    const bat = drawBat(ctx, c, { x: 584, y: 376 - 4 * Math.cos(TAU * FLAP_HZ * t), s: 0.78, dir: 1, flap });
    drawSoundArcs(ctx, c, { x: bat.mouth.x, y: bat.mouth.y, dir: 0, spread: 0.9, n: 3, wavelength: 12, r0: 8, t, speed: 18, strength: 0.9 });
    pill(ctx, c, '> 20 kHz', 600, 474, { ...LBL, bg: c.s4, ink: c.bgSurface });
  }

  cliff(ctx, c, t) {
    const x0 = 320, base = 470;
    // rock face on the right of the cell, layered strata, lit top
    const rock = mix(c.labelMuted, c.setSand ?? c.warning, 0.35);
    ctx.save(); rr(ctx, x0, 262, 200, 248, 16); ctx.clip();
    ctx.beginPath(); ctx.moveTo(468, base + 40); ctx.lineTo(462, 380); ctx.lineTo(474, 330); ctx.lineTo(470, 300); ctx.lineTo(530, 296); ctx.lineTo(530, base + 40); ctx.closePath();
    const g = ctx.createLinearGradient(462, 0, 530, 0); g.addColorStop(0, lighten(rock, 0.15)); g.addColorStop(1, darken(rock, 0.35));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = alpha(darken(rock, 0.45), 0.6); ctx.lineWidth = 2;
    for (const y of [340, 372, 404, 436]) { ctx.beginPath(); ctx.moveTo(468, y); ctx.lineTo(530, y + 4); ctx.stroke(); }
    ctx.fillStyle = mix(c.setGround, c.good, 0.4); ctx.fillRect(466, 292, 64, 8);
    ctx.fillStyle = mix(c.setGround, c.labelMuted, 0.3); ctx.fillRect(x0, base, 200, 40);
    ctx.restore();
    const spec = figureFor(this, { role: 'student', pose: 'stand', x: 352, y: base, height: 112, facing: 1, i: 2, autoReach: false });
    drawFigure(ctx, c, spec, spec.look);
    const a = { x: 372, y: base - 92 }, b = { x: 462, y: base - 92 };
    drawOutAndBack(ctx, c, { a, b, v: 70, t: t % 3.4, start: 0.3, R: 16 });
    pill(ctx, c, '\u2265 0.1 s', 420, 300, { ...LBL, bg: c.s2 });
  }

  // ---- b2 --------------------------------------------------------------------------------------
  phones(ctx, c, t) {
    // a wall and a wooden desk
    const wall = mix(c.bgSurface, c.setSand ?? c.warning, 0.18);
    const g = ctx.createLinearGradient(0, 0, 0, 380);
    g.addColorStop(0, lighten(wall, 0.05)); g.addColorStop(1, darken(wall, 0.08));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, 380);
    const wood = darken(mix(c.setSand ?? c.warning, c.s6, 0.25), 0.2);
    ctx.fillStyle = lighten(wood, 0.1); ctx.fillRect(0, 370, 680, 70);
    ctx.fillStyle = darken(wood, 0.25); ctx.fillRect(0, 440, 680, 80);
    ctx.fillStyle = alpha(lighten(wood, 0.5), 0.6); ctx.fillRect(0, 370, 680, 3);
    ctx.strokeStyle = alpha(darken(wood, 0.3), 0.35); ctx.lineWidth = 2;
    for (const [y, ph] of [[388, 0], [404, 2], [422, 4.4]]) { ctx.beginPath(); for (let x = 0; x <= 680; x += 20) { const yy = y + 3 * Math.sin(x * 0.02 + ph); x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke(); }
    ctx.fillStyle = alpha(darken(wood, 0.6), 0.5); ctx.fillRect(0, 440, 680, 5);
    const peaks = [{ u: 0.15, h: 0.8 + 0.1 * Math.sin(t * 5) }, { u: 0.3, h: 0.55 + 0.15 * Math.sin(t * 7) }, { u: 0.45, h: 0.4 + 0.12 * Math.sin(t * 6 + 1) }, { u: 0.6, h: 0.25 }, { u: 0.75, h: 0.14 }];
    // the bare phone: small arcs
    const p1 = drawPhone(ctx, c, { x: 112, y: 272, h: 200, peaks, lit: true });
    drawSoundArcs(ctx, c, { x: p1.speaker.x, y: p1.speaker.y, dir: -0.3, spread: 1.4, n: 2, wavelength: 26, r0: 14, t, strength: 0.5 });
    // the same phone in a paper cone: bigger arcs from the wide end
    const p2 = drawPhone(ctx, c, { x: 318, y: 272, h: 200, peaks, lit: true, cone: true, dir: 1 });
    const M = p2.mouth;
    drawSoundArcs(ctx, c, { x: M.x, y: M.y, dir: 0, spread: 1.1, n: 4, wavelength: 40, r0: (M.r ?? 40) * 0.5, t, strength: 1 });
    pill(ctx, c, 'bare phone', 112, 478, { ...LBL, bg: c.raised, ink: c.label });
    pill(ctx, c, 'paper cone', 420, 478, { ...LBL, bg: c.accent, ink: c.bgSurface });
  }
}
