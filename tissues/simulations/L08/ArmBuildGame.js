// ArmBuildGame - blk-l08-game (replaces BuildTheArmGame). Build an arm that lifts a school bag: one tap chip per row
// for the bones (bone or cartilage), the muscle (skeletal muscle or fat), what joins muscle to bone (tendon or ligament),
// what joins bone to bone (ligament or tendon), the elbow joint (hinge; ball and socket, pivot, fixed are wrong) and the
// nerve signal (on or off). Test the arm: it lifts the bag only when every row is right; otherwise the drawing shows
// what goes wrong and each wrong choice gives its own plain reason. Choices stay open, so a learner can always win.
// Control names: the chips (Bone, Cartilage, Skeletal muscle, Fat, Tendon, Ligament, Hinge, Ball and socket, Pivot,
// Fixed, Signal on, Signal off) and Test the arm. Arm art: shared/LimbArt.js (agent S4).
import { GameBoard, mountGame, onTap, finishGame } from 'simulations/base/kit/GameFrame.js';
import { cwDefs, T, mx, n1 } from '../shared/CellWorld.js';
import { ARM, armGeom, armSvg, INK, CART_D } from '../shared/LimbArt.js';

const ROWS = [
  { id: 'bone', label: 'Upper arm and forearm', opts: [['bone', 'Bone'], ['cart', 'Cartilage']], right: 'bone', why: { cart: 'Cartilage is soft and bends. It cannot hold up the bag.' } },
  { id: 'muscle', label: 'Muscle', opts: [['musc', 'Skeletal muscle'], ['fat', 'Fat']], right: 'musc', why: { fat: 'Fat stores food. It cannot contract and pull.' } },
  { id: 'mb', label: 'Muscle to bone', opts: [['tendon', 'Tendon'], ['lig', 'Ligament']], right: 'tendon', why: { lig: 'No tendon: the muscle bunches up and does not pull the bone.' } },
  { id: 'bb', label: 'Bone to bone', opts: [['lig', 'Ligament'], ['tendon', 'Tendon']], right: 'lig', why: { tendon: 'No ligament: the bones are not held together, so the joint is not stable.' } },
  { id: 'joint', label: 'Elbow joint', opts: [['hinge', 'Hinge'], ['ball', 'Ball and socket'], ['pivot', 'Pivot'], ['fixed', 'Fixed']], right: 'hinge', why: { ball: 'A ball and socket joint lets the forearm swing sideways.', pivot: 'A pivot joint only turns. It cannot lift the forearm.', fixed: 'A fixed joint does not move: no bend, no lift.' } },
  { id: 'nerve', label: 'Nerve signal', opts: [['on', 'Signal on'], ['off', 'Signal off']], right: 'on', why: { off: 'No nerve signal: the muscle does not contract.' } },
];
const UP = 1.5, K = 0.6, OX = 166, OY = 42, VW = 360, VH = 292;
const NERVE = mx('series-2', 'gold', 50), BAD = T('error');

const CSS = `
.gm.ab { background: var(--sim-bg-deep); border-radius: 14px; padding: 8px 14px; gap: 6px; }
.ab .play { display: grid; grid-template-columns: 440px minmax(0, 1fr); grid-template-areas: 'pic rows' 'pic why'; grid-template-rows: auto 1fr; gap: 6px 16px; align-items: start; }
.ab .pic { grid-area: pic; } .ab .rows { grid-area: rows; } .ab .why { grid-area: why; }
.ab .pic { background: var(--sim-bg-surface); border: var(--sim-border); border-radius: var(--look-radius, 12px); padding: 4px; }
.ab .pic svg { width: 430px; height: 349px; display: block; }
.ab .ab-test { min-height: 46px; }
.ab .rows { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 14px; min-width: 0; }
.ab .ab-test { grid-column: 1 / -1; }
.ab .row { display: grid; grid-template-columns: minmax(0, 1fr); gap: 3px; }
.ab .row > span { font: 800 18px/1.15 var(--sim-font); color: var(--sim-label); }
.ab .chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ab .ab-chip { min-height: 46px; padding: 0 12px; display: flex; align-items: center; justify-content: center; font: 700 18px/1.1 var(--sim-font); text-align: center; }
.ab .ab-chip[aria-pressed="true"] { background: var(--sim-accent); color: var(--sim-bg-surface); border-color: var(--sim-accent); }
.ab .ab-test { min-height: 48px; display: flex; align-items: center; justify-content: center; font: 600 19px/1.1 var(--sim-font-display); }
.ab .why { margin: 0; padding: 0; list-style: none; display: grid; gap: 2px; min-height: 22px; }
.ab .why li { font-size: 17px; line-height: 1.3; font-weight: 700; color: var(--sim-label); }
.ab .why li[data-k="bad"] { color: var(--sim-error); }
.ab .why li[data-k="good"] { color: var(--sim-good); }
.sim-dom-root--portrait .ab .play { display: flex; flex-direction: column; gap: 6px; }
.sim-dom-root--portrait .gm.ab { padding: 6px; }
.sim-dom-root--portrait .ab .pic { align-self: center; order: 1; } .sim-dom-root--portrait .ab .rows { order: 2; } .sim-dom-root--portrait .ab .why { order: 3; }
.sim-dom-root--portrait .ab .pic svg { width: 300px; height: 243px; }
.sim-dom-root--portrait .ab .rows { grid-template-columns: minmax(0, 1fr); gap: 5px; }
.sim-dom-root--portrait .ab .row > span { font-size: 15px; }
.sim-dom-root--portrait .ab .ab-chip { padding: 0 10px; font-size: 15px; }
.sim-dom-root--portrait .ab .why li { font-size: 15px; }
`;

