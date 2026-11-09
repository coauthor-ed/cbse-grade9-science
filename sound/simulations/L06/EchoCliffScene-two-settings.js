// EchoCliffScene-two-settings.js - predict slide "A Small Room and a Far Cliff" (blk-l06-s01, hostRole 'setup',
// 1 beat; a normal 1-beat mount shows the same). Rebuilt 2026-11-03 (whole file).
// Two panels, the same ones the explain slide (EchoCliffScene-gap.js) animates: a small room in cut view, the
// student in the middle with the walls 2 m away on each side ("2 m" on the floor slab); an open field, the
// student at the left and a tall rock cliff far away at the right, with layered ground for depth. Nobody claps
// yet: no arcs, no time lines, no echo word. The predict answer is not on screen.
// People: SimFigure, one still stand pose, autoReach off.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, alpha, lighten, darken, mix, rr, drawShadow } from 'simulations/base/kit/SimLook.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';

const ROOM_M = 2;
const ROOM_Y = 8, FIELD_Y = 268, FX0 = 24, FX1 = 656;
const PXM = 66, RCX = 340;                              // room scale and the student's x in the room
const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export class EchoCliffSceneTwoSettings extends SimScene {
  static HEIGHT = 520;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static ARIA_LABEL = 'Two panels. Top: a small room in cut view, a student standing in the middle with the walls 2 '
    + 'metres away. Bottom: an open field, a student standing at the left and a tall rock cliff far away at the '
    + 'right. Nobody has clapped yet.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  busy() { return false; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    this.room(ctx, c, ROOM_Y);
    this.person(ctx, c, RCX, ROOM_Y + 204, 100, 1);
    this.field(ctx, c, FIELD_Y);
    this.person(ctx, c, 92, FIELD_Y + 222, 96, 2);
    this.probeOut = { setup: this.hostRole === 'setup', stage: this.stage };
  }

  /** A student standing still, hands down, facing the far wall or the cliff. */
  person(ctx, c, x, y, h, i) {
    const spec = figureFor(this, { role: 'student', pose: 'stand', x, y, height: h, facing: 1, i, mood: 'smile', autoReach: false });
    return drawFigure(ctx, c, spec, spec.look);
  }

  // ---- the two settings ------------------------------------------------------------------------------------
  /** A small room in cut view inside a building section: hatched walls 2 m either side of RCX, back wall with a
   *  window, wood floor in perspective, dim neighbouring rooms, a "2 m" dimension on the floor slab. */
  room(ctx, c, oy) {
    const FL = oy + 204, CE = oy + 30, L = RCX - ROOM_M * PXM, R = RCX + ROOM_M * PXM, TH = 20, D = 24;
    const plaster = mix(c.raised, c.gold, 0.12), cut = mix(c.stroke, c.bgSurface, 0.35);
    ctx.save();
    // neighbouring rooms (dim) and the building band
    ctx.fillStyle = mix(c.bgSurface, c.label, 0.07); rr(ctx, FX0, oy + 4, FX1 - FX0, FL - oy + 14, 12); ctx.fill();
    for (const [x0, x1] of [[FX0 + 10, L - TH - 10], [R + TH + 10, FX1 - 10]]) {
      ctx.fillStyle = alpha(plaster, 0.55); ctx.fillRect(x0, CE + 14, x1 - x0, FL - CE - 26);
      ctx.fillStyle = alpha(darken(plaster, 0.12), 0.6); ctx.fillRect(x0, FL - 14, x1 - x0, 14);
    }
    // the neighbour hints: a door on the left, a shelf on the right
    ctx.fillStyle = alpha(mix(c.gold, c.label, 0.35), 0.35); rr(ctx, 70, FL - 120, 56, 106, 4); ctx.fill();
    ctx.fillStyle = alpha(mix(c.gold, c.label, 0.35), 0.3); ctx.fillRect(R + 50, FL - 110, 90, 8); ctx.fillRect(R + 50, FL - 70, 90, 8);
    // the room: back wall, ceiling, side walls, floor in a slight perspective
    const bx0 = L + D, bx1 = R - D, by0 = CE + D * 0.7, by1 = FL - D * 0.8;
    const gw = ctx.createLinearGradient(0, by0, 0, by1);
    gw.addColorStop(0, lighten(plaster, 0.12)); gw.addColorStop(1, darken(plaster, 0.06));
    ctx.fillStyle = gw; ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    ctx.fillStyle = darken(plaster, 0.1);
    ctx.beginPath(); ctx.moveTo(L, CE); ctx.lineTo(bx0, by0); ctx.lineTo(bx0, by1); ctx.lineTo(L, FL); ctx.closePath(); ctx.fill();
    ctx.fillStyle = darken(plaster, 0.16);
    ctx.beginPath(); ctx.moveTo(R, CE); ctx.lineTo(bx1, by0); ctx.lineTo(bx1, by1); ctx.lineTo(R, FL); ctx.closePath(); ctx.fill();
    ctx.fillStyle = lighten(plaster, 0.2);
    ctx.beginPath(); ctx.moveTo(L, CE); ctx.lineTo(R, CE); ctx.lineTo(bx1, by0); ctx.lineTo(bx0, by0); ctx.closePath(); ctx.fill();
    const wood = mix(c.gold, c.flame, 0.3);
    const gf = ctx.createLinearGradient(0, by1, 0, FL);
    gf.addColorStop(0, darken(wood, 0.22)); gf.addColorStop(1, darken(wood, 0.02));
    ctx.fillStyle = gf;
    ctx.beginPath(); ctx.moveTo(L, FL); ctx.lineTo(bx0, by1); ctx.lineTo(bx1, by1); ctx.lineTo(R, FL); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = alpha(darken(wood, 0.45), 0.45); ctx.lineWidth = 1.4;
    for (let i = 1; i < 9; i++) {
      const u = i / 9;
      ctx.beginPath(); ctx.moveTo(bx0 + (bx1 - bx0) * u, by1); ctx.lineTo(L + (R - L) * u, FL); ctx.stroke();
    }
    ctx.fillStyle = darken(plaster, 0.25); ctx.fillRect(bx0, by1 - 6, bx1 - bx0, 6);          // skirting
    // a window on the back wall, sky outside
    const wx = bx0 + 26, wy = by0 + 22, ww = 64, wh = 70;
    const gs = ctx.createLinearGradient(0, wy, 0, wy + wh);
    gs.addColorStop(0, c.setSkyTop); gs.addColorStop(1, c.setSkyLow);
    ctx.fillStyle = gs; ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = darken(plaster, 0.4); ctx.lineWidth = 4; ctx.strokeRect(wx, wy, ww, wh);
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
    ctx.fillStyle = lighten(plaster, 0.3); ctx.fillRect(wx - 6, wy + wh, ww + 12, 5);
    // cut walls, ceiling slab and floor slab: hatched section
    const slab = (x, y, w, h) => {
      ctx.fillStyle = cut; ctx.fillRect(x, y, w, h);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.strokeStyle = alpha(darken(cut, 0.35), 0.55); ctx.lineWidth = 1.3;
      for (let s = x - h; s < x + w; s += 8) { ctx.beginPath(); ctx.moveTo(s, y + h); ctx.lineTo(s + h, y); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = darken(cut, 0.3); ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    };
    slab(FX0, CE - 18, FX1 - FX0, 18);
    slab(FX0, FL, FX1 - FX0, 18);
    slab(L - TH, CE - 18, TH, FL - CE + 36);
    slab(R, CE - 18, TH, FL - CE + 36);
    // the reflecting faces: a lit inner edge
    ctx.strokeStyle = lighten(plaster, 0.35); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(L - 1, CE); ctx.lineTo(L - 1, FL); ctx.moveTo(R + 1, CE); ctx.lineTo(R + 1, FL); ctx.stroke();
    ctx.restore();
    drawShadow(ctx, c, RCX, FL, 30, 6, 0.6);
    this.dim(ctx, c, RCX, R, FL + 9, '2 m');
  }

  /** A dimension line from x1 to x2 at y with the tag in a gap at its middle. */
  dim(ctx, c, x1, x2, y, text) {
    const mid = (x1 + x2) / 2, gap = 30;
    ctx.save(); ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1 + 2, y); ctx.lineTo(mid - gap, y); ctx.moveTo(mid + gap, y); ctx.lineTo(x2 - 2, y); ctx.stroke();
    for (const [x, s] of [[x1, -1], [x2, 1]]) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * 10, y - 5); ctx.lineTo(x - s * 10, y + 5); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    pill(ctx, c, text, mid, y, { bg: c.raised, size: 26, display: true });
  }

  /** The cliff face x at height y (its left edge leans back a little as it rises). */
  cliffFaceX(y) {
    const top = FIELD_Y + 12, G = FIELD_Y + 210;
    const u = (G - y) / (G - top);
    return 548 + u * 14 + Math.sin(u * 9) * 4;
  }

  /** An open field: sky, far hills, a mid meadow, near ground with grass; a tall rock cliff on the right with
   *  strata, a lit face, a grass cap and scree at its foot. */
  field(ctx, c, oy) {
    const G = oy + 222, top = oy + 12, base = oy + 210;
    ctx.save();
    rr(ctx, FX0, oy, FX1 - FX0, 230, 12); ctx.clip();
    const sky = ctx.createLinearGradient(0, oy, 0, G);
    sky.addColorStop(0, c.setSkyTop); sky.addColorStop(1, c.setSkyLow);
    ctx.fillStyle = sky; ctx.fillRect(FX0, oy, FX1 - FX0, 230);
    // far hills, mid meadow, near ground
    const band = (y0, amp, f, ph, col) => {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(FX0, oy + 240);
      for (let x = FX0; x <= FX1; x += 8) ctx.lineTo(x, y0 - amp * (0.6 * Math.sin(x * f + ph) + 0.4 * Math.sin(x * f * 2.3 + ph * 1.7)));
      ctx.lineTo(FX1, oy + 240); ctx.closePath(); ctx.fill();
    };
    band(oy + 150, 16, 0.011, 1.2, mix(c.good, c.setSkyLow, 0.62));
    band(oy + 180, 8, 0.017, 2.4, mix(c.good, c.setSkyLow, 0.4));
    band(oy + 204, 4, 0.03, 0.4, mix(c.good, c.bgSurface, 0.22));
    const gg = ctx.createLinearGradient(0, G - 12, 0, oy + 230);
    gg.addColorStop(0, mix(c.good, c.bgSurface, 0.1)); gg.addColorStop(1, darken(c.good, 0.18));
    ctx.fillStyle = gg; ctx.fillRect(FX0, G - 6, FX1 - FX0, 40);
    ctx.strokeStyle = alpha(darken(c.good, 0.3), 0.7); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const x = FX0 + 8 + hash(i) * (FX1 - FX0 - 16), y = G - 2 + hash(i + 50) * 8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 7); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 8); ctx.stroke();
    }
    // the cliff
    const rock = mix(c.stroke, c.gold, 0.22);
    const pts = [];
    for (let y = base; y >= top; y -= 6) pts.push({ x: this.cliffFaceX(y), y });
    ctx.beginPath(); ctx.moveTo(FX1, base + 4); ctx.lineTo(pts[0].x - 6, base + 4);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(600, top - 6); ctx.lineTo(FX1, top + 2); ctx.closePath();
    const gr = ctx.createLinearGradient(540, 0, FX1, 0);
    gr.addColorStop(0, lighten(rock, 0.22)); gr.addColorStop(0.25, rock); gr.addColorStop(1, darken(rock, 0.28));
    ctx.fillStyle = gr; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = alpha(darken(rock, 0.4), 0.55); ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) {                                // strata
      const y = top + 14 + i * 22 + hash(i) * 6;
      ctx.beginPath(); ctx.moveTo(540, y);
      for (let x = 540; x <= FX1; x += 14) ctx.lineTo(x, y + Math.sin(x * 0.07 + i) * 2.5 + (x - 540) * 0.04);
      ctx.stroke();
    }
    ctx.strokeStyle = alpha(darken(rock, 0.5), 0.45); ctx.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {                                // fissures
      const x = 566 + hash(i + 9) * 80, y = top + 10 + hash(i + 20) * 150;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 18); ctx.lineTo(x + 1, y + 34); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = lighten(rock, 0.4); ctx.lineWidth = 2.5;     // lit face edge
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    ctx.fillStyle = mix(c.good, c.bgSurface, 0.15);               // grass cap
    ctx.beginPath(); ctx.moveTo(pts[pts.length - 1].x - 6, top + 2);
    for (let x = pts[pts.length - 1].x - 6; x <= FX1; x += 10) ctx.lineTo(x, top - 4 - hash(x) * 6);
    ctx.lineTo(FX1, top + 8); ctx.lineTo(pts[pts.length - 1].x, top + 8); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 9; i++) {                                // scree
      const x = 536 + hash(i + 30) * 36, y = base + 2 + hash(i + 40) * 8, r = 3 + hash(i + 60) * 4;
      ctx.fillStyle = i % 2 ? darken(rock, 0.15) : lighten(rock, 0.1);
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.3, r, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
