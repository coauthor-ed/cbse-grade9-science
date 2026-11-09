// EnergyLedgerGameScene - blk-l02-s11, mini-game@1. A cart rests on a smooth floor. Each round
// gives a target energy. The learner picks the push force F (10-50 N) and the distance s
// (1-5 m) and taps Push: the cart speeds up across the floor under the solid F arrow, the
// dashed s arrow runs along the metre scale, and the K bar riding on the cart fills to the
// work done, F x s, beside the target line. Exact = round won; a miss says the computed work
// and offers Try again. Every target is some F x some s from the choices, so every round
// can be won. A worker behind the cart pushes it, hands on the handle, and walks with it
// (kit SimFigure on a small canvas in a foreignObject inside the cart group).
// Control names: .fminus, .fplus, .sminus, .splus, .push, .again, .next.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';

const F_STEP = 10, F_MAX = 50, S_MAX = 5;
const ROUNDS = [
  { target: 60 },    // 20 N x 3 m, 30 N x 2 m
  { target: 150 },   // 30 x 5, 50 x 3
  { target: 80 },    // 20 x 4, 40 x 2
  { target: 200 },   // 40 x 5, 50 x 4
  { target: 90 },    // 30 x 3
];
const K_MAX = F_MAX * S_MAX;                       // 250 J, the bar's top

// SVG geometry (viewBox 680 x 330)
const VB_W = 680, VB_H = 330;
const FY = 226;                                    // floor top
const X0 = 172, PXM = 70;                          // the cart's back at 0 m, px per metre
const CART_W = 150;
const BAR_X = 88, BAR_W = 48, BAR_BOT = FY - 66, BAR_TOP = 46;   // inside the cart group
const GRIP_X = -14, GRIP_Y = FY - 84;              // the handle grip, in the cart's frame (1.2 m up)
const FO = { x: -128, y: 80, w: 128, h: 152 };     // the worker's canvas, in the cart's frame
const FA_Y = GRIP_Y, DPR = 3;                      // the F arrow's height
const barY = (k) => BAR_BOT - (k / K_MAX) * (BAR_BOT - BAR_TOP);

const CSS = `
.gm.el { background: var(--sim-bg-deep); border-radius: 14px; }
.el .play { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; align-items: stretch; }
.el .stage { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 4px; overflow: hidden; }
.el svg { overflow: visible; display: block; width: 100%; height: 278px; }
.el .side { display: flex; flex-direction: column; gap: 8px; }
.el .dots { display: flex; gap: 6px; align-items: center; }
.el .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--sim-track); }
.el .dot[data-on="1"] { background: var(--sim-good); }
.el .given { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.el .chip { font: 800 17px/1 var(--sim-font); padding: 9px 12px; border-radius: var(--look-pill, 999px);
            background: var(--sim-bg-surface); border: var(--sim-border); border-color: var(--sim-gold); }
.el .step { display: flex; align-items: center; gap: 8px; }
.el .step .btn { width: 52px; font-size: 24px; line-height: 1; padding: 0; }
.el .val { flex: 1; text-align: center; font: 800 21px/1 var(--sim-font-display); }
.el .go { background: var(--sim-accent); color: var(--sim-bg-deep); border: 0; font-size: 17px; font-weight: 800;
          box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.el .say { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
.el .say:empty { display: none; }
.el .say[data-k="good"] { color: var(--sim-good); }
.el .acts { display: none; gap: 8px; }
.el .acts .btn { flex: 1; }
.el[data-done="1"] .acts { display: flex; }
.el[data-done="1"] .go { display: none; }
.el .again, .el .next { display: none; }
.el .again[data-on="1"], .el .next[data-on="1"] { display: inline-block; }
.el .next { background: var(--sim-good); color: var(--sim-bg-deep); border: 0; }
.el .btn[disabled] { opacity: 0.45; cursor: default; }
.el[data-done="1"] .fpill { display: none; }
.el .cart, .el .farrow { transition: transform 0.7s cubic-bezier(.55,0,.85,.55); }
.el .fill { transition: transform 0.7s cubic-bezier(.55,0,.85,.55); transform-box: fill-box; transform-origin: 50% 100%; }
.el[data-done="0"] .cart, .el[data-done="0"] .farrow, .el[data-done="0"] .fill { transition-duration: 0.4s; transition-timing-function: ease-out; }
@media (prefers-reduced-motion: reduce) { .el .cart, .el .fill, .el .farrow { transition: none; } }
.sim-dom-root--portrait .el .play { grid-template-columns: minmax(0, 1fr); gap: 10px; }
.sim-dom-root--portrait .el svg { height: auto; aspect-ratio: ${VB_W} / ${VB_H}; }
`;