export class ArmBuildGame extends GameBoard {
  static HEIGHT = 520;
  static OBJECTIVE = { prompt: { en: 'Build an arm that lifts a load: choose the right bone, muscle, tendon, ligament, joint and nerve, then test it.' } };
  static ARIA_LABEL = 'Build an arm. Choose one in each row: bones, muscle, what joins muscle to bone, what joins bone to bone, the elbow joint and the nerve signal, then test the arm. It lifts the school bag only when every choice is right; each wrong choice shows a plain reason.';

  async setup() {
    await super.setup();
    this._reset();
    const rows = ROWS.map((r) => `<div class="row" role="group" aria-label="${r.label}"><span>${r.label}</span><div class="chips">${r.opts.map(([v, t]) => `<div class="tap btn ab-chip" role="button" tabindex="0" aria-pressed="false" data-r="${r.id}" data-v="${v}">${t}</div>`).join('')}</div></div>`).join('');
    mountGame(this, {
      css: CSS, check: false,
      html: `<div class="gm ab"><div class="gm-head"><h2>Build an arm that lifts</h2></div><div class="play"><div class="pic"><svg viewBox="0 0 ${VW} ${VH}" aria-hidden="true"></svg></div>
        <div class="rows">${rows}<div class="tap btn ab-test" role="button" tabindex="0">Test the arm</div></div><ul class="why" aria-live="polite"></ul></div></div>`,
    });
    this.root.querySelectorAll('.ab-chip').forEach((el) => onTap(el, () => this._pick(el.dataset.r, el.dataset.v)));
    const t = this.root.querySelector('.ab-test');
    if (t) onTap(t, () => this._test());
    this._draw();
  }
  _reset() { this._ch = {}; this._result = null; this._th = ARM.rest; this._won = false; this._stopLift(); }
  _stopLift() { if (this._af && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this._af); this._af = 0; }
  // a bounded lift: rest to UP over ms, then it stops (reduced motion: the end at once)
  _lift(ms) {
    this._stopLift();
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof requestAnimationFrame !== 'function') { this._th = UP; this._paint(); return; }
    const t0 = performance.now();
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2;
      this._th = ARM.rest + (UP - ARM.rest) * e; this._paint();
      this._af = k < 1 && this.root ? requestAnimationFrame(tick) : 0;
    };
    this._af = requestAnimationFrame(tick);
  }
  _pick(r, v) {
    if (this._won) return;
    this._ch[r] = v; this._result = null; this._th = ARM.rest; this._stopLift();
    this._draw();
  }
  _test() {
    if (this._won) return;
    const missing = ROWS.filter((r) => !this._ch[r.id]);
    if (missing.length) { this._result = { lines: [['bad', `Choose one in every row first: ${missing.map((r) => r.label.toLowerCase()).join(', ')}.`]], wrong: [] }; this._draw(); return; }
    const wrong = ROWS.filter((r) => this._ch[r.id] !== r.right);
    if (!wrong.length) {
      this._result = { lines: [['good', 'The nerve signal makes the muscle contract; the tendon pulls the forearm up at the hinge; the ligament holds the bones together.']], wrong: [] };
      this._won = true;
      this._draw();
      this._lift(1100);
      finishGame(this);
      return;
    }
    const lines = wrong.slice(0, 2).map((r) => ['bad', r.why[this._ch[r.id]]]);
    if (wrong.length > 2) lines.push(['bad', `${wrong.length - 2} more ${wrong.length - 2 > 1 ? 'rows' : 'row'} to fix.`]);
    this._result = { lines, wrong: wrong.map((r) => r.id) };
    this._draw();
  }
  _paint() {
    const svg = this.root.querySelector('.pic svg');
    if (!svg) return;
    const c = this._ch, res = this._result, wrong = res?.wrong ?? [], tested = !!res && !!(res.wrong.length || this._won);
    const first = wrong[0];
    const g = armGeom(this._th);
    const cut = c.mb === 'lig';
    const squeeze = tested && cut ? 1 : 0;
    const dim = (p) => {
      if (p === 'biceps' && c.muscle === 'fat') return 0.35;
      if ((p === 'humerus' || p === 'forearm') && c.bone === 'cart') return 0.5;
      return 1;
    };
    const arm = armSvg(g, { bag: true, cut, squeeze, dim });
    let s = `<defs>${cwDefs()}</defs><rect width="${VW}" height="${VH}" rx="12" style="fill:${mx('series-1', 'elev-peak', 14)}"/>`;
    const fy = n1(OY + g.floor * K);
    s += `<rect y="${fy}" width="${VW}" height="${n1(VH - fy)}" style="fill:${mx('strata-1', 'strata-3', 70)}"/><path d="M0 ${fy}H${VW}" style="fill:none;stroke:${mx('strata-3', INK, 60)};stroke-width:2"/>`;
    s += `<g transform="translate(${OX} ${OY}) scale(${K})">${arm.svg}`;
    // the nerve: a thin cord from the shoulder into the belly of the biceps; signal dots when on
    const m = arm.mid, nd = `M-30 -40Q-8 ${n1(m[1] * 0.4)} ${n1(m[0] - 4)} ${n1(m[1])}`;
    const on = c.nerve === 'on';
    s += `<path d="${nd}" style="fill:none;stroke:${on ? NERVE : mx('strata-5', 'elev-peak', 60)};stroke-width:4;stroke-linecap:round"/>`;
    if (on) for (let i = 0; i < 3; i++) s += `<circle r="5" style="fill:${T('gold')};stroke:${mx('gold', INK, 60)};stroke-width:1.4;offset-path:path('${nd}');offset-distance:${30 + i * 25}%"/>`;
    // what goes wrong, drawn on the arm
    if (tested && first === 'joint' && c.joint === 'fixed') s += `<rect x="${n1(g.E[0] - 12)}" y="${n1(g.E[1] - 12)}" width="24" height="24" rx="5" style="fill:${mx('strata-5', 'elev-peak', 50)};stroke:${INK};stroke-width:2.4"/><path d="M${n1(g.E[0] - 6)} ${n1(g.E[1] - 12)}v-6a6 6 0 0 1 12 0v6" style="fill:none;stroke:${INK};stroke-width:2.4"/>`;
    if (tested && first === 'joint' && c.joint === 'ball') for (const k of [-1, 1]) s += `<path d="M${n1(g.H[0] - 10)} ${n1(g.H[1] + 10)}q${k * 30} 10 ${k * 46} -10" style="fill:none;stroke:${BAD};stroke-width:3;stroke-dasharray:5 5"/>`;
    if (tested && first === 'joint' && c.joint === 'pivot') s += `<ellipse cx="${n1(g.E[0])}" cy="${n1(g.E[1] + 60)}" rx="24" ry="9" style="fill:none;stroke:${BAD};stroke-width:3;stroke-dasharray:6 5"/><path d="M${n1(g.E[0] + 20)} ${n1(g.E[1] + 54)}l6 6l-8 3" style="fill:none;stroke:${BAD};stroke-width:3"/>`;
    if (tested && first === 'bb') s += `<circle cx="${n1(g.E[0])}" cy="${n1(g.E[1])}" r="22" style="fill:none;stroke:${BAD};stroke-width:3;stroke-dasharray:6 5"/>`;
    if (c.bb === 'lig') s += `<path d="M${n1(g.E[0] - 10)} ${n1(g.E[1] - 16)}L${n1(g.E[0] - 12)} ${n1(g.E[1] + 18)}" style="fill:none;stroke:${CART_D};stroke-width:5;stroke-linecap:round;opacity:.8"/>`;
    if (tested && first === 'nerve') s += `<path d="M-38 -48l16 16m0 -16l-16 16" style="fill:none;stroke:${BAD};stroke-width:4;stroke-linecap:round"/>`;
    s += '</g>';
    if (this._won && this._th > UP - 0.05) s += `<text x="14" y="30" text-anchor="start" style="font-family:var(--sim-font-display);font-size:20px;font-weight:600;fill:${T('good')}">Lifted!</text>`;
    svg.innerHTML = s;
  }
  _draw() {
    const r = this.root;
    if (!r.querySelector('.gm')) return;
    r.querySelectorAll('.ab-chip').forEach((el) => el.setAttribute('aria-pressed', String(this._ch[el.dataset.r] === el.dataset.v)));
    const ul = r.querySelector('.why');
    if (ul) ul.innerHTML = (this._result?.lines ?? []).map(([k, t]) => `<li data-k="${k}">${t}</li>`).join('');
    this._paint();
    this.relayout?.();
  }
  destroy() { this._stopLift(); super.destroy?.(); }
  checkObjective() { return this._won ? { ok: true } : null; }
  resetChallenge() { super.resetChallenge(); this._reset(); this._draw(); }
}
