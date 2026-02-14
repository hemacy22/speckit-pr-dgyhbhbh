# Quick Start: Product Rating Summary Display

**Feature**: Product Rating Summary Display  
**Branch**: `001-rating-summary`  
**Date**: 2026-02-14  
**Purpose**: Developer onboarding and implementation guide

## Overview

This feature adds product rating summary display (average rating + review count) to product pages. Implementation involves:

- **Backend**: REST API endpoint for rating aggregation with Redis caching
- **Frontend**: React component with WCAG 2.2 AA accessibility
- **Performance**: < 150ms p95 response time (per constitution)

## Prerequisites

### Development Environment

**Required**:
- Node.js 18 LTS or higher
- npm 9+ or yarn 1.22+
- PostgreSQL 14+ (running locally or accessible)
- Redis 6+ (running locally or accessible)
- Git

**IDE Recommendations**:
- VS Code with extensions: ESLint, Prettier, TypeScript, REST Client
- WebStorm with built-in TypeScript and Node.js support

### Repository Setup

```bash
# Clone and switch to feature branch
git clone <repository-url>
cd <repository-name>
git checkout 001-rating-summary

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Database Setup

```sql
-- Verify ratings table exists with required structure
-- (This table should already exist; if not, create it)

CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0.0 AND rating <= 5.0),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create performance-critical index
CREATE INDEX IF NOT EXISTS idx_ratings_product_id ON ratings(product_id);

-- Optional: Add sample data for testing
INSERT INTO ratings (product_id, rating, user_id) VALUES
  (1, 4.5, 101),
  (1, 5.0, 102),
  (1, 4.0, 103),
  (2, 3.5, 104);
```

### Environment Configuration

**Backend** (`backend/.env`):
```bash
# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password

# Redis cache
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_CACHE_TTL=60

# API configuration
PORT=3000
NODE_ENV=development
API_PREFIX=/v1

# Performance monitoring
ENABLE_RESPONSE_TIME_HEADER=true
LOG_SLOW_QUERIES=true
SLOW_QUERY_THRESHOLD_MS=50
```

**Frontend** (`frontend/.env`):
```bash
# API endpoint
REACT_APP_API_BASE_URL=http://localhost:3000/v1
REACT_APP_ENABLE_MOCK_API=false
```

## Implementation Guide

### Step 1: Backend API Implementation

**File**: `backend/src/api/routes/products.ts` (or `.js`)

Implementation order:
1. Add route handler for `GET /products/:id/rating-summary`
2. Implement service layer: `backend/src/services/rating-service.ts`
3. Implement cache layer: `backend/src/cache/redis-client.ts`
4. Add input validation: `backend/src/utils/validators.ts`

**Quick Command**:
```bash
cd backend
npm run dev  # Start development server with hot reload
```

**Test Endpoint**:
```bash
# Test with curl
curl http://localhost:3000/v1/products/1/rating-summary

# Expected response:
# {"average": 4.5, "count": 234}
```

### Step 2: Backend Testing

Implementation order:
1. Unit tests: `backend/tests/unit/rating-service.test.ts`
2. Contract tests: `backend/tests/contract/rating-summary-api.test.ts`
3. Integration tests: `backend/tests/integration/rating-summary.test.ts`

**Quick Command**:
```bash
cd backend
npm test                    # Run all tests
npm test -- --watch        # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

**Coverage Requirements** (per constitution):
- Line coverage: >80%
- Branch coverage: >75%
- Function coverage: >90%

### Step 3: OpenAPI Contract Validation

**Quick Command**:
```bash
# Install Spectral (one-time)
npm install -g @stoplight/spectral-cli

# Validate OpenAPI contract
spectral lint specs/001-rating-summary/contracts/rating-summary-api.yaml

# Expected output: No errors or warnings
```

### Step 4: Frontend Component Implementation

**File**: `frontend/src/components/RatingSummary/RatingSummary.tsx` (or `.jsx`)

