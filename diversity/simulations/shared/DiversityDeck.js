// DiversityDeck.js - the course's arcade decks, for the kit's Arcade* archetypes (docs/arcade-games.md).
// One file for the chapter: each game is a thin scene beside its slide. Organisms are drawn with the
// course's own art (BoardArt.bioAv) as { svg }, so no microbe, plant or animal gets a kit face.
// Facts follow field-guide.json; a why is evidence, never the answer restated.
import { bioAv } from './BoardArt.js';

const art = (id) => { const svg = bioAv({ id }, 64); return svg ? { svg } : false; };

const ANIMAL = 'many cells, no cell wall, and it takes food into its body';
const PLANT = 'cellulose walls, and it makes its own food with light';

const KINGDOM_GROUPS = [
  { id: 'monera', label: 'Monera', tone: 1, why: 'one cell with no nucleus' },
  { id: 'protista', label: 'Protista', tone: 2, why: 'one cell with a nucleus' },
  { id: 'fungi', label: 'Fungi', tone: 3, why: 'chitin walls; absorbs its food' },
  { id: 'plants', label: 'Plantae', tone: 4, why: PLANT },
  { id: 'animals', label: 'Animalia', tone: 5, why: ANIMAL },
];

// [id, name (14 chars at most), kingdom, why, myth?]
const KINGDOM_ROWS = [
  ['bacterium', 'Bacterium', 'monera', 'no nucleus: its DNA lies loose in the cell'],
  ['cyano', 'Cyanobacterium', 'monera', 'it makes food with light, but it has no nucleus', true],
  ['yeast', 'Yeast', 'fungi', 'only one cell, but a chitin wall, and it absorbs its food', true],
  ['mould', 'Bread mould', 'fungi', 'threads with chitin walls that absorb food from the bread'],
  ['mushroom', 'Mushroom', 'fungi', 'it does not make food with light: chitin walls absorb it', true],
  ['euglena', 'Euglena', 'protista', 'one cell with a nucleus and no cell wall, though it makes food with light', true],
  ['amoeba', 'Amoeba', 'protista', 'one cell with a nucleus and no cell wall'],
  ['spirogyra', 'Spirogyra', 'plants', 'many cells with cellulose walls, making food with light', true],
  ['moss', 'Moss', 'plants', PLANT],
  ['fern', 'Fern', 'plants', PLANT],
  ['pine', 'Pine', 'plants', PLANT],
  ['tulsi', 'Tulsi', 'plants', PLANT],
  ['mango', 'Mango tree', 'plants', PLANT],
  ['sponge', 'Sponge', 'animals', 'it does not move, but it has many cells, no wall, and takes food in', true],
  ['hydra', 'Hydra', 'animals', ANIMAL],
  ['flatworm', 'Flatworm', 'animals', ANIMAL],
  ['roundworm', 'Roundworm', 'animals', ANIMAL],
  ['earthworm', 'Earthworm', 'animals', ANIMAL],
  ['beetle', 'Beetle', 'animals', ANIMAL],
  ['snail', 'Snail', 'animals', ANIMAL],
  ['octopus', 'Octopus', 'animals', ANIMAL],
  ['starfish', 'Starfish', 'animals', ANIMAL],
  ['amphioxus', 'Amphioxus', 'animals', ANIMAL],
  ['carp', 'Carp', 'animals', ANIMAL],
  ['frog', 'Frog', 'animals', ANIMAL],
  ['lizard', 'Lizard', 'animals', ANIMAL],
  ['sparrow', 'Sparrow', 'animals', ANIMAL],
  ['ostrich', 'Ostrich', 'animals', ANIMAL],
  ['hornbill', 'Hornbill', 'animals', ANIMAL],
  ['tiger', 'Tiger', 'animals', ANIMAL],
  ['lion', 'Lion', 'animals', ANIMAL],
  ['dolphin', 'Dolphin', 'animals', ANIMAL],
  ['deer', 'Sangai deer', 'animals', ANIMAL],
];

const kingdomItems = () => KINGDOM_ROWS.map(([id, name, is, why, myth]) => ({ name, is, why, art: art(id), ...(myth ? { myth: true } : {}) }));

/** Sort (sky or belt): the five kingdoms. */
export const KINGDOMS = { groups: KINGDOM_GROUPS, items: kingdomItems() };

/** Route: the same organisms down the five-kingdom key of Fig 12.5's tests. */
export const KINGDOM_KEY = {
  groups: KINGDOM_GROUPS,
  items: kingdomItems(),
  key: {
    ask: 'Has a nucleus?',
    no: 'monera',
    yes: {
      ask: 'Wall made of chitin?',
      yes: 'fungi',
      no: { ask: 'Wall made of cellulose?', yes: 'plants', no: { ask: 'Many cells?', no: 'protista', yes: 'animals' } },
    },
  },
};

