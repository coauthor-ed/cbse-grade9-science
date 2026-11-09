/**
 * ParticleWindowScene - blk-l08-s07, the "build a mixture" mini-game.
 *
 * Four goals, one jar with a laser pointed through it. Each goal states what the jar must do, never a name.
 * The learner sets one choice (particle size, or the emulsifying agent), then presses Shake and wait: the jar shakes, the beam
 * crosses, and big particles drop to the bottom. Three results report what the jar did. Nothing shows them before the run, so the
 * setting is a prediction. A miss names why. The last goal done, the names of the four mixtures appear.
 * Phone layout from shared/GameFrame.js. Check is the frame's button, once all four goals are done. CSS only.
 */
import { GameBoard, mountGame } from '../shared/GameFrame.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, burst } from 'simulations/base/kit/SimLookDom.js';
import { rng } from 'simulations/base/kit/shuffle.js';

/* ------------------------------------------------------------------ data */

/** Size stops in nm, one per decade, none on the 1 nm or 1000 nm borders. */
const SIZES = [0.5, 5, 50, 500, 5000];
const EMULSIFIERS = [{ v: 'none', l: 'none' }, { v: 'little', l: 'a little' }, { v: 'lot', l: 'a lot' }];
/** What a diameter does: scatters the beam, settles after the run. */
const behave = (d) => ({ beam: d >= 1, settles: d > 1000, even: d <= 1000 });
/** What each emulsifier level leaves the oil as, in nm. */
const OIL_AFTER = { none: 50000, little: 5000, lot: 300 };

const ROUNDS = [
  { key: 'r1', tab: 'Scatter', goal: 'A mixture that scatters the beam and has not settled after the run.', dial: 'size', start: 5000,
    win: (b) => b.beam && !b.settles, name: 'a colloid', range: '1 to 1000 nm' },
  { key: 'r2', tab: 'Clear', goal: 'A jar that will not scatter the beam at all.', dial: 'size', start: 50,
    win: (b) => !b.beam, name: 'a solution', range: 'under 1 nm' },
  { key: 'r3', tab: 'Settle', goal: 'A cloudy jar whose particles drop to the bottom when left to stand.', dial: 'size', start: 50,
    win: (b) => b.settles, name: 'a suspension', range: 'over 1000 nm' },
  { key: 'r4', tab: 'Oil', goal: 'Oil broken into droplets too small to see, and they stay mixed through the water.', dial: 'emul', start: 'none',
    win: (b) => b.beam && !b.settles, name: 'an emulsion (a colloid of two liquids)', range: 'about 300 nm droplets' },
];
const MARK = { yes: '\u2713', no: '\u2717' };
const fmt = (d) => (d < 1 ? String(d) : d >= 1000 ? d.toLocaleString('en-IN') : String(d));

/** What the jar does for this round's setting. */
function outcome(r, s) {
  if (r.dial === 'size') return { d: s.size, ...behave(s.size) };
  const d = OIL_AFTER[s.emul];
  // oil does not sink: big droplets rise and join into a layer on top
  return { d, beam: true, settles: d > 1000, even: d <= 1000, oil: true };
}

function slipFor(r, s, b) {
  if (r.dial === 'emul') {
    if (s.emul === 'none') return 'No emulsifying agent: the oil drops join up and float as a layer';
    return 'A little agent leaves drops big enough to rise and join up';
  }
  if (r.key === 'r1') return b.beam ? `${fmt(s.size)} nm particles scatter light, but they are big enough to settle` : `${fmt(s.size)} nm is too small to scatter the beam`;
  if (r.key === 'r2') return `Even ${fmt(s.size)} nm particles scatter light, so the beam shows`;
  return `${fmt(s.size)} nm particles are too small to settle`;
}

/* ------------------------------------------------------------- drawings */

