// BodyArt - the labelled cut-away drawings for the human part of the reproduction module (L07, L08, L09), SVG only.
// Drawn to stand beside L07/FertilisationScene: every form has a lit side, a shade side, an inner line or texture, and a
// rim that varies. Medical-style sections like the book's two figures: organs only, no skin detail, no faces. Tokens only.
//   maleSystemSvg(x, y, k, o)    side section, 360 by 350 at k = 1, facing left. o.parts: which parts are drawn
//   femaleSystemSvg(x, y, k, o)  front section, 440 by 345 at k = 1. o.lining 0..1, o.shed, o.vessels, o.egg, o.copperT, o.block
//   uterusHeld(cx, cy, step, o)  pregnant uterus in section with sac, placenta, cord and the stage
//   embryoSvg(i, x, y, h, o)     stage i (0..10) of pregnancy, no face, centred on (x, y), about h tall
//   eggSvg, spermSvg, cellSvg    gametes and living cells in the look of the fertilisation drawing
//   form(d, col, o), tube(d, col, w), tapered(pts, ws)   the drawing tools: a shaded shape, a shaded tube, a tapering outline
//   field(st, id, o)             a quiet depth backdrop; each scene passes its own light
//   tag, leader, frame, txt, panel   labels and frame
// o.dim(part) true dims a part, o.lit(part) true thickens its rim. Dim and line width only, no glow.
import { fill, stroke } from 'simulations/base/kit/SimSvg.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';

export const n = (v) => Math.round(v * 10) / 10;
const cm = (a, b, k) => `color-mix(in oklab, ${a} ${k}%, ${b})`;
const S = (i) => `var(--sim-series-${i})`;
export const INK = 'var(--sim-label)';
export const MUTED = 'var(--sim-label-muted)';
export const PAPER = 'var(--sim-bg-surface)';
const DEEP = 'var(--sim-bg-deep)';
export const BODY = {
  tissue: cm(cm(S(8), S(4), 80), PAPER, 30), tissueRim: cm(cm(S(8), S(6), 70), INK, 62),
  wall: cm(S(4), S(6), 55), wallDark: cm(cm(S(4), S(6), 55), 'black', 72), wallLit: cm(cm(S(4), S(6), 55), 'white', 68),
  lining: cm(S(5), S(4), 45), liningLit: cm(cm(S(5), S(4), 45), 'white', 62), vessel: S(6),
  cavity: cm(S(4), DEEP, 12),
  egg: cm(S(2), S(8), 75), eggDark: cm(cm(S(2), S(8), 75), 'black', 70), sperm: S(7),
  bladder: cm(S(2), PAPER, 46), bladderWall: cm(S(8), S(4), 60), testis: cm(S(2), S(8), 62), vas: S(1), urethra: S(5), vesicle: S(3), prostate: S(8),
  fetus: cm(cm(S(8), S(4), 72), PAPER, 52), ovary: cm(S(2), S(8), 62), spine: cm(S(2), PAPER, 16), disc: cm(S(1), PAPER, 30), skin: cm(cm(S(8), S(4), 80), PAPER, 44),
};
const dk = (c, k = 68) => cm(c, 'black', k);
const lt = (c, k = 62) => cm(c, 'white', k);
let UID = 0;
const uid = (p = 'b') => `${p}${(UID = (UID + 1) % 1000000)}`;
const lerp = (a, b, u) => a + (b - a) * u;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---------------------------------------------------------------- the drawing tools
/** A radial light from the top left over a base colour. Returns [defs, url]. */
export function lightGrad(col, o = {}) {
  const id = uid('g');
  return [`<radialGradient id="${id}" cx="${o.cx ?? 0.34}" cy="${o.cy ?? 0.28}" r="${o.r ?? 0.85}"><stop offset="0" style="stop-color:${lt(col, o.hi ?? 54)}"/><stop offset="0.5" style="stop-color:${col}"/><stop offset="1" style="stop-color:${dk(col, o.lo ?? 62)}"/></radialGradient>`, `url(#${id})`];
}
/** A closed shape with form: lit fill, inner shadow round its edge, then anything in o.inner clipped to it, then a rim. */
export function form(d, col, o = {}) {
  const id = uid('c'), [g, url] = lightGrad(col, o), ao = o.ao ?? 12, rim = o.rim ?? 2.4;
  return `<defs>${g}<clipPath id="${id}"><path d="${d}"/></clipPath></defs><path d="${d}" style="fill:${url}"/>`
    + `<g clip-path="url(#${id})"><path d="${d}" style="fill:none;stroke:${dk(col, 42)};stroke-width:${ao};opacity:${o.aoOp ?? 0.5};filter:blur(${n(ao * 0.42)}px)"/>${o.inner ?? ''}</g>`
    + `<path d="${d}" style="fill:none;stroke:${o.rimCol ?? dk(col, 56)};stroke-width:${rim};stroke-linejoin:round"/>`;
}
/** A round tube along d: dark edge, body, a lit stripe on the upper left. */
export function tube(d, col, w, o = {}) {
  const lit = o.lit ? 2 : 0;
  return `<path d="${d}" ${stroke(dk(col, 50), w + 2.6 + lit)}/><path d="${d}" ${stroke(col, w)}/><path d="${d}" ${stroke(dk(col, 74), w * 0.4, `transform:translate(${n(w * 0.1)}px,${n(w * 0.16)}px);opacity:0.6`)}/><path d="${d}" ${stroke(lt(col, 42), w * 0.26, `transform:translate(${n(-w * 0.14)}px,${n(-w * 0.18)}px);opacity:0.85`)}/>`;
}
/** A closed outline round a centre line pts, ws the half width at each point. Round tip. */
export function tapered(pts, ws) {
  const L = [], R = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, w = ws[i];
    L.push([p[0] + nx * w, p[1] + ny * w]); R.push([p[0] - nx * w, p[1] - ny * w]);
  });
  const ring = [...L, ...R.reverse()];
  let d = `M${n((ring[0][0] + ring[ring.length - 1][0]) / 2)} ${n((ring[0][1] + ring[ring.length - 1][1]) / 2)}`;
  ring.forEach((p, i) => { const q = ring[(i + 1) % ring.length]; d += `Q${n(p[0])} ${n(p[1])} ${n((p[0] + q[0]) / 2)} ${n((p[1] + q[1]) / 2)}`; });
  return `${d}Z`;
}
const bez = (p, u) => { const v = 1 - u; return [0, 1].map((a) => v * v * v * p[0][a] + 3 * v * v * u * p[1][a] + 3 * v * u * u * p[2][a] + u * u * u * p[3][a]); };
const hash = (i, j) => { const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return x - Math.floor(x); };
const stipple = (x0, y0, w, h, count, col, r = 1.1, seed = 1, op = 0.4) => { let s = ''; for (let i = 0; i < count; i++) s += `<circle cx="${n(x0 + hash(i, seed) * w)}" cy="${n(y0 + hash(i, seed + 1) * h)}" r="${n(r * (0.6 + hash(i, seed + 2)))}" style="fill:${col};opacity:${op}"/>`; return s; };
/** A quiet depth field: a soft wash and out-of-focus shapes. o.a, o.b: series numbers of the wash; o.seed; o.top: a lighter top band. */
export function field(st, id, o = {}) {
  const W = st.W, H = st.H, a = S(o.a ?? 4), b = S(o.b ?? 5), seed = o.seed ?? 3;
  let s = `<defs><linearGradient id="${id}-w" x1="0" y1="0" x2="${o.x ?? 0.3}" y2="1"><stop offset="0" style="stop-color:${cm(a, DEEP, o.k ?? 13)}"/><stop offset="1" style="stop-color:${cm(b, DEEP, (o.k ?? 13) + 3)}"/></linearGradient>`;
  s += `<radialGradient id="${id}-b"><stop offset="0" style="stop-color:${cm(b, PAPER, 34)};stop-opacity:0.5"/><stop offset="1" style="stop-color:${cm(b, PAPER, 34)};stop-opacity:0"/></radialGradient><radialGradient id="${id}-a"><stop offset="0" style="stop-color:${cm(a, PAPER, 34)};stop-opacity:0.5"/><stop offset="1" style="stop-color:${cm(a, PAPER, 34)};stop-opacity:0"/></radialGradient>`;
  s += `<radialGradient id="${id}-v" cx="0.5" cy="0.45" r="0.75"><stop offset="0.62" style="stop-color:${dk(a, 40)};stop-opacity:0"/><stop offset="1" style="stop-color:${dk(a, 40)};stop-opacity:0.2"/></radialGradient></defs>`;
  s += `<rect width="${W}" height="${H}" style="fill:url(#${id}-w)"/>`;
  for (let i = 0; i < 12; i++) { const r = 34 + hash(i, seed) * 78; s += `<circle cx="${n(hash(i, seed + 1) * W)}" cy="${n(hash(i, seed + 2) * H)}" r="${n(r)}" style="fill:url(#${id}-${i % 2 ? 'a' : 'b'})"/>`; }
  return `${s}<rect width="${W}" height="${H}" style="fill:url(#${id}-v)"/>`;
}

