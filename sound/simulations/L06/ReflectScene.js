// ReflectScene.js - slide "Sound Reflects" (blk-l06-s03, 2 beats). New 2026-11-03.
// b0 a speaker on a bench at the left, a tall brick wall at the right. Each pulse is ONE sound arc of radius
// r = v (t - emitted) about the speaker cone, drawn only on the near side of the wall. Once r passes the wall,
// the reflected part is the same radius about the mirror image of the cone behind the wall (the image source),
// in the second, fainter tone, travelling back left. Four pulses, then the clock stops at REST_T with pulses on
// both legs, so the at-rest frame already shows sound going in and coming back.
// b1 two cardboard tubes on a table pointed at the wall at equal angles i = r = 35 degrees to the dashed normal
// at the point P. A small speaker at the mouth of one tube, an ear at the other. Pulses run down the incoming
// tube axis, reflect at P and run up the other; the ear glows from the first arrival. Two equal angle arcs.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, font, alpha, lighten, darken, mix, rr, drawBench, drawShadow } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawSpeaker } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, solveFigure, drawFigure } from 'simulations/base/kit/SimFigure.js';

const WX = 560, WT = 92, WTOP = 16, WBOT = 520;      // the wall: reflecting face at WX
const S0 = { x: 150, y: 300 };                       // b0 speaker cone
const V0 = 220, EMIT = [0.3, 1.95], REST_T = 2.72, SPREAD0 = 0.36;   // at rest: one pulse coming back, one going out, apart
const P = { x: WX, y: 200 }, ANG = 35 * Math.PI / 180, T_IN = 60, T_OUT = 230;   // b1 geometry
const V1 = 220, GAP1 = 0.9, N1 = 3;
const TAU = Math.PI * 2;
const ramp = (a, t0, d) => Math.max(0, Math.min(1, (a - t0) / d));
const hash = (i) => { const s = Math.sin(i * 91.7 + 17.3) * 43758.5453; return s - Math.floor(s); };

export class ReflectScene extends SimScene {
  static HEIGHT = 540;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A speaker on a bench sends sound arcs towards a brick wall. At the wall the arcs bounce and '
    + 'come back, in a fainter colour: the sound is reflected. Then two tubes point at the wall at equal angles. '
    + 'Sound from a speaker at the mouth of one tube travels down it, reflects at one point on the wall and goes up '
    + 'the other tube to an ear, which lights up. A dashed line at right angles to the wall, the normal, splits the '
    + 'two equal angles: the angle of incidence and the angle of reflection.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.stage === 0 ? this.t() < REST_T : this.t() < this.restT1(); }

  restT1() { return 0.5 + (N1 - 1) * GAP1 + (T_OUT - 20) / V1 + 0.35; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    if (this.stage >= 1) this.tubes(ctx, c);
    else this.bounce(ctx, c);
  }

