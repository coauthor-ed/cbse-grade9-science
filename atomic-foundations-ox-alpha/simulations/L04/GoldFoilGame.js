import { GameBoard, mountGame, onTap } from '../shared/GameFrame.js';

/**
 * GoldFoilGame - mini-game for les-04, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). Rutherford's foil showed that almost all alpha
 * particles pass straight through, a few turn aside and a very few come back.
 * Nine particles fly at the foil, each in its own lane. The student picks where
 * each one goes: lanes far from the nucleus go straight through, the lanes close
 * to it turn aside, and the one aimed straight at it comes back. When all nine
 * are right, the picture is the result itself: most through, a few aside, one back.
 *
 * The wrong attractor is the Thomson answer, that everything goes through. The
 * lesson's reason is the one the game rewards: only a particle that comes very
 * close to the tiny nucleus gets a strong push.
 *
 * All taps: on a phone a picture of 30 drag handles is unusable, and the lanes
 * make each choice a reasoned one rather than a matter of filling a quota.
 */

const LANES = 9;
const NUCLEUS_LANE = 3;      // lane 4 as the learner counts them
const SVG_W = 320, SVG_H = 214;
const FOIL_X = 150, FOIL_W = 12;
const LANE_X = 24;
const laneY = (i) => 34 + i * 20;
const NUCLEUS = { x: FOIL_X + FOIL_W / 2, y: laneY(NUCLEUS_LANE), r: 4.5 };

const OUTCOMES = [
  { id: 'through', label: 'Straight through', short: 'Through', tone: 'var(--sim-good)' },
  { id: 'aside',   label: 'Turned aside',     short: 'Aside',   tone: 'var(--sim-gold)' },
  { id: 'back',    label: 'Bounced back',     short: 'Back',    tone: 'var(--sim-bad)' },
];
const outcome = (id) => OUTCOMES.find((o) => o.id === id);

function answerFor(i) {
  const gap = Math.abs(i - NUCLEUS_LANE);
  if (gap === 0) return 'back';
  return gap === 1 ? 'aside' : 'through';
}

/** The path of particle i if it does what the student picked. */
function trail(i, pick) {
  const y = laneY(i);
  const away = i < NUCLEUS_LANE ? -1 : 1;     // pushed away from the nucleus
  const hit = FOIL_X + FOIL_W / 2;
  if (pick === 'through') return `M ${LANE_X} ${y} L ${SVG_W - 8} ${y}`;
  if (pick === 'aside') return `M ${LANE_X} ${y} L ${hit} ${y} L ${SVG_W - 16} ${y + away * 34}`;
  return `M ${LANE_X} ${y} L ${FOIL_X - 2} ${y} L ${LANE_X + 8} ${y + 18}`;
}

const CSS = `
.gf .board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 454px minmax(0, 1fr); gap: 14px; align-items: start; }
.gf svg { width: 100%; height: auto; display: block; background: var(--sim-bg-deep); border-radius: 14px; }
.gf svg text { fill: var(--sim-label-muted); font-size: 14px; font-weight: 700; }
.gf svg text.on { fill: var(--sim-accent); font-weight: 800; }
.gf .panel { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.gf .ask { font-size: 16px; font-weight: 800; margin: 0; min-height: 22px; }
.gf .dests { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.gf .dest { line-height: 1.15; min-height: 56px; }
.gf .chips { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); gap: 6px; }
.gf .chip { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 12px; font-size: 16px; font-weight: 800; padding: 0; }
.gf .chip[data-pick] { background: color-mix(in oklab, var(--tone) 22%, var(--sim-bg-surface)); border-color: var(--tone); }
.gf .chip[aria-pressed="true"] { outline: 3px solid var(--sim-accent); outline-offset: 1px; }
.gf .tally { display: flex; gap: 14px; font-size: 15px; color: var(--sim-label-muted); flex-wrap: wrap; }
.gf .tally b { color: var(--sim-label); font-variant-numeric: tabular-nums; }
.gf .note { font-size: 15px; line-height: 1.3; color: var(--sim-label-muted); margin: 0; }
.gf .note.won { color: var(--sim-good); font-weight: 800; }

.sim-dom-root--portrait .gf .board { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .gf .chips { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.sim-dom-root--portrait .gf svg, .sim-dom-root--portrait .gf .panel { width: 100%; }
`;

export class GoldFoilGame extends GameBoard {
  static simId = 'gold-foil-game';
  static label = { en: 'The Mostly-Empty Atom' };
  static category = 'science.physics';
  static ARIA_LABEL =
    'Nine alpha particles fly at gold foil in nine lanes, and one lane is aimed at the nucleus. Pick where each particle goes: straight through, turned aside, or bounced back.';
  static OBJECTIVE = {
    prompt: { en: 'Nine alpha particles fly at the gold foil. Pick where each one goes.' },
  };

