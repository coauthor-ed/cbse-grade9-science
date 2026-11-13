/**
 * SoftCatchGame - mini-game blk-l13-n06. The CatchScene look: a ball comes from the left, the fielder (she)
 * stands at the right facing it, hands together in front. The StopTime way of showing the idea: the
 * "time to stop" bar first, the force second (an F arrow on the ball from her hands, inverse in the stop
 * time on one scale per round, and a force meter with a "safe limit" line). Under her hands a ruler
 * shows how far they can move back (arm's length, 0.6 m) and how far this catch needs (v t / 2).
 * Pick a stop-time chip: bar, meter, arrow and ruler preview it; the panel shows F = m x v / t and the
 * hands' move-back distance. Check: the catch plays in slow motion (a 160 px flight at the ball's speed,
 * then a uniform stop over the chosen time; flight and stop slowed down SLOW times alike). Too long a time: the hands stop at arm's length and
 * the ball, not yet stopped, runs on into her body.
 *   win    F below the limit AND distance within reach: Quill hops once; Next round.
 *   miss   one hint line (force above the limit / hands cannot move back that far); pick again.
 * Rounds from a fixed list (exactly one chip wins each; _answers() lists the winners):
 *   1 cricket ball 0.16 kg at 20 m/s, limit 100 N: 0.01 s 320 N | 0.04 s 80 N, 0.4 m | 0.1 s 1.0 m
 *   2 tennis ball 0.06 kg at 20 m/s, limit 40 N:  0.01 s 120 N | 0.05 s 24 N, 0.5 m | 0.1 s 1.0 m
 *   3 football 0.4 kg at 10 m/s, limit 50 N:      0.02 s 200 N | 0.1 s 40 N, 0.5 m  | 0.2 s 1.0 m
 * No hint at landing. Won after round 3 (finishGame). Keys: 1 2 3 pick a chip; Enter checks (Enter or
 * Space on a focused chip picks it). Test hooks: _pick(t), _go() (Check / Next round / Play again),
 * _state(), _answers(). Frames depend on the round, the pick and the age of the check only. ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, clamp01, inOutSine, alpha, darken, font, rr } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';
import { drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawBall } from 'simulations/base/kit/SimApparatus.js';
import { drawField } from '../shared/ForceCast.js';
import { drawTag } from '../shared/MotionGraph.js';
import { drawStopBar, stopForceLen } from '../shared/StopTime.js';
import { CatchScene } from './CatchScene.js';

const LOOK = CatchScene.prototype;                 // cricketBall
const W = 680, H = 296, GY = 262, FX = 612, FH = 226;
const H0 = { x: 514, y: 140 }, PXM = 118, REACH = 0.6;   // catch point (palms), px per metre, arm's length (m)
const FLY = 160, T0 = 0.2, SLOW = 8, F_LEN = 70;            // flight px (starts right of the meter), launch age, slow-motion factor, arrow px at the winning time
const BAR = { x: 24, y: 36, w: 236 }, METER = { x: 24, y: 112, w: 236, h: 22 };
// phone (portrait): a taller board; the bar and the meter go full width above the catch, text 26
const LAND = { H, dy: 0, bar: BAR, meter: METER, fs: 22 };
const PORT = { H: 476, dy: 180, bar: { x: 24, y: 44, w: 420 }, meter: { x: 24, y: 128, w: 420, h: 28 }, fs: 26 };
const ROUNDS = [
  { ball: 'cricket', name: 'Cricket ball', m: 0.16, v: 20, limit: 100, chips: [0.01, 0.04, 0.1], r: 15 },
  { ball: 'tennis', name: 'Tennis ball', m: 0.06, v: 20, limit: 40, chips: [0.01, 0.05, 0.1], r: 14, tone: 4 },
  { ball: 'football', name: 'Football', m: 0.4, v: 10, limit: 50, chips: [0.02, 0.1, 0.2], r: 22, tone: 8 },
];
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const num = (v) => String(Math.round(v * 1000) / 1000);
/** Force (N) and hands' move-back distance (m) for stop time t in round r. */
const catchOf = (r, t) => ({ F: r.m * r.v / t, d: r.v * t / 2 });
const wins = (r, t) => { const k = catchOf(r, t); return k.F < r.limit && k.d <= REACH + 1e-9; };

