/**
 * Mock Learning Content Data Fixtures
 * Demo mode educational modules and pathways
 */

import type {
  LearningModule,
  LearningPathway,
  UserProgress,
  QuizContent,
  GuideContent,
  TutorialContent,
  VideoContent,
  QuizQuestion,
  TutorialStep,
  GuideSection,
} from '../../types/learning';
import { DEMO_USER, EDUCATOR_USER } from './users';

/**
 * Introduction to Protein Structure - Video Module
 */
export const MODULE_INTRO_PROTEIN: LearningModule = {
  id: 'module-intro-protein-001',
  creatorId: EDUCATOR_USER.id,
  title: 'Introduction to Protein Structure',
  description: 'Learn the fundamentals of protein structure, from amino acids to quaternary structure. Perfect for beginners in structural biology.',
  contentType: 'video',
  contentData: {
    type: 'video',
    videoUrl: '/videos/intro-protein-structure.mp4',
    transcript: 'Welcome to this introduction to protein structure...',
    chapters: [
      { time: 0, title: 'Introduction', description: 'Overview of protein importance' },
      { time: 120, title: 'Amino Acids', description: 'The building blocks of proteins' },
      { time: 360, title: 'Primary Structure', description: 'Amino acid sequences' },
      { time: 540, title: 'Secondary Structure', description: 'Alpha helices and beta sheets' },
      { time: 780, title: 'Tertiary Structure', description: '3D protein folding' },
      { time: 960, title: 'Quaternary Structure', description: 'Multi-subunit proteins' },
      { time: 1140, title: 'Summary', description: 'Key takeaways' },
    ],
    annotations: [
      {
        timestamp: 560,
        structureId: '1HHO',
        cameraPosition: {
          position: [0, 0, 100],
          target: [0, 0, 0],
          up: [0, 1, 0],
        },
        highlights: { chains: ['A'] },
        note: 'Notice the alpha helices in the hemoglobin subunit',
      },
    ],
  } as VideoContent,
  thumbnailUrl: '/thumbnails/intro-protein.jpg',
  duration: 1200, // 20 minutes
  relatedStructures: ['1HHO', '1MBO', '1LYZ'],
  difficulty: 1,
  prerequisites: [],
  learningObjectives: [
    'Identify the four levels of protein structure',
    'Recognize common secondary structure elements',
    'Understand how proteins fold into 3D shapes',
    'Describe quaternary structure in multi-subunit proteins',
  ],
  tags: ['protein', 'structure', 'beginner', 'fundamentals'],
  visibility: 'public',
  isPublished: true,
  viewCount: 15234,
  completionCount: 8456,
  avgRating: 4.7,
  ratingCount: 1234,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-06-20T14:30:00Z',
  publishedAt: '2024-01-20T09:00:00Z',
};

/**
 * Hemoglobin Deep Dive - Interactive Guide
 */
