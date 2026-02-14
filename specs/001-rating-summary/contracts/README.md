# API Contracts

**Feature**: Product Rating Summary Display  
**Branch**: `001-rating-summary`  
**Date**: 2026-02-14

## Contract Files

### [rating-summary-api.yaml](rating-summary-api.yaml)

OpenAPI 3.1 specification for the Product Rating Summary API endpoint.

**Endpoint**: `GET /products/{id}/rating-summary`

**Key Contract Points**:
- **Request**: Product ID in URL path (integer, minimum 1)
- **Response**: JSON object with `average` (float 0.0-5.0) and `count` (integer >= 0)
- **Success Code**: 200 OK
- **Error Codes**: 400 (invalid ID), 404 (not found), 500 (server error), 503 (cache unavailable)
- **Performance**: Target < 150ms p95 response time
- **Caching**: 60-second TTL via Redis

## Validation

### Spectral Linting

Run OpenAPI linting with Spectral:

```bash
# Install Spectral (if not already installed)
npm install -g @stoplight/spectral-cli

# Validate contract
spectral lint specs/001-rating-summary/contracts/rating-summary-api.yaml
```

**Expected Result**: No errors or warnings (contract follows OpenAPI best practices)

### Contract Testing

Contract tests validate that implementation matches specification:

```bash
# Backend contract tests (ensure API responses match OpenAPI schema)
npm test -- tests/contract/rating-summary-api.test.ts

# Example test cases:
# - Response schema validation (average, count fields present and correct type)
# - Response bounds validation (average 0.0-5.0, count >= 0)
# - Error response format validation
# - HTTP status codes match specification
```

## Usage Examples

### Successful Request (Product with Ratings)

**Request**:
```http
GET /v1/products/12345/rating-summary HTTP/1.1
Host: api.example.com
Accept: application/json
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Cache-Status: HIT
X-Response-Time: 5

{
  "average": 4.5,
  "count": 234
}
```

### Successful Request (Product with No Ratings)

**Request**:
```http
GET /v1/products/99999/rating-summary HTTP/1.1
Host: api.example.com
Accept: application/json
```

**Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Cache-Status: MISS
X-Response-Time: 92

{
  "average": 0,
  "count": 0
}
```

### Error Request (Invalid Product ID)

**Request**:
```http
GET /v1/products/abc/rating-summary HTTP/1.1
Host: api.example.com
Accept: application/json
```

**Response**:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Invalid product ID format",
  "message": "Product ID must be a positive integer",
  "code": "INVALID_PRODUCT_ID",
  "details": {
    "field": "id",
    "received": "abc",
    "expected": "integer"
  }
}
```

### Error Request (Product Not Found)

**Request**:
```http
GET /v1/products/999999999/rating-summary HTTP/1.1
Host: api.example.com
Accept: application/json
```

**Response**:
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Product not found",
  "message": "No product exists with ID 999999999",
  "code": "PRODUCT_NOT_FOUND"
}
```

## Frontend Integration

### TypeScript Interface (Generated from OpenAPI)

```typescript
// Generated from OpenAPI schema
export interface RatingSummary {
  /** Average rating (0.0-5.0) */
  average: number;
  
  /** Total count of ratings */
  count: number;
}

export interface RatingSummaryError {
  error: string;
  message: string;
  code: 'INVALID_PRODUCT_ID' | 'PRODUCT_NOT_FOUND' | 'INTERNAL_ERROR' | 'CACHE_UNAVAILABLE';
  details?: Record<string, unknown>;
}

// API client usage
export async function fetchRatingSummary(productId: number): Promise<RatingSummary> {
  const response = await fetch(`/v1/products/${productId}/rating-summary`);
  
  if (!response.ok) {
    const error: RatingSummaryError = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}
```

## Breaking Changes Policy

This is v1.0.0 of the contract. Future changes follow semantic versioning:

- **MAJOR** (2.0.0): Breaking changes (remove fields, change response structure, change types)
- **MINOR** (1.1.0): Additive changes (new optional fields, new error codes)
- **PATCH** (1.0.1): Documentation clarifications, example updates (no schema changes)

### Future Enhancements (Non-Breaking)

Potential v1.1.0 additions:
- Optional `ratingDistribution` field (histogram of 1-5 star counts)
- Optional `lastRatingDate` field (timestamp of most recent rating)
- Query parameter `?includeDistribution=true` for detailed breakdown

These would be additive and backward-compatible.

## Constitution Compliance

✅ **Principle VI (Feature Documentation Standards)**:
- API contract documented in plan.md ✓
- OpenAPI specification created ✓
- Contract testing strategy defined ✓

✅ **Principle III (Quality Automation)**:
- Spectral validation integrated ✓
- Contract test framework specified ✓
