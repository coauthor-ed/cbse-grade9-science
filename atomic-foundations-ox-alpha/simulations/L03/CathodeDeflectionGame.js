import { GameBoard, mountGame, onTap } from '../shared/GameFrame.js';

/**
 * CathodeDeflectionGame - mini-game for les-03, hosted by mini-game@1.
 *
 * Tie level L2 (embodiment). The lesson's claim is that a cathode ray bends in
 * an electric field, and that the only particle light enough to bend that much
 * is the electron. The student fires five candidates (charged gold, oxygen and
 * hydrogen atoms, the electron, and light) between a pair of charged plates and
 * identifies the one that bends the way the cathode ray does.
 *
 * The candidates use only what L03 has taught: protons and alpha particles come
 * in L04-L05. The wrong attractor is "a charged gas atom": a charged hydrogen
 * atom looks close to a cathode ray, but it is 1836 times heavier than an
 * electron, so it barely bends. m below is in units of a hydrogen atom.
 */

const PARTICLES = [
  { id: 'gold',     name: 'Charged Au atom', q:  1, m: 197,      color: 'var(--sim-series-1)', charge: '+1' },
  { id: 'oxygen',   name: 'Charged O atom',  q:  1, m: 16,       color: 'var(--sim-series-2)', charge: '+1' },
  { id: 'hion',     name: 'Charged H atom',  q:  1, m: 1,        color: 'var(--sim-series-3)', charge: '+1' },
  { id: 'electron', name: 'Electron',        q: -1, m: 1 / 1836, color: 'var(--sim-accent)',   charge: '-1' },
  { id: 'photon',   name: 'Light',           q:  0, m: 1e-9,     color: 'var(--sim-gold)',     charge: '0'  },
];

/** Drop in svg units at the far end. Plus is up, so negative charge bends up, towards the + plate.
 *  Not to scale: an atom's true bend would be under a pixel, so atoms are shown barely bending. */
function deflection(p) {
  if (p.q === 0) return 0;
  const size = p.m < 0.01 ? 170 : 7 / Math.cbrt(p.m);
  return p.q > 0 ? size : -size;
}

const TARGET = 'electron';

const CSS = `
.cd .board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 510px minmax(0, 1fr); gap: 14px; align-items: start; }
.cd svg { width: 100%; height: auto; display: block; border-radius: 14px; }
.cd .panel { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.cd .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.cd .card { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: 12px; padding: 4px 10px;
            min-height: 60px; display: flex; flex-direction: column; justify-content: center; line-height: 1.2; }
.cd .card[aria-pressed="true"] { border-color: var(--sim-accent); outline: 2px solid var(--sim-accent); outline-offset: 1px; }
.cd .nm { font-weight: 800; font-size: 15px; }
.cd .q { font-size: 14px; color: var(--sim-label-muted); }
.cd .picked { font-size: 15px; line-height: 1.3; min-height: 40px; }
.cd .picked b { color: var(--sim-accent); }

.sim-dom-root--portrait .cd .board { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .cd svg, .sim-dom-root--portrait .cd .panel { width: 100%; }
.sim-dom-root--portrait .cd svg text { font-size: 27px; letter-spacing: 0; }
.sim-dom-root--portrait .cd svg .tube { display: none; }
.sim-dom-root--portrait .cd .card { min-height: 56px; padding: 4px 8px; }
.sim-dom-root--portrait .cd .card:last-child { grid-column: 1 / -1; }
`;

const PLATE_X_L = 200;     // the plates run left to right, one above the beam and one below
const PLATE_X_R = 400;
const PLATE_Y_TOP = 130;
const PLATE_Y_BOT = 320;
const PLATE_H = 10;
const TRACK_Y = 230;       // the beam's line through the middle of the plates
const SVG_W = 600, SVG_H = 360;

export class CathodeDeflectionGame extends GameBoard {
  static simId = 'cathode-deflection-game';
  static label = { en: 'What Bends in the Field?' };
  static category = 'science.physics';
  static ARIA_LABEL =
    'Five candidate particles fired between a pair of charged plates. The student picks the one that bends the way the cathode ray does.';
  static OBJECTIVE = {
    prompt: { en: 'A cathode ray bends sharply between charged plates. Which of these five particles could bend that much?' },
  };

