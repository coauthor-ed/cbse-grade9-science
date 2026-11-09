// LifeTree.js - the module's one drawn tree, after the five kingdom concept map in the book. Not a ladder: boughs
// fork by test, each kingdom is a crown of leaves, and a lesson's new groups are lit. A plain function, no state.
//
//   import { lifeTree, LIFE_TREE_CSS } from '../shared/LifeTree.js';
//   const t = lifeTree(4, { W: st.W, portrait: st.portrait });     t.h is the height it needs; t.svg goes in the stage
//   stage 1 root only. 2 five kingdoms and the four tests. 3 Monera, Protista, Fungi members. 4 three plant groups.
//   5 two seed plant groups. 6 four animal phyla. 7 four more and Chordata. 8 five vertebrate groups.
//   9 the tiger's path lit. 10 viruses shown outside the tree. 11 all lit.
// Options: W (stage width), portrait, lit (ids to light instead of the stage's own; a kingdom name or a member name),
//   forks (true: name each test on the trunk; default only at stage 2), grown (1..4: at stage 2 only, how many tests have
//   been made so far: 1 Monera, 2 + Protista, 3 + Animalia, 4 + Fungi and Plantae), outside (false hides the virus note),
//   ghost (true: at stage 2, kingdoms not yet grown stand as pale crowns, so the tree fills its frame from the first beat),
//   compact (shorter crowns and gaps, and 14 px small text, for a tree that must fit a side panel), fillH (stretch the gaps so the tree is this tall),
//   bare (true: crowns carry the kingdom name only, for a landscape tree that must fit one view).
// Every text is at least 13 px at W = 350. Put LIFE_TREE_CSS in the scene's css(). Colours are tokens.
import { svgBio, B, svgBioColour as bc } from './BioArt.js';
import { pathCircle as circle, pathRoundRect as rrect, blend as m } from './SeaArt.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const n1 = (v) => Math.round(v * 10) / 10;

export const KINGDOMS = {
  Monera: { art: 'Bacterium', o: {}, ic: 0.34, tone: m('magma', 'elevPeak', 0.72), rim: m('magma', 'strata3', 0.5), sub: 'Prokaryote' },
  Protista: { art: 'Amoeba', o: {}, ic: 0.42, tone: m('seaShallow', 'elevPeak', 0.66), rim: m('seaShallow', 'strata5', 0.4), sub: 'Eukaryote, unicellular' },
  Fungi: { art: 'Mushroom', o: {}, ic: 0.46, tone: m('strata1', 'elevPeak', 0.5), rim: m('strata3', 'strata2', 0.3), sub: 'Mostly multicellular, chitin wall' },
  Plantae: { art: 'FernPlant', o: {}, ic: 0.3, tone: m('elevLow', 'elevPeak', 0.56), rim: B.leafDark, sub: 'Multicellular, cellulose wall' },
  Animalia: { art: 'Tiger', o: {}, ic: 0.34, tone: m('gold', 'elevPeak', 0.6), rim: m('strata2', 'strata3', 0.4), sub: 'Multicellular, no cell wall' },
};
const MEMBERS = {
  Monera: [[3, 'Bacteria'], [3, 'Cyanobacteria']],
  Protista: [[3, 'Amoeba'], [3, 'Paramecium'], [3, 'Euglena']],
  Fungi: [[3, 'Mushroom'], [3, 'Yeast'], [3, 'Aspergillus']],
  Plantae: [[4, 'Thallophyta'], [4, 'Bryophyta'], [4, 'Pteridophyta'], [5, 'Gymnosperms'], [5, 'Angiosperms']],
  Animalia: [[6, 'Porifera'], [6, 'Cnidaria'], [6, 'Platyhelminthes'], [6, 'Nematoda'], [7, 'Annelida'], [7, 'Arthropoda'], [7, 'Mollusca'], [7, 'Echinodermata'], [7, 'Chordata'],
    [8, 'Fishes'], [8, 'Amphibians'], [8, 'Reptiles'], [8, 'Birds'], [8, 'Mammals']],
};
const STAGE_LIT = {
  1: ['root'], 2: ['Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia'], 3: ['Monera', 'Protista', 'Fungi'], 4: ['Plantae'], 5: ['Plantae'], 6: ['Animalia'], 7: ['Animalia'], 8: ['Animalia'],
  9: ['Animalia', 'Chordata', 'Mammals'], 10: [], 11: ['Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia'],
};
const TESTS = ['Cell type', 'Level of organisation', 'Cell structure', 'Mode of nutrition'];
export const LIFE_TREE_CSS = `
.lt-new { animation: lt-pop 420ms cubic-bezier(.3,1.5,.5,1) both; transform-box: fill-box; transform-origin: center; }
@keyframes lt-pop { from { transform: scale(.7); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .lt-new { animation: none; } }
`;

