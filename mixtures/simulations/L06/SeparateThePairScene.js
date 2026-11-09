/**
 * SeparateThePairScene - blk-l06-s08, the mini-game. Four cards, one bench each. Each card opens on a guess or a setting,
 * then the learner works the apparatus and the bench shows what happened:
 *   Funnel   which layer leaves first? Then open the stopcock one splash at a time and shut it before the oil arrives.
 *   Camphor  set the heat against camphor's melting point, put the cotton plug in, and heat.
 *   Magnet   slide the magnet across the tray; nails jump up only where it has passed.
 *   Brass    three tools or "no tool works": only saying so wins.
 * Phone layout from shared/GameFrame.js. Check is the frame's button once all four cards are done.
 * GameBoard extends withChallenge(DomSimulation).
 */
import { GameBoard, mountGame } from '../shared/GameFrame.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_LOOK_DOM_CSS, burst } from 'simulations/base/kit/SimLookDom.js';
import { rng } from 'simulations/base/kit/shuffle.js';

/* ------------------------------------------------------------------ data */

const WATER = 8;         // splashes of water below the boundary
const BAND = 1;          // the cloudy boundary splash
const OIL = 8;
const HEATS = [{ v: 'low', l: 'low', t: 120 }, { v: 'mid', l: 'medium', t: 160 }, { v: 'high', l: 'high', t: 210 }];
const MELT = 175;        // camphor's melting point on the drawn thermometer, degrees C
const MAG_STEPS = 6;
const NAIL_AT = [0, 1, 1, 2, 3, 4, 4, 5];   // which magnet step passes over each nail

const ROUNDS = [
  { key: 'funnel', tab: 'Funnel', ask: 'Drain the water out of this funnel and keep the oil.' },
  { key: 'camphor', tab: 'Camphor', ask: 'Get the camphor back and leave the sand.' },
  { key: 'magnet', tab: 'Magnet', ask: 'Take every nail out of this sawdust.' },
  { key: 'alloy', tab: 'Brass', ask: 'Get the copper and the zinc back from this brass.' },
];
const MARK = { yes: '\u2713', no: '\u2717' };

/* ------------------------------------------------------------- drawings */

function funnelSvg(s) {
  const left = WATER + BAND + OIL - s.out;
  const unit = 9;
  const foot = 150;
  // the column, from the stopcock up: what is left of water, the band, then oil
  const waterLeft = Math.max(0, WATER - s.out);
  const bandLeft = Math.max(0, Math.min(BAND, WATER + BAND - s.out));
  const oilLeft = left - waterLeft - bandLeft;
  const yW = foot - waterLeft * unit;
  const yB = yW - bandLeft * unit;
  const yO = yB - oilLeft * unit;
  const body = 'M70 10 h50 v8 c30 18 44 56 44 76 c0 22 -30 40 -56 62 h-26 c-26 -22 -56 -40 -56 -62 c0 -20 14 -58 44 -76 Z';
  const fl = s.flask;
  const fillW = fl.water * 4;
  const fillO = fl.oil * 4;
  return `<svg class="sp-svg" viewBox="0 0 190 250" aria-hidden="true"><clipPath id="sp-fun"><path d="${body}"/></clipPath>
    <g clip-path="url(#sp-fun)">
      <rect x="0" y="${yO.toFixed(1)}" width="190" height="${(yB - yO).toFixed(1)}" fill="color-mix(in oklab, var(--sim-glucose) 65%, transparent)" class="sp-lvl"/>
      <rect x="0" y="${yB.toFixed(1)}" width="190" height="${(yW - yB).toFixed(1)}" fill="color-mix(in oklab, var(--sim-glucose) 40%, var(--sim-water) 40%)" class="sp-lvl"/>
      <rect x="0" y="${yW.toFixed(1)}" width="190" height="${(foot - yW + 8).toFixed(1)}" fill="color-mix(in oklab, var(--sim-water) 60%, transparent)" class="sp-lvl"/>
    </g>
    <path d="${body}" fill="none" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M86 156 v16 h18 v-16" fill="none" stroke="var(--sim-stroke)" stroke-width="3"/>
    <rect x="80" y="164" width="30" height="8" rx="3" fill="${s.pour ? 'var(--sim-good)' : 'var(--sim-label-muted)'}" stroke="var(--sim-stroke)" stroke-width="2"/>
    <path d="M95 172 v14" stroke="var(--sim-stroke)" stroke-width="3"/>
    ${s.pour ? `<path class="sp-stream" d="M95 186 v20" stroke="var(${s.pour === 'oil' ? '--sim-glucose' : '--sim-water'})" stroke-width="4" stroke-linecap="round"/>` : ''}
    <path d="M70 206 h50 l14 38 h-78 Z" fill="none" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>
    <clipPath id="sp-flask"><path d="M70 206 h50 l14 38 h-78 Z"/></clipPath>
    <g clip-path="url(#sp-flask)"><rect x="50" y="${(244 - fillW - fillO).toFixed(1)}" width="90" height="${fillO}" fill="var(--sim-glucose)"/>
      <rect x="50" y="${(244 - fillW).toFixed(1)}" width="90" height="${fillW}" fill="color-mix(in oklab, var(--sim-water) 70%, transparent)"/></g>
  </svg>`;
}

