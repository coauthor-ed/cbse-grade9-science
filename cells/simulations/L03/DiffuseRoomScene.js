// DiffuseRoomScene - an agarbatti in the corner of a room. Each particle moves at random with no preferred direction; nothing here pulls it anywhere.
// So the net movement away from the corner comes from the numbers alone, and the counts on the figure are real counts of the particles drawn.
//   beat 0 crowded round the stick (held in a small puff)  beat 1 released: spreads  beat 2 evenly spread from the first frame: still moving, no net movement
// CONTINUOUS: particles never stop moving, which is the point of beat 2.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { COLOR_TOKEN_MAP, mix, alpha, lighten, darken, pill, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';

const W = 520, H = 660, N = 200, SPEED = 170, TURN = 3.2;
const R = { x0: 24, y0: 60, x1: 496, y1: 492 };
const STICK = { x: 92, y: 400 };
const MID = (R.x0 + R.x1) / 2;
const one = (idx) => [{ idx, dwellMs: null }];

export class DiffuseRoomScene extends SimScene {
  static WIDTH = W;
  static HEIGHT = H;
  static CONTINUOUS = true;
  static VISUAL_PROFILE = 'rich';
  static BEAT_STEP_MAP = [one(0), one(1), one(2)];
  static COLOR_MAP = COLOR_TOKEN_MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'A room with a lit agarbatti in the far left corner. Fragrance particles are crowded near the stick, then spread across the room as each moves at random, then lie evenly through the room while they keep moving. Counts show how many are in the left and right halves.';

