/**
 * SolubilityCurveScene - the chapter's solubility curve. One chart, read off a temperature
 * axis: compound A and compound B (Fig. 5.6) with the four salts of Table 5.4 as thinner
 * traces, a draggable probe that reads off the selected curve, and marks the learner can
 * pin. Mounted twice - blk-l02-s08 (4 beats, explain) and blk-l02-s09 (3 beats, hook) - so
 * BEAT_MAPS carries one map per beat COUNT, and the count is the only thing that tells the
 * scene which mount it is on: the explain mount opens on a free probe at 40 \u00b0C with nothing
 * marked, the hook mount opens on compound B at 60 \u00b0C with 287 and 241 already pinned.
 *
 * Every number printed here is the source's own (FIGURES.md: Fig. 5.6, Table 5.4).
 * Rules (briefs/reference/scene-rules.md):
 *   - the mount comes from the beat count, never from a flag
 *   - nothing on this chart animates: busy() is always false, CONTINUOUS is false
 *   - colours are series tokens and mixes of them, never hex
 *   - a beat change inside a mount keeps the learner's probe and marks
 *   - no settled solid, no crystal, no falling curve; the gap between the two pins reads 46 g
 */
import { SvgScene, chip, cardHtml, fill, stroke, inkVar } from 'simulations/base/kit/SimSvg.js';
import { chartFrame } from 'simulations/base/kit/SimChart.js';
import { noteLineHtml } from 'simulations/base/kit/SimLookDom.js';
import { esc } from 'simulations/base/SimUi.js';

// Fig. 5.6 and Table 5.4, exactly. Compounds carry a point every 10 \u00b0C from 0; the salts
// carry the table's six temperatures from 10 \u00b0C, which is why their traces start later.
const A_PTS = [[0, 28], [10, 34], [20, 38], [30, 43], [40, 47], [50, 53], [60, 57], [70, 62], [80, 66]];
const B_PTS = [[0, 180], [10, 190], [20, 205], [30, 220], [40, 241], [50, 260], [60, 287], [70, 320], [80, 360]];
const SALT_PTS = {
  KNO3: [[10, 21], [20, 32], [30, 45], [40, 62], [60, 106], [80, 167]],
  NaCl: [[10, 36], [20, 36], [30, 36.3], [40, 36.5], [60, 37], [80, 37]],
  KCl: [[10, 35], [20, 35], [30, 37.4], [40, 40], [60, 46], [80, 54]],
  NH4Cl: [[10, 24], [20, 37], [30, 41], [40, 41], [60, 55], [80, 66]],
};

// Six curves, six tones: A red and B blue are the figure's own two, the salts take the rest.
// `kind` decides only how a trace is DRAWN (thick with points, or thin); the hook's 46 g is
// never drawn, and there is no gas curve and no gas chip.
const CURVES = [
  { key: 'A', label: 'Compound \u2018A\u2019', pts: A_PTS, tone: 6, kind: 'compound', labT: 6, labDy: -16 },
  { key: 'B', label: 'Compound \u2018B\u2019', pts: B_PTS, tone: 1, kind: 'compound', labT: 4, labDy: -24 },
  { key: 'KNO3', label: 'KNO3', pts: SALT_PTS.KNO3, tone: 3, kind: 'salt' },
  { key: 'NaCl', label: 'NaCl', pts: SALT_PTS.NaCl, tone: 2, kind: 'salt' },
  { key: 'KCl', label: 'KCl', pts: SALT_PTS.KCl, tone: 4, kind: 'salt' },
  { key: 'NH4Cl', label: 'NH4Cl', pts: SALT_PTS.NH4Cl, tone: 5, kind: 'salt' },
];
const BY_KEY = Object.fromEntries(CURVES.map((c) => [c.key, c]));

const X_MAX = 80, Y_MAX = 400;
const X_TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80];
const Y_TICKS = [0, 50, 100, 150, 200, 250, 300, 350, 400];
// The two readings the s09 hook is built on, and the axis marks Fig. 5.6 puts beside them.
const PIN_HIGH = { temp: 60, value: 287 };
const PIN_LOW = { temp: 40, value: 241 };

const MAP_S08 = [[{ idx: 0 }], [{ idx: 1 }], [{ idx: 2 }], [{ idx: 3 }]];
const MAP_S09 = [[{ idx: 10 }], [{ idx: 11 }], [{ idx: 12 }]];

