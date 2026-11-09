// GrowthZoneGame - blk-l04-game. Three jobs: a root must grow longer, a trunk must grow thicker, grazed grass must grow
// back. For each, tap the place where the dividing cells are. A right tap makes it grow and names the meristem; a wrong
// tap says what that place really is, and the learner tries again, so a learner can always win. Three finds, then
// finishGame. Stacked cards on a phone. Control names: .gz-pick[data-p] (root: cap, tip, hairs; trunk: centre, ring,
// bark; grass: top, middle, base). Play again: .gz-again.
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { artDefs } from '../shared/PlantArt.js';
import { cwDefs, T, mx, n1, rnd } from '../shared/CellWorld.js';
import { stDefs } from '../shared/StemArt.js';

const INK = T('strata-6'), W_ = T('elev-peak');
const G = mx('elev-low', 'strata-4', 30), GL = mx('elev-low', 'gold', 30), GD = mx('elev-low', INK, 52), MERI = T('series-5');
const JOBS = [
  { id: 'root', need: 'A root must grow longer', answer: 'tip', name: 'apical meristem',
    picks: [['cap', 'Root cap'], ['tip', 'Just behind the cap'], ['hairs', 'Up where the root hairs are']],
    why: { cap: 'The cap only shields the tip; its cells wear away as the root pushes on.', hairs: 'These cells have stopped dividing; they take in water.' } },
  { id: 'trunk', need: 'A trunk must grow thicker', answer: 'ring', name: 'lateral meristem',
    picks: [['centre', 'The centre'], ['ring', 'The ring under the bark'], ['bark', 'The outer bark']],
    why: { centre: 'The centre is old wood; it divides no more.', bark: 'The outer bark is dead cork that only protects.' } },
  { id: 'grass', need: 'Grazed grass must grow back', answer: 'base', name: 'intercalary meristem',
    picks: [['top', 'The cut top'], ['middle', 'The middle of the blade'], ['base', 'The base, near the node']],
    why: { top: 'The top was eaten; nothing is left there to divide.', middle: 'These cells are grown already; they do not divide.' } },
];
const SPOT = {
  root: { cap: [100, 168], tip: [100, 146], hairs: [100, 80] },
  trunk: { centre: [100, 96], ring: [154, 96], bark: [170, 70] },
  grass: { top: [100, 34], middle: [100, 100], base: [100, 160] },
};

