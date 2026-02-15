/**
 * Rating Summary response type
 * Represents aggregated rating data for a product
 */
export interface RatingSummary {
  average: number; // 0.0 - 5.0
  count: number;   // Total number of ratings
}

/**
 * Database aggregation result from Prisma
 */
export interface RatingAggregation {
  _avg: {
    score: number | null;
  };
  _count: {
    score: number;
  };
}
