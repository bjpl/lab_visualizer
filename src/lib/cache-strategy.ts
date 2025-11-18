/**
 * Cache Strategy Engine
 *
 * Intelligent strategy for determining which structures to pre-cache
 * based on popularity, recency, and relevance scoring.
 */

export interface StructureScore {
  pdbId: string;
  score: number;
  popularity: number;
  recency: number;
  relevance: number;
  estimatedSize: number;
}

export interface CacheStrategyConfig {
  maxSize: number; // bytes
  popularWeight: number;
  recencyWeight: number;
  relevanceWeight: number;
  minScore: number;
}

export interface StructureMetadata {
  pdbId: string;
  family?: string;
  complex?: string;
  size: number;
  popularity: number;
  lastAccessed?: number;
}

export interface CacheStats {
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  avgLoadTime: number;
}

const DEFAULT_CONFIG: CacheStrategyConfig = {
  maxSize: 500 * 1024 * 1024, // 500MB
  popularWeight: 0.5,
  recencyWeight: 0.3,
  relevanceWeight: 0.2,
  minScore: 0.3,
};

// Top educational structures (most accessed in educational contexts)
const TOP_EDUCATIONAL_STRUCTURES = [
  '1HHO', // Hemoglobin
  '2DHB', // Deoxyhemoglobin
  '1MBO', // Myoglobin
  '2LYZ', // Lysozyme
  '4HHB', // Hemoglobin (different form)
  '1CRN', // Crambin
  '1UBQ', // Ubiquitin
  '1GFL', // Green Fluorescent Protein
  '1BNA', // DNA double helix
  '1TIM', // Triose phosphate isomerase
  '1AKE', // Adenylate kinase
  '7API', // Alcohol dehydrogenase
  '1A2Y', // Ribonuclease A
  '1PTQ', // Beta-lactamase
  '1J8H', // ATP synthase
  '1IGT', // Immunoglobulin
  '1HEL', // Hen egg-white lysozyme
  '1BM8', // Potassium channel
  '1EMA', // Enolase
  '1F88', // Rubisco
];

export class CacheStrategyEngine {
  private config: CacheStrategyConfig;
  private recentHistory: string[] = [];
  private popularityMap = new Map<string, number>();
  private familyMap = new Map<string, string[]>();
  private complexMap = new Map<string, string[]>();
  private stats: CacheStats = {
    hitRate: 0,
    totalRequests: 0,
    cacheHits: 0,
    avgLoadTime: 0,
  };

  constructor(config: Partial<CacheStrategyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializePopularityMap();
  }

  private initializePopularityMap(): void {
    // Initialize with educational structures having high popularity
    TOP_EDUCATIONAL_STRUCTURES.forEach((pdbId, index) => {
      // Decreasing popularity score (most popular first)
      this.popularityMap.set(pdbId, 1.0 - (index / TOP_EDUCATIONAL_STRUCTURES.length) * 0.5);
    });
  }

  /**
   * Update recent access history
   */
  updateHistory(pdbId: string): void {
    // Remove if already exists
    this.recentHistory = this.recentHistory.filter(id => id !== pdbId);
    // Add to front
    this.recentHistory.unshift(pdbId);
    // Keep only last 10
    if (this.recentHistory.length > 10) {
      this.recentHistory.pop();
    }
  }

  /**
   * Update popularity score for a structure
   */
  updatePopularity(pdbId: string, increment = 0.1): void {
    const current = this.popularityMap.get(pdbId) || 0;
    this.popularityMap.set(pdbId, Math.min(1.0, current + increment));
  }

  /**
   * Register structure family relationships
   */
  registerFamily(family: string, structures: string[]): void {
    this.familyMap.set(family, structures);
    structures.forEach(pdbId => {
      if (!this.familyMap.has(pdbId)) {
        this.familyMap.set(pdbId, [family]);
      }
    });
  }

  /**
   * Register complex relationships
   */
  registerComplex(complex: string, structures: string[]): void {
    this.complexMap.set(complex, structures);
    structures.forEach(pdbId => {
      if (!this.complexMap.has(pdbId)) {
        this.complexMap.set(pdbId, [complex]);
      }
    });
  }

  /**
   * Calculate relevance score based on relationships
   */
  private calculateRelevance(pdbId: string, recentStructures: string[]): number {
    if (recentStructures.length === 0) return 0;

    let relevanceScore = 0;
    let relationships = 0;

    recentStructures.forEach(recentId => {
      // Check family relationship
      const families = this.familyMap.get(recentId) || [];
      if (families.some(family =>
        this.familyMap.get(family)?.includes(pdbId)
      )) {
        relevanceScore += 0.5;
        relationships++;
      }

      // Check complex relationship
      const complexes = this.complexMap.get(recentId) || [];
      if (complexes.some(complex =>
        this.complexMap.get(complex)?.includes(pdbId)
      )) {
        relevanceScore += 0.5;
        relationships++;
      }
    });

    return relationships > 0 ? relevanceScore / relationships : 0;
  }

