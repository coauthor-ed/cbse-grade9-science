/**
 * FindTheSourceGame - mini-game for L01 (blk-l01-n04). New 2026-11-03.
 *
 * Six rounds: taal, tabla, ektara, bansuri, tuning fork, cricket. Each is drawn large with its
 * SoundArt / kit part, sounding: its vibrating part moves and sound arcs leave it. Two or three
 * round tap targets sit on parts: the vibrating part and one or two that do not vibrate (cord,
 * shell, peg, bamboo end, finger hole, stem, leaf). A right tap stops the part and the arcs
 * and says why in one line; Next goes on. A wrong tap stops nothing and says why; the learner
 * tries again, so every round can be won. After round 6 the game finishes (finishGame) and
 * Quill celebrates once.
 */
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { drawTuningFork } from 'simulations/base/kit/SimApparatus.js';
import { drawTaal, drawTabla, drawEktara, drawBansuri, drawCricket } from '../shared/SoundArt.js';

const DW = 440, DH = 300, DPR = 2, PHONE_STAGE_H = 270;

// each round: draw(ctx, c, vib, t) -> list of arc sources; targets in design px
const ROUNDS = [
  { name: 'taal', fit: { x0: 70, y0: 20, w: 300, h: 230 },
    draw: (ctx, c, k, t) => {
      const r = drawTaal(ctx, c, { x: 220, y: 120, r: 72, meet: 0.86, vib: k, t });
      return [{ x: r.part.x - 10, y: 84, dir: Math.PI + 0.7 }, { x: r.part.x + r.part.w + 10, y: 84, dir: -0.7 }];
    },
    targets: [
      { id: 'rims', x: 220, y: 92, ok: true, aria: 'the metal rims', why: 'The metal rims vibrate. Holding them still stops the sound.' },
      { id: 'cord', x: 220, y: 222, aria: 'the cord', why: 'The cord only holds the taal. It does not vibrate.' },
    ] },
  { name: 'tabla', fit: { x0: 80, y0: 70, w: 280, h: 230 },
    draw: (ctx, c, k, t) => {
      const r = drawTabla(ctx, c, { x: 220, y: 288, r: 94, vib: k, t });
      return [{ x: r.skin.cx, y: r.skin.cy - r.skin.ry - 12, dir: -Math.PI / 2 }];
    },
    targets: [
      { id: 'skin', x: 220, y: 142, ok: true, aria: 'the skin on top', why: 'The skin vibrates. Holding it still stops the sound.' },
      { id: 'shell', x: 220, y: 238, aria: 'the wooden shell', why: 'The wooden shell holds the skin tight. It does not make the sound.' },
    ] },
  { name: 'ektara', fit: { x0: 60, y0: 20, w: 300, h: 285 },
    draw: (ctx, c, k, t) => {
      const r = drawEktara(ctx, c, { x: 200, y: 292, h: 276, vib: k, t });
      return [{ x: r.string.mid.x + 18, y: r.string.mid.y, dir: 0 }];
    },
    targets: [
      { id: 'string', x: 200, y: 136, ok: true, aria: 'the string', why: 'The string vibrates. Holding it still stops the sound.' },
      { id: 'peg', x: 224, y: 46, aria: 'the peg at the top', why: 'The peg only holds the string. It does not vibrate.' },
    ] },
  { name: 'bansuri', fit: { x0: 0, y0: 84, w: 460, h: 150 },
    draw: (ctx, c, k, t) => {
      drawBansuri(ctx, c, { x: 220, y: 160, len: 420, wd: 48, cutaway: true, vib: k, t });
      return [{ x: 430, y: 160, dir: -0.35 }];
    },
    targets: [
      { id: 'air', x: 132, y: 160, ok: true, aria: 'the air inside the pipe', why: 'The air inside the pipe vibrates. Stop the air and the sound stops.' },
      { id: 'hole', x: 275, y: 116, aria: 'a finger hole', why: 'The finger hole lets the air out. It does not vibrate.' },
      { id: 'end', x: 404, y: 204, aria: 'the bamboo end', why: 'The bamboo end does not vibrate. The air inside does.' },
    ] },
  { name: 'tuning fork', fit: { x0: 90, y0: 6, w: 260, h: 294 },
    draw: (ctx, c, k, t) => {
      const r = drawTuningFork(ctx, c, { x: 220, y: 292, h: 272, vib: k, t, freq: 6 });
      return [{ x: r.tips[1].x + 16, y: r.tips[1].y + 40, dir: -0.2 }, { x: r.tips[0].x - 16, y: r.tips[0].y + 40, dir: Math.PI + 0.2 }];
    },
    targets: [
      { id: 'prongs', x: 220, y: 76, ok: true, aria: 'the prongs', why: 'The prongs vibrate. Touching them stops the sound.' },
      { id: 'stem', x: 220, y: 246, aria: 'the stem', why: 'The stem is where you hold the fork. It hardly moves.' },
    ] },
  { name: 'cricket', fit: { x0: 0, y0: 40, w: 440, h: 230 },
    draw: (ctx, c, k, t) => {
      const r = drawCricket(ctx, c, { x: 210, y: 168, s: 1.35, rub: t * 2.4 * k });
      return [{ x: r.wings.x + 16, y: r.wings.y - 26, dir: -1.1 }];
    },
    targets: [
      { id: 'wings', x: 0, y: 0, ok: true, wings: true, aria: 'the wings', why: 'The wings rub and vibrate. When they stop, the sound stops.' },
      { id: 'leaf', x: 346, y: 212, aria: 'the leaf', why: 'The leaf only holds the cricket. It does not vibrate.' },
    ] },
];

