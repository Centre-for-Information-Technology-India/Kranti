# Kranti — AI Agent Operating Rules

Kranti is production civic software. Treat every change as a potentially user-impacting production change.

## Mission
Build reliable, low-cost civic action infrastructure that helps citizens report problems, understand legitimate options, take action, and track outcomes.

## Required reading
Before non-trivial work, read:
- docs/PRODUCT.md
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/DEVELOPMENT.md
- relevant feature/security documents
- the existing implementation being changed

Also follow the Next.js guidance below.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Non-negotiable rules

1. Inspect the current code before changing it.
2. Preserve the existing production architecture unless a documented requirement justifies a change.
3. Keep Next.js + Clerk + self-hosted Appwrite as the default architecture.
4. Do not introduce a new database, queue, cache, search engine, cloud provider, or paid service casually.
5. Never expose private citizen data or evidence.
6. Never weaken authentication, authorization, moderation, privacy, or safety checks to make a feature easier.
7. Never treat a citizen allegation as an established fact.
8. Never have AI determine guilt, invent evidence, invent authorities/laws, or autonomously accuse a person.
9. Never send an external complaint/message without explicit user confirmation.
10. Never automatically mark a case resolved.
11. Never silently swallow critical persistence failures.
12. Never put secrets, API keys, or privileged Appwrite credentials in client code.
13. Never perform destructive production-data changes without an explicit migration and rollback plan.
14. Never silently change public URLs, schemas, or status semantics.
15. Never use production data as disposable test data.
16. Avoid unrelated refactors in feature PRs.

## Workflow

**Plan -> Inspect -> Implement -> Test -> Review -> Document**

For non-trivial changes, first document the goal, current behavior, desired behavior, affected files, schema impact, authorization/privacy impact, external side effects, tests, and rollback concerns.

## Appwrite

- Existing collections and fields are the source of truth until a migration is explicitly planned.
- Use server-side Appwrite credentials only.
- Review document and storage permissions for every new data path.
- Keep public and private fields separated.
- Handle multi-step writes and cleanup explicitly.
- Prefer existing Appwrite capabilities before adding infrastructure.

## Security and privacy

Before finishing, check for IDOR, XSS, injection, SSRF, unsafe file handling, authorization bypass, private-field leakage, replay/double-submit behavior, rate-limit bypass, and sensitive logging.

## Quality gate

A meaningful change is not complete until relevant lint/build/tests pass and loading, error, empty, unauthorized, mobile, accessibility and localization states have been considered.

## Stop and request human review when

- a destructive migration is required;
- sensitive/private data exposure is possible;
- production permissions must be relaxed;
- a new paid dependency/service is required;
- legal or safety policy is ambiguous;
- autonomous external communication is proposed;
- a large architecture rewrite is proposed.

## Git discipline

Use focused branches and PRs. Keep commits small and understandable. Do not force-push or rewrite shared history unless explicitly requested.
