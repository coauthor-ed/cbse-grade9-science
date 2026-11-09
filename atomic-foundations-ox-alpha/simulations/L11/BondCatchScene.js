import { ArcadeCatchScene } from 'simulations/base/kit/ArcadeCatchScene.js';

/**
 * BondCatchScene - optional arcade practice for les-11, after BondClassifierGame.
 * The sign switches between Ionic and Covalent; Quill catches the formulae that
 * match. Only compounds the module has met. Data only: the engine is the kit's.
 */
export class BondCatchScene extends ArcadeCatchScene {
  static ARIA_LABEL = "Quill's Catch: mangoes with formulae fall from a tree. Move Quill under each one that matches the sign, Ionic or Covalent, and let the others fall.";
  static CONFIG = {
    title: "Quill's Catch",
    skin: 'orchard',
    groups: [
      { id: 'ionic', label: 'Ionic', tone: 1, why: 'a metal and a non-metal' },
      { id: 'covalent', label: 'Covalent', tone: 2, why: 'only non-metals' },
    ],
    items: [
      { name: 'NaCl', is: 'ionic', why: 'sodium is a metal and chlorine is a non-metal' },
      { name: 'MgO', is: 'ionic', why: 'magnesium is a metal and oxygen is a non-metal' },
      { name: 'MgCl\u2082', is: 'ionic', why: 'magnesium is a metal and chlorine is a non-metal' },
      { name: 'Na\u2082S', is: 'ionic', why: 'sodium is a metal and sulfur is a non-metal' },
      { name: 'CaO', is: 'ionic', why: 'calcium is a metal and oxygen is a non-metal' },
      { name: 'KBr', is: 'ionic', why: 'potassium is a metal and bromine is a non-metal' },
      { name: 'Al\u2082O\u2083', is: 'ionic', why: 'aluminium is a metal and oxygen is a non-metal' },
      { name: 'H\u2082O', is: 'covalent', why: 'hydrogen and oxygen are both non-metals' },
      { name: 'CO\u2082', is: 'covalent', why: 'carbon and oxygen are both non-metals' },
      { name: 'NH\u2083', is: 'covalent', why: 'nitrogen and hydrogen are both non-metals' },
      { name: 'HCl', is: 'covalent', myth: true, why: 'hydrogen is a non-metal, so there is no metal here' },
      { name: 'CH\u2084', is: 'covalent', why: 'carbon and hydrogen are both non-metals' },
      { name: 'CCl\u2084', is: 'covalent', why: 'carbon and chlorine are both non-metals' },
      { name: 'H\u2082S', is: 'covalent', myth: true, why: 'hydrogen and sulfur are both non-metals' },
    ],
  };
}
