// DropDepthGameScene - blk-l05-s13, mini-game@1. A coconut beside a palm, over wet sand that
// pushes back with a steady force F. Each round gives the coconut's mass, the sand's force and
// a target dent depth. The learner picks the drop height h (1-8 m) and taps Drop: the
// coconut falls under the solid mg arrow along the dashed h arrow, and in the close-up of the
// sand it sinks until F x depth = mgh, against a depth scale in cm with the target line.
// Exact = round won; a miss says the computed depth and offers Try again. Every target depth
// is F-depth = m x 10 x a whole h from 1 to 8, so every round can be won. Made-up numbers.
// A person stands beyond the palm and points up at the coconut (kit SimFigure on a small
// canvas in a foreignObject, at the board's metre scale).
// Control names: .hminus, .hplus, .drop, .again, .next.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { loadColors } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureFor } from 'simulations/base/kit/SimFigure.js';

const G = 10;
const H_MAX = 8;
const ROUNDS = [
  { m: 1.5, f: 300, cm: 10 },   // 2 m: 30 J / 300 N = 0.10 m
  { m: 2, f: 400, cm: 15 },     // 3 m: 60 J / 400 N
  { m: 1, f: 250, cm: 16 },     // 4 m: 40 J / 250 N
  { m: 1.5, f: 375, cm: 20 },   // 5 m: 75 J / 375 N
  { m: 1.5, f: 450, cm: 20 },   // 6 m: 90 J / 450 N
];
const depthCm = (r, h) => Math.round((r.m * G * h * 100 * 10) / r.f) / 10;
const fmt = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));

// SVG geometry (viewBox 680 x 330)
const VB_W = 680, VB_H = 330;
const SY = 268, PXM = 27;                          // sand surface, px per metre
const NUT_X = 262, NUT_R = 15;                     // the falling coconut
const HX = 92;                                     // the h arrow
const IN_X = 438, IN_W = 236, IN_TOP = 16, IN_SAND = 88, PX_CM = 5;   // close-up of the sand
const IN_CX = IN_X + 110, IN_RX = 42, IN_RY = 36;
const yOf = (h) => SY - h * PXM;
const TX = 362;                                    // the palm's foot (it leans left, over the coconut)
const FO = { x: 382, y: 200, w: 56, h: 74 }, DPR = 4;   // the watcher's canvas, in board units

const CSS = `
.gm.dd { background: var(--sim-bg-deep); border-radius: 14px; }
.gm.dd { --ink: var(--sim-label); }
.gm.dd[data-th="dark"] { --ink: var(--sim-bg-deep); }
.dd .play { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; align-items: stretch; }
.dd .stage { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: 4px; overflow: hidden; }
.dd svg { display: block; width: 100%; height: 278px; overflow: visible; }
.dd .side { display: flex; flex-direction: column; gap: 8px; }
.dd .dots { display: flex; gap: 6px; align-items: center; }
.dd .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--sim-track); }
.dd .dot[data-on="1"] { background: var(--sim-good); }
.dd .given { display: flex; gap: 8px 12px; flex-wrap: wrap; align-items: center; }
.dd .chip { font: 800 17px/1 var(--sim-font); padding: 9px 12px; border-radius: var(--look-pill, 999px);
            background: var(--sim-bg-surface); border: var(--sim-border); }
.dd .chip.t { border-color: var(--sim-gold); }
.dd .step { display: flex; align-items: center; gap: 8px; }
.dd .step .btn { width: 52px; font-size: 24px; line-height: 1; padding: 0; }
.dd .val { flex: 1; text-align: center; font: 800 21px/1 var(--sim-font-display); }
.dd .go { background: var(--sim-accent); color: var(--sim-bg-deep); border: 0; font-size: 17px; font-weight: 800;
          box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.dd .sub sup { font-size: 14px; vertical-align: 5px; line-height: 0; }
.dd .say { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.3; }
.dd .say:empty { display: none; }
.dd .say[data-k="good"] { color: var(--sim-good); }
.dd .acts { display: none; gap: 8px; }
.dd .acts .btn { flex: 1; }
.dd[data-done="1"] .acts { display: flex; }
.dd[data-done="1"] .go { display: none; }
.dd .again, .dd .next { display: none; }
.dd .again[data-on="1"], .dd .next[data-on="1"] { display: inline-block; }
.dd .next { background: var(--sim-good); color: var(--sim-bg-deep); border: 0; }
.dd .btn[disabled] { opacity: 0.45; cursor: default; }
.dd[data-done="1"] .nut { transition: transform 0.6s cubic-bezier(.55,0,1,.45); }
.dd[data-done="1"] .sink { transition: transform 0.5s cubic-bezier(.2,.8,.3,1) 0.6s; }
.dd[data-done="1"] .pit { transition: height 0.5s cubic-bezier(.2,.8,.3,1) 0.6s; }
.dd[data-done="1"] .late { transition: opacity 0.3s 1s; }
.dd[data-done="1"] .early { transition: opacity 0.2s 0.5s; }
@media (prefers-reduced-motion: reduce) { .dd .nut, .dd .sink, .dd .late, .dd .early { transition: none !important; } }
.sim-dom-root--portrait .dd .play { grid-template-columns: minmax(0, 1fr); gap: 10px; }
.sim-dom-root--portrait .dd svg { height: auto; aspect-ratio: ${VB_W} / ${VB_H}; }
`;

