# Data Model: Product Rating Summary Display

**Feature**: Product Rating Summary Display  
**Branch**: `001-rating-summary`  
**Date**: 2026-02-14  
**Purpose**: Define entities, attributes, relationships, and validation rules

## Entities

### Rating (Existing Entity - Assumed)

Represents an individual product rating submitted by a user.

**Attributes**:
- `id`: Unique identifier for the rating (UUID or integer primary key)
- `product_id`: Identifier linking to the product being rated (foreign key)
- `rating`: Numeric rating value (decimal or float)
- `user_id`: Identifier of user who submitted rating (foreign key) [optional for this feature]
- `created_at`: Timestamp when rating was created
- `updated_at`: Timestamp when rating was last modified [optional]

**Validation Rules**:
- `rating` MUST be in range [0.0, 5.0] inclusive
- `rating` MUST NOT be NULL
- `product_id` MUST NOT be NULL
- `product_id` MUST reference valid product
- `created_at` MUST NOT be NULL

**Indexes**:
- Primary index on `id`
- **Performance-critical index**: B-tree index on `product_id` for fast aggregation queries
- Composite index on `(product_id, created_at)` if time-based filtering needed in future

**Relationships**:
- **Many-to-One**: Rating → Product (many ratings belong to one product)
- **Many-to-One**: Rating → User (many ratings belong to one user) [if user tracking enabled]

**Database Schema** (PostgreSQL):
```sql
-- Assumed existing schema (not created by this feature)
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0.0 AND rating <= 5.0),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ratings_product_id ON ratings(product_id);
```

### RatingSummary (Computed Entity - Not Persisted)

Represents aggregated rating statistics for a product. This is a computed value, not stored in database (except temporarily in Redis cache).

**Attributes**:
- `product_id`: Identifier of product being summarized (maps to Rating.product_id)
- `average`: Average rating value across all ratings for this product (range [0.0, 5.0])
- `count`: Total number of ratings for this product (non-negative integer)

**Computation Logic**:
```sql
SELECT 
  COALESCE(AVG(rating), 0) as average,
  COUNT(*) as count
FROM ratings
WHERE product_id = $1;
```

**Validation Rules** (at API boundary):
- `average` MUST be in range [0.0, 5.0] after computation
- `count` MUST be >= 0
- When `count` = 0, `average` MUST be 0.0 (per error handling requirements)
- `product_id` MUST be valid (format depends on product ID scheme)

**State Transitions**:
- **No ratings** → `{ average: 0, count: 0 }` → UI displays "No ratings yet"
- **Ratings exist** → `{ average: X.X, count: N }` → UI displays numerical summary

**Relationships**:
- **One-to-One**: RatingSummary ↔ Product (one summary per product)
- **Derived from Many**: RatingSummary ← Many Ratings (summary aggregates multiple ratings)

### Product (Existing Entity - Out of Scope)

Represents a product in the system. This entity is NOT modified by this feature.

**Relevant Attributes** (for context only):
- `id`: Product identifier (used in rating summary queries)
- `title`: Product name (used as anchor point for rating summary display in UI)

**Note**: Full product schema is outside scope of this feature. We only reference `product_id` for aggregation queries.

## Cache Entity

### RatingSummaryCache (Redis)

Cached version of RatingSummary to optimize performance.

**Cache Key Pattern**: `rating:summary:{product_id}`

**Cached Value Structure** (JSON):
```json
{
  "average": 4.5,
  "count": 234
}
```

**Cache Properties**:
- **TTL**: 60 seconds (per requirements)
- **Eviction Policy**: TTL-based expiration (no manual invalidation in v1)
- **Serialization**: JSON string
- **Key Namespace**: `rating:summary:` prefix prevents collision with other cached data

**Cache Invalidation Strategy**:
- **V1 (Current)**: Time-based expiration only (60s TTL)
- **Future Enhancement**: Event-driven invalidation when new rating submitted (out of scope for this feature)

## Data Flow

### Read Path (API Request)