function rootArt(grown, mark) {
  const L = grown ? 40 : 0, tipY = 160 + L * 0.3, q = rnd(3);
  let s = `<rect x="-40" width="280" height="190" style="fill:${mx('strata-3', 'strata-2', 50)}"/><rect x="-40" width="280" height="22" style="fill:${mx('strata-2', 'strata-1', 40)}"/>`;
  for (let i = 0; i < 56; i++) s += `<circle cx="${n1(-40 + q() * 280)}" cy="${n1(22 + q() * 168)}" r="${n1(1 + q() * 2.4)}" style="fill:${mx('strata-3', INK, 60)};opacity:.5"/>`;
  const top = 0, w = 22, path = `M${100 - w / 2} ${top}V${n1(tipY - 26)}Q${100 - w / 2} ${n1(tipY)} 100 ${n1(tipY + 4)}Q${100 + w / 2} ${n1(tipY)} ${100 + w / 2} ${n1(tipY - 26)}V${top}Z`;
  for (let i = 0; i < 9; i++) { const y = 40 + i * 10; s += `<path d="M${100 - w / 2} ${y}q-14 -2 -24 -10M${100 + w / 2} ${y + 4}q14 -2 24 -10" style="fill:none;stroke:${mx('strata-1', W_, 40)};stroke-width:2;stroke-linecap:round"/>`; }
  s += `<path d="${path}" style="fill:url(#gz-root) ${T('strata-1')};stroke:${mx('strata-2', INK, 50)};stroke-width:2"/><path d="M${100 - w / 2 + 3} 4V${n1(tipY - 26)}" style="stroke:${W_};stroke-width:2.4;opacity:.7"/>`;
  s += `<path d="M${100 - w / 2 + 1} ${n1(tipY - 12)}Q100 ${n1(tipY - 20)} ${100 + w / 2 - 1} ${n1(tipY - 12)}Q${100 + w / 2} ${n1(tipY)} 100 ${n1(tipY + 4)}Q${100 - w / 2} ${n1(tipY)} ${100 - w / 2 + 1} ${n1(tipY - 12)}Z" style="fill:${mx('strata-2', 'strata-1', 50)};stroke:${mx('strata-2', INK, 50)};stroke-width:1.4"/>`;
  if (grown) s += `<rect x="${100 - w / 2 + 2}" y="${n1(tipY - 34)}" width="${w - 4}" height="14" rx="4" style="fill:${MERI};opacity:.8"/><path d="M150 40V${n1(tipY - 10)}" style="stroke:${INK};stroke-width:2.4"/><path d="M150 ${n1(tipY - 4)}l-6 -10h12Z" style="fill:${INK}"/>`;
  return s + markAt(mark, 'root', grown ? { tip: [100, tipY - 27] } : null);
}
function trunkArt(grown, mark) {
  const k = grown ? 1.18 : 1, cx = 100, cy = 96, R = 70 * k, q = rnd(5);
  let s = `<rect x="-40" width="280" height="190" style="fill:${mx('strata-1', W_, 30)}"/>`;
  s += `<circle cx="${cx + 3}" cy="${cy + 5}" r="${n1(R + 3)}" style="fill:${INK};opacity:.22"/><circle cx="${cx}" cy="${cy}" r="${n1(R)}" style="fill:${mx('strata-3', INK, 58)};stroke:${mx('strata-3', INK, 30)};stroke-width:2"/>`;
  for (let i = 0; i < 40; i++) { const a = (i / 40) * 6.28; s += `<path d="M${n1(cx + Math.cos(a) * (R - 10))} ${n1(cy + Math.sin(a) * (R - 10))}L${n1(cx + Math.cos(a) * (R - 1))} ${n1(cy + Math.sin(a) * (R - 1))}" style="stroke:${q() < 0.5 ? mx('strata-3', W_, 70) : INK};stroke-width:1.4;opacity:.5"/>`; }
  const cr = R - 12;
  s += `<circle cx="${cx}" cy="${cy}" r="${n1(cr)}" style="fill:${mx('strata-2', 'strata-1', 60)};stroke:${MERI};stroke-width:3"/>`;
  const rings = grown ? 7 : 5;
  for (let i = rings; i > 0; i--) s += `<circle cx="${cx}" cy="${cy}" r="${n1((cr - 3) * i / rings)}" style="fill:${mx('strata-1', W_, 50)};stroke:${mx('strata-3', 'strata-2', 60)};stroke-width:2"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="6" style="fill:${mx('strata-3', 'strata-2', 50)}"/>`;
  if (grown) s += `<circle cx="${cx}" cy="${cy}" r="${n1(cr)}" style="fill:none;stroke:${T('gold')};stroke-width:6;opacity:.5"/>`;
  return s + markAt(mark, 'trunk', { ring: [cx + cr, cy], bark: [cx + Math.cos(-0.6) * (R - 4), cy + Math.sin(-0.6) * (R - 4)] });
}
function grassArt(grown, mark) {
  // grazed grass: a clump of cut blades with ragged, chewed tops; each blade grows out of a paler sheath that starts at
  // a node near the base; after regrowth, new paler length shows just above the node, below the old cut
  const g = grown ? 34 : 0, q = rnd(7), base = 166, node = 150;
  let s = `<rect x="-40" width="280" height="190" style="fill:url(#gz-sky) ${mx('sky-day', W_, 50)}"/>`;
  for (let i = 0; i < 18; i++) { const x = -40 + q() * 280, h = 10 + q() * 16; s += `<path d="M${n1(x - 2)} 152Q${n1(x)} ${n1(152 - h)} ${n1(x + (q() - 0.5) * 8)} ${n1(150 - h)}Q${n1(x + 1)} ${n1(150 - h * 0.5)} ${n1(x + 2)} 152Z" style="fill:${mx('elev-low', 'sky-day', 60)};opacity:.6"/>`; }
  s += `<path d="M-40 150Q100 142 240 150V190H-40Z" style="fill:${mx('strata-3', 'elev-low', 60)}"/>`;
  for (const [dx, f, lean] of [[-48, 0.82, -10], [-30, 0.94, -4], [-12, 0.98, 2], [8, 1, 0], [26, 0.92, 5], [44, 0.86, 10], [60, 0.78, 14]]) {
    const x = 96 + dx, h = 100 * f + g, w = dx === 8 ? 18 : 14, top = base - h, lx = (y) => lean * (base - y) / h;
    // the blade, tapering a little, its top torn off unevenly
    const tl = x - w / 2 + lx(top), tr = x + w / 2 + lx(top) - 2, r = rnd(Math.round(dx + 60));
    let jag = ''; for (let k = 1; k < 5; k++) jag += `L${n1(tl + (tr - tl) * k / 5)} ${n1(top + (k % 2 ? 4 + r() * 5 : -1 + r() * 2))}`;
    s += `<path d="M${n1(x - w / 2)} ${base}L${n1(tl)} ${n1(top)}${jag}L${n1(tr)} ${n1(top + 1)}L${n1(x + w / 2)} ${base}Z" style="fill:url(#gz-blade) ${G};stroke:${GD};stroke-width:1.3;stroke-linejoin:round"/>`;
    s += `<path d="M${n1(x + lx(base))} ${base - 2}L${n1(x + lx(top + 8))} ${n1(top + 8)}" style="stroke:${GD};stroke-width:1;opacity:.6"/><path d="M${n1(x - w / 2 + 2)} ${base - 2}L${n1(tl + 2)} ${n1(top + 6)}" style="stroke:${W_};stroke-width:1;opacity:.45"/>`;
    // the chewed edge: pale, a little brown
    s += `<path d="M${n1(tl)} ${n1(top)}${jag}L${n1(tr)} ${n1(top + 1)}" style="fill:none;stroke:${mx('strata-2', 'gold', 50)};stroke-width:2.2;stroke-linejoin:round"/>`;
    if (g) s += `<path d="M${n1(x - w / 2 + 1)} ${node - 1}L${n1(x - w / 2 + 1 + lx(node - g))} ${n1(node - g)}H${n1(x + w / 2 - 1 + lx(node - g))}L${n1(x + w / 2 - 1)} ${node - 1}Z" style="fill:${GL};opacity:.75"/>`;
    // the sheath from the node, wrapping the blade's base, and the node itself
    s += `<path d="M${n1(x - w / 2 - 2)} ${base}L${n1(x - w / 2 - 1)} ${node - 12}Q${n1(x)} ${node - 18} ${n1(x + w / 2 + 1)} ${node - 12}L${n1(x + w / 2 + 2)} ${base}Z" style="fill:${mx(GL, W_, 60)};stroke:${GD};stroke-width:1.1;opacity:.92"/>`;
    s += `<ellipse cx="${n1(x)}" cy="${node + 3}" rx="${n1(w / 2 + 3)}" ry="3.2" style="fill:${mx(G, 'strata-3', 60)};stroke:${GD};stroke-width:1"/>`;
  }
  s += `<path d="M24 ${66}H176" style="stroke:${W_};stroke-width:2;stroke-dasharray:6 5"/>`;
  for (let i = 0; i < 10; i++) s += `<ellipse cx="${n1(30 + q() * 140)}" cy="${n1(170 + q() * 10)}" rx="4" ry="2" style="fill:${mx('strata-3', 'strata-1', 50)}"/>`;
  if (grown) s += `<rect x="84" y="${node - 18}" width="26" height="14" rx="6" style="fill:${MERI};opacity:.8;filter:url(#cw-blur1)"/>`;
  return s + markAt(mark, 'grass', { top: [100, 66 - g], base: [100, node - 10] });
}
function markAt(mark, kind, over) {
  if (!mark) return '';
  const [x, y] = (over && over[mark.p]) || SPOT[kind][mark.p];
  const col = mark.ok ? T('good') : T('bad');
  return `<circle cx="${n1(x)}" cy="${n1(y)}" r="11" style="fill:none;stroke:${W_};stroke-width:6"/><circle cx="${n1(x)}" cy="${n1(y)}" r="11" style="fill:none;stroke:${col};stroke-width:3.4"/>`;
}
const ART = { root: rootArt, trunk: trunkArt, grass: grassArt };

