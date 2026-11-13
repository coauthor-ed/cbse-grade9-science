import { CanvasSimulation } from 'simulations/base/CanvasSimulation.js';
import { SimDraw } from 'simulations/base/SimDrawUtils.js';
import { readSimColors } from 'simulations/base/SimTheme.js';
import { clamp01 } from 'simulations/base/SimMotion.js';
import { drawForceArrow, drawLabelPill, wrapText, FORCE_COLORS } from '../shared/PhysicsSceneKit.js';

/**
 * RocketBalloonScene — companion to blk-l15-s4 (Activity 6.7, Fig 6.29-6.30).
 *
 * Process Statement: momentum expelled one way is momentum gained the other
 * way — a balloon (or rocket) needs nothing to push against outside itself,
 * because its reaction partner is the exhaust it just expelled.
 *
 * Freeplay: an exhaust-thrust slider plus a Release button ejects a burst of
 * "expelled air" particles (each with its own outward velocity that decays
 * under drag, per the Kurzgesagt doc's ejected-particle guidance — they
 * visibly settle into a drift rather than flying forever at spawn speed)
 * while the balloon itself gains velocity from the SAME event, so the two-
 * way momentum transfer is something the student watches happen frame by
 * frame, not just a caption asserting it.
 */

const W = 900;
const H = 600;

const LINE_Y = 300;
const BALLOON_X0 = 300;

const COLOR_TOKEN_MAP = {
  bgDeep:   ['--sim-bg-deep', '#0a0f1e'],
  panelBg:  ['--sim-bg-surface', '#111827'],
  label:    ['--sim-label', '#e2e8f0'],
  muted:    ['--sim-label-muted', '#94a3b8'],
  balloon:  ['--sim-motion-wedge', '#fbbf24'],
  air:      ['--sim-force-reaction', FORCE_COLORS.reaction],
  good:     ['--sim-motion-good', FORCE_COLORS.netGood],
};

const STEPS = [
  { caption: 'Inflate a balloon, thread it onto a taut line, and let go.' },
  { caption: 'The stretched balloon pushes air out of its opening — the air rushes out one way.' },
  { caption: 'The escaping air pushes the balloon the opposite way. Action and reaction, in equal amounts.' },
  { caption: 'Set the exhaust thrust yourself, hit Release, and watch both the air and the balloon gain motion from the same event.' },
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
  [{ idx: 2, dwellMs: null }],
  [{ idx: 3, dwellMs: null }],
];

const PARTICLE_DRAG = 0.9; // per-second velocity decay

export class RocketBalloonScene extends CanvasSimulation {
  static simId = 'rocket-balloon';
  static label = { en: 'Balloon and rocket: action and reaction' };
  static category = 'science.motion';
  static WIDTH = W;
  static HEIGHT = H;
  static ARIA_LABEL =
    'An inflated balloon on a taut line. The stretched balloon pushes air out of its opening, and the escaping ' +
    'air pushes the balloon in the opposite direction — the same principle a rocket uses, exhaust pushed down, ' +
    'rocket pushed up. A freeplay thrust slider and Release button let the student trigger the same expelled-air ' +
    'burst repeatedly and watch the balloon gain velocity each time.';

  static CONTROLS = [
    { type: 'slider', id: 'thrust', label: 'Exhaust thrust:', min: 10, max: 100, step: 5, value: 60, suffix: '%' },
    { type: 'button', id: 'release', label: 'Release!' },
  ];

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

