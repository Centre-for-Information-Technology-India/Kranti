# AI Agent Development Protocol

AI coding agents must behave like cautious maintainers, not autonomous architects.

## Before coding
Read AGENTS.md, docs/PRODUCT.md, docs/PRD.md, docs/ARCHITECTURE.md, relevant feature/security docs, then inspect the actual implementation.

## Required plan
For non-trivial work record:
- goal;
- current behavior;
- desired behavior;
- affected files;
- schema/data impact;
- authorization impact;
- privacy/safety impact;
- external side effects;
- testing plan;
- rollback/migration concerns.

## Implementation
- Make the smallest safe change.
- Preserve production behavior unless requirements explicitly change it.
- Do not rewrite working modules merely for style.
- Do not add dependencies without reason.
- Do not add infrastructure without approval.
- Do not change URLs without a migration plan.
- Do not change Appwrite schema without documenting it.
- Do not weaken permissions.
- Do not suppress critical errors.
- Never commit secrets.

## Quality
Run relevant lint/build/tests. For user-facing work check mobile, desktop, loading, empty, error, unauthorized, moderation-restricted, accessibility and localization states.

## Security review
Check IDOR, unauthorized mutation/access, private-field leakage, evidence URL bypass, replay/double-submit, malformed files, injection/XSS/SSRF, rate-limit bypass and sensitive logging.

## Git
Use focused branches, small commits and PRs. Never force-push/rewrite shared history unless explicitly requested.

## Stop for human review
Stop when a destructive migration, broad permission relaxation, new paid service, ambiguous safety/legal decision, autonomous external communication, sensitive-data exposure risk, or large architecture rewrite is required.

## Done
Code, tests, documentation and operational considerations must agree.
