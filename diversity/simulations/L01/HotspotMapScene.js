// HotspotMapScene - blk-l01-s05b, 3 beats. Beat 0: the two conditions of a hotspot, drawn. Beat 1: India from the Survey of
// India layer with four approximate hotspot areas, tags on the map. Beat 2: the same map with India's landscapes named.
// Areas are approximate and say so; they are clipped to India, so nothing is drawn of any other country. No control.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SimGeo } from 'simulations/base/SimGeo.js';
import { CREDIT_INDIA } from 'simulations/base/kit/GeoMap.js';
import { LIFE_COLOR_MAP, svgBroadLeaf } from '../shared/LifeArt.js';
import { fitBio, svgBioColour as bc } from '../shared/BioArt.js';
import { BIO_BTN_CSS, PLATE } from '../shared/BioBits.js';
import { words } from '../shared/SeaBits.js';

const one = (idx) => [{ idx, dwellMs: null }];
// Rough outlines, lon/lat: only ever seen through the India clip.
const AREAS = [
  { name: 'Himalayas', col: 'var(--sim-series-2)', ring: [[72, 37], [80, 37], [97.5, 30], [97, 26.6], [88, 26.4], [80, 28.4], [74, 32]], at: [79, 34.4] },
  { name: 'Indo-Burma', col: 'var(--sim-series-3)', ring: [[88.6, 26.2], [97.8, 26.3], [97.8, 21], [90, 21], [88.6, 24]], at: [93, 24] },
  { name: 'Western Ghats', col: 'var(--sim-series-5)', ring: [[72.6, 21.5], [75, 21.5], [78, 8], [76, 7.8], [72.8, 15]], at: [75, 14] },
  { name: 'Sundaland', col: 'var(--sim-series-6)', ring: [[92.6, 10], [94.4, 10], [94.4, 6.4], [92.6, 6.4]], at: [93.4, 8] },
];
const LANDS = [
  { name: 'Mountains', at: [78, 33], dx: 0 }, { name: 'Desert', at: [71, 27], dx: 0 }, { name: 'Rainforests', at: [93.5, 26], dx: -40 },
  { name: 'Plateaus', at: [77.5, 17], dx: 0 }, { name: 'Coastlines', at: [84.4, 14], dx: 26 },
];

