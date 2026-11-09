// LabourSplitGame - blk-l01-game. A small many-celled body has four jobs: cover the outside, carry food inward, hold
// the shape up, make new cells. Run 5 days with cells that are all one kind: every job is slow, two stay undone, and
// adding more of the same cell only makes a bigger body with the same slow jobs. Then add new kinds of cell, one group
// for each job (a tissue); each group finishes its job. All four done in one run: win. Start again resets.
// The body drawing changes with the kinds: an outer layer, a food channel of long cells, a stiff rod that holds it up,
// a growing end of small dividing cells. Rates are made-up model numbers and the board says so.
// Control names: "Run 5 days", "Add more of the same", "Flat covering cells", "Long carrying cells",
// "Stiff support cells", "Small dividing cells", "Start again".
import { GameBoard, mountGame, finishGame, onTap } from 'simulations/base/kit/GameFrame.js';
import { cwDefs, depthField, blobPath, T, mx, n1, rnd } from '../shared/CellWorld.js';
import { artDefs } from '../shared/PlantArt.js';
import { taDefs, smooth, LINE_D, LINE_L, XYL, XYL_D } from '../shared/TissueArt.js';

const JOBS = [
  { id: 'cover', label: 'Cover the outside', kind: 'cover', plain: 4 },
  { id: 'carry', label: 'Carry food inward', kind: 'carry', plain: 0, why: 'needs long cells' },
  { id: 'hold', label: 'Hold the shape up', kind: 'hold', plain: 0, why: 'needs stiff cells' },
  { id: 'make', label: 'Make new cells', kind: 'make', plain: 4 },
];
const KINDS = [
  { id: 'cover', label: 'Flat covering cells' }, { id: 'carry', label: 'Long carrying cells' },
  { id: 'hold', label: 'Stiff support cells' }, { id: 'make', label: 'Small dividing cells' },
];
const RATE = 20, DAYS = 5;
const CSS = `
.gm.ls { background: var(--sim-bg-deep); border-radius: 14px; }
.ls .wrap { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 392px minmax(0, 1fr); gap: 14px; align-items: start; }
.ls .fig { border-radius: var(--sim-radius-lg); overflow: hidden; border: var(--sim-border); line-height: 0; background: var(--sim-bg-surface); }
.ls .fig svg { display: block; width: 100%; height: auto; }
.ls .meters { display: grid; gap: 3px; margin: 0 0 4px; }
.ls .m { display: grid; grid-template-columns: 170px minmax(0, 1fr) 96px; gap: 8px; align-items: center; font-size: 17px; font-weight: 700; }
.ls .bar { height: 16px; border-radius: 999px; background: var(--sim-track); overflow: hidden; }
.ls .bar i { display: block; height: 100%; width: 0; border-radius: 999px; background: var(--sim-accent); transition: width .9s ease; }
.ls .m[data-done="1"] .bar i { background: var(--sim-good); }
.ls .m b { font-size: 16px; text-align: right; color: var(--sim-label-muted); }
.ls .m[data-done="1"] b { color: var(--sim-good); }
.ls .row { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 6px; }
.ls .kinds { flex-wrap: nowrap; }
.ls .kinds .tap { padding: 4px 8px; }
.ls .row .tap { min-height: 46px; padding: 4px 12px; font-size: 16px; line-height: 1.15; }
.ls .kinds .tap[data-on="1"] { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); }
.ls .kinds .tap[disabled] { opacity: .5; }
.ls .run { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 22%, var(--sim-bg-surface)); }
.ls .why { font-size: 16px; line-height: 1.25; font-weight: 700; margin: 2px 0 0; min-height: 40px; }
.ls .made { font-size: 15px; color: var(--sim-label-muted); margin: 0 0 4px; font-weight: 700; }
.sim-dom-root--portrait .ls .wrap { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .ls .m { grid-template-columns: 124px minmax(0, 1fr) 70px; font-size: 14px; }
.sim-dom-root--portrait .ls .m b { font-size: 14px; }
.sim-dom-root--portrait .ls .kinds { flex-wrap: wrap; }
.sim-dom-root--portrait .ls .row .tap { flex: 1 1 140px; font-size: 14px; padding: 4px 6px; }
`;

