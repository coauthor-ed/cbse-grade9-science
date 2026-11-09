// StoredEnergyGameScene - blk-l04-s12, mini-game@1. A crane lifts a load; each round gives a
// load mass and a target U. The learner sets the height in 0.5 m steps and taps Lift: the
// U bar fills to mgh (g = 10 m/s^2) beside a target line. Exact = round won; a miss shows
// the bar over or under the line and offers Try again. Every target / (m x 10) is an
// offered height, so every round can be won. Practice numbers.
// Control names: .minus, .plus, .lift, .again, .next.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';

const G = 10;
const H_MAX = 6, H_STEP = 0.5;
const ROUNDS = [
  { m: 2, target: 60 },    // 3 m
  { m: 3, target: 150 },   // 5 m
  { m: 5, target: 200 },   // 4 m
  { m: 4, target: 140 },   // 3.5 m
  { m: 6, target: 330 },   // 5.5 m
];

// SVG geometry (viewBox 560 x 330)
const VB_W = 680, VB_H = 330;
const GY = 300, TOPY = 54;                        // 0 m and 6 m
const PXM = (GY - TOPY) / H_MAX;                  // 41 px per metre
const LOAD_X = 292, LOAD_W = 100, LOAD_H = 60;
const BAR_X = 560, BAR_W = 70;
const yOf = (h) => GY - h * PXM;
const fmtH = (h) => (Number.isInteger(h) ? String(h) : h.toFixed(1));

const CSS = `
.gm.se { background: var(--sim-bg-deep); border-radius: 14px; }
.se .play { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; align-items: stretch; }
.se .stage { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 4px; }
.se svg { display: block; width: 100%; height: 276px; }
.se .side { display: flex; flex-direction: column; gap: 8px; }
.se .dots { display: flex; gap: 6px; align-items: center; }
.se .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--sim-track); }
.se .dot[data-on="1"] { background: var(--sim-good); }
.se .dots .pn { margin-left: 8px; font-size: 14px; font-weight: 700; color: var(--sim-label-muted); }
.se .given { display: flex; gap: 8px; flex-wrap: wrap; }
.se .chip { font: 800 17px/1 var(--sim-font); padding: 9px 12px; border-radius: var(--look-pill, 999px);
            background: var(--sim-bg-surface); border: var(--sim-border); }
.se .chip.t { border-color: var(--sim-gold); }
.se .step { display: flex; align-items: center; gap: 8px; }
.se .step .btn { width: 52px; font-size: 24px; line-height: 1; padding: 0; }
.se .hval { flex: 1; text-align: center; font: 800 22px/1 var(--sim-font-display); }
.se .lift { background: var(--sim-accent); color: var(--sim-bg-deep); border: 0; font-size: 17px; font-weight: 800;
            box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.se .say { min-height: 40px; margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
.se .say[data-k="good"] { color: var(--sim-good); }
.se .again, .se .next { display: none; }
.se .say:empty { display: none; }
.se .acts { display: none; gap: 8px; }
.se .acts:has([data-on="1"]) { display: flex; }
.se .again[data-on="1"], .se .next[data-on="1"] { display: inline-block; }
.se .next { background: var(--sim-good); color: var(--sim-bg-deep); border: 0; }
.se .btn[disabled] { opacity: 0.45; cursor: default; }
.se .load { transition: transform 0.6s cubic-bezier(.3,1.25,.5,1); }
.se .fill { transition: transform 0.6s cubic-bezier(.3,1.25,.5,1); transform-box: fill-box; transform-origin: 50% 100%; }
@media (prefers-reduced-motion: reduce) { .se .load, .se .fill { transition: none; } }
.sim-dom-root--portrait .se .play { grid-template-columns: minmax(0, 1fr); gap: 10px; }
.sim-dom-root--portrait .se svg { height: auto; aspect-ratio: ${VB_W} / ${VB_H}; }
`;

