// HallAcousticsScene.js - slide "Reverberation" (blk-l06-n01, 2 beats).
// Rebuilt 2026-11-03 (whole-file rewrite). A hall in cut view (SoundArt drawHall), a speaker on the
// stage, a listener seated in the hall.
// b0 bare hall: the speaker plays a short note (TON s) and stops. Sound packets leave along RAYS
//    rays; each is traced off the hall's own outline segments (angle in = angle out), and after every
//    bounce the packet keeps a fraction REFLECT[kind] of its energy, so it is drawn dimmer. The strip
//    chart under the hall is the sound level at the listener: it rises while the source plays and
//    then decays with a time constant computed from the traced rays (mean time between bounces /
//    -ln(mean energy kept per bounce)), so the tail after "source stops" is the reverberation.
// b1 the same hall with panels, cushioned seats and curtains: panels and curtains keep little energy
//    and the cushioned seats cover the floor, so the same rays die out fast; two traces side by side,
//    "bare" and "with panels", both from the same computation.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, alpha, mix, lighten, rr } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawSpeaker } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { drawHall } from '../shared/SoundArt.js';

const W = 680, TAU = Math.PI * 2;
const HALL = { x: 20, y: 10, w: 640, h: 300 };
const V = 250, TON = 0.8, T_END = 7.6;
// the run is played RATE times faster than the hall's own time, so the whole trace (with its slow tail) is on
// screen in about 3.5 s and the scene parks on the finished picture
const RATE = 2.2, LOOP = T_END / RATE + 0.1;
const TRAIL = 520;                              // path length (px) of the recent wall-to-wall legs kept on screen
const RAYS = [-0.82, -0.6, -0.4, -0.22, -0.06, 0.1, 0.26, 0.42, 0.56];
const REFLECT = { wall: 0.86, ceiling: 0.86, stage: 0.86, floor: 0.86, panel: 0.12 };
const SEAT_FLOOR = 0.3;                         // floor under cushioned seats
const SIZE = 26;

/** Trace one ray off segs; returns legs [{ a, b, s0, s1, e }] (e = energy along that leg). */
function trace(p0, ang, segs, lMax, soft) {
  const legs = []; let p = { ...p0 }, d = { x: Math.cos(ang), y: Math.sin(ang) }, s = 0, e = 1, last = null;
  for (let n = 0; n < 40 && s < lMax; n++) {
    let best = null;
    for (const g of segs) {
      if (g === last) continue;
      const ex = g.b.x - g.a.x, ey = g.b.y - g.a.y, den = d.x * ey - d.y * ex;
      if (Math.abs(den) < 1e-9) continue;
      const tt = ((g.a.x - p.x) * ey - (g.a.y - p.y) * ex) / den, u = ((g.a.x - p.x) * d.y - (g.a.y - p.y) * d.x) / den;
      if (tt > 0.5 && u >= -0.001 && u <= 1.001 && (!best || tt < best.tt)) best = { tt, g };
    }
    if (!best) break;
    const q = { x: p.x + d.x * best.tt, y: p.y + d.y * best.tt };
    legs.push({ a: p, b: q, s0: s, s1: s + best.tt, e });
    s += best.tt;
    const g = best.g, len = Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y), nx = -(g.b.y - g.a.y) / len, ny = (g.b.x - g.a.x) / len;
    const dn = d.x * nx + d.y * ny; d = { x: d.x - 2 * dn * nx, y: d.y - 2 * dn * ny };
    e *= g.kind === 'floor' && soft ? SEAT_FLOOR : REFLECT[g.kind] ?? 0.86;
    p = q; last = g;
  }
  return legs;
}

/** Ray stats -> decay time constant (s) of the sound left in the hall. */
function decayTau(paths) {
  let legs = 0, len = 0, logE = 0;
  for (const P of paths) for (let i = 1; i < P.length; i++) { legs++; len += P[i].s1 - P[i].s0; logE += Math.log(P[i].e / P[i - 1].e); }
  const tb = len / legs / V, kept = Math.exp(logE / legs);
  return tb / -Math.log(kept);
}

