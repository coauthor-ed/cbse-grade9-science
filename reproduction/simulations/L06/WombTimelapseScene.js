// WombTimelapseScene - L06 blk-l06-s07, 4 beats. A real farm animal. Beat 0: a cow with the young one marked inside her body. Beat 1: the calf
// beside her, at the udder. Beat 2: a young one ready at once against one that needs long care: a hen's chick and a calf. Beat 3: the two challenges.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { pill, drawBackdrop, W, H, mix, alpha, mulberry32 } from 'simulations/base/kit/SimLook.js';
import { drawAnimal, animalLook } from 'simulations/base/kit/SimAnimal.js';
import { PLANT_COLOR_MAP, plantColour as lc } from '../shared/PlantArt.js';

// A humped Indian cow in side view, facing right, feet on y. Drawn for this scene: the kit rig reads thin at this size.
function cow(ctx, c, x, y, s, o = {}) {
  const coat = mix(lc(c, 'cloud'), lc(c, 'tuber'), o.calf ? 0.62 : 0.26), dark = mix(coat, lc(c, 'bark'), 0.42), rim = mix(coat, lc(c, 'ink'), 0.55), ink = lc(c, 'ink');
  ctx.save(); ctx.translate(x, y); ctx.scale(o.flip ? -s : s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const P2 = (d, col, w = 2.2) => { const p = new Path2D(d); ctx.fillStyle = col; ctx.fill(p); if (w) { ctx.strokeStyle = rim; ctx.lineWidth = w; ctx.stroke(p); } return p; };
  const g = ctx.createLinearGradient(-90, -220, 30, -40);
  g.addColorStop(0, mix(coat, lc(c, 'cloud'), 0.7)); g.addColorStop(0.5, coat); g.addColorStop(1, dark);
  const legH = 'M-140 -120C-146 -96 -152 -80 -150 -64C-146 -46 -140 -30 -140 -14L-144 -2L-118 -2L-122 -16C-124 -32 -126 -50 -124 -62C-116 -76 -102 -90 -94 -104Z';
  const legF = 'M52 -100C54 -78 60 -60 62 -46C60 -34 60 -22 60 -14L56 -2L82 -2L78 -14C78 -26 80 -36 82 -46C88 -62 96 -80 100 -100Z';
  ctx.save(); ctx.translate(26, -7); P2(legH, dark); P2(legF, dark); ctx.fillStyle = ink; ctx.fill(new Path2D('M-146 -5L-116 -5L-114 2L-148 2Z')); ctx.fill(new Path2D('M54 -5L84 -5L86 2L52 2Z')); ctx.restore();
  if (!o.calf) { P2('M-104 -84C-104 -52 -66 -40 -46 -62Z', mix(lc(c, 'pink'), coat, 0.3)); ctx.strokeStyle = mix(lc(c, 'pink'), rim, 0.6); ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-88, -56); ctx.lineTo(-88, -44); ctx.moveTo(-68, -54); ctx.lineTo(-68, -42); ctx.stroke(); }
  ctx.strokeStyle = coat; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-156, -164); if (o.tailIn) ctx.bezierCurveTo(-150, -130, -136, -96, -128, -66); else ctx.bezierCurveTo(-176, -130, -172, -90, -168, -60); ctx.stroke();
  if (o.tailIn) P2('M-132 -70C-132 -52 -122 -38 -114 -32C-112 -44 -116 -60 -124 -70Z', ink, 0); else P2('M-172 -64C-182 -46 -176 -24 -168 -18C-160 -28 -158 -48 -164 -64Z', ink, 0);
  P2(legH, g); P2(legF, g);
  ctx.fillStyle = ink; ctx.fill(new Path2D('M-146 -5L-116 -5L-114 2L-148 2Z')); ctx.fill(new Path2D('M54 -5L84 -5L86 2L52 2Z'));
  const body = P2(o.calf
    ? 'M-152 -166C-140 -182 -112 -184 -92 -178C-50 -170 0 -170 40 -176C70 -180 100 -184 132 -198C142 -170 134 -134 112 -108C100 -92 84 -86 70 -84C30 -72 -20 -70 -56 -80C-84 -84 -100 -92 -110 -100C-138 -94 -160 -124 -160 -146C-160 -154 -158 -160 -152 -166Z'
    : 'M-152 -170C-140 -188 -112 -192 -92 -184C-50 -172 0 -170 26 -178C38 -210 80 -218 96 -186C110 -182 120 -190 132 -198C144 -170 138 -134 118 -104C114 -86 102 -74 88 -72C60 -54 0 -46 -50 -62C-80 -72 -96 -82 -108 -92C-138 -84 -162 -120 -162 -146C-162 -156 -158 -164 -152 -170Z', g, 2.6);
  ctx.save(); ctx.clip(body);
  ctx.fillStyle = alpha(lc(c, 'bark'), 0.24); ctx.beginPath(); ctx.ellipse(-16, -54, 170, 36, -0.02, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = alpha(lc(c, 'bark'), 0.14); ctx.beginPath(); ctx.ellipse(-124, -124, 40, 60, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(86, -120, 34, 48, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = alpha(lc(c, 'cloud'), 0.6); ctx.beginPath(); ctx.ellipse(-60, -168, 80, 6, 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = alpha(rim, 0.3); ctx.lineWidth = 1.4;
  for (const d of ['M-120 -176C-96 -150 -92 -116 -108 -92', 'M52 -170C66 -140 68 -108 56 -84', 'M-32 -158C-26 -134 -26 -106 -30 -84', 'M-8 -156C-2 -132 -2 -106 -6 -82', 'M16 -154C22 -132 22 -108 18 -84', 'M112 -176C118 -150 112 -120 100 -96', 'M122 -160C124 -136 116 -112 106 -92']) ctx.stroke(new Path2D(d));
  ctx.restore();
  ctx.save(); ctx.translate(126, -176); ctx.rotate(o.head ?? 0); ctx.translate(-126, 176);
  if (!o.calf) { ctx.strokeStyle = mix(lc(c, 'tuber'), ink, 0.35); ctx.lineWidth = 6.5; ctx.beginPath(); ctx.moveTo(150, -200); ctx.quadraticCurveTo(150, -222, 168, -234); ctx.stroke(); }
  P2('M116 -186C96 -186 86 -176 88 -164C104 -162 122 -170 130 -182Z', dark);
  P2('M120 -190C138 -210 166 -206 176 -182C188 -164 200 -150 212 -138C220 -122 204 -108 190 -114C174 -118 160 -128 146 -138C128 -148 116 -168 120 -190Z', g, 2.4);
  P2('M196 -152L212 -138C220 -122 204 -108 190 -114L180 -120C188 -128 194 -140 196 -152Z', mix(lc(c, 'pink'), dark, 0.45), 1.8);
  ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(160, -176, 5.2, 4.4, 0.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = lc(c, 'cloud'); ctx.beginPath(); ctx.arc(158.4, -177.6, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = rim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(151, -183); ctx.quadraticCurveTo(160, -188, 169, -180); ctx.stroke();
  ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(204, -128, 3, 2.2, 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();
}
/** The cow's body opened to a soft window: the uterus and a curled young one, no eyes, no detail. */
function womb(ctx, c, x, y, s) {
  const ink = mix(lc(c, 'pink'), lc(c, 'ink'), 0.45);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createRadialGradient(-14, -14, 6, 0, 0, 70);
  g.addColorStop(0, lc(c, 'pinkLit')); g.addColorStop(1, lc(c, 'pink'));
  ctx.fillStyle = g; ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 66, 46, -0.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = alpha(lc(c, 'cloud'), 0.45); ctx.beginPath(); ctx.ellipse(0, 0, 52, 34, -0.08, 0, Math.PI * 2); ctx.fill();
  const b = new Path2D('M-34 8C-40 -14 -14 -28 12 -24C30 -22 40 -6 30 6C36 12 34 20 26 20C18 20 16 12 12 10C4 18 -6 22 -16 22C-26 22 -32 16 -34 8Z');
  ctx.fillStyle = mix(lc(c, 'tuber'), lc(c, 'cloud'), 0.3); ctx.fill(b); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke(b);
  ctx.beginPath(); ctx.moveTo(-14, 20); ctx.quadraticCurveTo(-4, 12, -12, 4); ctx.moveTo(4, 14); ctx.quadraticCurveTo(10, 6, 2, 0); ctx.stroke();
  ctx.restore();
}
const map = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }]];
const FLOOR = 430;

export class WombTimelapseScene extends SimScene {
  static BEAT_STEP_MAP = map;
  static COLOR_MAP = PLANT_COLOR_MAP;
  static CONTROLS = [];
  static CONTROLS_IN_SIGHT = true;
  static ARIA_LABEL = 'A cow with her young one marked inside her body. Then a calf feeds on her milk. Then young animals that need care. Then the two challenges all animals face: gametes must meet, young ones must survive.';
  enter(stage) { this._b = stage; this.animateFor(700); }
  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    const b = this._b ?? 0, ink = lc(c, 'ink'), snow = lc(c, 'cloud');
    const g = ctx.createLinearGradient(0, 0, 0, FLOOR);
    g.addColorStop(0, lc(c, 'skyPale')); g.addColorStop(1, mix(lc(c, 'skyPale'), lc(c, 'cloud'), 0.7));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, FLOOR + 10);
    // clouds, far hills, a line of neem trees, the pasture falling towards us
    ctx.fillStyle = alpha(lc(c, 'cloud'), 0.85);
    for (const [x, y, k] of [[110, 66, 1], [560, 110, 1.3], [330, 150, 0.7]]) for (const [dx, dy, r] of [[-34, 6, 20], [0, -6, 28], [36, 4, 22], [66, 10, 14]]) { ctx.beginPath(); ctx.arc(x + dx * k, y + dy * k, r * k, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = mix(lc(c, 'hedgeLit'), lc(c, 'skyPale'), 0.55); ctx.beginPath(); ctx.moveTo(0, 250); ctx.quadraticCurveTo(W * 0.25, 170, W * 0.5, 230); ctx.quadraticCurveTo(W * 0.75, 180, W, 240); ctx.lineTo(W, FLOOR); ctx.lineTo(0, FLOOR); ctx.fill();
    for (let i = 0; i < 7; i++) {
      const x = 20 + i * 108 + ((i * 37) % 31), R = 40 + ((i * 13) % 20), y = 300 + ((i * 17) % 18);
      ctx.fillStyle = lc(c, 'bark'); ctx.fillRect(x - 5, y, 10, 70);
      for (const [dx, dy, q, lit] of [[-R * 0.7, 2, 0.72, 0], [R * 0.7, 0, 0.74, 0], [0, -R * 0.2, 0.9, 0], [-R * 0.34, -R * 0.56, 0.62, 1], [R * 0.34, -R * 0.5, 0.58, 1]]) { ctx.fillStyle = lit ? lc(c, 'hedgeLit') : lc(c, 'hedge'); ctx.beginPath(); ctx.ellipse(x + dx, y + dy, R * q, R * q * 0.76, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    const t = ctx.createLinearGradient(0, FLOOR - 40, 0, H);
    t.addColorStop(0, lc(c, 'leafLit')); t.addColorStop(1, lc(c, 'leaf'));
    ctx.fillStyle = t; ctx.beginPath(); ctx.moveTo(0, FLOOR - 30); ctx.quadraticCurveTo(W * 0.4, FLOOR - 52, W, FLOOR - 26); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.strokeStyle = lc(c, 'leafDark'); ctx.lineWidth = 2; ctx.lineCap = 'round';
    const rand = mulberry32(44);
    for (let i = 0; i < 170; i++) { const x = rand() * W, y = FLOOR - 16 + rand() * (H - FLOOR + 20), l = 6 + (y - FLOOR + 20) * 0.16; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y - l * 0.6, x + (rand() - 0.5) * 8, y - l); ctx.stroke(); }
    ctx.globalAlpha = 1;
    const shadow = (x, w) => { ctx.fillStyle = alpha(ink, 0.2); ctx.beginPath(); ctx.ellipse(x, FLOOR + 26, w, 14, 0, 0, Math.PI * 2); ctx.fill(); };
    shadow(b === 2 ? 240 : W / 2 + (b === 0 ? -34 : 74), b === 0 ? 260 : b === 2 ? 150 : 190);
    if (b === 0) {
      cow(ctx, c, W / 2 - 34, FLOOR + 40, 1.62, {});
      womb(ctx, c, W / 2 - 80, FLOOR - 140, 1.3);
      pill(ctx, c, 'The young one grows inside', W / 2, 40, { bg: ink, ink: snow, size: 26, display: true });
    }
    if (b === 1) {
      cow(ctx, c, W / 2 + 74, FLOOR + 34, 1.14, { tailIn: true });
      cow(ctx, c, W / 2 - 150, FLOOR + 50, 0.66, { calf: true, head: 0.3 });
      pill(ctx, c, 'A calf feeds on milk', W / 2, 44, { bg: ink, ink: snow, size: 26, display: true });
    }
    if (b === 2) {
      cow(ctx, c, 276, FLOOR + 24, 0.84, {});
      cow(ctx, c, 104, FLOOR + 60, 0.5, { calf: true, head: 0.26 });
      drawAnimal(ctx, c, { kind: 'goat', x: 570, y: FLOOR + 24, length: 190, facing: -1, pose: 'stand' }, animalLook(c, 'goat'));
      drawAnimal(ctx, c, { kind: 'goat', x: 470, y: FLOOR + 66, length: 110, facing: -1, pose: 'graze' }, animalLook(c, 'goat'));
      pill(ctx, c, 'Young ones and their care', W / 2, 44, { bg: ink, ink: snow, size: 26, display: true });
    }
    if (b === 3) {
      cow(ctx, c, W / 2 + 74, FLOOR + 34, 1.14, {});
      cow(ctx, c, W / 2 - 204, FLOOR + 54, 0.6, { calf: true });
      pill(ctx, c, '1 The gametes must meet', W / 2, 44, { bg: ink, ink: snow, size: 28, display: true });
      pill(ctx, c, '2 The young must survive', W / 2, 96, { bg: ink, ink: snow, size: 28, display: true });
    }
  }
}
