// PowerPaceGameScene - blk-l06-s09, mini-game@1. A worker on a roof hauls a crate up the
// wall on a rope over a pulley. Each round gives the mass, the height and so the work
// W = mgh (g = 10 m/s^2), and a target power. The learner sets the time t in whole seconds
// and taps Lift: the stopwatch runs to t, the crate rises h, and the P bar fills to W / t
// beside the target line. Exact = round won; a miss shows P = W / t and offers Try again.
// Every W / target is an offered time, so every round can be won. Made-up numbers.
// Board: GameFrame (DOM) with one canvas picture drawn with kit SimFigure, SimApparatus,
// SimEnergy and SimLook helpers. Control names: .minus, .plus, .lift, .again, .next.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, pill, font, mix, darken, lighten, alpha, rr, drawShadow, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';
import { drawCrate, displacementArrow } from 'simulations/base/kit/SimApparatus.js';
import { drawPulley } from 'simulations/base/kit/SimProps.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';

const G = 10;
const T_MIN = 1, T_MAX = 15;
const ROUNDS = [
  { m: 20, h: 3, target: 150 },     // W 600 J, t 4 s
  { m: 40, h: 2.5, target: 200 },   // W 1000 J, t 5 s
  { m: 30, h: 2, target: 50 },      // W 600 J, t 12 s
  { m: 50, h: 3, target: 250 },     // W 1500 J, t 6 s
  { m: 15, h: 3, target: 50 },      // W 450 J, t 9 s
];

// Canvas design 600 x 280 (drawn at 2x).
const DW = 680, DH = 280, DPR = 2;
const GY = 252, PXM = 46;                      // ground line, px per metre
const WALL_X0 = 362, WALL_X1 = 476;
const ROPE_X = 314, PUL_R = 13;
const CRW = 84, CRH = 56;
const FIG_X = 416, FIG_H = 1.7 * PXM;
const WATCH = { x: 84, y: 72, r: 40 };
const BAR_X = 540;

// a pill kept inside the canvas width: measured first (alpha 0 draws nothing), then shifted in
function fitPill(ctx, c, text, x, y, o) {
  const m = pill(ctx, c, text, x, y, { ...o, alpha: 0 });
  const dx = Math.max(0, 6 - m.x0) - Math.max(0, m.x0 + m.w - (DW - 6));
  return pill(ctx, c, text, x + dx, y, o);
}
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

const CSS = `
.gm.pp { background: var(--sim-bg-deep); border-radius: 14px; }
.pp .play { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 14px; align-items: start; }
.pp .stage { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 4px; overflow: hidden; }
.pp canvas { display: block; width: 100%; max-width: 700px; margin: 0 auto; aspect-ratio: ${DW} / ${DH}; border-radius: calc(var(--sim-radius-lg) - 4px); }
.pp .side { display: flex; flex-direction: column; gap: 8px; }
.pp .dots { display: flex; gap: 6px; align-items: center; }
.pp .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--sim-track); }
.pp .dot[data-on="1"] { background: var(--sim-good); }
.pp .dots .pn { margin-left: 8px; font-size: 14px; font-weight: 700; color: var(--sim-label-muted); }
.pp .given { display: flex; gap: 8px; flex-wrap: wrap; }
.pp .chip { font: 800 16px/1 var(--sim-font); padding: 9px 11px; border-radius: var(--look-pill, 999px);
            background: var(--sim-bg-surface); border: var(--sim-border); }
.pp .chip.t { border-color: var(--sim-gold); }
.pp .step { display: flex; align-items: center; gap: 8px; }
.pp .step .btn { width: 52px; font-size: 24px; line-height: 1; padding: 0; }
.pp .step .lift { width: auto; flex: 0 0 96px; font-size: 17px; }
.pp .tval { flex: 1; text-align: center; font: 800 22px/1 var(--sim-font-display); }
.pp .lift { background: var(--sim-accent); color: var(--sim-bg-deep); border: 0; font-size: 17px; font-weight: 800;
            box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.pp .say { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
.pp .say[data-k="good"] { color: var(--sim-good); }
.pp .say:empty { display: none; }
.pp .again, .pp .next { display: none; }
.pp .acts { display: none; gap: 8px; }
.pp .acts:has([data-on="1"]) { display: flex; }
.pp .again[data-on="1"], .pp .next[data-on="1"] { display: inline-block; }
.pp .next { background: var(--sim-good); color: var(--sim-bg-deep); border: 0; }
.pp .btn[disabled] { opacity: 0.45; cursor: default; }
.sim-dom-root--portrait .pp .play { grid-template-columns: minmax(0, 1fr); gap: 10px; }
.sim-dom-root--portrait .pp canvas { max-width: none; }
`;

