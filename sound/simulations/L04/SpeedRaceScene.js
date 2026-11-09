// SpeedRaceScene.js - slide "Solids, Liquids, Gases" (blk-l04-s07, 3 beats). Rebuilt 2026-11-03 (whole file).
// One hammer knock on a steel post that touches the left end of every track. Each track is its own SimWave
// field with ONE pulse (a single compression) and its own speed, scaled from the real ones (0.25 px/s per m/s):
// steel 5000, water 1500, air 340. A pulse's place is origin + v (t - knock) by the field, never moved by hand.
// A pulse that reaches the far end stays there (its field time is held at its own arrival time).
// b0 the race, frozen the moment steel arrives (badge 1): water is then 30 per cent of the way, air 7 per cent,
//    so the gaps show the speeds 5000 : 1500 : 340 and the three pulses are never level at rest.
// b1 the same frozen race on shorter tracks, and the three speeds.
// b2 two air tracks, 0 degC and 22 degC (331 : 344 m/s), frozen the moment the warm pulse arrives; a red caret
// under each compression shows the warm one is ahead.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawBackdrop, pill, font, alpha, lighten, darken, mix, rr, inkOn } from 'simulations/base/kit/SimLook.js';
import { pulseSource, waveField, drawParticleStrip } from 'simulations/base/kit/SimWave.js';
import { drawThermometer } from '../shared/SoundArt.js';

const SCALE = 0.25;                                // px/s on screen per m/s
const POST = { x: 96, w: 16 };
const OX = POST.x + POST.w;                        // every track starts at the post
const KNOCK = 0.6, PULSE_W = 96, AMP = 22, WARM_SCALE = 0.45;   // b2 runs faster: same ratio, shorter wait
const MEDIA = [
  { name: 'steel', v: 5000, sp: 10, r: 3.2, kind: 'steel' },
  { name: 'water', v: 1500, sp: 11, r: 3.4, kind: 'water' },
  { name: 'air', v: 340, sp: 14, r: 3.6, kind: 'air' },
];
const fieldFor = (vms, k = SCALE) => {
  const v = vms * k;
  return waveField({ v, origin: OX, source: pulseSource({ amp: AMP, dur: PULSE_W / v, at: KNOCK }) });
};
/** The time a pulse's front reaches x1 (it is held there from then on). */
const arrival = (vms, x1, k = SCALE) => KNOCK + (x1 - 4 - OX) / (vms * k);

export class SpeedRaceScene extends SimScene {
  static HEIGHT = 560;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A hammer knocks a steel post at the left end of three tracks: a steel bar, a water channel and '
    + 'a strip of air. One compression races along each. The pulse in steel reaches the far end first, then the one '
    + 'in water, and the one in air arrives last. Then the race is shown stopped when the water pulse arrives, with '
    + 'the speeds 5000, 1500 and 340 metres per second. Last, two air tracks at 0 and 22 degrees Celsius: the pulse '
    + 'in the warmer air, 344 metres per second, is slightly ahead of the one at 331 metres per second.';

  constructor(container, config) {
    super(container, config);
    this.probeOut = null;
  }

  /** Scene time in seconds (one method, so a probe can pin a frame). */
  t() { return this.age; }

