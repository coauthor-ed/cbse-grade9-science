import { esc } from 'simulations/base/kit/GameScene.js';
import { FieldGuideScene } from './FieldGuideScene.js';
import { shuffle } from './FieldGuide.js';

// "Card packs": win packs in the other games, or earn one here by answering a
// quick question, then open it for three organism cards. Commons come often,
// rares and epics rarely. Own every card of a group to win a bonus pack.
// The cards are collectibles; the museum is where understanding is recorded.
//
// CONFIG: { ariaLabel, title?, groups?: [groupIds in the album, default all] }
const WEIGHT = { 1: 6, 2: 3, 3: 1 };
const RARITY = { 1: 'Common', 2: 'Rare', 3: 'Epic' };

export const CARDS_CSS = `
.cp-acts .ek-run[disabled] { opacity:1; background:var(--sim-bg-cell); color:var(--sim-label); border-color:var(--sim-stroke); }
.cp-home { display:flex; align-items:center; gap:var(--sim-space-3); }
.cp-pack { position:relative; display:flex; align-items:center; justify-content:center; width:92px; height:118px; flex:none; border:3px solid var(--sim-accent); border-radius:var(--sim-radius-md); background:repeating-linear-gradient(135deg, var(--sim-bg-surface) 0 10px, var(--sim-bg-cell) 10px 20px); font-size:34px; font-weight:800; color:var(--sim-accent); }
.cp-pack.cp-empty { opacity:.4; border-style:dashed; }
.cp-pack b { position:absolute; top:-10px; right:-10px; min-width:28px; height:28px; padding:0 6px; display:flex; align-items:center; justify-content:center; border-radius:var(--sim-radius-pill); background:var(--sim-accent); color:var(--sim-bg-deep); font-size:var(--sim-text-md); }
.cp-acts { display:flex; flex-direction:column; gap:var(--sim-space-2); flex:1 1 0; }
.cp-hand { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--sim-space-3); }
.cp-card { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:var(--sim-space-1); min-height:196px; padding:var(--sim-space-2); border:3px solid var(--t, var(--sim-stroke)); border-radius:var(--sim-radius-lg); background:var(--sim-bg-surface); box-shadow:0 4px 0 var(--t, var(--sim-stroke)); text-align:center; line-height:1.2; font-weight:800; }
.cp-card.cp-back { background:repeating-linear-gradient(135deg, var(--sim-bg-surface) 0 10px, var(--sim-bg-cell) 10px 20px); border-color:var(--sim-accent); box-shadow:0 4px 0 var(--sim-accent); color:var(--sim-accent); font-size:40px; cursor:pointer; }
.cp-card .ek-av { width:64px; height:64px; }
.cp-card small { font-size:var(--sim-text-sm); color:var(--sim-label-muted); font-weight:700; }
.cp-rar { padding:1px var(--sim-space-2); border-radius:var(--sim-radius-pill); font-size:var(--sim-text-sm); font-weight:800; background:var(--sim-bg-cell); }
.cp-rar.r2 { background:var(--sim-series-1); color:var(--sim-bg-deep); } .cp-rar.r3 { background:var(--sim-series-2); color:var(--sim-bg-deep); }
.cp-new { color:var(--sim-success); font-size:var(--sim-text-sm); font-weight:800; }
.cp-opts { display:flex; flex-direction:column; gap:var(--sim-space-2); }
.cp-opt { text-align:left; line-height:1.25; }
.cp-opt.cp-no { border-color:var(--sim-warning); opacity:.7; } .cp-opt.cp-yes { border-color:var(--sim-success); background:var(--sim-success); color:var(--sim-bg-deep); }
.cp-alb { display:flex; flex-direction:column; gap:var(--sim-space-1); margin-bottom:var(--sim-space-3); }
.cp-alb .gm-tile small { font-size:var(--sim-text-sm); color:var(--sim-label-muted); }
.sim-dom-root--portrait .cp-hand { grid-template-columns:repeat(3,minmax(0,1fr)); }
`;

export class CardPacksScene extends FieldGuideScene {
  static CSS = CARDS_CSS;

  init() {
    this.stage = 'home';
    this.msg = '';
    this.q = null;
    this.hand = null;
    this.seen = new Set();
    this.n = 0;
    this._off = this.coll ? this.coll.onChange(() => { if (this.stage === 'home') this.paint(); }) : null;
  }

  get albumGroups() { return (this.cfg.groups || this.fg.groups.map((g) => g.id)).map((id) => this.fg.group(id)).filter(Boolean); }
  get pool() { const ids = new Set(this.albumGroups.map((g) => g.id)); return this.fg.organisms.filter((o) => ids.has(o.group)); }

  act(name, d) {
    switch (name) {
      case 'home': this.stage = 'home'; this.msg = ''; break;
      case 'album': this.stage = 'album'; break;
      case 'quiz': this.q = this._question(); this.stage = 'quiz'; this.msg = ''; break;
      case 'answer': return this._answer(Number(d.i));
      case 'open': return this._open();
      case 'flip': this.seen.add(Number(d.i)); break;
      default: return;
    }
    this.paint();
  }

