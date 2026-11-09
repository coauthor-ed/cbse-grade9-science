// BlendFamilyScene - two parents, four child cards that turn over, and 23 pairs of threads.
// Mounts two ways: beatCount 0 is the predict setup (every card face down, nothing running),
// beatCount 5 is the verdict (five beats, the cards flip on the beat).
import { SimScene } from 'simulations/base/kit/SimScene.js';
import {
  ZONES, alpha, mix, lighten, darken, rr, pill, chipRow, drawBackdrop, drawCard,
  drawBadge, font,
} from 'simulations/base/kit/SimLook.js';
import { drawFigure, figureLook } from 'simulations/base/kit/SimFigure.js';

// The slide's three characters and nothing else.
const PARENTS = [
  { hair: 'light', shape: 'straight', eyes: 'dark' },
  { hair: 'dark', shape: 'curly', eyes: 'light' },
];
const CARDS = [
  { hair: 'light', shape: 'straight', eyes: 'light' },
  { hair: 'dark', shape: 'straight', eyes: 'dark' },
  { hair: 'light', shape: 'curly', eyes: 'light' },
  { hair: 'dark', shape: 'curly', eyes: 'dark' },
];
const CHARS = [
  { key: 'hair', cap: 'hair' },
  { key: 'shape', cap: 'shape' },
  { key: 'eyes', cap: 'eyes' },
];

// Geometry. Parents across the stage top, a summary strip under them, four cards below.
const PAR_Y = 70, PAR_H = 106, PAR_W = 238, PAR_X = [86, 356];
const SUM_Y = 184, SUM_H = 66;
const CARD_Y = 250, CARD_H = 196, CARD_W = 152, CARD_X = [18, 182, 346, 510];
const CHIP_Y = 478;
const PAR_FIG_H = 80, CARD_FIG_H = 84;

const S_SETUP = 0, S_B0 = 1, S_B1 = 2, S_B2 = 3, S_B3 = 4, S_B4 = 5;
const MAP_SETUP = [[{ idx: S_SETUP, dwellMs: null }]];
const MAP_VERDICT = [0, 1, 2, 3, 4].map((i) => [{ idx: i + 1, dwellMs: null }]);

// The four flips on beat 0, one at a time, about half a second each.
const FLIP_DUR = 0.5;
const FLIP_AT = [0.2, 0.72, 1.24, 1.76];

const THREAD_PAIRS = 23;
const TH_COLS = 12;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t) => t * t * (3 - 2 * t);
const seg = (t, a, b) => smooth(clamp01((t - a) / (b - a)));

export class BlendFamilyScene extends SimScene {
  static BEAT_STEP_MAP = MAP_VERDICT;
  // The count IS the mount: 0 is the beat-less predict, 5 is blk-l03-s03.
  static BEAT_MAPS = { 0: MAP_SETUP, 5: MAP_VERDICT };
  static NOTE_STAGE = 0;
  static ARIA_LABEL =
    'Two parent figures carrying hair colour, hair shape and eye colour, above four child cards that '
    + 'turn over on the beat to show four different combinations. The last beat replaces the cards with '
    + '23 pairs of thin threads, 46 in all.';
  static CONTROLS = [];

  constructor(container, config) {
    super(container, config);
    this._card = CARDS.map(() => ({ a: 0, from: 0, to: 0, t: 1 }));
    this._sel = null;                 // { kind: 'parent' | 'card', i } - a tap highlight
    this._dur = 0;                    // seconds this stage animates for; busy() until then
    this._fired = false;
  }

  /** The mount test: a beat-less `role: "setup"` mount is never sent a beat index. */
  get _setup() { return this.beatCount === 0; }

  noteRows() {
    return [{ text: 'these cards show only three characters - real families carry far more than three' }];
  }

  // Character colours, all derived from the theme tokens so both themes hold.
  // Light and dark must read as opposites in BOTH themes, so each pair is built
  // from the same token pushed hard in opposite directions.
  _tones(c) {
    return {
      light: lighten(c.gold, 0.45),
      dark: darken(mix(c.bgDeep, c.s2, 0.4), 0.5),
      lightEye: lighten(c.water, 0.5),
      darkEye: darken(mix(c.bgDeep, c.water, 0.45), 0.45),
      straight: lighten(c.s5, 0.18),
      curly: darken(c.s7, 0.25),
    };
  }

  /** char is 'hair' | 'shape' | 'eyes'; value is that character's own version. */
  _toneOf(t, char, value) {
    if (char === 'hair') return value === 'light' ? t.light : t.dark;
    if (char === 'eyes') return value === 'light' ? t.lightEye : t.darkEye;
    return value === 'straight' ? t.straight : t.curly;
  }