    this._thrust = 60; // %
    this._balloonX = BALLOON_X0;
    this._balloonV = 0;
    this._particles = [];
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
    if (this.stepIndex < 3) { this._balloonX = BALLOON_X0; this._balloonV = 0; this._particles = []; }
    this._announceStep();
    this.requestUiUpdate?.();
  }

  onControlChange(id, value) {
    if (id === 'thrust') {
      this._thrust = Math.round(Number(value));
    } else if (id === 'release') {
      this._emitBurst();
      this._announce(`Released at ${this._thrust} percent thrust.`);
    }
    this.requestUiUpdate?.();
  }

  isControlHidden() {
    return this.stepIndex < 3;
  }

  _emitBurst() {
    const speed = 60 + this._thrust * 2.4;
    // balloon gains velocity opposite to the exhaust — the same event, not
    // a separately-tuned animation (equal-and-opposite momentum, simplified
    // to a fixed small mass ratio so the effect is visible on screen)
    this._balloonV += speed * 0.22;
    for (let i = 0; i < 5; i++) {
      this._particles.push({
        x: this._balloonX - 40,
        y: LINE_Y + 4 + (Math.random() - 0.5) * 10,
        vx: -(speed + (Math.random() - 0.5) * 20),
        vy: (Math.random() - 0.5) * 14,
      });
    }
  }

  _tick(ctx, dt) {
    this._stepEnterTime += dt;
    this._tickBeatChain(dt);

    if (this.stepIndex === 3) {
      this._balloonX += this._balloonV * dt;
      this._balloonV = Math.max(0, this._balloonV - this._balloonV * 0.5 * dt);
      for (const p of this._particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 1 - PARTICLE_DRAG * dt;
        p.vy *= 1 - PARTICLE_DRAG * dt;
      }
      this._particles = this._particles.filter((p) => p.x > -60);
    } else if (this.stepIndex === 2) {
      this._balloonX = BALLOON_X0 + 150 * clamp01(this._stepEnterTime / 2.4);
    }

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

    ctx.strokeStyle = c.muted;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, LINE_Y);
    ctx.lineTo(W - 60, LINE_Y);
    ctx.stroke();

    // expelled-air particles (freeplay only), drawn before the balloon so
    // the balloon reads as in front of its own exhaust trail
    for (const p of this._particles) {
      ctx.fillStyle = SimDraw.withAlpha(c.air, clamp01((Math.hypot(p.vx, p.vy)) / 60));
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const p = clamp01(this._stepEnterTime / 2.4);
    const shrink = this.stepIndex === 1 || this.stepIndex === 2 ? 1 - 0.35 * p : this.stepIndex === 3 ? 0.72 : 1;
    ctx.fillStyle = c.balloon;
    ctx.beginPath();
    ctx.ellipse(this._balloonX, LINE_Y, 46 * shrink, 64 * shrink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = SimDraw.shade(c.balloon, -0.25);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = SimDraw.withAlpha(c.balloon, 0.8);
    ctx.fillRect(this._balloonX - 8, LINE_Y + 54 * shrink, 16, 20);

    if (this.stepIndex === 1) {
      const jetLen = 20 + 46 * p;
      drawForceArrow(ctx, this._balloonX, LINE_Y + 74, { angle: Math.PI * 0.75, length: jetLen + 60, color: c.air, label: 'air out' });
    }
    if (this.stepIndex === 2) {
      drawForceArrow(ctx, this._balloonX, LINE_Y - 80, { angle: 0, length: 90, color: c.good, label: 'balloon moves' });
    }
    if (this.stepIndex === 3 && this._balloonV > 4) {
      drawForceArrow(ctx, this._balloonX, LINE_Y - 80, { angle: 0, magnitude: this._balloonV, pxPerUnit: 1.2, minLen: 30, maxLen: 140, color: c.good, label: 'balloon moves' });
    }

    if (this.stepIndex === 2 || (this.stepIndex === 3 && this._stepEnterTime < 4)) {
      SimDraw.drawPanel(ctx, W / 2 - 250, 420, 500, 72, { bg: c.panelBg, radius: 10, stroke: c.good, lineWidth: 1.5 });
      ctx.textAlign = 'center';
      ctx.font = '700 15px Inter, system-ui';
      ctx.fillStyle = c.air;
      ctx.fillText('exhaust gases pushed one way', W / 2, 452);
      ctx.fillStyle = c.good;
      ctx.fillText('rocket/balloon pushed the other — lift-off', W / 2, 478);
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

  _announce(text) {
    if (this._liveRegion) this._liveRegion.textContent = text;
  }

  _announceStep() {
    this._announce(STEPS[this.stepIndex].caption);
  }
}
