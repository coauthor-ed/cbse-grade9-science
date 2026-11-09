// OrganBuildGame - blk-l02-game. Build a stomach and a leaf from loose tissue pieces. Tap a piece, then tap the
// organ it belongs in. A right piece appears in the drawing; a wrong piece is turned back with the reason (xylem is
// a plant tissue, muscle an animal one). An organ works only when all four of its tissues are in: then the stomach
// churns and the leaf makes food. Both working: win. Start again empties both organs.
// Control names: the eight pieces ("Muscle", "Epithelium", "Nervous tissue", "Blood", "Epidermis",
// "Ground tissue", "Xylem", "Phloem"), the organ cards "Stomach" and "Leaf", "Start again".
import { GameBoard, mountGame, finishGame, onTap } from 'simulations/base/kit/GameFrame.js';
import { cwDefs, blobPath, T, mx, n1, rnd } from '../shared/CellWorld.js';
import { stomachJ } from '../shared/StomachArt.js';
import { artDefs } from '../shared/PlantArt.js';
import { taDefs, smooth, LEAF, LEAF_D, LEAF_L, XYL, XYL_D, PHL, PHL_D } from '../shared/TissueArt.js';

const PIECES = [
  { id: 'muscle', label: 'Muscle', organ: 'stomach', no: 'Muscle tissue is an animal tissue. A leaf has no muscle.' },
  { id: 'lining', label: 'Epithelium', organ: 'stomach', no: 'This epithelium lines the stomach. A leaf is covered by its own epidermis.' },
  { id: 'nerve', label: 'Nervous tissue', organ: 'stomach', no: 'Nervous tissue is an animal tissue. Plants have no nerves.' },
  { id: 'blood', label: 'Blood', organ: 'stomach', no: 'Blood is an animal tissue. A leaf moves water and food in xylem and phloem.' },
  { id: 'epi', label: 'Epidermis', organ: 'leaf', no: 'Epidermis is a plant tissue. The stomach is lined by epithelium.' },
  { id: 'ground', label: 'Ground tissue', organ: 'leaf', no: 'Ground tissue is a plant tissue. It is not part of the stomach.' },
  { id: 'xylem', label: 'Xylem', organ: 'leaf', no: 'Xylem is a plant tissue. It carries water in a leaf, not in the stomach.' },
  { id: 'phloem', label: 'Phloem', organ: 'leaf', no: 'Phloem is a plant tissue. It carries food in a leaf, not in the stomach.' },
];
const ORGANS = { stomach: 'Stomach', leaf: 'Leaf' };
const CSS = `
.gm.ob { background: var(--sim-bg-deep); border-radius: 14px; }
.ob .wrap { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 14px; align-items: start; }
.ob .tray { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.ob .piece { min-height: 48px; padding: 2px 8px; line-height: 1.12; font-size: 15px; }
.ob .piece[aria-pressed="true"] { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 24%, var(--sim-bg-surface)); }
.ob .piece[data-used="1"] { opacity: .4; }
.ob .piece[data-no="1"] { border-color: var(--sim-bad); background: color-mix(in oklab, var(--sim-bad) 16%, var(--sim-bg-surface)); }
.ob .organs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.ob .organ { display: flex; flex-direction: column; align-items: stretch; gap: 4px; padding: 6px; min-height: 48px; text-align: center; }
.ob .organ .fig { display: block; } .ob .organ svg { display: block; width: 100%; height: auto; border-radius: var(--sim-radius-md); }
.ob .organ b { font-size: 16px; }
.ob .organ span { font-size: 14px; font-weight: 700; color: var(--sim-label-muted); }
.ob .organ[data-alive="1"] { border-color: var(--sim-good); }
.ob .organ[data-alive="1"] span { color: var(--sim-good); }
.ob .why { font-size: 15px; line-height: 1.3; font-weight: 700; margin: 6px 0 0; min-height: 40px; }
.ob .again { margin-top: 6px; min-height: 46px; width: 100%; }
.ob svg .churn { transform-box: fill-box; transform-origin: 50% 50%; animation: ob-churn 1.1s ease-in-out 3; }
@keyframes ob-churn { 25% { transform: scale(1.04, .96) rotate(-1.5deg); } 75% { transform: scale(.97, 1.03) rotate(1.5deg); } }
.ob svg .made { animation: ob-pop .6s var(--look-spring, ease-out) both; animation-delay: var(--d, 0s); }
@keyframes ob-pop { from { opacity: 0; transform: translateY(6px); } }
@media (prefers-reduced-motion: reduce) { .ob svg .churn, .ob svg .made { animation: none; } }
.sim-dom-root--portrait .ob .wrap { display: flex; flex-direction: column-reverse; gap: 8px; }
.sim-dom-root--portrait .ob .organs { gap: 6px; }
.sim-dom-root--portrait .ob .organ { padding: 4px; }
.sim-dom-root--portrait .ob .piece { font-size: 14px; padding: 2px 4px; }
`;

