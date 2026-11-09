// StomaDayGame - blk-l06-game (replaces SealOrBreatheGame). One leaf through one day in eight steps, from 6 am to night.
// At each step tap Open stomata or Close stomata. Open: the leaf takes in carbon dioxide (only in daylight) and loses
// water vapour (much more in the hot, dry middle of the day). Closed: neither. Win: at least 8 units of carbon dioxide
// and no more than 8 units of water lost. The numbers are made up, and the board says so. A loss shows why and offers
// Try again, so a learner can always win. Control names: .sd-pick[data-v] (Open stomata, Close stomata), .sd-again
// (Try again). No timer.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { cwDefs, T, mx, n1 } from '../shared/CellWorld.js';
import { artDefs } from '../shared/PlantArt.js';
import { taDefs, leafArt } from '../shared/TissueArt.js';

// light: carbon dioxide taken in if open; dry: water lost if open (made-up units)
const DAY = [
  { t: '6 am', sky: 'dawn', co2: 1, water: 1, say: 'Cool, soft light' },
  { t: '8 am', sky: 'morning', co2: 2, water: 1, say: 'Bright and still cool' },
  { t: '10 am', sky: 'day', co2: 3, water: 2, say: 'Bright, getting warm' },
  { t: 'Noon', sky: 'hot', co2: 3, water: 5, say: 'Very hot and dry' },
  { t: '2 pm', sky: 'hot', co2: 3, water: 5, say: 'Hot, dry wind' },
  { t: '4 pm', sky: 'day', co2: 2, water: 2, say: 'Cooler now' },
  { t: '6 pm', sky: 'dusk', co2: 1, water: 1, say: 'Evening light' },
  { t: 'Night', sky: 'night', co2: 0, water: 2, say: 'Dark: no photosynthesis' },
];
const NEED = 8, BUDGET = 8;
const W_ = T('elev-peak'), INK = T('strata-6');
const SKY = {
  dawn: mx('series-4', 'elev-peak', 34), morning: mx('sea-shallow', 'elev-peak', 50), day: mx('sea-shallow', 'elev-peak', 30),
  hot: mx('gold', 'elev-peak', 40), dusk: mx('series-4', 'series-2', 40), night: mx('sea-deep', 'strata-6', 60),
};
// the sun's place along the day (0 to 1) for each step
const SUN = [0.06, 0.2, 0.36, 0.5, 0.64, 0.8, 0.94, -1];