const GRID_MINOR = 'color-mix(in oklab, var(--sim-bg-surface) 84%, var(--sim-series-3))';
const GRID_MAJOR = 'color-mix(in oklab, var(--sim-bg-surface) 66%, var(--sim-series-3))';

/** The reading off a curve: straight between its own plotted points, held flat outside them. */
function valueAt(pts, temp) {
  if (temp <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i += 1) {
    if (temp <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return y0 + ((y1 - y0) * (temp - x0)) / (x1 - x0);
    }
  }
  return pts[pts.length - 1][1];
}
/** 241 and 36.5 both print exactly; 36.25 would print 36.3. */
const grams = (v) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1));
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const svgText = (x, y, txt, o = {}) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}`
  + ` style="fill:${o.fill ?? 'var(--sim-label)'};font-size:${o.size ?? 14}px;font-weight:${o.weight ?? 700}`
  + `${o.italic ? ';font-style:italic' : ''}${o.halo ? `;paint-order:stroke;stroke:var(--sim-bg-surface);stroke-width:${o.halo}px;stroke-linejoin:round` : ''}`
  + `;font-family:var(--sim-font-display, var(--sim-font))">${esc(txt)}</text>`;

export class SolubilityCurveScene extends SvgScene {
  // The count IS the mount: 4 is the explain mount, 3 is the hook mount. They are not one
  // scene with a flag - they open in different states - so they get different maps and the
  // hook's steps sit in their own range so a step index never means two mounts at once.
  static BEAT_STEP_MAP = MAP_S08;
  static BEAT_MAPS = { 4: MAP_S08, 3: MAP_S09 };
  // The host's layout budget, not the stage's: `stageHeight` below gives each orientation its
  // own stage, and these are the tallest state (the mark toggle on, chips wrapped) plus the title
  // row and the note line, measured with sim-layout. LAYOUT is 'fit', so the frame still sizes
  // to what is showing; these only stop the panel being budgeted short.
  static HEIGHT = 580;
  static PORTRAIT_HEIGHT = 246;
  static ARIA_LABEL =
    'A solubility curve chart. The horizontal axis is temperature in degrees Celsius from 0 to 80; the vertical '
    + 'axis is solubility in grams per 100 g of water from 0 to 400. Compound A is a low red curve rising from '
    + '28 g at 0 degrees to 66 g at 80. Compound B is a steep blue curve rising from 180 g to 360 g, reading '
    + '241 g at 40 degrees and 287 g at 60. Four thinner salt traces share the grid: KNO3 climbing from 21 to 167, '
    + 'NH4Cl from 24 to 66, KCl from 35 to 54, and NaCl almost flat, 36 to 37. A draggable probe reads off whichever '
    + 'curve is chosen, and marks can be pinned on it.';
  // Mark / Clear sit with the curve chips, beside the chart they act on (no host strip).
  static CONTROLS = [];

  async setup() {
    await super.setup();
    this.root.insertAdjacentHTML('beforeend', '<div class="scc-note"></div>');
    this._note = this.root.querySelector('.scc-note');
    this._syncNote();
    const w = this.sv.wrap;
    w.setAttribute('tabindex', '0');
    w.addEventListener('keydown', this._onKey = (e) => this._key(e));
    // Mark / Clear: a tap lands through the overlay on the stage (pointerDown hits); Enter / Space on the
    // focused button is a click, handled here.
    this.root.addEventListener('click', this._onAct = (e) => {
      const b = e.target instanceof Element ? e.target.closest('[data-scc-act]') : null;
      if (b && !b.disabled) this.onControlChange(b.dataset.sccAct);
    });
    this.relayout();
  }

  destroy() {
    this.sv?.wrap?.removeEventListener('keydown', this._onKey);
    this.root?.removeEventListener('click', this._onAct);
    super.destroy();
  }

  /** Nothing here tweens, eases or ticks; a drag is one repaint. */
  busy() { return false; }

  // -- beats -------------------------------------------------------------------------------------

