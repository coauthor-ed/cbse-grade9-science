// WideBoard.js - kit boards on a fullWidth slide at 1280: a wide design that keeps its text at scale 1,
// no scroller inside the page, and the working part on screen on landing.
//
//   import { wideBoard, wideFit } from '../shared/WideBoard.js';
//   static WIDTH = 1200; static HEIGHT = 400; static FILL_HEIGHT = false;   (scale 1 at 1280)
//   async setup() { await super.setup(); wideBoard(this); }
//   _fit() { wideFit(this); }
//
// HEIGHT is only the first-paint hint. Landscape takes the board's measured height, so every slot is
// reachable by the page scroll and no blank band sits under a short round. Portrait stays with the kit.
// The kit's undo glyphs are missing from the phone font, so the round buttons carry words in both layouts (as L08 does).
import { fitFrame } from 'simulations/base/kit/KeyBuilderScene.js';
import { swapArt } from './BoardArt.js';

export const WIDE_CSS = `
.ek-root .ek-run, .ek-root .ek-badge { color:var(--sim-bg-deep); }
.ek-root .ek-badge:disabled { opacity:1; background:var(--sim-bg-surface); color:var(--sim-label); }
.ek-root .ek-mini { width:auto; min-width:44px; height:44px; padding:0 12px; border-radius:var(--look-pill, 22px); font-size:0 !important; }
.ek-root .ek-mini::before { content:'Undo'; font:800 14px/1 var(--sim-font); color:var(--sim-label); white-space:nowrap; }
.ek-root .ek-mini[aria-label^="Back"]::before, .ek-root .ek-mini[aria-label^="Start"]::before { content:'Start again'; }
/* Phone targets: the board is scaled to about 0.92 at 390, so 48 design px is 44 on screen. */
.sim-dom-root--portrait .ek-mini, .sim-dom-root--portrait .ek-evtoggle, .sim-dom-root--portrait .ek-echip, .sim-dom-root--portrait .ek-chipbtn, .sim-dom-root--portrait .ek-btn, .sim-dom-root--portrait .sb-slot, .sim-dom-root--portrait .ek-badge { min-height:48px; }
.sim-dom-root--portrait .ek-chips.ek-g .ek-chipbtn { min-height:48px; }
.sim-dom-root--portrait .sb-slot { min-width:48px; justify-content:center; }
.wb-auto .ek-board:not(.nd-board) { display:grid; grid-template-columns:max-content minmax(0,1fr) max-content; gap:var(--sim-space-2) var(--sim-space-3); align-items:center; }
.wb-auto .ek-board:not(.nd-board) > * { grid-column:1 / -1; }
.wb-auto .ek-board:not(.nd-board) > .ek-head { display:contents; }
.wb-auto .ek-head > .ek-title { grid-column:1; grid-row:1; }
.wb-auto .ek-head > .ek-headr { grid-column:3; grid-row:1; }
.wb-auto .ek-board:not(.nd-board) > .ek-evid { grid-column:2; grid-row:1; min-width:0; }
.wb-auto .ek-pcard { display:grid; grid-template-columns:auto minmax(0,1fr); gap:var(--sim-space-1) var(--sim-space-2); align-items:center; padding:var(--sim-space-1) var(--sim-space-2) var(--sim-space-2); }
.wb-auto .ek-pcard > .ek-av { width:34px; height:34px; }
.wb-auto .ek-pcard > .ek-pname { justify-content:flex-start; min-height:0; }
.wb-auto .ek-facts { text-align:left; }
.wb-auto .ek-pcard > .ek-facts { grid-column:1 / -1; }
.wb-auto .ek-pcard:not(.ek-wide *) > .ek-facts { display:block; padding:var(--sim-space-1) var(--sim-space-2); border-radius:var(--sim-radius-sm); background:var(--sim-bg-cell); font-size:var(--sim-text-sm); line-height:1.35; }
.wb-auto .ek-pcard:not(.ek-wide *) > .ek-facts li { display:inline; min-height:0; padding:0; background:none; }
.wb-auto .ek-pcard:not(.ek-wide *) > .ek-facts li:not(:last-child)::after { content:', '; }
.wb-auto .ek-chips:not(.ek-g) { grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); }
.wb-auto .ek-card:has(> .ek-picker) { display:grid; grid-template-columns:max-content minmax(0,1fr); gap:var(--sim-space-1) var(--sim-space-3); align-items:center; }
.wb-auto .ek-picker { display:contents; }
.wb-auto .ek-picker > * { grid-column:1 / -1; }
.wb-auto .ek-picker > .ek-prompt { grid-column:2; grid-row:1; }
.wb-auto .ek-cards { grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); }
.wb-auto .sb-sect { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); }
.wb-auto .sb-sect-title { grid-column:1 / -1; }
.wb-auto .nd-board { min-height:0; gap:var(--sim-space-2); }
.wb-auto .nd-stage { flex-flow:row wrap; align-items:stretch; gap:var(--sim-space-2) var(--sim-space-3); }
.wb-auto .nd-stage > * { flex:0 0 100%; min-width:0; }
.wb-auto .nd-stage > .nd-pieces { flex:0 0 auto; flex-wrap:nowrap; }
.wb-auto .nd-stage > .nd-hintbtn { flex:0 0 auto; }
.wb-auto .nd-stage > .nd-name:has(+ .nd-opts) { flex:0 0 300px; box-sizing:border-box; }
.nd-name:not(:has(.nd-word)) { justify-content:center; }
.nd-name:not(:has(.nd-word)) .ek-av { width:84px; height:84px; }
.wb-auto .nd-stage > .nd-pieces + .nd-opts, .wb-auto .nd-stage > .nd-name + .nd-opts { flex:1 1 320px; }
.wb-auto .gm-board { min-height:0; }
.wb-auto .gm-board > .gm-grow, .wb-auto .gm-board > .ek-foot:empty { display:none; }
.wb-auto .gm-board > .ek-head + .gm-col { grid-column:2; grid-row:1; }
.wb-auto .mn-opts { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); }
/* Field station games: the play field keeps a real height when the frame follows its content. */
.wb-auto .sr-sky, .wb-auto .kd-track, .wb-auto .wm-field { min-height:300px; }
.wb-auto .cv-mode { min-height:0; }
.wb-auto .mu-detail { order:-1; min-height:0; }
.wb-auto .ek-scroll:has(.mu-sect) { display:flex; flex-wrap:wrap; gap:var(--sim-space-2) var(--sim-space-4, 20px); overflow:visible; padding:0; }
.wb-auto .mu-sect { flex:0 1 auto; margin:0; }
.wb-auto .mu-sect .gm-grid { display:flex; flex-wrap:wrap; }
.wb-auto .mu-sect .gm-tile { width:92px; }
.wb-auto .gm-board:has(.ex-card) { grid-template-columns:repeat(2,minmax(0,1fr)); }
.wb-auto .gm-board:has(.ex-card) .ek-headr { grid-column:2; justify-self:end; }
.wb-auto .gm-board:has(.ex-card) > .ex-card { grid-column:1; grid-row:span 2; align-self:stretch; }
.wb-auto .gm-board:has(.ex-card) > .ex-card ~ .gm-h2, .wb-auto .gm-board:has(.ex-card) > .ex-card ~ .ex-opts { grid-column:2; }
.wb-auto .wm-how { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--sim-space-3); width:100%; }
.wb-auto .wm-menu { overflow:visible; gap:var(--sim-space-2); padding:0 var(--sim-space-2); }
.wb-auto .wm-menu > .gm-msg { display:none; }
`;

export function wideBoard(scene) {
  if (!scene.root || scene.root.querySelector('style[data-wide-board]')) return;
  const s = (scene.root.ownerDocument ?? document).createElement('style');
  s.dataset.wideBoard = '1';
  s.textContent = WIDE_CSS;
  scene.root.appendChild(s);
  swapArt(scene.root);
  if (typeof MutationObserver === 'function') new MutationObserver(() => swapArt(scene.root)).observe(scene.root, { childList: true, subtree: true });
}

export function wideFit(scene) {
  if (!scene.root || !scene._scaleWrap) return;
  if (scene._isPortrait) { scene.root.classList.remove('wb-auto'); fitFrame(scene); return; }
  scene.root.classList.remove('ek-fixed');
  scene.root.classList.add('wb-auto');
  scene._scaleWrap.style.height = '';
  scene.root.style.height = 'auto';
  const height = Math.ceil(scene.root.offsetHeight);
  if (!height) return;
  scene._designH = height;
  scene._scaleWrap.style.aspectRatio = `${scene._designW} / ${height}`;
}
