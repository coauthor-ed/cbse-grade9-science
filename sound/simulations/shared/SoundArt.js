/**
 * SoundArt - course-local art for the sound course (things only this course draws).
 * Same recipe as the kit's SimApparatus: light side, shade side, inner line, darker rim,
 * key light top-left, tokens only, no faces. Every function is pure on its inputs (time
 * t comes in, in s) and returns anchors. No sound arcs or air dots here (SimWave does them).
 * Label size 26 by default. API page: SoundArt.md beside this file.
 *
 *   drawEar(ctx, c, o)            -> { canal, box }
 *   drawPlateAndBeater(ctx, c, o) -> { plate, contact, head, grip, plateGrip }
 *   drawRubberBowl(ctx, c, o)     -> { sheet: { x0, x1, y }, surfaceY(u), grains }
 *   drawJet(ctx, c, o)            -> { nose, tail, box }
 *   drawCracker(ctx, c, o)        -> { top, flashAt, box }
 *   drawSeismograph(ctx, c, o)    -> { at(u), pen, paper, box }
 *   2026-11-03 (K3): drawBoxAndBand, drawEktara, drawTabla, drawBansuri, drawTaal,
 *   drawSitar, drawHeadCutaway, drawVocalCords, drawCricket, drawAstronaut,
 *   drawStationArm, drawBat, drawMoth, drawWaterDish, drawBucketAndSpoons (see below).
 *   2026-11-03 (K4): drawEarCutaway, drawHeadTop, drawDolphin, drawFish, drawSnake,
 *   drawSeaCut, drawShip, drawSubmarine, drawPhone, drawHearingAid, drawSiren,
 *   drawWhistle, drawThermometer, drawStormCloud, drawBolt, drawDrone, drawCar, drawRover,
 *   drawMosquito, drawHall, drawDome, drawBalloon (at the end of the file).
 *   2026-11-03 (KF2 fix round): drawMridangam; lit 0..1 on instruments; drawHearingAid
 *   worn; drawBucketAndSpoons grip 'side'; drawBoxAndBand thick; drawDome depth; see SoundArt.md.
 * A listener: use SimFigure (figureFor / drawFigure, facing 1 or -1, side view); this
 * file has no drawListener. drawEar is the close-up mark.
 * ASCII only.
 */
import { rr, ellipse, darken, lighten, alpha, mix, font, drawShadow, star } from 'simulations/base/kit/SimLook.js';
import { figureLook } from 'simulations/base/kit/SimFigure.js';

const TAU = Math.PI * 2;
const c01 = (v) => Math.max(0, Math.min(1, v));

// Seeded jitter: a small LCG, so a frame depends only on its inputs.
function lcg(seed) {
  let s = (seed >>> 0) || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function polyline(ctx, P, dx = 0, dy = 0) {
  ctx.beginPath();
  P.forEach((p, i) => (i ? ctx.lineTo(p.x + dx, p.y + dy) : ctx.moveTo(p.x + dx, p.y + dy)));
}

function bandOf(ctx, P, wd) {
  const L = [], R = [], n = P.length;
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1, w = (typeof wd === 'function' ? wd(i / Math.max(1, n - 1)) : wd) / 2;
    const nx = (-(b.y - a.y) / l) * w, ny = ((b.x - a.x) / l) * w;
    L.push({ x: P[i].x + nx, y: P[i].y + ny }); R.push({ x: P[i].x - nx, y: P[i].y - ny });
  }
  return () => {
    ctx.beginPath(); ctx.moveTo(L[0].x, L[0].y);
    for (const p of L) ctx.lineTo(p.x, p.y);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y);
    ctx.closePath();
  };
}

// A lit rod along centre line P (see SimApparatus): body, shade, light, inner line, rim.
function rod(ctx, P, wd, col) {
  const path = bandOf(ctx, P, wd), k = typeof wd === 'function' ? wd(0.5) : wd;
  ctx.save();
  path(); ctx.fillStyle = col; ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  polyline(ctx, P, k * 0.42, k * 0.42); ctx.strokeStyle = darken(col, 0.24); ctx.lineWidth = k * 0.62; ctx.stroke();
  polyline(ctx, P, -k * 0.3, -k * 0.3); ctx.strokeStyle = alpha(lighten(col, 0.5), 0.9); ctx.lineWidth = Math.max(1.5, k * 0.2); ctx.stroke();
  if (k > 8) { polyline(ctx, P, k * 0.06, k * 0.06); ctx.strokeStyle = alpha(darken(col, 0.3), 0.45); ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.restore();
  path(); ctx.strokeStyle = darken(col, 0.42); ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}

// Any closed path, lit: body, shade crescent (lower right), light edge (upper left), rim.
function lit(ctx, path, col, s, o = {}) {
  ctx.save();
  path(); ctx.fillStyle = col; ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.fillStyle = darken(col, o.shade ?? 0.2); ctx.fillRect(-1e4, -1e4, 2e4, 2e4);
  ctx.translate(-s * 0.05, -s * 0.045); path(); ctx.fillStyle = col; ctx.fill();
  ctx.translate(s * 0.09, s * 0.08); path(); ctx.strokeStyle = alpha(lighten(col, 0.45), 0.75); ctx.lineWidth = Math.max(2, s * 0.03); ctx.stroke();
  ctx.restore();
  path(); ctx.strokeStyle = o.rim ?? darken(col, 0.4); ctx.lineWidth = o.rimW ?? 2.4; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}

function ball(ctx, x, y, r, col) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = col; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 1.15, 0, TAU); ctx.rect(x + 2 * r, y - 2 * r, -4 * r, 4 * r);
  ctx.fillStyle = darken(col, 0.24); ctx.fill('evenodd');
  ctx.fillStyle = alpha(lighten(col, 0.55), 0.9); ellipse(ctx, x - r * 0.38, y - r * 0.42, r * 0.3, r * 0.18, -0.6); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.strokeStyle = darken(col, 0.34); ctx.lineWidth = 2.2; ctx.stroke();
}

function label(ctx, c, text, x, y, size, o = {}) {
  if (text == null || text === '') return;
  ctx.save();
  ctx.font = font(c, 700, size, true);
  ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = c.bgSurface; ctx.strokeText(String(text), x, y);
  ctx.fillStyle = o.col ?? c.label; ctx.fillText(String(text), x, y);
  ctx.restore();
}

function glow(ctx, x, y, r, col, k) {
  if (k <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, alpha(col, 0.75 * k)); g.addColorStop(1, alpha(col, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

const steelOf = (c) => mix(c.labelMuted, c.bgSurface, 0.12);
const woodOf = (c) => mix(c.s8, c.bgDeep, 0.3);

/**
 * drawEar(ctx, c, o) -> { canal, box }
 *   A human outer ear seen from the side (helix, antihelix, concha, tragus, lobe, the
 *   canal opening): the listener mark. No face.
 *   o: { x, y (canal opening), h = 130 (ear height; >= 90 reads at 390), facing = 1 (the
 *        face is to the right of the ear; -1 left), listen = 0 (0..1 glow at the canal
 *        when sound arrives), skin (colour) | skinTone = 1 (0..3, SimFigure skins),
 *        head = false (true: a plain side-view head behind the ear: skull, hair mass, jaw
 *        and neck, no face features; about 3.1 h tall), hair (colour) | hairTone = 0 }
 */
export function drawEar(ctx, c, o = {}) {
  const x = o.x ?? 120, y = o.y ?? 220, h = o.h ?? 130, f = o.facing === -1 ? -1 : 1, listen = c01(o.listen ?? 0);
  const skin = o.skin ?? figureLook(c, { skin: o.skinTone ?? 1 }).skin;
  const q = (u, v) => [u * h, v * h];
  const B = (a, b, d) => ctx.bezierCurveTo(...q(...a), ...q(...b), ...q(...d));
  const outer = () => {
    ctx.beginPath(); ctx.moveTo(...q(0.05, -0.42));
    B([0.0, -0.57], [-0.1, -0.61], [-0.2, -0.58]);
    B([-0.34, -0.55], [-0.43, -0.37], [-0.4, -0.18]);
    B([-0.38, 0.02], [-0.3, 0.17], [-0.22, 0.3]);
    B([-0.18, 0.44], [-0.08, 0.47], [-0.02, 0.42]);
    B([0.03, 0.37], [0.05, 0.25], [0.05, 0.16]);
    B([0.07, 0.0], [0.09, -0.28], [0.05, -0.42]);
    ctx.closePath();
  };
  ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
  if (o.head) {
    const hair = o.hair ?? figureLook(c, { skin: o.skinTone ?? 1, hair: o.hairTone ?? 0 }).hair;
    const neck = () => { ctx.beginPath(); ctx.moveTo(...q(-0.42, 0.5)); ctx.quadraticCurveTo(...q(-0.4, 1.0), ...q(-0.6, 1.4)); ctx.quadraticCurveTo(...q(0.0, 1.5), ...q(0.5, 1.4)); ctx.quadraticCurveTo(...q(0.36, 1.05), ...q(0.42, 0.7)); ctx.closePath(); };
    lit(ctx, neck, darken(skin, 0.06), h, { shade: 0.22, rim: darken(skin, 0.38) });
    // skull + face side (to +x): back of head round, a soft brow, nose bump, chin, jaw back to the ear
    const head = () => {
      ctx.beginPath(); ctx.moveTo(...q(-0.62, 0.45));
      B([-1.05, 0.1], [-1.0, -1.25], [0.05, -1.35]);
      B([0.6, -1.38], [0.98, -1.0], [1.02, -0.55]);
      B([1.06, -0.35], [1.0, -0.2], [1.12, -0.05]);
      B([1.16, 0.02], [1.08, 0.12], [1.02, 0.16]);
      B([1.04, 0.42], [0.98, 0.62], [0.84, 0.72]);
      B([0.6, 0.86], [0.3, 0.84], [0.12, 0.6]);
      B([-0.05, 0.42], [-0.35, 0.62], [-0.62, 0.45]);
      ctx.closePath();
    };
    lit(ctx, head, skin, h * 2.2, { shade: 0.14, rim: darken(skin, 0.38) });
    // hair mass: crown and back of the head, a hairline above the brow and in front of the ear
    const hairP = () => {
      ctx.beginPath(); ctx.moveTo(...q(-0.6, 0.42));
      B([-1.1, 0.1], [-1.06, -1.32], [0.05, -1.42]);
      B([0.66, -1.46], [1.04, -1.05], [1.0, -0.62]);
      B([0.8, -0.82], [0.45, -0.8], [0.25, -0.6]);
      B([0.12, -0.45], [0.16, -0.25], [0.12, -0.2]);
      B([-0.1, -0.5], [-0.42, -0.3], [-0.45, 0.1]);
      B([-0.46, 0.25], [-0.5, 0.4], [-0.6, 0.42]);
      ctx.closePath();
    };
    lit(ctx, hairP, hair, h * 2, { shade: 0.3, rim: darken(hair, 0.4) });
    ctx.save(); hairP(); ctx.clip(); ctx.strokeStyle = alpha(lighten(hair, 0.5), 0.45); ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(...q(-0.75 + i * 0.12, -0.95 + i * 0.05)); ctx.quadraticCurveTo(...q(-0.5 + i * 0.15, -1.25), ...q(-0.1 + i * 0.18, -1.2)); ctx.stroke(); }
    ctx.restore();
  }
  lit(ctx, outer, skin, h, { shade: 0.16, rim: darken(skin, 0.38) });
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // the helix fold: the rolled rim's inner edge
  ctx.beginPath(); ctx.moveTo(...q(0.0, -0.34));
  B([-0.02, -0.46], [-0.1, -0.5], [-0.18, -0.48]);
  B([-0.28, -0.46], [-0.34, -0.31], [-0.32, -0.17]);
  B([-0.31, -0.02], [-0.26, 0.1], [-0.2, 0.18]);
  ctx.strokeStyle = darken(skin, 0.3); ctx.lineWidth = Math.max(2, h * 0.022); ctx.stroke();
  // the antihelix: a Y ridge, dark groove first, light ridge on top
  const ridge = () => {
    ctx.beginPath(); ctx.moveTo(...q(-0.16, 0.14)); ctx.quadraticCurveTo(...q(-0.23, 0.0), ...q(-0.2, -0.13));
    ctx.quadraticCurveTo(...q(-0.18, -0.28), ...q(-0.1, -0.36));
    ctx.moveTo(...q(-0.2, -0.13)); ctx.quadraticCurveTo(...q(-0.12, -0.2), ...q(-0.03, -0.25));
  };
  ctx.save(); ctx.translate(h * 0.025, h * 0.02); ridge(); ctx.strokeStyle = alpha(darken(skin, 0.3), 0.7); ctx.lineWidth = h * 0.03; ctx.stroke(); ctx.restore();
  ridge(); ctx.strokeStyle = lighten(skin, 0.18); ctx.lineWidth = h * 0.045; ctx.stroke();
  // the concha: the bowl round the canal
  const concha = () => {
    ctx.beginPath(); ctx.moveTo(...q(-0.03, -0.2));
    B([-0.12, -0.2], [-0.17, -0.1], [-0.16, -0.02]);
    B([-0.15, 0.08], [-0.11, 0.16], [-0.06, 0.16]);
    B([0.0, 0.16], [0.03, 0.13], [0.03, 0.08]);
    B([0.03, -0.1], [0.01, -0.2], [-0.03, -0.2]);
    ctx.closePath();
  };
  concha(); ctx.fillStyle = darken(skin, 0.2); ctx.fill();
  ctx.save(); concha(); ctx.clip(); ctx.fillStyle = alpha(darken(skin, 0.4), 0.5); ellipse(ctx, -0.1 * h, -0.08 * h, 0.1 * h, 0.12 * h); ctx.fill(); ctx.restore();
  concha(); ctx.strokeStyle = alpha(darken(skin, 0.38), 0.8); ctx.lineWidth = 1.6; ctx.stroke();
  // the canal opening, the tragus in front of it, the antitragus above the lobe
  glow(ctx, 0, 0, h * 0.34, c.warning, listen);
  ellipse(ctx, 0, 0, h * 0.042, h * 0.058); ctx.fillStyle = darken(skin, 0.62); ctx.fill();
  if (listen > 0.01) { ellipse(ctx, 0, 0, h * 0.07, h * 0.09); ctx.strokeStyle = alpha(c.warning, 0.9 * listen); ctx.lineWidth = 3; ctx.stroke(); }
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(h * 0.06, h * 0.015, h * 0.04, h * 0.065, 0.15, 0, TAU); }, lighten(skin, 0.05), h * 0.25, { rimW: 1.8 });
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(-h * 0.09, h * 0.175, h * 0.045, h * 0.03, -0.4, 0, TAU); }, skin, h * 0.2, { rimW: 1.6 });
  ctx.restore();
  if (o.head) {
    const xa = f > 0 ? x - 1.06 * h : x - 1.18 * h;
    return { canal: { x, y }, box: { x: xa, y: y - 1.46 * h, w: 2.24 * h, h: 3.01 * h }, ear: { x: f > 0 ? x - 0.44 * h : x - 0.1 * h, y: y - 0.62 * h, w: 0.54 * h, h: 1.1 * h } };
  }
  const xa = f > 0 ? x - 0.44 * h : x - 0.1 * h;
  return { canal: { x, y }, box: { x: xa, y: y - 0.62 * h, w: 0.54 * h, h: 1.1 * h } };
}

/**
 * drawPlateAndBeater(ctx, c, o) -> { plate: { x, y, r, rx }, contact, head, grip, plateGrip }
 *   A steel plate (thali) held up nearly edge-on and a wooden beater (rolling-pin shape
 *   with a dark knob, book Fig 10.14). o: { x, y (plate centre), r = 78 (plate radius),
 *   tilt = 0.42 (how much of the face shows), hit = 0 (0..1; 1 = beater on the plate),
 *   ring = 0 (0..1 the plate shivers and its floor shimmers), t = 0, grip: {x,y} (the
 *   beater's held end; default lower right of the plate), beater = true,
 *   swing (0..1, overrides hit: 0 = beater on the plate, 1 = raised fully back),
 *   hard = false (thicker motion lines as the beater comes in), held = false (true: the
 *   plate turned nearly edge-on, tilt 0.2, so a holder's face behind it stays clear) }
 *   grip and plateGrip are hand points for SimFigure (spec.hands); sideGrip: a hand on the
 *   plate's near rim at its side (hold the plate out at the side of the body).
 */
export function drawPlateAndBeater(ctx, c, o = {}) {
  const r = o.r ?? 78, t = o.t ?? 0, ring = c01(o.ring ?? 0), hit = c01(o.hit ?? 0);
  const x = (o.x ?? 330) + ring * 2.2 * Math.sin(TAU * 23 * t), y = o.y ?? 230, rx = r * (o.tilt ?? (o.held ? 0.2 : 0.42));
  const steel = steelOf(c);
  ctx.save();
  // the plate: edge thickness, rim face, the floor, shine
  ellipse(ctx, x + 5, y + 2, rx, r); ctx.fillStyle = darken(steel, 0.4); ctx.fill();
  const plate = () => { ctx.beginPath(); ctx.ellipse(x, y, rx, r, 0, 0, TAU); };
  lit(ctx, plate, lighten(steel, 0.08), r * 0.9, { rim: darken(steel, 0.5) });
  const fx = x + rx * 0.08, fy = y + r * 0.03;
  ellipse(ctx, fx, fy, rx * 0.72, r * 0.8); ctx.fillStyle = darken(steel, 0.08); ctx.fill();
  ctx.save(); ellipse(ctx, fx, fy, rx * 0.72, r * 0.8); ctx.clip();
  ctx.fillStyle = alpha(darken(steel, 0.3), 0.6); ellipse(ctx, fx - rx * 0.25, fy - r * 0.2, rx * 0.72, r * 0.8); ctx.rect(fx + 2 * r, fy - 2 * r, -4 * r, 4 * r); ctx.fill('evenodd');
  ctx.fillStyle = alpha(lighten(steel, 0.75), 0.85); ellipse(ctx, fx - rx * 0.2, fy - r * 0.3, rx * 0.12, r * 0.32, 0.1); ctx.fill();
  if (ring > 0.01) for (let i = 0; i < 3; i++) {
    const k = ring * (0.5 + 0.5 * Math.sin(TAU * 7 * t - i * 1.6));
    ctx.strokeStyle = alpha(lighten(steel, 0.7), 0.75 * k); ctx.lineWidth = 2.5;
    ellipse(ctx, fx, fy, rx * (0.2 + i * 0.17), r * (0.22 + i * 0.19)); ctx.stroke();
  }
  ctx.restore();
  ellipse(ctx, fx, fy, rx * 0.72, r * 0.8); ctx.strokeStyle = darken(steel, 0.35); ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = alpha(lighten(steel, 0.7), 0.9); ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(x, y, rx - 4, r - 4, 0, Math.PI * 1.02, Math.PI * 1.4); ctx.stroke();
  // the beater
  const C = { x: x + rx * 0.22, y: y + r * 0.05 }, G = o.grip ?? { x: x + r * 1.25, y: y + r * 1.0 };
  const bk = o.swing != null ? c01(o.swing) * 2 : 1 - hit;
  const L = Math.hypot(C.x - G.x, C.y - G.y), a0 = Math.atan2(C.y - G.y, C.x - G.x), a = a0 + 0.6 * bk;
  const dx = Math.cos(a), dy = Math.sin(a), H = { x: G.x + L * dx, y: G.y + L * dy };
  if (o.beater !== false) {
    if (bk > 0.04 && bk < 1.3) {
      // motion lines: short arcs trailing the head on the swing path, toward the plate
      const k = 1 - bk / 1.3, wd = o.hard ? 5.5 : 2.6;
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = alpha(darken(c.labelMuted, 0.1), 0.75 * k);
      for (let i = 0; i < 3; i++) {
        ctx.lineWidth = wd * (1 - i * 0.22); ctx.beginPath();
        ctx.arc(G.x, G.y, L * (0.78 + i * 0.12), a + 0.12, a + 0.12 + 0.28 * (1 + bk) * (1 - i * 0.2)); ctx.stroke();
      }
      ctx.restore();
    }
    const back = { x: G.x - dx * r * 0.3, y: G.y - dy * r * 0.3 }, P = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10; P.push({ x: back.x + (H.x - dx * 10 - back.x) * u, y: back.y + (H.y - dy * 10 - back.y) * u }); }
    const wood = woodOf(c);
    rod(ctx, P, (s) => 12 + 9 * Math.sin(Math.PI * Math.min(1, s * 1.1)), wood);
    ball(ctx, back.x - dx * 4, back.y - dy * 4, 7, darken(wood, 0.15));
    ball(ctx, H.x - dx * 4, H.y - dy * 4, 10, darken(wood, 0.5));
    if (hit > 0.92) { glow(ctx, C.x, C.y, 26, c.warning, (hit - 0.92) / 0.08); }
  }
  ctx.restore();
  return { plate: { x, y, r, rx }, contact: C, head: H, grip: G, plateGrip: { x: x - rx * 0.3, y: y + r * 0.92 }, sideGrip: { x: x - rx * 0.95, y: y + r * 0.3 } };
}

/**
 * drawRubberBowl(ctx, c, o) -> { sheet: { x0, x1, y }, surfaceY(u), grains }
 *   A wide glass bowl with a balloon-rubber sheet stretched over the mouth, a band round
 *   the rim, and rice grains on the sheet (book Fig 10.14).
 *   o: { x (centre), y (bench top), w = 230 (mouth width), h = 92 (depth), sheet = 0 (-1..1
 *        the sheet's bulge: its vibration), grains: [{ u (0..1 across), h (px above the
 *        sheet), d (optional 0..1 front-back) }], sheetTone = 4 (balloon rubber), grainTone (default pale rice; a series number overrides), bandTone = 5 }
 *   grains: the drawn centre of each grain (for a scene's labels).
 */
export function drawRubberBowl(ctx, c, o = {}) {
  const x = o.x ?? 560, y = o.y ?? 470, w = o.w ?? 230, h = o.h ?? 92, bul = 12 * Math.max(-1, Math.min(1, o.sheet ?? 0));
  const rx = w / 2, ry = w * 0.075, y0 = y - h, glass = c.glass;
  const sheetCol = c['s' + (o.sheetTone ?? 4)];
  const grainCol = o.grainTone != null ? c['s' + o.grainTone] : lighten(mix(c.gold, c.labelMuted, 0.5), 0.62);
  const band = darken(c['s' + (o.bandTone ?? 5)], 0.25);
  const surfaceY = (u) => y0 - bul * (1 - (2 * u - 1) ** 2);
  ctx.save();
  drawShadow(ctx, c, x, y + 2, rx * 0.75);
  const body = () => {
    ctx.beginPath(); ctx.moveTo(x - rx, y0);
    ctx.bezierCurveTo(x - rx, y0 + h * 0.7, x - rx * 0.6, y - 12, x - rx * 0.45, y - 12);
    ctx.lineTo(x + rx * 0.45, y - 12);
    ctx.bezierCurveTo(x + rx * 0.6, y - 12, x + rx, y0 + h * 0.7, x + rx, y0);
    ctx.ellipse(x, y0, rx, ry, 0, 0, Math.PI); ctx.closePath();
  };
  // foot
  rr(ctx, x - rx * 0.42, y - 14, rx * 0.84, 14, 5); ctx.fillStyle = alpha(glass, 0.45); ctx.fill();
  ctx.strokeStyle = alpha(darken(glass, 0.35), 0.9); ctx.lineWidth = 2; ctx.stroke();
  body(); ctx.fillStyle = alpha(glass, 0.24); ctx.fill();
  ctx.save(); body(); ctx.clip();
  ctx.fillStyle = alpha(darken(glass, 0.3), 0.2); ctx.fillRect(x + rx * 0.45, y0, rx, h + 4);
  ctx.strokeStyle = alpha(lighten(glass, 0.75), 0.8); ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - rx + 16, y0 + 18); ctx.quadraticCurveTo(x - rx + 22, y0 + h * 0.65, x - rx * 0.55, y - 22); ctx.stroke();
  ctx.restore();
  body(); ctx.strokeStyle = alpha(darken(glass, 0.35), 0.95); ctx.lineWidth = 2.6; ctx.stroke();
  // the sheet: thin, taut, translucent balloon rubber over the mouth; a short fold over the rim
  ctx.beginPath(); ctx.ellipse(x, y0, rx + 3, ry + 1, 0, 0, Math.PI); ctx.lineTo(x - rx - 3, y0 + 5);
  ctx.ellipse(x, y0 + 5, rx + 3, ry + 1, 0, Math.PI, 0, true); ctx.closePath();
  ctx.fillStyle = alpha(darken(sheetCol, 0.25), 0.85); ctx.fill();
  ellipse(ctx, x, y0, rx + 2, ry); ctx.fillStyle = alpha(sheetCol, 0.62); ctx.fill();
  ctx.save(); ellipse(ctx, x, y0, rx + 2, ry); ctx.clip();
  ellipse(ctx, x + rx * 0.3, y0 + ry * 0.55, rx * 0.95, ry * 0.8); ctx.fillStyle = alpha(darken(sheetCol, 0.2), 0.35 + Math.max(0, -bul) / 40); ctx.fill();
  ellipse(ctx, x - rx * 0.12, y0 - ry * 0.15 - bul * 0.4, rx * 0.5, ry * 0.42); ctx.fillStyle = alpha(lighten(sheetCol, 0.55), 0.55 + Math.max(0, bul) / 40); ctx.fill();
  ellipse(ctx, x - rx * 0.3, y0 - ry * 0.35 - bul * 0.4, rx * 0.16, ry * 0.14); ctx.fillStyle = alpha(lighten(sheetCol, 0.85), 0.8); ctx.fill();
  ctx.restore();
  ellipse(ctx, x, y0, rx + 2, ry); ctx.strokeStyle = darken(sheetCol, 0.35); ctx.lineWidth = 2.5; ctx.stroke();
  // the elastic band, tight round the rim just below the sheet's edge
  ctx.lineCap = 'butt';
  ctx.strokeStyle = darken(band, 0.4); ctx.lineWidth = 6.5; ctx.beginPath(); ctx.ellipse(x, y0 + 7, rx + 3, ry + 1, 0, 0.02, Math.PI - 0.02); ctx.stroke();
  ctx.strokeStyle = band; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y0 + 6.5, rx + 3, ry + 1, 0, 0.02, Math.PI - 0.02); ctx.stroke();
  ctx.strokeStyle = alpha(lighten(band, 0.6), 0.85); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, y0 + 5.5, rx + 3, ry + 1, 0, 0.5, Math.PI - 0.5); ctx.stroke();
  // grains
  const out = [];
  (o.grains ?? []).forEach((g, i) => {
    const rnd = lcg(i * 7919 + 13), u = c01(g.u ?? 0.5), d = g.d ?? rnd();
    const span = Math.sqrt(Math.max(0, 1 - (2 * d - 1) ** 2));
    const gx = x + (2 * u - 1) * rx * 0.86 * Math.max(0.35, span), sy = surfaceY(u) + (2 * d - 1) * ry * 0.7;
    const gy = sy - 3 - Math.max(0, g.h ?? 0), rot = rnd() * Math.PI;
    if ((g.h ?? 0) > 1.5) { ellipse(ctx, gx, sy, 5, 2); ctx.fillStyle = alpha(darken(sheetCol, 0.5), 0.45); ctx.fill(); }
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(rot);
    ellipse(ctx, 0, 0, 5.5, 2.3); ctx.fillStyle = grainCol; ctx.fill();
    ctx.save(); ellipse(ctx, 0, 0, 5.5, 2.3); ctx.clip(); ctx.fillStyle = darken(grainCol, 0.16); ctx.fillRect(-6, 0.7, 12, 3); ctx.restore();
    ellipse(ctx, 0, 0, 5.5, 2.3); ctx.strokeStyle = darken(grainCol, 0.5); ctx.lineWidth = 1.1; ctx.stroke();
    ctx.restore();
    out.push({ x: gx, y: gy });
  });
  ctx.restore();
  return { sheet: { x0: x - rx, x1: x + rx, y: y0 }, surfaceY, grains: out };
}

/**
 * drawJet(ctx, c, o) -> { nose, tail, box }
 *   A generic fast jet seen from the side: pointed nose, canopy, swept wing, tail fin,
 *   tailplane, nozzle. No markings, no real model, no flag.
 *   o: { x, y (centre), len = 240, dir = 1 (1 flies right, -1 left), tone (body), alpha }
 */
export function drawJet(ctx, c, o = {}) {
  const x = o.x ?? 240, y = o.y ?? 140, len = o.len ?? 240, dir = o.dir === -1 ? -1 : 1, s = len / 100;
  const body = o.tone != null ? c['s' + o.tone] ?? o.tone : mix(c.labelMuted, c.bgSurface, 0.2);
  const P = (pts) => () => { ctx.beginPath(); pts.forEach(([u, v], i) => (i ? ctx.lineTo(u * s, v * s) : ctx.moveTo(u * s, v * s))); ctx.closePath(); };
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.translate(x, y); ctx.scale(dir, 1);
  lit(ctx, P([[8, -4], [-20, -15], [-27, -15], [-18, -5]]), darken(body, 0.3), len * 0.2);
  lit(ctx, P([[-36, -6], [-45, -25], [-51, -25], [-50, -6]]), darken(body, 0.08), len * 0.25);
  const fus = () => {
    ctx.beginPath(); ctx.moveTo(50 * s, 1.5 * s);
    ctx.bezierCurveTo(40 * s, -3 * s, 30 * s, -6.5 * s, 18 * s, -7 * s);
    ctx.lineTo(-44 * s, -7 * s); ctx.lineTo(-51 * s, -5 * s); ctx.lineTo(-51 * s, 5 * s); ctx.lineTo(-38 * s, 7 * s);
    ctx.lineTo(20 * s, 6.5 * s); ctx.bezierCurveTo(34 * s, 6 * s, 44 * s, 4 * s, 50 * s, 1.5 * s); ctx.closePath();
  };
  lit(ctx, fus, body, len * 0.3);
  ctx.beginPath(); ctx.moveTo(30 * s, -6 * s); ctx.bezierCurveTo(24 * s, -14 * s, 12 * s, -14 * s, 4 * s, -7 * s); ctx.closePath();
  ctx.fillStyle = c.glass; ctx.fill();
  ctx.fillStyle = alpha(lighten(c.glass, 0.7), 0.85); ellipse(ctx, 18 * s, -10.5 * s, 5 * s, 1.4 * s, -0.15); ctx.fill();
  ctx.strokeStyle = darken(c.glass, 0.45); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30 * s, -6 * s); ctx.bezierCurveTo(24 * s, -14 * s, 12 * s, -14 * s, 4 * s, -7 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14 * s, 3 * s); ctx.lineTo(2 * s, 3 * s); ctx.lineTo(4 * s, 7 * s); ctx.lineTo(12 * s, 7 * s); ctx.closePath();
  ctx.fillStyle = darken(body, 0.55); ctx.fill();
  lit(ctx, P([[10, 2], [-24, 21], [-34, 21], [-20, 3]]), darken(body, 0.12), len * 0.22);
  lit(ctx, P([[-38, 3], [-48, 12], [-54, 12], [-50, 3]]), darken(body, 0.12), len * 0.12);
  rr(ctx, -56 * s, -4.5 * s, 6 * s, 9 * s, 2 * s); ctx.fillStyle = darken(body, 0.5); ctx.fill();
  ctx.strokeStyle = darken(body, 0.65); ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = alpha(darken(body, 0.35), 0.6); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-6 * s, -6.5 * s); ctx.lineTo(-6 * s, 6 * s); ctx.stroke();
  ctx.restore();
  return { nose: { x: x + dir * 50 * s, y: y + 1.5 * s }, tail: { x: x - dir * 56 * s, y }, box: { x: x - 56 * s, y: y - 26 * s, w: 106 * s, h: 48 * s } };
}

/**
 * drawCracker(ctx, c, o) -> { top, flashAt, box }
 *   A generic paper firecracker standing on the ground (paper tube, two bands, a twisted
 *   top and a fuse), a flash burst and smoke. No brand, no face.
 *   o: { x, y (ground), s = 1 (scale), flash = 0 (0..1 burst), smoke (0..1; default from
 *        flash), t = 0 (smoke drift), tone = 6 (paper), spent = false (torn tube) }
 */
