// BioBits.js - small pieces shared by this module's SVG scenes. Not a scene.
//   BIO_BTN_CSS   .bb-row (a centred wrapping row) and .bb-btn: a flat button with a lip, at least 46 px tall, aria-pressed lit.
//   btnRow(root, cls)  a .bb-row div mounted in the scene root, under the stage. The row stays through repaints.
//   PLATE(x, y, w, h, o)  a rounded rimmed panel as SVG: o.fill, o.rim, o.r
import { mountEl, fill } from 'simulations/base/kit/SimSvg.js';

export const BIO_BTN_CSS = `
.bb-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; padding-top: 10px; }
.bb-row[hidden] { display: none; }
.bb-btn { appearance: none; min-height: 46px; padding: 6px 14px; cursor: pointer; touch-action: manipulation; font: 800 15px/1.1 var(--sim-font); color: var(--sim-label);
  background: var(--sim-bg-surface); border: calc(2px * var(--look-rim)) solid var(--sim-stroke); border-radius: var(--look-pill);
  box-shadow: 0 calc(3px * var(--look-lip)) 0 color-mix(in oklab, var(--sim-stroke) 62%, var(--sim-bg-deep)); }
.bb-btn:active { transform: translateY(calc(2px * var(--look-lip))); box-shadow: 0 calc(1px * var(--look-lip)) 0 var(--sim-stroke); }
.bb-btn[aria-pressed="true"] { background: var(--primary-color, var(--sim-accent)); color: var(--sim-bg-deep); border-color: var(--primary-color, var(--sim-accent)); }
.bb-btn:disabled { opacity: 0.55; cursor: default; }
.bb-btn:focus-visible { outline: 3px solid var(--sim-accent); outline-offset: 2px; }
`;
export const btnRow = (root, cls = '') => { const r = mountEl(root, `bb-row ${cls}`); return r; };
export const PLATE = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y + 3}" width="${w}" height="${h}" rx="${o.r ?? 16}" ${fill(o.rim ?? 'var(--sim-stroke)')}/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 16}" style="fill:${o.fill ?? 'var(--sim-bg-surface)'};stroke:${o.rim ?? 'var(--sim-stroke)'};stroke-width:2"/>`;
