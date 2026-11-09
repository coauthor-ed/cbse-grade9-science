/**
 * RopeWaveScene - slide "Across, Not Along" (L03), 3 beats. New 2026-11-03.
 *
 * b0 you shake the left end of a long rope up and down (book Fig 10.13): the shape travels
 *    right, one red point only moves up and down (vertical double arrow), a long arrow
 *    along the rope shows the direction of propagation. The two arrows are at right angles.
 * b1 a cutaway of the ground: from a focus at the left a longitudinal wave (particles in a
 *    band with C and R, faster) and a transverse wave (a band of rock moving up and down,
 *    0.6x as fast) travel right; the seismograph standing on the ground above the right end
 *    records the first, smaller arrival, then the later one. Its trace
 *    is the two fields at the station, so the record is what arrived.
 * b2 dark space: the Sun at the left, the Earth at the right, a transverse light wave
 *    crossing the vacuum between them (no particles). Not to scale.
 *
 * Every wave is a SimWave waveField: s(d, t) = f(t - d/v); nothing is moved by hand.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, pill, alpha, darken, lighten, mix, font, ellipse, clamp01 } from 'simulations/base/kit/SimLook.js';
import { waveField, sineSource, drawRope, drawParticleStrip, drawPropagationArrow } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { drawSeismograph } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const GROUND = 486;
const LBL = { size: 26, display: true };

// b0: the rope
const R0 = { x1: 168, x2: 648, y: 252, mark: 210 };
const POST = { x: 662, top: 150, w: 24 };          // the rope's right end: a ring that slides on a wooden post
const ROPE = waveField({ source: sineSource({ amp: 36, freq: 0.7 }), v: 170, origin: R0.x1 });   // wavelength about 243 px
const ROPE_PRE = 3.0;   // s of shaking already done when the beat opens: the rope is full

// b1: the ground. Each train is a short burst (a smooth envelope over a few cycles).
const SURF = 214;
const QX0 = 64, QX1 = 618, QD = QX1 - QX0;
const QY = 392;                                    // the focus, deep in the rock at the left
const V_L = 160, V_T = 96;                         // transverse 0.6x as fast
const FQ_Q = 1.4, Q_AT = 0.4;
function quakeTrain(A, n) {
  const span = n / FQ_Q;
  const f = (tt) => { const u = tt - Q_AT; return u <= 0 || u >= span ? 0 : A * Math.sin(Math.PI * u / span) * Math.sin(TAU * FQ_Q * u); };
  return Object.assign(f, { kind: 'sine', amp: A, freq: FQ_Q, period: 1 / FQ_Q, span, wavelength: (v) => v / FQ_Q });
}
const A_L = 14, A_T = 20;                          // A_L about 0.12 of its wavelength (114 px): C and R show
const LONG = waveField({ source: quakeTrain(A_L, 3), v: V_L, origin: QX0 });
const TRANS = waveField({ source: quakeTrain(A_T, 3), v: V_T, origin: QX0 });
const T_L = Q_AT + QD / V_L, T_T = Q_AT + QD / V_T; // arrival times at the station
const Q_END = T_T + 1.0;                           // hold: the transverse train at the station, both on the record
const TREC = Q_END + 0.3;                          // the record's length (s)
const STRIP = { y: 262, h: 64 }, BAND = { y: 424, half: 17 };
const SEIS = { x: 420, R: 40, len: 380 };
SEIS.y = SURF - SEIS.R - 38;                       // its base stands on the ground line

// b2: space
const SUN = { x: 36, y: 262, r: 124 };
const EARTH = { x: 590, y: 262, r: 60 };
const LX0 = 176, LX1 = EARTH.x - EARTH.r - 8;
const LIGHT = waveField({ source: sineSource({ amp: 28, freq: 1.2 }), v: 210, origin: LX0 });
const STARS = Array.from({ length: 26 }, (_, i) => ({ x: (i * 157 + 41) % 680, y: (i * 89 + 23) % 520, r: 1.2 + ((i * 7) % 5) * 0.45 }));

export class RopeWaveScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A hand shakes one end of a long rope up and down. The wave travels along the rope while one red point only moves up and down, at right angles to the direction of propagation. Next, a cut through the ground: a longitudinal and a transverse wave leave an earthquake source; the longitudinal one reaches the seismograph first. Last, light crosses the empty space from the Sun to the Earth as a transverse wave.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) { this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(2, stage | 0)); }
  busy() { return this.age < (this.cur === 1 ? Q_END : 14); }

  draw(ctx, c) {
    if (this.cur === 0) this._rope(ctx, c, this.age);
    else if (this.cur === 1) this._quake(ctx, c, Math.min(this.age, Q_END));
    else this._space(ctx, c, this.age);
  }

  _rope(ctx, c, age) {
    const t = age + ROPE_PRE;
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, {});
    const endY = R0.y - ROPE.s(0, t);
    // one fixed stance, close enough that the arm alone covers the shake (216..288): no per-frame
    // crouch/lean re-solve, so hips, knees and feet stay still and only the arm moves
    const spec = figureFor(this, { role: 'student', x: 96, y: GROUND, height: 318, facing: 1, i: 1, autoReach: false,
      pose: { name: 'stand', lean: 10, crouch: 0.06 }, hands: [{ x: R0.x1 + 2, y: endY }, null] });
    this._post(ctx, c);
    drawFigure(ctx, c, spec, spec.look, { between: () => drawRope(ctx, c, { x1: R0.x1, x2: R0.x2, y: R0.y, field: ROPE, t, thick: 9, mark: R0.mark }) });
    this._ring(ctx, c, R0.y - ROPE.s(R0.x2 - R0.x1, t));
    const ax = R0.x1 + R0.mark + 9 + 16;
    pill(ctx, c, 'particle vibration', ax + 70, R0.y - 36 - 62, { ...LBL, bg: c.s6 });
    drawPropagationArrow(ctx, c, { x: 236, y: R0.y + 96, len: 360, label: 'direction of propagation', side: 'below' });
  }

  _post(ctx, c) {
    const wood = mix(c.s8, c.bgDeep, 0.3), x0 = POST.x - POST.w / 2;
    ctx.save();
    ctx.fillStyle = alpha(c.bgDeep, 0.18); ellipse(ctx, POST.x + 6, GROUND + 2, 26, 6, 0); ctx.fill();
    const g = ctx.createLinearGradient(x0, 0, x0 + POST.w, 0);
    g.addColorStop(0, lighten(wood, 0.3)); g.addColorStop(0.45, wood); g.addColorStop(1, darken(wood, 0.35));
    ctx.beginPath(); ctx.roundRect(x0, POST.top, POST.w, GROUND - POST.top + 2, [6, 6, 2, 2]); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = darken(wood, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = alpha(darken(wood, 0.4), 0.5); ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) { const x = x0 + 5 + i * 5; ctx.beginPath(); ctx.moveTo(x, POST.top + 14 + i * 9); ctx.bezierCurveTo(x + 2, 260, x - 2, 360, x + 1, GROUND - 10); ctx.stroke(); }
    ctx.restore();
  }

  _ring(ctx, c, y) {
    const steel = mix(c.labelMuted, c.bgSurface, 0.12);
    ctx.save(); ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(POST.x, y, POST.w / 2 + 6, 7, 0, 0, Math.PI); ctx.strokeStyle = darken(steel, 0.25); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = lighten(steel, 0.6);
    ctx.beginPath(); ctx.ellipse(POST.x, y - 1, POST.w / 2 + 6, 7, 0, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.restore();
  }

  _quake(ctx, c, t) {
    drawBackdrop(ctx, c, 'dots');
    // the ground in section: bands of rock, darker with depth, a grain of speckles, a grass line on top
    const bands = [c.setSand, mix(c.setSand, c.setBand, 0.45), mix(c.setBand, c.setGround, 0.35), c.setGroundFar, c.setGround];
    const edges = [SURF, 262, 340, 392, 470, 520];
    for (let i = 0; i < bands.length; i++) {
      ctx.beginPath();
      const top = (x) => (i === 0 ? SURF : edges[i] + 7 * Math.sin(x / 70 + i * 1.7));
      const bot = (x) => (i === bands.length - 1 ? 520 : edges[i + 1] + 7 * Math.sin(x / 70 + (i + 1) * 1.7));
      ctx.moveTo(0, top(0)); for (let x = 20; x <= 680; x += 20) ctx.lineTo(x, top(x));
      for (let x = 680; x >= 0; x -= 20) ctx.lineTo(x, bot(x));
      ctx.closePath();
      const g = ctx.createLinearGradient(0, edges[i], 0, edges[i + 1]);
      g.addColorStop(0, lighten(bands[i], 0.08)); g.addColorStop(1, darken(bands[i], 0.12));
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = alpha(darken(bands[i], 0.35), 0.6); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = alpha(darken(bands[i], 0.3), 0.45);
      for (let k = 0; k < 40; k++) { const x = (k * 97 + i * 31) % 680, y = edges[i] + 10 + ((k * 53 + i * 17) % Math.max(8, edges[i + 1] - edges[i] - 16)); ctx.fillRect(x, y, 3, 2); }
    }
    ctx.fillStyle = darken(c.s3, 0.15); ctx.fillRect(0, SURF - 5, 680, 7);
    ctx.fillStyle = alpha(lighten(c.s3, 0.3), 0.8); ctx.fillRect(0, SURF - 5, 680, 2);

    // the station: the seismograph standing on the ground above the right end; its trace is
    // the two fields at the station, so the record is what arrived
    const trace = (u) => { const tt = u * TREC; return 0.03 * Math.sin(u * 160) + 0.42 * LONG.s(QD, tt) / A_L + 1.0 * TRANS.s(QD, tt) / A_T; };
    const seis = drawSeismograph(ctx, c, { x: SEIS.x, y: SEIS.y, len: SEIS.len, R: SEIS.R, trace, upTo: clamp01(t / TREC) });
    ctx.save(); ctx.strokeStyle = alpha(c.labelMuted, 0.7); ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(QX1, SURF + 6); ctx.lineTo(QX1, 478); ctx.stroke(); ctx.restore();

    // the focus: a cracked-rock star, lit, with cracks into the rock
    this._focus(ctx, c, QX0, QY, t);

    // the longitudinal train: rock particles in a band, vibrating along the travel (C and R)
    drawParticleStrip(ctx, c, { x: QX0, y: STRIP.y, w: QD, h: STRIP.h, field: LONG, t, tube: false, densityShade: true, spacing: 11, mark: QD * 0.62 });
    // the transverse train: a band of rock that moves up and down as the shape travels
    this._rockBand(ctx, c, t);

    // tags beside the trains, and on the record beside each arrival (no leader lines)
    pill(ctx, c, 'longitudinal', 196, 238, { ...LBL, bg: c.s1 });
    pill(ctx, c, 'transverse', 184, 360, { ...LBL, bg: c.s2 });
    const midL = (T_L + 0.6) / TREC, midT = (T_T + 0.75) / TREC, up = clamp01(t / TREC);
    const ty = SEIS.y - SEIS.R - 26;
    if (t >= T_L + 1.2) pill(ctx, c, 'first', Math.max(SEIS.x - SEIS.len / 2 + 40, seis.at(midL).x), ty, { ...LBL, bg: c.raised, ink: c.label });
    if (t >= T_T + 0.9 && midT <= up) pill(ctx, c, 'later', seis.at(midT).x, ty, { ...LBL, bg: c.raised, ink: c.label });
  }

  _focus(ctx, c, x, y, t) {
    const fl = t < 0.2 ? 0.3 : 0.65 + 0.35 * Math.max(0, Math.sin(Math.min(t, 2.4) * 7)) * (1 - clamp01((t - 2) / 1.5));
    ctx.save();
    const gq = ctx.createRadialGradient(x, y, 4, x, y, 58);
    gq.addColorStop(0, alpha(c.warning, 0.7 * fl)); gq.addColorStop(1, alpha(c.flame, 0));
    ctx.fillStyle = gq; ctx.beginPath(); ctx.arc(x, y, 58, 0, TAU); ctx.fill();
    // cracks into the rock
    ctx.strokeStyle = alpha(darken(c.setGround, 0.4), 0.85); ctx.lineCap = 'round'; ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9 + 0.3, L = 34 + (i % 3) * 10;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14);
      ctx.lineTo(x + Math.cos(a + 0.18) * L * 0.6, y + Math.sin(a + 0.18) * L * 0.6); ctx.lineTo(x + Math.cos(a - 0.05) * L, y + Math.sin(a - 0.05) * L); ctx.stroke();
    }
    // the star: eight points, lit from the upper left, a darker rim
    const star = () => { ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, r = i % 2 ? 9 : 22; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); };
    const gs = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, 22);
    gs.addColorStop(0, lighten(c.warning, 0.6)); gs.addColorStop(0.55, c.warning); gs.addColorStop(1, darken(c.flame, 0.1));
    star(); ctx.fillStyle = gs; ctx.fill(); ctx.strokeStyle = darken(c.flame, 0.45); ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
  }

  _rockBand(ctx, c, t) {
    const y0 = BAND.y, h = BAND.half, rock = mix(mix(c.setBand, c.setGround, 0.25), c.s2, 0.15);
    const P = [];
    for (let x = QX0; x <= QX1; x += 4) P.push([x, y0 - TRANS.s(x - QX0, t)]);
    const band = () => { ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - h) : ctx.moveTo(x, y - h))); for (let i = P.length - 1; i >= 0; i--) ctx.lineTo(P[i][0], P[i][1] + h); ctx.closePath(); };
    ctx.save();
    const g = ctx.createLinearGradient(0, y0 - h - A_T, 0, y0 + h + A_T);
    g.addColorStop(0, lighten(rock, 0.25)); g.addColorStop(0.5, rock); g.addColorStop(1, darken(rock, 0.3));
    band(); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = darken(rock, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    // a lit top edge
    ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - h + 3) : ctx.moveTo(x, y - h + 3)));
    ctx.strokeStyle = alpha(lighten(rock, 0.6), 0.8); ctx.lineWidth = 2; ctx.stroke();
    // grains in the band: each one stays at its own x and only moves up and down
    ctx.fillStyle = alpha(darken(rock, 0.4), 0.75);
    for (let k = 0; k < 64; k++) { const d = (k * 37) % QD, y = y0 - TRANS.s(d, t) + ((k * 13) % 22) - 11; ctx.beginPath(); ctx.arc(QX0 + d, y, 2.4, 0, TAU); ctx.fill(); }
    // the marked grain (red), with its mean line
    const md = QD * 0.62, my = y0 - TRANS.s(md, t);
    ctx.beginPath(); ctx.arc(QX0 + md, my, 6, 0, TAU); ctx.fillStyle = c.s6; ctx.fill(); ctx.strokeStyle = darken(c.s6, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  _space(ctx, c, t) {
    const sky = darken(mix(c.s5, c.s1, 0.4), 0.86);
    const g = ctx.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, darken(sky, 0.2)); g.addColorStop(1, lighten(sky, 0.06));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, 520);
    for (const s of STARS) {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fillStyle = alpha(lighten(c.s2, 0.75), 0.85); ctx.fill();
    }
    // the Sun: glow, a lit disc, a few cells on the face
    const halo = ctx.createRadialGradient(SUN.x, SUN.y, SUN.r * 0.8, SUN.x, SUN.y, SUN.r * 1.7);
    halo.addColorStop(0, alpha(c.warning, 0.5)); halo.addColorStop(1, alpha(c.warning, 0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(SUN.x, SUN.y, SUN.r * 1.7, 0, TAU); ctx.fill();
    const body = ctx.createRadialGradient(SUN.x + 30, SUN.y - 30, 10, SUN.x, SUN.y, SUN.r);
    body.addColorStop(0, lighten(c.warning, 0.55)); body.addColorStop(0.6, c.warning); body.addColorStop(1, c.flame);
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(SUN.x, SUN.y, SUN.r, 0, TAU); ctx.fill();
    ctx.fillStyle = alpha(darken(c.flame, 0.05), 0.35);
    for (let i = 0; i < 9; i++) { ellipse(ctx, SUN.x + 8 + ((i * 37) % 90), SUN.y - 90 + ((i * 53) % 180), 7 + (i % 3) * 3, 4 + (i % 2) * 2, i * 0.7); ctx.fill(); }

    // the light wave: a transverse field from the Sun to the Earth
    const P = [];
    for (let x = LX0; x <= LX1; x += 3) { const d = x - LX0; if (d > LIGHT.front(t + 0.6)) break; P.push([x, SUN.y - LIGHT.s(d, t + 0.6)]); }
    if (P.length > 1) {
      const path = () => { ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      path(); ctx.strokeStyle = alpha(c.warning, 0.28); ctx.lineWidth = 16; ctx.stroke();
      path(); ctx.strokeStyle = c.warning; ctx.lineWidth = 6; ctx.stroke();
      path(); ctx.strokeStyle = lighten(c.warning, 0.7); ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }

    // the Earth: oceans, land, the night side away from the Sun, a thin air rim
    ctx.save(); ctx.beginPath(); ctx.arc(EARTH.x, EARTH.y, EARTH.r, 0, TAU); ctx.clip();
    ctx.fillStyle = c.water; ctx.fillRect(EARTH.x - EARTH.r, EARTH.y - EARTH.r, EARTH.r * 2, EARTH.r * 2);
    ctx.fillStyle = mix(c.s3, c.setSand, 0.25);
    ellipse(ctx, EARTH.x - 18, EARTH.y - 20, 24, 30, 0.5); ctx.fill();
    ellipse(ctx, EARTH.x + 22, EARTH.y + 18, 18, 26, -0.3); ctx.fill();
    ellipse(ctx, EARTH.x - 10, EARTH.y + 40, 14, 8, 0.2); ctx.fill();
    ctx.fillStyle = alpha(lighten(c.s1, 0.85), 0.75);
    ellipse(ctx, EARTH.x - 2, EARTH.y - EARTH.r + 6, 30, 8, 0); ctx.fill();
    const night = ctx.createLinearGradient(EARTH.x - EARTH.r * 0.2, 0, EARTH.x + EARTH.r, 0);
    night.addColorStop(0, alpha(sky, 0)); night.addColorStop(1, alpha(sky, 0.85));
    ctx.fillStyle = night; ctx.fillRect(EARTH.x - EARTH.r, EARTH.y - EARTH.r, EARTH.r * 2, EARTH.r * 2);
    ctx.restore();
    ctx.beginPath(); ctx.arc(EARTH.x, EARTH.y, EARTH.r + 2, Math.PI * 0.55, Math.PI * 1.45);
    ctx.strokeStyle = alpha(lighten(c.s1, 0.5), 0.8); ctx.lineWidth = 4; ctx.stroke();

    pill(ctx, c, 'vacuum', 380, 136, { ...LBL, bg: darken(sky, 0.3), ink: lighten(c.s1, 0.8) });
    ctx.font = font(c, 700, 26); ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = alpha(lighten(c.s5, 0.75), 0.9); ctx.fillText('not to scale', 660, 500);
  }
}
