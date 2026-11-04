# SHIELD.OS — 90s Demo Video

**Live:** https://shield-os-hackathon.vercel.app  
**Dashboard:** https://shield-os-hackathon.vercel.app/shield  

**Pitch line:** *SHIELD.OS — Tamper-Evident Approvals with Meta-Powered Risk Intelligence*

This is a **credible hackathon prototype**. Do not call it judge-proof, production-ready, or a confirmed finalist. Speak only to what is on screen.

Do **not** run `POST /api/tamper` during recording. Prefer `PUT /api/events` → **405**. Optional: pre-captured SQL screenshot from `docs/immutability-proof.md` (demo of append-only design — not a live independent audit).

---

## Do not say

- “Fraud-proof / corruption-proof / production-ready”
- “94% certainty” or “proven collusion”
- “SAM proves the photo is authentic”
- “Every audit is fixed” / “judge-proof” / score predictions
- “Chain verified = full database immutability proven”

**Do say:** signal for human review · object localization / category relevance · synthetic demo history · append-only API behavior

---

## Click-by-click teleprompter (strongest sequence)

Narrow mobile-width window. Prefer this order (consultant): **real motor → SAM → approve → verified timeline → Muse**. Mention the mock once, briefly.

### 0–40s — Live motor + SAM + approve

**Driver**
1. Home · Technician · Part **Motor YLM-45 GENESIS** · Workshop **Giza - Almona**
2. Evidence = **prefilled Pexels motor URL** → Submit  
   - Hold whatever the UI shows (e.g. **LIVE SAM 3.1 — object localization** · match · relevance **~81–91%** · `electric motor`)  
   - Say the **actual** numbers on screen — do not invent them
3. *(Optional, ≤5s)* Swap evidence to `fake-invoice.png` once → **MOCK DEMO — filename rule (not SAM)** · ~18 → then return to motor URL  
   - Or skip and only name the mock in narration
4. Manager → **Approve** (use capture GPS / workshop default)
5. Optional: `curl -X PUT …/api/events` → **405**

**You say**
> Workshop spare-part request for Motor YLM-45 in Giza.  
> Live SAM 3.1 does object localization and scores category relevance to the requested part — not forensic authenticity.  
> A manager approves; the event is hash-chained. The API rejects edits with 405.  
> *(If you showed the mock)* Separately, a deterministic filename rule rejects fake-invoice.png — that mock is not SAM.

### 40–70s — Verified timeline + map

**Driver**
1. Open `/shield`
2. **Chain verified** · curated ~10 events + your new approve · map pins  
3. Stay on the top of the timeline — do not scroll forever

**You say**
> This dashboard shows a curated synthetic demonstration ledger — Giza workshop requests and approvals — plus the live event we just added.  
> Chain verified means this history passes our hash-chain verifier. It is evidence of an inspectable audit trail, not a claim of production-complete security.

### 70–90s — Muse signals + close

**Driver**
1. Risk badge: **Source: muse-spark-1.3 | Meta Model API (LIVE)** · note `generated_at`
2. Point at disclaimer under the badge
3. Glance at findings labeled **· signal** (OFF_HOURS, SAME_APPROVER, …) — use the **score on screen** (often ~85–88)

**You say**
> Muse Spark 1.3 flags patterns such as off-hours and same-approver as signals for human review.  
> The score is an uncalibrated model signal — not a fraud probability.  
> SHIELD.OS: who, where, when, what, approved by — tamper-evident risk intelligence. Extracted from Almona Reality OS; Fabricator Pro is still in pilot.  
> Links: GitHub, live app, this video.

End Loom → paste URL into README → check GitHub / live / Loom **signed out** → submit on Cerebral Valley.

Curated seed SQL (already applied): [`docs/loom-reseed.sql`](./loom-reseed.sql)

---

## Submission checklist

- [ ] Loom URL in README (`paste before submit`)
- [ ] Live: https://shield-os-hackathon.vercel.app (opens signed out)
- [ ] Repo: https://github.com/almona02/shield-os-hackathon (public)
- [ ] Risk badge shows LIVE (not `local_heuristic`)
- [ ] Narration uses on-screen scores only
- [ ] No “production-ready” / “fraud-proof” claims in video
