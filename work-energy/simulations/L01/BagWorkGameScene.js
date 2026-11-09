// BagWorkGameScene - blk-l01-s12, mini-game@1. A hoist lifts wheat bags of 5 kg (50 N each).
// Each round gives a target work. The learner picks the number of bags (1-4, so F = 50 to
// 200 N) and the height (1, 2 or 3 m) and taps Lift: the bags rise on the hoist, the solid
// F arrow and the dashed s arrow show the force and the displacement, and the W column fills
// to F x s beside the target line. Exact = round won; a miss says the computed W and offers
// Try again. Every target is some bags x 50 x some height, so every round can be won.
// A worker on the left hauls the rope down over a second pulley (kit SimFigure, drawn on a
// small canvas in a foreignObject so it scales with the board).
// Control names: .bminus, .bplus, .hminus, .hplus, .lift, .again, .next.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';

const BAG_N = 50;
const N_MAX = 4, H_MAX = 3;
const ROUNDS = [
  { target: 100 },   // 1 bag x 2 m, 2 bags x 1 m
  { target: 300 },   // 2 x 3 m, 3 x 2 m
  { target: 400 },   // 4 x 2 m
  { target: 450 },   // 3 x 3 m
  { target: 600 },   // 4 x 3 m
];
const W_MAX = BAG_N * N_MAX * H_MAX;               // 600 J, the column's top

// SVG geometry (viewBox 680 x 330)
const VB_W = 680, VB_H = 330;
const GY = 298, PXM = 56;                          // ground line, 56 px per metre
const CX = 390;                                    // centre of the load
const SACK_W = 46, SACK_H = 42, PAL_H = 10, GAP = 4;
const RX = 100, SX = 118, FX = 504;                // the metre ruler, the s arrow, the F arrow
const P2X = 84, ROPE_X = P2X - 13;                 // the worker's pulley; his rope comes down its left side
const FO = { x: 0, y: 176, w: 124, h: 128 };       // the worker's canvas, in board units
const DPR = 3, FS = 32;                            // canvas density; label font size
const BEAM_L = 56, BEAM_R = 420;
const COL_X = 612, COL_W = 50, COL_TOP = 60;
const palHalf = (n) => (n * SACK_W + (n - 1) * GAP + 16) / 2;
const yOf = (h) => GY - h * PXM;
const colY = (w) => GY - (w / W_MAX) * (GY - COL_TOP);

const CSS = `
.gm.bw { background: var(--sim-bg-deep); border-radius: 14px; }
.gm.bw { --ink: var(--sim-label); }
.gm.bw[data-th="dark"] { --ink: var(--sim-bg-deep); }
.bw .play { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; align-items: stretch; }
.bw .stage { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 4px; overflow: hidden; display: flex; }
.bw svg { overflow: visible; display: block; width: 100%; height: 278px; }
.bw .side { display: flex; flex-direction: column; gap: 8px; }
.bw .dots { display: flex; gap: 6px; align-items: center; }
.bw .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--sim-track); }
.bw .dot[data-on="1"] { background: var(--sim-good); }
.bw .given { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.bw .chip { font: 800 17px/1 var(--sim-font); padding: 9px 12px; border-radius: var(--look-pill, 999px);
            background: var(--sim-bg-surface); border: var(--sim-border); }
.bw .chip.t { border-color: var(--sim-gold); }
.bw .step { display: flex; align-items: center; gap: 8px; }
.bw .step .btn { width: 52px; font-size: 24px; line-height: 1; padding: 0; }
.bw .val { flex: 1; text-align: center; font: 800 21px/1 var(--sim-font-display); }
.bw .go { background: var(--sim-accent); color: var(--sim-bg-deep); border: 0; font-size: 17px; font-weight: 800;
          box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.bw .say { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
.bw .say:empty { display: none; }
.bw .say[data-k="good"] { color: var(--sim-good); }
.bw .acts { display: none; gap: 8px; }
.bw .acts .btn { flex: 1; }
.bw[data-done="1"] .acts { display: flex; }
.bw[data-done="1"] .go { display: none; }
.bw .again, .bw .next { display: none; }
.bw .again[data-on="1"], .bw .next[data-on="1"] { display: inline-block; }
.bw .next { background: var(--sim-good); color: var(--sim-bg-deep); border: 0; }
.bw .btn[disabled] { opacity: 0.45; cursor: default; }
.bw .load, .bw .sarrow, .bw .farrow { transition: transform 0.6s cubic-bezier(.3,1.25,.5,1); }
.bw .fill { transition: transform 0.6s cubic-bezier(.3,1.25,.5,1); transform-box: fill-box; transform-origin: 50% 100%; }
@media (prefers-reduced-motion: reduce) { .bw .load, .bw .fill, .bw .sarrow, .bw .farrow { transition: none; } }
.sim-dom-root--portrait .bw .play { grid-template-columns: minmax(0, 1fr); gap: 10px; }
.sim-dom-root--portrait .bw svg { height: auto; aspect-ratio: ${VB_W} / ${VB_H}; }
`;

