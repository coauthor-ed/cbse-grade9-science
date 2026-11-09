// PickTheInstrumentGame - six real things and three tools. Each object sits on a strip that shows the reach of each tool, so size decides, except for
// the living amoeba, where being alive decides. A wrong pick says why and stays on the same object, so a learner can always finish.
// Sizes are read from the book's size scale, rounded.
import { GameBoard, mountGame, finishGame, onTap } from 'simulations/base/kit/GameFrame.js';
import { cwDefs, cheekCell, bacterium, n1, T, mx } from '../shared/CellWorld.js';

// One small drawing per round, 120 x 90, not to scale with each other (the strip gives the size).
const W_ = T('elev-peak'), INK = T('strata-6');
function art(i) {
  let g = '';
  if (i === 0) { // fish egg: clear amber sphere, yolk, an oil drop, the dark eye of the young fish
    g = `<circle cx="60" cy="47" r="34" style="fill:${mx('series-2', W_, 34)};stroke:${mx('series-2', INK, 60)};stroke-width:2;opacity:.9"/><circle cx="64" cy="52" r="20" style="fill:${mx('series-2', 'series-8', 60)};opacity:.8"/><circle cx="52" cy="40" r="6" style="fill:${mx('series-2', W_, 70)}"/><path d="M40 60C34 44 44 26 62 24" style="fill:none;stroke:${mx('series-2', INK, 50)};stroke-width:3;stroke-linecap:round;opacity:.55"/><circle cx="44" cy="58" r="4" style="fill:${INK}"/><ellipse cx="48" cy="28" rx="10" ry="5" style="fill:${W_};opacity:.65"/>`;
  } else if (i === 1) g = cheekCell(60, 46, 34, { seed: 4 });
  else if (i === 2) { // virus: a many-sided coat with spikes
    let sp = ''; for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; sp += `<path d="M${n1(60 + Math.cos(a) * 24)} ${n1(46 + Math.sin(a) * 24)}L${n1(60 + Math.cos(a) * 34)} ${n1(46 + Math.sin(a) * 34)}" style="stroke:${mx('series-3', INK, 60)};stroke-width:2.4"/><circle cx="${n1(60 + Math.cos(a) * 35)}" cy="${n1(46 + Math.sin(a) * 35)}" r="3" style="fill:${T('series-3')}"/>`; }
    g = sp + `<path d="M60 20L82 33V59L60 72L38 59V33Z" style="fill:${mx('series-3', W_, 50)};stroke:${mx('series-3', INK, 60)};stroke-width:2"/><path d="M60 20L60 46L82 33M60 46L38 33M60 46V72" style="fill:none;stroke:${mx('series-3', INK, 40)};stroke-width:1.2;opacity:.6"/>`;
  } else if (i === 3) { // amoeba: a soft cell pushing out pseudopodia, nucleus, food vacuoles
    g = `<path d="M30 52C18 40 30 26 42 32C44 16 64 14 70 28C82 18 100 26 94 40C108 46 102 64 88 62C86 76 66 80 58 68C46 78 26 72 30 52Z" style="fill:url(#cw-cyto) ${mx('series-1', W_, 40)};stroke:${mx('series-1', INK, 60)};stroke-width:2"/><circle cx="62" cy="46" r="9" style="fill:url(#cw-nuc) ${T('series-5')}"/><circle cx="80" cy="40" r="4" style="fill:${mx('sea-shallow', W_, 30)};stroke:${mx('sea-shallow', INK, 50)};stroke-width:1"/><circle cx="44" cy="54" r="3" style="fill:${mx('sea-shallow', W_, 30)};stroke:${mx('sea-shallow', INK, 50)};stroke-width:1"/>`;
  } else if (i === 4) { // ribosome: two rounded subunits, a large and a small
    g = `<path d="M30 52C26 34 44 22 62 26C82 22 96 36 90 52C84 64 40 66 30 52Z" style="fill:url(#cw-ribo) ${T('sea-deep')};stroke:${INK};stroke-width:1.6"/><path d="M38 62C38 54 56 52 66 56C80 54 86 62 80 68C70 76 44 74 38 62Z" style="fill:${mx('series-1', W_, 40)};stroke:${INK};stroke-width:1.6"/><ellipse cx="50" cy="34" rx="10" ry="4" style="fill:${W_};opacity:.5"/>`;
  } else g = bacterium(52, 46, 0.42, {});
  return `<svg viewBox="0 0 120 90" aria-hidden="true"><defs>${cwDefs()}</defs>${g}</svg>`;
}