  // SvgScene's own onBeatChange reads only BEAT_STEP_MAP, so this scene resolves the map by
  // beat count itself. A mount change re-enters even when the step index happens to match.
  onBeatChange(beatIndex, beatCount) {
    const map = this.constructor.BEAT_MAPS[beatCount] ?? this.constructor.BEAT_STEP_MAP;
    const n = Number.isFinite(beatIndex) ? Math.trunc(beatIndex) : 0;
    const step = map[clamp(n, 0, map.length - 1)][0].idx;
    if (step !== this.stepIndex || this.mountOf(step) !== this._mount) {
      this.stepIndex = step;
      // enter() reads the mount off the step and sets this._mount itself, so it must not be
      // set here first - that would make its own "the mount changed" guard never fire.
      this.enter?.(step);
    }
    this.root.dataset.step = String(step);
    this._syncNote();
    this.repaint();
    this.requestUiUpdate?.();
  }

  mountOf(step) { return (step | 0) >= 10 ? 'hook' : 'explain'; }

  /** Seeds only when the mount changes: a beat change inside a mount keeps what the learner did. */
  enter(step) {
    const mount = this.mountOf(step);
    if (this._mount !== mount) {
      this._mount = mount;
      this.curve = 'B';
      this.marks = [];
      this.markLive = false;
      if (mount === 'hook') {
        this.temp = PIN_HIGH.temp;
        this.marks = [
          { key: 'B', temp: PIN_HIGH.temp, hook: true },
          { key: 'B', temp: PIN_LOW.temp, hook: true },
        ];
      } else {
        this.temp = 40;
      }
      this._read = { 40: mount === 'explain' ? 1 : 0 };   // the probe starts on 40, so 40 is already read
      this._won = false;
    }
    this._syncNote();
  }

  _syncNote() {
    if (this._note) {
      this._note.innerHTML = noteLineHtml([{ text: 'Every value here is per 100 g of water.' }]);
    }
  }

  // -- controls ----------------------------------------------------------------------------------

  getControlValue(id) { return id === 'mark' ? !!this.markLive : undefined; }
  isControlDisabled(id) {
    if (id !== 'clear') return false;
    return !this.markLive && !this.marks.some((m) => !m.hook);
  }

  onControlChange(id) {
    if (this.isControlDisabled(id)) return;
    if (id === 'mark') {
      if (this.markLive) {
        this.markLive = false;
        this.marks = [...this.marks, this._liveMark()];
      } else {
        this.markLive = true;
      }
    }
    if (id === 'clear') {
      // The hook's two pins are the opening state its own beats depend on, so Clear takes away
      // only what the learner put on the chart.
      this.marks = this.marks.filter((m) => m.hook);
      this.markLive = false;
    }
    this.repaint();
    this.requestUiUpdate?.();
  }

  // -- the probe and the chips ---------------------------------------------------------------------

  _liveMark() { return { key: this.curve, temp: this.temp }; }

  /** The whole reading, in one place: probe on the selected curve, marks, celebration. */
  _readAt(temp, key = this.curve) {
    const value = valueAt(BY_KEY[key].pts, temp);
    return { temp, value, grams: grams(value) };
  }

  _setTemp(temp) {
    const t = clamp(Math.round(temp), 0, X_MAX);
    if (t === this.temp) return false;
    this.temp = t;
    this._notice();
    return true;
  }

  _sameAsLive(m) { return m.temp === this.temp && m.key === this.curve; }

  /** The explain mount celebrates when the learner has read B at 40 and at 60 for itself. */
  _notice() {
    if (this._mount === 'hook' || this.curve !== 'B' || this._won) return;
    // A drag moves two or three degrees between events, so a reading counts within a degree of the mark.
    for (const t of [40, 60]) if (Math.abs(this.temp - t) <= 1) this._read[t] = 1;
    if (this._read[40] && this._read[60]) { this._won = true; this.celebrate(); }
  }

  _pickCurve(key) {
    if (!BY_KEY[key]) return false;
    this.curve = key;
    this._notice();
    return true;
  }

  // -- layout -------------------------------------------------------------------------------------

  areas(st) {
    const portrait = st.portrait;
    // Phone: the host gives a scene about 350 x 225, so chart and read-out stay side by side.
    return portrait
      ? { chart: { x: 0, y: 0, w: st.W - 176, h: st.H }, card: { x: st.W - 172, y: 2, w: 170 }, chips: { x: st.W - 172, y: 77, w: 172 } }
      : { chart: { x: 0, y: 0, w: st.W - 214, h: st.H }, card: { x: st.W - 206, y: 6, w: 198 }, chips: { x: st.W - 206, y: 128, w: 198 } };
  }

