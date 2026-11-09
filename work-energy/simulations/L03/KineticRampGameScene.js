// KineticRampGameScene - blk-l03-s10, mini-game@1. A trolley of a stated mass rests on a
// smooth track. Each round gives the mass and a target kinetic energy. The learner picks the
// speed v (1-8 m/s) and taps Push: the trolley rolls across the track at that speed (a
// faster trolley crosses sooner), the v arrow ahead of it grows with v, and the K bar on
// the trolley fills to 1/2 m v^2 beside the target line. Exact = round won; a miss says the
// computed K and offers Try again. Every target is 1/2 m v^2 for a whole v from 1 to 8, so
// every round can be won. A worker at the start pushes the trolley by its handle and lets go;
// it rolls on alone (kit SimFigure on a small canvas in a foreignObject).
// Control names: .vminus, .vplus, .push, .again, .next.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';

const V_MAX = 8;
const ROUNDS = [
  { m: 2, target: 36 },    // 6 m/s
  { m: 4, target: 50 },    // 5 m/s
  { m: 10, target: 45 },   // 3 m/s
  { m: 6, target: 147 },   // 7 m/s
  { m: 8, target: 64 },    // 4 m/s
];
const kOf = (m, v) => (m * v * v) / 2;

// SVG geometry (viewBox 680 x 330)
const VB_W = 680, VB_H = 330;
const FY = 246;                                    // track top
const X_START = 124, X_END = 380;                   // the trolley's back, before and after the roll
const CART_W = 160;
const BAR_X = 54, BAR_W = 50, BAR_BOT = FY - 72, BAR_TOP = 50;   // inside the trolley group
const ARROW_Y = FY - 46, PX_PER_V = 13;
const GRIP = { x: X_START - 10, y: FY - 106 };    // the handle grip at rest, in board units
const FO = { x: 0, y: 56, w: 132, h: 210 }, DPR = 3; // the worker's canvas, in board units

const CSS = `
.gm.kr { background: var(--sim-bg-deep); border-radius: 14px; }
.kr .play { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; align-items: stretch; }
.kr .stage { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 4px; overflow: hidden; }
.kr svg { overflow: visible; display: block; width: 100%; height: 278px; }
.kr .side { display: flex; flex-direction: column; gap: 8px; }
.kr .dots { display: flex; gap: 6px; align-items: center; }
.kr .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--sim-track); }
.kr .dot[data-on="1"] { background: var(--sim-good); }
.kr .given { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.kr .chip { font: 800 17px/1 var(--sim-font); padding: 9px 12px; border-radius: var(--look-pill, 999px);
            background: var(--sim-bg-surface); border: var(--sim-border); }
.kr .chip.t { border-color: var(--sim-gold); }
.kr .step { display: flex; align-items: center; gap: 8px; }
.kr .step .btn { width: 52px; font-size: 24px; line-height: 1; padding: 0; }
.kr .val { flex: 1; text-align: center; font: 800 21px/1 var(--sim-font-display); }
.kr .go { background: var(--sim-accent); color: var(--sim-bg-deep); border: 0; font-size: 17px; font-weight: 800;
          box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.kr .sub sup { font-size: 14px; vertical-align: 5px; line-height: 0; }
.kr .say { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
.kr .say:empty { display: none; }
.kr .say[data-k="good"] { color: var(--sim-good); }
.kr .acts { display: none; gap: 8px; }
.kr .acts .btn { flex: 1; }
.kr[data-done="1"] .acts { display: flex; }
.kr[data-done="1"] .go { display: none; }
.kr .again, .kr .next { display: none; }
.kr .again[data-on="1"], .kr .next[data-on="1"] { display: inline-block; }
.kr .next { background: var(--sim-good); color: var(--sim-bg-deep); border: 0; }
.kr .btn[disabled] { opacity: 0.45; cursor: default; }
.kr .cart { transition-property: transform; transition-timing-function: linear; }
.kr .fill { transition: transform 0.5s cubic-bezier(.3,1.25,.5,1); transform-box: fill-box; transform-origin: 50% 100%; }
.kr .varrow line, .kr .varrow path { transition: transform 0.3s ease-out, x2 0.3s ease-out; }
@media (prefers-reduced-motion: reduce) { .kr .cart, .kr .fill { transition: none !important; } }
.sim-dom-root--portrait .kr .play { grid-template-columns: minmax(0, 1fr); gap: 10px; }
.sim-dom-root--portrait .kr svg { height: auto; aspect-ratio: ${VB_W} / ${VB_H}; }
`;