Implementation order:
1. Create RatingSummary component with props interface
2. Implement API client: `frontend/src/services/rating-api.ts`
3. Add styles: `frontend/src/components/RatingSummary/RatingSummary.module.css`
4. Integrate into ProductPage: `frontend/src/components/ProductPage/ProductPage.tsx`

**Quick Command**:
```bash
cd frontend
npm start  # Start development server (usually port 3001)
```

**Manual Testing**:
1. Navigate to `http://localhost:3001/products/1`
2. Verify rating summary displays near product title
3. Check with browser dev tools: Network tab (verify API call), Console (no errors)

### Step 5: Frontend Testing

Implementation order:
1. Component unit tests: `frontend/tests/unit/RatingSummary.test.tsx`
2. API client tests: `frontend/tests/unit/rating-api.test.ts`
3. Accessibility tests: `frontend/tests/accessibility/RatingSummary.a11y.test.tsx`

**Quick Command**:
```bash
cd frontend
npm test                    # Run all tests
npm test -- --watch        # Run tests in watch mode
npm run test:a11y          # Run accessibility tests specifically
```

**Accessibility Validation**:
```bash
# Automated axe checks (in test suite)
npm test -- RatingSummary.a11y.test

# Manual validation (browser extensions)
# - Install axe DevTools browser extension
# - Navigate to product page
# - Run axe scan: Should pass WCAG 2.2 AA with 0 violations
```

### Step 6: Integration Testing

**End-to-End Flow**:
```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start frontend (in new terminal)
cd frontend && npm start

# 3. Navigate to product page
open http://localhost:3001/products/1

# 4. Verify:
# - Rating summary displays (average + count)
# - Screen reader announces rating correctly
# - Keyboard navigation works
# - No console errors
# - Network tab shows < 150ms response time
```

## Architecture Overview

### Backend Data Flow

```
Client Request
    ↓
Express Route Handler (/products/:id/rating-summary)
    ↓
Input Validation (product ID format)
    ↓
Rating Service (business logic)
    ↓
Check Redis Cache (rating:summary:{id})
    ├─ Cache HIT → Return cached data
    └─ Cache MISS → Query PostgreSQL
                   ↓
           Database Query (AVG, COUNT)
                   ↓
           Store in Redis (60s TTL)
                   ↓
           Return computed data
    ↓
Response to Client (JSON)
```

### Frontend Data Flow

```
ProductPage Component Mount
    ↓
Fetch Rating Summary (useEffect)
    ↓
API Client (rating-api.fetchRatingSummary)
    ↓
HTTP GET /products/{id}/rating-summary
    ↓
Success → Pass {average, count} to RatingSummary
Error → Display fallback / hide section
    ↓
RatingSummary Component Render
    ├─ Display average rating (0.0-5.0)
    ├─ Display review count
    ├─ Add ARIA labels
    └─ Handle zero-rating state ("No ratings yet")
```

## Key Implementation Details

### Backend: Rating Service

**Cache-Aside Pattern**:
```typescript
async function getRatingSummary(productId: number): Promise<RatingSummary> {
  // 1. Check cache
  const cached = await redis.get(`rating:summary:${productId}`);
  if (cached) return JSON.parse(cached);
  
  // 2. Query database
  const result = await db.query(`
    SELECT 
      COALESCE(AVG(rating), 0) as average,
      COUNT(*) as count
    FROM ratings
    WHERE product_id = $1
  `, [productId]);
  
  const summary = {
    average: parseFloat(result.rows[0].average.toFixed(1)),
    count: parseInt(result.rows[0].count)
  };
  
  // 3. Store in cache
  await redis.setex(`rating:summary:${productId}`, 60, JSON.stringify(summary));
  
  return summary;
}
```

### Frontend: RatingSummary Component