  frame(st) {
    return chartFrame({
      rect: this.areas(st).chart,
      x: { min: 0, max: X_MAX, ticks: X_TICKS, label: st.portrait ? undefined : 'Temperature (\u00b0C)' },
      y: { min: 0, max: Y_MAX, ticks: Y_TICKS, label: st.portrait ? undefined : 'Solubility (g per 100 g water)' },
      rightPad: st.portrait ? 22 : undefined,
    });
  }

  stageHeight(st) { return st.portrait ? 238 : 450; }

  // -- input --------------------------------------------------------------------------------------

  pointerDown(p) {
    const hit = (this._hits ?? []).find((h) => p.x >= h.x0 && p.x <= h.x1 && p.y >= h.y0 && p.y <= h.y1);
    if (hit) { if (hit.act) this.onControlChange(hit.act); else this._pickCurve(hit.key); return true; }
    const f = this.frame(this.sv);
    const pl = f.plot;
    if (p.x < pl.x - 40 || p.x > pl.x + pl.w + 40) return false;
    this._setTemp(f.vx(clamp(p.x, pl.x, pl.x + pl.w)));
    return true;                 // a press that lands dead on the probe changes nothing, and must still start the drag
  }

  pointerMove(p) {
    const f = this.frame(this.sv);
    const pl = f.plot;
    if (p.x < pl.x || p.x > pl.x + pl.w) return false;
    return this._setTemp(f.vx(p.x));
  }

  _key(e) {
    const step = e.shiftKey ? 1 : 5;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { if (this._setTemp(this.temp - step)) { e.preventDefault(); this.repaint(); } }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { if (this._setTemp(this.temp + step)) { e.preventDefault(); this.repaint(); } }
  }

  repaint() {
    super.repaint();
    this._hits = [...this.root.querySelectorAll('[data-scc], [data-scc-act]')].map((el) => {
      const r = el.getBoundingClientRect();
      const a = this.sv.point({ clientX: r.left, clientY: r.top });
      const b = this.sv.point({ clientX: r.right, clientY: r.bottom });
      return { key: el.dataset.scc, act: el.dataset.sccAct, x0: a.x, y0: a.y, x1: b.x, y1: b.y };
    });
  }

  // -- the picture ---------------------------------------------------------------------------------

  paint(st) {
    const A = this.areas(st);
    const f = this.frame(st);
    const p = f.plot;
    const grid = this.gridSvg(f);
    const curves = CURVES.map((c) => this.traceSvg(f, c, c.key === this.curve)).join('');
    const marks = [...this.marks, ...(this.markLive ? [this._liveMark()] : [])].map((m) => this.markSvg(f, m)).join('');
    const gap = this.mountOf(this.stepIndex) === 'hook' ? this.gapSvg(f) : '';
    const probe = this.probeSvg(f);
    const hook = this.mountOf(this.stepIndex) === 'hook';
    const read = this._readAt(this.temp);

    const head = chip(
      hook ? 'compound \u2018B\u2019 cooled from 60 to 40 \u00b0C'
        : this.marks.length ? 'drag the probe, and mark what you read'
          : 'drag the probe along the curve',
      0, 0, { tone: hook ? 'warning' : 'plain', size: 'big', static: true },
    );

    // Only HTML goes on the overlay; every mark, gap and probe is SVG and lives in `svg`.
    const over = this.cardHtml(A, read) + this.chipsHtml(A);

    return {
      svg: `${grid}<g>${curves}${gap}${marks}${probe}${this.axesSvg(f)}</g>`,
      over,
      head,
      floor: p.y + p.h + 6,
    };
  }