const CSS = `
.gm.sc { gap: 6px; }
.sc .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.sc .play { display: grid; grid-template-columns: 520px minmax(0, 1fr); gap: 18px; align-items: start; flex: 1; min-height: 0; }
.sc canvas { display: block; width: 100%; height: auto; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; }
.sc .side { display: flex; flex-direction: column; gap: 6px; min-width: 0; max-width: 460px; margin-top: 4px; padding: 10px 14px;
            background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); }
.sc .goal { margin: 0; font: 800 19px/1.25 var(--sim-font-display); }
.sc .goal b { color: var(--sim-series-3-ink); }
.sc .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.sc .chips { display: flex; gap: 8px; align-items: center; }
.sc .chips .name { font-size: 16px; font-weight: 800; white-space: nowrap; margin-right: 2px; }
.sc .chips .tap { min-width: 76px; height: 48px; padding: 0 8px; display: flex; align-items: center; justify-content: center; font: 800 18px/1 var(--sim-font); font-variant-numeric: tabular-nums; }
.sc .chips .tap[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 2px; background: var(--sim-bg-deep); }
.sc .live { margin: 0; font-size: 16px; font-weight: 800; line-height: 1.3; }
.sc .live:empty { display: none; }
.sc .acts { display: flex; gap: 12px; align-items: center; }
.sc .acts .tap { flex: 0 0 auto; min-width: 112px; display: flex; align-items: center; justify-content: center; }
.sim-dom-root:not(.sim-dom-root--portrait) .sc .acts .tap { font-size: 18px; }
.sc .row .gm-check { width: auto; min-width: 120px; }
.sc .why { margin: 0; font-size: 16px; line-height: 1.3; font-weight: 700; }
.sc .why:empty { display: none; }
.sc .why[data-k="bad"] { color: var(--sim-bad); }
.sc[data-done="1"] .chips .tap { opacity: 0.45; pointer-events: none; }
.sim-dom-root--portrait .sc .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .sc .side { margin-top: 0; padding: 10px; max-width: none; }
.sim-dom-root--portrait .sc .goal { font-size: 17px; }
.sim-dom-root--portrait .sc .chips .name { display: none; }
.sim-dom-root--portrait .sc .chips .tap { flex: 1; min-width: 0; }
.sim-dom-root--portrait .sc .live { font-size: 16px; }
.sim-dom-root--portrait .sc .row > * { flex: 1 1 100%; }
.sim-dom-root--portrait .sc .row .gm-check { width: 100%; }
.sim-dom-root--portrait .sc .acts { flex-direction: column; align-items: stretch; }
.sim-dom-root--portrait .sc .acts .tap { min-width: 0; }
.sim-dom-root--portrait .sc .why { font-size: 15px; }
`;