const INK = bc('ink');
const text = (x, y, s, o = {}) => `<text x="${n1(x)}" y="${n1(y)}" text-anchor="${o.anchor ?? 'start'}" style="font-family:${o.display ? 'var(--sim-font-display)' : 'var(--sim-font)'};font-size:${o.size ?? 13}px;font-weight:${o.weight ?? 800};fill:${o.ink ?? INK}">${esc(s)}</text>`;
function bough(x0, y0, x1, y1, w0, w1, cx, cy) {
  // A tapered limb from the trunk (x0, y0) to a crown (x1, y1), bending through (cx, cy).
  const pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18, u = 1 - t; pts.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]); }
  const a = [], b = [];
  pts.forEach((p, i) => {
    const q = pts[Math.min(18, i + 1)], r = pts[Math.max(0, i - 1)], dx = q[0] - r[0], dy = q[1] - r[1], L = Math.hypot(dx, dy) || 1, w = w0 + (w1 - w0) * (i / 18);
    a.push([p[0] - dy / L * w / 2, p[1] + dx / L * w / 2]); b.push([p[0] + dy / L * w / 2, p[1] - dx / L * w / 2]);
  });
  return [...a, ...b.reverse()].map((p, i) => `${i ? 'L' : 'M'}${n1(p[0])} ${n1(p[1])}`).join('') + 'Z';
}
function crownPath(x, y, w, h, seed) {
  // Foliage: lobes along the top and sides. Two lists, painted as two paths: their windings would cancel in one.
  let d = '', i = seed;
  const q = () => { i = (i * 31 + 7) % 97; return 15 + (i % 6); };
  for (let px = x + 22; px < x + w - 12; px += 34) d += circle(px, y + 15, q());
  for (let py = y + 34; py < y + h - 18; py += 34) { d += circle(x + 15, py, q() - 1); d += circle(x + w - 15, py, q() - 1); }
  for (let px = x + 30; px < x + w - 20; px += 44) d += circle(px, y + h - 12, q() - 3);
  return [rrect(x + 2, y + 6, w - 4, h - 10, 22), d];
}
const foliage = (x, y, w, h, seed, st) => crownPath(x, y, w, h, seed).map((d) => `<path d="${d}" style="${st}"/>`).join('');

