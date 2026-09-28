# Kranti Product Requirements Document — v1

## Objective
Evolve the existing production Kranti platform into reliable civic-action infrastructure without rewriting the application.

Core loop:
**Report -> Prepare action -> Citizen sends -> Track -> Follow up -> Resolve.**

## Primary users
- Citizen: has a civic problem and needs to know what to do next.
- Community member: finds a nearby case and contributes support/evidence.
- Moderator: reviews submissions, evidence and safety risks.
- Researcher/NGO/journalist: uses structured public information with clear provenance.
- Maintainer: operates the system at low cost.

## V1 priority
Start with ordinary civic problems: roads, water/drainage, waste, streetlights, infrastructure and local government services.

Sensitive categories such as corruption/bribes require stronger moderation and privacy controls.

## Core capabilities
### Reporting
Mobile-first report creation, location confirmation, structured category/description, optional evidence, moderation lifecycle, and duplicate detection.

### Civic action
Identify the likely responsible authority, show official channels, generate a complaint draft from user-provided facts, require explicit review before sending, and record official reference numbers.

### Tracking
Case timeline, actions, follow-ups, authority responses, resolution evidence, and clear distinction between citizen claims, platform verification and official statements.

### Community
Support/join existing cases, contribute factual updates, discover nearby cases, and receive material case updates.

### Trust
Moderation, evidence controls, audit trail, privacy controls, transparent status definitions.

## Lifecycle
draft -> submitted -> moderation_review -> published -> action_prepared -> action_initiated -> awaiting_response -> response_received -> follow_up -> claimed_resolved -> verification -> resolved

Other states may include rejected, withdrawn, archived and duplicate.

Do not add a status without documenting its meaning and valid transitions.

## AI
AI may classify, extract facts, translate, summarize, suggest missing information/authorities, draft complaints from supplied facts, detect likely duplicates, and assist moderation triage.

AI must not determine truth/guilt, fabricate facts/evidence/official details, autonomously publish sensitive reports, autonomously resolve cases, or send external communications.

## Non-functional requirements
- Production-safe incremental changes.
- Mobile-first and accessible.
- Strong server-side authorization.
- Idempotent mutations where retries are possible.
- Graceful Appwrite failure handling.
- No silent data loss.
- No secrets in client code/source control.
- Minimal new infrastructure.

## Definition of done
Behavior, authorization, loading/error/empty states, mobile UX, relevant tests/lint/build, documentation, privacy/safety review, and unrelated-change isolation are all addressed.
