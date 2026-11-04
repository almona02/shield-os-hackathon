# SHIELD.OS — Hackathon Pitch

**PROJECT TITLE:**  
SHIELD.OS — Immutable Audit Layer Extracted from Reality OS

**ONE-LINER:**  
A lightweight, hash-chained audit layer extracted from our Vertical Reality OS — designed to make workshop approvals tamper-evident.

---

## FULL DESCRIPTION

### Background

Almona Co. has served aluminium workshops in Egypt since 1991 as an authorized YILMAZ dealer. With that market access, we built Almona Vertical Reality OS to connect machinery discovery, workshop layout, Fabricator Pro (BOM, cutting optimization), and machine service history.

Fabricator Pro is complete from an engineering perspective (**1,539 commits**) and includes deterministic BOM and AICS governance, but it is still new and in pilot phase — not yet deployed to production workshops.

For the hackathon, we focused on one technical question: can its governance core be isolated and reused as a general anti-corruption layer?

### What we built

SHIELD.OS extracts three modules:

1. **immutable-log.ts** — append-only ledger where each event stores `prev_hash` and `event_hash`. Enforced by Postgres RLS (deny UPDATE/DELETE) and a trigger that raises on tampering. API returns **405** for non-INSERT methods. **Production runs on Supabase** (`supabase/migrations/001_shield_events.sql`).

2. **approval-chain.ts** — no self-approval, distinct approvers, frozen transitions.

3. **anomaly-engine.ts** — flags same-approver rapid approvals, off-hours, geo mismatch, impossible travel.

### Meta AI usage

- **Muse Spark 1.3** (`lib/llama.ts`) on Meta Model API scores last 50 events for risk (0–100) with bilingual EN/AR. UI badge shows `LIVE` or explicit `local_heuristic (fallback — reason)`. (Llama public API preview is shut down; Muse Spark is Meta’s current chat endpoint for this key.)
- **SAM 3.1** (`lib/sam.ts`) verifies https evidence via Responses API (base64 proxy). Filename `fake-invoice.png` uses a labeled **MOCK DEMO** path for stable Loom beats.
- **Muse Code** was used for the core extraction — visible in git history.

### Demo

Technician requests Motor YLM-45 GENESIS with geo + evidence. Submitting `fake-invoice.png` is rejected. Pasting a real image URL hits live SAM 3.1. Manager approves. Any attempt to edit via PUT is blocked. `/shield` shows hash chain verification, map pins, and Llama risk panel (including off-hours flags).

### Why it matters

Rather than claiming large-scale deployment, we are showing a technical validation: a small, auditable layer that can be embedded in any workflow where Who / Where / When / Approved By must be provable. Our next step is to pilot it alongside Fabricator Pro in Giza.

### Links

| | |
|---|---|
| Live | https://shield-os-hackathon.vercel.app |
| Dashboard | https://shield-os-hackathon.vercel.app/shield |
| GitHub | https://github.com/almona02/shield-os-hackathon |
| Reality OS | https://github.com/almona02/almona-portfolio-forge |
| Video | *(paste Loom)* |

**Tech:** Next.js 14, Supabase, Meta Model API (Llama 4 + SAM 3.1), Tailwind with RTL support.
