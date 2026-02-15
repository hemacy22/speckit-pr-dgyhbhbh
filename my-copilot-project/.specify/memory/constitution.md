<!--
SYNC IMPACT REPORT
==================
Version change: [unversioned template] → 1.0.0
Constitution Status: Initial ratification

Principles Defined (5):
  1. Code Review & Approval Process (NEW)
  2. Continuous Integration & Quality Gates (NEW)
  3. Accessibility Standards (NEW)
  4. Performance Standards (NEW)
  5. Security Requirements (NEW)

Sections Added:
  - Technical Standards & Compliance
  - Development Workflow

Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section aligns with principles
  ✅ spec-template.md - Requirements align with accessibility and performance standards
  ✅ tasks-template.md - Task organization supports principle compliance

Follow-up TODOs: None
==================
-->

# My Copilot Project Constitution

## Core Principles

### I. Code Review & Approval Process

All code changes MUST be submitted through pull requests with the following mandatory requirements:

- Minimum of 2 approvals from qualified reviewers before merge
- CODEOWNERS file MUST be maintained and respected for all protected areas
- Direct commits to main/protected branches are prohibited
- Reviews MUST verify compliance with all constitution principles
- Changes affecting security, accessibility, or performance MUST receive explicit sign-off from domain experts

**Rationale**: Multi-reviewer approval and CODEOWNERS enforcement ensure knowledge distribution, reduce defects, and maintain architectural consistency across the codebase.

### II. Continuous Integration & Quality Gates

Every pull request MUST pass all required CI checks before merge. The following checks are mandatory and MUST complete successfully:

- **Unit Tests**: All existing and new unit tests must pass with no failures
- **OpenAPI Lint**: API specifications must conform to OpenAPI standards with zero violations
- **Accessibility (axe)**: Automated a11y scans must pass with no critical or serious violations
- **CodeQL Security Scan**: Static analysis must complete with no new high or critical security issues

**Rationale**: Automated quality gates catch defects early, enforce standards consistently, and prevent regressions from entering the codebase.

### III. Accessibility Standards (NON-NEGOTIABLE)

All user-facing features MUST comply with WCAG 2.2 Level AA standards:

- Automated testing via axe DevTools or equivalent is mandatory
- Manual testing required for interactive components
- Color contrast ratios MUST meet WCAG AA minimums (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation MUST be fully functional for all interactive elements
- Screen reader compatibility MUST be verified for all workflows
- No accessibility exceptions permitted without documented legal or technical justification

**Rationale**: Accessibility ensures inclusive design, meets legal compliance requirements, and expands the user base. WCAG 2.2 AA represents the current industry standard and is legally required in many jurisdictions.

### IV. Performance Standards

API endpoints MUST meet the following performance requirements under normal load conditions:

- 95th percentile (P95) response time MUST be less than 150ms
- Performance testing required for all new endpoints and endpoint modifications
- Performance regressions exceeding 10% require investigation and justification before merge
- Load testing required for endpoints expected to handle >100 requests/second
- Performance metrics MUST be monitored in production with alerting configured

**Rationale**: Consistent performance standards ensure responsive user experiences, support scalability planning, and prevent performance degradation over time.

### V. Security Requirements (NON-NEGOTIABLE)

Security MUST be enforced at all levels of development and deployment:

- **Signed Commits**: All commits MUST be cryptographically signed (GPG/SSH) to verify author identity
- **Least-Privilege Actions**: GitHub Actions workflows MUST request minimum required permissions
- **Dependency Scanning**: Automated vulnerability scanning for all dependencies
- **Secret Management**: No hardcoded secrets; all credentials via secure vaults or environment variables
- **Security Review**: Changes to authentication, authorization, or data handling MUST receive security review

**Rationale**: Proactive security measures reduce attack surface, ensure code provenance, limit blast radius of compromised workflows, and protect sensitive data.

## Technical Standards & Compliance

### OpenAPI Specifications

All API endpoints MUST have OpenAPI specifications that:

- Include complete request/response schemas
- Document all error codes and responses
- Specify authentication requirements
- Include example payloads
- Pass linting with zero errors

### Testing Requirements

- Unit test coverage targets: minimum 80% for new code
- Integration tests required for cross-service interactions
- Contract tests required for all public APIs
- End-to-end tests required for critical user journeys

### Documentation

- All public APIs MUST be documented with usage examples
- Architecture Decision Records (ADRs) required for significant technical decisions
- README files MUST be maintained for all modules/services

## Development Workflow

### Branch Strategy

- Feature branches created from main: `feature/###-description`
- Protected branches: main, release/*, hotfix/*
- Squash merge preferred for feature branches to maintain clean history

### Pull Request Requirements

1. Title follows conventional commit format: `type(scope): description`
2. Description includes:
   - Summary of changes
   - Link to related issue/spec
   - Testing performed
   - Screenshots/videos for UI changes
3. All CI checks pass (unit tests, OpenAPI lint, axe a11y, CodeQL)
4. Minimum 2 approvals obtained
5. CODEOWNERS approval obtained for affected areas
6. No unresolved review comments

### Deployment Process

- Deployments to production require successful staging environment validation
- Rollback procedures MUST be documented and tested
- Database migrations MUST be backward-compatible or coordinated with deployment

## Governance

This constitution supersedes all other development practices and policies. All pull requests, code reviews, and architectural decisions MUST verify compliance with these principles.

**Amendment Process**:

- Amendments require formal proposal with rationale documented
- Major changes (MAJOR version bump) require team consensus
- Minor changes (MINOR version bump) require majority approval
- Patches (PATCH version bump) can be approved by maintainers

**Enforcement**:

- Constitution compliance is verified during code review
- CI/CD pipelines enforce automated checks
- Violations must be documented and justified or remediated
- Regular audits (quarterly) review adherence

**Complexity & Exceptions**:

- Any deviation from principles requires documented justification
- Technical debt MUST include remediation plan and timeline
- Security and accessibility exceptions require stakeholder approval

**Version**: 1.0.0 | **Ratified**: 2026-02-15 | **Last Amended**: 2026-02-15