function stomachSvg(on) {
  // a faint shaded stomach is always there, so the board is a picture before any taps; each tissue put in comes up to
  // full strength in its own place (muscle wall, lining in the window, nerve net, blood vessels)
  const W = 340, H = 236, k = 0.64, x = 58, y = 58, alive = ['muscle', 'lining', 'nerve', 'blood'].every((p) => on.has(p));
  let s = `<defs>${artDefs()}${cwDefs()}${taDefs()}<radialGradient id="ob-sb" cx=".45" cy=".4" r=".8"><stop offset="0" style="stop-color:${mx('series-4', 'elev-peak', 8)}"/><stop offset="1" style="stop-color:${mx('series-4', 'elev-peak', 24)}"/></radialGradient></defs><rect width="${W}" height="${H}" style="fill:url(#ob-sb)"/>`;
  s += `<g${alive ? ' class="churn"' : ''}>${stomachJ(x, y, k, { part: (n) => (on.has(n) ? 1 : 0.2) })}</g>`;
  if (alive) { const q = rnd(3); for (let i = 0; i < 6; i++) s += `<ellipse class="made" style="--d:${(i * 0.12).toFixed(2)}s;fill:${mx('series-2', 'strata-3', 60)}" cx="${n1(x + (90 + q() * 90) * k)}" cy="${n1(y + (160 + q() * 40) * k)}" rx="6" ry="4.4"/>`; }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="The stomach: ${on.size} of 4 tissues in">${s}</svg>`;
}
function leafSvg(on) {
  const W = 340, H = 236, alive = ['epi', 'ground', 'xylem', 'phloem'].every((p) => on.has(p));
  const L = 262, Wd = 82, x0 = 62, cy = 122, top = [], bot = [], q0 = rnd(5);
  for (let i = 0; i <= 18; i++) { const u = i / 18, w = Wd * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.8) * (1 + (q0() - 0.5) * 0.03); top.push([x0 + u * L, cy - w - u * 10]); bot.push([x0 + u * L, cy + w * 0.94 - u * 10]); }
  const outline = smooth([...top, ...bot.reverse().slice(1, -1)]), mid = (u) => [x0 + u * L, cy - u * 10];
  let s = `<defs>${artDefs()}${cwDefs()}${taDefs()}<clipPath id="ob-l"><path d="${outline}"/></clipPath><linearGradient id="ob-lb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${mx('sky-day', 'elev-peak', 26)}"/><stop offset="1" style="stop-color:${mx('elev-low', 'elev-peak', 30)}"/></linearGradient>`
    + `<linearGradient id="ob-lf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${LEAF_L}"/><stop offset=".5" style="stop-color:${LEAF}"/><stop offset="1" style="stop-color:${LEAF_D}"/></linearGradient></defs><rect width="${W}" height="${H}" style="fill:url(#ob-lb)"/>`;
  if (alive) s += `<g class="made"><circle cx="${W - 30}" cy="28" r="18" style="fill:${T('gold')}"/>${[0, 1, 2, 3, 4].map((i) => { const a = 2.2 + i * 0.32; return `<path d="M${n1(W - 30 + Math.cos(a) * 26)} ${n1(28 + Math.sin(a) * 26)}l${n1(Math.cos(a) * 12)} ${n1(Math.sin(a) * 12)}" style="fill:none;stroke:${T('gold')};stroke-width:3;stroke-linecap:round"/>`; }).join('')}</g>`;
  s += `<path d="${outline}" transform="translate(5 9)" style="fill:${T('strata-6')};opacity:.16;filter:url(#cw-blur3)"/>`;
  // the petiole: a real stalk, thick at the base, shaded, joining the midrib
  const pet = `M10 ${cy + 40}C30 ${cy + 26} 46 ${cy + 4} ${x0 + 6} ${cy}`;
  s += `<path d="${pet}" style="fill:none;stroke:${LEAF_D};stroke-width:11;stroke-linecap:round"/><path d="${pet}" style="fill:none;stroke:${mx(LEAF, 'elev-peak', 20)};stroke-width:7;stroke-linecap:round"/><path d="${pet}" transform="translate(-1 -2)" style="fill:none;stroke:${LEAF_L};stroke-width:2;stroke-linecap:round;opacity:.8"/>`;
  // the ghost leaf: faint shaded blade, midrib and veins, so the board reads as a leaf before any tissue goes in
  s += `<path d="${outline}" style="fill:url(#ob-lf) ${LEAF};opacity:${on.has('ground') ? 1 : 0.28}"/>`;
  if (on.has('ground')) {
    // ground tissue: the leaf's green body, packed with rounded cells full of chloroplasts
    let cells = ''; const q = rnd(7);
    for (let yy = cy - Wd - 10; yy < cy + Wd; yy += 15) for (let xx = x0; xx < x0 + L; xx += 17) {
      const cx = xx + (Math.round(yy / 15) % 2 ? 8 : 0) + (q() - 0.5) * 3, cy2 = yy + (q() - 0.5) * 3;
      cells += `<path d="${blobPath(cx, cy2, 8, 7, Math.round(cx + cy2), 0.1, 7)}" style="fill:${mx(LEAF, 'elev-peak', 34)};stroke:${LEAF_D};stroke-width:1"/><circle cx="${n1(cx - 3)}" cy="${n1(cy2 + 2)}" r="1.8" style="fill:${T('chloro')}"/><circle cx="${n1(cx + 3)}" cy="${n1(cy2 - 1)}" r="1.8" style="fill:${T('chloro')}"/>`;
    }
    s += `<g clip-path="url(#ob-l)">${cells}<path d="${outline}" style="fill:url(#ob-lf);opacity:.35"/></g>`;
  }
  const vein = (dx, col, w, a = 1) => { const [mx0, my0] = mid(0), [mx1, my1] = mid(0.97); let d = `M${mx0 - 2} ${my0 + dx}Q${n1((mx0 + mx1) / 2)} ${n1((my0 + my1) / 2 + dx + 4)} ${n1(mx1)} ${n1(my1 + dx * 0.3)}`; for (let i = 1; i < 9; i++) { const u = i / 9.6, w2 = Wd * Math.sin(Math.PI * Math.pow(u, 0.8)) * 0.84, [vx, vy] = mid(u); d += `M${n1(vx)} ${n1(vy + dx)}Q${n1(vx + L * 0.06)} ${n1(vy - w2 * 0.45 + dx)} ${n1(vx + L * 0.11)} ${n1(vy - w2 + dx)}M${n1(vx)} ${n1(vy + dx)}Q${n1(vx + L * 0.06)} ${n1(vy + w2 * 0.45 + dx)} ${n1(vx + L * 0.11)} ${n1(vy + w2 * 0.92 + dx)}`; } return `<path d="${d}" style="fill:none;stroke:${col};stroke-width:${w};stroke-linecap:round;opacity:${a}"/>`; };
  s += `<g clip-path="url(#ob-l)">${vein(0, LEAF_D, 2.6, 0.35)}${vein(-1, LEAF_L, 1, 0.4)}</g>`;
  if (on.has('xylem')) s += `<g clip-path="url(#ob-l)">${vein(-2, XYL_D, 4.6)}${vein(-2, XYL, 2.6)}</g>`;
  if (on.has('phloem')) s += `<g clip-path="url(#ob-l)">${vein(2.6, PHL_D, 4.6)}${vein(2.6, PHL, 2.6)}</g>`;
  if (on.has('epi')) s += `<path d="${outline}" style="fill:${mx('elev-peak', 'sea-shallow', 80)};fill-opacity:.16;stroke:${mx(LEAF_L, 'elev-peak', 50)};stroke-width:7"/><path d="${outline}" style="fill:none;stroke:${LEAF_D};stroke-width:7;stroke-dasharray:1.4 9"/><path d="${outline}" style="fill:none;stroke:${LEAF_D};stroke-width:2"/>`;
  else s += `<path d="${outline}" style="fill:none;stroke:${LEAF_D};stroke-width:1.6;opacity:.4"/>`;
  s += `<path d="M${x0 + 30} ${cy - 50}Q${x0 + 110} ${cy - 86} ${x0 + 200} ${cy - 66}" style="fill:none;stroke:${T('elev-peak')};stroke-width:4;stroke-linecap:round;opacity:.3"/>`;
  if (alive) { const q = rnd(9); for (let i = 0; i < 7; i++) s += `<circle class="made" style="--d:${(0.3 + i * 0.12).toFixed(2)}s;fill:${T('series-2')};stroke:${mx('series-2', 'strata-6', 60)};stroke-width:1.4" cx="${n1(x0 + 30 + i * 32)}" cy="${n1(cy - i * 1.4 + (q() - 0.5) * 30)}" r="5"/>`; }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="The leaf: ${on.size} of 4 tissues in">${s}</svg>`;
}
const ARIA = 'A game. Build a stomach and a leaf from loose tissue pieces by tapping a piece and then the organ it belongs in.';

