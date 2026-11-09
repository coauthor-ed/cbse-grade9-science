import { DomSimulation } from 'simulations/base/DomSimulation.js';

// blk-l02-s06 only. Every mount reconstructs its own supplied-profile key.
const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [
    { idx: 3, dwellMs: 1200 },
    { idx: 4, dwellMs: 1200 },
    { idx: 5, dwellMs: 1200 },
    { idx: 6, dwellMs: 1200 },
    { idx: 7, dwellMs: 1200 },
    { idx: 8, dwellMs: null },
  ],
];

// tone indexes into the closed --sim-series-N palette (sim-theme.css) - each
// profile keeps the same identity colour from its beat-0 card through every
// later endpoint card it appears in, instead of a scene-invented hex value.
// Kept identical to EvidenceKeyChallengeScene (slide s08) so a creature has one
// colour across both slides; chosen to read naturally (plant = green).
const PROFILES = [
  { id: 'bacterium', name: 'Bacterium', cells: 'One cell', nucleus: 'No membrane-bound nucleus', wall: 'Wall present · material unspecified', food: 'Organic food', kingdom: 'Monera', walled: true, tone: 5 },
  { id: 'pond', name: 'Pond eukaryote', cells: 'One cell', nucleus: 'Membrane-bound nucleus', wall: 'No cell wall', food: 'Food particles', kingdom: 'Protista', walled: false, tone: 7 },
  { id: 'fungus', name: 'Filamentous fungus', cells: 'Many cells', nucleus: 'Membrane-bound nuclei', wall: 'Chitin walls', food: 'Absorption', kingdom: 'Fungi', walled: true, tone: 8 },
  { id: 'plant', name: 'Green plant', cells: 'Many cells', nucleus: 'Membrane-bound nuclei', wall: 'Cellulose walls', food: 'Photosynthesis', kingdom: 'Plantae', walled: true, tone: 3 },
  { id: 'animal', name: 'Animal', cells: 'Many cells', nucleus: 'Membrane-bound nuclei', wall: 'No cell walls', food: 'Ingestion', kingdom: 'Animalia', walled: false, tone: 4 },
];

