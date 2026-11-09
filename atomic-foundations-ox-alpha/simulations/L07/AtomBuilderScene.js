// AtomBuilderScene - companion to blk-l07-s2, "Building the First Eighteen Atoms".
// A big atom with K, L and M beside its element card, and the eighteen elements in three rows
// below, so a full shell followed by one electron alone in a new shell reads as a new row.
//   b0  h-he      walks hydrogen to helium: K full
//   b1  li-ne     walks lithium (2,1) to neon (2,8): L full
//   b2  na-ar     walks sodium (2,8,1) to argon (2,8,8)
//   b3  takeaway  free play: tap a tile or use the slider. Finding a full outer shell is the find.
// Each walk is a timed run covered by busy(); it ends on its last element and stays there.
import { SimScene } from 'simulations/base/kit/SimScene.js';
import { drawCard, mix, darken, inkOn, rr } from 'simulations/base/kit/SimLook.js';
import { lookOf } from 'simulations/base/kit/lookProfile.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { drawDepthField, drawNucleus, drawShell, drawSeat, drawElectron, shellPoints, drawFocus } from 'simulations/base/kit/SimAtom.js';
import { popIn, say, tag, SHELL } from './AtomBoard.js';

const CX = 184, CY = 182;
const RADII = [64, 112, 160];
const NUC_R = 38, ER = 10;
const CAP = [2, 8, 8];

const ELEMENTS = [
  ['H', 'Hydrogen', 0], ['He', 'Helium', 2], ['Li', 'Lithium', 4], ['Be', 'Beryllium', 5], ['B', 'Boron', 6],
  ['C', 'Carbon', 6], ['N', 'Nitrogen', 7], ['O', 'Oxygen', 8], ['F', 'Fluorine', 10], ['Ne', 'Neon', 10],
  ['Na', 'Sodium', 12], ['Mg', 'Magnesium', 12], ['Al', 'Aluminium', 14], ['Si', 'Silicon', 14], ['P', 'Phosphorus', 16],
  ['S', 'Sulfur', 16], ['Cl', 'Chlorine', 18], ['Ar', 'Argon', 22],
];

// Row = outer shell, column 0..7 (He sits over Ne).
const TILE = ELEMENTS.map((_, i) => {
  const z = i + 1;
  if (z <= 2) return { row: 0, col: z === 1 ? 0 : 7 };
  if (z <= 10) return { row: 1, col: z - 3 };
  return { row: 2, col: z - 11 };
});
const TAB = { x: 44, y: 360, w: 72, h: 44, gx: 8, gy: 8 };
// On a phone the last beat's tiles are finger targets: the atom and card shrink to make the room.
const PHONE = !!globalThis.matchMedia?.('(max-width: 600px)').matches;   // read once: a turned phone keeps its layout
const TAB_BIG = { ...TAB, y: 262, h: 76, gy: 9 };
const TOP_K = 0.74, TOP_X = (680 - 680 * TOP_K) / 2;

const S_HHE = 0, S_LINE = 1, S_NAAR = 2, S_FREE = 3;
const WALKS = [
  { from: 1, to: 2, period: 1.3, delay: 0.8 },
  { from: 3, to: 10, period: 0.62, delay: 0.7 },
  { from: 11, to: 18, period: 0.62, delay: 0.7 },
  null,
];
const FREE_Z = 11;

const configFor = (z) => [Math.min(z, 2), Math.min(Math.max(z - 2, 0), 8), Math.min(Math.max(z - 10, 0), 8)];
const outerOf = (z) => (z <= 2 ? 0 : z <= 10 ? 1 : 2);
const isFull = (z) => z === 2 || z === 10 || z === 18;
const opensShell = (z) => z === 3 || z === 11;
const tileBox = (i, t = TAB) => ({ x: t.x + TILE[i].col * (t.w + t.gx), y: t.y + TILE[i].row * (t.h + t.gy), w: t.w, h: t.h });

