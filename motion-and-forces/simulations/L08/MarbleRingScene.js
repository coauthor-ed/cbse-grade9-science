/**
 * MarbleRingScene - predict blk-l08-s2 "Lift the ring" (setup) and explain blk-l08-n02
 * "The marble goes straight" (1 beat; Activity 4.5, Fig 4.24).
 *   Top view of a smooth polished table, an adhesive tape ring on it and a glass marble running
 *   round inside the ring along its inner wall (clockwise, constant speed).
 *   Setup (hostRole 'setup' or beat MAX_SAFE_INTEGER): two rounds, then a frozen mid-run frame
 *   with a short fading trail; two fingers rest on the ring rim, ready to lift. No tangent, no
 *   straight path, no answer drawn.
 *   b0 'release': one round with its v arrow along the tangent; at the release point the ring
 *   lifts (grows, its shadow widens, it fades) and the marble goes on in a straight line at the
 *   same speed: equal-time dots, equal spacing, before and after. The tangent line at the release
 *   point is drawn ("tangent"), the old circle stays as a faint dashed line. Rest: the marble near
 *   the table edge on the line, the release point marked.
 * Every frame is a function of the beat and its age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, alpha, darken, lighten, mix, rr } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawTag } from '../shared/MotionGraph.js';

const TAU = Math.PI * 2;
const OX = 210, OY = 262, RIN = 120, RO = 158, MR = 15, RP = RIN - MR - 2;
const PERIOD = 2.0, OMEGA = TAU / PERIOD, V = RP * OMEGA;     // px per s, same on the circle and the line
const TH_R = -Math.PI / 4;                                    // the release point (upper right)
const DIR = { x: Math.cos(TH_R + Math.PI / 2), y: Math.sin(TH_R + Math.PI / 2) };
const PR = { x: OX + RP * Math.cos(TH_R), y: OY + RP * Math.sin(TH_R) };
const LINE = 300, T_LINE = LINE / V, DT = 0.15;
const LEAD = 0.3, T_REL = LEAD + PERIOD;                      // b0: one round, then release
const LIFT = 0.7;
const S_ROUNDS = 2, S_PERIOD = 1.6, S_EXTRA = 0.4;            // setup: two rounds, then a frozen frame
const S_TH0 = Math.PI * 0.75;
const HAND_TH = -Math.PI * 0.62;                             // where the fingers rest on the rim
const TABLE = { x: 14, y: 18, w: 652, h: 462, edge: 26 };

const onCircle = (th) => ({ x: OX + RP * Math.cos(th), y: OY + RP * Math.sin(th) });

export class MarbleRingScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  // The predict setup mount sends beat and count Number.MAX_SAFE_INTEGER: map it to stage 1 (setup).
  static BEAT_MAPS = { [Number.MAX_SAFE_INTEGER]: [[{ idx: 1, dwellMs: null }]] };
  static ARIA_LABEL = 'Top view of a smooth table with an adhesive tape ring lying on it. A glass marble runs round and round inside the ring, along its inner wall, at a steady speed. A hand rests two fingers on the ring, ready to lift it. When the ring is lifted away, the marble does not keep going round: it moves off in a straight line at the same speed, along the tangent to the circle at the point where it was released. Equal-time dots behind it stay equally spaced. The old circle is left as a faint dashed line.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === 1 || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.isSetup() ? this.age < LEAD + S_ROUNDS * S_PERIOD + S_EXTRA + 0.3 : this.age < T_REL + T_LINE + 1.4; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    this.table(ctx, c);
    if (this.isSetup()) this.setupFrame(ctx, c); else this.releaseFrame(ctx, c);
  }

  /** The table top: polished wood, a soft window reflection, faint grain, darker rim and front edge. */
  table(ctx, c) {
    const T = TABLE, wood = mix(c.s8, c.bgSurface, 0.74), deep = darken(wood, 0.28);
    ctx.save();
    rr(ctx, T.x + 4, T.y + 10, T.w, T.h + T.edge, 22); ctx.fillStyle = alpha(darken(c.stroke, 0.3), 0.35); ctx.fill();
    rr(ctx, T.x, T.y, T.w, T.h + T.edge, 22); ctx.fillStyle = deep; ctx.fill();
    const g = ctx.createLinearGradient(T.x, T.y, T.x + T.w * 0.6, T.y + T.h);
    g.addColorStop(0, lighten(wood, 0.22)); g.addColorStop(1, darken(wood, 0.06));
    rr(ctx, T.x, T.y, T.w, T.h, 22); ctx.fillStyle = g; ctx.fill();
    ctx.save(); rr(ctx, T.x, T.y, T.w, T.h, 22); ctx.clip();
    // grain: long faint wavy lines across the top
    ctx.strokeStyle = alpha(darken(wood, 0.25), 0.22); ctx.lineWidth = 1.5;
    for (let i = 0; i < 11; i++) {
      const y0 = T.y + 30 + i * 42;
      ctx.beginPath();
      for (let x = T.x; x <= T.x + T.w; x += 20) {
        const y = y0 + 6 * Math.sin(x / 90 + i * 1.7) + 3 * Math.sin(x / 31 + i);
        if (x === T.x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // polish: a soft diagonal reflection band and a window glint
    ctx.translate(T.x + T.w * 0.72, T.y + T.h * 0.28); ctx.rotate(-0.55);
    const s = ctx.createLinearGradient(-120, 0, 120, 0);
    s.addColorStop(0, alpha(lighten(wood, 0.9), 0)); s.addColorStop(0.5, alpha(lighten(wood, 0.9), 0.32)); s.addColorStop(1, alpha(lighten(wood, 0.9), 0));
    ctx.fillStyle = s; ctx.fillRect(-120, -420, 240, 840);
    ctx.fillStyle = alpha(lighten(wood, 0.95), 0.22); ctx.fillRect(150, -420, 34, 840);
    ctx.restore();
    // lit back edge, inner line, darker rim
    ctx.strokeStyle = alpha(lighten(wood, 0.7), 0.8); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(T.x + 24, T.y + 5); ctx.lineTo(T.x + T.w - 24, T.y + 5); ctx.stroke();
    rr(ctx, T.x + 6, T.y + 6, T.w - 12, T.h - 12, 17); ctx.lineWidth = 1.5; ctx.strokeStyle = alpha(darken(wood, 0.3), 0.3); ctx.stroke();
    rr(ctx, T.x, T.y, T.w, T.h, 22); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(wood, 0.45); ctx.stroke();
    rr(ctx, T.x, T.y, T.w, T.h + T.edge, 22); ctx.lineWidth = 2.5; ctx.strokeStyle = darken(wood, 0.5); ctx.stroke();
    ctx.restore();
  }

  /** The tape ring (k: 0 on the table .. 1 lifted away): thick band, layered tape, inner wall shade. */
  ring(ctx, c, k = 0) {
    if (k >= 1) return;
    const tape = mix(c.s3, c.bgSurface, 0.25), sc = 1 + 0.1 * k, fade = 1 - clamp01((k - 0.25) / 0.75);
    const sh = 6 + 30 * k;
    ctx.save();
    // shadow: widens and softens as the ring rises
    ctx.globalAlpha = fade * (1 - 0.5 * k);
    ctx.beginPath(); ctx.arc(OX + sh * 0.6, OY + sh, RO * (1 + 0.06 * k) + 4 * k, 0, TAU); ctx.arc(OX + sh * 0.6, OY + sh, RIN * (1 + 0.06 * k) - 6 * k, 0, TAU, true);
    ctx.fillStyle = alpha(darken(c.stroke, 0.4), 0.32); ctx.fill();
    ctx.globalAlpha = fade;
    ctx.translate(OX, OY); ctx.scale(sc, sc);
    // band
    const g = ctx.createRadialGradient(-50, -60, RIN * 0.6, 0, 0, RO);
    g.addColorStop(0, lighten(tape, 0.3)); g.addColorStop(1, darken(tape, 0.12));
    ctx.beginPath(); ctx.arc(0, 0, RO, 0, TAU); ctx.arc(0, 0, RIN, 0, TAU, true); ctx.fillStyle = g; ctx.fill('evenodd');
    // tape layers
    ctx.lineWidth = 1.2;
    for (let r = RIN + 6; r < RO - 3; r += 4.5) {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.strokeStyle = alpha(darken(tape, 0.25), 0.28); ctx.stroke();
    }
    // the free end of the tape
    ctx.beginPath(); ctx.moveTo((RO - 1) * Math.cos(2.3), (RO - 1) * Math.sin(2.3)); ctx.lineTo((RO - 9) * Math.cos(2.23), (RO - 9) * Math.sin(2.23));
    ctx.strokeStyle = darken(tape, 0.35); ctx.lineWidth = 2; ctx.stroke();
    // shine across the top-left of the band
    ctx.beginPath(); ctx.arc(0, 0, (RIN + RO) / 2 + 4, Math.PI * 1.05, Math.PI * 1.55); ctx.strokeStyle = alpha(lighten(tape, 0.75), 0.75); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
    // inner wall: shade on the upper-left inside (the wall facing away from the light), lit lower-right
    ctx.beginPath(); ctx.arc(0, 0, RIN, Math.PI * 0.85, Math.PI * 1.75); ctx.arc(-5, -6, RIN - 4, Math.PI * 1.75, Math.PI * 0.85, true); ctx.closePath();
    ctx.fillStyle = alpha(darken(tape, 0.45), 0.55); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, RIN - 1, Math.PI * 1.95, Math.PI * 0.6); ctx.strokeStyle = alpha(lighten(tape, 0.6), 0.7); ctx.lineWidth = 3; ctx.stroke();
    // rims
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(0, 0, RO, 0, TAU); ctx.strokeStyle = darken(tape, 0.5); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, RIN, 0, TAU); ctx.strokeStyle = darken(tape, 0.55); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }

  /** Three fingers and a thumb of a hand from above, resting on the ring rim (top view, palm down). */
  hand(ctx, c, k = 0) {
    if (k >= 1) return;
    const look = figureLook(c, { skin: 2, top: 1 }), skin = look.skin, sleeve = look.top;
    const fade = 1 - clamp01((k - 0.25) / 0.75), sc = 1 + 0.1 * k;
    ctx.save();
    ctx.globalAlpha = fade;
    // fingertips on the band near the top, the arm going off the far edge of the table
    ctx.translate(OX, OY); ctx.scale(sc, sc);
    ctx.translate((RO - 24) * Math.cos(HAND_TH), (RO - 24) * Math.sin(HAND_TH)); ctx.rotate(HAND_TH);
    ctx.translate(24 * k, 0);
    const fx = 0, fy = 0;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // shadow on the table
    ctx.beginPath(); ctx.ellipse(fx + 150, fy + 34, 120, 42, 0.12, 0, TAU); ctx.fillStyle = alpha(darken(c.stroke, 0.4), 0.18); ctx.fill();
    // sleeve and wrist
    const seg = (x1, y1, x2, y2, w, col) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = darken(col, 0.42); ctx.lineWidth = w + 5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1 - w * 0.22); ctx.lineTo(x2, y2 - w * 0.22); ctx.strokeStyle = alpha(lighten(col, 0.45), 0.6); ctx.lineWidth = w * 0.28; ctx.stroke();
    };
    seg(fx + 210, fy + 40, fx + 330, fy + 64, 70, sleeve);
    seg(fx + 120, fy + 20, fx + 214, fy + 40, 58, skin);
    // fingers first (index and middle pressing on the band, ring finger curled), the back of the hand over their roots
    const finger = (x1, y1, x2, y2, w) => {
      seg(x1, y1, x2, y2, w, skin);
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.save(); ctx.translate(x2, y2); ctx.rotate(a);
      rr(ctx, -w * 0.7, -w * 0.3, w * 0.62, w * 0.6, w * 0.28); ctx.fillStyle = alpha(lighten(skin, 0.55), 0.85); ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = alpha(darken(skin, 0.35), 0.7); ctx.stroke();
      ctx.restore();
    };
    finger(fx + 80, fy + 34, fx + 34, fy + 40, 17);
    finger(fx + 80, fy + 16, fx + 4, fy + 18, 19);
    finger(fx + 80, fy - 4, fx, fy - 6, 19);
    // thumb: under the hand, its tip against the outside of the band
    finger(fx + 104, fy + 44, fx + 46, fy + 62, 21);
    ctx.beginPath(); ctx.ellipse(fx + 108, fy + 16, 50, 40, 0.12, 0, TAU); ctx.fillStyle = skin; ctx.fill();
    ctx.strokeStyle = darken(skin, 0.42); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(fx + 102, fy + 2, 30, 14, 0.1, 0, TAU); ctx.fillStyle = alpha(lighten(skin, 0.4), 0.5); ctx.fill();
    // knuckle line
    ctx.beginPath(); ctx.moveTo(fx + 72, fy - 10); ctx.quadraticCurveTo(fx + 64, fy + 14, fx + 74, fy + 40);
    ctx.strokeStyle = alpha(darken(skin, 0.3), 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  marble(ctx, c, x, y) {
    const glass = mix(c.s1, c.bgSurface, 0.1);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x + 5, y + 7, MR * 1.05, MR * 0.8, 0.4, 0, TAU); ctx.fillStyle = alpha(darken(c.stroke, 0.4), 0.35); ctx.fill();
    const g = ctx.createRadialGradient(x - 5, y - 6, 2, x, y, MR);
    g.addColorStop(0, lighten(glass, 0.65)); g.addColorStop(0.6, glass); g.addColorStop(1, darken(glass, 0.35));
    ctx.beginPath(); ctx.arc(x, y, MR, 0, TAU); ctx.fillStyle = g; ctx.fill();
    // the coloured swirl inside the glass
    ctx.beginPath(); ctx.moveTo(x - 8, y + 5); ctx.quadraticCurveTo(x, y - 9, x + 8, y + 3);
    ctx.strokeStyle = alpha(c.s3, 0.85); ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, MR, 0, TAU); ctx.strokeStyle = darken(glass, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 5, y - 6, 4, 0, TAU); ctx.fillStyle = alpha(lighten(glass, 0.95), 0.95); ctx.fill();
    ctx.restore();
  }

  dot(ctx, c, x, y, k = 1) {
    ctx.save();
    ctx.globalAlpha = k;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fillStyle = darken(c.s1, 0.15); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = darken(c.s1, 0.5); ctx.stroke();
    ctx.restore();
  }

  /** A short trail behind the marble on the circle (fading toward the back). */
  trail(ctx, c, th, span = 1.1) {
    ctx.save();
    ctx.lineCap = 'round';
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a0 = th - span * (i + 1) / n, a1 = th - span * i / n;
      ctx.beginPath(); ctx.arc(OX, OY, RP, a0, a1);
      ctx.strokeStyle = alpha(lighten(c.s1, 0.3), 0.55 * (1 - i / n)); ctx.lineWidth = 2 * MR * (0.9 - 0.4 * i / n); ctx.stroke();
    }
    ctx.restore();
  }

  setupFrame(ctx, c) {
    const run = S_ROUNDS * S_PERIOD + S_EXTRA, tt = clamp01((this.age - LEAD) / run) * run;
    const th = S_TH0 + (TAU / S_PERIOD) * tt;
    this.ring(ctx, c, 0);
    this.trail(ctx, c, th);
    const p = onCircle(th);
    this.marble(ctx, c, p.x, p.y);
    this.hand(ctx, c, 0);
  }

  releaseFrame(ctx, c) {
    const a = this.age;
    const tCirc = Math.min(a, T_REL) - LEAD;                      // time on the circle (may be < 0)
    const th = TH_R + OMEGA * Math.max(0, tCirc);
    const tLine = Math.max(0, a - T_REL), sLine = Math.min(tLine, T_LINE) * V;
    const lift = clamp01((a - T_REL) / LIFT);
    const out = a >= T_REL;
    // the old circle, dashed, once the ring has gone
    const ghost = clamp01((a - T_REL - 0.2) / 0.5);
    if (ghost > 0) {
      ctx.save(); ctx.globalAlpha = 0.55 * ghost; ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 2.5; ctx.setLineDash([8, 9]);
      ctx.beginPath(); ctx.arc(OX, OY, RP, 0, TAU); ctx.stroke(); ctx.restore();
    }
    this.ring(ctx, c, inOutSine(lift));
    // tangent line at the release point, drawn out both ways
    const tk = inOutSine(clamp01((a - T_REL - 0.1) / 0.6));
    if (tk > 0) {
      const back = 150 * tk, fwd = (LINE + 70) * tk;
      ctx.save(); ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(PR.x - DIR.x * back, PR.y - DIR.y * back); ctx.lineTo(PR.x + DIR.x * fwd, PR.y + DIR.y * fwd); ctx.stroke();
      ctx.restore();
    }
    // equal-time dots: the last four on the circle, then along the line
    if (tCirc > PERIOD - 4 * DT - 1e-6 || out) {
      for (let n = 4; n >= 1; n--) {
        const tn = PERIOD - n * DT;
        if (tCirc + 1e-6 < tn && !out) continue;
        const q = onCircle(TH_R + OMEGA * tn);
        this.dot(ctx, c, q.x, q.y, 0.9);
      }
    }
    if (out) {
      this.dot(ctx, c, PR.x, PR.y, 0.9);
      for (let n = 1; n * DT <= tLine + 1e-6 && n * DT * V <= LINE - 10; n++) {
        this.dot(ctx, c, PR.x + DIR.x * n * DT * V, PR.y + DIR.y * n * DT * V, 0.9);
      }
    }
    // release point ring
    if (out) {
      const k = clamp01((a - T_REL) / 0.3);
      ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = c.annot; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(PR.x, PR.y, 13, 0, TAU); ctx.stroke(); ctx.restore();
    }
    // the marble and its velocity arrow (along the tangent the whole time)
    const p = out ? { x: PR.x + DIR.x * sLine, y: PR.y + DIR.y * sLine } : onCircle(th);
    const ang = out ? Math.atan2(DIR.y, DIR.x) : th + Math.PI / 2;
    if (!out && tCirc > 0) this.trail(ctx, c, th, 0.7);
    this.marble(ctx, c, p.x, p.y);
    const vx0 = p.x + Math.cos(ang) * (MR + 2), vy0 = p.y + Math.sin(ang) * (MR + 2);
    drawMotionArrow(ctx, c, 'v', vx0, vy0, { length: 78, angle: ang, label: '' });
    // the 'v' label on a chip (a bare label on the wood read dark on brown at night), right of travel
    drawTag(ctx, c, 'v', vx0 + Math.cos(ang) * 43 - Math.sin(ang) * 34, vy0 + Math.sin(ang) * 43 + Math.cos(ang) * 34, { size: 26, col: c.s1 });
    this.hand(ctx, c, inOutSine(lift));
    if (tk > 0.6) {
      const k = clamp01((tk - 0.6) / 0.4), nx = DIR.y, ny = -DIR.x;
      drawTag(ctx, c, 'tangent', PR.x - DIR.x * 90 + nx * 72, PR.y - DIR.y * 90 + ny * 72, { alpha: k, col: c.labelMuted });
    }
  }
}