const JUTE = 'color-mix(in oklab, var(--sim-gold) 48%, var(--sim-bg-surface))';
const JUTE_DK = 'color-mix(in oklab, var(--sim-gold) 55%, var(--ink))';
const JUTE_LT = 'color-mix(in oklab, var(--sim-gold) 30%, var(--sim-bg-surface))';
const WOOD = 'color-mix(in oklab, var(--sim-series-8) 55%, var(--ink))';
const WOOD_LT = 'color-mix(in oklab, var(--sim-series-8) 70%, var(--sim-bg-surface))';

// One jute sack, top-left at (x, y): a bulging body, a tied neck, a light side, a shade side, a seam.
function sack(x, y, i) {
  const w = SACK_W, h = SACK_H, m = y + h * 0.52;
  const body = `M${x + 6} ${y + 10} Q${x} ${m} ${x + 3} ${y + h} Q${x + w / 2} ${y + h + 4} ${x + w - 3} ${y + h} Q${x + w} ${m} ${x + w - 6} ${y + 10} Q${x + w / 2} ${y + 13} ${x + 6} ${y + 10}Z`;
  const shade = `M${x + w * 0.66} ${y + 12} Q${x + w - 2} ${y + 10} ${x + w - 6} ${y + 10} Q${x + w} ${m} ${x + w - 3} ${y + h} Q${x + w * 0.8} ${y + h + 3} ${x + w * 0.66} ${y + h + 3}Z`;
  return `<g class="sack" data-i="${i}">
    <path d="${body}" fill="${JUTE}" stroke="${JUTE_DK}" stroke-width="2"/>
    <path d="${shade}" fill="${JUTE_DK}" opacity="0.55"/>
    <path d="M${x + 7} ${y + 15} Q${x + 3} ${m} ${x + 7} ${y + h - 4}" stroke="${JUTE_LT}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M${x + 7} ${m + 2} Q${x + w / 2} ${m + 6} ${x + w - 7} ${m + 2}" stroke="${JUTE_DK}" stroke-width="1.6" stroke-dasharray="4 3" fill="none"/>
    <path d="M${x + w / 2 - 8} ${y + 11} L${x + w / 2 - 5} ${y + 1} L${x + w / 2 + 5} ${y + 1} L${x + w / 2 + 8} ${y + 11}Z" fill="${JUTE}" stroke="${JUTE_DK}" stroke-width="1.6"/>
    <rect x="${x + w / 2 - 7}" y="${y + 6}" width="14" height="4" rx="2" fill="${WOOD}"/>
  </g>`;
}

function pill(cls, x, y, anchor = 'start') {
  return `<g class="${cls}"><rect class="pb" x="0" y="0" width="0" height="38" rx="19" fill="var(--sim-bg-surface)" stroke="var(--sim-stroke)" stroke-width="2"/>
    <text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${FS}" font-weight="800" fill="var(--sim-label)"></text></g>`;
}