/** The body: a ball of cells resting on the pond floor, a mouth at the top. on: Set of kinds added; plain: number of
 * plain cells (8, 16, ...), which only makes the ball bigger. Every cell is drawn as a cell: membrane, grainy
 * cytoplasm, a nucleus with depth. Each kind added changes the SHAPE of the cells in its own place in the body. */
const VW = 400, VH = 300;
function cellPlain(x, y, r, seed) {
  const d = blobPath(x, y, r, r * 0.9, seed, 0.12, 8), q = rnd(seed);
  return `<path d="${d}" style="fill:url(#cw-cyto) ${mx('membrane', 'elev-peak', 30)};stroke:${mx('sea-shallow', 'sea-deep', 66)};stroke-width:1.5"/>`
    + `<path d="${blobPath(x - r * 0.08, y - r * 0.1, r * 0.74, r * 0.66, seed, 0.1, 8)}" style="fill:none;stroke:${T('elev-peak')};stroke-width:1.1;opacity:.6"/>`
    + `<circle cx="${n1(x + r * 0.08 + (q() - 0.5) * r * 0.3)}" cy="${n1(y + r * 0.06)}" r="${n1(r * 0.36)}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', 'strata-6', 60)};stroke-width:.9"/>`
    + `<circle cx="${n1(x)}" cy="${n1(y - r * 0.04)}" r="${n1(r * 0.1)}" style="fill:${T('elev-peak')};opacity:.65"/>`;
}
function cellFlat(x, y, r, deg, seed) {
  // flat covering cell: a thin tile lying along the surface, flat nucleus
  const d = blobPath(0, 0, r * 1.3, r * 0.46, seed, 0.06, 10);
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(deg)})"><path d="${d}" style="fill:url(#cw-cyto) ${LINE_L};stroke:${LINE_D};stroke-width:1.6"/><path d="M${n1(-r)} ${n1(-r * 0.24)}H${n1(r)}" style="stroke:${T('elev-peak')};stroke-width:1.2;opacity:.6"/><ellipse cx="${n1(r * 0.2)}" cy="1" rx="${n1(r * 0.4)}" ry="${n1(r * 0.16)}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', 'strata-6', 60)};stroke-width:.8"/></g>`;
}
function cellLong(x, y, r, deg, seed) {
  // long carrying cell: a column, nucleus near its base, food bits along it
  const d = blobPath(0, 0, r * 0.46, r * 1.5, seed, 0.05, 10), c = mx('series-8', 'elev-peak', 48);
  return `<g transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(deg)})"><path d="${d}" style="fill:url(#cw-cyto) ${c};stroke:${mx('series-8', 'strata-6', 58)};stroke-width:1.5"/><path d="${d}" style="fill:${T('series-8')};opacity:.22"/><path d="M${n1(-r * 0.2)} ${n1(-r * 1.2)}V${n1(r * 0.6)}" style="stroke:${T('elev-peak')};stroke-width:1.2;opacity:.6"/><ellipse cx="0" cy="${n1(r * 0.8)}" rx="${n1(r * 0.26)}" ry="${n1(r * 0.34)}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', 'strata-6', 60)};stroke-width:.8"/><circle cx="1" cy="${n1(-r * 0.5)}" r="${n1(r * 0.14)}" style="fill:url(#cw-chl) ${T('chloro')}"/><circle cx="-1" cy="${n1(-r * 0.05)}" r="${n1(r * 0.11)}" style="fill:url(#cw-chl) ${T('chloro')}"/></g>`;
}
function cellStiff(x, y, r, seed) {
  // stiff support cell: angular, a thick stiff wall, a small space inside
  const q = rnd(seed), p = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283 + 0.3, k = 1 + (q() - 0.5) * 0.18; p.push(`${n1(x + Math.cos(a) * r * k)} ${n1(y + Math.sin(a) * r * k)}`); }
  const d = `M${p.join('L')}Z`;
  return `<path d="${d}" style="fill:${mx(XYL, 'elev-peak', 30)};stroke:${XYL_D};stroke-width:2;stroke-linejoin:round"/><path d="${blobPath(x, y, r * 0.66, r * 0.62, seed, 0.06, 6)}" style="fill:none;stroke:${mx(XYL, 'strata-6', 30)};stroke-width:1;opacity:.6"/>`
    + `<path d="${blobPath(x, y, r * 0.36, r * 0.32, seed + 1, 0.14, 6)}" style="fill:${mx('sea-shallow', 'elev-peak', 40)};stroke:${XYL_D};stroke-width:1.2"/><path d="M${n1(x - r * 0.7)} ${n1(y - r * 0.3)}L${n1(x - r * 0.3)} ${n1(y - r * 0.72)}" style="stroke:${T('elev-peak')};stroke-width:1.4;opacity:.7"/>`;
}
function cellSmall(x, y, r, seed) {
  // small dividing cells: two daughters, big nuclei, one pair still pinching apart
  const q = rnd(seed), split = q() < 0.45, rr = r * 0.62;
  let s = '';
  for (const k of [-1, 1]) {
    const cx = x + k * rr * 0.92, d = blobPath(cx, y, rr, rr * 0.92, seed + k, 0.08, 8);
    s += `<path d="${d}" style="fill:url(#cw-cyto) ${mx('series-5', 'elev-peak', 72)};stroke:${mx('series-5', 'strata-6', 56)};stroke-width:1.3"/>`;
    s += split ? `<path d="M${n1(cx - rr * 0.3)} ${n1(y - rr * 0.32)}l${n1(rr * 0.2)} ${n1(rr * 0.64)}M${n1(cx)} ${n1(y - rr * 0.36)}v${n1(rr * 0.7)}M${n1(cx + rr * 0.3)} ${n1(y - rr * 0.32)}l${n1(-rr * 0.2)} ${n1(rr * 0.64)}" style="stroke:${mx('series-5', 'strata-6', 70)};stroke-width:2;stroke-linecap:round"/>`
      : `<circle cx="${n1(cx)}" cy="${n1(y)}" r="${n1(rr * 0.5)}" style="fill:url(#cw-nuc) ${T('series-5')};stroke:${mx('series-5', 'strata-6', 60)};stroke-width:.8"/>`;
  }
  return s;
}
function body(on, plain) {
  const grow = Math.min(1.12, 0.9 + plain / 120) + (on.has('make') ? 0.04 : 0), stand = on.has('hold');
  const cx = 196, floor = 276, hw = (stand ? 128 : 172) * grow, hh = (stand ? 252 : 168) * Math.min(1.06, grow);
  const ry = hh / 2, cy = floor - ry + 6, top = floor - hh + 6, mw = Math.min(30, hw * 0.22);
  // the outline: an egg resting on the floor (flattened underneath), a small mouth dip at the top
  const pts = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * 6.283 - Math.PI / 2;
    let x = cx + Math.cos(a) * hw * (1 - 0.1 * Math.sin(a)), y = cy + Math.sin(a) * ry;
    y = Math.min(y, floor);
    if (Math.abs(x - cx) < mw && y < cy) y += (1 - Math.abs(x - cx) / mw) * 12;
    pts.push([x, y]);
  }
  const outline = smooth(pts);
  const inside = (x, y) => (((x - cx) / (hw * (1 - 0.1 * (y - cy) / ry))) ** 2 + ((y - cy) / ry) ** 2);
  let s = `<defs>${artDefs()}${cwDefs()}${taDefs()}<linearGradient id="ls-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sea-shallow', 'elev-peak', 30)}"/><stop offset="1" style="stop-color:${mx('sea-shallow', 'sea-deep', 66)}"/></linearGradient>`
    + `<radialGradient id="ls-form" cx=".34" cy=".26" r=".86"><stop offset="0" style="stop-color:${T('elev-peak')};stop-opacity:.34"/><stop offset=".5" style="stop-color:${T('elev-peak')};stop-opacity:0"/><stop offset="1" style="stop-color:${T('sea-deep')};stop-opacity:.42"/></radialGradient></defs>`;
  s += `<rect width="${VW}" height="${VH}" style="fill:url(#ls-w)"/>` + depthField(VW, VH, { tone: 'blue', seed: 3 }).replace(/^<rect[^>]*\/>/, '');
  // light from the surface, a few drifting specks
  s += `<path d="M40 0L90 0L200 ${VH}L110 ${VH}Z" style="fill:${T('elev-peak')};opacity:.08"/><path d="M250 0L280 0L350 ${VH}L300 ${VH}Z" style="fill:${T('elev-peak')};opacity:.06"/>`;
  const sp = rnd(11); for (let i = 0; i < 18; i++) s += `<circle cx="${n1(sp() * VW)}" cy="${n1(sp() * (floor - 20))}" r="${n1(0.8 + sp() * 1.6)}" style="fill:${T('elev-peak')};opacity:.5"/>`;
  // the pond floor: silt with pebbles and a leaf scrap
  s += `<path d="M0 ${floor - 4}Q${VW / 2} ${floor - 12} ${VW} ${floor - 2}V${VH}H0Z" style="fill:${mx('strata-2', 'strata-1', 50)}"/><path d="M0 ${floor - 4}Q${VW / 2} ${floor - 12} ${VW} ${floor - 2}" style="fill:none;stroke:${mx('strata-2', 'elev-peak', 50)};stroke-width:2"/>`;
  const pq = rnd(4); for (let i = 0; i < 16; i++) { const x = 8 + i * 25 + pq() * 10, y = floor + 4 + pq() * 16; s += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(4 + pq() * 6)}" ry="${n1(2.4 + pq() * 2)}" style="fill:${mx('strata-3', 'strata-1', 40 + i % 3 * 15)}"/><ellipse cx="${n1(x - 1)}" cy="${n1(y - 1.2)}" rx="${n1(2.4)}" ry="1" style="fill:${T('elev-peak')};opacity:.35"/>`; }
  s += `<ellipse cx="${cx + 10}" cy="${floor + 3}" rx="${n1(hw * 1.04)}" ry="9" style="fill:${T('strata-6')};opacity:.28;filter:url(#cw-blur3)"/>`;
  s += `<clipPath id="ls-b"><path d="${outline}"/></clipPath><path d="${outline}" style="fill:${mx('membrane', 'sea-shallow', 40)}"/><g clip-path="url(#ls-b)">`;
  // a cavity inside: the gut space the long cells line
  const gy0 = top + 16, gy1 = cy + ry * 0.12, gw = hw * 0.2;
  if (on.has('carry')) s += `<path d="M${n1(cx - 8)} ${n1(gy0)}C${n1(cx - gw)} ${n1(gy0 + 30)} ${n1(cx - gw * 1.6)} ${n1(gy1 - 30)} ${n1(cx)} ${n1(gy1)}C${n1(cx + gw * 1.6)} ${n1(gy1 - 30)} ${n1(cx + gw)} ${n1(gy0 + 30)} ${n1(cx + 8)} ${n1(gy0)}Z" style="fill:${mx('series-2', 'elev-peak', 74)}"/>`;
  const q = rnd(5), cr = 13, dy = cr * 1.62, dx = cr * 1.86;
  for (let y = top - cr; y < floor + cr; y += dy) {
    const row = Math.round((y - top) / dy);
    for (let x = cx - hw - cr; x < cx + hw + cr; x += dx) {
      const xx = x + (row % 2 ? dx / 2 : 0) + (q() - 0.5) * 4, yy = y + (q() - 0.5) * 4, e = inside(xx, yy), seed = row * 31 + Math.round(x);
      if (e > 1.15 || yy > floor + 4) continue;
      const r = cr * (0.86 + q() * 0.3), ang = Math.atan2((yy - cy) / ry, (xx - cx) / hw) * 57.3 + 90;
      const inGut = on.has('carry') && Math.abs(xx - cx) < gw * 1.9 + 10 && yy > gy0 - 4 && yy < gy1 + 14;
      const inRod = stand && e < 0.8 && Math.abs(Math.abs(xx - cx) - hw * 0.56) < cr * 1.1 && yy > top + 40;
      const inBud = on.has('make') && e < 0.86 && (xx - (cx + hw * 0.36)) ** 2 + (yy - (floor - 34)) ** 2 < (hw * 0.3) ** 2;
      if (on.has('cover') && e > 0.8) s += cellFlat(xx, yy, r, ang, seed);
      else if (inGut) { if (Math.abs(xx - cx) > gw * 0.9) s += cellLong(xx, yy, r, (xx < cx ? -1 : 1) * 90, seed); }
      else if (inRod) s += cellStiff(xx, yy, r * 0.96, seed);
      else if (inBud) s += cellSmall(xx, yy, r, seed);
      else s += cellPlain(xx, yy, r, seed);
    }
  }
  if (on.has('carry')) { const fq = rnd(8); for (let i = 0; i < 5; i++) s += `<ellipse cx="${n1(cx + (fq() - 0.5) * gw)}" cy="${n1(gy0 + 14 + i * (gy1 - gy0 - 20) / 5)}" rx="5" ry="3.6" style="fill:url(#cw-chl) ${T('chloro')}"/>`; }
  // the whole ball's form: lit top left, shade bottom right
  s += `<path d="${outline}" style="fill:url(#ls-form)"/></g>`;
  if (on.has('cover')) s += `<path d="${outline}" style="fill:none;stroke:${LINE_D};stroke-width:3"/><path d="${outline}" transform="translate(-1 -1)" style="fill:none;stroke:${LINE_L};stroke-width:1.4;opacity:.8"/>`;
  else s += `<path d="${outline}" style="fill:none;stroke:${mx('sea-shallow', 'sea-deep', 72)};stroke-width:2.4"/>`;
  s += `<path d="M${n1(cx - hw * 0.86)} ${n1(cy + ry * 0.1)}Q${n1(cx - hw * 0.88)} ${n1(cy - ry * 0.62)} ${n1(cx - hw * 0.36)} ${n1(top + 14)}" style="fill:none;stroke:${T('elev-peak')};stroke-width:5;opacity:.45;stroke-linecap:round"/>`;
  return `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="The many-celled body: ${on.size ? [...on].join(', ') + ' cells added' : 'all cells the same kind'}">${s}</svg>`;
}
const ARIA = 'A game. A small many-celled body must cover its outside, carry food inward, hold its shape up and make new cells. Run five days with cells all of one kind, then add new kinds of cell and see which jobs get done.';

