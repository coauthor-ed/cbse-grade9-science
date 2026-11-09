// EchoCliffScene-gap.js - slide "The 0.1 s Rule" (blk-l06-s02, explain, 2 beats, poeRecapStep 0).
// Rebuilt 2026-11-03 (whole file).
// b0 the same two panels as the predict slide. The student claps once in both. Sound in air is 340 m/s and
// one slow-motion clock runs both panels (SLOW screen seconds per real second). Room: walls 2 m away, so the
// clap is back in 4 m / 340 m/s = 0.012 s: the return arcs are at the ear before the clap arcs fade (they mix).
// Field: the cliff is 170 m away, so the return comes 340 m / 340 m/s = 1.0 s later. Under each panel a time
// line on ONE scale (0..1.2 s): the room's two ticks (0 and 0.012 s) are 5 px apart and merge into one blob;
// the field's are 0 and 1.0 s, tag "echo". The field student turns surprised when the echo arrives.
// b1 one large time ruler 0..1.2 s, the band 0..0.1 s shaded (heard as one); the room's two ticks inside the
// band, the cliff's two ticks 1 s apart, far outside it.
// People: SimFigure, ONE fixed stand pose, autoReach off; only the hands move (eased clap).
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, font, alpha, lighten, darken, mix, rr, drawShadow, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs, drawOutAndBack } from 'simulations/base/kit/SimWave.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';

