/**
 * EquationGame - mini-game blk-l07-game. Four car problems from a fixed list. Each gives three
 * quantities (chips in the L07 tones: u, v, a, t, s) and asks for a fourth. Step 1: pick the
 * equation that links them (three cards). A wrong pick gets one line naming what is missing.
 * Step 2: pick the answer from three pills. After each win a car on a road strip does the motion
 * once (compressed to about 2.5 s) and stops on the answer. Won after problem 4 (finishGame).
 *   1  u 10 m/s, a 3 m/s2, t 4 s; find v -> v = u + at = 22 m/s
 *   2  u 5 m/s, a 2 m/s2, t 4 s; find s -> s = ut + 1/2 at2 = 36 m
 *   3  u 0, a 10 m/s2, s 20 m; find v -> v2 = u2 + 2as, v = 20 m/s
 *   4  u 15 m/s, v 0, a -4 m/s2; find s -> v2 = u2 + 2as, s = 28.1 m
 * No hint at landing. Canvas drawing depends only on the problem and the replay time. ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack, drawScale } from 'simulations/base/kit/SimTrack.js';
import { drawCar } from 'simulations/base/kit/SimVehicles.js';
import { drawTag } from '../shared/MotionGraph.js';

const SUP2 = '\u00b2', MINUS = '-';
const TONE = { u: 5, v: 1, a: 2, t: 6, s: 4 };
// Equation cards: the quantities each one links.
const EQS = [
  { id: 1, vars: ['v', 'u', 'a', 't'] },
  { id: 2, vars: ['s', 'u', 't', 'a'] },
  { id: 3, vars: ['v', 'u', 'a', 's'] },
];
const ROUNDS = [
  { text: 'A car moving at 10 m/s speeds up for 4 s. How fast is it going then?',
    known: { u: '10 m/s', a: '3 m/s' + SUP2, t: '4 s' }, find: 'v', eq: 1, pills: ['22', '13', '34'], ans: '22', unit: 'm/s',
    work: 'v = 10 + 3 x 4 = 22 m/s', T: 4, x: (t) => 10 * t + 1.5 * t * t, v: (t) => 10 + 3 * t },
  { text: 'A car moving at 5 m/s speeds up for 4 s. How far does it go in that time?',
    known: { u: '5 m/s', a: '2 m/s' + SUP2, t: '4 s' }, find: 's', eq: 2, pills: ['28', '36', '52'], ans: '36', unit: 'm',
    work: 's = 5 x 4 + 1/2 x 2 x 4' + SUP2 + ' = 20 + 16 = 36 m', T: 4, x: (t) => 5 * t + t * t, v: (t) => 5 + 2 * t },
  { text: 'A car starts from rest and speeds up over 20 m. How fast is it going at the end?',
    known: { u: '0 m/s', a: '10 m/s' + SUP2, s: '20 m' }, find: 'v', eq: 3, pills: ['400', '20', '200'], ans: '20', unit: 'm/s',
    work: 'v' + SUP2 + ' = 0 + 2 x 10 x 20 = 400, so v = 20 m/s', T: 2, x: (t) => 5 * t * t, v: (t) => 10 * t },
  { text: 'A car moving at 15 m/s brakes until it stops. How far does it go while braking?',
    known: { u: '15 m/s', v: '0 m/s', a: MINUS + '4 m/s' + SUP2 }, find: 's', eq: 3, pills: ['3.75', '56.3', '28.1'], ans: '28.1', unit: 'm',
    work: '0 = 15' + SUP2 + ' + 2 x (' + MINUS + '4) x s, so s = 225 / 8 = 28.1 m', T: 3.75, x: (t) => 15 * t - 2 * t * t, v: (t) => 15 - 4 * t },
];
const RW = 600, RH = 190, REPLAY = 2.5;

const sym = (ch) => `<i class="s${TONE[ch]}">${ch}</i>`;
const op = (o) => `<b class="op">${o}</b>`;
const eqHtml = (id) => {
  if (id === 1) return `${sym('v')}${op('=')}${sym('u')}${op('+')}${sym('a')}${sym('t')}`;
  if (id === 2) return `${sym('s')}${op('=')}${sym('u')}${sym('t')}${op('+')}<span class="fr"><span>1</span><span>2</span></span>${sym('a')}${sym('t')}<sup>2</sup>`;
  return `${sym('v')}<sup>2</sup>${op('=')}${sym('u')}<sup>2</sup>${op('+')}2${sym('a')}${sym('s')}`;
};

const CSS = `
.gm.eg { gap: 6px; }
.eg .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.eg .play { display: grid; grid-template-columns: 520px minmax(0, 1fr); gap: 18px; align-items: start; flex: 1; min-height: 0; }
.eg .left, .eg .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.eg .q { margin: 0; font-size: 17px; font-weight: 700; line-height: 1.3; }
.eg .chips { display: flex; flex-wrap: wrap; gap: 6px; }
.eg .chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; font-size: 16px; font-weight: 800;
            background: var(--sim-bg-surface); border: calc(2px * var(--look-rim, 1)) solid var(--c); }
.eg .chip i { font-style: normal; font-family: var(--sim-font-display); font-size: 19px; color: var(--ci); }
.eg .chip[data-find="1"] { border-style: dashed; }
.eg .eqs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.eg .eq { display: flex; align-items: center; justify-content: center; white-space: nowrap; font: 800 19px/1 var(--sim-font-display); padding: 6px 4px; }
.eg .eq[data-st="good"] { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 12%, var(--sim-bg-surface)); }
.eg .eq[data-st="bad"] { border-color: var(--sim-bad); }
.eg i { font-style: normal; }
.eg .op { font-weight: 800; margin: 0 0.28em; color: var(--sim-label); }
.eg .s1 { --c: var(--sim-series-1); --ci: var(--sim-series-1-ink); color: var(--sim-series-1-ink); }
.eg .s2 { --c: var(--sim-series-2); --ci: var(--sim-series-2-ink); color: var(--sim-series-2-ink); }
.eg .s4 { --c: var(--sim-series-4); --ci: var(--sim-series-4-ink); color: var(--sim-series-4-ink); }
.eg .s5 { --c: var(--sim-series-5); --ci: var(--sim-series-5-ink); color: var(--sim-series-5-ink); }
.eg .s6 { --c: var(--sim-series-6); --ci: var(--sim-series-6-ink); color: var(--sim-series-6-ink); }
.eg .chip.s1, .eg .chip.s2, .eg .chip.s4, .eg .chip.s5, .eg .chip.s6 { color: var(--sim-label); }
.eg sup { font-size: 0.7em; line-height: 0; vertical-align: 0.7em; }
.eg .fr { display: inline-flex; flex-direction: column; align-items: center; font-size: 0.74em; line-height: 1; margin: 0 2px; }
.sim-dom-root:not(.sim-dom-root--portrait) .eg sup { font-size: 0.82em; }
.sim-dom-root:not(.sim-dom-root--portrait) .eg .fr { font-size: 0.84em; }
.eg .fr span:first-child { border-bottom: 2px solid currentColor; padding: 0 1px; }
.eg .road canvas { display: block; width: 100%; height: auto; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; }
.eg .pills { display: flex; gap: 8px; }
.eg .pill { flex: 1 1 0; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; }
.eg .pill[data-st="good"] { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 12%, var(--sim-bg-surface)); }
.eg .pill[data-st="bad"] { border-color: var(--sim-bad); }
.eg .pills[hidden] { display: none; }
.eg .step:empty { display: none; }
.eg .step { margin: 0; font-size: 15px; font-weight: 700; color: var(--sim-label-muted); }
.eg .why { margin: 0; min-height: 44px; font-size: 16px; line-height: 1.3; font-weight: 700; }
.eg .why[data-k="bad"] { color: var(--sim-bad); }
.eg .eg-next { display: none; align-items: center; justify-content: center; min-width: 190px; align-self: flex-start; }
.eg[data-won="1"] .eg-next { display: flex; }
.sim-dom-root--portrait .eg .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .eg .q { font-size: 16px; padding-right: 54px; }
.sim-dom-root--portrait .eg .eqs { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .eg .eq { font-size: 20px; }
.sim-dom-root--portrait .eg .pills { gap: 6px; }
.sim-dom-root--portrait .eg .pill { font-size: 15px; white-space: nowrap; padding: 6px 4px; }
.sim-dom-root--portrait .eg .why { font-size: 15px; }
.sim-dom-root--portrait .eg .eg-next { width: 100%; }
`;

export class EquationGame extends GameBoard {
  static HEIGHT = 380;
  static OBJECTIVE = { prompt: { en: 'Each car problem gives three quantities and asks for a fourth. Pick the equation that links them, then find the answer.' } };
  static ARIA_LABEL = 'Four car problems. Each shows three known quantities and the one to find. First pick the equation that links them from three cards: v = u + at, s = ut + one half a t squared, and v squared = u squared + 2as. Then pick the answer from three choices. After a right answer a car on a road does the motion.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm eg"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="left"><p class="q"></p><div class="chips"></div>
        <p class="step s-1">Step 1: pick the equation that links them.</p>
        <div class="eqs">${EQS.map((e) => `<div class="tap btn eq" role="button" tabindex="0" data-id="${e.id}">${eqHtml(e.id)}</div>`).join('')}</div>
        <p class="step s-2"></p><div class="pills"></div></div>
        <div class="side"><div class="road"><canvas class="r" aria-hidden="true"></canvas></div>
        <p class="why" aria-live="polite"></p>
        <div class="tap btn eg-next" role="button" tabindex="0">Next problem</div></div></div></div>`,
    });
    this.root.querySelectorAll('.eq').forEach((el) => onTap(el, () => this._pick(+el.dataset.id)));
    const next = this.root.querySelector('.eg-next');
    if (next) onTap(next, () => this._next());
    this._render();
  }

  _reset() { this._round = 0; this._load(); }

  _load() {
    this._eq = 0; this._eqBad = 0; this._pill = ''; this._pillBad = ''; this._won = false;
    this._line = ''; this._bad = false; this._t0 = 0;
  }

  _rd() { return ROUNDS[Math.min(this._round, ROUNDS.length - 1)]; }

  _pick(id) {
    if (this._eq || this._round >= ROUNDS.length) return;
    const r = this._rd(), E = EQS.find((e) => e.id === id);
    if (id === r.eq) { this._eq = id; this._eqBad = 0; this._bad = false; this._line = ''; this._render(); return; }
    this._eqBad = id; this._bad = true;
    const missing = E.vars.filter((q) => q !== r.find && !r.known[q]);
    this._line = !E.vars.includes(r.find) ? `This one has no ${r.find} in it.` : `This one needs ${missing[0]}, which you do not have.`;
    this._render();
  }

  _answer(p) {
    if (!this._eq || this._won) return;
    const r = this._rd();
    if (p === r.ans) {
      this._pill = p; this._pillBad = ''; this._won = true; this._bad = false;
      this._line = `Right: ${r.work}.`;
      this._t0 = performance.now(); this._animate();
      if (this._round === ROUNDS.length - 1) { this._round = ROUNDS.length; finishGame(this); }
    } else {
      this._pillBad = p; this._bad = true;
      this._line = r.find === 'v' && r.eq === 3 ? `Not ${p}. The equation gives v${SUP2} first: take its square root.` : `Not ${p}. Put the numbers into the equation and work it out.`;
    }
    this._render();
  }

  _next() {
    if (this._round >= ROUNDS.length) { this._reset(); this._render(); this._paint(); return; }
    this._round += 1; this._load(); this._render();
  }

  _render() {
    const root = this.root, g = root?.querySelector('.gm');
    if (!g) return;
    const done = this._round >= ROUNDS.length, r = this._rd();
    g.dataset.won = this._won || done ? '1' : '0';
    const n = done ? ROUNDS.length : this._round + 1;
    root.querySelector('.sub').textContent = done ? 'All four problems solved.' : `Problem ${n} of 4`;
    root.querySelector('.q').textContent = r.text;
    const chip = (ch, val, find) => `<span class="chip s${TONE[ch]}"${find ? ' data-find="1"' : ''}><i>${ch}</i>${find ? '= ?' : '= ' + val}</span>`;
    root.querySelector('.chips').innerHTML = Object.entries(r.known).map(([k, v]) => chip(k, v, false)).join('') + chip(r.find, '', true);
    root.querySelectorAll('.eq').forEach((el) => {
      const id = +el.dataset.id;
      el.dataset.st = id === this._eq ? 'good' : id === this._eqBad ? 'bad' : '';
      el.setAttribute('aria-pressed', id === this._eq ? 'true' : 'false');
    });
    const s2 = root.querySelector('.s-2'), pills = root.querySelector('.pills');
    s2.textContent = this._eq ? `Step 2: pick ${r.find}.` : '';
    pills.hidden = !this._eq;
    pills.innerHTML = this._eq ? r.pills.map((p) => `<div class="tap btn pill" role="button" tabindex="0" data-p="${p}"
      data-st="${p === this._pill ? 'good' : p === this._pillBad ? 'bad' : ''}">${r.find} = ${p} ${r.unit}</div>`).join('') : '';
    pills.querySelectorAll('.pill').forEach((el) => onTap(el, () => this._answer(el.dataset.p)));
    const w = root.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    const next = root.querySelector('.eg-next');
    if (next) next.textContent = done ? 'Play again' : 'Next problem';
    this._paint();
    this.relayout?.();
  }

  _animate() {
    cancelAnimationFrame(this._raf);
    const step = () => {
      this._paint();
      if (performance.now() - this._t0 < REPLAY * 1000 + 50) this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
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

  /** The road: the car waits at 0 m; after a win it does the motion once and rests on the answer. */
  _paint() {
    const cv = this.root?.querySelector('canvas.r');
    if (!cv) return;
    const c = loadColors(this.root), ctx = this._ctx(cv, RW, RH), r = this._rd(), won = this._won || this._round >= ROUNDS.length;
    const end = r.x(r.T), to = end > 60 ? 80 : end > 30 ? 40 : 30;
    const spec = trackSpec({ from: -(to * 0.2 + 4), to, x0: 14, x1: RW - 30, y: 96 });   // room behind 0 m for the whole car
    const tr = drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 40 });
    drawScale(ctx, c, { vertical: false, at: tr.bottom + 12, p0: spec.toPx(0), p1: spec.toPx(to), from: 0, to, every: to >= 80 ? 20 : 10, side: 1, size: 28, arrow: false });
    const u = won ? Math.min(1, (performance.now() - this._t0) / (REPLAY * 1000)) : 0;
    const t = r.T * u, x = r.x(t), CAR = 96, nose = spec.toPx(x);
    drawCar(ctx, c, { x: nose - CAR / 2, y: 96, length: CAR, roll: x, tone: 3 });
    if (won && u >= 1) {
      const lab = r.find === 'v' ? `v = ${r.ans} m/s` : `s = ${r.ans} m`;
      drawTag(ctx, c, lab, Math.min(nose, RW - 100), 26, { col: c['s' + TONE[r.find] + 'ink'] ?? c.label, size: 26 });
    } else if (!won) {
      drawTag(ctx, c, `u = ${r.known.u}`, Math.max(nose, 90), 26, { col: c.s5ink ?? c.label, size: 26 });
    }
  }

  checkObjective() { return this._round >= ROUNDS.length ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