const ROUNDS = [
  { n: 'A fish egg', s: 'about 2 mm', m: 2e-3, key: 'eye', why: 'It is larger than 0.1 mm, so your eye is enough.' },
  { n: 'A cheek cell', s: 'about 50 \u00b5m', m: 5e-5, key: 'light', why: 'It is below the 0.1 mm limit of the eye, and well above 200 nm.' },
  { n: 'A virus', s: 'about 80 nm', m: 8e-8, key: 'electron', why: 'It is smaller than 200 nm, so a light microscope cannot show it clearly.' },
  { n: 'A living amoeba, moving', s: 'about 0.4 mm', m: 4e-4, key: 'light', why: 'You want to watch it alive. Specimens in an electron microscope are not alive.' },
  { n: 'A ribosome', s: 'about 25 nm', m: 2.5e-8, key: 'electron', why: 'It is far below 200 nm, so more magnification alone would only give a blur.' },
  { n: 'A bacterium', s: 'about 3 \u00b5m', m: 3e-6, key: 'light', why: 'It is above 200 nm, so a school light microscope shows it.' },
];
const TOOLS = [['eye', 'Unaided eye', 'down to 0.1 mm'], ['light', 'Light microscope', 'down to about 200 nm'], ['electron', 'Electron microscope', 'down to about 0.1 nm']];
const X = (m) => ((Math.log10(1e-1) - Math.log10(m)) / 9) * 100;   // 0.1 m at the left, 0.1 nm at the right

