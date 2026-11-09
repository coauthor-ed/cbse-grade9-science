import { esc } from 'simulations/base/kit/GameScene.js';
import { FieldGuideScene } from './FieldGuideScene.js';
import { shuffle } from './FieldGuide.js';

// "Expedition": a short story trail. Each stop is a small field puzzle about a
// specimen the crew has found; solve it and the ship sails on. Three kinds:
//   classify  the field card lists the specimen's traits; pick its group
//   evidence  pick the fact that is real evidence for its group, not just a look
//   odd       pick the specimen that does not belong with the other three
// A wrong pick never ends the trip: it names what the group needs, and you try
// again. Finish the trail for medals on every specimen (silver if first time) and a pack.
//
// CONFIG: { ariaLabel, title?, ship?, stops: [ { place, story, after?, step: {
//   kind: 'classify', org, options: [groupIds], prompt? } |
//   { kind: 'evidence', org, prompt? } |
//   { kind: 'odd', ids: [4 organism ids], odd: id, why?, prompt? } } ] }
export const EXPEDITION_CSS = `
.ex-map { display:flex; align-items:center; gap:0; padding:0 var(--sim-space-1); }
.ex-stop { position:relative; flex:1 1 0; display:flex; flex-direction:column; align-items:center; gap:2px; font-size:var(--sim-text-sm); font-weight:800; color:var(--sim-label-muted); text-align:center; line-height:1.1; }
.ex-stop::before { content:''; position:absolute; top:8px; right:50%; width:100%; height:3px; background:var(--sim-stroke); z-index:0; }
.ex-stop:first-child::before { display:none; }
.ex-dot { position:relative; z-index:1; width:18px; height:18px; border-radius:50%; border:3px solid var(--sim-stroke); background:var(--sim-bg-deep); }
.ex-stop.ex-past .ex-dot { background:var(--sim-success); border-color:var(--sim-success); }
.ex-stop.ex-past::before, .ex-stop.ex-here::before { background:var(--sim-success); }
.ex-stop.ex-here .ex-dot { border-color:var(--sim-accent); background:var(--sim-accent); animation:gm-float 1.8s ease-in-out infinite; }
.ex-stop.ex-here { color:var(--sim-label); }
.ex-story { margin:0; font-size:var(--sim-text-md); line-height:1.35; font-weight:700; }
.ex-card { display:flex; gap:var(--sim-space-3); align-items:center; padding:var(--sim-space-1) var(--sim-space-3); border:2px solid var(--t, var(--sim-stroke)); border-radius:var(--sim-radius-lg); background:var(--sim-bg-surface); box-shadow:0 3px 0 var(--t, var(--sim-stroke)); }
.ex-card .ek-av { width:52px; height:52px; }
.ex-chips { display:flex; flex-wrap:wrap; gap:var(--sim-space-1); }
.ex-opts { display:grid; grid-template-columns:repeat(var(--cols,2),minmax(0,1fr)); gap:var(--sim-space-2); }
.ex-opt { text-align:left; line-height:1.2; font-size:var(--sim-text-md); min-height:44px; }
.ex-opt.ex-no { border-color:var(--sim-warning); opacity:.65; }
.ex-opt.ex-yes { border-color:var(--sim-success); background:var(--sim-success); color:var(--sim-bg-deep); }
.ex-opt.gm-tile { flex-direction:row; justify-content:flex-start; gap:var(--sim-space-2); text-align:left; }
.sim-dom-root--portrait .ex-opts { --cols:1; }
`;

export class ExpeditionScene extends FieldGuideScene {
  static CSS = EXPEDITION_CSS;

  init() { this._reset(); }

  _reset() {
    this.i = 0;
    this.tried = new Set();
    this.clean = new Set();   // organism ids solved first try
    this.met = new Set();
    this.solved = false;
    this.msg = '';
    this.stage = 'play';
    this._build();
  }

  get stops() { return this.cfg.stops || []; }
  get spot() { return this.stops[this.i]; }

  /** The options for the current stop: [{ label|org, ok, why? }]. */
  _build() {
    const st = this.spot;
    if (!st) { this.opts = []; return; }
    const s = st.step;
    const fg = this.fg;
    if (s.kind === 'classify') {
      const o = fg.org(s.org);
      this.opts = shuffle(s.options.map((gid) => ({ label: `${fg.group(gid).label} - ${fg.group(gid).plain}`, gid, ok: gid === o.group })));
    } else if (s.kind === 'evidence') {
      const o = fg.org(s.org);
      const dec = fg.decisive(o.group);
      const bad = shuffle(fg.traits.filter((t) => o.set.has(t.id) && !dec.includes(t.id) && !fg.isMarker(t.id))).slice(0, 3);
      const right = fg.trait(dec[Math.floor(Math.random() * dec.length)]);
      this.opts = shuffle([{ label: right.yes, ok: true }, ...bad.map((t) => ({ label: t.yes, ok: false, lure: t.kind === 'lure' }))]);
    } else {
      this.opts = shuffle(s.ids.map((id) => ({ org: fg.org(id), ok: id === s.odd })));
    }
  }

  act(name, d) {
    if (name === 'pick') return this._pick(Number(d.i));
    if (name === 'next') {
      this.i++;
      this.tried = new Set();
      this.solved = false;
      this.msg = '';
      if (this.i >= this.stops.length) this._finish(); else this._build();
    } else if (name === 'again') this._reset();
    return this.paint();
  }