const V_AIR = 340, SLOW = 2.5;                         // screen seconds per real second (one clock, both panels)
const ROOM_M = 2, CLIFF_M = 170;
const GAP_ROOM = 2 * ROOM_M / V_AIR, GAP_CLIFF = 2 * CLIFF_M / V_AIR;   // 0.0118 s and 1.0 s
const T0 = 0.9;                                         // the clap (screen s)
const ROOM_Y = 4, FIELD_Y = 262, FX0 = 24, FX1 = 656;
// b0 pictures are drawn at PS about (340, panel top) so both panels and their time lines fit HEIGHT 520 (the
// phone then shows the scene full width); text inside a picture is drawn at 26 / PS so it lands at 26
const PS = 0.84, PX = 340;
const PXM = 66, RCX = 340;                              // room scale and the student's x in the room
const TL0 = 60, TL1 = 620, TLS = 1.2;                   // b0 time lines: 0..1.2 s
const TLR = 220, TLF = 478;                             // their baselines
const RX0 = 150, RX1 = 640, RY = 430;                   // b1 ruler
const ramp = (a, t0, d) => Math.max(0, Math.min(1, (a - t0) / d));
const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export class EchoCliffSceneGap extends SimScene {
  static HEIGHT = 520;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'Two panels. In a small room, with the walls 2 metres away, a student claps once; the sound comes '
    + 'back from the wall in about 0.01 seconds, and on the time line below the clap and the return merge into one '
    + 'mark. In an open field a student claps once; the sound travels to a far cliff and back, and returns about '
    + '1 second later; the time line shows two marks 1 second apart, the second tagged echo. Then one time ruler '
    + 'from 0 to 1.2 seconds with the band up to 0.1 seconds shaded as one sound: the room\'s two marks sit inside '
    + 'the band, the cliff\'s two marks are far apart outside it, two sounds.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.stage === 0 ? this.t() < T0 + TLS * SLOW + 0.6 : this.t() < 3.0; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    if (this.stage >= 1) this.ruler(ctx, c);
    else this.panels(ctx, c);
  }

  // ---- b0 ------------------------------------------------------------------------------------------------
  panels(ctx, c) {
    const a = this.t(), real = Math.min(TLS, Math.max(0, (a - T0) / SLOW));   // real seconds since the clap (to 1.2 s)
    const out = { real: +real.toFixed(3) };
    // room
    const pic = (oy) => { ctx.save(); ctx.translate(PX, oy); ctx.scale(PS, PS); ctx.translate(-PX, -oy); };
    pic(ROOM_Y);
    this.room(ctx, c, ROOM_Y);
    const fr = this.clapper(ctx, c, RCX, ROOM_Y + 204, 100, a, 1);
    const roomBack = real >= GAP_ROOM && a > T0;
    if (a > T0) {
      const k = 1 - ramp(a, T0 + 0.25, 0.7);
      if (k > 0) {
        ctx.save(); rr(ctx, RCX - 132, ROOM_Y + 30, 264, 174, 4); ctx.clip();
        drawSoundArcs(ctx, c, { x: fr.clap.x, y: fr.clap.y, dir: 0, spread: 1.6, n: 3, wavelength: 26, t: a - T0, r0: 14, strength: k });
        if (roomBack) drawSoundArcs(ctx, c, { x: fr.ear.x, y: fr.ear.y, dir: 0, spread: 1.4, n: 3, wavelength: 26, t: a - T0, r0: 16, reverse: true, strength: k * 0.85, tone: 2 });
        ctx.restore();
      }
    }
    ctx.restore();
    this.timeLine(ctx, c, TLR, real, a > T0, GAP_ROOM, { gapTag: '0.01 s' });
    // field
    pic(FIELD_Y);
    this.field(ctx, c, FIELD_Y);
    const G = FIELD_Y + 222;
    const back = a > T0 && real >= GAP_CLIFF;
    const ff = this.clapper(ctx, c, 92, G, 96, a, 2, back ? 'oops' : 'smile');
    const b = { x: this.cliffFaceX(ff.mouth.y), y: ff.mouth.y };
    const dist = b.x - ff.mouth.x, v = dist / (GAP_CLIFF / 2 * SLOW);
    if (a > T0) {
      const k = 1 - ramp(a, T0 + 0.25, 0.7);
      if (k > 0) drawSoundArcs(ctx, c, { x: ff.clap.x, y: ff.clap.y, dir: 0, spread: 1.4, n: 2, wavelength: 22, t: a - T0, r0: 10, strength: k });
    }
    const st = drawOutAndBack(ctx, c, { a: ff.mouth, b, v, t: a, start: T0, path: a > T0, R: 22 });
    if (back) {
      const k = 1 - 0.5 * ramp(a, T0 + GAP_CLIFF * SLOW + 0.6, 0.8);   // the heard echo stays marked at rest
      drawSoundArcs(ctx, c, { x: ff.ear.x + 4, y: ff.ear.y, dir: 0, spread: 1.2, n: 3, wavelength: 18, t: Math.min(a, T0 + GAP_CLIFF * SLOW + 1.4), r0: 14, reverse: true, strength: k, tone: 2 });
      this.earGlow(ctx, c, ff.ear, 1);
    }
    ctx.restore();
    this.timeLine(ctx, c, TLF, real, a > T0, GAP_CLIFF, { echo: true });
    out.leg = st.leg; out.cliffPx = Math.round(dist); out.v = Math.round(v); out.roomBack = roomBack; out.cliffBack = back;
    out.knees = ff.sk.anchors.knee.map((p) => [+p.x.toFixed(2), +p.y.toFixed(2)]);
    out.hip = [+ff.sk.anchors.hip.x.toFixed(2), +ff.sk.anchors.hip.y.toFixed(2)];
    out.kneesRoom = fr.sk.anchors.knee.map((p) => [+p.x.toFixed(2), +p.y.toFixed(2)]);
    this.probeOut = out;
  }

  /** A student in ONE fixed stand pose (autoReach off). Only the hands move: apart, then meeting at T0 (eased
   *  0.4 s), then held together. Returns the clap point, mouth and ear anchors and the solved skeleton. */
  clapper(ctx, c, x, y, h, a, i, mood = 'smile') {
    const k = inOutSine(ramp(a, T0 - 0.4, 0.4));
    const sh = { x: x + h * 0.02, y: y - h * 0.74 };          // shoulder height of a stand pose, fixed per figure
    const M = { x: sh.x + h * 0.26, y: sh.y + h * 0.13 };
    const near = { x: M.x + (1 - k) * -h * 0.05, y: M.y + (1 - k) * h * 0.13 };
    const far = { x: M.x + h * 0.02 + (1 - k) * h * 0.03, y: M.y - (1 - k) * h * 0.09 };
    const spec = figureFor(this, { role: 'student', pose: 'stand', x, y, height: h, facing: 1, i, mood, autoReach: false, hands: [near, far] });
    const sk = drawFigure(ctx, c, spec, spec.look);
    const hd = sk.anchors.head;
    if (k > 0.97 && a < T0 + 0.35) {                          // the meeting: a short bright clap mark
      const u = ramp(a, T0, 0.35);
      ctx.save(); ctx.strokeStyle = alpha(c.gold, 1 - u); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let j = -1; j <= 1; j++) {
        const an = -0.5 + j * 0.55, r0 = h * 0.07 + u * 8;
        ctx.beginPath(); ctx.moveTo(M.x + Math.cos(an) * r0, M.y + Math.sin(an) * r0);
        ctx.lineTo(M.x + Math.cos(an) * (r0 + 10), M.y + Math.sin(an) * (r0 + 10)); ctx.stroke();
      }
      ctx.restore();
    }
    return { sk, clap: { x: M.x + 4, y: M.y }, mouth: { x: hd.x + hd.r * 0.95, y: hd.y + hd.r * 0.3 }, ear: { x: hd.x - hd.r * 0.1, y: hd.y } };
  }

  earGlow(ctx, c, p, k) {
    const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 9);
    g.addColorStop(0, alpha(c.s2, 0.35 * k)); g.addColorStop(1, alpha(c.s2, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
  }

  /** One time line (0..1.2 s, the same scale for both panels). Clap tick at 0 when it happens, return tick at
   *  gap once real time passes it; a small cursor rides real time. */
  timeLine(ctx, c, y, real, on, gap, o = {}) {
    const X = (s) => TL0 + (TL1 - TL0) * s / TLS;
    ctx.save();
    ctx.strokeStyle = alpha(c.label, 0.55); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(TL0, y); ctx.lineTo(TL1, y); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = alpha(c.label, 0.35);
    for (let s = 0.1; s < TLS + 1e-6; s += 0.1) { ctx.beginPath(); ctx.moveTo(X(s), y); ctx.lineTo(X(s), y + (Math.abs(s - 0.5) < 1e-6 || Math.abs(s - 1) < 1e-6 ? 9 : 5)); ctx.stroke(); }
    ctx.restore();
    if (!on) return;
    const cur = Math.min(real, TLS);
    ctx.save(); ctx.fillStyle = alpha(c.label, 0.35); ctx.fillRect(TL0, y - 2, X(cur) - TL0, 4); ctx.restore();
    this.spike(ctx, c, X(0), y, 26, 1, 1);
    if (real >= gap) this.spike(ctx, c, X(gap), y, 26, 2, ramp(real, gap, 0.15 / SLOW));
    if (o.gapTag && real >= gap) pill(ctx, c, o.gapTag, X(gap) + 22, y - 14, { bg: c.raised, size: 26, display: true, align: 'left' });
    if (o.echo) {
      ctx.save(); ctx.font = font(c, 700, 26, true); ctx.fillStyle = c.labelMuted; ctx.textAlign = 'center';
      ctx.fillText('0', X(0), y + 34); if (real >= gap) ctx.fillText('1 s', X(gap), y + 34); ctx.restore();
      if (real >= gap) pill(ctx, c, 'echo', X(gap) + 24, y - 16, { bg: c.s2, size: 26, display: true, align: 'left' });
    }
  }

  /** A sound mark on a time line: a rounded pulse, tone 1 for the clap, tone 2 for the return. */
  spike(ctx, c, x, y, h, tone, k = 1) {
    if (k <= 0) return;
    const col = c['s' + tone], w = 7;
    ctx.save(); ctx.globalAlpha *= Math.min(1, k);
    const g = ctx.createLinearGradient(0, y - h, 0, y);
    g.addColorStop(0, lighten(col, 0.25)); g.addColorStop(1, col);
    ctx.fillStyle = tone === 2 ? alpha(col, 0.8) : g;
    ctx.beginPath(); ctx.moveTo(x - w * 1.6, y);
    ctx.bezierCurveTo(x - w * 0.6, y, x - w * 0.7, y - h * k, x, y - h * k);
    ctx.bezierCurveTo(x + w * 0.7, y - h * k, x + w * 0.6, y, x + w * 1.6, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = darken(col, 0.25); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
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
    this.dim(ctx, c, RCX, R, FL + 9, '2 m', Math.ceil(26 / PS));
  }

  /** A dimension line from x1 to x2 at y with the tag in a gap at its middle. */
  dim(ctx, c, x1, x2, y, text, size = 26) {
    const mid = (x1 + x2) / 2, gap = 30;
    ctx.save(); ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1 + 2, y); ctx.lineTo(mid - gap, y); ctx.moveTo(mid + gap, y); ctx.lineTo(x2 - 2, y); ctx.stroke();
    for (const [x, s] of [[x1, -1], [x2, 1]]) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * 10, y - 5); ctx.lineTo(x - s * 10, y + 5); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    pill(ctx, c, text, mid, y, { bg: c.raised, size, display: true });
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

  // ---- b1 ------------------------------------------------------------------------------------------------
  ruler(ctx, c) {
    const a = this.t(), X = (s) => RX0 + (RX1 - RX0) * s / TLS;
    const band = ramp(a, 0.2, 0.6), rows = [{ name: 'room', y: 214, gap: GAP_ROOM, at: 0.9 }, { name: 'cliff', y: 344, gap: GAP_CLIFF, at: 1.5 }];
    // the band 0..0.1 s: heard as one
    const bx = X(0.1 * band);
    ctx.save();
    ctx.fillStyle = alpha(c.s5, 0.22); ctx.fillRect(RX0 - 14, 120, bx - RX0 + 14, RY - 120);
    if (a > 2.3) { ctx.fillStyle = alpha(c.s2, 0.08 * ramp(a, 2.3, 0.4)); ctx.fillRect(bx, 120, RX1 + 14 - bx, RY - 120); }
    ctx.strokeStyle = c.s5; ctx.lineWidth = 3; ctx.setLineDash([7, 6]);
    if (band > 0) { ctx.beginPath(); ctx.moveTo(bx, 104); ctx.lineTo(bx, RY + 4); ctx.stroke(); }
    ctx.restore();
    // the ruler: 0..1.2 s, a tick per 0.1 s
    ctx.save();
    const rg = ctx.createLinearGradient(0, RY, 0, RY + 30);
    rg.addColorStop(0, lighten(c.gold, 0.45)); rg.addColorStop(1, darken(c.gold, 0.1));
    ctx.fillStyle = rg; rr(ctx, RX0 - 14, RY, RX1 - RX0 + 28, 30, 5); ctx.fill();
    ctx.strokeStyle = darken(c.gold, 0.35); ctx.lineWidth = 2; rr(ctx, RX0 - 14, RY, RX1 - RX0 + 28, 30, 5); ctx.stroke();
    ctx.lineWidth = 1.8;
    for (let i = 0; i <= 12; i++) {
      const x = X(i / 10), l = i % 5 === 0 ? 18 : 10;
      ctx.beginPath(); ctx.moveTo(x, RY); ctx.lineTo(x, RY + l); ctx.stroke();
    }
    ctx.font = font(c, 700, 26, true); ctx.fillStyle = c.label; ctx.textAlign = 'center';
    ctx.fillText('0', X(0), RY + 60); ctx.fillText('0.5', X(0.5), RY + 60); ctx.fillText('1 s', X(1), RY + 60);
    ctx.restore();
    if (band >= 1) pill(ctx, c, '0.1 s', X(0.1) + 2, RY + 52, { bg: c.s5, size: 26, display: true, align: 'left' });
    // the two rows: the clap at 0, the return at the gap
    const out = { band, rows: [] };
    for (const r of rows) {
      const k = ramp(a, r.at, 0.4);
      ctx.save(); ctx.strokeStyle = alpha(c.label, 0.4); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(RX0 - 6, r.y); ctx.lineTo(RX1, r.y); ctx.stroke(); ctx.restore();
      pill(ctx, c, r.name, 20, r.y - 22, { bg: c.raised, size: 26, display: true, align: 'left' });
      if (k > 0) {
        this.spike(ctx, c, X(0), r.y, 78, 1, k);
        this.spike(ctx, c, X(r.gap), r.y, 78, 2, k);
      }
      out.rows.push({ name: r.name, x0: Math.round(X(0)), x1: +X(r.gap).toFixed(1), inBand: r.gap < 0.1 });
    }
    if (ramp(a, 1.3, 0.3) > 0) pill(ctx, c, '0.01 s', X(0) + 50, rows[0].y - 70, { bg: c.raised, size: 26, display: true, align: 'left' });
    if (ramp(a, 1.9, 0.3) > 0) this.dim(ctx, c, X(0) + 14, X(1) - 14, rows[1].y - 82, '1 s');
    if (a > 2.3) {
      pill(ctx, c, 'one sound', RX0 - 14, 76, { bg: c.s5, size: 26, display: true, align: 'left' });
      pill(ctx, c, 'two sounds', X(0.82), 76, { bg: c.s2, size: 26, display: true });
    }
    this.probeOut = out;
  }
}
