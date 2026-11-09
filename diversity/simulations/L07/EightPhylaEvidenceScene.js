import { DomSimulation } from 'simulations/base/DomSimulation.js';

// Independent snapshots for blk-l07-s07; no state is imported from L06.
const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
  [{ idx: 4, dwellMs: null }],
];

// Original flat-vector structural schematics. Paths have no external assets or
// document-global SVG ids, so simultaneous mounts cannot collide.
const DRAWINGS = {
  sponge: `<path class="body" d="M69 23 Q47 30 48 109 Q92 126 133 108 Q133 40 112 23Z"/>
    <ellipse class="hollow" cx="90" cy="24" rx="22" ry="8"/>
    <path class="water" d="M90 98V34 M90 16V3 M85 9L90 3 95 9 M13 54H61 M53 49L61 54 53 59 M153 86H122 M130 81L122 86 130 91"/>
    <g class="hollow"><circle cx="61" cy="54" r="5"/><circle cx="117" cy="86" r="5"/><circle cx="62" cy="85" r="4"/><circle cx="114" cy="52" r="4"/><circle cx="77" cy="106" r="4"/></g>`,
  cnidarian: `<path class="body" d="M73 45 Q62 103 83 116 H103 Q125 100 113 45Z"/>
    <path class="hollow" d="M83 45 Q79 92 92 103 Q106 92 103 45"/>
    <path class="outline" d="M74 45Q35 30 46 10 M82 44Q64 19 75 5 M105 44Q119 18 111 5 M113 45Q147 29 141 10"/>
    <path class="feature" d="M81 44H104"/><path class="water" d="M89 13V36 M85 30L89 36 93 30 M98 36V13 M94 19L98 13 102 19"/>`,
  flatworm: `<path class="body" d="M35 55 Q66 15 111 29 L147 49 Q121 64 101 88 Q71 118 39 94 Q23 80 35 55Z"/>
    <path class="outline" d="M36 89 Q86 102 145 49"/>
    <g class="ink"><circle cx="120" cy="43" r="3"/><circle cx="122" cy="53" r="3"/></g>`,
  roundworm: `<path class="body" d="M15 85 Q29 36 72 49 Q118 71 168 27 Q147 87 95 78 Q40 49 15 85Z"/>
    <path class="feature" d="M20 80 Q45 48 90 65 Q130 80 160 36"/>
    <circle class="feature-dot" cx="20" cy="80" r="4"/><circle class="feature-dot" cx="160" cy="36" r="4"/>`,
  earthworm: `<path class="body" d="M10 69 Q46 32 100 50 Q133 60 162 41 L171 56 Q135 82 96 69 Q49 51 18 81Z"/>
    <g class="outline"><path d="M26 54L35 66 M40 48L47 61 M55 44L59 60 M71 44L72 61 M88 47L85 65 M104 52L100 70 M119 55L117 73 M135 54L137 70 M151 47L157 63"/></g>
    <circle class="body" cx="139" cy="103" r="19"/><circle class="cavity" cx="139" cy="103" r="13"/><circle class="body" cx="139" cy="103" r="5"/>`,
  beetle: `<g class="outline"><path d="M72 51L45 33 26 48 M69 70L34 67 19 86 M75 89L49 108 31 106 M108 51L135 33 154 48 M111 70L146 67 161 86 M105 89L131 108 149 106 M80 30L68 12 M101 30L113 12"/></g>
    <ellipse class="body" cx="90" cy="33" rx="16" ry="12"/><ellipse class="body shell" cx="90" cy="73" rx="28" ry="39"/>
    <path class="feature" d="M90 38V110"/><g class="feature-dot"><circle cx="45" cy="33" r="4"/><circle cx="34" cy="67" r="4"/><circle cx="49" cy="108" r="4"/><circle cx="135" cy="33" r="4"/><circle cx="146" cy="67" r="4"/><circle cx="131" cy="108" r="4"/></g>`,
  molluscs: `<path class="body" d="M9 87 Q47 84 65 70 L81 73 L90 94 H9Z"/>
    <path class="feature" d="M13 94H85"/><path class="outline" d="M76 74L75 60 M83 75L90 64"/>
    <circle class="body shell" cx="39" cy="64" r="25"/><path class="outline" d="M43 78Q16 75 25 56Q38 44 50 60Q54 72 39 69Q32 67 39 60"/>
    <ellipse class="body" cx="133" cy="49" rx="19" ry="26"/>
    <path class="outline" d="M119 67Q91 91 103 104 M123 70Q106 103 119 110 M127 72Q121 106 131 116 M131 73Q133 108 141 112 M135 73Q142 103 150 109 M139 71Q156 109 162 98 M143 69Q173 90 170 80 M146 64Q179 77 174 65"/>`,
  starfish: `<path class="body" d="M63 10L76 43 112 40 88 65 105 97 70 86 43 112 44 76 10 61 46 48Z"/>
    <path class="outline" d="M71 69L119 72"/>
    <circle class="hollow" cx="147" cy="79" r="27"/>
    <g class="plates"><rect x="130" y="65" width="13" height="12" rx="3"/><rect x="146" y="62" width="12" height="12" rx="3"/><rect x="137" y="80" width="13" height="12" rx="3"/><rect x="153" y="77" width="12" height="13" rx="3"/></g>`,
  amphioxus: `<path class="body" d="M6 76Q55 29 158 50L176 63Q109 95 6 76Z"/>
    <path class="outline" d="M18 76Q87 94 156 69 M44 65L50 78 M55 62L61 78 M66 60L72 77"/>
    <path class="feature" d="M16 66Q89 43 162 60"/>`,
};

