/**
 * FrictionGame - mini-game blk-l11-game. The CoinStack top-view lane: your forefinger and thumb hold a
 * rubber band at A and B, mark C behind, the coin stack against the band, and a shaded target zone on
 * the lane. Three surface cards (wooden table top, laminated table top, polished marble), each with its
 * surface drawn on it. Pick a card: the lane takes that surface, a finger pushes the stack back to C
 * (the same stretch every time), the band snaps it forward and it slides and stops. Stop distances
 * from C are 20 : 35 : 60 (CoinStackScene's own slide(), so the game and the L10 slides agree).
 *   in the zone  the zone lights, Quill hops; Next zone.
 *   short / long one hint line (less / more friction); earlier stops of the round stay as faint marks.
 * Rounds from a fixed list: zone at the laminate stop, at the marble stop, at the wood stop.
 * Drawing borrows CoinStackScene's lane parts (its prototype methods). Won after round 3. ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, clamp01, inOutSine, alpha, rr } from 'simulations/base/kit/SimLook.js';
import { drawTag } from '../shared/MotionGraph.js';
import { CoinStackScene } from './CoinStackScene.js';

const LOOK = CoinStackScene.prototype;           // lane, surf, stack, band, hand, pusher, marks, slide()
const W = 680, H = 250, SW = 220, SH = 60;
const KINDS = ['wood', 'laminate', 'marble'];
const NAME = { wood: 'wooden table top', laminate: 'laminated table top', marble: 'polished marble' };
const CARD = { wood: 'Wooden table top', laminate: 'Laminated table top', marble: 'Polished marble' };
const ROUNDS = ['laminate', 'marble', 'wood'];
const PB = 50, ZONE = 34;                        // PB: C to the band line, as in CoinStackScene
const TR = 1.75;                                 // push back, lift, then the band lets go
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const lane = () => LOOK.lane.call(LOOK, 40, 150, 26, { cx: 100 });

const CSS = `
.gm.fg { gap: 6px; }
.fg .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.fg .play { display: grid; grid-template-columns: 600px minmax(0, 1fr); gap: 18px; align-items: start; flex: 1; min-height: 0; }
.fg canvas.lane { display: block; width: 100%; height: auto; background: var(--sim-bg-surface); border: var(--sim-border);
                  border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; }
.fg .cards { display: flex; flex-direction: column; gap: 10px; max-width: 360px; margin-top: 4px; }
.fg .cards .tap { display: flex; align-items: center; gap: 12px; padding: 6px 10px; text-align: left; font-size: 17px; font-weight: 800; }
.fg .cards .card canvas { width: 104px; min-width: 104px; max-width: 104px; height: auto; flex: 0 0 104px; border-radius: 8px; }
.fg .cards .tap[aria-pressed="true"] { border-color: var(--sim-accent); outline: 3px solid var(--sim-accent); outline-offset: -1px; }
.fg[data-busy="1"] .cards .tap { opacity: 0.6; pointer-events: none; }
.fg[data-ok="1"] .cards .tap { pointer-events: none; }
.fg .acts { display: flex; gap: 12px; align-items: center; margin-top: 8px; }
.fg .acts .why { flex: 1 1 0; min-width: 0; }
.fg .acts .tap { flex: 0 0 auto; min-width: 170px; display: none; align-items: center; justify-content: center; }
.fg[data-ok="1"] .acts .tap { display: flex; }
.fg .why { margin: 0; min-height: 44px; font-size: 16px; line-height: 1.3; font-weight: 700; }
.fg .why[data-k="bad"] { color: var(--sim-bad); }
.sim-dom-root--portrait .fg .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .fg .cards { max-width: none; margin-top: 0; }
.sim-dom-root--portrait .fg .acts { flex-direction: column; align-items: stretch; }
.sim-dom-root--portrait .fg .acts .tap { min-width: 0; }
.sim-dom-root--portrait .fg .why { font-size: 15px; }
`;

export class FrictionGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'The band gives the coin stack the same push every time. Choose the surface so that the stack stops inside the target zone.' } };
  static ARIA_LABEL = 'A coin stack on a table lane seen from above, held by a rubber band at marks A and B, with mark C behind it. A shaded target zone lies on the lane. Pick one of three surfaces: a wooden table top, a laminated table top or polished marble. The band then pushes the stack the same way every time, and it slides and stops. The more friction, the sooner it stops. Make it stop inside the zone. Three rounds.';

  async setup() {
    await super.setup();
    this._reset();
    const cards = KINDS.map((k) => `<div class="tap btn card" role="button" tabindex="0" aria-pressed="false" data-k="${k}">
      <canvas width="${SW}" height="${SH}" data-sim-own-size aria-hidden="true"></canvas><span>${CARD[k]}</span></div>`).join('');
    mountGame(this, {
      css: CSS, check: false, onResize: () => { this._paint(); this._swatches(); },
      html: `<div class="gm fg"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="left"><canvas class="lane" aria-hidden="true"></canvas>
        <div class="acts"><p class="why" aria-live="polite"></p><div class="tap btn gm-check fg-next" role="button" tabindex="0">Next zone</div></div></div>
        <div class="cards">${cards}</div></div></div>`,
    });
    for (const el of this.root.querySelectorAll('.card')) onTap(el, () => this._pick(el.dataset.k));
    const next = this.root.querySelector('.fg-next');
    if (next) onTap(next, () => this._next());
    this._render();
    this._swatches();
  }

  _reset() { this._round = 0; this._load(); }
  _load() { this._kind = null; this._t = null; this._ok = false; this._st = 'pick'; this._line = ''; this._marks = []; }
  _rd() { return ROUNDS[Math.min(this._round, ROUNDS.length - 1)]; }
  /** Stack centre x at rest on a surface (C + stop distance + R). */
  _stopX(kind) { const L = lane(); return L.C.x + LOOK.slide.call(LOOK, 99, kind).p + L.R; }

  /** Choose a surface: the run starts now. */
  _pick(kind) {
    if (this._st === 'run' || this._ok || this._round >= ROUNDS.length || !KINDS.includes(kind)) return;
    this._kind = kind; this._t = performance.now(); this._st = 'run'; this._line = '';
    this._render(); this._animate();
  }

  _end() {
    const x = this._stopX(this._kind), zx = this._stopX(this._rd());
    if (Math.abs(x - zx) <= ZONE) {
      this._ok = true; this._st = 'in';
      this._line = `Right: on the ${NAME[this._kind]} the stack stops in the zone.`;
      this._cheer();
      if (this._round === ROUNDS.length - 1) { this._round = ROUNDS.length; finishGame(this); }
    } else {
      this._st = 'out'; this._marks.push(x);
      this._line = x < zx ? 'It stopped short: pick a surface with less friction.' : 'It went too far: pick a surface with more friction.';
    }
    this._render();
  }

  /** The find: once per zone, from the in-zone branch only. */
  _cheer() { this.quill?.perform('hop'); }

  _next() {
    if (this._round >= ROUNDS.length) this._reset();
    else if (this._ok) { this._round += 1; this._load(); }
    this._render(); this._paint();
  }

  _animate() {
    cancelAnimationFrame(this._raf);
    const end = TR + LOOK.stopTime.call(LOOK, this._kind) + 0.35;
    const step = (now) => {
      const a = (now - this._t) / 1000;
      this._paint(a);
      if (a < end) this._raf = requestAnimationFrame(step); else this._end();
    };
    this._raf = requestAnimationFrame(step);
  }

  _render() {
    const root = this.root, g = root?.querySelector('.gm');
    if (!g) return;
    const done = this._round >= ROUNDS.length;
    g.dataset.ok = this._ok || done ? '1' : '0'; g.dataset.busy = this._st === 'run' ? '1' : '0';
    root.querySelector('.sub').textContent = done ? 'All three zones done.' : `Zone ${this._round + 1} of 3`;
    for (const el of root.querySelectorAll('.card')) el.setAttribute('aria-pressed', el.dataset.k === this._kind ? 'true' : 'false');
    const next = root.querySelector('.fg-next');
    if (next) next.textContent = done ? 'Play again' : 'Next zone';
    const w = root.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._st === 'out' ? 'bad' : 'good';
    if (this._st !== 'run') this._paint();
    this.relayout?.();
  }

  _ctx(cv, w, h) {
    const css = cv.clientWidth || w, dpr = Math.min(2, window.devicePixelRatio || 1), k = css / w * dpr;
    const bw = Math.round(w * k), bh = Math.round(h * k);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    cv.style.aspectRatio = `${w} / ${h}`;
    const ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, w, h);
    return ctx;
  }

  /** Each card shows its own surface. */
  _swatches() {
    const c = loadColors(this.root);
    for (const el of this.root?.querySelectorAll('.card') ?? []) {
      const cv = el.querySelector('canvas');
      const ctx = this._ctx(cv, SW, SH);
      LOOK.surf.call(LOOK, ctx, c, el.dataset.k, 3, SW - 3, 3, SH - 12, { r: 10, seed: 11 });
    }
  }

  /** The lane at age a of the current run (a omitted: at rest). */
  _paint(a) {
    if (a == null && this._st === 'run' && this._t != null) a = (performance.now() - this._t) / 1000;
    const cv = this.root?.querySelector('canvas.lane');
    if (!cv) return;
    const c = loadColors(this.root), ctx = this._ctx(cv, W, H), L = lane(), kind = this._kind;
    const run = this._st === 'run' && a != null;
    const age = run ? a : this._kind ? 99 : -1;
    // the surface (none picked yet: a plain pale lane with a dashed edge)
    if (kind) LOOK.surf.call(LOOK, ctx, c, kind, L.x0, L.x1, L.y, L.h, {});
    else {
      rr(ctx, L.x0, L.y, L.x1 - L.x0, L.h, 14); ctx.fillStyle = c.bgDeep; ctx.fill();
      ctx.save(); ctx.setLineDash([10, 8]); ctx.strokeStyle = alpha(c.label, 0.45); ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
    }
    // the target zone across the lane
    const zx = this._stopX(this._rd()), lit = this._ok;
    const z0 = zx - ZONE, z1 = Math.min(zx + ZONE, L.x1 - 3);
    ctx.save();
    ctx.fillStyle = alpha(lit ? c.good : c.accent, 0.28); ctx.fillRect(z0, L.y + 3, z1 - z0, L.h - 6);
    ctx.setLineDash([8, 6]); ctx.strokeStyle = lit ? c.good : c.accent; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(z0, L.y + 3); ctx.lineTo(z0, L.y + L.h - 3); ctx.moveTo(z1, L.y + 3); ctx.lineTo(z1, L.y + L.h - 3); ctx.stroke();
    ctx.restore();
    drawTag(ctx, c, 'target', Math.min(zx, L.x1 - 54), L.y - 20, { size: 26, col: lit ? c.good : c.accent });
    // marks C, A, B
    LOOK.dot.call(LOOK, ctx, c, L.C.x, L.cy, 5);
    LOOK.badge.call(LOOK, ctx, c, 'C', L.C.x - 28, L.cy);
    LOOK.badge.call(LOOK, ctx, c, 'A', L.A.x + 26, L.A.y - 8); LOOK.badge.call(LOOK, ctx, c, 'B', L.B.x + 26, L.B.y + 8);
    // earlier stops this round, faint
    for (const x of this._marks) if (!(this._st === 'out' && x === this._marks[this._marks.length - 1])) LOOK.stopMark.call(LOOK, ctx, c, L, x - L.R, 0.35);
    // the stack: against the band, pushed back to C, then the slide (CoinStackScene's slide())
    let p = PB;
    if (age >= 0 && kind) {
      const back = ease(age, 0.3, 0.9), m = LOOK.slide.call(LOOK, age - TR, kind);
      p = age < TR ? PB * (1 - back) : m.p;
    }
    const back = L.C.x + p;
    LOOK.band.call(LOOK, ctx, c, L, Math.min(back, L.BX));
    LOOK.hand.call(LOOK, ctx, c, L);
    LOOK.stack.call(LOOK, ctx, c, back + L.R, L.cy, L.R, 1);
    if (run) {
      const lift = ease(age, 1.35, 0.35);
      if (lift < 1 && age > 0) LOOK.pusher.call(LOOK, ctx, c, back + 2 * L.R + 2 + 30 * lift, L.cy - 40 * lift, (1 - lift) * clamp01(age / 0.25));
    }
    if (kind && !run && this._st !== 'pick') LOOK.stopMark.call(LOOK, ctx, c, L, back, 1);
    if (kind) drawTag(ctx, c, NAME[kind], 400, L.y + L.h + 24, { size: 26, col: c.label });
  }

  checkObjective() { return this._round >= ROUNDS.length ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
