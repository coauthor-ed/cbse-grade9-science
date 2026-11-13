/**
 * AirbagScene - slide blk-l13-n01 "The airbag" (1 beat; Fig 6.19).
 *   b0 'airbag' side view inside a car (cut-away: roof, windscreen, dashboard, steering wheel, seat); the
 *               driver seated, hands on the wheel, a seat belt across the chest. The road slides back (the
 *               car moves); then the car stops (compressed): the airbag inflates from the wheel in 0.3 s
 *               into a soft round cushion; the driver moves forward, head and chest press into it and it
 *               squashes; the body stops over a longer time. Two rows: faint "hitting the wheel" (short
 *               bar, long F arrow) and "with the airbag" (long bar, short F arrow); the F arrow on the
 *               driver's chest from the bag has the short length. Rest: driver held by bag and belt, bars shown.
 * Stop times 1 : 5 give arrows 5 : 1 (stopForceLen, one scale). Frames depend on age only.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, clamp01, inOutSine, outBack, alpha, darken, lighten, mix, font, rr, hsl, hslOf, leader } from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook, solveFigure } from 'simulations/base/kit/SimFigure.js';
import { trackSpec, drawTrack, drawMotionArrow } from 'simulations/base/kit/SimTrack.js';
import { drawStopRow, stopForceLen } from '../shared/StopTime.js';

const ease = (a, t0, d) => inOutSine(clamp01((a - t0) / d));
const FLOOR = 452, ROAD = 492, ROOF = 196;
const SEAT = { x: 285, y: 390 }, DH = 300;                   // seat anchor, driver height (standing)
const HUB = { x: 400, y: 360 }, WR = 56, WT = -0.42;           // steering wheel hub, rim radius, tilt (within the driver's reach)
const T_CRASH = 1.1, T_BAG = 0.3, T_LEAN = 1.0, LEAN = 24;
/** A point on the steering-wheel rim at angle u (radians; -PI/2 = the top, nearest the driver). */
const rimAt = (u) => { const lx = 14 * Math.cos(u), ly = WR * Math.sin(u); return { x: HUB.x + lx * Math.cos(WT) - ly * Math.sin(WT), y: HUB.y + lx * Math.sin(WT) + ly * Math.cos(WT) }; };
const GRIPS = [-1.5, -1.1];                                    // both hands on the top of the rim, below the chin     // crash age, bag inflation, body stop, lean (deg)
const T_WHEEL = 0.2, T_AIRBAG = 1.0;                           // stop times (relative): 1 : 5
const ROW = { x: 24, w: 214, y1: 46, y2: 126 }, F_BAG = 40;

