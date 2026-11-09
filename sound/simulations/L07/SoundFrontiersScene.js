/**
 * SoundFrontiersScene - blk-l07-s08, "Sound Explores". Rebuilt 2026-11-03 as a one-screen DOM
 * board: two big picture cards per beat, side by side in both orientations; a tap lights a card
 * and opens its one-line caption under the pair. Until the first tap the pair takes turns, so the
 * board at rest already shows what a tap does.
 *   beat 0: a rover on red Mars ground, a small microphone on its mast taking in faint arcs;
 *           an ocean cross-section, a quake on the sea floor sending a wave to a listening
 *           station, a thermometer in the water.
 *   beat 1: a mosquito whose buzz arcs reach a phone recording it; a soil cross-section (layers,
 *           roots, a probe microphone) with tiny crackle marks round the microbes.
 * Drawings are inline SVG in the Quill look: base, shade side and light side from the kit's tone
 * ladder (ladderCss), outlines in the dark rung, colours from tokens only. Sound uses the SimWave
 * arc look (wide round stroke, thin light inner edge); the kit has no SVG drawSoundArcs, so
 * arcsSvg below is the DOM stand-in. No faces, no agency marks.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { burst, SIM_LOOK_DOM_CSS } from 'simulations/base/kit/SimLookDom.js';
import { ladderCss } from 'simulations/base/kit/SimIsoSvg.js';

const MAP = [0, 1].map((i) => [{ idx: i, dwellMs: null }]);

const TONES = {
  mars: 'color-mix(in srgb, var(--sim-series-6) 55%, var(--sim-series-8))',
  dust: 'color-mix(in srgb, var(--sim-series-8) 28%, white)',
  rock: 'color-mix(in srgb, var(--sim-series-8) 50%, black)',
  probe: 'color-mix(in srgb, white 86%, black)',
  metal: 'color-mix(in srgb, var(--sim-series-1) 14%, color-mix(in srgb, white 64%, black))',
  dark: 'color-mix(in srgb, white 28%, black)',
  panel: 'color-mix(in srgb, var(--sim-series-1) 55%, black)',
  sea: 'var(--sim-series-1)',
  glow: 'var(--sim-series-2)',
  float: 'var(--sim-series-8)',
  therm: 'var(--sim-series-6)',
  paper: 'color-mix(in srgb, white 95%, black)',
  bug: 'color-mix(in srgb, var(--sim-series-2) 18%, color-mix(in srgb, white 32%, black))',
  wing: 'color-mix(in srgb, var(--sim-series-1) 12%, white)',
  phone: 'color-mix(in srgb, white 24%, black)',
  screen: 'color-mix(in srgb, var(--sim-series-1) 30%, black)',
  soil: 'color-mix(in srgb, var(--sim-series-2) 42%, black)',
  subsoil: 'color-mix(in srgb, var(--sim-series-2) 60%, color-mix(in srgb, white 45%, black))',
  root: 'color-mix(in srgb, var(--sim-series-2) 35%, white)',
  grass: 'var(--sim-series-3)',
  microbe: 'var(--sim-series-4)',
};

function toneCss(sel) {
  let s = '';
  for (const [k, base] of Object.entries(TONES)) {
    const [d, sh, , l] = ladderCss(base);
    s += `${sel} .${k}{fill:${base};stroke:${d};stroke-width:1.4}`
      + `${sel} .${k}-s{fill:${sh};stroke:none}${sel} .${k}-d{fill:${d};stroke:none}`
      + `${sel} .${k}-l{fill:${l};stroke:none}`
      + `${sel} .${k}-ln{fill:none;stroke:${d};stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}`;
  }
  return s;
}

/** Sound arcs in the SimWave look, pulsing outward in turn (rev: arriving, inward). */
function arcsSvg(x, y, dir, { n = 3, wl = 12, r0 = 8, spread = 0.9, rev = false, faint = false } = {}) {
  const half = spread / 2;
  let g = '';
  for (let i = 0; i < n; i++) {
    const r = r0 + i * wl, ri = r - 1.3;
    const p = (a, rr) => `${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`;
    const j = rev ? n - 1 - i : i;
    g += `<g class="arc${faint ? ' arc--faint' : ''}" style="--j:${j}">`
      + `<path d="M${p(dir - half, r)} A${r} ${r} 0 0 1 ${p(dir + half, r)}"/>`
      + `<path class="arc-hi" d="M${p(dir - half * 0.85, ri)} A${ri} ${ri} 0 0 1 ${p(dir - half * 0.1, ri)}"/></g>`;
  }
  return g;
}

