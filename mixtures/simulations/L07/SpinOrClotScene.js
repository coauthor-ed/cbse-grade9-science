/**
 * SpinOrClotScene - blk-l07-s07, the mini-game (the file name stays). Three jars, three goals. The learner picks the method
 * this jar needs, sets its one dial and runs it, and the picture shows what came out:
 *   Jar 1  blood, get the plasma: a fast spin packs the cells, a slower one has not finished in the same time, alum does nothing useful
 *   Jar 2  a tank of muddy pond water: the right dose makes clumps that settle and a filter clears; a wrong dose leaves it cloudy;
 *          a centrifuge cannot hold a tank
 *   Jar 3  a tank of grit and fine clay: put settle, clump and filter in order; a wrong order is named
 * Phone layout from shared/GameFrame.js. Check is the frame's button, once all three jars are done.
 */
import { GameBoard, mountGame } from '../shared/GameFrame.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, burst } from 'simulations/base/kit/SimLookDom.js';
import { rng } from 'simulations/base/kit/shuffle.js';

const SPEEDS = [{ v: 'slow', l: 'Slow' }, { v: 'medium', l: 'Medium' }, { v: 'fast', l: 'Fast' }];
const DOSES = [{ v: 'none', l: 'None' }, { v: 'little', l: 'A pinch' }, { v: 'right', l: 'A spoon' }, { v: 'lot', l: 'A cupful' }];
const STEPS = [{ id: 'settle', label: 'Let it settle' }, { id: 'clump', label: 'Add alum, stir' }, { id: 'filter', label: 'Filter' }];
const ROUNDS = [
  { key: 'blood', goal: 'Get the plasma out of this tube of blood.' },
  { key: 'pond', goal: 'Make a tank of clear drinking water from muddy pond water.' },
  { key: 'tank', goal: 'Clear a tank of water that holds coarse grit and fine clay.' },
];
const MARK = { yes: '\u2713', no: '\u2717' };

function dots(seed, n, x0, y0, w, h, r, tone) {
  const rr = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) out += `<circle cx="${(x0 + rr() * w).toFixed(1)}" cy="${(y0 + rr() * h).toFixed(1)}" r="${r}" fill="var(${tone})"/>`;
  return out;
}

// Blood in a tube: uniform dark red when mixed; spun, straw plasma on top (about 55 %), a thin pale
// buffy coat, and packed dark red cells (about 45 %) at the bottom. Token mixes only.
const RED = 'color-mix(in oklab, var(--sim-lysosome) 58%, var(--sim-strata-6))';
const MIXED = 'color-mix(in oklab, var(--sim-lysosome) 66%, var(--sim-strata-6))';
const PLASMA = 'color-mix(in oklab, var(--sim-glucose) 72%, var(--sim-ice))';
const COAT = 'color-mix(in oklab, var(--sim-ice) 55%, var(--sim-elev-peak))';
const BLOOD_STOPS = {
  mixed: [[0, MIXED], [1, MIXED]],
  slow: [[0, PLASMA], [0.04, PLASMA], [0.1, MIXED], [0.88, MIXED], [0.94, RED], [1, RED]],
  half: [[0, PLASMA], [0.2, PLASMA], [0.3, MIXED], [0.6, MIXED], [0.7, RED], [1, RED]],
  packed: [[0, PLASMA], [0.53, PLASMA], [0.53, COAT], [0.56, COAT], [0.56, RED], [1, RED]],
};

/**
 * The blood jar's picture: a bench centrifuge with its front cut away (two buckets on a rotor, the
 * blood opposite a water tube for balance) and, beside it, the tube itself at its present state.
 * A run swings the buckets out while a ring streaks round, then they hang again (CSS, one shot).
 */
