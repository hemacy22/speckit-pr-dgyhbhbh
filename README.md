# Product Rating Summary Display

Display rating summaries for products with full WCAG 2.2 AA accessibility compliance.

## 🎯 Project Overview

This project implements a product rating summary feature that displays:
- Average rating (0-5 stars, one decimal place)
- Total number of ratings
- "No ratings yet" message when count is 0
- Full screen reader accessibility

### Tech Stack

**Backend**:
- Node.js 20 LTS with TypeScript 5.3
- Express 4.18.2 for REST API
- Prisma 5.8.0 ORM with PostgreSQL 15
- Redis 7 for caching (60s TTL)
- Jest 29.7 for testing

**Frontend**:
- React 18.2.0 with TypeScript
- Vite 5.0.10 for build tooling
- Axios 1.6.5 for API calls
- @axe-core/react 4.8.4 for accessibility testing
- Jest + React Testing Library for component tests
- Playwright for E2E tests

## 🚀 Quick Start

### Prerequisites

- Node.js 20 LTS or higher
- Docker and Docker Compose
- Git with commit signing enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/speckit-pr-demo.git
cd speckit-pr-demo
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Start infrastructure (PostgreSQL + Redis):
```bash
docker-compose up -d
```

4. Set up environment variables:
```bash
# Copy example files
cp .env.example .env

# Edit .env with your configuration:
# DATABASE_URL=postgresql://user:password@localhost:5432/ratings_db
# REDIS_URL=redis://localhost:6379
# PORT=3000
# NODE_ENV=development
```

5. Run database migrations:
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

6. Start the development servers:
```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

The backend API will be available at `http://localhost:3000`
The frontend will be available at `http://localhost:5173`

## 📚 API Documentation

### Get Rating Summary

**Endpoint**: `GET /products/{id}/rating-summary`

**Parameters**:
- `id` (path, required): Product UUID

**Response 200**:
```json
{
  "average": 4.3,
  "count": 127
}
```

**Response 404** (Product not found):
```json
{
  "error": "Product not found"
}
```

**Response 400** (Invalid UUID):
```json
{
  "error": "Invalid product ID format"
}
```

**Caching**: Results are cached for 60 seconds in Redis.

## 🧪 Testing

### Run All Tests

```bash
# Backend
cd backend
npm test                    # Unit + integration tests
npm run test:unit           # Unit tests only
npm run test:contract       # OpenAPI contract tests
npm run test:integration    # Integration tests with DB/Redis

# Frontend
cd frontend
npm test                    # Component tests
npm run test:e2e            # Playwright E2E tests
npm run test:a11y           # Accessibility tests
```

### Coverage Requirements

Per project constitution, **minimum 80% code coverage** required:
```bash
cd backend
npm run test:coverage
```

### Performance Testing

API P95 latency must be < 150ms:
```bash
cd backend
npm run test:performance
```

## ♿ Accessibility (WCAG 2.2 AA)

This project adheres to **NON-NEGOTIABLE** WCAG 2.2 Level AA requirements:

- **Color contrast**: Minimum 4.5:1 for normal text (documented in CSS)
- **Screen reader support**: Full aria-label and sr-only descriptive text
- **Keyboard navigation**: All interactive elements accessible
- **Automated testing**: Zero critical/serious axe violations

Run accessibility tests:
```bash
cd frontend
npm run test:a11y
```

## 🔒 Security & Compliance

### Signed Commits

All commits **must be signed** with GPG:
```bash
git config --global commit.gpgsign true
git config --global user.signingkey YOUR_KEY_ID
```

### CI/CD Requirements

Per constitution v1.0.0, all PRs require:
- ✅ Minimum 2 approvals from CODEOWNERS
- ✅ Unit tests pass (80% coverage)
- ✅ OpenAPI lint (zero errors)
- ✅ Accessibility tests (zero critical/serious violations)
- ✅ CodeQL security scan (no new high/critical issues)
- ✅ Signed commits only

See [.github/workflows/ci.yml](.github/workflows/ci.yml) for full CI configuration.

## 📁 Project Structure

