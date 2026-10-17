# API Conventions

API routes are a security boundary.

Every mutation must authenticate when required, authorize the resource/action, validate input, enforce size/rate limits, return safe errors, and avoid leaking implementation details.

Public responses contain only intentionally public fields. Do not return raw Appwrite exceptions, stack traces, secrets or private fields.

Prefer idempotent mutations where retries are possible. External side effects must record enough state to prevent accidental duplicates.

Issue support and petition signing return `notificationSaved`: `true` when the creator alert was saved, `false` when its write failed, and `null` when no alert was attempted. A saved support or signature remains successful when its secondary alert fails.
Petition signing uses the authenticated Clerk user ID. If the optional signer profile lookup fails, the signature still saves and the creator alert uses a generic signer name.
Issue support returns a safe HTTP 503 JSON response when its result cannot be confirmed. Retrying the same support cannot create a second support record.
Issue support uses the authenticated Clerk user ID. If the optional supporter profile lookup fails, the support still saves and the creator alert uses a generic name.
Alert read updates return safe HTTP 503 JSON when Appwrite cannot confirm the result. The dashboard reloads alerts before another try.
Alert list reads return safe HTTP 503 JSON when Appwrite cannot load alerts. The dashboard offers retry.
Alert list replies include display fields and read status, but not the stored owner ID or other Appwrite metadata. Ownership remains enforced by the server-side query.
Account sync returns safe HTTP 503 JSON when Clerk cannot load the signed-in account. No Appwrite write starts in that case.
Account sync returns only success, the authenticated account ID, and an optional linked flag. It never returns the stored account document.
Role checks use the authenticated Clerk ID first. The role API loads a Clerk profile only for the verified-email fallback to a seeded account; profile failures cannot block already-linked roles.
The admin page gate also checks linked roles before asking Clerk for a verified email. A foreign Clerk ID cannot inherit a stored admin or moderator role.

Issue creation accepts no evidence or a list of valid evidence metadata. Malformed evidence metadata returns HTTP 400 before file or issue writes.
Issue creation rejects JSON request bodies over 1 MiB with HTTP 413 before any Appwrite write.
Issue creation returns safe HTTP 503 when a save result cannot be confirmed. The citizen must check the dashboard before retrying.
Issue creation returns safe HTTP 503 before any Appwrite write when Clerk cannot load the signed-in account.
Successful issue creation returns only `ok`, `issueId`, and `issueSlug`. It does not return the stored issue document or evidence metadata.
Petition creation rejects JSON request bodies over 1 MiB with HTTP 413 before any Appwrite write.
Petition creation returns safe HTTP 503 JSON when Clerk cannot load the signed-in account. No Appwrite write starts in that case.
Successful petition creation returns only `ok`, `petitionId`, and `petitionSlug`. It does not return the stored petition document or evidence metadata.
Incident report creation rejects JSON request bodies over 1 MiB with HTTP 413 before evidence processing or Appwrite writes.
Incident report creation returns safe HTTP 503 JSON before any Appwrite write when Clerk cannot load the signed-in account.
Incident report creation returns safe HTTP 503 JSON when its save result cannot be confirmed. Check the dashboard before retrying.
Successful incident report creation returns only `ok`, `reportId`, and `reportSlug`. It does not return the stored report document or evidence metadata.
Moderator actions reject JSON request bodies over 1 MiB with HTTP 413 before issue or moderation-log writes.
Moderator actions return safe HTTP 503 JSON when a status update or its audit write cannot be confirmed. After an audit failure, refresh the issue and check its review record before trying again.
Issue comments reject JSON request bodies over 1 MiB with HTTP 413 before issue lookup or comment writes.
Successful issue comment creation returns the public comment fields used by the page. It does not return the stored user ID or other Appwrite document fields.
Issue comment creation uses the authenticated Clerk account ID. A failed optional profile lookup falls back to a generic display name and does not block the save.
Issue comment creation returns safe HTTP 503 JSON if its save cannot be confirmed. Check the discussion before retrying to avoid duplicate comments.
Campaign creation rejects JSON request bodies over 1 MiB with HTTP 413 before campaign lookups or writes.

Public lists require bounded pagination. Never expose an unbounded collection query.

Public campaign list and detail reads return safe HTTP 503 JSON when the data service fails. Missing campaign details still return HTTP 404. The campaign pages offer retry.
Public campaign list and detail replies omit stored creator account IDs. Creator display names remain available.

Petition detail reads return safe HTTP 503 JSON when Appwrite is unavailable. The page offers retry.
Petition detail still loads with a generic creator name if optional creator-profile lookups fail.
The public petition list reads evidence only for petitions in its bounded result set.
Creator-profile lookups are optional for petition lists. Missing names use "Citizen"; petition and evidence read failures still stop the list.
Public petition list and detail replies omit the stored creator account ID. Creator display names remain available.
The public petition list returns up to 25 petitions per request. Use an `offset` from 0 to 10000 and the `hasMore` flag to read older petitions.
At the offset cap, `hasMore` is false even when more records exist beyond the supported range.

The public issue list reads evidence and creator profiles only for issues in its bounded result set.
Creator-profile lookups are optional for issue lists. Missing names use "Citizen Reporter"; issue and evidence read failures still stop the list.
Public issue list replies omit stored creator account IDs. Signed-in moderators and admins can see those IDs for review.
The public issue list returns up to 25 issues per request, newest first by Appwrite creation time. Use an `offset` from 0 to 10000 and the `hasMore` flag to read older issues.

An issue detail page reads only evidence and comments linked to that issue and the creator's profile. These reads are bounded.

The public issue-comment endpoint returns at most 100 approved comments per request. Use an `offset` from 0 to 10000 and the `hasMore` response flag to read later pages. Issue detail pages start with the first 100 approved comments and let readers load later pages.

The default public campaign list returns up to 25 campaigns per request. Use an `offset` from 0 to 10000 and the `hasMore` flag to read older campaigns. Existing visibility filters still apply. Explicit status queries keep their prior 100-result limit and do not accept a later offset while campaign review remains pending.

The signed-in dashboard reads only the citizen's own cases and cases they supported or signed. It pages through that citizen's participation records so older cases remain visible.
The dashboard response contains case lists only. The client reads its signed-in profile from Clerk; the case API does not return that profile.
Dashboard case lists omit stored creator IDs. The server uses those IDs only to group owned and backed cases.
Creator-name lookups are optional for dashboard case lists. If a profile query fails, the cases still load with generic creator names.

New petition addresses contain a readable English title prefix when available, followed by the petition ID. Hindi-only titles use `petition` as the prefix. Existing addresses stay unchanged.

New issue addresses contain a readable English title prefix when available, followed by the issue ID. Hindi-only titles use `issue` as the prefix. Existing addresses stay unchanged.

Keep Appwrite credentials server-side and use least-privileged access.

Do not break existing clients/routes without a migration or compatibility strategy.
