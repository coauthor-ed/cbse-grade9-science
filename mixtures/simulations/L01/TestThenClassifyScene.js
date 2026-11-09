/**
 * TestThenClassifyScene - blk-l01-s06, "test it, then name it" (mini-game@1, beat-less).
 *
 * Five unlabelled jars, one at a time, on the phone layout in shared/GameFrame.js. For each jar the learner
 *   1. guesses from the look: homogeneous or heterogeneous;
 *   2. runs the tests they choose (ten minutes, filter paper, laser; a hand lens for the dry jar);
 *   3. files the jar. A wrong bin names the test that shows why; a test not yet run is named as the next thing to try.
 * Jar 3 is the point of the game: diluted milk looks like the chalk jar, passes the clock and the paper, and only the
 * laser shows it is heterogeneous. A lump of sugar was dropped from the old set: it is a pure substance, so neither
 * word for a mixture fits it. No timer, no penalty. CSS only. GameBoard extends withChallenge(DomSimulation).
 */
import { GameBoard, mountGame } from '../shared/GameFrame.js';
import { esc } from 'simulations/base/SimUi.js';
import { burst } from 'simulations/base/kit/SimLookDom.js';
import { rng } from 'simulations/base/kit/shuffle.js';

/* ------------------------------------------------------------------ data */

const TESTS = {
  settle: { label: 'Leave it 10 minutes', short: 'clock' },
  filter: { label: 'Pour through paper', short: 'filter paper' },
  beam: { label: 'Send the laser through', short: 'laser' },
  lens: { label: 'Look with a hand lens', short: 'hand lens' },
};
/** The second item in each result is true when the test found something. */
const SAMPLES = [
  { key: 's1', liquid: true, look: 'clear', truth: 'same', tone: '--sim-water', name: 'salt water',
    res: { settle: ['no change', false], filter: ['nothing left', false], beam: ['no path', false] } },
  { key: 's2', liquid: true, look: 'cloudy', truth: 'other', tone: '--sim-ice', specks: true, name: 'chalk in water',
    res: { settle: ['white layer settles', true], filter: ['white layer left', true], beam: ['bright path', true] } },
  { key: 's3', liquid: true, look: 'cloudy', truth: 'other', tone: '--sim-ice', name: 'milk in water',
    res: { settle: ['no change', false], filter: ['nothing left, still cloudy', false], beam: ['bright path', true] } },
  { key: 's4', liquid: true, look: 'clear blue', truth: 'same', tone: '--sim-series-1', name: 'copper sulfate in water',
    res: { settle: ['no change', false], filter: ['nothing left', false], beam: ['no path', false] } },
  { key: 's6', liquid: false, look: 'grey powder', truth: 'other', tone: '--sim-waste', name: 'salt and sand',
    res: { lens: ['white and brown grains', true] } },
];
const BIN = { same: 'Homogeneous', other: 'Heterogeneous' };
const MARK = { yes: '\u2713', no: '\u2717' };
const testsOf = (s) => (s.liquid ? ['settle', 'filter', 'beam'] : ['lens']);

/* ------------------------------------------------------------- drawings */

