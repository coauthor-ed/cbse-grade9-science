/**
 * SonarSurveyGame - mini-game for L07 (blk-l07-n02). Rebuilt 2026-11-03 (whole file; the old drag-panel game is
 * replaced by a GameFrame board).
 *
 * A sea in cross-section (SoundArt drawSeaCut) with an uneven sea bed and a survey ship with sonar (drawShip).
 * Three marked spots A, B, C on the surface. Move the ship to a spot, press Ping: a pulse goes down from the
 * sonar to the sea bed and back (1500 m/s in sea water, shown SLOW times slower) and the echo time appears
 * ("1.2 s"). Then pick the depth from four choices: right = 1500 x time / 2 (the marker sticks: a depth line to
 * the bed with its value); the not-halved answer gets "The echo time is there and back: halve it first."
 * Any wrong choice is greyed out and the others stay, so the learner can always win. The sea bed is built
 * through the three true depths (900, 1500, 1200 m), so the pulse really turns at the drawn bed.
 * Won after three right depths: finishGame, Quill hops once. No timer, no lives.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, pill, chipSize, alpha, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawOutAndBack, outAndBack } from 'simulations/base/kit/SimWave.js';
import { drawSeaCut, drawShip } from '../shared/SoundArt.js';

const V_SEA = 1500, SLOW = 1.5, DMAX = 1800, DPR = 2, MOVE = 0.7;
const X = '\u00d7', DIV = '\u00f7';
// echo time t (s) at each spot; depth = 1500 t / 2; choices hold the answer, the not-halved one and two more
const SPOTS = [
  { name: 'A', u: 0.2, t: 1.2, choices: [450, 900, 1050, 1800] },
  { name: 'B', u: 0.52, t: 2.0, choices: [1350, 3000, 750, 1500] },
  { name: 'C', u: 0.82, t: 1.6, choices: [1200, 600, 2400, 1350] },
];
const depthOf = (s) => V_SEA * s.t / 2;
// sea bed depth as a fraction of DMAX, through the three true depths
const BED = [[0, 0.42], [0.2, 900 / DMAX], [0.36, 0.64], [0.52, 1500 / DMAX], [0.68, 0.75], [0.82, 1200 / DMAX], [1, 0.55]];
function bed(u) {
  for (let i = 1; i < BED.length; i++) {
    const [u0, v0] = BED[i - 1], [u1, v1] = BED[i];
    if (u <= u1) { const k = (1 - Math.cos(Math.PI * (u - u0) / (u1 - u0))) / 2; return v0 + (v1 - v0) * k; }
  }
  return BED[BED.length - 1][1];
}

const CSS = `
.ss .body { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 262px; gap: 14px; }
.ss .stage { position: relative; min-height: 0; border: var(--sim-border); border-radius: var(--sim-radius-md, 10px); overflow: hidden; background: var(--sim-bg-surface); }
.ss .stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.ss .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.ss .ctl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
.ss .ctl .btn { min-height: 48px; font-size: 17px; font-weight: 800; padding: 4px 8px; }
.ss .ctl .wide { grid-column: 1 / -1; }
.ss .go { background: var(--sim-accent); border-color: var(--sim-accent); color: var(--sim-bg-deep); }
.ss .ch { font-family: var(--sim-font-display); font-size: 18px; }
.ss .ch:disabled, .ss .btn:disabled { opacity: 0.45; cursor: default; }
.ss .ch[data-v="bad"] { border-color: var(--sim-bad); text-decoration: line-through; }
.ss .ch[data-v="good"] { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); opacity: 1; }
.ss .say { margin: 0; font-size: 16px; font-weight: 700; line-height: 1.3; min-height: 42px; }
.ss .say[data-k="good"] { color: var(--sim-good); }
.ss .say[data-k="miss"] { color: var(--sim-bad); }
.ss .round { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 16px; white-space: nowrap; margin-top: auto; }
.ss .dots { display: flex; gap: 6px; }
.ss .dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--sim-stroke); background: var(--sim-bg-surface); }
.ss .dot[data-on="1"] { background: var(--sim-good); border-color: var(--sim-good); }
.sim-dom-root--portrait .ss .body { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .ss .stage { flex: none; height: 232px; }
.sim-dom-root--portrait .ss .side { gap: 8px; }
.sim-dom-root--portrait .ss .ctl { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.sim-dom-root--portrait .ss .chs { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.sim-dom-root--portrait .ss .ctl .wide { grid-column: auto; }
.sim-dom-root--portrait .ss .ctl .btn { font-size: 16px; padding: 4px 2px; }
.sim-dom-root--portrait .ss .ch { font-size: 16px; }
.sim-dom-root--portrait .ss .say { min-height: 0; }
.sim-dom-root--portrait .ss .round { margin-top: 0; }
.sim-dom-root--portrait .ss .sub { padding-right: 62px; }
`;

export class SonarSurveyGame extends GameBoard {
  static ARIA_LABEL = 'A sea in cross-section with an uneven sea bed and a survey ship with sonar on the surface. '
    + 'Three spots, A, B and C, are marked on the surface. Move the ship to a spot and send a sonar ping: the pulse '
    + 'goes down to the sea bed and back in slow motion and the echo time is shown. Sound travels at 1500 metres '
    + 'per second in sea water. Pick the depth: 1500 times the echo time, divided by 2, because the time is there '
    + 'and back. A right depth stays marked on the sea bed. Mark all three spots to finish.';
  static OBJECTIVE = { prompt: { en: 'Send sonar pings from the ship, read each echo time, and mark the depth of the sea bed at three places.' } };

  constructor(container, config) {
    super(container, config);
    this.at = 0;
    this.fromAt = 0;
    this.moveAt = null;
    this.pingAt = null;
    this.done = [false, false, false];
    this.bad = [new Set(), new Set(), new Set()];
    this.allWon = false;
    this.anim = 0;
    this.probeOut = null;
    this.frameFn = () => { this.anim = 0; this.sync(); this.paint(); if (this.busy()) this.anim = requestAnimationFrame(this.frameFn); };
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      onResize: () => this.paint(),
      html: `<div class="gm ss">
        <div class="gm-head"><p class="kicker">Sonar survey</p><h2>How deep is the <b>sea bed</b>?</h2>
          <p class="sub">Sound travels 1500 m/s in sea water. Ping, then pick the depth.</p></div>
        <div class="body"><div class="stage"><canvas aria-hidden="true"></canvas></div>
          <div class="side">
            <div class="ctl"><button type="button" class="tap btn left">Move left</button><button type="button" class="tap btn right">Move right</button>
              <button type="button" class="tap btn go wide ping">Ping</button></div>
            <div class="ctl chs">${[0, 1, 2, 3].map((i) => `<button type="button" class="tap btn ch" data-i="${i}"></button>`).join('')}</div>
            <p class="say" aria-live="polite"></p>
            <div class="round"><span class="rtxt" aria-live="polite"></span><span class="dots">${SPOTS.map(() => '<span class="dot"></span>').join('')}</span></div>
          </div></div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.ping')) return;
    onTap(q('.left'), () => this.move(-1));
    onTap(q('.right'), () => this.move(1));
    onTap(q('.ping'), () => this.ping());
    this.root.querySelectorAll('.ch').forEach((el) => onTap(el, () => this.choose(+el.dataset.i)));
    this.say('Ping at spot A.', '');
    this.sync();
    this.paint();
    this.quill?.speak('Ping, then read the echo time.', 4000);
  }

  /** Seconds since the page started (one method, so a probe can pin a frame). */
  nowS() { return performance.now() / 1000; }

  get spot() { return SPOTS[this.at]; }
  get moving() { return this.moveAt != null && this.nowS() - this.moveAt < MOVE; }
  /** The echo is back at this spot (ping finished), so the time can be read. */
  get echoBack() { return this.pingAt != null && this.nowS() - this.pingAt >= this.spot.t * SLOW + 0.15; }

  say(text, k) { const s = this.root.querySelector('.say'); s.textContent = text; s.dataset.k = k; }

  /** Buttons follow the state: choices only once the echo time is known at a spot not yet marked. */
  sync() {
    const q = (s) => this.root.querySelector(s);
    if (!q('.ping')) return;
    q('.left').disabled = this.at <= 0;
    q('.right').disabled = this.at >= SPOTS.length - 1;
    q('.left').setAttribute('aria-label', 'Move the ship left');
    q('.right').setAttribute('aria-label', 'Move the ship right');
    const s = this.spot, open = this.echoBack && !this.done[this.at];
    this.root.querySelectorAll('.ch').forEach((el, i) => {
      const v = s.choices[i];
      el.textContent = `${v} m`;
      el.setAttribute('aria-label', `Depth ${v} metres at spot ${s.name}`);
      const bad = this.bad[this.at].has(i), good = this.done[this.at] && v === depthOf(s);
      el.dataset.v = good ? 'good' : bad ? 'bad' : '';
      el.disabled = !open || bad;
    });
    q('.rtxt').textContent = `Spot ${s.name}: ${this.done.filter(Boolean).length} of 3 marked`;
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = this.done[i] ? '1' : '0'; });
  }

  move(step) {
    const to = Math.max(0, Math.min(SPOTS.length - 1, this.at + step));
    if (to === this.at || this.allWon) return;
    this.fromAt = this.at;
    this.at = to;
    this.moveAt = this.nowS();
    this.pingAt = null;
    this.say(this.done[to] ? `Spot ${SPOTS[to].name} is marked.` : `Ping at spot ${SPOTS[to].name}.`, '');
    this.sync();
    this.kick();
  }

  ping() {
    if (this.moving || this.allWon) return;
    this.pingAt = this.nowS();
    this.say('', '');
    this.sync();
    this.kick();
  }

  choose(i) {
    const s = this.spot, v = s.choices[i];
    if (!this.echoBack || this.done[this.at] || this.bad[this.at].has(i)) return;
    if (v === depthOf(s)) {
      this.done[this.at] = true;
      const left = SPOTS.filter((_, j) => !this.done[j]).map((p) => p.name);
      this.say(`Right: 1500 ${X} ${s.t.toFixed(1)} ${DIV} 2 = ${v} m.${left.length ? ` Now spot ${left[0]}.` : ''}`, 'good');
      if (!left.length) {
        this.allWon = true;
        finishGame(this);
        this.quill?.perform('hop');
      } else this.quill?.speak('Depth marked.', 2000);
    } else {
      this.bad[this.at].add(i);
      this.say(v === V_SEA * s.t ? 'The echo time is there and back: halve it first.'
        : `Depth = 1500 m/s ${X} ${s.t.toFixed(1)} s ${DIV} 2. Try again.`, 'miss');
    }
    this.sync();
    this.paint();
  }

  kick() { if (!this.anim) this.anim = requestAnimationFrame(this.frameFn); }

  busy() {
    if (this.moving) return true;
    return this.pingAt != null && this.nowS() - this.pingAt < this.spot.t * SLOW + 0.4;
  }

  layout(W, H) {
    const narrow = W < 500;
    const SY = narrow ? 84 : 124, bottom = H - 2, len = narrow ? 96 : 136;   // mast top clears the spot chips
    return { narrow, SY, bottom, len, k: len / 260, fs: narrow ? 14 : 22, pxd: (bottom - SY) / DMAX, sx: (u) => u * W };
  }

  paint() {
    const cv = this.root?.querySelector('.stage canvas');
    if (!cv) return;
    const W = Math.max(260, Math.round(cv.parentElement.clientWidth || 600));
    const H = Math.max(200, Math.round(cv.parentElement.clientHeight || 270));
    cv.width = W * DPR; cv.height = H * DPR;
    this.colors = this.colors || loadColors(this.root);
    const ctx = cv.getContext('2d'), c = this.colors, L = this.layout(W, H);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, L.SY);
    sky.addColorStop(0, alpha(c.water, 0.14)); sky.addColorStop(1, c.bgSurface);
    ctx.fillStyle = c.bgSurface; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, L.SY);
    const sea = drawSeaCut(ctx, c, { x: 0, w: W, y: L.SY, bottom: L.bottom, bed, rocks: true, t: 0 });
    // spot tags in the sky; marked spots keep their depth line and bed point
    SPOTS.forEach((s, i) => {
      const x = L.sx(s.u);
      if (this.done[i]) this.marker(ctx, c, L, x, sea.seabedY(x), `${depthOf(s)} m`);
      pill(ctx, c, s.name, x, L.narrow ? 14 : 20, { bg: this.done[i] ? c.good : i === this.at ? c.s2 : c.raised, size: L.fs, display: true });
    });
    if (this.done.every(Boolean)) this.profile(ctx, c, L, sea);
    // the ship: its sonar sits over the spot it is at (eased between spots)
    const m = this.moveAt == null ? 1 : inOutSine(Math.min(1, (this.nowS() - this.moveAt) / MOVE));
    const tx = L.sx(SPOTS[this.fromAt].u) + (L.sx(SPOTS[this.at].u) - L.sx(SPOTS[this.fromAt].u)) * m;
    const ship = drawShip(ctx, c, { x: tx - 22 * L.k, y: L.SY, len: L.len, dir: 1, sonar: true });
    const out = { at: this.at, x: +tx.toFixed(1) };
    if (this.pingAt != null && !this.moving) {
      const a = this.nowS() - this.pingAt, p0 = ship.transducer, b = { x: p0.x, y: sea.seabedY(p0.x) };
      const start = 0.05, v = 2 * (b.y - p0.y) / (this.spot.t * SLOW);   // the drawn trip takes the true echo time (bed built from 1500 t / 2)
      const st = outAndBack({ a: p0, b, v, start }, a);
      drawOutAndBack(ctx, c, { a: p0, b, v, t: a, start, path: st.leg === 'done', R: L.narrow ? 12 : 16 });
      const real = Math.min(this.spot.t, Math.max(0, (a - start) / SLOW));
      const back = st.leg === 'done';
      // the time tag clears the pulse lanes (R plus its arcs) by its own half width
      const R = L.narrow ? 12 : 16, tw = chipSize(ctx, c, '0.0 s', L.fs + 2, true).w;
      const py = (p0.y + b.y) / 2, px = p0.x + (p0.x > W - 140 ? -1 : 1) * (R + (L.narrow ? 8 : 26) + tw / 2);
      pill(ctx, c, `${real.toFixed(1)} s`, px, py, { bg: back ? c.s2 : c.raised, size: L.fs + 2, display: true });
      if (!back) {
        // stacked over the time tag, on the same side of the pulse path, clear of the other spots' depth tags
        const sw = chipSize(ctx, c, 'slow motion', L.fs, true).w, side = p0.x > W - 140 ? -1 : 1;
        // phone: the sea is too narrow for it there, so it sits in the sky on the side away from the ship
        const sx = L.narrow ? (p0.x > W / 2 ? sw / 2 + 6 : W - sw / 2 - 6) : Math.max(sw / 2 + 6, Math.min(W - sw / 2 - 6, p0.x + side * (R + 20 + sw / 2)));
        pill(ctx, c, 'slow motion', sx, L.narrow ? 52 : py - 42, { bg: c.raised, size: L.fs, display: true });
      }
      out.leg = st.leg; out.real = +real.toFixed(3); out.bedY = +b.y.toFixed(1);
    }
    this.probeOut = out;
  }

  /** A marked depth: dashed line from the surface to the bed, a point on the bed, the value beside the line. */
  marker(ctx, c, L, x, y, text) {
    ctx.save(); ctx.strokeStyle = c.good; ctx.lineWidth = 3; ctx.setLineDash([7, 5]);
    const ty = y - (L.narrow ? 22 : 30), top = Math.min(ty - 18, L.SY + 4);
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, ty - 16); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = c.good; ctx.strokeStyle = c.bgSurface; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, L.narrow ? 6 : 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    pill(ctx, c, text, x, ty, { bg: c.good, size: L.fs, display: true });
  }

  /** All three marked: the survey line joining the marked points. */
  profile(ctx, c, L, sea) {
    const pts = SPOTS.map((s) => { const x = L.sx(s.u); return { x, y: sea.seabedY(x) }; });
    ctx.save(); ctx.strokeStyle = alpha(c.good, 0.9); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    ctx.restore();
  }

  refreshTheme() { if (this.root?.querySelector('.stage canvas')) { this.colors = loadColors(this.root); this.paint(); } }

  resetChallenge() {
    super.resetChallenge?.();
    this.at = 0; this.fromAt = 0; this.moveAt = null; this.pingAt = null;
    this.done = [false, false, false];
    this.bad = [new Set(), new Set(), new Set()];
    this.allWon = false;
    if (this.root?.querySelector('.ping')) { this.say('Ping at spot A.', ''); this.sync(); this.paint(); }
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }

  destroy() {
    if (this.anim) cancelAnimationFrame(this.anim);
    this.anim = 0;
    super.destroy();
  }
}
