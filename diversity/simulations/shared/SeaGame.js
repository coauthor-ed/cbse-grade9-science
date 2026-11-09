// SeaGame.js - bits for GameBoard games on a sea stage: portrait test, a shared stylesheet. Not a scene.
export const isPortrait = (scene) => !!scene.root?.classList?.contains('sim-dom-root--portrait');
// The host puts a CHALLENGE header above a game, so at 1280x720 about 350 px stand free above the action bar. A
// 1100 x 330 frame mounts about 1165 x 350 there: every control and the message show on landing.
export const FIT_H = 330;
export const FIT_CSS = `
.sim-dom-root:not(.sim-dom-root--portrait) .gm { padding: 10px 14px; }
.sim-dom-root:not(.sim-dom-root--portrait) .gm .kicker { display: none; }
`;
/** A message the learner has just caused stays in sight: on a phone it can sit under the action bar, so bring it up. */
export function sayInSight(el) {
  if (!el?.textContent?.trim() || !el.getBoundingClientRect) return;
  requestAnimationFrame(() => {
    const r = el.getBoundingClientRect(), H = globalThis.innerHeight ?? 0, bar = 90;   // the action bar is about 80 px tall at every width
    if (r.bottom <= H - bar && r.top >= 0) return;
    const calm = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView?.({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
  });
}
// The frame penguin sits at the top right of the card; at landscape the board starts below its feet.
export const SEA_MASCOT_CSS = `
.sim-dom-root:not(.sim-dom-root--portrait) .gm .gm-head { margin-bottom: 16px; }
`;
export const SEA_GAME_CSS = SEA_MASCOT_CSS + `
.gm { background: var(--sim-bg-deep); border-radius: 14px; }
.gm .sea-pic { display: block; width: 100%; height: auto; border-radius: var(--sim-radius-lg); overflow: hidden; }
.gm .sg-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }
.gm .sg-row .btn { flex: 1 1 auto; min-height: 48px; min-width: 48px; }
.gm .btn[aria-pressed="true"] { background: color-mix(in oklab, var(--sim-accent) 30%, var(--sim-bg-surface)); border-color: var(--sim-accent); }
.gm .btn[disabled], .gm .btn[aria-disabled="true"] { opacity: 0.5; cursor: default; }
.gm .btn--go { background: var(--sim-accent); color: var(--sim-bg-deep); border-color: var(--sim-accent); }
.gm .sg-msg { font-size: 15px; font-weight: 700; line-height: 1.3; min-height: 2.6em; margin: 0; color: var(--sim-label); }
.gm .sg-msg[data-tone="bad"] { color: var(--sim-bad); }
.gm .sg-msg[data-tone="good"] { color: var(--sim-good); }
.gm .sg-board { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 14px; align-items: start; }
.gm .sg-side { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .gm .sg-board { display: flex; flex-direction: column; gap: 8px; }
.sim-dom-root--portrait .gm .sg-side { width: 100%; }
`;
