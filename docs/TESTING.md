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