/** A small crackle mark: four short ticks round a point. */
const crackle = (x, y, k) => `<g class="crk" style="--k:${k}"><path class="glow-ln" d="M${x - 6} ${y} h3 M${x + 3} ${y} h3 M${x} ${y - 6} v3 M${x} ${y + 3} v3"/></g>`;

const wheel = (x, y) => `<circle class="dark" cx="${x}" cy="${y}" r="13"/><circle class="dark-l" cx="${x - 3}" cy="${y - 3}" r="5"/><circle class="metal" cx="${x}" cy="${y}" r="4"/>`;

/** The four pictures, viewBox 0 0 300 190. */
const ART = {
  mars: () => `
    <path class="dust" style="stroke:none" d="M0 0 H300 V124 H0Z"/>
    <path class="dust-l" d="M0 70 H300 V112 H0Z" opacity=".7"/>
    <path class="mars-s" d="M0 112 C40 94 80 104 120 98 C170 88 220 104 300 92 V130 H0Z"/>
    <path class="mars" d="M0 122 C60 114 140 126 300 116 V190 H0Z"/>
    <path class="mars-l" d="M18 140 C60 134 90 138 120 136 M200 172 C230 168 260 170 290 166" style="fill:none;stroke:${ladderCss(TONES.mars)[3]};stroke-width:3;stroke-linecap:round"/>
    <path class="mars-s" d="M0 176 C80 168 200 182 300 172 V190 H0Z"/>
    <path class="rock" d="M38 158 L48 148 L62 150 L68 160Z"/><path class="rock-s" d="M56 150 L62 150 L68 160 L58 160Z"/>
    <path class="rock" d="M258 146 L266 140 L276 144 L278 150 L256 150Z"/>
    ${arcsSvg(214, 80, Math.PI, { n: 3, wl: 15, r0: 14, rev: true, faint: true })}
    <path class="dust-ln" style="stroke-width:2.4" d="M20 64 h46 M34 82 h40 M14 100 h34"/>
    <path class="metal-ln" style="stroke-width:3" d="M140 152 L160 134 L180 152 M180 152 L200 134 L222 152"/>
    ${wheel(140, 152)}${wheel(180, 152)}${wheel(222, 152)}
    <path class="probe" d="M128 112 H236 V136 H128Z"/><path class="probe-s" d="M128 130 H236 V136 H128Z"/>
    <path class="probe-s" d="M222 112 H236 V136 H222Z"/>
    <path class="panel" d="M122 104 H242 L236 112 H128Z"/><path class="panel-l" d="M130 105 H236 L235 106.5 H131Z"/>
    <rect class="metal" x="211" y="62" width="6" height="44" rx="2"/>
    <rect class="probe" x="198" y="48" width="34" height="16" rx="3"/><path class="probe-s" d="M198 58 H232 V61 Q232 64 229 64 H201 Q198 64 198 61Z"/>
    <path class="dark-ln" d="M204 54 H218"/>
    <rect class="dark" x="205" y="74" width="7" height="12" rx="3.5"/><path class="dark-l" d="M206.5 76 h2 v8 h-2Z"/>`,
  ocean: () => `
    <path class="sea" d="M0 26 H300 V190 H0Z"/>
    <path class="sea-s" d="M0 108 C80 102 200 114 300 106 V190 H0Z"/>
    <path class="sea-l" d="M0 26 Q12 22 24 26 T48 26 T72 26 T96 26 T120 26 T144 26 T168 26 T192 26 T216 26 T240 26 T264 26 T288 26 T312 26 V31 H0Z"/>
    <path class="rock" d="M0 168 L30 162 L42 172 L52 160 L90 166 C150 172 220 160 300 168 V190 H0Z"/>
    <path class="rock-s" d="M0 180 C80 176 200 186 300 178 V190 H0Z"/>
    <path class="glow quake" d="M46 166 L50 156 L53 165 L62 160 L56 168 L64 174 L53 172 L48 182 L46 172 L36 174 L43 168 L36 160Z"/>
    <path class="lane" d="M54 160 C90 132 170 124 244 123"/>
    <g class="travel">${arcsSvg(46, 132, -0.12, { n: 3, wl: 16, r0: 18, spread: 1.1 })}</g>
    <path class="metal-ln" d="M252 166 V76"/>
    <rect class="dark" x="244" y="164" width="16" height="7" rx="2"/>
    <circle class="float" cx="252" cy="70" r="9"/><path class="float-l" d="M246 66 A7 7 0 0 1 254 62 L254 64 A5 5 0 0 0 248 67Z"/>
    <rect class="metal" x="245" y="112" width="14" height="22" rx="6"/><path class="metal-l" d="M248 115 h3 v16 h-3Z"/>
    <rect class="paper" x="140" y="40" width="14" height="56" rx="7"/>
    <rect class="therm-d" x="144.5" y="60" width="5" height="34" rx="2.5"/>
    <circle class="therm" cx="147" cy="102" r="10"/><circle class="therm-l" cx="144" cy="99" r="3"/>
    <path class="dark-ln" style="stroke-width:1.4" d="M156 52 h5 M156 62 h5 M156 72 h5 M156 82 h5"/>`,
  mosquito: () => {
    let bars = '';
    const hs = [6, 14, 22, 12, 26, 18, 8, 20, 28, 14, 10, 24, 16, 8];
    hs.forEach((h, i) => { bars += `<rect class="bar" style="--k:${i % 4}" x="${228 + i * 3}" y="${92 - h / 2}" width="1.8" height="${h}" rx=".9"/>`; });
    return `
    ${arcsSvg(116, 76, -0.15, { n: 3, wl: 18, r0: 22, spread: 0.8 })}
    <path class="bug-ln" style="stroke-width:1.6" d="M84 94 L70 118 L62 160 M90 96 L88 124 L96 164 M98 96 L112 120 L128 160 M86 92 L60 110 L40 150 M100 94 L130 112 L156 150 M94 96 L104 128 L112 168"/>
    <g class="wings">
      <ellipse class="wing" cx="104" cy="66" rx="30" ry="9" transform="rotate(-28 104 66)" opacity=".85"/>
      <ellipse class="wing" cx="112" cy="74" rx="26" ry="8" transform="rotate(-12 112 74)" opacity=".85"/>
      <path class="wing-ln" d="M84 78 L122 56 M88 82 L134 72"/>
    </g>
    <ellipse class="bug" cx="130" cy="104" rx="32" ry="7.5" transform="rotate(20 130 104)"/>
    <path class="bug-l" d="M112 94 l3 -3 l2 8 l-3 2Z M124 98 l3 -2 l2 8 l-3 2Z M136 103 l3 -2 l2 8 l-3 2Z M148 108 l3 -1 l1 7 l-3 1Z"/>
    <path class="bug-s" d="M104 100 C120 108 140 116 158 118 C150 120 130 116 106 104Z"/>
    <ellipse class="bug" cx="92" cy="88" rx="14" ry="11"/><ellipse class="bug-l" cx="88" cy="83" rx="6" ry="3"/>
    <circle class="bug" cx="73" cy="83" r="7"/>
    <path class="bug-ln" style="stroke-width:1.8" d="M67 86 L36 104"/>
    <path class="bug-ln" style="stroke-width:1.2" d="M70 78 L58 64 M72 77 L64 62 M62 70 l-3 -2 M60 66 l-3 -1 M66 68 l2 -3"/>
    <rect class="phone" x="214" y="36" width="64" height="116" rx="10"/>
    <path class="phone-l" d="M218 42 h2 v100 h-2Z"/>
    <rect class="screen" x="220" y="48" width="52" height="88" rx="4" style="stroke:none"/>
    <path class="screen-l" d="M222 50 h48 v6 h-48Z" opacity=".5"/>
    ${bars}
    <circle class="dark-l" cx="246" cy="144" r="2.5"/>`;
  },
  soil: () => `
    <path class="soil" d="M0 54 C60 50 140 58 300 52 V190 H0Z"/>
    <path class="subsoil" d="M0 116 C80 110 180 124 300 112 V190 H0Z"/>
    <path class="soil-s" d="M0 100 C80 96 180 106 300 98 V116 C180 124 80 110 0 116Z" opacity=".55"/>
    <path class="rock" d="M0 168 C60 162 140 174 300 164 V190 H0Z"/>
    <ellipse class="rock" cx="40" cy="138" rx="9" ry="6"/><ellipse class="rock" cx="270" cy="134" rx="11" ry="6"/>
    <ellipse class="rock" cx="120" cy="150" rx="7" ry="4.5"/>
    <path class="root-ln" style="stroke-width:3" d="M80 56 C78 74 82 86 74 104 M74 104 C70 114 60 120 54 132 M80 70 C90 82 100 88 104 104 M76 88 C66 92 56 92 46 100 M104 104 C106 114 112 120 110 132"/>
    <path class="grass" d="M0 50 C60 46 140 54 300 48 V56 C140 62 60 54 0 58Z"/>
    <path class="grass-l" d="M0 50 C60 46 140 54 300 48 V51 C140 57 60 49 0 53Z"/>
    <path class="grass-ln" style="stroke-width:3" d="M80 52 C80 38 82 28 84 16"/>
    <path class="grass" d="M82 36 C66 30 58 34 52 40 C64 44 74 42 82 38Z"/><path class="grass" d="M84 26 C98 16 108 18 114 22 C104 30 94 30 84 28Z"/>
    <path class="grass-l" d="M80 36 C70 33 62 35 56 39 C64 37 72 36 80 37Z"/>
    <path class="dark-ln" d="M204 22 C204 10 222 8 236 18"/>
    <rect class="dark" x="232" y="18" width="40" height="26" rx="5"/><rect class="screen" x="237" y="23" width="30" height="12" rx="2" style="stroke:none"/>
    <rect class="metal" x="199" y="20" width="10" height="94" rx="3"/><path class="metal-l" d="M201 22 h3 v90 h-3Z"/>
    <rect class="dark" x="196" y="110" width="16" height="22" rx="6"/>
    <path class="dark-l" d="M199 116 h10 M199 121 h10 M199 126 h10" style="fill:none;stroke:${ladderCss(TONES.dark)[3]};stroke-width:1.4"/>
    ${arcsSvg(204, 122, Math.PI, { n: 2, wl: 9, r0: 14, rev: true, spread: 1.0 })}
    ${arcsSvg(204, 122, 0, { n: 2, wl: 9, r0: 14, rev: true, spread: 1.0 })}
    ${[[160, 118], [168, 132], [176, 112], [244, 124], [236, 138], [252, 112], [164, 146], [248, 150]]
    .map(([x, y]) => `<ellipse class="microbe" cx="${x}" cy="${y}" rx="3" ry="1.8" style="stroke-width:.8"/>`).join('')}
    ${crackle(170, 102, 0)}${crackle(152, 132, 1)}${crackle(258, 130, 2)}${crackle(240, 104, 3)}${crackle(230, 152, 1)}`,
};

