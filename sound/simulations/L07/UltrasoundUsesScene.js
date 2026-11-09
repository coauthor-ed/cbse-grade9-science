/**
 * UltrasoundUsesScene - blk-l07-s05, "Uses Below and Above". Rebuilt 2026-11-03 as a one-screen
 * DOM board: two sides, infrasonic (below 20 Hz) and ultrasonic (above 20 kHz), each a row of
 * picture tiles. The beat lights one side and dims the other; a tap on a lit tile lights it and
 * opens its short caption. Until the first tap the lit side cycles one tile at a time, so the
 * board at rest already shows what a tap does.
 *   beat 0: infrasonic lit - earthquake (crack + seismograph trace), volcano, storm cloud.
 *   beat 1: ultrasonic lit - probe on a body, kidney stone breaking, part in a cleaning bath,
 *           probe over a metal block with a hidden crack, ship sonar with its echo.
 * Every drawing is inline SVG in the Quill look: base, shade side and light side from the kit's
 * tone ladder (ladderCss), outlines in the dark rung, colours from tokens only.
 * Sound leaving a source uses the SimWave arc look (wide round stroke, thin light inner edge,
 * 0.9 rad spread); the kit has no SVG drawSoundArcs, so arcsSvg below is the DOM stand-in and the
 * arcs pulse outward in turn rather than growing.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { burst, SIM_LOOK_DOM_CSS } from 'simulations/base/kit/SimLookDom.js';
import { ladderCss } from 'simulations/base/kit/SimIsoSvg.js';

const MAP = [0, 1].map((i) => [{ idx: i, dwellMs: null }]);

/** Tone bases (tokens only); each gets base / -s shade / -d dark / -l light classes. */
const TONES = {
  rock: 'color-mix(in srgb, var(--sim-series-8) 50%, black)',
  grass: 'var(--sim-series-3)',
  lava: 'var(--sim-series-6)',
  glow: 'var(--sim-series-2)',
  ash: 'color-mix(in srgb, white 55%, black)',
  cloud: 'color-mix(in srgb, var(--sim-series-5) 22%, color-mix(in srgb, white 48%, black))',
  rain: 'var(--sim-series-1)',
  skin: 'color-mix(in srgb, var(--sim-series-8) 36%, white)',
  organ: 'color-mix(in srgb, var(--sim-series-6) 65%, var(--sim-series-4))',
  probe: 'color-mix(in srgb, white 84%, black)',
  dark: 'color-mix(in srgb, white 28%, black)',
  metal: 'color-mix(in srgb, var(--sim-series-1) 14%, color-mix(in srgb, white 64%, black))',
  water: 'var(--sim-series-7)',
  sea: 'var(--sim-series-1)',
  stone: 'var(--sim-series-2)',
  hull: 'color-mix(in srgb, var(--sim-series-6) 60%, black)',
  fish: 'color-mix(in srgb, var(--sim-series-1) 35%, black)',
  paper: 'color-mix(in srgb, white 95%, black)',
};

function toneCss(sel) {
  let s = '';
  for (const [k, base] of Object.entries(TONES)) {
    const [d, sh, , l] = ladderCss(base);
    s += `${sel} .${k}{fill:${base};stroke:${d};stroke-width:1.3}`
      + `${sel} .${k}-s{fill:${sh};stroke:none}${sel} .${k}-d{fill:${d};stroke:none}`
      + `${sel} .${k}-l{fill:${l};stroke:none}`
      + `${sel} .${k}-ln{fill:none;stroke:${d};stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}`;
  }
  return s;
}

/**
 * Sound arcs in the SimWave look: n arcs of radius r0 + i*wl about (x, y), centred on dir,
 * pulsing outward in turn (rev: inward, for a wave arriving). tone 1 = sound, 2 = echo.
 */
