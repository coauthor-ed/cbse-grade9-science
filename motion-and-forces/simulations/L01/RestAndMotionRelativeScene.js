import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';

/**
 * RestAndMotionRelativeScene — companion to blk-l01-s3 (POE explain).
 * The same school building is measured twice, once from the road and once from
 * the Sun. Against the road its position never changes (at rest); against the
 * Sun the Earth has carried it along (in motion). Both are true at once, which
 * is why a description must name its reference point.
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
  bad:      ['--sim-motion-bad', '#f87171'],
};

const STEPS = [
  { caption: 'Measure the school’s position twice, relative to the road. It does not change → the school is at rest, relative to the road.' },
  { caption: 'Measure from the Sun instead. The Earth has carried the school far between the same two instants → in motion, relative to the Sun.' },
  { caption: 'Same object, two true answers. "Moving" always means "moving relative to something."' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
];

const ROAD_Y = 300;
const SCHOOL_X = 190;
const SCHOOL_W = 90;
const SCHOOL_H = 150;

export class RestAndMotionRelativeScene extends CanvasSimulation {
  static simId = 'rest-and-motion-relative';
  static label = { en: 'Rest and motion are relative to a reference point' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'A school building is measured twice. Relative to the road it stays in the same place, so it is at rest. ' +
    'Relative to the Sun, the Earth carries the school forward, so it is in motion. The same object is both at ' +
    'rest and in motion, depending on the reference point.';

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
    this._orbitAngle = 0;
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
    this._orbitAngle += dt * 0.5;
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

  _drawScene(ctx, step) {
    const c = this.colors;
    this._drawRoadPanel(ctx);
    this._drawSunPanel(ctx);
    this._drawCaption(ctx, step.caption);
  }

  _drawRoadPanel(ctx) {
    const c = this.colors;
    const active = this.stepIndex === 0 || this.stepIndex === 2;
    ctx.save();
    SimDraw.drawPanel(ctx, 40, 80, 400, 400, { bg: c.panelBg, radius: 12, stroke: active ? c.good : SimDraw.withAlpha(c.muted, 0.35), lineWidth: 2 });
    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.6);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(70, ROAD_Y + 60);
    ctx.lineTo(410, ROAD_Y + 60);
    ctx.stroke();
    this._drawSchool(ctx, SCHOOL_X, ROAD_Y - SCHOOL_H + 60, c.shape);

    ctx.font = '700 15px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = c.label;
    ctx.fillText('Measured from the road', 240, 110);
    ctx.fillStyle = c.muted;
    ctx.font = '600 13px Inter, system-ui';
    ctx.fillText('t = 0 s: school at 0 m', 240, 340);
    ctx.fillText('t = 10 s: school at 0 m', 240, 366);
    if (active) {
      ctx.fillStyle = c.good;
      ctx.font = '700 16px Inter, system-ui';
      ctx.fillText('position unchanged → AT REST', 240, 424);
    }
    ctx.restore();
  }

  _drawSunPanel(ctx) {
    const c = this.colors;
    const active = this.stepIndex >= 1;
    const cx = 660, cy = 280, R = 120;
    const a0 = -Math.PI / 2;
    const a1 = a0 + 0.55;
    const earth0 = { x: cx + R * Math.cos(a0), y: cy + R * Math.sin(a0) };
    const earth1 = { x: cx + R * Math.cos(a1), y: cy + R * Math.sin(a1) };
    const moving = this._orbitAngle;

    ctx.save();
    SimDraw.drawPanel(ctx, 460, 80, 400, 400, { bg: c.panelBg, radius: 12, stroke: active ? c.wedge : SimDraw.withAlpha(c.muted, 0.35), lineWidth: 2 });

    ctx.strokeStyle = SimDraw.withAlpha(c.muted, 0.35);
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sun
    ctx.fillStyle = c.wedge;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '700 14px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = c.wedge;
    ctx.fillText('Sun', cx, cy + 46);

    // Earth at two instants
    const ea = this.stepIndex >= 1 ? a1 : a0;
    const earthPos = {
      x: cx + R * Math.cos(ea + moving * 0.0),
      y: cy + R * Math.sin(ea + moving * 0.0),
    };
    ctx.fillStyle = c.shape;
    ctx.beginPath();
    ctx.arc(earthPos.x, earthPos.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.label;
    ctx.font = '600 12px Inter, system-ui';
    ctx.fillText('Earth', earthPos.x, earthPos.y - 24);

    if (this.stepIndex >= 1) {
      ctx.strokeStyle = c.shape;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, a0, a1);
      ctx.stroke();
      ctx.fillStyle = c.muted;
      ctx.fillText('t = 0 s', earth0.x, earth0.y - 24);
      ctx.fillText('t = 10 s', earth1.x, earth1.y - 24);
    }

    ctx.font = '700 15px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = c.label;
    ctx.fillText('Measured from the Sun', 660, 110);
    if (this.stepIndex >= 1) {
      ctx.fillStyle = c.wedge;
      ctx.font = '700 16px Inter, system-ui';
      ctx.fillText('position changed → IN MOTION', 660, 424);
    }
    ctx.restore();
  }

  _drawSchool(ctx, x, y, color) {
    ctx.save();
    ctx.fillStyle = SimDraw.withAlpha(color, 0.85);
    ctx.fillRect(x, y, SCHOOL_W, SCHOOL_H);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x + SCHOOL_W / 2, y - 56);
    ctx.lineTo(x + SCHOOL_W + 16, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = this.colors.panelBg;
    ctx.fillRect(x + SCHOOL_W / 2 - 14, y + SCHOOL_H / 2, 28, SCHOOL_H / 2);
    ctx.restore();
  }

  _drawCaption(ctx, caption) {
    const c = this.colors;
    ctx.save();
    ctx.globalAlpha = clamp01(this._stepEnterTime / 0.4);
    ctx.font = '600 16px Inter, system-ui';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center';
    this._wrapText(ctx, caption, W / 2 - 330, 520, 660, 24, 'center');
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