const BEATS = [
  [{ k: 'mars', cap: 'a microphone on Mars' }, { k: 'ocean', cap: 'quake sound timed across the ocean' }],
  [{ k: 'mosquito', cap: 'the buzz tells which mosquito' }, { k: 'soil', cap: 'microbe crackles in the soil' }],
];
const KEYS = BEATS.flat().map((c) => c.k);
const STEP = 3; // seconds each card stays lit in the at-rest turn-taking

const CSS = `
.sf { display: flex; flex-direction: column; gap: 10px; }
.sf-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.sf-card { position: relative; display: block; padding: 6px; margin: 0; min-height: 44px;
  border: var(--sim-border); border-color: var(--sim-track); border-radius: var(--sim-radius-lg);
  background: var(--sim-bg-surface); box-shadow: 0 var(--sim-lift) 0 var(--sim-track); font: inherit; cursor: pointer;
  transition: transform .25s; }
.sf-card::after { content: ''; position: absolute; inset: -3px; border: 3px solid var(--sim-accent);
  border-radius: calc(var(--sim-radius-lg) + 2px); opacity: 0; pointer-events: none; }
.sf-pic { display: block; width: 100%; height: auto; border-radius: var(--sim-radius-md); background: var(--sim-bg-cell);
  stroke-linejoin: round; }
.sf-say { display: grid; justify-items: center; }
.sf-cap { grid-area: 1 / 1; font-size: var(--sim-text-xl); font-weight: 800; line-height: 1.2; text-align: center;
  color: var(--sim-label); opacity: 0; }
${KEYS.map((k) => `.sf[data-lit="${k}"] .sf-card[data-k="${k}"]::after, .sf[data-lit="${k}"] .sf-cap[data-k="${k}"]{opacity:1}`
  + `.sf[data-lit="${k}"] .sf-card[data-k="${k}"]{transform:translateY(-2px)}`).join('')}
@keyframes sf-turn { 0%, 46% { opacity: 1 } 50%, 100% { opacity: 0 } }
.sf:not([data-lit]) .sf-card::after, .sf:not([data-lit]) .sf-cap {
  animation: sf-turn ${STEP * 2}s linear infinite; animation-delay: calc(var(--i) * ${STEP}s); }
.sf-pic .arc path { fill: none; stroke-linecap: round; }
.sf-pic .arc path:first-child { stroke: var(--sim-series-1); stroke-width: 4; }
.sf-pic .arc .arc-hi { stroke: color-mix(in srgb, white 70%, transparent); stroke-width: 1.2; }
.sf-pic .arc { opacity: .2; animation: sf-arc 1.5s linear infinite; animation-delay: calc(var(--j) * 0.5s); }
.sf-pic .arc--faint { --hi: .6; }
@keyframes sf-arc { 0% { opacity: .2 } 18% { opacity: var(--hi, 1) } 45%, 100% { opacity: .2 } }
.sf-pic .lane { fill: none; stroke: color-mix(in srgb, white 60%, transparent); stroke-width: 2; stroke-dasharray: 2 7; stroke-linecap: round; }
.sf-pic .travel { animation: sf-travel 3.2s linear infinite; }
.sf-pic .travel .arc { animation-name: sf-arc-hot; }
.sf-pic .travel .arc path:first-child { stroke: var(--sim-series-2); stroke-width: 6.5; }
.sf-pic .travel .arc .arc-hi { stroke-width: 2; }
@keyframes sf-arc-hot { 0% { opacity: .7 } 18% { opacity: 1 } 45%, 100% { opacity: .7 } }
.sf-pic .lane { stroke: color-mix(in srgb, var(--sim-series-2) 70%, white); stroke-width: 3.5; stroke-dasharray: 3 8; }
@keyframes sf-travel { 0% { transform: translateX(0); opacity: 0 } 10% { opacity: 1 } 85% { opacity: 1 }
  100% { transform: translateX(176px); opacity: 0 } }
.sf-pic .quake { animation: sf-quake 3.2s ease-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes sf-quake { 0% { transform: scale(1.25) } 20%, 100% { transform: scale(1) } }
.sf-pic .wings { animation: sf-wing .12s linear infinite alternate; transform-box: fill-box; transform-origin: 0% 100%; }
@keyframes sf-wing { from { transform: rotate(0deg) } to { transform: rotate(-6deg) } }
.sf-pic .bar { fill: var(--sim-series-2); animation: sf-bar .6s ease-in-out infinite alternate;
  animation-delay: calc(var(--k) * -0.15s); transform-box: fill-box; transform-origin: center; }
@keyframes sf-bar { from { transform: scaleY(.55) } to { transform: scaleY(1) } }
.sf-pic .crk { opacity: 0; animation: sf-crk 1.6s steps(1) infinite; animation-delay: calc(var(--k) * 0.4s); }
@keyframes sf-crk { 0%, 22% { opacity: 1 } 25%, 100% { opacity: 0 } }
${toneCss('.sf-pic')}
.sim-dom-root--portrait .sf-cards { gap: 10px; }
.sim-dom-root--portrait .sf-card { padding: 4px; }
@media (prefers-reduced-motion: reduce) {
  .sf-pic * { animation: none !important; }
  .sf-pic .crk { opacity: 1; }
  .sf:not([data-lit]) [data-first]::after, .sf:not([data-lit]) .sf-cap[data-first] { animation: none !important; opacity: 1; }
}
`;

