# SHIELD.OS — Tamper-Evident Approvals with Meta-Powered Risk Intelligence

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

Almona Co. is an authorized YILMAZ dealer in Egypt (est. 1991). We built **Almona Vertical Reality OS** connecting machinery discovery, workshop planning, Fabricator Pro (BOM / cutting), and machine service history.

Fabricator Pro is engineering-complete (**1,539 commits**) but still in **pilot / pre-deployment** — not rolled out to production workshops. SHIELD.OS extracts the governance core so it can be validated independently.

### Problem

Workshop spare-part and service approvals often live in editable sheets. After-the-fact edits weaken trust. Enterprise GRC tools are heavy for shop-floor prevention.

### Solution

Three extracted modules:

1. **immutable-log.ts** — hash-chained append-only ledger  
2. **approval-chain.ts** — ordered approvals, no self-approval, no override  
3. **anomaly-engine.ts** — evidence-only risk signals (never silent blocks)

```
Action → Log (immutable) → Meta Model Check → Approval
```

### Meta AI Integration (one truth)

| Tool | Behavior | Judge-facing badge |
|------|----------|--------------------|
| **Muse Spark 1.3** | `/api/risk` analyzes last 50 events (EN/AR) | `Source: muse-spark-1.3 \| Meta Model API (LIVE)` or labeled `local_heuristic (fallback — reason)` |
| **SAM 3.1** | Category object localization on https/data URLs | `LIVE SAM 3.1 — object localization` + relevance % to requested part |
| **Filename mock** | `fake-invoice.png` etc. | `MOCK DEMO — filename rule (not SAM)` |

SAM scores **visual category relevance** (e.g. “electric motor”), not authenticity, freshness, or anti-forgery. Detecting a person does **not** satisfy a motor request (mismatch ~35%).

Risk score is an **uncalibrated model signal for human review** — not a fraud probability.

### Prove immutability (DB)

```sql
UPDATE shield_events SET entity_id = 'HACKED' WHERE chain_position = 1;
-- ERROR: shield_events is append-only: UPDATE is not allowed
```

See [`docs/immutability-proof.md`](./docs/immutability-proof.md). Also `PUT /api/events` → 405.

### Prototype limitations (disclosed)

- **Identity:** `createdBy` / `approver` come from the request body — no Supabase Auth binding yet  
- **Approvals Map:** in-memory on the server; may reset on serverless cold start (ledger events remain durable in Supabase)  
- **SAM:** object localization / category relevance — not forensic image authentication  
- **Ledger verify:** single query (fine for demo scale; not claimed as paginated full-history at 1000+ rows)  
- **Concurrency:** unique `chain_position` rejects races; no transactional retry loop yet  

### Demo

1. `fake-invoice.png` → **MOCK DEMO** reject (simulated rule)  
2. https machinery image → **LIVE SAM 3.1** category relevance  
3. Manager approve → chained event  
4. `/shield` → Chain verified · map · Muse Spark **LIVE** + `generated_at`  
5. Optional: Supabase UPDATE error screenshot  

Script: [`docs/demo-script.md`](./docs/demo-script.md)

### How to Run

```bash
git clone https://github.com/almona02/shield-os-hackathon
cd shield-os-hackathon
cp .env.example .env.local   # META_API_KEY + Supabase
npm install && npm run dev
```

### License

MIT — see [LICENSE](./LICENSE).