export class SoftCatchGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: "Choose how long each catch takes to stop the ball. Keep the force on the hands below the safe limit, but remember that the hands can move back only about an arm's length." } };
  static ARIA_LABEL = "A fielder catches a ball coming from the left. Choose how long the catch takes to stop the ball. The force on her hands is F = m times v divided by the time, and her hands move back v times t divided by 2. A short time gives a large force, above the safe limit; a long time needs her hands to move back further than an arm's length, 0.6 metres. Find the time that keeps the force below the limit and the hands within reach. Three rounds: a cricket ball, a tennis ball and a football.";

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm sc"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="left"><canvas aria-hidden="true"></canvas></div>
        <div class="side"><p class="goal"></p><div class="row"><div class="chips"></div>
        <div class="acts"><div class="tap btn gm-check sc-go" role="button" tabindex="0">Check</div></div></div>
        <p class="live lf" aria-live="polite"></p><p class="live ld"></p>
        <p class="why" aria-live="polite"></p></div></div></div>`,
    });
    const go = this.root.querySelector('.sc-go');
    if (go) onTap(go, () => this._go());
    this.root.querySelector('.sc')?.addEventListener('keydown', (e) => {
      const k = Number(e.key), t = this._rd().chips[k - 1];
      if (t != null && k >= 1) { e.preventDefault(); this._pick(t); }
      else if (e.key === 'Enter' && !e.target.closest?.('.tap')) { e.preventDefault(); this._go(); }
    });
    this._render();
  }

  _reset() { this._round = 0; this._load(); }
  _load() { this._t = null; this._ok = false; this._bad = false; this._line = ''; this._t0 = null; this._age = 0; this._ran = false; this._chipsFor = -1; }
  _rd() { return ROUNDS[Math.min(this._round, ROUNDS.length - 1)]; }

  /** The winning chip(s) of each round (exactly one each). */
  _answers() { return ROUNDS.map((r) => r.chips.filter((t) => wins(r, t))); }

  _pick(t) {
    if (this._ok || this._round >= ROUNDS.length || !this._rd().chips.includes(t)) return;
    if (t === this._t && !this._ran) return;
    this._t = t; this._ran = false; this._line = ''; this._bad = false;
    cancelAnimationFrame(this._raf);
    this._render();
  }

  _go() {
    if (this._round >= ROUNDS.length) { this._reset(); this._render(); return; }
    if (this._ok) { this._round += 1; this._load(); this._render(); return; }
    if (this._t == null) { this._bad = true; this._line = 'Pick a time to stop first.'; this._render(); return; }
    const r = this._rd(), k = catchOf(r, this._t);
    this._ran = true;
    if (wins(r, this._t)) {
      this._ok = true; this._bad = false;
      this._line = `Right: ${num(k.F)} N is below ${r.limit} N, and ${num(k.d)} m is within reach.`;
      this._cheer();
      if (this._round === ROUNDS.length - 1) { this._round = ROUNDS.length; finishGame(this); }
    } else {
      this._bad = true;
      this._line = k.F >= r.limit ? 'The force is above the safe limit: take longer to stop it.' : 'Her hands cannot move back that far: choose a shorter time.';
    }
    this._t0 = performance.now(); this._animate();
    this._render();
  }

  /** The find: once per round, from the right-answer branch only. */
  _cheer() { this.quill?.perform('hop'); }

  _state() {
    const r = this._rd(), done = this._round >= ROUNDS.length, k = this._t == null ? null : catchOf(r, this._t);
    return `round ${Math.min(this._round + 1, ROUNDS.length)}/${ROUNDS.length} ${r.ball} limit ${r.limit} N t ${this._t ?? '-'} F ${k ? num(k.F) : '-'} d ${k ? num(k.d) : '-'} verdict ${this._ran ? (this._ok ? 'right' : 'wrong') : '-'}${done ? ' won' : ''}`;
  }

  /** Slow-motion length of the whole catch for stop time t (flight, then the stop, then a short rest). */
  _span(t) { return T0 + this._fly() + t * SLOW + 0.4; }
  _fly(r = this._rd()) { return FLY / (r.v * PXM / SLOW); }

  _animate() {
    cancelAnimationFrame(this._raf);
    const end = this._span(this._t);
    const step = (now) => {
      this._age = Math.min(end, (now - this._t0) / 1000);
      this._paint();
      if (this._age < end) this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  _render() {
    const root = this.root, g = root?.querySelector('.gm');
    if (!g) return;
    const done = this._round >= ROUNDS.length, r = this._rd(), k = this._t == null ? null : catchOf(r, this._t);
    g.dataset.done = this._ok || done ? '1' : '0';
    root.querySelector('.sub').textContent = done ? 'All three rounds done.' : `Round ${this._round + 1} of ${ROUNDS.length}`;
    root.querySelector('.goal').innerHTML = `${r.name}: ${r.m} kg at ${r.v} m/s. Keep the force below <b>${r.limit} N</b>. Pick the time to stop.`;
    const chips = root.querySelector('.chips');
    if (this._chipsFor !== this._round) {
      this._chipsFor = this._round;
      chips.innerHTML = r.chips.map((t, i) => `<div class="tap btn" role="button" tabindex="0" aria-label="time to stop ${t} s" aria-pressed="false" aria-keyshortcuts="${i + 1}" data-t="${t}">${t} s</div>`).join('');
      for (const el of chips.querySelectorAll('.tap')) onTap(el, () => this._pick(Number(el.dataset.t)));
    }
    for (const el of chips.querySelectorAll('.tap')) el.setAttribute('aria-pressed', Number(el.dataset.t) === this._t ? 'true' : 'false');
    root.querySelector('.lf').textContent = k ? `F = m x v / t = ${r.m} x ${r.v} / ${this._t} = ${num(k.F)} N` : '';
    root.querySelector('.ld').textContent = k ? `Hands move back v t / 2 = ${r.v} x ${this._t} / 2 = ${num(k.d)} m` : '';
    const go = root.querySelector('.sc-go');
    if (go) go.textContent = done ? 'Play again' : this._ok ? 'Next round' : 'Check';
    const w = root.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    if (!this._ran) this._age = 0;
    this._paint();
    this.relayout?.();
  }

  _lay() { return this.root?.classList?.contains('sim-dom-root--portrait') ? PORT : LAND; }

  _ctx(cv) {
    const css = cv.clientWidth || W, dpr = Math.min(2, window.devicePixelRatio || 1), k = css / W * dpr;
    const HH = this._lay().H, bw = Math.round(W * k), bh = Math.round(HH * k);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    cv.style.aspectRatio = `${W} / ${HH}`;
    const ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, W, HH);
    return ctx;
  }

  /**
   * Ball and hands at age a of a check with stop time t: flight at speed vp (px/s) over FLY px, then uniform
   * slowing over t * SLOW. A stop that needs more than arm's length: the hands halt at the reach and the
   * ball runs on, still slowing, until it meets her body.
   */
  _play(r, t, a) {
    const vp = r.v * PXM / SLOW, ts = t * SLOW, D = r.v * t / 2 * PXM, reach = REACH * PXM;
    const xc = H0.x - 8, tHit = T0 + FLY / vp;
    if (a < tHit) return { x: xc - vp * (tHit - Math.max(T0, a)), back: 0, s: -1, kv: 1 };
    const s = Math.min(a - tHit, ts), dx = vp * s - vp * s * s / (2 * ts);
    const back = Math.min(dx, reach), body = FX - 46 - xc;
    return { x: xc + Math.min(dx, body), back, s: s / ts, kv: 1 - s / ts, over: dx > reach };
  }

  _paint() {
    const cv = this.root?.querySelector('canvas');
    if (!cv) return;
    const c = loadColors(this.root), ctx = this._ctx(cv), r = this._rd(), t = this._t, Lp = this._lay();
    ctx.save(); ctx.translate(0, Lp.dy);
    drawField(ctx, c, { x0: 0, x1: W, y: GY, h: H - GY, seed: 7 });
    const k = t == null ? null : catchOf(r, t), tMax = r.chips[r.chips.length - 1];
    const p = this._ran ? this._play(r, t, this._age) : null;
    const back = p ? p.back : 0, caught = p && p.s >= 0;
    const H1 = { x: H0.x + back, y: H0.y + back * 0.08 };
    // the reach ruler under the hands: arm's length, and what this catch needs
    this._ruler(ctx, c, k);
    // the fielder, hands cupped together in front; the ball between the palms once caught
    const look = figureLook(c, { skin: 2, hairStyle: 'ponytail', hair: 0, top: 'white', bottom: 'cream', shoeStyle: 'sneaker', mood: 'smile' });
    const spec = { x: FX, y: GY, height: FH, facing: -1, pose: { name: 'stand', crouch: 0.12, lean: 10 },
      hands: [{ x: H1.x + 2, y: H1.y + 11 }, { x: H1.x + 4, y: H1.y - 9 }] };
    const bx = p ? p.x : H0.x - 8 - FLY, by = H1.y;
    const ball = (cx) => this._ball(cx, c, r, bx, by);
    drawFigure(ctx, c, spec, look, { between: caught ? ball : null });
    if (!caught) ball(ctx);
    // v arrow on the ball while it flies or slows
    const kv = p ? p.kv : 1;
    if (kv > 0.05) drawMotionArrow(ctx, c, 'v', bx - 40 - r.r, by + r.r + 22, { length: 80 * kv, label: p && p.s >= 0 ? '' : `${r.v} m/s`, side: -1, alpha: Math.min(1, kv * 1.6) });
    // 1. the time-to-stop bar (full = the longest chip of the round); fills while the ball is stopping
    const fill = t == null ? 0 : (p ? (caught ? Math.max(0, p.s) : 0) : 1) * t / tMax;
    ctx.restore();
    drawStopBar(ctx, c, { ...Lp.bar, t01: fill, label: 'time to stop' });
    // 2. the force: meter with the safe limit, and the F arrow on the ball from her hands
    const kf = !k ? 0 : p ? (caught ? ease(this._age, T0 + this._fly(r), 0.15) : 0) : 1;
    this._meter(ctx, c, r, k ? k.F * kf : 0, k, Lp);
    if (k && kf > 0 && (!p || !p.over || p.s < 1)) {
      const len = stopForceLen(t, { tRef: r.chips[1], lenRef: F_LEN });
      const tx = (p ? bx : H0.x - 8) - r.r + 2;
      ctx.save(); ctx.translate(0, Lp.dy);
      drawMotionArrow(ctx, c, 'F', tx, by, { length: len * kf, angle: Math.PI, label: '', alpha: kf });
      ctx.restore();
    }
  }

  /** The ball of the round: the CatchScene cricket ball, or a kit ball for tennis and football. */
  _ball(ctx, c, r, x, y) {
    if (r.ball === 'cricket') LOOK.cricketBall.call(LOOK, ctx, c, x, y);
    else drawBall(ctx, c, { x, y, r: r.r, tone: r.tone });
  }

  /** Force meter: groove 0..2.5 x limit, fill (good below the limit, bad above), the limit line, the value. */
  _meter(ctx, c, r, F, k, Lp = LAND) {
    const { x, y, w, h } = Lp.meter, fs = Lp.fs, top = 2.5 * r.limit, px = (f) => x + w * Math.min(1, f / top);
    ctx.save();
    ctx.font = font(c, 800, fs, true); ctx.textBaseline = 'middle'; ctx.fillStyle = c.label; ctx.textAlign = 'left';
    ctx.fillText('force on the hands', x, y - fs + 4);
    rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = alpha(c.labelMuted, 0.16); ctx.fill();
    if (F > 0) {
      const over = F >= r.limit, col = over ? c.bad : c.good;
      ctx.save(); rr(ctx, x, y, w, h, h / 2); ctx.clip();
      ctx.fillStyle = col; ctx.fillRect(x, y, px(F) - x, h);
      ctx.fillStyle = alpha(darken(col, 0.3), 0.5); ctx.fillRect(x, y + h * 0.62, px(F) - x, h * 0.38);
      ctx.restore();
    }
    rr(ctx, x, y, w, h, h / 2); ctx.strokeStyle = alpha(c.labelMuted, 0.55); ctx.lineWidth = 2; ctx.stroke();
    // the safe limit: a bold line across the groove, its value under it
    const lx = px(r.limit);
    ctx.strokeStyle = c.bad; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(lx, y - 6); ctx.lineTo(lx, y + h + 6); ctx.stroke();
    ctx.font = font(c, 800, fs, true); ctx.textAlign = 'center'; ctx.fillStyle = c.badInk ?? c.bad;
    ctx.fillText(`safe limit ${r.limit} N`, Math.min(lx, x + w - 60), y + h + fs);
    if (k && F > 0) {
      ctx.textAlign = 'left'; ctx.fillStyle = c.label; ctx.font = font(c, 800, 26, true);
      ctx.fillText(`${num(F)} N`, x + w + 12, y + h / 2 + 1);
    }
    ctx.restore();
  }

  /** On the ground under the hands: arm's length 0.6 m, and the move-back this catch needs (v t / 2). */
  _ruler(ctx, c, k) {
    const x0 = H0.x, y = GY - 18, reach = x0 + REACH * PXM;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = c.label; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(reach, y); ctx.moveTo(x0, y - 9); ctx.lineTo(x0, y + 9); ctx.moveTo(reach, y - 12); ctx.lineTo(reach, y + 12); ctx.stroke();
    ctx.restore();
    drawTag(ctx, c, "arm's length 0.6 m", (x0 + reach) / 2 - 40, GY + 15, { size: 24, prefer: [[0, 0]] });
    if (k) {
      const over = k.d > REACH + 1e-9, end = x0 + k.d * PXM, yy = y - 26, col = over ? c.bad : c.s4 ?? c.accent;
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineCap = 'round';
      if (over) ctx.setLineDash([9, 7]);
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(end, yy); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(end, yy - 8); ctx.lineTo(end, yy + 8); ctx.stroke();
      ctx.restore();
      drawTag(ctx, c, `${num(k.d)} m`, x0 - 40, yy, { size: 24, col, prefer: [[0, 0]] });
    }
  }

  checkObjective() { return this._round >= ROUNDS.length ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