function jarSvg(r, s, run) {
  const b = run ? outcome(r, s) : null;
  const shown = r.dial === 'size' ? s.size : OIL_AFTER[s.emul];
  const rad = shown > 1000 ? 8 : Math.max(1.2, 1.3 + Math.log10(Math.max(shown, 1)) * 0.8);
  const rr = rng(r.key.length * 31 + (r.dial === 'size' ? SIZES.indexOf(s.size) : 7));
  const tone = r.dial === 'emul' ? '--sim-glucose' : '--sim-strata-2';
  let parts = '';
  const n = shown >= 500 ? 26 : 40;
  const layerOil = b && b.oil && b.settles;
  const settled = b && !b.oil && b.settles;
  if (!layerOil && shown >= 1) {
    for (let i = 0; i < n; i++) {
      const x = 52 + rr() * 116;
      const y = settled ? 182 - rr() * 10 : 40 + rr() * 140;
      parts += `<circle class="pw-p${settled ? ' is-drop' : ''}" style="--i:${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="var(${tone})"`
        + `${rad > 3 ? ' stroke="var(--sim-stroke)" stroke-width="1"' : ''}/>`;
    }
  }
  const oilLayer = layerOil ? '<path class="pw-oil" d="M46 34 H174 V54 H46 Z" fill="color-mix(in oklab, var(--sim-glucose) 70%, transparent)"/>' : '';
  const cloudy = shown >= 1 && !layerOil && !settled ? 'color-mix(in oklab, var(--sim-ice) 30%, transparent)' : 'transparent';
  const beam = b && b.beam && !b.oil || b && b.oil && !b.settles
    ? '<path class="pw-beam" d="M46 112 H174" stroke="var(--sim-error)" stroke-width="12" opacity="0.28" stroke-linecap="round"/><path class="pw-beam" d="M46 112 H174" stroke="var(--sim-error)" stroke-width="4" stroke-linecap="round"/>'
    : '';
  return `<svg class="pw-jar${run ? ' is-run' : ''}" viewBox="0 0 230 214" role="img" aria-label="The jar">
    <ellipse cx="112" cy="206" rx="92" ry="5" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>
    <g class="pw-laser"><rect x="2" y="100" width="30" height="24" rx="5" fill="var(--sim-surface-raised)" stroke="var(--sim-stroke)" stroke-width="2"/>
      <circle cx="32" cy="112" r="4" fill="var(--sim-error)"/><path d="M14 124 v70 M6 194 h18" stroke="var(--sim-stroke)" stroke-width="3"/></g>
    <path d="M32 112 H46" stroke="var(--sim-error)" stroke-width="3"/>
    <g class="pw-body"><path d="M46 30 H174 V186 a10 10 0 0 1 -10 10 H56 a10 10 0 0 1 -10 -10 Z" fill="color-mix(in oklab, var(--sim-water) 30%, var(--sim-bg-cell))"/>
      <path d="M46 30 H174 V186 a10 10 0 0 1 -10 10 H56 a10 10 0 0 1 -10 -10 Z" fill="${cloudy}"/>
      ${beam}${parts}${oilLayer}
      <path d="M40 16 H180 M46 16 V186 a10 10 0 0 0 10 10 H164 a10 10 0 0 0 10 -10 V16" fill="none" stroke="var(--sim-stroke)" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M56 40 v130" stroke="color-mix(in oklab, var(--sim-ice) 45%, transparent)" stroke-width="5" stroke-linecap="round"/></g>
    <path d="M174 112 H226" stroke="var(--sim-error)" stroke-width="3" stroke-dasharray="${beam ? '0' : '4 4'}"/>
  </svg>`;
}

/** A log ruler from 0.1 to 10 000 nm with the two border marks and a pointer at the setting. */
function rulerHtml(d) {
  const pos = (v) => ((Math.log10(v) + 1) / 5) * 100;
  return `<div class="pw-ruler" aria-hidden="true"><span class="pw-ruler__bar"></span>`
    + [1, 1000].map((m) => `<span class="pw-ruler__mark" style="left:${pos(m)}%"><span>${fmt(m)} nm</span></span>`).join('')
    + `<span class="pw-ruler__ptr" style="left:${pos(d)}%"></span></div>`;
}

/* ------------------------------------------------------------- the scene */

export class ParticleWindowScene extends GameBoard {
  static ARIA_LABEL = 'A jar with a laser pointed through it. Each goal says what the jar must do. Set the particle size, or on the last goal the emulsifying agent, then shake and wait: the results say whether the beam shows, whether anything settled and whether the jar is the same everywhere.';
  static PORTRAIT_HEIGHT = 860;
  static OBJECTIVE = { prompt: { en: 'Make each jar do what its goal asks: set your choice, shake and wait, then read the results.' } };

