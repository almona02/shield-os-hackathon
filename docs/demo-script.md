# SHIELD.OS — 90-second demo script

**Live:** https://shield-os-hackathon.vercel.app  
**Dashboard:** https://shield-os-hackathon.vercel.app/shield  

**Opening line:**  
*SHIELD.OS — tamper-evident approvals with Meta-powered risk intelligence for human review.*

Please speak only to what appears on screen. This is a careful hackathon prototype, not a finished production product.

Avoid `POST /api/tamper` while recording. Prefer `PUT /api/events` → **405**. An optional SQL screenshot from [`immutability-proof.md`](./immutability-proof.md) may help illustrate append-only design.

Storyboard images: [`demo-frames/SEQUENCE.md`](./demo-frames/SEQUENCE.md)

---

## Gentle wording guide

Prefer:

- “signal for human review”  
- “object localization / category relevance”  
- “synthetic demonstration history”  
- “the API rejects edits with 405”

Please avoid:

- fraud-proof / production-ready / judge-proof  
- “proven collusion” or percent certainty of fraud  
- “SAM proves the photo is authentic”  
- “chain verified proves full database immutability”

---

## Suggested sequence

Narrow the window. Preferred order: **motor image → SAM → approve → timeline → Muse**. Mention the mock briefly if you show it.

### 0–40s — Request, SAM, approve

**Steps**
1. Home · Technician · Motor YLM-45 GENESIS · Giza - Almona  
2. Submit the prefilled motor image URL  
3. Read the LIVE SAM badge and the relevance % shown on screen  
4. Optional: briefly try `fake-invoice.png` (MOCK DEMO filename rule), then return to the motor URL  
5. Switch to Manager · Approve  
6. Optional: show `PUT /api/events` → 405  

**Suggested narration**
> This is a spare-part request for Motor YLM-45 in our Giza workshop.  
> Live SAM 3.1 localizes objects and scores relevance to the requested part — not forensic authenticity.  
> A manager approves, and the event is added to the hash chain. The API returns 405 if we try to edit.  
> *(If mock was shown)* The fake-invoice name is rejected by a simple demo rule — that path is not SAM.

### 40–70s — Timeline and map

**Steps**
1. Open `/shield`  
2. Note **Chain verified**, the timeline, and the map  
3. Stay near the top of the list  

**Suggested narration**
> This dashboard shows a curated demonstration ledger for a Giza workshop, plus the live events we just created.  
> Chain verified means this history passes our hash-chain check. It is an inspectable audit trail for the demo — not a claim of finished production security.

### 70–90s — Muse and close

**Steps**
1. Point to **muse-spark-1.3 | Meta Model API (LIVE)** and `generated_at`  
2. Point to the disclaimer under the badge  
3. Briefly mention findings labeled as signals; use the score on screen  

**Suggested narration**
> Muse Spark highlights patterns such as off-hours and same-approver activity as signals for human review.  
> The score is an uncalibrated model signal — not a fraud probability.  
> SHIELD.OS records who, where, when, what, and who approved. It is extracted from Almona Reality OS; Fabricator Pro is still in pilot.  
> Links are in the README: GitHub, live app, and this video. Thank you.

When finished: paste the Loom URL into the README, check all links signed out, then submit on Cerebral Valley.

---

## Quick checklist

- [ ] Loom URL in README  
- [ ] Live app opens signed out  
- [ ] GitHub is public  
- [ ] Narration matches on-screen scores  
- [ ] Calm, accurate claims only  
