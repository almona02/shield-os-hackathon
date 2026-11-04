# SHIELD.OS — Immutable Audit Layer for Reality OS

### Meta Global AI Developer Hackathon 2026 Submission

> Who, Where, When, What, Approved By — append-only, hash-chained.

| | |
|---|---|
| **Live Demo** | https://shield-os-hackathon.vercel.app |
| **Dashboard** | https://shield-os-hackathon.vercel.app/shield |
| **Video** | Record from `docs/demo-script.md` → paste Loom URL here before submit |
| **Repo** | https://github.com/almona02/shield-os-hackathon |
| **Source Reality OS** | https://github.com/almona02/almona-portfolio-forge |

---

### Context

Almona Co. is an authorized YILMAZ dealer in Egypt, established 1991, with long-standing market access to aluminium and UPVC workshops.

Over the last year, we built **Almona Vertical Reality OS** — an open workspace that connects machinery discovery, workshop planning, Fabricator Pro (measurement, BOM, cutting optimization), and machine passport/service tickets.

Fabricator Pro itself is technically complete (**1,539 commits**) but is still in pre-deployment / pilot phase. It has not yet been rolled out to production workshops. SHIELD.OS extracts its governance core so it can be validated independently.

### Problem

In workshop operations, approvals for spare parts, service, and procurement are often logged in editable sheets. This allows after-the-fact edits and weakens trust. Traditional GRC systems (SAP GRC, Oracle Risk) are designed for enterprise reporting, not for lightweight, real-time prevention on the shop floor.

### Solution

SHIELD.OS isolates three modules from Reality OS into a minimal, reusable layer:

1. **immutable-log.ts** — from `realityos_core/event_ledger.py` + `chain_verifier.py`
2. **approval-chain.ts** — from `ManufacturingAuthorityResolver.ts` + `vertical_registry.py`
3. **anomaly-engine.ts** — from `fraud_detector.py` + `anomaly_rule.py`

### Architecture

```
Action → Log (immutable) → Meta Model Check → Approval
```

### Meta AI Integration (one truth)

| Tool | Usage | What judges see |
|------|-------|-----------------|
| **Muse Spark 1.3** via Meta Model API | `lib/llama.ts` → `/api/risk` scores last 50 events (EN/AR) | Badge: `Source: muse-spark-1.3 \| Meta Model API (LIVE)` — or explicit `local_heuristic (fallback — reason)` |
| **SAM 3.1** | `lib/sam.ts` — https/data URLs proxied as base64 to Meta Responses API | Badge: `LIVE SAM 3.1 — N detections` |
| **SAM mock** | Filename-only demo (`fake-invoice.png`) | Badge: `MOCK DEMO — filename rule for stable demo` |
| **Muse Code** | Core extraction from Reality OS | Git history |

> Honest note: Meta’s public Llama API (`api.llama.com`) returned 401 for this project key (preview shut down). Risk scoring uses Meta’s current Model API chat model **`muse-spark-1.3`** on `https://api.meta.ai/v1/chat/completions` with the same Bearer key as SAM 3.1. Network tab shows `POST api.meta.ai` → 200 JSON.

SAM: mocked for filename demo, live for https URLs via base64 proxy — see Loom when available.

### Prove immutability (DB, not just UI)

```sql
-- Supabase SQL editor
UPDATE shield_events SET entity_id = 'HACKED' WHERE chain_position = 1;
```

```text
ERROR:  25001: shield_events is append-only: UPDATE is not allowed
CONTEXT:  PL/pgSQL function shield_block_mutation() line 3 at RAISE
```

Full repro: [`docs/immutability-proof.md`](./docs/immutability-proof.md). Also `PUT /api/events` → 405 and `POST /api/tamper` → trigger message.

### Demo

1. `/` Technician + `fake-invoice.png` → **MOCK DEMO** reject (~18)
2. Paste https image URL → **LIVE SAM 3.1** accept
3. Manager Approve → chained event
4. `/shield` → Chain verified · map · Risk badge **LIVE** Muse Spark
5. Show Network: `POST /api/risk` and Meta upstream 200

### How to Run

```bash
git clone https://github.com/almona02/shield-os-hackathon
cd shield-os-hackathon
cp .env.example .env.local
# META_API_KEY + NEXT_PUBLIC_SUPABASE_URL + SUPABASE_ANON_KEY
npm install
npm run dev
```

Production ledger: Supabase `001_shield_events.sql`.

### What This Proves

The governance layer of Reality OS can stand alone as a general integrity layer. SHIELD.OS is that validation — small, testable, deployable separately.

### Next Steps

- Pilot Fabricator Pro + SHIELD in 2–3 workshops in Giza
- Harden SAM prompts per part SKU

### License

MIT — see [LICENSE](./LICENSE).