export function drawCracker(ctx, c, o = {}) {
  const x = o.x ?? 120, y = o.y ?? 460, s = o.s ?? 1, flash = c01(o.flash ?? 0), t = o.t ?? 0;
  const smoke = c01(o.smoke ?? flash * 1.4), paper = c['s' + (o.tone ?? 6)];
  const w = 28 * s, hh = 58 * s, top = { x, y: y - hh }, F = { x, y: y - hh * 0.75 };
  ctx.save();
  drawShadow(ctx, c, x, y + 2, w * 0.9);
  const tube = () => { ctx.beginPath(); rr(ctx, x - w / 2, y - hh, w, hh, 5 * s); };
  if (!o.spent) {
    lit(ctx, tube, paper, w * 1.4);
    // paper texture: the spiral wrap seams and short fibres (seeded), clipped to the tube
    ctx.save(); tube(); ctx.clip();
    ctx.strokeStyle = alpha(darken(paper, 0.35), 0.55); ctx.lineWidth = 1.4;
    for (let i = -1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2, y - hh * (i * 0.24)); ctx.lineTo(x + w / 2, y - hh * (i * 0.24 + 0.16)); ctx.stroke(); }
    const rf = lcg(57); ctx.strokeStyle = alpha(lighten(paper, 0.45), 0.6); ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) { const fx = x - w / 2 + rf() * w, fy = y - rf() * hh; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 3 * s, fy - 1.5 * s); ctx.stroke(); }
    ctx.fillStyle = alpha(darken(paper, 0.3), 0.35); ctx.fillRect(x + w * 0.22, y - hh, w * 0.28, hh);
    ctx.restore();
    for (const k of [0.22, 0.72]) {
      ctx.fillStyle = c.gold; ctx.fillRect(x - w / 2 + 1.2, y - hh * (1 - k) - 3 * s, w - 2.4, 6 * s);
      ctx.fillStyle = darken(c.gold, 0.3); ctx.fillRect(x + w * 0.2, y - hh * (1 - k) - 3 * s, w * 0.3 - 1.2, 6 * s);
    }
    tube(); ctx.strokeStyle = darken(paper, 0.45); ctx.lineWidth = 2.2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - w * 0.32, y - hh); ctx.lineTo(x - w * 0.12, y - hh - 9 * s); ctx.lineTo(x + w * 0.12, y - hh - 9 * s); ctx.lineTo(x + w * 0.32, y - hh); ctx.closePath();
    ctx.fillStyle = darken(paper, 0.15); ctx.fill(); ctx.strokeStyle = darken(paper, 0.45); ctx.lineWidth = 1.8; ctx.stroke();
    ctx.strokeStyle = darken(c.labelMuted, 0.3); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - hh - 9 * s); ctx.quadraticCurveTo(x + 6 * s, y - hh - 20 * s, x + 12 * s, y - hh - 22 * s); ctx.stroke();
  } else {
    const rnd = lcg(31);
    ctx.beginPath(); ctx.moveTo(x - w / 2, y);
    for (let i = 0; i <= 6; i++) ctx.lineTo(x - w / 2 + (w * i) / 6, y - hh * (0.35 + 0.25 * rnd()));
    ctx.lineTo(x + w / 2, y); ctx.closePath();
    ctx.fillStyle = darken(paper, 0.35); ctx.fill(); ctx.strokeStyle = darken(paper, 0.6); ctx.lineWidth = 2; ctx.stroke();
  }
  if (smoke > 0.01) {
    const rnd = lcg(7), grey = mix(c.labelMuted, c.bgSurface, 0.35);
    for (let i = 0; i < 7; i++) {
      const px = x + (rnd() - 0.5) * 70 * s * smoke + Math.sin(t * 0.8 + i) * 6 * s;
      const py = F.y - (10 + rnd() * 60) * s * smoke - t * 6 * s, pr = (12 + rnd() * 14) * s * (0.4 + smoke * 0.8);
      ctx.fillStyle = alpha(darken(grey, 0.12), 0.6 * smoke); ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill();
      ctx.fillStyle = alpha(darken(grey, 0.32), 0.45 * smoke); ctx.beginPath(); ctx.arc(px + pr * 0.22, py + pr * 0.28, pr * 0.72, 0, TAU); ctx.fill();
      ctx.fillStyle = alpha(lighten(grey, 0.35), 0.55 * smoke); ctx.beginPath(); ctx.arc(px - pr * 0.3, py - pr * 0.3, pr * 0.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = alpha(darken(grey, 0.4), 0.35 * smoke); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(px, py, pr, 0.2, 2.2); ctx.stroke();
    }
  }
  if (flash > 0.01) {
    glow(ctx, F.x, F.y, 110 * s * flash, c.warning, flash);
    // rays: each a long thin triangle, lit half and shade half, with a darker rim
    const rr0 = lcg(91), nR = 11;
    for (let i = 0; i < nR; i++) {
      const a = -Math.PI / 2 + 0.2 + (i / nR) * TAU, L = (48 + 26 * rr0()) * s * flash, wR = 0.16;
      const tip = { x: F.x + Math.cos(a) * L, y: F.y + Math.sin(a) * L };
      const pL = { x: F.x + Math.cos(a - wR) * 16 * s * flash, y: F.y + Math.sin(a - wR) * 16 * s * flash };
      const pR = { x: F.x + Math.cos(a + wR) * 16 * s * flash, y: F.y + Math.sin(a + wR) * 16 * s * flash };
      ctx.beginPath(); ctx.moveTo(F.x, F.y); ctx.lineTo(pL.x, pL.y); ctx.lineTo(tip.x, tip.y); ctx.lineTo(pR.x, pR.y); ctx.closePath();
      ctx.fillStyle = alpha(c.flame, 0.95 * flash); ctx.fill(); ctx.strokeStyle = alpha(darken(c.flame, 0.35), 0.8 * flash); ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(F.x, F.y); ctx.lineTo(pL.x, pL.y); ctx.lineTo(tip.x, tip.y); ctx.closePath();
      ctx.fillStyle = alpha(lighten(c.warning, 0.45), 0.9 * flash); ctx.fill();
    }
    star(ctx, F.x, F.y, 34 * s * flash, 9, 0.5); ctx.fillStyle = alpha(c.warning, flash); ctx.fill();
    ctx.strokeStyle = alpha(darken(c.flame, 0.2), 0.7 * flash); ctx.lineWidth = 1.6; ctx.stroke();
    glow(ctx, F.x, F.y, 26 * s * flash, lighten(c.warning, 0.9), flash);
    ctx.beginPath(); ctx.arc(F.x, F.y, 13 * s * flash, 0, TAU); ctx.fillStyle = alpha(lighten(c.warning, 0.85), flash); ctx.fill();
    ctx.beginPath(); ctx.arc(F.x - 3 * s * flash, F.y - 3 * s * flash, 5 * s * flash, 0, TAU); ctx.fillStyle = alpha(lighten(c.warning, 0.97), flash); ctx.fill();
  }
  ctx.restore();
  return { top, flashAt: F, box: { x: x - w / 2, y: y - hh - 22 * s, w, h: hh + 22 * s } };
}

/**
 * drawSeismograph(ctx, c, o) -> { at(u), pen, paper, box }
 *   A recording drum with paper on a stand and a pen arm. The paper moves under a fixed
 *   pen at the right end: the newest point (u = upTo) is at the pen, older ones to the left.
 *   o: { x, y (drum centre), len = 300 (drum length), R = 46 (drum radius), trace(u) -> -1..1
 *        (caller values, u = 0..1 over the record), upTo = 1 (how much is recorded), amp
 *        = R * 0.62, marks: [{ u, label }] (a tick and a label above, e.g. 'first wave'),
 *        size = 26, ink = 6 (series tone of the pen line) }
 */
export function drawSeismograph(ctx, c, o = {}) {
  const x = o.x ?? 430, y = o.y ?? 340, len = o.len ?? 300, R = o.R ?? 46, upTo = c01(o.upTo ?? 1);
  const amp = o.amp ?? R * 0.62, size = o.size ?? 26, trace = o.trace ?? (() => 0);
  const x0 = x - len / 2, span = len - 32, penX = x0 + len - 16, steel = steelOf(c), dk = darken(steel, 0.42);
  const paper = lighten(c.labelMuted, 0.62), ink = darken(c['s' + (o.ink ?? 6)], 0.15);
  const X = (u) => penX - (upTo - u) * span, Y = (u) => y + Math.max(-0.88, Math.min(0.88, trace(u) * amp / R)) * R;
  ctx.save();
  const baseY = y + R + 22;
  drawShadow(ctx, c, x + 30, baseY + 17, len * 0.5, 9);
  lit(ctx, () => { ctx.beginPath(); rr(ctx, x0 - 40, baseY, len + 110, 16, 5); }, dk, 30);
  for (const ex of [x0 - 18, x0 + len + 4]) lit(ctx, () => { ctx.beginPath(); rr(ctx, ex, y - 10, 14, baseY - y + 12, 4); }, steel, 30);
  // the drum and its paper
  ellipse(ctx, x0 + len, y, 9, R); ctx.fillStyle = darken(paper, 0.3); ctx.fill(); ctx.strokeStyle = darken(paper, 0.55); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = paper; ctx.fillRect(x0, y - R, len, 2 * R);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y - R, len, 2 * R); ctx.clip();
  ctx.strokeStyle = alpha(c.s1, 0.22); ctx.lineWidth = 1;
  for (let gy = y - R + 8; gy < y + R; gy += 12) { ctx.beginPath(); ctx.moveTo(x0, gy); ctx.lineTo(x0 + len, gy); ctx.stroke(); }
  for (let gx = x0 + 10; gx < x0 + len; gx += 22) { ctx.beginPath(); ctx.moveTo(gx, y - R); ctx.lineTo(gx, y + R); ctx.stroke(); }
  ctx.strokeStyle = alpha(darken(paper, 0.4), 0.6); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + len, y); ctx.stroke();
  // the record
  const P = [];
  for (let i = 0; i <= 240; i++) { const u = (upTo * i) / 240, px = X(u); if (px >= x0 + 4) P.push({ x: px, y: Y(u) }); }
  if (P.length > 1) { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; polyline(ctx, P); ctx.strokeStyle = ink; ctx.lineWidth = 2.6; ctx.stroke(); }
  // the cylinder's light top band and shade bottom band
  ctx.fillStyle = alpha(lighten(paper, 0.6), 0.6); ctx.fillRect(x0, y - R, len, R * 0.22);
  ctx.fillStyle = alpha(darken(paper, 0.35), 0.45); ctx.fillRect(x0, y + R * 0.6, len, R * 0.4);
  ctx.restore();
  ctx.strokeStyle = darken(paper, 0.55); ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(x0, y - R); ctx.lineTo(x0 + len, y - R); ctx.moveTo(x0, y + R); ctx.lineTo(x0 + len, y + R); ctx.stroke();
  ellipse(ctx, x0, y, 9, R); ctx.fillStyle = darken(paper, 0.12); ctx.fill(); ctx.stroke();
  ball(ctx, x0 - 11, y, 7, steel);
  // marks
  for (const m of o.marks ?? []) {
    if (m.u > upTo) continue;
    const mx = X(m.u); if (mx < x0) continue;
    ctx.strokeStyle = c.label; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(mx, y - R - 14); ctx.lineTo(mx, y + R); ctx.stroke(); ctx.setLineDash([]);
    label(ctx, c, m.label, mx, y - R - 14 - size * 0.7, size);
  }
  // the pen arm from a post at the right
  const pen = { x: penX, y: Y(upTo) }, post = { x: x0 + len + 62, y: y - R - 34 };
  rod(ctx, [{ x: post.x, y: baseY }, post], 12, steel);
  rod(ctx, [post, { x: pen.x + 6, y: pen.y - 6 }], 6, steel);
  ball(ctx, post.x, post.y, 8, dk);
  ctx.beginPath(); ctx.moveTo(pen.x + 9, pen.y - 10); ctx.lineTo(pen.x, pen.y); ctx.lineTo(pen.x + 12, pen.y - 4); ctx.closePath();
  ctx.fillStyle = dk; ctx.fill();
  ctx.beginPath(); ctx.arc(pen.x, pen.y, 3, 0, TAU); ctx.fillStyle = ink; ctx.fill();
  ctx.restore();
  return { at: (u) => ({ x: X(u), y: Y(u) }), pen, paper: { x: x0, y: y - R, w: len, h: 2 * R }, box: { x: x0 - 40, y: y - R - 40, w: len + 110, h: 2 * R + 80 } };
}

/* ------------------------------------------------------------------------------------
 * 2026-11-03 additions (K3): parts for L01 (sources: box and band, instruments, voice,
 * insects, water) and L02 (space station, bat and moth). Same recipe as above.
 * ---------------------------------------------------------------------------------- */

const cardOf = (c) => mix(mix(c.s8, c.gold, 0.5), c.labelMuted, 0.32);
const brassOf = (c) => mix(c.gold, c.s2, 0.45);
const bambooOf = (c) => lighten(mix(c.gold, c.s3, 0.22), 0.12);
const gourdOf = (c) => darken(mix(c.s8, c.gold, 0.55), 0.12);
const hideOf = (c) => lighten(mix(c.gold, c.labelMuted, 0.45), 0.58);
const inkOf = (c) => darken(c.s5, 0.84);
const suitOf = (c) => lighten(c.ice, 0.72);
const tissueOf = (c) => lighten(mix(c.s4, c.s6, 0.35), 0.35);
const strapOf = (c) => darken(mix(c.s8, c.gold, 0.3), 0.55);

function shape(ctx, P) { ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); }
const lerpP = (a, b, u) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });

// A fingertip with a nail; the finger points along ang (radians), tip at (x, y), w thick.
function fingertip(ctx, x, y, ang, w, skin) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  lit(ctx, () => rr(ctx, -w * 4.4, -w / 2, w * 4.4, w, w / 2), skin, w * 2, { shade: 0.16, rim: darken(skin, 0.4), rimW: 2 });
  rr(ctx, -w * 0.98, -w * 0.44, w * 0.78, w * 0.5, w * 0.22); ctx.fillStyle = lighten(skin, 0.32); ctx.fill();
  ctx.strokeStyle = darken(skin, 0.3); ctx.lineWidth = 1.3; ctx.stroke();
  ctx.strokeStyle = alpha(darken(skin, 0.35), 0.7); ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-w * 2.1, -w * 0.3); ctx.quadraticCurveTo(-w * 2.0, 0, -w * 2.1, w * 0.3); ctx.stroke();
  ctx.restore();
}

// A taut string a -> b, vibrating with amplitude k (0..1): two faint end positions plus the
// string now; on: highlighted (true or 0..1 strength). Returns its middle now.
// litK: an o.lit value (true / false / 0..1) as a glow strength 0..1.
const litK = (v) => (v === true ? 1 : typeof v === 'number' && isFinite(v) ? c01(v) : 0);
function vibString(ctx, c, a, b, k, t, col, wd, f = 9, on = false) {
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / l, ny = (b.x - a.x) / l, g = litK(on);
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, A = Math.min(9, l * 0.03) * k, d = A * Math.sin(TAU * f * t);
  const path = (e) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx + nx * 2 * e, my + ny * 2 * e, b.x, b.y); };
  ctx.save(); ctx.lineCap = 'round';
  if (g > 0.01) { path(d); ctx.strokeStyle = alpha(c.warning, 0.55 * g); ctx.lineWidth = wd + 9; ctx.stroke(); }
  if (k > 0.01) for (const e of [-A, A]) { path(e); ctx.strokeStyle = alpha(lighten(col, 0.3), 0.35); ctx.lineWidth = wd; ctx.stroke(); }
  path(d); ctx.strokeStyle = darken(col, 0.5); ctx.lineWidth = wd + 1.6; ctx.stroke();
  path(d); ctx.strokeStyle = g > 0.01 ? lighten(col, 0.3 * g) : col; ctx.lineWidth = wd; ctx.stroke();
  ctx.restore();
  return { x: mx + nx * d, y: my + ny * d };
}

/**
 * drawBoxAndBand(ctx, c, o) -> { band: { a, b, mid }, mouth, grip, box } | off: { band, fingers }
 *   An open cardboard box, its open side to the viewer at a slight angle (front rim with the
 *   corrugated cut edge, top and side faces, inner walls), a rubber band stretched across
 *   the opening (book Fig 10.2).
 *   o: { x, y (centre of the opening), w = 180, swing = 0 (signed px, the band's middle
 *        now), ghost = 0 (0..1 two faint end positions at +-amp), amp (default max(12,
 *        |swing|)), tension = 0.5 (0..1: a tighter band is thinner and paler; off: the
 *        fingers sit further apart), off = false (true: the band held between two fingers,
 *        no box), pluck: {x, y} (a finger pulls the band there), skinTone = 1, bandTone = 6,
 *        thick (band thickness in px; default 7 - 3.4 tension) }
 */
export function drawBoxAndBand(ctx, c, o = {}) {
  const x = o.x ?? 200, y = o.y ?? 260, w = o.w ?? 180, hgt = w * 0.86;
  const swing = o.swing ?? 0, ghost = c01(o.ghost ?? 0), ten = c01(o.tension ?? 0.5), A = o.amp ?? Math.max(12, Math.abs(swing));
  const skin = o.skin ?? figureLook(c, { skin: o.skinTone ?? 1 }).skin;
  const bandCol = c['s' + (o.bandTone ?? 6)], bw = o.thick ?? 7 - 3.4 * ten, fw = Math.max(14, w * 0.11);
  const bandPath = (a, b, m, pl) => {
    ctx.beginPath(); ctx.moveTo(a.x, a.y);
    if (pl) { ctx.lineTo(pl.x, pl.y); ctx.lineTo(b.x, b.y); }
    else ctx.quadraticCurveTo(2 * m.x - (a.x + b.x) / 2, 2 * m.y - (a.y + b.y) / 2, b.x, b.y);
  };
  const strokeBand = (a, b, m, pl, k = 1) => {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    bandPath(a, b, m, pl); ctx.strokeStyle = alpha(darken(bandCol, 0.45), k); ctx.lineWidth = bw + 2.6; ctx.stroke();
    bandPath(a, b, m, pl); ctx.strokeStyle = alpha(lighten(bandCol, 0.16 * ten), k); ctx.lineWidth = bw; ctx.stroke();
    if (k > 0.6) {
      ctx.save(); ctx.translate(bw * 0.22, bw * 0.22); bandPath(a, b, m, pl); ctx.strokeStyle = alpha(darken(bandCol, 0.22), 0.8); ctx.lineWidth = bw * 0.45; ctx.stroke(); ctx.restore();
      ctx.translate(-bw * 0.2, -bw * 0.2); bandPath(a, b, m, pl); ctx.strokeStyle = alpha(lighten(bandCol, 0.55), 0.85); ctx.lineWidth = Math.max(1.2, bw * 0.28); ctx.stroke();
    }
    ctx.restore();
  };
  ctx.save();
  if (o.off) {
    const sep = w * (0.55 + 0.45 * ten), a = { x: x - sep / 2, y }, b = { x: x + sep / 2, y }, mid = { x, y: y + swing };
    fingertip(ctx, a.x, y - fw * 0.75, -Math.PI / 2 - 0.12, fw, skin);
    fingertip(ctx, b.x, y - fw * 0.75, -Math.PI / 2 + 0.12, fw, skin);
    if (ghost > 0.01) for (const e of [-A, A]) strokeBand(a, b, { x, y: y + e }, null, 0.3 * ghost);
    const gap = bw * 1.1;
    strokeBand({ x: a.x, y: a.y + gap }, { x: b.x, y: b.y + gap }, { x, y: mid.y + gap }, o.pluck ? { x: o.pluck.x, y: o.pluck.y + gap } : null);
    strokeBand(a, b, mid, o.pluck);
    if (o.pluck) fingertip(ctx, o.pluck.x + fw * 0.2, o.pluck.y + fw * 0.4, -Math.PI / 2 + 0.5, fw * 0.9, skin);
    ctx.restore();
    return { band: { a, b, mid: o.pluck ?? mid }, fingers: [{ x: a.x, y: a.y - fw * 0.75 }, { x: b.x, y: b.y - fw * 0.75 }], box: { x: a.x - fw, y: y - fw * 5, w: sep + 2 * fw, h: fw * 6 } };
  }
  const dx = w * 0.3, dy = -w * 0.2, tk = Math.max(5, w * 0.045);
  const x0 = x - w / 2, y0 = y - hgt / 2, x1 = x + w / 2, y1 = y + hgt / 2;
  const F = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  const B = F.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  const card = cardOf(c);
  if (o.shadow !== false) drawShadow(ctx, c, x + dx * 0.5, y1 + 4, w * 0.66);
  // outside: top face (lit) and right face (shade), with a crease and a tape strip
  lit(ctx, () => shape(ctx, [F[0], F[1], B[1], B[0]]), lighten(card, 0.14), w * 0.5, { shade: 0.08, rim: darken(card, 0.45) });
  lit(ctx, () => shape(ctx, [F[1], B[1], B[2], F[2]]), darken(card, 0.18), w * 0.5, { shade: 0.12, rim: darken(card, 0.5) });
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = alpha(darken(card, 0.3), 0.55); ctx.lineWidth = 1.5;
  const q0 = lerpP(F[0], B[0], 0.5), q1 = lerpP(F[1], B[1], 0.5);
  ctx.beginPath(); ctx.moveTo(q0.x, q0.y); ctx.lineTo(q1.x, q1.y); ctx.stroke();
  const r0 = lerpP(F[1], F[2], 0.15), r1 = lerpP(B[1], B[2], 0.15);
  ctx.beginPath(); ctx.moveTo(r0.x + 4, r0.y); ctx.lineTo(r1.x - 2, r1.y + 2); ctx.stroke();
  const tp = (u) => lerpP(lerpP(F[0], F[1], u), lerpP(B[0], B[1], u), 0.5);
  ctx.restore();
  // inside, seen through the opening: left wall, floor, back wall, a shadow under the top
  const ix0 = x0 + tk, iy0 = y0 + tk, ix1 = x1 - tk, iy1 = y1 - tk;
  ctx.save(); ctx.beginPath(); ctx.rect(ix0, iy0, ix1 - ix0, iy1 - iy0); ctx.clip();
  ctx.fillStyle = darken(card, 0.2); ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0);
  shape(ctx, [{ x: ix0, y: iy1 }, { x: ix1 + dx, y: iy1 }, { x: ix1 + dx, y: iy1 + dy }, { x: ix0 + dx, y: iy1 + dy }]); ctx.fillStyle = darken(card, 0.3); ctx.fill();
  ctx.fillStyle = darken(card, 0.4); ctx.fillRect(ix0 + dx, iy0 + dy, ix1 - ix0, iy1 - iy0);
  const sg = ctx.createLinearGradient(0, iy0, 0, iy0 + hgt * 0.45);
  sg.addColorStop(0, alpha(darken(card, 0.7), 0.5)); sg.addColorStop(1, alpha(darken(card, 0.7), 0));
  ctx.fillStyle = sg; ctx.fillRect(ix0, iy0, ix1 - ix0, hgt * 0.45);
  ctx.strokeStyle = alpha(darken(card, 0.6), 0.7); ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(ix0, iy1); ctx.lineTo(ix0 + dx, iy1 + dy); ctx.lineTo(ix1 + dx, iy1 + dy);
  ctx.moveTo(ix0 + dx, iy1 + dy); ctx.lineTo(ix0 + dx, iy0 + dy); ctx.stroke();
  ctx.restore();
  // the front rim: the cut edge of the board, corrugated
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, w, hgt); ctx.rect(ix1, iy0, ix0 - ix1, iy1 - iy0);
  ctx.fillStyle = lighten(card, 0.22); ctx.fill('evenodd');
  ctx.strokeStyle = alpha(darken(card, 0.38), 0.85); ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
  const zig = (ax, ay, bx, by) => {
    const lx = bx - ax, ly = by - ay, l = Math.hypot(lx, ly), nx = -ly / l, ny = lx / l, n = Math.max(2, Math.round(l / (tk * 0.6)));
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const u = i / n, s = (i % 2 ? 1 : -1) * tk * 0.26; const px = ax + lx * u + nx * s, py = ay + ly * u + ny * s; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
  };
  const h2 = tk / 2;
  zig(x0 + h2, y0 + h2, x1 - h2, y0 + h2); zig(x0 + h2, y1 - h2, x1 - h2, y1 - h2);
  zig(x0 + h2, y0 + tk, x0 + h2, y1 - tk); zig(x1 - h2, y0 + tk, x1 - h2, y1 - tk);
  ctx.strokeStyle = darken(card, 0.5); ctx.lineWidth = 2.2;
  ctx.strokeRect(x0, y0, w, hgt); ctx.lineWidth = 1.6; ctx.strokeRect(ix0, iy0, ix1 - ix0, iy1 - iy0);
  ctx.strokeStyle = alpha(lighten(card, 0.6), 0.9); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x0 + 1.5, y1 - 2); ctx.lineTo(x0 + 1.5, y0 + 1.5); ctx.lineTo(x1 - 2, y0 + 1.5); ctx.stroke();
  ctx.restore();
  // the band: across the opening, wrapped over the top and bottom rims
  const bx = x + (o.bandAt ?? 0) * w, a = { x: bx, y: y0 + 1 }, b = { x: bx, y: y1 - 1 }, mid = { x: bx + swing, y };
  void tp; strokeBand({ x: bx, y: y0 - 1 }, { x: bx + dx * 0.55, y: y0 + dy * 0.55 }, { x: bx + dx * 0.27, y: y0 + dy * 0.27 }, null);
  if (ghost > 0.01) for (const e of [-A, A]) strokeBand(a, b, { x: bx + e, y }, null, 0.32 * ghost);
  strokeBand(a, b, mid, o.pluck);
  if (o.pluck) fingertip(ctx, o.pluck.x + fw * 0.15, o.pluck.y + fw * 0.1, Math.PI - 0.5, fw * 0.9, skin);
  ctx.restore();
  return { band: { a, b, mid: o.pluck ?? mid }, mouth: { x: ix0, y: iy0, w: ix1 - ix0, h: iy1 - iy0 }, grip: { x: x0 + w * 0.25, y: y1 }, box: { x: x0, y: y0 + dy, w: w + dx, h: hgt - dy } };
}

/**
 * Instruments. All take { x, y, vib = 0 (0..1 the vibrating part moving), lit = false
 * (the vibrating part highlighted, for a TapLight chip; true or a number 0..1 = glow
 * strength, to fade it), t (s) } and return
 * { vib: {x, y} (the vibrating part now), part (its box), box (the whole instrument) }.
 *
 * drawEktara(ctx, c, o): upright; o.x centre, o.y bottom, h = 300. A gourd with a skin
 *   top, two split-bamboo prongs to a peg, one string (the vibrating part).
 *   Also returns string: { a (skin end), b (peg end), mid }.
 */
export function drawEktara(ctx, c, o = {}) {
  const x = o.x ?? 120, y = o.y ?? 470, h = o.h ?? 300, k = c01(o.vib ?? 0), t = o.t ?? 0;
  const gx = x, gy = y - h * 0.17, grx = h * 0.18, gry = h * 0.16, sy = y - h * 0.28;
  const gourd = gourdOf(c), bam = bambooOf(c), top = { x, y: y - h * 0.92 };
  ctx.save();
  drawShadow(ctx, c, x, y, grx * 0.8);
  // the prongs, behind the gourd
  rod(ctx, [{ x: x - grx * 0.85, y: gy }, { x: x - h * 0.03, y: top.y }], h * 0.034, bam);
  rod(ctx, [{ x: x + grx * 0.85, y: gy }, { x: x + h * 0.03, y: top.y }], h * 0.034, darken(bam, 0.08));
  ball(ctx, x, top.y - 2, h * 0.026, darken(bam, 0.2));
  // gourd, ribs, stem nub
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(gx, gy, grx, gry, 0, 0, TAU); }, gourd, grx * 2, { shade: 0.22 });
  ctx.save(); ctx.beginPath(); ctx.ellipse(gx, gy, grx, gry, 0, 0, TAU); ctx.clip();
  ctx.strokeStyle = alpha(darken(gourd, 0.3), 0.5); ctx.lineWidth = 2;
  for (const e of [-0.55, 0.55]) { ctx.beginPath(); ctx.ellipse(gx, gy, grx * Math.abs(e), gry, 0, e < 0 ? Math.PI / 2 : -Math.PI / 2, e < 0 ? Math.PI * 1.5 : Math.PI / 2); ctx.stroke(); }
  ctx.restore();
  ball(ctx, gx, y - 2, h * 0.018, darken(gourd, 0.35));
  // skin over the cut top, with a binding cord round it
  const skin = hideOf(c), srx = grx * 0.78, sry = gry * 0.24;
  ellipse(ctx, gx, sy, srx, sry); ctx.fillStyle = skin; ctx.fill();
  ctx.save(); ellipse(ctx, gx, sy, srx, sry); ctx.clip(); ellipse(ctx, gx + srx * 0.25, sy + sry * 0.4, srx, sry); ctx.fillStyle = alpha(darken(skin, 0.25), 0.6); ctx.fill(); ctx.restore();
  ellipse(ctx, gx, sy, srx, sry); ctx.strokeStyle = darken(gourd, 0.5); ctx.lineWidth = 3.2; ctx.stroke();
  ctx.strokeStyle = alpha(lighten(gourd, 0.4), 0.8); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(gx, sy - 1.5, srx, sry, 0, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
  // peg across the top
  rod(ctx, [{ x: x - h * 0.08, y: top.y + h * 0.03 }, { x: x + h * 0.09, y: top.y + h * 0.03 }], h * 0.022, woodOf(c));
  ball(ctx, x + h * 0.1, top.y + h * 0.03, h * 0.02, darken(woodOf(c), 0.2));
  // the string
  const a = { x, y: sy }, b = { x, y: top.y + h * 0.03 };
  const mid = vibString(ctx, c, a, b, k, t, steelOf(c), 2.2, 9, litK(o.lit));
  ball(ctx, a.x, a.y, 3.2, darken(steelOf(c), 0.3));
  ctx.restore();
  return { string: { a, b, mid }, vib: mid, part: { x: x - 10, y: b.y, w: 20, h: a.y - b.y }, box: { x: x - grx, y: y - h, w: grx * 2, h } };
}

/**
 * drawTabla(ctx, c, o): a dayan seen a little from above; o.x centre, o.y floor, r = 64
 *   (head radius). Wooden shell, leather straps with wooden blocks, braided rim, skin with
 *   the black syaahi circle (o.syaahi = true). The skin vibrates as concentric shimmer.
 *   Also returns skin: { cx, cy, rx, ry }.
 */
