# Evidence Handling

Evidence is one of Kranti's most sensitive assets.

## Upload flow
1. Authenticate/authorize uploader.
2. Validate size and file type server-side.
3. Reject unsupported content.
4. Sanitize/process media where appropriate.
5. Store with controlled Appwrite Storage permissions.
6. Persist evidence metadata after successful storage.
7. Clean up storage if persistence fails.
8. Never expose storage credentials.

## Publication
Evidence becomes public only through explicit moderation/publication. A public case must not automatically make every attachment public.

## Metadata
Avoid publishing EXIF/GPS, device data or filenames containing personal information.

## Deletion
Consider database references, storage objects, cached/public copies and audit requirements. Do not casually delete evidence.

## AI
Do not send sensitive evidence to external AI providers by default.

## Failure
Never silently swallow evidence persistence failures. Partial uploads must result in a recoverable state.