function camphorSvg(s) {
  const r = rng(4);
  let sand = '';
  for (let i = 0; i < 26; i++) sand += `<circle cx="${(52 + r() * 86).toFixed(1)}" cy="${(184 + r() * 8).toFixed(1)}" r="3" fill="var(--sim-strata-1)" stroke="var(--sim-stroke)" stroke-width="0.8"/>`;
  let camph = '';
  if (!s.done) for (let i = 0; i < 16; i++) camph += `<rect x="${(56 + r() * 78).toFixed(1)}" y="${(178 + r() * 8).toFixed(1)}" width="6" height="6" fill="var(--sim-ice)" stroke="var(--sim-stroke)" stroke-width="0.8"/>`;
  let wall = '';
  if (s.done === 'ok') {
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      const xl = 56 + t * 30;
      const y = 166 - t * 90;
      wall += `<path class="sp-xtal" style="--i:${i}" d="M${xl.toFixed(1)} ${y.toFixed(1)} l5 -5 5 5 -5 5 Z M${(190 - xl - 10).toFixed(1)} ${y.toFixed(1)} l5 -5 5 5 -5 5 Z" fill="var(--sim-ice)" stroke="var(--sim-stroke)" stroke-width="1"/>`;
    }
  }
  const melt = s.done === 'melt' ? '<path class="sp-run" d="M50 192 q-20 6 -30 20" stroke="var(--sim-ice)" stroke-width="6" fill="none" stroke-linecap="round"/>' : '';
  const escape = s.done === 'escape' ? '<path class="sp-escape" d="M95 20 q-8 -10 2 -18 M100 20 q8 -10 -2 -18" stroke="var(--sim-label-muted)" stroke-width="3" fill="none" stroke-linecap="round"/>' : '';
  const plug = s.plug ? '<rect x="88" y="16" width="14" height="14" rx="4" fill="var(--sim-ice)" stroke="var(--sim-stroke)" stroke-width="1.5"/>' : '';
  const flame = s.done ? '<path d="M82 228 q6 -14 6 -20 q6 8 0 20 Z M98 228 q7 -16 5 -24 q8 10 1 24 Z" fill="var(--sim-flame)"/>' : '';
  return `<svg class="sp-svg" viewBox="0 0 190 236" aria-hidden="true">
    <path d="M40 176 q55 34 110 0 Z" fill="var(--sim-surface-raised)" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>${sand}${camph}
    <path d="M46 174 L88 34 V12 h14 V34 L144 174" fill="color-mix(in oklab, var(--sim-glass) 10%, transparent)" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>
    ${wall}${plug}${melt}${escape}${flame}
    <path d="M60 232 h70 M70 232 l-4 -18 h58 l-4 18" fill="none" stroke="var(--sim-stroke)" stroke-width="2"/>
  </svg>`;
}

