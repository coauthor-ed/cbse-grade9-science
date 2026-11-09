// ReproductionDeck - the chapter's arcade deck file, one file per chapter.
//
// This is the FIRST export in the file. A later lesson's game adds a NEW export
// beside it and never edits or reorders an existing item or export.
//
// Every item's `why` is the evidence line the why card shows, never a restated
// answer. `myth: true` marks what learners commonly get wrong.

/**
 * Where does each new plant come from? Taught by L01. Four crates: an
 * underground stem, a stem above ground, a leaf, and a seed, the one that is
 * not vegetative propagation. No art key on items: a plant part carries no face.
 */
export const PROPAGATION_ROUTES = {
  groups: [
    { id: 'underground-stem', label: 'an underground stem', tone: 1, why: 'a fleshy stem under the ground sprouts a new plant' },
    { id: 'stem-piece', label: 'a stem above ground', tone: 3, why: 'a piece of stem grows roots and leaves of its own' },
    { id: 'leaf', label: 'a leaf', tone: 4, why: 'tiny plantlets sprout along the leaf' },
    { id: 'seed', label: 'a seed', tone: 6, why: 'a seed comes from sexual reproduction, so this is not vegetative propagation' },
  ],
  items: [
    { art: false, name: 'A sprouting potato', is: 'underground-stem', why: 'a potato is a fleshy underground stem' },
    { art: false, name: 'Ginger', is: 'underground-stem', why: 'ginger is a fleshy underground stem' },
    { art: false, name: 'A sugarcane piece', is: 'stem-piece', why: 'a stem cutting of sugarcane grows into a new plant' },
    { art: false, name: 'A money plant piece', is: 'stem-piece', why: 'a stem cutting of money plant grows into a new plant' },
    { art: false, name: 'Bryophyllum plantlets', is: 'leaf', myth: true, why: 'they sprout along the leaf, with no seed' },
    { art: false, name: 'A rose cutting', is: 'stem-piece', myth: true, why: 'a piece of stem, rooted from its own buried end' },
    { art: false, name: 'A mango seedling', is: 'seed', why: 'it grew from a seed, which carries a mix from two parents' },
    { art: false, name: 'A neem seedling', is: 'seed', why: 'it grew from a seed, so it is not a copy of one parent' },
  ],
};

/**
 * Which asexual term is which? Taught by L01 and L02. Eight pairs. No art key
 * on pairs: the kit's prompt card draws a face for any pair that has one. The
 * engine draws distractors from the other pairs, same group first.
 */
export const ASEXUAL_TERMS = {
  pairs: [
    { prompt: 'hyphae', group: 'structure', answer: 'the threads of a mould', why: 'the long threads of the mould body' },
    { prompt: 'sporangium', group: 'structure', answer: 'the sac on a mould thread', why: 'a round sac that holds the spores' },
    { prompt: 'bud', group: 'structure', answer: 'an outgrowth on a parent', why: 'it grows from the parent, enlarges and then separates' },
    { prompt: 'spore', group: 'structure', answer: 'a light body that floats in air', why: 'it floats on air currents until it finds moisture and nutrients' },
    { prompt: 'mitosis', group: 'division', answer: 'a division giving two like cells', why: 'each daughter cell has the same number of chromosomes as the parent cell' },
    { prompt: 'clone', group: 'result', answer: 'an identical offspring', why: 'mitosis keeps the chromosomes the same, so the offspring is genetically identical' },
    { prompt: 'germ theory', group: 'belief', answer: 'microbes cause disease', why: 'Pasteur gave this theory of disease; it is not about where mould comes from', myth: true },
    { prompt: 'Pasteur showed', group: 'belief', answer: 'new life comes from life', why: 'his experiments showed that life does not arise from non-living matter' },
  ],
};

