export type ExtractionMethod = "percolation" | "maceration" | "decoction";

export interface ExtractionHerb {
  id: number;
  common: string;
  botanical: string;
  part: string;
  ethanol?: number;         // % abv solvent
  methods: ExtractionMethod[];
  ratio: string;            // e.g. "1:3", "1:5", "1:10"
  days?: number;            // maceration / percolation time
  decoctionMin?: number;    // decoction simmer time in minutes
  spagyric: boolean;
  notes?: string;
}

export const EXTRACTION_HERBS: ExtractionHerb[] = [
  // ─── ADAPTOGENS ────────────────────────────────────────────
  { id: 1,  common: "Angelica (Dong Quai)", botanical: "Angelica sinensis",         part: "root",    ethanol: 45, methods: ["percolation"],              ratio: "1:5",       days: 2,  spagyric: true  },
  { id: 3,  common: "Ashwagandha",          botanical: "Withania somnifera",         part: "root",    methods: ["decoction","percolation"],               ratio: "1:5",       decoctionMin: 45,  days: 1, spagyric: true  },
  { id: 4,  common: "Astragalus",           botanical: "Astragalus membranaceus",    part: "root",    methods: ["decoction","percolation"],               ratio: "1:5",       decoctionMin: 60,  days: 1, spagyric: true  },
  { id: 5,  common: "Bacopa",               botanical: "Bacopa monnieri",            part: "aerial",  ethanol: 50, methods: ["percolation"],              ratio: "1:3",       days: 1,  spagyric: false },
  { id: 6,  common: "Barberry",             botanical: "Berberis vulgaris",          part: "root",    ethanol: 65, methods: ["percolation"],              ratio: "1:5",       days: 2,  spagyric: true  },
  { id: 9,  common: "Birch Polypore",       botanical: "Fomitopsis betulina",        part: "fungus",  methods: ["decoction","maceration"],               ratio: "1:10",      decoctionMin: 120,          spagyric: true  },
  { id: 10, common: "Black Cumin",          botanical: "Nigella sativa",             part: "seed",    ethanol: 70, methods: ["percolation"],              ratio: "1:3",       days: 1,  spagyric: false },
  { id: 18, common: "Burdock",              botanical: "Arctium lappa",              part: "root",    methods: ["decoction","percolation"],               ratio: "1:5",       decoctionMin: 45,  days: 1, spagyric: true  },
  { id: 40, common: "Dandelion Root",       botanical: "Taraxacum officinale",       part: "root",    methods: ["decoction","percolation"],               ratio: "1:5",       decoctionMin: 45,  days: 1, spagyric: true  },

  // ─── BERRIES ───────────────────────────────────────────────
  { id: 2,  common: "Aronia Berry",         botanical: "Aronia melanocarpa",         part: "berry",   ethanol: 40, methods: ["maceration"],               ratio: "1:3",       days: 14, spagyric: false },
  { id: 8,  common: "Bilberry",             botanical: "Vaccinium myrtillus",        part: "berry",   ethanol: 40, methods: ["maceration"],               ratio: "1:3",       days: 10, spagyric: false },

  // ─── FUNGI ─────────────────────────────────────────────────
  { id: 30, common: "Chaga",                botanical: "Inonotus obliquus",          part: "fungus",  methods: ["decoction","maceration"],               ratio: "1:10",      decoctionMin: 120,          spagyric: true,  notes: "Dual-extract — hot water first, then ethanol" },
  { id: 37, common: "Cordyceps",            botanical: "Cordyceps militaris",        part: "fungus",  methods: ["decoction","maceration"],               ratio: "1:10",      decoctionMin: 90,           spagyric: true  },
  { id: 79, common: "Lion's Mane",          botanical: "Hericium erinaceus",         part: "fungus",  methods: ["decoction","maceration"],               ratio: "1:10",      decoctionMin: 90,           spagyric: true  },
  { id: 106,common: "Reishi",               botanical: "Ganoderma lucidum",          part: "fungus",  methods: ["decoction","maceration"],               ratio: "1:10",      decoctionMin: 120,          spagyric: true,  notes: "Dual-extract — hot water first, then ethanol" },
  { id: 130,common: "Turkey Tail",          botanical: "Trametes versicolor",        part: "fungus",  methods: ["decoction","maceration"],               ratio: "1:10",      decoctionMin: 120,          spagyric: true  },

  // ─── MUCILAGE ──────────────────────────────────────────────
  { id: 17, common: "Broadleaf Plantain",   botanical: "Plantago major",             part: "leaf",    ethanol: 30, methods: ["maceration"],               ratio: "1:2 fresh", days: 14, spagyric: false, notes: "Fresh plant preferred; low ethanol preserves mucilage" },

  // ─── AROMATICS ─────────────────────────────────────────────
  { id: 110,common: "Rosemary",             botanical: "Rosmarinus officinalis",     part: "leaf",    ethanol: 70, methods: ["percolation"],              ratio: "1:3",       days: 1,  spagyric: false },
  { id: 126,common: "Thyme",                botanical: "Thymus vulgaris",            part: "leaf",    ethanol: 75, methods: ["percolation"],              ratio: "1:3",       days: 1,  spagyric: false },

  // ─── MINERAL / SPAGYRIC ────────────────────────────────────
  { id: 95, common: "Nettle",               botanical: "Urtica dioica",              part: "leaf",    ethanol: 45, methods: ["maceration","decoction"],   ratio: "1:5",       decoctionMin: 30,  days: 14, spagyric: true },

  // ─── BARLEY ────────────────────────────────────────────────
  { id: 7,  common: "Barley",               botanical: "Hordeum vulgare",            part: "seed",    ethanol: 25, methods: ["maceration"],               ratio: "1:5",       days: 14, spagyric: false },
];

export const METHOD_COLOR: Record<ExtractionMethod, { bg: string; text: string; border: string }> = {
  percolation: { bg: "rgba(123,212,161,0.1)",  text: "#7bd4a1", border: "rgba(123,212,161,0.3)"  },
  maceration:  { bg: "rgba(246,221,143,0.1)",  text: "#f6dd8f", border: "rgba(246,221,143,0.3)"  },
  decoction:   { bg: "rgba(251,146,60,0.1)",   text: "#fb923c", border: "rgba(251,146,60,0.3)"   },
};
