import { redis } from '../config/redis.config';

export class CacheService {
  // ===== MONITORING PLACEHOLDERS =====
  // Track cache hit/miss for observability
  private cacheHits = 0;
  private cacheMisses = 0;
  
  /**
   * Get cache hit rate percentage
   * TODO: Export to monitoring service (Datadog, Prometheus, etc.)
   */
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) return 0;
    return (this.cacheHits / total) * 100;
  }

  /**
   * Get cache statistics
   * TODO: Send to APM dashboard
   */
  getStats() {
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: this.getCacheHitRate().toFixed(2) + '%',
    };
  }

  /**
   * Reset cache statistics (useful for testing)
   */
  resetStats() {
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Parsed value or null if not found/error
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) {
        this.cacheMisses++;
        // TODO: Send metric to monitoring service
        // Example: datadogMetrics.increment('cache.miss', 1, { key_prefix: key.split(':')[0] });
        return null;
      }
      this.cacheHits++;
      // TODO: Send metric to monitoring service
      // Example: datadogMetrics.increment('cache.hit', 1, { key_prefix: key.split(':')[0] });
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key "${key}":`, error);
      // TODO: Send error to monitoring service
      return null; // Fail gracefully
    }
  }

  /**
   * Set value in cache with TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON stringified)
   * @param ttlSeconds Time to live in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.error(`Cache set error for key "${key}":`, error);
      // Fail silently - caching is not critical for functionality
    }
  }

  /**
   * Delete value from cache
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key "${key}":`, error);
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param pattern Key pattern (e.g., "rating-summary:*")
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for pattern "${pattern}":`, error);
    }
  }

  /**
   * Check if cache is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
