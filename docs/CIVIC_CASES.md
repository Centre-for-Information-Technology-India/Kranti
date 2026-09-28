# Civic Case Lifecycle

A Civic Case is the central unit of Kranti's action workflow.

## States
- draft: created but not submitted.
- submitted: submitted by citizen; not yet approved for publication.
- moderation_review: awaiting safety/content review.
- published: publicly visible under its visibility policy.
- action_prepared: civic action prepared for user review.
- action_initiated: citizen explicitly initiated the official action.
- awaiting_response: action initiated and response pending.
- response_received: authority/material response recorded.
- follow_up: further citizen action required.
- claimed_resolved: someone claims resolution; not yet verified.
- verification: resolution evidence being checked.
- resolved: documented resolution criteria met.
- rejected: submission rejected for a documented reason.
- withdrawn: reporter withdrew.
- duplicate: duplicate linked to a canonical case.

## Transition rules
Every transition must be authorized, have a clear reason, be auditable when material, and preserve prior state history.

The UI must never present a citizen allegation as an established fact.

## Resolution
resolved requires documented evidence appropriate to the case type. An authority's statement may be recorded as an official statement, but should not automatically become independently verified resolution.

## Duplicates
Prefer one canonical case for the same real-world issue while preserving contributors' evidence and participation.