// sky colours top and horizon for each time of day
const SKY2 = {
  dawn: [mx('series-4', 'sea-deep', 50), mx('series-2', 'elev-peak', 40)], morning: [mx('sea-shallow', 'sea-deep', 70), mx('sea-shallow', 'elev-peak', 30)],
  day: [mx('sea-shallow', 'sea-deep', 60), mx('sea-shallow', 'elev-peak', 50)], hot: [mx('sea-shallow', 'gold', 60), mx('gold', 'elev-peak', 40)],
  dusk: [mx('series-4', 'sea-deep', 40), mx('series-2', 'flame', 60)], night: [mx('sea-deep', 'strata-6', 40), mx('sea-deep', 'strata-6', 70)],
};
// One guard cell in surface view: a kidney from pole to pole, thick pale inner wall on the pore side.
function guard(cx, cy, L, g, p, sx) {
  const top = cy - L / 2, bot = cy + L / 2, ox = cx + sx * (p + g * 2.1), ix = cx + sx * p;
  const d = `M${n1(cx + sx * 2)} ${n1(top)}C${n1(ox)} ${n1(top + L * 0.02)} ${n1(ox)} ${n1(bot - L * 0.02)} ${n1(cx + sx * 2)} ${n1(bot)}C${n1(cx + sx * 4)} ${n1(bot - L * 0.12)} ${n1(ix)} ${n1(cy + L * 0.24)} ${n1(ix)} ${n1(cy)}C${n1(ix)} ${n1(cy - L * 0.24)} ${n1(cx + sx * 4)} ${n1(top + L * 0.12)} ${n1(cx + sx * 2)} ${n1(top)}Z`;
  const wall = `M${n1(cx + sx * 4)} ${n1(top + L * 0.14)}C${n1(ix + sx * 3)} ${n1(cy - L * 0.22)} ${n1(ix + sx * 3)} ${n1(cy + L * 0.22)} ${n1(cx + sx * 4)} ${n1(bot - L * 0.14)}`;
  const gc = mx('elev-low', 'chloro', 44), gd = mx(gc, INK, 56);
  let s = `<path d="${d}" style="fill:url(#sd-gc) ${gc};stroke:${gd};stroke-width:2"/><path d="${d}" style="fill:${INK};opacity:.14;filter:url(#cw-grain)"/>`;
  const mxp = cx + sx * (p + g * 1.05);
  for (const [dy, dx] of [[-0.3, 0.1], [-0.16, 0.3], [0.02, 0.36], [0.2, 0.28], [0.32, 0.06]]) s += `<ellipse cx="${n1(mxp + sx * dx * g * 0.8)}" cy="${n1(cy + dy * L)}" rx="${n1(g * 0.24)}" ry="${n1(g * 0.15)}" transform="rotate(${n1(80 + sx * dy * 60)} ${n1(mxp + sx * dx * g * 0.8)} ${n1(cy + dy * L)})" style="fill:url(#cw-chl) ${T('chloro')};stroke:${mx('chloro', INK, 50)};stroke-width:.8"/>`;
  s += `<ellipse cx="${n1(mxp - sx * g * 0.15)}" cy="${n1(cy + L * 0.06)}" rx="${n1(g * 0.26)}" ry="${n1(g * 0.3)}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', INK, 50)};stroke-width:1"/>`;
  s += `<path d="${wall}" style="fill:none;stroke:${mx('elev-low', 'strata-3', 30)};stroke-width:${n1(g * 0.32)};stroke-linecap:round"/><path d="${wall}" style="fill:none;stroke:${mx('elev-low', 'elev-peak', 30)};stroke-width:${n1(g * 0.14)};stroke-linecap:round"/>`;
  s += `<path d="M${n1(cx + sx * (p + g * 0.6))} ${n1(top + L * 0.1)}C${n1(ox - sx * 4)} ${n1(top + L * 0.16)} ${n1(ox - sx * 4)} ${n1(cy)} ${n1(ox - sx * 6)} ${n1(cy + L * 0.1)}" style="fill:none;stroke:${sx < 0 ? W_ : INK};stroke-width:2;opacity:${sx < 0 ? 0.5 : 0.18}"/>`;
  return s;
}
function picture(i, open, past) {
  const d = DAY[Math.min(i, DAY.length - 1)], W = 360, H = 240, sk = SKY2[d.sky], night = d.sky === 'night';
  let s = `<defs><linearGradient id="sd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${sk[0]}"/><stop offset="1" style="stop-color:${sk[1]}"/></linearGradient><radialGradient id="sd-gc" cx=".34" cy=".28" r=".85"><stop offset="0" style="stop-color:${mx('elev-low', 'elev-peak', 50)}"/><stop offset=".6" style="stop-color:${mx('elev-low', 'chloro', 44)}"/><stop offset="1" style="stop-color:${mx(mx('elev-low', 'chloro', 44), INK, 60)}"/></radialGradient></defs>`;
  s += `<rect width="${W}" height="${H}" rx="14" style="fill:url(#sd-sky) ${sk[0]}"/>`;
  const u = SUN[Math.min(i, 7)];
  if (u >= 0) {
    const sx = 26 + u * (W - 52), sy = 150 - Math.sin(u * Math.PI) * 118, hot = d.sky === 'hot';
    s += `<circle cx="${n1(sx)}" cy="${n1(sy)}" r="${hot ? 46 : 36}" style="fill:${T('gold')};opacity:.25;filter:url(#pa-soft)"/><circle cx="${n1(sx)}" cy="${n1(sy)}" r="${hot ? 21 : 16}" style="fill:${mx('gold', 'elev-peak', 70)};stroke:${mx('gold', 'flame', hot ? 60 : 30)};stroke-width:3"/>`;
    if (hot) for (let k = 0; k < 4; k++) s += `<path d="M${30 + k * 50} 214q9 -7 0 -14q-9 -7 0 -14" style="fill:none;stroke:${mx('flame', 'elev-peak', 40)};stroke-width:3;opacity:.55;stroke-linecap:round"/>`;
  } else {
    s += `<circle cx="300" cy="38" r="16" style="fill:${mx('elev-peak', 'sea-shallow', 80)}"/><circle cx="308" cy="34" r="14" style="fill:${sk[0]}"/>`;
    for (const [x, y] of [[30, 26], [80, 54], [140, 22], [196, 64], [250, 30], [338, 90]]) s += `<circle cx="${x}" cy="${y}" r="1.8" style="fill:${W_}"/>`;
  }
  // far hills, the ground, a leafy twig whose underside the lens looks at
  s += `<path d="M0 196Q60 170 130 186T260 180T360 188V240H0Z" style="fill:${mx('elev-low', night ? 'strata-6' : 'sea-shallow', 50)};opacity:.8"/>`;
  s += `<rect y="208" width="${W}" height="32" rx="0" style="fill:${mx('elev-low', 'chloro', night ? 70 : 40)}"/>`;
  for (let k = 0; k < 22; k++) s += `<path d="M${8 + k * 16} 210l${(k % 3) - 1} -8" style="fill:none;stroke:${mx('elev-low', 'chloro', 60)};stroke-width:2;stroke-linecap:round"/>`;
  s += `<path d="M10 236Q34 170 60 130T112 86" style="fill:none;stroke:${mx('strata-3', 'elev-low', 50)};stroke-width:6;stroke-linecap:round"/>`;
  s += leafArt(46, 150, 120, -40, { seed: 5, wide: 0.32 }) + leafArt(98, 96, 150, -8, { seed: 3, wide: 0.34 });
  // the lens over the leaf's underside: one stoma, open or closed
  const lx = 262, ly = 112, lr = 84, g = open ? 1 : 0, L = 112, gw = 16 + g * 3, pw = 1 + g * 9;
  s += `<path d="M198 112L${lx - lr} ${ly + 8}" style="fill:none;stroke:${night ? W_ : INK};stroke-width:2;stroke-dasharray:4 4"/><circle cx="196" cy="111" r="4" style="fill:${night ? W_ : INK}"/>`;
  s += `<circle cx="${lx + 3}" cy="${ly + 6}" r="${lr + 7}" style="fill:${INK};opacity:.3;filter:url(#pa-soft)"/><circle cx="${lx}" cy="${ly}" r="${lr + 6}" style="fill:${mx('strata-5', 'strata-6', 60)}"/><clipPath id="sd-lc"><circle cx="${lx}" cy="${ly}" r="${lr}"/></clipPath><g clip-path="url(#sd-lc)">`;
  s += `<rect x="${lx - lr}" y="${ly - lr}" width="${2 * lr}" height="${2 * lr}" style="fill:${mx('sea-shallow', 'elev-peak', 26)}"/>`;
  // neighbouring skin cells with wavy walls
  let wd = ''; for (const [x0, y0, x1, y1] of [[lx - lr, ly - 40, lx - 46, ly - 28], [lx - lr, ly + 36, lx - 44, ly + 30], [lx + 46, ly - 30, lx + lr, ly - 44], [lx + 44, ly + 28, lx + lr, ly + 40], [lx - 30, ly - lr, lx - 20, ly - 62], [lx + 26, ly - lr, lx + 18, ly - 62], [lx - 22, ly + 62, lx - 34, ly + lr], [lx + 20, ly + 62, lx + 30, ly + lr]]) wd += `M${x0} ${y0}Q${(x0 + x1) / 2 + 6} ${(y0 + y1) / 2 - 6} ${x1} ${y1}`;
  s += `<ellipse cx="${lx}" cy="${ly}" rx="${n1(gw * 2.6 + pw + 8)}" ry="${n1(L * 0.6)}" style="fill:none;stroke:${mx('elev-low', 'strata-3', 40)};stroke-width:3"/><path d="${wd}" style="fill:none;stroke:${mx('elev-low', 'strata-3', 40)};stroke-width:3;stroke-linecap:round"/>`;
  s += `<ellipse cx="${lx}" cy="${ly}" rx="${n1(pw + 1)}" ry="${n1(L * 0.26)}" style="fill:${mx('strata-6', 'sea-deep', 60)}"/>`;
  s += guard(lx, ly, L, gw, pw, -1) + guard(lx, ly, L, gw, pw, 1);
  if (past && open) {
    for (let k = 0; k < Math.min(3, d.co2); k++) s += `<circle cx="${lx - 58 + k * 10}" cy="${ly + 58 - k * 6}" r="6" style="fill:${mx('strata-6', 'series-7', 62)}"/>`;
    for (let k = 0; k < Math.min(5, d.water); k++) s += `<circle cx="${lx + 44 + (k % 2) * 10}" cy="${ly + 30 + k * 9}" r="5.4" style="fill:url(#cw-wat) ${T('series-1')}"/>`;
  }
  s += `</g><path d="M${lx - lr * 0.8} ${ly - lr * 0.5}A${lr * 0.94} ${lr * 0.94} 0 0 1 ${lx - lr * 0.2} ${ly - lr * 0.92}" style="fill:none;stroke:${W_};stroke-width:3;opacity:.5"/>`;
  return s;
}