function thermoHtml(heat) {
  const t = HEATS.find((h) => h.v === heat)?.t ?? 30;
  const Y = (v) => 150 - ((v - 20) / 200) * 140;
  return `<svg class="sp-thermo" viewBox="0 0 120 180" aria-hidden="true">
    <rect x="14" y="6" width="16" height="150" rx="8" fill="var(--sim-bg-surface)" stroke="var(--sim-stroke)" stroke-width="2.5"/>
    <rect class="sp-thermo__fill" x="18" y="${Y(t).toFixed(1)}" width="8" height="${(156 - Y(t)).toFixed(1)}" fill="var(--sim-error)"/>
    <circle cx="22" cy="162" r="14" fill="var(--sim-error)" stroke="var(--sim-stroke)" stroke-width="2.5"/>
    <path d="M6 ${Y(MELT).toFixed(1)} h34" stroke="var(--sim-warning)" stroke-width="3" stroke-dasharray="4 3"/>
    <text x="44" y="${(Y(MELT) + 5).toFixed(1)}" class="sp-thermo__t">melts ${MELT}\u00b0C</text>
  </svg>`;
}

function traySvg(s) {
  const r = rng(9);
  let dust = '';
  for (let i = 0; i < 80; i++) dust += `<circle cx="${(26 + r() * 228).toFixed(1)}" cy="${(132 + r() * 22).toFixed(1)}" r="2.2" fill="var(--sim-strata-1)"/>`;
  let nails = '';
  NAIL_AT.forEach((k, i) => {
    const up = s.pos > k && !s.dropped;
    const inBox = s.dropped && s.pos > k;
    const x = inBox ? 288 + (i % 4) * 7 : 40 + i * 28;
    const y = inBox ? 140 - Math.floor(i / 4) * 6 : up ? 64 : 140;
    nails += `<g class="sp-nail${up ? ' is-up' : ''}" transform="translate(${x} ${y}) rotate(${up ? 90 : i % 2 ? 14 : -12})"><rect x="-12" y="-2" width="24" height="4.5" rx="1.5" fill="var(--sim-waste)" stroke="var(--sim-stroke)" stroke-width="1.2"/>`
      + '<rect x="-14" y="-4.5" width="4" height="9" rx="1" fill="var(--sim-waste)" stroke="var(--sim-stroke)" stroke-width="1.2"/></g>';
  });
  const mx = s.dropped ? 268 : 22 + Math.min(s.pos, MAG_STEPS) * 38;
  return `<svg class="sp-svg sp-svg--wide" viewBox="0 0 330 170" aria-hidden="true">
    <path d="M14 124 h250 l-8 36 H22 Z" fill="color-mix(in oklab, var(--sim-strata-2) 35%, var(--sim-bg-cell))" stroke="var(--sim-stroke)" stroke-width="2.5" stroke-linejoin="round"/>${dust}
    <path d="M276 116 h46 v40 a4 4 0 0 1 -4 4 h-38 a4 4 0 0 1 -4 -4 Z" fill="var(--sim-bg-surface)" stroke="var(--sim-stroke)" stroke-width="2.5"/>
    <g class="sp-magnet" style="transform: translateX(${mx}px)"><rect x="0" y="34" width="60" height="22" rx="6" fill="var(--sim-error)" stroke="var(--sim-stroke)" stroke-width="2.5"/>
      <rect x="0" y="34" width="20" height="22" rx="6" fill="var(--sim-series-1)" stroke="var(--sim-stroke)" stroke-width="2.5"/></g>
    ${nails}</svg>`;
}

function brassSvg(tool) {
  const fx = {
    filter: '<path d="M60 20 h70 l-30 36 v12 h-10 v-12 Z" fill="none" stroke="var(--sim-stroke)" stroke-width="3" stroke-linejoin="round"/>',
    heat: '<path d="M82 168 q6 -14 6 -20 q6 8 0 20 Z M98 168 q7 -16 5 -24 q8 10 1 24 Z" fill="var(--sim-flame)"/>',
    magnet: '<path d="M78 8 v24 a17 17 0 0 0 34 0 v-24 h-10 v24 a7 7 0 0 1 -14 0 v-24 Z" fill="var(--sim-error)" stroke="var(--sim-stroke)" stroke-width="2.5"/>',
  }[tool] || '';
  return `<svg class="sp-svg" viewBox="0 0 190 176" aria-hidden="true">${fx}
    <rect x="35" y="86" width="120" height="48" rx="9" fill="var(--sim-gold)" stroke="color-mix(in oklab, var(--sim-gold) 40%, var(--sim-stroke))" stroke-width="2.5"/>
    <rect x="47" y="94" width="96" height="7" rx="3.5" fill="color-mix(in oklab, var(--sim-ice) 70%, transparent)"/>
    <path d="M40 140 h110" stroke="color-mix(in oklab, var(--sim-stroke) 60%, transparent)" stroke-width="6" stroke-linecap="round"/></svg>`;
}

