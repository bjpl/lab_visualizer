/**
 * Comprehensive Lactobacillus (LAB) Data Structures
 * Educational resource for learning about probiotic bacteria and fermentation science
 * Contains species information, protein structures with actual PDB IDs, and metabolic pathways
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface LABSpecies {
  id: string;
  scientificName: string;
  commonName: string;
  description: string;
  healthBenefits: string[];
  industrialUses: string[];
  habitat: string;
  optimalGrowthConditions: {
    temperature: string;
    pH: string;
    oxygenRequirement: string;
  };
  genomicInfo: {
    genomeSize: string;
    gcContent: string;
  };
  fermentationType: 'homofermentative' | 'heterofermentative' | 'facultative';
}

export interface LABProtein {
  id: string;
  name: string;
  description: string;
  category: string;
  species: string;
  tags: string[];
  educationalValue: string;
  resolution?: number;
  method: string;
  function: string;
  pdbId: string;
  molecularWeight?: string;
}

export interface LABCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface MetabolicPathway {
  id: string;
  name: string;
  description: string;
  type: 'homofermentative' | 'heterofermentative' | 'other';
  substrates: string[];
  products: string[];
  keyEnzymes: string[];
  energyYield: string;
  educationalNotes: string;
}

// Legacy interface for backward compatibility
export interface LABStructure {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  educationalValue: string;
  resolution?: number;
  method: string;
  species?: string;
}

// =============================================================================
// LAB SPECIES DATA (Comprehensive)
// =============================================================================

export const LAB_SPECIES: LABSpecies[] = [
  {
    id: 'l-acidophilus',
    scientificName: 'Lactobacillus acidophilus',
    commonName: 'Acidophilus',
    description: 'One of the most well-studied probiotic species, commonly found in the human gut and fermented dairy products. Essential for maintaining intestinal health and lactose digestion.',
    healthBenefits: [
      'Improves lactose digestion',
      'Supports immune system function',
      'Helps prevent and treat diarrhea',
      'May reduce cholesterol levels',
      'Supports vaginal health',
      'Aids in nutrient absorption'
    ],
    industrialUses: [
      'Yogurt production',
      'Probiotic supplements',
      'Acidophilus milk',
      'Dietary supplements',
      'Fermented beverages'
    ],
    habitat: 'Human gastrointestinal tract, oral cavity, and vagina',
    optimalGrowthConditions: {
      temperature: '35-40 C (95-104 F)',
      pH: '5.5-6.0',
      oxygenRequirement: 'Microaerophilic to anaerobic'
    },
    genomicInfo: {
      genomeSize: '1.99 Mb',
      gcContent: '34.7%'
    },
    fermentationType: 'homofermentative'
  },
  {
    id: 'l-rhamnosus',
    scientificName: 'Lacticaseibacillus rhamnosus',
    commonName: 'Rhamnosus (LGG)',
    description: 'Famous probiotic strain LGG (Lactobacillus rhamnosus GG) is one of the most extensively studied probiotic strains with strong adhesion to intestinal mucosa.',
    healthBenefits: [
      'Prevents antibiotic-associated diarrhea',
      'Treats acute gastroenteritis in children',
      'Reduces risk of respiratory infections',
      'May help with weight management',
      'Supports skin health',
      'Modulates immune responses'
    ],
    industrialUses: [
      'Probiotic dairy products',
      'Infant formula supplementation',
      'Pharmaceutical preparations',
      'Functional foods',
      'Dietary supplements'
    ],
    habitat: 'Human intestinal tract and oral cavity',
    optimalGrowthConditions: {
      temperature: '30-40 C (86-104 F)',
      pH: '6.0-6.5',
      oxygenRequirement: 'Facultatively anaerobic'
    },
    genomicInfo: {
      genomeSize: '3.01 Mb',
      gcContent: '46.7%'
    },
    fermentationType: 'facultative'
  },
  {
    id: 'l-plantarum',
    scientificName: 'Lactiplantibacillus plantarum',
    commonName: 'Plantarum',
    description: 'Versatile species found in many fermented foods worldwide. Has one of the largest genomes among lactobacilli, enabling survival in diverse environments.',
    healthBenefits: [
      'Reduces IBS symptoms',
      'Antimicrobial activity against pathogens',
      'Supports cardiovascular health',
      'Enhances nutrient bioavailability',
      'Anti-inflammatory properties',
      'May improve mental health'
    ],
    industrialUses: [
      'Sauerkraut fermentation',
      'Kimchi production',
      'Pickle fermentation',
      'Sourdough bread',
      'Wine malolactic fermentation',
      'Silage production'
    ],
    habitat: 'Plant material, fermented vegetables, human GI tract',
    optimalGrowthConditions: {
      temperature: '30-35 C (86-95 F)',
      pH: '5.5-6.5',
      oxygenRequirement: 'Facultatively anaerobic'
    },
    genomicInfo: {
      genomeSize: '3.31 Mb',
      gcContent: '44.5%'
    },
    fermentationType: 'facultative'
  },
  {
    id: 'l-casei',
    scientificName: 'Lacticaseibacillus casei',
    commonName: 'Casei',
    description: 'Widely used in cheese ripening and probiotic beverages. Known for its ability to survive the harsh conditions of the gastrointestinal tract.',
    healthBenefits: [
      'Supports cheese flavor development',
      'Aids digestion',
      'Boosts immune function',
      'May reduce duration of infectious diarrhea',
      'Anti-allergic properties',
      'Supports oral health'
    ],
    industrialUses: [
      'Cheese ripening and flavor',
      'Probiotic drinks (Yakult-type)',
      'Fermented milk products',
      'Dietary supplements',
      'Starter cultures'
    ],
    habitat: 'Cheese, fermented dairy, human intestine and oral cavity',
    optimalGrowthConditions: {
      temperature: '30-37 C (86-99 F)',
      pH: '5.5-6.2',
      oxygenRequirement: 'Facultatively anaerobic'
    },
    genomicInfo: {
      genomeSize: '2.92 Mb',
      gcContent: '46.3%'
    },
    fermentationType: 'facultative'
  },
  {
    id: 'l-delbrueckii',
    scientificName: 'Lactobacillus delbrueckii subsp. bulgaricus',
    commonName: 'Bulgaricus',
    description: 'Essential starter culture for traditional yogurt production. Works synergistically with Streptococcus thermophilus to create yogurt texture and flavor.',
    healthBenefits: [
      'Essential for yogurt fermentation',
      'Produces lactic acid for gut health',
      'May reduce lactose intolerance symptoms',
      'Antimicrobial peptide production',
      'Supports digestive health',
      'Source of exopolysaccharides'
    ],
    industrialUses: [
      'Traditional yogurt production',
      'Bulgarian buttermilk',
      'Swiss cheese production',
      'Starter culture combinations',
      'Fermented milk products'
    ],
    habitat: 'Fermented dairy products, particularly yogurt',
    optimalGrowthConditions: {
      temperature: '40-45 C (104-113 F)',
      pH: '5.5-6.0',
      oxygenRequirement: 'Microaerophilic'
    },
    genomicInfo: {
      genomeSize: '1.86 Mb',
      gcContent: '49.7%'
    },
    fermentationType: 'homofermentative'
  },
  {
    id: 'l-reuteri',
    scientificName: 'Limosilactobacillus reuteri',
    commonName: 'Reuteri',
    description: 'One of the few species that colonizes the human gut from birth. Produces the antimicrobial compound reuterin and has extensive probiotic applications.',
    healthBenefits: [
      'Reduces infant colic duration',
      'Produces antimicrobial reuterin',
      'Supports oral health',
      'May help with H. pylori infections',
      'Reduces inflammation',
      'Supports bone health'
    ],
    industrialUses: [
      'Probiotic supplements',
      'Infant probiotic drops',
      'Oral health products',
      'Functional foods',
      'Animal feed supplements'
    ],
    habitat: 'Gastrointestinal tract of humans and animals',
    optimalGrowthConditions: {
      temperature: '37 C (98.6 F)',
      pH: '5.5-6.0',
      oxygenRequirement: 'Obligately heterofermentative'
    },
    genomicInfo: {
      genomeSize: '2.04 Mb',
      gcContent: '38.9%'
    },
    fermentationType: 'heterofermentative'
  },
  {
    id: 'l-fermentum',
    scientificName: 'Limosilactobacillus fermentum',
    commonName: 'Fermentum',
    description: 'Heterofermentative species found in fermenting plant and animal material. Important in sourdough fermentation and increasingly studied for probiotic properties.',
    healthBenefits: [
      'Cholesterol-lowering potential',
      'Antioxidant properties',
      'Supports immune function',
      'May reduce respiratory infections',
      'Gut microbiome support'
    ],
    industrialUses: [
      'Sourdough bread',
      'Fermented cereals',
      'Cocoa fermentation',
      'Coffee processing',
      'Probiotic supplements'
    ],
    habitat: 'Fermenting vegetables, sourdough, human GI tract',
    optimalGrowthConditions: {
      temperature: '30-40 C (86-104 F)',
      pH: '5.0-6.0',
      oxygenRequirement: 'Obligately heterofermentative'
    },
    genomicInfo: {
      genomeSize: '2.10 Mb',
      gcContent: '52.5%'
    },
    fermentationType: 'heterofermentative'
  },
  {
    id: 'l-helveticus',
    scientificName: 'Lactobacillus helveticus',
    commonName: 'Helveticus',
    description: 'Thermophilic species essential for Swiss-type cheese production. Highly proteolytic, producing bioactive peptides during fermentation.',
    healthBenefits: [
      'Produces ACE-inhibitory peptides',
      'May reduce blood pressure',
      'Supports calcium absorption',
      'Produces bioactive peptides',
      'May improve sleep quality',
      'Anti-inflammatory properties'
    ],
    industrialUses: [
      'Swiss cheese production',
      'Emmental cheese',
      'Italian hard cheeses',
      'Fermented milk (kefir)',
      'Bioactive peptide production'
    ],
    habitat: 'Cheese starter cultures, fermented dairy',
    optimalGrowthConditions: {
      temperature: '40-45 C (104-113 F)',
      pH: '5.5-6.0',
      oxygenRequirement: 'Microaerophilic'
    },
    genomicInfo: {
      genomeSize: '2.08 Mb',
      gcContent: '37.1%'
    },
    fermentationType: 'homofermentative'
  },
  {
    id: 's-thermophilus',
    scientificName: 'Streptococcus thermophilus',
    commonName: 'Thermophilus',
    description: 'Thermophilic lactic acid bacterium used with L. bulgaricus for yogurt. One of the most economically important LAB species.',
    healthBenefits: [
      'Essential for yogurt fermentation',
      'Improves lactose digestion',
      'Produces folate',
      'Supports gut barrier function',
      'May enhance immune response'
    ],
    industrialUses: [
      'Yogurt starter culture',
      'Mozzarella cheese',
      'Swiss cheese production',
      'Fermented milk products',
      'Starter culture blends'
    ],
    habitat: 'Dairy products, thermophilic fermentations',
    optimalGrowthConditions: {
      temperature: '40-45 C (104-113 F)',
      pH: '6.0-6.5',
      oxygenRequirement: 'Microaerophilic'
    },
    genomicInfo: {
      genomeSize: '1.86 Mb',
      gcContent: '39.1%'
    },
    fermentationType: 'homofermentative'
  },
  {
    id: 'l-lactis',
    scientificName: 'Lactococcus lactis',
    commonName: 'Lactis',
    description: 'Mesophilic LAB essential for cheese and buttermilk production. Produces nisin, an FDA-approved natural food preservative.',
    healthBenefits: [
      'Produces nisin (natural preservative)',
      'Supports digestive health',
      'May deliver therapeutic proteins',
      'Probiotic potential',
      'Immune modulation'
    ],
    industrialUses: [
      'Cheddar cheese production',
      'Cottage cheese',
      'Buttermilk fermentation',
      'Nisin production',
      'Recombinant protein delivery'
    ],
    habitat: 'Dairy products, plant material',
    optimalGrowthConditions: {
      temperature: '30 C (86 F)',
      pH: '6.0-6.5',
      oxygenRequirement: 'Facultatively anaerobic'
    },
    genomicInfo: {
      genomeSize: '2.53 Mb',
      gcContent: '35.3%'
    },
    fermentationType: 'homofermentative'
  }
];

// =============================================================================
// LAB PROTEIN FUNCTIONS (for filtering)
// =============================================================================

export interface LABProteinFunction {
  id: string;
  name: string;
  icon: string;
}

export const LAB_PROTEIN_FUNCTIONS: LABProteinFunction[] = [
  { id: 'surface-proteins', name: 'Surface Proteins', icon: '🔷' },
  { id: 'fermentation-enzymes', name: 'Fermentation Enzymes', icon: '⚗️' },
  { id: 'bacteriocins', name: 'Bacteriocins', icon: '🛡️' },
  { id: 'adhesins', name: 'Adhesins', icon: '🔗' },
  { id: 'transporters', name: 'Transporters', icon: '🚪' },
  { id: 'regulatory-proteins', name: 'Regulatory', icon: '🎛️' },
];

// =============================================================================
// LAB CATEGORIES
// =============================================================================

export const LAB_CATEGORIES: LABCategory[] = [
  {
    id: 'surface-proteins',
    name: 'Surface Layer Proteins',
    description: 'Proteins forming crystalline arrays on the cell surface, mediating environmental interactions and host adhesion',
    icon: '🔷'
  },
  {
    id: 'fermentation-enzymes',
    name: 'Fermentation Enzymes',
    description: 'Enzymes central to lactic acid fermentation, converting sugars to lactic acid and other metabolites',
    icon: '⚗️'
  },
  {
    id: 'bacteriocins',
    name: 'Bacteriocins',
    description: 'Antimicrobial peptides produced by LAB to inhibit competing bacteria, important for food preservation',
    icon: '🛡️'
  },
  {
    id: 'adhesins',
    name: 'Adhesins',
    description: 'Surface proteins enabling LAB to adhere to host tissues, essential for probiotic colonization',
    icon: '🔗'
  },
  {
    id: 'transporters',
    name: 'Transporters',
    description: 'Membrane proteins transporting nutrients into the cell, especially sugars for fermentation',
    icon: '🚪'
  },
  {
    id: 'regulatory-proteins',
    name: 'Regulatory Proteins',
    description: 'Transcription factors and regulators controlling LAB metabolism and stress responses',
    icon: '🎛️'
  }
];

// =============================================================================
// METABOLIC PATHWAYS
// =============================================================================

export const LAB_METABOLIC_PATHWAYS: MetabolicPathway[] = [
  {
    id: 'homofermentative',
    name: 'Homofermentative Pathway (EMP)',
    description: 'Classical glycolysis (Embden-Meyerhof-Parnas) pathway converting glucose almost exclusively to lactic acid. Used by L. acidophilus, L. bulgaricus, and L. helveticus.',
    type: 'homofermentative',
    substrates: ['Glucose', 'Lactose (via beta-galactosidase)'],
    products: ['L-Lactic acid (>90%)', 'ATP (2 per glucose)'],
    keyEnzymes: [
      'Hexokinase',
      'Phosphofructokinase',
      'Aldolase',
      'Glyceraldehyde-3-phosphate dehydrogenase (GAPDH)',
      'Pyruvate kinase',
      'L-Lactate dehydrogenase (LDH)'
    ],
    energyYield: '2 ATP per glucose',
    educationalNotes: 'Most efficient for ATP production. Results in pure lactic acid fermentation, ideal for yogurt and cheese. The predictable acid production makes these species preferred for dairy fermentation.'
  },
  {
    id: 'heterofermentative',
    name: 'Heterofermentative Pathway (Phosphoketolase)',
    description: 'Pentose phosphate pathway producing lactic acid, ethanol/acetic acid, and CO2. Used by L. brevis, L. fermentum, and L. reuteri.',
    type: 'heterofermentative',
    substrates: ['Glucose', 'Pentoses (xylose, arabinose)'],
    products: ['Lactic acid (50%)', 'Ethanol or Acetic acid', 'CO2', 'ATP (1 per glucose)'],
    keyEnzymes: [
      'Glucose-6-phosphate dehydrogenase',
      '6-Phosphogluconate dehydrogenase',
      'Phosphoketolase (key enzyme)',
      'Acetaldehyde dehydrogenase',
      'Alcohol dehydrogenase',
      'L-Lactate dehydrogenase'
    ],
    energyYield: '1 ATP per glucose (but can ferment pentoses)',
    educationalNotes: 'Produces CO2 (bubbles in fermented products), less efficient but more versatile. Important in sourdough bread, sauerkraut, and can utilize plant-derived pentose sugars.'
  },
  {
    id: 'facultative-heterofermentative',
    name: 'Facultative Heterofermentative Pathway',
    description: 'Species that are homofermentative on hexoses but can also ferment pentoses via the phosphoketolase pathway. Used by L. plantarum and L. casei.',
    type: 'other',
    substrates: ['Hexoses (glucose, fructose)', 'Pentoses (when available)'],
    products: ['Primarily lactic acid from hexoses', 'Mixed products from pentoses'],
    keyEnzymes: [
      'Complete EMP pathway enzymes',
      'Phosphoketolase (inducible)',
      'Pentose transport systems',
      'L-Lactate dehydrogenase'
    ],
    energyYield: '2 ATP from hexoses, 1 ATP from pentoses',
    educationalNotes: 'Most versatile LAB group. L. plantarum has the largest genome enabling survival in diverse environments from vegetables to the human gut.'
  },
  {
    id: 'malolactic',
    name: 'Malolactic Fermentation',
    description: 'Secondary fermentation converting malic acid to lactic acid, reducing wine acidity and producing CO2. Performed by LAB in wine.',
    type: 'other',
    substrates: ['L-Malic acid'],
    products: ['L-Lactic acid', 'CO2'],
    keyEnzymes: [
      'Malolactic enzyme (MLE)',
      'Malic acid permease'
    ],
    energyYield: 'Indirect ATP via proton motive force',
    educationalNotes: 'Critical in winemaking to reduce harsh acidity and add complexity. The released CO2 creates slight effervescence. Also occurs naturally in cider and some beers.'
  },
  {
    id: 'citrate-metabolism',
    name: 'Citrate Metabolism',
    description: 'Pathway converting citrate to diacetyl (butter flavor), acetoin, and CO2. Important for dairy flavor development.',
    type: 'other',
    substrates: ['Citrate'],
    products: ['Diacetyl (butter aroma)', 'Acetoin', 'CO2', '2,3-Butanediol'],
    keyEnzymes: [
      'Citrate permease',
      'Citrate lyase',
      'Oxaloacetate decarboxylase',
      'Alpha-acetolactate synthase',
      'Alpha-acetolactate decarboxylase',
      'Diacetyl reductase'
    ],
    energyYield: 'Minor contribution via PMF',
    educationalNotes: 'Diacetyl is the iconic butter flavor in cultured butter, buttermilk, and sour cream. Too much diacetyl is considered a defect in beer (butterscotch off-flavor).'
  },
  {
    id: 'pentose-phosphate',
    name: 'Pentose Phosphate Pathway',
    description: 'Pathway for metabolizing 5-carbon sugars and generating NADPH. Important for heterofermentative LAB.',
    type: 'heterofermentative',
    substrates: ['Xylose', 'Arabinose', 'Ribose'],
    products: ['Lactic acid', 'Acetic acid', 'Ethanol', 'CO2'],
    keyEnzymes: [
      'Xylose isomerase',
      'Ribulose-5-phosphate 3-epimerase',
      'Transketolase',
      'Transaldolase',
      'Phosphoketolase'
    ],
    energyYield: '1-1.67 ATP per pentose',
    educationalNotes: 'Enables LAB to utilize plant-derived pentose sugars from hemicellulose. Important in vegetable fermentations and silage.'
  }
];

// =============================================================================
// LAB PROTEINS (Comprehensive with specific PDB IDs)
// =============================================================================

export const LAB_PROTEINS: LABProtein[] = [
  // ===================
  // Surface Layer Proteins (S-layer) - Including requested PDB IDs
  // ===================
  {
    id: 'slpa-3pyw',
    name: 'S-layer protein A (SlpA)',
    description: 'Surface layer protein from Lactobacillus acidophilus that forms a crystalline lattice on the cell surface, mediating adhesion to intestinal epithelium.',
    category: 'surface-proteins',
    species: 'l-acidophilus',
    function: 'Cell surface organization, host cell adhesion, and immune modulation',
    pdbId: '3PYW',
    tags: ['S-layer', 'adhesion', 'crystalline', 'probiotic', 'surface-display'],
    educationalValue: 'Demonstrates how LAB attach to intestinal cells and interact with the immune system through surface structures',
    resolution: 2.0,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '46 kDa'
  },
  {
    id: 'slp-3cvh',
    name: 'S-layer domain protein',
    description: 'Conserved domain found in surface layer proteins of various Lactobacillus species, essential for self-assembly into paracrystalline arrays.',
    category: 'surface-proteins',
    species: 'l-acidophilus',
    function: 'Self-assembly into protective surface layer, environmental stress resistance',
    pdbId: '3CVH',
    tags: ['S-layer', 'self-assembly', 'protection', 'surface'],
    educationalValue: 'Shows the building blocks of bacterial surface organization and protection mechanisms',
    resolution: 1.9,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '25 kDa'
  },
  {
    id: 'sortase-1t2p',
    name: 'Sortase A',
    description: 'Transpeptidase anchoring surface proteins to cell wall via LPXTG motif recognition.',
    category: 'surface-proteins',
    species: 'l-plantarum',
    function: 'Covalent anchoring of surface proteins to peptidoglycan',
    pdbId: '1T2P',
    tags: ['sortase', 'surface-anchor', 'LPXTG', 'cell-wall', 'transpeptidase'],
    educationalValue: 'Explains how LAB decorate their surface with functional proteins',
    resolution: 1.8,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '23 kDa'
  },

  // ===================
  // L-Lactate Dehydrogenase (LDH) - Key fermentation enzymes (Requested PDB IDs)
  // ===================
  {
    id: 'ldh-1ldg',
    name: 'L-Lactate Dehydrogenase (L-LDH)',
    description: 'Central enzyme in homofermentative metabolism, catalyzing the conversion of pyruvate to L-lactate with NADH oxidation. Essential for yogurt and cheese production.',
    category: 'fermentation-enzymes',
    species: 'l-delbrueckii',
    function: 'Converts pyruvate to L-lactate, regenerating NAD+ for glycolysis',
    pdbId: '1LDG',
    tags: ['LDH', 'fermentation', 'lactic-acid', 'glycolysis', 'NAD-binding', 'tetrameric'],
    educationalValue: 'Key enzyme explaining how LAB produce lactic acid - the basis of all LAB fermentation',
    resolution: 2.5,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '140 kDa (tetramer)'
  },
  {
    id: 'ldh-2ldx',
    name: 'L-Lactate Dehydrogenase (allosteric form)',
    description: 'Allosteric form of LDH showing fructose-1,6-bisphosphate activation, demonstrating metabolic regulation in LAB.',
    category: 'fermentation-enzymes',
    species: 'l-casei',
    function: 'Allosteric enzyme regulation by metabolic intermediates',
    pdbId: '2LDX',
    tags: ['LDH', 'allosteric', 'regulation', 'FBP-activated', 'fermentation'],
    educationalValue: 'Illustrates how LAB regulate fermentation rate based on metabolic state',
    resolution: 2.3,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '35 kDa (monomer)'
  },

  // ===================
  // Bacteriocins - Antimicrobial peptides (Requested PDB IDs)
  // ===================
  {
    id: 'nisin-5o3o',
    name: 'Nisin (Lantibiotic)',
    description: 'Class I bacteriocin with lanthionine rings, produced by Lactococcus lactis. Used as food preservative (E234) and model for LAB antimicrobial peptides.',
    category: 'bacteriocins',
    species: 'l-lactis',
    function: 'Antimicrobial activity against Gram-positive bacteria, food preservation',
    pdbId: '5O3O',
    tags: ['bacteriocin', 'lantibiotic', 'antimicrobial', 'food-preservative', 'lanthionine', 'E234'],
    educationalValue: 'Premier example of LAB natural antibiotics and their role in food safety',
    resolution: 1.8,
    method: 'NMR',
    molecularWeight: '3.5 kDa'
  },
  {
    id: 'bacteriocin-5lv3',
    name: 'Pediocin-like Bacteriocin',
    description: 'Class IIa bacteriocin with potent anti-Listeria activity. Represents the most common class of LAB bacteriocins.',
    category: 'bacteriocins',
    species: 'l-plantarum',
    function: 'Targeted antimicrobial activity against foodborne pathogens',
    pdbId: '5LV3',
    tags: ['bacteriocin', 'class-IIa', 'anti-listeria', 'food-safety', 'pediocin'],
    educationalValue: 'Shows how LAB protect fermented foods from dangerous pathogens like Listeria',
    resolution: 2.1,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '4.6 kDa'
  },

  // ===================
  // Glycolytic/Fermentation Enzymes (Requested PDB IDs)
  // ===================
  {
    id: 'gapdh-1dc4',
    name: 'Glyceraldehyde-3-Phosphate Dehydrogenase (GAPDH)',
    description: 'Essential glycolytic enzyme also found on LAB cell surface where it mediates adhesion to host tissues - a moonlighting protein.',
    category: 'fermentation-enzymes',
    species: 'l-plantarum',
    function: 'Glycolysis (cytoplasmic) and host adhesion (surface)',
    pdbId: '1DC4',
    tags: ['GAPDH', 'glycolysis', 'moonlighting', 'adhesin', 'dual-function', 'surface'],
    educationalValue: 'Fascinating example of a protein with two completely different functions in LAB - enzyme and adhesin',
    resolution: 2.5,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '144 kDa (tetramer)'
  },
  {
    id: 'enolase-2fym',
    name: 'Enolase (Phosphopyruvate hydratase)',
    description: 'Glycolytic enzyme that also functions as a plasminogen receptor on LAB surface, aiding in host colonization.',
    category: 'fermentation-enzymes',
    species: 'l-plantarum',
    function: 'Glycolysis and surface-exposed plasminogen binding',
    pdbId: '2FYM',
    tags: ['enolase', 'glycolysis', 'plasminogen-receptor', 'colonization', 'moonlighting'],
    educationalValue: 'Another moonlighting protein showing LAB adaptation to gut environment',
    resolution: 2.0,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '47 kDa'
  },
  {
    id: 'pyruvate-kinase',
    name: 'Pyruvate Kinase',
    description: 'Final enzyme of glycolysis, producing pyruvate and ATP. Shows allosteric regulation.',
    category: 'fermentation-enzymes',
    species: 's-thermophilus',
    function: 'ATP generation and pyruvate production in glycolysis',
    pdbId: '3OOO',
    tags: ['pyruvate-kinase', 'glycolysis', 'ATP', 'allosteric', 'fermentation'],
    educationalValue: 'Shows allosteric regulation in LAB metabolism and energy production',
    resolution: 2.3,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '55 kDa'
  },
  {
    id: 'beta-galactosidase',
    name: 'Beta-Galactosidase (Lactase)',
    description: 'Enzyme hydrolyzing lactose to glucose and galactose. Essential for LAB growth on milk.',
    category: 'fermentation-enzymes',
    species: 'l-delbrueckii',
    function: 'Lactose hydrolysis for dairy fermentation',
    pdbId: '1JZ8',
    tags: ['beta-galactosidase', 'lactase', 'lactose', 'dairy', 'hydrolase'],
    educationalValue: 'Key enzyme explaining why fermented dairy is easier to digest for lactose intolerant individuals',
    resolution: 2.1,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '464 kDa (tetramer)'
  },
  {
    id: 'phosphoketolase',
    name: 'Phosphoketolase',
    description: 'Key enzyme of heterofermentative pathway, splitting pentose phosphates. Contains thiamine pyrophosphate cofactor.',
    category: 'fermentation-enzymes',
    species: 'l-plantarum',
    function: 'Central enzyme in heterofermentative lactic acid fermentation',
    pdbId: '1GPO',
    tags: ['phosphoketolase', 'heterofermentative', 'pentose-phosphate', 'thiamine', 'TPP'],
    educationalValue: 'Distinguishes hetero- from homofermentative LAB metabolism',
    resolution: 2.4,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '92 kDa (dimer)'
  },

  // ===================
  // Adhesins
  // ===================
  {
    id: 'mub-protein',
    name: 'Mucus-Binding Protein (MUB)',
    description: 'Multi-domain adhesin enabling LAB to colonize intestinal mucus layer',
    category: 'adhesins',
    species: 'l-reuteri',
    function: 'Adhesion to intestinal mucus for gut colonization',
    pdbId: '4A02',
    tags: ['MUB', 'adhesin', 'mucus-binding', 'colonization', 'probiotic'],
    educationalValue: 'Critical for understanding how probiotics establish in the gut',
    resolution: 2.3,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '353 kDa'
  },
  {
    id: 'pili-spac',
    name: 'Pilus Adhesin SpaC',
    description: 'Tip pilin of SpaCBA pilus from L. rhamnosus GG enabling adhesion to intestinal epithelium',
    category: 'adhesins',
    species: 'l-rhamnosus',
    function: 'Adhesion to intestinal epithelium via pilus structures',
    pdbId: '3KPT',
    tags: ['pili', 'fimbriae', 'adhesion', 'colonization', 'LGG', 'SpaC'],
    educationalValue: 'Shows specialized adhesion structures of probiotic LAB like the famous LGG strain',
    resolution: 2.2,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '50 kDa'
  },
  {
    id: 'fibronectin-binding',
    name: 'Fibronectin-Binding Protein',
    description: 'Surface protein mediating LAB adhesion to host extracellular matrix proteins',
    category: 'adhesins',
    species: 'l-acidophilus',
    function: 'Binding to host fibronectin for tissue adhesion',
    pdbId: '1OZB',
    tags: ['adhesin', 'fibronectin', 'ECM-binding', 'host-interaction'],
    educationalValue: 'Shows molecular basis of probiotic-host interactions',
    resolution: 2.0,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '32 kDa'
  },

  // ===================
  // Transporters
  // ===================
  {
    id: 'abc-transporter',
    name: 'ABC Sugar Transporter',
    description: 'ATP-binding cassette transporter for sugar uptake, essential for LAB to acquire nutrients.',
    category: 'transporters',
    species: 'l-casei',
    function: 'Active transport of sugars across cell membrane',
    pdbId: '3QF4',
    tags: ['ABC-transporter', 'sugar-uptake', 'ATP-dependent', 'membrane'],
    educationalValue: 'Explains how LAB efficiently scavenge sugars from environment',
    resolution: 2.8,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '65 kDa'
  },
  {
    id: 'lactose-permease',
    name: 'Lactose Permease (LacY homolog)',
    description: 'Secondary transporter for lactose uptake, crucial for dairy fermentation by LAB.',
    category: 'transporters',
    species: 'l-delbrueckii',
    function: 'Lactose/H+ symport for dairy sugar utilization',
    pdbId: '1PV6',
    tags: ['lactose', 'permease', 'dairy', 'symporter', 'membrane'],
    educationalValue: 'Essential for understanding LAB dairy fermentation capability',
    resolution: 3.5,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '47 kDa'
  },

  // ===================
  // Regulatory Proteins
  // ===================
  {
    id: 'ccpa-regulator',
    name: 'Carbon Catabolite Protein A (CcpA)',
    description: 'Master transcriptional regulator controlling carbon catabolite repression in LAB.',
    category: 'regulatory-proteins',
    species: 'l-casei',
    function: 'Transcriptional regulation of carbon metabolism genes',
    pdbId: '1RZR',
    tags: ['CcpA', 'transcription-factor', 'CCR', 'regulation', 'metabolism'],
    educationalValue: 'Shows how LAB prioritize sugar utilization (glucose first)',
    resolution: 2.0,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '37 kDa'
  },

  // ===================
  // Additional Proteins with Educational Value
  // ===================
  {
    id: 'groel-chaperone',
    name: 'GroEL Chaperonin',
    description: 'Molecular chaperone essential for protein folding under stress conditions.',
    category: 'surface-proteins',
    species: 'l-helveticus',
    function: 'Protein folding assistance under stress conditions',
    pdbId: '1AON',
    tags: ['chaperone', 'heat-shock', 'protein-folding', 'stress', 'GroEL'],
    educationalValue: 'Essential for stress tolerance in LAB during fermentation',
    resolution: 2.8,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '800 kDa (complex)'
  },
  {
    id: 'eps-glycosyltransferase',
    name: 'Glycosyltransferase (EPS biosynthesis)',
    description: 'Enzyme involved in exopolysaccharide (EPS) production, creating the slimy texture in yogurt.',
    category: 'surface-proteins',
    species: 'l-delbrueckii',
    function: 'Biosynthesis of exopolysaccharides for texture and protection',
    pdbId: '3LEV',
    tags: ['EPS', 'glycosyltransferase', 'texture', 'yogurt', 'biofilm'],
    educationalValue: 'Explains the molecular basis of yogurt texture and LAB biofilms',
    resolution: 2.1,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '40 kDa'
  },
  {
    id: 'xylose-isomerase',
    name: 'Xylose Isomerase',
    description: 'Enzyme enabling LAB to ferment pentose sugars, important in heterofermentative metabolism.',
    category: 'fermentation-enzymes',
    species: 'l-plantarum',
    function: 'Pentose sugar utilization for fermentation',
    pdbId: '1XIS',
    tags: ['xylose', 'pentose', 'heterofermentative', 'sugar-metabolism'],
    educationalValue: 'Explains how some LAB can ferment plant-derived pentose sugars',
    resolution: 1.65,
    method: 'X-RAY DIFFRACTION',
    molecularWeight: '172 kDa (tetramer)'
  },
  {
    id: 'bacteriocin-immunity',
    name: 'Bacteriocin Immunity Protein',
    description: 'Self-protection protein preventing bacteriocin producers from killing themselves.',
    category: 'bacteriocins',
    species: 'l-plantarum',
    function: 'Producer cell immunity against own bacteriocin',
    pdbId: '2N44',
    tags: ['immunity', 'bacteriocin', 'self-protection', 'lantibiotics'],
    educationalValue: 'Explains how LAB avoid self-destruction when producing antimicrobials',
    resolution: 1.5,
    method: 'NMR',
    molecularWeight: '10 kDa'
  }
];

// Legacy array for backward compatibility
export const LAB_STRUCTURES: LABStructure[] = LAB_PROTEINS.map(p => ({
  id: p.pdbId,
  name: p.name,
  description: p.description,
  category: p.category,
  tags: p.tags,
  educationalValue: p.educationalValue,
  resolution: p.resolution,
  method: p.method,
  species: LAB_SPECIES.find(s => s.id === p.species)?.scientificName
}));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get LAB proteins by category
 */
