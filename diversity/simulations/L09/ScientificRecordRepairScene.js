// ScientificRecordRepairScene - L09 blk-l09-s06, 3 beats. 0: a written name with the capital on the wrong word; Fix the
// name corrects it. 1: a note that says only "indica", beside two other trees with that species name; Add the genus
// completes it. 2: a made-up label by a mango tree; the learner finds the line with the scientific name (tap the line, or
// its button). A find celebrates once. State comes from the beat: entering a beat resets it.
import { BioStage, beats, pill, panel, INK } from '../L03/BioStage.js';
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { svgLifeColour as lc, svgLife } from '../shared/LifeArt.js';
import { words } from '../shared/SeaBits.js';
import { fitBig, mx } from '../L08/VertArt.js';
import { mangoSprig, it } from './NameBits.js';

const LINES = [
  ['common', 'Common name', 'Mango', 'This line gives the common name.'],
  ['sci', 'Scientific name', 'Mangifera indica', 'Right: the genus, then the species name.'],
  ['family', 'Family', 'Anacardiaceae', 'This line gives the family, a larger group.'],
  ['uses', 'Uses', 'Fruit, shade', 'This line says what people use the tree for.'],
];

export class ScientificRecordRepairScene extends BioStage {
  static BEAT_STEP_MAP = beats(3);
  static ARIA_LABEL = 'A wrongly written name, panthera Tigris, corrected to Panthera tigris. A note that says indica, completed to Mangifera indica, beside neem, Azadirachta indica, and tamarind, Tamarindus indica. A made-up garden label for a mango tree with four lines.';
  heights = [[320, 310], [390, 336], [370, 336]];
  _fix = false; _pick = null; _found = false; _hit = [];
  ctls() {
    return [{ id: 'fix', label: 'Fix the name' }, { id: 'genus', label: 'Add the genus' },
      { kind: 'seg', id: 'line', label: 'Lines of the label', options: LINES.map((l) => ({ value: l[0], label: l[1] })) }];
  }
  onCtl(id, v) {
    if (id === 'fix' || id === 'genus') { this._fix = true; this.ctl?.show(id, false); this.repaint(); return; }
    if (id === 'line') this._choose(v ?? this._pick);
  }
  _choose(k) {
    this._pick = k; this.ctl?.set('line', k); this.repaint();
    if (k === 'sci' && !this._found) { this._found = true; const r = this._hit[1]; if (r) this.celebrate(r[0] + r[2] / 2, r[1] + r[3] / 2); }
  }
  enter(step) {
    this._fix = false; this._pick = null; this._found = false;
    this.ctl?.set('line', null); this.ctl?.show('fix', step === 0); this.ctl?.show('genus', step === 1); this.ctl?.show('line', step === 2);
  }
  pointerDown(p) {
    if (this.stepIndex !== 2) return false;
    const i = this._hit.findIndex((r) => p.x >= r[0] && p.x <= r[0] + r[2] && p.y >= r[1] && p.y <= r[1] + r[3]);
    if (i >= 0) this._choose(LINES[i][0]);
    return false;
  }
  _page(st) {
    const { W, H, portrait: P } = st, fix = this._fix, size = P ? 34 : 42;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('skyDay'), lc('white'), 0.6))}/>`;
    for (let y = 44; y < H; y += 40) g += `<path d="M0 ${y}H${W}" ${stroke(mx(lc('sea'), lc('white'), 0.4), 2)}/>`;
    g += `<path d="M${P ? 26 : 50} 0V${H}" ${stroke(mx(lc('red'), lc('white'), 0.4), 2.5)}/>`;
    g += fitBig('Tiger', W - (P ? 150 : 210), 8, P ? 140 : 196, P ? 76 : 104);
    const y = H - (P ? 110 : 118), x = P ? 40 : 90, gw = size * 3.86, gap = size * 0.5;
    g += words(x, 44, 'A note on the tiger', { size: 17, display: true, ink: INK, anchor: 'start' });
    if (fix) {
      g += it(x, y, 'Panthera', { size, anchor: 'start', display: false, weight: 700 }) + it(x + gw + gap, y, 'tigris', { size, anchor: 'start', display: false, weight: 700 });
      g += pill(W / 2, H - 42, 'Capital for the genus only', { size: 15, on: true, pop: true });
    } else {
      g += it(x, y, 'panthera', { size, anchor: 'start', display: false, weight: 700 }) + it(x + gw + gap, y, 'Tigris', { size, anchor: 'start', display: false, weight: 700 });
      g += `<circle cx="${x + size * 0.3}" cy="${y - size * 0.22}" r="${size * 0.52}" ${stroke(lc('red'), 4)}/><circle cx="${x + gw + gap + size * 0.28}" cy="${y - size * 0.34}" r="${size * 0.56}" ${stroke(lc('red'), 4)}/>`;
    }
    return g;
  }
  _note(st) {
    const { W, H, portrait: P } = st, fix = this._fix;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('leaf'), lc('white'), 0.62))}/>`;
    const nx = P ? 142 : 250, nw = W - nx - 14;
    g += mangoSprig(P ? 74 : 124, 8, P ? 0.86 : 1.04);
    g += panel(nx, 22, nw, 112, lc('white')) + words(nx + nw / 2, 50, 'Mango', { size: 18, display: true, ink: INK });
    g += fix ? it(nx + nw / 2, 96, 'Mangifera indica', { size: P ? 19 : 26 }) : it(nx + nw / 2, 96, 'indica', { size: P ? 24 : 28 });
    if (!fix) g += pill(nx + nw / 2, 134, 'Which indica?', { size: 14.5, on: true });
    const y0 = P ? 196 : 186, h = (H - y0 - 14 - 10) / 2, x1 = P ? 12 : 250, w = W - x1 - 14;
    [['Neem', 'Azadirachta indica'], ['Tamarind', 'Tamarindus indica']].forEach(([n, l], i) => {
      const y = y0 + i * (h + 10);
      g += panel(x1, y, w, h, lc('white')) + svgLife('BroadLeaf', x1 + 40, y + h - 6, 0.54);
      g += words(x1 + 76, y + h / 2 - 7, n, { size: 16, display: true, ink: INK, anchor: 'start' }) + it(x1 + 76, y + h / 2 + 15, l, { size: 16, anchor: 'start' });
    });
    return g;
  }
  _label(st) {
    const { W, H, portrait: P } = st, gy = H - 22, lw = P ? W - 28 : 400, lx = P ? 14 : W - lw - 18, ly = 10, row = (H - (P ? 100 : 78)) / 4;
    let g = `<rect width="${W}" height="${H}" ${fill(lc('skyDay'))}/><rect y="${gy}" width="${W}" height="${H}" ${fill(lc('grass'))}/>`;
    if (!P) g += svgLife('BroadLeaf', 104, gy + 4, 2.1) + mangoSprig(70, 110, 0.36) + mangoSprig(142, 136, 0.36);
    g += `<rect x="${lx + lw / 2 - 9}" y="${ly + 40}" width="18" height="${gy - ly - 40}" ${fill(lc('wood'), `stroke:${lc('woodDark')};stroke-width:3`)}/>`;
    const board = mx(lc('seaDeep'), INK, 0.3);
    g += `<rect x="${lx}" y="${ly}" width="${lw}" height="${row * 4 + 26}" rx="14" ${fill(board, `stroke:${INK};stroke-width:4`)}/>`;
    this._hit = [];
    LINES.forEach((l, i) => {
      const y = ly + 10 + i * (row + 2), on = this._pick === l[0], x = lx + 8, w = lw - 16;
      this._hit.push([x, y, w, row - 2]);
      g += `<rect x="${x}" y="${y}" width="${w}" height="${row - 2}" rx="10" ${fill(on ? lc('yellow') : mx(board, lc('white'), 0.12), on ? `stroke:${lc('white')};stroke-width:2.5` : '')}/>`;
      const c = on ? INK : lc('white');
      g += words(x + 12, y + 22, l[1], { size: 14, ink: c, anchor: 'start' });
      if (i === 0) g += mangoSprig(x + w - 44, y + 12, 0.3);
      g += i === 1 ? it(x + 12, y + 46, l[2], { size: 19, anchor: 'start', ink: c }) : words(x + 12, y + 46, l[2], { size: 18, display: true, ink: c, anchor: 'start' });
    });
    const say = this._pick ? LINES.find((l) => l[0] === this._pick)[3] : 'A made-up label';
    g += pill(P ? W / 2 : W - 218, H - (P ? 42 : 26), say, { size: 14 });
    return g;
  }
  draw(st, step) { return [this._page, this._note, this._label][step].call(this, st); }
}