  /** Graph paper in the figure's green: minor every 5 \u00b0C and 25 g, major on the tick values. */
  gridSvg(f) {
    const p = f.plot;
    let out = `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="6" ${fill('var(--sim-bg-surface)')}/>`;
    for (let v = 0; v <= X_MAX; v += 5) {
      const x = f.px(v);
      out += `<line x1="${x.toFixed(1)}" y1="${p.y}" x2="${x.toFixed(1)}" y2="${p.y + p.h}" ${stroke(v % 10 ? GRID_MINOR : GRID_MAJOR, v % 10 ? 1 : 1.6)}/>`;
    }
    for (let v = 0; v <= Y_MAX; v += 25) {
      const y = f.py(v);
      out += `<line x1="${p.x}" y1="${y.toFixed(1)}" x2="${p.x + p.w}" y2="${y.toFixed(1)}" ${stroke(v % 50 ? GRID_MINOR : GRID_MAJOR, v % 50 ? 1 : 1.6)}/>`;
    }
    const ph = this.sv?.portrait;
    for (const v of X_TICKS) if (!ph || v % 20 === 0) out += svgText(f.px(v), p.y + p.h + 24, ph && v === X_MAX ? `${v} \u00b0C` : String(v), { anchor: 'middle', fill: 'var(--sim-label-muted)', size: 14 });
    for (const v of Y_TICKS) if (!ph || v % 100 === 0) out += svgText(p.x - 10, f.py(v) + 5, String(v), { anchor: 'end', fill: 'var(--sim-label-muted)', size: 14 });
    if (ph) return out + svgText(p.x + 6, p.y + 16, 'g per 100 g of water', { fill: 'var(--sim-label-muted)', size: 14, halo: 3 });
    out += svgText(p.x + p.w / 2, f.rect.y + f.rect.h - 8, 'Temperature (\u00b0C)', { anchor: 'middle', size: 15 });
    out += `<g transform="translate(${f.rect.x + 22} ${p.y + p.h / 2}) rotate(-90)">`
      + svgText(0, 0, 'Solubility (g per 100 g water)', { anchor: 'middle', size: 15 }) + '</g>';
    return out;
  }

  /** The axes the figure draws: a heavy baseline, a rising y line, and arrowed x and y letters. */
  axesSvg(f) {
    const p = f.plot;
    const ink = 'var(--sim-label)';
    let out = `<line x1="${p.x - 4}" y1="${p.y + p.h}" x2="${p.x + p.w + 14}" y2="${p.y + p.h}" ${stroke(ink, 3)}/>`
      + `<line x1="${p.x}" y1="${p.y + p.h + 4}" x2="${p.x}" y2="${p.y - 14}" ${stroke(ink, 3)}/>`;
    // The x arrow tips the baseline's right end; the y arrow tips the rising line's top.
    const ax = p.x + p.w + 14, bx = p.y + p.h, ay = p.y - 14;
    out += `<path d="M${ax - 11} ${bx + 9}L${ax} ${bx}L${ax - 11} ${bx - 9}" ${stroke(ink, 3, 'fill:none;stroke-linecap:round;stroke-linejoin:round')}/>`;
    out += `<path d="M${p.x - 9} ${ay + 11}L${p.x} ${ay}L${p.x + 9} ${ay + 11}" ${stroke(ink, 3, 'fill:none;stroke-linecap:round;stroke-linejoin:round')}/>`;
    if (!this.sv?.portrait) out += svgText(ax + 4, bx + 24, 'x', { italic: true, size: 16, weight: 800 });
    if (!this.sv?.portrait) out += svgText(p.x - 16, p.y - 20, 'y', { italic: true, size: 16, weight: 800 });
    return out;
  }

  /**
   * A trace. Only the compounds are labelled on the plot: their two tips are 300 g apart, so
   * the labels never fight. The four salts sit 12 g apart at the bottom of a 400 g axis, so
   * they are named by the chip row instead - each chip carries its own trace's colour, and
   * the reading card names whichever is selected.
   */
  traceSvg(f, c, selected) {
    const col = `var(--sim-series-${c.tone})`;
    const w = c.kind === 'compound' ? (selected ? 4.5 : 3) : (selected ? 3.5 : 2);
    const d = c.pts.map(([t, v], i) => `${i ? 'L' : 'M'}${f.px(t).toFixed(1)} ${f.py(v).toFixed(1)}`).join('');
    let out = `<path d="${d}" ${stroke(col, w, `fill:none;stroke-linecap:round;stroke-linejoin:round${selected ? '' : ';opacity:0.75'}`)}/>`;
    if (selected || c.kind === 'compound') {
      for (const [t, v] of c.pts) out += `<circle cx="${f.px(t).toFixed(1)}" cy="${f.py(v).toFixed(1)}" r="${selected ? 4.5 : 3}" ${fill(col, 'stroke:var(--sim-bg-surface);stroke-width:1.6')}/>`;
    }
    // Each compound is named once, above its own curve and just inside the left of the plot, where
    // nothing else is drawn at that height - A's label sits in the empty band between A and B.
    if (c.kind === 'compound') {
      if (this.sv?.portrait) out += svgText(f.px(74), f.py(valueAt(c.pts, 74)) + (c.key === 'B' ? 20 : -10), c.key, { fill: col, size: 16, weight: 900, halo: 4 });
      else out += svgText(f.px(c.labT), f.py(valueAt(c.pts, c.labT)) + c.labDy, c.label, { fill: col, size: 15, halo: 4 });
    }
    return out;
  }

