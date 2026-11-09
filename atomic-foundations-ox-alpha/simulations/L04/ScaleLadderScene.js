// ScaleLadderScene - companion to blk-l04-s4, "How Empty Is an Atom?".
//   b0  sizes     zoom into an atom, ten times at a time, by dragging. The shells leave the frame long
//                 before anything shows at the centre; only at one lakh times does the nucleus fill it.
//   b1  cricket   an atom as big as a cricket ground. The learner drags a lens to find the grain of
//                 pepper at the centre of the pitch.
//   b2  paper     a textbook on the bench and a lens on the edge of one page: atoms stack, a million deep
//   b3  takeaway  one atom, with where its space is and where its mass is
// The nucleus on b0 is at true scale at every zoom. The grain on b1 is shown only through the lens.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { alpha, clamp01, darken, drawBackdrop, drawFloor, ellipse, lighten, luma, mix, mulberry32, outBack, rr } from 'simulations/base/kit/SimLook.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawAtom, drawBall, drawDepthField, drawElectron, drawFocus, drawNucleus, drawShell } from 'simulations/base/kit/SimAtom.js';
import { powChip, tag } from './AtomLabels.js';

const TAU = Math.PI * 2;
const S_SIZES = 0, S_GROUND = 1, S_PAGE = 2, S_TAKE = 3;
const A = { x: 340, y: 236, R: 196 };
const ZOOM_MAX = 50;                     // tenths of a power of ten
const G = { x: 340, y: 256, rx: 262, ry: 214 };
const LENS_R = 74;
const LENS0 = { x: 150, y: 150 };
const PEPPER_D = 40;                     // how near the lens must be to show the grain

const zoomNames = ['x 1', 'x 10', 'x 100', 'x 1000', 'x 10,000', 'x 1 lakh'];

