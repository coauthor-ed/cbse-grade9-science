/**
 * RubberBandScene - L01, three mounts. Rebuilt 2026-11-03 (whole file).
 *   blk-l01-s01 (2 beats)  b0 a student's finger pulls the band aside, lets go: the band swings
 *                          to and fro (damped), sound arcs leave the box mouth with strength =
 *                          the band's swing / A; re-plucked every few seconds.
 *                          b1 the hand is well away; the band keeps swinging, arcs go on.
 *   blk-l01-s02 (predict, hostRole 'setup')  band swinging, hand away, arcs; no tags.
 *   blk-l01-s03 (3 beats)  b0 one pluck, full decay: swing and arcs end together, the band
 *                          is a straight still line (still stretched), a pause, repeat.
 *                          b1 slow motion: the two end positions as ghosts, a double arrow,
 *                          tags "vibration" and "one oscillation".
 *                          b2 band lit, box dimmed, arcs; tag "source".
 * Band motion: swing(t) = A e^(-t/TAU_D) cos(2 pi F t) from release (released from rest at A).
 * The student is one fixed side-view stance, auto-reach off: only the arm moves.
 *
 * Keeps the OLD box recipe below the class, unexported (legacyBoxAndBand); it was exported earlier because
 * L05 TwoBandCompareScene imports it from this file with the old options.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBench, drawFloor, drawBackdrop, pill, alpha, mix, lighten, darken, inOutSine, clamp01, ellipse } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs, drawVibrationArrow } from 'simulations/base/kit/SimWave.js';
import { figureFor, solveFigure, paintFigure } from 'simulations/base/kit/SimFigure.js';
import { drawBoxAndBand as drawBox } from '../shared/SoundArt.js';

const TAU = Math.PI * 2;
const LBL = { size: 26, display: true };

// the box: opening 360 wide (with its depth the box spans about 70 per cent of the width)
// the band spans the middle of the opening with clear air either side; the student's reach
// (about 160 px from the shoulder) sets how far right the band sits
const BOX = { x: 345, y: 300, w: 340, bandAt: 0.04 };
const BX = BOX.x + BOX.bandAt * BOX.w;            // the band's line
const Y0 = BOX.y - BOX.w * 0.43, Y1 = BOX.y + BOX.w * 0.43;
const TABLE = { x0: 120, x1: 620, y: Y1 };

const A = 30;               // pull and release (px)
const F = 3.4;              // band swing (Hz on screen)
const F_SLOW = 0.55;        // slow motion (s03 b1)
const TAU_D = 1.6;          // decay time (s)
const V_ARC = 116;          // arc speed (px/s): wavelength = V_ARC / F
const T_REACH = 0.6, T_PULL = 0.4, T_REL = T_REACH + T_PULL, T_AWAY = 0.55;
const P1 = 3.2;             // s01 b0: re-pluck period
const T_DIE = 5.4;          // s03 b0: from release to exactly still
const P3 = T_REL + T_DIE + 1.3;
const ST = { x: 498, y: 636, height: 460 };

const MAP2 = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
const MAP3 = [[{ idx: 2, dwellMs: null }], [{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }]];

// envelope after release, eased to exactly zero at T_DIE when `die` is set
function env(u, die) {
  if (u < 0) return 0;
  const e = Math.exp(-u / TAU_D);
  if (!die) return e;
  if (u >= T_DIE) return 0;
  const k = Math.min(1, (T_DIE - u) / 1.2);
  return e * k * k * (3 - 2 * k);
}

export class RubberBandScene extends SimScene {
  static BEAT_MAPS = { 2: MAP2, 3: MAP3 };
  static BEAT_STEP_MAP = MAP2;
  static ARIA_LABEL = 'A rubber band is stretched across the open side of a cardboard box. A student pulls the band aside with a finger and lets go: the band swings to and fro, smaller and smaller, and sound arcs leave the box, fading as the swing fades. With the hand gone the band still swings. Watched to the end, the band and the sound stop together and the band is a straight still line. In slow motion the band moves between two end positions: vibration, one oscillation. The band is the source.';

  constructor(container, config) {
    super(container, config);
    this.mode = 's01-0';
    this.geo = null;
  }

  enter(stage) {
    if (this.hostRole === 'setup' || stage === Number.MAX_SAFE_INTEGER || this.beatCount > 1000) { this.mode = 'setup'; return; }
    const s = Math.max(0, Math.min(4, stage | 0));
    this.mode = ['s01-0', 's01-1', 's03-0', 's03-1', 's03-2'][s];
  }

  _tend() {
    switch (this.mode) {
      case 's01-0': return P1 + T_REL + 0.18;           // second pluck: finger just leaving
      case 's03-0': return 2 * P3 + T_REL + T_DIE + 0.6; // two whole decays, then park just after the third stops
      case 's03-1': return 4 / F_SLOW;
      default: return 3.2;
    }
  }

  busy() { return this.age < this._tend(); }

  _geom() {
    if (this.geo) return this.geo;
    const base = figureFor(this, { role: 'student', x: ST.x, y: ST.y, height: ST.height, facing: -1, i: 1, pose: 'stand', autoReach: false, mood: 'smile' });
    const sk = solveFigure(base);
    const away = { x: sk.anchors.hand[0].x, y: sk.anchors.hand[0].y };
    const lift = { x: Math.min(away.x, 600), y: Math.min(away.y, 420) };
    this.geo = { base, away: lift, sh: sk.anchors.shoulder };
    return this.geo;
  }

  // the band now: { swing, hand (null = away), k (arc strength 0..1) }
  _state(t) {
    const G = this._geom();
    const grab = (sw) => ({ x: BX + sw + 14, y: BOX.y + 6 });
    const pluck = (u, prev, die) => {
      if (u < T_REACH) {
        const k = inOutSine(clamp01(u / T_REACH));
        const g = grab(0);
        return { swing: prev, hand: { x: G.away.x + (g.x - G.away.x) * k, y: G.away.y + (g.y - G.away.y) * k }, k: Math.abs(prev) / A };
      }
      if (u < T_REL) {
        const k = inOutSine(clamp01((u - T_REACH) / T_PULL));
        const sw = prev * (1 - clamp01((u - T_REACH) / 0.1)) + A * k;
        return { swing: sw, hand: grab(sw), k: 0 };
      }
      const r = u - T_REL, e = env(r, die);
      const sw = A * e * Math.cos(TAU * F * r);
      const ka = inOutSine(clamp01(r / T_AWAY)), g = grab(A);
      const hand = { x: g.x + (G.away.x - g.x) * ka, y: g.y + (G.away.y - g.y) * ka };
      return { swing: sw, hand: r < T_AWAY ? hand : G.away, k: e };
    };
    switch (this.mode) {
      case 's01-0': {
        const n = Math.floor(t / P1), u = t - n * P1;
        // what is left of the previous pluck when the finger comes back
        const prev = n > 0 ? A * env(u + P1 - T_REL, false) * Math.cos(TAU * F * (u + P1 - T_REL)) : 0;
        if (u < T_REL) return pluck(u, u < T_REACH ? prev : prev, false);
        return pluck(u, 0, false);
      }
      case 's03-0': {
        const n = Math.floor(t / P3), u = t - n * P3;
        return pluck(u, 0, true);
      }
      case 's03-1': return { swing: A * Math.cos(TAU * F_SLOW * t), hand: G.away, k: 0, slow: true };
      case 's01-1': {
        // the hand leaves on landing; the swing is held (the stop is the predict's answer)
        const ka = inOutSine(clamp01(t / 0.7)), g = grab(0);
        const hand = { x: g.x + (G.away.x - g.x) * ka, y: g.y + (G.away.y - g.y) * ka };
        return { swing: 0.8 * A * Math.sin(TAU * F * t), hand, k: 0.8 };
      }
      case 'setup': {
        // the moment just after release: the finger a little off the band, the band in its
        // first swings, no arcs and nothing lit (band and hand weigh the same)
        const g = grab(A);
        return { swing: A * Math.cos(TAU * F * t), hand: { x: g.x + 34, y: g.y + 14 }, k: 0 };
      }
      default: return { swing: 0.8 * A * Math.sin(TAU * F * t), hand: G.away, k: 0.8 };
    }
  }

  t() { return Math.min(this.age, this._tend()); }

  draw(ctx, c) {
    const t = this.t();
    const st = this._state(t);
    const G = this._geom();
    const dimBox = this.mode === 's03-2';
    drawBackdrop(ctx, c, 'dots');
    drawFloor(ctx, c, 500, {});
    const spec = { ...G.base, hands: [st.hand, null] };
    const sk = solveFigure(spec);
    const look = G.base.look;
    drawBench(ctx, c, TABLE.x0, TABLE.x1, TABLE.y, { h: 70 });
    const slow = this.mode === 's03-1';
    drawBox(ctx, c, { x: BOX.x, y: BOX.y, w: BOX.w, bandAt: BOX.bandAt, swing: st.swing, ghost: slow ? 1 : 0, amp: A });
    // the student stands in front of the box's right side; the hand lies over the box
    paintFigure(ctx, c, sk, look, { layer: 'all', noShadow: true });
    if (dimBox) this._dimAndLight(ctx, c, st.swing);
    // arcs leave the band itself, out through the box mouth: strength follows the swing envelope
    if (!slow && st.k > 0.02) {
      drawSoundArcs(ctx, c, { x: BX - 8, y: BOX.y - 20, dir: Math.PI, spread: 0.9, n: 5, wavelength: V_ARC / F, speed: V_ARC, r0: 26, t, strength: Math.min(1, st.k) });
    }
    if (slow) this._oscillation(ctx, c, st.swing, t);
    if (dimBox) pill(ctx, c, 'source', BX - A - 66, BOX.y + 78, { ...LBL, bg: c.warning, ink: darken(c.warning, 0.75) });
  }

  // s03 b1: the double arrow across the band's swing with "vibration" beside it; above it, one
  // lap round the two ghost end positions (out to one side, across, back) with a marker riding
  // the band's own position: that lap is "one oscillation"
  _oscillation(ctx, c, swing, t) {
    const ya = BOX.y + 70;
    drawVibrationArrow(ctx, c, { x: BX, y: ya, len: 2 * A + 34 });
    pill(ctx, c, 'vibration', BX - A - 86, ya, { ...LBL, bg: c.raised, ink: c.label });
    const yl = BOX.y - 74, ry = 14, rx = A;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.75); ctx.lineWidth = 3; ctx.setLineDash([7, 6]);
    ctx.beginPath(); ctx.ellipse(BX, yl, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    // arrow head on the upper path, pointing the way the lap runs
    ctx.fillStyle = alpha(c.label, 0.85);
    ctx.beginPath(); ctx.moveTo(BX + 9, yl - ry); ctx.lineTo(BX - 5, yl - ry - 7); ctx.lineTo(BX - 5, yl - ry + 7); ctx.closePath(); ctx.fill();
    // the marker: x = the band's swing; upper half while moving right, lower half while moving left
    const v = -Math.sin(TAU * F_SLOW * t);
    const mx = BX + swing, my = yl + (v >= 0 ? -1 : 1) * ry * Math.sqrt(Math.max(0, 1 - (swing / rx) ** 2));
    ctx.fillStyle = mix(c.warning, c.flame, 0.5);
    ctx.beginPath(); ctx.arc(mx, my, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = darken(c.warning, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    pill(ctx, c, 'one oscillation', BX - A - 128, yl, { ...LBL, bg: c.raised, ink: c.label });
  }

  // s03 b2: everything but the band dimmed (box, table, student), a warm glow round the band
  _dimAndLight(ctx, c, swing) {
    const a = { x: BX, y: Y0 + 1 }, b = { x: BX, y: Y1 - 1 }, hw = 6;
    const curve = (u) => ({ x: BX + 4 * swing * u * (1 - u), y: a.y + (b.y - a.y) * u });
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 680, 520);
    // the band, cut out of the dim layer
    for (let i = 0; i <= 24; i++) { const p = curve(i / 24); if (i) ctx.lineTo(p.x - hw, p.y); else ctx.moveTo(p.x - hw, p.y); }
    for (let i = 24; i >= 0; i--) { const p = curve(i / 24); ctx.lineTo(p.x + hw, p.y); }
    ctx.closePath();
    ctx.clip('evenodd');
    ctx.fillStyle = alpha(c.bgDeep, 0.5);
    ctx.fillRect(0, 0, 680, 520);
    ctx.lineCap = 'round';
    for (const [w, k] of [[34, 0.16], [20, 0.26], [12, 0.36]]) {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(BX + 2 * swing, BOX.y, b.x, b.y);
      ctx.strokeStyle = alpha(lighten(c.warning, 0.2), k); ctx.lineWidth = w; ctx.stroke();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------------------
// Legacy: the old box recipe, kept verbatim for L05 TwoBandCompareScene (imports it from here).
// Old box recipe, no longer imported by any scene (L05 now uses SoundArt); kept unexported.
function legacyBoxAndBand(ctx, c, o) {
  const { x, y, w, h } = o;
  const depth = o.depth ?? Math.round(w * 0.11);
  const rise = o.rise ?? Math.round(depth * 0.58);
  const rim = o.rim ?? Math.round(w * 0.05);
  const bandY = y + (o.bandRel ?? 0.52) * h;
  const thick = o.thick ?? Math.max(4, Math.round(w * 0.021));
  const col = o.col ?? mix(c.flame, c.warning, 0.30);

  // Cardboard: the lit top rim, the two side walls, the dark inside and its back face.
  const cardTop = lighten(mix(c.warning, c.raised, 0.30), 0.10);
  const cardSide = darken(mix(c.warning, c.raised, 0.46), 0.10);
  const cardIn = darken(mix(mix(c.bgDeep, c.raised, 0.4), c.warning, 0.18), 0.34);  // the shadowed inside
  const cardInLit = mix(cardIn, c.warning, 0.20);                  // its far wall, catching light
  const cardBack = darken(cardIn, 0.22);

  const quad = (pts, fill) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const bk = depth * 0.62, bkr = rise * 0.8;   // how far back the inside is seen

  // the outside of the box: the top rim and the two side walls
  quad([[x, y], [x + w, y], [x + w + depth, y - rise], [x + depth, y - rise]], cardTop);
  quad([[x, y], [x + depth, y - rise], [x + depth, y + h - rise], [x, y + h]], cardSide);
  quad([[x + w, y], [x + w + depth, y - rise], [x + w + depth, y + h - rise], [x + w, y + h]],
    darken(cardSide, 0.10));
  // the opening, then the inside of its far walls and its back
  const ix0 = x + rim, ix1 = x + w - rim, iy0 = y + rim, iy1 = y + h - rim;
  quad([[ix0, iy0], [ix1, iy0], [ix1, iy1], [ix0, iy1]], cardIn);
  quad([[ix0, iy0], [ix1, iy0], [ix1 + bk, iy0 - bkr], [ix0 + bk, iy0 - bkr]], cardInLit);
  quad([[ix0, iy0], [ix0 + bk, iy0 - bkr], [ix0 + bk, iy1 - bkr], [ix0, iy1]],
    darken(cardInLit, 0.10));
  quad([[ix1, iy0], [ix1 + bk, iy0 - bkr], [ix1 + bk, iy1 - bkr], [ix1, iy1]], cardIn);
  quad([[ix0 + bk, iy1 - bkr], [ix1 + bk, iy1 - bkr], [ix1, iy1], [ix0, iy1]], cardBack);

  // The band: one taut line, hooked over the two corner pegs, with the drawn blur as a
  // lens around it (two arcs, because the band is pinned at both ends).
  const x0 = ix0 - rim * 0.5, x1 = ix1 + rim * 0.5;
  const midX = (x0 + x1) / 2;
  const drop = (o.pull ?? 0) + (o.sag ?? 0);
  const midY = bandY + drop;
  const band = (k, w2) => {                       // one curve of the band, offset by k px
    ctx.beginPath();
    ctx.moveTo(x0, bandY + k);
    ctx.quadraticCurveTo(midX, bandY + k + drop * 2, x1, bandY + k);
    ctx.strokeStyle = w2.col;
    ctx.lineWidth = w2.w;
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const amp = Math.max(0, o.amp ?? 0);
  if (amp > 0.6) {
    const bow = amp * 1.4;
    ctx.beginPath();                              // the blur envelope, wide and soft
    ctx.moveTo(x0, bandY - bow);
    ctx.quadraticCurveTo(midX, bandY - bow + drop * 2, x1, bandY - bow);
    ctx.quadraticCurveTo(midX, bandY + bow + drop * 2, x0, bandY + bow);
    ctx.closePath();
    ctx.fillStyle = alpha(col, 0.16);
    ctx.fill();
    for (const f of [-0.78, -0.5, 0.5, 0.78]) {   // the to-and-fro drawn out into positions
      band(f * bow * 0.86, { col: alpha(col, 0.15), w: thick * 0.5 });
    }
    if (o.phase !== undefined) {                 // where the band is inside its to-and-fro
      band(Math.sin(TAU * o.phase) * amp * 1.05, { col: alpha(lighten(col, 0.20), 0.85), w: thick * 0.95 });
    }
  }
  band(0, { col, w: thick });
  band(-thick * 0.26, { col: alpha(lighten(col, 0.34), 0.5), w: thick * 0.3 });

  if (o.pegs !== false) {                         // the two corner pegs the band hooks over
    [x0, x1].forEach((px) => {
      ellipse(ctx, px, bandY + drop * 0.5, thick * 0.95, thick * 0.95);
      ctx.fillStyle = mix(c.raised, c.label, 0.18);
      ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.5);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    });
  }
  return { x0, x1, bandY, midX, midY, thick, col, anchors: [{ x: x0, y: bandY }, { x: x1, y: bandY }] };
}