const CSS = `
.fpk-root { box-sizing:border-box; padding:var(--sim-space-4); color:var(--sim-label); background:var(--sim-bg-deep); font:var(--sim-text-md)/1.3 var(--sim-font); }
.fpk-root * { box-sizing:border-box; }
.fpk-content { display:flex; flex-direction:column; gap:var(--sim-space-3); }
.fpk-heading { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:var(--sim-space-2); font-weight:700; font-size:var(--sim-text-xl); }
.fpk-scope { display:inline-flex; border:2px solid var(--sim-stroke); border-radius:var(--sim-radius-pill); padding:var(--sim-space-1) var(--sim-space-2); background:var(--sim-bg-cell); font-size:var(--sim-text-sm); font-weight:500; box-shadow:0 3px 0 var(--sim-stroke);}
.fpk-cards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--sim-space-2); }
.fpk-card {
  border: 2px solid var(--fpk-id-tone, var(--sim-stroke));
  box-shadow: 0 3px 0 var(--fpk-id-tone, var(--sim-stroke));
}
.fpk-card-head { display:flex; align-items:center; justify-content:space-between; gap:var(--sim-space-2); font-weight:700; }
.fpk-glyph { width:82px; height:40px; flex:none; }
.fpk-glyph .wall { fill:var(--sim-bg-cell); stroke:var(--sim-cell-wall); stroke-width:3; }
.fpk-glyph .membrane { fill:var(--sim-cytoplasm); stroke:var(--sim-membrane); stroke-width:1.5; }
.fpk-glyph .nucleus { fill:var(--sim-nucleus); stroke:var(--sim-nucleus-stroke); stroke-width:1; }
.fpk-glyph .dna { fill:none; stroke:var(--sim-label); stroke-width:1.5; }
.fpk-tags { display:flex; flex-wrap:wrap; gap:var(--sim-space-1); }
.fpk-tag { padding:var(--sim-space-1) var(--sim-space-2); border-radius:var(--sim-radius-sm); background:var(--sim-bg-cell); border:2px solid var(--sim-stroke); font-size:var(--sim-text-sm); }
.fpk-legend { display:flex; flex-wrap:wrap; gap:var(--sim-space-2) var(--sim-space-3); font-size:var(--sim-text-sm); }
.fpk-legend span { display:inline-flex; gap:var(--sim-space-1); align-items:center; }
.fpk-swatch { width:18px; border-top:3px solid var(--sim-cell-wall); }
.fpk-swatch.membrane { border-top:2px solid var(--sim-membrane); }
.fpk-swatch.nucleus { border-top:3px solid var(--sim-nucleus); }
.fpk-tree, .fpk-branches { display:flex; flex-direction:column; gap:var(--sim-space-2); }
.fpk-node { align-self:flex-start; background:var(--sim-bg-surface); border:2px solid var(--sim-stroke); border-radius:var(--sim-radius-md); padding:var(--sim-space-2) var(--sim-space-2); font-weight:700; transition:border-color .2s; box-shadow:0 3px 0 var(--sim-stroke);}
.fpk-branches { margin-left:14px; padding-left:12px; border-left:2px solid var(--sim-stroke); }
.fpk-branch { display:flex; flex-direction:column; gap:var(--sim-space-2); }
.fpk-row { display:flex; align-items:center; flex-wrap:wrap; gap:var(--sim-space-2); }
.fpk-answer { font-size:var(--sim-text-sm); font-weight:700; }
.fpk-answer::before { content:'↳ '; color:var(--sim-label-muted); }
.fpk-record { display:inline-flex; align-items:center; padding:var(--sim-space-1) var(--sim-space-2); border:1px solid var(--sim-stroke); border-radius:var(--sim-radius-sm); background:var(--sim-bg-surface); font-size:var(--sim-text-sm); }
.fpk-end { font-weight:700; border-bottom:2px solid var(--sim-success); padding:var(--sim-space-1) 0; }
.fpk-arrow { color:var(--sim-label-muted); }
.fpk-pair { display:flex; flex-wrap:wrap; gap:var(--sim-space-1); }
.fpk-terminals { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--sim-space-2); }
.fpk-terminal { padding:var(--sim-space-2); border:2px solid var(--fpk-id-tone, var(--sim-stroke)); border-radius:var(--sim-radius-sm); background:var(--sim-bg-surface); display:flex; flex-direction:column; align-items:flex-start; gap:var(--sim-space-2); transition:box-shadow .2s; }
.fpk-active { box-shadow:0 0 0 3px var(--sim-accent); }
.fpk-active > .fpk-pair .fpk-tag, .fpk-node.fpk-active { background:var(--sim-bg-cell); border-color:var(--sim-accent); box-shadow:0 3px 0 var(--sim-accent);}
.fpk-active .fpk-end { border-bottom-color:var(--sim-accent); }
.fpk-comparison { padding:var(--sim-space-2); border:1px dashed var(--sim-warning); border-radius:var(--sim-radius-sm); display:flex; flex-direction:column; gap:var(--sim-space-2); background:var(--sim-bg-surface); }
.fpk-comparison strong { font-size:var(--sim-text-md); }
.fpk-comparison s { text-decoration-thickness:2px; }
.fpk-status { min-height:26px; padding:var(--sim-space-1) var(--sim-space-2); border-radius:var(--sim-radius-sm); background:var(--sim-bg-surface); border:1px solid var(--sim-stroke); font-size:var(--sim-text-sm); }
.fpk-root.sim-dom-root--portrait { font-size:var(--sim-text-md); }
.sim-dom-root--portrait .fpk-cards, .sim-dom-root--portrait .fpk-terminals { grid-template-columns:minmax(0,1fr); }
.sim-dom-root--portrait .fpk-card { padding:var(--sim-space-2); gap:var(--sim-space-2); }
.sim-dom-root--portrait .fpk-branches { margin-left:4px; padding-left:8px; }
.sim-dom-root--portrait .fpk-scope, .sim-dom-root--portrait .fpk-legend { font-size:var(--sim-text-sm); }
@media (prefers-reduced-motion:reduce) { .fpk-root * { transition:none; } }
`;