const CSS = `
.gm.sd { background: var(--sim-bg-deep); border-radius: 14px; padding: 8px 16px; gap: 6px; }
.sd .play { display: grid; grid-template-columns: 346px minmax(0, 1fr); gap: 14px; align-items: start; }
.sd .pic { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--look-radius, 12px); padding: 8px; }
.sd .pic svg { width: 330px; height: 220px; display: block; }
.sd .side { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.sd .when { font: 600 24px/1.1 var(--sim-font-display); color: var(--sim-label); }
.sd .when small { display: block; font: 700 17px/1.3 var(--sim-font); color: var(--sim-label-muted); margin-top: 2px; }
.sd .picks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.sd .sd-pick, .sd .sd-again { display: flex; align-items: center; justify-content: center; min-height: 52px; font: 600 19px/1.1 var(--sim-font-display); text-align: center; }
.sd .bars { display: grid; gap: 6px; }
.sd .bar { display: grid; grid-template-columns: 140px minmax(0, 1fr) 46px; align-items: center; gap: 8px; font-size: 17px; font-weight: 800; color: var(--sim-label); }
.sd .track { position: relative; height: 18px; border-radius: 9px; background: color-mix(in oklab, var(--sim-label) 12%, var(--sim-bg-surface)); overflow: visible; }
.sd .fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 9px; transition: width .4s ease; }
.sd .bar.co2 .fill { background: var(--sim-series-7); }
.sd .bar.wat .fill { background: var(--sim-series-1); }
.sd .bar.wat[data-over="1"] .fill { background: var(--sim-bad); }
.sd .mark { position: absolute; top: -4px; bottom: -4px; width: 3px; border-radius: 2px; background: var(--sim-label); }
.sd .why { min-height: 22px; margin: 0; font-size: 17px; line-height: 1.3; font-weight: 700; color: var(--sim-label); }
.sd .why[data-k="bad"] { color: var(--sim-bad); }
.sd .note { margin: 0; font-size: 16px; font-weight: 700; color: var(--sim-label-muted); }
.sd .sd-again { display: none; }
.sd[data-done="lost"] .sd-again { display: flex; }
.sd[data-done] .picks { display: none; }
.sim-dom-root--portrait .sd .play { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .sd .pic { align-self: center; }
.sim-dom-root--portrait .gm.sd { padding: 8px; }
.sim-dom-root--portrait .sd .pic { padding: 4px; }
.sim-dom-root--portrait .sd .pic { align-self: stretch; }
.sim-dom-root--portrait .sd .pic svg { width: 100%; height: auto; aspect-ratio: 3 / 2; }
.sim-dom-root--portrait .sd .bar { grid-template-columns: 116px minmax(0, 1fr) 40px; font-size: 16px; }
.sim-dom-root--portrait .sd .when { font-size: 21px; }
`;

