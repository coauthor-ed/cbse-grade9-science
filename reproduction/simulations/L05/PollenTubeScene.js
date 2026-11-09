// PollenTubeScene - one china-rose flower in longitudinal section, and the pollen tube
// that has to build its own road from the grain, down the style, into an ovule.
// Rich profile (docs/visual-profiles.md): a lit flower in a garden, a spiky grain, a living
// tube with streaming contents, and the camera moving into the ovule for the fusion.
//
// Six beats, one slide (blk-l05-s04). Every beat change re-runs the growth from the grain,
// so the answer is something the learner watches, never a jump. The last beat is the point: block the style and the
// tube stops at the plate, the male germ cell stops with it, and no zygote forms.
//
// The growth is a length along one fixed path (PATH below), so the tube is always drawn
// growing out of the grain - never as a line between two points - and the male germ cell
// is always inside the tube until it is released at the ovule.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, chipRow, darken, drawVignette, font, inOutSine, lerp, lighten, luma, mix, popAt, rr } from 'simulations/base/kit/SimLook.js';
import { withCamera, layer, toScreen, zlerp } from 'simulations/base/kit/SimCamera.js';
import { ease, reducedMotion, hash2 } from 'simulations/base/kit/SimAnim.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// --- the flower, in world pixels (the camera frames it). The style is the corridor the
// tube has to travel; the ovary swells at its base and holds three ovules, one cut open.
const AX = 300;                       // the style's own axis
const GRAIN_Y = 86;                   // the grain rests here, in the stigma's receptive cup
const STYLE_TOP = 92;
const STYLE_BOT = 330;                // where the style flares into the ovary
const STYLE_HW = 22;                  // half-width of the style column
const OVARY = { x: AX, y: 404, rx: 116, ry: 72 };
const OVULES = [
  { x: AX - 66, y: 384, r: 26 },              // closed
  { x: AX - 50, y: 438, r: 22 },              // closed
  { x: AX + 58, y: 412, r: 44, open: true },   // cut open: the egg cell is visible
];
const EGG = { x: AX + 72, y: 420, r: 12 };
const GAMETE_AT = { x: AX + 50, y: 428 };      // where the released gamete sits, beside the egg
const MICRO = { x: OVULES[2].x - OVULES[2].r * 0.72, y: OVULES[2].y - OVULES[2].r * 0.34 };

// One path: out of the grain, down the style, then a turn through the micropyle into the
// open ovule. It starts under the grain, so the tube is always seen leaving the grain.
const PATH = [[AX, GRAIN_Y], [AX, 300], [AX + 4, 334], [AX + 12, 360], [AX + 20, 380], [MICRO.x, MICRO.y]];
const SEG = [];
let PLEN = 0;
for (let i = 0; i < PATH.length - 1; i++) {
  const d = Math.hypot(PATH[i + 1][0] - PATH[i][0], PATH[i + 1][1] - PATH[i][1]);
  SEG.push(d); PLEN += d;
}

const PLATE_Y = Math.round(STYLE_TOP + 0.71 * (STYLE_BOT - STYLE_TOP));   // 71% down the style
// Model numbers, fractions of PLEN (the path's first leg is straight down from the grain).
const T_GERM = 0.18;                                   // beat 1: a short tube into the top of the style
const T_DOWN = (300 - 24 - GRAIN_Y) / PLEN;            // beat 2: most of the way down the style
const T_ARRIVE = 1;                                    // beats 3-4: through the micropyle, into the ovule
const T_PLATE = (PLATE_Y - 9 - GRAIN_Y) / PLEN;        // the tip stops against the plate's top face
const GERM_BEHIND = 0.06;

const T_GROW = 0.8, T_RELEASE = 0.35, T_FUSE = 0.3, T_PULSE = 0.5;

const MAP = [
  [{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }], [{ idx: 5, dwellMs: null }],
];
const S_LANDED = 0, S_GERM = 1, S_DOWN = 2, S_OUT = 3, S_ZYGOTE = 4, S_BLOCK = 5;
const CHIP = ['landed', 'germinating', 'growing down', 'released', 'zygote', 'blocked'];

const BEAT_TARGET = [0, T_GERM, T_DOWN, T_ARRIVE, T_ARRIVE, T_ARRIVE];
function targetFor(stage, blocked) {
  const base = BEAT_TARGET[stage] ?? 0;
  return blocked ? Math.min(base, T_PLATE) : base;
}
const BEAT_FUSE = [false, false, false, false, true, true];

