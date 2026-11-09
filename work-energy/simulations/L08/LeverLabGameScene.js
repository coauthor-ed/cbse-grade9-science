// LeverLabGameScene - blk-l08-s14, mini-game@1. A plank on a fulcrum, held level by two
// props. Each round gives a load (a crate, its weight in N) on the left and an effort (an
// iron weight, in N) on the right. The learner sets the load arm and the effort arm in
// 0.25 m steps and taps Let go: the props drop and the plank tips by the bigger moment, or
// stays level when effort x effort arm = load x load arm. Level = round won; a tip shows
// both products and offers Try again. Every round's ratio has a pair of arms on the
// 0.25 m seats (up to 2 m), so every round can be won. Made-up numbers.
// Board: GameFrame (DOM) with one canvas picture drawn with kit SimApparatus (drawLeverPlank,
// drawCrate, displacementArrow) and SimLook helpers. Control names: .lminus, .lplus,
// .eminus, .eplus, .go, .again, .next.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors, pill, mix, darken, lighten, alpha, rr, drawShadow, clamp01, outBack } from 'simulations/base/kit/SimLook.js';
import { drawLeverPlank, drawCrate, displacementArrow } from 'simulations/base/kit/SimApparatus.js';

const ARM_MIN = 0.25, ARM_MAX = 2, ARM_STEP = 0.25;
const ROUNDS = [
  { load: 200, effort: 100 },   // e.g. 0.5 m and 1 m
  { load: 300, effort: 100 },   // 0.5 m and 1.5 m
  { load: 450, effort: 300 },   // 1 m and 1.5 m
  { load: 500, effort: 125 },   // 0.5 m and 2 m
  { load: 240, effort: 320 },   // 1 m and 0.75 m
];

// Canvas design 680 x 250 (drawn at 2x).
const DW = 680, DH = 250, DPR = 2;
const GY = 228;
const FX = 340, FY = 160, TH = 16;
const PXM = 140, HALF = 2.08 * PXM;         // 2 m arms plus a little end
const TILT_K = 0.0016, TILT_MAX = 0.17;
const fmt = (v) => (Number.isInteger(v) ? String(v) : String(v));


// a pill kept inside the canvas width: measured first (alpha 0 draws nothing), then shifted in
function fitPill(ctx, c, text, x, y, o) {
  const m = pill(ctx, c, text, x, y, { ...o, alpha: 0 });
  const dx = Math.max(0, 6 - m.x0) - Math.max(0, m.x0 + m.w - (DW - 6));
  return pill(ctx, c, text, x + dx, y, o);
}

const CSS = `
.gm.ll { background: var(--sim-bg-deep); border-radius: 14px; }
.ll .play { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 14px; align-items: start; }
.ll .stage { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 4px; overflow: hidden; }
.ll canvas { display: block; width: 100%; max-width: 700px; margin: 0 auto; aspect-ratio: ${DW} / ${DH}; border-radius: calc(var(--sim-radius-lg) - 4px); }
.ll .side { display: flex; flex-direction: column; gap: 8px; }
.ll .dots { display: flex; gap: 6px; align-items: center; }
.ll .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--sim-track); }
.ll .dot[data-on="1"] { background: var(--sim-good); }
.ll .dots .pn { margin-left: 8px; font-size: 14px; font-weight: 700; color: var(--sim-label-muted); }
.ll .step { display: flex; align-items: center; gap: 8px; }
.ll .step .nm { width: 92px; font-size: 15px; font-weight: 800; }
.ll .step .nm.l { color: var(--sim-series-8-ink); }
.ll .step .nm.e { color: var(--sim-series-1-ink); }
.ll .step .btn { width: 52px; font-size: 24px; line-height: 1; padding: 0; }
.ll .aval { flex: 1; text-align: center; font: 800 21px/1 var(--sim-font-display); }
.ll .go { background: var(--sim-accent); color: var(--sim-bg-deep); border: 0; font-size: 17px; font-weight: 800;
          box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.ll .say { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
.ll .say[data-k="good"] { color: var(--sim-good); }
.ll .say:empty { display: none; }
.ll .again, .ll .next { display: none; }
.ll .acts { display: none; gap: 8px; }
.ll .acts:has([data-on="1"]) { display: flex; }
.ll .again[data-on="1"], .ll .next[data-on="1"] { display: inline-block; }
.ll .next { background: var(--sim-good); color: var(--sim-bg-deep); border: 0; }
.ll .btn[disabled] { opacity: 0.45; cursor: default; }
.sim-dom-root--portrait .ll .play { grid-template-columns: minmax(0, 1fr); gap: 10px; }
.sim-dom-root--portrait .ll canvas { max-width: none; }
.sim-dom-root--portrait .ll .step .nm { width: 84px; }
.gm-quill .sim-dom-root--portrait .ll .sub { padding-right: 56px; }
`;

