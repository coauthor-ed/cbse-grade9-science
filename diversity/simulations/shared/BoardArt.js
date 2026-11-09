// BoardArt.js - the module's own drawings for kit boards, games and name checks. A kit character is a small tinted
// glyph, so a dolphin could come out orange and an archaeon a pink dot. Every picture on a board comes from here.
//   bioAv(o, size)    the picture for { id } or { art }, or null
//   swapArt(root)     replaces each kit character under root with its drawing. Scenes get this from wideBoard().
import { characterSvg, ART_KEYS } from 'simulations/base/kit/KeyCharacters.js';
import { bioIcon } from './BioArt.js';
import { svgLifeColour as lc } from './LifeArt.js';
import { virus, rod, mx } from '../L10/EarthArt.js';
import { oldTree, tulsi } from '../L11/ForestArt.js';

const ART = {
  bacterium: 'Bacterium', cyano: 'Cyanobacterium', yeast: 'Yeast', mould: 'Mycelium', mushroom: 'Mushroom', euglena: 'Euglena', amoeba: 'Amoeba',
  paramecium: 'Paramecium', spirogyra: 'Spirogyra', moss: 'MossClump', fern: 'FernPlant', pine: 'PineTree', flower: 'Gulmohar', sponge: 'Sponge',
  hydra: 'Hydra', flatworm: 'Flatworm', roundworm: 'Roundworm', earthworm: 'Earthworm', beetle: 'Beetle', snail: 'Snail', octopus: 'Octopus',
  starfish: 'Starfish', amphioxus: 'Amphioxus', carp: 'Fish', frog: 'Frog', lizard: 'Lizard', sparrow: 'Sparrow', ostrich: 'Ostrich',
  hornbill: 'Hornbill', tiger: 'Tiger', lion: 'Lion', dolphin: 'Dolphin', deer: 'Deer',
  protist: 'Amoeba', pond: 'Amoeba', hypha: 'Mushroom', sprout: 'FernPlant', critter: 'Deer',
};
// Options for a drawing on a card. Pale threads need a dark outline on a light card.
const ART_O = { mould: { rim: true } };
// An archaeon is a microbe of hot springs, so the rod sits over rising heat. No face.
const heat = () => [-46, 0, 46].map((x) => `<path d="M${x} 66c-14 -12 14 -18 0 -30" fill="none" style="stroke:${mx(lc('red'), lc('gold'), 0.4)};stroke-width:9;stroke-linecap:round"/>`).join('');
const DRAWN = {
  virus: ['-66 -66 132 132', () => virus(0, 0, 1)],
  mango: ['-190 -450 380 470', () => oldTree(0, 0, 1, { fruit: true })],
  tulsi: ['-70 -160 140 165', () => tulsi(0, 0, 1)],
  archaeon: ['-104 -74 210 150', () => rod(0, -22, 1, { tone: mx(lc('gold'), lc('white'), 0.4) }) + heat()],
};
// Generic kit characters stand for several organisms: the name printed beside one says which.
const NAMED = [['mango', 'mango'], ['tulsi', 'tulsi'], ['euglena', 'euglena'], ['paramecium', 'paramecium'], ['amoeba', 'amoeba'], ['mould', 'mould'], ['deer', 'deer'], ['tiger', 'tiger']];
const GENERIC = new Set(['protist', 'pond', 'critter', 'sprout', 'hypha']);