function bloodSvg(s) {
  const state = s.done ? s.result : 'mixed';
  const spin = s.fresh && s.tool === 'spin';
  const stops = BLOOD_STOPS[state] ?? BLOOD_STOPS.mixed;
  const grad = `<linearGradient id="sc-blood" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  const shell = 'color-mix(in oklab, var(--sim-surface-raised) 62%, var(--sim-stroke))';
  const well = 'color-mix(in oklab, var(--sim-stroke) 35%, var(--sim-strata-6))';
  const metal = 'color-mix(in oklab, var(--sim-stroke) 45%, var(--sim-elev-peak))';
  const lid = 'color-mix(in oklab, var(--sim-shape) 75%, var(--sim-surface-raised))';
  const water = 'color-mix(in oklab, var(--sim-water) 55%, var(--sim-ice))';
  const bucket = (x, side, fill) => `<g class="${spin ? `sc-swing-${side}` : ''}" style="transform-origin: ${x}px 92px">
      <path d="M${x - 7} 95 V128 a7 7 0 0 0 14 0 V95" fill="color-mix(in oklab, ${metal} 30%, ${well})"/>
      <path d="M${x - 4} 98 V126 a4 4 0 0 0 8 0 V98 Z" fill="${fill}"/>
      <path d="M${x - 7} 95 V128 a7 7 0 0 0 14 0 V95" fill="none" stroke="${metal}" stroke-width="2"/>
      <path d="M${x - 6} 95 L${x} 92 L${x + 6} 95" fill="none" stroke="${metal}" stroke-width="1.5"/>
    </g>`;
  return `<svg class="sc-svg" viewBox="0 0 200 190" aria-hidden="true">
    <defs>${grad}<clipPath id="sc-tube-clip"><path d="M161 44 V160 a11 11 0 0 0 22 0 V44 Z"/></clipPath></defs>
    <ellipse cx="100" cy="182" rx="92" ry="5" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>
    <rect x="8" y="70" width="132" height="108" rx="12" fill="${shell}" stroke="var(--sim-stroke)" stroke-width="2"/>
    <path d="M16 78 H132 V132 a18 18 0 0 1 -18 18 H34 a18 18 0 0 1 -18 -18 Z" fill="${well}"/>
    <rect x="72" y="92" width="4" height="54" rx="2" fill="${metal}"/>
    <path d="M64 150 a10 7 0 0 1 20 0 Z" fill="${metal}"/>
    ${spin ? `<ellipse class="sc-whirl" cx="74" cy="112" rx="56" ry="9" fill="none" stroke="${metal}" stroke-width="3" stroke-dasharray="14 10" stroke-linecap="round"/>` : ''}
    ${bucket(90, 'r', 'url(#sc-blood)')}${bucket(58, 'l', water)}
    <rect x="54" y="89" width="40" height="6" rx="3" fill="${metal}"/>
    <circle cx="74" cy="92" r="5" fill="${metal}" stroke="var(--sim-stroke)" stroke-width="1"/>
    <path d="M16 78 H132 V132 a18 18 0 0 1 -18 18 H34 a18 18 0 0 1 -18 -18 Z" fill="none" stroke="color-mix(in oklab, ${shell} 60%, var(--sim-elev-peak))" stroke-width="2.5"/>
    <rect x="6" y="62" width="136" height="13" rx="6.5" fill="${lid}" stroke="var(--sim-stroke)" stroke-width="2"/>
    <rect x="18" y="157" width="58" height="14" rx="4" fill="${well}"/>
    <circle cx="116" cy="164" r="4" fill="${s.done && s.tool === 'spin' ? 'var(--sim-good)' : 'var(--sim-label-muted)'}"/>
    <path d="M161 44 V160 a11 11 0 0 0 22 0 V44 Z" fill="color-mix(in oklab, var(--sim-glass) 18%, transparent)"/>
    <g clip-path="url(#sc-tube-clip)" class="${s.fresh ? 'sc-fade' : ''}"><rect x="161" y="58" width="22" height="114" fill="url(#sc-blood)"/>
      <path d="M161 56 Q172 62 183 56 V60 H161 Z" fill="${state === 'mixed' ? MIXED : PLASMA}"/></g>
    <path d="M159 40 V160 a13 13 0 0 0 26 0 V40" fill="none" stroke="var(--sim-stroke)" stroke-width="2.5"/>
    <path d="M165 50 v100" stroke="color-mix(in oklab, var(--sim-ice) 70%, transparent)" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="155" y="28" width="34" height="15" rx="4" fill="${lid}" stroke="var(--sim-stroke)" stroke-width="1.5"/>
    <path d="M158 33 h28 M158 38 h28" stroke="var(--sim-stroke)" stroke-width="1"/>
  </svg>`;
}

/** The pond beaker: cloudy, clumped and settled, then filtered clear. */
function pondSvg(s) {
  const state = s.done ? s.result : 'cloudy';
  const clear = state === 'clear';
  const water = clear ? 'color-mix(in oklab, var(--sim-water) 40%, transparent)' : 'color-mix(in oklab, var(--sim-strata-2) 45%, var(--sim-water) 25%)';
  const fine = clear ? '' : dots(5, 60, 34, 44, 132, 96, 1.8, '--sim-strata-3');
  const bed = clear ? '<path d="M30 138 h140" stroke="var(--sim-strata-3)" stroke-width="0"/>' : '';
  const clumps = clear ? '<g class="sc-drop">' + [40, 58, 76, 96, 114, 132, 150].map((x, i) => `<circle cx="${x}" cy="${142 - (i % 2) * 3}" r="${6 + (i % 3)}" fill="var(--sim-strata-3)" stroke="var(--sim-stroke)" stroke-width="1"/>`).join('') + '</g>' : '';
  return `<svg class="sc-svg" viewBox="0 0 200 190" aria-hidden="true">
    <ellipse cx="100" cy="184" rx="80" ry="5" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>
    <path d="M30 40 V140 a10 10 0 0 0 10 10 H160 a10 10 0 0 0 10 -10 V40 Z" fill="${water}" class="${s.fresh ? 'sc-fade' : ''}"/>
    ${fine}${bed}${clumps}
    <path d="M24 26 h6 V140 a10 10 0 0 0 10 10 H160 a10 10 0 0 0 10 -10 V26 h6" fill="none" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>
    ${s.tool === 'clump' && s.dose !== 'none' ? '<path d="M150 8 q20 -4 34 6 l-6 8 q-12 -6 -26 -4 Z" fill="var(--sim-label-muted)" stroke="var(--sim-stroke)" stroke-width="2"/>' : ''}
  </svg>`;
}

/** The settling tank and its three stages; `done` lists the steps that worked. */
function tankSvg(s) {
  const settled = s.order.includes('settle');
  const clumped = s.order.includes('clump');
  const filtered = s.order.includes('filter');
  const water = filtered && clumped ? 'color-mix(in oklab, var(--sim-water) 40%, transparent)' : clumped ? 'color-mix(in oklab, var(--sim-water) 30%, var(--sim-strata-2) 12%)' : 'color-mix(in oklab, var(--sim-strata-2) 42%, var(--sim-water) 22%)';
  const grit = settled ? [30, 50, 70, 90, 110, 130, 150, 170, 190, 210].map((x, i) => `<circle cx="${x}" cy="${120 - (i % 2) * 4}" r="5" fill="var(--sim-strata-1)" stroke="var(--sim-stroke)" stroke-width="1"/>`).join('')
    : dots(3, 14, 24, 40, 196, 80, 4.5, '--sim-strata-1');
  const fine = clumped ? [44, 84, 124, 164, 204].map((x) => `<circle cx="${x}" cy="110" r="7" fill="var(--sim-strata-3)" stroke="var(--sim-stroke)" stroke-width="1"/>`).join('')
    : dots(8, 70, 24, 38, 196, 86, 1.6, '--sim-strata-3');
  return `<svg class="sc-svg sc-svg--wide" viewBox="0 0 300 160" aria-hidden="true">
    <ellipse cx="130" cy="154" rx="120" ry="4" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>
    <path d="M20 30 V122 a8 8 0 0 0 8 8 H212 a8 8 0 0 0 8 -8 V30 Z" fill="${water}"/>
    ${grit}${fine}
    <path d="M14 18 h6 V122 a8 8 0 0 0 8 8 H212 a8 8 0 0 0 8 -8 V18 h6" fill="none" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M226 60 h20 l14 30 h-48 Z" fill="${filtered ? 'color-mix(in oklab, var(--sim-label) 12%, var(--sim-bg-surface))' : 'none'}" stroke="var(--sim-stroke)" stroke-width="2.5"/>
    <path d="M236 90 v20" stroke="var(--sim-stroke)" stroke-width="3"/>
    <path d="M222 112 h40 v30 a5 5 0 0 1 -5 5 h-30 a5 5 0 0 1 -5 -5 Z" fill="${filtered ? 'color-mix(in oklab, var(--sim-water) 50%, transparent)' : 'none'}" stroke="var(--sim-stroke)" stroke-width="2.5"/>
  </svg>`;
}

export class SpinOrClotScene extends GameBoard {
  static ARIA_LABEL = 'Three jars. Pick the method each one needs, spin or clump with alum, set its speed or dose and run it: a tube of blood, muddy pond water for a whole tank, and a tank where settle, clump and filter must go in order.';
  static PORTRAIT_HEIGHT = 820;
  static OBJECTIVE = { prompt: { en: 'Choose the method for each jar, set its speed or dose, and on the tank run settle, clump and filter in order.' } };

  constructor(container, config) {
    super(container, config);
    this._i = 0;
    this._st = {
      blood: { tool: null, speed: 'slow', dose: 'right', done: false, result: null, why: '', fresh: false },
      pond: { tool: null, speed: 'fast', dose: 'little', done: false, result: null, why: '', fresh: false },
      tank: { order: [], fail: null, done: false, fresh: false },
    };
    this._won = ROUNDS.map(() => false);
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: SIM_LOOK_DOM_CSS + CSS,
      html: `<div class="gm sc">
        <div class="gm-head"><p class="kicker">Challenge</p><h2>Spin it or <b>clump it</b></h2><p class="sub" id="sc-sub"></p></div>
        <div class="sc-board" id="sc-board"></div></div>`,
    });
    this.root.querySelector('#sc-board')?.addEventListener('click', (e) => {
      const b = e.target.closest?.('[data-act]');
      if (b && !b.disabled) this._act(b.dataset.act, b.dataset.val);
    });
    this._paint();
    this.quill.speak('Read the goal first.', 5200);
  }

  _act(name, value) {
    const i = this._i, r = ROUNDS[i], s = this._st[r.key];
    if (name === 'next') { this._i = Math.min(ROUNDS.length - 1, i + 1); this._paint(); return; }
    if (this._won[i]) return;
    if (r.key === 'tank') {
      if (name === 'again') this._st.tank = { order: [], fail: null, done: false, fresh: false };
      else if (name === 'step' && !s.fail && !s.order.includes(value)) {
        const want = STEPS[s.order.length].id;
        if (value === want) {
          s.order.push(value);
          s.fresh = true;
          if (s.order.length === STEPS.length) { s.done = true; this._won[i] = true; }
        } else if (value === 'clump') s.fail = 'Alum first: the grit uses it up, and that grit would have settled on its own.';
        else if (value === 'filter') s.fail = s.order.length === 0 ? 'Filter first: the grit blocks the paper and the fine clay still runs through.' : 'Filtered before the alum: the fine clay passes through the paper.';
        else s.fail = 'That step comes earlier.';
      }
    } else if (name === 'tool') { if (!s.done) { s.tool = value; s.result = null; } } else if (name === 'speed') { if (!s.done) s.speed = value; } else if (name === 'dose') { if (!s.done) s.dose = value; } else if (name === 'again') { s.done = false; s.result = null; s.why = ''; } else if (name === 'run' && s.tool && !s.done) {
      s.done = true;
      s.fresh = true;
      this._judge(r, s);
      if (s.result === (r.key === 'blood' ? 'packed' : 'clear')) this._won[i] = true;
    }
    this._paint();
    if (this._won[i] && s.done) { burst(this.root.querySelector('.sc-benchbox')); this.quill?.perform('hop'); }
  }

  _judge(r, s) {
    if (r.key === 'blood') {
      if (s.tool === 'clump') { s.result = 'mixed'; s.why = 'Alum clumps fine grains of mud. Blood cells are already denser than plasma, so spin them.'; return; }
      s.result = s.speed === 'fast' ? 'packed' : s.speed === 'medium' ? 'half' : 'slow';
      s.why = s.result === 'packed' ? '' : s.result === 'half' ? 'Too slow: the cells have only partly packed in this time.' : 'Far too slow: a slow spin pushes much less, so the cells have only just started to move.';
      return;
    }
    if (s.tool === 'spin') { s.result = 'cloudy'; s.why = 'A centrifuge holds small tubes, not a whole tank of water.'; return; }
    s.result = s.dose === 'right' ? 'clear' : 'cloudy';
    s.why = s.dose === 'none' ? 'No alum: the fine grains stay spread through the water.'
      : s.dose === 'little' ? 'Too little alum: few clumps formed, so the water is still muddy.'
        : s.dose === 'lot' ? 'Too much alum: the grains push apart again, so the water stays cloudy.' : '';
  }

  checkObjective() {
    if (!this._won.every(Boolean)) {
      if (!Object.values(this._st).some((s) => s.done || s.fail)) return null;
      return { ok: false, hint: 'Finish all three jars first.' };
    }
    return { ok: true };
  }

  _pick(act, options, value, lock) {
    return `<div class="sc-pick">${options.map((o) => `<button type="button" class="tap btn" data-act="${act}" data-val="${o.v}" aria-pressed="${value === o.v}"${lock ? ' disabled' : ''}>${o.l}</button>`).join('')}</div>`;
  }

  _paint() {
    const i = this._i, r = ROUNDS[i], s = this._st[r.key], lock = this._won[i];
    const board = this.root.querySelector('#sc-board');
    if (!board) return;
    const fresh = s.fresh; s.fresh = false;
    this.root.querySelector('#sc-sub').textContent = `Jar ${i + 1} of ${ROUNDS.length}. ${r.goal}`;
    let pic, ctrl, res = '';
    if (r.key === 'tank') {
      pic = tankSvg(s);
      ctrl = `<p class="sc-k">Tap the steps in the order you would use them</p><div class="sc-steps">${STEPS.map((st) => {
        const n = s.order.indexOf(st.id);
        return `<button type="button" class="tap sc-step${n >= 0 ? ' is-done' : ''}" data-act="step" data-val="${st.id}"${n >= 0 || s.fail || lock ? ' disabled' : ''}><span class="sc-n">${n >= 0 ? n + 1 : '?'}</span>${esc(st.label)}</button>`;
      }).join('')}</div>`;
      if (lock) res = `<p class="sc-tag is-yes">${MARK.yes} Grit settled, clay clumped, water filtered clear.</p>`;
      else if (s.fail) res = `<p class="sc-tag is-no">${MARK.no} ${esc(s.fail)}</p><button type="button" class="tap sc-go" data-act="again">Start the tank again</button>`;
    } else {
      pic = r.key === 'blood' ? bloodSvg(s) : pondSvg(s);
      const tool = (v, l, d) => `<button type="button" class="tap sc-tool" data-act="tool" data-val="${v}" aria-pressed="${s.tool === v}"${s.done ? ' disabled' : ''}><b>${l}</b><span>${d}</span></button>`;
      ctrl = `<p class="sc-k">Which method does this jar need?</p><div class="sc-tools">${tool('spin', 'Spin', 'centrifuge')}${tool('clump', 'Clump', 'alum')}</div>`;
      if (s.tool === 'spin') ctrl += `<p class="sc-k">Speed</p>${this._pick('speed', SPEEDS, s.speed, s.done)}`;
      if (s.tool === 'clump') ctrl += `<p class="sc-k">Alum dose</p>${this._pick('dose', DOSES, s.dose, s.done)}`;
      if (s.done) {
        res = lock ? `<p class="sc-tag is-yes">${MARK.yes} ${r.key === 'blood' ? 'Plasma on top, cells packed at the bottom.' : 'Clumps settled, and the filtered water is clear.'}</p>`
          : `<p class="sc-tag is-no">${MARK.no} ${esc(s.why)}</p><button type="button" class="tap sc-go" data-act="again">Try again</button>`;
      } else if (s.tool) res = `<button type="button" class="tap sc-go" data-act="run">${s.tool === 'spin' ? 'Spin it' : 'Stir, settle and filter'}</button>`;
    }
    if (lock && i < ROUNDS.length - 1) res += '<button type="button" class="tap sc-go" data-act="next">Next jar</button>';
    else if (lock) res += '<p class="sc-k">All jars done.</p>';
    board.innerHTML = `<div class="sc-benchbox${fresh ? ' is-fresh' : ''}">${pic}</div><div class="sc-ctrl">${ctrl}</div><div class="sc-res" aria-live="polite">${res}</div>`;
  }
}

const CSS = `
.gm.sc { background: var(--sim-bg-deep); }
.gm.sc .tap:disabled { color: var(--sim-label); opacity: 1; }
.sim-dom-root--portrait .gm.sc .sub { padding-right: 44px; }
.sc-board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 300px 390px minmax(0, 1fr); gap: 16px; align-items: start; padding-right: 8px; }
.sc-k { margin: 0; font-size: 14px; font-weight: 800; color: var(--sim-label-muted); text-align: center; line-height: 1.2; }
.sc-ctrl { display: flex; flex-direction: column; gap: 8px; }
.sc-benchbox { padding: 8px; border-radius: 14px; background: var(--sim-bg-cell); border-bottom: 6px solid color-mix(in oklab, var(--sim-gold) 55%, var(--sim-stroke)); }
.sc-svg { display: block; width: 100%; max-height: 250px; height: auto; margin: 0 auto; }
.sc-tools { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.sc-tool { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-height: 66px; padding: 4px; border: var(--sim-border); border-radius: 12px; background: var(--sim-bg-surface); }
.sc-tool b { font-family: var(--sim-font-display); font-size: 20px; }
.sc-tool span { font-size: 14px; font-weight: 700; color: var(--sim-label-muted); }
.sc-tool[aria-pressed="true"], .sc-pick .btn[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 1px; background: color-mix(in oklab, var(--sim-accent) 16%, var(--sim-bg-surface)); }
.sc-pick { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 6px; }
.sc-pick .btn { padding: 4px 2px; }
.sc-steps { display: flex; flex-direction: column; gap: 8px; }
.sc-step { display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 4px 12px 4px 6px; border: var(--sim-border); border-radius: 12px; background: var(--sim-bg-surface); font-size: 16px; font-weight: 800; text-align: left; }
.sc-step:disabled { cursor: default; }
.sc-n { display: grid; place-items: center; width: 32px; height: 32px; flex: none; border-radius: 50%; background: var(--sim-track); font-weight: 900; }
.sc-step.is-done { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 14%, var(--sim-bg-surface)); }
.sc-step.is-done .sc-n { background: var(--sim-good); color: var(--sim-bg-deep); }
.sc-res { display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
.gm .sc-go { min-height: 50px; border: 0; border-radius: 12px; font-size: 16px; font-weight: 800; background: var(--sim-accent); color: var(--sim-bg-deep); box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.sc-tag { margin: 0; padding: 6px 10px; border-radius: 12px; border: 2px solid var(--sim-stroke); font-size: 15px; font-weight: 700; line-height: 1.3; }
.sc-tag.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); }
.sc-tag.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface)); }
.sc-benchbox.is-fresh .sc-swing-r { animation: sc-swing-r 1.8s ease-in-out both; }
.sc-benchbox.is-fresh .sc-swing-l { animation: sc-swing-l 1.8s ease-in-out both; }
.sc-whirl { opacity: 0; }
.sc-benchbox.is-fresh .sc-whirl { animation: sc-whirl 1.8s linear both; }
.sc-benchbox.is-fresh .sc-drop { animation: sc-drop 0.8s cubic-bezier(0.5, 0, 0.7, 1) both; }
.sc-benchbox.is-fresh .sc-fade { animation: sc-fade 0.9s ease both 1.2s; }
@keyframes sc-swing-r { 0% { transform: none; } 22%, 78% { transform: rotate(-90deg); } 100% { transform: none; } }
@keyframes sc-swing-l { 0% { transform: none; } 22%, 78% { transform: rotate(90deg); } 100% { transform: none; } }
@keyframes sc-whirl { 0% { opacity: 0; stroke-dashoffset: 0; } 20%, 80% { opacity: 0.9; } 100% { opacity: 0; stroke-dashoffset: -240; } }
@keyframes sc-drop { from { transform: translateY(-80px); opacity: 0.4; } to { transform: none; opacity: 1; } }
@keyframes sc-fade { from { opacity: 0.4; } to { opacity: 1; } }
.sim-dom-root--portrait .sc-board { display: flex; flex-direction: column; gap: 10px; padding-right: 0; }
.sim-dom-root--portrait .sc-benchbox, .sim-dom-root--portrait .sc-ctrl, .sim-dom-root--portrait .sc-res { width: 100%; }
.sim-dom-root--portrait .sc-svg { max-height: 170px; }
@media (prefers-reduced-motion: reduce) { .sc-benchbox.is-fresh * { animation: none; } }
`;
