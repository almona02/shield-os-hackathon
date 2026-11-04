# SHIELD.OS — Evidence review and tamper-evident workshop approvals

A hackathon prototype for spare-parts procurement: inspect visual evidence, record a human decision, and review a hash-linked history in English or Arabic.

- [Live demo](https://shield-os-hackathon.vercel.app)
- [Dashboard](https://shield-os-hackathon.vercel.app/shield)
- [Pitch](docs/PITCH.md) · [90-second recording script](docs/demo-script.md) · [Release checklist](docs/SUBMISSION.md)

## Problem and scope

ALMONA's workshop domain motivates a concrete question: can a reviewer understand what evidence accompanied a spare-part request and see whether its recorded history has changed? SHIELD.OS explores that workflow independently of the larger [ALMONA Reality OS project](https://github.com/almona02/almona-portfolio-forge).

This is a demonstration with simulated identities, not a production fraud-prevention system. Use synthetic data only. Workshop adoption, fraud savings, and accuracy have not been established by this repository.

## What runs

| Component | Behavior | Boundary |
|---|---|---|
| SAM 3.1 | Searches for the requested object category, returns detection count and available confidence | Does not authenticate invoices, identify an exact SKU, or establish ownership/condition |
| Meta risk analysis | Configurable model explains ledger anomalies in EN/AR | `meta_llama` is the legacy source marker for validated model output; inspect `model` for the actual model |
| Local rules | Used when the risk model is unavailable or returns invalid output | Explicit fallback reason; never presented as model output |
| Filename simulation | Demonstrates accept/reject workflow without an image API call | Always `source: mock`; not evidence of vision capability |
| Event ledger | Hash-linked events; Supabase adapter or in-memory fallback | Migration includes UPDATE/DELETE trigger; live database enforcement requires separate verification |
| Approval core | Rejects self-approval, duplicate approvers and out-of-order transitions | API identities are client-supplied and pending requests live in a process-local Map |

Image/API failures return `unavailable`; they do not silently become successful filename checks. Only requested-category prompts are tried. Detecting a person cannot validate a motor. `photo_hash` is SHA-256 of the submitted reference string, **not a fingerprint of the image bytes**.

## Run and validate

```bash
npm ci
cp .env.example .env.local
npm test
npm run typecheck
npm run build
npm run dev
```

Configure only credentials you own. `.env.example` shows the Meta Responses API with `muse-spark-1.3`; use a model enabled for your account. Existing Llama configurations can retain their model and chat-completions endpoint. Both response formats are supported. SAM uses its separate Responses endpoint. A configured key does not prove a successful call: inspect runtime provenance.

For image inputs use an `images.unsplash.com` HTTPS URL or a PNG/JPEG/WebP base64 data URL. Other remote hosts are deliberately not proxied. Use an actual photo of the expected object; the old prefilled workshop photo is not evidence of a motor.

Supabase configuration selects the database-backed ledger; absent configuration selects memory. This patch does not apply migrations or verify the deployed database. `POST /api/tamper` is disabled: a destructive privileged probe against live genesis is unsafe. HTTP 405 demonstrates the API boundary only.

## Known limitations before a workshop pilot

- No authenticated identities, tenant isolation, rate limiting, or enforced manager authorization.
- Existing SQL permits anonymous ledger inserts and broad approvals access; do not use it for real customer records.
- Pending approvals and anomaly context are process-local; cold starts/multiple instances can lose or disagree on state.
- Ledger append is read-then-write, not a database transaction; concurrent writes may conflict. Approval plus event persistence is not atomic.
- Full-chain retrieval does not yet paginate beyond the database row cap.
- Hash checking cannot establish truth of original inputs or detect a privileged full rewrite without an independent checkpoint. Recording time is not included in the current event hash.
- Risk is an uncalibrated review signal, not probability or proof of fraud. Off-hours rules use UTC and need workshop-specific schedules.
- Tests use synthetic data and mocked provider responses; they do not establish live model accuracy or database enforcement.

## Provenance

Core source comments identify Reality OS modules that informed this extraction. The hackathon contribution is this standalone workflow and its model integration. Commit count is not used as evidence of product readiness. Verify any tool-use or business-history claims before submitting them.

MIT — see [LICENSE](LICENSE).