export class ScaleLadderScene extends SimScene {
  static BEAT_STEP_MAP = [S_SIZES, S_GROUND, S_PAGE, S_TAKE].map((i) => [{ idx: i, dwellMs: null }]);
  static DRAGGABLE = true;
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'slider', id: 'zoom', label: 'Zoom in', min: 0, max: ZOOM_MAX, step: 1, value: 0, suffix: '' },
  ];
  static ARIA_LABEL = 'How empty an atom is. First you zoom into an atom ten times at a time: the electron shells move out of the frame, and only at one lakh times does the nucleus fill the view. Then the atom becomes a cricket ground, and you drag a lens to find one grain of black pepper at the centre of the pitch, with the electrons out at the boundary. Then a lens on the edge of a textbook page shows atoms stacked about a million deep. Last, one atom shows that nearly all of its space is empty and nearly all of its mass is in the nucleus.';

  constructor(container, config) {
    super(container, config);
    this._z = 0;
    this._lens = { ...LENS0 };
    this._held = false;
    this._foundZoom = false;
    this._foundGrain = false;
  }

  enter(stage) {
    this._held = false;
    this._z = 0;
    this._lens = { ...LENS0 };
    this._foundZoom = false;
    this._foundGrain = false;
    if (stage === S_SIZES) this.requestUiUpdate?.();
  }

  isControlHidden(id) { return id === 'zoom' && this.stage !== S_SIZES; }
  getControlValue(id) { return id === 'zoom' ? String(this._z) : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'zoom') this._setZoom(Number(v));
  }

  _setZoom(z) {
    this._z = Math.max(0, Math.min(ZOOM_MAX, z));
    if (this._z >= ZOOM_MAX && !this._foundZoom) {
      this._foundZoom = true;
      this.celebrate(A.x, A.y, 30, { key: 'zoom', lookAt: true });
    }
    this.requestUiUpdate?.();
  }

  pointerDown(p) {
    if (this.stage === S_SIZES) { this._held = true; this._from = { y: p.y, z: this._z }; }
    if (this.stage === S_GROUND && Math.hypot(p.x - this._lens.x, p.y - this._lens.y) < LENS_R + 26) {
      this._held = true;
      this._from = { dx: this._lens.x - p.x, dy: this._lens.y - p.y };
    }
    this.animateFor?.();
  }

  pointerMove(p) {
    if (!this._held) return false;
    if (this.stage === S_SIZES) { this._setZoom(Math.round(this._from.z + (this._from.y - p.y) / 7)); return true; }
    this._lens.x = Math.max(30, Math.min(650, p.x + this._from.dx));
    this._lens.y = Math.max(30, Math.min(490, p.y + this._from.dy));
    if (Math.hypot(this._lens.x - G.x, this._lens.y - G.y) < PEPPER_D - 12 && !this._foundGrain) {
      this._foundGrain = true;
      this.celebrate(G.x, G.y, 30, { key: 'grain', lookAt: true });
    }
    this.animateFor?.();
    return false;
  }

  pointerUp() { this._held = false; }

  busy() { return this._held || (this.stage === S_PAGE && this.age < 2.4) || (this.stage === S_TAKE && this.age < 1); }

  draw(ctx, c, t) {
    if (this.stage === S_SIZES) this._sizes(ctx, c);
    else if (this.stage === S_GROUND) this._ground(ctx, c);
    else if (this.stage === S_PAGE) this._page(ctx, c);
    else this._take(ctx, c);
  }

  // b0: the true scale at every zoom. e = 0: the atom fills the frame and the nucleus is 0.002 px.
  _sizes(ctx, c) {
    drawDepthField(ctx, c, { x: A.x, y: A.y, seed: 21 });
    const e = this._z / 10, m = 10 ** e;
    const R = A.R * m, r = A.R * 1e-5 * m;
    for (const u of [1, 0.46]) {
      const sr = R * u;
      if (sr > 900) continue;
      drawShell(ctx, c, A.x, A.y, sr, { band: 0, line: 4 });
      const n = u === 1 ? 8 : 2;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + 0.4 * u + (i * TAU) / n;
        drawElectron(ctx, c, A.x + Math.cos(a) * sr, A.y + Math.sin(a) * sr, 9);
      }
    }
    if (r > 0.6) {
      if (r > 6) drawFocus(ctx, c, A.x, A.y, r, 1);
      drawNucleus(ctx, c, A.x, A.y, { p: 11, n: 12, r: Math.max(1, r), solid: r < 22, label: '' });
    }
    tag(ctx, c, zoomNames[Math.min(5, Math.floor(e + 0.001))], A.x, 40, { size: 34, bg: c.raised });
    if (this._z === 0) {
      powChip(ctx, c, 'atom: ', '-10', 'm', 340, 484, {});
      tag(ctx, c, 'drag up', 584, 484, { bg: c.warning });
    } else if (this._z < ZOOM_MAX) tag(ctx, c, 'still empty', 340, 484, { bg: c.raised });
    else powChip(ctx, c, 'nucleus: ', '-15', 'm', 340, 484, { bg: c.proton });
  }

  _grass(c) { return mix(c.s3, c.good, 0.5); }

  // b1: the ground from above, with stands around it.
  _ground(ctx, c) {
    const dark = luma(c.bgDeep) < 0.5;
    drawBackdrop(ctx, c, 'plain', { setting: 'none' });
    const grass = mix(this._grass(c), c.bgDeep, dark ? 0.42 : 0.12);
    const stand = mix(c.stroke, c.bgSurface, dark ? 0.4 : 0.55);
    ellipse(ctx, G.x, G.y + 9, G.rx + 16, G.ry + 16, 0); ctx.fillStyle = darken(stand, 0.3); ctx.fill();
    ellipse(ctx, G.x, G.y, G.rx + 16, G.ry + 16, 0); ctx.fillStyle = stand; ctx.fill();
    const rnd = mulberry32(5);
    for (let i = 0; i < 90; i++) {
      const a = rnd() * TAU, u = 1.02 + rnd() * 0.04;
      ctx.fillStyle = [c.s1, c.s2, c.s4, c.s8][i % 4];
      ctx.beginPath(); ctx.arc(G.x + Math.cos(a) * G.rx * u, G.y + Math.sin(a) * G.ry * u, 3, 0, TAU); ctx.fill();
    }
    ellipse(ctx, G.x, G.y, G.rx, G.ry, 0); ctx.fillStyle = grass; ctx.fill();
    ellipse(ctx, G.x, G.y, G.rx * 0.74, G.ry * 0.74, 0); ctx.fillStyle = lighten(grass, 0.07); ctx.fill();
    ellipse(ctx, G.x, G.y, G.rx * 0.42, G.ry * 0.42, 0); ctx.fillStyle = lighten(grass, 0.13); ctx.fill();
    ellipse(ctx, G.x, G.y, G.rx - 7, G.ry - 7, 0); ctx.strokeStyle = alpha(c.label, 0.9); ctx.lineWidth = 3.5; ctx.stroke();
    this._pitch(ctx, c, 1, 1);
    for (let i = 0; i < 8; i++) {
      const a = 0.3 + (i * TAU) / 8;
      drawElectron(ctx, c, G.x + Math.cos(a) * (G.rx - 18), G.y + Math.sin(a) * (G.ry - 18), 9);
    }
    this._lensDraw(ctx, c, grass);
    tag(ctx, c, this._foundGrain ? 'nucleus: one pepper grain' : 'drag the lens to the centre', 340, 30, { bg: this._foundGrain ? c.good : c.warning });
    tag(ctx, c, 'electrons', 588, 488, { bg: c.electron });
  }

  _pitch(ctx, c, s, a) {
    const w = 34 * s, h = 112 * s;
    ctx.save();
    ctx.globalAlpha *= a;
    rr(ctx, G.x - w / 2, G.y - h / 2, w, h, 3);
    ctx.fillStyle = mix(c.gold, c.waste, 0.45);
    ctx.fill();
    ctx.strokeStyle = alpha(c.label, 0.75); ctx.lineWidth = 2.5;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(G.x - w / 2, G.y + (k * h) / 2.7); ctx.lineTo(G.x + w / 2, G.y + (k * h) / 2.7); ctx.stroke(); }
    ctx.restore();
  }

  // The lens: a chunky rim and handle. Inside, the same ground, much nearer.
  _lensDraw(ctx, c, grass) {
    const { x, y } = this._lens, R = LENS_R, k = 3.2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.75);
    rr(ctx, R - 2, -12, 96, 24, 12); ctx.fillStyle = darken(c.s8, 0.2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip();
    ctx.fillStyle = lighten(grass, 0.16);
    ctx.fillRect(x - R, y - R, R * 2, R * 2);
    ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y);
    this._pitch(ctx, c, 1, 1);
    ctx.restore();
    const d = Math.hypot(x - G.x, y - G.y);
    if (d < PEPPER_D + R * 0.5) {
      const gx = x + (G.x - x) * k, gy = y + (G.y - y) * k;
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip();
      drawBall(ctx, c, gx, gy, 13, darken(c.waste, 0.45), {});
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU);
    ctx.strokeStyle = darken(c.s8, 0.25); ctx.lineWidth = 12; ctx.stroke();
    ctx.strokeStyle = c.s8; ctx.lineWidth = 7; ctx.stroke();
  }

  // b2: a closed textbook on the bench; the lens shows the page edge, atom on atom.
  _page(ctx, c) {
    const age = reducedMotion() ? 9 : this.age;
    drawBackdrop(ctx, c, 'plain');
    drawFloor(ctx, c, 404);
    const bx = 40, by = 342, bw = 250, bh = 62;
    const cover = c.s1;
    rr(ctx, bx, by + bh - 12, bw, 14, 6); ctx.fillStyle = darken(cover, 0.3); ctx.fill();
    rr(ctx, bx + 6, by + 10, bw - 8, bh - 18, 3); ctx.fillStyle = mix(c.label, c.bgSurface, luma(c.bgDeep) < 0.5 ? 0.1 : 0.92); ctx.fill();
    ctx.strokeStyle = alpha(c.stroke, 0.5); ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(bx + 8, by + 10 + (i * (bh - 18)) / 6); ctx.lineTo(bx + bw - 2, by + 10 + (i * (bh - 18)) / 6); ctx.stroke(); }
    rr(ctx, bx, by, bw, 14, 6); ctx.fillStyle = cover; ctx.fill();
    const L = { x: 440, y: 216, r: 168 };
    ctx.beginPath(); ctx.moveTo(bx + bw - 2, by + 30); ctx.lineTo(L.x - L.r * 0.75, L.y - L.r * 0.66); ctx.lineTo(L.x - L.r * 0.75, L.y + L.r * 0.66); ctx.closePath();
    ctx.fillStyle = alpha(c.gold, 0.16); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, TAU);
    ctx.fillStyle = mix(c.bgSurface, c.bgDeep, 0.4); ctx.fill(); ctx.clip();
    const n = 5, step = 66, rows = 6;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < n; i++) {
        const u = clamp01((age - 0.15 - (j + i * 0.3) * 0.2) / 0.34);
        if (u <= 0) continue;
        const x = L.x - ((n - 1) * step) / 2 + i * step + (j % 2 ? step / 2 : 0), y = L.y + 165 - j * step * 0.86;
        ctx.save();
        ctx.translate(x, y - (1 - outBack(u)) * 26);
        drawAtom(ctx, c, 0, 0, { shells: [2, 2], p: 4, n: 4, radius: 30, er: 3.4, solid: true, sym: '' });
        ctx.restore();
      }
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, TAU);
    ctx.strokeStyle = darken(c.s8, 0.25); ctx.lineWidth = 12; ctx.stroke();
    ctx.strokeStyle = c.s8; ctx.lineWidth = 7; ctx.stroke();
    tag(ctx, c, '0.1 mm page', 150, 300, { bg: c.raised });
    tag(ctx, c, 'about 1 million atoms deep', 340, 468, { bg: c.warning, size: 26, scale: outBack(clamp01((age - 1.8) / 0.4)) });
  }

  // b3: one atom, and where its space and mass are.
  _take(ctx, c) {
    const age = reducedMotion() ? 9 : this.age;
    const x = 340, y = 212;
    drawDepthField(ctx, c, { x, y, seed: 8 });
    drawFocus(ctx, c, x, y, 9, 1);
    drawAtom(ctx, c, x, y, { shells: [2, 8, 1], p: 11, n: 12, radius: 178, nucleusR: 9, solid: true, er: 9 });
    const u = clamp01((age - 0.3) / 0.5);
    tag(ctx, c, 'space: nearly all empty', 186, 452, { bg: c.electron, scale: outBack(u) });
    tag(ctx, c, 'mass: nearly all here', 498, 452, { bg: c.proton, scale: outBack(u) });
    ctx.strokeStyle = alpha(c.proton, 0.9); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(498, 432); ctx.quadraticCurveTo(420, 330, x + 14, y + 12); ctx.stroke();
    ctx.lineCap = 'butt';
    tag(ctx, c, 'nucleus drawn too big', 340, 496, { size: 18 });
  }
}
