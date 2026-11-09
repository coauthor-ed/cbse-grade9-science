/**
 * WhatVibratesScene - slide "Many Sources" (L01 blk-l01-s05), 2 beats. Rebuilt 2026-11-03
 * (whole file; the old DOM card wall is replaced by a canvas scene on the SoundArt parts).
 *
 * b0 four instruments large in a 2x2: ektara (string), tabla (skin), bansuri (air inside),
 *    taal (metal). A tag under each names its vibrating part. Tap an
 *    instrument: that instrument's vibrating part vibrates and glows and sound arcs leave it.
 *    With no tap the four take turns, one lit every 2 s, so the resting frame shows one lit.
 * b1 two large: the bansuri cut away, its air column lit, the air particles in it vibrating
 *    about their own places (SimWave field); the taal's two rims meeting and ringing, arcs
 *    leaving them. Tags "air column" and "metal".
 * Not on this slide: frequency, pitch, waves travelling to a listener.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, darken, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs, waveField, sineSource, swingAmp, drawParticleStrip } from 'simulations/base/kit/SimWave.js';
import { drawEktara, drawTabla, drawBansuri, drawTaal } from '../shared/SoundArt.js';

const LBL = { size: 26, display: true };
const STEP = 2;                      // b0 tour: seconds per instrument
const TOUR_END = 16.9;               // b0 rests here (the ektara fully lit)
const STRIKE = 2.2;                  // b1 taal: one strike cycle (s)
const B1_END = STRIKE * 3 + 0.55;    // b1 rests just after a strike, rims ringing

// b0 parts: tag text, tag spot (under its own instrument), cell rect (tap)
const PARTS = [
  { key: 'string', tx: 122, ty: 254, cell: { x0: 0, y0: 0, x1: 340, y1: 270 } },
  { key: 'skin', tx: 512, ty: 248, cell: { x0: 340, y0: 0, x1: 680, y1: 270 } },
  { key: 'air', tx: 172, ty: 446, cell: { x0: 0, y0: 270, x1: 340, y1: 520 } },
  { key: 'metal', tx: 512, ty: 488, cell: { x0: 340, y0: 270, x1: 680, y1: 520 } },
];
const FADE = 0.45;                   // b0: the glow fades in and out over this (s)

// b1: the bansuri's air column, a sound wave in it (wavelength 200 px, 0.7 Hz on screen)
const FLUTE = { x: 300, y: 146, len: 540, wd: 70 };
const AIR_F = waveField({ source: sineSource({ amp: swingAmp(200) * 0.85, freq: 0.7 }), v: 140, origin: FLUTE.x - FLUTE.len * 0.4 });
const TAAL = { x: 296, y: 352, r: 96 };

export class WhatVibratesScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Four instruments: an ektara with one string, a tabla with a stretched skin, a bansuri with air inside its hollow pipe, and a taal of two metal cymbals. Tap an instrument: its vibrating part glows and sound leaves it. Next, the bansuri is cut open: the air particles in the pipe vibrate about their places. The two metal rims of the taal meet and ring.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.sel = -1;
    this.selAt = -99;
  }

  enter(stage) {
    this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(1, stage | 0));
    this.sel = -1; this.selAt = -99;
  }

  busy() {
    if (this.cur === 0) return this.age < TOUR_END || this.age - this.selAt < 6;
    return this.age < B1_END;
  }

  pointerDown(p) {
    if (this.cur !== 0) return;
    const i = PARTS.findIndex((q) => p.x >= q.cell.x0 && p.x < q.cell.x1 && p.y >= q.cell.y0 && p.y < q.cell.y1);
    if (i < 0) return;
    this.sel = i; this.selAt = this.age;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    if (this.cur === 0) this._four(ctx, c);
    else this._two(ctx, c);
  }

  // ---- b0 -------------------------------------------------------------------
  _four(ctx, c) {
    const t = this.sel >= 0 ? this.age : Math.min(this.age, TOUR_END);
    const on = this.sel >= 0 ? this.sel : Math.floor(t / STEP) % 4;
    // the lit one fades in, and (on the tour) fades out before the next one
    const since = this.sel >= 0 ? this.age - this.selAt : t % STEP;
    const fadeOut = this.sel >= 0 ? 1 : 1 - inOutSine(clamp01((since - (STEP - FADE)) / FADE));
    const k = inOutSine(clamp01(since / FADE)) * fadeOut;
    const vib = (i) => (i === on ? k : 0);
    const draws = [
      (lit) => drawEktara(ctx, c, { x: 122, y: 222, h: 200, vib: vib(0), t, lit }),
      (lit) => drawTabla(ctx, c, { x: 512, y: 210, r: 82, vib: vib(1), t, lit }),
      (lit) => drawBansuri(ctx, c, { x: 172, y: 380, len: 316, wd: 54, cutaway: true, vib: vib(2), t, lit }),
      (lit) => drawTaal(ctx, c, { x: 512, y: 360, r: 66, meet: 0.82, vib: vib(3), t, lit }),
    ];
    const got = draws.map((d) => d(false));
    // cross-fade: the lit copy of the same instrument drawn over it at alpha k
    if (k > 0.01) { ctx.save(); ctx.globalAlpha = k; got[on] = draws[on](true); ctx.restore(); }
    const [ek, tb, bn, tl] = got;
    if (on === 2) {   // the air column: air particles vibrate about their places
      const a = bn.air;
      ctx.save(); ctx.globalAlpha = k;
      drawParticleStrip(ctx, c, { x: a.x + 3, y: a.y + 2, w: a.w - 6, h: a.h - 4, field: AIR_F, t: t + 30, tube: false, spacing: 11, r: 3.4, seed: 4 });
      ctx.restore();
    }

    const arcs = [
      { x: ek.string.mid.x + 10, y: ek.string.mid.y, dir: 0 },
      { x: tb.skin.cx - tb.skin.rx - 8, y: tb.skin.cy, dir: Math.PI + 0.35 },
      { x: 172 + 316 / 2 + 8, y: 380, dir: -0.45 },
      { x: tl.part.x + tl.part.w + 14, y: tl.contact.y - 10, dir: -0.2 },
    ][on];
    drawSoundArcs(ctx, c, { ...arcs, spread: 0.9, n: 3, wavelength: 28, r0: 16, t, strength: k });

    // each tag under its own instrument; the lit one's tag cross-fades to the warm fill
    PARTS.forEach((q, i) => {
      const w = i === on ? k : 0;
      if (w < 0.99) { ctx.save(); ctx.globalAlpha = 1 - w; pill(ctx, c, q.key, q.tx, q.ty, { ...LBL, bg: c.raised, ink: c.label }); ctx.restore(); }
      if (w > 0.01) {
        ctx.save(); ctx.globalAlpha = k;
        pill(ctx, c, q.key, q.tx, q.ty, { ...LBL, bg: c.warning, ink: darken(c.warning, 0.75) });
        ctx.restore();
      }
    });
  }

  // ---- b1 -------------------------------------------------------------------
  _strike(t) {
    const u = (t % STRIKE) / STRIKE, hitU = 0.2;
    if (u < hitU) return { meet: 0.45 + 0.55 * inOutSine(u / hitU), ring: t < STRIKE ? 0 : Math.exp(-(u + 1 - hitU) * STRIKE / 1.1) * (1 - inOutSine(u / hitU)) };
    const after = (u - hitU) * STRIKE;
    return { meet: 1 - 0.55 * inOutSine(clamp01(after / 0.35)), ring: Math.exp(-after / 1.1) * inOutSine(clamp01(after / 0.18)) };
  }

  _two(ctx, c) {
    const t = Math.min(this.age, B1_END);
    // the bansuri, cut open; the air column lit; air particles vibrate about their places
    const bn = drawBansuri(ctx, c, { ...FLUTE, cutaway: true, vib: 0.25, t, lit: true });
    const a = bn.air;
    drawParticleStrip(ctx, c, { x: a.x + 4, y: a.y + 3, w: a.w - 8, h: a.h - 6, field: AIR_F, t: t + 30, tube: false, spacing: 11, r: 3.4, seed: 5 });
    drawSoundArcs(ctx, c, { x: FLUTE.x + FLUTE.len / 2 + 14, y: FLUTE.y, dir: 0, spread: 0.9, n: 3, wavelength: 26, r0: 12, t, strength: 1 });
    pill(ctx, c, 'air column', a.x + 110, FLUTE.y - FLUTE.wd / 2 - 34, { ...LBL, bg: c.warning, ink: darken(c.warning, 0.75) });

    // the taal: rims meet, then ring
    const s = this._strike(t);
    const tl = drawTaal(ctx, c, { ...TAAL, meet: s.meet, vib: s.ring, t, lit: true });
    const L = tl.part.x, R = tl.part.x + tl.part.w, yT = TAAL.y - TAAL.r * 0.55;
    drawSoundArcs(ctx, c, { x: L - 6, y: yT, dir: Math.PI + 0.75, spread: 0.8, n: 3, wavelength: 30, r0: 14, t, strength: s.ring });
    drawSoundArcs(ctx, c, { x: R + 6, y: yT, dir: -0.75, spread: 0.8, n: 3, wavelength: 30, r0: 14, t, strength: s.ring });
    pill(ctx, c, 'metal', R + 96, TAAL.y + 6, { ...LBL, bg: c.warning, ink: darken(c.warning, 0.75) });
  }
}
