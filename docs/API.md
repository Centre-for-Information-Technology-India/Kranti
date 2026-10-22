# API Conventions

API routes are a security boundary.

Issue and petition evidence links, including supplied file-view URLs, accept HTTP or HTTPS only. Unsafe schemes fail validation before any case or evidence write.
Incident report evidence links and supplied file-view URLs follow the same rule. The shared evidence field rejects unsafe schemes before submission.
Public issue and petition reads withhold unsafe saved evidence URLs, including links stored before this validation rule. The evidence record and count remain intact.

Every mutation must authenticate when required, authorize the resource/action, validate input, enforce size/rate limits, return safe errors, and avoid leaking implementation details.

Public responses contain only intentionally public fields. Do not return raw Appwrite exceptions, stack traces, secrets or private fields.

Prefer idempotent mutations where retries are possible. External side effects must record enough state to prevent accidental duplicates.

Issue support and petition signing return `notificationSaved`: `true` when the creator alert was saved, `false` when its write failed, and `null` when no alert was attempted. A saved support or signature remains successful when its secondary alert fails.
Petition signing uses the authenticated Clerk user ID. If the optional signer profile lookup fails, the signature still saves and the creator alert uses a generic signer name.
Petition signing returns account retry guidance when Clerk authentication fails before any Appwrite write. An uncertain signature save still asks the citizen to check the petition before retrying.
Issue support returns a safe HTTP 503 JSON response when its result cannot be confirmed. Retrying the same support cannot create a second support record.
Issues awaiting review and rejected issues cannot receive new support through a saved direct link. The support route returns HTTP 404 before any support or alert write.
Issue support uses the authenticated Clerk user ID. If the optional supporter profile lookup fails, the support still saves and the creator alert uses a generic name.
Alert read updates return safe HTTP 503 JSON when Appwrite cannot confirm the result. The dashboard reloads alerts before another try.
Bulk alert read updates give account retry guidance if Clerk fails before any Appwrite request.
Single-alert read updates give account retry guidance if Clerk authentication fails before any Appwrite request.
Alert list reads return safe HTTP 503 JSON when Appwrite cannot load alerts. The dashboard offers retry.
Alert list reads give account retry guidance if Clerk authentication fails before any Appwrite request. Unsigned access remains HTTP 401.
Alert list replies include display fields and read status, but not the stored owner ID or other Appwrite metadata. Ownership remains enforced by the server-side query.
Account sync returns safe HTTP 503 JSON when Clerk cannot load the signed-in account. No Appwrite write starts in that case.
Account sync also returns safe HTTP 503 JSON if Clerk authentication throws before a user ID is available. Unsigned requests remain HTTP 401.
Account sync returns only success, the authenticated account ID, and an optional linked flag. It never returns the stored account document.
Role checks use the authenticated Clerk ID first. The role API loads a Clerk profile only for the verified-email fallback to a seeded account; profile failures cannot block already-linked roles.
The role API returns safe HTTP 503 retry guidance if Clerk authentication fails before a role lookup. Unsigned requests still return HTTP 401.
The admin page gate also checks linked roles before asking Clerk for a verified email. A foreign Clerk ID cannot inherit a stored admin or moderator role.

