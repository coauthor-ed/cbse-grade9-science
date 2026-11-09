// PollinatorFieldScene - L05 blk-l05-s02 (setup) and s03 (6 beats). Step 0: a bare field. Step 1: square areas show pollen for one seed.
// Step 2: maize, wind, feathery stigma. Step 3: most wind-blown grains land elsewhere. Step 4: water plants and a current. Step 5: a bee
// and a sunflower, hibiscus. Step 6: coral tree with a sunbird and an Indian white-eye.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { label, words, ART_INK, svgPlantColour as P, blend as B, stroke } from '../shared/PlantArt.js';
import { frame, leader, contact, phoneMin, maizePlant, sunflower, hibiscus, coralSpray, vallisneria, bee, sunbird, whiteEye, butterfly, pollenGrain, backdrop } from '../shared/FlowerArt.js';

const rnd = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const big = (x, y, t, o = {}) => words(x, y, t, { size: 30, display: true, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 7, ...o });
const wind = (x, y, l) => `<path d="M${x} ${y}c${l * 0.3} -14 ${l * 0.6} 14 ${l} 0" ${stroke(P(B('cloud', 'ice', 0.5)), 5)}/>`;

export class PollinatorFieldScene extends SvgScene {
  static BEAT_STEP_MAP = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }], [{ idx: 4 }], [{ idx: 5 }], [{ idx: 6 }]];
  static BEAT_MAPS = { 1: [[{ idx: 0 }]], 6: [[{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }], [{ idx: 4 }], [{ idx: 5 }], [{ idx: 6 }]] };
  static get MIN_SCALE() { return phoneMin(); }
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 476;
  static ARIA_LABEL = 'A field. Squares compare the pollen used for one seed by a wind-pollinated grass and an insect-pollinated plant. Then maize in wind, water plants in a current, a bee on a sunflower, and birds on a coral tree.';
  static CONTROLS = [];
  // The setup is capped at the card's height on a phone: no root padding, so it takes the same 350x400 design as the other setups (274 wide).
  css() { return this.hostRole === 'setup' ? '.sim-dom-root--portrait.svs { padding: 0; }' : ''; }
  onBeatChange(b, n) { if (this.hostRole === 'setup') super.onBeatChange(0, 1); else super.onBeatChange(b, n); }
  stageHeight(st) { return st.portrait ? (this.hostRole === 'setup' ? 400 : 450) : 410; }

  paint(st) {
    const W = st.W, H = st.H, port = st.portrait, b = this.stepIndex, fl = H - 44;
    const a = [];
    if (b === 4) {
      a.push(backdrop('pond', W, H, { floor: fl }));
      const s = port ? 1 : 1.08;
      a.push(vallisneria(W * 0.24, fl + 4, s), vallisneria(W * 0.76, fl + 4, s * 0.94));
      const r = rnd(11);
      for (let i = 0; i < 4; i++) { const y = 120 + i * 70; a.push(`<path d="M${W * 0.08} ${y}c${W * 0.14} -18 ${W * 0.28} 18 ${W * 0.42} 0s${W * 0.28} 18 ${W * 0.42} 0" ${stroke(P(B('cloud', 'seaShallow', 0.4)), 4, 'opacity:0.7')}/>`); }
      for (let i = 0; i < 12; i++) a.push(pollenGrain(W * (0.3 + r() * 0.42), 110 + r() * 200, 0.62, {}));
      a.push(label(W / 2, 36, 'Currents carry the pollen', { size: 18 }));
      return { svg: frame(st, 'pf', a.join('')) };
    }
    a.push(b === 5 ? backdrop('meadow', W, H, { floor: fl - 20, seed: 3 }) : b === 6 ? backdrop('meadow', W, H, { floor: fl, seed: 8 }) : backdrop('farm', W, H, { floor: fl }));
    if (b === 0) {
            a.push(maizePlant(W * 0.26, fl + 4, port ? 1 : 1.1, {}), sunflower(W * 0.74, fl + 4, port ? 1.2 : 1.45, {}));
      a.push(label(W * 0.26, H - 12, 'Maize', { size: 17 }), label(W * 0.74, H - 12, 'Sunflower', { size: 17 }));
    }
    if (b === 1) {
      const cols = port ? [W * 0.5, W * 0.5] : [W * 0.3, W * 0.74];
      const side = port ? 198 : 258, tiny = Math.max(10, side / 17);
      if (port) {
        a.push(`<rect x="${W / 2 - side / 2}" y="58" width="${side}" height="${side}" rx="8" style="fill:${P('yellow')};stroke:${ART_INK};stroke-width:3"/>`);
        a.push(`<rect x="${W / 2 - tiny / 2}" y="330" width="${tiny}" height="${tiny}" rx="2" style="fill:${P('yellow')};stroke:${ART_INK};stroke-width:2"/>`);
        a.push(big(W / 2, 40, 'Grass', { size: 22 }), big(W / 2, 170, '2,500 to', { size: 26 }), big(W / 2, 204, '20,000', { size: 26 }), big(W / 2, 318, 'Insect-pollinated plant: 20 to 50', { size: 17 }));
        a.push(label(W / 2, 372, 'Pollen grains for one seed', { size: 16 }), label(W / 2, 394, 'Squares are rough, not exact', { size: 14 }));
      } else {
        const y0 = 74;
        a.push(`<rect x="${cols[0] - side / 2}" y="${y0}" width="${side}" height="${side}" rx="8" style="fill:${P('yellow')};stroke:${ART_INK};stroke-width:3"/>`);
        a.push(`<rect x="${cols[1] - tiny / 2}" y="${y0 + side - tiny}" width="${tiny}" height="${tiny}" rx="2" style="fill:${P('yellow')};stroke:${ART_INK};stroke-width:2"/>`);
        a.push(big(cols[0], 52, 'Wind-pollinated grass', { size: 20 }), big(cols[1], 52, 'Insect-pollinated', { size: 20 }));
        a.push(big(cols[0], y0 + side / 2 - 6, '2,500 to', { size: 30 }), big(cols[0], y0 + side / 2 + 30, '20,000', { size: 30 }), big(cols[1], y0 + side - tiny - 16, '20 to 50', { size: 30 }));
        a.push(label(cols[1], y0 + 40, 'Pollen grains', { size: 16 }), label(cols[1], y0 + 60, 'for one seed', { size: 16 }), label(cols[1], y0 + 84, 'Squares are rough', { size: 14 }));
      }
    }
    if (b === 2) {
      const s = port ? 1.06 : 1.14, x = W * (port ? 0.56 : 0.5), y = fl + 8;
      for (const [u, k, op] of [[0.1, 0.42, 0.55], [0.3, 0.5, 0.6], [0.78, 0.46, 0.55], [0.92, 0.56, 0.65]]) a.push(`<g style="opacity:${op}">${maizePlant(W * u, fl - 16, k, {})}</g>`);
      a.push(contact(x, y - 4, 80), maizePlant(x, y, s, {}));
      const r = rnd(3);
      a.push(wind(16, 56, 90), wind(30, 150, 70), wind(16, 240, 80));
      for (let i = 0; i < 26; i++) a.push(pollenGrain(x + (-150 + r() * 130) * s, y - (200 + r() * 150) * s, 0.42, {}));
      const lx = port ? 8 : 16;
      a.push(leader(lx + 150, 44, x - 6, y - 316 * s + 22), label(lx, 34, 'Light, small pollen', { size: 16, anchor: 'start' }));
      a.push(leader(lx + 100, 288, x - 58 * s, y - 112 * s), label(lx, 298, 'Long, feathery', { size: 16, anchor: 'start' }), label(lx, 322, 'stigma', { size: 16, anchor: 'start' }));
    }
    if (b === 3) {
      const s = port ? 0.7 : 0.82;
      const xs = port ? [W * 0.2, W * 0.54, W * 0.86] : [W * 0.2, W * 0.5, W * 0.8];
      xs.forEach((x, i) => a.push(`<g style="opacity:0.5">${maizePlant(x + W * 0.16, fl - 18, s * 0.6, {})}</g>`));
      xs.forEach((x, i) => a.push(contact(x, fl + 4, 60), maizePlant(x, fl + 6, s * [0.92, 1.12, 1][i], { flip: i === 2 })));
      const r = rnd(5);
      for (let i = 0; i < 90; i++) a.push(pollenGrain(r() * W, fl - 4 + r() * 34, 0.42, {}));
      for (let i = 0; i < 26; i++) a.push(pollenGrain(r() * W, 30 + r() * (fl - 110), 0.38, {}));
      a.push(label(W / 2, H - 12, 'Most grains land here and are lost', { size: 16 }));
      for (const x of xs) a.push(pollenGrain(x - 44 * s, fl - 104 * s, 0.56, {}));
      a.push(words(W / 2, 40, 'Lakhs of grains in the air', { size: 21, display: true, ink: ART_INK, halo: 'var(--sim-elev-peak)', haloW: 6 }));
    }
    if (b === 5) {
      const s = port ? 1.26 : 1.36, fx = W * (port ? 0.42 : 0.3);
      a.push(contact(fx, fl + 12, 70), sunflower(fx, fl + 12, s, {}));
      const hx = fx, hy = fl + 12 - 208 * s, bx = hx + (port ? 96 : 210), by = hy + (port ? 104 : 86), bs = port ? 1.1 : 1.7;
      a.push(bee(bx, by, bs, { flip: true }));
      for (const [dx, dy] of [[-12, 28], [4, 30], [18, 26], [-22, 18]]) a.push(pollenGrain(bx + dx * bs * 0.6, by + dy * bs * 0.6, 0.5, { spiny: true }));
      if (!port) a.push(hibiscus(W * 0.84, H - 110, 0.84, {}), butterfly(W * 0.1, 190, 0.6, { rot: -14 }));
      a.push(label(16, H - 14, 'Bright, nectar, fragrance', { size: 16, anchor: 'start' }), label(W - 14, port ? H - 74 : 34, 'Sticky or spiny pollen', { size: 16, anchor: 'end' }), label(W - 14, port ? H - 50 : 58, 'Bee drawn larger', { size: 15, anchor: 'end' }));
    }
    if (b === 6) {
      const s = port ? 1.26 : 1.6, q = W * 0.5, ttx = q - 62 * s, tty = fl + 14 - 186 * s, sb = port ? 0.78 : 1.26;
      a.push(coralSpray(q, fl + 14, s, {}));
      const wx = port ? W - 44 : q + 72 * s + 68, wy = fl + 14 - 150 * s + (port ? 96 : 40);
      a.push(sunbird(port ? 56 : ttx - 74 * sb - 8, port ? 100 : tty - 8, sb, {}), whiteEye(wx, wy, port ? 0.86 : 1.3, { flip: true }));
      a.push(label(port ? 12 : ttx - 80, port ? 34 : tty + 56, 'Sunbird', { size: 17, anchor: port ? 'start' : 'middle' }), label(port ? W - 12 : wx, wy + 46, 'Indian white-eye', { size: 16, anchor: port ? 'end' : 'middle' }), label(W / 2, H - 14, 'Coral tree', { size: 17 }));
    }
    return { svg: frame(st, 'pf', a.join('')) };
  }
}