export function drawTabla(ctx, c, o = {}) {
  const x = o.x ?? 300, y = o.y ?? 470, r = o.r ?? 64, h = r * 1.55, k = c01(o.vib ?? 0), t = o.t ?? 0;
  const ty = y - h, ry = r * 0.32, bry = r * 0.26, wood = woodOf(c), strap = strapOf(c), skin = hideOf(c);
  ctx.save();
  drawShadow(ctx, c, x, y + 2, r * 1.05);
  const shell = () => {
    ctx.beginPath(); ctx.moveTo(x - r, ty);
    ctx.bezierCurveTo(x - r * 1.2, ty + h * 0.35, x - r * 1.12, y - h * 0.2, x - r * 0.92, y);
    ctx.ellipse(x, y, r * 0.92, bry, 0, Math.PI, 0, true);
    ctx.bezierCurveTo(x + r * 1.12, y - h * 0.2, x + r * 1.2, ty + h * 0.35, x + r, ty);
    ctx.ellipse(x, ty, r, ry, 0, 0, Math.PI); ctx.closePath();
  };
  lit(ctx, shell, wood, r * 2, { shade: 0.26 });
  // straps and blocks round the shell (front half)
  ctx.save(); shell(); ctx.clip(); ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const th = -Math.PI / 2 + (i + 0.5) * Math.PI / 12, s = Math.cos(th), cz = Math.sin(th);
    const p0 = { x: x + r * cz, y: ty + ry * s }, p2 = { x: x + r * 0.92 * cz, y: y + bry * s }, p1 = { x: x + r * 1.18 * cz, y: ty + h * 0.5 + ry * s };
    ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    ctx.strokeStyle = darken(strap, 0.3); ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = strap; ctx.lineWidth = 3; ctx.stroke();
    if (i % 2 === 0) {
      const g = { x: x + r * 1.13 * cz, y: ty + h * 0.62 + ry * s }, bw = 7 + 5 * s;
      lit(ctx, () => rr(ctx, g.x - bw / 2, g.y - 12, bw, 24, 3), lighten(mix(wood, c.labelMuted, 0.35), 0.08), 20, { rimW: 1.6 });
    }
  }
  ctx.restore();
  // braided rim, skin, the outer ring and the syaahi
  ctx.lineCap = 'butt';
  ellipse(ctx, x, ty, r + 2, ry + 1.5); ctx.strokeStyle = darken(strap, 0.2); ctx.lineWidth = 8; ctx.stroke();
  ctx.strokeStyle = alpha(lighten(strap, 0.45), 0.8); ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
  ellipse(ctx, x, ty, r + 2, ry + 1.5); ctx.stroke(); ctx.setLineDash([]);
  const gl = litK(o.lit);
  glow(ctx, x, ty, r * 1.3, c.warning, 0.9 * gl);
  ellipse(ctx, x, ty, r - 2, ry - 1.5); ctx.fillStyle = skin; ctx.fill();
  ctx.save(); ellipse(ctx, x, ty, r - 2, ry - 1.5); ctx.clip();
  ellipse(ctx, x + r * 0.3, ty + ry * 0.4, r, ry); ctx.fillStyle = alpha(darken(skin, 0.2), 0.5); ctx.fill();
  ellipse(ctx, x, ty, r * 0.82, ry * 0.8); ctx.strokeStyle = alpha(darken(skin, 0.28), 0.7); ctx.lineWidth = 2; ctx.stroke();
  if (o.syaahi !== false) {
    const ink = inkOf(c);
    ellipse(ctx, x, ty, r * 0.38, ry * 0.38); ctx.fillStyle = ink; ctx.fill();
    ellipse(ctx, x - r * 0.1, ty - ry * 0.1, r * 0.14, ry * 0.1); ctx.fillStyle = alpha(lighten(ink, 0.5), 0.6); ctx.fill();
  }
  if (k > 0.01) for (let i = 0; i < 3; i++) {
    const u = (t * 1.6 + i / 3) % 1;
    ellipse(ctx, x, ty, r * (0.2 + 0.75 * u), ry * (0.2 + 0.75 * u));
    ctx.strokeStyle = alpha(lighten(skin, 0.7), k * (1 - u) * 0.95); ctx.lineWidth = 3; ctx.stroke();
  }
  ctx.restore();
  ellipse(ctx, x, ty, r - 2, ry - 1.5); ctx.strokeStyle = gl > 0.01 ? mix(darken(skin, 0.45), c.warning, gl) : darken(skin, 0.45); ctx.lineWidth = 2 + gl; ctx.stroke();
  ctx.restore();
  return { skin: { cx: x, cy: ty, rx: r, ry }, vib: { x, y: ty }, part: { x: x - r, y: ty - ry, w: 2 * r, h: 2 * ry }, box: { x: x - r * 1.15, y: ty - ry, w: r * 2.3, h: h + ry + bry } };
}

/**
 * drawBansuri(ctx, c, o): a bamboo flute lying level; o.x, o.y centre, len = 420, wd = 26,
 *   dir = 1 (blowing hole at the left; -1 right). Nodes, thread bindings, blowing hole, six
 *   finger holes. o.cutaway = false: true shows the hollow inside (the near wall cut away)
 *   with the air column as a lit region (the vibrating part). Also returns air (rect of the
 *   air column: put SimWave dots there) and blow (the blowing hole).
 */
export function drawBansuri(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 200, len = o.len ?? 420, wd = o.wd ?? 26, dir = o.dir === -1 ? -1 : 1;
  const k = c01(o.vib ?? 0), t = o.t ?? 0, gl = litK(o.lit), bam = bambooOf(c), X = (u) => x + dir * (u - 0.5) * len;
  const xa = x - len / 2, top = y - wd / 2;
  const tube = () => rr(ctx, xa, top, len, wd, wd * 0.4);
  ctx.save();
  lit(ctx, tube, bam, wd * 2.2, { shade: 0.22 });
  const air = { x: Math.min(X(0.1), X(0.97)), y: y - wd * 0.3, w: len * 0.87, h: wd * 0.6 };
  if (o.cutaway) {
    // the cut: wall edges top and bottom, the dark bore, the air column glowing
    ctx.save(); rr(ctx, air.x - 2, y - wd * 0.36, air.w + 4, wd * 0.72, 3); ctx.clip();
    ctx.fillStyle = darken(bam, 0.55); ctx.fillRect(air.x - 4, y - wd, air.w + 8, wd * 2);
    const pulse = k * (0.55 + 0.45 * Math.sin(TAU * 3 * t));
    ctx.fillStyle = alpha(darken(bam, 0.8), 0.45); ctx.fillRect(air.x - 4, air.y + air.h, air.w + 8, wd);
    if (gl > 0.01) { ctx.fillStyle = alpha(lighten(c.warning, 0.35), 0.75 * gl); ctx.fillRect(air.x, air.y, air.w, air.h); }
    ctx.fillStyle = alpha(lighten(c.s1, 0.6), 0.35 + 0.5 * pulse); ctx.fillRect(air.x, air.y + air.h * 0.15, air.w, air.h * 0.7);
    ctx.strokeStyle = alpha(lighten(c.s1, 0.85), 0.5 + 0.5 * pulse); ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { const ax = air.x + ((i + 0.5) / 4 + 0.08 * Math.sin(TAU * 3 * t + i)) * air.w; ctx.beginPath(); ctx.moveTo(ax - 18, air.y + air.h / 2); ctx.lineTo(ax + 18, air.y + air.h / 2); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = lighten(bam, 0.35); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(air.x, y - wd * 0.36); ctx.lineTo(air.x + air.w, y - wd * 0.36); ctx.moveTo(air.x, y + wd * 0.36); ctx.lineTo(air.x + air.w, y + wd * 0.36); ctx.stroke();
    if (gl > 0.01) { rr(ctx, air.x - 3, air.y - 3, air.w + 6, air.h + 6, 4); ctx.strokeStyle = alpha(c.warning, gl); ctx.lineWidth = 3; ctx.stroke(); }
  }
  // nodes and bindings
  const bind = c.s6;
  for (const u of [0.035, 0.97]) { const bx = X(u); ctx.strokeStyle = darken(bam, 0.35); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(bx, top + 1); ctx.lineTo(bx, top + wd - 1); ctx.stroke(); }
  for (const u of [0.07, 0.28, 0.9]) {
    const bx = X(u) - 6;
    lit(ctx, () => rr(ctx, bx, top - 1.5, 12, wd + 3, 3), darken(bind, 0.1), 16, { rimW: 1.5 });
    ctx.strokeStyle = alpha(darken(bind, 0.45), 0.7); ctx.lineWidth = 1;
    for (let j = 1; j < 4; j++) { ctx.beginPath(); ctx.moveTo(bx + j * 3, top); ctx.lineTo(bx + j * 3, top + wd + 1); ctx.stroke(); }
  }
  // holes: on the near wall when closed, on the far wall's top edge in the cutaway
  const hole = (u, rx) => {
    const hx = X(u), hy = o.cutaway ? y - wd * 0.36 : y - wd * 0.08;
    ellipse(ctx, hx, hy, rx, o.cutaway ? 2.5 : wd * 0.2); ctx.fillStyle = darken(bam, 0.7); ctx.fill();
    ctx.strokeStyle = alpha(lighten(bam, 0.5), 0.8); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(hx, hy + 1.5, rx, o.cutaway ? 2.5 : wd * 0.2, 0, 0.2, Math.PI - 0.2); ctx.stroke();
  };
  hole(0.16, wd * 0.3);
  for (let i = 0; i < 6; i++) hole(0.5 + i * 0.065, wd * 0.22);
  ctx.restore();
  const vibP = { x: air.x + air.w / 2, y };
  return { air, blow: { x: X(0.16), y: o.cutaway ? y - wd * 0.36 : y - wd * 0.08 }, vib: vibP, part: air, box: { x: xa, y: top - 2, w: len, h: wd + 4 } };
}

/**
 * drawTaal(ctx, c, o): a pair of small brass hand cymbals (book Fig 10.1) on a cord, seen
 *   from the side, faces toward each other. o.x, o.y the meeting point; r = 46 (rim
 *   radius); meet = 0 (0..1: 1 = the rims touch). The rims ring (the vibrating part).
 *   Each dome (boss) sits behind its disc and shows past the disc's back edge.
 *   Also returns rims: [left, right] (rim edge points) and contact.
 */
export function drawTaal(ctx, c, o = {}) {
  const x = o.x ?? 560, y = o.y ?? 200, r = o.r ?? 46, meet = c01(o.meet ?? 0), k = c01(o.vib ?? 0), t = o.t ?? 0;
  const brass = brassOf(c), gap = (1 - meet) * r * 1.5, rx = r * 0.3, gl = litK(o.lit);
  // the dome (boss) sits on each disc's back face; seen at an angle it shows at the back edge
  const bOff = rx * 0.9, brx = r * 0.26, bry = r * 0.34, ko = bOff + brx * 0.9;
  const jit = k * 1.6 * Math.sin(TAU * 31 * t);
  const cs = [{ cx: x - gap / 2 - rx + jit, s: -1 }, { cx: x + gap / 2 + rx - jit, s: 1 }];
  ctx.save();
  // cord between the domes, hanging below
  const d0 = { x: cs[0].cx - ko, y }, d1 = { x: cs[1].cx + ko, y };
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(d0.x, d0.y); ctx.bezierCurveTo(d0.x - r * 0.4, y + r * 1.9, d1.x + r * 0.4, y + r * 1.9, d1.x, d1.y);
  ctx.strokeStyle = darken(c.s6, 0.45); ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = c.s6; ctx.lineWidth = 3; ctx.stroke();
  for (const cy of cs) {
    const cx = cy.cx, s = cy.s;
    glow(ctx, cx - s * rx * 0.2, y, r * 1.35, c.warning, 0.75 * gl);
    // the dome behind the disc, bulging out past its back edge, the cord knot on its crown
    const bx = cx + s * bOff;
    lit(ctx, () => { ctx.beginPath(); ctx.ellipse(bx, y, brx, bry, 0, 0, TAU); }, lighten(brass, 0.08), r * 0.6, { shade: 0.26 });
    ellipse(ctx, bx + s * brx * 0.3, y - bry * 0.45, brx * 0.2, bry * 0.16); ctx.fillStyle = alpha(lighten(brass, 0.75), 0.9); ctx.fill();
    ball(ctx, cx + s * ko, y, 4.5, darken(c.s6, 0.15));
    // rim disc (seen nearly edge-on) over the dome's inner half, turned lines
    lit(ctx, () => { ctx.beginPath(); ctx.ellipse(cx, y, rx, r, 0, 0, TAU); }, brass, r * 1.2, { shade: 0.24 });
    ctx.strokeStyle = alpha(darken(brass, 0.35), 0.6); ctx.lineWidth = 1.4;
    for (const f of [0.55, 0.8]) { ellipse(ctx, cx + s * rx * 0.08, y, rx * f, r * f); ctx.stroke(); }
    ellipse(ctx, cx + s * rx * 0.1, y, rx * 0.22, r * 0.22); ctx.fillStyle = alpha(darken(brass, 0.4), 0.55); ctx.fill();
    // ringing rims
    if (k > 0.01) {
      const sh = k * (0.5 + 0.5 * Math.sin(TAU * 9 * t + s));
      ctx.strokeStyle = alpha(lighten(brass, 0.8), sh); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(cx, y, rx + 3, r + 3, 0, -s * 0.0 + (s < 0 ? -0.9 : Math.PI - 0.9), (s < 0 ? 0.9 : Math.PI + 0.9)); ctx.stroke();
    }
    if (gl > 0.01) { ellipse(ctx, cx, y, rx + 2, r + 2); ctx.strokeStyle = alpha(c.warning, gl); ctx.lineWidth = 3; ctx.stroke(); }
  }
  ctx.restore();
  const rims = [{ x: cs[0].cx + rx, y }, { x: cs[1].cx - rx, y }];
  return { rims, contact: { x, y }, vib: { x, y: y - r * 0.6 }, part: { x: cs[0].cx - rx, y: y - r, w: cs[1].cx - cs[0].cx + 2 * rx, h: 2 * r }, box: { x: d0.x - r * 0.4, y: y - r - 4, w: d1.x - d0.x + r * 0.8, h: r * 2.9 } };
}

/**
 * drawMridangam(ctx, c, o): a barrel drum lying on its side, seen a little from its right
 *   end; o.x centre, o.y floor, len = 280, r = 58 (left head radius; right head 0.88 r,
 *   belly 1.2 r). Wooden barrel, leather straps laced head to head along the body, braided
 *   hoops at both ends, the right head facing the viewer with its black syaahi
 *   (o.syaahi = true); the left head is seen edge-on. The right skin vibrates as shimmer.
 *   Returns heads: [left, right] ({ cx, cy, rx, ry }), skin (the right head).
 */
export function drawMridangam(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 470, len = o.len ?? 280, r = o.r ?? 58, k = c01(o.vib ?? 0), t = o.t ?? 0, gl = litK(o.lit);
  const rL = r, rR = r * 0.88, rB = r * 1.2, e = 0.3, cy = y - rB - 2, xl = x - len / 2, xr = x + len / 2;
  const wood = lighten(mix(woodOf(c), c.s8, 0.25), 0.06), strap = strapOf(c), skin = hideOf(c);
  const R = (u) => rL + (rR - rL) * u + (rB - (rL + rR) / 2) * Math.sin(Math.PI * u);
  const N = 18, side = (sg) => Array.from({ length: N + 1 }, (_, i) => ({ x: xl + len * i / N, y: cy + sg * R(i / N) }));
  const top = side(-1), bot = side(1);
  ctx.save();
  drawShadow(ctx, c, x, y, len * 0.5);
  const barrel = () => {
    ctx.beginPath(); ctx.ellipse(xl, cy, rL * e, rL, 0, Math.PI * 0.5, Math.PI * 1.5);
    for (const p of top) ctx.lineTo(p.x, p.y);
    for (let i = N; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y);
    ctx.closePath();
  };
  lit(ctx, barrel, wood, rB * 2, { shade: 0.26 });
  ctx.save(); barrel(); ctx.clip(); ctx.lineCap = 'round';
  // grain, then the straps laced head to head (front half), with a light edge
  ctx.strokeStyle = alpha(darken(wood, 0.3), 0.35); ctx.lineWidth = 1.2;
  for (const v of [-0.3, 0.15, 0.55]) { ctx.beginPath(); top.forEach((p, i) => { const yy = cy + v * R(i / N) * 0.98; i ? ctx.lineTo(p.x, yy) : ctx.moveTo(p.x, yy); }); ctx.stroke(); }
  for (let j = 0; j < 9; j++) {
    const v = -0.88 + j * 0.22;
    const S = top.map((p, i) => ({ x: p.x - (i === 0 ? rL * e * Math.sqrt(1 - v * v) : 0), y: cy + v * R(i / N) }));
    polyline(ctx, S); ctx.strokeStyle = darken(strap, 0.3); ctx.lineWidth = 5.5; ctx.stroke();
    polyline(ctx, S); ctx.strokeStyle = strap; ctx.lineWidth = 3.4; ctx.stroke();
    polyline(ctx, S, -0.8, -1); ctx.strokeStyle = alpha(lighten(strap, 0.45), 0.7); ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.restore();
  // braided hoops at both ends (front halves)
  for (const [hx, hr] of [[xl + len * 0.035, R(0.035)], [xr - len * 0.03, R(0.97)]]) {
    ctx.beginPath(); ctx.ellipse(hx, cy, hr * e, hr, 0, -Math.PI / 2, Math.PI / 2);
    ctx.strokeStyle = darken(strap, 0.25); ctx.lineWidth = 8; ctx.stroke();
    ctx.setLineDash([4, 4]); ctx.strokeStyle = alpha(lighten(strap, 0.45), 0.8); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
  }
  // the right head, facing the viewer
  glow(ctx, xr, cy, rR * 1.25, c.warning, 0.9 * gl);
  ellipse(ctx, xr, cy, rR * e, rR); ctx.fillStyle = skin; ctx.fill();
  ctx.save(); ellipse(ctx, xr, cy, rR * e, rR); ctx.clip();
  ellipse(ctx, xr + rR * e * 0.35, cy + rR * 0.35, rR * e, rR); ctx.fillStyle = alpha(darken(skin, 0.22), 0.5); ctx.fill();
  ellipse(ctx, xr, cy, rR * e * 0.82, rR * 0.82); ctx.strokeStyle = alpha(darken(skin, 0.28), 0.7); ctx.lineWidth = 2; ctx.stroke();
  if (o.syaahi !== false) {
    const ink = inkOf(c);
    ellipse(ctx, xr, cy, rR * e * 0.42, rR * 0.42); ctx.fillStyle = ink; ctx.fill();
    ellipse(ctx, xr - rR * e * 0.12, cy - rR * 0.14, rR * e * 0.12, rR * 0.12); ctx.fillStyle = alpha(lighten(ink, 0.5), 0.6); ctx.fill();
  }
  if (k > 0.01) for (let i = 0; i < 3; i++) {
    const u = (t * 1.6 + i / 3) % 1;
    ellipse(ctx, xr, cy, rR * e * (0.2 + 0.75 * u), rR * (0.2 + 0.75 * u));
    ctx.strokeStyle = alpha(lighten(skin, 0.7), k * (1 - u) * 0.95); ctx.lineWidth = 3; ctx.stroke();
  }
  ctx.restore();
  ellipse(ctx, xr, cy, rR * e + 2, rR + 2); ctx.strokeStyle = darken(strap, 0.2); ctx.lineWidth = 6; ctx.stroke();
  ellipse(ctx, xr, cy, rR * e, rR); ctx.strokeStyle = gl > 0.01 ? mix(darken(skin, 0.45), c.warning, gl) : darken(skin, 0.45); ctx.lineWidth = 2 + gl; ctx.stroke();
  ctx.restore();
  const heads = [{ cx: xl, cy, rx: rL * e, ry: rL }, { cx: xr, cy, rx: rR * e, ry: rR }];
  return { heads, skin: heads[1], vib: { x: xr, y: cy }, part: { x: xr - rR * e, y: cy - rR, w: 2 * rR * e, h: 2 * rR }, box: { x: xl - rL * e, y: cy - rB, w: len + rL * e + rR * e + 3, h: y - cy + rB } };
}

/**
 * drawSitar(ctx, c, o): o.x, o.y the main gourd's centre; len = 520 (gourd to top); ang =
 *   -0.32 (neck rising to the right; radians). Gourd with a soundboard and bridge, long
 *   neck with curved frets, main strings over the frets (the vibrating part), extra
 *   sympathetic strings under them to small side pegs, a second small gourd near the top.
 *   o.litExtra = false (true or 0..1) lights the extra strings (L05); with vib > 0 the
 *   extra strings shimmer too (sympathetic). Also returns strings: { a, b } (the
 *   main strings' ends) and extra: { a, b }.
 */
export function drawSitar(ctx, c, o = {}) {
  const x = o.x ?? 160, y = o.y ?? 400, len = o.len ?? 520, ang = o.ang ?? -0.32, k = c01(o.vib ?? 0), t = o.t ?? 0;
  const ca = Math.cos(ang), sa = Math.sin(ang), W = (lx, ly) => ({ x: x + lx * ca - ly * sa, y: y + lx * sa + ly * ca });
  const grx = len * 0.17, gry = len * 0.155, nw = len * 0.06, n0 = grx * 0.55, wood = woodOf(c), gourd = gourdOf(c), steel = steelOf(c);
  ctx.save();
  drawShadow(ctx, c, x, y + gry * 1.02, grx * 0.9);
  ctx.translate(x, y); ctx.rotate(ang);
  // second gourd (under the neck near the top), neck, peg box
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(len * 0.78, nw * 1.25, nw * 1.15, nw * 1.05, 0, 0, TAU); }, gourd, nw * 2.2, { shade: 0.24 });
  lit(ctx, () => rr(ctx, n0, -nw / 2, len - n0, nw, nw * 0.3), wood, nw * 2, { shade: 0.22 });
  ctx.strokeStyle = alpha(lighten(wood, 0.45), 0.7); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(n0 + 10, -nw * 0.3); ctx.lineTo(len - 10, -nw * 0.3); ctx.stroke();
  // gourd and soundboard
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, grx, gry, 0, 0, TAU); }, gourd, grx * 2, { shade: 0.24 });
  const board = lighten(wood, 0.32);
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(grx * 0.06, -gry * 0.04, grx * 0.82, gry * 0.78, 0, 0, TAU); }, board, grx * 1.5, { shade: 0.14 });
  ctx.strokeStyle = alpha(darken(board, 0.35), 0.6); ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]);
  ellipse(ctx, grx * 0.06, -gry * 0.04, grx * 0.7, gry * 0.66); ctx.stroke(); ctx.setLineDash([]);
  // pegs: main at the top end (across), small side pegs for the extra strings
  for (let i = 0; i < 3; i++) { const px = len - 18 - i * 22; rod(ctx, [{ x: px, y: -nw * 0.4 }, { x: px - 6, y: -nw * 1.5 }], 7, darken(wood, 0.1)); ball(ctx, px - 6, -nw * 1.55, 5.5, darken(wood, 0.25)); }
  const ext = [];
  for (let i = 0; i < 7; i++) { const px = len * (0.36 + i * 0.05); ext.push(px); ball(ctx, px, nw * 0.62, 3.6, lighten(wood, 0.25)); }
  // extra strings: from a low bridge on the board, under the frets, to the side pegs
  const xb = -grx * 0.25, gx = litK(o.litExtra);
  ctx.lineCap = 'round';
  for (let i = 0; i < ext.length; i++) {
    const yb = nw * (0.02 + i * 0.045);
    // vib > 0: the extra strings shimmer too (sympathetic), each at its own small beat
    const sh = k > 0.01 ? k * 1.6 * Math.sin(TAU * (11 + i * 1.3) * t + i * 1.7) : 0;
    const ln = () => { ctx.beginPath(); ctx.moveTo(xb, yb); if (sh) ctx.quadraticCurveTo((xb + ext[i]) / 2, (yb + nw * 0.6) / 2 + 2 * sh, ext[i], nw * 0.6); else ctx.lineTo(ext[i], nw * 0.6); };
    if (gx > 0.01) { ctx.strokeStyle = alpha(c.warning, 0.5 * gx); ctx.lineWidth = 5; ln(); ctx.stroke(); }
    if (k > 0.01) { ctx.strokeStyle = alpha(lighten(steel, 0.4), 0.3 * k); ctx.lineWidth = 3.2; ln(); ctx.stroke(); }
    ctx.strokeStyle = gx > 0.01 ? lighten(steel, 0.35 * gx) : alpha(steel, 0.85); ctx.lineWidth = 1.1;
    ln(); ctx.stroke();
  }
  // frets: curved steel arches across the neck
  for (let i = 0; i < 14; i++) {
    const fx = n0 + 24 + (len - n0 - 80) * (1 - Math.pow(0.93, i * 1.6)) / (1 - Math.pow(0.93, 22.4));
    ctx.strokeStyle = darken(steel, 0.35); ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(fx, -nw * 0.55); ctx.quadraticCurveTo(fx - 4, 0, fx, nw * 0.55); ctx.stroke();
    ctx.strokeStyle = lighten(steel, 0.4); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(fx - 1, -nw * 0.5); ctx.quadraticCurveTo(fx - 5, 0, fx - 1, nw * 0.5); ctx.stroke();
  }
  // main bridge and main strings (the vibrating part)
  lit(ctx, () => rr(ctx, xb - 5, -nw * 0.5, 10, nw * 0.62, 2), lighten(c.labelMuted, 0.6), 14, { rimW: 1.4 });
  let mid = null;
  for (let i = 0; i < 3; i++) {
    const yy = -nw * (0.32 - i * 0.12);
    const m = vibString(ctx, c, { x: xb, y: yy }, { x: len - 18 - i * 22, y: -nw * 0.4 + 1 }, k * (1 - i * 0.25), t + i * 0.013, steel, 1.8, 9, litK(o.lit));
    if (i === 1) mid = m;
  }
  ctx.restore();
  const vib = W(mid.x, mid.y);
  return { strings: { a: W(xb, -nw * 0.2), b: W(len - 40, -nw * 0.4) }, extra: { a: W(xb, nw * 0.15), b: W(ext[6], nw * 0.6) }, vib, part: { x: Math.min(W(xb, 0).x, W(len, 0).x), y: Math.min(W(xb, 0).y, W(len, 0).y) - nw, w: Math.abs(W(len, 0).x - W(xb, 0).x), h: Math.abs(W(len, 0).y - W(xb, 0).y) + 2 * nw }, box: { x: x - grx, y: W(len, 0).y - nw * 2, w: W(len, 0).x - x + grx + nw, h: y + gry - W(len, 0).y + nw * 2 } };
}

/**
 * drawHeadCutaway(ctx, c, o) -> { larynx, cords, windpipe, mouth, nose, box }
 *   A side-view head and neck in section (book Fig 10.3): outline with nose and lips (no
 *   eye, no expression), nasal cavity, mouth, tongue, throat, food pipe, the larynx (voice
 *   box) and the vocal cords in it, the windpipe with its rings.
 *   o: { x, y (centre of the head), h = 220 (crown to chin), facing = -1 (face to the left,
 *        as in the book; 1 right), skinTone = 1, labels = true (26 px, on the back side,
 *        with leader lines), size = 26, text: { larynx, cords, windpipe }, lit = false
 *        (vocal cords highlighted), vib = 0 (0..1 the cords shiver), t }
 */
export function drawHeadCutaway(ctx, c, o = {}) {
  const x = o.x ?? 150, y = o.y ?? 200, h = o.h ?? 220, f = o.facing === 1 ? 1 : -1, t = o.t ?? 0, k = c01(o.vib ?? 0);
  const skin = o.skin ?? figureLook(c, { skin: o.skinTone ?? 1 }).skin, tis = tissueOf(c);
  const q = (u, v) => [u * h, v * h], W = (u, v) => ({ x: x + f * u * h, y: y + v * h });
  const B = (a, b, d) => ctx.bezierCurveTo(...q(...a), ...q(...b), ...q(...d));
  const head = () => {
    ctx.beginPath(); ctx.moveTo(...q(-0.3, 0.95));
    B([-0.33, 0.75], [-0.36, 0.5], [-0.42, 0.3]);
    B([-0.56, 0.1], [-0.58, -0.4], [-0.1, -0.55]);
    B([0.22, -0.62], [0.4, -0.48], [0.42, -0.22]);
    B([0.43, -0.15], [0.41, -0.1], [0.44, -0.04]);
    B([0.5, 0.02], [0.57, 0.06], [0.57, 0.1]);
    B([0.56, 0.13], [0.5, 0.14], [0.45, 0.14]);
    B([0.47, 0.17], [0.49, 0.2], [0.48, 0.22]);
    B([0.46, 0.24], [0.44, 0.24], [0.44, 0.25]);
    B([0.47, 0.27], [0.47, 0.3], [0.44, 0.32]);
    B([0.42, 0.34], [0.43, 0.37], [0.45, 0.41]);
    B([0.45, 0.47], [0.35, 0.5], [0.24, 0.5]);
    B([0.17, 0.52], [0.16, 0.6], [0.2, 0.66]);
    B([0.22, 0.72], [0.17, 0.8], [0.17, 0.95]);
    ctx.closePath();
  };
  ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
  lit(ctx, head, skin, h * 1.2, { shade: 0.14, rim: darken(skin, 0.42) });
  ctx.save(); head(); ctx.clip(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // the cut face: paler tissue inside the lower head and neck
  ctx.beginPath(); ctx.moveTo(...q(0.4, -0.06)); B([0.1, -0.12], [-0.25, -0.05], [-0.26, 0.2]); B([-0.27, 0.5], [-0.2, 0.8], [-0.2, 1]);
  ctx.lineTo(...q(0.12, 1)); B([0.12, 0.8], [0.14, 0.62], [0.16, 0.55]); B([0.3, 0.45], [0.42, 0.38], [0.42, 0.14]); ctx.closePath();
  ctx.fillStyle = mix(skin, tis, 0.45); ctx.fill(); ctx.strokeStyle = alpha(darken(tis, 0.3), 0.6); ctx.lineWidth = 1.5; ctx.stroke();
  // airway: nose cavity, mouth, throat, down to the larynx
  const airCol = darken(tis, 0.42);
  ctx.beginPath(); ctx.moveTo(...q(0.46, 0.08)); B([0.36, -0.04], [0.08, -0.02], [-0.06, 0.04]);
  B([-0.12, 0.12], [-0.13, 0.32], [-0.08, 0.5]); ctx.lineTo(...q(0.03, 0.52)); B([0.02, 0.4], [0.06, 0.32], [0.2, 0.28]);
  B([0.3, 0.27], [0.4, 0.26], [0.45, 0.25]); B([0.38, 0.22], [0.3, 0.16], [0.12, 0.15]); B([0.25, 0.12], [0.38, 0.12], [0.46, 0.08]); ctx.closePath();
  ctx.fillStyle = airCol; ctx.fill(); ctx.strokeStyle = darken(tis, 0.55); ctx.lineWidth = 1.6; ctx.stroke();
  // palate line and the tongue
  ctx.strokeStyle = lighten(tis, 0.2); ctx.lineWidth = h * 0.016; ctx.beginPath(); ctx.moveTo(...q(0.4, 0.135)); B([0.25, 0.12], [0.08, 0.12], [-0.02, 0.16]); ctx.stroke();
  const tongue = () => { ctx.beginPath(); ctx.moveTo(...q(0.4, 0.27)); B([0.32, 0.19], [0.12, 0.17], [0.04, 0.26]); B([0.0, 0.33], [0.0, 0.42], [0.06, 0.46]); B([0.2, 0.42], [0.34, 0.36], [0.4, 0.27]); ctx.closePath(); };
  lit(ctx, tongue, mix(c.s4, c.s6, 0.45), h * 0.4, { shade: 0.2 });
  // food pipe behind the windpipe
  rod(ctx, [{ x: -0.07 * h, y: 0.5 * h }, { x: -0.08 * h, y: 1.0 * h }], h * 0.05, darken(tis, 0.08));
  // larynx (voice box): a cartilage shield, the epiglottis above
  const cart = lighten(mix(tis, c.labelMuted, 0.2), 0.4);
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(...q(0.0, 0.52)); B([0.06, 0.5], [0.16, 0.5], [0.18, 0.56]); B([0.2, 0.62], [0.16, 0.67], [0.14, 0.68]); ctx.lineTo(...q(0.02, 0.68)); B([-0.01, 0.62], [-0.01, 0.56], [0.0, 0.52]); ctx.closePath(); }, cart, h * 0.3, { shade: 0.16 });
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(...q(0.02, 0.52)); B([-0.02, 0.47], [0.02, 0.43], [0.05, 0.42]); B([0.05, 0.46], [0.05, 0.5], [0.05, 0.52]); ctx.closePath(); }, tis, h * 0.1);
  // the windpipe with rings
  const wp = [{ x: 0.08 * h, y: 0.66 * h }, { x: 0.075 * h, y: 1.0 * h }];
  rod(ctx, wp, h * 0.1, cart);
  ctx.fillStyle = alpha(airCol, 0.85); rr(ctx, 0.055 * h, 0.68 * h, 0.04 * h, 0.32 * h, 3); ctx.fill();
  ctx.strokeStyle = alpha(darken(cart, 0.3), 0.85); ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const yy = (0.7 + i * 0.05) * h; ctx.beginPath(); ctx.moveTo(0.03 * h, yy); ctx.quadraticCurveTo(0.08 * h, yy + 4, 0.125 * h, yy); ctx.stroke(); }
  // the airway through the larynx and the vocal cords across it
  ctx.fillStyle = airCol; rr(ctx, 0.05 * h, 0.52 * h, 0.05 * h, 0.16 * h, 3); ctx.fill();
  const cy = 0.6 * h, jv = k * 1.5 * Math.sin(TAU * 40 * t);
  if (o.lit) glow(ctx, 0.075 * h, cy, h * 0.11, c.warning, 0.95);
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0.075 * h + s * 0.03 * h, cy - 6); ctx.lineTo(0.075 * h + s * (0.006 * h + jv), cy); ctx.lineTo(0.075 * h + s * 0.03 * h, cy + 6); ctx.closePath();
    ctx.fillStyle = lighten(tis, 0.5); ctx.fill(); ctx.strokeStyle = o.lit ? c.warning : darken(tis, 0.5); ctx.lineWidth = o.lit ? 2.4 : 1.4; ctx.stroke();
  }
  ctx.restore();
  // a faint skull line, lips line, nostril
  ctx.strokeStyle = alpha(darken(skin, 0.25), 0.5); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(...q(0.36, -0.12)); B([0.36, -0.5], [-0.4, -0.55], [-0.45, -0.05]); ctx.stroke();
  ctx.strokeStyle = darken(skin, 0.45); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(...q(0.44, 0.25)); ctx.lineTo(...q(0.4, 0.25)); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(...q(0.5, 0.125), h * 0.025, h * 0.01, 0.2, 0, TAU); ctx.fillStyle = darken(skin, 0.45); ctx.fill();
  ctx.restore();
  const out = { larynx: W(0.1, 0.55), cords: W(0.075, 0.6), windpipe: W(0.08, 0.85), mouth: W(0.46, 0.25), nose: W(0.5, 0.12), box: { x: Math.min(W(-0.58, 0).x, W(0.58, 0).x), y: y - 0.6 * h, w: 1.16 * h, h: 1.55 * h } };
  if (o.labels !== false) {
    const size = o.size ?? 26, tx = o.text ?? {}, lx = W(-0.62, 0).x, al = f < 0 ? 'left' : 'right';
    const rows = [[tx.larynx ?? 'larynx', W(0.15, 0.53), 0.42], [tx.cords ?? 'vocal cords', out.cords, 0.62], [tx.windpipe ?? 'windpipe', out.windpipe, 0.86]];
    ctx.save(); ctx.strokeStyle = c.label; ctx.lineWidth = 1.8;
    for (const [txt, p, v] of rows) {
      const ly = y + v * h;
      ctx.beginPath(); ctx.moveTo(lx - f * 6, ly); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, TAU); ctx.fillStyle = c.label; ctx.fill();
      label(ctx, c, txt, lx, ly, size, { align: al });
    }
    ctx.restore();
  }
  return out;
}