  // ---- quick question -> pack -----------------------------------------------
  _question() {
    const fg = this.fg;
    const pool = this.pool;
    const o = pool[Math.floor(Math.random() * pool.length)];
    const kinds = ['group', 'trait', 'decides', 'tf'];
    const kind = kinds[this.n++ % kinds.length];
    const groups = this.albumGroups;
    if (kind === 'group' || (kind === 'decides' && !fg.decisive(o.group).length)) {
      const wrong = shuffle(groups.filter((g) => g.id !== o.group)).slice(0, 2);
      const opts = shuffle([{ text: this._gl(fg.group(o.group)), ok: true }, ...wrong.map((g) => ({ text: this._gl(g), ok: false }))]);
      return { text: `Which group does <b>${esc(o.name)}</b> belong to?`, opts, why: `${esc(o.name)} is ${esc(this.groupName(o.group))}.`, org: o };
    }
    if (kind === 'trait') {
      const t = shuffle(fg.traits.filter((x) => x.kind === 'evidence' && o.set.has(x.id) && pool.some((p) => !p.set.has(x.id))))[0];
      const yes = shuffle(pool.filter((p) => p.set.has(t.id)))[0];
      const no = shuffle(pool.filter((p) => !p.set.has(t.id))).slice(0, 2);
      return { text: `Which one has this? <b>${esc(t.yes)}</b>`, opts: shuffle([{ text: yes.name, ok: true }, ...no.map((p) => ({ text: p.name, ok: false }))]), why: `${esc(yes.name)}: ${esc(t.yes.toLowerCase())}.`, org: yes };
    }
    if (kind === 'decides') {
      const dec = fg.decisive(o.group);
      const right = fg.trait(dec[Math.floor(Math.random() * dec.length)]);
      const bad = shuffle(fg.traits.filter((t) => o.set.has(t.id) && !dec.includes(t.id) && !fg.isMarker(t.id))).slice(0, 2);
      return { text: `Which fact decides that <b>${esc(o.name)}</b> is in ${esc(this.groupName(o.group))}?`, opts: shuffle([{ text: right.yes, ok: true }, ...bad.map((t) => ({ text: t.yes, ok: false }))]), why: `${esc(right.yes)} is what decides ${esc(this.groupName(o.group))}.`, org: o };
    }
    const t = shuffle(fg.traits.filter((x) => x.kind === 'evidence' && !fg.isMarker(x.id)))[0];
    const truth = o.set.has(t.id);
    const claim = Math.random() < 0.5 ? truth : !truth;
    return { text: `True or false: <b>${esc(o.name)}</b> - ${esc((claim ? t.yes : t.no).toLowerCase())}.`, opts: [{ text: 'True', ok: claim === truth }, { text: 'False', ok: claim !== truth }], why: `${esc(o.name)}: ${esc(this.fg.say(o, t.id).toLowerCase())}.`, org: o };
  }

  _gl(g) { return `${g.label} - ${g.plain}`; }

  _answer(i) {
    const q = this.q;
    if (!q || q.done !== undefined) return;
    q.picked = i;
    q.done = !!q.opts[i].ok;
    if (q.done) { this.pack(1); this.msg = `<b>Correct!</b> ${q.why} <b>+1 pack</b>`; } else this.msg = `<b>Not quite.</b> ${q.why} Try another question.`;
    this.paint();
  }

  // ---- open a pack ----------------------------------------------------------
  _draw() {
    const pool = this.pool;
    const total = pool.reduce((n, o) => n + (WEIGHT[o.rarity] || 1), 0);
    let r = Math.random() * total;
    for (const o of pool) { r -= WEIGHT[o.rarity] || 1; if (r <= 0) return o; }
    return pool[0];
  }

  _open() {
    if (!this.coll || !this.coll.takePack()) return;
    this.hand = Array.from({ length: 3 }, () => { const o = this._draw(); return { o, isNew: !this.coll.cards(o.id) }; });
    // a card already drawn twice in one pack is not "new" twice
    const first = new Set();
    this.hand.forEach((c) => { if (first.has(c.o.id)) c.isNew = false; first.add(c.o.id); });
    this.hand.forEach((c) => this.coll.addCard(c.o.id));
    this.seen = new Set();
    this.stage = 'open';
    const bonus = [];
    this.albumGroups.forEach((g) => {
      const kin = this.fg.ofGroup(g.id);
      if (kin.length >= 2 && !this.coll.hasSet(g.id) && kin.every((o) => this.coll.cards(o.id) > 0)) { this.coll.markSet(g.id); this.coll.addPack(1); bonus.push(g.label); }
    });
    this.msg = bonus.length ? `<b>Set complete: ${esc(bonus.join(', '))}!</b> Bonus pack added.` : '';
    this.paint();
  }