const HUSK = 'color-mix(in oklab, var(--sim-series-8) 70%, var(--ink))';
const HUSK_LT = 'color-mix(in oklab, var(--sim-series-8) 60%, var(--sim-bg-surface))';
const HUSK_DK = 'color-mix(in oklab, var(--sim-series-8) 40%, var(--ink))';
const SAND = 'color-mix(in oklab, var(--sim-gold) 38%, var(--sim-bg-surface))';
const SAND_WET = 'color-mix(in oklab, var(--sim-gold) 45%, var(--sim-label) 18%)';
const LEAF = 'var(--sim-series-3)';
const LEAF_DK = 'color-mix(in oklab, var(--sim-series-3) 60%, var(--ink))';
const BARK = 'color-mix(in oklab, var(--sim-series-8) 50%, var(--ink))';

// A husked coconut at (cx, cy): a light side, a shade side, three fibre lines, the stalk end.
function coconut(cx, cy, rx, ry) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${HUSK}" stroke="${HUSK_DK}" stroke-width="2"/>
    <path d="M${cx + rx * 0.2} ${cy - ry * 0.95} A${rx} ${ry} 0 0 1 ${cx + rx * 0.2} ${cy + ry * 0.95} Q${cx + rx * 0.75} ${cy} ${cx + rx * 0.2} ${cy - ry * 0.95}Z" fill="${HUSK_DK}" opacity="0.55"/>
    <path d="M${cx - rx * 0.62} ${cy - ry * 0.4} Q${cx - rx * 0.78} ${cy} ${cx - rx * 0.6} ${cy + ry * 0.42}" stroke="${HUSK_LT}" stroke-width="${Math.max(2, rx / 7)}" fill="none" stroke-linecap="round"/>
    <path d="M${cx - rx * 0.25} ${cy - ry * 0.85} Q${cx - rx * 0.1} ${cy} ${cx - rx * 0.25} ${cy + ry * 0.85} M${cx + rx * 0.05} ${cy - ry * 0.95} Q${cx + rx * 0.2} ${cy} ${cx + rx * 0.05} ${cy + ry * 0.95}" stroke="${HUSK_DK}" stroke-width="1.5" fill="none"/>
    <path d="M${cx - 3} ${cy - ry + 1} l2 -${Math.max(4, ry / 4)} l4 0 l1 ${Math.max(4, ry / 4)}Z" fill="${BARK}"/>`;
}

function frond(x, y, dx, dy, bend) {
  const mx = x + dx / 2, my = y + dy / 2 - bend;
  return `<path d="M${x} ${y} Q${mx} ${my - 14} ${x + dx} ${y + dy} Q${mx} ${my + 10} ${x} ${y}Z" fill="${LEAF}" stroke="${LEAF_DK}" stroke-width="2"/>
    <path d="M${x} ${y} Q${mx} ${my - 2} ${x + dx} ${y + dy}" stroke="${LEAF_DK}" stroke-width="2" fill="none"/>`;
}

function boardSvg() {
  const ticks = [];
  for (let h = 0; h <= H_MAX; h += 1) {
    const y = yOf(h);
    ticks.push(`<line x1="${h % 2 ? 54 : 46}" y1="${y}" x2="62" y2="${y}" stroke="var(--sim-label-muted)" stroke-width="${h % 2 ? 1.5 : 2.5}"/>`);
    if (h % 2 === 0) ticks.push(`<text x="40" y="${y + 10}" text-anchor="end" font-size="30" font-weight="700" fill="var(--sim-label-muted)">${h === H_MAX ? `${h} m` : h}</text>`);
  }
  const inTicks = [];
  for (let cm = 0; cm <= 40; cm += 10) {
    const y = IN_TOP + IN_SAND + cm * PX_CM;
    inTicks.push(`<line x1="${IN_X + IN_W - 26}" y1="${y}" x2="${IN_X + IN_W - 6}" y2="${y}" stroke="var(--sim-label)" stroke-width="2.5"/>`);
    if (cm > 0) inTicks.push(`<text x="${IN_X + IN_W - 32}" y="${y + 9}" text-anchor="end" font-size="30" font-weight="700" fill="var(--sim-label)">${cm}</text>`);
    if (cm < 40) inTicks.push(`<line x1="${IN_X + IN_W - 16}" y1="${y + 5 * PX_CM}" x2="${IN_X + IN_W - 6}" y2="${y + 5 * PX_CM}" stroke="var(--sim-label)" stroke-width="1.5"/>`);
  }
  // the palm: a curved, ringed trunk, a crown of fronds, a bunch of coconuts
  const tx = TX, rings = [];
  for (let i = 1; i < 10; i += 1) {
    const t = i / 10, y = SY - t * (SY - 48), x = tx - 26 * t * t;
    rings.push(`<path d="M${x - 9} ${y} q9 5 18 0" stroke="${BARK}" stroke-width="2" fill="none"/>`);
  }
  const cx = tx - 26, cy = 48;
  const sandFloor = IN_TOP + IN_SAND;
  return `<svg viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="A coconut beside a palm over wet sand, a height scale in metres, a weight arrow and a height arrow, and a close-up of the sand with a depth scale in centimetres and a target line">
  <defs><clipPath id="dd-inset"><rect x="${IN_X}" y="${IN_TOP}" width="${IN_W}" height="${VB_H - IN_TOP - 6}" rx="12"/></clipPath></defs>
  <rect x="-400" y="-50" width="${VB_W + 800}" height="${SY + 50}" fill="color-mix(in oklab, var(--sim-series-5) 10%, var(--sim-bg-surface))"/>
  <rect x="-400" y="${SY}" width="${VB_W + 800}" height="${VB_H - SY + 60}" fill="${SAND}"/>
  <rect x="-400" y="${SY}" width="${VB_W + 800}" height="5" fill="${SAND_WET}" opacity="0.5"/>
  <line x1="54" y1="${SY}" x2="54" y2="${yOf(H_MAX) - 4}" stroke="var(--sim-label-muted)" stroke-width="2.5"/>
  ${ticks.join('')}
  <path d="M${tx - 15} ${SY + 2} Q${tx - 10} ${SY - 120} ${cx - 8} ${cy} L${cx + 8} ${cy} Q${tx + 6} ${SY - 120} ${tx + 13} ${SY + 2}Z" fill="${BARK}"/>
  <path d="M${tx - 5} ${SY} Q${tx - 5} ${SY - 120} ${cx - 3} ${cy}" stroke="color-mix(in oklab, var(--sim-series-8) 40%, var(--sim-bg-surface))" stroke-width="3" fill="none"/>
  ${rings.join('')}
  ${frond(cx, cy, -118, 34, 30)}${frond(cx, cy, 120, 30, 28)}${frond(cx, cy, -80, -30, 6)}${frond(cx, cy, 86, -28, 6)}${frond(cx, cy, -40, 70, 10)}${frond(cx, cy, 52, 66, 10)}
  ${coconut(cx - 12, cy + 12, 12, 11)}${coconut(cx + 10, cy + 14, 12, 11)}
  <foreignObject x="${FO.x}" y="${FO.y}" width="${FO.w}" height="${FO.h}" pointer-events="none"><canvas xmlns="http://www.w3.org/1999/xhtml" class="fig" width="${FO.w * DPR}" height="${FO.h * DPR}" style="display:block;width:100%;height:100%" aria-hidden="true"></canvas></foreignObject>
  <!-- the dent where it lands, shown after the drop -->
  <ellipse class="late dent0" cx="${NUT_X}" cy="${SY + 3}" rx="22" ry="5" fill="${SAND_WET}" opacity="0"/>
  <!-- h: dashed, from the sand up to the coconut's bottom -->
  <line class="hline" x1="${HX}" x2="${HX}" y1="${SY - 2}" y2="${SY - 2}" stroke="var(--sim-label)" stroke-width="4" stroke-dasharray="10 7"/>
  <path class="hhead" d="" fill="var(--sim-label)"/>
  <line class="ghost" x1="${HX}" x2="${NUT_X + 24}" y1="0" y2="0" stroke="var(--sim-accent)" stroke-width="2.5" stroke-dasharray="7 6"/>
  <g class="hpill"><rect x="0" y="-19" width="0" height="38" rx="19" fill="var(--sim-bg-surface)" stroke="var(--sim-stroke)" stroke-width="2"/>
    <text x="13" y="10" font-size="32" font-weight="800" fill="var(--sim-label)"></text></g>
  <!-- the coconut and its mg arrow fall together -->
  <g class="nut" style="transform: translateY(0px)">
    ${coconut(NUT_X, SY - NUT_R, NUT_R, NUT_R - 1)}
    <g class="early">
      <line x1="${NUT_X}" y1="${SY + 4}" x2="${NUT_X}" y2="${SY + 44}" stroke="var(--sim-series-2)" stroke-width="7" stroke-linecap="round"/>
      <path d="M${NUT_X} ${SY + 64} l-12 -22 h24 z" fill="var(--sim-series-2)"/>
      <g class="mgpill"><rect x="${NUT_X + 18}" y="${SY + 18}" width="0" height="38" rx="19" fill="var(--sim-bg-surface)" stroke="var(--sim-stroke)" stroke-width="2"/>
        <text x="${NUT_X + 31}" y="${SY + 47}" font-size="32" font-weight="800" fill="var(--sim-label)"></text></g>
    </g>
  </g>
  <!-- close-up of the sand: a leader from the landing spot, then air, sand, the dent, the depth scale -->
  <path d="M${NUT_X + 18} ${SY - 4} L${IN_X} ${IN_TOP + IN_SAND - 30} M${NUT_X + 18} ${SY + 4} L${IN_X} ${VB_H - 10}" stroke="var(--sim-label-muted)" stroke-width="1.5" stroke-dasharray="4 5" fill="none"/>
  <g clip-path="url(#dd-inset)">
    <rect x="${IN_X}" y="${IN_TOP}" width="${IN_W}" height="${IN_SAND}" fill="color-mix(in oklab, var(--sim-series-5) 14%, var(--sim-bg-surface))"/>
    <rect x="${IN_X}" y="${sandFloor}" width="${IN_W}" height="${VB_H}" fill="${SAND}"/>
    <path d="M${IN_X} ${sandFloor + 60} q40 -8 80 0 t80 0 t80 0 M${IN_X} ${sandFloor + 130} q40 -8 80 0 t80 0 t80 0" stroke="${SAND_WET}" stroke-width="2" opacity="0.5" fill="none"/>
    <rect class="pit" x="${IN_CX - IN_RX + 2}" y="${sandFloor}" width="${2 * IN_RX - 4}" height="0" fill="${SAND_WET}" opacity="0.55"/>
    <g class="sink" style="transform: translateY(0px)">
      ${coconut(IN_CX, sandFloor - IN_RY, IN_RX, IN_RY)}
    </g>
    <line x1="${IN_X}" x2="${IN_X + IN_W}" y1="${sandFloor}" y2="${sandFloor}" stroke="${SAND_WET}" stroke-width="3"/>
    ${inTicks.join('')}
    <line class="target" x1="${IN_X}" x2="${IN_X + IN_W - 6}" y1="0" y2="0" stroke="var(--sim-gold)" stroke-width="4" stroke-dasharray="9 5"/>
    <g class="late">
      <line x1="${IN_CX}" y1="${VB_H + 40}" x2="${IN_CX}" y2="${VB_H}" stroke="var(--sim-series-6)" stroke-width="7" stroke-linecap="round" class="farrow"/>
      <path class="fhead" d="" fill="var(--sim-series-6)"/>
      <g class="fpill"><rect x="${IN_X + 8}" y="0" width="0" height="38" rx="19" fill="var(--sim-bg-surface)" stroke="var(--sim-stroke)" stroke-width="2"/>
        <text x="${IN_X + 21}" y="0" font-size="30" font-weight="800" fill="var(--sim-label)"></text></g>
    </g>
  </g>
  <rect x="${IN_X}" y="${IN_TOP}" width="${IN_W}" height="${VB_H - IN_TOP - 6}" rx="12" fill="none" stroke="var(--sim-stroke)" stroke-width="3"/>
  <text x="${IN_X + IN_W - 10}" y="${IN_TOP + 30}" text-anchor="end" font-size="30" font-weight="800" fill="var(--sim-label-muted)">cm</text>