  enter(stage) {
    this._p = [];
    const r = mulberry32(11);
    for (let i = 0; i < N; i++) {
      const even = stage === 2, a = r() * 6.283, k = Math.sqrt(r()) * 46;
      this._p.push({ x: even ? R.x0 + r() * (R.x1 - R.x0) : STICK.x + Math.cos(a) * k, y: even ? R.y0 + r() * (R.y1 - R.y0) : STICK.y - 90 + Math.sin(a) * k, a: r() * 6.283 });
    }
    this._shown = this._count(); this._hold = 0;
    if (reducedMotion() && stage === 1) for (const p of this._p) { p.x = R.x0 + r() * (R.x1 - R.x0); p.y = R.y0 + r() * (R.y1 - R.y0); }
  }
  _count() { let l = 0; for (const p of this._p) if (p.x < MID) l += 1; return [l, N - l]; }
  update(d) {
    const st = this.stage, cage = st === 0, r = Math.random;
    for (const p of this._p) {
      p.a += (r() - 0.5) * TURN * Math.sqrt(d) * 4;
      p.x += Math.cos(p.a) * SPEED * d; p.y += Math.sin(p.a) * SPEED * d;
      if (cage) { const dx = p.x - STICK.x, dy = p.y - (STICK.y - 90), l = Math.hypot(dx, dy); if (l > 50) { p.x = STICK.x + (dx / l) * 50; p.y = STICK.y - 90 + (dy / l) * 50; p.a += 3.14; } }
      if (p.x < R.x0) { p.x = R.x0; p.a = 3.14 - p.a; } if (p.x > R.x1) { p.x = R.x1; p.a = 3.14 - p.a; }
      if (p.y < R.y0) { p.y = R.y0; p.a = -p.a; } if (p.y > R.y1) { p.y = R.y1; p.a = -p.a; }
    }
    this._hold += d;
    if (this._hold > 1) { this._hold = 0; this._shown = this._count(); }
  }
  draw(ctx, c) {
    // a quiet room: plaster wall lit from a window on the right, a stone floor in perspective, a low wooden stool in the corner
    const wall = ctx.createLinearGradient(0, 0, W, 0);
    wall.addColorStop(0, mix(c.s2, c.bgSurface, 0.62)); wall.addColorStop(0.7, mix(c.s2, c.bgSurface, 0.82)); wall.addColorStop(1, mix(c.s2, c.bgSurface, 0.9));
    ctx.fillStyle = wall; ctx.fillRect(0, 0, W, 500);
    const corner = ctx.createLinearGradient(0, 0, 70, 0); corner.addColorStop(0, alpha(darken(c.s2, 0.5), 0.16)); corner.addColorStop(1, alpha(darken(c.s2, 0.5), 0));
    ctx.fillStyle = corner; ctx.fillRect(0, 0, 70, 500);
    // window: sky, frame, sill, a light curtain gathered on one side
    const sky = ctx.createLinearGradient(0, 96, 0, 236); sky.addColorStop(0, mix(c.s1, c.bgSurface, 0.45)); sky.addColorStop(1, mix(c.s1, c.bgSurface, 0.8));
    ctx.fillStyle = sky; ctx.fillRect(370, 96, 110, 140);
    ctx.fillStyle = alpha(c.bgSurface, 0.75); ctx.beginPath(); ctx.ellipse(398, 128, 22, 7, 0, 0, 6.3); ctx.ellipse(414, 124, 16, 8, 0, 0, 6.3); ctx.ellipse(452, 192, 18, 5, 0, 0, 6.3); ctx.fill();
    ctx.strokeStyle = mix(c.s2, c.bgSurface, 0.35); ctx.lineWidth = 7; ctx.strokeRect(370, 96, 110, 140); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(425, 96); ctx.lineTo(425, 236); ctx.moveTo(370, 166); ctx.lineTo(480, 166); ctx.stroke();
    ctx.fillStyle = mix(c.s2, c.bgSurface, 0.5); ctx.fillRect(360, 236, 130, 9); ctx.fillStyle = alpha(darken(c.s2, 0.4), 0.25); ctx.fillRect(360, 245, 130, 4);
    ctx.fillStyle = alpha(mix(c.s6, c.bgSurface, 0.55), 0.85); ctx.beginPath(); ctx.moveTo(470, 88); ctx.bezierCurveTo(498, 140, 474, 200, 496, 250); ctx.lineTo(500, 250); ctx.lineTo(500, 88); ctx.fill();
    ctx.fillStyle = mix(c.s2, c.bgSurface, 0.35); ctx.fillRect(360, 84, 140, 5);
    // light from the window across the wall and floor
    ctx.fillStyle = alpha(c.bgSurface, 0.28); ctx.beginPath(); ctx.moveTo(370, 236); ctx.lineTo(480, 236); ctx.lineTo(330, 640); ctx.lineTo(150, 640); ctx.fill();
    // skirting and floor
    ctx.fillStyle = mix(c.s2, c.label, 0.75); ctx.fillRect(0, 488, W, 12);
    const fl = ctx.createLinearGradient(0, 500, 0, H); fl.addColorStop(0, mix(c.waste, c.bgSurface, 0.62)); fl.addColorStop(1, mix(c.waste, c.bgSurface, 0.45));
    ctx.fillStyle = fl; ctx.fillRect(0, 500, W, H - 500);
    ctx.strokeStyle = alpha(darken(c.waste, 0.3), 0.3); ctx.lineWidth = 1.4; ctx.beginPath();
    for (const y of [522, 552, 592, 640]) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    for (let i = -6; i <= 12; i++) { const xb = i * 64; ctx.moveTo(W / 2 + (xb - W / 2) * 0.55, 500); ctx.lineTo(xb, H); }
    ctx.stroke();
    ctx.fillStyle = alpha(c.bgSurface, 0.3); ctx.beginPath(); ctx.moveTo(250, 500); ctx.lineTo(380, 500); ctx.lineTo(330, 640); ctx.lineTo(160, 640); ctx.fill();
    // low wooden stool with a lit top edge and a shadow
    ctx.fillStyle = alpha(darken(c.waste, 0.5), 0.25); ctx.beginPath(); ctx.ellipse(98, 504, 70, 8, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = darken(c.s8, 0.45); ctx.fillRect(52, 432, 10, 70); ctx.fillRect(128, 432, 10, 70);
    ctx.fillStyle = darken(c.s8, 0.3); ctx.fillRect(40, 420, 110, 13);
    ctx.fillStyle = lighten(c.s8, 0.3); ctx.fillRect(40, 420, 110, 3);
    // brass agarbatti stand, the stick, a glowing tip and a thin wisp of smoke
    ctx.fillStyle = darken(c.s2, 0.2); ctx.beginPath(); ctx.ellipse(STICK.x, 417, 20, 5.5, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = lighten(c.s2, 0.35); ctx.beginPath(); ctx.ellipse(STICK.x - 4, 415.5, 10, 2.2, 0, 0, 6.3); ctx.fill();
    ctx.strokeStyle = darken(c.s8, 0.55); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(STICK.x, 416); ctx.lineTo(STICK.x + 4, 340); ctx.stroke();
    ctx.strokeStyle = darken(c.s8, 0.2); ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(STICK.x + 1.6, 386); ctx.lineTo(STICK.x + 3.7, 342); ctx.stroke();
    ctx.fillStyle = c.s6; ctx.beginPath(); ctx.arc(STICK.x + 4, 339, 3.6, 0, 6.3); ctx.fill();
    ctx.fillStyle = alpha(lighten(c.s2, 0.6), 0.9); ctx.beginPath(); ctx.arc(STICK.x + 4, 339, 1.6, 0, 6.3); ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.18); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(STICK.x + 4, 334); ctx.bezierCurveTo(STICK.x - 8, 314, STICK.x + 16, 300, STICK.x + 2, 280); ctx.stroke();
    // divider
    ctx.setLineDash([6, 9]); ctx.strokeStyle = alpha(c.label, 0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(MID, 40); ctx.lineTo(MID, 500); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = c.s4;
    for (const p of this._p) { ctx.beginPath(); ctx.arc(p.x, p.y, 3.6, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = alpha(lighten(c.s4, 0.5), 0.8);
    for (const p of this._p) { ctx.beginPath(); ctx.arc(p.x - 1.1, p.y - 1.1, 1.2, 0, 6.3); ctx.fill(); }
    const [a, b] = this._shown;
    pill(ctx, c, `left half: ${a}`, MID * 0.56, 28, { size: 25, bg: c.bgSurface, display: true });
    pill(ctx, c, `right half: ${b}`, MID * 1.46, 28, { size: 25, bg: c.bgSurface, display: true });
    const say = [ 'crowded near the stick', a - b > 30 ? 'net movement: left to right' : 'no net movement', 'moving, but no net movement'][this.stage];
    pill(ctx, c, say, W / 2, 600, { size: 26, bg: c.bgSurface, display: true });
    if (this.stage === 1 && a - b > 30) { ctx.strokeStyle = c.accent; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(MID - 60, 530); ctx.lineTo(MID + 46, 530); ctx.stroke(); ctx.fillStyle = c.accent; ctx.beginPath(); ctx.moveTo(MID + 72, 530); ctx.lineTo(MID + 42, 512); ctx.lineTo(MID + 42, 548); ctx.fill(); ctx.lineCap = 'butt'; }
  }
}
