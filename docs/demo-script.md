# SHIELD.OS — 90s Demo Video (25% of score)

**Live URL:** https://shield-os-hackathon.vercel.app  
**Dashboard:** https://shield-os-hackathon.vercel.app/shield

## Who should do what (most accurate)

| Role | Person / tool | Job |
|---|---|---|
| **Driver** | Cursor agent (me) or a teammate | Clicks the UI + runs the curl. Never misses a beat. |
| **Narrator** | You | Read the lines below. Face optional. |
| **Recorder** | Loom (or OBS) | Capture browser window only, 1080p, mic on. |

You do **not** need to click. Start Loom → say “go” → I drive → you speak.

Alternatives if you want zero involvement:
- Teammate records while you send this doc
- Hire a Loom editor on Upwork with this exact click list ($20–40)
- I can rehearse the flow in-browser anytime; you only hit Record

---

## Click-by-click teleprompter

Open https://shield-os-hackathon.vercel.app in a **narrow** window (mobile-first).

### 0–20s — Problem (SAM rejects fake)

**Driver**
1. Role = **Technician**
2. Evidence photo → replace with `fake-invoice.png`
3. Click **Submit request**
4. Hold on the red SAM banner (`source: mock`, score ~18)

**You say**
> MENA loses roughly two trillion dollars to procurement fraud.  
> Without Shield, a manager edits the spreadsheet and the trail is gone.  
> SAM rejects this fake invoice — score eighteen. Evidence never enters the ledger.

### 20–50s — Immutable core (live SAM 3.1 + approve + 405)

**Driver**
1. Part = **Motor YLM-45 GENESIS**, Workshop = **Giza - Almona**
2. Evidence = Unsplash URL (prefilled) → **Submit request**
3. Hold banner: `source: sam_3_1` · real
4. Switch role → **Manager** → **Approve**
5. Feed bubble shows Mohamed → Ahmed.Manager
6. Terminal: `curl -X PUT https://shield-os-hackathon.vercel.app/api/events` → **405**

**You say**
> With Shield every action is hash-chained. Live SAM 3.1 accepts the real workshop photo.  
> Try to edit — the API returns 405. The Postgres trigger blocks UPDATE and DELETE.

### 50–90s — Impact

**Driver**
1. Open **Shield Dashboard** `/shield`
2. Confirm pill: **Chain verified**
3. Map shows Giza pin · Llama Risk Panel: OFF_HOURS / same-approver
4. Optional: toggle **العربية**

**You say**
> Chain verified. Llama flags off-hours approvals — high risk, English and Arabic.  
> This is extracted from Almona Vertical Reality OS — fifteen hundred commits,  
> two hundred workshops in Egypt — now generalized for any industry.  
> SHIELD.OS: who, where, when, what, approved by — immutable.

End Loom. Paste link into README under **Video**.

---

## Cutaways (optional, 2–3s each)

- `supabase/migrations/001_shield_events.sql` — `trg_shield_no_update`
- `lib/shield-core/immutable-log.ts` — `recordEvent` only
- GitHub: https://github.com/almona02/shield-os-hackathon

## Submission checklist

- [ ] Loom URL in README
- [ ] Demo URL: https://shield-os-hackathon.vercel.app
- [ ] Repo: https://github.com/almona02/shield-os-hackathon
- [ ] `META_API_KEY` set on Vercel (Llama panel shows `source: meta_llama`)
