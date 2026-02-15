import { RatingSummaryService } from '../../src/services/rating-summary.service';
import { prisma } from '../../src/config/database.config';
import { cacheService } from '../../src/services/cache.service';

// Mock dependencies
jest.mock('../../src/config/database.config', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
    },
    rating: {
      aggregate: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/cache.service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

describe('RatingSummaryService', () => {
  let service: RatingSummaryService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;
  const mockCache = cacheService as jest.Mocked<typeof cacheService>;
  const testProductId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    service = new RatingSummaryService();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getRatingSummary', () => {
    it('should return cached data when cache hit', async () => {
      const cachedData = { average: 4.3, count: 127 };
      mockCache.get.mockResolvedValue(cachedData);

      const result = await service.getRatingSummary(testProductId);

      expect(result).toEqual(cachedData);
      expect(mockCache.get).toHaveBeenCalledWith(`rating-summary:${testProductId}`);
      expect(mockPrisma.product.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.rating.aggregate).not.toHaveBeenCalled();
    });

    it('should query database and cache result on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue({
        id: testProductId,
        title: 'Test Product',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.rating.aggregate.mockResolvedValue({
        _avg: { score: 4.32 },
        _count: { score: 127 },
      });

      const result = await service.getRatingSummary(testProductId);

      expect(result).toEqual({ average: 4.3, count: 127 });
      expect(mockPrisma.rating.aggregate).toHaveBeenCalledWith({
        where: { productId: testProductId },
        _avg: { score: true },
        _count: { score: true },
      });
      expect(mockCache.set).toHaveBeenCalledWith(
        `rating-summary:${testProductId}`,
        { average: 4.3, count: 127 },
        60
      );
    });

    it('should return average 0 and count 0 when no ratings exist', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue({
        id: testProductId,
        title: 'Test Product',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.rating.aggregate.mockResolvedValue({
        _avg: { score: null },
        _count: { score: 0 },
      });

      const result = await service.getRatingSummary(testProductId);

      expect(result).toEqual({ average: 0.0, count: 0 });
      expect(mockCache.set).toHaveBeenCalledWith(
        `rating-summary:${testProductId}`,
        { average: 0.0, count: 0 },
        60
      );
    });

    it('should throw error when product not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getRatingSummary(testProductId)).rejects.toThrow(
        'Product not found'
      );
      expect(mockPrisma.rating.aggregate).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should round average to one decimal place', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue({
        id: testProductId,
        title: 'Test Product',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.rating.aggregate.mockResolvedValue({
        _avg: { score: 4.67843 },
        _count: { score: 50 },
      });

      const result = await service.getRatingSummary(testProductId);

      expect(result.average).toBe(4.7); // Rounded to 1 decimal
      expect(result.count).toBe(50);
    });

    it('should handle database errors gracefully', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(service.getRatingSummary(testProductId)).rejects.toThrow(
        'Database connection error'
      );
    });
  });

  describe('invalidateCache', () => {
    it('should delete cache key for product', async () => {
      await service.invalidateCache(testProductId);

      expect(mockCache.del).toHaveBeenCalledWith(`rating-summary:${testProductId}`);
    });
  });
});