export class PowerPaceGameScene extends GameBoard {
  static ARIA_LABEL = 'A five-round game: a worker on a roof hauls a crate up the wall with a rope over a pulley. Each round gives the mass, the height and the work W = m g h, and a target power. Set the time in seconds and lift: a stopwatch runs, the crate rises, and the power bar fills to P = W / t beside the target line.';
  static OBJECTIVE = { prompt: { en: 'Choose how long the lift takes so the power matches the target. Use P = W / t.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.secs = 2;
    this.lifted = false;
    this.roundWon = false;
    this.allWon = false;
    this.anim = null;        // { t0, dur } while the crate goes up
    this.loopId = 0;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      html: `<div class="gm pp">
        <div class="gm-head"><p class="kicker">Power</p><h2>Lift at exactly the <b>target</b> power</h2>
          <p class="sub">P = W / t. Set the time, then lift.</p></div>
        <div class="play">
          <div class="stage"><canvas class="art" width="${DW * DPR}" height="${DH * DPR}" role="img" aria-label="A worker on a roof hauls a crate up the wall; a stopwatch and a power bar with a target line"></canvas></div>
          <div class="side">
            <div class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}<span class="pn">numbers for example</span></div>
            <div class="given"><span class="chip w"></span><span class="chip t"></span></div>
            <div class="step">
              <button type="button" class="tap btn minus" aria-label="One second less">&minus;</button>
              <span class="tval" aria-live="polite"></span>
              <button type="button" class="tap btn plus" aria-label="One second more">+</button>
              <button type="button" class="tap btn lift">Lift</button>
            </div>
            <p class="say" aria-live="polite"></p>
            <div class="acts"><button type="button" class="tap btn again">Try again</button><button type="button" class="tap btn next">Next load</button></div>
          </div>
        </div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.lift')) return;
    this.cv = q('canvas.art');
    this.colors = loadColors(this.root);
    onTap(q('.minus'), () => this.nudge(-1));
    onTap(q('.plus'), () => this.nudge(1));
    onTap(q('.lift'), () => this.lift());
    onTap(q('.again'), () => this.lower());
    onTap(q('.next'), () => this.nextRound());
    this.deal();
    this.quill?.speak('Pick a time, then tap Lift.', 5000);
  }

  get round() { return ROUNDS[this.roundNo]; }
  get work() { return this.round.m * G * this.round.h; }

  deal() {
    const q = (s) => this.root.querySelector(s);
    const r = this.round;
    this.secs = 2;
    this.roundWon = false;
    q('.chip.w').textContent = `W = mgh = ${r.m} x 10 x ${fmt(r.h)} = ${this.work} J`;
    q('.chip.t').textContent = `target P = ${r.target} W`;
    q('.next').dataset.on = '0';
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    this.lower();
  }

  nudge(dt) {
    if (this.lifted) return;
    this.secs = Math.min(T_MAX, Math.max(T_MIN, this.secs + dt));
    this.paint();
  }

  lift() {
    if (this.lifted) return;
    this.lifted = true;
    const r = this.round, p = this.work / this.secs;
    const say = this.root.querySelector('.say');
    const shown = Number.isInteger(p) ? String(p) : p.toFixed(1);
    if (p === r.target) {
      this.roundWon = true;
      say.dataset.k = 'good';
      say.textContent = `P = ${this.work} / ${this.secs} = ${shown} W. Right on target.`;
      this.root.querySelectorAll('.dot')[this.roundNo].dataset.on = '1';
      if (this.roundNo === ROUNDS.length - 1) {
        this.allWon = true;
        finishGame(this);
        this.quill?.perform('hop');
      } else {
        this.root.querySelector('.next').dataset.on = '1';
        this.quill?.speak('Right on the line.', 2500);
      }
    } else {
      say.dataset.k = 'miss';
      say.textContent = `P = ${this.work} / ${this.secs} = ${shown} W: ${p > r.target ? 'too fast. Take more time' : 'too slow. Take less time'}.`;
      this.root.querySelector('.again').dataset.on = '1';
    }
    this.startAnim(Math.min(2.2, Math.max(0.8, this.secs * 0.16)));
    this.paint();
  }

  lower() {
    this.lifted = false;
    this.stopAnim();
    const q = (s) => this.root.querySelector(s);
    q('.again').dataset.on = '0';
    q('.say').textContent = '';
    q('.say').dataset.k = '';
    this.paint();
  }

  nextRound() {
    if (!this.roundWon || this.roundNo >= ROUNDS.length - 1) return;
    this.roundNo += 1;
    this.deal();
  }

  paint() {
    const q = (s) => this.root.querySelector(s);
    if (!q('.lift')) return;
    q('.tval').textContent = `t = ${this.secs} s`;
    q('.minus').disabled = this.lifted || this.secs <= T_MIN;
    q('.plus').disabled = this.lifted || this.secs >= T_MAX;
    q('.lift').disabled = this.lifted;
    this.draw();
  }

  // --- the animation clock (own rAF; none of the reserved scene names) ---
  startAnim(dur) {
    this.stopAnim();
    const calm = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (calm) { this.anim = null; this.draw(); return; }
    this.anim = { t0: performance.now(), dur };
    const loop = () => {
      this.draw();
      if (this.anim && (performance.now() - this.anim.t0) / 1000 < this.anim.dur + 0.7) this.loopId = requestAnimationFrame(loop);
      else { this.anim = null; this.loopId = 0; this.draw(); }
    };
    this.loopId = requestAnimationFrame(loop);
  }
  stopAnim() { if (this.loopId) cancelAnimationFrame(this.loopId); this.loopId = 0; this.anim = null; }
  // 0..1 of the lift (1 at rest after a lift), and 0..1 of the bar fill after it
  liftU() {
    if (!this.lifted) return 0;
    if (!this.anim) return 1;
    return clamp01((performance.now() - this.anim.t0) / 1000 / this.anim.dur);
  }
  barU() {
    if (!this.lifted) return 0;
    if (!this.anim) return 1;
    return clamp01(((performance.now() - this.anim.t0) / 1000 - this.anim.dur * 0.25) / (this.anim.dur * 0.75));
  }

  refreshTheme() { if (this.cv) { this.colors = loadColors(this.root); this.draw(); } }
  destroy() { this.stopAnim(); super.destroy(); }

  // canvas text size, design px: the canvas shows at about 0.43 scale on a 390 phone, so
  // portrait draws 34 (about 14.5 px on screen); landscape keeps 26
  // the crate grows a little on the phone so its bigger stencil fits on it
  get crw() { return this.fs > 26 ? 108 : CRW; }
  get fs() { return this.root?.classList?.contains('sim-dom-root--portrait') ? 34 : 26; }

  draw() {
    const cv = this.cv, c = this.colors;
    if (!cv || !c) return;
    const ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, DW, DH);
    const r = this.round, roofY = GY - r.h * PXM;
    const u = inOutSine(this.liftU());
    this.scenery(ctx, c, roofY);
    this.watch(ctx, c, u);
    // the height of the lift: ground to roof, dashed (a displacement)
    displacementArrow(ctx, c, ROPE_X - this.crw / 2 - 24, GY - 2, ROPE_X - this.crw / 2 - 24, roofY + 2, { label: `h = ${fmt(r.h)} m`, side: -1, size: this.fs });
    this.ropeAndCrate(ctx, c, roofY, u);
    this.worker(ctx, c, roofY, u);
    this.powerBar(ctx, c);
  }

  scenery(ctx, c, roofY) {
    const sky = ctx.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0, c.setSkyTop); sky.addColorStop(1, c.setSkyLow);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, DW, GY);
    // ground: a packed-earth strip with a lighter top edge and a darker band below
    const gnd = mix(c.setGround, c.label, 0.08);
    ctx.fillStyle = gnd; ctx.fillRect(0, GY, DW, DH - GY);
    ctx.fillStyle = lighten(gnd, 0.18); ctx.fillRect(0, GY, DW, 3);
    ctx.fillStyle = darken(gnd, 0.15); ctx.fillRect(0, GY + 16, DW, DH - GY - 16);
    // the house wall: bricks, a light left face edge, a shade band under the roof
    const brick = mix(c.s8, c.bgSurface, 0.35);
    const H = GY - roofY;
    ctx.save();
    ctx.fillStyle = brick; ctx.fillRect(WALL_X0, roofY, WALL_X1 - WALL_X0, H);
    ctx.beginPath(); ctx.rect(WALL_X0, roofY, WALL_X1 - WALL_X0, H); ctx.clip();
    ctx.strokeStyle = darken(brick, 0.22); ctx.lineWidth = 1.5;
    for (let y = GY, row = 0; y > roofY; y -= 14, row++) {
      ctx.beginPath(); ctx.moveTo(WALL_X0, y); ctx.lineTo(WALL_X1, y); ctx.stroke();
      for (let x = WALL_X0 + (row % 2 ? 14 : 0); x < WALL_X1; x += 28) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 14); ctx.stroke(); }
    }
    ctx.fillStyle = alpha(darken(brick, 0.4), 0.35); ctx.fillRect(WALL_X0, roofY, WALL_X1 - WALL_X0, 16);
    ctx.fillStyle = alpha(lighten(brick, 0.4), 0.5); ctx.fillRect(WALL_X0, roofY, 5, H);
    ctx.fillStyle = alpha(darken(brick, 0.3), 0.4); ctx.fillRect(WALL_X1 - 26, roofY, 26, H);
    ctx.restore();
    // a window, and the roof slab with its lip
    const win = { x: WALL_X0 + 62, y: Math.max(roofY + 26, GY - 82), w: 40, h: 46 };
    if (win.y + win.h < GY - 8) {
      ctx.fillStyle = darken(brick, 0.35); rr(ctx, win.x - 4, win.y - 4, win.w + 8, win.h + 8, 4); ctx.fill();
      ctx.fillStyle = mix(c.glass, c.bgSurface, 0.3); ctx.fillRect(win.x, win.y, win.w, win.h);
      ctx.fillStyle = alpha(lighten(c.glass, 0.5), 0.6); ctx.fillRect(win.x + 4, win.y + 4, 8, win.h - 8);
      ctx.fillStyle = darken(brick, 0.35); ctx.fillRect(win.x + win.w / 2 - 1.5, win.y, 3, win.h);
    }
    const slab = mix(c.bgSurface, c.label, 0.3);
    ctx.fillStyle = darken(slab, 0.2); ctx.fillRect(WALL_X0 - 8, roofY - 2, WALL_X1 - WALL_X0 + 16, 10);
    ctx.fillStyle = slab; ctx.fillRect(WALL_X0 - 8, roofY - 8, WALL_X1 - WALL_X0 + 16, 8);
    ctx.fillStyle = lighten(slab, 0.3); ctx.fillRect(WALL_X0 - 8, roofY - 8, WALL_X1 - WALL_X0 + 16, 2);
    // the davit: a post on the roof edge and an arm out over the wall, holding the pulley
    const steel = mix(c.bgSurface, c.label, 0.5);
    const armY = roofY - 104;
    ctx.fillStyle = darken(steel, 0.25); ctx.fillRect(WALL_X0 + 6, armY, 8, 96);
    ctx.fillStyle = lighten(steel, 0.2); ctx.fillRect(WALL_X0 + 6, armY, 3, 96);
    ctx.fillStyle = steel; rr(ctx, ROPE_X + PUL_R - 6, armY - 5, WALL_X0 + 20 - (ROPE_X + PUL_R - 6), 10, 3); ctx.fill();
    ctx.fillStyle = lighten(steel, 0.3); ctx.fillRect(ROPE_X + PUL_R - 4, armY - 5, WALL_X0 + 16 - (ROPE_X + PUL_R - 6), 3);
    ctx.fillStyle = darken(steel, 0.2); ctx.fillRect(ROPE_X + PUL_R - 1, armY + 3, 4, 10);
  }

  ropeAndCrate(ctx, c, roofY, u) {
    const r = this.round;
    const armY = roofY - 104, py = armY + 18, px = ROPE_X + PUL_R;
    const crateBottom = GY - u * r.h * PXM;
    const ringY = crateBottom - CRH - 14;
    const rope = mix(c.gold, c.labelMuted, 0.35);
    const line = (x1, y1, x2, y2) => {
      ctx.strokeStyle = darken(rope, 0.35); ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = rope; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };
    ctx.save();
    ctx.lineCap = 'round';
    line(ROPE_X, py, ROPE_X, ringY);
    // sling and ring
    ctx.strokeStyle = darken(rope, 0.3); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(ROPE_X - this.crw / 2 + 6, crateBottom - CRH); ctx.lineTo(ROPE_X, ringY); ctx.lineTo(ROPE_X + this.crw / 2 - 6, crateBottom - CRH); ctx.stroke();
    if (u > 0.01) drawShadow(ctx, c, ROPE_X, GY + 2, this.crw * 0.45 * (1 - 0.6 * u), 4, 0.6);
    drawCrate(ctx, c, { x: ROPE_X, y: crateBottom, w: this.crw, h: CRH, held: u > 0.01 });
    ctx.restore();
    // the mass, stencilled on the crate
    ctx.save();
    ctx.fillStyle = alpha(c.bgSurface, 0.88); ctx.font = font(c, 800, this.fs, true);
    const lw = ctx.measureText(`${r.m} kg`).width + 12;
    rr(ctx, ROPE_X - lw / 2, crateBottom - CRH / 2 - this.fs * 0.6, lw, this.fs * 1.2, 6); ctx.fill();
    ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${r.m} kg`, ROPE_X, crateBottom - CRH / 2 + 1);
    ctx.restore();
    this.handY = py + 26;
    this.pulley = { x: px, y: py };
    drawPulley(ctx, c, px, py, PUL_R);
  }

