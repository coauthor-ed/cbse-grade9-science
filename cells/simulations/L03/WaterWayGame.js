// WaterWayGame - eight real cases. The rule is the win condition: compare the solute inside and outside, then say which way the NET movement of water goes.
// Solute dots on the board are a picture of more, less or same; the counts are made up and a line says so. A wrong answer gives a reason and the same case again.
import { GameBoard, mountGame, finishGame, onTap } from 'simulations/base/kit/GameFrame.js';
import { cwDefs, cheekCell, soluteDot, T, mx } from '../shared/CellWorld.js';

// One small drawing per case, 120 x 90, so each case has its own picture.
const W_ = T('elev-peak'), INK = T('strata-6');
const beaker = (inner, tint) => `<path d="M30 14V76C30 82 34 84 40 84H80C86 84 90 82 90 76V14" style="fill:none;stroke:${mx('sea-shallow', INK, 60)};stroke-width:2.6"/><path d="M32 34H88V76C88 80 85 82 80 82H40C35 82 32 80 32 76Z" style="fill:${tint};opacity:.8"/>${inner}<path d="M32 34H88" style="stroke:${W_};stroke-width:2;opacity:.9"/><path d="M36 18V74" style="stroke:${W_};stroke-width:3;opacity:.5"/>`;
const potato = (x, y, k) => `<path d="M${x - 14 * k} ${y - 10 * k}H${x + 14 * k}V${y + 12 * k}H${x - 14 * k}Z" style="fill:${mx('series-2', W_, 34)};stroke:${mx('strata-3', INK, 60)};stroke-width:1.6"/><path d="M${x - 14 * k} ${y - 10 * k}L${x - 8 * k} ${y - 16 * k}H${x + 20 * k}L${x + 14 * k} ${y - 10 * k}Z" style="fill:${mx('series-2', W_, 60)};stroke:${mx('strata-3', INK, 60)};stroke-width:1.4"/><path d="M${x + 14 * k} ${y - 10 * k}L${x + 20 * k} ${y - 16 * k}V${y + 6 * k}L${x + 14 * k} ${y + 12 * k}Z" style="fill:${mx('strata-3', W_, 50)};stroke:${mx('strata-3', INK, 60)};stroke-width:1.4"/>`;
const WATER = mx('series-1', W_, 30);
function art(i) {
  let g = '';
  if (i === 0) g = beaker(potato(58, 62, 1), WATER);
  else if (i === 1) g = beaker(potato(58, 64, 0.85) + [40, 52, 72, 80].map((x, k) => soluteDot(x, 78 - (k % 2) * 3, 3.2, { kind: 'salt' })).join(''), mx('series-1', W_, 18));
  else if (i === 2) g = beaker([[46, 64], [60, 70], [74, 62], [52, 76], [70, 77]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" style="fill:${mx('series-3', INK, 70)};stroke:${mx('series-3', INK, 50)};stroke-width:1.2"/><path d="M${x - 3} ${y}H${x + 3}" style="stroke:${W_};stroke-width:1.6"/>`).join('') + [40, 84].map((x) => soluteDot(x, 79, 3, { kind: 'salt' })).join(''), mx('series-1', W_, 18));
  else if (i === 3) g = `<circle cx="60" cy="46" r="40" style="fill:${mx('series-1', W_, 20)}"/>` + cheekCell(60, 46, 28, { seed: 3 });
  else if (i === 4) { // a root in wet soil, root hairs reaching into the water between grains
    g = `<rect x="4" y="4" width="112" height="82" rx="8" style="fill:${mx('strata-3', W_, 60)}"/>`;
    for (let k = 0; k < 22; k++) { const x = 10 + (k * 37) % 100, y = 12 + (k * 23) % 70; g += `<circle cx="${x}" cy="${y}" r="${4 + (k % 3)}" style="fill:${mx('strata-3', INK, 76)}"/><circle cx="${x + 5}" cy="${y + 3}" r="2" style="fill:${mx('series-1', W_, 40)}"/>`; }
    g += `<path d="M54 0C56 30 60 60 62 90" style="fill:none;stroke:${mx('strata-1', W_, 40)};stroke-width:12;stroke-linecap:round"/>`;
    for (let k = 0; k < 7; k++) { const y = 26 + k * 8, sd = k % 2 ? 1 : -1; g += `<path d="M${57 + k * 0.6} ${y}q${sd * 10} 2 ${sd * 18} -4" style="fill:none;stroke:${mx('strata-1', W_, 40)};stroke-width:1.6"/>`; }
  } else if (i === 5) g = `<circle cx="60" cy="46" r="40" style="fill:${mx('series-2', W_, 18)}"/>` + cheekCell(60, 46, 26, { seed: 5 }) + [[26, 24], [94, 30], [30, 70], [88, 72], [60, 12], [62, 82]].map(([x, y]) => soluteDot(x, y, 5)).join('');
  else if (i === 6) g = `<circle cx="60" cy="46" r="40" style="fill:${mx('series-1', W_, 20)}"/><ellipse cx="60" cy="47" rx="30" ry="22" style="fill:${mx('series-6', INK, 72)}"/><ellipse cx="60" cy="45" rx="30" ry="22" style="fill:${T('series-6')}"/><ellipse cx="60" cy="47" rx="14" ry="9" style="fill:${mx('series-6', INK, 76)};opacity:.7"/><path d="M38 38Q50 28 66 28" style="fill:none;stroke:${W_};stroke-width:2.6;opacity:.6"/>`;
  else { // a raisin in a bowl of water
    g = `<path d="M14 40H106C104 66 84 84 60 84S16 66 14 40Z" style="fill:${mx('strata-1', W_, 30)};stroke:${mx('strata-3', INK, 60)};stroke-width:2"/><ellipse cx="60" cy="40" rx="46" ry="9" style="fill:${WATER};stroke:${mx('strata-3', INK, 60)};stroke-width:2"/><path d="M48 44C44 36 54 30 60 34C66 28 76 36 72 44C74 52 62 54 58 50C52 54 44 52 48 44Z" style="fill:${mx('series-5', INK, 50)};stroke:${INK};stroke-width:1.2"/><path d="M52 40Q58 44 64 38M56 48Q62 46 68 46" style="fill:none;stroke:${mx('series-5', W_, 40)};stroke-width:1.2"/>`;
  }
  return `<svg viewBox="0 0 120 90" aria-hidden="true"><defs>${cwDefs()}</defs>${g}</svg>`;
}

const CASES = [
  { n: 'A potato piece in plain water', i: 8, o: 0, key: 'in', why: 'Plain water has almost no solute, so the net movement of water is into the cells.' },
  { n: 'A potato piece in 20 per cent salt solution', i: 8, o: 16, key: 'out', why: 'The solution holds more solute than the cells, so water leaves.' },
  { n: 'Soaked mung beans in a strong salt solution', i: 8, o: 16, key: 'out', why: 'The seeds lose water to the stronger solution.' },
  { n: 'A cell in a solution with the same solute concentration', i: 8, o: 8, key: 'none', why: 'Water still crosses both ways, but in equal amounts. There is no net change.' },
  { n: 'A root cell in wet soil', i: 8, o: 2, key: 'in', why: 'Soil water is dilute, so the net movement of water is into the root cell.' },
  { n: 'A cheek cell in 20 per cent sugar solution', i: 8, o: 16, key: 'out', why: 'The sugar stays outside and water leaves, so the cell shrinks.' },
  { n: 'A red blood cell in an isotonic solution', i: 8, o: 8, key: 'none', why: 'Isotonic means the same solute concentration, so the size stays the same.' },
  { n: 'A dry raisin in a bowl of water', i: 14, o: 0, key: 'in', why: 'The raisin holds far more solute than the water, so it takes up water and swells.' },
];
const OPTS = [['in', 'Water in'], ['out', 'Water out'], ['none', 'No net change']];
const dots = (n, seed) => { let s = '', x = seed; for (let i = 0; i < n; i++) { x = (x * 1664525 + 1013904223) % 4294967296; const a = (x % 1000) / 10; x = (x * 1664525 + 1013904223) % 4294967296; const b = (x % 1000) / 10; s += `<i style="left:${(a * 0.84 + 6).toFixed(1)}%;top:${(b * 0.76 + 10).toFixed(1)}%"></i>`; } return s; };
const CSS = `
.ww .ww-board { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0; height: 80px; border-radius: var(--sim-radius-md); overflow: hidden; border: calc(2px * var(--look-rim)) solid var(--sim-stroke); }
.ww .ww-side { position: relative; background: color-mix(in oklab, var(--sim-series-1) 18%, var(--sim-bg-surface)); }
.ww .ww-side.in { background: color-mix(in oklab, var(--sim-series-3) 20%, var(--sim-bg-surface)); border-left: 5px dashed var(--sim-series-7); }
.ww .ww-side b { position: absolute; left: 8px; top: 4px; font-size: 15px; z-index: 1; }
.ww .ww-side i { position: absolute; width: 11px; height: 11px; border-radius: 3px; background: var(--sim-series-2); }
.ww .ww-top { display: flex; align-items: center; gap: 12px; } .ww .ww-art { flex: 0 0 auto; width: 84px; height: 63px; } .ww .ww-art svg { width: 100%; height: 100%; display: block; }
.ww .ww-case { font-family: var(--sim-font-display); font-size: 20px; font-weight: 600; margin: 0; }
.ww .ww-opts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.ww .ww-opts button { min-height: 52px; padding: 6px; font-family: var(--sim-font); font-size: 16px; font-weight: 800; color: var(--sim-label); }
.ww .ww-opts button[data-bad] { border-color: var(--sim-error); }
.ww .ww-opts button[data-good] { border-color: var(--sim-success); }
.ww .ww-say { min-height: 22px; font-size: 16px; font-weight: 700; margin: 0; }
.ww .ww-next { align-self: flex-start; min-height: 48px; padding: 6px 18px; font-family: var(--sim-font); font-weight: 800; color: var(--sim-label); }
.gm.ww { background: var(--sim-bg-deep); border-radius: var(--sim-radius-md); }
`;
export class WaterWayGame extends GameBoard {
  static OBJECTIVE = { prompt: { en: 'For each case, say which way the net movement of water goes.' } };
  static ARIA_LABEL = 'A game with eight cases. Each shows solute outside and inside a cell. Choose water in, water out or no net change.';
  async setup() {
    await super.setup();
    this._round = 0; this._won = false;
    mountGame(this, { css: CSS, check: false, html: `<div class="gm ww"><div class="gm-head"><h2>Which way does the water go?</h2><p class="sub">Case <span class="ww-n">1</span> of ${CASES.length}. Solute dots are a rough picture only.</p></div>
      <div class="ww-top"><div class="ww-art"></div><p class="ww-case"></p></div><div class="ww-board"><div class="ww-side out"><b>Outside</b></div><div class="ww-side in"><b>Inside the cell</b></div></div>
      <div class="ww-opts">${OPTS.map(([k, t]) => `<button type="button" class="tap btn" data-k="${k}">${t}</button>`).join('')}</div>
      <p class="ww-say" aria-live="polite"></p><button type="button" class="tap btn ww-next" hidden>Next case</button></div>` });
    this.root.querySelectorAll('.ww-opts button').forEach((b) => onTap(b, () => this._pick(b)));
    const n = this.root.querySelector('.ww-next'); if (n) onTap(n, () => { if (this._round < CASES.length - 1) { this._round += 1; this._deal(); } });
    this._deal();
  }
  _deal() {
    const r = CASES[this._round], q = (s) => this.root.querySelector(s);
    if (!q('.ww-case')) return;
    q('.ww-n').textContent = String(this._round + 1); q('.ww-case').textContent = r.n; q('.ww-art').innerHTML = art(this._round);
    q('.ww-side.out').innerHTML = `<b>Outside</b>${dots(r.o, 7 + this._round)}`; q('.ww-side.in').innerHTML = `<b>Inside the cell</b>${dots(r.i, 31 + this._round)}`;
    q('.ww-say').textContent = ''; q('.ww-next').hidden = true;
    this.root.querySelectorAll('.ww-opts button').forEach((b) => { b.removeAttribute('data-bad'); b.removeAttribute('data-good'); b.disabled = false; });
    this.relayout?.();
  }
  _pick(b) {
    const r = CASES[this._round], say = this.root.querySelector('.ww-say');
    if (b.dataset.k === r.key) {
      b.setAttribute('data-good', ''); say.textContent = r.why;
      this.root.querySelectorAll('.ww-opts button').forEach((x) => { x.disabled = true; });
      if (this._round === CASES.length - 1) { this._won = true; finishGame(this); } else this.root.querySelector('.ww-next').hidden = false;
    } else { b.setAttribute('data-bad', ''); say.textContent = 'Not this one. Compare the solute on the two sides, then try again.'; }
    this.relayout?.();
  }
  checkObjective() { return this._won ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._round = 0; this._won = false; this._deal(); }
}
