// ThroughGutEvidenceScene - L06 blk-l06-s06, 4 beats. Beat 0: one cylindrical body in water, soil and host tissue.
// Beat 1: the worm cut open, food moving one way from mouth to anus. Beat 2: a table of flatworm and roundworm against
// free living and parasite, so openings and way of life are read apart. Beat 3: the book's four habits, drawn.
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { one, lc, mx, ink, n1, LIFE_COLOR_MAP, frame, anim, seaLabel, tag, fill, stroke, words, along, svgBio, BOX, svgBioColour as bc } from './BodyKit.js';

const BODY = bc('round'), DARK = bc('roundDark'), LIT = bc('roundLit'), FOOD = lc('red'), WASTE = mx(lc('wood'), lc('ink'), 0.4);
const HOST = mx(lc('red'), lc('white'), 0.42);

function wiggle(x0, x1, y, amp, ph, w) {
  const pts = [];
  for (let i = 0; i <= 26; i++) { const u = i / 26; pts.push(`${n1(x0 + (x1 - x0) * u)} ${n1(y + Math.sin(u * 7 + ph) * amp * (0.5 + 0.5 * Math.sin(u * Math.PI)))}`); }
  const d = 'M' + pts.join('L');
  return `<path d="${d}" ${stroke(DARK, w + 5, 'stroke-linecap:round;stroke-linejoin:round')}/><path d="${d}" ${stroke(BODY, w, 'stroke-linecap:round;stroke-linejoin:round')}/><path d="${d}" transform="translate(0 ${n1(-w * 0.2)})" ${stroke(LIT, w * 0.14, 'stroke-linecap:round;stroke-linejoin:round;opacity:0.8')}/>`;
}


