// EnergyBooksGameScene - blk-l09-s10, mini-game@1. An electric winch on a gantry takes in
// the input energy shown and lifts a crate (m and h given). The learner sets how much of the
// input becomes useful work and how much becomes heat (100 J steps); three energy bars
// (input, useful work, heat) follow, with the input as a dashed total line. Run lifts the
// crate as high as the useful work can (h = useful / mg) and the motor gives off the heat.
// Right = useful work = mgh and input = useful work + heat. Every round's numbers are whole
// hundreds, so every round can be won. Made-up numbers.
// Board: GameFrame (DOM) with one canvas picture drawn with kit SimEnergy, SimProps,
// SimApparatus and SimLook helpers. Control names: .uminus, .uplus, .hminus, .hplus, .run,
// .again, .next.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, pill, font, mix, darken, lighten, alpha, rr, drawShadow, clamp01, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawCrate, displacementArrow } from 'simulations/base/kit/SimApparatus.js';
import { drawPulley } from 'simulations/base/kit/SimProps.js';
import { drawEnergyBars } from 'simulations/base/kit/SimEnergy.js';

const G = 10, STEP = 100;
const ROUNDS = [
  { input: 1000, m: 20, h: 3 },   // useful 600 J, heat 400 J
  { input: 1500, m: 40, h: 3 },   // 1200, 300
  { input: 800, m: 10, h: 5 },    // 500, 300
  { input: 2000, m: 25, h: 4 },   // 1000, 1000
  { input: 1200, m: 30, h: 3 },   // 900, 300
];

// Canvas design 680 x 250 (drawn at 2x).
const DW = 680, DH = 250, DPR = 2;
const GY = 228, PXM = 30, H_CAP = 5.4;
const PUL = { x: 226, y: 34, r: 16 };
const LOAD_X = PUL.x + PUL.r;
const DRUM = { x: 84, y: GY - 40, r: 20 };
const CRW = 68, CRH = 48;
const BAR_X = 446;
const PHONE_ROW = 262;                 // the bar row under the picture, portrait only

const CSS = `
.gm.eb { background: var(--sim-bg-deep); border-radius: 14px; }
.eb .play { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 14px; align-items: start; }
.eb .stage { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 4px; overflow: hidden; }
.eb canvas { display: block; width: 100%; max-width: 700px; margin: 0 auto; aspect-ratio: ${DW} / ${DH}; border-radius: calc(var(--sim-radius-lg) - 4px); }
.eb .side { display: flex; flex-direction: column; gap: 8px; }
.eb .dots { display: flex; gap: 6px; align-items: center; }
.eb .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--sim-track); }
.eb .dot[data-on="1"] { background: var(--sim-good); }
.eb .dots .pn { margin-left: 8px; font-size: 14px; font-weight: 700; color: var(--sim-label-muted); }
.eb .step { display: flex; align-items: center; gap: 8px; }
.eb .step .nm { width: 96px; font-size: 15px; font-weight: 800; }
.eb .step .nm.u { color: var(--sim-series-3-ink); }
.eb .step .nm.h { color: var(--sim-series-8-ink); }
.eb .step .btn { width: 52px; font-size: 24px; line-height: 1; padding: 0; }
.eb .val { flex: 1; text-align: center; font: 800 21px/1 var(--sim-font-display); }
.eb .run { background: var(--sim-accent); color: var(--sim-bg-deep); border: 0; font-size: 17px; font-weight: 800;
           box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.eb .say { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
.eb .say[data-k="good"] { color: var(--sim-good); }
.eb .say:empty { display: none; }
.eb .again, .eb .next { display: none; }
.eb .acts { display: none; gap: 8px; }
.eb .acts:has([data-on="1"]) { display: flex; }
.eb .again[data-on="1"], .eb .next[data-on="1"] { display: inline-block; }
.eb .next { background: var(--sim-good); color: var(--sim-bg-deep); border: 0; }
.eb .btn[disabled] { opacity: 0.45; cursor: default; }
.sim-dom-root--portrait .eb .play { grid-template-columns: minmax(0, 1fr); gap: 10px; }
.sim-dom-root--portrait .eb canvas { max-width: none; }
.sim-dom-root--portrait .eb .step .nm { width: 88px; }
.gm-quill .sim-dom-root--portrait .eb .sub { padding-right: 56px; }
`;

