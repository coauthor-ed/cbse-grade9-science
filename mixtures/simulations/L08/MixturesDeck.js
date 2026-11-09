// MixturesDeck - the chapter's arcade deck file, one file per chapter.
//
// MIXTURE_SORT is the FIRST export in this file. A later lesson's game (L09's
// LeverMatchScene) adds a NEW export beside it and never edits or reorders an
// existing item or export.
//
// Every item's `why` is the evidence line the why card shows, never a restated
// answer. `myth: true` marks what learners commonly get wrong.
//
// Contract for callers: each export is a plain data object matching one
// archetype's deck shape (see docs/arcade-games.md) - `groups` + `items` for
// ArcadeSortScene, `pairs` for ArcadeMatchScene. A game file spreads its own
// export into CONFIG and adds only `title`, `skin` and `rounds`. Nothing in
// this file is lesson-specific state: no scene object, no mutable per-run
// field, nothing an archetype mutates. Items and groups are frozen data that
// the engine may sort, balance and requeue freely.

/**
 * Filing everyday samples and property words into Solution / Suspension /
 * Colloid - the book's Table 5.2 exercise as a timed sort.
 *
 * The deck's character is the five two-bin property words. Every learner
 * arrives believing these are three kinds of cloudiness, and each of
 * those words looks like it belongs to a single bin. Their why cards say what
 * makes the word fit both bins, never which bin was expected.
 *
 * Taught by L01 s03, L06 s03, L06 s06, L07 s05, L08 s02 and L08 s05.
 */
export const MIXTURE_SORT = {
  groups: [
    {
      id: 'solution',
      label: 'Solution',
      tone: 1,
      why: 'the particles have dissolved, so nothing floats in it to scatter light',
    },
    {
      id: 'suspension',
      label: 'Suspension',
      tone: 6,
      why: 'the particles are large enough to see, and they settle',
    },
    {
      id: 'colloid',
      label: 'Colloid',
      tone: 3,
      why: 'separate particles, too small to see and too small to settle',
    },
  ],
  items: [
    // -- the seven everyday samples ------------------------------------------------------
    {
      name: 'Salt solution',
      is: 'solution',
      why: 'the salt has dissolved, so it is uniform throughout and shows no beam path',
    },
    {
      name: 'Brass',
      is: 'solution',
      myth: true,
      why: 'copper and zinc are mixed evenly all through, so brass is a solid solution',
    },
    {
      name: 'Sand in water',
      is: 'suspension',
      why: 'the grains can be seen, and they sink when you stop stirring',
    },
    {
      name: 'Mud',
      is: 'suspension',
      why: 'heavier mud settles on standing, and filter paper stops the larger grains',
    },
    {
      name: 'Milk',
      is: 'colloid',
      why: 'it looks uniform, but a beam shows its path and it does not settle',
    },
    {
      name: 'Smoke',
      is: 'colloid',
      why: 'fine particles spread through air, and they scatter light',
    },
    {
      name: 'Butter',
      is: 'colloid',
      why: 'drops of water stay spread through the fat, and proteins keep them apart',
    },

    // -- the property words: five of them are right in two bins --------------------------
    {
      name: 'Particle size less than 1 nm',
      is: 'solution',
      why: 'this size means the solute has dissolved',
    },
    {
      name: 'Particle size 1 to 1000 nm',
      is: 'colloid',
      why: 'the middle size: too small to see and too small to settle',
    },
    {
      name: 'Particle size over 1000 nm',
      is: 'suspension',
      why: 'this size can be seen with your eyes, and it settles',
    },
    {
      name: 'Settles down when left undisturbed',
      is: 'suspension',
      why: 'the particles are heavy enough to sink by themselves',
    },
    {
      name: 'Does not settle down',
      is: ['solution', 'colloid'],
      why: 'colloid particles are too small to sink, and a solution has no separate particles',
    },
    {
      name: 'Separates by filtration',
      is: 'suspension',
      why: 'the particles are larger than the gaps in the paper, so they stay on it',
    },
    {
      name: 'Cannot be separated by filtration',
      is: ['solution', 'colloid'],
      why: 'the particles are smaller than the gaps in the paper',
    },
    {
      name: 'Scatters light',
      is: ['suspension', 'colloid'],
      why: 'particles spread the light; a transparent solution does not',
    },
    {
      name: 'Transparent',
      is: 'solution',
      why: 'you can see straight through it, and its path of light stays hidden',
    },
    {
      name: 'Heterogeneous mixture',
      is: ['suspension', 'colloid'],
      why: 'separate particles are there, even when it looks uniform',
    },
    {
      name: 'Stays evenly distributed',
      is: ['solution', 'colloid'],
      why: 'both stay evenly spread; a beam tells them apart',
    },
  ],
};