function boardHtml(step) {
  const cards = BEATS[step];
  return `<div class="sf-cards">${cards.map((c, i) => `<button type="button" class="sf-card" data-k="${c.k}" style="--i:${i}"`
    + `${i === 0 ? ' data-first="1"' : ''} aria-pressed="false" aria-label="${esc(c.cap)}">`
    + `<svg class="sf-pic" viewBox="0 0 300 190" aria-hidden="true" focusable="false">${ART[c.k]()}</svg></button>`).join('')}</div>`
    + `<div class="sf-say" aria-live="polite">${cards.map((c, i) => `<span class="sf-cap" data-k="${c.k}" style="--i:${i}"`
    + `${i === 0 ? ' data-first="1"' : ''}>${esc(c.cap)}</span>`).join('')}</div>`;
}

export class SoundFrontiersScene extends DomSimulation {
  static BEAT_STEP_MAP = MAP;
  static WIDTH = 680;
  static HEIGHT = 300;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 212;
  static LAYOUT = 'fit';
  static ARIA_LABEL = 'Two picture cards per step: a rover with a microphone on Mars and an ocean where a sea-floor '
    + 'quake sends sound to a listening station, then a mosquito whose buzz a phone records and soil where a probe '
    + 'microphone hears microbes crackle. Tap a card to light it and read its caption.';
  static CONTROLS = [];

