# API Conventions

API routes are a security boundary.

Every mutation must authenticate when required, authorize the resource/action, validate input, enforce size/rate limits, return safe errors, and avoid leaking implementation details.

Public responses contain only intentionally public fields. Do not return raw Appwrite exceptions, stack traces, secrets or private fields.

Prefer idempotent mutations where retries are possible. External side effects must record enough state to prevent accidental duplicates.

Issue support and petition signing return `notificationSaved`: `true` when the creator alert was saved, `false` when its write failed, and `null` when no alert was attempted. A saved support or signature remains successful when its secondary alert fails.

Public lists require bounded pagination. Never expose an unbounded collection query.

The public petition list reads evidence only for petitions in its bounded result set.

The signed-in dashboard reads only the citizen's own cases and cases they supported or signed. It pages through that citizen's participation records so older cases remain visible.

New petition addresses contain a readable English title prefix when available, followed by the petition ID. Hindi-only titles use `petition` as the prefix. Existing addresses stay unchanged.

Keep Appwrite credentials server-side and use least-privileged access.

Do not break existing clients/routes without a migration or compatibility strategy.