// The crane, the ruler, the load and the U bar. Every colour is a token.
function boardSvg() {
  const ticks = [];
  for (let h = 0; h <= H_MAX; h += 1) {
    const y = yOf(h);
    ticks.push(`<line x1="48" y1="${y}" x2="62" y2="${y}" stroke="var(--sim-label-muted)" stroke-width="2"/>`
      + `<text x="40" y="${y + 10}" text-anchor="end" font-size="30" font-weight="700" fill="var(--sim-label-muted)">${h}</text>`);
  }
  // lattice mast
  const mast = [];
  for (let y = GY; y > 30; y -= 26) {
    mast.push(`<line x1="104" y1="${y}" x2="128" y2="${y - 26}" stroke="var(--sim-gold)" stroke-width="2.5"/>`
      + `<line x1="104" y1="${y - 26}" x2="128" y2="${y - 26}" stroke="var(--sim-gold)" stroke-width="2"/>`);
  }
  return `<svg viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="A crane holding a load over the ground, a height scale in metres, and a U bar with a target line">
  <defs>
    <clipPath id="se-below-jib"><rect x="0" y="40" width="${VB_W}" height="${VB_H}"/></clipPath>
    <pattern id="se-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="color-mix(in oklab, var(--sim-bad) 22%, transparent)"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="var(--sim-bad)" stroke-width="3"/>
    </pattern>
  </defs>
  <rect x="0" y="${GY}" width="${VB_W}" height="${VB_H - GY}" fill="color-mix(in oklab, var(--sim-series-3) 30%, var(--sim-bg-surface))"/>
  <rect x="0" y="${GY}" width="${VB_W}" height="4" fill="color-mix(in oklab, var(--sim-series-3) 55%, var(--sim-bg-surface))"/>
  <line x1="55" y1="${GY}" x2="55" y2="${TOPY}" stroke="var(--sim-label-muted)" stroke-width="2"/>
  ${ticks.join('')}
  <text x="40" y="${TOPY - 34}" text-anchor="end" font-size="32" font-weight="800" fill="var(--sim-label-muted)">m</text>
  <!-- crane: base, mast (light and shade rails), jib, counter-jib, cab -->
  <rect x="88" y="${GY - 12}" width="56" height="14" rx="3" fill="color-mix(in oklab, var(--sim-label) 45%, var(--sim-bg-surface))"/>
  <rect x="100" y="34" width="6" height="${GY - 46}" fill="color-mix(in oklab, var(--sim-gold) 70%, white)"/>
  <rect x="126" y="34" width="6" height="${GY - 46}" fill="color-mix(in oklab, var(--sim-gold) 70%, black)"/>
  ${mast.join('')}
  <rect x="62" y="26" width="370" height="14" rx="3" fill="var(--sim-gold)"/>
  <rect x="62" y="26" width="370" height="4" rx="2" fill="color-mix(in oklab, var(--sim-gold) 60%, white)"/>
  <rect x="62" y="36" width="370" height="4" fill="color-mix(in oklab, var(--sim-gold) 65%, black)"/>
  <rect x="64" y="40" width="22" height="20" rx="3" fill="color-mix(in oklab, var(--sim-label) 55%, var(--sim-bg-surface))"/>
  <rect x="108" y="40" width="20" height="16" rx="3" fill="var(--sim-series-1)"/>
  <rect x="112" y="43" width="12" height="7" rx="1" fill="color-mix(in oklab, var(--sim-glass) 70%, white)"/>
  <rect x="${LOAD_X + LOAD_W / 2 - 14}" y="40" width="28" height="9" rx="2" fill="color-mix(in oklab, var(--sim-label) 50%, var(--sim-bg-surface))"/>
  <!-- the preview height: a dashed line where the load will stop -->
  <g class="ghost">
    <line x1="56" x2="${LOAD_X + LOAD_W + 20}" y1="${GY}" y2="${GY}" stroke="var(--sim-accent)" stroke-width="2.5" stroke-dasharray="7 6"/>
  </g>
  <!-- the load group moves; the cable goes up out of the clip under the jib -->
  <g clip-path="url(#se-below-jib)">
    <g class="load" style="transform: translateY(0px)">
      <rect x="${LOAD_X + LOAD_W / 2 - 1.5}" y="${GY - LOAD_H - 400}" width="3" height="${400 - 8}" fill="var(--sim-label-muted)"/>
      <path d="M ${LOAD_X + LOAD_W / 2} ${GY - LOAD_H - 12} L ${LOAD_X + 8} ${GY - LOAD_H} M ${LOAD_X + LOAD_W / 2} ${GY - LOAD_H - 12} L ${LOAD_X + LOAD_W - 8} ${GY - LOAD_H}" stroke="var(--sim-label-muted)" stroke-width="2.5" fill="none"/>
      <rect x="${LOAD_X}" y="${GY - LOAD_H}" width="${LOAD_W}" height="${LOAD_H}" rx="4" fill="var(--sim-series-8)"/>
      <rect x="${LOAD_X}" y="${GY - LOAD_H}" width="7" height="${LOAD_H}" rx="3" fill="color-mix(in oklab, var(--sim-series-8) 60%, white)"/>
      <rect x="${LOAD_X + LOAD_W - 16}" y="${GY - LOAD_H}" width="16" height="${LOAD_H}" rx="3" fill="color-mix(in oklab, var(--sim-series-8) 72%, black)"/>
      <line x1="${LOAD_X + 4}" y1="${GY - 9}" x2="${LOAD_X + LOAD_W - 4}" y2="${GY - 9}" stroke="color-mix(in oklab, var(--sim-series-8) 60%, black)" stroke-width="2"/>
      <text class="mtxt" x="${LOAD_X + LOAD_W / 2}" y="${GY - LOAD_H / 2 + 8}" text-anchor="middle" font-size="32" font-weight="800" fill="color-mix(in oklab, var(--sim-series-8) 25%, black)"></text>
    </g>
  </g>
  <!-- U bar: slot, fill (light and shade strips), target line, miss band -->
  <rect x="${BAR_X - 6}" y="${TOPY - 6}" width="${BAR_W + 12}" height="${GY - TOPY + 12}" rx="10" fill="var(--sim-bg-deep)" stroke="var(--sim-stroke)" stroke-width="2.5"/>
  <g class="fill" style="transform: scaleY(0)">
    <rect x="${BAR_X}" y="${TOPY}" width="${BAR_W}" height="${GY - TOPY}" rx="6" fill="var(--sim-series-3)"/>
    <rect x="${BAR_X + 3}" y="${TOPY}" width="8" height="${GY - TOPY}" rx="3" fill="color-mix(in oklab, var(--sim-series-3) 55%, white)"/>
    <rect x="${BAR_X + BAR_W - 16}" y="${TOPY}" width="16" height="${GY - TOPY}" rx="4" fill="color-mix(in oklab, var(--sim-series-3) 70%, black)"/>
  </g>
  <rect class="miss" x="${BAR_X - 4}" y="0" width="${BAR_W + 8}" height="0" fill="url(#se-hatch)"/>
  <g class="target">
    <line x1="${BAR_X - 12}" x2="${BAR_X + BAR_W + 12}" y1="0" y2="0" stroke="var(--sim-gold)" stroke-width="4" stroke-dasharray="9 5"/>
    <text x="${BAR_X - 16}" y="10" text-anchor="end" font-size="30" font-weight="800" fill="var(--sim-label)">target</text>
  </g>
  <text class="uval" x="${BAR_X + BAR_W / 2}" y="${TOPY - 16}" text-anchor="middle" font-size="30" font-weight="800" fill="var(--sim-label)"></text>
  <text x="${BAR_X + BAR_W / 2}" y="${GY + 28}" text-anchor="middle" font-size="30" font-weight="800" fill="var(--sim-label)">U</text>
</svg>`;
}