export const MODULE_HEMOGLOBIN_GUIDE: LearningModule = {
  id: 'module-hemoglobin-guide-001',
  creatorId: EDUCATOR_USER.id,
  title: 'Hemoglobin: Structure and Function',
  description: 'An interactive guide exploring hemoglobin structure, oxygen binding, and cooperative behavior with 3D visualization.',
  contentType: 'guide',
  contentData: {
    type: 'guide',
    sections: [
      {
        id: 'section-1',
        title: 'Overview of Hemoglobin',
        content: `# Hemoglobin Overview

Hemoglobin is the oxygen-carrying protein found in red blood cells. It consists of four subunits:
- Two alpha (α) chains
- Two beta (β) chains

Each subunit contains a **heme group** with an iron atom that binds oxygen.

## Key Facts
- Molecular weight: ~64,500 Da
- Contains 574 amino acids total
- First quaternary structure ever determined`,
        structureId: '1HHO',
        images: ['/images/hemoglobin-overview.png'],
        order: 1,
      },
      {
        id: 'section-2',
        title: 'The Heme Group',
        content: `# The Heme Group

The heme group is a porphyrin ring with an iron atom at its center.

## Iron Coordination
- **Proximal histidine (His F8)**: Bonds directly to iron
- **Distal histidine (His E7)**: Stabilizes bound oxygen

The iron can exist in two states:
1. **Fe²⁺ (ferrous)**: Can bind oxygen
2. **Fe³⁺ (ferric)**: Cannot bind oxygen (methemoglobin)`,
        structureId: '1HHO',
        order: 2,
      },
      {
        id: 'section-3',
        title: 'Cooperative Binding',
        content: `# Cooperative Oxygen Binding

Hemoglobin exhibits **positive cooperativity** - binding of one oxygen molecule increases affinity for subsequent molecules.

## The Sigmoid Curve
Unlike myoglobin's hyperbolic curve, hemoglobin shows a sigmoidal oxygen binding curve.

## Allosteric Effects
- **T state** (tense): Low oxygen affinity
- **R state** (relaxed): High oxygen affinity

Binding of oxygen triggers a conformational change from T to R state.`,
        structureId: '1HHO',
        order: 3,
      },
      {
        id: 'section-4',
        title: 'Physiological Importance',
        content: `# Physiological Importance

## Oxygen Delivery
Hemoglobin's cooperative binding allows efficient:
- **Loading** of oxygen in the lungs (high pO₂)
- **Unloading** in tissues (low pO₂)

## Bohr Effect
pH and CO₂ affect oxygen affinity:
- Lower pH → decreased affinity (helps unload in tissues)
- Higher CO₂ → decreased affinity

## Clinical Relevance
Mutations in hemoglobin cause diseases like:
- Sickle cell anemia (HbS)
- Thalassemias`,
        order: 4,
      },
    ],
    interactiveElements: [
      {
        type: 'structure-viewer',
        sectionId: 'section-2',
        config: {
          structureId: '1HHO',
          highlight: ['HEM'],
          view: 'heme-focus',
        },
      },
      {
        type: 'comparison',
        sectionId: 'section-3',
        config: {
          structures: ['1HHO', '4HHB'],
          labels: ['R-state (oxy)', 'T-state (deoxy)'],
        },
      },
    ],
  } as GuideContent,
  thumbnailUrl: '/thumbnails/hemoglobin-guide.jpg',
  duration: null,
  relatedStructures: ['1HHO', '4HHB', '1MBO'],
  difficulty: 3,
  prerequisites: ['module-intro-protein-001'],
  learningObjectives: [
    'Describe the quaternary structure of hemoglobin',
    'Explain the role of the heme group in oxygen binding',
    'Understand cooperative binding and the sigmoid curve',
    'Compare T and R states of hemoglobin',
  ],
  tags: ['hemoglobin', 'oxygen-binding', 'cooperativity', 'intermediate'],
  visibility: 'public',
  isPublished: true,
  viewCount: 8765,
  completionCount: 4532,
  avgRating: 4.8,
  ratingCount: 876,
  createdAt: '2024-02-10T11:00:00Z',
  updatedAt: '2024-07-15T09:00:00Z',
  publishedAt: '2024-02-15T10:00:00Z',
};

/**
 * Molecular Visualization Tutorial
 */