export class ThroughGutEvidenceScene extends SvgScene {
  static BEAT_STEP_MAP = [one(0), one(1), one(2), one(3)];
  static COLOR_MAP = LIFE_COLOR_MAP;
  static WIDTH = 680; static HEIGHT = 400; static PORTRAIT_WIDTH = 322; static PORTRAIT_HEIGHT = 520;
  static ARIA_LABEL = 'A roundworm in water, in soil and in host tissue; then cut open with food going in at the mouth and waste leaving at the anus; then a table showing flatworms and roundworms each include free living worms and parasites; then four healthy habits.';
  static CONTROLS = [];
  enter(step) { if (step < 2) this.play?.(step ? 9 : 5); }
  stageHeight(st) { return st.portrait ? [300, 250, 360, 370][this.stepIndex] ?? 300 : (this.stepIndex === 3 ? 330 : 400); }
  animate(st, t = 0) {
    const { W, H, portrait: P } = st;
    if (this.stepIndex === 0) {
      const b = H / 3; let g = '';
      [0, 1, 2].forEach((i) => { const y = b * (i + 0.56), x0 = P ? 92 : 170, x1 = W - (P ? 26 : 60); g += wiggle(x0, x1, y, P ? 18 : 22, t * 1.3 + i * 1.7, P ? 15 : 19); });
      anim(this, 'w', g);
    }
    if (this.stepIndex === 1) {
      const m = 40, y = H * 0.5, r = [[m - 40, y], [m + 8, y], [W - m - 8, y], [W - m + 34, y]]; let g = '';
      for (let i = 0; i < 9; i++) {
        const u = (t * 0.09 + i / 9) % 1, [x, yy] = along(r, u), late = u > 0.7;
        g += `<circle cx="${n1(x)}" cy="${n1(yy + (i % 2 ? 3 : -3))}" r="${late ? 5 : 7}" ${fill(late ? WASTE : FOOD, `stroke:${ink};stroke-width:2`)}/>`;
      }
      anim(this, 'w', g);
    }
  }
  paint(st) {
    const { W, H, portrait: P } = st, step = this.stepIndex;
    let g = `<rect width="${W}" height="${H}" ${fill(step === 3 ? mx(lc('sand'), lc('white'), 0.5) : mx(lc('sea'), lc('white'), 0.5))}/>`;
    if (step === 0) {
      const b = H / 3;
      g += `<rect width="${W}" height="${b}" ${fill(lc('sea'))}/>`;
      g += `<rect y="${n1(b)}" width="${W}" height="${n1(b)}" ${fill(lc('soil'))}/>`;
      g += `<rect y="${n1(b * 2)}" width="${W}" height="${n1(b)}" ${fill(HOST)}/>`;
      for (let i = 0; i < 18; i++) g += `<circle cx="${n1((i * 137) % W)}" cy="${n1(b + 12 + (i * 61) % (b - 22))}" r="${3 + i % 4}" ${fill(lc('soilDark'), 'opacity:0.6')}/>`;
      for (let i = 0; i < 7; i++) g += `<ellipse cx="${n1(30 + i * W / 7)}" cy="${n1(b * 2 + 16 + (i % 2) * (b - 34))}" rx="24" ry="11" ${fill(mx(HOST, lc('white'), 0.35))}/>`;
      g += `<g data-anim="w"></g>`;
      ['Water', 'Soil', 'Host tissue'].forEach((t, i) => { g += seaLabel(P ? 52 : 84, b * (i + 0.56) + 6, t, { size: P ? 16 : 18 }); });
    }
    if (step === 1) {
      const m = 40, y = H * 0.5, h = P ? 74 : 104;
      g += `<path d="M${m - 8} ${y}Q${m + 2} ${y - h / 2} ${m + 50} ${y - h / 2}H${W - m - 50}Q${W - m - 2} ${y - h / 2} ${W - m + 8} ${y}Q${W - m - 2} ${y + h / 2} ${W - m - 50} ${y + h / 2}H${m + 50}Q${m + 2} ${y + h / 2} ${m - 8} ${y}Z" ${fill(BODY, `stroke:${DARK};stroke-width:6`)}/>`;
      g += `<path d="M${m + 4} ${y}H${W - m - 4}" ${stroke(mx(lc('sea'), lc('white'), 0.3), P ? 26 : 34, 'stroke-linecap:butt')}/>`;
      const px = m + (P ? 56 : 92);
      g += `<path d="M${m + 18} ${y}H${px}" ${stroke(mx(DARK, lc('red'), 0.25), P ? 36 : 46)}/><path d="M${m + 18} ${y}H${px}" ${stroke(mx(lc('sea'), lc('white'), 0.3), P ? 14 : 18)}/>`;
      g += `<g data-anim="w"></g>`;
      const ta = y - h / 2, tb = y + h / 2;
      g += tag(P ? 54 : 80, ta - 44, m + 2, y - 2, 'Mouth') + tag(W - (P ? 50 : 80), ta - 44, W - m - 2, y - 2, 'Anus');
      g += tag(P ? 106 : 170, tb + 50, m + 34, y + 12, 'Pharynx') + tag(W * 0.62, tb + 50, W * 0.56, y + 9, 'Intestine');
      g += seaLabel(W / 2, ta - 46, 'Two openings', { size: P ? 17 : 19 });
    }
    if (step === 2) {
      const gx = P ? 76 : 130, gy = 56, cw = (W - gx - 14) / 2, ch = (H - gy - 16) / 2;
      g += words(gx + cw / 2, 26, 'Flatworm', { size: 18, display: true, ink }) + words(gx + cw * 1.5, 26, 'Roundworm', { size: 18, display: true, ink });
      g += words(gx + cw / 2, 46, 'one opening', { size: 15, ink }) + words(gx + cw * 1.5, 46, 'two openings', { size: 15, ink });
      ['Lives freely', 'Parasite'].forEach((t, r) => {
        const y = gy + r * ch;
        const a = t.split(' ');
        g += words(gx / 2 + 2, y + ch / 2 - (a.length > 1 ? 4 : -4), a[0], { size: 15, ink }) + (a[1] ? words(gx / 2 + 2, y + ch / 2 + 15, a[1], { size: 15, ink }) : '');
        ['Flatworm', 'Roundworm'].forEach((n, c) => {
          const x = gx + c * cw, tone = r ? HOST : (c ? lc('soil') : lc('sea')), k = (cw - 34) / BOX[n][2];
          g += `<rect x="${n1(x + 4)}" y="${n1(y + 4)}" width="${n1(cw - 8)}" height="${n1(ch - 8)}" rx="14" ${fill(tone, `stroke:${ink};stroke-width:3`)}/>`;
          g += svgBio(n, x + cw / 2, y + ch / 2, k);
          g += words(x + cw / 2, y + ch - 14, r ? 'in a host' : (c ? 'in soil' : 'in water'), { size: 15, ink, halo: lc('white'), haloW: 4 });
        });
      });
    }
    if (step === 3) {
      const cols = P ? 2 : 4, cw = (W - 24 - (cols - 1) * 10) / cols, ch = P ? (H - 34) / 2 : 250, y0 = P ? 12 : 62;
      const items = [
        ['Wash hands', (x, y) => `<path d="M${x - 30} ${y - 34}h40q12 0 12 12v10" ${stroke(lc('metalDark'), 12, 'stroke-linecap:round')}/><rect x="${x - 44}" y="${y - 44}" width="16" height="22" rx="4" ${fill(lc('metal'), `stroke:${ink};stroke-width:2.5`)}/>` + [0, 1, 2].map((i) => `<path d="M${x + 22} ${y - 2 + i * 14}q-6 8 0 11q6 -3 0 -11Z" ${fill(lc('sea'), `stroke:${lc('seaDeep')};stroke-width:2`)}/>`).join('') + `<rect x="${x - 36}" y="${y + 18}" width="40" height="22" rx="10" ${fill(mx(lc('sea'), lc('white'), 0.6), `stroke:${ink};stroke-width:2.5`)}/>`],
        ['Hygiene and sanitary habits', (x, y) => `<g transform="rotate(-32 ${x} ${y})"><rect x="${x - 52}" y="${y - 7}" width="80" height="14" rx="7" ${fill(lc('sea'), `stroke:${ink};stroke-width:3`)}/><rect x="${x + 14}" y="${y - 10}" width="44" height="16" rx="6" ${fill(lc('white'), `stroke:${ink};stroke-width:3`)}/>` + [0, 1, 2, 3, 4].map((i) => `<rect x="${x + 18 + i * 8}" y="${y - 24}" width="5" height="15" ${fill(mx(lc('sea'), lc('white'), 0.3))}/>`).join('') + `</g><path d="M${x + 6} ${y + 30}l12 12 24 -28" ${stroke(lc('grassDark'), 7, 'stroke-linecap:round;stroke-linejoin:round')}/>`],
        ['Cooked food', (x, y) => `<path d="M${x - 40} ${y - 6}h80v22q0 22 -22 22h-36q-22 0 -22 -22Z" ${fill(lc('metal'), `stroke:${ink};stroke-width:3`)}/><rect x="${x - 46}" y="${y - 14}" width="92" height="10" rx="5" ${fill(lc('metalDark'))}/>` + [-20, 0, 20].map((d) => `<path d="M${x + d} ${y - 24}q-8 -10 0 -18q8 -8 0 -18" ${stroke(mx(lc('white'), lc('metal'), 0.3), 5, 'stroke-linecap:round')}/>`).join('') + [-22, -2, 18].map((d) => `<path d="M${x + d} ${y + 52}q6 8 2 16q10 -6 8 -16Z" ${fill(lc('red'))}/>`).join('')],
        ['Boiled or filtered water', (x, y) => `<path d="M${x - 26} ${y - 36}h52l-8 76q-1 8 -9 8h-18q-8 0 -9 -8Z" ${fill(lc('white'), `stroke:${ink};stroke-width:3`)}/><path d="M${x - 22} ${y - 8}h44l-5 46q-1 6 -7 6h-20q-6 0 -7 -6Z" ${fill(lc('sea'))}/>` + [0, 1, 2].map((i) => `<path d="M${x + (i - 1) * 12} ${y - 44}q-6 -8 0 -14q6 -6 0 -14" ${stroke(mx(lc('white'), lc('metal'), 0.3), 4, 'stroke-linecap:round')}/>`).join('')],
      ];
      if (!P) g += seaLabel(W / 2, 40, 'Your book suggests', { size: 19 });
      items.forEach(([t, art], i) => {
        const x = 12 + (i % cols) * (cw + 10), y = y0 + Math.floor(i / cols) * (ch + 10), a = t.split(' '), two = t.length > 14;
        const l1 = two ? a.slice(0, Math.ceil(a.length / 2)).join(' ') : t, l2 = two ? a.slice(Math.ceil(a.length / 2)).join(' ') : '';
        g += `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(cw)}" height="${n1(ch)}" rx="16" ${fill(lc('white'), `stroke:${ink};stroke-width:3.5`)}/>` + art(x + cw / 2, y + ch / 2 - 22);
        g += words(n1(x + cw / 2), n1(y + ch - (l2 ? 33 : 14)), l1, { size: 15, ink }) + (l2 ? words(n1(x + cw / 2), n1(y + ch - 12), l2, { size: 15, ink }) : '');
      });
    }
    return { svg: frame(st, 'tg', g) };
  }
}