export class EnergyBooksGameScene extends GameBoard {
  static ARIA_LABEL = 'A five-round game: an electric winch takes in the input energy shown and lifts a crate of known mass a known height. Set how much of the input becomes useful work and how much becomes heat; bars show input, useful work and heat. Run: the crate rises as high as the useful work allows.';
  static OBJECTIVE = { prompt: { en: 'A machine takes in the energy shown. Set how much becomes useful work and how much becomes heat. Input = useful work + heat.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.useful = 0;
    this.heat = 0;
    this.ran = false;
    this.roundWon = false;
    this.allWon = false;
    this.anim = null;
    this.loopId = 0;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      html: `<div class="gm eb">
        <div class="gm-head"><p class="kicker">Energy in machines</p><h2>Where does the <b>input</b> go?</h2>
          <p class="sub">Useful work = mgh, g = 10 m/s^2. Input = useful work + heat.</p></div>
        <div class="play">
          <div class="stage"><canvas class="art" width="${DW * DPR}" height="${DH * DPR}" role="img" aria-label="An electric winch on a gantry with a crate on the rope, and three energy bars: input, useful work and heat"></canvas></div>
          <div class="side">
            <div class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}<span class="pn">numbers for example</span></div>
            <div class="step"><span class="nm u">Useful work</span>
              <button type="button" class="tap btn uminus" aria-label="100 J less useful work">&minus;</button>
              <span class="val uval" aria-live="polite"></span>
              <button type="button" class="tap btn uplus" aria-label="100 J more useful work">+</button></div>
            <div class="step"><span class="nm h">Heat</span>
              <button type="button" class="tap btn hminus" aria-label="100 J less heat">&minus;</button>
              <span class="val hval" aria-live="polite"></span>
              <button type="button" class="tap btn hplus" aria-label="100 J more heat">+</button></div>
            <button type="button" class="tap btn run">Run the winch</button>
            <p class="say" aria-live="polite"></p>
            <div class="acts"><button type="button" class="tap btn again">Try again</button><button type="button" class="tap btn next">Next load</button></div>
          </div>
        </div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.run')) return;
    this.cv = q('canvas.art');
    this.colors = loadColors(this.root);
    onTap(q('.uminus'), () => this.nudge('useful', -STEP));
    onTap(q('.uplus'), () => this.nudge('useful', STEP));
    onTap(q('.hminus'), () => this.nudge('heat', -STEP));
    onTap(q('.hplus'), () => this.nudge('heat', STEP));
    onTap(q('.run'), () => this.run());
    onTap(q('.again'), () => this.reset());
    onTap(q('.next'), () => this.nextRound());
    this.deal();
    this.quill?.speak('Split the input, then run it.', 5000);
  }

  get round() { return ROUNDS[this.roundNo]; }
  get mgh() { return this.round.m * G * this.round.h; }

  deal() {
    this.useful = 0;
    this.heat = 0;
    this.roundWon = false;
    this.root.querySelector('.next').dataset.on = '0';
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    this.reset();
  }

  nudge(k, d) {
    if (this.ran) return;
    this[k] = Math.min(this.round.input, Math.max(0, this[k] + d));
    this.paint();
  }

  run() {
    if (this.ran) return;
    this.ran = true;
    const r = this.round, sum = this.useful + this.heat;
    const say = this.root.querySelector('.say');
    if (this.useful === this.mgh && sum === r.input) {
      this.roundWon = true;
      say.dataset.k = 'good';
      say.textContent = `${this.useful} + ${this.heat} = ${r.input} J. All of the input is counted.`;
      this.root.querySelectorAll('.dot')[this.roundNo].dataset.on = '1';
      if (this.roundNo === ROUNDS.length - 1) {
        this.allWon = true;
        finishGame(this);
        this.quill?.perform('hop');
      } else {
        this.root.querySelector('.next').dataset.on = '1';
        this.quill?.speak('Every joule counted.', 2500);
      }
    } else {
      say.dataset.k = 'miss';
      if (this.useful !== this.mgh) {
        say.textContent = `Useful work = mgh = ${r.m} x 10 x ${r.h} = ${this.mgh} J, not ${this.useful} J.`;
      } else {
        say.textContent = `${this.useful} + ${this.heat} = ${sum} J, but the input is ${r.input} J.`;
      }
      this.root.querySelector('.again').dataset.on = '1';
    }
    this.startAnim(1.4);
    this.paint();
  }

  reset() {
    this.ran = false;
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
    if (!q('.run')) return;
    const r = this.round;
    q('.uval').textContent = `${this.useful} J`;
    q('.hval').textContent = `${this.heat} J`;
    q('.uminus').disabled = this.ran || this.useful <= 0;
    q('.uplus').disabled = this.ran || this.useful >= r.input;
    q('.hminus').disabled = this.ran || this.heat <= 0;
    q('.hplus').disabled = this.ran || this.heat >= r.input;
    q('.run').disabled = this.ran;
    this.draw();
  }

  startAnim(dur) {
    this.stopAnim();
    const calm = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (calm) { this.draw(); return; }
    this.anim = { t0: performance.now(), dur };
    const loop = () => {
      this.draw();
      if (this.anim && (performance.now() - this.anim.t0) / 1000 < this.anim.dur) this.loopId = requestAnimationFrame(loop);
      else { this.anim = null; this.loopId = 0; this.draw(); }
    };
    this.loopId = requestAnimationFrame(loop);
  }
  stopAnim() { if (this.loopId) cancelAnimationFrame(this.loopId); this.loopId = 0; this.anim = null; }
  runU() { return !this.ran ? 0 : !this.anim ? 1 : clamp01((performance.now() - this.anim.t0) / 1000 / this.anim.dur); }

  refreshTheme() { if (this.cv) { this.colors = loadColors(this.root); this.draw(); } }
  destroy() { this.stopAnim(); super.destroy(); }

  // canvas text size, design px: the canvas shows at about 0.43 scale on a 390 phone, so
  // portrait draws 34 (about 14.5 px on screen); landscape keeps 26
  // the crate grows a little on the phone so its bigger stencil fits on it
  get crw() { return this.fs > 26 ? 96 : CRW; }
  get fs() { return this.root?.classList?.contains('sim-dom-root--portrait') ? 34 : 26; }

  draw() {
    const cv = this.cv, c = this.colors;
    if (!cv || !c) return;
    const ctx = cv.getContext('2d');
    // on the phone the bars go under the picture (a taller canvas), so their labels can be big
    const phone = this.fs > 26, HH = phone ? DH + PHONE_ROW : DH;
    if (cv.height !== HH * DPR) { cv.height = HH * DPR; cv.style.aspectRatio = `${DW} / ${HH}`; }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, DW, HH);
    const r = this.round, u = inOutSine(this.runU());
    // how high the useful work lifts this crate (h = W / mg), capped to the frame
    const reach = Math.min(H_CAP, this.useful / (r.m * G));
    const lift = u * reach;
    this.scenery(ctx, c);
    // the target height: dashed, from the ground to h
    const ax = 330;
    displacementArrow(ctx, c, ax, GY - 2, ax, GY - r.h * PXM, { tone: 2, width: 4, head: 12 });
    ctx.save();
    ctx.strokeStyle = alpha(c.s2ink, 0.7); ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(LOAD_X - this.crw / 2 - 6, GY - r.h * PXM); ctx.lineTo(ax + 8, GY - r.h * PXM); ctx.stroke();
    ctx.restore();
    pill(ctx, c, `h = ${r.h} m`, ax + 10, GY - r.h * PXM / 2, { bg: c.s2, size: this.fs, align: 'left' });
    this.winch(ctx, c, u);
    this.ropeAndCrate(ctx, c, lift, u);
    // the bars: what the learner has split so far; the input is the dashed total
    drawEnergyBars(ctx, c, {
      x: phone ? 160 : BAR_X, y: phone ? DH + 6 : 12, h: phone ? 96 : 124, barW: phone ? 52 : 38, gap: phone ? 76 : 32,
      minSize: phone ? this.fs : undefined, size: this.fs, max: r.input * 1.12, total: r.input,
      showValues: true,   // values in J (the steppers carry the unit)
      bars: [{ id: 'in', label: 'input', tone: 5 }, { id: 'U', label: 'useful work', tone: 3 }, { id: 'heat', label: 'heat', tone: 8 }],
      values: { in: r.input, U: this.useful, heat: this.heat },
    });
  }

  scenery(ctx, c) {
    const sky = ctx.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0, c.setSkyTop); sky.addColorStop(1, c.setSkyLow);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, DW, GY);
    // a site floor: concrete slab with expansion joints
    const slab = mix(c.setGround, c.labelMuted, 0.3);
    ctx.fillStyle = slab; ctx.fillRect(0, GY, DW, DH - GY);
    ctx.fillStyle = lighten(slab, 0.22); ctx.fillRect(0, GY, DW, 3);
    ctx.strokeStyle = darken(slab, 0.2); ctx.lineWidth = 2;
    for (let x = 60; x < DW; x += 120) { ctx.beginPath(); ctx.moveTo(x, GY + 3); ctx.lineTo(x, DH); ctx.stroke(); }
    // the gantry: two legs in an A from the floor to the top beam, a cross brace, the beam
    const steel = mix(c.s1, c.bgSurface, 0.35);
    const leg = (x0, x1) => {
      ctx.strokeStyle = darken(steel, 0.3); ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, GY); ctx.lineTo(x1, PUL.y - 12); ctx.stroke();
      ctx.strokeStyle = steel; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x0, GY); ctx.lineTo(x1, PUL.y - 12); ctx.stroke();
      ctx.strokeStyle = lighten(steel, 0.35); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 - 2, GY); ctx.lineTo(x1 - 2, PUL.y - 12); ctx.stroke();
    };
    leg(146, 178);
    leg(314, 284);
    ctx.strokeStyle = darken(steel, 0.15); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(154, GY - 46); ctx.lineTo(308, GY - 46); ctx.stroke();
    ctx.fillStyle = darken(steel, 0.3); rr(ctx, 162, PUL.y - 22, 140, 16, 4); ctx.fill();
    ctx.fillStyle = steel; rr(ctx, 162, PUL.y - 24, 140, 13, 4); ctx.fill();
    ctx.fillStyle = lighten(steel, 0.35); ctx.fillRect(166, PUL.y - 22, 132, 3);
    for (const x of [146, 314]) drawShadow(ctx, c, x, GY + 1, 14, 3, 0.6);
  }

  // The electric winch: a motor body with fins and a cable from the wall socket, and the drum.
  winch(ctx, c, u) {
    const r = this.round;
    const body = mix(c.s5, c.bgSurface, 0.25);
    const mx = 10, my = GY - 66, mw = 58, mh = 56;
    // power cable in from the left edge
    ctx.save();
    ctx.strokeStyle = darken(c.labelMuted, 0.25); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, GY - 6); ctx.quadraticCurveTo(14, GY - 4, mx + 6, my + mh - 8); ctx.stroke();
    ctx.restore();
    drawShadow(ctx, c, DRUM.x - 30, GY + 1, 70, 5, 0.7);
    ctx.fillStyle = darken(body, 0.35); rr(ctx, mx, my + 4, mw, mh, 8); ctx.fill();
    ctx.fillStyle = body; rr(ctx, mx, my, mw, mh - 2, 8); ctx.fill();
    ctx.fillStyle = alpha(lighten(body, 0.4), 0.8); rr(ctx, mx + 6, my + 5, mw * 0.4, 5, 2.5); ctx.fill();
    ctx.fillStyle = darken(body, 0.2); ctx.fillRect(mx + mw * 0.66, my + 4, mw * 0.3, mh - 10);
    ctx.strokeStyle = darken(body, 0.35); ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(mx + 6, my + i * 10 + 6); ctx.lineTo(mx + mw - 6, my + i * 10 + 6); ctx.stroke(); }
    // base plate under motor and drum
    const plate = mix(c.bgSurface, c.label, 0.4);
    ctx.fillStyle = darken(plate, 0.25); rr(ctx, mx - 6, GY - 10, DRUM.x + DRUM.r + 12 - mx, 10, 3); ctx.fill();
    ctx.fillStyle = lighten(plate, 0.1); ctx.fillRect(mx - 4, GY - 10, DRUM.x + DRUM.r + 8 - mx, 3);
    // drum: a side cheek, rope wound on it, a turning spoke
    const metal = mix(c.bgSurface, c.label, 0.48);
    ctx.fillStyle = darken(metal, 0.3); ctx.fillRect(DRUM.x - 4, DRUM.y, 8, GY - 10 - DRUM.y);
    ctx.fillStyle = darken(metal, 0.2); ctx.beginPath(); ctx.arc(DRUM.x, DRUM.y, DRUM.r + 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = mix(c.gold, c.labelMuted, 0.35); ctx.beginPath(); ctx.arc(DRUM.x, DRUM.y, DRUM.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = darken(mix(c.gold, c.labelMuted, 0.35), 0.3); ctx.lineWidth = 1.5;
    for (let k = 6; k < DRUM.r; k += 4) { ctx.beginPath(); ctx.arc(DRUM.x, DRUM.y, k, 0, Math.PI * 2); ctx.stroke(); }
    const spin = u * 10;
    ctx.strokeStyle = darken(metal, 0.45); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(DRUM.x, DRUM.y); ctx.lineTo(DRUM.x + Math.cos(spin) * (DRUM.r - 3), DRUM.y + Math.sin(spin) * (DRUM.r - 3)); ctx.stroke();
    // the heat leaving the motor: wavy lines, as many as the heat set, rising after Run
    if (this.ran && this.heat > 0) {
      const n = Math.max(1, Math.round((this.heat / r.input) * 6));
      ctx.save();
      ctx.strokeStyle = alpha(c.s8, 0.85); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const x = mx + 8 + (i * (mw - 16)) / Math.max(1, n - 1) * (n > 1 ? 1 : 0) + (n === 1 ? mw / 2 - 8 : 0);
        const rise = 8 + u * 22;
        ctx.globalAlpha = Math.min(1, u * 2);
        ctx.beginPath();
        for (let k = 0; k <= 12; k++) {
          const y = my - 6 - k * 2.6 - rise * 0.4;
          const xx = x + Math.sin(k * 0.9 + u * 6 + i) * 3.5;
          if (k === 0) ctx.moveTo(xx, y); else ctx.lineTo(xx, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  ropeAndCrate(ctx, c, lift, u) {
    const r = this.round;
    const rope = mix(c.gold, c.labelMuted, 0.35);
    const crateBottom = GY - lift * PXM;
    const ringY = crateBottom - CRH - 12;
    const line = (x1, y1, x2, y2) => {
      ctx.strokeStyle = darken(rope, 0.35); ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = rope; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };
    ctx.save();
    ctx.lineCap = 'round';
    line(DRUM.x, DRUM.y - DRUM.r, PUL.x - PUL.r * 0.7, PUL.y - PUL.r * 0.7);
    line(LOAD_X, PUL.y, LOAD_X, ringY);
    ctx.strokeStyle = darken(rope, 0.3); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(LOAD_X - this.crw / 2 + 6, crateBottom - CRH); ctx.lineTo(LOAD_X, ringY); ctx.lineTo(LOAD_X + this.crw / 2 - 6, crateBottom - CRH); ctx.stroke();
    ctx.restore();
    if (lift > 0.02) drawShadow(ctx, c, LOAD_X, GY + 2, this.crw * 0.45 * (1 - lift / 8), 4, 0.6);
    drawCrate(ctx, c, { x: LOAD_X, y: crateBottom, w: this.crw, h: CRH, held: lift > 0.02 });
    ctx.save();
    ctx.fillStyle = alpha(c.bgSurface, 0.88); ctx.font = font(c, 800, this.fs, true);
    const lw = ctx.measureText(`${r.m} kg`).width + 12;
    rr(ctx, LOAD_X - lw / 2, crateBottom - CRH / 2 - this.fs * 0.6, lw, this.fs * 1.2, 6); ctx.fill();
    ctx.fillStyle = c.label; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${r.m} kg`, LOAD_X, crateBottom - CRH / 2 + 1);
    ctx.restore();
    drawPulley(ctx, c, PUL.x, PUL.y, PUL.r);
    void u;
  }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.run')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }
}
