// CultureStepsGame - blk-l10-game (replaces RegrowTheCloneGame). Grow a whole plant from one small piece. First tap a
// starting piece, drawn as a picture: a living carrot phloem piece or a living leaf piece works; a dead xylem vessel piece
// fails with "Dead cells cannot divide." Then tap the steps in order: nutrient medium, mass of unspecialised cells, shoots
// and roots, plantlet, hardening and soil. The step cards are shown in a mixed order (never the answer order). Each right
// step grows the drawn culture; a wrong one says what must come first. Nothing locks, so a learner can always win.
// Control names: Carrot phloem piece, Leaf piece, Dead xylem piece, then Nutrient medium, Mass of unspecialised cells,
// Shoots and roots, Plantlet, Hardening and soil.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { cwDefs, T, mx } from '../shared/CellWorld.js';
import { artDefs } from '../shared/PlantArt.js';
import { piece, callus, carrotSection, plantlet, testTube, AGAR, SOIL, GLASS, CARROT, XYLC, LEAFC, LEAFC_D } from '../shared/CultureArt.js';
import { form } from '../shared/BodyArt.js';

const STARTS = [
  { id: 'phloem', label: 'Carrot phloem piece', live: true },
  { id: 'xylem', label: 'Dead xylem piece', live: false },
  { id: 'leaf', label: 'Leaf piece', live: true },
];
const STEPS = [
  { id: 'medium', label: 'Nutrient medium', need: '' },
  { id: 'mass', label: 'Mass of unspecialised cells', need: 'The piece must sit on nutrient medium before its cells can divide.' },
  { id: 'shoots', label: 'Shoots and roots', need: 'Shoots and roots grow from a mass of cells. Make the mass first.' },
  { id: 'plantlet', label: 'Plantlet', need: 'A plantlet forms once shoots and roots have grown.' },
  { id: 'soil', label: 'Hardening and soil', need: 'Only a plantlet with roots and a shoot can be hardened and planted.' },
];
const MENU = ['shoots', 'medium', 'soil', 'mass', 'plantlet'];
const INK = T('strata-6'), W_ = T('elev-peak'), VW = 300, VH = 220;