Issue creation accepts no evidence or a list of valid evidence metadata. Malformed evidence metadata returns HTTP 400 before file or issue writes.
Issue creation rejects JSON request bodies over 1 MiB with HTTP 413 before any Appwrite write.
Issue creation returns safe HTTP 503 when a save result cannot be confirmed. The citizen must check the dashboard before retrying.
Issue creation returns safe HTTP 503 before any Appwrite write when Clerk cannot load the signed-in account.
Issue creation gives account retry guidance if Clerk authentication throws before any Appwrite request. Unsigned access remains HTTP 401.
An account lookup exception uses the same pre-write retry message. It does not imply an issue may already have saved.
Successful issue creation returns `ok`, `issueId`, `issueSlug`, and `evidenceSaved`. If evidence metadata fails after the issue saves, `evidenceSaved` is false so the creator can check the saved issue without submitting a duplicate. It does not return the stored issue document or evidence metadata.
Petition creation rejects JSON request bodies over 1 MiB with HTTP 413 before any Appwrite write.
Petition creation returns safe HTTP 503 JSON when Clerk cannot load the signed-in account. No Appwrite write starts in that case.
Petition creation also gives account retry guidance if Clerk authentication throws before any Appwrite request. Unsigned access remains HTTP 401.
Successful petition creation returns `ok`, `petitionId`, `petitionSlug`, and `evidenceSaved`. A false `evidenceSaved` means the petition saved but its evidence metadata did not. The creator should keep the evidence and open the saved petition instead of submitting it again. The response does not return the stored petition document or evidence metadata.
Incident report creation rejects JSON request bodies over 1 MiB with HTTP 413 before evidence processing or Appwrite writes.
Incident report creation returns safe HTTP 503 JSON before any Appwrite write when Clerk cannot load the signed-in account.
Incident report creation also gives account retry guidance if Clerk authentication throws before any write. Unsigned access remains HTTP 401.
An incident account lookup exception uses that pre-write retry message, not uncertain-save guidance.
Incident report creation returns safe HTTP 503 JSON when its save result cannot be confirmed. The dashboard does not list incident reports, so keep the draft and contact Kranti before retrying.
Successful incident report creation returns `ok`, `reportId`, `reportSlug`, and `evidenceSaved`. A false `evidenceSaved` means the report saved but its evidence metadata did not. The creator should keep the evidence and use the saved report reference instead of submitting it again. The response does not return the stored report document or evidence metadata.
Moderator actions reject JSON request bodies over 1 MiB with HTTP 413 before issue or moderation-log writes.
Moderator actions give account retry guidance if Clerk authentication fails before any role lookup or write. Unsigned access remains HTTP 401.
Moderator actions return safe HTTP 503 JSON when a status update or its audit write cannot be confirmed. After an audit failure, refresh the issue and check its review record before trying again.
After a confirmed review record, moderator actions try to alert the issue creator. The response reports `notificationSaved`: `true` if saved, `false` if the alert failed, and `null` if no creator is known. An alert failure does not undo the status change.
Issue comments reject JSON request bodies over 1 MiB with HTTP 413 before issue lookup or comment writes.
Successful issue comment creation returns the public comment fields used by the page. It does not return the stored user ID or other Appwrite document fields.
Issue comment creation uses the authenticated Clerk account ID. A failed optional profile lookup falls back to a generic display name and does not block the save.
Issue comment creation returns safe HTTP 503 JSON if its save cannot be confirmed. Check the discussion before retrying to avoid duplicate comments.
Issue comment creation gives account retry guidance if Clerk authentication fails before any Appwrite write.
Campaign creation rejects JSON request bodies over 1 MiB with HTTP 413 before campaign lookups or writes.
Campaign creation returns safe HTTP 503 JSON before any Appwrite write when Clerk cannot load the signed-in account.
Campaign creation gives account retry guidance if Clerk authentication fails before any Appwrite request. Unsigned access remains HTTP 401.
Campaign creation returns safe HTTP 503 JSON when its save result cannot be confirmed. Check the dashboard before trying again.

Public lists require bounded pagination. Never expose an unbounded collection query.

Public campaign list and detail reads return safe HTTP 503 JSON when the data service fails. Missing campaign details still return HTTP 404. The campaign pages offer retry.
Public campaign list and detail replies omit stored creator account IDs. Creator display names remain available.

Petition detail reads return safe HTTP 503 JSON when the petition itself is unavailable. The page offers retry.
If its separate evidence lookup fails, the public petition remains readable with any evidence already loaded and `evidenceUnavailable: true`. The page shows a partial-load notice; the stored `evidence_count` is unchanged.
Petition detail reads page through linked evidence, up to 1,000 records. A later read failure or that limit keeps earlier evidence visible and sets `evidenceUnavailable: true`.
Public petition details remain readable if Clerk cannot check signing state. In that case `hasSigned` is false; signing still requires authentication.
Public petition details also remain readable if the optional signature lookup fails. In that case `hasSigned` is false; the signing route checks existing signatures before saving.
Petition signing accepts only `open` and `in_progress` petitions. Other statuses return HTTP 409 before any signature read or write.
Public petition lists include only `open`, `in_progress`, `successful`, and `resolved` before pagination. Saved links with any other status return HTTP 404 before evidence or creator reads.
Non-public petition pages also omit petition details from metadata and structured page data.
Petition detail still loads with a generic creator name if optional creator-profile lookups fail.
Signed-in alert reads return up to 50 records by default, with `hasMore` and an `offset` from 0 to 10000 for older alerts. The existing `limit` option stays capped at 100.

