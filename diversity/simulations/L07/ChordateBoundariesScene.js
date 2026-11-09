// ChordateBoundariesScene - L07 blk-l07-s09, 3 beats. Beat 0: Amphioxus keeps its notochord; in a vertebrate the
// vertebrae form in the rod's place and the rod does not turn to bone. Beat 1: three questions asked of a starfish,
// Amphioxus and a fish. Beat 2: the tree with the phyla of these two parts lit.
import { LifeTreeCloseScene } from '../shared/LifeTreeCloseScene.js';
import { svgFish } from '../shared/LifeArt.js';
import { one, lc, mx, ink, n1, frame, anim, fill, stroke, words, tag, tick, cross, svgBio, BOX, amphioxus } from '../L06/BodyKit.js';

const ROWS = [['Hard parts inside', [1, 0, 1]], ['Notochord', [0, 1, 1]], ['Backbone', [0, 0, 1]]];
const NAMES = ['Starfish', 'Amphioxus', 'Fish'];

function panel(x, y, w, h, title, sub) {
  return `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="16" ${fill(lc('white'), `stroke:${ink};stroke-width:3.5`)}/>` + words(n1(x + w / 2), n1(y + 28), title, { size: 18, display: true, ink }) + words(n1(x + w / 2), n1(y + h - 10), sub, { size: 16, ink });
}
function vertebrate(x, y, L, k) {
  // body outline, with the rod fading and the vertebrae growing along the same line as k goes 0 to 1
  const hh = L * 0.12, skin = mx(lc('sea'), lc('white'), 0.6), rim = mx(lc('sea'), lc('seaDeep'), 0.7);
  let g = `<path d="M${n1(x - L / 2)} ${y}Q${n1(x - L * 0.2)} ${n1(y - hh)} ${n1(x + L * 0.2)} ${n1(y - hh)}Q${n1(x + L * 0.46)} ${n1(y - hh * 0.7)} ${n1(x + L / 2)} ${y}Q${n1(x + L * 0.46)} ${n1(y + hh * 0.7)} ${n1(x + L * 0.2)} ${n1(y + hh)}Q${n1(x - L * 0.2)} ${n1(y + hh)} ${n1(x - L / 2)} ${y}Z" ${fill(skin, `stroke:${rim};stroke-width:4`)}/>`;
  g += `<path d="M${n1(x - L * 0.42)} ${y}H${n1(x + L * 0.4)}" ${stroke(lc('red'), 7, `stroke-linecap:round;opacity:${n1(1 - 0.85 * k)}`)}/>`;
  const n = 14;
  for (let i = 0; i < n; i++) { const px = x - L * 0.42 + (i + 0.5) * (L * 0.82 / n), w = (L * 0.82 / n) * 0.8, h = 22 * k; if (k > 0.02) g += `<rect x="${n1(px - w / 2)}" y="${n1(y - h / 2)}" width="${n1(w)}" height="${n1(h)}" rx="3" ${fill(lc('white'), `stroke:${ink};stroke-width:2.5`)}/>`; }
  return g;
}

export class ChordateBoundariesScene extends LifeTreeCloseScene {
  static STAGE = 7;
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'Amphioxus keeps a flexible rod, while in a vertebrate a backbone forms in its place. Then a table of hard parts, notochord and backbone for a starfish, Amphioxus and a fish. Then the tree of life.';
  enter(step) { if (step === 0) this.play?.(4); }
  stageHeight(st) { return this.stepIndex === 2 ? super.stageHeight(st) : st.portrait ? 340 : (this.stepIndex ? 380 : 300); }
  animate(st, t = 0) {
    if (this.stepIndex !== 0) return;
    const b = this._box(st), k = Math.max(0, Math.min(1, (t - 0.6) / 2.4));
    anim(this, 'v', vertebrate(b.x2 + b.w / 2, b.y + b.h / 2, b.w - 30, k));
  }
  _box(st) {
    const { W, H, portrait: P } = st, m = 12, gap = 10;
    if (P) { const h = (H - 2 * m - gap) / 2; return { x1: m, x2: m, y: m + h + gap, y1: m, w: W - 2 * m, h }; }
    const w = (W - 2 * m - gap) / 2; return { x1: m, x2: m + w + gap, y: m, y1: m, w, h: H - 2 * m };
  }
  paint(st) {
    if (this.stepIndex === 2) return super.paint(st);
    const { W, H, portrait: P } = st, step = this.stepIndex;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sand'), lc('white'), 0.6))}/>`;
    if (step === 0) {
      const b = this._box(st);
      g += panel(b.x1, b.y1, b.w, b.h, 'Protochordate', 'The notochord stays, no backbone');
      g += amphioxus(b.x1 + b.w / 2, b.y1 + b.h / 2 + 2, b.w - 30);
      g += panel(b.x2, b.y, b.w, b.h, 'Vertebrate', 'A backbone forms in its place');
      g += `<g data-anim="v"></g>`;
      g += tag(b.x1 + b.w / 2, b.y1 + b.h / 2 + 44, b.x1 + b.w / 2, b.y1 + b.h / 2, 'Notochord', { size: 15 }) + tag(b.x2 + b.w / 2, b.y + b.h / 2 + 44, b.x2 + b.w / 2, b.y + b.h / 2 + 6, 'Vertebrae', { size: 15 });
    } else {
      const lw = P ? 0 : 170, m = 12, cw = (W - lw - 2 * m) / 3, artH = P ? 90 : 124, top = 10, bandTop = top + artH + 14, rh = P ? (H - bandTop - 8) / 3 : (H - artH - top - 16) / 3;
      NAMES.forEach((t, c) => {
        const x = m + lw + c * cw, ax = x + cw / 2, ay = top + (artH - 24) / 2 + 4, aw = cw - 18;
        g += `<rect x="${n1(x + 4)}" y="${top}" width="${n1(cw - 8)}" height="${P ? artH + 8 : H - top - 10}" rx="16" ${fill(lc('white'), `stroke:${ink};stroke-width:3.5`)}/>`;
        if (t === 'Fish') g += svgFish(n1(ax), n1(ay), aw / 66, {});
        else if (t === 'Amphioxus') g += amphioxus(ax, ay, aw);
        else { const [bx, by, bw, bh] = BOX.Starfish, k = Math.min(aw / bw, (artH - 34) / bh); g += svgBio('Starfish', ax - (bx + bw / 2) * k, ay - (by + bh / 2) * k, k); }
        g += words(n1(ax), top + artH - 2, t, { size: P ? 15 : 18, display: true, ink });
      });
      ROWS.forEach(([t, v], r) => {
        // On a phone each row is a band across the page, so a row name crosses no column.
        const y = P ? bandTop + r * rh : top + artH + 22 + r * rh * 0.96;
        if (P) g += `<rect x="${m + 4}" y="${n1(y)}" width="${n1(W - 2 * m - 8)}" height="${n1(rh - 6)}" rx="12" ${fill(lc('white'), `stroke:${ink};stroke-width:2.5`)}/>` + words(m + 16, n1(y + 20), t, { size: 15, ink, anchor: 'start' });
        else g += words(m + lw - 10, y + rh / 2 + 5, t, { size: 16, ink, anchor: 'end' });
        for (let c = 0; c < 3; c++) { const x = n1(m + lw + (c + 0.5) * cw), yy = n1(P ? y + rh - 24 : y + rh / 2); g += v[c] ? tick(x, yy, P ? 12 : 14) : cross(x, yy, P ? 12 : 14); }
      });
    }
    return { svg: frame(st, 'cb', g) };
  }
}