export class StoredEnergyGameScene extends GameBoard {
  static ARIA_LABEL = 'A five-round game: a crane lifts a load. Each round gives the mass and a target potential energy. Set the height in half-metre steps and lift: the U bar fills to m g h beside the target line.';
  static OBJECTIVE = { prompt: { en: 'Lift the load to store exactly the target energy. Use U = mgh.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.height = 1;
    this.lifted = false;
    this.roundWon = false;
    this.allWon = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      html: `<div class="gm se">
        <div class="gm-head"><p class="kicker">Potential energy</p><h2>Store exactly the <b>target</b> energy</h2>
          <p class="sub">U = m g h, with g = 10 m/s^2. Set the height, then lift.</p></div>
        <div class="play">
          <div class="stage">${boardSvg()}</div>
          <div class="side">
            <div class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}<span class="pn">practice numbers</span></div>
            <div class="given"><span class="chip m"></span><span class="chip t"></span></div>
            <div class="step">
              <button type="button" class="tap btn minus" aria-label="Lower by half a metre">&minus;</button>
              <span class="hval" aria-live="polite"></span>
              <button type="button" class="tap btn plus" aria-label="Higher by half a metre">+</button>
            </div>
            <button type="button" class="tap btn lift">Lift</button>
            <p class="say" aria-live="polite"></p>
            <div class="acts"><button type="button" class="tap btn again">Try again</button><button type="button" class="tap btn next">Next load</button></div>
          </div>
        </div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.lift')) return;
    onTap(q('.minus'), () => this.nudge(-H_STEP));
    onTap(q('.plus'), () => this.nudge(H_STEP));
    onTap(q('.lift'), () => this.lift());
    onTap(q('.again'), () => this.lower());
    onTap(q('.next'), () => this.nextRound());
    this.deal();
    this.quill?.speak('Pick a height, then tap Lift.', 5000);
  }

  get round() { return ROUNDS[this.roundNo]; }
  get uMax() { return this.round.m * G * H_MAX; }      // the bar's top: the load at 6 m

  deal() {
    const q = (s) => this.root.querySelector(s);
    const r = this.round;
    this.height = 1;
    this.lifted = false;
    this.roundWon = false;
    q('.chip.m').textContent = `m = ${r.m} kg`;
    q('.chip.t').textContent = `target U = ${r.target} J`;
    q('.mtxt').textContent = `${r.m} kg`;
    q('.target').setAttribute('transform', `translate(0 ${this.barY(r.target)})`);
    q('.next').dataset.on = '0';
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo || (i === this.roundNo && this.roundWon) ? '1' : '0'; });
    this.lower();
  }

  barY(u) { return GY - (u / this.uMax) * (GY - TOPY); }

  nudge(dh) {
    if (this.lifted) return;
    this.height = Math.min(H_MAX, Math.max(H_STEP, this.height + dh));
    this.paint();
  }

  lift() {
    if (this.lifted) return;
    this.lifted = true;
    const r = this.round, u = r.m * G * this.height;
    const say = this.root.querySelector('.say');
    this.paint();
    if (u === r.target) {
      this.roundWon = true;
      say.dataset.k = 'good';
      say.textContent = `U = ${r.m} x 10 x ${fmtH(this.height)} = ${u} J. Exactly the target.`;
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
      const d = Math.abs(u - r.target);
      say.textContent = `U = ${u} J: ${d} J ${u > r.target ? 'too much. Lower it' : 'too little. Lift it higher'}.`;
      this.root.querySelector('.again').dataset.on = '1';
    }
    this.paint();
  }

  lower() {
    this.lifted = false;
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
    const r = this.round;
    const hNow = this.lifted ? this.height : 0;
    const u = r.m * G * hNow;
    q('.hval').textContent = `h = ${fmtH(this.height)} m`;
    q('.load').style.transform = `translateY(${-hNow * PXM}px)`;
    q('.ghost').setAttribute('transform', `translate(0 ${-this.height * PXM})`);
    q('.ghost').style.opacity = this.lifted ? '0' : '1';
    q('.fill').style.transform = `scaleY(${u / this.uMax})`;
    q('.uval').textContent = this.lifted ? `${u} J` : '';
    const miss = q('.miss');
    if (this.lifted && u !== r.target) {
      const a = this.barY(u), b = this.barY(r.target);
      miss.setAttribute('y', String(Math.min(a, b)));
      miss.setAttribute('height', String(Math.abs(a - b)));
    } else miss.setAttribute('height', '0');
    q('.minus').disabled = this.lifted || this.height <= H_STEP;
    q('.plus').disabled = this.lifted || this.height >= H_MAX;
    q('.lift').disabled = this.lifted;
  }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.lift')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }
}