const BODY = 'var(--sim-series-4)';
const BODY_DK = 'color-mix(in oklab, var(--sim-series-4) 65%, var(--sim-label))';
const BODY_LT = 'color-mix(in oklab, var(--sim-series-4) 55%, var(--sim-bg-surface))';
const STEEL = 'color-mix(in oklab, var(--sim-label) 55%, var(--sim-bg-surface))';

// A wheel with spokes (no hub dots, so no pair of eyes under the cart).
function wheel(cx, cy) {
  const sp = [0, 60, 120].map((a) => {
    const r = (a * Math.PI) / 180, dx = Math.cos(r) * 10, dy = Math.sin(r) * 10;
    return `<line x1="${(cx - dx).toFixed(1)}" y1="${(cy - dy).toFixed(1)}" x2="${(cx + dx).toFixed(1)}" y2="${(cy + dy).toFixed(1)}" stroke="var(--sim-label)" stroke-width="2.5"/>`;
  }).join('');
  return `<circle cx="${cx}" cy="${cy}" r="17" fill="var(--sim-label)"/>
    <circle cx="${cx}" cy="${cy}" r="11" fill="${STEEL}"/>${sp}`;
}

// The cart in its own frame: x = 0 is its back, the floor is FY. The K bar rides on the deck.
function cartSvg() {
  const top = FY - 66, bot = FY - 26;
  return `<g class="cart" style="transform: translateX(0px)">
    <ellipse cx="${CART_W / 2}" cy="${FY + 3}" rx="${CART_W / 2 + 4}" ry="5" fill="color-mix(in oklab, var(--sim-label) 18%, transparent)"/>
    <path d="M${GRIP_X - 6} ${GRIP_Y} H${GRIP_X + 8} L20 ${top}" stroke="${STEEL}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <foreignObject x="${FO.x}" y="${FO.y}" width="${FO.w}" height="${FO.h}" pointer-events="none"><canvas xmlns="http://www.w3.org/1999/xhtml" class="fig" width="${FO.w * DPR}" height="${FO.h * DPR}" style="display:block;width:100%;height:100%" aria-hidden="true"></canvas></foreignObject>
    <path d="M4 ${top} H${CART_W - 4} L${CART_W - 12} ${bot} H12 Z" fill="${BODY}" stroke="${BODY_DK}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M6 ${top} H${CART_W - 6} V${top + 7} H8 Z" fill="${BODY_LT}"/>
    <path d="M${CART_W * 0.68} ${top + 7} H${CART_W - 6} L${CART_W - 12} ${bot} H${CART_W * 0.68} Z" fill="${BODY_DK}" opacity="0.5"/>
    <line x1="14" y1="${top + 22}" x2="${CART_W - 16}" y2="${top + 22}" stroke="${BODY_DK}" stroke-width="2"/>
    ${wheel(30, FY - 17)}${wheel(CART_W - 30, FY - 17)}
    <rect x="${BAR_X - 5}" y="${BAR_TOP - 5}" width="${BAR_W + 10}" height="${BAR_BOT - BAR_TOP + 5}" rx="8" fill="var(--sim-bg-deep)" stroke="var(--sim-stroke)" stroke-width="2.5"/>
    <g class="fill" style="transform: scaleY(0)">
      <rect x="${BAR_X}" y="${BAR_TOP}" width="${BAR_W}" height="${BAR_BOT - BAR_TOP}" rx="5" fill="var(--sim-series-1)"/>
      <rect x="${BAR_X + 3}" y="${BAR_TOP}" width="6" height="${BAR_BOT - BAR_TOP}" rx="3" fill="color-mix(in oklab, var(--sim-series-1) 55%, var(--sim-bg-surface))"/>
      <rect x="${BAR_X + BAR_W - 12}" y="${BAR_TOP}" width="12" height="${BAR_BOT - BAR_TOP}" rx="4" fill="color-mix(in oklab, var(--sim-series-1) 70%, var(--sim-label))"/>
    </g>
    <rect class="miss" x="${BAR_X - 3}" y="0" width="${BAR_W + 6}" height="0" fill="url(#el-hatch)"/>
    <line class="target" x1="${BAR_X - 12}" x2="${BAR_X + BAR_W + 12}" y1="0" y2="0" stroke="var(--sim-gold)" stroke-width="4" stroke-dasharray="9 5"/>
    <text x="${BAR_X + BAR_W / 2}" y="${bot - 9}" text-anchor="middle" font-size="30" font-weight="800" fill="var(--sim-bg-surface)">K</text>
    <text class="kval" x="${BAR_X + BAR_W / 2}" y="${BAR_TOP - 14}" text-anchor="middle" font-size="30" font-weight="800" fill="var(--sim-label)"></text>
  </g>`;
}