function at(t) {
  const d = Math.max(0, Math.min(1, t)) * PLEN;
  let acc = 0;
  for (let i = 0; i < SEG.length; i++) {
    if (d <= acc + SEG[i] || i === SEG.length - 1) {
      const f = Math.max(0, Math.min(1, (d - acc) / SEG[i]));
      const a = PATH[i], b = PATH[i + 1];
      return { x: a[0] + f * (b[0] - a[0]), y: a[1] + f * (b[1] - a[1]), dx: (b[0] - a[0]) / SEG[i], dy: (b[1] - a[1]) / SEG[i] };
    }
    acc += SEG[i];
  }
  const a = PATH[PATH.length - 2], b = PATH[PATH.length - 1];
  return { x: b[0], y: b[1], dx: b[0] - a[0], dy: b[1] - a[1] };
}

// Camera: the whole flower, or close on the open ovule for the release and the fusion.
const CAM_FLOWER = { x: 318, y: 262, z: 1.12 };
const CAM_OVULE = { x: AX + 44, y: 404, z: 2.1 };

export class PollenTubeScene extends SimScene {
  static VISUAL_PROFILE = 'rich';
  static CONTINUOUS = true;   // rich: the tube's contents stream, petals breathe, light drifts
  static IRIS = false;
  static BEAT_STEP_MAP = MAP;
  static ARIA_LABEL = 'A cutaway of a china-rose flower in a garden. A spiky pollen grain lands on the red stigma lobes and grows a tube down the style into the ovary. The view then moves close to one opened ovule, where the male germ cell leaves the tube and fuses with the egg cell, and the label zygote appears. A block control can put a plate across the style so the tube stops part-way and nothing fuses.';
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this._block = 'none';
    this._g = 0;
    this._from = 0;
    this._seq = null;
    this._released = false;
    this._fused = false;
    this._pulseAt = -1;
    this._swellAt = -1;
  }

  /** A design size that reaches at least 12 px on screen: on a phone the stage is drawn at under half size. */
  _px(design) {
    const w = this._canvas?.getBoundingClientRect?.().width;
    return w > 0 ? Math.max(design, Math.ceil((12 * 680) / w)) : design;
  }

  enter(stage) {
    this._seq = null;
    this._g = 0; this._from = 0;
    this._released = false; this._fused = false;
    this._pulseAt = -1;
    this._block = stage === S_BLOCK ? 'blocked' : 'none';   // from the beat, never from history
    if (stage === S_LANDED) { this._swellAt = -1; return; }
    this._swellAt = 0;
    this._startRun(stage);
  }

  // One scripted run: grow, then (beat 4) release, fuse, pulse. Each step ends.
  _startRun(stage, from = 0, to = null) {
    const target = to ?? targetFor(stage, this._block === 'blocked');
    const steps = [{ kind: 'grow', to: target, dur: T_GROW }];
    if (target >= T_ARRIVE - 1e-6) {
      steps.push({ kind: 'release', dur: T_RELEASE });
      if (BEAT_FUSE[stage]) steps.push({ kind: 'fuse', dur: T_FUSE }, { kind: 'pulse', dur: T_PULSE });
    }
    this._from = from;
    this._seq = { steps, i: 0, t: 0, stage };
  }

  update(d) {
    const s = this._seq;
    if (!s) return;
    const st = s.steps[s.i];
    s.t += d;
    const u = Math.min(1, s.t / st.dur);
    if (st.kind === 'grow') {
      this._g = this._from + (st.to - this._from) * inOutSine(u);
    } else if (st.kind === 'release') {
      // The gamete leaves the tip and settles beside the egg.
      this._released = u >= 1;
    } else if (st.kind === 'fuse') {
      this._fused = u >= 1;
    }
    if (u < 1) return;
    if (st.kind === 'pulse' && this._pulseAt < 0 && this._fused) this._pulseAt = this.age;
    s.i++; s.t = 0;
    if (s.i >= s.steps.length) {
      const stage = s.stage;
      this._seq = null;
    }
  }

  busy() {
    if ((this.stage === S_OUT) && !reducedMotion() && this.age < 1.2) return true;
    return !!this._seq;
  }

  // ---- camera --------------------------------------------------------------------------
  _cam() {
    const close = (this.stage === S_OUT || this.stage === S_ZYGOTE) && this._block !== 'blocked';
    if (!close) return CAM_FLOWER;
    const k = this.stage === S_ZYGOTE || reducedMotion() ? 1 : ease.inOutCubic(clamp01(this.age / 1.1));
    return { x: lerp(CAM_FLOWER.x, CAM_OVULE.x, k), y: lerp(CAM_FLOWER.y, CAM_OVULE.y, k), z: zlerp(1, CAM_OVULE.z, k) };
  }

  draw(ctx, c) {
    const dark = luma(c.bgDeep) < 0.5;
    const t = reducedMotion() ? 0 : this.clock;
    const cam = this._cam();
    const P = this._palette(c, dark);
    this._garden(ctx, c, P, dark);
    layer(ctx, cam, 0.3, (g) => this._bokeh(g, c, dark, t));
    withCamera(ctx, cam, (g) => this._flower(g, c, P, dark, t));
    drawVignette(ctx, c, 0.85);
    this._labels(ctx, c, P, cam);
    this._bottom(ctx, c, cam);
  }

  _palette(c, dark) {
    return {
      petal: mix(c.s6, c.s4, 0.35),
      leaf: mix(c.s3, c.bgDeep, dark ? 0.2 : 0.1),
      style: mix(c.s3, lighten(c.s2, 0.6), 0.55),
      ovary: mix(c.s3, c.s2, 0.25),
      ovule: mix(lighten(c.s3, 0.5), c.s2, 0.25),
      stigma: mix(c.s6, c.s4, 0.15),
      tube: mix(c.s1, lighten(c.s1, 1), 0.45),
    };
  }

  _garden(ctx, c, P, dark) {
    const g = ctx.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, mix(c.bgDeep, c.s3, dark ? 0.14 : 0.1));
    g.addColorStop(1, mix(c.bgDeep, c.s1, dark ? 0.1 : 0.06));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 680, 520);
    const L = ctx.createRadialGradient(90, -20, 10, 90, -20, 560);
    L.addColorStop(0, alpha(lighten(c.gold, 0.5), dark ? 0.18 : 0.26));
    L.addColorStop(1, alpha(c.gold, 0));
    ctx.fillStyle = L;
    ctx.fillRect(0, 0, 680, 520);
  }

  _bokeh(ctx, c, dark, t) {
    const cols = [c.s3, c.s4, c.s2, c.s3];
    for (let i = 0; i < 16; i++) {
      const x = -80 + hash2(i, 1) * 840 + Math.sin(t * 0.15 + i) * 8;
      const y = -60 + hash2(i, 2) * 640 + Math.cos(t * 0.12 + i * 2) * 6;
      const r = 24 + hash2(i, 3) * 60;
      const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
      g.addColorStop(0, alpha(cols[i % 4], dark ? 0.14 : 0.12));
      g.addColorStop(1, alpha(cols[i % 4], 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  }

  // ---- the flower, in section ------------------------------------------------------------
  _flower(ctx, c, P, dark, t) {
    const sway = Math.sin(t * 0.6) * 0.012;
    // stalk and sepals
    ctx.strokeStyle = P.leaf; ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(AX, 470); ctx.quadraticCurveTo(AX - 6, 560, AX + 10, 720); ctx.stroke();
    ctx.lineCap = 'butt';
    // petals: two far ones (faded) and the two near halves of the cut corolla
    for (const [side, far] of [[-1, 1], [1, 1], [-1, 0], [1, 0]]) this._petal(ctx, c, P, dark, side, far, sway);
    for (const side of [-1, 1]) this._sepal(ctx, P, side);
    this._ovary(ctx, c, P, dark);
    this._style(ctx, c, P, dark);
    this._stigma(ctx, c, P, dark, t);
    if (this._block === 'blocked') this._plate(ctx, c, dark);
    this._tube(ctx, c, P, dark, t);
  }

  _petal(ctx, c, P, dark, side, far, sway) {
    ctx.save();
    ctx.translate(AX + side * 30, 456);
    ctx.rotate(side * (far ? 0.72 : 0.36) + sway * side);
    const len = far ? 270 : 300, w = far ? 190 : 220;
    // a broad fan with a ruffled rim, cut lengthwise like the rest of the flower
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.bezierCurveTo(-w * 0.2, -len * 0.25, -w * 0.55, -len * 0.55, -w * 0.48, -len * 0.82);
      ctx.quadraticCurveTo(-w * 0.36, -len * 1.02, -w * 0.12, -len * 0.96);
      ctx.quadraticCurveTo(0, -len * 1.06, w * 0.14, -len * 0.97);
      ctx.quadraticCurveTo(w * 0.38, -len * 1.0, w * 0.46, -len * 0.8);
      ctx.bezierCurveTo(w * 0.52, -len * 0.55, w * 0.18, -len * 0.25, 8, 0);
      ctx.closePath();
    };
    const col = far ? mix(P.petal, c.bgDeep, dark ? 0.45 : 0.35) : P.petal;
    const g = ctx.createLinearGradient(-w * 0.5, -len, w * 0.5, 0);
    g.addColorStop(0, lighten(col, 0.28)); g.addColorStop(0.55, col); g.addColorStop(1, darken(col, 0.3));
    ctx.fillStyle = g; path(); ctx.fill();
    ctx.save(); path(); ctx.clip();
    ctx.strokeStyle = alpha(darken(col, 0.45), far ? 0.2 : 0.3); ctx.lineWidth = 1.2;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(0, -6);
      ctx.quadraticCurveTo(i * w * 0.05, -len * 0.5, i * w * 0.1, -len);
      ctx.stroke();
    }
    // the dark eye at the petal base, as on a real china-rose
    const e = ctx.createRadialGradient(0, -6, 0, 0, -6, len * 0.32);
    e.addColorStop(0, alpha(darken(col, 0.75), 0.85)); e.addColorStop(1, alpha(darken(col, 0.75), 0));
    ctx.fillStyle = e; ctx.fillRect(-w, -len, 2 * w, len + 10);
    ctx.restore();
    if (!far) { ctx.strokeStyle = alpha(lighten(col, 0.5), 0.55); ctx.lineWidth = 2; path(); ctx.stroke(); }
    ctx.restore();
  }

  _sepal(ctx, P, side) {
    ctx.save();
    ctx.translate(AX + side * 30, 468);
    ctx.rotate(side * 0.9);
    const g = ctx.createLinearGradient(0, 0, 0, -70);
    g.addColorStop(0, darken(P.leaf, 0.3)); g.addColorStop(1, lighten(P.leaf, 0.2));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-12, -40, 0, -72); ctx.quadraticCurveTo(12, -40, 14, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  _ovary(ctx, c, P, dark) {
    const { x, y, rx, ry } = OVARY;
    // the wall, cut: a thick outer band, a lit cavity inside
    const g = ctx.createRadialGradient(x - rx * 0.4, y - ry * 0.5, 4, x, y, rx);
    g.addColorStop(0, lighten(P.ovary, 0.3)); g.addColorStop(0.7, P.ovary); g.addColorStop(1, darken(P.ovary, 0.35));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    const cav = mix(lighten(P.ovary, 0.55), c.s2, 0.12);
    const cg = ctx.createLinearGradient(0, y - ry, 0, y + ry);
    cg.addColorStop(0, darken(cav, 0.15)); cg.addColorStop(1, lighten(cav, 0.1));
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.ellipse(x, y + 2, rx - 16, ry - 14, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = alpha(darken(P.ovary, 0.4), 0.6); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y + 2, rx - 16, ry - 14, 0, 0, TAU); ctx.stroke();
    // the placenta down the middle, each ovule on its little stalk
    ctx.strokeStyle = darken(P.ovary, 0.1); ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 24, y - ry + 20); ctx.lineTo(x - 24, y + ry - 20); ctx.stroke();
    ctx.lineWidth = 4;
    for (const o of OVULES) { ctx.beginPath(); ctx.moveTo(x - 24, o.y); ctx.lineTo(o.x + (o.x < x ? o.r * 0.6 : -o.r * 0.9), o.y + (o.open ? 14 : 0)); ctx.stroke(); }
    ctx.lineCap = 'butt';
    for (const o of OVULES) if (!o.open) this._ball(ctx, o.x, o.y, o.r, P.ovule, dark);
    this._openOvule(ctx, c, P, dark);
  }

  _ball(ctx, x, y, r, col, dark) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, lighten(col, 0.4)); g.addColorStop(0.6, col); g.addColorStop(1, darken(col, 0.35));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = alpha(lighten(col, 1), dark ? 0.35 : 0.5);
    ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.4, r * 0.28, r * 0.17, -0.6, 0, TAU); ctx.fill();
  }

  _openOvule(ctx, c, P, dark) {
    const o = OVULES[2];
    // integuments (two thin coats) and the embryo sac inside
    this._ball(ctx, o.x, o.y, o.r, P.ovule, dark);
    const sac = mix(lighten(P.ovule, 0.6), c.s4, 0.1);
    const sg = ctx.createRadialGradient(o.x - 6, o.y - 6, 2, o.x, o.y, o.r * 0.78);
    sg.addColorStop(0, lighten(sac, 0.3)); sg.addColorStop(1, sac);
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.ellipse(o.x + 4, o.y + 2, o.r * 0.72, o.r * 0.62, 0.15, 0, TAU); ctx.fill();
    ctx.strokeStyle = alpha(darken(P.ovule, 0.35), 0.7); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(o.x + 4, o.y + 2, o.r * 0.72, o.r * 0.62, 0.15, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r - 5, o.r * 0.9 - 5, 0, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke();
    // the micropyle: the small opening the tube enters by
    ctx.fillStyle = darken(P.ovary, 0.5);
    ctx.beginPath(); ctx.ellipse(MICRO.x, MICRO.y, 5, 7, -0.6, 0, TAU); ctx.fill();
  }

  _style(ctx, c, P, dark) {
    // the column: lit from the left, flaring into the ovary's shoulders
    const g = ctx.createLinearGradient(AX - STYLE_HW, 0, AX + STYLE_HW, 0);
    g.addColorStop(0, lighten(P.style, 0.2)); g.addColorStop(0.35, lighten(P.style, 0.35)); g.addColorStop(1, darken(P.style, 0.3));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(AX - STYLE_HW + 4, STYLE_TOP);
    ctx.lineTo(AX - STYLE_HW, STYLE_BOT - 20);
    ctx.quadraticCurveTo(AX - STYLE_HW - 4, STYLE_BOT + 6, AX - 64, OVARY.y - OVARY.ry + 8);
    ctx.lineTo(AX + 64, OVARY.y - OVARY.ry + 8);
    ctx.quadraticCurveTo(AX + STYLE_HW + 4, STYLE_BOT + 6, AX + STYLE_HW, STYLE_BOT - 20);
    ctx.lineTo(AX + STYLE_HW - 4, STYLE_TOP);
    ctx.closePath(); ctx.fill();
    // the inner channel: a soft recess the tube follows
    const ch = ctx.createLinearGradient(AX - 8, 0, AX + 8, 0);
    ch.addColorStop(0, alpha(darken(P.style, 0.45), 0.5)); ch.addColorStop(0.5, alpha(darken(P.style, 0.25), 0.3)); ch.addColorStop(1, alpha(darken(P.style, 0.5), 0.5));
    ctx.fillStyle = ch;
    ctx.fillRect(AX - 8, STYLE_TOP, 16, STYLE_BOT - STYLE_TOP + 16);
  }

  _stigma(ctx, c, P, dark, t) {
    const p = this._swellAt >= 0 ? popAt(this.age, this._swellAt) : null;
    const s = 1 + (p ? 0.12 * p.scale * clamp01(1 - p.u) : 0);
    ctx.save();
    ctx.translate(AX, GRAIN_Y + 8);
    ctx.scale(s * 1.3, s * 1.3);
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.rotate(i * 0.48);
      // a stalk to each lobe, then the fuzzy round head
      ctx.strokeStyle = darken(P.stigma, 0.2); ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
      ctx.lineCap = 'butt';
      const hy = -34;
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * TAU;
        ctx.fillStyle = alpha(lighten(P.stigma, 0.3), 0.8);
        ctx.beginPath(); ctx.arc(Math.cos(a) * 11, hy + Math.sin(a) * 11, 2.6, 0, TAU); ctx.fill();
      }
      const g = ctx.createRadialGradient(-3, hy - 3, 1, 0, hy, 11);
      g.addColorStop(0, lighten(P.stigma, 0.4)); g.addColorStop(1, darken(P.stigma, 0.3));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, hy, 10, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  _plate(ctx, c, dark) {
    const w = (STYLE_HW + 14) * 2;
    ctx.fillStyle = alpha(darken(c.bgDeep, 0.6), dark ? 0.5 : 0.2);
    rr(ctx, AX - w / 2 + 3, PLATE_Y - 6, w, 16, 4); ctx.fill();
    const g = ctx.createLinearGradient(0, PLATE_Y - 9, 0, PLATE_Y + 9);
    g.addColorStop(0, lighten(c.bad, 0.35)); g.addColorStop(1, darken(c.bad, 0.35));
    ctx.fillStyle = g;
    rr(ctx, AX - w / 2, PLATE_Y - 9, w, 16, 4); ctx.fill();
    ctx.fillStyle = alpha(lighten(c.bad, 1), 0.45);
    ctx.fillRect(AX - w / 2 + 6, PLATE_Y - 7, w - 12, 2);
  }

  _cell(ctx, x, y, col, r = 7) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0.5, x, y, r);
    g.addColorStop(0, lighten(col, 0.5)); g.addColorStop(0.6, col); g.addColorStop(1, darken(col, 0.35));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.88, 0, 0, TAU); ctx.fill();
  }

  _tube(ctx, c, P, dark, t) {
    const tip = at(this._g);
    const start = at(0);
    if (this._g > 0.005) {
      // the tube body: a translucent walled tube, lit core, streaming contents
      const pts = [];
      for (let i = 0; i <= 60; i++) { const q = at((this._g * i) / 60); pts.push([q.x, q.y]); }
      const line = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = alpha(darken(P.tube, 0.35), 0.9); ctx.lineWidth = 11; line(); ctx.stroke();
      ctx.strokeStyle = P.tube; ctx.lineWidth = 7.5; line(); ctx.stroke();
      ctx.strokeStyle = alpha(lighten(P.tube, 1), 0.7); ctx.lineWidth = 2;
      ctx.save(); ctx.translate(-1.5, 0); line(); ctx.stroke(); ctx.restore();
      ctx.lineCap = 'butt';
      const len = this._g * PLEN;
      for (let k = 0; k < len / 14; k++) {
        const f = ((k * 14 + t * 22) % len) / PLEN;
        const q = at(f);
        ctx.fillStyle = alpha(darken(P.tube, 0.25), 0.55);
        ctx.beginPath(); ctx.arc(q.x + Math.sin(k * 2.1) * 1.5, q.y, 1.4, 0, TAU); ctx.fill();
      }
      // the growing tip: a rounded, brighter cap
      ctx.fillStyle = lighten(P.tube, 0.4);
      ctx.beginPath(); ctx.arc(tip.x, tip.y, 5, 0, TAU); ctx.fill();
    }
    // the grain at the mouth of the tube: spiky, as china-rose pollen is
    const gp = this._swellAt >= 0 ? popAt(this.age, this._swellAt) : null;
    const gr = 12 * (gp ? 1 + 0.18 * gp.scale * clamp01(1 - gp.u) : 1);
    ctx.fillStyle = darken(c.gold, 0.2);
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * TAU;
      ctx.beginPath();
      ctx.moveTo(start.x + Math.cos(a - 0.12) * gr, start.y + Math.sin(a - 0.12) * gr);
      ctx.lineTo(start.x + Math.cos(a) * (gr + 6), start.y + Math.sin(a) * (gr + 6));
      ctx.lineTo(start.x + Math.cos(a + 0.12) * gr, start.y + Math.sin(a + 0.12) * gr);
      ctx.fill();
    }
    this._cell(ctx, start.x, start.y, c.gold, gr);

    if (this._g < 0.02) { this._egg(ctx, c, t); return; }
    if (!this._released) {
      const gc = at(Math.max(0, this._g - GERM_BEHIND));
      this._cell(ctx, gc.x, gc.y, c.s2, 6.5);
    }
    if (this._released && !this._fused) {
      const u = this._fuseU();
      const end = at(this._g);
      const r = inOutSine(this._relU());
      const px = end.x + (GAMETE_AT.x - end.x) * r, py = end.y + (GAMETE_AT.y - end.y) * r;
      this._cell(ctx, px + (EGG.x - px) * u, py + (EGG.y - py) * u, c.s2, 6.5);
    }
    this._egg(ctx, c, t);
  }

  // How far the current release / fuse step has run, so the cell slides rather than jumps.
  _relU() {
    const s = this._seq;
    if (!s) return 1;
    return s.steps[s.i]?.kind === 'release' ? Math.min(1, s.t / T_RELEASE) : 1;
  }

  _fuseU() {
    const s = this._seq;
    if (!s) return 0;                    // released and resting: the gamete waits beside the egg
    return s.steps[s.i]?.kind === 'fuse' ? Math.min(1, s.t / T_FUSE) : 1;
  }

  _egg(ctx, c, t) {
    if (this._fused) {
      const glow = ctx.createRadialGradient(EGG.x, EGG.y, 0, EGG.x, EGG.y, EGG.r * 2.4);
      glow.addColorStop(0, alpha(c.good, 0.45 + 0.1 * Math.sin(t * 2))); glow.addColorStop(1, alpha(c.good, 0));
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(EGG.x, EGG.y, EGG.r * 2.4, 0, TAU); ctx.fill();
      this._cell(ctx, EGG.x, EGG.y, c.good, EGG.r + 2);
      const fp = this._pulseAt >= 0 ? Math.min(1, (this.age - this._pulseAt) / T_PULSE) : 1;
      if (this._pulseAt >= 0 && fp < 1) {
        ctx.strokeStyle = alpha(lighten(c.good, 0.4), (1 - fp) * 0.9);
        ctx.lineWidth = 3 * (1 - fp) + 0.6;
        ctx.beginPath(); ctx.arc(EGG.x, EGG.y, 14 + fp * 30, 0, TAU); ctx.stroke();
      }
    } else {
      this._cell(ctx, EGG.x, EGG.y, c.s4, EGG.r);
    }
  }

  // ---- names: plain text on leaders, at most four per beat --------------------------------
  _labels(ctx, c, P, cam) {
    const st = this.stage, blocked = this._block === 'blocked';
    const close = cam.z > 1.5;
    const L = [];
    const tipY = at(this._g).y, gc = at(Math.max(0, this._g - GERM_BEHIND));
    if (!close) {
      if (st === S_LANDED || st === S_GERM) L.push(['stigma', 520, 70, AX + 30, GRAIN_Y - 8]);
      if (st === S_LANDED || st === S_GERM || blocked) L.push(['style', 140, 230, AX - STYLE_HW, 230]);
      if (st === S_LANDED) L.push(['ovary', 120, 470, AX - OVARY.rx + 10, OVARY.y + 20], ['ovule', 560, 380, OVULES[2].x + OVULES[2].r - 4, OVULES[2].y]);
      if (this._g > 0.03) L.push(['pollen tube', 540, 170, AX + 6, (GRAIN_Y + tipY) / 2]);
      if (this._g > T_GERM && !this._released) L.push(['male gamete', 540, Math.min(300, gc.y + 10), gc.x + 8, gc.y]);
    } else {
      L.push(['ovule', 560, 120, OVULES[2].x + 30, OVULES[2].y - 34]);
      if (this._released && !this._fused) L.push(['male gamete', 140, 430, GAMETE_AT.x - 4, GAMETE_AT.y + 4]);
      if (!this._fused) L.push(['egg cell', 560, 400, EGG.x + 10, EGG.y + 4]);
      else L.push(['zygote', 560, 400, EGG.x + 12, EGG.y + 4]);
      L.push(['pollen tube', 140, 120, AX + 12, 360]);
    }
    for (const [text, sx, sy, wx, wy] of L) {
      const [tx, ty] = toScreen(cam, wx, wy);
      const left = sx < 340;
      const px = this._px(17);
      ctx.font = font(c, 700, px);
      const w = ctx.measureText(text).width;
      const ex = left ? sx + w / 2 + 6 : sx - w / 2 - 6;
      ctx.strokeStyle = alpha(c.label, 0.7); ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(ex, sy); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = c.label;
      ctx.beginPath(); ctx.arc(tx, ty, 3, 0, TAU); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = alpha(c.bgDeep, 0.62);
      ctx.beginPath(); ctx.roundRect(sx - w / 2 - 8, sy - (px + 9) / 2, w + 16, px + 9, (px + 9) / 2); ctx.fill();
      ctx.fillStyle = text === 'zygote' ? c.good : c.label;
      ctx.fillText(text, sx, sy);
    }
  }

  _bottom(ctx, c) {
    const blocked = this._block === 'blocked';
    let chip = CHIP[this.stage] ?? '';
    let bg = blocked ? c.bad : c.s1;
    if (blocked) chip = 'blocked';
    else if (this._fused) { chip = 'zygote'; bg = c.good; }
    else if (this.stage === S_ZYGOTE) chip = 'fusing';
    else if (this.stage === S_OUT) chip = this._released ? 'released' : 'entering';
    const items = [{ text: chip, bg, size: this._px(17) }];
    chipRow(ctx, c, items, 340, 494, { align: 'center', gap: 10 });
  }
}
