// NoFaces.js - switches off the drawn eyes, smiles and cheeks on kit characters (KeyCharacters, shown as .ek-av).
// Microbes, plants, fungi, sponges and viruses have no face, and a learner should not meet one on evidence.
// Monsters and Quill keep theirs: neither is drawn as .ek-av art.
//
//   import { NO_FACES_CSS, noFaces } from '../shared/NoFaces.js';
//   css() { return super.css() + NO_FACES_CSS; }   in a scene with a css() method
//   noFaces(this.root);                             or from setup(), for a scene without one. Safe to call twice.
//
// Eyes on vertebrate art go too: the kit character sheet does not say which is which, so the rule is one rule.
export const NO_FACES_CSS = `
.ek-av .eye, .ek-av .spark, .ek-av .blush, .ek-av .mouth { display: none; }
`;

export function noFaces(root) {
  if (!root || root.querySelector?.('style[data-no-faces]')) return;
  const s = (root.ownerDocument ?? document).createElement('style');
  s.dataset.noFaces = '1';
  s.textContent = NO_FACES_CSS;
  root.appendChild(s);
}