export class OrganBuildGame extends GameBoard {
  static ARIA_LABEL = ARIA;
  static OBJECTIVE = { prompt: { en: 'Build a working stomach and a working leaf.' } };
  _reset() { this._pick = null; this._in = { stomach: new Set(), leaf: new Set() }; this._won = false; }
  async setup() {
    this._reset();
    await super.setup();
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm ob"><div class="gm-head"><h2>Build an Organ</h2><p class="sub">Tap a tissue, then the organ it belongs in.</p></div>
      <div class="wrap"><div><div class="tray">${PIECES.map((p) => `<button type="button" class="tap btn piece" data-piece="${p.id}" aria-pressed="false">${p.label}</button>`).join('')}</div>
      <p class="why" data-why aria-live="polite"></p><button type="button" class="tap btn again" data-again>Start again</button></div>
      <div class="organs">${Object.entries(ORGANS).map(([k, l]) => `<button type="button" class="tap btn organ" data-organ="${k}"><span class="fig" data-fig="${k}"></span><b>${l}</b><span data-st="${k}"></span></button>`).join('')}</div></div></div>`,
    });
    this.root.querySelectorAll('[data-piece]').forEach((b) => onTap(b, () => this._choose(b.dataset.piece)));
    this.root.querySelectorAll('[data-organ]').forEach((b) => onTap(b, () => this._drop(b.dataset.organ)));
    const a = this.root.querySelector('[data-again]');
    if (a) onTap(a, () => { this._reset(); this._say('Both organs are empty again.'); this._show(true); });
    this._say('Tap a tissue piece first.');
    this._show(true);
  }
  _say(t) { const e = this.root.querySelector('[data-why]'); if (e) e.textContent = t; }
  _used(id) { return this._in.stomach.has(id) || this._in.leaf.has(id); }
  _alive(k) { return PIECES.filter((p) => p.organ === k).every((p) => this._in[k].has(p.id)); }
  _choose(id) {
    if (this._won || this._used(id)) return;
    this._pick = this._pick === id ? null : id;
    if (this._pick) this._say(`${PIECES.find((p) => p.id === id).label}: now tap the organ it belongs in.`);
    this._show(false);
  }
  _drop(k) {
    if (this._won) return;
    if (!this._pick) { this._say('Tap a tissue piece first, then the organ.'); return; }
    const p = PIECES.find((x) => x.id === this._pick);
    if (p.organ !== k) {
      this._say(p.no);
      this.quill?.setExpression?.('surprised');
      const b = this.root.querySelector(`[data-piece="${p.id}"]`);
      this._pick = null; this._show(false);
      if (b) b.dataset.no = '1';
      return;
    }
    this._in[k].add(p.id); this._pick = null;
    const n = this._in[k].size;
    if (this._alive(k)) { this._say(k === 'stomach' ? 'All four tissues together: the stomach churns.' : 'All four tissues together: the leaf makes food.'); this.quill?.perform?.('hop'); }
    else this._say(`${ORGANS[k]}: ${n} of 4 tissues in. It does not work until all of them are there.`);
    this._show(true, k);
    if (this._alive('stomach') && this._alive('leaf')) { this._won = true; this._say('Both organs work: each is several tissues working together.'); finishGame(this); }
  }
  _show(redraw, only) {
    if (redraw) for (const k of Object.keys(ORGANS)) {
      if (only && only !== k) continue;
      const fig = this.root.querySelector(`[data-fig="${k}"]`);
      if (fig) fig.innerHTML = k === 'stomach' ? stomachSvg(this._in.stomach) : leafSvg(this._in.leaf);
    }
    for (const k of Object.keys(ORGANS)) {
      const b = this.root.querySelector(`[data-organ="${k}"]`), st = this.root.querySelector(`[data-st="${k}"]`), alive = this._alive(k);
      if (b) b.dataset.alive = alive ? '1' : '0';
      if (st) st.textContent = alive ? (k === 'stomach' ? 'working: churning food' : 'working: making food') : `${this._in[k].size} of 4 tissues`;
    }
    this.root.querySelectorAll('[data-piece]').forEach((b) => { const id = b.dataset.piece; b.setAttribute('aria-pressed', String(this._pick === id)); b.dataset.used = this._used(id) ? '1' : '0'; b.dataset.no = '0'; });
    this.relayout?.();
  }
  checkObjective() { return this._won ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge?.(); this._reset(); if (this.root) this._show(true); }
}
