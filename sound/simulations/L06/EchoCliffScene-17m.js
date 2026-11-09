// EchoCliffScene-17m.js - slide "At Least 17 m" (blk-l06-s04, 2 beats). New 2026-11-03.
// Scale: 17 m of ground = 490 px (PXM 28.8 px/m). Sound in air 340 m/s; slow motion SLOW = 30 screen seconds
// per real second, so the on-screen pulse speed is PXM * 340 / 30 and the trip of 34 m takes 3.0 s on screen.
// b0 the student claps; one pulse goes out to the wall and back (drawOutAndBack) while the stopwatch shows the
// real elapsed time (screen time / SLOW): it reads 0.10 s exactly as the pulse is back. A hairpin bracket
// round the out-and-back path carries "34 m". Tag "slow motion" once.
// b1 the wall at 17 m ("17 m" dimension); a nearer wall at 8 m ghosted. Two pulses leave together: the 8 m
// one is back at 16 m / 340 m/s = 0.047 s (inside 0.1 s: "no echo"), the 17 m one at 0.10 s ("echo").
// One line: 34 m / 2 = 17 m.
// People: SimFigure, ONE fixed stand pose, autoReach off; only the hands move (eased clap).
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, alpha, lighten, darken, mix, rr, drawShadow, inOutSine } from 'simulations/base/kit/SimLook.js';
import { drawSoundArcs, drawOutAndBack, outAndBack } from 'simulations/base/kit/SimWave.js';
import { drawStopwatch } from 'simulations/base/kit/SimApparatus.js';
import { figureFor, drawFigure } from 'simulations/base/kit/SimFigure.js';

const V_AIR = 340, SLOW = 30, T0 = 0.9;
const GY = 470, PX = 96, FH = 124;                     // ground, the student, figure height
const MX0 = 116, PXM = 490 / 17;                       // distances are measured from x = MX0 (the student's front)
const WALL17 = MX0 + 17 * PXM, WALL8 = MX0 + 8 * PXM;
const VS = PXM * V_AIR / SLOW;                         // on-screen pulse speed, px/s
const WTOP = 140, WW = 58;
const ramp = (a, t0, d) => Math.max(0, Math.min(1, (a - t0) / d));
const hash = (i) => { const s = Math.sin(i * 91.7 + 17.3) * 43758.5453; return s - Math.floor(s); };
const DIV = '\u00f7';