/**
 * drawVocalCords(ctx, c, o) -> { gap: {x, y}, box }
 *   A round inset looking down the throat at the two vocal cords (book Fig 10.3).
 *   o: { x, y (centre), r = 56, state = 'open' ('open': a V gap, air passes; 'closed': a
 *        slit), vib = 0 (0..1 the closed cords shiver), t, length = 1 (longer and thicker
 *        cords, for a deeper voice, e.g. 1.25), label (text under the inset, 26 px),
 *        lit = false }
 */
export function drawVocalCords(ctx, c, o = {}) {
  const x = o.x ?? 400, y = o.y ?? 120, r = o.r ?? 56, open = o.state !== 'closed', L = Math.max(0.6, o.length ?? 1), t = o.t ?? 0, k = c01(o.vib ?? 0);
  const tis = tissueOf(c), cord = lighten(tis, 0.62), deep = darken(tis, 0.6);
  ctx.save();
  lit(ctx, () => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }, tis, r * 1.6, { shade: 0.2, rim: darken(tis, 0.5), rimW: 3 });
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 2, 0, TAU); ctx.clip();
  // soft folds round the opening
  ctx.strokeStyle = alpha(darken(tis, 0.25), 0.6); ctx.lineWidth = 2;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * r * 0.5, y - r * 0.62); ctx.quadraticCurveTo(x + s * r * 0.82, y, x + s * r * 0.5, y + r * 0.7); ctx.stroke(); }
  const ly = r * 0.6 * L, apex = { x, y: y - ly }, spread = open ? r * 0.3 * L : r * 0.012, back = y + ly * 0.9, th = r * 0.12 * L;
  const wob = open ? 0 : k * r * 0.03 * Math.sin(TAU * 30 * t);
  // the gap (airway)
  ctx.beginPath(); ctx.moveTo(apex.x, apex.y); ctx.lineTo(x - spread - wob, back); ctx.quadraticCurveTo(x, back + r * 0.1, x + spread + wob, back); ctx.closePath();
  ctx.fillStyle = deep; ctx.fill();
  if (o.lit) glow(ctx, x, y, r * 0.8, c.warning, 0.7);
  for (const s of [-1, 1]) {
    const inner = { x: x + s * (spread + wob), y: back }, outer = { x: x + s * (spread + wob + th * 1.6), y: back + 2 };
    const path = () => { ctx.beginPath(); ctx.moveTo(apex.x + s * 1, apex.y); ctx.lineTo(inner.x, inner.y); ctx.lineTo(outer.x, outer.y); ctx.quadraticCurveTo(x + s * (th * 1.2 + spread * 0.5), y - ly * 0.2, apex.x + s * th * 0.5, apex.y - 2); ctx.closePath(); };
    lit(ctx, path, cord, r * 0.5, { shade: 0.12, rim: o.lit ? c.warning : darken(tis, 0.4), rimW: o.lit ? 2.6 : 1.6 });
    if (k > 0.01 && !open) { ctx.strokeStyle = alpha(lighten(cord, 0.6), k * 0.8); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(apex.x + s * 4, apex.y + 6); ctx.lineTo(inner.x + s * 4, inner.y - 4); ctx.stroke(); }
  }
  ctx.restore();
  // the label stays full strength (strong ink) even when the caller fades the inset
  ctx.globalAlpha = 1;
  label(ctx, c, o.label, x, y + r + 20, o.size ?? 26, { col: c.label });
  ctx.restore();
  return { gap: { x, y: y + ly * 0.3 }, box: { x: x - r, y: y - r, w: 2 * r, h: 2 * r + (o.label ? 40 : 0) } };
}

/**
 * drawCricket(ctx, c, o) -> { wings: {x, y}, box }
 *   A field cricket on a leaf, from the side: head with an eye dot, saddle back, wings
 *   folded over the body, six legs (big jumping hind legs), long antennae, tail spikes.
 *   o: { x, y (leaf centre), s = 1 (cricket about 120 px long), dir = 1 (faces right),
 *        rub = 0 (0..1 wing-rub phase: the wings lift and scrape), leaf = true, lit = false }
 */
export function drawCricket(ctx, c, o = {}) {
  const x = o.x ?? 520, y = o.y ?? 260, s = o.s ?? 1, dir = o.dir === -1 ? -1 : 1, rub = o.rub ?? 0;
  const body = darken(mix(c.s8, c.s3, 0.35), 0.5), leafC = darken(c.s3, 0.15);
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  if (o.leaf !== false) {
    const leaf = () => { ctx.beginPath(); ctx.moveTo(-125, 34); ctx.bezierCurveTo(-60, 2, 60, 4, 125, 26); ctx.bezierCurveTo(60, 62, -60, 64, -125, 34); ctx.closePath(); };
    lit(ctx, leaf, leafC, 120, { shade: 0.2 });
    ctx.save(); leaf(); ctx.clip(); ctx.strokeStyle = alpha(lighten(leafC, 0.45), 0.8); ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-125, 34); ctx.quadraticCurveTo(0, 30, 125, 26); ctx.stroke(); ctx.lineWidth = 1.3;
    for (let i = -4; i <= 4; i++) { const vx = i * 26; ctx.beginPath(); ctx.moveTo(vx, 31); ctx.lineTo(vx + 18, 14); ctx.moveTo(vx, 31); ctx.lineTo(vx + 18, 50); ctx.stroke(); }
    ctx.restore();
    rod(ctx, [{ x: -125, y: 34 }, { x: -150, y: 40 }], 4, darken(leafC, 0.1));
  }
  const leg = (P, wd, col) => rod(ctx, P, wd, col);
  const far = darken(body, 0.3);
  // far legs
  leg([{ x: 16, y: 6 }, { x: 30, y: 16 }, { x: 40, y: 22 }], 3.5, far);
  leg([{ x: 0, y: 8 }, { x: 8, y: 18 }, { x: 4, y: 24 }], 3.5, far);
  leg([{ x: -12, y: 2 }, { x: -36, y: -18 }], 9, far); leg([{ x: -36, y: -18 }, { x: -40, y: 22 }, { x: -50, y: 25 }], 3, far);
  // antennae
  ctx.strokeStyle = darken(body, 0.2); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(36, -12); ctx.bezierCurveTo(56, -60, 10, -84, -60, -66); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(34, -12); ctx.bezierCurveTo(70, -44, 90, -56, 70, -90); ctx.stroke();
  // body: abdomen, saddle, head
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(-20, 0, 34, 12, 0.04, 0, TAU); }, body, 60, { shade: 0.24 });
  ctx.strokeStyle = alpha(lighten(body, 0.3), 0.5); ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-40 + i * 9, 3); ctx.lineTo(-38 + i * 9, 11); ctx.stroke(); }
  ctx.strokeStyle = body; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-52, -1); ctx.lineTo(-70, -6); ctx.moveTo(-52, 2); ctx.lineTo(-68, 6); ctx.stroke();
  // wings, lifted a little when rubbing
  const lift = rub > 0 ? 0.12 + 0.07 * Math.sin(TAU * rub) : 0;
  ctx.save(); ctx.translate(8, -10); ctx.rotate(-lift);
  if (o.lit) glow(ctx, -28, -2, 40, c.warning, 0.9);
  const wing = () => { ctx.beginPath(); ctx.moveTo(2, -2); ctx.lineTo(-56, 2); ctx.quadraticCurveTo(-62, 8, -54, 11); ctx.lineTo(2, 7); ctx.closePath(); };
  lit(ctx, wing, lighten(body, 0.18), 40, { shade: 0.2, rim: o.lit ? c.warning : darken(body, 0.45) });
  ctx.strokeStyle = alpha(darken(body, 0.3), 0.8); ctx.lineWidth = 1;
  ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.moveTo(-4 - i * 10, 0); ctx.quadraticCurveTo(-10 - i * 10, 4, -6 - i * 10, 8); } ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(-54, 6); ctx.stroke();
  ctx.restore();
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(13, -3, 13, 12, 0, 0, TAU); }, body, 26, { shade: 0.22 });
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(31, -1, 10, 11, 0.2, 0, TAU); }, darken(body, 0.05), 22, { shade: 0.2 });
  ctx.beginPath(); ctx.arc(33, -5, 2.4, 0, TAU); ctx.fillStyle = darken(body, 0.7); ctx.fill();
  ctx.beginPath(); ctx.arc(32.5, -5.7, 0.9, 0, TAU); ctx.fillStyle = alpha(lighten(body, 0.8), 0.9); ctx.fill();
  // near legs: front, middle, the big hind leg
  leg([{ x: 22, y: 6 }, { x: 34, y: 17 }, { x: 46, y: 25 }], 4, body);
  leg([{ x: 6, y: 8 }, { x: 12, y: 19 }, { x: 8, y: 26 }], 4, body);
  leg([{ x: -6, y: 4 }, { x: -24, y: -6 }, { x: -44, y: -12 }], (u) => 13 - 6 * u, body);
  leg([{ x: -44, y: -12 }, { x: -52, y: 22 }, { x: -64, y: 27 }], 3.5, body);
  ctx.strokeStyle = darken(body, 0.2); ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) { const py = -6 + i * 7, px = -45.5 - i * 1.6; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 4, py + 2); ctx.stroke(); }
  ctx.restore();
  const wx = x + dir * s * -20, wy = y - s * 14;
  return { wings: { x: wx, y: wy }, box: { x: x - s * 150, y: y - s * 92, w: s * 280, h: s * 160 } };
}

/**
 * drawAstronaut(ctx, c, o) -> { hands: [near, far], helmet, chest, box }
 *   A suited astronaut: white suit with shade and fold lines, backpack, gloves, boots,
 *   helmet with a gold visor and a reflection (no face visible).
 *   o: { x, y (chest centre), s = 1 (about 210 px tall), dir = 1 (faces right), pose =
 *        'work' | 'float' | 'reach', radio = false (a small radio unit on the chest),
 *        radioLit = 0 (0..1 its light), tool = null | 'wrench' (in the near hand) }
 */
const POSES = {
  work: { rot: 0, near: [1.0, 1.75], far: [0.45, 1.1], legN: [0.12, -0.08], legF: [-0.12, -0.22] },
  float: { rot: -0.35, near: [1.45, 1.25], far: [-0.55, -0.15], legN: [0.55, -0.3], legF: [0.25, -0.5] },
  reach: { rot: -0.1, near: [2.5, 2.6], far: [0.55, 1.2], legN: [0.08, -0.04], legF: [-0.18, -0.26] },
};
export function drawAstronaut(ctx, c, o = {}) {
  const x = o.x ?? 300, y = o.y ?? 260, s = o.s ?? 1, dir = o.dir === -1 ? -1 : 1, P = POSES[o.pose] ?? POSES.work;
  const ca = Math.cos(P.rot), sa = Math.sin(P.rot);
  const W = (lx, ly) => ({ x: x + dir * s * (lx * ca - ly * sa), y: y + s * (lx * sa + ly * ca) });
  const suit = suitOf(c), fold = alpha(darken(suit, 0.35), 0.8), glove = lighten(c.labelMuted, 0.35), steel = steelOf(c);
  const seg = (p, a, l) => ({ x: p.x + Math.sin(a) * l, y: p.y + Math.cos(a) * l });
  const limb = (p0, a1, a2, l1, l2, wd, col) => {
    const k = seg(p0, a1, l1), e = seg(k, a2, l2);
    rod(ctx, [p0, k], wd, col); rod(ctx, [k, e], wd * 0.92, col);
    ctx.strokeStyle = fold; ctx.lineWidth = 1.6;
    for (const d of [-4, 4]) { const m = lerpP(k, e, 0.12), nx = Math.cos(a2), ny = -Math.sin(a2); ctx.beginPath(); ctx.moveTo(m.x - nx * wd * 0.4 + Math.sin(a2) * d, m.y - ny * wd * 0.4 + Math.cos(a2) * d); ctx.lineTo(m.x + nx * wd * 0.4 + Math.sin(a2) * d, m.y + ny * wd * 0.4 + Math.cos(a2) * d); ctx.stroke(); }
    return e;
  };
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s); ctx.rotate(P.rot);
  const farS = darken(suit, 0.14);
  // far leg and arm
  let e = limb({ x: -6, y: 36 }, P.legF[0], P.legF[1], 40, 40, 23, farS);
  lit(ctx, () => rr(ctx, e.x - 13, e.y - 6, 30, 16, 6), darken(c.labelMuted, 0.1), 28);
  const farHand = limb({ x: -4, y: -30 }, P.far[0], P.far[1], 34, 30, 19, farS);
  ball(ctx, farHand.x, farHand.y, 10, darken(glove, 0.12));
  // backpack
  lit(ctx, () => rr(ctx, -56, -50, 34, 86, 8), mix(suit, c.labelMuted, 0.3), 70, { shade: 0.2 });
  ctx.strokeStyle = fold; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-52, -20); ctx.lineTo(-26, -20); ctx.moveTo(-52, 10); ctx.lineTo(-26, 10); ctx.stroke();
  // torso, waist ring, chest panel
  lit(ctx, () => rr(ctx, -30, -42, 62, 84, 20), suit, 90, { shade: 0.16 });
  rr(ctx, -28, 22, 58, 8, 3); ctx.fillStyle = mix(suit, c.labelMuted, 0.45); ctx.fill(); ctx.strokeStyle = darken(suit, 0.45); ctx.lineWidth = 1.5; ctx.stroke();
  lit(ctx, () => rr(ctx, -6, -26, 30, 20, 4), mix(suit, c.labelMuted, 0.25), 30, { rimW: 1.6 });
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(1 + i * 8, -16, 2.4, 0, TAU); ctx.fillStyle = c['s' + [1, 3, 6][i]]; ctx.fill(); }
  let chest = { x: 9, y: -16 };
  if (o.radio) {
    const rl = c01(o.radioLit ?? 0);
    lit(ctx, () => rr(ctx, 4, -4, 20, 16, 3), darken(c.labelMuted, 0.2), 22, { rimW: 1.4 });
    rod(ctx, [{ x: 20, y: -4 }, { x: 24, y: -22 }], 3, steel);
    glow(ctx, 9, 4, 14, c.s3, rl);
    ctx.beginPath(); ctx.arc(9, 4, 3, 0, TAU); ctx.fillStyle = rl > 0.05 ? lighten(c.s3, 0.4 * rl) : darken(c.s3, 0.4); ctx.fill();
    chest = { x: 14, y: 4 };
  }
  // near leg
  e = limb({ x: 6, y: 36 }, P.legN[0], P.legN[1], 40, 40, 24, suit);
  lit(ctx, () => rr(ctx, e.x - 13, e.y - 6, 32, 16, 6), c.labelMuted, 28);
  // helmet: shell, gold visor, reflection
  lit(ctx, () => { ctx.beginPath(); ctx.arc(6, -68, 30, 0, TAU); }, suit, 60, { shade: 0.16 });
  const vis = darken(mix(c.gold, c.s8, 0.25), 0.12);
  const visor = () => { ctx.beginPath(); ctx.ellipse(15, -66, 19, 21, 0.1, 0, TAU); };
  visor(); ctx.fillStyle = vis; ctx.fill();
  ctx.save(); visor(); ctx.clip();
  ctx.fillStyle = darken(vis, 0.3); ellipse(ctx, 22, -58, 18, 20); ctx.fill();
  ctx.fillStyle = alpha(lighten(c.s1, 0.3), 0.45); ctx.fillRect(-10, -60, 60, 6);
  ctx.strokeStyle = alpha(lighten(vis, 0.85), 0.95); ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(14, -64, 13, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
  ctx.beginPath(); ctx.arc(9, -77, 2.6, 0, TAU); ctx.fillStyle = alpha(lighten(vis, 0.9), 0.95); ctx.fill();
  ctx.restore();
  visor(); ctx.strokeStyle = darken(suit, 0.5); ctx.lineWidth = 2.6; ctx.stroke();
  rr(ctx, -20, -44, 44, 9, 4); ctx.fillStyle = mix(suit, c.labelMuted, 0.4); ctx.fill(); ctx.strokeStyle = darken(suit, 0.45); ctx.lineWidth = 1.5; ctx.stroke();
  // near arm, glove, tool
  const nearHand = limb({ x: 12, y: -30 }, P.near[0], P.near[1], 34, 30, 20, suit);
  if (o.tool === 'wrench') {
    const a = P.near[1], d = { x: Math.sin(a), y: Math.cos(a) }, n = { x: -d.y, y: d.x };
    const tEnd = { x: nearHand.x + d.x * 30 + n.x * 6, y: nearHand.y + d.y * 30 + n.y * 6 };
    rod(ctx, [{ x: nearHand.x - n.x * 8, y: nearHand.y - n.y * 8 }, tEnd], 6, steel);
    ctx.beginPath(); ctx.arc(tEnd.x, tEnd.y, 7, 0, TAU); ctx.fillStyle = steel; ctx.fill(); ctx.strokeStyle = darken(steel, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(tEnd.x + d.x * 3, tEnd.y + d.y * 3, 3.5, 0, TAU); ctx.fillStyle = darken(steel, 0.5); ctx.fill();
  }
  ball(ctx, nearHand.x, nearHand.y, 11, glove);
  ctx.restore();
  return { hands: [W(nearHand.x, nearHand.y), W(farHand.x, farHand.y)], helmet: W(6, -68), chest: W(chest.x, chest.y), box: { x: x - 70 * s, y: y - 105 * s, w: 140 * s, h: 220 * s } };
}

/**
 * drawStationArm(ctx, c, o) -> { panel: {x, y, w, h}, tip, rail: (u) -> {x, y}, box }
 *   A section of space-station truss (rails, cross bracing, a far rail for depth) with a
 *   robotic arm (base, two booms, joints, end tool) and an equipment panel with its lid
 *   open, being repaired.
 *   o: { x, y (left end of the truss's top rail), len = 560, ang = 0 (truss tilt),
 *        at = 0.62 (0..1 panel position), lift = 0.5 (0..1 arm tip height), open = 1
 *        (0..1 lid), lit = false (panel highlighted) }
 */
export function drawStationArm(ctx, c, o = {}) {
  const x = o.x ?? 40, y = o.y ?? 120, len = o.len ?? 560, ang = o.ang ?? 0, H = o.depth ?? 44, lift = c01(o.lift ?? 0.5), open = c01(o.open ?? 1);
  const ca = Math.cos(ang), sa = Math.sin(ang), Wp = (lx, ly) => ({ x: x + lx * ca - ly * sa, y: y + lx * sa + ly * ca });
  const steel = mix(steelOf(c), c.ice, 0.3), suit = suitOf(c), dk = darken(steel, 0.45);
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  // far rail and braces (depth), then the near rails and braces
  rod(ctx, [{ x: 16, y: -12 }, { x: len + 16, y: -12 }], 8, darken(steel, 0.25));
  for (let lx = 0; lx <= len - H; lx += H) {
    rod(ctx, [{ x: lx + 16, y: -12 }, { x: lx, y: 0 }], 4, darken(steel, 0.25));
    rod(ctx, [{ x: lx, y: 0 }, { x: lx + H, y: H }], 5, darken(steel, 0.08));
    rod(ctx, [{ x: lx + H, y: 0 }, { x: lx + H, y: H }], 6, steel);
  }
  rod(ctx, [{ x: 0, y: 0 }, { x: len, y: 0 }], 11, steel);
  rod(ctx, [{ x: 0, y: H }, { x: len, y: H }], 11, steel);
  rod(ctx, [{ x: 0, y: 0 }, { x: 0, y: H }], 7, steel);
  // handrail along the top (for hands)
  ctx.strokeStyle = c.s2; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(len * 0.05, -20); ctx.lineTo(len * 0.95, -20); ctx.stroke();
  for (let i = 0; i <= 6; i++) { const hx = len * (0.05 + i * 0.15); ctx.beginPath(); ctx.moveTo(hx, -20); ctx.lineTo(hx, -6); ctx.stroke(); }
  // the panel under the truss, lid open
  const pu = (o.at ?? 0.62) * len, pw = 92, ph = 58, py = H + 6;
  if (o.lit) glow(ctx, pu, py + ph / 2, 80, c.warning, 0.8);
  lit(ctx, () => rr(ctx, pu - pw / 2, py, pw, ph, 5), mix(suit, c.labelMuted, 0.35), 90, { shade: 0.18 });
  rr(ctx, pu - pw / 2 + 8, py + 8, pw - 16, ph - 16, 3); ctx.fillStyle = darken(c.labelMuted, 0.45); ctx.fill();
  ctx.lineWidth = 3;
  [c.s6, c.s1, c.s2].forEach((col, i) => { ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(pu - pw / 2 + 14 + i * 22, py + 12); ctx.bezierCurveTo(pu - 20 + i * 12, py + ph, pu + i * 8, py + 14, pu + pw / 2 - 14, py + ph - 14 - i * 6); ctx.stroke(); });
  if (open > 0.02) {
    // the lid hangs down from its bottom hinge, inner face toward us, with a handle
    const lh = ph * 0.85 * open, lidC = mix(suit, c.labelMuted, 0.25);
    lit(ctx, () => rr(ctx, pu - pw / 2 + 3, py + ph + 2, pw - 6, lh, 4), lidC, 50, { shade: 0.16 });
    rr(ctx, pu - pw / 2 + 10, py + ph + 8, pw - 20, Math.max(2, lh - 14), 3); ctx.strokeStyle = alpha(darken(lidC, 0.3), 0.7); ctx.lineWidth = 1.4; ctx.stroke();
    rod(ctx, [{ x: pu - 14, y: py + ph + lh - 8 }, { x: pu + 14, y: py + ph + lh - 8 }], 5, steelOf(c));
    for (const hx of [pu - pw * 0.3, pu + pw * 0.3]) { ball(ctx, hx, py + ph + 2, 4, dk); }
  }
  // the arm: hangs from the bottom rail; base, shoulder, two booms, end tool at the panel's side
  const base = { x: len * 0.3, y: H + 4 }, sh = { x: base.x, y: H + 30 }, T = { x: pu - pw / 2 - 34, y: py + ph * 0.5 + 40 * (0.5 - lift) };
  const l1 = len * 0.16, l2 = len * 0.15, dx = T.x - sh.x, dy = T.y - sh.y, d = Math.min(l1 + l2 - 1, Math.hypot(dx, dy));
  const a0 = Math.atan2(dy, dx), ca2 = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), el = { x: sh.x + l1 * Math.cos(a0 + Math.acos(Math.max(-1, Math.min(1, ca2)))), y: sh.y + l1 * Math.sin(a0 + Math.acos(Math.max(-1, Math.min(1, ca2)))) };
  const tip = { x: sh.x + Math.cos(a0) * d, y: sh.y + Math.sin(a0) * d };
  lit(ctx, () => rr(ctx, base.x - 16, H + 2, 32, 22, 5), mix(suit, c.labelMuted, 0.3), 30);
  rod(ctx, [sh, el], 18, suit); rod(ctx, [el, tip], 15, suit);
  for (const j of [sh, el]) { ball(ctx, j.x, j.y, 14, mix(suit, c.labelMuted, 0.35)); ctx.beginPath(); ctx.arc(j.x, j.y, 6, 0, TAU); ctx.fillStyle = dk; ctx.fill(); }
  const ea = Math.atan2(tip.y - el.y, tip.x - el.x), tool = { x: tip.x + Math.cos(ea) * 22, y: tip.y + Math.sin(ea) * 22 };
  rod(ctx, [tip, tool], 20, mix(suit, c.labelMuted, 0.4));
  ctx.strokeStyle = dk; ctx.lineWidth = 2; for (const u of [0.3, 0.7]) { const p = lerpP(tip, tool, u); ctx.beginPath(); ctx.arc(p.x, p.y, 10, ea + Math.PI / 2 - 0.9, ea + Math.PI / 2 + 0.9); ctx.stroke(); }
  ctx.restore();
  return { panel: { ...Wp(pu - pw / 2, py), w: pw, h: ph }, tip: Wp(tool.x, tool.y), rail: (u) => Wp(len * (0.05 + 0.9 * c01(u)), -20), box: { x, y: y - 30, w: len, h: H + 30 + ph * 1.9 + 70 } };
}

/**
 * drawBat(ctx, c, o) -> { mouth: {x, y}, box }
 *   A bat in flight, three-quarter side view: furry body, pointed ears, snout, eye dot,
 *   membrane wings stretched over arm and finger bones (near wing large, far wing behind).
 *   o: { x, y (body centre), s = 1 (wingspan about 170 px), dir = 1 (flies right), flap = 0
 *        (0..1 wingbeat phase) }. mouth: where its sound pulses leave.
 */
export function drawBat(ctx, c, o = {}) {
  const x = o.x ?? 400, y = o.y ?? 300, s = o.s ?? 1, dir = o.dir === -1 ? -1 : 1, e = Math.cos(TAU * (o.flap ?? 0));
  const fur = darken(mix(c.s8, c.labelMuted, 0.6), 0.5), mem = darken(mix(fur, c.s4, 0.15), 0.15);
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  const wingAt = (k, col, bone, far = false) => {
    // the wing as if spread flat (X out along the span, Y back), projected: the span axis
    // tilts up (e = 1) or down (e = -1), so a wing seen edge-on at mid-beat is short.
    // far: the far wing's root sits higher on the back and it never folds below the body
    // (seen from a little above), so it stays visible behind the body at every phase.
    const ee = far ? 0.55 + 0.45 * e : e, ux = far ? 0.22 : -0.3;
    const S = far ? { x: 10, y: -10 } : { x: 6, y: -6 }, hip = far ? { x: -14, y: -4 } : { x: -18, y: 6 };
    const ul = Math.hypot(ux, ee * 0.95 + 0.12) || 1, u = { x: ux / ul * k, y: -(ee * 0.95 + 0.12) / ul * k }, v = { x: -0.95 * k, y: 0.12 * k };
    const span = 0.25 + 0.75 * Math.abs(ee * 0.95 + 0.12);
    const Pj = (X, Y) => ({ x: S.x + u.x * X * span + v.x * Y, y: S.y + u.y * X * span + v.y * Y });
    const Wr = Pj(44, -4), tips = [Pj(84, 6), Pj(70, 30), Pj(40, 42)];
    const memb = () => {
      ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(Wr.x, Wr.y); ctx.lineTo(tips[0].x, tips[0].y);
      for (let i = 1; i < 3; i++) { const m = lerpP(tips[i - 1], tips[i], 0.5), cx = lerpP(m, Wr, 0.25); ctx.quadraticCurveTo(cx.x, cx.y, tips[i].x, tips[i].y); }
      const m = lerpP(tips[2], hip, 0.5), cx = lerpP(m, Wr, 0.2); ctx.quadraticCurveTo(cx.x, cx.y, hip.x, hip.y); ctx.closePath();
    };
    lit(ctx, memb, col, 60 * k, { shade: 0.2 });
    // membrane panels between the finger bones: each its own light or shade, the
    // trailing edges darker where the skin sags between the tips
    ctx.save(); memb(); ctx.clip();
    [[Wr, tips[0], tips[1]], [Wr, tips[1], tips[2]], [Wr, tips[2], hip, S], [S, Wr, tips[0]]].forEach((Q, i) => {
      shape(ctx, Q); ctx.fillStyle = i === 1 ? alpha(darken(col, 0.32), 0.6) : i === 2 ? alpha(darken(col, 0.16), 0.45) : alpha(lighten(col, 0.2), 0.45); ctx.fill();
    });
    ctx.lineCap = 'round'; ctx.lineWidth = 5 * k; ctx.strokeStyle = alpha(darken(col, 0.38), 0.55);
    for (let i = 1; i < 3; i++) { const m = lerpP(tips[i - 1], tips[i], 0.5), cx = lerpP(m, Wr, 0.25); ctx.beginPath(); ctx.moveTo(tips[i - 1].x, tips[i - 1].y); ctx.quadraticCurveTo(cx.x, cx.y, tips[i].x, tips[i].y); ctx.stroke(); }
    ctx.lineWidth = 1.4 * k; ctx.strokeStyle = alpha(lighten(col, 0.45), 0.7);
    for (const p of tips) { ctx.beginPath(); ctx.moveTo(Wr.x - 1.5, Wr.y - 1.5); ctx.lineTo(p.x - 1.5, p.y - 1.5); ctx.stroke(); }
    ctx.restore();
    memb(); ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = bone; ctx.lineWidth = 2.2 * k; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(Wr.x, Wr.y); for (const p of tips) { ctx.moveTo(Wr.x, Wr.y); ctx.lineTo(p.x, p.y); } ctx.stroke();
    ctx.beginPath(); ctx.moveTo(Wr.x, Wr.y); ctx.lineTo(Wr.x + 6, Wr.y - 4); ctx.stroke();
  };
  wingAt(0.62, darken(mem, 0.25), darken(fur, 0.2), true);
  // body, head, ears, snout, eye dot, feet
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(-4, 0, 22, 12, 0.08, 0, TAU); }, fur, 40, { shade: 0.22 });
  ctx.strokeStyle = alpha(lighten(fur, 0.35), 0.6); ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-18 + i * 6, -6); ctx.lineTo(-20 + i * 6, -1); ctx.stroke(); }
  rod(ctx, [{ x: -20, y: 6 }, { x: -30, y: 12 }], 3, darken(fur, 0.2));
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(14, -12); ctx.lineTo(16, -30); ctx.lineTo(24, -13); ctx.closePath(); }, fur, 14, { rimW: 1.6 });
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(22, -10); ctx.lineTo(30, -27); ctx.lineTo(31, -8); ctx.closePath(); }, fur, 14, { rimW: 1.6 });
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(24, -3, 11, 9, 0.2, 0, TAU); }, fur, 20, { shade: 0.2 });
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(30, -7); ctx.quadraticCurveTo(40, -3, 37, 2); ctx.lineTo(29, 3); ctx.closePath(); }, lighten(fur, 0.08), 12, { rimW: 1.4 });
  ctx.beginPath(); ctx.arc(28, -5, 1.8, 0, TAU); ctx.fillStyle = lighten(fur, 0.75); ctx.fill();
  wingAt(1, mem, lighten(fur, 0.25));
  ctx.restore();
  return { mouth: { x: x + dir * s * 37, y: y + s * 1 }, box: { x: x - 75 * s, y: y - 60 * s, w: 150 * s, h: 120 * s } };
}

/**
 * drawMoth(ctx, c, o) -> { body: {x, y}, box }
 *   A moth from above: soft wings with wavy bands and a ring spot, fringed edges, a furry
 *   body, feathery antennae, eye dots only.
 *   o: { x, y, s = 1 (wingspan about 110 px), dir = 1 (head to the right), angle = 0
 *        (extra turn, radians), flap = 0 (0..1: the wings fold up and spread) }
 */
