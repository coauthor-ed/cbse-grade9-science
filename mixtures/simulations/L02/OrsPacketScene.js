import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { SIM_LOOK_DOM_CSS, burst } from 'simulations/base/kit/SimLookDom.js';

/**
 * OrsPacketScene - blk-l02-s04, the proportion that saved lives. DOM + SVG, controls in the scene.
 *   b0  100 patients as 100 dots, about 30 lost before and fewer than 4 with ORS by mouth (Bangaon, 1971).
 *       A person is a dot here: no face, no photograph (media/L02/README.md gives the reason).
 *   b1  a 1 L jug and one packet. Half the water, or a second packet, and the reading says too strong.
 *       The packet is made for 1 L, so only one packet in 1 L reads ORS. The find is the learner's.
 * The numbers are approximate, as the slide says. No frame loop: CSS only.
 */

const WATERS = [500, 1000, 1500];
const PACKETS = [1, 2];
const LOST = { before: { dots: 30, say: 'about 30' }, ors: { dots: 3, say: 'fewer than 4' } };

function jugSvg(ml, packets) {
  const top = 212 - (ml / 1500) * 168;
  const marks = WATERS.map((v) => {
    const y = 212 - (v / 1500) * 168;
    return `<path d="M178 ${y} h22" stroke="var(--sim-label)" stroke-width="3" stroke-linecap="round"/>`
      + `<text x="222" y="${y + 5}" class="ors-mark">${v === 1000 ? '1 L' : `${v} mL`}</text>`;
  }).join('');
  const packs = Array.from({ length: packets }, (_, i) => {
    const x = 18 + i * 26, y = 150 + i * -26;
    return `<g transform="translate(${x} ${y}) rotate(${i ? 8 : -6} 30 40)">
      <rect width="62" height="82" rx="6" fill="var(--sim-series-2)" stroke="var(--sim-stroke)" stroke-width="3"/>
      <path d="M0 13 h62" stroke="var(--sim-stroke)" stroke-width="2" stroke-dasharray="4 4"/>
      <rect x="9" y="26" width="44" height="30" rx="4" fill="var(--sim-bg-surface)"/>
      <text x="31" y="47" text-anchor="middle" class="ors-pack">ORS</text></g>`;
  }).join('');
  return `<svg class="ors-jug" viewBox="0 0 300 250" role="img" aria-label="A jug with ${ml} mL of water and ${packets} ORS packet${packets > 1 ? 's' : ''}">
    <ellipse cx="150" cy="232" rx="96" ry="8" fill="color-mix(in oklab, var(--sim-stroke) 40%, transparent)"/>
    <path d="M104 ${top} H196 V210 a14 14 0 0 1 -14 14 H118 a14 14 0 0 1 -14 -14 Z" fill="color-mix(in oklab, var(--sim-water) 42%, transparent)"/>
    <path d="M104 ${top} H196" stroke="color-mix(in oklab, var(--sim-water) 70%, var(--sim-bg-surface))" stroke-width="5"/>
    <path d="M96 22 V210 a22 22 0 0 0 22 22 H182 a22 22 0 0 0 22 -22 V22 M96 22 l-10 -12 M204 22 h-108" fill="none" stroke="var(--sim-glass)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M112 40 v150" stroke="color-mix(in oklab, var(--sim-label) 16%, transparent)" stroke-width="7" stroke-linecap="round"/>
    ${marks}${packs}</svg>`;
}

