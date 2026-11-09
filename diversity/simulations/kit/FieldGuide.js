// The course field guide: organisms with checkable traits, and the rules that
// put an organism (or a made-up chimera) into a group. Loaded from the course's
// field-guide.json and handed to scenes as `config.fieldGuide()`; every game in
// the kit reads it, so a trait is written once and every game agrees on it.
//
// file: { traits: [{ id, ask, yes, no, kind: 'evidence'|'lure', marker? }],
//         groups: [{ id, label, plain, tone, all: [ids], none: [ids] }],   (ordered: first match wins)
//         organisms: [{ id, name, group, art, tone, traits: [ids that are true], rarity: 1-3, note }],
//         tabs?: [[tabName, [trait ids]], ...] }
// A trait an organism does not list is false. An 'evidence' trait can decide a
// group; a 'lure' trait (lives in water, can fly) never does - that is the point.
// `marker: true` flags a trait as too foundational to show as a stray "fact"
// (e.g. "made of cells" for every organism in the guide) - optional, and
// nothing is hidden if a course declares none. `tabs` groups the guide's own
// traits for a question picker (Guess Who); a course with none gets every
// trait in a single tab, so this is cosmetic grouping, not a requirement.

// rng()/shuffle() are pure, generic randomness helpers with no course content
// in them, so they live in the shared kit and are just re-exported here - this
// file's own imports (`import { shuffle } from './FieldGuide.js'`) keep working.
export { rng, shuffle } from 'simulations/base/kit/shuffle.js';

export class FieldGuide {
  static from(raw) { return raw && Array.isArray(raw.organisms) && raw.organisms.length ? new FieldGuide(raw) : null; }

  constructor(raw) {
    this.traits = raw.traits || [];
    this.groups = raw.groups || [];
    this.organisms = raw.organisms.map((o) => ({ ...o, set: new Set(o.traits || []) }));
    this._t = new Map(this.traits.map((t) => [t.id, t]));
    this._g = new Map(this.groups.map((g) => [g.id, g]));
    this._o = new Map(this.organisms.map((o) => [o.id, o]));
    this._tabs = raw.tabs || null;
    this._markers = new Set(this.traits.filter((t) => t.marker).map((t) => t.id));
  }

  org(id) { return this._o.get(id) || null; }
  trait(id) { return this._t.get(id) || null; }
  group(id) { return this._g.get(id) || null; }
  orgs(ids) { return ids.map((id) => this._o.get(id)).filter(Boolean); }
  ofGroup(gid) { return this.organisms.filter((o) => o.group === gid); }
  has(org, traitId) { return org.set.has(traitId); }
  /** The sentence for an organism's answer to a trait. */
  say(org, traitId) { const t = this._t.get(traitId); return t ? (org.set.has(traitId) ? t.yes : t.no) : ''; }

  /** Group id for a set of true traits, or null when no rule fits. */
  classify(traits) {
    const s = traits instanceof Set ? traits : new Set(traits);
    for (const g of this.groups) {
      if (g.all.every((t) => s.has(t)) && !g.none.some((t) => s.has(t))) return g.id;
    }
    return null;
  }

  /** The traits that make an organism belong to its group (its rule, minus the marker traits). */
  decisive(gid) {
    const g = this._g.get(gid);
    return g ? g.all.filter((t) => t !== 'swallows' && t !== 'cells') : [];
  }

  /** The evidence sentences a group's rule checks: what it needs (yes) and what it must lack (no). */
  evidence(gid) {
    const g = this._g.get(gid);
    if (!g) return [];
    const skip = new Set(['swallows', 'cells']);
    return [
      ...g.all.filter((t) => !skip.has(t)).map((t) => this._t.get(t)?.yes),
      ...g.none.map((t) => this._t.get(t)?.no),
    ].filter(Boolean);
  }

  /** A face for a group: its first organism's art in the group's own colour. */
  groupFace(gid) {
    const g = this._g.get(gid);
    const o = this.organisms.find((x) => x.group === gid);
    return o && g ? { art: o.art, tone: g.tone } : null;
  }

  /** Tabs of trait ids for a question picker: the guide's own grouping if it
   * declares one, else every trait in a single tab (only ids that exist here). */
  tabs() {
    const src = this._tabs && this._tabs.length ? this._tabs : [['Traits', this.traits.map((t) => t.id)]];
    return src.map(([name, ids]) => [name, ids.filter((id) => this._t.has(id))]);
  }

  /** Whether a trait is flagged too foundational to show as a stray "fact" (see file header). */
  isMarker(traitId) { return this._markers.has(traitId); }

  /** Any trait that splits `cands` at all (yes for some, no for others), not in `asked`. */
  randomTrait(cands, asked, pick = Math.random) {
    const ok = this.traits.filter((t) => {
      if (asked.has(t.id)) return false;
      const yes = cands.filter((o) => o.set.has(t.id)).length;
      return yes > 0 && yes < cands.length;
    });
    return ok.length ? ok[Math.floor(pick() * ok.length)].id : null;
  }

  /**
   * The trait that splits `cands` closest to half and yes/no, not in `asked`.
   * `pick` chooses among near-ties so a bot does not always ask the same thing.
   */
  bestTrait(cands, asked, pick = Math.random) {
    let best = [];
    let gap = Infinity;
    for (const t of this.traits) {
      if (asked.has(t.id)) continue;
      const yes = cands.filter((o) => o.set.has(t.id)).length;
      if (yes === 0 || yes === cands.length) continue;
      const d = Math.abs(cands.length / 2 - yes);
      if (d < gap - 1e-9) { gap = d; best = [t.id]; } else if (Math.abs(d - gap) < 1e-9) best.push(t.id);
    }
    return best.length ? best[Math.floor(pick() * best.length)] : null;
  }
}