export function drawMoth(ctx, c, o = {}) {
  const x = o.x ?? 560, y = o.y ?? 300, s = o.s ?? 1, dir = o.dir === -1 ? -1 : 1;
  const kw = 0.35 + 0.65 * Math.abs(Math.cos(Math.PI * (o.flap ?? 0)));
  const wingC = lighten(mix(c.gold, c.labelMuted, 0.55), 0.25), bodyC = darken(wingC, 0.3);
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.angle ?? 0); ctx.scale(dir * s, s);
  for (const sd of [-1, 1]) {
    ctx.save(); ctx.scale(1, sd * kw);
    const hind = () => { ctx.beginPath(); ctx.moveTo(-4, -3); ctx.bezierCurveTo(-8, -34, -34, -36, -34, -16); ctx.quadraticCurveTo(-30, -4, -16, -2); ctx.closePath(); };
    lit(ctx, hind, darken(wingC, 0.06), 40, { shade: 0.16 });
    const fore = () => { ctx.beginPath(); ctx.moveTo(8, -4); ctx.bezierCurveTo(10, -30, 0, -52, -8, -54); ctx.quadraticCurveTo(-26, -46, -26, -30); ctx.quadraticCurveTo(-14, -12, -10, -3); ctx.closePath(); };
    lit(ctx, fore, wingC, 50, { shade: 0.14 });
    ctx.save(); fore(); ctx.clip();
    ctx.strokeStyle = alpha(darken(wingC, 0.4), 0.8); ctx.lineWidth = 2;
    for (const k of [0.4, 0.7]) { ctx.beginPath(); for (let i = 0; i <= 8; i++) { const px = 8 - 34 * (i / 8), py = -54 * k + 3 * Math.sin(i * 1.6); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.arc(-2, -26, 5, 0, TAU); ctx.strokeStyle = darken(wingC, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(-2, -26, 2, 0, TAU); ctx.fillStyle = darken(wingC, 0.55); ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = bodyC; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  for (const sd of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(20, sd * 3); ctx.quadraticCurveTo(32, sd * 6, 38, sd * 16); ctx.stroke();
    for (let i = 1; i < 5; i++) { const px = 20 + i * 4, py = sd * (3 + i * 2.6); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 3, py - sd * 3); ctx.moveTo(px, py); ctx.lineTo(px - 2, py + sd * 3); ctx.stroke(); }
  }
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(-2, 0, 22, 6.5, 0, 0, TAU); }, bodyC, 24, { shade: 0.2 });
  ctx.strokeStyle = alpha(darken(bodyC, 0.3), 0.7); ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-18 + i * 6, -5); ctx.lineTo(-18 + i * 6, 5); ctx.stroke(); }
  ball(ctx, 20, 0, 5, bodyC);
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(22, sd * 3.6, 1.5, 0, TAU); ctx.fillStyle = darken(bodyC, 0.6); ctx.fill(); }
  ctx.restore();
  return { body: { x, y }, box: { x: x - 55 * s, y: y - 55 * s, w: 110 * s, h: 110 * s } };
}

/**
 * drawWaterDish(ctx, c, o) -> { surface: { cx, cy, rx, ry }, box }
 *   A shallow glass dish of water seen at a low angle: rim with glass thickness, side
 *   walls, the water body and its surface ellipse (draw ripple rings in perspective on
 *   surface: ellipses with ry/rx kept).
 *   o: { x (centre), y (bench top), w = 220, d = 34 (depth) }
 */
export function drawWaterDish(ctx, c, o = {}) {
  const x = o.x ?? 300, y = o.y ?? 470, w = o.w ?? 220, d = o.d ?? 34, rx = w / 2, ry = w * 0.13, glass = c.glass, water = c.water;
  const ty = y - d, brx = rx * 0.93, bry = ry * 0.93;
  ctx.save();
  drawShadow(ctx, c, x, y + 3, rx * 0.95);
  const body = () => { ctx.beginPath(); ctx.ellipse(x, ty, rx, ry, 0, Math.PI, 0); ctx.lineTo(x + brx, y); ctx.ellipse(x, y, brx, bry, 0, 0, Math.PI); ctx.closePath(); };
  body(); ctx.fillStyle = alpha(glass, 0.22); ctx.fill();
  // the water body and its surface
  const sy = ty + 7, srx = rx - 6, sry = ry - 2;
  ctx.beginPath(); ctx.ellipse(x, sy, srx, sry, 0, Math.PI, 0); ctx.lineTo(x + brx - 5, y - 3); ctx.ellipse(x, y - 3, brx - 5, bry - 2, 0, 0, Math.PI); ctx.closePath();
  ctx.fillStyle = alpha(water, 0.42); ctx.fill();
  ctx.save(); body(); ctx.clip(); ctx.fillStyle = alpha(darken(water, 0.35), 0.3); ctx.fillRect(x + rx * 0.4, ty - ry, rx, d + 2 * ry); ctx.restore();
  ellipse(ctx, x, sy, srx, sry); ctx.fillStyle = alpha(lighten(water, 0.35), 0.55); ctx.fill();
  ctx.save(); ellipse(ctx, x, sy, srx, sry); ctx.clip();
  ellipse(ctx, x + srx * 0.25, sy + sry * 0.45, srx, sry); ctx.fillStyle = alpha(darken(water, 0.2), 0.3); ctx.fill();
  ctx.strokeStyle = alpha(lighten(water, 0.8), 0.8); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(x, sy, srx * 0.8, sry * 0.6, 0, Math.PI * 1.1, Math.PI * 1.35); ctx.stroke();
  ctx.restore();
  ellipse(ctx, x, sy, srx, sry); ctx.strokeStyle = alpha(darken(water, 0.3), 0.7); ctx.lineWidth = 1.4; ctx.stroke();
  // glass: side highlight, rim thickness (outer and inner ellipse), outline
  ctx.save(); body(); ctx.clip();
  ctx.strokeStyle = alpha(lighten(glass, 0.75), 0.8); ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - rx * 0.78, ty + ry * 0.75); ctx.lineTo(x - brx * 0.76, y + bry * 0.6); ctx.stroke();
  ctx.restore();
  body(); ctx.strokeStyle = alpha(darken(glass, 0.35), 0.95); ctx.lineWidth = 2.4; ctx.stroke();
  ellipse(ctx, x, ty, rx, ry); ctx.strokeStyle = alpha(darken(glass, 0.3), 0.95); ctx.lineWidth = 2.2; ctx.stroke();
  ellipse(ctx, x, ty + 1, rx - 5, ry - 3); ctx.strokeStyle = alpha(lighten(glass, 0.55), 0.85); ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  return { surface: { cx: x, cy: sy, rx: srx, ry: sry }, box: { x: x - rx, y: ty - ry, w: w, h: d + ry + bry } };
}

/**
 * drawBucketAndSpoons(ctx, c, o) -> { contact, water: {x, y, w, h}, side, grips: [l, r], box }
 *   A steel bucket of water seen a little from above, and two steel spoons. Under water,
 *   the spoon bowls show through the surface shifted and tinted (refraction), so the
 *   handles look bent at the surface.
 *   o: { x (centre), y (floor), R = 90 (top radius), H = 130, under = true (false: the
 *        spoons held in the air above the bucket), tap = 0 (0..1: 1 = bowls meet), side =
 *        1 (the listener is to the right; -1 left), grip = 'front' | 'side' (both handles
 *        out over the rim on the side side, for a side-view figure there) }
 *   grips: the spoon handle ends (hand points); contact: where the bowls meet.
 */
export function drawBucketAndSpoons(ctx, c, o = {}) {
  const x = o.x ?? 400, y = o.y ?? 480, R = o.R ?? 90, H = o.H ?? 130, tap = c01(o.tap ?? 0), under = o.under !== false;
  const steel = steelOf(c), water = c.water, ty = y - H, ry = R * 0.36, bR = R * 0.78, bry = bR * 0.36;
  ctx.save();
  drawShadow(ctx, c, x, y + 4, bR * 1.15);
  // inner back wall (above the water) then the water surface
  ellipse(ctx, x, ty, R, ry); ctx.fillStyle = darken(steel, 0.3); ctx.fill();
  const sy = ty + 12, srx = R * 0.94, sry = ry * 0.92;
  // spoons
  const sep = 12 + (1 - tap) * 46;
  const bowlsY = under ? sy + 6 : ty - 50, topY = under ? ty - 70 : ty - 130;
  const bowls = [{ x: x - sep / 2 - 12, y: bowlsY }, { x: x + sep / 2 + 12, y: bowlsY }];
  // grip 'side': both handles out over the rim on the o.side side (a side-view figure there
  // holds them with its head beside the bucket wall); the far bowl's handle sits higher
  const gsd = o.side === -1 ? -1 : 1, gfar = gsd > 0 ? 0 : 1;
  const grips = o.grip === 'side'
    ? [0, 1].map((i) => (i === gfar ? { x: x + gsd * (R + 30), y: ty - (under ? 48 : 104) } : { x: x + gsd * (R + 12), y: ty - (under ? 30 : 86) }))
    : [{ x: x - R * 0.85, y: topY }, { x: x + R * 0.85, y: topY }];
  const spoon = (bw, g, s, dy, tint) => {
    const hEnd = { x: bw.x + (g.x - bw.x) * 1, y: bw.y + (g.y - bw.y) * 1 };
    rod(ctx, [{ x: bw.x + s * 8, y: bw.y + dy - 4 }, { x: hEnd.x, y: hEnd.y + dy }], 6, steel);
    lit(ctx, () => { ctx.beginPath(); ctx.ellipse(bw.x, bw.y + dy, 15, 10, s * 0.5, 0, TAU); }, lighten(steel, 0.1), 24, { rim: darken(steel, 0.45) });
    ellipse(ctx, bw.x - 3, bw.y + dy - 3, 5, 3, s * 0.5); ctx.fillStyle = alpha(lighten(steel, 0.8), 0.9); ctx.fill();
    if (tint) { ellipse(ctx, bw.x, bw.y + dy, 15, 10, s * 0.5); ctx.fillStyle = alpha(water, 0.3); ctx.fill(); }
  };
  if (under) {
    // under the surface: the image shifted up and squashed, tinted; above it: the handles in air
    ctx.save(); ellipse(ctx, x, sy, srx, sry); ctx.clip();
    ctx.fillStyle = alpha(darken(water, 0.15), 0.55); ctx.fillRect(x - R, sy - sry, 2 * R, 2 * sry);
    bowls.forEach((bw, i) => spoon(bw, grips[i], i ? 1 : -1, -5, true));
    ctx.fillStyle = alpha(water, 0.28); ctx.fillRect(x - R, sy - sry, 2 * R, 2 * sry);
    ctx.strokeStyle = alpha(lighten(water, 0.75), 0.8); ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const k of [0.5, 0.8]) { ctx.beginPath(); ctx.ellipse(x, sy, srx * k, sry * k, 0, Math.PI * 1.1, Math.PI * 1.35); ctx.stroke(); }
    ctx.restore();
    ellipse(ctx, x, sy, srx, sry); ctx.strokeStyle = alpha(darken(water, 0.3), 0.8); ctx.lineWidth = 1.5; ctx.stroke();
    grips.forEach((g, i) => {
      const bw = bowls[i], e = lerpP(bw, g, 0.38);
      rod(ctx, [e, g], 6, steel);
      ctx.beginPath(); ctx.ellipse(e.x, e.y + 1, 8, 2.5, 0, 0, TAU); ctx.strokeStyle = alpha(lighten(water, 0.6), 0.9); ctx.lineWidth = 1.5; ctx.stroke();
    });
  } else {
    ellipse(ctx, x, sy, srx, sry); ctx.fillStyle = alpha(water, 0.55); ctx.fill();
    ctx.save(); ellipse(ctx, x, sy, srx, sry); ctx.clip(); ellipse(ctx, x + srx * 0.25, sy + sry * 0.4, srx, sry); ctx.fillStyle = alpha(darken(water, 0.2), 0.3); ctx.fill(); ctx.restore();
    ellipse(ctx, x, sy, srx, sry); ctx.strokeStyle = alpha(darken(water, 0.3), 0.8); ctx.lineWidth = 1.5; ctx.stroke();
  }
  // the bucket wall (front), bands, rolled rim, folded handle
  const wall = () => { ctx.beginPath(); ctx.moveTo(x - R, ty); ctx.lineTo(x - bR, y); ctx.ellipse(x, y, bR, bry, 0, Math.PI, 0, true); ctx.lineTo(x + R, ty); ctx.ellipse(x, ty, R, ry, 0, 0, Math.PI); ctx.closePath(); };
  lit(ctx, wall, steel, R * 1.6, { shade: 0.2 });
  ctx.save(); wall(); ctx.clip();
  ctx.fillStyle = alpha(darken(steel, 0.35), 0.45); ctx.fillRect(x + R * 0.45, ty - ry, R, H + 2 * ry);
  ctx.strokeStyle = alpha(lighten(steel, 0.7), 0.85); ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - R * 0.6, ty + ry + 6); ctx.lineTo(x - bR * 0.58, y + bry * 0.6); ctx.stroke();
  ctx.strokeStyle = alpha(darken(steel, 0.35), 0.7); ctx.lineWidth = 2;
  for (const u of [0.3, 0.75]) { const yy = ty + H * u, rr2 = R + (bR - R) * u; ctx.beginPath(); ctx.ellipse(x, yy, rr2, ry + (bry - ry) * u, 0, 0.05, Math.PI - 0.05); ctx.stroke(); }
  ctx.restore();
  ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.ellipse(x, ty, R, ry, 0, 0, TAU); ctx.strokeStyle = darken(steel, 0.42); ctx.lineWidth = 7; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, ty - 1, R, ry, 0, Math.PI * 0.9, Math.PI * 1.6); ctx.strokeStyle = alpha(lighten(steel, 0.65), 0.9); ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, ty + 6, R * 0.97, H * 0.55, 0, 0.12, Math.PI - 0.12); ctx.strokeStyle = darken(steel, 0.45); ctx.lineWidth = 6; ctx.stroke();
  ctx.strokeStyle = lighten(steel, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
  ball(ctx, x - R + 3, ty + 9, 6, darken(steel, 0.1)); ball(ctx, x + R - 3, ty + 9, 6, darken(steel, 0.1));
  if (!under) grips.forEach((g, i) => spoon(bowls[i], g, i ? 1 : -1, 0, false));
  ctx.restore();
  const contact = { x, y: under ? bowlsY - 5 : bowlsY }, sd = o.side === -1 ? -1 : 1;
  return { contact, water: { x: x - R, y: sy, w: 2 * R, h: y - sy }, side: { x: x + sd * (R + bR) / 2, y: ty + H * 0.45 }, grips, box: (() => { const x0 = Math.min(x - R - 8, ...grips.map((g) => g.x - 10)), x1 = Math.max(x + R + 8, ...grips.map((g) => g.x + 10)), y0 = Math.min(topY, ...grips.map((g) => g.y)) - 10; return { x: x0, y: y0, w: x1 - x0, h: y + bry - y0 }; })() };
}

// ---------------------------------------------------------------------------------------
// 2026-11-03 (K4, wave 2): parts for L05, L06, L07. Same recipe and rules as above.
// ---------------------------------------------------------------------------------------
const earBoneOf = (c) => lighten(mix(c.gold, c.labelMuted, 0.62), 0.42);
const nerveOf = (c) => lighten(mix(c.gold, c.s8, 0.35), 0.15);
const snailOf = (c) => lighten(mix(c.s4, c.gold, 0.45), 0.22);
const dolphinOf = (c) => darken(mix(c.labelMuted, c.s1, 0.35), 0.22);

// Linear table lookup: U ascending, V values; u clamped into the table.
function tabAt(U, V, u) {
  if (u <= U[0]) return V[0];
  for (let i = 1; i < U.length; i++) if (u <= U[i]) return V[i - 1] + (V[i] - V[i - 1]) * (u - U[i - 1]) / (U[i] - U[i - 1]);
  return V[V.length - 1];
}

// The point at fraction u (0..1) of a polyline's length.
function alongPath(P, u) {
  const d = []; let L = 0;
  for (let i = 1; i < P.length; i++) { d.push(Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y)); L += d[i - 1]; }
  let k = c01(u) * L;
  for (let i = 0; i < d.length; i++) {
    if (k <= d[i] || i === d.length - 1) return lerpP(P[i], P[i + 1], d[i] ? Math.min(1, k / d[i]) : 0);
    k -= d[i];
  }
  return { x: P[0].x, y: P[0].y };
}

// A signal dot with a soft glow (pulses travelling along a part).
function signalDot(ctx, c, p, r = 7) {
  glow(ctx, p.x, p.y, r * 3.2, c.warning, 1);
  ball(ctx, p.x, p.y, r, lighten(c.warning, 0.2));
}

/**
 * drawEarCutaway(ctx, c, o) -> { pinna, canal, eardrum, bones, cochlea, nerve, brain, tags, path, box }
 *   The ear in section (book Fig 10.24): the outer ear (pinna) on the outside of the head,
 *   the ear canal through the side of the head, the eardrum (a thin membrane across the
 *   canal's end), the three tiny bones in the air pocket behind it, the snail-shaped
 *   cochlea with its loops in the skull bone, and the nerve leaving towards the brain.
 *   o: { x, y (the eardrum), w = 410 (overall width; >= 300 at 390), dir = 1 (sound comes
 *        from the left, the brain is to the right; -1 mirrored), drum = 0 (-1..1 the
 *        eardrum's displacement now, caller values), bones = 0 (0..1 the bones' swing now),
 *        lit = null | 'canal' | 'eardrum' | 'bones' | 'cochlea' | 'nerve' (one part
 *        highlighted, for TapLight chips), pulse = null (0..1: a signal dot running
 *        eardrum -> bones -> cochlea -> nerve; null or 0: none), skinTone = 1 }
 *   Footprint: x - 0.52 w to x + 0.48 w, y - 0.37 w to y + 0.29 w (dir 1).
 *   tags: a clear label spot for each part: eardrum and bones beside their parts, nerve
 *   above, pinna, canal, cochlea below the drawing, about 120 px apart at w 410 (26 px labels, no leader lines). path(u): the pulse route, for the caller's own dots.
 */
export function drawEarCutaway(ctx, c, o = {}) {
  const x = o.x ?? 360, y = o.y ?? 270, w = o.w ?? 410, s = w / 410, dir = o.dir === -1 ? -1 : 1;
  const skin = o.skin ?? figureLook(c, { skin: o.skinTone ?? 1 }).skin, tis = tissueOf(c), bone = earBoneOf(c);
  const drum = Math.max(-1, Math.min(1, o.drum ?? 0)), sw = c01(o.bones ?? 0), on = o.lit ?? null, warm = c.warning;
  const W = (p) => ({ x: x + dir * s * p.x, y: y + s * p.y });
  const dd = drum * 7, bx = sw * 4;
  const route = [{ x: dd * 0.6, y: 8 }, { x: 11 + bx * 0.4, y: -22 }, { x: 25 + bx, y: -20 }, { x: 31 + bx, y: -4 }, { x: 46 + bx, y: -6 }, { x: 64, y: 0 }, { x: 86, y: 6 }, { x: 104, y: -6 }, { x: 150, y: -36 }, { x: 196, y: -62 }];
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  // the side of the head in section: soft tissue, a skin layer on the outside, skull bone
  const slab = () => rr(ctx, -132, -118, 330, 236, 28);
  lit(ctx, slab, tis, 200, { shade: 0.14 });
  ctx.save(); slab(); ctx.clip();
  ctx.fillStyle = skin; ctx.fillRect(-140, -130, 18, 260);
  ctx.fillStyle = alpha(darken(skin, 0.25), 0.6); ctx.fillRect(-123, -130, 2.5, 260);
  const boneP = () => {
    ctx.beginPath(); ctx.moveTo(-50, -124); ctx.bezierCurveTo(40, -128, 150, -124, 204, -112); ctx.lineTo(204, 124);
    ctx.bezierCurveTo(120, 124, 20, 116, -44, 124); ctx.bezierCurveTo(-62, 60, -66, -60, -50, -124); ctx.closePath();
  };
  lit(ctx, boneP, bone, 170, { shade: 0.13, rim: darken(bone, 0.35) });
  const rnd = lcg(1024);
  ctx.save(); boneP(); ctx.clip(); ctx.fillStyle = alpha(darken(bone, 0.3), 0.35);
  for (let i = 0; i < 46; i++) { ellipse(ctx, -40 + rnd() * 240, -118 + rnd() * 236, 1.6 + rnd() * 2.6, 1.2 + rnd() * 1.8, rnd() * 3); ctx.fill(); }
  ctx.restore();
  // the air pocket of the middle ear, and the hollow of the inner ear
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(24, -6, 30, 42, 0.1, 0, TAU); }, darken(tis, 0.5), 60, { shade: 0.2, rim: darken(bone, 0.45) });
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(76, -14, 46, 56, 0, 0, TAU); }, darken(bone, 0.12), 80, { shade: 0.1, rim: alpha(darken(bone, 0.3), 0.6), rimW: 1.5 });
  ctx.restore();
  // the ear canal: a hollow tube from the opening to the eardrum
  const canalP = [{ x: -136, y: 2 }, { x: -96, y: -4 }, { x: -52, y: 5 }, { x: -3, y: 8 }];
  if (on === 'canal') { polyline(ctx, canalP); ctx.strokeStyle = alpha(warm, 0.45); ctx.lineWidth = 46; ctx.lineCap = 'round'; ctx.stroke(); }
  const canal = bandOf(ctx, canalP, (u) => 32 - u * 9);
  canal(); ctx.fillStyle = darken(tis, 0.62); ctx.fill();
  ctx.save(); canal(); ctx.clip();
  polyline(ctx, canalP, 0, 11); ctx.strokeStyle = alpha(darken(tis, 0.2), 0.8); ctx.lineWidth = 9; ctx.stroke();
  polyline(ctx, canalP, 0, -12); ctx.strokeStyle = alpha(darken(tis, 0.42), 0.9); ctx.lineWidth = 6; ctx.stroke();
  for (let i = 0; i < 6; i++) { const p = alongPath(canalP, 0.08 + i * 0.07); ctx.strokeStyle = alpha(darken(skin, 0.5), 0.7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y - 13); ctx.lineTo(p.x + 3, p.y - 8); ctx.stroke(); }
  ctx.restore();
  canal(); ctx.strokeStyle = on === 'canal' ? warm : darken(tis, 0.55); ctx.lineWidth = 2.2; ctx.stroke();
  // the pinna (outer ear), outside the head
  const pin = () => {
    ctx.beginPath(); ctx.moveTo(-126, -44); ctx.bezierCurveTo(-138, -118, -198, -152, -214, -98);
    ctx.bezierCurveTo(-226, -52, -208, 8, -198, 40); ctx.bezierCurveTo(-192, 70, -172, 98, -150, 90);
    ctx.bezierCurveTo(-134, 84, -128, 64, -126, 30); ctx.closePath();
  };
  lit(ctx, pin, skin, 110, { shade: 0.2, rim: darken(skin, 0.42) });
  ctx.save(); pin(); ctx.clip();
  ctx.strokeStyle = alpha(darken(skin, 0.32), 0.85); ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-140, -70); ctx.bezierCurveTo(-150, -118, -194, -132, -202, -94); ctx.bezierCurveTo(-210, -60, -196, -6, -188, 30); ctx.stroke();
  ctx.strokeStyle = alpha(lighten(skin, 0.4), 0.8); ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-146, -76); ctx.bezierCurveTo(-156, -112, -188, -122, -194, -92); ctx.stroke();
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(-148, 4, 22, 32, 0.15, 0, TAU); }, darken(skin, 0.22), 40, { shade: 0.25, rim: alpha(darken(skin, 0.45), 0.8), rimW: 1.6 });
  ctx.restore();
  ctx.fillStyle = darken(tis, 0.62); ellipse(ctx, -130, 3, 7, 14); ctx.fill();
  // the eardrum: a thin membrane across the canal's end, pushed in and out (drum)
  const drumP = () => { ctx.beginPath(); ctx.moveTo(-7, -16); ctx.quadraticCurveTo(-2 + dd, 8, 5, 31); };
  if (on === 'eardrum') glow(ctx, 0, 8, 36, warm, 1);
  ctx.lineCap = 'round';
  drumP(); ctx.strokeStyle = darken(snailOf(c), 0.45); ctx.lineWidth = 7.5; ctx.stroke();
  drumP(); ctx.strokeStyle = on === 'eardrum' ? lighten(warm, 0.3) : lighten(mix(c.s4, skin, 0.5), 0.35); ctx.lineWidth = 4; ctx.stroke();
  // the three tiny bones: hammer on the eardrum, anvil, stirrup on the oval window
  if (on === 'bones') glow(ctx, 24 + bx, -14, 40, warm, 1);
  const bc = on === 'bones' ? lighten(warm, 0.35) : lighten(bone, 0.18);
  rod(ctx, [{ x: dd * 0.6, y: 8 }, { x: 5 + dd * 0.3, y: -6 }, { x: 11 + bx * 0.4, y: -20 }], 5, bc);
  ball(ctx, 12 + bx * 0.4, -25, 7.5, bc);
  rod(ctx, [{ x: 23 + bx, y: -24 }, { x: 28 + bx, y: -14 }, { x: 31 + bx, y: -5 }], 5, bc);
  ball(ctx, 23 + bx, -25, 7, bc);
  ctx.save(); ctx.lineCap = 'round';
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(32 + bx, -5); ctx.quadraticCurveTo(39 + bx, -6 + k * 9, 46 + bx, -6 + k * 6);
    ctx.strokeStyle = darken(bc, 0.45); ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = bc; ctx.lineWidth = 2.6; ctx.stroke();
  }
  ctx.restore();
  lit(ctx, () => rr(ctx, 45 + bx, -15, 6, 18, 2.5), bc, 12, { rimW: 1.6 });
  // the inner ear: the loops (balance canals), the vestibule and the cochlea
  const sn = on === 'cochlea' ? lighten(warm, 0.25) : snailOf(c);
  if (on === 'cochlea') glow(ctx, 86, 6, 52, warm, 1);
  ctx.save(); ctx.lineCap = 'round';
  for (const [cx, cy, r] of [[60, -56, 17], [80, -48, 14], [46, -44, 12]]) {
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 0.62, Math.PI * 2.38); ctx.strokeStyle = darken(snailOf(c), 0.45); ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = snailOf(c); ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 1.1, Math.PI * 1.5); ctx.strokeStyle = alpha(lighten(snailOf(c), 0.5), 0.9); ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
  rod(ctx, [{ x: 50, y: -8 }, { x: 60, y: -18 }, { x: 70, y: -2 }], 14, snailOf(c));
  ball(ctx, 56, -16, 11, snailOf(c));
  ball(ctx, 86, 6, 31, sn);
  ctx.save(); ctx.lineCap = 'round';
  const spiral = (dx, dy) => { ctx.beginPath(); for (let i = 0; i <= 90; i++) { const th = i / 90 * 2.6 * TAU, r = 27 * (1 - i / 98); const px = 86 + dx + Math.cos(th + 2.6) * r, py = 6 + dy + Math.sin(th + 2.6) * r * 0.92; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } };
  spiral(1.5, 1.5); ctx.strokeStyle = darken(sn, 0.42); ctx.lineWidth = 3; ctx.stroke();
  spiral(-1.5, -1.5); ctx.strokeStyle = alpha(lighten(sn, 0.5), 0.9); ctx.lineWidth = 1.6; ctx.stroke();
  ctx.restore();
  // the nerve, from the cochlea towards the brain
  const nv = on === 'nerve' ? lighten(warm, 0.2) : nerveOf(c);
  const nP = [{ x: 104, y: -4 }, { x: 128, y: -20 }, { x: 160, y: -42 }, { x: 196, y: -62 }];
  if (on === 'nerve') { polyline(ctx, nP); ctx.strokeStyle = alpha(warm, 0.45); ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.stroke(); }
  rod(ctx, nP, (u) => 13 - u * 3, nv);
  ctx.save(); ctx.lineCap = 'round';
  for (const k of [-3, 2.5]) { polyline(ctx, nP, 0, k); ctx.strokeStyle = alpha(darken(nv, 0.4), 0.55); ctx.lineWidth = 1.2; ctx.stroke(); }
  ctx.restore();
  // the signal running through
  const pu = o.pulse;
  if (pu != null && pu > 0 && pu <= 1) signalDot(ctx, c, alongPath(route, pu), 6.5);
  ctx.restore();
  const A = (p) => W(p);
  return {
    pinna: A({ x: -196, y: -40 }), canal: A({ x: -66, y: 4 }), eardrum: A({ x: -1, y: 8 }), bones: A({ x: 24, y: -16 }),
    cochlea: A({ x: 86, y: 6 }), nerve: A({ x: 150, y: -36 }), brain: A({ x: 196, y: -62 }),
    tags: { pinna: A({ x: -192, y: 140 }), canal: A({ x: -70, y: 140 }), eardrum: A({ x: -58, y: -56 }), bones: A({ x: 20, y: -94 }), cochlea: A({ x: 96, y: 140 }), nerve: A({ x: 178, y: -142 }) },
    path: (u) => A(alongPath(route, u)),
    box: { x: x - (dir > 0 ? 214 : 204) * s, y: y - 152 * s, w: 418 * s, h: 270 * s },
  };
}

/**
 * drawHeadTop(ctx, c, o) -> { left, right, nose, box }
 *   A head seen from straight above: the hair mass with a crown whorl, the two ears at the
 *   sides, a hint of the nose at the front, the shoulders below (a shirt yoke with light
 *   and shade sides and a collar). No face.
 *   o: { x, y (the head centre), r = 70 (half the head length; >= 50 at 390), ang = 0 (the
 *        nose points up; radians clockwise), litLeft = 0, litRight = 0 (0..1 ear glow; left
 *        = the person's left ear, on the viewer's left when ang is 0), shoulders = true,
 *        skinTone = 1, hairTone = 0, top (shirt colour; default the SimFigure tee) }
 */
