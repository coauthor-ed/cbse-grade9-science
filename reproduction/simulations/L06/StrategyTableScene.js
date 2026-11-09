// StrategyTableScene - L06 blk-l06-s02 (setup) and s03 (4 beats). The four animals of the record. Step 0: no survival column at all.
// Step 1: survival column. Step 2: arrows read eggs against survival. Step 3: fish and frog rows, external. Step 4: lizard and bird, internal.
import { SvgScene, fill } from 'simulations/base/kit/SimSvg.js';
import { words, ART_INK } from '../shared/PlantArt.js';
import { frame, phoneMin, fishSide, frogSide, lizard, sunbird, backdrop } from '../shared/FlowerArt.js';

const ROWS = [
  { n: 'Fish', hab: 'Water', fert: 'External', eggs: '100s to 1000s', sur: 'Low', lvl: 1 },
  { n: 'Frog', hab: 'Water/land', fert: 'External', eggs: '5,000 to 50,000', sur: 'Low', lvl: 1 },
  { n: 'Lizard', hab: 'Land', fert: 'Internal', eggs: '2 to 20', sur: 'Moderate', lvl: 2 },
  { n: 'Bird', hab: 'Water/land', fert: 'Internal', eggs: '1 to 15', sur: 'Moderate to high', lvl: 3 },
];

