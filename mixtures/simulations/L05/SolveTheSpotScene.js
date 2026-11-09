/**
 * SolveTheSpotScene - blk-l05-s07, the mini-game. Three cards, each a sample and the number of colour spots it must
 * show. The learner moves the pencil line and the solvent level on the jar, picks a bottle and runs it, and the strip
 * shows what really happened. Each card opens set up the way that card's mistake is made:
 *   Card 1  ink, pencil line under the solvent: the spot dissolves into the jar
 *   Card 2  marigold colour in water: the water climbs past a spot it cannot dissolve
 *   Card 3  fennel dye, pencil line too high: no room to run, so the colours stay as one smear
 * Phone layout from shared/GameFrame.js. Check is the frame's button, once all three cards are done.
 * GameBoard extends withChallenge(DomSimulation).
 */
import { GameBoard, mountGame } from '../shared/GameFrame.js';
import { SIM_LOOK_DOM_CSS, burst } from 'simulations/base/kit/SimLookDom.js';
import { luma } from 'simulations/base/kit/SimLook.js';

const STRIP = 150;
const BASES = [30, 60, 100];     // pencil line heights: low, middle, high
const LEVELS = [18, 44, 74];     // solvent levels: low, middle, high
const GAP = 16;                  // closer than this and two colours read as one smear
const BOTTLES = [
  { id: 'water', name: 'water', tone: '--sim-water' },
  { id: 'alcohol', name: 'alcohol', tone: '--sim-series-2' },
  { id: 'mix', name: 'mixture of solvents', tone: '--sim-series-5' },
  { id: 'salt', name: '2 % salt solution', tone: '--sim-salt' },
];
const ROUNDS = [
  { sample: 'black sketch-pen ink', want: 3, swatch: '--st-ink', base: 0, level: 1, bottle: 'water',
    rf: [0.26, 0.52, 0.82], inks: ['--sim-series-1', '--sim-series-4', '--sim-series-2'], lifts: { water: 1, alcohol: 1, mix: 1, salt: 1 } },
  { sample: 'marigold petal colour', want: 2, swatch: '--sim-series-8', base: 1, level: 0, bottle: 'water',
    rf: [0.42, 0.8], inks: ['--sim-series-8', '--sim-series-2'], lifts: { water: 0, alcohol: 1, mix: 1, salt: 0 } },
  { sample: 'coloured fennel seeds', want: 2, swatch: '--sim-series-5', base: 2, level: 0, bottle: 'water',
    rf: [0.38, 0.72], inks: ['--sim-series-4', '--sim-series-1'], lifts: { water: 1, alcohol: 1, mix: 1, salt: 1 } },
];

/** What one run leaves on the strip. */
function develop(r, s) {
  const base = BASES[s.base], level = LEVELS[s.level];
  if (base <= level) return { marks: [], count: 0, dissolved: true, why: 'The spot was under the solvent, so it dissolved into the jar.' };
  if (!r.lifts[s.bottle]) return { marks: [], count: 1, stuck: true, why: `This solvent climbed past the spot but did not dissolve it.` };
  const room = STRIP - 8 - base;
  const ys = r.rf.map((f) => base + f * room);
  const groups = [];
  ys.forEach((y, i) => {
    const g = groups[groups.length - 1];
    if (g && y - g.y1 < GAP) { g.y1 = y; g.n += 1; } else groups.push({ y0: y, y1: y, n: 1, i });
  });
  const marks = groups.map((g) => ({ tone: g.n > 1 ? null : r.inks[g.i], y: (g.y0 + g.y1) / 2, h: g.y1 - g.y0 }));
  return { marks, count: groups.length, why: groups.length < r.want ? 'The line is so high that the colours ran out of room.' : '' };
}

const Y = (h) => 230 - (h / STRIP) * 200;   // strip units to svg y