export function drawHeadTop(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 260, r = o.r ?? 70, ang = o.ang ?? 0;
  const look = figureLook(c, { skin: o.skinTone ?? 1, hair: o.hairTone ?? 0 });
  const skin = o.skin ?? look.skin, hair = o.hair ?? look.hair, top = o.top ?? look.top;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const P = (lx, ly) => ({ x: x + lx * ca - ly * sa, y: y + lx * sa + ly * ca });
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  if (o.shoulders !== false) {
    // shoulders from above: a shirt yoke (flatter front edge, rounder back, round shoulder
    // caps), a light side (viewer's left, the key light), a shade side, the back sloping
    // away in shade, sleeve seams and a collar round the neck
    const yoke = () => {
      ctx.beginPath(); ctx.moveTo(-r * 1.95, -r * 0.06);
      ctx.bezierCurveTo(-r * 1.2, -r * 0.28, r * 1.2, -r * 0.28, r * 1.95, -r * 0.06);
      ctx.bezierCurveTo(r * 2.32, r * 0.02, r * 2.32, r * 0.6, r * 1.9, r * 0.7);
      ctx.bezierCurveTo(r * 1.1, r * 0.94, -r * 1.1, r * 0.94, -r * 1.9, r * 0.7);
      ctx.bezierCurveTo(-r * 2.32, r * 0.6, -r * 2.32, r * 0.02, -r * 1.95, -r * 0.06); ctx.closePath();
    };
    yoke(); ctx.fillStyle = top; ctx.fill();
    ctx.save(); yoke(); ctx.clip();
    const gh = ctx.createLinearGradient(-r * 2.3, 0, r * 2.3, 0);
    gh.addColorStop(0, alpha(lighten(top, 0.32), 0.7)); gh.addColorStop(0.36, alpha(lighten(top, 0.32), 0));
    gh.addColorStop(0.6, alpha(darken(top, 0.34), 0)); gh.addColorStop(1, alpha(darken(top, 0.34), 0.8));
    ctx.fillStyle = gh; ctx.fillRect(-r * 2.4, -r, r * 4.8, r * 2);
    const gv = ctx.createLinearGradient(0, r * 0.25, 0, r * 0.95);
    gv.addColorStop(0, alpha(darken(top, 0.3), 0)); gv.addColorStop(1, alpha(darken(top, 0.3), 0.6));
    ctx.fillStyle = gv; ctx.fillRect(-r * 2.4, r * 0.25, r * 4.8, r);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 1.9, -r * 0.02); ctx.bezierCurveTo(-r * 1.2, -r * 0.22, r * 1.2, -r * 0.22, r * 1.9, -r * 0.02);
    ctx.strokeStyle = alpha(lighten(top, 0.5), 0.75); ctx.lineWidth = 2.4; ctx.stroke();
    ctx.strokeStyle = alpha(darken(top, 0.32), 0.65); ctx.lineWidth = 2;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * r * 1.45, -r * 0.12); ctx.quadraticCurveTo(k * r * 1.62, r * 0.3, k * r * 1.42, r * 0.78); ctx.stroke(); }
    ctx.restore();
    yoke(); ctx.strokeStyle = darken(top, 0.42); ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.stroke();
    ellipse(ctx, 0, r * 0.32, r * 0.68, r * 0.58); ctx.fillStyle = darken(top, 0.18); ctx.fill();
    ctx.strokeStyle = darken(top, 0.45); ctx.lineWidth = 1.8; ctx.stroke();
    lit(ctx, () => { ctx.beginPath(); ctx.ellipse(0, r * 0.32, r * 0.58, r * 0.5, 0, 0, TAU); }, darken(skin, 0.08), r, { shade: 0.22 });
  }
  // ears at the sides, with their glow
  for (const k of [-1, 1]) {
    const g = c01(k < 0 ? o.litLeft ?? 0 : o.litRight ?? 0), ex = k * r * 0.86;
    glow(ctx, ex + k * r * 0.12, -r * 0.04, r * 0.75, c.warning, g);
    const ear = () => { ctx.beginPath(); ctx.ellipse(ex + k * r * 0.07, -r * 0.04, r * 0.17, r * 0.3, k * 0.18, 0, TAU); };
    lit(ctx, ear, skin, r * 0.5, { shade: 0.2, rim: g > 0.3 ? c.warning : darken(skin, 0.4), rimW: g > 0.3 ? 3 : 2.2 });
    ctx.beginPath(); ctx.ellipse(ex + k * r * 0.09, -r * 0.04, r * 0.08, r * 0.19, k * 0.18, 0, TAU); ctx.strokeStyle = alpha(darken(skin, 0.35), 0.8); ctx.lineWidth = 1.6; ctx.stroke();
  }
  // the nose hint at the front, then the head and the hair mass over it
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(-r * 0.15, -r * 0.88); ctx.quadraticCurveTo(0, -r * 1.16, r * 0.15, -r * 0.88); ctx.closePath(); }, skin, r * 0.4, { shade: 0.18 });
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, r * 0.84, r, 0, 0, TAU); }, skin, r * 1.6, { shade: 0.16 });
  const hm = () => {
    ctx.beginPath(); ctx.moveTo(-r * 0.86, -r * 0.1);
    ctx.bezierCurveTo(-r * 0.86, -r * 0.62, -r * 0.5, -r * 0.84, -r * 0.2, -r * 0.74);
    ctx.quadraticCurveTo(0, -r * 0.84, r * 0.2, -r * 0.74);
    ctx.bezierCurveTo(r * 0.5, -r * 0.84, r * 0.86, -r * 0.62, r * 0.86, -r * 0.1);
    ctx.bezierCurveTo(r * 0.9, r * 0.6, r * 0.5, r * 1.04, 0, r * 1.04);
    ctx.bezierCurveTo(-r * 0.5, r * 1.04, -r * 0.9, r * 0.6, -r * 0.86, -r * 0.1); ctx.closePath();
  };
  lit(ctx, hm, hair, r * 1.6, { shade: 0.25, rim: darken(hair, 0.4) });
  ctx.save(); hm(); ctx.clip(); ctx.lineCap = 'round';
  const wx = r * 0.12, wy = r * 0.3, rnd = lcg(77);
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * TAU + rnd() * 0.2, l = r * (0.7 + rnd() * 0.5);
    ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + Math.cos(a + 0.5) * l * 0.5, wy + Math.sin(a + 0.5) * l * 0.5, wx + Math.cos(a) * l, wy + Math.sin(a) * l);
    ctx.strokeStyle = alpha(i % 3 ? darken(hair, 0.3) : lighten(hair, 0.35), 0.6); ctx.lineWidth = i % 3 ? 1.6 : 1.2; ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
  return { left: P(-r * 0.98, -r * 0.04), right: P(r * 0.98, -r * 0.04), nose: P(0, -r * 1.1), box: { x: x - r * 2.2, y: y - r * 1.2, w: r * 4.4, h: r * 2.2 } };
}

/**
 * drawDolphin(ctx, c, o) -> { melon, eye, tail, box }
 *   A dolphin swimming, side view: beak, rounded forehead (the melon), dark back and pale
 *   belly, dorsal fin, flipper, tail flukes; eye dot only, no mouth line.
 *   o: { x, y (body centre), s = 1 (about 200 px long), dir = 1 (swims right), swim = 0
 *        (0..1 tail phase; pass t * 1.2 % 1 to swim), tone (colour) }
 *   melon: the forehead point where its clicks leave (start SimWave arcs there).
 */
export function drawDolphin(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 260, s = o.s ?? 1, dir = o.dir === -1 ? -1 : 1, sw = Math.sin(TAU * (o.swim ?? 0));
  const back = o.tone ?? dolphinOf(c), belly = lighten(mix(back, c.labelMuted, 0.4), 0.5);
  const U = [0, 0.04, 0.08, 0.15, 0.3, 0.45, 0.65, 0.85, 1], T = [3, 5, 8, 22, 32, 31, 20, 9, 5], B = [3, 5, 7, 13, 25, 26, 16, 8, 5];
  const cxAt = (u) => 100 - 196 * u, bend = (u) => 15 * sw * Math.pow(u, 2.2);
  const top = [], bot = [];
  for (let i = 0; i <= 28; i++) { const u = i / 28; top.push({ x: cxAt(u), y: bend(u) - tabAt(U, T, u) }); bot.push({ x: cxAt(u), y: bend(u) + tabAt(U, B, u) }); }
  const body = () => { ctx.beginPath(); top.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y); ctx.closePath(); };
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  const E = { x: cxAt(1), y: bend(1) }, fa = -sw * 0.45 + 15 * Math.cos(TAU * (o.swim ?? 0)) * 0.012;
  // flukes and the far flipper behind the body
  ctx.save(); ctx.translate(E.x + 2, E.y); ctx.rotate(fa);
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(4, -3); ctx.quadraticCurveTo(-10, -10, -30, -22); ctx.quadraticCurveTo(-24, -6, -18, 0); ctx.quadraticCurveTo(-24, 6, -30, 22); ctx.quadraticCurveTo(-10, 10, 4, 3); ctx.closePath(); }, back, 30, { shade: 0.22 });
  ctx.restore();
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(cxAt(0.27), bend(0.27) + 12); ctx.quadraticCurveTo(cxAt(0.3) - 6, bend(0.3) + 30, cxAt(0.36) - 4, bend(0.36) + 30); ctx.quadraticCurveTo(cxAt(0.33), bend(0.33) + 18, cxAt(0.34), bend(0.34) + 12); ctx.closePath(); }, darken(back, 0.25), 20);
  // dorsal fin
  lit(ctx, () => { const a = cxAt(0.36), b = cxAt(0.54), ty = bend(0.45) - 23; ctx.beginPath(); ctx.moveTo(a, ty + 2); ctx.quadraticCurveTo(a - 12, ty - 22, b - 8, ty - 30); ctx.quadraticCurveTo(b - 4, ty - 14, b, ty + 6); ctx.closePath(); }, back, 30, { shade: 0.2 });
  lit(ctx, body, back, 80, { shade: 0.2 });
  // pale belly (countershading) and a soft line between
  ctx.save(); body(); ctx.clip();
  ctx.beginPath(); ctx.moveTo(cxAt(0) + 4, 1);
  for (let i = 0; i <= 28; i++) { const u = i / 28; ctx.lineTo(cxAt(u), bend(u) + tabAt(U, B, u) * 0.05 + (u > 0.12 && u < 0.7 ? 3 * Math.sin((u - 0.12) / 0.58 * Math.PI) : 0)); }
  ctx.lineTo(cxAt(1) - 10, 60); ctx.lineTo(cxAt(0) + 10, 60); ctx.closePath();
  ctx.fillStyle = belly; ctx.fill();
  ctx.strokeStyle = alpha(darken(back, 0.15), 0.5); ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = alpha(lighten(back, 0.45), 0.6); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); for (let i = 3; i <= 18; i++) { const u = i / 28, p = { x: cxAt(u), y: bend(u) - tabAt(U, T, u) + 5 }; i > 3 ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.stroke();
  ctx.restore();
  body(); ctx.strokeStyle = darken(back, 0.42); ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
  // near flipper, blowhole, eye dot
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(cxAt(0.24), bend(0.24) + 10); ctx.quadraticCurveTo(cxAt(0.27) - 4, bend(0.27) + 30, cxAt(0.33), bend(0.33) + 32); ctx.quadraticCurveTo(cxAt(0.31), bend(0.31) + 16, cxAt(0.32), bend(0.32) + 8); ctx.closePath(); }, back, 22, { shade: 0.2 });
  ctx.beginPath(); ctx.ellipse(cxAt(0.25), bend(0.25) - 23.5, 3.5, 1.5, 0, 0, TAU); ctx.fillStyle = darken(back, 0.5); ctx.fill();
  const ex = cxAt(0.155), ey = bend(0.155) - 2;
  ctx.beginPath(); ctx.arc(ex, ey, 2.8, 0, TAU); ctx.fillStyle = darken(back, 0.7); ctx.fill();
  ctx.beginPath(); ctx.arc(ex - 0.8, ey - 0.9, 0.9, 0, TAU); ctx.fillStyle = lighten(belly, 0.6); ctx.fill();
  ctx.restore();
  const Wp = (p) => ({ x: x + dir * s * p.x, y: y + s * p.y });
  return { melon: Wp({ x: cxAt(0.12) + 3, y: bend(0.12) - 9 }), eye: Wp({ x: ex, y: ey }), tail: Wp({ x: E.x - 24, y: E.y }), box: { x: x - 130 * s, y: y - 60 * s, w: 240 * s, h: 100 * s } };
}

/**
 * drawFish(ctx, c, o) -> { points, head, box }
 *   A plain fish, side view: scaled body, forked tail, fins, gill line, eye dot.
 *   o: { x, y, s = 1 (about 120 px long), dir = 1 (swims right), swim = 0 (0..1 tail
 *        phase), tone = 7 (series number or colour) }
 *   points: 6 points along the side line, head to tail (vibration marks go there; the
 *   caller draws them with o.vib).
 */
export function drawFish(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 260, s = o.s ?? 1, dir = o.dir === -1 ? -1 : 1, sw = Math.sin(TAU * (o.swim ?? 0));
  const base = typeof o.tone === 'string' ? o.tone : c['s' + (o.tone ?? 7)] ?? c.s7, col = mix(base, c.labelMuted, 0.3);
  const U = [0, 0.08, 0.25, 0.45, 0.75, 1], T = [3, 13, 22, 22, 9, 5], B = [3, 11, 18, 17, 7, 5];
  const cxAt = (u) => 56 - 100 * u, bend = (u) => 6 * sw * u * u;
  const top = [], bot = [];
  for (let i = 0; i <= 20; i++) { const u = i / 20; top.push({ x: cxAt(u), y: bend(u) - tabAt(U, T, u) }); bot.push({ x: cxAt(u), y: bend(u) + tabAt(U, B, u) }); }
  const body = () => { ctx.beginPath(); ctx.moveTo(60, bend(0)); top.forEach((p) => ctx.lineTo(p.x, p.y)); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y); ctx.closePath(); };
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  const E = { x: cxAt(1), y: bend(1) };
  ctx.save(); ctx.translate(E.x + 2, E.y); ctx.rotate(-sw * 0.35);
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(2, -4); ctx.lineTo(-22, -20); ctx.quadraticCurveTo(-14, 0, -22, 20); ctx.lineTo(2, 4); ctx.closePath(); }, darken(col, 0.08), 24);
  ctx.strokeStyle = alpha(darken(col, 0.35), 0.6); ctx.lineWidth = 1;
  for (const k of [-12, -5, 5, 12]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-17, k * 1.2); ctx.stroke(); }
  ctx.restore();
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(cxAt(0.25), bend(0.25) - 20); ctx.quadraticCurveTo(cxAt(0.4), bend(0.4) - 38, cxAt(0.62), bend(0.62) - 14); ctx.closePath(); }, darken(col, 0.12), 20);
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(cxAt(0.5), bend(0.5) + 15); ctx.quadraticCurveTo(cxAt(0.58), bend(0.58) + 28, cxAt(0.68), bend(0.68) + 10); ctx.closePath(); }, darken(col, 0.12), 16);
  lit(ctx, body, col, 50, { shade: 0.2 });
  ctx.save(); body(); ctx.clip();
  ctx.fillStyle = alpha(lighten(col, 0.55), 0.6); ctx.fillRect(-60, 6, 130, 30);
  ctx.strokeStyle = alpha(darken(col, 0.28), 0.5); ctx.lineWidth = 1.1;
  for (let i = 0; i < 9; i++) for (let j = -2; j <= 2; j++) { const px = 22 - i * 8 + (j & 1) * 4, py = bend(0.4) + j * 7; ctx.beginPath(); ctx.arc(px, py, 4.5, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = alpha(darken(col, 0.4), 0.8); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(34, -15); ctx.quadraticCurveTo(28, 0, 34, 13); ctx.stroke();
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(30, 4); ctx.quadraticCurveTo(22, 10, 18, 16); ctx.quadraticCurveTo(26, 13, 31, 9); ctx.closePath(); }, darken(col, 0.1), 12, { rimW: 1.4 });
  ctx.beginPath(); ctx.arc(44, -4, 4.2, 0, TAU); ctx.fillStyle = lighten(col, 0.7); ctx.fill();
  ctx.beginPath(); ctx.arc(45, -4, 2.4, 0, TAU); ctx.fillStyle = darken(col, 0.75); ctx.fill();
  ctx.restore();
  const Wp = (p) => ({ x: x + dir * s * p.x, y: y + s * p.y });
  return { points: [0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((u) => Wp({ x: cxAt(u), y: bend(u) - 1 })), head: Wp({ x: 50, y: -2 }), box: { x: x - 72 * s, y: y - 40 * s, w: 136 * s, h: 72 * s } };
}

/**
 * drawSnake(ctx, c, o) -> { points, head, box }
 *   A snake lying on the ground in an S curve, seen from the side and a little above:
 *   tapering body with back patches and belly scales, head with an eye dot (no tongue).
 *   o: { x, y (ground line under the middle), len = 260, dir = 1 (head to the right), wave
 *        = 0 (phase of the S, radians), tone (colour; default an earth green) }
 *   points: 8 points along the body, tail to neck (vibration marks go there).
 */
export function drawSnake(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 420, len = o.len ?? 260, dir = o.dir === -1 ? -1 : 1, wv = o.wave ?? 0;
  const col = o.tone ?? darken(mix(c.s3, c.s8, 0.42), 0.18), k = len / 260;
  const P = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40, env = 0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, u * 1.1)); P.push({ x: -len / 2 + len * u * 0.94, y: -12 * k - Math.sin(u * 2.4 * Math.PI + wv) * 22 * k * env * (u < 0.92 ? 1 : 0.6) }); }
  const wd = (u) => tabAt([0, 0.15, 0.55, 0.88, 0.95, 1], [2, 9, 17, 11, 15, 9], u) * k;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  drawShadow(ctx, c, 0, 2, len * 0.5, 7 * k);
  rod(ctx, P, wd, col);
  // belly edge and back patches
  ctx.save(); bandOf(ctx, P, wd)(); ctx.clip();
  polyline(ctx, P, 0, 6 * k); ctx.strokeStyle = alpha(lighten(mix(col, c.gold, 0.35), 0.45), 0.7); ctx.lineWidth = 4 * k; ctx.stroke();
  for (let i = 3; i < 36; i += 3) {
    const p = P[i], q = P[i + 1], a = Math.atan2(q.y - p.y, q.x - p.x), r = wd(i / 40) * 0.38;
    ctx.save(); ctx.translate(p.x, p.y - r * 0.4); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(-r * 1.3, 0); ctx.lineTo(0, -r); ctx.lineTo(r * 1.3, 0); ctx.lineTo(0, r); ctx.closePath();
    ctx.fillStyle = alpha(darken(col, 0.42), 0.8); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  const h = P[40], n = P[37], ha = Math.atan2(h.y - n.y, h.x - n.x);
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(ha);
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(-8 * k, -8 * k); ctx.quadraticCurveTo(10 * k, -11 * k, 17 * k, -2 * k); ctx.quadraticCurveTo(14 * k, 6 * k, -8 * k, 8 * k); ctx.closePath(); }, col, 22 * k);
  ctx.beginPath(); ctx.arc(7 * k, -3.5 * k, 2.4 * k, 0, TAU); ctx.fillStyle = darken(col, 0.75); ctx.fill();
  ctx.beginPath(); ctx.arc(6.4 * k, -4.2 * k, 0.8 * k, 0, TAU); ctx.fillStyle = lighten(col, 0.7); ctx.fill();
  ctx.restore();
  ctx.restore();
  const Wp = (p) => ({ x: x + dir * p.x, y: y + p.y });
  return { points: [3, 8, 13, 18, 23, 28, 32, 36].map((i) => Wp(P[i])), head: Wp(P[40]), box: { x: x - len / 2 - 10, y: y - 54 * k, w: len + 30 * k, h: 60 * k } };
}

const hullTopOf = (c) => lighten(mix(c.ice, c.labelMuted, 0.4), 0.5);
const hullLowOf = (c) => darken(mix(c.s6, c.s8, 0.35), 0.28);
const subOf = (c) => darken(mix(c.labelMuted, c.s1, 0.18), 0.38);
const paperOf = (c) => lighten(mix(c.gold, c.labelMuted, 0.42), 0.62);
const caseOf = (c) => darken(mix(c.labelMuted, c.s5, 0.25), 0.4);
const screenOf = (c) => darken(mix(c.s5, c.s1, 0.5), 0.8);
const beigeOf = (c) => lighten(mix(c.gold, c.labelMuted, 0.5), 0.32);
const toneOf = (c, t, d) => (typeof t === 'string' ? t : c['s' + (t ?? d)] ?? c.s1);

/**
 * drawSeaCut(ctx, c, o) -> { water: {x, y, w, h}, surfaceY, seabedY(x) }
 *   A sea in cross-section: the surface line, the water getting darker with depth in tone
 *   steps, faint light shafts, and a sandy sea bed with rocks. Draw it first, then ships,
 *   animals and sonar on top.
 *   o: { x = 0, w = 680, y = 170 (the surface), bottom = 520, bed (u) -> 0..1 (the depth of
 *        the bed as a fraction of y..bottom at u across; default a gentle uneven bed about
 *        0.75), rocks = true, t = 0 (surface ripple phase) }
 *   seabedY(x): the bed height at canvas x (for echo paths and depth readings).
 */
export function drawSeaCut(ctx, c, o = {}) {
  const x0 = o.x ?? 0, w = o.w ?? 680, sy = o.y ?? 170, y1 = o.bottom ?? 520, t = o.t ?? 0, H = y1 - sy;
  const bed = o.bed ?? ((u) => 0.74 + 0.08 * Math.sin(u * 5.2 + 0.6) + 0.05 * Math.sin(u * 13 + 2.1));
  const seabedY = (px) => sy + H * c01(bed(c01((px - x0) / w)));
  const top = c.setWaterTop ?? c.water, deep = c.setWaterDeep ?? darken(c.water, 0.6);
  ctx.save();
  for (let i = 0; i < 6; i++) { ctx.fillStyle = mix(lighten(top, 0.08), deep, i / 5); ctx.fillRect(x0, sy + H * i / 6, w, H / 6 + 1); }
  ctx.save(); ctx.beginPath(); ctx.rect(x0, sy, w, H); ctx.clip();
  const g = ctx.createLinearGradient(0, sy, 0, sy + H * 0.7);
  g.addColorStop(0, alpha(lighten(top, 0.6), 0.22)); g.addColorStop(1, alpha(lighten(top, 0.6), 0));
  ctx.fillStyle = g;
  for (const [u, wd] of [[0.18, 40], [0.42, 26], [0.7, 50], [0.9, 22]]) { const px = x0 + w * u; ctx.beginPath(); ctx.moveTo(px, sy); ctx.lineTo(px + wd, sy); ctx.lineTo(px + wd * 2.4, sy + H * 0.7); ctx.lineTo(px + wd * 1.2, sy + H * 0.7); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // the surface
  const wav = (px) => sy + 2.2 * Math.sin(px * 0.045 + t * 2) + 1.2 * Math.sin(px * 0.11 - t * 3);
  ctx.beginPath(); for (let px = x0; px <= x0 + w; px += 6) (px === x0 ? ctx.moveTo(px, wav(px)) : ctx.lineTo(px, wav(px)));
  ctx.strokeStyle = alpha(lighten(top, 0.75), 0.95); ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); for (let px = x0; px <= x0 + w; px += 6) (px === x0 ? ctx.moveTo(px, wav(px) + 5) : ctx.lineTo(px, wav(px) + 5));
  ctx.strokeStyle = alpha(darken(top, 0.25), 0.5); ctx.lineWidth = 2; ctx.stroke();
  // the sea bed: sand with ripples, and rocks
  const sand = c.setSand ?? mix(c.gold, c.labelMuted, 0.5);
  const bedP = () => { ctx.beginPath(); ctx.moveTo(x0, y1 + 2); for (let px = x0; px <= x0 + w; px += 8) ctx.lineTo(px, seabedY(px)); ctx.lineTo(x0 + w, seabedY(x0 + w)); ctx.lineTo(x0 + w, y1 + 2); ctx.closePath(); };
  bedP(); ctx.fillStyle = sand; ctx.fill();
  ctx.save(); bedP(); ctx.clip();
  ctx.fillStyle = alpha(darken(sand, 0.3), 0.5); ctx.fillRect(x0, sy + H * 0.9, w, H);
  ctx.strokeStyle = alpha(lighten(sand, 0.4), 0.8); ctx.lineWidth = 3; ctx.beginPath(); for (let px = x0; px <= x0 + w; px += 8) (px === x0 ? ctx.moveTo(px, seabedY(px) + 2) : ctx.lineTo(px, seabedY(px) + 2)); ctx.stroke();
  const rnd = lcg(431);
  ctx.strokeStyle = alpha(darken(sand, 0.22), 0.55); ctx.lineWidth = 1.5;
  for (let i = 0; i < 26; i++) { const px = x0 + rnd() * w, py = seabedY(px) + 8 + rnd() * 30; ctx.beginPath(); ctx.moveTo(px - 9, py); ctx.quadraticCurveTo(px, py - 4, px + 9, py); ctx.stroke(); }
  ctx.restore();
  bedP(); ctx.strokeStyle = darken(sand, 0.38); ctx.lineWidth = 2; ctx.stroke();
  if (o.rocks !== false) {
    const rr2 = lcg(97), rock = mix(sand, c.labelMuted, 0.35);
    for (let i = 0; i < 7; i++) {
      const px = x0 + w * (0.06 + i * 0.14 + rr2() * 0.05), py = seabedY(px) + 4, R = 10 + rr2() * 14, n = 13, ph = rr2() * 6;
      const pts = Array.from({ length: n }, (_, j) => { const a = Math.PI + (j / (n - 1)) * Math.PI; const k = 0.85 + 0.15 * Math.sin(j * 2.3 + ph); return { x: px + Math.cos(a) * R * 1.3 * k, y: py + Math.sin(a) * R * 0.95 * k }; });
      lit(ctx, () => shape(ctx, pts), darken(rock, rr2() * 0.2), R * 2, { shade: 0.24 });
    }
  }
  ctx.restore();
  return { water: { x: x0, y: sy, w, h: H }, surfaceY: sy, seabedY };
}

/**
 * drawShip(ctx, c, o) -> { transducer, deck, bow, stern, box }
 *   A generic survey ship on the sea surface, side view: hull (pale topsides, dark red
 *   bottom below the waterline, portholes), bridge with windows, funnel, mast with a radar
 *   dish, a lifting frame at the stern. No flags, names or markings.
 *   o: { x (middle), y (the waterline), len = 260, dir = 1 (bow to the right), sonar = false
 *        (true: a sonar bulb under the hull; transducer is its bottom), submerged = true
 *        (tints the hull below the waterline as seen through water) }
 */
export function drawShip(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 170, L = o.len ?? 260, k = L / 260, dir = o.dir === -1 ? -1 : 1;
  const top = hullTopOf(c), low = hullLowOf(c), dark = darken(mix(c.labelMuted, c.bgDeep, 0.3), 0.4);
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * k, k);
  const hull = () => { ctx.beginPath(); ctx.moveTo(-130, -30); ctx.lineTo(132, -34); ctx.quadraticCurveTo(116, 4, 96, 24); ctx.lineTo(-112, 24); ctx.quadraticCurveTo(-126, 8, -130, -30); ctx.closePath(); };
  // stern lifting frame (behind), funnel, superstructure, mast
  rod(ctx, [{ x: -112, y: -30 }, { x: -124, y: -86 }], 6, steelOf(c));
  rod(ctx, [{ x: -96, y: -30 }, { x: -110, y: -86 }], 6, steelOf(c));
  rod(ctx, [{ x: -128, y: -86 }, { x: -106, y: -86 }], 7, steelOf(c));
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(-44, -60); ctx.lineTo(-40, -96); ctx.lineTo(-18, -96); ctx.lineTo(-20, -60); ctx.closePath(); }, mix(top, c.labelMuted, 0.3), 30);
  rr(ctx, -42, -98, 26, 7, 2); ctx.fillStyle = dark; ctx.fill();
  rod(ctx, [{ x: 34, y: -92 }, { x: 34, y: -146 }], 4.5, steelOf(c));
  rod(ctx, [{ x: 20, y: -128 }, { x: 48, y: -128 }], 3.5, steelOf(c));
  lit(ctx, () => rr(ctx, 22, -142, 24, 7, 3), lighten(steelOf(c), 0.2), 16, { rimW: 1.6 });
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(-60, -32); ctx.lineTo(-60, -62); ctx.lineTo(70, -62); ctx.lineTo(82, -32); ctx.closePath(); }, top, 60, { shade: 0.16 });
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(-6, -62); ctx.lineTo(-6, -92); ctx.lineTo(58, -92); ctx.lineTo(68, -62); ctx.closePath(); }, top, 40, { shade: 0.16 });
  ctx.fillStyle = darken(c.glass, 0.55);
  for (let i = 0; i < 6; i++) { rr(ctx, 2 + i * 9.5, -86, 7, 9, 1.5); ctx.fill(); }
  for (let i = 0; i < 9; i++) { rr(ctx, -50 + i * 13, -54, 8, 8, 1.5); ctx.fill(); }
  ctx.strokeStyle = alpha(lighten(c.glass, 0.6), 0.7); ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(3 + i * 9.5, -78); ctx.lineTo(7 + i * 9.5, -85); ctx.stroke(); }
  if (o.sonar) lit(ctx, () => { ctx.beginPath(); ctx.ellipse(22, 26, 16, 12, 0, 0, Math.PI); ctx.closePath(); }, darken(steelOf(c), 0.25), 24, { shade: 0.25 });
  lit(ctx, hull, top, 120, { shade: 0.14 });
  ctx.save(); hull(); ctx.clip();
  ctx.fillStyle = low; ctx.fillRect(-140, 0, 290, 40);
  ctx.fillStyle = alpha(darken(low, 0.3), 0.6); ctx.fillRect(-140, 14, 290, 20);
  ctx.fillStyle = dark; ctx.fillRect(-140, -2, 290, 4);
  ctx.strokeStyle = alpha(darken(top, 0.25), 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-130, -22); ctx.lineTo(132, -26); ctx.stroke();
  for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(-100 + i * 17, -12, 2.6, 0, TAU); ctx.fillStyle = darken(c.glass, 0.5); ctx.fill(); ctx.strokeStyle = darken(top, 0.35); ctx.lineWidth = 1; ctx.stroke(); }
  ctx.fillStyle = alpha(darken(top, 0.3), 0.35); ctx.fillRect(40, -40, 100, 80);
  if (o.submerged !== false) { ctx.fillStyle = alpha(c.setWaterTop ?? c.water, 0.3); ctx.fillRect(-140, 1, 290, 40); }
  ctx.restore();
  hull(); ctx.strokeStyle = darken(top, 0.5); ctx.lineWidth = 2.2; ctx.stroke();
  rod(ctx, [{ x: -128, y: -34 }, { x: 130, y: -38 }], 3, steelOf(c));
  ctx.restore();
  const Wp = (lx, ly) => ({ x: x + dir * k * lx, y: y + k * ly });
  return { transducer: Wp(22, o.sonar ? 38 : 24), deck: Wp(0, -32), bow: Wp(132, -34), stern: Wp(-130, -30), box: { x: x - 135 * k, y: y - 150 * k, w: 270 * k, h: 190 * k } };
}

/**
 * drawSubmarine(ctx, c, o) -> { nose, sail, tail, box }
 *   A generic submarine, side view: long rounded hull with plate seams and a row of
 *   flood holes, the tower (sail) with small planes, stern fins and a propeller. No markings.
 *   o: { x, y (hull centre), len = 260, dir = 1 (nose to the right), spin = 0 (propeller
 *        phase), tone (colour) }
 *   nose: where its sonar pulses leave.
 */
export function drawSubmarine(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 320, L = o.len ?? 260, k = L / 260, dir = o.dir === -1 ? -1 : 1, col = o.tone ?? subOf(c);
  const U = [0, 0.03, 0.1, 0.25, 0.6, 0.82, 0.96, 1], T = [3, 13, 21, 24, 24, 18, 8, 5];
  const cxAt = (u) => 130 - 248 * u, top = [], bot = [];
  for (let i = 0; i <= 30; i++) { const u = i / 30, h = tabAt(U, T, u); top.push({ x: cxAt(u), y: -h }); bot.push({ x: cxAt(u), y: h }); }
  const body = () => { ctx.beginPath(); ctx.moveTo(133, 0); top.forEach((p) => ctx.lineTo(p.x, p.y)); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y); ctx.closePath(); };
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * k, k);
  // stern fins and propeller
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(-90, -10); ctx.lineTo(-112, -34); ctx.lineTo(-122, -34); ctx.lineTo(-114, -4); ctx.closePath(); }, darken(col, 0.1), 24);
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(-90, 10); ctx.lineTo(-112, 34); ctx.lineTo(-122, 34); ctx.lineTo(-114, 4); ctx.closePath(); }, darken(col, 0.18), 24);
  const sp = o.spin ?? 0;
  for (let i = 0; i < 3; i++) { const a = TAU * (sp + i / 3), h = Math.cos(a) * 16; lit(ctx, () => { ctx.beginPath(); ctx.ellipse(-126, h / 2, 3.5, Math.abs(h / 2) + 2, 0, 0, TAU); }, steelOf(c), 10, { rimW: 1.4 }); }
  ball(ctx, -123, 0, 4.5, darken(steelOf(c), 0.2));
  lit(ctx, body, col, 90, { shade: 0.2 });
  ctx.save(); body(); ctx.clip();
  ctx.strokeStyle = alpha(lighten(col, 0.5), 0.55); ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(110, -12); ctx.quadraticCurveTo(0, -22, -90, -12); ctx.stroke();
  ctx.strokeStyle = alpha(darken(col, 0.35), 0.5); ctx.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) { const px = 96 - i * 30; ctx.beginPath(); ctx.moveTo(px, -26); ctx.quadraticCurveTo(px - 4, 0, px, 26); ctx.stroke(); }
  ctx.fillStyle = alpha(darken(col, 0.5), 0.85);
  for (let i = 0; i < 16; i++) { rr(ctx, 80 - i * 10, 12, 6, 2.5, 1); ctx.fill(); }
  ctx.restore();
  // the sail with its small planes
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(18, -22); ctx.lineTo(24, -56); ctx.quadraticCurveTo(44, -60, 60, -54); ctx.lineTo(70, -22); ctx.closePath(); }, col, 40, { shade: 0.2 });
  lit(ctx, () => rr(ctx, 46, -46, 30, 5, 2.5), darken(col, 0.12), 14, { rimW: 1.4 });
  rod(ctx, [{ x: 40, y: -58 }, { x: 40, y: -70 }], 3, steelOf(c));
  ctx.restore();
  const Wp = (lx, ly) => ({ x: x + dir * k * lx, y: y + k * ly });
  return { nose: Wp(133, 0), sail: Wp(44, -58), tail: Wp(-126, 0), box: { x: x - 132 * k, y: y - 72 * k, w: 268 * k, h: 108 * k } };
}

/**
 * drawPhone(ctx, c, o) -> { screen: {x, y, w, h}, speaker, mouth, box }
 *   A smartphone held upright, its screen showing a frequency spectrum: a low noise floor
 *   with peaks at caller positions (one peak for a pure tone, many for a voice or a note).
 *   o: { x, y (centre), h = 210 (w = 0.5 h; >= 160 at 390), peaks = [] ([{ u (0..1
 *        across the screen, low to high frequency), h (0..1 height) }]), lit = false
 *        (screen glow), cone = false (true: a rolled paper cone lies on its side, its narrow
 *        end at the phone; the phone's speaker end stands down in a slot in its top, cone
 *        body behind, near wall and slot lip in front; mouth is the cone's open end), dir = 1
 *        (the cone opens to the right) }
 */