const PHYLA = [
  { name: 'Porifera', tone: 2, specimen: 'Sponge', icon: 'sponge', tags: ['Cellular', 'Pores', 'Outlet'], alt: 'Porous sponge: water enters side pores and leaves the top outlet.' },
  { name: 'Cnidaria', tone: 7, specimen: 'Hydra', icon: 'cnidarian', tags: ['Tissue', 'One opening'], alt: 'Tentacled Hydra with a single opening into its digestive cavity.' },
  { name: 'Platyhelminthes', tone: 8, specimen: 'Flatworm', icon: 'flatworm', tags: ['Organ', 'Gut varies'], alt: 'Flattened flatworm body, with no universal gut pattern drawn.' },
  { name: 'Nematoda', tone: 3, specimen: 'Roundworm', icon: 'roundworm', tags: ['Unsegmented', 'Mouth', 'Anus'], alt: 'Smooth cylindrical worm with a continuous digestive path between two separate ends.' },
  { name: 'Annelida', tone: 4, specimen: 'Earthworm', icon: 'earthworm', tags: ['Segments', 'Body cavity'], alt: 'Segmented earthworm and cross-section showing a body cavity around the gut.' },
  { name: 'Arthropoda', tone: 1, specimen: 'Beetle', icon: 'beetle', tags: ['Jointed legs', 'Exoskeleton'], alt: 'Beetle with six jointed legs and an outlined external skeleton.' },
  { name: 'Mollusca', tone: 6, specimen: 'Snail · Octopus', icon: 'molluscs', tags: ['Foot / modifications', 'Shell optional'], alt: 'Shelled snail with a muscular foot beside an unshelled octopus with arms.' },
  { name: 'Echinodermata', tone: 5, specimen: 'Starfish', icon: 'starfish', tags: ['Internal CaCO₃', 'No notochord'], alt: 'Starfish with a magnified inset of internal calcium-carbonate plates.' },
];

function diagram(icon, alt) {
  return `<svg viewBox="0 0 180 130" role="img" aria-label="${alt}">${DRAWINGS[icon]}</svg>`;
}
function tags(items) {
  return `<div class="ep-tags">${items.map(tag => `<span>${tag}</span>`).join('')}</div>`;
}

