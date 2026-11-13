/**
 * ForceMassGame - mini-game blk-l14-game. The CartLab look (CartLabScene parts, borrowed from its
 * prototype): the cardboard-box cart on the ideal floor (no cup), a thread from its front to your hand.
 * Force cards 2 N, 4 N, 6 N set the pull (an F arrow on the thread, tail on the cart, one px scale);
 * mass cards 1 kg, 2 kg, 3 kg load the cart (empty, one block, two blocks). Once both are picked the side
 * panel shows "a = F / m = ..." and an a arrow (length with a) sits over the cart. A tape mark on the
 * floor shows where a cart with the asked acceleration gets to in the run time.
 * Check: the cart runs from rest for the same compressed time T with x = 1/2 a t^2 (D(a) = 48 a px), so it
 * reaches the tape only when a is right; equal-time dots on the floor afterwards (growing gaps).
 *   right  Quill hops once; Next round.
 *   wrong  one hint line: too large (smaller force or larger mass) or too small; change a card, Check again.
 * Rounds from a fixed list: a = 2 m/s2 (2/1, 4/2, 6/3 all right: "Any pair that works"), a = 3 m/s2
 * (6/2 only), a = 1 m/s2 (2/2 only). Never all pairs right; _answers() lists them. No hint at landing.
 * Won after round 3 (finishGame). Keys: 1 2 3 pick 2 N, 4 N, 6 N; 4 5 6 pick 1 kg, 2 kg, 3 kg; Enter checks
 * (Enter or Space on a focused card picks it). Test hooks: _set(F, m), _go() (Check / Next round /
 * Play again), _state(), _answers(). ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { propRig, drawBlock } from 'simulations/base/kit/SimProps.js';
import { drawMotionArrow } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';
import { drawForce } from '../shared/ForceCast.js';
import { CartLabScene } from './CartLabScene.js';

const LOOK = CartLabScene.prototype;              // idealFloor, labCart, hand, startLine, dots, pale, skin, limb, bearing
const W = 680, H = 262, FY = 196, FH = 30, CK = 1.2, CW = 140 * CK, BX = 16, PXN = 16, APX = 20, DPA = 46, THREAD = 112;
const T_RUN = 1.6, SQ = '\u00b2';
const FORCES = [2, 4, 6], MASSES = [1, 2, 3];
const ROUNDS = [
  { a: 2, rule: 'Any pair that works.' },
  { a: 3, rule: '' },
  { a: 1, rule: '' },
];
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, ''));

const CSS = `
.gm.fm { gap: 6px; }
.fm .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.fm .play { display: grid; grid-template-columns: 520px minmax(0, 1fr); gap: 18px; align-items: start; flex: 1; min-height: 0; }
.fm canvas { display: block; width: 100%; height: auto; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; }
.fm .cards { display: flex; justify-content: space-between; gap: 10px; margin-top: 4px; }
.fm .set { display: flex; align-items: center; gap: 6px; }
.fm .set .name { font-size: 16px; font-weight: 800; margin-right: 2px; white-space: nowrap; }
.fm .set .tap { min-width: 62px; height: 48px; padding: 0 6px; display: flex; align-items: center; justify-content: center; font: 800 18px/1 var(--sim-font); font-variant-numeric: tabular-nums; }
.fm .set .tap[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 2px; background: var(--sim-bg-deep); }
.fm .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; max-width: 460px; margin-top: 8px; padding: 12px 14px;
            background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); }
.fm .goal { margin: 0; font: 800 20px/1.25 var(--sim-font-display); }
.fm .goal b { color: var(--sim-series-2-ink); }
.fm .rule { margin: 0; font-size: 16px; font-weight: 700; color: var(--sim-label-muted); }
.fm .rule:empty { display: none; }
.fm .sum { margin: 0; font-size: 19px; font-weight: 800; line-height: 1.3; }
.fm .acts { display: flex; gap: 12px; align-items: center; }
.fm .acts .tap { flex: 0 0 auto; min-width: 170px; display: flex; align-items: center; justify-content: center; }
.fm .why { margin: 0; font-size: 16px; line-height: 1.3; font-weight: 700; }
.fm .why:empty { display: none; }
.fm .why[data-k="bad"] { color: var(--sim-bad); }
.fm[data-done="1"] .set .tap { opacity: 0.45; pointer-events: none; }
.sim-dom-root--portrait .fm .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .fm .cards { flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .fm .set .name { flex: 1 1 auto; }
.sim-dom-root--portrait .fm .side { margin-top: 0; padding: 10px; max-width: none; }
.sim-dom-root--portrait .fm .goal { font-size: 18px; }
.sim-dom-root--portrait .fm .sum { font-size: 17px; }
.sim-dom-root--portrait .fm .acts { flex-direction: column; align-items: stretch; }
.sim-dom-root--portrait .fm .acts .tap { min-width: 0; }
.sim-dom-root--portrait .fm .why { font-size: 15px; }
`;

const setHtml = (kind, name, vals, unit) => `<div class="set" data-set="${kind}"><span class="name">${name}</span>${
  vals.map((v) => `<div class="tap btn" role="button" tabindex="0" aria-pressed="false" data-v="${v}">${v} ${unit}</div>`).join('')}</div>`;

export class ForceMassGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'Pick a force and a mass that give the cart the acceleration asked for. Then the cart runs, so that you can check.' } };
  static ARIA_LABEL = 'A cardboard cart on a smooth floor with a thread from its front to your hand. Pick the pull, 2, 4 or 6 newtons, and the mass of the cart, 1, 2 or 3 kilograms. The acceleration a = F / m is written out. Check: the cart runs from rest for the same time, and it reaches the tape mark only if its acceleration is the one asked for. Three rounds.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm fm"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="left"><canvas aria-hidden="true"></canvas>
        <div class="cards">${setHtml('f', 'Force', FORCES, 'N')}${setHtml('m', 'Mass', MASSES, 'kg')}</div></div>
        <div class="side"><p class="goal"></p><p class="rule"></p><p class="sum" aria-live="polite"></p>
        <div class="acts"><div class="tap btn gm-check fm-go" role="button" tabindex="0">Check</div></div>
        <p class="why" aria-live="polite"></p></div></div></div>`,
    });
    for (const el of this.root.querySelectorAll('.set .tap')) {
      const f = el.parentElement.dataset.set === 'f', v = Number(el.dataset.v);
      onTap(el, () => (f ? this._set(v, this._m) : this._set(this._f, v)));
    }
    const go = this.root.querySelector('.fm-go');
    if (go) onTap(go, () => this._go());
    this.root.querySelector('.fm')?.addEventListener('keydown', (e) => {
      const k = Number(e.key);
      if (k >= 1 && k <= 3) { e.preventDefault(); this._set(FORCES[k - 1], this._m); }
      else if (k >= 4 && k <= 6) { e.preventDefault(); this._set(this._f, MASSES[k - 4]); }
      else if (e.key === 'Enter' && !e.target.closest?.('.tap')) { e.preventDefault(); this._go(); }
    });
    this._render();
  }

  _reset() { this._round = 0; this._load(); }
  _load() { this._f = null; this._m = null; this._ok = false; this._bad = false; this._line = ''; this._t0 = null; this._age = 0; this._ran = null; }
  _rd() { return ROUNDS[Math.min(this._round, ROUNDS.length - 1)]; }
  _a() { return this._f && this._m ? this._f / this._m : null; }

  /** Every (F, m) pair on the cards that wins round i. */
  _answers(i = null) {
    const one = (r) => FORCES.flatMap((f) => MASSES.filter((m) => f / m === r.a).map((m) => `${f}/${m}`));
    return i == null ? ROUNDS.map(one) : one(ROUNDS[i]);
  }

  _set(f, m) {
    if (this._ok || this._round >= ROUNDS.length) return;
    if (f === this._f && m === this._m) return;
    this._f = f; this._m = m; this._ran = null; this._line = ''; this._bad = false;
    cancelAnimationFrame(this._raf);
    this._render();
  }

  _go() {
    if (this._round >= ROUNDS.length) { this._reset(); this._render(); return; }
    if (this._ok) { this._round += 1; this._load(); this._render(); return; }
    const a = this._a();
    if (a == null) { this._bad = true; this._line = this._f ? 'Pick a mass too.' : 'Pick a force too.'; this._render(); return; }
    const want = this._rd().a;
    this._ran = a;
    if (a === want) {
      this._ok = true; this._bad = false;
      this._line = `Right: ${this._f} N / ${this._m} kg = ${want} m/s${SQ}.`;
      this._cheer();
      if (this._round === ROUNDS.length - 1) { this._round = ROUNDS.length; finishGame(this); }
    } else {
      this._bad = true;
      this._line = a > want ? 'Too large: use a smaller force or a larger mass.' : 'Too small: use a larger force or a smaller mass.';
    }
    this._t0 = performance.now(); this._animate();
    this._render();
  }

  /** The find: once per round, from the right-answer branch only. */
  _cheer() { this.quill?.perform('hop'); }

  _state() {
    const a = this._a(), done = this._round >= ROUNDS.length;
    return `round ${Math.min(this._round + 1, ROUNDS.length)}/${ROUNDS.length} target ${this._rd().a} F ${this._f ?? '-'} m ${this._m ?? '-'} a ${a == null ? '-' : fmt(a)} verdict ${this._ran == null ? '-' : this._ok ? 'right' : 'wrong'}${done ? ' won' : ''}`;
  }

  _animate() {
    cancelAnimationFrame(this._raf);
    const step = (now) => {
      this._age = Math.min(T_RUN + 0.5, (now - this._t0) / 1000);
      this._paint();
      if (this._age < T_RUN + 0.5) this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  _render() {
    const root = this.root, g = root?.querySelector('.gm');
    if (!g) return;
    const done = this._round >= ROUNDS.length, r = this._rd(), a = this._a();
    g.dataset.done = this._ok || done ? '1' : '0';
    root.querySelector('.sub').textContent = done ? 'All three rounds done.' : `Round ${this._round + 1} of ${ROUNDS.length}`;
    root.querySelector('.goal').innerHTML = `Give the cart <b>a = ${r.a} m/s${SQ}</b>`;
    root.querySelector('.rule').textContent = r.rule;
    root.querySelector('.sum').textContent = a == null ? 'a = F / m' : `a = F / m = ${this._f} N / ${this._m} kg = ${fmt(a)} m/s${SQ}`;
    for (const el of root.querySelectorAll('.set .tap')) {
      const v = Number(el.dataset.v), on = el.parentElement.dataset.set === 'f' ? v === this._f : v === this._m;
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    const go = root.querySelector('.fm-go');
    if (go) go.textContent = done ? 'Play again' : this._ok ? 'Next round' : 'Check';
    const w = root.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    if (this._ran == null) this._age = 0;
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
    const c = loadColors(this.root), ctx = this._ctx(cv), L = LOOK;
    const a = this._a(), ran = this._ran, t = ran == null ? 0 : Math.min(this._age, T_RUN);
    const s = ran == null ? 0 : DPA * ran * (t / T_RUN) ** 2;      // x = 1/2 a t^2, compressed clock
    const front0 = BX + CW, want = this._rd().a, tapeX = front0 + DPA * want;
    L.idealFloor.call(L, ctx, c, 6, W - 6, FY, FH);
    L.startLine.call(L, ctx, c, front0, FY);
    // the tape: where a cart with the asked acceleration gets to in the run time
    L.startLine.call(L, ctx, c, tapeX, FY);
    drawTag(ctx, c, 'target', tapeX, FY + FH + 14, { size: 24, col: c.accent, prefer: [[0, 0]] });
    // the cart, loaded by mass: 1 kg empty, 2 kg one block, 3 kg two blocks (CartLab draws two)
    const bx = BX + s;
    if (this._m === 2) {
      const top = FY - 6 * CK - 58 * CK;
      drawBlock(ctx, c, propRig({ x0: 0, scale: 1, groundY: top + 58 * CK * 0.55 }), bx + CW * 0.5, { w: 48 * CK, h: 62 * CK, tone: 5 });
    }
    const cart = L.labCart.call(L, ctx, c, bx, FY, { k: CK, load: this._m === 3, s });
    if (this._m) drawTag(ctx, c, `${this._m} kg`, cart.cx, cart.bottom - 14, { size: 24, prefer: [[0, 0]] });
    // the thread to your hand, a fixed length ahead of the cart
    const ty = cart.ty, hx = cart.front + THREAD;
    ctx.save(); ctx.strokeStyle = c.label; ctx.globalAlpha *= 0.7; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(cart.front, ty); ctx.lineTo(hx, ty); ctx.stroke(); ctx.restore();
    // your arm, bent: the upper arm comes down from above the board, the elbow, a short forearm to the hand
    // (the CartLab hand and sleeve, also in L11 ForceToChangeScene); fingers along the thread
    const HL = 62, P = { x: hx + 16, y: ty }, E = { x: P.x + 96, y: ty + 30 }, S = { x: P.x + 150, y: -40 };
    L.limb.call(L, ctx, S.x, S.y, E.x, E.y, 0.44 * HL, c.s4);
    L.hand.call(L, ctx, c, P, { len: HL, view: 'back', dir: Math.PI, palm: 1, arm: E });
    if (this._f) drawForce(ctx, c, cart.front, ty, { newtons: this._f, scale: PXN, label: `${this._f} N`, fit: false, size: 26 });
    if (a != null) {
      const ka = ran == null || ran === a ? 1 : 1;
      drawMotionArrow(ctx, c, 'a', cart.cx - 50, cart.top - 40, { length: a * APX, label: `a = ${fmt(a)} m/s${SQ}`, side: 1, alpha: ka, size: 24 });
    }
    // after the run: equal-time dots at the front of the cart (growing gaps)
    if (ran != null && this._age >= T_RUN) {
      const xs = [0, 1, 2, 3, 4].map((i) => front0 + DPA * ran * (i / 4) ** 2);
      L.dots.call(L, ctx, c, xs, FY, { alpha: ease(this._age, T_RUN, 0.3) });
    }
  }

  checkObjective() { return this._round >= ROUNDS.length ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
