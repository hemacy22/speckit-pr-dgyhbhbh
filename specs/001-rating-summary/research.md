# Research: Product Rating Summary Display

**Feature**: Product Rating Summary Display  
**Branch**: `001-rating-summary`  
**Date**: 2026-02-14  
**Purpose**: Resolve technical uncertainties from Technical Context (plan.md)

## Decision Summary

This research resolves 5 technical clarifications required for implementation:

1. **Backend Language/Runtime**: Node.js 18+ with TypeScript
2. **Backend Framework**: Express.js
3. **Database**: PostgreSQL 14+
4. **Database Driver**: pg (node-postgres)
5. **Backend Testing**: Jest

## Research Findings

### 1. Backend Language/Runtime Selection

**Decision**: Node.js 18 LTS with TypeScript 5.x

**Rationale**:
- **Async I/O Performance**: Node.js excels at I/O-bound operations (database queries, Redis cache, API responses), critical for meeting 150ms p95 SLO
- **Ecosystem Maturity**: Extensive libraries for Redis (ioredis), PostgreSQL (pg), testing (Jest), OpenAPI validation (Spectral)
- **TypeScript Benefits**: Type safety reduces runtime errors; interfaces for API contracts align with constitution documentation requirements; excellent IDE support
- **Shared Language**: JavaScript/TypeScript across frontend and backend reduces context switching; enables code sharing for validation logic and API types
- **LTS Support**: Node.js 18 LTS supported until April 2025 (should be 2028 per LTS schedule); TypeScript 5.x stable with active development

**Alternatives Considered**:
- **Python 3.11 + FastAPI**: Excellent for data-heavy operations, strong async support, but Node.js edge for this use case due to simpler Redis integration and frontend language alignment
- **Go**: Superior performance, but higher learning curve and less ecosystem maturity for web APIs compared to Node.js; overkill for this feature's scale
- **Java + Spring Boot**: Enterprise-grade, excellent for large systems, but heavyweight for single-feature scope; slower development velocity

### 2. Backend Framework Selection

**Decision**: Express.js 4.x

**Rationale**:
- **Simplicity**: Minimal, unopinionated framework ideal for single-endpoint feature; low cognitive overhead
- **Performance**: Lightweight routing layer; minimal overhead between request and handler; supports 150ms SLO easily
- **Middleware Ecosystem**: Rich plugin ecosystem for validation (express-validator), OpenAPI (express-openapi-validator), CORS, error handling
- **Testing Support**: Well-supported by Supertest for integration testing; Jest compatibility
- **Team Familiarity**: Most widely adopted Node.js framework; extensive documentation and community support

**Alternatives Considered**:
- **Fastify**: 2-3x faster than Express, excellent choice for high-throughput APIs, but micro-optimization premature for this scope; Express sufficient for 150ms SLO with caching
- **NestJS**: Full-featured framework with dependency injection, excellent for large applications, but excessive for single endpoint; adds unnecessary complexity
- **Koa**: Modern, cleaner async/await support, but smaller ecosystem and community compared to Express; migration path exists if needed later

### 3. Database Selection

**Decision**: PostgreSQL 14+

**Rationale**:
- **Aggregation Performance**: Excellent support for aggregate functions (AVG, COUNT) with query optimization; materialized views available if needed for performance
- **ACID Compliance**: Ensures data consistency for rating calculations; critical for accurate averages
- **JSON Support**: Native JSONB type useful if rating data structure evolves (e.g., rating dimensions, metadata)
- **Indexing**: B-tree indexes on product_id column ensure fast lookups; partial indexes for optimizing specific queries
- **Active Development**: Regular performance improvements; strong community support; extensive documentation

**Alternatives Considered**:
- **MySQL**: Viable alternative with similar features, but PostgreSQL's superior JSON handling and aggregate performance give slight edge
- **MongoDB**: Document model unnecessary for simple aggregation; relational model more appropriate for ratings (structured, fixed schema)
- **Redis Only**: Could store pre-computed aggregates directly in Redis, but lacks durability and query flexibility; better as caching layer than primary store

### 4. Database Driver Selection

**Decision**: pg (node-postgres) 8.x

**Rationale**:
- **Official Driver**: Most widely used PostgreSQL driver for Node.js; actively maintained
- **Connection Pooling**: Built-in pool management critical for performance under concurrent load
- **Type Safety**: TypeScript type definitions available (@types/pg); integrates well with TypeScript codebase
- **Raw SQL Control**: Direct SQL access enables query optimization for performance SLO; no ORM abstraction overhead
- **Promise Support**: Native async/await compatibility; clean async code patterns

**Alternatives Considered**:
- **Prisma ORM**: Modern ORM with excellent TypeScript support, migration management, and type generation; however, ORM overhead may impact 150ms SLO; adds complexity for single aggregate query
- **TypeORM**: Full-featured ORM with decorator-based entities; same performance concerns as Prisma; unnecessary for simple query
- **Knex.js**: Query builder providing SQL abstraction without ORM overhead; good middle ground, but raw SQL sufficient for single query

### 5. Backend Testing Framework Selection

**Decision**: Jest 29.x

**Rationale**:
- **All-in-One**: Single tool for unit tests, integration tests, mocking, coverage reporting; reduces tooling complexity
- **TypeScript Support**: Native TypeScript support via ts-jest; seamless integration with TypeScript codebase
- **Snapshot Testing**: Useful for API response validation; ensures contract stability
- **Mocking Capabilities**: Built-in mocking for Redis, database, external dependencies; critical for unit testing service layer
- **Parallel Execution**: Fast test execution via parallelization; helps meet CI 15-minute SLO
- **Frontend Alignment**: Same testing framework as frontend (Jest + React Testing Library); reduces context switching; shared test utilities possible