export const MODULE_VISUALIZATION_TUTORIAL: LearningModule = {
  id: 'module-viz-tutorial-001',
  creatorId: EDUCATOR_USER.id,
  title: 'Mastering Molecular Visualization',
  description: 'Learn to use the LAB Visualizer effectively with this hands-on tutorial covering navigation, selection, and analysis tools.',
  contentType: 'tutorial',
  contentData: {
    type: 'tutorial',
    steps: [
      {
        id: 'step-1',
        title: 'Loading a Structure',
        instruction: 'Let\'s start by loading a protein structure. Click the "Load Structure" button and enter PDB ID "1LYZ" (lysozyme).',
        structureId: '1LYZ',
        action: {
          type: 'select',
          target: 'load-button',
        },
        validation: {
          type: 'automatic',
          criteria: 'structure-loaded',
        },
        order: 1,
      },
      {
        id: 'step-2',
        title: 'Basic Navigation',
        instruction: 'Practice rotating the structure by clicking and dragging. Use the scroll wheel to zoom in and out.',
        structureId: '1LYZ',
        action: {
          type: 'rotate',
          parameters: { minRotation: 90 },
        },
        validation: {
          type: 'automatic',
          criteria: 'rotation-complete',
        },
        order: 2,
      },
      {
        id: 'step-3',
        title: 'Changing Representation',
        instruction: 'Change the display style from cartoon to ball-and-stick using the toolbar.',
        structureId: '1LYZ',
        action: {
          type: 'select',
          target: 'style-selector',
          parameters: { style: 'ball-and-stick' },
        },
        validation: {
          type: 'automatic',
          criteria: 'style-changed',
        },
        order: 3,
      },
      {
        id: 'step-4',
        title: 'Selecting Residues',
        instruction: 'Click on a residue to select it. Notice the information panel updates with details about your selection.',
        structureId: '1LYZ',
        action: {
          type: 'select',
          target: 'residue',
        },
        validation: {
          type: 'automatic',
          criteria: 'selection-made',
        },
        order: 4,
      },
      {
        id: 'step-5',
        title: 'Measuring Distances',
        instruction: 'Use the measurement tool to measure the distance between two atoms. Select two atoms while holding Shift.',
        structureId: '1LYZ',
        action: {
          type: 'measure',
          parameters: { measurementType: 'distance' },
        },
        validation: {
          type: 'automatic',
          criteria: 'measurement-complete',
        },
        order: 5,
      },
      {
        id: 'step-6',
        title: 'Adding Annotations',
        instruction: 'Add an annotation to mark an interesting feature. Right-click on the active site and select "Add Annotation".',
        structureId: '1LYZ',
        action: {
          type: 'annotate',
          target: 'active-site',
        },
        validation: {
          type: 'manual',
        },
        order: 6,
      },
    ],
  } as TutorialContent,
  thumbnailUrl: '/thumbnails/viz-tutorial.jpg',
  duration: 900, // 15 minutes
  relatedStructures: ['1LYZ'],
  difficulty: 1,
  prerequisites: [],
  learningObjectives: [
    'Load and navigate molecular structures',
    'Change visualization styles',
    'Select atoms and residues',
    'Use measurement and annotation tools',
  ],
  tags: ['tutorial', 'visualization', 'beginner', 'hands-on'],
  visibility: 'public',
  isPublished: true,
  viewCount: 12456,
  completionCount: 9876,
  avgRating: 4.9,
  ratingCount: 2134,
  createdAt: '2024-01-05T08:00:00Z',
  updatedAt: '2024-08-01T12:00:00Z',
  publishedAt: '2024-01-10T09:00:00Z',
};

/**
 * Protein Structure Quiz
 */