  constructor(container, config) {
    super(container, config);
    this.picked = null;
    this.fired = new Set();
    this._moved = false;
  }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: CSS,
      html: `
        <div class="gm cd">
          <div class="gm-head">
            <p class="kicker">The first crack</p>
            <h2>Which particle <b>bends like the cathode ray</b>?</h2>
            <p class="sub">Each flies between a + plate and a - plate. With the same charge, a lighter particle bends more.</p>
          </div>
          <div class="board">
            <svg viewBox="0 0 ${SVG_W} ${SVG_H}" role="img" aria-label="Paths through charged plates">${this._svgInner()}</svg>
            <div class="panel">
              <div class="grid">
                ${PARTICLES.map((p) => `
                  <div class="card tap" data-id="${p.id}" role="button" tabindex="0" aria-pressed="false">
                    <div class="nm">${p.name}</div>
                    <div class="q">charge ${p.charge}</div>
                  </div>`).join('')}
              </div>
              <div class="picked" id="cd-picked" aria-live="polite">Tap a particle to fire it.</div>
            </div>
          </div>
        </div>`,
    });
    this._picked = this.root.querySelector('#cd-picked');
    this.root.querySelectorAll('.card').forEach((el) => onTap(el, () => {
      this.picked = el.dataset.id;
      this._moved = true;
      this._render();
    }));
    this._render();
    this.quill.speak('The cathode ray bends. Which particle is light enough to do that?', 5200);
  }

  // Dashed cathode ray to match, the plates, and every particle fired so far.
  _svgInner() {
    const plate = (y, fill) => `<rect x="${PLATE_X_L}" y="${y}" width="${PLATE_X_R - PLATE_X_L}" height="${PLATE_H}" rx="3" fill="${fill}"></rect>`;
    const sign = (y, s, fill) => `<text x="${(PLATE_X_L + PLATE_X_R) / 2}" y="${y}" text-anchor="middle" fill="${fill}" font-size="22" font-weight="800">${s}</text>`;
    const ray = deflection(PARTICLES.find((p) => p.id === TARGET));
    return `
      <rect x="0" y="0" width="${SVG_W}" height="${SVG_H}" fill="var(--sim-bg-deep)"></rect>
      <text class="tube" x="16" y="26" fill="var(--sim-label-muted)" font-size="14" font-weight="700" letter-spacing="2">CATHODE-RAY TUBE</text>
      ${plate(PLATE_Y_TOP, 'var(--sim-cation)')}${sign(PLATE_Y_TOP - 8, '+', 'var(--sim-cation)')}
      ${plate(PLATE_Y_BOT, 'var(--sim-anion)')}${sign(PLATE_Y_BOT + PLATE_H + 24, '-', 'var(--sim-anion)')}
      <path d="${this._path(ray)}" stroke="var(--sim-label-muted)" stroke-width="2" stroke-dasharray="7 6" fill="none"></path>
      <text x="590" y="${TRACK_Y + ray - 12}" text-anchor="end" fill="var(--sim-label-muted)" font-size="15" font-weight="700">cathode ray</text>
      <circle cx="40" cy="${TRACK_Y}" r="6" fill="var(--sim-label-muted)"></circle>
      ${[...this.fired].map((id) => this._trackSvg(PARTICLES.find((p) => p.id === id), id === this.picked)).join('')}
    `;
  }

  // Straight to the plates, a curve between them, straight on after.
  _path(dy) {
    return `M 40 ${TRACK_Y} L ${PLATE_X_L} ${TRACK_Y} Q 300 ${TRACK_Y} ${PLATE_X_R} ${TRACK_Y + dy * 0.35} L 560 ${TRACK_Y + dy}`;
  }

  _trackSvg(p, highlighted) {
    const dy = deflection(p);
    const above = dy < -40;
    return `
      <g opacity="${highlighted ? 1 : 0.45}">
        <path d="${this._path(dy)}" stroke="${p.color}" stroke-width="${highlighted ? 4 : 2.5}" fill="none"></path>
        ${highlighted ? `<text x="590" y="${TRACK_Y + dy + (above ? 34 : 30)}" text-anchor="end" fill="var(--sim-label)" font-size="15" font-weight="800">${p.name}</text>` : ''}
      </g>
    `;
  }

  _fact(p) {
    if (p.id === 'photon') return 'no charge';
    if (p.id === 'electron') return 'charge -1, the lightest here';
    return `charge ${p.charge}, about ${Math.round(p.m * 1836).toLocaleString('en-IN')} times heavier than an electron`;
  }

  _render() {
    this.root.querySelectorAll('.card').forEach((el) => {
      el.setAttribute('aria-pressed', el.dataset.id === this.picked ? 'true' : 'false');
    });
    if (!this.picked) return;
    this.fired.add(this.picked);
    this.root.querySelector('svg').innerHTML = this._svgInner();
    const chosen = PARTICLES.find((p) => p.id === this.picked);
    this._picked.innerHTML = `Fired: <b>${chosen.name}</b>, ${this._fact(chosen)}.`;
  }

  checkObjective() {
    if (!this._moved) return null;
    if (this.picked === TARGET) {
      this.quill?.perform('hop');
      return { ok: true };
    }
    this.quill?.setExpression('surprised');
    const p = PARTICLES.find((x) => x.id === this.picked);
    let hint;
    if (p.id === 'oxygen' || p.id === 'hion' || p.id === 'gold') {
      hint = `A ${p.name.toLowerCase().replace(' au ', ' gold ').replace(' o ', ' oxygen ').replace(' h ', ' hydrogen ')} is about ${Math.round(p.m * 1836).toLocaleString('en-IN')} times heavier than an electron, so it barely bends. The cathode ray bends sharply.`;
    } else {
      hint = 'Light has no charge, so the plates cannot bend it. The cathode ray does bend, so it must be charged.';
    }
    return { ok: false, hint };
  }
}
