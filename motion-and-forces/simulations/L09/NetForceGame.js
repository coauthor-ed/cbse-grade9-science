/**
 * NetForceGame - mini-game blk-l10-game. A crate on a tiled floor between two ropes, a puller on each
 * side (ForceCast). Each pull is set with - / + in steps of 2 N, 0 to 20 N (arrow keys on the value
 * too). Both pulls are F arrows on one scale (PXN px per newton), tails on the crate where the rope is
 * tied; the net force is its own F arrow below the floor, and the sum is written out
 * ("10 N - 6 N = 4 N to the right"). Check:
 *   right  the crate (and the two pullers with it) moves in the net direction, x = K net t^2 / 2 for
 *          1 s (balanced: it stays); Quill hops; Next round.
 *   wrong  one hint line naming what is off (direction, size, or a rule of the round).
 * Rounds from a fixed list (several right answers each):
 *   1  net 4 N to the left        2  balanced, net 0 N, each pull at least 6 N
 *   3  net 10 N to the right, left pull at least 4 N
 * No hint at landing. Won after round 3 (finishGame). ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors } from 'simulations/base/kit/SimLook.js';
import { drawSurface } from '../shared/MotionCast.js';
import { drawForce, drawNet, drawBoxOn, drawTeam, drawRope } from '../shared/ForceCast.js';

const W = 680, H = 262, PXN = 6, MAXN = 20, STEP = 2;  // short board: the pull buttons stay above the 1280x720 fold
const FLOOR = 166, BOXW = 124, BOXH = 100, CX = 340, ROPE_Y = 96, PH = 140, HAND = 190, NET_Y = 234;
const SLIDE = 1.0, K = 10;                       // win slide: x = K * net * t^2 / 2 px (50 px for 10 N)
const ROUNDS = [
  { net: -4, start: [6, 10], ask: 'net force <b>4 N to the left</b>', rule: '' },
  { net: 0, start: [4, 10], min: 6, ask: 'net force <b>0 N</b> (balanced)', rule: 'Each pull at least 6 N.' },
  { net: 10, start: [8, 8], minL: 4, ask: 'net force <b>10 N to the right</b>', rule: 'Left pull at least 4 N.' },
];

/** "10 N - 6 N = 4 N to the right" for left pull l and right pull r. */
function sumLine(l, r) {
  if (l === r) return `${r} N - ${l} N = 0 N, balanced`;
  return r > l ? `${r} N - ${l} N = ${r - l} N to the right` : `${l} N - ${r} N = ${l - r} N to the left`;
}

const CSS = `
.gm.nf { gap: 6px; }
.nf .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.nf .play { display: grid; grid-template-columns: 520px minmax(0, 1fr); gap: 18px; align-items: start; flex: 1; min-height: 0; }
.nf canvas { display: block; width: 100%; height: auto; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; }
.nf .pulls { display: flex; justify-content: space-between; gap: 12px; margin-top: 4px; }
.nf .pull { display: flex; align-items: center; gap: 6px; }
.nf .pull .name { font-size: 16px; font-weight: 800; margin-right: 4px; white-space: nowrap; }
.nf .pull .tap { width: 48px; min-width: 48px; display: flex; align-items: center; justify-content: center; font-size: 24px; padding: 0; }
.nf .val { min-width: 70px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: var(--sim-radius-md);
           background: var(--sim-bg-deep); border: var(--sim-border); font: 800 19px/1 var(--sim-font); font-variant-numeric: tabular-nums; }
.nf .val:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.nf .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; max-width: 460px; margin-top: 8px; padding: 12px 14px;
            background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); }
.nf .goal { margin: 0; font: 800 20px/1.25 var(--sim-font-display); }
.nf .goal b { color: var(--sim-series-3-ink); }
.nf .rule { margin: 0; font-size: 16px; font-weight: 700; color: var(--sim-label-muted); }
.nf .rule:empty { display: none; }
.nf .sum { margin: 0; font-size: 19px; font-weight: 800; line-height: 1.3; }
.nf .acts { display: flex; gap: 12px; align-items: center; }
.nf .acts .tap { flex: 0 0 auto; min-width: 170px; display: flex; align-items: center; justify-content: center; }
.nf .why { margin: 0; min-height: 44px; font-size: 16px; line-height: 1.3; font-weight: 700; }
.nf .why[data-k="bad"] { color: var(--sim-bad); }
.nf[data-done="1"] .pull .tap { opacity: 0.45; pointer-events: none; }
.sim-dom-root--portrait .nf .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .nf .pulls { flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .nf .pull .name { flex: 1 1 auto; }
.sim-dom-root--portrait .nf .side { margin-top: 0; padding: 10px; max-width: none; }
.sim-dom-root--portrait .nf .goal { font-size: 18px; }
.sim-dom-root--portrait .nf .sum { font-size: 17px; }
.sim-dom-root--portrait .nf .acts { flex-direction: column; align-items: stretch; }
.sim-dom-root--portrait .nf .acts .tap { min-width: 0; }
.sim-dom-root--portrait .nf .why { font-size: 15px; }
`;