/**
 * Every separation method in the chapter matched to the one property that
 * method spends - plus the three mixtures no lever here touches.
 *
 * This deck exists to find out which objects a learner has not understood,
 * because for most of the chapter "which method" always had an answer. Its
 * spine is the `none` group: brass, a solution and a lemonade, all three
 * answered the same way, because a learner who assumes every mixture comes
 * apart files every one of them under a method.
 *
 * The `size` group holds three pairs and the `gravity` group two, and that is
 * the trap rather than an accident: settling, filtration and the Tyndall
 * effect are three observations of one number, so a density answer offered
 * against a size prompt is a real mistake worth a why card.
 *
 * `myth: true` sits on the brass pair alone - it reads as a suspension (solid
 * bits in a solid) and is the boss-round item.
 *
 * Taught by L02 s03, L03 s03, L04 s02, L04 s04, L05 s04, L06 s03, L06 s06,
 * L07 s02 and L08 s02.
 */
export const LEVER_PAIRS = {
  pairs: [
    // -- the cooling lever ----------------------------------------------------------------
    {
      prompt: 'Crystallisation',
      answer: 'Solubility falling as the liquid cools',
      group: 'cooling',
      why: 'the salt is driven out by temperature alone - only a substance whose solubility drops',
    },

    // -- the heat lever: two methods, two different properties ---------------------------
    {
      prompt: 'Distillation',
      answer: 'Boiling point',
      group: 'heat',
      why: 'one liquid must come over the condenser before the other; the gap is the whole method',
    },
    {
      prompt: 'Sublimation',
      answer: 'Turning to vapour without melting',
      group: 'state',
      why: 'naphthalene and camphor leave as vapour and return as crystals; sand cannot',
    },

    // -- the gravity lever: two pairs, one property ----------------------------------------
    {
      prompt: 'A separating funnel',
      answer: 'Density',
      group: 'gravity',
      why: 'the two liquids will not mix, so the denser one settles at the bottom and drains off first',
    },
    {
      prompt: 'Centrifugation',
      answer: 'Density',
      group: 'gravity',
      why: 'spinning drives the denser material outward - it is only making gravity finish faster',
    },

    // -- the size lever: three pairs, one property -----------------------------------------
    {
      prompt: 'Filtration',
      answer: 'Particle size',
      group: 'size',
      why: "the paper's gaps catch what is bigger and pass what is smaller - size and nothing else",
    },
    {
      prompt: 'Settling',
      answer: 'Particle size',
      group: 'size',
      why: 'only particles heavy enough to fall under their own weight drop out; finer ones stay up',
    },
    {
      prompt: 'The Tyndall effect',
      answer: 'Particle size',
      group: 'size',
      why: 'light reaches your eye sideways only from something still floating - a statement about size',
    },

    // -- the paper lever ------------------------------------------------------------------
    {
      prompt: 'Paper chromatography',
      answer: 'Rate of travel on paper',
      group: 'paper',
      why: 'each pigment is carried up the strip at its own rate; distance tells them apart',
    },

    // -- the magnetism lever --------------------------------------------------------------
    {
      prompt: 'A magnet',
      answer: 'Magnetic property',
      group: 'magnetism',
      why: 'it lifts what it holds and leaves what it does not - the difference between them is magnetic',
    },

    // -- the spine: mixtures no lever in this chapter touches ------------------------------
    {
      prompt: 'An alloy such as brass',
      answer: 'No lever in this chapter touches it',
      group: 'none',
      myth: true,
      why: 'copper and zinc are spread evenly, with no grains and no boundary to catch at all',
    },
    {
      prompt: 'A solution such as salt in water',
      answer: 'No lever in this chapter touches it',
      group: 'none',
      why: 'the salt genuinely dissolved, so no particle is left floating for a lever to act on',
    },
    {
      prompt: 'A glass of lemonade',
      answer: 'No lever in this chapter touches it',
      group: 'none',
      why: 'five components together - every method spends one of the five to get another',
    },
  ],
};