function tag(value) { return `<span class="fpk-tag">${value}</span>`; }
function record(p) { return `<span class="fpk-record">${p.name}</span>`; }
function scope() { return '<span class="fpk-scope">Supplied profiles</span>'; }

// Original cell schematics: wall is outside a separately drawn membrane.
// No membrane-bound circle is drawn around the bacterium's DNA.
function glyph(p) {
  const count = p.cells === 'Many cells' ? 3 : 1;
  const cells = Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? 28 : 2 + 27 * i;
    return `<g transform="translate(${x},4)">
      ${p.walled ? '<rect class="wall" x="0" y="0" width="24" height="32" rx="6"/>' : ''}
      <rect class="membrane" x="3" y="3" width="18" height="26" rx="6"/>
      ${p.id === 'bacterium' ? '<path class="dna" d="M8 12 Q17 7 15 16 Q7 24 9 17 Q16 20 16 23"/>' : '<ellipse class="nucleus" cx="12" cy="16" rx="4" ry="5"/>'}
    </g>`;
  }).join('');
  return `<svg class="fpk-glyph" viewBox="0 0 84 40" aria-hidden="true">${cells}</svg>`;
}

function endpoint(p, evidence, active, scoped = false) {
  return `<div class="fpk-terminal${active ? ' fpk-active' : ''}" data-profile="${p.id}" style="--fpk-id-tone:var(--sim-series-${p.tone})">
    <div class="fpk-pair">${evidence.map(tag).join('')}</div>
    <div class="fpk-row">${record(p)}<span class="fpk-arrow">→</span><span class="fpk-end">${p.kingdom}</span>${scoped ? scope() : ''}</div>
  </div>`;
}

export class FiveProfileKeyScene extends DomSimulation {
  static WIDTH = 620;
  // Browser-measured: beat 3 (worked key) is tallest at 747px including root
  // padding - the previous HEIGHT=750 left only 3px of slack and clipped the
  // status bar in practice. Re-measured after the identity-colour border pass.
  static HEIGHT = 799;
  static PORTRAIT_WIDTH = 380;
  // Portrait beat 3 (worked key) is tallest at 870px, exceeding the old
  // PORTRAIT_HEIGHT=850 by 20px - that overflow was clipping the status bar.
  static PORTRAIT_HEIGHT = 935;
  // Dense content: beside the text only when it can render at >= 0.9x, else full width below.
  static MIN_SCALE = 0.9;
  static ARIA_LABEL = 'Worked classification key for five supplied profiles';
  static CONTROLS = [
    { type: 'select', id: 'profile', label: 'Replay route', value: 'all', options: [
      { value: 'all', label: 'All five routes' },
      ...PROFILES.map(p => ({ value: p.id, label: p.name })),
    ] },
    { type: 'button', id: 'replay', label: 'Replay all routes' },
  ];

  constructor(container, config) {
    super(container, config);
    this.stepIndex = 0;
    this._beatIndex = 0;
    this._chainPos = 0;
    this._focus = 'all';
    this._ready = false;
  }

  async setup() {
    await super.setup();
    this.render({ rootClass: 'fpk-root', css: CSS, ui: false });
    this._content = document.createElement('div');
    this._content.className = 'fpk-content';
    this.root.appendChild(this._content);
    this._ready = true;
    this._enterChain();
  }

  // sim-lint-ignore beat-clamp: runs a multi-step dwell chain per beat, so it keeps its own handler
  onBeatChange(beatIndex) {
    const index = Number.isFinite(beatIndex) ? Math.trunc(beatIndex) : 0;
    this._beatIndex = Math.max(0, Math.min(index, BEAT_STEP_MAP.length - 1));
    this._chainPos = 0;
    this._focus = 'all';
    this.clearDwellTimer();
    if (this._ready) this._enterChain();
  }

  _enterChain() {
    if (!this._ready) return;
    const entry = BEAT_STEP_MAP[this._beatIndex][this._chainPos];
    this.stepIndex = entry.idx;
    this._focus = this.stepIndex >= 3 && this.stepIndex <= 7
      ? PROFILES[this.stepIndex - 3].id : 'all';
    this._render();
    this.requestUiUpdate?.();
    if (entry.dwellMs != null) {
      this.startDwellTimer(entry.dwellMs, () => {
        this._chainPos += 1;
        this._enterChain();
      });
    }
  }