export function drawPhone(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 260, h = o.h ?? 210, w = h * 0.5, dir = o.dir === -1 ? -1 : 1;
  const body = caseOf(c), scr = screenOf(c), trace = lighten(c.s7, 0.2);
  const sx = x - w / 2 + w * 0.08, sy = y - h / 2 + h * 0.08, sw = w * 0.84, sh = h * 0.8;
  ctx.save();
  if (o.lit) glow(ctx, x, y - h * 0.1, h * 0.7, c.s7, 0.5);
  // cone: a rolled paper cone lying on its side, its narrow end at the phone; the phone's
  // speaker end stands down in a slot cut in the cone's top: cone body and the slot's back
  // lip behind the phone, the cone's near wall and the slot's front lip in front of it
  const pap = paperOf(c), ay = y + h * 0.4, xN = x - dir * w * 0.55, rN = h * 0.15, xW = xN + dir * h * 1.3, rW = h * 0.36;
  const ty = ay - rN - (rW - rN) * (w * 0.55) / (h * 1.3), slw = w * 0.64;
  const coneP = () => { ctx.beginPath(); ctx.moveTo(xN, ay - rN); ctx.lineTo(xW, ay - rW); ctx.lineTo(xW, ay + rW); ctx.lineTo(xN, ay + rN); ctx.closePath(); };
  const paper = () => {
    lit(ctx, coneP, pap, h, { shade: 0.16 });
    ctx.save(); coneP(); ctx.clip();
    ctx.strokeStyle = alpha(darken(pap, 0.28), 0.7); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xN + dir * h * 0.3, ay + rN * 1.4); ctx.quadraticCurveTo(xN + dir * h * 0.8, ay - h * 0.05, xW - dir * h * 0.1, ay - rW * 0.95); ctx.stroke();
    ctx.fillStyle = alpha(darken(pap, 0.2), 0.4); ctx.fillRect(Math.min(xN, xW), ay + rN * 0.2, Math.abs(xW - xN), rW);
    ctx.restore();
    ellipse(ctx, xN, ay, rN * 0.3, rN); ctx.fillStyle = darken(pap, 0.45); ctx.fill(); ctx.strokeStyle = lighten(pap, 0.15); ctx.lineWidth = 2.2; ctx.stroke();
    rr(ctx, Math.min(xN, xN + dir * 22), ay - rN - 2, 22, 2 * rN + 4, 3); ctx.fillStyle = alpha(lighten(c.s2, 0.35), 0.7); ctx.fill();
  };
  if (o.cone) {
    paper();
    lit(ctx, () => { ctx.beginPath(); ctx.ellipse(xW, ay, rW * 0.3, rW, 0, 0, TAU); }, darken(pap, 0.4), rW, { shade: 0.25, rim: darken(pap, 0.25) });
    ctx.beginPath(); ctx.ellipse(xW, ay, rW * 0.3, rW, 0, 0, TAU); ctx.strokeStyle = lighten(pap, 0.2); ctx.lineWidth = 3; ctx.stroke();
    ellipse(ctx, x, ty + 1, slw, 6); ctx.fillStyle = darken(pap, 0.62); ctx.fill();
  }
  lit(ctx, () => rr(ctx, x - w / 2, y - h / 2, w, h, w * 0.16), body, h * 0.5, { shade: 0.22, rim: darken(body, 0.5) });
  rr(ctx, x + w / 2 - 1, y - h * 0.26, 3.5, h * 0.14, 1.5); ctx.fillStyle = darken(body, 0.3); ctx.fill();
  rr(ctx, sx, sy, sw, sh, w * 0.07); ctx.fillStyle = scr; ctx.fill();
  ctx.save(); rr(ctx, sx, sy, sw, sh, w * 0.07); ctx.clip();
  // spectrum plot: grid, axis, noise floor and the peaks
  const px0 = sx + sw * 0.08, px1 = sx + sw * 0.94, base = sy + sh * 0.78, ph = sh * 0.6;
  ctx.strokeStyle = alpha(lighten(scr, 0.35), 0.5); ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) { const yy = base - ph * i / 4; ctx.beginPath(); ctx.moveTo(px0, yy); ctx.lineTo(px1, yy); ctx.stroke(); }
  for (let i = 1; i <= 4; i++) { const xx = px0 + (px1 - px0) * i / 5; ctx.beginPath(); ctx.moveTo(xx, base); ctx.lineTo(xx, base - ph); ctx.stroke(); }
  const peaks = o.peaks ?? [], rnd = lcg(5150), noise = Array.from({ length: 61 }, () => 0.03 + rnd() * 0.04);
  const valAt = (u, i) => { let v = noise[i]; for (const p of peaks) { const d = (u - p.u) / 0.022; v = Math.max(v, c01(p.h) * Math.exp(-d * d)); } return v; };
  ctx.beginPath(); ctx.moveTo(px0, base);
  for (let i = 0; i <= 60; i++) { const u = i / 60; ctx.lineTo(px0 + (px1 - px0) * u, base - ph * valAt(u, i)); }
  ctx.lineTo(px1, base); ctx.closePath(); ctx.fillStyle = alpha(trace, 0.35); ctx.fill();
  ctx.beginPath(); for (let i = 0; i <= 60; i++) { const u = i / 60, yy = base - ph * valAt(u, i); i ? ctx.lineTo(px0 + (px1 - px0) * u, yy) : ctx.moveTo(px0, yy); }
  ctx.strokeStyle = trace; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = alpha(lighten(scr, 0.6), 0.9); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px0, base - ph - 4); ctx.lineTo(px0, base); ctx.lineTo(px1, base); ctx.stroke();
  // a play button and a slider under the plot
  ctx.fillStyle = alpha(lighten(scr, 0.55), 0.9);
  ctx.beginPath(); ctx.arc(sx + sw * 0.18, sy + sh * 0.9, sw * 0.07, 0, TAU); ctx.fill();
  ctx.fillStyle = scr; ctx.beginPath(); ctx.moveTo(sx + sw * 0.16, sy + sh * 0.87); ctx.lineTo(sx + sw * 0.22, sy + sh * 0.9); ctx.lineTo(sx + sw * 0.16, sy + sh * 0.93); ctx.closePath(); ctx.fill();
  rr(ctx, sx + sw * 0.32, sy + sh * 0.895, sw * 0.58, 4, 2); ctx.fillStyle = alpha(lighten(scr, 0.4), 0.7); ctx.fill();
  ctx.fillStyle = alpha(lighten(scr, 0.25), 0.25); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw * 0.5, sy); ctx.lineTo(sx, sy + sh * 0.4); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y - h / 2 + h * 0.04, 2.6, 0, TAU); ctx.fillStyle = darken(body, 0.55); ctx.fill();
  ctx.fillStyle = darken(body, 0.55); for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(x + i * 5, y + h / 2 - h * 0.05, 1.5, 0, TAU); ctx.fill(); }
  let mouth = { x, y: y + h / 2 };
  if (o.cone) {
    // the near wall in front of the phone's lower end, then the slot's front lip
    ctx.save(); ctx.beginPath(); ctx.rect(x - slw - 4, ty + 1, 2 * slw + 8, h); ctx.clip(); paper(); ctx.restore();
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(x, ty + 1, slw, 6, 0, 0.08, Math.PI - 0.08); ctx.strokeStyle = darken(pap, 0.4); ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = lighten(pap, 0.3); ctx.lineWidth = 2; ctx.stroke();
    mouth = { x: xW, y: ay, r: rW };
  }
  ctx.restore();
  const bx = o.cone ? Math.min(x - w / 2, xN - rN * 0.3, xW - rW * 0.3) : x - w / 2;
  const bw = o.cone ? Math.max(x + w / 2, xN + rN * 0.3, xW + rW * 0.3) - bx : w;
  return { screen: { x: sx, y: sy, w: sw, h: sh }, speaker: { x, y: y + h / 2 }, mouth, box: { x: bx, y: y - h / 2, w: bw, h: o.cone ? h * 1.26 : h } };
}

/**
 * drawHearingAid(ctx, c, o) -> { mic, amp, speaker, anchors, tip, box }
 *   A behind-the-ear hearing aid drawn large, its case opened to show three parts in a row:
 *   the microphone (under two ports on top), the amplifier chip on its board, the speaker
 *   (receiver) feeding the clear ear hook, tube and soft ear tip.
 *   o: { x, y (case centre), w = 360 (>= 300 at 390), lit = null | 0 | 1 | 2 (mic, amp,
 *        speaker highlighted), pulse = null (0..1 a signal dot mic -> amp -> speaker ->
 *        ear tip), labels = null (three strings at 26 px: mic and speaker under the case, amplifier above it), size = 26 }
 *   o.worn = true: the small worn form for a side-view head instead: x, y the ear canal
 *   (drawEar's canal), h = 60 (ear height), facing = 1, glow = 0 (0..1); case upright
 *   behind the ear, hook over the top, tube into the canal; returns { ear, tip, mic, amp,
 *   speaker, anchors, box }.
 */
// o.worn: the small worn form for a head in side view (see drawHearingAid).
function hearingAidWorn(ctx, c, o) {
  const x = o.x ?? 340, y = o.y ?? 260, h = o.h ?? 60, f = o.facing === -1 ? -1 : 1, gl = c01(o.glow ?? 0);
  const P = (dx, dy) => ({ x: x + f * dx * h, y: y + dy * h });
  const shell = beigeOf(c), clear = lighten(c.glass, 0.4);
  const T = P(-0.36, -0.6), M = P(-0.5, -0.24), B = P(-0.46, 0.12);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  glow(ctx, M.x, M.y, h * 0.6, c.warning, 0.8 * gl);
  // the case, upright behind the ear, curved to follow it
  rod(ctx, [B, M, T], (u) => h * (0.2 - 0.04 * Math.abs(u - 0.5)), shell);
  for (const d of [0.05, 0.13]) { const p = lerpP(T, M, d + 0.08); ctx.beginPath(); ctx.arc(p.x + f * h * 0.03, p.y, Math.max(1.2, h * 0.018), 0, TAU); ctx.fillStyle = darken(shell, 0.55); ctx.fill(); }
  // the clear hook over the top of the ear, then the thin tube forward-down into the canal
  const hook = [T, P(-0.3, -0.78), P(-0.1, -0.82), P(0.04, -0.66)];
  const tube = [hook[3], P(0.08, -0.42), P(0.05, -0.16), P(0.01, -0.02)];
  ctx.save(); ctx.globalAlpha *= 0.85; rod(ctx, hook, h * 0.075, clear); ctx.restore();
  polyline(ctx, hook); ctx.strokeStyle = alpha(lighten(c.glass, 0.8), 0.8); ctx.lineWidth = Math.max(1, h * 0.02); ctx.stroke();
  polyline(ctx, tube); ctx.strokeStyle = darken(clear, 0.35); ctx.lineWidth = Math.max(2.4, h * 0.045); ctx.stroke();
  ctx.strokeStyle = clear; ctx.lineWidth = Math.max(1.2, h * 0.025); ctx.stroke();
  ball(ctx, x, y, Math.max(3, h * 0.07), lighten(mix(c.glass, shell, 0.5), 0.3));
  if (gl > 0.01) { polyline(ctx, [B, M, T]); ctx.strokeStyle = alpha(c.warning, gl); ctx.lineWidth = 2.5; ctx.stroke(); }
  ctx.restore();
  const A = [lerpP(T, M, 0.15), M, T];
  return { ear: { x, y }, tip: { x, y }, mic: A[0], amp: A[1], speaker: A[2], anchors: A, box: { x: Math.min(P(-0.62, 0).x, P(0.14, 0).x), y: y - h * 0.9, w: h * 0.76, h: h * 1.12 } };
}

export function drawHearingAid(ctx, c, o = {}) {
  if (o.worn) return hearingAidWorn(ctx, c, o);
  const x = o.x ?? 340, y = o.y ?? 260, w = o.w ?? 360, k = w / 360, on = o.lit ?? null, warm = c.warning;
  const shell = beigeOf(c), inside = darken(mix(shell, c.s5, 0.3), 0.55), board = darken(mix(c.s3, c.labelMuted, 0.3), 0.35);
  const P = (lx, ly) => ({ x: x + lx * k, y: y + ly * k });
  const parts = [{ x: -96, y: 0 }, { x: -6, y: 4 }, { x: 74, y: 0 }];
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  // ear hook, tube and ear tip (behind the case's right end)
  const tube = Array.from({ length: 13 }, (_, i) => { const u = i / 12, v = 1 - u; return { x: v * v * v * 118 + 3 * v * v * u * 136 + 3 * v * u * u * 214 + u * u * u * 214, y: v * v * v * -26 + 3 * v * v * u * -104 + 3 * v * u * u * -96 + u * u * u * 6 }; });
  ctx.save(); ctx.globalAlpha = 0.8; rod(ctx, tube, 8, lighten(c.glass, 0.4)); ctx.restore();
  polyline(ctx, tube); ctx.strokeStyle = alpha(lighten(c.glass, 0.8), 0.8); ctx.lineWidth = 2; ctx.stroke();
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(200, 4); ctx.quadraticCurveTo(214, -6, 228, 4); ctx.quadraticCurveTo(236, 30, 214, 44); ctx.quadraticCurveTo(192, 30, 200, 4); ctx.closePath(); }, lighten(mix(c.glass, shell, 0.5), 0.3), 40, { shade: 0.18 });
  // the case
  const cs = () => { ctx.beginPath(); ctx.moveTo(-160, 6); ctx.bezierCurveTo(-162, -40, -100, -62, -10, -58); ctx.bezierCurveTo(70, -56, 128, -50, 134, -18); ctx.bezierCurveTo(138, 20, 110, 46, 40, 48); ctx.bezierCurveTo(-40, 50, -100, 52, -140, 40); ctx.quadraticCurveTo(-160, 30, -160, 6); ctx.closePath(); };
  lit(ctx, cs, shell, 200, { shade: 0.16 });
  rr(ctx, -132, -34, 236, 66, 16); ctx.fillStyle = inside; ctx.fill();
  ctx.save(); rr(ctx, -132, -34, 236, 66, 16); ctx.clip();
  ctx.fillStyle = alpha(darken(inside, 0.3), 0.7); ctx.fillRect(-132, -34, 236, 10);
  lit(ctx, () => rr(ctx, -120, 14, 214, 14, 3), board, 30, { rimW: 1.4 });
  ctx.restore();
  rr(ctx, -132, -34, 236, 66, 16); ctx.strokeStyle = darken(shell, 0.45); ctx.lineWidth = 2.4; ctx.stroke();
  // wires mic -> amp -> speaker
  ctx.strokeStyle = darken(c.gold, 0.15); ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-80, 6); ctx.bezierCurveTo(-60, 22, -50, 20, -34, 10); ctx.moveTo(22, 10); ctx.bezierCurveTo(40, 22, 50, 20, 58, 8); ctx.stroke();
  for (const i of [0, 1, 2]) if (on === i) glow(ctx, parts[i].x, parts[i].y, 44, warm, 1);
  // microphone: a small can with a grille, under two ports in the case top
  const mc = on === 0 ? lighten(warm, 0.25) : steelOf(c);
  lit(ctx, () => rr(ctx, -116, -18, 40, 30, 8), mc, 30);
  ctx.fillStyle = darken(mc, 0.5); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(-106 + i * 10, -8 + j * 10, 2, 0, TAU); ctx.fill(); }
  for (const px of [-108, -86]) { ctx.beginPath(); ctx.ellipse(px, -55, 5, 2.4, 0, 0, TAU); ctx.fillStyle = darken(shell, 0.55); ctx.fill(); }
  // amplifier: a chip with legs on the board
  const ac = on === 1 ? lighten(warm, 0.1) : darken(mix(c.labelMuted, c.bgDeep, 0.5), 0.5);
  ctx.fillStyle = lighten(steelOf(c), 0.15); for (let i = 0; i < 5; i++) { ctx.fillRect(-28 + i * 11, -22, 3, 6); ctx.fillRect(-28 + i * 11, 22, 3, 6); }
  lit(ctx, () => rr(ctx, -36, -18, 60, 42, 5), ac, 40, { shade: 0.25 });
  ctx.beginPath(); ctx.arc(-28, -10, 3, 0, TAU); ctx.fillStyle = alpha(lighten(ac, 0.5), 0.8); ctx.fill();
  // speaker (receiver): a can with a sound outlet into the hook
  const sc = on === 2 ? lighten(warm, 0.25) : steelOf(c);
  rod(ctx, [{ x: 92, y: -6 }, { x: 118, y: -26 }], 7, darken(steelOf(c), 0.1));
  lit(ctx, () => rr(ctx, 54, -20, 40, 40, 9), sc, 34);
  ctx.beginPath(); ctx.arc(74, 0, 12, 0, TAU); ctx.fillStyle = darken(sc, 0.35); ctx.fill();
  ctx.beginPath(); ctx.arc(74, 0, 6, 0, TAU); ctx.fillStyle = lighten(sc, 0.25); ctx.fill(); ctx.strokeStyle = darken(sc, 0.5); ctx.lineWidth = 1.4; ctx.stroke();
  for (const i of [0, 1, 2]) if (on === i) { rr(ctx, parts[i].x - 46 + (i === 1 ? 4 : 6), -30, i === 1 ? 72 : 56, 62, 10); ctx.strokeStyle = warm; ctx.lineWidth = 3; ctx.stroke(); }
  // battery door line at the bottom left
  ctx.beginPath(); ctx.moveTo(-150, 30); ctx.quadraticCurveTo(-130, 46, -100, 46); ctx.strokeStyle = alpha(darken(shell, 0.35), 0.8); ctx.lineWidth = 1.6; ctx.stroke();
  const route = [{ x: -96, y: 0 }, { x: -34, y: 10 }, { x: -6, y: 4 }, { x: 58, y: 8 }, { x: 74, y: 0 }, { x: 118, y: -26 }, ...tube.slice(1), { x: 214, y: 36 }];
  if (o.pulse != null && o.pulse > 0 && o.pulse <= 1) signalDot(ctx, c, alongPath(route, o.pulse), 6);
  ctx.restore();
  const A = parts.map((p) => P(p.x, p.y));
  if (o.labels) o.labels.forEach((t, i) => label(ctx, c, t, A[i].x, i === 1 ? y - 84 * k : y + 82 * k, o.size ?? 26, { col: on === i ? c.label : undefined }));
  return { mic: A[0], amp: A[1], speaker: A[2], anchors: A, tip: P(214, 40), box: { x: x - 162 * k, y: y - (o.labels ? 100 : 96) * k, w: 400 * k, h: (o.labels ? 200 : 146) * k } };
}

/**
 * drawSiren(ctx, c, o) -> { top, box }   small icon (about 48 px at s 1)
 *   A warning siren lamp: a coloured dome on a dark base with a horn grille. o: { x, y
 *   (base bottom), s = 1, on = 0 (0..1 lamp glow), tone = 6 }
 * drawWhistle(ctx, c, o) -> { mouth, opening, box }   small icon (about 56 px wide)
 *   A plain sports whistle: barrel, mouthpiece, the slot on top, a ring. o: { x, y (barrel
 *   centre), s = 1, dir = 1 (mouthpiece to the right), tone (default steel) }
 * drawThermometer(ctx, c, o) -> { bulb, top, level, box }   small icon (about 64 px tall)
 *   A glass thermometer with a red column. o: { x, y (bulb centre), s = 1, level = 0.5
 *   (0..1), label = null (text 26 px to the right), size = 26 }
 */
export function drawSiren(ctx, c, o = {}) {
  const x = o.x ?? 100, y = o.y ?? 100, s = o.s ?? 1, on = c01(o.on ?? 0), col = toneOf(c, o.tone, 6), base = darken(mix(c.labelMuted, c.bgDeep, 0.4), 0.45);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  glow(ctx, 0, -28, 40, col, on);
  lit(ctx, () => rr(ctx, -24, -12, 48, 12, 3), base, 30, { shade: 0.25 });
  ctx.fillStyle = darken(base, 0.4); for (let i = -2; i <= 2; i++) { ctx.fillRect(i * 8 - 1.5, -9, 3, 6); }
  const dome = () => { ctx.beginPath(); ctx.moveTo(-17, -12); ctx.lineTo(-17, -30); ctx.bezierCurveTo(-17, -50, 17, -50, 17, -30); ctx.lineTo(17, -12); ctx.closePath(); };
  lit(ctx, dome, on > 0.3 ? lighten(col, 0.25 * on) : col, 30, { shade: 0.25 });
  ctx.save(); dome(); ctx.clip();
  ball(ctx, 0, -24, 7, lighten(mix(col, c.warning, 0.4), 0.3 + 0.4 * on));
  ctx.strokeStyle = alpha(darken(col, 0.35), 0.6); ctx.lineWidth = 1.5; for (const yy of [-20, -32]) { ctx.beginPath(); ctx.moveTo(-18, yy); ctx.lineTo(18, yy); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
  return { top: { x, y: y - 46 * s }, box: { x: x - 24 * s, y: y - 48 * s, w: 48 * s, h: 48 * s } };
}

export function drawWhistle(ctx, c, o = {}) {
  const x = o.x ?? 100, y = o.y ?? 100, s = o.s ?? 1, dir = o.dir === -1 ? -1 : 1, col = o.tone ?? lighten(steelOf(c), 0.1);
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  ctx.beginPath(); ctx.arc(-24, -6, 6, 0, TAU); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 4.5; ctx.stroke(); ctx.strokeStyle = lighten(col, 0.2); ctx.lineWidth = 2; ctx.stroke();
  lit(ctx, () => rr(ctx, 4, -9, 26, 10, 3), darken(col, 0.06), 14);
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(-6, -12); ctx.arc(-6, 2, 14, -Math.PI / 2, 0, true); ctx.closePath(); }, col, 30, { shade: 0.22 });
  rr(ctx, -2, -13, 9, 5, 1.5); ctx.fillStyle = darken(col, 0.6); ctx.fill();
  ctx.beginPath(); ctx.arc(-6, 2, 6, 0, TAU); ctx.fillStyle = alpha(darken(col, 0.3), 0.6); ctx.fill();
  ctx.restore();
  const Wp = (lx, ly) => ({ x: x + dir * s * lx, y: y + s * ly });
  return { mouth: Wp(30, -4), opening: Wp(2, -14), box: { x: x - 32 * s, y: y - 14 * s, w: 64 * s, h: 30 * s } };
}

export function drawThermometer(ctx, c, o = {}) {
  const x = o.x ?? 100, y = o.y ?? 100, s = o.s ?? 1, lv = c01(o.level ?? 0.5), red = c.s6 ?? c.flame, glass = c.glass;
  const tH = 54, top = y - tH * s, lvY = y - s * (8 + (tH - 12) * lv);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const tube = () => { ctx.beginPath(); ctx.moveTo(-5.5, -4); ctx.lineTo(-5.5, -tH + 5); ctx.arc(0, -tH + 5, 5.5, Math.PI, 0); ctx.lineTo(5.5, -4); ctx.arc(0, 0, 10, -Math.PI * 0.32, Math.PI * 1.32); ctx.closePath(); };
  tube(); ctx.fillStyle = alpha(lighten(glass, 0.5), 0.55); ctx.fill();
  rr(ctx, -2.2, -(8 + (tH - 12) * lv), 4.4, 8 + (tH - 12) * lv, 2); ctx.fillStyle = red; ctx.fill();
  ball(ctx, 0, 0, 7, red);
  ctx.strokeStyle = alpha(darken(glass, 0.5), 0.9); ctx.lineWidth = 1.2;
  for (let i = 1; i <= 5; i++) { const yy = -8 - (tH - 12) * i / 5; ctx.beginPath(); ctx.moveTo(5.5, yy); ctx.lineTo(i % 2 ? 9 : 11, yy); ctx.stroke(); }
  ctx.strokeStyle = alpha(lighten(glass, 0.85), 0.9); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-3.5, -10); ctx.lineTo(-3.5, -tH + 6); ctx.stroke();
  tube(); ctx.strokeStyle = darken(glass, 0.45); ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  if (o.label) label(ctx, c, o.label, x + 16 * s, y - tH * s * 0.5, o.size ?? 26, { align: 'left' });
  return { bulb: { x, y }, top: { x, y: top }, level: { x, y: lvY }, box: { x: x - 11 * s, y: top - 6 * s, w: 24 * s, h: (tH + 16) * s } };
}

const cloudOf = (c) => darken(mix(c.labelMuted, c.s5, 0.15), 0.32);
const stoneOf = (c) => lighten(mix(c.gold, c.labelMuted, 0.55), 0.12);
const plumOf = (c) => darken(mix(c.labelMuted, c.s8, 0.3), 0.5);

/**
 * drawStormCloud(ctx, c, o) -> { base, flashAt, box }
 *   A layered monsoon storm cloud: a tall tower of rounded lobes over a dark flat base,
 *   lit tops, a light flicker inside, optional rain.
 *   o: { x, y (middle of the cloud base), w = 320, flash = 0 (0..1 the inner light), rain
 *        = 0 (0..1 streaks under the base), seed = 7 (lobe layout), t = 0 (rain drift),
 *        anvil = false (true: a flat spreading top above the tower) }
 */
export function drawStormCloud(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 200, w = o.w ?? 320, k = w / 320, fl = c01(o.flash ?? 0), col = cloudOf(c);
  const rnd = lcg(o.seed ?? 7), L = [];
  for (let i = 0; i < 7; i++) L.push({ x: -150 + i * 50 + (rnd() - 0.5) * 16, y: -30 - rnd() * 14, r: 34 + rnd() * 14, d: 0 });
  for (let i = 0; i < 5; i++) L.push({ x: -95 + i * 48 + (rnd() - 0.5) * 14, y: -76 - rnd() * 16, r: 40 + rnd() * 12, d: 1 });
  for (let i = 0; i < 3; i++) L.push({ x: -50 + i * 48 + (rnd() - 0.5) * 12, y: -128 - rnd() * 12, r: 38 + rnd() * 10, d: 2 });
  L.push({ x: 4, y: -168, r: 36, d: 3 });
  L.sort((a, b) => b.d - a.d || a.y - b.y);
  const union = () => { ctx.beginPath(); for (const l of L) { ctx.moveTo(l.x + l.r, l.y); ctx.arc(l.x, l.y, l.r, 0, TAU); } ctx.rect(-170, -40, 340, 34); };
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  // the anvil spreading at the top, then the tower and base
  const anv = () => { ctx.beginPath(); ctx.moveTo(-150, -190); ctx.quadraticCurveTo(-60, -232, 10, -226); ctx.quadraticCurveTo(110, -232, 170, -196); ctx.quadraticCurveTo(80, -184, 0, -176); ctx.quadraticCurveTo(-80, -182, -150, -190); ctx.closePath(); };
  if (o.anvil) lit(ctx, anv, lighten(col, 0.12), 80, { shade: 0.18 });
  union(); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 5; ctx.stroke();
  for (const l of L) {
    const tc = l.d ? lighten(col, 0.1 * l.d) : darken(col, 0.06);
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, TAU); ctx.fillStyle = darken(tc, 0.2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, TAU); ctx.clip();
    ctx.beginPath(); ctx.arc(l.x - l.r * 0.16, l.y - l.r * 0.2, l.r * 0.86, 0, TAU); ctx.fillStyle = tc; ctx.fill();
    ctx.beginPath(); ctx.arc(l.x - l.r * 0.3, l.y - l.r * 0.42, l.r * 0.6, Math.PI * 1.05, Math.PI * 1.6); ctx.strokeStyle = alpha(lighten(tc, 0.45), 0.8); ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r, Math.PI * 0.05, Math.PI * 0.85); ctx.strokeStyle = alpha(darken(tc, 0.35), 0.55); ctx.lineWidth = 1.6; ctx.stroke();
  }
  ctx.save(); union(); ctx.clip();
  const bg = ctx.createLinearGradient(0, -60, 0, -6); bg.addColorStop(0, alpha(darken(col, 0.45), 0)); bg.addColorStop(1, alpha(darken(col, 0.45), 0.9));
  ctx.fillStyle = bg; ctx.fillRect(-200, -60, 400, 60);
  const fx = -20 + (rnd() - 0.5) * 40, fy = -96;
  if (fl > 0.01) {
    const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 150); g.addColorStop(0, alpha(lighten(c.warning, 0.8), 0.85 * fl)); g.addColorStop(0.5, alpha(lighten(c.glass, 0.5), 0.35 * fl)); g.addColorStop(1, alpha(c.glass, 0));
    ctx.fillStyle = g; ctx.fillRect(-200, -240, 400, 240);
  }
  ctx.restore();
  const rain = c01(o.rain ?? 0);
  if (rain > 0.01) {
    const rr2 = lcg(55), t = o.t ?? 0; ctx.strokeStyle = alpha(lighten(c.water, 0.3), 0.55 * rain); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (let i = 0; i < 40 * rain; i++) { const px = -150 + rr2() * 300, py = 4 + ((rr2() * 120 + t * 260) % 120); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 5, py + 14); ctx.stroke(); }
  }
  ctx.restore();
  return { base: { x, y }, flashAt: { x: x + fx * k, y: y + fy * k }, box: { x: x - 175 * k, y: y - (o.anvil ? 232 : 206) * k, w: 350 * k, h: (o.anvil ? 236 : 210) * k } };
}

/**
 * drawBolt(ctx, c, o) -> { points }
 *   A lightning bolt from a point to a point: a seeded zigzag with short forks, a wide soft
 *   glow and a bright core. o: { from {x, y}, to {x, y}, seed = 3 (the zigzag; keep it
 *   fixed for one flash), glow = 1 (0..1 brightness; 0 draws nothing), wd = 4, forks = 2 }
 */
export function drawBolt(ctx, c, o = {}) {
  const a = o.from ?? { x: 300, y: 120 }, b = o.to ?? { x: 340, y: 460 }, g = c01(o.glow ?? 1), wd = o.wd ?? 4;
  const rnd = lcg(o.seed ?? 3), len = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
  const P = [a];
  for (let i = 1; i < 10; i++) { const u = i / 10, j = (rnd() - 0.5) * len * 0.13; P.push({ x: a.x + (b.x - a.x) * u + nx * j, y: a.y + (b.y - a.y) * u + ny * j }); }
  P.push(b);
  const F = [];
  for (let f = 0; f < (o.forks ?? 2); f++) {
    const i = 2 + Math.floor(rnd() * 5), s = rnd() < 0.5 ? -1 : 1, q = [P[i]];
    for (let j = 1; j <= 3; j++) { const p = q[j - 1]; q.push({ x: p.x + (b.x - a.x) / 10 * 0.8 + nx * s * len * 0.06 * (0.6 + rnd()), y: p.y + (b.y - a.y) / 10 * 0.8 + ny * s * len * 0.06 * (0.6 + rnd()) }); }
    F.push(q);
  }
  if (g <= 0.01) return { points: P };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pass = (lw, col, fw) => { polyline(ctx, P); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(); for (const q of F) { polyline(ctx, q); ctx.lineWidth = lw * fw; ctx.stroke(); } };
  pass(wd * 6, alpha(lighten(c.glass, 0.3), 0.22 * g), 0.6);
  pass(wd * 2.4, alpha(lighten(c.warning, 0.5), 0.55 * g), 0.6);
  pass(wd, alpha(lighten(c.warning, 0.88), g), 0.55);
  ctx.restore();
  return { points: P };
}

/**
 * drawDrone(ctx, c, o) -> { body, rotors, box }
 *   A small quadcopter seen from the front and a little above: body, four arms with
 *   motors and two-blade rotors (blurred discs while spinning), landing legs, a camera
 *   ball underneath. No face. o: { x, y (body centre), s = 1 (about 170 px across), spin =
 *   0 (rotor phase; turns), blur = true (faint discs) }
 */