const BODY = 'var(--sim-series-6)';
const BODY_DK = 'color-mix(in oklab, var(--sim-series-6) 62%, var(--sim-label))';
const BODY_LT = 'color-mix(in oklab, var(--sim-series-6) 55%, var(--sim-bg-surface))';
const STEEL = 'color-mix(in oklab, var(--sim-label) 55%, var(--sim-bg-surface))';

// A wheel with spokes (no hub dots, so no pair of eyes under the trolley).
function wheel(cx, cy) {
  const sp = [0, 60, 120].map((a) => {
    const r = (a * Math.PI) / 180, dx = Math.cos(r) * 11, dy = Math.sin(r) * 11;
    return `<line x1="${(cx - dx).toFixed(1)}" y1="${(cy - dy).toFixed(1)}" x2="${(cx + dx).toFixed(1)}" y2="${(cy + dy).toFixed(1)}" stroke="var(--sim-label)" stroke-width="2.5"/>`;
  }).join('');
  return `<circle cx="${cx}" cy="${cy}" r="18" fill="var(--sim-label)"/>
    <circle cx="${cx}" cy="${cy}" r="12" fill="${STEEL}"/>${sp}`;
}

// The trolley in its own frame: x = 0 is its back, the track is FY. The K bar rides on the deck,
// the v arrow points ahead of its nose.
function trolleySvg() {
  const top = FY - 72, bot = FY - 28;
  return `<g class="cart" style="transform: translateX(${X_START}px)">
    <ellipse cx="${CART_W / 2}" cy="${FY + 2}" rx="${CART_W / 2 + 4}" ry="5" fill="color-mix(in oklab, var(--sim-label) 18%, transparent)"/>
    <path d="M6 ${top} L-4 ${top - 34} H-16" stroke="${STEEL}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 ${top} H${CART_W - 2} V${bot} H2 Z" fill="${BODY}" stroke="${BODY_DK}" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="4" y="${top + 2}" width="${CART_W - 8}" height="7" fill="${BODY_LT}"/>
    <rect x="${CART_W * 0.7}" y="${top + 9}" width="${CART_W * 0.3 - 4}" height="${bot - top - 11}" fill="${BODY_DK}" opacity="0.5"/>
    <text class="mtxt" x="${CART_W / 2}" y="${bot - 10}" text-anchor="middle" font-size="30" font-weight="800" fill="var(--sim-bg-surface)"></text>
    ${wheel(32, FY - 18)}${wheel(CART_W - 32, FY - 18)}
    <rect x="${BAR_X - 5}" y="${BAR_TOP - 5}" width="${BAR_W + 10}" height="${BAR_BOT - BAR_TOP + 5}" rx="8" fill="var(--sim-bg-deep)" stroke="var(--sim-stroke)" stroke-width="2.5"/>
    <g class="fill" style="transform: scaleY(0)">
      <rect x="${BAR_X}" y="${BAR_TOP}" width="${BAR_W}" height="${BAR_BOT - BAR_TOP}" rx="5" fill="var(--sim-series-1)"/>
      <rect x="${BAR_X + 3}" y="${BAR_TOP}" width="7" height="${BAR_BOT - BAR_TOP}" rx="3" fill="color-mix(in oklab, var(--sim-series-1) 55%, var(--sim-bg-surface))"/>
      <rect x="${BAR_X + BAR_W - 13}" y="${BAR_TOP}" width="13" height="${BAR_BOT - BAR_TOP}" rx="4" fill="color-mix(in oklab, var(--sim-series-1) 70%, var(--sim-label))"/>
    </g>
    <rect class="miss" x="${BAR_X - 3}" y="0" width="${BAR_W + 6}" height="0" fill="url(#kr-hatch)"/>
    <line class="target" x1="${BAR_X - 12}" x2="${BAR_X + BAR_W + 12}" y1="0" y2="0" stroke="var(--sim-gold)" stroke-width="4" stroke-dasharray="9 5"/>
    <text x="${BAR_X + BAR_W + 12}" y="${BAR_BOT - 4}" font-size="30" font-weight="800" fill="var(--sim-label)">K</text>
    <text class="kval" x="${BAR_X + BAR_W / 2}" y="${BAR_TOP - 14}" text-anchor="middle" font-size="30" font-weight="800" fill="var(--sim-label)"></text>
    <g class="varrow">
      <line x1="${CART_W + 22}" y1="${ARROW_Y}" x2="${CART_W + 40}" y2="${ARROW_Y}" stroke="var(--sim-accent)" stroke-width="7" stroke-linecap="round"/>
      <path class="vhead" d="" fill="var(--sim-accent)"/>
      <text class="vtag" x="${CART_W + 24}" y="${ARROW_Y - 18}" font-size="30" font-weight="800" font-style="italic" fill="var(--sim-accent)">v</text>
    </g>
  </g>`;
}