  /**
   * Calculate recency score (exponential decay)
   */
  private calculateRecency(pdbId: string): number {
    const index = this.recentHistory.indexOf(pdbId);
    if (index === -1) return 0;

    // Exponential decay: most recent gets 1.0, older items decay
    return Math.exp(-index / 3);
  }

  /**
   * Calculate composite score for a structure
   */
  calculateScore(pdbId: string): number {
    const popularity = this.popularityMap.get(pdbId) || 0;
    const recency = this.calculateRecency(pdbId);
    const relevance = this.calculateRelevance(
      pdbId,
      this.recentHistory.slice(0, 5)
    );

    const score =
      popularity * this.config.popularWeight +
      recency * this.config.recencyWeight +
      relevance * this.config.relevanceWeight;

    return score;
  }

  /**
   * Get structures to pre-cache, prioritized and budget-limited
   */
  getStructuresToCache(
    availableStructures: StructureMetadata[]
  ): StructureScore[] {
    // Calculate scores for all structures
    const scored: StructureScore[] = availableStructures.map(struct => {
      const popularity = this.popularityMap.get(struct.pdbId) || 0;
      const recency = this.calculateRecency(struct.pdbId);
      const relevance = this.calculateRelevance(
        struct.pdbId,
        this.recentHistory.slice(0, 5)
      );

      const score =
        popularity * this.config.popularWeight +
        recency * this.config.recencyWeight +
        relevance * this.config.relevanceWeight;

      return {
        pdbId: struct.pdbId,
        score,
        popularity,
        recency,
        relevance,
        estimatedSize: struct.size,
      };
    });

    // Filter by minimum score and sort by score descending
    const candidates = scored
      .filter(s => s.score >= this.config.minScore)
      .sort((a, b) => b.score - a.score);

    // Apply budget constraint using knapsack approach
    const selected: StructureScore[] = [];
    let totalSize = 0;

    for (const candidate of candidates) {
      if (totalSize + candidate.estimatedSize <= this.config.maxSize) {
        selected.push(candidate);
        totalSize += candidate.estimatedSize;
      }

      // Stop if we have enough high-priority items
      if (selected.length >= 30) break;
    }

    return selected;
  }

  /**
   * Get top educational structures for initial warming
   */
  getTopEducationalStructures(count = 20): string[] {
    return TOP_EDUCATIONAL_STRUCTURES.slice(0, count);
  }

  /**
   * Update cache statistics
   */
  updateStats(stats: Partial<CacheStats>): void {
    this.stats = { ...this.stats, ...stats };

    // Recalculate hit rate
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = this.stats.cacheHits / this.stats.totalRequests;
    }
  }

  /**
   * Get current cache health metrics
   */
  getHealthMetrics(): {
    hitRate: number;
    effectiveness: 'poor' | 'good' | 'excellent';
    recommendations: string[];
  } {
    const hitRate = this.stats.hitRate;
    const recommendations: string[] = [];

    let effectiveness: 'poor' | 'good' | 'excellent';
    if (hitRate < 0.3) {
      effectiveness = 'poor';
      recommendations.push('Increase popular structure weight');
      recommendations.push('Enable more aggressive prefetching');
    } else if (hitRate < 0.5) {
      effectiveness = 'good';
      recommendations.push('Monitor user patterns for optimization');
    } else {
      effectiveness = 'excellent';
      recommendations.push('Current strategy is performing well');
    }

    if (this.stats.avgLoadTime > 1000) {
      recommendations.push('Consider increasing cache size budget');
    }

    return {
      hitRate,
      effectiveness,
      recommendations,
    };
  }

  /**
   * Adjust strategy weights based on performance
   */
  adaptStrategy(hitRateTarget = 0.5): void {
    const currentHitRate = this.stats.hitRate;

    if (currentHitRate < hitRateTarget) {
      // Increase popularity weight if underperforming
      this.config.popularWeight = Math.min(0.7, this.config.popularWeight + 0.1);
      this.config.recencyWeight = Math.max(0.2, this.config.recencyWeight - 0.05);
    } else if (currentHitRate > hitRateTarget + 0.1) {
      // Increase recency weight if over-performing (optimize for user behavior)
      this.config.recencyWeight = Math.min(0.4, this.config.recencyWeight + 0.05);
      this.config.popularWeight = Math.max(0.4, this.config.popularWeight - 0.05);
    }

    // Normalize weights
    const total = this.config.popularWeight + this.config.recencyWeight + this.config.relevanceWeight;
    this.config.popularWeight /= total;
    this.config.recencyWeight /= total;
    this.config.relevanceWeight /= total;
  }

  /**
   * Export current strategy configuration
   */
  exportConfig(): CacheStrategyConfig {
    return { ...this.config };
  }

  /**
   * Get current statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
}

export default CacheStrategyEngine;