export class StrategyTableScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }], [{ idx: 4 }]];
  static BEAT_MAPS = { 1: [[{ idx: 0 }]], 4: [[{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }], [{ idx: 4 }]] };
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 476;
  static ARIA_LABEL = 'A table of fish, frog, lizard and bird: habitat, fertilisation and eggs at a time. A survival column then shows low, low, moderate, and moderate to high.';
  static CONTROLS = [];
  // The setup is capped at the card's height on a phone: no root padding, so it takes the same 350x400 design as the other setups (274 wide).
  css() { return this.hostRole === 'setup' ? '.sim-dom-root--portrait.svs { padding: 0; }' : ''; }
  onBeatChange(b, n) { if (this.hostRole === 'setup') super.onBeatChange(0, 1); else super.onBeatChange(b, n); }
  stageHeight(st) { return st.portrait ? (this.hostRole === 'setup' ? 400 : 450) : 410; }
  paint(st) {
    const W = st.W, H = st.H, port = st.portrait, b = this.stepIndex, m = 10;
    let a = backdrop('desk', W, H, { floor: H - 12, seed: 3 });
    const small = port && this.hostRole === 'setup', ts = small ? 16 : 14;     // the setup is drawn at about 0.78: 16 here is 12 on screen
    const hy = 12, hh = port ? 60 : 44, rh = (H - hy - hh - 22) / 4, pw = W - 2 * m;
    const sur = b >= 1, tw = sur ? pw : pw;
    a += `<rect x="${m}" y="${hy}" width="${pw}" height="${H - hy - 10}" rx="14" style="fill:var(--sim-bg-surface);stroke:${ART_INK};stroke-width:3"/>`;
    const L = (x, y, t, o = {}) => words(x, y, t, { ink: 'var(--sim-label)', anchor: 'start', ...o });
    const psur = m + pw - 76;                                 // the column is fitted to the card, so no reading meets the frame
    const cols = small ? { n: m + 84, fert: m + 84, eggs: m + 224, sur: psur } : port ? { n: m + 66, fert: m + 66, eggs: sur ? psur - 72 : m + 176, sur: psur } : { n: m + 100, hab: m + 166, fert: m + 256, eggs: sur ? m + 350 : m + 392, sur: m + 482 };
    const hd = small ? 16 : 15;
    a += L(cols.n, hy + (port ? 18 : 28), 'Animal', { size: hd });
    if (!port) { a += L(cols.hab, hy + 28, 'Habitat', { size: hd }) + L(cols.fert, hy + 28, 'Fertilisation', { size: hd }); }
    a += L(cols.eggs, hy + (port ? 18 : 28), port ? 'Eggs' : 'Eggs at a time', { size: hd });
    if (port) a += L(cols.eggs, hy + 36, 'at a time', { size: ts, weight: 700 });
    if (sur) a += `<g class="sv-pop">${L(cols.sur, hy + (port ? 18 : 28), 'Survival', { size: hd })}</g>`;
    if (port) a += L(cols.n, hy + 36, 'Fertilisation', { size: ts, weight: 700 }) + L(cols.n, hy + 53, 'Habitat', { size: ts, weight: 700 });
    ROWS.forEach((r, i) => {
      const y = hy + hh + rh * i, mid = y + rh / 2;
      const lit = b === 3 ? i < 2 : b === 4 ? i >= 2 : true;
      a += `<path d="M${m} ${y}H${m + pw}" style="stroke:var(--sim-stroke);stroke-width:2;fill:none"/>`;
      if ((b === 3 && i < 2) || (b === 4 && i >= 2)) a += `<rect x="${m + 2}" y="${y + 1}" width="${pw - 4}" height="${rh - 2}" ${fill(`color-mix(in oklab, var(--sim-series-${i < 2 ? 1 : 3}) 16%, var(--sim-bg-surface))`)}/>`;
      a += `<g style="opacity:${lit ? 1 : 0.32}">`;
      const ax = m + (small ? 42 : port ? 34 : 50), as = port ? 0.37 : 0.5;
      a += i === 0 ? fishSide(ax, mid, as, {}) : i === 1 ? frogSide(ax, mid + 2, as, {}) : i === 2 ? lizard(ax - 2, mid, as * 0.86, {}) : sunbird(ax - 2, mid, as * 0.72, {});
      a += L(cols.n, mid + (port ? -12 : 6), r.n, { size: port ? 17 : 18, display: true });
      if (port) a += L(cols.n, mid + 7, r.fert, { size: ts, weight: 700 }) + L(cols.n, mid + 25, r.hab, { size: ts, weight: 700 });
      else a += L(cols.hab, mid + 6, r.hab, { size: 15, weight: 700 }) + L(cols.fert, mid + 6, r.fert, { size: 15, weight: 700 });
      const eg = r.eggs.split(' to ');
      if (port) a += L(cols.eggs, mid - 2, `${eg[0]} to`, { size: small ? 16 : 15, weight: 700 }) + L(cols.eggs, mid + 17, eg[1], { size: small ? 16 : 15, weight: 700 });
      else a += L(cols.eggs, mid + 6, r.eggs, { size: 15, weight: 700 });
      if (sur) {
        const two = r.lvl === 3;
        const w = r.lvl * (port ? 22 : 34);
        a += `<g class="sv-pop">`;
        a += `<rect x="${cols.sur}" y="${mid + 8}" width="${w}" height="10" rx="5" style="fill:var(--sim-series-3);stroke:${ART_INK};stroke-width:2"/>`;
        a += two ? L(cols.sur, mid - 16, 'Moderate', { size: 14 }) + L(cols.sur, mid + 1, 'to high', { size: 14 }) : L(cols.sur, mid - 2, r.sur, { size: 14 });
        a += '</g>';
      }
      a += '</g>';
    });
    if (b === 2) {
      const ey = hy + hh + 2, by = H - 16, ax = cols.eggs - 12, bx = cols.sur - 12;
      const arrow = (x, y0, y1, c) => `<path class="sv-draw" style="--len:400;fill:none;stroke:${c};stroke-width:5;stroke-linecap:round;stroke-linejoin:round" d="M${x} ${y0}L${x} ${y1}M${x - 8} ${y1 + (y1 > y0 ? -10 : 10)}L${x} ${y1}L${x + 8} ${y1 + (y1 > y0 ? -10 : 10)}"/>`;
      a += arrow(ax, by, ey, 'var(--sim-series-4)') + arrow(bx, ey, by, 'var(--sim-series-3)');
    }
    return { svg: frame(st, 'st', a) };
  }
}