// Every picture fills its box. A long thin organism fitted flat is a thread in a square, so it lies corner to corner
// (POSE angle), and a filament shown alone is shown as the tangle of threads it grows in (POSE threads).
// FIT holds each pose's own bounds in pixels, measured once, so nothing is measured while a board draws. After changing
// a drawing or a pose, measure it again. The archaeon keeps its DRAWN box, which leaves out its long whip.
const POSE = {
  bacterium: { turn: -45 }, euglena: { turn: -45 }, paramecium: { turn: -30 }, flatworm: { turn: -45 }, roundworm: { turn: -45 },
  earthworm: { turn: -45 }, amphioxus: { turn: -45 }, lizard: { turn: -40 }, dolphin: { turn: -25 }, carp: { turn: -15 },
  spirogyra: { threads: [[-26, -40], [18, 0], [-14, 40]], turn: -30 }, cyano: { threads: [[20, -32], [-22, 0], [14, 32]], turn: -30 },
};
const FIT = {
  bacterium: [-55.6,-75,68.8,68.8], cyano: [-106.8,-97.1,114.7,78.5], yeast: [-33.5,-41.5,48.5,35.3], mould: [-82.9,-82.9,81.2,87.4], mushroom: [-42.4,-94.4,42.4,0],
  euglena: [-49.4,-114.7,87.4,52.9], amoeba: [-64.4,-53.8,60.9,52.1], paramecium: [-76.8,-57.4,68.8,59.1], spirogyra: [-150,-91.8,122.6,112.1], moss: [-45,-86.5,45.9,2.6],
  fern: [-75.9,-118.2,75.9,0], pine: [-55.6,-181.8,55.6,0], flower: [-99.7,-149.1,101.5,4.4], sponge: [-53.8,-114.7,54.7,0], hydra: [-48.5,-150.9,48.5,2.6],
  flatworm: [-46.8,-51.2,44.1,48.5], roundworm: [-43.2,-40.6,56.5,54.7], earthworm: [-55.6,-64.4,54.7,62.6], beetle: [-47.6,-61.8,47.6,48.5], snail: [-55.6,-73.2,75.9,2.6],
  octopus: [-90.9,-60,90.9,76.8], starfish: [-54.7,-57.4,54.7,46.8], amphioxus: [-57.4,-50.3,50.3,57.4], carp: [-35.3,-15.9,25.6,19.4], frog: [-20.3,-22.9,17.6,1.8],
  lizard: [-41.5,-22.1,22.1,19.4], sparrow: [-38.8,-38.8,39.7,1.8], ostrich: [-69.7,-199.4,61.8,2.6], hornbill: [-40.6,-39.7,45.9,9.7], tiger: [-87.4,-86.5,65.3,0],
  lion: [-67.1,-86.5,61.8,0], dolphin: [-56.5,-24.7,43.2,35.3], deer: [-52.9,-125.3,73.2,0], protist: [-64.4,-53.8,60.9,52.1], pond: [-64.4,-53.8,60.9,52.1],
  hypha: [-42.4,-94.4,42.4,0], sprout: [-75.9,-118.2,75.9,0], critter: [-52.9,-125.3,73.2,0], virus: [-65.8,-65.8,65.8,65.8], mango: [-185.1,-432.8,174.4,15.3],
  tulsi: [-50.5,-151.4,48.9,3.1],
};
const inner = (svg) => svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'));
function posed(id, body) {
  const p = POSE[id];
  if (!p) return body;
  const all = p.threads ? p.threads.map(([x, y]) => `<g transform="translate(${x} ${y})">${body}</g>`).join('') : body;
  return `<g transform="rotate(${p.turn ?? 0})">${all}</g>`;
}
function fitted(id, body, size) {
  const b = FIT[id];
  if (!b) return null;
  const s = Math.max(b[2] - b[0], b[3] - b[1]), x = (b[0] + b[2] - s) / 2, y = (b[1] + b[3] - s) / 2;
  return `<svg class="ek-av bio-ic" viewBox="${x.toFixed(1)} ${y.toFixed(1)} ${s.toFixed(1)} ${s.toFixed(1)}" width="${size}" height="${size}" aria-hidden="true">${posed(id, body)}</svg>`;
}
const keyFor = (o) => (DRAWN[o?.id] ? o.id : DRAWN[o?.art] ? o.art : ART[o?.id] ? o.id : o?.art);

export function bioAv(o, size = 44) {
  const id = keyFor(o), d = DRAWN[id], name = ART[id];
  if (!d && !name) return null;
  const body = d ? d[1]() : inner(bioIcon(name, size, ART_O[id]));
  return fitted(id, body, size) ?? (d ? `<svg class="ek-av bio-ic" viewBox="${d[0]}" width="${size}" height="${size}" aria-hidden="true">${body}</svg>` : bioIcon(name, size, ART_O[id]).replace('class="bio-ic"', 'class="ek-av bio-ic"'));
}
// For the measuring tool only.
export const FIT_IDS = [...Object.keys(ART), ...Object.keys(DRAWN)].filter((k) => k !== 'archaeon');
export const rawPose = (id) => { const d = DRAWN[id]; return { inner: posed(id, d ? d[1]() : inner(bioIcon(ART[id], 44, ART_O[id]))), span: d ? 520 : 300 }; };

const KEY = new Map();
function keyOf(svg) {
  if (!KEY.size) {
    const box = document.createElement('div');
    ART_KEYS.forEach((a) => { box.innerHTML = characterSvg(a, 1); KEY.set(box.firstElementChild.innerHTML, a); });
  }
  return KEY.get(svg.innerHTML);
}

export function swapArt(root) {
  root?.querySelectorAll('svg.ek-av:not(.bio-ic)').forEach((svg) => {
    const art = keyOf(svg);
    if (!art) return;
    let id;
    if (GENERIC.has(art)) { const t = (svg.parentElement?.textContent ?? '').toLowerCase(); id = NAMED.find(([w]) => t.includes(w))?.[1]; }
    const html = bioAv({ id, art }, 44);
    if (!html) return;
    const box = document.createElement('div');
    box.innerHTML = html;
    const next = box.firstElementChild;
    const w = svg.getAttribute('width'), h = svg.getAttribute('height');
    if (w) { next.setAttribute('width', w); next.setAttribute('height', h ?? w); } else { next.removeAttribute('width'); next.removeAttribute('height'); }
    svg.replaceWith(next);
  });
}