function jarSvg(r, s) {
  const v = BOTTLES.find((b) => b.id === s.bottle);
  const base = BASES[s.base], level = LEVELS[s.level], run = s.run;
  const top = Y(STRIP - 8);
  const pool = `<rect x="22" y="${Y(level)}" width="176" height="${236 - Y(level)}" fill="color-mix(in oklab, var(${v.tone}) 45%, transparent)"/>`
    + `<path d="M22 ${Y(level)} H198" stroke="color-mix(in oklab, var(${v.tone}) 80%, var(--sim-label) 10%)" stroke-width="3"/>`;
  const wet = run && !run.dissolved
    ? `<rect class="st-wet" x="86" y="${top}" width="48" height="${Y(level) - top}" fill="color-mix(in oklab, var(${v.tone}) 30%, transparent)"/>` : '';
  let marks = `<ellipse cx="110" cy="${Y(base)}" rx="9" ry="7" fill="var(${r.swatch})"/>`;
  if (run?.dissolved) marks = `<rect class="st-cloud" x="24" y="${Y(level) + 3}" width="172" height="${230 - Y(level)}" fill="color-mix(in oklab, var(${r.swatch}) 25%, transparent)"/>`;
  else if (run && !run.stuck) {
    marks = run.marks.map((m, i) => (m.tone
      ? `<ellipse class="st-mark" style="--i:${i}" cx="110" cy="${Y(m.y)}" rx="18" ry="7" fill="var(${m.tone})"/>`
      : `<rect class="st-mark" style="--i:${i}" x="94" y="${Y(m.y + m.h / 2 + 4)}" width="32" height="${(m.h + 8) * 200 / STRIP}" rx="7" fill="var(${r.swatch})"/>`)).join('');
  }
  return `<svg class="st-jar" viewBox="0 0 220 250" role="img" aria-label="A jar of ${v.name} with a paper strip">
    <ellipse cx="110" cy="244" rx="96" ry="5" fill="color-mix(in oklab, var(--sim-stroke) 45%, transparent)"/>
    <path d="M70 18 H150" stroke="var(--sim-label-muted)" stroke-width="6" stroke-linecap="round"/>
    ${pool}
    <rect x="86" y="${top}" width="48" height="${232 - top}" fill="var(--st-paper)" stroke="color-mix(in oklab, var(--st-paper) 65%, var(--sim-stroke))" stroke-width="2"/>
    <path d="M110 18 V${top}" stroke="var(--sim-label-muted)" stroke-width="2"/>
    ${wet}
    <path d="M88 ${Y(base)} h44" stroke="color-mix(in oklab, var(--st-ink) 65%, var(--st-paper))" stroke-width="2.5"/>
    ${marks}
    <path d="M18 22 V222 a14 14 0 0 0 14 14 H188 a14 14 0 0 0 14 -14 V22" fill="color-mix(in oklab, var(--sim-glass) 8%, transparent)" stroke="color-mix(in oklab, var(--sim-glass) 55%, var(--sim-stroke))" stroke-width="4"/>
    <path d="M30 34 v170" stroke="color-mix(in oklab, var(--sim-glass) 45%, transparent)" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="110" cy="21" rx="100" ry="6" fill="color-mix(in oklab, var(--sim-glass) 25%, transparent)" stroke="color-mix(in oklab, var(--sim-glass) 55%, var(--sim-stroke))" stroke-width="3"/>
  </svg>`;
}

export class SolveTheSpotScene extends GameBoard {
  static ARIA_LABEL = 'A chromatography jar. Each card names a sample and the number of colour spots it must show. Move the pencil line and the solvent level, pick one of four bottles, then run it and count the spots.';
  static PORTRAIT_HEIGHT = 900;   // sim-layout --interact: the tallest state
  static OBJECTIVE = { prompt: { en: 'Keep the spot above the solvent with room to run, choose a solvent that dissolves the sample, and bring up the colour spots the card asks for.' } };

