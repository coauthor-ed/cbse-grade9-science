import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, lerp } from 'simulations/base/SimMotion.js';

/**
 * PolygonToCircleScene — companion to blk-l08-s4 (Fig 4.23).
 * An athlete runs closed tracks at uniform speed: a rectangle (4 direction
 * changes per round), a hexagon (6), and finally a circle where the direction
 * changes continuously. Changing direction at constant speed is acceleration.
 */

const W = 900;
const H = 600;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  shape:    ['--sim-motion-shape', '#38bdf8'],
  wedge:    ['--sim-motion-wedge', '#fbbf24'],
  good:     ['--sim-motion-good', '#34d399'],
};

const STEPS = [
  { caption: 'An athlete runs a rectangular track at uniform speed — she changes direction 4 times per round.' },
  { caption: 'On a hexagonal track, she changes direction 6 times per round.' },
  { caption: 'More and more sides… the track approaches a circle, and the direction changes continuously.' },
  { caption: 'Changing direction is a change in velocity — so uniform circular motion is accelerated motion.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

export class PolygonToCircleScene extends CanvasSimulation {
  static simId = 'polygon-to-circle';
  static label = { en: 'From polygon to circle: direction keeps changing' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'An athlete runs closed tracks at uniform speed. On a rectangle she changes direction four times per ' +
    'round, on a hexagon six times. As the number of sides grows the track becomes a circle, where the ' +
    'direction of motion changes continuously. Changing direction at constant speed means accelerated motion.';

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.colors = null;
    this.stepIndex = 0;
    this._stepEnterTime = 0;
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this._liveRegion = null;
  }

  async setup() {
    await super.setup();
    this._canvas.setAttribute('role', 'img');
    this._canvas.setAttribute('aria-label', this.constructor.ARIA_LABEL);
    this._canvas.tabIndex = 0;
    this._reloadColors();
    this._buildLiveRegion();
    this._drawInitialFrame(this._ctx);
    this._announce(STEPS[0].caption);
  }

  destroy() {
    if (this._liveRegion) { this._liveRegion.remove(); this._liveRegion = null; }
    super.destroy();
  }

  _reloadColors() {
    this.colors = readSimColors(this.container, COLOR_TOKEN_MAP);
  }

  onBeatChange(beatIndex) {
    this._lessonLinked = true;
    const clamped = Math.max(0, Math.min(beatIndex, BEAT_STEP_MAP.length - 1));
    const chain = BEAT_STEP_MAP[clamped];
    this._beatChain = chain;
    this._beatChainPos = 0;
    this._beatChainDwell = chain[0].dwellMs != null ? chain[0].dwellMs / 1000 : null;
    this._jumpToStep(chain[0].idx);
  }

  _jumpToStep(i) {
    this.stepIndex = Math.max(0, Math.min(STEPS.length - 1, i));
    this._stepEnterTime = 0;
    this._announceStep();
    this.requestUiUpdate?.();
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx, STEPS[this.stepIndex]);
  }

  _tickBeatChain(dt) {
    if (!this._lessonLinked || this._beatChainDwell == null) return;
    this._beatChainDwell -= dt;
    if (this._beatChainDwell > 0) return;
    this._beatChainPos++;
    const next = this._beatChain?.[this._beatChainPos];
    if (!next) { this._beatChainDwell = null; return; }
    this._jumpToStep(next.idx);
    this._beatChainDwell = next.dwellMs != null ? next.dwellMs / 1000 : null;
  }

  _drawInitialFrame(ctx) {
    this._tick(ctx, 0);
  }

  _vertices(sides, cx, cy, r, rot) {
    const out = [];
    for (let i = 0; i < sides; i++) {
      const a = rot + (i / sides) * Math.PI * 2;
      out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    return out;
  }

  _drawScene(ctx, step) {
    const c = this.colors;
    const cx = 420, cy = 320, r = 210;

    let sides, rot = -Math.PI / 2;
    if (this.stepIndex === 0) sides = 4;
    else if (this.stepIndex === 1) sides = 6;
    else if (this.stepIndex === 2) sides = 8 + Math.floor((this._stepEnterTime % 6) / 6 * 40); // morph 8..48
    else sides = 40;

    const pts = this._vertices(sides, cx, cy, r, rot);
    ctx.save();
    ctx.strokeStyle = c.shape;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // velocity arrows tangent at each vertex
    ctx.save();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const nxt = pts[(i + 1) % pts.length];
      const ang = Math.atan2(nxt.y - p.y, nxt.x - p.x);
      const ax = p.x + 26 * Math.cos(ang);
      const ay = p.y + 26 * Math.sin(ang);
      ctx.strokeStyle = c.wedge;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(ax, ay);
      ctx.stroke();
      ctx.fillStyle = c.wedge;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 8 * Math.cos(ang - 0.4), ay - 8 * Math.sin(ang - 0.4));
      ctx.lineTo(ax - 8 * Math.cos(ang + 0.4), ay - 8 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    if (this.stepIndex === 0) {
      ctx.fillStyle = c.label;
      ctx.font = '700 15px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('rectangle: 4 direction changes', cx, cy - 20);
    } else if (this.stepIndex === 1) {
      ctx.fillStyle = c.label;
      ctx.font = '700 15px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('hexagon: 6 direction changes', cx, cy - 20);
    } else if (this.stepIndex >= 2) {
      ctx.fillStyle = c.wedge;
      ctx.font = '700 15px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('many sides → circle: direction changes continuously', cx, cy - 20);
    }

    if (this.stepIndex === 3) {
      SimDraw.drawPanel(ctx, cx - 260, 500, 520, 60, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.textAlign = 'center';
      ctx.font = '700 15px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.fillText('constant speed, changing direction → accelerated motion', cx, 536);
    }

    this._drawCaption(ctx, step.caption);
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    this._wrapText(ctx, caption, W / 2 - 330, 585, 660, 24, 'center');
    ctx.restore();
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'left') {
    const prev = ctx.textAlign;
    ctx.textAlign = align;
    const words = text.split(' ');
    let line = '';
    let cy = y;
    const drawX = align === 'center' ? x + maxWidth / 2 : x;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, drawX, cy);
        line = word;
        cy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, drawX, cy);
    ctx.textAlign = prev;
  }

  _buildLiveRegion() {
    this._liveRegion = document.createElement('div');
    this._liveRegion.setAttribute('role', 'status');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;' +
      'overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    this.container.appendChild(this._liveRegion);
  }

  _announce(text) {
    if (this._liveRegion) this._liveRegion.textContent = text;
  }

  _announceStep() {
    this._announce(STEPS[this.stepIndex].caption);
  }
}