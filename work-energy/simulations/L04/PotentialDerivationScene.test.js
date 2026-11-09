// Drives PotentialDerivationScene through its own state API and checks the
// arithmetic the stub's "Must get right" names, because no static gate moves a
// dial. Run:
//   node tools/sim-test/run.mjs exec courses/work-energy/simulations/L04/PotentialDerivationScene.test.js
//
// The harness DOM has no HTML parser, so the markup string never becomes a node
// tree and the dials are null here: the scene still keeps its own numeric state
// (mass, height, zero), which is what the ledger is computed from, so the model
// and every beat's onStep are checked directly. The painted text is checked from
// the entry markup instead.
import { installFakeHost, makeContainer, check, summary } from '../../../../tools/sim-test/harness.mjs';

installFakeHost();
const { PotentialDerivationScene } = await import('./PotentialDerivationScene.js');

const n = 'PotentialDerivationScene';
const sc = new PotentialDerivationScene(makeContainer());
await sc.setup();

// The harness DOM has no HTML parser, so setup's markup string never becomes a
// node tree and every read/write element the scene holds is null. The scene
// guards each one, which is the right behaviour but leaves nothing to assert
// on, so the text sinks are stubbed here: `_paint` writes `.textContent` on
// them, and the model's own output is then readable.
const sink = () => ({ textContent: '' });
for (const k of ['w', 'u', 'wsub', 'usub', 'u2', 'd', 'u2sub', 'dsub', 'massVal', 'heightVal', 'zeroVal', 'forcelab']) sc[`_${k}`] = sink();

const G = 10;

// --- the stub's ledger rule: W and U are the same number by construction -----
const set = (m, h, z) => { sc._mass = { value: String(m) }; sc._height = { value: String(h) }; sc._zerodial = { value: String(z) }; sc._paint(); };
const read = (key) => String(sc[`_${key}`].textContent);

set(2, 3, 0);
check(read('w') === '60' && read('u') === '60', `${n}: W and U are the same number at 2 kg / 3 m, got ${read('w')} and ${read('u')}`);
check(read('wsub') === '20 N × 3.0 m' && read('usub') === '2 kg × 10 N/kg × 3.0 m', `${n}: each upper cell shows the substitution behind it, got "${read('wsub')}" and "${read('usub')}"`);

// The whole dial grid, exactly: W == U everywhere, and U = m g h in joules.
for (let m = 1; m <= 20; m += 1) {
  for (let h = 0; h <= 10; h += 0.5) {
    set(m, h, 0);
    if (Number(read('w')) !== G * m * h || read('w') !== read('u')) {
      check(false, `${n}: ledger breaks at m=${m} h=${h}: W=${read('w')} U=${read('u')}`);
      break;
    }
    if (!Number.isInteger(Number(read('w')))) {
      check(false, `${n}: non-integer reading at m=${m} h=${h}: ${read('w')}`);
      break;
    }
  }
}
check(true, `${n}: W == U == mgh for all 20 x 21 dial settings, every reading whole joules`);

// --- the asymmetry, which is the whole of beat 2 -----------------------------
set(2, 3, 0);
const wBefore = read('w');
const uBefore = read('u');
set(2, 3, 2);
check(read('w') === wBefore, `${n}: moving the zero line leaves the work readout at ${wBefore} J, got ${read('w')}`);
check(read('u') === wBefore, `${n}: the upper stored reading is still the work, got ${read('u')}`);
check(read('u2') === '20', `${n}: lower stored reading drops to 20 J at z = 2 m, got ${read('u2')}`);
check(read('d') === '-40', `${n}: the change is exactly -mg z = -40 J, got ${read('d')}`);
set(2, 3, 0);
check(read('u2') === '60' && read('d') === '0', `${n}: dragging the zero line back restores both lower numbers`);

// The extremes of each dial, which the stubs gate cannot reach.
set(20, 10, 0);
check(read('w') === '2000' && read('u2') === '2000', `${n}: 20 kg at 10 m is 2000 J at the top of both dials`);
set(1, 0, 0);
check(read('w') === '0' && read('u') === '0', `${n}: height at its end stop is 0 J`);
set(2, 0, 10);
check(read('u2') === '-200', `${n}: the zero line above the block gives a negative reading, honestly`);

// --- beats -------------------------------------------------------------------
set(2, 5, 4); // a learner who has already moved both dials
sc.onStep(0, 4);
check(sc._heightNum() === 0 && sc._zeroNum() === 0, `${n}: beat 0 resets both dials to the declared zero state`);
check(read('w') === '0' && read('u') === '0' && read('u2') === '0' && read('d') === '0', `${n}: beat 0 shows all four readings at zero`);

set(2, 0, 0);
sc.onStep(1, 4);
check(sc._heightNum() === 3, `${n}: a cold mount on beat 1 raises the height to 3.0 m, got ${sc._heightNum()}`);
check(sc._zeroNum() === 0, `${n}: beat 1 leaves the zero line alone`);

set(2, 5, 0);
sc.onStep(1, 4);
check(sc._heightNum() === 5, `${n}: beat 1 never overrides a height the learner has set, got ${sc._heightNum()}`);

set(2, 3, 0);
sc.onStep(2, 4);
check(sc._zeroNum() === 2, `${n}: a cold mount on beat 2 moves the zero line to 2.0 m, got ${sc._zeroNum()}`);
check(sc._heightNum() === 3, `${n}: beat 2 does not move the block`);
set(2, 3, 6);
sc.onStep(2, 4);
check(sc._zeroNum() === 6, `${n}: beat 2 never overrides a zero line the learner has set, got ${sc._zeroNum()}`);

const before3 = { w: read('w'), u2: read('u2'), h: sc._heightNum(), z: sc._zeroNum() };
sc.onStep(3, 4);
check(read('w') === before3.w && read('u2') === before3.u2 && sc._heightNum() === before3.h && sc._zeroNum() === before3.z,
  `${n}: beat 3 changes nothing at all, as the stub requires`);

// --- the one celebration, and only from the learner's own hand ---------------
set(2, 3, 0);
check(sc._sang === false, `${n}: the celebration is not latched before it is earned`);
sc._checkZero();
check(sc._sang === false, `${n}: no celebration while the zero line is still on the ground`);
sc._height = { value: '3' };
sc._zerodial = { value: '3' };
sc._checkZero();
check(sc._sang === true, `${n}: U = 0 with the block still up fires the celebration`);
sc._zerodial = { value: '0' };
sc._checkZero();
check(sc._sang === true, `${n}: the celebration is latched: a later dial move cannot re-fire it`);

// --- what the panel says, and what it must never say ------------------------
const markup = sc.root?.innerHTML || '';
const spoken = [
  ...[...markup.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]),
  markup.replace(/<[^>]*>/g, ' '),
  String(PotentialDerivationScene.ARIA_LABEL),
].join(' ');

for (const w of ['kinetic', 'conserv', 'power', 'machine', 'altimeter', 'altitude', 'barometer']) {
  check(!new RegExp(`\\b${w}`, 'i').test(spoken), `${n}: "${w}" is absent from the entry markup and ARIA_LABEL`);
}
check(/U = 0/.test(markup), `${n}: the zero line is tagged U = 0`);
check(!/g decreases|g gets smaller|higher up, g/i.test(spoken), `${n}: nothing on the panel argues about g and altitude`);
// g is named once, as the number the panel fixes - never as a dial.
check((spoken.match(/\b10 N\/kg\b/g) || []).length === 1, `${n}: g is stated exactly once, in the note card`);

console.log(summary());