export class AirbagScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'Inside a car, seen from the side. The car stops suddenly. An airbag inflates from the steering wheel into a soft cushion, and the driver, held by a seat belt, moves forward into it; the bag squashes and the body stops over a longer time. Two bars compare the time to stop: hitting the wheel is a short time and a large force; with the airbag it is a longer time and a smaller force.';

  busy() { return this.age < T_CRASH + T_LEAN + 1.4; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const a = this.age, moving = a < T_CRASH;
    // The road slides back while the car moves; it stops dead at the crash.
    const run = 9 * Math.min(a, T_CRASH);
    const jolt = a > T_CRASH && a < T_CRASH + 0.25 ? Math.sin((a - T_CRASH) * 60) * 3 * (1 - (a - T_CRASH) / 0.25) : 0;
    ctx.save(); ctx.translate(jolt, 0);
    const spec = trackSpec({ from: 0, to: 60, x0: 0, x1: 680, y: ROAD });
    drawTrack(ctx, c, spec, { kind: 'road', ticks: false, depth: 28, scroll: run });
    this.shell(ctx, c);
    // Bag: inflates in 0.3 s, then squashes as the body presses in.
    const inf = outBack(clamp01((a - T_CRASH - 0.04) / T_BAG)), press = ease(a, T_CRASH + 0.15, T_LEAN);
    const lean = LEAN * press;
    const look = figureLook(c, { skin: 1, hairStyle: 'short', hair: 0, top: 's8', bottom: 'denim', mood: press > 0.2 ? 'oops' : 'smile' });
    const spec2 = { x: SEAT.x, y: FLOOR, height: DH, facing: 1, pose: { name: 'sit', lean }, seat: SEAT,
      hands: GRIPS.map(rimAt),
      feet: [{ x: 386, y: FLOOR - 8 }, { x: 376, y: FLOOR - 6 }] };
    this.seat(ctx, c, 'back');
    this.wheel(ctx, c);
    const pre = solveFigure(spec2).anchors.head;
    if (inf > 0) this.bag(ctx, c, inf, pre.x + pre.r * 0.95);
    this.rimTop(ctx, c);                                         // the gripped part of the rim, in front of the bag
    const sk = drawFigure(ctx, c, spec2, look);
    this.belt(ctx, c, sk);
    const head = sk.anchors.head;
    ctx.restore();
    // v on the driver while the car moves.
    if (moving) drawMotionArrow(ctx, c, 'v', head.x - 40, head.y - head.r - 30, { length: 80, label: 'v', side: 1 });
    // The force on the chest from the bag (short), after the press starts.
    const kf = ease(a, T_CRASH + 0.5, 0.3);
    if (kf > 0) {
      const chest = { x: sk.anchors.shoulder.x + 26, y: sk.anchors.shoulder.y + 34 };
      drawMotionArrow(ctx, c, 'F', chest.x, chest.y, { length: F_BAG * kf, angle: Math.PI, label: '', alpha: kf });
    }
    // Labels on the parts, then the two rows (time bar first, force arrow second).
    const kl = ease(a, T_CRASH + 0.6, 0.4);
    if (kl > 0) {
      this.text(ctx, c, 'airbag', 566, 246, kl, 'center', c.label);
      leader(ctx, 520, 252, HUB.x + 18, HUB.y - 90, c.labelMuted, kl);
      this.text(ctx, c, 'seat belt', 84, 250, kl, 'center', c.label);
      leader(ctx, 92, 268, sk.anchors.shoulder.x - 10, sk.anchors.shoulder.y + 6, c.labelMuted, kl);
    }
    const kr = ease(a, T_CRASH + T_LEAN, 0.5);
    if (kr > 0) {
      drawStopRow(ctx, c, { x: ROW.x, y: ROW.y1, w: ROW.w, t01: T_WHEEL / T_AIRBAG, label: 'hitting the wheel',
        force: stopForceLen(T_WHEEL, { tRef: T_AIRBAG, lenRef: F_BAG }), angle: Math.PI, alpha: 0.42 * kr });
      drawStopRow(ctx, c, { x: ROW.x, y: ROW.y2, w: ROW.w, t01: kr, label: 'with the airbag',
        force: F_BAG, angle: Math.PI, alpha: kr });
    }
  }

  text(ctx, c, s, x, y, k, align, col) {
    ctx.save(); ctx.globalAlpha *= k; ctx.font = font(c, 800, 26, true); ctx.fillStyle = col;
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); ctx.restore();
  }

  /** Cut-away car: cabin air, roof panel, windscreen glass, dashboard, floor sill and the front wheel. */
  shell(ctx, c) {
    const body = c.s1, bodyD = darken(body, 0.35), glass = c.glass;
    ctx.save();
    // Cabin air.
    ctx.beginPath(); ctx.moveTo(0, ROOF); ctx.lineTo(432, ROOF); ctx.lineTo(600, 330); ctx.lineTo(600, FLOOR); ctx.lineTo(0, FLOOR); ctx.closePath();
    ctx.fillStyle = alpha(mix(c.bgSurface, c.labelMuted, 0.2), 0.55); ctx.fill();
    // Windscreen glass (a strip along the A-pillar) and the bonnet beyond.
    ctx.beginPath(); ctx.moveTo(432, ROOF); ctx.lineTo(456, ROOF - 8); ctx.lineTo(632, 326); ctx.lineTo(600, 330); ctx.closePath();
    ctx.fillStyle = alpha(glass, 0.55); ctx.fill(); ctx.strokeStyle = darken(glass, 0.35); ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = alpha(lighten(glass, 0.6), 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(470, ROOF + 18); ctx.lineTo(540, 270); ctx.stroke();
    const panel = (pts) => {
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      ctx.fillStyle = body; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = alpha(lighten(body, 0.35), 0.7); ctx.fillRect(0, pts[0][1] - 40, 680, 46); ctx.restore();
      ctx.strokeStyle = bodyD; ctx.lineWidth = 2.5; ctx.stroke();
    };
    panel([[0, ROOF - 22], [446, ROOF - 22], [456, ROOF - 8], [432, ROOF], [0, ROOF]]);          // roof
    panel([[632, 326], [680, 336], [680, 368], [600, 360], [600, 330]]);                         // bonnet
    // Dashboard: a padded shelf and face.
    ctx.beginPath(); ctx.moveTo(600, 330); ctx.lineTo(520, 334); ctx.quadraticCurveTo(500, 338, 506, 360); ctx.lineTo(540, 404); ctx.lineTo(600, 404); ctx.closePath();
    const dash = mix(c.stroke, c.bgDeep, 0.35);
    ctx.fillStyle = dash; ctx.fill();
    ctx.fillStyle = alpha(lighten(dash, 0.4), 0.7); ctx.fillRect(518, 336, 80, 6);
    ctx.strokeStyle = darken(dash, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    // Firewall down to the floor, floor and sill.
    ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.2); ctx.fillRect(560, 404, 40, FLOOR - 404);
    panel([[0, FLOOR], [680, FLOOR], [680, ROAD - 26], [0, ROAD - 26]]);
    // Two wheels below the sill.
    for (const wx of [76, 612]) {
      const wy = ROAD - 2, r = 30;
      ctx.beginPath(); ctx.arc(wx, wy, r, 0, Math.PI * 2); ctx.fillStyle = darken(c.stroke, 0.45); ctx.fill();
      ctx.strokeStyle = darken(c.stroke, 0.65); ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(wx, wy, r * 0.5, 0, Math.PI * 2); ctx.fillStyle = lighten(c.stroke, 0.45); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(wx - 3, wy - 3, r * 0.82, Math.PI * 1.05, Math.PI * 1.45); ctx.strokeStyle = alpha(lighten(c.stroke, 0.4), 0.8); ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.restore();
  }

  /** The seat: backrest and headrest behind the driver ('back'), cushion front edge ('front'). */
  seat(ctx, c, part) {
    const col = mix(c.s5, c.stroke, 0.55), rim = darken(col, 0.4);
    ctx.save();
    if (part === 'back') {
      ctx.save(); ctx.translate(SEAT.x - 70, SEAT.y - 10); ctx.rotate(-0.2);
      rr(ctx, -22, -196, 44, 200, 18); ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = alpha(lighten(col, 0.3), 0.7); rr(ctx, -16, -188, 10, 184, 5); ctx.fill();
      rr(ctx, -22, -196, 44, 200, 18); ctx.strokeStyle = rim; ctx.lineWidth = 2.5; ctx.stroke();
      rr(ctx, -18, -250, 40, 46, 14); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = rim; ctx.stroke();
      ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.3); ctx.fillRect(-4, -206, 6, 12);
      ctx.restore();
      rr(ctx, SEAT.x - 92, SEAT.y - 6, 176, 34, 14); ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = alpha(lighten(col, 0.3), 0.7); rr(ctx, SEAT.x - 84, SEAT.y - 2, 160, 7, 3); ctx.fill();
      rr(ctx, SEAT.x - 92, SEAT.y - 6, 176, 34, 14); ctx.strokeStyle = rim; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = mix(c.stroke, c.bgDeep, 0.3); ctx.fillRect(SEAT.x - 40, SEAT.y + 28, 70, FLOOR - SEAT.y - 28);
    }
    ctx.restore();
  }

  /** Seat belt: a webbing band from the pillar behind her shoulder across the chest to the buckle at the hip. */
  belt(ctx, c, sk) {
    const sh = sk.anchors.shoulder, hip = sk.anchors.hip;
    const top = { x: sh.x - 30, y: sh.y - 26 }, mid = { x: sh.x + 18, y: sh.y + 40 }, low = { x: hip.x + 22, y: hip.y + 4 };
    const web = darken(c.stroke, 0.3);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.quadraticCurveTo(mid.x, mid.y, low.x, low.y); };
    path(); ctx.strokeStyle = darken(web, 0.4); ctx.lineWidth = 15; ctx.stroke();
    path(); ctx.strokeStyle = web; ctx.lineWidth = 11; ctx.stroke();
    path(); ctx.strokeStyle = alpha(lighten(web, 0.5), 0.7); ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
    // Lap part and the buckle.
    ctx.beginPath(); ctx.moveTo(hip.x - 40, hip.y + 8); ctx.lineTo(low.x, low.y); ctx.strokeStyle = darken(web, 0.4); ctx.lineWidth = 13; ctx.stroke();
    ctx.strokeStyle = web; ctx.lineWidth = 9; ctx.stroke();
    rr(ctx, low.x - 9, low.y - 8, 20, 16, 4); ctx.fillStyle = lighten(c.stroke, 0.35); ctx.fill(); ctx.strokeStyle = darken(c.stroke, 0.4); ctx.lineWidth = 2; ctx.stroke();
    // Pillar anchor plate.
    rr(ctx, top.x - 10, top.y - 12, 20, 24, 5); ctx.fillStyle = lighten(c.stroke, 0.2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  /** Steering wheel in side view (a thin tilted ring), its column into the dashboard. */
  wheel(ctx, c) {
    const steel = mix(c.stroke, c.bgDeep, 0.4);
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = darken(steel, 0.3); ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(HUB.x, HUB.y); ctx.lineTo(516, 362); ctx.stroke();
    ctx.strokeStyle = steel; ctx.lineWidth = 11; ctx.stroke();
    ctx.translate(HUB.x, HUB.y); ctx.rotate(WT);
    ctx.beginPath(); ctx.ellipse(0, 0, 14, WR, 0, 0, Math.PI * 2); ctx.strokeStyle = darken(steel, 0.35); ctx.lineWidth = 15; ctx.stroke();
    ctx.strokeStyle = steel; ctx.lineWidth = 10; ctx.stroke();
    ctx.strokeStyle = alpha(lighten(steel, 0.5), 0.8); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 14, WR, 0, Math.PI * 0.9, Math.PI * 1.4); ctx.stroke();
    rr(ctx, -10, -20, 20, 40, 8); ctx.fillStyle = darken(steel, 0.1); ctx.fill(); ctx.strokeStyle = darken(steel, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  /** The top arc of the rim (where the hands grip), drawn again over the bag so the grip reads. */
  rimTop(ctx, c) {
    const steel = mix(c.stroke, c.bgDeep, 0.4);
    ctx.save(); ctx.lineCap = 'round'; ctx.translate(HUB.x, HUB.y); ctx.rotate(WT);
    ctx.beginPath(); ctx.ellipse(0, 0, 14, WR, 0, Math.PI * 1.22, Math.PI * 1.86); ctx.strokeStyle = darken(steel, 0.35); ctx.lineWidth = 15; ctx.stroke();
    ctx.strokeStyle = steel; ctx.lineWidth = 10; ctx.stroke();
    ctx.restore();
  }

  /** The airbag: a soft pale cushion grown from the hub toward the driver; where her head reaches into it
   *  the near side flattens and the bag bulges up and down (same air). headX = the front of her head. */
  bag(ctx, c, inf, headX) {
    const R = 60, right = HUB.x + 44, free = right - 2 * R * inf;
    const left = Math.min(right - 12, Math.max(free, headX - 4));
    const rx = (right - left) / 2, x = left + rx, squash = clamp01(1 - rx / (R * inf || 1));
    const ry = R * inf * (1 + 0.45 * squash), cy = HUB.y - 70 * inf;
    const bagCol = hsl(hslOf(c.s1).h, 0.16, 0.93);
    ctx.save();
    const shape = () => { ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2); };
    shape(); ctx.fillStyle = bagCol; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = alpha(darken(bagCol, 0.16), 0.8); ctx.beginPath(); ctx.ellipse(x + rx * 0.35, cy + ry * 0.3, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(lighten(bagCol, 0.6), 0.9); ctx.beginPath(); ctx.ellipse(x - rx * 0.2, cy - ry * 0.45, rx * 0.5, ry * 0.22, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alpha(darken(bagCol, 0.3), 0.7); ctx.lineWidth = 2;
    for (const k of [-0.45, 0, 0.45]) { ctx.beginPath(); ctx.moveTo(x - rx + 3, cy + k * ry); ctx.quadraticCurveTo(x - rx * 0.4, cy + k * ry + 8 * squash + 2, x, cy + k * ry); ctx.stroke(); }
    ctx.restore();
    shape(); ctx.strokeStyle = darken(bagCol, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }
}
