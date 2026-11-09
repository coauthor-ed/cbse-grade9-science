// BangScene.js - slide "Bangs and Booms" (blk-l03-n02), 2 beats.
// b0: a cracker flashes; ONE pulse (pulseSource, so one compression and nothing after it) races
//     out through the air particles and reaches a listener, who reacts as it arrives. Repeats.
// b1: a jet flies right at 1.5 x the speed of sound. Each ring is centred where the jet WAS when
//     it was sent out, radius v_sound x (t - t_i); the jet is always ahead of them, so they pile
//     into a cone behind it. The listener on the ground reacts only when the cone edge arrives.
// Both beats are pure in time: the cycle is (age + offset) mod period.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { clamp01, mix, lighten, darken, alpha, pill } from 'simulations/base/kit/SimLook.js';
import { pulseSource, waveField, drawRings, drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawCracker, drawJet } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const GROUND = 436;
// b0: the bang
const CRACK = { x: 104, s: 1.8 };
const SRC = { x: CRACK.x, y: GROUND - 60 };   // where the gas expands: the top of the cracker
const VB = 190, BANG_AT = 0.25, PERIOD0 = 4.0;
let BANG_HIT_AT = null;   // when the computed C ring first reaches the head (pure: from constants)
const BANG = waveField({ source: pulseSource({ amp: 50, dur: 0.44, at: BANG_AT }), v: VB, falloff: 3000 });
const L0 = { x: 590, h: 272 };
// b1: the boom
const VS = 120, U = 1.5 * VS;                  // sound speed and jet speed, px/s
const JET_Y = 150, JET_LEN = 224, NOSE = JET_LEN * 0.46, X0 = -110, DT = 0.2, PERIOD1 = 4.0;
const L1 = { x: 190, h: 236 };

/** Draws one full ring of radius r in the house sound-arc style (drawSoundArcs, n = 1, mid-life). */
function ring(ctx, c, x, y, r, strength) {
  const wl = 40;
  drawSoundArcs(ctx, c, { x, y, dir: 0, spread: TAU, n: 1, wavelength: wl, r0: r - wl / 2, t: (wl / 2) / (wl * 1.2), strength });
}