export class HallAcousticsScene extends SimScene {
  static HEIGHT = 520;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A hall in cut view with a speaker on the stage and a listener seated in the hall. The speaker '
    + 'plays a short note and stops. Sound travels along several paths that bounce many times off the walls, the '
    + 'ceiling and the floor, getting dimmer at each bounce, and a sound-level trace under the hall keeps going after '
    + 'the source stops and fades slowly: reverberation. Then the hall gets sound-absorbing panels, cushioned seats and '
    + 'curtains; the paths die out quickly, and two traces side by side show the bare hall fading slowly and the hall '
    + 'with panels fading fast.';

  constructor(container, config) {
    super(container, config);
    this.cache = {};
  }

  t() { return this.age; }
  busy() { return this.t() < LOOP; }
  /** Hall time (s): scene time x RATE, held at T_END once the run is over. */
  u() { const a = this.t(); return a < LOOP ? Math.min(T_END, a * RATE) : T_END; }

  /** Hall geometry and rays for one fit-out, computed once (drawHall is pure geometry + paint). */
  geometry(ctx, c, soft, src) {
    const key = soft ? 'soft' : 'bare';
    if (this.cache[key]) return this.cache[key];
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 0, 0); ctx.clip();
    const h = drawHall(ctx, c, { ...HALL, panels: soft, curtains: soft, seats: soft ? 'cushioned' : 'bare' });
    ctx.restore();
    const paths = RAYS.map((a) => trace(src, a, h.segs, V * T_END + 10, soft));
    this.cache[key] = { paths, tau: decayTau(paths), src };
    return this.cache[key];
  }

  draw(ctx, c) {
    const tl = this.u(), soft = this.stage >= 1;
    ctx.fillStyle = mix(c.bgSurface, c.bgDeep, 0.06); ctx.fillRect(0, 0, W, 520);
    const hall = drawHall(ctx, c, { ...HALL, panels: soft, curtains: soft, seats: soft ? 'cushioned' : 'bare' });
    // the speaker on the stage: cone faces the hall
    const on = tl < TON;
    const sp = drawSpeaker(ctx, c, { x: hall.stage.x + 64, y: hall.stage.y - 48, r: 26, cutaway: true, cone: on ? Math.sin(TAU * 5 * tl) * 0.8 : 0 });
    const src = { x: sp.cone.x + 6, y: sp.cone.y };
    const bare = this.geometry(ctx, c, false, src), G = soft ? this.geometry(ctx, c, true, src) : bare;
    if (on) drawSoundArcs(ctx, c, { x: sp.cone.x + 4, y: sp.cone.y, dir: -0.15, spread: 1.4, n: 3, wavelength: 26, t: tl, strength: 0.9 });
    // the listener, seated in row 6, facing the stage
    const fy = hall.floorY, ix = hall.inner.x, iw = hall.inner.w, sx1 = hall.stage.x + hall.stage.w;
    const px = sx1 + 40 + 5 * (ix + iw - (soft ? 30 : 16) - sx1 - 70) / 6;
    const level = this.level(tl, G.tau);
    const fig = figureFor(this, { role: 'student', pose: 'sit', x: px, y: fy - 4, seat: { x: px, y: fy - (soft ? 30 : 25) }, height: 118, facing: -1, i: 4, mood: 'smile' });
    const sk = drawFigure(ctx, c, fig);
    const hd = sk.anchors.head;
    if (level > 0.03) {
      const gr = ctx.createRadialGradient(hd.x, hd.y, 2, hd.x, hd.y, hd.r * 1.7);
      gr.addColorStop(0, alpha(c.warning, 0.9 * level)); gr.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(hd.x, hd.y, hd.r * 1.7, 0, TAU); ctx.fill();
    }
    // the sound packets along the traced rays: a packet TON long, dimmer after each bounce
    ctx.save(); ctx.beginPath(); ctx.rect(hall.inner.x, hall.inner.y, hall.inner.w, hall.inner.h); ctx.clip();
    // each path drawn leg by leg, every leg whole from surface to surface: the legs finished in the last TRAIL px
    // of travel (dimmer with each bounce and with age), plus the packet on its current leg while the run lasts
    const sHead = V * tl, sTail = V * Math.max(0, tl - TON), col = c.s1, moving = tl < T_END;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const seg = (x0, y0, x1, y1, k) => {
      ctx.strokeStyle = alpha(col, 0.2 * k); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = alpha(col, 0.95 * k); ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    };
    for (const P of G.paths) {
      for (const L of P) {
        if (L.s1 <= sHead) {
          const age = sHead - L.s1;
          if (age < TRAIL) seg(L.a.x, L.a.y, L.b.x, L.b.y, L.e * (1 - age / TRAIL) ** 0.8);
          continue;
        }
        if (!moving || sHead <= L.s0) break;
        const s0 = Math.max(L.s0, sTail), k1 = (sHead - L.s0) / (L.s1 - L.s0), k0 = (s0 - L.s0) / (L.s1 - L.s0);
        const x1 = L.a.x + (L.b.x - L.a.x) * k1, y1 = L.a.y + (L.b.y - L.a.y) * k1;
        seg(L.a.x + (L.b.x - L.a.x) * k0, L.a.y + (L.b.y - L.a.y) * k0, x1, y1, L.e);
        ctx.fillStyle = alpha(lighten(col, 0.4), L.e); ctx.beginPath(); ctx.arc(x1, y1, 5, 0, TAU); ctx.fill();
        break;
      }
    }
    ctx.restore();
    // the traces
    if (!soft) {
      this.chart(ctx, c, { x: 70, y: 364, w: 560, h: 110, tau: bare.tau, tl, stops: true, tag: 'reverberation' });
    } else {
      this.chart(ctx, c, { x: 44, y: 364, w: 276, h: 110, tau: bare.tau, tl, title: 'bare', dim: true });
      this.chart(ctx, c, { x: 372, y: 364, w: 276, h: 110, tau: G.tau, tl, title: 'with panels' });
    }
    this.probeOut = { tl: +tl.toFixed(2), tauBare: +bare.tau.toFixed(2), tau: +G.tau.toFixed(2), level: +level.toFixed(3) };
  }

  level(tt, tau) {
    const rise = (u) => 1 - Math.exp(-u / 0.12);
    return tt < TON ? rise(tt) : rise(TON) * Math.exp(-(tt - TON) / tau);
  }

  chart(ctx, c, o) {
    const { x, y, w, h, tau, tl } = o, X = (s) => x + (s / T_END) * w, Y = (v) => y + h - v * (h - 8);
    ctx.save();
    rr(ctx, x - 8, y - 8, w + 16, h + 16, 10); ctx.fillStyle = c.raised; ctx.fill();
    ctx.strokeStyle = alpha(c.labelMuted, 0.25); ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x, y + (h * i) / 4); ctx.lineTo(x + w, y + (h * i) / 4); ctx.stroke(); }
    ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
    // source stops
    ctx.setLineDash([6, 6]); ctx.strokeStyle = alpha(c.label, 0.6); ctx.beginPath(); ctx.moveTo(X(TON), y); ctx.lineTo(X(TON), y + h); ctx.stroke(); ctx.setLineDash([]);
    // the trace up to now
    const col = o.dim ? mix(c.s1, c.labelMuted, 0.35) : c.s1, n = 120, end = Math.min(tl, T_END);
    ctx.beginPath(); ctx.moveTo(X(0), Y(0));
    for (let i = 0; i <= n; i++) { const s = (end * i) / n; ctx.lineTo(X(s), Y(this.level(s, tau))); }
    ctx.lineTo(X(end), Y(0)); ctx.closePath(); ctx.fillStyle = alpha(col, 0.18); ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const s = (end * i) / n, px = X(s), py = Y(this.level(s, tau)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.restore();
    if (o.stops) pill(ctx, c, 'source stops', X(TON) + 70, y - 24, { size: SIZE, bg: c.bgSurface });
    // above the tail, off the plot
    if (o.tag && tl > TON + 1.5) pill(ctx, c, o.tag, X(5.5), y - 24, { size: SIZE, display: true, bg: lighten(c.gold, 0.55) });
    if (o.title) pill(ctx, c, o.title, x + w - 70, y + 18, { size: SIZE, display: true, bg: o.dim ? c.bgSurface : lighten(c.gold, 0.55) });
  }
}