export class EchoCliffScene17m extends SimScene {
  static HEIGHT = 560;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }]];
  static ARIA_LABEL = 'In slow motion, a student claps once and the sound travels to a wall and back while a '
    + 'stopwatch runs. The stopwatch reads 0.10 seconds just as the sound gets back. The path out and back is '
    + 'marked 34 metres. Then the wall stands at 17 metres, and a nearer wall at 8 metres is shown faintly: '
    + 'sound from the nearer wall is back in less than 0.1 seconds, no echo; sound from the 17 metre wall is back '
    + 'at 0.1 seconds, an echo. 34 metres divided by 2 is 17 metres.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() { return this.t() < T0 + 0.1 * SLOW + 0.8; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    this.ground(ctx, c);
    const a = this.t(), real = Math.min(0.1, Math.max(0, (a - T0) / SLOW));
    const two = this.stage >= 1;
    if (two) this.wall(ctx, c, WALL8, 0.38);
    this.wall(ctx, c, WALL17, 1);
    const fg = this.clapper(ctx, c, PX, GY, FH, a);
    const out = { real: +real.toFixed(4), knees: fg.sk.anchors.knee.map((p) => [+p.x.toFixed(2), +p.y.toFixed(2)]),
      hip: [+fg.sk.anchors.hip.x.toFixed(2), +fg.sk.anchors.hip.y.toFixed(2)] };
    if (a > T0) {
      const k = 1 - ramp(a, T0 + 0.25, 0.7);
      if (k > 0) drawSoundArcs(ctx, c, { x: fg.clap.x, y: fg.clap.y, dir: 0, spread: 1.4, n: 2, wavelength: 22, t: a - T0, r0: 10, strength: k });
    }
    const mouth = { x: MX0, y: fg.mouth.y };             // the pulse leaves just in front of the face, where 0 m is
    if (!two) {
      this.hairpin(ctx, c, MX0 + 12, WALL17 - 10, mouth.y - 46, mouth.y + 46, ramp(a, 0.2, 0.6));
      const st = drawOutAndBack(ctx, c, { a: mouth, b: { x: WALL17, y: mouth.y }, v: VS, t: a, start: T0, path: false, R: 24 });
      out.leg = st.leg; out.tTotal = +st.tTotal.toFixed(3);
      this.watch(ctx, c, 340, 112, real);
      pill(ctx, c, 'slow motion', 530, 72, { bg: c.raised, size: 26, display: true });
      if (st.leg === 'done') this.ear(ctx, c, fg, a - (T0 + st.tTotal));
    } else {
      const lanes = [
        { b: { x: WALL8, y: mouth.y - 48 }, tag: 'no echo', bg: c.raised, ghost: true },
        { b: { x: WALL17, y: mouth.y }, tag: 'echo', bg: c.s2, ghost: false },
      ];
      out.returns = [];
      for (const L of lanes) {
        const st = outAndBack({ a: mouth, b: L.b, v: VS, start: T0 }, a);
        ctx.save(); if (L.ghost) ctx.globalAlpha *= 0.6;
        drawOutAndBack(ctx, c, { a: mouth, b: L.b, v: VS, t: a, start: T0, path: true, R: 22 });
        ctx.restore();
        const back = (st.tTotal / SLOW);
        out.returns.push(+back.toFixed(3));
        if (st.leg === 'done') {
          pill(ctx, c, L.tag, L.b.x - (L.ghost ? 0 : 6), WTOP - 34, { bg: L.bg, size: 26, display: true });
          pill(ctx, c, back.toFixed(2) + ' s', L.b.x - 74, L.b.y - 30, { bg: c.raised, size: 26, display: true });
        }
      }
      if (real >= 0.1 - 1e-9) this.ear(ctx, c, fg, a - (T0 + 0.1 * SLOW));
      this.dim(ctx, c, MX0, WALL8, GY + 30, '8 m', 0.6);
      this.dim(ctx, c, MX0, WALL17, GY + 70, '17 m', 1);
      pill(ctx, c, '34 m ' + DIV + ' 2 = 17 m', 340, 44, { bg: c.s5, size: 30, display: true });
    }
    this.probeOut = out;
  }

  /** Real elapsed time on a stopwatch: one hand turn = 0.2 s, so 0.1 s is half a turn. */
  watch(ctx, c, x, y, real) {
    drawStopwatch(ctx, c, { x, y, r: 60, seconds: real, dialSeconds: 0.2, text: real.toFixed(2) + ' s', readout: 'below', size: 30 });
  }

  /** The returned sound reaching the student: arcs arriving at the ear (held at rest), a soft glow. */
  ear(ctx, c, fg, since) {
    const p = fg.ear, k = 1 - 0.5 * ramp(since, 0.6, 0.8);
    drawSoundArcs(ctx, c, { x: p.x + 4, y: p.y, dir: 0, spread: 1.2, n: 3, wavelength: 18, t: Math.min(since, 1.4), r0: 14, reverse: true, strength: k, tone: 2 });
    const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 9);
    g.addColorStop(0, alpha(c.s2, 0.35)); g.addColorStop(1, alpha(c.s2, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
  }

  /** The out-and-back path as one hairpin: out along y1 to the wall, round, back along y2, arrowhead at the
   *  student; "34 m" on the out leg. */
  hairpin(ctx, c, x1, x2, y1, y2, k) {
    if (k <= 0) return;
    const r = (y2 - y1) / 2, mid = (x1 + x2) / 2, gap = 44;
    ctx.save(); ctx.globalAlpha *= k; ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(mid - gap, y1); ctx.moveTo(mid + gap, y1); ctx.lineTo(x2 - r, y1);
    ctx.arc(x2 - r, y1 + r, r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x1 + 6, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y2); ctx.lineTo(x1 + 11, y2 - 6); ctx.lineTo(x1 + 11, y2 + 6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x1, y1, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (k >= 1) pill(ctx, c, '34 m', mid, y1, { bg: c.raised, size: 30, display: true });
  }

  /** A dimension line from x1 to x2 at y with the tag in a gap at its middle. */
  dim(ctx, c, x1, x2, y, text, k) {
    const mid = (x1 + x2) / 2, gap = 36;
    ctx.save(); ctx.globalAlpha *= k; ctx.strokeStyle = c.label; ctx.fillStyle = c.label; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1 + 2, y); ctx.lineTo(mid - gap, y); ctx.moveTo(mid + gap, y); ctx.lineTo(x2 - 2, y);
    ctx.moveTo(x1, y - 9); ctx.lineTo(x1, y + 9); ctx.moveTo(x2, y - 9); ctx.lineTo(x2, y + 9); ctx.stroke();
    for (const [x, s] of [[x1, -1], [x2, 1]]) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * 10, y - 5); ctx.lineTo(x - s * 10, y + 5); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= Math.max(k, 0.8);
    pill(ctx, c, text, mid, y, { bg: c.raised, size: 26, display: true });
    ctx.restore();
  }

  /** Open ground: a lit grass edge, a soil band, tufts. */
  ground(ctx, c) {
    const g = ctx.createLinearGradient(0, GY - 6, 0, 560);
    g.addColorStop(0, mix(c.good, c.bgSurface, 0.15)); g.addColorStop(0.25, mix(c.good, c.bgSurface, 0.3)); g.addColorStop(1, darken(mix(c.good, c.gold, 0.4), 0.12));
    ctx.fillStyle = g; ctx.fillRect(0, GY - 6, 680, 100);
    ctx.fillStyle = alpha(lighten(c.good, 0.4), 0.6); ctx.fillRect(0, GY - 6, 680, 2.5);
    ctx.strokeStyle = alpha(darken(c.good, 0.3), 0.6); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (let i = 0; i < 40; i++) {
      const x = 8 + hash(i) * 664, y = GY - 3 + hash(i + 50) * 6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 7); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 8); ctx.stroke();
    }
  }

  /** A tall brick wall from the side, its reflecting face at x (lit), staggered courses, a stone cap, shade
   *  on the far side. k < 1 draws it ghosted (a position the wall could have, dashed outline). */
  wall(ctx, c, x, k) {
    const brick = mix(c.flame, c.stroke, 0.3), mortar = mix(c.bgSurface, c.stroke, 0.25), top = WTOP, bot = GY;
    ctx.save(); ctx.globalAlpha *= k;
    if (k >= 1) drawShadow(ctx, c, x + WW / 2, bot, WW, 7, 0.6);
    ctx.fillStyle = mortar; ctx.fillRect(x, top, WW, bot - top);
    const ch = 22, bw = 30;
    for (let row = 0, y = top + 12; y < bot - 2; row++, y += ch) {
      const off = row % 2 ? bw / 2 : 0;
      for (let bx = x - off; bx < x + WW; bx += bw) {
        const x0 = Math.max(x + 2, bx + 2), x1 = Math.min(x + WW - 2, bx + bw - 2);
        if (x1 - x0 < 4) continue;
        const v = hash(row * 7 + Math.round(bx)) * 0.14 - 0.07;
        ctx.fillStyle = v > 0 ? lighten(brick, v) : darken(brick, -v);
        rr(ctx, x0, y + 2, x1 - x0, Math.min(ch - 4, bot - y - 3), 2); ctx.fill();
        ctx.fillStyle = alpha(lighten(brick, 0.4), 0.45); ctx.fillRect(x0 + 1, y + 2.5, x1 - x0 - 2, 2);
      }
    }
    const sh = ctx.createLinearGradient(x, 0, x + WW, 0);
    sh.addColorStop(0, alpha(c.bgSurface, 0.12)); sh.addColorStop(0.3, alpha(c.bgSurface, 0)); sh.addColorStop(1, alpha(darken(brick, 0.6), 0.35));
    ctx.fillStyle = sh; ctx.fillRect(x, top, WW, bot - top);
    ctx.fillStyle = mix(c.stroke, c.bgSurface, 0.45); rr(ctx, x - 5, top - 4, WW + 10, 15, 3); ctx.fill();
    ctx.strokeStyle = lighten(brick, 0.35); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 1, top + 11); ctx.lineTo(x + 1, bot); ctx.stroke();
    ctx.restore();
    if (k < 1) {
      ctx.save(); ctx.strokeStyle = alpha(c.label, 0.6); ctx.lineWidth = 2; ctx.setLineDash([7, 6]);
      ctx.strokeRect(x - 1, top - 5, WW + 2, bot - top + 5); ctx.restore();
    }
  }

  /** A student in ONE fixed stand pose (autoReach off). Only the hands move: apart, then meeting at T0 (eased
   *  0.4 s), then held together. */
  clapper(ctx, c, x, y, h, a) {
    const k = inOutSine(ramp(a, T0 - 0.4, 0.4));
    const sh = { x: x + h * 0.02, y: y - h * 0.74 };
    const M = { x: sh.x + h * 0.26, y: sh.y + h * 0.13 };
    const near = { x: M.x + (1 - k) * -h * 0.05, y: M.y + (1 - k) * h * 0.13 };
    const far = { x: M.x + h * 0.02 + (1 - k) * h * 0.03, y: M.y - (1 - k) * h * 0.09 };
    const spec = figureFor(this, { role: 'student', pose: 'stand', x, y, height: h, facing: 1, i: 3, mood: 'smile', autoReach: false, hands: [near, far] });
    const sk = drawFigure(ctx, c, spec, spec.look);
    const hd = sk.anchors.head;
    if (k > 0.97 && a < T0 + 0.35) {
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
}