  // ---- views ----------------------------------------------------------------
  view() {
    const title = this.cfg.title || 'Card packs';
    if (!this.coll) return `${this.head(title)}<p class="gm-msg gm-bad">Your cards are saved with your learner profile, and none is open here.</p>`;
    if (this.stage === 'quiz') return this._quiz(title);
    if (this.stage === 'open') return this._hand(title);
    if (this.stage === 'album') return this._album(title);
    const packs = this.coll.packs;
    const owned = this.coll.ownedCards().length;
    return `${this.head(title, `<span class="gm-h2">${owned}/${this.pool.length} cards</span>`)}
      <div class="cp-home"><div class="cp-pack${packs ? '' : ' cp-empty'}" aria-hidden="true">?<b>${packs}</b></div>
      <div class="cp-acts">${this.btn(packs ? `Open a pack (${packs})` : 'No packs yet', 'open', {}, 'ek-btn ek-run', `${packs ? '' : ' disabled'} data-focus="1"`)}
      ${this.btn('Earn a pack: answer a question', 'quiz')}${this.btn('Album', 'album')}</div></div>
      <p class="gm-msg">Win any game in the Field Station and you get a pack. ${this.msg}</p><div class="gm-grow"></div>`;
  }

  _quiz(title) {
    const q = this.q;
    const opts = q.opts.map((o, i) => {
      const st = q.done === undefined ? '' : (o.ok ? ' cp-yes' : (i === q.picked ? ' cp-no' : ''));
      return this.btn(esc(o.text), 'answer', { i }, `ek-chipbtn cp-opt${st}`, q.done !== undefined ? ' disabled' : '');
    }).join('');
    return `${this.head(title, `<span class="gm-h2">${this.coll.packs} packs</span>`)}<p class="gm-bubble">${q.text}</p><div class="cp-opts">${opts}</div>
      ${this.msg ? `<p class="gm-msg ${q.done ? 'gm-good' : 'gm-bad'}">${this.msg}</p>` : ''}<div class="gm-grow"></div>
      <div class="ek-foot gm-row">${this.btn('Back', 'home')}<span class="gm-grow"></span>${q.done !== undefined ? this.btn('Another question', 'quiz', {}, 'ek-btn ek-run', ' data-focus="1"') : ''}</div>`;
  }

  _hand(title) {
    const all = this.hand.every((_, i) => this.seen.has(i));
    const cards = this.hand.map((c, i) => this.seen.has(i)
      ? `<div class="cp-card gm-pop" style="--t:var(--sim-series-${c.o.tone})">${this.av(c.o)}<span>${esc(c.o.name)}</span><small>${esc(this.groupName(c.o.group))}</small><span class="cp-rar r${c.o.rarity}">${RARITY[c.o.rarity]}</span>${c.isNew ? '<span class="cp-new">NEW!</span>' : `<small>x${this.coll.cards(c.o.id)}</small>`}</div>`
      : this.btn('?', 'flip', { i }, 'cp-card cp-back', ' aria-label="Flip card"')).join('');
    return `${this.head(title, `<span class="gm-h2">${this.coll.packs} packs left</span>`)}<p class="gm-h2">Tap each card to flip it.</p><div class="cp-hand">${cards}</div>
      ${all && this.msg ? `<p class="gm-msg gm-good">${this.msg}</p>` : ''}<div class="gm-grow"></div>
      <div class="ek-foot gm-row"><span class="gm-grow"></span>${all ? this.btn(this.coll.packs ? 'Open another' : 'Done', this.coll.packs ? 'open' : 'home', {}, 'ek-btn ek-run', ' data-focus="1"') : ''}${all && this.coll.packs ? this.btn('Done', 'home') : ''}</div>`;
  }

  _album(title) {
    const secs = this.albumGroups.map((g) => {
      const kin = this.fg.ofGroup(g.id);
      const got = kin.filter((o) => this.coll.cards(o.id) > 0).length;
      const tiles = kin.map((o) => {
        const n = this.coll.cards(o.id);
        return `<div class="gm-tile ${n ? '' : 'gm-lock'}" style="--t:var(--sim-series-${o.tone})">${this.av(o)}<span>${n ? esc(o.name) : '???'}</span>${n ? `<small>${RARITY[o.rarity]}${n > 1 ? ` x${n}` : ''}</small>` : ''}</div>`;
      }).join('');
      return `<div class="cp-alb"><span class="gm-h2">${esc(g.label)} ${got}/${kin.length}${kin.length >= 2 && got === kin.length ? ' ★ set' : ''}</span><div class="gm-grid" style="--cols:5">${tiles}</div></div>`;
    }).join('');
    return `${this.head(title, `<span class="gm-h2">Album</span>`)}<div class="ek-scroll">${secs}</div><div class="ek-foot gm-row">${this.btn('Back', 'home')}</div>`;
  }

  destroy() {
    if (this._off) this._off();
    super.destroy();
  }
}