const CSS = `
.gm.gz { background: var(--sim-bg-deep); border-radius: 14px; padding: 8px 64px 8px 12px; gap: 6px; }
.sim-dom-root--portrait .gm.gz { padding: 8px 10px; }
.gz .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; flex: 1; min-height: 0; }
.gz .card { display: flex; flex-direction: column; gap: 4px; background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--look-radius, 12px); padding: 6px 8px; color: var(--sim-label); }
.gz .card[data-done="1"] { box-shadow: inset 0 0 0 3px var(--sim-good); }
.gz .top { display: flex; flex-direction: column; gap: 6px; }
.gz .card svg { width: 100%; height: 148px; display: block; border-radius: 10px; }
.gz .need { font: 600 18px/1.2 var(--sim-font-display); margin: 0 0 5px; }
.gz .picks { display: flex; flex-direction: row; gap: 5px; }
.gz .picks .gz-pick { flex: 1 1 0; }
.gz .gz-pick { min-height: 44px; display: flex; align-items: center; justify-content: center; text-align: center; font: 800 15px/1.12 var(--sim-font); padding: 2px 5px; }
.gz .gz-pick[data-shake="1"] { animation: gz-shake 0.3s ease; }
@keyframes gz-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.gz .line { margin: 0; min-height: 38px; font-size: 15px; font-weight: 700; line-height: 1.25; }
.gz .line[data-k="bad"] { color: var(--sim-bad); }
.gz .line b { color: var(--sim-good); }
.gz .gz-again { display: none; align-self: center; min-height: 48px; padding: 0 24px; align-items: center; justify-content: center; }
.gz[data-done="1"] .gz-again { display: flex; }
.sim-dom-root--portrait .gz .cards { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .gz .card svg { height: 150px; }
.sim-dom-root--portrait .gz .gz-pick { font-size: 14px; }
@media (prefers-reduced-motion: reduce) { .gz .gz-pick[data-shake="1"] { animation: none; } }
`;

