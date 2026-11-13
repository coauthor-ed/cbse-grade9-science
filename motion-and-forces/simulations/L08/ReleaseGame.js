/**
 * ReleaseGame - mini-game blk-l08-game. The MarbleRing top view (polished table, tape ring, glass
 * marble running round inside it, clockwise, one round in 5 s at a steady speed) and a cup on the
 * table outside the ring. "Lift the ring" (button, Space or Enter on the board): the ring lifts away
 * and the marble goes on in a straight line, at the same speed, along the tangent at the point where
 * it was when the ring lifted. The tangent and the release point are drawn.
 *   hit   the marble rolls into the cup, the cup lights, Quill hops; Next goal.
 *   miss  it rolls on to the table edge; the release point and its tangent stay drawn (faint, dashed,
 *         during the next try); one hint line; Try again.
 * Rounds from a fixed list: the cup below right, below left, then far right (the release is on the
 * far side of the ring, at its top). Tolerance about 14 degrees of release window. Won after round 3.
 * Drawing borrows MarbleRingScene's table, ring, hand and marble (its prototype methods) so the
 * game has the L08 look. Positions come from the clock and the lift time only. ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, clamp01, inOutSine, alpha, darken, lighten, mix } from 'simulations/base/kit/SimLook.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawTag } from '../shared/MotionGraph.js';
import { MarbleRingScene } from './MarbleRingScene.js';

const LOOK = MarbleRingScene.prototype;          // table, ring, hand, marble, trail (no scene state used)
const TAU = Math.PI * 2;
const SX = 210, SY = 262;                        // where MarbleRingScene puts its ring centre
const RP = 103, MR = 15;                         // RP: the marble's path radius, as in the scene
const PERIOD = 5, OMEGA = TAU / PERIOD, V = RP * OMEGA;
const TOL = 7 * Math.PI / 180;                   // half the release window
const LIFT = 0.7;
const WHERE = ['the cup below, on the right', 'the cup below, on the left', 'the cup far away, on the right'];
const NR = WHERE.length;
/* Two boards. tall (phones, portrait): the scene's own table. wide (landscape): a long low table, so
   the whole board stays above the 1280x720 fold; the scene's table drawing is stretched onto it. */
const GEOS = {
  tall: { W: 680, H: 520, OX: 262, OY: 262, T: null, cups: [[486, 448], [84, 438], [604, 104]] },
  wide: { W: 900, H: 412, OX: 300, OY: 196, T: { x: 14, y: 14, w: 872, h: 364, edge: 26 }, cups: [[610, 330], [92, 336], [816, 72]] },
};
for (const g of Object.values(GEOS)) {
  const t = g.T || { x: 14, y: 18, w: 652, h: 462 };
  g.EDGE = { x0: t.x + MR + 6, y0: t.y + MR + 6, x1: t.x + t.w - MR - 6, y1: t.y + t.h - MR - 6 };
  g.ROUNDS = g.cups.map(([gx, gy], i) => ({ gx, gy, where: WHERE[i] }));
}
const wrap = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const onCircle = (th, G) => ({ x: G.OX + RP * Math.cos(th), y: G.OY + RP * Math.sin(th) });

/** Ideal release angle, hit radius and start angle for a round. */
function solve(r, G) {
  const dx = r.gx - G.OX, dy = r.gy - G.OY, d = Math.hypot(dx, dy), phi = Math.atan2(dy, dx);
  const ideal = wrap(phi - Math.acos(RP / d));
  return { ideal, hitR: Math.sqrt(d * d - RP * RP) * Math.sin(TOL), cupR: 27, start: wrap(ideal - Math.PI * 1.1) };
}

/** Where a marble released at th goes: hit or not, and the length of its straight run. */
function flight(r, th, G) {
  const p = onCircle(th, G), dir = { x: -Math.sin(th), y: Math.cos(th) }, g = solve(r, G), EDGE = G.EDGE;
  const gx = r.gx - p.x, gy = r.gy - p.y, along = gx * dir.x + gy * dir.y, off = Math.abs(gx * dir.y - gy * dir.x);
  const hit = along > 0 && off <= g.hitR;
  let s = Infinity;
  for (const [v, lo, hi, pv] of [[dir.x, EDGE.x0, EDGE.x1, p.x], [dir.y, EDGE.y0, EDGE.y1, p.y]]) {
    if (v > 1e-6) s = Math.min(s, (hi - pv) / v); else if (v < -1e-6) s = Math.min(s, (lo - pv) / v);
  }
  return { p, dir, hit, s: hit ? along : Math.max(0, s), late: wrap(th - g.ideal) > 0 };
}