// a thick slice cut across a carrot root, tilted to show its face: skin, the orange phloem ring, the pale xylem core,
// with a notch where a small piece of phloem was taken out (the piece lies beside it)
function carrotSlice(x, y, r) {
  const t = 0.62, side = r * 0.26;
  let s = `<ellipse cx="${x + 3}" cy="${y + side + r * t * 0.9}" rx="${r * 1.02}" ry="${r * t * 0.4}" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/>`;
  s += `<path d="M${x - r} ${y}V${y + side}A${r} ${r * t} 0 0 0 ${x + r} ${y + side}V${y}Z" style="fill:${mx(CARROT, INK, 78)}"/>`;
  s += `<path d="M${x - r} ${y + side * 0.4}A${r} ${r * t} 0 0 0 ${x + r} ${y + side * 0.4}" style="fill:none;stroke:${CARROT};stroke-width:2;opacity:.7"/>`;
  s += `<g transform="translate(${x} ${y}) scale(1 ${t}) translate(${-x} ${-y})">${carrotSection(x, y, r, { taken: true, takenAt: -0.4, seed: 5 })}</g>`;
  return s + piece(x + r * 0.9, y - r * 0.42, 1.6, { seed: 3, rot: 30 });
}
// a sliver of dead xylem: pale wood split along its length, three empty vessels with spiral thickening, open cut ends
function xylemSliver(x, y, len, deg) {
  const w = len * 0.3, x0 = -len / 2, x1 = len / 2;
  let g = `<ellipse cx="3" cy="${w * 0.7}" rx="${len * 0.52}" ry="${w * 0.22}" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/>`;
  g += form(`M${x0} ${-w / 2 + 3}L${x1 - 6} ${-w / 2}L${x1} ${-w / 2 + 6}L${x1 - 2} ${w / 2}L${x0 + 6} ${w / 2 - 1}L${x0} ${w / 2 - 6}Z`, mx(XYLC, 'elev-peak', 70), { ao: 6, rim: 1.8, rimCol: mx('strata-3', INK, 60), hi: 50, lo: 40 });
  for (let i = 0; i < 3; i++) {
    const vy = -w / 2 + w * (0.2 + i * 0.3), vh = w * 0.11;
    g += `<rect x="${x0 + 5}" y="${vy - vh}" width="${len - 10}" height="${vh * 2}" style="fill:${mx('elev-peak', 'sea-shallow', 92)};stroke:${mx('strata-3', 'elev-peak', 55)};stroke-width:1.4"/>`;
    let sp = '';
    for (let xx = x0 + 8; xx < x1 - 8; xx += 5) sp += `M${xx} ${vy - vh}l3 ${vh * 2}`;
    g += `<path d="${sp}" style="fill:none;stroke:${mx('strata-3', 'gold', 50)};stroke-width:1.2;opacity:.6"/>`;
    g += `<ellipse cx="${x1 - 3}" cy="${vy}" rx="2.4" ry="${vh * 1.1}" style="fill:${mx('strata-3', 'elev-peak', 50)}"/>`;
  }
  g += `<path d="M${x0 + 6} ${-w / 2 + 4}L${x1 - 8} ${-w / 2 + 1.5}" style="fill:none;stroke:${W_};stroke-width:2;stroke-linecap:round;opacity:.7"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${deg})">${g}</g>`;
}
// a leaf disc punched from a leaf: a green disc with its midrib and branching veins, lit side, a faint curl
function leafDisc(x, y, r) {
  const d = `M${x - r} ${y}A${r} ${r * 0.8} 0 1 0 ${x + r} ${y}A${r} ${r * 0.8} 0 1 0 ${x - r} ${y}Z`;
  let v = `M${x - r * 0.9} ${y + r * 0.3}Q${x} ${y - r * 0.05} ${x + r * 0.92} ${y - r * 0.3}`;
  for (let i = -3; i <= 3; i++) { const u = i / 4, bx = x + u * r * 0.85, by = y + r * 0.3 * -u * 0.9 + r * 0.02; v += `M${bx} ${by}l${r * 0.22} ${-r * 0.42}M${bx} ${by}l${r * 0.28} ${r * 0.36}`; }
  let net = '';
  for (let i = 0; i < 16; i++) { const a = i * 1.7, rr = r * (0.25 + (i % 4) * 0.17); net += `M${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr * 0.8}l${Math.cos(a + 1.4) * r * 0.13} ${Math.sin(a + 1.4) * r * 0.1}`; }
  return `<ellipse cx="${x + 3}" cy="${y + r * 0.85}" rx="${r * 0.95}" ry="${r * 0.16}" style="fill:${INK};opacity:.22;filter:url(#cw-blur3)"/>`
    + `<path d="${d}" transform="translate(0 3)" style="fill:${LEAFC_D}"/>`
    + form(d, LEAFC, { ao: r * 0.25, rim: 1.6, rimCol: LEAFC_D, hi: 46, lo: 40, inner: `<path d="${net}" style="fill:none;stroke:${LEAFC_D};stroke-width:.8;opacity:.4"/><path d="${v}" style="fill:none;stroke:${mx(LEAFC, 'gold', 50)};stroke-width:1.8;stroke-linecap:round;opacity:.85"/><path d="M${x - r * 0.9} ${y + r * 0.3}Q${x} ${y - r * 0.05} ${x + r * 0.92} ${y - r * 0.3}" style="fill:none;stroke:${mx(LEAFC, 'gold', 40)};stroke-width:3;stroke-linecap:round"/>` });
}
function startArt(id) {
  let s = `<rect width="120" height="92" rx="12" style="fill:${mx('series-1', 'elev-peak', 12)}"/>`;
  if (id === 'phloem') s += carrotSlice(54, 44, 31);
  else if (id === 'leaf') s += leafDisc(60, 46, 36);
  else s += xylemSliver(60, 46, 96, -16);
  return `<svg viewBox="0 0 120 92" aria-hidden="true">${s}</svg>`;
}
// the culture at each stage: 0 the piece alone, 1 on medium, 2 a mass, 3 shoots and roots, 4 a plantlet, 5 in soil
function stage(k, start) {
  let s = `<rect width="${VW}" height="${VH}" rx="12" style="fill:${mx('series-1', 'elev-peak', 14)}"/><rect y="${VH - 30}" width="${VW}" height="30" style="fill:${mx('strata-1', 'strata-3', 66)}"/><path d="M0 ${VH - 30}H${VW}" style="fill:none;stroke:${mx('strata-3', INK, 60)};stroke-width:2"/>`;
  const gy = VH - 30, src = start === 'leaf' ? leafDisc(150, gy - 52, 18) : piece(150, gy - 54, 2.2, { seed: 3 });
  if (k <= 3) {
    // a glass culture jar on the bench; medium from step 1
    const x0 = 90, x1 = 210, top = 40;
    s += `<ellipse cx="150" cy="${gy + 2}" rx="68" ry="6" style="fill:${INK};opacity:.2;filter:url(#cw-blur3)"/>`;
    s += `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="${gy - top}" rx="12" style="fill:${GLASS};opacity:.3"/>`;
    if (k >= 1 || k < 0) {
      // culture medium: a clear gel with a soft glow, a glossy top
      s += `<defs><radialGradient id="cs-glow" cx="0.5" cy="0.3" r="0.7"><stop offset="0" style="stop-color:${mx('gold', 'elev-peak', 40)};stop-opacity:.9"/><stop offset="1" style="stop-color:${mx('gold', 'elev-peak', 40)};stop-opacity:0"/></radialGradient><linearGradient id="cs-gel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx(AGAR, 'elev-peak', 70)}"/><stop offset="1" style="stop-color:${AGAR}"/></linearGradient></defs>`;
      s += `<ellipse cx="150" cy="${gy - 40}" rx="80" ry="44" style="fill:url(#cs-glow)"/>`;
      s += `<rect x="${x0 + 3}" y="${gy - 46}" width="${x1 - x0 - 6}" height="43" rx="9" style="fill:url(#cs-gel);opacity:.95"/><ellipse cx="150" cy="${gy - 46}" rx="${(x1 - x0) / 2 - 4}" ry="4" style="fill:${mx(AGAR, 'elev-peak', 50)};stroke:${mx(AGAR, INK, 60)};stroke-width:1"/><path d="M${x0 + 14} ${gy - 47}H${x0 + 52}" style="fill:none;stroke:${W_};stroke-width:2.4;stroke-linecap:round;opacity:.85"/>`;
      for (let i = 0; i < 9; i++) s += `<circle cx="${x0 + 12 + ((i * 37) % (x1 - x0 - 24))}" cy="${gy - 36 + ((i * 13) % 28)}" r="${1 + (i % 3) * 0.6}" style="fill:${W_};opacity:.55"/>`;
    }
    if (k === 0 || k === 1) s += src;
    if (k === 2) s += callus(150, gy - 62, 34, 20, { seed: 4 });
    if (k === 3) {
      s += callus(150, gy - 60, 30, 17, { seed: 4 });
      s += plantlet(150, gy - 74, 56, { seed: 2, leaves: 3 });
      s += `<path d="M138 ${gy - 46}l-8 22M150 ${gy - 44}l2 26M162 ${gy - 46}l8 20" style="fill:none;stroke:${mx('strata-1', 'elev-peak', 40)};stroke-width:2;stroke-linecap:round"/>`;
    }
    s += `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="${gy - top}" rx="12" style="fill:none;stroke:${mx(GLASS, INK, 56)};stroke-width:2.6"/><path d="M${x0 + 8} ${top + 12}V${gy - 14}" style="fill:none;stroke:${W_};stroke-width:3;stroke-linecap:round;opacity:.6"/>`;
    s += `<rect x="${x0 - 4}" y="${top - 12}" width="${x1 - x0 + 8}" height="14" rx="5" style="fill:${mx('strata-5', 'elev-peak', 60)};stroke:${INK};stroke-width:2"/>`;
  } else if (k === 4) {
    s += testTube(150, gy + 2, 170, { agar: 0.4, above: plantlet(150, gy + 2 - 170 * 0.4 + 6, 70, { seed: 4 }) });
  } else {
    // hardening: a small pot of soil under a clear cover, the young plant growing
    s += `<path d="M104 ${gy - 64}L196 ${gy - 64}L186 ${gy}L114 ${gy}Z" style="fill:${mx('flame', 'strata-3', 46)};stroke:${mx('flame', INK, 50)};stroke-width:2.4"/><path d="M108 ${gy - 58}H192" style="fill:none;stroke:${SOIL};stroke-width:8"/>`;
    s += plantlet(150, gy - 60, 120, { seed: 6, leaves: 4 });
    s += `<path d="M98 ${gy - 64}Q98 ${gy - 196} 150 ${gy - 200}Q202 ${gy - 196} 202 ${gy - 64}" style="fill:${GLASS};opacity:.18;stroke:${mx(GLASS, INK, 50)};stroke-width:2"/>`;
  }
  return s;
}

