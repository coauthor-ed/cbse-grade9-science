// TwinOrganellesScene - blk-l07-n03. Beat 0: a mitochondrion and a chloroplast side by side; two membranes, DNA, ribosomes
// named. Beat 1: a bacterium above them, the shared DNA and ribosomes lit, the rest dimmed. Beat 2: what differs: cristae
// and discs, one job each.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { PLANT_COLOR_MAP, label } from '../shared/PlantArt.js';
import { cwFrame, depthField, bacterium } from '../shared/CellWorld.js';
import { mitoHero, chloroHero } from './OrganelleHero.js';

const one = (idx) => [{ idx, dwellMs: null }];

export class TwinOrganellesScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static WIDTH = 640;
  static HEIGHT = 420;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 450;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static MIN_SCALE = 0.85;
  static ARIA_LABEL = 'A mitochondrion and a chloroplast cut open side by side, each with two membranes, its own DNA and its own ribosomes. A bacterium appears above them with its DNA and ribosomes lit. Then the differences are named: folded cristae and a job of releasing energy, discs and a job of making food.';
  static CONTROLS = [];

  css() { return '.svs { padding: 6px; } .sim-dom-root--portrait.svs { padding: 2px 0; }'; }
  stageHeight(st) { return st.portrait ? 430 : 400; }

  paint(st) {
    const W = st.W, H = st.H, P = st.portrait, step = this.stepIndex;
    let s = depthField(W, H, { tone: 'blue', seed: 31 });
    const shared = step === 1 ? (n) => (n === 'dna' || n === 'ribo' ? 1 : 0.28) : step === 2 ? (n) => (n === 'inner' || n === 'discs' ? 1 : n === 'dna' || n === 'ribo' ? 0.3 : 0.5) : () => 1;
    const hy = step === 1 ? (P ? 118 : 112) : 0;
    const rx = P ? 124 : 146, ry = P ? (step === 1 ? 56 : 70) : (step === 1 ? 84 : 100);
    const ax = P ? W / 2 : W * 0.26, ay = P ? (step === 1 ? 212 : 118) : H * 0.5 + hy * 0.72, bx = P ? W / 2 : W * 0.74, by = P ? (step === 1 ? 348 : 318) : H * 0.5 + hy * 0.72;
    s += mitoHero(ax, ay, rx, ry, { dim: shared, rot: -4 }) + chloroHero(bx, by, rx, ry, { dim: shared, rot: 5 });
    const fs = P ? 15 : 17;
    if (step === 1) {
      s += bacterium(W / 2 - 24, P ? 66 : 96, P ? 0.82 : 1.3, { part: (n) => (n === 'nucleus' || n === 'ribosome' ? 1 : 0.42) });
      s += label(W / 2, P ? 20 : 26, 'A bacterium: DNA and ribosomes', { size: P ? 15 : 18, display: true });
    } else {
      const a = step === 0 ? 'Mitochondrion' : 'Cristae: releases energy', b = step === 0 ? 'Chloroplast' : 'Discs: makes food';
      const ya = P ? 26 : H * 0.5 - ry - 20, yb = P ? 222 : H * 0.5 - ry - 20;
      s += label(ax, ya, a, { size: fs + 2, display: true }) + label(bx, yb, b, { size: fs + 2, display: true });
      if (step === 0) s += label(W / 2, H - (P ? 12 : 18), 'Two membranes, own DNA, own ribosomes', { size: fs });
    }
    return { svg: cwFrame(st, 'to', s) };
  }
}