/**
 * Which pollination vector is each plant built for? Taught by L05 s03 and
 * s02 (blk-l05-a02's three flowers). Four vectors - wind, water, insects,
 * birds - and eight plants, two to each vector, so no vector is a singleton
 * and the distractor set the engine builds from other pairs is even.
 *
 * The prompt is the plant and ONE line of the structure that forces the
 * vector; it never names the vector. The `why` is the evidence the why card
 * shows after a mix-up: always the structure, never the answer restated,
 * never an appeal to size, colour or beauty.
 *
 * This is the THIRD export in the file. It never edits or reorders
 * `PROPAGATION_ROUTES` or `ASEXUAL_TERMS`. Nothing here may name a pollen
 * tube, anther, ovule, ovary, zygote, embryo, seed, fruit, dispersal,
 * germination, self- or cross-pollination, a gamete, a larva, or any
 * plant-breeding method: those are L05 s07 and L06 onwards. It is eight
 * plants and four vectors, nothing else.
 *
 * No item is marked `myth: true`. The stub's sharpest errors are the
 * showy-petals one (coral tree is a bird flower) and the two aquatic ones,
 * and a learner who answered correctly should not then be asked to gamble
 * on a `why` line. The boss round draws from the learner's own missed
 * items, so all eight plants - both `water` plants and `coral tree`
 * included - are reachable there.
 */
export const POLLINATION_VECTORS = {
  pairs: [
    { prompt: 'Maize: light pollen in large numbers', group: 'wind', answer: 'Wind', why: 'light, small grains and a long feathery stigma suit wind' },
    { prompt: 'Wheat: light pollen, long feathery stigma', group: 'wind', answer: 'Wind', why: 'wind carries wheat pollen, as it does for maize and rice' },
    { prompt: 'Rice: light pollen, long feathery stigma', group: 'wind', answer: 'Wind', why: 'wind carries rice pollen, as it does for maize and wheat' },
    { prompt: 'Vallisneria: a plant that lives in water', group: 'water', answer: 'Water', why: 'currents carry the pollen from one flower to another' },
    { prompt: 'Hydrilla: a plant that lives in water', group: 'water', answer: 'Water', why: 'like Vallisneria, it is pollinated by water currents' },
    { prompt: 'Sunflower: bright, with nectar and spiny pollen', group: 'insects', answer: 'Insects', why: 'bees visit it, and spiny pollen attaches to their bodies' },
    { prompt: 'Marigold: bright, with fragrance and sticky pollen', group: 'insects', answer: 'Insects', why: 'colour and fragrance attract insects, and the pollen holds on' },
    { prompt: 'Coral tree: visited by sunbirds', group: 'birds', answer: 'Birds', why: 'the coral tree is pollinated by birds such as sunbirds and the Indian white-eye' },
  ],
};
/**
 * Where does the young one start, and what hatches out of the egg? Taught by
 * L06 s03 and s04. A two-question key, asked in order: where the gametes meet
 * (inside the mother's body or outside it), then what hatches (a feeding larva
 * or a fully formed young one). That order is the skill - a sort could not
 * teach it, so this is a ROUTE and not a sort.
 *
 * The fourth leaf (outside, then formed) is deliberately unstocked. None of the
 * chapter's animals lands there: an egg left in open water cannot be stocked
 * richly enough to hatch a formed young one, and the empty road says so without
 * a word.
 *
 * This is the THIRD export in the file. It never edits or reorders
 * `PROPAGATION_ROUTES` or `ASEXUAL_TERMS`. Nothing here may name a flower part,
 * pollen, ovule, seed, fruit, a chromosome, meiosis or variation (L03, L04,
 * L05), and no item may ask which animal lays the most eggs - egg count is the
 * wrong idea this lesson meets. No item is a plant.
 */