const CSS = `
.gm.cs { background: var(--sim-bg-deep); border-radius: 14px; padding: 8px 14px; gap: 6px; }
.cs .play { display: grid; grid-template-columns: 410px minmax(0, 1fr); gap: 16px; align-items: start; }
.cs .pic { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--look-radius, 12px); padding: 4px; }
.cs .pic svg { width: 400px; height: 293px; display: block; }
.cs .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.cs .ask { margin: 0; font: 600 25px/1.2 var(--sim-font-display); color: var(--sim-label); }
.cs .starts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.cs .cs-start { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px; min-height: 44px; font: 700 21px/1.15 var(--sim-font); text-align: center; }
.cs .cs-start svg { width: 100%; max-width: 230px; height: auto; aspect-ratio: 120 / 92; display: block; }
.cs .cs-start { padding: 10px 6px; }
.cs .steps { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.cs .cs-step { min-height: 56px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 10px; font: 700 20px/1.15 var(--sim-font); text-align: center; }
.cs .cs-step[data-done="1"] { background: color-mix(in oklab, var(--sim-good) 22%, var(--sim-bg-surface)); border-color: var(--sim-good); }
.cs .cs-step b { font: 600 18px/1 var(--sim-font-display); color: var(--sim-good); }
.cs .got { margin: 0; font-size: 19px; font-weight: 800; color: var(--sim-label-muted); }
.cs .why { margin: 0; min-height: 26px; font-size: 20px; line-height: 1.3; font-weight: 700; color: var(--sim-label); }
.cs .why[data-k="bad"] { color: var(--sim-error); }
.cs .why[data-k="good"] { color: var(--sim-good); }
.cs[data-phase="start"] .steps, .cs[data-phase="start"] .got { display: none; }
.cs[data-phase="steps"] .starts { display: none; }
.sim-dom-root--portrait .cs .play { display: flex; flex-direction: column; gap: 6px; }
.sim-dom-root--portrait .gm.cs { padding: 6px; }
.sim-dom-root--portrait .cs .pic { align-self: center; }
.sim-dom-root--portrait .cs .pic svg { width: 280px; height: 205px; }
.sim-dom-root--portrait .cs .starts { gap: 6px; }
.sim-dom-root--portrait .cs .cs-start { padding: 4px; font-size: 14px; }
.sim-dom-root--portrait .cs .cs-start svg { width: 96px; height: 74px; }
.sim-dom-root--portrait .cs .steps { grid-template-columns: minmax(0, 1fr); gap: 6px; }
.sim-dom-root--portrait .cs .ask { font-size: 17px; }
.sim-dom-root--portrait .cs .cs-step { min-height: 48px; font-size: 16px; }
.sim-dom-root--portrait .cs .got { font-size: 15px; }
.sim-dom-root--portrait .cs .why { font-size: 16px; min-height: 22px; }
`;

