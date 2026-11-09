// WormSegmentationQuestionScene - L06 blk-l06-s08, 2 beats. Beat 0: a roundworm and an earthworm one above the other,
// a smooth body and a segmented one. Beat 1: the tree with the four phyla of this part lit.
import { LifeTreeCloseScene } from '../shared/LifeTreeCloseScene.js';
import { one, lc, n1, frame, fill, seaLabel, earthwormSide, svgBioColour as bc } from './BodyKit.js';

export class WormSegmentationQuestionScene extends LifeTreeCloseScene {
  static STAGE = 6;
  static BEAT_STEP_MAP = [one(0), one(1)];
  static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'A smooth roundworm above a segmented earthworm, then the tree of life with four animal phyla lit.';
  stageHeight(st) { return this.stepIndex === 0 ? (st.portrait ? 300 : 340) : super.stageHeight(st); }
  paint(st) {
    if (this.stepIndex !== 0) return super.paint(st);
    const { W, H, portrait: P } = st, x0 = P ? 22 : 60, x1 = W - (P ? 22 : 60), y1 = H * 0.3, y2 = H * 0.72, hw = P ? 15 : 20;
    let g = `<rect width="${W}" height="${H}" ${fill(lc('soil'))}/>`;
    for (let i = 0; i < 22; i++) g += `<circle cx="${n1((i * 127) % W)}" cy="${n1((i * 83) % H)}" r="${3 + i % 4}" ${fill(lc('soilDark'), 'opacity:0.5')}/>`;
    g += `<rect x="${x0}" y="${y1 - hw}" width="${x1 - x0}" height="${hw * 2}" rx="${hw}" ${fill(bc('round'), `stroke:${bc('roundDark')};stroke-width:4`)}/><rect x="${x0 + 18}" y="${y1 - hw * 0.62}" width="${x1 - x0 - 36}" height="${hw * 0.3}" rx="3" ${fill(bc('roundLit'), 'opacity:0.8')}/>`;
    const n = 30, xs = [], hs = [];
    for (let i = 0; i <= n; i++) xs.push(x1 - (x1 - x0) * i / n);
    for (let i = 0; i < n; i++) hs.push(hw * (i === 0 ? 0.8 : 1));
    g += earthwormSide(xs, y2, hs);
    g += seaLabel(W / 2, y1 - hw - 16, 'Roundworm: smooth body', { size: P ? 17 : 19 }) + seaLabel(W / 2, y2 - hw - 16, 'Earthworm: repeated segments', { size: P ? 17 : 19 });
    return { svg: frame(st, 'ws', g) };
  }
}