function arcsSvg(x, y, dir, { n = 3, wl = 12, r0 = 8, spread = 0.9, rev = false, tone = 1 } = {}) {
  const half = spread / 2;
  let g = '';
  for (let i = 0; i < n; i++) {
    const r = r0 + i * wl;
    const a1 = dir - half, a2 = dir + half;
    const p = (a) => `${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`;
    const ri = r - 1.1;
    const q = (a) => `${(x + ri * Math.cos(a)).toFixed(1)} ${(y + ri * Math.sin(a)).toFixed(1)}`;
    const j = rev ? n - 1 - i : i;
    g += `<g class="arc arc-${tone}" style="--j:${j}">`
      + `<path d="M${p(a1)} A${r} ${r} 0 0 1 ${p(a2)}"/>`
      + `<path class="arc-hi" d="M${q(dir - half * 0.85)} A${ri} ${ri} 0 0 1 ${q(dir - half * 0.1)}"/></g>`;
  }
  return g;
}

/** A gear outline: teeth around (cx, cy). */
function gearD(cx, cy, ro, ri, teeth) {
  let d = '';
  const step = (Math.PI * 2) / teeth;
  for (let k = 0; k < teeth; k++) {
    const a = k * step;
    const pts = [[ri, a], [ro, a + step * 0.18], [ro, a + step * 0.5], [ri, a + step * 0.68]];
    for (const [r, t] of pts) d += `${d ? 'L' : 'M'}${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`;
  }
  return d + 'Z';
}

const fish = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">`
  + '<path class="fish" d="M-9 0 C-5 -5 5 -5 8 0 C5 5 -5 5 -9 0Z"/>'
  + '<path class="fish" d="M7 0 L13 -4 L12 0 L13 4Z"/><path class="fish-l" d="M-6 -1.5 C-2 -4 3 -3.6 5 -1.6Z"/></g>';

const DEG = Math.PI / 180;