  // ---- b0 ------------------------------------------------------------------------------------------------
  bounce(ctx, c) {
    const t = Math.min(this.t(), REST_T);
    this.floor(ctx, c);
    drawBench(ctx, c, 70, 230, 394);
    const live = EMIT.some((e) => t > e && t < e + 0.35);
    const cone = live ? Math.sin(TAU * 4 * t) : 0;
    const sp = drawSpeaker(ctx, c, { x: S0.x, y: S0.y, r: 46, cone, facing: 1 });
    const src = sp.cone, img = { x: 2 * WX - src.x, y: src.y }, d = WX - src.x;
    const out = { d: Math.round(d), arcs: [] };
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, WX - 1, 468); ctx.clip();
    for (const e of EMIT) {
      if (t <= e) continue;
      const r = V0 * (t - e) + 18;
      const k = 1 - ramp(r, 2 * d - 60, 160);
      if (k <= 0) continue;
      for (let j = 0; j < 3; j++) {   // each pulse is a short train of three arcs
        const rj = r - j * 22, kj = k * (1 - j * 0.25);
        if (rj < 20) continue;
        if (rj < d / Math.cos(SPREAD0) + 10) drawSoundArcs(ctx, c, { x: src.x, y: src.y, dir: 0, spread: SPREAD0, single: true, radius: rj, strength: kj });
        if (rj > d) drawSoundArcs(ctx, c, { x: img.x, y: img.y, dir: Math.PI, spread: SPREAD0, single: true, radius: rj, strength: kj * 0.85, tone: 2 });
      }
      out.arcs.push({ r: Math.round(r), back: r > d });
    }
    ctx.restore();
    this.wall(ctx, c);
    const back = out.arcs.find((g) => g.back);
    if (back) {   // the tag rides just above the top end of the returning arc
      const tx = Math.max(150, Math.min(WX - 140, img.x - back.r * Math.cos(SPREAD0) - 10)), ty = Math.max(40, src.y - back.r * Math.sin(SPREAD0) - 34);
      pill(ctx, c, 'reflected sound', tx, ty, { bg: c.s2, size: 26, display: true });
    }
    this.probeOut = out;
  }

  floor(ctx, c) {
    const y = 470;
    const g = ctx.createLinearGradient(0, y, 0, 540);
    g.addColorStop(0, mix(c.gold, c.bgSurface, 0.55)); g.addColorStop(1, mix(c.gold, c.stroke, 0.35));
    ctx.fillStyle = g; ctx.fillRect(0, y, 680, 70);
    ctx.strokeStyle = alpha(darken(c.gold, 0.4), 0.3); ctx.lineWidth = 1.5;
    for (let x = -40; x < 700; x += 70) { ctx.beginPath(); ctx.moveTo(x + 20, y); ctx.lineTo(x - 10, 540); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, y + 26); ctx.lineTo(680, y + 26); ctx.stroke();
    ctx.fillStyle = alpha(c.label, 0.18); ctx.fillRect(0, y, 680, 2);
  }

  /** A tall brick wall seen end-on: staggered courses on the face side (the reflecting face at WX, lit), the
   *  top in shade to the right, a stone cap. */
  wall(ctx, c) {
    const brick = mix(c.flame, c.stroke, 0.3), mortar = mix(c.bgSurface, c.stroke, 0.25);
    ctx.save();
    drawShadow(ctx, c, WX + WT / 2, WBOT - 48, WT, 8, 0.6);
    ctx.fillStyle = mortar; ctx.fillRect(WX, WTOP, WT, WBOT - WTOP);
    const ch = 22, bw = 34;
    for (let row = 0, y = WTOP + 12; y < WBOT; row++, y += ch) {
      const off = row % 2 ? bw / 2 : 0;
      for (let x = WX - off; x < WX + WT; x += bw) {
        const x0 = Math.max(WX + 2, x + 2), x1 = Math.min(WX + WT - 2, x + bw - 2);
        if (x1 - x0 < 4) continue;
        const v = hash(row * 7 + Math.round(x)) * 0.14 - 0.07;
        ctx.fillStyle = v > 0 ? lighten(brick, v) : darken(brick, -v);
        rr(ctx, x0, y + 2, x1 - x0, ch - 4, 2); ctx.fill();
        ctx.fillStyle = alpha(lighten(brick, 0.4), 0.45); ctx.fillRect(x0 + 1, y + 2.5, x1 - x0 - 2, 2);
      }
    }
    const sh = ctx.createLinearGradient(WX, 0, WX + WT, 0);
    sh.addColorStop(0, alpha(c.bgSurface, 0.12)); sh.addColorStop(0.3, alpha(c.bgSurface, 0)); sh.addColorStop(1, alpha(darken(brick, 0.6), 0.35));
    ctx.fillStyle = sh; ctx.fillRect(WX, WTOP, WT, WBOT - WTOP);
    ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.45); rr(ctx, WX - 6, WTOP - 4, WT + 12, 16, 3); ctx.fill();
    ctx.fillStyle = alpha(lighten(c.bgSurface, 0.5), 0.6); ctx.fillRect(WX - 4, WTOP - 3, WT + 8, 3);
    ctx.strokeStyle = lighten(brick, 0.35); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(WX + 1, WTOP + 12); ctx.lineTo(WX + 1, WBOT); ctx.stroke();
    ctx.restore();
  }

  // ---- b1 ------------------------------------------------------------------------------------------------
  tubes(ctx, c) {
    const a = this.t(), aIn = Math.PI + ANG, aOut = Math.PI - ANG;   // directions from P to the two tubes
    const at = (ang, d) => ({ x: P.x + Math.cos(ang) * d, y: P.y + Math.sin(ang) * d });
    // the table top: one flat plane holding both tubes and the normal
    ctx.save();
    const g = ctx.createLinearGradient(0, 40, 0, 500);
    g.addColorStop(0, mix(c.gold, c.bgSurface, 0.72)); g.addColorStop(1, mix(c.gold, c.bgSurface, 0.5));
    ctx.fillStyle = g; rr(ctx, 30, 40, WX - 30, 456, 14); ctx.fill();
    ctx.strokeStyle = alpha(darken(c.gold, 0.35), 0.25); ctx.lineWidth = 1.4;
    for (let i = 0; i < 9; i++) {
      const y = 70 + i * 50 + hash(i) * 10;
      ctx.beginPath(); ctx.moveTo(44, y); ctx.bezierCurveTo(200, y + 8, 360, y - 6, WX - 6, y + 4); ctx.stroke();
    }
    ctx.fillStyle = mix(c.gold, c.stroke, 0.35); rr(ctx, 30, 490, WX - 30, 12, 4); ctx.fill();
    ctx.restore();
    this.wall(ctx, c);
    // the normal and the two equal angles
    const k1 = ramp(a, 0.2, 0.5);
    ctx.save(); ctx.strokeStyle = alpha(c.label, 0.75); ctx.lineWidth = 3; ctx.setLineDash([9, 8]);
    ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(P.x - 400 * k1, P.y); ctx.stroke(); ctx.restore();
    // the tubes and the rays along their axes
    const tube = (ang) => this.tube(ctx, c, at(ang, T_OUT), at(ang, T_IN), 44);
    tube(aIn); tube(aOut);
    ctx.save(); ctx.strokeStyle = alpha(c.s1, 0.55); ctx.lineWidth = 2.5; ctx.setLineDash([4, 7]);
    for (const ang of [aIn, aOut]) { const q = at(ang, T_OUT - 10); ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(P.x, P.y); ctx.stroke(); }
    ctx.restore();
    const ka = ramp(a, 0.5, 0.6);
    if (ka > 0) {
      ctx.save(); ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.strokeStyle = c.s5; ctx.beginPath(); ctx.arc(P.x, P.y, 92, Math.PI, Math.PI + ANG * ka); ctx.stroke();
      ctx.strokeStyle = c.s5; ctx.beginPath(); ctx.arc(P.x, P.y, 92, Math.PI - ANG * ka, Math.PI); ctx.stroke();
      ctx.restore();
      if (ka > 0.6) {
        ctx.save(); ctx.globalAlpha *= ramp(ka, 0.6, 0.4); ctx.font = font(c, 700, 30, true); ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const li = at(Math.PI + ANG / 2, 120), lr = at(Math.PI - ANG / 2, 120);
        ctx.fillText('i', li.x, li.y); ctx.fillText('r', lr.x, lr.y); ctx.restore();
      }
    }
    // source: a small speaker at the mouth of the incoming tube, aimed down it
    const m1 = at(aIn, T_OUT + 8);
    drawSpeaker(ctx, c, { x: m1.x - 34, y: m1.y - 6, r: 30, facing: 1, cone: this.emitting(a) ? Math.sin(TAU * 4 * a) : 0 });
    // the ear at the mouth of the other tube
    const m2 = at(aOut, T_OUT + 6);
    const arrived = a >= this.arrive(0);
    this.listener(ctx, c, m2, arrived);
    // pulses: along the incoming axis to P, then out along the reflected axis
    const out = { arrivals: [], at: [] };
    const L = T_OUT - 20;
    for (let n = 0; n < N1; n++) {
      const t0 = 0.5 + n * GAP1, s = (Math.min(a, this.restT1()) - t0) * V1;
      if (s <= 0 || s > 2 * L) continue;
      const leg = s < L ? 0 : 1, u = leg ? s - L : L - s;
      const dir = leg ? aOut : aIn, pos = at(dir, u), heading = leg ? aOut : aIn + Math.PI;
      const R = 22;
      drawSoundArcs(ctx, c, { x: pos.x - Math.cos(heading) * R, y: pos.y - Math.sin(heading) * R, dir: heading, spread: 1.1, single: true, radius: R, strength: leg ? 0.8 : 1, tone: leg ? 2 : 1 });
      out.at.push({ n, leg, x: Math.round(pos.x), y: Math.round(pos.y) });
    }
    // tags
    if (k1 >= 1) pill(ctx, c, 'normal', 230, P.y - 30, { bg: c.raised, size: 26, display: true });
    const kw = ramp(a, 1.1, 0.35);
    if (kw > 0) {
      ctx.save(); ctx.globalAlpha *= kw;
      pill(ctx, c, 'i = r', 368, P.y + 46, { bg: lighten(c.s5, 0.55), size: 30, display: true });
      ctx.restore();
    }
    out.iDeg = Math.round(ANG * 180 / Math.PI); out.rDeg = out.iDeg; out.arrived = arrived;
    this.probeOut = out;
  }

  /** You, standing in front of the table, ear at the mouth of the second tube (facing away from it, so the
   *  ear is the tube side of the head). Pose fixed, auto-reach off; only the mood changes when the sound arrives. */
  listener(ctx, c, m, arrived) {
    const base = { role: 'student', x: m.x, y: 530, height: 220, facing: -1, i: 2, pose: 'stand', autoReach: false };
    const hd = solveFigure(figureFor(this, base)).anchors.head;
    const spec = figureFor(this, { ...base, x: 2 * m.x - hd.x - hd.r * 0.15, y: 530 + m.y - hd.y, mood: arrived ? 'happy' : 'smile' });
    const sk = drawFigure(ctx, c, spec);
    if (arrived) {
      const h = sk.anchors.head, g = ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, h.r * 1.3);
      g.addColorStop(0, alpha(c.warning, 0.5)); g.addColorStop(1, alpha(c.warning, 0));
      ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, h.r * 1.3, 0, TAU); ctx.fill(); ctx.restore();
    }
    this.feet = { knee: sk.joints?.knee || null, y: spec.y };
  }

  emitting(a) { for (let n = 0; n < N1; n++) { const t0 = 0.5 + n * GAP1; if (a > t0 - 0.3 && a < t0) return true; } return false; }

  arrive(n) { return 0.5 + n * GAP1 + 2 * (T_OUT - 20) / V1; }

  /** A cardboard tube from p (open mouth) to q (the end near the wall): a body shaded across its width, a lit
   *  stripe, dark open mouths with their rims. */
  tube(ctx, c, p, q, d) {
    const ang = Math.atan2(q.y - p.y, q.x - p.x), len = Math.hypot(q.x - p.x, q.y - p.y);
    const card = mix(c.gold, c.flame, 0.25);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
    ctx.fillStyle = alpha(darken(card, 0.6), 0.16); rr(ctx, 6, -d / 2 + 10, len, d, d / 2.4); ctx.fill();
    const g = ctx.createLinearGradient(0, -d / 2, 0, d / 2);
    g.addColorStop(0, lighten(card, 0.3)); g.addColorStop(0.35, card); g.addColorStop(1, darken(card, 0.3));
    ctx.fillStyle = g; ctx.fillRect(0, -d / 2, len, d);
    ctx.strokeStyle = alpha(lighten(card, 0.6), 0.8); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(6, -d / 2 + 6); ctx.lineTo(len - 6, -d / 2 + 6); ctx.stroke();
    ctx.strokeStyle = alpha(darken(card, 0.35), 0.4); ctx.lineWidth = 1.5;          // the paper seam
    ctx.beginPath(); for (let x = 20; x < len; x += 46) { ctx.moveTo(x, -d / 2); ctx.lineTo(x + 26, d / 2); } ctx.stroke();
    ctx.strokeStyle = darken(card, 0.4); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -d / 2); ctx.lineTo(len, -d / 2); ctx.moveTo(0, d / 2); ctx.lineTo(len, d / 2); ctx.stroke();
    for (const x of [0, len]) {
      ctx.fillStyle = darken(card, 0.55); ctx.beginPath(); ctx.ellipse(x, 0, d * 0.16, d / 2, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = lighten(card, 0.2); ctx.lineWidth = 2.5; ctx.stroke();
    }
    ctx.restore();
  }
}
