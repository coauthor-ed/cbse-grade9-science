/**
 * HearingRangeWhistleScene - L07 blk-l07-s01 "Sounds We Cannot Hear" (2 beats). Rebuilt 2026-11-03
 * (whole file). Extends the L05 HearingRangeScene (same strip, mapping and markers).
 *   b0  the strip at the top, a marker above 20 kHz ("ultrasound"); a student blows a dog whistle:
 *       ultrasound arcs (purple, the ultrasonic zone's tone) travel to a dog, which lifts and turns its
 *       head toward the whistle (eased, 0.6 s) once the arcs arrive; the student's ear is not lit.
 *   b1  the strip in three zones; uses fade in at each end: an earthquake recording (seismograph)
 *       under infrasonic; a seated patient holding an ultrasound probe to the chest, and a survey ship
 *       with sonar, under ultrasonic.
 * The student is one fixed pose (auto-reach off, hand at the lips); nothing in the figure moves. The dog
 * is solved once from a fixed spec; only its head is turned, by a canvas rotation about the neck.
 */
import { HearingRangeScene } from '../L05/HearingRangeScene.js';
import { drawBackdrop, drawFloor, pill, alpha, mix, lighten, darken, rr, inOutSine, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { figureFor, solveFigure, paintFigure, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { drawChair } from 'simulations/base/kit/SimProps.js';
import { solveAnimal, paintAnimal, animalLook } from 'simulations/base/kit/SimAnimal.js';
import { drawWhistle, drawSeismograph, drawShip, drawSeaCut } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };
const GY = 490;
const T_BLOW = 0.3, V_US = 170, T_TURN = 0.6;

export class HearingRangeSceneWhistle extends HearingRangeScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A frequency strip with a marker above 20 kilohertz: ultrasound. A student blows a dog whistle; ultrasound arcs travel to a dog, which lifts its head and turns toward the whistle, while the student hears nothing. Then the strip in three zones, with uses at both ends: an earthquake recording under infrasonic, an ultrasound probe and a ship using sonar under ultrasonic.';

  constructor(container, config) { super(container, config); this.geo = null; }

  _tend() { return this.mode === 'b0' ? this._arrive() + T_TURN + 1.0 : 2.8; }

  _geom() {
    if (this.geo) return this.geo;
    const probe = figureFor(this, { role: 'student', x: 132, y: GY, height: 280, facing: 1, pose: 'stand', autoReach: false, i: 1 });
    const hd = solveFigure(probe).anchors.head;
    const lips = { x: hd.x + hd.r * 0.92, y: hd.y + hd.r * 0.42 };
    const ws = 1.3, wx = lips.x + 30 * ws;
    const base = { ...probe, hands: [{ x: wx + 2, y: lips.y + 8 }, null] };
    const dog = { kind: 'dog', x: 500, y: GY, length: 200, facing: -1, pose: 'stand' };
    this.geo = { base, sk: solveFigure(base), lips, ws, wx, dog, dsk: solveAnimal(dog) };
    return this.geo;
  }

  _arrive() { const G = this._geom(); return T_BLOW + (G.dsk.anchors.head.x - G.lips.x - 60) / V_US; }

  draw(ctx, c) {
    if (this.mode !== 'b0') return super.draw(ctx, c);
    const t = this.t();
    drawBackdrop(ctx, c, 'dots');
    this._whistle(ctx, c, t);
  }

  _whistle(ctx, c, t) {
    const G = this._geom();
    drawFloor(ctx, c, GY, {});
    // the strip, marker above 20 kHz
    const SY = 104;
    this.strip(ctx, c, { y: SY, h: 36, zones: true });
    this.ticks(ctx, c, SY + 24, [[20, '20 Hz'], [20000, '20 kHz']]);
    this.marker(ctx, c, this.fx(32000), SY - 21, 'ultrasound', 1, c.s4);
    // the student: fixed pose, hand at the lips
    paintFigure(ctx, c, G.sk, G.base.look, { layer: 'all' });
    const wh = drawWhistle(ctx, c, { x: G.wx, y: G.lips.y + 4, s: G.ws, dir: -1 });
    // ultrasound arcs from the whistle toward the dog (strength steady while blowing)
    const blow = clamp01((t - T_BLOW) / 0.3);
    if (blow > 0) {
      const o = wh.opening || { x: G.wx, y: G.lips.y };
      const reach = Math.max(0, (t - T_BLOW) * V_US);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 150, Math.min(680, o.x + 40 + reach), 340); ctx.clip();
      // aimed at the dog's ear (its head anchor, before it lifts)
      const ear = G.dsk.anchors.head, aim = Math.atan2(ear.y - (o.y + 6), ear.x - (o.x + 40));
      drawSoundArcs(ctx, c, { x: o.x + 40, y: o.y + 6, dir: aim, spread: 0.5, n: 8, wavelength: 20, speed: 60, r0: 10, t, strength: 0.9 * blow, tone: 5 });
      ctx.restore();
    }
    // the dog: head lowered (sniffing), lifts and turns toward the whistle when the arcs arrive
    const k = inOutSine(clamp01((t - this._arrive()) / T_TURN));
    this._dog(ctx, c, G, k, t);
  }

  _dog(ctx, c, G, k, t) {
    const sk = G.dsk, a = sk.anchors, f = G.dog.facing;
    const look = animalLook(c, 'dog', { t });
    const hd = a.head, bk = a.back;
    const nx = hd.x - bk.x, ny = hd.y - bk.y, nl = Math.hypot(nx, ny) || 1;
    const ux = nx / nl, uy = ny / nl;
    const P = { x: bk.x + nx * 0.55, y: bk.y + ny * 0.55 };
    // head angle: nose down 0.5 rad at rest, lifted 0.15 rad above level when it hears
    const th = -f * (0.5 * (1 - k) - 0.15 * k);
    const half = (sign) => {
      ctx.beginPath();
      const L = 400, px = -uy, py = ux;
      ctx.moveTo(P.x + px * L, P.y + py * L); ctx.lineTo(P.x - px * L, P.y - py * L);
      ctx.lineTo(P.x - px * L + sign * ux * L, P.y - py * L + sign * uy * L); ctx.lineTo(P.x + px * L + sign * ux * L, P.y + py * L + sign * uy * L);
      ctx.closePath();
    };
    // body side
    ctx.save(); half(-1); ctx.clip(); paintAnimal(ctx, c, sk, look); ctx.restore();
    // head side, rotated about the neck point
    ctx.save();
    ctx.translate(P.x, P.y); ctx.rotate(th); ctx.translate(-P.x, -P.y);
    half(1); ctx.clip();
    // the hearing glow round the head, once the sound has arrived
    if (k > 0) {
      const g = ctx.createRadialGradient(hd.x, hd.y, 4, hd.x, hd.y, hd.r * 2.6);
      g.addColorStop(0, alpha(c.s4, 0.45 * k)); g.addColorStop(1, alpha(c.s4, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hd.x, hd.y, hd.r * 2.6, 0, TAU); ctx.fill();
    }
    paintAnimal(ctx, c, sk, look);
    ctx.restore();
  }

  // ---- b1: uses at both ends ----------------------------------------------------------------
  _zones(ctx, c, t) {
    const SY = 156;
    drawFloor(ctx, c, GY, {});
    this.strip(ctx, c, { y: SY, h: 42, zones: true, dimAudible: true });
    pill(ctx, c, 'infrasonic', 104, SY - 50, { ...LBL, bg: c.s5, ink: c.bgDeep });
    pill(ctx, c, 'audible', 330, SY - 50, { ...LBL, bg: alpha(c.s1, 0.5), ink: c.bgDeep });
    pill(ctx, c, 'ultrasonic', 576, SY - 50, { ...LBL, bg: c.s4, ink: c.bgDeep });
    this.ticks(ctx, c, SY + 26, [[20, '20 Hz'], [20000, '20 kHz']]);
    const k = (d) => inOutSine(clamp01((t - d) / 0.6));
    // infrasonic: an earthquake on a seismograph
    ctx.save(); ctx.globalAlpha = k(0.2);
    const quake = (u) => { const e = u < 0.35 ? 0.06 : Math.exp(-(u - 0.35) * 4); return Math.sin(u * 70) * e * (u < 0.35 ? 1 : 1) * (u < 0.35 ? 1 : 0.95); };
    drawSeismograph(ctx, c, { x: 140, y: 380, len: 170, R: 40, trace: quake, upTo: 0.25 + 0.75 * k(0.2) });
    ctx.restore();
    // ultrasonic: a probe (medicine) and a ship with sonar (technology)
    ctx.save(); ctx.globalAlpha = k(0.6);
    this._patient(ctx, c, t);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = k(1.0);
    drawSeaCut(ctx, c, { x: 500, w: 180, y: 446, bottom: 520, rocks: false, t });
    const sh = drawShip(ctx, c, { x: 588, y: 446, len: 128, dir: -1, sonar: true });
    if (sh.transducer) drawSoundArcs(ctx, c, { x: sh.transducer.x, y: sh.transducer.y + 4, dir: Math.PI / 2, spread: 0.6, n: 3, wavelength: 12, speed: 30, r0: 6, t, strength: 0.8, tone: 4 });
    ctx.restore();
  }

  // medicine: a seated patient holds the probe to their own chest; the ultrasound goes into the body
  _patient(ctx, c, t) {
    const X = 366, H = 204;
    const ch = drawChair(ctx, c, { x: X, y: GY, forHeight: H, facing: 1 });
    const spec0 = figureFor(this, { role: 'adult', pose: 'sit', seat: ch.seat, x: X, y: GY, height: H, facing: 1, autoReach: false, i: 5 });
    const a0 = solveFigure(spec0).anchors;
    const P = { x: a0.hip.x + 0.17 * H, y: a0.shoulder.y + 0.42 * (a0.hip.y - a0.shoulder.y) };
    const spec = { ...spec0, hands: [{ x: P.x + 27, y: P.y + 2 }, null] };
    drawFigure(ctx, c, spec, spec.look);
    ctx.save(); ctx.translate(P.x + 2, P.y); ctx.rotate(Math.PI / 2); ctx.scale(0.52, 0.52);
    this._probe(ctx, c, 0, -28, t);
    ctx.restore();
  }

  // a hand-held ultrasound probe: a tapered body, a wide soft head at the bottom, a cable from the top
  _probe(ctx, c, x, y, t) {
    const body = mix(c.labelMuted, c.label, 0.2), head = mix(c.s4, c.bgDeep, 0.25);
    ctx.save();
    ctx.strokeStyle = darken(body, 0.45); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 52); ctx.bezierCurveTo(x - 6, y - 80, x + 34, y - 78, x + 44, y - 96); ctx.stroke();
    const path = () => { ctx.beginPath(); ctx.moveTo(x - 9, y - 54); ctx.lineTo(x + 9, y - 54); ctx.quadraticCurveTo(x + 14, y - 10, x + 26, y + 18); ctx.lineTo(x - 26, y + 18); ctx.quadraticCurveTo(x - 14, y - 10, x - 9, y - 54); ctx.closePath(); };
    const g = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
    g.addColorStop(0, lighten(body, 0.35)); g.addColorStop(0.55, body); g.addColorStop(1, darken(body, 0.25));
    path(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = darken(body, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = alpha(darken(body, 0.3), 0.6); ctx.lineWidth = 1.5;
    for (const yy of [-30, -22]) { ctx.beginPath(); ctx.moveTo(x - 10, y + yy); ctx.lineTo(x + 10, y + yy); ctx.stroke(); }
    rr(ctx, x - 28, y + 16, 56, 12, 6); ctx.fillStyle = head; ctx.fill(); ctx.strokeStyle = darken(head, 0.4); ctx.stroke();
    ctx.restore();
    drawSoundArcs(ctx, c, { x, y: y + 30, dir: Math.PI / 2, spread: 0.9, n: 3, wavelength: 16, speed: 30, r0: 10, t, strength: 0.8, tone: 4 });
  }
}
