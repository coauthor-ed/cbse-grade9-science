import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01, cruise, lerp } from 'simulations/base/SimMotion.js';

/**
 * NetForceTugOfWarScene — companion to blk-l04-s2, iesc1-ch6 (balanced-forces
 * / unbalanced-forces / net-force-calculation). A block with two force
 * arrows pulling on it, either opposing (tug-of-war) or in the same
 * direction (pushing a car). Walks through: equal & opposite (balanced,
 * still) -> unequal & opposite (unbalanced, moves) -> the subtraction that
 * gives net force -> same-direction forces adding instead. Hands off to a
 * two-slider freeplay for opposing forces.
 */

const W = 900;
const H = 340;

const BLOCK_Y = 180;
const BLOCK_W = 90;
const BLOCK_H = 60;
const CENTER_X = W / 2;
const MAX_FORCE = 12;
const MAX_ARROW_PX = 220;
const MAX_SHIFT_PX = 90;

const ANIM_DURATION = 1.1;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-netforce-muted', '#94a3b8'],
  block:   ['--sim-netforce-block', '#e2e8f0'],
  left:    ['--sim-series-1', '#38bdf8'],
  right:   ['--sim-series-2', '#fbbf24'],
  net:     ['--sim-series-3', '#f472b6'],
};

const STEP_BALANCED = 0;
const STEP_UNBALANCED = 1;
const STEP_NET_OPP = 2;
const STEP_NET_SAME = 3;
const STEP_FREEPLAY = 4;

// left/right are each a positive magnitude; mode 'opposing' pulls left-force
// toward the left edge and right-force toward the right edge (tug of war);
// mode 'same' points both arrows rightward (pushing a stalled car together).
const CONFIG_AT_STEP = {
  [STEP_BALANCED]: { left: 6, right: 6, mode: 'opposing' },
  [STEP_UNBALANCED]: { left: 6, right: 9, mode: 'opposing' },
  [STEP_NET_OPP]: { left: 6, right: 10, mode: 'opposing' },
  [STEP_NET_SAME]: { left: 10, right: 6, mode: 'same' },
};

const STEPS = [
  { caption: 'Equal and opposite: 6 N vs. 6 N. Balanced forces — the block stays put.' },
  { caption: 'Unequal now: 6 N vs. 9 N. Unbalanced — the block slides toward the larger force.' },
  { caption: 'Net force (opposite directions) = 10 N - 6 N = 4 N, toward the 10 N side.' },
  { caption: 'Net force (same direction) = 10 N + 6 N = 16 N, in that shared direction.' },
  { caption: 'Drag both sliders and watch the net force update.' },
];

const BEAT_STEP_MAP = [
  [{ idx: STEP_BALANCED, dwellMs: null }],
  [{ idx: STEP_UNBALANCED, dwellMs: null }],
  [{ idx: STEP_NET_OPP, dwellMs: null }],
  [{ idx: STEP_NET_SAME, dwellMs: null }],
];

function netFor(left, right, mode) {
  if (mode === 'same') return { magnitude: left + right, dir: 1 };
  const diff = right - left;
  return { magnitude: Math.abs(diff), dir: diff === 0 ? 0 : diff > 0 ? 1 : -1 };
}

export class NetForceTugOfWarScene extends CanvasSimulation {
  static simId = 'net-force-tug-of-war';
  static label = { en: 'Net Force: Balanced and Unbalanced' };
  static category = 'science.force';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'Net force: balanced and unbalanced forces. A block has two force arrows pulling on it. Equal and ' +
    'opposite forces of six newtons each leave it still; unequal opposite forces of six and nine newtons ' +
    'push it toward the larger side; the net force is worked out first by subtraction for opposite forces, ' +
    'then by addition when both forces point the same way, then hands off to two sliders for free play.';