/* ------------------------------------------------------------- the scene */

export class SeparateThePairScene extends GameBoard {
  static ARIA_LABEL =
    'Four cards. Drain water from a separating funnel one splash at a time and stop before the oil; heat camphor and sand '
    + 'under a funnel below the melting point with the cotton plug in; slide a magnet across nails in sawdust; and for brass, '
    + 'choose between three tools and saying no tool works.';
  static PORTRAIT_HEIGHT = 900;   // sim-layout --interact: the tallest state
  static OBJECTIVE = {
    prompt: { en: 'Work each card: draw off the lower layer, heat below the melting point with the plug in, slide the magnet right across, and on the brass card choose no tool.' },
  };

  constructor(container, config) {
    super(container, config);
    this._i = 0;
    this._st = {
      funnel: this._freshFunnel(),
      camphor: { heat: 'high', plug: false, done: null },
      magnet: { pos: 0, dropped: false, done: null },
      alloy: { tool: null, done: null },
    };
    this._won = ROUNDS.map(() => false);
  }

  _freshFunnel(guess = null) { return { guess, out: 0, flask: { water: 0, oil: 0 }, pour: null, done: null }; }

  async setup() {
    await super.setup();
    mountGame(this, {
      css: SIM_LOOK_DOM_CSS + CSS,
      html: `<div class="gm sp">
        <div class="gm-head"><p class="kicker">Challenge</p><h2>Four cards, <b>four differences</b></h2><p class="sub" id="sp-sub"></p></div>
        <div class="sp-pane" id="sp-pane"></div></div>`,
    });
    this.root.querySelector('#sp-pane')?.addEventListener('click', (e) => {
      const b = e.target.closest?.('[data-sflow-action]');
      if (b && !b.disabled) this._act(b.dataset.sflowAction, b.dataset.sflowValue);
    });
    this._paint();
    this.quill.speak('Read the card first, then choose.', 5200);
  }

  _act(name, value) {
    const i = this._i;
    const key = ROUNDS[i].key;
    if (name === 'next') { this._i = Math.min(ROUNDS.length - 1, i + 1); this._paint(); return undefined; }
    if (this._won[i]) return undefined;
    const s = this._st[key];
    if (key === 'funnel') {
      if (name === 'fguess') { if (!s.guess) s.guess = value; }
      else if (name === 'again') this._st.funnel = this._freshFunnel(s.guess);
      else if (!s.guess || s.done) return undefined;
      else if (name === 'tap') {
        if (s.out >= WATER + BAND + OIL) return undefined;
        const k = s.out < WATER ? 'water' : 'oil';
        s.flask[k] += 1;
        s.out += 1;
        s.pour = s.out <= WATER ? 'water' : 'oil';
        if (s.flask.oil > 0) s.done = { ok: false, why: s.out === WATER + 1 ? 'One splash too many: oil got into the water flask' : 'Oil is running into the water flask' };
      } else if (name === 'shut') {
        s.pour = null;
        s.done = s.out === WATER ? { ok: true } : { ok: false, why: `Shut too early: ${WATER - s.out} ${WATER - s.out === 1 ? 'splash' : 'splashes'} of water still in the funnel` };
      }
    } else if (key === 'camphor') {
      if (name === 'heat') { if (!s.done && HEATS.some((h) => h.v === value)) s.heat = value; }
      else if (name === 'plug') { if (!s.done) s.plug = !s.plug; }
      else if (name === 'again') this._st.camphor = { heat: s.heat, plug: s.plug, done: null };
      else if (name === 'warm' && !s.done) {
        const over = HEATS.find((h) => h.v === s.heat).t > MELT;
        s.done = over ? 'melt' : !s.plug ? 'escape' : 'ok';
      }
    } else if (key === 'magnet') {
      if (name === 'again') this._st.magnet = { pos: 0, dropped: false, done: null };
      else if (s.done) return undefined;
      else if (name === 'slide') s.pos = Math.min(MAG_STEPS, s.pos + 1);
      else if (name === 'drop') {
        s.dropped = true;
        const caught = NAIL_AT.filter((k) => s.pos > k).length;
        s.done = caught === NAIL_AT.length ? { ok: true } : { ok: false, why: `${NAIL_AT.length - caught} nails left in the sawdust where the magnet never passed` };
      }
    } else if (key === 'alloy') {
      if (name === 'again') this._st.alloy = { tool: null, done: null };
      else if (name === 'tool' && !s.done) { s.tool = value; s.done = value === 'none' ? 'ok' : 'nothing'; }
    }
    const ok = this._ok(key);
    if (ok) this._won[i] = true;
    this._paint();
    if (ok) { burst(this.root.querySelector('.sp-benchbox') || this.root); this.quill?.perform('hop'); }
    return undefined;
  }

