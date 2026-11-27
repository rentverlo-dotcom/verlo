# Signatura — QA integration contract (VERLO)

Status: technical preparation only. Never activate the provider in production until QA and partner validation are complete. Existing Identik paths stay untouched.

## Verified public API (24 Nov 2026)

- Create PDF document with multiple signers: `POST https://connect.signatura.co/api/v2/documents/create`. Bearer API key, PDF as base64 `file_content`, `signatures[].validations` including `BI`, `EM`, `PH`, `AF`, optional `invite_channel`; optional `complete_url`.
- Read document: `GET /api/v2/documents/{id}`.
- Biometrics of a **completed biometric signature**: `GET /api/v2/signatures/{id}/biometrics`, requires signature status `CO`. Response contains document ID number and private photos; never log or store in analytics. Photo URLs expire.
- Signed artifacts: `GET /api/v2/documents/{id}/download/zipfile`, `pdf-certificate`, `document`. Archive in private storage after verifying status/ownership.
- Webhook: POST with `X-Signature-SHA256`, hex secret decoded to binary for HMAC over exact raw request bytes. Response HTTP 200 within 5s, retries bounded; events may duplicate/out-of-order. `DC` and `new_status: CO` means document completed. Authenticate, persist idempotently, and asynchronously reconcile with GET before archive/signature advancement.

Official documentation:
https://docs.signatura.co/docs/tutorials/create-document
https://docs.signatura.co/docs/tutorials/biometrics
https://docs.signatura.co/docs/tutorials/download-proofs
https://docs.signatura.co/docs/webhooks

## Provider-specific questions blocking activation

1. Independent biometric verification **before** a contract exists: the public guide only documents biometrics tied to a completed signature. Obtain exact demo endpoint, authorization, request/response, callbacks, liveness criteria, retry policy, price, and test credentials. Commercial confirmation alone is not an API contract.
2. Embedded signature UI: obtain official supported embed URL / SDK and its security semantics. Do not guess an iframe path.
3. Invitation suppression: confirm API to prevent provider emails and safely obtain per-signer URLs so VERLO alone sends invitations.
4. Sandbox credential format and exact base URL (provider may use different host). Do not put secrets into GitHub or chat.
5. Official response schema and status transitions, webhooks for biometric onboarding, billing rate limits, and whether signed PDF finalization differs from the sample docs.

## VERLO invariants for adapter wiring

- First: all relevant users pass independent mandatory DNI-front/back, selfie and proof-of-life; deny bypass or stale result. Persist only provider references, status, timestamps and securely stored evidence in approved storage; do not leak PII/tokens into PostHog.
- Match generation / acceptance / commercial steps stay unchanged.
- Signing only after both parties have contract readiness, verified identity, and VERLO payment gate; for **caucion VERLO only** also require PowerMarket current valid precalification and confirmed payment on the corresponding contract/application. No caucion must never depend on partner.
- Sign each participant under their own authenticated VERLO identity; return to Mi VERLO.
- Store final PDF, audit certificate and evidence ZIP privately; ensure each owner/tenant authorized for download.
- Keep provider-switch mechanism isolated; do not migrate prod or remove Identik during QA.
- Do not repeat unaffected matching/Temporarios/MP tests. Test only changed identity + signing + notification + download integration, and final focused regression.

## Required environment settings (Preview only)

- `SIGNATURA_API_KEY` (secret).
- `SIGNATURA_API_BASE_URL` only if provider demo differs from default.
- `SIGNATURA_WEBHOOK_SECRET` (64-char hex secret for HMAC).
- `SIGNATURA_ALLOW_DEMO_HOST` only if provider explicitly supplies a separate Preview host.

QA branch preparation: `lib/signatura/client.ts`, `tests/qa/signatura-adapter.spec.ts`. No live provider requests have been sent, no database writes or deployments to production.