export const MODULE_PROTEIN_QUIZ: LearningModule = {
  id: 'module-protein-quiz-001',
  creatorId: EDUCATOR_USER.id,
  title: 'Protein Structure Assessment',
  description: 'Test your knowledge of protein structure with this comprehensive quiz covering all four levels of structural organization.',
  contentType: 'quiz',
  contentData: {
    type: 'quiz',
    questions: [
      {
        id: 'q1',
        question: 'Which level of protein structure is determined by the amino acid sequence?',
        type: 'multiple-choice',
        options: ['Primary structure', 'Secondary structure', 'Tertiary structure', 'Quaternary structure'],
        correctAnswer: 'Primary structure',
        explanation: 'Primary structure refers to the linear sequence of amino acids in a polypeptide chain.',
        points: 10,
        order: 1,
      },
      {
        id: 'q2',
        question: 'Alpha helices and beta sheets are examples of secondary structure.',
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Secondary structure refers to local folding patterns stabilized by hydrogen bonds between backbone atoms.',
        points: 10,
        order: 2,
      },
      {
        id: 'q3',
        question: 'What type of bond primarily stabilizes secondary structure?',
        type: 'multiple-choice',
        options: ['Disulfide bonds', 'Hydrogen bonds', 'Ionic bonds', 'Van der Waals forces'],
        correctAnswer: 'Hydrogen bonds',
        explanation: 'Hydrogen bonds between the carbonyl oxygen and amide hydrogen of the backbone stabilize secondary structures.',
        points: 10,
        order: 3,
      },
      {
        id: 'q4',
        question: 'Identify the protein shown. What is its primary function?',
        type: 'structure-identification',
        structureId: '1HHO',
        options: ['Enzyme catalysis', 'Oxygen transport', 'Muscle contraction', 'Signal transduction'],
        correctAnswer: 'Oxygen transport',
        explanation: 'This is hemoglobin, which transports oxygen in red blood cells.',
        points: 15,
        order: 4,
      },
      {
        id: 'q5',
        question: 'Which amino acid is most commonly found in alpha helices?',
        type: 'multiple-choice',
        options: ['Proline', 'Glycine', 'Alanine', 'Cysteine'],
        correctAnswer: 'Alanine',
        explanation: 'Alanine has a high helix propensity due to its small, non-bulky side chain.',
        points: 10,
        order: 5,
      },
      {
        id: 'q6',
        question: 'What is the term for the overall 3D shape of a single polypeptide chain?',
        type: 'short-answer',
        correctAnswer: ['tertiary structure', 'tertiary'],
        explanation: 'Tertiary structure describes the complete 3D arrangement of a single polypeptide chain.',
        points: 10,
        order: 6,
      },
      {
        id: 'q7',
        question: 'Quaternary structure requires multiple polypeptide chains.',
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Quaternary structure describes the arrangement of multiple polypeptide subunits.',
        points: 10,
        order: 7,
      },
      {
        id: 'q8',
        question: 'How many subunits does hemoglobin contain?',
        type: 'multiple-choice',
        structureId: '1HHO',
        options: ['2', '3', '4', '6'],
        correctAnswer: '4',
        explanation: 'Hemoglobin is a tetramer with 2 alpha and 2 beta subunits.',
        points: 10,
        order: 8,
      },
    ],
    passingScore: 70,
    timeLimit: 900, // 15 minutes
  } as QuizContent,
  thumbnailUrl: '/thumbnails/protein-quiz.jpg',
  duration: 900,
  relatedStructures: ['1HHO', '1MBO', '1LYZ'],
  difficulty: 2,
  prerequisites: ['module-intro-protein-001'],
  learningObjectives: [
    'Identify the four levels of protein structure',
    'Understand stabilizing forces at each level',
    'Recognize common structural motifs',
  ],
  tags: ['quiz', 'assessment', 'protein', 'structure'],
  visibility: 'public',
  isPublished: true,
  viewCount: 6789,
  completionCount: 5432,
  avgRating: 4.5,
  ratingCount: 987,
  createdAt: '2024-02-01T10:00:00Z',
  updatedAt: '2024-06-15T11:00:00Z',
  publishedAt: '2024-02-05T09:00:00Z',
};

/**
 * Enzyme Mechanisms Module
 */
