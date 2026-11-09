// DomeScene.js - slide "The Whispering Gallery" (blk-l06-n02, 2 beats). New 2026-11-03.
// b0 the Gol Gumbaz dome in section (SoundArt drawDome) with depth added here: inner shade, faint
//    courses on the far half of the shell and the far half of the round gallery as an ellipse.
//    You whisper at the left end of the gallery; a friend listens at the right end. The whisper
//    runs round the gallery wall as a chain of chords (each meets the wall at the same small angle,
//    so angle in = angle out, central angle 2G per chord) both ways round. The plan circle is drawn
//    in perspective (squashed by K) at head height. Both ways meet at your friend after half a lap,
//    then again after every further full lap, dimmer each time: the ear glows and the count rises.
// b1 a concert hall (SoundArt drawHall) with a curved shell behind the performer. Rays from the
//    performer reflect off the shell (traced, angle in = angle out) and spread over all the seats.
//    Tag "curved shell" and a "?" only: the slide asks the question, the picture does not answer it.
// Both figures hold one pose (auto-reach off); nothing on them moves.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, alpha, mix, lighten, darken, clamp01 } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { drawDome, drawHall } from '../shared/SoundArt.js';

const W = 680, TAU = Math.PI * 2;
// b0 dome
// the floor sits below the frame: the dome itself fills the stage, the drum runs on out of the bottom edge
const DOME = { x: 340, y: 595, R: 315 };
const WALL_H = 0.55;                   // drawDome default wallH (in R): the gallery is this far above the floor
const K = 0.2;                         // perspective squash of the round gallery
const G = Math.PI / 14;                // grazing angle: 7 chords per half lap
const VW = 1250;                       // whisper speed on screen (px/s, in plan): three arrivals within about 3.3 s
const FIG_H = 104, HEAD_UP = 86;        // the whisper ring runs at head height above the ledge
const PKT = 70;                        // packet length (px, in plan)
// b1 hall
const HALL = { x: 20, y: 28, w: 640, h: 444 };
const SHELL = { R: 236, axis: 0.36, lo: 0.42, hi: 0.84 };   // the performer's mouth sits at its focus (R / 2 from the shell), so the reflected rays leave side by side
const VR = 330, T1 = 0.3;

export class DomeScene extends SimScene {
  static HEIGHT = 520;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'The great dome of the Gol Gumbaz in section, with its round gallery where the dome begins. You '
    + 'whisper at one side of the gallery; the whisper travels round the gallery close to the curved wall, reflecting '
    + 'many times, both ways round, and reaches your friend on the far side again and again: their ear glows at each '
    + 'arrival and the count goes up. Then a concert hall with a curved shell behind the stage: sound from the performer '
    + 'reflects off the shell and spreads out over all the seats, with a question mark.';

  constructor(container, config) {
    super(container, config);
    this.cache = null;
  }

  t() { return this.age; }
  busy() { return this.t() < (this.stage >= 1 ? this.hallEnd ?? 4 : this.domeEnd()); }

  domeGeo() {
    const r = DOME.R - DOME.R * 0.15, rho = r - 8, chord = 2 * rho * Math.sin(G), T = (7 * chord) / VW;
    return { r, rho, chord, T, cy: DOME.y - DOME.R * WALL_H };
  }
  domeEnd() { return 5 * this.domeGeo().T + 0.5; }

  draw(ctx, c) {
    if (this.stage >= 1) this.hall(ctx, c); else this.dome(ctx, c);
  }

