/**
 * KongthongScene - slide "Kongthong: Names Made of Sound" (L01), 2 beats. New 2026-11-03.
 *
 * b0 green Meghalaya hills in three depths with a valley, plain houses on both hillsides.
 *    A person on the left hillside whistles: sound arcs cross the valley with a short melody
 *    line (note heads on a curve, no stave) floating along; the person on the right hillside
 *    turns toward the sound when the arcs reach them. At rest: arcs mid-valley, listener turned.
 * b1 a mother outside her house holds her baby; a gentle melody line rises above them with
 *    soft arcs toward the child. Calm, warm. No text.
 * People from SimFigure only; no faces on anything else.
 */
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, lighten, darken, mix, clamp01, ellipse, luma } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure, solveFigure } from 'simulations/base/kit/SimFigure.js';

const TAU = Math.PI * 2;

// b0 ground lines
const farY = (x) => 214 + 22 * Math.sin(x / 88 + 0.6) + 12 * Math.sin(x / 31 + 1.3);
const midY = (x) => 268 + 30 * Math.sin(x / 120 + 2.2) + 10 * Math.sin(x / 47);
const leftY = (x) => 286 + 0.0027 * (x - 112) * (x - 112);
const rightY = (x) => 278 + 0.0025 * (x - 566) * (x - 566);
const A = { x: 150 }, B = { x: 548 };
A.y = leftY(A.x); B.y = rightY(B.x);
const FIG_H = 132;
const ARC_V = 120;                // px/s
const ARC_WL = 46;
const T_TURN = 2.6;               // the arcs reach the listener
const TEND0 = 5.2;
const TEND1 = 6;

// b1
const G1 = 470;
const MOM = { x: 400, height: 318 };

export class KongthongScene extends SimScene {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Green hills with a valley between them, small houses on both slopes. A person on one hillside whistles: sound arcs and a few musical notes cross the valley, and a person on the far hillside turns toward the sound. Next, a mother stands outside her house holding her baby, with a gentle line of notes rising above them.';

  constructor(container, config) {
    super(container, config);
    this.cur = 0;
  }

  enter(stage) { this.cur = this.hostRole === 'setup' ? 0 : Math.max(0, Math.min(1, stage | 0)); }
  busy() { return this.age < (this.cur === 0 ? TEND0 : TEND1); }

  draw(ctx, c) {
    if (this.cur === 0) this._valley(ctx, c, Math.min(this.age, TEND0));
    else this._mother(ctx, c, Math.min(this.age, TEND1));
  }

  // ---- shared painting -----------------------------------------------------
  _sky(ctx, c, warm) {
    const g = ctx.createLinearGradient(0, 0, 0, 330);
    g.addColorStop(0, c.setSkyTop);
    g.addColorStop(1, warm ? mix(c.setSkyLow, c.warning, 0.22) : c.setSkyLow);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 680, 520);
    // a soft cloud bank over the far ridge
    ctx.fillStyle = alpha(lighten(c.setSkyLow, 0.6), 0.55);
    for (const [x, y, r] of [[90, 120, 34], [130, 112, 42], [176, 122, 30], [470, 92, 30], [512, 84, 40], [556, 94, 28]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  }

  _ridge(ctx, c, fy, col, top, bot, o = {}) {
    ctx.beginPath(); ctx.moveTo(-4, 524);
    for (let x = -4; x <= 684; x += 8) ctx.lineTo(x, fy(x));
    ctx.lineTo(684, 524); ctx.closePath();
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, lighten(col, o.lit ?? 0.12)); g.addColorStop(1, darken(col, o.shade ?? 0.18));
    ctx.fillStyle = g; ctx.fill();
    // a lit crest line
    ctx.beginPath(); for (let x = -4; x <= 684; x += 8) (x < 0 ? ctx.moveTo(x, fy(x) + 1.5) : ctx.lineTo(x, fy(x) + 1.5));
    ctx.strokeStyle = alpha(lighten(col, 0.45), 0.7); ctx.lineWidth = 2; ctx.stroke();
  }

