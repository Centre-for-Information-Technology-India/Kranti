# Kranti Architecture

## Current baseline
Production Next.js 16 App Router + React 19 + Tailwind CSS v4 + Clerk + self-hosted Appwrite, with existing maps, i18n, moderation, evidence and admin capabilities.

The actual codebase is authoritative. These docs do not authorize a replacement architecture.

## Target direction
Prefer a modular monolith:

Browser -> Next.js -> server-side services -> self-hosted Appwrite

Use Appwrite Functions only where a background/serverless boundary is genuinely useful.

## Cost rule
Before adding a managed service, prove the current stack cannot meet the requirement, justify cost/complexity, review privacy implications, and document simpler alternatives.

## Logical modules
identity, civic cases, evidence, authorities, actions, community, moderation, notifications, analytics/transparency.

Do not create separate deployable services merely to mirror these boundaries.

## Data integrity
Validate input, authorize, use idempotency where retries are possible, handle partial failure explicitly, never swallow critical persistence errors, and audit important state changes.

## Authorization
Clerk establishes identity; backend/Appwrite permissions enforce access. Never trust client user IDs, roles or visibility fields.

## Public data
Return only intentionally public fields. Private evidence, reporter data, moderation notes and internal metadata must never leak through public APIs.

## Evidence
Private by default. Validate file type/size/content server-side, sanitize where appropriate, and never expose storage credentials.

## External actions
Preparing a complaint is internal. Sending it externally is a side effect requiring explicit citizen confirmation.

## Observability
Use lightweight structured logs/metrics. Never log secrets, tokens, private evidence contents or unnecessary personal data.
