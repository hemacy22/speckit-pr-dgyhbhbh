<!--
Sync Impact Report - Version 1.1.0 (2026-02-14)
================================================================================
VERSION CHANGE: 1.0.0 → 1.1.0
BUMP RATIONALE: MINOR - Added new development and quality principles without 
breaking existing governance framework

MODIFIED PRINCIPLES: None

ADDED PRINCIPLES:
- VI. Feature Documentation Standards (NON-NEGOTIABLE)
- VII. Accessibility Compliance (NON-NEGOTIABLE)

ADDED SECTIONS:
- Performance Standards (with specific SLO for rating summary)

REMOVED SECTIONS: None

TEMPLATE CONSISTENCY:
✅ .specify/templates/plan-template.md - API contract requirements align with VI
✅ .specify/templates/spec-template.md - Acceptance criteria requirements align with VI
✅ .specify/templates/tasks-template.md - Unit test requirements align with VI
✅ All templates validated for new accessibility and performance standards

FOLLOW-UP TODOs: None
================================================================================
-->

# Speckit PR Demo Constitution

## Core Principles

### I. Pull Request Discipline (NON-NEGOTIABLE)

**All code changes MUST flow through pull requests.** Direct pushes to protected branches
are strictly forbidden. This principle ensures:

- Every change undergoes peer review and automated validation
- Complete audit trail of all code modifications
- Opportunity for collaborative improvement before integration
- Enforcement of quality gates prior to merge

**Rationale**: Pull request discipline prevents unreviewed code from entering the codebase,
reduces defect rates, and maintains architectural consistency through mandatory review.

### II. Code Review Standards (NON-NEGOTIABLE)

**Every pull request MUST receive minimum two approvals before merge.** Additionally:

- At least one approval MUST come from a designated CODEOWNERS member
- Reviewers MUST verify compliance with constitution principles
- Reviews MUST confirm test coverage and quality gate passage
- Complexity increases MUST be explicitly justified

**Rationale**: Multiple reviewers catch defects missed by single review, while CODEOWNERS
approval ensures domain expertise validates changes to critical subsystems.

### III. Quality Automation (NON-NEGOTIABLE)

**All pull requests MUST pass the following automated checks before merge:**

- **Unit Tests**: Comprehensive test suite with adequate coverage of new/modified code
- **Spectral (OpenAPI)**: API contract validation ensuring spec compliance
- **axe Accessibility**: Automated a11y testing for UI components
- **CodeQL**: Static security analysis detecting common vulnerabilities

**Rationale**: Automated quality gates catch regressions, security issues, and accessibility
violations before they reach production, maintaining baseline quality standards without
manual effort.

### IV. Performance & Reliability

**Continuous Integration MUST complete within 15 minutes (p95).** Teams MUST:

- Monitor CI duration and investigate slowdowns proactively
- Quarantine flaky tests immediately upon detection
- Fix or remove quarantined tests within one sprint
- Parallelize test execution to maintain SLO compliance

**Rationale**: Fast feedback loops enable rapid iteration. Flaky tests erode confidence;
quarantine policies prevent false failures from blocking legitimate work while ensuring
accountability for resolution.

### V. Security Compliance (NON-NEGOTIABLE)

**All commits MUST be cryptographically signed.** Additionally:

- GitHub Actions workflows MUST use least-privilege token permissions
- Workflow permissions MUST be explicitly declared (no default-permissive implicit grants)
- Secret access MUST follow principle of least privilege
- Dependency updates MUST be reviewed for security implications

**Rationale**: Signed commits establish provenance and prevent impersonation. Least-privilege
workflow permissions limit blast radius of compromised workflows or malicious dependencies.

### VI. Feature Documentation Standards (NON-NEGOTIABLE)

**Every feature implementation MUST include complete documentation artifacts.** Specifically:

- **Acceptance Criteria**: User scenarios and acceptance tests MUST be defined in `spec.md`
- **API Contracts**: All API changes MUST be documented in `plan.md` with endpoints, schemas, and examples
- **Unit Tests**: Every task in `tasks.md` MUST have corresponding unit tests
- **Task Mapping**: Business logic MUST NOT be implemented without explicit mapping in `tasks.md`

**Rationale**: Complete documentation ensures traceability from user requirements through implementation.
Task mapping prevents scope creep and unapproved features. Unit tests provide regression safety
and serve as executable documentation of expected behavior.

### VII. Accessibility Compliance (NON-NEGOTIABLE)

**All user interfaces MUST meet WCAG 2.1 Level AA accessibility standards.** Requirements include:

- Semantic HTML with proper ARIA labels where needed
- Keyboard navigation support for all interactive elements
- Sufficient color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Screen reader compatibility verified through axe accessibility checks (Principle III)
- Focus indicators visible and clear

**Rationale**: Accessibility is a legal requirement in many jurisdictions and ethical obligation.
WCAG AA compliance ensures usability for users with disabilities, improves SEO, and benefits
all users through clearer information architecture.

## Performance Standards

**Service-Level Objectives (SLOs) for critical operations:**

- **Rating Summary Fetch**: MUST complete within 150ms (p95)
- Response time violations MUST be tracked and investigated
- Performance regression tests MUST be included in CI pipeline for SLO-critical endpoints

**Rationale**: Explicit performance targets prevent degradation over time. The 150ms target
for rating summaries ensures responsive user experience while allowing reasonable database
query and aggregation time.

## Merge Requirements

**Pull requests MUST meet the following criteria before merge:**

- All review comments resolved or explicitly deferred with documented rationale
- Branch MUST be up-to-date with target branch (main/master)
- Linear history preferred; squash or rebase before merge unless preserving detailed commit history is justified
- Merge commit message MUST reference related issue/ticket numbers

**Enforcement**: Branch protection rules MUST enforce these requirements; manual override requires documented justification and approval from repository maintainer.

## CI/CD Standards

**Continuous Integration pipeline stages:**

1. **Build**: Compile/bundle artifacts
2. **Test**: Execute unit, integration, contract, and E2E tests in parallel where possible
3. **Analyze**: Run CodeQL, Spectral, axe, and other static analysis tools
4. **Report**: Publish test coverage, performance benchmarks, and security findings

**Continuous Deployment** (when applicable):

- Deployments MUST pass all CI stages
- Staging deployment MUST precede production
- Rollback procedures MUST be documented and tested

## Governance

**This constitution supersedes all conflicting practices, guidelines, or conventions.**

Amendments require:
1. Documented proposal with rationale and impact analysis
2. Review by repository maintainers and affected stakeholders
3. Approval by repository owner or designated governance committee
4. Migration plan for existing code/processes affected by change
5. Version increment following semantic versioning (MAJOR for breaking changes, MINOR for additions, PATCH for clarifications)

**Compliance verification:**

- All PRs MUST be reviewed for constitutional compliance
- Teams MUST document justifications for any principle violations (e.g., complexity increases)
- Continuous improvement: Constitution MUST be reviewed quarterly and amended as needed

**Version**: 1.1.0 | **Ratified**: 2026-02-14 | **Last Amended**: 2026-02-14