  /** A pinned reading: a dashed guide to both axes, a ring on the curve, and its own number. */
  markSvg(f, m) {
    const c = BY_KEY[m.key];
    if (!c) return '';
    const col = `var(--sim-series-${c.tone})`;
    const v = valueAt(c.pts, m.temp);
    const x = f.px(m.temp), y = f.py(v), p = f.plot;
    const live = this.markLive && this._sameAsLive(m);
    let out = `<path d="M${x.toFixed(1)} ${y.toFixed(1)}V${p.y + p.h}M${x.toFixed(1)} ${y.toFixed(1)}H${p.x}"`
      + ` ${stroke('var(--sim-label-muted)', live ? 1.6 : 2, `fill:none;stroke-dasharray:5 6;opacity:0.6`)}/>`;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" ${fill(col, 'opacity:0.22')}/>`;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" ${fill(col, 'stroke:var(--sim-bg-surface);stroke-width:2')}/>`;
    out += svgText(x, y - 14, `${grams(v)} g`, { anchor: x > p.x + p.w * 0.8 ? 'end' : 'middle', fill: col, size: 14, halo: 4 });
    // The two hook readings are also marked on the y-axis, as Fig. 5.6 marks them.
    if (m.hook && !this.sv?.portrait) out += svgText(p.x + 6, y + 5, grams(v), { fill: col, size: 14, halo: 4 });
    return out;
  }

  /** The gap between the hook's two readings, marked and never written down. */
  gapSvg(f) {
    const p = f.plot;
    const x = f.px(68), y1 = f.py(PIN_LOW.value), y2 = f.py(PIN_HIGH.value);
    const col = 'var(--sim-warning)';
    return `<path d="M${x - 7} ${y1.toFixed(1)}H${x + 7}M${x - 7} ${y2.toFixed(1)}H${x + 7}M${x.toFixed(1)} ${y1.toFixed(1)}V${y2.toFixed(1)}"`
      + ` ${stroke(col, 2.5, 'fill:none;stroke-linecap:round')}/>`
      + (this.sv?.portrait ? svgText(x + 8, (y1 + y2) / 2 + 5, '46 g', { fill: col, size: 15, halo: 4 }) : svgText(x + 12, (y1 + y2) / 2 + 5, '46 g', { fill: col, size: 18, halo: 4 }));
  }

  probeSvg(f) {
    const v = valueAt(BY_KEY[this.curve].pts, this.temp);
    const x = f.px(this.temp), y = f.py(v), p = f.plot;
    const col = `var(--sim-series-${BY_KEY[this.curve].tone})`;
    let out = `<path d="M${x.toFixed(1)} ${y.toFixed(1)}V${p.y + p.h}M${x.toFixed(1)} ${y.toFixed(1)}H${p.x}"`
      + ` ${stroke('var(--sim-label)', 2, 'fill:none;stroke-dasharray:6 6;opacity:0.75')}/>`;
    out += `<g class="sv-drag"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="17" ${fill(col, 'opacity:0.22')} class="sv-breathe"/>`
      + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" ${fill(col, 'stroke:var(--sim-bg-surface);stroke-width:3')}/></g>`;
    return out;
  }

