// EarthwormSegmentMotionScene - L07 blk-l07-s04, 3 beats. The crawl is computed, not faked. For a body point at
// distance s behind the head: x(s, t) = Vt - s - (a/k) sin(ks - wt), so stretch = 1 + a cos(ks - wt), and thickness
// follows as 1 / sqrt(stretch). With V = a w / k a segment stands still while it is shortest and thickest, and moves
// while it is long and thin. The wave ks - wt = constant runs towards the tail, while the worm goes towards the head.
// Beat 0: Crawl (button id crawl), one gold segment to follow, pebbles fixed in the soil. Beat 1: muscles and nerve
// cord. Beat 2: the body cut open, body cavity and gut. Controls: crawl.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { one, lc, mx, ink, n1, LIFE_COLOR_MAP, frame, anim, ctlBar, fill, stroke, seaLabel, tag, flowArrow, earthwormSide, WORM_INK } from '../L06/BodyKit.js';

const N = 34, A = 0.34, OMEGA = 1.25, WAVES = 2, RUN = 7.5, MARK = 17;
const SOIL_TOP = mx(lc('soil'), lc('white'), 0.12);

export class EarthwormSegmentMotionScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 340; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'An earthworm in soil. Each part of the body turns long and thin, then short and thick. The wave runs from front to back while the worm moves forward.';
  static CONTROLS = [];
  _t0 = 0; _going = false; _found = false;

  async setup() {
    await super.setup();
    this.bar = ctlBar(this, [{ kind: 'btn', id: 'crawl', label: 'Crawl' }], () => {
      if (this.isPlaying?.()) return;
      // Each press runs one stretch of the crawl. A worm that has reached the far side starts again.
      this._t0 = this._going ? this._t0 + RUN : 0;
      if (this._t0 >= RUN * 2) this._t0 = 0;
      this._going = true;
      this.play(RUN);
      this.repaint();
      if (!this._found) { this._found = true; this.after(RUN, () => this.celebrate?.()); }
    });
    this.enter(this.stepIndex);
    this.repaint();
  }
  destroy() { this.bar?.destroy(); super.destroy(); }
  enter(step) {
    this._t0 = 0; this._going = false;
    this.bar?.show('crawl', step === 0);
  }
  stageHeight(st) { return st.portrait ? 270 : 340; }
  _body(st, T) {
    const { W, portrait: P } = st, L = P ? 196 : 360, x0 = P ? 222 : 400, h0 = P ? 15 : 22, y = st.H * 0.54;
    const k = (2 * Math.PI * WAVES) / L, V = (A * OMEGA) / k, xs = [], hs = [];
    for (let i = 0; i <= N; i++) { const s = (i / N) * L; xs.push(x0 + V * T - s - (A / k) * Math.sin(k * s - OMEGA * T)); }
    for (let i = 0; i < N; i++) { const s = ((i + 0.5) / N) * L, st2 = 1 + A * Math.cos(k * s - OMEGA * T), taper = i === 0 ? 0.74 : i >= N - 2 ? 0.8 : 1; hs.push((h0 / Math.sqrt(st2)) * taper); }
    return { xs, hs, y, V, L, h0 };
  }
  animate(st, t = 0) {
    if (this.stepIndex !== 0) return;
    const T = this._t0 + (this._going ? Math.min(t, RUN) : 0), b = this._body(st, T);
    anim(this, 'w', earthwormSide(b.xs, b.y, b.hs, { mark: MARK, band: [7, 11] }));
    const xm = (b.xs[MARK] + b.xs[MARK + 1]) / 2;
    anim(this, 'm', `<path d="M${n1(xm)} ${n1(b.y - b.h0 * 1.5 - 22)}v14" ${stroke(ink, 3)}/>` + seaLabel(n1(xm), n1(b.y - b.h0 * 1.5 - 28), 'Follow this one', { size: 15 }));
  }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex;
    let g = `<rect width="${W}" height="${H}" ${fill(lc('soil'))}/><rect width="${W}" height="${n1(H * 0.13)}" ${fill(lc('grass'))}/>`;
    for (let i = 0; i < 26; i++) g += `<circle cx="${n1((i * 97) % W)}" cy="${n1(H * 0.16 + (i * 59) % (H * 0.8))}" r="${3 + i % 4}" ${fill(lc('soilDark'), 'opacity:0.55')}/>`;
    if (step === 0) {
      for (let i = 0; i < (P ? 6 : 9); i++) { const x = 20 + i * (W - 40) / (P ? 5 : 8); g += `<ellipse cx="${n1(x)}" cy="${H - 26}" rx="13" ry="8" ${fill(lc('stone'), `stroke:${ink};stroke-width:2.5`)}/>`; }
      const y = H * 0.54;
      g += `<path d="M0 ${n1(y)}H${W}" ${stroke(SOIL_TOP, P ? 56 : 80)}/>`;
      g += `<g data-anim="w"></g><g data-anim="m"></g>`;
      g += seaLabel(W - (P ? 44 : 60), n1(H * 0.13 + 22), 'Head end', { size: 15 });
      g += flowArrow([W * 0.56, H - 62], [W * 0.68, H - 62], [W * 0.8, H - 62], lc('white'), 6) + seaLabel(W * 0.68, H - 74, 'Worm moves', { size: 15 });
      g += flowArrow([W * 0.44, H - 62], [W * 0.32, H - 62], [W * 0.2, H - 62], lc('gold'), 6) + seaLabel(W * 0.32, H - 74, 'Wave runs', { size: 15 });
    } else {
      const b = this._body(st, 0), y = b.y, n = N, h0 = b.h0 * 1.9, x1 = W - (P ? 18 : 34), x0 = P ? 18 : 34, xs = [], hs = [];
      for (let i = 0; i <= n; i++) xs.push(x1 - (x1 - x0) * i / n);
      for (let i = 0; i < n; i++) hs.push(h0 * (i === 0 ? 0.74 : i >= n - 1 ? 0.76 : 1));
      g += earthwormSide(xs, y, hs, { band: [7, 11] });
      if (step === 1) {
        g += `<path d="M${x0 + 6} ${n1(y + h0 * 0.62)}H${x1 - 12}" ${stroke(lc('gold'), 7, 'stroke-linecap:round')}/>`;
        for (let i = 2; i < n; i += 3) g += `<circle cx="${n1(xs[i])}" cy="${n1(y + h0 * 0.62)}" r="6" ${fill(lc('gold'), `stroke:${ink};stroke-width:2`)}/>`;
        for (let i = 3; i < n - 2; i += 1) { const xa = xs[i + 1] + 3, xb = xs[i] - 3; g += `<rect x="${n1(xa)}" y="${n1(y - h0 * 0.8)}" width="${n1(xb - xa)}" height="${n1(h0 * 1.1)}" rx="3" ${fill(mx(lc('red'), lc('white'), 0.28), `stroke:${WORM_INK.WORM_D};stroke-width:1.5`)}/>`; }
        g += tag(P ? W * 0.3 : W * 0.3, 26, W * 0.3, y - h0 * 0.5, 'Muscles', { line: lc('white') });
        g += tag(W * 0.66, H - 18, W * 0.66, y + h0 * 0.62, 'Nerve cord', { line: lc('white') });
      } else {
        const ih = h0 * 0.72, ax = x0 + 12, bx = x1 - 14;
        g += `<rect x="${ax}" y="${n1(y - ih)}" width="${bx - ax}" height="${n1(ih * 2)}" rx="${n1(ih * 0.7)}" ${fill(mx(lc('sea'), lc('white'), 0.42), `stroke:${WORM_INK.WORM_D};stroke-width:3`)}/>`;
        for (let i = 2; i < n - 1; i += 2) g += `<path d="M${n1(xs[i])} ${n1(y - ih + 2)}V${n1(y + ih - 2)}" ${stroke(WORM_INK.WORM_D, 2.5, 'opacity:0.55')}/>`;
        g += `<path d="M${ax + 4} ${n1(y)}H${bx - 4}" ${stroke(mx(lc('red'), lc('wood'), 0.3), n1(ih * 0.62), 'stroke-linecap:round')}/>`;
        g += tag(W * 0.3, 26, W * 0.3, y - ih * 0.62, 'Body cavity', { line: lc('white') }) + tag(W * 0.66, 26, W * 0.66, y, 'Gut', { line: lc('white') });
        g += tag(W * 0.5, H - 18, W * 0.5, y + h0 * 0.86, 'Body wall', { line: lc('white') });
      }
    }
    return { svg: frame(st, 'em', g) };
  }
}
