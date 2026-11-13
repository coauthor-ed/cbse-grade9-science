/**
 * MotionCastShowcaseScene - the motion-and-forces cast in one place (MotionCast.js):
 * b0 the athlete on the 0-100 m track, b1 the bus passenger, b2 the girl on the
 * scooter on the highway, b3 the canoeist, b4 the surfaces strip (rough floor,
 * tiles, ice, marble table) with the girl on the wheeled chair. Sample data only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, drawFloor, alpha, rr } from 'simulations/base/kit/SimLook.js';
import { trackPreset, highwayPreset, drawRunTrack, drawHighway, drawAthlete, drawBusPassenger, drawScooterGirl,
  drawCanoeist, drawChairGirl, drawSurface, drawMotionArrow } from './MotionCast.js';

export class MotionCastShowcaseScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }], [{ idx: 3, dwellMs: null }], [{ idx: 4, dwellMs: null }]];
  static ARIA_LABEL = 'The motion course cast: an athlete on a 100 metre track, a passenger standing in a bus, a girl riding a scooter on a highway, a canoeist paddling, and four floor surfaces with a girl on a wheeled chair.';

  constructor(container, config) { super(container, config); this.cur = 0; }
  enter(stage) { this.cur = stage; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    [this.b0, this.b1, this.b2, this.b3, this.b4][this.cur]?.call(this, ctx, c);
  }

  b0(ctx, c) {
    const spec = trackPreset({ y: 380 });
    drawRunTrack(ctx, c, spec, { points: [{ m: 0, label: 'Start' }, { m: 100, label: 'Finish' }] });
    const sk = drawAthlete(ctx, c, spec, { m: 40, height: 130 });
    drawMotionArrow(ctx, c, 'v', spec.toPx(40) + 30, 200, { length: 120, label: 'v = 8 m/s' });
    return sk;
  }

  b1(ctx, c) {
    drawFloor(ctx, c, 440, {});
    drawBusPassenger(ctx, c, { x: 340, y: 440, length: 640, lean: 0.25 });
    drawMotionArrow(ctx, c, 'a', 420, 480, { length: 110, angle: Math.PI, label: 'braking' });
  }

  b2(ctx, c) {
    const spec = highwayPreset({ y: 430 });
    drawHighway(ctx, c, spec, {});
    drawScooterGirl(ctx, c, { x: spec.toPx(220), y: 430, length: 190, roll: 3 });
  }

  b3(ctx, c) {
    rr(ctx, 0, 330, 680, 190, 0); ctx.fillStyle = alpha(c.water, 0.45); ctx.fill();
    drawCanoeist(ctx, c, { x: 340, y: 360, length: 420, stroke: 0.25 });
  }

  b4(ctx, c) {
    const keys = ['rough', 'tiles', 'ice', 'marble'], w = 150;
    keys.forEach((k, i) => {
      const x0 = 20 + i * (w + 10), s = drawSurface(ctx, c, k, x0, x0 + w, 200, { h: 34 });
      ctx.save(); ctx.font = '800 26px ' + c.fontDisplay; ctx.textAlign = 'center'; ctx.fillStyle = c.label;
      ctx.fillText(s.label, x0 + w / 2, 272); ctx.restore();
    });
    drawFloor(ctx, c, 500, {});
    drawChairGirl(ctx, c, { x: 340, y: 500, height: 180 });
  }
}
