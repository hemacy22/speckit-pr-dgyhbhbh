import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/server';
import { ratingSummaryService } from '../../src/services/rating-summary.service';

// Mock the service layer
jest.mock('../../src/services/rating-summary.service');
jest.mock('../../src/config/redis.config', () => ({
  redis: {
    connect: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
  },
  checkRedisConnection: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../src/config/database.config', () => ({
  prisma: {},
  checkDatabaseConnection: jest.fn().mockResolvedValue(true),
}));

describe('Rating Summary API Contract Tests', () => {
  let app: Application;
  const validProductId = '550e8400-e29b-41d4-a716-446655440000';
  const mockService = ratingSummaryService as jest.Mocked<typeof ratingSummaryService>;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /products/:id/rating-summary', () => {
    it('should return 200 with valid rating summary schema', async () => {
      mockService.getRatingSummary.mockResolvedValue({
        average: 4.3,
        count: 127,
      });

      const response = await request(app)
        .get(`/products/${validProductId}/rating-summary`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Validate OpenAPI schema compliance
      expect(response.body).toHaveProperty('average');
      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.average).toBe('number');
      expect(typeof response.body.count).toBe('number');
      expect(response.body.average).toBeGreaterThanOrEqual(0.0);
      expect(response.body.average).toBeLessThanOrEqual(5.0);
      expect(response.body.count).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(response.body.count)).toBe(true);
    });

    it('should return 200 with zero ratings schema', async () => {
      mockService.getRatingSummary.mockResolvedValue({
        average: 0.0,
        count: 0,
      });

      const response = await request(app)
        .get(`/products/${validProductId}/rating-summary`)
        .expect(200);

      expect(response.body).toEqual({
        average: 0.0,
        count: 0,
      });
    });

    it('should return 400 for invalid product ID format', async () => {
      const response = await request(app)
        .get('/products/invalid-uuid/rating-summary')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toMatch(/invalid/i);
    });

    it('should return 404 when product not found', async () => {
      mockService.getRatingSummary.mockRejectedValue(new Error('Product not found'));

      const response = await request(app)
        .get(`/products/${validProductId}/rating-summary`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toBe('Product not found');
    });

    it('should return 500 for internal server errors', async () => {
      mockService.getRatingSummary.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get(`/products/${validProductId}/rating-summary`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should validate average is rounded to one decimal place', async () => {
      mockService.getRatingSummary.mockResolvedValue({
        average: 4.3,
        count: 100,
      });

      const response = await request(app)
        .get(`/products/${validProductId}/rating-summary`)
        .expect(200);

      // Check that average has at most 1 decimal place
      const decimalPart = response.body.average.toString().split('.')[1];
      expect(!decimalPart || decimalPart.length <= 1).toBe(true);
    });
  });
});
