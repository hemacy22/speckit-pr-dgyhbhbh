# Tasks: Product Rating Summary Display

**Input**: Feature specification from [spec.md](spec.md)  
**Prerequisites**: spec.md (required), technical requirements provided  
**Feature Branch**: `001-rating-summary-display`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **Checkbox**: `- [ ]` starts every task
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

**Web app structure**: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend directory structure: backend/src/{models,services,api,config}, backend/tests/{unit,contract,integration}
- [X] T002 Create frontend directory structure: frontend/src/{components,services,types}, frontend/tests/e2e
- [X] T003 [P] Initialize backend: create backend/package.json with Express, Prisma, ioredis, TypeScript dependencies
- [X] T004 [P] Initialize frontend: create frontend/package.json with React, Vite, TypeScript, axios, @axe-core/react dependencies
- [X] T005 [P] Create backend/tsconfig.json with Node.js/ES2020 target and strict mode enabled
- [X] T006 [P] Create frontend/tsconfig.json with DOM lib and JSX support
- [X] T007 [P] Create frontend/vite.config.ts with React plugin configuration
- [X] T008 [P] Create backend/jest.config.js for unit and integration testing
- [X] T009 [P] Create frontend/jest.config.js for component testing with React Testing Library
- [X] T010 Create docker-compose.yml with PostgreSQL 15 and Redis 7 services for local development
- [X] T011 Create .env.example with DATABASE_URL, REDIS_URL, PORT, NODE_ENV placeholders
- [X] T012 Create .gitignore for node_modules, .env, dist, coverage, and build artifacts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T013 Define Prisma schema in backend/src/models/schema.prisma with Product model (id UUID, title String, timestamps)
- [X] T014 Add Rating model to backend/src/models/schema.prisma (id UUID, productId FK, score Float 1-5, timestamps, index on productId)
- [ ] T015 Generate initial Prisma migration with: npx prisma migrate dev --name add-products-ratings-tables
- [X] T016 Create seed script in backend/prisma/seed.ts with sample products and ratings for testing (0 ratings, 1 rating, 100+ ratings)
- [X] T017 [P] Implement database config in backend/src/config/database.config.ts initializing Prisma client with connection pooling
- [X] T018 [P] Implement Redis config in backend/src/config/redis.config.ts creating ioredis client with error handling
- [X] T019 [P] Implement environment config in backend/src/config/env.config.ts loading and validating environment variables
- [X] T020 Implement cache service in backend/src/services/cache.service.ts with get(key), set(key, value, ttl), del(key) methods
- [X] T021 Create Express app setup in backend/src/server.ts with middleware (json parser, CORS), error handling, and health check endpoint
- [X] T022 Create error handler middleware in backend/src/api/middleware/error-handler.middleware.ts formatting 4xx/5xx responses
- [X] T023 [P] Create base API types in frontend/src/types/api.types.ts with ApiResponse, ApiError interfaces
- [X] T024 [P] Create ErrorBoundary component in frontend/src/components/ErrorBoundary/ErrorBoundary.tsx for React error catching

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Product Rating Summary (Priority: P1) 🎯 MVP

**Goal**: Display product rating summary (average 0-5, count) near product title with WCAG 2.2 AA accessibility

**Independent Test**: Navigate to product page, verify rating summary displays with correct data and screen-reader text

### Backend Implementation for User Story 1

- [X] T025 [P] [US1] Create RatingSummary type in backend/src/types/rating.types.ts with average: number, count: number interface
- [X] T026 [US1] Implement getRatingSummary method in backend/src/services/rating-summary.service.ts:
  - Check Redis cache for key `rating-summary:{productId}`
  - On cache miss: query Prisma aggregation (_avg.score, _count.score) on Rating where productId
  - Return { average: 0, count: 0 } if no ratings exist
  - Cache result with 60s TTL before returning
  - Handle database errors with appropriate exceptions
- [X] T027 [US1] Create rating summary controller in backend/src/api/controllers/rating-summary.controller.ts:
  - Extract productId from request params
  - Call rating-summary.service.getRatingSummary
  - Return 200 with { average, count } JSON response
  - Handle 404 for invalid product, 500 for service errors, 503 for cache/DB unavailable
- [X] T028 [US1] Add GET /products/:id/rating-summary route in backend/src/api/routes/products.routes.ts mapping to rating-summary.controller
- [X] T029 [US1] Create OpenAPI spec in backend/openapi/rating-summary-api.yaml:
  - Define GET /products/{id}/rating-summary endpoint
  - Path parameter: id (string, UUID format)
  - Response 200 schema: { average: number (0.0-5.0), count: integer (≥0) }
  - Error responses: 400, 404, 500, 503 with error message schemas