export class LabourSplitGame extends GameBoard {
  static ARIA_LABEL = ARIA;
  static OBJECTIVE = { prompt: { en: 'Get all four jobs done in one five-day run.' } };
  _reset() { this._plain = 8; this._on = new Set(); this._runs = 0; this._prog = null; this._won = false; }
  async setup() {
    this._reset();
    await super.setup();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm ls"><div class="gm-head"><h2>Share the Work</h2><p class="sub">Run 5 days. Then give each job its own kind of cell.</p></div>
      <div class="wrap"><div><div class="fig" data-fig></div></div>
      <div><div class="meters">${JOBS.map((j) => `<div class="m" data-job="${j.id}"><span>${j.label}</span><div class="bar"><i></i></div><b>-</b></div>`).join('')}</div>
      <p class="made">Made-up model numbers.</p>
      <div class="row"><button type="button" class="tap btn run" data-run>Run 5 days</button><button type="button" class="tap btn" data-more>Add more of the same</button><button type="button" class="tap btn" data-again>Start again</button></div>
      <div class="row kinds">${KINDS.map((k) => `<button type="button" class="tap btn" data-kind="${k.id}">${k.label}</button>`).join('')}</div>
      <p class="why" data-why aria-live="polite"></p></div></div></div>`,
    });
    const q = (s) => this.root.querySelector(s);
    const b = q('[data-run]'); if (b) onTap(b, () => this._run());
    const m = q('[data-more]'); if (m) onTap(m, () => this._more());
    const a = q('[data-again]'); if (a) onTap(a, () => { this._reset(); this._say('All cells are the same kind again. Run 5 days.'); this._show(); });
    this.root.querySelectorAll('[data-kind]').forEach((k) => onTap(k, () => this._add(k.dataset.kind)));
    this._say('Every cell here is the same kind. Run 5 days and watch the four jobs.');
    this._show();
  }
  _say(t) { const e = this.root.querySelector('[data-why]'); if (e) e.textContent = t; }
  _rate(j) { return this._on.has(j.kind) ? RATE : j.plain; }
  _more() {
    if (this._won) return;
    this._plain = Math.min(40, this._plain + 8); this._prog = null;
    this._say('More cells, all the same kind. The body is bigger, but each cell still does every job a little. Run 5 days to see.');
    this._show();
  }
  _add(kind) {
    if (this._won || !this._runs || this._on.has(kind)) return;
    this._on.add(kind); this._prog = null;
    const j = JOBS.find((x) => x.kind === kind);
    this._say(`A group of ${KINDS.find((k) => k.id === kind).label.toLowerCase()} now does one job: ${j.label.toLowerCase()}. Run 5 days.`);
    this._show();
  }
  _run() {
    if (this._won) return;
    this._runs++;
    this._prog = JOBS.map((j) => Math.min(100, this._rate(j) * DAYS));
    const done = JOBS.filter((j, i) => this._prog[i] >= 100), undone = JOBS.filter((j) => this._rate(j) === 0);
    if (done.length === 4) {
      this._won = true;
      this._say('All four jobs done in 5 days: each group of similar cells, a tissue, does its own job.');
      this.quill?.perform?.('hop');
      this._show();
      finishGame(this);
      return;
    }
    if (!this._on.size) this._say(`After 5 days with one kind of cell: covering and making cells are only 20% done, and ${undone.map((j) => j.label.toLowerCase()).join(' and ')} not done at all. Now add a new kind of cell.`);
    else this._say(`${done.length} of 4 jobs done. ${JOBS.filter((j, i) => this._prog[i] < 100).map((j) => j.label).join(', ')}: still waiting for its own kind of cell.`);
    this._show();
  }
  _show() {
    const fig = this.root.querySelector('[data-fig]');
    if (fig) fig.innerHTML = body(this._on, this._plain);
    JOBS.forEach((j, i) => {
      const row = this.root.querySelector(`[data-job="${j.id}"]`);
      if (!row) return;
      const p = this._prog ? this._prog[i] : 0, bar = row.querySelector('.bar i'), b = row.querySelector('b');
      if (bar) bar.style.width = `${p}%`;
      row.dataset.done = p >= 100 ? '1' : '0';
      if (b) b.textContent = !this._prog ? '-' : p >= 100 ? 'done' : this._rate(j) === 0 ? 'not done' : `${p}%`;
    });
    this.root.querySelectorAll('[data-kind]').forEach((k) => { k.dataset.on = this._on.has(k.dataset.kind) ? '1' : '0'; k.disabled = !this._runs || this._won; });
    this.relayout?.();
  }
  checkObjective() { return this._won ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge?.(); this._reset(); this._show?.(); }
}
