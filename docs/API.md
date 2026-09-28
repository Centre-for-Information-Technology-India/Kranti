# API Conventions

API routes are a security boundary.

Every mutation must authenticate when required, authorize the resource/action, validate input, enforce size/rate limits, return safe errors, and avoid leaking implementation details.

Public responses contain only intentionally public fields. Do not return raw Appwrite exceptions, stack traces, secrets or private fields.

Prefer idempotent mutations where retries are possible. External side effects must record enough state to prevent accidental duplicates.

Public lists require bounded pagination. Never expose an unbounded collection query.

Keep Appwrite credentials server-side and use least-privileged access.

Do not break existing clients/routes without a migration or compatibility strategy.