  isControlHidden(id) {
    return (id === 'profile' || id === 'replay') && this.stepIndex < 8;
  }

  getControlValue(id) { return id === 'profile' ? this._focus : undefined; }

  onControlChange(id, value) {
    if (!this._ready || this.isControlHidden(id)) return;
    if (id === 'profile' && (value === 'all' || PROFILES.some(p => p.id === value))) {
      this._focus = value;
      this._render();
    } else if (id === 'replay') {
      this._chainPos = 0;
      this._enterChain();
    }
    this.requestUiUpdate?.();
  }

  _render() {
    if (!this._content) return;
    this.root.dataset.step = String(this.stepIndex);
    const [bacterium, pond, fungus, plant, animal] = PROFILES;
    const beat = this._beatIndex;
    const active = id => this._focus === id || (beat === 3 && this._focus === 'all');
    const node = (label, lit) => `<div class="fpk-node${lit ? ' fpk-active' : ''}">${label}</div>`;
    const branch = (answer, body) => `<div class="fpk-branch"><div class="fpk-answer">${answer}</div>${body}</div>`;
    const branches = body => `<div class="fpk-branches">${body}</div>`;
    const waiting = ps => `<div class="fpk-row">${ps.map(record).join('')}</div>`;
    let body;
    if (beat === 0) {
      body = `<div class="fpk-cards">${PROFILES.map(p => `<div class="sim-card fpk-card" style="--fpk-id-tone:var(--sim-series-${p.tone})">
        <div class="fpk-card-head">${p.name}${glyph(p)}</div>
        <div class="fpk-tags">${[p.cells, p.nucleus, p.wall, p.food].map(tag).join('')}</div>
      </div>`).join('')}</div>
      <div class="fpk-legend"><span><i class="fpk-swatch"></i>Cell wall</span><span><i class="fpk-swatch membrane"></i>Cell membrane</span><span><i class="fpk-swatch nucleus"></i>Membrane-bound nucleus</span></div>`;
    } else {
      let many = waiting([fungus, plant, animal]);
      if (beat === 3) {
        many = node('Cell wall?', ['fungus', 'plant', 'animal', 'all'].includes(this._focus)) + branches(
          branch('None', endpoint(animal, ['No cell walls', 'Ingestion'], active('animal'))) +
          branch('Present', `<div class="fpk-terminals">${endpoint(fungus, ['Chitin', 'Absorption'], active('fungus'))}${endpoint(plant, ['Cellulose', 'Photosynthesis'], active('plant'))}</div>`)
        );
      }
      const eukaryotes = beat === 1 ? waiting([pond, fungus, plant, animal]) :
        node('Cell number?', this._focus !== 'bacterium') + branches(
          branch('One', endpoint(pond, ['One cell'], beat === 2 || active('pond'), true)) +
          branch('Many', many)
        );
      body = `<div class="fpk-tree">${node('Membrane-bound nucleus?', true)}${branches(
        branch('No', endpoint(bacterium, ['No membrane-bound nucleus'], beat === 1 || active('bacterium'))) +
        branch('Yes', eukaryotes)
      )}</div>`;
      if (beat === 1) body += `<div class="fpk-comparison"><strong>Alternative first split · <s>Xylem?</s></strong><div class="fpk-answer">No</div>${waiting([bacterium, fungus, animal])}</div>`;
    }
    const status = beat < 3 ? ['Five records', 'Nuclear boundary', 'Cell number'][beat] :
      this._focus === 'all' ? 'All five routes' : `${PROFILES.find(p => p.id === this._focus).name} → ${PROFILES.find(p => p.id === this._focus).kingdom}`;
    this._content.innerHTML = `<div class="fpk-heading">${beat === 0 ? 'Evidence cards' : 'Worked key'}${scope()}</div>${body}<div class="fpk-status" role="status" aria-live="polite">${status}</div>`;
  }

  destroy() {
    this.clearDwellTimer();
    this._ready = false;
    this._content = null;
    super.destroy();
  }
}