export class StomaDayGame extends GameBoard {
  static HEIGHT = 300;
  static OBJECTIVE = { prompt: { en: 'Take one leaf through a whole day. Open the stomata to collect enough carbon dioxide, and close them in time to stay within the water budget.' } };
  static ARIA_LABEL = 'One leaf through one day in eight steps, from 6 am to night. At each step choose Open stomata or Close stomata. Bars show the carbon dioxide taken in and the water lost. Collect at least 8 units of carbon dioxide and lose no more than 8 units of water.';

  async setup() {
    await super.setup();
    this._reset();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm sd"><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${artDefs()}${cwDefs()}${taDefs()}</defs></svg><div class="gm-head"><h2>A leaf's day</h2></div>
        <div class="play"><div class="pic"><svg viewBox="0 0 360 240" aria-hidden="true"></svg></div>
        <div class="side"><div class="when" aria-live="polite"></div>
        <div class="picks"><div class="tap btn sd-pick" role="button" tabindex="0" data-v="open">Open stomata</div><div class="tap btn sd-pick" role="button" tabindex="0" data-v="shut">Close stomata</div></div>
        <div class="tap btn sd-again" role="button" tabindex="0">Try again</div>
        <div class="bars"><div class="bar co2"><span>CO2 taken in</span><span class="track"><span class="fill"></span><span class="mark"></span></span><b class="v"></b></div>
        <div class="bar wat"><span>Water lost</span><span class="track"><span class="fill"></span><span class="mark"></span></span><b class="v"></b></div></div>
        <p class="why" aria-live="polite"></p><p class="note">Need ${NEED} CO2, water budget ${BUDGET}. Model numbers are made up.</p></div></div></div>`,
    });
    this.root.querySelectorAll('.sd-pick').forEach((el) => onTap(el, () => this._pick(el.dataset.v === 'open')));
    const again = this.root.querySelector('.sd-again');
    if (again) onTap(again, () => { this._reset(); this._draw(); });
    this._draw();
    this.quill?.speak('Open when the air is cool. Shut when it is hot and dry.', 5200);
  }
  _reset() { this._i = 0; this._co2 = 0; this._wat = 0; this._line = ''; this._bad = false; this._last = null; this._done = ''; }
  _pick(open) {
    if (this._done || this._i >= DAY.length) return;
    const d = DAY[this._i];
    if (open) { this._co2 += d.co2; this._wat += d.water; }
    this._last = open;
    this._line = open ? (d.co2 ? `${d.t}: open. +${d.co2} CO2, -${d.water} water.` : `${d.t}: open in the dark. No CO2, but -${d.water} water.`) : `${d.t}: closed. Water saved, no CO2.`;
    this._bad = open && (d.co2 === 0 || d.water >= 5);
    this._i += 1;
    if (this._i >= DAY.length) {
      const ok = this._co2 >= NEED && this._wat <= BUDGET;
      this._done = ok ? 'won' : 'lost';
      this._bad = !ok;
      this._line = ok ? `Day done: ${this._co2} CO2 and only ${this._wat} water lost. Open when cool, closed in the heat.`
        : this._wat > BUDGET ? `The leaf lost ${this._wat} water, over the budget of ${BUDGET}. Close in the hot, dry hours and at night.`
          : `Only ${this._co2} CO2. Open more in the cool, bright hours.`;
    }
    this._draw();
    if (this._done === 'won') finishGame(this);
  }
  _draw() {
    const r = this.root, gm = r.querySelector('.gm');
    if (!gm) return;
    if (this._done) gm.dataset.done = this._done; else delete gm.dataset.done;
    const shown = this._done ? DAY.length - 1 : this._i, past = !!this._done && this._last !== null;
    r.querySelector('.pic svg').innerHTML = picture(shown, this._done ? this._last : this._last ?? true, past);
    const d = DAY[Math.min(this._i, DAY.length - 1)];
    r.querySelector('.when').innerHTML = this._done ? `End of the day<small>${this._done === 'won' ? 'The leaf made its food and kept its water.' : 'Try the day again.'}</small>` : `${d.t} <span style="font-size:18px">(step ${this._i + 1} of ${DAY.length})</span><small>${d.say}</small>`;
    const max = 20;
    const bar = (cls, v, lim) => { const b = r.querySelector(`.bar.${cls}`); if (!b) return; b.querySelector('.fill').style.width = `${Math.min(100, v / max * 100)}%`; b.querySelector('.mark').style.left = `${lim / max * 100}%`; b.querySelector('.v').textContent = String(v); b.dataset.over = cls === 'wat' && v > BUDGET ? '1' : '0'; };
    bar('co2', this._co2, NEED); bar('wat', this._wat, BUDGET);
    const w = r.querySelector('.why'); w.textContent = this._line; w.dataset.k = this._bad ? 'bad' : 'good';
    this.relayout?.();
  }
  checkObjective() { return this._done === 'won' ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._draw(); }
}