function boardSvg() {
  // rails with sleepers under them: the track reads as a track, not a floor
  const sleepers = [];
  for (let x = -390; x < VB_W + 400; x += 40) sleepers.push(`<rect x="${x}" y="${FY + 6}" width="22" height="10" rx="2" fill="color-mix(in oklab, var(--sim-series-8) 45%, var(--sim-bg-surface))"/>`);
  return `<svg viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="A trolley on a smooth track with a speed arrow ahead of it and a kinetic energy bar on it with a target line">
  <defs>
    <pattern id="kr-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="color-mix(in oklab, var(--sim-bad) 22%, transparent)"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="var(--sim-bad)" stroke-width="3"/>
    </pattern>
  </defs>
  <rect x="-400" y="0" width="${VB_W + 800}" height="${FY}" fill="color-mix(in oklab, var(--sim-series-3) 6%, var(--sim-bg-surface))"/>
  <rect x="-400" y="${FY + 6}" width="${VB_W + 800}" height="${VB_H - FY - 6}" fill="color-mix(in oklab, var(--sim-series-3) 22%, var(--sim-bg-surface))"/>
  <rect x="-400" y="${FY + 16}" width="${VB_W + 800}" height="4" fill="color-mix(in oklab, var(--sim-series-3) 34%, var(--sim-bg-surface))"/>
  ${sleepers.join('')}
  <rect x="-400" y="${FY}" width="${VB_W + 800}" height="7" fill="${STEEL}"/>
  <rect x="-400" y="${FY}" width="${VB_W + 800}" height="2" fill="color-mix(in oklab, var(--sim-label) 20%, var(--sim-bg-surface))"/>
  ${trolleySvg()}
  <foreignObject x="${FO.x}" y="${FO.y}" width="${FO.w}" height="${FO.h}" pointer-events="none"><canvas xmlns="http://www.w3.org/1999/xhtml" class="fig" width="${FO.w * DPR}" height="${FO.h * DPR}" style="display:block;width:100%;height:100%" aria-hidden="true"></canvas></foreignObject>
</svg>`;
}

