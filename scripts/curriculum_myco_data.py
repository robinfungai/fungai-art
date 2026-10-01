# -*- coding: utf-8 -*-
"""
Mycology & Fungal Kingdom Curriculum
Levels:
1. Hyphae (Subterranean germination, fungal genetics, spores to monokaryons, mycorrhizal root interweaving)
2. Mycelium (The underground web, bi-directional nutrient transfer, soil remediation, enzymatic breakdown of lignin/cellulose)
3. Fruiting Body (Primordium pinning, basidiocarp development, medicinal polypores & mushrooms: Chaga, Reishi, Lion's Mane, Turkey Tail, Maitake, Shiitake, Cordyceps)
4. Sporing (Basidiospore discharge, gills vs pores, dual extraction of beta-glucans vs triterpenes, immunomodulation & Dectin-1 receptors)
5. Decay (Expert) (Saprotrophic master ecology, deadwood return, Tinder Fungus/Fomes fomentarius, Birch Polypore/Fomitopsis betulina, Nordic Allemansrätten conk harvesting ethics, toxicology, forensic lookalikes, Amanita muscaria Nordic lore)
"""

MYCO_LEVELS = {
    1: "Hyphae — Subterranean Germination & Mycorrhizal Kinship",
    2: "Mycelium — The Living Soil Web & Enzymatic Intelligence",
    3: "Fruiting Body — Medicinal Polypores & Macrofungal Pharmacognosy",
    4: "Sporing — Dual Extraction Dynamics & Receptor Immunology",
    5: "Decay (Expert) — Saprotrophic Master Ecology & Forensic Safety"
}