const CSS = `
.fs .row { display: flex; gap: 18px; flex: 1 1 auto; min-height: 0; width: 100%; }
.fs .stage { position: relative; flex: 1 1 auto; min-height: 200px; }
.sim-dom-root--portrait .fs .row { flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .fs .stage { flex: none; width: 100%; height: ${PHONE_STAGE_H}px; }
.fs .stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.fs .tg { position: absolute; width: 48px; height: 48px; min-width: 48px; padding: 0; margin: 0; border-radius: 50%;
          transform: translate(-50%, -50%); background: color-mix(in oklab, var(--sim-bg-surface) 35%, transparent);
          border: 3px dashed var(--sim-stroke); box-shadow: none; }
.fs .tg:active { transform: translate(-50%, -50%) scale(0.94); box-shadow: none; }
.fs .tg[data-v="good"] { border: 4px solid var(--sim-good); background: color-mix(in oklab, var(--sim-good) 25%, transparent); }
.fs .tg[data-v="bad"] { border: 4px solid var(--sim-bad); animation: fsflash 0.45s ease-in-out 2; }
@keyframes fsflash { 50% { background: color-mix(in oklab, var(--sim-bad) 30%, transparent); } }
@media (prefers-reduced-motion: reduce) { .fs .tg[data-v="bad"] { animation: none; } }
.fs .acts { display: flex; flex-direction: column; justify-content: center; gap: 14px; align-items: flex-start; width: 360px; flex: none; }
.sim-dom-root--portrait .fs .acts { width: auto; flex-direction: row; flex-wrap: wrap; align-items: center; }
.fs .round { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 26px; white-space: nowrap; }
.fs .dots { display: flex; gap: 6px; }
.fs .dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--sim-stroke); background: var(--sim-bg-surface); }
.fs .dot[data-on="1"] { background: var(--sim-good); border-color: var(--sim-good); }
.fs .next { display: none; min-height: 56px; padding: 0 26px; font-weight: 800; font-size: 26px; }
.fs .next[data-on="1"] { display: inline-flex; align-items: center; }
.fs .say { margin: 0; font-size: 26px; line-height: 1.25; font-weight: 700; min-height: 66px; }
.fs .gm-head .kicker, .fs .gm-head .sub { font-size: 26px; }
.fs .gm-head h2 { font-size: 32px; }
.sim-dom-root--portrait .fs .say { flex: 1 1 100%; font-size: 16px; min-height: 44px; }
.sim-dom-root--portrait .fs .round { font-size: 17px; gap: 10px; }
.sim-dom-root--portrait .fs .dot { width: 14px; height: 14px; }
.sim-dom-root--portrait .fs .next { min-height: 48px; padding: 0 20px; font-size: 17px; }
.sim-dom-root--portrait .fs .gm-head .kicker, .sim-dom-root--portrait .fs .gm-head .sub { font-size: 15px; }
.sim-dom-root--portrait .fs .gm-head h2 { font-size: 21px; }
.fs .say[data-k="good"] { color: var(--sim-good); }
.fs .say[data-k="miss"] { color: var(--sim-bad); }
.sim-dom-root--portrait .fs .sub { padding-right: 62px; }
.sim-dom-root--portrait .fs .round { flex: 1 1 100%; }
.sim-dom-root--portrait .fs .next { flex: 1 1 auto; justify-content: center; }
`;