  static CONTROLS = [
    { type: 'button', id: 'explore', label: 'Try it yourself →' },
    { type: 'slider', id: 'left', label: 'Left force (N):', min: 0, max: 12, step: 1, value: 6 },
    { type: 'slider', id: 'right', label: 'Right force (N):', min: 0, max: 12, step: 1, value: 6 },
  ];

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.colors = null;
    this.stepIndex = STEP_BALANCED;
    this._stepEnterTime = 0;
    this._from = { left: 6, right: 6, mode: 'opposing' };
    this._to = { left: 6, right: 6, mode: 'opposing' };
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this.freeLeft = 6;
    this.freeRight = 6;
    this._liveRegion = null;
  }

  async setup() {
    await super.setup();
    this._canvas.setAttribute('role', 'img');
    this._canvas.setAttribute('aria-label', this.constructor.ARIA_LABEL);
    this._reloadColors();
    this._buildLiveRegion();
    this._drawInitialFrame(this._ctx);
    this._announce('Net force. Equal and opposite forces of six newtons each. The block stays put.');
  }

  destroy() {
    if (this._liveRegion) { this._liveRegion.remove(); this._liveRegion = null; }
    super.destroy();
  }

  _reloadColors() { this.colors = readSimColors(this.container, COLOR_TOKEN_MAP); }

  isControlHidden(id) {
    if (id === 'explore') return this.stepIndex !== STEP_NET_SAME;
    if (id === 'left' || id === 'right') return this.stepIndex !== STEP_FREEPLAY;
    return false;
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
    this._from = this._currentConfig();
    this._to = CONFIG_AT_STEP[i] ?? this._from;
    this.stepIndex = i;
    this._stepEnterTime = 0;
    this._announce(STEPS[i].caption);
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'explore') {
      this._jumpToStep(STEP_FREEPLAY);
    } else if (id === 'left') {
      this.freeLeft = Math.round(Math.min(MAX_FORCE, Math.max(0, Number(value))));
    } else if (id === 'right') {
      this.freeRight = Math.round(Math.min(MAX_FORCE, Math.max(0, Number(value))));
    }
  }

  _currentConfig() {
    if (this.stepIndex === STEP_FREEPLAY) return { left: this.freeLeft, right: this.freeRight, mode: 'opposing' };
    const target = CONFIG_AT_STEP[this.stepIndex];
    if (!target) return this._from;
    const p = cruise(clamp01(this._stepEnterTime / ANIM_DURATION));
    return {
      left: lerp(this._from.left, target.left, p),
      right: lerp(this._from.right, target.right, p),
      mode: p < 0.5 ? this._from.mode : target.mode,
    };
  }

  _buildLiveRegion() {
    this._liveRegion = document.createElement('div');
    this._liveRegion.setAttribute('role', 'status');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
    this.container.appendChild(this._liveRegion);
  }

  _announce(text) { if (this._liveRegion) this._liveRegion.textContent = text; }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx);
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

  _drawInitialFrame(ctx) { this._tick(ctx, 0); }

  _drawScene(ctx) {
    const c = this.colors;
    const { left, right, mode } = this._currentConfig();
    const { magnitude, dir } = netFor(left, right, mode);
    const shift = Math.min(MAX_SHIFT_PX, magnitude * (MAX_SHIFT_PX / MAX_FORCE)) * dir;
    const bx = CENTER_X + shift;

    // Ground
    ctx.save();
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, BLOCK_Y + BLOCK_H / 2 + 4);
    ctx.lineTo(W - 60, BLOCK_Y + BLOCK_H / 2 + 4);
    ctx.stroke();
    ctx.restore();

    // Block
    ctx.save();
    SimDraw.drawPanel(ctx, bx - BLOCK_W / 2, BLOCK_Y - BLOCK_H / 2, BLOCK_W, BLOCK_H, { bg: c.block, radius: 8 });
    ctx.restore();

    // Force arrows
    const leftLen = (left / MAX_FORCE) * MAX_ARROW_PX;
    const rightLen = (right / MAX_FORCE) * MAX_ARROW_PX;
    if (mode === 'opposing') {
      SimDraw.drawArrow(ctx, bx - BLOCK_W / 2, BLOCK_Y, bx - BLOCK_W / 2 - leftLen, BLOCK_Y, { color: c.left, lineWidth: 4 });
      SimDraw.drawLabel(ctx, `${left.toFixed(0)} N`, bx - BLOCK_W / 2 - leftLen / 2, BLOCK_Y - 16, { bg: c.panelBg, color: c.left });
      SimDraw.drawArrow(ctx, bx + BLOCK_W / 2, BLOCK_Y, bx + BLOCK_W / 2 + rightLen, BLOCK_Y, { color: c.right, lineWidth: 4 });
      SimDraw.drawLabel(ctx, `${right.toFixed(0)} N`, bx + BLOCK_W / 2 + rightLen / 2, BLOCK_Y - 16, { bg: c.panelBg, color: c.right });
    } else {
      SimDraw.drawArrow(ctx, bx - BLOCK_W / 2 - 10, BLOCK_Y - 12, bx - BLOCK_W / 2 - 10 + leftLen * 0.7, BLOCK_Y - 12, { color: c.left, lineWidth: 4 });
      SimDraw.drawLabel(ctx, `${left.toFixed(0)} N`, bx - BLOCK_W / 2 - 10 + (leftLen * 0.7) / 2, BLOCK_Y - 28, { bg: c.panelBg, color: c.left });
      SimDraw.drawArrow(ctx, bx - BLOCK_W / 2 - 10, BLOCK_Y + 12, bx - BLOCK_W / 2 - 10 + rightLen * 0.7, BLOCK_Y + 12, { color: c.right, lineWidth: 4 });
      SimDraw.drawLabel(ctx, `${right.toFixed(0)} N`, bx - BLOCK_W / 2 - 10 + (rightLen * 0.7) / 2, BLOCK_Y + 32, { bg: c.panelBg, color: c.right });
    }

    // Net force readout panel
    ctx.save();
    SimDraw.drawPanel(ctx, CENTER_X - 150, 30, 300, 46, { bg: c.panelBg, radius: 10, stroke: c.net, lineWidth: 1.5 });
    ctx.font = '700 15px Inter, system-ui';
    ctx.fillStyle = c.net;
    ctx.textAlign = 'center';
    const dirWord = magnitude < 0.05 ? '' : dir > 0 ? ' →' : ' ←';
    ctx.fillText(`net force = ${magnitude.toFixed(0)} N${dirWord}`, CENTER_X, 30 + 29);
    ctx.restore();

    this._drawCaption(ctx, STEPS[this.stepIndex]?.caption ?? STEPS[STEPS.length - 1].caption);
  }

  _drawCaption(ctx, caption) {
    ctx.save();
    ctx.font = '600 15px Inter, system-ui';
    ctx.fillStyle = this.colors.label;
    ctx.textAlign = 'center';
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.fillText(caption, W / 2, H - 16);
    ctx.restore();
  }
}