export const ANIMAL_STRATEGY_ROUTES = {
  groups: [
    { id: 'inside-larvae', label: 'Inside, then larva', tone: 1, why: 'the gametes meet inside the body, and a feeding larva hatches' },
    { id: 'inside-formed', label: 'Inside, no larva', tone: 3, why: 'the gametes meet inside the body, and no feeding larva stage follows' },
    { id: 'outside-larvae', label: 'Outside, then larva', tone: 4, why: 'the gametes meet in the water, and a feeding larva hatches' },
    { id: 'outside-formed', label: 'Outside, no larva', tone: 6, why: 'none of these animals goes this way' },
  ],
  items: [
    { name: 'Frog', art: false, is: 'outside-larvae', why: 'frog gametes meet in the water, and a tadpole hatches' },
    { name: 'Most fish', art: false, is: 'outside-larvae', why: 'the female releases eggs in the water and the male releases sperm over them, and a small larva hatches' },
    { name: 'Butterfly', art: false, is: 'inside-larvae', why: 'butterflies mate, so the gametes meet inside the female, and a caterpillar hatches' },
    { name: 'Lizard', art: false, is: 'inside-formed', why: 'fertilisation is internal, and each egg has enough yolk to hatch a young one' },
    { name: 'Bird', art: false, is: 'inside-formed', why: 'fertilisation is internal, and each egg has enough yolk to hatch a chick' },
    { name: 'Cow', art: false, is: 'inside-formed', why: 'the zygote grows and develops inside the female body' },
    { name: 'Snake', art: false, is: 'inside-formed', why: 'reptiles have internal fertilisation, and enough yolk to hatch a young one' },
    { name: 'Goat', art: false, is: 'inside-formed', why: 'mammals have internal fertilisation, and no larva stage' },
  ],
  key: {
    ask: 'Do the gametes meet inside the body?',
    no: {
      ask: 'Does a feeding larva hatch out?',
      no: 'outside-formed',
      yes: 'outside-larvae',
    },
    yes: {
      ask: 'Does a feeding larva hatch out?',
      no: 'inside-formed',
      yes: 'inside-larvae',
    },
  },
};

/**
 * Which is it: a gamete, a body cell, mitosis or meiosis? Taught by L02 and L03.
 * Export name kept. No art key on items: a cell carries no face.
 */
export const GAMETE_DEAL = {
  groups: [
    { id: 'one-from-each-pair', label: 'a gamete', tone: 1, why: 'a gamete has one chromosome from each pair' },
    { id: 'full-set', label: 'a body cell', tone: 3, why: 'a body cell has both chromosomes of every pair' },
    { id: 'keeps-number', label: 'mitosis', tone: 5, why: 'mitosis keeps the chromosome number the same' },
    { id: 'halves-number', label: 'meiosis', tone: 6, why: 'meiosis halves the chromosome number' },
  ],
  items: [
    { art: false, name: 'Has 23 chromosomes', is: 'one-from-each-pair', why: 'one chromosome from each of the 23 pairs' },
    { art: false, name: 'Haploid, used only for reproduction', is: 'one-from-each-pair', why: 'gametes are the haploid cells used for reproduction' },
    { art: false, name: 'Has 46 chromosomes', is: 'full-set', myth: true, why: 'both chromosomes of each of the 23 pairs' },
    { art: false, name: 'Diploid', is: 'full-set', why: 'a diploid cell has the full set' },
    { art: false, name: 'Heals a cut in the skin', is: 'keeps-number', myth: true, why: 'new skin cells have the same number as the old ones' },
    { art: false, name: 'Gives two identical cells', is: 'keeps-number', why: 'each daughter cell has the same number as the parent' },
    { art: false, name: 'Pairs line up and separate', is: 'halves-number', why: 'each new cell gets one chromosome from each pair' },
    { art: false, name: 'Makes sperm and eggs', is: 'halves-number', why: 'gametes are made by meiosis' },
  ],
};

/**
 * True or false about the menstrual cycle and about gametes. Taught by L08
 * s01-s03 and s05 and L07 s05 - ten claims a learner could honestly hold, five
 * true and five false, so "always false" never wins the game.
 *
 * Appended as a new export beside the ones already here. It never edits or
 * reorders an export above it, and reuses no item from them.
 *
 * The taught-by fence is enforced here: nothing below may name a plant, a
 * cutting, a spore, a flower part, pollen, pollination, IVF or a contraceptive
 * device. This deck is the human body only.
 *
 * Every `why` is evidence - a position, a count, a mechanism - and never an
 * appeal to authority. No item carries art or a glyph: a clock icon on the two
 * day-14 statements or a pad icon on the menstruation one would give its own
 * verdict away.
 *
 * `myth: true` on exactly four statements, which is exactly the boss round's
 * four slots: the two day-14 claims (this deck's spine, and the claim the
 * chapter's own exercise 13 asks a student to criticise), "a sperm and an egg
 * are the same cell at two sizes", and "the same method prevents an infection
 * too". The embryo/foetus statement is false but carries no myth flag: a
 * learner who got it right should not then have to gamble on a `why` line.
 */