const pullHtml = (side, name) => `<div class="pull" data-side="${side}"><span class="name">${name}</span>
  <div class="tap btn minus" role="button" tabindex="0" aria-label="${name}: 2 N less">-</div>
  <div class="val" role="spinbutton" tabindex="0" aria-label="${name}" aria-valuemin="0" aria-valuemax="${MAXN}"></div>
  <div class="tap btn plus" role="button" tabindex="0" aria-label="${name}: 2 N more">+</div></div>`;

export class NetForceGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'Set the two pulls on the box so that the net force has the size and the direction asked for.' } };
  static ARIA_LABEL = 'A crate on a floor with a rope tied to each side. A person pulls each rope, one to the left and one to the right. Set each pull from 0 to 20 newtons in steps of 2 with the minus and plus buttons or the arrow keys. Each pull is an arrow from the crate, and the net force is a separate arrow below it, with the sum written out. Make the net force the size and direction asked for, then check. Three rounds.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm nf"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="left"><canvas aria-hidden="true"></canvas>
        <div class="pulls">${pullHtml('l', 'Left pull')}${pullHtml('r', 'Right pull')}</div></div>
        <div class="side"><p class="goal"></p><p class="rule"></p><p class="sum" aria-live="polite"></p>
        <div class="acts"><div class="tap btn gm-check nf-go" role="button" tabindex="0">Check</div></div>
        <p class="why" aria-live="polite"></p></div></div></div>`,
    });
    for (const el of this.root.querySelectorAll('.pull')) {
      const i = el.dataset.side === 'l' ? 0 : 1;
      onTap(el.querySelector('.minus'), () => this._set(i, this._f[i] - STEP));
      onTap(el.querySelector('.plus'), () => this._set(i, this._f[i] + STEP));
      el.querySelector('.val').addEventListener('keydown', (e) => {
        const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
        if (!d) return;
        e.preventDefault(); this._set(i, this._f[i] + d * STEP);
      });
    }
    const go = this.root.querySelector('.nf-go');
    if (go) onTap(go, () => this._go());
    this._render();
  }

  _reset() { this._round = 0; this._load(); }

  _load() {
    const r = this._rd();
    this._f = [...r.start]; this._ok = false; this._line = ''; this._bad = false; this._won = null; this._dx = 0;
  }

  _rd() { return ROUNDS[Math.min(this._round, ROUNDS.length - 1)]; }
  _net() { return this._f[1] - this._f[0]; }

  /** Set pull i (0 left, 1 right) to n newtons, snapped to 2 N steps in 0..20. */
  _set(i, n) {
    if (this._ok || this._round >= ROUNDS.length) return;
    const v = Math.max(0, Math.min(MAXN, Math.round(n / STEP) * STEP));
    if (v === this._f[i]) return;
    this._f[i] = v; this._line = ''; this._bad = false;
    this._render();
  }

  /** What is off, or '' when the pulls meet the round. */
  _miss() {
    const r = this._rd(), [l, rr] = this._f, net = rr - l;
    if (r.net === 0) {
      if (net !== 0) return 'The net force is not zero. Make the two pulls equal.';
      if (Math.min(l, rr) < r.min) return `Each pull must be at least ${r.min} N.`;
      return '';
    }
    if (r.minL && l < r.minL) return `The left pull must be at least ${r.minL} N.`;
    if (net === 0) return 'The pulls are balanced, so the net force is 0 N.';
    if (Math.sign(net) !== Math.sign(r.net)) return 'The net force points the wrong way.';
    const d = Math.abs(net) - Math.abs(r.net);
    if (d > 0) return `The net force is ${d} N too large.`;
    if (d < 0) return `The net force is ${-d} N too small.`;
    return '';
  }

  _go() {
    if (this._round >= ROUNDS.length) { this._reset(); this._render(); return; }
    if (this._ok) { this._round += 1; this._load(); this._render(); return; }
    const why = this._miss();
    if (!why) {
      this._ok = true; this._bad = false;
      this._line = `Right: ${sumLine(this._f[0], this._f[1])}.`;
      this._won = performance.now(); this._animate();
      this._cheer();
      if (this._round === ROUNDS.length - 1) { this._round = ROUNDS.length; finishGame(this); }
    } else { this._bad = true; this._line = why; }
    this._render();
  }

  /** The find: once per round, from the right-answer branch only. */
  _cheer() { this.quill?.perform('hop'); }

  _animate() {
    cancelAnimationFrame(this._raf);
    const step = (now) => {
      const t = Math.min(SLIDE, (now - this._won) / 1000);
      this._dx = 0.5 * K * this._net() * t * t;
      this._paint();
      if (t < SLIDE) this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  _render() {
    const root = this.root, g = root?.querySelector('.gm');
    if (!g) return;
    const done = this._round >= ROUNDS.length, r = this._rd();
    g.dataset.done = this._ok || done ? '1' : '0';
    root.querySelector('.sub').textContent = done ? 'All three rounds done.' : `Round ${this._round + 1} of 3`;
    root.querySelector('.goal').innerHTML = `Make the ${r.ask}`;
    root.querySelector('.rule').textContent = r.rule;
    root.querySelector('.sum').textContent = sumLine(this._f[0], this._f[1]);
    for (const el of root.querySelectorAll('.pull')) {
      const i = el.dataset.side === 'l' ? 0 : 1, v = el.querySelector('.val');
      v.textContent = `${this._f[i]} N`;
      v.setAttribute('aria-valuenow', String(this._f[i])); v.setAttribute('aria-valuetext', `${this._f[i]} newtons`);
    }
    const go = root.querySelector('.nf-go');
    if (go) go.textContent = done ? 'Play again' : this._ok ? 'Next round' : 'Check';
    const w = root.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    this._paint();
    this.relayout?.();
  }

  _ctx(cv) {
    const css = cv.clientWidth || W, dpr = Math.min(2, window.devicePixelRatio || 1), k = css / W * dpr;
    const bw = Math.round(W * k), bh = Math.round(H * k);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    cv.style.aspectRatio = `${W} / ${H}`;
    const ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, W, H);
    return ctx;
  }

  _paint() {
    const cv = this.root?.querySelector('canvas');
    if (!cv) return;
    const c = loadColors(this.root), ctx = this._ctx(cv), [l, r] = this._f, dx = this._dx;
    drawSurface(ctx, c, 'tiles', 0, W, FLOOR, { h: 32 });
    const x = CX + dx, hl = x - HAND, hr = x + HAND;
    // ropes first (hands land over them), then the pullers, then the crate over the rope ends
    drawRope(ctx, c, { x0: hl - 0.13 * PH - 22, x1: x - BOXW / 2 + 6, y: ROPE_Y });
    drawRope(ctx, c, { x0: x + BOXW / 2 - 6, x1: hr + 0.13 * PH + 22, y: ROPE_Y });
    drawTeam(ctx, c, { ropeX: hl, ropeY: ROPE_Y, y: FLOOR, n: 1, facing: 1, effort: l / MAXN, height: PH, seed: 2 });
    drawTeam(ctx, c, { ropeX: hr, ropeY: ROPE_Y, y: FLOOR, n: 1, facing: -1, effort: r / MAXN, height: PH, seed: 5 });
    const b = drawBoxOn(ctx, c, { x, y: FLOOR, w: BOXW, h: BOXH, kind: 'crate' });
    // the two pulls, one scale, tails on the crate where each rope is tied
    if (l > 0) drawForce(ctx, c, b.back.x, ROPE_Y, { newtons: l, scale: PXN, angle: Math.PI, label: `${l} N`, side: -1, fit: false, size: 30 });
    if (r > 0) drawForce(ctx, c, b.front.x, ROPE_Y, { newtons: r, scale: PXN, angle: 0, label: `${r} N`, side: 1, fit: false, size: 30 });
    // the net force, its own arrow below the floor
    drawNet(ctx, c, x, NET_Y, [{ newtons: r, dir: 1 }, { newtons: l, dir: -1 }], { scale: PXN, fit: false, side: r >= l ? 1 : -1, size: 30 });
  }

  checkObjective() { return this._round >= ROUNDS.length ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