// ---------------------------------------------------------------- labels
export const txt = (x, y, s, o = {}) => `<text x="${n(x)}" y="${n(y)}" text-anchor="${o.anchor ?? 'middle'}" style="font-family:var(${o.display ? '--sim-font-display' : '--sim-font'});font-size:${o.size ?? 15}px;font-weight:${o.weight ?? (o.display ? 600 : 800)};fill:${o.col ?? INK}${o.op != null ? `;opacity:${o.op}` : ''}">${s}</text>`;
const textW = (s, size) => String(s).length * size * 0.56;
/** A rimmed label. x is the middle (anchor 'start' or 'end': that edge). @opts size, anchor, rim, op, fillCol, col */
export function tag(x, y, s, o = {}) {
  const size = o.size ?? 15, w = textW(s, size) + 18, h = size + 13, r = Math.min(10, h / 2) * (lookOf().radius ?? 1);
  const x0 = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w / 2;
  return `<g${o.op != null ? ` style="opacity:${o.op}"` : ''}><rect x="${n(x0)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" ${fill(o.fillCol ?? PAPER, `stroke:${o.rim ?? 'var(--sim-stroke)'};stroke-width:2.5`)}/>`
    + txt(x0 + w / 2, y + size * 0.35, s, { size, col: o.col, display: o.display, weight: o.weight }) + '</g>';
}
export const tagW = (s, size = 15) => textW(s, size) + 18;
export const leader = (x0, y0, x1, y1, col = INK, w = 2.5, op = 1) => `<path d="M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}" ${stroke(col, w, `opacity:${op}`)}/><circle cx="${n(x1)}" cy="${n(y1)}" r="4" ${fill(col, `opacity:${op}`)}/>`;
/** o.back: the scene's own backdrop markup, drawn behind the body inside the frame. */
export function frame(st, id, body, o = {}) {
  const r = 18 * (lookOf().radius ?? 1), m = 1;
  return `<defs><clipPath id="${id}-clip"><rect x="${m}" y="${m}" width="${st.W - 2 * m}" height="${st.H - 2 * m}" rx="${r}"/></clipPath></defs>`
    + `<g clip-path="url(#${id}-clip)">${o.back ?? field(st, id, o.field)}${body}</g>`
    + `<rect x="${m}" y="${m}" width="${st.W - 2 * m}" height="${st.H - 2 * m}" rx="${r}" ${stroke(cm('var(--sim-stroke)', DEEP, 60), 2)}/>`;
}
/** A soft plate that lets the field through. o.fillCol, o.rim. */
export const panel = (x, y, w, h, o = {}) => {
  const r = n(14 * (lookOf().radius ?? 1));
  return `<rect x="${n(x + 3)}" y="${n(y + 5)}" width="${n(w)}" height="${n(h)}" rx="${r}" style="fill:${dk('var(--sim-stroke)', 50)};opacity:0.22;filter:blur(5px)"/><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${r}" style="fill:${o.fillCol ?? cm(PAPER, 'transparent', 84)};stroke:${o.rim ?? cm('var(--sim-stroke)', PAPER, 70)};stroke-width:2"/>`;
};

// Motion that ends by itself. The resting style is the end state, so a cold start, resume, Previous or reduced motion all show the end.
export const BODY_CSS = `
svg .ba-go { offset-distance: 100%; offset-rotate: 0deg; animation: ba-go var(--t, 1.8s) cubic-bezier(0.45, 0, 0.3, 1) var(--d, 0.15s) backwards; }
@keyframes ba-go { from { offset-distance: 0%; } }
svg .ba-pop { transform-box: fill-box; transform-origin: center; animation: ba-pop 0.55s var(--look-spring-soft, ease-out) both; }
@keyframes ba-pop { from { transform: scale(0.82); opacity: 0.2; } }
`;
/** inner, drawn at the origin, travels along the path d and rests at its end. */
export const travel = (inner, d, o = {}) => `<g class="ba-go" style="offset-path:path('${d}');--t:${o.t ?? 1.8}s;--d:${o.d ?? 0.15}s">${inner}</g>`;
export const pop = (inner) => `<g class="ba-pop">${inner}</g>`;

const part = (o, id, body) => `<g data-part="${id}"${o.dim?.(id) ? ' style="opacity:0.4"' : ''}>${body}</g>`;
const rim = (o, id, w = 2.4) => (o.lit?.(id) ? w + 1.6 : w);

