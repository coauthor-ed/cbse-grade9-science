import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  W, H, drawBackdrop, pill, clamp01, outBack, inOutSine,
  mix, alpha, lighten, darken, rr, ellipse, luma,
} from 'simulations/base/kit/SimLook.js';

// EnergyFormsBoardScene - blk-l02-s06, Forms of Energy (2 beats; book Fig 7.10).
// Seven tiles, each one drawn picture and the form's name only.
// b0: the tiles come in one by one (mechanical, thermal, light, sound,
//     electrical, nuclear, chemical: the slide's order).
// b1: the mechanical tile lights up and its ball rolls down the ramp (motion
//     and position); the other six dim.
// A tap plays the beat again.

const TW = 152, TH = 236, GAP = 10;
const ROW1_Y = 14, ROW2_Y = 270;
const ROW2_X = (W - (3 * TW + 2 * GAP)) / 2;
const FORMS = ['mechanical', 'thermal', 'light', 'sound', 'electrical', 'nuclear', 'chemical'];
const TONES = { mechanical: 's1', thermal: 's6', light: 's2', sound: 's8', electrical: 's7', nuclear: 's5', chemical: 's3' };
const POP_S = 0.12, POP_LEN = 0.45;
const ROLL_S = 1.4;

const tileAt = (i) => (i < 4
  ? { x: 16 + i * (TW + GAP), y: ROW1_Y }
  : { x: ROW2_X + (i - 4) * (TW + GAP), y: ROW2_Y });

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }],
  [{ idx: 1, dwellMs: null }],
];