const CSS = `
.gm.rg { gap: 6px; }
.rg .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.rg .play { display: grid; grid-template-columns: 540px minmax(0, 1fr); gap: 18px; align-items: start; flex: 1; min-height: 0; }
.rg .board { border-radius: var(--sim-radius-lg, 12px); }
.rg .board:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.rg canvas { display: block; width: 100%; height: auto; }
.rg .side { display: flex; flex-direction: column; gap: 10px; min-width: 0; max-width: 500px; margin-top: 8px; padding: 12px 14px;
            background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); }
.rg .goal { margin: 0; font: 800 20px/1.25 var(--sim-font-display); }
.rg .acts { display: flex; gap: 12px; align-items: center; }
.rg .acts .tap { flex: 0 0 auto; min-width: 190px; display: flex; align-items: center; justify-content: center; }
.rg .why { margin: 0; min-height: 44px; font-size: 16px; line-height: 1.3; font-weight: 700; }
.rg .why[data-k="bad"] { color: var(--sim-bad); }
.rg .acts .rg-next { display: none; }
.rg[data-st="hit"] .acts .rg-lift, .rg[data-st="miss"] .acts .rg-lift, .rg[data-st="done"] .acts .rg-lift { display: none; }
.rg[data-st="hit"] .acts .rg-next, .rg[data-st="miss"] .acts .rg-next, .rg[data-st="done"] .acts .rg-next { display: flex; }
.rg[data-st="fly"] .rg-lift { opacity: 0.55; pointer-events: none; }
.sim-dom-root--portrait .rg .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .rg .side { margin-top: 0; padding: 10px; max-width: none; }
.sim-dom-root--portrait .rg .goal { font-size: 18px; }
.sim-dom-root--portrait .rg .acts { flex-direction: column; align-items: stretch; }
.sim-dom-root--portrait .rg .acts .tap { min-width: 0; }
.sim-dom-root--portrait .rg .why { font-size: 15px; }
`;

