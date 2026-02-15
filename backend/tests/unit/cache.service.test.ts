import { redis } from '../../src/config/redis.config';
import { CacheService } from '../../src/services/cache.service';

// Mock Redis
jest.mock('../../src/config/redis.config', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    ping: jest.fn(),
  },
}));

describe('CacheService', () => {
  let cacheService: CacheService;
  const mockRedis = redis as jest.Mocked<typeof redis>;

  beforeEach(() => {
    cacheService = new CacheService();
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      const testData = { average: 4.3, count: 127 };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cacheService.get('test-key');

      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.get('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should return null and log error on Redis error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRedis.get.mockRejectedValue(new Error('Redis connection error'));

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('should set value with TTL', async () => {
      const testData = { average: 4.3, count: 127 };
      const ttl = 60;
      mockRedis.setex.mockResolvedValue('OK');

      await cacheService.set('test-key', testData, ttl);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        ttl,
        JSON.stringify(testData)
      );
    });

    it('should fail silently on Redis error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRedis.setex.mockRejectedValue(new Error('Redis connection error'));

      await expect(
        cacheService.set('test-key', { data: 'test' }, 60)
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      mockRedis.del.mockResolvedValue(1);

      await cacheService.del('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should fail silently on Redis error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRedis.del.mockRejectedValue(new Error('Redis connection error'));

      await expect(cacheService.del('test-key')).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('isAvailable', () => {
    it('should return true when Redis is available', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const result = await cacheService.isAvailable();

      expect(result).toBe(true);
    });

    it('should return false when Redis is unavailable', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection refused'));

      const result = await cacheService.isAvailable();

      expect(result).toBe(false);
    });
  });
});
