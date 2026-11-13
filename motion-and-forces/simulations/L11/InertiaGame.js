/**
 * InertiaGame - mini-game blk-l13-game. Inside a bus (kit drawBus inside view) a passenger stands, one
 * hand on a strap (kit drawBusStander). The side panel asks for one way to lurch and offers what the bus
 * can do: a moving bus -> Brake suddenly / Speed up suddenly / Keep a steady speed; a bus at rest ->
 * Start suddenly / Stay at rest. A pick plays at once (2 s, compressed clock): the bus v arrow grows or
 * shrinks, an a arrow appears along the change (a dot "a = 0" when there is none), the road streams by the
 * distance travelled, and the passenger leans the physical way (eased 0.4 s): forward on braking,
 * backward on starting or speeding up, upright at a steady speed or at rest. Frames depend on the round,
 * the pick and the age of the pick only.
 *   right  "Right." plus what happened; Quill hops once; Next round.
 *   wrong  the lean still plays; one hint line names what happened; Try again.
 * Rounds from a fixed list: (1) moving, lurch forward (brake); (2) at rest, lurch backward (start);
 * (3) moving, stay upright (steady); (4) moving, lurch backward (speed up). No hint at landing.
 * Won after round 4 (finishGame). Keys: 1, 2, 3 pick a choice; Enter or Space on a focused button.
 * Test hooks: _pick(key) with key brake | speed | steady | start | rest; _go() = Next round / Try again /
 * Play again; _state() = one line. ASCII only.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { trackSpec, drawTrack } from 'simulations/base/kit/SimTrack.js';
import { drawBus, drawBusStander } from 'simulations/base/kit/SimVehicles.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';
import { LOOKS, drawMotionArrow } from '../shared/MotionCast.js';
import { drawTag } from '../shared/MotionGraph.js';

const W = 680, H = 340, GY = 304, LEN = 600, PXM = LEN / 12, LEAN = 0.24;
const V = 6, ACC = 3, T0 = 0.3, TA = 2.0, VPX = 14, APX = 30, AY = 22;   // m/s, m/s2, s; arrow px per m/s and per m/s2
const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const CHOICES = {
  moving: [['brake', 'Brake suddenly'], ['speed', 'Speed up suddenly'], ['steady', 'Keep a steady speed']],
  rest: [['start', 'Start suddenly'], ['rest', 'Stay at rest']],
};
// what each action does: acceleration sign (along the motion), lean, and the sentence that names it
const ACT = {
  brake: { a: -1, lean: 1, say: 'Braking makes the passenger lurch forward.' },
  speed: { a: 1, lean: -1, say: 'Speeding up makes the passenger lurch backward.' },
  steady: { a: 0, lean: 0, say: 'At a steady speed the passenger stays upright.' },
  start: { a: 1, lean: -1, say: 'Starting suddenly makes the passenger lurch backward.' },
  rest: { a: 0, lean: 0, say: 'A bus that stays at rest leaves the passenger upright.' },
};
const GOAL = { 1: 'lurch forward', '-1': 'lurch backward', 0: 'stay upright' };
const ROUNDS = [
  { bus: 'moving', want: 1 },
  { bus: 'rest', want: -1 },
  { bus: 'moving', want: 0 },
  { bus: 'moving', want: -1 },
];

const CSS = `
.gm.ig { gap: 6px; }
.ig .sub { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.ig .play { display: grid; grid-template-columns: 520px minmax(0, 1fr); gap: 18px; align-items: start; flex: 1; min-height: 0; }
.ig canvas { display: block; width: 100%; height: auto; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); box-sizing: border-box; }
.ig .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; max-width: 460px; margin-top: 8px; padding: 12px 14px;
            background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg, 12px); }
.ig .goal { margin: 0; font: 800 20px/1.25 var(--sim-font-display); }
.ig .goal b { color: var(--sim-series-2-ink); }
.ig .state { margin: 0; font-size: 16px; font-weight: 700; color: var(--sim-label-muted); }
.ig .picks { display: flex; flex-direction: column; gap: 8px; }
.ig .picks .tap, .ig .acts .tap { min-height: 48px; display: flex; align-items: center; justify-content: center; font-size: 17px; }
.ig .picks .tap[data-on="1"] { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.ig .acts { display: flex; }
.ig .acts .tap { min-width: 170px; }
.ig .acts:empty, .ig .picks:empty { display: none; }
.ig .why { margin: 0; font-size: 16px; line-height: 1.3; font-weight: 700; }
.ig .why:empty { display: none; }
.ig .why[data-k="bad"] { color: var(--sim-bad); }
.sim-dom-root--portrait .ig .play { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .ig .side { margin-top: 0; padding: 10px; max-width: none; }
.sim-dom-root--portrait .ig .goal { font-size: 18px; }
.sim-dom-root--portrait .ig .acts .tap { min-width: 0; flex: 1; }
.sim-dom-root--portrait .ig .why { font-size: 15px; }
`;

export class InertiaGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'A passenger stands in a bus. Choose what the bus does, so that the passenger lurches the way that is asked.' } };
  static ARIA_LABEL = 'Inside a bus a passenger stands holding a strap. Each round asks for one way to lurch: forward, backward, or staying upright. Choose what the bus does: when it is moving, brake suddenly, speed up suddenly or keep a steady speed; when it is at rest, start suddenly or stay at rest. The bus does it and the passenger leans: forward when the bus brakes, backward when it starts or speeds up, upright at a steady speed or at rest. Four rounds.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false, onResize: () => this._paint(),
      html: `<div class="gm ig"><div class="gm-head"><h2 class="sub" aria-live="polite"></h2></div>
        <div class="play"><div class="left"><canvas aria-hidden="true"></canvas></div>
        <div class="side"><p class="goal"></p><p class="state"></p><div class="picks"></div>
        <div class="acts"></div><p class="why" aria-live="polite"></p></div></div></div>`,
    });
    this.root.querySelector('.ig')?.addEventListener('keydown', (e) => {
      const i = { 1: 0, 2: 1, 3: 2 }[e.key];
      const ch = CHOICES[this._rd().bus][i];
      if (ch && !this._act) { e.preventDefault(); this._pick(ch[0]); }
    });
    this._render();
  }

  _reset() { this._round = 0; this._load(); }
  _load() { this._act = null; this._ok = false; this._t0 = null; this._age = 0; }
  _rd() { return ROUNDS[Math.min(this._round, ROUNDS.length - 1)]; }

  /** Pick what the bus does. The verdict is known at once; the lean plays over TA s. */
  _pick(key) {
    if (this._act || this._round >= ROUNDS.length) return;
    if (!CHOICES[this._rd().bus].some(([k]) => k === key)) return;
    this._act = key;
    const right = ACT[key].lean === this._rd().want;
    if (right) {
      this._ok = true;
      this._cheer();
      if (this._round === ROUNDS.length - 1) { this._round = ROUNDS.length; finishGame(this); }
    }
    this._t0 = performance.now(); this._animate();
    this._render();
  }

  /** Next round after a win, Try again after a miss, Play again at the end. */
  _go() {
    if (this._round >= ROUNDS.length) { this._reset(); this._render(); return; }
    if (!this._act) return;
    if (this._ok) this._round += 1;
    this._load(); this._render();
  }

  /** The find: once per round, from the right-answer branch only. */
  _cheer() { this.quill?.perform('hop'); }

  _state() {
    const r = this._rd(), done = this._round >= ROUNDS.length;
    return `round ${Math.min(this._round + 1, ROUNDS.length)}/${ROUNDS.length} bus ${r.bus} goal ${GOAL[r.want]} pick ${this._act ?? '-'} verdict ${this._act ? (this._ok ? 'right' : 'wrong') : '-'}${done ? ' won' : ''}`;
  }

  _animate() {
    cancelAnimationFrame(this._raf);
    const step = (now) => {
      this._age = Math.min(TA, (now - this._t0) / 1000);
      this._paint();
      if (this._age < TA) this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  }

  _render() {
    const root = this.root, g = root?.querySelector('.gm');
    if (!g) return;
    const done = this._round >= ROUNDS.length, r = this._rd(), act = this._act;
    root.querySelector('.sub').textContent = done ? 'All four rounds done.' : `Round ${this._round + 1} of ${ROUNDS.length}`;
    root.querySelector('.goal').innerHTML = `Make the passenger <b>${GOAL[r.want]}</b>.`;
    root.querySelector('.state').textContent = r.bus === 'moving' ? 'The bus is moving at a steady speed.' : 'The bus is at rest.';
    const picks = root.querySelector('.picks');
    picks.innerHTML = act ? '' : CHOICES[r.bus].map(([k, t], i) => `<div class="tap btn" role="button" tabindex="0" data-k="${k}" aria-keyshortcuts="${i + 1}">${t}</div>`).join('');
    for (const el of picks.querySelectorAll('.tap')) onTap(el, () => this._pick(el.dataset.k));
    const acts = root.querySelector('.acts');
    acts.innerHTML = act ? `<div class="tap btn gm-check ig-go" role="button" tabindex="0">${done ? 'Play again' : this._ok ? 'Next round' : 'Try again'}</div>` : '';
    const go = acts.querySelector('.ig-go');
    if (go) onTap(go, () => this._go());
    const w = root.querySelector('.why');
    w.textContent = act ? (this._ok ? `Right. ${ACT[act].say}` : ACT[act].say) : '';
    w.dataset.k = this._ok ? 'good' : 'bad';
    if (act === null) this._age = 0;
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

  /** Bus speed (m/s), metres travelled and lean (radians, + toward the nose) at age t of action key. */
  _motion(key, t) {
    const r = this._rd(), v0 = r.bus === 'moving' ? V : 0, A = key ? ACT[key] : { a: 0, lean: 0 };
    const u = Math.max(0, t - T0), du = Math.min(u, TA - T0);
    const acc = A.a * ACC, v = Math.max(0, v0 + acc * du);
    const x = v0 * t + 0.5 * acc * du * du;
    return { v, x, acc, lean: A.lean * LEAN * ease(t, T0, 0.4), on: u > 0 };
  }

  _paint() {
    const cv = this.root?.querySelector('canvas');
    if (!cv) return;
    const c = loadColors(this.root), ctx = this._ctx(cv), t = this._act ? this._age : 0;
    const m = this._motion(this._act, t);
    // the road streams back by the distance travelled; the bus stays put on the board
    const spec = trackSpec({ from: 0, to: (W + 40) / PXM, x0: -20, x1: W + 20, y: GY });
    drawTrack(ctx, c, spec, { kind: 'road', depth: H - GY, ticks: false, origin: null, scroll: m.x });
    const bus = drawBus(ctx, c, { x: W / 2, y: GY, length: LEN, roll: m.x, inside: true, lean: m.lean, ground: false });
    // upright reference: a faint dashed line up from the feet, so the lean reads at a glance
    const Q = bus.anchors, kl = Math.min(1, Math.abs(m.lean) / LEAN);
    if (kl > 0.02) {
      ctx.save(); ctx.globalAlpha *= 0.7 * kl; ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 2.5; ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.moveTo(Q.standing.x, Q.standing.y); ctx.lineTo(Q.standing.x, Q.standing.y - 1.08 * Q.figureHeight); ctx.stroke(); ctx.restore();
    }
    drawBusStander(ctx, c, bus, figureLook(c, { ...LOOKS.passenger }));
    // the bus's velocity and acceleration, above the roof; names on chips left of each arrow
    const vx = 96;
    if (m.v > 0.05) drawMotionArrow(ctx, c, 'v', vx, AY, { length: m.v * VPX, label: '' });
    else drawMotionArrow(ctx, c, 'v', vx + 4, AY, { length: 0, label: '' });
    drawTag(ctx, c, m.v > 0.05 ? 'v' : 'v = 0', vx - 14, AY, { size: 26, col: c.s1, align: 'right', prefer: [[0, 0]] });
    if (this._act && m.on) {
      const k = ease(t, T0, 0.25), ax = 470, al = ACC * APX;
      if (m.acc !== 0) drawMotionArrow(ctx, c, 'a', m.acc > 0 ? ax : ax + al, AY, { length: al, angle: m.acc > 0 ? 0 : Math.PI, label: '', alpha: k });
      else drawMotionArrow(ctx, c, 'a', ax + 4, AY, { length: 0, label: '', alpha: k });
      drawTag(ctx, c, m.acc !== 0 ? 'a' : 'a = 0', ax - 14, AY, { size: 26, col: c.s2ink ?? c.s2, align: 'right', alpha: k, prefer: [[0, 0]] });
    }
  }

  checkObjective() { return this._round >= ROUNDS.length ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._render(); }
  destroy() { cancelAnimationFrame(this._raf); super.destroy(); }
}
