// FlatwormPlaneAndGutScene - L06 blk-l06-s05, 4 beats. Beat 0: flatworm from above with the one plane of symmetry,
// head end and tail end, gliding head first. Beat 1: a slice through the flat body with gases crossing it. Beat 2:
// the branched gut, pharynx and single opening. Beat 3: a parasitic flatworm held to host tissue by hooks and suckers.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { one, lc, mx, ink, n1, LIFE_COLOR_MAP, frame, anim, seaLabel, tag, fill, stroke, flowArrow, svgBioColour as bc } from './BodyKit.js';

const BODY = bc('flat'), DARK = bc('flatDark'), LIT = bc('flatLit'), GUT = mx(bc('flatDark'), lc('red'), 0.3);

function wormPath(cx, cy, L, Wd) {
  // a long flat leaf, the head end a rounded triangle with two small side lobes
  const x = (u) => cx + u * L / 2, y = (v) => cy + v * Wd / 2;
  const half = (q) => `C${x(-0.86)} ${y(q * 0.34)} ${x(-0.5)} ${y(q * 0.86)} ${x(-0.08)} ${y(q)}S${x(0.52)} ${y(q * 0.86)} ${x(0.68)} ${y(q * 0.66)}`
    + `Q${x(0.74)} ${y(q * 0.58)} ${x(0.78)} ${y(q * 0.86)}Q${x(0.82)} ${y(q * 0.96)} ${x(0.86)} ${y(q * 0.7)}Q${x(0.95)} ${y(q * 0.34)} ${x(1)} ${y(0)}`;
  const back = `Q${x(0.95)} ${y(0.34)} ${x(0.86)} ${y(0.7)}Q${x(0.82)} ${y(0.96)} ${x(0.78)} ${y(0.86)}Q${x(0.74)} ${y(0.58)} ${x(0.68)} ${y(0.66)}C${x(0.52)} ${y(0.86)} ${x(0.3)} ${y(1)} ${x(-0.08)} ${y(1)}S${x(-0.86)} ${y(0.34)} ${x(-1)} ${y(0)}Z`;
  return `M${x(-1)} ${y(0)}${half(-1)}${back}`;
}
function worm(cx, cy, L, Wd, o = {}) {
  let g = `<g style="${o.dim ? 'opacity:0.5' : ''}"><path d="${wormPath(cx, cy, L, Wd)}" ${fill(BODY, `stroke:${DARK};stroke-width:5;stroke-linejoin:round`)}/>`;
  if (!o.plain) for (let i = 0; i < 22; i++) { const u = -0.82 + (i * 0.618 % 1) * 1.5, v = ((i * 0.37) % 1 - 0.5) * 1.4 * (1 - Math.abs(u) * 0.7); g += `<circle cx="${n1(cx + u * L / 2)}" cy="${n1(cy + v * Wd / 2)}" r="${2.5 + (i % 3)}" ${fill(DARK, 'opacity:0.35')}/>`; }
  g += `<path d="M${n1(cx - L * 0.3)} ${n1(cy - Wd * 0.3)}Q${n1(cx)} ${n1(cy - Wd * 0.42)} ${n1(cx + L * 0.24)} ${n1(cy - Wd * 0.3)}" ${stroke(LIT, 6, 'stroke-linecap:round')}/>`;
  return g + '</g>';
}
function gut(cx, cy, L, Wd) {
  // one trunk forward and two back, with rounded side pockets, closed at every end: the only way in or out is the pharynx
  const trunk = (x0, y0, x1, y1, sign) => {
    let d = `M${n1(x0)} ${n1(y0)}L${n1(x1)} ${n1(y1)}`;
    const n = Math.round(Math.abs(x1 - x0) / 34);
    for (let i = 1; i <= n; i++) { const u = i / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; d += `M${n1(x)} ${n1(y)}q${sign * 2} ${n1(sign * Wd * 0.1)} ${n1(sign * 8)} ${n1(sign * Wd * 0.2)}`; if (sign === 0) d += ''; }
    return d;
  };
  const f = cx + L * 0.03, back = cx - L * 0.32, gy = Wd * 0.16;
  let d = trunk(f, cy, cx + L * 0.34, cy, 1) + trunk(f, cy, cx + L * 0.34, cy, -1);
  d += trunk(f, cy - gy * 0.4, back, cy - gy, -1) + trunk(f, cy + gy * 0.4, back, cy + gy, 1);
  return `<path d="${d}" ${stroke(GUT, 11, 'stroke-linecap:round;stroke-linejoin:round')}/>`;
}

export class FlatwormPlaneAndGutScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 400; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'A flatworm from above with one line dividing it into two matching halves, then a slice through its thin body, then its gut with one opening, then a parasitic flatworm holding on with hooks and suckers.';
  static CONTROLS = [];
  enter(step) { if (step === 0) this.play?.(4); }
  stageHeight(st) { return st.portrait ? [240, 300, 280, 360][this.stepIndex] ?? 280 : 400; }
  animate(st, t = 0) {
    if (this.stepIndex !== 0) return;
    const { W, portrait: P } = st, dx = Math.min(1, t / 3.4) * (P ? 22 : 40), L = P ? W - 62 : 500, Wd = P ? 84 : 110, cx = W * 0.5 - (P ? 10 : 20) + dx, cy = st.H * (P ? 0.54 : 0.52);
    let g = worm(cx, cy, L, Wd);
    g += `<path d="M${n1(cx - L * 0.56)} ${n1(cy)}L${n1(cx + L * 0.56)} ${n1(cy)}" ${stroke(ink, 4, 'stroke-dasharray:14 9;stroke-linecap:round')}/>`;
        anim(this, 'w', g);
  }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex;
    let g = `<rect width="${W}" height="${H}" ${fill(mx(lc('sea'), lc('white'), 0.5))}/><path d="M0 ${H - 34}Q${W / 2} ${H - 54} ${W} ${H - 30}V${H}H0Z" ${fill(lc('sandDark'))}/>`;
    if (step === 0) {
      g += `<g data-anim="w"></g>`;
      g += seaLabel(W / 2, 34, 'One plane, two matching halves', { size: P ? 17 : 19 });
      g += seaLabel(P ? 56 : 90, H - 58, 'Tail end', { size: 17 }) + seaLabel(W - (P ? 58 : 90), H - 58, 'Head end', { size: 17 });
      g += flowArrow([W * (P ? 0.42 : 0.62), H - 64], [W * (P ? 0.5 : 0.68), H - 66], [W * (P ? 0.58 : 0.74), H - 64], lc('seaDeep'), 6);
    }
    if (step === 1) {
      const L = P ? W - 90 : 400, Wd = P ? 60 : 90, cx = W / 2, top = P ? 50 : 92;
      g += worm(cx, top, L, Wd, { dim: true });
      g += `<path d="M${cx} ${top - Wd / 2 - 6}L${cx} ${top + Wd / 2 + 6}" ${stroke(ink, 4, 'stroke-dasharray:8 6')}/>`;
      const sy = P ? 172 : 262, sw = P ? W - 60 : 480, sh = 42, x0 = cx - sw / 2;
      g += `<path d="M${cx} ${top + Wd / 2 + 8}L${cx} ${sy - sh / 2 - 34}" ${stroke(ink, 3)}/>`;
      g += `<rect x="${n1(x0)}" y="${sy - sh / 2}" width="${sw}" height="${sh}" rx="${sh / 2}" ${fill(BODY, `stroke:${DARK};stroke-width:5`)}/>`;
      for (let i = 0; i < 14; i++) for (const r of [0, 1]) g += `<circle cx="${n1(x0 + 22 + i * (sw - 44) / 13)}" cy="${sy + (r ? 9 : -9)}" r="7" ${fill(LIT, `stroke:${DARK};stroke-width:1.5`)}/>`;
      for (let i = 0; i < (P ? 4 : 6); i++) {
        const x = x0 + (i + 0.5) * sw / (P ? 4 : 6), col = i % 2 ? lc('seaDeep') : lc('red');
        g += i % 2 ? flowArrow([x, sy - 8], [x + 2, sy - 34], [x, sy - 56], col, 5) : flowArrow([x, sy - 58], [x + 2, sy - 40], [x, sy - 12], col, 5);
      }
      g += seaLabel(cx, sy + 62, 'Gases pass through a thin body', { size: P ? 17 : 19 });
      g += seaLabel(cx, sy + 86, 'No breathing organs', { size: 16 });
    }
    if (step === 2) {
      const L = P ? W - 40 : 540, Wd = P ? 120 : 170, cx = W / 2, cy = H * 0.5;
      g += worm(cx, cy, L, Wd) + gut(cx, cy, L, Wd);
      g += `<ellipse cx="${n1(cx - L * 0.02)}" cy="${n1(cy)}" rx="34" ry="13" ${fill(mx(GUT, lc('white'), 0.3), `stroke:${DARK};stroke-width:4`)}/><circle cx="${n1(cx - L * 0.06)}" cy="${n1(cy)}" r="6" ${fill(ink)}/>`;
      g += tag(P ? 80 : cx - 180, P ? 34 : 44, cx - L * 0.22, cy - Wd * 0.26, 'Gut (an organ)');
      g += tag(P ? W - 88 : cx + 180, P ? 34 : 44, cx - L * 0.0 + 8, cy - 6, 'Pharynx');
      g += tag(cx, H - 16, cx - L * 0.06, cy + 6, 'One opening, for food and waste');
    }
    if (step === 3) {
      // host wall along the top, the worm's head fixed in it, seen enlarged
      const hx = W / 2, hy = P ? 84 : 104;
      g += `<path d="M0 0H${W}V${hy - 8}C${W * 0.8} ${hy + 18} ${W * 0.62} ${hy - 26} ${hx + 60} ${hy - 12}Q${hx} ${hy + 8} ${hx - 60} ${hy - 12}C${W * 0.34} ${hy - 26} ${W * 0.2} ${hy + 18} 0 ${hy - 8}Z" ${fill(mx(lc('red'), lc('white'), 0.42), `stroke:${mx(lc('red'), lc('wood'), 0.4)};stroke-width:5`)}/>`;
      for (let i = 0; i < 7; i++) g += `<circle cx="${n1(W * (0.08 + i * 0.14))}" cy="${n1(26 + (i % 2) * 18)}" r="12" ${fill(mx(lc('red'), lc('white'), 0.56))}/>`;
      g += seaLabel(P ? 66 : 92, 26, 'Host tissue', { size: 17 });
      // strip of the body, no gut drawn
      const n = P ? 5 : 7;
      for (let i = n - 1; i >= 0; i--) { const y = hy + 82 + i * 30, w = 58 + i * 12; g += `<rect x="${n1(hx - w / 2)}" y="${y}" width="${w}" height="34" rx="8" ${fill(i % 2 ? BODY : LIT, `stroke:${DARK};stroke-width:4`)}/>`; }
      g += `<path d="M${hx - 60} ${hy + 48}Q${hx - 66} ${hy - 6} ${hx} ${hy - 8}Q${hx + 66} ${hy - 6} ${hx + 60} ${hy + 48}Q${hx} ${hy + 112} ${hx - 60} ${hy + 48}Z" ${fill(BODY, `stroke:${DARK};stroke-width:5`)}/>`;
      for (let i = 0; i < 9; i++) { const a = Math.PI * (0.16 + i * 0.085), x = hx + Math.cos(a) * 26, y = hy + 4 - Math.sin(a) * 10; g += `<path d="M${n1(x)} ${n1(y)}q${n1(Math.cos(a) * 12)} ${-16} ${n1(Math.cos(a) * 20)} ${-22}" ${stroke(lc('white'), 7, 'stroke-linecap:round')}/><path d="M${n1(x)} ${n1(y)}q${n1(Math.cos(a) * 12)} ${-16} ${n1(Math.cos(a) * 20)} ${-22}" ${stroke(ink, 2.5, 'stroke-linecap:round')}/>`; }
      for (const side of [-1, 1]) g += `<path d="M${hx + side * 44} ${hy + 8}Q${hx + side * 88} ${hy + 30} ${hx + side * 50} ${hy + 60}Q${hx + side * 62} ${hy + 32} ${hx + side * 44} ${hy + 8}Z" ${fill(DARK, `stroke:${ink};stroke-width:3`)}/>`;
      g += tag(P ? W - 56 : hx + 180, hy + 44, hx + 24, hy - 12, 'Hooks');
      g += tag(P ? 56 : hx - 180, hy + 84, hx - 70, hy + 34, 'Suckers');
      g += seaLabel(P ? 64 : hx + 190, H - (P ? 96 : 90), 'Tapeworm:', { size: 17 }) + seaLabel(P ? 64 : hx + 190, H - (P ? 72 : 66), 'no gut', { size: 17 });
    }
    return { svg: frame(st, 'fw', g) };
  }
}