  worker(ctx, c, roofY, u) {
    const r = this.round;
    // hand over hand while the crate goes up; both hands on the rope at rest
    const moving = this.anim && u > 0 && u < 1;
    const ph = moving ? u * r.h * 3.2 * Math.PI : 0;
    const gy = this.handY;
    const near = { x: 376 + (moving ? Math.sin(ph) * 9 : 0), y: gy + (moving ? Math.cos(ph) * 5 : 0) };
    const far = { x: 388 - (moving ? Math.sin(ph) * 9 : 0), y: gy + 4 - (moving ? Math.cos(ph) * 5 : 0) };
    const rope = mix(c.gold, c.labelMuted, 0.35);
    ctx.save();
    ctx.strokeStyle = darken(rope, 0.35); ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(this.pulley.x + PUL_R * 0.6, this.pulley.y + PUL_R * 0.8); ctx.lineTo(near.x, near.y); ctx.stroke();
    ctx.strokeStyle = rope; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(this.pulley.x + PUL_R * 0.6, this.pulley.y + PUL_R * 0.8); ctx.lineTo(near.x, near.y); ctx.stroke();
    // the pulled rope piles on the roof behind the worker
    ctx.strokeStyle = darken(rope, 0.2); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(far.x, far.y); ctx.quadraticCurveTo(FIG_X + 24, roofY - 30, FIG_X + 40, roofY - 10); ctx.stroke();
    const coil = 8 + 12 * u;
    ctx.fillStyle = rope; ctx.strokeStyle = darken(rope, 0.35); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(FIG_X + 48, roofY - 11, coil, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    const spec = figureFor(this, {
      role: 'adult', pose: { name: 'pull', lean: -14, crouch: 0.18 }, x: FIG_X, y: roofY - 8, height: FIG_H, facing: -1,
      hands: [near, far], look: { mood: 'effort' }, i: 1,
    });
    drawFigure(ctx, c, spec, spec.look);
  }

  watch(ctx, c, u) {
    const { x, y, r } = WATCH;
    const shown = this.lifted ? this.secs * u : 0;
    const case_ = mix(c.bgSurface, c.label, 0.4);
    ctx.save();
    // crown and button
    ctx.fillStyle = darken(case_, 0.2); rr(ctx, x - 7, y - r - 14, 14, 10, 3); ctx.fill();
    ctx.fillStyle = case_; rr(ctx, x - 11, y - r - 20, 22, 7, 3); ctx.fill();
    // case: a darker lip below, a ring, then the face
    ctx.fillStyle = darken(case_, 0.4); ctx.beginPath(); ctx.arc(x, y + 4, r + 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = case_; ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = mix(c.bgDeep, c.label, 0.05); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(lighten(case_, 0.5), 0.5); ctx.beginPath(); ctx.ellipse(x - r * 0.45, y - r * 0.5, r * 0.22, r * 0.1, -0.6, 0, Math.PI * 2); ctx.fill();
    // the time so far as a filled wedge (a 15 s dial), and ticks
    const a0 = -Math.PI / 2, a1 = a0 + (shown / T_MAX) * Math.PI * 2;
    if (shown > 0) {
      ctx.fillStyle = alpha(c.s5, 0.45);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r - 4, a0, a1); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = c.labelMuted; ctx.lineWidth = 2;
    for (let i = 0; i < T_MAX; i++) {
      const a = a0 + (i / T_MAX) * Math.PI * 2, k = i % 5 === 0 ? 10 : 5;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (r - 2), y + Math.sin(a) * (r - 2)); ctx.lineTo(x + Math.cos(a) * (r - 2 - k), y + Math.sin(a) * (r - 2 - k)); ctx.stroke();
    }
    ctx.strokeStyle = c.label; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a1) * (r - 10), y + Math.sin(a1) * (r - 10)); ctx.stroke();
    ctx.fillStyle = c.label; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const t = this.lifted ? Math.round(shown) : this.secs;
    pill(ctx, c, `t = ${t} s`, x, y + r + 30, { bg: c.s5, size: this.fs });
  }

  powerBar(ctx, c) {
    const r = this.round, k = this.barU();
    const p = this.lifted ? this.work / this.secs : 0;
    const max = r.target * 2;
    const b = drawEnergyBars(ctx, c, {
      x: BAR_X, y: 54, h: 160, barW: 52, size: this.fs, max, panel: false,
      bars: [{ id: 'P', label: ' ', tone: 5 }], values: { P: p * k },
    });
    const top = b.baseY - (r.target / max) * 160;
    ctx.save();
    ctx.strokeStyle = c.gold; ctx.lineWidth = 3.5; ctx.setLineDash([9, 5]);
    const bx = b.bars[0].x, bw = b.bars[0].w;
    ctx.beginPath(); ctx.moveTo(bx - 12, top); ctx.lineTo(bx + bw + 12, top); ctx.stroke();
    ctx.restore();
    fitPill(ctx, c, `target ${r.target} W`, bx + bw / 2, 24, { bg: c.gold, size: this.fs });
    const done = this.lifted && k > 0.95;
    const shown = Number.isInteger(p) ? String(p) : p.toFixed(1);
    pill(ctx, c, done ? `P = ${shown} W` : 'P', bx + bw / 2, b.baseY + 22, { bg: done ? (p === r.target ? c.good : c.s5) : c.raised, ink: done ? undefined : c.label, size: this.fs });
  }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.lift')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }
}