**Accessible Implementation**:
```tsx
interface RatingSummaryProps {
  average: number;
  count: number;
}

function RatingSummary({ average, count }: RatingSummaryProps) {
  if (count === 0) {
    return <p className="no-ratings">No ratings yet</p>;
  }
  
  return (
    <div 
      className="rating-summary" 
      role="group" 
      aria-label="Product rating summary"
    >
      <span className="rating-value" aria-label={`Average rating ${average} out of 5 stars`}>
        {average.toFixed(1)} ★
      </span>
      <span className="rating-count" aria-label={`Based on ${count.toLocaleString()} reviews`}>
        ({count.toLocaleString()} reviews)
      </span>
    </div>
  );
}
```

## Performance Optimization

### Monitoring Performance

**Backend Metrics** (log or monitoring dashboard):
- API response time (p50, p95, p99)
- Cache hit rate (should be >80%)
- Database query time (should be <100ms)
- Redis latency (should be <5ms)

**Quick Performance Test**:
```bash
# Install Apache Bench (if not installed)
# macOS: brew install httpd
# Ubuntu: apt-get install apache2-utils

# Load test (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:3000/v1/products/1/rating-summary

# Check p95 latency in results (should be < 150ms)
```

### Troubleshooting Slow Queries

If performance SLO not met:

1. **Verify index exists**:
```sql
SELECT * FROM pg_indexes WHERE tablename = 'ratings';
-- Should show idx_ratings_product_id
```

2. **Check query plan**:
```sql
EXPLAIN ANALYZE 
SELECT AVG(rating), COUNT(*) 
FROM ratings 
WHERE product_id = 1;
-- Should use Index Scan on idx_ratings_product_id
```

3. **Monitor Redis**:
```bash
redis-cli INFO stats
# Check hit_rate = keyspace_hits / (keyspace_hits + keyspace_misses)
```

## Common Issues & Solutions

### Issue: "Cannot connect to database"

**Solution**:
- Verify PostgreSQL is running: `psql -U your_user -d your_database`
- Check `DATABASE_URL` in `.env` file
- Verify firewall allows connection on port 5432

### Issue: "Redis connection refused"

**Solution**:
- Verify Redis is running: `redis-cli ping` (should return "PONG")
- Check `REDIS_URL` in `.env` file
- Start Redis: `redis-server` or `brew services start redis` (macOS)

### Issue: "Rating summary shows 0 for existing ratings"

**Solution**:
- Verify ratings table has data: `SELECT COUNT(*) FROM ratings;`
- Check product_id matches: `SELECT * FROM ratings WHERE product_id = 1;`
- Clear Redis cache: `redis-cli FLUSHDB` (development only!)

### Issue: "Accessibility tests failing"

**Solution**:
- Run axe DevTools in browser to see specific violations
- Check ARIA labels are present: `aria-label`, `role` attributes
- Verify color contrast meets WCAG 2.2 AA (4.5:1 minimum)
- Ensure keyboard navigation works (test with Tab key)

## Next Steps

After completing implementation:

1. **Code Review**: Open PR against `main` branch (per constitution)
2. **CI Validation**: Ensure all tests pass, coverage thresholds met
3. **Performance Validation**: Verify p95 latency < 150ms in staging
4. **Accessibility Audit**: Run full axe scan, verify WCAG 2.2 AA compliance
5. **Documentation**: Update API documentation with production endpoints

## Resources

- **Specification**: [spec.md](spec.md) - Full feature requirements
- **Implementation Plan**: [plan.md](plan.md) - Technical design
- **Data Model**: [data-model.md](data-model.md) - Entity definitions
- **API Contract**: [contracts/rating-summary-api.yaml](contracts/rating-summary-api.yaml) - OpenAPI spec
- **Research**: [research.md](research.md) - Technology decisions and rationale

## Support

Questions or issues? See:
- Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
- Project README: (root README.md if exists)
- Team communication channel (Slack, Teams, etc.)