const CSS = SIM_LOOK_DOM_CSS + `
.ors { padding: var(--sim-space-3); }
.ors-pane { display: none; flex-direction: column; gap: var(--sim-space-2); }
.ors[data-step="0"] .ors-pane--camp, .ors[data-step="1"] .ors-pane--jug { display: flex; }
.ors-card { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); padding: var(--sim-space-3);
  box-shadow: 0 var(--sim-lift) 0 var(--sim-stroke); }
.ors-head { display: flex; align-items: center; justify-content: space-between; gap: var(--sim-space-2); flex-wrap: wrap; }
.ors-kick { font-weight: 800; font-size: var(--sim-text-md); color: var(--sim-label-muted); }
.ors-camp { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: var(--sim-space-4); align-items: center; }
.ors-grid { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 6px; }
.ors-dot { aspect-ratio: 1; border-radius: 50%; background: var(--sim-series-3); box-shadow: inset 0 -3px 0 color-mix(in oklab, var(--sim-series-3) 70%, var(--sim-stroke)); transition: background 0.3s ease; }
.ors-dot[data-lost="1"] { background: var(--sim-bg-cell); box-shadow: inset 0 0 0 2.5px var(--sim-stroke); }
.ors-big { font-family: var(--sim-font-display, var(--sim-font)); font-weight: 700; font-size: 56px; line-height: 1.1; margin-top: 6px; color: var(--sim-label); }
.ors-big[data-long="1"] { font-size: 40px; line-height: 62px; }
.ors-sub { font-weight: 700; font-size: var(--sim-text-md); color: var(--sim-label-muted); margin-top: 4px; }
.ors-read { display: flex; flex-direction: column; align-items: flex-start; gap: var(--sim-space-3); }
.ors-btns { display: flex; flex-wrap: wrap; gap: var(--sim-space-2); }
.ors-btn { min-height: 44px; padding: 6px 14px; font: inherit; font-weight: 800; font-size: var(--sim-text-md); color: var(--sim-label); cursor: pointer;
  background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-md); box-shadow: 0 var(--sim-lift) 0 var(--sim-stroke); }
.ors-btn[aria-pressed="true"] { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); }
.ors-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--sim-stroke); }
.ors-btn:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.ors-mix { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: var(--sim-space-3); align-items: center; }
.ors-jug { display: block; width: 100%; max-height: 300px; }
.ors-jug text { font-family: var(--sim-font); fill: var(--sim-label); }
.ors-mark { font-size: 16px; font-weight: 800; }
.ors-pack { font-size: 17px; font-weight: 900; fill: var(--sim-label); }
.ors-side { display: flex; flex-direction: column; gap: var(--sim-space-2); min-width: 0; }
.ors-lab { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.ors-verdict { padding: var(--sim-space-2) var(--sim-space-3); border-radius: var(--sim-radius-md); border: var(--sim-border); text-align: center;
  font-family: var(--sim-font-display, var(--sim-font)); font-weight: 700; font-size: var(--sim-text-xl); color: var(--sim-label);
  background: color-mix(in oklab, var(--sim-warning) 18%, var(--sim-bg-surface)); border-color: var(--sim-warning); }
.ors-verdict[data-ok="1"] { background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); border-color: var(--sim-good); }
.ors-verdict b { display: block; font-family: var(--sim-font); font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); }
/* Phone: the host gives a scene about 350 x 225, so the two parts stay side by side and nothing stacks. */
.sim-dom-root--portrait.ors { padding: 6px; }
.sim-dom-root--portrait .ors-card { padding: 8px; }
.sim-dom-root--portrait .ors-camp { grid-template-columns: 158px minmax(0, 1fr); gap: 12px; }
.sim-dom-root--portrait .ors-mix { grid-template-columns: 136px minmax(0, 1fr); gap: 4px; }
.sim-dom-root--portrait .ors-mark { font-size: 22px; }
.sim-dom-root--portrait .ors-jug { overflow: visible; }
.sim-dom-root--portrait .ors-grid { gap: 3px; }
.sim-dom-root--portrait .ors-kick, .sim-dom-root--portrait .ors-sub { font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .ors-big { font-size: 38px; margin-top: 0; }
.sim-dom-root--portrait .ors-big[data-long="1"] { font-size: 27px; line-height: 42px; white-space: nowrap; }
.sim-dom-root--portrait .ors-read { gap: 6px; }
.sim-dom-root--portrait .ors-camp .ors-btns { flex-direction: column; align-self: stretch; }
.sim-dom-root--portrait .ors-btn { padding: 4px 6px; font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .ors-btns { gap: 4px; flex-wrap: nowrap; }
.sim-dom-root--portrait .ors-side { gap: 4px; }
.sim-dom-root--portrait .ors-verdict { padding: 4px 8px; font-size: var(--sim-text-md); }
@media (prefers-reduced-motion: reduce) { .ors-dot { transition: none; } }
`;

export class OrsPacketScene extends DomSimulation {
  static WIDTH = 680;
  static HEIGHT = 440;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 250;
  static LAYOUT = 'fit';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static CONTROLS = [];
  static ARIA_LABEL = 'Two views. One hundred dots stand for one hundred cholera patients: about 30 were lost before, and fewer than 4 with oral '
    + 'rehydration solution given by mouth. Then a jug and an ORS packet: change the water or the number of packets, and only one packet '
    + 'in one litre reads as ORS.';