  constructor(container, config) {
    super(container, config);
    this._i = 0;
    this._st = ROUNDS.map((r) => ({ base: r.base, level: r.level, bottle: r.bottle, run: null, fresh: false }));
    this._won = ROUNDS.map(() => false);
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: SIM_LOOK_DOM_CSS + CSS,
      html: `<div class="gm st">
        <div class="gm-head"><p class="kicker">Challenge</p><h2>Make the <b>colour spots</b></h2><p class="sub" id="st-sub"></p></div>
        <div class="st-board" id="st-board"></div></div>`,
    });
    const deep = getComputedStyle(this.root).getPropertyValue('--sim-bg-deep').trim();
    const dark = !deep || luma(deep) < 0.5;
    this.root.style.setProperty('--st-paper', dark ? 'color-mix(in oklab, var(--sim-label) 90%, var(--sim-bg-surface))' : 'var(--sim-bg-surface)');
    this.root.style.setProperty('--st-ink', dark ? 'var(--sim-bg-deep)' : 'var(--sim-label)');
    this.root.querySelector('#st-board')?.addEventListener('click', (e) => {
      const b = e.target.closest?.('[data-act]');
      if (b && !b.disabled) this._act(b.dataset.act, b.dataset.val);
    });
    this._paint();
    this.quill.speak('Run it once and see what goes wrong.', 5200);
  }

  _act(name, value) {
    const i = this._i, r = ROUNDS[i], s = this._st[i];
    if (name === 'next') { this._i = Math.min(ROUNDS.length - 1, i + 1); this._paint(); return; }
    if (this._won[i]) return;
    if (name === 'base') s.base = Math.max(0, Math.min(2, s.base + (value === 'up' ? 1 : -1)));
    else if (name === 'level') s.level = Math.max(0, Math.min(2, s.level + (value === 'up' ? 1 : -1)));
    else if (name === 'bottle') s.bottle = value;
    else if (name === 'run') {
      s.run = develop(r, s);
      s.fresh = true;
      if (s.run.count === r.want && !s.run.stuck && !s.run.dissolved) this._won[i] = true;
      this._paint();
      if (this._won[i]) { burst(this.root.querySelector('.st-jarbox')); this.quill?.perform('hop'); }
      return;
    } else return;
    s.run = null;
    this._paint();
  }

  checkObjective() {
    if (!this._won.every(Boolean)) {
      if (!this._st.some((s) => s.run)) return null;
      return { ok: false, hint: 'Finish all three cards first.' };
    }
    return { ok: true };
  }

  _nudge(act, label, v, lock) {
    return `<div class="st-nudge"><span class="st-k">${label}</span>
      <button type="button" class="tap st-arrow" data-act="${act}" data-val="up" aria-label="${label} up"${v >= 2 || lock ? ' disabled' : ''}>\u25b2</button>
      <button type="button" class="tap st-arrow" data-act="${act}" data-val="down" aria-label="${label} down"${v <= 0 || lock ? ' disabled' : ''}>\u25bc</button></div>`;
  }

  _paint() {
    const i = this._i, r = ROUNDS[i], s = this._st[i], lock = this._won[i];
    const fresh = s.fresh; s.fresh = false;
    const board = this.root.querySelector('#st-board');
    if (!board) return;
    this.root.querySelector('#st-sub').textContent = `Card ${i + 1} of ${ROUNDS.length}. Run it, read the strip, then change the set-up.`;
    const bottles = BOTTLES.map((b) => {
      const on = s.bottle === b.id;
      return `<button type="button" class="tap st-bottle" data-act="bottle" data-val="${b.id}" aria-pressed="${on}" style="--v:var(${b.tone})"${lock ? ' disabled' : ''}>
        <span class="st-flask" aria-hidden="true"></span><span>${b.name}</span></button>`;
    }).join('');
    let res = '<button type="button" class="tap st-go" data-act="run">Run it</button>';
    if (s.run) {
      const n = s.run.count;
      const count = s.run.dissolved ? 'no spots' : s.run.stuck ? 'the spot stayed' : `${n} ${n === 1 ? 'smear' : 'spots'}`;
      if (lock) res = `<p class="st-count">${count}</p><p class="st-tag is-yes">The card asked for ${r.want}.</p>`
        + (i < ROUNDS.length - 1 ? '<button type="button" class="tap st-go" data-act="next">Next card</button>' : '<p class="st-k">All cards done.</p>');
      else res = `<p class="st-count">${count}</p><p class="st-tag is-no">${s.run.why || `The card asks for ${r.want}.`}</p><button type="button" class="tap st-go" data-act="run">Run again</button>`;
    }
    board.innerHTML = `
      <div class="st-col">
        <div class="st-card"><span class="st-dot" style="--t:var(${r.swatch})"></span><span class="st-name">${r.sample}</span><span class="st-want">${r.want} spots</span></div>
        <div class="st-bottles">${bottles}</div>
      </div>
      <div class="st-jarbox${fresh ? ' is-fresh' : ''}">${this._nudge('level', 'Solvent', s.level, lock)}${jarSvg(r, s)}${this._nudge('base', 'Pencil line', s.base, lock)}</div>
      <div class="st-res" aria-live="polite">${res}</div>`;
  }
}