/** The eight pictures, viewBox 0 0 160 110. */
const ART = {
  quake: () => `
    <path class="rock" d="M0 58 H160 V110 H0Z"/>
    <path class="rock-l" d="M0 70 C30 67 60 74 100 70 C125 68 145 72 160 70 V73 C145 75 125 71 100 73 C60 77 30 70 0 73Z"/>
    <path class="rock-s" d="M0 86 C40 82 70 92 110 86 C130 83 150 88 160 86 V110 H0Z"/>
    ${arcsSvg(54, 106, -Math.PI / 2, { n: 3, wl: 11, r0: 8, spread: 1.3 })}
    <path class="grass" d="M0 53 H160 V59 H0Z"/><path class="grass-l" d="M0 53 H160 V55 H0Z"/>
    <path class="rock-d" d="M48 53 L60 53 L55 63 L61 72 L54 82 L58 92 L55 93 L50 82 L56 72 L49 63Z"/>
    <path class="metal" d="M94 45 H154 V53 H94Z"/><path class="metal-s" d="M94 50 H154 V53 H94Z"/>
    <rect class="paper" x="104" y="24" width="40" height="21" rx="3"/>
    <path class="paper-s" d="M104 39 H144 V42 Q144 45 141 45 H107 Q104 45 104 42Z"/>
    <rect class="metal" x="99" y="22" width="6" height="25" rx="2"/><rect class="metal" x="143" y="22" width="6" height="25" rx="2"/>
    <path class="metal-l" d="M100 24 h2 v20 h-2Z"/>
    <path class="trace-ln" d="M106 34 H111 L113 33 L115 36 L118 26 L121 42 L124 28 L127 39 L130 31 L133 36 L136 34 H142"/>
    <rect class="metal" x="150" y="8" width="4" height="38" rx="1.5"/>
    <path class="metal-ln" d="M152 10 L126 31"/>
    <circle class="dark" cx="126" cy="31" r="2"/>`,
  volcano: () => `
    <g class="plume">
      <circle class="ash" cx="70" cy="24" r="10"/><circle class="ash" cx="86" cy="16" r="13"/>
      <circle class="ash" cx="102" cy="24" r="9"/><circle class="ash" cx="78" cy="8" r="8"/><circle class="ash" cx="96" cy="6" r="7"/>
      <circle class="ash" cx="70" cy="24" r="9" style="stroke:none"/><circle class="ash" cx="86" cy="16" r="12" style="stroke:none"/>
      <circle class="ash" cx="102" cy="24" r="8" style="stroke:none"/><circle class="ash" cx="78" cy="8" r="7" style="stroke:none"/>
      <circle class="ash" cx="96" cy="6" r="6" style="stroke:none"/>
      <path class="ash-s" d="M62 28 Q80 36 110 27 Q104 34 86 34 Q70 34 62 28Z"/>
      <ellipse class="ash-l" cx="82" cy="9" rx="6" ry="2.5"/><ellipse class="ash-l" cx="66" cy="20" rx="4" ry="2"/>
    </g>
    <path class="rock" d="M6 104 L58 36 Q80 31 102 36 L154 104Z"/>
    <path class="rock-s" d="M86 34 Q95 34 102 36 L154 104 L100 104 Q94 70 86 34Z"/>
    <path class="rock-l" d="M58 36 L6 104 L18 104 L62 40Z"/>
    <ellipse class="lava" cx="80" cy="35" rx="21" ry="4.5"/><ellipse class="glow" cx="80" cy="35" rx="13" ry="2.4"/>
    <path class="lava" d="M70 37 C66 50 74 58 66 70 C60 80 64 92 58 104 L67 104 C71 92 68 82 75 72 C83 60 75 50 79 37Z"/>
    <path class="glow-ln" style="stroke-width:1.8" d="M75 40 C72 52 78 58 71 70 C66 80 66 92 62 103"/>
    <path class="grass" d="M0 102 H160 V110 H0Z"/><path class="grass-l" d="M0 102 H160 V104 H0Z"/>`,
  storm: () => {
    const c = [[50, 42, 17], [74, 32, 21], [102, 36, 19], [124, 46, 14], [36, 50, 11]];
    const o = c.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
    let rain = '';
    for (let i = 0; i < 9; i++) {
      const x = 34 + i * 12, y = 66 + (i % 3) * 7;
      rain += `<path class="rain-ln drop" style="--k:${i % 3}" d="M${x} ${y} l-4 10"/>`;
    }
    return `${rain}
    <g class="cloud">${o}<rect x="30" y="44" width="106" height="18" rx="9"/></g>
    <g class="cloud" style="stroke:none">${o}<rect x="30" y="44" width="106" height="18" rx="9"/></g>
    <path class="cloud-s" d="M28 54 Q30 62 42 62 H126 Q137 62 136 52 Q118 58 82 57 Q44 58 28 54Z"/>
    <ellipse class="cloud-l" cx="70" cy="17" rx="11" ry="4"/><ellipse class="cloud-l" cx="100" cy="23" rx="8" ry="3"/>
    <ellipse class="cloud-l" cx="46" cy="30" rx="6" ry="2.5"/>
    <path class="glow bolt" d="M86 60 L75 82 L85 82 L77 106 L100 74 L88 74 L95 60Z"/>`;
  },
  organs: () => `
    <path class="skin" d="M62 0 V6 C44 10 30 14 26 28 C22 44 28 70 30 110 H130 C132 70 138 44 134 28 C130 14 116 10 98 6 V0Z"/>
    <path class="skin-s" d="M98 6 C116 10 130 14 134 28 C138 44 132 70 130 110 H114 C120 70 122 40 114 22 C110 14 104 10 98 6Z"/>
    <path class="skin-l" d="M44 14 C34 18 30 26 29 36 L33 36 C34 28 38 20 46 16Z"/>
    <path class="fan" d="M64 54 L121 64 A58 58 0 0 1 93 104 Z"/>
    ${arcsSvg(64, 54, 35 * DEG, { n: 3, wl: 13, r0: 12, spread: 0.8 })}
    <path class="organ" d="M88 72 C98 63 113 71 111 83 C109 93 97 95 90 89 C95 85 95 77 88 72Z"/>
    <path class="organ-s" d="M111 83 C109 93 97 95 90 89 C99 90 106 86 108 78Z"/>
    <path class="organ-l" d="M92 72 C98 68 104 69 107 72 C102 70 97 71 93 74Z"/>
    <g transform="translate(64 54) rotate(-35)">
      <path class="dark-ln" d="M0 -32 C0 -48 -14 -56 -30 -58"/>
      <path class="probe" d="M-7 -4 L7 -4 L6 -30 Q0 -35 -6 -30Z"/><path class="probe-s" d="M2 -4 L7 -4 L6 -30 Q4 -32 2 -33Z"/>
      <rect class="dark" x="-8" y="-6" width="16" height="6" rx="2"/>
    </g>`,
  stone: () => `
    <path class="dark" d="M4 42 h9 v26 h-9Z"/>
    <path class="metal" d="M12 30 Q30 55 12 80 L22 80 Q40 55 22 30Z"/><path class="metal-l" d="M13 33 Q30 55 13 77 L15 77 Q32 55 15 33Z"/>
    <path class="fan" d="M24 34 L96 52 L96 62 L24 76Z"/>
    <path class="organ" d="M104 8 C130 6 146 30 145 55 C144 82 130 102 104 102 C84 102 74 90 78 78 C82 70 88 66 88 56 C88 46 82 42 78 34 C73 22 84 9 104 8Z"/>
    <path class="organ-s" d="M145 55 C144 82 130 102 104 102 C122 96 136 80 136 56 C136 36 128 20 114 11 C134 16 146 34 145 55Z"/>
    <ellipse class="organ-l" cx="104" cy="20" rx="13" ry="4" transform="rotate(-14 104 20)"/>
    <path class="organ-s" d="M84 68 C82 82 78 94 76 110 L82 110 C84 94 88 82 91 70Z"/>
    <ellipse class="skin" cx="121" cy="34" rx="7" ry="5" transform="rotate(30 121 34)"/>
    <ellipse class="skin" cx="127" cy="56" rx="7" ry="5"/>
    <ellipse class="skin" cx="121" cy="78" rx="7" ry="5" transform="rotate(-30 121 78)"/>
    <path class="skin" d="M90 57 C90 44 102 37 113 42 C124 47 126 60 120 70 C113 79 96 77 92 68Z"/>
    <path class="skin-s" d="M92 68 C96 77 113 79 120 70 C112 74 99 74 93 65Z"/>
    ${arcsSvg(104, 57, Math.PI, { n: 3, wl: 10, r0: 16, spread: 0.6, rev: true })}
    <g transform="translate(12 1)">
    <g class="frag" style="--dx:-2.4px;--dy:-1.6px"><path class="stone" d="M83 50 L91 45 L94 53 L87 58Z"/><path class="stone-l" d="M84 50 L90 46.5 L90.5 48.5 L85 51.5Z"/></g>
    <g class="frag" style="--dx:2.6px;--dy:-1.2px"><path class="stone" d="M96 47 L103 51 L100 60 L95 55Z"/><path class="stone-s" d="M101 54 L103 51 L100 60Z"/></g>
    <g class="frag" style="--dx:0.4px;--dy:2.6px"><path class="stone" d="M85 61 L95 57 L101 63 L91 68Z"/><path class="stone-s" d="M91 68 L101 63 L99 65 L92 69Z"/></g>
    <path class="crack-ln" d="M90 44 l-3 -5 M104 46 l4 -4 M104 64 l4 4 M84 66 l-4 3"/>
    </g>`,
  bath: () => {
    let bubbles = '';
    [[62, 60], [98, 56], [70, 82], [94, 84], [80, 46], [104, 72], [56, 74]].forEach(([x, y], i) => {
      bubbles += `<circle class="bub" style="--k:${i % 4}" cx="${x}" cy="${y}" r="${1.6 + (i % 3) * 0.6}"/>`;
    });
    return `
    <rect class="metal" x="56" y="6" width="48" height="5" rx="2"/>
    <path class="metal" d="M18 30 H142 V100 Q142 106 136 106 H24 Q18 106 18 100Z"/>
    <path class="metal-l" d="M18 30 H142 V33 H18Z"/>
    <path class="water" d="M25 40 H135 V99 H25Z"/><path class="water-s" d="M25 82 H135 V99 H25Z"/>
    <path class="water-l" d="M25 40 H135 V43 H25Z"/>
    <path class="metal-ln" d="M80 11 V48"/>
    ${arcsSvg(50, 99, -Math.PI / 2, { n: 2, wl: 9, r0: 6 })}${arcsSvg(110, 99, -Math.PI / 2, { n: 2, wl: 9, r0: 6 })}
    <path class="metal" d="${gearD(80, 66, 19, 14, 9)}"/>
    <path class="metal-l" d="M67 58 A15 15 0 0 1 80 51 L80 54 A12 12 0 0 0 69.5 60Z"/>
    <path class="metal-s" d="M93 72 A15 15 0 0 1 80 81 L80 78 A12 12 0 0 0 90.5 70.5Z"/>
    <circle class="water" cx="80" cy="66" r="5"/>
    ${bubbles}
    <rect class="dark" x="40" y="104" width="20" height="5" rx="1.5"/><rect class="dark" x="100" y="104" width="20" height="5" rx="1.5"/>`;
  },
  block: () => `
    <path class="metal-l" d="M18 54 L44 36 H144 L118 54Z" style="stroke:var(--uu-metal-d)"/>
    <path class="metal" d="M18 54 H118 V104 H18Z"/>
    <path class="metal-s" d="M118 54 L144 36 V86 L118 104Z" style="stroke:var(--uu-metal-d);stroke-width:1.3"/>
    <path class="metal-l" d="M20 56 H116 V58 H20Z"/>
    ${arcsSvg(76, 54, Math.PI / 2, { n: 3, wl: 7, r0: 5, spread: 1.0 })}
    <path class="crack-ln" d="M56 92 L63 86 L61 81 L70 76 L68 72 L80 68 L86 70"/>
    ${arcsSvg(72, 72, -Math.PI / 2, { n: 2, wl: 6, r0: 4, spread: 1.0, rev: true, tone: 2 })}
    <path class="dark-ln" d="M76 12 C76 4 60 2 48 4"/>
    <path class="probe" d="M70 12 H82 V40 H70Z"/><path class="probe-s" d="M77 12 H82 V40 H77Z"/>
    <rect class="dark" x="67" y="39" width="18" height="6" rx="2"/>`,
  sonar: () => `
    <path class="sea" d="M0 40 H160 V110 H0Z"/>
    <path class="sea-s" d="M0 76 C40 72 120 80 160 74 V110 H0Z"/>
    <path class="sea-l" d="M0 40 Q10 37 20 40 T40 40 T60 40 T80 40 T100 40 T120 40 T140 40 T160 40 V44 H0Z"/>
    <path class="rock" d="M0 101 C30 97 60 105 100 100 C130 97 150 102 160 99 V110 H0Z"/>
    ${arcsSvg(62, 47, 52 * DEG, { n: 3, wl: 11, r0: 9 })}
    ${arcsSvg(100, 88, 232 * DEG, { n: 2, wl: 9, r0: 10, rev: true, tone: 2 })}
    ${fish(98, 86)}${fish(112, 92, 0.85)}${fish(92, 96, 0.8)}
    <path class="dark-ln" d="M58 22 V10"/>
    <path class="probe" d="M48 22 H76 L78 34 H46Z"/><path class="probe-s" d="M68 22 H76 L78 34 H70Z"/>
    <path class="hull" d="M28 34 H100 L91 47 H39Z"/><path class="hull-s" d="M35 43 H94 L91 47 H39Z"/>
    <path class="hull-l" d="M30 34 H98 V36 H31Z"/>`,
};

