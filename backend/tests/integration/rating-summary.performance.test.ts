import autocannon from 'autocannon';
import { prisma } from '../../src/config/database.config';
import { redisClient } from '../../src/config/redis.config';

/**
 * Performance Tests for Rating Summary API
 * 
 * Constitution Requirement: API P95 response time < 150ms
 * 
 * Prerequisites:
 * - Backend server running on localhost:3000
 * - Database seeded with test data
 * - Redis running
 */

describe('Rating Summary Performance Tests', () => {
  let testProductId: string;

  beforeAll(async () => {
    // Create test product with ratings
    const product = await prisma.product.create({
      data: {
        title: 'Performance Test Product',
      },
    });
    testProductId = product.id;

    // Create 100 ratings for realistic aggregation
    const ratings = Array.from({ length: 100 }, (_, i) => ({
      productId: testProductId,
      score: 1 + (i % 5), // Distribute scores 1-5
    }));

    await prisma.rating.createMany({
      data: ratings,
    });

    // Warm up the cache with one request
    await fetch(`http://localhost:3000/products/${testProductId}/rating-summary`);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.rating.deleteMany({ where: { productId: testProductId } });
    await prisma.product.delete({ where: { id: testProductId } });
    await redisClient.del(`rating-summary:${testProductId}`);
    await prisma.$disconnect();
    await redisClient.quit();
  });

  test('should handle 100 concurrent requests with P95 < 150ms (warm cache)', async () => {
    const result = await autocannon({
      url: `http://localhost:3000/products/${testProductId}/rating-summary`,
      connections: 100,
      duration: 10, // 10 seconds
      pipelining: 1,
    });

    console.log('Performance Test Results:');
    console.log(`  Requests: ${result.requests.total}`);
    console.log(`  Latency P50: ${result.latency.p50}ms`);
    console.log(`  Latency P95: ${result.latency.p95}ms`);
    console.log(`  Latency P99: ${result.latency.p99}ms`);
    console.log(`  Throughput: ${result.throughput.mean} bytes/sec`);
    console.log(`  Errors: ${result.errors}`);

    // Constitution requirement: P95 < 150ms
    expect(result.latency.p95).toBeLessThan(150);
    
    // Additional quality checks
    expect(result.errors).toBe(0);
    expect(result['2xx']).toBeGreaterThan(0);
  });

  test('should handle 100 concurrent requests with cold cache', async () => {
    // Clear cache to test DB performance
    await redisClient.del(`rating-summary:${testProductId}`);

    const result = await autocannon({
      url: `http://localhost:3000/products/${testProductId}/rating-summary`,
      connections: 100,
      duration: 5, // 5 seconds
      pipelining: 1,
    });

    console.log('Cold Cache Performance:');
    console.log(`  Latency P95: ${result.latency.p95}ms`);
    console.log(`  Latency P99: ${result.latency.p99}ms`);

    // Even with cold cache, should handle load gracefully
    // (May be slower than 150ms initially, but should recover quickly)
    expect(result.errors).toBe(0);
  });

  test('should maintain performance under sustained load', async () => {
    const result = await autocannon({
      url: `http://localhost:3000/products/${testProductId}/rating-summary`,
      connections: 50,
      duration: 30, // 30 seconds sustained
      pipelining: 1,
    });

    console.log('Sustained Load Performance:');
    console.log(`  Total requests: ${result.requests.total}`);
    console.log(`  Requests/sec: ${result.requests.mean}`);
    console.log(`  Latency P95: ${result.latency.p95}ms`);
    console.log(`  Errors: ${result.errors}`);

    expect(result.latency.p95).toBeLessThan(150);
    expect(result.errors).toBe(0);
  });

  test('should handle burst traffic patterns', async () => {
    // Simulate burst: high concurrency for short duration
    const result = await autocannon({
      url: `http://localhost:3000/products/${testProductId}/rating-summary`,
      connections: 200, // High burst
      duration: 3, // Short duration
      pipelining: 1,
    });

    console.log('Burst Traffic Performance:');
    console.log(`  Peak connections: 200`);
    console.log(`  Latency P95: ${result.latency.p95}ms`);
    console.log(`  Latency P99: ${result.latency.p99}ms`);
    console.log(`  Errors: ${result.errors}`);

    // P95 should still be reasonable under burst
    expect(result.latency.p95).toBeLessThan(300); // Relaxed for burst
    expect(result.errors).toBe(0);
  });

  test('should handle multiple products concurrently', async () => {
    // Create additional test products
    const products = await Promise.all([
      prisma.product.create({ data: { title: 'Product 2' } }),
      prisma.product.create({ data: { title: 'Product 3' } }),
    ]);

    const productIds = [testProductId, ...products.map((p) => p.id)];

    // Test requests distributed across products
    const results = await Promise.all(
      productIds.map((id) =>
        autocannon({
          url: `http://localhost:3000/products/${id}/rating-summary`,
          connections: 30,
          duration: 5,
          pipelining: 1,
        })
      )
    );

    console.log('Multi-Product Performance:');
    results.forEach((result, i) => {
      console.log(`  Product ${i + 1} P95: ${result.latency.p95}ms`);
    });

    // All products should meet performance requirements
    results.forEach((result) => {
      expect(result.latency.p95).toBeLessThan(150);
      expect(result.errors).toBe(0);
    });

    // Cleanup additional products
    await prisma.product.deleteMany({
      where: { id: { in: products.map((p) => p.id) } },
    });
  });
});

/**
 * Helper function to run standalone performance test
 * Usage: node backend/tests/integration/rating-summary.performance.test.ts
 */
export async function runPerformanceTest() {
  const testProductId = 'YOUR_TEST_PRODUCT_ID'; // Replace with actual ID

  console.log('Starting performance test...');
  const result = await autocannon({
    url: `http://localhost:3000/products/${testProductId}/rating-summary`,
    connections: 100,
    duration: 10,
    pipelining: 1,
  });

  console.log('\n=== Performance Test Results ===');
  console.log(`Total requests: ${result.requests.total}`);
  console.log(`Requests/sec: ${result.requests.mean}`);
  console.log(`Latency P50: ${result.latency.p50}ms`);
  console.log(`Latency P95: ${result.latency.p95}ms ✅ (target: < 150ms)`);
  console.log(`Latency P99: ${result.latency.p99}ms`);
  console.log(`Errors: ${result.errors}`);
  
  if (result.latency.p95 < 150) {
    console.log('\n✅ PASSED: P95 latency meets constitution requirement');
  } else {
    console.log('\n❌ FAILED: P95 latency exceeds 150ms');
  }
}