function boardSvg() {
  const ticks = [];
  for (let m = 0; m <= S_MAX; m += 1) {
    const x = X0 + m * PXM;
    ticks.push(`<line x1="${x}" y1="${FY + 14}" x2="${x}" y2="${FY + 30}" stroke="var(--sim-label-muted)" stroke-width="2.5"/>`
      + `<text x="${x}" y="${FY + 58}" text-anchor="middle" font-size="30" font-weight="700" fill="var(--sim-label-muted)">${m}</text>`);
    if (m < S_MAX) ticks.push(`<line x1="${x + PXM / 2}" y1="${FY + 14}" x2="${x + PXM / 2}" y2="${FY + 23}" stroke="var(--sim-label-muted)" stroke-width="1.5"/>`);
  }
  // polished tiles: a sheen line and tile joints, so the floor reads smooth
  const joints = [];
  for (let x = -364; x < VB_W + 400; x += 96) joints.push(`<line x1="${x}" y1="${FY}" x2="${x - 14}" y2="${FY + 14}" stroke="color-mix(in oklab, var(--sim-label) 14%, transparent)" stroke-width="2"/>`);
  return `<svg viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="A cart on a smooth floor with a metre scale, a push force arrow, a displacement arrow, and a kinetic energy bar on the cart with a target line">
  <defs>
    <pattern id="el-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="color-mix(in oklab, var(--sim-bad) 22%, transparent)"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="var(--sim-bad)" stroke-width="3"/>
    </pattern>
  </defs>
  <rect x="-400" y="0" width="${VB_W + 800}" height="${FY}" fill="color-mix(in oklab, var(--sim-series-5) 7%, var(--sim-bg-surface))"/>
  <rect x="-400" y="${FY}" width="${VB_W + 800}" height="14" fill="color-mix(in oklab, var(--sim-series-5) 30%, var(--sim-bg-surface))"/>
  <rect x="-400" y="${FY}" width="${VB_W + 800}" height="3" fill="color-mix(in oklab, var(--sim-series-5) 12%, var(--sim-bg-surface))"/>
  ${joints.join('')}
  <rect x="-400" y="${FY + 14}" width="${VB_W + 800}" height="${VB_H - FY - 14}" fill="color-mix(in oklab, var(--sim-series-5) 14%, var(--sim-bg-surface))"/>
  ${ticks.join('')}
  <text x="${X0 + S_MAX * PXM + 30}" y="${FY + 58}" font-size="30" font-weight="800" fill="var(--sim-label-muted)">m</text>
  <!-- where the cart's back will stop -->
  <line class="ghost" x1="0" x2="0" y1="${FY - 56}" y2="${FY + 14}" stroke="var(--sim-accent)" stroke-width="2.5" stroke-dasharray="7 6"/>
  <g transform="translate(${X0} 0)">${cartSvg()}</g>
  <!-- F: solid, from the handle forward along the deck, pushing the cart -->
  <g class="farrow" style="transform: translateX(0px)">
    <line x1="${X0 + 4}" y1="${FA_Y}" x2="${X0 + 44}" y2="${FA_Y}" stroke="var(--sim-series-2)" stroke-width="7" stroke-linecap="round"/>
    <path d="M${X0 + 66} ${FA_Y} l-22 -13 v26 z" fill="var(--sim-series-2)"/>
    <g class="fpill"><rect x="${X0 - 60}" y="${FA_Y - 75}" width="0" height="38" rx="19" fill="var(--sim-bg-surface)" stroke="var(--sim-stroke)" stroke-width="2"/>
      <text x="${X0 - 47}" y="${FA_Y - 45}" font-size="32" font-weight="800" fill="var(--sim-label)"></text></g>
  </g>
  <!-- s: dashed, along the scale, from 0 to where the cart's back will stop -->
  <line class="sline" x1="${X0}" x2="${X0}" y1="${FY + 82}" y2="${FY + 82}" stroke="var(--sim-label)" stroke-width="4" stroke-dasharray="10 7"/>
  <path class="shead" d="" fill="var(--sim-label)"/>
  <g class="spill"><rect x="0" y="${FY + 63}" width="0" height="38" rx="19" fill="var(--sim-bg-surface)" stroke="var(--sim-stroke)" stroke-width="2"/>
    <text x="0" y="${FY + 92}" font-size="30" font-weight="800" fill="var(--sim-label)"></text></g>
</svg>`;
}

