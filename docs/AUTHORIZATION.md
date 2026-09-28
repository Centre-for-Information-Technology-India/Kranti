# Authorization Model

Authentication answers who the user is. Authorization answers what the identity may do.

## Rules
- Validate Clerk identity server-side.
- Safely map identity to the application/Appwrite user.
- Enforce Appwrite document/storage permissions server-side.
- Treat client IDs, roles and visibility as untrusted.
- Check ownership or moderator/admin permission before mutations.
- Check visibility before reads.
- Authorize evidence downloads independently of case-page authorization.

## Private data
May include reporter identity, contact details, exact sensitive locations, private evidence, moderation notes and internal audit data.

Never return private fields from a public API merely because a database query returned them.

## Privileged actions
Moderator/admin actions require explicit server-side role checks. Hiding a UI control is not authorization.

## New endpoints
Document authentication, authorization, accepted input, public/private output fields and rate-limit/abuse considerations.