function jarSvg(s, st) {
  const ran = st.ran;
  const r = rng(s.key.charCodeAt(1) * 7);
  let body = '';
  if (s.liquid) {
    const settled = ran.settle && s.specks;
    const fill = s.look === 'cloudy'
      ? `color-mix(in oklab, var(--sim-ice) ${settled ? 15 : 78}%, color-mix(in oklab, var(--sim-water) 30%, transparent))`
      : `color-mix(in oklab, var(${s.tone}) ${s.look === 'clear blue' ? 60 : 38}%, transparent)`;
    body += `<path d="M44 70 V196 a10 10 0 0 0 10 10 H126 a10 10 0 0 0 10 -10 V70 Z" fill="${fill}" class="${st.fresh === 'settle' ? 'tc-fade' : ''}"/>`;
    if (s.specks) {
      for (let i = 0; i < 26; i++) {
        const x = 52 + r() * 76;
        const y = settled ? 198 - r() * 8 : 80 + r() * 116;
        body += `<circle class="${settled && st.fresh === 'settle' ? 'tc-sink' : ''}" style="--i:${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="var(--sim-ice)" stroke="var(--sim-stroke)" stroke-width="1"/>`;
      }
    }
    if (ran.beam) {
      const seen = s.res.beam[1];
      body += '<path d="M4 132 H40" stroke="var(--sim-error)" stroke-width="3"/>';
      if (seen) body += `<g class="${st.fresh === 'beam' ? 'tc-beam' : ''}"><path d="M44 132 H136" stroke="var(--sim-error)" stroke-width="12" opacity="0.28"/><path d="M44 132 H136" stroke="var(--sim-error)" stroke-width="4"/></g>`;
      body += `<path d="M140 132 H176" stroke="var(--sim-error)" stroke-width="3"${seen ? '' : ' stroke-dasharray="4 4"'}/>`;
    }
    if (ran.settle) body += '<g transform="translate(150 40)"><circle r="16" fill="var(--sim-bg-surface)" stroke="var(--sim-stroke)" stroke-width="2.5"/><path d="M0 -9 V0 l7 5" stroke="var(--sim-label)" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>';
    body += '<path d="M36 52 h8 V196 a10 10 0 0 0 10 10 H126 a10 10 0 0 0 10 -10 V52 h8" fill="none" stroke="var(--sim-stroke)" stroke-width="3.5" stroke-linejoin="round"/>'
      + '<path d="M54 80 v100" stroke="color-mix(in oklab, var(--sim-ice) 45%, transparent)" stroke-width="5" stroke-linecap="round"/>';
  } else {
    for (let i = 0; i < 70; i++) {
      const x = 50 + r() * 80;
      const y = 170 + r() * 26 - (Math.abs(x - 90) < 30 ? r() * 18 : 0);
      body += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="var(${i % 3 ? '--sim-ice' : '--sim-strata-2'})" stroke="var(--sim-stroke)" stroke-width="0.6"/>`;
    }
    body += '<path d="M40 200 h100" stroke="var(--sim-stroke)" stroke-width="3"/>';
  }
  const laser = s.liquid ? '<g><rect x="0" y="122" width="20" height="20" rx="4" fill="var(--sim-surface-raised)" stroke="var(--sim-stroke)" stroke-width="2"/></g>' : '';
  return `<svg class="tc-jar" viewBox="0 0 180 214" aria-hidden="true"><ellipse cx="90" cy="210" rx="64" ry="4" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>${laser}${body}</svg>`;
}

function paperSvg(s, st) {
  const caught = s.res.filter[1];
  const milky = s.key === 's3';
  return `<svg class="tc-paper${st.fresh === 'filter' ? ' is-fresh' : ''}" viewBox="0 0 120 110" aria-hidden="true">
    <path d="M10 8 h100 l-42 46 v16 h-16 v-16 Z" fill="color-mix(in oklab, var(--sim-label) 10%, var(--sim-bg-surface))" stroke="var(--sim-stroke)" stroke-width="2.5" stroke-linejoin="round"/>
    ${caught ? '<path d="M34 16 h52 l-22 24 h-8 Z" fill="var(--sim-ice)" stroke="var(--sim-stroke)" stroke-width="1"/>' : ''}
    <path d="M36 76 h48 v24 a5 5 0 0 1 -5 5 H41 a5 5 0 0 1 -5 -5 Z" fill="none" stroke="var(--sim-stroke)" stroke-width="2.5"/>
    <path class="tc-filtrate" d="M38 88 h44 v12 a4 4 0 0 1 -4 4 H42 a4 4 0 0 1 -4 -4 Z" fill="${milky ? 'var(--sim-ice)' : `color-mix(in oklab, var(${s.tone}) 45%, transparent)`}"/>
  </svg>`;
}

function lensSvg(s) {
  const r = rng(13);
  let g = '';
  for (let i = 0; i < 14; i++) {
    const x = 22 + r() * 56;
    const y = 22 + r() * 56;
    const two = s.key === 's6' && i % 3 === 0;
    g += `<path d="M${x.toFixed(1)} ${(y - 6).toFixed(1)} l6 6 -6 6 -6 -6 Z" fill="var(${two ? '--sim-strata-2' : '--sim-ice'})" stroke="var(--sim-stroke)" stroke-width="1"/>`;
  }
  return `<svg class="tc-lens" viewBox="0 0 120 110" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="var(--sim-bg-cell)"/>${g}`
    + '<circle cx="50" cy="50" r="42" fill="none" stroke="var(--sim-stroke)" stroke-width="5"/><path d="M80 80 l26 26" stroke="var(--sim-strata-2)" stroke-width="9" stroke-linecap="round"/></svg>';
}

/* ------------------------------------------------------------- the scene */

export class TestThenClassifyScene extends GameBoard {
  static PORTRAIT_HEIGHT = 900;   // sim-layout --interact: the tallest state
  static ARIA_LABEL =
    'Five unlabelled jars. Guess from the look, run the tests you choose (ten minutes, filter paper, a laser, or a hand lens '
    + 'for a dry sample), then put each jar in the homogeneous or heterogeneous bin. The tests decide.';
  static OBJECTIVE = {
    prompt: { en: 'Guess from the look, then test each jar and put it in a bin. The tests decide, not the look.' },
  };
  static SCORING = { mode: 'accuracy', tolerance: 0, maxAttempts: Infinity };

  constructor(container, config) {
    super(container, config);
    this._i = 0;
    this._st = SAMPLES.map(() => ({ guess: null, ran: {}, filed: null, why: null, fresh: null }));
    this._won = SAMPLES.map(() => false);
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `<div class="gm tc">
        <div class="tc-top">
          <div class="gm-head"><p class="kicker">Test it, then name it</p><h2 id="tc-title"></h2></div>
          <div class="tc-jars" id="tc-jars" role="group" aria-label="Jars"></div>
        </div>
        <div class="tc-board" id="tc-board"></div>
      </div>`,
    });
    this._board = this.root.querySelector('#tc-board');
    this.root.addEventListener('click', this._onClick = (e) => {
      const b = e.target instanceof Element ? e.target.closest('[data-act]') : null;
      if (b && !b.disabled) this._act(b.dataset.act, b.dataset.val);
    });
    this._paint();
    this.quill.speak('Guess first. Then let the tests decide.', 5200);
  }

  destroy() {
    this.root?.removeEventListener('click', this._onClick);
    super.destroy();
  }

  _act(name, value) {
    const i = this._i;
    const s = SAMPLES[i];
    const st = this._st[i];
    let key = `${name}:${value}`;
    if (name === 'jar') {
      const n = Number(value);
      if (n === 0 || this._won[n - 1] || this._won[n]) this._i = n;
    } else if (name === 'next') {
      this._i = Math.min(SAMPLES.length - 1, i + 1);
      key = 'jar:' + this._i;
    } else if (this._won[i]) {
      return;
    } else if (name === 'guess') {
      if (!st.guess && BIN[value]) st.guess = value;
    } else if (name === 'test') {
      if (!st.guess || st.ran[value] || !testsOf(s).includes(value)) return;
      st.ran[value] = true;
      st.fresh = value;
      st.why = null;
    } else if (name === 'file') {
      if (!Object.keys(st.ran).length || !BIN[value]) return;
      st.filed = value;
      if (value === s.truth) this._fileRight(i);
      else { st.why = this._why(s, st, value); this.quill?.setExpression('surprised'); }
    }
    this._paint();
    st.fresh = null;
    if (name === 'file' && this._won[i]) burst(this._board, 18, this._board.querySelector('.tc-jarbox'));
    this.root.querySelector(`[data-key="${key}"]`)?.focus?.();
  }

  _fileRight(i) {
    this._won[i] = true;
    this._st[i].why = null;
    this.quill?.perform('hop');
    if (SAMPLES[i].key === 's3') this.quill?.speak('The look said chalk. The laser and the paper said no.', 5200);
  }

  /** Why a filing is wrong: a result already seen, or the test that would show it. */
  _why(s, st, bin) {
    const tests = testsOf(s);
    if (bin === 'same') {
      const shown = tests.find((t) => st.ran[t] && s.res[t][1]);
      if (shown) return `Your own test says "${s.res[shown][0]}". A solution would not show that.`;
      const hidden = tests.find((t) => s.res[t][1]);
      return `Try the ${TESTS[hidden].short}. It finds something the other tests missed.`;
    }
    return 'Every test found nothing. Nothing settled, nothing stayed on the paper, and no beam path showed.';
  }

  checkObjective() {
    if (!this._st.some((st) => st.filed)) return null;
    const open = this._won.findIndex((w) => !w);
    if (open < 0) { this.quill?.perform('hop'); return { ok: true }; }
    return { ok: false, hint: `Jar ${open + 1} is not in the right bin yet.` };
  }

  /* ---------------------------------------------------------------- paint */

  _paint() {
    const i = this._i;
    const s = SAMPLES[i];
    const st = this._st[i];
    const won = this._won[i];
    if (!this._board) return;                   // the headless check has no parser
    this.root.querySelector('#tc-title').innerHTML = `Jar <b>${i + 1}</b> of ${SAMPLES.length}${won ? `: ${esc(s.name)}` : ''}`;
    this.root.querySelector('#tc-jars').innerHTML = SAMPLES.map((_, n) => {
      const open = n === 0 || this._won[n - 1] || this._won[n];
      const cls = `tap btn tc-dot${n === i ? ' is-on' : ''}${this._won[n] ? ' is-yes' : ''}`;
      return `<button type="button" class="${cls}" data-act="jar" data-val="${n}" data-key="jar:${n}"${open ? '' : ' disabled'} aria-label="Jar ${n + 1}"${n === i ? ' aria-current="true"' : ''}>${n + 1}</button>`;
    }).join('');

    const extras = `${st.ran.filter ? paperSvg(s, st) : ''}${st.ran.lens ? lensSvg(s) : ''}`;
    const jar = `<div class="tc-jarbox"><div class="tc-jarrow">${jarSvg(s, st)}${extras ? `<div class="tc-extras">${extras}</div>` : ''}</div>`
      + `<span class="tc-k">${esc(s.liquid ? `Looks ${s.look}` : `A dry ${s.look}`)}</span></div>`;

    const g = (v) => {
      const mine = st.guess === v;
      const cls = won && mine ? (v === s.truth ? ' is-yes' : ' is-no') : mine ? ' is-on' : '';
      return `<button type="button" class="tap btn tc-guess${cls}" data-act="guess" data-val="${v}" data-key="guess:${v}"${st.guess && !mine ? ' disabled' : ''}>${esc(BIN[v])}</button>`;
    };
    const tests = testsOf(s).map((t) => {
      const done = st.ran[t];
      const [text, found] = s.res[t];
      return `<div class="tc-test"><button type="button" class="tap btn tc-tbtn" data-act="test" data-val="${t}" data-key="test:${t}"${!st.guess || done || won ? ' disabled' : ''}>${esc(TESTS[t].label)}</button>`
        + `<span class="tc-res${done ? (found ? ' is-found' : ' is-none') : ''}">${done ? esc(text) : '?'}</span></div>`;
    }).join('');
    const mid = `<div class="tc-col"><span class="tc-k"><span class="tc-n">1</span>From the look, I think it is</span><div class="tc-two">${g('same')}${g('other')}</div>`
      + `<span class="tc-k"><span class="tc-n">2</span>Test it</span>${tests}</div>`;

    const any = Object.keys(st.ran).length > 0;
    const bin = (v) => `<button type="button" class="tap btn tc-bin${st.filed === v ? (won ? ' is-yes' : ' is-no') : ''}" data-act="file" data-val="${v}" data-key="file:${v}"${!any || won ? ' disabled' : ''}>${esc(BIN[v])}</button>`;
    let foot = '';
    if (won) {
      const fooled = st.guess !== s.truth;
      foot = `<span class="tc-tag is-yes">${MARK.yes} ${fooled ? 'The look fooled you, but the tests did not.' : 'Your guess was right, and now it is tested.'}</span>`
        + (i < SAMPLES.length - 1 ? '<button type="button" class="tap btn tc-next" data-act="next" data-val="" data-key="next:">Next jar</button>' : '');
    } else if (st.why) foot = `<span class="tc-tag is-no">${MARK.no} ${esc(st.why)}</span>`;
    else if (!any) foot = '<span class="tc-k">The bins open after one test</span>';
    const right = `<div class="tc-col tc-last"><span class="tc-k"><span class="tc-n">3</span>Put it in a bin</span><div class="tc-two">${bin('same')}${bin('other')}</div><div class="tc-foot" aria-live="polite">${foot}</div></div>`;

    this._board.innerHTML = `${jar}${mid}${right}`;
    this.relayout?.();
  }
}

const CSS = `
.sim-dom-root--portrait .q-sparks, .sim-dom-root--portrait .q-dots { display: none; }
.gm.tc { background: var(--sim-bg-deep); border-radius: 14px; }
.tc .tc-top { display: flex; align-items: flex-start; gap: 16px; padding-right: 60px; }
.tc .gm-head { flex: 0 0 400px; min-width: 0; }
.tc .tc-jars { display: flex; gap: 6px; flex: none; }
.tc .tc-dot { width: 46px; padding: 0; font-family: var(--sim-font-display); font-size: 18px; }
.tc .tc-dot.is-on { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); }
.tc .tc-dot.is-yes { border-color: var(--sim-good); }
.tc .tc-dot:disabled { opacity: 0.45; cursor: default; }
.tc .tc-board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 250px minmax(0, 1fr) 350px; gap: 14px; align-items: start; }
.tc .tc-k { display: inline-flex; align-items: center; gap: 6px; font-weight: 800; font-size: 15px; color: var(--sim-label-muted); }
.tc .tc-n { display: grid; place-items: center; width: 24px; height: 24px; flex: none; border-radius: 50%; background: var(--sim-accent); color: var(--sim-bg-deep); font-weight: 900; }
.tc .tc-jarbox { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px; border-radius: 14px;
  background: var(--sim-bg-surface); border: var(--sim-border); }
.tc .tc-jarrow { display: flex; align-items: flex-end; justify-content: center; gap: 4px; width: 100%; }
.tc .tc-jar { display: block; width: 100%; max-width: 200px; height: auto; flex: 1 1 auto; min-width: 0; max-height: 228px; }
.tc .tc-extras { display: flex; flex-direction: column; gap: 4px; flex: 0 0 36%; }
.tc .tc-paper, .tc .tc-lens { display: block; width: 100%; height: auto; }
.tc .tc-paper.is-fresh .tc-filtrate { animation: tc-rise 0.8s ease 0.2s both; transform-box: fill-box; transform-origin: 50% 100%; }
.tc .tc-col { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.tc .tc-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.tc .btn:disabled { cursor: default; box-shadow: none; opacity: 0.55; }
.tc .tc-guess.is-on { opacity: 1; border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); }
.tc .tc-guess.is-yes, .tc .tc-bin.is-yes { opacity: 1; border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); }
.tc .tc-guess.is-no, .tc .tc-bin.is-no { opacity: 1; border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 16%, var(--sim-bg-surface)); }
.tc .tc-test { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); align-items: center; gap: 8px; }
.tc .tc-tbtn { text-align: left; font-size: 15px; line-height: 1.15; }
.tc .tc-test .tc-tbtn:disabled { opacity: 0.7; }
.tc .tc-res { font-weight: 800; font-size: 15px; line-height: 1.2; color: var(--sim-label-muted); }
.tc .tc-res.is-found { color: var(--sim-label); padding: 2px 6px; border-radius: 8px; background: color-mix(in oklab, var(--sim-series-5) 18%, var(--sim-bg-surface)); border-left: 4px solid var(--sim-series-5); }
.tc .tc-res.is-none { color: var(--sim-label); }
.tc .tc-bin { min-height: 62px; font-family: var(--sim-font-display); font-size: 16px; padding: 4px; }
.tc .tc-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-height: 48px; }
.tc .tc-tag { padding: 4px 8px; border-radius: 10px; border: 2px solid var(--sim-stroke); font-weight: 800; font-size: 15px; line-height: 1.25; }
.tc .tc-tag.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); }
.tc .tc-tag.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface)); }
.tc .tc-next { padding: 6px 18px; border-color: var(--sim-accent); }
.tc .tc-sink { animation: tc-sink 0.8s cubic-bezier(0.5, 0, 0.7, 1) both; animation-delay: calc(var(--i) * 20ms); }
.tc .tc-fade, .tc .tc-beam { animation: tc-fade 0.6s ease both; }
@keyframes tc-sink { from { transform: translateY(-90px); } to { transform: none; } }
@keyframes tc-fade { from { opacity: 0.3; } to { opacity: 1; } }
@keyframes tc-rise { from { transform: scaleY(0); } to { transform: none; } }
.sim-dom-root--portrait .tc .tc-top { display: block; padding-right: 0; }
.sim-dom-root--portrait .tc .gm-head { flex: none; }
.sim-dom-root--portrait .tc .tc-jars { margin-top: 6px; justify-content: space-between; }
.sim-dom-root--portrait .tc .tc-dot { width: 48px; }
.sim-dom-root--portrait .tc .tc-board { display: flex; flex-direction: column; gap: 10px; align-items: stretch; }
.sim-dom-root--portrait .tc .tc-jar { max-height: 190px; }
.sim-dom-root--portrait .tc .tc-tbtn { font-size: 14px; }
@media (prefers-reduced-motion: reduce) {
  .tc .tc-sink, .tc .tc-fade, .tc .tc-beam, .tc .tc-paper.is-fresh .tc-filtrate { animation: none; }
}
`;
