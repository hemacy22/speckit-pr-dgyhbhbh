import { prisma } from '../config/database.config';
import { cacheService } from './cache.service';
import { RatingSummary, RatingAggregation } from '../types/rating.types';

const CACHE_TTL_SECONDS = 60; // 60 seconds as per requirements
const CACHE_KEY_PREFIX = 'rating-summary:';

export class RatingSummaryService {
  /**
   * Get rating summary for a product
   * Checks cache first, then queries database if cache miss
   * Returns { average: 0, count: 0 } if no ratings exist
   * 
   * @param productId Product UUID
   * @returns Rating summary with average and count
   */
  async getRatingSummary(productId: string): Promise<RatingSummary> {
    const cacheKey = `${CACHE_KEY_PREFIX}${productId}`;

    // Try cache first
    const cached = await cacheService.get<RatingSummary>(cacheKey);
    if (cached !== null) {
      console.log(`Cache hit for product ${productId}`);
      return cached;
    }

    console.log(`Cache miss for product ${productId}, querying database`);

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Query database for aggregation
    const aggregation: RatingAggregation = await prisma.rating.aggregate({
      where: { productId },
      _avg: {
        score: true,
      },
      _count: {
        score: true,
      },
    });

    // Build summary result
    const summary: RatingSummary = {
      average: aggregation._count.score === 0 
        ? 0.0 
        : this.roundToOneDecimal(aggregation._avg.score || 0),
      count: aggregation._count.score,
    };

    // Cache the result
    await cacheService.set(cacheKey, summary, CACHE_TTL_SECONDS);

    return summary;
  }

  /**
   * Invalidate cache for a product
   * Call this when a new rating is added
   * 
   * @param productId Product UUID
   */
  async invalidateCache(productId: string): Promise<void> {
    const cacheKey = `${CACHE_KEY_PREFIX}${productId}`;
    await cacheService.del(cacheKey);
  }

  /**
   * Round number to one decimal place
   * 
   * @param value Number to round
   * @returns Number rounded to 1 decimal
   */
  private roundToOneDecimal(value: number): number {
    return Math.round(value * 10) / 10;
  }
}

// Export singleton instance
export const ratingSummaryService = new RatingSummaryService();