export const MODULE_ENZYME_MECHANISMS: LearningModule = {
  id: 'module-enzyme-mechanisms-001',
  creatorId: EDUCATOR_USER.id,
  title: 'Enzyme Catalysis and Mechanisms',
  description: 'Explore how enzymes work using lysozyme as a model system. Learn about active sites, substrate binding, and catalytic mechanisms.',
  contentType: 'guide',
  contentData: {
    type: 'guide',
    sections: [
      {
        id: 'section-1',
        title: 'Introduction to Enzymes',
        content: `# What are Enzymes?

Enzymes are biological catalysts that accelerate chemical reactions without being consumed.

## Key Properties
- **Specificity**: Each enzyme acts on specific substrates
- **Efficiency**: Can increase reaction rates by 10⁶ to 10¹² times
- **Regulation**: Activity can be controlled by various mechanisms`,
        order: 1,
      },
      {
        id: 'section-2',
        title: 'The Active Site',
        content: `# The Active Site

The active site is a specialized region where substrate binding and catalysis occur.

## Characteristics
- Usually a cleft or pocket
- Contains specific amino acids for binding and catalysis
- Shape is complementary to substrate (induced fit)

## Lysozyme Active Site
In lysozyme (1LYZ), key residues include:
- **Glu35**: Acts as proton donor
- **Asp52**: Stabilizes transition state`,
        structureId: '1LYZ',
        order: 2,
      },
      {
        id: 'section-3',
        title: 'Catalytic Mechanisms',
        content: `# How Enzymes Catalyze Reactions

## Lysozyme Mechanism
1. Substrate (peptidoglycan) binds in cleft
2. Glu35 donates proton (acid catalysis)
3. Asp52 stabilizes oxocarbenium intermediate
4. Water attacks to complete hydrolysis

## General Strategies
- **Acid-base catalysis**
- **Covalent catalysis**
- **Metal ion catalysis**
- **Proximity and orientation effects**`,
        structureId: '1LYZ',
        order: 3,
      },
    ],
  } as GuideContent,
  thumbnailUrl: '/thumbnails/enzyme-mech.jpg',
  duration: null,
  relatedStructures: ['1LYZ', '1HEW'],
  difficulty: 3,
  prerequisites: ['module-intro-protein-001'],
  learningObjectives: [
    'Describe the structure of enzyme active sites',
    'Explain different catalytic mechanisms',
    'Understand the lysozyme mechanism in detail',
  ],
  tags: ['enzyme', 'catalysis', 'lysozyme', 'intermediate'],
  visibility: 'public',
  isPublished: true,
  viewCount: 7234,
  completionCount: 3876,
  avgRating: 4.6,
  ratingCount: 654,
  createdAt: '2024-03-01T09:00:00Z',
  updatedAt: '2024-07-20T14:00:00Z',
  publishedAt: '2024-03-10T10:00:00Z',
};

/**
 * All mock modules
 */
export const MOCK_MODULES: LearningModule[] = [
  MODULE_INTRO_PROTEIN,
  MODULE_HEMOGLOBIN_GUIDE,
  MODULE_VISUALIZATION_TUTORIAL,
  MODULE_PROTEIN_QUIZ,
  MODULE_ENZYME_MECHANISMS,
];

/**
 * Structural Biology Fundamentals Pathway
 */
export const PATHWAY_FUNDAMENTALS: LearningPathway = {
  id: 'pathway-fundamentals-001',
  creatorId: EDUCATOR_USER.id,
  title: 'Structural Biology Fundamentals',
  description: 'A comprehensive learning path covering the basics of protein structure, visualization, and analysis. Perfect for newcomers to structural biology.',
  thumbnailUrl: '/thumbnails/fundamentals-pathway.jpg',
  contentSequence: [
    MODULE_VISUALIZATION_TUTORIAL.id,
    MODULE_INTRO_PROTEIN.id,
    MODULE_PROTEIN_QUIZ.id,
    MODULE_HEMOGLOBIN_GUIDE.id,
    MODULE_ENZYME_MECHANISMS.id,
  ],
  estimatedDuration: 180, // 3 hours total
  difficulty: 2,
  tags: ['fundamentals', 'beginner', 'protein', 'comprehensive'],
  visibility: 'public',
  isPublished: true,
  enrollmentCount: 3456,
  completionCount: 1234,
  avgRating: 4.8,
  createdAt: '2024-01-20T10:00:00Z',
  updatedAt: '2024-08-01T09:00:00Z',
};

/**
 * All mock pathways
 */
export const MOCK_PATHWAYS: LearningPathway[] = [
  PATHWAY_FUNDAMENTALS,
];

/**
 * Mock user progress for demo user
 */