  constructor(container, config) {
    super(container, config);
    this._i = 0;
    this._st = ROUNDS.map((r) => ({ size: r.dial === 'size' ? r.start : 50, emul: r.dial === 'emul' ? r.start : 'none', run: null, fresh: false }));
    this._won = ROUNDS.map(() => false);
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: SIM_LOOK_DOM_CSS + CSS,
      html: `<div class="gm pw">
        <div class="gm-head"><p class="kicker">Challenge</p><h2>Build a <b>mixture</b></h2><p class="sub" id="pw-sub"></p></div>
        <div class="pw-board" id="pw-board"></div></div>`,
    });
    this.root.querySelector('#pw-board')?.addEventListener('click', (e) => {
      const b = e.target.closest?.('[data-act]');
      if (b && !b.disabled) this._act(b.dataset.act, b.dataset.val);
    });
    this._paint();
    this.quill.speak('Set your choice before you shake.', 5200);
  }

  _act(name, value) {
    const i = this._i, r = ROUNDS[i], s = this._st[i];
    if (name === 'next') { this._i = Math.min(ROUNDS.length - 1, i + 1); this._paint(); return; }
    if (this._won[i]) return;
    if (name === 'size') { s.size = Number(value); s.run = null; } else if (name === 'emul') { s.emul = value; s.run = null; } else if (name === 'shake') {
      const b = outcome(r, s), ok = r.win(b);
      s.run = { ...b, ok, slip: ok ? '' : slipFor(r, s, b) };
      s.fresh = true;
      if (ok) this._won[i] = true;
      this._paint();
      if (ok) { burst(this.root.querySelector('.pw-jarbox')); this.quill?.perform('hop'); }
      return;
    } else return;
    this._paint();
  }

  checkObjective() {
    if (!this._won.every(Boolean)) {
      if (!this._st.some((s) => s.run)) return null;
      return { ok: false, hint: 'Finish all four goals first.' };
    }
    return { ok: true };
  }

  _paint() {
    const i = this._i, r = ROUNDS[i], s = this._st[i], run = s.run;
    const board = this.root.querySelector('#pw-board');
    if (!board) return;
    const fresh = s.fresh; s.fresh = false;
    this.root.querySelector('#pw-sub').textContent = `Goal ${i + 1} of ${ROUNDS.length}. ${r.goal}`;
    const lock = this._won[i];
    const pick = (act, opts, val) => `<div class="pw-pick">${opts.map((o) => `<button type="button" class="tap btn" data-act="${act}" data-val="${o.v}" aria-pressed="${String(o.v) === String(val)}"${lock ? ' disabled' : ''}>${o.l}</button>`).join('')}</div>`;
    const dial = r.dial === 'size'
      ? `<p class="pw-k">Particle size in nm</p>${rulerHtml(s.size)}${pick('size', SIZES.map((d) => ({ v: d, l: fmt(d) })), s.size)}`
      : `<p class="pw-k">Oil and water, with emulsifying agent:</p>${pick('emul', EMULSIFIERS, s.emul)}`;
    const row = (k, val) => `<span class="pw-read${run ? (val ? ' is-on' : ' is-off') : ''}"><span class="pw-read__k">${esc(k)}</span><span class="pw-read__v">${run ? (val ? 'yes' : 'no') : '?'}</span></span>`;
    const reads = `<div class="pw-reads${fresh ? ' is-new' : ''}">${row('Beam seen', run?.oil ? !run?.settles : run?.beam)}${row('Separated out', run?.settles)}${row('Same everywhere', run?.even)}</div>`;
    let act;
    if (run?.ok) {
      act = `<p class="pw-tag is-yes">${MARK.yes} That is ${esc(r.name)}: ${esc(r.range)}.</p>`;
      act += i < ROUNDS.length - 1 ? '<button type="button" class="tap pw-go" data-act="next">Next goal</button>' : '<p class="pw-k">All goals done.</p>';
    } else {
      act = '<button type="button" class="tap pw-go" data-act="shake">Shake and wait</button>'
        + (run ? `<p class="pw-tag is-no">${MARK.no} ${esc(run.slip)}</p>` : '<p class="pw-k">Results appear after the run.</p>');
    }
    board.innerHTML = `<div class="pw-jarbox${fresh ? ' is-shaken' : ''}">${jarSvg(r, s, !!run)}</div><div class="pw-ctrl">${dial}${reads}</div><div class="pw-res" aria-live="polite">${act}</div>`;
  }
}