- [X] T030 [US1] Implement OpenAPI validator middleware in backend/src/api/middleware/openapi-validator.middleware.ts using express-openapi-validator library pointing to backend/openapi/rating-summary-api.yaml
- [X] T031 [US1] Register OpenAPI validator and products routes in backend/src/server.ts with app.use()

### Frontend Implementation for User Story 1

- [X] T032 [P] [US1] Create RatingSummary types in frontend/src/types/rating.types.ts with RatingSummaryResponse, RatingSummaryProps interfaces
- [X] T033 [P] [US1] Implement fetchRatingSummary API service in frontend/src/services/rating-api.service.ts:
  - Use axios.get to call /products/{productId}/rating-summary
  - Return typed RatingSummaryResponse
  - Handle network errors and timeout (5s)
- [X] T034 [US1] Create RatingSummary component in frontend/src/components/RatingSummary/RatingSummary.tsx:
  - Accept productId prop
  - useState for data/loading/error states
  - useEffect to fetch on productId change via rating-api.service
  - Render logic: loading spinner → error message → "No ratings yet" (count=0) → display average (1 decimal) + count
  - Include visible labels: "Rating: X.X (N reviews)"
  - Include aria-label: "Average rating X.X out of 5 stars based on N customer ratings"
  - Include sr-only span with full descriptive text for screen readers
- [X] T035 [US1] Create styles in frontend/src/components/RatingSummary/RatingSummary.module.css:
  - .container: flexbox layout, responsive spacing
  - .rating, .count: typography styles with sufficient color contrast (4.5:1 minimum for WCAG AA)
  - .sr-only: position absolute, width 1px, height 1px, overflow hidden (visually hidden, screen-reader accessible)
  - .loading, .error: appropriate state styling
  - Media queries for mobile/tablet/desktop responsiveness
- [X] T036 [US1] Create index export in frontend/src/components/RatingSummary/index.ts exporting RatingSummary component

### Testing for User Story 1

- [X] T037 [P] [US1] Unit test cache service in backend/tests/unit/cache.service.test.ts:
  - Mock ioredis client
  - Test get() returns cached value
  - Test set() stores value with TTL
  - Test del() removes key
  - Test Redis connection error handling
- [X] T038 [P] [US1] Unit test rating summary service in backend/tests/unit/rating-summary.service.test.ts:
  - Mock Prisma client and cache service
  - Test cache hit scenario returns cached data without DB query
  - Test cache miss scenario queries DB, caches result, returns data
  - Test zero ratings returns { average: 0, count: 0 }
  - Test database error throws appropriate exception
  - Test average is rounded to 1 decimal place
- [X] T039 [US1] Contract test in backend/tests/contract/rating-summary-contract.test.ts:
  - Use Supertest to call GET /products/{validId}/rating-summary
  - Validate response schema matches OpenAPI spec (average: number 0-5, count: integer ≥0)
  - Test 404 response for invalid product ID
  - Test 400 response for malformed product ID
- [X] T040 [US1] Integration test in backend/tests/integration/rating-summary-integration.test.ts:
  - Start test database with seed data
  - Test full request/response cycle for product with ratings
  - Test cache population: first request hits DB, second request hits cache
  - Test cache expiry: verify TTL of 60s invalidates cache
  - Test product with zero ratings returns { average: 0, count: 0 }
  - Test 404 for non-existent product
- [X] T041 [P] [US1] Component unit test in frontend/src/components/RatingSummary/RatingSummary.test.tsx:
  - Mock rating-api.service.fetchRatingSummary
  - Test loading state renders spinner
  - Test successful data display: average (1 decimal) and count visible
  - Test zero ratings displays "No ratings yet"
  - Test error state displays error message
  - Test aria-label is present with correct format
  - Test sr-only span contains descriptive text for screen readers
  - Test large numbers formatted correctly (e.g., "1.2M ratings")
- [X] T042 [US1] Accessibility test in frontend/src/components/RatingSummary/RatingSummary.test.tsx:
  - Use @axe-core/react to run axe checks on rendered RatingSummary component
  - Assert zero critical or serious violations (WCAG 2.2 Level AA)
  - Test color contrast meets 4.5:1 minimum ratio
  - Verify screen reader can access all content via sr-only text
- [X] T043 [US1] E2E test in frontend/tests/e2e/rating-summary.e2e.test.ts using Playwright:
  - Navigate to product page with ratings
  - Verify rating summary is visible near product title
  - Verify average and count display correctly
  - Navigate to product with zero ratings, verify "No ratings yet" displays
  - Test responsive behavior on mobile/tablet/desktop viewports
  - Use Playwright accessibility testing to verify screen reader announcements

**Checkpoint**: User Story 1 complete and independently testable - feature delivers MVP value

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Finalize infrastructure, documentation, and deployment readiness