function boardSvg() {
  const ticks = [];
  for (let h = 0; h <= H_MAX; h += 1) {
    const y = yOf(h);
    ticks.push(`<line x1="${RX - 8}" y1="${y}" x2="${RX + 8}" y2="${y}" stroke="var(--sim-label-muted)" stroke-width="2.5"/>`);
    if (h > 0) ticks.push(`<text x="${RX - 12}" y="${y + 10}" text-anchor="end" font-size="${FS}" font-weight="700" fill="var(--sim-label-muted)">${h}</text>`);
    if (h < H_MAX) ticks.push(`<line x1="${RX}" y1="${y - PXM / 2}" x2="${RX + 8}" y2="${y - PXM / 2}" stroke="var(--sim-label-muted)" stroke-width="1.5"/>`);
  }
  // back wall planks (texture), the hoist beam with its shade, the pulley
  const planks = [];
  for (let x = 130; x < 590; x += 46) planks.push(`<line x1="${x}" y1="20" x2="${x}" y2="${GY}" stroke="color-mix(in oklab, var(--sim-label) 9%, transparent)" stroke-width="2"/>`);
  const sackRow = [];
  for (let i = 0; i < N_MAX; i += 1) sackRow.push(sack(0, GY - PAL_H - SACK_H - 4, i));
  const palL = CX - palHalf(N_MAX), palR = CX + palHalf(N_MAX), palTop = GY - PAL_H;
  const hookY = GY - PAL_H - SACK_H - 30;
  return `<svg viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="A hoist over a row of wheat sacks, a height scale in metres, a force arrow and a displacement arrow, and a work column with a target line">
  <defs>
    <clipPath id="bw-below-beam"><rect x="0" y="24" width="${VB_W}" height="${VB_H}"/></clipPath>
    <pattern id="bw-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="color-mix(in oklab, var(--sim-bad) 22%, transparent)"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="var(--sim-bad)" stroke-width="3"/>
    </pattern>
  </defs>
  <rect x="124" y="16" width="466" height="${GY - 16}" fill="color-mix(in oklab, var(--sim-label) 5%, var(--sim-bg-surface))"/>
  ${planks.join('')}
  <rect x="-400" y="${GY}" width="${VB_W + 800}" height="${VB_H - GY}" fill="color-mix(in oklab, var(--sim-series-8) 26%, var(--sim-bg-surface))"/>
  <rect x="-400" y="${GY}" width="${VB_W + 800}" height="4" fill="color-mix(in oklab, var(--sim-series-8) 50%, var(--sim-bg-surface))"/>
  <line x1="${RX}" y1="${GY}" x2="${RX}" y2="${yOf(H_MAX) - 6}" stroke="var(--sim-label-muted)" stroke-width="2.5"/>
  ${ticks.join('')}
  <text x="${RX - 14}" y="${yOf(H_MAX) - 18}" text-anchor="middle" font-size="${FS}" font-weight="800" fill="var(--sim-label-muted)">m</text>
  <!-- hoist beam, the load pulley over the sacks and the worker's pulley at the left end -->
  <rect x="${BEAM_L}" y="4" width="${BEAM_R - BEAM_L}" height="18" rx="3" fill="${WOOD}"/>
  <rect x="${BEAM_L}" y="4" width="${BEAM_R - BEAM_L}" height="5" rx="2" fill="${WOOD_LT}"/>
  <rect x="${BEAM_L}" y="17" width="${BEAM_R - BEAM_L}" height="5" fill="color-mix(in oklab, var(--sim-series-8) 40%, var(--ink))"/>
  ${[CX, P2X].map((px) => `<rect x="${px - 4}" y="20" width="8" height="12" fill="var(--sim-label)"/>
  <circle cx="${px}" cy="36" r="13" fill="color-mix(in oklab, var(--sim-label) 40%, var(--sim-bg-surface))" stroke="var(--sim-label)" stroke-width="2.5"/>
  <circle cx="${px}" cy="36" r="4" fill="var(--sim-label)"/>`).join('')}
  <!-- the rope: over the load pulley, along under the beam, over the worker's pulley, down to his hands, a coil at his feet -->
  <path d="M${CX} 23 H${P2X} A13 13 0 0 0 ${ROPE_X} 36 V${GY - 14} q0 10 10 11" stroke="color-mix(in oklab, var(--sim-series-8) 60%, var(--ink))" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="${ROPE_X + 14}" cy="${GY - 3}" rx="13" ry="4.5" fill="none" stroke="color-mix(in oklab, var(--sim-series-8) 60%, var(--ink))" stroke-width="3"/>
  <foreignObject x="${FO.x}" y="${FO.y}" width="${FO.w}" height="${FO.h}" pointer-events="none"><canvas xmlns="http://www.w3.org/1999/xhtml" class="fig" width="${FO.w * DPR}" height="${FO.h * DPR}" style="display:block;width:100%;height:100%" aria-hidden="true"></canvas></foreignObject>
  <!-- preview height: a dashed line where the pallet will stop -->
  <line class="ghost" x1="${RX}" x2="${CX + 40}" y1="${GY}" y2="${GY}" stroke="var(--sim-accent)" stroke-width="2.5" stroke-dasharray="7 6"/>
  <!-- the load moves; the rope runs up out of the clip under the beam -->
  <g clip-path="url(#bw-below-beam)">
    <g class="load" style="transform: translateY(0px)">
      <rect x="${CX - 1.5}" y="${hookY - 400}" width="3" height="400" fill="color-mix(in oklab, var(--sim-series-8) 60%, var(--ink))"/>
      <path class="sling" d="" stroke="color-mix(in oklab, var(--sim-series-8) 60%, var(--ink))" stroke-width="3" fill="none"/>
      <path d="M${CX - 6} ${hookY} q0 12 6 12 q8 0 8 -9" stroke="var(--sim-label)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      ${sackRow.join('')}
      <rect class="pal" x="${palL}" y="${palTop}" width="${palR - palL}" height="${PAL_H}" rx="2" fill="${WOOD}"/>
      <rect class="pal" x="${palL}" y="${palTop}" width="${palR - palL}" height="3" fill="${WOOD_LT}"/>
    </g>
  </g>
  <!-- F: solid, upward, at the load; s: dashed, from the ground to the stop height -->
  <g class="farrow" style="transform: translateY(0px)">
    <line x1="${FX}" y1="${palTop - 4}" x2="${FX}" y2="${palTop - 40}" stroke="var(--sim-series-2)" stroke-width="7" stroke-linecap="round"/>
    <path d="M${FX} ${palTop - 58} l-13 22 h26 z" fill="var(--sim-series-2)"/>
  </g>
  <g class="sarrow"><line x1="${palR + 74}" y1="${GY - 2}" x2="${palR + 74}" y2="${GY - 2}" stroke="var(--sim-label)" stroke-width="4" stroke-dasharray="10 7"/>
    <path class="shead" d="" fill="var(--sim-label)"/></g>
  ${pill('fpill', 0, 0)}
  ${pill('spill', 0, 0)}
  <!-- W column: slot, fill (light and shade strips), miss band, target line -->
  <rect x="${COL_X - 6}" y="${COL_TOP - 6}" width="${COL_W + 12}" height="${GY - COL_TOP + 12}" rx="10" fill="var(--sim-bg-deep)" stroke="var(--sim-stroke)" stroke-width="2.5"/>
  <g class="fill" style="transform: scaleY(0)">
    <rect x="${COL_X}" y="${COL_TOP}" width="${COL_W}" height="${GY - COL_TOP}" rx="6" fill="var(--sim-accent)"/>
    <rect x="${COL_X + 3}" y="${COL_TOP}" width="8" height="${GY - COL_TOP}" rx="3" fill="color-mix(in oklab, var(--sim-accent) 55%, var(--sim-bg-surface))"/>
    <rect x="${COL_X + COL_W - 16}" y="${COL_TOP}" width="16" height="${GY - COL_TOP}" rx="4" fill="color-mix(in oklab, var(--sim-accent) 70%, var(--sim-label))"/>
  </g>
  <rect class="miss" x="${COL_X - 4}" y="0" width="${COL_W + 8}" height="0" fill="url(#bw-hatch)"/>
  <g class="target"><line x1="${COL_X - 14}" x2="${COL_X + COL_W + 10}" y1="0" y2="0" stroke="var(--sim-gold)" stroke-width="4" stroke-dasharray="9 5"/></g>
  <text class="wval" x="${COL_X + COL_W / 2}" y="${COL_TOP - 16}" text-anchor="middle" font-size="${FS}" font-weight="800" fill="var(--sim-label)"></text>
  <text x="${COL_X + COL_W / 2}" y="${GY + 29}" text-anchor="middle" font-size="${FS}" font-weight="800" fill="var(--sim-label)">W</text>
</svg>`;
}