const SIDES = [
  {
    key: 'infra', name: 'infrasonic', range: 'below 20 Hz',
    tiles: [
      { k: 'quake', cap: 'earthquakes' },
      { k: 'volcano', cap: 'volcanic eruptions' },
      { k: 'storm', cap: 'severe storms' },
    ],
  },
  {
    key: 'ultra', name: 'ultrasonic', range: 'above 20 kHz',
    tiles: [
      { k: 'organs', cap: 'see organs inside' },
      { k: 'stone', cap: 'break kidney stones' },
      { k: 'bath', cap: 'weld and clean parts' },
      { k: 'block', cap: 'find defects in metal' },
      { k: 'sonar', cap: 'find objects by echoes' },
    ],
  },
];

const KEYS = SIDES.flatMap((s) => s.tiles.map((t) => t.k));

function cycleCss(n) {
  const on = (100 / n) * 0.92;
  return `@keyframes uu-cyc${n}{0%,${on.toFixed(1)}%{opacity:1}${(on + 2).toFixed(1)}%,100%{opacity:0}}`;
}

const STEP = 2.4; // seconds each tile stays lit in the at-rest cycle

const CSS = `
.uu { --uu-metal-d: ${ladderCss(TONES.metal)[0]}; display: flex; flex-direction: column; gap: 14px; }
.uu-side { display: flex; flex-direction: column; gap: 8px; }
.uu-head { display: flex; align-items: baseline; gap: 10px; }
.uu-name { font-size: var(--sim-text-xl); font-weight: 800; color: var(--sim-label); }
.uu-range { font-size: var(--sim-text-lg); font-weight: 700; color: var(--sim-label-muted); }
.uu-tiles { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.uu-tile { position: relative; display: flex; flex-direction: column; align-items: stretch; gap: 4px;
  padding: 6px; margin: 0; border: var(--sim-border); border-color: var(--sim-track); border-radius: var(--sim-radius-md);
  background: var(--sim-bg-surface); box-shadow: 0 var(--sim-lift) 0 var(--sim-track); color: var(--sim-label);
  font: inherit; cursor: pointer; min-height: 44px; transition: transform .25s, border-color .25s; }
.uu-tile::after { content: ''; position: absolute; inset: -3px; border: 3px solid var(--sim-accent);
  border-radius: calc(var(--sim-radius-md) + 2px); opacity: 0; pointer-events: none; }
.uu-pic { display: block; width: 100%; height: auto; border-radius: var(--sim-radius-sm); background: var(--sim-bg-cell);
  stroke-linejoin: round; }
.uu-say { display: grid; justify-items: center; }
.uu-cap { grid-area: 1 / 1; font-size: var(--sim-text-xl); font-weight: 800; line-height: 1.2; text-align: center;
  color: var(--sim-label); opacity: 0; }
.uu-side--lit .uu-tiles .uu-tile { flex: 0 0 calc((100% - 20px) / 3); }
.uu-side--dim { flex-direction: row; align-items: center; gap: 12px; }
.uu-side--dim .uu-head { flex-direction: column; gap: 0; opacity: .7; flex: 0 0 auto; }
.uu-side--dim .uu-tiles { flex: 1 1 auto; flex-wrap: nowrap; justify-content: flex-start; gap: 8px; opacity: .42; filter: saturate(.35); }
.uu-side--dim .uu-tile { flex: 1 1 0; max-width: 92px; padding: 3px; cursor: default; box-shadow: none; }
.uu-side--dim .uu-name { font-size: var(--sim-text-lg); }
.uu-side--dim .uu-range { font-size: var(--sim-text-lg); }
.uu-side--dim * { animation-play-state: paused !important; }
${KEYS.map((k) => `.uu[data-lit="${k}"] .uu-tile[data-k="${k}"]::after, .uu[data-lit="${k}"] .uu-cap[data-k="${k}"]{opacity:1}`
  + `.uu[data-lit="${k}"] .uu-tile[data-k="${k}"]{transform:translateY(-2px)}`).join('')}
${cycleCss(3)}${cycleCss(5)}
.uu:not([data-lit]) .uu-side--lit .uu-tile::after, .uu:not([data-lit]) .uu-side--lit .uu-cap {
  animation: var(--uu-cyc) calc(var(--n) * ${STEP}s) linear infinite; animation-delay: calc(var(--i) * ${STEP}s); }
.uu-side--lit[data-n="3"] { --n: 3; --uu-cyc: uu-cyc3; }
.uu-side--lit[data-n="5"] { --n: 5; --uu-cyc: uu-cyc5; }
.uu-pic .arc path { fill: none; stroke-linecap: round; }
.uu-pic .arc path:first-child { stroke-width: 3.4; }
.uu-pic .arc-1 path:first-child { stroke: var(--sim-series-1); }
.uu-pic .arc-2 path:first-child { stroke: var(--sim-series-2); }
.uu-pic .arc .arc-hi { stroke: color-mix(in srgb, white 70%, transparent); stroke-width: 1; }
.uu-pic .arc { opacity: .2; animation: uu-arc 1.5s linear infinite; animation-delay: calc(var(--j) * 0.5s); }
@keyframes uu-arc { 0% { opacity: .2 } 18% { opacity: 1 } 45%, 100% { opacity: .2 } }
.uu-pic .trace-ln { fill: none; stroke: var(--sim-series-6); stroke-width: 1.6; stroke-linejoin: round; }
.uu-pic .crack-ln { fill: none; stroke: var(--sim-series-6); stroke-width: 2.4; stroke-linejoin: round; stroke-linecap: round; }
.uu-pic .fan { fill: color-mix(in srgb, var(--sim-series-1) 22%, transparent); stroke: none; }
.uu-pic .bub { fill: none; stroke: color-mix(in srgb, white 85%, transparent); stroke-width: 1;
  animation: uu-bub 1.6s ease-out infinite; animation-delay: calc(var(--k) * 0.4s); }
@keyframes uu-bub { 0% { transform: translateY(0); opacity: 0 } 30% { opacity: 1 } 100% { transform: translateY(-8px); opacity: 0 } }
.uu-pic .frag { animation: uu-frag 2s ease-in-out infinite; }
@keyframes uu-frag { 0%, 30% { transform: translate(0, 0) } 60%, 100% { transform: translate(var(--dx), var(--dy)) } }
.uu-pic .plume { animation: uu-plume 3s ease-in-out infinite alternate; }
@keyframes uu-plume { from { transform: translateY(1.5px) } to { transform: translateY(-2px) } }
.uu-pic .drop { animation: uu-drop .8s linear infinite; animation-delay: calc(var(--k) * -0.27s); }
@keyframes uu-drop { from { transform: translate(0, -4px); opacity: 0 } 30% { opacity: 1 } to { transform: translate(-2px, 6px); opacity: 0 } }
.uu-pic .bolt { animation: uu-bolt 2.4s steps(1) infinite; }
@keyframes uu-bolt { 0%, 8% { opacity: 1 } 10%, 14% { opacity: .25 } 16%, 100% { opacity: 1 } }
${toneCss('.uu-pic')}
.sim-dom-root--portrait.uu { gap: 8px; }
.sim-dom-root--portrait .uu-side { gap: 6px; }
.sim-dom-root--portrait .uu-tiles { gap: 8px; }
.sim-dom-root--portrait .uu-side--lit .uu-tiles .uu-tile { flex: 0 0 calc((100% - 16px) / 3); padding: 4px; }
.sim-dom-root--portrait .uu-side--dim .uu-tiles { gap: 5px; }
.sim-dom-root--portrait .uu-side--dim .uu-tile { max-width: 58px; padding: 2px; }
.sim-dom-root--portrait .uu-side--dim { display: none; }   /* phone: only the side the beat names, so the board keeps the host width */
@media (prefers-reduced-motion: reduce) {
  .uu-pic * { animation: none !important; }
  .uu:not([data-lit]) .uu-side--lit [data-first]::after,
  .uu:not([data-lit]) .uu-side--lit .uu-cap[data-first] { animation: none !important; opacity: 1; }
}
`;