export class KineticRampGameScene extends GameBoard {
  static ARIA_LABEL = 'A five-round game: a trolley of a given mass on a smooth track. Each round gives the mass and a target kinetic energy. Pick the speed and push: the trolley rolls at that speed and the kinetic energy bar on it fills to one half m v squared beside the target line.';
  static OBJECTIVE = { prompt: { en: 'Push the trolley to reach exactly the target kinetic energy. Use K = 1/2 mv^2.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.speed = 1;
    this.pushed = false;
    this.roundWon = false;
    this.allWon = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      html: `<div class="gm kr" data-done="0">
        <div class="gm-head"><p class="kicker">Kinetic energy</p><h2>Give the trolley exactly the <b>target</b> K</h2>
          <p class="sub">K = 1/2 m v<sup>2</sup>. Pick the speed, then push.</p></div>
        <div class="play">
          <div class="stage">${boardSvg()}</div>
          <div class="side">
            <div class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}</div>
            <div class="given"><span class="chip m"></span><span class="chip t"></span></div>
            <div class="step">
              <button type="button" class="tap btn vminus" aria-label="One metre per second slower">&minus;</button>
              <span class="val vval" aria-live="polite"></span>
              <button type="button" class="tap btn vplus" aria-label="One metre per second faster">+</button>
            </div>
            <button type="button" class="tap btn go push">Push</button>
            <div class="acts"><button type="button" class="tap btn again">Try again</button><button type="button" class="tap btn next">Next trolley</button></div>
            <p class="say" aria-live="polite"></p>
          </div>
        </div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.push')) return;
    onTap(q('.vminus'), () => this.nudge(-1));
    onTap(q('.vplus'), () => this.nudge(1));
    onTap(q('.push'), () => this.push());
    onTap(q('.again'), () => this.back());
    onTap(q('.next'), () => this.nextRound());
    this.deal();
    this.quill?.speak('Pick a speed, then push.', 5000);
  }

  get round() { return ROUNDS[this.roundNo]; }
  get kMax() { return kOf(this.round.m, V_MAX); }   // the bar's top: this trolley at 8 m/s
  barY(k) { return BAR_BOT - (k / this.kMax) * (BAR_BOT - BAR_TOP); }

  deal() {
    const q = (s) => this.root.querySelector(s);
    const r = this.round;
    this.speed = 1;
    this.roundWon = false;
    q('.chip.m').textContent = `m = ${r.m} kg`;
    q('.chip.t').textContent = `target K = ${r.target} J`;
    q('.mtxt').textContent = `${r.m} kg`;
    q('.target').setAttribute('transform', `translate(0 ${this.barY(r.target)})`);
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    this.back();
  }

  nudge(d) {
    if (this.pushed) return;
    this.speed = Math.min(V_MAX, Math.max(1, this.speed + d));
    this.paint();
  }

  push() {
    if (this.pushed) return;
    this.pushed = true;
    const r = this.round, k = kOf(r.m, this.speed);
    const say = this.root.querySelector('.say');
    this.root.querySelector('.kr').dataset.done = '1';
    const sum = `K = 1/2 x ${r.m} x ${this.speed} x ${this.speed} = ${k} J`;
    if (k === r.target) {
      this.roundWon = true;
      say.dataset.k = 'good';
      say.textContent = `${sum}. Exactly the target.`;
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
      say.textContent = `${sum}: ${Math.abs(k - r.target)} J too ${k > r.target ? 'much' : 'little'}.`;
      this.root.querySelector('.again').dataset.on = '1';
    }
    this.paint();
  }

  back() {
    const q = (s) => this.root.querySelector(s);
    this.pushed = false;
    q('.kr').dataset.done = '0';
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
    const r = this.round;
    const k = this.pushed ? kOf(r.m, this.speed) : 0;
    q('.vval').textContent = `v = ${this.speed} m/s`;
    // the roll: constant speed, so the time to cross is shorter for a faster trolley
    const cart = q('.cart');
    cart.style.transitionDuration = this.pushed ? `${(0.35 + 1.6 / this.speed).toFixed(2)}s` : '0.4s';
    cart.style.transform = `translateX(${this.pushed ? X_END : X_START}px)`;
    const len = this.speed * PX_PER_V, x0 = CART_W + 14;
    q('.varrow line').setAttribute('x2', String(x0 + len));
    q('.vhead').setAttribute('d', `M${x0 + len + 20} ${ARROW_Y} l-20 -12 v24 z`);
    q('.vtag').setAttribute('x', String(x0 + len / 2));
    q('.fill').style.transform = `scaleY(${k / this.kMax})`;
    q('.kval').textContent = this.pushed ? `${k} J` : '';
    const miss = q('.miss');
    if (this.pushed && k !== r.target) {
      const a = this.barY(k), b = this.barY(r.target);
      miss.setAttribute('y', String(Math.min(a, b)));
      miss.setAttribute('height', String(Math.abs(a - b)));
    } else miss.setAttribute('height', '0');
    q('.vminus').disabled = this.pushed || this.speed <= 1;
    q('.vplus').disabled = this.pushed || this.speed >= V_MAX;
    q('.push').disabled = this.pushed;
    this.drawWorker();
  }

  // The worker at the start: leaning in with both hands on the grip; after the push the hands stay
  // out where the handle was and the trolley rolls on alone.
  drawWorker() {
    const cv = this.root.querySelector('canvas.fig');
    if (!cv) return;
    this.colors = this.colors || loadColors(this.root);
    const ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, -FO.x * DPR, -FO.y * DPR);
    ctx.clearRect(FO.x, FO.y, FO.w, FO.h);
    const out = this.pushed ? 6 : 0;
    const spec = figureFor(this, {
      role: 'adult', x: GRIP.x - 58, y: FY, height: 170, facing: 1, i: 4,
      pose: { name: 'push', lean: this.pushed ? 26 : 20, crouch: 0.12 },
      hands: [{ x: GRIP.x + 3 + out, y: GRIP.y + 1 }, { x: GRIP.x - 3 + out, y: GRIP.y - 1 }], look: { mood: 'effort' },
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