// ---------------------------------------------------------------- male system
const M_BODY = 'M64 -10C58 70 50 140 68 202C62 214 52 226 44 244C36 262 28 280 27 292Q26 312 44 311Q60 308 70 286C76 272 84 258 96 248C88 272 90 332 128 342C174 348 192 304 180 266C200 274 242 280 282 264C340 244 356 180 344 110C336 60 326 20 320 -10Z';
const M_VAS = 'M158 262C132 240 88 186 86 130C82 72 168 60 214 94C236 112 224 158 192 188L160 204';
const M_URETHRA = 'M150 172L150 206C150 232 120 236 97 250C78 260 58 278 42 300';
export const MALE_ROUTE = `${M_VAS}L150 206C150 232 120 236 97 250C78 260 58 278 42 300`;
export const MALE_PT = {
  testis: [132, 296], scrotum: [176, 318], vas: [86, 122], urethra: [86, 256], penis: [50, 268], vesicle: [234, 148],
  prostate: [150, 200], bladder: [150, 126], placeA: [150, 110], placeB: [132, 296],
};
function vertebrae() {
  let s = '';
  const P = [[304, 2], [312, 40], [318, 78], [320, 116], [316, 154], [306, 190], [290, 222]];
  P.forEach(([x, y], i) => {
    const rot = 4 + i * -5 + (i > 3 ? (i - 3) * -5 : 0), [g, url] = lightGrad(BODY.spine, { hi: 40, lo: 74 });
    s += `<defs>${g}</defs><g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 20}" y="${y - 14}" width="40" height="27" rx="8" style="fill:${url};stroke:${dk(BODY.spine, 62)};stroke-width:1.6"/>`
      + stipple(x - 16, y - 11, 32, 21, 8, dk(BODY.spine, 60), 1, 20 + i, 0.5);
    if (i < P.length - 1) s += `<rect x="${x - 18}" y="${y + 14}" width="36" height="8" rx="4" style="fill:${BODY.disc};stroke:${dk(BODY.disc, 66)};stroke-width:1.2"/>`;
    s += '</g>';
  });
  return s;
}
export function maleSystemSvg(x, y, k, o = {}) {
  const has = (p) => !o.parts || o.parts.includes(p);
  let s = `<g transform="translate(${n(x)} ${n(y)}) scale(${k})">`;
  const fatLines = [0, 1, 2].map((i) => `<path d="M${70 + i * 8} ${-10}C${64 + i * 8} 70 ${56 + i * 8} 140 ${74 + i * 8} 200" style="fill:none;stroke:${lt(BODY.tissue, 60)};stroke-width:2;opacity:${0.45 - i * 0.12}"/>`).join('');
  s += form(M_BODY, BODY.tissue, { ao: 22, aoOp: 0.42, rim: 2.8, rimCol: BODY.tissueRim, hi: 66, lo: 86, cx: 0.3, cy: 0.2, inner: fatLines + vertebrae() });
  // quiet neighbours for depth: the pubic bone and the bowel behind
  s += form('M250 112C272 120 276 170 262 212C256 232 240 252 222 258C214 248 232 226 238 204C246 172 242 134 232 120C236 112 244 110 250 112Z', cm(BODY.tissue, S(5), 72), { ao: 8, rim: 1.4, aoOp: 0.4, rimCol: dk(BODY.tissue, 62) });
  s += form('M84 172C92 164 104 170 106 186C108 204 100 220 92 218C82 214 76 186 84 172Z', cm(BODY.spine, BODY.tissue, 60), { ao: 6, rim: 1.4, hi: 34, rimCol: dk(BODY.tissue, 62), inner: stipple(78, 168, 32, 50, 12, dk(BODY.spine, 60), 0.9, 41, 0.4) });
  if (has('bladder')) {
    const out = 'M94 126C92 84 208 82 208 126C208 160 172 180 150 180C128 180 96 160 94 126Z', inn = 'M105 126C104 96 197 94 197 126C197 152 168 169 150 169C132 169 106 152 105 126Z';
    s += part(o, 'bladder', form(out, BODY.bladderWall, { ao: 8, rim: rim(o, 'bladder'), hi: 40 }) + form(inn, BODY.bladder, { ao: 10, rim: 1.4, hi: 44, lo: 78, aoOp: 0.3, inner: `<path d="M112 116C130 106 170 106 190 118" style="fill:none;stroke:${lt(BODY.bladder, 30)};stroke-width:3;opacity:0.7"/>` })
      + `<path d="M118 102C132 94 152 92 170 96" ${stroke(lt(BODY.bladder, 36), 5, 'opacity:0.75')}/>`);
  }
  if (has('vesicle')) {
    const d = 'M200 182C224 180 256 152 266 124C270 110 252 102 242 114C234 104 220 114 224 128C212 132 198 156 192 174Z';
    const coil = `<path d="M204 172C216 166 216 154 226 152C238 150 232 138 244 134C254 130 250 120 258 118" style="fill:none;stroke:${dk(BODY.vesicle, 60)};stroke-width:3;opacity:0.55;stroke-linecap:round"/><path d="M212 176C224 170 226 160 236 158C248 154 244 144 254 140" style="fill:none;stroke:${lt(BODY.vesicle, 46)};stroke-width:2.2;opacity:0.55;stroke-linecap:round"/>`;
    s += part(o, 'vesicle', form(d, BODY.vesicle, { ao: 7, rim: rim(o, 'vesicle'), inner: coil }));
  }
  if (has('scrotum')) {
    const d = 'M96 248C88 272 90 332 128 342C174 348 192 304 180 266C154 244 120 238 96 248Z';
    const folds = [0, 1, 2, 3, 4].map((i) => `<path d="M${112 + i * 16} 346Q${108 + i * 16} 332 ${116 + i * 15} 322" style="fill:none;stroke:${dk(BODY.skin, 70)};stroke-width:1.6;opacity:0.5"/>`).join('');
    s += part(o, 'scrotum', form(d, BODY.skin, { ao: 10, rim: rim(o, 'scrotum', 2.6), hi: 60, inner: folds }));
  }
  if (has('testis')) {
    const cap = `<path d="M152 262C170 268 172 300 156 322C166 300 164 276 150 268Z" style="fill:${cm(BODY.testis, S(4), 62)};stroke:${dk(BODY.testis, 58)};stroke-width:1.6"/>`;
    let septa = '';
    for (let i = 0; i < 9; i++) { const a = 0.5 + i * 0.62; septa += `<path d="M150 276Q${n(132 + Math.cos(a) * 18)} ${n(296 + Math.sin(a) * 22)} ${n(132 + Math.cos(a) * 29)} ${n(296 + Math.sin(a) * 37)}" style="fill:none;stroke:${dk(BODY.testis, 66)};stroke-width:1.5;opacity:0.5"/>`; }
    let curls = '';
    for (let i = 0; i < 26; i++) { const a = hash(i, 7) * 6.28, d = 8 + hash(i, 8) * 22, cx = 130 + Math.cos(a) * d * 0.85, cy = 296 + Math.sin(a) * d * 1.1; curls += `<path d="M${n(cx - 3)} ${n(cy)}q2 -4 4 0t4 0" style="fill:none;stroke:${lt(BODY.testis, 60)};stroke-width:1.3;opacity:0.5"/>`; }
    s += part(o, 'testis', `<ellipse cx="132" cy="296" rx="35" ry="42" style="fill:${lt(BODY.skin, 70)};opacity:0.55"/>` + form('M132 256C152 256 162 276 162 296C162 318 150 336 132 336C112 336 102 316 102 296C102 276 114 256 132 256Z', BODY.testis, { ao: 11, rim: rim(o, 'testis', 2.6), inner: septa + curls }) + cap);
  }
  if (has('prostate')) {
    const d = 'M120 198C118 176 182 176 180 198C182 222 166 232 150 232C134 232 118 222 120 198Z';
    let lob = '';
    for (let i = 0; i < 10; i++) { const a = i * 0.63; lob += `<path d="M${n(150 + Math.cos(a) * 9)} ${n(204 + Math.sin(a) * 8)}L${n(150 + Math.cos(a) * 28)} ${n(204 + Math.sin(a) * 25)}" style="fill:none;stroke:${dk(BODY.prostate, 60)};stroke-width:1.3;opacity:0.45"/>`; }
    s += part(o, 'prostate', form(d, BODY.prostate, { ao: 9, rim: rim(o, 'prostate'), inner: lob }));
  }
  // the penis in section: spongy tissue round the urethra
  if (has('urethra')) {
    const sp = `<path d="${M_URETHRA.replace('M150 172L150 206', 'M150 214')}" ${stroke(cm(BODY.skin, S(4), 74), 20, 'opacity:0.75')}/>`;
    s += part(o, 'urethra', sp + tube(M_URETHRA, BODY.urethra, 6.5, { lit: o.lit?.('urethra') }));
  }
  if (has('vas')) s += part(o, 'vas', tube(M_VAS, BODY.vas, 6.5, { lit: o.lit?.('vas') }));
  return s + (o.extra ?? '') + '</g>';
}

