// BioStage.js - local helper for the L03 to L05 picture scenes on SvgScene. Not a scene.
//   class X extends BioStage { static BEAT_STEP_MAP = beats(3); heights = [[300, 380], ...]; draw(st, step) { return svgString; } }
// A setup scene mounted by a predict shows its only stage. ctls() lists an in-picture control row (SeaBits.ctlBar).
// flow(d, ...) draws a dashed moving line; motion is CSS, finite, and comes to rest.
import { SvgScene, fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { LIFE_COLOR_MAP } from '../shared/LifeArt.js';
import { svgBioColour as lc } from '../shared/BioArt.js';
import { frame, ctlBar, words } from '../shared/SeaBits.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';

export const beats = (n) => Array.from({ length: n }, (_, idx) => [{ idx, dwellMs: null }]);
export const INK = lc('ink');
export const LIT = `color-mix(in oklab, ${lc('gold')} 34%, ${lc('white')})`;
/** A finite motion on any drawing: move('rise', 0.4, svg). A style can sit on the group only, never twice on one element. */
export const move = (kind, d, body, more = '') => `<g class="bs-${kind}" style="--d:${d}s;${more}">${body}</g>`;
export const clampBeat = (i, n) => Math.max(0, Math.min(n - 1, i));

export const BIO_STAGE_CSS = `
.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }
svg .bs-flow { stroke-dasharray: 10 12; animation: bs-flow 1.1s linear 7; }
svg .bs-flow-r { stroke-dasharray: 10 12; animation: bs-flow-r 1.1s linear 7; }
@keyframes bs-flow { from { stroke-dashoffset: 44; } to { stroke-dashoffset: 0; } }
@keyframes bs-flow-r { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 44; } }
svg .bs-pop { transform-box: fill-box; transform-origin: center; animation: bs-pop var(--look-pop, 0.36s) var(--look-spring, ease-out) both; animation-delay: var(--d, 0s); }
@keyframes bs-pop { from { transform: scale(0.7); opacity: 0; } to { transform: none; opacity: 1; } }
svg .bs-drift { animation: bs-drift 2.2s ease-in-out 3; animation-delay: var(--d, 0s); }
@keyframes bs-drift { 50% { transform: translate(var(--dx, 6px), var(--dy, -6px)); } }
svg .bs-rise { animation: bs-rise 2.4s ease-out 4 both; animation-delay: var(--d, 0s); }
@keyframes bs-rise { from { transform: translateY(24px); opacity: 0; } 30% { opacity: 1; } to { transform: none; opacity: 1; } }
svg .bs-fall { animation: bs-fall 2.4s ease-in 3 both; animation-delay: var(--d, 0s); }
@keyframes bs-fall { from { transform: translateY(-34px); opacity: 0; } 30% { opacity: 1; } to { transform: none; opacity: 1; } }
svg .bs-wig { transform-box: fill-box; transform-origin: center; animation: bs-wig 1.4s ease-in-out 5; }
@keyframes bs-wig { 50% { transform: rotate(var(--r, 3deg)) scale(1.03, 0.97); } }
@media (prefers-reduced-motion: reduce) { svg .bs-flow, svg .bs-flow-r, svg .bs-pop, svg .bs-drift, svg .bs-rise, svg .bs-fall, svg .bs-wig { animation: none !important; } }
`;

/** The kit's own Run and Check rule loses to .ek-root button { color:inherit }, so the label stays dark on green. In setup(), after super.setup(). */
export function gameInk(root) {
  const s = (root.ownerDocument ?? document).createElement('style');
  s.textContent = '.ek-root .ek-run, .ek-root .ek-badge { color: var(--sim-bg-deep); } .ek-root .ek-badge:disabled { opacity: 1; background: var(--sim-bg-surface); color: var(--sim-label); }';
  root.appendChild(s);
}

/** A pill label: a rimmed plate with one reading, sized from its text. o: on (lit), ink, bg, size, anchor. */
export function pill(x, y, text, o = {}) {
  const size = o.size ?? 15, w = Math.round(text.length * size * 0.56 + 20), h = Math.round(size * 1.3 + 12);
  const x0 = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w / 2;
  const look = lookOf(), r = Math.min(h / 2, 10 * (look.radius ?? 1));
  const bg = o.bg ?? (o.on ? LIT : lc('white'));
  return `<g${o.pop ? ' class="bs-pop"' : ''}><rect x="${x0}" y="${y - h / 2}" width="${w}" height="${h}" rx="${r}" ${fill(bg, `stroke:${INK};stroke-width:2`)}/>`
    + words(x0 + w / 2, y + size * 0.36, text, { size, ink: o.ink ?? INK, display: o.display !== false, weight: 600 }) + '</g>';
}
/** A soft panel with a rim. */
export const panel = (x, y, w, h, bg = lc('white'), r = 14) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r * (lookOf().radius ?? 1)}" ${fill(bg, `stroke:${INK};stroke-width:2.5`)}/>`;
/** A line with a moving dash. back: the dash runs from the end to the start. */
export const flow = (d, col, w = 5, back = false) => `<path class="${back ? 'bs-flow-r' : 'bs-flow'}" d="${d}" ${stroke(col, w)} stroke-linecap="round"/>`;
/** A solid arrowhead at (x, y) pointing at angle a (degrees). */
export const head = (x, y, a, col, s = 11) => `<path d="M0 0L${-s * 1.5} ${-s}L${-s * 1.5} ${s}Z" transform="translate(${x} ${y}) rotate(${a})" ${fill(col)}/>`;
/** Water and light behind a microscopic subject. */
export const waterBack = (W, H) => `<rect width="${W}" height="${H}" ${fill(`color-mix(in oklab, ${lc('water')} 42%, ${lc('white')})`)}/>`
  + [[0.12, 0.2, 30], [0.86, 0.3, 44], [0.7, 0.86, 26], [0.2, 0.8, 38]].map(([u, v, r]) => `<circle cx="${W * u}" cy="${H * v}" r="${r}" ${fill(lc('water'), 'opacity:0.22')}/>`).join('');
export const skyBack = (W, H) => `<rect width="${W}" height="${H}" ${fill('var(--sim-sky-day, ' + lc('skyDay') + ')')}/>`;

export class BioStage extends SvgScene {
  static WIDTH = 640;
  static HEIGHT = 430;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;   // aspect under 0.8: on a phone the figure takes the full width
  static COLOR_MAP = LIFE_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static CONTROLS = [];
  heights = [[300, 380]];

  async setup() {
    await super.setup();
    const items = this.ctls?.();
    if (items) this.ctl = ctlBar(this, items, (id, v) => this.onCtl?.(id, v));
    this.enter?.(this.stepIndex);
    this.repaint();
  }
  css() { return BIO_STAGE_CSS + (this.moreCss?.() ?? ''); }
  stageHeight(st) { const a = this.heights[clampBeat(this.stepIndex ?? 0, this.heights.length)]; return st.portrait ? a[0] : a[1]; }
  onBeatChange(beat, count) {
    if (this.hostRole === 'setup') { super.onBeatChange(0, 1); return; }
    super.onBeatChange(beat, count);
  }
  destroy() { this.ctl?.destroy(); super.destroy(); }
  paint(st) { return { svg: frame(st, this.constructor.name, this.draw(st, this.stepIndex)) }; }
}
