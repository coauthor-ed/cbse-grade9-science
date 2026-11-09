/**
 * EchoArchitectGame - mini-game for L06 (blk-l06-s06). Rebuilt 2026-11-03 (whole file; the old canvas panel game
 * is replaced by a GameFrame board).
 *
 * Round 1: a student claps, a brick wall stands 5 m away. Step the wall nearer or farther (5, 10, 15, 17, 20,
 *   25, 30 m) and press Clap: the pulse goes out and back in slow motion (340 m/s, SLOW times slower), a time
 *   line above the ground marks 0.1 s and the echo time. The time line is drawn to the same scale as the ground
 *   (an echo time t sits above the wall that gives it, d = 340 t / 2), so the 0.1 s mark stands over 17 m.
 *   Won when a clap comes back at 0.1 s or later.
 * Round 2: the wall starts at 30 m. Bring it as near as it can be and still give an echo: won at 17 m.
 * Round 3: a hall (SoundArt drawHall) with a speaker on the stage. Toggle walls (bare / panels), seats (hard /
 *   cushioned), curtains (none / on), press Play: a short note, sound paths bouncing round the hall, and a
 *   fading trace on a time graph. Fade time = 3.0 s / (1 + absorption): panels 1.0, cushions 0.5, curtains 0.5.
 *   Won when the trace has faded by the target line (1.2 s): panels plus one more, or all three.
 * After round 3: finishGame, Quill hops once. No timer, no lives; every round can always be won.
 * People: SimFigure, ONE fixed stand pose, autoReach off; only the hands move (eased clap).
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, pill, chipSize, alpha, lighten, darken, mix, rr, drawShadow, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs, drawOutAndBack } from 'simulations/base/kit/SimWave.js';
import { drawSpeaker } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';
import { drawHall } from '../shared/SoundArt.js';

const V_AIR = 340, SLOW = 25, T0 = 0.4, ECHO = 0.1, DPR = 2;
const D = [5, 10, 15, 17, 20, 25, 30], DMAX = 30, NEAREST = 17;
const ROUNDS = [{ kind: 'wall', start: 0 }, { kind: 'wall', start: D.length - 1, nearest: true }, { kind: 'hall' }];
const NOTE = 0.4, TARGET = 1.2, TMAX = 3.2, BARE = 3.0;
const ABS = { panels: 1.0, cushioned: 0.5, curtains: 0.5 };
const X = '\u00d7';
const ramp = (a, t0, d) => Math.max(0, Math.min(1, (a - t0) / d));
const hash = (i) => { const s = Math.sin(i * 91.7 + 17.3) * 43758.5453; return s - Math.floor(s); };
const echoOf = (d) => 2 * d / V_AIR;
const fold = (v, lo, hi) => { const w = hi - lo, m = ((v - lo) % (2 * w) + 2 * w) % (2 * w); return lo + (m <= w ? m : 2 * w - m); };

const CSS = `
.ea .body { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 12px; }
.ea .stage { position: relative; min-height: 0; border: var(--sim-border); border-radius: var(--sim-radius-md, 10px); overflow: hidden; background: var(--sim-bg-surface); }
.ea .stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.ea .side { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ea .ctl { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
.ea .ctl .btn { min-height: 48px; font-size: 17px; font-weight: 800; padding: 4px 8px; }
.ea .ctl .wide { grid-column: 1 / -1; }
.ea .go { background: var(--sim-accent); border-color: var(--sim-accent); color: var(--sim-bg-deep); }
.ea .tog[aria-pressed="true"] { background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); border-color: var(--sim-good); }
.ea .wallc, .ea .hallc { display: none; }
.ea[data-mode="wall"] .wallc, .ea[data-mode="hall"] .hallc { display: grid; }
.ea .say { margin: 0; font-size: 17px; font-weight: 700; line-height: 1.3; min-height: 44px; }
.ea .say[data-k="good"] { color: var(--sim-good); }
.ea .say[data-k="miss"] { color: var(--sim-bad); }
.ea .acts { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; margin-top: auto; }
.ea .round { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 17px; white-space: nowrap; }
.ea .dots { display: flex; gap: 6px; }
.ea .dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--sim-stroke); background: var(--sim-bg-surface); }
.ea .dot[data-on="1"] { background: var(--sim-good); border-color: var(--sim-good); }
.ea .next { display: none; min-height: 48px; padding: 0 18px; font-weight: 800; font-size: 16px; }
.ea .next[data-on="1"] { display: inline-flex; align-items: center; }
.sim-dom-root--portrait .ea .body { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .ea .stage { flex: none; height: 226px; }
.sim-dom-root--portrait .ea[data-mode="hall"] .stage { height: 198px; }
.sim-dom-root--portrait .ea[data-mode="hall"] .side { gap: 6px; }
.sim-dom-root--portrait .ea .wallc { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.sim-dom-root--portrait .ea .wallc .wide { grid-column: auto; }
.sim-dom-root--portrait .ea .ctl .btn { font-size: 16px; padding: 4px 6px; }
.sim-dom-root--portrait .ea .say { min-height: 0; font-size: 16px; line-height: 1.22; }
.sim-dom-root--portrait .ea .side { gap: 8px; }
.sim-dom-root--portrait .ea .sub { padding-right: 0; }
.sim-dom-root--portrait .ea .acts .next { flex: 1 1 auto; justify-content: center; }
`;

export class EchoArchitectGame extends GameBoard {
  static ARIA_LABEL = 'A three-round game. A student claps in front of a brick wall. Step the wall nearer or farther, '
    + 'from 5 to 30 metres, and clap: the sound goes out to the wall and back in slow motion, and a time line shows '
    + 'when it returns, with 0.1 seconds marked. An echo needs the sound back at least 0.1 seconds after the clap. '
    + 'In round two, bring the wall as near as it can be and still give an echo. In round three, a hall with a '
    + 'speaker on the stage: choose bare walls or panels, hard or cushioned seats, and curtains, then play a note '
    + 'and watch how quickly the sound fades after the speaker stops.';
  static OBJECTIVE = { prompt: { en: 'Place the wall so the echo comes back at least 0.1 s after the clap. Then choose surfaces until the hall\'s sound fades quickly after the speaker stops.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.di = 0;
    this.pressAt = null;
    this.playAt = null;
    this.told = false;
    this.roundWon = false;
    this.allWon = false;
    this.hall = { panels: false, cushioned: false, curtains: false };
    this.anim = 0;
    this.probeOut = null;
    this.frameFn = () => { this.anim = 0; this.advance(); this.paint(); if (this.busy()) this.anim = requestAnimationFrame(this.frameFn); };
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      onResize: () => this.paint(),
      html: `<div class="gm ea" data-mode="wall">
        <div class="gm-head"><p class="kicker">Echo architect</p><h2 class="ttl"></h2><p class="sub"></p></div>
        <div class="body"><div class="stage"><canvas aria-hidden="true"></canvas></div>
          <div class="side">
            <div class="ctl wallc"><button type="button" class="tap btn near">Nearer</button><button type="button" class="tap btn far">Farther</button>
              <button type="button" class="tap btn go wide clap">Clap</button></div>
            <div class="ctl hallc"><button type="button" class="tap btn tog tw" aria-pressed="false"></button><button type="button" class="tap btn tog ts" aria-pressed="false"></button>
              <button type="button" class="tap btn tog tc" aria-pressed="false"></button><button type="button" class="tap btn go play">Play</button></div>
            <p class="say" aria-live="polite"></p>
            <div class="acts"><div class="round"><span class="rtxt" aria-live="polite"></span><span class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}</span></div>
              <button type="button" class="tap btn next">Next round</button></div>
          </div></div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.clap')) return;
    onTap(q('.near'), () => this.move(-1));
    onTap(q('.far'), () => this.move(1));
    onTap(q('.clap'), () => this.clap());
    onTap(q('.tw'), () => this.toggle('panels'));
    onTap(q('.ts'), () => this.toggle('cushioned'));
    onTap(q('.tc'), () => this.toggle('curtains'));
    onTap(q('.play'), () => this.play());
    onTap(q('.next'), () => this.nextRound());
    this.deal();
    this.quill?.speak('Clap and listen for the echo.', 4000);
  }

  get round() { return ROUNDS[this.roundNo]; }
  get d() { return D[this.di]; }
  get fadeTime() { const h = this.hall; return BARE / (1 + (h.panels ? ABS.panels : 0) + (h.cushioned ? ABS.cushioned : 0) + (h.curtains ? ABS.curtains : 0)); }

  /** Seconds since the page started (one method, so a probe can pin a frame). */
  nowS() { return performance.now() / 1000; }

  deal() {
    const q = (s) => this.root.querySelector(s);
    const r = this.round;
    this.roundWon = false;
    this.pressAt = null;
    this.playAt = null;
    this.told = false;
    q('.ea').dataset.mode = r.kind;
    q('.rtxt').textContent = `Round ${this.roundNo + 1} of ${ROUNDS.length}`;
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    q('.next').dataset.on = '0';
    this.say('', '');
    if (r.kind === 'wall') {
      this.di = r.start;
      q('.ttl').innerHTML = r.nearest ? 'Bring the wall <b>as near</b> as it can be' : 'Make the clap come back as an <b>echo</b>';
      q('.sub').textContent = r.nearest ? 'Nearest wall that still gives an echo. Clap to test.' : 'An echo needs the sound back 0.1 s or more after the clap.';
    } else {
      this.hall = { panels: false, cushioned: false, curtains: false };
      q('.ttl').innerHTML = 'Make the hall\'s sound <b>fade quickly</b>';
      q('.sub').textContent = 'Choose surfaces, then play a note. Less reverberation: the trace dies out before the target line.';
      this.syncToggles();
    }
    this.syncWall();
    this.paint();
  }

  say(text, k) {
    const s = this.root.querySelector('.say');
    s.textContent = text; s.dataset.k = k;
  }

  syncWall() {
    const q = (s) => this.root.querySelector(s);
    q('.near').disabled = this.di <= 0;
    q('.far').disabled = this.di >= D.length - 1;
    q('.near').setAttribute('aria-label', `Move the wall nearer (now ${this.d} m)`);
    q('.far').setAttribute('aria-label', `Move the wall farther (now ${this.d} m)`);
  }

  syncToggles() {
    const h = this.hall, q = (s) => this.root.querySelector(s);
    const set = (el, on, text) => { el.textContent = text; el.setAttribute('aria-pressed', on ? 'true' : 'false'); };
    set(q('.tw'), h.panels, h.panels ? 'Walls: panels' : 'Walls: bare');
    set(q('.ts'), h.cushioned, h.cushioned ? 'Seats: cushioned' : 'Seats: hard');
    set(q('.tc'), h.curtains, h.curtains ? 'Curtains: on' : 'Curtains: none');
  }

  move(step) {
    if (this.roundWon || this.round.kind !== 'wall') return;
    this.di = Math.max(0, Math.min(D.length - 1, this.di + step));
    this.pressAt = null;
    this.told = false;
    this.say('', '');
    this.syncWall();
    this.paint();
  }

  clap() {
    if (this.roundWon || this.round.kind !== 'wall') return;
    this.pressAt = this.nowS();
    this.told = false;
    this.say('', '');
    this.kick();
  }

  toggle(key) {
    if (this.roundWon || this.round.kind !== 'hall') return;
    this.hall[key] = !this.hall[key];
    this.playAt = null;
    this.told = false;
    this.say('', '');
    this.syncToggles();
    this.paint();
  }

  play() {
    if (this.roundWon || this.round.kind !== 'hall') return;
    this.playAt = this.nowS();
    this.told = false;
    this.say('', '');
    this.kick();
  }

  kick() { if (!this.anim) this.anim = requestAnimationFrame(this.frameFn); }

  busy() {
    if (this.round?.kind === 'wall') return this.pressAt != null && this.nowS() - this.pressAt < T0 + echoOf(this.d) * SLOW + 1.8;
    return this.playAt != null && this.nowS() - this.playAt < NOTE + Math.min(TMAX, this.fadeTime) + 0.6;
  }

  /** The verdict comes when the sound is back (wall) or has faded (hall), not on the press. */
  advance() {
    if (this.told || this.roundWon) return;
    const r = this.round;
    if (r.kind === 'wall') {
      if (this.pressAt == null) return;
      const te = echoOf(this.d);
      if (this.nowS() - this.pressAt < T0 + te * SLOW) return;
      this.told = true;
      const ts = te.toFixed(2), path = `Out and back 2 ${X} ${this.d} m = ${2 * this.d} m takes ${ts} s`;
      if (te < ECHO - 1e-9) return this.say(`${path}: too soon for an echo.`, 'miss');
      if (r.nearest && this.d > NEAREST) return this.say(`${path}: an echo. Can the wall come nearer?`, 'miss');
      this.say(`${path}: an echo!`, 'good');
      this.winRound();
    } else {
      if (this.playAt == null) return;
      const ft = this.fadeTime;
      if (this.nowS() - this.playAt < NOTE + Math.min(TMAX, ft)) return;
      this.told = true;
      if (ft > TARGET + 1e-9) return this.say(`The sound takes ${ft.toFixed(1)} s to fade: too much reverberation. Add soft surfaces.`, 'miss');
      this.say(`The sound fades in ${ft.toFixed(1)} s: quick enough. Soft surfaces absorb sound.`, 'good');
      this.winRound();
    }
  }

  winRound() {
    this.roundWon = true;
    this.root.querySelectorAll('.dot')[this.roundNo].dataset.on = '1';
    if (this.roundNo === ROUNDS.length - 1) {
      this.allWon = true;
      finishGame(this);
      this.quill?.perform('hop');
    } else {
      this.root.querySelector('.next').dataset.on = '1';
      this.quill?.speak(this.roundNo === 0 ? 'Now find the nearest wall.' : 'On to the hall.', 2500);
    }
  }

  nextRound() {
    if (!this.roundWon || this.roundNo >= ROUNDS.length - 1) return;
    this.roundNo += 1;
    this.deal();
  }

  paint() {
    const cv = this.root?.querySelector('.stage canvas');
    if (!cv) return;
    const W = Math.max(260, Math.round(cv.parentElement.clientWidth || 600));
    const H = Math.max(180, Math.round(cv.parentElement.clientHeight || 250));
    cv.width = W * DPR; cv.height = H * DPR;
    this.colors = this.colors || loadColors(this.root);
    const ctx = cv.getContext('2d'), c = this.colors;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (this.round.kind === 'wall') this.paintWall(ctx, c, W, H);
    else this.paintHall(ctx, c, W, H);
  }

  // ---- rounds 1-2: the wall --------------------------------------------------------------------------------
  layout(W, H) {
    const narrow = W < 500;
    const FH = narrow ? 104 : Math.min(190, H * 0.6), PX = narrow ? 30 : 60, GY = H - (narrow ? 46 : 56);
    const MX0 = PX + FH * 0.3, WW = narrow ? 24 : 52, PXM = (W - 10 - WW - MX0) / DMAX;
    const RY = narrow ? 32 : 44;
    return { narrow, FH, PX, GY, MX0, WW, PXM, RY, WTOP: RY + (narrow ? 42 : 56), fs: narrow ? 14 : 22,
      wallX: (d) => MX0 + d * PXM, railX: (t) => MX0 + t * (V_AIR / 2) * PXM };
  }

  paintWall(ctx, c, W, H) {
    const L = this.layout(W, H), d = this.d, te = echoOf(d);
    const a = this.pressAt == null ? -1 : this.nowS() - this.pressAt;
    const sky = ctx.createLinearGradient(0, 0, 0, L.GY);
    sky.addColorStop(0, mix(c.bgSurface, c.water, 0.16)); sky.addColorStop(1, c.bgSurface);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    this.ground(ctx, c, W, H, L.GY);
    const wx = L.wallX(d);
    this.wall(ctx, c, wx, L.WTOP, L.GY, L.WW);
    const fg = this.clapper(ctx, c, L.PX, L.GY, L.FH, a);
    const out = { knees: fg.sk.anchors.knee.map((p) => [+p.x.toFixed(2), +p.y.toFixed(2)]),
      hip: [+fg.sk.anchors.hip.x.toFixed(2), +fg.sk.anchors.hip.y.toFixed(2)], d };
    const mouth = { x: L.MX0, y: fg.mouth.y };
    const vs = L.PXM * V_AIR / SLOW;
    let back = false;
    if (a >= 0) {
      if (a > T0) {
        const k = 1 - ramp(a, T0 + 0.25, 0.7);
        if (k > 0) drawSoundArcs(ctx, c, { x: fg.clap.x, y: fg.clap.y, dir: 0, spread: 1.4, n: 2, wavelength: L.narrow ? 14 : 20, t: a - T0, r0: 8, strength: k });
      }
      const st = drawOutAndBack(ctx, c, { a: mouth, b: { x: wx, y: mouth.y }, v: vs, t: a, start: T0, path: a > T0 + echoOf(this.d) * SLOW, R: L.narrow ? 12 : 18 });
      out.leg = st.leg;
      back = st.leg === 'done';
      if (back) this.ear(ctx, c, fg, a - (T0 + st.tTotal));
      if (!back && a > T0 - 0.2) this.slowTag(ctx, c, L, W, wx);
    }
    this.rail(ctx, c, L, W, a, te, back);
    this.dim(ctx, c, L.MX0, wx, L.GY + (L.narrow ? 24 : 26), `${d} m`, L.fs);
    this.probeOut = out;
  }

  /** The time line: same scale as the ground, so a time sits over the wall that gives it. */
  rail(ctx, c, L, W, a, te, back) {
    const x0 = L.MX0, x1 = W - 12, y = L.RY;
    ctx.save(); ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1 - 4, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 11, y - 6); ctx.lineTo(x1 - 11, y + 6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x0, y - 8); ctx.lineTo(x0, y + 8); ctx.stroke();
    const xm = L.railX(ECHO);
    ctx.strokeStyle = c.s2; ctx.lineWidth = 3; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(xm, y - 11); ctx.lineTo(xm, y + 11); ctx.stroke();
    ctx.restore();
    const ty = y - (L.narrow ? 19 : 25);
    pill(ctx, c, 'clap', x0, ty, { bg: c.raised, size: L.fs });
    pill(ctx, c, '0.1 s', xm, ty, { bg: c.s2, size: L.fs, display: true });
    if (a < T0) return;
    const real = Math.min(te, (a - T0) / SLOW), xr = L.railX(real);
    ctx.save(); ctx.strokeStyle = alpha(c.s1, 0.85); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(xr, y); ctx.stroke(); ctx.restore();
    const ok = te >= ECHO - 1e-9, col = back ? (ok ? c.good : c.bad) : c.s1;
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(xr, y, back ? 8 : 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c.bgSurface; ctx.lineWidth = 2; ctx.stroke();
    if (back) pill(ctx, c, `${te.toFixed(2)} s`, xr, y + (L.narrow ? 22 : 30), { bg: col, size: L.fs, display: true });
  }

  /** The returned sound reaching the student: arcs arriving at the ear, a soft glow. */
  ear(ctx, c, fg, since) {
    const p = fg.ear, k = 1 - 0.5 * ramp(since, 0.6, 0.8);
    drawSoundArcs(ctx, c, { x: p.x + 4, y: p.y, dir: 0, spread: 1.2, n: 3, wavelength: 14, t: Math.min(since, 1.4), r0: 10, reverse: true, strength: k, tone: 2 });
    const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 9);
    g.addColorStop(0, alpha(c.s2, 0.35)); g.addColorStop(1, alpha(c.s2, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
  }

  /** A dimension line from x1 to x2 at y with the tag in a gap at its middle. */
  dim(ctx, c, x1, x2, y, text, fs) {
    const mid = (x1 + x2) / 2, gap = Math.min(30, (x2 - x1) / 2 - 4);
    ctx.save(); ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1 + 2, y); ctx.lineTo(mid - gap, y); ctx.moveTo(mid + gap, y); ctx.lineTo(x2 - 2, y);
    ctx.moveTo(x1, y - 8); ctx.lineTo(x1, y + 8); ctx.moveTo(x2, y - 8); ctx.lineTo(x2, y + 8); ctx.stroke();
    for (const [x, s] of [[x1, -1], [x2, 1]]) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * 9, y - 5); ctx.lineTo(x - s * 9, y + 5); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    pill(ctx, c, text, mid, y, { bg: c.raised, size: fs, display: true });
  }

  /** The slow-motion tag, low over the grass where the pulse never runs: between student and wall, or past the wall. */
  slowTag(ctx, c, L, W, wx) {
    const w = chipSize(ctx, c, 'slow motion', L.fs, true).w, mid = (L.MX0 + 12 + wx) / 2;
    const x = wx - L.MX0 - 12 > w + 16 ? mid : Math.min(W - w / 2 - 6, wx + L.WW + 10 + w / 2);
    pill(ctx, c, 'slow motion', x, L.GY - (L.narrow ? 20 : 26), { bg: c.raised, size: L.fs, display: true });
  }

  /** Open ground: a lit grass edge, a soil band, tufts. */
  ground(ctx, c, W, H, GY) {
    const g = ctx.createLinearGradient(0, GY - 6, 0, H);
    g.addColorStop(0, mix(c.good, c.bgSurface, 0.15)); g.addColorStop(0.25, mix(c.good, c.bgSurface, 0.3)); g.addColorStop(1, darken(mix(c.good, c.gold, 0.4), 0.12));
    ctx.fillStyle = g; ctx.fillRect(0, GY - 6, W, H - GY + 6);
    ctx.fillStyle = alpha(lighten(c.good, 0.4), 0.6); ctx.fillRect(0, GY - 6, W, 2.5);
    ctx.strokeStyle = alpha(darken(c.good, 0.3), 0.6); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    const n = Math.round(W / 18);
    for (let i = 0; i < n; i++) {
      const x = 8 + hash(i) * (W - 16), y = GY - 3 + hash(i + 50) * 6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 7); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 8); ctx.stroke();
    }
  }

  /** A brick wall from the side, its reflecting face at x (lit), staggered courses, a stone cap, shade behind. */
  wall(ctx, c, x, top, bot, WW) {
    const brick = mix(c.flame, c.stroke, 0.3), mortar = mix(c.bgSurface, c.stroke, 0.25);
    drawShadow(ctx, c, x + WW / 2, bot, WW, 6, 0.6);
    ctx.fillStyle = mortar; ctx.fillRect(x, top, WW, bot - top);
    const ch = WW < 30 ? 14 : 20, bw = WW < 30 ? 16 : 26;
    for (let row = 0, y = top + 10; y < bot - 2; row++, y += ch) {
      const off = row % 2 ? bw / 2 : 0;
      for (let bx = x - off; bx < x + WW; bx += bw) {
        const x0 = Math.max(x + 2, bx + 2), x1 = Math.min(x + WW - 2, bx + bw - 2);
        if (x1 - x0 < 3) continue;
        const v = hash(row * 7 + Math.round(bx - x)) * 0.14 - 0.07;
        ctx.fillStyle = v > 0 ? lighten(brick, v) : darken(brick, -v);
        rr(ctx, x0, y + 2, x1 - x0, Math.min(ch - 4, bot - y - 3), 2); ctx.fill();
        ctx.fillStyle = alpha(lighten(brick, 0.4), 0.45); ctx.fillRect(x0 + 1, y + 2.5, x1 - x0 - 2, 2);
      }
    }
    const sh = ctx.createLinearGradient(x, 0, x + WW, 0);
    sh.addColorStop(0, alpha(c.bgSurface, 0.12)); sh.addColorStop(0.3, alpha(c.bgSurface, 0)); sh.addColorStop(1, alpha(darken(brick, 0.6), 0.35));
    ctx.fillStyle = sh; ctx.fillRect(x, top, WW, bot - top);
    ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.45); rr(ctx, x - 4, top - 4, WW + 8, 13, 3); ctx.fill();
    ctx.strokeStyle = lighten(brick, 0.35); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 1, top + 9); ctx.lineTo(x + 1, bot); ctx.stroke();
  }

  /** ONE fixed stand pose (autoReach off). Only the hands move: they meet at T0 (eased 0.4 s), open again after. */
  clapper(ctx, c, x, y, h, a) {
    const k = a < 0 ? 0 : a < T0 + 0.5 ? inOutSine(ramp(a, 0, T0)) : 1 - inOutSine(ramp(a, T0 + 0.5, 0.5));
    const sh = { x: x + h * 0.02, y: y - h * 0.74 };
    const M = { x: sh.x + h * 0.26, y: sh.y + h * 0.13 };
    const near = { x: M.x + (1 - k) * -h * 0.05, y: M.y + (1 - k) * h * 0.13 };
    const far = { x: M.x + h * 0.02 + (1 - k) * h * 0.03, y: M.y - (1 - k) * h * 0.09 };
    const spec = figureFor(this, { role: 'student', pose: 'stand', x, y, height: h, facing: 1, i: 3, mood: 'smile', autoReach: false, hands: [near, far] });
    const sk = drawFigure(ctx, c, spec, spec.look);
    const hd = sk.anchors.head;
    if (a >= T0 && a < T0 + 0.35) {
      const u = ramp(a, T0, 0.35);
      ctx.save(); ctx.strokeStyle = alpha(c.gold, 1 - u); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let j = -1; j <= 1; j++) {
        const an = -0.5 + j * 0.55, r0 = h * 0.07 + u * 8;
        ctx.beginPath(); ctx.moveTo(M.x + Math.cos(an) * r0, M.y + Math.sin(an) * r0);
        ctx.lineTo(M.x + Math.cos(an) * (r0 + 9), M.y + Math.sin(an) * (r0 + 9)); ctx.stroke();
      }
      ctx.restore();
    }
    return { sk, clap: { x: M.x + 4, y: M.y }, mouth: { x: hd.x + hd.r * 0.95, y: hd.y + hd.r * 0.3 }, ear: { x: hd.x - hd.r * 0.1, y: hd.y } };
  }

  // ---- round 3: the hall -----------------------------------------------------------------------------------
  paintHall(ctx, c, W, H) {
    const narrow = W < 500, fs = narrow ? 14 : 20, h = this.hall;
    const a = this.playAt == null ? -1 : this.nowS() - this.playAt;
    ctx.fillStyle = c.bgSurface; ctx.fillRect(0, 0, W, H);
    const hb = narrow ? { x: 4, y: 4, w: W - 8, h: Math.round(H * 0.53) } : { x: 6, y: 6, w: Math.round(W * 0.58), h: H - 12 };
    const hall = drawHall(ctx, c, { ...hb, panels: h.panels, seats: h.cushioned ? 'cushioned' : 'bare', curtains: h.curtains, rows: narrow ? 5 : 7 });
    const st = hall.stage, r = narrow ? 14 : 24;
    const sp = { x: st.x + st.w * 0.5, y: st.y - 1.85 * r };
    const ft = this.fadeTime, env = a < 0 ? 0 : a < NOTE ? 1 : Math.max(0, 1 - (a - NOTE) / ft);
    const on = a >= 0 && a < NOTE;
    const spk = drawSpeaker(ctx, c, { x: sp.x, y: sp.y, r, facing: 1, cone: on ? Math.sin(a * 2 * Math.PI * 14) : 0 });
    if (a >= 0 && env > 0) this.rays(ctx, c, hall.inner, hall.floorY, spk.cone, a, env, narrow);
    if (on) drawSoundArcs(ctx, c, { x: spk.cone.x + r * 0.4, y: spk.cone.y, dir: 0, spread: 1.1, n: 3, wavelength: narrow ? 12 : 18, t: a, r0: r * 0.6 });
    const gb = narrow ? { x: 4, y: hb.y + hb.h + 8, w: W - 8, h: H - hb.h - 16 } : { x: hb.x + hb.w + 14, y: 20, w: W - hb.w - 34, h: H - 40 };
    this.graph(ctx, c, gb, a, ft, fs, narrow);
    this.probeOut = { fade: +ft.toFixed(3), env: +env.toFixed(3) };
  }

  /** Sound paths from the speaker, bouncing off the hall's inside (mirror folding); brightness = loudness left. */
  rays(ctx, c, inner, floorY, from, a, env, narrow) {
    const lo = { x: inner.x + 3, y: inner.y + 3 }, hi = { x: inner.x + inner.w - 3, y: floorY - 3 };
    const speed = inner.w * 0.75, trail = narrow ? 26 : 40, s1 = a * speed;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = narrow ? 2 : 2.6;
    for (let i = 0; i < 9; i++) {
      const an = -1.15 + i * (2.1 / 8), cx = Math.cos(an), cy = Math.sin(an);
      ctx.strokeStyle = alpha(c.s1, 0.8 * env);
      ctx.beginPath();
      for (let j = 0; j <= 10; j++) {
        const s = Math.max(0, s1 - trail + (trail * j) / 10);
        const px = fold(from.x + cx * s, lo.x, hi.x), py = fold(from.y + cy * s, lo.y, hi.y);
        if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Loudness trace after the note: amplitude falls to nothing at the fade time; target line at TARGET. */
  graph(ctx, c, b, a, ft, fs, narrow) {
    ctx.save();
    ctx.fillStyle = mix(c.bgDeep, c.bgSurface, 0.5); rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.5); ctx.lineWidth = 1.5; rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.stroke();
    const G0 = narrow ? 40 : 60, top = b.y + (narrow ? 28 : 40), bot = b.y + b.h - (narrow ? 24 : 32);
    const y0 = (top + bot) / 2, amp = (bot - top) / 2 - 2;
    const X0 = b.x + G0, X1 = b.x + b.w - 12, tx = (t) => X0 + (t / TMAX) * (X1 - X0);
    ctx.strokeStyle = alpha(c.label, 0.5); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(b.x + 6, y0); ctx.lineTo(X1, y0); ctx.stroke();
    ctx.fillStyle = c.labelMuted; ctx.font = `700 ${fs}px ${getComputedStyle(this.root).getPropertyValue('--sim-font') || 'sans-serif'}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const s of [1, 2, 3]) {
      ctx.beginPath(); ctx.moveTo(tx(s), bot - 4); ctx.lineTo(tx(s), bot + 2); ctx.stroke();
      ctx.fillText(`${s} s`, tx(s), bot + (narrow ? 13 : 17));
    }
    ctx.fillText('note', b.x + G0 / 2 + 2, bot + (narrow ? 13 : 17));
    const xt = tx(TARGET);
    ctx.strokeStyle = c.s2; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(xt, top - 4); ctx.lineTo(xt, bot); ctx.stroke(); ctx.setLineDash([]);
    pill(ctx, c, 'target', xt, b.y + (narrow ? 14 : 20), { bg: c.s2, size: fs });
    if (a >= 0) {
      const tn = a - NOTE;
      ctx.strokeStyle = c.s1; ctx.lineWidth = narrow ? 1.6 : 2; ctx.beginPath();
      const xa = b.x + 8, xEnd = tn < 0 ? xa + (X0 - 4 - xa) * (a / NOTE) : tx(Math.min(TMAX, tn));
      for (let x = xa; x <= xEnd; x += 1) {
        let t, k;
        if (x < X0) { t = (x - xa) / (X0 - xa) * NOTE; k = 1; } else { t = NOTE + ((x - X0) / (X1 - X0)) * TMAX; k = Math.max(0, 1 - (t - NOTE) / ft); }
        const y = y0 - amp * k * Math.sin(t * 2 * Math.PI * (narrow ? 5 : 7));
        if (x === xa) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (tn >= Math.min(TMAX, ft)) {
        const ok = ft <= TARGET + 1e-9, col = ok ? c.good : c.bad, xf = tx(Math.min(TMAX, ft));
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(xf, y0, 7, 0, Math.PI * 2); ctx.fill();
        // the tag starts just right of the fade point and of the target line, so it covers neither
        const label = `fades in ${ft.toFixed(1)} s`, pw = chipSize(ctx, c, label, fs, true).w;
        const px = Math.min(X1 + 8 - pw / 2, Math.max(xf, xt) + 12 + pw / 2);
        pill(ctx, c, label, px, bot - (narrow ? 13 : 20), { bg: col, size: fs, display: true });
      }
    }
    ctx.restore();
  }

  refreshTheme() { if (this.root?.querySelector('.stage canvas')) { this.colors = loadColors(this.root); this.paint(); } }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.clap')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }

  destroy() {
    if (this.anim) cancelAnimationFrame(this.anim);
    this.anim = 0;
    super.destroy();
  }
}