export class EnergyLedgerGameScene extends GameBoard {
  static ARIA_LABEL = 'A five-round game: a cart rests on a smooth floor. Each round gives a target energy. Pick the push force and the distance and push: the kinetic energy bar on the cart fills to the work done, F times s, beside the target line.';
  static OBJECTIVE = { prompt: { en: 'Push the cart so that it gains exactly the target energy. Work done = change in energy.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.force = F_STEP;
    this.dist = 1;
    this.pushed = false;
    this.roundWon = false;
    this.allWon = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      html: `<div class="gm el" data-done="0">
        <div class="gm-head"><p class="kicker">Work and energy</p><h2>Give the cart exactly the <b>target</b> energy</h2>
          <p class="sub">Smooth floor: the work done, F x s, all becomes the cart's kinetic energy K.</p></div>
        <div class="play">
          <div class="stage">${boardSvg()}</div>
          <div class="side">
            <div class="given"><span class="chip"></span><span class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}</span></div>
            <div class="step">
              <button type="button" class="tap btn fminus" aria-label="Push 10 newtons less">&minus;</button>
              <span class="val fval" aria-live="polite"></span>
              <button type="button" class="tap btn fplus" aria-label="Push 10 newtons more">+</button>
            </div>
            <div class="step">
              <button type="button" class="tap btn sminus" aria-label="One metre shorter">&minus;</button>
              <span class="val sval" aria-live="polite"></span>
              <button type="button" class="tap btn splus" aria-label="One metre longer">+</button>
            </div>
            <button type="button" class="tap btn go push">Push</button>
            <div class="acts"><button type="button" class="tap btn again">Try again</button><button type="button" class="tap btn next">Next round</button></div>
            <p class="say" aria-live="polite"></p>
          </div>
        </div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.push')) return;
    onTap(q('.fminus'), () => this.nudge('force', -F_STEP, F_STEP, F_MAX));
    onTap(q('.fplus'), () => this.nudge('force', F_STEP, F_STEP, F_MAX));
    onTap(q('.sminus'), () => this.nudge('dist', -1, 1, S_MAX));
    onTap(q('.splus'), () => this.nudge('dist', 1, 1, S_MAX));
    onTap(q('.push'), () => this.push());
    onTap(q('.again'), () => this.back());
    onTap(q('.next'), () => this.nextRound());
    this.deal();
    this.quill?.speak('Pick a force and a distance, then push.', 5000);
  }

  get round() { return ROUNDS[this.roundNo]; }

  deal() {
    const q = (s) => this.root.querySelector(s);
    this.force = F_STEP;
    this.dist = 1;
    this.roundWon = false;
    q('.chip').textContent = `target K = ${this.round.target} J`;
    q('.target').setAttribute('transform', `translate(0 ${barY(this.round.target)})`);
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    this.back();
  }

  nudge(key, d, min, max) {
    if (this.pushed) return;
    this[key] = Math.min(max, Math.max(min, this[key] + d));
    this.paint();
  }

  push() {
    if (this.pushed) return;
    this.pushed = true;
    const w = this.force * this.dist, t = this.round.target;
    const say = this.root.querySelector('.say');
    this.root.querySelector('.el').dataset.done = '1';
    if (w === t) {
      this.roundWon = true;
      say.dataset.k = 'good';
      say.textContent = `W = ${this.force} N x ${this.dist} m = ${w} J, so K = ${w} J. Exactly the target.`;
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
      say.textContent = `W = ${this.force} N x ${this.dist} m = ${w} J, so K = ${w} J: ${Math.abs(w - t)} J too ${w > t ? 'much' : 'little'}.`;
      this.root.querySelector('.again').dataset.on = '1';
    }
    this.paint();
  }

  back() {
    const q = (s) => this.root.querySelector(s);
    this.pushed = false;
    q('.el').dataset.done = '0';
    q('.again').dataset.on = '0';
    q('.next').dataset.on = '0';
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
    const w = this.pushed ? this.force * this.dist : 0;
    const dx = this.pushed ? this.dist * PXM : 0;
    q('.fval').textContent = `F = ${this.force} N`;
    q('.sval').textContent = `s = ${this.dist} m`;
    q('.cart').style.transform = `translateX(${dx}px)`;
    q('.farrow').style.transform = `translateX(${dx}px)`;
    q('.farrow').style.opacity = this.pushed ? '0.45' : '1';
    const stopX = X0 + this.dist * PXM;
    q('.ghost').setAttribute('x1', String(stopX)); q('.ghost').setAttribute('x2', String(stopX));
    q('.ghost').style.opacity = this.pushed ? '0' : '1';
    q('.sline').setAttribute('x2', String(stopX - 16));
    q('.shead').setAttribute('d', `M${stopX} ${FY + 82} l-20 -11 v22 z`);
    const fText = `F = ${this.force} N`, sText = `s = ${this.dist} m`;
    const pw = (t, el) => { const m = el?.getComputedTextLength?.() || 0; return Math.round((m > 0 ? m : t.length * 16.6) + 26); };
    q('.fpill text').textContent = fText;
    const fw = pw(fText, q('.fpill text'));
    q('.fpill rect').setAttribute('width', String(fw));
    q('.fpill rect').setAttribute('x', String(X0 + 78 - fw));
    q('.fpill text').setAttribute('x', String(X0 + 91 - fw));
    q('.spill text').textContent = sText;
    q('.spill text').setAttribute('x', String(X0 - 14 - pw(sText) + 13));
    q('.spill rect').setAttribute('x', String(X0 - 14 - pw(sText)));
    q('.spill rect').setAttribute('width', String(pw(sText)));
    q('.fill').style.transform = `scaleY(${w / K_MAX})`;
    const kv = q('.kval');
    kv.textContent = this.pushed ? `${w} J` : '';
    const miss = q('.miss');
    if (this.pushed && w !== this.round.target) {
      const a = barY(w), b = barY(this.round.target);
      miss.setAttribute('y', String(Math.min(a, b)));
      miss.setAttribute('height', String(Math.abs(a - b)));
    } else miss.setAttribute('height', '0');
    q('.fminus').disabled = this.pushed || this.force <= F_STEP;
    q('.fplus').disabled = this.pushed || this.force >= F_MAX;
    q('.sminus').disabled = this.pushed || this.dist <= 1;
    q('.splus').disabled = this.pushed || this.dist >= S_MAX;
    q('.push').disabled = this.pushed;
    this.drawWorker();
  }

  // The worker behind the cart: leaning in, both hands on the grip; the canvas rides in the cart group.
  drawWorker() {
    const cv = this.root.querySelector('canvas.fig');
    if (!cv) return;
    this.colors = this.colors || loadColors(this.root);
    const ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, -FO.x * DPR, -FO.y * DPR);
    ctx.clearRect(FO.x, FO.y, FO.w, FO.h);
    const spec = figureFor(this, {
      role: 'adult', x: GRIP_X - 50, y: FY, height: 1.7 * PXM, facing: 1, i: 3,
      pose: { name: 'push', lean: 22, crouch: 0.12 },
      hands: [{ x: GRIP_X + 3, y: GRIP_Y + 1 }, { x: GRIP_X - 3, y: GRIP_Y - 1 }], look: { mood: 'effort' },
    });
    drawFigure(ctx, this.colors, spec, spec.look);
  }

  refreshTheme() { if (this.root?.querySelector('canvas.fig')) { this.colors = loadColors(this.root); this.drawWorker(); } }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.push')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }
}