export function drawDrone(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 200, s = o.s ?? 1, sp = o.spin ?? 0, col = darken(mix(c.labelMuted, c.s1, 0.12), 0.22);
  const R = [{ x: -48, y: -14, k: 0.8 }, { x: 48, y: -14, k: 0.8 }, { x: -70, y: 8, k: 1 }, { x: 70, y: 8, k: 1 }];
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const rotor = (r, i) => {
    rod(ctx, [{ x: 0, y: r.y > 0 ? 4 : -6 }, { x: r.x, y: r.y }], 7 * r.k, darken(col, 0.1));
    lit(ctx, () => rr(ctx, r.x - 7 * r.k, r.y - 12 * r.k, 14 * r.k, 13 * r.k, 3), darken(col, 0.3), 14);
    if (o.blur !== false) { ctx.beginPath(); ctx.ellipse(r.x, r.y - 13 * r.k, 34 * r.k, 6 * r.k, 0, 0, TAU); ctx.fillStyle = alpha(lighten(c.glass, 0.3), 0.22); ctx.fill(); ctx.strokeStyle = alpha(lighten(c.glass, 0.5), 0.4); ctx.lineWidth = 1.2; ctx.stroke(); }
    const a = TAU * sp * (i % 2 ? -1 : 1) + i;
    for (const e of [0, Math.PI]) { const bx = Math.cos(a + e) * 32 * r.k, by = Math.sin(a + e) * 5.5 * r.k; rod(ctx, [{ x: r.x, y: r.y - 13 * r.k }, { x: r.x + bx, y: r.y - 13 * r.k + by }], 4.5 * r.k, darken(col, 0.38)); }
    ball(ctx, r.x, r.y - 13 * r.k, 3 * r.k, lighten(col, 0.2));
  };
  rotor(R[0], 0); rotor(R[1], 1);
  for (const k of [-1, 1]) { rod(ctx, [{ x: k * 16, y: 10 }, { x: k * 24, y: 34 }], 4, darken(col, 0.2)); rod(ctx, [{ x: k * 12, y: 35 }, { x: k * 36, y: 35 }], 4, darken(col, 0.25)); }
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(-26, -10); ctx.quadraticCurveTo(0, -22, 26, -10); ctx.lineTo(30, 8); ctx.quadraticCurveTo(0, 18, -30, 8); ctx.closePath(); }, col, 50, { shade: 0.2 });
  ctx.strokeStyle = alpha(darken(col, 0.35), 0.7); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.quadraticCurveTo(0, 8, 28, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(18, -8, 2, 0, TAU); ctx.fillStyle = c.s3; ctx.fill();
  ball(ctx, 0, 20, 8, darken(col, 0.35));
  ctx.beginPath(); ctx.arc(1.5, 22, 3.2, 0, TAU); ctx.fillStyle = darken(c.glass, 0.6); ctx.fill();
  rotor(R[2], 2); rotor(R[3], 3);
  ctx.restore();
  return { body: { x, y }, rotors: R.map((r) => ({ x: x + r.x * s, y: y + (r.y - 13 * r.k) * s })), box: { x: x - 106 * s, y: y - 32 * s, w: 212 * s, h: 72 * s } };
}

/**
 * drawCar(ctx, c, o) -> { sensor, front, rear, box }
 *   A small hatchback seen from the side: windows, doors, wheels, lights, and a parking
 *   sensor (a small round eye-less button) in the rear bumper. No face.
 *   o: { x (middle), y (ground), len = 200, dir = 1 (front to the right), tone = 1, lit =
 *        false (ring the sensor), spin = 0 (wheel turn) }
 *   sensor: where its ultrasound leaves (backwards).
 */
export function drawCar(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 470, L = o.len ?? 200, k = L / 200, dir = o.dir === -1 ? -1 : 1;
  const col = mix(toneOf(c, o.tone, 1), c.labelMuted, 0.15), tyre = darken(mix(c.labelMuted, c.bgDeep, 0.5), 0.6), glassC = darken(c.glass, 0.35);
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * k, k);
  drawShadow(ctx, c, 0, 0, 100, 8);
  const body = () => {
    ctx.beginPath(); ctx.moveTo(-100, -14); ctx.lineTo(-101, -42); ctx.quadraticCurveTo(-96, -60, -78, -74); ctx.quadraticCurveTo(-40, -82, 10, -78);
    ctx.quadraticCurveTo(30, -72, 46, -52); ctx.quadraticCurveTo(84, -48, 96, -42); ctx.quadraticCurveTo(104, -36, 103, -16); ctx.lineTo(88, -14);
    ctx.arc(62, -14, 26, 0, Math.PI, true); ctx.lineTo(-36, -14); ctx.arc(-62, -14, 26, 0, Math.PI, true); ctx.closePath();
  };
  lit(ctx, body, col, 100, { shade: 0.18 });
  ctx.save(); body(); ctx.clip();
  ctx.fillStyle = alpha(darken(col, 0.3), 0.5); ctx.fillRect(-110, -24, 220, 12);
  ctx.strokeStyle = alpha(lighten(col, 0.5), 0.75); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-96, -40); ctx.quadraticCurveTo(0, -46, 92, -40); ctx.stroke();
  ctx.restore();
  const win = () => { ctx.beginPath(); ctx.moveTo(-88, -48); ctx.quadraticCurveTo(-84, -62, -72, -69); ctx.quadraticCurveTo(-36, -76, 6, -73); ctx.quadraticCurveTo(24, -67, 37, -51); ctx.closePath(); };
  win(); ctx.fillStyle = glassC; ctx.fill();
  ctx.save(); win(); ctx.clip(); ctx.fillStyle = alpha(lighten(c.glass, 0.5), 0.5); ctx.beginPath(); ctx.moveTo(-60, -80); ctx.lineTo(-40, -80); ctx.lineTo(-62, -40); ctx.lineTo(-82, -40); ctx.closePath(); ctx.fill(); ctx.restore();
  win(); ctx.strokeStyle = darken(col, 0.45); ctx.lineWidth = 2; ctx.stroke();
  rod(ctx, [{ x: -26, y: -74 }, { x: -24, y: -48 }], 5, darken(col, 0.15));
  ctx.strokeStyle = alpha(darken(col, 0.42), 0.8); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-26, -46); ctx.lineTo(-30, -16); ctx.moveTo(36, -48); ctx.lineTo(34, -18); ctx.stroke();
  rr(ctx, -16, -40, 12, 3.5, 1.5); ctx.fillStyle = darken(col, 0.35); ctx.fill();
  lit(ctx, () => rr(ctx, 30, -56, 10, 8, 3), darken(col, 0.1), 10, { rimW: 1.4 });
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(90, -44); ctx.lineTo(101, -40); ctx.lineTo(101, -32); ctx.lineTo(88, -36); ctx.closePath(); }, lighten(c.warning, 0.4), 12, { rimW: 1.4 });
  lit(ctx, () => rr(ctx, -102, -50, 7, 12, 2), c.s6, 10, { rimW: 1.4 });
  lit(ctx, () => rr(ctx, -104, -28, 14, 12, 4), darken(col, 0.25), 14, { rimW: 1.6 });
  if (o.lit) glow(ctx, -103, -22, 22, c.warning, 1);
  ctx.beginPath(); ctx.arc(-103, -22, 3.4, 0, TAU); ctx.fillStyle = darken(steelOf(c), 0.35); ctx.fill(); ctx.strokeStyle = o.lit ? c.warning : lighten(steelOf(c), 0.2); ctx.lineWidth = 1.6; ctx.stroke();
  for (const wx of [-62, 62]) {
    ball(ctx, wx, -14, 21, tyre);
    ball(ctx, wx, -14, 11, steelOf(c));
    ctx.strokeStyle = darken(steelOf(c), 0.4); ctx.lineWidth = 2; const a0 = TAU * (o.spin ?? 0);
    for (let i = 0; i < 5; i++) { const a = a0 + i * TAU / 5; ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * 3, -14 + Math.sin(a) * 3); ctx.lineTo(wx + Math.cos(a) * 10, -14 + Math.sin(a) * 10); ctx.stroke(); }
  }
  ctx.restore();
  const Wp = (lx, ly) => ({ x: x + dir * k * lx, y: y + k * ly });
  return { sensor: Wp(-106, -22), front: Wp(103, -30), rear: Wp(-101, -30), box: { x: x - 106 * k, y: y - 82 * k, w: 212 * k, h: 90 * k } };
}

/**
 * drawRover(ctx, c, o) -> { mast, arm, box }
 *   A generic six-wheeled planetary rover from the side: rocker-bogie legs, a white body
 *   box, a deck with a dish antenna, a camera mast (a plain head with a lens window) and a
 *   folded tool arm. No markings, no face. o: { x (middle), y (ground), s = 1 (about 220 px
 *   long), dir = 1 (front to the right), spin = 0 (wheel turn) }
 */
export function drawRover(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 470, s = o.s ?? 1, dir = o.dir === -1 ? -1 : 1, body = hullTopOf(c), wheel = darken(steelOf(c), 0.3), metal = steelOf(c);
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  drawShadow(ctx, c, 0, 0, 110, 8);
  const W = [-78, -8, 72];
  // legs (rocker and bogie)
  rod(ctx, [{ x: -20, y: -70 }, { x: 20, y: -44 }, { x: 72, y: -20 }], 6, metal);
  rod(ctx, [{ x: 20, y: -44 }, { x: -40, y: -40 }], 6, metal);
  rod(ctx, [{ x: -78, y: -20 }, { x: -40, y: -40 }, { x: -8, y: -20 }], 6, metal);
  ball(ctx, 20, -44, 5, darken(metal, 0.1)); ball(ctx, -40, -40, 5, darken(metal, 0.1));
  for (const wx of W) {
    ball(ctx, wx, -20, 20, wheel);
    ctx.save(); ctx.beginPath(); ctx.arc(wx, -20, 20, 0, TAU); ctx.clip();
    const a0 = TAU * (o.spin ?? 0); ctx.strokeStyle = alpha(darken(wheel, 0.4), 0.8); ctx.lineWidth = 2.2;
    for (let i = 0; i < 10; i++) { const a = a0 + i * TAU / 10; ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * 15, -20 + Math.sin(a) * 15); ctx.lineTo(wx + Math.cos(a) * 21, -20 + Math.sin(a) * 21); ctx.stroke(); }
    ctx.restore();
    ball(ctx, wx, -20, 6.5, metal);
  }
  // the body and deck
  lit(ctx, () => rr(ctx, -66, -100, 132, 36, 5), body, 80, { shade: 0.16 });
  ctx.strokeStyle = alpha(darken(body, 0.3), 0.7); ctx.lineWidth = 1.4; for (const px of [-30, 10, 44]) { ctx.beginPath(); ctx.moveTo(px, -98); ctx.lineTo(px, -66); ctx.stroke(); }
  lit(ctx, () => rr(ctx, -74, -106, 148, 8, 3), darken(metal, 0.05), 40, { rimW: 1.6 });
  // dish antenna, mast with camera head, folded arm
  rod(ctx, [{ x: -36, y: -106 }, { x: -36, y: -120 }], 4, metal);
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(-36, -126, 16, 6, -0.3, 0, TAU); }, lighten(metal, 0.2), 20, { rimW: 1.6 });
  rod(ctx, [{ x: 50, y: -106 }, { x: 50, y: -164 }], 6, metal);
  lit(ctx, () => rr(ctx, 34, -184, 36, 20, 4), body, 30, { shade: 0.2 });
  rr(ctx, 50, -179, 16, 7, 2); ctx.fillStyle = darken(c.glass, 0.55); ctx.fill();
  ctx.fillStyle = alpha(lighten(c.glass, 0.6), 0.8); ctx.fillRect(52, -178, 5, 2);
  rod(ctx, [{ x: 68, y: -80 }, { x: 92, y: -86 }, { x: 96, y: -60 }], 5, metal);
  lit(ctx, () => rr(ctx, 88, -62, 16, 12, 3), darken(metal, 0.15), 14, { rimW: 1.4 });
  ctx.restore();
  const Wp = (lx, ly) => ({ x: x + dir * s * lx, y: y + s * ly });
  return { mast: Wp(52, -174), arm: Wp(96, -52), box: { x: x - 100 * s, y: y - 188 * s, w: 210 * s, h: 196 * s } };
}

/**
 * drawMosquito(ctx, c, o) -> { wings, body, box }
 *   A mosquito from the side: striped abdomen, humped thorax, small head with a large eye
 *   and a long needle mouth, feathery antennae, six long thin legs, narrow veined wings
 *   that beat. o: { x, y (thorax), s = 1 (about 110 px with legs), dir = 1 (head right),
 *   flap = 0 (0..1 wing phase), ghost = true (two faint wing end positions) }
 */
export function drawMosquito(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 260, s = o.s ?? 1, dir = o.dir === -1 ? -1 : 1, col = plumOf(c), ph = o.flap ?? 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const legs = [[[-2, 6], [-18, -6], [-40, 26]], [[2, 7], [-8, -2], [-14, 34]], [[6, 7], [16, -2], [14, 34]], [[9, 6], [28, -4], [40, 28]]];
  for (const lg of legs) { const P = lg.map(([a, b]) => ({ x: a, y: b })); polyline(ctx, P); ctx.strokeStyle = darken(col, 0.3); ctx.lineWidth = 2.2; ctx.stroke(); polyline(ctx, P, -0.6, -0.6); ctx.strokeStyle = alpha(lighten(col, 0.4), 0.6); ctx.lineWidth = 0.8; ctx.stroke(); }
  const wing = (a, al) => {
    ctx.save(); ctx.translate(2, -8); ctx.rotate(a); ctx.globalAlpha = al;
    const p = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-20, -9, -46, -6); ctx.quadraticCurveTo(-50, -2, -44, 1); ctx.quadraticCurveTo(-20, 3, 0, 0); ctx.closePath(); };
    p(); ctx.fillStyle = alpha(lighten(c.glass, 0.6), 0.45); ctx.fill();
    ctx.strokeStyle = alpha(darken(c.glass, 0.45), 0.8); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-4, -1); ctx.lineTo(-44, -4); ctx.moveTo(-14, 0); ctx.lineTo(-38, 0); ctx.stroke();
    p(); ctx.strokeStyle = darken(c.glass, 0.4); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
  };
  const wa = -0.15 + 0.45 * Math.sin(TAU * ph);
  if (o.ghost !== false) { wing(-0.6, 0.35); wing(0.3, 0.35); }
  // abdomen with bands, thorax, head
  const ab = () => { ctx.beginPath(); ctx.moveTo(-2, -4); ctx.quadraticCurveTo(-24, -8, -46, 6); ctx.quadraticCurveTo(-24, 6, -2, 4); ctx.closePath(); };
  lit(ctx, ab, col, 20, { shade: 0.2, rimW: 1.6 });
  ctx.save(); ab(); ctx.clip(); ctx.strokeStyle = alpha(lighten(col, 0.55), 0.85); ctx.lineWidth = 2.2;
  for (let i = 0; i < 5; i++) { const px = -8 - i * 7.5; ctx.beginPath(); ctx.moveTo(px, -10); ctx.lineTo(px - 2, 10); ctx.stroke(); }
  ctx.restore();
  lit(ctx, () => { ctx.beginPath(); ctx.ellipse(6, -2, 10, 8.5, -0.2, 0, TAU); }, col, 18, { shade: 0.22, rimW: 1.6 });
  ctx.beginPath(); ctx.moveTo(22, 1); ctx.quadraticCurveTo(36, 4, 50, 14); ctx.strokeStyle = darken(col, 0.35); ctx.lineWidth = 1.8; ctx.stroke();
  for (const k of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(21, -3); ctx.quadraticCurveTo(30, -10 + k * 2, 38, -12 + k * 5); ctx.strokeStyle = darken(col, 0.25); ctx.lineWidth = 1.2; ctx.stroke();
    for (let i = 1; i <= 4; i++) { const px = 21 + i * 4, py = -3 - i * 2.2 + k * i * 0.6; ctx.beginPath(); ctx.moveTo(px, py - 2.5); ctx.lineTo(px + 1, py + 2.5); ctx.strokeStyle = alpha(darken(col, 0.2), 0.7); ctx.lineWidth = 0.9; ctx.stroke(); }
  }
  ball(ctx, 19, -1, 5.2, darken(col, 0.1));
  ctx.beginPath(); ctx.arc(20, -2, 3, 0, TAU); ctx.fillStyle = darken(col, 0.7); ctx.fill();
  ctx.beginPath(); ctx.arc(19.3, -2.8, 0.9, 0, TAU); ctx.fillStyle = lighten(col, 0.7); ctx.fill();
  wing(wa, 1);
  ctx.restore();
  return { wings: { x: x - dir * s * 18, y: y - 12 * s }, body: { x, y }, box: { x: x - 50 * s, y: y - 30 * s, w: 104 * s, h: 66 * s } };
}

/**
 * drawHall(ctx, c, o) -> { inner, segs, floorY, stage, box }
 *   A school or concert hall in cut view: thick walls, floor, ceiling, a raised stage at
 *   the left, rows of seats. Section faces are hatched.
 *   o: { x, y (top-left of the outer walls), w = 600, h = 320, panels = false (true: soft
 *        sound-absorbing panels on the back wall and the ceiling), seats = 'bare' |
 *        'cushioned', curtains = false (stage curtains and drapes at the back), rows = 7 }
 *   segs: the inner surfaces as [{ a, b, kind: 'floor' | 'wall' | 'ceiling' | 'stage' |
 *   'panel' }] in canvas px, so a scene can bounce rays off them ('panel' absorbs).
 */
export function drawHall(ctx, c, o = {}) {
  const x = o.x ?? 40, y = o.y ?? 120, w = o.w ?? 600, h = o.h ?? 320, tw = 16, rows = o.rows ?? 7;
  const wall = stoneOf(c), room = mix(c.bgSurface, c.gold, 0.1), floorC = woodOf(c);
  const ix = x + tw, iy = y + tw, iw = w - 2 * tw, ih = h - 2 * tw, fy = iy + ih, sx1 = ix + iw * 0.22, sy = fy - 34;
  ctx.save();
  // the room inside, then the section walls with hatching
  ctx.fillStyle = room; ctx.fillRect(ix, iy, iw, ih);
  ctx.fillStyle = alpha(darken(room, 0.2), 0.5); ctx.fillRect(ix, fy - ih * 0.35, iw, ih * 0.35);
  const ring = () => { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.rect(ix + iw, iy, -iw, ih); };
  lit(ctx, ring, wall, 60, { shade: 0.12 });
  ctx.save(); ring(); ctx.clip('evenodd');
  ctx.strokeStyle = alpha(darken(wall, 0.35), 0.55); ctx.lineWidth = 1.4;
  for (let i = -h; i < w; i += 11) { ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); ctx.stroke(); }
  ctx.restore();
  // the floor boards and the stage
  ctx.fillStyle = floorC; ctx.fillRect(ix, fy - 5, iw, 5);
  lit(ctx, () => rr(ctx, ix, sy, sx1 - ix, 34, 2), floorC, 40, { shade: 0.18 });
  ctx.strokeStyle = alpha(darken(floorC, 0.35), 0.7); ctx.lineWidth = 1.2; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(ix, sy + i * 8.5); ctx.lineTo(sx1, sy + i * 8.5); ctx.stroke(); }
  const segs = [];
  const pan = !!o.panels, panC = darken(mix(c.s5, c.labelMuted, 0.4), 0.15);
  if (o.curtains) {
    const cc = darken(c.s6, 0.25);
    for (const [x0, x1] of [[ix, ix + 26], [sx1 - 22, sx1]]) lit(ctx, () => { ctx.beginPath(); ctx.moveTo(x0, iy); ctx.lineTo(x1, iy); ctx.quadraticCurveTo(x1 + 4, sy * 0.5 + iy * 0.5, x1 - 2, sy); ctx.lineTo(x0, sy); ctx.closePath(); }, cc, 30, { shade: 0.2 });
    ctx.strokeStyle = alpha(darken(cc, 0.35), 0.8); ctx.lineWidth = 2;
    for (const px of [ix + 9, ix + 18, sx1 - 14, sx1 - 7]) { ctx.beginPath(); ctx.moveTo(px, iy + 4); ctx.lineTo(px + 1, sy - 2); ctx.stroke(); }
    lit(ctx, () => rr(ctx, ix, iy, sx1 - ix, 18, 3), cc, 20, { shade: 0.2 });
  }
  if (pan) {
    const quilt = (px, py, pw, ph) => {
      lit(ctx, () => rr(ctx, px, py, pw, ph, 4), panC, 30, { shade: 0.22 });
      ctx.fillStyle = alpha(darken(panC, 0.35), 0.7); for (let a = 6; a < pw - 3; a += 9) for (let b = 6; b < ph - 3; b += 9) { ctx.beginPath(); ctx.arc(px + a, py + b, 1.3, 0, TAU); ctx.fill(); }
    };
    for (let i = 0; i < 4; i++) quilt(ix + iw - 14, iy + 18 + i * (ih - 60) / 4, 14, (ih - 60) / 4 - 6);
    for (let i = 0; i < 5; i++) quilt(sx1 + 20 + i * (iw * 0.72) / 5, iy, (iw * 0.72) / 5 - 10, 13);
  }
  // seats in rows
  const sc = o.seats === 'cushioned' ? darken(c.s6, 0.15) : woodOf(c), metal = steelOf(c);
  for (let i = 0; i < rows; i++) {
    const px = sx1 + 40 + i * (ix + iw - (pan ? 30 : 16) - sx1 - 70) / Math.max(1, rows - 1);
    rod(ctx, [{ x: px - 9, y: fy - 4 }, { x: px - 9, y: fy - 20 }], 3, metal); rod(ctx, [{ x: px + 9, y: fy - 4 }, { x: px + 9, y: fy - 20 }], 3, metal);
    if (o.seats === 'cushioned') {
      lit(ctx, () => rr(ctx, px - 14, fy - 30, 30, 11, 5), sc, 20, { shade: 0.2 });
      lit(ctx, () => rr(ctx, px + 9, fy - 58, 11, 34, 5), sc, 20, { shade: 0.2 });
    } else {
      lit(ctx, () => rr(ctx, px - 13, fy - 25, 28, 5, 1.5), sc, 14, { rimW: 1.4 });
      rod(ctx, [{ x: px + 13, y: fy - 22 }, { x: px + 15, y: fy - 52 }], 4, sc);
      lit(ctx, () => rr(ctx, px + 10, fy - 54, 9, 14, 2), sc, 12, { rimW: 1.4 });
    }
  }
  ctx.restore();
  const S = (ax, ay, bx, by, kind) => segs.push({ a: { x: ax, y: ay }, b: { x: bx, y: by }, kind });
  S(sx1, fy, ix + iw, fy, 'floor'); S(ix, sy, sx1, sy, 'stage'); S(sx1, sy, sx1, fy, 'stage');
  S(ix, iy, ix, sy, o.curtains ? 'panel' : 'wall');
  if (pan) { S(ix, iy, sx1 + 10, iy, 'ceiling'); S(sx1 + 10, iy + 13, ix + iw - 14, iy + 13, 'panel'); S(ix + iw - 14, iy + 13, ix + iw - 14, fy - 30, 'panel'); S(ix + iw, fy - 30, ix + iw, fy, 'wall'); }
  else { S(ix, iy, ix + iw, iy, 'ceiling'); S(ix + iw, iy, ix + iw, fy, 'wall'); }
  return { inner: { x: ix, y: iy, w: iw, h: ih }, segs, floorY: fy, stage: { x: ix, y: sy, w: sx1 - ix }, box: { x, y, w, h } };
}

/**
 * drawDome(ctx, c, o) -> { arc: {cx, cy, r, a0, a1}, gallery: [left, right], floorY, box }
 *   A large dome in plain cross-section (like a big old tomb dome): thick masonry walls,
 *   the half-sphere above them, a gallery ledge with a railing running round the inside
 *   where the dome starts. Stone courses in the cut faces; no ornament.
 *   o: { x (middle), y (floor), R = 230 (outer radius), wallH = 0.55 R, th = 0.15 R,
 *        depth = true (far half of the dome in shade, courses, the gallery's far ledge) }
 *   arc: the inner dome surface (a0 = PI, a1 = 2 PI, canvas angles); gallery: where a
 *   person stands on the ledge, each side.
 */
export function drawDome(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 490, R = o.R ?? 230, hW = o.wallH ?? R * 0.55, th = o.th ?? R * 0.15, r = R - th, cy = y - hW;
  const st = stoneOf(c), room = darken(mix(c.bgSurface, c.gold, 0.1), 0.08);
  ctx.save();
  const roomP = () => { ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x - r, cy); ctx.arc(x, cy, r, Math.PI, TAU); ctx.lineTo(x + r, y); ctx.closePath(); };
  roomP(); ctx.fillStyle = room; ctx.fill();
  if (o.depth !== false) {
    // depth: the far half of the dome in shade (darker toward its rim and crown), a few
    // masonry courses on it, the far side of the gallery ring as a ledge with a railing
    ctx.save(); roomP(); ctx.clip();
    const g = ctx.createRadialGradient(x - r * 0.12, cy + r * 0.3, r * 0.08, x, cy, r * 1.04);
    g.addColorStop(0, alpha(lighten(room, 0.3), 0.55)); g.addColorStop(0.55, alpha(darken(room, 0.12), 0.12)); g.addColorStop(1, alpha(darken(room, 0.4), 0.8));
    ctx.fillStyle = g; ctx.fillRect(x - r, cy - r, 2 * r, y - cy + r);
    // seen from the gallery's height: a far ring appears as the upper half of a flat ellipse
    // (squash 0.2), as L06 DomeScene draws its whisper ring
    const K = 0.2, gx = r - th * 0.45;
    ctx.lineWidth = 1.3; ctx.strokeStyle = alpha(darken(st, 0.28), 0.4);
    for (const ph of [0.3, 0.55, 0.8, 1.05, 1.3]) { const rq = r * Math.cos(ph); ctx.beginPath(); ctx.ellipse(x, cy - r * Math.sin(ph), rq, rq * K, 0, Math.PI, TAU); ctx.stroke(); }
    for (let yy = cy + 34; yy < y - 6; yy += 22) { ctx.beginPath(); ctx.moveTo(x - r, yy); ctx.lineTo(x + r, yy); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(x, cy, r, r * K, 0, Math.PI, TAU); ctx.ellipse(x, cy + 10, gx, gx * K, 0, TAU, Math.PI, true); ctx.closePath();
    ctx.fillStyle = darken(st, 0.18); ctx.fill(); ctx.strokeStyle = alpha(darken(st, 0.45), 0.8); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, cy + 10, gx, gx * K, 0, Math.PI, TAU); ctx.strokeStyle = alpha(lighten(st, 0.4), 0.85); ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = alpha(darken(st, 0.4), 0.7); ctx.lineWidth = 1.5;
    for (let i = 1; i < 24; i++) { const a = Math.PI + i / 24 * Math.PI, px = x + gx * Math.cos(a), py = cy + 10 + gx * K * Math.sin(a); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 16); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(x, cy - 6, gx, gx * K, 0, Math.PI, TAU); ctx.stroke();
    ctx.restore();
  }
  const shell = () => { ctx.beginPath(); ctx.moveTo(x - R, y); ctx.lineTo(x - R, cy); ctx.arc(x, cy, R, Math.PI, TAU); ctx.lineTo(x + R, y); ctx.lineTo(x + r, y); ctx.lineTo(x + r, cy); ctx.arc(x, cy, r, TAU, Math.PI, true); ctx.lineTo(x - r, y); ctx.closePath(); };
  lit(ctx, shell, st, R, { shade: 0.14 });
  ctx.save(); shell(); ctx.clip();
  ctx.strokeStyle = alpha(darken(st, 0.32), 0.6); ctx.lineWidth = 1.3;
  for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.arc(x, cy, r + th * i / 3, Math.PI, TAU); ctx.stroke(); }
  for (let i = 1; i < 14; i++) { const a = Math.PI + i * Math.PI / 14, off = (i % 2) * 0.5; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * (r + th * (0.33 + off * 0.33)), cy + Math.sin(a) * (r + th * (0.33 + off * 0.33))); ctx.stroke(); }
  for (let yy = cy + 16; yy < y; yy += 16) { ctx.beginPath(); ctx.moveTo(x - R, yy); ctx.lineTo(x - r, yy); ctx.moveTo(x + r, yy); ctx.lineTo(x + R, yy); ctx.stroke(); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, cy, R - 4, Math.PI * 1.1, Math.PI * 1.45); ctx.strokeStyle = alpha(lighten(st, 0.55), 0.8); ctx.lineWidth = 3; ctx.stroke();
  // gallery ledges with railings, and the floor
  const lw = th * 0.9, gal = [];
  for (const k of [-1, 1]) {
    const ex = x + k * r, gx = ex - k * lw;
    lit(ctx, () => { ctx.beginPath(); ctx.moveTo(ex, cy); ctx.lineTo(gx, cy); ctx.lineTo(gx, cy + 8); ctx.lineTo(ex, cy + 22); ctx.closePath(); }, darken(st, 0.06), 24, { shade: 0.2 });
    ctx.strokeStyle = darken(st, 0.45); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(gx, cy - 18); ctx.lineTo(ex, cy - 18); ctx.stroke();
    for (let i = 0; i <= 3; i++) { const px = gx + (ex - gx) * i / 3; ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(px, cy - 18); ctx.stroke(); }
    gal.push({ x: (ex + gx) / 2, y: cy });
  }
  lit(ctx, () => rr(ctx, x - R - 20, y, 2 * R + 40, 14, 3), darken(st, 0.1), 40, { shade: 0.2 });
  ctx.restore();
  return { arc: { cx: x, cy, r, a0: Math.PI, a1: TAU }, gallery: gal, floorY: y, box: { x: x - R - 20, y: cy - R, w: 2 * R + 40, h: hW + R + 14 } };
}

/**
 * drawBalloon(ctx, c, o) -> { centre, knot, box }
 *   A rubber balloon on a string, shiny; burst > 0 shows it popping: a flash and rubber
 *   shreds flying out, the string dropping. o: { x, y (balloon centre), r = 40, tone = 6,
 *   burst = 0 (0..1 time since the pop, scaled), string = 2.2 (length in r) }
 */
export function drawBalloon(ctx, c, o = {}) {
  const x = o.x ?? 340, y = o.y ?? 200, r = o.r ?? 40, col = toneOf(c, o.tone, 6), b = c01(o.burst ?? 0);
  const ky = y + r * 1.12 + b * r * 1.6, sl = r * (o.string ?? 2.2);
  ctx.save(); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, ky + 4); for (let i = 1; i <= 12; i++) { const u = i / 12; ctx.lineTo(x + Math.sin(u * 7 + b * 3) * 4, ky + 4 + u * sl); }
  ctx.strokeStyle = darken(c.labelMuted, 0.25); ctx.lineWidth = 1.6; ctx.stroke();
  if (b <= 0.001) {
    const bl = () => { ctx.beginPath(); ctx.moveTo(x, y + r * 1.12); ctx.bezierCurveTo(x - r * 1.35, y + r * 0.6, x - r * 1.1, y - r * 1.05, x, y - r * 1.05); ctx.bezierCurveTo(x + r * 1.1, y - r * 1.05, x + r * 1.35, y + r * 0.6, x, y + r * 1.12); ctx.closePath(); };
    lit(ctx, bl, col, r * 2, { shade: 0.24 });
    ellipse(ctx, x - r * 0.38, y - r * 0.45, r * 0.18, r * 0.3, 0.5); ctx.fillStyle = alpha(lighten(col, 0.8), 0.85); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.12, y - r * 0.82, r * 0.06, 0, TAU); ctx.fill();
  } else {
    if (b < 0.6) {
      const k = 1 - b / 0.6;
      glow(ctx, x, y, r * (1.6 + b * 2), c.warning, k);
      star(ctx, x, y, r * (0.9 + b * 1.4), 9, 0.45, 0.2); ctx.fillStyle = alpha(lighten(c.warning, 0.6), k); ctx.fill();
    }
    const rnd = lcg(808), fade = 1 - Math.max(0, (b - 0.7) / 0.3);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU + rnd() * 0.5, d = r * (0.4 + b * (1.4 + rnd() * 0.8)), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d + b * b * r * 0.8, L = r * (0.25 + rnd() * 0.25);
      ctx.save(); ctx.translate(px, py); ctx.rotate(a + b * 4 * (rnd() - 0.5)); ctx.globalAlpha = fade;
      lit(ctx, () => { ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(0, -L * 0.6, L, 0); ctx.quadraticCurveTo(0, -L * 0.2, -L, 0); ctx.closePath(); }, col, L, { rimW: 1.4 });
      ctx.restore();
    }
  }
  lit(ctx, () => { ctx.beginPath(); ctx.moveTo(x - 5, ky + 5); ctx.lineTo(x, ky - 2); ctx.lineTo(x + 5, ky + 5); ctx.closePath(); }, darken(col, 0.1), 8, { rimW: 1.4 });
  ctx.restore();
  return { centre: { x, y }, knot: { x, y: ky }, box: { x: x - r * 1.2, y: y - r * 1.1, w: r * 2.4, h: r * 2.3 + sl } };
}