```
my-copilot-project/
├── backend/
│   ├── src/
│   │   ├── models/          # Prisma schema
│   │   ├── services/        # Business logic (caching, rating aggregation)
│   │   ├── api/
│   │   │   ├── controllers/ # HTTP request handlers
│   │   │   ├── routes/      # Express routes
│   │   │   └── middleware/  # OpenAPI validator, error handler
│   │   ├── config/          # Database, Redis, env configuration
│   │   └── server.ts        # Express app entry point
│   ├── tests/
│   │   ├── unit/            # Service & utility tests
│   │   ├── contract/        # OpenAPI compliance tests
│   │   └── integration/     # Full-stack tests with DB/Redis
│   ├── openapi/             # OpenAPI 3.0.3 specifications
│   ├── prisma/              # Migrations and seed data
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (RatingSummary, ErrorBoundary)
│   │   ├── services/        # API clients (axios)
│   │   └── types/           # TypeScript interfaces
│   ├── tests/
│   │   └── e2e/             # Playwright tests
│   ├── package.json
│   ├── vite.config.ts
│   └── playwright.config.ts
├── specs/                   # Feature specifications
│   └── 001-rating-summary-display/
│       ├── spec.md          # Requirements & acceptance criteria
│       └── tasks.md         # Implementation tasks
├── .github/
│   ├── workflows/           # GitHub Actions CI/CD
│   └── CODEOWNERS           # Code review assignments
├── docker-compose.yml       # PostgreSQL + Redis
├── .env.example             # Environment template
├── CONSTITUTION.md          # Project governance
└── README.md                # This file
```

## 🛠️ Development Workflow

1. Create feature branch from `main`: `git checkout -b 00X-feature-name`
2. Implement changes following task breakdown in `specs/00X-feature-name/tasks.md`
3. Write tests first (TDD approach)
4. Ensure all tests pass locally
5. Run accessibility checks: `npm run test:a11y`
6. Sign commits: `git commit -S -m "feat: description"`
7. Push and create PR
8. Wait for CI checks and peer reviews (minimum 2 approvals)
9. Merge only after all requirements pass

## 🐛 Troubleshooting

### Database connection errors

Check PostgreSQL is running:
```bash
docker-compose ps
docker-compose logs postgres
```

Reset database:
```bash
cd backend
npx prisma migrate reset
npx prisma db seed
```

### Redis connection errors

Check Redis is running:
```bash
docker-compose ps
docker-compose logs redis
```

Test Redis connection:
```bash
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Port conflicts

If ports 3000, 5173, 5432, or 6379 are in use:
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <pid> /F
```

Or change ports in .env and docker-compose.yml

### Test failures

Run tests in watch mode for debugging:
```bash
npm test -- --watch
```

Check test database is seeded:
```bash
cd backend
npx prisma studio
```

## 📊 Monitoring & Observability

The backend includes monitoring placeholders for:
- Response time logging
- Error rate tracking
- Cache hit rate metrics

Production deployment should integrate with APM tools like:
- Datadog
- New Relic
- Prometheus + Grafana

See [backend/src/server.ts](backend/src/server.ts) for implementation hooks.

## 📖 Additional Resources

- [Project Constitution](CONSTITUTION.md) - Governance and requirements
- [OpenAPI Specification](backend/openapi/rating-summary-api.yaml) - API contract
- [Feature Specification](specs/001-rating-summary-display/spec.md) - User stories
- [Task Breakdown](specs/001-rating-summary-display/tasks.md) - Implementation plan

## 🤝 Contributing

1. Read [CONSTITUTION.md](CONSTITUTION.md) for requirements
2. All code must pass CI checks (unit tests, OpenAPI lint, accessibility, CodeQL)
3. Follow TypeScript strict mode conventions
4. Write comprehensive tests (80% coverage minimum)
5. Document accessibility considerations
6. Sign all commits

## 📄 License

MIT License - see LICENSE file for details

## 🙋 Support

For questions or issues:
- Open a GitHub issue
- Contact @backend-team for API questions
- Contact @frontend-team for UI/UX questions
- Contact @engineering-leads for governance questions