// [id, name, phylum, why, myth?]. Chordates kept to a few so Chordata is not the answer every time.
const PHYLUM_ROWS = [
  ['sponge', 'Sponge', 'Porifera', 'pores all over the body and no true tissues'],
  ['hydra', 'Hydra', 'Cnidaria', 'true tissues, one opening ringed by tentacles'],
  ['flatworm', 'Flatworm', 'Platyhelminthes', 'a flat body, organs, but one opening for food in and out'],
  ['roundworm', 'Roundworm', 'Nematoda', 'a round, smooth body with a separate mouth and anus, no segments', true],
  ['earthworm', 'Earthworm', 'Annelida', 'a body of repeated segments, with no jointed legs'],
  ['beetle', 'Beetle', 'Arthropoda', 'jointed legs and a hard outer skeleton'],
  ['snail', 'Snail', 'Mollusca', 'a soft body on a muscular foot'],
  ['octopus', 'Octopus', 'Mollusca', 'no shell, but a soft body and a muscular foot (its arms)', true],
  ['starfish', 'Starfish', 'Echinodermata', 'calcium carbonate plates under the skin, a spiny skin'],
  ['amphioxus', 'Amphioxus', 'Chordata', 'a notochord, though no backbone', true],
  ['carp', 'Carp', 'Chordata', 'a notochord, which becomes a backbone'],
  ['frog', 'Frog', 'Chordata', 'a notochord, which becomes a backbone'],
  ['sparrow', 'Sparrow', 'Chordata', 'a notochord, which becomes a backbone'],
  ['dolphin', 'Dolphin', 'Chordata', 'a notochord, which becomes a backbone'],
];

/** Match (range or bubbles): an animal and its phylum. */
export const PHYLA = {
  ask: 'Tap its phylum',
  pairs: PHYLUM_ROWS.map(([id, prompt, answer, why, myth]) => ({
    prompt, answer, why, art: art(id), group: answer === 'Chordata' ? 'chordate' : 'invertebrate', ...(myth ? { myth: true } : {}),
  })),
};

/** Judge (doors or cards): does this fact decide a group? Lures are true facts that decide nothing. */
export const DECIDES = {
  statements: [
    { text: 'Feathers mean it is a bird.', truth: true, why: 'every bird has feathers, and nothing else does' },
    { text: 'Milk for young means a mammal.', truth: true, why: 'only mammals feed their young milk' },
    { text: 'No nucleus means Monera.', truth: true, why: 'Monera are the only cells with no nucleus' },
    { text: 'A chitin wall means Fungi.', truth: true, why: 'yeast, mould and mushroom all have chitin walls' },
    { text: 'Jointed legs: an arthropod.', truth: true, why: 'jointed legs and a hard outer skeleton decide Arthropoda' },
    { text: 'A notochord means a chordate.', truth: true, why: 'the notochord is what Chordata share' },
    { text: 'Dry scales mean a reptile.', truth: true, why: 'dry, scaly skin decides Reptilia' },
    { text: 'Seeds in a fruit: angiosperm.', truth: true, why: 'angiosperm seeds grow inside a fruit' },
    { text: 'A muscular foot: a mollusc.', truth: true, why: 'the snail creeps on it; the octopus arms are its foot' },
    { text: 'Can fly, so it is a bird.', truth: false, myth: true, why: 'a beetle flies too; feathers decide Aves' },
    { text: 'Lives in water, so a fish.', truth: false, myth: true, why: 'a dolphin and a frog live in water; gills and a backbone decide Pisces' },
    { text: 'Fins mean it is a fish.', truth: false, myth: true, why: 'a dolphin has flippers but feeds its young milk: a mammal' },
    { text: 'Four legs mean a mammal.', truth: false, myth: true, why: 'a lizard walks on four legs and is a reptile' },
    { text: 'Too small to see: a bacterium.', truth: false, why: 'yeast and Euglena are tiny too; a missing nucleus decides Monera' },
    { text: 'A shell means a mollusc.', truth: false, why: 'the octopus has no shell; the muscular foot decides Mollusca' },
    { text: 'Worm-shaped means Annelida.', truth: false, myth: true, why: 'flatworms and roundworms are long too; repeated segments decide Annelida' },
    { text: 'Makes food with light: a plant.', truth: false, myth: true, why: 'Euglena and blue-green bacteria do too; many cells with cellulose walls decide Plantae' },
    { text: 'One cell means Protista.', truth: false, why: 'bacteria and yeast are one cell too; a nucleus and no wall decide Protista' },
  ],
};