export class HotspotMapScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 560; static HEIGHT = 494; static PORTRAIT_WIDTH = 350; static PORTRAIT_HEIGHT = 514;
  static COLOR_MAP = LIFE_COLOR_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'First, the two conditions of a biodiversity hotspot: many endemic species, and habitat loss shown as stumps among trees. Then a map of India with four approximate hotspot areas: Himalayas, Indo-Burma, Western Ghats and Sundaland. Last, the same map with mountains, desert, rainforests, plateaus and coastlines named.';

  _india = null; _d3 = null;

  css() { return BIO_BTN_CSS; }
  async setup() {
    await super.setup();
    try { [this._india, this._d3] = await Promise.all([SimGeo.loadLayer('india'), SimGeo.d3()]); } catch (_) { this._india = null; }
    this.repaint();
  }
  stageHeight(st) { return st.portrait ? 490 : 470; }
  _two(st) {
    // Two plates, side by side or stacked.
    const P = st.portrait, g = 12, w = P ? st.W - 12 : (st.W - 12 - g) / 2, h = P ? (st.H - 12 - g) / 2 : st.H - 12, x2 = P ? 6 : 6 + w + g, y2 = P ? 6 + h + g : 6;
    let s = PLATE(6, 6, w, h, { fill: bc({ a: 'elevLow', b: 'elevPeak', t: 0.72 }) }) + words(6 + w / 2, 36, 'Many endemic species', { size: 19, display: true, ink: bc('ink') });
    const names = ['Monkey', 'Hornbill', 'Frog', 'Butterfly', 'Leaf', 'Lizard'], c = 3, cw = (w - 24) / c, ch = (h - 60) / 2;
    names.forEach((n, i) => { s += fitBio(n, 18 + (i % c) * cw, 48 + Math.floor(i / c) * ch, cw - 12, ch - 10, { max: 1.5 }); });
    s += PLATE(x2, y2, w, h, { fill: bc({ a: 'strata1', b: 'elevPeak', t: 0.5 }) }) + words(x2 + w / 2, y2 + 30, 'Significant habitat loss', { size: 19, display: true, ink: bc('ink') });
    const gy = y2 + h - 22;
    s += `<rect x="${x2 + 10}" y="${gy}" width="${w - 20}" height="14" rx="7" style="fill:${bc('soil')}"/>`;
    s += svgBroadLeaf(x2 + w * 0.22, gy + 4, P ? 0.72 : 1.2, { seed: 4 });
    for (const u of [0.5, 0.66, 0.82]) { const x = x2 + w * u; s += `<path d="M${x - 11} ${gy + 4}L${x - 8} ${gy - 18}L${x + 8} ${gy - 18}L${x + 11} ${gy + 4}Z" style="fill:${bc('bark')}"/><ellipse cx="${x}" cy="${gy - 18}" rx="8" ry="3.6" style="fill:${bc('capLit')}"/>`; }
    return s;
  }
  _map(st) {
    if (!this._india || !this._d3) return { svg: words(st.W / 2, st.H / 2, 'Loading the map', { size: 16 }) };
    const d3 = this._d3, P = st.portrait, step = this.stepIndex, mapW = P || step === 2 ? st.W : st.W * 0.72, mapH = st.H - 8;
    const proj = d3.geoMercator().fitExtent([[18, 8], [mapW - 18, mapH - 26]], this._india), path = d3.geoPath(proj);
    const d = path(this._india), rect = `<rect width="${st.W}" height="${st.H}" rx="14" style="fill:${bc({ a: 'seaShallow', b: 'elevPeak', t: 0.62 })}"/>`;
    let s = rect + `<defs><clipPath id="hm-clip"><path d="${d}"/></clipPath></defs><path d="${d}" style="fill:${bc({ a: 'strata1', b: 'elevPeak', t: 0.42 })}"/>`;
    const tag = (xy, t, o = {}) => {
      const x = xy[0] + (o.dx ?? 0), w = t.length * 8.6 + 18;
      const cx = Math.max(w / 2 + 4, Math.min(st.W - w / 2 - 4, x));
      return `<rect x="${(cx - w / 2).toFixed(1)}" y="${(xy[1] - 12).toFixed(1)}" width="${w.toFixed(1)}" height="24" rx="11" style="fill:${bc('white')};stroke:${o.rim ?? bc('ink')};stroke-width:2"/>` + words(cx, xy[1] + 5, t, { size: 14, ink: bc('ink') });
    };
    if (step === 1) {
      s += '<g clip-path="url(#hm-clip)">';
      for (const a of AREAS) {
        let ring = [...a.ring, a.ring[0]];
        // d3 reads a ring wound the wrong way as the rest of the globe.
        if (d3.geoArea({ type: 'Polygon', coordinates: [ring] }) > 2 * Math.PI) ring = ring.slice().reverse();
        s += `<path d="${path({ type: 'Polygon', coordinates: [ring] })}" style="fill:${a.col};opacity:.8"/>`;
      }
      s += '</g>';
      // The Nicobar Islands are tiny, so a ring marks them.
      const nic = proj(AREAS[3].at);
      s += `<circle cx="${nic[0].toFixed(1)}" cy="${nic[1].toFixed(1)}" r="16" style="fill:none;stroke:${AREAS[3].col};stroke-width:3.5"/>`;
    }
    s += `<path d="${d}" style="fill:none;stroke:${bc('ink')};stroke-width:1.6;stroke-linejoin:round"/>`;
    if (step === 1) {
      AREAS.forEach((a, i) => { const q = proj(a.at); s += P ? tag([q[0], q[1] + (i === 3 ? -28 : 0)], a.name, { rim: a.col, dx: i === 3 ? -30 : 0 }) : tag([mapW + (st.W - mapW) / 2, 60 + i * 44], a.name, { rim: a.col }); });
      s += words(P ? st.W / 2 : mapW + (st.W - mapW) / 2, P ? st.H - 34 : 262, 'Approximate areas', { size: 14 });
    } else for (const l of LANDS) { const q = proj(l.at); s += tag(q, l.name, { dx: l.dx }); }
    s += words(st.W - 8, st.H - 10, CREDIT_INDIA, { size: 14, anchor: 'end', ink: bc('ink') });
    return { svg: s };
  }
  paint(st) { return this.stepIndex === 0 ? { svg: this._two(st) } : this._map(st); }
}
