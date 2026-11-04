# SHIELD.OS

**Tamper-evident workshop approvals with Meta-powered risk signals for human review.**

Meta Global AI Developer Hackathon 2026 · Cerebral Valley submission

> Who · Where · When · What · Approved by — recorded in an append-only, hash-chained ledger.

| | |
|---|---|
| Live app | https://shield-os-hackathon.vercel.app |
| Dashboard | https://shield-os-hackathon.vercel.app/shield |
| Demo video | *(paste Loom URL before submit)* |
| Repository | https://github.com/almona02/shield-os-hackathon |
| Parent project | https://github.com/almona02/almona-portfolio-forge |

Pitch text for the form: [`docs/PITCH.md`](./docs/PITCH.md)  
Submission checklist: [`docs/SUBMISSION.md`](./docs/SUBMISSION.md)

---

## Context

Almona Co. is an authorized YILMAZ dealer in Egypt (since 1991). We are building **Almona Vertical Reality OS** for machinery discovery, workshop planning, Fabricator Pro, and service history.

Fabricator Pro is engineering-complete in many areas (~1,539 commits) but still in **pilot**. SHIELD.OS extracts the governance core so judges can inspect it on its own.

## What problem we address

Spare-part and service approvals often live in editable sheets. Later edits make it hard to trust who approved what. Heavy enterprise tools are often a poor fit for a workshop floor.

## What this demo shows

Three small modules:

1. **immutable-log** — hash-chained, append-only event ledger  
2. **approval-chain** — ordered approval, no self-approval  
3. **anomaly-engine** — risk signals for human review (not silent blocks)

```
Action → append-only log → Meta model check → approval
```

## Meta AI in this project

| Capability | What it does | What you will see |
|---|---|---|
| Muse Spark 1.3 | Summarizes recent events (EN / AR) | `Source: muse-spark-1.3 \| Meta Model API (LIVE)` or a labeled fallback |
| SAM 3.1 | Object localization + category relevance | `LIVE SAM 3.1 — object localization` and a relevance % |
| Filename demo rule | Rejects names like `fake-invoice.png` | `MOCK DEMO — filename rule (not SAM)` |

Please note:

- SAM scores **visual relevance** to the requested category. It does not prove a photo is authentic.  
- The Muse score is an **uncalibrated signal for human review**, not a fraud percentage.

## Append-only behavior

```sql
UPDATE shield_events SET entity_id = 'HACKED' WHERE chain_position = 1;
-- ERROR: shield_events is append-only: UPDATE is not allowed
```

Details: [`docs/immutability-proof.md`](./docs/immutability-proof.md).  
`PUT /api/events` also returns **405**.

## Prototype limitations

We kindly disclose these limits so the demo is easy to judge fairly:

- Identities are taken from the request body (Auth is future work)  
- Pending approvals may reset on serverless cold start; ledger events remain in Supabase  
- SAM is localization / relevance, not forensic authentication  
- Verification is sized for a demo ledger, not a large paginated history  
- Concurrent writes rely on unique `chain_position`; there is no retry loop yet  

## Suggested demo path

1. Real motor image URL → LIVE SAM category relevance  
2. Manager approve → new chained event  
3. (Optional) `fake-invoice.png` → MOCK DEMO reject  
4. `/shield` → Chain verified · map · Muse LIVE  
5. Optional: `PUT /api/events` → 405  

Teleprompter: [`docs/demo-script.md`](./docs/demo-script.md)  
Storyboard screenshots: [`docs/demo-frames/`](./docs/demo-frames/)

## Run locally

```bash
git clone https://github.com/almona02/shield-os-hackathon
cd shield-os-hackathon
cp .env.example .env.local   # META_API_KEY + Supabase
npm install && npm run dev
```

## License

MIT — see [LICENSE](./LICENSE).

Thank you for your time and consideration.