export class BagWorkGameScene extends GameBoard {
  static ARIA_LABEL = 'A five-round game: a hoist lifts wheat bags of 50 N each. Each round gives a target work. Pick the number of bags and the height and lift: the work column fills to F times s beside the target line.';
  static OBJECTIVE = { prompt: { en: 'Lift wheat bags to do exactly the target work. Each bag weighs 50 N. Use W = F x s.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.bags = 1;
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
      html: `<div class="gm bw">
        <div class="gm-head"><p class="kicker">Work</p><h2>Do exactly the <b>target</b> work</h2>
          <p class="sub">Each bag weighs 50 N. W = F x s. Pick the bags and the height, then lift.</p></div>
        <div class="play">
          <div class="stage">${boardSvg()}</div>
          <div class="side">
            <div class="given"><span class="chip t"></span><span class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}</span></div>
            <div class="step">
              <button type="button" class="tap btn bminus" aria-label="One bag fewer">&minus;</button>
              <span class="val bval" aria-live="polite"></span>
              <button type="button" class="tap btn bplus" aria-label="One bag more">+</button>
            </div>
            <div class="step">
              <button type="button" class="tap btn hminus" aria-label="One metre lower">&minus;</button>
              <span class="val hval" aria-live="polite"></span>
              <button type="button" class="tap btn hplus" aria-label="One metre higher">+</button>
            </div>
            <button type="button" class="tap btn go lift">Lift</button>
            <div class="acts"><button type="button" class="tap btn again">Try again</button><button type="button" class="tap btn next">Next round</button></div>
            <p class="say" aria-live="polite"></p>
          </div>
        </div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.lift')) return;
    // shade mixes go toward a dark ink in both themes (the label token is light in dark)
    q('.gm').dataset.th = globalThis.document?.documentElement?.dataset?.theme === 'light' ? 'light' : 'dark';
    this.colors = loadColors(this.root);
    onTap(q('.bminus'), () => this.nudge('bags', -1, N_MAX));
    onTap(q('.bplus'), () => this.nudge('bags', 1, N_MAX));
    onTap(q('.hminus'), () => this.nudge('height', -1, H_MAX));
    onTap(q('.hplus'), () => this.nudge('height', 1, H_MAX));
    onTap(q('.lift'), () => this.lift());
    onTap(q('.again'), () => this.lower());
    onTap(q('.next'), () => this.nextRound());
    this.deal();
    this.quill?.speak('Pick bags and a height, then tap Lift.', 5000);
  }

  get round() { return ROUNDS[this.roundNo]; }

  deal() {
    const q = (s) => this.root.querySelector(s);
    this.bags = 1;
    this.height = 1;
    this.roundWon = false;
    q('.chip.t').textContent = `target W = ${this.round.target} J`;
    q('.target').setAttribute('transform', `translate(0 ${colY(this.round.target)})`);
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    this.lower();
  }

  nudge(key, d, max) {
    if (this.lifted) return;
    this[key] = Math.min(max, Math.max(1, this[key] + d));
    this.paint();
  }

  lift() {
    if (this.lifted) return;
    this.lifted = true;
    const f = this.bags * BAG_N, w = f * this.height, t = this.round.target;
    const say = this.root.querySelector('.say');
    this.root.querySelector('.bw').dataset.done = '1';
    if (w === t) {
      this.roundWon = true;
      say.dataset.k = 'good';
      say.textContent = `W = ${f} N x ${this.height} m = ${w} J. Exactly the target.`;
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
      say.textContent = `W = ${f} N x ${this.height} m = ${w} J: ${Math.abs(w - t)} J too ${w > t ? 'much' : 'little'}.`;
      this.root.querySelector('.again').dataset.on = '1';
    }
    this.paint();
  }

  lower() {
    const q = (s) => this.root.querySelector(s);
    this.lifted = false;
    q('.bw').dataset.done = '0';
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

  // A pill sized to its text, placed with its left edge at x and its middle at y.
  placePill(sel, x, y, text) {
    const g = this.root.querySelector(sel);
    const tx = g.querySelector('text'), rb = g.querySelector('.pb');
    tx.textContent = text;
    const tw = tx.getComputedTextLength?.() || 0;
    const w = Math.round((tw > 0 ? tw : text.length * 15.5) + 26);
    rb.setAttribute('x', String(x)); rb.setAttribute('y', String(y - 19)); rb.setAttribute('width', String(w));
    tx.setAttribute('x', String(x + 13)); tx.setAttribute('y', String(y + 11));
    return w;
  }

  paint() {
    const q = (s) => this.root.querySelector(s);
    const f = this.bags * BAG_N;
    const hNow = this.lifted ? this.height : 0;
    const w = this.lifted ? f * this.height : 0;
    const palTop = GY - PAL_H;
    q('.bval').textContent = `${this.bags} bag${this.bags > 1 ? 's' : ''}`;
    q('.hval').textContent = `h = ${this.height} m`;
    const half = palHalf(this.bags), palL = CX - half, palR = CX + half;
    this.root.querySelectorAll('.sack').forEach((s) => {
      const i = Number(s.dataset.i);
      s.style.display = i < this.bags ? '' : 'none';
      s.setAttribute('transform', `translate(${palL + 8 + i * (SACK_W + GAP)} 0)`);
    });
    this.root.querySelectorAll('.pal').forEach((r) => { r.setAttribute('x', String(palL)); r.setAttribute('width', String(2 * half)); });
    const hookY = GY - PAL_H - SACK_H - 30;
    q('.sling').setAttribute('d', `M${CX} ${hookY + 10} L${palL + 4} ${palTop} M${CX} ${hookY + 10} L${palR - 4} ${palTop}`);
    q('.load').style.transform = `translateY(${-hNow * PXM}px)`;
    q('.farrow').style.transform = `translateY(${-hNow * PXM}px)`;
    q('.ghost').setAttribute('transform', `translate(0 ${-this.height * PXM})`);
    q('.ghost').style.opacity = this.lifted ? '0' : '1';
    // s arrow: always from the ground to the chosen height (the displacement the lift will make)
    const sx = SX, sTop = GY - this.height * PXM + 4;
    const line = q('.sarrow line');
    line.setAttribute('x1', String(sx)); line.setAttribute('x2', String(sx));
    line.setAttribute('y2', String(sTop + 18));
    q('.shead').setAttribute('d', `M${sx} ${sTop} l-11 20 h22 z`);
    q('.sarrow').style.opacity = this.lifted ? '1' : '0.75';
    // F pill centred over the arrow head; it rides up with the load
    const fy = palTop - 82 - hNow * PXM, fw = this.placePill('.fpill', 0, fy, `F = ${f} N`);
    this.placePill('.fpill', Math.round(FX - fw / 2), fy, `F = ${f} N`);
    // s pill upright, beside the s arrow at its middle (never along it), kept under the ghost line
    const sMid = Math.min(GY - 21, Math.max(GY - (this.height * PXM) / 2, GY - this.height * PXM + 23));
    this.placePill('.spill', sx + 12, sMid, `s = ${this.height} m`);
    q('.fill').style.transform = `scaleY(${w / W_MAX})`;
    q('.wval').textContent = this.lifted ? `${w} J` : '';
    const miss = q('.miss');
    if (this.lifted && w !== this.round.target) {
      const a = colY(w), b = colY(this.round.target);
      miss.setAttribute('y', String(Math.min(a, b)));
      miss.setAttribute('height', String(Math.abs(a - b)));
    } else miss.setAttribute('height', '0');
    q('.bminus').disabled = this.lifted || this.bags <= 1;
    q('.bplus').disabled = this.lifted || this.bags >= N_MAX;
    q('.hminus').disabled = this.lifted || this.height <= 1;
    q('.hplus').disabled = this.lifted || this.height >= H_MAX;
    q('.lift').disabled = this.lifted;
    this.drawWorker();
  }

  // The worker: hands one above the other on the rope; leaning back while hauling, upright at rest.
  drawWorker() {
    const cv = this.root.querySelector('canvas.fig');
    if (!cv || !this.colors) return;
    const ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, -FO.x * DPR, -FO.y * DPR);
    ctx.clearRect(FO.x, FO.y, FO.w, FO.h);
    const up = this.lifted;
    const spec = figureFor(this, {
      role: 'adult', x: ROPE_X - 40, y: GY, height: 1.7 * PXM, facing: 1, i: 2,
      pose: { name: 'pull', lean: up ? -16 : -8, crouch: up ? 0.2 : 0.1 },
      hands: [{ x: ROPE_X, y: GY - (up ? 58 : 64) }, { x: ROPE_X, y: GY - (up ? 80 : 88) }], look: { mood: 'effort' },
    });
    drawFigure(ctx, this.colors, spec, spec.look);
  }

  refreshTheme() { if (this.root?.querySelector('canvas.fig')) { this.colors = loadColors(this.root); this.drawWorker(); } }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.lift')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }
}