  constructor(container, config) {
    super(container, config);
    this._when = 'before';
    this._ml = 500;
    this._packets = 1;
    this._found = false;
  }

  async setup() {
    await super.setup();
    this.render({ css: CSS, rootClass: 'sl-backdrop sl-backdrop--plain ors', html: `
      <div class="ors-pane ors-pane--camp"><div class="ors-card ors-camp">
        <div class="ors-grid" id="ors-grid" role="img"></div>
        <div class="ors-read">
          <div><div class="ors-kick">Patients lost in every 100</div><div class="ors-big" id="ors-num"></div><div class="ors-sub" id="ors-numsub"></div></div>
          <div class="ors-btns" role="group" aria-label="Which treatment">
            <button type="button" class="ors-btn" data-when="before">Drips ran out</button>
            <button type="button" class="ors-btn" data-when="ors">ORS by mouth</button>
          </div>
        </div>
      </div></div>
      <div class="ors-pane ors-pane--jug"><div class="ors-card ors-mix">
        <div id="ors-jug"></div>
        <div class="ors-side">
          <span class="ors-lab">Water in the jug</span>
          <div class="ors-btns" role="group" aria-label="Water in the jug">${WATERS.map((v) => `<button type="button" class="ors-btn" data-ml="${v}">${v === 1000 ? '1 L' : `${v} mL`}</button>`).join('')}</div>
          <span class="ors-lab">Packets</span>
          <div class="ors-btns" role="group" aria-label="Packets">${PACKETS.map((v) => `<button type="button" class="ors-btn" data-pk="${v}">${v}</button>`).join('')}</div>
          <div class="ors-verdict" id="ors-verdict" aria-live="polite"></div>
        </div>
      </div></div>` });
    this.root.addEventListener('click', this._onClick = (e) => {
      const b = e.target instanceof Element ? e.target.closest('button') : null;
      if (!b) return;
      if (b.dataset.when) this._when = b.dataset.when;
      if (b.dataset.ml) this._ml = Number(b.dataset.ml);
      if (b.dataset.pk) this._packets = Number(b.dataset.pk);
      this._paint();
      if (b.dataset.ml || b.dataset.pk) this._checkFind();
    });
    this.root.dataset.step = String(this.stepIndex ?? 0);
    this._paint();
    this.relayout?.();
  }

  destroy() {
    this.root?.removeEventListener('click', this._onClick);
    super.destroy();
  }

  onStep() { this.relayout?.(); }

  get _strength() { return (this._packets * 1000) / this._ml; }

  _checkFind() {
    const stage = this.stepIndex;
    if (stage === 1 && !this._found && this._strength === 1) {
      this._found = true;
      burst(this.root.querySelector('.ors-pane--jug'), 18, this.root.querySelector('#ors-verdict'));
    }
  }

  _paint() {
    const { dots: lost, say } = LOST[this._when];
    const grid = this.root.querySelector('#ors-grid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 100 }, (_, i) => `<span class="ors-dot" data-lost="${i < lost ? 1 : 0}"></span>`).join('');
    grid.setAttribute('aria-label', `${say} of 100 dots are hollow`);
    const num = this.root.querySelector('#ors-num');
    num.textContent = say;
    num.dataset.long = say.length > 8 ? '1' : '0';
    this.root.querySelector('#ors-numsub').textContent = this._when === 'before' ? 'Bangaon, 1971, before ORS' : 'with ORS by mouth';
    this.root.querySelectorAll('[data-when]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.when === this._when)));
    this.root.querySelector('#ors-jug').innerHTML = jugSvg(this._ml, this._packets);
    this.root.querySelectorAll('[data-ml]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.ml) === this._ml)));
    this.root.querySelectorAll('[data-pk]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.pk) === this._packets)));
    const s = this._strength;
    const v = this.root.querySelector('#ors-verdict');
    const n = s === 1 ? '' : `${Math.round(s * 100) / 100} times the right strength`;
    v.dataset.ok = s === 1 ? '1' : '0';
    v.innerHTML = s === 1 ? 'This is ORS' : `${s > 1 ? 'Too strong' : 'Too weak'}<b>${n}</b>`;
  }
}