export class AtomBuilderScene extends SimScene {
  static BEAT_STEP_MAP = [S_HHE, S_LINE, S_NAAR, S_FREE].map((i) => [{ idx: i, dwellMs: null }]);
  static CONTROLS_IN_SIGHT = true;
  static CONTROLS = [
    { type: 'slider', id: 'z', label: 'Atomic number', min: 1, max: 18, step: 1, value: FREE_Z, suffix: '' },
  ];
  static ARIA_LABEL =
    'Building the first eighteen atoms. A big atom with K, L and M shells stands beside an element card, above '
    + 'the eighteen elements in three rows. The scene walks from hydrogen, one electron on K, to helium with K '
    + 'full; lithium starts L and the walk fills it to neon at 2, 8; sodium starts M alone at 2, 8, 1 and the '
    + 'row fills to argon at 2, 8, 8. On the last beat a slider, or a tap on any tile, builds any of the eighteen.';

  constructor(container, config) {
    super(container, config);
    this.z = 1;
    this._walkT = 0;
    this._popT = 9;        // seconds since the shown element changed
    this._found = false;
  }

  enter(stage) {
    const w = WALKS[stage];
    this._walkT = 0;
    this._found = false;
    this.z = w ? (reducedMotion() ? w.to : w.from) : FREE_Z;
    this._popT = 9;
  }

  isControlHidden(id) { return id === 'z' && this.stage !== S_FREE; }
  getControlValue(id) { return id === 'z' ? String(this.z) : super.getControlValue(id); }

  onControlChange(id, v) {
    if (!this._guard(id)) return;
    if (id === 'z') this._pick(Math.round(Math.max(1, Math.min(18, Number(v)))));
  }

  pointerDown(p) {
    if (this.stage !== S_FREE) return;
    const t = this._tab, gx = t === TAB ? 3 : t.gx / 2, gy = t === TAB ? 3 : t.gy / 2;
    for (let i = 0; i < 18; i++) {
      const b = tileBox(i, t);
      if (p.x >= b.x - gx && p.x <= b.x + b.w + gx && p.y >= b.y - gy && p.y <= b.y + b.h + gy) { this._pick(i + 1); return; }
    }
  }

  get _tab() { return PHONE && this.stage === S_FREE ? TAB_BIG : TAB; }

  _pick(z) {
    if (z === this.z) return;
    this._show(z);
    if (isFull(z) && !this._found) {
      this._found = true;
      this.celebrate(CX, CY, 28, { key: 'full-outer-shell', lookAt: 'scene' });
    }
    this.requestUiUpdate?.();
  }

  _show(z) { this.z = z; this._popT = 0; }

  _walkDone() { const w = WALKS[this.stage]; return !w || this.z === w.to; }

  busy() { return !this._walkDone() || this._popT < 0.6; }

  update(d) {
    const w = WALKS[this.stage];
    if (w && !this._walkDone()) {
      this._walkT += d;
      const z = Math.min(w.to, w.from + Math.floor(Math.max(0, this._walkT - w.delay) / w.period));
      if (z !== this.z) this._show(z);
    }
    this._popT = Math.min(9, this._popT + d);
  }

  draw(ctx, c) {
    drawDepthField(ctx, c, { x: CX, y: CY, seed: 5, n: 8 });
    const small = this._tab !== TAB;
    ctx.save();
    if (small) { ctx.translate(TOP_X, 0); ctx.scale(TOP_K, TOP_K); }
    this._atom(ctx, c);
    this._card(ctx, c);
    ctx.restore();
    this._table(ctx, c);
  }