const CSS = `
.gm.pi { background: var(--sim-bg-deep); border-radius: var(--sim-radius-md); }
.pi .pi-card { display: flex; flex-direction: column; gap: 5px; padding: 8px 12px; border-radius: var(--sim-radius-md); background: var(--sim-bg-surface); border: calc(2px * var(--look-rim)) solid var(--sim-stroke); }
.pi .pi-top { display: flex; align-items: center; gap: 12px; } .pi .pi-art { flex: 0 0 auto; width: 112px; height: 84px; border-radius: var(--sim-radius-md); background: radial-gradient(circle at 45% 40%, var(--sim-elev-peak), color-mix(in oklab, var(--sim-sea-shallow) 30%, var(--sim-elev-peak))); } .pi .pi-art svg { width: 100%; height: 100%; display: block; }
.pi .pi-name { font-family: var(--sim-font-display); font-size: 20px; font-weight: 600; }
.pi .pi-size { font-size: 16px; font-weight: 800; color: var(--sim-label-muted); }
.pi .pi-strip { position: relative; height: 28px; border-radius: 10px; overflow: hidden; background: color-mix(in oklab, var(--sim-series-1) 34%, var(--sim-bg-surface)); }
.pi .pi-z { position: absolute; top: 0; bottom: 0; left: 0; }
.pi .pi-z.l { width: ${X(2e-7).toFixed(1)}%; background: color-mix(in oklab, var(--sim-series-8) 42%, var(--sim-bg-surface)); }
.pi .pi-z.e { width: ${X(1e-4).toFixed(1)}%; background: color-mix(in oklab, var(--sim-series-3) 52%, var(--sim-bg-surface)); }
.pi .pi-dot { position: absolute; top: 3px; width: 22px; height: 22px; margin-left: -11px; border-radius: 50%; background: var(--sim-magma); border: 3px solid var(--sim-bg-surface); }
.pi .pi-keys { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 14px; font-weight: 800; }
.pi .pi-keys i { display: inline-block; width: 13px; height: 13px; border-radius: 4px; margin-right: 5px; vertical-align: -1px; }
.pi .pi-opts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.pi .pi-opts button { min-height: 50px; padding: 6px 8px; font-family: var(--sim-font); color: var(--sim-label); }
.pi .pi-opts b { display: block; font-size: 16px; } .pi .pi-opts small { font-size: 14px; color: var(--sim-label-muted); }
.pi .pi-opts button[data-bad] { border-color: var(--sim-error); }
.pi .pi-opts button[data-good] { border-color: var(--sim-success); }
.pi .pi-say { min-height: 22px; font-size: 16px; font-weight: 700; margin: 0; }
.pi .pi-next { align-self: flex-start; min-height: 48px; padding: 6px 18px; font-family: var(--sim-font); font-weight: 800; color: var(--sim-label); }
@media (max-width: 600px) { .pi .pi-opts { grid-template-columns: minmax(0, 1fr); } }
.sim-dom-root--portrait .pi .pi-opts { grid-template-columns: minmax(0, 1fr); }
`;
export class PickTheInstrumentGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'Choose the tool that will really show each thing.' } };
  static ARIA_LABEL = 'A game with six rounds. Each round names an object and its size, and shows it on a strip marking the reach of the eye, the light microscope and the electron microscope. Choose the tool that will show it.';
  async setup() {
    await super.setup();
    this._round = 0; this._won = false;
    mountGame(this, { css: CSS, check: false, html: `<div class="gm pi"><div class="gm-head"><h2>Which tool will show it?</h2><p class="sub">Round <span class="pi-n">1</span> of ${ROUNDS.length}</p></div>
      <div class="pi-card"><div class="pi-top"><div class="pi-art"></div><div><div class="pi-name"></div><div class="pi-size"></div></div></div><div class="pi-strip" role="img" aria-label="Where this object sits on the scale of tools"><span class="pi-z l"></span><span class="pi-z e"></span><span class="pi-dot"></span></div>
      <div class="pi-keys"><span><i style="background:color-mix(in oklab, var(--sim-series-3) 52%, var(--sim-bg-surface))"></i>eye</span><span><i style="background:color-mix(in oklab, var(--sim-series-8) 42%, var(--sim-bg-surface))"></i>light</span><span><i style="background:color-mix(in oklab, var(--sim-series-1) 34%, var(--sim-bg-surface))"></i>electron only</span></div></div>
      <div class="pi-opts">${TOOLS.map(([k, a, b]) => `<button type="button" class="tap btn" data-k="${k}"><b>${a}</b><small>${b}</small></button>`).join('')}</div>
      <p class="pi-say" aria-live="polite"></p><button type="button" class="tap btn pi-next" hidden>Next</button></div>` });
    const q = (s) => this.root.querySelector(s);
    this.root.querySelectorAll('.pi-opts button').forEach((b) => onTap(b, () => this._pick(b)));
    const nx = q('.pi-next'); if (nx) onTap(nx, () => this._next());
    this._deal();
  }
  _deal() {
    const r = ROUNDS[this._round], q = (s) => this.root.querySelector(s);
    if (!q('.pi-name')) return;
    q('.pi-n').textContent = String(this._round + 1); q('.pi-name').textContent = r.n; q('.pi-art').innerHTML = art(this._round); q('.pi-size').textContent = r.s; q('.pi-dot').style.left = `${X(r.m).toFixed(1)}%`;
    q('.pi-say').textContent = ''; q('.pi-next').hidden = true;
    this.root.querySelectorAll('.pi-opts button').forEach((b) => { b.removeAttribute('data-bad'); b.removeAttribute('data-good'); b.disabled = false; });
    this.relayout?.();
  }
  _pick(b) {
    const r = ROUNDS[this._round], say = this.root.querySelector('.pi-say');
    if (b.dataset.k === r.key) {
      b.setAttribute('data-good', ''); say.textContent = r.why;
      this.root.querySelectorAll('.pi-opts button').forEach((x) => { x.disabled = true; });
      if (this._round === ROUNDS.length - 1) { this._won = true; finishGame(this); } else this.root.querySelector('.pi-next').hidden = false;
    } else {
      b.setAttribute('data-bad', ''); say.textContent = `Not this one. ${r.key === 'light' && r.n.includes('living') ? 'Think about whether the specimen stays alive.' : 'Look where the dot sits on the strip, then try again.'}`;
    }
    this.relayout?.();
  }
  _next() { if (this._round < ROUNDS.length - 1) { this._round += 1; this._deal(); } }
  checkObjective() { return this._won ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._round = 0; this._won = false; this._deal(); }
}
