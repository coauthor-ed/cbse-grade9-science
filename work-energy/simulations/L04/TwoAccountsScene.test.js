// Drives TwoAccountsScene and checks the stub's "Must get right" clause, which
// no static gate can reach: that the K meter reads exactly zero while the ball
// is still, that the U meter reads the full value for its height, and that the
// add control is greyed on every beat with no code path from a tap to a
// combined reading. Run:
//   node tools/sim-test/run.mjs exec courses/work-energy/simulations/L04/TwoAccountsScene.test.js
//
// The harness DOM has no HTML parser, so the entry markup never becomes a node
// tree and the scene's element handles are empty. What is checkable is the
// markup string itself (every reading, every control, every word) plus the one
// piece of scene state, the selection, driven through fake handles.
import { installFakeHost, makeContainer, check, summary } from '../../../../tools/sim-test/harness.mjs';

installFakeHost();
const { TwoAccountsScene } = await import('./TwoAccountsScene.js');

const n = 'TwoAccountsScene';
const sc = new TwoAccountsScene(makeContainer());
await sc.setup();

const markup = sc.root?.innerHTML || '';

// --- the numbers the slide's claim rests on -----------------------------------
// One card per height, in the stub's own order: shelf, ground, mid-air.
const heights = [...markup.matchAll(/h = ([\d.]+) m<\/span>/g)].map((m) => m[1]);
check(heights.join(',') === '2.0,0.0,1.0', `${n}: the three cards read h = 2.0, 0.0, 1.0 m, got ${heights.join(', ')}`);

// Every meter is a labelled track with a number; K first, then U, per card.
const meters = [...markup.matchAll(/data-key="([KU])">[\s\S]*?ta-mval">([\d.]+) J</g)].map((m) => [m[1], Number(m[2])]);
check(meters.length === 6, `${n}: six meters, two per card, got ${meters.length}`);
check(meters.filter(([k]) => k === 'K').every(([, v]) => v === 0), `${n}: K reads exactly 0.0 J on all three cards, got ${JSON.stringify(meters.filter(([k]) => k === 'K'))}`);

const U = meters.filter(([k]) => k === 'U').map(([, v]) => v);
check(U.join(',') === '10,0,5', `${n}: U reads 10.0, 0.0, 5.0 J for h = 2.0, 0.0, 1.0 m with m = 0.5 kg and g = 10, got ${U.join(', ')}`);
check(U[0] === 10, `${n}: the shelf card's U meter is the top of the 0-10 J scale, so "full" is a fact about the drawing`);

// The bars are the same picture as the numbers: one shared 0-10 J scale, so the
// shelf card's U bar reaches its track and the lower two do not.
const fills = [...markup.matchAll(/ta-fill" style="width:([\d.]+)%"/g)].map((m) => Number(m[1]));
check(fills.join(',') === '0,100,0,0,0,50', `${n}: the six bars read 0/100/0/0/0/50 percent of one 0-10 J scale, got ${fills.join(', ')}`);

// --- the controls, which are the whole slide -----------------------------------
const adds = [...markup.matchAll(/<button[^>]*ta-off ta-add[^>]*>/g)].map((m) => m[0]);
check(adds.length === 3, `${n}: one add control per card, got ${adds.length}`);
check(adds.every((t) => /\sdisabled/.test(t)), `${n}: every add control carries the native disabled attribute`);

const release = markup.match(/<button[^>]*ta-off"[^>]*>Release<\/button>/);
check(!!release, `${n}: there is a Release control`);
check(/\sdisabled/.test(release[0]), `${n}: the Release control is natively disabled`);

check(!/\stitle=/.test(markup), `${n}: no title attribute anywhere, so no tap can raise a tooltip`);

// A disabled button with no listener is the structural claim: there is no code
// path from a tap to anything, rather than a guard that could be deleted.
const src = String(await import('node:fs').then((fs) => fs.readFileSync(new URL('./TwoAccountsScene.js', import.meta.url), 'utf8')));
check(!/ta-add[^\n]*addEventListener/.test(src), `${n}: nothing listens to an add control`);
check(!/ta-off[^\n]*addEventListener/.test(src), `${n}: nothing listens to a disabled control of any kind`);
const listeners = [...src.matchAll(/addEventListener\('([^']+)'/g)].map((m) => m[1]);
check(listeners.every((e) => e === 'click'), `${n}: the only listener in the scene is a click, and it is on a stage: ${listeners.join(', ') || 'none'}`);

// No control is declared in the host bar either, so nothing lives outside the
// panel that a learner could press.
check(TwoAccountsScene.CONTROLS.length === 0, `${n}: CONTROLS is empty; the only controls are the in-panel ones the stub names`);

// --- what the panel must never say -------------------------------------------
const spoken = [
  ...[...markup.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]),
  markup.replace(/<[^>]*>/g, ' '),
  String(TwoAccountsScene.ARIA_LABEL),
].join(' ');

for (const w of ['conserv', 'constant', 'total', 'mechanical energy', 'power', 'watt', 'machine', 'sum', 'combined', 'add the two', 'together they']) {
  check(!new RegExp(`\\b${w}`, 'i').test(spoken), `${n}: "${w}" is absent from the entry markup and ARIA_LABEL`);
}
// "adding them together" is the note card's one allowed line, and it says the
// panel is not doing it - the check above rules out every phrasing that would
// say what the greyed control does.
check(/Nothing on this panel is adding them together/.test(spoken), `${n}: the note card says the two meters are the two accounts and that nothing here adds them`);
check(!/\btotal\b/i.test(spoken), `${n}: no total is named anywhere on the panel`);

// --- the one piece of state: which height is being read -----------------------
// The harness has no nodes, so the selection runs against fake handles with
// the same shape the scene uses.
const fake = (id) => ({
  dataset: { card: id },
  classList: { toggle: () => {} },
});
sc._cards = ['shelf', 'ground', 'mid'].map(fake);
sc._picks = ['shelf', 'ground', 'mid'].map((id) => ({ dataset: { pick: id }, _p: null, setAttribute(k, v) { this._p = v; } }));

sc._select('mid');
check(sc._cards.map((c) => c.dataset.sel).join(',') === '0,0,1', `${n}: selecting a card marks exactly that one`);
check(sc._picks.map((p) => p._p).join(',') === 'false,false,true', `${n}: aria-pressed follows the selection, so the stage is reachable by keyboard`);

for (let b = 0; b < 3; b += 1) sc.onStep(b, 3);
check(sc._cards.map((c) => c.dataset.sel).join(',') === '1,0,0', `${n}: every beat opens on the arrangement it opened on, so beat 2 is beat 0`);

check(sc.constructor.CONTINUOUS === false, `${n}: nothing on this panel loops, so the base class's CONTINUOUS = false stands`);

console.log(summary());