function tileHtml(t, i, lit) {
  const attrs = lit
    ? `type="button" aria-pressed="false" aria-label="${esc(t.cap)}"`
    : 'type="button" disabled tabindex="-1" aria-hidden="true"';
  return `<button class="uu-tile" data-k="${t.k}" style="--i:${i}"${i === 0 ? ' data-first="1"' : ''} ${attrs}>`
    + `<svg class="uu-pic" viewBox="0 0 160 110" aria-hidden="true" focusable="false">${ART[t.k]()}</svg></button>`;
}

function sideHtml(side, lit) {
  return `<section class="uu-side uu-side--${lit ? 'lit' : 'dim'}" data-side="${side.key}" data-n="${side.tiles.length}">`
    + `<div class="uu-head"><span class="uu-name">${esc(side.name)}</span><span class="uu-range">${esc(side.range)}</span></div>`
    + `<div class="uu-tiles">${side.tiles.map((t, i) => tileHtml(t, i, lit)).join('')}</div>`
    + (lit ? `<div class="uu-say" aria-live="polite">${side.tiles.map((t, i) => `<span class="uu-cap" data-k="${t.k}" style="--i:${i}"`
      + `${i === 0 ? ' data-first="1"' : ''}>${esc(t.cap)}</span>`).join('')}</div>` : '')
    + '</section>';
}

