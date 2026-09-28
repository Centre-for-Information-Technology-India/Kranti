# Testing and Quality

## Minimum
Every meaningful change should pass lint, production build and relevant tests/type checks when configured.

## Critical regression coverage
Protect report creation, auth/authorization, evidence upload/access, moderation, public case rendering, status transitions, authority/action generation, reference capture and resolution verification.

## Security
Test IDOR, unauthorized mutation/access, malformed/oversized uploads, injection/XSS, rate-limit bypass and private-field leakage.

## UX
Check mobile, slow network, loading, empty, error, retry/offline behavior where relevant, keyboard navigation, accessible labels and localization overflow.

## Production
Never use production data as disposable test data. Prefer isolated development/test projects and sanitized fixtures.

## Notification query regression
Run `node --import tsx --test src/lib/notifications.test.ts`.
This test mocks Appwrite requests and uses synthetic records only.
It checks user filtering, escaped identifiers, ordering, limits, and returned alerts.

Notification mutation tests also cover ownership, missing records, malformed IDs,
and storage failures. Single-alert updates require the authenticated Clerk owner.
Missing and foreign alerts return the same 404 response. Bulk updates preserve
owner checks and propagate storage failures. These tests never contact production.