  constructor(container, config) {
    super(container, config);
    this.picks = Array(LANES).fill(null);
    this.sel = 0;
    this._won = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `
        <div class="gm gf">
          <div class="gm-head">
            <p class="kicker">Geiger and Marsden, 1911</p>
            <h2>Where does each <b>alpha particle</b> go?</h2>
            <p class="sub">The dot in the foil is one gold nucleus. A particle turns only if it comes very close to it.</p>
          </div>
          <div class="board">
            <svg viewBox="0 0 ${SVG_W} ${SVG_H}" role="img" aria-label="Nine lanes of alpha particles heading for gold foil">
              <text x="${FOIL_X + FOIL_W / 2}" y="16" text-anchor="middle">gold foil</text>
              <rect x="${FOIL_X}" y="24" width="${FOIL_W}" height="${SVG_H - 34}" fill="var(--sim-series-1)" opacity="0.35" stroke="var(--sim-series-1)" stroke-width="1"></rect>
              <g id="gf-lanes"></g>
              <circle cx="${NUCLEUS.x}" cy="${NUCLEUS.y}" r="${NUCLEUS.r + 3}" fill="var(--sim-accent)" opacity="0.35"></circle>
              <circle cx="${NUCLEUS.x}" cy="${NUCLEUS.y}" r="${NUCLEUS.r}" fill="var(--sim-accent)"></circle>
            </svg>
            <div class="panel">
              <p class="ask" id="gf-ask" aria-live="polite"></p>
              <div class="dests">
                ${OUTCOMES.map((o) => `<button class="tap btn dest" type="button" data-to="${o.id}">${o.label}</button>`).join('')}
              </div>
              <div class="chips">
                ${this.picks.map((_, i) => `<button class="tap chip" type="button" data-i="${i}" aria-label="Particle ${i + 1}">${i + 1}</button>`).join('')}
              </div>
              <div class="tally">${OUTCOMES.map((o) => `<span>${o.short} <b id="gf-${o.id}">0</b></span>`).join('')}</div>
              <p class="note" id="gf-note">The nucleus is drawn far too big, and the lanes are not to scale.</p>
            </div>
          </div>
        </div>`,
    });
    this.root.querySelectorAll('.dest').forEach((b) => onTap(b, () => this._pick(b.dataset.to)));
    this.root.querySelectorAll('.chip').forEach((b) => onTap(b, () => { this.sel = Number(b.dataset.i); this._render(); }));
    this._render();
    this.quill.speak('Far from the nucleus, nothing turns it.', 5200);
  }

  _pick(to) {
    this.picks[this.sel] = to;
    const next = this.picks.findIndex((p, i) => p === null && i > this.sel);
    const any = this.picks.indexOf(null);
    this.sel = next >= 0 ? next : (any >= 0 ? any : this.sel);
    this._render();
  }

  _render() {
    const lanes = this.picks.map((pick, i) => {
      const y = laneY(i);
      const on = i === this.sel;
      const line = pick
        ? `<path d="${trail(i, pick)}" stroke="${outcome(pick).tone}" stroke-width="${on ? 3 : 2}" fill="none" stroke-linejoin="round"></path>`
        : `<line x1="${LANE_X}" y1="${y}" x2="${FOIL_X - 2}" y2="${y}" stroke="var(--sim-stroke)" stroke-width="${on ? 2.5 : 1.5}" stroke-dasharray="4 4"></line>`;
      return `
        <text x="12" y="${y + 5}" text-anchor="middle" class="${on ? 'on' : ''}">${i + 1}</text>
        ${line}
        <circle cx="${LANE_X}" cy="${y}" r="${on ? 5 : 3.5}" fill="${on ? 'var(--sim-accent)' : 'var(--sim-series-4)'}"></circle>`;
    }).join('');
    this.root.querySelector('#gf-lanes').innerHTML = lanes;

    this.root.querySelectorAll('.chip').forEach((b) => {
      const pick = this.picks[Number(b.dataset.i)];
      b.setAttribute('aria-pressed', Number(b.dataset.i) === this.sel ? 'true' : 'false');
      if (pick) {
        b.dataset.pick = pick;
        b.style.setProperty('--tone', outcome(pick).tone);
        b.setAttribute('aria-label', `Particle ${Number(b.dataset.i) + 1}: ${outcome(pick).label}`);
      }
    });
    for (const o of OUTCOMES) {
      this.root.querySelector(`#gf-${o.id}`).textContent = String(this.picks.filter((p) => p === o.id).length);
    }
    const left = this.picks.filter((p) => p === null).length;
    this.root.querySelector('#gf-ask').textContent = left
      ? `Where does particle ${this.sel + 1} go?`
      : 'All nine are placed. Tap a number to change one.';
  }

  checkObjective() {
    if (this.picks.includes(null)) return null;
    const wrong = this.picks.map((p, i) => (p === answerFor(i) ? -1 : i)).filter((i) => i >= 0);
    if (wrong.length === 0) {
      this.quill?.perform('hop');
      const note = this.root.querySelector('#gf-note');
      note.textContent = 'Most went through, a few turned aside, and one came back. In the real experiment only about 1 in 8000 came back.';
      note.classList.add('won');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    const i = wrong.includes(NUCLEUS_LANE) ? NUCLEUS_LANE : wrong[0];
    this.sel = i;
    this._render();
    const n = i + 1;
    if (answerFor(i) === 'back') return { ok: false, hint: `Particle ${n} flies straight at the nucleus. Positive pushes positive, and the push is strong enough to send it back.` };
    if (answerFor(i) === 'aside') return { ok: false, hint: `Particle ${n} passes very close to the nucleus, so it gets a strong push, but not head-on.` };
    return { ok: false, hint: `Particle ${n} passes far from the nucleus. Most of an atom is empty space, so nothing turns it.` };
  }
}