  _ok(key) {
    const s = this._st[key];
    if (key === 'funnel') return !!s.done?.ok;
    if (key === 'camphor') return s.done === 'ok';
    if (key === 'magnet') return !!s.done?.ok;
    return s.done === 'ok';
  }

  checkObjective() {
    if (this._won.every(Boolean)) return { ok: true };
    if (!Object.values(this._st).some((s) => s.done || s.guess)) return null;
    return { ok: false, hint: 'Finish all four cards first.' };
  }

  /* ---------------------------------------------------------------- paint */

  _paint() {
    const key = ROUNDS[this._i].key;
    const pane = this.root.querySelector('#sp-pane');
    if (!pane) return;
    this.root.querySelector('#sp-sub').textContent = `Card ${this._i + 1} of ${ROUNDS.length}. Each one uses a different difference.`;
    pane.innerHTML = this._body(key);
  }

  _btn(label, action, value = null, { go = false, dis = false, on = false } = {}) {
    return `<button type="button" class="tap ${go ? 'sp-go' : 'sp-chip'}${on ? ' is-on' : ''}" data-sflow-action="${action}"${value != null ? ` data-sflow-value="${esc(value)}"` : ''}${dis ? ' disabled' : ''}>${esc(label)}</button>`;
  }

  _verdict(i, ok, okText, why) {
    if (ok) return `<span class="sp-tag is-yes">${MARK.yes} ${esc(okText)}</span>${i < ROUNDS.length - 1 ? this._btn('Next card', 'next', null, { go: true }) : ''}`;
    return `<span class="sp-tag is-no">${MARK.no} ${esc(why)}</span>${this._btn('Try again', 'again')}`;
  }