  // ---------------------------------------------------------------- b0: the whispering gallery
  dome(ctx, c) {
    const g = this.domeGeo(), end = this.domeEnd(), a = this.t(), tl = a < end ? a : end;
    const { x, y } = DOME, cy = g.cy, r = g.r;
    // sky and ground outside
    const sky = ctx.createLinearGradient(0, 0, 0, y);
    sky.addColorStop(0, c.setSkyTop); sky.addColorStop(1, c.setSkyLow);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, y);
    ctx.fillStyle = mix(c.setGround, c.setSand, 0.3); ctx.fillRect(0, y, W, 520 - y);
    const d = drawDome(ctx, c, { ...DOME, depth: false });
    this.domeDepth(ctx, c, x, cy, r, y);
    // the whisper ring at head height: plan angle th -> screen
    const ry = cy - HEAD_UP;
    const P = (th) => ({ x: x + g.rho * Math.cos(th), y: ry - g.rho * Math.sin(th) * K });
    // chord paths (faint), with a tick where each chord meets the wall
    ctx.save(); ctx.lineCap = 'round';
    for (let j = 0; j < 14; j++) {
      const p = P(Math.PI - 2 * G * j), q = P(Math.PI - 2 * G * (j + 1)), far = j < 7;
      ctx.strokeStyle = alpha(c.s1, far ? 0.55 : 0.3); ctx.lineWidth = 2.6; ctx.setLineDash(far ? [] : [5, 6]);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = alpha(c.s1, far ? 0.55 : 0.3); ctx.beginPath(); ctx.arc(q.x, q.y, 2.6, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // two packets, one each way round
    const s = VW * tl, lapLen = 14 * g.chord;
    for (const sgn of [1, -1]) {
      for (let k = 0; k < 6; k++) {
        const s0 = s - PKT + (k / 6) * PKT, s1 = s - PKT + ((k + 1) / 6) * PKT;
        if (s1 <= 0) continue;
        const pa = this.ringAt(Math.max(0, s0), g, sgn, P), pb = this.ringAt(s1, g, sgn, P);
        const lap = Math.floor(Math.max(0, s1 - g.chord * 7) / lapLen + 1e-9), e = Math.pow(0.7, lap) * ((k + 1) / 6);
        ctx.strokeStyle = alpha(c.s1, 0.9 * e); ctx.lineWidth = 6.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        if (k === 5) { ctx.fillStyle = alpha(lighten(c.s1, 0.5), Math.pow(0.7, lap)); ctx.beginPath(); ctx.arc(pb.x, pb.y, 5.5, 0, TAU); ctx.fill(); }
      }
    }
    // people on the gallery
    const [gl, gr] = d.gallery;
    const youSpec = figureFor(this, { role: 'student', x: gl.x, y: cy, height: FIG_H, facing: 1, i: 3, pose: 'stand', autoReach: false, mood: 'smile' });
    const hd0 = solveFigure(youSpec).anchors.head;
    youSpec.hands = [{ x: hd0.x + hd0.r * 1.25, y: hd0.y + hd0.r * 0.55 }, null];   // a hand cupped beside the mouth
    const sk0 = drawFigure(ctx, c, youSpec);
    const mouth = { x: sk0.anchors.head.x + sk0.anchors.head.r * 1.05, y: sk0.anchors.head.y + sk0.anchors.head.r * 0.35 };
    if (tl < 1.2) drawSoundArcs(ctx, c, { x: mouth.x, y: mouth.y, dir: -0.1, spread: 1.0, n: 2, wavelength: 9, r0: 6, t: tl, strength: 0.6 * (1 - tl / 1.2) });
    // arrivals at the friend: half a lap, then every full lap
    const arrivals = [1, 3, 5].map((m) => m * g.T).filter((ta) => ta <= tl + 1e-6);
    const n = arrivals.length, lastA = n ? tl - arrivals[n - 1] : 99;
    const friend = figureFor(this, { role: 'student', x: gr.x, y: cy, height: FIG_H, facing: -1, i: 6, pose: 'stand', autoReach: false, mood: n ? 'happy' : 'smile' });
    const sk1 = drawFigure(ctx, c, friend);
    const hd = sk1.anchors.head, glow = n ? Math.max(0.6, 1 - lastA / 0.8) * Math.pow(0.85, n - 1) : 0;
    if (glow > 0) {
      const gg = ctx.createRadialGradient(hd.x, hd.y, 2, hd.x, hd.y, hd.r * 1.9);
      gg.addColorStop(0, alpha(c.warning, 0.75 * glow)); gg.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(hd.x, hd.y, hd.r * 1.9, 0, TAU); ctx.fill();
    }
    // the count shows from the second arrival on: the point is "many times", never "once"
    if (n >= 2) pill(ctx, c, `heard ${n} times`, gr.x - 50, cy - 150, { size: 28, display: true, bg: lighten(c.gold, 0.55) });
    pill(ctx, c, 'whisper', gl.x + 46, cy - 150, { size: 26, bg: c.raised });
    this.probeOut = { tl: +tl.toFixed(2), T: +g.T.toFixed(2), arrivals: n, glow: +glow.toFixed(2) };
  }

  /** Point at path length s along the chord chain (sgn 1: far side first, -1: near side first). */
  ringAt(s, g, sgn, P) {
    const j = Math.floor(s / g.chord), u = s / g.chord - j;
    const p = P(Math.PI - sgn * 2 * G * j), q = P(Math.PI - sgn * 2 * G * (j + 1));
    return { x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u };
  }

  /** Depth the plain section lacks: inner shade, far courses of the shell, the far gallery, niches. */
  domeDepth(ctx, c, x, cy, r, y) {
    const st = mix(c.labelMuted, c.gold, 0.25);
    ctx.save();
    ctx.beginPath(); ctx.arc(x, cy, r, Math.PI, TAU); ctx.lineTo(x + r, y); ctx.lineTo(x - r, y); ctx.closePath(); ctx.clip();
    const sh = ctx.createRadialGradient(x, cy + r * 0.2, r * 0.2, x, cy, r * 1.05);
    sh.addColorStop(0, alpha(lighten(c.gold, 0.6), 0.18)); sh.addColorStop(0.7, alpha(c.bgDeep, 0.06)); sh.addColorStop(1, alpha(c.bgDeep, 0.3));
    ctx.fillStyle = sh; ctx.fillRect(x - r, cy - r, 2 * r, y - cy + r);
    // far courses of the shell: horizontal rings seen from inside (upper halves of ellipses)
    ctx.strokeStyle = alpha(darken(st, 0.25), 0.28); ctx.lineWidth = 1.4;
    for (const ph of [0.3, 0.55, 0.8, 1.05, 1.3]) {
      const rx = r * Math.cos(ph), yy = cy - r * Math.sin(ph);
      ctx.beginPath(); ctx.ellipse(x, yy, rx, rx * K, 0, Math.PI, TAU); ctx.stroke();
    }
    // the oculus ring at the crown
    ctx.fillStyle = alpha(lighten(c.gold, 0.7), 0.35); ctx.beginPath(); ctx.ellipse(x, cy - r + 6, 22, 5, 0, 0, TAU); ctx.fill();
    // niches in the far drum wall
    for (const nx of [-0.6, -0.2, 0.2, 0.6]) {
      const px = x + nx * r, w = 26 * Math.sqrt(1 - nx * nx) + 8, top = cy + 54, bot = y - 26;
      ctx.fillStyle = alpha(c.bgDeep, 0.16);
      ctx.beginPath(); ctx.moveTo(px - w / 2, bot); ctx.lineTo(px - w / 2, top + w / 2); ctx.arc(px, top + w / 2, w / 2, Math.PI, TAU); ctx.lineTo(px + w / 2, bot); ctx.closePath(); ctx.fill();
      ctx.fillStyle = alpha(lighten(st, 0.6), 0.35); ctx.fillRect(px + w / 2 - 3, top + w / 2, 3, bot - top - w / 2);
    }
    // the far half of the round gallery: ledge band and railing posts
    const gx = r - r * 0.15 * 0.45;
    ctx.fillStyle = alpha(darken(st, 0.1), 0.45);
    ctx.beginPath(); ctx.ellipse(x, cy, r, r * K, 0, Math.PI, TAU); ctx.ellipse(x, cy + 10, gx, gx * K, 0, TAU, Math.PI, true); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = alpha(darken(st, 0.45), 0.55); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(x, cy - 16, gx, gx * K, 0, Math.PI, TAU); ctx.stroke();
    for (let i = 1; i < 24; i++) { const th = Math.PI + (i / 24) * Math.PI, px = x + gx * Math.cos(th), py = cy + gx * K * Math.sin(th); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 16); ctx.stroke(); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- b1: the curved shell
  shellPts(m) {
    const { R, axis, lo, hi } = SHELL, cx = m.x + R * 0.5 * Math.cos(axis), cyy = m.y + R * 0.5 * Math.sin(axis), pts = [];
    for (let i = 0; i <= 28; i++) { const an = Math.PI + axis - lo + ((lo + hi) * i) / 28; pts.push({ x: cx + R * Math.cos(an), y: cyy + R * Math.sin(an) }); }
    return pts;
  }

  hallRays(hall, mouth) {
    if (this.cache) return this.cache;
    const shell = this.shellPts(mouth), segs = [];
    for (let i = 0; i < shell.length - 1; i++) segs.push({ a: shell[i], b: shell[i + 1], kind: 'shell' });
    const fy = hall.floorY, x0 = hall.stage.x + hall.stage.w + 24, x1 = hall.inner.x + hall.inner.w - 8;
    const aud = { a: { x: x0, y: fy - 44 }, b: { x: x1, y: fy - 44 }, kind: 'audience' };
    segs.push(aud);
    // aim: sample the shell finely, trace each sample, then keep for every seat row the sample landing
    // nearest that row's seat, so each row (the back row included) gets its own ray and none bunch
    const castAll = [];
    for (let i = 0; i <= 160; i++) {
      const f = 1 + (i / 160) * (shell.length - 3), j = Math.floor(f), u = f - j;
      const aim = { x: shell[j].x + (shell[j + 1].x - shell[j].x) * u, y: shell[j].y + (shell[j + 1].y - shell[j].y) * u };
      const r = this.cast(mouth, Math.atan2(aim.y - mouth.y, aim.x - mouth.x), segs);
      if (r.hit && r.legs.length === 2) castAll.push(r);
    }
    const rays = [];
    for (const sx of this.seatXs(hall)) {
      let best = null;
      for (const r of castAll) if (!best || Math.abs(r.land.x - sx) < Math.abs(best.land.x - sx)) best = r;
      if (best && Math.abs(best.land.x - sx) < 40) rays.push(best);
    }
    this.cache = rays;
    this.hallEnd = T1 + Math.max(...rays.map((r) => r.len)) / VR + 0.6;
    return rays;
  }

  /** Seat x of each of the 7 rows (the rows drawHall lays out between stage and back wall). */
  seatXs(hall) {
    const sx1 = hall.stage.x + hall.stage.w, ix = hall.inner.x + hall.inner.w, step = (ix - 30 - sx1 - 70) / 6;
    return [0, 1, 2, 3, 4, 5, 6].map((i) => sx1 + 40 + i * step);
  }

  /** One ray from the mouth: off the shell (angle in = angle out) and on to the audience line. */
  cast(mouth, ang, segs) {
    {
      let p = mouth, dx = Math.cos(ang), dy = Math.sin(ang), legs = [], len = 0, last = null, hit = false;
      for (let n = 0; n < 2 && !hit; n++) {
        let best = null;
        for (const g of segs) {
          if (g === last) continue;
          const ex = g.b.x - g.a.x, ey = g.b.y - g.a.y, den = dx * ey - dy * ex;
          if (Math.abs(den) < 1e-9) continue;
          const tt = ((g.a.x - p.x) * ey - (g.a.y - p.y) * ex) / den, u = ((g.a.x - p.x) * dy - (g.a.y - p.y) * dx) / den;
          if (tt > 0.5 && u >= -0.001 && u <= 1.001 && (!best || tt < best.tt)) best = { tt, g };
        }
        if (!best) break;
        const q = { x: p.x + dx * best.tt, y: p.y + dy * best.tt };
        legs.push({ a: p, b: q, s0: len, s1: len + best.tt }); len += best.tt;
        if (best.g.kind === 'audience') { hit = true; break; }
        const g = best.g, L = Math.hypot(g.b.x - g.a.x, g.b.y - g.a.y), nx = -(g.b.y - g.a.y) / L, ny = (g.b.x - g.a.x) / L, dn = dx * nx + dy * ny;
        dx -= 2 * dn * nx; dy -= 2 * dn * ny; p = q; last = g;
      }
      return { legs, len, hit, land: hit ? legs[legs.length - 1].b : null };
    }
  }

  hall(ctx, c) {
    const a = this.t();
    ctx.fillStyle = mix(c.bgSurface, c.bgDeep, 0.06); ctx.fillRect(0, 0, W, 520);
    const hall = drawHall(ctx, c, { ...HALL, seats: 'cushioned', rows: 7 });
    // the performer on the stage, singing; the shell is placed from their mouth
    const stage = hall.stage, fx = stage.x + 124;
    const spec = figureFor(this, { role: 'adult', x: fx, y: stage.y, height: 118, facing: 1, i: 2, pose: 'stand', autoReach: false, mood: 'happy' });
    const h0 = solveFigure(spec).anchors.head, mouth = { x: h0.x + h0.r * 0.9, y: h0.y + h0.r * 0.4 };
    // the shell: a thick curved wooden panel with a lit inner face and ribs behind
    const pts = this.shellPts(mouth), wood = mix(c.s8, c.s2, 0.5);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const line = (w, col, dx = 0) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x + dx, p.y) : ctx.moveTo(p.x + dx, p.y))); ctx.stroke(); };
    ctx.strokeStyle = darken(wood, 0.35); ctx.lineWidth = 4;
    for (let i = 2; i < pts.length - 1; i += 5) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(hall.inner.x + 2, pts[i].y); ctx.stroke(); }
    line(16, darken(wood, 0.3), -3); line(12, wood); line(4, lighten(wood, 0.45), 4);
    ctx.restore();
    const rays = this.hallRays(hall, mouth), end = this.hallEnd, tl = a < end ? a : end;
    // three listeners seated in rows 2, 5 and 7 (front, middle, back), facing the stage
    const seats = this.seatXs(hall);
    [[1, 1], [4, 4], [6, 6]].forEach(([row, i]) => {
      const px = seats[row];
      drawFigure(ctx, c, figureFor(this, { role: 'student', pose: 'sit', x: px, y: hall.floorY - 4, seat: { x: px, y: hall.floorY - 30 }, height: 104, facing: -1, i, autoReach: false, mood: 'smile' }));
    });
    // rays from the performer: back to the shell, then out over the seats
    const s = Math.max(0, tl - T1) * VR;
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.rect(hall.inner.x, hall.inner.y, hall.inner.w, hall.inner.h); ctx.clip();
    for (const ray of rays) {
      for (const L of ray.legs) {
        if (s <= L.s0) break;
        const k = Math.min(1, (s - L.s0) / (L.s1 - L.s0)), bx = L.a.x + (L.b.x - L.a.x) * k, by = L.a.y + (L.b.y - L.a.y) * k;
        ctx.strokeStyle = alpha(c.s1, 0.2); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(L.a.x, L.a.y); ctx.lineTo(bx, by); ctx.stroke();
        ctx.strokeStyle = alpha(c.s1, 0.85); ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(L.a.x, L.a.y); ctx.lineTo(bx, by); ctx.stroke();
      }
      if (ray.hit && s >= ray.len) {
        const k = clamp01((s - ray.len) / (0.4 * VR)), p = ray.land;
        const gg = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 22);
        gg.addColorStop(0, alpha(c.warning, 0.8 * k)); gg.addColorStop(1, alpha(c.warning, 0));
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
    drawFigure(ctx, c, spec);
    drawSoundArcs(ctx, c, { x: mouth.x + 2, y: mouth.y, dir: 0, spread: 1.0, n: 2, wavelength: 14, r0: 8, t: tl, strength: 0.5 });
    const top = pts[pts.length - 1];
    pill(ctx, c, 'curved shell', top.x + 16, top.y - 8, { size: 28, display: true, align: 'left', bg: lighten(c.gold, 0.55) });
    pill(ctx, c, '?', 560, 140, { size: 48, display: true, bg: c.raised });
    this.probeOut = { tl: +tl.toFixed(2), seats: this.seatXs(hall).map(Math.round), lands: rays.map((r) => (r.land ? Math.round(r.land.x) : null)) };
  }
}