export const MOCK_USER_PROGRESS: UserProgress[] = [
  {
    userId: DEMO_USER.id,
    contentId: MODULE_VISUALIZATION_TUTORIAL.id,
    completed: true,
    progressPercent: 100,
    timeSpent: 840,
    notes: 'Great tutorial, learned a lot about navigation!',
    bookmarks: [
      { timestamp: 3, note: 'Important: rotation controls', createdAt: '2024-10-15T14:00:00Z' },
    ],
    quizScores: null,
    startedAt: '2024-10-15T13:00:00Z',
    completedAt: '2024-10-15T14:20:00Z',
    lastAccessed: '2024-10-20T10:00:00Z',
  },
  {
    userId: DEMO_USER.id,
    contentId: MODULE_INTRO_PROTEIN.id,
    completed: true,
    progressPercent: 100,
    timeSpent: 1320,
    notes: null,
    bookmarks: [
      { timestamp: 560, note: 'Alpha helix example', createdAt: '2024-10-16T11:30:00Z' },
      { timestamp: 960, note: 'Quaternary structure section', createdAt: '2024-10-16T12:00:00Z' },
    ],
    quizScores: null,
    startedAt: '2024-10-16T10:00:00Z',
    completedAt: '2024-10-16T12:30:00Z',
    lastAccessed: '2024-10-18T15:00:00Z',
  },
  {
    userId: DEMO_USER.id,
    contentId: MODULE_PROTEIN_QUIZ.id,
    completed: true,
    progressPercent: 100,
    timeSpent: 720,
    notes: null,
    bookmarks: null,
    quizScores: [
      {
        attemptId: 'attempt-001',
        score: 85,
        answers: {
          q1: 'Primary structure',
          q2: 'True',
          q3: 'Hydrogen bonds',
          q4: 'Oxygen transport',
          q5: 'Glycine', // Wrong
          q6: 'tertiary structure',
          q7: 'True',
          q8: '4',
        },
        completedAt: '2024-10-17T15:30:00Z',
        timeSpent: 720,
      },
    ],
    startedAt: '2024-10-17T14:30:00Z',
    completedAt: '2024-10-17T15:30:00Z',
    lastAccessed: '2024-10-17T15:30:00Z',
  },
  {
    userId: DEMO_USER.id,
    contentId: MODULE_HEMOGLOBIN_GUIDE.id,
    completed: false,
    progressPercent: 60,
    timeSpent: 1200,
    notes: 'Need to review cooperative binding section',
    bookmarks: [
      { timestamp: 2, note: 'Heme group details', createdAt: '2024-10-20T11:00:00Z' },
    ],
    quizScores: null,
    startedAt: '2024-10-20T10:00:00Z',
    completedAt: null,
    lastAccessed: '2024-10-20T12:00:00Z',
  },
];

/**
 * Get module by ID
 */
export function getMockModuleById(moduleId: string): LearningModule | null {
  return MOCK_MODULES.find((m) => m.id === moduleId) || null;
}

/**
 * Get pathway by ID
 */
export function getMockPathwayById(pathwayId: string): LearningPathway | null {
  return MOCK_PATHWAYS.find((p) => p.id === pathwayId) || null;
}

/**
 * Get user progress for a module
 */
export function getMockUserProgress(userId: string, contentId: string): UserProgress | null {
  return MOCK_USER_PROGRESS.find(
    (p) => p.userId === userId && p.contentId === contentId
  ) || null;
}

/**
 * Get all progress for a user
 */
export function getMockUserAllProgress(userId: string): UserProgress[] {
  return MOCK_USER_PROGRESS.filter((p) => p.userId === userId);
}

/**
 * Search modules
 */
export function searchMockModules(query: string): LearningModule[] {
  const lowerQuery = query.toLowerCase();
  return MOCK_MODULES.filter(
    (m) =>
      m.title.toLowerCase().includes(lowerQuery) ||
      m.description?.toLowerCase().includes(lowerQuery) ||
      m.tags.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get modules by difficulty
 */
export function getMockModulesByDifficulty(difficulty: 1 | 2 | 3 | 4 | 5): LearningModule[] {
  return MOCK_MODULES.filter((m) => m.difficulty === difficulty);
}

/**
 * Get recommended modules based on progress
 */
export function getRecommendedModules(userId: string): LearningModule[] {
  const progress = getMockUserAllProgress(userId);
  const completedIds = progress.filter((p) => p.completed).map((p) => p.contentId);

  // Return modules that haven't been completed
  return MOCK_MODULES.filter((m) => !completedIds.includes(m.id)).slice(0, 3);
}