export const CYCLE_CLAIMS = {
  statements: [
    { text: 'A period usually lasts 3 to 7 days.', truth: true, why: 'the lining and some blood leave through the vagina over these days' },
    { text: 'Ovulation always happens on day 14 of the cycle.', truth: false, myth: true, why: 'it comes about 14 days before the next period, so the day moves with the cycle length' },
    { text: 'In a 35-day cycle, the egg is likely to be released around day 21.', truth: true, myth: true, why: '35 minus 14 gives about day 21' },
    { text: 'In a 21-day cycle, the egg is likely to be released around day 7.', truth: true, why: '21 minus 14 gives about day 7' },
    { text: 'The lining of the uterus rebuilds after a period and is shed if no egg is fertilised.', truth: true, why: 'the thick lining is ready for a zygote and is not needed if none comes' },
    { text: 'An unfertilised egg stays viable for many weeks.', truth: false, why: 'it stays viable for about a day and then degenerates' },
    { text: 'A girl makes all-new eggs every month after puberty.', truth: false, myth: true, why: 'her ovaries already have millions of immature eggs at birth' },
    { text: 'Menstruation is a sign of a healthy reproductive system.', truth: true, why: 'it is a normal part of the monthly cycle, and nothing to be ashamed of' },
    { text: 'Periods continue as usual throughout pregnancy.', truth: false, myth: true, why: 'hormones keep the lining in place, and no eggs are released' },
    { text: 'The cycle usually begins between the ages of 10 and 14.', truth: true, why: 'it begins at puberty and continues till menopause, around age 50' },
  ],
};

/**
 * Which job does each organ of the two human systems actually do? Taught by
 * L07 s03 (male) and s04 (female). Eleven pairs, one pass: six male organs and
 * five female, so every organ is met exactly once in a run of 11.
 *
 * Appended as a new export beside the ones already here. It never edits or
 * reorders an export above it, and reuses no item from them.
 *
 * The groups are what the engine draws distractors from, same group first, so
 * they are set by the mix-ups the stub names rather than by system. The four
 * ducts and the two fluid glands all share `duct-and-gland`: that is the
 * "a tube and a gland are the same kind of thing" error, and it is caught only
 * if a tube and a gland are offered against each other. `makes` holds the two
 * organs that make the gamete, so the "the gland is the one that makes it"
 * error crosses with them. `holds` holds the two that hold something - the
 * testes at a lower reading, the egg against a wall. `passes` is the one
 * passage both leave by.
 *
 * The deck's own duplicate answer is deliberate: the seminal vesicle and the
 * prostate gland both add fluid that nourishes sperm. The engine never offers
 * two pairs with the same answer text against each other, so the cross cannot
 * be faked - each gland's why names its position, never a rank above the other.
 *
 * Exactly four items are `myth: true` - the scrotum, the oviduct and the two
 * glands - which is what makes the engine's four-item boss round exactly the
 * set the stub requires, both `adds fluid` pairs included. Marking the testes
 * and ovaries too would grow the pool to six, and the boss round could then
 * take four of the six without both glands in it.
 *
 * No item names a chromosome, meiosis, a zygote, an embryo, the menstrual
 * cycle, ovulation, pregnancy, contraception or an infection: none of that is
 * taught until L03 and L08. Each item is an organ and the one job it does.
 */