// ---------------------------------------------------------------- female system
const F_WALL = 'M134 82Q220 22 306 82C310 142 264 188 252 226L249 254L191 254L188 226C176 188 130 142 134 82Z';
const F_CAV = 'M170 96Q220 80 270 96Q242 152 227 200L213 200Q198 152 170 96Z';
const TUBE_R = [[268, 98], [334, 54], [386, 42], [404, 92]];
const mirror = (p) => p.map(([a, b]) => [440 - a, b]);
const cavPts = (() => {
  const q = (a, b, c, u) => { const v = 1 - u; return [v * v * a[0] + 2 * v * u * b[0] + u * u * c[0], v * v * a[1] + 2 * v * u * b[1] + u * u * c[1]]; };
  const out = []; const A = [170, 96], B = [270, 96], C = [227, 200], D = [213, 200];
  for (const [p0, p1, p2] of [[A, [220, 80], B], [B, [242, 152], C], [D, [198, 152], A]]) for (let i = 0; i < 16; i++) out.push(q(p0, p1, p2, i / 16));
  return out.map((p) => { const dx = p[0] - 220, dy = p[1] - 128, l = Math.hypot(dx, dy) || 1; return [p[0], p[1], dx / l, dy / l]; });
})();
export const FEMALE_PT = {
  ovaryL: [86, 150], ovaryR: [354, 150], tubeL: [84, 62], tubeR: [356, 62], fundus: [220, 54], lining: [186, 110], cavity: [220, 118],
  cervix: [220, 238], vagina: [220, 298], wall: [288, 132],
};
/** A point on the right or left oviduct, u 0 at the uterus, 1 at the fringes. */
export const tubePt = (side, u) => bez(side === 'L' ? mirror(TUBE_R) : TUBE_R, u);
function oviduct(side, o) {
  const P = side === 'L' ? mirror(TUBE_R) : TUBE_R, pts = [], ws = [];
  for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push(bez(P, u)); ws.push(lerp(6.5, 14, Math.pow(u, 1.5)) + Math.sin(u * 9) * 0.5); }
  const d = tapered(pts, ws);
  let folds = '';
  for (const off of [-0.5, 0, 0.5]) {
    let f = '';
    pts.forEach((p, i) => { if (i < 5) return; const a = pts[i - 1], tx = p[0] - a[0], ty = p[1] - a[1], l = Math.hypot(tx, ty) || 1; f += `${f ? 'L' : 'M'}${n(p[0] - (ty / l) * ws[i] * off + Math.sin(i * 2) * 0.8)} ${n(p[1] + (tx / l) * ws[i] * off)}`; });
    folds += `<path d="${f}" style="fill:none;stroke:${dk(BODY.wall, 62)};stroke-width:1.3;opacity:0.5"/>`;
  }
  let s = form(d, lt(BODY.wall, 80), { ao: 7, rim: rim(o, 'tube', 2), inner: folds, aoOp: 0.55 });
  // fringes round the open end, curling down towards the ovary
  const end = P[3], dir = side === 'L' ? -1 : 1;
  for (let i = 0; i < 9; i++) {
    const a = -0.5 + i * 0.36, L = 26 + hash(i, 3) * 13, mid = [end[0] + dir * Math.cos(a) * L * 0.55, end[1] + 4 + Math.sin(a) * L * 0.55], tip = [end[0] + dir * (Math.cos(a) * L - (i > 5 ? (i - 5) * 3 : 0)), end[1] + 10 + Math.sin(a) * L + (i % 2) * 3];
    s += form(tapered([[end[0] - dir * 2, end[1] + 2], mid, tip], [6, 4, 1.4]), lt(BODY.wall, 74), { ao: 3, rim: 1.4, aoOp: 0.4 });
  }
  return s;
}
function ovary(side, o) {
  const cx = side === 'L' ? 86 : 354, cy = 150, rot = side === 'L' ? 0.22 : -0.22;
  let d = '';
  for (let i = 0; i <= 40; i++) { const a = (i / 40) * 6.283, r = 1 + Math.sin(a * 5 + (side === 'L' ? 0 : 1.6)) * 0.05, x = Math.cos(a) * 39 * r, y = Math.sin(a) * 25 * r; d += `${i ? 'L' : 'M'}${n(cx + x * Math.cos(rot) - y * Math.sin(rot))} ${n(cy + x * Math.sin(rot) + y * Math.cos(rot))}`; }
  let inner = stipple(cx - 40, cy - 28, 80, 56, 40, dk(BODY.ovary, 60), 0.9, side === 'L' ? 5 : 9, 0.4);
  const fol = side === 'L' ? [[-18, -6, 8], [8, 6, 6], [20, -8, 4.5], [-4, 12, 4], [-26, 6, 3.5], [8, -13, 3.5]] : [[16, -5, 9.5], [-12, 8, 5.5], [-22, -6, 4], [6, 12, 3.5], [26, 8, 3.5], [-6, -13, 3.5]];
  const [g, url] = lightGrad(lt(BODY.egg, 44), { hi: 40, lo: 80 });
  for (const [a, b, r] of fol) inner += `<circle cx="${cx + a}" cy="${cy + b}" r="${r}" style="fill:${url};stroke:${dk(BODY.ovary, 62)};stroke-width:1.2"/>` + (r > 6 ? `<circle cx="${cx + a - 1}" cy="${cy + b + 1}" r="${n(r * 0.3)}" style="fill:${BODY.egg}"/>` : '');
  return `<defs>${g}</defs>${form(`${d}Z`, BODY.ovary, { ao: 10, rim: rim(o, 'ovary', 2.4), inner })}`;
}
/** @opts dim, lit, lining (0..1, default 0.7), shed (0..1), vessels, egg {x, y} in box units, copperT, block */
export function femaleSystemSvg(x, y, k, o = {}) {
  const t = 6 + (o.lining ?? 0.7) * 25, id = uid('f');
  let s = `<g transform="translate(${n(x)} ${n(y)}) scale(${k})">`;
  s += `<defs><clipPath id="${id}-w"><path d="${F_WALL}"/></clipPath></defs>`;
  // the thin veil of tissue that carries tube and ovary
  const veil = (m) => { const X = (v) => (m ? 440 - v : v); return `M${X(150)} 104C${X(112)} 92 ${X(82)} 84 ${X(52)} 98C${X(50)} 136 ${X(78)} 170 ${X(112)} 178C${X(132)} 170 ${X(146)} 156 ${X(160)} 148Z`; };
  s += part(o, 'ligament', form(veil(false), lt(BODY.tissue, 86), { ao: 10, rim: 1, aoOp: 0.28, rimCol: BODY.tissueRim }) + form(veil(true), lt(BODY.tissue, 86), { ao: 10, rim: 1, aoOp: 0.28, rimCol: BODY.tissueRim })
    + tube('M150 126L112 142', BODY.tissue, 6) + tube('M290 126L328 142', BODY.tissue, 6));
  s += part(o, 'tube', oviduct('L', o) + oviduct('R', o));
  s += part(o, 'ovary', ovary('L', o) + ovary('R', o));
  // vagina first, the uterus sits over its top
  const vagIn = `<path d="M206 256C196 282 196 318 202 344L238 344C244 318 244 282 234 256Z" style="fill:${lt(BODY.wall, 52)}"/>` + [266, 278, 290, 302, 314, 326, 338].map((yy, i) => `<path d="M${200 - (i % 2)} ${yy}Q220 ${yy + 8} ${240 + (i % 2)} ${yy}" style="fill:none;stroke:${dk(BODY.wall, 74)};stroke-width:2.2;opacity:0.6"/><path d="M${202} ${yy + 3}Q220 ${yy + 11} ${238} ${yy + 3}" style="fill:none;stroke:${lt(BODY.wall, 34)};stroke-width:1.6;opacity:0.6"/>`).join('');
  s += part(o, 'vagina', form('M192 250C174 278 174 316 182 344L258 344C266 316 266 278 248 250Z', BODY.wall, { ao: 12, rim: rim(o, 'vagina', 2.6), inner: vagIn }));
  const rings = [0.93, 0.86, 0.79].map((q) => `<path d="${F_WALL}" transform="translate(${n(220 * (1 - q))} ${n(120 * (1 - q))}) scale(${q})" style="fill:none;stroke:${dk(BODY.wall, 62)};stroke-width:${n(1.5 / q)};opacity:0.42"/>`).join('');
  s += part(o, 'uterus', form(F_WALL, BODY.wall, { ao: 18, aoOp: 0.5, rim: rim(o, 'uterus', 2.8), hi: 58, inner: rings }));
  const canal = `<path d="M220 198L220 256" ${stroke(dk(BODY.wall, 60), 11)}/><path d="M220 198L220 256" ${stroke(lt(BODY.wall, 46), 6.5)}/>`;
  s += part(o, 'cervix', form('M188 226L252 226L249 254L191 254Z', cm(BODY.wall, S(5), 82), { ao: 8, rim: rim(o, 'cervix'), hi: 30, inner: `<path d="M192 240Q220 248 248 240" style="fill:none;stroke:${dk(BODY.wall, 60)};stroke-width:1.5;opacity:0.5"/>` }) + canal);
  // lining: one band round the cavity, inside the wall, with glands and vessels that grow with it
  const gr = lightGrad(BODY.lining, { hi: 50, lo: 74 });
  let lin = `<defs>${gr[0]}</defs><g clip-path="url(#${id}-w)"><path d="${F_CAV}" ${stroke(dk(BODY.lining, 62), t * 2 + 2.6)}/><path d="${F_CAV}" ${stroke(BODY.lining, t * 2)}/><path d="${F_CAV}" ${stroke(lt(BODY.lining, 56), t * 0.7, 'opacity:0.6')}/>`;
  cavPts.forEach(([a, b, nx, ny], i) => { if (i % 2) return; const L = t * (0.5 + hash(i, 4) * 0.4); lin += `<path d="M${n(a + nx * 2)} ${n(b + ny * 2)}Q${n(a + nx * L * 0.5 + ny * 2)} ${n(b + ny * L * 0.5 - nx * 2)} ${n(a + nx * L)} ${n(b + ny * L)}" style="fill:none;stroke:${dk(BODY.lining, 62)};stroke-width:${t > 16 ? 2.2 : 1.5};stroke-linecap:round;opacity:0.55"/>`; });
  if (o.vessels) cavPts.forEach(([a, b, nx, ny], i) => { if ((i + 1) % 4) return; let d = ''; for (let j = 0; j <= 8; j++) { const u = j / 8, r = t * (1.05 - u * 0.9), w = Math.sin(u * 9 + i) * 2.4; d += `${j ? 'L' : 'M'}${n(a + nx * r + ny * w)} ${n(b + ny * r - nx * w)}`; } lin += `<path d="${d}" ${stroke(dk(BODY.vessel, 80), 2.4)}/>`; });
  s += part(o, 'lining', `${lin}</g>`);
  const fl = `<path d="M176 100Q220 86 264 100" style="fill:none;stroke:${lt(BODY.lining, 40)};stroke-width:3;opacity:0.8"/>`;
  s += part(o, 'cavity', form(F_CAV, BODY.cavity, { ao: 5, aoOp: 0.3, rim: 2, rimCol: BODY.liningLit, hi: 70, inner: fl + stipple(180, 100, 80, 60, 12, BODY.liningLit, 1.4, 12, 0.5) }));
  if (o.shed) {
    const a = Math.min(1, o.shed);
    for (const [px, py, r, rt] of [[200, 118, 7, 20], [238, 126, 6, -30], [222, 150, 7, 10], [212, 172, 5, -15], [224, 190, 5.5, 25], [220, 218, 4.5, 0], [220, 244, 4.5, 10], [221, 272, 5, -10], [219, 304, 4.5, 15]]) {
      s += `<g transform="rotate(${rt} ${px} ${py})" style="opacity:${a}"><path d="M${px - r} ${py}Q${px - r * 0.2} ${py - r * 1.2} ${px + r} ${py - r * 0.3}Q${px + r * 0.6} ${py + r} ${px - r} ${py}Z" style="fill:${BODY.lining};stroke:${dk(BODY.lining, 62)};stroke-width:1.4"/></g>`;
    }
  }
  if (o.copperT) s += copperT(220, 98, 1);
  if (o.block) for (const sd of ['L', 'R']) { const [bx, by] = tubePt(sd, 0.42); s += `<rect x="${n(bx - 7)}" y="${n(by - 16)}" width="14" height="32" rx="4" style="fill:${lt(INK, 86)};stroke:${PAPER};stroke-width:2"/><rect x="${n(bx - 5)}" y="${n(by - 13)}" width="3" height="26" rx="1.5" style="fill:${PAPER};opacity:0.4"/>`; }
  if (o.egg) s += eggSvg(o.egg.x, o.egg.y, o.egg.r ?? 9, {});
  return s + (o.extra ?? '') + '</g>';
}
export function copperT(x, y, k) {
  const c = cm(S(8), S(2), 70), id = uid('t');
  const body = 'M-31 7Q0 -7 31 7M0 1L0 88';
  return `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" style="stop-color:${lt(cm(S(1), PAPER, 22), 60)}"/><stop offset="0.5" style="stop-color:${cm(S(1), PAPER, 22)}"/><stop offset="1" style="stop-color:${dk(cm(S(1), PAPER, 22), 68)}"/></linearGradient></defs><g transform="translate(${x} ${y}) scale(${k})"><path d="M0 88L-5 124M0 88L5 124" ${stroke(dk(c, 55), 2)}/><path d="${body}" ${stroke(dk(c, 42), 8.5)}/><path d="${body}" ${stroke(cm(S(1), PAPER, 22), 5.5)}/><path d="${body}" ${stroke(lt(PAPER, 60), 1.8, 'transform:translate(-1px,-1px)')}/>`
    + Array.from({ length: 11 }, (_, i) => `<path d="M-6 ${24 + i * 5}L6 ${26 + i * 5}" ${stroke(i % 2 ? dk(c, 76) : lt(c, 76), 3.4)}/>`).join('') + '</g>';
}