</svg>`;
}

export class DropDepthGameScene extends GameBoard {
  static ARIA_LABEL = 'A five-round game: a coconut over wet sand that pushes back with a steady force. Each round gives the mass, the force and a target dent depth. Pick the drop height and drop: in the close-up the coconut sinks until the force times the depth equals m g h, against a depth scale with the target line.';
  static OBJECTIVE = { prompt: { en: 'Choose the height to drop the coconut from so it makes a dent of exactly the target depth. Use mgh = force x depth.' } };

  constructor(container, config) {
    super(container, config);
    this.roundNo = 0;
    this.height = 1;
    this.dropped = false;
    this.roundWon = false;
    this.allWon = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      check: false,
      css: CSS,
      html: `<div class="gm dd" data-done="0">
        <div class="gm-head"><p class="kicker">Potential energy</p><h2>Make a dent of exactly the <b>target</b> depth</h2>
          <p class="sub">mgh = F x depth, g = 10 m/s<sup>2</sup>. Wet sand pushes back with a steady force F (made up, for example).</p></div>
        <div class="play">
          <div class="stage">${boardSvg()}</div>
          <div class="side">
            <div class="given"><span class="chip m"></span><span class="chip f"></span><span class="chip t"></span><span class="dots">${ROUNDS.map(() => '<span class="dot"></span>').join('')}</span></div>
            <div class="step">
              <button type="button" class="tap btn hminus" aria-label="One metre lower">&minus;</button>
              <span class="val hval" aria-live="polite"></span>
              <button type="button" class="tap btn hplus" aria-label="One metre higher">+</button>
            </div>
            <button type="button" class="tap btn go drop">Drop</button>
            <div class="acts"><button type="button" class="tap btn again">Try again</button><button type="button" class="tap btn next">Next coconut</button></div>
            <p class="say" aria-live="polite"></p>
          </div>
        </div>
      </div>`,
    });
    const q = (s) => this.root.querySelector(s);
    if (!q('.drop')) return;
    // shade mixes go toward a dark ink in both themes (the label token is light in dark)
    q('.gm').dataset.th = globalThis.document?.documentElement?.dataset?.theme === 'light' ? 'light' : 'dark';
    onTap(q('.hminus'), () => this.nudge(-1));
    onTap(q('.hplus'), () => this.nudge(1));
    onTap(q('.drop'), () => this.drop());
    onTap(q('.again'), () => this.back());
    onTap(q('.next'), () => this.nextRound());
    this.deal();
    this.quill?.speak('Pick a height, then drop.', 5000);
  }

  get round() { return ROUNDS[this.roundNo]; }

  deal() {
    const q = (s) => this.root.querySelector(s);
    const r = this.round;
    this.height = 1;
    this.roundWon = false;
    q('.chip.m').textContent = `m = ${fmt(r.m)} kg`;
    q('.chip.f').textContent = `F = ${r.f} N`;
    q('.chip.t').textContent = `target ${r.cm} cm`;
    q('.target').setAttribute('transform', `translate(0 ${IN_TOP + IN_SAND + r.cm * PX_CM})`);
    this.root.querySelectorAll('.dot').forEach((d, i) => { d.dataset.on = i < this.roundNo ? '1' : '0'; });
    this.back();
  }

  nudge(d) {
    if (this.dropped) return;
    this.height = Math.min(H_MAX, Math.max(1, this.height + d));
    this.paint();
  }

  drop() {
    if (this.dropped) return;
    this.dropped = true;
    const r = this.round, cm = depthCm(r, this.height), u = r.m * G * this.height;
    const say = this.root.querySelector('.say');
    this.root.querySelector('.dd').dataset.done = '1';
    const sum = `mgh = ${fmt(r.m)} x 10 x ${this.height} = ${fmt(u)} J; ${fmt(u)} J / ${r.f} N = ${fmt(cm)} cm`;
    if (Math.abs(cm - r.cm) < 1e-9) {
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
      say.textContent = `${sum}: ${fmt(Math.round(Math.abs(cm - r.cm) * 10) / 10)} cm too ${cm > r.cm ? 'deep' : 'shallow'}.`;
      this.root.querySelector('.again').dataset.on = '1';
    }
    this.paint();
  }

  back() {
    const q = (s) => this.root.querySelector(s);
    this.dropped = false;
    q('.dd').dataset.done = '0';
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

  pill(sel, text) {
    const g = this.root.querySelector(sel);
    const tx = g.querySelector('text');
    tx.textContent = text;
    const m = tx.getComputedTextLength?.() || 0;
    const w = Math.round((m > 0 ? m : text.length * 16.6) + 26);
    g.querySelector('rect').setAttribute('width', String(w));
    return w;
  }

  paint() {
    const q = (s) => this.root.querySelector(s);
    const r = this.round, h = this.height;
    const cm = this.dropped ? depthCm(r, h) : 0;
    q('.hval').textContent = `h = ${h} m`;
    const lift = h * PXM;
    q('.nut').style.transform = `translateY(${this.dropped ? 0 : -lift}px)`;
    q('.ghost').setAttribute('transform', `translate(0 ${yOf(h)})`);
    q('.ghost').style.opacity = this.dropped ? '0' : '1';
    // the mg pill sits left of the coconut (the palm is on its right)
    const mw = this.pill('.mgpill', `mg = ${fmt(r.m * G)} N`);
    q('.mgpill rect').setAttribute('x', String(NUT_X - 18 - mw));
    q('.mgpill text').setAttribute('x', String(NUT_X - 5 - mw));
    q('.mgpill').setAttribute('transform', `translate(0 ${h <= 2 ? -74 : -66})`);
    q('.early').style.opacity = this.dropped ? '0' : '1';
    // h arrow: from the sand to the drop height, its pill on its side beside it
    const top = yOf(h);
    q('.hline').setAttribute('y2', String(top + 18));
    q('.hhead').setAttribute('d', `M${HX} ${top} l-11 20 h22 z`);
    this.pill('.hpill', `h = ${h} m`);
    // upright, beside the h arrow at its middle (never along it), kept below the ghost line
    q('.hpill').setAttribute('transform', `translate(${HX + 14} ${Math.max(SY - lift / 2, top + 23)})`);
    this.drawWatcher();
    // the close-up: the coconut sinks to the depth; F pushes up from under the dent
    q('.sink').style.transform = `translateY(${cm * PX_CM}px)`;
    q('.pit').setAttribute('height', String(cm * PX_CM));
    q('.dent0').style.opacity = this.dropped ? '1' : '0';
    const bottom = IN_TOP + IN_SAND + cm * PX_CM;
    q('.farrow').setAttribute('y1', String(bottom + 76));
    q('.farrow').setAttribute('y2', String(bottom + 24));
    q('.fhead').setAttribute('d', `M${IN_CX} ${bottom + 4} l-12 22 h24 z`);
    this.pill('.fpill', 'F');
    q('.fpill rect').setAttribute('y', String(bottom + 34));
    q('.fpill text').setAttribute('y', String(bottom + 62));
    q('.fpill rect').setAttribute('x', String(IN_CX + 16));
    q('.fpill text').setAttribute('x', String(IN_CX + 28));
    this.root.querySelectorAll('.late').forEach((e) => { e.style.opacity = this.dropped ? '1' : '0'; });
    q('.hminus').disabled = this.dropped || h <= 1;
    q('.hplus').disabled = this.dropped || h >= H_MAX;
    q('.drop').disabled = this.dropped;
  }

  // The watcher: standing on the sand beyond the palm, facing the coconut, pointing at it.
  drawWatcher() {
    const cv = this.root.querySelector('canvas.fig');
    if (!cv) return;
    this.colors = this.colors || loadColors(this.root);
    const ctx = cv.getContext('2d');
    ctx.setTransform(DPR, 0, 0, DPR, -FO.x * DPR, -FO.y * DPR);
    ctx.clearRect(FO.x, FO.y, FO.w, FO.h);
    const spec = figureFor(this, { role: 'student', x: FO.x + 30, y: SY, height: 1.6 * PXM, facing: -1, i: 5, pose: 'point' });
    drawFigure(ctx, this.colors, spec, spec.look);
  }

  refreshTheme() { if (this.root?.querySelector('canvas.fig')) { this.colors = loadColors(this.root); this.drawWatcher(); } }

  resetChallenge() {
    super.resetChallenge?.();
    this.roundNo = 0;
    this.allWon = false;
    if (this.root?.querySelector('.drop')) this.deal();
  }

  checkObjective() { return this.allWon ? { ok: true } : null; }
}
