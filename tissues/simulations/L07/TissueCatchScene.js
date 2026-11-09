import { ArcadeCatchScene } from 'simulations/base/kit/ArcadeCatchScene.js';

/**
 * TissueCatchScene - optional arcade practice at the end of les-07.
 * The sign switches between the four animal tissues; Quill catches the body
 * parts made mainly of that tissue and lets the others fall. Only parts the
 * lesson has met. Data only: the engine is the kit's. art: false on every item
 * so no token ever draws a face.
 */
export class TissueCatchScene extends ArcadeCatchScene {
  static ARIA_LABEL = "Quill's Catch: mangoes with body parts fall from a tree. Move Quill under each one made mainly of the tissue on the sign, Epithelial, Connective, Muscular or Nervous, and let the others fall.";
  static CONFIG = {
    title: "Quill's Catch",
    skin: 'orchard',
    how: 'Move Quill under each mango made mainly of the tissue on the sign. Let the others fall.',
    perTarget: 4,
    rounds: 16,
    lives: 3,
    relaxed: true,
    groups: [
      { id: 'epithelial', label: 'Epithelial', tone: 1, why: 'it covers or lines a part of the body' },
      { id: 'connective', label: 'Connective', tone: 2, why: 'it joins, supports or carries' },
      { id: 'muscular', label: 'Muscular', tone: 3, why: 'it contracts to make movement' },
      { id: 'nervous', label: 'Nervous', tone: 4, why: 'it receives and passes on messages' },
    ],
    items: [
      { name: "Skin's outer layer", is: 'epithelial', art: false, why: 'many layers of flat, packed cells protect the body' },
      { name: 'Small intestine lining', is: 'epithelial', art: false, why: 'one layer of tall cells takes in digested food' },
      { name: 'Lung air sac lining', is: 'epithelial', art: false, why: 'one layer of thin, flat cells lets gases pass' },
      { name: 'Cheek lining', is: 'epithelial', art: false, why: 'layers of flat cells protect the inside of the mouth' },
      { name: 'Salivary gland cells', is: 'epithelial', art: false, why: 'these lining cells make and release saliva' },
      { name: 'Blood', is: 'connective', art: false, myth: true, why: 'it is liquid, but still a tissue: cells in plasma' },
      { name: 'Bone', is: 'connective', art: false, why: 'its hard matrix gives strength, support and protection' },
      { name: 'Ear cartilage', is: 'connective', art: false, why: 'its soft, bendy matrix gets its shape back' },
      { name: 'Tendon', is: 'connective', art: false, myth: true, why: 'it joins muscle to bone, but is not muscle itself' },
      { name: 'Ligament', is: 'connective', art: false, why: 'it joins bone to bone and keeps a joint stable' },
      { name: 'Arm muscle', is: 'muscular', art: false, why: 'skeletal muscle moves the arm when you choose' },
      { name: 'Stomach wall muscle', is: 'muscular', art: false, why: 'smooth muscle makes the slow movements of digestion' },
      { name: 'Heart wall', is: 'muscular', art: false, why: 'cardiac muscle beats all life without tiring' },
      { name: 'Intestine muscle', is: 'muscular', art: false, why: 'smooth muscle moves food along on its own' },
      { name: 'Neuron', is: 'nervous', art: false, why: 'a nerve cell receives and passes on messages' },
      { name: 'Brain', is: 'nervous', art: false, why: 'the control centre, made of nervous tissue' },
      { name: 'Nerve in the hand', is: 'nervous', art: false, why: 'it carries messages between the hand and the brain' },
      { name: 'Dendrites and axon', is: 'nervous', art: false, why: 'parts of a neuron that take in and pass on messages' },
    ],
  };

  /** Three mixed mangoes on the menu, not in deck order, so the menu leaks no answers. */
  menuSample() { return [{ name: 'Tendon', art: false }, { name: 'Neuron', art: false }, { name: 'Cheek lining', art: false }]; }
}