const CSS = `
.gm.pw { background: var(--sim-bg-deep); }
.gm.pw .tap:disabled { color: var(--sim-label); opacity: 1; }
.sim-dom-root--portrait .gm.pw .sub { padding-right: 44px; }
.pw-board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 300px 400px minmax(0, 1fr); gap: 16px; align-items: start; padding-right: 8px; }
.pw-k { margin: 0; font-size: 14px; font-weight: 800; color: var(--sim-label-muted); text-align: center; line-height: 1.2; }
.pw-ctrl { display: flex; flex-direction: column; gap: 8px; }
.pw-jarbox { padding: 6px; border-radius: 14px; background: var(--sim-bg-cell); border-bottom: 6px solid color-mix(in oklab, var(--sim-gold) 55%, var(--sim-stroke)); }
.pw-jar { display: block; width: 100%; height: auto; max-height: 256px; }
.pw-pick { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 6px; }
.pw-pick .btn { padding: 4px 2px; }
.pw-pick .btn[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 1px; background: color-mix(in oklab, var(--sim-accent) 16%, var(--sim-bg-surface)); }
.pw-ruler { position: relative; height: 34px; margin: 0 8px; }
.pw-ruler__bar { position: absolute; left: 0; right: 0; bottom: 4px; height: 8px; border-radius: 4px; background: linear-gradient(90deg, var(--sim-accent) 0 20%, var(--sim-good) 20% 80%, var(--sim-warning) 80% 100%); }
.pw-ruler__mark { position: absolute; bottom: 0; width: 2px; height: 16px; }
.pw-ruler__mark::before { content: ''; position: absolute; inset: 0; background: var(--sim-label); }
.pw-ruler__mark span { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); font-size: 14px; font-weight: 700; white-space: nowrap; color: var(--sim-label); }
.pw-ruler__ptr { position: absolute; bottom: 0; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: var(--sim-label); border: 2px solid var(--sim-bg-deep); }
.pw-reads { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.pw-read { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 5px 4px; border: 2px dashed var(--sim-stroke); border-radius: 12px; background: var(--sim-bg-surface); text-align: center; }
.pw-read.is-on { border-style: solid; border-color: var(--sim-good); }
.pw-read.is-off { border-style: solid; }
.pw-read__k { font-size: 14px; font-weight: 700; line-height: 1.15; color: var(--sim-label-muted); }
.pw-read__v { font-family: var(--sim-font-display); font-size: 20px; font-weight: 700; }
.pw-res { display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
.gm .pw-go { min-height: 50px; border: 0; border-radius: 12px; font-size: 16px; font-weight: 800; background: var(--sim-accent); color: var(--sim-bg-deep); box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.pw-tag { margin: 0; padding: 6px 10px; border-radius: 12px; border: 2px solid var(--sim-stroke); font-size: 15px; font-weight: 700; line-height: 1.3; }
.pw-tag.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); }
.pw-tag.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface)); }
.pw-jarbox.is-shaken .pw-body { animation: pw-shake 0.7s ease; transform-origin: 110px 110px; }
.pw-jarbox.is-shaken .pw-p.is-drop { animation: pw-drop 0.9s ease both 0.5s; }
@keyframes pw-shake { 0%, 100% { transform: none; } 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
@keyframes pw-drop { from { transform: translateY(-120px); } to { transform: none; } }
.sim-dom-root--portrait .pw-board { display: flex; flex-direction: column; gap: 10px; padding-right: 0; }
.sim-dom-root--portrait .pw-jarbox, .sim-dom-root--portrait .pw-ctrl, .sim-dom-root--portrait .pw-res { width: 100%; }
.sim-dom-root--portrait .pw-jar { max-height: 190px; }
@media (prefers-reduced-motion: reduce) { .pw-jarbox.is-shaken * { animation: none; } }
`;