  enter(stage) {
    this._sel = null;
    this._fired = false;
    this._dur = 0;
    if (stage === S_SETUP) {
      this._card.forEach((k) => { k.a = 0; k.t = 1; k.from = 0; k.to = 0; });
      return;
    }
    if (stage === S_B0) {
      this._card.forEach((k) => { k.a = 0; k.t = 1; k.from = 0; k.to = 1; });
      this._dur = FLIP_AT[3] + FLIP_DUR + 0.05;
      return;
    }
    this._card.forEach((k) => { k.a = 1; k.t = 1; k.from = 1; k.to = 1; });
    if (stage === S_B2) this._dur = 1.0;
    else if (stage === S_B4) this._dur = 1.7;
  }

  update(d) {
    const a = this.age;
    if (this.stage === S_B0) {
      this._card.forEach((k, i) => {
        const t0 = FLIP_AT[i];
        if (a < t0) { k.a = 0; return; }
        const u = clamp01((a - t0) / FLIP_DUR);
        k.a = k.from + (k.to - k.from) * smooth(u);
        if (u >= 1) k.a = k.to;
      });
      if (!this._fired && a >= FLIP_AT[3] + FLIP_DUR) {
        this._fired = true;
        this.celebrate(CARD_X[3] + CARD_W / 2, CARD_Y + 40, 26);
      }
    }
  }

  busy() { return this.age < this._dur; }

  draw(ctx, c) {
    drawBackdrop(ctx, c, 'dots');
    const a = this.age;
    const swap = this.stage === S_B2 ? seg(a, 0, 0.5) : (this.stage > S_B2 ? 1 : 0);

    this._drawGametes(ctx, c);
    for (let i = 0; i < 2; i++) {
      const x = PAR_X[i] + (PAR_X[1 - i] - PAR_X[i]) * swap;   // beat 2: the parents trade sides
      this._drawParent(ctx, c, i, x, PAR_Y);
    }
    if (this.stage === S_B1) this._drawNoMiddle(ctx, c);
    else if (this.stage === S_B2) this._drawTallies(ctx, c, seg(a, 0.5, 0.9));
    else if (this.stage !== S_B4) this._drawStripLegend(ctx, c);   // beat 4 names its own count

    if (this.stage === S_B4) this._drawThreads(ctx, c, a);
    else {
      for (let i = 0; i < 4; i++) this._drawChild(ctx, c, i, CARD_X[i], CARD_Y, a);
    }

    this._drawChips(ctx, c);
  }

  // -- the two small gamete icons, the legend for the threads below them ---------------
  _drawGametes(ctx, c) {
    const y = ZONES.top.y + 30;
    ctx.strokeStyle = alpha(c.label, 0.85);
    ctx.lineWidth = 2.5;
    ctx.fillStyle = mix(c.accent, c.label, 0.25);
    // sperm: a round head with a tail
    ctx.beginPath(); ctx.arc(300, y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(309, y);
    ctx.quadraticCurveTo(322, y - 9, 331, y + 3);
    ctx.stroke();
    // egg: a plain oval, no cell inside it
    ctx.fillStyle = mix(c.gold, c.label, 0.2);
    ctx.beginPath(); ctx.ellipse(366, y, 13, 10, 0, 0, Math.PI * 2); ctx.fill();
    pill(ctx, c, 'gamete', 420, y, { bg: c.s5, size: 13 });
  }

  // -- a parent card: head-and-shoulders figure plus its three characters --------------
  _drawParent(ctx, c, i, x, y) {
    const p = PARENTS[i];
    const t = this._tones(c);
    const on = this._sel && this._sel.kind === 'parent' && this._sel.i === i;
    drawCard(ctx, c, x, y, PAR_W, PAR_H, 1, { accent: on ? c.accent : c.s5 });
    drawFigure(ctx, c,
      { x: x + 34, y: y + PAR_H - 8, height: PAR_FIG_H, facing: 0, pose: 'stand' },
      figureLook(c, { hair: this._toneOf(t, 'hair', p.hair), hairStyle: p.shape === 'curly' ? 'curly' : 'short', top: c.s5, bottom: c.s6, mood: 'smile' }),
      { noShadow: true });
    const sx = x + 122;
    for (let k = 0; k < 2; k++) {
      const bx = sx + k * 50;
      const col = this._toneOf(t, k === 0 ? 'hair' : 'eyes', k === 0 ? p.hair : p.eyes);
      ctx.fillStyle = col;
      rr(ctx, bx, y + 26, 38, 38, 9); ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.5); ctx.lineWidth = 2; ctx.stroke();
      ctx.font = font(c, 700, 14); ctx.fillStyle = c.label;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(k === 0 ? p.hair : p.eyes, bx + 19, y + 72);
      ctx.font = font(c, 700, 13); ctx.fillStyle = c.labelMuted;
      ctx.fillText(CHARS[k * 2].cap, bx + 19, y + 89);
    }
    if (on) {
      ctx.strokeStyle = c.accent; ctx.lineWidth = 3;
      rr(ctx, x + 2, y + 2, PAR_W - 4, PAR_H - 4, 12); ctx.stroke();
    }
  }

