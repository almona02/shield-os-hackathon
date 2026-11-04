# SHIELD.OS — Cerebral Valley / Meta Hackathon Pitch

**PROJECT TITLE**  
SHIELD.OS — Tamper-Evident Approvals with Meta-Powered Risk Intelligence

**ONE-LINER**  
A small hash-chained audit layer for workshop spare-part approvals, with Meta model risk signals meant for human review.

---

## FULL DESCRIPTION

### Background

Almona Co. has served aluminium workshops in Egypt since 1991 as an authorized YILMAZ dealer. We are building Almona Vertical Reality OS to connect machinery discovery, workshop layout, Fabricator Pro (BOM and cutting), and machine service history.

Fabricator Pro is far along in engineering (about 1,539 commits) and includes deterministic BOM and governance work, but it is still in pilot — not yet rolled out to production workshops.

For this hackathon we asked a simple question: can we isolate the governance core and show it as a clear, inspectable integrity layer?

### What we built

SHIELD.OS extracts three modules:

1. **immutable-log** — append-only ledger with `prev_hash` / `event_hash`. A Postgres trigger blocks UPDATE and DELETE. The API returns 405 for non-INSERT writes. The live demo uses Supabase.
2. **approval-chain** — ordered steps, no self-approval, distinct approvers.
3. **anomaly-engine** — flags patterns such as same-approver bursts, off-hours activity, and geo mismatch as evidence for review (not silent blocks).

### How we use Meta AI

- **Muse Spark 1.3** reviews recent events and returns a bilingual risk summary. The UI shows a LIVE badge when the Meta API responds, or a clear fallback label when it does not. The score is a signal for human review, not a fraud probability.
- **SAM 3.1** performs object localization on an image URL and scores category relevance to the requested part (for example, electric motor). It does not prove that a photo is authentic or unedited. A separate filename demo rule rejects `fake-invoice.png` and is labeled MOCK DEMO — not SAM.

### Demo walkthrough

A technician requests Motor YLM-45 with location and evidence. Live SAM reports category relevance on a real image. A manager approves. The event is hash-chained. The dashboard shows chain verification, a simple map, and Muse Spark risk signals for human review.

### Why this matters to us

We are not claiming a finished fraud-prevention product. We are showing a careful prototype: who / where / when / what / approved by, with Meta-powered signals that a person can review. Next step for us is a Giza pilot with Fabricator Pro and SHIELD.

### Honest limits of this prototype

- Identities (`createdBy` / `approver`) come from the request body; authentication is future work.
- Pending approvals may still rely on in-memory state on cold starts; the event ledger itself is stored in Supabase.
- SAM is localization and category relevance, not forensic authentication.
- Chain verification is suitable for demo scale, not yet a fully paginated large-ledger verifier.

### Links

| | |
|---|---|
| Live app | https://shield-os-hackathon.vercel.app |
| Dashboard | https://shield-os-hackathon.vercel.app/shield |
| GitHub | https://github.com/almona02/shield-os-hackathon |
| Reality OS | https://github.com/almona02/almona-portfolio-forge |
| Demo video | *(paste Loom URL)* |

**Stack:** Next.js 14, Supabase, Meta Model API (Muse Spark 1.3 + SAM 3.1), Tailwind with Arabic RTL support.

Thank you for reviewing our submission.
