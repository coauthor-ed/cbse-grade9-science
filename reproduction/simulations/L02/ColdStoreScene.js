// ColdStoreScene - blk-l02-s02c, new. Beat 0: the old idea, crossed out. Beat 1: spore to mould: life from life. No portrait.
// Beat 2: Keep it: a warm shelf or a refrigerator: the same slice shows mould or next to none. No times: the book gives
// none for this. Control name: Keep it (Warm shelf, Refrigerator).
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, svgPlantColour as pc, label, frame, fill, stroke, ctlBar } from '../shared/PlantArt.js';

import { tiles, bench } from '../shared/Scapes.js';
const one = (idx) => [{ idx, dwellMs: null }];
const ROTI = 'color-mix(in oklab, var(--sim-strata-1) 70%, var(--sim-strata-2))', ROTIK = 'var(--sim-strata-3)', MOULD = 'color-mix(in oklab, var(--sim-strata-5) 60%, var(--sim-elev-peak))', MK = 'var(--sim-strata-6)', COLD = 'color-mix(in oklab, var(--sim-ice) 80%, var(--sim-elev-peak))';

// A roti on a steel plate seen from a little above; mould spreads as patches of fuzz on its top.
function roti(x, y, w, mould) {
  const rx = w / 2, ry = w * 0.2;
  let s = `<ellipse cx="${x}" cy="${y + ry * 0.34}" rx="${rx * 1.18}" ry="${ry * 1.2}" style="fill:url(#pa-metal) ${pc('metal')};stroke:${pc('metalDark')};stroke-width:2.4"/><ellipse cx="${x}" cy="${y + 7}" rx="${rx}" ry="${ry}" ${fill(ROTIK)}/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" style="fill:url(#pa-tuber) ${ROTI};stroke:${ROTIK};stroke-width:2"/>`;
  for (let i = 0; i < 16; i++) { const a = i * 2.4, q = Math.sqrt((i + 0.5) / 16) * 0.86; s += `<ellipse cx="${x + Math.cos(a) * rx * q}" cy="${y + Math.sin(a) * ry * q}" rx="${w * 0.03 + (i % 3) * 2}" ry="${w * 0.011 + i % 2}" ${fill(ROTIK)} opacity=".6"/>`; }
  for (let i = 0; i < mould; i++) {
    const a = i * 2.4 + 0.6, q = Math.sqrt((i + 0.5) / mould) * 0.74, u = x + Math.cos(a) * rx * q, v = y + Math.sin(a) * ry * q, pw = w * (0.1 + (i % 3) * 0.018), ph = pw * 0.42;
    s += `<ellipse cx="${u}" cy="${v}" rx="${pw * 1.2}" ry="${ph * 1.2}" style="fill:${MOULD};opacity:.8;filter:url(#pa-soft)"/><ellipse cx="${u}" cy="${v}" rx="${pw * 0.7}" ry="${ph * 0.7}" ${fill(MK)} opacity=".3"/>`;
    for (let k = 0; k < 34; k++) { const t = k * 2.4, e = Math.sqrt((k + 0.5) / 34), px = u + Math.cos(t) * pw * e, py = v + Math.sin(t) * ph * e; s += `<path d="M${px} ${py}v-${3 + k % 4}" ${stroke(MOULD, 1)}/><circle cx="${px}" cy="${py - 3 - k % 4}" r="${1 + (k % 3) * 0.5}" ${fill(MK)}/>`; }
  }
  return s;
}