def get_mycology_questions():
    return [
        # ─────────────────────────────────────────────────────────────
        # LEVEL 1: HYPHAE
        # ─────────────────────────────────────────────────────────────
        {
            "num": 1,
            "level_num": 1,
            "module": "Module 1: Spore Germination & Cellular Genesis",
            "lesson": "Lesson 1: From Haploid Spore to Monokaryon",
            "fungus": "Fungal Biology",
            "badges": ["[MECHANISTIC]", "[ECOLOGY]"],
            "question": "When a fungal basidiospore settles upon fertile forest humus, what initial biological structure emerges?",
            "options": [
                "A single germ tube that elongates into a tubular monokaryotic hyphal thread",
                "A miniature underground mushroom fruitbody that immediately begins producing airborne reproductive spores",
                "A dormant root bulb that absorbs liquid minerals from adjacent tree bark",
                "A microscopic seed capsule that splits open only after seasonal forest wildfire"
            ],
            "correct": 0,
            "explanation": "A germinating spore produces a single germ tube that extends into a septate or aseptate hypha containing a single haploid nucleus (monokaryon) until mating occurs."
        },
        {
            "num": 2,
            "level_num": 1,
            "module": "Module 1: Spore Germination & Cellular Genesis",
            "lesson": "Lesson 2: Clamp Connections & Plasmogamy",
            "fungus": "Fungal Biology",
            "badges": ["[MECHANISTIC]"],
            "question": "In higher Basidiomycete fungi, what does the microscopic presence of a 'clamp connection' indicate?",
            "options": [
                "The fungal hypha is under lethal attack from competing parasitic soil nematodes",
                "The mycelium has successfully mated, maintaining two distinct nuclei per hyphal compartment",
                "The fungus has exhausted all ambient soil moisture and is forming sclerotia",
                "The hyphal tip has entered a symbiotic partnership with adjacent plant roots"
            ],
            "correct": 1,
            "explanation": "Clamp connections are unique hook-like cellular structures in Basidiomycota that ensure proper distribution of two genetically distinct nuclei during dikaryotic cell division."
        },
        {
            "num": 3,
            "level_num": 1,
            "module": "Module 2: Mycorrhizal Guilds & Root Architecture",
            "lesson": "Lesson 1: Ectomycorrhizae & The Hartig Net",
            "fungus": "Ectomycorrhizae",
            "badges": ["[ECOLOGY]", "[MECHANISTIC]"],
            "question": "How do ectomycorrhizal fungi (like Chanterelles or Porcini) physically interweave with boreal tree roots?",
            "options": [
                "They form an intercellular fungal network between root cortex cells without penetrating walls",
                "They bore directly through plant cell membranes to consume host starches aggressively",
                "They wrap exclusively around dry dead root hairs without exchanging moisture or ions",
                "They dissolve the entire root epidermis, replacing tree root tissue with mycelium"
            ],
            "correct": 0,
            "explanation": "Ectomycorrhizal fungi envelop the root tips in a fungal mantle and penetrate between cortical cells to form the 'Hartig net', facilitating bidirectional nutrient and water exchange."
        },
        {
            "num": 4,
            "level_num": 1,
            "module": "Module 2: Mycorrhizal Guilds & Root Architecture",
            "lesson": "Lesson 2: Subterranean Carbon Shuttling",
            "fungus": "Mycorrhizal Networks",
            "badges": ["[ECOLOGY]", "[HUMAN EVIDENCE]"],
            "question": "What groundbreaking ecological fact did forest ecologist Suzanne Simard document regarding mycorrhizal hyphal networks?",
            "options": [
                "Fungi act purely as predatory pathogens that slowly kill ancient forest canopy trees",
                "Mycorrhizal hyphae shuttle photosynthetic carbon and alarm signals bidirectionally between different tree species",
                "Forest trees can only photosynthesize carbohydrates if fungal spores are coating their leaves",
                "Subterranean fungal hyphae completely prevent any moisture from draining into forest aquifers"
            ],
            "correct": 1,
            "explanation": "Isotopic tracer studies proved that mycorrhizal mycelium forms a common mycorrhizal network (CMN), shuttling carbon, water, and defense signals between trees like Birch and Douglas Fir."
        },
        {
            "num": 5,
            "level_num": 1,
            "module": "Module 3: Chitinous Cell Walls & Solvent Chemistry",
            "lesson": "Lesson 1: Chitin vs Plant Cellulose",
            "fungus": "Fungal Pharmacognosy",
            "badges": ["[MECHANISTIC]"],
            "question": "Unlike vascular plants whose cell walls are made of cellulose, what polymer builds fungal cell walls?",
            "options": [
                "Water-soluble vegetable pectin that readily dissolves in cold room temperature water",
                "Chitin, a tough nitrogen-rich polysaccharide identical to the exoskeletons of crustaceans and insects",
                "Silica crystals that dissolve rapidly when exposed to mild household vinegar solutions",
                "Gelatinous starches that turn gummy when exposed to ambient forest humidity"
            ],
            "correct": 1,
            "explanation": "Fungal cell walls consist of beta-glucans cross-linked to insoluble chitin, which requires sustained heat (decoction) or pressure to fracture and release trapped bioactives."
        },

        # ─────────────────────────────────────────────────────────────
        # LEVEL 2: MYCELIUM
        # ─────────────────────────────────────────────────────────────
        {
            "num": 6,
            "level_num": 2,
            "module": "Module 1: The Underground Web & Soil Genesis",
            "lesson": "Lesson 1: Extracellular Enzymatic Secretion",
            "fungus": "Mycelial Physiology",
            "badges": ["[MECHANISTIC]"],
            "question": "How does fungal mycelium digest nutrients in the forest floor before absorbing them into hyphae?",
            "options": [
                "It engulfs particulate matter into internal stomach-like vacuoles through cellular phagocytosis",
                "It secretes powerful oxidative enzymes (like laccases and cellulases) externally into the substrate",
                "It absorbs intact wood fibers directly through specialized oral micro-pores along the hypha",
                "It relies exclusively on ambient soil bacteria to pre-digest all organic cellulose matter"
            ],
            "correct": 1,
            "explanation": "Fungi exhibit absorptive heterotrophy: hyphal tips secrete extracellular enzymes (laccases, manganese peroxidases, cellulases) that break complex polymers down externally before absorption."
        },
        {
            "num": 7,
            "level_num": 2,
            "module": "Module 1: The Underground Web & Soil Genesis",
            "lesson": "Lesson 2: Mycoremediation of Hydrocarbons",
            "fungus": "Mycoremediation",
            "badges": ["[ECOLOGY]", "[MECHANISTIC]"],
            "question": "Why are white-rot mycelia (like Oyster mushrooms) capable of breaking down toxic petroleum spills?",
            "options": [
                "Their lignin-degrading enzymes break carbon-hydrogen bonds that resemble the complex molecular structure of wood",
                "They produce acidic juices that burn petroleum hydrocarbons into harmless atmospheric nitrogen gas",
                "They physically store petroleum inside fungal vacuoles without breaking down any toxic chemicals",
                "They require refined gasoline as their primary metabolic fuel source to produce fruitbodies"
            ],
            "correct": 0,
            "explanation": "Because petroleum hydrocarbons structurally mimic the aromatic ring bonds of wood lignin, mycelial laccase and peroxidase enzyme suites can cleave complex petrochemical toxins into water and CO2."
        },
        {
            "num": 8,
            "level_num": 2,
            "module": "Module 2: Ergosterol & Photobiology",
            "lesson": "Lesson 1: Solar Synthesis of Vitamin D2",
            "fungus": "Fungal Biochemistry",
            "badges": ["[MECHANISTIC]", "[HUMAN EVIDENCE]"],
            "question": "What happens when dried or fresh mushrooms (like Shiitake or Maitake) are exposed to direct midday UV sunlight?",
            "options": [
                "Their surface ergosterol converts photochemically into bioavailable ergocalciferol (Vitamin D2)",
                "Their aromatic volatile terpenes decompose into caustic resins that irritate the digestive lining",
                "Their therapeutic beta-glucans break down into simple sucrose sugars that spoil in storage",
                "Their deep mushroom pigments bleach away, eliminating all active medicinal triterpenoid compounds"
            ],
            "correct": 0,
            "explanation": "Fungi contain high levels of ergosterol; ultraviolet (UVB) light converts ergosterol into ergocalciferol (Vitamin D2), providing a potent vegan source of dietary vitamin D."
        },
        {
            "num": 9,
            "level_num": 2,
            "module": "Module 3: Pure Mycelium vs Fruitbody Chemistry",
            "lesson": "Lesson 1: Erinacines vs Hericenones in Lion's Mane",
            "fungus": "Lion's Mane",
            "badges": ["[MECHANISTIC]", "[HUMAN EVIDENCE]"],
            "question": "In Lion's Mane (*Hericium erinaceus*), where are the potent NGF-stimulating diterpenoids known as 'erinacines' primarily concentrated?",
            "options": [
                "Exclusively in the subterranean pure liquid-cultured vegetative mycelium, rather than the fruitbody",
                "Strictly in the hanging spines of the fully mature outdoor autumn mushroom fruitbody",
                "In the sterile woody bark of the dead oak host tree where the mushroom attaches",
                "In the dry airborne white spores discharged during late November frosts"
            ],
            "correct": 0,
            "explanation": "Phytochemical profiling shows that erinacines (potent low-molecular-weight diterpenoids that cross the blood-brain barrier) are concentrated in pure mycelium, while hericenones reside in the fruiting body."
        },
        {
            "num": 10,
            "level_num": 2,
            "module": "Module 3: Pure Mycelium vs Fruitbody Chemistry",
            "lesson": "Lesson 2: Myceliated Grain vs Pure Fungal Tissue",
            "fungus": "Mushroom Quality",
            "badges": ["[SAFETY]", "[MECHANISTIC]"],
            "question": "When inspecting commercial 'mycelium on grain' mushroom powders, what quality metric must an herbalist examine?",
            "options": [
                "Testing whether the product contains high residual grain starch (alpha-glucans) rather than fungal beta-glucans",
                "Checking whether the powder dissolves instantly in cold milk without leaving any sediment",
                "Ensuring the powder has been dyed bright yellow to prove active cordycepin content",
                "Verifying that the grain substrate was boiled in synthetic alcohol before inoculation"
            ],
            "correct": 0,
            "explanation": "Mycelium grown on grain (MOG) often consists of 40–70% unconsumed grain substrate. Quality testing measures fungal (1,3)(1,6)-beta-glucans versus inactive grain starch (alpha-glucans)."
        },

        # ─────────────────────────────────────────────────────────────
        # LEVEL 3: FRUITING BODY
        # ─────────────────────────────────────────────────────────────
        {
            "num": 11,
            "level_num": 3,
            "module": "Module 1: The Sovereign Polypore — Chaga",
            "lesson": "Lesson 1: Sterile Conk vs True Basidiocarp",
            "fungus": "Chaga",
            "badges": ["[TRADITIONAL]", "[ECOLOGY]"],
            "question": "What is the dark, charcoal-like golden mass of Chaga (*Inonotus obliquus*) harvested from living Birch trees?",
            "options": [
                "A dense vegetative sclerotial mass composed of fungal mycelium intergrown with birch wood lignin",
                "The delicate annual fruiting body that sheds airborne spores every spring morning",
                "A parasitic insect gall formed when native forest wasps lay eggs in birch buds",
                "A benign resinous sap blister that forms where winter ice cracks birch bark"
            ],
            "correct": 0,
            "explanation": "The harvested Chaga 'conk' is not a fruiting body, but a sterile fungal conk (sclerotium) of dense mycelium rich in melanins, formed through a decades-long relationship with Betula pendula."
        },
        {
            "num": 12,
            "level_num": 3,
            "module": "Module 1: The Sovereign Polypore — Chaga",
            "lesson": "Lesson 2: Oxalate Safety & Renal Clearance",
            "fungus": "Chaga",
            "badges": ["[SAFETY]"],
            "question": "What clinical safety concern is associated with consuming excessive, daily high-dose Chaga tea over many months?",
            "options": [
                "Chaga contains high natural concentrations of soluble oxalates that can stress kidneys or cause nephropathy",
                "Chaga permanently shuts down stomach acid, preventing the breakdown of dietary proteins in digestion",
                "Chaga causes sudden drops in red blood cells by binding iron in the colon",
                "Chaga acts as an intense sedative that induces twenty-four-hour comatose sleep states"
            ],
            "correct": 0,
            "explanation": "Chaga contains significant levels of oxalates. Excessive long-term daily intake has been clinically documented to cause oxalate nephropathy and renal stone formation in susceptible individuals."
        },
        {
            "num": 13,
            "level_num": 3,
            "module": "Module 2: Reishi — Ganoderma & The Spirit Mushroom",
            "lesson": "Lesson 1: Ganoderic Acids & Bitterness",
            "fungus": "Reishi",
            "badges": ["[TRADITIONAL]", "[MECHANISTIC]"],
            "question": "Why does a potent decoction of red Reishi mushroom (*Ganoderma lucidum*) taste intensely bitter on the tongue?",
            "options": [
                "The intense bitterness is driven by highly oxygenated triterpenes known as ganoderic and lucidenic acids",
                "Reishi absorbs heavy metal salts from hemlock wood that impart an artificial metallic bitter taste",
                "The bitterness indicates that the mushroom fruitbody has spoiled and fermented in storage",
                "Fungal spores release ammonia gas when boiled, creating an acrid bitter flavor profile"
            ],
            "correct": 0,
            "explanation": "Reishi's distinctive bitter taste stems from its triterpenoid fraction (over 100 identified ganoderic and lucidenic acids), which possess hepatoprotective, anti-allergic, and anti-inflammatory actions."
        },
        {
            "num": 14,
            "level_num": 3,
            "module": "Module 2: Reishi — Ganoderma & The Spirit Mushroom",
            "lesson": "Lesson 2: Lingzhi & Shen Tonification",
            "fungus": "Reishi",
            "badges": ["[TRADITIONAL]"],
            "question": "In classical Chinese medicine, why was Reishi (Lingzhi) categorized as a superior Shen-calming tonic?",
            "options": [
                "It was used to nourish spiritual serenity, ground emotional agitation, and support restful nighttime sleep",
                "It was prescribed as a harsh physical purgative to force rapid gastrointestinal emptying",
                "It was taken exclusively by palace warriors to stimulate aggressive cardiovascular adrenaline rushes",
                "It was burned as an incense to ward off airborne viral fevers in summer palaces"
            ],
            "correct": 0,
            "explanation": "In TCM, Lingzhi is famous as a sovereign tonic for the Heart and Shen (spirit), indicated for insomnia, restless worry, forgetfulness, and nervous exhaustion without morning grogginess."
        },
        {
            "num": 15,
            "level_num": 3,
            "module": "Module 3: Turkey Tail & Clinical Immunotherapy",
            "lesson": "Lesson 1: PSK & PSP Glycoproteins",
            "fungus": "Turkey Tail",
            "badges": ["[HUMAN EVIDENCE]"],
            "question": "In Japan and China, what standardized Turkey Tail (*Trametes versicolor*) extracts are approved as hospital cancer adjuncts?",
            "options": [
                "Polysaccharide Krestin (PSK) and Polysaccharopeptide (PSP), which modulate immune surveillance alongside conventional therapy",
                "Purified fungal alkaloids that act as direct synthetic chemical chemotherapy agents",
                "Topical mushroom essential oils applied to dermal incisions to speed surgical wound closure",
                "Crude fungal powders that permanently replace all standard radiation and surgical treatments"
            ],
            "correct": 0,
            "explanation": "PSK and PSP are protein-bound beta-glucans extracted from Trametes versicolor, rigorously studied in human trials and approved in Japan as adjunct immunotherapies alongside standard oncology care."
        },
        {
            "num": 16,
            "level_num": 3,
            "module": "Module 4: Cordyceps — Energy & Cellular Respiration",
            "lesson": "Lesson 1: Cordycepin & Adenosine",
            "fungus": "Cordyceps",
            "badges": ["[MECHANISTIC]", "[HUMAN EVIDENCE]"],
            "question": "How does Cordyceps (*Cordyceps militaris*) physiologically support physical endurance and stamina?",
            "options": [
                "Its active nucleosides (adenosine and cordycepin) support cellular ATP synthesis and enhance oxygen utilization",
                "It delivers concentrated synthetic caffeine that forces heart contractions to spike uncontrollably",
                "It numbs muscular lactic acid receptors so athletes fail to notice physical muscle tears",
                "It converts dietary fiber into pure blood glucose within ten seconds of swallowing"
            ],
            "correct": 0,
            "explanation": "Cordyceps contains adenosine and cordycepin (3'-deoxyadenosine), which participate in cellular bioenergetics, improving mitochondrial ATP regeneration and aerobic oxygen saturation under physical stress."
        },
        {
            "num": 17,
            "level_num": 3,
            "module": "Module 5: Tremella & Metabolic Allies",
            "lesson": "Lesson 1: Snow Fungus & Yin Hydration",
            "fungus": "Tremella",
            "badges": ["[TRADITIONAL]", "[MECHANISTIC]"],
            "question": "Why is the gelatinous Snow Fungus (*Tremella fuciformis*) revered in cosmetic and respiratory herbalism?",
            "options": [
                "Its acidic resins peel away epidermal layers to lighten facial scars within forty-eight hours",
                "Its glucuronoxylomannan polysaccharides hold water exceptionally, deeply moisturizing dry pulmonary and skin tissues",
                "It acts as a caustic drying agent that clears all natural moisture from weeping rashes",
                "It stimulates intense oil production by clogging facial sebaceous glands with fungal lipids"
            ],
            "correct": 1,
            "explanation": "Tremella's high-molecular-weight polysaccharides hold up to 500 times their weight in water (exceeding hyaluronic acid), traditionally used in TCM to nourish Lung Yin and replenish dermal moisture."
        },

        # ─────────────────────────────────────────────────────────────
        # LEVEL 4: SPORING
        # ─────────────────────────────────────────────────────────────
        {
            "num": 18,
            "level_num": 4,
            "module": "Module 1: Extraction Chemistry & Chitin Cleavage",
            "lesson": "Lesson 1: The Dual-Extraction Protocol",
            "fungus": "Extraction Physics",
            "badges": ["[MECHANISTIC]"],
            "question": "Why do master mushroom formulators perform a 'dual extraction' (hot water decoction plus high-proof ethanol)?",
            "options": [
                "Hot water extracts polar beta-glucans, while alcohol dissolves non-polar triterpenes and sterols",
                "Alcohol is used merely to dye the water extract a deep rich amber color",
                "Hot water kills all beneficial compounds, while alcohol brings them back to life",
                "Dual extraction thins the liquid so it passes smoothly through paper tea bags"
            ],
            "correct": 0,
            "explanation": "Medicinal mushrooms possess two distinct therapeutic fractions: water-soluble immunomodulating beta-glucans and alcohol-soluble triterpenoids/sterols. Combining both yields a full-spectrum extract."
        },
        {
            "num": 19,
            "level_num": 4,
            "module": "Module 1: Extraction Chemistry & Chitin Cleavage",
            "lesson": "Lesson 2: Hot Water Simmer Times",
            "fungus": "Extraction Physics",
            "badges": ["[MECHANISTIC]"],
            "question": "Why must tough polypores (like Chaga or Reishi) be simmered in water for multiple hours rather than steeped like green tea?",
            "options": [
                "Prolonged heat is necessary to break the dense chitin-beta-glucan matrix and liberate trapped polysaccharides",
                "Mushroom bioactives evaporate into steam unless the pot is boiled vigorously for four hours",
                "Short steeping causes mushroom tea to curdle into thick gelatinous clumps that choke swallowing",
                "Boiling for hours is only needed to sterilize dangerous heavy mold spores from wild woods"
            ],
            "correct": 0,
            "explanation": "Because medicinal polysaccharides are tightly bound within tough chitinous cell walls, sustained simmering (60–120 minutes minimum) is required to hydro-thermally dissolve and liberate active beta-glucans."
        },
        {
            "num": 20,
            "level_num": 4,
            "module": "Module 2: Receptor Immunology & The Dectin-1 Axis",
            "lesson": "Lesson 1: Gut-Associated Lymphoid Tissue (GALT)",
            "fungus": "Fungal Immunology",
            "badges": ["[MECHANISTIC]", "[HUMAN EVIDENCE]"],
            "question": "When you drink medicinal mushroom tea, how do fungal beta-glucans interact with your gut immune system?",
            "options": [
                "They bind to Dectin-1 and Complement Receptor 3 on intestinal Peyer's patch dendritic cells and macrophages",
                "They enter the bloodstream through the stomach lining, acting as synthetic antibodies against foreign bacteria",
                "They completely deactivate all systemic white blood cells to prevent metabolic inflammation in joints",
                "They pass through the digestive tract entirely unobserved by any human immune cells"
            ],
            "correct": 0,
            "explanation": "Fungal beta-(1,3)(1,6)-D-glucans act as pathogen-associated molecular patterns (PAMPs), binding Dectin-1 receptors on intestinal macrophages and dendritic cells, training innate immune surveillance."
        },
        {
            "num": 21,
            "level_num": 4,
            "module": "Module 2: Receptor Immunology & The Dectin-1 Axis",
            "lesson": "Lesson 2: Biological Response Modulation",
            "fungus": "Fungal Immunology",
            "badges": ["[MECHANISTIC]"],
            "question": "Why are medicinal mushrooms classified as 'immunomodulators' rather than simple immune stimulants?",
            "options": [
                "They can up-regulate depressed immunity while down-regulating hyper-reactive inflammatory pathways",
                "They permanently eliminate the body's need for white blood cells and bone marrow",
                "They stimulate the immune system to attack all ingested food proteins uniformly",
                "They only function when a client is experiencing an active, high-grade seasonal fever"
            ],
            "correct": 0,
            "explanation": "Immunomodulators act amphoterically: they enhance pathogen surveillance and macrophage phagocytosis when immune activity is low, yet temper excessive pro-inflammatory cytokine surges during hyper-reactivity."
        },
        {
            "num": 22,
            "level_num": 4,
            "module": "Module 3: Birch Polypore — Piptoporellus Pharmacognosy",
            "lesson": "Lesson 1: Piptamine & The Ice Man's Medicine",
            "fungus": "Birch Polypore",
            "badges": ["[TRADITIONAL]", "[MECHANISTIC]"],
            "question": "Why was the 5,300-year-old Alpine mummy 'Ötzi' found carrying Birch Polypore (*Fomitopsis betulina*) on leather thongs?",
            "options": [
                "Its active triterpenes and piptamine provided antiparasitic and antimicrobial protection against intestinal whipworms",
                "He used the bitter polypore as emergency high-calorie rations during high-altitude blizzards",
                "Birch polypore was burned as sacred incense to navigate mountain trails at night",
                "The mushroom was carved into waterproof hunting tools and sharp flint-knapping axes"
            ],
            "correct": 0,
            "explanation": "Ötzi suffered from whipworm (*Trichuris trichiura*); Birch Polypore contains piptamine, polyporenic acids, and agaricic acid, long used in boreal folk medicine as an antiparasitic and gut-toning bitter."
        },

        # ─────────────────────────────────────────────────────────────
        # LEVEL 5: DECAY (EXPERT)
        # ─────────────────────────────────────────────────────────────
        {
            "num": 23,
            "level_num": 5,
            "module": "Module 1: Saprotrophic Ecology & Ancient Deadwood",
            "lesson": "Lesson 1: Tinder Fungus & The Amadou Layer",
            "fungus": "Tinder Fungus",
            "badges": ["[TRADITIONAL]", "[ECOLOGY]"],
            "question": "How did historical boreal peoples utilize the thick velvety 'amadou' layer of Tinder Fungus (*Fomes fomentarius*)?",
            "options": [
                "As an ember-catching fire starter, a styptic blood-stopping bandage, and breathable felt clothing",
                "As an edible culinary delicacy boiled into sweet holiday festival porridges",
                "As a potent narcotic sedative smoked in clay pipes to induce sleep",
                "As a chemical dye that turns wool yarn bright fluorescent green"
            ],
            "correct": 0,
            "explanation": "The processed trama layer (amadou) of Fomes fomentarius was prized across European prehistory for catching spark embers, staunching surgical bleeding (surgeon's agaric), and crafting hats."
        },
        {
            "num": 24,
            "level_num": 5,
            "module": "Module 1: Saprotrophic Ecology & Ancient Deadwood",
            "lesson": "Lesson 2: Stand Regeneration & Heartwood Rot",
            "fungus": "Forest Ecology",
            "badges": ["[ECOLOGY]"],
            "question": "In natural old-growth boreal forest ecology, why are saprotrophic shelf fungi essential for forest renewal?",
            "options": [
                "They selectively decompose aging heartwood, creating hollows for wildlife and recycling locked soil nutrients",
                "They kill entire forest canopies every decade to make room for industrial pasture land",
                "They prevent all tree seeds from germinating until all fallen timber is removed",
                "They absorb all ambient carbon dioxide, releasing pure nitrogen into the lower understory"
            ],
            "correct": 0,
            "explanation": "Heart-rot and saprotrophic fungi create deadwood cavities crucial for birds, insects, and bats, while breaking down complex lignin into dark, nutrient-rich forest humus."
        },
        {
            "num": 25,
            "level_num": 5,
            "module": "Module 2: Nordic Foraging Law & Allemansrätten",
            "lesson": "Lesson 1: Tree Cambium & Ethical Limits",
            "fungus": "Nordic Law",
            "badges": ["[SAFETY]", "[ECOLOGY]"],
            "question": "Under Swedish Allemansrätten, what is the crucial legal distinction between picking ground mushrooms and harvesting tree conks?",
            "options": [
                "Ground mushrooms may be freely gathered, but removing conks from living trees damages wood and requires landowner consent",
                "All ground mushrooms require written permits from county rangers before crossing public trails",
                "Tree-dwelling conks are entirely exempt from property laws and may be harvested anywhere without limits",
                "It is strictly illegal to touch any wild fungus growing within fifty meters of a birch stand"
            ],
            "correct": 0,
            "explanation": "Allemansrätten grants freedom to forage wild ground fruits and mushrooms, but explicitly protects living trees: cutting, hacking, or stripping bark/conks off living wood requires landowner permission."
        },
        {
            "num": 26,
            "level_num": 5,
            "module": "Module 3: Fungal Toxicology & Forensic Identification",
            "lesson": "Lesson 1: Amatoxins & The Destroying Angel",
            "fungus": "Toxicology",
            "badges": ["[SAFETY]"],
            "question": "Why is the deadly Destroying Angel (*Amanita virosa*) so catastrophically dangerous to novice Nordic mushroom foragers?",
            "options": [
                "Its pure white caps resemble edible meadow mushrooms, and amatoxins cause delayed irreversible liver failure",
                "It emits a pungent foul odor that knocks foragers unconscious within seconds of proximity",
                "It tastes intensely spicy and burns the mouth instantly upon touching the cap",
                "It causes mild stomach cramps that resolve without any need for medical observation"
            ],
            "correct": 0,
            "explanation": "Amanita virosa contains amatoxins that inhibit RNA polymerase II. Symptoms appear after a deceptive 6–24 hour latency, followed by massive hepatocyte necrosis and acute liver failure."
        },
        {
            "num": 27,
            "level_num": 5,
            "module": "Module 3: Fungal Toxicology & Forensic Identification",
            "lesson": "Lesson 2: Cortinarius Orellanus & Delayed Nephrotoxicity",
            "fungus": "Toxicology",
            "badges": ["[SAFETY]"],
            "question": "What sinister diagnostic challenge makes Fool's Webcap (*Cortinarius orellanus*) poisoning uniquely difficult to identify?",
            "options": [
                "Its orellanine toxin induces severe acute renal failure after a delayed latency period of up to two weeks",
                "It causes immediate visual hallucinations that prevent the patient from speaking to emergency clinicians",
                "It turns the patient's urine bright blue within thirty minutes of consuming the mushroom cap",
                "It only affects people with specific genetic blood types, leaving others entirely unharmed"
            ],
            "correct": 0,
            "explanation": "Orellanine poisoning has one of the longest known toxicology latency periods (often 3 to 14 days before intense thirst, flank pain, and irreversible renal failure emerge), obscuring the dietary cause."
        },
        {
            "num": 28,
            "level_num": 5,
            "module": "Module 4: Nordic Lore — Amanita muscaria",
            "lesson": "Lesson 1: Ibotenic Acid to Muscimol Decarboxylation",
            "fungus": "Amanita muscaria",
            "badges": ["[TRADITIONAL]", "[SAFETY]"],
            "question": "In circumpolar and Nordic ethnomycology, how was the iconic Fly Agaric (*Amanita muscaria*) traditionally prepared before ritual ingestion?",
            "options": [
                "It was thoroughly heat-dried or cured to decarboxylate neurotoxic ibotenic acid into psychoactive muscimol",
                "It was eaten freshly picked from the moss while damp with morning forest dew",
                "It was submerged in ice-cold saltwater for three weeks to remove all active alkaloids",
                "It was buried beneath birch roots for five years to allow soil fungi to neutralize toxins"
            ],
            "correct": 0,
            "explanation": "Fresh Amanita muscaria contains high levels of excitatory ibotenic acid (inducing nausea, delirium, and twitches); heat drying decarboxylates it into muscimol, a potent GABA-A receptor agonist."
        }
    ]
