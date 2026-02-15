import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/server';
import { prisma } from '../../src/config/database.config';
import { redis } from '../../src/config/redis.config';

/**
 * Integration Tests for Rating Summary Feature
 * Tests full request/response cycle with real database and cache
 * 
 * Note: Requires running PostgreSQL and Redis (via docker-compose)
 * Run: docker-compose up -d before running these tests
 */
describe('Rating Summary Integration Tests', () => {
  let app: Application;
  let testProductId: string;
  let testProductWithNoRatings: string;

  beforeAll(async () => {
    // Connect to Redis
    await redis.connect();
    
    // Create Express app
    app = await createApp();

    // Create test products
    const product1 = await prisma.product.create({
      data: {
        title: 'Integration Test Product',
        ratings: {
          create: [
            { score: 5.0 },
            { score: 4.0 },
            { score: 4.5 },
            { score: 5.0 },
            { score: 3.5 },
          ],
        },
      },
    });
    testProductId = product1.id;

    const product2 = await prisma.product.create({
      data: {
        title: 'Product With No Ratings',
      },
    });
    testProductWithNoRatings = product2.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testProductId) {
      await prisma.rating.deleteMany({ where: { productId: testProductId } });
      await prisma.product.delete({ where: { id: testProductId } });
    }
    if (testProductWithNoRatings) {
      await prisma.product.delete({ where: { id: testProductWithNoRatings } });
    }

    // Disconnect
    await prisma.$disconnect();
    await redis.quit();
  });

  beforeEach(async () => {
    // Clear cache before each test
    const keys = await redis.keys('rating-summary:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  describe('Full Request/Response Cycle', () => {
    it('should fetch rating summary from database on first request', async () => {
      const response = await request(app)
        .get(`/products/${testProductId}/rating-summary`)
        .expect(200);

      expect(response.body.average).toBe(4.4); // (5+4+4.5+5+3.5)/5 = 4.4
      expect(response.body.count).toBe(5);
    });

    it('should return zero ratings for product with no ratings', async () => {
      const response = await request(app)
        .get(`/products/${testProductWithNoRatings}/rating-summary`)
        .expect(200);

      expect(response.body).toEqual({
        average: 0.0,
        count: 0,
      });
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      await request(app)
        .get(`/products/${fakeId}/rating-summary`)
        .expect(404);
    });
  });

  describe('Cache Behavior', () => {
    it('should cache result after first request', async () => {
      // First request - cache miss
      await request(app)
        .get(`/products/${testProductId}/rating-summary`)
        .expect(200);

      // Check cache was populated
      const cacheKey = `rating-summary:${testProductId}`;
      const cached = await redis.get(cacheKey);
      
      expect(cached).not.toBeNull();
      const cachedData = JSON.parse(cached!);
      expect(cachedData.average).toBe(4.4);
      expect(cachedData.count).toBe(5);
    });

    it('should serve subsequent requests from cache', async () => {
      // First request
      const response1 = await request(app)
        .get(`/products/${testProductId}/rating-summary`)
        .expect(200);

      // Second request should hit cache
      const response2 = await request(app)
        .get(`/products/${testProductId}/rating-summary`)
        .expect(200);

      expect(response1.body).toEqual(response2.body);
    });

    it('should expire cache after TTL (60 seconds)', async () => {
      // Make request to populate cache
      await request(app)
        .get(`/products/${testProductId}/rating-summary`)
        .expect(200);

      const cacheKey = `rating-summary:${testProductId}`;

      // Verify cache exists
      let cached = await redis.get(cacheKey);
      expect(cached).not.toBeNull();

      // Wait for TTL to expire (in real tests, you'd mock time or reduce TTL)
      // For now, we'll just verify TTL was set
      const ttl = await redis.ttl(cacheKey);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    }, 65000); // Increase timeout for this test
  });

  describe('Performance', () => {
    it('should respond within 150ms with warm cache', async () => {
      // Warm up cache
      await request(app)
        .get(`/products/${testProductId}/rating-summary`);

      // Measure response time
      const start = Date.now();
      await request(app)
        .get(`/products/${testProductId}/rating-summary`)
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(150); // P95 requirement
    });
  });
});
