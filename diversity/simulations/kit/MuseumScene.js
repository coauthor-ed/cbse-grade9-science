import { esc } from 'simulations/base/kit/GameScene.js';
import { FieldGuideScene } from './FieldGuideScene.js';

// "Museum of Life": every organism you get right in any game earns a plaque here.
// Bronze = met it, silver = got it right first time (or in a Rush), gold = a
// standout result (a Guess Who solved in four questions or fewer). The museum only
// reads the saved collection; the games write to it. Levels come from the medals.
//
// CONFIG: { ariaLabel, title?, groups?: [groupIds to show, default all] }
const LEVELS = [[0, 'Visitor'], [4, 'Guide'], [12, 'Curator'], [28, 'Head curator'], [50, 'Museum legend']];
const HOW = { bronze: 'Get it right first time to reach silver.', silver: 'A gold needs a standout result, such as Guess Who in four questions.', gold: 'Top medal. Nothing left to earn here.' };

export const MUSEUM_CSS = `
.mu-level { display:flex; align-items:center; gap:var(--sim-space-3); }
.mu-level b { font-size:var(--sim-text-lg); }
.mu-sect { display:flex; flex-direction:column; gap:var(--sim-space-1); margin-bottom:var(--sim-space-3); }
.mu-detail { display:flex; align-items:center; gap:var(--sim-space-3); padding:var(--sim-space-2) var(--sim-space-3); border:2px solid var(--t, var(--sim-stroke)); border-radius:var(--sim-radius-md); background:var(--sim-bg-surface); min-height:74px; }
.mu-detail .ek-av { width:52px; height:52px; }
.mu-detail p { margin:0; font-size:var(--sim-text-sm); line-height:1.3; }
.mu-medal { display:inline-block; width:14px; height:14px; border-radius:50%; margin-right:4px; vertical-align:-1px; }
.mu-medal.bronze { background:var(--sim-series-8); } .mu-medal.silver { background:var(--sim-label-muted); } .mu-medal.gold { background:var(--sim-series-2); }
.mu-count { font-size:var(--sim-text-sm); font-weight:800; color:var(--sim-label-muted); }
`;

export class MuseumScene extends FieldGuideScene {
  static CSS = MUSEUM_CSS;

  init() {
    this.sel = null;
    this._off = this.coll ? this.coll.onChange(() => this.paint()) : null;
  }

  _level(points) {
    let cur = LEVELS[0];
    let next = null;
    for (let i = 0; i < LEVELS.length; i++) { if (points >= LEVELS[i][0]) { cur = LEVELS[i]; next = LEVELS[i + 1] || null; } }
    return { name: cur[1], from: cur[0], next };
  }

  act(name, d) {
    if (name === 'pick') this.sel = this.sel === d.id ? null : d.id;
    this.paint();
  }

  view() {
    if (!this.coll) return `${this.head(this.cfg.title || 'Museum of Life')}<p class="gm-msg gm-bad">Your museum is saved with your learner profile, and none is open here.</p>`;
    const groups = (this.cfg.groups || this.fg.groups.map((g) => g.id)).map((id) => this.fg.group(id)).filter(Boolean);
    const shown = groups.flatMap((g) => this.fg.ofGroup(g.id));
    const have = shown.filter((o) => this.coll.medal(o.id)).length;
    const pts = this.coll.points();
    const lv = this._level(pts);
    const span = lv.next ? lv.next[0] - lv.from : 1;
    const sections = groups.map((g) => {
      const orgs = this.fg.ofGroup(g.id);
      const got = orgs.filter((o) => this.coll.medal(o.id)).length;
      const tiles = orgs.map((o) => {
        const m = this.coll.medal(o.id);
        return `<button type="button" class="gm-tile ${m ? `gm-medal-${m}` : 'gm-lock'}${this.sel === o.id ? ' gm-mine' : ''}" style="--t:var(--sim-series-${o.tone})" data-act="pick" data-id="${o.id}" aria-label="${m ? esc(o.name) : 'Locked'}">${this.av(o)}<span>${m ? esc(o.name) : '???'}</span></button>`;
      }).join('');
      return `<div class="mu-sect"><div class="gm-row"><span class="gm-h2">${esc(g.label)} <span class="mu-count">${got}/${orgs.length}${got === orgs.length ? ' ★' : ''}</span></span></div><div class="gm-grid" style="--cols:5">${tiles}</div></div>`;
    }).join('');
    const o = this.sel && this.fg.org(this.sel);
    const m = o && this.coll.medal(o.id);
    const detail = o
      ? `<div class="mu-detail" style="--t:var(--sim-series-${o.tone})">${this.av(o)}<div><b>${m ? esc(o.name) : 'Not found yet'}</b>${m ? ` <span class="mu-count"><i class="mu-medal ${m}"></i>${m}</span>` : ''}<p>${m ? `${esc(o.note)} ${esc(HOW[m])}` : 'Win a game with this organism in it to hang its plaque.'}</p></div></div>`
      : `<div class="mu-detail"><p>Tap a plaque to read it. Every game you win adds to this museum.</p></div>`;
    return `${this.head(this.cfg.title || 'Museum of Life', `<span class="mu-count">${have}/${shown.length} plaques</span>`)}
      <div class="mu-level"><b>${esc(lv.name)}</b><div class="gm-grow">${this.bar(lv.next ? pts - lv.from : 1, lv.next ? span : 1, 3)}</div><span class="mu-count">${pts} pts${lv.next ? ` · ${lv.next[0] - pts} to ${esc(lv.next[1])}` : ''}</span></div>
      <div class="ek-scroll">${sections}</div>${detail}`;
  }

  destroy() {
    if (this._off) this._off();
    super.destroy();
  }
}