  _orgIds(st) { const s = st.step; return s.kind === 'odd' ? s.ids : [s.org]; }

  _pick(i) {
    const o = this.opts[i];
    if (!o || this.solved || this.tried.has(i)) return;
    const st = this.spot;
    const s = st.step;
    const fg = this.fg;
    if (o.ok) {
      this.solved = true;
      this._orgIds(st).forEach((id) => { this.met.add(id); if (!this.tried.size) this.clean.add(id); });
      const org = fg.org(s.org || s.odd);
      const dec = fg.evidence(org.group);
      this.msg = `<b>Right.</b> ${esc(s.kind === 'odd' && s.why ? s.why : `${org.name}: ${dec.join(' + ') || org.note} - ${this.groupName(org.group)}.`)}${st.after ? ` ${esc(st.after)}` : ''}`;
    } else {
      this.tried.add(i);
      if (s.kind === 'classify') {
        const g = fg.group(o.gid);
        const need = fg.evidence(o.gid);
        this.msg = `<b>Not ${esc(g.label)}.</b> ${esc(g.label)} needs: ${esc(need.join(' + ') || g.plain)}. Does the specimen have it?`;
      } else if (s.kind === 'evidence') this.msg = `<b>${o.lure ? 'A look, and it decides nothing.' : 'True, but it does not decide the group.'}</b> Which fact does?`;
      else this.msg = `<b>${esc(o.org.name)}</b> fits with the others. Look for the one with different evidence, not different looks.`;
    }
    this.paint();
  }

  _finish() {
    this.stage = 'end';
    this.met.forEach((id) => this.award(id, this.clean.has(id) ? 'silver' : 'bronze'));
    if (this.coll) { this.pack(1); this.coll.bump('expedition:done'); }
  }

  view() {
    const title = this.cfg.title || 'Expedition';
    if (this.stage === 'end') {
      const chips = [...this.met].map((id) => this.fg.org(id)).map((o) => `<span class="gm-tile gm-medal-${this.clean.has(o.id) ? 'silver' : 'bronze'}" style="--t:var(--sim-series-${o.tone})">${this.av(o)}<span>${esc(o.name)}</span></span>`).join('');
      return `${this.head(title)}<div class="gm-big gm-pop">Expedition complete!</div>
        <p class="gm-msg gm-good">${this.met.size} specimens logged in the museum${this.coll ? ' · <b>+1 card pack</b>' : ''}. Silver = solved first time.</p>
        <div class="ek-scroll"><div class="gm-grid" style="--cols:4">${chips}</div></div>
        <div class="ek-foot gm-row">${this.btn('Go again', 'again')}</div>`;
    }
    const st = this.spot;
    const s = st.step;
    const map = `<div class="ex-map" aria-label="Route">${this.stops.map((p, k) => `<div class="ex-stop ${k < this.i || (k === this.i && this.solved) ? 'ex-past' : k === this.i ? 'ex-here' : ''}"><span class="ex-dot"></span>${esc(p.place)}</div>`).join('')}</div>`;
    let card = '';
    let opts;
    if (s.kind === 'odd') {
      opts = `<div class="ex-opts">${this.opts.map((o, i) => {
        const cls = `ek-chipbtn gm-tile ex-opt${this.solved ? (o.ok ? ' ex-yes' : ' ex-no') : (this.tried.has(i) ? ' ex-no' : '')}`;
        return this.btn(`${this.av(o.org)}<span>${esc(o.org.name)}</span>`, 'pick', { i }, cls, `${this.solved || this.tried.has(i) ? ' disabled' : ''} style="--t:var(--sim-series-${o.org.tone})"`);
      }).join('')}</div>`;
    } else {
      const org = this.fg.org(s.org);
      const traits = [...org.set].filter((t) => !this.fg.isMarker(t)).map((t) => this.fg.trait(t)).filter(Boolean);
      card = `<div class="ex-card" style="--t:var(--sim-series-${org.tone})">${this.av(org)}<div class="gm-col"><b class="gm-big">${esc(org.name)}</b><div class="ex-chips">${shuffle(traits, () => 0.5).map((t) => this.tag(t.yes, true)).join('')}</div></div></div>`;
      opts = `<div class="ex-opts">${this.opts.map((o, i) => this.btn(esc(o.label), 'pick', { i }, `ek-chipbtn ex-opt${this.solved ? (o.ok ? ' ex-yes' : ' ex-no') : (this.tried.has(i) ? ' ex-no' : '')}`, this.solved || this.tried.has(i) ? ' disabled' : '')).join('')}</div>`;
    }
    const prompt = s.prompt || (s.kind === 'classify' ? 'Which group does this specimen belong to?' : s.kind === 'evidence' ? 'Which fact decides its group?' : 'Which specimen does NOT belong with the other three?');
    const last = this.i + 1 >= this.stops.length;
    return `${this.head(title, `<span class="gm-h2">${esc(this.cfg.ship || '')}</span>`)}${map}
      <p class="ex-story">${esc(st.story)}</p>${card}<p class="gm-h2">${esc(prompt)}</p>${opts}
      ${this.msg ? `<p class="gm-msg ${this.solved ? 'gm-good' : 'gm-bad'}">${this.msg}</p>` : ''}<div class="gm-grow"></div>
      <div class="ek-foot">${this.solved ? this.btn(last ? 'Finish the trip' : 'Go on', 'next', {}, 'ek-btn ek-run', ' data-focus="1"') : ''}</div>`;
  }
}
