# Kranti Data Model Rules

Existing Appwrite collections/fields remain authoritative until an explicit migration is designed and approved.

## Core entities
### CivicCase
id, type, title, description, category, status, visibility, location, reporter reference, timestamps, publication/resolution state.

### Evidence
caseId, storage reference, type, sanitized metadata, visibility, moderation status, uploader reference, timestamps.

### Authority
name, jurisdiction, department, category coverage, official channels, source/verification metadata, active status.

### CivicAction
caseId, action type, target authority, generated content/reference, status, initiatedAt, external reference number, user confirmation metadata.

### CaseEvent
caseId, event type, actor reference/type, public/private payload, timestamp.

### Resolution
caseId, status, explanation, evidence references, source, verification status, timestamps.

## Rules
- Do not add fields for agent convenience.
- Reuse existing semantics where they match.
- Avoid duplicating facts.
- Reference large evidence objects rather than embedding them.
- Never store secrets in Appwrite documents.
- Never put private moderation notes in public documents.

## Migration checklist
Current schema inspection -> compatibility impact -> migration/backfill -> rollback -> permission review -> test-data verification.

Never delete/rename a production field merely because it appears unused.