export class FindTheSourceGame extends GameBoard {
  static HEIGHT = 405;   // the full landscape frame (GAME_H): fits 1280x720, about 1165 x 430 there
  static ARIA_LABEL = 'A six-round game. Each round shows an instrument or animal making a sound: a taal, a tabla, an ektara, a bansuri, a tuning fork and a cricket. Round buttons sit on some of its parts. Tap the part that vibrates to make the sound: the right part stops and the sound stops. A wrong part says why it does not vibrate, and you try again.';
  static OBJECTIVE = { prompt: { en: 'Tap the part that vibrates to make the sound, for each instrument.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.roundWon = false;
    this.allWon = false;
    this.stopAt = -1;
    this.t0 = 0;
    this.raf = 0;
    this.wingsAt = { x: 0, y: 0 };
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      onResize: () => this.place(),
      html: `<div class="gm fs">
        <div class="gm-head"><p class="kicker">Mini-game</p><h2>Find what <b>vibrates</b></h2>
          <p class="sub">Tap the part that makes the sound.</p></div>
        <div class="row"><div class="stage"><canvas aria-hidden="true"></canvas><div class="tgs"></div></div>
        <div class="acts"><div class="round"><span class="rtxt" aria-live="polite"></span><span class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}</span></div>
          <button type="button" class="tap btn next">Next</button>
          <p class="say" aria-live="polite"></p></div></div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.next')) return;
    onTap(q('.next'), () => this.nextRound());
    this.t0 = performance.now();
    this.deal();
    this.loop();
    this.quill?.speak('Which part is moving?', 4000);
  }

  get round() { return ROUNDS[this.roundNo]; }
  now() { return (performance.now() - this.t0) / 1000; }

  // design px -> stage px
  view() {
    const st = this.root?.querySelector('.stage');
    const W = Math.max(200, st?.clientWidth || 600), H = Math.max(140, st?.clientHeight || PHONE_STAGE_H);
    const f = this.round?.fit || { x0: 0, y0: 0, w: DW, h: DH }, s = Math.min(W / f.w, H / f.h, 2);
    return { W, H, s, ox: (W - f.w * s) / 2 - f.x0 * s, oy: (H - f.h * s) / 2 - f.y0 * s };
  }

  deal() {
    this.roundWon = false;
    this.stopAt = -1;
    const q = (s) => this.root.querySelector(s);
    q('.rtxt').textContent = `${this.roundNo + 1} of ${ROUNDS.length}: ${this.round.name}`;
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    q('.tgs').innerHTML = this.round.targets.map((g, i) => `<button type="button" class="tap btn tg" data-i="${i}" aria-label="${g.aria}"></button>`).join('');
    q('.tgs').querySelectorAll('.tg').forEach((el) => onTap(el, () => this.pick(+el.dataset.i)));
    q('.next').dataset.on = '0';
    q('.next').textContent = this.roundNo === ROUNDS.length - 1 ? 'Finish' : 'Next';
    q('.say').textContent = '';
    q('.say').dataset.k = '';
    this.paint();
    this.place();
  }

  pick(i) {
    if (this.roundWon) return;
    const g = this.round.targets[i], el = this.root.querySelector(`.tg[data-i="${i}"]`), say = this.root.querySelector('.say');
    el.dataset.v = '';
    void el.offsetWidth;   // restart the flash on a second miss
    say.textContent = g.why;
    if (!g.ok) { el.dataset.v = 'bad'; say.dataset.k = 'miss'; return; }
    el.dataset.v = 'good';
    say.dataset.k = 'good';
    this.roundWon = true;
    this.stopAt = this.now();
    this.root.querySelectorAll('.dot')[this.roundNo].dataset.on = '1';
    this.root.querySelector('.next').dataset.on = '1';
    if (this.roundNo === ROUNDS.length - 1) {
      this.allWon = true;
      finishGame(this);
      this.quill?.perform('hop');
    }
  }

  nextRound() {
    if (!this.roundWon || this.roundNo >= ROUNDS.length - 1) return;
    this.roundNo += 1;
    this.deal();
  }

  // vibration strength: full while sounding, eased to 0 after the right tap
  level() { return this.stopAt < 0 ? 1 : 1 - inOutSine(clamp01((this.now() - this.stopAt) / 0.35)); }

  place() {
    const v = this.view();
    this.root?.querySelectorAll('.tg').forEach((el, i) => {
      const g = this.round.targets[i];
      if (!g) return;
      const p = g.wings ? this.wingsAt : g;
      el.style.left = `${v.ox + p.x * v.s}px`;
      el.style.top = `${v.oy + p.y * v.s}px`;
    });
    this.paint();
  }

  paint() {
    const cv = this.root?.querySelector('.stage canvas');
    if (!cv) return;
    const v = this.view();
    if (cv.width !== Math.round(v.W * DPR) || cv.height !== Math.round(v.H * DPR)) { cv.width = Math.round(v.W * DPR); cv.height = Math.round(v.H * DPR); }
    this.colors = this.colors || loadColors(this.root);
    const ctx = cv.getContext('2d'), c = this.colors, t = this.now(), k = this.level();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, v.W, v.H);
    ctx.translate(v.ox, v.oy); ctx.scale(v.s, v.s);
    const arcs = this.round.draw(ctx, c, k, t);
    if (this.round.name === 'cricket') {
      const w = arcs[0];
      const at = { x: w.x - 16, y: w.y + 26 };
      if (at.x !== this.wingsAt.x || at.y !== this.wingsAt.y) { this.wingsAt = at; requestAnimationFrame(() => this.place()); }
    }
    for (const a of arcs) drawSoundArcs(ctx, c, { ...a, spread: 0.85, n: 3, wavelength: 26, r0: 12, t, strength: k });
  }

  loop() {
    cancelAnimationFrame(this.raf);
    const step = () => {
      if (!this.root?.isConnected) return;
      this.paint();
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  refreshTheme() { if (this.root?.querySelector('.stage canvas')) { this.colors = loadColors(this.root); this.paint(); } }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.next')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }

  destroy() {
    cancelAnimationFrame(this.raf);
    super.destroy();
  }
}