export class LeverLabGameScene extends GameBoard {
  static ARIA_LABEL = 'A five-round game: a plank on a fulcrum, held level by two props, with a crate (the load) on the left and an iron weight (the effort) on the right. Set the load arm and the effort arm, then let go: the plank stays level only when effort times effort arm equals load times load arm.';
  static OBJECTIVE = { prompt: { en: 'Place the load and the effort on the lever so that it balances. Use effort x effort arm = load x load arm.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.la = 1;
    this.ea = 1;
    this.free = false;      // props gone: the plank answers the moments
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
      html: `<div class="gm ll">
        <div class="gm-head"><p class="kicker">Lever</p><h2>Make the plank <b>balance</b></h2>
          <p class="sub">Effort x effort arm = load x load arm. Set both arms, then let go.</p></div>
        <div class="play">
          <div class="stage"><canvas class="art" width="${DW * DPR}" height="${DH * DPR}" role="img" aria-label="A plank on a fulcrum held level by props, a crate on the left and an iron weight on the right, with their arms marked"></canvas></div>
          <div class="side">
            <div class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}<span class="pn">numbers for example</span></div>
            <div class="step"><span class="nm l">Load arm</span>
              <button type="button" class="tap btn lminus" aria-label="Load closer to the fulcrum">&minus;</button>
              <span class="aval lval" aria-live="polite"></span>
              <button type="button" class="tap btn lplus" aria-label="Load further from the fulcrum">+</button></div>
            <div class="step"><span class="nm e">Effort arm</span>
              <button type="button" class="tap btn eminus" aria-label="Effort closer to the fulcrum">&minus;</button>
              <span class="aval eval" aria-live="polite"></span>
              <button type="button" class="tap btn eplus" aria-label="Effort further from the fulcrum">+</button></div>
            <button type="button" class="tap btn go">Let go</button>
            <p class="say" aria-live="polite"></p>
            <div class="acts"><button type="button" class="tap btn again">Try again</button><button type="button" class="tap btn next">Next pair</button></div>
          </div>
        </div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.go')) return;
    this.cv = q('canvas.art');
    this.colors = loadColors(this.root);
    onTap(q('.lminus'), () => this.nudge('la', -ARM_STEP));
    onTap(q('.lplus'), () => this.nudge('la', ARM_STEP));
    onTap(q('.eminus'), () => this.nudge('ea', -ARM_STEP));
    onTap(q('.eplus'), () => this.nudge('ea', ARM_STEP));
    onTap(q('.go'), () => this.letGo());
    onTap(q('.again'), () => this.prop());
    onTap(q('.next'), () => this.nextRound());
    this.deal();
    this.quill?.speak('Set both arms, then let go.', 5000);
  }

  get round() { return ROUNDS[this.roundNo]; }
  get net() { return this.round.effort * this.ea - this.round.load * this.la; }   // + tips the effort side down
  get target() { return this.free ? Math.max(-TILT_MAX, Math.min(TILT_MAX, this.net * TILT_K)) : 0; }

  deal() {
    this.la = 1;
    this.ea = 1;
    this.roundWon = false;
    this.root.querySelector('.next').dataset.on = '0';
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    this.prop();
  }

  nudge(k, d) {
    if (this.free) return;
    this[k] = Math.min(ARM_MAX, Math.max(ARM_MIN, this[k] + d));
    this.paint();
  }

  letGo() {
    if (this.free) return;
    this.free = true;
    const r = this.round;
    const lm = r.load * this.la, em = r.effort * this.ea;
    const say = this.root.querySelector('.say');
    const both = `${r.effort} x ${fmt(this.ea)} = ${em} and ${r.load} x ${fmt(this.la)} = ${lm}`;
    if (em === lm) {
      this.roundWon = true;
      say.dataset.k = 'good';
      say.textContent = `${both}. Level.`;
      this.root.querySelectorAll('.dot')[this.roundNo].dataset.on = '1';
      if (this.roundNo === ROUNDS.length - 1) {
        this.allWon = true;
        finishGame(this);
        this.quill?.perform('hop');
      } else {
        this.root.querySelector('.next').dataset.on = '1';
        this.quill?.speak('It balances.', 2500);
      }
    } else {
      say.dataset.k = 'miss';
      say.textContent = `${both}: the ${em > lm ? 'effort' : 'load'} side goes down.`;
      this.root.querySelector('.again').dataset.on = '1';
    }
    this.startAnim(0.8);
    this.paint();
  }

  prop() {
    this.free = false;
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
    if (!q('.go')) return;
    q('.lval').textContent = `${fmt(this.la)} m`;
    q('.eval').textContent = `${fmt(this.ea)} m`;
    q('.lminus').disabled = this.free || this.la <= ARM_MIN;
    q('.lplus').disabled = this.free || this.la >= ARM_MAX;
    q('.eminus').disabled = this.free || this.ea <= ARM_MIN;
    q('.eplus').disabled = this.free || this.ea >= ARM_MAX;
    q('.go').disabled = this.free;
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
  // 0..1 since Let go (1 at rest)
  goU() { return !this.free ? 0 : !this.anim ? 1 : clamp01((performance.now() - this.anim.t0) / 1000 / this.anim.dur); }

  refreshTheme() { if (this.cv) { this.colors = loadColors(this.root); this.draw(); } }
  destroy() { this.stopAnim(); super.destroy(); }

  // canvas text size, design px: the canvas shows at about 0.43 scale on a 390 phone, so
  // portrait draws 34 (about 14.5 px on screen); landscape keeps 26
  get fs() { return this.root?.classList?.contains('sim-dom-root--portrait') ? 34 : 26; }

  draw() {
    const cv = this.cv, c = this.colors;
    if (!cv || !c) return;
    const ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, DW, DH);
    const r = this.round, u = this.goU();
    const ang = this.target * outBack(u);
    this.scenery(ctx, c);
    this.props(ctx, c, u);
    const g = drawLeverPlank(ctx, c, { x: FX, y: FY, angle: ang, left: HALF, right: HALF, thick: TH, groundY: GY });
    // notches every 0.25 m along the top, a bigger one each metre
    ctx.save();
    ctx.strokeStyle = alpha(darken(c.gold, 0.45), 0.8); ctx.lineCap = 'round';
    for (let d = -ARM_MAX; d <= ARM_MAX + 1e-6; d += ARM_STEP) {
      if (Math.abs(d) < 1e-6) continue;
      const p = g.at(d * PXM), big = Math.abs(d % 1) < 1e-6;
      const nx = Math.sin(ang), ny = -Math.cos(ang);
      ctx.lineWidth = big ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(p.x - nx * 1, p.y - ny * 1); ctx.lineTo(p.x - nx * (big ? 9 : 6), p.y - ny * (big ? 9 : 6)); ctx.stroke();
    }
    ctx.restore();
    // the arms: dashed, from the fulcrum out to each weight, under the plank (their lengths are on the steppers, in the same colours)
    const below = (d, k) => { const p = g.at(d); return { x: p.x - Math.sin(ang) * k, y: p.y + Math.cos(ang) * k }; };
    if (u === 0 || u === 1) {
      const a0 = below(-6, TH + 30), a1 = below(-this.la * PXM, TH + 30);
      const b0 = below(6, TH + 30), b1 = below(this.ea * PXM, TH + 30);
      displacementArrow(ctx, c, a0.x, a0.y, a1.x, a1.y, { tone: 8, width: 4, head: 12 });
      displacementArrow(ctx, c, b0.x, b0.y, b1.x, b1.y, { tone: 1, width: 4, head: 12 });
    }
    // the load (a crate) and the effort (a stack of slotted iron weights), on the plank
    const sz = (n) => 46 + Math.sqrt(n) * 1.3;
    const lw = sz(r.load), ew = sz(r.effort);
    const lp = g.at(-this.la * PXM), ep = g.at(this.ea * PXM);
    ctx.save(); ctx.translate(lp.x, lp.y); ctx.rotate(ang);
    drawCrate(ctx, c, { x: 0, y: 0, w: lw, h: lw * 0.82, held: true });
    ctx.restore();
    ctx.save(); ctx.translate(ep.x, ep.y); ctx.rotate(ang);
    this.ironStack(ctx, c, ew);
    ctx.restore();
    // their weights, on tags above (the tag stays upright)
    fitPill(ctx, c, `load ${r.load} N`, lp.x + lw / 2 + Math.sin(ang) * (lw + 22), lp.y - Math.cos(ang) * (lw * 0.82 + 22), { bg: c.s8, size: this.fs, align: 'right' });
    fitPill(ctx, c, `effort ${r.effort} N`, ep.x - ew / 2 + Math.sin(ang) * (ew + 22), ep.y - Math.cos(ang) * (ew * 0.8 + 30), { bg: c.s1, size: this.fs, align: 'left' });
  }

  scenery(ctx, c) {
    // a workshop wall with a dado line, and a wooden floor
    const wall = mix(c.bgSurface, c.setSkyLow, 0.35);
    const sky = ctx.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0, lighten(wall, 0.06)); sky.addColorStop(1, darken(wall, 0.04));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, DW, GY);
    ctx.fillStyle = alpha(darken(wall, 0.1), 0.6); ctx.fillRect(0, GY - 70, DW, 70);
    ctx.fillStyle = alpha(lighten(wall, 0.3), 0.7); ctx.fillRect(0, GY - 72, DW, 3);
    const floor = mix(c.gold, c.bgSurface, 0.55);
    ctx.fillStyle = floor; ctx.fillRect(0, GY, DW, DH - GY);
    ctx.fillStyle = lighten(floor, 0.2); ctx.fillRect(0, GY, DW, 3);
    ctx.strokeStyle = darken(floor, 0.2); ctx.lineWidth = 1.5;
    for (let x = 0; x < DW; x += 96) { ctx.beginPath(); ctx.moveTo(x + 20, GY + 3); ctx.lineTo(x + 20, DH); ctx.stroke(); }
  }

  // Two wooden props hold the plank level until Let go; then they are pulled out sideways.
  props(ctx, c, u) {
    const out = clamp01(u * 3);
    if (out >= 1) return;
    const wood = mix(c.s8, c.bgSurface, 0.3);
    for (const side of [-1, 1]) {
      const x = FX + side * (HALF - 40) + side * out * 60;
      const top = FY + 1, h = GY - top;
      ctx.save();
      ctx.globalAlpha = 1 - out;
      drawShadow(ctx, c, x, GY + 1, 18, 4, 0.6);
      ctx.fillStyle = darken(wood, 0.3); rr(ctx, x - 13, top + 4, 26, h - 4, 3); ctx.fill();
      ctx.fillStyle = wood; rr(ctx, x - 13, top, 22, h - 2, 3); ctx.fill();
      ctx.fillStyle = lighten(wood, 0.3); ctx.fillRect(x - 11, top + 2, 4, h - 6);
      ctx.restore();
    }
  }

  // A stack of three slotted iron discs on a hanger rod; bottom centre at (0, 0).
  ironStack(ctx, c, w) {
    const iron = mix(c.bgSurface, c.label, 0.42), h = w * 0.8, disc = h / 3.4;
    drawShadow(ctx, c, 0, 0, w * 0.45, 3, 0.5);
    ctx.fillStyle = darken(iron, 0.3); ctx.fillRect(-3, -h - 12, 6, h + 10);
    ctx.fillStyle = lighten(iron, 0.2); ctx.fillRect(-3, -h - 12, 2, h + 10);
    ctx.fillStyle = darken(iron, 0.2); rr(ctx, -7, -h - 16, 14, 6, 3); ctx.fill();
    for (let i = 0; i < 3; i++) {
      const y = -(i + 1) * disc - i * 2;
      ctx.fillStyle = darken(iron, 0.38); rr(ctx, -w / 2, y + 3, w, disc, disc * 0.4); ctx.fill();
      ctx.fillStyle = iron; rr(ctx, -w / 2, y, w, disc - 1, disc * 0.4); ctx.fill();
      ctx.fillStyle = alpha(lighten(iron, 0.4), 0.8); rr(ctx, -w / 2 + 6, y + 2, w * 0.3, 3, 1.5); ctx.fill();
      ctx.fillStyle = darken(iron, 0.25); ctx.fillRect(w / 2 - w * 0.3, y + 1, w * 0.3 - 2, disc - 3);
      ctx.fillStyle = darken(iron, 0.5); ctx.fillRect(-2, y, 4, disc * 0.55);   // the slot
    }
  }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.go')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }
}