const CSS = `
.ep-root { box-sizing:border-box; padding:var(--sim-space-4); color:var(--sim-label); background:var(--sim-bg-deep); font-family:var(--sim-font); }
.ep-root * { box-sizing:border-box; }
.ep-animal { border:2px solid var(--sim-stroke); border-radius:var(--sim-radius-md); padding:var(--sim-space-3); background:var(--sim-bg-surface); box-shadow:0 3px 0 var(--sim-stroke);}
.ep-title { font-size:var(--sim-text-xl); font-weight:750; margin:0 0 12px; }
.ep-branches { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--sim-space-3); align-items:start; }
.ep-root[data-step="4"] .ep-branches { grid-template-columns:minmax(0,1fr) 170px; }
.ep-boundary { min-width:0; border:2px solid var(--sim-stroke); border-radius:var(--sim-radius-md); padding:var(--sim-space-2); background:var(--sim-bg-cell); box-shadow:0 3px 0 var(--sim-stroke);}
.ep-heading { font-size:var(--sim-text-lg); font-weight:750; margin:0 0 10px; }
.ep-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--sim-space-2); }
.ep-card { min-width:0; display:grid; grid-template-columns:56px minmax(0,1fr); grid-template-areas:"art name" "art spec"; column-gap:var(--sim-space-2); align-items:center; padding:var(--sim-space-1) var(--sim-space-2); border:2px solid var(--t, var(--sim-stroke)); border-radius:var(--sim-radius-md); background:var(--sim-bg-surface); transition:border-color 180ms ease; box-shadow:0 3px 0 var(--t, var(--sim-stroke)); }
.ep-art { grid-area:art; }
.ep-art svg { width:56px; height:41px; }
.ep-name { grid-area:name; font-size:var(--sim-text-md); font-weight:750; overflow-wrap:anywhere; margin:0; }
.ep-specimen { grid-area:spec; color:var(--sim-label-muted); font-size:var(--sim-text-md); }
.ep-card .ep-tags { display:none; grid-area:tags; margin-top:6px; }
/* Earlier beats fold to a one-line card (thumbnail, name, specimen); the two cards this beat introduces are full size. The last beat folds all eight to make room for the chordate branch. */
.ep-card[data-active="true"] { grid-template-columns:140px minmax(0,1fr); grid-template-areas:"name name" "spec spec" "art tags"; align-items:start; padding:var(--sim-space-2); border-color:var(--t, var(--sim-accent)); box-shadow:0 5px 0 var(--t, var(--sim-accent)); }
.ep-card[data-active="true"] .ep-art svg { width:140px; height:102px; }
.ep-card[data-active="true"] .ep-name { font-size:var(--sim-text-lg); }
.ep-card[data-active="true"] .ep-tags { display:flex; margin-top:6px; align-content:flex-start; }
.ep-root[data-step="4"] .ep-card { grid-template-columns:44px minmax(0,1fr); }
.ep-root[data-step="4"] .ep-art svg { width:44px; height:32px; }
.ep-tags { display:flex; flex-wrap:wrap; align-content:center; gap:var(--sim-space-1); }
.ep-tags span { border:1px solid var(--sim-stroke); border-radius:var(--sim-radius-sm); padding:var(--sim-space-1) var(--sim-space-1); font-size:var(--sim-text-md); line-height:1.25; background:var(--sim-bg-cell); }
.ep-chordata { border-color:var(--sim-accent); }
.ep-chordata svg { width:100%; height:135px; }
.ep-chordata .ep-name { margin:12px 0 4px; }
.ep-root svg { display:block; }
.ep-root .body { fill:var(--sim-cytoplasm); stroke:var(--sim-label); stroke-width:2; }
.ep-root .hollow { fill:var(--sim-bg-surface); stroke:var(--sim-label); stroke-width:2; }
.ep-root .outline { fill:none; stroke:var(--sim-label); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.ep-root .ink { fill:var(--sim-label); }
.ep-root .water { fill:none; stroke:var(--sim-water); stroke-width:3; stroke-linecap:round; stroke-linejoin:round; }
.ep-root .feature { fill:none; stroke:var(--sim-accent); stroke-width:3; stroke-linecap:round; }
.ep-root .feature-dot { fill:var(--sim-accent); }
.ep-root .shell { stroke:var(--sim-accent); stroke-width:3; }
.ep-root .cavity { fill:var(--sim-bg-surface); stroke:var(--sim-accent); stroke-width:2; }
.ep-root .plates { fill:var(--sim-cytoplasm); stroke:var(--sim-accent); stroke-width:2; }
.ep-root.sim-dom-root--portrait .ep-branches,
.ep-root.sim-dom-root--portrait .ep-grid { grid-template-columns:minmax(0,1fr); }
.ep-root.sim-dom-root--portrait .ep-tags span { font-size:var(--sim-text-md); }
@media (prefers-reduced-motion:reduce) { .ep-card { transition:none; } }
`;

export class EightPhylaEvidenceScene extends DomSimulation {
  static WIDTH = 680;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 930;
  // Earlier beats fold to one-line cards, so every beat is short enough to sit beside the text.
  static MIN_SCALE = 1;
  static FIT = true;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'Animal evidence: eight non-chordate phyla and a distinct chordate branch.';
  // A read-only comparison: no controls expose later groups ahead of the text.
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this.stepIndex = 0;
    this.allowResume = true;
  }

  async setup() {
    await super.setup();
    this.render({ rootClass: 'ep-root', css: CSS, ui: false });
    this.board = document.createElement('div');
    this.root.appendChild(this.board);
    this._render();
  }

  onStep() {
    this._render();
  }

  _render() {
    if (!this.board || !this.root) return;
    const count = Math.min(8, 2 * (this.stepIndex + 1));
    this.root.dataset.step = String(this.stepIndex);
    const cards = PHYLA.slice(0, count).map((item, index) => `
      <section class="ep-card" data-active="${Math.floor(index / 2) === this.stepIndex}" style="--t:var(--sim-series-${item.tone})">
        <div class="ep-art">${diagram(item.icon, item.alt)}</div>
        <h3 class="ep-name">${item.name}</h3>
        <div class="ep-specimen">${item.specimen}</div>
        ${tags(item.tags)}
      </section>`).join('');
    const chordata = this.stepIndex === 4 ? `<section class="ep-boundary ep-chordata">
      <h2 class="ep-heading">Chordata</h2>
      <h3 class="ep-name">Protochordates</h3>
      <div class="ep-specimen">Amphioxus</div>
      ${diagram('amphioxus', 'Amphioxus with one continuous internal notochord, not a chain of vertebrae.')}
      ${tags(['Notochord', 'No backbone'])}
    </section>` : '';
    this.board.innerHTML = `<div class="ep-animal"><h1 class="ep-title">Animalia</h1>
      <div class="ep-branches"><section class="ep-boundary">
        <h2 class="ep-heading">Non-chordates${this.stepIndex >= 3 ? ' · 8 phyla' : ''}</h2>
        <div class="ep-grid">${cards}</div>
      </section>${chordata}</div></div>`;
    this.refit();
    this._rescale();
  }

  destroy() {
    this.board = null;
    super.destroy();
  }
}