  _body(key) {
    const i = ROUNDS.findIndex((r) => r.key === key);
    const r = ROUNDS[i];
    const s = this._st[key];
    const card = `<div class="sp-card"><span class="sp-card__t">${esc(r.ask)}</span></div>`;
    let pic;
    let side;
    if (key === 'funnel') {
      pic = funnelSvg(s);
      const g = (v, l) => {
        const mine = s.guess === v;
        const shown = s.out > 0;
        const cls = shown && mine ? (v === 'water' ? ' is-yes' : ' is-no') : mine ? ' is-on' : '';
        return `<button type="button" class="tap sp-chip${cls}" data-sflow-action="fguess" data-sflow-value="${v}"${s.guess && !mine ? ' disabled' : ''}>${esc(l)}</button>`;
      };
      const ask = `<span class="sp-k">Which layer leaves first?</span><span class="sp-chips">${g('water', 'Water: it is denser')}${g('oil', 'Oil: it is on top')}</span>`;
      const ctrl = s.done ? this._verdict(i, s.done.ok, 'The water is out and the oil is kept', s.done.why)
        : `<span class="sp-chips">${this._btn('Open: one splash', 'tap', null, { go: true, dis: !s.guess })}${this._btn('Shut and stop', 'shut', null, { dis: !s.guess || !s.out })}</span>`
          + `<span class="sp-k">In the flask: ${s.flask.water} splashes of water${s.flask.oil ? `, ${s.flask.oil} of oil` : ''}</span>`;
      side = `${ask}${ctrl}`;
    } else if (key === 'camphor') {
      pic = camphorSvg(s);
      const ctrl = s.done
        ? (s.done === 'ok' ? this._verdict(i, true, 'Camphor on the funnel, sand in the dish')
          : this._verdict(i, false, '', s.done === 'melt' ? `Above ${MELT}\u00b0C the camphor melted, so it did not sublime` : 'No cotton plug: much of the vapour escaped'))
        : `<div class="sp-heat">${thermoHtml(s.heat)}<div class="sp-heat__c"><span class="sp-k">Heat under the dish</span>`
          + `<span class="sp-chips">${HEATS.map((h) => this._btn(`${h.l}, ${h.t}\u00b0C`, 'heat', h.v, { on: s.heat === h.v })).join('')}</span>`
          + `<button type="button" class="tap sp-chip${s.plug ? ' is-on' : ''}" data-sflow-action="plug" aria-pressed="${s.plug}">${s.plug ? `${MARK.yes} Cotton plug in the stem` : 'Put the cotton plug in the stem'}</button>`
          + `${this._btn('Heat for 5 minutes', 'warm', null, { go: true })}</div></div>`;
      side = ctrl;
    } else if (key === 'magnet') {
      pic = traySvg(s);
      const caught = NAIL_AT.filter((k) => s.pos > k).length;
      side = s.done ? this._verdict(i, s.done.ok, 'All eight nails out, and the sawdust stayed', s.done.why)
        : `<span class="sp-chips">${this._btn('Slide the magnet along', 'slide', null, { go: true, dis: s.pos >= MAG_STEPS })}${this._btn('Drop the nails in the box', 'drop', null, { dis: !s.pos })}</span>`
          + `<span class="sp-k">Nails on the magnet: ${caught} of ${NAIL_AT.length}</span>`;
    } else {
      pic = brassSvg(s.tool);
      const tools = [['filter', 'Filter it'], ['heat', 'Heat it'], ['magnet', 'Use a magnet'], ['none', 'No tool works on it']];
      side = s.done
        ? (s.done === 'ok' ? this._verdict(i, true, 'Right: brass is the same all through, so no tool works')
          : this._verdict(i, false, '', `${tools.find((t) => t[0] === s.tool)[1]}: nothing separated. Brass is the same all through`))
        : `<span class="sp-k">Pick one</span><span class="sp-chips sp-chips--col">${tools.map(([v, l]) => this._btn(l, 'tool', v)).join('')}</span>`;
    }
    return `${card}<div class="sp-main"><div class="sp-benchbox${key === 'magnet' ? ' sp-benchbox--wide' : ''}">${pic}</div><div class="sp-side" aria-live="polite">${side}</div></div>`;
  }
}