**Alternatives Considered**:
- **Mocha + Chai**: Flexible, modular testing stack, but requires multiple libraries (assertion, mocking, coverage); Jest's integrated approach simpler
- **Vitest**: Modern, fast Vite-native test runner with Jest-compatible API; excellent choice, but Jest more mature and widely adopted; migration path exists
- **AVA**: Concurrent test execution by default, but smaller ecosystem and less TypeScript integration compared to Jest

## Technology Integration

### Redis Caching Strategy

**Library**: ioredis 5.x

**Pattern**: Cache-aside (lazy loading)
```
1. Request arrives for product ID
2. Check Redis: GET rating:summary:{productId}
3. Cache hit → Return cached data
4. Cache miss → Query database → Cache result with 60s TTL → Return data
```

**Key Structure**: `rating:summary:{productId}`
**TTL**: 60 seconds (per requirements)
**Eviction**: TTL-based expiration (no manual invalidation for v1)

### API Validation Strategy

**Library**: express-validator 7.x

**Approach**: Middleware-based validation
- Validate product ID format (UUID, integer, or string depending on system)
- Validate numeric bounds on response data (rating 0.0-5.0, count >= 0)
- Return 400 Bad Request with structured error messages on validation failure

### Accessibility Testing Strategy

**Library**: @axe-core/react 4.x (frontend)

**Approach**: Automated accessibility testing in Jest tests
- Run axe checks on RatingSummary component in all states (loaded, loading, error, zero-rating)
- Validate ARIA labels, semantic HTML, color contrast
- Fail test suite if WCAG 2.2 AA violations detected

### OpenAPI Contract Validation

**Tool**: Spectral 6.x

**Approach**: Contract-first API development
- Define OpenAPI 3.1 spec for GET /products/{id}/rating-summary
- Run Spectral linting in CI pipeline
- Validate responses match schema using express-openapi-validator middleware

## Performance Optimization Plan

### Database Query Optimization

**Index Strategy**:
```sql
CREATE INDEX idx_ratings_product_id ON ratings(product_id);
```

**Query Pattern**:
```sql
SELECT 
  COALESCE(AVG(rating), 0) as average,
  COUNT(*) as count
FROM ratings
WHERE product_id = $1;
```

**Optimization Notes**:
- Index on product_id ensures O(log n) lookup
- COALESCE handles NULL average when count=0
- Single query reduces round trips

### Cache Performance

**Target Metrics**:
- Cache hit rate: >80% (assumption: product pages frequently viewed)
- Cache lookup: <5ms (Redis in-memory lookup)
- Database query (cache miss): <100ms (with index)
- Total p95 latency: <150ms (per constitution)

**Monitoring**:
- Track cache hit/miss ratio
- Log slow queries (>50ms)
- Alert if p95 exceeds 140ms (buffer before SLO breach)

## Dependency Summary

### Backend Dependencies

**Production**:
- express: ^4.18.0 (web framework)
- pg: ^8.11.0 (PostgreSQL driver)
- ioredis: ^5.3.0 (Redis client)
- express-validator: ^7.0.0 (input validation)
- express-openapi-validator: ^5.1.0 (OpenAPI contract validation)

**Development**:
- typescript: ^5.3.0 (type safety)
- jest: ^29.7.0 (testing framework)
- ts-jest: ^29.1.0 (TypeScript Jest integration)
- supertest: ^6.3.0 (HTTP assertion library)
- @types/express: ^4.17.0 (Express types)
- @types/pg: ^8.10.0 (pg types)
- @spectral/cli: ^6.11.0 (OpenAPI linting)

### Frontend Dependencies

**Production**:
- react: ^18.2.0 (UI library - assumed from component approach)
- axios or fetch API (HTTP client for rating-summary endpoint)

**Development**:
- @testing-library/react: ^14.1.0 (React component testing)
- @testing-library/jest-dom: ^6.1.0 (DOM matchers)
- @axe-core/react: ^4.8.0 (accessibility testing)
- jest: ^29.7.0 (testing framework - shared with backend)

## Risk Assessment

### Medium Risks

**Redis Unavailability**:
- **Impact**: All requests bypass cache, hit database directly
- **Mitigation**: Graceful degradation - continue serving from database; alert on cache failures; consider read replicas if load increases
- **Performance Impact**: Query latency increases from ~5ms to ~50-100ms; may approach 150ms SLO under load

**Database Performance**:
- **Impact**: Large products with 100k+ ratings may slow aggregation
- **Mitigation**: Monitor query performance; implement materialized views if needed; consider pre-aggregation for high-traffic products

### Low Risks

**TypeScript Configuration**:
- **Impact**: Misconfigured tsconfig may miss type errors
- **Mitigation**: Use strict mode; enable all type checking flags; CI verification

**Test Coverage**:
- **Impact**: Insufficient test coverage may miss edge cases
- **Mitigation**: Enforce coverage thresholds (>80%); constitution requires unit tests per task

## Next Steps

All technical decisions resolved. Proceed to Phase 1:
1. Generate data-model.md (entities and relationships)
2. Generate contracts/ (OpenAPI specification)
3. Generate quickstart.md (developer onboarding)
4. Update agent context with new technologies
5. Re-validate Constitution Check with concrete design