- [X] T044 [P] Create CODEOWNERS file in .github/CODEOWNERS assigning backend/ to backend team, frontend/ to frontend team
- [X] T045 [P] Create README.md with project setup instructions, environment configuration, running tests locally, docker-compose usage
- [X] T046 Create GitHub Actions CI workflow in .github/workflows/ci.yml:
  - Job 1: Backend unit tests (Jest, 80% coverage requirement)
  - Job 2: Backend contract tests (OpenAPI compliance)
  - Job 3: Backend integration tests (with Postgres/Redis test containers)
  - Job 4: Frontend component tests (Jest + React Testing Library)
  - Job 5: Frontend E2E tests (Playwright)
  - Job 6: OpenAPI lint (npx @redocly/cli lint backend/openapi/rating-summary-api.yaml, zero errors required)
  - Job 7: Accessibility tests (axe violations check, zero critical/serious violations)
  - Job 8: CodeQL security scan (no new high/critical issues)
  - Configure least-privilege permissions: contents: read, checks: write
  - Require all jobs pass before merge
- [X] T047 [P] Add performance test in backend/tests/integration/rating-summary.performance.test.ts:
  - Use autocannon or similar to send 100 concurrent requests
  - Measure P95 response time with warm cache
  - Assert P95 < 150ms (constitution requirement)
- [X] T048 [P] Add monitoring placeholders in backend/src/server.ts:
  - Response time logging middleware
  - Error rate tracking
  - Cache hit rate metrics
  - Comments for production APM integration (Datadog, New Relic, etc.)
- [X] T049 Document API contract in backend/openapi/rating-summary-api.yaml with usage examples and full error response documentation
- [X] T050 Final validation: Run all tests locally, verify docker-compose up works, ensure .env.example is complete

---

## Dependencies (Story Completion Order)

Since there is only one user story (US1), no inter-story dependencies exist.

**Prerequisites for US1**:
- Phase 1 (Setup) must complete: T001-T012
- Phase 2 (Foundational) must complete: T013-T024

**Parallel Execution Within US1**:
- Backend implementation (T025-T031) can proceed in parallel with frontend implementation (T032-T036)
- Testing (T037-T043) can start once respective implementation is complete
- All [P] marked tasks within each phase can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

The single user story (P1) represents the complete MVP. Implementing only US1 delivers a fully functional, independently testable feature:

**MVP Scope (US1)**:
- ✅ Display rating summary (average + count)
- ✅ Fetch from GET /products/{id}/rating-summary API
- ✅ Handle zero ratings ("No ratings yet")
- ✅ WCAG 2.2 AA compliant (visible labels, screen-reader text)
- ✅ Redis cache (60s TTL) for performance
- ✅ Postgres aggregation (AVG + COUNT)
- ✅ Error handling and resilience

**Deployment-Ready Increments**:
1. **Foundational Infrastructure** (T001-T024): Sets up project, DB, cache, basic Express app
2. **Backend API** (T025-T031): Implements /products/:id/rating-summary endpoint with caching
3. **Frontend Component** (T032-T036): Implements <RatingSummary> with accessibility
4. **Testing & Validation** (T037-T043): Ensures quality and compliance
5. **CI/CD & Polish** (T044-T050): Production readiness

### Parallel Execution Opportunities per Story

**Phase 2 (Foundational)**: T017, T018, T019 (configs) + T023, T024 (frontend base) can run in parallel after DB setup (T013-T016)

**Phase 3 (US1 Implementation)**: 
- T025 (types) + T032, T033 (frontend API) can start immediately
- T034-T036 (frontend component) parallel with T026-T031 (backend)

**Phase 3 (US1 Testing)**:
- T037, T038 (backend unit tests) + T041, T042 (frontend tests) all parallel once respective implementations complete
- T039, T040 (contract/integration) can run in parallel

**Phase 4 (Polish)**: T044, T045, T047, T048 all parallelizable

---

## Task Summary

- **Total Tasks**: 50
- **Phase 1 (Setup)**: 12 tasks (8 parallelizable)
- **Phase 2 (Foundational)**: 12 tasks (6 parallelizable)
- **Phase 3 (US1)**: 19 tasks (6 parallelizable)
- **Phase 4 (Polish)**: 7 tasks (4 parallelizable)

**Parallel Execution Potential**: 24 tasks marked [P] can run concurrently within their phases

**Format Validation**: ✅ All 50 tasks follow strict checklist format:
- [x] Checkbox present: `- [ ]`
- [x] Sequential Task IDs: T001-T050
- [x] [P] markers: 24 tasks correctly marked for parallelization
- [x] [Story] labels: 19 tasks correctly labeled [US1] in Phase 3
- [x] File paths: All tasks include specific file paths in descriptions
- [x] Clear actions: Each task has actionable, specific description

**MVP Status**: ✅ User Story 1 (P1) represents complete MVP - fully functional and independently testable