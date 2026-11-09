// TapMin - keeps a scene's own buttons, choices and sliders at least 44 px tall ON SCREEN.
// A phone scales a scene down a little (a 350 px design shows at about 342 px), so a 44 px design button
// shows at 43. tapMin(scene) watches the scale wrap and sets --tap-min on the scene root: the design px
// that show as 44 screen px now, on a phone (portrait) only: landscape keeps its design sizes, so the
// scene stays inside its static HEIGHT. TAP_MIN_CSS applies it to the kit's flow controls; a scene's own
// row uses min-height: var(--tap-min, 44px) in its CSS.
//   async setup() { await super.setup(); tapMin(this); ... }   css() { return ... + TAP_MIN_CSS; }

const MIN_PX = 44;

export const TAP_MIN_CSS = ' .sim-dom-root--portrait.svs .sflow-choice__opt, .sim-dom-root--portrait.svs .sflow-chip, .sim-dom-root--portrait.svs .sflow-btn { min-height: var(--tap-min, 46px); }';

export function tapMin(scene) {
  const set = () => {
    const r = scene?.root;
    if (!r?.isConnected) return;
    if (!r.classList.contains('sim-dom-root--portrait')) { r.style.removeProperty('--tap-min'); return; }
    const w = r.offsetWidth, s = r.getBoundingClientRect().width;
    if (!w || !s) return;
    const v = `${Math.ceil(MIN_PX / Math.min(1, s / w)) + 1}px`;
    if (r.style.getPropertyValue('--tap-min') !== v) r.style.setProperty('--tap-min', v);
  };
  set();
  const box = scene?._scaleWrap || scene?.root?.parentNode;
  if (box && typeof ResizeObserver === 'function' && !scene._tapMinRo) {
    scene._tapMinRo = new ResizeObserver(set);
    scene._tapMinRo.observe(box);
  }
}