export class ReleaseGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'A marble runs round inside a ring. Tap to lift the ring at the right moment, so that the marble goes straight into the goal.' } };
  static ARIA_LABEL = 'Top view of a smooth table with a tape ring on it. A glass marble runs round inside the ring, clockwise, at a steady speed. A cup stands on the table outside the ring. Press Lift the ring, or Space on the board: the ring lifts away and the marble rolls on in a straight line, along the tangent at the point where it was. Get it into the cup. Three cups.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false, onResize: () => { this._syncGeo(); this._render(); this._paint(performance.now()); },
      html: `<div class="gm rg"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="board" tabindex="0" role="img" aria-label="The table, the ring and the cup. Press Space to lift the ring."><canvas aria-hidden="true"></canvas></div>
        <div class="side"><p class="goal"></p>
        <div class="acts"><div class="tap btn gm-check rg-lift" role="button" tabindex="0">Lift the ring</div>
        <div class="tap btn rg-next" role="button" tabindex="0">Try again</div></div>
        <p class="why" aria-live="polite"></p></div></div></div>`,
    });
    const lift = this.root.querySelector('.rg-lift'), next = this.root.querySelector('.rg-next'), board = this.root.querySelector('.board');
    if (lift) onTap(lift, () => this._lift());
    if (next) onTap(next, () => this._next());
    board?.addEventListener('keydown', (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (this._st === 'run') this._lift(); else if (this._st !== 'fly') this._next();
    });
    this._syncGeo();
    this._render();
    const loop = (now) => { this._advance(now); this._paint(now); this._raf = requestAnimationFrame(loop); };
    this._raf = requestAnimationFrame(loop);
  }

  /** The board for the current layout (wide in landscape, tall in portrait). */
  _geo() {
    const cv = this.root?.querySelector?.('canvas');
    const portrait = !!(cv?.closest?.('.sim-dom-root--portrait') || this.root?.classList?.contains?.('sim-dom-root--portrait'));
    return portrait ? GEOS.tall : GEOS.wide;
  }

  /** On a layout change mid-round, start the round again on the new board. */
  _syncGeo() {
    const g = this._geo();
    if (g === this._G) return;
    this._G = g;
    if (this._st === 'done') return;
    this._prev = null; this._load();
  }

  _reset() { this._G = this._geo(); this._round = 0; this._prev = null; this._load(); }

  _load() {
    const g = solve(this._rd(), this._G);
    this._st = 'run'; this._line = ''; this._rel = null;
    this._t0 = performance.now(); this._th0 = g.start;
  }

  _rd() { const R = this._G.ROUNDS; return R[Math.min(this._round, R.length - 1)]; }
  _ideal() { return solve(this._rd(), this._G).ideal; }
  _angle(now) { return this._th0 + OMEGA * (now - this._t0) / 1000; }

  /** Lift the ring now (th: force the marble to that angle first; used by the test steps). */
  _lift(th) {
    if (this._st !== 'run') return;
    const now = performance.now();
    if (th != null) { this._th0 = th; this._t0 = now; }
    const at = wrap(this._angle(now));
    this._rel = { th: at, t: now, f: flight(this._rd(), at, this._G) };
    this._st = 'fly'; this._line = '';
    this._render();
  }

  _advance(now) {
    if (this._st !== 'fly' || !this._rel) return;
    const r = this._rel, run = (now - r.t) / 1000;
    if (run * V < r.f.s || run < LIFT) return;
    if (r.f.hit) {
      this._st = this._round >= NR - 1 ? 'done' : 'hit';
      this._line = 'In! It left along the tangent at the point where you lifted the ring.';
      this._prev = null;
      this._cheer();
      if (this._st === 'done') { this._round = NR; finishGame(this); }
    } else {
      this._st = 'miss';
      this._line = `It leaves along the tangent where you lift. Lift ${r.f.late ? 'earlier' : 'later'}.`;
      this._prev = { th: r.th, s: r.f.s };
    }
    this._render();
  }

  /** The find: once per cup, from the hit branch only. */
  _cheer() { this.quill?.perform('hop'); }

  _next() {
    if (this._st === 'fly' || this._st === 'run') return;
    if (this._st === 'done') { this._reset(); }
    else if (this._st === 'hit') { this._round += 1; this._load(); }
    else this._load();
    this._render();
  }

  _render() {
    const root = this.root, g = root?.querySelector('.gm');
    if (!g) return;
    const done = this._round >= NR;
    g.dataset.st = this._st;
    root.querySelector('.sub').textContent = done ? 'All three cups done.' : `Cup ${this._round + 1} of 3`;
    root.querySelector('.goal').textContent = done ? 'The marble always left along the tangent.' : `Aim for ${this._rd().where}.`;
    const next = root.querySelector('.rg-next');
    if (next) next.textContent = this._st === 'done' ? 'Play again' : this._st === 'hit' ? 'Next cup' : 'Try again';
    const w = root.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._st === 'miss' ? 'bad' : 'good';
    this.relayout?.();
  }

  _ctx(cv) {
    const { W, H } = this._G;
    const css = cv.clientWidth || W, dpr = Math.min(2, window.devicePixelRatio || 1), k = css / W * dpr;
    const bw = Math.round(W * k), bh = Math.round(H * k);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    cv.style.aspectRatio = `${W} / ${H}`;
    const ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, W, H);
    return ctx;
  }

  _paint(now) {
    const cv = this.root?.querySelector('canvas');
    if (!cv) return;
    const G = this._G, { OX, OY } = G;
    const c = loadColors(this.root), ctx = this._ctx(cv), r = this._rd(), g = solve(r, G);
    if (G.T) {                                            // the scene's table (14, 18, 652 x 462 + 26) stretched onto ours
      ctx.save(); ctx.translate(G.T.x, G.T.y); ctx.scale(G.T.w / 652, (G.T.h + G.T.edge) / 488); ctx.translate(-14, -18);
      LOOK.table.call(LOOK, ctx, c); ctx.restore();
    } else LOOK.table.call(LOOK, ctx, c);
    const rel = this._st === 'run' ? null : this._rel;
    const run = rel ? (now - rel.t) / 1000 : 0, lift = rel ? inOutSine(clamp01(run / LIFT)) : 0;
    const won = rel && rel.f.hit && (this._st === 'hit' || this._st === 'done');
    this._cup(ctx, c, r.gx, r.gy, g.cupR, won ? 1 : 0);
    // the last miss, faint and dashed, while the learner tries again
    if (!rel && this._prev) this._tangent(ctx, c, this._prev.th, this._prev.s, 0.45, true);
    if (rel) {
      const ghost = clamp01((run - 0.2) / 0.5);
      if (ghost > 0) {
        ctx.save(); ctx.globalAlpha = 0.55 * ghost; ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 2.5; ctx.setLineDash([8, 9]);
        ctx.beginPath(); ctx.arc(OX, OY, RP, 0, TAU); ctx.stroke(); ctx.restore();
      }
    }
    ctx.save(); ctx.translate(OX - SX, OY - SY); LOOK.ring.call(LOOK, ctx, c, lift); ctx.restore();
    if (rel) this._tangent(ctx, c, rel.th, rel.f.s, clamp01((run - 0.1) / 0.5), false);
    // the marble
    let p, ang, sink = 0;
    if (!rel) {
      const th = this._angle(now);
      ctx.save(); ctx.translate(OX - SX, OY - SY); LOOK.trail.call(LOOK, ctx, c, th, 0.8); ctx.restore();
      p = onCircle(th, G); ang = th + Math.PI / 2;
    } else {
      const f = rel.f, s = Math.min(run * V, f.s);
      p = { x: f.p.x + f.dir.x * s, y: f.p.y + f.dir.y * s }; ang = Math.atan2(f.dir.y, f.dir.x);
      if (f.hit && s >= f.s) {                              // into the cup: the last few px to its centre, then it sinks
        const k = inOutSine(clamp01((run - f.s / V) / 0.3));
        p = { x: p.x + (r.gx - p.x) * k, y: p.y + (r.gy - p.y) * k }; sink = k;
      }
    }
    if (sink > 0) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1 - 0.22 * sink, 1 - 0.22 * sink); ctx.translate(-p.x, -p.y);
      LOOK.marble.call(LOOK, ctx, c, p.x, p.y); ctx.restore();
    } else {
      LOOK.marble.call(LOOK, ctx, c, p.x, p.y);
      const moving = !rel || run * V < rel.f.s;
      if (moving) drawMotionArrow(ctx, c, 'v', p.x + Math.cos(ang) * (MR + 2), p.y + Math.sin(ang) * (MR + 2), { length: 70, angle: ang, label: 'v', side: -1 });
    }
    ctx.save(); ctx.translate(OX - SX, OY - SY); LOOK.hand.call(LOOK, ctx, c, lift); ctx.restore();
  }

  /** The tangent at a release point (both ways), the release ring, and the "tangent" tag. */
  _tangent(ctx, c, th, s, k, faint) {
    if (k <= 0) return;
    const { OX, OY } = this._G, p = onCircle(th, this._G), d = { x: -Math.sin(th), y: Math.cos(th) }, back = 120 * k, fwd = (s + 50) * k;
    ctx.save(); ctx.globalAlpha = faint ? k : 1; ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 3; ctx.lineCap = 'round';
    if (faint) ctx.setLineDash([9, 9]);
    ctx.beginPath(); ctx.moveTo(p.x - d.x * back, p.y - d.y * back); ctx.lineTo(p.x + d.x * fwd, p.y + d.y * fwd); ctx.stroke();
    ctx.setLineDash([]); ctx.strokeStyle = c.annot; ctx.lineWidth = 3.5; ctx.globalAlpha = faint ? k : clamp01(k * 2);
    ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, TAU); ctx.stroke();
    ctx.restore();
    if (!faint && k > 0.6) {
      const n = { x: d.y, y: -d.x }, side = (p.x - d.x * 80 + n.x * 60 - OX) ** 2 + (p.y - d.y * 80 + n.y * 60 - OY) ** 2 > (RP + 70) ** 2 ? 1 : -1;
      drawTag(ctx, c, 'tangent', p.x - d.x * 80 + side * n.x * 60, p.y - d.y * 80 + side * n.y * 60, { alpha: clamp01((k - 0.6) / 0.4), col: c.labelMuted });
    }
  }

  /** A small cup from above: a rim, a dark mouth with its inner shade; glows when the marble is in. */
  _cup(ctx, c, x, y, R, glow) {
    const body = mix(c.s5, c.bgSurface, 0.2);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x + 6, y + 8, R + 9, R + 7, 0.4, 0, TAU); ctx.fillStyle = alpha(darken(c.stroke, 0.4), 0.3); ctx.fill();
    if (glow > 0) {
      ctx.beginPath(); ctx.arc(x, y, R + 22, 0, TAU); ctx.fillStyle = alpha(c.good, 0.22 * glow); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x, y, R + 8, 0, TAU);
    const g = ctx.createRadialGradient(x - 8, y - 9, 2, x, y, R + 8);
    g.addColorStop(0, lighten(body, 0.45)); g.addColorStop(1, darken(body, 0.12));
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = glow > 0 ? c.good : darken(body, 0.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU);
    const m = ctx.createRadialGradient(x + 5, y + 6, 2, x, y, R);
    m.addColorStop(0, darken(body, 0.35)); m.addColorStop(1, darken(body, 0.62));
    ctx.fillStyle = m; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, R - 2, Math.PI * 1.0, Math.PI * 1.6); ctx.strokeStyle = alpha(darken(body, 0.75), 0.6); ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R + 4, Math.PI * 1.1, Math.PI * 1.55); ctx.strokeStyle = alpha(lighten(body, 0.8), 0.8); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    if (glow > 0) { ctx.beginPath(); ctx.arc(x, y, R + 13, 0, TAU); ctx.strokeStyle = c.good; ctx.lineWidth = 4; ctx.stroke(); }
    ctx.restore();
  }

  checkObjective() { return this._round >= NR ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