export class EnergyFormsBoardScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static DRAGGABLE = false;
  static NOTE_STAGE = -1;
  static CONTROLS = [];
  static ARIA_LABEL = 'Seven tiles, one for each form of energy: mechanical (a ball on a ramp), thermal (a pot on a flame), light (a torch beam), sound (a drum), electrical (a plug and socket), nuclear (an atom nucleus), chemical (a bowl of rice with a spoon). In the second step the mechanical tile lights up and its ball rolls down the ramp; the others dim.';

  enter() {
    this.motionT = 0;
  }

  pointerDown() {
    this.motionT = 0;
    this.animateFor(800);
  }

  get motionEnd() { return this.stage >= 1 ? ROLL_S : POP_S * 6 + POP_LEN; }

  update(d) { this.motionT = Math.min(this.motionEnd, (this.motionT ?? 0) + d); }

  busy() { return (this.motionT ?? 0) < this.motionEnd; }

  draw(ctx, c) {
    const t = this.motionT ?? 0;
    drawBackdrop(ctx, c, 'dots');
    FORMS.forEach((name, i) => {
      const { x, y } = tileAt(i);
      const lit = this.stage < 1 || name === 'mechanical';
      const s = this.stage < 1 ? outBack(clamp01((t - i * POP_S) / POP_LEN)) : 1;
      if (s <= 0.01) return;
      ctx.save();
      ctx.translate(x + TW / 2, y + TH / 2);
      ctx.scale(s, s);
      ctx.translate(-(x + TW / 2), -(y + TH / 2));
      ctx.globalAlpha *= lit ? 1 : 0.28;
      this.tile(ctx, c, x, y, c[TONES[name]], this.stage >= 1 && lit);
      this[name](ctx, c, x + TW / 2, y + 100, t);
      pill(ctx, c, name, x + TW / 2, y + TH - 30, { bg: c[TONES[name]], size: 24 });
      ctx.restore();
    });
  }

  tile(ctx, c, x, y, tone, focus) {
    const face = mix(c.raised, tone, 0.1);
    rr(ctx, x, y + 5, TW, TH, 16); ctx.fillStyle = darken(face, 0.25); ctx.fill();
    rr(ctx, x, y, TW, TH, 16); ctx.fillStyle = face; ctx.fill();
    rr(ctx, x + 8, y + 8, TW - 16, TH - 66, 12); ctx.fillStyle = mix(c.bgSurface, tone, 0.14); ctx.fill();
    rr(ctx, x, y, TW, TH, 16); ctx.strokeStyle = focus ? c.gold : mix(face, c.stroke, 0.6); ctx.lineWidth = focus ? 5 : 2.5; ctx.stroke();
  }

  // ---- the seven pictures, each centred on (cx, cy), about 120 x 150 ----

  mechanical(ctx, c, cx, cy, t) {
    const wood = mix(c.s8, c.s2, 0.4);
    // ramp: a wedge, high on the left
    const x0 = cx - 60, x1 = cx + 60, top = cy - 40, base = cy + 56;
    ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0, top); ctx.lineTo(x1, base); ctx.closePath();
    ctx.fillStyle = wood; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0 + 18, base); ctx.lineTo(x0 + 18, top + 18 * (base - top) / (x1 - x0)); ctx.lineTo(x0, top); ctx.closePath();
    ctx.fillStyle = lighten(wood, 0.25); ctx.fill();
    ctx.fillStyle = darken(wood, 0.25); ctx.fillRect(x0, base - 6, x1 - x0, 6);
    ctx.strokeStyle = darken(wood, 0.4); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0, top); ctx.lineTo(x1, base); ctx.closePath(); ctx.stroke();
    // the ball: at the top, rolling down in b1
    const u = this.stage >= 1 ? inOutSine(clamp01(t / ROLL_S)) * 0.82 : 0;
    const r = 15;
    const ang = Math.atan2(base - top, x1 - x0);
    const px = x0 + 10 + u * (x1 - x0 - 10), py = top + (px - x0) * Math.tan(ang);
    const bx = px + Math.sin(ang) * r, by = py - Math.cos(ang) * r;
    this.ball(ctx, c, bx, by, r, c.s1, u * 9);
    if (this.stage >= 1 && u > 0.05) {
      ctx.strokeStyle = alpha(c.s1, 0.6); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let k = 1; k <= 2; k++) {
        const d = r + 6 + k * 8;
        ctx.beginPath();
        ctx.moveTo(bx - Math.cos(ang) * d - 4, by - Math.sin(ang) * d - 6 * k + 6);
        ctx.lineTo(bx - Math.cos(ang) * (d + 12) - 4, by - Math.sin(ang) * (d + 12) - 6 * k + 6);
        ctx.stroke();
      }
    }
  }

  ball(ctx, c, x, y, r, tone, spin = 0) {
    ctx.fillStyle = darken(tone, 0.3); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = tone; ctx.beginPath(); ctx.arc(x - 1.5, y - 1.5, r - 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alpha(lighten(tone, 0.5), 0.8); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r * 0.6, spin, spin + 2); ctx.stroke();
    ctx.fillStyle = alpha(lighten(tone, 0.7), 0.8); ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.3, r * 0.18, -0.6, 0, Math.PI * 2); ctx.fill();
  }

  thermal(ctx, c, cx, cy) {
    // a burner ring with flames under a pot; steam above
    const metal = mix(c.labelMuted, c.bgSurface, 0.35);
    rr(ctx, cx - 50, cy + 44, 100, 14, 4); ctx.fillStyle = darken(metal, 0.3); ctx.fill();
    ctx.fillStyle = lighten(metal, 0.1); ctx.fillRect(cx - 46, cy + 46, 92, 3);
    for (let i = -2; i <= 2; i++) {
      const fx = cx + i * 17, fh = 26 - Math.abs(i) * 3;
      ctx.beginPath(); ctx.moveTo(fx - 8, cy + 44); ctx.quadraticCurveTo(fx - 7, cy + 44 - fh * 0.6, fx, cy + 44 - fh); ctx.quadraticCurveTo(fx + 7, cy + 44 - fh * 0.6, fx + 8, cy + 44); ctx.closePath();
      ctx.fillStyle = c.flame; ctx.fill();
      ctx.beginPath(); ctx.moveTo(fx - 4, cy + 44); ctx.quadraticCurveTo(fx, cy + 44 - fh * 0.75, fx + 4, cy + 44); ctx.closePath();
      ctx.fillStyle = lighten(c.s2, 0.3); ctx.fill();
    }
    // pot
    const pot = mix(c.s6, c.labelMuted, 0.45);
    rr(ctx, cx - 46, cy - 18, 92, 46, 10); ctx.fillStyle = pot; ctx.fill();
    ctx.fillStyle = darken(pot, 0.22); ctx.fillRect(cx + 18, cy - 14, 24, 40);
    ctx.fillStyle = alpha(lighten(pot, 0.45), 0.8); ctx.fillRect(cx - 40, cy - 12, 6, 34);
    rr(ctx, cx - 52, cy - 24, 104, 10, 4); ctx.fillStyle = darken(pot, 0.12); ctx.fill();
    for (const s of [-1, 1]) { rr(ctx, cx + s * 52 - (s > 0 ? 0 : 14), cy - 16, 14, 6, 3); ctx.fillStyle = darken(pot, 0.35); ctx.fill(); }
    ctx.strokeStyle = darken(pot, 0.4); ctx.lineWidth = 2; rr(ctx, cx - 46, cy - 18, 92, 46, 10); ctx.stroke();
    ctx.strokeStyle = alpha(c.labelMuted, 0.6); ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const x0 = cx - 22 + i * 22;
      ctx.beginPath(); ctx.moveTo(x0, cy - 32); ctx.bezierCurveTo(x0 - 10, cy - 44, x0 + 10, cy - 54, x0, cy - 68); ctx.stroke();
    }
  }

  light(ctx, c, cx, cy) {
    // a torch on the left throwing a beam to the right
    // the beam fades to nothing well inside the tile's picture panel (and is
    // clipped to it), so it never ends in a hard edge
    ctx.save();
    rr(ctx, cx - TW / 2 + 8, cy - 92, TW - 16, TH - 66, 12); ctx.clip();
    ctx.translate(cx - 34, cy + 10);
    ctx.rotate(-0.35);
    const beam = ctx.createLinearGradient(30, 0, 86, 0);
    beam.addColorStop(0, alpha(c.s2, 0.8)); beam.addColorStop(0.5, alpha(c.s2, 0.35)); beam.addColorStop(1, alpha(c.s2, 0));
    ctx.beginPath(); ctx.moveTo(30, -14); ctx.lineTo(86, -36); ctx.lineTo(86, 36); ctx.lineTo(30, 14); ctx.closePath();
    ctx.fillStyle = beam; ctx.fill();
    const body = mix(c.s5, c.stroke, 0.3);
    rr(ctx, -40, -11, 50, 22, 6); ctx.fillStyle = body; ctx.fill();
    ctx.fillStyle = darken(body, 0.25); ctx.fillRect(-36, 3, 44, 6);
    ctx.fillStyle = alpha(lighten(body, 0.4), 0.8); ctx.fillRect(-36, -8, 44, 3);
    ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(30, -19); ctx.lineTo(30, 19); ctx.lineTo(8, 12); ctx.closePath();
    ctx.fillStyle = lighten(body, 0.15); ctx.fill();
    ctx.fillStyle = darken(body, 0.2); ctx.fillRect(20, 4, 10, 13);
    ellipse(ctx, 30, 0, 5, 19); ctx.fillStyle = lighten(c.s2, 0.5); ctx.fill();
    rr(ctx, -20, -15, 12, 5, 2); ctx.fillStyle = c.s6; ctx.fill();
    ctx.restore();
  }

  sound(ctx, c, cx, cy) {
    // a drum (side view) with a stick, and sound arcs to the right
    const shell = mix(c.s8, c.s6, 0.3);
    const dx = cx - 22, top = cy - 10, bot = cy + 48, rx = 38;
    ctx.beginPath(); ctx.moveTo(dx - rx, top); ctx.lineTo(dx - rx, bot); ctx.ellipse(dx, bot, rx, 10, 0, Math.PI, 0, true); ctx.lineTo(dx + rx, top); ctx.closePath();
    ctx.fillStyle = shell; ctx.fill();
    ctx.fillStyle = darken(shell, 0.25); ctx.fillRect(dx + 14, top, rx - 14, bot - top + 6);
    ctx.fillStyle = alpha(lighten(shell, 0.4), 0.8); ctx.fillRect(dx - rx + 5, top + 4, 6, bot - top - 4);
    ctx.strokeStyle = alpha(lighten(c.s2, 0.4), 0.9); ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { const x = dx - rx + 6 + i * 16; ctx.beginPath(); ctx.moveTo(x, top + 4); ctx.lineTo(x + 10, bot + 2); ctx.stroke(); }
    ellipse(ctx, dx, top, rx, 10); ctx.fillStyle = lighten(c.s2, 0.75); ctx.fill();
    ctx.strokeStyle = darken(shell, 0.4); ctx.lineWidth = 2.5; ctx.stroke();
    // stick
    ctx.strokeStyle = mix(c.s2, c.s8, 0.5); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(dx + 6, top - 4); ctx.lineTo(dx + 40, top - 48); ctx.stroke();
    ctx.fillStyle = lighten(c.s2, 0.5); ctx.beginPath(); ctx.arc(dx + 6, top - 4, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c.s8; ctx.lineWidth = 4.5;
    for (let k = 0; k < 3; k++) { ctx.globalAlpha *= 1; ctx.beginPath(); ctx.arc(dx + 10, top + 14, 46 + k * 14, -0.55, 0.35); ctx.stroke(); }
  }

  electrical(ctx, c, cx, cy) {
    // a wall socket and a plug on its cord, with a small spark between
    const plate = mix(c.label, c.bgSurface, 0.82);
    rr(ctx, cx - 56, cy - 46, 70, 92, 10); ctx.fillStyle = darken(plate, 0.15); ctx.fill();
    rr(ctx, cx - 58, cy - 50, 70, 92, 10); ctx.fillStyle = plate; ctx.fill();
    ctx.strokeStyle = darken(plate, 0.3); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = darken(plate, 0.55);
    for (const [hx, hy, r] of [[-23, -26, 6], [-37, 4, 4.5], [-9, 4, 4.5]]) { ctx.beginPath(); ctx.arc(cx + hx, cy + hy, r, 0, Math.PI * 2); ctx.fill(); }
    // plug body to the right, pins pointing left
    const pb = mix(c.s7, c.bgSurface, 0.25);
    ctx.fillStyle = mix(c.labelMuted, c.bgSurface, 0.1);
    ctx.fillRect(cx + 14, cy - 28, 14, 5); ctx.fillRect(cx + 14, cy + 2, 14, 4); ctx.fillRect(cx + 14, cy + 14, 14, 4);
    rr(ctx, cx + 26, cy - 34, 36, 58, 8); ctx.fillStyle = pb; ctx.fill();
    ctx.fillStyle = darken(pb, 0.25); ctx.fillRect(cx + 48, cy - 30, 10, 50);
    ctx.fillStyle = alpha(lighten(pb, 0.4), 0.8); ctx.fillRect(cx + 30, cy - 30, 4, 50);
    ctx.strokeStyle = darken(pb, 0.4); ctx.lineWidth = 2; rr(ctx, cx + 26, cy - 34, 36, 58, 8); ctx.stroke();
    ctx.strokeStyle = darken(pb, 0.2); ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 44, cy + 24); ctx.bezierCurveTo(cx + 44, cy + 50, cx + 10, cy + 40, cx - 10, cy + 60); ctx.stroke();
    // spark: a zig-zag bolt
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 64); ctx.lineTo(cx + 18, cy - 46); ctx.lineTo(cx + 8, cy - 44); ctx.lineTo(cx + 24, cy - 24); ctx.lineTo(cx + 2, cy - 42); ctx.lineTo(cx + 12, cy - 44); ctx.closePath();
    ctx.fillStyle = c.s2; ctx.fill(); ctx.strokeStyle = darken(c.s2, 0.35); ctx.lineWidth = 1.5; ctx.stroke();
  }

  nuclear(ctx, c, cx, cy) {
    // a nucleus: a tight cluster of protons and neutrons, with a glow
    for (let k = 3; k >= 1; k--) { ctx.fillStyle = alpha(c.s5, 0.1 * (4 - k)); ctx.beginPath(); ctx.arc(cx, cy, 34 + k * 12, 0, Math.PI * 2); ctx.fill(); }
    const pts = [[0, 0], [-18, -6], [16, -10], [-6, 18], [14, 14], [-20, 14], [2, -22], [-14, -22], [22, 4], [6, 2]];
    pts.forEach(([dx, dy], i) => this.ball(ctx, c, cx + dx, cy + dy, 13, i % 2 ? c.proton : c.neutron));
  }

  chemical(ctx, c, cx, cy) {
    // food: a bowl of rice with a steel spoon in it
    const bowl = mix(c.s3, c.labelMuted, 0.25);
    const rice = luma(c.bgSurface) > 0.5 ? lighten(mix(c.bgSurface, c.gold, 0.1), 0.5) : mix(c.label, c.gold, 0.08);
    const steel = mix(c.labelMuted, c.bgSurface, 0.3);
    const rimY = cy + 6, rx = 56, ry = 13, botY = cy + 54;
    // shadow and foot ring
    ellipse(ctx, cx, botY + 10, 44, 7); ctx.fillStyle = alpha(c.stroke, 0.35); ctx.fill();
    rr(ctx, cx - 24, botY - 2, 48, 10, 4); ctx.fillStyle = darken(bowl, 0.3); ctx.fill();
    // the far inside of the bowl (seen above the rice at the back)
    ellipse(ctx, cx, rimY, rx, ry); ctx.fillStyle = darken(bowl, 0.35); ctx.fill();
    // rice mound: a dome above the rim, shaded on the right
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx - rx + 4, rimY); ctx.bezierCurveTo(cx - 40, cy - 40, cx + 40, cy - 40, cx + rx - 4, rimY); ctx.ellipse(cx, rimY, rx - 4, ry - 3, 0, 0, Math.PI); ctx.closePath();
    ctx.fillStyle = rice; ctx.fill();
    ctx.clip();
    ctx.fillStyle = darken(rice, 0.12); ctx.beginPath(); ctx.ellipse(cx + 42, rimY - 6, 34, 40, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = alpha(lighten(rice, 0.6), 0.9); ctx.beginPath(); ctx.ellipse(cx - 18, cy - 18, 16, 7, -0.3, 0, Math.PI * 2); ctx.fill();
    // grains: short strokes scattered over the mound
    ctx.strokeStyle = darken(rice, 0.22); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const [gx, gy, a] of [[-30, -4, 0.4], [-14, -14, -0.5], [4, -22, 0.2], [20, -12, 0.9], [34, -2, -0.3], [-4, -4, 1.2], [12, 0, -0.8], [-22, -20, 1], [26, -24, 0.5], [-38, 2, -0.9], [42, 4, 0.3]]) {
      ctx.beginPath(); ctx.moveTo(cx + gx - 3 * Math.cos(a), cy + gy - 3 * Math.sin(a)); ctx.lineTo(cx + gx + 3 * Math.cos(a), cy + gy + 3 * Math.sin(a)); ctx.stroke();
    }
    ctx.restore();
    // spoon: handle out of the rice, up and to the right
    ctx.strokeStyle = darken(steel, 0.35); ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 10, cy - 18); ctx.lineTo(cx + 50, cy - 70); ctx.stroke();
    ctx.strokeStyle = steel; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx + 10, cy - 18); ctx.lineTo(cx + 50, cy - 70); ctx.stroke();
    ctx.strokeStyle = alpha(lighten(steel, 0.6), 0.9); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + 18, cy - 30); ctx.lineTo(cx + 46, cy - 66); ctx.stroke();
    ellipse(ctx, cx + 8, cy - 14, 12, 6); ctx.fillStyle = darken(steel, 0.2); ctx.fill();
    // bowl body: a deep curve under the rim, light side left, shade side right
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx - rx, rimY); ctx.bezierCurveTo(cx - rx + 4, botY + 4, cx + rx - 4, botY + 4, cx + rx, rimY); ctx.ellipse(cx, rimY, rx, ry, 0, 0, Math.PI); ctx.closePath();
    ctx.fillStyle = bowl; ctx.fill();
    ctx.clip();
    ctx.fillStyle = darken(bowl, 0.22); ctx.beginPath(); ctx.ellipse(cx + 46, rimY + 30, 34, 50, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = alpha(lighten(bowl, 0.5), 0.85); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - rx + 12, rimY + 18); ctx.quadraticCurveTo(cx - 36, botY - 6, cx - 18, botY - 2); ctx.stroke();
    // a painted band round the bowl
    ctx.strokeStyle = alpha(darken(bowl, 0.4), 0.7); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(cx, rimY + 4, rx - 2, ry + 1, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.restore();
    // rim lip and outline
    ctx.beginPath(); ctx.ellipse(cx, rimY, rx, ry, 0, 0, Math.PI); ctx.strokeStyle = lighten(bowl, 0.3); ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - rx, rimY); ctx.bezierCurveTo(cx - rx + 4, botY + 4, cx + rx - 4, botY + 4, cx + rx, rimY);
    ctx.strokeStyle = darken(bowl, 0.45); ctx.lineWidth = 2; ctx.stroke();
  }
}