  _atom(ctx, c) {
    const cfg = configFor(this.z), outer = outerOf(this.z), full = isFull(this.z);
    for (let s = 2; s >= 0; s--) {
      const used = s <= outer;
      drawShell(ctx, c, CX, CY, RADII[s], { active: s === outer, dim: used ? 0 : 0.6, band: used ? undefined : 0 });
    }
    drawNucleus(ctx, c, CX, CY, { p: this.z, n: ELEMENTS[this.z - 1][2], r: this.z < 3 ? 22 : NUC_R });
    for (let s = 0; s < 3; s++) {
      if (s > outer) continue;
      const pts = shellPoints(RADII[s], cfg[s], s * 0.42, { er: ER, capacity: CAP[s] });
      pts.forEach((q, i) => {
        const x = CX + q.x, y = CY + q.y;
        if (q.empty) { drawSeat(ctx, c, x, y, ER - 1, { dim: 0.35 }); return; }
        const newest = s === outer && i === cfg[s] - 1;
        if (newest && this._popT < 0.7) drawFocus(ctx, c, x, y, ER, 1 - this._popT / 0.7);
        drawElectron(ctx, c, x, y, Math.max(3, ER * (newest ? popIn(this._popT, 0, 0.32) : 1)), { focus: full ? 0 : 0 });
      });
    }
    tagShell(ctx, c, 0, 3.0); tagShell(ctx, c, 1, 2.7); tagShell(ctx, c, 2, 2.42);
  }

  _card(ctx, c) {
    const [sym, name] = ELEMENTS[this.z - 1];
    const cfg = configFor(this.z).filter((n, i) => n > 0 || i === 0);
    const x = 366, y = 16, w = 298, h = 326;
    const full = isFull(this.z);
    drawCard(ctx, c, x, y, w, h, 1, { accent: full ? c.good : c.accent });
    const cx = x + w / 2;
    const pop = reducedMotion() ? 1 : Math.min(1.08, Math.max(0.7, popIn(this._popT, 0, 0.3)));
    say(ctx, c, sym, cx, y + 76, { size: Math.round(92 * pop) });
    say(ctx, c, name, cx, y + 152, { size: 32, weight: 600 });
    say(ctx, c, cfg.join(','), cx, y + 216, { size: 58, col: c.s2ink });
    let text = `${this.z} electron${this.z > 1 ? 's' : ''}`, bg = c.bgSurface;
    if (full) { text = `${SHELL[outerOf(this.z)]} is full`; bg = c.good; }
    else if (opensShell(this.z)) { text = `new shell: ${SHELL[outerOf(this.z)]}`; bg = c.s2; }
    tag(ctx, c, text, cx, y + 282, { bg, ink: bg === c.bgSurface ? c.label : undefined });
  }

  _table(ctx, c) {
    const L = lookOf();
    const take = this.stage === S_FREE, t = this._tab;
    for (let i = 0; i < 18; i++) {
      const b = tileBox(i, t), z = i + 1;
      const on = z === this.z, reached = take || z <= this.z;
      const mark = take && isFull(z) ? c.good : take && opensShell(z) ? c.s2 : null;
      const base = mark ?? c.electron;
      const fill = on ? base : mark ? mix(c.bgSurface, base, 0.55) : reached ? mix(c.bgSurface, base, 0.22) : c.bgSurface;
      rr(ctx, b.x, b.y + 4 * L.lip, b.w, b.h, 10 * L.radius); ctx.fillStyle = darken(fill, 0.35); ctx.fill();
      rr(ctx, b.x, b.y, b.w, b.h, 10 * L.radius); ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = on ? c.label : c.stroke; ctx.lineWidth = on ? 3 : 2 * L.rim; ctx.stroke();
      say(ctx, c, ELEMENTS[i][0], b.x + b.w / 2, b.y + b.h / 2 + 1, { size: t === TAB ? 26 : 34, col: on || mark ? inkOn(c, fill) : reached ? c.label : c.labelMuted });
    }
    for (let r = 0; r < 3; r++) say(ctx, c, SHELL[r], 20, t.y + r * (t.h + t.gy) + t.h / 2 + 1, { size: t === TAB ? 26 : 32, col: c.electron });
  }
}

function tagShell(ctx, c, s, a) {
  tag(ctx, c, SHELL[s], CX + RADII[s] * Math.cos(a), CY + RADII[s] * Math.sin(a), { size: 20, bg: c.bgSurface });
}
