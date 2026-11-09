// PollenDeliveryGame - L05 blk-l05-s06. Build a wind-pollinated flower, then an insect-pollinated flower, by choosing true traits. The drawing
// changes with each choice. Test shows which trait fits. Control names: [data-pick="pollen:light|pollen:large|stigma:feathery|stigma:sticky|
// petals:plain|petals:bright"], [data-act="test"], [data-act="next"].
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { fill } from 'simulations/base/kit/SimSvg.js';
import { shape, pollenGrain, bee, FLOWER_COLOURS as C } from '../shared/FlowerArt.js';
import { ART_INK, svgPlantColour as P, stroke } from '../shared/PlantArt.js';

const n1f = (v) => Math.round(v * 10) / 10;
const TRAITS = [
  { id: 'pollen', name: 'Pollen', options: [['light', 'Light and small'], ['large', 'Large and sticky']] },
  { id: 'stigma', name: 'Stigma', options: [['feathery', 'Long and feathery'], ['sticky', 'Sticky']] },
  { id: 'petals', name: 'Petals', options: [['plain', 'Small and plain'], ['bright', 'Bright, with nectar']] },
];
const ROUNDS = [
  { name: 'wind-pollinated flower', key: { pollen: 'light', stigma: 'feathery', petals: 'plain' },
    why: { pollen: 'Wind can lift only light, small grains.', stigma: 'A sticky knob catches little from moving air. A long feathery stigma traps grains.', petals: 'Wind does not need colour or nectar.' },
    win: 'Wind carries the light grains, and the feathery stigma traps them.' },
  { name: 'insect-pollinated flower', key: { pollen: 'large', stigma: 'sticky', petals: 'bright' },
    why: { pollen: 'Large, sticky grains attach to an insect\'s body.', stigma: 'A sticky stigma receives grains from an insect.', petals: 'Colour and nectar attract the insect.' },
    win: 'The bee comes for nectar, and sticky grains travel on its body.' },
];
const CSS = `
.pd { background: var(--sim-bg-deep); }
.pd .board { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 12px; align-items: start; }
.pd .pic { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--sim-radius-lg); overflow: hidden; }
.pd .pic svg { display: block; width: 100%; height: auto; }
.pd .side { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.pd .tr { display: grid; grid-template-columns: 70px minmax(0, 1fr) minmax(0, 1fr); gap: 6px; align-items: center; }
.pd .tn { font: 800 15px/1.1 var(--sim-font); margin: 0; }
.pd .btn { min-height: 48px; padding: 2px 6px; line-height: 1.15; }
.pd .btn[aria-pressed="true"] { background: color-mix(in oklab, var(--sim-accent) 34%, var(--sim-bg-surface)); border-color: var(--sim-accent); }
.pd .acts { display: flex; gap: 8px; align-items: center; min-height: 48px; }
.pd .go { background: var(--sim-accent); color: var(--sim-bg-deep); min-width: 130px; }
.pd .msg { font: 700 15px/1.3 var(--sim-font); margin: 0; min-width: 0; flex: 1 1 auto; }
.sim-dom-root:not(.sim-dom-root--portrait) .pd .gm-head .kicker { display: none; }
.sim-dom-root:not(.sim-dom-root--portrait) .pd .board { grid-template-columns: 420px minmax(0, 1fr); }
.sim-dom-root:not(.sim-dom-root--portrait) .pd .side { padding-top: 40px; gap: 12px; }
.sim-dom-root:not(.sim-dom-root--portrait) .pd .btn { min-height: 60px; font-size: 16px; }
.sim-dom-root--portrait .pd .board { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .pd .tr { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.sim-dom-root--portrait .pd .tn { grid-column: 1 / -1; }
.sim-dom-root--portrait .pd .acts { flex-wrap: wrap; }
.sim-dom-root--portrait .pd .acts .btn { flex: 1 1 100%; }
`;
// One flower, side on, in a quiet field. Each choice changes the drawing: long stalks with hanging anthers or short firm stamens; a feathery
// or a sticky stigma; small plain scales or bright petals with nectar. Nothing is drawn for a row not yet chosen.
function flower(p, tested) {
  const W = 300, H = 226, x = 150, y = 152, sy = y - 68;
  const skyC = `color-mix(in oklab, ${P('skyPale')} 72%, var(--sim-elev-peak))`, far = `color-mix(in oklab, ${P('leafLit')} 40%, ${P('skyPale')})`, near = `color-mix(in oklab, ${P('leafLit')} 62%, ${P('skyPale')})`;
  let s = `<defs><linearGradient id="pd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${P('skyPale')}"/><stop offset="1" style="stop-color:${skyC}"/></linearGradient></defs><rect width="${W}" height="${H}" style="fill:url(#pd-sky)"/>`;
  s += `<path d="M0 176Q70 158 150 170T300 164V${H}H0Z" ${fill(far)}/><path d="M0 200Q90 182 180 196T300 190V${H}H0Z" ${fill(near)}/>`;
  for (let i = 0; i < 16; i++) { const gx = 8 + i * 19.3, gh = 8 + ((i * 7) % 11); s += `<path d="M${gx} ${H}q${i % 2 ? 3 : -3} ${-gh * 0.6} ${i % 2 ? 7 : -7} ${-gh}" ${stroke(P('leaf'), 1.6, 'opacity:.46')}/>`; }
  s += `<path d="M${x + 8} ${H + 4}Q${x - 8} ${y + 44} ${x} ${y + 6}" ${stroke(C.stem, 8)}/><path d="M${x + 6} ${H + 4}Q${x - 10} ${y + 44} ${x - 2} ${y + 6}" ${stroke(C.stemL, 2.6)}/>`;
  s += shape(`M${x + 3} ${H - 6}C${x - 30} ${H - 24} ${x - 62} ${H - 54} ${x - 86} ${H - 46}C${x - 58} ${H - 36} ${x - 30} ${H - 8} ${x + 2} ${H + 4}Z`, C.leaf, 2);
  s += shape(`M${x + 3} ${H - 10}C${x + 34} ${H - 22} ${x + 60} ${H - 46} ${x + 92} ${H - 38}C${x + 62} ${H - 26} ${x + 34} ${H} ${x + 2} ${H + 4}Z`, C.leafD, 2);
  const fan = (a, d, col, w = 2.4) => `<g transform="translate(${x} ${y}) rotate(${a})">${shape(d, col, w)}</g>`;
  if (p.petals === 'bright') {
    const pet = 'M0 0C-34 -20 -40 -84 -6 -112C-2 -116 2 -116 6 -112C40 -84 34 -20 0 0Z';
    for (const a of [-92, 92, -62, 62, -30, 30, 0]) s += fan(a, pet, Math.abs(a) > 50 ? C.redD : C.red) + `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 -8L0 -92M0 -20C-8 -40 -10 -62 -7 -84M0 -20C8 -40 10 -62 7 -84" ${stroke(C.pinkL, 1.5, 'opacity:.55')}/><path d="M0 -6L0 -38" ${stroke(C.yel, 7, 'opacity:.8')}/></g>`;
  } else if (p.petals === 'plain') for (const a of [-70, -38, 38, 70]) s += fan(a, 'M0 0C-9 -10 -10 -34 0 -46C10 -34 9 -10 0 0Z', C.leafL, 2);
  for (const a of [-104, 104]) s += fan(a, 'M0 0C-8 -6 -9 -20 0 -28C9 -20 8 -6 0 0Z', C.leaf, 2);
  s += shape(`M${x - 15} ${y + 2}C${x - 21} ${y - 14} ${x - 10} ${y - 28} ${x - 3} ${y - 36}L${x + 3} ${y - 36}C${x + 10} ${y - 28} ${x + 21} ${y - 14} ${x + 15} ${y + 2}C${x + 6} ${y + 7} ${x - 6} ${y + 7} ${x - 15} ${y + 2}Z`, C.ovary, 2.4);
  if (p.petals === 'bright') for (const dx of [-13, 12, 0]) s += `<circle cx="${x + dx}" cy="${y + 3 - Math.abs(dx) * 0.2}" r="3.4" style="fill:${C.yelL};stroke:${C.yelD};stroke-width:1"/>`;
  s += `<path d="M${x} ${y - 36}L${x} ${sy}" ${stroke(C.leafD, 7)}/><path d="M${x} ${y - 36}L${x} ${sy}" ${stroke(C.leafL, 4.6)}/>`;
  if (p.stigma === 'feathery') for (const a of [-64, -30, 30, 64]) {
    let b = `<path d="M0 0Q${a < 0 ? -6 : 6} -26 0 -56" ${stroke(C.pinkD, 3)}/>`;
    for (let i = 0; i < 9; i++) { const v = 6 + i * 5.6, l = 11 - i * 0.7, o = (a < 0 ? -1 : 1) * Math.sin((v / 56) * 3.14) * 5; b += `<path d="M${n1f(o - l)} ${n1f(-v - 5)}L${n1f(o)} ${n1f(-v)}L${n1f(o + l)} ${n1f(-v - 5)}" style="fill:none;stroke:${C.pink};stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"/>`; }
    s += `<g transform="translate(${x} ${sy}) rotate(${a})">${b}</g>`;
  } else if (p.stigma === 'sticky') s += shape(`M${x - 15} ${sy + 2}C${x - 24} ${sy - 18} ${x + 24} ${sy - 18} ${x + 15} ${sy + 2}C${x + 8} ${sy + 8} ${x - 8} ${sy + 8} ${x - 15} ${sy + 2}Z`, C.pink, 2.4) + `<circle cx="${x - 5}" cy="${sy - 7}" r="3.2" style="fill:var(--sim-elev-peak);opacity:.8"/><circle cx="${x + 7}" cy="${sy + 1}" r="2" style="fill:var(--sim-elev-peak);opacity:.7"/>`;
  if (p.pollen === 'light') for (const [d, ox, oy] of [[-1, 112, 8], [-1, 74, -26], [1, 74, -22], [1, 114, 12]]) {
    const ex = x + d * ox, ey = y + oy - 8;
    s += `<path d="M${x + d * 10} ${y - 8}C${x + d * ox * 0.4} ${y - 74} ${ex - d * 8} ${ey - 40} ${ex} ${ey}" ${stroke(C.yelL, 2.2)}/>`;
    s += shape(`M${ex - 5} ${ey + 2}C${ex - 8} ${ey + 12} ${ex - 6} ${ey + 24} ${ex} ${ey + 30}C${ex + 6} ${ey + 24} ${ex + 8} ${ey + 12} ${ex + 5} ${ey + 2}C${ex + 2} ${ey - 1} ${ex - 2} ${ey - 1} ${ex - 5} ${ey + 2}Z`, C.yel, 2) + `<path d="M${ex} ${ey + 3}L${ex} ${ey + 27}" ${stroke(C.yelD, 1.2)}/>`;
  }
  if (p.pollen === 'large') for (const [dx, tx, ty, g] of [[-12, -52, -66, 1], [-6, -28, -84, 0], [6, 30, -86, 1], [12, 54, -64, 0]]) {
    s += `<path d="M${x + dx} ${y - 16}L${x + tx} ${y + ty}" ${stroke(C.yelD, 4.6)}/><path d="M${x + dx} ${y - 16}L${x + tx} ${y + ty}" ${stroke(C.yelL, 3)}/>` + `<ellipse cx="${x + tx}" cy="${y + ty}" rx="9" ry="7" transform="rotate(${tx} ${x + tx} ${y + ty})" style="fill:${C.yel};stroke:${C.yelD};stroke-width:1.6"/>`;
    if (g) s += pollenGrain(x + tx + (tx < 0 ? -7 : 7), y + ty - 7, 0.56, { spiny: true });
  }
  if (tested === 'wind') {
    for (const [yy, xx] of [[34, 8], [66, 180], [104, 12]]) s += `<path d="M${xx} ${yy}c24 -10 48 10 72 0s30 -8 40 -2" ${stroke(ART_INK, 2.6, 'opacity:.62')}/>`;
    for (let i = 0; i < 22; i++) { const u = i / 21, gx = 20 + u * 248, gy = 118 - Math.sin(u * 3.1) * 56 + ((i * 17) % 13); s += `<circle cx="${n1f(gx)}" cy="${n1f(gy)}" r="1.9" style="fill:${C.yelD}"/>`; }
  }
  if (tested === 'bee') s += bee(x + 74, y - 104, 1.15, { flip: true }) + pollenGrain(x + 86, y - 92, 0.5, { spiny: true });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="The flower you have built">${s}</svg>`;
}

export class PollenDeliveryGame extends GameBoard {
  static ARIA_LABEL = 'Build a wind-pollinated flower and an insect-pollinated flower by choosing pollen, stigma and petals.';
  static OBJECTIVE = { prompt: { en: 'Build a wind-pollinated flower and an insect-pollinated flower.' } };
  static PORTRAIT_HEIGHT = 790;
  constructor(container, config) { super(container, config); this._reset(); }
  _reset() { this._r = 0; this._p = {}; this._ok = false; this._won = false; this._msg = 'Choose one for each row, then test.'; }
  async setup() {
    await super.setup();
    mountGame(this, { check: false, css: CSS, html: `<div class="gm pd"><div class="gm-head"><p class="kicker">Build a flower</p><h2 data-title></h2></div>
      <div class="board"><div class="pic" data-pic></div><div class="side">
      ${TRAITS.map((t) => `<div class="tr"><p class="tn">${t.name}</p>${t.options.map(([v, l]) => `<button class="btn tap" data-pick="${t.id}:${v}">${l}</button>`).join('')}</div>`).join('')}
      <div class="acts"><button class="btn tap go" data-act="test">Test it</button><button class="btn tap go" data-act="next" hidden>Next flower</button><p class="msg" data-msg aria-live="polite"></p></div></div></div></div>` });
    this.root.querySelectorAll('[data-pick]').forEach((b) => onTap(b, () => { if (this._ok) return; const [t, v] = b.dataset.pick.split(':'); this._p[t] = v; this._paint(); }));
    this.root.querySelector('[data-act="test"]')?.addEventListener('click', () => this._test());
    this.root.querySelector('[data-act="next"]')?.addEventListener('click', () => { this._r = 1; this._p = {}; this._ok = false; this._msg = 'Choose one for each row, then test.'; this._paint(); });
    this._paint();
  }
  _test() {
    const R = ROUNDS[this._r];
    const miss = TRAITS.find((t) => !this._p[t.id]);
    if (miss) { this._msg = `Choose the ${miss.name.toLowerCase()} first.`; this._paint(); return; }
    const bad = TRAITS.find((t) => this._p[t.id] !== R.key[t.id]);
    if (bad) { this._msg = R.why[bad.id]; this.quill?.perform?.('shake'); this._paint(); return; }
    this._ok = true; this._msg = R.win; this.quill?.perform?.('nod');
    if (this._r === 1) { this._won = true; this.quill?.perform?.('hop'); this._paint(); finishGame(this); return; }
    this._paint();
  }
  checkObjective() { return this._won ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._paint(); }
  _paint() {
    const r = this.root; if (!r?.querySelector?.('[data-pic]')) return;
    r.querySelector('[data-title]').textContent = `Build ${this._r ? 'an' : 'a'} ${ROUNDS[this._r].name}`;
    r.querySelector('[data-pic]').innerHTML = flower(this._p, this._ok ? (this._r ? 'bee' : 'wind') : null);
    r.querySelectorAll('[data-pick]').forEach((b) => { const [t, v] = b.dataset.pick.split(':'); b.setAttribute('aria-pressed', String(this._p[t] === v)); });
    r.querySelector('[data-msg]').textContent = this._msg;
    r.querySelector('[data-act="test"]').hidden = this._ok;
    r.querySelector('[data-act="next"]').hidden = !(this._ok && this._r === 0);
  }
}