// ---------------------------------------------------------------- living cells
/** A living cell: soft membrane, grainy cytoplasm, a nucleus. @opts col, nuc (false: none), seed, grains */
export function cellSvg(x, y, r, o = {}) {
  const col = o.col ?? cm(BODY.egg, S(4), 82), id = uid('e'), [g, url] = lightGrad(col, { hi: 50, lo: 58, r: 0.8 });
  let s = `<defs>${g}<clipPath id="${id}"><circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/></clipPath></defs><ellipse cx="${n(x + r * 0.16)}" cy="${n(y + r * 0.96)}" rx="${n(r * 0.92)}" ry="${n(r * 0.22)}" style="fill:${dk(col, 30)};opacity:0.22;filter:blur(${n(r * 0.1)}px)"/>`;
  s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" style="fill:${url}"/><g clip-path="url(#${id})">`;
  const N = o.grains ?? Math.min(90, Math.round(r * 1.4));
  for (let i = 0; i < N; i++) { const a = hash(i, 11) * 6.283, d = Math.sqrt(hash(i, 12)) * r * 0.92; s += `<circle cx="${n(x + Math.cos(a) * d)}" cy="${n(y + Math.sin(a) * d)}" r="${n(Math.max(0.6, r * 0.018) * (0.7 + hash(i, 13)))}" style="fill:${i % 3 ? dk(col, 62) : lt(col, 44)};opacity:0.38"/>`; }
  s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" style="fill:none;stroke:${dk(col, 44)};stroke-width:${n(r * 0.14)};opacity:0.42;filter:blur(${n(r * 0.07)}px)"/></g>`;
  s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" style="fill:none;stroke:${dk(col, 58)};stroke-width:${n(Math.max(1, r * 0.03))}"/><path d="M${n(x - r * 0.72)} ${n(y - r * 0.32)}A${n(r * 0.8)} ${n(r * 0.8)} 0 0 1 ${n(x - r * 0.1)} ${n(y - r * 0.78)}" style="fill:none;stroke:${lt(col, 30)};stroke-width:${n(Math.max(1, r * 0.05))};stroke-linecap:round;opacity:0.7"/>`;
  if (o.nuc !== false) {
    const nr = r * (o.nucR ?? 0.42), nx = x - r * 0.06, ny = y - r * 0.05, [ng, nu] = lightGrad('var(--sim-nucleus)', { hi: 50, lo: 72 });
    s += `<defs>${ng}</defs><circle cx="${n(nx)}" cy="${n(ny)}" r="${n(nr)}" style="fill:${nu};stroke:var(--sim-nucleus-stroke);stroke-width:${n(Math.max(0.8, r * 0.02))};opacity:0.9"/>`;
  }
  return s;
}
export function eggSvg(x, y, r, o = {}) {
  let s = '';
  if (r > 22) {
    const crown = cm(BODY.egg, PAPER, 70), [g, url] = lightGrad(crown, { hi: 40, lo: 70, r: 0.9 });
    s += `<defs>${g}</defs>`;
    for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283 + hash(i, 7) * 0.12, d = r * (1.28 + hash(i, 8) * 0.07), q = r * (0.1 + hash(i, 9) * 0.045); s += `<circle cx="${n(x + Math.cos(a) * d)}" cy="${n(y + Math.sin(a) * d)}" r="${n(q)}" style="fill:${url};stroke:${dk(crown, 62)};stroke-width:0.8"/>`; }
  }
  s += cellSvg(x, y, r, { col: BODY.egg, nucR: 0.42, grains: r > 22 ? 90 : 12 });
  if (r > 22) s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r * 1.09)}" style="fill:none;stroke:var(--sim-glass);stroke-width:${n(r * 0.1)};opacity:0.6"/><path d="M${n(x - r * 0.98)} ${n(y - r * 0.4)}A${n(r * 1.09)} ${n(r * 1.09)} 0 0 1 ${n(x - r * 0.2)} ${n(y - r * 1.04)}" style="fill:none;stroke:${lt('var(--sim-glass)', 40)};stroke-width:${n(r * 0.05)};stroke-linecap:round;opacity:0.85"/>`;
  return s;
}
/** Head at (x, y), pointing at angle deg (0 = right). L: tail length, h: head half length. */
export function spermSvg(x, y, h, L, deg = 0, o = {}) {
  const pts = [], ws = [];
  for (let i = 0; i <= 22; i++) { const u = i / 22; pts.push([-h * 0.9 - u * L, Math.sin(u * 7.5 + (o.phase ?? 0)) * h * 0.7 * Math.pow(u, 0.8)]); ws.push(lerp(h * 0.2, Math.max(0.4, h * 0.05), Math.pow(u, 0.7))); }
  const col = BODY.sperm, [g, url] = lightGrad(col, { hi: 48, lo: 60 });
  const cap = h > 7 ? `<ellipse cx="${n(h * 0.42)}" cy="0" rx="${n(h * 0.5)}" ry="${n(h * 0.52)}" style="fill:${lt(col, 40)};opacity:0.6"/><ellipse cx="${n(-h * 0.2)}" cy="${n(h * 0.06)}" rx="${n(h * 0.46)}" ry="${n(h * 0.38)}" style="fill:${dk(col, 56)};opacity:0.5"/><ellipse cx="${n(h * 0.3)}" cy="${n(-h * 0.34)}" rx="${n(h * 0.26)}" ry="${n(h * 0.12)}" style="fill:${lt(col, 16)};opacity:0.75"/>` : '';
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${deg})"><defs>${g}</defs><path d="${tapered(pts, ws)}" style="fill:${dk(col, 82)};stroke:${dk(col, 56)};stroke-width:0.6"/><ellipse cx="0" cy="0" rx="${n(h)}" ry="${n(h * 0.68)}" style="fill:${url};stroke:${dk(col, 56)};stroke-width:${h > 8 ? 2 : 1}"/>${cap}</g>`;
}