export class CultureStepsGame extends GameBoard {
  static HEIGHT = 405;
  static OBJECTIVE = { prompt: { en: 'Grow a whole new plant from one small piece. First choose a starting piece that can work: a dead xylem piece will not grow. Then put the steps in order: nutrient medium, mass of cells, shoots and roots, plantlet, and soil.' } };
  static ARIA_LABEL = 'Grow a plant by tissue culture. Choose a starting piece: a living carrot phloem piece, a living leaf piece or a dead xylem vessel piece. Then tap the steps in order: nutrient medium, mass of unspecialised cells, shoots and roots, plantlet, hardening and soil. Each right step grows the culture in the picture.';

  async setup() {
    await super.setup();
    this._reset();
    const starts = STARTS.map((t) => `<div class="tap btn cs-start" role="button" tabindex="0" data-s="${t.id}">${startArt(t.id)}<span>${t.label}</span></div>`).join('');
    const steps = MENU.map((id) => { const t = STEPS.find((x) => x.id === id); return `<div class="tap btn cs-step" role="button" tabindex="0" data-p="${id}"><b></b><span>${t.label}</span></div>`; }).join('');
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm cs" data-phase="start"><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${artDefs()}${cwDefs()}</defs></svg><div class="gm-head"><h2>Regrow a plant</h2></div>
        <div class="play"><div class="pic"><svg viewBox="0 0 ${VW} ${VH}" aria-hidden="true"></svg></div>
        <div class="side"><p class="ask"></p><div class="starts">${starts}</div><p class="got"></p><div class="steps">${steps}</div><p class="why" aria-live="polite"></p></div></div></div>`,
    });
    this.root.querySelectorAll('.cs-start').forEach((el) => onTap(el, () => this._start(el.dataset.s)));
    this.root.querySelectorAll('.cs-step').forEach((el) => onTap(el, () => this._step(el.dataset.p)));
    this._draw();
  }
  _reset() { this._startId = null; this._done = 0; this._line = ''; this._k = ''; this._won = false; }
  _start(id) {
    if (this._startId) return;
    const t = STARTS.find((x) => x.id === id);
    if (!t.live) { this._line = 'Dead cells cannot divide. A xylem vessel is a dead, empty tube. Choose a living piece.'; this._k = 'bad'; this._draw(); return; }
    this._startId = id; this._line = `${t.label}: living cells that can divide. Now the first step.`; this._k = 'good';
    this._draw();
  }
  _step(id) {
    if (!this._startId || this._won) return;
    const i = STEPS.findIndex((x) => x.id === id);
    if (i < this._done) return;
    if (i > this._done) { this._line = STEPS[i].need; this._k = 'bad'; this._draw(); return; }
    this._done += 1;
    const say = ['The piece sits on a jelly with sugar, nutrients and hormones.', 'Its cells divide into a mass of alike, unspecialised cells.', 'Cells in the mass take on new jobs: shoots and roots form.', 'A small plantlet with roots and a shoot.', 'Hardened under a cover, then planted in soil: a whole new plant.'][i];
    this._line = say; this._k = 'good';
    if (this._done === STEPS.length) this._won = true;
    this._draw();
    if (this._won) finishGame(this);
  }
  _draw() {
    const r = this.root, gm = r.querySelector('.gm');
    if (!gm) return;
    gm.dataset.phase = this._startId ? 'steps' : 'start';
    const svg = r.querySelector('.pic svg');
    if (svg) svg.innerHTML = this._startId ? stage(this._done, this._startId) : stage(-1, null) + `<rect x="${VW / 2 - 62}" y="${VH / 2 - 44}" width="124" height="34" rx="9" style="fill:${W_};stroke:${INK};stroke-width:2.4"/><text x="${VW / 2}" y="${VH / 2 - 21}" text-anchor="middle" style="font-family:var(--sim-font-display);font-weight:600;font-size:18px;fill:${INK}">Choose a piece</text>`;
    const ask = r.querySelector('.ask');
    if (ask) ask.textContent = this._startId ? (this._won ? 'A whole new plant from one small piece.' : `Step ${this._done + 1} of ${STEPS.length}: what comes next?`) : 'Which piece can grow into a whole plant?';
    const got = r.querySelector('.got');
    if (got && this._startId) got.textContent = `Start: ${STARTS.find((x) => x.id === this._startId).label}`;
    r.querySelectorAll('.cs-step').forEach((el) => { const i = STEPS.findIndex((x) => x.id === el.dataset.p), d = i < this._done; el.dataset.done = d ? '1' : '0'; const b = el.querySelector('b'); if (b) b.textContent = d ? String(i + 1) : ''; el.setAttribute('aria-pressed', String(d)); });
    const w = r.querySelector('.why');
    if (w) { w.textContent = this._line; w.dataset.k = this._k; }
    this.relayout?.();
  }
  checkObjective() { return this._won ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._draw(); }
}