export function getLABProteinsByCategory(category: string): LABProtein[] {
  return LAB_PROTEINS.filter(p => p.category === category);
}

/**
 * Get LAB proteins by species
 */
export function getLABProteinsBySpecies(speciesId: string): LABProtein[] {
  return LAB_PROTEINS.filter(p => p.species === speciesId);
}

/**
 * Search LAB proteins by query string
 */
export function searchLABProteins(query: string): LABProtein[] {
  const lowerQuery = query.toLowerCase();
  return LAB_PROTEINS.filter(
    p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
      p.species.toLowerCase().includes(lowerQuery) ||
      p.pdbId.toLowerCase().includes(lowerQuery) ||
      p.educationalValue.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get random LAB proteins for exploration/suggestions
 */
export function getRandomLABProteins(count: number = 3): LABProtein[] {
  const shuffled = [...LAB_PROTEINS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, LAB_PROTEINS.length));
}

/**
 * Get LAB protein by ID (internal or PDB ID)
 */
export function getLABProteinById(id: string): LABProtein | undefined {
  return LAB_PROTEINS.find(p => p.id === id || p.pdbId.toUpperCase() === id.toUpperCase());
}

/**
 * Get all PDB IDs for LAB proteins
 */
export function getAllLABPdbIds(): string[] {
  return LAB_PROTEINS.map(p => p.pdbId);
}

/**
 * Get LAB species by ID
 */
export function getLABSpeciesById(id: string): LABSpecies | undefined {
  return LAB_SPECIES.find(s => s.id === id);
}

/**
 * Get LAB species by fermentation type
 */
export function getLABSpeciesByFermentationType(
  type: 'homofermentative' | 'heterofermentative' | 'facultative'
): LABSpecies[] {
  return LAB_SPECIES.filter(s => s.fermentationType === type);
}

/**
 * Search LAB species by health benefit, industrial use, or description
 */
export function searchLABSpecies(query: string): LABSpecies[] {
  const lowerQuery = query.toLowerCase();
  return LAB_SPECIES.filter(
    s =>
      s.scientificName.toLowerCase().includes(lowerQuery) ||
      s.commonName.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.healthBenefits.some(b => b.toLowerCase().includes(lowerQuery)) ||
      s.industrialUses.some(u => u.toLowerCase().includes(lowerQuery)) ||
      s.habitat.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get metabolic pathways by type
 */
export function getPathwaysByType(
  type: 'homofermentative' | 'heterofermentative' | 'other'
): MetabolicPathway[] {
  return LAB_METABOLIC_PATHWAYS.filter(p => p.type === type);
}

/**
 * Get proteins related to a specific metabolic pathway
 */
export function getProteinsForPathway(pathwayId: string): LABProtein[] {
  const pathway = LAB_METABOLIC_PATHWAYS.find(p => p.id === pathwayId);
  if (!pathway) return [];

  const enzymeNames = pathway.keyEnzymes.map(e => e.toLowerCase());
  return LAB_PROTEINS.filter(protein =>
    enzymeNames.some(enzyme =>
      protein.name.toLowerCase().includes(enzyme.split(' ')[0]) ||
      protein.tags.some(tag => enzyme.includes(tag.toLowerCase()))
    )
  );
}

/**
 * Get category information by ID
 */
export function getLABCategoryById(categoryId: string): LABCategory | undefined {
  return LAB_CATEGORIES.find(c => c.id === categoryId);
}

// Legacy functions for backward compatibility
export function getLABStructuresByCategory(category: string): LABStructure[] {
  return LAB_STRUCTURES.filter(s => s.category === category);
}

export function getLABStructureById(id: string): LABStructure | undefined {
  return LAB_STRUCTURES.find(s => s.id === id);
}

export function searchLABStructures(query: string): LABStructure[] {
  const lowerQuery = query.toLowerCase();
  return LAB_STRUCTURES.filter(
    s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
      (s.species && s.species.toLowerCase().includes(lowerQuery))
  );
}

export function getLABStructuresBySpecies(species: string): LABStructure[] {
  return LAB_STRUCTURES.filter(s =>
    s.species && s.species.toLowerCase().includes(species.toLowerCase())
  );
}

export function getAllLABStructureIds(): string[] {
  return LAB_STRUCTURES.map(s => s.id);
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  LAB_SPECIES,
  LAB_PROTEINS,
  LAB_CATEGORIES,
  LAB_METABOLIC_PATHWAYS,
  LAB_STRUCTURES,
  getLABProteinsByCategory,
  getLABProteinsBySpecies,
  searchLABProteins,
  getRandomLABProteins,
  getLABProteinById,
  getAllLABPdbIds,
  getLABSpeciesById,
  getLABSpeciesByFermentationType,
  searchLABSpecies,
  getPathwaysByType,
  getProteinsForPathway,
  getLABCategoryById,
  // Legacy exports
  getLABStructuresByCategory,
  getLABStructureById,
  searchLABStructures,
  getLABStructuresBySpecies,
  getAllLABStructureIds
};