// ---------------------------------------------------------------- pregnancy
function cluster(x, y, r, count, col) {
  const [g, url] = lightGrad(col, { hi: 50, lo: 62 });
  let s = `<defs>${g}</defs>`;
  const pts = count === 4 ? [[-0.5, -0.45], [0.5, -0.45], [-0.5, 0.5], [0.5, 0.5]] : [...Array.from({ length: 11 }, (_, i) => [Math.cos(i * 0.571) * 0.84, Math.sin(i * 0.571) * 0.84]), [-0.3, -0.2], [0.34, -0.22], [0, 0.32]];
  for (const [a, b] of pts) { const q = r * (count === 4 ? 0.58 : 0.34); s += `<circle cx="${n(x + a * r)}" cy="${n(y + b * r)}" r="${n(q)}" style="fill:${url};stroke:${dk(col, 56)};stroke-width:${n(Math.max(0.8, r * 0.05))}"/><circle cx="${n(x + a * r)}" cy="${n(y + b * r)}" r="${n(q * 0.26)}" style="fill:${dk(col, 70)};opacity:0.6"/>`; }
  return s;
}
const limb = (pts, ws, col) => form(tapered(pts, ws), col, { ao: 5, rim: 1.5, aoOp: 0.45, rimCol: dk(col, 56), hi: 44, lo: 74 });
/** Stage i of 0..10, about h tall, curled, facing right. A smooth silhouette: no eye, nose or mouth. */
export function embryoSvg(i, x, y, h, o = {}) {
  const col = o.col ?? BODY.fetus;
  if (i === 0) return cluster(x, y, h * 0.42, 4, col);
  if (i === 1) return cluster(x, y, h * 0.38, 12, col);
  const K = h / 100, p = (a, b) => `${n(a)} ${n(b)}`;
  const t = (i - 2) / 8;                                      // 0 early embryo .. 1 ready for birth
  const R = lerp(21, 23, t), hx = lerp(4, 9, t), hy = lerp(-27, -29, t);
  const back = lerp(-22, -35, Math.min(1, t * 1.6)), rump = lerp(26, 42, Math.min(1, t * 1.5)), belly = lerp(10, 25, Math.min(1, t * 1.5));
  const tail = clamp01(1 - (i - 2) / 3);
  const body = `M${p(hx + R * 0.86, hy + R * 0.52)}C${p(hx + R * 1.12, hy - R * 0.2)} ${p(hx + R * 0.82, hy - R * 1.06)} ${p(hx - R * 0.02, hy - R * 1.04)}C${p(hx - R * 0.92, hy - R * 1.02)} ${p(hx - R * 1.18, hy - R * 0.12)} ${p(hx - R * 0.72, hy + R * 0.62)}`
    + `C${p(back - 2, -8)} ${p(back - 6, 18)} ${p(back + 6, rump - 8)}C${p(back + 12, rump + 4)} ${p(-4, rump + 8)} ${p(belly - 12, rump - 2)}C${p(belly + 6, rump - 16)} ${p(belly + 8, 6)} ${p(hx + R * 0.34, hy + R * 1.0)}C${p(hx + R * 0.62, hy + R * 0.98)} ${p(hx + R * 0.8, hy + R * 0.76)} ${p(hx + R * 0.86, hy + R * 0.52)}Z`;
  let inner = '';
  // back line and, early on, the blocks along the back; later a soft crease at the neck and ribs
  if (t < 0.45) for (let j = 0; j < 12; j++) { const u = j / 11, bx = lerp(hx - R * 0.72, back + 7, u) + Math.sin(u * 3.1) * -7, by = lerp(hy + R * 0.7, rump - 6, u); inner += `<ellipse cx="${n(bx + 6)}" cy="${n(by)}" rx="4" ry="2.3" transform="rotate(${n(lerp(-30, 30, u))} ${n(bx + 6)} ${n(by)})" style="fill:${dk(col, 76)};opacity:0.4"/>`; }
  else { inner += `<path d="M${p(hx - R * 0.5, hy + R * 0.86)}Q${p(hx + R * 0.1, hy + R * 1.14)} ${p(hx + R * 0.46, hy + R * 0.96)}" style="fill:none;stroke:${dk(col, 62)};stroke-width:2;opacity:0.5"/>`; for (let j = 0; j < 4; j++) inner += `<path d="M${p(back + 8 + j, 2 + j * 7)}q9 -3 16 1" style="fill:none;stroke:${dk(col, 70)};stroke-width:1.5;opacity:0.3"/>`; }
  inner += `<ellipse cx="${n(hx - R * 0.22)}" cy="${n(hy - R * 0.36)}" rx="${n(R * 0.62)}" ry="${n(R * 0.44)}" style="fill:${lt(col, 40)};opacity:0.42;filter:blur(3px)"/>`;
  inner += `<ellipse cx="${n(back + 16)}" cy="${n(rump - 22)}" rx="11" ry="20" style="fill:${lt(col, 40)};opacity:0.28;filter:blur(3px)"/>`;
  let s = `<g transform="translate(${n(x)} ${n(y)}) scale(${n(K * 100) / 100})${o.rot ? ` rotate(${o.rot})` : ''}">`;
  if (tail > 0) s += limb([[back + 12, rump - 2], [lerp(4, 14, tail), rump + 8], [lerp(10, 24, tail), lerp(rump + 2, rump - 16, tail)]], [8, 5, 1.6], col);
  s += form(body, col, { ao: 9, rim: 1.8, rimCol: dk(col, 54), hi: 50, lo: 72, aoOp: 0.5, inner });
  const l = clamp01((i - 3) / 3), lw = lerp(5, 9.5, t);
  if (l > 0) {
    const hip = [back + 14, rump - 8], knee = [lerp(hip[0] + 12, belly + 13, l), lerp(rump - 8, 12, l)], ankle = [lerp(hip[0] + 16, belly - 8, l), lerp(rump - 4, rump + 6, l)], foot = [lerp(hip[0] + 19, belly + 8, l), lerp(rump - 2, rump + 10, l)];
    s += limb([hip, [lerp(hip[0], knee[0], 0.55), lerp(hip[1], knee[1], 0.55) + 2], knee, [lerp(knee[0], ankle[0], 0.55) + 1, lerp(knee[1], ankle[1], 0.55)], ankle, foot], [lw * 1.3, lw * 1.12, lw * 0.86, lw * 0.74, lw * 0.56, lw * 0.34], col);
    if (i >= 7) for (let j = 0; j < 4; j++) s += `<path d="M${p(foot[0] - 2, foot[1] - 2 + j * 1.3)}l${n(4 + j * -0.3)} ${n(-1 + j * 0.9)}" style="fill:none;stroke:${dk(col, 62)};stroke-width:1;opacity:0.6"/>`;
    const sh = [hx - R * 0.42, hy + R * 1.08], elbow = [lerp(sh[0] + 7, belly - 2, l), lerp(sh[1] + 6, 8, l)], wrist = [lerp(sh[0] + 9, hx + R * 0.76, l), lerp(sh[1] + 7, hy + R * 1.08, l)];
    s += limb([sh, [lerp(sh[0], elbow[0], 0.5) - 1, lerp(sh[1], elbow[1], 0.5) + 1], elbow, wrist], [lw * 0.8, lw * 0.7, lw * 0.6, lw * 0.42], col);
    if (i >= 6) for (let j = 0; j < 3; j++) s += `<path d="M${p(wrist[0] - 1, wrist[1] - 1)}l${n(3 + j * 0.2)} ${n(-3 + j * 1.8)}" style="fill:none;stroke:${dk(col, 56)};stroke-width:1.5;stroke-linecap:round"/>`;
  }
  return s + '</g>';
}
/** The pregnant uterus in section around (cx, cy). o: g (growth 0..1), P, stage, down (head down), showPlacenta. Returns { svg, placenta, cord }. */
export function uterusHeld(cx, cy, o = {}) {
  const g = o.g ?? 1, rx = (o.P ? 112 : 136) * g, ry = (o.P ? 82 : 98) * g + 8;
  const shape = (a, b) => `M${n(cx - a)} ${n(cy - b * 0.12)}C${n(cx - a)} ${n(cy - b * 1.26)} ${n(cx + a)} ${n(cy - b * 1.26)} ${n(cx + a)} ${n(cy - b * 0.12)}C${n(cx + a)} ${n(cy + b * 0.74)} ${n(cx + 20)} ${n(cy + b * 1.0)} ${n(cx + 16)} ${n(cy + b * 1.08)}L${n(cx - 16)} ${n(cy + b * 1.08)}C${n(cx - 20)} ${n(cy + b * 1.0)} ${n(cx - a)} ${n(cy + b * 0.74)} ${n(cx - a)} ${n(cy - b * 0.12)}Z`;
  const rings = [0.98, 0.95, 0.92].map((q, i) => `<path d="${shape(rx + 26 * q - i * 2, ry + 24 * q - i * 2)}" style="fill:none;stroke:${dk(BODY.wall, 62)};stroke-width:1.4;opacity:0.4"/>`).join('');
  let s = form(shape(rx + 28, ry + 26), BODY.wall, { ao: 16, rim: 2.8, hi: 58, inner: rings });
  s += form(shape(rx + 9, ry + 8), BODY.lining, { ao: 5, rim: 1.4, hi: 50 });
  // the sac of fluid
  const sac = lightGrad(cm(S(1), PAPER, 20), { hi: 60, lo: 84, cx: 0.4, cy: 0.3 });
  s += form(shape(rx, ry), cm(S(1), PAPER, 20), { ao: 16, aoOp: 0.28, rim: 2, rimCol: lt(cm(S(1), PAPER, 30), 60), hi: 64, lo: 88, inner: stipple(cx - rx, cy - ry, rx * 2, ry * 2, 22, lt(S(1), 40), 1.5, 31, 0.3) }) + `<defs>${sac[0]}</defs>`;
  const px = cx + rx * 0.58, py = cy - ry * 0.8;
  const down = !!o.down, h = o.h ?? ry * 1.5, bx = cx - 4, by = cy + 2;
  const ex = down ? bx + h * 0.1 : bx + h * 0.08, ey = down ? by - h * 0.02 : by + h * 0.06;
  if (o.placenta) {
    const col = cm(S(6), S(5), 64), pd = `M${n(px - rx * 0.46)} ${n(py - ry * 0.02)}C${n(px - rx * 0.2)} ${n(py - ry * 0.32)} ${n(px + rx * 0.26)} ${n(py - ry * 0.34)} ${n(px + rx * 0.44)} ${n(py + ry * 0.24)}C${n(px + rx * 0.2)} ${n(py + ry * 0.26)} ${n(px - rx * 0.2)} ${n(py + ry * 0.28)} ${n(px - rx * 0.46)} ${n(py - ry * 0.02)}Z`;
    let lob = ''; for (let i = 0; i < 16; i++) { const a = hash(i, 51) * 6.28, d = hash(i, 52) * 0.8; lob += `<circle cx="${n(px + Math.cos(a) * rx * 0.36 * d)}" cy="${n(py + Math.sin(a) * ry * 0.2 * d)}" r="${n(3 + hash(i, 53) * 4)}" style="fill:${i % 2 ? lt(col, 62) : dk(col, 72)};opacity:0.5"/>`; }
    s += form(pd, col, { ao: 8, rim: 2, inner: lob });
    const cord = `M${n(px - 6)} ${n(py + ry * 0.18)}C${n(px + 40 * g)} ${n(py + ry * 0.9)} ${n(ex + 62 * g)} ${n(ey + 44 * g)} ${n(ex)} ${n(ey)}`, cc = cm(S(1), S(5), 56);
    s += `<path d="${cord}" ${stroke(dk(cc, 56), 8.5)}/><path d="${cord}" ${stroke(lt(cc, 68), 6)}/><path d="${cord}" ${stroke(dk(cc, 76), 6, 'stroke-dasharray:3 7;opacity:0.7;stroke-linecap:butt')}/>`;
  }
  s += pop(embryoSvg(o.stage ?? 10, bx, by, h, { rot: down ? 172 : 0 }));
  return { svg: s, placenta: [px, py], cord: [cx + rx * 0.5, cy + ry * 0.12], rx, ry };
}