export function lifeTree(stage, opts = {}) {
  const W = opts.W ?? 680, portrait = !!opts.portrait, forks = opts.forks ?? stage === 2, grown = stage === 2 ? (opts.grown ?? 4) : 4;
  const soil = bc(m('strata3', 'strata2', 0.3)), barkC = bc(B.bark), barkD = bc(B.barkDark), gold = 'var(--sim-gold)';
  const footH = opts.compact ? 46 : 58; let trunkX = W / 2;
  if (stage <= 1) return sapling(W, opts);
  const lit = new Set(opts.lit ?? STAGE_LIT[stage] ?? []);
  const named = (k) => (MEMBERS[k] ?? []).filter(([s]) => s <= stage).map(([, n]) => n);
  // In a landscape panel only a lit crown lists its members, so the tree stays short enough to read.
  const seen = (k) => (opts.bare ? [] : portrait || !lit.size || lit.has(k) || named(k).some((n) => lit.has(n)) ? named(k) : []);
  const fresh = (k, n) => (MEMBERS[k] ?? []).some(([s, x]) => x === n && s === stage);
  const narrow = portrait || W < 600, tight = portrait && W < 330, gapX = portrait ? (forks ? 46 : 36) : narrow ? 48 : 70, colW = (W - 2 * 6 - gapX) / 2, rowH = narrow && portrait ? 19 : 20, compact = !!opts.compact, headH = compact ? 60 : forks ? 70 : 58, testH = forks ? (compact ? 20 : 32) : 0, subSize = compact ? 14 : 13;
  // A phone tree without tests stands left of centre: Animalia holds the longest names, so its side gets the room.
  const lean = portrait && !forks, colL = lean ? (W - 12 - gapX) * 0.47 : colW, colR = lean ? W - 12 - gapX - colL : colW;
  if (lean) trunkX = 6 + colL + gapX / 2;
  const grownK = { Monera: grown >= 1, Protista: grown >= 2, Animalia: grown >= 3, Fungi: grown >= 4, Plantae: grown >= 4 };
  const ghost = !!opts.ghost && stage === 2, visible = ghost ? { Monera: true, Protista: true, Animalia: true, Fungi: true, Plantae: true } : grownK;
  const colsOf = (k) => (portrait || (W < 600 && seen(k).length <= 9) ? 1 : 2);
  // On a phone the crowns stand clear of a slimmer trunk, the icon is smaller and the names sit closer to the crown edge.
  const inset = tight ? 8 : portrait ? 10 : 14, leafGap = tight ? 12 : portrait ? 17 : 21, headQ = portrait ? (forks || tight ? 0.7 : 0.84) : forks && narrow ? 0.8 : 1;
  const subW = (k) => colW - (10 + 50 * headQ + 4) - 6, subLines = (k) => splitSub(KINGDOMS[k].sub, subW(k), subSize);
  const extra = (k) => (forks && portrait ? Math.max(0, subLines(k).length - 2) * (subSize + 2) : 0);
  const crownH = (k) => { const c = seen(k).length; return visible[k] ? (c ? headH + 18 + Math.ceil(c / colsOf(k)) * rowH : headH + (forks ? 12 : 6) + extra(k)) : 0; };
  // Stack from the ground. Left: Monera, Fungi, Plantae. Right: Protista, Animalia. Boughs must meet the trunk in the
  // order of the tests, so each crown sits above the last test it needs.
  const gap = 10, pos = {};
  const place = (T) => {
    let yL = footH + T, yR = footH + T + 22;
    pos.Monera = { b: yL, h: crownH('Monera') }; yL += pos.Monera.h + gap;
    pos.Protista = { b: Math.max(yR, footH + 2 * T + 16), h: crownH('Protista') }; yR = pos.Protista.b + pos.Protista.h + gap + T;
    pos.Animalia = { b: yR, h: crownH('Animalia') }; yR += pos.Animalia.h + gap;
    if (forks) yL = Math.max(yL + T, pos.Animalia.b + 14 + T);
    pos.Fungi = { b: yL, h: crownH('Fungi') }; yL += pos.Fungi.h + gap;
    pos.Plantae = { b: yL, h: crownH('Plantae') };
    const shown = Object.keys(visible).filter((k) => visible[k]);
    const top = Math.max(footH + 150, ...shown.map((k) => pos[k].b + pos[k].h)) + 10;
    return Math.max(top, forks && !ghost ? 60 + (grown + 1) * (T + 34) : 0);
  };
  let testH2 = testH, h = place(testH2);
  if (opts.fillH > h) { testH2 += (opts.fillH - h) / 3; h = Math.max(place(testH2), opts.fillH); }
  const Y = (b) => h - b, left = (k) => k === 'Monera' || k === 'Fungi' || k === 'Plantae';
  const box = (k) => ({ x: left(k) ? 6 : W - 6 - colR, y: Y(pos[k].b + pos[k].h), w: left(k) ? colL : colR, h: pos[k].h });
  // Forks on the trunk, bottom to top.
  const ty = [Y(footH + 12), Y(pos.Protista.b + 4), Y(pos.Animalia.b + 8), Y(pos.Fungi.b + 8)];
  const attach = (k) => { const b = box(k); return [left(k) ? b.x + b.w - 8 : b.x + 8, b.y + b.h * (k === 'Animalia' ? 0.8 : 0.55)]; };
  let wood = '', glow = '';
  const trunkTop = visible.Plantae ? Y(pos.Plantae.b + pos.Plantae.h * 0.45) : Y(footH + (grown + 1) * (testH2 + 34));
  wood += bough(trunkX, h - 34, trunkX, trunkTop, tight ? 20 : portrait ? 24 : 34, portrait ? 8 : 10, trunkX, (h + trunkTop) / 2);
  const limb = (k, fy, w0) => {
    if (!visible[k]) return;
    const [ax, y] = attach(k), x = ax, d = bough(trunkX, fy, x, y, w0, 8, (ax + trunkX) / 2, fy - 2);
    wood += d;
    if (lit.has(k) && grownK[k]) glow += `<path d="${d}" style="fill:${gold};opacity:.55"/>`;
  };
  limb('Monera', ty[0], 16); limb('Protista', ty[1], 15); limb('Animalia', ty[2], 16); limb('Fungi', ty[3], 12);
  let out = `<rect x="0" y="${h - 40}" width="${W}" height="40" rx="10" style="fill:${soil}"/>`;
  out += `<path d="M${trunkX - 13} ${h - 36}Q${trunkX - 40} ${h - 20} ${trunkX - 76} ${h - 14}M${trunkX - 6} ${h - 36}Q${trunkX - 18} ${h - 18} ${trunkX - 34} ${h - 6}M${trunkX + 6} ${h - 36}Q${trunkX + 20} ${h - 18} ${trunkX + 36} ${h - 6}M${trunkX + 13} ${h - 36}Q${trunkX + 42} ${h - 22} ${trunkX + 78} ${h - 14}" style="fill:none;stroke:${barkD};stroke-width:6;stroke-linecap:round"/>`;
  out += `<path d="${wood}" style="fill:${barkC};stroke:${barkD};stroke-width:1.6"/>${glow}`;
  out += text(trunkX, h - 13, 'Living things', { anchor: 'middle', size: 15, ink: bc('white'), display: true, weight: 600 }).replace('<text', `<text paint-order="stroke" stroke="${barkD}" stroke-width="5"`);
  // Crowns.
  for (const k of ['Monera', 'Protista', 'Animalia', 'Fungi', 'Plantae']) {
    if (!visible[k]) continue;
    const b = box(k), K = KINGDOMS[k], on = lit.has(k), names = seen(k);
    if (!grownK[k]) { out += `<g style="opacity:.3">${foliage(b.x, b.y, b.w, b.h, k.length * 3, `fill:${bc(K.tone)}`)}</g>`; continue; }
    const dim = lit.size && !on && !names.some((n) => lit.has(n));
    out += `<g style="opacity:${dim ? 0.82 : 1}">`;
    if (on) out += foliage(b.x, b.y, b.w, b.h, k.length * 3, `fill:${gold};stroke:${gold};stroke-width:7`);
    out += foliage(b.x, b.y + 3, b.w, b.h, k.length * 3, `fill:${bc(K.rim)}`);
    out += foliage(b.x, b.y, b.w, b.h, k.length * 3, `fill:${bc(K.tone)}`);
    const q = headQ, cx = b.x + (portrait ? 10 : 12) + 24 * q, cy = b.y + (portrait && forks ? 30 : 36), tx = cx + 26 * q + (portrait ? 4 : 6);
    out += `<circle cx="${n1(cx)}" cy="${cy}" r="${25 * q}" style="fill:${bc('white')};stroke:${bc(K.rim)};stroke-width:2.4"/>`;
    out += art(k, cx, cy, q);
    out += text(tx, b.y + (forks ? 26 : 42), k, { size: 19, display: true, weight: 600 });
    if (forks) out += portrait ? subLines(k).map((l, i) => text(tx, b.y + 44 + i * (subSize + 2), l, { size: subSize, weight: 700 })).join('') : wrapSub(tx, b.y + (compact ? 42 : 44), K.sub, b.x + b.w - tx - 6, subSize);
    const cols = colsOf(k), colWi = (b.w - 2 * inset) / cols, nameSize = !portrait && cols === 1 ? 14 : 13;
    names.forEach((n, i) => {
      const c = i % cols, r = Math.floor(i / cols), x = b.x + inset + c * colWi, y = b.y + headH + 18 + r * rowH, onName = lit.has(n), isNew = fresh(k, n);
      out += `<g${isNew ? ' class="lt-new"' : ''}>`;
      if (onName || isNew) out += `<rect x="${x - 4}" y="${y - 13}" width="${Math.min(colWi - 2 + (portrait ? 8 : 0), n.length * 7.9 + 30)}" height="18" rx="9" style="fill:${onName ? gold : bc('white')};opacity:${onName ? 0.9 : 0.72}"/>`;
      out += `<path d="${tight ? `M${x + 1} ${y - 2}q3 -6 8 -4q-1 6 -8 4z` : `M${x + 3} ${y - 2}q5 -9 13 -6q-1 9 -13 6z`}" style="fill:${bc(B.leaf)}"/>`;
      out += text(x + leafGap, y + 1, n, { size: nameSize }) + '</g>';
    });
    out += '</g>';
  }
  // Tests, named at their forks, each in the clear side of the trunk.
  if (forks) {
    TESTS.slice(0, grown).forEach((t, i) => {
      const tw = t.length * (compact ? 8 : 7.4) + 22, side = [0, 1, 1, -1][i];
      const y = [ty[0], Y(pos.Protista.b - testH2 / 2), Y(pos.Animalia.b - testH2 / 2), Y(pos.Fungi.b - testH2 / 2)][i];
      const x = side === 0 ? trunkX - tw / 2 : side > 0 ? Math.min(W - tw - 4, trunkX - 12) : Math.max(4, trunkX + 12 - tw);
      out += `<g class="lt-new"><rect x="${n1(x)}" y="${n1(y - 13)}" width="${n1(tw)}" height="26" rx="13" style="fill:${bc('white')};stroke:${gold};stroke-width:2.4"/>`;
      out += text(x + tw / 2, y + 5, t, { anchor: 'middle', size: subSize }) + '</g>';
    });
  }
  if (stage === 10 && opts.outside !== false) {
    const label = 'Viruses: outside the five kingdoms', tw = Math.min(W - 12, 280), x = (W - tw) / 2;
    return { h: h + 42, svg: `<rect x="${n1(x)}" y="4" width="${tw}" height="30" rx="15" style="fill:${bc('white')};stroke:${INK};stroke-width:1.6;stroke-dasharray:5 4"/>`
      + text(W / 2, 24, label, { anchor: 'middle', size: 13 }) + `<g transform="translate(0 42)">${out}</g>` };
  }
  return { h, svg: out };
}
function art(k, cx, cy, q = 1) {
  const K = KINGDOMS[k];
  const place = { Monera: [0, 0], Protista: [0, 0], Fungi: [0, 22], Plantae: [0, 19], Animalia: [3, 16] }[k];
  return svgBio(K.art, cx + place[0] * q, cy + place[1] * q, K.ic * q, K.o);
}
function splitSub(s, w, size) {
  // Lines by word, for the narrow phone crown: the width is an estimate, so a long word takes a line of its own.
  const lines = [];
  for (const word of s.split(' ')) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length * size * 0.5 <= w) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
  }
  return lines;
}
function wrapSub(x, y, s, w, size = 13) {
  // The one small line in a crown head; breaks at the comma when it will not fit.
  if (s.length * size * 0.53 <= w) return text(x, y, s, { size, weight: 700 });
  const i = s.indexOf(', ');
  if (i < 0) return text(x, y, s, { size, weight: 700 });
  return text(x, y, s.slice(0, i + 1), { size, weight: 700 }) + text(x, y + size + 2, s.slice(i + 2), { size, weight: 700 });
}
function sapling(W, opts) {
  const h = opts.portrait ? 470 : 340, x = W / 2, soil = bc(m('strata3', 'strata2', 0.3)), barkC = bc(B.bark), barkD = bc(B.barkDark);
  let out = `<rect x="0" y="${h - 46}" width="${W}" height="46" rx="10" style="fill:${soil}"/>`;
  out += `<path d="${bough(x, h - 40, x, 70, 30, 8, x, h / 2)}${bough(x, h - 120, x - 66, h - 196, 11, 4, x - 24, h - 150)}${bough(x, h - 158, x + 62, h - 222, 10, 4, x + 26, h - 180)}" style="fill:${barkC};stroke:${barkD};stroke-width:1.6"/>`;
  const buds = [[x, 58, 0], [x - 72, h - 204, -40], [x + 68, h - 230, 40]];
  for (const [bx, by, r] of buds) out += `<g transform="translate(${n1(bx)} ${n1(by)}) rotate(${r})"><g class="lt-new"><path d="M0 14Q-15 -2 0 -22Q15 -2 0 14Z" style="fill:${bc(B.leaf)}"/><path d="M0 14Q15 -2 0 -22Q4 -2 0 14Z" style="fill:${bc(B.leafDark)};opacity:.5"/></g></g>`;
  const tw = 136;
  out += `<rect x="${x - tw / 2}" y="${h - 36}" width="${tw}" height="28" rx="14" style="fill:${bc('white')};stroke:var(--sim-gold);stroke-width:3"/>`;
  out += text(x, h - 16, 'Living things', { anchor: 'middle', size: 16, display: true, weight: 600 });
  return { h, svg: out };
}