const CSS = `
.gm.st { background: var(--sim-bg-deep); }
.st-board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 330px 390px minmax(0, 1fr); gap: 16px; align-items: start; }
.st-col { display: flex; flex-direction: column; gap: 12px; }
.st-k { font-size: 14px; font-weight: 800; color: var(--sim-label-muted); text-align: center; line-height: 1.15; margin: 0; }
.st-card { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: var(--sim-border); border-radius: 14px; background: var(--sim-bg-surface); box-shadow: 0 var(--sim-lift) 0 var(--sim-stroke); }
.st-dot { flex: none; width: 18px; height: 18px; border-radius: 50%; background: var(--t); border: 2px solid var(--sim-stroke); }
.st-name { flex: 1 1 auto; font-weight: 800; font-size: 16px; line-height: 1.2; }
.st-want { flex: none; font-family: var(--sim-font-display); font-size: 20px; font-weight: 700; color: var(--sim-accent); }
.st-bottles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.st-bottle { display: flex; align-items: center; gap: 8px; min-height: 64px; padding: 6px 8px; text-align: left; font-size: 15px; font-weight: 700; line-height: 1.15;
  background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 12px; }
.st-bottle[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 1px; background: color-mix(in oklab, var(--v) 16%, var(--sim-bg-surface)); }
.st-flask { flex: none; position: relative; width: 26px; height: 40px; border-radius: 8px 8px 7px 7px; overflow: hidden; border: 2px solid color-mix(in oklab, var(--sim-glass) 55%, var(--sim-stroke));
  background: linear-gradient(to top, color-mix(in oklab, var(--v) 70%, var(--sim-bg-surface)) 66%, transparent 66%); }
.st-jarbox { display: grid; grid-template-columns: 56px minmax(0, 1fr) 56px; gap: 4px; align-items: center; padding: 4px; border-radius: 14px; background: var(--sim-bg-cell);
  border-bottom: 6px solid color-mix(in oklab, var(--sim-gold) 55%, var(--sim-stroke)); }
.st-jar { display: block; width: 100%; height: auto; max-height: 280px; }
.st-nudge { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.st-arrow { width: 50px; height: 48px; padding: 0; font-size: 16px; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 10px; }
.st-arrow:disabled { opacity: 0.35; cursor: default; }
.st-res { display: flex; flex-direction: column; align-items: stretch; gap: 8px; padding-top: 8px; }
.gm .st-go { min-height: 50px; border: 0; border-radius: 12px; font-size: 17px; font-weight: 800; background: var(--sim-accent); color: var(--sim-bg-deep);
  box-shadow: 0 var(--sim-lift) 0 color-mix(in oklab, var(--sim-accent) 65%, var(--sim-label)); }
.st-count { margin: 0; font-family: var(--sim-font-display); font-size: 28px; font-weight: 700; text-align: center; }
.st-tag { margin: 0; padding: 6px 10px; border-radius: 12px; border: 2px solid var(--sim-stroke); font-size: 15px; font-weight: 700; line-height: 1.3; }
.st-tag.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); }
.st-tag.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface)); }
.st-jarbox.is-fresh .st-wet { animation: st-climb 1s ease both; transform-box: fill-box; transform-origin: 50% 100%; }
.st-jarbox.is-fresh .st-mark { animation: st-rise 1s ease both; animation-delay: calc(0.1s + var(--i) * 0.06s); }
.st-jarbox.is-fresh .st-cloud { animation: st-in 0.9s ease both; }
@keyframes st-climb { from { transform: scaleY(0.05); } to { transform: none; } }
@keyframes st-rise { from { opacity: 0; transform: translateY(36px); } to { opacity: 1; transform: none; } }
@keyframes st-in { from { opacity: 0; } to { opacity: 1; } }
.sim-dom-root--portrait .q-sparks, .sim-dom-root--portrait .q-dots { display: none; }
.sim-dom-root--portrait .st-board { display: flex; flex-direction: column; gap: 10px; }
.sim-dom-root--portrait .st-col, .sim-dom-root--portrait .st-jarbox, .sim-dom-root--portrait .st-res { width: 100%; }
.sim-dom-root--portrait .st-res { padding-top: 0; }
@media (prefers-reduced-motion: reduce) { .st-jarbox.is-fresh * { animation: none; } }
`;