export const REPRO_ORGAN_JOBS = {
  pairs: [
    { prompt: 'Testis', group: 'makes', answer: 'where sperm are made', why: 'it makes sperm, and a hormone as well' },
    { prompt: 'Scrotum', group: 'holds', answer: 'keeps the testes slightly cooler', myth: true, why: 'this pouch of skin holds them outside the abdomen' },
    { prompt: 'Vas deferens', group: 'duct-and-gland', answer: 'long tube that carries sperm', why: 'it runs from the testis and opens into the urethra' },
    { prompt: 'Seminal vesicle', group: 'duct-and-gland', answer: 'adds fluid that nourishes sperm', myth: true, why: 'this gland adds fluid that keeps sperm active' },
    { prompt: 'Prostate gland', group: 'duct-and-gland', answer: 'adds fluid that nourishes sperm', myth: true, why: 'this gland also adds fluid that keeps sperm active' },
    { prompt: 'Urethra', group: 'passes', answer: 'passage for urine and for sperm', why: 'it is a common passage that runs through the penis' },
    { prompt: 'Ovary', group: 'makes', answer: 'where eggs form, and hormones too', why: 'it produces eggs and also releases hormones' },
    { prompt: 'Oviduct', group: 'duct-and-gland', answer: 'tube that joins ovary to uterus', myth: true, why: 'the egg moves along it, and a sperm may meet the egg here' },
    { prompt: 'Uterus', group: 'holds', answer: 'where a foetus develops', why: 'this bag-like structure protects and nourishes the baby' },
    { prompt: 'Cervix', group: 'duct-and-gland', answer: 'narrow passage below the uterus', why: 'the uterus opens into the vagina through it' },
    { prompt: 'Vagina', group: 'duct-and-gland', answer: 'where sperm enter the female body', why: 'it runs down from the cervix' },
  ],
};

/**
 * What is each part of a flower, and where does it sit? Taught by L04 s01 (the
 * four rings, outside in) and s03 (the two halves of a stamen and the four
 * parts of a pistil). Ten pairs, one pass: every name the lesson introduces is
 * met exactly once.
 *
 * Appended as a new export beside the ones already here. It never edits or
 * reorders an export above it, and reuses no item from them.
 *
 * The prompt is the bare name; the answer is the plain physical description,
 * short enough to sit in a target's 146 px label box but always carrying the
 * one fact that tells it from its near-synonym - under the head, the neck
 * below the tip, on the inner wall. That is the whole game: the two halves of
 * a stamen and the three stacked parts of a pistil are the pairs the engine
 * will hold against each other, because each pair shares a `group`.
 *
 * Exactly three pairs are `myth: true` - stigma, style and ovary - and that is
 * precisely what the boss round needs: the engine's four slots take the
 * learner's own misses first and then the `myth` set, and the order of the
 * pistil is the one fact the lesson gives in a sequence and the one most
 * easily reversed. Marking the anther or the filament as well would grow the
 * pool past four, and the boss could then be built without one of the three.
 *
 * The taught-by fence is enforced here: nothing below may name pollination, a
 * pod, a seed, a fruit, a pollinator, a bee, wind, water, fertilisation, a
 * pollen tube or a zygote - s07 and L05 own all of that. This deck is ten
 * names and what each one is. No item carries art or a glyph: a drawing of a
 * stamen beside the prompt `stamen` would give its own answer away.
 */
export const FLOWER_PARTS = {
  pairs: [
    { prompt: 'sepal', group: 'whorl', answer: 'the green part that covers a bud', why: 'sepals form the outermost ring and protect the flower in the bud stage' },
    { prompt: 'petal', group: 'whorl', answer: 'the coloured part', why: 'petals are the coloured ring, and many are scented too' },
    { prompt: 'stamen', group: 'whorl', answer: 'the male part: stalk and head', why: 'a stamen is a filament with an anther on it' },
    { prompt: 'pistil', group: 'whorl', answer: 'the female part: tip, tube and base', why: 'the pistil has a stigma, a style and an ovary' },
    { prompt: 'anther', group: 'stamen-part', answer: 'the head that produces pollen', why: 'the anther produces pollen grains, which contain the male gametes' },
    { prompt: 'filament', group: 'stamen-part', answer: 'the stalk under the head', why: 'the filament holds up the anther' },
    { prompt: 'stigma', group: 'pistil-part', answer: 'the tip of the pistil', myth: true, why: 'the stigma is at the tip, and it may be flat or sticky' },
    { prompt: 'style', group: 'pistil-part', answer: 'the thin long tube', myth: true, why: 'the style connects the stigma to the ovary' },
    { prompt: 'ovary', group: 'pistil-part', answer: 'the swollen base of the pistil', myth: true, why: 'the ovary is the swollen base, and it contains the ovules' },
    { prompt: 'ovule', group: 'pistil-part', answer: 'the part that holds the egg cell', why: 'the ovary contains ovules, and each ovule has an egg cell' },
  ],
};