export class UltrasoundUsesScene extends DomSimulation {
  static BEAT_STEP_MAP = MAP;
  static WIDTH = 680;
  static HEIGHT = 496;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 270;   // measured: b1 content at 380 with the dim side hidden on phone
  static LAYOUT = 'fit';
  static ARIA_LABEL = 'Two rows of picture tiles: infrasonic uses below 20 Hz (earthquakes, volcanic eruptions, '
    + 'severe storms) and ultrasonic uses above 20 kHz (seeing organs, breaking kidney stones, cleaning parts, '
    + 'finding defects in metal, finding objects by echoes). The side the slide names is lit; tap a tile to light it.';
  static CONTROLS = [];

  _lit = null;
  _seen = new Set();
  _wonSide = false;

  async setup() {
    await super.setup();
    this.render({ css: SIM_LOOK_DOM_CSS + CSS, rootClass: 'uu' });
    this._onClick = (ev) => {
      const el = ev.target?.closest?.('.uu-tile');
      if (!el || !this.root.contains(el) || el.disabled) return;
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

  /** The beat alone sets the board: which side is lit; nothing tapped yet. */
  enter(step) {
    const s = Math.max(0, Math.min(1, step | 0));
    this._lit = null;
    this._seen = new Set();
    this._wonSide = false;
    if (!this.root) return;
    delete this.root.dataset.lit;
    this.root.dataset.side = SIDES[s].key;
    const html = SIDES.map((side, i) => sideHtml(side, i === s)).join('');
    this.render({ html });
  }

  _onTap(k, el) {
    const s = Math.max(0, Math.min(1, this.stepIndex | 0));
    const side = SIDES[s];
    if (!side.tiles.some((t) => t.k === k)) return;
    this._lit = k;
    this.root.dataset.lit = k;
    for (const b of this.root.querySelectorAll?.('.uu-side--lit .uu-tile') ?? []) {
      b.setAttribute('aria-pressed', String(b.dataset.k === k));
    }
    this._seen.add(k);
    // The find: every use on the lit side looked at, once per beat.
    if (!this._wonSide && this._seen.size === side.tiles.length) {
      this._wonSide = true;
      burst(this.root, undefined, el);
    }
  }
}