  _hill(ctx, c, fy, x0, x1, col) {
    ctx.beginPath(); ctx.moveTo(x0, 524);
    for (let x = x0; x <= x1; x += 6) ctx.lineTo(x, fy(x));
    ctx.lineTo(x1, 524); ctx.closePath();
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, lighten(col, 0.1)); g.addColorStop(0.55, col); g.addColorStop(1, darken(col, 0.16));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = darken(col, 0.3); ctx.lineWidth = 2.5;
    ctx.beginPath(); for (let x = x0; x <= x1; x += 6) (x === x0 ? ctx.moveTo(x, fy(x)) : ctx.lineTo(x, fy(x))); ctx.stroke();
    // grass tufts, seeded by position
    ctx.strokeStyle = alpha(darken(col, 0.28), 0.6); ctx.lineWidth = 1.6;
    for (let k = 0; k < 34; k++) {
      const x = x0 + ((k * 73) % Math.max(10, x1 - x0)), y = fy(x) + 14 + ((k * 41) % 120);
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x - 1, y - 7); ctx.moveTo(x + 1, y); ctx.lineTo(x + 3, y - 6); ctx.stroke();
    }
  }

  _pine(ctx, c, x, y, h, col) {
    const w = h * 0.42;
    ctx.fillStyle = darken(c.s8, 0.35); ctx.fillRect(x - 2, y - h * 0.18, 4, h * 0.2);
    for (let i = 0; i < 3; i++) {
      const ty = y - h + i * h * 0.24, by = y - h * 0.14 - (2 - i) * h * 0.16, ww = w * (0.55 + i * 0.22);
      ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x - ww / 2, by); ctx.lineTo(x, by - 3); ctx.closePath();
      ctx.fillStyle = lighten(col, 0.12); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x + ww / 2, by); ctx.lineTo(x, by - 3); ctx.closePath();
      ctx.fillStyle = darken(col, 0.2); ctx.fill();
    }
  }

  _house(ctx, c, x, y, w, o = {}) {
    const h = w * 0.62, side = w * 0.34, wall = mix(c.setSand, c.bgSurface, 0.25), roof = mix(c.s2, c.labelMuted, 0.55);
    ctx.save();
    ctx.fillStyle = alpha(c.bgDeep, 0.18); ellipse(ctx, x + side / 2, y + 2, w * 0.7, 5, 0); ctx.fill();
    // stilts / plinth
    ctx.fillStyle = darken(c.s8, 0.3); ctx.fillRect(x - w / 2, y - 6, w + side, 8);
    // front wall (lit) and side wall (shade)
    ctx.fillStyle = lighten(wall, 0.08); ctx.fillRect(x - w / 2, y - h, w, h - 4);
    ctx.fillStyle = darken(wall, 0.2);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y - 4); ctx.lineTo(x + w / 2 + side, y - 10); ctx.lineTo(x + w / 2 + side, y - h - 6); ctx.lineTo(x + w / 2, y - h); ctx.closePath(); ctx.fill();
    // plank lines
    ctx.strokeStyle = alpha(darken(wall, 0.35), 0.5); ctx.lineWidth = 1.2;
    for (let i = 1; i < 4; i++) { const yy = y - 4 - i * (h - 4) / 4; ctx.beginPath(); ctx.moveTo(x - w / 2, yy); ctx.lineTo(x + w / 2, yy); ctx.stroke(); }
    // door and window
    ctx.fillStyle = darken(c.s8, 0.25); ctx.fillRect(x - w * 0.12, y - h * 0.62, w * 0.24, h * 0.58);
    ctx.fillStyle = alpha(lighten(c.s8, 0.3), 0.8); ctx.fillRect(x - w * 0.12, y - h * 0.62, w * 0.24, 2);
    if (w > 70) { ctx.fillStyle = darken(c.glass, 0.2); ctx.fillRect(x + w * 0.2, y - h * 0.66, w * 0.18, h * 0.26); ctx.strokeStyle = darken(c.s8, 0.3); ctx.lineWidth = 2; ctx.strokeRect(x + w * 0.2, y - h * 0.66, w * 0.18, h * 0.26); }
    // sloped tin roof: front slope lit, the ridge running back
    const ry = y - h, rh = w * 0.4;
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 8, ry + 4); ctx.lineTo(x, ry - rh); ctx.lineTo(x + w / 2 + 8, ry + 4); ctx.closePath();
    ctx.fillStyle = darken(wall, 0.05); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, ry - rh); ctx.lineTo(x + side, ry - rh - 6); ctx.lineTo(x + w / 2 + side + 8, ry - 2); ctx.lineTo(x + w / 2 + 8, ry + 4); ctx.closePath();
    const g = ctx.createLinearGradient(x, ry - rh, x + w / 2 + side, ry);
    g.addColorStop(0, lighten(roof, 0.25)); g.addColorStop(1, darken(roof, 0.15));
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = darken(roof, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = alpha(darken(roof, 0.35), 0.55); ctx.lineWidth = 1.3;
    for (let i = 1; i < 6; i++) { const u = i / 6; ctx.beginPath(); ctx.moveTo(x + side * u, ry - rh - 6 * u); ctx.lineTo(x + w / 2 + 8 + side * u, ry + 4 - 6 * u); ctx.stroke(); }
    ctx.restore();
  }

  _notes(ctx, c, pts, k) {
    const ink = darken(c.s5, 0.25);
    for (const p of pts) {
      const a = (p.a ?? 1) * k;
      if (a <= 0.02) continue;
      ctx.save(); ctx.globalAlpha *= a;
      ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p.x + 9, p.y - 1); ctx.lineTo(p.x + 9, p.y - 34); ctx.quadraticCurveTo(p.x + 14, p.y - 26, p.x + 22, p.y - 22); ctx.stroke();
      ellipse(ctx, p.x, p.y, 11, 8, -0.4); ctx.fillStyle = ink; ctx.fill();
      ellipse(ctx, p.x - 3, p.y - 3, 4, 2.2, -0.4); ctx.fillStyle = alpha(lighten(c.s5, 0.6), 0.8); ctx.fill();
      ctx.restore();
    }
  }

  // Hill green: in dark, a deeper tone (the plain series green reads as bright mint there).
  _green(c) {
    return luma(c.bgDeep) < 0.35 ? darken(mix(c.s3, c.bgDeep, 0.4), 0.12) : c.s3;
  }

  // ---- b0 -------------------------------------------------------------------
  _valley(ctx, c, t) {
    this._sky(ctx, c, false);
    const green = this._green(c);
    this._ridge(ctx, c, farY, mix(mix(green, c.s1, 0.3), c.setSkyLow, 0.62), 190, 300, { lit: 0.05, shade: 0.05 });
    this._ridge(ctx, c, midY, mix(green, c.setSkyLow, 0.38), 240, 380);
    for (const [x, h] of [[300, 30], [330, 36], [372, 28], [412, 34], [438, 26]]) this._pine(ctx, c, x, midY(x) + 8, h, mix(darken(green, 0.3), c.setSkyLow, 0.35));
    // a thread of mist in the valley
    const mg = ctx.createLinearGradient(0, 330, 0, 420);
    mg.addColorStop(0, alpha(lighten(c.setSkyLow, 0.5), 0)); mg.addColorStop(0.5, alpha(lighten(c.setSkyLow, 0.5), 0.45)); mg.addColorStop(1, alpha(lighten(c.setSkyLow, 0.5), 0));
    ctx.fillStyle = mg; ctx.fillRect(200, 330, 300, 90);
    this._hill(ctx, c, rightY, 300, 684, mix(green, c.s1, 0.08));
    this._house(ctx, c, 468, rightY(468) + 6, 62);
    this._house(ctx, c, 628, rightY(628) + 6, 54);
    for (const [x, h] of [[600, 52], [500, 44]]) this._pine(ctx, c, x, rightY(x) + 4, h, darken(green, 0.3));
    this._hill(ctx, c, leftY, -4, 430, darken(green, 0.04));
    this._house(ctx, c, 52, leftY(52) + 6, 66);
    this._house(ctx, c, 246, leftY(246) + 6, 56);
    for (const [x, h] of [[96, 56], [298, 44]]) this._pine(ctx, c, x, leftY(x) + 4, h, darken(green, 0.32));

    // the whistler (left) and the listener (right), who turns once the arcs arrive
    const sa = figureFor(this, { role: 'adult', x: A.x, y: A.y, height: FIG_H, facing: 1, i: 3, pose: 'stand', autoReach: false });
    drawFigure(ctx, c, sa, sa.look);
    const turned = t >= T_TURN;
    const sb = figureFor(this, { role: 'student', x: B.x, y: B.y, height: FIG_H * 0.94, facing: turned ? -1 : 1, i: 5, pose: 'stand', autoReach: false });
    drawFigure(ctx, c, sb, sb.look);
    const ha = solveFigure(sa).anchors.head, hb = solveFigure(sb).anchors.head;
    const mouth = { x: ha.x + ha.r * 0.95, y: ha.y + ha.r * 0.35 };
    const dist = hb.x - mouth.x;
    const dir = Math.atan2(hb.y - mouth.y, dist);
    const span = dist - 30;
    const n = Math.max(1, Math.floor(span / ARC_WL));
    const reach = Math.min(span, 18 + t * ARC_V);
    // arcs leave the whistler and cross the valley; the field of arcs grows from the mouth
    ctx.save(); ctx.beginPath(); ctx.arc(mouth.x, mouth.y, reach, 0, TAU); ctx.clip();
    drawSoundArcs(ctx, c, { x: mouth.x, y: mouth.y, dir, spread: 0.24, n, wavelength: ARC_WL, r0: 16, t, speed: ARC_V * 0.6, strength: 0.95 });
    ctx.restore();
    // the melody floats with the arcs, above them
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const u = (i * 0.17 + t * 0.09) % 1;
      const x = mouth.x + 40 + u * (dist - 90);
      const y = mouth.y - 64 - 34 * Math.sin(Math.PI * u) + (i % 2 ? -10 : 8);
      const a = clamp01(u / 0.12) * clamp01((1 - u) / 0.15) * clamp01((reach - (x - mouth.x)) / 30);
      pts.push({ x, y, a });
    }
    this._notes(ctx, c, pts, 1);
    // the listener hears it: a soft glow at the head once turned
    if (turned) {
      const k = clamp01((t - T_TURN) / 0.5);
      const gr = ctx.createRadialGradient(hb.x, hb.y, hb.r * 0.6, hb.x, hb.y, hb.r * 1.9);
      gr.addColorStop(0, alpha(c.warning, 0)); gr.addColorStop(0.6, alpha(c.warning, 0.35 * k)); gr.addColorStop(1, alpha(c.warning, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(hb.x, hb.y, hb.r * 1.9, 0, TAU); ctx.fill();
    }
  }

  // ---- b1 -------------------------------------------------------------------
  _mother(ctx, c, t) {
    this._sky(ctx, c, true);
    const green = this._green(c);
    this._ridge(ctx, c, (x) => farY(x) + 10, mix(mix(green, c.s1, 0.3), c.setSkyLow, 0.6), 200, 300, { lit: 0.05, shade: 0.05 });
    this._ridge(ctx, c, (x) => midY(x) + 40, mix(green, c.setSkyLow, 0.36), 280, 420);
    for (const [x, h] of [[470, 40], [520, 52], [600, 44], [650, 36]]) this._pine(ctx, c, x, midY(x) + 48, h, mix(darken(green, 0.3), c.setSkyLow, 0.3));
    // the yard in front of the house
    this._ridge(ctx, c, (x) => G1 - 18 + 6 * Math.sin(x / 140), darken(green, 0.02), G1 - 30, 520);
    const yard = mix(c.setSand, green, 0.3);
    ctx.fillStyle = alpha(yard, 0.7); ellipse(ctx, 300, G1 + 10, 250, 26, 0); ctx.fill();
    this._house(ctx, c, 150, G1 - 4, 200);
    this._pine(ctx, c, 620, G1 - 6, 150, darken(green, 0.3));

    const spec = figureFor(this, { role: 'adult', x: MOM.x, y: G1, height: MOM.height, facing: -1, i: 4, pose: 'carry', autoReach: false,
      look: { hairStyle: 'braid', mood: 'smile' } });
    const sk = solveFigure(spec);
    const [h0, h1] = sk.anchors.hand;
    const hd = sk.anchors.head;
    const bundle = () => this._baby(ctx, c, h0, h1);
    drawFigure(ctx, c, spec, { ...spec.look, t }, { between: bundle });
    // her song: soft arcs toward the child, and a melody line rising above them
    const mouth = { x: hd.x - hd.r * 0.95, y: hd.y + hd.r * 0.4 };
    const bx = (h0.x + h1.x) / 2, by = Math.min(h0.y, h1.y) - 10;
    drawSoundArcs(ctx, c, { x: mouth.x, y: mouth.y, dir: Math.atan2(by - mouth.y, bx - 30 - mouth.x), spread: 0.7, n: 2, wavelength: 26, r0: 12, t, strength: 0.55 });
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const u = (i * 0.2 + t * 0.06) % 1;
      pts.push({ x: hd.x - 150 + u * 260, y: hd.y - hd.r - 50 - 46 * Math.sin(Math.PI * u), a: clamp01(u / 0.15) * clamp01((1 - u) / 0.15) * clamp01(t / 0.8) });
    }
    this._notes(ctx, c, pts, 0.9);
  }

  _baby(ctx, c, h0, h1) {
    // a swaddled bundle across both hands, the baby's head (hair, no face) at the end near her chest
    const cx = (h0.x + h1.x) / 2 + 10, cy = (h0.y + h1.y) / 2 - 8;
    const cloth = mix(c.setSand, c.bgSurface, 0.35), len = 38;
    ctx.save();
    ellipse(ctx, cx, cy, len, 19, 0.1);
    const g = ctx.createLinearGradient(cx, cy - 22, cx, cy + 22);
    g.addColorStop(0, lighten(cloth, 0.3)); g.addColorStop(1, darken(cloth, 0.2));
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = darken(cloth, 0.35); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.strokeStyle = alpha(darken(cloth, 0.3), 0.6); ctx.lineWidth = 1.6;
    for (const dx of [-8, 10]) { ctx.beginPath(); ctx.moveTo(cx + dx, cy - 16); ctx.quadraticCurveTo(cx + dx + 7, cy, cx + dx - 2, cy + 16); ctx.stroke(); }
    // head: the back of the head and its soft hair (seen from behind)
    const hx = cx - len + 4, hy = cy - 12, hr = 15;
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, TAU);
    const sg = ctx.createRadialGradient(hx - 5, hy - 6, 2, hx, hy, hr);
    const skin = mix(lighten(c.s8, 0.4), c.warning, 0.12);
    sg.addColorStop(0, lighten(skin, 0.2)); sg.addColorStop(1, darken(skin, 0.18));
    ctx.fillStyle = sg; ctx.fill(); ctx.strokeStyle = darken(skin, 0.4); ctx.lineWidth = 2; ctx.stroke();
    // a soft cap of hair over the crown and the back of the head (the face is turned to her)
    ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, hr, 0, TAU); ctx.clip();
    ctx.beginPath(); ctx.ellipse(hx - 6, hy - 8, hr * 0.95, hr * 0.7, -0.5, 0, TAU);
    ctx.fillStyle = darken(c.s8, 0.45); ctx.fill(); ctx.restore();
    // the hood edge of the wrap around it
    ctx.beginPath(); ctx.arc(hx, hy + 2, hr + 5, -0.1, Math.PI * 0.75); ctx.strokeStyle = lighten(cloth, 0.2); ctx.lineWidth = 7; ctx.stroke();
    ctx.restore();
  }
}