const CSS = `
.gm.sp { background: var(--sim-bg-deep); }
.sim-dom-root--portrait .q-sparks, .sim-dom-root--portrait .q-dots { display: none; }
.sp-pane { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 8px; max-width: 880px; }
.sp-k { font-weight: 800; font-size: var(--sim-text-sm); color: var(--sim-label-muted); text-align: center; }
.sp-card { position: relative; display: flex; align-items: baseline; gap: var(--sim-space-3); padding: 6px var(--sim-space-3);
  border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-md); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface));
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-warning) 40%, var(--sim-stroke)); }
.sp-card__t { font-weight: 800; font-size: var(--sim-text-md); line-height: 1.3; color: var(--sim-label); }
.sp-main { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: var(--sim-space-3); align-items: center; }
.sim-dom-root--portrait .sp-main { grid-template-columns: minmax(0, 1fr); }
.sp-benchbox { padding: var(--sim-space-2); border-radius: var(--sim-radius-md); background: var(--sim-bg-cell);
  border-bottom: 6px solid color-mix(in oklab, var(--sim-strata-2) 55%, var(--sim-stroke)); }
.sp-svg { display: block; width: 100%; max-width: 230px; max-height: 226px; margin: 0 auto; height: auto; }
.sim-dom-root--portrait .sp-svg { max-height: 280px; }
.sp-svg--wide { max-width: 320px; }
.sp-side { display: flex; flex-direction: column; align-items: center; gap: var(--sim-space-2); min-width: 0; }
.sp-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--sim-space-1); }
.sp-chips--col { flex-direction: column; align-items: stretch; }
.sp-chip { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: 48px; padding: 2px var(--sim-space-3); border: 2px solid var(--sim-stroke);
  border-radius: var(--sim-radius-pill); background: var(--sim-bg-surface); color: var(--sim-label); font: inherit; font-weight: 800; font-size: var(--sim-text-sm); cursor: pointer;
  box-shadow: 0 3px 0 color-mix(in oklab, var(--sim-stroke) 70%, transparent); }
.sp-chip:active { transform: translateY(3px); box-shadow: none; }
.sp-chip:disabled { opacity: 0.4; cursor: default; transform: none; }
.sp-chip.is-on { border-color: var(--sim-accent); background: color-mix(in oklab, var(--sim-accent) 18%, var(--sim-bg-surface)); opacity: 1; }
.sp-chip.is-yes { opacity: 1; border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 20%, var(--sim-bg-surface)); }
.sp-chip.is-no { opacity: 1; border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 16%, var(--sim-bg-surface)); }
.sp-go { min-height: 50px; padding: 2px var(--sim-space-4); border: 2px solid var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke)));
  border-radius: var(--sim-radius-md); background: var(--primary-color, var(--sim-accent)); font: inherit; font-weight: 800; font-size: var(--sim-text-md); cursor: pointer;
  box-shadow: 0 4px 0 var(--primary-hover, color-mix(in oklab, var(--sim-accent) 55%, var(--sim-stroke))); }
.gm .sp-go { color: var(--sim-bg-deep); }
.sp-go:active { transform: translateY(4px); box-shadow: none; }
.sp-go:disabled { opacity: 0.4; cursor: default; transform: none; box-shadow: none; }
.sp-chip:focus-visible, .sp-go:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
.sp-tag { padding: 3px var(--sim-space-3); border-radius: var(--sim-radius-md); border: 2px solid var(--sim-stroke); font-weight: 800; font-size: var(--sim-text-sm); line-height: 1.3;
  color: var(--sim-label); text-align: center; animation: sp-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both; }
.sp-tag.is-yes { border-color: var(--sim-good); background: color-mix(in oklab, var(--sim-good) 16%, var(--sim-bg-surface)); }
.sp-tag.is-no { border-color: var(--sim-warning); background: color-mix(in oklab, var(--sim-warning) 14%, var(--sim-bg-surface)); }
.sp-heat { display: flex; align-items: stretch; gap: var(--sim-space-3); }
.sp-heat__c { display: flex; flex-direction: column; align-items: center; gap: var(--sim-space-2); min-width: 0; }
.sp-thermo { display: block; width: 110px; height: auto; flex: none; }
.sp-thermo__t { font-weight: 800; font-size: 14px; fill: var(--sim-label); }
.sp-thermo__now { font-weight: 900; font-size: 15px; fill: var(--sim-error); }
.sp-heat .sflow-choice { grid-auto-flow: row; border-radius: var(--sim-radius-md); }
.sp-heat .sflow-choice__opt { border-radius: var(--sim-radius-sm); }
.sp-lvl { transition: y 0.35s ease, height 0.35s ease; }
.sp-stream { animation: sp-fade 0.3s ease both; }
.sp-magnet { transition: transform 0.35s cubic-bezier(0.34, 1.3, 0.64, 1); }
.sp-nail.is-up { animation: sp-up 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) both; }
.sp-xtal { animation: sp-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; animation-delay: calc(var(--i) * 60ms); transform-box: fill-box; transform-origin: 50% 50%; }
.sp-run, .sp-escape { animation: sp-fade 0.6s ease both; }
@keyframes sp-pop { from { transform: scale(0.5); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes sp-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes sp-up { from { translate: 0 76px; } to { translate: 0 0; } }
@media (prefers-reduced-motion: reduce) {
  .sp-tag, .sp-stream, .sp-nail.is-up, .sp-xtal, .sp-run, .sp-escape { animation: none; }
  .sp-lvl, .sp-magnet { transition: none; }
}
`;