```
1. Client Request: GET /products/{id}/rating-summary
2. Backend validates product_id format
3. Check cache: Redis GET rating:summary:{product_id}
4a. Cache HIT:
    - Return cached {average, count}
    - Validate data bounds (0.0-5.0, count >= 0)
    - Return to client
4b. Cache MISS:
    - Query PostgreSQL: SELECT AVG(rating), COUNT(*) WHERE product_id = {id}
    - Store in Redis with 60s TTL
    - Validate data bounds
    - Return to client
5. Client receives {average, count}
6. Frontend renders RatingSummary component
```

### Frontend Data Flow

```
1. ProductPage component mounts
2. Call rating-api.fetchRatingSummary(productId)
3. HTTP GET /products/{productId}/rating-summary
4. On success:
   - Pass {average, count} to RatingSummary component as props
   - RatingSummary renders with accessibility markup
5. On error:
   - Display fallback UI or hide rating section gracefully
```

## Validation Rules Summary

### Input Validation (API Layer)

**Product ID Validation**:
- MUST be present in URL path
- MUST match expected format (integer, UUID, or string depending on system)
- Return 400 Bad Request if invalid format
- Return 404 Not Found if product doesn't exist

### Output Validation (Service Layer)

**Rating Summary Data Validation**:
- `average` MUST be in range [0.0, 5.0]
- `count` MUST be >= 0
- If validation fails, log error and return safe fallback: `{ average: 0, count: 0 }`

### Frontend Validation

**Props Validation** (RatingSummary component):
- Validate `average` and `count` are numbers
- Handle edge cases: undefined, null, NaN
- Display error boundary fallback if props invalid

## Performance Considerations

### Database Query Performance

**Index Usage**:
- Query uses `idx_ratings_product_id` index for O(log n) product_id lookup
- Aggregation (AVG, COUNT) performs full scan of matching rows
- Expected performance: <100ms for products with <100k ratings

**Optimization Opportunities** (if needed):
- Materialized views for high-traffic products
- Pre-computed aggregates updated on rating submission
- Read replicas to offload query load

### Cache Performance

**Target Metrics**:
- Cache hit rate: >80% (assumes product pages frequently viewed)
- Cache lookup latency: <5ms (Redis in-memory)
- Cache memory usage: ~200 bytes per cached summary

**Capacity Planning**:
- 1M unique products cached = ~200MB Redis memory
- 60s TTL means cache naturally expires for inactive products

## Edge Cases

### Data Integrity Edge Cases

**No Ratings for Product**:
- SQL: `AVG(rating)` returns NULL when no rows match
- Handling: `COALESCE(AVG(rating), 0)` ensures 0.0 average
- Result: `{ average: 0, count: 0 }`
- UI: Display "No ratings yet" message

**Invalid Rating Values in Database**:
- Scenario: Database constraint violated (rating outside [0.0, 5.0])
- Handling: Validate output data; log error; return safe fallback
- Prevention: Database CHECK constraint enforces valid range

**Extremely Large Review Counts**:
- Scenario: Product with 1M+ reviews
- Handling: Frontend formats number with separators (e.g., "1,234,567 reviews")
- Database: COUNT(*) performs efficiently with index

**Cache Corruption**:
- Scenario: Cached JSON is malformed or invalid
- Handling: Catch parse error; evict bad cache entry; query database; cache fresh data
- Logging: Log cache corruption events for monitoring

### Concurrent Access

**Multiple Simultaneous Cache Misses**:
- Scenario: Cache expires; multiple requests arrive simultaneously
- Impact: "Thundering herd" - all requests query database concurrently
- Mitigation: Accept small burst (amortized over 60s TTL); monitor database load
- Future Enhancement: Request coalescing or cache warming

## Assumptions

- Ratings table exists with schema similar to documented structure
- Product IDs are immutable (no product ID changes that would break cache keys)
- Rating values in database are already validated (CHECK constraint)
- No need to track individual review details (text, reviewer name) for summary display
- No pagination needed (aggregation returns single summary value)
- Read-heavy workload (ratings viewed >> ratings submitted)

## Out of Scope

- Modifying ratings table structure
- Rating submission or update logic
- Individual review display or pagination
- Rating filtering by date, user type, or other criteria
- Real-time rating updates (WebSocket, SSE)
- Historical rating trends or analytics
- Weighted ratings or algorithm adjustments