  busy() {
    const a = this.t();
    if (this.stage === 0) return a < arrival(5000, 630) + 0.6;
    if (this.stage === 1) return a < arrival(5000, 470) + 1.4;
    return a < arrival(344, 630, WARM_SCALE) + 0.4;
  }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'plain');
    if (this.stage === 1) this.board(ctx, c, 470, true);
    else if (this.stage >= 2) this.warm(ctx, c);
    else this.board(ctx, c, 630, false);
  }

  /** The three-medium race. x1 = far end; values = b1 (frozen when water arrives, speeds column). */
  board(ctx, c, x1, values) {
    const a = this.t();
    const ys = [138, 282, 426], hh = 72;
    const tStop = arrival(5000, x1);
    const t = Math.min(a, tStop);
    this.post(ctx, c, ys[0] - hh / 2 - 22, ys[2] + hh / 2 + 22, t);
    const out = [];
    MEDIA.forEach((m, i) => {
      const y = ys[i], F = fieldFor(m.v), tA = arrival(m.v, x1), ft = Math.min(t, tA);
      this.medium(ctx, c, m.kind, OX, x1, y - hh / 2, hh);
      this.denseBand(ctx, c, F, ft, x1, y - hh / 2 + 4, hh - 8);
      drawParticleStrip(ctx, c, { x: OX, y: y - hh / 2 + 8, w: x1 - OX, h: hh - 16, field: F, t: ft, spacing: m.sp, r: m.r,
        tube: false, densityShade: true });
      pill(ctx, c, m.name, OX + 6, y - hh / 2 - 22, { bg: c.raised, size: 26, display: true, align: 'left' });
      if (!values && t >= tA) this.badge(ctx, c, x1 + 22, y, i + 1, Math.min(1, (a - tA) / 0.3));
      // a C tag on the computed compression of each pulse, on the strip's bottom edge (track names sit on the top)
      const cs = F.regions(ft, 0, x1 - OX).filter((g) => g.kind === 'C');
      const k = cs.length ? cs[cs.length - 1] : null;
      if (k && ft > KNOCK + 0.02 && k.x > OX + 14) pill(ctx, c, 'C', Math.min(k.x, x1 - 22), y + hh / 2, { size: 26, display: true, bg: c.raised });
      if (values) {
        const u = Math.max(0, Math.min(1, (a - tStop - 0.2 - i * 0.35) / 0.35));
        if (u > 0) { ctx.save(); ctx.globalAlpha = u; pill(ctx, c, m.v + ' m/s', x1 + 96, y, { bg: c.raised, size: 30, display: true }); ctx.restore(); }
      }
      out.push({ name: m.name, front: Math.round(F.front(ft)), arrived: t >= tA });
    });
    this.hammer(ctx, c, ys[1], t, ys[0] - hh / 2 - 22);
    this.probeOut = { t: +t.toFixed(2), tracks: out };
  }

  /** b2: two air tracks, cold and warm, raced to the moment the warm pulse arrives. */
  warm(ctx, c) {
    const a = this.t(), x1 = 630, ys = [196, 382], hh = 72;
    const rows = [{ v: 331, tag: '331 m/s', temp: '0 \u00b0C', level: 0.2 }, { v: 344, tag: '344 m/s', temp: '22 \u00b0C', level: 0.62 }];
    const tStop = arrival(344, x1, WARM_SCALE), t = Math.min(a, tStop);
    this.post(ctx, c, ys[0] - hh / 2 - 22, ys[1] + hh / 2 + 22, t);
    const cx = [];
    rows.forEach((r, i) => {
      const y = ys[i], F = fieldFor(r.v, WARM_SCALE);
      this.medium(ctx, c, 'air', OX, x1, y - hh / 2, hh);
      drawParticleStrip(ctx, c, { x: OX, y: y - hh / 2 + 8, w: x1 - OX, h: hh - 16, field: F, t, spacing: 14, r: 3.6,
        tube: false, densityShade: true });
      drawThermometer(ctx, c, { x: OX + 16, y: y - hh / 2 - 14, s: 0.8, level: r.level, label: r.temp, size: 26 });
      pill(ctx, c, r.tag, OX + 128, y - hh / 2 - 24, { bg: c.raised, size: 26, display: true, align: 'left' });
      const reg = F.regions(t, 0, x1 - OX).filter((g) => g.kind === 'C');
      const k = reg.length ? reg[reg.length - 1] : null;
      if (k && t > KNOCK + 0.3) { this.caret(ctx, c, k.x, y + hh / 2 + 4); cx.push(k.x); }
    });
    if (a >= tStop && cx.length === 2) {
      ctx.save(); ctx.strokeStyle = alpha(c.s6, 0.6); ctx.lineWidth = 2.2; ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.moveTo(cx[1], ys[1] - hh / 2 - 4); ctx.lineTo(cx[1], ys[0] - hh / 2); ctx.stroke(); ctx.restore();
    }
    this.hammer(ctx, c, (ys[0] + ys[1]) / 2, t, ys[0] - hh / 2 - 22);
    this.probeOut = { t: +t.toFixed(2), compressions: cx.map(Math.round), lead: cx.length === 2 ? Math.round(cx[1] - cx[0]) : null };
  }

  /** A dark band under the dots wherever the field's density is above average (computed per column, never painted
   *  by hand), so the compression reads as a dense band and not only the pale rarefaction behind it. */
  denseBand(ctx, c, F, t, x1, y, h) {
    ctx.save(); ctx.fillStyle = darken(c.s1, 0.45);
    for (let x = OX; x < x1; x += 2) {
      const rho = F.rhoLin(x - OX, t);
      if (rho > 1.02) { ctx.globalAlpha = Math.min(0.62, (rho - 1) * 1.3); ctx.fillRect(x, y, 2, h); }
    }
    ctx.restore();
  }

  /** The body of one track: a shaded steel bar, a glass channel of water, or a glass tube of air. */
  medium(ctx, c, kind, x0, x1, y, h) {
    const w = x1 - x0;
    ctx.save();
    ctx.fillStyle = alpha(darken(c.stroke, 0.4), 0.14); rr(ctx, x0 + 3, y + 6, w, h, 6); ctx.fill();
    if (kind === 'steel') {
      const steel = mix(c.waste, c.bgSurface, 0.35);
      const gr = ctx.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, lighten(steel, 0.75)); gr.addColorStop(0.18, lighten(steel, 0.5));
      gr.addColorStop(0.55, lighten(steel, 0.3)); gr.addColorStop(1, darken(steel, 0.05));
      ctx.fillStyle = gr; rr(ctx, x0, y, w, h, 5); ctx.fill();
      ctx.strokeStyle = alpha(lighten(steel, 0.95), 0.9); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x0 + 4, y + 3); ctx.lineTo(x1 - 4, y + 3); ctx.stroke();
      ctx.strokeStyle = alpha(darken(steel, 0.3), 0.6); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 + 4, y + h - 3); ctx.lineTo(x1 - 4, y + h - 3); ctx.stroke();
      ctx.strokeStyle = darken(steel, 0.35); ctx.lineWidth = 2; rr(ctx, x0, y, w, h, 5); ctx.stroke();
      // the end face of the bar, a lighter bevel
      ctx.fillStyle = lighten(steel, 0.6); rr(ctx, x1 - 7, y + 2, 5, h - 4, 2); ctx.fill();
    } else if (kind === 'water') {
      const gr = ctx.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, alpha(lighten(c.water, 0.45), 0.55)); gr.addColorStop(1, alpha(c.water, 0.6));
      ctx.fillStyle = gr; rr(ctx, x0, y, w, h, 5); ctx.fill();
      ctx.strokeStyle = alpha(lighten(c.water, 0.7), 0.95); ctx.lineWidth = 2.5; ctx.beginPath();
      for (let x = x0 + 4; x <= x1 - 4; x += 4) { const yy = y + 4 + 1.6 * Math.sin(x * 0.11); if (x === x0 + 4) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke();
      ctx.strokeStyle = alpha(c.glass, 0.9); ctx.lineWidth = 3; rr(ctx, x0, y, w, h, 5); ctx.stroke();
      ctx.strokeStyle = alpha(darken(c.water, 0.3), 0.6); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 + 4, y + h - 2); ctx.lineTo(x1 - 4, y + h - 2); ctx.stroke();
    } else {
      ctx.fillStyle = alpha(lighten(c.glass, 0.6), 0.32); rr(ctx, x0, y, w, h, 5); ctx.fill();
      ctx.strokeStyle = alpha(lighten(c.glass, 0.85), 0.95); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x0 + 4, y + 4); ctx.lineTo(x1 - 4, y + 4); ctx.stroke();
      ctx.strokeStyle = alpha(darken(c.glass, 0.25), 0.85); ctx.lineWidth = 2.5; rr(ctx, x0, y, w, h, 5); ctx.stroke();
    }
    ctx.restore();
  }

  /** The steel post every track starts at: lit left face, shaded right, bolts top and bottom; it shivers on the knock. */
  post(ctx, c, y0, y1, t) {
    const k = t > KNOCK && t < KNOCK + 0.35 ? Math.sin((t - KNOCK) * 90) * (1 - (t - KNOCK) / 0.35) * 1.6 : 0;
    const x = POST.x + k, w = POST.w, steel = mix(c.waste, c.bgSurface, 0.25);
    ctx.save();
    const gr = ctx.createLinearGradient(x, 0, x + w, 0);
    gr.addColorStop(0, lighten(steel, 0.7)); gr.addColorStop(0.5, lighten(steel, 0.35)); gr.addColorStop(1, darken(steel, 0.15));
    ctx.fillStyle = gr; rr(ctx, x, y0, w, y1 - y0, 4); ctx.fill();
    ctx.strokeStyle = darken(steel, 0.4); ctx.lineWidth = 2; rr(ctx, x, y0, w, y1 - y0, 4); ctx.stroke();
    for (const yy of [y0 + 12, y1 - 12]) {
      ctx.fillStyle = darken(steel, 0.25); ctx.beginPath(); ctx.arc(x + w / 2, yy, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lighten(steel, 0.8); ctx.beginPath(); ctx.arc(x + w / 2 - 1, yy - 1, 1.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /**
   * A pendulum striker: a steel-headed hammer hung from a bracket at the top of the post. Drawn back until
   * 0.2 s, it swings in to strike the post at KNOCK, rebounds a little, then rests against it.
   */
  hammer(ctx, c, hitY, t, topY) {
    const face = 24, px = POST.x - face - 1, py = topY - 16, L = hitY - py;
    let ang;                                          // 0 = hanging, striking; positive = drawn back to the left
    if (t < 0.2) ang = 0.42;
    else if (t < KNOCK) { const u = (t - 0.2) / (KNOCK - 0.2); ang = 0.42 * (1 - u * u); }
    else if (t < KNOCK + 0.5) { const u = (t - KNOCK) / 0.5; ang = 0.1 * Math.sin(Math.PI * u); }
    else ang = 0;
    const wood = mix(c.s8, c.waste, 0.45), steel = mix(c.waste, c.bgSurface, 0.2);
    // the bracket: a steel arm from the post top out to the pivot
    ctx.save();
    const bg = ctx.createLinearGradient(0, py - 7, 0, py + 7);
    bg.addColorStop(0, lighten(steel, 0.6)); bg.addColorStop(1, darken(steel, 0.15));
    ctx.fillStyle = bg; rr(ctx, px - 10, py - 7, POST.x + POST.w - px + 10, 14, 4); ctx.fill();
    ctx.strokeStyle = darken(steel, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
    // handle: turned wood, lit on the left, a grain line
    const hg = ctx.createLinearGradient(-6, 0, 6, 0);
    hg.addColorStop(0, lighten(wood, 0.4)); hg.addColorStop(0.5, lighten(wood, 0.1)); hg.addColorStop(1, darken(wood, 0.25));
    ctx.fillStyle = hg; rr(ctx, -5, -4, 10, L - 8, 4); ctx.fill();
    ctx.strokeStyle = darken(wood, 0.4); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = alpha(darken(wood, 0.35), 0.5); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-1, 10); ctx.bezierCurveTo(2, L * 0.3, -2.5, L * 0.6, 0.5, L - 20); ctx.stroke();
    // head: a steel block, lit top, striking face on the right
    const hgx = ctx.createLinearGradient(0, L - 15, 0, L + 15);
    hgx.addColorStop(0, lighten(steel, 0.75)); hgx.addColorStop(0.35, lighten(steel, 0.4)); hgx.addColorStop(1, darken(steel, 0.2));
    ctx.fillStyle = hgx; rr(ctx, -22, L - 14, 22 + face, 28, 5); ctx.fill();
    ctx.strokeStyle = darken(steel, 0.45); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = lighten(steel, 0.55); rr(ctx, face - 5, L - 12, 5, 24, 2); ctx.fill();
    ctx.restore();
    // the pivot bolt
    ctx.save(); ctx.fillStyle = darken(steel, 0.3); ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lighten(steel, 0.8); ctx.beginPath(); ctx.arc(px - 1.2, py - 1.2, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // the knock: short strike lines at the contact for a moment
    if (t >= KNOCK && t < KNOCK + 0.3) {
      const u = (t - KNOCK) / 0.3;
      ctx.save(); ctx.strokeStyle = alpha(c.gold, 1 - u); ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const da of [-0.9, -0.3, 0.3, 0.9]) {
        const r0 = 12 + 10 * u, r1 = r0 + 12;
        ctx.beginPath(); ctx.moveTo(POST.x - Math.cos(da) * r0, hitY + Math.sin(da) * r0);
        ctx.lineTo(POST.x - Math.cos(da) * r1, hitY + Math.sin(da) * r1); ctx.stroke();
      }
      ctx.restore();
    }
  }

  /** The finishing order: a round badge with 1, 2 or 3 just past the end of the track. */
  badge(ctx, c, x, y, n, u) {
    const col = n === 1 ? c.gold : n === 2 ? mix(c.waste, c.bgSurface, 0.45) : mix(c.s8, c.waste, 0.3);
    const r = 19 * (0.6 + 0.4 * u);
    ctx.save(); ctx.globalAlpha = u;
    const gr = ctx.createRadialGradient(x - 5, y - 6, 2, x, y, r);
    gr.addColorStop(0, lighten(col, 0.5)); gr.addColorStop(1, darken(col, 0.05));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = inkOn(c, col); ctx.font = font(c, 700, 26, true); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(n), x, y + 1);
    ctx.restore();
  }

  /** A red caret pointing up at a compression from under its track. */
  caret(ctx, c, x, y) {
    ctx.save(); ctx.fillStyle = c.s6; ctx.strokeStyle = darken(c.s6, 0.35); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 16); ctx.lineTo(x + 10, y + 16); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
}
