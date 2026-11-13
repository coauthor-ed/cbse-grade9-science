/**
 * BallThrowScene - slide "A ball thrown up" (blk-l02-s5, 2 beats; Fig 4.5, Table 4.1).
 * A ball is thrown straight up from O, rises to B (140 cm) and falls back to O. The up and
 * down paths are drawn as two dashed lanes side by side only for clarity (as the book does).
 * Height follows a real throw: h(tau) = 140 (1 - (1 - tau)^2) for tau = 0..2 (tau = 1 at the top),
 * played in THROW screen seconds. A = 40 cm on the up lane, C = 80 cm on the down lane.
 * b0: the vertical scale 0..140 cm, the two lanes, points A, B, C; the ball goes up and down once, rests at O.
 * b1: the throw replays; the path it has travelled lights up as a ribbon, and a 4-row table
 *     (point, distance, displacement) fills one row as the ball passes A, B, C and O.
 * Frames depend on beat and age only. ASCII only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, alpha, darken, lighten, font, popAt, clamp01, rr } from 'simulations/base/kit/SimLook.js';
import { drawScale } from 'simulations/base/kit/SimTrack.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { drawGround, propRig } from 'simulations/base/kit/SimProps.js';

const GO = 0.6;          // s of stillness before the throw
const THROW = 2.6;       // screen s for the whole up-and-down
const R = 17;            // ball radius
const Y0 = 448, Y1 = 118; // scale: 0 cm and 140 cm
const TOP = 140;
const tauOf = (h, down) => (down ? 1 + Math.sqrt(1 - h / TOP) : 1 - Math.sqrt(1 - h / TOP));
const PTS = [
  { L: 'A', h: 40, tau: tauOf(40, false), lane: 0, dist: '40 cm', disp: '40 cm up' },
  { L: 'B', h: 140, tau: 1, lane: 0.5, dist: '140 cm', disp: '140 cm up' },
  { L: 'C', h: 80, tau: tauOf(80, true), lane: 1, dist: '200 cm', disp: '80 cm up' },
  { L: 'O', h: 0, tau: 2, lane: 1, dist: '280 cm', disp: '0 cm' },
];
const smooth = (u) => { const k = clamp01(u); return k * k * (3 - 2 * k); };
const yOf = (h) => Y0 + (h / TOP) * (Y1 - Y0);

export class BallThrowScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'A ball is thrown straight up from O beside a scale in centimetres. It rises past A at 40 cm to B at 140 cm and falls back past C at 80 cm to O. The up and down paths are drawn side by side only for clarity. A table fills in: at A the distance is 40 cm and the displacement 40 cm up; at B 140 cm and 140 cm up; at C 200 cm and 80 cm up; back at O 280 cm and 0 cm.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }
  isSetup() { return this.hostRole === 'setup' || this.cur === Number.MAX_SAFE_INTEGER; }
  busy() { return this.age < GO + THROW + 0.9; }

  /** Layout: b0 centres the lanes; b1 moves them left to make room for the table. */
  lay() {
    return this.cur === 1 ? { sx: 108, up: 176, dn: 230 } : { sx: 214, up: 330, dn: 410 };
  }

  tau() { return clamp01((this.age - GO) / THROW) * 2; }
  heightAt(t) { return TOP * (1 - (1 - t) * (1 - t)); }
  xAt(t, L) { return L.up + (L.dn - L.up) * smooth((t - 0.84) / 0.32); }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const L = this.lay(), t = this.tau(), table = this.cur === 1 && !this.isSetup();

    // Ground under O.
    drawGround(ctx, c, propRig({ x0: 24, x1: table ? 286 : 656, groundY: Y0 + R }), { kind: 'solid' });

    drawScale(ctx, c, { at: L.sx, p0: Y0, p1: Y1, from: 0, to: TOP, every: 20, unit: 'cm', side: -1 });

    this.lanes(ctx, c, L);
    if (table) this.trace(ctx, c, L, t);
    this.points(ctx, c, L);

    // Direction words under the lanes.
    this.say(ctx, c, 'up', L.up, Y0 + R + 40, { col: c.labelMuted, size: 26 });
    this.say(ctx, c, 'down', L.dn + 8, Y0 + R + 40, { col: c.labelMuted, size: 26 });

    // The ball.
    const h = this.heightAt(t);
    drawBall(ctx, c, { x: this.xAt(t, L), y: yOf(h), r: R, tone: 6 });

    if (table) this.table(ctx, c);
  }

  /** The two dashed lanes and the short join at the top. */
  lanes(ctx, c, L) {
    ctx.save();
    ctx.strokeStyle = alpha(c.labelMuted, 0.8); ctx.lineWidth = 3; ctx.setLineDash([10, 9]); ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(L.up, Y0); ctx.lineTo(L.up, Y1); ctx.lineTo(L.dn, Y1); ctx.lineTo(L.dn, Y0);
    ctx.stroke();
    ctx.restore();
  }

  /** The path travelled so far, as a ribbon over the lanes (sampled from the same h(tau)). */
  trace(ctx, c, L, t) {
    if (t <= 0) return;
    const col = c.s7, path = () => {
      ctx.beginPath();
      const n = Math.max(2, Math.ceil(t / 0.02));
      for (let i = 0; i <= n; i++) {
        const u = (t * i) / n, x = this.xAt(u, L), y = yOf(this.heightAt(u));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = darken(col, 0.38); ctx.lineWidth = 14; ctx.stroke();
    path(); ctx.strokeStyle = col; ctx.lineWidth = 10; ctx.stroke();
    ctx.save(); ctx.translate(-2, 0); path(); ctx.strokeStyle = alpha(lighten(col, 0.5), 0.8); ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    ctx.restore();
  }

  /** Point dots on the lanes and their letter plates. */
  points(ctx, c, L) {
    for (const p of PTS.slice(0, 3)) {
      const x = p.lane === 0 ? L.up : p.lane === 1 ? L.dn : (L.up + L.dn) / 2, y = yOf(p.h);
      ctx.save();
      ctx.fillStyle = darken(c.s8, 0.35); ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.s8; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const px = p.lane === 0 ? x - 36 : p.lane === 1 ? x + 36 : x, py = p.lane === 0.5 ? y - 34 : y;
      this.plate(ctx, c, p.L, px, py);
    }
  }

  plate(ctx, c, letter, x, y) {
    const s = 17;
    ctx.save();
    ctx.fillStyle = alpha(c.label, 0.35); rr(ctx, x - s, y - s + 3, 2 * s, 2 * s, 7); ctx.fill();
    ctx.fillStyle = c.bgSurface; rr(ctx, x - s, y - s, 2 * s, 2 * s, 7); ctx.fill();
    ctx.strokeStyle = darken(c.s8, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.font = font(c, 800, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = c.label; ctx.fillText(letter, x, y + 1);
    ctx.restore();
  }

  /** Table 4.1: header + one row per point, each appearing as the ball passes it. */
  table(ctx, c) {
    const x0 = 294, x1 = 672, cols = [x0 + 26, x0 + 116, x0 + 278], y0 = 104, rowH = 58;
    ctx.save();
    // Panel: surface, rim, a light top band.
    ctx.fillStyle = alpha(c.label, 0.18); rr(ctx, x0, y0 + 4, x1 - x0, rowH * 5 + 8, 14); ctx.fill();
    ctx.fillStyle = c.bgSurface; rr(ctx, x0, y0, x1 - x0, rowH * 5 + 8, 14); ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.45); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
    const hy = y0 + rowH / 2 + 4;
    this.say(ctx, c, 'Distance', cols[1], hy, { size: 26, col: c.s7ink });
    this.say(ctx, c, 'Displacement', cols[2], hy, { size: 26, col: c.s4ink ?? c.label });
    ctx.save(); ctx.strokeStyle = alpha(c.label, 0.3); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 + 10, y0 + rowH + 4); ctx.lineTo(x1 - 10, y0 + rowH + 4); ctx.stroke(); ctx.restore();
    PTS.forEach((p, i) => {
      const pop = popAt(this.age, GO + (p.tau / 2) * THROW);
      if (pop === null) return;
      const y = y0 + rowH * (i + 1) + rowH / 2 + 4, a = pop?.alpha ?? 1;
      this.say(ctx, c, p.L, cols[0], y, { size: 26, alpha: a });
      this.say(ctx, c, p.dist, cols[1], y, { size: 26, alpha: a, weight: 700 });
      this.say(ctx, c, p.disp, cols[2], y, { size: 26, alpha: a, weight: 700 });
    });
  }

  say(ctx, c, text, x, y, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(c, o.weight ?? 800, o.size ?? 26, true); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.strokeStyle = alpha(c.bgSurface, 0.9); ctx.lineWidth = 7; ctx.strokeText(text, x, y);
    ctx.fillStyle = o.col ?? c.label; ctx.fillText(text, x, y);
    ctx.restore();
  }
}