The public petition list reads evidence only for petitions in its bounded result set.
It pages through linked evidence for those petitions, up to 1,000 records per list request. If that bound is reached, it reports evidence as incomplete.
If an evidence read fails, the list stays readable and returns `evidenceUnavailable: true` with any records already loaded. Stored evidence counts stay unchanged; the page shows a retry notice.
Creator-profile lookups are optional for petition lists. Missing names use "Citizen"; petition read failures still stop the list.
Public petition list and detail replies omit the stored creator account ID. Creator display names remain available.
Public issue and petition evidence uses a generic display name. Uploaded filenames remain out of public replies and issue pages.
The public petition list returns up to 25 petitions per request. Use an `offset` from 0 to 10000 and the `hasMore` flag to read older petitions.
At the offset cap, `hasMore` is false even when more records exist beyond the supported range.

The public issue list reads evidence and creator profiles only for issues in its bounded result set.
It pages through linked evidence for those issues, up to 1,000 records per list request. If that bound is reached, it reports evidence as incomplete.
If an evidence read fails, the list stays readable and returns `evidenceUnavailable: true` with any records already loaded. Stored evidence counts stay unchanged; the page shows a retry notice.
The public issue list and saved links allow only `open`, `in_progress`, `escalated`, and `resolved` issues. Other statuses stay off public pages, metadata, comments, and support. Creators and reviewers may still read their own non-public issue pages.
Creator-profile lookups are optional for issue lists. Missing names use "Citizen Reporter"; only an issue read failure stops the list.
Public issue list replies omit stored creator account IDs. Signed-in moderators and admins can see those IDs for review.
The public issue list returns up to 25 issues per request, newest first by Appwrite creation time. Use an `offset` from 0 to 10000 and the `hasMore` flag to read older issues.

An issue detail page reads only evidence and comments linked to that issue and the creator's profile. These reads are bounded.
Review-pending and rejected issue pages and their comments are hidden from public readers, including saved direct links. The creator, moderators, and admins may still read the issue page. New comments on review-pending or rejected issues are not accepted.
Creator-profile lookups are optional for issue details. Missing names use "Citizen Reporter". An issue read failure stops the page. A separate evidence read failure keeps the case visible and offers an evidence retry without claiming no evidence exists. A comment read failure keeps the case visible and offers a comment retry.

The public issue-comment endpoint returns at most 100 approved comments per request. Use an `offset` from 0 to 10000 and the `hasMore` response flag to read later pages. Issue detail pages start with the first 100 approved comments and let readers load later pages.

The default public campaign list returns up to 25 campaigns per request. Use an `offset` from 0 to 10000 and the `hasMore` flag to read older campaigns. Existing visibility filters still apply. Explicit status queries keep their prior 100-result limit and do not accept a later offset while campaign review remains pending.

The signed-in dashboard reads only the citizen's own cases and cases they supported or signed. It pages through that citizen's participation records so older cases remain visible.
The dashboard keeps a creator's own non-public issues and petitions visible to that creator. A past supporter or signer sees a case there only while its status is allowed on the public list.
The dashboard returns safe HTTP 503 retry guidance if Clerk authentication fails before any case read. Unsigned access remains HTTP 401.
The dashboard response contains case lists only. The client reads its signed-in profile from Clerk; the case API does not return that profile.
Dashboard case lists omit stored creator IDs. The server uses those IDs only to group owned and backed cases.
Creator-name lookups are optional for dashboard case lists. If a profile query fails, the cases still load with generic creator names.

New petition addresses contain a readable English title prefix when available, followed by the petition ID. Hindi-only titles use `petition` as the prefix. Existing addresses stay unchanged.

New issue addresses contain a readable English title prefix when available, followed by the issue ID. Hindi-only titles use `issue` as the prefix. Existing addresses stay unchanged.

Keep Appwrite credentials server-side and use least-privileged access.

Do not break existing clients/routes without a migration or compatibility strategy.