  // -- a child card, face down (a < 0.5) or face up ------------------------------------
  _drawChild(ctx, c, i, x, y, age) {
    const k = this._card[i];
    const sc = Math.abs(Math.cos(Math.PI * k.a));
    const cx = x + CARD_W / 2;
    if (sc < 0.04) {                                  // edge-on: the flip itself
      ctx.fillStyle = alpha(c.label, 0.5);
      ctx.fillRect(cx - 1.5, y + 6, 3, CARD_H - 12);
      return;
    }
    ctx.save();
    ctx.translate(cx, y);
    ctx.scale(sc, 1);
    ctx.translate(-cx, -y);
    if (k.a < 0.5) {
      ctx.fillStyle = mix(c.bgSurface, c.s4, 0.4);
      rr(ctx, x, y, CARD_W, CARD_H, 12); ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.35); ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = alpha(c.label, 0.18); ctx.lineWidth = 4;
      for (let d = -CARD_H; d < CARD_W; d += 22) {
        ctx.beginPath(); ctx.moveTo(x + d, y + CARD_H); ctx.lineTo(x + d + CARD_H, y); ctx.stroke();
      }
    } else {
      this._drawChildFace(ctx, c, i, x, y, age);
    }
    ctx.restore();
  }

  _drawChildFace(ctx, c, i, x, y, age) {
    const p = CARDS[i];
    const t = this._tones(c);
    const on = this._sel && this._sel.kind === 'card' && this._sel.i === i;
    drawCard(ctx, c, x, y, CARD_W, CARD_H, 1, { accent: on ? c.accent : c.s2 });
    pill(ctx, c, String(i + 1), x + 20, y + 15, { bg: c.s4, size: 13 });
    drawFigure(ctx, c,
      { x: x + 50, y: y + 106, height: CARD_FIG_H, facing: 0, pose: 'stand' },
      figureLook(c, { hair: this._toneOf(t, 'hair', p.hair), hairStyle: p.shape === 'curly' ? 'curly' : 'short', top: c.s2, bottom: c.s3, mood: 'smile' }),
      { noShadow: true });
    for (let k = 0; k < 2; k++) {
      const bx = x + 30 + k * 54;
      const col = this._toneOf(t, k === 0 ? 'hair' : 'eyes', k === 0 ? p.hair : p.eyes);
      ctx.fillStyle = col;
      rr(ctx, bx, y + 120, 38, 38, 9); ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.5); ctx.lineWidth = 2; ctx.stroke();
      ctx.font = font(c, 700, 14); ctx.fillStyle = c.label;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(k === 0 ? p.hair : p.eyes, bx + 19, y + 166);
      ctx.font = font(c, 700, 13); ctx.fillStyle = c.labelMuted;
      ctx.fillText(CHARS[k * 2].cap, bx + 19, y + 183);
      if (this.stage === S_B3 && this.age < 1) {
        const g = seg(this.age, 0.05 * k + 0.02 * i, 0.3);
        if (g > 0.02) drawBadge(ctx, c, 'check', bx + 36, y + 122, 10 * g, c.good);
      }
    }
    if (on) {
      ctx.strokeStyle = c.accent; ctx.lineWidth = 3;
      rr(ctx, x + 2, y + 2, CARD_W - 4, CARD_H - 4, 12); ctx.stroke();
    }
  }

  // -- the strip's standing content on the beats that show nothing else in it -----------
  _drawStripLegend(ctx, c) {
    chipRow(ctx, c, CHARS.map((ch) => ({ text: ch.cap, bg: c.s5 })),
      ZONES.bottom.x + ZONES.bottom.w / 2, SUM_Y + SUM_H / 2, { align: 'center', size: 14 });
  }

  // -- beat 1: the two hair colours, with nothing in the gap between them ---------------
  _drawNoMiddle(ctx, c) {
    const y = SUM_Y + 4;
    const put = (col, x) => {
      ctx.fillStyle = col;
      rr(ctx, x, y, 40, 40, 10); ctx.fill();
      ctx.strokeStyle = alpha(c.label, 0.55); ctx.lineWidth = 2; ctx.stroke();
    };
    put(this._tones(c).light, 272);
    put(this._tones(c).dark, 368);
    ctx.strokeStyle = alpha(c.labelMuted, 0.8); ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    rr(ctx, 326, y + 4, 28, 32, 8); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = font(c, 700, 13); ctx.fillStyle = c.labelMuted;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('nothing between', 340, y + 52);
  }

  // -- beat 2: how many of each version the four cards carry, per character -------------
  _drawTallies(ctx, c, g) {
    const t = this._tones(c);
    const base = SUM_Y + 62;
    const full = 13;                       // per card; the tallest tally is 2 of 4
    for (let ci = 0; ci < 3; ci++) {
      const gx = 170 + ci * 170;
      const versions = ci === 1 ? ['straight', 'curly'] : ['light', 'dark'];
      const counts = versions.map((v) => CARDS.filter((k) => k[CHARS[ci].key] === v).length);
      ctx.font = font(c, 700, 13); ctx.fillStyle = c.labelMuted;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(CHARS[ci].cap, gx, SUM_Y + 9);
      for (let k = 0; k < 2; k++) {
        const bx = gx - 40 + k * 52;
        const h = full * counts[k] * g;
        ctx.fillStyle = this._toneOf(t, CHARS[ci].key, versions[k]);
        rr(ctx, bx, base - h, 30, Math.max(1, h), 6); ctx.fill();
        ctx.font = font(c, 700, 14); ctx.fillStyle = c.label;
        ctx.fillText(String(counts[k]), bx + 15, base - full * 2 - 12);
      }
    }
  }

  // -- beat 4: 23 pairs of threads in the card row's place, one thread lifted -----------
  _drawThreads(ctx, c, age) {
    const g = seg(age, 0.2, 0.8);
    // The strip between the parents and the threads names the count, so the band is not bare.
    chipRow(ctx, c, [{ text: '23 pairs', bg: c.s6 }, { text: 'one thread from each parent', bg: c.s4 }],
      ZONES.bottom.x + ZONES.bottom.w / 2 - 120, SUM_Y + SUM_H / 2, { align: 'center', size: 14 });
    const rows = [CARD_Y + 86, CARD_Y + CARD_H - 10];
    const colW = 640 / TH_COLS;
    const long = 54, short = 32;
    for (let n = 0; n < THREAD_PAIRS; n++) {
      const col = n % TH_COLS, row = (n / TH_COLS) | 0;
      const bx = 20 + col * colW + colW / 2;
      const by = rows[row] ?? rows[1];
      const lifted = n === 6;
      const lift = lifted ? seg(age, 0.9, 1.8) * 26 : 0;
      const fade = lifted ? 1 - clamp01((age - 1.85) / 0.4) * 0.25 : 1;
      ctx.globalAlpha = g * fade;
      // the long thread of the pair
      ctx.strokeStyle = lifted ? c.accent : mix(c.s5, c.label, 0.35);
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx - 5, by - long - lift); ctx.lineTo(bx - 5, by); ctx.stroke();
      // the short one, still in its pair
      ctx.strokeStyle = mix(c.s7, c.label, 0.2);
      ctx.beginPath(); ctx.moveTo(bx + 5, by - short); ctx.lineTo(bx + 5, by); ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.globalAlpha = 1;
      if (lifted && lift > 5) {
        ctx.font = font(c, 700, 13); ctx.fillStyle = c.accent;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('one whole thread', bx, by - long - lift - 9);
      }
    }
  }

  // -- one muted caption per beat, in the bottom band -----------------------------------
  _drawChips(ctx, c) {
    const items = [];
    if (this.stage === S_B3) items.push({ text: 'no third version', bg: c.s4 });
    if (this.stage === S_B4) {
      items.push({ text: '46 in all', bg: c.s5 });
    }
    if (!items.length) return;
    chipRow(ctx, c, items, ZONES.bottom.x + ZONES.bottom.w / 2, CHIP_Y, { align: 'center', size: 14 });
  }

  // -- taps: a parent, or a card that is already face up -------------------------------
  pointerDown(p) {
    if (this._setup) {
      for (let i = 0; i < 2; i++) {
        if (p.x >= PAR_X[i] && p.x <= PAR_X[i] + PAR_W && p.y >= PAR_Y && p.y <= PAR_Y + PAR_H) {
          this._sel = { kind: 'parent', i };
          this.animateFor(300);
          return;
        }
      }
      return;                                    // a face-down card shows nothing at all
    }
    if (p.y >= PAR_Y && p.y <= PAR_Y + PAR_H) {
      for (let i = 0; i < 2; i++) {
        if (p.x >= PAR_X[i] && p.x <= PAR_X[i] + PAR_W) {
          this._sel = { kind: 'parent', i };
          this.animateFor(300);
          return;
        }
      }
    }
    if (p.y >= CARD_Y && p.y <= CARD_Y + CARD_H) {
      for (let i = 0; i < 4; i++) {
        if (p.x >= CARD_X[i] && p.x <= CARD_X[i] + CARD_W && this._card[i].a >= 0.5) {
          this._sel = { kind: 'card', i };
          this.animateFor(300);
          return;
        }
      }
    }
    this._sel = null;
    this.animateFor(300);
  }
}