export class BangScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static CONTINUOUS = true;                    // the bang and the fly-past repeat every few seconds while the beat is on
  static ARIA_LABEL = 'A firecracker on the ground flashes and one ring of crowded air races out through the air particles to a listener, who flinches when it arrives. Then a jet flies faster than sound: the rings it sends out fall behind it and pile into a cone, and the listener on the ground hears the boom only when the edge of the cone sweeps past.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) { this.cur = stage; }

  _sky(ctx, c) {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, c.setSkyTop);
    g.addColorStop(1, c.setSkyLow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 680, GROUND);
  }

  _ground(ctx, c) {
    const grass = mix(c.good, c.bgSurface, 0.55);
    const g = ctx.createLinearGradient(0, GROUND, 0, 520);
    g.addColorStop(0, lighten(grass, 0.06));
    g.addColorStop(1, darken(grass, 0.18));
    ctx.fillStyle = g;
    ctx.fillRect(0, GROUND, 680, 520 - GROUND);
    ctx.fillStyle = alpha(darken(grass, 0.35), 0.6);
    ctx.fillRect(0, GROUND, 680, 2.5);
    // mown bands that shade toward the viewer, and soft darker patches of turf
    for (let i = 0; i < 4; i++) {
      const y0 = GROUND + 6 + i * 20;
      ctx.fillStyle = alpha(i % 2 ? darken(grass, 0.1) : lighten(grass, 0.08), 0.5);
      ctx.fillRect(0, y0, 680, 10 + i * 3);
    }
    for (let i = 0; i < 18; i++) {
      const x = (i * 131.7) % 700 - 10, y = GROUND + 16 + ((i * 53) % 64), rx = 26 + (i % 4) * 9;
      ctx.fillStyle = alpha(darken(grass, 0.22), 0.28);
      ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.16, 0, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = alpha(darken(grass, 0.32), 0.45);
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {                // tufts at fixed places, bigger nearer the viewer
      const x = (i * 97.3) % 680, y = GROUND + 12 + ((i * 37) % 70), k = 0.7 + (y - GROUND) / 90;
      ctx.beginPath(); ctx.moveTo(x - 3 * k, y); ctx.quadraticCurveTo(x - 3 * k, y - 5 * k, x - 6 * k, y - 8 * k); ctx.moveTo(x + 2 * k, y); ctx.quadraticCurveTo(x + 2 * k, y - 6 * k, x + 5 * k, y - 9 * k); ctx.stroke();
    }
  }

  /** The listener: at ease, then, while the pulse is passing (hit 0..1), startled - hands over both
   *  ears, leaning back, mouth open - with shake marks beside the head. */
  _listener(ctx, c, L, hit, t, facing = -1) {
    // hit runs 1 -> about 0.14 while the pulse passes; e eases in and out over that window (about
    // a third of it each way), so the dip and the hands rise once and settle: feet never move
    const p = hit > 0 ? clamp01((1 - hit) / 0.857) : 1;
    const io = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(u));
    const e = hit > 0 ? io(p / 0.35) * io((1 - p) / 0.35) : 0;
    const on = e > 0.02;
    const spec = figureFor(this, { role: 'student', pose: { name: 'relax', crouch: 0.12 * e }, x: L.x, y: GROUND, facing, height: L.h, i: 4, mood: e > 0.3 ? 'oops' : 'smile', look: { t }, autoReach: false });
    if (on) {
      const s0 = solveFigure(spec), h0 = s0.anchors.head, rest = s0.anchors.hand;
      const ear = [{ x: h0.x - facing * h0.r * 0.15, y: h0.y + h0.r * 0.15 }, { x: h0.x - facing * h0.r * 0.35, y: h0.y + h0.r * 0.05 }];
      spec.hands = ear.map((g, i) => ({ x: rest[i].x + (g.x - rest[i].x) * e, y: rest[i].y + (g.y - rest[i].y) * e }));
    }
    const sk = drawFigure(ctx, c, spec);
    const h = sk.anchors.head;
    if (on) {
      const k = Math.min(1, hit * 1.6) * e, j = Math.sin(t * 40) * 2.5;       // the shake marks jitter a little
      ctx.save();
      ctx.strokeStyle = alpha(c.label, 0.75 * k); ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) for (let i = -1; i <= 1; i++) {
        const r0 = h.r * 1.45 + j, r1 = r0 + h.r * 0.5;
        const ang = sd < 0 ? Math.PI + i * 0.42 : -i * 0.42, ax = Math.cos(ang), ay = Math.sin(ang);
        ctx.beginPath(); ctx.moveTo(h.x + ax * r0, h.y + ay * r0); ctx.lineTo(h.x + ax * r1, h.y + ay * r1); ctx.stroke();
      }
      ctx.restore();
    }
    return h;
  }

  draw(ctx, c) {
    this._sky(ctx, c);
    this._ground(ctx, c);
    if (this.cur === 0) this._bang(ctx, c);
    else this._boom(ctx, c);
  }

  _bang(ctx, c) {
    const tl = (this.age + 1.75) % PERIOD0;         // landing (and a shot 4 s later): the ring is halfway to the listener
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 680, GROUND - 2); ctx.clip();
    this._ringTint(ctx, c, tl);
    const rg = drawRings(ctx, c, { cx: SRC.x, cy: SRC.y, R: 780, field: BANG, t: tl, spacing: 22, r: 3.2, source: false, guides: false,
      mask: { x: -40, y: 20, w: 760, h: GROUND - 20 }, maskFade: 40 });
    ctx.restore();
    const e = tl - BANG_AT;
    const flash = e < 0 ? 0 : e < 0.06 ? e / 0.06 : clamp01(1 - (e - 0.06) / 0.45);   // a fast but eased flash
    // the shaded tube stays (the kit's torn 'spent' tube is a flat shape); smoke lingers after the bang
    const smoke = e < 0 ? 0 : clamp01(flash * 1.4 + 0.8 * clamp01(1 - (e - 0.3) / 6));
    drawCracker(ctx, c, { x: CRACK.x, y: GROUND, s: CRACK.s, flash, smoke, t: tl });
    const head = { x: L0.x - 6, y: GROUND - L0.h * 0.9 };
    // the listener reacts from the moment the computed compression ring reaches the head
    const dh = Math.hypot(head.x - SRC.x, head.y - SRC.y);
    // the reaction starts on the frame the computed ring reaches the head (rc), then runs on the
    // clock from that moment: the outer C region drops out of rc part-way, which used to snap the pose
    if (BANG_HIT_AT == null) {
      for (let s = BANG_AT; s < PERIOD0; s += 1 / 240) {
        const r = BANG.regions(s, 22, 780).filter((q) => q.kind === 'C').map((q) => q.d ?? q.x).reduce((a, b) => Math.max(a, b), -1);
        if (r >= dh - 12) { BANG_HIT_AT = s; break; }
      }
      BANG_HIT_AT ??= PERIOD0;
    }
    const since = (((tl - BANG_HIT_AT) % PERIOD0) + PERIOD0) % PERIOD0;   // runs on across the loop's wrap
    const hit = since >= 0 && since < (12 + VB * 1.2) / VB ? 1 - (VB * since - 12) / (VB * 1.4) : 0;
    this._listener(ctx, c, L0, Math.min(1, hit), tl);
  }

  /** The density tint behind the one compression (as densityShade does on a strip): a darker band
   *  wherever the computed field is compressed, a paper band where it is rarefied. Rings drawn at the
   *  displaced radius, so the band moves with the pulse and nowhere else. */
  _ringTint(ctx, c, tl) {
    const ms = Math.max(0.01, BANG.maxStrain ?? 1);
    const cCol = mix(c.label, c.bgDeep, 0.25), rCol = lighten(c.setSkyLow, 0.35);
    ctx.save();
    ctx.lineWidth = 3.4;
    for (let d = 4; d < 760; d += 3) {
      const st = 1 - BANG.rhoLin(d + 1.5, tl), u = Math.min(1, Math.abs(st) / ms) ** 0.8;
      if (u < 0.04) continue;
      const r = (BANG.xAt(d + 1.5, tl) ?? d);
      ctx.lineWidth = Math.abs(BANG.xAt(d + 3, tl) - BANG.xAt(d, tl)) + 0.8;   // bands touch: no stripes where stretched
      ctx.strokeStyle = st < 0 ? alpha(cCol, 0.3 * u) : alpha(rCol, 0.7 * u);
      ctx.beginPath(); ctx.arc(SRC.x, SRC.y, Math.max(1, r), 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  _boom(ctx, c) {
    const tl = (this.age + 2.6) % PERIOD1;          // landing (and 4 s later): the jet past the middle, the cone just past the listener
    const jx = X0 + U * tl;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 680, GROUND - 2); ctx.clip();
    for (let i = 0; i * DT <= tl; i++) {
      const ti = i * DT, age = tl - ti, r = VS * age;
      const k = clamp01(1 - age / 5);
      if (r > 4 && k > 0.03) ring(ctx, c, X0 + U * ti + NOSE, JET_Y, r, 0.2 + 0.55 * k);
    }
    ctx.restore();
    // the cone the rings pile into (the envelope of the rings: half angle asin(VS / U))
    const back = Math.sqrt(U * U - VS * VS) / VS;  // how far behind the nose the cone edge is, per px of drop
    const nx = jx + NOSE;
    const head = { x: L1.x - 6, y: GROUND - L1.h * 0.9 };
    const drop = head.y - JET_Y;
    const arrive = (head.x + drop * back - X0 - NOSE) / U;
    const hit = tl >= arrive && tl < arrive + 1.8 ? 1 - (tl - arrive) / 2.1 : 0;
    drawJet(ctx, c, { x: jx, y: JET_Y, len: JET_LEN, dir: 1 });
    const h = this._listener(ctx, c, L1, hit, tl);
    // the label rides the lower edge of the cone, on the computed envelope line
    const ly = 318, lx = nx - (ly - JET_Y) * back;
    if (lx > 280 && lx < 470) pill(ctx, c, 'sonic boom', lx + 120, ly + 8, { size: 30, bg: c.raised, fg: c.label });
  }
}
