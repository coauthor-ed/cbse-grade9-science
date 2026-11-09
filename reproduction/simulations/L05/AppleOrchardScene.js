// AppleOrchardScene - L05 blk-l05-a01, 4 beats. Two orchards side by side, Place A natural pollinators, Place B with beehives. Beat 1
// names what is measured. Beat 2: bars 26, 40 and 35, 8. Beat 3: suppose 200 branches: fruits kept 34 and 74.
import { SvgScene, fill } from 'simulations/base/kit/SimSvg.js';
import { label, words, ART_INK } from '../shared/PlantArt.js';
import { frame, phoneMin, appleTree, beeHive, bee, backdrop, FLOWER_COLOURS as C } from '../shared/FlowerArt.js';

const DATA = { A: { set: 26, drop: 35, sets: 52, fell: 18, kept: 34 }, B: { set: 40, drop: 8, sets: 80, fell: 6, kept: 74 } };

export class AppleOrchardScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }]];
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 486;
  static ARIA_LABEL = 'Two apple orchards. Place A has natural pollinators, Place B also has beehives. Fruit set is 26 and 40 per cent, fruit drop 35 and 8 per cent. With 200 branches, a made-up number, about 34 and 74 fruits stay.';
  static CONTROLS = [];
  stageHeight(st) { return st.portrait ? 460 : 410; }
  paint(st) {
    const W = st.W, H = st.H, port = st.portrait, b = this.stepIndex;
    const panels = b >= 1;
    const fl = panels ? (port ? 190 : 170) : H - 54, rows = port && !panels;
    let a = rows ? '' : backdrop('orchard', W, H, { floor: fl });
    const cols = [W * 0.27, W * 0.75];
    // Phone, first beat: the two orchards one above the other, so the trees fill the card.
    if (rows) ['A', 'B'].forEach((k, i) => {
      const h = H / 2, f = h - 30, x = W / 2, s = 0.84;
      let o = backdrop('orchard', W, h, { floor: f, seed: 3 + i * 4 });
      o += appleTree(x - 92, f + 4, s * 0.8, { fruit: 0, seed: 4 + i }) + appleTree(x + (i ? -12 : 40), f + 6, s, { fruit: i ? 9 : 5, seed: 7 + i });
      if (i) o += beeHive(x + 118, f + 8, 0.66, {}) + bee(x - 96, f - 134, 0.36, {}) + bee(x + 72, f - 118, 0.34, { flip: true }) + bee(x - 20, f - 92, 0.34, {}) + bee(x + 92, f - 56, 0.32, { flip: true });
      o += words(W - 14, 30, `Place ${k}`, { size: 22, display: true, anchor: 'end', ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 6 }) + words(W / 2, h - 8, i ? 'Bees added' : 'Natural pollinators', { size: 15, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 5 });
      a += `<svg x="0" y="${i * h}" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">${o}</svg>`;
    });
    else ['A', 'B'].forEach((k, i) => {
      const x = cols[i], s = panels ? (port ? 0.72 : 0.72) : (port ? 0.8 : 1.3);
      if (!(port && !panels)) a += appleTree(x - 40 * (panels ? 0.6 : 1) * (port ? 0.7 : 1.2), fl + 6, s * 0.72, { fruit: 0, seed: 4 + i });
      a += appleTree(port && !panels ? x : x + 26 * (panels ? 0.6 : 1) * (port ? 0.7 : 1.2), fl + 8, s, { fruit: i ? 9 : 5, seed: 7 + i });
      if (i) { a += beeHive(x + (panels ? 62 : port ? 46 : 118), fl + 12, panels ? 0.54 : port ? 0.6 : 0.9, {}); a += bee(x - 74, fl - 136 * s, 0.36, {}) + bee(x + 96, fl - 150 * s, 0.32, { flip: true }) + bee(x + 16, fl - 112 * s, 0.32, {}) + bee(x + 92, fl - 60 * s, 0.32, { flip: true }); }
      a += words(x, panels ? 26 : 36, `Place ${k}`, { size: 22, display: true, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 6 });
      if (!panels) a += label(x, H - 18, i ? 'Bees added' : 'Natural pollinators', { size: port ? 15 : 16 });
    });
    if (panels) {
      const ty = fl + 4, th = H - ty - 8;
      a += `<rect x="-4" y="${fl}" width="${W + 8}" height="${H}" ${fill('var(--sim-bg-surface)')}/><path d="M-4 ${fl}H${W + 4}" style="stroke:${ART_INK};stroke-width:3"/>`;
      if (b === 1) {
        const L = port ? 18 : W * 0.1, y0 = ty + (port ? 44 : 40), gap = port ? 118 : 96;
        const row = (y, t, u, f) => words(L, y, t, { size: 20, display: true, ink: 'var(--sim-label)', anchor: 'start' }) + words(L, y + 25, u, { size: 16, ink: 'var(--sim-label)', anchor: 'start', weight: 700 }) + (f ? words(L, y + 47, f, { size: 16, ink: 'var(--sim-label)', anchor: 'start', weight: 700 }) : '');
        a += row(y0, 'Fruit set', 'Fruits as a percentage', 'of fruit-bearing branches') + row(y0 + gap, 'Fruit drop', 'Young fruits that fall early');
        const tx = W - (port ? 104 : 230), twig = (y) => `<path d="M${tx} ${y}C${tx + 40} ${y - 8} ${tx + 80} ${y + 6} ${tx + (port ? 92 : 150)} ${y - 4}" style="fill:none;stroke:${C.bark ?? ART_INK};stroke-width:5;stroke-linecap:round"/>`;
        const apple = (x, y, r = 11) => `<path d="M${x} ${y - r - 8}L${x} ${y - r + 3}" style="fill:none;stroke:${ART_INK};stroke-width:2"/><circle cx="${x}" cy="${y}" r="${r}" style="fill:${C.tomato};stroke:${ART_INK};stroke-width:2"/><path d="M${x - r * 0.5} ${y - r * 0.2}A${r * 0.6} ${r * 0.6} 0 0 1 ${x - r * 0.05} ${y - r * 0.6}" style="fill:none;stroke:var(--sim-bg-surface);stroke-width:2;stroke-linecap:round"/>`;
        a += twig(y0 - 8) + [0.2, 0.55, 0.9].map((u) => apple(tx + (port ? 92 : 150) * u, y0 + 18)).join('');
        a += twig(y0 + gap - 8) + `<path d="M${tx + 44} ${y0 + gap}L${tx + 44} ${y0 + gap + 34}" style="fill:none;stroke:${ART_INK};stroke-width:2.5;stroke-dasharray:3 7;stroke-linecap:round"/>` + apple(tx + 44, y0 + gap + 42, 9);
      }
      if (b === 2) {
        const base = H - 58, max = base - ty - 36, u = max / 40, w = port ? 54 : 74;
        [['Fruit set', 'set'], ['Fruit drop', 'drop']].forEach(([name, key], g) => {
          const gx = (g + 0.5) * W / 2;
          a += words(gx, H - 12, name, { size: 18, ink: 'var(--sim-label)' });
          ['A', 'B'].forEach((k, i) => {
            const v = DATA[k][key], x = gx + (i - 0.5) * (w + 16), h = Math.min(v, 40) * u * (key === 'drop' ? 1 : 1);
            a += `<rect class="sv-grow" x="${x - w / 2}" y="${base - h}" width="${w}" height="${h}" rx="6" style="fill:var(--sim-series-${i ? 3 : 2});stroke:${ART_INK};stroke-width:2.5;--d:${0.1 * i}s"/>`;
            a += words(x, base - h - 6, `${v}%`, { size: 19, display: true, ink: 'var(--sim-label)' }) + words(x, base + 20, k, { size: 16, ink: 'var(--sim-label)' });
          });
        });
      } else if (b === 3) {
        a += words(W / 2, ty + 24, 'Suppose 200 branches (made-up number)', { size: port ? 15 : 17, ink: 'var(--sim-label)' });
        ['A', 'B'].forEach((k, i) => {
          const d = DATA[k], x = cols[i], y = ty + 46, cw = port ? 14.4 : 13.5;
          a += words(x, y, `Set ${d.sets}, drop about ${d.fell}`, { size: port ? 14 : 16, ink: 'var(--sim-label)' });
          a += words(x, y + 36, `about ${d.kept} fruits`, { size: port ? 19 : 30, display: true, ink: 'var(--sim-label)' });
          const y2 = y + 50, x0 = x - 4.5 * cw;
          for (let n = 0; n < d.kept; n++) a += `<circle cx="${x0 + (n % 10) * cw}" cy="${y2 + Math.floor(n / 10) * cw}" r="${cw * 0.42}" style="fill:${C.tomato};stroke:${ART_INK};stroke-width:1.5"/>`;
        });
      }
    }
    return { svg: frame(st, 'ao', a) };
  }
}