export class GrowthZoneGame extends GameBoard {
  static HEIGHT = 405;
  static OBJECTIVE = { prompt: { en: 'Tap where the dividing cells are in each plant, and watch it grow.' } };
  static ARIA_LABEL = 'Three cards: a root that must grow longer, a trunk that must grow thicker, and grazed grass that must grow back. In each, tap the place where the dividing cells are. A right tap makes it grow.';

  async setup() {
    await super.setup();
    this._reset();
    const cards = JOBS.map((j) => `<div class="card" data-j="${j.id}"><div class="top"><svg viewBox="-40 0 280 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true"></svg><div><p class="need">${j.need}</p><div class="picks">${j.picks.map(([p, t]) => `<div class="tap btn gz-pick" role="button" tabindex="0" data-j="${j.id}" data-p="${p}">${t}</div>`).join('')}</div></div></div><p class="line" aria-live="polite"></p></div>`).join('');
    const defs = `<linearGradient id="gz-root" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${mx('strata-1', 'strata-2', 60)}"/><stop offset=".4" style="stop-color:${mx('strata-1', W_, 50)}"/><stop offset="1" style="stop-color:${mx('strata-1', 'strata-2', 50)}"/></linearGradient><linearGradient id="gz-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sky-day', W_, 40)}"/><stop offset="1" style="stop-color:${mx('sky-day', W_, 76)}"/></linearGradient><linearGradient id="gz-blade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:${GL}"/><stop offset=".5" style="stop-color:${G}"/><stop offset="1" style="stop-color:${GD}"/></linearGradient>`;
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm gz"><svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${artDefs()}${cwDefs()}${stDefs()}${defs}</defs></svg><div class="gm-head"><h2>Where are the dividing cells?</h2></div><div class="cards">${cards}</div><div class="tap btn gz-again" role="button" tabindex="0">Play again</div></div>`,
    });
    this.root.querySelectorAll('.gz-pick').forEach((el) => onTap(el, () => this._pick(el)));
    const again = this.root.querySelector('.gz-again');
    if (again) onTap(again, () => { this._reset(); this._draw(); });
    this._draw();
  }
  _reset() { this._st = { root: { done: false, mark: null, line: '', bad: false }, trunk: { done: false, mark: null, line: '', bad: false }, grass: { done: false, mark: null, line: '', bad: false } }; this._won = false; }
  _draw() {
    const r = this.root;
    if (!r.querySelector('.gm')) return;
    for (const j of JOBS) {
      const st = this._st[j.id], card = r.querySelector(`.card[data-j="${j.id}"]`);
      if (!card) continue;
      card.dataset.done = st.done ? '1' : '0';
      card.querySelector('svg').innerHTML = ART[j.id](st.done, st.mark);
      const line = card.querySelector('.line');
      line.innerHTML = st.line; line.dataset.k = st.bad ? 'bad' : 'good';
    }
    r.querySelector('.gm').dataset.done = this._won ? '1' : '0';
    this.relayout?.();
  }
  _pick(el) {
    const j = JOBS.find((x) => x.id === el.dataset.j), st = this._st[j.id], p = el.dataset.p;
    if (!j || st.done) return;
    if (p === j.answer) {
      st.done = true; st.mark = { p, ok: true }; st.bad = false;
      st.line = `<b>Yes:</b> the ${j.name}. ${j.id === 'root' ? 'The root grows longer.' : j.id === 'trunk' ? 'A new ring: the trunk grows thicker.' : 'The blade grows back from below.'}`;
      this._draw();
      if (JOBS.every((x) => this._st[x.id].done) && !this._won) { this._won = true; this._draw(); finishGame(this); }
    } else {
      st.mark = { p, ok: false }; st.bad = true; st.line = j.why[p];
      el.dataset.shake = '1'; setTimeout(() => { el.dataset.shake = '0'; }, 320);
      this._draw();
    }
  }
  checkObjective() { return this._won ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._draw(); }
}
