import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawGround, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * GalileoLimitScene — companion to blk-l13-s12.
 * Three balls, three surfaces, three stopping points — carpet, tiles, ice —
 * each stop farther than the last as friction drops. Beat 4 pushes that
 * pattern to its logical limit: the track keeps going, dashed, off the
 * edge of the room, ball still rolling, because there's no more friction
 * left to stop it. This is the reasoning behind blk-l13-s1's Galileo ramp,
 * made explicit as a repeatable pattern rather than a single jump.
 */

const W = 900;
const H = 600;
const TRACK_Y = 380;
const START_X = 130;

// illustrative stop positions (not physically exact distances) — chosen so
// each stage is clearly farther than the last and the "limit" stage
// visibly runs off the right edge of the track.
const STOP_CARPET = 280;
const STOP_TILE = 460;
const STOP_ICE = 760;

const COLOR_TOKEN_MAP = {
  bgDeep:  ['--sim-bg-deep', '#0a0f1e'],
  panelBg: ['--sim-bg-surface', '#111827'],
  label:   ['--sim-label', '#e2e8f0'],
  muted:   ['--sim-label-muted', '#94a3b8'],
  shape:   ['--sim-motion-shape', FORCE_COLORS.applied],
  wedge:   ['--sim-motion-wedge', '#fbbf24'],
  good:    ['--sim-motion-good', FORCE_COLORS.netGood],
  track:   ['--sim-motion-track', '#475569'],
};

const STEPS = [
  { caption: 'Push a ball across a thick carpet. It grips hard — the ball stops almost immediately.', stopX: STOP_CARPET, kind: 'rough', showAll: false },
  { caption: 'Push it across smooth tiles instead. Less friction — it rolls noticeably farther.', stopX: STOP_TILE, kind: 'solid', showAll: false },
  { caption: 'Push it across wet ice — next to no friction. It glides almost the length of the room.', stopX: STOP_ICE, kind: 'ice', showAll: false },
  { caption: 'Every time the opposing force shrinks, the ball keeps its velocity longer and travels farther.', stopX: STOP_ICE, kind: 'ice', showAll: true },
  { caption: 'Follow the pattern to its limit: zero opposing force means the ball never stops at all.', stopX: null, kind: null, showAll: false, limit: true },
  { caption: 'No real surface is perfectly frictionless — but the pattern never breaks. That leap is Galileo\'s.', stopX: null, kind: null, showAll: true, limit: true },
];

const BEAT_STEP_MAP = STEPS.map((_, i) => [{ idx: i, dwellMs: null }]);

export class GalileoLimitScene extends CanvasSimulation {
  static simId = 'galileo-limit';
  static label = { en: 'Chasing the Pattern to Its Limit' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A ball pushed across three surfaces of decreasing friction — carpet, tiles, ice — stops progressively ' +
    'farther away each time. Following that pattern to its limit, with zero opposing force the ball never ' +
    'stops at all, its track dashed off the edge of the room.';

  constructor(container, config) {
    super(container, config);
    this.allowResume = true;
    this.stepIndex = 0;
    this._stepEnterTime = 0;
    this._lessonLinked = false;
    this._beatChain = null;
    this._beatChainPos = 0;
    this._beatChainDwell = null;
    this._liveRegion = null;
    this.colors = null;
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

  _reloadColors() { this.colors = readSimColors(this.container, COLOR_TOKEN_MAP); }

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

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = this.colors.bgDeep;
    ctx.fillRect(0, 0, W, H);
    this._drawScene(ctx, STEPS[this.stepIndex]);
  }

  _drawInitialFrame(ctx) { this._tick(ctx, 0); }

  _drawBall(ctx, x, color) {
    const c = this.colors;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, TRACK_Y - 14, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SimDraw.withAlpha(SimDraw.shade(color, -0.3), 0.9);
    ctx.beginPath();
    ctx.arc(x, TRACK_Y - 10, 14, 0, Math.PI);
    ctx.fill();
    ctx.restore();
  }

  _drawStopMarker(ctx, x, label, color) {
    const c = this.colors;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(x, TRACK_Y - 40);
    ctx.lineTo(x, TRACK_Y + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    drawLabelPill(ctx, label, x, TRACK_Y - 56, { color });
  }

  _drawScene(ctx, step) {
    const c = this.colors;

    if (step.limit) {
      drawGround(ctx, START_X, W - 40, TRACK_Y, c, { kind: 'ice', color: c.track });
      ctx.save();
      ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.5);
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(W - 40, TRACK_Y);
      ctx.lineTo(W - 10, TRACK_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.font = '700 26px Inter, system-ui';
      ctx.fillStyle = c.good;
      ctx.textAlign = 'right';
      ctx.fillText('→ ∞', W - 14, TRACK_Y - 8);
      this._drawBall(ctx, 700, c.good);
      drawLabelPill(ctx, 'zero friction: never stops', 700, TRACK_Y - 56, { color: c.good });

      if (step.showAll) {
        this._drawStopMarker(ctx, STOP_CARPET, 'carpet', c.wedge);
        this._drawStopMarker(ctx, STOP_TILE, 'tiles', c.shape);
      }
    } else {
      drawGround(ctx, START_X, W - 60, TRACK_Y, c, { kind: step.kind, color: c.track });
      this._drawBall(ctx, step.stopX, step.kind === 'ice' ? c.good : (step.kind === 'solid' ? c.shape : c.wedge));

      if (step.showAll) {
        this._drawStopMarker(ctx, STOP_CARPET, 'carpet', c.wedge);
        this._drawStopMarker(ctx, STOP_TILE, 'tiles', c.shape);
        this._drawStopMarker(ctx, STOP_ICE, 'ice', c.good);
      } else {
        const labels = { rough: 'carpet: stops fast', solid: 'tiles: rolls farther', ice: 'ice: barely slows' };
        drawLabelPill(ctx, labels[step.kind], step.stopX, TRACK_Y - 56, { color: c.label });
      }
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
    wrapText(ctx, caption, W / 2 - 330, 540, 660, 24, 'center');
    ctx.restore();
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

  _announce(text) { if (this._liveRegion) this._liveRegion.textContent = text; }
  _announceStep() { this._announce(STEPS[this.stepIndex].caption); }
}