  cardHtml(A, read) {
    const rows = [
      { label: 'temperature', value: `${read.temp} \u00b0C` },
      { label: 'dissolves', value: `${read.grams} g`, tone: BY_KEY[this.curve].tone },
    ];
    if (this.sv?.portrait) {       // the kit card wraps at this width: a phone gets the reading as two plain lines
      return `<div class="scc-read" style="left:${A.card.x}px;top:${A.card.y}px;width:${A.card.w}px;--c:var(--sim-series-${BY_KEY[this.curve].tone})">`
        + `<span class="scc-read__k">${esc(BY_KEY[this.curve].label)}</span><span class="scc-read__v">${read.temp} \u00b0C</span>`
        + `<span class="scc-read__v"><b>${read.grams} g</b></span></div>`;
    }
    rows.push({ label: 'marked', value: String(this.marks.length + (this.markLive ? 1 : 0)) });
    return cardHtml(A.card.x, A.card.y, A.card.w, BY_KEY[this.curve].label, rows, { tone: BY_KEY[this.curve].tone });
  }

  /** Six chips in a flex row: the widths are measured by the browser, never typed here. */
  chipsHtml(A) {
    const ph = this.sv?.portrait;
    const btns = CURVES.map((c) => {
      const on = c.key === this.curve;
      const col = `var(--sim-series-${c.tone})`;
      const cls = ['sv-chip', 'sv-hit', 'scc-chip', on ? '' : 'sv-chip--plain'].filter(Boolean).join(' ');
      const sty = on ? `--c:${col};--ci:${inkVar(c.tone)};` : '';
      return `<button type="button" class="${cls}" data-scc="${c.key}" aria-pressed="${on}"`
        + ` style="${sty}" aria-label="read ${c.label}">${esc(ph ? c.key : c.label)}</button>`;
    }).join('');
    const hasOwn = this.marks.some((m) => !m.hook);
    const acts = `<span class="scc-break"></span>`
      + `<button type="button" class="sv-chip sv-hit scc-act${this.markLive ? '' : ' sv-chip--plain'}" data-scc-act="mark" aria-pressed="${!!this.markLive}">${this.markLive ? (ph ? 'Pin' : 'Pin mark') : (ph ? 'Mark' : 'Mark here')}</button>`
      + `<button type="button" class="sv-chip sv-hit sv-chip--plain scc-act" data-scc-act="clear"${!this.markLive && !hasOwn ? ' disabled' : ''}>${ph ? 'Clear' : 'Clear marks'}</button>`;
    return `<div class="scc-chips" style="left:${A.chips.x}px;top:${A.chips.y}px;width:${A.chips.w}px">${btns}${acts}</div>`;
  }

  css() {
    return `
.scc-chips { position: absolute; display: flex; flex-wrap: wrap; gap: 7px; align-items: flex-start; }
.scc-chips .scc-chip { position: static; transform: none; cursor: pointer; font-size: var(--sim-text-sm); padding: 3px 10px; }
.scc-break { flex-basis: 100%; height: 2px; }
.scc-chips .scc-act { position: static; transform: none; cursor: pointer; font-size: var(--sim-text-sm); padding: 4px 12px; min-height: 36px; }
.scc-chips .scc-act[aria-pressed="true"] { --c: var(--sim-accent); --ci: var(--sim-ink-on-accent, var(--sim-bg-deep)); }
.scc-chips .scc-act[disabled] { opacity: 0.45; cursor: default; }
.scc-note { margin-top: var(--sim-space-2); }
.sim-dom-root--portrait.svs { padding: 4px; }
.sim-dom-root--portrait .sv-stage > .sv-back { inset: -4px; width: calc(100% + 8px); height: calc(100% + 8px); }
.sim-dom-root--portrait .svs-head, .sim-dom-root--portrait .scc-note { display: none; }
.sim-dom-root--portrait .scc-chips { gap: 4px; }
.sim-dom-root--portrait .scc-chips .scc-chip, .sim-dom-root--portrait .scc-chips .scc-act { min-height: 49px; min-width: 49px; padding: 2px 6px; }
.sim-dom-root--portrait .scc-break { height: 0; }
.scc-read { position: absolute; box-sizing: border-box; height: 78px; padding: 3px 8px; display: flex; flex-direction: column; justify-content: center;
  background: var(--sim-bg-surface); border: 2px solid var(--c); border-radius: var(--sim-radius-md); }
.sim-dom-root--portrait .scc-read { height: 72px; padding: 1px 8px; }
.scc-read__k { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.scc-read__v { font-weight: 800; font-size: var(--sim-text-md); line-height: 1.2; color: var(--sim-label); white-space: nowrap; font-variant-numeric: tabular-nums; }
.scc-read__v b { font-weight: 900; font-size: var(--sim-text-lg); color: var(--c); }
`;
  }
}