  _lit = null;
  _seen = new Set();
  _wonPair = false;

  async setup() {
    await super.setup();
    this.render({ css: SIM_LOOK_DOM_CSS + CSS, rootClass: 'sf' });
    this._onClick = (ev) => {
      const el = ev.target?.closest?.('.sf-card');
      if (!el || !this.root.contains(el)) return;
      this._onTap(el.dataset.k, el);
    };
    this.root.addEventListener('click', this._onClick);
    this.enter(this.stepIndex | 0);
  }

  destroy() {
    if (this._onClick) this.root?.removeEventListener('click', this._onClick);
    this._onClick = null;
    super.destroy();
  }

  onStep(step) { this.enter(step | 0); }

  /** The beat alone sets the board: its two cards, none tapped yet. */
  enter(step) {
    const s = Math.max(0, Math.min(1, step | 0));
    this._lit = null;
    this._seen = new Set();
    this._wonPair = false;
    if (!this.root) return;
    delete this.root.dataset.lit;
    this.render({ html: boardHtml(s) });
  }

  _onTap(k, el) {
    const s = Math.max(0, Math.min(1, this.stepIndex | 0));
    const cards = BEATS[s];
    if (!cards.some((c) => c.k === k)) return;
    this._lit = k;
    this.root.dataset.lit = k;
    for (const b of this.root.querySelectorAll?.('.sf-card') ?? []) b.setAttribute('aria-pressed', String(b.dataset.k === k));
    this._seen.add(k);
    // The find: both frontiers of this step looked at, once per beat.
    if (!this._wonPair && this._seen.size === cards.length) {
      this._wonPair = true;
      burst(this.root, undefined, el);
    }
  }
}