export class ColdStoreScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'The old idea that food makes life is crossed out; a spore grows into mould. Then the same food on a warm shelf grows mould, and in a refrigerator it does not.';
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.ctl = ctlBar(this, [{ kind: 'seg', id: 'place', label: 'Keep it', options: [{ value: 'warm', label: 'Warm shelf' }, { value: 'cold', label: 'Refrigerator' }], value: 'warm' }], (id, v) => { this._p = v; this.repaint(); });
    this.enter(this.stepIndex); this.repaint();
  }
  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 320 : 372; }
  enter(step) { this._p = 'warm'; if (!this.ctl) return; this.ctl.show('place', step === 2); this.ctl.set('place', 'warm'); }
  destroy() { this.ctl?.destroy(); super.destroy(); }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex, sz = P ? 17 : 21;
    let s = tiles(W, H, { size: 60 });
    if (step < 2) {
      const y1 = H * (step ? 0.3 : 0.56), y2 = H * 0.8, w = W * (step ? 0.24 : 0.34);
      s += label(W / 2, 28, 'Old idea', { size: sz, display: true }) + roti(W * 0.24, y1, w, 0);
      s += `<path d="M${W * 0.44} ${y1 + 6}H${W * 0.58}" ${stroke(pc('ink'), 6)}/><path d="M${W * 0.56} ${y1 - 6}l14 12l-14 12" ${stroke(pc('ink'), 6)}/>` + roti(W * 0.8, y1, w, 4);
      s += `<g class="sv-pop" style="--d:.2s"><path d="M${W * 0.46} ${y1 - 14}l${W * 0.1} 40M${W * 0.56} ${y1 - 14}l${-W * 0.1} 40" ${stroke(pc('red'), 8)}/></g>`;
      if (step) s += `<path d="M0 ${H * 0.49}H${W}" ${stroke(pc('pale'), 4)}/>`;
      if (step) s += label(W / 2, H * 0.56, 'Pasteur: life comes from life', { size: sz, display: true });
      if (step) s += `<circle cx="${W * 0.24}" cy="${y2 - 8}" r="12" ${fill(MK)}/><circle cx="${W * 0.16}" cy="${y2 - 34}" r="7" ${fill(MK)} opacity=".7"/>` + label(W * 0.24, y2 + 28, 'Spore', { size: 16 });
      if (step) s += `<path d="M${W * 0.36} ${y2 - 6}H${W * 0.58}" ${stroke(pc('ink'), 6)}/><path d="M${W * 0.56} ${y2 - 18}l14 12l-14 12" ${stroke(pc('ink'), 6)}/>` + roti(W * 0.8, y2 - 8, w, 4) + label(W * 0.8, y2 + 28, 'Mould', { size: 16 });
    } else {
      const warm = this._p !== 'cold', bx = W * (P ? 0.1 : 0.2), bw = W * (P ? 0.8 : 0.6), by = 58, bh = H - 74, y = by + bh * 0.58;
      s += warm ? bench(W, y - 30, H, { planks: 2 }) : `<rect x="${bx - 12}" y="${by - 12}" width="${bw + 24}" height="${bh + 24}" rx="24" style="fill:url(#pa-metal) ${pc('metal')};stroke:${pc('metalDark')};stroke-width:3"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="16" ${fill(COLD, `stroke:${pc('metalDark')};stroke-width:4`)}/><rect x="${bx}" y="${by}" width="${bw * 0.3}" height="${bh}" rx="16" style="fill:var(--sim-elev-peak);opacity:.5;filter:url(#pa-soft)"/><rect x="${bx + 8}" y="${y + 36}" width="${bw - 16}" height="8" rx="3" style="fill:url(#pa-glass);stroke:${pc('glassEdge')};stroke-width:2"/><rect x="${bx + 8}" y="${by + bh * 0.3}" width="${bw - 16}" height="8" rx="3" style="fill:url(#pa-glass);stroke:${pc('glassEdge')};stroke-width:2"/>`;
      s += `<g class="sv-pop">${roti(W / 2, y - 10, W * 0.62, warm ? 8 : 0)}</g>`;
      s += label(W / 2, 34, warm ? 'Warm: mould grows and spreads' : 'Cold: reproduction slows or stops', { size: P ? 17 : 22, display: true });
    }
    return { svg: frame(st, 'cs', s) };
  }
}
