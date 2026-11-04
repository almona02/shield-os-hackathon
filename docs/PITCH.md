# SHIELD.OS — Hackathon Pitch

**PROJECT TITLE:**  
SHIELD.OS — Tamper-Evident Approvals with Meta-Powered Risk Intelligence

**ONE-LINER:**  
A lightweight, hash-chained audit layer extracted from our Vertical Reality OS — tamper-evident workshop approvals with Meta-powered risk signals for human review.

---

## FULL DESCRIPTION

### Background

Almona Co. has served aluminium workshops in Egypt since 1991 as an authorized YILMAZ dealer. With that market access, we built Almona Vertical Reality OS to connect machinery discovery, workshop layout, Fabricator Pro (BOM, cutting optimization), and machine service history.

Fabricator Pro is complete from an engineering perspective (**1,539 commits**) and includes deterministic BOM and AICS governance, but it is still new and in pilot phase — not yet deployed to production workshops.

For the hackathon, we focused on one technical question: can its governance core be isolated and reused as a general integrity layer?

### What we built

SHIELD.OS extracts three modules:

1. **immutable-log.ts** — append-only ledger with `prev_hash` / `event_hash`. Postgres trigger blocks UPDATE/DELETE. API returns **405** for non-INSERT. Production uses Supabase.

2. **approval-chain.ts** — no self-approval, distinct approvers, frozen transitions.

3. **anomaly-engine.ts** — flags same-approver bursts, off-hours, geo mismatch, impossible travel (evidence-only).

### Meta AI usage

- **Muse Spark 1.3** (`lib/llama.ts`) scores last 50 events (0–100, EN/AR). Badge shows LIVE or labeled fallback. Score = signal for human review, not fraud probability.
- **SAM 3.1** (`lib/sam.ts`) does category object localization on https URLs (relevance to requested part). Filename `fake-invoice.png` is an explicit **MOCK DEMO** rule — not SAM.
- **Muse Code** used for core extraction — visible in git history.

### Demo

Technician requests Motor YLM-45 with geo + evidence. Mock rule rejects `fake-invoice.png`. Live SAM scores category relevance on a real image URL (mismatch if objects ≠ motor). Manager approves. PUT is blocked. `/shield` shows verified chain, map, and Muse Spark LIVE risk signals.

### Why it matters

Rather than claiming production fraud prevention or authenticated governance, we show a technical validation: tamper-evident Who/Where/When/Approved-By with Meta-powered risk intelligence for human review. Next: Giza pilot with Fabricator Pro + SHIELD.

### Prototype limitations

- Identity: `createdBy` / `approver` from request body (no Auth yet)  
- Approvals: in-memory Map (ledger remains durable in Supabase)  
- SAM: localization / category relevance — not forensic authentication  
- Ledger verify: demo-scale single query  

### Links

| | |
|---|---|
| Live | https://shield-os-hackathon.vercel.app |
| Dashboard | https://shield-os-hackathon.vercel.app/shield |
| GitHub | https://github.com/almona02/shield-os-hackathon |
| Reality OS | https://github.com/almona02/almona-portfolio-forge |
| Video | *(paste Loom)* |

**Tech:** Next.js 14, Supabase, Meta Model API (Muse Spark 1.3 + SAM 3.1), Tailwind with RTL support.
