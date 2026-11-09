/**
 * TuningForkScene - slide "The Tuning Fork" (L01), 2 beats. Rebuilt 2026-11-03 (whole file).
 *
 * b0 the fork upright and big, at rest, standing on the bench. Two tags beside the parts,
 *    "prongs" and "stem". Tap a part (or its tag) and that part glows. On landing the two
 *    parts glow once in turn, then both tags stay.
 * b1 a student (front view, one fixed stance, auto-reach off) holds the fork by its stem,
 *    swings it so one prong meets the black rubber pad on the table, then brings it up beside
 *    the ear. The prongs vibrate (kit fork vib, decaying), sound arcs run from the prongs to the
 *    ear and the ear glows once they arrive. Re-struck every few seconds; at rest the fork is
 *    beside the ear, vibrating, arcs on, ear lit.
 * Not on this slide: water, frequency, waves in air (arcs only).
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, drawBench, pill, alpha, lighten, darken, inOutSine, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawTuningFork } from 'simulations/base/kit/SimApparatus.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawEar } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };

// b0: the fork alone
const F0 = { x: 300, y: 474, h: 404 };
const BENCH0 = { x0: 150, x1: 530, y: 474 };
const ROOT0 = F0.y - F0.h * 0.52;             // where the stem meets the U
const PRONG_HIT = { x0: F0.x - 70, x1: F0.x + 70, y0: F0.y - F0.h - 14, y1: ROOT0 + 20 };
const STEM_HIT = { x0: F0.x - 40, x1: F0.x + 40, y0: ROOT0 + 20, y1: F0.y + 6 };
const TAG_PRONGS = { x: F0.x + 128, y: F0.y - F0.h * 0.8 };
const TAG_STEM = { x: F0.x + 108, y: F0.y - F0.h * 0.24 };
const TOUR = [{ part: 'prongs', a: 0.4, b: 1.4 }, { part: 'stem', a: 1.6, b: 2.6 }];

// b1: the strike and the ear
const GROUND = 500;
const FH = 226;                                  // fork height in b1
const GF = 0.3;                                  // the hand holds the stem this far up from its end
const PER = 4.6;                                 // one strike cycle (s)
const T_DOWN = 0.55, T_HIT = 0.55, T_UP0 = 0.7, T_UP1 = 1.5;
const TAU_D = 3.6;                               // decay of the swing (s)
const TEND = 2 * PER + 3.1;                      // the frame the scene comes to rest on (fork at the ear)
const ST = { x: 214, height: 440 };

export class TuningForkScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A tuning fork stands upright: the long stem at the bottom and the two prongs of the U at the top, each with its tag; tap a part to light it. Next, a student holds the fork by its stem, strikes one prong on a black rubber pad and brings the fork beside the ear: the prongs vibrate and sound arcs reach the ear, which lights up.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
    this.sel = null;
    this.selAt = -9;
    this.found = new Set();
    this.geo = null;
  }

  enter(stage) {
    this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(1, stage | 0));
    this.sel = null; this.selAt = -9; this.found = new Set();
  }

  busy() {
    if (this.cur === 0) return this.age < 2.8 || this.age - this.selAt < 0.7;
    return this.age < TEND;
  }

  pointerDown(p) {
    if (this.cur !== 0) return;
    const inR = (r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;
    const nearTag = (tg) => Math.abs(p.x - tg.x) < 80 && Math.abs(p.y - tg.y) < 30;
    let part = null;
    if (inR(PRONG_HIT) || nearTag(TAG_PRONGS)) part = 'prongs';
    else if (inR(STEM_HIT) || nearTag(TAG_STEM)) part = 'stem';
    if (!part) return;
    this.sel = part; this.selAt = this.age;
    if (!this.found.has(part)) {
      this.found.add(part);
      const tg = part === 'prongs' ? TAG_PRONGS : TAG_STEM;
      this.celebrate(tg.x, tg.y, 8, { key: 'part-' + part, small: true });
    }
  }

  draw(ctx, c) {
    if (this.cur === 0) this._parts(ctx, c, this.age);
    else this._strike(ctx, c, Math.min(this.age, TEND));
  }

  // ---- b0 -------------------------------------------------------------------
  _glowK(part, t) {
    let k = 0;
    for (const s of TOUR) if (s.part === part && t > s.a && t < s.b + 0.4) k = Math.max(k, Math.min(clamp01((t - s.a) / 0.3), clamp01((s.b + 0.4 - t) / 0.4)));
    if (this.sel === part) k = Math.max(k, clamp01((t - this.selAt) / 0.35));
    return k;
  }

  _parts(ctx, c, t) {
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 500, {});
    drawBench(ctx, c, BENCH0.x0, BENCH0.x1, BENCH0.y, { h: 26 });
    const kp = this._glowK('prongs', t), ks = this._glowK('stem', t);
    const glow = c.warning;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const prongPath = () => {
      const cx = F0.h * 0.062 + Math.max(9, F0.h * 0.055) / 2;
      ctx.beginPath(); ctx.moveTo(F0.x - cx, F0.y - F0.h); ctx.lineTo(F0.x - cx, ROOT0);
      ctx.arc(F0.x, ROOT0, cx, Math.PI, 0, true); ctx.lineTo(F0.x + cx, F0.y - F0.h);
    };
    const stemPath = () => { ctx.beginPath(); ctx.moveTo(F0.x, ROOT0 + 36); ctx.lineTo(F0.x, F0.y - 4); };
    for (const [k, path] of [[kp, prongPath], [ks, stemPath]]) {
      if (k <= 0.01) continue;
      for (const [w, a] of [[64, 0.12], [44, 0.22], [30, 0.3]]) { path(); ctx.strokeStyle = alpha(glow, a * k); ctx.lineWidth = w; ctx.stroke(); }
    }
    ctx.restore();
    drawTuningFork(ctx, c, { x: F0.x, y: F0.y, h: F0.h, shadowY: F0.y + 2 });
    const tag = (txt, tg, k) => pill(ctx, c, txt, tg.x, tg.y, { ...LBL, bg: k > 0.5 ? c.warning : c.raised, ink: k > 0.5 ? darken(c.warning, 0.75) : c.label });
    tag('prongs', TAG_PRONGS, kp);
    tag('stem', TAG_STEM, ks);
  }

  // ---- b1 -------------------------------------------------------------------
  _geom() {
    if (this.geo) return this.geo;
    const base = figureFor(this, { role: 'student', x: ST.x, y: GROUND, height: ST.height, facing: 0, i: 2, pose: 'stand', autoReach: false });
    const sk = solveFigure(base);
    const hd = sk.anchors.head, sh = sk.anchors.shoulder;
    const ear = { x: hd.x + hd.r * 0.98, y: hd.y + hd.r * 0.14, h: hd.r * 0.95 };
    const pw = Math.max(9, FH * 0.055), cx = FH * 0.062 + pw / 2;
    // at the ear: the prongs' middle level with the canal, the fork just clear of the ear
    const hold = { a: -0.06, g: { x: sh.x + 118, y: ear.y + (0.76 - GF) * FH } };
    // on the pad: the fork swung clockwise until its lower prong lies on the pad
    const strike = { a: 1.62, g: { x: sh.x + 96, y: sh.y + 78 } };
    const bot = (k) => ({ x: k.g.x - GF * FH * Math.sin(k.a), y: k.g.y + GF * FH * Math.cos(k.a) });
    const sb = bot(strike);
    const tipY = sb.y + cx * Math.sin(strike.a) - FH * Math.cos(strike.a);
    const tipX = sb.x + cx * Math.cos(strike.a) + FH * Math.sin(strike.a);
    const pad = { x: tipX - 46, y: tipY + pw / 2 + 42, w: 104, h: 42 };
    this.geo = { ear, hold, strike, bot, pad, table: { x0: pad.x - 104, x1: Math.min(668, pad.x + 92), y: pad.y }, cx, sh };
    return this.geo;
  }

  _phase(t) {
    const n = Math.floor(t / PER), u = t - n * PER;
    // swing size: struck at T_HIT of each cycle, decaying; the first cycle starts silent
    let vib = 0;
    if (u >= T_HIT) vib = Math.exp(-(u - T_HIT) / TAU_D);
    else if (n > 0) vib = Math.exp(-(u + PER - T_HIT) / TAU_D);
    // where the fork is: 0 = at the ear, 1 = on the pad
    let k;
    if (u < T_DOWN) k = inOutSine(clamp01(u / T_DOWN));
    else if (u < T_UP0) k = 1;
    else k = 1 - inOutSine(clamp01((u - T_UP0) / (T_UP1 - T_UP0)));
    const near = u >= T_UP1 ? 1 : 0;
    const since = u - T_UP1;                      // time the fork has been beside the ear this cycle
    return { u, vib, k, near, since, first: n === 0 };
  }

  _strike(ctx, c, t) {
    const G = this._geom();
    const ph = this._phase(t);
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, GROUND, {});
    // the table with the rubber pad (the kit fork draws the pad block at pad.x centre, pad.y bottom)
    drawBench(ctx, c, G.table.x0, G.table.x1, G.table.y, { h: GROUND - G.table.y });
    const a = G.hold.a + (G.strike.a - G.hold.a) * ph.k;
    const g = { x: G.hold.g.x + (G.strike.g.x - G.hold.g.x) * ph.k, y: G.hold.g.y + (G.strike.g.y - G.hold.g.y) * ph.k };
    const b = G.bot({ a, g });
    // a slight arc on the way (the fork travels out and down, not through the table)
    const lift = Math.sin(Math.PI * ph.k) * 26;
    b.y -= lift; g.y -= lift;
    const spec = figureFor(this, { role: 'student', x: ST.x, y: GROUND, height: ST.height, facing: 0, i: 2, pose: 'stand', autoReach: false,
      hands: [{ x: g.x, y: g.y }, null] });
    let fk = null;
    const fork = () => {
      fk = drawTuningFork(ctx, c, { x: b.x, y: b.y, h: FH, angle: a, vib: ph.vib, t, freq: 6,
        pad: { x: G.pad.x, y: G.pad.y, w: G.pad.w, h: G.pad.h } });
    };
    drawFigure(ctx, c, spec, spec.look, { between: fork });
    // the struck moment: a small flash where the prong meets the pad
    const hitK = clamp01(1 - Math.abs(ph.u - T_HIT) / 0.18) * (ph.k > 0.95 ? 1 : 0);
    if (hitK > 0) {
      const hx = G.pad.x - 20, hy = G.pad.y - G.pad.h;
      const gr = ctx.createRadialGradient(hx, hy, 2, hx, hy, 40);
      gr.addColorStop(0, alpha(lighten(c.warning, 0.4), 0.8 * hitK)); gr.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(hx, hy, 40, 0, TAU); ctx.fill();
    }
    // arcs from the prongs to the ear, only while the fork is beside the ear and still sounding
    const sound = ph.near ? ph.vib * clamp01(ph.since / 0.25) : 0;
    const ear = G.ear;
    if (sound > 0.04 && fk) {
      const px = (fk.tips[0].x + fk.tips[1].x) / 2 - G.cx - 4;
      drawSoundArcs(ctx, c, { x: px, y: ear.y, dir: Math.PI, spread: 1.1, n: 3, wavelength: 20, r0: 10, t, strength: Math.min(1, sound * 1.6) });
    }
    const listen = ph.near ? clamp01((ph.since - 0.35) / 0.35) * Math.min(1, ph.vib * 1.8) : 0;
    drawEar(ctx, c, { x: ear.x, y: ear.y, h: ear.h, facing: -1, listen });
    pill(ctx, c, 'rubber pad', (G.table.x0 + G.table.x1) / 2, G.table.y + 54, { ...LBL, bg: c.raised, ink: c.label });
  }
}
